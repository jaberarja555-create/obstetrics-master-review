-- اشرح لي: Announcements & News page (owner, 18 Nov 2026, from his design picture).
-- Announcements are the existing public notices (Control → Announcements); news items are this table, written by the team that may send
-- announcements (section 'notify'). Everyone may read published news. Safe to run again.
create table if not exists news (id uuid primary key default gen_random_uuid(), title text not null, body text default '', cover text default '',
  tag text default 'news', status text default 'published', author_id uuid references profiles on delete set null, created_at timestamptz default now());
alter table news enable row level security;
drop policy if exists r on news; create policy r on news for select using (status = 'published' or ish_do('notify', 'view'));
drop policy if exists i on news; create policy i on news for insert with check (ish_do('notify', 'add'));
drop policy if exists u on news; create policy u on news for update using (ish_do('notify', 'edit'));
drop policy if exists d on news; create policy d on news for delete using (ish_do('notify', 'delete'));
grant select on news to anon, authenticated; grant insert, update, delete on news to authenticated;
create index if not exists news_created on news (created_at desc);
