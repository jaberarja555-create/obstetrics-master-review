// Whole-app check (owner, 18 Nov 2026: "I don't want me to search such issues and tell you one by one").
// Opens every page at phone, tablet (standing and lying) and laptop size, signed out and signed in, and reports:
//  DUP-SEARCH  more than one search box on the screen      DUP-AUTH  sign-in / register shown twice
//  DUP-BTN     the same button (same text, same target) twice in the page
//  WIDE / OFF  page or element wider than the screen        CUT  text cut off without "…"
//  ROW         a grid whose last row leaves a big hole       SCROLL  page scrolls by only a few px
//  TEXT        undefined / null / NaN / [object …] shown    OVER  two texts drawn on top of each other
//  UNDER       the end of the page hidden under the bottom bar
// usage: PORT=8821 node audit.js [sizes] [pages]   (shots in au/)
const { chromium } = require('playwright');
const PORT = process.env.PORT || 8821, BASE = 'http://localhost:' + PORT + '/';
const SIZES = { ph: [390, 844, true], tp: [820, 1180, true], tl: [1180, 820, true], tx: [1280, 800, true], ts: [1024, 600, true], lp: [1440, 900, false] };
const pick = (process.argv[2] || 'ph,tp,tl,lp').split(',');
const PUB = 'home,pick,pick-section,search/anatomy,courses,course-requests,course-requests/new,specialties,lecturers,events,news,community,library,paths,team,about,terms,support,settings,studio-apply,studio-guide'.split(',');
const MINE = 'course-requests/mine,learning,favorites,achievements,downloads,account,notifications,security,library/requests,studio,studio-courses,studio-events,studio-students,studio-qa,studio-money,control,control-team,control-cats,control-review,control-course-requests,control-apps,control-lecturers,control-students,control-library,control-requests,control-community,control-events,control-notify,control-news,control-settings,control-audit,control-reports,control-paths,control-structure,control-tickets,control-tasks,control-pay,control-payouts'.split(',');
const DETAIL = [['courses', 'course/'], ['lecturers', 'lecturer/'], ['events', 'event/'], ['community', 'post/'], ['paths', 'path/'], ['news', 'news/']];
const only = process.argv[3] ? process.argv[3].split(',') : null;
const fs = require('fs'); fs.mkdirSync('au', { recursive: true });

function check() {
  const W = innerWidth, H = innerHeight, out = [];
  const vis = e => { const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false; const dd = e.closest('details:not([open])'); if (dd && !e.closest('summary')) return false; for (let q = e.parentElement; q && q.id !== 'main'; q = q.parentElement) { const o = getComputedStyle(q); if (o.overflowY !== 'visible' || o.overflowX !== 'visible') { const qr = q.getBoundingClientRect(); if (r.bottom <= qr.top + 1 || r.top >= qr.bottom - 1 || r.right <= qr.left + 1 || r.left >= qr.right - 1) return false; } } let a = e; while (a && a.nodeType === 1) { const c = getComputedStyle(a); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return false; a = a.parentNode; if (a && a.nodeType === 11) a = a.host; } return true; };
  const inDlg = e => !!e.closest('dialog,.modal,.sheet,#toast,.toast');
  // duplicates on one screen
  const se = [...document.querySelectorAll('input[type=search],form[role=search] input')].filter(e => vis(e) && !inDlg(e));
  const se2 = [...document.querySelectorAll('a[href="#search"]')].filter(e => vis(e) && !e.closest('#side,#tabs,nav'));
  if (se.length + se2.length > 1) out.push('DUP-SEARCH ' + (se.length + se2.length) + ' (' + [...se, ...se2].map(e => (e.closest('form,a') || e).className || e.tagName).join(', ') + ')');
  for (const a of ['login', 'register']) { const l = [...document.querySelectorAll('[data-act=' + a + ']')].filter(e => vis(e) && !inDlg(e)); if (l.length > 1) out.push('DUP-AUTH ' + a + ' x' + l.length + ' (' + l.map(e => e.textContent.trim()).join(' | ') + ')'); }
  const seen = {};
  document.querySelectorAll('#main a, #main button').forEach(e => { if (!vis(e)) return; const t = e.textContent.replace(/\s+/g, ' ').trim(); if (!t) return;
    const k = t + '→' + (e.getAttribute('href') || '') + [...e.attributes].filter(a => a.name.startsWith('data-')).map(a => a.name + '=' + a.value).join(',');
    (seen[k] = seen[k] || []).push(e); });
  Object.entries(seen).forEach(([k, l]) => { if (l.length > 1) out.push('DUP-BTN x' + l.length + ' ' + k.slice(0, 60)); });
  // width and cut text
  if (document.documentElement.scrollWidth > W + 1) out.push('WIDE ' + document.documentElement.scrollWidth);
  const off = new Set(), cut = new Set();
  document.querySelectorAll('#main *').forEach(e => { const q = e.getBoundingClientRect(); if (!q.width || !vis(e)) return;
    if (q.right > W + 1 || q.left < -1) { let a = e.parentElement, sk = false; while (a && a.id !== 'main') { const o = getComputedStyle(a).overflowX; if (o !== 'visible') { sk = true; break; } a = a.parentElement; } if (!sk) off.add(e.tagName + '.' + String(e.className).slice(0, 20)); }
    const cs = getComputedStyle(e);
    if (e.children.length === 0 && e.textContent.trim() && cs.overflow !== 'visible' && cs.textOverflow !== 'ellipsis' && !cs.webkitLineClamp?.match(/\d/) && (e.scrollWidth > e.clientWidth + 2 || e.scrollHeight > e.clientHeight + 3) && !/INPUT|TEXTAREA|SELECT|OPTION/.test(e.tagName)) cut.add(e.textContent.trim().slice(0, 30)); });
  if (off.size) out.push('OFF ' + [...off].slice(0, 4).join(', '));
  if (cut.size) out.push('CUT ' + [...cut].slice(0, 4).join(' | '));
  // grids with a hole in the last row
  document.querySelectorAll('#main *').forEach(g => { const cs = getComputedStyle(g); if (cs.display !== 'grid' || !vis(g)) return;
    if (g.matches('.lhh') || [...g.children].some(k => /span 2/.test(k.style.gridColumn) && /\//.test(k.style.gridColumn))) return; const kids = [...g.children].filter(vis); if (kids.length < 2) return;
    const cols = cs.gridTemplateColumns.split(' ').filter(x => parseFloat(x) > 0).length; if (cols < 2) return;
    const so = kids.map(k => [k, k.getBoundingClientRect()]).sort((a, b) => a[1].top - b[1].top), RW = []; let bot = -1e9;
    so.forEach(([k, r]) => { if (r.top >= bot - 2) { RW.push([]); bot = r.bottom; } else bot = Math.max(bot, r.bottom); RW[RW.length - 1].push(k); });
    const ks = RW; const last = RW[RW.length - 1], gw = g.getBoundingClientRect().width;
    const used = last.reduce((s, k) => s + k.getBoundingClientRect().width, 0);
    if (used / gw < 0.62 && (RW.length > 1 || kids.length < cols)) out.push('ROW ' + String(g.className).slice(0, 26) + ' last row ' + last.length + '/' + cols + ' (' + Math.round(100 * used / gw) + '% filled)'); });
  // tiny scroll
  const sh = document.documentElement.scrollHeight - H; if (sh > 0 && sh < 70) out.push('SCROLL only ' + sh + 'px');
  // broken text
  const t = document.querySelector('#main').innerText; const m = t.match(/\bundefined\b|\bNaN\b|\[object [A-Za-z]+\]|\bnull\b|\{\{|\}\}|&amp;|&lt;|&quot;/g); if (m) out.push('TEXT ' + [...new Set(m)].join(' '));
  // texts drawn over each other
  const leaves = [...document.querySelectorAll('#main *')].filter(e => vis(e) && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && getComputedStyle(e).position !== 'absolute');
  if (leaves.length < 900) { const R = leaves.map(e => [e, e.getBoundingClientRect()]); let n = 0;
    for (let i = 0; i < R.length && n < 3; i++) for (let j = i + 1; j < R.length && n < 3; j++) { const [a, ra] = R[i], [b, rb] = R[j]; if (a.contains(b) || b.contains(a)) continue;
      const ix = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), iy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (ix > 6 && iy > 6 && ix * iy > 0.3 * Math.min(ra.width * ra.height, rb.width * rb.height)) { out.push('OVER "' + a.textContent.trim().slice(0, 18) + '" ' + a.tagName + '.' + String(a.className).slice(0, 12) + '<' + String(a.parentElement.className).slice(0, 12) + '> / "' + b.textContent.trim().slice(0, 18) + '" ' + b.tagName + '.' + String(b.className).slice(0, 12) + '<' + String(b.parentElement.className).slice(0, 12) + '> @' + Math.round(ra.top)); n++; } } }
  return out;
}
function under() { // after scrolling to the bottom: is the last thing of #main under a fixed bottom bar?
  const tb = [...document.querySelectorAll('#tabs,#offbar')].filter(e => { const r = e.getBoundingClientRect(); return r.height && getComputedStyle(e).position === 'fixed' && r.bottom >= innerHeight - 2; });
  if (!tb.length) return null; const top = Math.min(...tb.map(e => e.getBoundingClientRect().top));
  let lo = 0; document.querySelectorAll('#main *').forEach(e => { const r = e.getBoundingClientRect(); if (r.height && e.textContent.trim() && r.bottom > lo) lo = r.bottom; });
  return lo > top + 2 ? 'UNDER bottom bar by ' + Math.round(lo - top) + 'px' : null;
}
async function signIn(p) {
  await p.evaluate(() => IS.ACT.register({ getAttribute: () => null })); await p.waitForTimeout(400);
  await p.fill('[data-form=esignup] [name=name]', 'د. عبدالجليل ارجا'); await p.fill('[data-form=esignup] [name=email]', 'owner@example.com');
  await p.fill('[data-form=esignup] [name=pass]', 'goodpass1'); await p.fill('[data-form=esignup] [name=pass2]', 'goodpass1'); await p.check('[data-form=esignup] [name=terms]');
  await p.click('[data-form=esignup] button.pri'); await p.waitForTimeout(600);
  const code = await p.evaluate(() => JSON.parse(localStorage.getItem('ish-otp')).c); await p.fill('[data-form=ecode] [name=code]', code); await p.click('[data-form=ecode] button.pri'); await p.waitForTimeout(1500);
}
(async () => {
  const b = await chromium.launch(); let total = 0;
  for (const sz of pick) { const [w, h, touch] = SIZES[sz];
    for (const signed of [false, true]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: touch, isMobile: sz === 'ph' }); await ctx.addInitScript(() => { try { sessionStorage.setItem('ish-wel', '1'); } catch (e) {} }); const p = await ctx.newPage();   // the app welcome (welcome.js) is skipped
      const errs = new Set(); p.on('pageerror', e => errs.add(e.message.slice(0, 120))); p.on('dialog', d => d.accept());
      await p.goto(BASE); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ish-spec', '"medicine"'); localStorage.setItem('ish-study-sections', '{"medicine":"clinical"}'); }); await p.reload(); await p.waitForTimeout(1200);
      if (signed) await signIn(p);
      let pages = signed ? PUB.concat(MINE) : PUB;
      for (const [list, pre] of DETAIL) { await p.evaluate(x => { location.hash = x; }, list); await p.waitForTimeout(700);
        const hr = await p.evaluate(pr => { const a = document.querySelector('#main a[href^="#' + pr + '"]'); return a && a.getAttribute('href').slice(1); }, pre); if (hr) pages.push(hr); }
      if (only) pages = pages.filter(x => only.some(o => x.startsWith(o)));
      for (const hsh of pages) {
        await p.evaluate(x => { location.hash = x; }, hsh); await p.waitForTimeout(800);
        const r = await p.evaluate(check); await p.evaluate(() => scrollTo(0, 1e6)); await p.waitForTimeout(150); const u = await p.evaluate(under); if (u) r.push(u); await p.evaluate(() => scrollTo(0, 0));
        if (r.length) { total += r.length; console.log(`[${sz} ${signed ? 'in ' : 'out'}] ${hsh.padEnd(20)} ${r.join('  ·  ')}`);
          await p.screenshot({ path: `au/${sz}-${signed ? 'in' : 'out'}-${hsh.replace(/\W/g, '_')}.png`, fullPage: true }); }
      }
      if (errs.size) console.log(`[${sz} ${signed ? 'in' : 'out'}] PAGE ERRORS: ${[...errs].join(' | ')}`);
      await ctx.close();
    } }
  console.log('findings:', total); await b.close();
})();
