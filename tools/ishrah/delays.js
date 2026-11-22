// Whole-app delay check (owner, 22 Nov 2026: "look for any such delay in the app"): serve ishrah/ on :8820 with an empty config.js, then
// node tools/ishrah/delays.js            first openings (each DB request waits DELAY ms, default 400)
// TWICE=1 node tools/ishrah/delays.js    second openings, with the learned early reads (js/prefetch.js)
// PF=0 … without js/prefetch.js; ONLY=lecturer/,lesson/ … some pages. Columns: ms until shown · ms until done · requests one after another · requests.
// Delay audit: every DB request waits DELAY ms; each page is opened fresh (no saved reads); time until the page's content is in #main,
// and how many requests ran one after another ("waves").
const { chromium } = require('playwright');
const DELAY = +process.env.DELAY || 400;
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 390, height: 844 } });
  await c.route('**/js/config.js*', r => r.fulfill({ contentType: 'application/javascript', body: "window.ISH_CONFIG={supabaseUrl:'',supabaseAnonKey:'',bunnyLibrary:''};" }));
  await c.route('**/sw.js', r => r.fulfill({ status: 404, body: '' }));
  await c.addInitScript(() => { try { sessionStorage.setItem('ish-wel', '1'); } catch (e) {} });
  const fs = require('fs'), PF = process.env.PF !== '0';
  const SLOW = `(function(D){ window.__calls = []; Object.keys(DB).forEach(function(k){ var f = DB[k]; if (typeof f !== 'function' || /^(uid|onAuth|forget|clearSaved|cachedLibraryCover|libraryCoverUrls)$/.test(k)) return;
    DB[k] = function(){ var r = f.apply(this, arguments); if (!r || typeof r.then !== 'function') return r; if (!window.__slow) return r; __calls.push([performance.now(), k + ':' + (typeof arguments[0] === 'string' ? arguments[0] : '')]); return r.then(function(v){ return new Promise(function(ok){ setTimeout(function(){ ok(v); }, D); }); }); }; }); })(${DELAY});\n`;
  await c.route('**/js/prefetch.js*', r => r.fulfill({ contentType: 'application/javascript', body: SLOW + (PF ? fs.readFileSync(require('path').join(__dirname, '..', '..', 'ishrah', 'js', 'prefetch.js'), 'utf8') : '') }));
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 120)));
  await p.goto('http://localhost:8820/'); await p.evaluate(() => { localStorage.setItem('ish-spec', '"medicine"'); localStorage.setItem('ish-study-sections', JSON.stringify({ medicine: 'clinical' })); }); await p.reload(); await p.waitForTimeout(800);
  await p.evaluate(d => { IS.AUTHTAB = 'phone'; return IS.SUB.signup(d); }, { name: 'Dr Arja', phone: '0911111111', pass: 'secret123', pass2: 'secret123', terms: 'on' }); await p.waitForTimeout(900);
  const ids = await p.evaluate(async () => {
    const me = IS.ME.id;
    await DB.upsert('lecturers', { id: me, name: 'Dr Arja', status: 'active', share: 70 }); IS.LEC = await DB.one('lecturers', me);
    const co = await DB.ins('courses', { lecturer_id: me, title: 'كورس', status: 'published', price: 500, spec: 'medicine', cat: 'clinical', delivery: 'recorded', learn: ['x'], about: 'y' });
    const se = await DB.ins('sections', { course_id: co.id, title: 'Part 1', sort: 0 });
    const le = await DB.ins('lessons', { course_id: co.id, section_id: se.id, title: 'درس', kind: 'text', sort: 0, body: 'نص', free: true });
    const po = await DB.ins('posts', { user_id: me, name: 'Dr Arja', title: 'سؤال', body: 'نص', room: 'clinical', spec: 'medicine', status: 'open', kind: 'question' });
    await DB.ins('replies', { post_id: po.id, user_id: me, name: 'Dr Arja', body: 'تعليق', status: 'open' });
    let ev = null, nw = null, fi = null, rq = null, pa = null;
    try { ev = await DB.ins('events', { title: 'فعالية', status: 'published', spec: 'medicine', cat: 'clinical', starts_at: new Date(Date.now() + 864e5).toISOString(), user_id: me, lecturer_id: me }); } catch (e) {}
    try { nw = await DB.ins('news', { title: 'خبر', body: 'نص', status: 'published', spec: 'medicine' }); } catch (e) {}
    try { fi = await DB.ins('files', { title: 'كتاب', status: 'published', spec: 'medicine', cat: 'clinical', user_id: me, price: 0, kind: 'book' }); } catch (e) {}
    try { rq = await DB.ins('course_requests', { title: 'طلب', status: 'open', spec: 'medicine', cat: 'clinical', user_id: me }); } catch (e) {}
    try { pa = await DB.ins('paths', { title: 'مسار', status: 'published', spec: 'medicine' }); } catch (e) {}
    return { me, co: co.id, le: le.id, po: po.id, ev: ev && ev.id, nw: nw && nw.id, fi: fi && fi.id, rq: rq && rq.id, pa: pa && pa.id };
  });
  const R = ['home', 'courses', 'learning', 'events', 'news', 'lecturers', 'community', 'library', 'paths', 'favorites', 'achievements', 'downloads', 'support', 'team', 'about',
    'settings', 'notifications', 'account', 'security', 'search', 'course-requests', 'sales', 'books', 'studio', 'studio-courses', 'studio-guide', 'studio-money', 'studio-page', 'studio-events',
    'studio-students', 'studio-qa', 'studio-requests', 'studio-course-requests', 'studio-bank', 'control', 'control-pay', 'control-sales', 'control-review', 'control-apps', 'control-lecturers',
    'control-payouts', 'control-students', 'control-community', 'control-events', 'control-cats', 'control-notify', 'control-team', 'control-usage', 'control-settings', 'control-audit',
    'control-tickets', 'control-tasks', 'control-library', 'control-paths', 'control-requests', 'control-course-requests', 'control-questions', 'control-news', 'control-reports', 'control-structure',
    'course/' + ids.co, 'lesson/' + ids.co + '/' + ids.le, 'post/' + ids.po, 'person/' + ids.me, 'lecturer/' + ids.me, 'studio-course/' + ids.co, 'studio-course/' + ids.co + '/cur',
    ids.ev && 'event/' + ids.ev, ids.fi && 'file/' + ids.fi, ids.rq && 'course-request/' + ids.rq, ids.pa && 'path/' + ids.pa, 'payment/' + ids.co].filter(Boolean);
  // slow every DB call (reads and writes), record start times
  await p.evaluate(D => {
    window.__slow = 1;
    const on0 = IS.onRoute; IS.onRoute = function (n, a, m) { window.__done = performance.now(); if (on0) return on0.apply(this, arguments); };
    const mo = new MutationObserver(() => { if (window.__t0 && !window.__shown) { const m = document.getElementById('main'); if (m && m.querySelector('h1, h2, .mrx, .box, .mh-page, article, section')) window.__shown = performance.now(); } });
    mo.observe(document.getElementById('main') || document.body, { childList: true, subtree: true });
  }, DELAY);
  const out = [];
  for (const pass of (process.env.TWICE ? [0, 1] : [1])) for (const r of R) {
    if (ONLY && !ONLY.some(o => r.startsWith(o))) continue;
    await p.evaluate(() => { location.hash = 'terms'; }); await p.waitForTimeout(700);
    const res = await p.evaluate(async r => {
      __calls = []; window.__done = 0; window.__shown = 0; const t0 = performance.now(); window.__t0 = t0; location.hash = r;
      while (performance.now() - t0 < 12000) { await new Promise(x => setTimeout(x, 25)); if (window.__done && window.__done > t0) break; }
      await new Promise(x => setTimeout(x, 150));
      const calls = __calls.filter(c => c[0] >= t0 && c[0] <= (window.__done || 1e12));
      let waves = 0, last = -1e9; calls.map(c => c[0]).sort((a, b) => a - b).forEach(t => { if (t - last > 200) { waves++; last = t; } });
      return { shown: Math.round((window.__shown || window.__done) - t0), done: Math.round((window.__done || performance.now()) - t0), calls: calls.length, waves, names: calls.map(c => c[1]).slice(0, 14).join(' '), page: document.body.dataset.page };
    }, r);
    if (pass) out.push([r.replace(/\/[0-9a-f-]{20,}/g, '/<id>'), res]);
  }
  out.sort((a, b) => b[1].shown - a[1].shown);
  out.forEach(([r, x]) => console.log(String(x.shown).padStart(5), String(x.done).padStart(5), ('w' + x.waves).padStart(4), ('c' + x.calls).padStart(4), r.padEnd(26), x.page, '|', x.names));
  console.log(errs.slice(0, 5));
  await b.close();
})();
