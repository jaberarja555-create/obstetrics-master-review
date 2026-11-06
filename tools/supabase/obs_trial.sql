-- Obstetrics Master Review: free trial (owner, 6 Nov 2026).
-- Run once in the Supabase SQL editor (project kgdmjeffeq...). The app calls obs_trial(p_dev) when a student taps
-- «النسخة التجريبية»: the first call records the device's start; the key is returned only within the trial window.
create table if not exists obs_trials (dev text primary key, started timestamptz not null default now());
alter table obs_trials enable row level security;   -- no direct access; only through the function below

create or replace function obs_trial(p_dev text) returns json
language plpgsql security definer set search_path = public as $$
declare v_start timestamptz; v_key text; v_hours int := 1;   -- trial length in hours (keep equal to trial_hours in licence-config.js)
begin
  if p_dev is null or p_dev !~ '^[0-9a-f]{20}$' then
    return json_build_object('ok', false, 'reason', 'dev');
  end if;
  insert into obs_trials (dev) values (p_dev) on conflict (dev) do nothing;
  select started into v_start from obs_trials where dev = p_dev;
  if now() > v_start + make_interval(hours => v_hours) then
    return json_build_object('ok', false, 'reason', 'ended', 'start', (extract(epoch from v_start) * 1000)::bigint);
  end if;
  select k into v_key from obs_secret limit 1;
  return json_build_object('ok', true, 'start', (extract(epoch from v_start) * 1000)::bigint, 'key', v_key);
end $$;

revoke all on function obs_trial(text) from public;
grant execute on function obs_trial(text) to anon, authenticated;
