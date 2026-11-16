"""Rapid Review exam recap cards (owner, 7 Nov 2026, as in the Pediatrics and Surgery books): one card per topic, written in
content/rr/<topic id>.json ({"sc": [scenarios], "f": [[label, html], ...], "trap": html}). Writes build/rr/cards.json
(topic order, chapter, card html) and build/rr/chapters.json for tools/rapid_review/cards.js."""
import json, os
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
meta = json.load(open(os.path.join(R, 'content/meta.json')))
out = os.path.join(R, 'build/rr'); os.makedirs(out, exist_ok=True)
import re
def items(h):
    """Split a field at the top-level " · " (not inside brackets): one fact per line."""
    out, depth, cur, i = [], 0, '', 0
    while i < len(h):
        c = h[i]
        if c in '([': depth += 1
        elif c in ')]': depth = max(0, depth - 1)
        if depth == 0 and h.startswith(' · ', i):
            out.append(cur.strip()); cur = ''; i += 3; continue
        cur += c; i += 1
    out.append(cur.strip()); return [x for x in out if x]
def li(x):
    x = re.sub(r'^((?:<[^>]+>)*)([a-z])', lambda m: m.group(1) + m.group(2).upper(), x)
    return f'<li>{x}</li>'
def rq3(t, d):
    """Units of a short-topic recap card: title + opening line (kept with what follows), each section's facts in pieces of
    up to 4 lines (a section may go on over the page), exam-scenario and exam-trap boxes inside their section."""
    c = t['ch']; U = [dict(g=1, h=f'<div class="rq3h c{c}"><span class="rvn">{t["no"]}</span><span class="rqht">{t["title"]}</span></div>'
                                  f'<div class="rq3lead c{c}">{d["lead"]}</div>')]
    for k, row in enumerate(d['f']):
        lab, v, cx = row[0], row[1], (row[2] if len(row) > 2 else {})
        it = items(v); ch = [it[i:i + 4] for i in range(0, len(it), 4)]
        if len(ch) > 1 and len(ch[-1]) < 2: lst = ch.pop(); ch[-1] += lst
        for j, part in enumerate(ch):
            ttl = f'<div class="rqst"><span class="rqsn">{k + 1}</span><span class="rqstt">{lab}</span></div>' if j == 0 else ''
            U.append(dict(g=0, h=f'<div class="rq3s c{c}{" rq3c" if j else ""}">{ttl}<ul>{"".join(li(x) for x in part)}</ul></div>'))
        for kind, sign, name in (('sc', '🩺', 'Exam scenario'), ('tr', '⚠️', 'Exam trap')):
            if cx.get(kind):
                L = cx[kind]
                U.append(dict(g=0, h=f'<div class="rq3x {kind} c{c}"><div class="rqch">{sign} {name}{"s" if len(L) > 1 else ""}</div><ul>{"".join(li(x) for x in L)}</ul></div>'))
    U[-1]['end'] = 1
    return U
cards = []
for t in meta['topics']:
    f = os.path.join(R, 'content/rr', t['id'] + '.json')
    if not os.path.exists(f): continue
    d = json.load(open(f, encoding='utf-8'))
    if d.get('lead'):   # owner, 16 Nov 2026: the Rapid Review as a short version of the topic (rq3 units that may run over pages)
        cards.append(dict(ch=t['ch'], units=rq3(t, d))); continue
    sc = ''.join(f'<div>{x}</div>' for x in d.get('sc', []))
    fs = [x for x in d.get('f', []) if x[1]]
    cell = lambda lab, v, w='': f'<div class="rqf{" rqn" if lab == "Key numbers" else ""}{w}"><h5>{lab}</h5>{v}</div>'
    rows = ''.join('<div class="rqg">' + ''.join(cell(l, v, ' rqw' if len(fs[i:i + 2]) == 1 else '') for l, v in fs[i:i + 2]) + '</div>'
                   for i in range(0, len(fs), 2))
    trap = f'<div class="rqf rqt"><h5>Exam traps</h5>{d["trap"]}</div>' if d.get('trap') else ''
    cards.append(dict(ch=t['ch'], units=[dict(g=0, h=f'<div class="rvk rq c{t["ch"]}"><div class="rqh"><span class="rvn">{t["no"]}</span>{t["title"]}</div>'
                                         f'<div class="rqs">{sc}</div>{rows}{trap}</div>')]))
chs = {}
for c in meta['chapters']:
    img = f'img/chcover_{c["n"]}.jpg'
    chs[c['n']] = dict(name=c['name'].replace('&', 'and'), img=img if os.path.exists(os.path.join(R, 'assets', img)) else c['img'])
json.dump(cards, open(os.path.join(out, 'cards.json'), 'w', encoding='utf-8'), ensure_ascii=False)
json.dump(chs, open(os.path.join(out, 'chapters.json'), 'w', encoding='utf-8'), ensure_ascii=False)
print(len(cards), 'cards')
