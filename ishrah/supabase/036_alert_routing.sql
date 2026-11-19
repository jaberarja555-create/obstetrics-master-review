-- Alerts for messages follow the department (owner, 19 Nov 2026: "it depends on which admin receives which notification, so he does his
-- work"): the same rule as reading a message (002_org.sql policy r on tickets): the owner and the general manager, the staff of the
-- message's department, and the person it is assigned to. Other requests keep going to the staff whose role covers that work.
begin;

create or replace function ishrah_private.staff_for_ticket(t uuid) returns setof uuid
language sql stable security definer set search_path = '' as $$
  select m.id from public.profiles m, public.tickets k
  where k.id = t and coalesce(array_length(m.team, 1), 0) > 0 and m.status is distinct from 'blocked' and coalesce(m.team_status, 'active') = 'active'
    and (
      'owner' = any (m.team) or 'gm' = any (m.team)
      or m.id = k.assigned_to
      or (k.assigned_to is null and coalesce(nullif(m.dept, ''), (select r from unnest(m.team) r where r in ('academic','finance','content','community','support','tech') limit 1), '') = coalesce(k.dept, '')
          and m.id in (select ishrah_private.staff_for('tickets')))
    )
$$;
revoke all on function ishrah_private.staff_for_ticket(uuid) from public, anon, authenticated;

create or replace function ishrah_private.alert_ticket(t uuid, t_ar text, t_en text, b text, who uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.notices (user_id, title, title_en, body, link, actor, kind)
  select s, t_ar, t_en, coalesce(b, ''), '#ticket/' || t, who, 'team' from ishrah_private.staff_for_ticket(t) s where s is distinct from who
$$;
revoke all on function ishrah_private.alert_ticket(uuid,text,text,text,uuid) from public, anon, authenticated;

-- the activity trigger: messages now use the department rule; everything else as in 035
create or replace function ishrah_private.on_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  became text;
  tbl text := tg_table_name;
begin
  -- read the status through JSON: some tables (ticket_msgs) have no status column, and a direct new.status would fail the user's action
  became := case when tg_op = 'INSERT' then to_jsonb(new)->>'status'
    when (to_jsonb(new)->>'status') is distinct from (to_jsonb(old)->>'status') then to_jsonb(new)->>'status' end;
  if tbl = 'tickets' then
    if tg_op = 'INSERT' then
      perform ishrah_private.alert_ticket(new.id, 'رسالة جديدة من ' || coalesce(new.name, ''), 'New message from ' || coalesce(new.name, ''), new.subject, new.user_id);
    elsif new.assigned_to is distinct from old.assigned_to and new.assigned_to is not null then
      insert into public.notices (user_id, title, title_en, body, link, actor, kind)
        values (new.assigned_to, 'أُسندت إليك رسالة', 'A message was assigned to you', new.subject, '#ticket/' || new.id, null, 'team');
    end if;
    return null;
  elsif tbl = 'ticket_msgs' then
    if tg_op = 'INSERT' and not coalesce(new.staff, false) and not coalesce(new.lec, false) then
      perform ishrah_private.alert_ticket(new.ticket_id, 'رد جديد من ' || coalesce(new.name, ''), 'New reply from ' || coalesce(new.name, ''), left(new.body, 140), new.user_id);
    end if;
    return null;
  end if;

  if tbl = 'enrollments' then
    if became = 'pending' and coalesce(new.price, 0) > 0 then
      perform ishrah_private.alert_team('pay', 'دفع جديد بانتظار المراجعة', 'New payment to review', new.payer, '#control-pay', new.user_id); end if;
  elsif tbl = 'file_buys' then
    if became = 'pending' then
      perform ishrah_private.alert_team('pay', 'شراء من المكتبة بانتظار المراجعة', 'Library purchase to review', new.title || ' · ' || coalesce(new.payer, ''), '#control-sales', new.user_id); end if;
  elsif tbl = 'lecturer_apps' then
    if became = 'pending' then
      perform ishrah_private.alert_team('apps', 'طلب انضمام محاضر', 'New lecturer application', new.name, '#control-apps', new.user_id); end if;
  elsif tbl = 'files' then
    if became = 'pending' and coalesce(new.series_no, 1) <= 1 then
      perform ishrah_private.alert_team('library', 'ملف بانتظار النشر', 'File waiting to be published', coalesce(new.series_title, new.title), '#control-library', new.owner_id);
    elsif became = 'published' and coalesce(new.series_no, 1) <= 1 then
      perform ishrah_private.alert_space(new.spec, new.cat, 'جديد في المكتبة', 'New in the library', coalesce(new.series_title, new.title),
        case when new.series_id is not null then '#series/' || new.series_id else '#file/' || new.id end, new.owner_id); end if;
  elsif tbl = 'library_file_revisions' then
    if became = 'pending' then
      perform ishrah_private.alert_team('library', 'تعديل ملف بانتظار المراجعة', 'File edit to review', '', '#control-library', null); end if;
  elsif tbl = 'posts' then
    if became = 'pending' then
      perform ishrah_private.alert_team('review', 'سؤال بانتظار المراجعة', 'Question to review', new.title, '#control-questions', new.user_id);
    elsif became = 'open' and coalesce(new.room, '') <> 'qa' and new.lesson_id is null then
      perform ishrah_private.alert_space(new.spec, new.room, 'منشور جديد من ' || coalesce(new.name, ''), 'New post by ' || coalesce(new.name, ''),
        coalesce(nullif(new.title, ''), new.body), '#post/' || new.id, new.user_id); end if;
  elsif tbl = 'courses' then
    if became = 'review' then
      perform ishrah_private.alert_team('review', 'كورس جديد للمراجعة', 'Course sent for review', new.title, '#control-review', new.lecturer_id);
    elsif became = 'published' then
      perform ishrah_private.alert_space(new.spec, new.cat, 'كورس جديد', 'New course', new.title, '#course/' || new.id, new.lecturer_id); end if;
  elsif tbl = 'course_requests' then
    if became = 'pending' then
      perform ishrah_private.alert_team('review', 'طلب كورس جديد بانتظار موافقتك', 'New course request to approve', new.title, '#control-course-requests', new.user_id);
    elsif became = 'open' then
      perform ishrah_private.alert_space(new.spec, new.cat, 'طلب كورس جديد', 'New course request', new.title, '#course-request/' || new.id, new.user_id); end if;
  elsif tbl = 'events' then
    if became = 'published' then
      perform ishrah_private.alert_space(new.spec, new.cat, 'فعالية جديدة', 'New event', new.title, '#event/' || new.id, new.lecturer_id); end if;
  elsif tbl = 'reports' then
    if tg_op = 'INSERT' then
      perform ishrah_private.alert_team('community', 'بلاغ جديد', 'New report', left(coalesce(new.reason, ''), 140), '#control-community', new.user_id); end if;
  elsif tbl = 'requests' then
    if tg_op = 'INSERT' then
      perform ishrah_private.alert_team('requests', 'طلب مكتبة جديد', 'New library request', new.title, '#control-requests', new.user_id); end if;
  elsif tbl = 'payouts' then
    if became = 'requested' then
      perform ishrah_private.alert_team('payout', 'طلب تحويل أرباح محاضر', 'Lecturer payout request', new.name, '#control-payouts', new.lecturer_id); end if;
  elsif tbl = 'seller_payouts' then
    if became = 'requested' then
      perform ishrah_private.alert_team('payout', 'طلب تحويل أرباح بائع', 'Seller payout request', new.name, '#control-sales/sellers', new.seller_id); end if;
  end if;
  return null;
exception when others then
  return null;   -- an alert must never stop the user's own action
end $$;
revoke all on function ishrah_private.on_activity() from public, anon, authenticated;

notify pgrst, 'reload schema';
commit;
