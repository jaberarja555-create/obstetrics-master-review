-- Alerts (owner, 19 Nov 2026: "notifications should be for all posts; admins should get a sound notification for every user request, better on
-- the phone, so they respond on time").
--   1. Every new published post (discussion, question, course request, event, library file, course) becomes a notification for its
--      speciality and section (notices with user_id null + spec/cat; the author is kept in `actor` and does not see their own).
--   2. Every request from users (payments, library purchases, lecturer applications, files and edits waiting for review, questions, courses
--      sent for review, course requests, support messages, reports, library requests, payout requests) becomes a personal notification for
--      every team member whose role covers it.
--   3. Every new notification is pushed to the phones of the people it is for (Web Push through /api/push), when pg_net is available.
begin;

alter table public.notices add column if not exists actor uuid;
alter table public.notices add column if not exists kind text;
create index if not exists ish_notices_recent on public.notices (created_at desc);

-- ---------------------------------------------------------------- who on the team handles a section of work
create or replace function ishrah_private.staff_for(p text) returns setof uuid
language sql stable security definer set search_path = '' as $$
  select m.id from public.profiles m
  where coalesce(array_length(m.team, 1), 0) > 0 and m.status is distinct from 'blocked' and coalesce(m.team_status, 'active') = 'active'
    and ('owner' = any (m.team) or exists (select 1 from unnest(m.team) r
      where r = 'p:' || p or r like 'p:' || p || ':%' or exists (select 1 from public.role_perms rp where rp.role = r and rp.perm = p)))
$$;
create or replace function ishrah_private.alert_team(p text, t_ar text, t_en text, b text, l text, who uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.notices (user_id, title, title_en, body, link, actor, kind)
  select s, t_ar, t_en, coalesce(b, ''), l, who, 'team' from ishrah_private.staff_for(p) s where s is distinct from who
$$;
create or replace function ishrah_private.alert_space(sp text, ct text, t_ar text, t_en text, b text, l text, who uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.notices (user_id, title, title_en, body, link, spec, cat, actor, kind)
  values (null, t_ar, t_en, left(coalesce(b, ''), 160), l, sp, ct, who, 'post')
$$;
revoke all on function ishrah_private.staff_for(text) from public, anon, authenticated;
revoke all on function ishrah_private.alert_team(text,text,text,text,text,uuid) from public, anon, authenticated;
revoke all on function ishrah_private.alert_space(text,text,text,text,text,text,uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------- one trigger function for every table
create or replace function ishrah_private.on_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  became text := case when tg_op = 'INSERT' then new.status else case when new.status is distinct from old.status then new.status end end;
  tbl text := tg_table_name;
begin
  if tbl = 'enrollments' then
    if became = 'pending' and coalesce(new.price, 0) > 0 then
      perform ishrah_private.alert_team('pay', 'دفع جديد بانتظار المراجعة', 'New payment to review', new.payer, '#control-pay', new.user_id); end if;
  elsif tbl = 'file_buys' then
    if became = 'pending' then
      perform ishrah_private.alert_team('pay', 'شراء من المكتبة بانتظار المراجعة', 'Library purchase to review', new.title || ' · ' || coalesce(new.payer, ''), '#control-sales', new.user_id); end if;
  elsif tbl = 'lecturer_apps' then
    if became = 'pending' then
      perform ishrah_private.alert_team('apps', 'طلب انضمام محاضر', 'New lecturer application', new.name, '#control-apps', new.user_id); end if;
  elsif tbl = 'files' then
    if became = 'pending' and coalesce(new.series_no, 1) <= 1 then
      perform ishrah_private.alert_team('library', 'ملف بانتظار النشر', 'File waiting to be published', coalesce(new.series_title, new.title), '#control-library', new.owner_id);
    elsif became = 'published' and coalesce(new.series_no, 1) <= 1 then
      perform ishrah_private.alert_space(new.spec, new.cat, 'جديد في المكتبة', 'New in the library', coalesce(new.series_title, new.title),
        case when new.series_id is not null then '#series/' || new.series_id else '#file/' || new.id end, new.owner_id); end if;
  elsif tbl = 'library_file_revisions' then
    if became = 'pending' then
      perform ishrah_private.alert_team('library', 'تعديل ملف بانتظار المراجعة', 'File edit to review', '', '#control-library', null); end if;
  elsif tbl = 'posts' then
    if became = 'pending' then
      perform ishrah_private.alert_team('review', 'سؤال بانتظار المراجعة', 'Question to review', new.title, '#control-questions', new.user_id);
    elsif became = 'open' and coalesce(new.room, '') <> 'qa' and new.lesson_id is null then
      perform ishrah_private.alert_space(new.spec, new.room, 'منشور جديد من ' || coalesce(new.name, ''), 'New post by ' || coalesce(new.name, ''),
        coalesce(nullif(new.title, ''), new.body), '#post/' || new.id, new.user_id); end if;
  elsif tbl = 'courses' then
    if became = 'review' then
      perform ishrah_private.alert_team('review', 'كورس جديد للمراجعة', 'Course sent for review', new.title, '#control-review', new.lecturer_id);
    elsif became = 'published' then
      perform ishrah_private.alert_space(new.spec, new.cat, 'كورس جديد', 'New course', new.title, '#course/' || new.id, new.lecturer_id); end if;
  elsif tbl = 'course_requests' then
    if became = 'pending' then
      perform ishrah_private.alert_team('review', 'طلب كورس بانتظار المراجعة', 'Course request to review', new.title, '#control-course-requests', new.user_id);
    elsif became = 'open' then
      perform ishrah_private.alert_team('review', 'طلب كورس جديد', 'New course request', new.title, '#course-request/' || new.id, new.user_id);
      perform ishrah_private.alert_space(new.spec, new.cat, 'طلب كورس جديد', 'New course request', new.title, '#course-request/' || new.id, new.user_id); end if;
  elsif tbl = 'events' then
    if became = 'published' then
      perform ishrah_private.alert_space(new.spec, new.cat, 'فعالية جديدة', 'New event', new.title, '#event/' || new.id, new.lecturer_id); end if;
  elsif tbl = 'tickets' then
    if tg_op = 'INSERT' then
      perform ishrah_private.alert_team('tickets', 'رسالة جديدة من ' || coalesce(new.name, ''), 'New message from ' || coalesce(new.name, ''), new.subject, '#ticket/' || new.id, new.user_id); end if;
  elsif tbl = 'ticket_msgs' then
    if tg_op = 'INSERT' and not coalesce(new.staff, false) and not coalesce(new.lec, false) then
      perform ishrah_private.alert_team('tickets', 'رد جديد من ' || coalesce(new.name, ''), 'New reply from ' || coalesce(new.name, ''), left(new.body, 140), '#ticket/' || new.ticket_id, new.user_id); end if;
  elsif tbl = 'reports' then
    if tg_op = 'INSERT' then
      perform ishrah_private.alert_team('community', 'بلاغ جديد', 'New report', left(coalesce(new.reason, ''), 140), '#control-community', new.user_id); end if;
  elsif tbl = 'requests' then
    if tg_op = 'INSERT' then
      perform ishrah_private.alert_team('requests', 'طلب مكتبة جديد', 'New library request', new.title, '#control-requests', new.user_id); end if;
  elsif tbl = 'payouts' then
    if became = 'requested' then
      perform ishrah_private.alert_team('payout', 'طلب تحويل أرباح محاضر', 'Lecturer payout request', new.name, '#control-payouts', new.lecturer_id); end if;
  elsif tbl = 'seller_payouts' then
    if became = 'requested' then
      perform ishrah_private.alert_team('payout', 'طلب تحويل أرباح بائع', 'Seller payout request', new.name, '#control-sales/sellers', new.seller_id); end if;
  end if;
  return null;
exception when others then
  return null;   -- an alert must never stop the student's own action
end $$;
revoke all on function ishrah_private.on_activity() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['enrollments','file_buys','lecturer_apps','files','library_file_revisions','posts','courses','course_requests','events',
    'tickets','ticket_msgs','reports','requests','payouts','seller_payouts'] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists ish_alerts on public.%I', t);
      execute format('create trigger ish_alerts after insert or update on public.%I for each row execute function ishrah_private.on_activity()', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------- phones (Web Push)
create table if not exists public.push_subs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  endpoint text not null unique check (endpoint ~ '^https://' and char_length(endpoint) < 1000),
  spec text, cat text, team boolean not null default false, ua text,
  last_title text, last_body text, last_link text, last_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ish_push_subs_user on public.push_subs (user_id);
create index if not exists ish_push_subs_space on public.push_subs (spec, cat);
alter table public.push_subs enable row level security;
revoke all on public.push_subs from public, anon, authenticated;
grant select, delete on public.push_subs to authenticated;
drop policy if exists own on public.push_subs;
create policy own on public.push_subs for all to authenticated using (user_id = (select auth.uid()));

create table if not exists public.push_cfg (k text primary key, v text not null);
alter table public.push_cfg enable row level security;
revoke all on public.push_cfg from public, anon, authenticated;   -- only the server key (service role) reads it
insert into public.push_cfg (k, v) values ('secret', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')) on conflict (k) do nothing;
insert into public.settings (id, value) values ('push_url', 'https://ishrahli.org/api/push') on conflict (id) do nothing;

-- this device wants alerts (one row per phone/browser; the speciality and section decide which posts reach it)
create or replace function public.ish_push_save(p_endpoint text, p_spec text, p_cat text, p_ua text) returns void
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if actor is null then raise exception 'request_sign_in'; end if;
  insert into public.push_subs (user_id, endpoint, spec, cat, ua, team)
    values (actor, p_endpoint, p_spec, p_cat, left(p_ua, 200), exists (select 1 from public.profiles where id = actor and coalesce(array_length(team, 1), 0) > 0))
  on conflict (endpoint) do update set user_id = actor, spec = excluded.spec, cat = excluded.cat, ua = excluded.ua, team = excluded.team;
end $$;
revoke all on function public.ish_push_save(text,text,text,text) from public, anon;
grant execute on function public.ish_push_save(text,text,text,text) to authenticated;

-- the phones a notification goes to (called by /api/push with the server key and the shared secret); it also keeps the text the phone shows
create or replace function public.ish_push_targets(p_notice uuid, p_secret text) returns table (endpoint text)
language plpgsql security definer set search_path = '' as $$
declare n public.notices;
begin
  if p_secret is distinct from (select v from public.push_cfg where k = 'secret') then raise exception 'request_permission' using errcode = '42501'; end if;
  select * into n from public.notices where id = p_notice; if n.id is null then return; end if;
  return query
  update public.push_subs s set last_title = coalesce(nullif(n.title, ''), 'اشرح لي'), last_body = coalesce(n.body, ''), last_link = coalesce(nullif(n.link, ''), '#notifications'), last_at = now()
  where (n.user_id is not null and s.user_id = n.user_id)
     or (n.user_id is null and s.user_id is distinct from n.actor and (n.spec is null or s.spec = n.spec) and (n.cat is null or s.cat = n.cat))
  returning s.endpoint;
end $$;
revoke all on function public.ish_push_targets(uuid,text) from public, anon, authenticated;

-- every new notification is sent to /api/push (needs the pg_net extension; skipped quietly where it is missing)
do $$ begin
  begin create extension if not exists pg_net; exception when others then null; end;
end $$;
create or replace function ishrah_private.push_out() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_net') then
    begin
      execute 'select net.http_post(url := $1, body := $2, headers := $3)' using
        (select value from public.settings where id = 'push_url'),
        jsonb_build_object('id', new.id, 'secret', (select v from public.push_cfg where k = 'secret')),
        '{"Content-Type":"application/json"}'::jsonb;
    exception when others then null;
    end;
  end if;
  return null;
end $$;
revoke all on function ishrah_private.push_out() from public, anon, authenticated;
drop trigger if exists ish_push_out on public.notices;
create trigger ish_push_out after insert on public.notices for each row execute function ishrah_private.push_out();

notify pgrst, 'reload schema';
commit;
