-- A subscription opens several devices: phone, tablet and computer (owner, 10 Nov 2026). New subscriptions get 3 devices; the owner
-- changes the number per subscription in the admin app (obs_admin_maxdev, 1–10). A second device joins with no code: in the app the
-- student chooses "I am subscribed on another device" and writes the phone number of the subscription; the owner approves the request
-- (plan = 'device', no receipt) and the device is tied to the same subscription, so notes and progress are shared.

create or replace function obs_phone9(p text) returns text
language sql immutable as $$ select nullif(right(regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g'), 9), '') $$;

-- tie a device to a code (phone slot, computer slot, then extra devices); false when the code has no place left
create or replace function obs_bind(p_code text, p_dev text, p_kind text, p_label text) returns boolean
language plpgsql security definer set search_path = public as $$
declare c obs_codes; used int;
begin
  select * into c from obs_codes where code = p_code for update;
  if not found then return false; end if;
  if c.phone_dev = p_dev or c.pc_dev = p_dev or exists (select 1 from obs_devices where dev = p_dev and code = p_code) then return true; end if;
  used := (case when c.phone_dev is not null then 1 else 0 end) + (case when c.pc_dev is not null then 1 else 0 end)
          + (select count(*) from obs_devices where code = p_code);
  if used >= greatest(coalesce(c.maxdev, 2), 1) then return false; end if;
  delete from obs_devices where dev = p_dev;
  update obs_codes set phone_dev = null, phone_label = null, phone_since = null, phone_last = null where phone_dev = p_dev;
  update obs_codes set pc_dev = null, pc_label = null, pc_since = null, pc_last = null where pc_dev = p_dev;
  if p_kind = 'phone' and c.phone_dev is null then
    update obs_codes set phone_dev = p_dev, phone_label = left(p_label, 60), phone_since = now(), phone_last = now() where code = p_code;
  elsif p_kind <> 'phone' and c.pc_dev is null then
    update obs_codes set pc_dev = p_dev, pc_label = left(p_label, 60), pc_since = now(), pc_last = now() where code = p_code;
  else
    insert into obs_devices (dev, code, kind, label, last) values (p_dev, p_code, case when p_kind = 'phone' then 'phone' else 'pc' end, left(p_label, 60), now());
  end if;
  update obs_codes set activated_at = coalesce(activated_at, now()) where code = p_code;
  return true;
end $$;
revoke all on function obs_bind(text, text, text, text) from public, anon, authenticated;

create or replace function obs_grant(p_dev text, p_kind text, p_label text, p_name text, p_phone text, p_plan text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  cd text; c obs_codes; ex timestamptz; nt text;
  a text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; j int; b bytea; s text;
begin
  if p_plan not in ('month', 'year', 'life') then return jsonb_build_object('ok', false, 'reason', 'plan'); end if;
  nt := left(trim(coalesce(p_name, '')) || case when coalesce(p_phone, '') <> '' then ' · ' || trim(p_phone) else '' end, 200);
  cd := obs_code_of(p_dev);
  if cd is null then
    loop
      b := uuid_send(gen_random_uuid()); s := 'OBS-';
      for j in 0 .. 7 loop
        s := s || substr(a, (get_byte(b, j) % 32) + 1, 1);
        if j = 3 then s := s || '-'; end if;
      end loop;
      exit when not exists (select 1 from obs_codes where code = s);
    end loop;
    ex := case p_plan when 'month' then now() + interval '1 month' when 'year' then now() + interval '1 year' else null end;
    insert into obs_codes(code, note, plan, expires, activated_at, maxdev) values (s, nt, p_plan, ex, now(), 3);
    perform obs_bind(s, p_dev, p_kind, p_label);
    cd := s;
  else
    select * into c from obs_codes where code = cd for update;
    if c.active and c.expires is null and c.plan is not null then
      ex := null;                                   -- a lifetime subscription stays as it is
    else
      ex := case p_plan when 'life' then null
            when 'month' then greatest(coalesce(c.expires, now()), now()) + interval '1 month'
            else greatest(coalesce(c.expires, now()), now()) + interval '1 year' end;
    end if;
    update obs_codes set active = true, expires = ex,
      plan = case when c.active and c.expires is null and c.plan is not null then c.plan else p_plan end,
      note = case when coalesce(note, '') = '' then nt else note end where code = cd;
  end if;
  return jsonb_build_object('ok', true, 'code', cd, 'exp', ex);
end $$;
revoke all on function obs_grant(text, text, text, text, text, text) from public, anon, authenticated;

-- the app: a subscription request with the receipt, or (plan = 'device') a request to add this device to an existing subscription
create or replace function obs_request_submit(p_dev text, p_kind text, p_label text, p_name text, p_phone text, p_plan text,
  p_comment text, p_mime text, p_data text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare rid uuid;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  if p_plan not in ('month', 'year', 'life', 'device') then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  if length(trim(coalesce(p_name, ''))) < 2 or length(p_name) > 60 then return jsonb_build_object('ok', false, 'reason', 'name'); end if;
  if coalesce(p_phone, '') !~ '^[0-9+ ]{7,20}$' then return jsonb_build_object('ok', false, 'reason', 'phone'); end if;
  if p_plan <> 'device' then
    if p_mime not in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf') then return jsonb_build_object('ok', false, 'reason', 'file'); end if;
    if length(coalesce(p_data, '')) < 200 or length(p_data) > 2000000 then return jsonb_build_object('ok', false, 'reason', 'file'); end if;
  end if;
  if exists (select 1 from obs_requests where dev = p_dev and status = 'pending') then return jsonb_build_object('ok', false, 'reason', 'pending'); end if;
  if (select count(*) from obs_requests where dev = p_dev and created > now() - interval '1 day') >= 5 then return jsonb_build_object('ok', false, 'reason', 'many'); end if;
  if (select count(*) from obs_requests where status = 'pending') >= 500 then return jsonb_build_object('ok', false, 'reason', 'busy'); end if;
  insert into obs_requests(dev, kind, label, name, phone, plan, comment)
    values (p_dev, case when p_kind = 'phone' then 'phone' else 'pc' end, left(p_label, 60), trim(p_name), trim(p_phone), p_plan, left(coalesce(p_comment, ''), 500))
    returning id into rid;
  if p_plan <> 'device' then insert into obs_receipts(req, mime, data) values (rid, p_mime, p_data); end if;
  return jsonb_build_object('ok', true, 'id', rid);
end $$;

create or replace function obs_admin_decide(p_id uuid, p_ok boolean, p_name text, p_plan text, p_reason text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r obs_requests; g jsonb; cd text;
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  select * into r from obs_requests where id = p_id for update;
  if not found or r.status <> 'pending' then return jsonb_build_object('ok', false, 'reason', 'done'); end if;
  if not p_ok then
    update obs_requests set status = 'rejected', reason = left(coalesce(p_reason, ''), 300), decided = now() where id = p_id;
    return jsonb_build_object('ok', true);
  end if;
  if r.plan = 'device' then
    -- the subscription that carries this phone number (on and not ended)
    select code into cd from obs_codes where active and (expires is null or expires > now()) and obs_phone9(r.phone) is not null
      and obs_phone9(split_part(note, '·', 2)) = obs_phone9(r.phone) order by created_at desc limit 1;
    if cd is null then return jsonb_build_object('ok', false, 'reason', 'nosub'); end if;
    if not obs_bind(cd, r.dev, r.kind, r.label) then return jsonb_build_object('ok', false, 'reason', 'full', 'code', cd); end if;
    update obs_requests set status = 'approved', decided = now(), code = cd where id = p_id;
    return jsonb_build_object('ok', true, 'code', cd);
  end if;
  g := obs_grant(r.dev, r.kind, r.label, coalesce(nullif(trim(p_name), ''), r.name), r.phone, coalesce(nullif(p_plan, ''), r.plan));
  if not (g->>'ok')::boolean then return g; end if;
  update obs_requests set status = 'approved', decided = now(), code = g->>'code', plan = coalesce(nullif(p_plan, ''), r.plan),
    name = coalesce(nullif(trim(p_name), ''), r.name) where id = p_id;
  return g;
end $$;
