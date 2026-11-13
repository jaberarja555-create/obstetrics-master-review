-- Owner, 14 Nov 2026: "the new admin page does not show the student notes" and "let me see all the notes of one book in one place".
-- A student's notes are of three kinds in the synced data (obs_sync.data):
--   hl  : a note on a highlight          data.hl[page key]  = [{t: highlighted text, n: note, u: time}, ...]
--   text: text written with the Text tool data.ink[page key] = [{t: 't', txt: text, u: time, ...}, ...]
--   pnote: an older free note on a page  data.ink[page key] = [{t: 'n', txt: text, u: time, ...}, ...]
-- The admin used to read only the first kind. obs_notes_of() reads all three; obs_admin_notes() (one subscription) and
-- obs_admin_book_notes() (every student of one book, or of all books) use it. Owner and second admins only (obs_is_admin()).

create or replace function obs_notes_ms(v text) returns bigint
language sql immutable as $$
  select case when v ~ '^[0-9]+(\.[0-9]+)?$' then floor(v::numeric)::bigint else 0 end
$$;

create or replace function obs_notes_of(p_data jsonb) returns table (page text, kind text, txt text, note text, u bigint)
language sql immutable as $$
  select k.key::text, 'hl'::text, coalesce(h->>'t', ''), h->>'n', obs_notes_ms(h->>'u')
  from jsonb_each(case when jsonb_typeof(p_data->'hl') = 'object' then p_data->'hl' else '{}'::jsonb end) k,
       jsonb_array_elements(case when jsonb_typeof(k.value) = 'array' then k.value else '[]'::jsonb end) h
  where jsonb_typeof(h) = 'object' and coalesce(h->>'n', '') <> ''
  union all
  select k.key::text, case when x->>'t' = 't' then 'text' else 'pnote' end, '', x->>'txt', obs_notes_ms(x->>'u')
  from jsonb_each(case when jsonb_typeof(p_data->'ink') = 'object' then p_data->'ink' else '{}'::jsonb end) k,
       jsonb_array_elements(case when jsonb_typeof(k.value) = 'array' then k.value else '[]'::jsonb end) x
  where jsonb_typeof(x) = 'object' and x->>'t' in ('t', 'n') and coalesce(btrim(x->>'txt'), '') <> ''
$$;

-- the return type gains a column (kind), so the old function is dropped first
drop function if exists obs_admin_notes(text);
create function obs_admin_notes(p_code text) returns table (page text, txt text, note text, u bigint, kind text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  return query
    select n.page, n.txt, n.note, n.u, n.kind
    from obs_sync s cross join lateral obs_notes_of(s.data) n
    where s.code = p_code
    order by n.u desc;
end $$;

create or replace function obs_admin_book_notes(p_book text) returns table (code text, book text, name text, page text, txt text, note text, u bigint, kind text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not obs_is_admin() then raise exception 'not_admin'; end if;
  return query
    select c.code::text, c.book::text, coalesce(obs_name_of(c.note), '')::text, n.page, n.txt, n.note, n.u, n.kind
    from obs_sync s join obs_codes c on c.code = s.code cross join lateral obs_notes_of(s.data) n
    where coalesce(p_book, 'all') = 'all' or c.book = p_book
    order by n.u desc
    limit 5000;
end $$;

revoke all on function obs_notes_ms(text) from public, anon, authenticated;
revoke all on function obs_notes_of(jsonb) from public, anon, authenticated;
revoke all on function obs_admin_notes(text) from public, anon;
revoke all on function obs_admin_book_notes(text) from public, anon;
grant execute on function obs_admin_notes(text) to authenticated;
grant execute on function obs_admin_book_notes(text) to authenticated;
