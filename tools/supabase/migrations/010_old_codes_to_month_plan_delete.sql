-- Owner, 13 Nov 2026 (admin app): "shift all the old codes to students with a new-style subscription, starting them on 1 month";
-- "change of the subscription type does not work"; "no delete option"; "the receipt picture should be optional".
-- Written to be run more than once safely (create or replace).

-- 1. Change the type of a subscription: Monthly / Annual from today, Lifetime with no end.
create or replace function obs_admin_plan(p_code text, p_plan text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  if p_plan not in ('month', 'year', 'life') then raise exception 'plan'; end if;
  update obs_codes set plan = p_plan, active = true,
    expires = case p_plan when 'month' then now() + interval '1 month' when 'year' then now() + interval '1 year' else null end
  where code = p_code;
end $$;
revoke all on function obs_admin_plan(text, text) from public;
grant execute on function obs_admin_plan(text, text) to authenticated;

-- 2. Delete a code completely (its devices, link numbers and synced notes go with it).
create or replace function obs_admin_delete(p_code text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  delete from obs_sync where code = p_code;
  delete from obs_codes where code = p_code;
end $$;
revoke all on function obs_admin_delete(text) from public;
grant execute on function obs_admin_delete(text) to authenticated;

-- 3. Old codes of a book that are in use become new-style Monthly subscriptions ending one month from now. Their devices, key and
--    synced notes stay as they are; unused old codes stay old codes. Answers how many were changed.
create or replace function obs_admin_old_to_month(p_book text) returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  update obs_codes set plan = 'month', expires = now() + interval '1 month', maxdev = greatest(coalesce(maxdev, 2), 3)
  where book = p_book and active and activated_at is not null and coalesce(plan, 'old') = 'old';
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function obs_admin_old_to_month(text) from public;
grant execute on function obs_admin_old_to_month(text) to authenticated;

-- 4. An old code of Surgery or Pediatrics (kept on that book's own server) copied into the shared system. A code that was activated
--    becomes a Monthly subscription ending one month from now; an unused one stays an old code until 12 Dec 2026. The student's device
--    joins it by itself the next time the app opens (it knows its old code), and its notes come with it from the device.
create or replace function obs_admin_import_old(p_book text, p_code text, p_note text, p_maxdev integer, p_active boolean, p_used boolean) returns text
language plpgsql security definer set search_path = public as $$
declare cd text := upper(trim(p_code));
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  if p_book not in ('srg', 'ped') or cd !~ '^(SMR|PMR)-[A-Z0-9]{4}-[A-Z0-9]{4}$' then return 'bad'; end if;
  if exists (select 1 from obs_codes where code = cd) then
    if p_used then
      update obs_codes set plan = 'month', expires = now() + interval '1 month' where code = cd and coalesce(plan, 'old') = 'old';
    end if;
    return 'there';
  end if;
  insert into obs_codes(code, note, plan, expires, activated_at, maxdev, book, active)
  values (cd, left(coalesce(p_note, ''), 200), case when p_used then 'month' else 'old' end,
          case when p_used then now() + interval '1 month' else timestamptz '2026-12-12 23:59:59+02' end,
          null, greatest(least(coalesce(p_maxdev, 3), 10), 3), p_book, coalesce(p_active, true));
  return 'added';
end $$;
revoke all on function obs_admin_import_old(text, text, text, integer, boolean, boolean) from public;
grant execute on function obs_admin_import_old(text, text, text, integer, boolean, boolean) to authenticated;

-- 5. The receipt picture is optional: a request without one is accepted; the owner sees "No receipt" and decides.
create or replace function obs_request_submit(p_dev text, p_kind text, p_label text, p_name text, p_phone text, p_plan text,
  p_comment text, p_mime text, p_data text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare rid uuid; has boolean := length(coalesce(p_data, '')) > 0;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  if p_plan not in ('month', 'year', 'life', 'device') then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  if length(trim(coalesce(p_name, ''))) < 2 or length(p_name) > 60 then return jsonb_build_object('ok', false, 'reason', 'name'); end if;
  if coalesce(p_phone, '') !~ '^[0-9+ ]{7,20}$' then return jsonb_build_object('ok', false, 'reason', 'phone'); end if;
  if p_plan <> 'device' and has then
    if p_mime not in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf') then return jsonb_build_object('ok', false, 'reason', 'file'); end if;
    if length(p_data) < 200 or length(p_data) > 2000000 then return jsonb_build_object('ok', false, 'reason', 'file'); end if;
  end if;
  if exists (select 1 from obs_requests where dev = p_dev and status = 'pending') then return jsonb_build_object('ok', false, 'reason', 'pending'); end if;
  if (select count(*) from obs_requests where dev = p_dev and created > now() - interval '1 day') >= 8 then return jsonb_build_object('ok', false, 'reason', 'many'); end if;
  if (select count(*) from obs_requests where status = 'pending') >= 500 then return jsonb_build_object('ok', false, 'reason', 'busy'); end if;
  insert into obs_requests(dev, kind, label, name, phone, plan, comment)
    values (p_dev, case when p_kind = 'phone' then 'phone' else 'pc' end, left(p_label, 60), trim(p_name), trim(p_phone), p_plan, left(coalesce(p_comment, ''), 500))
    returning id into rid;
  if p_plan <> 'device' and has then insert into obs_receipts(req, mime, data) values (rid, p_mime, p_data); end if;
  return jsonb_build_object('ok', true, 'id', rid);
end $$;

notify pgrst, 'reload schema';
