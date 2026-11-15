-- Diagnostic counts only (the repository and its logs are public: no names, phones, codes or device numbers are printed).
-- Devices that had a subscription approved for them, and whether they open their book today.
with appr as (
  select r.dev, r.book, max(r.decided) as decided, max(r.code) filter (where r.code is not null) as rcode
    from obs_requests r where r.status = 'approved' group by r.dev, r.book),
st as (
  select a.*, obs_check(a.dev) ->> 'ok' as ok, obs_check(a.dev) ->> 'reason' as reason, obs_code_of(a.dev) as cur,
         exists (select 1 from obs_codes c where c.code = a.rcode) as rcode_exists
    from appr a)
select book, coalesce(reason, 'opens') as state, count(*) as devices,
       count(*) filter (where cur is null) as no_subscription_now,
       count(*) filter (where not rcode_exists) as approved_code_gone,
       count(*) filter (where decided > now() - interval '31 days') as approved_last_31_days
  from st group by 1, 2 order by 1, 2;

-- subscriptions with no device at all, by book and whether active
select book, (active and (expires is null or expires > now())) as live, count(*) as subscriptions_without_device
  from obs_codes c
 where phone_dev is null and pc_dev is null and not exists (select 1 from obs_devices d where d.code = c.code)
   and coalesce(plan, '') <> 'old'
 group by 1, 2 order by 1, 2;

-- devices bound to more than one subscription (slot + extra) by book
select c.book, count(*) as devices_in_two_subscriptions from (
  select dev, count(distinct code) n from (
    select phone_dev dev, code from obs_codes where phone_dev is not null union all
    select pc_dev, code from obs_codes where pc_dev is not null union all
    select dev, code from obs_devices) x group by dev having count(distinct code) > 1) m
  join obs_codes c on c.code = obs_code_of(m.dev) group by 1;
