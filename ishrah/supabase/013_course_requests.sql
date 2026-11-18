-- Public course requests live in a speciality and section. All writes go through the
-- authenticated command function so approval, capacity and offer decisions are atomic.
begin;

alter table public.notices add column if not exists spec text references public.specialties on update cascade;
alter table public.notices add column if not exists cat text references public.categories on update cascade;
alter table public.notices add column if not exists title_en text;
create index if not exists notices_ann_scope on public.notices (spec, cat, created_at desc) where user_id is null;
alter table public.news add column if not exists spec text references public.specialties on update cascade;
alter table public.news add column if not exists cat text references public.categories on update cascade;
create index if not exists news_section_feed on public.news (spec, cat, created_at desc) where status = 'published';
alter table public.events add column if not exists cat text references public.categories on update cascade;
alter table public.events add column if not exists registered_count integer not null default 0;
create index if not exists events_section_feed on public.events (spec, cat, created_at desc) where status = 'published';
update public.events e set registered_count = (select count(*) from public.event_regs r where r.event_id = e.id);
alter table public.posts add column if not exists preview_video text;
alter table public.posts add column if not exists preview_image text;
alter table public.posts add column if not exists highlights text[] not null default '{}';
alter table public.posts add column if not exists like_count integer not null default 0;
alter table public.posts add column if not exists dislike_count integer not null default 0;
alter table public.posts add column if not exists rating_count integer not null default 0;
alter table public.posts add column if not exists rating_points integer not null default 0;
create index if not exists posts_section_feed on public.posts (spec, room, created_at desc) where status <> 'removed';

create table if not exists public.course_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  author_name text not null,
  spec text not null references public.specialties on update cascade,
  cat text not null references public.categories on update cascade,
  title text not null check (char_length(title) between 1 and 140),
  details text not null check (char_length(details) between 1 and 4000),
  rules text not null default '' check (char_length(rules) <= 2000),
  lecturer_id uuid references public.lecturers on delete set null,
  lecturer_name text,
  budget_min numeric(12,2) check (budget_min between 0 and 9999999999.99),
  budget_max numeric(12,2) check (budget_max between 0 and 9999999999.99),
  proposed_at timestamptz check (proposed_at >= '2000-01-01' and proposed_at < '2200-01-01'),
  goal integer check (goal between 1 and 10000),
  auto_close boolean not null default false,
  teacher_confirmed boolean not null default false,
  like_count integer not null default 0,
  dislike_count integer not null default 0,
  status text not null default 'pending' check (status in ('pending','open','closed','rejected','deleted')),
  joined_count integer not null default 0,
  rating_count integer not null default 0,
  rating_points integer not null default 0,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  check (budget_max >= budget_min),
  check (not auto_close or goal is not null)
);
create index if not exists course_requests_scope on public.course_requests (spec, cat, published_at desc) where status in ('open','closed');
create index if not exists course_requests_by_author on public.course_requests (user_id, created_at desc);
create index if not exists course_requests_review on public.course_requests (status, created_at desc);
create index if not exists course_requests_by_lecturer on public.course_requests (lecturer_id);

create table if not exists public.course_request_members (
  request_id uuid references public.course_requests on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  primary key (request_id, user_id)
);
create index if not exists course_request_members_user on public.course_request_members (user_id);
create table if not exists public.course_request_ratings (
  request_id uuid references public.course_requests on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  primary key (request_id, user_id)
);
create index if not exists course_request_ratings_user on public.course_request_ratings (user_id);
create table if not exists public.course_request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.course_requests on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  author_name text not null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists course_request_comments_thread on public.course_request_comments (request_id, created_at desc);
create index if not exists course_request_comments_user on public.course_request_comments (user_id);
create table if not exists public.course_request_offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.course_requests on delete cascade,
  lecturer_id uuid not null references public.lecturers on delete cascade,
  lecturer_name text not null,
  terms text not null check (char_length(terms) between 1 and 4000),
  status text not null default 'offered' check (status in ('offered','accepted','declined')),
  created_at timestamptz not null default now(),
  unique (request_id, lecturer_id)
);
create index if not exists course_request_offers_lecturer on public.course_request_offers (lecturer_id);
create unique index if not exists course_request_one_accepted on public.course_request_offers (request_id) where status = 'accepted';
create table if not exists public.course_request_messages (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.course_request_offers on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists course_request_messages_thread on public.course_request_messages (offer_id, created_at desc);
create index if not exists course_request_messages_user on public.course_request_messages (user_id);

alter table public.course_requests enable row level security;
alter table public.course_request_members enable row level security;
alter table public.course_request_ratings enable row level security;
alter table public.course_request_comments enable row level security;
alter table public.course_request_offers enable row level security;
alter table public.course_request_messages enable row level security;
revoke all on public.course_requests, public.course_request_members, public.course_request_ratings,
  public.course_request_comments, public.course_request_offers, public.course_request_messages from public, anon, authenticated;
grant select on public.course_requests, public.course_request_comments to anon, authenticated;
grant select on public.course_request_members, public.course_request_ratings, public.course_request_offers, public.course_request_messages to authenticated;

drop policy if exists visible on public.course_requests;
create policy visible on public.course_requests for select to anon, authenticated using (
  status in ('open','closed') or
  (status in ('pending','rejected') and (user_id = (select auth.uid()) or (select public.ish_do('review','view'))))
);
drop policy if exists visible on public.course_request_members;
create policy visible on public.course_request_members for select to authenticated using (
  user_id = (select auth.uid()) and exists (select 1 from public.course_requests r where r.id = request_id and r.status in ('open','closed'))
);
drop policy if exists visible on public.course_request_ratings;
create policy visible on public.course_request_ratings for select to authenticated using (
  user_id = (select auth.uid()) and exists (select 1 from public.course_requests r where r.id = request_id and r.status in ('open','closed'))
);
drop policy if exists visible on public.course_request_comments;
create policy visible on public.course_request_comments for select to anon, authenticated using (
  exists (select 1 from public.course_requests r where r.id = request_id and r.status in ('open','closed'))
);
drop policy if exists visible on public.course_request_offers;
create policy visible on public.course_request_offers for select to authenticated using (
  exists (select 1 from public.course_requests r where r.id = course_request_offers.request_id and r.status in ('open','closed')
    and (r.user_id = (select auth.uid()) or course_request_offers.lecturer_id = (select auth.uid())))
);
drop policy if exists visible on public.course_request_messages;
create policy visible on public.course_request_messages for select to authenticated using (
  exists (select 1 from public.course_request_offers o where o.id = offer_id)
);

create schema if not exists ishrah_private;
revoke all on schema ishrah_private from public, anon, authenticated;
grant usage on schema ishrah_private to authenticated;

create or replace function ishrah_private.guard_event_registration_count() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon','authenticated') then
    new.registered_count := case when tg_op = 'INSERT' then 0 else old.registered_count end;
  end if;
  return new;
end $$;
revoke all on function ishrah_private.guard_event_registration_count() from public, anon, authenticated;
drop trigger if exists ish_guard_event_registration_count on public.events;
create trigger ish_guard_event_registration_count before insert or update of registered_count on public.events
  for each row execute function ishrah_private.guard_event_registration_count();

create or replace function ishrah_private.event_registration_count() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and old.event_id = new.event_id then return null; end if;
  if tg_op in ('DELETE','UPDATE') then
    update public.events set registered_count = registered_count - 1 where id = old.event_id;
  end if;
  if tg_op in ('INSERT','UPDATE') then
    update public.events set registered_count = registered_count + 1 where id = new.event_id;
  end if;
  return null;
end $$;
revoke all on function ishrah_private.event_registration_count() from public, anon, authenticated;
drop trigger if exists ish_event_registration_count on public.event_regs;
create trigger ish_event_registration_count after insert or update of event_id or delete on public.event_regs
  for each row execute function ishrah_private.event_registration_count();

create or replace function ishrah_private.guard_lecturer_post() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon','authenticated') then
    new.like_count := case when tg_op = 'INSERT' then 0 else old.like_count end;
    new.dislike_count := case when tg_op = 'INSERT' then 0 else old.dislike_count end;
    new.rating_count := case when tg_op = 'INSERT' then 0 else old.rating_count end;
    new.rating_points := case when tg_op = 'INSERT' then 0 else old.rating_points end;
  end if;
  if tg_op = 'UPDATE' and row(new.preview_video,new.preview_image,new.highlights,new.course_id,new.user_id,new.spec,new.room)
    is not distinct from row(old.preview_video,old.preview_image,old.highlights,old.course_id,old.user_id,old.spec,old.room) then return new; end if;
  if new.room = 'qa' then new.preview_video := null; new.preview_image := null; new.highlights := '{}'; return new; end if;
  if new.course_id is null and new.preview_video is null and new.preview_image is null and cardinality(new.highlights) = 0 then return new; end if;
  if not exists (select 1 from public.lecturers l where l.id = new.user_id and l.status = 'active') then
    raise exception 'lecturer_post_required';
  end if;
  if new.preview_video is not null and new.preview_video !~ '^(yt:[A-Za-z0-9_-]{11}|gd:[A-Za-z0-9_-]{10,100})$' then
    raise exception 'lecturer_post_invalid_video';
  end if;
  if new.preview_image is not null and (new.preview_image !~ '^https://' or char_length(new.preview_image) > 1500) then
    raise exception 'lecturer_post_invalid_image';
  end if;
  if cardinality(new.highlights) > 6 or char_length(array_to_string(new.highlights, ' ')) > 600 then
    raise exception 'lecturer_post_highlights';
  end if;
  if new.course_id is not null and not exists (
    select 1 from public.courses c left join public.subjects s on s.id = c.subject
    where c.id = new.course_id and c.lecturer_id = new.user_id and c.status = 'published'
      and coalesce(s.spec,c.spec,'medicine') = new.spec and coalesce(s.cat,c.cat) = new.room
  ) then raise exception 'lecturer_post_course_scope'; end if;
  new.lecturer_id := new.user_id;
  return new;
end $$;
revoke all on function ishrah_private.guard_lecturer_post() from public, anon, authenticated;
drop trigger if exists ish_guard_lecturer_post on public.posts;
create trigger ish_guard_lecturer_post before insert or update of preview_video, preview_image, highlights, course_id, user_id, spec, room, like_count, dislike_count, rating_count, rating_points on public.posts
  for each row execute function ishrah_private.guard_lecturer_post();

-- Counters also stay accurate when account removal cascades to memberships or ratings.
create or replace function ishrah_private.course_request_count() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_table_name = 'course_request_offers' then
    if old.status = 'accepted' then update public.course_requests set teacher_confirmed = false where id = old.request_id; end if;
  elsif tg_table_name = 'course_request_members' then
    if tg_op = 'INSERT' then
      update public.course_requests set joined_count = joined_count + 1,
        status = case when auto_close and joined_count + 1 >= goal then 'closed' else status end where id = new.request_id;
    else
      update public.course_requests set joined_count = joined_count - 1 where id = old.request_id;
    end if;
  elsif tg_op = 'INSERT' then
    update public.course_requests set rating_count = rating_count + 1, rating_points = rating_points + new.stars where id = new.request_id;
  elsif tg_op = 'UPDATE' then
    update public.course_requests set rating_points = rating_points + new.stars - old.stars where id = new.request_id;
  else
    update public.course_requests set rating_count = rating_count - 1, rating_points = rating_points - old.stars where id = old.request_id;
  end if;
  return null;
end $$;
revoke all on function ishrah_private.course_request_count() from public, anon, authenticated;
drop trigger if exists sync_counts on public.course_request_members;
create trigger sync_counts after insert or delete on public.course_request_members for each row execute function ishrah_private.course_request_count();
drop trigger if exists sync_counts on public.course_request_ratings;
create trigger sync_counts after insert or update or delete on public.course_request_ratings for each row execute function ishrah_private.course_request_count();
drop trigger if exists sync_confirmation on public.course_request_offers;
create trigger sync_confirmation after delete on public.course_request_offers for each row execute function ishrah_private.course_request_count();

create or replace function ishrah_private.course_request_change(action text, request uuid, payload jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  actor_name text;
  r public.course_requests;
  o public.course_request_offers;
  target uuid;
  target_name text;
  recipient uuid;
  notice_title text;
  notice_title_en text;
  notice_link text;
  offer_id uuid;
begin
  select p.name into actor_name from public.profiles p where p.id = actor and p.status is distinct from 'blocked'
    and p.team_status is distinct from 'suspended';
  if actor is null or not found then raise exception 'request_sign_in'; end if;

  if action = 'create' then
    target := nullif(payload->>'lecturer_id', '')::uuid;
    if target is not null then
      select l.name into target_name from public.lecturers l where l.id = target and l.status = 'active';
      if not found or target = actor then raise exception 'request_lecturer'; end if;
    end if;
    insert into public.course_requests (user_id, author_name, spec, cat, title, details, rules, lecturer_id, lecturer_name,
      budget_min, budget_max, proposed_at, goal, auto_close)
    values (actor, actor_name, payload->>'spec', payload->>'cat', trim(payload->>'title'), trim(payload->>'details'),
      trim(coalesce(payload->>'rules', '')), target, target_name, (payload->>'budget_min')::numeric, (payload->>'budget_max')::numeric,
      (payload->>'proposed_at')::timestamptz, (payload->>'goal')::integer, coalesce((payload->>'auto_close')::boolean, false))
    returning id into request;
    return request;
  end if;

  -- The request lock serializes joins, rating updates and offer decisions for this post.
  select * into r from public.course_requests where id = request and status <> 'deleted' for update;
  if not found then raise exception 'request_unavailable'; end if;
  notice_link := '#course-request/' || r.id;

  if action in ('approve','reject') then
    if not public.ish_do('review','approve') or r.status <> 'pending' then raise exception 'request_permission'; end if;
    update public.course_requests set status = case when action = 'approve' then 'open' else 'rejected' end,
      published_at = case when action = 'approve' then now() else null end where id = r.id;
    insert into public.audit (user_id,name,action,target) values (actor,actor_name,action || ' course request',r.title);
    recipient := r.user_id;
    notice_title := case when action = 'approve' then 'نُشر طلبك' else 'رُفض طلبك' end;
    notice_title_en := case when action = 'approve' then 'Your course request was published' else 'Your course request was declined' end;
    if action = 'approve' and r.lecturer_id is not null then
      insert into public.notices (user_id,title,title_en,body,link) values
        (r.lecturer_id,'طلب تدريس موجّه إليك','A course request names you',r.title,'#studio-course-request/' || r.id);
    end if;
  elsif action = 'delete' then
    if actor <> r.user_id and not public.ish_do('review','delete') then raise exception 'request_permission'; end if;
    update public.course_requests set status = 'deleted' where id = r.id;
    if actor <> r.user_id then
      insert into public.audit (user_id,name,action,target) values (actor,actor_name,'delete course request',r.title);
    end if;
  elsif action = 'close' then
    if actor <> r.user_id or r.status <> 'open' then raise exception 'request_permission'; end if;
    update public.course_requests set status = 'closed' where id = r.id;
  elsif action in ('join','leave','rate','comment','remove_comment','offer','message','accept') then
    if r.status not in ('open','closed') then raise exception 'request_unavailable'; end if;
    if action = 'join' then
      if actor = r.user_id then raise exception 'request_permission'; end if;
      if exists (select 1 from public.course_request_members where request_id = r.id and user_id = actor) then return r.id; end if;
      if r.status <> 'open' or (r.auto_close and r.joined_count >= r.goal) then raise exception 'request_closed'; end if;
      insert into public.course_request_members (request_id,user_id) values (r.id,actor);
    elsif action = 'leave' then
      delete from public.course_request_members where request_id = r.id and user_id = actor;
    elsif action = 'rate' then
      if actor = r.user_id then raise exception 'request_permission'; end if;
      if r.status <> 'open' then raise exception 'request_closed'; end if;
      insert into public.course_request_ratings (request_id,user_id,stars) values (r.id,actor,(payload->>'stars')::smallint)
        on conflict (request_id,user_id) do update set stars = excluded.stars;
    elsif action = 'comment' then
      if r.status <> 'open' then raise exception 'request_closed'; end if;
      insert into public.course_request_comments (request_id,user_id,author_name,body)
        values (r.id,actor,actor_name,trim(payload->>'body'));
    elsif action = 'remove_comment' then
      delete from public.course_request_comments where request_id = r.id and id = (payload->>'id')::uuid
        and (user_id = actor or public.ish_do('community','delete'));
    elsif action = 'offer' then
      if actor = r.user_id or (r.lecturer_id is not null and r.lecturer_id <> actor) then raise exception 'request_permission'; end if;
      select l.name into target_name from public.lecturers l where l.id = actor and l.status = 'active';
      if not found then raise exception 'request_lecturer'; end if;
      if exists (select 1 from public.course_request_offers where request_id = r.id and status = 'accepted') then raise exception 'request_offer_decided'; end if;
      insert into public.course_request_offers (request_id,lecturer_id,lecturer_name,terms) values (r.id,actor,target_name,trim(payload->>'terms'))
        on conflict (request_id,lecturer_id) do update set terms = excluded.terms, status = 'offered' returning id into offer_id;
      recipient := r.user_id;
      notice_title := 'عرض تدريس';
      notice_title_en := 'A lecturer sent teaching terms';
      notice_link := notice_link || '/' || offer_id;
    else
      select * into o from public.course_request_offers where id = (payload->>'id')::uuid and request_id = r.id;
      if not found or (actor <> r.user_id and actor <> o.lecturer_id) then raise exception 'request_permission'; end if;
      if action = 'message' then
        insert into public.course_request_messages (offer_id,user_id,body) values (o.id,actor,trim(payload->>'body'));
        recipient := case when actor = r.user_id then o.lecturer_id else r.user_id end;
        notice_title := 'رسالة عن عرض تدريس';
        notice_title_en := 'New teaching offer message';
      else
        if actor <> r.user_id then raise exception 'request_permission'; end if;
        if o.status = 'accepted' then return r.id; end if;
        if o.status <> 'offered' then raise exception 'request_offer_decided'; end if;
        update public.course_request_offers set status = case when id = o.id then 'accepted' else 'declined' end where request_id = r.id;
        update public.course_requests set teacher_confirmed = true where id = r.id;
        recipient := o.lecturer_id;
        notice_title := 'قُبل عرض التدريس';
        notice_title_en := 'Your teaching offer was accepted';
      end if;
      notice_link := case when recipient = r.user_id then '#course-request/' else '#studio-course-request/' end || r.id || '/' || o.id;
    end if;
  else
    raise exception 'request_unavailable';
  end if;

  if recipient is not null then
    insert into public.notices (user_id,title,title_en,body,link) values (recipient,notice_title,notice_title_en,r.title,notice_link);
  end if;
  return r.id;
end $$;
revoke all on function ishrah_private.course_request_change(text,uuid,jsonb) from public, anon, authenticated;
grant execute on function ishrah_private.course_request_change(text,uuid,jsonb) to authenticated;

create or replace function public.ish_course_request(action text, request uuid default null, payload jsonb default '{}'::jsonb)
returns uuid language sql security invoker set search_path = '' as $$
  select ishrah_private.course_request_change(action, request, payload)
$$;
revoke all on function public.ish_course_request(text,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.ish_course_request(text,uuid,jsonb) to authenticated;

create table if not exists public.feed_feedback (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts on delete cascade,
  request_id uuid references public.course_requests on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  reaction smallint check (reaction in (-1,1)),
  stars smallint check (stars between 1 and 5),
  check (num_nonnulls(post_id,request_id) = 1),
  check (post_id is not null or stars is null)
);
create unique index if not exists feed_feedback_post_user on public.feed_feedback (post_id,user_id) where post_id is not null;
create unique index if not exists feed_feedback_request_user on public.feed_feedback (request_id,user_id) where request_id is not null;
create index if not exists feed_feedback_user on public.feed_feedback (user_id);
alter table public.feed_feedback enable row level security;
revoke all on public.feed_feedback from public, anon, authenticated;
grant select on public.feed_feedback to authenticated;
drop policy if exists own_feedback on public.feed_feedback;
create policy own_feedback on public.feed_feedback for select to authenticated using (user_id = (select auth.uid()) and (
  exists (select 1 from public.posts p where p.id = post_id and p.status <> 'removed') or
  exists (select 1 from public.course_requests r where r.id = request_id and r.status in ('open','closed'))
));

create or replace function ishrah_private.feed_feedback_count() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  before_reaction smallint := case when tg_op <> 'INSERT' then old.reaction end;
  after_reaction smallint := case when tg_op <> 'DELETE' then new.reaction end;
  before_rating smallint := case when tg_op <> 'INSERT' then old.stars end;
  after_rating smallint := case when tg_op <> 'DELETE' then new.stars end;
  likes integer := coalesce((after_reaction = 1)::integer,0) - coalesce((before_reaction = 1)::integer,0);
  dislikes integer := coalesce((after_reaction = -1)::integer,0) - coalesce((before_reaction = -1)::integer,0);
begin
  if coalesce(new.post_id,old.post_id) is not null then
    update public.posts set like_count = like_count + likes, dislike_count = dislike_count + dislikes,
      rating_count = rating_count + (after_rating is not null)::integer - (before_rating is not null)::integer,
      rating_points = rating_points + coalesce(after_rating,0) - coalesce(before_rating,0)
      where id = coalesce(new.post_id,old.post_id);
  else
    update public.course_requests set like_count = like_count + likes, dislike_count = dislike_count + dislikes
      where id = coalesce(new.request_id,old.request_id);
  end if;
  return null;
end $$;
revoke all on function ishrah_private.feed_feedback_count() from public, anon, authenticated;
drop trigger if exists sync_feedback on public.feed_feedback;
create trigger sync_feedback after insert or update or delete on public.feed_feedback for each row execute function ishrah_private.feed_feedback_count();

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
    select user_id into parent_owner from public.posts where id = target and room <> 'qa' and status <> 'removed' for update;
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
revoke all on function ishrah_private.feed_vote(text,uuid,text,integer) from public, anon, authenticated;
grant execute on function ishrah_private.feed_vote(text,uuid,text,integer) to authenticated;
create or replace function public.ish_feed_vote(kind text, target uuid, action text, value integer)
returns void language sql security invoker set search_path = '' as $$
  select ishrah_private.feed_vote(kind,target,action,value)
$$;
revoke all on function public.ish_feed_vote(text,uuid,text,integer) from public, anon, authenticated;
grant execute on function public.ish_feed_vote(text,uuid,text,integer) to authenticated;

notify pgrst, 'reload schema';
commit;
