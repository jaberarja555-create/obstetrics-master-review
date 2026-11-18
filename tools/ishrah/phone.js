// every page on a 390 px phone, signed in as the owner (preview copy on :8821); lists text cut off, things wider than the screen,
// and repeated greetings; screenshots in ph/
const { chromium } = require('playwright');
const PAGES = (process.argv[2] || 'home,courses,lecturers,events,news,community,library,library/requests,paths,learning,favorites,achievements,downloads,support,team,about,settings,account,notifications,studio-apply,studio-guide,studio,control,control-team,control-cats').split(',');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('http://localhost:' + (process.env.PORT || 8820) + '/'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ish-spec', '"medicine"'); localStorage.setItem('ish-study-sections', '{"medicine":"clinical"}'); }); await p.reload(); await p.waitForTimeout(1200);
  await p.evaluate(() => IS.ACT.register({ getAttribute: () => null })); await p.waitForTimeout(400);
  await p.fill('[data-form=esignup] [name=name]', 'د. عبدالجليل ارجا'); await p.fill('[data-form=esignup] [name=email]', 'owner@example.com');
  await p.fill('[data-form=esignup] [name=pass]', 'goodpass1'); await p.fill('[data-form=esignup] [name=pass2]', 'goodpass1'); await p.check('[data-form=esignup] [name=terms]');
  await p.click('[data-form=esignup] button.pri'); await p.waitForTimeout(600);
  const code = await p.evaluate(() => JSON.parse(localStorage.getItem('ish-otp')).c); await p.fill('[data-form=ecode] [name=code]', code); await p.click('[data-form=ecode] button.pri'); await p.waitForTimeout(1500);
  for (const h of PAGES) {
    await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(1100);
    const r = await p.evaluate(() => {
      const W = innerWidth, out = { wide: document.documentElement.scrollWidth > W + 1, off: [], cut: [], greet: 0 };
      document.querySelectorAll('#main *').forEach(e => { const q = e.getBoundingClientRect(); if (!q.width) return;
        if (q.right > W + 1 || q.left < -1) { let a = e.parentElement, sk = false; while (a && a.id !== 'main') { const o = getComputedStyle(a).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') { sk = true; break; } a = a.parentElement; } if (!sk) out.off.push(e.tagName + '.' + String(e.className).slice(0, 18)); }
        if (!e.children.length && e.textContent.trim() && e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).textOverflow !== 'ellipsis' && getComputedStyle(e).overflow !== 'visible') out.cut.push(e.textContent.trim().slice(0, 25)); });
      const t = document.querySelector('#main').innerText; out.greet = (t.match(/مرحبًا|مرحبا بك|Welcome/g) || []).length; out.off = [...new Set(out.off)].slice(0, 4); out.cut = [...new Set(out.cut)].slice(0, 4); return out; });
    const flag = (r.wide ? ' WIDE' : '') + (r.off.length ? ' OFF:' + r.off.join(',') : '') + (r.cut.length ? ' CUT:' + r.cut.join('|') : '') + (r.greet > 1 ? ' GREET x' + r.greet : '');
    console.log(h.padEnd(18), flag || 'ok');
    await p.screenshot({ path: (process.argv[3] || '.') + '/' + h.replace(/\W/g, '_') + '.png', fullPage: true });
  }
  console.log(errs.length ? 'ERR ' + [...new Set(errs)].join(' | ') : 'no page errors'); await b.close();
})();
