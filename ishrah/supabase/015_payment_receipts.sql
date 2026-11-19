-- A receipt, name and phone are enough to submit a payment for verification.
begin;

create or replace function public.ish_enrol() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  c public.courses;
  r public.course_requests;
  lecturer uuid;
  amount numeric;
  actor uuid := auth.uid();
  grant_course boolean;
begin
  if new.request_id is not null then
    select * into r from public.course_requests where id = new.request_id for update;
    if r.id is null or r.status <> 'open' or not r.payment_required or new.course_id is not null then
      raise exception 'request_closed';
    end if;
    if r.auto_close and r.reserved_count >= r.goal then raise exception 'request_no_seats'; end if;
    select o.lecturer_id, o.price into lecturer, amount from public.course_request_offers o
      where o.request_id = r.id and o.status = 'accepted' and o.terms_public and o.price > 0;
    if not found or new.user_id is distinct from actor or new.user_id = lecturer then raise exception 'request_permission'; end if;
  else
    select * into c from public.courses where id = new.course_id;
    if c.id is null or (c.status <> 'published' and not public.ish_do('students','add')) then raise exception 'course not open'; end if;
    lecturer := c.lecturer_id;
    amount := coalesce(c.price, 0);
    grant_course := new.status = 'active' and new.price = 0 and new.decided_by = actor and public.ish_do('students','add');
    if grant_course then amount := 0; end if;
    if new.user_id is distinct from actor and not (public.ish_do('students','add') or public.ish_do('pay','add')) then
      raise exception 'request_permission';
    end if;
  end if;

  if not exists (
    select 1 from public.profiles p where p.id = new.user_id and p.status is distinct from 'blocked' and p.team_status is distinct from 'suspended'
  ) then raise exception 'request_permission'; end if;
  if amount > 0 and (
    nullif(trim(new.payer), '') is null or nullif(trim(new.phone), '') is null or
    not exists (select 1 from storage.objects o where o.bucket_id = 'receipts' and o.name = new.receipt
      and split_part(o.name,'/',1) = actor::text and o.metadata->>'mimetype' like 'image/%')
  ) then raise exception 'payment_receipt_required'; end if;

  new.lecturer_id := lecturer;
  new.price := amount;
  new.status := case when amount > 0 then 'pending' else 'active' end;
  new.decided_by := case when grant_course then actor end;
  new.decided_at := case when amount = 0 then now() end;
  new.share := null;
  return new;
end $$;

create table if not exists public.payment_messages (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments on delete cascade,
  sender_id uuid not null default auth.uid(),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists payment_messages_enrollment_date on public.payment_messages (enrollment_id, created_at desc);
alter table public.payment_messages enable row level security;
revoke all on public.payment_messages from public, anon, authenticated;
grant select on public.payment_messages to authenticated;
grant insert (enrollment_id, body) on public.payment_messages to authenticated;

drop policy if exists visible on public.payment_messages;
create policy visible on public.payment_messages for select to authenticated using (
  exists (select 1 from public.enrollments e where e.id = enrollment_id and e.price > 0
     and (e.user_id = (select auth.uid()) or (select public.ish_do('pay','view'))))
);
drop policy if exists send_to_student on public.payment_messages;
create policy send_to_student on public.payment_messages for insert to authenticated with check (
  sender_id = (select auth.uid()) and (select public.ish_do('pay','view'))
    and ((select public.ish_do('pay','edit')) or (select public.ish_do('pay','approve')))
    and exists (select 1 from public.enrollments e where e.id = enrollment_id and e.price > 0 and e.user_id is not null)
);

-- Keep the message history and its private notification in the same transaction.
create or replace function ishrah_private.notify_payment_message() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notices (user_id, title, title_en, body, link)
    select e.user_id, 'رسالة من فريق المدفوعات', 'Message from the payments team', '', '#payment/' || e.id
    from public.enrollments e where e.id = new.enrollment_id and e.user_id is not null;
  return null;
end $$;
revoke all on function ishrah_private.notify_payment_message() from public, anon, authenticated;
drop trigger if exists notify_payment_message on public.payment_messages;
create trigger notify_payment_message after insert on public.payment_messages
  for each row execute function ishrah_private.notify_payment_message();

notify pgrst, 'reload schema';
commit;
