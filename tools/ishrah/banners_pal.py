"""The owner's page banners in every app colour (owner, 21 Nov 2026: «match the bar for all color options»).
His pictures are maroon; for each other colour the maroon / wine pixels (red hue, some saturation) are turned to that colour's hue,
keeping their lightness, so the panel, waves and maroon books follow the app colour while gold, white text and the photo's other colours
stay. Writes ishrah/img/mr/ban/<key>[-m]-<pal>.webp for pal = blue (SMRA green), ocean, teal, purple, graphite; maroon uses the originals.
Run after changing the pictures:  python3 tools/ishrah/banners_pal.py"""
import os, glob
import numpy as np
from PIL import Image

D = os.path.join(os.path.dirname(__file__), '..', '..', 'ishrah', 'img', 'mr', 'ban')
# target hue (degrees) and saturation factor, as palettes.py MR (green base 168) but starting from maroon 343
PALS = {'blue': (168, 1.0), 'ocean': (212, 1.0), 'teal': (186, 1.0), 'purple': (265, 1.0), 'maroon': (343, .9), 'graphite': (None, .14)}
# the colour each picture was made in: (palette, its hue, the hue range turned); the six page banners are maroon, Clinical is blue
NATIVE = {'clinical': ('ocean', 212, (172, 255))}
DEFAULT = ('maroon', 343, None)


def rgb2hsv(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = a.max(-1); mn = a.min(-1); d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-6
    rm = m & (mx == r); gm = m & (mx == g) & ~rm; bm = m & ~rm & ~gm
    h[rm] = ((g - b)[rm] / d[rm]) % 6
    h[gm] = (b - r)[gm] / d[gm] + 2
    h[bm] = (r - g)[bm] / d[bm] + 4
    h = h * 60
    s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0)
    return h, s, mx


def hsv2rgb(h, s, v):
    c = v * s; hp = (h % 360) / 60; x = c * (1 - np.abs(hp % 2 - 1)); z = np.zeros_like(h)
    conds = [(hp < 1), (hp < 2), (hp < 3), (hp < 4), (hp < 5), (hp >= 5)]
    vals = [(c, x, z), (x, c, z), (z, c, x), (z, x, c), (x, z, c), (c, z, x)]
    r = np.select(conds, [v_[0] for v_ in vals]); g = np.select(conds, [v_[1] for v_ in vals]); b = np.select(conds, [v_[2] for v_ in vals])
    m = v - c
    return np.stack([r + m, g + m, b + m], -1)


def convert(im, hue, sf, src=343, rng=None):
    a = np.asarray(im.convert('RGB')).astype(np.float64) / 255
    h, s, v = rgb2hsv(a)
    # wine / maroon / pinkish-red: hue 300..360 or 0..20, saturation > .18; a soft edge on saturation so no hard borders
    redish = ((h >= 300) | (h <= 20)) if rng is None else ((h >= rng[0]) & (h <= rng[1]))
    w = np.clip((s - .14) / .12, 0, 1) * redish
    nh = h if hue is None else (h + (hue - src)) % 360
    ns = s * sf
    out = hsv2rgb(nh, ns, v)
    res = a * (1 - w[..., None]) + out * w[..., None]
    return Image.fromarray((np.clip(res, 0, 1) * 255).round().astype(np.uint8))


for f in sorted(glob.glob(os.path.join(D, '*.webp'))):
    base = os.path.basename(f)[:-5]
    if any(base.endswith('-' + p) for p in PALS):
        continue
    im = Image.open(f)
    nat, src, rng = NATIVE.get(base.replace('-m', ''), DEFAULT)
    for p, (hue, sf) in PALS.items():
        if p == nat: continue
        convert(im, hue, sf, src, rng).save(os.path.join(D, '%s-%s.webp' % (base, p)), quality=84, method=6)
    print('done', base)
