-- 024 · one waiting subscription request per student and book (owner, 15 Nov 2026: "in the admin the same student's
-- subscription request comes many times; a student who has sent a request should not be able to send another similar one").
--
-- Why it happened: a request was refused only when THE SAME DEVICE already had one waiting. The same student sending from a
-- second phone, a computer, or an older address of the app (each has its own device number) made a new request each time.
--
-- 1. obs_request_submit: requests of one device, and of one student (same book, same phone number), are filed one at a time
--    (a lock, so two taps at the same moment cannot both pass). When the student already has a subscription request waiting for
--    this book, a request from another device is NOT filed as a new subscription request: it is kept as that device's request to
--    join the student's subscription (plan 'device', column joins = the waiting request). A receipt sent with it is added to the
--    waiting request if that one has none. The device shows "request under review" as before.
-- 2. obs_admin_decide: approving a request also adds every device that joined it (each device opens by itself); rejecting it also
--    rejects them, with the same reason.
-- 3. Requests already waiting: copies from the same device are cancelled (the newest stays); copies of one student and book from
--    several devices join the request that has a receipt (else the oldest).
-- The admin page shows one card per student and book, with the devices that will join.

alter table obs_requests add column if not exists joins uuid;
create index if not exists obs_requests_joins on obs_requests(joins) where joins is not null;

create or replace function obs_request_submit(p_dev text, p_kind text, p_label text, p_name text, p_phone text, p_plan text,
  p_comment text, p_mime text, p_data text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare rid uuid; has boolean := length(coalesce(p_data, '')) > 0; bk text; p9 text; mainid uuid;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  if p_plan not in ('month', 'year', 'life', 'device') then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  if length(trim(coalesce(p_name, ''))) < 2 or length(p_name) > 60 then return jsonb_build_object('ok', false, 'reason', 'name'); end if;
  if coalesce(p_phone, '') !~ '^[0-9+ ]{7,20}$' then return jsonb_build_object('ok', false, 'reason', 'phone'); end if;
  if p_plan <> 'device' and has then
    if p_mime not in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf') then return jsonb_build_object('ok', false, 'reason', 'file'); end if;
    if length(p_data) < 200 or length(p_data) > 2000000 then return jsonb_build_object('ok', false, 'reason', 'file'); end if;
  end if;
  bk := obs_book_of(p_dev); p9 := obs_phone9(p_phone);
  -- one at a time per device and per student of this book
  perform pg_advisory_xact_lock(hashtext('obsreq-dev:' || p_dev));
  if p9 is not null then perform pg_advisory_xact_lock(hashtext('obsreq-ph:' || bk || ':' || p9)); end if;
  if exists (select 1 from obs_requests where dev = p_dev and status = 'pending') then return jsonb_build_object('ok', false, 'reason', 'pending'); end if;
  if (select count(*) from obs_requests where dev = p_dev and created > now() - interval '1 day') >= 8 then return jsonb_build_object('ok', false, 'reason', 'many'); end if;
  if (select count(*) from obs_requests where status = 'pending') >= 500 then return jsonb_build_object('ok', false, 'reason', 'busy'); end if;
  -- the same student already has a subscription request waiting for this book: this device joins it
  if p_plan <> 'device' and p9 is not null and length(p9) >= 7 then
    select id into mainid from obs_requests
     where status = 'pending' and book = bk and plan <> 'device' and joins is null and obs_phone9(phone) = p9
     order by created limit 1;
    if mainid is not null then
      insert into obs_requests(dev, kind, label, name, phone, plan, comment, joins)
        values (p_dev, case when p_kind = 'phone' then 'phone' else 'pc' end, left(p_label, 60), trim(p_name), trim(p_phone), 'device',
                left(coalesce(p_comment, ''), 500), mainid)
        returning id into rid;
      if has and not exists (select 1 from obs_receipts where req = mainid) then
        insert into obs_receipts(req, mime, data) values (mainid, p_mime, p_data);
      end if;
      return jsonb_build_object('ok', true, 'id', rid, 'joined', mainid);
    end if;
  end if;
  insert into obs_requests(dev, kind, label, name, phone, plan, comment)
    values (p_dev, case when p_kind = 'phone' then 'phone' else 'pc' end, left(p_label, 60), trim(p_name), trim(p_phone), p_plan, left(coalesce(p_comment, ''), 500))
    returning id into rid;
  if p_plan <> 'device' and has then insert into obs_receipts(req, mime, data) values (rid, p_mime, p_data); end if;
  return jsonb_build_object('ok', true, 'id', rid);
end $$;

create or replace function obs_admin_decide(p_id uuid, p_ok boolean, p_name text, p_plan text, p_reason text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r obs_requests; r2 obs_requests; g jsonb; cd text; pl text; n int := 0; nf int := 0; b jsonb;
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  select * into r from obs_requests where id = p_id for update;
  if not found or r.status <> 'pending' then return jsonb_build_object('ok', false, 'reason', 'done'); end if;
  if not p_ok then
    update obs_requests set status = 'rejected', reason = left(coalesce(p_reason, ''), 300), decided = now() where id = p_id;
    update obs_requests set status = 'rejected', reason = left(coalesce(p_reason, ''), 300), decided = now() where joins = p_id and status = 'pending';
    return jsonb_build_object('ok', true);
  end if;
  pl := case when coalesce(p_plan, '') in ('month', 'year', 'life') then p_plan else r.plan end;
  if pl = 'device' then
    cd := obs_code_by_phone(coalesce(r.book, 'obs'), r.phone);
    if cd is null then return jsonb_build_object('ok', false, 'reason', 'nosub'); end if;
    return obs_req_bind(r, cd);
  end if;
  g := obs_grant(r.dev, r.kind, r.label, coalesce(nullif(trim(p_name), ''), r.name), r.phone, pl);
  if not (g->>'ok')::boolean then return g; end if;
  update obs_requests set status = 'approved', decided = now(), code = g->>'code', plan = pl,
    name = coalesce(nullif(trim(p_name), ''), r.name) where id = p_id;
  -- the student's other devices that sent the same request join the new subscription
  for r2 in select * from obs_requests where joins = p_id and status = 'pending' order by created loop
    b := obs_req_bind(r2, g->>'code');
    if (b->>'ok')::boolean then n := n + 1; else nf := nf + 1; end if;
  end loop;
  return g || jsonb_build_object('joined', n, 'joinfail', nf);
end $$;

-- requests already waiting
-- (a) the same device twice: the newest stays
update obs_requests r set status = 'cancelled', decided = now(), reason = 'Duplicate request'
 where r.status = 'pending'
   and exists (select 1 from obs_requests r2 where r2.status = 'pending' and r2.dev = r.dev and (r2.created, r2.id) > (r.created, r.id));
-- (b) one student and book from several devices: the request with a receipt (else the oldest) stays; the others join it
with g as (
  select q.id, q.book, obs_phone9(q.phone) p9,
         row_number() over (partition by q.book, obs_phone9(q.phone)
                            order by (exists (select 1 from obs_receipts x where x.req = q.id)) desc, q.created, q.id) rn
    from obs_requests q
   where q.status = 'pending' and q.plan <> 'device' and q.joins is null and length(coalesce(obs_phone9(q.phone), '')) >= 7),
m as (select book, p9, id mid from g where rn = 1)
update obs_requests r set plan = 'device', joins = m.mid
  from g join m on m.book = g.book and m.p9 = g.p9
 where r.id = g.id and g.rn > 1;
