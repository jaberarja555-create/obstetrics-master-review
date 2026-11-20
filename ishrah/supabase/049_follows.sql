-- Person profiles and following (owner, 20 Nov 2026: "this is what is expected in a person profile": posts, followers, following, Follow).
-- Safe to run again.

create table if not exists follows (
  id uuid primary key default gen_random_uuid(),
  follower uuid not null references profiles on delete cascade,
  followee uuid not null references profiles on delete cascade,
  created_at timestamptz default now(),
  unique (follower, followee),
  check (follower <> followee));
create index if not exists follows_followee on follows (followee);
alter table follows enable row level security;
drop policy if exists r on follows; create policy r on follows for select using (auth.uid() is not null);
drop policy if exists i on follows; create policy i on follows for insert with check (follower = auth.uid());
drop policy if exists d on follows; create policy d on follows for delete using (follower = auth.uid());
grant select, insert, delete on follows to authenticated;

-- the public card of a person: what a profile page shows, never a phone number or an email
create or replace function ish_profile_card(p_user uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', p.id, 'name', p.name, 'photo', p.photo, 'university', p.university, 'year', p.year, 'city', p.city, 'bio', p.bio, 'spec', p.spec,
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

-- the person followed hears about it (never stops the follow)
create or replace function follow_notice() returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    insert into notices (user_id, title, body, link)
    values (new.followee, 'متابع جديد · New follower', coalesce((select name from profiles where id = new.follower), ''), '#person/' || new.follower);
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists follow_notice on follows;
create trigger follow_notice after insert on follows for each row execute function follow_notice();
