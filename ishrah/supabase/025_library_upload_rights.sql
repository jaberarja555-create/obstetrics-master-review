begin;

alter table public.files add column if not exists rights_origin text;
alter table public.files add column if not exists rights_source text;
alter table public.files add column if not exists rights_confirmed boolean not null default false;

create or replace function ishrah_private.guard_library_upload_rights() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user not in ('anon', 'authenticated') then return new; end if;
  if tg_op = 'INSERT' and new.owner_id is distinct from auth.uid() then raise exception 'library_owner_required'; end if;
  if tg_op = 'UPDATE' and
    row(new.price, new.rights_origin, new.rights_source, new.rights_confirmed)
      is not distinct from row(old.price, old.rights_origin, old.rights_source, old.rights_confirmed) then
    return new;
  end if;
  if new.rights_confirmed is distinct from true
    or new.rights_origin is null or new.rights_origin not in ('original','free_source','permission') then
    raise exception 'library_rights_required';
  end if;
  if new.price > 0 and new.rights_origin <> 'original' then
    raise exception 'library_paid_original_only';
  end if;
  if (new.rights_origin <> 'original' and nullif(btrim(new.rights_source), '') is null)
    or char_length(new.rights_source) > 500 then raise exception 'library_source_required'; end if;
  return new;
end $$;
revoke all on function ishrah_private.guard_library_upload_rights() from public, anon, authenticated;
drop trigger if exists ish_guard_library_upload_rights on public.files;
create trigger ish_guard_library_upload_rights before insert or update of price, rights_origin, rights_source, rights_confirmed
on public.files for each row execute function ishrah_private.guard_library_upload_rights();

commit;
