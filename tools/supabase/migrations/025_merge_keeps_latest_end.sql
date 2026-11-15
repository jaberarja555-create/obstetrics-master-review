-- 025 · a merge never ends a student's subscription (owner, 15 Nov 2026: "I merged the student's subscriptions of the same book and the
-- student lost the subscription").
--
-- Why it happened: «Merge into one» (obs_admin_merge2) kept the subscription that already had the chosen plan and gave the result THAT
-- subscription's end date. When the student's old subscription had ended and a new request had been approved (a second subscription of the
-- same book, often from another device), the old one could be the one kept: the merged subscription took the old, past end date, the app
-- was told "expired" and locked the book.
--
-- 1. obs_admin_merge2: the result keeps the LATEST end date of the subscriptions being merged (a lifetime choice has no end date); only when
--    neither has an end date (both lifetime or old) does a chosen month or year start today.
-- 2. obs_admin_merge («Same person as…»): same rule written plainly (the later end date; lifetime when either is lifetime).
-- 3. Repair: a subscription whose end date has passed although a request approved for it (or merged into it) less than one plan period ago
--    gets the end date that request gave (approval date + its plan); a lifetime request makes it lifetime again. Only an end date that lies
--    BEFORE the approval is repaired (a merge did that); a subscription the owner ended later with «End now» is left alone. Only the number of
--    repaired subscriptions is printed.

create or replace function obs_admin_merge(p_from text, p_into text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a obs_codes; b obs_codes; used int; rk int; pl text; ex timestamptz;
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  select * into a from obs_codes where code = p_from for update;
  select * into b from obs_codes where code = p_into for update;
  if a.code is null or b.code is null or a.code = b.code then return jsonb_build_object('ok', false, 'reason', 'nocode'); end if;
  if coalesce(a.book, 'obs') <> coalesce(b.book, 'obs') then return jsonb_build_object('ok', false, 'reason', 'book'); end if;
  -- devices of the first subscription become extra devices of the second
  if a.phone_dev is not null then
    delete from obs_devices where dev = a.phone_dev;
    insert into obs_devices(dev, code, kind, label, last) values (a.phone_dev, b.code, 'phone', a.phone_label, a.phone_last);
  end if;
  if a.pc_dev is not null then
    delete from obs_devices where dev = a.pc_dev;
    insert into obs_devices(dev, code, kind, label, last) values (a.pc_dev, b.code, 'pc', a.pc_label, a.pc_last);
  end if;
  update obs_devices set code = b.code where code = a.code;
  update obs_codes set phone_dev = null, pc_dev = null where code = a.code;
  used := (case when b.phone_dev is not null then 1 else 0 end) + (case when b.pc_dev is not null then 1 else 0 end)
        + (select count(*) from obs_devices where code = b.code);
  -- the better plan: lifetime, then the later end date
  rk := greatest(case a.plan when 'life' then 3 when 'year' then 2 when 'month' then 1 else 0 end,
                 case b.plan when 'life' then 3 when 'year' then 2 when 'month' then 1 else 0 end);
  pl := case rk when 3 then 'life' when 2 then 'year' when 1 then 'month' else b.plan end;
  ex := case when pl = 'life' then null else greatest(a.expires, b.expires) end;   -- greatest() skips an empty end date
  update obs_codes set plan = pl, expires = ex,
      active = b.active or a.active,
      maxdev = least(10, greatest(coalesce(b.maxdev, 3), coalesce(a.maxdev, 0), used)),
      activated_at = coalesce(b.activated_at, a.activated_at)
    where code = b.code;
  if not exists (select 1 from obs_sync where code = b.code) then update obs_sync set code = b.code where code = a.code; end if;
  delete from obs_sync where code = a.code;
  update obs_requests set code = b.code where code = a.code;
  delete from obs_codes where code = a.code;
  return jsonb_build_object('ok', true, 'devices', used);
end $$;

create or replace function obs_admin_merge2(p_from text, p_into text, p_plan text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a obs_codes; b obs_codes; r jsonb; ex timestamptz;
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  if p_plan not in ('month', 'year', 'life') then raise exception 'plan'; end if;
  select * into a from obs_codes where code = p_from;
  select * into b from obs_codes where code = p_into;
  r := obs_admin_merge(p_from, p_into);
  if not coalesce((r ->> 'ok')::boolean, false) then return r; end if;
  -- the latest end date of the two (never an older, already-passed one); a fresh period only when neither had an end date
  ex := case when p_plan = 'life' then null
             when greatest(a.expires, b.expires) is not null then greatest(a.expires, b.expires)
             when p_plan = 'month' then now() + interval '1 month'
             else now() + interval '1 year' end;
  update obs_codes set plan = p_plan, expires = ex, active = true where code = p_into;
  return r;
end $$;
revoke all on function obs_admin_merge(text, text) from public, anon;
grant execute on function obs_admin_merge(text, text) to authenticated;
revoke all on function obs_admin_merge2(text, text, text) from public, anon;
grant execute on function obs_admin_merge2(text, text, text) to authenticated;

-- repair the subscriptions a merge has ended
do $$
declare n int;
begin
  with due as (
    select r.code,
           bool_or(r.plan = 'life') as life,
           max(r.decided + case r.plan when 'year' then interval '1 year' else interval '1 month' end) filter (where r.plan in ('month', 'year')) as till,
           max(r.decided) as last
      from obs_requests r
     where r.status = 'approved' and r.code is not null and r.decided is not null and r.plan in ('month', 'year', 'life')
     group by r.code),
  fix as (
    update obs_codes c
       set expires = case when d.life then null else d.till end,
           plan = case when d.life then 'life' else c.plan end
      from due d
     where c.code = d.code and c.expires is not null and c.expires <= now()
       and c.expires < d.last          -- the end date lies BEFORE the approval: only a merge does that ("end now" is later than the approval)
       and (d.life or d.till > now())
    returning c.code)
  select count(*) into n from fix;
  raise notice 'subscriptions given back their approved end date: %', n;
end $$;

notify pgrst, 'reload schema';
