"""Labels on pictures, new-design pages (owner, 16 Nov 2026: "the label line covers the finding; no need to repeat the same label"):
a pointer line stops about GAP px before the finding (no dot on it), and a label written twice on one picture is kept once with a line
to each finding. Idempotent: lines already shortened are left alone (marked data-s)."""
import re, glob, math
GAP = 9
def fix(lbw):
    m = re.match(r'<div class="lbw" style="width:([\d.]+)px;height:([\d.]+)px">', lbw)
    if not m or 'data-s="1"' in lbw: return lbw
    W, H = float(m.group(1)), float(m.group(2))
    labs = re.findall(r'<span class="lbt" style="left:([\d.]+)%;top:([\d.]+)%">(.*?)</span>(?=<span class="lbt"|</div>)', lbw)
    pts = re.findall(r'<line class="o" x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"/>', lbw)
    if not pts: return lbw
    keyof = lambda x, y: next((re.sub(r'<[^>]+>', '', l[2]).strip().lower() for l in labs if abs(float(l[0]) - x) < .6 and abs(float(l[1]) - y) < .6), None)
    groups = {}
    for (x1, y1, x2, y2) in pts:
        k = keyof(float(x1), float(y1))
        if k: groups.setdefault(k, []).append((float(x1), float(y1)))
    pos = {k: (sum(a for a, b in v) / len(v), sum(b for a, b in v) / len(v)) for k, v in groups.items()}   # one label midway
    lines = []
    for (x1, y1, x2, y2) in pts:
        x1, y1, x2, y2 = map(float, (x1, y1, x2, y2))
        k = keyof(x1, y1)
        if k and len(groups[k]) > 1: x1, y1 = pos[k]
        dx, dy = (x2 - x1) * W / 100, (y2 - y1) * H / 100; d = math.hypot(dx, dy)
        f = max(0, (d - GAP) / d) if d else 1
        lines.append((x1, y1, x1 + (x2 - x1) * f, y1 + (y2 - y1) * f))
    svg = ''.join(f'<line class="{c}" x1="{a:.1f}" y1="{b:.1f}" x2="{x:.1f}" y2="{y:.1f}"/>' for a, b, x, y in lines for c in ('o', 'i'))
    out = re.sub(r'(<svg class="lbs"[^>]*>).*?(</svg>)', lambda q: q.group(1) + svg + q.group(2), lbw, count=1, flags=re.S)
    seen = set()
    def one(q):
        k = re.sub(r'<[^>]+>', '', q.group(3)).strip().lower()
        if k in seen: return ''
        seen.add(k)
        if k in pos and len(groups.get(k, [])) > 1:
            return f'<span class="lbt" style="left:{pos[k][0]:.1f}%;top:{pos[k][1]:.1f}%">{q.group(3)}</span>'
        return q.group(0)
    out = re.sub(r'<span class="lbt" style="left:([\d.]+)%;top:([\d.]+)%">(.*?)</span>(?=<span class="lbt"|</div>)', one, out)
    return out.replace('<div class="lbw" ', '<div class="lbw" data-s="1" ', 1)
n = 0
for f in sorted(glob.glob('content/pages/*.html')):
    s = open(f).read()
    if ' nd"' not in s: continue
    t = re.sub(r'<div class="lbw" style="[^"]*">.*?</svg>(?:<span class="lbt".*?</span>)*</div>', lambda m: fix(m.group(0)), s, flags=re.S)
    if t != s: open(f, 'w').write(t); n += 1
print('pages changed', n)

# keep every label inside its picture and clear of the a/b/c tile in the top-left corner (owner, 16 Nov 2026)
def clamp(lbw):
    m = re.search(r'style="width:([\d.]+)px;height:([\d.]+)px"', lbw)
    if not m: return lbw
    W, H = float(m.group(1)), float(m.group(2)); tile = '<span class="fk">' in lbw or True
    def one(q):
        x, y, txt = float(q.group(1)), float(q.group(2)), re.sub(r'<[^>]+>', '', q.group(3))
        lw = min(len(txt) * 7.4 + 14, 160, W - 6); lines = max(1, math.ceil((len(txt) * 7.4 + 14) / lw)); lh = 17 * lines
        hx, hy = (lw / 2 + 3) / W * 100, (lh / 2 + 3) / H * 100
        x = min(max(x, hx), 100 - hx); y = min(max(y, hy), 100 - hy)
        if (x - hx) * W / 100 < 30 and (y - hy) * H / 100 < 28: x = (30 + lw / 2) / W * 100   # clear of the corner tile
        moved.append((float(q.group(1)), float(q.group(2)), x, y))
        return f'<span class="lbt" style="left:{x:.1f}%;top:{y:.1f}%">{q.group(3)}</span>'
    moved = []
    out = re.sub(r'<span class="lbt" style="left:([\d.]+)%;top:([\d.]+)%">(.*?)</span>(?=<span class="lbt"|</div>)', one, lbw)
    def ln(q):   # a pointer line starts where its label now is
        x1, y1 = float(q.group(2)), float(q.group(3))
        for a, b, x, y in moved:
            if abs(a - x1) < .6 and abs(b - y1) < .6: x1, y1 = x, y
        return f'{q.group(1)}x1="{x1:.1f}" y1="{y1:.1f}"'
    return re.sub(r'(<line class="[oi]" )x1="([\d.]+)" y1="([\d.]+)"', ln, out)
for f in sorted(glob.glob('content/pages/*.html')):
    s = open(f).read()
    if ' nd"' not in s: continue
    t = re.sub(r'<div class="lbw"[^>]*>.*?</svg>(?:<span class="lbt".*?</span>)*</div>', lambda m: clamp(m.group(0)), s, flags=re.S)
    if t != s: open(f, 'w').write(t)
