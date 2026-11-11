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
P = m.get('QS', {}); seen = set()
for ch in Q:
    for q in ch['questions']:
        its = [(q['id'] + '#%d' % i, it) for i, it in enumerate(q['items'])] if q['type'] == 'emq' else [(q['id'], q)]
        for qid, it in its:
            p = P.get(qid)
            if not p: continue
            seen.add(qid)
            for f in ('stem', 'q', 'why', 'd'):
                if f in p: it[f] = p[f]
            if 'options' in p: assert len(p['options']) == len(it['options']); it['options'] = p['options']
print('questions patched', len(seen), 'unknown ids', sorted(set(P) - seen))
json.dump(D, open(R + '/decks.json', 'w'), ensure_ascii=False, indent=1)
json.dump(Q, open(R + '/qbank.json', 'w'), ensure_ascii=False, indent=1)
