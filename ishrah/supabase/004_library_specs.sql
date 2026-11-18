-- اشرح لي: library files and requests carry their speciality (owner, 18 Nov 2026: "the library must include the other specialities").
-- A file's speciality comes from its subject. Safe to run again.
alter table files add column if not exists spec text default 'medicine';
alter table requests add column if not exists spec text default 'medicine';
update files f set spec = s.spec from subjects s where f.subject = s.id and s.spec is not null and f.spec is distinct from s.spec;
create index if not exists files_spec on files (spec);
