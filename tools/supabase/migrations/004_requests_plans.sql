-- Subscription without sending codes (owner, 10 Nov 2026).
-- The student chooses a plan in the app, uploads the transfer receipt and sends a request; the owner sees it in the admin app,
-- approves, and the student's device opens by itself (the device asks obs_request_status / obs_check). The owner can also give a
-- subscription with no receipt (free) from the student's user number. Plans: month, year, life. A plan that ends locks the device;
-- the student's code and synced notes stay, and a new approval renews the same code, so nothing is lost.
-- Everything here is additive: old codes have expires = null (never end) and the old app keeps working.

alter table obs_codes add column if not exists expires timestamptz;
alter table obs_codes add column if not exists plan text;

-- devices that opened the app (so the owner can find a device from the short user number shown in the student's profile)
create table if not exists obs_seen (
  dev text primary key, kind text, label text,
  first timestamptz not null default now(), last timestamptz not null default now()
);
alter table obs_seen enable row level security;

create table if not exists obs_requests (
  id uuid primary key default gen_random_uuid(),
  dev text not null, kind text, label text,
  name text not null, phone text not null, plan text not null, comment text,
  status text not null default 'pending',   -- pending | approved | rejected
  reason text, code text,
  created timestamptz not null default now(), decided timestamptz
);
create index if not exists obs_requests_status on obs_requests(status, created desc);
create index if not exists obs_requests_dev on obs_requests(dev, created desc);
alter table obs_requests enable row level security;

-- the receipt (picture or PDF, base64) is kept apart so lists stay light; only the owner can read it
create table if not exists obs_receipts (
  req uuid primary key references obs_requests(id) on delete cascade,
  mime text not null, data text not null
);
alter table obs_receipts enable row level security;

-- the code a device belongs to: a code that is on and not ended first
create or replace function obs_code_of(p_dev text) returns text
language sql stable security definer set search_path = public as $$
  select code from (
    select code, active, expires, created_at from obs_codes where phone_dev = p_dev or pc_dev = p_dev
    union all
    select c.code, c.active, c.expires, c.created_at from obs_devices d join obs_codes c on c.code = d.code where d.dev = p_dev
  ) x order by (active and (expires is null or expires > now())) desc, active desc, created_at desc limit 1
$$;
revoke all on function obs_code_of(text) from public, anon, authenticated;

-- the student's name as the owner wrote it: the note without phone numbers
create or replace function obs_name_of(p_note text) returns text
language sql immutable as $$
  select nullif(trim(split_part(coalesce(p_note, ''), '·', 1)), '')
$$;

create or replace function obs_check(p_dev text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c obs_codes;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' then return jsonb_build_object('ok', false, 'reason', 'none'); end if;
  select * into c from obs_codes where code = obs_code_of(p_dev);
  if not found then return jsonb_build_object('ok', false, 'reason', 'none'); end if;
  if not c.active then return jsonb_build_object('ok', false, 'reason', 'off'); end if;
  if c.expires is not null and c.expires <= now() then
    return jsonb_build_object('ok', false, 'reason', 'expired', 'exp', c.expires, 'plan', c.plan);
  end if;
  update obs_codes set
    phone_last = case when phone_dev = p_dev then now() else phone_last end,
    pc_last    = case when pc_dev = p_dev then now() else pc_last end
  where code = c.code;
  update obs_devices set last = now() where dev = p_dev;
  return jsonb_build_object('ok', true, 'key', (select k from obs_secret where id = 1), 'code', c.code,
    'exp', c.expires, 'plan', c.plan, 'name', obs_name_of(c.note));
end $$;

create or replace function obs_activate(p_code text, p_dev text, p_kind text, p_label text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c obs_codes; used int;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  select * into c from obs_codes where code = upper(trim(p_code)) for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  if not c.active then return jsonb_build_object('ok', false, 'reason', 'off'); end if;
  if c.expires is not null and c.expires <= now() then return jsonb_build_object('ok', false, 'reason', 'off'); end if;
  if c.phone_dev = p_dev then
    update obs_codes set phone_last = now(), phone_label = left(p_label, 60) where code = c.code;
  elsif c.pc_dev = p_dev then
    update obs_codes set pc_last = now(), pc_label = left(p_label, 60) where code = c.code;
  elsif exists (select 1 from obs_devices where dev = p_dev and code = c.code) then
    update obs_devices set last = now(), label = left(p_label, 60) where dev = p_dev;
  else
    used := (case when c.phone_dev is not null then 1 else 0 end) + (case when c.pc_dev is not null then 1 else 0 end)
            + (select count(*) from obs_devices where code = c.code);
    if used >= greatest(coalesce(c.maxdev, 2), 1) then return jsonb_build_object('ok', false, 'reason', 'taken'); end if;
    delete from obs_devices where dev = p_dev;
    if p_kind = 'phone' and c.phone_dev is null then
      update obs_codes set phone_dev = p_dev, phone_label = left(p_label, 60), phone_since = now(), phone_last = now(),
        activated_at = coalesce(activated_at, now()) where code = c.code;
    elsif p_kind <> 'phone' and c.pc_dev is null then
      update obs_codes set pc_dev = p_dev, pc_label = left(p_label, 60), pc_since = now(), pc_last = now(),
        activated_at = coalesce(activated_at, now()) where code = c.code;
    elsif coalesce(c.maxdev, 2) > 2 then
      insert into obs_devices (dev, code, kind, label, last) values (p_dev, c.code, case when p_kind = 'phone' then 'phone' else 'pc' end, left(p_label, 60), now());
      update obs_codes set activated_at = coalesce(activated_at, now()) where code = c.code;
    else
      return jsonb_build_object('ok', false, 'reason', 'taken');
    end if;
  end if;
  return jsonb_build_object('ok', true, 'code', c.code, 'key', (select k from obs_secret where id = 1),
    'exp', c.expires, 'plan', c.plan, 'name', obs_name_of(c.note));
end $$;

-- sync stops while a plan has ended; the saved data stays under the code and comes back after renewal
create or replace function obs_sync_get(p_dev text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c obs_codes; s obs_sync;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' then return jsonb_build_object('ok', false, 'reason', 'none'); end if;
  select * into c from obs_codes where code = obs_code_of(p_dev);
  if not found then return jsonb_build_object('ok', false, 'reason', 'none'); end if;
  if not c.active or (c.expires is not null and c.expires <= now()) then return jsonb_build_object('ok', false, 'reason', 'off'); end if;
  select * into s from obs_sync where code = c.code;
  if not found then return jsonb_build_object('ok', true, 'ver', 0, 'data', null); end if;
  return jsonb_build_object('ok', true, 'ver', s.ver, 'data', s.data);
end $$;

create or replace function obs_sync_put(p_dev text, p_ver integer, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c obs_codes; s obs_sync;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' then return jsonb_build_object('ok', false, 'reason', 'none'); end if;
  select * into c from obs_codes where code = obs_code_of(p_dev);
  if not found then return jsonb_build_object('ok', false, 'reason', 'none'); end if;
  if not c.active or (c.expires is not null and c.expires <= now()) then return jsonb_build_object('ok', false, 'reason', 'off'); end if;
  if octet_length(p_data::text) > 3000000 then return jsonb_build_object('ok', false, 'reason', 'big'); end if;
  select * into s from obs_sync where code = c.code for update;
  if not found then
    if coalesce(p_ver, 0) <> 0 then return jsonb_build_object('ok', false, 'reason', 'stale'); end if;
    insert into obs_sync(code, ver, data) values (c.code, 1, p_data);
    return jsonb_build_object('ok', true, 'ver', 1);
  end if;
  if s.ver <> coalesce(p_ver, 0) then return jsonb_build_object('ok', false, 'reason', 'stale'); end if;
  update obs_sync set ver = s.ver + 1, data = p_data, updated_at = now() where code = c.code;
  return jsonb_build_object('ok', true, 'ver', s.ver + 1);
end $$;

-- give or renew a subscription for one device (used only by the owner's functions below)
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
    insert into obs_codes(code, note, plan, expires, activated_at) values (s, nt, p_plan, ex, now());
    if p_kind = 'phone' then
      update obs_codes set phone_dev = p_dev, phone_label = left(p_label, 60), phone_since = now(), phone_last = now() where code = s;
    else
      update obs_codes set pc_dev = p_dev, pc_label = left(p_label, 60), pc_since = now(), pc_last = now() where code = s;
    end if;
    cd := s;
  else
    select * into c from obs_codes where code = cd for update;
    if c.active and c.expires is null then
      ex := null;                                   -- an old code that never ends stays as it is
    else
      ex := case p_plan when 'life' then null
            when 'month' then greatest(coalesce(c.expires, now()), now()) + interval '1 month'
            else greatest(coalesce(c.expires, now()), now()) + interval '1 year' end;
    end if;
    update obs_codes set active = true, expires = ex,
      plan = case when c.active and c.expires is null then coalesce(c.plan, 'life') else p_plan end,
      note = case when coalesce(note, '') = '' then nt else note end where code = cd;
  end if;
  return jsonb_build_object('ok', true, 'code', cd, 'exp', ex);
end $$;
revoke all on function obs_grant(text, text, text, text, text, text) from public, anon, authenticated;

-- the app: where this device stands (also records the device so the owner can find it by its user number)
create or replace function obs_request_status(p_dev text, p_kind text, p_label text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r obs_requests; c obs_codes;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' then return jsonb_build_object('ok', false); end if;
  insert into obs_seen(dev, kind, label) values (p_dev, case when p_kind = 'phone' then 'phone' else 'pc' end, left(p_label, 60))
    on conflict (dev) do update set last = now(), label = excluded.label, kind = excluded.kind;
  select * into c from obs_codes where code = obs_code_of(p_dev);
  select * into r from obs_requests where dev = p_dev order by created desc limit 1;
  return jsonb_build_object('ok', true,
    'active', coalesce(c.active and (c.expires is null or c.expires > now()), false),
    'ended', coalesce(c.active and c.expires is not null and c.expires <= now(), false),
    'status', coalesce(r.status, 'none'), 'plan', r.plan, 'created', r.created, 'reason', r.reason);
end $$;

-- the app: send a subscription request with the receipt
create or replace function obs_request_submit(p_dev text, p_kind text, p_label text, p_name text, p_phone text, p_plan text,
  p_comment text, p_mime text, p_data text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare rid uuid;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  if p_plan not in ('month', 'year', 'life') then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  if length(trim(coalesce(p_name, ''))) < 2 or length(p_name) > 60 then return jsonb_build_object('ok', false, 'reason', 'name'); end if;
  if coalesce(p_phone, '') !~ '^[0-9+ ]{7,20}$' then return jsonb_build_object('ok', false, 'reason', 'phone'); end if;
  if p_mime not in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf') then return jsonb_build_object('ok', false, 'reason', 'file'); end if;
  if length(coalesce(p_data, '')) < 200 or length(p_data) > 2000000 then return jsonb_build_object('ok', false, 'reason', 'file'); end if;
  if exists (select 1 from obs_requests where dev = p_dev and status = 'pending') then return jsonb_build_object('ok', false, 'reason', 'pending'); end if;
  if (select count(*) from obs_requests where dev = p_dev and created > now() - interval '1 day') >= 5 then return jsonb_build_object('ok', false, 'reason', 'many'); end if;
  if (select count(*) from obs_requests where status = 'pending') >= 500 then return jsonb_build_object('ok', false, 'reason', 'busy'); end if;
  insert into obs_requests(dev, kind, label, name, phone, plan, comment)
    values (p_dev, case when p_kind = 'phone' then 'phone' else 'pc' end, left(p_label, 60), trim(p_name), trim(p_phone), p_plan, left(coalesce(p_comment, ''), 500))
    returning id into rid;
  insert into obs_receipts(req, mime, data) values (rid, p_mime, p_data);
  return jsonb_build_object('ok', true, 'id', rid);
end $$;

-- the owner: requests (no receipt data), newest first
create or replace function obs_admin_requests(p_status text) returns setof obs_requests
language plpgsql stable security definer set search_path = public as $$
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  return query select * from obs_requests where p_status is null or status = p_status order by created desc limit 300;
end $$;

create or replace function obs_admin_receipt(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare x obs_receipts;
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  select * into x from obs_receipts where req = p_id;
  if not found then return null; end if;
  return jsonb_build_object('mime', x.mime, 'data', x.data);
end $$;

-- the owner: approve (the device opens by itself) or reject with a reason; p_name / p_plan may correct what the student wrote
create or replace function obs_admin_decide(p_id uuid, p_ok boolean, p_name text, p_plan text, p_reason text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r obs_requests; g jsonb;
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  select * into r from obs_requests where id = p_id for update;
  if not found or r.status <> 'pending' then return jsonb_build_object('ok', false, 'reason', 'done'); end if;
  if not p_ok then
    update obs_requests set status = 'rejected', reason = left(coalesce(p_reason, ''), 300), decided = now() where id = p_id;
    return jsonb_build_object('ok', true);
  end if;
  g := obs_grant(r.dev, r.kind, r.label, coalesce(nullif(trim(p_name), ''), r.name), r.phone, coalesce(nullif(p_plan, ''), r.plan));
  if not (g->>'ok')::boolean then return g; end if;
  update obs_requests set status = 'approved', decided = now(), code = g->>'code', plan = coalesce(nullif(p_plan, ''), r.plan),
    name = coalesce(nullif(trim(p_name), ''), r.name) where id = p_id;
  return g;
end $$;

-- the owner: give a subscription with no receipt, from the user number shown in the student's profile (first characters of the device id)
create or replace function obs_admin_grant(p_user text, p_name text, p_phone text, p_plan text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u text := lower(regexp_replace(coalesce(p_user, ''), '[^0-9A-Fa-f]', '', 'g')); n int; d obs_seen;
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  if length(u) < 8 then return jsonb_build_object('ok', false, 'reason', 'short'); end if;
  select count(*) into n from obs_seen where dev like u || '%';
  if n = 0 then return jsonb_build_object('ok', false, 'reason', 'unknown'); end if;
  if n > 1 then return jsonb_build_object('ok', false, 'reason', 'many'); end if;
  select * into d from obs_seen where dev like u || '%';
  return obs_grant(d.dev, d.kind, d.label, p_name, p_phone, p_plan);
end $$;

-- the owner: change when a code ends (null = never)
create or replace function obs_admin_expires(p_code text, p_expires timestamptz) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  update obs_codes set expires = p_expires where code = p_code;
end $$;
