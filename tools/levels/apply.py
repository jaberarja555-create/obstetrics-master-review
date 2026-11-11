#!/usr/bin/env python3
"""Apply a chapter's rewritten flashcards and questions (owner, 11 Nov 2026: clean student-level wording, standard medical
language, three levels: 1 easy, 2 medium, 3 hard).  python3 tools/levels/apply.py tools/levels/ch1.py
The chapter file defines CARDS = {deck id: [(old index or None, section, question, answer, level), ...]} and
QS = {question id (EMQ item: 'id#k'): {'d': level, optional 'stem', 'q', 'why', 'options'}}.
A card keeps the key of its old wording (5th field), so what a student already marked as known stays known."""
import json, sys, runpy, os
R = os.path.join(os.path.dirname(__file__), '..', '..', 'content')
def h(s):
    x = 0
    for ch in s:
        for u in ([ord(ch)] if ord(ch) < 65536 else [0xD800 + ((ord(ch) - 0x10000) >> 10), 0xDC00 + ((ord(ch) - 0x10000) & 0x3FF)]):
            x = (x * 31 + u) & 0xFFFFFFFF
    d = '0123456789abcdefghijklmnopqrstuvwxyz'; o = ''
    while True:
        o = d[x % 36] + o; x //= 36
        if not x: return o
m = runpy.run_path(sys.argv[1])
D = json.load(open(R + '/decks.json')); Q = json.load(open(R + '/qbank.json'))
for k, cards in m.get('CARDS', {}).items():
    old = D[k]['cards']; new = []
    if any(len(c) > 3 for c in old): print(k, 'already done, skipped'); continue
    for oi, sec, q, a, lv in cards:
        assert lv in (1, 2, 3)
        new.append([sec, q, a, lv] + ([h(old[oi][1])] if oi is not None else []))
    print(k, len(old), '->', len(new)); D[k]['cards'] = new
# CLV = {deck id: 'one digit per card'}: level 1-3, or 0 to drop a card that repeats another; the wording is normalised by clean.py
for k, digits in m.get('CLV', {}).items():
    old = D[k]['cards']
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import clean as _cl
    if any(len(c) > 3 for c in old):   # done before: only bring the wording up to the current clean.py rules
        D[k]['cards'] = [[c[0], _cl.clean(c[1]), _cl.clean(c[2])] + c[3:] for c in old]; print(k, 're-cleaned'); continue
    assert len(digits) == len(old), (k, len(digits), len(old))
    from_clean = __import__('importlib').import_module('clean').clean if False else None
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import clean as _cl
    D[k]['cards'] = [[c[0], _cl.clean(c[1]), _cl.clean(c[2]), int(x), h(c[1])] for c, x in zip(old, digits) if x != '0']
    print(k, len(old), '->', len(D[k]['cards']))
P = dict(m.get('QS', {})); seen = set()
# LV = {question id: level}: questions whose wording is only normalised by clean.py (shorthand written out), with the level given by hand
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from clean import clean
LV = m.get('LV', {})
for qid, d in LV.items():
    if qid not in P: P[qid] = {'d': d, '_auto': 1}
for ch in Q:
    for q in ch['questions']:
        its = [(q['id'] + '#%d' % i, it) for i, it in enumerate(q['items'])] if q['type'] == 'emq' else [(q['id'], q)]
        for qid, it in its:
            p = P.get(qid)
            if not p: continue
            seen.add(qid)
            for f in ('stem', 'q', 'why', 'd'):
                if f in p: it[f] = p[f]
            if p.get('_auto'):   # clean() gives the same text when run again
                it.pop('_c', None)
                for f in ('stem', 'q', 'why'):
                    if f in it: it[f] = clean(it[f])
            if 'options' in p: assert len(p['options']) == len(it['options']); it['options'] = p['options']
print('questions patched', len(seen), 'unknown ids', sorted(set(P) - seen))
json.dump(D, open(R + '/decks.json', 'w'), ensure_ascii=False, indent=1)
json.dump(Q, open(R + '/qbank.json', 'w'), ensure_ascii=False, indent=1)
