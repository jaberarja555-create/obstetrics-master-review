// Pictures for the user manual (Settings → دليل الاستخدام): screenshots of the app itself.
// Run after the screens change:  python3 build.py && (cd build/site && python3 -m http.server 8765 &) && node tools/help_shots.js
const pw = require(process.env.PW || '/opt/node-tools/node_modules/playwright'), path = require('path');
const OUT = path.join(__dirname, '..', 'assets', 'img'), URL = process.env.URL || 'http://localhost:8765/index.html';
const SHOTS = [['home', []], ['chapters', ['#v2nav [data-v=v2chapters]', '[data-act=ch][data-n="1"]']], ['reader', ['#v2nav [data-v=v2chapters]', '[data-act=ch][data-n="1"]', '[data-act=topic]']],
  ['practice', ['#v2nav [data-v=v2practice]']], ['resources', ['#v2nav [data-v=v2resources]']], ['sub', ['#v2nav [data-v=v2settings]', '#v2settingsW [data-act=sub]']], ['settings', ['#v2nav [data-v=v2settings]']]];
(async () => {
  const b = await pw.chromium.launch();
  for (const [name, steps] of SHOTS) {
    const p = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true });
    await p.goto(URL); await p.waitForTimeout(2200); await p.click('#v2welGo'); await p.waitForTimeout(1300);
    for (const s of steps) { await p.evaluate(q => document.querySelector(q).click(), s); await p.waitForTimeout(600); }
    await p.screenshot({ path: path.join(OUT, 'help_' + name + '.jpg'), type: 'jpeg', quality: 72 }); await p.close();
  }
  await b.close(); console.log('help pictures written');
})();
