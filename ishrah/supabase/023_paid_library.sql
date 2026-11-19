-- Paid or free library files with tags (owner, 19 Nov 2026): anyone may share a file for free or for a price; the team approves
-- publishing (files guard already keeps student uploads pending); buyers pay by Bankak receipt; Finance approves; sellers earn a share.
begin;

alter table public.files add column if not exists price numeric not null default 0;
alter table public.files add column if not exists tags text[] not null default '{}';
alter table public.files drop constraint if exists files_price_ok;
alter table public.files add constraint files_price_ok check (price >= 0 and price < 100000000 and price = trunc(price, 2));
alter table public.files drop constraint if exists files_tags_ok;
alter table public.files add constraint files_tags_ok check (coalesce(array_length(tags, 1), 0) <= 8);
create index if not exists ish_files_tags on public.files using gin (tags);
insert into public.settings (id, value) values ('file_share', '70') on conflict (id) do nothing;

-- One purchase = one file, or one whole series (all its parts open).
create table if not exists public.file_buys (
  id uuid primary key default gen_random_uuid(),
  file_id uuid references public.files on delete cascade,
  series_id uuid,
  title text,
  user_id uuid not null references public.profiles on delete cascade,
  seller_id uuid references public.profiles on delete set null,
  seller_name text,
  status text not null default 'pending' check (status in ('pending','active','rejected')),
  price numeric not null default 0,
  share numeric,
  payer text, phone text, receipt text, note text,
  decided_at timestamptz, decided_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists ish_file_buys_user on public.file_buys (user_id, status);
create index if not exists ish_file_buys_seller on public.file_buys (seller_id, status);
create unique index if not exists ish_file_buys_one_open on public.file_buys (user_id, coalesce(series_id, file_id)) where status in ('pending','active');
alter table public.file_buys enable row level security;
revoke all on public.file_buys from public, anon, authenticated;
grant select, insert, update on public.file_buys to authenticated;
drop policy if exists r on public.file_buys;
create policy r on public.file_buys for select to authenticated using (
  user_id = (select auth.uid()) or seller_id = (select auth.uid()) or (select public.ish_do('pay','view')));
drop policy if exists i on public.file_buys;
create policy i on public.file_buys for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists u on public.file_buys;
create policy u on public.file_buys for update to authenticated using ((select public.ish_do('pay','approve')));

create or replace function ishrah_private.guard_file_buy() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  f public.files;
  actor uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    if new.series_id is not null then
      select * into f from public.files where series_id = new.series_id and status = 'published' order by series_no nulls last limit 1;
      new.file_id := null;
    else
      select * into f from public.files where id = new.file_id and status = 'published';
    end if;
    if f.id is null or coalesce(f.price, 0) <= 0 then raise exception 'file_not_for_sale'; end if;
    if new.user_id is distinct from actor or f.owner_id = actor then raise exception 'request_permission'; end if;
    if not exists (select 1 from public.profiles p where p.id = actor and p.status is distinct from 'blocked') then raise exception 'request_permission'; end if;
    if nullif(trim(new.payer), '') is null or nullif(trim(new.phone), '') is null or not exists (
      select 1 from storage.objects o where o.bucket_id = 'receipts' and o.name = new.receipt
        and split_part(o.name, '/', 1) = actor::text and o.metadata->>'mimetype' like 'image/%')
    then raise exception 'payment_receipt_required'; end if;
    new.price := f.price;
    new.title := case when new.series_id is not null then coalesce(f.series_title, f.title) else f.title end;
    new.seller_id := f.owner_id;
    new.seller_name := f.owner_name;
    new.status := 'pending'; new.share := null; new.decided_at := null; new.decided_by := null; new.note := null;
    new.created_at := now();
  else
    if not public.ish_do('pay','approve') then raise exception 'request_permission'; end if;
    new.id := old.id; new.file_id := old.file_id; new.series_id := old.series_id; new.title := old.title;
    new.user_id := old.user_id; new.seller_id := old.seller_id; new.seller_name := old.seller_name;
    new.price := old.price; new.payer := old.payer; new.phone := old.phone; new.receipt := old.receipt; new.created_at := old.created_at;
    if old.status <> 'pending' and new.status is distinct from old.status then raise exception 'payment_decided'; end if;
    if new.status = 'active' then
      new.share := coalesce(nullif(new.share, 0),
        (select nullif(value, '')::numeric from public.settings where id = 'file_share'), 70);
      if new.share < 0 or new.share > 100 then raise exception 'payout_amount'; end if;
    end if;
    if new.status is distinct from old.status then new.decided_at := now(); new.decided_by := actor; end if;
  end if;
  return new;
end $$;
revoke all on function ishrah_private.guard_file_buy() from public, anon, authenticated;
drop trigger if exists ish_guard_file_buy on public.file_buys;
create trigger ish_guard_file_buy before insert or update on public.file_buys for each row execute function ishrah_private.guard_file_buy();

-- May this account open the file itself (not only its cover)?
create or replace function public.ish_file_open(target public.files) returns boolean
language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and (
    target.owner_id = (select auth.uid())
    or public.ish_do('library','view')
    or (target.status = 'published' and (
      coalesce(target.price, 0) <= 0
      or exists (select 1 from public.file_buys b where b.user_id = (select auth.uid()) and b.status = 'active'
        and (b.file_id = target.id or (target.series_id is not null and b.series_id = target.series_id)))
    ))
  )
$$;
grant execute on function public.ish_file_open(public.files) to anon, authenticated;

-- Library bucket: covers stay readable; the file and its reading copy only for those allowed above.
drop policy if exists ish_read on storage.objects;
create policy ish_read on storage.objects for select to anon, authenticated using (
  bucket_id = 'media'
  or (bucket_id = 'receipts' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.ish_do('pay','view'))))
  or (bucket_id = 'apps' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.ish_do('apps','view'))))
  or (bucket_id = 'library' and (
    ((select auth.uid()) is not null and (storage.foldername(name))[1] = (select auth.uid())::text)
    or exists (
      select 1 from public.files f
      where (f.cover = storage.objects.name and (f.status = 'published' or (select auth.uid()) is not null))
        or (storage.objects.name in (f.path, f.reading_path) and public.ish_file_open(f))
    )
  ))
);

-- Sellers' Bankak accounts (private) and transfers of their earnings.
create table if not exists public.seller_accounts (
  id uuid primary key references public.profiles on delete cascade,
  account text not null check (char_length(btrim(account)) between 1 and 80),
  account_name text not null check (char_length(btrim(account_name)) between 1 and 150)
);
alter table public.seller_accounts enable row level security;
revoke all on public.seller_accounts from public, anon, authenticated;
grant select, insert, update on public.seller_accounts to authenticated;
drop policy if exists own_or_finance on public.seller_accounts;
create policy own_or_finance on public.seller_accounts for select to authenticated
  using (id = (select auth.uid()) or (select public.ish_do('payout','approve')));
drop policy if exists own_insert on public.seller_accounts;
create policy own_insert on public.seller_accounts for insert to authenticated with check (id = (select auth.uid()));
drop policy if exists own_update on public.seller_accounts;
create policy own_update on public.seller_accounts for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create table if not exists public.seller_payouts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles on delete cascade,
  name text, amount numeric not null check (amount > 0),
  status text not null default 'requested' check (status in ('requested','paid')),
  receipt text, ref text, note text, paid_at timestamptz, paid_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists ish_seller_payouts on public.seller_payouts (seller_id, status);
alter table public.seller_payouts enable row level security;
revoke all on public.seller_payouts from public, anon, authenticated;
grant select on public.seller_payouts to authenticated;
drop policy if exists r on public.seller_payouts;
create policy r on public.seller_payouts for select to authenticated
  using (seller_id = (select auth.uid()) or (select public.ish_do('payout','approve')));

drop policy if exists ish_seller_receipt_read on storage.objects;
create policy ish_seller_receipt_read on storage.objects for select to authenticated using (
  bucket_id = 'payout-receipts' and exists (
    select 1 from public.seller_payouts p where p.receipt = storage.objects.name and p.status = 'paid' and p.seller_id = (select auth.uid()))
);

-- action 'request' (the seller asks for the balance) or 'record' (Finance sent the transfer with its receipt).
create or replace function public.ish_seller_payout(action text, seller uuid, amount numeric, pending uuid default null,
  receipt_path text default null, transfer_note text default null, reference text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  who public.profiles;
  earned numeric; paid numeric; held numeric; result uuid;
begin
  if actor is null or not coalesce((action = 'request' and seller = actor) or (action = 'record' and public.ish_do('payout','approve')), false)
    then raise exception 'payout_permission' using errcode = '42501'; end if;
  if amount is null or amount <= 0 or amount <> trunc(amount, 2) then raise exception 'payout_amount'; end if;
  select * into who from public.profiles where id = seller for update;
  if who.id is null then raise exception 'payout_permission' using errcode = '42501'; end if;
  if not exists (select 1 from public.seller_accounts a where a.id = seller) then raise exception 'payout_account'; end if;
  select coalesce(sum(b.price * coalesce(b.share, 70) / 100), 0) into earned from public.file_buys b where b.seller_id = seller and b.status = 'active';
  select coalesce(sum(p.amount) filter (where p.status = 'paid'), 0),
         coalesce(sum(p.amount) filter (where p.status = 'requested' and p.id is distinct from pending), 0)
    into paid, held from public.seller_payouts p where p.seller_id = seller;
  if action = 'request' then
    if held > 0 then raise exception 'payout_request_pending'; end if;
    if amount > earned - paid then raise exception 'payout_balance'; end if;
    insert into public.seller_payouts (seller_id, name, amount) values (seller, who.name, amount) returning id into result;
    return result;
  end if;
  if amount > earned - paid then raise exception 'payout_balance'; end if;
  if receipt_path is null or split_part(receipt_path, '/', 1) <> actor::text or not exists (
    select 1 from storage.objects s where s.bucket_id = 'payout-receipts' and s.name = receipt_path) then raise exception 'payout_receipt'; end if;
  select p.id into result from public.seller_payouts p where p.receipt = receipt_path and p.seller_id = seller;
  if result is not null then return result; end if;
  if pending is not null then
    update public.seller_payouts set amount = ish_seller_payout.amount, status = 'paid', receipt = receipt_path,
      ref = nullif(left(btrim(reference), 150), ''), note = nullif(left(btrim(transfer_note), 2000), ''), paid_at = now(), paid_by = actor
      where id = pending and seller_id = seller and status = 'requested' returning id into result;
    if result is null then raise exception 'payout_request_closed'; end if;
  else
    insert into public.seller_payouts (seller_id, name, amount, status, receipt, ref, note, paid_at, paid_by)
      values (seller, who.name, amount, 'paid', receipt_path, nullif(left(btrim(reference), 150), ''),
        nullif(left(btrim(transfer_note), 2000), ''), now(), actor) returning id into result;
  end if;
  insert into public.notices (user_id, title, title_en, body, link) values (seller, 'وصلك تحويل أرباح مبيعاتك', 'Your sales payout was sent', '', '#sales');
  insert into public.audit (user_id, name, action, target) select actor, p.name, 'record seller payout', result::text from public.profiles p where p.id = actor;
  return result;
end $$;
revoke all on function public.ish_seller_payout(text, uuid, numeric, uuid, text, text, text) from public, anon;
grant execute on function public.ish_seller_payout(text, uuid, numeric, uuid, text, text, text) to authenticated;

commit;
