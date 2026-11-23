begin;

create or replace function public.ish_study_avatars(p_group uuid,p_users uuid[])
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(p.id,p.photo),'{}'::jsonb)
  from public.profiles p
  where p.id in (select unnest(p_users[1:60])) and nullif(p.photo,'') is not null
    and exists (
      select 1 from ishrah_private.study_members m
        join public.profiles viewer on viewer.id=m.user_id
        join ishrah_private.study_groups g on g.id=m.group_id
      where m.group_id=p_group and m.user_id=auth.uid() and m.role<>'removed'
        and not g.admin_only and coalesce(viewer.status,'active')<>'blocked'
    )
    and exists (select 1 from ishrah_private.study_messages msg where msg.group_id=p_group and msg.sender=p.id and not msg.removed)
$$;
revoke all on function public.ish_study_avatars(uuid,uuid[]) from public,anon;
grant execute on function public.ish_study_avatars(uuid,uuid[]) to authenticated;
notify pgrst,'reload schema';
commit;
