-- Owner, 13 Nov 2026: a student had two Obstetrics subscriptions (Lifetime and Monthly) and wanted them merged into one Monthly.
-- obs_admin_merge2 merges like obs_admin_merge (devices, notes) and then gives the result the plan the owner chose: the end date of the
-- subscription that already had that plan is kept; a plan neither had starts today. Safe to run more than once.
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
  ex := case when p_plan = 'life' then null
             when b.plan = p_plan and b.expires is not null then b.expires
             when a.plan = p_plan and a.expires is not null then a.expires
             when p_plan = 'month' then now() + interval '1 month'
             else now() + interval '1 year' end;
  update obs_codes set plan = p_plan, expires = ex, active = true where code = p_into;
  return r;
end $$;
revoke all on function obs_admin_merge2(text, text, text) from public, anon;
grant execute on function obs_admin_merge2(text, text, text) to authenticated;
notify pgrst, 'reload schema';
