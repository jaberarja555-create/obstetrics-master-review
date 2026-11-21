#!/usr/bin/env python3
"""Keep «مرشد المنصة» (the guide assistant) up to date with the app (owner, 21 Nov 2026: "we are still building the app and will change
things; be sure the assistant will be updated").

Writes ishrah/functions/api/_guide.js = the hand-written description (tools/ishrah/assistant_guide.md) + «PLACES IN THE APP»: every page
the app's menus link to, with its Arabic and English name, read from the code (js/*.js). So a new page or a renamed menu item reaches the
assistant at the next release with nothing to do. Pages that no menu names and the description does not mention are listed as a warning:
add a line about them to assistant_guide.md (or to DETAIL below when they only open from a card, such as one course).

Runs from stamp.py (every release) and in the deploy workflow.   python3 tools/ishrah/guide.py [--strict]
"""
import json, os, re, sys
here = os.path.dirname(os.path.abspath(__file__))
root = os.path.join(here, '..', '..', 'ishrah')
js = {f: open(os.path.join(root, 'js', f), encoding='utf-8').read() for f in sorted(os.listdir(os.path.join(root, 'js'))) if f.endswith('.js')}
pages = set()
for s in js.values(): pages.update(re.findall(r"IS\.page\('([a-z0-9-]+)'", s))

# pages opened from a card or a link with an id (one course, one lesson…), and old or internal pages: described in general words only
DETAIL = {'course', 'lesson', 'post', 'file', 'event', 'path', 'person', 'lecturer', 'series', 'cert', 'payment', 'purchase', 'ticket', 'dl',
          'spec', 'specialties', 'specialties-old', 'course-request', 'lec-ticket', 'control-ticket', 'control-course-request', 'control-payout',
          'studio-course', 'studio-lesson', 'studio-course-request', 'studio-payout', 'studio-share'}

AR = re.compile(r'[؀-ۿ]')
places = {}
order = ['core.js', 'mr.js'] + [f for f in js if f not in ('core.js', 'mr.js')]   # the main menus first: their names win
for f in order:
    for r, ar, en in re.findall(r"\['([a-z][a-z0-9/-]*)', '[a-z0-9]+', '([^'\n]{2,60})', '([^'\n]{2,60})'", js.get(f, '')):
        if r.split('/')[0] in pages and AR.search(ar) and not AR.search(en) and r not in places and r not in DETAIL:
            places[r] = (ar, en)
guide = open(os.path.join(here, 'assistant_guide.md'), encoding='utf-8').read().strip()
mentioned = set(re.findall(r'#([a-z][a-z0-9-]*)', guide))

def area(r):
    return 'control panel (team)' if r.startswith('control') else 'lecturer studio' if r.startswith('studio') else 'platform'
lines = []
for a in ('platform', 'lecturer studio', 'control panel (team)'):
    rows = [f'[{v[0]} / {v[1]}](#{r})' for r, v in places.items() if area(r) == a]
    if rows: lines.append(f'{a.capitalize()}: ' + ' · '.join(rows))
text = guide + '\n\nPLACES IN THE APP (the only addresses you may link to; names as the menus show them, Arabic / English):\n' + '\n'.join(lines) + '\n'

missing = sorted(p for p in pages if p not in DETAIL and p not in mentioned and not any(r.split('/')[0] == p for r in places))
out = os.path.join(root, 'functions', 'api', '_guide.js')
body = ('/* Written by tools/ishrah/guide.py: do not edit by hand (change tools/ishrah/assistant_guide.md, then run the script). */\n'
        'export const GUIDE = ' + json.dumps(text, ensure_ascii=False) + ';\n')
old = open(out, encoding='utf-8').read() if os.path.exists(out) else ''
if body != old: open(out, 'w', encoding='utf-8').write(body)
print(f'assistant guide: {len(places)} places from the menus, {len(text)} characters' + (' (updated)' if body != old else ''))
if missing:
    print('WARNING: the assistant knows nothing about these pages: ' + ', '.join(missing) +
          '. Describe them in tools/ishrah/assistant_guide.md (or add them to DETAIL in tools/ishrah/guide.py).')
    if '--strict' in sys.argv: sys.exit(1)
