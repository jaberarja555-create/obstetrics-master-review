-- Extend in-place feed feedback to published courses, events and news.
begin;

alter table public.courses
  add column if not exists like_count integer not null default 0,
  add column if not exists dislike_count integer not null default 0,
  add column if not exists comment_count integer not null default 0;
drop trigger if exists ish_guard_feed_counts on public.courses;
create trigger ish_guard_feed_counts before insert or update on public.courses
  for each row execute function ishrah_private.guard_announcement_counts();

alter table public.feed_feedback add column if not exists course_id uuid references public.courses on delete cascade;
create unique index if not exists feed_feedback_course_user on public.feed_feedback (course_id,user_id) where course_id is not null;

alter table public.replies add column if not exists course_id uuid references public.courses on delete cascade;
create index if not exists replies_course_date on public.replies (course_id,created_at desc) where course_id is not null;

alter table public.events
  add column if not exists like_count integer not null default 0,
  add column if not exists dislike_count integer not null default 0,
  add column if not exists comment_count integer not null default 0;
drop trigger if exists ish_guard_feed_counts on public.events;
create trigger ish_guard_feed_counts before insert or update on public.events
  for each row execute function ishrah_private.guard_announcement_counts();

alter table public.feed_feedback add column if not exists event_id uuid references public.events on delete cascade;
create unique index if not exists feed_feedback_event_user on public.feed_feedback (event_id,user_id) where event_id is not null;

alter table public.replies add column if not exists event_id uuid references public.events on delete cascade;
create index if not exists replies_event_date on public.replies (event_id,created_at desc) where event_id is not null;

alter table public.news
  add column if not exists like_count integer not null default 0,
  add column if not exists dislike_count integer not null default 0,
  add column if not exists comment_count integer not null default 0;
drop trigger if exists ish_guard_feed_counts on public.news;
create trigger ish_guard_feed_counts before insert or update on public.news
  for each row execute function ishrah_private.guard_announcement_counts();

alter table public.feed_feedback add column if not exists news_id uuid references public.news on delete cascade;
create unique index if not exists feed_feedback_news_user on public.feed_feedback (news_id,user_id) where news_id is not null;

alter table public.replies add column if not exists news_id uuid references public.news on delete cascade;
create index if not exists replies_news_date on public.replies (news_id,created_at desc) where news_id is not null;

alter table public.feed_feedback drop constraint if exists feed_feedback_one_target;
alter table public.feed_feedback drop constraint if exists feed_feedback_star_target;
alter table public.feed_feedback add constraint feed_feedback_one_target
  check (num_nonnulls(post_id,request_id,file_id,announcement_id,course_id,event_id,news_id) = 1);
alter table public.feed_feedback add constraint feed_feedback_star_target
  check (stars is null or post_id is not null or file_id is not null);
alter table public.replies drop constraint if exists replies_single_target;
alter table public.replies add constraint replies_single_target
  check (num_nonnulls(post_id,announcement_id,course_id,event_id,news_id) <= 1);

drop policy if exists own_feedback on public.feed_feedback;
create policy own_feedback on public.feed_feedback for select to authenticated using (user_id = (select auth.uid()) and (
  exists (select 1 from public.posts p where p.id = post_id and p.status not in ('removed','pending','rejected')) or
  exists (select 1 from public.course_requests r where r.id = request_id and r.status in ('open','closed')) or
  exists (select 1 from public.files f where f.id = file_id and f.status = 'published') or
  exists (select 1 from public.notices n where n.id = announcement_id and n.user_id is null) or
  exists (select 1 from public.courses a where a.id = course_id and a.status = 'published') or
  exists (select 1 from public.events a where a.id = event_id and a.status = 'published') or
  exists (select 1 from public.news a where a.id = news_id and a.status = 'published')
));

drop policy if exists r on public.replies;
create policy r on public.replies for select to anon, authenticated using (
  (status <> 'removed' or (select public.ish_do('community','view'))) and (
    exists (select 1 from public.posts p where p.id = post_id and p.status not in ('pending','rejected')) or
    exists (select 1 from public.notices n where n.id = announcement_id and n.user_id is null) or
    exists (select 1 from public.courses a where a.id = course_id and a.status = 'published') or
    exists (select 1 from public.events a where a.id = event_id and a.status = 'published') or
    exists (select 1 from public.news a where a.id = news_id and a.status = 'published')
  )
);
drop policy if exists i on public.replies;
create policy i on public.replies for insert to authenticated with check (
  user_id = (select auth.uid()) and (
    exists (select 1 from public.posts p where p.id = post_id and p.status not in ('removed','pending','rejected')) or
    (status = 'open' and char_length(btrim(body)) between 1 and 2000 and (
      exists (select 1 from public.notices n where n.id = announcement_id and n.user_id is null) or
      exists (select 1 from public.courses a where a.id = course_id and a.status = 'published') or
      exists (select 1 from public.events a where a.id = event_id and a.status = 'published') or
      exists (select 1 from public.news a where a.id = news_id and a.status = 'published')))
  )
);

create or replace function ishrah_private.guard_announcement_reply() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if row(new.post_id,new.announcement_id,new.course_id,new.event_id,new.news_id) is distinct from
       row(old.post_id,old.announcement_id,old.course_id,old.event_id,old.news_id) then
      raise exception 'reply_target';
    end if;
  elsif new.post_id is null and current_user = 'authenticated' then
    select p.name, p.photo into new.name, new.photo
      from public.profiles p where p.id = auth.uid() and p.status is distinct from 'blocked' and p.team_status is distinct from 'suspended';
    if not found then raise exception 'request_sign_in'; end if;
    new.created_at := now();
  end if;
  return new;
end $$;

create or replace function ishrah_private.count_announcement_replies() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  delta integer := (case when tg_op <> 'DELETE' and new.status = 'open' then 1 else 0 end)
    - (case when tg_op <> 'INSERT' and old.status = 'open' then 1 else 0 end);
begin
  if delta = 0 then return null; end if;
  if coalesce(new.announcement_id,old.announcement_id) is not null then
    update public.notices set comment_count = comment_count + delta
      where id = coalesce(new.announcement_id,old.announcement_id) and user_id is null;
  elsif coalesce(new.course_id,old.course_id) is not null then
    update public.courses set comment_count = comment_count + delta where id = coalesce(new.course_id,old.course_id);
  elsif coalesce(new.event_id,old.event_id) is not null then
    update public.events set comment_count = comment_count + delta where id = coalesce(new.event_id,old.event_id);
  elsif coalesce(new.news_id,old.news_id) is not null then
    update public.news set comment_count = comment_count + delta where id = coalesce(new.news_id,old.news_id);
  end if;
  return null;
end $$;

drop policy if exists i on public.reports;
create policy i on public.reports for insert to authenticated with check (
  user_id = (select auth.uid()) and status = 'open' and handled_by is null
  and char_length(trim(reason)) between 1 and 2000
  and case kind
    when 'post' then exists (select 1 from public.posts p where p.id = target and p.status = 'open')
    when 'reply' then exists (select 1 from public.replies r where r.id = target and r.status = 'open' and (
      exists (select 1 from public.posts p where p.id = r.post_id and p.status = 'open') or
      exists (select 1 from public.notices n where n.id = r.announcement_id and n.user_id is null) or
      exists (select 1 from public.courses a where a.id = r.course_id and a.status = 'published') or
      exists (select 1 from public.events a where a.id = r.event_id and a.status = 'published') or
      exists (select 1 from public.news a where a.id = r.news_id and a.status = 'published')
    ))
    when 'review' then exists (select 1 from public.reviews r where r.id = target)
    when 'request' then exists (select 1 from public.course_requests r where r.id = target and r.status in ('open','closed'))
    when 'request_comment' then exists (select 1 from public.course_request_comments c where c.id = target)
    when 'news' then exists (select 1 from public.news n where n.id = target and n.status = 'published')
    when 'announcement' then exists (select 1 from public.notices n where n.id = target and n.user_id is null)
    when 'course' then exists (select 1 from public.courses a where a.id = target and a.status = 'published')
    when 'event' then exists (select 1 from public.events a where a.id = target and a.status = 'published')
    when 'file' then exists (select 1 from public.files a where a.id = target and a.status = 'published')
    when 'file_comment' then exists (select 1 from public.library_comments c where c.id = target)
    else false
  end
);

create or replace function ishrah_private.moderate_feed_report(report_id uuid, remove_content boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  entry public.reports;
begin
  if not coalesce(public.ish_do('community','edit'), false) then raise exception 'moderation_permission'; end if;
  select * into entry from public.reports where id = report_id and status = 'open' for update;
  if not found then return; end if;
  if remove_content then
    case entry.kind
      when 'post' then update public.posts set status = 'removed' where id = entry.target and status = 'open';
      when 'reply' then update public.replies set status = 'removed' where id = entry.target and status = 'open';
      when 'request_comment' then delete from public.course_request_comments where id = entry.target;
      when 'file_comment' then delete from public.library_comments where id = entry.target;
      when 'news' then update public.news set status = 'removed' where id = entry.target and status = 'published';
      when 'announcement' then delete from public.notices where id = entry.target and user_id is null;
      when 'request' then
        perform 1 from public.course_requests where id = entry.target for update;
        if exists (select 1 from public.course_requests where id = entry.target and reserved_count > 0) then
          raise exception 'request_has_payments';
        end if;
        update public.course_requests set status = 'deleted' where id = entry.target and status in ('open','closed');
      else raise exception 'moderation_kind';
    end case;
    insert into public.audit (user_id,action,target) values (auth.uid(),'remove reported ' || entry.kind, entry.target::text);
  end if;
  update public.reports set status = 'resolved', handled_by = auth.uid() where id = entry.id;
end $$;

revoke all on function ishrah_private.moderate_feed_report(uuid,boolean) from public, anon, authenticated;
grant execute on function ishrah_private.moderate_feed_report(uuid,boolean) to authenticated;
create or replace function public.ish_moderate_feed_report(report_id uuid, remove_content boolean)
returns void language sql security invoker set search_path = '' as $$
  select ishrah_private.moderate_feed_report(report_id,remove_content)
$$;

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
  elsif coalesce(new.course_id,old.course_id) is not null then
    update public.courses set like_count = like_count + likes, dislike_count = dislike_count + dislikes
      where id = coalesce(new.course_id,old.course_id);
  elsif coalesce(new.event_id,old.event_id) is not null then
    update public.events set like_count = like_count + likes, dislike_count = dislike_count + dislikes
      where id = coalesce(new.event_id,old.event_id);
  elsif coalesce(new.news_id,old.news_id) is not null then
    update public.news set like_count = like_count + likes, dislike_count = dislike_count + dislikes
      where id = coalesce(new.news_id,old.news_id);
  else
    update public.course_requests set like_count = like_count + likes, dislike_count = dislike_count + dislikes
      where id = coalesce(new.request_id,old.request_id);
  end if;
  return null;
end $$;

create or replace function ishrah_private.feed_react(kind text, target uuid, value integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  parent_table regclass;
  foreign_key text;
  locked_id uuid;
  saved smallint;
  likes integer;
  dislikes integer;
begin
  parent_table := case kind
    when 'course' then 'public.courses'::regclass
    when 'event' then 'public.events'::regclass
    when 'news' then 'public.news'::regclass
    else null
  end;
  if parent_table is not null then
    if actor is null or not exists (
      select 1 from public.profiles where id = actor and status is distinct from 'blocked' and team_status is distinct from 'suspended'
    ) then raise exception 'request_sign_in'; end if;
    if value is null or value not in (-1,1) then raise exception 'vote_value'; end if;
    execute format('select id from %s where id = $1 and status = %L for update', parent_table, 'published') into locked_id using target;
    if locked_id is null then raise exception 'request_unavailable'; end if;
    foreign_key := kind || '_id';
    execute format('insert into public.feed_feedback as f (%1$I,user_id,reaction)
      values ($1,$2,$3) on conflict (%1$I,user_id) where %1$I is not null
      do update set reaction = nullif($3,f.reaction) returning reaction', foreign_key)
      into saved using target, actor, value;
    execute format('select like_count,dislike_count from %s where id = $1', parent_table) into likes, dislikes using target;
    return jsonb_build_object('my_reaction',saved,'like_count',likes,'dislike_count',dislikes);
  end if;

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

notify pgrst, 'reload schema';
commit;
