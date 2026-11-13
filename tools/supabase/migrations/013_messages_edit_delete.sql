-- Owner, 13 Nov 2026: "the student and the admin can change a message and delete it; the admin page refreshes for new messages".
-- Written to be run more than once safely.

alter table obs_msgs add column if not exists edited timestamptz;

-- the device reads its whole conversation (the last 200 messages) every time, so a message that was changed or deleted on the other
-- side is changed or removed here too; p_after is kept for older apps and no longer used
create or replace function obs_msg_list(p_dev text, p_after bigint) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare t text;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' then return '[]'::jsonb; end if;
  t := obs_tk_of(p_dev);
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'dir', dir, 'body', body, 't', created, 'e', edited) order by id)
    from (select * from obs_msgs where tk = t or tk = 'd:' || p_dev order by id desc limit 200) m), '[]'::jsonb);
end $$;

-- the student changes or deletes a message of their own conversation that they wrote (from any of their devices)
create or replace function obs_msg_edit(p_dev text, p_id bigint, p_body text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare b text := left(trim(coalesce(p_body, '')), 1500); n int;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  if length(b) < 1 then return jsonb_build_object('ok', false, 'reason', 'empty'); end if;
  update obs_msgs set body = b, edited = now(), seen = false
    where id = p_id and dir = 'in' and (tk = obs_tk_of(p_dev) or tk = 'd:' || p_dev);
  get diagnostics n = row_count;
  return jsonb_build_object('ok', n > 0);
end $$;

create or replace function obs_msg_delete(p_dev text, p_id bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  delete from obs_msgs where id = p_id and dir = 'in' and (tk = obs_tk_of(p_dev) or tk = 'd:' || p_dev);
  get diagnostics n = row_count;
  return jsonb_build_object('ok', n > 0);
end $$;

-- the owner changes one of their own answers (deleting any message was already there: obs_admin_msg_delete)
create or replace function obs_admin_msg_edit(p_id bigint, p_body text) returns void
language plpgsql security definer set search_path = public as $$
declare b text := left(trim(coalesce(p_body, '')), 3000);
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  if length(b) < 1 then raise exception 'bad'; end if;
  update obs_msgs set body = b, edited = now() where id = p_id and dir = 'out';
end $$;

revoke all on function obs_msg_edit(text, bigint, text) from public;
revoke all on function obs_msg_delete(text, bigint) from public;
revoke all on function obs_admin_msg_edit(bigint, text) from public;
grant execute on function obs_msg_edit(text, bigint, text) to anon, authenticated;
grant execute on function obs_msg_delete(text, bigint) to anon, authenticated;
grant execute on function obs_admin_msg_edit(bigint, text) to authenticated;

notify pgrst, 'reload schema';
