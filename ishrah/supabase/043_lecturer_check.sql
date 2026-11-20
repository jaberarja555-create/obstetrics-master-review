-- Ask the named lecturer before a course request is published (owner, 20 Nov 2026: «نعم ابنيها، والمحاضر يمكن أن يضع شروط مثل عدد الطلاب،
-- والسعر لكل طالب والزمن، وكذلك الأدمن ممكن يحوّل الطلب إلى نشر إعلان كورس أو فقط طلب الكورس، والناس بعد تدي اهتمام»).
--   ish_request_check(request, action, payload):
--     'ask'     the team (review approve) asks the named lecturer of a waiting request; the lecturer is notified.
--     'answer'  the named lecturer answers: available (price per student, number of students, date and time, conditions), unavailable or
--               needs details (+ note). «Available» keeps the terms as the lecturer's (private) offer on the request. The team is alerted.
--     'publish' the team publishes: 'announce' = course announcement with the lecturer's terms as the agreed terms (seats, price, date;
--               paid → students pay to join, free → they join); 'request' = a plain course request (people show interest; the lecturer
--               is told); 'general' = the lecturer is removed and the request is published for any lecturer.
--   The named lecturer may read the waiting request once asked.
begin;

alter table public.course_requests add column if not exists ask_status text;
alter table public.course_requests drop constraint if exists course_requests_ask_status_check;
alter table public.course_requests add constraint course_requests_ask_status_check check (ask_status is null or ask_status in ('asked','available','unavailable','details'));
alter table public.course_requests add column if not exists ask_note text check (ask_note is null or char_length(ask_note) <= 2000);
alter table public.course_requests add column if not exists ask_seats integer check (ask_seats is null or ask_seats between 1 and 10000);
alter table public.course_requests add column if not exists ask_at timestamptz;
alter table public.course_requests add column if not exists ask_price numeric(12,2);
alter table public.course_requests add column if not exists ask_starts timestamptz;
alter table public.course_requests add column if not exists ask_terms text check (ask_terms is null or char_length(ask_terms) <= 4000);
alter table public.course_requests add column if not exists answered_at timestamptz;

drop policy if exists visible on public.course_requests;
create policy visible on public.course_requests for select to anon, authenticated using (
  status in ('open','closed')
  or (status in ('pending','rejected') and (user_id = (select auth.uid()) or (select public.ish_do('review','view'))
      or (ask_status is not null and lecturer_id = (select auth.uid()))))
);

create or replace function public.ish_request_check(request uuid, action text, payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  r public.course_requests;
  o public.course_request_offers;
  answer text := payload->>'answer';
  note text := left(nullif(btrim(coalesce(payload->>'note', '')), ''), 2000);
  price numeric; seats integer; starts timestamptz; terms text; lname text; mode text := payload->>'mode';
begin
  if actor is null or not exists (select 1 from public.profiles where id = actor and status is distinct from 'blocked' and team_status is distinct from 'suspended')
    then raise exception 'request_sign_in'; end if;
  select * into r from public.course_requests where id = request for update;
  if not found or r.status <> 'pending' then raise exception 'request_unavailable'; end if;

  if action = 'ask' then
    if not public.ish_do('review','approve') then raise exception 'request_permission'; end if;
    if r.lecturer_id is null then raise exception 'request_lecturer'; end if;
    update public.course_requests set ask_status = 'asked', ask_at = now(), answered_at = null where id = r.id;
    insert into public.notices (user_id, title, title_en, body, link, actor, kind)
      values (r.lecturer_id, 'طالب يطلب كورسًا منك: هل أنت متاح؟', 'A student asks you for a course: are you available?', r.title, '#studio-course-request/' || r.id, actor, 'team');
    return jsonb_build_object('ask_status', 'asked');

  elsif action = 'answer' then
    if r.lecturer_id is distinct from actor or r.ask_status is null then raise exception 'request_permission'; end if;
    select l.name into lname from public.lecturers l where l.id = actor and l.status = 'active';
    if not found then raise exception 'request_lecturer'; end if;
    if answer not in ('available','unavailable','details') then raise exception 'request_permission'; end if;
    if answer = 'available' then
      price := nullif(payload->>'price', '')::numeric;
      seats := nullif(payload->>'seats', '')::integer;
      starts := nullif(payload->>'starts_at', '')::timestamptz;
      terms := left(nullif(btrim(coalesce(payload->>'terms', '')), ''), 4000);
      if price is null or price < 0 or price > 9999999999.99 then raise exception 'request_offer_price_required'; end if;
      if seats is not null and seats not between 1 and 10000 then raise exception 'request_permission'; end if;
      insert into public.course_request_offers (request_id, lecturer_id, lecturer_name, terms, price, starts_at, status, terms_public)
        values (r.id, actor, lname, coalesce(terms, 'متاح للتدريس'), price, starts, 'offered', false)
        on conflict (request_id, lecturer_id) do update set terms = excluded.terms, price = excluded.price, starts_at = excluded.starts_at, status = 'offered', terms_public = false;
    end if;
    update public.course_requests set ask_status = answer, ask_note = note, ask_seats = case when answer = 'available' then seats end,
      ask_price = case when answer = 'available' then price end, ask_starts = case when answer = 'available' then starts end,
      ask_terms = case when answer = 'available' then terms end, answered_at = now() where id = r.id;
    perform ishrah_private.alert_team('review',
      case answer when 'available' then 'المحاضر متاح لطلب كورس' when 'unavailable' then 'المحاضر غير متاح لطلب كورس' else 'المحاضر يحتاج تفاصيل عن طلب كورس' end,
      case answer when 'available' then 'The lecturer is available for a course request' when 'unavailable' then 'The lecturer is not available for a course request' else 'The lecturer needs details about a course request' end,
      r.title, '#control-course-request/' || r.id, actor);
    return jsonb_build_object('ask_status', answer);

  elsif action = 'publish' then
    if not public.ish_do('review','approve') then raise exception 'request_permission'; end if;
    if mode = 'announce' then
      select * into o from public.course_request_offers where request_id = r.id and lecturer_id = r.lecturer_id;
      if not found or r.ask_status <> 'available' then raise exception 'request_offer_private'; end if;
      update public.course_request_offers set status = case when id = o.id then 'accepted' else 'declined' end where request_id = r.id;
      update public.course_request_offers set terms_public = true where id = o.id;
      update public.course_requests set status = 'open', published_at = now(), teacher_confirmed = true,
        payment_required = coalesce(o.price, 0) > 0, budget_min = o.price, budget_max = o.price,
        proposed_at = coalesce(o.starts_at, proposed_at), goal = coalesce(r.ask_seats, goal),
        auto_close = case when coalesce(r.ask_seats, goal) is not null then true else auto_close end
        where id = r.id;
      insert into public.notices (user_id, title, title_en, body, link) values
        (r.user_id, 'نُشر طلبك كإعلان كورس', 'Your request was published as a course announcement', r.title, '#course-request/' || r.id),
        (r.lecturer_id, 'نُشر إعلان كورسك بشروطك', 'Your course announcement was published with your terms', r.title, '#studio-course-request/' || r.id);
    elsif mode = 'request' then
      update public.course_requests set status = 'open', published_at = now() where id = r.id;
      insert into public.notices (user_id, title, title_en, body, link) values (r.user_id, 'نُشر طلبك', 'Your course request was published', r.title, '#course-request/' || r.id);
      if r.lecturer_id is not null then
        insert into public.notices (user_id, title, title_en, body, link) values (r.lecturer_id, 'طلب تدريس موجّه إليك', 'A course request names you', r.title, '#studio-course-request/' || r.id);
      end if;
    elsif mode = 'general' then
      delete from public.course_request_offers where request_id = r.id and status = 'offered' and not terms_public;
      update public.course_requests set status = 'open', published_at = now(), lecturer_id = null, lecturer_name = null where id = r.id;
      insert into public.notices (user_id, title, title_en, body, link) values (r.user_id, 'نُشر طلبك لأي محاضر متاح', 'Your request was published for any available lecturer',
        coalesce(note, r.title), '#course-request/' || r.id);
    else
      raise exception 'request_permission';
    end if;
    insert into public.audit (user_id, name, action, target) select actor, p.name, 'publish course request (' || mode || ')', r.title from public.profiles p where p.id = actor;
    return jsonb_build_object('status', 'open', 'mode', mode);
  end if;
  raise exception 'request_permission';
end $$;
revoke all on function public.ish_request_check(uuid, text, jsonb) from public, anon;
grant execute on function public.ish_request_check(uuid, text, jsonb) to authenticated;

notify pgrst, 'reload schema';
commit;
