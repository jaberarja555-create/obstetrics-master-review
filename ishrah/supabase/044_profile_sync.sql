-- اشرح لي · 044: the writer's current name and picture on everything they wrote (owner, 20 Nov 2026: "I changed my profile picture but
-- it didn't appear in the comment area"). Comments and posts keep a copy of the writer's name and picture; book and request comments
-- had no picture at all. Now:
--   * course_request_comments and library_comments get author_photo;
--   * a new post, comment or request takes the writer's name and picture from their profile (also stops writing under another name);
--   * changing the name or picture in the profile updates every post, comment and request they wrote;
--   * existing rows are filled once from the profiles.
-- Safe to run again.

alter table public.course_request_comments add column if not exists author_photo text;
alter table public.library_comments add column if not exists author_photo text;

create or replace function ishrah_private.fill_author() returns trigger
language plpgsql security definer set search_path = '' as $$
declare p record;
begin
  if new.user_id is null then return new; end if;
  select name, photo into p from public.profiles where id = new.user_id;
  if not found then return new; end if;
  if tg_table_name in ('posts', 'replies') then
    new.name := coalesce(nullif(p.name, ''), new.name); new.photo := coalesce(p.photo, new.photo);
  elsif tg_table_name in ('course_request_comments', 'library_comments') then
    new.author_name := coalesce(nullif(p.name, ''), new.author_name); new.author_photo := coalesce(p.photo, new.author_photo);
  elsif tg_table_name = 'course_requests' then
    new.author_name := coalesce(nullif(p.name, ''), new.author_name);
  end if;
  return new;
end $$;
revoke all on function ishrah_private.fill_author() from public, anon, authenticated;

drop trigger if exists ish_fill_author on public.posts;
create trigger ish_fill_author before insert on public.posts for each row execute function ishrah_private.fill_author();
drop trigger if exists ish_fill_author on public.replies;
create trigger ish_fill_author before insert on public.replies for each row execute function ishrah_private.fill_author();
drop trigger if exists ish_fill_author on public.course_request_comments;
create trigger ish_fill_author before insert on public.course_request_comments for each row execute function ishrah_private.fill_author();
drop trigger if exists ish_fill_author on public.library_comments;
create trigger ish_fill_author before insert on public.library_comments for each row execute function ishrah_private.fill_author();
drop trigger if exists ish_fill_author on public.course_requests;
create trigger ish_fill_author before insert on public.course_requests for each row execute function ishrah_private.fill_author();

create or replace function ishrah_private.profile_sync() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if row(new.name, new.photo) is not distinct from row(old.name, old.photo) then return new; end if;
  update public.posts set name = new.name, photo = new.photo where user_id = new.id and row(name, photo) is distinct from row(new.name, new.photo);
  update public.replies set name = new.name, photo = new.photo where user_id = new.id and row(name, photo) is distinct from row(new.name, new.photo);
  update public.course_request_comments set author_name = new.name, author_photo = new.photo
    where user_id = new.id and row(author_name, author_photo) is distinct from row(new.name, new.photo);
  update public.library_comments set author_name = new.name, author_photo = new.photo
    where user_id = new.id and row(author_name, author_photo) is distinct from row(new.name, new.photo);
  update public.course_requests set author_name = new.name where user_id = new.id and author_name is distinct from new.name;
  return new;
end $$;
revoke all on function ishrah_private.profile_sync() from public, anon, authenticated;
drop trigger if exists ish_profile_sync on public.profiles;
create trigger ish_profile_sync after update of name, photo on public.profiles for each row execute function ishrah_private.profile_sync();

-- fill what exists now
update public.replies r set photo = p.photo, name = coalesce(nullif(p.name, ''), r.name) from public.profiles p
  where p.id = r.user_id and row(r.name, r.photo) is distinct from row(coalesce(nullif(p.name, ''), r.name), p.photo);
update public.posts r set photo = p.photo, name = coalesce(nullif(p.name, ''), r.name) from public.profiles p
  where p.id = r.user_id and row(r.name, r.photo) is distinct from row(coalesce(nullif(p.name, ''), r.name), p.photo);
update public.course_request_comments r set author_photo = p.photo, author_name = coalesce(nullif(p.name, ''), r.author_name) from public.profiles p
  where p.id = r.user_id and row(r.author_name, r.author_photo) is distinct from row(coalesce(nullif(p.name, ''), r.author_name), p.photo);
update public.library_comments r set author_photo = p.photo, author_name = coalesce(nullif(p.name, ''), r.author_name) from public.profiles p
  where p.id = r.user_id and row(r.author_name, r.author_photo) is distinct from row(coalesce(nullif(p.name, ''), r.author_name), p.photo);
