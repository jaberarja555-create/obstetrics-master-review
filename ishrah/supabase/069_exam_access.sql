-- SMRA Permanent Exam — paid access (owner, 28 Nov 2026: "paid subscription as in our other books").
-- The 4,206-question bank is shipped encrypted (ishrah/exam/js/data.enc, AES-256-GCM). The decryption key is NEVER in this
-- public repo: it lives only in the exam_cfg row below, which the owner fills once (SQL sent privately). ish_exam_key() hands
-- the key to a device only when it may open the Permanent Exam file (owner, library staff, or an active purchase), reusing the
-- platform's own paid-file flow (files.price + file_buys + Bankak receipt approved in Control → Payments). Safe to run again.
begin;

-- the key store: deny-all RLS, read only through the security-definer function below.
create table if not exists public.exam_cfg (id int primary key, k text not null);
alter table public.exam_cfg enable row level security;
revoke all on public.exam_cfg from public, anon, authenticated;

-- make the Permanent Exam a paid, published catalogue file (one-time purchase, like a paid library file).
alter table public.files disable trigger ish_alerts;
update public.files
  set status = 'published', price = coalesce(nullif(price, 0), 15000)
  where id = '4c00d0f9-ed8e-465e-ac56-37cafe1980bc' and kind = 'master_review';
alter table public.files enable trigger ish_alerts;

-- the key, only for a device allowed to open the exam file.
create or replace function public.ish_exam_key() returns text
language sql stable security definer set search_path = '' as $$
  select c.k from public.exam_cfg c
  where c.id = 1 and exists (
    select 1 from public.files f
    where f.id = '4c00d0f9-ed8e-465e-ac56-37cafe1980bc' and public.ish_file_open(f));
$$;
grant execute on function public.ish_exam_key() to authenticated;

-- light state for the app and the card (price + whether this device has a purchase under review); no key.
create or replace function public.ish_exam_state() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'open', exists (select 1 from public.files f
       where f.id = '4c00d0f9-ed8e-465e-ac56-37cafe1980bc' and public.ish_file_open(f)),
    'price', (select price from public.files where id = '4c00d0f9-ed8e-465e-ac56-37cafe1980bc'),
    'pending', (select auth.uid()) is not null and exists (
       select 1 from public.file_buys b
       where b.user_id = (select auth.uid()) and b.status = 'pending'
         and b.file_id = '4c00d0f9-ed8e-465e-ac56-37cafe1980bc')
  )
$$;
grant execute on function public.ish_exam_state() to anon, authenticated;

commit;
