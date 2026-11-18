-- اشرح لي: speciality spaces (owner, 18 Nov 2026: "the app shows the specialities first, the student chooses one and then sees only
-- what belongs to it"). The chosen speciality is kept in the profile; events, community posts and learning paths can belong to a speciality
-- (empty = for every speciality). Safe to run again.
alter table profiles add column if not exists spec text;
alter table events add column if not exists spec text;
alter table posts add column if not exists spec text;
alter table paths add column if not exists spec text;
create index if not exists events_spec on events (spec);
create index if not exists posts_spec on posts (spec);
