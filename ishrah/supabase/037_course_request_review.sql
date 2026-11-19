-- Course requests wait for the team again (owner, 19 Nov 2026: "a student made this course request; it did not go through admin"):
-- 019_report_moderation.sql had made them publish at once. Now a new request from anyone who cannot approve course reviews is saved as
-- «pending» (not public); Control → Requests → Course requests approves («وافق وانشر») or rejects it, which already notifies the student and
-- the named lecturer. The team is alerted at once (035/036). Staff who can approve still publish directly.
begin;

alter table public.course_requests alter column status set default 'pending';
alter table public.course_requests alter column published_at drop default;

create or replace function ishrah_private.course_request_waits() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.ish_do('review','approve') then
    new.status := 'pending';
    new.published_at := null;
  elsif new.status = 'open' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;
revoke all on function ishrah_private.course_request_waits() from public, anon, authenticated;
drop trigger if exists ish_course_request_waits on public.course_requests;
create trigger ish_course_request_waits before insert on public.course_requests for each row execute function ishrah_private.course_request_waits();

notify pgrst, 'reload schema';
commit;
