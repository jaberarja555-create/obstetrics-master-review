-- SMRA · 054: phone alerts of new posts reach the team from every speciality and section (owner, 21 Nov 2026: «نعم أنا والفريق»: the owner
-- and the team get the publication notices of all spaces; students keep only their own speciality and section). A team phone
-- (push_subs.team) gets every space notice; the platform owner's phones also get notices of his own actions. Safe to run again.
-- (22 Nov 2026: it was named in the workflow but missing from its list of files to apply; now applied before 056.)
begin;
create or replace function public.ish_push_targets(p_notice uuid, p_secret text) returns table (endpoint text)
language plpgsql security definer set search_path = '' as $$
declare n public.notices;
begin
  if p_secret is distinct from (select v from public.push_cfg where k = 'secret') then raise exception 'request_permission' using errcode = '42501'; end if;
  select * into n from public.notices where id = p_notice; if n.id is null then return; end if;
  return query
  update public.push_subs s set last_title = coalesce(nullif(n.title, ''), 'SMRA'), last_body = coalesce(n.body, ''), last_link = coalesce(nullif(n.link, ''), '#notifications'), last_at = now()
  where (n.user_id is not null and s.user_id = n.user_id)
     or (n.user_id is null
         and (s.user_id is distinct from n.actor or exists (select 1 from public.profiles m where m.id = s.user_id and 'owner' = any (m.team)))
         and (s.team or ((n.spec is null or s.spec = n.spec) and (n.cat is null or s.cat = n.cat))))
  returning s.endpoint;
end $$;
revoke all on function public.ish_push_targets(uuid,text) from public, anon, authenticated;
notify pgrst, 'reload schema';
commit;
