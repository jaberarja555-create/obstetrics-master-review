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
- **Every new app feature must be added to the how-to pages** (004_a00c_howto1 / 005_a00d_howto2, owner Nov 2026), in the same Arabic style, keeping both pages fitted.
- Reader: tap the page-number pill to type a page and jump there (`.pnum.ed`); full-page reading hides the bars on scroll down, a tap brings them back.
- **Page fit (owner, Nov 2026, as in Surgery):** no congested pages, no big gaps. `tools/paginate.py` re-plans each topic: sections are cut into
  atoms (whole boxes; inside a titled section: paragraphs, lists, boxes, rows of long tables with the header repeated; never after a float or
  sub-heading, pieces ≥ 70 px), laid on the fewest pages that keep `KEEP` (45) px free at the foot, then shared as evenly as possible; it adds
  or removes topic pages (`grow_topics.py`, `delete_page.py`) and rewrites the contents page (`fix_contents.py`). Run after content changes:
  `python3 build.py && python3 tools/measure_blocks.py && KEEP=45 python3 tools/paginate.py --apply && python3 build.py`.
  At run time `fillPage` (shell.html) spends the spare room inside the boxes (`--ft` 0–2.2: line spacing, padding, table rows, text +≤8 %), leaving ≥ 50 px.
  Inter is shipped in `assets/fonts` so every phone lays the pages out as planned. `tools/measure_free.py` → build/free.json (free px per page).
- **Chapter covers (owner, Nov 2026, as in Surgery):** `tools/chapter_covers.py` adds a cover page (`k<n>_cover`, free in the trial, no definition marks)
  before each chapter and rewrites them with the current page numbers (re-run after pages move): navy band with the emblem and book title,
  Chapter N, title in the chapter colour, the owner's picture `assets/img/chcover_<n>.jpg` (cropped from his mock-ups to the picture only;
  chapters 1–5 done, 6–7 still use their contents banner until he sends pictures), and "In this chapter" with topic pages (two columns when > 5).
  Contents chapter bands start at the cover.
- `build.py` → `build/site/` (deploy: free pages, lock placeholders, `content.bin` = AES-GCM(gzip JSON of locked pages,
  decks, whole qbank)) and `build/review/index.html` (whole book open; publish as the review artifact).

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
  write build/rr/chapters.json (see git history), `python3 build.py && node tools/rapid_review/layout.js && python3 tools/rapid_review/write.py`.
- **No repeated titles (owner, 6 Nov 2026):** a section that runs on to the next page continues WITHOUT its title (no slim title,
  no "continued"); tools/cont_titles.py now removes any. To avoid small stubs, a section is divided only when it is big
  (`SPLITMIN` 320 px) and into fair parts (each ≥ `SPLITFR` 30 %); where that would leave big gaps a looser setting is used
  per topic (220/.22 or 0/0). Before re-planning, `python3 tools/merge_pieces.py <topic keys>` gathers split pieces back together.
  Untitled ("bare") boxes with long tables (also `table.osce`) may now be divided by rows.
- paginate.py never leaves a sub-topic title (`h2.mzsub`) at the foot of a page with less than `SUBMIN` (140) px under it;
  `tools/merge_pieces.py` joins two pieces of one section that land on the same page.
