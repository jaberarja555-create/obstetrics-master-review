"""Read the Rapid Review pages (topic cards) back into build/rr/topics.json, then add each topic's Key numbers
(from the topic pages' Key numbers boxes, or from build/rr/keynums.json once those boxes are gone)."""
import re, glob, json, os, sys, html
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(R, 'tools'))
from merge_pieces import close_of
out = os.path.join(R, 'build/rr'); os.makedirs(out, exist_ok=True)
topics = []
for f in sorted(glob.glob(os.path.join(R, 'content/pages/*_x9*.html'))):
    s = open(f, encoding='utf-8').read()
    for m in re.finditer(r'<div class="rvk c(\d)[^"]*">', s):
        e = close_of(s, m.start()); card = s[m.start():e]
        h = re.search(r'<span class="rvn">(.*?)</span>', card)
        if h:
            a = card.index('<span class="rvt">'); name = card[a + 18:close_of(card, a) - 7]
        rows = []; i = 0
        while True:
            j = card.find('<div class="frow">', i)
            if j < 0: break
            k = close_of(card, j); rows.append(card[j:k]); i = k
        if h: topics.append(dict(ch=int(m.group(1)), no=h.group(1), name=name, rows=rows, nums=[]))
        else: topics[-1]['rows'] += rows
# key numbers per topic
meta = json.load(open(os.path.join(R, 'content/meta.json')))
no_of = {t['id']: t['no'] for t in meta['topics']}
kp = os.path.join(R, 'content/rr_keynums.json')
if os.path.exists(kp): K = json.load(open(kp))
else:
    K = {}
    for f in sorted(glob.glob(os.path.join(R, 'content/pages/*_c*.html'))):
        k = re.sub(r'\d+$', '', f.split('_', 2)[-1][:-5]); s = open(f, encoding='utf-8').read()
        for m in re.finditer(r'<div class="mb nums">', s):
            box = s[m.start():close_of(s, m.start())]
            K.setdefault(no_of.get(k, k), []).extend(re.findall(r'<tr><td class="v">(.*?)</td><td>(.*?)</td></tr>', box))
    json.dump(K, open(kp, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
for t in topics: t['nums'] = K.get(t['no'], [])
json.dump(topics, open(os.path.join(out, 'topics.json'), 'w', encoding='utf-8'), ensure_ascii=False)
print(len(topics), 'topics,', sum(len(t['rows']) for t in topics), 'rows,', sum(len(t['nums']) for t in topics), 'key numbers')
