begin;

alter table ishrah_private.study_groups
  add column if not exists photo_path text,
  add column if not exists admins_post_only boolean not null default false;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('study-group-photos','study-group-photos',false,2097152,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

-- Photos are immutable storage objects under <group>/<uploader>/<uuid>.
create or replace function public.ish_study_photo_access(p_path text,p_op text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from ishrah_private.study_groups g
    join ishrah_private.study_members m on m.group_id=g.id and m.user_id=auth.uid()
    join public.profiles p on p.id=m.user_id
    where g.id = case when p_path ~ '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}(/[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}){2}$'
      then split_part(p_path,'/',1)::uuid end
      and m.role<>'removed' and coalesce(p.status,'active')<>'blocked'
      and case p_op
        when 'read' then g.photo_path=p_path or m.role in ('owner','admin')
        when 'upload' then m.role in ('owner','admin') and split_part(p_path,'/',2)=m.user_id::text
        when 'delete' then m.role in ('owner','admin') and g.photo_path is distinct from p_path
        else false end
  )
$$;

revoke all on function public.ish_study_photo_access(text,text) from public,anon;
grant execute on function public.ish_study_photo_access(text,text) to authenticated;
drop policy if exists study_photo_read on storage.objects;
create policy study_photo_read on storage.objects for select to authenticated
  using (bucket_id='study-group-photos' and public.ish_study_photo_access(name,'read'));
drop policy if exists study_photo_upload on storage.objects;
create policy study_photo_upload on storage.objects for insert to authenticated
  with check (bucket_id='study-group-photos' and public.ish_study_photo_access(name,'upload'));
drop policy if exists study_photo_delete on storage.objects;
create policy study_photo_delete on storage.objects for delete to authenticated
  using (bucket_id='study-group-photos' and public.ish_study_photo_access(name,'delete'));

-- Extend the public private-space wrappers from 059; leave the original chat implementation in place.
create or replace function public.ish_study_read(p_op text,p_group uuid default null,p_data jsonb default '{}')
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  term text := lower(left(btrim(coalesce(p_data->>'query','')),80));
  result jsonb;
begin
  if actor is null or not exists(select 1 from public.profiles p where p.id=actor and coalesce(p.status,'active')<>'blocked') then
    raise exception 'study_sign_in';
  end if;
  if p_op='reports' and p_group is null then raise exception 'study_forbidden'; end if;

  if p_op='list' then
    select coalesce(jsonb_agg(to_jsonb(item) order by item.active_at desc),'[]') into result from (
      select g.id,g.title,g.description,g.visibility,g.spec,g.section,g.active_at,g.admin_only,g.photo_path,
        true as joined,
        (select count(*) from ishrah_private.study_members n where n.group_id=g.id and n.role<>'removed') as members,
        exists(select 1 from ishrah_private.study_messages x
          where x.group_id=g.id and x.id>m.seen and x.sender is distinct from actor and not x.removed) as unread
      from ishrah_private.study_members m join ishrah_private.study_groups g on g.id=m.group_id
      where m.user_id=actor and m.role<>'removed' order by g.active_at desc limit 100
    ) item;
    return result;
  elsif p_op='inbox' then
    select coalesce(jsonb_agg(to_jsonb(item) order by item.created_at desc),'[]') into result from (
      select i.token,i.created_at,g.title,g.admin_only
      from ishrah_private.study_direct_invites i
      join ishrah_private.study_groups g on g.id=i.group_id
      join ishrah_private.study_members sender on sender.group_id=i.group_id and sender.user_id=i.sender
      where i.recipient=actor and i.accepted_at is null and sender.role in ('owner','admin')
        and not exists(select 1 from ishrah_private.study_members m where m.group_id=g.id and m.user_id=actor)
      order by i.created_at desc limit 50
    ) item;
    return result;
  elsif p_op='people' then
    if not exists(select 1 from ishrah_private.study_members where group_id=p_group and user_id=actor and role in ('owner','admin')) then
      raise exception 'study_forbidden';
    end if;
    if char_length(term)<3 then return '[]'::jsonb; end if;
    -- Reveal only the display name and account identifier. No email, telephone or contact fields.
    select coalesce(jsonb_agg(to_jsonb(item)),'[]') into result from (
      select p.id,left(p.name,120) as name
      from public.profiles p
      where coalesce(p.status,'active')='active' and p.id<>actor
        and (strpos(lower(p.name),term)>0 or p.id::text=term)
        and not exists(select 1 from ishrah_private.study_members m where m.group_id=p_group and m.user_id=p.id)
      order by (lower(p.name)=term) desc,p.name,p.id limit 15
    ) item;
    return result;
  elsif p_op='members' then
    result:=ishrah_private.ish_study_read('group',p_group,p_data);
    if (result->>'admin_only')::boolean and result->>'role'='member' then return '[]'::jsonb; end if;
    return ishrah_private.ish_study_read(p_op,p_group,p_data);
  elsif p_op in ('group','messages','version') then
    result:=ishrah_private.ish_study_read(p_op,p_group,p_data);
    return result || (
      select jsonb_build_object('title',g.title,'photo_path',g.photo_path,'admins_post_only',g.admins_post_only,
        'member_count',(select count(*) from ishrah_private.study_members where group_id=p_group and role<>'removed'))
      from ishrah_private.study_groups g where g.id=p_group
    );
  end if;
  return ishrah_private.ish_study_read(p_op,p_group,p_data);
end;
$$;

create or replace function public.ish_study_action(p_op text,p_group uuid default null,p_data jsonb default '{}')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  room uuid := p_group;
  target uuid;
  mine text;
  invite_id uuid;
  invitation ishrah_private.study_direct_invites%rowtype;
  result jsonb;
  mode text := p_data->>'mode';
  room_settings ishrah_private.study_groups%rowtype;
  new_photo text;
begin
  if actor is null or not exists(select 1 from public.profiles p where p.id=actor and coalesce(p.status,'active')<>'blocked') then
    raise exception 'study_sign_in';
  end if;
  if p_op in ('dismiss-report','remove-reported') and room is null then raise exception 'study_forbidden'; end if;
  if p_op in ('settings','photo','send') then
    select * into room_settings from ishrah_private.study_groups where id=room for update;
    if room_settings.id is null then raise exception 'study_unavailable'; end if;
    select role into mine from ishrah_private.study_members where group_id=room and user_id=actor;
    if mine is null or mine='removed' then raise exception 'study_unavailable'; end if;
    if p_op='send' and room_settings.admins_post_only and mine='member' then raise exception 'study_read_only'; end if;
    if p_op in ('settings','photo') and mine not in ('owner','admin') then raise exception 'study_forbidden'; end if;
  end if;

  if p_op='photo' then
    new_photo:=p_data->>'path';
    if new_photo is not null and (
      split_part(new_photo,'/',1)<>room::text or not public.ish_study_photo_access(new_photo,'upload') or
      not exists (select 1 from storage.objects o where o.bucket_id='study-group-photos' and o.name=new_photo
        and o.metadata->>'mimetype' in ('image/jpeg','image/png','image/webp'))
    ) then raise exception 'study_invalid_photo'; end if;
    update ishrah_private.study_groups set photo_path=new_photo,revision=revision+1 where id=room;
    return jsonb_build_object('id',room,'photo_path',new_photo,'previous_photo',room_settings.photo_path);
  end if;

  if p_op in ('create','settings') then
    if mode is not null and mode not in ('group','channel') then raise exception 'study_invalid_mode'; end if;
    p_data:=coalesce(p_data,'{}') || jsonb_build_object('visibility','private','admin_only',
      case when mode is not null then mode='channel' else coalesce((p_data->>'admin_only')::boolean,false) end);
  elsif p_op='invite' then
    invite_id:=(p_data->>'token')::uuid;
    select group_id into room from ishrah_private.study_direct_invites where token=invite_id;
    if room is null then return ishrah_private.ish_study_action(p_op,p_group,p_data); end if;
    -- Lock the room first, as in member management, so direct addition and acceptance cannot race.
    perform 1 from ishrah_private.study_groups where id=room for update;
    select * into invitation from ishrah_private.study_direct_invites where token=invite_id for update;
    if invitation.token is null or invitation.recipient<>actor or not exists (
      select 1 from ishrah_private.study_members where group_id=room and user_id=invitation.sender and role in ('owner','admin')
    ) then raise exception 'study_unavailable'; end if;
    select role into mine from ishrah_private.study_members where group_id=room and user_id=actor;
    if mine='removed' or (invitation.accepted_at is not null and mine is null) then raise exception 'study_unavailable'; end if;
    insert into ishrah_private.study_members(group_id,user_id) values(room,actor) on conflict do nothing;
    update ishrah_private.study_direct_invites set accepted_at=coalesce(accepted_at,now()) where token=invite_id;
    return jsonb_build_object('id',room);
  elsif p_op in ('add-member','send-invite') or (p_op='role' and p_data->>'role'='admin') then
    perform 1 from ishrah_private.study_groups where id=room for update;
    select role into mine from ishrah_private.study_members where group_id=room and user_id=actor;
    if coalesce(mine,'') not in ('owner','admin') then raise exception 'study_forbidden'; end if;
    target:=(p_data->>'user')::uuid;
    if not exists(select 1 from public.profiles p where p.id=target and coalesce(p.status,'active')='active') then
      raise exception 'study_unavailable';
    end if;
    if p_op='role' then
      update ishrah_private.study_members set role='admin' where group_id=room and user_id=target and role='member';
      if not found then raise exception 'study_forbidden'; end if;
      update ishrah_private.study_groups set revision=revision+1 where id=room;
    else
      if exists(select 1 from ishrah_private.study_members where group_id=room and user_id=target) then
        raise exception 'study_already_member';
      end if;
      if p_op='add-member' then
        insert into ishrah_private.study_members(group_id,user_id) values(room,target);
        update ishrah_private.study_direct_invites set accepted_at=now() where group_id=room and recipient=target and accepted_at is null;
      else
        select i.token into invite_id from ishrah_private.study_direct_invites i
          join ishrah_private.study_members sender on sender.group_id=i.group_id and sender.user_id=i.sender
          where i.group_id=room and i.recipient=target and i.accepted_at is null and i.created_at>now()-interval '24 hours'
            and sender.role in ('owner','admin');
        if invite_id is not null then return jsonb_build_object('already_sent',true); end if;
        insert into ishrah_private.study_direct_invites(group_id,recipient,sender) values(room,target,actor)
          on conflict(group_id,recipient) do update set token=gen_random_uuid(),sender=excluded.sender,created_at=now(),accepted_at=null
          returning token into invite_id;
      end if;
      insert into public.notices(user_id,actor,kind,title,title_en,body,link) values(target,actor,'study-invite',
        case when p_op='add-member' then 'أُضفت إلى مساحة خاصة' else 'دعوة إلى مساحة خاصة' end,
        case when p_op='add-member' then 'Added to a private space' else 'Private space invitation' end,
        '',case when p_op='add-member' then '#study-group/' || room else '#study-invite/' || invite_id end);
    end if;
    return '{}'::jsonb;
  end if;

  result:=ishrah_private.ish_study_action(p_op,p_group,p_data);
  if p_op='settings' and p_data ? 'admins_post_only' then
    update ishrah_private.study_groups set admins_post_only=coalesce((p_data->>'admins_post_only')::boolean,false)
      where id=room;
  end if;
  return result;
end;
$$;
revoke all on function public.ish_study_read(text,uuid,jsonb),public.ish_study_action(text,uuid,jsonb) from public,anon;
grant execute on function public.ish_study_read(text,uuid,jsonb),public.ish_study_action(text,uuid,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
