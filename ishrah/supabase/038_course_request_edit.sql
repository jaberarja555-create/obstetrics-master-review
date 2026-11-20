-- Course requests: edit and send again for approval, and a cover picture (owner, 19 Nov 2026: "people should be able to adjust their post
-- and send it again to admin for approval; the course request should have a preview image put by the one who requests or the admin").
--   * The author may edit title, details, rules, price, date and time, goal, automatic closing and the cover. The request then goes back to
--     «pending» (the team is alerted by 035/036) unless the author can approve course reviews. A request with payments cannot be edited by its
--     author (the agreed terms must not change under paying students).
--   * The team (review edit / approve) may edit any request; its status stays as it is.
--   * The cover is a picture uploaded to the public `media` bucket (a URL of this project's storage).
begin;

alter table public.course_requests add column if not exists cover text;
alter table public.course_requests drop constraint if exists course_requests_cover_ok;
alter table public.course_requests add constraint course_requests_cover_ok check (cover is null or (char_length(cover) < 600 and cover ~ '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/media/'));

create or replace function public.ish_course_request_edit(request uuid, payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  r public.course_requests;
  staff boolean := public.ish_do('review','edit') or public.ish_do('review','approve');
  t text; d text;
begin
  if actor is null or not exists (select 1 from public.profiles where id = actor and status is distinct from 'blocked' and team_status is distinct from 'suspended')
    then raise exception 'request_sign_in'; end if;
  select * into r from public.course_requests where id = request and status <> 'deleted' for update;
  if not found then raise exception 'request_unavailable'; end if;
  if r.user_id is distinct from actor and not staff then raise exception 'request_permission'; end if;
  if not staff and coalesce(r.reserved_count, 0) > 0 then raise exception 'request_has_payments'; end if;
  t := nullif(btrim(coalesce(payload->>'title', r.title)), '');
  d := nullif(btrim(coalesce(payload->>'details', r.details)), '');
  if t is null or d is null then raise exception 'request_fields'; end if;
  update public.course_requests set
    title = left(t, 160),
    details = left(d, 4000),
    rules = case when payload ? 'rules' then left(nullif(btrim(payload->>'rules'), ''), 2000) else rules end,
    budget_min = case when payload ? 'price' then nullif(payload->>'price', '')::numeric else budget_min end,
    budget_max = case when payload ? 'price' then nullif(payload->>'price', '')::numeric else budget_max end,
    proposed_at = case when payload ? 'proposed_at' then nullif(payload->>'proposed_at', '')::timestamptz else proposed_at end,
    goal = case when payload ? 'goal' then nullif(payload->>'goal', '')::integer else goal end,
    auto_close = case when payload ? 'auto_close' then coalesce((payload->>'auto_close')::boolean, false) else auto_close end,
    cover = case when payload ? 'cover' then nullif(payload->>'cover', '') else cover end,
    status = case when staff or status = 'pending' then status else 'pending' end,
    published_at = case when staff or status = 'pending' then published_at else null end
  where id = r.id returning * into r;
  if staff and r.user_id is distinct from actor then
    insert into public.audit (user_id, name, action, target) select actor, p.name, 'edit course request', r.title from public.profiles p where p.id = actor;
  end if;
  return jsonb_build_object('id', r.id, 'status', r.status);
end $$;
revoke all on function public.ish_course_request_edit(uuid, jsonb) from public, anon;
grant execute on function public.ish_course_request_edit(uuid, jsonb) to authenticated;

-- Posts: the author edits the title and text; the post goes back to review unless the author is a community editor (owner, 19 Nov 2026)
create or replace function public.ish_post_edit(post uuid, title text, body text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  p public.posts;
  staff boolean := public.ish_do('community','edit');
  t text := left(nullif(btrim(coalesce(title, '')), ''), 200);
  b text := left(nullif(btrim(coalesce(body, '')), ''), 8000);
begin
  if actor is null or not exists (select 1 from public.profiles where id = actor and status is distinct from 'blocked' and team_status is distinct from 'suspended')
    then raise exception 'post_sign_in'; end if;
  select * into p from public.posts where id = post and status <> 'removed' for update;
  if not found then raise exception 'post_unavailable'; end if;
  if p.user_id is distinct from actor and not staff then raise exception 'post_permission'; end if;
  if b is null then raise exception 'post_fields'; end if;
  update public.posts set title = t, body = b,
    status = case when staff then status else 'pending' end,
    review_note = case when staff then review_note else null end
  where id = p.id returning * into p;
  if staff and p.user_id is distinct from actor then
    insert into public.audit (user_id, name, action, target) select actor, pr.name, 'edit post', coalesce(p.title, p.id::text) from public.profiles pr where pr.id = actor;
  end if;
  return jsonb_build_object('id', p.id, 'status', p.status);
end $$;
revoke all on function public.ish_post_edit(uuid, text, text) from public, anon;
grant execute on function public.ish_post_edit(uuid, text, text) to authenticated;

-- the review queue now publishes or declines any waiting post (an edited discussion, announcement or preview), not only questions
create or replace function ishrah_private.review_question(question uuid, publish boolean, note text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  p public.posts;
  decision_note text := nullif(btrim(note), '');
  q boolean;
begin
  if not public.ish_do('review','approve') then raise exception 'question_review_required'; end if;
  if publish is null or (not publish and (decision_note is null or char_length(decision_note) > 2000)) then
    raise exception 'question_review_note_required';
  end if;
  update public.posts set status = case when publish then 'open' else 'rejected' end,
    review_note = case when publish then null else decision_note end
    where id = question and status = 'pending'
    returning * into p;
  if not found then return false; end if;
  q := p.room = 'qa' or p.post_kind = 'question';
  insert into public.audit (user_id, name, action, target)
    select id, name, case when publish then 'approve ' else 'reject ' end || case when q then 'question' else 'post' end, p.id::text
    from public.profiles where id = auth.uid();
  if p.user_id is not null then
    insert into public.notices(user_id,title,title_en,body,link)
      values (p.user_id,
        case when publish then case when q then 'نُشر سؤالك' else 'نُشر منشورك' end else case when q then 'لم يُنشر سؤالك' else 'لم يُنشر منشورك' end end,
        case when publish then case when q then 'Your question was published' else 'Your post was published' end else case when q then 'Your question was declined' else 'Your post was declined' end end,
        coalesce(p.title,''), '#post/' || p.id);
  end if;
  if publish and p.room = 'qa' and p.lecturer_id is not null and p.lecturer_id is distinct from p.user_id then
    insert into public.notices(user_id,title,title_en,body,link)
      values (p.lecturer_id, 'سؤال جديد في كورسك', 'New question in your course', '', '#studio-qa');
  end if;
  return true;
end $$;
revoke all on function ishrah_private.review_question(uuid,boolean,text) from public, anon, authenticated;
grant execute on function ishrah_private.review_question(uuid,boolean,text) to authenticated;

-- alerts: say «edited» when an edit sends a post or a request back to review
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
      perform ishrah_private.alert_team('review',
        case when tg_op = 'UPDATE' then 'منشور معدّل بانتظار المراجعة' when new.post_kind = 'question' or new.room = 'qa' then 'سؤال بانتظار المراجعة' else 'منشور بانتظار المراجعة' end,
        case when tg_op = 'UPDATE' then 'Edited post to review' when new.post_kind = 'question' or new.room = 'qa' then 'Question to review' else 'Post to review' end,
        coalesce(nullif(new.title, ''), left(new.body, 140)), '#control-questions', new.user_id);
    elsif became = 'open' and coalesce(new.room, '') <> 'qa' and new.lesson_id is null
      and not (tg_op = 'UPDATE' and old.status = 'pending' and new.post_kind is distinct from 'question') then   -- an approved edit is not a new post
      perform ishrah_private.alert_space(new.spec, new.room, 'منشور جديد من ' || coalesce(new.name, ''), 'New post by ' || coalesce(new.name, ''),
        coalesce(nullif(new.title, ''), new.body), '#post/' || new.id, new.user_id); end if;
  elsif tbl = 'courses' then
    if became = 'review' then
      perform ishrah_private.alert_team('review', 'كورس جديد للمراجعة', 'Course sent for review', new.title, '#control-review', new.lecturer_id);
    elsif became = 'published' then
      perform ishrah_private.alert_space(new.spec, new.cat, 'كورس جديد', 'New course', new.title, '#course/' || new.id, new.lecturer_id); end if;
  elsif tbl = 'course_requests' then
    if became = 'pending' then
      perform ishrah_private.alert_team('review', case when tg_op = 'UPDATE' then 'طلب كورس معدّل بانتظار موافقتك' else 'طلب كورس جديد بانتظار موافقتك' end,
        case when tg_op = 'UPDATE' then 'Edited course request to approve' else 'New course request to approve' end, new.title, '#control-course-requests', new.user_id);
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
