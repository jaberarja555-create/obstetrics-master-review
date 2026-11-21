-- اشرح لي · 052: a plain post like Facebook (owner, 21 Nov 2026: «بدل معاينة كورس أضف منشور، شخص يقدر يعمل منشور مثل حق الفيسبوك»).
-- post_kind 'post': anyone signed in, published at once like a discussion, text with an optional title, an optional picture
-- (preview_image) and an optional YouTube / Drive link (preview_video); a course link and highlights stay for lecturers' course previews.
-- Safe to run again.

alter table public.posts drop constraint if exists posts_post_kind_check;
alter table public.posts add constraint posts_post_kind_check check (post_kind in ('discussion','question','course_preview','announcement','post'));

-- the media check (014) lets a plain post through; the picture and video formats are still checked
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
  -- a plain post (052) may carry a picture or a video link from anyone; a course link and highlights stay for lecturers
  if not (new.post_kind = 'post' and new.course_id is null and cardinality(new.highlights) = 0)
    and not exists (select 1 from public.lecturers l where l.id = new.user_id and l.status = 'active')
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
revoke all on function ishrah_private.guard_lecturer_post() from public, anon, authenticated;

create or replace function ishrah_private.guard_post_kind() returns trigger
language plpgsql set search_path = '' as $$
declare
  has_preview boolean := new.course_id is not null or new.preview_video is not null or new.preview_image is not null or cardinality(new.highlights) > 0;
begin
  if new.room = 'qa' then new.post_kind := 'discussion'; return new; end if;
  -- A form from before post kinds can still submit a lecturer's media as a course preview.
  if new.post_kind = 'discussion' and has_preview then new.post_kind := 'course_preview'; end if;
  if new.post_kind = 'post' then
    -- a plain post may carry a picture or a video link, not a course link or course highlights
    if new.course_id is not null or cardinality(new.highlights) > 0 then raise exception 'lecturer_post_wrong_kind'; end if;
  elsif new.post_kind in ('course_preview','announcement') then
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
