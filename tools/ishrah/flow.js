// Full flow in preview mode: owner → lecturer applies → approved → builds course with video, text, quiz → review → publish
// → student enrols with receipt → finance approves → student watches and finishes → payout recorded. Screenshots of every page.
const { chromium } = require('playwright');
const D = process.argv[2] || 'shots', W = +(process.argv[3] || 1440), H = W < 600 ? 844 : 900, S = __dirname;
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: W, height: H } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('dialog', d => d.accept());
  const go = async (h, wait) => { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(wait || 700); };
  const shot = async (n) => { await p.screenshot({ path: `${D}/f-${W}-${n}.png`, fullPage: true });
    const o = await p.evaluate(() => { const Wd = document.documentElement.clientWidth, out = []; document.querySelectorAll('main *').forEach(e => { const x = e.getBoundingClientRect(); if (x.width > 0 && (x.right > Wd + 1 || x.left < -1) && !e.closest('.tabs,.catbar,.subjs,.ltabs,.matrix,.doors')) out.push(e.tagName + '.' + String(e.className).slice(0, 25) + ' ' + Math.round(x.left) + '..' + Math.round(x.right)); }); return out.slice(0, 3); });
    if (o.length) console.log('OVERFLOW', n, o.join(' | ')); };
  const fill = async (sel, v) => { await p.fill(sel, v); };
  const submit = async (form) => { await p.click(`form[data-form="${form}"] button:not([type=button]) >> nth=-1`); await p.waitForTimeout(900); };
  const signup = async (name, phone, kind) => {
    await go('home'); await p.evaluate(() => (IS.AUTHTAB='phone',IS.ACT.register)({ getAttribute: () => null })); await p.waitForTimeout(300);
    if (kind === 'lecturer') await p.click('.kind[data-k=lecturer]');
    await fill('form[data-form=signup] [name=name]', name); await fill('form[data-form=signup] [name=phone]', phone);
    await fill('form[data-form=signup] [name=pass]', 'secret12'); await fill('form[data-form=signup] [name=pass2]', 'secret12'); await p.check('form[data-form=signup] [name=terms]');
    if (name.indexOf('مالك') >= 0) await shot('00-signup');
    await submit('signup'); await p.waitForTimeout(600);
  };
  const logout = async () => { await p.evaluate(() => IS.ACT.logout()); await p.waitForTimeout(500); };
  const login = async (phone) => { await p.evaluate(() => (IS.AUTHTAB='phone',IS.ACT.login)()); await p.waitForTimeout(300); await fill('form[data-form=signin] [name=phone]', phone); await fill('form[data-form=signin] [name=pass]', 'secret12'); await submit('signin'); await p.waitForTimeout(600); };

  await p.goto('http://localhost:' + (process.env.PORT || 8820) + '/'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ish-spec', '"medicine"'); localStorage.setItem('ish-study-sections', '{"medicine":"clinical"}'); indexedDB.deleteDatabase('ish-files'); }); await p.reload(); await p.waitForTimeout(800);
  // 1. owner
  await signup('المالك عبدالجليل ارجا', '0911111111'); await go('control', 1000); await shot('01-control-dash');
  await logout();
  // 2. lecturer applies
  await signup('محمد الصادق', '0922222222', 'lecturer'); await p.waitForTimeout(500); await shot('02-apply');
  await p.selectOption('form[data-form=apply] [name=specialty]', '__o'); await fill('form[data-form=apply] [name=specialty__o]', 'General Surgery (Hepatobiliary)'); await p.selectOption('form[data-form=apply] [name=title]', 'Consultant'); await p.selectOption('form[data-form=apply] [name=qual]', 'MBBS');
  await p.check('form[data-form=apply] [name=teaching_spaces][value="medicine/clinical"]'); await fill('form[data-form=apply] [name=experience]', 'ثماني سنوات في تدريس الجراحة لطلبة الطب.'); await p.setInputFiles('form[data-form=apply] [name=cv]', S + '/receipt.png');
  await fill('form[data-form=apply] [name=sample]', 'https://youtube.com/watch?v=x'); await fill('form[data-form=apply] [name=plan_title]', 'Acute Abdomen'); await fill('form[data-form=apply] [name=plan]', 'التهاب الزائدة، الانسداد، والانثقاب.');
  await p.check('form[data-form=apply] input[type=checkbox]'); await submit('apply'); await shot('03-apply-sent');
  await go('account', 900); await shot('04-account');
  await logout();
  // 3. owner approves
  await login('0911111111'); await go('control-apps', 900); await shot('05-apps'); await p.click('[data-act=appok]'); await p.waitForTimeout(900);
  await go('control-team', 900); await shot('06-team'); await go('control-structure', 800); await shot('07-structure');
  await logout();
  // 4. lecturer builds a course
  await login('0922222222'); await go('studio', 900); await shot('08-studio');
  await go('studio-page', 800); await fill('form[data-form=lecpage] [name=tags]', 'Surgery، GI Surgery، Trauma'); await fill('form[data-form=lecpage] [name=quals]', 'MBBS – جامعة الخرطوم\nMMed – General Surgery\nاستشاري الجراحة العامة');
  await fill('form[data-form=lecpage] [name=p_account]', '1234567'); await fill('form[data-form=lecpage] [name=p_name]', 'محمد الصادق'); await submit('lecpage'); await shot('09-studio-page');
  await go('studio-course/new', 800); await fill('form[data-form=course] [name=title]', 'Acute Abdomen'); await fill('form[data-form=course] [name=subtitle]', 'مراجعة شاملة للتشخيص والتدبير');
  await p.selectOption('form[data-form=course] [name=subject]', 'surgery'); await fill('form[data-form=course] [name=price]', '15000');
  await p.setInputFiles('form[data-form=course] [name=cover]', S + '/receipt.png');
  await p.click('[data-ed=about]'); await p.keyboard.type('كورس يشرح البطن الحاد خطوة بخطوة.');
  await fill('form[data-form=course] [name=learn]', 'التشخيص السريري\nالتشخيص التفريقي\nمؤشرات الجراحة'); await submit('course'); await p.waitForTimeout(800);
  const cid = await p.evaluate(() => location.hash.split('/')[1]);
  // section + lessons via the builder buttons (prompts answered through the ask sheet)
  const ask = async (v) => { await p.waitForSelector('#askf'); await p.fill('#askf [name=v]', v); await p.click('#askf button:not([type=button])'); await p.waitForTimeout(700); };
  await p.click('[data-act=addsec]'); await ask('Approach to Acute Abdomen');
  await p.click('[data-act=addles][data-k=video]'); await ask('Lecture 1: Acute Appendicitis');
  await p.setInputFiles('#vfile', S + '/clip.mp4'); await p.waitForTimeout(2500); await p.check('form[data-form=lesson] [name=free]'); await submit('lesson');
  await p.click('[data-act=addles][data-k=text]'); await ask('Notes: Differential diagnosis'); await p.click('[data-ed=body]'); await p.keyboard.type('Appendicitis, ectopic pregnancy, mesenteric adenitis.'); await submit('lesson');
  await p.click('[data-act=addles][data-k=quiz]'); await ask('Quiz: Acute abdomen'); await p.click('[data-act=addq]');
  await p.fill('.qedit .qq', 'The commonest cause of acute surgical abdomen is:'); const opts = await p.$$('.qedit .qo'); const ov = ['Appendicitis', 'Cholecystitis', 'Pancreatitis', 'Diverticulitis']; for (let i = 0; i < 4; i++) await opts[i].fill(ov[i]);
  await p.check('.qedit input[type=radio] >> nth=0'); await submit('lesson'); await shot('10-curriculum');
  await go('studio-course/' + cid + '/publish', 800); await shot('11-publish'); await p.click('[data-act=submit]'); await p.waitForTimeout(800);
  await go('studio-events', 600); await p.click('[data-act=evform]'); await p.waitForTimeout(300); await fill('form[data-form=event] [name=title]', 'OSCE workshop: abdominal examination');
  await fill('form[data-form=event] [name=starts]', '2026-12-05T19:00'); await fill('form[data-form=event] [name=link]', 'https://meet.google.com/abc'); await submit('event');
  await logout();
  // 5. owner publishes
  await login('0911111111'); await go('control-review', 800); await shot('12-review'); await p.click('[data-act=cpub]'); await p.waitForTimeout(800);
  await go('control-library', 600); await p.click('[data-act=addfile]'); await p.waitForTimeout(300); await fill('form[data-form=cfile] [name=title]', 'Surgery Quick Sheet'); await p.selectOption('form[data-form=cfile] [name=kind]', 'sheet');
  await p.setInputFiles('form[data-form=cfile] [name=file]', S + '/receipt.png'); await submit('cfile');
  await logout();
  // 6. student enrols and pays
  await signup('أحمد الطالب', '0933333333'); await go('home', 1000); await shot('13-home');
  await go('courses', 900); await shot('14-courses'); await go('course/' + cid, 900); await shot('15-course');
  await p.click('[data-act=enrol]'); await p.waitForTimeout(400); await p.setInputFiles('form[data-form=pay] [name=receipt]', S + '/receipt.png'); await shot('16-pay');
  await submit('pay'); await p.waitForTimeout(600); await go('learning', 700); await shot('17-learning');
  await go('library/requests', 800); await fill('form[data-form=request] [name=title]', 'Oxford Handbook of Clinical Surgery (5th ed)'); await submit('request'); await shot('18-requests');
  await go('library', 800); await shot('19-library');
  await go('community', 600); await fill('form[data-form=post] [name=title]', 'متى نطلب CT في ألم البطن الحاد؟'); await fill('form[data-form=post] [name=body]', 'أريد معرفة المؤشرات.'); await submit('post'); await shot('20-community');
  await logout();
  // 7. finance approves
  await login('0911111111'); await go('control-pay', 800); await shot('21-pay'); await p.click('[data-act=payok]'); await p.waitForTimeout(900);
  await logout();
  // 8. student studies
  await login('0933333333'); await go('notifications', 600); await shot('22-notif');
  const lessons = await p.evaluate(async (c) => (await DB.q('lessons', { eq: { course_id: c }, order: ['sort'] })).map(l => l.id), cid);
  await go('lesson/' + cid + '/' + lessons[0], 1500); await shot('23-lesson-video');
  for (const l of lessons) { await go('lesson/' + cid + '/' + l, 900); const q = await p.$('[data-act=quizcheck]'); if (q) { await p.check('.qq input[value="0"]'); await q.click(); await p.waitForTimeout(800); } else { const d = await p.$('[data-act=done]'); if (d) { await d.click(); await p.waitForTimeout(800); } } }
  await go('lesson/' + cid + '/' + lessons[2], 900); await shot('24-lesson-quiz');
  // 8b. downloads inside the platform, then without internet (owner, 18 Nov 2026)
  await go('lesson/' + cid + '/' + lessons[0], 900); await p.click('[data-act=dlcourse]'); await p.waitForSelector('[data-q="480"]'); await p.click('[data-q="480"]');
  await p.waitForFunction(() => document.querySelector('[data-dlid]') && document.querySelector('[data-dlid]').classList.contains('have'), null, { timeout: 20000 }); await p.waitForTimeout(1500);
  const fid = await p.evaluate(async () => (await DB.q('files', {}))[0].id); await go('file/' + fid, 900); await p.click('[data-act=dl]'); await p.waitForTimeout(1500);
  await ctx.setOffline(true); await p.waitForTimeout(300); await go('downloads', 900); await shot('24b-downloads-offline');
  const dl = await p.evaluate(() => ({ bar: !document.getElementById('offbar').hidden, rows: document.querySelectorAll('.dlr').length }));
  if (!dl.bar || dl.rows < 4) errs.push('downloads: bar ' + dl.bar + ', rows ' + dl.rows);
  const ids = await p.$$eval('.dlr a.grow', a => a.map(x => x.getAttribute('href').slice(1)));
  for (const h of ids) { await go(h, 1500); const r = await p.evaluate(() => { const v = document.querySelector('#dlview video'); return { v: !!v, ready: v ? v.readyState : -1, text: (document.querySelector('.rich') || {}).textContent || '', quiz: document.querySelectorAll('.qq').length, img: !!document.querySelector('#dlview img'), err: !!document.querySelector('#dlview .empty') }; });
    if (r.err || !(r.v || r.text || r.quiz || r.img)) errs.push('offline open failed ' + h + ' ' + JSON.stringify(r)); if (r.v) await shot('24c-offline-video'); }
  await go('courses', 900); await shot('24d-offline-courses'); await ctx.setOffline(false); await p.waitForTimeout(500);
  await go('achievements', 800); await shot('25-achievements'); await go('cert/' + cid, 700); await shot('26-cert');
  await go('lecturers', 700); await shot('27-lecturers'); await go('about', 700); await shot('28-about');
  await logout();
  // 9. payouts
  await login('0911111111'); await go('control', 1000); await shot('29-control-dash'); await go('control-payouts', 800); await shot('30-payouts');
  await p.click('[data-act=payout]'); await p.waitForTimeout(300); await fill('form[data-form=payout] [name=ref]', 'TX-5521'); await submit('payout');
  await go('control-reports', 700); await shot('31-reports'); await go('control-requests', 700); await shot('32-requests');
  await logout(); await login('0922222222'); await go('studio-money', 800); await shot('33-money'); await go('lecturer/' + (await p.evaluate(() => IS.LEC.id)), 800); await shot('34-lecpage');
  console.log(errs.length ? [...new Set(errs)].join('\n') : 'flow OK, no errors');
  await b.close();
})();
