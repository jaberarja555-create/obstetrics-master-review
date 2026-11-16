-- 027 · one phone = one device, with Face ID / fingerprint (owner, 15–16 Nov 2026: "even if he opens from Safari the device must be one").
--
-- An iPhone keeps Safari and the Home-screen app apart: a web page cannot see that they are the same phone, so each place gets its own
-- device number. A passkey (Face ID, Touch ID or fingerprint) is kept by the phone itself (iCloud Keychain / Google Password Manager) and is
-- the same in Safari, in the Home-screen app and in any browser on that phone.
--
-- 1. A subscribed student turns it on once in Student Master Review (studentmasterreview.com): the phone makes a passkey for
--    studentmasterreview.com; its public key is kept here with the subscriptions of the books that are subscribed on that page (obs_pk).
-- 2. In a new place (Safari ↔ Home-screen app, another browser, a cleared phone) the student taps «افتح بالبصمة أو Face ID»: the phone signs a
--    one-time challenge; the signature is checked HERE (obs_p256_verify: ECDSA P-256 written in SQL, no outside service), and each book's
--    device number of that place joins the student's subscription of that book at once, with no request and no approval.
-- 3. Device numbers that came in with the same passkey are ONE device (obs_devlink): they take one place of the subscription's device
--    limit, and the admin shows them once.
-- 4. obs_pk_bind: books opened later in the same place join with the token the place received (no second Face ID).

create table if not exists obs_pk (cred text primary key, x text not null, y text not null, codes text[] not null default '{}',
  created timestamptz not null default now(), last timestamptz, uses int not null default 0);
create table if not exists obs_pkch (ch text primary key, kind text not null, created timestamptz not null default now());
create table if not exists obs_pkt (tok text primary key, cred text not null references obs_pk(cred) on delete cascade,
  created timestamptz not null default now(), last timestamptz);
create table if not exists obs_devlink (dev text primary key, cred text not null, at timestamptz not null default now());
create index if not exists obs_devlink_cred on obs_devlink(cred);
alter table obs_pk enable row level security;
alter table obs_pkch enable row level security;
alter table obs_pkt enable row level security;
alter table obs_devlink enable row level security;

-- ---------- numbers ----------
create or replace function obs_b2n(b bytea) returns numeric
language plpgsql immutable as $$
declare v numeric := 0; i int;
begin
  for i in 0 .. length(b) - 1 loop v := v * 256 + get_byte(b, i); end loop;
  return v;
end $$;

create or replace function obs_modinv(a numeric, m numeric) returns numeric
language plpgsql immutable as $$
declare t numeric := 0; nt numeric := 1; r numeric := m; nr numeric; q numeric; x numeric;
begin
  nr := mod(a, m); if nr < 0 then nr := nr + m; end if;
  while nr <> 0 loop
    q := div(r, nr);
    x := t - q * nt; t := nt; nt := x;
    x := r - q * nr; r := nr; nr := x;
  end loop;
  if r <> 1 then return null; end if;
  if t < 0 then t := t + m; end if;
  return t;
end $$;

-- Jacobian point doubling on P-256 (a = -3); a point is {X, Y, Z}, Z = 0 is the point at infinity
create or replace function obs_p256_dbl(pt numeric[]) returns numeric[]
language plpgsql immutable as $$
declare p numeric := 115792089210356248762697446949407573530086143415290314195533631308867097853951;
  x numeric := pt[1]; y numeric := pt[2]; z numeric := pt[3]; dl numeric; gm numeric; bt numeric; al numeric; x3 numeric; y3 numeric; z3 numeric;
begin
  if z = 0 or y = 0 then return array[0, 1, 0]::numeric[]; end if;
  dl := mod(z * z, p); gm := mod(y * y, p); bt := mod(x * gm, p);
  al := mod(3 * (x - dl) * (x + dl), p);
  x3 := mod(al * al - 8 * bt, p);
  z3 := mod((y + z) * (y + z) - gm - dl, p);
  y3 := mod(al * (4 * bt - x3) - 8 * gm * gm, p);
  if x3 < 0 then x3 := x3 + p; end if; if y3 < 0 then y3 := y3 + p; end if; if z3 < 0 then z3 := z3 + p; end if;
  return array[x3, y3, z3];
end $$;

create or replace function obs_p256_add(a numeric[], b numeric[]) returns numeric[]
language plpgsql immutable as $$
declare p numeric := 115792089210356248762697446949407573530086143415290314195533631308867097853951;
  z1z1 numeric; z2z2 numeric; u1 numeric; u2 numeric; s1 numeric; s2 numeric; h numeric; i numeric; j numeric; r numeric; v numeric;
  x3 numeric; y3 numeric; z3 numeric;
begin
  if a[3] = 0 then return b; end if;
  if b[3] = 0 then return a; end if;
  z1z1 := mod(a[3] * a[3], p); z2z2 := mod(b[3] * b[3], p);
  u1 := mod(a[1] * z2z2, p); u2 := mod(b[1] * z1z1, p);
  s1 := mod(a[2] * b[3] * z2z2, p); s2 := mod(b[2] * a[3] * z1z1, p);
  h := mod(u2 - u1, p); if h < 0 then h := h + p; end if;
  r := mod(2 * (s2 - s1), p); if r < 0 then r := r + p; end if;
  if h = 0 then
    if r = 0 then return obs_p256_dbl(a); end if;
    return array[0, 1, 0]::numeric[];
  end if;
  i := mod(4 * h * h, p); j := mod(h * i, p); v := mod(u1 * i, p);
  x3 := mod(r * r - j - 2 * v, p); if x3 < 0 then x3 := x3 + p; end if;
  y3 := mod(r * (v - x3) - 2 * s1 * j, p); if y3 < 0 then y3 := y3 + p; end if;
  z3 := mod(((a[3] + b[3]) * (a[3] + b[3]) - z1z1 - z2z2) * h, p); if z3 < 0 then z3 := z3 + p; end if;
  return array[x3, y3, z3];
end $$;

create or replace function obs_p256_on(qx numeric, qy numeric) returns boolean
language sql immutable as $$
  select qx >= 0 and qy >= 0
     and qx < 115792089210356248762697446949407573530086143415290314195533631308867097853951
     and qy < 115792089210356248762697446949407573530086143415290314195533631308867097853951
     and mod(qy * qy - (qx * qx * qx - 3 * qx + 41058363725152142129326129780047268409114441015993725554835256314039467401291), 115792089210356248762697446949407573530086143415290314195533631308867097853951) = 0 $$;

-- ECDSA P-256 verification: e = the SHA-256 of the signed data (as a number), (r, s) the signature, (qx, qy) the public key
create or replace function obs_p256_verify(qx numeric, qy numeric, e numeric, r numeric, s numeric) returns boolean
language plpgsql immutable as $$
declare p numeric := 115792089210356248762697446949407573530086143415290314195533631308867097853951;
  n numeric := 115792089210356248762697446949407573529996955224135760342422259061068512044369;
  g numeric[] := array[48439561293906451759052585252797914202762949526041747995844080717082404635286,
                      36134250956749795798585127919587881956611106672985015071877198253568414405109, 1];
  q numeric[]; gq numeric[]; acc numeric[] := array[0, 1, 0]::numeric[];
  w numeric; u1 numeric; u2 numeric; b1 int; b2 int; i int; zi numeric; xa numeric; t1 numeric; t2 numeric; two numeric;
begin
  if r <= 0 or r >= n or s <= 0 or s >= n or not obs_p256_on(qx, qy) then return false; end if;
  q := array[qx, qy, 1];
  gq := obs_p256_add(g, q);
  w := obs_modinv(s, n);
  u1 := mod(mod(e, n) * w, n); u2 := mod(r * w, n);
  for i in reverse 255 .. 0 loop
    acc := obs_p256_dbl(acc);
    two := power(2::numeric, i);
    b1 := mod(div(u1, two), 2)::int; b2 := mod(div(u2, two), 2)::int;
    if b1 = 1 and b2 = 1 then acc := obs_p256_add(acc, gq);
    elsif b1 = 1 then acc := obs_p256_add(acc, g);
    elsif b2 = 1 then acc := obs_p256_add(acc, q); end if;
  end loop;
  if acc[3] = 0 then return false; end if;
  zi := obs_modinv(acc[3], p);
  xa := mod(acc[1] * zi * zi, p);
  return mod(xa, n) = r;
end $$;

-- the r and s of a DER signature (30 len 02 lr r 02 ls s)
create or replace function obs_der_rs(sig bytea) returns numeric[]
language plpgsql immutable as $$
declare o int := 2; lr int; ls int;
begin
  if length(sig) < 8 or get_byte(sig, 0) <> 48 then return null; end if;
  if get_byte(sig, 1) >= 128 then o := 2 + (get_byte(sig, 1) - 128); end if;
  if get_byte(sig, o) <> 2 then return null; end if;
  lr := get_byte(sig, o + 1);
  if get_byte(sig, o + 2 + lr) <> 2 then return null; end if;
  ls := get_byte(sig, o + 3 + lr);
  return array[obs_b2n(substring(sig from o + 3 for lr)), obs_b2n(substring(sig from o + 5 + lr for ls))];
end $$;

create or replace function obs_b64u(b bytea) returns text
language sql immutable as $$ select rtrim(translate(replace(encode(b, 'base64'), E'\n', ''), '+/', '-_'), '=') $$;

-- ---------- a device that came in with a passkey counts once (obs_bind: places are counted per phone) ----------
create or replace function obs_bind(p_code text, p_dev text, p_kind text, p_label text) returns boolean
language plpgsql security definer set search_path = public as $$
declare c obs_codes; used int; mine text; same boolean;
begin
  select * into c from obs_codes where code = p_code for update;
  if not found then return false; end if;
  if c.phone_dev = p_dev or c.pc_dev = p_dev or exists (select 1 from obs_devices where dev = p_dev and code = p_code) then return true; end if;
  select cred into mine from obs_devlink where dev = p_dev;
  with x as (select c.phone_dev dev where c.phone_dev is not null union all select c.pc_dev where c.pc_dev is not null
             union all select dev from obs_devices where code = p_code)
  select count(distinct coalesce(l.cred, x.dev)), coalesce(bool_or(mine is not null and l.cred = mine), false)
    into used, same from x left join obs_devlink l on l.dev = x.dev;
  if used >= greatest(coalesce(c.maxdev, 2), 1) and not same then return false; end if;
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

-- ---------- passkeys ----------
create or replace function obs_pk_ch(p_kind text) returns text
language plpgsql security definer set search_path = public as $$
declare v text := obs_b64u(uuid_send(gen_random_uuid()) || uuid_send(gen_random_uuid()));
begin
  delete from obs_pkch where created < now() - interval '10 minutes';
  if (select count(*) from obs_pkch) >= 2000 then return null; end if;
  insert into obs_pkch(ch, kind) values (v, case when p_kind = 'reg' then 'reg' else 'get' end);
  return v;
end $$;

-- clientDataJSON check: type, a challenge this server gave (used once), the platform's address
create or replace function obs_pk_cdj(p_cdj text, p_type text, p_kind text) returns boolean
language plpgsql security definer set search_path = public as $$
declare j jsonb; got text;
begin
  if coalesce(p_cdj, '') !~ '^[0-9a-f]+$' or length(p_cdj) not between 20 and 4000 then return false; end if;
  begin j := convert_from(decode(p_cdj, 'hex'), 'UTF8')::jsonb; exception when others then return false; end;
  if coalesce(j ->> 'type', '') <> p_type then return false; end if;
  if coalesce(j ->> 'origin', '') <> 'https://studentmasterreview.com' then return false; end if;
  if coalesce(j ->> 'crossOrigin', 'false') <> 'false' then return false; end if;
  delete from obs_pkch c where c.ch = j ->> 'challenge' and c.kind = p_kind and c.created > now() - interval '10 minutes' returning c.ch into got;
  return got is not null;
end $$;

-- the student's subscription of a book for a passkey: one of its own subscriptions of that book, else the same student's (student id or phone)
create or replace function obs_pk_code(p_cred text, p_book text) returns text
language sql stable security definer set search_path = public as $$
  with mine as (select c.* from obs_pk k join obs_codes c on c.code = any(k.codes) where k.cred = p_cred)
  select code from obs_codes o
   where coalesce(o.book, 'obs') = p_book and o.active and o.plan in ('month', 'year', 'life')
     and (o.code in (select code from mine)
          or (o.sid is not null and o.sid in (select sid from mine where sid is not null))
          or (length(coalesce(obs_phone9(split_part(coalesce(o.note, ''), '·', 2)), '')) >= 7
              and obs_phone9(split_part(coalesce(o.note, ''), '·', 2)) in (select obs_phone9(split_part(coalesce(note, ''), '·', 2)) from mine)))
   order by (o.code in (select code from mine)) desc, (o.expires is null or o.expires > now()) desc, o.expires desc nulls first, o.created_at desc
   limit 1 $$;

create or replace function obs_pk_join(p_cred text, p_book text, p_dev text, p_kind text, p_label text) returns text
language plpgsql security definer set search_path = public as $$
declare cd text; seen text;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' or p_book not in ('obs', 'ped', 'srg') then return 'bad'; end if;
  select book into seen from obs_seen where dev = p_dev;
  if seen is not null and seen <> p_book then return 'bad'; end if;
  if seen is null then
    insert into obs_seen(dev, kind, label, book) values (p_dev, case when p_kind = 'phone' then 'phone' else 'pc' end, left(coalesce(p_label, ''), 60), p_book)
      on conflict (dev) do nothing;
  end if;
  cd := obs_pk_code(p_cred, p_book);
  if cd is null then return 'none'; end if;
  insert into obs_devlink(dev, cred) values (p_dev, p_cred) on conflict (dev) do update set cred = excluded.cred, at = now();
  if obs_code_of(p_dev) = cd then return 'already'; end if;
  if not obs_bind(cd, p_dev, p_kind, coalesce(nullif(p_label, ''), 'Phone')) then
    update obs_codes set maxdev = least(10, coalesce(maxdev, 3) + 1) where code = cd;
    if not obs_bind(cd, p_dev, p_kind, coalesce(nullif(p_label, ''), 'Phone')) then return 'full'; end if;
  end if;
  update obs_pk set codes = (select array_agg(distinct x) from unnest(codes || cd) x) where cred = p_cred;
  return 'ok';
end $$;
revoke all on function obs_pk_join(text, text, text, text, text) from public, anon, authenticated;

-- turn on: a subscribed device of this page gives the passkey's public key (p_devs = [{b, d, k, l}] of the books on this page)
create or replace function obs_pk_register(p_dev text, p_cred text, p_x text, p_y text, p_cdj text, p_devs jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare cd text; codes text[] := '{}'; e jsonb; d text; c2 text; k obs_pk; tok text;
begin
  if (coalesce(p_cred, '') !~ '^[A-Za-z0-9_-]+$' or length(p_cred) not between 16 and 400) or coalesce(p_x, '') !~ '^[0-9a-f]{64}$' or coalesce(p_y, '') !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  cd := obs_code_of(p_dev);
  if cd is null or not exists (select 1 from obs_codes where code = cd and active and (expires is null or expires > now())) then
    return jsonb_build_object('ok', false, 'reason', 'nosub'); end if;
  if not obs_pk_cdj(p_cdj, 'webauthn.create', 'reg') then return jsonb_build_object('ok', false, 'reason', 'check'); end if;
  if not obs_p256_on(obs_b2n(decode(p_x, 'hex')), obs_b2n(decode(p_y, 'hex'))) then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  select * into k from obs_pk where cred = p_cred;
  if found and (k.x <> p_x or k.y <> p_y) then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  -- the subscriptions of the books subscribed on this page
  for e in select * from jsonb_array_elements(coalesce(p_devs, '[]'::jsonb)) loop
    d := e ->> 'd'; continue when coalesce(d, '') !~ '^[0-9a-f]{20,64}$';
    c2 := obs_code_of(d);
    if c2 is not null and exists (select 1 from obs_codes where code = c2 and active and (expires is null or expires > now())) then
      codes := codes || c2;
      insert into obs_devlink(dev, cred) values (d, p_cred) on conflict (dev) do update set cred = excluded.cred, at = now();
    end if;
  end loop;
  codes := codes || cd;
  insert into obs_devlink(dev, cred) values (p_dev, p_cred) on conflict (dev) do update set cred = excluded.cred, at = now();
  insert into obs_pk(cred, x, y, codes) values (p_cred, p_x, p_y, (select array_agg(distinct x) from unnest(codes) x))
    on conflict (cred) do update set codes = (select array_agg(distinct x) from unnest(obs_pk.codes || excluded.codes) x);
  tok := encode(uuid_send(gen_random_uuid()) || uuid_send(gen_random_uuid()), 'hex');
  insert into obs_pkt(tok, cred) values (tok, p_cred);
  return jsonb_build_object('ok', true, 'tok', tok);
end $$;

-- open with the passkey: checks the signature, then joins each book's device number of this page to the student's subscription
create or replace function obs_pk_login(p_cred text, p_cdj text, p_ad text, p_sig text, p_devs jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare k obs_pk; ad bytea; rs numeric[]; e jsonb; res jsonb := '{}'::jsonb; tok text; st text;
begin
  select * into k from obs_pk where cred = p_cred;
  if not found then return jsonb_build_object('ok', false, 'reason', 'unknown'); end if;
  if coalesce(p_ad, '') !~ '^[0-9a-f]+$' or length(p_ad) not between 74 and 2000 or coalesce(p_sig, '') !~ '^[0-9a-f]+$' or length(p_sig) not between 16 and 200 then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  ad := decode(p_ad, 'hex');
  if substring(ad from 1 for 32) <> sha256(convert_to('studentmasterreview.com', 'UTF8')) then return jsonb_build_object('ok', false, 'reason', 'check'); end if;
  if get_byte(ad, 32) & 5 <> 5 then return jsonb_build_object('ok', false, 'reason', 'check'); end if;   -- user present and verified
  if not obs_pk_cdj(p_cdj, 'webauthn.get', 'get') then return jsonb_build_object('ok', false, 'reason', 'check'); end if;
  rs := obs_der_rs(decode(p_sig, 'hex'));
  if rs is null or not obs_p256_verify(obs_b2n(decode(k.x, 'hex')), obs_b2n(decode(k.y, 'hex')),
                                       obs_b2n(sha256(ad || sha256(decode(p_cdj, 'hex')))), rs[1], rs[2]) then
    return jsonb_build_object('ok', false, 'reason', 'check'); end if;
  update obs_pk set last = now(), uses = uses + 1 where cred = p_cred;
  for e in select * from jsonb_array_elements(coalesce(p_devs, '[]'::jsonb)) loop
    st := obs_pk_join(p_cred, e ->> 'b', e ->> 'd', e ->> 'k', e ->> 'l');
    res := res || jsonb_build_object(coalesce(e ->> 'b', '?'), st);
  end loop;
  tok := encode(uuid_send(gen_random_uuid()) || uuid_send(gen_random_uuid()), 'hex');
  insert into obs_pkt(tok, cred) values (tok, p_cred);
  return jsonb_build_object('ok', true, 'tok', tok, 'books', res);
end $$;

-- a book opened later on the same page joins with the page's token
create or replace function obs_pk_bind(p_tok text, p_book text, p_dev text, p_kind text, p_label text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t obs_pkt;
begin
  select * into t from obs_pkt where tok = p_tok;
  if not found then return jsonb_build_object('ok', false, 'reason', 'tok'); end if;
  update obs_pkt set last = now() where tok = p_tok;
  return jsonb_build_object('ok', true, 'st', obs_pk_join(t.cred, p_book, p_dev, p_kind, p_label));
end $$;

-- a page asks whether its passkey token still works (the student may have been removed)
create or replace function obs_pk_has(p_tok text) returns boolean
language sql stable security definer set search_path = public as $$ select exists (select 1 from obs_pkt where tok = p_tok) $$;

-- admin: which device numbers belong to one phone (same passkey)
create or replace function obs_admin_devlinks() returns table(dev text, cred text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  return query select l.dev, left(l.cred, 12) from obs_devlink l;
end $$;

revoke all on function obs_pk_ch(text), obs_pk_cdj(text, text, text), obs_pk_code(text, text), obs_pk_register(text, text, text, text, text, jsonb),
  obs_pk_login(text, text, text, text, jsonb), obs_pk_bind(text, text, text, text, text), obs_pk_has(text), obs_admin_devlinks() from public;
grant execute on function obs_pk_ch(text), obs_pk_register(text, text, text, text, text, jsonb), obs_pk_login(text, text, text, text, jsonb),
  obs_pk_bind(text, text, text, text, text), obs_pk_has(text) to anon, authenticated;
grant execute on function obs_admin_devlinks() to authenticated;

notify pgrst, 'reload schema';
