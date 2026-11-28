-- SMRA Permanent Exam in the catalogue (owner, 28 Nov 2026): one files row like the HO Guide (066/067) so the card has stars,
-- likes, comments, sharing and reports. Published so anon/students can read it. Safe to run again.
begin;
alter table public.files disable trigger ish_alerts;
insert into public.files (id, title, kind, spec, cat, author, status)
values ('4c00d0f9-ed8e-465e-ac56-37cafe1980bc', 'Permanent Exam', 'master_review', 'master-review', 'house', 'SMRA', 'published')
on conflict (id) do nothing;
update public.files set status = 'published'
where id = '4c00d0f9-ed8e-465e-ac56-37cafe1980bc' and kind = 'master_review' and status is distinct from 'published';
alter table public.files enable trigger ish_alerts;

drop policy if exists master_review_catalogue_read on public.files;
create policy master_review_catalogue_read on public.files for select to anon, authenticated
  using (
    kind = 'master_review' and status = 'published'
    and id in (
      '3b3f6050-a5c1-450d-bf8c-4904dd066f5b',
      '0bda629d-0d58-49b2-a837-aeb13802d96c',
      'f3a4b512-3cb4-40f5-93e0-a1566552970b',
      'c9a994a8-e7c1-42a8-b61a-933ea9a30683',
      '4c00d0f9-ed8e-465e-ac56-37cafe1980bc'
    )
  );
commit;
