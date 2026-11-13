# Obstetrics Master Review (4th edition, 2026)

Student book + PWA for Shendi University students by Dr. Abdaljalil Abdalkareem Arja and Dr. Alabass Abdulrahman.
Sold on Cloudflare Pages; activation codes in Supabase (project `kgdmjeffeq…`, shared with Dr. Arja Master Note).
Sister apps: Surgery Master Review (`surgery-rapid-review`) and Pediatrics: features made there are ported here.

## Owner rules
- Never cut content. Formal academic textbook English for first-time students; no "senior", no "Sudan note"; no gimmicks.
- Doubtful numbers: Edition 3 → Sudan guidelines → owner's resources → WHO/RCOG.
- Minimal colour: one colour per chapter on headings and thin lines; text black. Special boxes: only the title tag is
  coloured (Clinical scenario red, Clinical picture green, Distinguishing features purple, Hospital protocol blue, caution orange).
- Pictures small, beside their text, numbered "Figure x.y.z" with a sentence caption; no big empty spaces.
- After every change: `python3 build.py` (key needed locally only for checking), check on a 390 px phone screen, commit and
  push to `main`: GitHub Actions (.github/workflows/deploy.yml) builds with the OBS_KEY secret and deploys to the existing
  Cloudflare Pages project `obstetrics-master-review` (https://obstetrics-master-review.pages.dev, same address). First automatic deploy: 5 Nov 2026. No zip files any more. Then republish the review copy.

## Layout of this repo (recovered 5 Nov 2026 after the old work folder was lost)
- `content/pages/NNN_<file>.html`: every book page as finished HTML (`<section class="page mz cN" id="pNNN" data-file=…>`).
  File order = page order. Page numbers are written inside each page (`id`, header `<b>NNN</b>`); if pages are added or
  removed, renumber (tools to be written when needed).
- `content/meta.json` (pages, topics, chapters), `decks.json` (flashcards), `qbank.json`, `audio.json` (lecture segments).
- `content/access.json`: free-trial topic ids (first topic of each chapter).
- `src/shell.html`: the whole app (CSS + JS + sale UI) with placeholders {{PAGES}} {{META}} {{DECKS}} {{QBANK}} {{AUDIO}} {{OBS_INFO}}.
  App features are edited here.
- `site_static/`: licence.js (Supabase activation + sync, `window.__obsSync`), sbmini.js, licence-config.js (price, WhatsApp),
  admin.html (code control page), sw.js (offline cache; version and image list rewritten by build), manifest, icon.
- `assets/`: img/, audio/, fonts/.
- Emblem (owner, Nov 2026): the round OBSTETRICS MASTER REVIEW seal cut out as `assets/img/logo.webp`; icons `site_static/icon.png` 512, `icon-192.png`, `apple-touch-icon.png`. Used in the top bar (`.blogo`, hidden in the reader), front-matter banners (`.toc-h::after`, `.au-ban::after`), Rapid Review banner (`.rrlogo`), beside STUDENT MASTER | NOTE SERIES on Home and the Reviewers page (`.smseal`) and the subscription sheet (`.sublogo`), as in Surgery.
- **Every new app feature must be added to the how-to pages** (005_a00c_howto1 / 006_a00d_howto2, owner Nov 2026), in the same Arabic style, keeping both pages fitted.
- **Reader tools from Surgery (6 Nov 2026):** pressure/speed pen drawn as smooth outlines (hold still = straight line, 7 colours, 6 sizes), stylus mode with palm rejection (`orr-styl`), pinch-zoom while drawing, marker in the highlighter colours with 4 sizes (also «ماركر حر» in the highlighter panel), highlighter 6 colours + full/lower-half style + scroll guard, pictures on pages (pen tool صورة; IndexedDB `orr-img`, local to the device: Supabase has no picture store, `imgUpload` is off), text boxes dragged with a finger, blank pages in 3 kinds and 3 colours added in place (`upgRebuild`, no reload). Code copied from surgery-rapid-review/src/app.js with st→sp, stj→spj.
- Reader: tap the page-number pill to type a page and jump there (`.pnum.ed`); full-page reading hides the bars on scroll down, a tap brings them back.
- **Page fit (owner, Nov 2026, as in Surgery):** no congested pages, no big gaps. `tools/paginate.py` re-plans each topic: sections are cut into
  atoms (whole boxes; inside a titled section: paragraphs, lists, boxes, rows of long tables with the header repeated; never after a float or
  sub-heading, pieces ≥ 70 px), laid on the fewest pages that keep `KEEP` (45) px free at the foot, then shared as evenly as possible; it adds
  or removes topic pages (`grow_topics.py`, `delete_page.py`) and rewrites the contents page (`fix_contents.py`). Run after content changes:
  `python3 build.py && python3 tools/measure_blocks.py && KEEP=45 python3 tools/paginate.py --apply && python3 build.py`.
  At run time `fillPage` (shell.html) spends the spare room inside the boxes (`--ft` 0–3.2: padding, line spacing, table rows; text +≤8 %), then shares what is left between the boxes (`--fgap`, ≤ 44 px each), leaving ≥ 50 px; it re-runs on scroll for pages near the view and after the fonts load (owner, 6 Nov 2026: no packed boxes with an empty bottom).
  Inter is shipped in `assets/fonts` so every phone lays the pages out as planned. `tools/measure_free.py` → build/free.json (free px per page).
- **Chapter covers (owner, Nov 2026, as in Surgery):** `tools/chapter_covers.py` adds a cover page (`k<n>_cover`, free in the trial, no definition marks)
  before each chapter and rewrites them with the current page numbers (re-run after pages move): navy band with the emblem and book title,
  Chapter N, title in the chapter colour, the owner's picture `assets/img/chcover_<n>.jpg` (cropped from his mock-ups to the picture only;
  chapters 1–5 done, 6–7 still use their contents banner until he sends pictures), and "In this chapter" with topic pages (two columns when > 5).
  Contents chapter bands start at the cover.
- `build.py` → `build/site/` (deploy: free pages, lock placeholders, `content.bin` = AES-GCM(gzip JSON of locked pages,
  decks, whole qbank)) and `build/review/index.html` (whole book open; publish as the review artifact).

- **Ported from the Pediatrics book (owner, 6 Nov 2026):** subscription texts in clear Arabic (licence.js sheet «الاشتراك في الكتاب» with
  «طريقة الاشتراك» numbered steps, Bankak 4674587 سعاد عبدالكريم from licence-config.js, gold «تفعيل»; locked page «هذه الصفحة للمشتركين» +
  gold «اضغط هنا للاشتراك» in build.py; trial bars on Home, Cards, Questions, Search); flashcards: Today / All, chapter bar (`orr-fcch`,
  short names FCSHORT, colours FCCOL), chosen chapter's topics + «All of chapter N» (`ch:N`); day / eye / night looks for Cards and Questions
  from the top-bar colour button (`orr-smode`, .sday/.seye). Questions screen (owner, 6 Nov 2026) is now the Surgery/Pediatrics test builder: four numbered steps (Tutor/Timed · Unused/Incorrect/Marked/All ·
  chapters with short names and colours, heading selects all · 10/20/40/All + slider), sticky gold Start bar, test with mark/palette/timer, results ring
  by chapter, previous tests. Each EMQ item is its own question (id `<emq id>#<k>`). Records in `orr-qb` {n,c,w,a,m} (synced as `qb`), tests
  `orr-qbtests` (synced as `qbt`), current test `orr-qbcur`, settings `orr-qbset`.
- **Flashcard look (owner, 6 Nov 2026):** question side navy-purple gradient with gold text (like the Home daily card), answer side cream with a gold edge;
  question 24 px, answer 21 px; day/eye looks: white or cream card with a gold top band (CSS at the end of the main style block).

## Trial (owner, 6 Nov 2026, as in Surgery and Pediatrics)
On opening, a device that is not activated gets a chooser (licence.js `openChoose`): «النسخة التجريبية لمدة ساعة كاملة» · «الاشتراك في النسخة المدفوعة» ·
«عندي كود تفعيل» · «متابعة بالنسخة المجانية». The trial opens the whole book for `trial_hours` (licence-config.js, 1). The key comes from the site's own Cloudflare Pages Function
`functions/trial.js` (POST /trial; reads the Pages secret OBS_KEY, which the deploy workflow sets from the GitHub secret each deploy), so no
Supabase step is needed; Supabase RPC `obs_trial` (tools/supabase/obs_trial.sql, optional) is only a fallback. The trial key is kept in `orr-tk` (never `orr-k`), dropped when the time ends; free first topics stay open. Price 15,000 SDG.

## Change of device by the student (owner, 6 Nov 2026, as in Surgery and Pediatrics)
An activated device shows a Home card «أنت مشترك · … · إدارة الجهاز» (licence.js `myDevice`) → subscription sheet → «إزالة الكود من هذا
الجهاز» (tap twice; syncs first via `window.__obsSyncNow`) → Supabase RPC `obs_release(p_dev)` clears the device from its code, then the
device locks. The RPC is in tools/supabase/migrations/001_obs_release.sql (the owner ran it by hand on 7 Nov 2026).

## Supabase changes from the repository (owner, 7 Nov 2026: no manual SQL steps)
`.github/workflows/supabase.yml` applies every new file in `tools/supabase/migrations/` (name order, once each, recorded in table
`obs_migrations`) on push, using the GitHub secret `SUPABASE_DB_URL` (Session-pooler connection string). `gh workflow run Supabase -f mode=inspect`
prints the obs_* columns and function definitions to the run log (read with `gh api .../actions/runs/<id>/logs`). The repository is PUBLIC:
never print rows, keys or student data in a workflow. New database changes = a new numbered migration file (write it idempotently:
`create or replace`, `if not exists`).

## Devices per code (owner, 7 Nov 2026, as in Surgery and Pediatrics)
Migration 002: `obs_codes.maxdev` (1–10, default 2 = old behaviour: one phone slot + one computer slot); devices beyond the two slots
are rows in `obs_devices`; `obs_code_of(dev)` finds a device's code (slot or extra) for check / sync / release. Admin page: «Devices» selector
per code (`obs_admin_maxdev`), extra devices listed via `obs_admin_extra`; Reset/Free also clear `obs_devices`. «Student notes» button (migration 003, `obs_admin_notes`): the notes a student wrote on highlights, newest first.

## The licence key (secret)
content.bin must be encrypted with the SAME key Supabase gives activated devices (table `obs_secret`, column `k`,
returned by RPC `obs_activate`). It is NOT in this repo. build.py reads `$OBS_KEY` or `$OBS_KEY_FILE`
(default `../secret/licence_key.txt`). If it is lost, the owner can read it in Supabase SQL editor: `select k from obs_secret;`.
Never commit it, never put it in an artifact.

## localStorage keys
Prefix `orr-` (highlights orr-hl2, ink orr-ink, progress orr-prog, zoom orr-zoom2, cards orr-known2 / orr-daily / orr-streak,
activation orr-k / orr-kc). Sync via Supabase RPCs obs_sync_get / obs_sync_put (obs-sync-setup.sql).
- **Rapid Review (owner, Nov 2026):** two columns of topic cards in the chapter colour (number badge + title once per topic,
  no repeated titles; a topic that runs on into the next column continues with no title), a picture band at the start of each
  chapter (`.rrc`, chapter cover picture). Re-flow after RR content changes: `mkdir -p build/rr && python3 tools/rapid_review/extract.py`,
  write build/rr/chapters.json ({n: {name, img}} from meta chapters, chcover if present), `python3 build.py && node tools/rapid_review/layout.js && python3 tools/rapid_review/write.py`.
- **Rapid Review = exam recap cards (owner, 7 Nov 2026, as in Pediatrics and Surgery):** one whole card per topic from
  `content/rr/<topic id>.json` ({"sc": [3 exam scenarios "picture → **answer**"], "f": [[label, html], ...], "trap": html}); OSCE topics use station
  labels. Flow: `python3 build.py && python3 tools/rapid_review/cards.py && node tools/rapid_review/cards.js` (whole cards, chapter band kept with
  its first card, spare height spread between the cards `--vj` and inside them `--rqx`, KEEP 25 px) → match the number of `x9` pages
  (`grow_topics.py x9` / `delete_page.py`) → `python3 tools/rapid_review/write.py`, relabel meta "Rapid review · i/N", build. The older
  two-column flow below (extract.py, layout.js, rr_keynums.json) is no longer used.
- **Obstetric drugs section (owner, 7 Nov 2026: "organise it better"):** the source is `content/drugs.json` (intro, 6 groups of drugs with
  [name, main use, how it works, dose, side effects, cautions], and the reference parts `trimester`, `safe`, `bf` (breastfeeding), `ci` (avoid in pregnancy,
  by category), written as cards with Give/Avoid or Safe/Avoid lists and every abbreviation in full (owner, 7 Nov 2026: the old tables were congested)). Each drug is one whole card (`.dk`) under a coloured group band (`.dgb`); no table is split and no "(cont.)" titles.
  Every group starts on its own page and ends on its own pages (owner: no one or two cards spilling over); `tools/drugs_layout.js` packs a group
  tighter (`.dcmp`) when that saves a page and shares its cards evenly over its pages.
  Edit the JSON, then `python3 tools/drugs.py && python3 build.py && node tools/drugs_layout.js && python3 tools/drugs_write.py && python3 build.py`
  (drugs_write adds/removes `y` pages to match and relabels them). The section opens with the owner's cover `assets/img/drcover.jpg`
  (page `y00_drcover`, open in the trial like `x900_rrcover`); build.py locks every `y<digit>` page (y10+ too).
- **Key numbers live in the Rapid Review (owner, 6 Nov 2026):** topic pages have NO Key numbers box any more; every number
  is written in the text where it belongs (checked and added Nov 2026), and each topic's card in the Rapid Review ends with a
  "Key numbers" part (`.rvsub` + `.frow.kn`, value on the right). Source of those rows: `content/rr_keynums.json` (topic no →
  [value html, label html]); edit it there, then re-run the Rapid Review flow below (extract reads the cards' clue rows from the
  RR pages and the numbers from this file; `layout.js` writes `build/rr/pages.json`; add/remove `x9` pages with
  `grow_topics.py x9` / `delete_page.py` to match, then `write.py`; relabel meta "Rapid review · i/N").
- **No repeated points in the Rapid Review (owner, 6 Nov 2026):** a Key number that repeats a clue row of its topic (same number, same thing), another
  Key number, or a row of an earlier topic in the same chapter was removed from `content/rr_keynums.json` (1183 → 876 rows; RR 31 → 26 pages).
  When adding Key numbers, do not restate what the clue rows already give.
- **No repeated titles (owner, 6 Nov 2026):** a section that runs on to the next page continues WITHOUT its title (no slim title,
  no "continued"); tools/cont_titles.py now removes any. To avoid small stubs, a section is divided only when it is big
  (`SPLITMIN` 320 px) and into fair parts (each ≥ `SPLITFR` 30 %); where that would leave big gaps a looser setting is used
  per topic (220/.22 or 0/0). Before re-planning, `python3 tools/merge_pieces.py <topic keys>` gathers split pieces back together.
  Untitled ("bare") boxes with long tables (also `table.osce`) may now be divided by rows.
- paginate.py never leaves a sub-topic title (`h2.mzsub`) at the foot of a page with less than `SUBMIN` (140) px under it;
  `tools/merge_pieces.py` joins two pieces of one section that land on the same page.

## Handover between the owner's two Claude accounts (Nov 6 2026)
Work continues on `main` from either account: `git pull` first, read this file and `git log --oneline -15`, push to `main`
(GitHub Actions builds with the OBS_KEY secret and deploys). The licence key is only in GitHub secrets / Supabase, never in a session file.
Last work: features ported from the Pediatrics book (see "Ported from the Pediatrics book"). Next: chapter covers 6–7 when the owner sends pictures.

## Less AI look (owner, 7 Nov 2026: students distrust a book that looks AI-made)
- New cover `assets/img/cover4.jpg` (shown as cover5.jpg: trimmed and resized to the page shape 816×1152, fills page 1 with no blurred edges) (owner's navy/gold design). The app now follows the cover: every purple of the app shell was shifted to the
  cover's navy hue (same lightness), gold kept; chapter colours unchanged (chapter 2 keeps its purple), "Distinguishing features" box stays purple.
- New flat seal `assets/img/logo3.webp` (navy disc, gold rings, OBSTETRICS / OB / 4TH EDITION / MASTER REVIEW in Inter, drawn as SVG, no AI art);
  icons in site_static rebuilt from it. logo2.webp is no longer used.
- Chapter covers (tools/chapter_covers.py): the owner's new still-life picture `assets/img/chcov<n>.jpg` when it exists (header band with garbled AI text cut off), otherwise a typographic panel with the big outlined chapter number (`.cvart`). All 7 chapter covers done (picture box follows the picture shape, max 420 px high); chapter 7 uses the Home OSCE banner picture (ban7, owner), its teal left fade cut off, shown from the top.
- Rapid Review and Drugs covers (pages x900_rrcover, y00_drcover; tools/poster_pages.py) are pages in the chapter-cover style (class `chcov cx`, chapter or drug-group list) with the picture from the owner's posters (assets/img/rrpic.jpg, drpic.jpg: AI bands, icons and old seal cut away, purple recoloured to navy);
  termify skips x900/y00. Home chapter banners and Contents bands keep their photos (owner); RR chapter bands show no picture. Owner will send new chapter cover pictures (chcov<n>.jpg) for chapters 2–7. Next: review AI-looking pictures inside the book with the owner.
- Contents side panel (owner, 7 Nov 2026): "Book cover" row at the top (p 1) and a "Chapter cover" row first in every chapter (`kCov(n)` finds the
  k<n>_cover page); chapter page ranges start at the cover.
- Plain words in the whole book (owner, 7 Nov 2026): no hard everyday English (also copes, jittery, oozing, boggy, doughy, plateaus, commoner, undelivered…) (corridor, vagueness, giggling, voided, snugly, spoilt, curdy,
  boggy, gaping, torrential, look-alikes, prerequisites…) and no religious phrases ("it is God's will"); medical terms stay.
- About this edition (owner, 7 Nov 2026, as in Surgery): page 3 `a00b1_about` after About the authors (inserted with tools/insert_page.py; every
  later page moved up one). English title, Arabic text (Noto Sans Arabic): this edition, disclaimer, copyright (full width), thanks.
  tools/poster_pages.py finds the RR/drugs cover files by name.

## App redesign (owner, 10 Nov 2026) — branch `redesign`, NOT yet on `main`
The owner is turning the book into an app (brief: lavender theme, five destinations, each feature opens only its own place).
- Work on branch `redesign`; `.github/workflows/preview.yml` deploys every push to https://redesign.obstetrics-master-review.pages.dev
  (preview; the live book on `main` is untouched until the owner approves the whole redesign, then merge).
- Code: `src/v2.css`, `src/v2.html` (parts `<!--TOP--> <!--VIEWS--> <!--NAV-->`), `src/v2.js`, laid over `src/shell.html` by build.py `v2()`
  (v2.js runs at the end of the boot closure and replaces `show`, `goIdx`, `currentPage`). Old Home and old tabs stay in the DOM, hidden.
- Tokens `--bg --sf --tx --sub --pri --pon --sel --bd --deep`; mode `orr-mode` (day|night|auto) → `html[data-theme]`, colour `orr-pal`
  (lav, navy, green, orange, red, mono) → `html[data-pal]`; the old variables (--paper, --card, --rose…) are mapped to them.
- Reader scope: `grp(i)` (topic, rr, dr, chapter cover, cover, front matter); only the pages of one group are shown.
- New keys: orr-name, orr-photo, orr-bm (bookmarks, synced as `bm` since 11 Nov 2026), orr-lastact, orr-nread, orr-nseen, orr-pseg.
- Pictures: assets/img/v2_consult.jpg and v2_fetus.jpg are the owner's full pictures (10 Nov 2026; the tall baby picture fills the PC sidebar); v2_cover.jpg is still cut from his mock-up (low resolution); logo v2_logo.webp
  recoloured from his burgundy logo. Replace when he sends the originals.
- Stage 1 done: shell, header, navigation, Home, Chapters + chapter page, Practice hub, Resources hub, Settings, Profile, Notifications
  (events of this device), Saved, look settings. Still old inside: flashcards, question bank, search, lectures (audio), subscription sheet.
- Real totals differ from the mock-ups: 1,634 flashcards and 749 questions (OBS_INFO.tot), not 219 / 110.
- Phone Home fits one screen (owner, 10 Nov 2026): compact sizes under 760 px, spare height goes to the reading card; a tighter tier under 640 px high.
- Video lectures (owner, 10 Nov 2026): `v2lect` shows a "قريبًا" card for every topic with a picture (OBS_INFO.timg: the topic's first figure,
  else `chcov<n>.jpg`); the owner will upload videos later.
- **Subscription without codes (owner, 10 Nov 2026).** Migration 004 (applied; also on `main`): `obs_codes.expires` + `plan`, tables `obs_requests`,
  `obs_receipts` (receipt as base64, owner only), `obs_seen` (devices that opened the app). App RPCs `obs_request_submit`, `obs_request_status`
  (also records the device); owner RPCs `obs_admin_requests`, `obs_admin_receipt`, `obs_admin_decide` (approve → `obs_grant` makes or RENEWS the
  device's code, so synced notes stay), `obs_admin_grant(user number, name, phone, plan)` = subscription with no receipt, `obs_admin_expires`.
  `obs_check` answers `expired` for an ended plan and returns exp / plan / name. Old codes have expires = null and keep working.
  App: `v2sub` (trial, free, plans from licence-config.js `plans`, state of the request) and `v2pay` (transfer details, receipt, name, phone,
  user number = first 10 characters of the device id, comment); v2.js `poll()` asks the status on opening, when the app comes back, and every
  45 s while a request waits; when the owner approves, `window.__lic.adopt()` stores the key and reloads. Keys: orr-exp, orr-plan, orr-sname
  (name approved by the owner; the student's own orr-name wins), orr-ended, orr-req, orr-tel. No code entry in the new app (owner: codes are gone).
  Admin (`site_static/admin.html`, live on `main` too, installable through admin.webmanifest): Subscription requests (Waiting / Approved /
  Rejected, receipt view, name and plan can be corrected, sound + badge for a new request, checks every 30 s) and "Give a subscription without
  a receipt". Tested on a local Postgres copy of the schema. Open: what happens to the students of the old codes when the new app goes live
  (owner to decide; nothing was deleted); a second device for one subscription; changing device without the owner.
- Phone Home never scrolls on normal phones (owner, 10 Nov 2026): the wrapper takes the screen height and the reading card gives way
  (container queries hide its topic line, then its chapter label, then clamp the title), so no text is cut.
- Welcome screen (owner, 10 Nov 2026): `#v2wel` on every opening: new logo with rings, «مرحب بك يا دكتور» (or the name), «ابدأ رحلتك مع
  Obstetrics Master Review», button «ابدأ» → rising chime + glow, then Home. No forced subscription choice at the start (licence.js `afterLogin`).
- Slides (owner, 10 Nov 2026): `v2slides` shows a small slide preview for every topic (logo, topic title, up to three points from the topic's
  `sub` line, its picture, «قريبًا»), with chapter filters; real slides will replace them when the owner uploads them.
- Cover follows the app colour (owner, 10 Nov 2026): his navy cover recoloured per palette (only the navy-blue pixels): Home card
  `assets/img/v2_cover_<pal>.jpg`, book page 1 `cover5_<pal>.jpg` swapped by CSS `content:url()` on `img.covimg` (navy = the original).
- Devices (owner, 10 Nov 2026; migration 005, applied): a new subscription opens 3 devices (phone, tablet, computer; `maxdev`, changed per
  subscription in the admin Devices selector). A second device joins with no code: app → Subscription → «مشترك على جهاز آخر» (name + the
  subscription's phone) sends a request with plan = 'device'; approving ties the device to the subscription whose note carries that phone
  (`obs_bind`; answers `nosub` or `full`). Notes and progress are shared through the code's sync.
- Old codes (owner, 10 Nov 2026): they work for ONE MONTH after the new app goes live. `tools/supabase/launch/old_codes_one_month.sql` is
  NOT applied yet: on launch day copy it into migrations/ with the next number and push.
- Audio lectures are gone (owner, 10 Nov 2026): build.py ships no audio (`audio = {}`, assets/audio stays in the repo but is not deployed);
  Settings → Downloads (`v2dl`) is for video lectures and lecture slides (empty until they exist).
- Each place is separate (owner, 10 Nov 2026): the reader's page pill counts inside the open place («1 / 8»), typing a page is off, and the
  whole-book contents button is hidden in the reader; the student moves between places from Chapters and Resources.
- Requests can be changed (owner, 10 Nov 2026; migration 006, applied): while a request waits the student can edit it (`obs_request_update`:
  plan, name, phone, comment, optional new receipt; `v2pay` in edit mode) or cancel it (`obs_request_cancel`, status `cancelled`, receipt
  removed). Admin shows «Edited» and a «Cancelled by student» tab. poll() re-renders only when the state changed (it used to loop).
- Admin app rebuilt (owner, 10 Nov 2026: organised, same level as the app): `site_static/admin.html` in the app's lavender look, sidebar on PC
  and bottom bar on phones: Requests (four counters, Waiting / Approved / Rejected / Cancelled), Subscribers (search, All / Active / Ending in
  7 days / Ended / Switched off; per subscriber: WhatsApp, Devices 1–10, Extend +1 month / +1 year / never / end now via `obs_admin_expires`,
  edit name and phone, student notes, remove devices, switch off), Give (subscription with no receipt), Old codes (codes with no plan; new
  old-style codes can still be made until launch). Live on `main` too (it needs assets/img/v2_logo.webp and the Cairo fonts there).
- Devices join by themselves (owner, 10 Nov 2026; migration 007, applied): up to the subscription's limit (3) a device needs no approval.
  A subscribed device → Subscription → «أضف جهازًا آخر» gets a link number (8 digits, 10 minutes, one use: `obs_pair_new`); the new device
  writes it under «مشترك على جهاز آخر» (`obs_pair_use`) and opens at once. Beyond the limit `obs_pair_use` files a `device` request for the
  owner; approving it raises that subscription's `maxdev` by one. Without the old device: name + phone request, owner approves (as before).
- User manual (owner, 10 Nov 2026): Settings → «دليل الاستخدام» (`v2help`, array HELP in v2.js): seven parts in clear Arabic steps, each with a
  screenshot of the app `assets/img/help_<part>.jpg`. Re-make the pictures after screens change: build, serve build/site on :8765,
  `node tools/help_shots.js`, build again. Add every new feature here (this replaces the old how-to pages for the app).
- Baby picture follows the app colour: `v2_fetus_<pal>.jpg` (only the purple pixels recoloured; the consultation photo stays as it is).
- Practice on tablets and PCs (owner, 10 Nov 2026): questions and flashcards side by side over the full width, then «تدرّب حسب الفصل» (a tile per chapter with its questions and cards buttons); phones keep the two-tab switch.
- Chapter previews (owner, 10 Nov 2026): Chapters list, chapter page, lecture and slide cards use the still-life pictures `chcov<n>.jpg` (v2.js `chImg`); the old banner strips `ban<n>.jpg` looked bad as thumbnails.
- Names in Arabic or English (owner, 10 Nov 2026): greetings are right-to-left with the name isolated (`greet()`, `<bdi>`), so «مرحب بك يا Arja» reads in order; the header name is `dir=auto` and shortens before it can cover the search button.
- **Reader, new design (owner, 10 Nov 2026; the book page itself is unchanged).** Slim app bar: back to the chapter, a clear Home button
  (`.rhome`), «Page k of n · Chapter N» over the topic title (`.rt`), the read mark as a chip (`#prBtn`, moved out of the tools), topic
  bookmark (`.rbm`), page look; a thin progress line under the bar (`.rprog`). The tools (`.rbar`: highlight, underline, pen, text, notes,
  blank page, size, undo/redo) are a floating rounded dock at the bottom centre; it hides while reading down and a tap brings it back
  (`.app.imm`); the chevron hides it and a round pen button (`#rbShow`, moved into the reader) shows it. The app's bottom navigation is hidden
  in the reader on phones. v2.js replaces `railSpace` (pages keep the full height) and `flyAt` (panels open above a bottom button, below a top
  one); panels, the pen bar and the selection bar take the app colours. The floating page pill is hidden.
- **Reader, second pass (owner, 10 Nov 2026; replaces the floating dock above).** Tools are a strip of symbols along the TOP under the
  reader bar (as in Surgery; `#reader .rbar`, the chevron hides it and the pen button `#rbShow` in the bar shows it). The BOTTOM is a
  reading bar `#v2rnav` (topic scopes only): السلايدات and الفيديو open the slides / video page at this topic's chapter with its card marked
  (`media()`, `FROMRD`: Back returns to the reader), المواضيع opens a sheet of the chapter's topics (`#v2tsheet`, `tpick`, «كل الفصول»), and the
  page progress button (`#prBtn`, moved here). Both bars hide while reading down (`.app.imm`). The side navigation on tablets and PCs can be
  hidden and shown (`.sbt` buttons in the header and reader bar, class `.app.nosb`, saved in `orr-sb`).
- **Standard Arabic (owner, 10 Nov 2026: "proper Arabic, not Sudanese").** All app text is Modern Standard Arabic: `tools/msa.py` rewrote the
  colloquial strings of src/shell.html and site_static/licence.js (`--check` lists leftovers); v2 says «بطاقات» not «كروت», «قرأتها» not
  «قريتها». New app text must be standard Arabic. (The OSCE history questions inside the book pages stay as the owner wrote them.)
- **About the book (owner, 11 Nov 2026):** Settings → «عن الكتاب» (`v2about`): hero and eight tiles as in his mock-up; six open his posters
  (`v2poster`, `assets/img/ab_<authors|reviewers|edition|howto|refs|goals|rights>.jpg`; thumbnails `abt_*.jpg`; «حقوق النشر وشروط الاستخدام»
  is a row under the tiles), «أدوات الدراسة» opens the user manual, «محتويات الكتاب» opens Chapters.
- **Whole book (owner, 11 Nov 2026):** Home «افتح الكتاب كاملًا» opens the book as one continuous book from the cover (`WHOLE`; every page
  shown, title and reading bar follow the topic in view); leaving the reader ends it and places are separate again.
- Tools hidden → a small round pen button at the bottom right brings them back (`#rbShow`, not in the top bar). Tablet/PC Home fills the height.
- **Levels and clean wording of flashcards and questions (owner, 11 Nov 2026).** Every card and question gets a level (1 easy = direct recall,
  2 medium = understanding or applying a fact, 3 hard = clinical reasoning, exceptions, several steps) and is rewritten in complete sentences
  with standard medical terms, WITHOUT changing any fact, number or dose; exact duplicate cards are removed. Card = [section, question, answer,
  level, old key]; question field `d` (EMQ items too). Chapter files `tools/levels/ch<N>.py`, applied with `python3 tools/levels/apply.py <file>`.
  App: Level filter in flashcards (`orr-fclv`) and step 3 «Level» in the test builder (`qset.lv`); a level tag on each card and question.
  **All seven chapters done (11 Nov 2026): 1,537 cards (464 easy, 788 medium, 285 hard) and 749 questions (112 / 398 / 239).** Chapters 1, 5, 6 (cards and
  questions) and chapter 3 cards were rewritten by hand (`CARDS`, `QS`); chapters 2, 4, 7 cards (`CLV`) and chapters 2, 3, 4, 7 questions (`LV`) have levels
  by hand and wording normalised by `tools/levels/clean.py` (shorthand written out in full terms), not sentence-by-sentence rewriting.
  have the old gold look; restyle them to the app tokens.
- **Help (owner, 11 Nov 2026):** Settings → «المساعدة» (`v2contact`): two cards (`HPS` in v2.js): د. عبدالجليل ارجا 0116984258 and د. العباس عبدالرحمن 0965859782 (+249 96 585 9782), each with three buttons:
  WhatsApp (wa.me), Telegram (t.me/+number), Call (tel:). **Notification sound:** a new notification plays a soft two-note sound and swings the
  bell (`nding`, after the first touch). **Preview trial:** preview.yml sets the Pages secret OBS_KEY for the preview environment too
  (`--env preview`); without it /trial answered 503 on the preview address.
- **User-guide posters (owner, 11 Nov 2026):** `assets/img/ug_1..5.jpg` open the user manual (`v2help`, chips `ugjump`), followed by the detailed steps with screenshots (HELP).
- **First paint and icon (owner, 11 Nov 2026):** the old look flashed before the new app: build.py `v2()` now sets palette and mode in the head, the
  welcome screen is in the page from the start, old `#home`/`#tabs` are never displayed; icons (`site_static/icon*.png`, apple-touch-icon) are the
  new logo on lavender and the manifest colours are lavender. An installed app keeps its old icon until it is removed and installed again.
- **Full page with the pen (owner, 11 Nov 2026):** `#v2full` (bottom left of the reader) hides and shows the bars and the side menu at any time;
  scrolling down with the pen or text tool on hides them too (shell scroll listener). `.app.imm` removes the side-menu space on tablets.
- Resources on tablets/PCs: seven large tiles filling the screen (12-column grid, 4 + 3).
- **Tools ring (owner, 11 Nov 2026; replaces the top strip):** the round pen button at the bottom right of the reader (`#rbShow`, always there)
  opens the tools in two rings around it with a soft glow (`#reader .rbar.fan`, positions `--x/--y` set in v2.js; undo/redo pill on the outer ring);
  choosing a tool closes the ring and opens its panel; a touch elsewhere closes it. The shell's rail stays "off" so the pages keep the full height.
- **App language (owner, 11 Nov 2026):** Settings → «اللغة» Arabic / English (`orr-lang`, `html[data-lang]`). `src/v2.lang.js` (appended to v2.js by
  build.py) rewrites the app's text nodes and placeholder/title/aria-label after every render from two dictionaries keyed by the text with numbers
  as `#`: `T_EN` (Arabic → English) and `T_AR` (English study-screen labels → Arabic). Book pages, topic and chapter names, questions, flashcards
  and the book's name are not touched. English mode gets left-to-right twins of every right-to-left v2 rule (build.py `en_css`). **Add every new
  app string to the dictionaries**; `/tmp`-style check: open each screen with orr-lang=en and list text nodes that still hold Arabic. States not
  yet covered: subscription/payment messages, request states, locked-page texts, old sheets (notes list), posters (pictures stay Arabic).
- Greeting carries «د.»: «مرحب بك يا د. <name>» (a title the student typed is not doubled); header name chip is larger on tablets/PCs.
- **Search (owner, 11 Nov 2026):** `src/v2.search.js` replaces `runSearch`: under the box the student picks where to search (الكل · المواضيع ·
  صفحات الكتاب · البطاقات · الأسئلة · التطبيق, `orr-ssc`) and a chapter. Words are matched in any order after normalising case, hyphens and Arabic
  letter forms (`sn`); topic-name matches come first; `SPLACES` lists the app's own places with Arabic and English keywords (add new screens there).
  A flashcard result opens its answer in place; a question result opens that question in tutor mode. build.py puts v2.search.js and v2.lang.js
  inside v2.js's closure.
- **Progress (owner, 11 Nov 2026):** Home shows two tiles (`.hsm2`: streak days, overall % with a ring); both open the progress sheet, now drawn by
  v2 (`ACT.prog`: ring, six tiles — pages read, topics completed, cards known, questions answered, % correct, days in a row — and a bar per
  chapter). The old progress card is no longer moved into the sheet (it showed as a black disc).
- Question bank and flashcard screens take the app's colours (v2.css block "question bank and flashcards in the app's colours"); the gold look is gone.
- Home order (owner, 11 Nov 2026): greeting · book card · continue reading · question bank and today's cards · streak and overall progress · the
  three shortcuts · subscription card last (CSS `order` at the end of v2.css; the markup order is older).

## New app is LIVE (owner, 11 Nov 2026: "we can deploy to students as we work on other things")
`redesign` was merged into `main` on 11 Nov 2026 and deploys to https://obstetrics-master-review.pages.dev. Migration 008 started the
one-month clock for the old codes (plan = 'old'; they end about 11 Dec 2026). An old code can still be typed in the new app: Subscription →
«عندي كود تفعيل قديم» (`window.__lic.activate`). **From now on:** try new work on branch `redesign` (preview address above), and merge it
into `main` when the owner has seen it; small fixes the owner asks for directly may go to both. English texts of the subscription and payment screens are in T_EN and bookmarks sync (`bm`) since 11 Nov 2026. Still open: the owner tests one live subscription; his corrected posters.
- Full page is changed ONLY by its button `#v2full` (owner, 11 Nov 2026): v2.js wraps `setImm`, so a tap on the page or scrolling no longer enters or leaves it; leaving the reader ends it.
- **Owner's fixes, 11 Nov 2026 (afternoon)** — code in `src/v2.tools.js` (inside v2.js's closure, after v2.search.js) and the last blocks of v2.css:
  - **Device Back button** goes back inside the app (`backOne()`: closes an open panel/sheet/note, then leaves the reader, then follows the screen's
    own back arrow, then Home); only Back on Home leaves the app. One guard history entry is pushed again after every handled Back.
  - **Sounds:** opening sound is a soft three-note bell (C–E–G, sine, clearly audible; the owner found the first chime annoying and a quieter
    version inaudible); the «تابع من حيث توقفت» notification is one silent entry (`id:'cont'`, `q:1`), so moving
    between pages and chapters never rings. Sound is for real notifications only.
  - **No stars on reviewers** (owner: they read as a rating of the book): removed from page 004 and painted out of `assets/img/ab_reviewers.jpg`
    (with the line that explained them). Do not bring them back.
  - **Tool cards:** every tool panel (`#penFly.tsheet`, decorated in `flyAt`) is a SMALL card (276 px) above the tools button: icon, name, on/off
    switch (`.ptog.tsw`), one row of colour dots, one row of sizes; no labels, no hint text, no undo/redo inside (the owner rejected the
    full-width sheet as "big and ugly"). The zoom card opens above the zoom button on the left.
  - **Home on sideways tablets/laptops** never scrolls: tighter tier at `(min-width:760px) and (max-height:720px)`, tighter again under 600 px.
  - **Whole book** behaves like a chapter everywhere: the reading bar stays on the cover and front pages too (slides/video dimmed there,
    «المواضيع» lists the chapters, `ACT.wch`).
  - **Marking text (owner, same evening; replaces the "calm selection" and "free notes" tried that afternoon — both removed, do not bring back):**
    there are NO highlight / underline / note tools to switch on (`setPens(false,false,false)` at start, their ring buttons hidden). The student
    selects text the normal way and the options bar appears (`#hlbar.selopt`, `showPalette` / `pickHL` replaced): six highlight colours, a row of the four underline colours
    (`data-ulc`; an underline is a line only, default thickness 1), «ملاحظة», close; tapping an existing mark shows colours, «حذف», «ملاحظة». Free notes made during the short test stay readable (`g.fn`, `#fnb`).
  - **Reader bar holds the controls (owner, same evening: not floating on the page):** tools (`#rbShow.rtools`, a smart-pen icon (stylus with sparks; the owner rejected the wrench), a plain icon the same size as its neighbours), zoom (`#zoomBtn`) and
    full page (`#v2full`) are buttons in the top bar before the bookmark. The tools ring opens UNDER its button (`#rbar` is fixed at the
    button's centre): قلم, ماركر (`#mkBtn`, free highlight with its own card), نص, صفحة, plus undo/redo. Tool cards open at the top right under
    the bar. While the page is full (bars hidden) the small button `#v2fx` on the page brings the bars back. The page number is a chip in the same bar (`#pnum.rpg`, «10 / 368»; tap it to type a page and go there); the small line
    over the topic title names the chapter. Nothing floats on the page. Home is the first button of the bottom reading bar (`#rnHm`); the top bar has no Home button.
  - **Next (owner, 11 Nov 2026): rewrite of the chapters** — new page design and better medical writing: no fixed "Introduction" opening, short
    basic background only where needed, a clinical case to introduce disease topics, smoother order, standard terms and titles. Make ONE model
    topic first and show it to the owner before the rest.
  - **The reader is always continuous (owner, 11 Nov 2026 evening: "ok for the book to be continuous even in chapters"):** `goIdx` always opens
    the whole book (`WHOLE`, `SCOPE='all'`) at the asked page; the earlier rule "each place is separate" no longer applies to the reader.
  - **Home reading card (owner, 11 Nov 2026 evening):** `.hcont.hc2` shows the chapter picture whole (no white fade, no small preview) with two
    frosted bars over it: top = chapter chip + chapter name + topic (`.cbt`), bottom = progress + «تابع القراءة» (`.cbb`). On short phone screens the card shrinks instead of covering the tiles under it: the two bars become one row (name on the left, button on the right; container query under 128 px).

## Student Master Review platform (owner, 11 Nov 2026) — folder `platform/`
One home for all the books (Basic Sciences · Clinical · House Officer), plain static site, its OWN Cloudflare Pages project
`student-master-review` (`.github/workflows/platform.yml`: main → https://student-master-review.pages.dev, other branches →
`<branch>.student-master-review.pages.dev`). It does not touch this book's build or deploy. Surgery, Obstetrics and Pediatrics are
opened INSIDE the platform (owner, 11 Nov 2026: `#read-<id>`, a frame under a slim platform bar; frames stay loaded). The apps are
unchanged; inside the frame a phone keeps separate storage, so students activate once more there (another device) and sync brings notes back.
Phone Home fits one screen (no scrolling); day/night is one button with a Day / Night / Automatic menu. Arabic by default; on opening, a greeting offers «ثبّت التطبيق» (install by device type) or «المتابعة في المتصفح» (platform/README.md). No bar over a book: each book's Home has a small round back button (`#smrBack`, script at the end of each app's src/shell.html; here beside the greeting) that posts `{smr:'library'}` to the platform. Settings → profile: big photo, «اختر صورة» under it, then the name. Opening (owner, 11 Nov 2026): after «ثبّت التطبيق» / «المتابعة في المتصفح» / «ابدأ» the greeting's second step «اختر لغة التطبيق ومظهره» (current choice shown, applied at once; Cairo shipped in platform/fonts). Each book shows its greeting, then (not subscribed, no trial running) the choices subscribe · trial while unused · free (here `#v2chz` in v2.tools.js after «ابدأ»). Books follow the platform language (`window.__smrLang`, v2.lang.js) unless the student chose one in the book (`smr-langown`); a language change in the platform is sent with force to every book. Progress page: real figures from each book (`window.__smrStats` in each app — here at the end of src/v2.tools.js — sent as `{smr:'stats'}` and kept in the platform as `smr-st-<id>`): totals, ring, bars for reading/mastered, questions (correct/wrong split, accuracy), flashcards, streak, topics, per-chapter bars. Every screen comes from `platform/js/catalogue.js`; text in `platform/js/i18n.js` (English + standard Arabic);
see platform/README.md. No invented data: progress stays in the apps, notifications are an empty state until real ones exist.
Review copy: https://claude.ai/artifact/VKS3UPJmG5oa9kH9NGGXUm (whole platform; links open the live apps).

## One app design and one subscription system for the three books (owner, 11–12 Nov 2026)
- Surgery and Pediatrics are being made exactly like this app: their repos copy src/v2.js, v2.search.js, v2.tools.js, v2.lang.js,
  v2.css, v2.html from here with `tools/port_v2.py` (their own adapter src/v2.book.js / v2.book.post.js / v2.book.css, settings
  tools/v2book.json). **After changing the app here, re-run port_v2.py in both repos** so they stay the same.
- Phone Home (owner, 11 Nov 2026): no progress tiles on phones; the name chip shows only the picture under 430 px; forward arrows (`I('back')`,
  class `fwd`) point right in English. The video lectures are called «الفيديو» / Videos and the slides «المحاضرات» / Lectures (owner).
- Admin (site_static/admin.html) is the admin of the three books (owner, 12 Nov 2026): platform logo and colours (smr-icon-*.png, admin.webmanifest),
  a book filter (All / Obstetrics / Pediatrics / Surgery, `adm-book`), a book label on every request; **Students** = one card per student
  (subscriptions with the same phone number, last 9 digits) with a row per book (or «Not subscribed»), each row with its own Devices / Extend /
  Notes / Remove devices / Switch off; «All notes» shows the student's notes of every book, grouped by book and page; a request shows what the
  student already has («Already: …»). Give shows the device's book (`obs_admin_seen`).
- Fast opening (owner, 12 Nov 2026; lighter the same day after "the app is slow"): the platform loads every book in the background ONE AT A TIME and keeps it ready (owner, 12 Nov 2026: "all books must open fast"), so opening any book only brings its frame forward; only phones with ≤ 2 GB memory (`LOWMEM`) close a background book 25 s after it loaded and keep the last two opened (`prune`). Frames off the screen, class .bg,
  not on save-data connections); each book's service worker (same file in the three books: site_static/sw.js here, src/sw.js there; owner, 12 Nov 2026 "old link still opens the book": the PAGE is asked online first, up to 3 s, so a new version shows at once; a new version copies the saved pictures from the older cache, saves only the new page and small files, then reloads every open page of the book) saves every
  file at the first opening and then opens from the device, fetching the newest page in the background for the next opening.
- Platform colours (owner, 12 Nov 2026): six colours (`smr-pal`, html[data-pal]) in Settings and in the first-opening step with language and look.
- Home reading card (owner, 12 Nov 2026: "the chapter text covers the picture"): `.hc3` = the chapter picture alone with a thin progress line,
  under it a chapter button (small text: «الفصل N · %» + chapter name) and «تابع القراءة».
- `tools/supabase/migrations/009_three_books.sql` (applied 12 Nov 2026 with the owner's OK): book column on codes / requests / devices seen, a key per
  book (`obs_book_keys`, its SHA-256 printed in the apply log → book.json access.key_hash of Pediatrics / Surgery), 4- and 10-argument
  `obs_request_status` / `obs_request_submit` with p_book, a link number joins only a device of the same book. Obstetrics calls are
  unchanged. Tested on a local Postgres copy. To apply: move it into migrations/ and push to main.
- **Automatic sync (owner, 12 Nov 2026: "once there is internet, notes and every edit sync and upload by themselves, even with one phone"):**
  a block right after the sync start (`/* Automatic sync … */`, same in the three books) watches localStorage writes of the synced keys
  (highlights, notes, drawings, page marks, cards known, question answers, tests, bookmarks, blank pages, streak) and starts a sync 4 s later;
  `<prefix>-dirty` = changes not yet online (kept across restarts); retried every 30 s when the upload failed; a check for other devices'
  changes every 3 minutes while the app is open; upload on pagehide / going to the background. Subscribed devices only (sync is per subscription).
- **One app (owner, 12 Nov 2026: "the links of each book no longer work, even the installed apps; everything works with the big app link"):**
  the three book addresses (obstetrics-master-review.pages.dev, surgery-/pediatrics-master-review.jaberarja555.workers.dev) opened on their own
  (not inside the platform frame) show «الكتاب الآن داخل تطبيق Student Master Review», save what is not yet online (`window.__autoSync.now`),
  then `location.replace` to https://student-master-review.pages.dev/#home~move-<book>=<base64 JSON (owner, 12 Nov 2026: the platform opens as on a first opening — greeting with install / browser and a note that the books now open here, then language, look and colour, then Home; the hand-over waits in localStorage `smr-move-<book>` until that book's frame is made) of the device identity keys: dev, code,
  act (Worker token), sdev, trial, chz, name, sname, lang, mode, pal, tel, req; plus a WhatsApp #code=>. The platform (`MOVE`, js/app.js) keeps it for
  this tab and opens the frame with `#smr-move=…`; the head script of each book imports the keys only when that frame has no subscription of its
  own, then clears the address (restoring #code= if any). Same device id → the subscription and synced notes follow with no code and no extra
  device slot; Obstetrics adopts its key through poll() (no choices sheet when `orr-code` came along). Only the production host names move;
  previews, localhost, admin.html and the Workers' /admin keep working. Free/trial students' notes that were never online stay in the old app.
- Reader (owner, 12 Nov 2026): «الفيديو» / «المحاضرات» in the reading bar open THIS topic's video or lecture in a sheet (`media()`, `#v2msheet`;
  a file in INFO.video[topic] / INFO.slides[topic] plays there, otherwise the topic's own «قريبًا» card) with «كل الفيديوهات / كل المحاضرات» for the list;
  «المحتويات» opens the book contents panel (`tocDrawer`) with a second tab «المحفوظة» = the bookmarked topics (`contents()`); Back closes both.
- **One name and picture (owner, 12 Nov 2026):** the platform's profile (smr-name / smr-photo) is used inside every book: the end script of each
  src/shell.html receives `{smr:'profile'}` into `<px>-name` / `<px>-photo` and calls `window.__smrProfile` (v2.tools.js: header, greeting,
  Home); a change made inside a book goes back to the platform (Storage watcher) and on to the other books. A book's existing name/picture
  fills an empty platform profile once (`smr-profset`). Opening the platform on `#read-<book>` starts on Home (old saved tabs/links).
- **Install from any browser (owner, 12 Nov 2026):** in-app browsers (WhatsApp, Facebook, Messenger, Instagram, Telegram…) cannot install a web
  app, so on Android the platform jumps to Chrome by itself (intent link with fallback `?nochrome=1`; the # travels as `?h=`), other phone
  browsers go to Chrome from «ثبّت التطبيق», iPhone in-app browsers go to Safari (`x-safari-https://`); in Chrome the button waits up to 4 s for
  the install window and says when the app is already installed (manifest related_applications + getInstalledRelatedApps).

## Speed (owner, 12 Nov 2026: "the app is very slow: opening a book, opening its content, moving between pages and chapters")
Measured on a simulated mid-range phone (Chromium, CPU 4x slower): start 3.1 s → about 1.6 s, opening the reader 9.3 s → 0.4 s, smooth scrolling (median frame 17 ms).
- **Pages are built on demand** (src/shell.html `LAZY`, `ensurePage`, `renderPage(i,force)`): at start every page is only an empty sheet of the right
  size (`.pw` > `.bk`); its content is cloned from the `<template id="bookPages">` source when it comes near the screen (`fillNear` / `prepPage`: pages on
  the screen at once, the next ones in idle time through `DQ`). Search text, highlights' text and page keys read the SOURCES (`srcPages`), never
  the built pages. Anything that needs a page's DOM must call `ensurePage(i)` first. `window.__renderAll()` builds everything.
  **Tools** (paginate, check, measure, screenshots) run in an automated browser (`navigator.webdriver`) and get all pages built at start, as
  before; set `window.__lazy = 1` before the page loads to test the students' way.
- **Each page is its own layout island**: `.pw{contain:strict}` and, with lazy pages, `html.lz .pw{content-visibility:auto}`. Do not put
  anything inside a `.pw` that must show outside its box.
- **Scroll**: one update per frame (`onScroll('s')`); the bars, page number and saved position are rewritten only when the page in view
  changes (v2.js `pill` too). Do not add work to the scroll path; never write the DOM or localStorage on every scroll event.
- **Page spacing** (`fillPage`): the value is found by interpolation (about 3 layouts instead of 9); the result is the same within 2 px.
- The search text (`TEXT`) is made at the first search (`textReady()`), not at every opening.
- **Opening from the device**: the service worker answers the book page from the saved copy at once (no waiting for the internet). A new
  build has a new worker file (cache name = page hash): the browser finds it in the background, the worker saves the new page and reloads
  the open book (also asked again when the app returns to the screen after 30 minutes). Do not go back to "internet first".
- **Platform** (platform/sw.js, js/app.js): every screen opens at once from the saved copy and is renewed in the background; when a page,
  style or script changed the worker tells the app ({smr:'new'}), which reloads once if it was only just opened and not yet touched. The
  Latin web fonts no longer hold up the first screen (Cairo is shipped). Books are loaded in the background only while the student is not
  touching the app (`whenIdle`), the last opened book first; a phone with ≤ 2 GB memory loads only its last opened book that way.
- The same reader changes are in Surgery and Pediatrics (their src/app.js); v2.js / v2.search.js changes reach them through tools/port_v2.py.
- **Page spacing is measured when the book is built (owner, 13 Nov 2026: "Pediatrics feels faster than Surgery and Obstetrics").** Opening a
  page made the phone lay it out 20–50 times to find `--ft` / `--fgap` (Surgery and Obstetrics about twice as much as Pediatrics). Now
  `node tools/fill.js` runs the app's own `fillPage` once on every page and writes `content/fill.json` ({styles hash, page hash → spacing});
  build.py (`_mark`) gives every page `data-h` (hash of its HTML) and, when its HTML and the styles are unchanged since the measuring, `data-fl`;
  `fillPage` applies `data-fl` with no measuring. **After any change of content or styles run:**
  `python3 build.py && node tools/fill.js && python3 build.py` (if it is forgotten nothing breaks: changed pages carry no `data-fl` and are
  measured on the phone as before, only slower). Phone simulation after this: opening the reader 0.32 s → 0.18 s, a topic 0.18 s → 0.13 s.
- **Subscribed students (13 Nov 2026):** the unlocked pages from content.bin stay as text (`window.__PGSRC`) and each is made into a page
  the first time it is needed (`pgSrc(i)` in shell.html: read a page's source through it, not `srcPages[i]`); decks and questions are handed
  over as objects (`window.__DECKS`, `__QBANK`). Start for a subscribed student: app ready 1.4 s → 0.9 s, the blocking step 0.8 s → 0.3 s.
