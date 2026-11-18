-- اشرح لي: "Request changes" on a lecturer application (owner, 18 Nov 2026: "there must be another option like giving him feedback if he needs
-- to add something or adjust his request"). New status 'changes' with the team's note; the applicant edits and sends it again (back to
-- 'pending'). Safe to run again.

-- the applicant can edit the request while it is waiting or while changes are asked
drop policy if exists u on lecturer_apps;
create policy u on lecturer_apps for update using ((user_id = auth.uid() and status in ('pending', 'changes')) or ish_do('apps', 'approve'));

create or replace function ish_guard() returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  -- the server itself (service key, SQL editor, sign-up) and counts kept by other triggers are not limited here
  if auth.uid() is null or pg_trigger_depth() > 1 then return new; end if;
  if tg_table_name = 'profiles' then
    if not ish_do('team', 'edit') then
      new.team := old.team; new.dept := old.dept; new.manager_id := old.manager_id; new.approval := old.approval; new.mfa_required := old.mfa_required; new.team_status := old.team_status;
    end if;
    -- only the owner touches the owner and the general manager
    if not ish_owner() and (('owner' = any(new.team)) <> ('owner' = any(old.team)) or ('gm' = any(new.team)) <> ('gm' = any(old.team)) or 'owner' = any(old.team) or ('gm' = any(old.team) and old.id <> auth.uid())) then
      if 'owner' = any(old.team) or 'gm' = any(old.team) or 'owner' = any(new.team) or 'gm' = any(new.team) then
        new.team := old.team; new.dept := old.dept; new.manager_id := old.manager_id; new.approval := old.approval; new.mfa_required := old.mfa_required; new.team_status := old.team_status;
      end if;
    end if;
    if new.id = auth.uid() and 'owner' = any(old.team) then new.team := array(select distinct unnest(new.team || array['owner'])); new.team_status := 'active'; end if;
    if not ish_do('students', 'edit') then new.status := old.status; end if;
    if new.mfa_on and not old.mfa_on and not exists (select 1 from auth.mfa_factors f where f.user_id = new.id and f.status = 'verified') then new.mfa_on := old.mfa_on; end if;
  elsif tg_table_name = 'lecturers' then
    if not (ish_do('payout', 'edit') or ish_do('lecturers', 'edit')) then new.share := old.share; end if;
    if not ish_do('lecturers', 'edit') then new.status := old.status; end if;
  elsif tg_table_name = 'courses' then
    if not ish_do('review', 'approve') then
      new.lecturer_id := old.lecturer_id; new.n_students := old.n_students; new.rating := old.rating; new.n_reviews := old.n_reviews;
      if new.status is distinct from old.status and not (new.status in ('draft', 'review') and old.status in ('draft', 'review', 'rejected')) then new.status := old.status; end if;
      if new.status = 'review' then new.review_note := old.review_note; end if;
    end if;
  elsif tg_table_name = 'lecturer_apps' then
    if not ish_do('apps', 'approve') then
      -- the applicant may send the request back after the team asked for changes (changes -> pending); nothing else
      if not (old.status = 'changes' and new.status = 'pending' and old.user_id = auth.uid()) then new.status := old.status; end if;
      new.note := old.note; new.user_id := old.user_id;
    end if;
  end if;
  return new;
end $$;
