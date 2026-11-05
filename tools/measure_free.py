"""Free height (px, page units) at the foot of every book page, ignoring the extra 'vg' spacing. -> build/free.json"""
import json, os
from playwright.sync_api import sync_playwright
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS = r"""() => { const out = {};
 document.querySelectorAll('.pw section.page').forEach(c => {
   const m = c.querySelector('.mzm'); if (!m) return; const body = c.querySelector('.body');
   m.classList.remove('vg'); m.style.removeProperty('--vg');
   const kids = [...m.querySelectorAll(':scope > .blk > *, :scope > *:not(.blk)')].filter(e => e.getBoundingClientRect().height);
   if (!kids.length) return;
   const last = Math.max(...kids.map(e => e.getBoundingClientRect().bottom)), b = body.getBoundingClientRect();
   const sc = c.getBoundingClientRect().width / 816;
   out[c.dataset.file] = Math.round((b.bottom - last) / sc); });
 return out; }"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 900, 'height': 1200})
    pg.goto('file://' + os.path.join(R, 'build/review/index.html')); pg.wait_for_timeout(2000); pg.click('#tabs [data-go=reader]'); pg.wait_for_timeout(1500)
    F = pg.evaluate(JS); b.close()
json.dump(F, open(os.path.join(R, 'build/free.json'), 'w'), indent=0)
print(len(F), 'pages measured; tight (<20px):', sum(1 for v in F.values() if v < 20), '; overflow:', [k for k, v in F.items() if v < 0])
