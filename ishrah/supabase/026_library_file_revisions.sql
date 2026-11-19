begin;

create table if not exists public.library_file_revisions (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null unique references public.files(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  changes jsonb not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_note text,
  created_at timestamptz not null default now()
);
alter table public.library_file_revisions enable row level security;
revoke all on public.library_file_revisions from public, anon, authenticated;
grant select on public.library_file_revisions to authenticated;
drop policy if exists library_revision_view on public.library_file_revisions;
create policy library_revision_view on public.library_file_revisions for select to authenticated
using (owner_id = (select auth.uid()) or (select public.ish_do('library','approve')));

drop policy if exists ish_library_revision_read on storage.objects;
create policy ish_library_revision_read on storage.objects for select to authenticated using (
  bucket_id = 'library' and (select public.ish_do('library','approve')) and exists (
    select 1 from public.library_file_revisions r where r.status = 'pending'
      and storage.objects.name in (r.changes->>'path', r.changes->>'reading_path', r.changes->>'cover')
  )
);

create or replace function public.ish_submit_library_revision(target uuid, revised jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  f public.files;
  actor uuid := auth.uid();
  next_id uuid := gen_random_uuid();
  content jsonb;
  object_path text;
  origin text := revised->>'rights_origin';
  source text := nullif(btrim(revised->>'rights_source'), '');
begin
  select * into f from public.files where id = target and owner_id = actor and status in ('pending','published','rejected','removed') for update;
  if not found or not exists (
    select 1 from public.profiles where id = actor and status is distinct from 'blocked' and team_status is distinct from 'suspended'
  ) then raise exception 'library_edit_permission'; end if;
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
  if revised->>'cover' is not null then content := content || jsonb_build_object('cover',revised->>'cover'); end if;
  if revised->>'path' is not null then
    content := content || jsonb_build_object('path',revised->>'path', 'reading_path',revised->>'reading_path',
      'cover',revised->>'cover', 'mime',revised->>'mime', 'size',(revised->>'size')::bigint, 'pages',(revised->>'pages')::integer);
  end if;
  insert into public.library_file_revisions (id,file_id,owner_id,changes) values (next_id,f.id,actor,content)
  on conflict (file_id) do update set id = excluded.id, changes = excluded.changes,
    status = 'pending', review_note = null, created_at = now();
  return next_id;
end $$;

create or replace function public.ish_review_library_revision(target uuid, publish boolean, note text default '')
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
  if publish then
    if f.price > 0 and c->>'rights_origin' <> 'original' then raise exception 'library_paid_original_only'; end if;
    update public.files set title = c->>'title', author = c->>'author', about = c->>'about',
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
    case when publish then c->>'title' else left(note,1000) end, '#file/' || f.id);
  insert into public.audit (user_id,action,target) values (auth.uid(),
    case when publish then 'approve library edit' else 'decline library edit' end, f.id::text);
end $$;

revoke all on function public.ish_submit_library_revision(uuid,jsonb) from public, anon, authenticated;
revoke all on function public.ish_review_library_revision(uuid,boolean,text) from public, anon, authenticated;
grant execute on function public.ish_submit_library_revision(uuid,jsonb) to authenticated;
grant execute on function public.ish_review_library_revision(uuid,boolean,text) to authenticated;

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
    select 1 from public.library_file_revisions where file_id = old.id and status = 'pending'
  ) then raise exception 'library_edit_review_required'; end if;
  return new;
end $$;
revoke all on function ishrah_private.guard_library_content_edit() from public, anon, authenticated;
drop trigger if exists ish_guard_library_content_edit on public.files;
create trigger ish_guard_library_content_edit before update on public.files
for each row execute function ishrah_private.guard_library_content_edit();

create or replace function public.ish_return_library_file(target uuid, note text)
returns void language plpgsql security definer set search_path = '' as $$
declare f public.files;
begin
  if public.ish_do('library','approve') is distinct from true then raise exception 'library_edit_permission'; end if;
  select * into f from public.files where id = target;
  if not found or f.owner_id is null or coalesce(char_length(btrim(note)),0) not between 1 and 1000 then
    raise exception 'library_edit_invalid';
  end if;
  insert into public.notices (user_id,title,title_en,body,link) values (
    f.owner_id,'طلب تعديل ملفك','Please edit your upload',btrim(note),'#file/' || f.id);
  insert into public.audit (user_id,action,target) values (auth.uid(),'request library edit',f.id::text);
end $$;
revoke all on function public.ish_return_library_file(uuid,text) from public, anon, authenticated;
grant execute on function public.ish_return_library_file(uuid,text) to authenticated;

commit;
