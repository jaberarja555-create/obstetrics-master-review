"""Write build/dr/pages.json (from DR=1 node tools/rapid_review/cards.js) into the Obstetric drugs pages (y0* files),
adding or removing pages so the counts match, and relabel them 'Obstetric drugs · i/N'."""
import json, glob, re, os, sys, subprocess, tempfile
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(R, 'tools'))
from merge_pieces import close_of
P = json.load(open(os.path.join(R, 'build/dr/pages.json')))
files = lambda: sorted(f for f in glob.glob(os.path.join(R, 'content/pages/*_y*_dr*.html')) if 'drcover' not in f)
name = lambda f: re.match(r'\d+_(.+)\.html', os.path.basename(f)).group(1)
while len(files()) > len(P):
    subprocess.run(['python3', os.path.join(R, 'tools/delete_page.py'), name(files()[-1])], check=True)
while len(files()) < len(P):
    last = files()[-1]; k = len(files()) + 1; fid = 'y%02d_dr%d' % (k, k)
    s = open(last, encoding='utf-8').read()
    s = re.sub(r'(<section [^>]*id="p)\d+"', r'\g<1>{{NO}}"', s, count=1).replace(f'data-file="{name(last)}"', f'data-file="{fid}"', 1)
    s = re.sub(r'(<span class="hr">.*?<b>)\d+(</b></span>)', r'\g<1>{{NO}}\2', s, count=1, flags=re.S)
    tmp = tempfile.NamedTemporaryFile('w', suffix='.html', delete=False, encoding='utf-8'); tmp.write(s); tmp.close()
    subprocess.run(['python3', os.path.join(R, 'tools/insert_page.py'), name(last), fid, 'Obstetric drugs', tmp.name], check=True)
for f, h in zip(files(), P):
    s = open(f, encoding='utf-8').read(); m = re.search(r'<div class="main mzm[^"]*"[^>]*>', s); e = close_of(s, m.start())
    open(f, 'w', encoding='utf-8').write(s[:m.end()] + h + s[e - 6:])
meta = json.load(open(os.path.join(R, 'content/meta.json')))
ys = [p for p in meta['pages'] if re.match(r'y\d+.*_dr', p['f']) and 'drcover' not in p['f']]
for i, p in enumerate(ys): p['label'] = f'Obstetric drugs · {i + 1}/{len(ys)}'
json.dump(meta, open(os.path.join(R, 'content/meta.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(ys), 'drug pages')
