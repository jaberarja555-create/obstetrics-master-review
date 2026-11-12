-- One subscription system for the three books (owner, 11 Nov 2026: "make Surgery and Pediatrics exactly like Obstetrics, even the
-- subscription"; one admin app for all three). Each device, request and subscription now says which book it is for:
--   obs = Obstetrics Master Review (everything made before this migration), ped = Pediatric Master Review, srg = Surgery Master Review.
-- A device says its book when it asks for its status (obs_request_status with p_book); the subscription made for it carries that book,
-- and the key it receives is that book's own key (obs_book_keys). The Obstetrics app sends no book and works exactly as before.
-- Idempotent: columns and tables "if not exists", functions "create or replace".

alter table obs_codes add column if not exists book text not null default 'obs';
alter table obs_requests add column if not exists book text not null default 'obs';
alter table obs_seen add column if not exists book text not null default 'obs';
create index if not exists obs_requests_book on obs_requests(book, status, created desc);

-- each book's own key (Obstetrics keeps its key in obs_secret). Made here, on the server; never printed. Only its SHA-256 is shown in the
-- log below, so the apps can check a key they receive (book.json access.key_hash).
create table if not exists obs_book_keys (book text primary key, k text not null);
alter table obs_book_keys enable row level security;
insert into obs_book_keys(book, k)
  select b, encode(uuid_send(gen_random_uuid()), 'hex') || encode(uuid_send(gen_random_uuid()), 'hex')
  from unnest(array['ped', 'srg']) b
  on conflict (book) do nothing;
do $$ declare r record; begin
  for r in select book, encode(sha256(convert_to(k, 'UTF8')), 'hex') h from obs_book_keys order by book loop
    raise notice 'key_hash %: %', r.book, r.h;
  end loop;
end $$;

create or replace function obs_book_ok(p_book text) returns boolean
language sql immutable as $$ select coalesce(p_book, '') in ('obs', 'ped', 'srg') $$;

-- the book a device belongs to (from its last status call)
create or replace function obs_book_of(p_dev text) returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select book from obs_seen where dev = p_dev), 'obs')
$$;
revoke all on function obs_book_of(text) from public, anon, authenticated;

create or replace function obs_key_of(p_book text) returns text
language sql stable security definer set search_path = public as $$
  select case when coalesce(p_book, 'obs') = 'obs' then (select k from obs_secret where id = 1)
              else (select k from obs_book_keys where book = p_book) end
$$;
revoke all on function obs_key_of(text) from public, anon, authenticated;

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
  return jsonb_build_object('ok', true, 'key', obs_key_of(c.book), 'code', c.code, 'book', c.book,
    'exp', c.expires, 'plan', c.plan, 'name', obs_name_of(c.note));
end $$;

create or replace function obs_activate(p_code text, p_dev text, p_kind text, p_label text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c obs_codes; used int;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  select * into c from obs_codes where code = upper(trim(p_code)) for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  if c.book <> obs_book_of(p_dev) then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;   -- a code of another book
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
  return jsonb_build_object('ok', true, 'code', c.code, 'key', obs_key_of(c.book), 'book', c.book,
    'exp', c.expires, 'plan', c.plan, 'name', obs_name_of(c.note));
end $$;

-- a new subscription is made for the device's book; its code starts with that book's letters
create or replace function obs_grant(p_dev text, p_kind text, p_label text, p_name text, p_phone text, p_plan text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  cd text; c obs_codes; ex timestamptz; nt text; bk text := obs_book_of(p_dev);
  a text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; j int; b bytea; s text;
begin
  if p_plan not in ('month', 'year', 'life') then return jsonb_build_object('ok', false, 'reason', 'plan'); end if;
  nt := left(trim(coalesce(p_name, '')) || case when coalesce(p_phone, '') <> '' then ' · ' || trim(p_phone) else '' end, 200);
  cd := obs_code_of(p_dev);
  if cd is null then
    loop
      b := uuid_send(gen_random_uuid()); s := case bk when 'ped' then 'PMR-' when 'srg' then 'SMR-' else 'OBS-' end;
      for j in 0 .. 7 loop
        s := s || substr(a, (get_byte(b, j) % 32) + 1, 1);
        if j = 3 then s := s || '-'; end if;
      end loop;
      exit when not exists (select 1 from obs_codes where code = s);
    end loop;
    ex := case p_plan when 'month' then now() + interval '1 month' when 'year' then now() + interval '1 year' else null end;
    insert into obs_codes(code, note, plan, expires, activated_at, maxdev, book) values (s, nt, p_plan, ex, now(), 3, bk);
    perform obs_bind(s, p_dev, p_kind, p_label);
    cd := s;
  else
    select * into c from obs_codes where code = cd for update;
    if c.active and c.expires is null and c.plan is not null and c.plan <> 'old' then
      ex := null;                                   -- a lifetime subscription stays as it is
    else
      ex := case p_plan when 'life' then null
            when 'month' then greatest(coalesce(c.expires, now()), now()) + interval '1 month'
            else greatest(coalesce(c.expires, now()), now()) + interval '1 year' end;
    end if;
    update obs_codes set active = true, expires = ex,
      plan = case when c.active and c.expires is null and c.plan is not null and c.plan <> 'old' then c.plan else p_plan end,
      note = case when coalesce(note, '') = '' then nt else note end where code = cd;
  end if;
  return jsonb_build_object('ok', true, 'code', cd, 'exp', ex);
end $$;
revoke all on function obs_grant(text, text, text, text, text, text) from public, anon, authenticated;

-- the apps of Pediatrics and Surgery say their book; the device is recorded with it
create or replace function obs_request_status(p_dev text, p_kind text, p_label text, p_book text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' or not obs_book_ok(p_book) then return jsonb_build_object('ok', false); end if;
  insert into obs_seen(dev, kind, label, book) values (p_dev, case when p_kind = 'phone' then 'phone' else 'pc' end, left(p_label, 60), p_book)
    on conflict (dev) do update set last = now(), label = excluded.label, kind = excluded.kind, book = excluded.book;
  return obs_request_status(p_dev, p_kind, p_label);
end $$;

create or replace function obs_request_submit(p_dev text, p_kind text, p_label text, p_name text, p_phone text, p_plan text,
  p_comment text, p_mime text, p_data text, p_book text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g jsonb;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' or not obs_book_ok(p_book) then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  insert into obs_seen(dev, kind, label, book) values (p_dev, case when p_kind = 'phone' then 'phone' else 'pc' end, left(p_label, 60), p_book)
    on conflict (dev) do update set last = now(), book = excluded.book;
  g := obs_request_submit(p_dev, p_kind, p_label, p_name, p_phone, p_plan, p_comment, p_mime, p_data);
  return g;
end $$;

-- every new request carries its device's book (also requests made by obs_pair_use and the old 9-argument submit)
create or replace function obs_request_book() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.book := obs_book_of(new.dev);
  return new;
end $$;
drop trigger if exists obs_request_book on obs_requests;
create trigger obs_request_book before insert on obs_requests for each row execute function obs_request_book();

-- a link number joins only a device of the same book
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
  if not c.active or (c.expires is not null and c.expires <= now()) or c.book <> obs_book_of(p_dev) then
    return jsonb_build_object('ok', false, 'reason', 'wrong');
  end if;
  delete from obs_pair where pin = pn;
  if obs_bind(c.code, p_dev, p_kind, p_label) then return jsonb_build_object('ok', true); end if;
  if not exists (select 1 from obs_requests where dev = p_dev and status = 'pending') then
    insert into obs_requests(dev, kind, label, name, phone, plan, comment)
      values (p_dev, case when p_kind = 'phone' then 'phone' else 'pc' end, left(p_label, 60), coalesce(obs_name_of(c.note), 'Student'),
              coalesce(nullif(trim(split_part(c.note, '·', 2)), ''), '0000000'), 'device', 'More devices than the limit of this subscription');
  end if;
  return jsonb_build_object('ok', false, 'reason', 'full');
end $$;

-- the owner approves a device request: the subscription with that phone number IN THE SAME BOOK
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
    select code into cd from obs_codes where book = r.book and active and (expires is null or expires > now()) and obs_phone9(r.phone) is not null
      and obs_phone9(split_part(note, '·', 2)) = obs_phone9(r.phone) order by created_at desc limit 1;
    if cd is null then return jsonb_build_object('ok', false, 'reason', 'nosub'); end if;
    if not obs_bind(cd, r.dev, r.kind, r.label) then
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

-- the owner gives a subscription with no receipt: the book of the device is shown back
create or replace function obs_admin_seen(p_user text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare u text := lower(regexp_replace(coalesce(p_user, ''), '[^0-9A-Fa-f]', '', 'g')); d obs_seen;
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  if length(u) < 8 then return null; end if;
  select * into d from obs_seen where dev like u || '%' limit 1;
  if not found then return null; end if;
  return jsonb_build_object('book', d.book, 'label', d.label, 'kind', d.kind, 'last', d.last);
end $$;

grant execute on function obs_request_status(text, text, text, text) to anon, authenticated;
grant execute on function obs_request_submit(text, text, text, text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function obs_admin_seen(text) to authenticated;
notify pgrst, 'reload schema';
