-- Owner, 13 Nov 2026: "when added as the same person it has to become one student (one account), not two students with the same name".
-- Every subscription can carry a student id (sid); the admin shows all subscriptions with the same sid (or the same phone) as one student.
-- «Same person as…» gives every subscription of both cards one sid. Safe to run more than once.
alter table obs_codes add column if not exists sid text;
create index if not exists obs_codes_sid on obs_codes(sid);

create or replace function obs_admin_sid(p_codes text[], p_sid text) returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  if coalesce(p_sid, '') !~ '^[A-Za-z0-9_-]{6,40}$' then raise exception 'bad'; end if;
  update obs_codes set sid = p_sid where code = any(p_codes);
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function obs_admin_sid(text[], text) from public, anon;
grant execute on function obs_admin_sid(text[], text) to authenticated;
notify pgrst, 'reload schema';
