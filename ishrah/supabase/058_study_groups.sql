begin;
create schema if not exists ishrah_private;

create table if not exists ishrah_private.study_groups (
  id uuid primary key default gen_random_uuid(),
  spec text not null references public.specialties,
  section text not null references public.categories,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  description text not null default '' check (char_length(description) <= 500),
  visibility text not null check (visibility in ('open','private')),
  admin_only boolean not null default false,
  invite uuid not null unique default gen_random_uuid(),
  pinned bigint,
  revision bigint not null default 0,
  created_at timestamptz not null default now(),
  active_at timestamptz not null default now()
);
create index if not exists study_groups_scope on ishrah_private.study_groups (spec,section,active_at desc);
create table if not exists ishrah_private.study_members (
  group_id uuid not null references ishrah_private.study_groups on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member','removed')),
  seen bigint not null default 0,
  joined_at timestamptz not null default now(),
  primary key(group_id,user_id)
);
create unique index if not exists study_one_owner on ishrah_private.study_members (group_id) where role='owner';
create index if not exists study_my_membership on ishrah_private.study_members (user_id,group_id);
create table if not exists ishrah_private.study_messages (
  id bigint generated always as identity primary key,
  group_id uuid not null references ishrah_private.study_groups on delete cascade,
  sender uuid references public.profiles on delete set null,
  nonce uuid not null,
  body text not null check (char_length(body) <= 4000),
  reply_to bigint references ishrah_private.study_messages on delete set null,
  attachment text,
  attachment_type text,
  attachment_name text,
  options text[],
  sent_at timestamptz not null default now(),
  edited_at timestamptz,
  removed boolean not null default false,
  unique(group_id,sender,nonce)
);
create index if not exists study_messages_recent on ishrah_private.study_messages (group_id,id desc);
create table if not exists ishrah_private.study_reactions (
  message_id bigint not null references ishrah_private.study_messages on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  emoji text not null check (emoji in ('👍','❤️','😂','🎉','🙏','👀')),
  primary key(message_id,user_id)
);
create table if not exists ishrah_private.study_votes (
  message_id bigint not null references ishrah_private.study_messages on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  choice int not null check (choice between 1 and 6),
  primary key(message_id,user_id)
);
create table if not exists ishrah_private.study_reports (
  id uuid primary key default gen_random_uuid(),
  message_id bigint not null references ishrah_private.study_messages on delete cascade,
  user_id uuid references public.profiles on delete set null,
  reason text not null check (char_length(reason) between 1 and 500),
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  unique(message_id,user_id)
);
alter table ishrah_private.study_groups enable row level security;
alter table ishrah_private.study_members enable row level security;
alter table ishrah_private.study_messages enable row level security;
alter table ishrah_private.study_reactions enable row level security;
alter table ishrah_private.study_votes enable row level security;
alter table ishrah_private.study_reports enable row level security;
revoke all on ishrah_private.study_groups, ishrah_private.study_members, ishrah_private.study_messages,
  ishrah_private.study_reactions, ishrah_private.study_votes, ishrah_private.study_reports from public, anon, authenticated;

-- Storage paths are <group>/<sender>/<file UUID>. Keep group media outside the public media bucket.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('study-group-files','study-group-files',false,12582912,
  array['image/jpeg','image/png','image/webp','application/pdf','audio/webm','audio/ogg','audio/mp4','audio/mpeg'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create or replace function public.ish_study_media(p_path text, p_upload boolean)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from ishrah_private.study_groups g
      join ishrah_private.study_members m on m.group_id=g.id
      join public.profiles p on p.id=m.user_id
      where g.id::text=split_part(p_path,'/',1) and m.user_id=auth.uid()
        and coalesce(p.status,'active') <> 'blocked' and m.role <> 'removed'
        and (case when p_upload then
          split_part(p_path,'/',2)=m.user_id::text and p_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}$' and
          (not g.admin_only or m.role in ('admin','owner'))
        else exists (select 1 from ishrah_private.study_messages msg where msg.group_id=g.id and msg.attachment=p_path and not msg.removed)
        end)
  );
$$;
revoke all on function public.ish_study_media(text,boolean) from public, anon;
grant execute on function public.ish_study_media(text,boolean) to authenticated;
drop policy if exists study_group_upload on storage.objects;
create policy study_group_upload on storage.objects for insert to authenticated
  with check (bucket_id='study-group-files' and public.ish_study_media(name,true));
drop policy if exists study_group_media_read on storage.objects;
create policy study_group_media_read on storage.objects for select to authenticated
  using (bucket_id='study-group-files' and public.ish_study_media(name,false));

create or replace function public.ish_study_read(p_op text, p_group uuid default null, p_data jsonb default '{}')
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  g ishrah_private.study_groups%rowtype;
  member ishrah_private.study_members%rowtype;
  result jsonb;
  before_id bigint := nullif(p_data->>'before','')::bigint;
  term text := left(btrim(coalesce(p_data->>'search','')),120);
begin
  if actor is null or not exists(select 1 from public.profiles p where p.id=actor and coalesce(p.status,'active')<>'blocked') then
    raise exception 'study_sign_in';
  end if;
  if p_op='list' then
    select coalesce(jsonb_agg(to_jsonb(row) order by row.joined desc,row.active_at desc),'[]') into result from (
      select sg.id,sg.title,sg.description,sg.visibility,sg.spec,sg.section,sg.active_at,
        coalesce(m.role<>'removed',false) as joined,
        (select count(*) from ishrah_private.study_members n where n.group_id=sg.id and n.role<>'removed') as members,
        case when m.role<>'removed' then exists(select 1 from ishrah_private.study_messages x
          where x.group_id=sg.id and x.id>m.seen and x.sender is distinct from actor and not x.removed) else false end as unread
      from ishrah_private.study_groups sg left join ishrah_private.study_members m on m.group_id=sg.id and m.user_id=actor
      where coalesce(m.role,'')<>'removed' and (m.user_id is not null or
        (sg.visibility='open' and sg.spec=p_data->>'spec' and sg.section=p_data->>'section'))
      order by (m.user_id is not null) desc,sg.active_at desc limit 100
    ) row;
    return result;
  end if;

  if p_op='reports' and p_group is null then
    if not public.ish_can('community') then raise exception 'study_forbidden'; end if;
  else
    select * into g from ishrah_private.study_groups where id=p_group;
    select * into member from ishrah_private.study_members where group_id=p_group and user_id=actor;
    if g.id is null or member.role='removed' or (member.role is null and g.visibility='private') then
      raise exception 'study_unavailable';
    end if;
    if p_op='group' then
      return jsonb_build_object('id',g.id,'title',g.title,'description',g.description,'visibility',g.visibility,
        'spec',g.spec,'section',g.section,'role',member.role,'admin_only',g.admin_only,'pinned',g.pinned,
        'invite',case when member.role in ('owner','admin') then g.invite end);
    end if;
    if member.role is null then raise exception 'study_join_first'; end if;
  end if;

  if p_op='reports' then
    if p_group is not null and member.role not in ('owner','admin') then raise exception 'study_forbidden'; end if;
    select coalesce(jsonb_agg(to_jsonb(row) order by row.created_at desc),'[]') into result from (
      select r.id,r.reason,r.created_at,sg.title,m.group_id,m.id as message_id,left(m.body,4000) as body,m.removed
        from ishrah_private.study_reports r join ishrah_private.study_messages m on m.id=r.message_id
        join ishrah_private.study_groups sg on sg.id=m.group_id
        where not r.resolved and (p_group is null or m.group_id=p_group) order by r.created_at desc limit 100
    ) row;
    return result;
  elsif p_op='members' then
    select coalesce(jsonb_agg(to_jsonb(row)),'[]') into result from (
      select p.id,p.name,m.role
      from ishrah_private.study_members m join public.profiles p on p.id=m.user_id
      where m.group_id=p_group and (m.role<>'removed' or member.role in ('owner','admin'))
      order by case m.role when 'owner' then 0 when 'admin' then 1 when 'member' then 2 else 3 end,p.name limit 300
    ) row;
    return result;
  elsif p_op='version' then
    return jsonb_build_object('revision',g.revision,'role',member.role,'admin_only',g.admin_only);
  elsif p_op='messages' then
    select jsonb_build_object('revision',g.revision,'pinned',g.pinned,'role',member.role,'admin_only',g.admin_only,
      'pin_text',(select coalesce(nullif(left(p.body,140),''),p.attachment_name) from ishrah_private.study_messages p where p.id=g.pinned and not p.removed),
      'messages',coalesce(jsonb_agg(to_jsonb(row) order by row.id),'[]')) into result from (
      select m.id,m.sender,coalesce(p.name,'') as name,m.body,m.removed,m.sent_at,m.edited_at,m.reply_to,
        case when r.removed then null else left(r.body,180) end as reply_excerpt,
        m.attachment,m.attachment_type,m.attachment_name,m.options,
        coalesce((select jsonb_agg(to_jsonb(e)) from (
          select x.emoji,count(*) as n,bool_or(x.user_id=actor) as mine from ishrah_private.study_reactions x
          where x.message_id=m.id group by x.emoji order by x.emoji) e),'[]') as reactions,
        case when m.options is not null then (select jsonb_agg((select count(*) from ishrah_private.study_votes v
          where v.message_id=m.id and v.choice=i) order by i) from generate_subscripts(m.options,1) i) end as votes,
        (select v.choice from ishrah_private.study_votes v where v.message_id=m.id and v.user_id=actor) as my_vote
      from (select msg.* from ishrah_private.study_messages msg where msg.group_id=p_group
        and (before_id is null or msg.id<before_id)
        and (term='' or (not msg.removed and (strpos(lower(msg.body),lower(term))>0 or strpos(lower(coalesce(msg.attachment_name,'')),lower(term))>0)))
        order by msg.id desc limit 40) m
      left join public.profiles p on p.id=m.sender
      left join ishrah_private.study_messages r on r.id=m.reply_to and r.group_id=p_group
    ) row;
    return result;
  end if;
  raise exception 'study_unknown_action';
end;
$$;

create or replace function public.ish_study_action(p_op text, p_group uuid default null, p_data jsonb default '{}')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  g ishrah_private.study_groups%rowtype;
  msg ishrah_private.study_messages%rowtype;
  mine text;
  peer text;
  is_admin boolean;
  target uuid;
  options text[];
  message_body text := btrim(coalesce(p_data->>'body',''));
  file_path text := nullif(p_data->>'attachment','');
  file_type text;
  sent_id bigint;
  reply bigint;
  report_id uuid;
  value text;
begin
  if actor is null or not exists(select 1 from public.profiles p where p.id=actor and coalesce(p.status,'active')<>'blocked') then
    raise exception 'study_sign_in';
  end if;

  -- Apply the academy's contact-detail rule without sending private conversation text to an audit feed.
  if p_op in ('create','settings','send','edit') and not public.ish_staff() and exists (
    select 1 from unnest(array[message_body,p_data->>'title',p_data->>'description',p_data->>'filename',p_data->>'options']) item
    where item is not null and ishrah_private.contact_mask(item) is distinct from item
  ) then raise exception 'study_contact'; end if;
  if p_op='create' then
    insert into ishrah_private.study_groups (spec,section,title,description,visibility,admin_only)
    values (p_data->>'spec',p_data->>'section',btrim(p_data->>'title'),btrim(coalesce(p_data->>'description','')),
      coalesce(p_data->>'visibility','private'),coalesce((p_data->>'admin_only')::boolean,false)) returning * into g;
    insert into ishrah_private.study_members (group_id,user_id,role) values(g.id,actor,'owner');
    return jsonb_build_object('id',g.id);
  end if;
  if p_op in ('dismiss-report','remove-reported') then
    report_id := (p_data->>'report')::uuid;
    if p_group is null and not public.ish_do('community','edit') then
      raise exception 'study_forbidden';
    end if;
  end if;

  if p_op='invite' then
    select * into g from ishrah_private.study_groups where invite=(p_data->>'token')::uuid for update;
  elsif p_group is not null then
    select * into g from ishrah_private.study_groups where id=p_group for update;
  elsif report_id is not null then
    select sg.* into g from ishrah_private.study_reports r
      join ishrah_private.study_messages m on m.id=r.message_id
      join ishrah_private.study_groups sg on sg.id=m.group_id where r.id=report_id and not r.resolved for update of sg;
  end if;
  if g.id is null then raise exception 'study_unavailable'; end if;
  select role into mine from ishrah_private.study_members where group_id=g.id and user_id=actor;
  is_admin := coalesce(mine in ('owner','admin'),false);

  if p_op in ('join','invite') then
    if mine='removed' or (g.visibility='private' and p_op='join' and mine is null) then raise exception 'study_unavailable'; end if;
    insert into ishrah_private.study_members (group_id,user_id) values(g.id,actor) on conflict do nothing;
    return jsonb_build_object('id',g.id);
  elsif report_id is not null then
    if p_group is not null and not is_admin then raise exception 'study_forbidden'; end if;
    select m.* into msg from ishrah_private.study_reports r join ishrah_private.study_messages m on m.id=r.message_id
      where r.id=report_id and not r.resolved and m.group_id=g.id;
    if msg.id is null then raise exception 'study_unavailable'; end if;
    if p_op='dismiss-report' then update ishrah_private.study_reports set resolved=true where id=report_id;
    else
      update ishrah_private.study_messages set removed=true,body='',options=null,attachment=null,attachment_type=null,attachment_name=null where id=msg.id;
      update ishrah_private.study_groups set pinned=case when pinned=msg.id then null else pinned end,revision=revision+1 where id=g.id;
      delete from ishrah_private.study_reactions where message_id=msg.id;
      delete from ishrah_private.study_votes where message_id=msg.id;
      update ishrah_private.study_reports set resolved=true where message_id=msg.id;
    end if;
    return '{}'::jsonb;
  end if;

  if mine is null or mine='removed' then raise exception 'study_join_first'; end if;
  if p_op='seen' then
    update ishrah_private.study_members set seen=greatest(seen,coalesce((select max(id) from ishrah_private.study_messages
      where group_id=g.id and id<=(p_data->>'id')::bigint),0)) where group_id=g.id and user_id=actor;
  elsif p_op='leave' then
    if mine='owner' then raise exception 'study_transfer_first'; end if;
    delete from ishrah_private.study_members where group_id=g.id and user_id=actor;
  elsif p_op in ('settings','rotate','role','transfer') then
    if not is_admin then raise exception 'study_forbidden'; end if;
    if p_op='settings' then
      update ishrah_private.study_groups set title=btrim(p_data->>'title'),description=btrim(coalesce(p_data->>'description','')),
        visibility=p_data->>'visibility',admin_only=coalesce((p_data->>'admin_only')::boolean,false) where id=g.id;
    elsif p_op='rotate' then
      update ishrah_private.study_groups set invite=gen_random_uuid() where id=g.id;
    else
      target := (p_data->>'user')::uuid;
      select role into peer from ishrah_private.study_members where group_id=g.id and user_id=target;
      value := p_data->>'role';
      if peer is null or target=actor or peer='owner' or
        (mine<>'owner' and (peer='admin' or p_op='transfer' or value not in ('member','removed'))) then
        raise exception 'study_forbidden';
      end if;
      if p_op='transfer' then
        if peer='removed' then raise exception 'study_forbidden'; end if;
        update ishrah_private.study_members set role='admin' where group_id=g.id and user_id=actor;
        update ishrah_private.study_members set role='owner' where group_id=g.id and user_id=target;
      else
        if value not in ('member','admin','removed') then raise exception 'study_forbidden'; end if;
        update ishrah_private.study_members set role=value where group_id=g.id and user_id=target;
      end if;
    end if;
  elsif p_op='send' then
    if g.admin_only and not is_admin then raise exception 'study_read_only'; end if;
    select id into sent_id from ishrah_private.study_messages
      where group_id=g.id and sender=actor and nonce=(p_data->>'nonce')::uuid;
    if sent_id is not null then return jsonb_build_object('id',sent_id); end if;
    if p_data ? 'options' then
      select array_agg(btrim(s.val) order by s.n) into options
        from jsonb_array_elements_text(p_data->'options') with ordinality s(val,n);
      if coalesce(cardinality(options),0) not between 2 and 6 or message_body='' or file_path is not null
        or exists(select 1 from unnest(options) item where char_length(item) not between 1 and 100)
        or cardinality(options)<>(select count(distinct lower(item)) from unnest(options) item) then
        raise exception 'study_invalid_poll';
      end if;
    end if;
    if file_path is not null then
      if not public.ish_study_media(file_path,true) then raise exception 'study_forbidden'; end if;
      select o.metadata->>'mimetype' into file_type from storage.objects o where o.bucket_id='study-group-files' and o.name=file_path;
      if file_type is null or file_type not in ('image/jpeg','image/png','image/webp','application/pdf','audio/webm','audio/ogg','audio/mp4','audio/mpeg') then
        raise exception 'study_invalid_attachment';
      end if;
    end if;
    if message_body='' and file_path is null then raise exception 'study_empty'; end if;
    reply := nullif(p_data->>'reply','')::bigint;
    if reply is not null and not exists(select 1 from ishrah_private.study_messages where id=reply and group_id=g.id and not removed) then
      raise exception 'study_unavailable';
    end if;
    insert into ishrah_private.study_messages (group_id,sender,nonce,body,reply_to,attachment,attachment_type,attachment_name,options)
      values(g.id,actor,(p_data->>'nonce')::uuid,message_body,reply,file_path,file_type,
        case when file_path is not null then left(coalesce(p_data->>'filename','Attachment'),160) end,options) returning id into sent_id;
    update ishrah_private.study_groups set active_at=now(),revision=revision+1 where id=g.id;
    return jsonb_build_object('id',sent_id);
  else
    select * into msg from ishrah_private.study_messages where id=(p_data->>'id')::bigint and group_id=g.id and not removed;
    if msg.id is null then raise exception 'study_unavailable'; end if;
    case p_op
      when 'edit' then
        if msg.sender is distinct from actor or msg.options is not null or (g.admin_only and not is_admin) or
          (message_body='' and msg.attachment is null) then raise exception 'study_forbidden'; end if;
        update ishrah_private.study_messages set body=message_body,edited_at=now() where id=msg.id;
      when 'delete' then
        if msg.sender is distinct from actor and not is_admin then raise exception 'study_forbidden'; end if;
        update ishrah_private.study_messages set removed=true,body='',options=null,attachment=null,attachment_type=null,attachment_name=null where id=msg.id;
        update ishrah_private.study_groups set pinned=null where id=g.id and pinned=msg.id;
        delete from ishrah_private.study_reactions where message_id=msg.id;
        delete from ishrah_private.study_votes where message_id=msg.id;
      when 'pin' then
        if not is_admin then raise exception 'study_forbidden'; end if;
        update ishrah_private.study_groups set pinned=case when pinned=msg.id then null else msg.id end where id=g.id;
      when 'react' then
        value := p_data->>'emoji';
        delete from ishrah_private.study_reactions where message_id=msg.id and user_id=actor and emoji=value;
        if not found then insert into ishrah_private.study_reactions values(msg.id,actor,value)
          on conflict(message_id,user_id) do update set emoji=excluded.emoji; end if;
      when 'vote' then
        if msg.options is null or coalesce((p_data->>'choice')::int,0) not between 1 and cardinality(msg.options) then
          raise exception 'study_invalid_poll';
        end if;
        insert into ishrah_private.study_votes values(msg.id,actor,(p_data->>'choice')::int)
          on conflict(message_id,user_id) do update set choice=excluded.choice;
      when 'report' then
        insert into ishrah_private.study_reports (message_id,user_id,reason) values(msg.id,actor,btrim(p_data->>'reason'))
          on conflict(message_id,user_id) do update set reason=excluded.reason,resolved=false,created_at=now();
      else raise exception 'study_unknown_action';
    end case;
  end if;
  if p_op in ('edit','delete','vote','react','pin','settings','role','transfer') then
    update ishrah_private.study_groups set revision=revision+1 where id=g.id;
  end if;
  return '{}'::jsonb;
end;
$$;
notify pgrst, 'reload schema';
revoke all on function public.ish_study_read(text,uuid,jsonb), public.ish_study_action(text,uuid,jsonb) from public, anon;
grant execute on function public.ish_study_read(text,uuid,jsonb), public.ish_study_action(text,uuid,jsonb) to authenticated;
commit;
