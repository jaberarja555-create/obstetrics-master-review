-- Permanent Exam as a subscription with plans, like the books (owner, 28 Nov 2026: «monthly 20,000 SDG, 3 months 50, 1 year 100,
-- lifetime 200»). A purchase of the exam file carries a plan; approving it gives an end date (lifetime: none). The bank opens only while
-- an approved plan has not ended; a renewal sent before the end starts where the current plan ends. Prices live here, so the phone
-- cannot change them. Other library files keep the one-time purchase. Safe to run again.
begin;

alter table public.file_buys add column if not exists plan text;
alter table public.file_buys add column if not exists expires_at timestamptz;

-- one open purchase per file, except the exam (a renewal may wait while a plan is active); for the exam, one waiting request at a time
drop index if exists public.ish_file_buys_one_open;
create unique index if not exists ish_file_buys_one_open on public.file_buys (user_id, coalesce(series_id, file_id))
  where status in ('pending','active') and file_id is distinct from '4c00d0f9-ed8e-465e-ac56-37cafe1980bc'::uuid;
create unique index if not exists ish_exam_buys_one_pending on public.file_buys (user_id)
  where status = 'pending' and file_id = '4c00d0f9-ed8e-465e-ac56-37cafe1980bc'::uuid;

create or replace function ishrah_private.exam_plans() returns jsonb
language sql immutable set search_path = '' as $$
  select '[{"id":"month","months":1,"price":20000},{"id":"quarter","months":3,"price":50000},{"id":"year","months":12,"price":100000},{"id":"life","months":null,"price":200000}]'::jsonb
$$;
revoke all on function ishrah_private.exam_plans() from public, anon, authenticated;

create or replace function ishrah_private.guard_file_buy() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  f public.files;
  actor uuid := auth.uid();
  exam uuid := '4c00d0f9-ed8e-465e-ac56-37cafe1980bc';
  p jsonb;
  base timestamptz;
begin
  if tg_op = 'INSERT' then
    if new.series_id is not null then
      select * into f from public.files where series_id = new.series_id and status = 'published' order by series_no nulls last limit 1;
      new.file_id := null;
    else
      select * into f from public.files where id = new.file_id and status = 'published';
    end if;
    if f.id is null or coalesce(f.price, 0) <= 0 then raise exception 'file_not_for_sale'; end if;
    if new.user_id is distinct from actor or f.owner_id = actor then raise exception 'request_permission'; end if;
    if not exists (select 1 from public.profiles pr where pr.id = actor and pr.status is distinct from 'blocked') then raise exception 'request_permission'; end if;
    if nullif(trim(new.payer), '') is null or nullif(trim(new.phone), '') is null or not exists (
      select 1 from storage.objects o where o.bucket_id = 'receipts' and o.name = new.receipt
        and split_part(o.name, '/', 1) = actor::text and o.metadata->>'mimetype' like 'image/%')
    then raise exception 'payment_receipt_required'; end if;
    if f.id = exam then
      select x into p from jsonb_array_elements(ishrah_private.exam_plans()) x where x->>'id' = new.plan;
      if p is null then raise exception 'exam_plan_required'; end if;
      new.price := (p->>'price')::numeric;
    else
      new.plan := null;
      new.price := f.price;
    end if;
    new.expires_at := null;
    new.title := case when new.series_id is not null then coalesce(f.series_title, f.title) else f.title end;
    new.seller_id := f.owner_id;
    new.seller_name := f.owner_name;
    new.status := 'pending'; new.share := null; new.decided_at := null; new.decided_by := null; new.note := null;
    new.created_at := now();
  else
    if not public.ish_do('pay','approve') then raise exception 'request_permission'; end if;
    new.id := old.id; new.file_id := old.file_id; new.series_id := old.series_id; new.title := old.title;
    new.user_id := old.user_id; new.seller_id := old.seller_id; new.seller_name := old.seller_name; new.plan := old.plan;
    new.price := old.price; new.payer := old.payer; new.phone := old.phone; new.receipt := old.receipt; new.created_at := old.created_at;
    if old.status <> 'pending' and new.status is distinct from old.status then raise exception 'payment_decided'; end if;
    if new.status = 'active' then
      new.share := coalesce(nullif(new.share, 0),
        (select nullif(value, '')::numeric from public.settings where id = 'file_share'), 70);
      if new.share < 0 or new.share > 100 then raise exception 'payout_amount'; end if;
    end if;
    if new.status is distinct from old.status then
      new.decided_at := now(); new.decided_by := actor;
      new.expires_at := null;
      if new.status = 'active' and old.file_id = exam and old.plan is not null and old.plan <> 'life' then
        select x into p from jsonb_array_elements(ishrah_private.exam_plans()) x where x->>'id' = old.plan;
        -- a renewal starts where the plan still running ends
        select greatest(now(), coalesce(max(b.expires_at), now())) into base from public.file_buys b
          where b.user_id = old.user_id and b.file_id = exam and b.status = 'active' and b.expires_at > now() and b.id <> old.id;
        new.expires_at := coalesce(base, now()) + make_interval(months => coalesce((p->>'months')::int, 1));
      end if;
    else
      new.expires_at := old.expires_at;
    end if;
  end if;
  return new;
end $$;
revoke all on function ishrah_private.guard_file_buy() from public, anon, authenticated;
drop trigger if exists ish_guard_file_buy on public.file_buys;
create trigger ish_guard_file_buy before insert or update on public.file_buys for each row execute function ishrah_private.guard_file_buy();

-- open only while an approved purchase has not ended (lifetime and every one-time library purchase have no end date)
create or replace function public.ish_file_open(target public.files) returns boolean
language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and (
    target.owner_id = (select auth.uid())
    or public.ish_do('library','view')
    or (target.status = 'published' and (
      coalesce(target.price, 0) <= 0
      or exists (select 1 from public.file_buys b where b.user_id = (select auth.uid()) and b.status = 'active'
        and (b.expires_at is null or b.expires_at > now())
        and (b.file_id = target.id or (target.series_id is not null and b.series_id = target.series_id)))
    ))
  )
$$;
grant execute on function public.ish_file_open(public.files) to anon, authenticated;

-- state for the exam app: plans and prices, whether open, the running plan and its end date, a waiting request
create or replace function public.ish_exam_state() returns jsonb
language sql stable security definer set search_path = '' as $$
  with me as (select (select auth.uid()) uid),
  cur as (select b.plan, b.expires_at from public.file_buys b, me
    where b.user_id = me.uid and b.file_id = '4c00d0f9-ed8e-465e-ac56-37cafe1980bc' and b.status = 'active'
      and (b.expires_at is null or b.expires_at > now())
    order by b.expires_at desc nulls first limit 1),
  wait as (select b.plan from public.file_buys b, me
    where b.user_id = me.uid and b.status = 'pending' and b.file_id = '4c00d0f9-ed8e-465e-ac56-37cafe1980bc' limit 1)
  select jsonb_build_object(
    'open', exists (select 1 from public.files f
       where f.id = '4c00d0f9-ed8e-465e-ac56-37cafe1980bc' and public.ish_file_open(f)),
    'price', (ishrah_private.exam_plans()->0->>'price')::numeric,
    'plans', ishrah_private.exam_plans(),
    'plan', (select plan from cur),
    'expires', (select expires_at from cur),
    'ended', (select me.uid is not null and not exists (select 1 from cur) and exists (select 1 from public.file_buys b
       where b.user_id = me.uid and b.file_id = '4c00d0f9-ed8e-465e-ac56-37cafe1980bc' and b.status = 'active') from me),
    'pending', exists (select 1 from wait),
    'pending_plan', (select plan from wait)
  )
$$;
grant execute on function public.ish_exam_state() to anon, authenticated;

-- the catalogue price of the exam file shows the lowest plan
alter table public.files disable trigger ish_alerts;
update public.files set price = 20000 where id = '4c00d0f9-ed8e-465e-ac56-37cafe1980bc' and price is distinct from 20000;
alter table public.files enable trigger ish_alerts;

commit;
