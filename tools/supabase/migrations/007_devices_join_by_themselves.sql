-- Devices without the owner (owner, 10 Nov 2026): the first devices of a subscription (up to its limit, 3 by default) join by themselves;
-- any device beyond the limit becomes a request the owner approves (approving raises that subscription's limit by one).
-- How a device joins: a subscribed device asks for a link number (8 digits, 10 minutes, one use: obs_pair_new); the new device sends it
-- (obs_pair_use). The number comes from the student's own device, never from the owner.
create table if not exists obs_pair (pin text primary key, code text not null references obs_codes(code) on delete cascade, exp timestamptz not null);
alter table obs_pair enable row level security;
create table if not exists obs_pair_fail (at timestamptz not null default now());
alter table obs_pair_fail enable row level security;

create or replace function obs_pair_new(p_dev text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c obs_codes; p text;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' then return jsonb_build_object('ok', false, 'reason', 'none'); end if;
  select * into c from obs_codes where code = obs_code_of(p_dev);
  if not found or not c.active or (c.expires is not null and c.expires <= now()) then return jsonb_build_object('ok', false, 'reason', 'none'); end if;
  delete from obs_pair where code = c.code or exp < now();
  loop
    p := lpad((('x' || substr(encode(uuid_send(gen_random_uuid()), 'hex'), 1, 8))::bit(32)::bigint % 100000000)::text, 8, '0');
    exit when not exists (select 1 from obs_pair where pin = p);
  end loop;
  insert into obs_pair(pin, code, exp) values (p, c.code, now() + interval '10 minutes');
  return jsonb_build_object('ok', true, 'pin', p, 'exp', now() + interval '10 minutes');
end $$;

create or replace function obs_pair_use(p_dev text, p_kind text, p_label text, p_pin text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare x obs_pair; c obs_codes; pn text := regexp_replace(coalesce(p_pin, ''), '[^0-9]', '', 'g');
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  delete from obs_pair_fail where at < now() - interval '1 minute';
  if (select count(*) from obs_pair_fail) >= 120 then return jsonb_build_object('ok', false, 'reason', 'busy'); end if;
  select * into x from obs_pair where pin = pn and exp > now();
  if not found then insert into obs_pair_fail default values; return jsonb_build_object('ok', false, 'reason', 'wrong'); end if;
  select * into c from obs_codes where code = x.code;
  if not c.active or (c.expires is not null and c.expires <= now()) then return jsonb_build_object('ok', false, 'reason', 'wrong'); end if;
  delete from obs_pair where pin = pn;
  if obs_bind(c.code, p_dev, p_kind, p_label) then return jsonb_build_object('ok', true); end if;
  -- the subscription has used all its devices: ask the owner
  if not exists (select 1 from obs_requests where dev = p_dev and status = 'pending') then
    insert into obs_requests(dev, kind, label, name, phone, plan, comment)
      values (p_dev, case when p_kind = 'phone' then 'phone' else 'pc' end, left(p_label, 60), coalesce(obs_name_of(c.note), 'Student'),
              coalesce(nullif(trim(split_part(c.note, '·', 2)), ''), '0000000'), 'device', 'More devices than the limit of this subscription');
  end if;
  return jsonb_build_object('ok', false, 'reason', 'full');
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
    if not obs_bind(cd, r.dev, r.kind, r.label) then
      -- the owner approves a device beyond the limit: the limit grows by one for this subscription
      update obs_codes set maxdev = least(10, (case when phone_dev is not null then 1 else 0 end) + (case when pc_dev is not null then 1 else 0 end)
        + (select count(*) from obs_devices where code = cd) + 1) where code = cd;
      if not obs_bind(cd, r.dev, r.kind, r.label) then return jsonb_build_object('ok', false, 'reason', 'full', 'code', cd); end if;
    end if;
    update obs_requests set status = 'approved', decided = now(), code = cd where id = p_id;
    return jsonb_build_object('ok', true, 'code', cd);
  end if;
  g := obs_grant(r.dev, r.kind, r.label, coalesce(nullif(trim(p_name), ''), r.name), r.phone, coalesce(nullif(p_plan, ''), r.plan));
  if not (g->>'ok')::boolean then return g; end if;
  update obs_requests set status = 'approved', decided = now(), code = g->>'code', plan = coalesce(nullif(p_plan, ''), r.plan),
    name = coalesce(nullif(trim(p_name), ''), r.name) where id = p_id;
  return g;
end $$;
