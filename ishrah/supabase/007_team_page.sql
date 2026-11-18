-- اشرح لي: public "Our team" page (owner, 18 Nov 2026: "a nice place for the admins and other staff, with their photos, so people know them
-- and can reach them"). Each staff member can be shown or hidden; only the public card fields are ever given to students or visitors
-- (no phone, no email). Messages go through the platform's own tickets to the person's department. Safe to run again.
alter table profiles add column if not exists pub_show boolean default false;
alter table profiles add column if not exists pub_title text default '';
alter table profiles add column if not exists pub_bio text default '';
alter table profiles add column if not exists pub_order int default 100;

create or replace function ish_team_public() returns table (id uuid, name text, photo text, team text[], dept text, pub_title text, pub_bio text, pub_order int)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, p.photo, array(select r from unnest(p.team) r where r not like 'p:%'), coalesce(p.dept, ''), coalesce(p.pub_title, ''),
         left(coalesce(p.pub_bio, ''), 600), coalesce(p.pub_order, 100)
  from profiles p
  where coalesce(array_length(p.team, 1), 0) > 0 and p.pub_show and coalesce(p.team_status, 'active') = 'active' and coalesce(p.status, 'active') <> 'blocked'
  order by coalesce(p.pub_order, 100), p.name $$;
revoke all on function ish_team_public() from public;
grant execute on function ish_team_public() to anon, authenticated;
