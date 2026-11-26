-- Google Meet sessions are private to a study space and its session-specific lecturer.
begin;

create table if not exists ishrah_private.study_lectures (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references ishrah_private.study_groups on delete cascade,
  organizer_id uuid references public.profiles on delete set null,
  lecturer_id uuid references public.profiles on delete set null,
  nonce uuid not null,
  title text not null check (char_length(btrim(title)) between 1 and 100),
  starts_at timestamptz not null,
  duration integer not null check (duration between 1 and 60),
  status text not null check (status in ('invited','scheduled','declined','cancelled')),
  meet_url text check (meet_url ~ '^https://meet[.]google[.]com/[a-z]{3}-[a-z]{4}-[a-z]{3}$'),
  scheduled_at timestamptz,
  unique (group_id,organizer_id,nonce),
  check ((status='scheduled')=(meet_url is not null))
);
create index if not exists study_lectures_by_group on ishrah_private.study_lectures(group_id,starts_at);
create index if not exists study_lectures_by_lecturer on ishrah_private.study_lectures(lecturer_id,starts_at);
alter table ishrah_private.study_lectures enable row level security;
revoke all on ishrah_private.study_lectures from public,anon,authenticated,service_role;

drop policy if exists study_lecture_notice_read on public.notices;
create policy study_lecture_notice_read on public.notices as restrictive for select to anon,authenticated
  using (kind is distinct from 'study-lecture' or user_id=auth.uid());
drop policy if exists study_lecture_notice_insert on public.notices;
create policy study_lecture_notice_insert on public.notices as restrictive for insert to anon,authenticated
  with check (kind is distinct from 'study-lecture');
drop policy if exists study_lecture_notice_update on public.notices;
create policy study_lecture_notice_update on public.notices as restrictive for update to anon,authenticated
  using (kind is distinct from 'study-lecture') with check (kind is distinct from 'study-lecture');
drop policy if exists study_lecture_notice_delete on public.notices;
create policy study_lecture_notice_delete on public.notices as restrictive for delete to anon,authenticated
  using (kind is distinct from 'study-lecture' or user_id=auth.uid());

create or replace function ishrah_private.study_lecture_card(
  item ishrah_private.study_lectures, role text, detail boolean
)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id',item.id,'title',item.title,'starts_at',item.starts_at,'duration',item.duration,
    'status',item.status,'role',role,'group_id',case when role is not null then item.group_id end,
    'lecturer', (select left(l.name,120) from public.lecturers l where l.id=item.lecturer_id),
    'is_lecturer',coalesce(item.lecturer_id=auth.uid(),false),
    'can_respond',coalesce(item.lecturer_id=auth.uid() and item.status='invited' and item.starts_at>now(),false),
    'started',item.starts_at<=now(),
    'ended', item.starts_at + make_interval(mins=>item.duration)<=now(),
    'meet_url',case when detail and item.status='scheduled' and item.starts_at + make_interval(mins=>item.duration)>now()
      then item.meet_url end
  )
$$;
revoke all on function ishrah_private.study_lecture_card(ishrah_private.study_lectures,text,boolean) from public,anon,authenticated,service_role;

create or replace function public.ish_study_lecture_read(p_op text,p_id uuid default null,p_query text default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  role text;
  item ishrah_private.study_lectures%rowtype;
  result jsonb;
  term text := lower(left(btrim(coalesce(p_query,'')),80));
begin
  if actor is null or not exists(select 1 from public.profiles p where p.id=actor and coalesce(p.status,'active')='active') then
    raise exception 'study_sign_in';
  end if;
  if p_op='inbox' then
    select coalesce(jsonb_agg(card order by starts_at),'[]') into result from (
      select ishrah_private.study_lecture_card(x,null,false) card,x.starts_at
      from ishrah_private.study_lectures x where x.lecturer_id=actor
        and ((x.status='invited' and x.starts_at>now()) or
          (x.status='scheduled' and x.starts_at + make_interval(mins=>x.duration)>now()))
      order by x.starts_at limit 50
    ) entries;
    return result;
  elsif p_op='get' then
    select * into item from ishrah_private.study_lectures where id=p_id;
    if not found then raise exception 'study_lecture_unavailable'; end if;
    select m.role into role from ishrah_private.study_members m where m.group_id=item.group_id and m.user_id=actor and m.role<>'removed';
    if item.lecturer_id is distinct from actor and (
        role is null or (role not in ('owner','admin') and item.scheduled_at is null)
    ) then raise exception 'study_lecture_unavailable'; end if;
    return ishrah_private.study_lecture_card(item,role,true);
  end if;

  select m.role into role from ishrah_private.study_members m where m.group_id=p_id and m.user_id=actor and m.role<>'removed';
  if role is null then raise exception 'study_lecture_unavailable'; end if;
  if p_op='group' then
    select coalesce(jsonb_agg(card order by starts_at),'[]') into result from (
      select ishrah_private.study_lecture_card(x,role,false) card,x.starts_at
      from ishrah_private.study_lectures x where x.group_id=p_id and (x.scheduled_at is not null or role in ('owner','admin'))
        and x.starts_at + make_interval(mins=>x.duration)>now()
      order by x.starts_at limit 50
    ) entries;
    return jsonb_build_object('role',role,'sessions',result);
  elsif p_op='lecturers' and role in ('owner','admin') then
    if char_length(term)<2 then return '[]'::jsonb; end if;
    select coalesce(jsonb_agg(to_jsonb(l) order by l.name),'[]') into result from (
      select l.id,left(l.name,120) name from public.lecturers l join public.profiles p on p.id=l.id
      where l.status='active' and coalesce(p.status,'active')='active' and l.id<>actor and strpos(lower(l.name),term)>0
      order by l.name,l.id limit 15
    ) l;
    return result;
  end if;
  raise exception 'study_lecture_forbidden';
end
$$;

create or replace function public.ish_study_lecture_action(p_op text,p_id uuid,p_data jsonb default '{}')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  room uuid;
  item ishrah_private.study_lectures%rowtype;
  role text;
  lecturer uuid;
  request_nonce uuid;
  subject text := btrim(coalesce(p_data->>'title',''));
  starts timestamptz;
  immediate boolean := coalesce(p_data->>'start_now'='true',false);
  minutes integer;
  link text := nullif(btrim(p_data->>'meet_url'),'');
  notice_ar text;
  notice_en text;
  notice_url text;
begin
  if actor is null or not exists(select 1 from public.profiles p where p.id=actor and coalesce(p.status,'active')='active') then
    raise exception 'study_sign_in';
  end if;

  if p_op='create' then room:=p_id;
  else select x.group_id into room from ishrah_private.study_lectures x where x.id=p_id;
  end if;
  perform 1 from ishrah_private.study_groups where id=room for update;
  if not found then raise exception 'study_lecture_unavailable'; end if;
  select m.role into role from ishrah_private.study_members m where m.group_id=room and m.user_id=actor and m.role<>'removed';

  if p_op='create' then
    if coalesce(role,'') not in ('owner','admin') then raise exception 'study_lecture_forbidden'; end if;
    begin
      request_nonce:=(p_data->>'nonce')::uuid;
      lecturer:=nullif(p_data->>'lecturer','')::uuid;
      starts:=case when immediate then now() else (p_data->>'starts_at')::timestamptz end;
      minutes:=(p_data->>'duration')::integer;
    exception when data_exception then raise exception 'study_lecture_invalid';
    end;
    if not public.ish_staff() and ishrah_private.contact_mask(subject) is distinct from subject then
      raise exception 'study_contact';
    end if;
    if request_nonce is null then raise exception 'study_lecture_invalid'; end if;
    select * into item from ishrah_private.study_lectures x
      where x.group_id=room and x.organizer_id=actor and x.nonce=request_nonce;
    if found then return jsonb_build_object('id',item.id); end if;
    if char_length(subject) not between 1 and 100 or starts is null or not isfinite(starts)
      or (immediate and lecturer is not null) or (not immediate and starts<=now()) or minutes is null or minutes not between 1 and 60 then raise exception 'study_lecture_invalid'; end if;
    if lecturer is not null and (lecturer=actor or not exists(select 1 from public.lecturers l join public.profiles p on p.id=l.id
      where l.id=lecturer and l.status='active' and coalesce(p.status,'active')='active')) then
      raise exception 'study_lecturer_unavailable';
    end if;
    if lecturer is null and (link is null or link !~ '^https://meet[.]google[.]com/[a-z]{3}-[a-z]{4}-[a-z]{3}$') then
      raise exception 'study_lecture_link';
    end if;
    insert into ishrah_private.study_lectures(group_id,organizer_id,lecturer_id,nonce,title,starts_at,duration,status,meet_url,scheduled_at)
    values(room,actor,lecturer,request_nonce,subject,starts,minutes,
      case when lecturer is null then 'scheduled' else 'invited' end,
      case when lecturer is null then link end,case when lecturer is null then now() end)
    returning * into item;
  else
    select * into item from ishrah_private.study_lectures where id=p_id for update;
    if not found then raise exception 'study_lecture_unavailable'; end if;
    if p_op in ('accept','decline') then
      if item.lecturer_id is distinct from actor then raise exception 'study_lecture_forbidden'; end if;
      if item.status<>'invited' or item.starts_at<=now() then raise exception 'study_lecture_stale'; end if;
      if p_op='accept' and not exists(select 1 from public.lecturers l where l.id=actor and l.status='active') then
        raise exception 'study_lecturer_unavailable';
      end if;
      if p_op='accept' and (link is null or link !~ '^https://meet[.]google[.]com/[a-z]{3}-[a-z]{4}-[a-z]{3}$') then
        raise exception 'study_lecture_link';
      end if;
      update ishrah_private.study_lectures set status=case when p_op='accept' then 'scheduled' else 'declined' end,
        meet_url=case when p_op='accept' then link end,scheduled_at=case when p_op='accept' then now() end
        where id=item.id returning * into item;
    elsif p_op='cancel' then
      if coalesce(role,'') not in ('owner','admin') and (item.lecturer_id is distinct from actor or item.status='invited') then
        raise exception 'study_lecture_forbidden';
      end if;
      if item.status='cancelled' then return jsonb_build_object('id',item.id); end if;
      if item.status not in ('invited','scheduled') or item.starts_at + make_interval(mins=>item.duration)<=now() then
        raise exception 'study_lecture_stale';
      end if;
      update ishrah_private.study_lectures set status='cancelled',meet_url=null where id=item.id returning * into item;
    else
      raise exception 'study_lecture_forbidden';
    end if;
  end if;

  notice_url:='#study-lecture/' || item.id;
  if item.status='invited' then
    notice_ar:='دعوة لتقديم محاضرة مباشرة'; notice_en:='Invitation to teach a live lecture';
  elsif item.status='scheduled' then
    notice_ar:='موعد محاضرة مباشرة'; notice_en:='Live lecture scheduled';
  elsif item.status='declined' then
    notice_ar:='اعتذر المحاضر عن الدعوة'; notice_en:='Lecturer declined the invitation';
  else
    notice_ar:='أُلغيت المحاضرة المباشرة'; notice_en:='Live lecture cancelled';
  end if;
  -- Personal notices carry no group details or meeting URL. Access is checked when opened.
  insert into public.notices(user_id,actor,kind,title,title_en,body,link)
  select p.id,actor,'study-lecture',notice_ar,notice_en,'',notice_url
  from public.profiles p
  where p.id is distinct from actor and coalesce(p.status,'active')='active' and (
    (p.id=item.lecturer_id and item.status in ('invited','cancelled')) or
    exists(select 1 from ishrah_private.study_members m where m.group_id=room and m.user_id=p.id and m.role<>'removed'
      and (item.scheduled_at is not null or (item.status in ('declined','cancelled') and m.role in ('owner','admin'))))
  );
  return jsonb_build_object('id',item.id);
end
$$;

revoke all on function public.ish_study_lecture_read(text,uuid,text),public.ish_study_lecture_action(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.ish_study_lecture_read(text,uuid,text),public.ish_study_lecture_action(text,uuid,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
