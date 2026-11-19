-- Library uploads can cover several subjects within a single study section.
begin;

-- A null array preserves the single subject on uploads created before this change.
alter table public.files add column if not exists subjects text[];

create or replace function ishrah_private.library_subjects_valid(selected text[], speciality text, section text)
returns boolean language sql stable security invoker set search_path = '' as $$
  select coalesce(array_ndims(selected),1) = 1 and coalesce(array_lower(selected,1),1) = 1
    and coalesce(cardinality(selected),0) = (
    select count(*) from public.subjects s
    where s.id = any(selected) and s.spec = speciality and s.cat = section
  )
$$;
revoke all on function ishrah_private.library_subjects_valid(text[],text,text) from public, anon, authenticated;
grant execute on function ishrah_private.library_subjects_valid(text[],text,text) to authenticated;

create or replace function ishrah_private.guard_library_subjects() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if row(new.subjects,new.subject,new.spec,new.cat) is not distinct from row(old.subjects,old.subject,old.spec,old.cat) then
      return new;
    end if;
    if current_user in ('anon','authenticated') then raise exception 'library_edit_review_required'; end if;
  end if;
  if new.subjects is not null and (
    new.subject is distinct from new.subjects[1]
    or not ishrah_private.library_subjects_valid(new.subjects,new.spec,new.cat)
  ) then raise exception 'library_subject_scope'; end if;
  return new;
end $$;
revoke all on function ishrah_private.guard_library_subjects() from public, anon, authenticated;
drop trigger if exists ish_guard_library_subjects on public.files;
create trigger ish_guard_library_subjects before insert or update of subjects,subject,spec,cat
on public.files for each row execute function ishrah_private.guard_library_subjects();

-- Keep shared series edits separate from edits to an individual part.
alter table public.library_file_revisions add column if not exists for_series boolean not null default false;
alter table public.library_file_revisions drop constraint if exists library_file_revisions_file_id_key;
create unique index if not exists library_revision_file_and_scope on public.library_file_revisions(file_id,for_series);
create or replace function ishrah_private.guard_library_content_edit() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user not in ('anon','authenticated') then return new; end if;
  if row(new.title,new.author,new.about,new.path,new.reading_path,new.cover,new.mime,new.size,new.pages,new.tags,
         new.price,new.kind,new.subject,new.spec,new.cat,new.series_id,new.series_title,new.series_no,new.owner_id,new.owner_name,
         new.rights_origin,new.rights_source,new.rights_confirmed)
     is distinct from
     row(old.title,old.author,old.about,old.path,old.reading_path,old.cover,old.mime,old.size,old.pages,old.tags,
         old.price,old.kind,old.subject,old.spec,old.cat,old.series_id,old.series_title,old.series_no,old.owner_id,old.owner_name,
         old.rights_origin,old.rights_source,old.rights_confirmed) then raise exception 'library_edit_review_required'; end if;
  if old.status is distinct from new.status and new.status = 'published' and exists (
    select 1 from public.library_file_revisions where file_id = old.id and not for_series and status = 'pending'
  ) then raise exception 'library_edit_review_required'; end if;
  return new;
end $$;

create or replace function ishrah_private.submit_library_revision(target uuid, revised jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  f public.files;
  actor uuid := auth.uid();
  next_id uuid := gen_random_uuid();
  content jsonb;
  object_path text;
  selected_subjects text[];
  for_series_edit boolean := revised ? 'series_title';
  series_title text := btrim(revised->>'series_title');
  origin text := revised->>'rights_origin';
  source text := nullif(btrim(revised->>'rights_source'), '');
begin
  select * into f from public.files where id = target and owner_id = actor and status in ('pending','published','rejected','removed') for update;
  if not found or not exists (
    select 1 from public.profiles where id = actor and status is distinct from 'blocked' and team_status is distinct from 'suspended'
  ) then raise exception 'library_edit_permission'; end if;
  if for_series_edit then
    if f.series_id is null or coalesce(char_length(series_title),0) not between 1 and 160
      or char_length(revised->>'author') > 120 or char_length(revised->>'about') > 600
      then raise exception 'library_edit_invalid'; end if;
    select lead.* into f from public.files lead
      where lead.series_id = f.series_id and lead.owner_id = actor and lead.spec = f.spec and lead.cat = f.cat
        and lead.status in ('pending','published','rejected','removed')
      order by lead.series_no nulls last, lead.id limit 1 for update;
    if not found then raise exception 'library_edit_permission'; end if;
    if jsonb_typeof(revised->'subjects') is distinct from 'array' then raise exception 'library_subject_scope'; end if;
    selected_subjects := array(select jsonb_array_elements_text(revised->'subjects'));
    if not ishrah_private.library_subjects_valid(selected_subjects,f.spec,f.cat) then raise exception 'library_subject_scope'; end if;
    content := jsonb_build_object('title',series_title,'series_title',series_title,'author',coalesce(revised->>'author',''),
      'about',coalesce(revised->>'about',''),'subjects',selected_subjects);
    insert into public.library_file_revisions (id,file_id,owner_id,for_series,changes) values (next_id,f.id,actor,true,content)
    on conflict (file_id,for_series) do update set id = excluded.id, changes = excluded.changes,
      status = 'pending', review_note = null, created_at = now();
    return next_id;
  end if;
  if revised->'rights_confirmed' is distinct from 'true'::jsonb or origin is null
    or origin not in ('original','free_source','permission') then raise exception 'library_rights_required'; end if;
  if f.price > 0 and origin <> 'original' then raise exception 'library_paid_original_only'; end if;
  if (origin <> 'original' and source is null) or char_length(source) > 500 then raise exception 'library_source_required'; end if;
  if coalesce(char_length(btrim(revised->>'title')), 0) not between 1 and 160
    or char_length(revised->>'author') > 120 or char_length(revised->>'about') > 600
    or jsonb_typeof(revised->'tags') is distinct from 'array'
    then raise exception 'library_edit_invalid'; end if;
  if jsonb_array_length(revised->'tags') > 8
    or exists (select 1 from jsonb_array_elements_text(revised->'tags') as t(tag) where char_length(tag) > 30) then
    raise exception 'library_edit_invalid';
  end if;
  foreach object_path in array array[revised->>'path', revised->>'reading_path', revised->>'cover'] loop
    if object_path is not null and (split_part(object_path,'/',1) <> actor::text or not exists (
      select 1 from storage.objects o where o.bucket_id = 'library' and o.name = object_path
    )) then raise exception 'invalid_library_object'; end if;
  end loop;
  content := jsonb_build_object('title',btrim(revised->>'title'), 'author',coalesce(revised->>'author',''),
    'about',coalesce(revised->>'about',''), 'tags',revised->'tags', 'rights_origin',origin,
    'rights_source',case when origin = 'original' then null else source end, 'rights_confirmed',true);
  if revised ? 'subjects' then
    if jsonb_typeof(revised->'subjects') is distinct from 'array' then raise exception 'library_subject_scope'; end if;
    selected_subjects := array(select jsonb_array_elements_text(revised->'subjects'));
    if not ishrah_private.library_subjects_valid(selected_subjects,f.spec,f.cat) then raise exception 'library_subject_scope'; end if;
    content := content || jsonb_build_object('subjects',selected_subjects);
  end if;
  if revised->>'cover' is not null then content := content || jsonb_build_object('cover',revised->>'cover'); end if;
  if revised->>'path' is not null then
    content := content || jsonb_build_object('path',revised->>'path', 'reading_path',revised->>'reading_path',
      'cover',revised->>'cover', 'mime',revised->>'mime', 'size',(revised->>'size')::bigint, 'pages',(revised->>'pages')::integer);
  end if;
  insert into public.library_file_revisions (id,file_id,owner_id,changes) values (next_id,f.id,actor,content)
  on conflict (file_id,for_series) do update set id = excluded.id, changes = excluded.changes,
    status = 'pending', review_note = null, created_at = now();
  return next_id;
end $$;

create or replace function ishrah_private.review_library_revision(target uuid, publish boolean, note text default '')
returns void language plpgsql security definer set search_path = '' as $$
declare
  edit public.library_file_revisions;
  f public.files;
  c jsonb;
begin
  if public.ish_do('library','approve') is distinct from true then raise exception 'library_edit_permission'; end if;
  select * into edit from public.library_file_revisions where id = target and status = 'pending';
  if not found then raise exception 'library_edit_unavailable'; end if;
  select * into f from public.files where id = edit.file_id for update;
  select * into edit from public.library_file_revisions where id = target and status = 'pending' for update;
  if not found or f.status not in ('pending','published','rejected','removed') then raise exception 'library_edit_unavailable'; end if;
  c := edit.changes;
  if publish and edit.for_series then
    update public.files set series_title = c->>'series_title', author = c->>'author', about = c->>'about',
      subject = c->'subjects'->>0, subjects = array(select jsonb_array_elements_text(c->'subjects'))
      where series_id = f.series_id and owner_id = edit.owner_id and spec = f.spec and cat = f.cat;
  elsif publish then
    if f.price > 0 and c->>'rights_origin' <> 'original' then raise exception 'library_paid_original_only'; end if;
    update public.files set title = c->>'title', author = c->>'author', about = c->>'about',
      subject = case when c ? 'subjects' then c->'subjects'->>0 else f.subject end,
      subjects = case when c ? 'subjects' then array(select jsonb_array_elements_text(c->'subjects')) else f.subjects end,
      tags = array(select jsonb_array_elements_text(c->'tags')), rights_origin = c->>'rights_origin',
      rights_source = c->>'rights_source', rights_confirmed = true,
      cover = case when c ? 'cover' then c->>'cover' else f.cover end,
      path = coalesce(c->>'path', f.path), mime = coalesce(c->>'mime', f.mime),
      reading_path = case when c ? 'path' then c->>'reading_path' else f.reading_path end,
      size = coalesce((c->>'size')::bigint, f.size), pages = coalesce((c->>'pages')::integer, f.pages),
      status = 'published' where id = f.id;
  end if;
  update public.library_file_revisions set status = case when publish then 'approved' else 'rejected' end,
    review_note = left(note, 1000) where id = target;
  insert into public.notices (user_id,title,title_en,body,link) values (
    f.owner_id, case when publish then 'تم اعتماد تعديلات ملفك' else 'لم تُعتمد تعديلات ملفك' end,
    case when publish then 'Your file edits were approved' else 'Your file edits were declined' end,
    case when publish then c->>'title' else left(note,1000) end,
    case when edit.for_series then '#series/' || f.series_id else '#file/' || f.id end);
  insert into public.audit (user_id,action,target) values (auth.uid(),
    case when publish then 'approve library edit' else 'decline library edit' end, f.id::text);
end $$;

revoke all on function ishrah_private.submit_library_revision(uuid,jsonb) from public, anon, authenticated;
revoke all on function ishrah_private.review_library_revision(uuid,boolean,text) from public, anon, authenticated;
grant execute on function ishrah_private.submit_library_revision(uuid,jsonb) to authenticated;
grant execute on function ishrah_private.review_library_revision(uuid,boolean,text) to authenticated;

create or replace function public.ish_submit_library_revision(target uuid, revised jsonb)
returns uuid language sql security invoker set search_path = '' as $$
  select ishrah_private.submit_library_revision(target,revised)
$$;
create or replace function public.ish_review_library_revision(target uuid, publish boolean, note text default '')
returns void language sql security invoker set search_path = '' as $$
  select ishrah_private.review_library_revision(target,publish,note)
$$;
revoke all on function public.ish_submit_library_revision(uuid,jsonb) from public, anon, authenticated;
revoke all on function public.ish_review_library_revision(uuid,boolean,text) from public, anon, authenticated;
grant execute on function public.ish_submit_library_revision(uuid,jsonb) to authenticated;
grant execute on function public.ish_review_library_revision(uuid,boolean,text) to authenticated;

notify pgrst, 'reload schema';
commit;
