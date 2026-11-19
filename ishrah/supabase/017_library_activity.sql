begin;

alter table public.files add column if not exists published_at timestamptz;
alter table public.files add column if not exists reading_path text;
alter table public.files add column if not exists like_count integer not null default 0;
alter table public.files add column if not exists dislike_count integer not null default 0;
alter table public.files add column if not exists comment_count integer not null default 0;
alter table public.files add column if not exists rating_count integer not null default 0;
alter table public.files add column if not exists rating_points integer not null default 0;
alter table public.files add column if not exists average_rating numeric generated always as (
  round(rating_points::numeric / nullif(rating_count, 0), 2)
) stored;

update public.files f set cat = s.cat, spec = s.spec from public.subjects s where f.subject = s.id
  and (f.cat,f.spec) is distinct from (s.cat,s.spec);
update public.files set published_at = created_at where status = 'published' and published_at is null;
create index if not exists library_activity_recent on public.files (spec,cat,published_at desc)
  where status = 'published';
create index if not exists library_activity_best on public.files (spec,cat,average_rating desc nulls last,rating_count desc)
  where status = 'published' and rating_count > 0;
create index if not exists library_activity_most_rated on public.files (spec,cat,rating_count desc,average_rating desc nulls last)
  where status = 'published' and rating_count > 0;
create index if not exists library_cover_path on public.files(cover);
create index if not exists library_file_path on public.files(path);
create index if not exists library_reading_path on public.files(reading_path);

create or replace function ishrah_private.guard_library_activity() returns trigger
language plpgsql set search_path = '' as $$
declare
  actor uuid := auth.uid();
begin
  if current_user in ('anon','authenticated') then
    if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from new.status)
      and not (public.ish_do('library','add') or public.ish_do('library','approve')) then
      new.status := 'pending';
    end if;
    if actor is not null and (
      (new.path is not null and (tg_op = 'INSERT' or old.path is distinct from new.path)
        and split_part(new.path,'/',1) <> actor::text)
      or (new.reading_path is not null and (tg_op = 'INSERT' or old.reading_path is distinct from new.reading_path)
        and split_part(new.reading_path,'/',1) <> actor::text)
      or (new.cover is not null and (tg_op = 'INSERT' or old.cover is distinct from new.cover)
        and not (new.cover ~ '^https://' or split_part(new.cover,'/',1) = actor::text))
    ) then raise exception 'invalid_library_object'; end if;
    if tg_op = 'INSERT' then
      new.like_count := 0; new.dislike_count := 0; new.comment_count := 0;
      new.rating_count := 0; new.rating_points := 0;
    else
      new.like_count := old.like_count; new.dislike_count := old.dislike_count; new.comment_count := old.comment_count;
      new.rating_count := old.rating_count; new.rating_points := old.rating_points;
      new.published_at := old.published_at;
    end if;
  end if;
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    new.published_at := now();
  elsif tg_op = 'INSERT' then
    new.published_at := null;
  end if;
  return new;
end $$;
revoke all on function ishrah_private.guard_library_activity() from public, anon, authenticated;
drop trigger if exists ish_guard_library_activity on public.files;
create trigger ish_guard_library_activity before insert or update on public.files
  for each row execute function ishrah_private.guard_library_activity();

-- Existing public cover URLs keep working. New covers use the private library bucket.
drop policy if exists ish_read on storage.objects;
create policy ish_read on storage.objects for select to anon, authenticated using (
  bucket_id = 'media'
  or (bucket_id = 'receipts' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.ish_do('pay','view'))))
  or (bucket_id = 'apps' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.ish_do('apps','view'))))
  or (bucket_id = 'library' and (
    ((select auth.uid()) is not null and (storage.foldername(name))[1] = (select auth.uid())::text)
    or exists (
      select 1 from public.files f
      where (f.cover = storage.objects.name and f.status = 'published')
        or ((select auth.uid()) is not null and storage.objects.name in (f.path, f.reading_path, f.cover))
    )
  ))
);

alter table public.feed_feedback add column if not exists file_id uuid references public.files on delete cascade;
alter table public.feed_feedback drop constraint if exists feed_feedback_check;
alter table public.feed_feedback drop constraint if exists feed_feedback_check1;
alter table public.feed_feedback drop constraint if exists feed_feedback_one_target;
alter table public.feed_feedback drop constraint if exists feed_feedback_star_target;
alter table public.feed_feedback add constraint feed_feedback_one_target check (num_nonnulls(post_id,request_id,file_id) = 1);
alter table public.feed_feedback add constraint feed_feedback_star_target check (request_id is null or stars is null);
create unique index if not exists feed_feedback_file_user on public.feed_feedback (file_id,user_id) where file_id is not null;

drop policy if exists own_feedback on public.feed_feedback;
create policy own_feedback on public.feed_feedback for select to authenticated using (user_id = (select auth.uid()) and (
  exists (select 1 from public.posts p where p.id = post_id and p.status not in ('removed','pending','rejected')) or
  exists (select 1 from public.course_requests r where r.id = request_id and r.status in ('open','closed')) or
  exists (select 1 from public.files f where f.id = file_id and f.status = 'published')
));

create table if not exists public.library_comments (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  author_name text not null,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists library_comments_file_date on public.library_comments(file_id, created_at, id);
create index if not exists library_comments_author on public.library_comments(user_id);
alter table public.library_comments enable row level security;
revoke all on public.library_comments from public, anon, authenticated;
grant select on public.library_comments to anon, authenticated;
drop policy if exists published_file_comments on public.library_comments;
create policy published_file_comments on public.library_comments for select to anon, authenticated using (
  exists (select 1 from public.files f where f.id = file_id and f.status = 'published')
);

create or replace function ishrah_private.count_library_comments() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.files set comment_count = comment_count + 1 where id = new.file_id;
  else
    update public.files set comment_count = comment_count - 1 where id = old.file_id;
  end if;
  return null;
end $$;
revoke all on function ishrah_private.count_library_comments() from public, anon, authenticated;
drop trigger if exists ish_library_comment_count on public.library_comments;
create trigger ish_library_comment_count after insert or delete on public.library_comments
  for each row execute function ishrah_private.count_library_comments();

create or replace function ishrah_private.library_comment(file uuid, message text, remove uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  author text;
begin
  select name into author from public.profiles where id = actor and status is distinct from 'blocked'
    and team_status is distinct from 'suspended';
  if not found then raise exception 'request_sign_in'; end if;
  perform 1 from public.files where id = file and status = 'published' for update;
  if not found then raise exception 'request_unavailable'; end if;
  if remove is not null then
    delete from public.library_comments where id = remove and file_id = file
      and (user_id = actor or public.ish_do('library','approve') or public.ish_do('community','delete'));
    if not found then raise exception 'request_permission'; end if;
  else
    insert into public.library_comments(file_id,user_id,author_name,body) values (file,actor,author,btrim(message));
  end if;
end $$;
revoke all on function ishrah_private.library_comment(uuid,text,uuid) from public, anon, authenticated;
grant execute on function ishrah_private.library_comment(uuid,text,uuid) to authenticated;
create or replace function public.ish_library_comment(file uuid, message text default null, remove uuid default null)
returns void language sql security invoker set search_path = '' as $$
  select ishrah_private.library_comment(file,message,remove)
$$;
revoke all on function public.ish_library_comment(uuid,text,uuid) from public, anon, authenticated;
grant execute on function public.ish_library_comment(uuid,text,uuid) to authenticated;

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
    ((kind = 'post' and post_id = target) or (kind = 'request' and request_id = target) or (kind = 'file' and file_id = target));
  if f.id is null then
    insert into public.feed_feedback (post_id,request_id,file_id,user_id,reaction,stars)
      values (case when kind = 'post' then target end,case when kind = 'request' then target end,case when kind = 'file' then target end,actor,
        case when action = 'react' then value end,case when action = 'rate' then value end);
  elsif action = 'react' then
    update public.feed_feedback set reaction = case when f.reaction is distinct from value then value end where id = f.id;
  else
    update public.feed_feedback set stars = value where id = f.id;
  end if;
end $$;


notify pgrst, 'reload schema';
commit;
