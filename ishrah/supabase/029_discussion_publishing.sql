-- The lecturer read policy uses ish_staff() inside post triggers with an empty search path.
create or replace function public.ish_staff() returns boolean
language sql stable security invoker set search_path = '' as $$
  select coalesce(array_length(public.ish_team(), 1), 0) > 0
$$;
