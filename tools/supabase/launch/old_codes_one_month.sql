-- RUN ONCE ON THE DAY THE NEW APP GOES LIVE (owner, 10 Nov 2026): the old activation codes keep working for one month, then end.
-- Not in migrations/ on purpose, so it does not run by itself. When the redesign is merged to main: copy this file to
-- tools/supabase/migrations/ with the next number and push.
update obs_codes set expires = now() + interval '1 month', plan = 'old' where expires is null and plan is null;
