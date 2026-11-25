-- The catalogue is public so the standard library feedback can resolve its targets.
begin;

alter table public.files disable trigger ish_alerts;
update public.files
set status = 'published'
where kind = 'master_review' and status is distinct from 'published'
  and id in (
    '3b3f6050-a5c1-450d-bf8c-4904dd066f5b',
    '0bda629d-0d58-49b2-a837-aeb13802d96c',
    'f3a4b512-3cb4-40f5-93e0-a1566552970b'
  );
alter table public.files enable trigger ish_alerts;

drop policy if exists master_review_catalogue_read on public.files;
create policy master_review_catalogue_read on public.files for select to anon, authenticated
  using (
    kind = 'master_review' and status = 'published'
    and id in (
      '3b3f6050-a5c1-450d-bf8c-4904dd066f5b',
      '0bda629d-0d58-49b2-a837-aeb13802d96c',
      'f3a4b512-3cb4-40f5-93e0-a1566552970b'
    )
  );

commit;
