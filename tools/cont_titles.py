"""A section that continues from the previous page repeats its title in a slim style (div.mh.mhc, no "continued").
Covers pieces made by paginate.py (id ending .N) and older pieces that open a page without a title. Safe to re-run."""
import re, glob, os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files = sorted(glob.glob(os.path.join(R, 'content/pages/*.html')))
titles = {}
for f in files:
    for m in re.finditer(r'<div class="blk" data-id="([^"]+)"[^>]*><div class="mrow[^"]*"><div class="mb[^"]*"><div class="mh">(.*?)</div>', open(f, encoding='utf-8').read()):
        titles.setdefault(m.group(1).split('~')[0], m.group(2))
last, n = {}, 0
for f in files:
    s = open(f, encoding='utf-8').read(); fid = re.match(r'\d+_(.+)\.html', os.path.basename(f)).group(1)
    if not fid.startswith('c'): continue
    topic = re.sub(r'\d+$', '', fid.split('_', 1)[1])
    def frag(m):
        global n
        t = titles.get(m.group(1).split('~')[0].rsplit('.', 1)[0])
        if not t: return m.group(0)
        n += 1; return m.group(0) + f'<div class="mh mhc">{t}</div>'
    s = re.sub(r'<div class="blk" data-id="([^"]+\.\d+)"[^>]*><div class="mrow[^"]*"><div class="mb[^"]*">(?!<div class="mh)', frag, s)
    m = re.search(r'<div class="main mzm[^"]*"[^>]*>(?:<h1.*?</h1>)?(?:<p class="lead".*?</p>)?(<div class="blk" data-id="[^"]+"[^>]*><div class="mrow[^"]*"><div class="mb([^"]*)">)(?!<div class="mh)', s)
    if m and 'bare' not in m.group(2) and topic in last:
        t = 'Key numbers' if 'nums' in m.group(2) else last[topic]
        s = s[:m.end(1)] + f'<div class="mh mhc">{t}</div>' + s[m.end(1):]; n += 1
    for h in re.findall(r'<div class="mh(?: mhc)?">(.*?)</div>', s):
        if h != 'Key numbers': last[topic] = h
    open(f, 'w', encoding='utf-8').write(s)
print(n, 'continued sections titled')
