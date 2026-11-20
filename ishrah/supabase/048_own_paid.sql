-- اشرح لي · 048: authors and paid items; lecturer pictures (owner, 20 Nov 2026: "owner edit or delete … for paid should go through the admin";
-- "the logo is without a picture"). ish_own_delete: a free course can be hidden by its lecturer; a paid course, file or series is refused
-- (the app sends a request to the team instead). The lecturer card picture follows the profile picture when the lecturer page has none
-- or had the same one. Safe to run again.

create or replace function public.ish_own_delete(kind text, target uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); n int := 0;
begin
  if me is null then raise exception 'request_sign_in'; end if;
  if kind in ('file', 'series') and exists (select 1 from public.files where (id = target or series_id = target) and coalesce(price, 0) > 0)
    then raise exception 'own_delete_paid'; end if;
  if kind = 'post' then update public.posts set status = 'removed' where id = target and user_id = me; get diagnostics n = row_count;
  elsif kind = 'file' then update public.files set status = 'removed' where id = target and owner_id = me; get diagnostics n = row_count;
  elsif kind = 'series' then update public.files set status = 'removed' where series_id = target and owner_id = me; get diagnostics n = row_count;
  elsif kind = 'event' then delete from public.events where id = target and lecturer_id = me; get diagnostics n = row_count;
  elsif kind = 'course' then
    -- a free course only; a paid course (or one with paid students) goes through the team
    if exists (select 1 from public.courses where id = target and coalesce(price, 0) > 0) or exists (select 1 from public.enrollments where course_id = target and coalesce(price, 0) > 0)
      then raise exception 'own_delete_paid'; end if;
    if not exists (select 1 from public.courses where id = target and lecturer_id = me) then raise exception 'own_delete_not_yours'; end if;
    -- the course guard keeps a lecturer's status changes to draft/review; this checked hide runs as the server for this one update
    declare claims text := current_setting('request.jwt.claims', true);
    begin
      perform set_config('request.jwt.claims', '', true);
      update public.courses set status = 'hidden' where id = target and lecturer_id = me; get diagnostics n = row_count;
      perform set_config('request.jwt.claims', coalesce(claims, ''), true);
    end;
  elsif kind = 'request' then
    if exists (select 1 from public.enrollments where request_id = target and coalesce(price, 0) > 0 and status in ('pending','active')) then raise exception 'request_has_payments'; end if;
    update public.course_requests set status = 'deleted' where id = target and user_id = me; get diagnostics n = row_count;
  else raise exception 'own_delete_invalid'; end if;
  if n = 0 then raise exception 'own_delete_not_yours'; end if;
  insert into public.audit (user_id, action, target) values (me, 'author delete ' || kind, target::text);
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.ish_own_delete(text, uuid) from public, anon;
grant execute on function public.ish_own_delete(text, uuid) to authenticated;

create or replace function ishrah_private.lecturer_photo_sync() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.photo is distinct from old.photo then
    update public.lecturers set photo = new.photo where id = new.id and (coalesce(photo, '') = '' or photo is not distinct from old.photo);
  end if;
  return new;
end $$;
revoke all on function ishrah_private.lecturer_photo_sync() from public, anon, authenticated;
drop trigger if exists ish_lecturer_photo_sync on public.profiles;
create trigger ish_lecturer_photo_sync after update of photo on public.profiles for each row execute function ishrah_private.lecturer_photo_sync();
update public.lecturers l set photo = p.photo from public.profiles p where p.id = l.id and coalesce(l.photo, '') = '' and coalesce(p.photo, '') <> '';
