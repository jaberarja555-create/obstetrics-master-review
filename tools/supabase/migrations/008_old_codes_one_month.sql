-- Launch of the new app (owner, 11 Nov 2026): the old activation codes keep working for one month from today, then end.
-- Runs once (obs_migrations). Codes made by the new subscription flow have a plan and are not touched.
update obs_codes set expires = now() + interval '1 month', plan = 'old' where expires is null and plan is null;
