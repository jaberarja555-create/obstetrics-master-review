begin;

-- Keep existing conversations and membership. Previous open groups become private.
update ishrah_private.study_groups set visibility='private',revision=revision+1 where visibility<>'private';
alter table ishrah_private.study_groups drop constraint if exists study_groups_private_only;
alter table ishrah_private.study_groups add constraint study_groups_private_only check (visibility='private');

create table if not exists ishrah_private.study_direct_invites (
  token uuid primary key default gen_random_uuid(),
  group_id uuid not null references ishrah_private.study_groups on delete cascade,
  recipient uuid not null references public.profiles on delete cascade,
  sender uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique(group_id,recipient)
);
create index if not exists study_direct_inbox on ishrah_private.study_direct_invites (recipient,created_at desc);
alter table ishrah_private.study_direct_invites enable row level security;
revoke all on ishrah_private.study_direct_invites from public,anon,authenticated;

-- The platform notification dashboard does not need access to private invitations.
drop policy if exists study_invite_notice_read on public.notices;
create policy study_invite_notice_read on public.notices as restrictive for select to anon,authenticated
  using (kind is distinct from 'study-invite' or user_id=auth.uid());
drop policy if exists study_invite_notice_delete on public.notices;
create policy study_invite_notice_delete on public.notices as restrictive for delete to anon,authenticated
  using (kind is distinct from 'study-invite' or user_id=auth.uid());
drop policy if exists study_invite_notice_update on public.notices;
create policy study_invite_notice_update on public.notices as restrictive for update to anon,authenticated
  using (kind is distinct from 'study-invite') with check (kind is distinct from 'study-invite');
drop policy if exists study_invite_notice_insert on public.notices;
create policy study_invite_notice_insert on public.notices as restrictive for insert to anon,authenticated
  with check (kind is distinct from 'study-invite');

-- Reuse the chat implementation behind a private entry point. Old clients still call the guarded public RPCs.
do $$
begin
  if to_regprocedure('ishrah_private.ish_study_read(text,uuid,jsonb)') is null then
    alter function public.ish_study_read(text,uuid,jsonb) set schema ishrah_private;
    alter function public.ish_study_action(text,uuid,jsonb) set schema ishrah_private;
  end if;
end;
$$;
revoke all on function ishrah_private.ish_study_read(text,uuid,jsonb),
  ishrah_private.ish_study_action(text,uuid,jsonb) from public,anon,authenticated,service_role;

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
      select g.id,g.title,g.description,g.visibility,g.spec,g.section,g.active_at,g.admin_only,
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
    return result || jsonb_build_object('member_count',(
      select count(*) from ishrah_private.study_members where group_id=p_group and role<>'removed'
    ));
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
begin
  if actor is null or not exists(select 1 from public.profiles p where p.id=actor and coalesce(p.status,'active')<>'blocked') then
    raise exception 'study_sign_in';
  end if;
  if p_op in ('dismiss-report','remove-reported') and room is null then raise exception 'study_forbidden'; end if;
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
  return result;
end;
$$;
revoke all on function public.ish_study_read(text,uuid,jsonb),public.ish_study_action(text,uuid,jsonb) from public,anon;
grant execute on function public.ish_study_read(text,uuid,jsonb),public.ish_study_action(text,uuid,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
