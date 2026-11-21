-- اشرح لي · 055: the in-app guide assistant (owner, 21 Nov 2026: «personal guide like AI inside the app»; chose «دليل التطبيق فقط» with
-- Claude Haiku 5.5). functions/api/assist.js counts each account's messages per day (a daily limit keeps the cost low) and logs the tokens,
-- so Control → Usage shows how many messages and roughly what they cost. Only the server key (functions) writes; nobody reads the rows
-- except the team through ish_assist_usage(). Safe to run again.

create table if not exists public.assist_usage (
  user_id uuid not null references public.profiles on delete cascade,
  day date not null default (now() at time zone 'Africa/Khartoum')::date,
  n int not null default 0,
  in_tok bigint not null default 0,
  out_tok bigint not null default 0,
  cache_tok bigint not null default 0,
  primary key (user_id, day)
);
alter table public.assist_usage enable row level security;
revoke all on public.assist_usage from public, anon, authenticated;

-- one more message for this account today, if it is under the limit; returns the count after it, or -1 when the limit is reached
create or replace function public.ish_assist_take(p_user uuid, p_limit int) returns int
language plpgsql security definer set search_path = '' as $$
declare v int; d date := (now() at time zone 'Africa/Khartoum')::date;
begin
  insert into public.assist_usage (user_id, day, n) values (p_user, d, 0) on conflict (user_id, day) do nothing;
  update public.assist_usage set n = n + 1 where user_id = p_user and day = d and n < greatest(p_limit, 0) returning n into v;
  return coalesce(v, -1);
end $$;

-- the tokens of an answer (for the cost figure)
create or replace function public.ish_assist_log(p_user uuid, p_in bigint, p_out bigint, p_cache bigint) returns void
language sql security definer set search_path = '' as $$
  update public.assist_usage set in_tok = in_tok + greatest(p_in, 0), out_tok = out_tok + greatest(p_out, 0), cache_tok = cache_tok + greatest(p_cache, 0)
  where user_id = p_user and day = (now() at time zone 'Africa/Khartoum')::date
$$;

revoke all on function public.ish_assist_take(uuid, int) from public, anon, authenticated;
revoke all on function public.ish_assist_log(uuid, bigint, bigint, bigint) from public, anon, authenticated;
grant execute on function public.ish_assist_take(uuid, int) to service_role;
grant execute on function public.ish_assist_log(uuid, bigint, bigint, bigint) to service_role;

-- the team's view: this month and today, counts only (Control → Usage)
create or replace function public.ish_assist_usage() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare m date := date_trunc('month', (now() at time zone 'Africa/Khartoum'))::date; t date := (now() at time zone 'Africa/Khartoum')::date;
begin
  if not (public.ish_do('settings', 'view') or public.ish_do('dash', 'view')) then raise exception 'not_allowed'; end if;
  return (select jsonb_build_object(
    'month_msgs', coalesce(sum(n) filter (where day >= m), 0), 'month_users', count(distinct user_id) filter (where day >= m and n > 0),
    'month_in', coalesce(sum(in_tok) filter (where day >= m), 0), 'month_out', coalesce(sum(out_tok) filter (where day >= m), 0),
    'month_cache', coalesce(sum(cache_tok) filter (where day >= m), 0), 'today_msgs', coalesce(sum(n) filter (where day = t), 0))
    from public.assist_usage);
end $$;
revoke all on function public.ish_assist_usage() from public, anon;
grant execute on function public.ish_assist_usage() to authenticated;
