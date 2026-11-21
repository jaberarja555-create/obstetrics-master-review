-- The followers of a person, for the «المتابعون» list on profiles and lecturer pages (owner, 21 Nov 2026). Name and picture only.
create or replace function ish_followers(p_user uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'photo', p.photo, 'at', f.created_at) order by f.created_at desc), '[]'::jsonb)
  from (select * from follows where followee = p_user order by created_at desc limit 300) f
  join profiles p on p.id = f.follower and coalesce(p.status, 'active') = 'active';
$$;
revoke all on function ish_followers(uuid) from public;
grant execute on function ish_followers(uuid) to anon, authenticated;
