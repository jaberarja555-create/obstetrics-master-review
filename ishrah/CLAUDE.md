# اشرح لي (Ishrah Li): learning platform for medical students in Sudan

Owner: Dr. Abdaljalil Abdalkareem Arja. Separate from the three books and from Student Master Review (owner, 17 Nov 2026:
"forget about my books and the library for now; the main concern is to build the app and every page ready").
Plain static app (HTML/CSS/JS, no build step) in this folder, with two Cloudflare Pages Functions and a Supabase database.

## Continue from ChatGPT or Claude

- Repository: [jaberarja555-create/obstetrics-master-review](https://github.com/jaberarja555-create/obstetrics-master-review). The Ishrah Li app is in `ishrah/`. The shared working branch is `ccr-38b3f943-ba1ode`. Fetch it, check it out, and fast-forward before editing. Use `git log --oneline -15 -- ishrah` to confirm the latest work. Any account with repository read access can pick up here. Publishing changes requires GitHub write access.
- A push that touches `ishrah/` on the shared branch runs the [Ishrah workflow](https://github.com/jaberarja555-create/obstetrics-master-review/actions/workflows/ishrah.yml). It publishes the branch to Cloudflare Pages and to the live site at [ishrahli.org](https://ishrahli.org/). GitHub’s `main` branch serves the Obstetrics book project and is separate from this deployment.
- Review any branch that contains additional Ishrah commits before integrating it. Use an empty `js/config.js` in an isolated local copy for preview data. Production data lives in Supabase, and deployment credentials live in the connected services. Keep credentials out of GitHub files and chats.

## Latest verified handoff

- As of 19 November 2026, the live application is at `b164b78` (asset version `149`). The [deployment run](https://github.com/jaberarja555-create/obstetrics-master-review/actions/runs/44580635473) applied the latest migrations and published successfully. The live page references `js/sell.js?v=149`.
- The last feature is paid and free library uploads by students or lecturers, with searchable tags, ordered file series, library staff publication, Bankak receipt review by Finance, and seller earnings and payouts. See the detailed library notes at the end of this file.
- Community posts and course requests publish inside their study space. Reports go to Control → Community. Library uploads still go through publication review. Latest database migration: `023_paid_library.sql`.

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
- Lecturers page has a speciality bar (`IS.LSPEC`, `IS.ACT.lspec`): a lecturer counts under the specialities of their courses, or the one
  their speciality / title / tags names (Medicine when nothing matches); each button shows how many lecturers it has.
- Use the shared branch described under “Continue from ChatGPT or Claude” at the top of this file.

## Speciality spaces (owner, 18 Nov 2026: "all specialities in one place is confusing … the student must choose and then be in a place for that speciality only")
- The app opens on the start page `#pick` (logo, sign in / create account, five speciality cards); every student page leads there until a speciality
  is chosen (gate in `IS.route`). The choice is `IS.SPEC` (device `ish-spec` + `profiles.spec`; a signed-in account's saved speciality wins).
- After the choice the student area shows that speciality only: `IS.pubCourses()` returns its courses, Home = welcome band, shortcuts and the
  speciality's own space (`IS.specPage`: subjects by section, its courses), Courses / Library / Lecturers have no speciality bar, Events,
  Community posts and Learning paths are filtered with `IS.inSpec` (items without a speciality are for everyone; new posts get the speciality;
  lecturers choose an event's speciality). Change: the speciality box at the top of the side menu, Settings → Your speciality, or `#pick`.
- Studio and Control are not filtered (they manage every speciality). Database: `supabase/008_spec_spaces.sql`.
- Tests: `tools/ishrah/space.js` (start page, choice, filtered pages, change). Tests that start from an empty browser must set
  `localStorage['ish-spec']` first. `flow.js` / `flow2.js` still use the old phone sign-up form and need updating to the email form.
- Research writing (owner, 18 Nov 2026, «كتابة بحث»): a request type in My Library → Requests (`research`: kind of research, stage, deadline added
  to the details; «Chapters you need» (Full research ticks all; topic and title, Chapter 1 Introduction … Chapter 5 Discussion, conclusion, abstract,
  references) and «Other services» (proposal, questionnaire, sample size, analysis only, data entry, editing, plagiarism, formatting, defence
  presentation, journal, other); no approvals to order (owner: «be smart»); Chapter 4 or Analysis only opens «Which analysis?» and the program; the form takes the full width while research is chosen; test tools/ishrah/research.js)
  and a Support message type «المساعدة في كتابة بحث» that reaches the academic team.
- **Colour stylesheets (owner saw old designs on his laptop, 18 Nov 2026):** a chosen app colour loads `css/pal-<colour>.css` INSTEAD of
  app.css, so every CSS change is invisible in those colours until `python3 tools/ishrah/palettes.py` is run. Run it before every commit
  that touches css/app.css, and bump `?v=` in index.html.
- Start page on laptops/tablets: header band (logo, name, sign-in buttons, books photo `hero_band.webp` fading in from the side), then the
  five cards (one row on laptops, 3 + 2 centred on tablets). `hero_gold.webp` replaced by the clean `hero_band.webp` (it carried a cut word).
- Phones/tablets (Android smearing while scrolling, 18 Nov 2026): the top bar is `position:fixed` (body padding `--toph`, set by `topH()` in
  core.js), and on touch screens there are no mask-images, no CSS filters, no backdrop blur and no hover lifts. Keep it that way.
- **Live address (owner, 18 Nov 2026):** every push to `ccr-38b3f943-ba1ode` is also published as the LIVE site of the Pages project `ishrah`
  (https://ishrah.pages.dev, custom domain https://ishrahli.org once added in Cloudflare → Workers & Pages → ishrah → Custom domains).
  Push to that branch (as well as the other account's) for a change to reach the domain. Still the preview store (no database yet).
- Android scroll smearing, third pass: no `dvh` units (use `svh`, stable while the address bar hides), `overflow-x:clip` on html/body,
  CSS `zoom` on #main only when a text size other than Normal is chosen. Do not bring dvh back.
- Preview Google button: asks the Gmail address and a 6-digit code (`IS.SUB.gpreview`, `PEND.google`); never signs in by the address alone. Live = real Google.
- **Going live (18 Nov 2026), progress:** Hostinger mailboxes no-reply@ and support@ishrahli.org made; 9 Hostinger email DNS records copied to
  Cloudflare (MX mx1/mx2, SPF, DMARC, DKIM a/b/c CNAMEs, autodiscover, autoconfig, CNAMEs DNS only); Hostinger nameservers changed to
  derek / zainab .ns.cloudflare.com (waiting for Cloudflare "active"); DNSSEC off. Supabase project (Ireland): URL
  https://fglawgpusfbgkokpnoej.supabase.co, publishable key sb_publishable_kEhLRQjZuYzKNFyyMGKhPA_QGuC3q25 (public). **Do not put them in
  js/config.js until the database files are applied** (the app switches to live mode as soon as config.js has them). Functions accept the new
  sb_secret_ server key (apikey header only).
- **LIVE (18 Nov 2026):** https://ishrahli.org and www (Cloudflare Pages custom domains on project ishrah) run on the real database.
  Done: ISHRAH_DB_URL secret, database applied (workflow trims spaces/quotes around the secret), config.js filled, Supabase custom SMTP
  (smtp.hostinger.com 465, no-reply@ishrahli.org), Magic Link + Confirm signup templates with {{ .Token }}, OTP length 6, "Confirm email" ON,
  Site URL https://ishrahli.org + redirects (ishrahli.org, www, ishrah.pages.dev, *.ishrah.pages.dev), Cloudflare Pages vars SUPABASE_URL /
  SUPABASE_ANON_KEY / SUPABASE_SERVICE_KEY (secret), Google OAuth (Google Cloud project "Ishrah Li", client 989457790089-fus9tth5n26bcpkhansb0539glvfummi,
  in production, no logo so no verification). The owner registered first by email (Owner) and turned on 2FA; a Google sign-up works (student).
  Fixes found live: ish_new_user no longer refuses accounts with a password (Supabase gives OTP sign-ups a random one: "Database error saving
  new user"); #security is exempt from the speciality gate and keeps the area. HTTP/3 off for ishrahli.org and Supabase email rate limit 100/h (owner confirmed).
  Videos: Bunny not set up yet (owner: later).
- **Video from a link until Bunny (owner, 18 Nov 2026: "do all your recommendations"):** a video lesson can take a YouTube (unlisted) or Google
  Drive link (studio lesson editor, `IS.ACT.vlink`); stored in `lessons.video_id` as `yt:<id>` / `gd:<id>` (`IS.extVideo` parses links, `IS.extEmbed`
  gives the iframe: youtube-nocookie embed with rel=0, Drive /preview), so `ish_lesson` hides it from students who may not watch, like an upload.
  `DB.videoPlay` returns the embed without calling api/video; link lessons cannot be downloaded (no button; `extlink` message). While
  `ISH_CONFIG.bunnyLibrary` is empty the upload box is replaced by a "coming soon" note. Tips shown: Unlisted not Private, age-restricted
  medical videos do not embed, Drive only for small groups; paid lessons (price > 0, not a free preview) get a warning that links can be shared.
  When Bunny is set up, uploading a file replaces the link lesson by lesson.
- **Lecturer guide (owner, 18 Nov 2026: "the guide … and guidance about the type of video and lectures and our terms for acceptance, quality,
  noise"):** page `#studio-guide` (js/guide.js, open to everyone): publishing in 6 steps, video standards (picture, sound, slides, length),
  content standards, acceptance terms (what the review checks + not allowed + returned with notes), after publishing. Linked from the studio
  menu, the dashboard quick actions, the apply page and the lesson editor. "Send for review" now needs the tick «I confirm the course meets the
  standards… my own work… identifies no patient» (`#gdok`). Wording of the terms is mine; the owner may change it.
- **No internet on the live site (owner, 18 Nov 2026: the home page kept spinning offline):** supabase-js waits for a session refresh that never
  comes, so `IS.route` now shows the offline card at once when `navigator.onLine` is false (pages in `OFFOK` still open: downloads, dl,
  settings, terms, pick, studio-guide) and any page still loading after 12 s shows "connection very weak" + Try again. Back online, that page
  reopens by itself. `IS.loadMe` keeps the account signed in offline from `ish-me` even when the session could not be renewed (sign-out clears it).
  Tested with the real supabase-js in Chromium (served locally), going offline mid-use and starting offline.
- **Android smear test switch (owner, 18 Nov 2026: the friend still sees it after three passes):** `ishrahli.org/?safe=N` (kept on that device in
  `ish-safe`, head script in index.html sets `html[data-safe]`, red "SAFE N" label at the top): 1 = all off, 2 = top/bottom bars not fixed,
  3 = no shadows/animations/blur/blend, 4 = no banner pictures; `?safe=0` back to normal. Use the friend's answers to make the real fix.
- **Saved page copies offline (owner, 18 Nov 2026: offline card was not enough):** every page a signed-in account opens online (not dl, lesson,
  control, security, studio-lesson, pay) is kept as its last HTML in localStorage (`ish-pg:<hash>`, index `ish-pgx`, 25 pages, 300 kB max each,
  tied to the account id); without internet that copy shows under a note "last saved copy"; pages never opened show the offline card.
  Sign-out clears them (`IS.clearCopies`).
- **Google's own button (owner, 18 Nov 2026: students saw "Sign in to fglawgpusfbgkokpnoej.supabase.co"):** with `ISH_CONFIG.googleClientId`
  the sign-in sheet loads https://accounts.google.com/gsi/client and renders Google's button (`IS.gsiMount`, popup, FedCM); its ID token goes to
  `sb.auth.signInWithIdToken` (`DB.googleToken`, raw nonce to Supabase, SHA-256 nonce to Google), so Google names ishrahli.org. If the script
  fails, our button and the old redirect stay. Google Cloud client needs every site address as an Authorized JavaScript origin
  (https://ishrahli.org, https://www.ishrahli.org, https://ishrah.pages.dev for previews).
- **Request changes on a lecturer application (owner, 18 Nov 2026):** status `changes` + note (control-apps «Request changes», `IS.ACT.appchg`,
  notification to the applicant); the applicant sees the notes on #studio-apply, edits and sends again («Send the updated request» → pending;
  the reviewer sees «Updated after you asked: …» and gets a notification). Migration 009_app_changes.sql: update policy allows status
  pending/changes; ish_guard lets the applicant move changes → pending only.
- **Roles shown (owner, 18 Nov 2026: "identify someone as admin or lecturer or student, or 2 things"):** `IS.myRoles()` = team role (control),
  Lecturer (studio, when approved), Student only when neither (owner: "if lecturer or admin don't put student"); `IS.roleChips()` shows them as coloured chips that open each space: on Home under the
  greeting when an account has 2+ roles, and at the top of the More sheet. The studio switch (side menu, More) appears only for approved
  lecturers. Approved lecturers see "Lecturer studio / Open the studio" instead of "Join as lecturer", and Home "Teach" becomes "My studio".

- **Phone page review, continued (18 Nov 2026, after the other account hit its limit mid-review):** welcome message no longer writes «د.»
  twice (`IS.drName` strips a title already in the name); My Library title is English-big like every page and its tabs are a 3-a-row grid on
  phones; Profile shows the real role (e.g. مالك المنصة) instead of «طالب طب»; Support request types 2 a row on phones; My downloads
  storage line reads the right way round in Arabic and an empty list shows 0 KB; every visible file box uses the app's own button and
  language (`IS.fileUI`, also for boxes added later; hidden pickers such as the profile photo are left alone). Test (preview copy with an
  empty config.js served on a port): `PORT=8821 node tools/ishrah/phone.js "<pages>" <shots dir>` lists text cut off, things wider than the
  screen and doubled greetings for each page.
- **No more preview branches (owner, 18 Nov 2026: "no need to work with branches, now the domain works"):** every finished change goes
  straight to the live site: push to `ccr-38b3f943-ba1ode` (it publishes https://ishrahli.org). Either account: fetch, continue from that
  branch, push back to it (and to the account's own session branch only if the session requires it). Test in a local preview copy first.
- **Start page on one screen** (owner, 18 Nov 2026: "not well organised, scrolling for nothing" on phone and tablet): `IS.fitPick()` gives
  `.pick` exactly the height left on the screen and the speciality cards share it (photo grows, names stay). Phones: Medicine across the
  top, the other four 2 × 2; laptops and landscape tablets: five in a row; portrait tablets: 3 + 2. No scroll at 360×640 … 1440×900
  (test: `PORT=8821 node tools/ishrah/pick.js "<sizes>" <shots dir>`).
- **Android tablets, fourth pass** (ghost copies while scrolling, side menu leaving an empty strip at the bottom): on touch screens
  (`hover:none`) the side menu is `100lvh` tall, the fixed bars are on their own layer (translateZ), and page cards have no shadows,
  transitions or animations. If the owner still sees ghosts, ask him to try `?safe=1…4` and tell which number stops it.
- The old phone sign-up in flow.js / flow2.js: they now set `ish-spec` and take `PORT`; flow.js stops at «publish course» (`[data-act=cpub]`)
  in the review screen — still to update.
- **Whole-app check (owner, 18 Nov 2026: "2 search places and the sign-in duplicated … I don't want to search such issues and tell you one by
  one"):** `node tools/ishrah/audit.js [ph,tp,tl,tx,ts,lp] [pages]` (PORT = a preview copy with an empty config.js; shots in au/) opens every
  page at phone 390, tablet 820×1180 / 1180×820 / 1280×800 / 1024×600 (touch) and laptop 1440, signed out and signed in (+ one detail page of
  each list) and reports DUP-SEARCH, DUP-AUTH, DUP-BTN (same text and same target), WIDE/OFF, CUT, ROW (grid last row under 62 % filled),
  SCROLL (page scrolls only a few px), TEXT (undefined/null/NaN…), OVER (texts drawn on each other), UNDER (end of the page under the bottom
  bar). **Run it after every layout change and fix what it reports before pushing.** Rules that came out of it:
  - one search and one sign-in per screen: `IS.dedupe()` marks body `mq` (the page shows its own search box) and `min` (it shows a sign-in
    button); the top bar then hides its search (field and phone icon) or its «دخول».
  - side menu and page scroll separately: `#side{overscroll-behavior:contain}`, `IS.sideLock()` (a side menu with nothing to scroll does not
    take the finger), `html,body{overflow-x:clip}` (the page never slides sideways).
  - even rows: `IS.evenRows` covers more grids (`EVEN`), and when the count cannot divide evenly it tries cards up to 22 % narrower first.
  - one edit button on the profile («تعديل الملف»); the speciality banner counts accepted lecturers of that speciality (`IS.lecSpecs`, the
    same rule as the Lecturers bar), not only those with a published course.
- **Who is online (owner, 18 Nov 2026: "indicators like who is online and who is not, or last activity time or date"):** migration
  `010_presence.sql` (`hide_seen`, `ish_seen()` heartbeat, `ish_presence(ids)`, `ish_team_seen()`; tested on a local Postgres: a student gets
  only lecturers and the team, never other students or anyone who hid it; the team gets everyone; a visitor only lecturers). App: `IS.beat()`
  writes last_seen on opening, on every page and once a minute while the app is on the screen; a page puts `IS.seen(id)` (green «متصل الآن»
  = active in the last 5 minutes, else «آخر نشاط قبل …») or `IS.av(o, cls, id)` (green ring) where a person is shown, and `IS.hydrateSeen()`
  fills them after the page opens and every minute. Shown on: lecturer cards and page, the lecturer on course pages, Our team, community
  authors (lecturers/team only), control students / lecturers / team lists, support page and conversations («فريق الدعم متصل الآن» for the
  student, the student's last activity for the team). Settings → Account → «حالة الاتصال» (lecturers and team): shown / hidden.
  `IS.ago` counts in standard Arabic (دقيقة · دقيقتين · 3 دقائق · 11 دقيقة; ساعة/ساعات; يوم/أيام/يومًا). On phones a list row's name
  takes the first line (`.tr>.grow`).
- **Start page on phones (owner's phone, 18 Nov 2026: round signs hidden behind thin strips of picture):** the four small cards drop the
  round sign, the subject count is a white label on the picture's corner (Medicine too), and the picture takes the room; signs always draw
  above pictures (`.pkt` z-index). Counts use `IS.cnt(n, 'sub'|'course')`: 1 مادة · مادتان · 3–10 مواد · 11 مادة (كورس · كورسان · كورسات).
- **New emblem and top bar (owner's design picture, 18 Nov 2026: "the logo and the search bar place and design"):** the emblem is an open
  book, a heartbeat line and a stethoscope, drawn as SVG in `img/logo_gold.svg` (file name kept so `IS.logo()` and palettes.py's colour
  copies work; it follows the app colour), on the Home banner without a tile, start page, certificates, control banner; app icons
  (icon-512/192, apple-touch-icon, favicon) rendered from it on navy. Top bar: «اشرح لي» in white after the emblem (no small line), a wide
  white search pill with its sign in a round button (laptops; Home's banner search is hidden there so the screen keeps one search), a
  day/night button (`data-act=theme`, sun/moon) in the gear's place (Settings stays in the side menu and «More»), bell, account.
  Fixed: on 1024–1279 px the account photo was hidden with the name.
- **Course / lecture requests to lecturers (owner, 18 Nov 2026: "the request can't be forwarded to another lecturer; it should be able to
  name a specific lecturer or be general"):** migration `011_lecturer_requests.sql` (tickets.lecturer_id / lecturer_name, ticket_msgs.lec;
  the named lecturer may read and answer that request only, `ish_ticket_lec_guard` stops a lecturer changing anything but its state; tested
  on a local Postgres). Ticket kind `course` = «طلب كورس أو محاضرة»; the message form has «إلى»: «عام: فريق المنصة يختار المحاضر المناسب» or a
  lecturer (the student's speciality first); each lecturer page has «اطلب كورسًا أو محاضرة» (form opens on that lecturer). Team: «إسناد إلى…»
  lists the platform team and the lecturers (forward = notification to the lecturer and the student). Lecturer: studio menu «طلبات الطلاب»
  (`studio-requests`, conversation `lec-ticket/<id>`); answers show as «<name> · المحاضر». Test: scratchpad lreq.js journey (student →
  lecturer page request, general request, lecturer answers, owner forwards, student reads).
- **One lecturer request per person (owner, 18 Nov 2026: "I accepted a request as lecturer, then found it duplicated: waiting and the lecturer
  accepted"):** the form sent from two devices made two rows; approving one left the other waiting. Now: the apply form updates an open request
  instead of adding one; approving closes the person's other open requests; Lecturer requests, the control dashboard and the academic dashboard
  count waiting requests with `IS.cleanApps` (not someone already a lecturer, one per person) and the requests page closes a stray waiting
  request of an active lecturer. Migration `012_one_lecturer_request.sql`: tidies existing duplicates (newest kept, older ones «Duplicate
  request»), a unique index allows one open request per person, a trigger closes open requests when a lecturer becomes active (tested on a local
  Postgres). **Owner still has to run Actions → Ishrah → apply database for 010, 011 and 012.**

## Study sections (owner, 18 Nov 2026)

- Students choose a speciality at `#pick`, then a section at `#pick-section` in this order: Basics, Clinical, International Exams, House Officer. The current section appears on Home and in the sidebar or mobile header. The section chooser links back to the speciality chooser. Each speciality remembers its last section on this device (`ish-study-sections`).
- `IS.studyScope` uses a known subject's speciality and section, with the saved course or file fields as a fallback. The Studio course form offers only subjects in the chosen speciality and section. Each student space shows its own subjects, published courses, lecturers, library files, community discussions and learning paths. A lecturer appears in each section where they have a published course. Lecturer profiles, search, course requests, My Learning, favourites and the certificate list follow the current space.
- Cross-section links to a course, lesson, lecturer, library file or thread offer to switch spaces before showing the content. Studio and Control can still preview the material they manage. The events calendar is organised by speciality. Account tools and saved offline downloads are available across sections, and cached study pages are keyed by speciality and section.
- This change uses the existing data fields, with no new migration. `PORT=8821 node tools/ishrah/space.js <width>` exercises all four Medicine sections, a second speciality, direct links, persistence and Studio subject selection in a local preview. `PORT=8821 node tools/ishrah/audit.js ph,tp,tl,tx,ts,lp` includes the new section chooser.

## Section previews and public course requests (owner, 19 Nov 2026)

- On the section chooser, the top chip names the speciality and opens `#pick`. The small “Choose your section” bar is a heading. The four picture cards fit within one screen. The grid uses two columns on phones and taller desktops, and four columns on short landscape displays.
- Home opens a scrolling feed for the current speciality and section. Courses, announcements, approved requests, events, news and discussions can be filtered by type and sorted by Newest or Popular. Popular uses available engagement counts (enrolments, joins, votes, ratings, registrations and replies). Control can publish announcements and news to a section or the whole platform. Lecturers select the section when publishing events. Older events without a section stay available through Events.
- Students submit a general or named-lecturer course request with an optional fixed proposed price in SDG per person, a date and time in Sudan time, rules, and a signup target. Control → Requests → Course requests uses the existing course-review permission to approve or decline before publication. Readers can react, comment and join. The author can close joining after approval, set it to close automatically at the target, or delete a request without paid or pending seats. Early signup expresses interest. A positive accepted fee moves the request to payment and counts confirmed seats.
- Approved lecturers use Studio → Teaching opportunities to send availability and terms. Lecturers publish their proposed terms with a fixed price on the request, and the requester can accept one offer. The agreed terms appear above the signup controls for everyone. Offer conversations are limited to the requester and the lecturer. Named requests notify the chosen lecturer and offers, messages and decisions send in-app notifications. Closed requests keep their public discussion visible and private negotiation available.
- Approved lecturers can add a picture, a YouTube or Google Drive preview, a linked course and up to six highlights when writing a course preview. Video loads when the student clicks Watch preview. Course requests and community posts have like and dislike reactions and an approval percentage calculated from them. The same account can switch or remove its reaction. Discussions use the existing replies and moderation controls.
- The interface uses one language per label. Arabic mode shows Arabic navigation and headings. Catalogue names such as Medicine, Physiology and USMLE stay in English. English mode shows English interface labels. This replaces the earlier bilingual-heading rule.
- `013_course_requests.sql` adds the request and feedback tables, audience fields, media fields, row-level security and transactional signup, offer and vote commands. The production workflow applies and verifies this numbered file before deploying when it changes. The earlier numbered migrations retain their existing manual workflow. Browser journey: `PORT=8821 node tools/ishrah/course-requests.js 390` and repeat at 1440. The journey also checks the feed, media and reactions. The section fit, language and scope journey is `tools/ishrah/space.js`.

## Public teaching agreements

- `014_public_course_terms.sql` exposes only terms explicitly published by the lecturer on an approved request. The requester accepts the published terms, which appear as the teaching agreement above Join. The request card shows the title, lecturer, fixed price, and date before the details, public agreement, files and actions. The lecturer can enter a date and time in Sudan time. Offer conversations remain private.
- Offers submitted while the form promised privacy become public only when that lecturer supplies a fixed price and publishes them. The production workflow applies the new migration before deploying. The course-request browser journey checks public proposals, the accepted agreement, signup, and private messages.

- Feed posts use coloured emoji actions for like, dislike and comments. Approval is likes divided by total positive and negative reactions. The comment icon opens comments inside the feed card or jumps to the comments already on a detail page. The migration maintains counts for course-request comments.
- The community composer gives students Discussion and Question, with course requests in their own form. Active lecturers and staff with permission to add announcements also get Announcement and Course preview. The database enforces these post types. The feed filters each type and earlier posts with preview media are labelled Course preview.
- Requests can include up to four pictures or supported documents of at most 10 MB each. The private `course-request-files` bucket and attachment policies give access to the requester and course reviewers while the request is pending. Everyone can see attachments on approved requests.
- Paid course previews link to a published course and use its listed fee. Positive accepted teaching agreements use the same Bankak checkout and Control → Payments receipt queue. The payment screen shows the speciality, section, account, exact amount, name, phone and receipt field. Receipt submission reserves a seat up to the target when automatic closing is enabled. Finance confirmation counts the student as joined. My Learning shows paid group enrolments, and Studio includes those payments in student lists and earnings. Free agreements use direct signup.
- `014_public_course_terms.sql` adds attachment access and receipt-backed group enrolment. The payment guard keeps positive enrolments pending until approval. Finance uses the existing Bankak account from Control → General settings. No payment credentials or new banking configuration are needed.

## Receipt-only payments

- The Bankak checkout for courses and teaching groups shows the account details and exact amount. Students submit their name, phone number and receipt image. Migration `015_payment_receipts.sql` removes the transaction-number requirement and keeps old payment records intact.
- After submitting a receipt, students land on `#payment/<enrollment-id>` and see Under review, Approved or Rejected. The course, request and My Learning link to the status when applicable. Rejection includes the finance reviewer’s reason and students can submit a new receipt if enrolment is open.
- Control → Payments lets finance staff message a student privately about any paid enrolment. The message lives on that payment’s status page and sends an in-app notification. The database restricts messages to the recipient and finance staff with payment access. Sending a message leaves the payment status as it was.

## Section publishing and offline navigation

- Home → Create a post opens a role-specific chooser for the current speciality and section. Students get Course request, Question and Discussion. Approved lecturers also get Create a course, Create an event, Course preview and Announcement. The real course form starts in the selected study space.
- A course can be recorded, live online or both. Studio stores the fee, course details, maximum students, start date and time in Sudan time, teaching method, cover and optional YouTube or Google Drive preview. Live-course session links are stored separately and accessible to confirmed enrollees, the lecturer and authorised reviewers. A paid seat is reserved by a receipt under review. Rejection makes the seat available again.
- Control → Requests → Question review lets reviewers approve or decline new section and lesson questions. Authors see their status before publication and receive a notification when a decision is made. Declined questions show the reviewer’s reason. Discussions keep their usual publishing flow.
- Lecturer applications accept one or more teaching specialities and require one or more sections for each selected speciality. Approval carries those exact study spaces onto the public profile. Approved lecturers can edit their choices in Studio → My page. Existing lecturers with published courses keep their previous placement until they choose teaching specialities. Existing lecturers without courses are matched by professional speciality, with Medicine used when no match is known. Course listings remain scoped to the selected section.
- Each of the 20 built-in study spaces has distinct artwork in the section chooser. Courses uses the shared catalogue banner for a section and the subject’s picture on subject pages.
- Arabic mode keeps Arabic instructions in the research request form and English chapter titles. Greetings use Dr. for Latin-script names and د. for Arabic-script names in both interface languages. Chapter identifiers and the selection behaviour are unchanged.
- The browser saves the app shell for offline startup. Previously viewed browse pages can open from the device while live data refreshes. Saved pages are scoped to account, language, speciality and section. Offline startup restores study settings and the saved account without waiting for Supabase, and downloaded lessons are available from My downloads. Posting, live sessions and payments still require an internet connection.
- `016_section_publishing.sql` adds teaching formats, seat limits, private session links, the question-review queue and lecturer teaching specialities. The production workflow applies it before the app deploys.

## Library activity and ratings

- Newly published books, slides and files appear in the selected study space’s Home feed from their publication time. Home has a Library filter and Newest, Popular, Best rated and Most rated sorting. My Library offers Newest, Best rated and Most rated. The file page and cards use the same rating per file and one editable 1–5 star rating per signed-in account. Reactions and comments remain separate.
- The file reader opens inside the app. Signed-in readers can download from Home, My Library or the file page. The app stores its existing encrypted offline copy. PowerPoint and other Office files keep the original upload and use an accompanying PDF for the in-app reader and offline download. PDFs, images and plain text open directly.
- A supplied cover takes priority. New PDFs use the first page and images use a small copy when a cover is absent. Other or previously uploaded files without covers use a styled file thumbnail. Migration `017_library_activity.sql` adds publication time, shared feedback, and visibility policies for stored files and new covers.
- My Library replaces the Books tile with **Exams** and the Presentations tile with **MCQs** in both languages. New uploads use the updated categories. Previously published books also appear under References, and older presentations can still be found in All and search.

## Lecturer payouts

- Lecturers manage the Bankak account from Studio → Earnings → Bankak account, or from My page. Migration `018_lecturer_payouts.sql` moves existing details from the public lecturer profile into a private table. Only that lecturer and staff with `payout:approve` can read them. Payout receipts are served through short-lived signed URLs in the private `payout-receipts` bucket.
- Control → Lecturer payouts lists pending requests, outstanding balances and payout history. Finance makes the Bankak transfer, then selects its course or teaching group, records the amount and uploads the receipt. They can add a transfer reference and a note for the lecturer. The database checks the available balance across the lecturer’s earned share and the selected course, including past payouts. A duplicate submission with the same receipt is treated as a retry.
- The lecturer sees the amount, course, date, receipt and finance note from Studio → Earnings or the in-app notification. Older payout history stays accessible. The live workflow applies migrations `017` and `018` before deploying.

## Lesson layout, course pricing and Google sign-in

- Lesson pages put the title, lesson position and main media in one reading column. The lesson list, progress, course download and certificate share one panel. It opens below the player at every screen size. The video, outline and study tabs use the same full-width column. The active lesson stays in line with the others. Previous and Next follow the actual course order, and the notes, questions and description tabs support keyboard navigation. Questions load when their tab opens.
- Studio → Course details offers **Free** or **Paid**. New drafts start as Free. Paid requires a positive fee, and an existing course opens with the choice that matches its saved price. Free saves a zero fee and retains the existing free-enrolment flow. The public course cards and details show the fee or free status and identify paid courses.
- Google’s branded sign-in button stays primary. An additional account chooser requests Google's `select_account` prompt. The sign-in sheet gives recovery steps for Google's browser account limit and keeps email and phone available. If Google or Supabase returns a sign-in error, the sheet shows the recovery options. The Google account limit applies inside the browser. A private Chrome tab can be used to sign in with the same Google account.


## Compact lesson layout and in-place feed feedback

- Continued from the shared branch after the Studio and course artwork updates, the compact layouts, and migration `019_report_moderation.sql`. New section posts and course requests publish immediately, with reports handled in Control → Community. Legacy items awaiting review keep their existing queues.
- The lesson outline opens below the player and stays closed by default. The study panels follow at the full lesson width.
- Likes and dislikes update immediately on their card and reconcile from one save request. The app restores the previous display if that save fails. Comments open in the feed card with a local composer and recent replies. Announcements have Like, Dislike, Comment and Report, with Share removed.
- Library ratings open a five-star picker from the feed, catalogue or file page. One click saves the reader's rating and updates the shared score in place. The old file rating links open the picker when followed directly. A file's uploader can view reader ratings.
- Migration `020_announcement_feedback.sql` adds feedback only for public notices. It reuses replies and their moderation, and returns updated reaction and rating totals in the same write request. The production workflow applies it before the matching client deploys.

## Medicine section artwork and feedback on every feed post

- Medicine → Choose your section uses the original Anatomy, Physiology and Biochemistry artwork in `img/sec_basics.webp` for Basics. International Exams uses the owner's supplied USMLE poster, optimized into `img/choice_usmle.webp` and fitted to show the whole artwork. Clinical and House Officer keep their photos. [USMLE artwork source](https://www.laumed.org/blog/comprehensive-guide-to-usmle)
- Home puts Like, Dislike, Comment and Report in one row on every card, including courses, events and news. Likes and dislikes update immediately. Comments open inside the card. Announcements have no Share button. Every regular post's approval is its percentage of positive reactions. The feed uses that percentage for Best rated and reaction count for Most rated. Enrolled learners' course reviews continue to appear on the course.
- Library cards, the feed and the file page open the same five-star picker in place. The selected star highlights immediately and the shared rating updates on save. Readers can change their rating. Uploaders can see the rating their file received. Reports for course listings, events and library files go to Control → Community for review, with publication managed in the relevant Control area.
- `021_feed_interactions.sql` extends the existing feedback, replies and reports to courses, events and news, and supports reporting library files and comments. It keeps reactions and comments restricted to published activity. GitHub Actions applies it before publishing the browser update. Asset version `140`.

## Speed, book reader, one score (owner, 19 Nov 2026)

- **Speed** ("very slow moving between places, pictures appear slowly"): `DB.q` / `DB.one` (Supabase) keep each read for 45 s and send a read
  asked twice at once only once; any insert, update, delete, upsert, `sb.rpc` or sign-in change empties the store. Signed file addresses are
  reused for 50 minutes (`createSignedUrl` 3600 s, kept in `ish-signed`), so the browser keeps covers and photos in its cache. sw.js: the app's
  own pictures, fonts and `pdfjs/` come from the phone first and refresh in the background; uploaded pictures (Supabase storage, image
  requests) are kept by file path in cache `ish-media`; the app page itself waits at most 250 ms for the network before the saved copy
  opens. Saved page copies now open at once on every student page (`QUICK_COPY` = `READABLE_COPY`), also for team members.
- **Book reader** (`js/reader.js`, "books must open perfectly, as in a real PDF reader"): `IS.openReader({id, title, url | blob, page})` opens a
  full-screen layer over the app (Back closes it). Pages drawn at the screen's pixel density only near the screen (IntersectionObserver),
  far pages released; real text layer (copy, select); highlight in 4 colours (`ish-hl:<id>`, tap a highlight to recolour or remove; list in
  «تظليلاتي»); search the whole book; zoom − / + / Fit, pinch and Ctrl + wheel (`ish-rz`); page number tap = go to page; last page reopens
  (`ish-rpg:<id>`); a tap hides the bars; full-screen button; keyboard arrows. `IS.renderLibraryDocument` hands every PDF to it (file page and
  My downloads offline). **Fonts:** pdf.js gets `cMapUrl` and `standardFontDataUrl` from our own copy `ishrah/pdfjs/` (cmaps + standard_fonts of
  pdfjs-dist 3.11.174) and `useSystemFonts: false`: books that do not embed Times/Arial were drawn with wrong letter widths on phones (the
  "distorted text" the owner saw). Test: scratchpad rdr.js with a 201-page PDF (first page with text < 1 s, select, highlight, zoom, search
  48 hits, jump, Back).
- **One score everywhere** ("the rating should depend on likes and dislikes, with a grade title as we grade books"): `IS.grade(row)` = every
  like 5 stars, every dislike 1 star, every book star rating itself; average out of 5 → `IS.gradeInner` shows stars (text ★ with a gradient fill:
  phones have masks switched off), the number, a coloured grade (ممتاز ≥ 4.5 · جيد جدًا ≥ 3.75 · جيد ≥ 3 · مقبول ≥ 2 · ضعيف; «لم يُقيَّم بعد»
  with no votes) and the number of votes. Feed rows = Like · Dislike · Comment (· Share) … score · Report; phones put the score on its own
  line. The bar keeps its counts in data attributes and `regrade()` updates the score after every like, dislike or star (`IS.regradeBars`).
  Books: the score badge is the button that opens the star picker.
- Medicine → International Exams uses `img/choice_usmle_wide.webp` (the poster with blurred sides, 16:9) so it fills its card; on phones the
  four sections are wide cards one under another with the name on the picture. Studio → My page has a live preview of the page colour.
  Round avatars never stretch in list rows (`.li>.av`). Asset version 141, shell cache ish-v46.
- File page: the «Read in the app» section is gone; the main button beside the book is «Open the book» / «Continue reading · p. N» (`IS.ACT.readbook`: PDFs open the full-screen reader, pictures and text files a sheet; `#file/<id>/read` opens it at once). Course cards and the course page show the same score (`IS.gradeInner`) instead of the old course-review star; tapping a feed score opens «How this rating is made» (likes, dislikes, enrolled students' reviews or book stars).
- **Team Manage menu (owner, 19 Nov 2026: "an admin should be able to delete or edit any post or book"):** `js/manage.js`. `IS.manageBtn(kind, id)` = ⋯ button shown only to team members whose role allows it (post: community edit · file: library approve · news: notify edit/delete · notice: notify delete · event: events edit/delete · course: review approve). It sits in every feed card header and, through `IS.onRoute` (called by the router after every page), in a gold «Team tools» bar on post, file, news, event and course pages. The sheet edits the title and text (book: title, author, description; course: title, short description) and deletes: posts and files get status «removed» (undo from Control), news/notices/events are deleted, courses are hidden. Edits and deletions go to the activity log.
- **Courses are graded only by students who joined** (owner, 19 Nov 2026): `IS.grade(row, 'course')` uses only the reviews (the database already accepts a review only from an active enrollment, free or paid); course cards in the feed have no Like/Dislike buttons; the score sheet says only enrolled students can rate, from the course page. Feed Best rated / Most rated sort by the same score as the cards.
- **One comment design** (owner, 19 Nov 2026: "this looks distorted"): `IS.commentItem` = picture, name · time, text, then small matching pill buttons (⚑ إبلاغ, 🗑 حذف for the writer or moderators); used on the book page, inside feed cards and for discussion replies (`.cmt`, `.cact`).
- **Library series / groups of files** (owner, 19 Nov 2026: "upload multiple files as a group, like sheets; open nicely as a book series, ordered"): `js/series.js` + migration `022_file_series.sql` (files.series_id, series_title, series_no; applied by the deploy workflow). Upload window has two modes: One file · A group of files (series name, type, subject, author, description, several PDFs/pictures at once, sorted by name with numbers in order (1, 2, 10), each part renamable and movable up/down, progress «Uploading part 2/5»). Each part is a normal file row (review, rating, comments, download). The library and the Home feed show ONE card per series (`IS.seriesCollapse`, `IS.seriesCard`: stacked cover, number of parts, pages, «Open the series»); `#series/<id>` = header (cover, title, parts, pages, «Start with part 1» / «Continue: part N») and the ordered parts (open, download, page reached, ✓ when finished); a part's page shows «Part N of the series: …»; the reader shows «End of this part → Part N+1» at the end. Parts awaiting review appear one by one in Control → Library.
- **Paid or free library files, sold by anyone** (owner, 19 Nov 2026: "the upload file should also appear as paid or free and has tag; even
  students can share paid files or free; publishing goes through admin; students can gain money according to their selling"): `js/sell.js` +
  migration `023_paid_library.sql` (applied by the deploy workflow). Upload (one file or a series) has Free / Paid + price in SDG and up to 8
  tags (`IS.sellFields`, `IS.readSell`); a series has one price and is bought whole. Student uploads stay pending until Control → Library
  publishes them (it shows price and tags). Paid files show a gold price badge and «اشترِ · price» (`IS.buyBtn`) instead of Open/Download;
  Bankak receipt → `file_buys` (pending) → `#purchase/<id>` status → Control → **Library sales** (menu, perm `pay`) approves or rejects →
  the buyer reads and downloads. The database decides access: storage rule `ish_read` + `ish_file_open(files)` let only the owner, library
  staff or a buyer with an approved purchase read a paid file (covers stay public); the purchase trigger takes price, title and seller from
  the file, needs the receipt, refuses buying your own file and a second open purchase. Sellers earn `file_share` % (settings, default 70):
  `#sales` (Library → «مبيعاتي») = figures, Bankak account (`seller_accounts`, private), «اطلب تحويل الرصيد», sales list, transfers with receipts;
  Finance records transfers in Control → Library sales → Sellers to pay (`ish_seller_payout`, checks the balance). Tags are searchable
  and tapping one searches the library. Tested on a local Postgres (access before/after approval, series, own file, duplicate, payouts over
  balance) and in the browser (scratchpad sell.js: seller → publish → buy → approve → open → payout) at 390 and 1440.


## Series covers and balanced feedback

- Group uploads let each part have its own optional cover. The uploader can reorder parts while keeping each cover and PDF reading copy attached to its file. PDFs use the first page and images use the uploaded image when no cover is chosen. Office files use the first page or slide from their PDF reading copy. A failed upload can resume in the same open form.
- Series pages show a thumbnail for each part. Older parts without a saved cover lazily render a first-page preview when the current reader can open their document. Library cover links use an account-scoped cache and a single batched lookup for uncached covers. Previously visited series pages can show their saved layout while refreshing.
- Series reactions and star ratings belong to the series itself. The Home feed, My Library, and the series page share the controls. Migration `024_series_feedback.sql` stores the votes and is applied by the deployment workflow.
- Likes and dislikes have equal and opposite weight. The score uses the submitted star average as the base, or 3 when there are only reactions. The adjustment is (likes − dislikes) divided by the total number of reactions and submitted ratings. Scores stay between 1 and 5. Course scores continue to use enrolled students' reviews.

## Library upload rights, uploader edits, and navigation

- Series cards place the Free or Paid badge in the action row beside Open the series.
- New single-file and series uploads require a declaration of origin and sharing rights. Only the uploader’s original work that is not already freely available can be sold. Redistributable free material or work shared with the creator’s permission stays free and requires public source attribution. Migration `025_library_upload_rights.sql` enforces the declaration and price constraints. Reviewers see the declaration in Control → Books & files and confirm it before publishing a paid upload.
- My Library → My uploads and the file page let uploaders propose changes to the title, author, description, tags, file, reading copy and cover. The current version remains available until an authorised reviewer approves the proposed version. Control → Books & files → Edits awaiting review shows proposed changes. Reviewers can approve, return with a note, or hide or remove a file. They cannot directly rewrite library uploads. Migration `026_library_file_revisions.sql` manages private revisions, reviewer access to proposed attachments and uploader notifications.

## Multiple library subjects, series edits and PDF bookmarks

- One file or a series can be tagged with multiple subjects from its study section. Existing single-subject uploads still appear under their original subject. The library includes a series once under each matching subject. Subject names remain in English in both interface languages.
- The uploader can edit shared series information from the series page and edit each part from the ordered parts list. Shared title, author, description and subjects go to Control → Books & files for review. Approving a shared edit keeps the parts, their order, and their individual publication status. Migration `027_library_subjects.sql` checks the study section and keeps shared and individual edits in separate review entries.
- Online PDF reading opens the viewer while the app requests the signed address and prepares PDF.js. The reader renders the first or saved page before drawing nearby pages. Search text is visible, and tapping a result jumps to highlighted matching text. Readers can save and remove page bookmarks on their device, and the bookmark panel shows the PDF's own contents when available. Asset version `152`, with reader version `153` for the bookmark label.
- All public scores use one neutral starting score of 3 out of 5, then average the real feedback with it. One like gives 4.0 and one dislike gives 2.0. The neutral score has less influence as more people vote. File and series stars take precedence over the same reader's reaction in the score, while the reactions remain visible. Courses use enrolled students' reviews. Migration `028_balanced_ratings.sql` maintains the overlap counts and returns them with the feedback update.
- Same-area navigation keeps the current page visible and inactive while an uncached destination loads. Saved student pages already open from their last copy. Read-only database calls and presence updates no longer clear unrelated cached reads. First loads and fresh data still depend on the network.

## Discussion publishing

- `029_discussion_publishing.sql` makes the shared staff check resolve `public.ish_team()` from within the post-publishing trigger. Discussion publishing keeps the existing student and lecturer permissions. The deploy workflow verifies that the staff check runs with an empty search path before publishing the app.
- The Community rules panel in both languages asks members to respect others, post useful and relevant material, check and cite sources, avoid duplicates and spam, and report violations. Student script version `153`.

## Study section names

- Basics, Clinical, International Exams and House Officer keep their English names in the Arabic and English interfaces. The header, sidebar, section chooser, study page titles and course and upload forms use the English category names. Actions and page labels such as «تغيير» and «اختر قسمك» still follow the selected language. Updated scripts use asset version `154`.

## Stars are the rating, reactions are popularity; space members; welcome band (owner, 19 Nov 2026)
- **Rating = stars only** ("like, dislike just make the post popular … rating as stars; 1, 3 and 5 stars ≈ 3"): `IS.grade` is the plain
  average of the star ratings (no neutral 3, likes/dislikes not counted). Every feed item (post, course request, announcement, event, news,
  file, series) has the star picker (`IS.libraryRating(row, true, kind)`, saved by `ish_feed_rate(kind, target, stars)`; authors cannot rate
  their own). Courses keep enrolled students' reviews. Feed sort «الأكثر شعبية / Most popular» = likes + dislikes (comments only break ties);
  Best rated / Most rated use the stars. Migration `030_star_ratings.sql` (rating_count / rating_points on notices, events, news,
  course_requests; counter trigger; stars allowed on every kind except courses). Supersedes "Series covers and balanced feedback" and the
  neutral-score note in "Multiple library subjects". Test: scratchpad stars.js (1 + 5 stars = 3.0; a like leaves the score).
- **Members of each speciality space** ("each speciality has its own sign-in; show how many doctors or nurses and how many online, also
  lecturers"): `031_space_members.sql` — table `space_members` (user, spec, joined_at, last_seen), `ish_space_join(spec)` (a signed-in
  account that opens a space joins it; `IS.beat` renews it every minute via `IS.spaceJoin`), `ish_space_stats(spec)` (counts only, visitors
  too): members (non-lecturers), online in the last 5 minutes, lecturers (active, teaching that speciality or members of it), lecturers online.
  A row under the Community banner, never on its picture (`IS.spaceBox`, filled by `IS.onRoute`, refreshed every minute): 4 figures + «أنت عضو في مساحة Medicine» or «سجّل الدخول
  لتنضم…»; the subtitle names the speciality. manage.js `IS.onRoute` now chains the previous hook.
- **Home welcome band on phones/tablets** ("organise that blue bar"): logo at the start, greeting / section / speciality beside it, role
  chips under the text, search across the full width (CSS block at the end of app.css). Asset version 155, shell cache ish-v55.
- **Welcome band, owner's own design** (19 Nov 2026, from his picture): gold greeting, big white section name, speciality in light blue, role
  chips; the logo in a glowing glass circle on the other side; a faint heartbeat line across the band (inline SVG, no photo); search across
  the bottom (laptops keep the top-bar search). **The glass-circle logo is the app's logo look** (owner: "depend the logo like this in the
  app"): `.glogo` style also on the top bar logo and the start page. CSS block at the end of app.css (overrides the earlier band rules).
  Asset version 156, shell cache ish-v56.
- **Reader on phones, second pass** (owner, 19 Nov 2026: "opening a book is very slow; no bookmark or contents list; zoom on the phone moves
  in a disorganised way"): (1) pdf.js asks only for the pieces it needs (`disableAutoFetch`, `disableStream`, 256 KB ranges; the first page
  shows before the whole book is downloaded when the file server allows range requests) and the opening screen shows the download %. (2) Top
  bar: Contents (list icon) and a quick bookmark button for the page in view (gold when saved; a gold ribbon on bookmarked pages). The panel has
  two tabs: «المحتويات» (the book's own outline with levels, or a grid of page numbers when it has none) and «إشاراتي» (count, add/remove,
  jump). (3) Zoom keeps the spot under the fingers in place: pinch scales around the fingers and follows them, then lays the pages out at the
  new size with that spot under the fingers (`anchorAt`, `zoomTo(z, x, y, anchor)`); buttons zoom around the screen centre; double tap = 2×
  at that spot / back to fit; zoom is kept per book (`ish-rz:<id>`); the browser's own page zoom is off inside the reader (`touch-action`).
  Test: scratchpad rdr2.js (201-page PDF at 390 px: spot on the page before/after a pinch identical). Asset version 158, shell cache ish-v58.

- **Reader on phones, third pass** (owner, 19 Nov 2026: "make the zoom and bookmarks work better on phone"): each page canvas stays under a
  pixel budget (5 MP on touch screens, 12 MP otherwise; phones refuse bigger canvases, so deep zoom used to give blank or flickering pages);
  zoom 60–400 %, the Fit button shows the zoom % (gold) and returns to page width; iPhone Safari's own screen zoom is blocked inside the reader
  (`gesturestart`). The Contents/Bookmarks panel opens OVER the pages (they no longer jump down; top measured from the bar); each bookmark row
  shows the page number and the page's first words. **Bookmarks, highlights and the last page follow the account** (`032_reader_state.sql`,
  table `reader_state`, own rows only): every change is saved locally with its time and sent ~1 s later (page changes 4 s, and when the reader
  closes); on opening, the newer side wins, and the remote last page is used unless the reader already moved. Test: scratchpad rdr3.js
  (panel does not move the pages, rows with text, 400 % canvas within budget, bookmarks and page restored on a second device).
- **Welcome band spacing on phones** (owner: "Dr Arja, Clinical, Medicine distributed nicely, not congested"): the three lines are centred
  beside the logo with 8 px between them, the heartbeat line runs only on the logo side, chips and search follow with even gaps.
  Asset version 161, shell cache ish-v61.
- **The team sees who is in a space** (owner, 19 Nov 2026: "an admin should know specifically who is online and who is registered there"):
  for accounts with the students or dash permission, the four Community figures are buttons («عرض الأسماء») that open a sheet with the
  people (photo, name, member or lecturer, join date, «متصل الآن» or the last activity; online first; name search over 8 people).
  `033_space_people.sql`: `ish_space_people(spec, kind)` refuses anyone without that permission; students and visitors keep only the counts.
  Asset version 162, shell cache ish-v62.
- Welcome band, third pass (owner: "use the bar's space, not one place with empty space"): greeting, section (larger) and speciality are centred in the space beside the logo, chips centred under them.
- Space figure tiles are cards (owner: "design the button place in a better way"): icon, number, label; for the team a «عرض الأسماء» pill (green on the online tiles) opens the list. Asset version 163, shell cache ish-v63.
- Space tiles compact (owner: "why are they big and ugly"): one short row each (icon, number over label, small «عرض» tag for the team). Asset version 165, shell cache ish-v65.
- Space figures, final design (owner: "still bad and disorganised"): two blocks, Members and Lecturers (icon, title, total; a green «● N متصل الآن» line under each). For the team the total opens everyone (small arrow) and the green line opens those online. Asset version 166, shell cache ish-v66.
- Space figures in the owner's own design (his picture, 19 Nov 2026; supersedes the two-block version): four tiles, totals blue and «online now» green, icon in a rounded square, number over label, divider, «عرض →» pill (team only), soft corner waves; membership pill with ✓, stethoscope and a heartbeat line. On phones the pill goes under the number. Asset version 167, shell cache ish-v67.
- **Books open from the phone after the first time** (owner, 19 Nov 2026: "opening a book is still slow"; the file server is in Ireland, so
  every opening paid many slow round trips): `IS.openLibraryBook` first asks `IS.bookBlob(file, path)` (offline.js) for a copy on this device
  (a manual download, or one kept automatically) and opens it with no internet; otherwise it opens online (1 MB range pieces) and, 2.5 s
  after the first page shows, `IS.bookKeep` saves the whole file in the same encrypted store as downloads (≤ 80 MB, not on data-saver, same
  30-day renewal; marked `auto`). A copy is used only for the same file version (`pth` = path). Test: scratchpad fast.js.
- **The rating breakdown is for the team only** (owner: "this should not be seen by students except admins"): «كيف حُسب التقييم؟» and the
  sheet open only for team accounts (`IS.team()`); students see the stars and can rate. Asset version 168, shell cache ish-v68.
- **Control → Usage** (`control-usage`, menu Site & app, perm `settings`; owner, 19 Nov 2026): file storage per kind (library, pictures,
  receipts, payout receipts, application files, request attachments) with sizes and counts, database size, counts of accounts / posts /
  comments / files / courses / lessons / enrolments / purchases / notifications, the 10 largest files, against the plan limits (settings
  `plan_name` free|pro, `plan_storage_gb` 1|100, `plan_db_mb` 500|8192, editable there); bars orange at 70 %, red at 90 %, with advice
  (upgrade to Pro or move library files to Cloudflare R2). Download traffic is only on Supabase's page (link to the project). Migration
  `034_usage.sql` (`ish_usage()`, settings/dash viewers only). Library sales is now in the grouped Control menu too (Payments group).
  Asset version 169, shell cache ish-v69.
- **Books are kept on the phone only after 2 minutes of reading** (owner agreed, 19 Nov 2026): a quick look no longer downloads the whole
  book (first download is Supabase traffic); `o.onFirst` runs 120 s after the first page, only if the reader is still open. Asset version 170.

## Before the public launch: move library files to Cloudflare R2 (owner, 19 Nov 2026: "when I want to publish all, we move to R2")
Supabase charges download traffic (free ≈ 5 GB/month, Pro ≈ 250 GB then ≈ $0.09/GB); Cloudflare R2 has free downloads and ≈ $0.015/GB-month
storage (10 GB free). Plan: owner creates an R2 bucket in his Cloudflare account and gives the Pages project a binding; a Pages Function
serves library files after checking the reader may open them (same rule as `ish_file_open`: published and free, owner, library staff, or an
approved purchase) with short-lived signed links; uploads go to R2 through the same function; a one-time copy moves existing `library`
objects; `DB.fileUrl('library', …)` then returns the R2 link. Accounts, posts and the database stay in Supabase. Remind the owner before launch.
- **Alerts** (owner, 19 Nov 2026: "notifications for every post; admins get a sound for every user request, better on the phone"):
  `035_alerts.sql` + `js/alerts.js` + `functions/api/push.js` + push handlers in sw.js.
  - Every published post (discussion, question, course request, event, library file or first part of a series, course) → a notice for its
    speciality and section (`notices` user_id null + spec/cat, `actor` = author, `kind` 'post'; the author never sees their own).
  - Every user request → a personal notice for each team member whose role covers it (`ishrah_private.staff_for(perm)`, `kind` 'team'):
    payments (pay), library purchases (pay), lecturer applications (apps), files and file edits waiting (library), questions waiting, courses
    sent for review, course requests (review), support messages and replies from students (tickets), reports (community), library requests
    (requests), lecturer and seller payout requests (payout). One trigger function `on_activity` on all these tables; an error in it never
    stops the user's action.
  - In the app: every 20 s for the team (40 s for others) and at once on a push, new notices play a sound + vibration (stronger 3-note sound
    for team requests) and show a message; Settings → Alerts: phone alerts on/off, mute, test sound.
  - Phones (Web Push): Home and Control ask once («فعّل التنبيهات», later = 1 day for the team, 3 days for others; iPhone needs the app on the
    Home Screen). Each device = `push_subs` (endpoint, speciality, section, team; `ish_push_save`). A new notice → trigger `push_out` →
    pg_net POST /api/push {id, secret} → `ish_push_targets` (checks the secret in `push_cfg`, picks the phones, stores the text) → empty
    pushes signed with VAPID (keys made once and kept in `push_cfg`, readable only with the server key) → the phone asks /api/push?peek for
    the text and shows it; a tap opens the page. Phones that left are removed (404/410). Needs the pg_net extension (the migration enables it)
    and the existing Pages secrets SUPABASE_URL / SUPABASE_SERVICE_KEY; `settings.push_url` = https://ishrahli.org/api/push.
  - Tests: local Postgres (who gets which notice), scratchpad pushfn.mjs (function with fake services: valid ES256 VAPID, wrong secret 403,
    gone phone deleted), alert.js (team sound once, own post excluded, Settings box). Asset version 171, shell cache ish-v71.
- **Message alerts follow the department** (owner: "which admin receives which notification, so he does his work"; `036_alert_routing.sql`):
  a support message alerts the owner, the general manager and the staff of its department (`profiles.dept` or their department role), or
  only the assigned person once assigned (+ owner/GM); assigning a message alerts the new person. Other requests go by role permission
  (`staff_for`). The activity trigger reads `status` through `to_jsonb(new)` (ticket_msgs has no status column; reading it directly made
  student replies fail — fixed before it reached students).
- **Course requests wait for approval again** (owner, 19 Nov 2026: "a student made this course request; it did not go through admin";
  `037_course_request_review.sql`): a new request from anyone without review approval is saved «pending» (trigger
  `course_request_waits`; 019 had made them public at once); the team is alerted «طلب كورس جديد بانتظار موافقتك» (link to Control → Course
  requests); approving notifies the student and the named lecturer (existing RPC) and alerts the speciality/section. The student is told
  «أُرسل طلبك للمراجعة…». The request page header shows the requester, speciality and section as separate tags. The deploy log has a
  "Phone alerts check" step (pg_net installed, number of registered phones, delivery results; counts only). Asset version 172.
- **Edit and send again; cover pictures; team tools on requests; whole cards open** (owner, 19 Nov 2026; `038_course_request_edit.sql`):
  - Course requests have `cover` (a picture in the public `media` bucket, checked by a constraint). The requester adds it in the request form
    or later; the team can change it. `ish_course_request_edit(request, payload)`: the author edits title, details, cover, price, date, rules,
    target and automatic closing; the request goes back to «pending» (team alert «طلب كورس معدّل بانتظار موافقتك») unless the author can
    approve reviews. A request with payments cannot be edited by its author. Team (review edit/approve) edits keep the status (logged).
    Request page: «عدّل الطلب وأعد إرساله» for the author, notes while pending or declined.
  - Posts: `ish_post_edit(post, title, body)`: the author's edit hides the post («pending») until Control → «مراجعة المنشورات والأسئلة»
    (control-questions, now every waiting post) approves it; approving an edit notifies the author and does not alert the space again.
    Community editors' own edits stay published. Button «عدّل المنشور» on the post page.
  - «أدوات الفريق» (manage.js) covers course requests too (kind `request`: edit with the full form, approve/decline while pending, delete),
    on feed cards, request cards and request pages (also the control and studio request pages).
  - Feed cards, course cards and request cards open their page from anywhere on the card (`data-go`, core.js; buttons, links, votes and the
    comment panel keep their own action).
  - Covers are shown whole (`IS.poster(src)`: the picture with `object-fit:contain` over a soft enlarged copy; no blur on touch screens):
    course cards, feed pictures, request covers. In the feed, request and course covers are a wide 16:9 picture above the text.
  Asset version 173, shell cache ish-v73.

## Medical library redesign

- The shared design uses warm ivory surfaces, teal actions, ink headings and soft gold details. The start screen and section home use original medical-library artwork in `img/hero_medical_library.webp`. Banner photos still follow each page's subject.
- The palette is shared by the student app, Lecturer Studio, Control and the PDF reader. English headings use a serif display face and Arabic headings keep Cairo. The darker theme uses deep green surfaces. Settings still offers accent choices.
- Mobile study-section and Library cards put artwork beside the title. International Exams uses the original USMLE artwork for the taller mobile frame. The redesign starts from the branch containing Claude's request review, editing and alert changes.
- Asset version 174 and shell cache `ish-v74`. Regenerate colour variants with `python3 tools/ishrah/palettes.py` when editing the shared stylesheet.

## Approved emerald redesign · 20 Nov 2026

- The student app, Lecturer Studio, Control and PDF reader share the new medical-library design. The surfaces are mint and ivory, with emerald actions, ink text and gold accents. English display headings use Georgia and Arabic headings keep Cairo. Dark mode and the optional accent palettes remain available.
- Original assets are in `img/collection/`. The open book and stethoscope mark is shared by the app, certificates, browser icon and installed app. Run `python3 tools/ishrah/palettes.py` to regenerate the colour stylesheets and logo variants.
- The five built-in specialities each have four section illustrations. The Medicine Clinical home and speciality picker use the panoramic gallery. Page artwork matches the topic, including Courses, Library, Community, Events, finance and administration. Custom speciality artwork, uploaded covers and existing subject illustrations take precedence where supplied.
- The section Home links to the course catalogue and section picker. Feed cards use side-by-side covers and text and a wider screen shows two cards per row. Comments, reports, ratings and other actions use the existing workflows.
- Asset version 176 and shell cache `ish-v76`. Opening comments keeps the active card in its desktop column. This release needs no database migration.

## Opening screen and artwork refinement · 20 Nov 2026

- Removed the older blue backgrounds from the speciality picker. The opening card pairs readable ivory or dark-mode content with a dedicated photograph of health sciences teaching in Sudan (`img/collection/platform.webp`). The photograph and controls have separate layout regions, including on phones.
- Replaced the five built-in speciality illustrations and the Courses, Library, My Learning, Community, Events and Downloads banners with original scenes of students, teaching and simulation. Nursing Basics shows a student learning vital signs. The Clinical home uses its dedicated section photograph. Uploaded and custom artwork still takes precedence.
- Asset version 177 and shell cache `ish-v77`. No database migration is needed.

## Clinical blue design · 20 Nov 2026

- Supersedes the emerald default. Shared surfaces use cool blue, white and deep navy. The landing card shows a health sciences teaching scene, with a separate account row and clear language and terms controls on phones. Home uses section-specific artwork and places mobile search below the hero.
- Original photorealistic illustrations in `img/collection/` show relevant equipment, study spaces and materials. The built-in specialities and study sections each have their own artwork. Courses uses anatomy materials, My Library uses a library interior, and Studio uses a recording setup. Custom study artwork and uploaded course and library covers keep their existing precedence.
- The color settings still offer the optional palettes and light, dark and eye-comfort modes. Regenerate variants with `python3 tools/ishrah/palettes.py`. Asset version 178 and shell cache `ish-v78`. No database migration is required. The branch already supports multiple subject tags in both library upload modes through migration 027.

## Opening screen rebuild and resilient Home · 20 Nov 2026

- The speciality picker uses a content-sized layout with a split student photograph and brand panel, a separate account row, two-column illustrated cards on phones and a visible campus backdrop. Each card identifies the speciality and its subject count. Language, terms and role-specific workspaces stay available beneath the cards.
- Refreshed the five speciality images and the Clinical Home, Courses and My Library artwork. Uploaded and custom artwork still takes precedence. Light, dark and eye-comfort settings remain available.
- The Home header, navigation and search render before the section feed. A feed error or timeout offers retry in the feed area. The offline copy is refreshed after the feed loads successfully.
- Asset version 179 and shell cache `ish-v79`. No database migration is required.

## Fit the opening picker to the reference · 20 Nov 2026

- The five-card specialty picker keeps Medicine full-width and places each clinical photo on the right. The teal hero, diagonal cards, outlined footer buttons and illustrated campus follow the provided reference. Short landscape screens use a compact three-column grid.
- The standard picker fits the dynamic viewport, including the signed-in Studio and Control buttons. Larger in-app text, custom specialty counts and extra-short viewports can use normal page scrolling so their content remains reachable.
- Asset version 180 and shell cache `ish-v80`. No database migration is required.

## Shared clinical design and artwork refresh · 20 Nov 2026

- The section picker uses the opening screen's diagonal picture cards, teal outlines, ice-blue surfaces and paired icon and title. It fits between the toolbar and bottom navigation at standard phone sizes. The opening screen layout remains as approved.
- Replaced the built-in pictures for all 20 specialty sections and the Community, Events, Learning and Studio banners with fresh medical scenes. Shared navigation, panels, course and library surfaces use the opening screen's visual styling.
- Bundled collection images use the current asset version in their URLs, including CSS backgrounds. The service worker gives versioned images a separate cache key, so older green artwork cannot appear under the new URL. Asset version 181 and shell cache `ish-v81`. No database migration is required.

## Comments like Facebook; tidy library card buttons · 20 Nov 2026
- Owner: "make people interactions in post like in Facebook; now people can't reply to each other". `039_comment_threads.sql` + `js/threads.js`.
  - Every comment (discussion, course, event, news and announcement comments in `replies`; `course_request_comments`; `library_comments`)
    can be answered and liked. A reply joins its top comment's thread (`parent_id` = top comment, one level like Facebook) and names the person
    answered (`reply_to`, `reply_to_name`, shown in blue before the text). `ish_comment_reply(kind, parent, body)` and
    `ish_comment_like(kind, comment)` (kinds 'reply' · 'request' · 'file'; table `comment_likes`, `like_count` on the comment). A guard trigger
    stops people setting these fields directly.
  - Notifications (`kind 'social'`): the person answered «ردّ … على تعليقك», the top comment's writer «ردّ … في نقاش تعليقك», and the owner of
    the post, request, file, course or event «علّق … على …». Never to yourself.
  - Look: bubble with name and text, likes badge on the bubble, small actions under it (time · أعجبني · رد · إبلاغ/حذف), replies indented
    under a line; threads with more than 2 replies fold into «عرض الردود السابقة (N)»; reply box inline with «الرد على <name>», Enter sends on
    computers. `IS.commentItem` (now in threads.js), `IS.thread(rows, kind, item, opts)`, `IS.withThreads` (adds the replies of the comments
    shown and this account's likes). Used on the post page, the comment panel of every feed card, the course request page and the file page.
- Library cards in the feed (owner: «تنزيل، افتح الكتاب، مجاني … aligned well»): the price label on its own line, then the buttons side by
  side with the same height and width (one button takes the whole width).
- Asset version 182, shell cache ish-v82.

## Facebook reactions on posts and comments; comments on book series · 20 Nov 2026
- Owner: "people should be able to react to other comments; book series don't have comments or reactions; like, dislike, angry and heart".
  `040_reactions.sql`. Reactions: 1 👍 like · 2 ❤️ love · 3 😡 angry · -1 👎 dislike (one per person; the same again removes it).
  - Feed items: `feed_feedback.reaction` and `series_feedback.reaction` accept the four; `love_count` / `angry_count` added beside like/dislike
    on posts, files, notices, courses, events, news, course_requests (trigger `feed_feedback_count`); `ish_feed_react` / `ish_series_vote`
    return all four counts. Bar = summary of the top emojis and the total (`.rx-sum`) + one «تفاعل» button that opens the picker (`.rx-pick`;
    the button then shows the chosen reaction in its colour) + comment + share + stars + report (`IS.paintReact`). Most popular = all
    reactions together.
  - Comments: `comment_likes.reaction`, counts in the comment's `rx` jsonb ({"1":n,"2":n,…}), `like_count` = total; `ish_comment_react(kind,
    comment, value)`; the bubble badge shows the top emojis and total; «أعجبني» under each comment opens the same four reactions.
  - Book series: reactions in the same picker and their own comments (`library_comments.series_id`, `ish_series_comment`; replies and reactions
    through the same thread functions; notifications go to the series owner). Comments open inside the series card and on the series page
    (`#series/<id>/comments` opens them).
- Asset version 183, shell cache ish-v83.

## Live reactions and comments; who reacted; emoji only · 20 Nov 2026
- Owner: "comments and reactions don't appear instantly like Facebook unless you leave the page; I tried with 2 accounts"; "the text
  (لم يعجبني) is distorted, just depend on the emoji"; "the numbers of reactions look bad, you don't know what 3 means"; "press the
  reactions to know how many of each type". `041_live_feedback.sql` + `js/live.js`.
  - `live_pulse` (key 'post/<id>', 'series/<id>', … + time; readable by all; in the `supabase_realtime` publication): triggers on feed_feedback,
    series_feedback, comment_likes, replies, course_request_comments and library_comments touch the item's key. The app listens with Supabase
    Realtime (and checks `live_pulse` every 15 s when the live connection is not open); for an item on the screen it empties the read cache
    (`DB.forget`), re-reads the counts (`IS.patchFeed`), reloads an open comment panel (skipped while the person is typing or choosing a
    reaction), and redraws a post / request / file page in place (`IS.keepScroll`). `IS.livePulse(key)` can be called directly (tests).
  - `ish_reactors(kind, target)` (kinds post · request · file · announcement · course · event · news · series · c:reply · c:request · c:file):
    names, photos and reactions. The summary pill under each post (`.rx-sum`, emojis + «3 تفاعلات» via `IS.rxCount`) and the badge on each
    comment open the sheet «التفاعلات»: tabs All · 👍 n · ❤️ n · 😡 n · 👎 n and the people, each with their emoji on the picture.
  - Emoji only: the React button shows just the emoji (grey 👍 until you react), the picker has no words, and a comment shows only the chosen
    emoji instead of «أعجبني» once reacted.
- Asset version 184, shell cache ish-v84.

## Facebook-style post footer and comments · 20 Nov 2026
- Owner (with a Facebook screenshot): "see the difference between Facebook's comments and the app: text, names, size and everything";
  "still you didn't organise the buttons, and the size of things and text".
  - Post footer (`IS.feedVoteBar`): one small stats line (`.fv-stats`: reactions pill «👍❤️ 3 تفاعلات» that opens who reacted · compact stars ·
    «5 تعليقات», hidden at 0) and, under a thin line, one row of equal flat buttons (`.fv-acts`): «👍 أعجبني» (shows the chosen reaction and its
    colour; opens the emoji picker) · «تعليق» · «مشاركة» · ⚑. Card title 16.5 px, summary 14 px. `IS.cmCount` = تعليق · تعليقان · تعليقات.
  - Comments: 36 px pictures (28 px for replies), grey bubble with 13 px name and 14.5 px text, one action line «time · أعجبني · رد» with the
    reaction count at its end, report/delete in a ⋯ menu beside the bubble; replies folded as one-line previews (picture, name, text) until
    tapped; the name of the person answered shows only when answering a reply. Comment boxes are slim rounded fields with a round send button
    (`IS.cmtBox`), growing with the text; Enter sends on computers.
- Asset version 185, shell cache ish-v85.

## One layout for every feed card · 20 Nov 2026
- Owner: «ضع مجاني والنجوم جنب بعض، فتح الكتاب أو السلسلة جنب تنزيل، عرض الكورس بحجم مناسب، أظهر النجوم وعدد المقيّمين فقط (بدون 4.0)، مجاني أخضر
  والمدفوع برتقالي». The price badge (`IS.priceTag`: green free, orange paid) sits in the stats line beside the stars (feed cards set `row._price`;
  series pass the first part's price); the stars show only the number of raters (`.gnum` hidden in the stats line); the price words are gone
  from detail lines and button rows; «عرض الكورس», «افتح الكتاب» + «تنزيل» and «افتح السلسلة» are the same equal buttons (`.library-feed-actions`);
  the share label is hidden on phones under 420 px so the action row never cuts a word.
- Asset version 186, shell cache ish-v86.
- Totals split (owner: «Distortion», the comments count ran off the card): `.fv-rate` = price badge + stars (raters only) on their own
  line; `.fv-stats` = reactions pill · comments count (wraps, hidden when both are empty). Asset version 187, shell cache ish-v87.

## Video hosting decision (owner, 20 Nov 2026)
- «نخلي اليوتيوب للمحاضرات المجانية، و Bunny لقدام للمدفوعة»: YouTube (unlisted) links for free lessons and free previews; paid recorded
  lessons move to Bunny Stream once the owner sets it up (to-do item 1). Reasons given to the owner: YouTube/Drive links leak and download
  easily, YouTube terms do not allow charging for access, age limits and copyright claims, ads; Drive blocks a file after many views and
  plays badly on weak networks. When Bunny is live: Studio should require an uploaded video (not a link) for lessons with price > 0 that are
  not free previews; until then the existing warning on paid link lessons stays. Live sessions: owner asked about costs (Daily, LiveKit,
  JaaS, protected Zoom/Meet links); not decided yet.

## Book page, single books and series parts · 20 Nov 2026
- Owner: «Distortion» on the book page on phones (details squeezed beside the cover, download button crushed); «the single book has no comment
  area nor reactions»; «no comments or reactions for books inside a series». Book page on phones: cover centred on top, title 22 px, the rest
  full width; `.file-actions` wraps (open = full row). My Library book card (`fileCard`, `.bcard`) = cover · type · title · author · tags ·
  «افتح الكتاب» + «تنزيل» (or buy) · ♡ / folder · the same feedback bar as feed cards (price + stars, reactions, comments, actions). Each series
  part has its own feedback bar (`.sp-fb`), and its buttons «افتح · تنزيل · تعديل الملف» stay on one row. Course page tabs are a 4-column
  grid on phones. Check used before publishing: scratchpad pages.js (file, series, course, post, request, event, news, library, home at
  360/390/820/1440: wider than the screen, off screen, squeezed buttons, words broken into a column).
- Asset version 188, shell cache ish-v88.
- Edit buttons are a round pen only (`.btn.iconly`); series parts show 📄 pages · 📖 page reached · ✅ finished · ⏳ awaiting review and a thin
  reading-progress line; series show only the number of parts (`IS.partsCount`), not pages. Asset version 189, shell cache ish-v89.

## Full series editor, series cover, saving feedback · 20 Nov 2026
- Owner: «edit book series should be for everything like you are doing it from start, and also can put cover picture for the series»;
  «مجاني مكرر، ومكان التعليق والتفاعل ممكن يكون فوق مع السلسلة»; «it takes long time to upload a file or make or edit a post».
  - `042_series_full_edit.sql`: `files.series_cover` (public media picture); `ish_submit_series_revision(target, revised)` = name, type, subjects,
    author, description, tags, free/paid + price with the rights declaration, series cover, order of parts, new part names, parts to remove
    (at least one stays); stored as the series revision (`changes.full`); approving (`review_library_revision`) applies it to every part
    (series_no from the order, titles, removed parts status removed). New parts = ordinary uploads into the series (pending); an insert guard
    stops anyone adding a part to another owner's series and copies the series cover. Editor = series.js `IS.ACT[edit-library-series]`
    (cover, fields, sale fields, parts list with rename / up / down / remove, «أضف أجزاء جديدة»); Control review shows cover, price, type,
    the new order with old names and the parts to remove. Cards and the series page use `IS.seriesFace` (series cover first).
  - Series page: the feedback bar is inside the series box (`.shead-fb`); no second price badge; removed parts never shown.
  - Every form button shows a spinner and «جارٍ الحفظ…» at once, and «جارٍ الرفع 45%» while a file uploads (db.js live upload sends with
    XMLHttpRequest and reports progress through the `ish-upload` event; falls back to supabase-js). Real speed is limited by the network and
    the Ireland server (R2 move before launch).
- Asset version 190, shell cache ish-v90.
- Series page (owner: «nothing like open from start»; «تعديل السلسلة فقط قلم»): no «ابدأ من الجزء الأول» button (each part opens from its row;
  «تابع: الجزء N» only after a part was started); the series edit is a small pen in the corner of the series box (`.shead-edit`).
- Request cards, new design (owner: «Request appears badly, the star down, people who join and organisation of text and design»): `requestCard`
  = cover with the status on it (or the status beside the name when there is no cover) · requester and time · title · speciality · section ·
  lecturer · two lines of details · facts line (joined · date · price badge); no approval star; in Control «وافق وانشر» / «ارفض» on the card.
- Asset version 191, shell cache ish-v91.

## Ask the named lecturer before publishing a request; notification badge · 20 Nov 2026
- Owner: «إذا جاء طلب من طالب يطلب محاضرًا معينًا، كيف تبلغه الإدارة قبل الموافقة»; «المحاضر يضع شروطًا (عدد الطلاب، السعر لكل طالب، الزمن)،
  والأدمن يحوّل الطلب إلى إعلان كورس أو يبقيه طلبًا والناس تبدي اهتمامها». `043_lecturer_check.sql` + course-requests.js:
  - `ish_request_check(request, action, payload)`: ask (team) → the lecturer is notified («طالب يطلب كورسًا منك: هل أنت متاح؟») and may read the
    waiting request; answer (the named lecturer: available + price per student, students, date and time, conditions / unavailable / needs details +
    note; kept on the request `ask_*` and, when available, as the lecturer's private offer) → team alert; publish (team): announce = open with
    the lecturer's terms as the accepted public agreement (price → payment, students → target with automatic closing, date) · request = open as a
    plain request (people register interest; lecturer told) · general = lecturer removed, open for anyone.
  - Control card: ask status chip, «اسأل المحاضر» / «انشر كإعلان كورس», «انشر كطلب» / «ارفض»; Control request page: panel with the lecturer's
    terms and the three publish choices. Studio → Teaching opportunities lists asked requests first; the request page has the answer form.
- Push notifications use `badge-96.png` (white logo on transparent; the full-colour icon showed as a white square in the Android status bar).
  «ألغِ اشتراكي» under a website notification is added by Chrome on Android and cannot be removed by a site.
- Asset version 192, shell cache ish-v92.
- Control dashboard (owner: «احمد كمحاضر مكرر؛ الاشتراكات الفعالة مقصود بيها شنو، لو عن الكورسات ما يحسب المجاني»): quick figures = «اشتراكات
  مدفوعة مؤكدة في الكورسات» (active enrolments with price > 0) and «تسجيلات في كورسات مجانية» apart; revenue this month = confirmed paid
  enrolments decided this month; the average rating reads «4.5 / 5». The «طلبات المحاضرين (للاعتماد)» box lists only waiting requests; a person
  with several decided applications shows once (`IS.cleanApps`, control-apps). Asset version 193, shell cache ish-v93.
- **Fast like Facebook (owner, 20 Nov 2026: "making a post or editing or opening … should not feel slow"):** a comment or reply shows the
  moment it is sent (threads.js `IS.instantComment`, faint `.sending` until saved, then a quiet redraw with `IS.quietRefresh`; on failure the
  text goes back into the box with a message) on posts, books and requests (requests now use the pill box `IS.cmtBox`). The post page asks
  the server for its course, comments and lecturers together (`Promise.all`). db.js `forgetFor`: a comment, comment reaction or post
  reaction forgets only its own tables and the counts of what it is on (`NEAR`); every other write still forgets all saved reads. The
  client no longer sends a second reply notification when live (the 039 trigger does it). Measured with a 300 ms delay per call: comment
  visible 2.2 s → 0.1 s, post page 1.6 s → 1.25 s. Asset version 194, cache ish-v94.
- **Courses have reactions too** (owner, 20 Nov 2026: "why the course still has no interactions; I told you for all posts"): course cards
  in the feed and the course page show the same reactions pill and «أعجبني» picker as every post (`feedVoteBar` no longer leaves them out;
  the server already accepted course reactions in 040, and comments were working). Stars on courses stay enrolled students' reviews.
  Asset version 195, cache ish-v95.

## No waiting, and the app works offline · 20 Nov 2026
- Owner: "do what is needed to make the user feel no delay, and also it works offline". All in js/db.js (live mode), core.js and threads.js.
  - **Saved data on the phone:** every database read (`DB.q`, `DB.one`, and the read-only rpcs in `SAVE_RPC`) is also kept in IndexedDB
    `ish-data` (store `r`, key `<account id>|<read>`, newest 900). Opening a page answers from the phone at once and asks the server in the
    background; when the server's answer differs, `ish-fresh` redraws the page in place (core.js, skipped while the person types, a sheet,
    picker or comment panel is open or a button is saving; tried again 4 s later). A read held in memory and older than 1.5 s is checked the same way.
    After the person's own change the related saved reads are "dirty" (`forgetFor` / `NEAR`): the server is asked first and the saved answer is
    used only after 1.5 s without a reply. Background calls that change nothing on screen (`QUIET_RPC`: ish_seen, ish_space_join,
    ish_push_save; tables reader_state, push_subs) no longer empty the saved reads. Sign-out deletes them (`DB.clearSaved`).
  - **Offline:** pages are built from the saved data (fully working, not the read-only HTML copy; that copy and the offline card remain the
    fallback when nothing was saved, router timeout 2.5 s offline). Comments (post, course, event, news, book, series, request, replies) and
    reactions (posts, comments, series) made offline go to an outbox (`ish-outbox` in localStorage, per account), show at once with
    «⏳ يُرسل عند عودة الاتصال», stay in place after moving between pages (`pendingRows` adds them to the comments read from the phone) and are
    sent in order when the internet returns (also every 30 s and after sign-in). The offline bar says what works and how many are waiting.
    Other changes (payments, uploads, editing, approvals) still need the internet.
  - Test: scratchpad lf3.js = the app in live mode against a fake Supabase in the page (300 ms per call): post page 0.9 s first time → 16 ms
    again, 36 ms after reopening the app; a comment added on the server appears by itself; offline home and post pages work; offline comment and
    course reaction kept and sent when back online.
- Asset version 196, shell cache ish-v96.
- **Same buttons on every post; rating works again** (owner, 20 Nov 2026: "all posts have the same reactions and buttons like share, comment,
  reaction; some posts miss buttons; people can't rate while it shows stars"): the star panel looked for the old footer (`.feed-action-row`)
  and failed silently since the Facebook-style footer, so no post could be rated; it now opens under the stars line (`.fv-rate`). Your own
  post says «هذا منشورك؛ يقيّمه الآخرون». `feedVoteBar` gives every kind the same row: reaction · comment · share · report (share route by kind
  when the caller gives none; announcements share #news/ann; a series reports its first part). Course stars are a button that explains
  enrolled students rate on the course page and opens it. Test: scratchpad same.js. Asset version 197, cache ish-v97.
- **Other accounts see ratings and reactions quickly** (owner, 20 Nov 2026: "I rated a post, then from another account it didn't appear even
  after updating the page"): (1) the quiet redraw never ran on Home: `busyNow` (core.js) took the feed's sort/type drop-downs as edited
  (a select has no defaultValue); drop-downs now count only when their choice changed, and the feed toolbar never blocks. (2) live.js
  `refreshItem` updates the stars too (`IS.updateLibraryRating` with rating_count / rating_points), not only reaction counts. (3) The backup
  check of `live_pulse` runs every 5 s while the live connection is down (every 20 s while it is up), and a dropped live connection is opened
  again after 10 s. Test: scratchpad rate2.js (fake Supabase: stars appear by themselves; after a reload the newer figures show in 0.7 s).
- Reaction emojis in the summary sit side by side (no overlapping circles; heart and angry looked inside each other). Asset version 198, cache ish-v98.
- **Ratings reach other accounts in about a second** (owner, 20 Nov 2026: "rating still takes longer to appear"): (1) the backup check
  compared the server's change times with the PHONE's clock (`lastAt` started as the phone's time), so a phone whose clock runs ahead missed
  every change until a reload; it now starts from the newest server time (first poll only reads it). (2) A direct message between open apps:
  after a rating, reaction or comment is saved, db.js fires `ish-sent` and live.js sends a Realtime broadcast `pulse` {key} on channel
  `ish-live`; the other apps redraw that item at once (does not depend on the database feed; the database feed and the 5 s check stay as
  backups). (3) The deploy log prints whether `live_pulse` is in the `supabase_realtime` publication and how many pulses came in the last
  hour. Test: scratchpad rate3.js (two windows, 300 ms per server call: the second window shows the new rating 0.9 s after the first presses).
  Asset version 199, cache ish-v99.
- **Comment names on one line like Facebook** (owner, 20 Nov 2026: "AHMED MOHAMMED HAMID DWALBYT appears in 2 lines"): the name in a comment
  bubble never wraps (13 px, semibold); a name longer than the screen allows is cut with … (max width min(100vw − 150 px, 520 px); replies
  40 px less). The small reaction emojis on a comment are separate (`.cmt-es i`), so 👎 no longer sits on ❤️. Test: scratchpad nm.js.
  Asset version 200, cache ish-v100.
- **Comments, second pass** (owner, 20 Nov 2026: "still very bad", with a screenshot): the comments box is a grid whose column grew to the
  longest one-line name, so the bubble, its ⋯ and the comment field ran past the card's left edge; columns are now `minmax(0,1fr)`. The ⋯ menu
  moved into the line under the comment (time · أعجبني · رد · count · ⋯, like Facebook), so the bubble and name use the full width; names
  12.5 px semibold (12 px under 380 px), avatars 32 px on phones; the reaction count follows «رد» instead of sitting far away; the chosen
  reaction emoji is text-sized. «AHMED MOHAMMED HAMID DWALBYT» fits on one line at 360 and 390 px; only names longer than the screen get ….
  On phones the share button is icon-wide so «أعجبني» is never cut. Test: scratchpad nm.js. Asset version 201, cache ish-v101.
- **Report like Facebook** (owner, 20 Nov 2026: "the report is bad"; it was one bare text box): `IS.ACT.report` (student.js) opens «الإبلاغ عن
  منشور / تعليق / ملف …» with eight tappable reasons (wrong or misleading medical information, spam, abuse, inappropriate content, shared without
  permission, scam, reveals a patient's details, something else) as a list with round select buttons, optional details (required for «سبب آخر»),
  «أرسل البلاغ» enabled once a reason is chosen, then a confirmation in the same sheet (the author is not told who reported). The saved reason
  is "<reason>: <details>", so Control → Community shows it as before. The same account reporting the same item again on this device sees
  «أبلغت عن هذا من قبل». Test: scratchpad rep.js. Asset version 202, cache ish-v102.
- **⚑ instead of ⋯ on comments; «إدارة» on every card** (owner, 20 Nov 2026): the line under a comment shows ⚑ (report, opens the report
  sheet) and «حذف» in red when allowed (`.cmt-tools`); no ⋯ menu. The team's manage button is a gold pill with a shield and «إدارة»
  (`IS.manageBtn`) in every feed card header, on library cards (corner of the cover, `.mng.onc`), series cards and the series page team bar.
  New kind `series` (library approve): rename the series for every part, open its page, or hide the whole series (all parts «removed»,
  undo from Control). Test: scratchpad mng.js. Asset version 203, cache ish-v103.
- **Your current picture and name on everything you wrote** (owner, 20 Nov 2026: "I changed my profile picture but it didn't appear in the
  comment area"): comments and posts keep a copy of the writer's name and picture (book and request comments had no picture at all).
  `044_profile_sync.sql`: `author_photo` on course_request_comments and library_comments; a BEFORE INSERT trigger `fill_author` takes the name
  and picture from the writer's profile for posts, replies, request comments, library comments and course requests (also stops posting
  under another name); `profile_sync` (AFTER UPDATE OF name, photo ON profiles) rewrites them on everything the person wrote; existing rows
  filled once. threads.js `IS.commentItem` shows the signed-in person's current picture and name on their own comments at once. Tested on
  the local Postgres (file twice; a FAKE name replaced by the profile name; a profile change reaches posts and replies). Asset 204, ish-v104.
- **The React button is not an emoji** (owner, 20 Nov 2026: "the reaction area emoji should be different from the reactions; it shows the last
  reacted emoji and looks confusing"): `IS.rxIcon(key)` (course-requests.js) draws a line icon: grey outline thumb + «أعجبني» before reacting,
  then the chosen reaction's own line icon (thumb up, heart, frowning face, thumb down) and word in its colour (blue / red / orange / dark red).
  Under comments the chosen reaction is its word in its colour (no emoji). Colourful emojis appear only in the reaction counts and the
  picker. Test: scratchpad rxb.js. Asset version 205, cache ish-v105.
- **Same team tools on every post; authors' ✏️ 🗑️** (owner, 20 Nov 2026: "admin control should be the same in all posts: delete, suspend,
  send to the owner to adjust; nice emoji instead of words; owners have edit and delete on their posts"): `045_team_tools.sql`:
  `ish_team_act(kind, target, action, note, data)` (kinds post · file · series · course · event · news · notice · request; actions edit ·
  suspend · resume · return · delete; definer, so team edits of library text pass the library edit guard; same permissions as before; every
  action in the activity log; return = a notice to the author, optionally suspended until fixed; suspended = status 'suspended', a request
  goes back to 'pending'; notices got a `status` column) and `ish_own_delete(kind, target)` (own post, file, series, event or request; a
  request with payments stays). manage.js rewritten: «🛡️ إدارة» opens emoji tiles ✏️ تعديل · ⏸️ إيقاف مؤقت / ▶️ أعد النشر · 📨 أرسل للمالك ليعدّل
  · 🗑️ حذف (requests waiting: ✅ وافق وانشر · 🚫 ارفض), with the item's state; `IS.ownBtns(kind, row)` puts ✏️ 🗑️ in the header of the author's
  own feed cards (post edit, library upload edit, series editor, request edit, event form, course → studio). Suspended announcements are
  hidden from students. The series rename of 203 went through DB.upd and would have been refused live by the library guard; it now uses
  ish_team_act. Tested on the local Postgres (suspend, return with note, resume, file and series edit, finance refused, own delete, other's
  post refused) and in the browser (scratchpad mng3.js).
- Library series cards are labelled «المكتبة» like single books (owner: «ما محتاج تكتب سلسلة في المكتبة»); the type line no longer adds «· سلسلة».
- **Lecturers: who is online** (owner: «في مكان المحاضرون مفروض أعرف منو أونلاين»): green dot on the picture, «● متصل الآن» in green or
  «آخر نشاط قبل …» on each card. `046_presence.sql` re-applies 010 (it had been applied by hand only); the deploy log prints whether
  ish_presence exists and how many accounts were active in the last 10 minutes. Lecturer cards (owner: «الأسماء الطويلة مفروض ما تأثر على شكل
  العرض»): names up to two lines with room for two in every card, one-line titles, the same rows in every card and the button at the bottom.
- **Comments saved twice, reactions undone** (owner: "I put a comment and it came duplicated"): db.js wrapped a supabase rpc builder with
  `Promise.resolve(call)` twice; a builder sends its request again on every then(), so since asset 194 social rpcs ran twice (comments
  doubled, a reaction toggled on and off). The call is now made into one promise first. `047_duplicate_comments.sql` removes copies (same
  writer, place and text within 10 s). The fake Supabase in scratchpad rate4.js now behaves like a builder (counts requests: 1 per rating).
  Asset version 206, cache ish-v106.
- **Reactions that seemed to vanish; lecturer ratings; author tools on detail pages; paid items through the team** (owner, 20 Nov 2026):
  - db.js `WSEQ`: every change made by this person counts up; a read that started before a change and answers after it is neither shown nor
    saved (marked dirty instead), and writes forget again once the server has them. The vanishing reaction itself was the double request
    fixed in 206 (the second toggled it off); rx5.js (builder-like fake Supabase, react while a background refresh runs) stays correct.
  - Every lecturer has a rating (`IS.lecRating` / `IS.lecStars`): the reviews of their published courses, weighted by the number of reviews,
    on lecturer cards and the lecturer page; «☆ لم يُقيَّم بعد» when none.
  - Names: `IS.lecName` writes a title only if the lecturer wrote one, in the name's script («Dr. Arja», «د. عبدالجليل»; never «د. Arja»), on
    cards, the lecturer page and the course page.
  - Course page lecturer block (`.chlec`): medium picture centred, name, title and online status in one column; the lecturer picture
    follows the profile picture (`048_own_paid.sql` trigger `lecturer_photo_sync`, backfill of empty lecturer pictures).
  - Authors see «كورسك / فعاليتك / ملفك / طلبك» with ✏️ 🗑️ at the top of their own course, event, upload, series or request page (`.ownbar`,
    manage.js onRoute). Paid course, book or series: ✏️ / 🗑️ open a message to the team (`own-ask` → `IS.newTicket('content')`, subject
    «طلب تعديل/حذف: …») and the bar says «مدفوع: التعديل والحذف عبر الإدارة»; `ish_own_delete` refuses paid items (`own_delete_paid`) and now
    hides a free course (runs that one checked update as the server, since the course guard only lets lecturers move to draft/review).
  - Course page on phones: tabs on one line («التقييمات 1»), reviews = picture · name and time on one row · stars · text.
  Test: scratchpad own.js, cpage.js, local Postgres t48.sql. Asset version 207, cache ish-v107.

## New design level, page by page (owner, 20 Nov 2026: "I am taking the design of the app to this level … I am going to send other pictures
## and try to match all the app")
- **Section chooser** (`#pick-section`, his two pictures): blurred hospital background with a navy overlay (`img/collection/bg-hospital.webp`,
  made from medicine-clinical.webp, blur 14; not fixed on touch screens), white welcome bar (picture, «مرحبًا بك Dr. Arja», bell), white title
  «اختر قسمك» with a stethoscope and two glowing heartbeat lines, subtitle with the speciality, cards in each section's colour (`--sc`:
  Clinical blue #1f6fd6, Basics green #12a37c, House Officer purple #6c4bd6, International Exams orange #e5801f; tinted label side, coloured
  diagonal edge, round arrow on the photo corner), and white pill buttons under them (English/العربية, Lecturer studio for lecturers, Terms
  and privacy, Control app for the team; one row of small buttons on phones). Side menu kept on laptops (his second picture). CSS block
  "Section chooser in the owner's design". Asset version 208, cache ish-v108. Next pages follow the owner's coming pictures.
- **Teal glass design across the app (owner, 20 Nov 2026, his Clinical Home picture: "match the colors"; his photo of #pick: "bad background,
  buttons not fit"):** CSS block "Owner's teal glass design" at the end of app.css (light theme only; dark keeps its colours). One deep teal
  (`--tealg` #0a5562 → #127886) for active menu items, primary buttons, banners, the speciality chip and the search button; white glass
  (`--glass`) for the top bar (a floating rounded bar on laptops), the side menu (a floating rounded panel with the emblem and «اشرح لي» at its
  top, `.sbrand`; the top bar hides its own name there), boxes and cards; page background = a blurred hospital ward on the page root
  (`body::before`, `img/collection/bg-ward.webp` made from events.webp; the plain colour sits on `:root`, never on body, or it hides the picture).
  Section chooser: no dark wash, teal title, all four cards teal with big signs. Speciality chooser (#pick): same light ward (the pale sky and
  campus strip are gone), teal cards with a round arrow, the buttons under the cards in ONE row across the full width (2 rows were squeezed).
- **Home feed on laptops (owner, 20 Nov 2026: "on the phone good … on the laptop this mess"):** from 1024 px cards sit side by side
  (`auto-fill, minmax(300px,1fr)`: three on a 1366 laptop), every card in a row the same height, each card = label and time · title · a wide
  16:9 picture · stars and buttons at its foot; no lone last card across the row; a card without a picture puts its text in a soft panel.
  Card labels and times never break inside a word. Asset version 209, cache ish-v109.
- **Pages from the owner's design pictures (20 Nov 2026: Courses, Events, News, Lecturers, Community):** CSS block "Page banners, empty
  states and Courses in the owner's design" + following blocks. Every page banner (`.ban.bpic`, light theme): deep teal panel, white title,
  bright teal icon tile, a small heartbeat line after the title (`.bt::after`, SVG), the photo on the other side with a slanted edge
  (clip-path) and a bright teal line along that edge (`.ban.bpic::before`, drawn over the photo's own box; skipped for studio and long titles);
  banner count tiles white. Empty states = glass card, big teal sign, teal button. Courses: filters, search, sort and view in one row from
  1280 px; one or two results are wide cards (picture beside the details). Lecturers: the join card is teal with the studio photo and a cream
  button; an approved lecturer sees «استوديو المحاضر · افتح الاستوديو» there. Asset version 210, cache ish-v110.

## Master Review design, page by page (owner, 20 Nov 2026: "we are going to name the platform Master Review"; "start from the main screen")
- Name: `IS.brandName()` = Master Review / ماستر الطبي. Green and gold look from the owner's pictures; built one page at a time, each shown to
  him before the next. Preview of the first screen alone: `ishrah/mr/` (ishrahli.org/mr/).
- **Speciality screen `#pick` and section screen `#pick-section`** are re-registered in `js/mr.js` (loads after student.js) with `css/mr.css`
  (root class `.mrx`; `.mr` is already an app class). No app top bar, side menu or bottom tabs there. Top: Home, profile chip (or Sign in),
  logo `img/mr/logo-gold.webp` + name, bell (red dot follows #bellN), ONE day/night button (`data-act=theme`), Settings. Welcome with laurels,
  «Choose your speciality / section» pill, cards, glass dock: Language · Studio (studio or studio-apply) · Terms · Admin (team only) ·
  Features (section screen: `IS.ACT.mrfeat` opens every side-menu place as gold tiles; the owner: "we are not going to show the side bar
  anymore"). Backgrounds `img/mr/bg-wide.webp` (landscape) and `bg-tall.webp` (portrait). Section circles: Medicine uses the owner's pictures
  `img/mr/sec-medicine-<basics|clinical|special|house>.webp`; other specialities use their existing section artwork until he sends theirs.
  Fits one screen with no scroll at 1672×941, 1366×660, 820×1180, 390×844, 360×640 (scratchpad app2.js). Fonts: Poppins in `fonts/`.
- **Sudan Master Review Academy (SMRA), owner 20 Nov 2026:** `IS.brandName()` = Sudan Master Review Academy; inside the app the LOGO carries
  the name (no written name beside it): `img/mr/logo-smra.webp` (owner's logo with the Arabic and English names; the checkerboard baked into
  his PNG was removed, scratchpad logo/cut.py) and `img/mr/smra-mark.webp` (emblem only, sign-in windows).
- **Section page `#home` and My Library `#library` in the owner's pictures** (mr.js wraps the original pages through `IS.pageOf(name)`, so all
  data and actions stay): small top bar (Home → section chooser, Search, Features grid · SMRA logo · day/night/eye button, bell, account),
  banner = photo + teal panel with a gold curve (`pban`), title pill «محتوى …» (`ptitle`), filter bar (Sort · Post type / Content type ·
  Publish or Share; Library adds a subjects filter button), Library: «ملفاتي» and «مبيعاتي», white cards with the picture or cover at the side.
  The old welcome band, search box and place buttons are hidden there (every place is in Features). Light mint page; dark theme dark green.
- **One theme button cycles Day → Night → Eye comfort** (`IS.ACT.theme` in mr.js; owner: "one press gives day, night, eye protection").
- **Bottom bar on the new pages** (owner, 20 Nov 2026): Library · Courses · Community · Lecturers · My learning (`bnav` in mr.js, `.mh-nav`,
  fixed at the bottom, the current page in teal). **Roles (Platform owner, Lecturer …) are shown only inside the profile** (`#account` wrapper
  in mr.js puts `IS.roleChips` under the name; removed from the More sheet).
- **Profiles in the owner's design** (20 Nov 2026, his two pictures): `#account` (mine) and `#person/<id>` (anyone; names in feed posts and
  comments link there). Cover, picture in a gold ring (camera on mine), name + verified sign (team or active lecturer), title/year, roles (mine
  only), bio, chips (speciality, university, city), Posts · Followers · Following, Follow / Following button (others) or Edit + ⋮ menu (mine:
  courses, certificates, favourites, notifications, account settings, settings, support, security, studio or apply, team card, sign out),
  tabs Posts · Files · Saved (mine). `#account/settings` keeps the older page. Migration `049_follows.sql`: table `follows` (own rows
  only), `ish_profile_card(uid)` (public card, never phone or email; counts and `me_follow`), a notice to the person followed. Tested on the
  local Postgres. The bottom bar is full width and attached to the page edge (owner: "not separated").
- **Courses in the owner's picture** (20 Nov 2026): `#courses` wrapped in mr.js (banner, «محتوى الكورسات», Sort · Category (subject) ·
  filter button (the older price/lecturer filter as a panel) · «إنشاء كورس» for lecturers / «اطلب كورسًا» for others). While that page is on
  screen `IS.courseCard` draws `mrCourseCard` (`.mc-card`: «كورس» label, title, subtitle, lecturer, stars and grade, picture with the
  section and ♡, then price · time · students · lessons · Enrol / Continue / View details); elsewhere the older card stays.
  Bottom bar now starts with «الرئيسية» (the section page); the top 🏠 opens the section page, or the section chooser when already there.
- **Post layout in the owner's picture** (20 Nov 2026, all feed and library cards): header label · 🕒 time · «إدارة» (✏️ 🗑️ hidden when
  «إدارة» is there), title, subtitle, «subject • kind», 👤 author line, «افتح الكتاب» filled + «تنزيل» outlined; a stats line
  [🎁 مجاني | 💬 6 تعليقات | 👍👎 3 تفاعلات … ★★★★★ (1) in a grey pill] (words hidden under 440 px, numbers stay); buttons as outlined
  pills: أعجبني (light blue) · تعليق · share · ⋮ (= report). CSS at the end of css/mr.css (`.mrh .feed-votes`).
- **Every other student page in the new frame** (owner, 20 Nov 2026: "organise the remaining pages"): core.js calls `IS.pageFrame(name, html)`
  (mr.js) for every student page that is not already a `.mrx` page: new top bar, light page, bottom bar (active item by `NAVOF`), the page
  inside `.mh-old`; CSS `.mra` restyles the shared parts (banners → photo + teal panel with a gold curve, boxes, pill buttons, tabs,
  fields). manage.js's «yours» / «team tools» bars move into the page's path line (`.crumb`) or under the top bar; ✏️ 🗑️ hidden when
  «إدارة» is there. Not framed: cert, pick, pick-section; studio and control keep their own look.
- **Section page opens at once** (owner: "I keep feeling this delay"): the last loaded posts of each section are kept on the phone
  (`localStorage mr-feed:<account>:<spec>/<section>:<lang>`) and shown immediately; the fresh feed replaces them when it arrives.
- **Lecturer page in the owner's picture** (20 Nov 2026): mr.js wraps `#lecturer/<id>`: teal card (cover photo, gold wave, picture in a
  gold ring with a blue verified sign, name in a gold-edged pill, title chip, last activity, section | speciality, «متابعة» gold (follows,
  migration 049) · «إضافة للمفضلة» · «اطلب كورس أو محاضرة»; the lecturer sees «تعديل صفحتي» and «الاستوديو»), then courses · followers,
  Qualifications and Rating tiles (tap scrolls to them) and «تاريخ التسجيل كعضو». About, qualifications, courses, events and links follow.
- **Student and admin profiles in the lecturer design** (owner, 21 Nov 2026): `#account` and `#person/<id>` use the same teal card (`lp-*`):
  admin = role chip («مالك المنصة», «المدير العام») + «راسل الفريق»; lecturer = title + «صفحة المحاضر»; student = year (or «طالب») and a
  University tile; then posts · followers · following, Role/University and Files tiles, city, «تاريخ التسجيل كعضو». Own profile: camera on
  the picture, «تعديل الملف» + «المزيد». Migration `050_profile_card_roles.sql` adds role (never p:*), lecturer and created_at to the card.
- **Profiles, owner's second picture** (21 Nov 2026): plain big name, gold-edged title chip, one row of four figures (`lpStats`: lecturer =
  followers · courses · rating · qualifications; person = followers · posts · achievements (own) / following (others) · role, title or
  university), contact tiles (lecturer: the email / WhatsApp he put in his public links; own profile: own email and phone, seen only by
  you; never another person's private contact), city, «تاريخ التسجيل كعضو».
- **Rating as a pop-up** (owner, 21 Nov 2026: "like the reactions: the stars appear and you choose; not opening below"): library.js
  `rate-library-file` opens `.library-rate-panel.pop` (fixed, placed above the stars, else below), five big stars; a choice saves,
  closes it and shows «حُفظ تقييمك ★★★★»; a tap elsewhere, scrolling or leaving the page closes it.
- **Lecturer page, owner's description** (21 Nov 2026): under the teal card, four small buttons — المتابعون · الكورسات · الإنجازات ·
  المؤهلات — each opens its list in a sheet (`IS.ACT['lp-list']`: followers from `ish_followers` (migration 051, name and picture only),
  courses, achievements made from real figures (approved lecturer, courses, students taught, rating, events, followers), qualifications);
  then «التواصل» (WhatsApp number → wa.me, email → mailto, from the lecturer's own public links; the lecturer is invited to add them on
  My page); then two small tiles «عن المحاضر» (opens the bio) and «تاريخ الانضمام». The long boxes below were removed; courses and events stay.
- **Lecturers list**: compact horizontal cards (picture in a gold ring, name, title, rating, courses, «عرض الملف»), the studio / join card
  teal with white text and a gold button.
- **Compact sizes** (owner, 21 Nov 2026: "things and text are big; one has to scroll"): a block at the end of css/mr.css makes banners,
  titles, posts, course and library cards, profile and lecturer cards, buttons and the bottom bar smaller. Keep new parts this size.
- **Contact asks first** (owner, 21 Nov 2026): the WhatsApp / email tiles on the lecturer page open a small sheet («ستنتقل إلى واتساب لمراسلة
  …» with the number, «متابعة إلى واتساب» / «إلغاء»); only «متابعة» opens wa.me or mailto (`IS.ACT['lp-contact']`).
- **Contact = one button** (owner, 21 Nov 2026, replaces the contact tiles and the confirm sheet): «التواصل مع المحاضر» opens a list of the
  ways (WhatsApp number, email), each row with a small «راسل» (green for WhatsApp, blue for email) that opens wa.me / mailto.
- **Lecturers list in the owner's picture** (21 Nov 2026): mr.js wraps `#lecturers`: a `.mlc` card per lecturer — picture panel (gold ring,
  online badge, stars and rating count, courses) beside name + verified, title, two lines of bio, speciality | section, followers; buttons
  «عرض الملف» · «متابعة» (follows) · «إعجاب» (favourite).
- **Lecturer card, owner's third picture** (21 Nov 2026; `.mlx`, replaces `.mlc`): picture in a gold ring with a small online / last-activity
  badge, name + verified with the title as a green pill (no bio on the card: owner, 21 Nov 2026); one line: rating · section · speciality ·
  courses · followers; buttons «عرض الملف» · «متابعة» · «طلب» (course or lecture request to this lecturer) · «مفضلة» (bookmark icon).
- **Buttons and labels are never cut** (owner, 21 Nov 2026): on the new pages button text is smaller (clamp by screen width) and wraps to
  a second line instead of «…» when a phone has a bigger system font; the lecturer-card buttons drop their icons when the card is narrow
  (container query). Check new buttons at 360 px: `scrollWidth > clientWidth` must find nothing (scratchpad big.js).
- Lecturer card (owner, 21 Nov 2026, latest): the picture alone; the name on its own line; under it the title pill and the last-activity
  pill (green «متصل الآن», grey «آخر نشاط قبل …», never cut).
- **Stars without numbers** (owner, 21 Nov 2026): ratings are still the average of everyone's stars, but the new pages show only the stars
  (no grade words either): `.gnum` / `.gcount` and the numbers in lecturer and profile ratings are hidden by CSS.
- **Release step changed (21 Nov 2026, owner: slow loading on weak networks):** do NOT bump one `?v=` for every file any more. Run
  `python3 tools/ishrah/stamp.py`: each file in index.html gets `?v=<hash of its content>` (the colour stylesheets share one hash), so a
  phone downloads again only the files that changed. Still bump `SHELL` in sw.js; its install now copies everything the phone already has
  from the older cache (pictures, fonts, unchanged scripts) instead of starting empty. Collection pictures keep `artworkVersion` '181'.
- **Community page, owner's picture** (21 Nov 2026): figures in one strip with thin separators (green dot beside «متصل الآن»), then four
  buttons الإعلانات · الموارد (course previews) · الأسئلة · النقاشات that show only that kind of post (`IS.ACT['cm-kind']`, posts carry
  `data-pk`); posts are white cards with small pill buttons.
- Community: above the posts the same bar as the section page — الترتيب (الأحدث · الأكثر تفاعلًا · الأكثر تعليقًا, reorders the list on the
  page) · التصنيف (same as the four kind buttons, kept in step) · «انشر» (replaces the big «اكتب منشورًا» button).
- Community posts use the section page's post card (`IS.feedPostCard(row)` in student.js = the Home `feedCard`): header, reactions,
  comments, share, ⋮, stars, «إدارة»; list `.cm-feed` (filters and sorting work on it).
- Report is a red flag everywhere (owner, 21 Nov 2026), not ⋮.
- **Only Medicine is open** (owner, 21 Nov 2026): on `#pick` the other specialities show a lock and «قريبًا» and cannot be chosen
  (`IS.specLocked(id)` in mr.js; the platform owner, `team` has 'owner', can still open them). A device that had chosen a locked
  speciality is sent back to `#pick` (core.js route gate). To open a speciality later, change `specLocked`.
- **Post page reads like a post** (owner, 21 Nov 2026: "the question and its description and all the other things are misplaced"):
  student.js post page = `article.thread.pthread`: header (picture · name · «الآن · سؤال» kind in the app colour · 📌 when pinned) with the
  writer's / team's small emoji tools at the end of that line (✏️ edit for the writer, 📌 pin and 🗑️ remove for moderators, 🗑️ own delete for
  the writer otherwise), then the title and the text full width, then stars (at the start) and the action row; the separate row of
  «عدّل المنشور · تثبيت · حذف» pills is gone. The comment field is one rounded field (no inner box: `#main .cmt-rbox textarea` beats the
  framed pages' input rule). CSS at the end of css/mr.css. Test: scratchpad post.js (390, 1440).
