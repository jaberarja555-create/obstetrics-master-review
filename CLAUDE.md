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
- New keys: orr-name, orr-photo, orr-bm (bookmarks, not synced yet), orr-lastact, orr-nread, orr-nseen, orr-pseg.
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
  **Done: chapter 1 (86 cards, 44 questions). Next: chapters 2–7, one chapter at a time.** The question bank and flashcard screens still
  have the old gold look; restyle them to the app tokens.
- **Help (owner, 11 Nov 2026):** Settings → «المساعدة» (`v2contact`): two cards (`HPS` in v2.js): د. عبدالجليل ارجا 0116984258 and د. العباس عبدالرحمن 0965859782 (+249 96 585 9782), each with three buttons:
  WhatsApp (wa.me), Telegram (t.me/+number), Call (tel:). **Notification sound:** a new notification plays a soft two-note sound and swings the
  bell (`nding`, after the first touch). **Preview trial:** preview.yml sets the Pages secret OBS_KEY for the preview environment too
  (`--env preview`); without it /trial answered 503 on the preview address.
- **User-guide posters (owner, 11 Nov 2026):** `assets/img/ug_1..5.jpg` open the user manual (`v2help`, chips `ugjump`), followed by the detailed steps with screenshots (HELP).
- **First paint and icon (owner, 11 Nov 2026):** the old look flashed before the new app: build.py `v2()` now sets palette and mode in the head, the
  welcome screen is in the page from the start, old `#home`/`#tabs` are never displayed; icons (`site_static/icon*.png`, apple-touch-icon) are the
  new logo on lavender and the manifest colours are lavender. An installed app keeps its old icon until it is removed and installed again.
