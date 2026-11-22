-- SMRA · 056: deals stay inside the platform (owner, 22 Nov 2026: «ممكن محاضر او طالب يتحايل علي المنصه ويتواصلو مع بعض ويمشو
-- يتفقو في الخاص خارج المنصه … كيف اقدر احمي الحاجه دي»).
--   1. A lecturer's WhatsApp, Telegram and email are no longer public: they move from lecturers.links to profiles.private_links
--      (readable only by the person and the team, like the rest of the profile). Students write to the lecturer inside the platform.
--   2. Phone numbers, WhatsApp / Telegram links and email addresses written by students or lecturers in posts, comments, course and
--      request texts, offers, lecturer messages, events, library texts and bios are replaced by «[رقم محجوب]» etc. Words that point
--      outside («كلمني واتساب», «على الخاص») are kept but flagged. Every hit goes to the activity log with the original text and alerts
--      the team. The team's own writing and messages to the team are left alone.
-- Safe to run again.
begin;

alter table public.profiles add column if not exists private_links jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------- what counts as a way to reach someone outside
create or replace function ishrah_private.contact_mask(t text) returns text
language plpgsql immutable set search_path = '' as $$
declare s text;
begin
  if t is null or t = '' then return t; end if;
  -- Arabic-Indic and Persian digits count as digits
  s := translate(t, '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789');
  s := regexp_replace(s, '[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}', '[بريد محجوب]', 'g');
  s := regexp_replace(s, '(https?://)?(www\.)?(wa\.me|(api|chat|web)\.whatsapp\.com|whatsapp\.com|t\.me|telegram\.(me|dog|org))(/[^[:space:]]*)?', '[رابط محجوب]', 'gi');
  s := regexp_replace(s,
    '\+[0-9]([[:space:].()-]?[0-9]){8,}' ||
    '|(?<![0-9])00[0-9]([[:space:].()-]?[0-9]){8,}' ||
    '|(?<![0-9])249([[:space:].-]?[0-9]){9}(?![0-9])' ||
    '|(?<![0-9])0[19]([[:space:].-]?[0-9]){8}(?![0-9])' ||
    '|(?<![0-9])9[0-9]{8}(?![0-9])', '[رقم محجوب]', 'g');
  if s = translate(t, '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789') then return t; end if;   -- nothing found: text unchanged
  return s;
end $$;

create or replace function ishrah_private.contact_words(t text) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(t, '') ~* ('(واتس|وتساب|whats[[:space:]]*app|تلقرام|تليقرام|تلغرام|تليجرام|تيليجرام|telegram|انستقرام|انستغرام|instagram|سناب[[:space:]]*شات|snapchat|ماسنجر|messenger|ايمو|imo'
    || '|(في|على|علي|ع|بال)[[:space:]]*ال?خاص|inbox|انبوكس|dm[[:space:]]+me'
    || '|رقم[[:space:]]+(تلفوني|تلفونى|هاتفي|جوالي|موبايلي|الواتس|واتساب)|رقمي[[:space:]]*(هو|:)'
    || '|(بره|برا|خارج)[[:space:]]*(المنصة|المنصه|التطبيق))')
$$;

-- ---------------------------------------------------------------- one trigger for every table people write in
-- tg_argv = the text columns to check
create or replace function ishrah_private.contact_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  j jsonb; o jsonb; c text; v text; m text; masked boolean := false; flagged boolean := false; sample text := ''; who uuid := auth.uid(); wname text;
begin
  if who is null or public.ish_staff() then return new; end if;
  -- messages to the platform team stay as written; only a request between a student and a lecturer is checked
  j := to_jsonb(new);
  if tg_table_name = 'ticket_msgs' and not exists (select 1 from public.tickets t where t.id = (j ->> 'ticket_id')::uuid and t.lecturer_id is not null) then return new; end if;
  o := case when tg_op = 'UPDATE' then to_jsonb(old) else '{}'::jsonb end;
  foreach c in array tg_argv loop
    if not (j ? c) or jsonb_typeof(j -> c) <> 'string' then continue; end if;
    v := j ->> c;
    if v is null or v = '' or v is not distinct from (o ->> c) then continue; end if;
    m := ishrah_private.contact_mask(v);
    if m is distinct from v then masked := true; j := jsonb_set(j, array[c], to_jsonb(m)); sample := left(v, 300);
    elsif ishrah_private.contact_words(v) then flagged := true; if sample = '' then sample := left(v, 300); end if; end if;
  end loop;
  if masked or flagged then
    begin
      select p.name into wname from public.profiles p where p.id = who;
      insert into public.audit (user_id, name, action, target)
      values (who, coalesce(wname, ''), case when masked then 'contact masked' else 'contact words' end, tg_table_name || ' · ' || sample);
      perform ishrah_private.alert_team('community',
        case when masked then 'حُجب رقم أو رابط تواصل كتبه ' else 'كلام عن التواصل خارج المنصة من ' end || coalesce(wname, ''),
        case when masked then 'Contact details hidden, written by ' else 'Talk of contact outside the platform by ' end || coalesce(wname, ''),
        left(sample, 160), '#control-audit', who);
    exception when others then null;   -- the log and the alert never stop the person's action
    end;
  end if;
  if masked then new := jsonb_populate_record(new, j); end if;
  return new;
end $$;
revoke all on function ishrah_private.contact_guard() from public, anon, authenticated;

do $$
declare r record;
begin
  for r in select * from (values
      ('posts', 'title,body'), ('replies', 'body'), ('course_request_comments', 'body'), ('course_request_messages', 'body'),
      ('course_request_offers', 'terms'), ('course_requests', 'title,details,rules,ask_note,ask_terms'), ('library_comments', 'body'),
      ('ticket_msgs', 'body'), ('courses', 'title,subtitle,about,teaching_method'), ('lessons', 'title,body'), ('events', 'title,about'),
      ('lecturers', 'title,bio'), ('files', 'title,author,about'), ('reviews', 'body'), ('profiles', 'bio,pub_bio')) as x(t, cols)
  loop
    if to_regclass('public.' || r.t) is null then continue; end if;
    execute format('drop trigger if exists ish_contact_guard on public.%I', r.t);
    execute format('create trigger ish_contact_guard before insert or update on public.%I for each row execute function ishrah_private.contact_guard(%s)',
      r.t, (select string_agg(quote_literal(c), ',') from unnest(string_to_array(r.cols, ',')) c));
  end loop;
end $$;

-- ---------------------------------------------------------------- a lecturer's private contacts never sit on the public page
create or replace function ishrah_private.lecturer_private_links() returns trigger
language plpgsql security definer set search_path = '' as $$
declare k jsonb;
begin
  if new.links is null or jsonb_typeof(new.links) <> 'object' then return new; end if;
  k := jsonb_strip_nulls(jsonb_build_object(
    'whatsapp', nullif(btrim(new.links ->> 'whatsapp'), ''), 'telegram', nullif(btrim(new.links ->> 'telegram'), ''), 'email', nullif(btrim(new.links ->> 'email'), '')));
  if k <> '{}'::jsonb then
    update public.profiles set private_links = coalesce(private_links, '{}'::jsonb) || k where id = new.id;
  end if;
  new.links := new.links - 'whatsapp' - 'telegram' - 'email';
  return new;
end $$;
revoke all on function ishrah_private.lecturer_private_links() from public, anon, authenticated;
drop trigger if exists ish_lecturer_private_links on public.lecturers;
create trigger ish_lecturer_private_links before insert or update of links on public.lecturers
  for each row execute function ishrah_private.lecturer_private_links();

-- the contacts already on public pages move now
update public.lecturers set links = links where links ?| array['whatsapp', 'telegram', 'email'];

notify pgrst, 'reload schema';
commit;
