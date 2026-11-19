begin;

create table if not exists public.series_feedback (
  series_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction integer check (reaction in (-1, 1)),
  stars integer check (stars between 1 and 5),
  primary key (series_id, user_id)
);
alter table public.series_feedback enable row level security;
revoke all on public.series_feedback from public, anon, authenticated;

create or replace function public.ish_series_scores(targets uuid[])
returns table (series_id uuid, like_count bigint, dislike_count bigint, rating_count bigint, rating_points bigint,
  my_reaction integer, my_stars integer)
language sql stable security definer set search_path = '' as $$
  select s.id, count(*) filter (where v.reaction = 1), count(*) filter (where v.reaction = -1),
    count(v.stars), coalesce(sum(v.stars), 0),
    coalesce(max(v.reaction) filter (where v.user_id = auth.uid()), 0),
    coalesce(max(v.stars) filter (where v.user_id = auth.uid()), 0)
  from (select distinct id from unnest(targets) as t(id) limit 200) s
  left join public.series_feedback v on v.series_id = s.id
  where exists (select 1 from public.files f where f.series_id = s.id and f.status = 'published')
  group by s.id
$$;

create or replace function public.ish_series_vote(target uuid, action text, value integer)
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
  return (select to_jsonb(s) from public.ish_series_scores(array[target]) s);
end $$;
revoke all on function public.ish_series_scores(uuid[]) from public, anon, authenticated;
revoke all on function public.ish_series_vote(uuid,text,integer) from public, anon, authenticated;
grant execute on function public.ish_series_scores(uuid[]) to anon, authenticated;
grant execute on function public.ish_series_vote(uuid,text,integer) to authenticated;

commit;
