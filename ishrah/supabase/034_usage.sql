-- Usage panel for Control (owner, 19 Nov 2026: "how much can this free account hold … when do I pay"): storage per bucket, database size and
-- counts of the main tables. Only accounts allowed to view settings may read it.
begin;

insert into public.settings (id, value) values ('plan_storage_gb', '1'), ('plan_db_mb', '500'), ('plan_name', 'free') on conflict (id) do nothing;

create or replace function public.ish_usage() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if not (public.ish_do('settings','view') or public.ish_do('dash','view')) then raise exception 'request_permission' using errcode = '42501'; end if;
  select jsonb_build_object(
    'db_bytes', pg_database_size(current_database()),
    'buckets', coalesce((select jsonb_agg(jsonb_build_object('id', b.bucket_id, 'files', b.n, 'bytes', b.bytes) order by b.bytes desc)
      from (select o.bucket_id, count(*) n, coalesce(sum(nullif(o.metadata->>'size','')::bigint), 0) bytes from storage.objects o group by o.bucket_id) b), '[]'::jsonb),
    'counts', jsonb_build_object(
      'profiles', (select count(*) from public.profiles),
      'posts', (select count(*) from public.posts),
      'replies', (select count(*) from public.replies),
      'files', (select count(*) from public.files),
      'courses', (select count(*) from public.courses),
      'lessons', (select count(*) from public.lessons),
      'enrollments', (select count(*) from public.enrollments),
      'file_buys', (select count(*) from public.file_buys),
      'notices', (select count(*) from public.notices)),
    'largest', coalesce((select jsonb_agg(x) from (
      select jsonb_build_object('bucket', o.bucket_id, 'name', o.name, 'bytes', nullif(o.metadata->>'size','')::bigint, 'at', o.created_at) x
      from storage.objects o order by nullif(o.metadata->>'size','')::bigint desc nulls last limit 10) t), '[]'::jsonb),
    'at', now()) into result;
  return result;
end $$;
revoke all on function public.ish_usage() from public, anon;
grant execute on function public.ish_usage() to authenticated;

notify pgrst, 'reload schema';
commit;
