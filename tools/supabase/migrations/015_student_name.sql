-- Owner, 13 Nov 2026: "the student can change their name even if the admin gave them one, and the name is the same in all books and
-- the admin page". The device sends the name the student typed; it replaces the name part of the note (the phone stays) of its own
-- subscription and of every subscription with the same phone (the other books of the same student). Safe to run more than once.
create or replace function obs_set_name(p_dev text, p_name text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare cd text; nt text; p9 text; nm text := left(trim(regexp_replace(coalesce(p_name, ''), '[·\s]+', ' ', 'g')), 80); n int;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-fA-F-]{8,64}$' or length(nm) < 2 then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  cd := obs_code_of(p_dev);
  if cd is null then return jsonb_build_object('ok', false, 'reason', 'nosub'); end if;
  select note into nt from obs_codes where code = cd;
  p9 := obs_phone9(split_part(coalesce(nt, ''), '·', 2));
  update obs_codes set note = nm || case when position('·' in coalesce(note, '')) > 0
      then ' ·' || substring(note from position('·' in note) + 1) else '' end
    where code = cd or (p9 is not null and length(p9) >= 7 and obs_phone9(split_part(coalesce(note, ''), '·', 2)) = p9);
  get diagnostics n = row_count;
  return jsonb_build_object('ok', true, 'n', n, 'name', nm);
end $$;
revoke all on function obs_set_name(text, text) from public;
grant execute on function obs_set_name(text, text) to anon, authenticated;
notify pgrst, 'reload schema';
