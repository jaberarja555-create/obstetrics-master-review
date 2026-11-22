-- SMRA · 057: the platform moved to https://studentmasterreview.com (owner, 22 Nov 2026; ishrah/PLAN-one-platform.md stage 1).
-- Phone alerts are sent through the site's own /api/push, so its address changes. ishrahli.org redirects to the new address, but a
-- server-to-server POST must not depend on a redirect. Safe to run again.
begin;
update public.settings set value = 'https://studentmasterreview.com/api/push' where id = 'push_url';
insert into public.settings (id, value) values ('push_url', 'https://studentmasterreview.com/api/push') on conflict (id) do nothing;
commit;
