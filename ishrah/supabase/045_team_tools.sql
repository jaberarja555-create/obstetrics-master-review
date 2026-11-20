-- اشرح لي · 045: the same team tools on every kind of post, and delete for authors (owner, 20 Nov 2026: "admin control should be the same
-- in all posts: delete, suspend, send to the owner to adjust … and owners have edit and delete on their posts").
--   ish_team_act(kind, target, action, note, data)
--     kinds  : post · file · series · course · event · news · notice · request
--     actions: edit (data = the fields) · suspend · resume · return (note to the author; data.suspend = true also suspends) · delete
--     A suspended item has status 'suspended' (a course request goes back to 'pending'); resume publishes it again.
--     Runs as the definer so the library edit guard does not stop a team edit; every action is checked against the same permission as
--     before and written to the activity log.
--   ish_own_delete(kind, target): the author removes their own post, file, series, event or course request (requests with payments stay).
-- Safe to run again.

alter table public.notices add column if not exists status text default 'published';

create or replace function public.ish_team_act(kind text, target uuid, action text, note text default null, data jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  perm text; act text := case when action = 'delete' then 'delete' when action in ('suspend','resume','return') then 'approve' else 'edit' end;
  v_author uuid; v_title text; v_link text; v_live text; d jsonb := coalesce(data, '{}'::jsonb); n int := 0;
begin
  perm := case kind when 'post' then 'community' when 'file' then 'library' when 'series' then 'library' when 'course' then 'review'
    when 'event' then 'events' when 'news' then 'notify' when 'notice' then 'notify' when 'request' then 'review' end;
  if perm is null or action not in ('edit','suspend','resume','return','delete') then raise exception 'team_action_invalid'; end if;
  -- the same rules the app used: library and reviews decide with approve, community with edit, events and notify with edit/delete
  if not (public.ish_do(perm, act) or (perm in ('library','review') and public.ish_do(perm, 'approve'))
          or (perm = 'community' and public.ish_do('community', 'edit'))
          or (perm in ('events','notify') and public.ish_do(perm, case when action = 'delete' then 'delete' else 'edit' end))) then
    raise exception 'team_action_permission';
  end if;

  if kind = 'post' then
    select user_id, coalesce(title, left(body, 80)) into v_author, v_title from public.posts where id = target; v_live := 'open'; v_link := '#post/' || target;
  elsif kind = 'file' then
    select owner_id, title into v_author, v_title from public.files where id = target; v_live := 'published'; v_link := '#file/' || target;
  elsif kind = 'series' then
    select owner_id, coalesce(series_title, title) into v_author, v_title from public.files where series_id = target order by series_no nulls last limit 1;
    v_live := 'published'; v_link := '#series/' || target;
  elsif kind = 'course' then
    select lecturer_id, title into v_author, v_title from public.courses where id = target; v_live := 'published'; v_link := '#course/' || target;
  elsif kind = 'event' then
    select lecturer_id, title into v_author, v_title from public.events where id = target; v_live := 'published'; v_link := '#event/' || target;
  elsif kind = 'news' then
    select author_id, title into v_author, v_title from public.news where id = target; v_live := 'published'; v_link := '#news/' || target;
  elsif kind = 'notice' then
    select null::uuid, title into v_author, v_title from public.notices where id = target and user_id is null; v_live := 'published'; v_link := '#news/ann/' || target;
  elsif kind = 'request' then
    select user_id, title into v_author, v_title from public.course_requests where id = target; v_live := 'open'; v_link := '#course-request/' || target;
  end if;
  if not found then raise exception 'team_action_missing'; end if;

  if action = 'edit' then
    if kind = 'post' then update public.posts set title = coalesce(d->>'title', title), body = coalesce(d->>'body', body) where id = target;
    elsif kind = 'file' then update public.files set title = coalesce(nullif(btrim(d->>'title'), ''), title), author = coalesce(d->>'author', author), about = coalesce(d->>'about', about) where id = target;
    elsif kind = 'series' then update public.files set series_title = coalesce(nullif(btrim(d->>'series_title'), ''), series_title) where series_id = target;
    elsif kind = 'course' then update public.courses set title = coalesce(nullif(btrim(d->>'title'), ''), title), subtitle = coalesce(d->>'subtitle', subtitle) where id = target;
    elsif kind = 'event' then update public.events set title = coalesce(nullif(btrim(d->>'title'), ''), title), about = coalesce(d->>'about', about) where id = target;
    elsif kind = 'news' then update public.news set title = coalesce(nullif(btrim(d->>'title'), ''), title), body = coalesce(d->>'body', body) where id = target;
    elsif kind = 'notice' then update public.notices set title = coalesce(nullif(btrim(d->>'title'), ''), title), body = coalesce(d->>'body', body) where id = target;
    else raise exception 'team_action_invalid'; end if;
  elsif action in ('suspend','resume') or (action = 'return' and coalesce((d->>'suspend')::boolean, false)) then
    declare st text := case when action = 'resume' then v_live when kind = 'request' then 'pending' else 'suspended' end;
    begin
      if kind = 'post' then update public.posts set status = st where id = target;
      elsif kind = 'file' then update public.files set status = st where id = target;
      elsif kind = 'series' then update public.files set status = st where series_id = target and status <> 'removed';
      elsif kind = 'course' then update public.courses set status = st where id = target;
      elsif kind = 'event' then update public.events set status = st where id = target;
      elsif kind = 'news' then update public.news set status = st where id = target;
      elsif kind = 'notice' then update public.notices set status = st where id = target;
      elsif kind = 'request' then update public.course_requests set status = st where id = target;
      end if;
    end;
  elsif action = 'delete' then
    if kind = 'post' then update public.posts set status = 'removed' where id = target;
    elsif kind = 'file' then update public.files set status = 'removed' where id = target;
    elsif kind = 'series' then update public.files set status = 'removed' where series_id = target;
    elsif kind = 'course' then update public.courses set status = 'hidden' where id = target;
    elsif kind = 'event' then delete from public.events where id = target;
    elsif kind = 'news' then delete from public.news where id = target;
    elsif kind = 'notice' then delete from public.notices where id = target;
    elsif kind = 'request' then
      if exists (select 1 from public.enrollments where request_id = target and coalesce(price, 0) > 0 and status in ('pending','active')) then raise exception 'request_has_payments'; end if;
      update public.course_requests set status = 'deleted' where id = target;
    end if;
  end if;

  if action = 'return' then
    if v_author is null or coalesce(char_length(btrim(note)), 0) not between 1 and 1000 then raise exception 'team_action_invalid'; end if;
    insert into public.notices (user_id, title, title_en, body, link)
      values (v_author, 'طلب الفريق تعديل منشورك: ' || left(coalesce(v_title, ''), 80), 'The team asked you to edit your post: ' || left(coalesce(v_title, ''), 80), btrim(note), v_link);
  end if;
  insert into public.audit (user_id, action, target) values (auth.uid(), 'team ' || action || ' ' || kind, target::text || coalesce(' · ' || left(note, 200), ''));
  return jsonb_build_object('ok', true, 'action', action);
end $$;
revoke all on function public.ish_team_act(text, uuid, text, text, jsonb) from public, anon;
grant execute on function public.ish_team_act(text, uuid, text, text, jsonb) to authenticated;

create or replace function public.ish_own_delete(kind text, target uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); n int := 0;
begin
  if me is null then raise exception 'request_sign_in'; end if;
  if kind = 'post' then update public.posts set status = 'removed' where id = target and user_id = me; get diagnostics n = row_count;
  elsif kind = 'file' then update public.files set status = 'removed' where id = target and owner_id = me; get diagnostics n = row_count;
  elsif kind = 'series' then update public.files set status = 'removed' where series_id = target and owner_id = me; get diagnostics n = row_count;
  elsif kind = 'event' then delete from public.events where id = target and lecturer_id = me; get diagnostics n = row_count;
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
