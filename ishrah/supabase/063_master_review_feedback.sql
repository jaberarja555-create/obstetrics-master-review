-- Catalogue entries for interactive books. The files rows let them use the same
-- ratings, reactions, comments and moderation as uploaded library books.
begin;

-- Existing books are being registered for feedback, so skip upload announcements.
alter table public.files disable trigger ish_alerts;
insert into public.files (id, title, kind, spec, cat, author, status)
values
  ('3b3f6050-a5c1-450d-bf8c-4904dd066f5b', 'Surgery Master Review', 'master_review', 'master-review', 'clinical', 'Dr. Abdaljalil Abdalkareem Arja and Dr. Alabass Abdulrahman', 'published'),
  ('0bda629d-0d58-49b2-a837-aeb13802d96c', 'Pediatric Master Review', 'master_review', 'master-review', 'clinical', 'Dr. Abdaljalil Abdalkareem Arja and Dr. Alabass Abdulrahman', 'published'),
  ('f3a4b512-3cb4-40f5-93e0-a1566552970b', 'Obstetrics Master Review', 'master_review', 'master-review', 'clinical', 'Dr. Abdaljalil Abdalkareem Arja and Dr. Alabass Abdulrahman', 'published')
on conflict (id) do nothing;
alter table public.files enable trigger ish_alerts;

-- Reserve these records for the catalogue. Feedback RPCs still update the shared counters.
drop policy if exists master_review_catalogue_insert on public.files;
create policy master_review_catalogue_insert on public.files as restrictive for insert to authenticated
  with check (kind is distinct from 'master_review');
drop policy if exists master_review_catalogue_update on public.files;
create policy master_review_catalogue_update on public.files as restrictive for update to authenticated
  using (kind is distinct from 'master_review') with check (kind is distinct from 'master_review');
drop policy if exists master_review_catalogue_delete on public.files;
create policy master_review_catalogue_delete on public.files as restrictive for delete to authenticated
  using (kind is distinct from 'master_review');

commit;
