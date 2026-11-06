"""Add one empty page after the last page of each named topic (the blocks are then re-shared by tools/rebalance.py)."""
import os, re, sys, glob, json, subprocess, tempfile
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(R, 'content', 'pages')
for t in sys.argv[1:]:
    files = sorted(glob.glob(os.path.join(P, '*.html')))
    if t == 'x9':
        mine = [f for f in files if re.search(r'_x9\d+_rr\d+\.html$', f)]
        last = mine[-1]; name = re.match(r'\d+_(.+)\.html', os.path.basename(last)).group(1)
        k = len(mine) + 1; fid = 'x9%02d_rr%d' % (k, k)
    else:
        mine = [f for f in files if re.search(r'_c\d+s\d+p\d+(x\d+)?_' + t + r'\d+\.html$', f)]
        last = mine[-1]; name = re.match(r'\d+_(.+)\.html', os.path.basename(last)).group(1)
        m = re.match(r'(c\d+s\d+p\d+)(?:x(\d+))?_(.+)', name)
        fid = f'{m.group(1)}x{int(m.group(2) or 1) + 1}_{m.group(3)}'
    s = open(last, encoding='utf-8').read()
    s = re.sub(r'(<section [^>]*id="p)\d+"', r'\g<1>{{NO}}"', s, count=1)
    s = s.replace(f'data-file="{name}"', f'data-file="{fid}"', 1)
    s = re.sub(r'(<span class="hr">.*?<b>)\d+(</b></span>)', r'\g<1>{{NO}}\2', s, count=1, flags=re.S)
    s = re.sub(r'<div class="body">.*(?=<div class="ftr">)', '<div class="body"><div class="main mzm"></div></div>', s, count=1, flags=re.S)
    meta = json.load(open(os.path.join(R, 'content/meta.json')))
    lab = next(p['label'] for p in meta['pages'] if p['f'] == name)
    tmp = tempfile.NamedTemporaryFile('w', suffix='.html', delete=False, encoding='utf-8'); tmp.write(s); tmp.close()
    subprocess.run(['python3', os.path.join(R, 'tools/insert_page.py'), name, fid, lab, tmp.name], check=True)
    meta = json.load(open(os.path.join(R, 'content/meta.json')))
    for p in meta['pages']:
        if p['f'] == fid: p['t'] = t if t != 'x9' else p.get('t', '')
    json.dump(meta, open(os.path.join(R, 'content/meta.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
