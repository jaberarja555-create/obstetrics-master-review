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
  (Google, EMAIL + password confirmed by a 6-digit code, or phone + password; phone accounts are stored as `<phone>@phone.ishrah.app`)
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
   **Email accounts:** Authentication → Email Templates → "Magic Link": put the code in the message, e.g. «رمز التأكيد / Your code: {{ .Token }}»
   (the app asks for the 6-digit code, not a link). Authentication → SMTP Settings: connect a real sender (e.g. Resend, Brevo or Zoho with the
   platform's own address); Supabase's built-in sender allows only a few emails an hour and is for testing.
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
  Subject pictures come from the owner's designs and photos (all 54 done; no logos of OET/IELTS/IFOM used, they are trademarks).
  Boxes never follow the scroll (no sticky side columns).
- Colours (owner, 18 Nov 2026, from his banner pictures): royal blue `#0a2a5c` / `#0d3a7d` with bright blue `#1e9bff` / `#3fb4ff`; gold only in the logo
  and small highlights. Every page banner has a photo (`img/ban_<name>.webp`, map `BANIMG` in core.js, fallback by area); no page is left without one.
- No empty space: `IS.balance()` turns a short side column into a row of cards; dashboards use balanced columns (`.cgrid`, `.cols.cflow`).
- The service worker loads the newest files first when online (cache only offline).
- Layout pass (owner, 18 Nov 2026: "areas disorganised, empty spaces on laptops and phones"; "make the Home page clean"):
  - Home = hero · specialities · featured courses · How it works · four boxes. The feature bar (Complete content … Academic services) moved to
    About (top), and "Browse by section" moved to the Specialities page (`sections(cs)` in student.js).
  - Speciality page (`spec/<id>`): subject sections sit in `.sjgrid` and share a row by their number of cards (`--n`; Dentistry Basics 2 +
    Clinical 5 = one row); cards fill their section in even rows (`--c7` at ≥ 1280 px, `--c5` at 901–1279, 3 then 2 a row on tablets/phones;
    a last card alone on its row lies flat across the row). Subjects without a photo show their icon in the same 16:9 picture box.
  - Phones: speciality cards all the same (photo 36 % beside the text; Medicine's name was cut), the feature bar is a list (icon beside text).
  - Courses banner `img/ban_courses.webp` = the five speciality photos side by side (owner: "not only medicine"); his book-spines picture is
    kept as `img/ban_books.webp`.
- Second pass, same day (owner: "colour options in Settings"; "Home not scrolling … clickable buttons as much as we can"; "the library must include
  the other specialities"; "remove all the empty spaces and organise the boxes"):
  - **Colours:** Settings → App colour: Royal blue (default), Teal, Green, Purple, Maroon, Graphite (`ish-pal`, `IS.PALS`, `IS.setPal`). Each colour
    is a whole stylesheet `css/pal-<name>.css` made from css/app.css by `python3 tools/ishrah/palettes.py` (every blue/navy moved to the
    colour's hue, gold and red kept); the head script of index.html loads the chosen one. **Run palettes.py after every change to app.css.**
    Banner photos stay as they are (they are pictures).
  - **Home on one screen** (`.lh`): welcome band with search · five speciality picture buttons · eight place buttons (Courses, My learning,
    Events, Lecturers, Community, My Library, Paths, Teach with us). No scrolling at 1440×900, 1366×768, 1280×720, 1024×768, 768×1024,
    390×844, 412×780 and 390×700 (a 360×640 phone scrolls about 30 px). How it works moved to About.
  - **Library by speciality:** a speciality bar (`#library/@<id>`, `@all`), files carry `spec` (from their subject; `supabase/004_library_specs.sql`
    adds `files.spec` and `requests.spec`), the upload form lists subjects grouped by speciality, the filter is Section + the speciality's subjects,
    cards and the file page name the speciality, requests have a Speciality field.
  - **Requests page:** request-type buttons, figures as one row of tiles, then the form and the student's list side by side at the same height;
    the "Quick suggestions" box was removed (it repeated the request-type buttons).
  - **Even rows everywhere:** `IS.evenRows()` (core.js, after every page and on resize) gives card rows (`.badges .tiles .rkinds .offers .sopts
    .qa …`, map `EVEN` with each card's smallest width) a column count that makes rows even (8 badges = 4 + 4, never 7 + 1 stretched).
    About's "What the platform offers" is `.offers` (it shared the class `.feat` with the feature bar and collapsed into one column).
  - Test inputs for flow.js are now in the repository: tools/ishrah/receipt.png and clip.mp4.
  - **The logo follows the colour** (owner, 18 Nov 2026): palettes.py also writes `img/logo_hero_<colour>.webp` and `img/logo_gold_<colour>.svg`
    (navy background, rod and snake in the colour; gold kept); `IS.logo()` / `IS.logo('hero')` give the right file (top bar, Home, About,
    certificate, control dashboard). Use `IS.logo()` for any new logo, never a fixed file name.
  - **Home speciality buttons, second design** (owner, 18 Nov 2026: "text and pictures look distorted on the phone"): the 520 px photos were
    stretched into wide strips (blurry, cut) with the names on top of them. Now each button is a plain card with the photo at its own shape
    (`.lsi`, 6:5 on laptops; a square thumbnail beside the name on phones and portrait tablets) and the names on the card. Spare height on
    tall laptop screens goes to the welcome band (bigger logo and title). The place button is "Teach" (it wrapped as "Teach with us").
  - The wide Medicine card on phones/tablets shows its description (2 lines) so its width is not empty space (hidden under 660 px high).
  - **Eye comfort** (owner, 18 Nov 2026): Settings → Appearance has four choices (Light, Dark, Eye comfort, Automatic; 2 × 2). Eye comfort =
    `data-theme="eye"` (light rules + warm paper colours + a soft warm filter over the whole screen, `:root[data-theme="eye"]::after`).
  - Courses → **Browse subjects is grouped by speciality** (owner, 18 Nov 2026: it showed only Medicine, the first 12 subjects): four subjects of
    each speciality under its own heading with «كل المواد (N)» to the speciality page; with one speciality chosen, up to 12 of it (`browseSubj`).
  - **Text size works** (owner, 18 Nov 2026: "text size is not working; it should be normal, small and large"): sizes in app.css are px, so the
    old root font-size did nothing. Settings → Text size = Small / Normal / Large (`ish-fs` s / n / l; an old "x" counts as Large), applied as
    `zoom` on `#main` (`--z` .9 / 1 / 1.15; the bars keep their size), set in the head script too. Home's one-screen height divides by `--z`.
    With Large text on phones the speciality cards are one per row (names never cut). Checked: no text cut in any page at Large on a phone.
  - **Profile and Settings without gaps** (owner, 18 Nov 2026): Settings = two columns `.setc` (Language + Appearance | Account + Help) of
    the same height, the boxes share the spare height (lists spread, version line at the foot); Profile = Personal information and the
    About me + Achievements pair are the same height, the three lecturer boxes too (buttons at the foot).
  - **Phone welcome band** (owner, 18 Nov 2026: "this part looks poor"): on phones the band no longer stretches (the spare height goes to the
    speciality cards), it shows the drawn logo (`.lhl2`, IS.logo()) instead of the dark square picture, greeting and title centred beside it,
    search under them; `.gtx` has room below so the dots of «لي» are not cut. The signed-in picture in the phone top bar was hidden by
    `.me span{display:none}` (the avatar is a span too) and showed as a dot: fixed.
  - Home never scrolls now on phones from 360 × 640 up (also 393 × 720, 390 × 844, 412 × 915), tablets and laptops: the space kept for the
    bottom bar on Home matches its real height (70 px, was 84) and a slimmer tier applies at 680 px high or less.
  - **Banner photos in other colours** (owner, 18 Nov 2026: "the colours are not well suited with the banners"): recolouring the photos pixel
    by pixel turned bright blue into neon green, so it was dropped (files removed). Now each colour's CSS shows the ORIGINAL photo with
    `mix-blend-mode: luminosity` over the banner's own colour (a soft duotone; palettes.py `TINT`); Royal blue keeps the photos as they are.
    On phones the control dashboard photo is a faint background (title readable). Green is less saturated (factor .72; icons were lime).
  - The Settings symbol (`gear` in core.js icons) is a real cog now (owner, 18 Nov 2026: it was drawn like a sun and read as a day/night
    button). The sun stays only for the Light option in Appearance.
  - **Real email accounts** (owner, 18 Nov 2026: "the email … must be a real connection with the email, with a password"): sign-in sheet =
    Google · Email | Phone tabs (`IS.AUTHTAB`). Email sign-up: name, email, password (8+), terms → a 6-digit code is sent (`DB.emailCode` =
    signInWithOtp, shouldCreateUser) → code screen (`codeSheet`: resend after 60 s, change email) → `DB.emailVerify` (verifyOtp) →
    `DB.setOwnPassword` (updateUser) → signed in. Email sign-in = email + password (`DB.signInEmail`). «نسيت كلمة المرور؟» on the Email tab sends a
    code and sets a new password (phone accounts keep the support request). The unchecked email box of the phone sign-up is gone; passwords 8+.
    Preview (no database): no email is sent, the code is shown on the screen. `supabase/005_email_accounts.sql`: an email account created
    with a password (not through the code) is refused; invitations by email and the first account becoming the owner wait for the email to be
    confirmed (`ish_join`, trigger `ish_user_confirmed`). Tested on a local Postgres 16 with Supabase stubs (owner after the code, phone
    account, refused password sign-up, invitation applied only after the code, Google invitation at once, unconfirmed stranger gets nothing,
    file runs twice). Browser test: `node tools/ishrah/email.js <shots dir>` (sign-up, wrong code, right code, sign-in, wrong password, forgot password, used email).
    Tests in tools/ishrah set `IS.AUTHTAB='phone'` before signing up by phone.
  - **Edit profile** has the phone number (owner: "the profile shows a phone number but there is no place for it"): email and phone side by
    side; the one used to sign in is locked (`DB.authKind()` = 'email' | 'phone'), the other can be added or changed.
  - **Announcements & News page** (owner, 18 Nov 2026, from his design picture): `#news` (side menu "News"), banner `img/ban_news.webp` cut from
    his picture; "Latest news" (3 cards: picture, tag chip, title, date; «عرض جميع الأخبار» → `#news/all`) beside "Top announcements" (latest 3
    public notices with a pin, «عرض جميع الإعلانات» → `#news/ann`); `#news/<id>` = the news item. News are table `news`
    (`supabase/006_news.sql`, read by all, written with the 'notify' permission); the team writes them in Control → Community → News
    (`control-news`: title, tag Events / Achievements / Initiatives / News / Academic, text, picture, optional notification to everyone).
    Phones: news cards are compact (square picture beside the title). Test: `node tools/ishrah/news.js <shots dir>`.
  - **Offline and downloads inside the platform** (owner, 18 Nov 2026: "nobody can download to the phone, but things can be downloaded in the
    platform and watched without internet: videos, lectures, books and others"): `js/offline.js`.
    - Offline bar `#offbar` under the top bar (grey: offline + «تنزيلاتي»; green for 3 s when back online). The app starts offline: sw.js keeps
      the app files and the two CDN libraries (supabase-js, pdf.js; cache `ish-cdn`, saved copy first); core.js remembers the categories
      (`ish-base`) and the signed-in profile (`ish-me`, used only while offline, `IS.OFFME`); a page that needs the internet shows
      `IS.offEmpty()` with a button to the downloads.
    - Download buttons (`IS.dlBtn`): every lesson (video 360/480/720p chosen in a sheet, `ish-dlq`; written; quiz) in its lesson bar,
      «تنزيل الكورس كاملًا» in the lesson side card (enrolled), and library files (PDF, pictures) on the file page.
    - Store: IndexedDB `ish-offline` (items, chunks, keys). Media are fetched and saved in 4 MB pieces, each AES-GCM encrypted with a
      NON-EXPORTABLE key per account; the lesson text / quiz / file details are encrypted too (`#m`). Not in the phone's files or gallery,
      no download link, another account on the phone cannot list or open them. Honest limit: a determined technical person could still
      record the screen; nothing in a web app can stop that.
    - 30 days, renewed online at most once a day per item (`renew`: lesson still open to the account / file still published; refused →
      deleted). Expired offline → «اتصل بالإنترنت ليتجدد».
    - `#downloads`: counts, space used (navigator.storage.estimate), a list per course and for books, open / delete / delete all, downloads
      in progress with cancel. `#dl/<id>`: the offline viewer (video player without download controls, written lesson, quiz checked on the
      device, PDF pages drawn by pdf.js, pictures).
    - Videos for download come from `GET /api/video?lesson=<id>&dl=480` (signed-in, same permission as watching): a 1-hour signed address of
      the Bunny MP4 file. **Owner's steps:** Bunny Stream library → enable "MP4 Fallback"; its pull zone → Security → Token authentication ON
      and copy its key; pull zone → Headers → add `mp4` to the CORS extension list; Cloudflare Pages `ishrah` secrets `BUNNY_CDN_HOST`
      (e.g. vz-xxxx.b-cdn.net) and `BUNNY_CDN_KEY`. Until then the app says video downloads are not switched on (written lessons, quizzes and
      books download already).
    - Test: tools/ishrah/flow.js step 8b (download the course and a book, switch the connection off, open each from My downloads).

## Owner's to-do list (kept for him; remind him when he asks, owner 18 Nov 2026: "remind me later … for now we build the app itself")
1. **Video downloads:** Bunny Stream library → "MP4 Fallback" ON; its pull zone → Token authentication ON (copy the key) and `mp4` in the
   CORS extensions; Cloudflare Pages `ishrah` secrets `BUNNY_CDN_HOST`, `BUNNY_CDN_KEY`; then try one video download on the live app.
2. **Making the app on Claude** (owner's words; ask him what he means when the time comes).
3. **Email sign-in:** Supabase Email Templates → "Magic Link" with the 6-digit code `{{ .Token }}`; SMTP Settings → a real sender.
4. **Go live** (steps 1–6 under "To go live"): Supabase project, `ISHRAH_DB_URL` + apply database (files 001–006), Bunny secrets,
   js/config.js, owner registers first and turns on 2FA, custom domain with HTTP/3 off.
5. ~~Subject pictures~~ done: all 54 subjects have a picture (18 Nov 2026).
- Courses toolbar on phones and tablets (owner, 18 Nov 2026: "this empty space"): search across the full width, then Filter · Sort · view
  in one even row; the speciality bar is one sliding row below 1180 px (on tablets it broke into two uneven lines).
- **Laptop welcome band, second design** (owner, 18 Nov 2026: "on laptop the main bar still looks bad"; on a 125 % laptop the band was tall with
  the logo and title small in one corner, the search far away, an empty middle and a stray «ية» from text baked into hero_gold.webp): the
  photo `img/hero_band.webp` (hero_gold without its text) shows whole on one side fading into the band; logo (112 px), greeting, title and
  subtitle on the other side with the search right under them. Speciality cards give spare height to their photo (no white space under the
  names on tall screens). Home does not scroll at 1920×1000, 1536×730, 1440×900, 1366×768, 1280×650, 1024×768, 768×1024, 390×844, 360×640.
- Speciality bar on laptops (owner, 18 Nov 2026: "empty space behind Pharmacy"): from 1180 px one even row of six chips across the width
  (Courses and My Library); below 1440 px long names wrap inside their chip instead of being cut. Phones/tablets keep the sliding row.
- Courses on laptops (owner, 18 Nov 2026: "empty space while you scroll"): no tall Filter column; from 1180 px the filter is a row of
  drop-down buttons (Subject · Lecturer · Price, one open at a time, a click outside closes it) placed in the same row as search, sort and
  view; results and Browse subjects take the full width.
- Same day, more owner fixes: Support has «طلب خاص» / Special request (ticket kind `special`, Support department); About's Vision · Mission ·
  Values fill their row (the grid kept an empty 4th slot); `.g2f` forms use auto-fit; the lecturer application's qualification is a grouped
  list per speciality (`IS.QUALS`: Medicine, Dentistry, Pharmacy, Laboratory Science, Nursing, Higher degrees + Other) and `IS.pick` accepts
  groups `{g, o}`; professional titles and specialty choices include the other specialities. Banner titles: `IS.banner` gives h1 `tl2`
  (> 20 chars) / `tl3` (> 30) for smaller type and more text room, so long English titles keep to one line. Control → Specialities, sections
  and subjects: each speciality box lists its subjects section by section (heading with icon and count) as aligned tiles (picture, English,
  Arabic, pen); two tiles a row on phones.
- **Photos keep their own colours** (owner, 18 Nov 2026: "the colours cover the image in a bad way; remove the effect of colours on photos"):
  the duotone tint (palettes.py `TINT`, mix-blend luminosity) is removed; every banner photo shows as it is in every app colour. On phones the
  banner photo is a clear strip across the top with the title under it (it was faded behind the text); the control dashboard banner too.
  The thin curve beside banner photos uses `--sky2`, so it follows the colour.
- **Our team page** (owner, 18 Nov 2026: "a nice place for the admins and other staff with their photos, so people know them and can reach
  them"): `#team` (side menu "Our team", banner ban_community), Leadership (owner, GM; bigger cards) then Departments and team (one centred
  grid, department chip on each card, «راسل …» buttons per department). A card = photo (profile photo, else initials), name, title shown
  (or the role name), short bio, «راسل» = a platform message to that person's department (ticket kinds via `TMSG`). Only staff who switch
  on «اعرض في صفحة فريق المنصة» appear: their own Profile → «بطاقتي في فريق المنصة», or a manager in Users & permissions (same fields,
  `IS.pubFields` / `IS.pubRow`). `supabase/007_team_page.sql`: profiles.pub_show / pub_title / pub_bio / pub_order and RPC
  `ish_team_public()` (anon + signed-in) returning ONLY the public card fields of shown, active staff; no phone or email ever. Tested on
  the local Postgres (hidden member absent, visitor cannot read profiles). Test: `node tools/ishrah/team.js <shots dir>`.
