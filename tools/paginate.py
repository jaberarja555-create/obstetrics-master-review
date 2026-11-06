"""Re-plan the pages of every topic (owner, Nov 2026: no congested pages, no big empty gaps).
A topic's sections are cut into atoms (whole boxes; for a titled section box: its paragraphs, lists, boxes, and the rows
of a long table). Atoms are laid on the fewest pages that keep KEEP px free at each foot, then shared so that the
pages are as evenly filled as possible (app fillPage then spreads the spare room inside the boxes).
Needs build/blocks.json from tools/measure_blocks.py run on the CURRENT pages.  --apply rewrites content/pages."""
import json, os, re, sys, glob, subprocess, tempfile
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEEP = int(os.environ.get('KEEP', 70)); MINF = 70; BUCKET = 25; ROOM = 1050
VOID = {'br', 'img', 'hr', 'input', 'meta', 'link', 'col', 'wbr', 'source', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'stop', 'use'}
SUBMIN = int(os.environ.get("SUBMIN", 140))
SUBS = set()
for _f in glob.glob(os.path.join(R, 'content/pages/*.html')):
    SUBS.update(re.findall(r'<div class="blk" data-id="([^"]+)"><h2 class="mzsub"', open(_f, encoding='utf-8').read()))

def close_of(s, a):
    d = 0
    for m in re.finditer(r'<(/?)([a-zA-Z][\w-]*)[^>]*?(/?)>', s[a:]):
        cl, tag, selfc = m.group(1), m.group(2).lower(), m.group(3)
        if tag in VOID or selfc:
            if d == 0: return a + m.end()
            continue
        d += -1 if cl else 1
        if d == 0: return a + m.end()
def children(s, a, b):
    out, i = [], a
    while i < b:
        j = s.find('<', i)
        if j < 0 or j >= b: break
        e = close_of(s, j); out.append((j, e)); i = e
    return out
def tkey(f):
    if f.startswith('x9'): return 'x9'
    return re.sub(r'\d+$', '', f.split('_', 1)[1]) if f.startswith('c') and '_' in f else None
F = json.load(open(os.path.join(R, 'build/blocks.json')))
files = {re.match(r'\d+_(.+)\.html', os.path.basename(f)).group(1): f for f in glob.glob(os.path.join(R, 'content/pages/*.html'))}
groups = []
for p in F:
    k = tkey(p['f'])
    if not k: continue
    if groups and groups[-1][0] == k: groups[-1][1].append(p)
    else: groups.append((k, [p]))

def atoms_of(pages):
    """atoms: dict(b=block no, h, kind 'blk'|'kid'|'row', kid, row, cutok=cut allowed AFTER this atom)"""
    A, B = [], []
    for pi, p in enumerate(pages):
        for bid, h, det in p['blocks']:
            b = len(B); B.append(dict(page=pi, bid=bid, h=h, det=det))
            kids = det['kids'] if det else None
            if not det or not det['mh'] or not kids or (len(kids) < 2 and not (kids[0]['tag'] == 'table' and len(kids[0].get('rows') or []) >= 4)):
                A.append(dict(b=b, h=h, kind='blk', sub=bid in SUBS)); continue
            B[b]['split'] = True
            for ki, kd in enumerate(kids):
                rows = kd.get('rows') or []
                if kd['tag'] == 'table' and len(rows) >= 4 and not kd.get('span'):
                    rest = kd['h'] - sum(rows) - kd['th']
                    for ri, rh in enumerate(rows):
                        A.append(dict(b=b, h=rh + (kd['th'] + rest if ri == 0 else 0), kind='row', kid=ki, row=ri, th=kd['th'] + rest, nrows=len(rows)))
                else:
                    A.append(dict(b=b, h=kd['h'], kind='kid', kid=ki, fl=kd['fl'], tag=kd['tag']))
    # where a page may break
    for i, a in enumerate(A):
        nx = A[i + 1] if i + 1 < len(A) else None
        if not nx or nx['b'] != a['b']: a['cut'] = True; continue
        ok = True
        if a['kind'] == 'kid' and (a.get('fl') or a.get('tag') in ('h3', 'h4', 'h5')): ok = False
        if a['kind'] == 'row' and nx['kind'] == 'row' and nx['kid'] == a['kid'] and (a['row'] < 1 or a['row'] > a['nrows'] - 3): ok = False
        if a['kind'] == 'kid' and nx['kind'] == 'row' and False: ok = False
        before = sum(x['h'] for x in A[:i + 1] if x['b'] == a['b']); after = sum(x['h'] for x in A[i + 1:] if x['b'] == a['b'])
        if before < MINF or after < MINF: ok = False
        a['cut'] = ok
    return A, B

def costs(A, B):
    n = len(A); C = [[None] * (n + 1) for _ in range(n + 1)]; SP = [[0] * (n + 1) for _ in range(n + 1)]
    for k in range(n):
        if k > 0 and not A[k - 1]['cut']: continue
        tot, seen, tabs, nsplit = 0, {}, set(), 0
        for i in range(k, n):
            a = A[i]; b = a['b']
            if a['kind'] != 'blk' and b not in seen:
                det = B[b]['det']; first_in = (A[i - 1]['b'] != b) if i > 0 else True
                tot += det['over'] - (0 if first_in else det['mhh']); seen[b] = 1
            if a['kind'] == 'row' and a['row'] > 0 and (b, a['kid']) not in tabs: tot += a['th']
            if a['kind'] == 'row': tabs.add((b, a['kid']))
            tot += a['h']
            if a['cut']:
                parts = sum(1 for bb in seen if not (A[k]['b'] != bb or (k == 0 or A[k - 1]['b'] != bb)) ) + (1 if a['kind'] != 'blk' and i + 1 < n and A[i + 1]['b'] == b else 0)
                C[k][i + 1] = tot; SP[k][i + 1] = parts
    return C, SP

def plan(pages):
    A, B = atoms_of(pages); C, SP = costs(A, B); n = len(A)
    rooms = [p['cap'] - p['fixed'] for p in pages]
    def room(j): return rooms[j] if j < len(rooms) else ROOM
    def subok(k, i):
        # a sub-heading (e.g. "Placenta Praevia") must not sit at the foot of a page with only a little under it
        if i >= n: return True
        s = max((x for x in range(k, i) if A[x].get('sub')), default=None)
        return s is None or sum(A[x]['h'] for x in range(s + 1, i)) >= SUBMIN
    def fits(j, k, i): c = C[k][i]; return subok(k, i) and c is not None and (c <= room(j) - KEEP or (i - k == 1) or c <= room(j) - 10 and all(x['kind'] == 'blk' for x in A[k:i]) and False)
    # fewest pages
    INF = 10**9; reach = {0: 0}; need = None
    best_n = None
    for npg in range(1, len(pages) + 4):
        dp = [None] * (n + 1); dp[0] = (0, 0); back = {}
        Dp = [[None] * (n + 1) for _ in range(npg + 1)]; Dp[0][0] = (0, 0)
        for j in range(1, npg + 1):
            for i in range(1, n + 1):
                bestv = None
                for k in range(0, i):
                    pv = Dp[j - 1][k]
                    if pv is None or C[k][i] is None or not fits(j - 1, k, i): continue
                    free = room(j - 1) - C[k][i]
                    v = (max(pv[0], -(-max(free, 0) // BUCKET)), pv[1] + SP[k][i])
                    if bestv is None or v < bestv: bestv = v; back[(j, i)] = k
                Dp[j][i] = bestv
        if Dp[npg][n] is not None: best_n = npg; break
    if best_n is None: return None
    out, i = [], n
    for j in range(best_n, 0, -1):
        k = back[(j, i)]; out.append((k, i)); i = k
    out.reverse()
    return A, B, out, [room(j) - C[k][i] for j, (k, i) in enumerate(out)]

def frag_html(B, A, idxs, src):
    """html of the atoms idxs (consecutive, same block)"""
    a0 = A[idxs[0]]; b = B[a0['b']]; s = src[b['page']]
    st = re.search(r'<div class="blk" data-id="' + re.escape(b['bid']) + r'"[^>]*>', s).start(); blk = s[st:close_of(s, st)]
    allidx = [i for i, a in enumerate(A) if a['b'] == a0['b']]
    if a0['kind'] == 'blk' or idxs == allidx: return blk
    mh = re.search(r'<div class="mh[^"]*"[^>]*>', blk); mhe = close_of(blk, mh.start())
    mc = re.search(r'<div class="mc"[^>]*>', blk); mce = close_of(blk, mc.start())
    kids = children(blk, mc.end(), mce - 6)
    first = idxs[0] == allidx[0]
    pre = blk[:mc.end()] if first else blk[:mh.start()] + blk[mh.start():mhe].replace('<div class="mh">', '<div class="mh mhc">', 1) + blk[mhe:mc.end()]
    if not first: pre = re.sub(r'^<div class="blk" data-id="([^"]*)"', lambda m: '<div class="blk" data-id="%s.%d"' % (m.group(1), idxs[0]), pre)
    body, i = '', 0
    while i < len(idxs):
        a = A[idxs[i]]; k0, k1 = kids[a['kid']]
        if a['kind'] == 'kid': body += blk[k0:k1]; i += 1; continue
        tbl = blk[k0:k1]; tb = re.search(r'<tbody>', tbl); tbe = close_of(tbl, tb.start()); trs = children(tbl, tb.end(), tbe - 8)
        rows = []
        while i < len(idxs) and A[idxs[i]]['kind'] == 'row' and A[idxs[i]]['kid'] == a['kid']: rows.append(A[idxs[i]]['row']); i += 1
        body += tbl[:tb.end()] + ''.join(tbl[trs[r][0]:trs[r][1]] for r in rows) + tbl[tbe - 8:]
    return pre + body + blk[mce - 6:]

def main():
    apply = '--apply' in sys.argv
    report = []; jobs = []
    only = os.environ.get('TOPICS', '').split()
    for k, pages in groups:
        if only and k not in only: continue
        r = plan(pages)
        if not r: print('no plan', k); continue
        A, B, out, frees = r
        report.append((k, len(pages), len(out), min(frees[:-1] or frees), max(frees[:-1] or [0]), frees[-1]))
        jobs.append((k, pages, A, B, out))
    for x in report: print('%-6s pages %2d -> %2d  free min %4d max %4d last %4d' % x)
    if not apply: return
    for k, pages, A, B, out in jobs:
        files = {re.match(r'\d+_(.+)\.html', os.path.basename(f)).group(1): f for f in glob.glob(os.path.join(R, 'content/pages/*.html'))}
        src = [open(files[p['f']], encoding='utf-8').read() for p in pages]
        htmls = []
        for (a, b) in out:
            h, i = '', a
            while i < b:
                j = i
                while j + 1 < b and A[j + 1]['b'] == A[i]['b']: j += 1
                h += frag_html(B, A, list(range(i, j + 1)), src); i = j + 1
            htmls.append(h)
        names = [p['f'] for p in pages]
        # page count
        while len(names) < len(out):
            subprocess.run(['python3', os.path.join(R, 'tools/grow_topics.py'), k], check=True, stdout=subprocess.DEVNULL)
            fl = {re.match(r'\d+_(.+)\.html', os.path.basename(f)).group(1): f for f in glob.glob(os.path.join(R, 'content/pages/*.html'))}
            names = [n for n in sorted(fl, key=lambda n: fl[n]) if tkey(n) == k]
        while len(names) > len(out):
            subprocess.run(['python3', os.path.join(R, 'tools/delete_page.py'), names[-1]], check=True, stdout=subprocess.DEVNULL); names.pop()
        fl = {re.match(r'\d+_(.+)\.html', os.path.basename(f)).group(1): f for f in glob.glob(os.path.join(R, 'content/pages/*.html'))}
        for j, (n, h) in enumerate(zip(names, htmls)):
            s = open(fl[n], encoding='utf-8').read()
            m = re.search(r'<div class="main mzm[^"]*"[^>]*>', s); e = close_of(s, m.start())
            inner = s[m.end():e - 6]
            fb = re.search(r'<div class="blk"', inner); fixed = inner[:fb.start()] if fb else inner
            s = s[:m.start()] + '<div class="main mzm">' + (fixed if j == 0 else '') + h + '</div>' + s[e:]
            open(fl[n], 'w', encoding='utf-8').write(s)
    subprocess.run(['python3', os.path.join(R, 'tools/fix_contents.py')], check=True)
    print('applied')
main()
