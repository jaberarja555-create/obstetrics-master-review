-- اشرح لي: course / lecture requests can go to a lecturer (owner, 18 Nov 2026: "in lecture requests, another lecturer than me as admin:
-- the request can't be forwarded to them; and the request should be able to name a specific lecturer or be general"). Safe to run again.
--  * tickets.lecturer_id: the lecturer the student chose, or the one the team forwarded the request to (empty = general: the team decides)
--  * that lecturer can read the request and its messages and answer it (ticket_msgs.lec = written by the lecturer); nobody else gains access
alter table tickets add column if not exists lecturer_id uuid references lecturers on delete set null;
alter table tickets add column if not exists lecturer_name text default '';
alter table ticket_msgs add column if not exists lec boolean default false;
create index if not exists tickets_lecturer on tickets (lecturer_id);

drop policy if exists r on tickets;
create policy r on tickets for select using (user_id = auth.uid() or lecturer_id = auth.uid()
  or (ish_do('tickets', 'view') and (ish_top() or dept = ish_dept() or assigned_to = auth.uid())));
drop policy if exists u on tickets;
create policy u on tickets for update using (user_id = auth.uid() or lecturer_id = auth.uid()
  or (ish_do('tickets', 'edit') and (ish_top() or dept = ish_dept() or assigned_to = auth.uid())));
drop policy if exists i on ticket_msgs;
create policy i on ticket_msgs for insert with check (user_id = auth.uid() and exists (select 1 from tickets t where t.id = ticket_id)
  and (not staff or ish_do('tickets', 'edit'))
  and (not coalesce(lec, false) or exists (select 1 from tickets t where t.id = ticket_id and t.lecturer_id = auth.uid())));

-- a lecturer (not a team member) who answers may change only the state of the conversation, never who it belongs to or where it goes
create or replace function ish_ticket_lec_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or ish_staff() or old.user_id = auth.uid() then return new; end if;
  if old.lecturer_id = auth.uid() then
    new.user_id := old.user_id; new.name := old.name; new.phone := old.phone; new.kind := old.kind; new.dept := old.dept; new.subject := old.subject;
    new.course_id := old.course_id; new.assigned_to := old.assigned_to; new.assigned_name := old.assigned_name;
    new.lecturer_id := old.lecturer_id; new.lecturer_name := old.lecturer_name;
  end if;
  return new;
end $$;
drop trigger if exists ish_ticket_lec_guard on tickets;
create trigger ish_ticket_lec_guard before update on tickets for each row execute function ish_ticket_lec_guard();
