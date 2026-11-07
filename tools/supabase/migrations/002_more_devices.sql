-- More devices per code (owner, 7 Nov 2026, as in Surgery and Pediatrics).
-- Each code keeps its phone slot and computer slot as before; obs_codes.maxdev (1–10, default 2) is the total number of
-- devices the code may open, and devices beyond the two slots live in obs_devices. With maxdev = 2 nothing changes.
alter table obs_codes add column if not exists maxdev integer not null default 2;
create table if not exists obs_devices (
  dev text primary key,
  code text not null references obs_codes(code) on delete cascade,
  kind text, label text, since timestamptz not null default now(), last timestamptz
);
create index if not exists obs_devices_code on obs_devices(code);
alter table obs_devices enable row level security;

-- the code a device belongs to (slot or extra)
create or replace function obs_code_of(p_dev text) returns text
language sql stable security definer set search_path = public as $$
  select code from (
    select code, active from obs_codes where phone_dev = p_dev or pc_dev = p_dev
    union all
    select c.code, c.active from obs_devices d join obs_codes c on c.code = d.code where d.dev = p_dev
  ) x order by active desc limit 1
$$;
revoke all on function obs_code_of(text) from public;

create or replace function obs_activate(p_code text, p_dev text, p_kind text, p_label text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c obs_codes; used int;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  select * into c from obs_codes where code = upper(trim(p_code)) for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  if not c.active then return jsonb_build_object('ok', false, 'reason', 'off'); end if;
  -- already this device: refresh
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
    delete from obs_devices where dev = p_dev;   -- a device moves to this code
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
  return jsonb_build_object('ok', true, 'code', c.code, 'key', (select k from obs_secret where id = 1));
end $$;

create or replace function obs_check(p_dev text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c obs_codes;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' then return jsonb_build_object('ok', false, 'reason', 'none'); end if;
  select * into c from obs_codes where code = obs_code_of(p_dev);
  if not found then return jsonb_build_object('ok', false, 'reason', 'none'); end if;
  if not c.active then return jsonb_build_object('ok', false, 'reason', 'off'); end if;
  update obs_codes set
    phone_last = case when phone_dev = p_dev then now() else phone_last end,
    pc_last    = case when pc_dev = p_dev then now() else pc_last end
  where code = c.code;
  update obs_devices set last = now() where dev = p_dev;
  return jsonb_build_object('ok', true, 'key', (select k from obs_secret where id = 1));
end $$;

create or replace function obs_sync_get(p_dev text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c obs_codes; s obs_sync;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' then return jsonb_build_object('ok', false, 'reason', 'none'); end if;
  select * into c from obs_codes where code = obs_code_of(p_dev);
  if not found then return jsonb_build_object('ok', false, 'reason', 'none'); end if;
  if not c.active then return jsonb_build_object('ok', false, 'reason', 'off'); end if;
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
  if not c.active then return jsonb_build_object('ok', false, 'reason', 'off'); end if;
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

create or replace function obs_release(p_dev text) returns json
language plpgsql security definer set search_path = public as $$
declare n int := 0; c int;
begin
  if p_dev is null or p_dev !~ '^[0-9a-f]{20,64}$' then return json_build_object('ok', false, 'reason', 'dev'); end if;
  update obs_codes set phone_dev = null, phone_label = null, phone_since = null, phone_last = null where phone_dev = p_dev; get diagnostics c = row_count; n := n + c;
  update obs_codes set pc_dev = null, pc_label = null, pc_since = null, pc_last = null where pc_dev = p_dev; get diagnostics c = row_count; n := n + c;
  delete from obs_devices where dev = p_dev; get diagnostics c = row_count; n := n + c;
  return json_build_object('ok', n > 0, 'reason', case when n > 0 then null else 'none' end);
end $$;

create or replace function obs_admin_reset(p_code text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  update obs_codes set phone_dev = null, phone_label = null, phone_since = null, phone_last = null, phone_moved = null,
    pc_dev = null, pc_label = null, pc_since = null, pc_last = null, pc_moved = null where code = p_code;
  delete from obs_devices where code = p_code;
end $$;

create or replace function obs_admin_free(p_code text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  update obs_codes set user_id = null, email = null, activated_at = null,
    phone_dev = null, phone_label = null, phone_since = null, phone_last = null, phone_moved = null,
    pc_dev = null, pc_label = null, pc_since = null, pc_last = null, pc_moved = null where code = p_code;
  delete from obs_devices where code = p_code;
end $$;

-- admin: set how many devices a code may open (1–10)
create or replace function obs_admin_maxdev(p_code text, p_n integer) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  update obs_codes set maxdev = least(greatest(coalesce(p_n, 2), 1), 10) where code = p_code;
end $$;

-- admin: the extra devices (beyond the phone and computer slots)
create or replace function obs_admin_extra() returns setof obs_devices
language plpgsql stable security definer set search_path = public as $$
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  return query select * from obs_devices order by since;
end $$;

-- obs_admin_list returns the obs_codes row type; recreate it so it carries the new maxdev column
create or replace function obs_admin_list() returns setof obs_codes
language plpgsql stable security definer set search_path = public as $$
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  return query select * from obs_codes order by created_at desc;
end $$;

revoke all on function obs_admin_maxdev(text, integer) from public;
revoke all on function obs_admin_extra() from public;
grant execute on function obs_activate(text, text, text, text), obs_check(text), obs_sync_get(text), obs_sync_put(text, integer, jsonb), obs_release(text) to anon, authenticated;
grant execute on function obs_admin_maxdev(text, integer), obs_admin_extra(), obs_admin_reset(text), obs_admin_free(text), obs_admin_list() to authenticated;
