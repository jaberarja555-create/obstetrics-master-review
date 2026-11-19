-- Who is in a speciality space, for the team (owner, 19 Nov 2026: "an admin should be able to know specifically who is online and who is
-- registered there"). Only accounts allowed to view students get names; everyone else keeps the counts of ish_space_stats.
begin;

create or replace function public.ish_space_people(p_spec text, p_kind text)
returns table (id uuid, name text, photo text, last_seen timestamptz, joined_at timestamptz, lecturer boolean, online boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not (public.ish_do('students','view') or public.ish_do('dash','view')) then raise exception 'request_permission' using errcode = '42501'; end if;
  if p_kind not in ('members','online','lecturers','lecturers_online') then raise exception 'request_unavailable'; end if;
  return query
  with lec as (
    select l.id from public.lecturers l
    where l.status = 'active' and (p_spec = any (l.teaching_specs)
      or exists (select 1 from public.space_members m where m.user_id = l.id and m.spec = p_spec))
  ), people as (
    select p.id, p.name, p.photo, greatest(m.last_seen, p.last_seen) as seen, m.joined_at, false as lecturer
      from public.space_members m join public.profiles p on p.id = m.user_id
      where m.spec = p_spec and m.user_id not in (select lec.id from lec) and p_kind in ('members','online')
    union all
    select p.id, p.name, p.photo, p.last_seen, m.joined_at, true
      from lec join public.profiles p on p.id = lec.id
      left join public.space_members m on m.user_id = lec.id and m.spec = p_spec
      where p_kind in ('lecturers','lecturers_online')
  )
  select x.id, x.name, x.photo, x.seen, x.joined_at, x.lecturer, coalesce(x.seen > now() - interval '5 minutes', false)
  from people x
  where p_kind in ('members','lecturers') or x.seen > now() - interval '5 minutes'
  order by (x.seen > now() - interval '5 minutes') desc nulls last, x.seen desc nulls last
  limit 1000;
end $$;
revoke all on function public.ish_space_people(text,text) from public, anon;
grant execute on function public.ish_space_people(text,text) to authenticated;

notify pgrst, 'reload schema';
commit;
