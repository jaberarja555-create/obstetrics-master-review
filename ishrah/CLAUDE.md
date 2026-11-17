# اشرح لي (Ishrah Li): learning platform for medical students in Sudan

Owner: Dr. Abdaljalil Abdalkareem Arja. Separate from the three books and from Student Master Review (owner, 17 Nov 2026:
"forget about my books and the library for now; the main concern is to build the app and every page ready").
Plain static app (HTML/CSS/JS, no build step) in this folder, with two Cloudflare Pages Functions and a Supabase database.

## Working from either of the owner's Claude accounts
- Code lives in `obstetrics-master-review/ishrah/` (GitHub jaberarja555-create/obstetrics-master-review). Both accounts can work on it as long
  as their GitHub connection reaches that repository. Branch for this work: `ccr-38b3f943-ba1ode` (preview) until the owner approves; then
  merge to `main` (live). Before starting: `git fetch origin && git checkout ccr-38b3f943-ba1ode && git pull`, read this file and
  `git log --oneline -15 -- ishrah`. Push back to the same branch. Never put keys or passwords in the repository (it is public).
- Preview deploy: every push touching `ishrah/` runs `.github/workflows/ishrah.yml` → Cloudflare Pages project `ishrah`
  (branch preview https://ccr-38b3f943-ba1ode.ishrah.pages.dev, main → https://ishrah.pages.dev).
- The app without a database (js/config.js empty) is a PREVIEW: all data stays in that browser (localStorage + IndexedDB), the first
  account created is the owner. Good for showing every page; not for real students.

## Files
- `index.html` shell · `css/app.css` look · `js/config.js` connection (Supabase URL + anon key, Bunny library id; empty = preview)
- `js/db.js` data layer: the same calls for the preview store and Supabase (`DB.q/one/ins/upd/del/upload/fileUrl/videoUpload/videoPlay/lesson`)
- `js/core.js` language, icons, router (`IS.page(name, render, {auth, perm, area, lec})`), permissions `IS.can(section, action)`, shell, sign-in
  (Google or phone + password; phone accounts are stored as `<phone>@phone.ishrah.app`)
- `js/student.js` Home, courses, course page + Bankak payment, lesson player, my learning, lecturers, events, community, notifications,
  favourites, achievements, certificate, account (profile), about, terms
- `js/library.js` My Library and library requests (kept, not developed further for now)
- `js/studio.js` lecturer studio: apply, dashboard, course builder (sections, video/written/quiz lessons, free previews, send for review),
  page designer, events, students, questions, earnings + payout request
- `js/control.js` control app pages: overview (`IS.ctrlOverview`), payments, course review, lecturer requests, lecturers & shares, payouts,
  students, library, requests, community moderation, events, announcements, categories, settings, activity log, reports, learning paths
- `js/org.js` organisation: messages/tickets (no WhatsApp anywhere: every request reaches its department inside the platform), tasks,
  a dashboard per role, Users & permissions (staff accounts, invitations, editable action matrix), two-factor login (TOTP)
- `functions/api/video.js` Bunny Stream: upload permission for the lesson's lecturer, signed player address for allowed students
- `functions/api/admin.js` set a temporary password (support / owner) with the service key
- `supabase/001_schema.sql`, `002_org.sql` database, row-level security, triggers. Run in order; both are safe to run again.

## Organisation (owner's hierarchy, 17 Nov 2026)
Owner (Super Admin) → General Manager → Academic Director · Finance Manager · Content & Library Manager · Community & Events Manager ·
Technical Manager · Support Manager → Supervisors & Staff. Each signs in at the same address and lands on the dashboard of their role.
Permissions = per role, per section, actions view · add · edit · delete · approve (`role_perms`; edited in Control → Users & permissions).
Staff get personal sections (`p:<section>`, `p:<section>:approve`), a department, a direct manager, an approval level (none · dept · full)
and 2FA (required by default for invited staff). The database enforces all of it (`ish_do(section, action)` in every write policy): a
suspended or blocked account, a missing 2FA step (aal2) or an approval level "none" all stop the action server-side. Only the owner touches
the owner and general-manager roles; the activity log (`audit`) can be written but never edited or deleted.
Tested on a local Postgres with Supabase-like stubs (17 Nov 2026): self-promotion refused, GM cannot change or appoint the owner/GM,
staff with approval "none" cannot approve, finance blocked without 2FA and allowed with it, finance sees only finance tickets, invitations
applied at sign-up, lesson content hidden from non-enrolled students, forgot-password request without signing in.

## To go live (owner's steps; Claude cannot do these without his accounts)
1. Supabase: create a NEW project «ishrah». Authentication → Providers: Email ON with "Confirm email" OFF (phone accounts use it), Google ON
   (Google Cloud OAuth client; redirect URL from Supabase). Authentication → Multi-factor: TOTP ON. URL configuration: add the site address.
2. Database: GitHub secret `ISHRAH_DB_URL` (Session pooler string of the new project), then Actions → Ishrah → Run workflow → tick "apply database".
3. Bunny Stream: create a library, turn on "Token authentication"; Cloudflare Pages project `ishrah` → Settings → Variables (secrets):
   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, BUNNY_LIBRARY, BUNNY_API_KEY, BUNNY_TOKEN_KEY.
4. `js/config.js`: supabaseUrl, supabaseAnonKey (public) and bunnyLibrary; push.
5. The owner registers FIRST (the first account becomes the owner), turns on 2FA under Security, then invites the team.
6. Domain: add the custom domain to the Pages project `ishrah`, and switch off HTTP/3 (QUIC) for it in Cloudflare (Sudanese networks break it).

## Tests
Browser journeys (preview mode): serve `ishrah/` on port 8820 (`python3 -m http.server 8820 -d ishrah`), then
`node tools/ishrah/flow.js <shots dir> 1440` (owner → lecturer → course → payment → certificate) and `node tools/ishrah/flow2.js <shots dir> 390`
(team, 2FA, tasks, student message answered by Finance). Run each at 1440 and 390; they print "OK, no errors" and any element running off the screen.

## Navy and gold design (owner, 18 Nov 2026)
- Look: navy surfaces with gold accents everywhere (CSS block "navy and gold design" at the end of css/app.css overrides the older teal one);
  gold logo `img/logo_gold.svg` (cap with the rod of Asclepius over an open book), hero picture `img/hero_gold.webp` (no logo on it).
- **Titles: big English, small Arabic under it** (`IS.T(ar, en)`; English mode shows English only). Names of specialities, sections, subjects and
  menu items are English with the Arabic small (`IS.navLbl`). Write every new title this way.
- **Specialities** (table `specialties`, `supabase/003_specialties.sql`): Medicine, Laboratory Science, Nursing, Dentistry, Pharmacy, each with a
  picture `img/sp_<id>.webp`; subjects and courses carry `spec`. Pages: `specialties`, `spec/<id>`; catalogue speciality bar (`courses/@<id>`);
  admin in Control → Specialities, sections and subjects.
- **Sections**: Basics · Clinical · International Exams (id `special`) · House Officer (Local exam, Internship exam, Clinical work).
  Medicine clinical subjects include Radiology, ENT, Anaesthesia, Ophthalmology, Dermatology.
- **Settings page** (`#settings`): language, appearance (light/dark/automatic), text size, account, help. No language or theme buttons in the top bar.
- **Choice lists with "Other"** (`IS.pick`): specialty, professional title, university, city; "Other (type it)" opens a box.
- Lecturer teaching sample: upload a file (≤ 50 MB, `sample_file`) or a link.
- Home: hero, specialities, feature strip, sections, featured courses (or "first courses on their way"), How it works, events, teach card.
  Control dashboard: "Getting the platform ready" checklist for owner/GM.
- International Exams subjects: USMLE, PLAB, MRCP, MRCS, MRCOG, MRCPCH, IFOM, Canada exams (MCCQE), Australia exams (AMC), OET, IELTS.
- Responsive pass (18 Nov 2026): `node tools/ishrah/fit.js` (app served on :8820) visits every page at 390/768/1024/1440 and lists anything wider
  than the screen; uneven card rows centre their last row; on tablets the course price box comes right after the header.
- Home has no side column: events, figures, community and "Teach" are one even row (`.hboxes`), so no empty space appears beside short content.
- Subject card pictures: the owner makes them from `ishrah/pictures-needed.md` (14 prompts, 2×2 grids); cut with
  `python3 tools/ishrah/cut.py <picture> <id> <id> <id> <id>` → `img/sub_<id>.webp` + `js/subimg.js`. The team can also upload one per subject.
- Owner's design (18 Nov 2026): the side menu stays on every page (the owner rejected a top menu on 18 Nov 2026), hero = logo
  (`img/logo_hero.webp`) · title and four features · books picture; speciality cards are horizontal (photo on the left in Arabic), subject cards
  have the picture on top and a gold "Soon" label, House Officer subjects are wide cards, section cards have pictures `img/sec_<id>.webp`.
  Subject pictures come from the owner's designs and photos (46 of 54 done; no logos of OET/IELTS/IFOM used, they are trademarks).
  Boxes never follow the scroll (no sticky side columns).
- Colours (owner, 18 Nov 2026, from his banner pictures): royal blue `#0a2a5c` / `#0d3a7d` with bright blue `#1e9bff` / `#3fb4ff`; gold only in the logo
  and small highlights. Every page banner has a photo (`img/ban_<name>.webp`, map `BANIMG` in core.js, fallback by area); no page is left without one.
- No empty space: `IS.balance()` turns a short side column into a row of cards; dashboards use balanced columns (`.cgrid`, `.cols.cflow`).
- The service worker loads the newest files first when online (cache only offline).
