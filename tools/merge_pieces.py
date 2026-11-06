"""Join two pieces of the same section (id X and X~n) that ended up next to each other on one page.
A table cut across the two pieces becomes one table again (the repeated header is dropped)."""
import re, glob, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def close_of(s, a):
    tag = re.match(r'<(\w+)', s[a:]).group(1); d = 0; i = a
    pat = re.compile(r'<(/?)%s\b[^>]*?(/?)>' % tag)
    for m in pat.finditer(s, a):
        if m.group(2): continue
        d += -1 if m.group(1) else 1
        if d == 0: return m.end()
    raise ValueError

def mc_span(s, a, e):
    """inner span of the single .mc inside block s[a:e] (None if not exactly one .mb)"""
    if len(re.findall(r'<div class="mb[ "]', s[a:e])) != 1: return None
    m = re.search(r'<div class="mc">', s[a:e])
    if not m: return None
    st = a + m.start(); en = close_of(s, st)
    return st + len(m.group(0)), en - 6

def main():
  n = 0
  for f in sorted(glob.glob(os.path.join(R, 'content/pages/*.html'))):
      s = open(f, encoding='utf-8').read(); changed = False
      while True:
          blks = [(m.start(), m.group(1)) for m in re.finditer(r'<div class="blk" data-id="([^"]+)"', s)]
          done = True
          for (a1, i1), (a2, i2) in zip(blks, blks[1:]):
              if re.sub(r'[.~][0-9.~]+$', '', i1) != re.sub(r'[.~][0-9.~]+$', '', i2): continue
              e1 = close_of(s, a1)
              if e1 != a2: continue
              e2 = close_of(s, a2)
              m1 = mc_span(s, a1, e1); m2 = mc_span(s, a2, e2)
              if not m1 or not m2: continue
              x1 = s[m1[0]:m1[1]]; x2 = s[m2[0]:m2[1]]
              t = re.match(r'(<table class="([^"]+)">(?:<colgroup>.*?</colgroup>)?(?:<thead>.*?</thead>)?<tbody>)', x2, re.S)
              if t and x1.endswith('</tbody></table>'):
                  last = x1.rfind('<table class="%s">' % t.group(2))
                  if last >= 0 and x1[last:].startswith(t.group(1)):
                      x1 = x1[:-len('</tbody></table>')]; x2 = x2[len(t.group(1)):]
              s = s[:m1[0]] + x1 + x2 + s[m1[1]:a2] + s[e2:]
              n += 1; changed = True; done = False; break
          if done: break
      if changed: open(f, 'w', encoding='utf-8').write(s)
  print('joined', n)

BASE = lambda i: re.sub(r'[.~][0-9.~]+$', '', i)

def gather(topics):
  """move the next page's first piece of a section back onto the page holding its first part (before re-paginating)"""
  files = sorted(glob.glob(os.path.join(R, 'content/pages/*.html'))); moved = 0
  tk = lambda f: re.sub(r'\d+$', '', os.path.basename(f)[:-5].split('_', 2)[-1])
  for fa, fb in zip(files, files[1:]):
      if tk(fa) != tk(fb) or tk(fa) not in topics: continue
      while True:
          a = open(fa, encoding='utf-8').read(); b = open(fb, encoding='utf-8').read()
          ba = [(m.start(), m.group(1)) for m in re.finditer(r'<div class="blk" data-id="([^"]+)"', a)]
          bb = [(m.start(), m.group(1)) for m in re.finditer(r'<div class="blk" data-id="([^"]+)"', b)]
          if not ba or not bb or BASE(ba[-1][1]) != BASE(bb[0][1]): break
          ea = close_of(a, ba[-1][0]); eb = close_of(b, bb[0][0]); piece = b[bb[0][0]:eb]
          a = a[:ea] + piece + a[ea:]; b = b[:bb[0][0]] + b[eb:]
          open(fa, 'w', encoding='utf-8').write(a); open(fb, 'w', encoding='utf-8').write(b); moved += 1
  print('gathered', moved)

if __name__ == '__main__':
  if len(sys.argv) > 1: gather(set(sys.argv[1:]))
  main()
