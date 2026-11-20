-- اشرح لي · 047: remove comments saved twice (owner, 20 Nov 2026: "I put a comment and it came duplicated"). From asset version 194 the app
-- sent some comment requests twice (a supabase request builder runs again on every then(); fixed in js/db.js). A copy is a row with the same
-- writer, the same place and the same text written within 10 seconds after an earlier one; the earlier row stays. Safe to run again.

delete from public.replies r using public.replies o
where r.user_id = o.user_id and r.body = o.body and r.id <> o.id
  and r.post_id is not distinct from o.post_id and r.course_id is not distinct from o.course_id and r.event_id is not distinct from o.event_id
  and r.news_id is not distinct from o.news_id and r.announcement_id is not distinct from o.announcement_id and r.parent_id is not distinct from o.parent_id
  and r.created_at > o.created_at and r.created_at < o.created_at + interval '10 seconds';

delete from public.library_comments r using public.library_comments o
where r.user_id = o.user_id and r.body = o.body and r.id <> o.id
  and r.file_id is not distinct from o.file_id and r.series_id is not distinct from o.series_id and r.parent_id is not distinct from o.parent_id
  and r.created_at > o.created_at and r.created_at < o.created_at + interval '10 seconds';

delete from public.course_request_comments r using public.course_request_comments o
where r.user_id = o.user_id and r.body = o.body and r.id <> o.id
  and r.request_id = o.request_id and r.parent_id is not distinct from o.parent_id
  and r.created_at > o.created_at and r.created_at < o.created_at + interval '10 seconds';
