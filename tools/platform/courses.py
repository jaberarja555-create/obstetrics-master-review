#!/usr/bin/env python3
"""اشرح لي (platform): course data read from the three books (owner, 17 Nov 2026: real content only).
Writes platform/js/courses.js (chapters, topics, real card and question counts per topic) and copies each chapter's
picture to platform/img/ch/<book>-<n>.webp. Run from the obstetrics repo with the Surgery and Pediatrics repos beside it:
    python3 tools/platform/courses.py
"""
import json, re, os, sys
from pathlib import Path
from PIL import Image

OBS = Path(__file__).resolve().parents[2]
ROOT = OBS.parent
SRG = ROOT / 'surgery-rapid-review'
PED = ROOT / 'pediatrics-master-review'
OUT = OBS / 'platform'
IMG = OUT / 'img' / 'ch'
IMG.mkdir(parents=True, exist_ok=True)


def pic(src, name):
    """chapter picture → 640 px WebP (the courses are cards and banners, never full size)"""
    if not src or not Path(src).exists():
        return None
    dst = IMG / f'{name}.webp'
    if not dst.exists() or dst.stat().st_mtime < Path(src).stat().st_mtime:
        im = Image.open(src).convert('RGB')
        im.thumbnail((640, 640))
        im.save(dst, 'WEBP', quality=72, method=6)
    return f'img/ch/{name}.webp'


def plain(s):
    return re.sub(r'<[^>]+>', '', s or '').strip()


def book_json(repo, bid, qdir, ddir):
    b = json.loads((repo / 'content' / 'book.json').read_text())
    chs = []
    for c in b['chapters']:
        if c.get('edition', 1) != 1:
            continue
        tps = []
        for t in c.get('topics', []):
            tf = repo / 'content' / 'topics' / f"{t['id']}.html"
            if not tf.exists() or t['id'] == 'drugs':
                continue
            nc = nq = 0
            df = repo / 'content' / ddir / f"{t['id']}.json"
            if df.exists():
                d = json.loads(df.read_text())
                nc = len(d['cards'] if isinstance(d, dict) and 'cards' in d else d)
            qf = repo / 'content' / qdir / f"{t['id']}.json"
            if qf.exists():
                nq = len(json.loads(qf.read_text()))
            tps.append({'id': t['id'], 'no': t.get('no', ''), 'title': plain(t['title']), 'sub': plain(t.get('sub', '')), 'cards': nc, 'qs': nq})
        if not tps:
            continue
        chs.append({'n': c['no'], 'title': plain(c['title']), 'part': c.get('part', ''), 'color': c.get('color', ''),
                    'img': pic(repo / 'content' / 'img' / f"chcover_{c['no']}.jpg", f"{bid}-{c['no']}"), 'topics': tps})
    free = (b.get('access') or {}).get('free_topics') or []
    return chs, free


def obstetrics():
    m = json.loads((OBS / 'content' / 'meta.json').read_text())
    decks = json.loads((OBS / 'content' / 'decks.json').read_text())
    qb = json.loads((OBS / 'content' / 'qbank.json').read_text())
    qn = {}
    for ch in qb:
        for q in ch['questions']:
            qn[q.get('topic')] = qn.get(q.get('topic'), 0) + 1
    chs = []
    for c in m['chapters']:
        tps = [{'id': t['id'], 'no': t['no'], 'title': plain(t['title']), 'sub': plain(t.get('sub', '')),
                'cards': len((decks.get(t['id']) or {}).get('cards', [])), 'qs': qn.get(t['id'], 0)}
               for t in m['topics'] if t.get('ch') == c['n']]
        if not tps:
            continue
        src = OBS / 'assets' / 'img' / f"chcov{c['n']}.jpg"
        chs.append({'n': c['n'], 'title': plain(c['name']), 'part': '', 'color': '', 'img': pic(src, f"obstetrics-{c['n']}"), 'topics': tps})
    try:
        free = json.loads((OBS / 'content' / 'access.json').read_text())
        free = free.get('free', free) if isinstance(free, dict) else free
    except Exception:
        free = []
    return chs, free


out = {}
for bid, fn in (('surgery', lambda: book_json(SRG, 'surgery', 'qbank', 'decks')),
                ('pediatrics', lambda: book_json(PED, 'pediatrics', 'qbank', 'decks')),
                ('obstetrics', obstetrics)):
    chs, free = fn()
    nt = sum(len(c['topics']) for c in chs)
    out[bid] = {'chapters': chs, 'free': free if isinstance(free, list) else [],
                'n': {'ch': len(chs), 'topics': nt, 'cards': sum(t['cards'] for c in chs for t in c['topics']),
                      'qs': sum(t['qs'] for c in chs for t in c['topics'])}}
    print(bid, out[bid]['n'])

js = ('/* اشرح لي: the real contents of the books, made by tools/platform/courses.py from each book (do not edit by hand). */\n'
      'window.SMR = window.SMR || {};\nSMR.content = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
(OUT / 'js' / 'courses.js').write_text(js)
print('platform/js/courses.js', len(js) // 1024, 'KB')
