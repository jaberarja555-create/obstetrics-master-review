"""Insert a new page into the book and renumber everything after it.
   python3 tools/insert_page.py <after_file> <new_file_id> <label> <section_html_file>
Shifts: page files (NNN_ prefix), section ids (pNNN), running-head numbers, meta.pages, topic start pages,
and every page link / number on the contents page."""
import os, re, sys, json, glob
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(R, 'content', 'pages')
after, fid, label, src = sys.argv[1:5]
files = sorted(glob.glob(os.path.join(P, '*.html')))
names = [re.match(r'(\d+)_(.+)\.html', os.path.basename(f)).group(2) for f in files]
pos = names.index(after) + 2            # new page number
def bump(n): n = int(n); return n + 1 if n >= pos else n
for f in reversed(files):
    no, name = re.match(r'(\d+)_(.+)\.html', os.path.basename(f)).groups()
    if int(no) < pos: continue
    s = open(f, encoding='utf-8').read()
    s = re.sub(r'(<section [^>]*id="p)(\d+)"', lambda m: m.group(1) + str(bump(m.group(2))) + '"', s, count=1)
    s = re.sub(r'(<span class="hr">.*?<b>)(\d+)(</b></span>)', lambda m: m.group(1) + str(bump(m.group(2))) + m.group(3), s, count=1, flags=re.S)
    if name.endswith('contents'):
        s = re.sub(r'data-p="(\d+)"', lambda m: 'data-p="%d"' % bump(m.group(1)), s)
        s = re.sub(r'<em>(\d+)</em>', lambda m: '<em>%d</em>' % bump(m.group(1)), s)
        s = re.sub(r'p (\d+)–(\d+)', lambda m: 'p %d–%d' % (bump(m.group(1)), bump(m.group(2))), s)
    os.remove(f)
    open(os.path.join(P, '%03d_%s.html' % (int(no) + 1, name)), 'w', encoding='utf-8').write(s)
sec = open(src, encoding='utf-8').read().replace('{{NO}}', str(pos))
open(os.path.join(P, '%03d_%s.html' % (pos, fid)), 'w', encoding='utf-8').write(sec)
mp = os.path.join(R, 'content', 'meta.json'); m = json.load(open(mp, encoding='utf-8'))
m['pages'].insert(pos - 1, {'label': label, 't': '', 'f': fid})
for t in m['topics']:
    if t.get('p', 0) >= pos: t['p'] += 1
json.dump(m, open(mp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('inserted', fid, 'as page', pos, '· pages now', len(m['pages']))
