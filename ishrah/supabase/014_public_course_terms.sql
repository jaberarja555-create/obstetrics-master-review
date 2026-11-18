-- Publish teaching terms explicitly. Earlier offers were collected as private.
begin;

alter table public.course_request_offers add column if not exists terms_public boolean not null default false;
alter table public.course_request_offers add column if not exists price numeric(12,2) check (price between 0 and 9999999999.99);
alter table public.course_request_offers add column if not exists starts_at timestamptz check (starts_at >= '2000-01-01' and starts_at < '2200-01-01');
alter table public.course_requests add column if not exists comment_count integer not null default 0;
alter table public.course_requests add column if not exists payment_required boolean not null default false;
alter table public.course_requests add column if not exists reserved_count integer not null default 0;
alter table public.course_requests add column if not exists paid_count integer not null default 0;
update public.course_requests r set comment_count = (select count(*) from public.course_request_comments c where c.request_id = r.id);

create or replace function ishrah_private.course_request_comment_count() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.course_requests set comment_count = comment_count + 1 where id = new.request_id;
  else
    update public.course_requests set comment_count = comment_count - 1 where id = old.request_id;
  end if;
  return null;
end $$;
revoke all on function ishrah_private.course_request_comment_count() from public, anon, authenticated;
drop trigger if exists sync_comment_count on public.course_request_comments;
create trigger sync_comment_count after insert or delete on public.course_request_comments
  for each row execute function ishrah_private.course_request_comment_count();

alter table public.posts add column if not exists post_kind text not null default 'discussion';
alter table public.posts drop constraint if exists posts_post_kind_check;
alter table public.posts add constraint posts_post_kind_check check (post_kind in ('discussion','question','course_preview','announcement'));
update public.posts set post_kind = 'course_preview'
  where room <> 'qa' and post_kind = 'discussion'
    and (course_id is not null or preview_video is not null or preview_image is not null or cardinality(highlights) > 0);

create or replace function ishrah_private.guard_lecturer_post() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon','authenticated') then
    new.like_count := case when tg_op = 'INSERT' then 0 else old.like_count end;
    new.dislike_count := case when tg_op = 'INSERT' then 0 else old.dislike_count end;
    new.rating_count := case when tg_op = 'INSERT' then 0 else old.rating_count end;
    new.rating_points := case when tg_op = 'INSERT' then 0 else old.rating_points end;
  end if;
  if tg_op = 'UPDATE' and row(new.preview_video,new.preview_image,new.highlights,new.course_id,new.user_id,new.spec,new.room)
    is not distinct from row(old.preview_video,old.preview_image,old.highlights,old.course_id,old.user_id,old.spec,old.room) then return new; end if;
  if new.room = 'qa' then new.preview_video := null; new.preview_image := null; new.highlights := '{}'; return new; end if;
  if new.course_id is null and new.preview_video is null and new.preview_image is null and cardinality(new.highlights) = 0 then return new; end if;
  if not exists (select 1 from public.lecturers l where l.id = new.user_id and l.status = 'active')
    and not (new.user_id = auth.uid() and public.ish_do('notify','add')) then
    raise exception 'lecturer_post_required';
  end if;
  if new.preview_video is not null and new.preview_video !~ '^(yt:[A-Za-z0-9_-]{11}|gd:[A-Za-z0-9_-]{10,100})$' then
    raise exception 'lecturer_post_invalid_video';
  end if;
  if new.preview_image is not null and (new.preview_image !~ '^https://' or char_length(new.preview_image) > 1500) then
    raise exception 'lecturer_post_invalid_image';
  end if;
  if cardinality(new.highlights) > 6 or char_length(array_to_string(new.highlights, ' ')) > 600 then
    raise exception 'lecturer_post_highlights';
  end if;
  if new.course_id is not null and not exists (
    select 1 from public.courses c left join public.subjects s on s.id = c.subject
    where c.id = new.course_id and (c.lecturer_id = new.user_id or public.ish_do('notify','add')) and c.status = 'published'
      and coalesce(s.spec,c.spec,'medicine') = new.spec and coalesce(s.cat,c.cat) = new.room
  ) then raise exception 'lecturer_post_course_scope'; end if;
  new.lecturer_id := case when exists (select 1 from public.lecturers l where l.id = new.user_id and l.status = 'active') then new.user_id end;
  return new;
end $$;

create or replace function ishrah_private.guard_post_kind() returns trigger
language plpgsql set search_path = '' as $$
declare
  has_preview boolean := new.course_id is not null or new.preview_video is not null or new.preview_image is not null or cardinality(new.highlights) > 0;
begin
  if new.room = 'qa' then new.post_kind := 'discussion'; return new; end if;
  -- A form from before post kinds can still submit a lecturer's media as a course preview.
  if new.post_kind = 'discussion' and has_preview then new.post_kind := 'course_preview'; end if;
  if new.post_kind in ('course_preview','announcement') then
    if not exists (select 1 from public.lecturers l where l.id = new.user_id and l.status = 'active')
      and not (new.user_id = auth.uid() and public.ish_do('notify','add')) then
      raise exception 'lecturer_post_required';
    end if;
    if new.post_kind = 'announcement' and has_preview then raise exception 'lecturer_post_wrong_kind'; end if;
  elsif has_preview then
    raise exception 'lecturer_post_wrong_kind';
  end if;
  new.lecturer_id := case when exists (select 1 from public.lecturers l where l.id = new.user_id and l.status = 'active') then new.user_id end;
  return new;
end $$;
revoke all on function ishrah_private.guard_post_kind() from public, anon, authenticated;
drop trigger if exists ish_guard_post_kind on public.posts;
create trigger ish_guard_post_kind before insert or update of post_kind, user_id, room, course_id, lecturer_id, preview_video, preview_image, highlights
  on public.posts for each row execute function ishrah_private.guard_post_kind();

create table if not exists public.course_request_files (
  path text primary key,
  request_id uuid not null references public.course_requests on delete cascade,
  name text not null check (char_length(name) between 1 and 240),
  mime text not null,
  position integer not null check (position between 1 and 4),
  unique (request_id, position)
);
alter table public.course_request_files enable row level security;
revoke all on public.course_request_files from public, anon, authenticated;
grant select on public.course_request_files to anon, authenticated;
drop policy if exists visible on public.course_request_files;
create policy visible on public.course_request_files for select to anon, authenticated using (
  exists (select 1 from public.course_requests r where r.id = request_id)
);
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('course-request-files', 'course-request-files', false, 10485760, array[
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'
]) on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists ish_request_file_upload on storage.objects;
create policy ish_request_file_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'course-request-files' and split_part(name,'/',1) = (select auth.uid())::text
);
drop policy if exists ish_request_file_read on storage.objects;
create policy ish_request_file_read on storage.objects for select to anon, authenticated using (
  bucket_id = 'course-request-files' and (
    split_part(name,'/',1) = (select auth.uid())::text or
    exists (select 1 from public.course_request_files f where f.path = storage.objects.name)
  )
);
create or replace function ishrah_private.request_file_is_linked(object_path text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.course_request_files where path = object_path)
$$;
revoke all on function ishrah_private.request_file_is_linked(text) from public, anon, authenticated;
grant execute on function ishrah_private.request_file_is_linked(text) to authenticated;
drop policy if exists ish_request_file_cleanup on storage.objects;
create policy ish_request_file_cleanup on storage.objects for delete to authenticated using (
  bucket_id = 'course-request-files' and split_part(name,'/',1) = (select auth.uid())::text
    and not ishrah_private.request_file_is_linked(name)
);

create or replace function ishrah_private.public_course_terms(request uuid)
returns table (id uuid, lecturer_name text, terms text, status text, price numeric, starts_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select o.id, o.lecturer_name, o.terms, o.status, o.price, o.starts_at
  from public.course_request_offers o
  join public.course_requests r on r.id = o.request_id
  where r.id = request and r.status in ('open','closed') and o.terms_public and o.status in ('offered','accepted')
  order by (o.status = 'accepted') desc, o.created_at desc, o.id
$$;
revoke all on function ishrah_private.public_course_terms(uuid) from public, anon, authenticated;
grant usage on schema ishrah_private to anon;
grant execute on function ishrah_private.public_course_terms(uuid) to anon, authenticated;

create or replace function public.ish_public_course_terms(request uuid)
returns table (id uuid, lecturer_name text, terms text, status text, price numeric, starts_at timestamptz)
language sql stable security invoker set search_path = '' as $$
  select * from ishrah_private.public_course_terms(request)
$$;
revoke all on function public.ish_public_course_terms(uuid) from public, anon, authenticated;
grant execute on function public.ish_public_course_terms(uuid) to anon, authenticated;

create or replace function ishrah_private.course_request_public_change(action text, request uuid, payload jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  publish boolean := coalesce(payload->'public_terms' = 'true'::jsonb, false);
  offer_price numeric;
  offer_start timestamptz;
  attachment jsonb;
  file_path text;
  file_mime text;
  file_position integer := 0;
  request_row public.course_requests;
  result uuid;
begin
  if action = 'create' then
    if payload ? 'price' then
      payload := payload || jsonb_build_object('budget_min',payload->'price','budget_max',payload->'price');
    end if;
    if payload ? 'attachments' then
      if jsonb_typeof(payload->'attachments') <> 'array' then raise exception 'request_attachment_invalid'; end if;
      if jsonb_array_length(payload->'attachments') > 4 then raise exception 'request_attachment_invalid'; end if;
    end if;
    result := ishrah_private.course_request_change(action, request, payload);
    for attachment in select value from jsonb_array_elements(coalesce(payload->'attachments', '[]'::jsonb)) loop
      file_path := attachment->>'path';
      file_position := file_position + 1;
      if split_part(file_path,'/',1) is distinct from actor::text then raise exception 'request_attachment_invalid'; end if;
      select o.metadata->>'mimetype' into file_mime from storage.objects o
        join storage.buckets b on b.id = o.bucket_id
        where o.bucket_id = 'course-request-files' and o.name = file_path
          and (o.metadata->>'mimetype') = any(b.allowed_mime_types)
          and (o.metadata->>'size')::bigint between 1 and b.file_size_limit
        for share of o;
      if not found then raise exception 'request_attachment_invalid'; end if;
      insert into public.course_request_files(path,request_id,name,mime,position)
        values (file_path,result,trim(attachment->>'name'),file_mime,file_position);
    end loop;
    return result;
  end if;
  if action in ('offer','accept','publish_terms','join','leave','delete') then
    if actor is null then raise exception 'request_sign_in'; end if;
    -- Use the same lock as course_request_change so acceptance, publication and editing agree.
    select * into request_row from public.course_requests where id = request
      and (status in ('open','closed') or (action = 'delete' and status <> 'deleted')) for update;
    if not found then raise exception 'request_unavailable'; end if;
    if request_row.payment_required and action in ('join','leave') then raise exception 'request_payment_required'; end if;
    if request_row.reserved_count > 0 and action = 'delete' then raise exception 'request_has_payments'; end if;
  end if;
  if (action = 'offer' and publish) or action = 'publish_terms' then
    offer_price := (payload->>'price')::numeric;
    offer_start := (payload->>'starts_at')::timestamptz;
    if offer_price is null or offer_price not between 0 and 9999999999.99 then raise exception 'request_offer_price_required'; end if;
  end if;

  if action = 'offer' then
    if not publish and exists (
      select 1 from public.course_request_offers o where o.request_id = request and o.lecturer_id = actor and o.terms_public
    ) then raise exception 'request_offer_public_required'; end if;
    result := ishrah_private.course_request_change(action, request, payload);
    if publish then
      update public.course_request_offers set terms_public = true, price = offer_price, starts_at = offer_start where request_id = result and lecturer_id = actor;
    end if;
    return result;
  end if;

  if action = 'publish_terms' then
    update public.course_request_offers o set terms_public = true, price = offer_price, starts_at = offer_start
    where o.request_id = request and o.id = (payload->>'id')::uuid and o.lecturer_id = actor
      and o.status in ('offered','accepted') and not o.terms_public
      and exists (
        select 1 from public.profiles p join public.lecturers l on l.id = p.id
        where p.id = actor and p.status is distinct from 'blocked' and p.team_status is distinct from 'suspended' and l.status = 'active'
      );
    if not found then raise exception 'request_permission'; end if;
    if offer_price > 0 and exists (select 1 from public.course_request_offers o where o.id = (payload->>'id')::uuid and o.status = 'accepted') then
      update public.course_requests set payment_required = true where id = request;
    end if;
    return request;
  end if;

  if action = 'accept' and exists (
    select 1 from public.course_request_offers o join public.course_requests r on r.id = o.request_id
    where r.id = request and r.user_id = actor and o.id = (payload->>'id')::uuid and o.status = 'offered' and not o.terms_public
  ) then raise exception 'request_offer_private'; end if;

  result := ishrah_private.course_request_change(action, request, payload);
  if action = 'accept' and not request_row.payment_required and exists (
    select 1 from public.course_request_offers o where o.request_id = request and o.status = 'accepted' and o.terms_public and o.price > 0
  ) then
    update public.course_requests set payment_required = true,
      status = case when auto_close and joined_count >= goal then 'open' else status end where id = request;
  end if;
  return result;
end $$;
revoke all on function ishrah_private.course_request_public_change(text,uuid,jsonb) from public, anon, authenticated;
grant execute on function ishrah_private.course_request_public_change(text,uuid,jsonb) to authenticated;
revoke execute on function ishrah_private.course_request_change(text,uuid,jsonb) from authenticated;

create or replace function public.ish_course_request(action text, request uuid default null, payload jsonb default '{}'::jsonb)
returns uuid language sql security invoker set search_path = '' as $$
  select ishrah_private.course_request_public_change(action, request, payload)
$$;

-- A positive teaching agreement uses the existing enrolment and receipt queue.
alter table public.enrollments add column if not exists request_id uuid references public.course_requests on delete cascade;
create unique index if not exists ish_request_payment_seat on public.enrollments(request_id, user_id)
  where request_id is not null and status in ('pending','active');

create or replace function public.ish_enrol() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  c public.courses;
  r public.course_requests;
  lecturer uuid;
  amount numeric;
  actor uuid := auth.uid();
  grant_course boolean;
begin
  if new.request_id is not null then
    select * into r from public.course_requests where id = new.request_id for update;
    if r.id is null or r.status <> 'open' or not r.payment_required or new.course_id is not null then
      raise exception 'request_closed';
    end if;
    if r.auto_close and r.reserved_count >= r.goal then raise exception 'request_no_seats'; end if;
    select o.lecturer_id, o.price into lecturer, amount from public.course_request_offers o
      where o.request_id = r.id and o.status = 'accepted' and o.terms_public and o.price > 0;
    if not found or new.user_id is distinct from actor or new.user_id = lecturer then raise exception 'request_permission'; end if;
  else
    select * into c from public.courses where id = new.course_id;
    if c.id is null or (c.status <> 'published' and not public.ish_do('students','add')) then raise exception 'course not open'; end if;
    lecturer := c.lecturer_id;
    amount := coalesce(c.price, 0);
    grant_course := new.status = 'active' and new.price = 0 and new.decided_by = actor and public.ish_do('students','add');
    if grant_course then amount := 0; end if;
    if new.user_id is distinct from actor and not (public.ish_do('students','add') or public.ish_do('pay','add')) then
      raise exception 'request_permission';
    end if;
  end if;

  if not exists (
    select 1 from public.profiles p where p.id = new.user_id and p.status is distinct from 'blocked' and p.team_status is distinct from 'suspended'
  ) then raise exception 'request_permission'; end if;
  if amount > 0 and (
    nullif(trim(new.payer), '') is null or nullif(trim(new.phone), '') is null or nullif(trim(new.ref), '') is null or
    not exists (select 1 from storage.objects o where o.bucket_id = 'receipts' and o.name = new.receipt
      and split_part(o.name,'/',1) = actor::text and o.metadata->>'mimetype' like 'image/%')
  ) then raise exception 'payment_receipt_required'; end if;

  new.lecturer_id := lecturer;
  new.price := amount;
  new.status := case when amount > 0 then 'pending' else 'active' end;
  new.decided_by := case when grant_course then actor end;
  new.decided_at := case when amount = 0 then now() end;
  new.share := null;
  return new;
end $$;

create or replace function ishrah_private.guard_payment_decision() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.request_id is distinct from new.request_id or old.course_id is distinct from new.course_id
    or old.user_id is distinct from new.user_id then raise exception 'request_permission'; end if;
  if old.price > 0 and old.status is distinct from new.status
    and (old.status <> 'pending' or new.status not in ('active','rejected') or not public.ish_do('pay','approve'))
    then raise exception 'request_permission'; end if;
  if (old.price > 0 or new.price > 0) and row(old.price,old.lecturer_id,old.receipt,old.payer,old.phone,old.ref)
    is distinct from row(new.price,new.lecturer_id,new.receipt,new.payer,new.phone,new.ref) then raise exception 'request_permission'; end if;
  return new;
end $$;
revoke all on function ishrah_private.guard_payment_decision() from public, anon, authenticated;
drop trigger if exists ish_guard_payment_decision on public.enrollments;
create trigger ish_guard_payment_decision before update on public.enrollments
  for each row execute function ishrah_private.guard_payment_decision();

create or replace function ishrah_private.request_payment_count() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  reserved_delta integer := 0;
  paid_delta integer := 0;
  request uuid;
begin
  if tg_op <> 'INSERT' then
    request := old.request_id;
    reserved_delta := reserved_delta - (old.status in ('pending','active'))::int;
    paid_delta := paid_delta - (old.status = 'active')::int;
  end if;
  if tg_op <> 'DELETE' then
    request := new.request_id;
    reserved_delta := reserved_delta + (new.status in ('pending','active'))::int;
    paid_delta := paid_delta + (new.status = 'active')::int;
  end if;
  if request is not null and (reserved_delta <> 0 or paid_delta <> 0) then
    update public.course_requests set reserved_count = reserved_count + reserved_delta, paid_count = paid_count + paid_delta,
      status = case when auto_close and paid_count + paid_delta >= goal then 'closed' else status end where id = request;
  end if;
  return null;
end $$;
revoke all on function ishrah_private.request_payment_count() from public, anon, authenticated;
drop trigger if exists ish_request_payment_count on public.enrollments;
create trigger ish_request_payment_count after insert or update of status or delete on public.enrollments
  for each row execute function ishrah_private.request_payment_count();

notify pgrst, 'reload schema';
commit;
