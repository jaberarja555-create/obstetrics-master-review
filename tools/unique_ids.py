"""Give every block in the book its own data-id (pieces of one section that share an id get ~2, ~3 …), so the page tools can find each one."""
import re, glob, os, collections
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
seen = collections.Counter(); n = 0
for f in sorted(glob.glob(os.path.join(R, 'content/pages/*.html'))):
    s = open(f, encoding='utf-8').read()
    def rep(m):
        global n
        bid = m.group(1); seen[bid] += 1
        if seen[bid] == 1: return m.group(0)
        n += 1; return '<div class="blk" data-id="%s~%d"' % (bid, seen[bid])
    t = re.sub(r'<div class="blk" data-id="([^"]+)"', rep, s)
    if t != s: open(f, 'w', encoding='utf-8').write(t)
print(n, 'ids made unique')
