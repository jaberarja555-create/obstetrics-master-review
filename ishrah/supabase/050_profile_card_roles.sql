-- Profiles of students and admins in the same design as lecturers (owner, 21 Nov 2026): the public card also gives the team role
-- (never personal sections p:*), whether the person is an active lecturer, and the join date. Never a phone number or an email.
create or replace function ish_profile_card(p_user uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', p.id, 'name', p.name, 'photo', p.photo, 'university', p.university, 'year', p.year, 'city', p.city, 'bio', p.bio, 'spec', p.spec,
    'created_at', p.created_at,
    'role', (select r from unnest(coalesce(p.team, '{}')) r where r not like 'p:%' limit 1),
    'lecturer', exists (select 1 from lecturers l where l.id = p.id and l.status = 'active'),
    'verified', coalesce(array_length(p.team, 1), 0) > 0 or exists (select 1 from lecturers l where l.id = p.id and l.status = 'active'),
    'title', (select l.title from lecturers l where l.id = p.id and l.status = 'active'),
    'followers', (select count(*) from follows f where f.followee = p.id),
    'following', (select count(*) from follows f where f.follower = p.id),
    'posts', (select count(*) from posts x where x.user_id = p.id and x.status = 'open'),
    'files', (select count(*) from files x where x.owner_id = p.id and x.status = 'published'),
    'me_follow', exists (select 1 from follows f where f.follower = auth.uid() and f.followee = p.id))
  from profiles p where p.id = p_user and coalesce(p.status, 'active') = 'active';
$$;
revoke all on function ish_profile_card(uuid) from public;
grant execute on function ish_profile_card(uuid) to anon, authenticated;
