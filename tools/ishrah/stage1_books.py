#!/usr/bin/env python3
"""Stage 1 of ishrah/PLAN-one-platform.md: the old Student Master Review platform (and its admin) moves to
https://books.studentmasterreview.com, so SMRA can take https://studentmasterreview.com.

Run it ONLY after the owner has added books.studentmasterreview.com as a custom domain of the Cloudflare Pages project
`student-master-review` and the address opens the old platform (otherwise the books would send students to an address that does not
exist yet).

Usage (from the folder that holds the three repositories, each checked out on its LIVE branch and up to date):
    python3 obstetrics-master-review/tools/ishrah/stage1_books.py          # show what would change
    python3 obstetrics-master-review/tools/ishrah/stage1_books.py --apply  # change the files

Live branches: obstetrics-master-review `main` (book src/shell.html, platform/, site_static/admin.html; deploy.yml and platform.yml
deploy them), surgery-rapid-review `claude/surgery-rapid-review-app-eoho37` (src/shell.html AND the built docs/*.html), pediatrics-master-review
`main` (same). The built docs are edited with the same exact replacements, so no rebuild is needed. Then commit and push each.
"""
import sys, pathlib, re

APPLY = '--apply' in sys.argv
ROOT = pathlib.Path(__file__).resolve().parents[3]
NEW = 'https://books.studentmasterreview.com'

# exact replacements: (old, new). Each must be found where it is expected.
BOOK = [
    # a book opened on its own moves the student into the OLD platform (until Stage 3 brings the books into SMRA)
    ("location.replace('https://studentmasterreview.com/#home'", "location.replace('" + NEW + "/#home'"),
    ('<img src="https://studentmasterreview.com/icon-192.png"', '<img src="' + NEW + '/icon-192.png"'),
    # the book shows its «back to the library» button when its parent is the old platform at its new address
    (r"^https:\/\/studentmasterreview\.com$", r"^https:\/\/(books\.)?studentmasterreview\.com$"),
]
PLATFORM = [
    # the old pages.dev address hands students over to the platform's new address
    ("var NEW='https://studentmasterreview.com/'", "var NEW='" + NEW + "/'"),
]
MANIFEST = [('"url": "https://studentmasterreview.com/manifest.webmanifest"', '"url": "' + NEW + '/manifest.webmanifest"')]
ADMIN = [("location.hostname!=='studentmasterreview.com'", "location.hostname!=='books.studentmasterreview.com'")]

JOBS = [
    ('obstetrics-master-review', ['src/shell.html'], BOOK),
    ('obstetrics-master-review', ['platform/index.html'], PLATFORM),
    ('obstetrics-master-review', ['platform/manifest.webmanifest'], MANIFEST),
    ('obstetrics-master-review', ['site_static/admin.html'], ADMIN),
    ('surgery-rapid-review', ['src/shell.html', 'docs/*.html'], BOOK),
    ('pediatrics-master-review', ['src/shell.html', 'docs/*.html'], BOOK),
]

problems = 0
for repo, globs, reps in JOBS:
    base = ROOT / repo
    if not base.exists():
        print('MISSING repository', base); problems += 1; continue
    files = []
    for g in globs:
        files += sorted(base.glob(g))
    for f in files:
        s = f.read_text(encoding='utf-8'); s0 = s
        for old, new in reps:
            n = s.count(old)
            if n:
                s = s.replace(old, new)
                print(f'{repo}/{f.relative_to(base)}: {n} × {old[:60]!r}')
        if s != s0 and APPLY:
            f.write_text(s, encoding='utf-8')
    # every expected replacement must have happened in the source file (docs may have none if not built with the shell)
    src = base / globs[0]
    if src.exists():
        t = src.read_text(encoding='utf-8')
        for old, new in reps:
            if old in t and APPLY:
                print('NOT REPLACED', repo, globs[0], old[:60]); problems += 1
            if not APPLY and old not in t and new not in t:
                print('NOT FOUND (check by hand)', repo, globs[0], old[:60]); problems += 1

left = []
for repo in ('surgery-rapid-review', 'pediatrics-master-review'):
    for f in (ROOT / repo / 'src').glob('*.html'):
        if re.search(r"https://studentmasterreview\.com/#home", f.read_text(encoding='utf-8')):
            left.append(str(f))
print('still pointing at the root:', left or 'none')
print(('APPLIED' if APPLY else 'DRY RUN') + (' with %d problem(s)' % problems if problems else ', no problems'))
sys.exit(1 if problems else 0)
