-- Editing a whole series like uploading it (owner, 20 Nov 2026: "edit book series should be for everything like you are doing it from start,
-- and also can put a cover picture for the series").
--   * files.series_cover: one picture for the whole series (a picture in the public media bucket of this project, like course covers),
--     shown on the series cards and the series page instead of the first part's cover.
--   * ish_submit_series_revision(target, revised): the owner proposes, for the whole series: name, type, subjects, author, description,
--     tags, free / paid + price with the rights declaration, the series cover, the order of the parts, a new name for any part and parts to
--     remove. It waits in Control → Books & files like other edits (library_file_revisions, for_series). New parts are added as ordinary
--     uploads into the series (pending until published).
--   * Approving applies everything to every part of the series; removed parts get status 'removed'.
begin;

alter table public.files add column if not exists series_cover text;
alter table public.files drop constraint if exists files_series_cover_ok;
alter table public.files add constraint files_series_cover_ok check (series_cover is null or (char_length(series_cover) < 600 and
  series_cover ~ '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/media/'));

-- content fields (now with series_cover) still change only through a reviewed edit
create or replace function ishrah_private.guard_library_content_edit() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user not in ('anon','authenticated') then return new; end if;
  if tg_op = 'INSERT' then
    -- a new part may join only a series of the same owner, speciality and section
    if new.series_id is not null and exists (select 1 from public.files x where x.series_id = new.series_id
        and (x.owner_id is distinct from new.owner_id or x.spec is distinct from new.spec or x.cat is distinct from new.cat)) then
      raise exception 'library_edit_permission';
    end if;
    if new.series_id is not null then
      new.series_cover := (select x.series_cover from public.files x where x.series_id = new.series_id and x.series_cover is not null limit 1);
    else new.series_cover := null; end if;
    return new;
  end if;
  if row(new.title,new.author,new.about,new.path,new.reading_path,new.cover,new.mime,new.size,new.pages,new.tags,
         new.price,new.kind,new.subject,new.spec,new.cat,new.series_id,new.series_title,new.series_no,new.owner_id,new.owner_name,
         new.rights_origin,new.rights_source,new.rights_confirmed,new.series_cover)
     is distinct from
     row(old.title,old.author,old.about,old.path,old.reading_path,old.cover,old.mime,old.size,old.pages,old.tags,
         old.price,old.kind,old.subject,old.spec,old.cat,old.series_id,old.series_title,old.series_no,old.owner_id,old.owner_name,
         old.rights_origin,old.rights_source,old.rights_confirmed,old.series_cover) then raise exception 'library_edit_review_required'; end if;
  if old.status is distinct from new.status and new.status = 'published' and exists (
    select 1 from public.library_file_revisions where file_id = old.id and not for_series and status = 'pending'
  ) then raise exception 'library_edit_review_required'; end if;
  return new;
end $$;
drop trigger if exists ish_guard_library_new_part on public.files;
create trigger ish_guard_library_new_part before insert on public.files for each row execute function ishrah_private.guard_library_content_edit();

create or replace function public.ish_submit_series_revision(target uuid, revised jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  f public.files;
  lead public.files;
  next_id uuid := gen_random_uuid();
  title text := btrim(coalesce(revised->>'series_title', ''));
  subjects text[];
  origin text := revised->>'rights_origin';
  source text := nullif(btrim(coalesce(revised->>'rights_source', '')), '');
  price numeric := coalesce(nullif(revised->>'price', '')::numeric, 0);
  ids uuid[];
  content jsonb;
  k text; v text;
begin
  if actor is null or not exists (select 1 from public.profiles where id = actor and status is distinct from 'blocked' and team_status is distinct from 'suspended')
    then raise exception 'library_edit_permission'; end if;
  select * into f from public.files where id = target and owner_id = actor and series_id is not null and status in ('pending','published','rejected','removed');
  if not found then raise exception 'library_edit_permission'; end if;
  select x.* into lead from public.files x where x.series_id = f.series_id and x.owner_id = actor and x.spec is not distinct from f.spec and x.cat is not distinct from f.cat
    and x.status in ('pending','published','rejected','removed') order by x.series_no nulls last, x.id limit 1 for update;
  if lead.id is null then raise exception 'library_edit_permission'; end if;
  ids := array(select x.id from public.files x where x.series_id = f.series_id and x.owner_id = actor and x.status <> 'removed');

  if char_length(title) not between 1 and 160 or char_length(coalesce(revised->>'author','')) > 120 or char_length(coalesce(revised->>'about','')) > 600
    or char_length(coalesce(revised->>'kind','')) not between 1 and 30 then raise exception 'library_edit_invalid'; end if;
  if jsonb_typeof(revised->'subjects') is distinct from 'array' then raise exception 'library_subject_scope'; end if;
  subjects := array(select jsonb_array_elements_text(revised->'subjects'));
  if not ishrah_private.library_subjects_valid(subjects, f.spec, f.cat) then raise exception 'library_subject_scope'; end if;
  if jsonb_typeof(coalesce(revised->'tags', '[]')) <> 'array' or jsonb_array_length(coalesce(revised->'tags', '[]')) > 8
    or exists (select 1 from jsonb_array_elements_text(coalesce(revised->'tags', '[]')) t(tag) where char_length(tag) > 30) then raise exception 'library_edit_invalid'; end if;
  if price < 0 or price > 10000000 then raise exception 'library_edit_invalid'; end if;
  if revised->'rights_confirmed' is distinct from 'true'::jsonb or origin is null or origin not in ('original','free_source','permission') then raise exception 'library_rights_required'; end if;
  if price > 0 and origin <> 'original' then raise exception 'library_paid_original_only'; end if;
  if (origin <> 'original' and source is null) or char_length(source) > 500 then raise exception 'library_source_required'; end if;
  if nullif(revised->>'series_cover', '') is not null and not (char_length(revised->>'series_cover') < 600 and
      revised->>'series_cover' ~ '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/media/') then raise exception 'library_edit_invalid'; end if;
  -- order, new names and removals may name only this owner's parts of this series; at least one part stays
  if jsonb_typeof(coalesce(revised->'order', '[]')) <> 'array'
    or exists (select 1 from jsonb_array_elements_text(coalesce(revised->'order', '[]')) o(id) where not (o.id::uuid = any (ids))) then raise exception 'library_edit_invalid'; end if;
  if jsonb_typeof(coalesce(revised->'remove', '[]')) <> 'array'
    or exists (select 1 from jsonb_array_elements_text(coalesce(revised->'remove', '[]')) o(id) where not (o.id::uuid = any (ids)))
    or (select count(*) from jsonb_array_elements_text(coalesce(revised->'remove', '[]'))) >= coalesce(array_length(ids, 1), 0) then raise exception 'library_edit_invalid'; end if;
  if jsonb_typeof(coalesce(revised->'titles', '{}')) <> 'object' then raise exception 'library_edit_invalid'; end if;
  for k, v in select * from jsonb_each_text(coalesce(revised->'titles', '{}')) loop
    if not (k::uuid = any (ids)) or char_length(btrim(v)) not between 1 and 160 then raise exception 'library_edit_invalid'; end if;
  end loop;

  content := jsonb_build_object('title', title, 'series_title', title, 'kind', revised->>'kind', 'subjects', to_jsonb(subjects),
    'author', coalesce(revised->>'author', ''), 'about', coalesce(revised->>'about', ''), 'tags', coalesce(revised->'tags', '[]'),
    'price', price, 'rights_origin', origin, 'rights_source', case when origin = 'original' then null else source end, 'rights_confirmed', true,
    'series_cover', nullif(revised->>'series_cover', ''), 'order', coalesce(revised->'order', '[]'), 'titles', coalesce(revised->'titles', '{}'),
    'remove', coalesce(revised->'remove', '[]'), 'full', true);
  insert into public.library_file_revisions (id, file_id, owner_id, for_series, changes) values (next_id, lead.id, actor, true, content)
  on conflict (file_id, for_series) do update set id = excluded.id, changes = excluded.changes, status = 'pending', review_note = null, created_at = now();
  return next_id;
end $$;
revoke all on function public.ish_submit_series_revision(uuid, jsonb) from public, anon;
grant execute on function public.ish_submit_series_revision(uuid, jsonb) to authenticated;

create or replace function ishrah_private.review_library_revision(target uuid, publish boolean, note text default '')
returns void language plpgsql security definer set search_path = '' as $$
declare
  edit public.library_file_revisions;
  f public.files;
  c jsonb;
  i integer;
  pid text;
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
      where series_id = f.series_id and owner_id = edit.owner_id and spec is not distinct from f.spec and cat is not distinct from f.cat;
    if coalesce((c->>'full')::boolean, false) then
      if (c->>'price')::numeric > 0 and c->>'rights_origin' <> 'original' then raise exception 'library_paid_original_only'; end if;
      update public.files set kind = c->>'kind', tags = array(select jsonb_array_elements_text(c->'tags')), price = (c->>'price')::numeric,
        rights_origin = c->>'rights_origin', rights_source = c->>'rights_source', rights_confirmed = true, series_cover = c->>'series_cover'
        where series_id = f.series_id and owner_id = edit.owner_id and spec is not distinct from f.spec and cat is not distinct from f.cat;
      i := 0;
      for pid in select jsonb_array_elements_text(c->'order') loop
        i := i + 1;
        update public.files set series_no = i where id = pid::uuid and series_id = f.series_id and owner_id = edit.owner_id;
      end loop;
      update public.files x set title = left(btrim(t.value), 160) from jsonb_each_text(c->'titles') t
        where x.id = t.key::uuid and x.series_id = f.series_id and x.owner_id = edit.owner_id;
      update public.files set status = 'removed' where series_id = f.series_id and owner_id = edit.owner_id
        and id in (select r::uuid from jsonb_array_elements_text(c->'remove') r);
    end if;
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
revoke all on function ishrah_private.review_library_revision(uuid,boolean,text) from public, anon, authenticated;
grant execute on function ishrah_private.review_library_revision(uuid,boolean,text) to authenticated;

notify pgrst, 'reload schema';
commit;
