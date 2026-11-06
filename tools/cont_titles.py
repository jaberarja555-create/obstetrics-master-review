"""Owner (6 Nov 2026): a section that runs on to the next page does NOT repeat its title. This removes any slim
repeated titles (div.mh.mhc) left from earlier layouts. Safe to re-run."""
import re, glob, os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
n = 0
for f in sorted(glob.glob(os.path.join(R, 'content/pages/*.html'))):
    s = open(f, encoding='utf-8').read()
    t, k = re.subn(r'<div class="mh mhc">.*?</div>', '', s)
    if k: open(f, 'w', encoding='utf-8').write(t); n += k
print(n, 'repeated titles removed')
