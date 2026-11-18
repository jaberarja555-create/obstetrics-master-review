// Organisation flow (preview mode): owner invites a finance manager (2FA required) and a finance staff member; the finance manager registers,
// sets up 2FA with a real TOTP code, sees the finance dashboard and assigns a task; a student writes a refund/support message; the team answers.
const { chromium } = require('playwright'); const crypto = require('crypto');
const D = process.argv[2] || 'shots', W = +(process.argv[3] || 1440), H = W < 600 ? 844 : 900;
function totp(secret) { const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = ''; for (const c of secret) bits += A.indexOf(c).toString(2).padStart(5, '0'); const key = Buffer.from(bits.match(/.{8}/g).map(b => parseInt(b, 2)));
  const ctr = Buffer.alloc(8); ctr.writeUInt32BE(Math.floor(Date.now() / 30000), 4); const h = crypto.createHmac('sha1', key).update(ctr).digest(), o = h[19] & 15;
  return String(((h[o] & 127) << 24 | h[o + 1] << 16 | h[o + 2] << 8 | h[o + 3]) % 1e6).padStart(6, '0'); }
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|qrcode/.test(m.text())) errs.push(m.text()); }); p.on('dialog', d => d.accept());
  const go = async (h, w) => { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(w || 800); };
  const shot = async n => { await p.screenshot({ path: `${D}/o-${W}-${n}.png`, fullPage: true });
    const o = await p.evaluate(() => { const Wd = document.documentElement.clientWidth, out = []; document.querySelectorAll('main *').forEach(e => { const x = e.getBoundingClientRect(); if (x.width > 0 && (x.right > Wd + 1 || x.left < -1) && !e.closest('.tabs,.matrix,.rtiles,.catbar,.subjs,.ltabs,.doors')) out.push(e.tagName + '.' + String(e.className).slice(0, 25) + ' ' + Math.round(x.left) + '..' + Math.round(x.right)); }); return out.slice(0, 3); });
    if (o.length) console.log('OVERFLOW', n, o.join(' | ')); };
  const sub = async f => { await p.click(`form[data-form="${f}"] button:not([type=button]) >> nth=-1`); await p.waitForTimeout(900); };
  const signup = async (name, phone) => { await go('home'); await p.evaluate(() => (IS.AUTHTAB='phone',IS.ACT.register)({ getAttribute: () => null })); await p.waitForTimeout(300);
    await p.fill('[data-form=signup] [name=name]', name); await p.fill('[data-form=signup] [name=phone]', phone); await p.fill('[data-form=signup] [name=pass]', 'secret12'); await p.fill('[data-form=signup] [name=pass2]', 'secret12'); await p.check('[data-form=signup] [name=terms]'); await sub('signup'); await p.waitForTimeout(500); };
  const login = async phone => { await p.evaluate(() => (IS.AUTHTAB='phone',IS.ACT.login)()); await p.waitForTimeout(300); await p.fill('[data-form=signin] [name=phone]', phone); await p.fill('[data-form=signin] [name=pass]', 'secret12'); await sub('signin'); await p.waitForTimeout(800); };
  const logout = async () => { await p.evaluate(() => IS.ACT.logout()); await p.waitForTimeout(500); };
  await p.goto('http://localhost:8820/'); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); indexedDB.deleteDatabase('ish-files'); }); await p.reload(); await p.waitForTimeout(800);
  // owner
  await signup('د. عبدالجليل ارجا', '0911111111'); await go('control', 1200); await shot('01-owner-dash');
  await go('control-team', 1000); await shot('02-team');
  const staff = async (name, phone, role, dept, mgr, mfa) => { const f = '.tgrid [data-form=staff]';
    await p.fill(f + ' [name=name]', name); await p.fill(f + ' [name=phone]', phone); await p.selectOption(f + ' [name=role]', role); if (dept) await p.selectOption(f + ' [name=dept]', dept);
    if (mgr) await p.selectOption(f + ' [name=manager]', { label: mgr }); if (!mfa) await p.uncheck(f + ' [name=mfa]'); await p.click(f + ' button:not([type=button]) >> nth=-1'); await p.waitForTimeout(800); };
  await staff('أ. محمد عثمان', '0933333333', 'finance', 'finance', null, true);
  await logout();
  // finance manager registers → forced 2FA → finance dashboard
  await signup('أ. محمد عثمان', '0933333333'); await go('control', 900); await shot('03-mfa-setup');
  await p.click('[data-act=mfaenroll]'); await p.waitForTimeout(1500); await shot('04-mfa-qr');
  const secret = await p.textContent('code.key'); await p.fill('[data-form=mfaconfirm] [name=code]', totp(secret.trim())); await sub('mfaconfirm'); await p.waitForTimeout(800);
  await go('control', 1200); await shot('05-finance-dash');
  await logout();
  // owner adds a finance staff member under the finance manager
  await login('0911111111'); await go('control-team', 900); await staff('أ. سارة حمد', '0944444444', 'staff', 'finance', 'أ. محمد عثمان', false);
  await go('control-team/finance', 900); await shot('06-team-matrix');
  await logout(); await signup('أ. سارة حمد', '0944444444'); await logout();
  // finance manager signs in again: 2FA code asked, then assigns a task
  await login('0933333333'); await shot('07-mfa-code'); await p.fill('[data-form=mfacode] [name=code]', totp(secret.trim())); await sub('mfacode'); await p.waitForTimeout(800);
  await go('control-tasks', 800); await p.click('[data-act=taskform]'); await p.waitForTimeout(400); await p.fill('#sheet [name=title]', 'مراجعة مدفوعات اليوم'); await p.fill('#sheet [name=details]', 'طابق الإيصالات مع إشعارات بنكك'); await p.fill('#sheet [name=link]', '#control-pay'); await sub('task');
  await go('control-tasks/given', 800); await shot('08-tasks');
  await logout();
  // student writes a message
  await signup('أحمد الطالب', '0955555555'); await go('support', 800); await shot('09-support');
  await p.click('.kbtn[data-k=payment]'); await p.waitForTimeout(300); await p.fill('#sheet [name=subject]', 'دفعت ولم يُفتح الكورس'); await p.fill('#sheet [name=body]', 'حولت المبلغ أمس برقم عملية 99887766.'); await sub('ticket'); await p.waitForTimeout(600); await shot('10-ticket');
  await logout();
  // staff sees the task; finance answers the message
  await login('0944444444'); await go('control', 900); await shot('11-staff-dash'); await go('control-tasks', 700); await p.click('[data-act=tmove]'); await p.waitForTimeout(700); await logout();
  await login('0933333333'); await p.fill('[data-form=mfacode] [name=code]', totp(secret.trim())); await sub('mfacode');
  await go('control-tickets', 800); await shot('12-inbox'); const tid = await p.evaluate(async () => (await DB.q('tickets'))[0].id); await go('control-ticket/' + tid, 800);
  await p.fill('[data-form=treply] [name=body]', 'وصلنا التحويل وفُتح الكورس على حسابك. شكرًا لك.'); await sub('treply'); await shot('13-ticket-staff');
  await logout(); await login('0911111111'); await go('control-structure', 800); await shot('14-structure'); await go('control', 1200); await shot('15-owner-dash2');
  console.log(errs.length ? [...new Set(errs)].join('\n') : 'org flow OK, no errors'); await b.close();
})();
