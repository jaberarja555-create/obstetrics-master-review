-- HO Guide in the catalogue (owner, 27 Nov 2026: "why the app has no comment, like, rate, share and report buttons like other books").
-- One files row, like the three Master Review books (063, 064), so the HO Guide card uses the same ratings, reactions,
-- comments, sharing and reports. Safe to run again.
begin;

alter table public.files disable trigger ish_alerts;
insert into public.files (id, title, kind, spec, cat, author, status)
values ('c9a994a8-e7c1-42a8-b61a-933ea9a30683', 'HO Guide', 'master_review', 'master-review', 'house', 'SMRA', 'published')
on conflict (id) do nothing;
alter table public.files enable trigger ish_alerts;

drop policy if exists master_review_catalogue_read on public.files;
create policy master_review_catalogue_read on public.files for select to anon, authenticated
  using (
    kind = 'master_review' and status = 'published'
    and id in (
      '3b3f6050-a5c1-450d-bf8c-4904dd066f5b',
      '0bda629d-0d58-49b2-a837-aeb13802d96c',
      'f3a4b512-3cb4-40f5-93e0-a1566552970b',
      'c9a994a8-e7c1-42a8-b61a-933ea9a30683'
    )
  );

commit;
