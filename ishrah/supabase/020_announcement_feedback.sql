-- Public announcements use the same reactions, comments and moderation as section posts.
begin;

alter table public.notices add column if not exists like_count integer not null default 0;
alter table public.notices add column if not exists dislike_count integer not null default 0;
alter table public.notices add column if not exists comment_count integer not null default 0;

create or replace function ishrah_private.guard_announcement_counts() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon','authenticated') then
    new.like_count := case when tg_op = 'INSERT' then 0 else old.like_count end;
    new.dislike_count := case when tg_op = 'INSERT' then 0 else old.dislike_count end;
    new.comment_count := case when tg_op = 'INSERT' then 0 else old.comment_count end;
  end if;
  return new;
end $$;
revoke all on function ishrah_private.guard_announcement_counts() from public, anon, authenticated;
drop trigger if exists ish_guard_announcement_counts on public.notices;
create trigger ish_guard_announcement_counts before insert or update on public.notices
  for each row execute function ishrah_private.guard_announcement_counts();

alter table public.feed_feedback add column if not exists announcement_id uuid references public.notices on delete cascade;
-- A newer migration owns the target constraints after it has added its columns.
do $$
begin
  if not exists (select 1 from pg_attribute where attrelid = 'public.feed_feedback'::regclass
      and attname = 'course_id' and not attisdropped) then
    alter table public.feed_feedback drop constraint if exists feed_feedback_one_target;
    alter table public.feed_feedback drop constraint if exists feed_feedback_star_target;
    alter table public.feed_feedback add constraint feed_feedback_one_target
      check (num_nonnulls(post_id,request_id,file_id,announcement_id) = 1);
    alter table public.feed_feedback add constraint feed_feedback_star_target
      check (stars is null or (request_id is null and announcement_id is null));
  end if;
end $$;
create unique index if not exists feed_feedback_announcement_user
  on public.feed_feedback (announcement_id,user_id) where announcement_id is not null;

drop policy if exists own_feedback on public.feed_feedback;
create policy own_feedback on public.feed_feedback for select to authenticated using (user_id = (select auth.uid()) and (
  exists (select 1 from public.posts p where p.id = post_id and p.status not in ('removed','pending','rejected')) or
  exists (select 1 from public.course_requests r where r.id = request_id and r.status in ('open','closed')) or
  exists (select 1 from public.files f where f.id = file_id and f.status = 'published') or
  exists (select 1 from public.notices n where n.id = announcement_id and n.user_id is null)
));

alter table public.replies add column if not exists announcement_id uuid references public.notices on delete cascade;
alter table public.replies drop constraint if exists replies_single_target;
alter table public.replies add constraint replies_single_target check (announcement_id is null or post_id is null);
create index if not exists replies_announcement_date on public.replies (announcement_id, created_at desc)
  where announcement_id is not null;

drop policy if exists r on public.replies;
create policy r on public.replies for select to anon, authenticated using (
  (status <> 'removed' or (select public.ish_do('community','view'))) and (
    exists (select 1 from public.posts p where p.id = post_id and p.status not in ('pending','rejected')) or
    exists (select 1 from public.notices n where n.id = announcement_id and n.user_id is null)
  )
);
drop policy if exists i on public.replies;
create policy i on public.replies for insert to authenticated with check (
  user_id = (select auth.uid()) and (
    exists (select 1 from public.posts p where p.id = post_id and p.status not in ('removed','pending','rejected')) or
    (status = 'open' and char_length(btrim(body)) between 1 and 2000 and
      exists (select 1 from public.notices n where n.id = announcement_id and n.user_id is null))
  )
);

create or replace function ishrah_private.guard_announcement_reply() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.announcement_id is distinct from old.announcement_id then raise exception 'reply_target'; end if;
  elsif new.announcement_id is not null and current_user = 'authenticated' then
    select p.name, p.photo into new.name, new.photo
      from public.profiles p where p.id = auth.uid() and p.status is distinct from 'blocked' and p.team_status is distinct from 'suspended';
    if not found then raise exception 'request_sign_in'; end if;
    new.created_at := now();
  end if;
  return new;
end $$;
revoke all on function ishrah_private.guard_announcement_reply() from public, anon, authenticated;
drop trigger if exists ish_guard_announcement_reply on public.replies;
create trigger ish_guard_announcement_reply before insert or update on public.replies
  for each row execute function ishrah_private.guard_announcement_reply();

create or replace function ishrah_private.count_announcement_replies() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  target uuid := coalesce(new.announcement_id,old.announcement_id);
  delta integer := (case when tg_op <> 'DELETE' and new.status = 'open' then 1 else 0 end)
    - (case when tg_op <> 'INSERT' and old.status = 'open' then 1 else 0 end);
begin
  if target is not null and delta <> 0 then
    update public.notices set comment_count = comment_count + delta where id = target and user_id is null;
  end if;
  return null;
end $$;
revoke all on function ishrah_private.count_announcement_replies() from public, anon, authenticated;
drop trigger if exists ish_count_announcement_replies on public.replies;
create trigger ish_count_announcement_replies after insert or update or delete on public.replies
  for each row execute function ishrah_private.count_announcement_replies();

drop policy if exists i on public.reports;
create policy i on public.reports for insert to authenticated with check (
  user_id = (select auth.uid()) and status = 'open' and handled_by is null
  and char_length(trim(reason)) between 1 and 2000
  and case kind
    when 'post' then exists (select 1 from public.posts p where p.id = target and p.status = 'open')
    when 'reply' then exists (select 1 from public.replies r where r.id = target and r.status = 'open' and (
      exists (select 1 from public.posts p where p.id = r.post_id and p.status = 'open') or
      exists (select 1 from public.notices n where n.id = r.announcement_id and n.user_id is null)
    ))
    when 'review' then exists (select 1 from public.reviews r where r.id = target)
    when 'request' then exists (select 1 from public.course_requests r where r.id = target and r.status in ('open','closed'))
    when 'request_comment' then exists (select 1 from public.course_request_comments c where c.id = target)
    when 'news' then exists (select 1 from public.news n where n.id = target and n.status = 'published')
    when 'announcement' then exists (select 1 from public.notices n where n.id = target and n.user_id is null)
    else false
  end
);

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
  elsif coalesce(new.file_id,old.file_id) is not null then
    update public.files set like_count = like_count + likes, dislike_count = dislike_count + dislikes,
      rating_count = rating_count + (after_rating is not null)::integer - (before_rating is not null)::integer,
      rating_points = rating_points + coalesce(after_rating,0) - coalesce(before_rating,0)
      where id = coalesce(new.file_id,old.file_id);
  elsif coalesce(new.announcement_id,old.announcement_id) is not null then
    update public.notices set like_count = like_count + likes, dislike_count = dislike_count + dislikes
      where id = coalesce(new.announcement_id,old.announcement_id) and user_id is null;
  else
    update public.course_requests set like_count = like_count + likes, dislike_count = dislike_count + dislikes
      where id = coalesce(new.request_id,old.request_id);
  end if;
  return null;
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
  elsif kind = 'file' then
    select owner_id into parent_owner from public.files where id = target and status = 'published' for update;
  elsif kind = 'announcement' then
    select user_id into parent_owner from public.notices where id = target and user_id is null for update;
  else
    raise exception 'request_unavailable';
  end if;
  if not found then raise exception 'request_unavailable'; end if;
  if action = 'react' then
    if value is null or value not in (-1,1) then raise exception 'vote_value'; end if;
  elsif action = 'rate' then
    if kind not in ('post','file') or parent_owner = actor or value is null or value not between 1 and 5 then raise exception 'vote_value'; end if;
  else
    raise exception 'vote_value';
  end if;
  select * into f from public.feed_feedback where user_id = actor and
    ((kind = 'post' and post_id = target) or (kind = 'request' and request_id = target) or (kind = 'file' and file_id = target) or
      (kind = 'announcement' and announcement_id = target));
  if f.id is null then
    insert into public.feed_feedback (post_id,request_id,file_id,announcement_id,user_id,reaction,stars)
      values (case when kind = 'post' then target end,case when kind = 'request' then target end,case when kind = 'file' then target end,
        case when kind = 'announcement' then target end,actor,
        case when action = 'react' then value end,case when action = 'rate' then value end);
  elsif action = 'react' then
    update public.feed_feedback set reaction = case when f.reaction is distinct from value then value end where id = f.id;
  else
    update public.feed_feedback set stars = value where id = f.id;
  end if;
end $$;


-- Return the saved reaction and counters in the same request.
create or replace function ishrah_private.feed_react(kind text, target uuid, value integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  saved smallint;
  likes integer;
  dislikes integer;
begin
  perform ishrah_private.feed_vote(kind,target,'react',value);
  select reaction into saved from public.feed_feedback where user_id = auth.uid() and
    ((kind = 'post' and post_id = target) or (kind = 'file' and file_id = target) or
      (kind = 'request' and request_id = target) or (kind = 'announcement' and announcement_id = target));
  case kind
    when 'post' then select like_count,dislike_count into likes,dislikes from public.posts where id = target;
    when 'file' then select like_count,dislike_count into likes,dislikes from public.files where id = target;
    when 'request' then select like_count,dislike_count into likes,dislikes from public.course_requests where id = target;
    when 'announcement' then select like_count,dislike_count into likes,dislikes from public.notices where id = target;
  end case;
  return jsonb_build_object('my_reaction',saved,'like_count',likes,'dislike_count',dislikes);
end $$;
revoke all on function ishrah_private.feed_react(text,uuid,integer) from public, anon, authenticated;
grant execute on function ishrah_private.feed_react(text,uuid,integer) to authenticated;
create or replace function public.ish_feed_react(kind text, target uuid, value integer)
returns jsonb language sql security invoker set search_path = '' as $$
  select ishrah_private.feed_react(kind,target,value)
$$;
revoke all on function public.ish_feed_react(text,uuid,integer) from public, anon, authenticated;
grant execute on function public.ish_feed_react(text,uuid,integer) to authenticated;

create or replace function public.ish_rate_file(file uuid, stars integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  result jsonb;
begin
  perform ishrah_private.feed_vote('file',file,'rate',stars);
  select jsonb_build_object('rating_count',rating_count,'rating_points',rating_points,'average_rating',average_rating)
    into result from public.files where id = file;
  return result;
end $$;
revoke all on function public.ish_rate_file(uuid,integer) from public, anon, authenticated;
grant execute on function public.ish_rate_file(uuid,integer) to authenticated;

notify pgrst, 'reload schema';
commit;
