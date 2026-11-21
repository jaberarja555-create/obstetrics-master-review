-- اشرح لي · 054: a course may give a certificate of completion or not (owner, 21 Nov 2026: «where to control to add or remove شهادة إتمام»).
-- On by default, so every existing course keeps its certificate. Safe to run again.
alter table public.courses add column if not exists cert boolean not null default true;
