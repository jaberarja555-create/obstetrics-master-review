-- Members of each speciality space (owner, 19 Nov 2026: "show the number of signed-in students and the online ones … each speciality has its
-- own sign-in: medicine and nursing are different, so students know how many doctors or nurses are in the place they joined and how many are
-- online now, also how many lecturers and how many online"). A signed-in account that opens a speciality space joins it; the app renews
-- last_seen about once a minute. Anyone (also visitors) may read the COUNTS only, never who.
begin;

create table if not exists public.space_members (
  user_id uuid not null references public.profiles on delete cascade,
  spec text not null references public.specialties on update cascade on delete cascade,
  joined_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (user_id, spec)
);
create index if not exists ish_space_members_seen on public.space_members (spec, last_seen desc);
alter table public.space_members enable row level security;
revoke all on public.space_members from public, anon, authenticated;
grant select on public.space_members to authenticated;
drop policy if exists own on public.space_members;
create policy own on public.space_members for select to authenticated using (user_id = (select auth.uid()));

-- accounts that already chose a speciality are members of it
insert into public.space_members (user_id, spec, joined_at, last_seen)
  select p.id, p.spec, coalesce(p.created_at, now()), coalesce(p.last_seen, p.created_at, now())
  from public.profiles p where p.spec is not null and exists (select 1 from public.specialties s where s.id = p.spec)
  on conflict do nothing;

create or replace function public.ish_space_stats(p_spec text) returns jsonb
language sql stable security definer set search_path = '' as $$
  with lec as (
    select l.id from public.lecturers l
    where l.status = 'active' and (p_spec = any (l.teaching_specs)
      or exists (select 1 from public.space_members m where m.user_id = l.id and m.spec = p_spec))
  )
  select jsonb_build_object(
    'members', (select count(*) from public.space_members m join public.profiles p on p.id = m.user_id
      where m.spec = p_spec and p.status is distinct from 'blocked' and m.user_id not in (select id from lec)),
    'online', (select count(*) from public.space_members m where m.spec = p_spec and m.last_seen > now() - interval '5 minutes'
      and m.user_id not in (select id from lec)),
    'lecturers', (select count(*) from lec),
    'lecturers_online', (select count(*) from lec join public.profiles p on p.id = lec.id where p.last_seen > now() - interval '5 minutes'))
$$;
revoke all on function public.ish_space_stats(text) from public;
grant execute on function public.ish_space_stats(text) to anon, authenticated;

-- join the space (first time) and say "I am here" (every minute while the app is open)
create or replace function public.ish_space_join(p_spec text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if actor is null then raise exception 'request_sign_in'; end if;
  if not exists (select 1 from public.specialties where id = p_spec) then raise exception 'request_unavailable'; end if;
  insert into public.space_members (user_id, spec) values (actor, p_spec)
    on conflict (user_id, spec) do update set last_seen = now() where space_members.last_seen < now() - interval '30 seconds';
  update public.profiles set last_seen = now() where id = actor and (last_seen is null or last_seen < now() - interval '45 seconds');
  return public.ish_space_stats(p_spec);
end $$;
revoke all on function public.ish_space_join(text) from public, anon;
grant execute on function public.ish_space_join(text) to authenticated;

notify pgrst, 'reload schema';
commit;
