begin;

-- Enrich only the ordered member list already visible to the caller.
create or replace function public.ish_study_members(p_group uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(
    member.item || jsonb_build_object('photo',nullif(profile.photo,''))
    order by member.position
  ),'[]'::jsonb)
  from jsonb_array_elements(public.ish_study_read('members',p_group)) with ordinality as member(item,position)
  left join public.profiles profile on profile.id=(member.item->>'id')::uuid
    and member.item->>'role'<>'removed'
$$;

revoke all on function public.ish_study_members(uuid) from public,anon;
grant execute on function public.ish_study_members(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
