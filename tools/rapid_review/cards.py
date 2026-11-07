"""Rapid Review exam recap cards (owner, 7 Nov 2026, as in the Pediatrics and Surgery books): one card per topic, written in
content/rr/<topic id>.json ({"sc": [scenarios], "f": [[label, html], ...], "trap": html}). Writes build/rr/cards.json
(topic order, chapter, card html) and build/rr/chapters.json for tools/rapid_review/cards.js."""
import json, os
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
meta = json.load(open(os.path.join(R, 'content/meta.json')))
out = os.path.join(R, 'build/rr'); os.makedirs(out, exist_ok=True)
cards = []
for t in meta['topics']:
    f = os.path.join(R, 'content/rr', t['id'] + '.json')
    if not os.path.exists(f): continue
    d = json.load(open(f, encoding='utf-8'))
    sc = ''.join(f'<div>{x}</div>' for x in d.get('sc', []))
    fs = [x for x in d.get('f', []) if x[1]]
    cell = lambda lab, v, w='': f'<div class="rqf{" rqn" if lab == "Key numbers" else ""}{w}"><h5>{lab}</h5>{v}</div>'
    rows = ''.join('<div class="rqg">' + ''.join(cell(l, v, ' rqw' if len(fs[i:i + 2]) == 1 else '') for l, v in fs[i:i + 2]) + '</div>'
                   for i in range(0, len(fs), 2))
    trap = f'<div class="rqf rqt"><h5>Exam traps</h5>{d["trap"]}</div>' if d.get('trap') else ''
    cards.append(dict(ch=t['ch'], html=f'<div class="rvk rq c{t["ch"]}"><div class="rqh"><span class="rvn">{t["no"]}</span>{t["title"]}</div>'
                                         f'<div class="rqs">{sc}</div>{rows}{trap}</div>'))
chs = {}
for c in meta['chapters']:
    img = f'img/chcover_{c["n"]}.jpg'
    chs[c['n']] = dict(name=c['name'].replace('&', 'and'), img=img if os.path.exists(os.path.join(R, 'assets', img)) else c['img'])
json.dump(cards, open(os.path.join(out, 'cards.json'), 'w', encoding='utf-8'), ensure_ascii=False)
json.dump(chs, open(os.path.join(out, 'chapters.json'), 'w', encoding='utf-8'), ensure_ascii=False)
print(len(cards), 'cards')
