-- Comments like Facebook (owner, 20 Nov 2026: "make people interactions in post like in Facebook; now people can't reply to each other").
--   * Every comment can be answered: a reply belongs to its top comment (parent_id = the top comment, so a thread is one level deep like
--     Facebook) and names the person answered (reply_to, reply_to_name). Same for discussion/course/event/news/announcement comments
--     (replies), course request comments and library comments.
--   * Every comment can be liked (comment_likes, one like per person, toggled by ish_comment_like; like_count kept on the comment).
--   * Notifications: the person answered and the top comment's writer are told «ردّ … على تعليقك»; the owner of a post, request, file,
--     course or event is told about a new comment on it. Never to yourself.
begin;

alter table public.replies add column if not exists parent_id uuid references public.replies on delete cascade;
alter table public.replies add column if not exists reply_to uuid;
alter table public.replies add column if not exists reply_to_name text;
alter table public.replies add column if not exists like_count integer not null default 0;
create index if not exists replies_parent on public.replies (parent_id) where parent_id is not null;

alter table public.course_request_comments add column if not exists parent_id uuid references public.course_request_comments on delete cascade;
alter table public.course_request_comments add column if not exists reply_to uuid;
alter table public.course_request_comments add column if not exists reply_to_name text;
alter table public.course_request_comments add column if not exists like_count integer not null default 0;
create index if not exists course_request_comments_parent on public.course_request_comments (parent_id) where parent_id is not null;

alter table public.library_comments add column if not exists parent_id uuid references public.library_comments on delete cascade;
alter table public.library_comments add column if not exists reply_to uuid;
alter table public.library_comments add column if not exists reply_to_name text;
alter table public.library_comments add column if not exists like_count integer not null default 0;
create index if not exists library_comments_parent on public.library_comments (parent_id) where parent_id is not null;

-- people may not set the thread fields or the like count themselves (the RPCs below do it)
create or replace function ishrah_private.guard_comment_thread() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.parent_id := null; new.reply_to := null; new.reply_to_name := null; new.like_count := 0;
    elsif row(new.parent_id, new.reply_to, new.reply_to_name, new.like_count) is distinct from row(old.parent_id, old.reply_to, old.reply_to_name, old.like_count) then
      raise exception 'comment_thread_locked';
    end if;
  end if;
  return new;
end $$;
revoke all on function ishrah_private.guard_comment_thread() from public, anon, authenticated;
drop trigger if exists ish_guard_comment_thread on public.replies;
create trigger ish_guard_comment_thread before insert or update on public.replies for each row execute function ishrah_private.guard_comment_thread();
drop trigger if exists ish_guard_comment_thread on public.course_request_comments;
create trigger ish_guard_comment_thread before insert or update on public.course_request_comments for each row execute function ishrah_private.guard_comment_thread();
drop trigger if exists ish_guard_comment_thread on public.library_comments;
create trigger ish_guard_comment_thread before insert or update on public.library_comments for each row execute function ishrah_private.guard_comment_thread();

create table if not exists public.comment_likes (
  kind text not null check (kind in ('reply', 'request', 'file')),
  comment_id uuid not null,
  user_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (kind, comment_id, user_id)
);
create index if not exists comment_likes_user on public.comment_likes (user_id, kind);
alter table public.comment_likes enable row level security;
revoke all on public.comment_likes from public, anon, authenticated;
grant select on public.comment_likes to authenticated;
drop policy if exists own on public.comment_likes;
create policy own on public.comment_likes for select to authenticated using (user_id = (select auth.uid()));

-- the account writing must be signed in and active
create or replace function ishrah_private.comment_actor() returns public.profiles
language plpgsql stable security definer set search_path = '' as $$
declare me public.profiles;
begin
  select * into me from public.profiles where id = auth.uid() and status is distinct from 'blocked' and team_status is distinct from 'suspended';
  if me.id is null then raise exception 'comment_sign_in'; end if;
  return me;
end $$;
revoke all on function ishrah_private.comment_actor() from public, anon, authenticated;

-- a comment that can still be seen and answered (its page is published and open to comments)
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
    return f.id is not null and exists (select 1 from public.files x where x.id = f.file_id and x.status = 'published');
  end if;
  return false;
end $$;
revoke all on function ishrah_private.comment_open(text, uuid) from public, anon, authenticated;

-- answer a comment (or an answer): the new row joins the top comment's thread and names the person answered
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
    insert into public.library_comments (file_id, user_id, author_name, body, parent_id, reply_to, reply_to_name)
      values (f.file_id, me.id, me.name, msg, coalesce(f.parent_id, f.id), f.user_id, f.author_name) returning id into new_id;
  else
    raise exception 'comment_unavailable';
  end if;
  return new_id;
end $$;
revoke all on function public.ish_comment_reply(text, uuid, text) from public, anon;
grant execute on function public.ish_comment_reply(text, uuid, text) to authenticated;

-- like or unlike a comment; returns the new state and count
create or replace function public.ish_comment_like(kind text, comment uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := ishrah_private.comment_actor();
  liked boolean;
  n integer;
begin
  if not ishrah_private.comment_open(kind, comment) then raise exception 'comment_unavailable'; end if;
  delete from public.comment_likes l where l.kind = ish_comment_like.kind and l.comment_id = comment and l.user_id = me.id;
  liked := not found;
  if liked then insert into public.comment_likes (kind, comment_id, user_id) values (ish_comment_like.kind, comment, me.id); end if;
  select count(*) into n from public.comment_likes l where l.kind = ish_comment_like.kind and l.comment_id = comment;
  if kind = 'reply' then update public.replies set like_count = n where id = comment;
  elsif kind = 'request' then update public.course_request_comments set like_count = n where id = comment;
  else update public.library_comments set like_count = n where id = comment; end if;
  return jsonb_build_object('liked', liked, 'count', n);
end $$;
revoke all on function public.ish_comment_like(text, uuid) from public, anon;
grant execute on function public.ish_comment_like(text, uuid) to authenticated;

-- notifications for comments and answers
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
      if exists (select 1 from public.posts p where p.id = new.post_id and p.room = 'qa') then owner := null; end if;   -- lesson questions keep their own alerts
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
    select x.owner_id, coalesce(x.series_title, x.title) into owner, title from public.files x where x.id = new.file_id;
    link := '#file/' || new.file_id;
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
  return null;   -- a notification must never stop the comment
end $$;
revoke all on function ishrah_private.comment_notify() from public, anon, authenticated;
drop trigger if exists ish_comment_notify on public.replies;
create trigger ish_comment_notify after insert on public.replies for each row execute function ishrah_private.comment_notify();
drop trigger if exists ish_comment_notify on public.course_request_comments;
create trigger ish_comment_notify after insert on public.course_request_comments for each row execute function ishrah_private.comment_notify();
drop trigger if exists ish_comment_notify on public.library_comments;
create trigger ish_comment_notify after insert on public.library_comments for each row execute function ishrah_private.comment_notify();

notify pgrst, 'reload schema';
commit;
