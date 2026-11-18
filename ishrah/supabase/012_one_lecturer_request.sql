-- اشرح لي: one open lecturer request per person (owner, 18 Nov 2026: "I accepted a request as lecturer, then found the request duplicated
-- again: both waiting and the lecturer accepted"). A person who sent the form twice (two devices, two tabs) had two rows; approving one left the
-- other waiting. Safe to run again.
-- 1. someone who is already an active lecturer has no waiting request
update lecturer_apps a set status = 'approved', decided_at = coalesce(a.decided_at, now())
where a.status in ('pending', 'changes') and exists (select 1 from lecturers l where l.id = a.user_id and l.status = 'active');
-- 2. several open requests of one person: the newest stays, the older ones are closed as duplicates
update lecturer_apps a set status = 'rejected', note = 'Duplicate request (the newest one is kept) · طلب مكرر (احتُفظ بالأحدث)', decided_at = now()
where a.status in ('pending', 'changes') and exists (select 1 from lecturer_apps b where b.user_id = a.user_id and b.status in ('pending', 'changes')
  and (b.created_at > a.created_at or (b.created_at = a.created_at and b.id > a.id)));
-- 3. from now on the database itself keeps one open request per person
create unique index if not exists lecturer_apps_one_open on lecturer_apps (user_id) where status in ('pending', 'changes');
-- 4. approving a lecturer closes any other open request of that person
create or replace function ish_lec_close_apps() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'active' then
    update lecturer_apps set status = 'approved', decided_at = coalesce(decided_at, now()) where user_id = new.id and status in ('pending', 'changes');
  end if;
  return new;
end $$;
drop trigger if exists ish_lec_close_apps on lecturers;
create trigger ish_lec_close_apps after insert or update of status on lecturers for each row execute function ish_lec_close_apps();
