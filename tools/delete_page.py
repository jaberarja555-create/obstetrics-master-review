"""Remove a page from the book and renumber everything after it (reverse of insert_page.py).
   python3 tools/delete_page.py <file_id>"""
import os, re, sys, json, glob
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(R, 'content', 'pages')
fid = sys.argv[1]
files = sorted(glob.glob(os.path.join(P, '*.html')))
names = [re.match(r'(\d+)_(.+)\.html', os.path.basename(f)).group(2) for f in files]
pos = names.index(fid) + 1
def drop(n): n = int(n); return n - 1 if n > pos else n
os.remove(files[pos - 1])
for f in files[pos:]:
    no, name = re.match(r'(\d+)_(.+)\.html', os.path.basename(f)).groups()
    s = open(f, encoding='utf-8').read()
    s = re.sub(r'(<section [^>]*id="p)(\d+)"', lambda m: m.group(1) + str(drop(m.group(2))) + '"', s, count=1)
    s = re.sub(r'(<span class="hr">.*?<b>)(\d+)(</b></span>)', lambda m: m.group(1) + str(drop(m.group(2))) + m.group(3), s, count=1, flags=re.S)
    os.remove(f)
    open(os.path.join(P, '%03d_%s.html' % (int(no) - 1, name)), 'w', encoding='utf-8').write(s)
for f in glob.glob(os.path.join(P, '*_a01_contents.html')):
    s = open(f, encoding='utf-8').read()
    s = re.sub(r'data-p="(\d+)"', lambda m: 'data-p="%d"' % drop(m.group(1)), s)
    s = re.sub(r'<em>(\d+)</em>', lambda m: '<em>%d</em>' % drop(m.group(1)), s)
    s = re.sub(r'p (\d+)–(\d+)', lambda m: 'p %d–%d' % (drop(m.group(1)), drop(m.group(2))), s)
    open(f, 'w', encoding='utf-8').write(s)
mp = os.path.join(R, 'content', 'meta.json'); m = json.load(open(mp, encoding='utf-8'))
m['pages'] = [p for p in m['pages'] if p['f'] != fid]
for t in m['topics']:
    if t.get('p', 0) > pos: t['p'] -= 1
json.dump(m, open(mp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('deleted', fid, '· pages now', len(m['pages']))
