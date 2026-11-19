-- Publish new posts immediately. Existing review decisions and queues remain intact.
create or replace function ishrah_private.guard_question_review() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.review_note := null;
    if new.room = 'qa' then
      select c.lecturer_id into new.lecturer_id from public.courses c
        where c.id = new.course_id and c.status = 'published';
      if not found or not exists (
        select 1 from public.lessons l where l.id = new.lesson_id and l.course_id = new.course_id
      ) then raise exception 'question_course_invalid'; end if;
    end if;
    new.status := 'open';
  elsif current_user in ('anon','authenticated') and (
    old.status in ('pending','rejected') or new.status in ('pending','rejected')
    or old.review_note is distinct from new.review_note
    or ((old.post_kind = 'question' or new.post_kind = 'question' or old.room = 'qa' or new.room = 'qa')
      and row(old.post_kind,old.room,old.user_id,old.course_id,old.lesson_id)
        is distinct from row(new.post_kind,new.room,new.user_id,new.course_id,new.lesson_id))
  ) then raise exception 'question_review_required';
  end if;
  return new;
end $$;

alter table public.course_requests alter column status set default 'open';
alter table public.course_requests alter column published_at set default now();

create or replace function ishrah_private.notify_new_course_request() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'open' and new.lecturer_id is not null then
    insert into public.notices (user_id,title,title_en,body,link) values
      (new.lecturer_id,'طلب تدريس موجّه إليك','A course request names you',new.title,'#studio-course-request/' || new.id);
  end if;
  return new;
end $$;
revoke all on function ishrah_private.notify_new_course_request() from public, anon, authenticated;
drop trigger if exists ish_notify_new_course_request on public.course_requests;
create trigger ish_notify_new_course_request after insert on public.course_requests
for each row execute function ishrah_private.notify_new_course_request();

drop policy if exists i on public.reports;
create policy i on public.reports for insert to authenticated with check (
  user_id = (select auth.uid()) and status = 'open' and handled_by is null
  and char_length(trim(reason)) between 1 and 2000
  and case kind
    when 'post' then exists (select 1 from public.posts p where p.id = target and p.status = 'open')
    when 'reply' then exists (select 1 from public.replies r join public.posts p on p.id = r.post_id where r.id = target and r.status = 'open' and p.status = 'open')
    when 'review' then exists (select 1 from public.reviews r where r.id = target)
    when 'request' then exists (select 1 from public.course_requests r where r.id = target and r.status in ('open','closed'))
    when 'request_comment' then exists (select 1 from public.course_request_comments c where c.id = target)
    when 'news' then exists (select 1 from public.news n where n.id = target and n.status = 'published')
    when 'announcement' then exists (select 1 from public.notices n where n.id = target and n.user_id is null)
    else false
  end
);

create or replace function public.ish_moderate_feed_report(report_id uuid, remove_content boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  entry public.reports;
begin
  if not coalesce(public.ish_do('community','edit'), false) then raise exception 'moderation_permission'; end if;
  select * into entry from public.reports where id = report_id and status = 'open' for update;
  if not found then return; end if;
  if remove_content then
    case entry.kind
      when 'post' then update public.posts set status = 'removed' where id = entry.target and status = 'open';
      when 'reply' then update public.replies set status = 'removed' where id = entry.target and status = 'open';
      when 'request_comment' then delete from public.course_request_comments where id = entry.target;
      when 'news' then update public.news set status = 'removed' where id = entry.target and status = 'published';
      when 'announcement' then delete from public.notices where id = entry.target and user_id is null;
      when 'request' then
        perform 1 from public.course_requests where id = entry.target for update;
        if exists (select 1 from public.course_requests where id = entry.target and reserved_count > 0) then
          raise exception 'request_has_payments';
        end if;
        update public.course_requests set status = 'deleted' where id = entry.target and status in ('open','closed');
      else raise exception 'moderation_kind';
    end case;
    insert into public.audit (user_id,action,target) values (auth.uid(),'remove reported ' || entry.kind, entry.target::text);
  end if;
  update public.reports set status = 'resolved', handled_by = auth.uid() where id = entry.id;
end $$;
revoke all on function public.ish_moderate_feed_report(uuid,boolean) from public, anon, authenticated;
grant execute on function public.ish_moderate_feed_report(uuid,boolean) to authenticated;
