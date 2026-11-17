-- اشرح لي: the organisation in the database (owner, 17 Nov 2026: "permissions must be applied in the database and the backend, not only by
-- hiding buttons; RBAC + permissions with audit logs and two-factor authentication for admin accounts; the general manager cannot change
-- the owner's permissions or go beyond the authority given to him"). Run after 001_schema.sql. Safe to run again.

-- ---------------------------------------------------------------- staff columns, action matrix, new tables
alter table profiles add column if not exists dept text default '';
alter table profiles add column if not exists manager_id uuid references profiles on delete set null;
alter table profiles add column if not exists approval text default 'dept';          -- none · dept · full
alter table profiles add column if not exists mfa_required boolean default false;
alter table profiles add column if not exists mfa_on boolean default false;
alter table profiles add column if not exists team_status text default 'active';     -- active · suspended
alter table profiles add column if not exists last_seen timestamptz;
alter table role_perms add column if not exists acts text[] default array['view','add','edit','delete','approve'];
alter table role_perms add column if not exists id text;
update role_perms set id = role || ':' || perm where id is null;
alter table enrollments drop constraint if exists enrollments_status_check;

create table if not exists tickets (id uuid primary key default gen_random_uuid(), user_id uuid references profiles on delete set null, name text, phone text, kind text, dept text, subject text, course_id uuid,
  status text default 'open', last_by text, assigned_to uuid references profiles on delete set null, assigned_name text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists ticket_msgs (id uuid primary key default gen_random_uuid(), ticket_id uuid references tickets on delete cascade, user_id uuid references profiles on delete set null, name text,
  staff boolean default false, body text, created_at timestamptz default now());
create table if not exists tasks (id uuid primary key default gen_random_uuid(), title text, details text, dept text, assigned_to uuid references profiles on delete cascade, assigned_name text,
  assigned_by uuid references profiles on delete set null, by_name text, due date, priority text default 'normal', status text default 'todo', link text, done_at timestamptz, created_at timestamptz default now());
create table if not exists invites (id uuid primary key default gen_random_uuid(), name text, phone text, email text, role text, extras text[] default '{}', dept text, manager_id uuid, approval text default 'dept',
  mfa_required boolean default true, team_status text default 'active', status text default 'pending', by uuid, created_at timestamptz default now());

-- ---------------------------------------------------------------- the permission check with actions, 2FA and suspension
-- ish_do(section, action): the caller's roles allow this action on this section (owner: everything); the account must be active and,
-- when it has (or must have) a second factor, the session must have passed it (aal2). ish_can(section) = ish_do(section, 'view').
create or replace function ish_do(p text, act text) returns boolean language plpgsql stable security definer set search_path = public, auth as $$
declare m profiles; aal text := coalesce(auth.jwt() ->> 'aal', 'aal1'); has2 boolean;
begin
  select * into m from profiles where id = auth.uid(); if m.id is null or coalesce(array_length(m.team, 1), 0) = 0 then return false; end if;
  if m.status = 'blocked' or coalesce(m.team_status, 'active') <> 'active' then return false; end if;
  select exists (select 1 from auth.mfa_factors f where f.user_id = m.id and f.status = 'verified') into has2;
  if (has2 or coalesce(m.mfa_required, false)) and aal <> 'aal2' then return false; end if;
  if 'owner' = any(m.team) then return true; end if;
  if act = 'approve' and coalesce(m.approval, 'dept') = 'none' then return false; end if;
  return exists (select 1 from unnest(m.team) r where r = 'p:' || p || ':' || act or (r = 'p:' || p and act in ('view', 'add', 'edit'))
    or exists (select 1 from role_perms rp where rp.role = r and rp.perm = p and act = any(coalesce(rp.acts, array['view','add','edit','delete','approve']))));
end $$;
create or replace function ish_owner() returns boolean language sql stable security definer set search_path = public as $$ select 'owner' = any(ish_team()) and ish_do('dash', 'view') $$;
create or replace function ish_can(p text) returns boolean language sql stable security definer set search_path = public as $$ select ish_do(p, 'view') $$;
create or replace function ish_top() returns boolean language sql stable security definer set search_path = public as $$ select ish_owner() or ('gm' = any(ish_team()) and ish_do('dash', 'view')) $$;
create or replace function ish_dept() returns text language sql stable security definer set search_path = public as $$
  select coalesce(nullif(dept, ''), (select r from unnest(team) r where r in ('academic','finance','content','community','support','tech') limit 1), '') from profiles where id = auth.uid() $$;
-- the default action matrix (the owner changes it in the control app)
insert into role_perms (role, perm, acts, id) select r, p, a, r || ':' || p from (values
  ('gm','tickets',array['view','add','edit','delete','approve']),('gm','tasks',array['view','add','edit','delete','approve']),
  ('academic','tickets',array['view','add','edit','delete','approve']),('academic','tasks',array['view','add','edit','delete','approve']),
  ('finance','tickets',array['view','add','edit','delete','approve']),('finance','tasks',array['view','add','edit','delete','approve']),('finance','lecturers',array['view','edit']),
  ('content','tickets',array['view','add','edit','delete','approve']),('content','tasks',array['view','add','edit','delete','approve']),
  ('community','tickets',array['view','add','edit','delete','approve']),('community','tasks',array['view','add','edit','delete','approve']),
  ('support','tickets',array['view','add','edit','delete','approve']),('support','tasks',array['view','add','edit','delete','approve']),
  ('tech','tickets',array['view','add','edit','delete','approve']),('tech','tasks',array['view','add','edit','delete','approve']),
  ('staff','tasks',array['view','edit'])) v(r, p, a) on conflict (role, perm) do update set acts = excluded.acts;
update role_perms set acts = array['view'] where role = 'staff' and perm = 'dash';

-- ---------------------------------------------------------------- protected columns (who may give roles, and how far)
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
    if not ish_do('apps', 'approve') then new.status := old.status; new.note := old.note; new.user_id := old.user_id; end if;
  end if;
  return new;
end $$;
-- an invitation can give the owner / general manager role only when the owner writes it
create or replace function ish_invite_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;   -- the server itself
  if (new.role in ('owner', 'gm')) and not ish_owner() then raise exception 'only the owner can appoint this role'; end if;
  new.by := auth.uid(); return new;
end $$;
drop trigger if exists ish_invite_guard on invites; create trigger ish_invite_guard before insert or update on invites for each row execute function ish_invite_guard();
-- a new account takes its invitation (same phone or email): role, department, manager, approval level, 2FA
create or replace function ish_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'); first boolean; ph text := coalesce(m->>'phone', ''); em text := lower(case when new.email like '%@phone.ishrah.app' then coalesce(m->>'contact_email', '') else coalesce(new.email, '') end); v invites;
begin
  select not exists (select 1 from profiles where 'owner' = any(team)) into first;
  insert into profiles (id, name, phone, email, photo, team) values (new.id, coalesce(nullif(m->>'name', ''), nullif(m->>'full_name', ''), split_part(new.email, '@', 1)), ph, em, coalesce(m->>'avatar_url', ''),
    case when first then array['owner'] else '{}'::text[] end) on conflict (id) do nothing;
  select * into v from invites where status = 'pending' and ((ph <> '' and phone = ph) or (em <> '' and email = em)) order by created_at desc limit 1;
  if v.id is not null and not first then
    update profiles set team = array[v.role] || coalesce(v.extras, '{}'), dept = coalesce(v.dept, ''), manager_id = v.manager_id, approval = v.approval, mfa_required = v.mfa_required, team_status = v.team_status where id = new.id;
    update invites set status = 'used' where id = v.id;
    insert into audit (user_id, name, action, target) values (new.id, coalesce(m->>'name', ''), 'joined the team by invitation', v.role);
  end if;
  return new;
end $$;
-- forgot password without signing in: one message to support
create or replace function ish_reset_request(p_name text, p_phone text, p_subject text, p_body text) returns void language plpgsql security definer set search_path = public as $$
declare t uuid; d text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
begin
  if length(d) < 9 or length(coalesce(p_name, '')) < 2 then raise exception 'name and phone needed'; end if;
  if (select count(*) from tickets where phone = d and kind = 'password' and created_at > now() - interval '1 hour') >= 3 then raise exception 'too many requests'; end if;
  insert into tickets (name, phone, kind, dept, subject, status, last_by) values (left(p_name, 80), d, 'password', 'support', left(coalesce(p_subject, 'Password'), 140), 'open', 'user') returning id into t;
  insert into ticket_msgs (ticket_id, name, staff, body) values (t, left(p_name, 80), false, left(coalesce(p_body, ''), 4000));
end $$;
grant execute on function ish_reset_request(text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------- policies: actions instead of plain access
do $$ declare t text; begin foreach t in array array['tickets', 'ticket_msgs', 'tasks', 'invites'] loop
  execute format('alter table %I enable row level security', t);
  execute (select coalesce(string_agg(format('drop policy if exists %I on %I;', policyname, t), ' '), 'select 1') from pg_policies where tablename = t and schemaname = 'public'); end loop; end $$;
create policy r on tickets for select using (user_id = auth.uid() or (ish_do('tickets', 'view') and (ish_top() or dept = ish_dept() or assigned_to = auth.uid())));
create policy i on tickets for insert with check (user_id = auth.uid());
create policy u on tickets for update using (user_id = auth.uid() or (ish_do('tickets', 'edit') and (ish_top() or dept = ish_dept() or assigned_to = auth.uid())));
create policy r on ticket_msgs for select using (exists (select 1 from tickets t where t.id = ticket_id));
create policy i on ticket_msgs for insert with check (user_id = auth.uid() and exists (select 1 from tickets t where t.id = ticket_id) and (not staff or ish_do('tickets', 'edit')));
create policy r on tasks for select using (assigned_to = auth.uid() or assigned_by = auth.uid() or (ish_do('tasks', 'view') and (ish_top() or dept = ish_dept())));
create policy i on tasks for insert with check (assigned_by = auth.uid() and ish_do('tasks', 'add'));
create policy u on tasks for update using (assigned_to = auth.uid() or assigned_by = auth.uid() or ish_top());
create policy d on tasks for delete using (assigned_by = auth.uid() or ish_top());
create policy r on invites for select using (ish_do('team', 'view'));
create policy i on invites for insert with check (ish_do('team', 'add'));
create policy d on invites for delete using (ish_do('team', 'delete'));
drop policy if exists r on role_perms; drop policy if exists w on role_perms;
create policy r on role_perms for select using (true);
create policy w on role_perms for all using (ish_owner() or (ish_do('team', 'edit') and role not in ('owner', 'gm'))) with check (ish_owner() or (ish_do('team', 'edit') and role not in ('owner', 'gm')));
drop policy if exists u on profiles; create policy u on profiles for update using (id = auth.uid() or ish_do('team', 'edit') or ish_do('students', 'edit'));
drop policy if exists w on settings; create policy w on settings for all using (ish_do('settings', 'edit')) with check (ish_do('settings', 'edit'));
drop policy if exists w on categories; create policy w on categories for all using (ish_do('cats', 'edit')) with check (ish_do('cats', 'edit'));
drop policy if exists w on subjects; create policy w on subjects for all using (ish_do('cats', 'edit')) with check (ish_do('cats', 'edit'));
drop policy if exists u on lecturer_apps; create policy u on lecturer_apps for update using ((user_id = auth.uid() and status = 'pending') or ish_do('apps', 'approve'));
drop policy if exists i on lecturers; create policy i on lecturers for insert with check (ish_do('apps', 'approve'));
drop policy if exists u on lecturers; create policy u on lecturers for update using (id = auth.uid() or ish_do('lecturers', 'edit') or ish_do('payout', 'edit'));
drop policy if exists u on courses; create policy u on courses for update using (lecturer_id = auth.uid() or ish_do('review', 'approve'));
drop policy if exists d on courses; create policy d on courses for delete using ((lecturer_id = auth.uid() and n_students = 0) or ish_do('review', 'delete'));
drop policy if exists u on enrollments; create policy u on enrollments for update using (ish_do('pay', 'approve') or ish_do('students', 'edit'));
drop policy if exists i on enrollments; create policy i on enrollments for insert with check (user_id = auth.uid() or ish_do('students', 'add') or ish_do('pay', 'add'));
drop policy if exists u on events; create policy u on events for update using (lecturer_id = auth.uid() or ish_do('events', 'edit'));
drop policy if exists d on events; create policy d on events for delete using (lecturer_id = auth.uid() or ish_do('events', 'delete'));
drop policy if exists u on posts; create policy u on posts for update using (ish_do('community', 'edit'));
drop policy if exists u on replies; create policy u on replies for update using (ish_do('community', 'edit'));
drop policy if exists u on reports; create policy u on reports for update using (ish_do('community', 'edit'));
drop policy if exists d on reviews; create policy d on reviews for delete using (user_id = auth.uid() or ish_do('community', 'delete'));
drop policy if exists u on payouts; create policy u on payouts for update using (ish_do('payout', 'approve'));
drop policy if exists d on payouts; create policy d on payouts for delete using (ish_do('payout', 'delete'));
drop policy if exists i on notices; create policy i on notices for insert with check ((user_id is not null and auth.uid() is not null) or ish_do('notify', 'add'));
drop policy if exists d on notices; create policy d on notices for delete using (ish_do('notify', 'delete'));
drop policy if exists u on files; create policy u on files for update using (ish_do('library', 'approve'));
drop policy if exists u on requests; create policy u on requests for update using (ish_do('requests', 'edit'));
drop policy if exists w on paths; create policy w on paths for all using (ish_do('paths', 'edit')) with check (ish_do('paths', 'edit'));
-- the activity log can be written but never changed or deleted by anyone
drop policy if exists i on audit; create policy i on audit for insert with check (user_id = auth.uid());
drop policy if exists r on audit; create policy r on audit for select using (ish_do('audit', 'view') or ish_top() or user_id = auth.uid());
