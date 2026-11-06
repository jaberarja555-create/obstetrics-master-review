"""Rewrite the page numbers on the contents page (topic tiles, chapter bands, Rapid review, drugs) from content/meta.json."""
import os, re, json, glob
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
m = json.load(open(os.path.join(R, 'content/meta.json'), encoding='utf-8'))
fs = [p['f'] for p in m['pages']]
first = {}
for i, f in enumerate(fs):
    t = re.sub(r'\d+$', '', f.split('_', 1)[1]) if f.startswith('c') else f[:2]
    first.setdefault(t, i + 1)
P = {t['no']: first.get(t['id'], t['p']) for t in m['topics'] if t.get('no')}
for t in m['topics']:
    if t['id'] in first: t['p'] = first[t['id']]
json.dump(m, open(os.path.join(R, 'content/meta.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
P['RR'], P['Rx'] = first['x9'], first['y0']
f = glob.glob(os.path.join(R, 'content/pages/*_a01_contents.html'))[0]; s = open(f, encoding='utf-8').read()
s = re.sub(r'<div class="tc-t" data-p="\d+"><i>([^<]+)</i>(.*?)<em>\d+</em>', lambda x: f'<div class="tc-t" data-p="{P[x.group(1)]}"><i>{x.group(1)}</i>{x.group(2)}<em>{P[x.group(1)]}</em>', s)
bands = list(re.finditer(r'<div class="tc-b" data-p="\d+"(.*?)<span class="mt">(\d+) topics · p \d+–\d+</span>', s))
starts = []
for b in bands:
    seg = s[b.end():]; no = re.search(r'<i>(\d+\.\d+)</i>', seg).group(1); starts.append(P[no])
ends = [x - 1 for x in starts[1:]] + [P['RR'] - 1]
for b, a, e in reversed(list(zip(bands, starts, ends))):
    s = s[:b.start()] + f'<div class="tc-b" data-p="{a}"{b.group(1)}<span class="mt">{b.group(2)} topics · p {a}–{e}</span>' + s[b.end():]
open(f, 'w', encoding='utf-8').write(s)
print('contents updated')
