-- اشرح لي: real email accounts (owner, 18 Nov 2026: "the email must be a real connection with the email, with a password").
-- An email account is made only through a 6-digit code sent to the inbox (signInWithOtp → verifyOtp), then the password is set.
-- • Keep Authentication → Email → "Confirm email" ON, so an account made with a password straight away cannot sign in before its email is confirmed.
-- • Team invitations by email, and the first account becoming the owner, wait until the email is confirmed.
-- Phone accounts (<phone>@phone.ishrah.app) and Google accounts work as before. Safe to run again.

-- give a confirmed account its place: the very first account is the owner; otherwise a pending invitation by phone or email
create or replace function ish_join(p_id uuid, p_email text, p_phone text, p_name text) returns void language plpgsql security definer set search_path = public as $$
declare v invites; first boolean;
begin
  select not exists (select 1 from profiles where 'owner' = any(team)) into first;
  if first then update profiles set team = array['owner'] where id = p_id; return; end if;
  if exists (select 1 from profiles where id = p_id and coalesce(array_length(team, 1), 0) > 0) then return; end if;
  select * into v from invites where status = 'pending' and ((coalesce(p_phone, '') <> '' and phone = p_phone) or (coalesce(p_email, '') <> '' and email = p_email))
    order by created_at desc limit 1;
  if v.id is null then return; end if;
  update profiles set team = array[v.role] || coalesce(v.extras, '{}'), dept = coalesce(v.dept, ''), manager_id = v.manager_id, approval = v.approval,
    mfa_required = v.mfa_required, team_status = v.team_status where id = p_id;
  update invites set status = 'used' where id = v.id;
  insert into audit (user_id, name, action, target) values (p_id, coalesce(p_name, ''), 'joined the team by invitation', v.role);
end $$;
revoke execute on function ish_join(uuid, text, text, text) from public;

create or replace function ish_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'); ph text := coalesce(m->>'phone', '');
  phoneacc boolean := coalesce(new.email, '') like '%@phone.ishrah.app';
  em text := case when phoneacc then '' else lower(coalesce(new.email, '')) end;
begin
  -- (18 Nov 2026) no password check here: Supabase gives every account made by the emailed code a random password, so the check
  -- refused the real sign-ups ("Database error saving new user"). An account made with signUp(email, password) is safe anyway:
  -- with "Confirm email" on it cannot sign in, and gets no place (ish_join), until its email is confirmed.
  insert into profiles (id, name, phone, email, photo, team) values (new.id, coalesce(nullif(m->>'name', ''), nullif(m->>'full_name', ''), split_part(coalesce(new.email, ''), '@', 1)),
    ph, em, coalesce(m->>'avatar_url', ''), '{}'::text[]) on conflict (id) do nothing;
  if phoneacc or new.email_confirmed_at is not null then perform ish_join(new.id, em, ph, coalesce(m->>'name', m->>'full_name', '')); end if;
  return new;
end $$;
drop trigger if exists ish_new_user on auth.users;
create trigger ish_new_user after insert on auth.users for each row execute function ish_new_user();

-- when the code is accepted (email confirmed), the account gets its place
create or replace function ish_user_confirmed() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null and coalesce(new.email, '') not like '%@phone.ishrah.app' then
    update profiles set email = lower(new.email) where id = new.id and coalesce(email, '') = '';
    perform ish_join(new.id, lower(new.email), '', coalesce(new.raw_user_meta_data->>'name', ''));
  end if;
  return new;
end $$;
drop trigger if exists ish_user_confirmed on auth.users;
create trigger ish_user_confirmed after update of email_confirmed_at on auth.users for each row execute function ish_user_confirmed();
