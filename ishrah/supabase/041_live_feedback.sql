-- Comments and reactions appear at once on every open screen (owner, 20 Nov 2026: "comments and reactions don't appear instantly like
-- Facebook unless you leave the page and come back; I tried with 2 accounts"), and who reacted with what (owner: "press reactions to know
-- how many of each type, like Facebook").
--   * live_pulse: one row per item (key 'post/<id>', 'series/<id>', …) touched whenever a reaction, a comment or a comment reaction changes.
--     It holds only the key and the time, is readable by everyone and is in the Realtime publication: the app listens to it and re-reads
--     the counts and comments of the items on the screen.
--   * ish_reactors(kind, target): the people who reacted to a post / request / file / announcement / course / event / news / series, or to a
--     comment (kind 'c:reply' · 'c:request' · 'c:file'), with their reaction, newest first.
begin;

create table if not exists public.live_pulse (
  key text primary key,
  at timestamptz not null default now()
);
alter table public.live_pulse enable row level security;
revoke all on public.live_pulse from public, anon, authenticated;
grant select on public.live_pulse to anon, authenticated;
drop policy if exists everyone on public.live_pulse;
create policy everyone on public.live_pulse for select to anon, authenticated using (true);

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'live_pulse') then
    execute 'alter publication supabase_realtime add table public.live_pulse';
  end if;
end $$;

create or replace function ishrah_private.pulse(k text) returns void
language sql security definer set search_path = '' as $$
  insert into public.live_pulse (key, at) values (k, clock_timestamp()) on conflict (key) do update set at = excluded.at
$$;
revoke all on function ishrah_private.pulse(text) from public, anon, authenticated;

-- the feed item a comment belongs to
create or replace function ishrah_private.comment_key(t text, c uuid) returns text
language plpgsql stable security definer set search_path = '' as $$
declare r public.replies; q public.course_request_comments; f public.library_comments;
begin
  if t = 'reply' then
    select * into r from public.replies where id = c;
    return case when r.post_id is not null then 'post/' || r.post_id when r.course_id is not null then 'course/' || r.course_id
      when r.event_id is not null then 'event/' || r.event_id when r.news_id is not null then 'news/' || r.news_id
      when r.announcement_id is not null then 'announcement/' || r.announcement_id end;
  elsif t = 'request' then
    select * into q from public.course_request_comments where id = c; return 'request/' || q.request_id;
  else
    select * into f from public.library_comments where id = c;
    return case when f.series_id is not null then 'series/' || f.series_id else 'file/' || f.file_id end;
  end if;
end $$;
revoke all on function ishrah_private.comment_key(text, uuid) from public, anon, authenticated;

create or replace function ishrah_private.live_touch() returns trigger
language plpgsql security definer set search_path = '' as $$
declare n jsonb := to_jsonb(coalesce(new, old)); k text;
begin
  if tg_table_name = 'feed_feedback' then
    k := case when n->>'post_id' is not null then 'post/' || (n->>'post_id') when n->>'request_id' is not null then 'request/' || (n->>'request_id')
      when n->>'file_id' is not null then 'file/' || (n->>'file_id') when n->>'announcement_id' is not null then 'announcement/' || (n->>'announcement_id')
      when n->>'course_id' is not null then 'course/' || (n->>'course_id') when n->>'event_id' is not null then 'event/' || (n->>'event_id')
      when n->>'news_id' is not null then 'news/' || (n->>'news_id') end;
  elsif tg_table_name = 'series_feedback' then k := 'series/' || (n->>'series_id');
  elsif tg_table_name = 'comment_likes' then k := ishrah_private.comment_key(n->>'kind', (n->>'comment_id')::uuid);
  elsif tg_table_name = 'replies' then k := ishrah_private.comment_key('reply', (n->>'id')::uuid);
    if k is null then   -- the row is gone (delete): rebuild from the old row
      k := case when n->>'post_id' is not null then 'post/' || (n->>'post_id') when n->>'course_id' is not null then 'course/' || (n->>'course_id')
        when n->>'event_id' is not null then 'event/' || (n->>'event_id') when n->>'news_id' is not null then 'news/' || (n->>'news_id')
        when n->>'announcement_id' is not null then 'announcement/' || (n->>'announcement_id') end;
    end if;
  elsif tg_table_name = 'course_request_comments' then k := 'request/' || (n->>'request_id');
  elsif tg_table_name = 'library_comments' then k := case when n->>'series_id' is not null then 'series/' || (n->>'series_id') else 'file/' || (n->>'file_id') end;
  end if;
  if k is not null then perform ishrah_private.pulse(k); end if;
  return null;
exception when others then
  return null;   -- live updates must never stop the user's action
end $$;
revoke all on function ishrah_private.live_touch() from public, anon, authenticated;

drop trigger if exists ish_live_touch on public.feed_feedback;
create trigger ish_live_touch after insert or update or delete on public.feed_feedback for each row execute function ishrah_private.live_touch();
drop trigger if exists ish_live_touch on public.series_feedback;
create trigger ish_live_touch after insert or update or delete on public.series_feedback for each row execute function ishrah_private.live_touch();
drop trigger if exists ish_live_touch on public.comment_likes;
create trigger ish_live_touch after insert or update or delete on public.comment_likes for each row execute function ishrah_private.live_touch();
drop trigger if exists ish_live_touch on public.replies;
create trigger ish_live_touch after insert or update or delete on public.replies for each row execute function ishrah_private.live_touch();
drop trigger if exists ish_live_touch on public.course_request_comments;
create trigger ish_live_touch after insert or update or delete on public.course_request_comments for each row execute function ishrah_private.live_touch();
drop trigger if exists ish_live_touch on public.library_comments;
create trigger ish_live_touch after insert or update or delete on public.library_comments for each row execute function ishrah_private.live_touch();

-- who reacted, with what (only items people can see; names and photos only)
create or replace function public.ish_reactors(kind text, target uuid) returns table (user_id uuid, name text, photo text, reaction smallint, at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if kind in ('c:reply', 'c:request', 'c:file') then
    if not ishrah_private.comment_open(substr(kind, 3), target) then return; end if;
    return query select p.id, p.name, p.photo, l.reaction, l.created_at from public.comment_likes l join public.profiles p on p.id = l.user_id
      where l.kind = substr(ish_reactors.kind, 3) and l.comment_id = target order by l.created_at desc limit 300;
  elsif kind = 'series' then
    if not exists (select 1 from public.files f where f.series_id = target and f.status = 'published') then return; end if;
    return query select p.id, p.name, p.photo, v.reaction::smallint, null::timestamptz from public.series_feedback v join public.profiles p on p.id = v.user_id
      where v.series_id = target and v.reaction is not null limit 300;
  else
    if not (
      (kind = 'post' and exists (select 1 from public.posts x where x.id = target and x.status not in ('removed','pending','rejected'))) or
      (kind = 'request' and exists (select 1 from public.course_requests x where x.id = target and x.status in ('open','closed'))) or
      (kind = 'file' and exists (select 1 from public.files x where x.id = target and x.status = 'published')) or
      (kind = 'announcement' and exists (select 1 from public.notices x where x.id = target and x.user_id is null)) or
      (kind in ('course', 'event', 'news') and exists (select 1 from public.courses x where x.id = target and x.status = 'published'
        union all select 1 from public.events x where x.id = target and x.status = 'published'
        union all select 1 from public.news x where x.id = target and x.status = 'published'))
    ) then return; end if;
    return query select p.id, p.name, p.photo, f.reaction, null::timestamptz from public.feed_feedback f join public.profiles p on p.id = f.user_id
      where f.reaction is not null and (
        (kind = 'post' and f.post_id = target) or (kind = 'request' and f.request_id = target) or (kind = 'file' and f.file_id = target) or
        (kind = 'announcement' and f.announcement_id = target) or (kind = 'course' and f.course_id = target) or
        (kind = 'event' and f.event_id = target) or (kind = 'news' and f.news_id = target)) limit 300;
  end if;
end $$;
revoke all on function public.ish_reactors(text, uuid) from public, anon, authenticated;
grant execute on function public.ish_reactors(text, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
commit;
