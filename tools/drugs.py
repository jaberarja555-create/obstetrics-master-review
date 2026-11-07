"""Obstetric drugs section (owner, 7 Nov 2026: organise it better). Reads the drug tables from the current y0* pages once and
writes content/drugs.json (groups of drug monographs + the reference tables); then builds build/dr/units.json: one whole card
per drug (use, how it works, dose, side effects, cautions) under a band per group, then the reference tables.
  python3 tools/drugs.py extract   # only once, from the old table pages
  python3 tools/drugs.py           # units for tools/rapid_review/cards.js (DR=1)"""
import re, glob, json, os, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(R, 'tools'))
from merge_pieces import close_of
J = os.path.join(R, 'content/drugs.json')
if sys.argv[1:] == ['extract']:
    groups, refs, intro = [], [], ''
    for f in sorted(glob.glob(os.path.join(R, 'content/pages/*_y0*.html'))):
        s = open(f, encoding='utf-8').read()
        m = re.search(r'<div class="lead">(.*?)</div>', s)
        if m: intro = m.group(1)
        for m in re.finditer(r'<div class="mb[^"]*">', s):
            box = s[m.start():close_of(s, m.start())]
            h = re.search(r'<div class="mh">(.*?)</div>', box)
            title = re.sub(r'\s*\(cont\.\)\s*$', '', h.group(1)) if h else None
            heads = re.findall(r'<th>(.*?)</th>', box)
            rows = [re.findall(r'<td[^>]*>(.*?)</td>', r, re.S) for r in re.findall(r'<tbody>(.*?)</tbody>', box, re.S)[0].split('</tr>')] if '<tbody>' in box else []
            rows = [r for r in rows if r]
            if len(heads) == 6:
                if title is None or (groups and re.sub('<[^>]+>', '', title) == re.sub('<[^>]+>', '', groups[-1]['title'])):
                    groups[-1]['drugs'] += rows
                else:
                    groups.append(dict(title=title, drugs=rows))
            else:
                body = box[box.index('<div class="mc">') + 16:close_of(box, box.index('<div class="mc">')) - 6]
                refs.append(dict(title=title, html=body))
    json.dump(dict(intro=intro, groups=groups, refs=refs), open(J, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(groups), 'groups,', sum(len(g['drugs']) for g in groups), 'drugs,', len(refs), 'tables')
    sys.exit()
D = json.load(open(J, encoding='utf-8'))
COL = [5, 2, 4, 6, 1, 3, 7]
units = {'intro': f'<div class="lead drl">{D["intro"]}</div>', 'groups': [], 'refs': []}
for gi, g in enumerate(D['groups']):
    c = COL[gi % len(COL)]; units['groups'].append([])
    band = f'<div class="dgb dgx c{c}"><span>{gi + 1}</span>{re.sub(r"<[^>]+>", "", g["title"])}</div>'
    for k, (name, use, how, dose, side, warn) in enumerate(g['drugs']):
        card = (f'<div class="dk dgx c{c}"><div class="dkh"><b>{name}</b><i>{how}</i></div>'
                f'<div class="dkg"><div class="dkf"><h5>Main use</h5>{use}</div><div class="dkf dkd"><h5>Dose · route · how long</h5>{dose}</div>'
                f'<div class="dkf"><h5>Side effects · monitor</h5>{side}</div><div class="dkf dkw"><h5>When · cautions</h5>{warn}</div></div></div>')
        units['groups'][-1].append((band if k == 0 else '') + card)
for r in D['refs']:
    units['refs'].append(f'<div class="mb drt"><div class="mh">{r["title"]}</div><div class="mc">{r["html"]}</div></div>')
json.dump(units, open(os.path.join(R, 'build/dr/units.json'), 'w', encoding='utf-8'), ensure_ascii=False)
print(len(units['groups']), 'groups,', sum(map(len, units['groups'])), 'cards,', len(units['refs']), 'tables')
