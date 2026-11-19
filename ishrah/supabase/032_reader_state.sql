-- Reader bookmarks, highlights and last page follow the account (owner, 19 Nov 2026: "make the zoom and bookmarks work better on phone"):
-- one row per account and book; only the owner of the row reads or writes it.
begin;

create table if not exists public.reader_state (
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  book text not null check (char_length(book) between 1 and 80),
  bookmarks jsonb not null default '[]'::jsonb,
  marks jsonb not null default '[]'::jsonb,
  last_page integer,
  updated_at timestamptz not null default now(),
  primary key (user_id, book),
  check (jsonb_typeof(bookmarks) = 'array' and jsonb_array_length(bookmarks) <= 500),
  check (jsonb_typeof(marks) = 'array' and jsonb_array_length(marks) <= 3000)
);
alter table public.reader_state enable row level security;
revoke all on public.reader_state from public, anon, authenticated;
grant select, insert, update, delete on public.reader_state to authenticated;
drop policy if exists own on public.reader_state;
create policy own on public.reader_state for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

notify pgrst, 'reload schema';
commit;
