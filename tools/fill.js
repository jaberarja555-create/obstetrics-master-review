// Measures, once, how the spare room of every page is spread (the app's own fillPage) and saves it in content/fill.json, so the
// phone does not measure each page when it is opened (owner, 13 Nov 2026: speed). Run after a change of content or styles:
//   python3 build.py && node tools/fill.js && python3 build.py
// A page that changed since the last run simply carries no data-fl and is measured on the phone as before.
const path = require('path'), fs = require('fs');
const { chromium } = require(process.env.SRR_PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const root = path.join(__dirname, '..');
  const page0 = [path.join(root, 'build', 'review', 'index.html'), path.join(root, 'artifact', 'index.html')].find(f => fs.existsSync(f));
  if (!page0) throw new Error('build the book first (python3 build.py)');
  if (/artifact/.test(page0) && !fs.existsSync(path.join(root, 'artifact', 'img'))) fs.symlinkSync(path.join('..', 'content', 'img'), path.join(root, 'artifact', 'img'));
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 900, height: 1200 } });
  await p.goto('file://' + page0); await p.waitForTimeout(1500);
  await p.evaluate(() => Promise.all([...document.fonts].map(f => f.load().catch(() => 0))).then(() => document.fonts.ready));   // the shipped fonts
  await p.evaluate(() => Promise.all([...document.images].filter(i => !i.complete).map(i => new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 4000); }))));
  const d = await p.evaluate(() => window.__fillDump());
  await p.waitForTimeout(300); await b.close();
  const keys = Object.keys(d.pages).sort(), out = { css: d.css, pages: {} }; keys.forEach(k => out.pages[k] = d.pages[k]);
  fs.writeFileSync(path.join(root, 'content', 'fill.json'), JSON.stringify(out, null, 0).replace(/","/g, '",\n"') + '\n');
  console.log('fill.json:', keys.length, 'pages,', keys.filter(k => d.pages[k]).length, 'with spread spacing, styles', d.css);
})();
