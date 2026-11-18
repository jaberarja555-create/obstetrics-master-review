-- اشرح لي: who is online and when someone was last active (owner, 18 Nov 2026: "there must be indicators like who is online and who is not,
-- or last activity time or date"). Safe to run again.
--  * every open app writes its account's last_seen about once a minute (ish_seen, own row only)
--  * students and visitors see the status of accepted lecturers and of the platform team only, and not of anyone who hid it (hide_seen);
--    the team sees everyone's (as it already could read profiles)
--  * the support page shows whether the team is online (one time, no names)
alter table profiles add column if not exists last_seen timestamptz;
alter table profiles add column if not exists hide_seen boolean default false;
create index if not exists profiles_last_seen on profiles (last_seen desc);

create or replace function ish_seen() returns void language sql security definer set search_path = public as $$
  update profiles set last_seen = now() where id = auth.uid() and (last_seen is null or last_seen < now() - interval '45 seconds') $$;
revoke all on function ish_seen() from public;
grant execute on function ish_seen() to authenticated;

create or replace function ish_presence(ids uuid[]) returns table (id uuid, seen timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.last_seen from profiles p
  where p.id = any(ids[1:300]) and p.last_seen is not null and coalesce(p.status, 'active') <> 'blocked' and (
    ish_staff() or p.id = auth.uid() or (
      not coalesce(p.hide_seen, false) and (
        exists (select 1 from lecturers l where l.id = p.id and l.status = 'active') or
        (coalesce(array_length(p.team, 1), 0) > 0 and coalesce(p.team_status, 'active') = 'active')))) $$;
revoke all on function ish_presence(uuid[]) from public;
grant execute on function ish_presence(uuid[]) to anon, authenticated;

create or replace function ish_team_seen() returns timestamptz language sql stable security definer set search_path = public as $$
  select max(p.last_seen) from profiles p
  where coalesce(array_length(p.team, 1), 0) > 0 and coalesce(p.team_status, 'active') = 'active' and coalesce(p.status, 'active') <> 'blocked' $$;
revoke all on function ish_team_seen() from public;
grant execute on function ish_team_seen() to anon, authenticated;
