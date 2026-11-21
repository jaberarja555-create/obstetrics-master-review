-- SMRA · 053: the platform owner receives every team alert, also for what he did himself (owner, 21 Nov 2026: «كمالك للمنصه مفروض يصلني
-- كل شي»; he sent a course for review as a lecturer and, as the one who acted, was left out). Other staff are still not alerted about
-- their own actions. Safe to run again.
begin;

create or replace function ishrah_private.is_owner_id(u uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles m where m.id = u and 'owner' = any (m.team))
$$;
revoke all on function ishrah_private.is_owner_id(uuid) from public, anon, authenticated;

create or replace function ishrah_private.alert_team(p text, t_ar text, t_en text, b text, l text, who uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.notices (user_id, title, title_en, body, link, actor, kind)
  select s, t_ar, t_en, coalesce(b, ''), l, who, 'team' from ishrah_private.staff_for(p) s
  where s is distinct from who or ishrah_private.is_owner_id(s)
$$;
revoke all on function ishrah_private.alert_team(text,text,text,text,text,uuid) from public, anon, authenticated;

create or replace function ishrah_private.alert_ticket(t uuid, t_ar text, t_en text, b text, who uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.notices (user_id, title, title_en, body, link, actor, kind)
  select s, t_ar, t_en, coalesce(b, ''), '#ticket/' || t, who, 'team' from ishrah_private.staff_for_ticket(t) s
  where s is distinct from who or ishrah_private.is_owner_id(s)
$$;
revoke all on function ishrah_private.alert_ticket(uuid,text,text,text,uuid) from public, anon, authenticated;

notify pgrst, 'reload schema';
commit;
