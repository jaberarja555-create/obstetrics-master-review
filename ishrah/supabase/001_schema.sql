-- اشرح لي: database for the NEW, SEPARATE Supabase project (owner, 17 Nov 2026). Run once in that project's SQL editor (or by the
-- "Ishrah database" workflow). Safe to run again: every object is created only if missing / replaced.
-- Who may read or change what is decided HERE (row-level security), not in the app: the app only shows what these rules allow.
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tables
create table if not exists profiles (id uuid primary key references auth.users on delete cascade, name text not null default '', phone text default '', email text default '',
  photo text default '', university text default '', year text default '', city text default '', bio text default '', interests text[] default '{}', team text[] default '{}',
  status text default 'active', created_at timestamptz default now());
create table if not exists role_perms (role text, perm text, primary key (role, perm));
create table if not exists settings (id text primary key, value text);
create table if not exists categories (id text primary key, ar text, en text, icon text, tone text, sort int default 0);
create table if not exists subjects (id text primary key, cat text references categories on update cascade, ar text, en text, icon text, sort int default 0);
create table if not exists lecturer_apps (id uuid primary key default gen_random_uuid(), user_id uuid references profiles on delete cascade, name text, phone text, email text, qual text, specialty text,
  title text, experience text, cv text, certs text, sample text, plan_title text, plan text, status text default 'pending', note text, decided_at timestamptz, decided_by uuid, created_at timestamptz default now());
create table if not exists lecturers (id uuid primary key references profiles on delete cascade, name text, title text, specialty text, bio text, photo text, cover text, color text, quals text[] default '{}',
  tags text[] default '{}', links jsonb default '{}', pay jsonb default '{}', share numeric default 70, status text default 'active', n_students int default 0, created_at timestamptz default now());
create table if not exists courses (id uuid primary key default gen_random_uuid(), lecturer_id uuid references lecturers on delete cascade, title text, subtitle text, cat text, subject text, level text, lang text,
  price numeric default 0, cover text, color text, promo text, about text, learn text[] default '{}', reqs text[] default '{}', status text default 'draft', review_note text,
  n_lessons int default 0, minutes int default 0, n_students int default 0, rating numeric default 0, n_reviews int default 0,
  created_at timestamptz default now(), updated_at timestamptz default now(), submitted_at timestamptz, published_at timestamptz);
create table if not exists sections (id uuid primary key default gen_random_uuid(), course_id uuid references courses on delete cascade, title text, sort int default 0, created_at timestamptz default now());
create table if not exists lessons (id uuid primary key default gen_random_uuid(), course_id uuid references courses on delete cascade, section_id uuid references sections on delete cascade, title text,
  kind text default 'video', video_id text default '', minutes int default 0, body text default '', quiz jsonb default '[]', free boolean default false, sort int default 0, created_at timestamptz default now(),
  has_video boolean generated always as (coalesce(video_id, '') <> '') stored);
create table if not exists enrollments (id uuid primary key default gen_random_uuid(), course_id uuid references courses on delete cascade, user_id uuid references profiles on delete cascade, lecturer_id uuid,
  status text default 'pending', price numeric default 0, share numeric, payer text, phone text, ref text, receipt text, note text, decided_at timestamptz, decided_by uuid, created_at timestamptz default now());
create table if not exists progress (id uuid primary key default gen_random_uuid(), user_id uuid references profiles on delete cascade, course_id uuid references courses on delete cascade, lesson_id uuid references lessons on delete cascade,
  done_at timestamptz default now(), score int, created_at timestamptz default now());
create table if not exists notes (id uuid primary key default gen_random_uuid(), user_id uuid references profiles on delete cascade, course_id uuid, lesson_id uuid, body text, updated_at timestamptz default now(), created_at timestamptz default now());
create table if not exists reviews (id uuid primary key default gen_random_uuid(), course_id uuid references courses on delete cascade, user_id uuid references profiles on delete cascade, name text, stars int check (stars between 1 and 5), body text, created_at timestamptz default now());
create table if not exists events (id uuid primary key default gen_random_uuid(), lecturer_id uuid references lecturers on delete cascade, title text, about text, kind text, starts timestamptz, minutes int default 60, link text, cover text,
  status text default 'published', created_at timestamptz default now());
create table if not exists event_regs (id uuid primary key default gen_random_uuid(), event_id uuid references events on delete cascade, user_id uuid references profiles on delete cascade, created_at timestamptz default now(), unique (event_id, user_id));
create table if not exists posts (id uuid primary key default gen_random_uuid(), room text, course_id uuid, lesson_id uuid, lecturer_id uuid, user_id uuid references profiles on delete cascade, name text, photo text, title text, body text,
  status text default 'open', pinned boolean default false, n_replies int default 0, created_at timestamptz default now());
create table if not exists replies (id uuid primary key default gen_random_uuid(), post_id uuid references posts on delete cascade, user_id uuid references profiles on delete cascade, name text, photo text, body text, status text default 'open', created_at timestamptz default now());
create table if not exists reports (id uuid primary key default gen_random_uuid(), kind text, target uuid, user_id uuid references profiles on delete cascade, reason text, status text default 'open', handled_by uuid, created_at timestamptz default now());
create table if not exists payouts (id uuid primary key default gen_random_uuid(), lecturer_id uuid references lecturers on delete cascade, name text, amount numeric, status text default 'requested', account text, account_name text,
  ref text, note text, paid_at timestamptz, paid_by uuid, created_at timestamptz default now());
create table if not exists notices (id uuid primary key default gen_random_uuid(), user_id uuid references profiles on delete cascade, title text, body text, link text, created_at timestamptz default now());
create table if not exists files (id uuid primary key default gen_random_uuid(), title text, kind text, subject text, cat text, author text, about text, path text, mime text, size bigint, pages int, cover text,
  owner_id uuid references profiles on delete set null, owner_name text, status text default 'pending', created_at timestamptz default now());
create table if not exists requests (id uuid primary key default gen_random_uuid(), user_id uuid references profiles on delete cascade, name text, phone text, kind text, title text, details text, status text default 'pending',
  reply text, file_id text, created_at timestamptz default now());
create table if not exists paths (id uuid primary key default gen_random_uuid(), title text, about text, cat text, steps text[] default '{}', status text default 'published', sort int default 0, created_at timestamptz default now());
create table if not exists audit (id uuid primary key default gen_random_uuid(), user_id uuid, name text, action text, target text, created_at timestamptz default now());

-- ---------------------------------------------------------------- roles (same map as js/core.js IS.PERMS)
insert into role_perms (role, perm) select r, p from (values
  ('gm','dash'),('gm','students'),('gm','lecturers'),('gm','apps'),('gm','review'),('gm','paths'),('gm','library'),('gm','requests'),('gm','pay'),('gm','payout'),('gm','events'),('gm','community'),('gm','notify'),('gm','reports'),('gm','cats'),('gm','settings'),('gm','audit'),('gm','team'),
  ('academic','dash'),('academic','apps'),('academic','lecturers'),('academic','review'),('academic','paths'),('academic','reports'),
  ('finance','dash'),('finance','pay'),('finance','payout'),('finance','lecturers'),('finance','reports'),
  ('content','dash'),('content','library'),('content','requests'),('content','cats'),
  ('community','dash'),('community','community'),('community','events'),('community','notify'),
  ('support','dash'),('support','students'),('support','requests'),('support','notify'),
  ('tech','dash'),('tech','settings'),('tech','audit'),('tech','cats'),('tech','reports'),
  ('staff','dash')) v(r, p) on conflict do nothing;

create or replace function ish_team() returns text[] language sql stable security definer set search_path = public as
  $$ select coalesce((select team from profiles where id = auth.uid()), '{}') $$;
create or replace function ish_can(p text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from unnest(ish_team()) r where r = 'owner' or r = 'p:' || p or exists (select 1 from role_perms where role = r and perm = p)) $$;
create or replace function ish_staff() returns boolean language sql stable as $$ select coalesce(array_length(ish_team(), 1), 0) > 0 $$;
create or replace function ish_owner() returns boolean language sql stable as $$ select 'owner' = any(ish_team()) $$;

-- ---------------------------------------------------------------- new account → profile (the first account is the owner)
create or replace function ish_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'); first boolean;
begin
  select not exists (select 1 from profiles where 'owner' = any(team)) into first;
  insert into profiles (id, name, phone, email, photo, team) values (new.id,
    coalesce(nullif(m->>'name', ''), nullif(m->>'full_name', ''), split_part(new.email, '@', 1)), coalesce(m->>'phone', ''),
    case when new.email like '%@phone.ishrah.app' then coalesce(m->>'contact_email', '') else coalesce(new.email, '') end,
    coalesce(m->>'avatar_url', ''), case when first then array['owner'] else '{}'::text[] end) on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists ish_new_user on auth.users;
create trigger ish_new_user after insert on auth.users for each row execute function ish_new_user();

-- ---------------------------------------------------------------- protected columns (a user cannot give themself roles, approve their own payment …)
create or replace function ish_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'profiles' then
    if not ish_can('team') then new.team := old.team; end if;
    if not ish_owner() and (('owner' = any(new.team)) <> ('owner' = any(old.team)) or ('gm' = any(new.team)) <> ('gm' = any(old.team))) then new.team := old.team; end if;
    if new.id = auth.uid() and 'owner' = any(old.team) then new.team := array(select distinct unnest(new.team || array['owner'])); end if;
    if not ish_can('students') then new.status := old.status; end if;
  elsif tg_table_name = 'lecturers' then
    if not (ish_can('payout') or ish_can('lecturers')) then new.share := old.share; end if;
    if not ish_can('lecturers') then new.status := old.status; end if;
  elsif tg_table_name = 'courses' then
    if not ish_can('review') then
      new.lecturer_id := old.lecturer_id; new.n_students := old.n_students; new.rating := old.rating; new.n_reviews := old.n_reviews;
      if new.status is distinct from old.status and not (new.status in ('draft', 'review') and old.status in ('draft', 'review', 'rejected')) then new.status := old.status; end if;
      if new.status = 'review' then new.review_note := old.review_note; end if;
    end if;
  elsif tg_table_name = 'lecturer_apps' then
    if not ish_can('apps') then new.status := old.status; new.note := old.note; new.user_id := old.user_id; end if;
  end if;
  return new;
end $$;
drop trigger if exists ish_guard on profiles; create trigger ish_guard before update on profiles for each row execute function ish_guard();
drop trigger if exists ish_guard on lecturers; create trigger ish_guard before update on lecturers for each row execute function ish_guard();
drop trigger if exists ish_guard on courses; create trigger ish_guard before update on courses for each row execute function ish_guard();
drop trigger if exists ish_guard on lecturer_apps; create trigger ish_guard before update on lecturer_apps for each row execute function ish_guard();

-- a new enrolment: price and lecturer always come from the course; paid courses start as "pending" unless the finance team creates them
create or replace function ish_enrol() returns trigger language plpgsql security definer set search_path = public as $$
declare c courses;
begin
  select * into c from courses where id = new.course_id;
  if c.id is null or (c.status <> 'published' and not ish_can('students')) then raise exception 'course not open'; end if;
  new.lecturer_id := c.lecturer_id;
  if not (ish_can('pay') or ish_can('students')) then
    new.price := coalesce(c.price, 0); new.status := case when coalesce(c.price, 0) = 0 then 'active' else 'pending' end; new.decided_by := null;
    new.decided_at := case when new.status = 'active' then now() end; new.share := null;
  end if;
  return new;
end $$;
drop trigger if exists ish_enrol on enrollments; create trigger ish_enrol before insert on enrollments for each row execute function ish_enrol();
-- a lecturer's new course starts as a draft; a student's library file starts pending; a request starts new
create or replace function ish_defaults() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'courses' and not ish_can('review') then new.status := 'draft'; new.lecturer_id := auth.uid(); new.n_students := 0; new.rating := 0; new.n_reviews := 0; end if;
  if tg_table_name = 'files' and not ish_can('library') then new.status := 'pending'; new.owner_id := auth.uid(); end if;
  if tg_table_name = 'requests' then new.user_id := auth.uid(); if not ish_can('requests') then new.status := 'pending'; new.reply := ''; end if; end if;
  if tg_table_name = 'payouts' and not ish_can('payout') then new.status := 'requested'; new.lecturer_id := auth.uid(); new.paid_at := null; new.paid_by := null; new.ref := null; end if;
  if tg_table_name = 'lecturer_apps' and not ish_can('apps') then new.status := 'pending'; new.user_id := auth.uid(); end if;
  return new;
end $$;
do $$ declare t text; begin foreach t in array array['courses', 'files', 'requests', 'payouts', 'lecturer_apps'] loop
  execute format('drop trigger if exists ish_defaults on %I', t); execute format('create trigger ish_defaults before insert on %I for each row execute function ish_defaults()', t); end loop; end $$;

-- counts kept on the course and post rows
create or replace function ish_counts() returns trigger language plpgsql security definer set search_path = public as $$
declare cid uuid; pid uuid;
begin
  if tg_table_name in ('enrollments', 'reviews') then
    cid := coalesce(new.course_id, old.course_id);
    update courses set n_students = (select count(*) from enrollments where course_id = cid and status = 'active'),
      n_reviews = (select count(*) from reviews where course_id = cid), rating = coalesce((select round(avg(stars)::numeric, 1) from reviews where course_id = cid), 0) where id = cid;
    update lecturers l set n_students = (select count(*) from enrollments e where e.lecturer_id = l.id and e.status = 'active') where l.id = (select lecturer_id from courses where id = cid);
  elsif tg_table_name = 'replies' then
    pid := coalesce(new.post_id, old.post_id); update posts set n_replies = (select count(*) from replies where post_id = pid and status <> 'removed') where id = pid;
  end if;
  return null;
end $$;
do $$ declare t text; begin foreach t in array array['enrollments', 'reviews', 'replies'] loop
  execute format('drop trigger if exists ish_counts on %I', t); execute format('create trigger ish_counts after insert or update or delete on %I for each row execute function ish_counts()', t); end loop; end $$;

-- the full lesson (text, quiz, video id) only for those allowed to study it
create or replace function ish_lesson(p_id uuid) returns lessons language plpgsql stable security definer set search_path = public as $$
declare l lessons; c courses;
begin
  select * into l from lessons where id = p_id; if l.id is null then return null; end if;
  select * into c from courses where id = l.course_id;
  if l.free and c.status = 'published' then return l; end if;
  if c.lecturer_id = auth.uid() or ish_can('review') then return l; end if;
  if exists (select 1 from enrollments where course_id = c.id and user_id = auth.uid() and status = 'active') then return l; end if;
  l.body := ''; l.quiz := '[]'; l.video_id := ''; return l;
end $$;

-- ---------------------------------------------------------------- row-level security
do $$ declare t text; begin foreach t in array array['profiles','role_perms','settings','categories','subjects','lecturer_apps','lecturers','courses','sections','lessons','enrollments','progress','notes','reviews',
  'events','event_regs','posts','replies','reports','payouts','notices','files','requests','paths','audit'] loop
  execute format('alter table %I enable row level security', t);
  execute (select coalesce(string_agg(format('drop policy if exists %I on %I;', policyname, t), ' '), 'select 1') from pg_policies where tablename = t and schemaname = 'public'); end loop; end $$;
-- lessons: titles are public, the content only through ish_lesson()
revoke select on lessons from anon, authenticated;
grant select (id, course_id, section_id, title, kind, minutes, free, sort, created_at, has_video) on lessons to anon, authenticated;

create policy r on profiles for select using (id = auth.uid() or ish_staff());
create policy u on profiles for update using (id = auth.uid() or ish_can('team') or ish_can('students'));
create policy r on role_perms for select using (true);
create policy r on settings for select using (true);
create policy w on settings for all using (ish_can('settings')) with check (ish_can('settings'));
create policy r on categories for select using (true);
create policy w on categories for all using (ish_can('cats')) with check (ish_can('cats'));
create policy r on subjects for select using (true);
create policy w on subjects for all using (ish_can('cats')) with check (ish_can('cats'));
create policy r on lecturer_apps for select using (user_id = auth.uid() or ish_can('apps'));
create policy i on lecturer_apps for insert with check (auth.uid() is not null);
create policy u on lecturer_apps for update using ((user_id = auth.uid() and status = 'pending') or ish_can('apps'));
create policy r on lecturers for select using (status = 'active' or id = auth.uid() or ish_staff());
create policy i on lecturers for insert with check (ish_can('apps'));
create policy u on lecturers for update using (id = auth.uid() or ish_can('lecturers') or ish_can('payout'));
create policy r on courses for select using (status = 'published' or lecturer_id = auth.uid() or ish_staff() or exists (select 1 from enrollments e where e.course_id = courses.id and e.user_id = auth.uid() and e.status = 'active'));
create policy i on courses for insert with check (exists (select 1 from lecturers where id = auth.uid() and status = 'active') or ish_can('review'));
create policy u on courses for update using (lecturer_id = auth.uid() or ish_can('review'));
create policy d on courses for delete using ((lecturer_id = auth.uid() and n_students = 0) or ish_can('review'));
create policy r on sections for select using (exists (select 1 from courses c where c.id = course_id));
create policy w on sections for all using (exists (select 1 from courses c where c.id = course_id and (c.lecturer_id = auth.uid() or ish_can('review')))) with check (exists (select 1 from courses c where c.id = course_id and (c.lecturer_id = auth.uid() or ish_can('review'))));
create policy r on lessons for select using (exists (select 1 from courses c where c.id = course_id));
create policy w on lessons for all using (exists (select 1 from courses c where c.id = course_id and (c.lecturer_id = auth.uid() or ish_can('review')))) with check (exists (select 1 from courses c where c.id = course_id and (c.lecturer_id = auth.uid() or ish_can('review'))));
create policy r on enrollments for select using (user_id = auth.uid() or lecturer_id = auth.uid() or ish_can('pay') or ish_can('students') or ish_can('dash'));
create policy i on enrollments for insert with check (user_id = auth.uid() or ish_can('students') or ish_can('pay'));
create policy u on enrollments for update using (ish_can('pay') or ish_can('students'));
create policy r on progress for select using (user_id = auth.uid() or ish_staff() or exists (select 1 from courses c where c.id = course_id and c.lecturer_id = auth.uid()));
create policy w on progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy w on notes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy r on reviews for select using (true);
create policy i on reviews for insert with check (user_id = auth.uid() and exists (select 1 from enrollments e where e.course_id = reviews.course_id and e.user_id = auth.uid() and e.status = 'active'));
create policy d on reviews for delete using (user_id = auth.uid() or ish_can('community'));
create policy r on events for select using (status = 'published' or lecturer_id = auth.uid() or ish_staff());
create policy i on events for insert with check (lecturer_id = auth.uid() and exists (select 1 from lecturers where id = auth.uid() and status = 'active'));
create policy u on events for update using (lecturer_id = auth.uid() or ish_can('events'));
create policy d on events for delete using (lecturer_id = auth.uid() or ish_can('events'));
create policy r on event_regs for select using (user_id = auth.uid() or ish_staff() or exists (select 1 from events e where e.id = event_id and e.lecturer_id = auth.uid()));
create policy i on event_regs for insert with check (user_id = auth.uid());
create policy d on event_regs for delete using (user_id = auth.uid());
create policy r on posts for select using (status <> 'removed' or ish_can('community'));
create policy i on posts for insert with check (user_id = auth.uid());
create policy u on posts for update using (ish_can('community'));
create policy r on replies for select using (status <> 'removed' or ish_can('community'));
create policy i on replies for insert with check (user_id = auth.uid());
create policy u on replies for update using (ish_can('community'));
create policy i on reports for insert with check (user_id = auth.uid());
create policy r on reports for select using (ish_can('community'));
create policy u on reports for update using (ish_can('community'));
create policy r on payouts for select using (lecturer_id = auth.uid() or ish_can('payout') or ish_can('dash'));
create policy i on payouts for insert with check (lecturer_id = auth.uid() or ish_can('payout'));
create policy u on payouts for update using (ish_can('payout'));
create policy d on payouts for delete using (ish_can('payout'));
create policy r on notices for select using (user_id is null or user_id = auth.uid() or ish_can('notify'));
create policy i on notices for insert with check ((user_id is not null and auth.uid() is not null) or ish_can('notify'));
create policy d on notices for delete using (ish_can('notify'));
create policy r on files for select using (status = 'published' or owner_id = auth.uid() or ish_can('library'));
create policy i on files for insert with check (auth.uid() is not null);
create policy u on files for update using (ish_can('library'));
create policy r on requests for select using (user_id = auth.uid() or ish_can('requests'));
create policy i on requests for insert with check (auth.uid() is not null);
create policy u on requests for update using (ish_can('requests'));
create policy r on paths for select using (status = 'published' or ish_can('paths'));
create policy w on paths for all using (ish_can('paths')) with check (ish_can('paths'));
create policy i on audit for insert with check (user_id = auth.uid() and ish_staff() or user_id = auth.uid());
create policy r on audit for select using (ish_staff());

-- ---------------------------------------------------------------- file storage
insert into storage.buckets (id, name, public) values ('media', 'media', true), ('receipts', 'receipts', false), ('apps', 'apps', false), ('library', 'library', false) on conflict (id) do nothing;
drop policy if exists ish_up on storage.objects; drop policy if exists ish_read on storage.objects;
create policy ish_up on storage.objects for insert to authenticated with check (bucket_id in ('media', 'receipts', 'apps', 'library') and (storage.foldername(name))[1] = auth.uid()::text);
create policy ish_read on storage.objects for select using (
  bucket_id = 'media'
  or (bucket_id = 'receipts' and ((storage.foldername(name))[1] = auth.uid()::text or ish_can('pay')))
  or (bucket_id = 'apps' and ((storage.foldername(name))[1] = auth.uid()::text or ish_can('apps')))
  or (bucket_id = 'library' and auth.uid() is not null));

-- ---------------------------------------------------------------- starting data (the owner can change all of it in the control app)
insert into settings (id, value) values ('bankak_account', '4674587'), ('bankak_name', 'سعاد عبدالكريم'), ('whatsapp', '249116984258'), ('currency', 'SDG'), ('default_share', '70') on conflict do nothing;
insert into categories (id, ar, en, icon, tone, sort) values ('basics', 'العلوم الأساسية', 'Basics', 'layers', 'blue', 1), ('clinical', 'الجانب الإكلينيكي', 'Clinical', 'clinic', 'teal', 2),
  ('local', 'الامتحانات المحلية', 'Local Exam', 'sudan', 'gold', 3), ('special', 'الاختبارات الخاصة', 'Special Exams', 'exam', 'rose', 4), ('house', 'طبيب الامتياز', 'House Officer', 'house', 'violet', 5) on conflict do nothing;
insert into subjects (id, cat, ar, en, icon, sort) values ('anatomy', 'basics', 'التشريح', 'Anatomy', 's_anatomy', 0), ('physiology', 'basics', 'الفسيولوجيا', 'Physiology', 's_physiology', 1),
  ('biochemistry', 'basics', 'الكيمياء الحيوية', 'Biochemistry', 's_biochem', 2), ('pathology', 'basics', 'علم الأمراض', 'Pathology', 's_pathology', 3), ('microbiology', 'basics', 'الأحياء الدقيقة', 'Microbiology', 's_micro', 4),
  ('pharmacology', 'basics', 'علم الأدوية', 'Pharmacology', 's_pharma', 5), ('community', 'basics', 'طب المجتمع', 'Community Medicine', 's_community', 6), ('medicine', 'clinical', 'الباطنية', 'Internal Medicine', 's_heart', 7),
  ('surgery', 'clinical', 'الجراحة', 'Surgery', 's_scalpel', 8), ('pediatrics', 'clinical', 'طب الأطفال', 'Pediatrics', 's_baby', 9), ('obgyn', 'clinical', 'النساء والتوليد', 'Obstetrics & Gynecology', 's_obgyn', 10),
  ('psychiatry', 'clinical', 'الطب النفسي', 'Psychiatry', 's_brain', 11), ('smc', 'local', 'امتحان المجلس الطبي السوداني', 'Sudan Medical Council', 'sudan', 12), ('finals', 'local', 'الامتحانات الجامعية', 'University finals', 'exam', 13),
  ('usmle', 'special', 'USMLE', 'USMLE', 'world', 14), ('plab', 'special', 'PLAB', 'PLAB', 'world', 15), ('mrcp', 'special', 'MRCP / MRCS', 'MRCP / MRCS', 'world', 16), ('ho-skills', 'house', 'مهارات الامتياز', 'House officer skills', 'house', 17) on conflict do nothing;
