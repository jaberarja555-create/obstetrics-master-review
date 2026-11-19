-- A reader's star rating replaces their reaction in the combined file score.
begin;

alter table public.files
  add column if not exists rated_like_count integer not null default 0,
  add column if not exists rated_dislike_count integer not null default 0;

-- Recomputing the existing totals also makes this migration repeatable.
with rated as (
  select f.id,
    count(*) filter (where v.stars is not null and v.reaction = 1) as likes,
    count(*) filter (where v.stars is not null and v.reaction = -1) as dislikes
  from public.files f
  left join public.feed_feedback v on v.file_id = f.id
  group by f.id
)
update public.files f set rated_like_count = rated.likes, rated_dislike_count = rated.dislikes
from rated where rated.id = f.id and row(f.rated_like_count,f.rated_dislike_count) is distinct from row(rated.likes,rated.dislikes);

create or replace function ishrah_private.guard_rating_overlap() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon','authenticated') then
    new.rated_like_count := case when tg_op = 'INSERT' then 0 else old.rated_like_count end;
    new.rated_dislike_count := case when tg_op = 'INSERT' then 0 else old.rated_dislike_count end;
  end if;
  return new;
end $$;
revoke all on function ishrah_private.guard_rating_overlap() from public, anon, authenticated;
drop trigger if exists ish_guard_rating_overlap on public.files;
create trigger ish_guard_rating_overlap before insert or update of rated_like_count,rated_dislike_count on public.files
for each row execute function ishrah_private.guard_rating_overlap();

create or replace function ishrah_private.count_rating_overlap() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  target uuid := coalesce(new.file_id,old.file_id);
  before_r smallint := case when tg_op <> 'INSERT' and old.stars is not null then old.reaction end;
  after_r smallint := case when tg_op <> 'DELETE' and new.stars is not null then new.reaction end;
begin
  if target is not null and before_r is distinct from after_r then
    update public.files
    set rated_like_count = rated_like_count + coalesce((after_r = 1)::integer,0) - coalesce((before_r = 1)::integer,0),
        rated_dislike_count = rated_dislike_count + coalesce((after_r = -1)::integer,0) - coalesce((before_r = -1)::integer,0)
    where id = target;
  end if;
  return null;
end $$;
revoke all on function ishrah_private.count_rating_overlap() from public, anon, authenticated;
drop trigger if exists ish_count_rating_overlap on public.feed_feedback;
create trigger ish_count_rating_overlap after insert or update or delete on public.feed_feedback
for each row execute function ishrah_private.count_rating_overlap();

create or replace function public.ish_feed_react(kind text, target uuid, value integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result jsonb;
begin
  result := ishrah_private.feed_react(kind,target,value);
  if kind = 'file' then
    result := result || (select jsonb_build_object('rated_like_count',rated_like_count,'rated_dislike_count',rated_dislike_count)
      from public.files where id = target);
  end if;
  return result;
end $$;

create or replace function public.ish_rate_file(file uuid, stars integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result jsonb;
begin
  perform ishrah_private.feed_vote('file',file,'rate',stars);
  select jsonb_build_object('rating_count',rating_count,'rating_points',rating_points,'average_rating',average_rating,
      'like_count',like_count,'dislike_count',dislike_count,'rated_like_count',rated_like_count,'rated_dislike_count',rated_dislike_count)
    into result from public.files where id = file;
  return result;
end $$;

create schema if not exists ishrah_rating_private;

create or replace function ishrah_rating_private.series_rating_scores(targets uuid[])
returns table (series_id uuid, like_count bigint, dislike_count bigint, rating_count bigint, rating_points bigint,
  my_reaction integer, my_stars integer, rated_like_count bigint, rated_dislike_count bigint)
language sql stable security definer set search_path = '' as $$
  select s.id, count(*) filter (where v.reaction = 1), count(*) filter (where v.reaction = -1),
    count(v.stars), coalesce(sum(v.stars), 0),
    coalesce(max(v.reaction) filter (where v.user_id = auth.uid()), 0),
    coalesce(max(v.stars) filter (where v.user_id = auth.uid()), 0),
    count(*) filter (where v.reaction = 1 and v.stars is not null),
    count(*) filter (where v.reaction = -1 and v.stars is not null)
  from (select distinct id from unnest(targets) as t(id) limit 200) s
  left join public.series_feedback v on v.series_id = s.id
  where exists (select 1 from public.files f where f.series_id = s.id and f.status = 'published')
  group by s.id
$$;

create or replace function ishrah_rating_private.series_rating_vote(target uuid, action text, value integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if not exists (select 1 from public.profiles where id = actor and status is distinct from 'blocked'
    and team_status is distinct from 'suspended') then raise exception 'request_sign_in'; end if;
  if not exists (select 1 from public.files where series_id = target and status = 'published') then
    raise exception 'request_unavailable';
  end if;
  if action = 'react' and value in (-1,1) then
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
grant usage on schema ishrah_rating_private to anon, authenticated;
revoke all on function ishrah_rating_private.series_rating_scores(uuid[]) from public, anon, authenticated;
grant execute on function ishrah_rating_private.series_rating_scores(uuid[]) to anon, authenticated;
revoke all on function ishrah_rating_private.series_rating_vote(uuid,text,integer) from public, anon, authenticated;
grant execute on function ishrah_rating_private.series_rating_vote(uuid,text,integer) to authenticated;

create or replace function public.ish_series_rating_scores(targets uuid[])
returns table (series_id uuid, like_count bigint, dislike_count bigint, rating_count bigint, rating_points bigint,
  my_reaction integer, my_stars integer, rated_like_count bigint, rated_dislike_count bigint)
language sql stable security invoker set search_path = '' as $$
  select * from ishrah_rating_private.series_rating_scores(targets)
$$;
revoke all on function public.ish_series_rating_scores(uuid[]) from public, anon, authenticated;
grant execute on function public.ish_series_rating_scores(uuid[]) to anon, authenticated;

create or replace function public.ish_series_vote(target uuid, action text, value integer)
returns jsonb language sql security invoker set search_path = '' as $$
  select ishrah_rating_private.series_rating_vote(target,action,value)
$$;

notify pgrst, 'reload schema';
commit;
