-- The student may change or cancel a request that is still waiting (owner, 10 Nov 2026: they may make a mistake or change their mind).
alter table obs_requests add column if not exists edited timestamptz;

-- change the waiting request of this device: plan, name, phone, comment; a new receipt only when one is sent
create or replace function obs_request_update(p_dev text, p_name text, p_phone text, p_plan text, p_comment text, p_mime text, p_data text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r obs_requests;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  select * into r from obs_requests where dev = p_dev and status = 'pending' order by created desc limit 1 for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'none'); end if;
  if r.plan = 'device' or p_plan not in ('month', 'year', 'life') then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  if length(trim(coalesce(p_name, ''))) < 2 or length(p_name) > 60 then return jsonb_build_object('ok', false, 'reason', 'name'); end if;
  if coalesce(p_phone, '') !~ '^[0-9+ ]{7,20}$' then return jsonb_build_object('ok', false, 'reason', 'phone'); end if;
  if coalesce(r.edited, r.created) > now() - interval '5 seconds' then return jsonb_build_object('ok', false, 'reason', 'wait'); end if;
  if p_data is not null then
    if p_mime not in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf') or length(p_data) < 200 or length(p_data) > 2000000 then
      return jsonb_build_object('ok', false, 'reason', 'file'); end if;
    insert into obs_receipts(req, mime, data) values (r.id, p_mime, p_data) on conflict (req) do update set mime = excluded.mime, data = excluded.data;
  end if;
  update obs_requests set name = trim(p_name), phone = trim(p_phone), plan = p_plan, comment = left(coalesce(p_comment, ''), 500), edited = now() where id = r.id;
  return jsonb_build_object('ok', true);
end $$;

-- cancel the waiting request of this device (the receipt is removed)
create or replace function obs_request_cancel(p_dev text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare rid uuid;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  select id into rid from obs_requests where dev = p_dev and status = 'pending' order by created desc limit 1 for update;
  if rid is null then return jsonb_build_object('ok', false, 'reason', 'none'); end if;
  update obs_requests set status = 'cancelled', decided = now() where id = rid;
  delete from obs_receipts where req = rid;
  return jsonb_build_object('ok', true);
end $$;

-- a cancelled request counts in the daily limit, so the limit is 8 a day
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
  if (select count(*) from obs_requests where dev = p_dev and created > now() - interval '1 day') >= 8 then return jsonb_build_object('ok', false, 'reason', 'many'); end if;
  if (select count(*) from obs_requests where status = 'pending') >= 500 then return jsonb_build_object('ok', false, 'reason', 'busy'); end if;
  insert into obs_requests(dev, kind, label, name, phone, plan, comment)
    values (p_dev, case when p_kind = 'phone' then 'phone' else 'pc' end, left(p_label, 60), trim(p_name), trim(p_phone), p_plan, left(coalesce(p_comment, ''), 500))
    returning id into rid;
  if p_plan <> 'device' then insert into obs_receipts(req, mime, data) values (rid, p_mime, p_data); end if;
  return jsonb_build_object('ok', true, 'id', rid);
end $$;

