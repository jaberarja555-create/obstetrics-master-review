-- Owner, 13 Nov 2026: "when joining a person as one, everything should be added, even devices, not just the name". When two cards of one
-- student both have the same book, the second subscription is merged into the first: its devices move over (the device count grows when
-- needed), the longer plan and later end date are kept, its synced notes are kept when the first has none (otherwise each device uploads
-- its own notes again at its next sync, where they are merged), and it is then removed. Safe to run more than once.
create or replace function obs_admin_merge(p_from text, p_into text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a obs_codes; b obs_codes; used int; rk int; pl text;
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
  rk := greatest(case a.plan when 'life' then 3 when 'year' then 2 when 'month' then 1 else 0 end, case b.plan when 'life' then 3 when 'year' then 2 when 'month' then 1 else 0 end);
  pl := case rk when 3 then 'life' when 2 then 'year' when 1 then 'month' else b.plan end;
  update obs_codes set plan = pl,
      expires = case when pl = 'life' or (a.expires is null and a.plan is not null and a.plan <> 'old') or b.expires is null then
                  case when pl = 'life' then null else coalesce(greatest(a.expires, b.expires), b.expires) end
                else greatest(a.expires, b.expires) end,
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
revoke all on function obs_admin_merge(text, text) from public, anon;
grant execute on function obs_admin_merge(text, text) to authenticated;
notify pgrst, 'reload schema';
