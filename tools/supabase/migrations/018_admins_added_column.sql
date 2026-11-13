-- 016 found an obs_admins table already in the database (without the "added" column), so the admin page could not list the people.
-- Add the column, and never let a signed-in person remove their own email (so nobody locks themself out). Safe to run more than once.
alter table obs_admins add column if not exists added timestamptz default now();

create or replace function obs_admin_admins() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  return jsonb_build_object('owner', obs_is_owner(), 'me', me,
    'list', coalesce((select jsonb_agg(jsonb_build_object('email', email, 'added', added) order by added nulls first, email) from obs_admins), '[]'::jsonb));
end $$;

create or replace function obs_admin_admin_set(p_email text, p_add boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare e text := lower(trim(coalesce(p_email, '')));
begin
  if not obs_is_owner() then raise exception 'not_owner'; end if;
  if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  if p_add then
    if not exists (select 1 from obs_admins where lower(email) = e) then insert into obs_admins(email) values (e); end if;
  else
    if e = lower(coalesce(auth.jwt() ->> 'email', '')) then return jsonb_build_object('ok', false, 'reason', 'self'); end if;
    delete from obs_admins where lower(email) = e;
  end if;
  return jsonb_build_object('ok', true);
end $$;
grant execute on function obs_admin_admins(), obs_admin_admin_set(text, boolean) to authenticated;
notify pgrst, 'reload schema';
