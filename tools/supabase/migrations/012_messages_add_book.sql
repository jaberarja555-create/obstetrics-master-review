-- Owner, 13 Nov 2026: "the admin can send a message to a student, seen in the notifications; the student can send a message to the admin
-- page; and in the student's subscription area the admin can add another book subscription". Written to be run more than once safely.

-- 1. Messages. One conversation per student: 'p:' + the last 9 digits of the subscription's phone (the same student in every book),
--    'c:' + code for a subscription with no phone, 'd:' + device for a student with no subscription. dir 'in' = from the student,
--    'out' = from the owner. seen = the owner has read an incoming message (the app keeps its own read marks).
create table if not exists obs_msgs (
  id bigserial primary key,
  tk text not null,
  dir text not null check (dir in ('in', 'out')),
  dev text, book text, name text, phone text,
  body text not null,
  created timestamptz not null default now(),
  seen boolean not null default false
);
create index if not exists obs_msgs_tk on obs_msgs(tk, id);
alter table obs_msgs enable row level security;

-- the conversation of a device: its subscription's phone, else its code, else the device itself
create or replace function obs_tk_of(p_dev text) returns text
language plpgsql stable security definer set search_path = public as $$
declare cd text := obs_code_of(p_dev); nt text; p9 text;
begin
  if cd is null then return 'd:' || p_dev; end if;
  select note into nt from obs_codes where code = cd;
  p9 := obs_phone9(split_part(coalesce(nt, ''), '·', 2));
  if p9 is not null and length(p9) >= 7 then return 'p:' || p9; end if;
  return 'c:' || cd;
end $$;
revoke all on function obs_tk_of(text) from public, anon, authenticated;

-- the student sends a message (any device, subscribed or not); a few limits keep it from being misused
create or replace function obs_msg_send(p_dev text, p_name text, p_phone text, p_body text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare b text := left(trim(coalesce(p_body, '')), 1500); rid bigint;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  if length(b) < 1 then return jsonb_build_object('ok', false, 'reason', 'empty'); end if;
  if (select count(*) from obs_msgs where dev = p_dev and dir = 'in' and created > now() - interval '1 day') >= 30 then
    return jsonb_build_object('ok', false, 'reason', 'many'); end if;
  if (select count(*) from obs_msgs where dir = 'in' and not seen) >= 3000 then return jsonb_build_object('ok', false, 'reason', 'busy'); end if;
  insert into obs_msgs(tk, dir, dev, book, name, phone, body)
    values (obs_tk_of(p_dev), 'in', p_dev, coalesce(obs_book_of(p_dev), 'obs'), left(trim(coalesce(p_name, '')), 60),
            left(regexp_replace(coalesce(p_phone, ''), '[^0-9+ ]', '', 'g'), 20), b)
    returning id into rid;
  return jsonb_build_object('ok', true, 'id', rid);
end $$;

-- the device reads its conversation (its subscription's, and what it wrote before it subscribed)
create or replace function obs_msg_list(p_dev text, p_after bigint) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare t text;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' then return '[]'::jsonb; end if;
  t := obs_tk_of(p_dev);
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'dir', dir, 'body', body, 't', created) order by id)
    from (select * from obs_msgs where (tk = t or tk = 'd:' || p_dev) and id > coalesce(p_after, 0) order by id desc limit 200) m), '[]'::jsonb);
end $$;

-- the owner: every conversation of the last 120 days, a reply, read marks, removing a message
create or replace function obs_admin_msgs() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  return coalesce((select jsonb_agg(to_jsonb(m) order by m.id) from obs_msgs m where m.created > now() - interval '120 days'), '[]'::jsonb);
end $$;

create or replace function obs_admin_msg_send(p_tk text, p_body text) returns bigint
language plpgsql security definer set search_path = public as $$
declare b text := left(trim(coalesce(p_body, '')), 3000); rid bigint;
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  if coalesce(p_tk, '') !~ '^(p:[0-9]{7,9}|c:[A-Z0-9-]{6,20}|d:[0-9a-f]{20,64})$' or length(b) < 1 then raise exception 'bad'; end if;
  insert into obs_msgs(tk, dir, body) values (p_tk, 'out', b) returning id into rid;
  return rid;
end $$;

create or replace function obs_admin_msg_seen(p_tk text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  update obs_msgs set seen = true where tk = p_tk and dir = 'in' and not seen;
end $$;

create or replace function obs_admin_msg_delete(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  delete from obs_msgs where id = p_id;
end $$;

-- 2. The owner adds a subscription of another book to a student. It is made with the student's name and phone; the student's device in
--    that book joins it with a link number that stays valid 14 days (the same «مشترك على جهاز آخر» step the app already has), so the
--    owner needs no device number. Answers the code and the link number; 'there' when the student already has that book.
create or replace function obs_admin_add_book(p_book text, p_name text, p_phone text, p_plan text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  p9 text := obs_phone9(p_phone); s text; pn text; ex timestamptz; nt text; old text;
  a text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; j int; b bytea;
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  if p_book not in ('obs', 'ped', 'srg') or p_plan not in ('month', 'year', 'life') then raise exception 'bad'; end if;
  if p9 is not null and length(p9) >= 7 then
    select code into old from obs_codes where book = p_book and plan is not null and plan <> 'old'
      and obs_phone9(split_part(coalesce(note, ''), '·', 2)) = p9 order by created_at desc limit 1;
    if old is not null then return jsonb_build_object('ok', false, 'reason', 'there', 'code', old); end if;
  end if;
  nt := left(trim(coalesce(p_name, '')) || case when coalesce(p_phone, '') <> '' then ' · ' || trim(p_phone) else '' end, 200);
  loop
    b := uuid_send(gen_random_uuid()); s := case p_book when 'ped' then 'PMR-' when 'srg' then 'SMR-' else 'OBS-' end;
    for j in 0 .. 7 loop
      s := s || substr(a, (get_byte(b, j) % 32) + 1, 1);
      if j = 3 then s := s || '-'; end if;
    end loop;
    exit when not exists (select 1 from obs_codes where code = s);
  end loop;
  ex := case p_plan when 'month' then now() + interval '1 month' when 'year' then now() + interval '1 year' else null end;
  insert into obs_codes(code, note, plan, expires, activated_at, maxdev, book, active) values (s, nt, p_plan, ex, now(), 3, p_book, true);
  loop
    pn := lpad((floor(random() * 100000000))::bigint::text, 8, '0');
    exit when not exists (select 1 from obs_pair x where x.pin = pn);
  end loop;
  insert into obs_pair(pin, code, exp) values (pn, s, now() + interval '14 days');
  return jsonb_build_object('ok', true, 'code', s, 'pin', pn, 'exp', ex);
end $$;

-- a new link number for a subscription (the owner sends it again when the first one was lost or ran out)
create or replace function obs_admin_pin(p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare pn text;
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  if not exists (select 1 from obs_codes where code = p_code) then raise exception 'bad'; end if;
  delete from obs_pair where code = p_code or exp < now();
  loop
    pn := lpad((floor(random() * 100000000))::bigint::text, 8, '0');
    exit when not exists (select 1 from obs_pair x where x.pin = pn);
  end loop;
  insert into obs_pair(pin, code, exp) values (pn, p_code, now() + interval '14 days');
  return pn;
end $$;

revoke all on function obs_msg_send(text, text, text, text) from public;
revoke all on function obs_msg_list(text, bigint) from public;
grant execute on function obs_msg_send(text, text, text, text) to anon, authenticated;
grant execute on function obs_msg_list(text, bigint) to anon, authenticated;
revoke all on function obs_admin_msgs() from public;
revoke all on function obs_admin_msg_send(text, text) from public;
revoke all on function obs_admin_msg_seen(text) from public;
revoke all on function obs_admin_msg_delete(bigint) from public;
revoke all on function obs_admin_add_book(text, text, text, text) from public;
revoke all on function obs_admin_pin(text) from public;
grant execute on function obs_admin_msgs() to authenticated;
grant execute on function obs_admin_msg_send(text, text) to authenticated;
grant execute on function obs_admin_msg_seen(text) to authenticated;
grant execute on function obs_admin_msg_delete(bigint) to authenticated;
grant execute on function obs_admin_add_book(text, text, text, text) to authenticated;
grant execute on function obs_admin_pin(text) to authenticated;

notify pgrst, 'reload schema';
