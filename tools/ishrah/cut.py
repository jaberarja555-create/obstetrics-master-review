#!/usr/bin/env python3
"""Cut the owner's 2x2 (or 1x2) subject collages into card pictures for اشرح لي.
   python3 tools/ishrah/cut.py <picture> <id top-left> <id top-right> [<id bottom-left> <id bottom-right>]
   Writes ishrah/img/sub_<id>.webp (720x450) and lists the ids in ishrah/js/subimg.js (cards use them when a subject has no uploaded picture)."""
import sys, os, re, json
from PIL import Image, ImageOps
src, ids = sys.argv[1], sys.argv[2:]
im = ImageOps.exif_transpose(Image.open(src)).convert('RGB'); W, H = im.size
rows = 2 if len(ids) == 4 else 1
def gaps(n, size, axis):
    # find the light dividing band nearest each expected cut
    px = im.load(); cuts = []
    for k in range(1, n):
        best, bv = int(size * k / n), -1
        for c in range(int(size * (k / n - .06)), int(size * (k / n + .06))):
            step = max(1, (H if axis == 'x' else W) // 120)
            v = sum(sum(px[c, t] if axis == 'x' else px[t, c]) for t in range(0, (H if axis == 'x' else W), step))
            if v > bv: bv, best = v, c
        cuts.append(best)
    return [0] + cuts + [size]
xs, ys = gaps(2, W, 'x'), gaps(rows, H, 'y')
root = os.path.join(os.path.dirname(__file__), '..', '..', 'ishrah')
for n, i in enumerate(ids):
    r, c = divmod(n, 2); box = (xs[c] + 10, ys[r] + 10, xs[c + 1] - 10, ys[r + 1] - 10)
    p = im.crop(box); p = ImageOps.fit(p, (720, 450), Image.LANCZOS)
    p.save(os.path.join(root, 'img', 'sub_' + i + '.webp'), quality=84); print('saved sub_' + i + '.webp')
f = os.path.join(root, 'js', 'subimg.js'); have = []
if os.path.exists(f): have = json.loads(re.search(r'\[.*\]', open(f).read()).group(0))
have = sorted(set(have) | set(ids))
open(f, 'w').write('/* subjects that have a card picture img/sub_<id>.webp (written by tools/ishrah/cut.py) */\nwindow.ISH_SUBIMG = ' + json.dumps(have) + ';\n')
