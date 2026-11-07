-- Student notes on the admin page (owner, 7 Nov 2026, as in Surgery and Pediatrics): the notes a student wrote on
-- highlights (synced data → hl → page key → [{t: text, n: note, u: time}]), newest first. Highlights without a note are left out.
create or replace function obs_admin_notes(p_code text) returns table (page text, txt text, note text, u bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  return query
    select k.key::text, coalesce(h->>'t', ''), h->>'n', coalesce((h->>'u')::bigint, 0)
    from obs_sync s, jsonb_each(coalesce(s.data->'hl', '{}'::jsonb)) k, jsonb_array_elements(case when jsonb_typeof(k.value) = 'array' then k.value else '[]'::jsonb end) h
    where s.code = p_code and coalesce(h->>'n', '') <> ''
    order by 4 desc;
end $$;
revoke all on function obs_admin_notes(text) from public;
grant execute on function obs_admin_notes(text) to authenticated;
