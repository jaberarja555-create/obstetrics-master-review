-- Owner, 13 Nov 2026: "the admin page can be controlled by 2 persons". The owner's own check is kept as obs_is_owner(); obs_is_admin()
-- is now the owner OR an email the owner added in the admin page (table obs_admins; no email is written in this public repository).
-- Only the owner adds or removes helpers. Safe to run more than once.
create table if not exists obs_admins (email text primary key, added timestamptz not null default now());
alter table obs_admins enable row level security;
revoke all on obs_admins from anon, authenticated;

do $$ begin
  if not exists (select 1 from pg_proc where proname = 'obs_is_owner') then
    alter function obs_is_admin() rename to obs_is_owner;
  end if;
end $$;

create or replace function obs_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select obs_is_owner() or exists (select 1 from obs_admins where email = lower(coalesce(auth.jwt() ->> 'email', '')) and email <> '') $$;
grant execute on function obs_is_admin() to authenticated;

create or replace function obs_admin_admins() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  return jsonb_build_object('owner', obs_is_owner(),
    'list', coalesce((select jsonb_agg(jsonb_build_object('email', email, 'added', added) order by added) from obs_admins), '[]'::jsonb));
end $$;

create or replace function obs_admin_admin_set(p_email text, p_add boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare e text := lower(trim(coalesce(p_email, '')));
begin
  if not obs_is_owner() then raise exception 'not_owner'; end if;
  if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  if p_add then insert into obs_admins(email) values (e) on conflict do nothing; else delete from obs_admins where email = e; end if;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function obs_admin_admins(), obs_admin_admin_set(text, boolean) from public, anon;
grant execute on function obs_admin_admins(), obs_admin_admin_set(text, boolean) to authenticated;
notify pgrst, 'reload schema';
