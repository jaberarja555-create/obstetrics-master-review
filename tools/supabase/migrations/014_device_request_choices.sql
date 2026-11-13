-- Owner, 13 Nov 2026: a student asked «مشترك على جهاز آخر» with a phone number that no subscription of that book carries, and «Approve»
-- only said "No active subscription has this phone number". Now the owner can (a) tie the device to a subscription he picks himself,
-- or (b) give the device a new subscription of its own. Phone numbers are also found anywhere in the note (old codes had no «·»).
-- Written to be run more than once safely.

-- the subscription of a book that carries a phone number (last 9 digits), wherever the number stands in the note
create or replace function obs_code_by_phone(p_book text, p_phone text) returns text
language sql stable security definer set search_path = public as $$
  select code from obs_codes
   where book = p_book and active and (expires is null or expires > now()) and coalesce(plan, '') <> 'old'
     and obs_phone9(p_phone) is not null and length(obs_phone9(p_phone)) >= 7
     and (obs_phone9(split_part(coalesce(note, ''), '·', 2)) = obs_phone9(p_phone)
          or position(obs_phone9(p_phone) in regexp_replace(coalesce(note, ''), '[^0-9]', '', 'g')) > 0)
   order by created_at desc limit 1 $$;
revoke all on function obs_code_by_phone(text, text) from public, anon, authenticated;

-- tie the device of a request to a subscription (the device count is raised when the subscription is full)
create or replace function obs_req_bind(r obs_requests, cd text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not obs_bind(cd, r.dev, r.kind, r.label) then
    update obs_codes set maxdev = least(10, (case when phone_dev is not null then 1 else 0 end) + (case when pc_dev is not null then 1 else 0 end)
      + (select count(*) from obs_devices where code = cd) + 1) where code = cd;
    if not obs_bind(cd, r.dev, r.kind, r.label) then return jsonb_build_object('ok', false, 'reason', 'full', 'code', cd); end if;
  end if;
  update obs_requests set status = 'approved', decided = now(), code = cd where id = r.id;
  return jsonb_build_object('ok', true, 'code', cd);
end $$;
revoke all on function obs_req_bind(obs_requests, text) from public, anon, authenticated;

-- approve / reject. A device request with a plan (month, year, life) becomes a new subscription for that device.
create or replace function obs_admin_decide(p_id uuid, p_ok boolean, p_name text, p_plan text, p_reason text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r obs_requests; g jsonb; cd text; pl text;
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  select * into r from obs_requests where id = p_id for update;
  if not found or r.status <> 'pending' then return jsonb_build_object('ok', false, 'reason', 'done'); end if;
  if not p_ok then
    update obs_requests set status = 'rejected', reason = left(coalesce(p_reason, ''), 300), decided = now() where id = p_id;
    return jsonb_build_object('ok', true);
  end if;
  pl := case when coalesce(p_plan, '') in ('month', 'year', 'life') then p_plan else r.plan end;
  if pl = 'device' then
    cd := obs_code_by_phone(coalesce(r.book, 'obs'), r.phone);
    if cd is null then return jsonb_build_object('ok', false, 'reason', 'nosub'); end if;
    return obs_req_bind(r, cd);
  end if;
  g := obs_grant(r.dev, r.kind, r.label, coalesce(nullif(trim(p_name), ''), r.name), r.phone, pl);
  if not (g->>'ok')::boolean then return g; end if;
  update obs_requests set status = 'approved', decided = now(), code = g->>'code', plan = pl,
    name = coalesce(nullif(trim(p_name), ''), r.name) where id = p_id;
  return g;
end $$;

-- the owner ties the device of a waiting request to a subscription he chose (same book only, so the right book opens)
create or replace function obs_admin_link(p_id uuid, p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r obs_requests; c obs_codes;
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  select * into r from obs_requests where id = p_id for update;
  if not found or r.status <> 'pending' then return jsonb_build_object('ok', false, 'reason', 'done'); end if;
  select * into c from obs_codes where code = p_code;
  if not found then return jsonb_build_object('ok', false, 'reason', 'nocode'); end if;
  if coalesce(c.book, 'obs') <> coalesce(r.book, 'obs') then return jsonb_build_object('ok', false, 'reason', 'book'); end if;
  return obs_req_bind(r, p_code);
end $$;

revoke all on function obs_admin_link(uuid, text) from public;
grant execute on function obs_admin_link(uuid, text) to authenticated;
grant execute on function obs_admin_decide(uuid, boolean, text, text, text) to authenticated;

notify pgrst, 'reload schema';
