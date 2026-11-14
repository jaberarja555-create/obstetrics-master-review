-- Owner, 14 Nov 2026: "when I add a book to a student it has to work by itself, not by the student copying the message into the book".
-- A book opened inside Student Master Review learns from the platform the device numbers of the other books on the same phone.
-- If one of them belongs to a live subscription of a student (same student id `sid`, or the same phone number in the note), and that
-- student also has a live subscription of THIS book, the device joins it at once: no link number, no approval.
-- Safe to run more than once.

create or replace function obs_auto_join(p_dev text, p_kind text, p_label text, p_book text, p_others text[]) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  bk text := coalesce(nullif(p_book, ''), 'obs');
  seen text; o text; c obs_codes; sids text[] := '{}'; phones text[] := '{}'; cd text; n int := 0;
begin
  if coalesce(p_dev, '') !~ '^[0-9a-f]{20,64}$' or bk not in ('obs', 'ped', 'srg') then
    return jsonb_build_object('ok', false, 'reason', 'bad');
  end if;
  select book into seen from obs_seen where dev = p_dev;
  if seen is not null and seen <> bk then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  -- already part of a subscription: nothing to do
  if obs_code_of(p_dev) is not null then return jsonb_build_object('ok', true, 'already', true); end if;
  -- who is the student? read from the other books' devices on this phone (at most 6, each a real device number)
  foreach o in array coalesce(p_others, '{}') loop
    n := n + 1; exit when n > 6;
    continue when coalesce(o, '') !~ '^[0-9a-f]{20,64}$' or o = p_dev;
    select * into c from obs_codes where code = obs_code_of(o);
    continue when not found or not c.active or (c.expires is not null and c.expires <= now());
    if c.sid is not null then sids := sids || c.sid; end if;
    if obs_phone9(split_part(coalesce(c.note, ''), '·', 2)) is not null then
      phones := phones || obs_phone9(split_part(coalesce(c.note, ''), '·', 2));
    end if;
  end loop;
  if cardinality(sids) = 0 and cardinality(phones) = 0 then return jsonb_build_object('ok', false, 'reason', 'none'); end if;
  -- the same student's live subscription of this book (the newest one)
  select code into cd from obs_codes
   where book = bk and active and plan is not null and plan <> 'old' and (expires is null or expires > now())
     and (sid = any(sids) or obs_phone9(split_part(coalesce(note, ''), '·', 2)) = any(phones))
   order by created_at desc limit 1;
  if cd is null then return jsonb_build_object('ok', false, 'reason', 'none'); end if;
  if obs_bind(cd, p_dev, p_kind, p_label) then return jsonb_build_object('ok', true); end if;
  return jsonb_build_object('ok', false, 'reason', 'full');
end $$;
revoke all on function obs_auto_join(text, text, text, text, text[]) from public;
grant execute on function obs_auto_join(text, text, text, text, text[]) to anon, authenticated;

notify pgrst, 'reload schema';
