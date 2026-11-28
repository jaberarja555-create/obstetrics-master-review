# SMRA Permanent Exam — build & handover

The team's old **Perminant Easy** site (perminant-easy.vercel.app) rebuilt as a new SMRA app and brought inside the Student Master Review platform. Any account with repo access can continue from here. Shared working branch: `ccr-38b3f943-ba1ode`.

## Where things are
```
ishrah/exam/
  index.html              app shell (SMRA theme/palette/size, like the HO Guide)
  css/exam.css            styles (SMRA tokens: data-pal colours, data-theme day/night/eye, data-fs size)
  js/app.js               the whole app (home, exams, subjects, runner, mock, progress, settings)
  js/data.js              the QUESTIONS — GENERATED, gitignored (paid content, must not be in the public repo)
  img/q/*.jpg             clinical pictures attached to questions (committed)
  img/ex-192.png ex-512   app icons
  manifest.webmanifest, sw.js
  js/data.enc             the FULL bank, AES-256-GCM encrypted — COMMITTED (this is what students download; useless without the key)
  js/data.sample.js       20-question FREE preview shown before subscribing — COMMITTED
  build/
    pipeline.py           builds js/data.js + build/data.json from the source files + patches.json — COMMITTED (git add -f)
    encrypt.cjs           data.json → js/data.enc + js/data.sample.js (needs build/exam.key) — COMMITTED
    decrypt.cjs           recover build/data.json + js/data.js from js/data.enc + build/exam.key — COMMITTED
    patches.json          corrections kept across accounts (images, fixes, drops) — COMMITTED
    exam.key              the 32-byte AES key (base64) — GITIGNORED, SECRET (also stored in Supabase exam_cfg.k)
    src/                  raw source (exams/*.json, index.json, resources.json) — gitignored (paid content)
    data.json             plaintext bank written by the pipeline — gitignored (paid content)
```
`build/` is gitignored by a root rule, so the three build scripts + patches.json are force-tracked (`git add -f`); once tracked, git follows their changes normally. Never force-add `exam.key`, `data.json` or `src/`.

## Rebuild the questions (every account must do this once)
Two ways. **A — from the key only (fast, no sources):** get the key (from the owner, or `select k from exam_cfg;` in Supabase) into `build/exam.key`, then `node build/decrypt.cjs` → writes `build/data.json` + `js/data.js`. Enough to run and inspect the bank.
**B — from the raw sources (to change source exams):**
1. Get the owner's source zip (`perminant-easy-exams_2.zip` — 32 exam files + index.json + resources.json). Upload it in the session.
2. Extract it into `ishrah/exam/build/src/` so you have `build/src/exams/*.json`, `build/src/index.json`, `build/src/resources.json`.
3. Run: `python3 ishrah/exam/build/pipeline.py` → writes `ishrah/exam/js/data.js` + `build/data.json` and prints a report.
4. Then `node build/encrypt.cjs` (needs `build/exam.key`) → rewrites `js/data.enc` + `js/data.sample.js`. Commit those two.
5. Test: serve a copy and open `/exam/` (the data is only in `js/data.js`, which is gitignored).

The pipeline: strips the `"A) "` prefix from options, **removes duplicates** (keeps one unique copy with `exams:[...]` membership — 448 removed), **auto-tags subjects** (MED/SURG/PAED/OBG/COMM/OTHER), flags broken questions, and applies `patches.json`.

## Making corrections (so they survive across accounts)
Edit `build/patches.json`, keyed by `"examId:questionNumber"`:
- `images`: `"perm27complete:100": "img/q/perm27complete-100-clubfoot.jpg"` — attach a picture (put the file in `img/q/`).
- `fixes`: `[{"exam":"fageery2016","qno":8,"field":"answer","value":1}]` — overwrite `question` | `options` | `answer` (0-based) | `explanation` | `subject` (MED|SURG|PAED|OBG|COMM|OTHER).
- `drop`: `["exam:qno", ...]` — remove a question.
Then re-run the pipeline. **Never commit `js/data.js` or `build/src/`.**

## State (28 Nov 2026)
- 4,654 source questions → **4,206** after removing 448 duplicates. Options cleaned, subjects tagged (~707 still OTHER — refine in patches), 15 broken flagged.
- App done: Home, Exams (Past papers / Pool / Sheets / Fageery), By subject, **question runner** (tutor reveal + explanation, mark/flag, repeat badge, images), **Mock exam** (random 200), **Timed or Tutor** mode chooser, **Progress** (overall %, per-subject, weak areas, previous tests, streak), Settings (7 palettes, day/night/eye, size, language).
- Pictures received (4): perm27complete 93 tetanus, 94 pellagra, 98 koilonychia, 100 clubfoot.

## Pictures still needed (search the internet)
- **sheet8 Q102 — REQUIRED.** A 12-lead ECG showing **acute ST-elevation myocardial infarction (STEMI)** — clear ST-segment elevation in contiguous leads. Search: "12 lead ECG acute STEMI ST elevation".
- **sheet8 Q45 — optional** (the text already describes it). CT brain: a right-sided **extradural / epidural haematoma** — a hyperdense **biconvex (lens-shaped)** lesion between skull and brain with midline shift.
- **fageery2016 Q8 — not needed** (the CSF values are written in the question).

## Paid subscription — DONE (28 Nov 2026)
The bank is sold through the **platform's own paid-file flow** (the same Bankak → receipt → Control → Payments approval the library uses), not the books' separate Supabase. One-time purchase (lifetime), not a monthly plan.
- **Encryption:** `js/data.enc` is the whole bank, AES-256-GCM. The key is NEVER in the repo — it lives only in Supabase table `exam_cfg` (RLS deny-all) and is read only by `ish_exam_key()`, which returns it when `ish_file_open(<exam file>)` is true (owner / library staff / an **active** `file_buys`). Migration `supabase/069_exam_access.sql` creates `exam_cfg`, `ish_exam_key()`, `ish_exam_state()` and sets the exam file `price` (default **15,000** — change in Control or by SQL).
- **The exam file** is the catalogue row `4c00d0f9-ed8e-465e-ac56-37cafe1980bc` (published by migration 068), given `price` by 069 so `IS.ACT.buyfile` can sell it.
- **Bridge:** the frame (`exam/js/app.js`) asks the platform for the key (`postMessage {exam:'key'}`); `ishrah/js/examapp.js` answers `{exam:'state', key, price, pending, bankak}` (key only when allowed). Locked → a **free 20-question preview** + a Subscribe button that posts `{exam:'buy'}`, which opens the platform's buy sheet for the exam file. After the owner approves the receipt, the next open (or **"I subscribed — check"**) returns the key; the app fetches `js/data.enc` and decrypts it in the browser (WebCrypto). Standalone (outside the platform) stays locked.
- **In the platform:** opens full-screen in a frame with the SMRA handle, on the House Officer home / books shelf / Features, exactly like the HO Guide.

### Owner steps to turn the bank ON for subscribers
1. Apply migration 069 (automatic on push to the live branch; or run `supabase/069_exam_access.sql`).
2. **Store the key once** (sent privately, never in the repo): in Supabase SQL editor run
   `insert into exam_cfg (id, k) values (1, '<BASE64 KEY>') on conflict (id) do update set k = excluded.k;`
   The key is the content of `build/exam.key`. Until this row exists, every device stays on the free preview.
3. Set the price if 15,000 is not wanted: Control → the exam file, or `update files set price = <amount> where id = '4c00d0f9-ed8e-465e-ac56-37cafe1980bc';`
4. A student pays with Bankak and uploads the receipt from the Subscribe button; approve it in **Control → Payments**. The bank unlocks on their device by itself.
> Your own account (owner / library staff) unlocks the full bank without paying, once the key row exists — good for testing.

## To do next
1. **Fix mistakes + improve explanations** — fact-check the questions against resources/guidelines in batches (~150), each change added to `patches.json` with a confidence note for the team to approve, then `python3 build/pipeline.py && node build/encrypt.cjs` and commit `js/data.enc` + `js/data.sample.js`.
2. **Pictures still needed** (above): sheet8 Q102 STEMI ECG (required); add via `patches.json` `images`.

## Home design = the owner's mockup (28 Nov 2026)
The Home screen copies the owner's approved mockup pixel-for-pixel (checked side by side at 430×764). Its styles are the block
"Home — exact copy of the owner's mockup" at the end of `css/exam.css`, written by `python3 exam/build/home_css.py`
(sizes in `u` = CSS px on a 430-wide phone, scaled to the screen; fonts in `fz`). Change sizes there, not by hand.
- Fonts shipped in `exam/fonts/`: Poppins 600/700 (headings) and Inter 400/500/600 (body, subset from the OFL Inter files).
- `img/steth.webp` is the stethoscope cut from the owner's mockup (shown in the Free Preview card; hidden in night mode).
- The default palette (`navy`, shown as "Default") uses the mockup's medical blue + cyan; other palettes keep their colours.
- Arabic mirrors the cards (text right; ring, photo and arrows left).
