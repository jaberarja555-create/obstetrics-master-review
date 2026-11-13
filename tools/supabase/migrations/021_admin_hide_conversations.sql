-- The owner can clear a conversation, or every conversation, from the ADMIN only (owner, 13 Nov 2026: "admin can delete a whole
-- conversation or the whole page, but not on the student's side"). Hidden messages stay in the student's app (obs_msg_list does not
-- look at ahide); a new message from the student shows in the admin again as a new conversation.
alter table obs_msgs add column if not exists ahide boolean not null default false;

create or replace function obs_admin_msgs() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  return coalesce((select jsonb_agg(to_jsonb(m) - 'ahide' order by m.id) from obs_msgs m
    where m.created > now() - interval '120 days' and not m.ahide), '[]'::jsonb);
end $$;

create or replace function obs_admin_msg_hide(p_tks text[]) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  update obs_msgs set ahide = true, seen = true where tk = any(coalesce(p_tks, '{}')) and not ahide;
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function obs_admin_msg_hide(text[]) from public;
grant execute on function obs_admin_msg_hide(text[]) to authenticated;
