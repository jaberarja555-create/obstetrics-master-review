#!/usr/bin/env python3
"""Give every file in ishrah/index.html its own version (a short hash of its content), so a phone downloads again only the files that
changed (owner, 21 Nov 2026: slow loading on weak networks after every update). Run before each release:
    python3 tools/ishrah/stamp.py
"""
import hashlib, os, re
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'ishrah')
idx = os.path.join(root, 'index.html')
html = open(idx, encoding='utf-8').read()
def h(path):
    p = os.path.join(root, path)
    return hashlib.md5(open(p, 'rb').read()).hexdigest()[:8] if os.path.exists(p) else None
def sub(m):
    path = m.group(1); v = h(path)
    return m.group(0) if not v else path + '?v=' + v
html = re.sub(r'((?:js|css)/[\w.-]+\.(?:js|css)|[\w.-]+\.(?:webmanifest|png))\?v=\w+', sub, html)
# the colour stylesheets are chosen in the page's head script: one version made from all of them
pal = hashlib.md5(b''.join(open(os.path.join(root, 'css', f), 'rb').read() for f in sorted(os.listdir(os.path.join(root, 'css'))) if f.startswith(('app', 'pal-')))).hexdigest()[:8]
html = re.sub(r"(\.css\?v=)\w+(\">'\);)", r'\g<1>' + pal + r'\2', html)
open(idx, 'w', encoding='utf-8').write(html)
print('stamped')
