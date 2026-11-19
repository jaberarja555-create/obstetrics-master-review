-- Stars are the rating; likes and dislikes are popularity (owner, 19 Nov 2026: "like, dislike just make the post popular and most popular
-- depend on the number of reactions, then rating system as stars … if someone gives 1 star, another 3 and another 5, that makes it about 3").
-- Every feed item can now be rated 1–5 stars by any signed-in member except its author; the score is the plain average of the stars.
-- Courses keep enrolled students' reviews.
begin;

alter table public.notices add column if not exists rating_count integer not null default 0, add column if not exists rating_points integer not null default 0;
alter table public.events add column if not exists rating_count integer not null default 0, add column if not exists rating_points integer not null default 0;
alter table public.news add column if not exists rating_count integer not null default 0, add column if not exists rating_points integer not null default 0;
alter table public.course_requests add column if not exists rating_count integer not null default 0, add column if not exists rating_points integer not null default 0;

alter table public.feed_feedback drop constraint if exists feed_feedback_star_target;
alter table public.feed_feedback add constraint feed_feedback_star_target check (stars is null or course_id is null);

create or replace function ishrah_private.feed_feedback_count() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  before_reaction smallint := case when tg_op <> 'INSERT' then old.reaction end;
  after_reaction smallint := case when tg_op <> 'DELETE' then new.reaction end;
  before_rating smallint := case when tg_op <> 'INSERT' then old.stars end;
  after_rating smallint := case when tg_op <> 'DELETE' then new.stars end;
  likes integer := coalesce((after_reaction = 1)::integer,0) - coalesce((before_reaction = 1)::integer,0);
  dislikes integer := coalesce((after_reaction = -1)::integer,0) - coalesce((before_reaction = -1)::integer,0);
  rc integer := (after_rating is not null)::integer - (before_rating is not null)::integer;
  rp integer := coalesce(after_rating,0) - coalesce(before_rating,0);
begin
  if coalesce(new.post_id,old.post_id) is not null then
    update public.posts set like_count = like_count + likes, dislike_count = dislike_count + dislikes,
      rating_count = rating_count + rc, rating_points = rating_points + rp where id = coalesce(new.post_id,old.post_id);
  elsif coalesce(new.file_id,old.file_id) is not null then
    update public.files set like_count = like_count + likes, dislike_count = dislike_count + dislikes,
      rating_count = rating_count + rc, rating_points = rating_points + rp where id = coalesce(new.file_id,old.file_id);
  elsif coalesce(new.announcement_id,old.announcement_id) is not null then
    update public.notices set like_count = like_count + likes, dislike_count = dislike_count + dislikes,
      rating_count = rating_count + rc, rating_points = rating_points + rp
      where id = coalesce(new.announcement_id,old.announcement_id) and user_id is null;
  elsif coalesce(new.course_id,old.course_id) is not null then
    update public.courses set like_count = like_count + likes, dislike_count = dislike_count + dislikes
      where id = coalesce(new.course_id,old.course_id);
  elsif coalesce(new.event_id,old.event_id) is not null then
    update public.events set like_count = like_count + likes, dislike_count = dislike_count + dislikes,
      rating_count = rating_count + rc, rating_points = rating_points + rp where id = coalesce(new.event_id,old.event_id);
  elsif coalesce(new.news_id,old.news_id) is not null then
    update public.news set like_count = like_count + likes, dislike_count = dislike_count + dislikes,
      rating_count = rating_count + rc, rating_points = rating_points + rp where id = coalesce(new.news_id,old.news_id);
  else
    update public.course_requests set like_count = like_count + likes, dislike_count = dislike_count + dislikes,
      rating_count = rating_count + rc, rating_points = rating_points + rp where id = coalesce(new.request_id,old.request_id);
  end if;
  return null;
end $$;

-- the counter guards of these tables must let the trigger above write the new columns (it runs as the definer, not as a member)
update public.notices n set rating_count = s.c, rating_points = s.p from (
  select announcement_id id, count(stars) c, coalesce(sum(stars),0) p from public.feed_feedback where announcement_id is not null group by 1) s where s.id = n.id;
update public.events n set rating_count = s.c, rating_points = s.p from (
  select event_id id, count(stars) c, coalesce(sum(stars),0) p from public.feed_feedback where event_id is not null group by 1) s where s.id = n.id;
update public.news n set rating_count = s.c, rating_points = s.p from (
  select news_id id, count(stars) c, coalesce(sum(stars),0) p from public.feed_feedback where news_id is not null group by 1) s where s.id = n.id;
update public.course_requests n set rating_count = s.c, rating_points = s.p from (
  select request_id id, count(stars) c, coalesce(sum(stars),0) p from public.feed_feedback where request_id is not null group by 1) s where s.id = n.id;

create or replace function ishrah_private.feed_rate(kind text, target uuid, value integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  author uuid;
  tbl text;
  col text := kind || '_id';
  rc integer; rp integer;
begin
  if actor is null or not exists (select 1 from public.profiles where id = actor and status is distinct from 'blocked' and team_status is distinct from 'suspended')
    then raise exception 'request_sign_in'; end if;
  if value is null or value not between 1 and 5 then raise exception 'vote_value'; end if;
  if kind = 'post' then
    tbl := 'posts'; select user_id into author from public.posts where id = target and room <> 'qa' and status not in ('removed','pending','rejected') for update;
  elsif kind = 'request' then
    tbl := 'course_requests'; select user_id into author from public.course_requests where id = target and status in ('open','closed') for update;
  elsif kind = 'file' then
    tbl := 'files'; select owner_id into author from public.files where id = target and status = 'published' for update;
  elsif kind = 'announcement' then
    tbl := 'notices'; select null::uuid into author from public.notices where id = target and user_id is null for update;
  elsif kind = 'event' then
    tbl := 'events'; select lecturer_id into author from public.events where id = target and status = 'published' for update;
  elsif kind = 'news' then
    tbl := 'news'; select null::uuid into author from public.news where id = target and status = 'published' for update;
  else raise exception 'request_unavailable';
  end if;
  if not found then raise exception 'request_unavailable'; end if;
  if author = actor then raise exception 'vote_value'; end if;
  execute format('insert into public.feed_feedback as f (%1$I,user_id,stars) values ($1,$2,$3)
    on conflict (%1$I,user_id) where %1$I is not null do update set stars = $3', col) using target, actor, value;
  execute format('select rating_count, rating_points from public.%I where id = $1', tbl) into rc, rp using target;
  return jsonb_build_object('rating_count', rc, 'rating_points', rp, 'average_rating', case when rc > 0 then rp::numeric / rc end, 'my_stars', value);
end $$;
revoke all on function ishrah_private.feed_rate(text,uuid,integer) from public, anon, authenticated;
grant execute on function ishrah_private.feed_rate(text,uuid,integer) to authenticated;
create or replace function public.ish_feed_rate(kind text, target uuid, stars integer)
returns jsonb language sql security invoker set search_path = '' as $$ select ishrah_private.feed_rate(kind, target, stars) $$;
revoke all on function public.ish_feed_rate(text,uuid,integer) from public, anon;
grant execute on function public.ish_feed_rate(text,uuid,integer) to authenticated;

notify pgrst, 'reload schema';
commit;
