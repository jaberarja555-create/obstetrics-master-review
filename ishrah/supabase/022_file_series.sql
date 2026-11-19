-- اشرح لي: library series (owner, 19 Nov 2026: "a student should be able to upload many files as one group, like sheets or a book series,
-- opened nicely and in order from one organised place"). Each part stays a normal file row (same review, rating, comments, downloads);
-- the parts of one upload share series_id, carry the series title and their order. Safe to run again.
alter table public.files add column if not exists series_id uuid;
alter table public.files add column if not exists series_title text;
alter table public.files add column if not exists series_no int;
create index if not exists files_series on public.files (series_id, series_no) where series_id is not null;
