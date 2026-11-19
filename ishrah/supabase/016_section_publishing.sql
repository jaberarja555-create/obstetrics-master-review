begin;

alter table public.courses add column if not exists delivery text check (delivery in ('recorded','live','hybrid'));
alter table public.courses add column if not exists starts_at timestamptz;
alter table public.courses add column if not exists teaching_method text check (char_length(teaching_method) <= 2000);
alter table public.courses add column if not exists seat_limit integer check (seat_limit between 1 and 10000);
create index if not exists enrollments_course_seats on public.enrollments (course_id, user_id)
  where course_id is not null and status in ('active','pending');

create or replace function ishrah_private.available_course_seats(course uuid)
returns integer language sql stable security definer set search_path = '' as $$
  select greatest(0, c.seat_limit - count(distinct e.user_id)::integer)
  from public.courses c
  left join public.enrollments e on e.course_id = c.id and e.status in ('active','pending')
  where c.id = course and c.status = 'published' and c.seat_limit is not null
  group by c.id
$$;
revoke all on function ishrah_private.available_course_seats(uuid) from public, anon, authenticated;
grant execute on function ishrah_private.available_course_seats(uuid) to anon, authenticated;

create or replace function public.ish_available_course_seats(course uuid)
returns integer language sql stable security invoker set search_path = '' as $$
  select ishrah_private.available_course_seats(course)
$$;
revoke all on function public.ish_available_course_seats(uuid) from public, anon, authenticated;
grant execute on function public.ish_available_course_seats(uuid) to anon, authenticated;

create table if not exists public.course_live_links (
  course_id uuid primary key references public.courses on delete cascade,
  url text not null check (url = '' or (char_length(url) <= 1000 and url ~ '^https://[^[:space:]]+$'))
);
alter table public.course_live_links enable row level security;
revoke all on public.course_live_links from public, anon, authenticated;
grant select, insert, update on public.course_live_links to authenticated;
drop policy if exists visible on public.course_live_links;
create policy visible on public.course_live_links for select to authenticated using (
  exists (select 1 from public.courses c where c.id = course_id
    and (c.lecturer_id = (select auth.uid()) or (select public.ish_do('review','view'))
      or (c.status = 'published' and c.delivery in ('live','hybrid') and exists (
        select 1 from public.enrollments e where e.course_id = c.id and e.user_id = (select auth.uid()) and e.status = 'active'
      ))))
);
drop policy if exists create_link on public.course_live_links;
create policy create_link on public.course_live_links for insert to authenticated with check (
  exists (select 1 from public.courses c where c.id = course_id and c.lecturer_id = (select auth.uid()))
);
drop policy if exists edit_link on public.course_live_links;
create policy edit_link on public.course_live_links for update to authenticated using (
  exists (select 1 from public.courses c where c.id = course_id and c.lecturer_id = (select auth.uid()))
) with check (
  exists (select 1 from public.courses c where c.id = course_id and c.lecturer_id = (select auth.uid()))
);

alter table public.posts add column if not exists review_note text;
create index if not exists post_review_inbox on public.posts (created_at) where status = 'pending';
create index if not exists post_review_author on public.posts (user_id, created_at desc) where status in ('pending','rejected');

create or replace function ishrah_private.guard_question_review() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.review_note := null;
    if new.post_kind = 'question' or new.room = 'qa' then
      if new.room = 'qa' then
        select c.lecturer_id into new.lecturer_id from public.courses c
          where c.id = new.course_id and c.status = 'published';
        if not found or not exists (
          select 1 from public.lessons l where l.id = new.lesson_id and l.course_id = new.course_id
        ) then raise exception 'question_course_invalid'; end if;
      end if;
      new.status := 'pending';
    else
      new.status := 'open';
    end if;
  elsif current_user in ('anon','authenticated') and (
    old.status in ('pending','rejected') or new.status in ('pending','rejected')
    or old.review_note is distinct from new.review_note
    or ((old.post_kind = 'question' or new.post_kind = 'question' or old.room = 'qa' or new.room = 'qa')
      and row(old.post_kind,old.room,old.user_id,old.course_id,old.lesson_id)
        is distinct from row(new.post_kind,new.room,new.user_id,new.course_id,new.lesson_id))
  ) then raise exception 'question_review_required';
  end if;
  return new;
end $$;
revoke all on function ishrah_private.guard_question_review() from public, anon, authenticated;
drop trigger if exists ish_guard_question_review on public.posts;
create trigger ish_guard_question_review before insert or update on public.posts
  for each row execute function ishrah_private.guard_question_review();

drop policy if exists r on public.posts;
create policy r on public.posts for select to anon, authenticated using (
  (status <> 'removed' and status not in ('pending','rejected')) or
  (status = 'removed' and (select public.ish_do('community','view'))) or
  (status in ('pending','rejected') and (user_id = (select auth.uid()) or (select public.ish_do('review','view'))))
);
drop policy if exists r on public.replies;
create policy r on public.replies for select to anon, authenticated using (
  (status <> 'removed' or (select public.ish_do('community','view'))) and
  exists (select 1 from public.posts p where p.id = post_id and p.status not in ('pending','rejected'))
);
drop policy if exists i on public.replies;
create policy i on public.replies for insert to authenticated with check (
  user_id = (select auth.uid()) and exists (
    select 1 from public.posts p where p.id = post_id and p.status not in ('removed','pending','rejected')
  )
);

create or replace function ishrah_private.review_question(question uuid, publish boolean, note text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  p public.posts;
  decision_note text := nullif(btrim(note), '');
begin
  if not public.ish_do('review','approve') then raise exception 'question_review_required'; end if;
  if publish is null or (not publish and (decision_note is null or char_length(decision_note) > 2000)) then
    raise exception 'question_review_note_required';
  end if;
  update public.posts set status = case when publish then 'open' else 'rejected' end,
    review_note = case when publish then null else decision_note end
    where id = question and status = 'pending' and (room = 'qa' or post_kind = 'question')
    returning * into p;
  if not found then return false; end if;
  insert into public.audit (user_id, name, action, target)
    select id, name, case when publish then 'approve question' else 'reject question' end, p.id::text
    from public.profiles where id = auth.uid();
  if p.user_id is not null then
    insert into public.notices(user_id,title,title_en,body,link)
      values (p.user_id, case when publish then 'نُشر سؤالك' else 'لم يُنشر سؤالك' end,
        case when publish then 'Your question was published' else 'Your question was declined' end,
        coalesce(p.title,''), '#post/' || p.id);
  end if;
  if publish and p.room = 'qa' and p.lecturer_id is not null and p.lecturer_id is distinct from p.user_id then
    insert into public.notices(user_id,title,title_en,body,link)
      values (p.lecturer_id, 'سؤال جديد في كورسك', 'New question in your course', '', '#studio-qa');
  end if;
  return true;
end $$;
revoke all on function ishrah_private.review_question(uuid,boolean,text) from public, anon, authenticated;
grant execute on function ishrah_private.review_question(uuid,boolean,text) to authenticated;
create or replace function public.ish_review_question(question uuid, publish boolean, note text default '')
returns boolean language sql security invoker set search_path = '' as $$
  select ishrah_private.review_question(question,publish,note)
$$;
revoke all on function public.ish_review_question(uuid,boolean,text) from public, anon, authenticated;
grant execute on function public.ish_review_question(uuid,boolean,text) to authenticated;

create or replace function public.ish_enrol() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  c public.courses;
  r public.course_requests;
  lecturer uuid;
  amount numeric;
  actor uuid := auth.uid();
  grant_course boolean;
begin
  if new.request_id is not null then
    select * into r from public.course_requests where id = new.request_id for update;
    if r.id is null or r.status <> 'open' or not r.payment_required or new.course_id is not null then
      raise exception 'request_closed';
    end if;
    if r.auto_close and r.reserved_count >= r.goal then raise exception 'request_no_seats'; end if;
    select o.lecturer_id, o.price into lecturer, amount from public.course_request_offers o
      where o.request_id = r.id and o.status = 'accepted' and o.terms_public and o.price > 0;
    if not found or new.user_id is distinct from actor or new.user_id = lecturer then raise exception 'request_permission'; end if;
  else
    select * into c from public.courses where id = new.course_id for no key update;
    if c.id is null or (c.status <> 'published' and not public.ish_do('students','add')) then raise exception 'course not open'; end if;
    if c.seat_limit is not null then
      if exists (select 1 from public.enrollments e where e.course_id = c.id and e.user_id = new.user_id and e.status in ('pending','active'))
        then raise exception 'course_already_enrolled'; end if;
      if (select count(distinct e.user_id) from public.enrollments e where e.course_id = c.id and e.status in ('pending','active'))
        >= c.seat_limit then raise exception 'course_no_seats'; end if;
    end if;
    lecturer := c.lecturer_id;
    amount := coalesce(c.price, 0);
    grant_course := new.status = 'active' and new.price = 0 and new.decided_by = actor and public.ish_do('students','add');
    if grant_course then amount := 0; end if;
    if new.user_id is distinct from actor and not (public.ish_do('students','add') or public.ish_do('pay','add')) then
      raise exception 'request_permission';
    end if;
  end if;

  if not exists (
    select 1 from public.profiles p where p.id = new.user_id and p.status is distinct from 'blocked' and p.team_status is distinct from 'suspended'
  ) then raise exception 'request_permission'; end if;
  if amount > 0 and (
    nullif(trim(new.payer), '') is null or nullif(trim(new.phone), '') is null or
    not exists (select 1 from storage.objects o where o.bucket_id = 'receipts' and o.name = new.receipt
      and split_part(o.name,'/',1) = actor::text and o.metadata->>'mimetype' like 'image/%')
  ) then raise exception 'payment_receipt_required'; end if;

  new.lecturer_id := lecturer;
  new.price := amount;
  new.status := case when amount > 0 then 'pending' else 'active' end;
  new.decided_by := case when grant_course then actor end;
  new.decided_at := case when amount = 0 then now() end;
  new.share := null;
  return new;
end $$;

create or replace function ishrah_private.feed_vote(kind text, target uuid, action text, value integer)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  parent_owner uuid;
  f public.feed_feedback;
begin
  if actor is null or not exists (
    select 1 from public.profiles where id = actor and status is distinct from 'blocked' and team_status is distinct from 'suspended'
  ) then raise exception 'request_sign_in'; end if;
  if kind = 'post' then
    select user_id into parent_owner from public.posts where id = target and room <> 'qa' and status not in ('removed','pending','rejected') for update;
  elsif kind = 'request' then
    select user_id into parent_owner from public.course_requests where id = target and status in ('open','closed') for update;
  else
    raise exception 'request_unavailable';
  end if;
  if not found then raise exception 'request_unavailable'; end if;
  if action = 'react' then
    if value is null or value not in (-1,1) then raise exception 'vote_value'; end if;
  elsif action = 'rate' then
    if kind <> 'post' or parent_owner = actor or value is null or value not between 1 and 5 then raise exception 'vote_value'; end if;
  else
    raise exception 'vote_value';
  end if;
  select * into f from public.feed_feedback where user_id = actor and
    ((kind = 'post' and post_id = target) or (kind = 'request' and request_id = target));
  if f.id is null then
    insert into public.feed_feedback (post_id,request_id,user_id,reaction,stars)
      values (case when kind = 'post' then target end,case when kind = 'request' then target end,actor,
        case when action = 'react' then value end,case when action = 'rate' then value end);
  elsif action = 'react' then
    update public.feed_feedback set reaction = case when f.reaction is distinct from value then value end where id = f.id;
  else
    update public.feed_feedback set stars = value where id = f.id;
  end if;
end $$;

alter table public.lecturer_apps add column if not exists teaching_specs text[] not null default '{}';
alter table public.lecturers add column if not exists teaching_specs text[] not null default '{}';
alter table public.lecturer_apps add column if not exists teaching_spaces text[] not null default '{}';
alter table public.lecturers add column if not exists teaching_spaces text[] not null default '{}';
drop policy if exists i on public.lecturer_apps;
create policy i on public.lecturer_apps for insert to authenticated with check (user_id = (select auth.uid()));


create or replace function ishrah_private.guard_teaching_specs() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (
    select 1 from unnest(new.teaching_specs) picked(id)
    left join public.specialties s on s.id = picked.id
    group by picked.id,s.id having s.id is null or count(*) > 1
  ) then raise exception 'invalid_teaching_specialities'; end if;
  if exists (
    select 1 from unnest(new.teaching_spaces) picked(space)
    left join public.categories c on picked.space = split_part(picked.space,'/',1) || '/' || c.id
      and split_part(picked.space,'/',1) = any(new.teaching_specs)
    group by picked.space,c.id having c.id is null or count(*) > 1
  ) or exists (
    select 1 from unnest(new.teaching_specs) s(id)
    where not exists (select 1 from unnest(new.teaching_spaces) picked(space) where split_part(picked.space,'/',1) = s.id)
  ) then raise exception 'invalid_teaching_sections'; end if;
  return new;
end $$;
revoke all on function ishrah_private.guard_teaching_specs() from public, anon, authenticated;
drop trigger if exists ish_guard_teaching_specs on public.lecturer_apps;
create trigger ish_guard_teaching_specs before insert or update of teaching_specs, teaching_spaces on public.lecturer_apps
  for each row execute function ishrah_private.guard_teaching_specs();
drop trigger if exists ish_guard_teaching_specs on public.lecturers;
create trigger ish_guard_teaching_specs before insert or update of teaching_specs, teaching_spaces on public.lecturers
  for each row execute function ishrah_private.guard_teaching_specs();

notify pgrst, 'reload schema';
commit;
