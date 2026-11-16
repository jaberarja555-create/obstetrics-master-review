"""New-design pages (owner, 16 Nov 2026: "some box has bad colours and background"): diagram boxes in the chapter colour only.
Dark or coloured boxes that hold text become a light chapter tint with a chapter-colour edge, warning/guide boxes become white with a
chapter-colour edge, and every label inside a box is black (sub-lines dark grey). Charts (bars, bands without text) are left as they are."""
import re, glob, sys
DARK = {'var(--ch-dark)', 'var(--ink)', '#1f4e8c', '#0f766e', 'var(--ch)', 'var(--ch-mid)', '#b91c1c', 'var(--trap)', 'var(--guide)'}
SOFT = {'var(--trap-bg)', 'var(--guide-bg)', '#faf8f4', '#fff', 'var(--ch-tint)', 'var(--ch-tint-2)'}
def num(t, k):
    m = re.search(r'\s%s="([-\d.]+)"' % k, t); return float(m.group(1)) if m else None
def fix_svg(svg):
    rects = [(m.start(), m.end(), m.group(0)) for m in re.finditer(r'<rect\b[^>]*>', svg)]
    texts = [(m.start(), m.end(), m.group(0)) for m in re.finditer(r'<text\b[^>]*>', svg)]
    boxes, edits = [], []
    for a, b, r in rects:
        fm = re.search(r'fill="([^"]+)"', r)
        x, y, w, h = num(r, 'x') or 0, num(r, 'y') or 0, num(r, 'width'), num(r, 'height')
        if not fm or w is None or h is None or w < 30 or h < 16: continue
        inside = [t for t in texts if (lambda tx, ty: tx is not None and ty is not None and x <= tx <= x + w and y <= ty <= y + h)(num(t[2], 'x'), num(t[2], 'y'))]
        if not inside: continue
        f = fm.group(1)
        if 'stroke=' not in r and f not in DARK: continue   # chart bands and plain backgrounds stay as they are
        if f in DARK: nf = 'var(--ch-tint)'
        elif f in SOFT and f not in ('#fff', 'var(--ch-tint)'): nf = '#fff'
        else: nf = f
        nr = re.sub(r'fill="[^"]+"', 'fill="%s"' % nf, r, count=1)
        nr = re.sub(r'stroke="[^"]+"', 'stroke="var(--ch)"', nr, count=1) if 'stroke=' in nr else nr.replace('<rect', '<rect stroke="var(--ch)" stroke-width="1.3"', 1)
        edits.append((a, b, nr)); boxes.append(inside)
    for inside in boxes:
        for a, b, t in inside:
            fw = re.search(r'font-weight="(\d+)"', t); bold = fw and int(fw.group(1)) >= 700
            nt = re.sub(r'fill="[^"]+"', 'fill="%s"' % ('#000' if bold else '#333'), t, count=1) if 'fill=' in t else t
            edits.append((a, b, nt))
    seen = {}
    for a, b, n in edits: seen[a] = (b, n)
    out, p = [], 0
    for a in sorted(seen):
        b, n = seen[a]; out.append(svg[p:a]); out.append(n); p = b
    out.append(svg[p:]); return ''.join(out)
ch = 0
for f in sorted(glob.glob('content/pages/*.html')):
    s = open(f).read()
    if ' nd"' not in s: continue
    t = re.sub(r'<svg\b.*?</svg>', lambda m: fix_svg(m.group(0)), s, flags=re.S)
    if t != s: open(f, 'w').write(t); ch += 1
print('pages changed', ch)
