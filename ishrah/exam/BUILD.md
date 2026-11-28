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
  build/
    pipeline.py           builds js/data.js from the source files + patches.json
    patches.json          corrections kept across accounts (images, fixes, drops) — COMMITTED
    src/                  raw source (exams/*.json, index.json, resources.json) — gitignored, re-upload per account
```

## Rebuild the questions (every account must do this once)
1. Get the owner's source zip (`perminant-easy-exams_2.zip` — 32 exam files + index.json + resources.json). Upload it in the session.
2. Extract it into `ishrah/exam/build/src/` so you have `build/src/exams/*.json`, `build/src/index.json`, `build/src/resources.json`.
3. Run: `python3 ishrah/exam/build/pipeline.py` → writes `ishrah/exam/js/data.js` and prints a report.
4. Test: serve a copy and open `/exam/` (the data is only in `js/data.js`, which is gitignored).

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

## To do next
1. **Fix mistakes + improve explanations** — fact-check the questions against resources/guidelines in batches (~150), each change added to `patches.json` with a confidence note for the team to approve.
2. **Paid subscription** via the shared Supabase system (new book id e.g. `perm`): encrypt `data.js` into a committed blob that unlocks for subscribers (like the books' `content.bin`), then it can go in the repo and open on phones.
3. **Open inside the platform** full-screen with the SMRA handle (like the HO Guide, see `ishrah/js/hoapp.js`), installable, and release.
