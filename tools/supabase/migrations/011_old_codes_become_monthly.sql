-- Owner, 13 Nov 2026: "I don't want to see old codes anymore" (shift every old code to a new-style subscription, starting with 1 month).
-- Written to be run more than once safely.

-- 1. Every old code a student has already activated (any book) becomes a Monthly subscription ending one month from now, with
--    3 devices. Its devices, key and synced notes stay; it shows under Students in the admin.
update obs_codes set plan = 'month', expires = now() + interval '1 month', maxdev = greatest(coalesce(maxdev, 2), 3)
where active and activated_at is not null and coalesce(plan, 'old') = 'old';

-- 2. An old code that is activated later (a student who bought one and opens the app now, or a Surgery / Pediatrics device joining
--    with its old code) becomes a Monthly subscription from that moment too, so no old code is ever left in use.
create or replace function obs_old_to_month_on_use() returns trigger
language plpgsql set search_path = public as $$
begin
  if old.activated_at is null and new.activated_at is not null and coalesce(new.plan, 'old') = 'old' then
    new.plan := 'month';
    new.expires := now() + interval '1 month';
    new.maxdev := greatest(coalesce(new.maxdev, 2), 3);
  end if;
  return new;
end $$;
drop trigger if exists obs_old_to_month_on_use on obs_codes;
create trigger obs_old_to_month_on_use before update of activated_at on obs_codes
  for each row execute function obs_old_to_month_on_use();

notify pgrst, 'reload schema';
