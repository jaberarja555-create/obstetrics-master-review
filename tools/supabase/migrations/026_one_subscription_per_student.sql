-- 026 · one subscription per student and book (owner, 15 Nov 2026: "a student has 2 Surgery subscriptions, his phone still shows no
-- subscription, and if I merge he loses it; I want a permanent solution").
--
-- Why it happened: a phone gets a NEW device number whenever the book is opened with empty storage (Safari and the Home-screen app of
-- an iPhone keep separate storage, a browser that clears site data, another browser). The new number belongs to no subscription, so the
-- book shows "not subscribed" and the student sends a request again; approving it ran obs_grant, which made a NEW subscription for that
-- device. The student ends up with several subscriptions of one book, each full of device numbers his phone no longer uses.
--
-- 1. obs_grant (Approve, Give, «New subscription»): a device that belongs to no subscription but whose student (same book, same phone
--    number) already has one is ADDED to that subscription (its device count is raised if needed) and that subscription is renewed
--    with the chosen plan. A second subscription of the same book is never made again.
-- 2. obs_admin_add_device(request, code): the owner adds the device of a waiting request to the student's subscription WITHOUT renewing
--    it (for a student who did not pay again, only lost access) — same as Link, but for any request.
-- 3. Merging is one function (obs_merge_core) used by «Merge into one», «Same person as…» and step 5: the latest end date is kept
--    (lifetime stays lifetime), all devices are kept, and the synced notes of both are JOINED (obs_jmerge; before, the notes of the
--    removed subscription were dropped when the other one had notes too).
-- 4. obs_auto_join: Student Master Review now also passes the device numbers this book had before on the same phone; when the
--    subscription is full, the new device takes the place of the old number it replaces (same phone, same book).
-- 5. Students who already have two or more subscriptions of one book (same phone number, or joined by «Same person as…») get them merged
--    into one. Only counts are printed.

-- the student's subscription of a book (live first, then the one ending last; switched-off and old codes are left alone)
create or replace function obs_student_sub(p_book text, p_phone text) returns text
language sql stable security definer set search_path = public as $$
  select code from obs_codes
   where book = coalesce(p_book, 'obs') and active and plan in ('month', 'year', 'life')
     and obs_phone9(p_phone) is not null and length(obs_phone9(p_phone)) >= 7
     and (obs_phone9(split_part(coalesce(note, ''), '·', 2)) = obs_phone9(p_phone)
          or position(obs_phone9(p_phone) in regexp_replace(coalesce(note, ''), '[^0-9]', '', 'g')) > 0)
   order by (expires is null or expires > now()) desc, expires desc nulls first, created_at desc limit 1 $$;
revoke all on function obs_student_sub(text, text) from public, anon, authenticated;

-- bind a device, raising the subscription's device count when it is full (the owner approved this device)
create or replace function obs_bind_more(p_code text, p_dev text, p_kind text, p_label text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if obs_bind(p_code, p_dev, p_kind, p_label) then return true; end if;
  update obs_codes set maxdev = least(10, (case when phone_dev is not null then 1 else 0 end) + (case when pc_dev is not null then 1 else 0 end)
    + (select count(*) from obs_devices where code = p_code) + 1) where code = p_code;
  return obs_bind(p_code, p_dev, p_kind, p_label);
end $$;
revoke all on function obs_bind_more(text, text, text, text) from public, anon, authenticated;

create or replace function obs_grant(p_dev text, p_kind text, p_label text, p_name text, p_phone text, p_plan text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  cd text; c obs_codes; ex timestamptz; nt text; bk text := obs_book_of(p_dev); joined boolean := false;
  a text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; j int; b bytea; s text;
begin
  if p_plan not in ('month', 'year', 'life') then return jsonb_build_object('ok', false, 'reason', 'plan'); end if;
  nt := left(trim(coalesce(p_name, '')) || case when coalesce(p_phone, '') <> '' then ' · ' || trim(p_phone) else '' end, 200);
  cd := obs_code_of(p_dev);
  if cd is not null and (select coalesce(book, 'obs') from obs_codes where code = cd) <> coalesce(bk, 'obs') then cd := null; end if;
  -- the student already has a subscription of this book: this device joins it (no second subscription)
  if cd is null then
    cd := obs_student_sub(bk, p_phone);
    if cd is not null then
      if not obs_bind_more(cd, p_dev, p_kind, p_label) then return jsonb_build_object('ok', false, 'reason', 'full', 'code', cd); end if;
      joined := true;
    end if;
  end if;
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
  return jsonb_build_object('ok', true, 'code', cd, 'exp', ex, 'joined_existing', joined);
end $$;
revoke all on function obs_grant(text, text, text, text, text, text) from public, anon, authenticated;

-- the owner adds the device of a waiting request to a subscription of the same book, with no renewal
create or replace function obs_admin_add_device(p_id uuid, p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r obs_requests; c obs_codes; r2 obs_requests; n int := 0;
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  select * into r from obs_requests where id = p_id for update;
  if not found or r.status <> 'pending' then return jsonb_build_object('ok', false, 'reason', 'done'); end if;
  select * into c from obs_codes where code = p_code;
  if not found then return jsonb_build_object('ok', false, 'reason', 'nocode'); end if;
  if coalesce(c.book, 'obs') <> coalesce(r.book, 'obs') then return jsonb_build_object('ok', false, 'reason', 'book'); end if;
  if not obs_bind_more(p_code, r.dev, r.kind, r.label) then return jsonb_build_object('ok', false, 'reason', 'full'); end if;
  update obs_requests set status = 'approved', decided = now(), code = p_code where id = r.id;
  -- devices of the same student that joined this request come too
  for r2 in select * from obs_requests where joins = p_id and status = 'pending' loop
    if obs_bind_more(p_code, r2.dev, r2.kind, r2.label) then
      update obs_requests set status = 'approved', decided = now(), code = p_code where id = r2.id; n := n + 1;
    end if;
  end loop;
  return jsonb_build_object('ok', true, 'code', p_code, 'joined', n);
end $$;
revoke all on function obs_admin_add_device(uuid, text) from public, anon;
grant execute on function obs_admin_add_device(uuid, text) to authenticated;

-- notes of two subscriptions joined into one (nothing is dropped): objects are joined key by key, lists of items are joined (an item with
-- the same id, or exactly the same, is kept once), anything else keeps the value of the subscription that stays
create or replace function obs_jmerge(a jsonb, b jsonb) returns jsonb
language plpgsql immutable as $$
declare r jsonb; k text; x jsonb;
begin
  if a is null or a = 'null'::jsonb then return b; end if;
  if b is null or b = 'null'::jsonb then return a; end if;
  if jsonb_typeof(a) = 'object' and jsonb_typeof(b) = 'object' then
    r := b;
    for k in select jsonb_object_keys(a) loop
      r := jsonb_set(r, array[k], obs_jmerge(a -> k, b -> k), true);
    end loop;
    return r;
  end if;
  if jsonb_typeof(a) = 'array' and jsonb_typeof(b) = 'array'
     and not exists (select 1 from jsonb_array_elements(a) e where jsonb_typeof(e) <> 'object')
     and not exists (select 1 from jsonb_array_elements(b) e where jsonb_typeof(e) <> 'object') then
    r := b;
    for x in select e from jsonb_array_elements(a) e loop
      if not exists (select 1 from jsonb_array_elements(r) y
                      where y = x or (x ? 'id' and y ? 'id' and y -> 'id' = x -> 'id')) then
        r := r || jsonb_build_array(x);
      end if;
    end loop;
    return r;
  end if;
  return b;
end $$;

-- one merge for every path: devices, notes and requests move; the latest end date is kept
create or replace function obs_merge_core(p_from text, p_into text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a obs_codes; b obs_codes; used int; rk int; pl text; ex timestamptz;
begin
  select * into a from obs_codes where code = p_from for update;
  select * into b from obs_codes where code = p_into for update;
  if a.code is null or b.code is null or a.code = b.code then return jsonb_build_object('ok', false, 'reason', 'nocode'); end if;
  if coalesce(a.book, 'obs') <> coalesce(b.book, 'obs') then return jsonb_build_object('ok', false, 'reason', 'book'); end if;
  if a.phone_dev is not null then
    delete from obs_devices where dev = a.phone_dev;
    insert into obs_devices(dev, code, kind, label, last) values (a.phone_dev, b.code, 'phone', a.phone_label, a.phone_last);
  end if;
  if a.pc_dev is not null then
    delete from obs_devices where dev = a.pc_dev;
    insert into obs_devices(dev, code, kind, label, last) values (a.pc_dev, b.code, 'pc', a.pc_label, a.pc_last);
  end if;
  update obs_devices set code = b.code where code = a.code;
  update obs_codes set phone_dev = null, pc_dev = null where code = a.code;
  used := (case when b.phone_dev is not null then 1 else 0 end) + (case when b.pc_dev is not null then 1 else 0 end)
        + (select count(*) from obs_devices where code = b.code);
  rk := greatest(case a.plan when 'life' then 3 when 'year' then 2 when 'month' then 1 else 0 end,
                 case b.plan when 'life' then 3 when 'year' then 2 when 'month' then 1 else 0 end);
  pl := case rk when 3 then 'life' when 2 then 'year' when 1 then 'month' else b.plan end;
  ex := case when pl = 'life' then null else greatest(a.expires, b.expires) end;
  update obs_codes set plan = pl, expires = ex,
      active = b.active or a.active,
      maxdev = least(10, greatest(coalesce(b.maxdev, 3), coalesce(a.maxdev, 0), used)),
      activated_at = coalesce(b.activated_at, a.activated_at),
      sid = coalesce(b.sid, a.sid),
      note = case when coalesce(b.note, '') = '' then a.note else b.note end
    where code = b.code;
  if not exists (select 1 from obs_sync where code = b.code) then update obs_sync set code = b.code where code = a.code;
  else
    update obs_sync t set data = obs_jmerge(f.data, t.data), ver = t.ver + 1, updated_at = now()
      from obs_sync f where f.code = a.code and t.code = b.code;
  end if;
  delete from obs_sync where code = a.code;
  update obs_requests set code = b.code where code = a.code;
  delete from obs_codes where code = a.code;
  return jsonb_build_object('ok', true, 'devices', used);
end $$;
revoke all on function obs_merge_core(text, text) from public, anon, authenticated;

create or replace function obs_admin_merge(p_from text, p_into text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  return obs_merge_core(p_from, p_into);
end $$;

create or replace function obs_admin_merge2(p_from text, p_into text, p_plan text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a obs_codes; b obs_codes; r jsonb; ex timestamptz;
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  if p_plan not in ('month', 'year', 'life') then raise exception 'plan'; end if;
  select * into a from obs_codes where code = p_from;
  select * into b from obs_codes where code = p_into;
  r := obs_merge_core(p_from, p_into);
  if not coalesce((r ->> 'ok')::boolean, false) then return r; end if;
  ex := case when p_plan = 'life' then null
             when greatest(a.expires, b.expires) is not null then greatest(a.expires, b.expires)
             when p_plan = 'month' then now() + interval '1 month'
             else now() + interval '1 year' end;
  update obs_codes set plan = p_plan, expires = ex, active = true where code = p_into;
  return r;
end $$;
revoke all on function obs_admin_merge(text, text) from public, anon;
grant execute on function obs_admin_merge(text, text) to authenticated;
revoke all on function obs_admin_merge2(text, text, text) from public, anon;
grant execute on function obs_admin_merge2(text, text, text) to authenticated;

-- auto join: the same student's subscription of this book, found from the other books' devices on this phone OR from this book's
-- earlier device numbers on this phone; a full subscription lets the new number take the place of the earlier one it replaces
create or replace function obs_auto_join(p_dev text, p_kind text, p_label text, p_book text, p_others text[]) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  bk text := coalesce(nullif(p_book, ''), 'obs');
  seen text; o text; c obs_codes; sids text[] := '{}'; phones text[] := '{}'; olds text[] := '{}'; cd text; n int := 0;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' or bk not in ('obs', 'ped', 'srg') then
    return jsonb_build_object('ok', false, 'reason', 'bad');
  end if;
  select book into seen from obs_seen where dev = p_dev;
  if seen is not null and seen <> bk then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  if obs_code_of(p_dev) is not null then return jsonb_build_object('ok', true, 'already', true); end if;
  foreach o in array coalesce(p_others, '{}') loop
    n := n + 1; exit when n > 8;
    continue when coalesce(o, '') !~ '^[0-9a-f]{20,64}$' or o = p_dev;
    select * into c from obs_codes where code = obs_code_of(o);
    continue when not found or not c.active or (c.expires is not null and c.expires <= now());
    if coalesce(c.book, 'obs') = bk then olds := olds || o; end if;
    if c.sid is not null then sids := sids || c.sid; end if;
    if obs_phone9(split_part(coalesce(c.note, ''), '·', 2)) is not null then
      phones := phones || obs_phone9(split_part(coalesce(c.note, ''), '·', 2));
    end if;
  end loop;
  -- an earlier number of THIS book on this phone: its own subscription first
  if cardinality(olds) > 0 then
    cd := obs_code_of(olds[1]);
  else
    if cardinality(sids) = 0 and cardinality(phones) = 0 then return jsonb_build_object('ok', false, 'reason', 'none'); end if;
    select code into cd from obs_codes
     where book = bk and active and plan is not null and plan <> 'old' and (expires is null or expires > now())
       and (sid = any(sids) or obs_phone9(split_part(coalesce(note, ''), '·', 2)) = any(phones))
     order by created_at desc limit 1;
  end if;
  if cd is null then return jsonb_build_object('ok', false, 'reason', 'none'); end if;
  if obs_bind(cd, p_dev, p_kind, p_label) then return jsonb_build_object('ok', true); end if;
  -- full: the new number replaces the earlier number of this book on this phone
  if cardinality(olds) > 0 then
    delete from obs_devices where dev = olds[1] and code = cd;
    update obs_codes set phone_dev = null, phone_label = null, phone_since = null, phone_last = null where code = cd and phone_dev = olds[1];
    update obs_codes set pc_dev = null, pc_label = null, pc_since = null, pc_last = null where code = cd and pc_dev = olds[1];
    if obs_bind(cd, p_dev, p_kind, p_label) then return jsonb_build_object('ok', true, 'replaced', true); end if;
  end if;
  return jsonb_build_object('ok', false, 'reason', 'full');
end $$;
revoke all on function obs_auto_join(text, text, text, text, text[]) from public;
grant execute on function obs_auto_join(text, text, text, text, text[]) to anon, authenticated;

-- 5. merge the subscriptions a student already has twice (or more) for one book
do $$
declare g record; i int; m int := 0; s int := 0; pass int;
begin
  for pass in 1 .. 2 loop
    for g in
      with k as (
        select code, coalesce(book, 'obs') bk, expires, created_at,
               case when pass = 1 then obs_phone9(split_part(coalesce(note, ''), '·', 2)) else sid end as stu
          from obs_codes
         where active and plan in ('month', 'year', 'life'))
      select bk, stu, array_agg(code order by (expires is null) desc, expires desc nulls last, created_at desc) as codes
        from k where stu is not null and (pass = 2 or length(stu) >= 7) group by bk, stu having count(*) > 1
    loop
      s := s + 1;
      for i in 2 .. cardinality(g.codes) loop
        if (obs_merge_core(g.codes[i], g.codes[1]) ->> 'ok')::boolean then m := m + 1; end if;
      end loop;
    end loop;
  end loop;
  raise notice 'students with more than one subscription of a book: %, subscriptions merged into their other one: %', s, m;
end $$;

notify pgrst, 'reload schema';
