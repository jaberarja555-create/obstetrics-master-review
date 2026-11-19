-- Keep Bankak details and lecturer receipts private. Finance records transfers against the earnings that funded them.
begin;

create table if not exists public.lecturer_payout_accounts (
  id uuid primary key references public.lecturers on delete cascade,
  account text not null check (char_length(btrim(account)) between 1 and 80),
  account_name text not null check (char_length(btrim(account_name)) between 1 and 150)
);
alter table public.lecturer_payout_accounts enable row level security;
revoke all on public.lecturer_payout_accounts from public, anon, authenticated;
grant select, insert, update on public.lecturer_payout_accounts to authenticated;
drop policy if exists own_or_finance on public.lecturer_payout_accounts;
create policy own_or_finance on public.lecturer_payout_accounts for select to authenticated
  using (id = (select auth.uid()) or (select public.ish_do('payout','approve')));
drop policy if exists own_insert on public.lecturer_payout_accounts;
create policy own_insert on public.lecturer_payout_accounts for insert to authenticated
  with check (id = (select auth.uid()));
drop policy if exists own_update on public.lecturer_payout_accounts;
create policy own_update on public.lecturer_payout_accounts for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

insert into public.lecturer_payout_accounts (id,account,account_name)
  select id, left(btrim(pay->>'account'),80), coalesce(left(nullif(btrim(pay->>'name'),''),150), nullif(left(btrim(name),150),''), '—')
  from public.lecturers where nullif(btrim(pay->>'account'),'') is not null
  on conflict (id) do nothing;
update public.lecturers set pay = '{}'::jsonb where pay is distinct from '{}'::jsonb;

create or replace function ishrah_private.clear_public_payout_account()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.pay := '{}'::jsonb;
  return new;
end $$;
drop trigger if exists ish_clear_public_payout_account on public.lecturers;
create trigger ish_clear_public_payout_account before insert or update of pay on public.lecturers
  for each row execute function ishrah_private.clear_public_payout_account();

alter table public.payouts add column if not exists course_id uuid references public.courses on delete set null;
alter table public.payouts add column if not exists request_id uuid references public.course_requests on delete set null;
alter table public.payouts add column if not exists course_title text;
alter table public.payouts add column if not exists receipt text;
alter table public.payouts drop constraint if exists payout_single_course;
alter table public.payouts add constraint payout_single_course check (num_nonnulls(course_id,request_id) <= 1);
create unique index if not exists ish_payout_receipt on public.payouts (receipt) where receipt is not null;
create index if not exists ish_payout_lecturer_status on public.payouts (lecturer_id,status);
create index if not exists ish_payout_earning_rows on public.enrollments (lecturer_id) where status = 'active' and price > 0;

drop policy if exists r on public.payouts;
create policy r on public.payouts for select to authenticated
  using (lecturer_id = (select auth.uid()) or (select public.ish_do('payout','approve')));
drop trigger if exists ish_defaults on public.payouts;
drop policy if exists i on public.payouts;
drop policy if exists u on public.payouts;
drop policy if exists d on public.payouts;
revoke insert, update, delete on public.payouts from public, anon, authenticated;
-- Both transitions below validate and lock the same lecturer before writing payout rows.

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
  values ('payout-receipts','payout-receipts',false,8388608,array['image/jpeg','image/png','image/webp','application/pdf'])
  on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists ish_payout_receipt_upload on storage.objects;
create policy ish_payout_receipt_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'payout-receipts' and split_part(name,'/',1) = (select auth.uid())::text
  and (select public.ish_do('payout','approve'))
);
drop policy if exists ish_payout_receipt_read on storage.objects;
create policy ish_payout_receipt_read on storage.objects for select to authenticated using (
  bucket_id = 'payout-receipts' and (
    (split_part(name,'/',1) = (select auth.uid())::text and (select public.ish_do('payout','approve')))
    or exists (select 1 from public.payouts p where p.receipt = storage.objects.name and p.status = 'paid')
  )
);

create or replace function ishrah_private.lecturer_payout(
  action text, lecturer uuid, course uuid, teaching_group uuid, amount numeric,
  pending uuid, receipt_path text, transfer_note text, reference text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  l public.lecturers;
  requested public.payouts;
  result uuid;
  title text;
  total_earned numeric;
  scoped_earned numeric;
  total_paid numeric;
  scoped_paid numeric;
begin
  if actor is null or not exists (select 1 from public.profiles p where p.id = actor and coalesce(p.status,'active') <> 'blocked') then
    raise exception 'payout_permission' using errcode = '42501';
  end if;
  if not coalesce(
    (action = 'request' and lecturer = actor) or (action = 'record' and public.ish_do('payout','approve')), false
  ) then raise exception 'payout_permission' using errcode = '42501'; end if;
  if num_nonnulls(course,teaching_group) <> 1 or amount is null or amount <= 0
      or amount >= 1000000000000 or amount <> trunc(amount,2) then
    raise exception 'payout_amount';
  end if;
  select * into l from public.lecturers where id = lecturer for update;
  if not found then raise exception 'payout_permission' using errcode = '42501'; end if;

  if action = 'record' then
    -- The same receipt can safely be retried if a browser missed the first response.
    select p.id into result from public.payouts p where p.receipt = receipt_path and p.lecturer_id = lecturer
      and p.paid_by = actor and p.amount = lecturer_payout.amount
      and p.course_id is not distinct from course and p.request_id is not distinct from teaching_group;
    if result is not null then return result; end if;
    if receipt_path is null or split_part(receipt_path,'/',1) <> actor::text or not exists (
      select 1 from storage.objects s where s.bucket_id = 'payout-receipts' and s.name = receipt_path
    ) then raise exception 'payout_receipt'; end if;
    if pending is not null then
      select * into requested from public.payouts p where p.id = pending and p.lecturer_id = lecturer and p.status = 'requested' for update;
      if not found or (requested.course_id is not null and requested.course_id is distinct from course)
        or (requested.request_id is not null and requested.request_id is distinct from teaching_group) then
        raise exception 'payout_request_closed';
      end if;
    end if;
  elsif exists (select 1 from public.payouts p where p.lecturer_id = lecturer and p.status = 'requested') then
    raise exception 'payout_request_pending';
  end if;

  perform 1 from public.lecturer_payout_accounts where id = lecturer;
  if not found then raise exception 'payout_account'; end if;
  if course is not null then
    select c.title into title from public.courses c where c.id = course and c.lecturer_id = lecturer;
  else
    select r.title into title from public.course_requests r where r.id = teaching_group and exists (
      select 1 from public.enrollments e where e.request_id = r.id and e.lecturer_id = lecturer and e.status = 'active'
    );
  end if;
  if title is null then raise exception 'payout_course'; end if;

  -- Hold the contributing enrolments while validating, including against historic unallocated transfers.
  perform 1 from public.enrollments e where e.lecturer_id = lecturer and e.status = 'active' and e.price > 0
    order by e.id for share;
  select coalesce(sum(e.price * coalesce(e.share, l.share, 70) / 100),0),
    coalesce(sum(e.price * coalesce(e.share, l.share, 70) / 100)
      filter (where e.course_id = course or e.request_id = teaching_group),0)
    into total_earned, scoped_earned
    from public.enrollments e where e.lecturer_id = lecturer and e.status = 'active' and e.price > 0;
  select coalesce(sum(p.amount),0), coalesce(sum(p.amount) filter (where p.course_id = course or p.request_id = teaching_group),0)
    into total_paid, scoped_paid from public.payouts p where p.lecturer_id = lecturer and p.status = 'paid';
  if amount > least(total_earned - total_paid, scoped_earned - scoped_paid) then raise exception 'payout_balance'; end if;

  if action = 'request' then
    insert into public.payouts (lecturer_id,name,amount,status,course_id,request_id,course_title)
      values (lecturer,l.name,amount,'requested',course,teaching_group,title) returning id into result;
  elsif pending is null then
    insert into public.payouts (
      lecturer_id,name,amount,status,course_id,request_id,course_title,receipt,ref,note,paid_at,paid_by
    ) values (
      lecturer,l.name,amount,'paid',course,teaching_group,title,receipt_path,
      nullif(left(btrim(reference),150),''),nullif(left(btrim(transfer_note),2000),''),now(),actor
    ) returning id into result;
  else
    update public.payouts set amount = lecturer_payout.amount, status = 'paid', course_id = course,
      request_id = teaching_group, course_title = title, receipt = receipt_path, ref = nullif(left(btrim(reference),150),''),
      note = nullif(left(btrim(transfer_note),2000),''), paid_at = now(), paid_by = actor, account = null, account_name = null
      where id = pending returning id into result;
  end if;
  if action = 'record' then
    insert into public.notices (user_id,title,title_en,body,link)
      values (lecturer,'وصلك تحويل أرباح','Your payout was sent',title,'#studio-payout/' || result);
    insert into public.audit (user_id,name,action,target)
      select actor,p.name,'record lecturer payout',result::text from public.profiles p where p.id = actor;
  end if;
  return result;
end $$;
revoke all on function ishrah_private.lecturer_payout(text,uuid,uuid,uuid,numeric,uuid,text,text,text) from public, anon, authenticated;
grant execute on function ishrah_private.lecturer_payout(text,uuid,uuid,uuid,numeric,uuid,text,text,text) to authenticated;

create or replace function public.ish_lecturer_payout(
  action text, lecturer uuid, course uuid, teaching_group uuid, amount numeric,
  pending uuid default null, receipt_path text default null, transfer_note text default null, reference text default null
) returns uuid language sql security invoker set search_path = '' as $$
  select ishrah_private.lecturer_payout(action,lecturer,course,teaching_group,amount,pending,receipt_path,transfer_note,reference)
$$;
revoke all on function public.ish_lecturer_payout(text,uuid,uuid,uuid,numeric,uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.ish_lecturer_payout(text,uuid,uuid,uuid,numeric,uuid,text,text,text) to authenticated;

notify pgrst, 'reload schema';
commit;
