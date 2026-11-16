"""Pictures on new-design pages (owner, 16 Nov 2026: "most of the pictures look small and their area is not well organised"):
every floated or side picture becomes a full-width picture row (figure.bf.frow): the pictures enlarged to one height (H px) and
centred, the caption in a column beside them, on a light chapter-tint panel; a floated picture moves after the text it was beside.
Labels on pictures (.lbw) keep their places (they are set in %). Run on each rebuilt chapter, then re-plan its pages."""
import re, glob
H, AREA = 250, 520      # picture height, width available for the pictures beside a 200 px caption
def scale(fig):
    fps = re.search(r'<div class="fps">(.*)</div><figcaption', fig, re.S)
    if not fps: return fig
    inner = fps.group(1)
    sizes = [(float(w), float(h)) for w, h in re.findall(r'(?:<div class="lbw" style="|<img [^>]*style=")width:([\d.]+)px;height:([\d.]+)px', inner)]
    if not sizes: return fig
    k = H / max(h for w, h in sizes)
    tot = sum(w for w, h in sizes) * k + 8 * (len(sizes) - 1)
    if tot > AREA: k *= AREA / tot
    inner2 = re.sub(r'((?:<div class="lbw" style="|<img [^>]*style=")width:)([\d.]+)px;height:([\d.]+)px',
                    lambda m: f'{m.group(1)}{float(m.group(2)) * k:.0f}px;height:{float(m.group(3)) * k:.0f}px', inner)
    fig = fig.replace(inner, inner2, 1)
    fig = re.sub(r'<figure class="bf (?:float sm|float|side|frow)"[^>]*>', '<figure class="bf frow">', fig, count=1)
    return fig
n = 0
for f in sorted(glob.glob('content/pages/*.html')):
    s = open(f).read()
    if ' nd"' not in s: continue
    t = re.sub(r'<figure class="bf (?:float sm|float|side|frow)"[^>]*>.*?</figure>', lambda m: scale(m.group(0)), s, flags=re.S)
    # a floated picture inside .fwrap goes after the text it was beside
    t = re.sub(r'<div class="fwrap">\s*(<figure class="bf frow">.*?</figure>)(.*?)</div>(?=</div></div>)',
               lambda m: '<div class="fwrap">' + m.group(2) + m.group(1) + '</div>', t, flags=re.S)
    if t != s: open(f, 'w').write(t); n += 1
print('pages changed', n)
