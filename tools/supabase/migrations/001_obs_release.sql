-- Obstetrics Master Review: the student removes the code from his own device (owner, 6 Nov 2026).
-- Run once in the Supabase SQL editor. obs_release(p_dev) clears this device from the code it is bound to, so the code
-- can open another device. It finds the codes table by its phone_dev / pc_dev columns, so no table name is needed.
create or replace function obs_release(p_dev text) returns json
language plpgsql security definer set search_path = public as $$
declare t record; n int := 0; c int;
begin
  if p_dev is null or p_dev !~ '^[0-9a-f]{20}$' then
    return json_build_object('ok', false, 'reason', 'dev');
  end if;
  for t in select c1.table_name from information_schema.columns c1
           join information_schema.columns c2 on c2.table_schema = c1.table_schema and c2.table_name = c1.table_name and c2.column_name = 'pc_dev'
           where c1.table_schema = 'public' and c1.column_name = 'phone_dev' loop
    execute format('update %I set phone_dev = null where phone_dev = $1', t.table_name) using p_dev; get diagnostics c = row_count; n := n + c;
    execute format('update %I set pc_dev = null where pc_dev = $1', t.table_name) using p_dev; get diagnostics c = row_count; n := n + c;
  end loop;
  return json_build_object('ok', n > 0, 'reason', case when n > 0 then null else 'none' end);
end $$;

revoke all on function obs_release(text) from public;
grant execute on function obs_release(text) to anon, authenticated;
