// Node version of tools/measure_blocks.py (same measuring code; for machines without Python Playwright): -> build/blocks.json
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const R = path.resolve(__dirname, '..');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 900, height: 1200 } });
  await pg.goto('file://' + path.join(R, 'build/review/index.html')); await pg.waitForTimeout(2000);
  await pg.evaluate(() => { const t = document.querySelector('#tabs [data-go=reader]'); if (t) t.click(); }); await pg.waitForTimeout(1500);
  await pg.evaluate(() => Promise.all([...document.fonts].map(f => f.load().catch(() => 0))));
  const F = await pg.evaluate(() => { const out = [];
 document.querySelectorAll('.pw section.page').forEach(c => {
   const m = c.querySelector('.mzm'); if (!m || c.classList.contains('upage')) return; const body = c.querySelector('.body');
   m.classList.remove('vg'); m.style.removeProperty('--vg'); c.classList.remove('fill');
   const sc = c.getBoundingClientRect().width / 816, mt = m.getBoundingClientRect().top;
   let fixed = 0; const blocks = [];
   [...m.children].forEach(ch => {
     const kids = ch.classList.contains('blk') ? [...ch.children] : [ch];
     let h = 0; kids.forEach(k => { const r = k.getBoundingClientRect(); if (!r.height) return; h += r.height / sc + parseFloat(getComputedStyle(k).marginBottom || 0) + parseFloat(getComputedStyle(k).marginTop || 0); });
     if (!ch.classList.contains('blk')) { fixed += h; return; }
     const row = ch.children.length === 1 ? ch.children[0] : null, mbs = row ? row.querySelectorAll(':scope > .mb') : [];
     let det = null;
     if (row && row.classList.contains('mrow') && mbs.length === 1) {
       const mc = mbs[0].querySelector(':scope > .mc');
       if (mc) { const kids = [...mc.children].map(k => { const r = k.getBoundingClientRect(), cs = getComputedStyle(k);
           const o = {tag: k.tagName.toLowerCase(), cls: k.className || '', h: Math.round(r.height / sc + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom)), fl: cs.float !== 'none'};
           if (k.matches('table.t, table.osce')) { const th = k.querySelector('thead'); o.th = th ? Math.round(th.getBoundingClientRect().height / sc) : 0;
             o.rows = [...k.querySelectorAll(':scope > tbody > tr')].map(tr => Math.round(tr.getBoundingClientRect().height / sc)); o.span = !!k.querySelector('td[rowspan]'); }
           return o; });
         const inner = kids.reduce((a, k) => a + k.h, 0);
         const mhe = mbs[0].querySelector(':scope > .mh'); det = {kids, over: Math.round(h - inner), mh: !!mhe, mhh: mhe ? Math.round(mhe.getBoundingClientRect().height / sc) : 0}; } }
     blocks.push([ch.dataset.id, Math.round(h), det]); });
   out.push({f: c.dataset.file, cap: Math.round((body.getBoundingClientRect().bottom - mt) / sc), fixed: Math.round(fixed), blocks}); });
 return out; });
  await b.close(); fs.writeFileSync(path.join(R, 'build/blocks.json'), JSON.stringify(F)); console.log(F.length, 'pages');
})();
