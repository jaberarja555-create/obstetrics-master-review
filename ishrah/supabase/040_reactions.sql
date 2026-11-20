-- Facebook reactions (owner, 20 Nov 2026: "people should be able to react to other comments; book series don't have comments or
-- reactions; like, dislike, angry and heart emoji of Facebook reactions").
--   * Reactions everywhere: 1 = 👍 like · 2 = ❤️ love · 3 = 😡 angry · -1 = 👎 dislike. One reaction per person; the same one again removes
--     it. Counts: like_count · love_count · angry_count · dislike_count on posts, files, announcements, courses, events, news, requests.
--   * Comments take the same four reactions (comment_likes.reaction, counts in comment rx {"1":n,"2":n,"3":n,"-1":n}, like_count = total).
--   * Book series: the same reactions (series_feedback.reaction) and their own comments (library_comments.series_id).
begin;

-- 1. posts and the other feed items
alter table public.feed_feedback drop constraint if exists feed_feedback_reaction_check;
alter table public.feed_feedback add constraint feed_feedback_reaction_check check (reaction in (-1, 1, 2, 3));
alter table public.posts add column if not exists love_count integer not null default 0;
alter table public.posts add column if not exists angry_count integer not null default 0;
alter table public.files add column if not exists love_count integer not null default 0;
alter table public.files add column if not exists angry_count integer not null default 0;
alter table public.notices add column if not exists love_count integer not null default 0;
alter table public.notices add column if not exists angry_count integer not null default 0;
alter table public.courses add column if not exists love_count integer not null default 0;
alter table public.courses add column if not exists angry_count integer not null default 0;
alter table public.events add column if not exists love_count integer not null default 0;
alter table public.events add column if not exists angry_count integer not null default 0;
alter table public.news add column if not exists love_count integer not null default 0;
alter table public.news add column if not exists angry_count integer not null default 0;
alter table public.course_requests add column if not exists love_count integer not null default 0;
alter table public.course_requests add column if not exists angry_count integer not null default 0;

create or replace function ishrah_private.feed_feedback_count() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  before_reaction smallint := case when tg_op <> 'INSERT' then old.reaction end;
  after_reaction smallint := case when tg_op <> 'DELETE' then new.reaction end;
  before_rating smallint := case when tg_op <> 'INSERT' then old.stars end;
  after_rating smallint := case when tg_op <> 'DELETE' then new.stars end;
  likes integer := coalesce((after_reaction = 1)::integer,0) - coalesce((before_reaction = 1)::integer,0);
  dislikes integer := coalesce((after_reaction = -1)::integer,0) - coalesce((before_reaction = -1)::integer,0);
  loves integer := coalesce((after_reaction = 2)::integer,0) - coalesce((before_reaction = 2)::integer,0);
  angers integer := coalesce((after_reaction = 3)::integer,0) - coalesce((before_reaction = 3)::integer,0);
  rc integer := (after_rating is not null)::integer - (before_rating is not null)::integer;
  rp integer := coalesce(after_rating,0) - coalesce(before_rating,0);
begin
  if coalesce(new.post_id,old.post_id) is not null then
    update public.posts set like_count = like_count + likes, dislike_count = dislike_count + dislikes, love_count = love_count + loves, angry_count = angry_count + angers,
      rating_count = rating_count + rc, rating_points = rating_points + rp where id = coalesce(new.post_id,old.post_id);
  elsif coalesce(new.file_id,old.file_id) is not null then
    update public.files set like_count = like_count + likes, dislike_count = dislike_count + dislikes, love_count = love_count + loves, angry_count = angry_count + angers,
      rating_count = rating_count + rc, rating_points = rating_points + rp where id = coalesce(new.file_id,old.file_id);
  elsif coalesce(new.announcement_id,old.announcement_id) is not null then
    update public.notices set like_count = like_count + likes, dislike_count = dislike_count + dislikes, love_count = love_count + loves, angry_count = angry_count + angers,
      rating_count = rating_count + rc, rating_points = rating_points + rp
      where id = coalesce(new.announcement_id,old.announcement_id) and user_id is null;
  elsif coalesce(new.course_id,old.course_id) is not null then
    update public.courses set like_count = like_count + likes, dislike_count = dislike_count + dislikes, love_count = love_count + loves, angry_count = angry_count + angers
      where id = coalesce(new.course_id,old.course_id);
  elsif coalesce(new.event_id,old.event_id) is not null then
    update public.events set like_count = like_count + likes, dislike_count = dislike_count + dislikes, love_count = love_count + loves, angry_count = angry_count + angers,
      rating_count = rating_count + rc, rating_points = rating_points + rp where id = coalesce(new.event_id,old.event_id);
  elsif coalesce(new.news_id,old.news_id) is not null then
    update public.news set like_count = like_count + likes, dislike_count = dislike_count + dislikes, love_count = love_count + loves, angry_count = angry_count + angers,
      rating_count = rating_count + rc, rating_points = rating_points + rp where id = coalesce(new.news_id,old.news_id);
  else
    update public.course_requests set like_count = like_count + likes, dislike_count = dislike_count + dislikes, love_count = love_count + loves, angry_count = angry_count + angers,
      rating_count = rating_count + rc, rating_points = rating_points + rp where id = coalesce(new.request_id,old.request_id);
  end if;
  return null;
end $$;

create or replace function ishrah_private.feed_vote(kind text, target uuid, action text, value integer) returns void
language plpgsql security definer set search_path = '' as $$
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
    if value is null or value not in (-1, 1, 2, 3) then raise exception 'vote_value'; end if;
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

create or replace function ishrah_private.feed_react(kind text, target uuid, value integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  parent_table regclass;
  foreign_key text;
  locked_id uuid;
  saved smallint;
  c record;
begin
  parent_table := case kind when 'course' then 'public.courses'::regclass when 'event' then 'public.events'::regclass
    when 'news' then 'public.news'::regclass else null end;
  if parent_table is not null then
    if actor is null or not exists (
      select 1 from public.profiles where id = actor and status is distinct from 'blocked' and team_status is distinct from 'suspended'
    ) then raise exception 'request_sign_in'; end if;
    if value is null or value not in (-1, 1, 2, 3) then raise exception 'vote_value'; end if;
    execute format('select id from %s where id = $1 and status = %L for update', parent_table, 'published') into locked_id using target;
    if locked_id is null then raise exception 'request_unavailable'; end if;
    foreign_key := kind || '_id';
    execute format('insert into public.feed_feedback as f (%1$I,user_id,reaction)
      values ($1,$2,$3) on conflict (%1$I,user_id) where %1$I is not null
      do update set reaction = nullif($3,f.reaction) returning reaction', foreign_key)
      into saved using target, actor, value;
  else
    perform ishrah_private.feed_vote(kind,target,'react',value);
    select reaction into saved from public.feed_feedback where user_id = auth.uid() and
      ((kind = 'post' and post_id = target) or (kind = 'file' and file_id = target) or
        (kind = 'request' and request_id = target) or (kind = 'announcement' and announcement_id = target));
    parent_table := case kind when 'post' then 'public.posts'::regclass when 'file' then 'public.files'::regclass
      when 'request' then 'public.course_requests'::regclass else 'public.notices'::regclass end;
  end if;
  execute format('select like_count, dislike_count, love_count, angry_count from %s where id = $1', parent_table) into c using target;
  return jsonb_build_object('my_reaction', saved, 'like_count', c.like_count, 'dislike_count', c.dislike_count,
    'love_count', c.love_count, 'angry_count', c.angry_count);
end $$;

-- 2. book series: the same reactions, and their own comments
alter table public.series_feedback drop constraint if exists series_feedback_reaction_check;
alter table public.series_feedback add constraint series_feedback_reaction_check check (reaction in (-1, 1, 2, 3));

alter table public.library_comments alter column file_id drop not null;
alter table public.library_comments add column if not exists series_id uuid;
alter table public.library_comments drop constraint if exists library_comments_one_target;
alter table public.library_comments add constraint library_comments_one_target check (num_nonnulls(file_id, series_id) = 1);
create index if not exists library_comments_series_date on public.library_comments (series_id, created_at) where series_id is not null;
drop policy if exists published_file_comments on public.library_comments;
create policy published_file_comments on public.library_comments for select to anon, authenticated using (
  exists (select 1 from public.files f where f.id = file_id and f.status = 'published')
  or (series_id is not null and exists (select 1 from public.files f where f.series_id = library_comments.series_id and f.status = 'published'))
);

drop function if exists public.ish_series_scores(uuid[]);
create function public.ish_series_scores(targets uuid[])
returns table (series_id uuid, like_count bigint, dislike_count bigint, rating_count bigint, rating_points bigint,
  my_reaction integer, my_stars integer, love_count bigint, angry_count bigint, comment_count bigint)
language sql stable security definer set search_path = '' as $$
  select s.id, count(*) filter (where v.reaction = 1), count(*) filter (where v.reaction = -1),
    count(v.stars), coalesce(sum(v.stars), 0),
    coalesce(max(v.reaction) filter (where v.user_id = auth.uid()), 0),
    coalesce(max(v.stars) filter (where v.user_id = auth.uid()), 0),
    count(*) filter (where v.reaction = 2), count(*) filter (where v.reaction = 3),
    (select count(*) from public.library_comments c where c.series_id = s.id)
  from (select distinct id from unnest(targets) as t(id) limit 200) s
  left join public.series_feedback v on v.series_id = s.id
  where exists (select 1 from public.files f where f.series_id = s.id and f.status = 'published')
  group by s.id
$$;
revoke all on function public.ish_series_scores(uuid[]) from public, anon, authenticated;
grant execute on function public.ish_series_scores(uuid[]) to anon, authenticated;


-- the scores the app reads for series (028) also carry love, angry and the number of comments
drop function if exists public.ish_series_rating_scores(uuid[]);
drop function if exists ishrah_rating_private.series_rating_scores(uuid[]);
create function ishrah_rating_private.series_rating_scores(targets uuid[])
returns table (series_id uuid, like_count bigint, dislike_count bigint, rating_count bigint, rating_points bigint, my_reaction integer, my_stars integer,
  rated_like_count bigint, rated_dislike_count bigint, love_count bigint, angry_count bigint, comment_count bigint)
language sql stable security definer set search_path = '' as $$
  select s.id, count(*) filter (where v.reaction = 1), count(*) filter (where v.reaction = -1),
    count(v.stars), coalesce(sum(v.stars), 0),
    coalesce(max(v.reaction) filter (where v.user_id = auth.uid()), 0),
    coalesce(max(v.stars) filter (where v.user_id = auth.uid()), 0),
    count(*) filter (where v.reaction = 1 and v.stars is not null),
    count(*) filter (where v.reaction = -1 and v.stars is not null),
    count(*) filter (where v.reaction = 2), count(*) filter (where v.reaction = 3),
    (select count(*) from public.library_comments c where c.series_id = s.id)
  from (select distinct id from unnest(targets) as t(id) limit 200) s
  left join public.series_feedback v on v.series_id = s.id
  where exists (select 1 from public.files f where f.series_id = s.id and f.status = 'published')
  group by s.id
$$;
revoke all on function ishrah_rating_private.series_rating_scores(uuid[]) from public, anon, authenticated;
grant execute on function ishrah_rating_private.series_rating_scores(uuid[]) to anon, authenticated;
create function public.ish_series_rating_scores(targets uuid[])
returns table (series_id uuid, like_count bigint, dislike_count bigint, rating_count bigint, rating_points bigint, my_reaction integer, my_stars integer,
  rated_like_count bigint, rated_dislike_count bigint, love_count bigint, angry_count bigint, comment_count bigint)
language sql stable set search_path = '' as $$
  select * from ishrah_rating_private.series_rating_scores(targets)
$$;
revoke all on function public.ish_series_rating_scores(uuid[]) from public, anon, authenticated;
grant execute on function public.ish_series_rating_scores(uuid[]) to anon, authenticated;

create or replace function public.ish_series_vote(target uuid, action text, value integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if not exists (select 1 from public.profiles where id = actor and status is distinct from 'blocked'
    and team_status is distinct from 'suspended') then raise exception 'request_sign_in'; end if;
  if not exists (select 1 from public.files where series_id = target and status = 'published') then
    raise exception 'request_unavailable';
  end if;
  if action = 'react' and value in (-1, 1, 2, 3) then
    perform pg_advisory_xact_lock(hashtextextended(target::text, 0));
    insert into public.series_feedback (series_id,user_id,reaction) values (target,actor,value)
    on conflict (series_id,user_id) do update set reaction =
      case when series_feedback.reaction = excluded.reaction then null else excluded.reaction end;
  elsif action = 'rate' and value between 1 and 5 then
    if exists (select 1 from public.files where series_id = target and owner_id = actor) then raise exception 'vote_value'; end if;
    perform pg_advisory_xact_lock(hashtextextended(target::text, 0));
    insert into public.series_feedback (series_id,user_id,stars) values (target,actor,value)
    on conflict (series_id,user_id) do update set stars = excluded.stars;
  else raise exception 'vote_value';
  end if;
  delete from public.series_feedback where series_id = target and user_id = actor and reaction is null and stars is null;
  return (select to_jsonb(s) from ishrah_rating_private.series_rating_scores(array[target]) s);
end $$;
revoke all on function public.ish_series_vote(uuid,text,integer) from public, anon, authenticated;
grant execute on function public.ish_series_vote(uuid,text,integer) to authenticated;

-- write or delete a comment on a series (like ish_library_comment for one file)
create or replace function public.ish_series_comment(series uuid, message text default null, remove uuid default null) returns void
language plpgsql security definer set search_path = '' as $$
declare me public.profiles := ishrah_private.comment_actor();
begin
  if not exists (select 1 from public.files where series_id = series and status = 'published') then raise exception 'request_unavailable'; end if;
  if remove is not null then
    delete from public.library_comments where id = remove and series_id = series
      and (user_id = me.id or public.ish_do('library','approve') or public.ish_do('community','delete'));
    if not found then raise exception 'request_permission'; end if;
  else
    if char_length(btrim(coalesce(message, ''))) not between 1 and 2000 then raise exception 'comment_body'; end if;
    insert into public.library_comments (series_id, user_id, author_name, body) values (series, me.id, me.name, btrim(message));
  end if;
end $$;
revoke all on function public.ish_series_comment(uuid, text, uuid) from public, anon;
grant execute on function public.ish_series_comment(uuid, text, uuid) to authenticated;

-- 3. comments: four reactions
alter table public.comment_likes add column if not exists reaction smallint not null default 1;
alter table public.comment_likes drop constraint if exists comment_likes_reaction_check;
alter table public.comment_likes add constraint comment_likes_reaction_check check (reaction in (-1, 1, 2, 3));
alter table public.replies add column if not exists rx jsonb not null default '{}';
alter table public.course_request_comments add column if not exists rx jsonb not null default '{}';
alter table public.library_comments add column if not exists rx jsonb not null default '{}';

create or replace function ishrah_private.comment_open(k text, c uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare r public.replies; q public.course_request_comments; f public.library_comments;
begin
  if k = 'reply' then
    select * into r from public.replies where id = c and status = 'open';
    if r.id is null then return false; end if;
    return exists (select 1 from public.posts p where p.id = r.post_id and p.status not in ('removed','pending','rejected'))
      or exists (select 1 from public.notices n where n.id = r.announcement_id and n.user_id is null)
      or exists (select 1 from public.courses a where a.id = r.course_id and a.status = 'published')
      or exists (select 1 from public.events a where a.id = r.event_id and a.status = 'published')
      or exists (select 1 from public.news a where a.id = r.news_id and a.status = 'published');
  elsif k = 'request' then
    select * into q from public.course_request_comments where id = c;
    return q.id is not null and exists (select 1 from public.course_requests x where x.id = q.request_id and x.status in ('open', 'closed'));
  elsif k = 'file' then
    select * into f from public.library_comments where id = c;
    return f.id is not null and (exists (select 1 from public.files x where x.id = f.file_id and x.status = 'published')
      or (f.series_id is not null and exists (select 1 from public.files x where x.series_id = f.series_id and x.status = 'published')));
  end if;
  return false;
end $$;

create or replace function public.ish_comment_react(kind text, comment uuid, value integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := ishrah_private.comment_actor();
  old smallint;
  mine smallint;
  counts jsonb;
  n integer;
begin
  if value is null or value not in (-1, 1, 2, 3) then raise exception 'vote_value'; end if;
  if not ishrah_private.comment_open(kind, comment) then raise exception 'comment_unavailable'; end if;
  select l.reaction into old from public.comment_likes l where l.kind = ish_comment_react.kind and l.comment_id = comment and l.user_id = me.id for update;
  if old is not null and old = value then
    delete from public.comment_likes l where l.kind = ish_comment_react.kind and l.comment_id = comment and l.user_id = me.id;
    mine := null;
  elsif old is not null then
    update public.comment_likes l set reaction = value where l.kind = ish_comment_react.kind and l.comment_id = comment and l.user_id = me.id;
    mine := value;
  else
    insert into public.comment_likes (kind, comment_id, user_id, reaction) values (ish_comment_react.kind, comment, me.id, value);
    mine := value;
  end if;
  select coalesce(jsonb_object_agg(reaction::text, c), '{}'), coalesce(sum(c), 0) into counts, n
    from (select l.reaction, count(*) c from public.comment_likes l where l.kind = ish_comment_react.kind and l.comment_id = comment group by l.reaction) z;
  if kind = 'reply' then update public.replies set like_count = n, rx = counts where id = comment;
  elsif kind = 'request' then update public.course_request_comments set like_count = n, rx = counts where id = comment;
  else update public.library_comments set like_count = n, rx = counts where id = comment; end if;
  return jsonb_build_object('mine', mine, 'rx', counts, 'count', n);
end $$;
revoke all on function public.ish_comment_react(text, uuid, integer) from public, anon;
grant execute on function public.ish_comment_react(text, uuid, integer) to authenticated;

-- existing comment likes count as 👍
update public.replies set rx = jsonb_build_object('1', like_count) where like_count > 0 and rx = '{}';
update public.course_request_comments set rx = jsonb_build_object('1', like_count) where like_count > 0 and rx = '{}';
update public.library_comments set rx = jsonb_build_object('1', like_count) where like_count > 0 and rx = '{}';

-- the thread guard also protects rx
create or replace function ishrah_private.guard_comment_thread() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.parent_id := null; new.reply_to := null; new.reply_to_name := null; new.like_count := 0; new.rx := '{}';
    elsif row(new.parent_id, new.reply_to, new.reply_to_name, new.like_count, new.rx) is distinct from row(old.parent_id, old.reply_to, old.reply_to_name, old.like_count, old.rx) then
      raise exception 'comment_thread_locked';
    end if;
  end if;
  return new;
end $$;

-- answers on series comments carry the series; notifications name the series
create or replace function public.ish_comment_reply(kind text, parent uuid, body text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := ishrah_private.comment_actor();
  msg text := btrim(coalesce(body, ''));
  r public.replies; q public.course_request_comments; f public.library_comments;
  new_id uuid;
begin
  if char_length(msg) < 1 or char_length(msg) > 2000 then raise exception 'comment_body'; end if;
  if not ishrah_private.comment_open(kind, parent) then raise exception 'comment_unavailable'; end if;
  if kind = 'reply' then
    select * into r from public.replies where id = parent;
    insert into public.replies (post_id, announcement_id, course_id, event_id, news_id, user_id, name, photo, body, status, parent_id, reply_to, reply_to_name)
      values (r.post_id, r.announcement_id, r.course_id, r.event_id, r.news_id, me.id, me.name, me.photo, msg, 'open',
        coalesce(r.parent_id, r.id), r.user_id, r.name) returning id into new_id;
  elsif kind = 'request' then
    select * into q from public.course_request_comments where id = parent;
    if not exists (select 1 from public.course_requests x where x.id = q.request_id and x.status = 'open') then raise exception 'request_closed'; end if;
    insert into public.course_request_comments (request_id, user_id, author_name, body, parent_id, reply_to, reply_to_name)
      values (q.request_id, me.id, me.name, msg, coalesce(q.parent_id, q.id), q.user_id, q.author_name) returning id into new_id;
  elsif kind = 'file' then
    select * into f from public.library_comments where id = parent;
    insert into public.library_comments (file_id, series_id, user_id, author_name, body, parent_id, reply_to, reply_to_name)
      values (f.file_id, f.series_id, me.id, me.name, msg, coalesce(f.parent_id, f.id), f.user_id, f.author_name) returning id into new_id;
  else
    raise exception 'comment_unavailable';
  end if;
  return new_id;
end $$;

create or replace function ishrah_private.comment_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  who uuid := new.user_id;
  nm text;
  owner uuid; title text; link text; top_author uuid;
begin
  if tg_table_name = 'replies' then
    if new.status is distinct from 'open' then return null; end if;
    nm := coalesce(new.name, '');
    if new.post_id is not null then
      select p.user_id, coalesce(nullif(p.title, ''), left(p.body, 80)) into owner, title from public.posts p where p.id = new.post_id;
      link := '#post/' || new.post_id || '/comments';
      if exists (select 1 from public.posts p where p.id = new.post_id and p.room = 'qa') then owner := null; end if;
    elsif new.course_id is not null then select c.lecturer_id, c.title into owner, title from public.courses c where c.id = new.course_id; link := '#course/' || new.course_id;
    elsif new.event_id is not null then select e.lecturer_id, e.title into owner, title from public.events e where e.id = new.event_id; link := '#event/' || new.event_id;
    elsif new.news_id is not null then select null::uuid, n.title into owner, title from public.news n where n.id = new.news_id; link := '#news/' || new.news_id;
    else link := '#news/ann/' || new.announcement_id; end if;
    if new.parent_id is not null then select r.user_id into top_author from public.replies r where r.id = new.parent_id; end if;
  elsif tg_table_name = 'course_request_comments' then
    nm := coalesce(new.author_name, '');
    select x.user_id, x.title into owner, title from public.course_requests x where x.id = new.request_id;
    link := '#course-request/' || new.request_id || '/comments';
    if new.parent_id is not null then select c.user_id into top_author from public.course_request_comments c where c.id = new.parent_id; end if;
  else
    nm := coalesce(new.author_name, '');
    if new.series_id is not null then
      select x.owner_id, coalesce(x.series_title, x.title) into owner, title from public.files x where x.series_id = new.series_id order by x.series_no nulls last limit 1;
      link := '#series/' || new.series_id;
    else
      select x.owner_id, coalesce(x.series_title, x.title) into owner, title from public.files x where x.id = new.file_id;
      link := '#file/' || new.file_id;
    end if;
    if new.parent_id is not null then select c.user_id into top_author from public.library_comments c where c.id = new.parent_id; end if;
  end if;
  if new.parent_id is not null then
    if new.reply_to is not null and new.reply_to is distinct from who then
      insert into public.notices (user_id, title, title_en, body, link, actor, kind)
        values (new.reply_to, 'ردّ ' || nm || ' على تعليقك', nm || ' replied to your comment', left(new.body, 140), link, who, 'social');
    end if;
    if top_author is not null and top_author is distinct from who and top_author is distinct from new.reply_to then
      insert into public.notices (user_id, title, title_en, body, link, actor, kind)
        values (top_author, 'ردّ ' || nm || ' في نقاش تعليقك', nm || ' replied in your comment thread', left(new.body, 140), link, who, 'social');
    end if;
  end if;
  if owner is not null and owner is distinct from who and owner is distinct from new.reply_to and owner is distinct from top_author then
    insert into public.notices (user_id, title, title_en, body, link, actor, kind)
      values (owner, 'علّق ' || nm || ' على ' || coalesce(nullif(title, ''), 'منشورك'), nm || ' commented on ' || coalesce(nullif(title, ''), 'your post'), left(new.body, 140), link, who, 'social');
  end if;
  return null;
exception when others then
  return null;
end $$;

notify pgrst, 'reload schema';
commit;
