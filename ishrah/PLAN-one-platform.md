# One platform on studentmasterreview.com: handover and plan

Owner's decision, 22 Nov 2026. This file lets any Claude account (or ChatGPT) continue the work without the earlier conversations.
Read it together with `ishrah/CLAUDE.md`, which has the detailed history of every feature.

## What the owner wants (his words, summarised)

1. **One platform, one system: SMRA.** SMRA is Sudan Master Review Academy, today at https://ishrahli.org. It should live on
   **studentmasterreview.com**, whose name suits the academy.
2. **Every book and file of the platform opens inside SMRA.** This includes the three books we built (Surgery, Pediatrics, Obstetrics)
   and all library books and files.
3. **The books keep their features inside SMRA.** These are the reader, highlights, notes, pen, flashcards, question bank, Rapid Review,
   progress and sync. Other books in the platform should later get the same features.
4. **One account, one subscription system, one admin, all inside SMRA.** No more codes or device numbers.
5. **Sub-apps and shortcuts for the main places.** Examples are SMRA Surgery, the Library, the Courses and Clinical. A student who wants
   Surgery opens it straight away without going through the platform's start. All sub-apps share the same account and data.
6. **Everything stays connected,** works online and offline, and is fast to move around.

Language with the owner: short Sudanese Arabic replies, with screenshots or videos of anything visual **before** publishing. He decides
by seeing. Standing rules: never commit keys or passwords (the repository is public), and never show another person's phone or email on
a profile card.

## Where everything is today

### SMRA (Ishrah Li)

| Item | Where |
|---|---|
| Code | `ishrah/` in this repository (jaberarja555-create/obstetrics-master-review) |
| Branch (live) | `ccr-38b3f943-ba1ode`. Every push that touches `ishrah/` deploys to **https://ishrahli.org** |
| Second branch | `ccr-67fd949c-z3vfp5`. It mirrors the live branch; push to it too |
| Deploy | `.github/workflows/ishrah.yml` deploys to the Cloudflare Pages project `ishrah`. It also applies changed database files listed in the workflow, in order |
| Database | Supabase project `fglawgpusfbgkokpnoej` (Ireland). GitHub secret `ISHRAH_DB_URL`. Migrations `ishrah/supabase/0NN_*.sql`; the last one is `056_contact_guard.sql`. **A new migration must be added to the workflow list (variable and loop)** |
| Pages secrets | SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, the Anthropic key for the guide assistant, Bunny keys (not set up yet) |
| Domain | `ishrahli.org` is registered at **Hostinger**; its DNS is on Cloudflare; HTTP/3 is off |
| Email | Hostinger mailboxes `no-reply@ishrahli.org` and `support@ishrahli.org`. Supabase sends sign-in codes through smtp.hostinger.com:465 |
| Google sign-in | Google Cloud project «Ishrah Li», client `989457790089-fus9tth5n26bcpkhansb0539glvfummi` (public id in `js/config.js`) |

### The three books

| Book | Code | Address |
|---|---|---|
| Obstetrics | This repository, branch `main`: `src/` (shell.html, v2*.js, v2.css), `build.py` → `build/site` | Cloudflare Pages `obstetrics-master-review` → https://obs.studentmasterreview.com |
| Surgery | Repository `surgery-rapid-review`, branch `claude/surgery-rapid-review-app-eoho37`, `docs/` | Cloudflare Worker → https://srg.studentmasterreview.com |
| Pediatrics | Repository `pediatrics-master-review`, branch `main` (also `claude/confident-turing-evm4gu`), `docs/` | Cloudflare Worker → https://ped.studentmasterreview.com |

- **One shared app design.** The app code is the Obstetrics `src/v2*.js`, copied to the other two books with their `tools/port_v2.py`.
  Each repository's `CLAUDE.md` describes its own book.
- **Old platform.** «Student Master Review» lives in `platform/` of this repository. It is the Cloudflare Pages project
  `student-master-review` at **https://studentmasterreview.com**, and opens the three books in frames. Its admin is at
  https://studentmasterreview.com/admin; the source is `site_static/admin.html`, copied there by `platform.yml`.
- **Books database.** A separate Supabase project, `kgdmjeffeq…` (secret `SUPABASE_DB_URL`, migrations `tools/supabase/migrations/`
  through `supabase.yml`). It holds the books' subscriptions:
  - `obs_codes`, `obs_devices`, `obs_requests`, `obs_receipts`, `obs_msgs`, `obs_admins`.
  - The per-book content keys, in `obs_book_keys` / `obs_secret`.
  - The students' synced notes, through `obs_sync_get` / `obs_sync_put`, one record per subscription.
- **Locked content.** Each book's locked content is `content.bin`, encrypted with that book's key. The key reaches a subscribed device
  through `obs_activate` / `obs_check`. **Keys are never in the repository.**
- **Book ↔ platform messages.** The book and the old platform talk through `postMessage`. Message names:
  `library`, `stats`, `profile`, `show` / `hide`, `devs`, `ident`, `move`, `up`, `open`. The book script that handles them is at the end
  of each book's `src/shell.html`.
- **Hard-coded old platform.** The books contain the old platform's address on purpose: their `#smr-move` / `#home~move-…` hand-over,
  and their trusted parent origin. **These must be changed before SMRA takes over studentmasterreview.com** (see Stage 1).

### Places in SMRA that still say ishrahli.org

These must change in Stage 1:
- `ishrah/supabase/035_alerts.sql` sets `settings.push_url` to https://ishrahli.org/api/push. Change it with a new migration:
  `update settings set value = 'https://studentmasterreview.com/api/push' where id = 'push_url'`.
- `ishrah/functions/api/push.js`: the VAPID `sub` is `mailto:support@ishrahli.org`. It can stay while that mailbox exists.
- `ishrah/js/core.js` lines ~891 and ~1003: the Google help text names ishrahli.org. Use `location.host` instead.
- `ishrah/js/config.js` comment, `ishrah/index.html` comment (`?safe=`), and `functions/api/_guide.js`: text only.
- `.github/workflows/ishrah.yml` comments.

## The answer given to the owner about Hostinger

Moving to studentmasterreview.com loses nothing from Hostinger. Hostinger only gives:
1. **The registration of ishrahli.org.** Keep it renewed and redirect it to the new address, so old links keep working.
2. **The mailboxes.** They keep working as they are and keep sending sign-in codes. An address on the new domain can be made later in
   Hostinger, Zoho or another mail host; Cloudflare does not host mailboxes, it only forwards mail.

Told to the owner: phones treat the new address as a new app. So **once**, each student signs in again, installs the app again,
allows notifications again and downloads offline files again. Accounts, subscriptions, notes, posts and courses are on the server and
are not lost.

## The plan, in stages

Show each stage to the owner before publishing it. Test in a local preview copy first. Read «How to test» at the end.

### Stage 1: SMRA moves to studentmasterreview.com

**Status: APPROVED by the owner on 22 Nov 2026 («ايوا موافق»).** SMRA takes https://studentmasterreview.com. The old platform and its
admin move to **https://books.studentmasterreview.com** until Stage 3; the book subdomains (obs., srg., ped.) stay.

**Exact order (do not change it; a wrong order sends book students to an address that does not exist):**
- **A. Owner (Cloudflare).** Workers & Pages → `student-master-review` → Custom domains → Set up a custom domain →
  `books.studentmasterreview.com`. Wait until it is Active and opens the old platform. Do not remove anything yet.
  **Owner (Supabase of the BOOKS, project kgdmjeffeq…).** Authentication → URL Configuration → Redirect URLs → add
  `https://books.studentmasterreview.com/admin/` and `https://books.studentmasterreview.com/**`, so the admin's Google sign-in works there.
- **B. Claude.** In the three repositories, on their LIVE branches (fetch first): run `python3 obstetrics-master-review/tools/ishrah/stage1_books.py`
  (dry run), then with `--apply`. Commit and push:
  - obstetrics-master-review `main`: book, platform and admin;
  - surgery-rapid-review `claude/surgery-rapid-review-app-eoho37`: `src/shell.html` and `docs/`;
  - pediatrics-master-review `main`: `src/shell.html` and `docs/`; Pediatrics is also kept on `claude/confident-turing-evm4gu`.

  Check the deploy runs. Then open each book on its own address: it must move to books.studentmasterreview.com, and inside the old
  platform there the «المكتبة» button must show. Tell the owner the admin's new address, https://books.studentmasterreview.com/admin.
- **C. Owner (Cloudflare).**
  1. In `student-master-review` → Custom domains, remove `studentmasterreview.com` and `www.studentmasterreview.com`.
  2. In `ishrah` → Custom domains, add them.
  3. On the ishrahli.org zone, add a Redirect Rule (step 3 below).
- **D. Owner (Supabase of SMRA, fglawgpusfbgkokpnoej, and Google Cloud).** Do steps 4 and 5 below.
- **E. Claude.** Do the code step 6 below (`push_url` migration, texts, manifest, SW bump), publish, and test sign-in with email and
  Google, alerts, and offline on the new address.

**Progress (22 Nov 2026):**
- **A** done by the owner.
- **B** done:
  - obstetrics `main` 8f082bf: book and platform deploys succeeded;
  - surgery `claude/surgery-rapid-review-app-eoho37`, and pediatrics `main` + `claude/confident-turing-evm4gu`. Cloudflare Workers Builds
    deploy these two; this session cannot see those deploys.
  - The built `docs/index.html` was edited in place, and `docs/sw.js` got the new cache name (sha1 of index.html), as build.py would.
  - **C** done by the owner: studentmasterreview.com and www are Active on the Pages project `ishrah`, and the ishrahli.org redirect rule
    is set up (302 for now; change it to 301 once everything works).
  - **E** published:
    - migration `057_new_address.sql` (push_url);
    - the Google help text uses `location.host`;
    - sw.js also deletes the old platform's `smr-v*` caches;
    - the `index.html` head sends old-platform links (`#read-…`, `#home~move-…`) to books.studentmasterreview.com;
    - `js/moved.js` tells a phone that used the old platform (localStorage `smr-*`) where the books are now («افتح كتبي», «لاحقًا» 3 days,
      «لا تظهر مرة أخرى»).
  - **D** done by the owner (22 Nov 2026): Google JavaScript origins and the SMRA Supabase Site URL and Redirect URLs.
  - The owner switched the ishrahli.org redirect rule to **301** (permanent).
  - Owner's test: 1, 2 and 4 passed. 3 failed: ishrahli.org still opened the app. A phone that installed the app on ishrahli.org opens its
    saved copy, and the browser refuses an update script (`/sw.js`) behind a redirect, so the phone stayed on the old address for ever.
    Fix (ish-v246): on ishrahli.org, sw.js deletes all caches, unregisters itself and sends open windows to the same page on
    studentmasterreview.com. The index.html head also forwards any page loaded on ishrahli.org.
    **The Cloudflare rule must skip /sw.js:** use the custom expression `(http.request.uri.path ne "/sw.js")` instead of «All incoming
    requests». Tested locally with a server that plays ishrahli.org: it stays stuck with the old rule and moves with the new one.
  - The owner set the rule to `(http.request.uri.path ne "/sw.js")`; his installed app on ishrahli.org moved to studentmasterreview.com.
  - **STAGE 1 IS DONE (22 Nov 2026).** Next: Stage 2 (the three books inside SMRA at /books/<id>/).
  - (old note) the owner tests on his phone (old step-D note follows for reference)
  - (was) **Waiting for the owner: step D** (Supabase URL configuration of SMRA, Google JavaScript origins). After D, test email and Google
    sign-in, alerts and offline on https://studentmasterreview.com, then switch the redirect to 301.

(Detailed notes for each part follow.)

1. **Prepare the books first.** The old platform must keep working for book students until Stage 3. Give the old platform its own new
   address, for example `https://books.studentmasterreview.com`: add a custom domain to the Pages project `student-master-review`.
   Then, in the three books (end script and head script of `src/shell.html`, same in the three), change every
   `https://studentmasterreview.com` to the old platform's new address, rebuild and deploy each book. Also change `platform/js/app.js`
   if it names itself. The admin at `/admin` moves with it (`books.studentmasterreview.com/admin`). Tell the owner the new admin address.
2. **Owner's steps in Cloudflare.** Remove `studentmasterreview.com` and `www` from the Pages project `student-master-review`, then add
   them as custom domains of the Pages project `ishrah`. HTTP/3 is already off for this domain.
3. **Redirect ishrahli.org.** Add a Cloudflare Redirect Rule on the ishrahli.org zone: `ishrahli.org/*` and `www.ishrahli.org/*` go to
   `https://studentmasterreview.com/${1}`, status 301, keep the query string. The browser keeps the `#…` part by itself.
4. **Supabase (owner).** Under Authentication → URL Configuration, set Site URL to `https://studentmasterreview.com`, and add
   `https://studentmasterreview.com/**` and `https://www.studentmasterreview.com/**` to Redirect URLs. Keep the old ones until the move is
   finished.
5. **Google Cloud (owner).** In the OAuth client, add `https://studentmasterreview.com` and `https://www.studentmasterreview.com` as
   Authorized JavaScript origins.
6. **Code.** Make a new migration for `push_url`, change the texts listed above, and set the manifest `id` / `start_url` (check
   `ishrah/manifest.webmanifest`). Bump `SHELL` in `sw.js` and run `stamp.py`.
7. **Brand.** The app name stays «Sudan Master Review Academy» (SMRA), with its existing logo files `img/mr/logo-smra.webp` and
   `smra-mark.webp`.

### Stage 2: the three books open inside SMRA, at the same address

**Stage 2, first version (22 Nov 2026, ish-v247).**
- `functions/books/[[path]].js` serves `/books/<id>/…` from the book's own deployment, so the books keep deploying as before:
  - surgery → srg., pediatrics → ped., obstetrics → obs.studentmasterreview.com;
  - every method is passed through (the Obstetrics trial POST too);
  - pictures and scripts are edge-cached for 1 h; the page is not cached.

  This was chosen instead of copying the builds into the deploy, which can still be done later to avoid Function request counts.
- `js/books.js`:
  - the shelf `IS.booksShelf()` at the top of My Library (inside `.mh-lib`) and the page `#books` (menu item «الكتب» in core.js NAV);
  - `#book/<id>` opens the book full screen in a frame kept loaded (`#bk-host`). A small «SMRA» handle on the left edge returns to the
    page the person came from; the book's own «المكتبة» button (`{smr:'library'}`) returns too.
- `sw.js` leaves `/books/` to the books' own service workers.
- **A subscribed student's identity follows by itself.** The books keep the device identity in a cookie on `Domain=studentmasterreview.com`,
  and the book head script restores it when its storage is empty.
- Covers are in `img/books/<id>.webp`, copied from the old platform.
- Tested in the preview with the local Surgery and Pediatrics builds at 390 and 1440 px.
- **Second step, ish-v248** (owner, 22 Nov 2026: «the books should open without welcome, the welcome is for the app itself, the app logo
  with the same sound as the book welcome; do the books work offline?»):
  - `books.js quiet()`: the book frame is on the same address, so as soon as its page exists a style hides `#v2wel`, `#v2chz` and `.v2bt`,
    and `<px>-btour` is set.
  - `js/welcome.js`: the academy's own welcome, once per app opening (sessionStorage `ish-wel`; never inside a frame). It shows the SMRA
    logo with gold rings, «مرحبًا بك يا <name>» and «ابدأ», and plays the books' exact opening sound (C–E–G sine bell, same notes and
    timing as v2.js).
  - **Offline check.** The books work offline inside the academy, from their own saved copies. That check found an older bug: the academy's
    two stylesheets are written by a head script, so `saveShell` never saved them, and an app opened offline before a second online visit
    had no styles. `saveShell` now saves `css/app.css` and `css/mr.css` with the page's hash, and `mr-pal-*` falls back to `mr.css`
    offline, like `pal-*` does to `app.css`.
  - Tested: preview with the local Surgery build served at `/books/surgery/`. The welcome shows and closes, the book opens without its
    welcome, the book's service worker is active, and app + book open offline with full styles.
- **Third step, ish-v249** (owner, 22 Nov 2026: «no delay in anything; a book opens without internet the second time even if it was never
  opened»):
  - `IS.prepareBooks()` in books.js runs 12 s after the app opens (and when the internet returns), only while the person is not touching the
    app, and not on data-saver connections.
  - Every book with no saved copy yet (no active service worker scoped to `/books/<id>/`) is loaded once in a hidden frame `#bk-pre`, one at
    a time; the book's own worker saves it. The frame stays 45 s more for the pictures.
  - The last opened book (`ish-lastbook`) is then kept loaded and hidden, so it opens at once.
  - Test (scratchpad bookst3.js): fresh phone, app opened, no book touched; after about 2.5 minutes all three saved. Internet cut → each
    book opened inside the academy.
  - The welcome name showed code text («bdi lang=…»): `IS.greetingName` already returns escaped markup, so it is no longer escaped again.
- **Still to do in stage 2:**
  - check the books on the live address;
  - hide the book's own greeting, tour and subscription screens inside SMRA (stage 3 with the single sign-in);
  - preload the last opened book;
  - shortcuts.

Goal: `https://studentmasterreview.com/books/surgery/` (and `/books/obstetrics/`, `/books/pediatrics/`).

**Why the same address and not subdomains.** A path on the same domain is the same app for the phone. One sign-in, one storage and
offline copies work together. iPhone does not separate the book's storage from the platform's. Subdomains are different apps for the
phone.

1. **Build.** Extend `ishrah.yml` to fetch each book's built site (Obstetrics `build/site` from branch `main` of this repository; Surgery
   and Pediatrics `docs/` from their repositories, with `actions/checkout` and a token if private) and copy it into the deploy as
   `books/<id>/`.
2. **Opening.** The SMRA route `#book/<id>` shows the book full screen with a back button to SMRA. The library gets a «Books» shelf with
   the three covers. Keep the last opened book ready in the background so it opens at once.
3. **Keep in the books:** the reader and all its tools, flashcards, question bank, Rapid Review, progress, search and sync.
4. **Remove from the books** (SMRA already has them):
   - the book's greeting and tour;
   - its sign-in and subscription screens;
   - «مراسلة الإدارة» (use SMRA support);
   - the old platform's «المكتبة» button (it becomes «back to SMRA»).
5. **Service workers.** Each book keeps its own worker scoped to `/books/<id>/`. SMRA's root worker must not cache `/books/`.
6. **Storage.** Prefixes do not clash: books use `orr-` / `srr-` / `prr-`, SMRA uses `ish-`.
7. **Until Stage 3,** a book inside SMRA can still use the books' Supabase subscription as it does today.

### Stage 3: one account and one subscription system in SMRA's database

1. **Database (new SMRA migrations).**
   - `book_subs` (user_id, book, plan, expires, status, source).
   - `book_keys` (book, key). Readable only through an RPC `ish_book_key(book)` that returns the key when the account has a live
     subscription. Copy the keys from the books' Supabase by hand or in a workflow step. **Never print them in a log.**
   - `book_sync` (user_id, book, data jsonb, v, updated_at) with RPCs in the shape of `obs_sync_get` / `obs_sync_put`.
2. **Buying.** A book is bought in SMRA like a course: Bankak receipt, then Control → Payments approves. The book then opens on every
   device of that account.
3. **Book side.** Replace each book's licence layer (`window.__lic`: Obstetrics `site_static/licence.js`, the others `src/v2.book.js`)
   with an adapter that uses the SMRA session on the same address (supabase-js session in localStorage) and the RPCs above.
   - `poll` / `recheck` ask `book_subs`.
   - Sync goes to `book_sync`.
   - Device identity, link numbers and codes are no longer needed.
4. **Moving the current subscribers.**
   - A workflow step with both database secrets (`SUPABASE_DB_URL`, `ISHRAH_DB_URL`) copies `obs_codes` (book, plan, expires, the name
     and phone in `note`), the sync data and `obs_msgs` into SMRA staging tables, keyed by the last 9 digits of the phone.
   - When an SMRA account with that phone signs in, or types the phone on a «I subscribed before» screen and the owner approves, the
     subscription and the notes become theirs.
   - Print counts only, never rows; the repository is public.
5. **Admin.** The books admin features move into SMRA Control: requests, students, merge, devices, notes and messages. SMRA tickets
   replace `obs_msgs`.
6. **Retire the old platform.** Once all of this works, the old platform and the book subdomains redirect to
   `https://studentmasterreview.com/books/<id>/`.

### Stage 4: sub-apps and shortcuts

1. **Shortcuts.** Add `shortcuts` in `manifest.webmanifest`: Library `#library`, Courses `#courses`, Clinical (section shortcut), and the
   three books. A long press on the app icon shows them on Android.
2. **Sub-apps on the same address.** Each one is a copy of `index.html` under `/a/<name>/` (for example `/a/library/`) with its own
   manifest: its own `id`, `scope` `/a/<name>/`, `start_url` `/a/<name>/#library`, name «SMRA Library» and icon. Add
   `<base href="/">` so files load from the root. Same address, so same account, data and offline copies.
   - Books: `/books/<id>/` has its own manifest (name «SMRA Surgery»), so it installs as its own app.
   - Check on Android Chrome and iPhone Safari («Add to Home Screen» uses the manifest of the page it is on).
3. **Library files.** Every library book or file already opens inside SMRA in its own reader (`js/reader.js`: highlights, bookmarks,
   search, offline copies). Later, bring the book features (notes, flashcards) to other books step by step, as the owner asked.

## Other open items for the owner

- **Lecturer contract clause.** Deals outside the platform → warning, then suspension, and the commission is still owed. Also a reward
  for a student who reports. This is his decision; the app part (hidden numbers, filter, alerts) is done.
- **Commission level.** A lower commission for lecturers with more students. His decision.
- **Bunny Stream** for paid videos (to-do item 1 in `CLAUDE.md`). YouTube stays for free lessons.
- **Move library files to Cloudflare R2 before the public launch** (download traffic costs; see `CLAUDE.md`).
- **Watermark on videos.** He saw a sample and **rejected it** («مزعجه»). Do not bring it back.

## How to test and release (SMRA)

1. **Preview copy.** Copy `ishrah/` to a scratch folder, put an empty `js/config.js` there (`supabaseUrl: ''`), serve it with
   `python3 -m http.server <port>`, and drive it with Playwright. Sign up by email; in preview the code is shown on the screen. Choose
   Medicine → Clinical.
2. **Live-mode test without the real database.** Serve the app with a config that has a fake URL, answer the supabase-js CDN request
   with a small stand-in client that keeps tables in memory, and switch the network off with Playwright `context.setOffline(true)`. This
   was used on 22 Nov 2026 to check offline pages. A version of the stand-in is described in `CLAUDE.md` («Every page opens without
   internet»).
3. **Release steps:**
   - `python3 tools/ishrah/palettes.py` after any CSS change;
   - bump `SHELL` in `ishrah/sw.js`;
   - `python3 tools/ishrah/stamp.py`;
   - commit with the attribution lines;
   - `git fetch origin ccr-38b3f943-ba1ode && git merge FETCH_HEAD`;
   - push to `ccr-38b3f943-ba1ode` and `ccr-67fd949c-z3vfp5`;
   - check the «Ishrah» workflow run.
4. **Database changes.** Test them on a local Postgres 16 first (the migrations apply in order on a copy). Add every new file to
   `ishrah.yml`.

## Done on 22 Nov 2026 (latest work before this plan)

- **Contact guard** (`056_contact_guard.sql`, `js/guard.js`): lecturers' WhatsApp, Telegram and email are team-only; students message a
  lecturer inside the platform. Phone numbers and WhatsApp/Telegram links in posts and messages are hidden, logged and reported to the
  team.
- **Opening before every video** (`js/intro.js`): logo, name, course and lesson, a soft bell sound. Paid courses add a 🔒 line about
  sharing.
- **Offline.** Every page opens without internet: background warm-up, every read saved, missing pieces no longer block the page.
- **Faster post opening.**
