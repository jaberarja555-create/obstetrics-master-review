"""Match the number of Rapid Review pages (x9…) to build/rr/pages.json, write them, relabel them and refresh the contents
and the Rapid Review cover. Run after tools/rapid_review/cards.py and cards.js (owner, 16 Nov 2026)."""
import json, glob, re, subprocess, os
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(R)
need = len(json.load(open('build/rr/pages.json')))
rr = lambda: sorted(f for f in glob.glob('content/pages/*_x9*_rr*.html') if 'rrcover' not in f)
while len(rr()) < need: subprocess.run(['python3', 'tools/grow_topics.py', 'x9'], check=True)
while len(rr()) > need:
    fid = re.match(r'\d+_(.+)\.html', os.path.basename(rr()[-1])).group(1); subprocess.run(['python3', 'tools/delete_page.py', fid], check=True)
subprocess.run(['python3', 'tools/rapid_review/write.py'], check=True)
meta = json.load(open('content/meta.json')); k = 0
for p in meta['pages']:
    if re.match(r'x9\d+_rr\d+$', p['f']): k += 1; p['label'] = f'Rapid review · {k}/{need}'
json.dump(meta, open('content/meta.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for t in ('tools/fix_contents.py', 'tools/poster_pages.py'):
    if os.path.exists(t): subprocess.run(['python3', t])
print('rapid review pages', need)
