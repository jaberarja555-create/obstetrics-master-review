/* اشرح لي: alerts (owner, 19 Nov 2026: "notifications for every post; admins get a sound notification for every user request, better on the
   phone, so they respond on time"). The database makes the notifications (035_alerts.sql); this file
   - plays a sound, vibrates and shows the title when a new notification arrives while the app is open (checks every 20 s for the team,
     45 s for others, and at once when the phone receives a push),
   - turns phone notifications (Web Push, /api/push) on or off for this device, keeping the device's speciality and section up to date,
   - asks once (Home, Control) to turn them on, with the iPhone step (Add to Home Screen) where it is needed, and a switch in Settings. */
(function () {
  var A = IS.A, esc = IS.esc, ic = IS.ic;
  var CAN = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  var IOS = /iP(hone|ad|od)/.test(navigator.userAgent) && !(navigator.standalone || matchMedia('(display-mode: standalone)').matches);
  function u8(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); s += '='.repeat((4 - s.length % 4) % 4); var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  function team() { return !!(IS.team && IS.team()); }
  IS.pushState = function () { return !CAN ? (IOS ? 'ios' : 'no') : Notification.permission; };

  /* ---------- sound ---------- */
  var ctx = null;
  function unlock() { try { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); } catch (e) {} }
  ['pointerdown', 'keydown'].forEach(function (t) { document.addEventListener(t, unlock, { passive: true }); });
  IS.chime = function (strong) {
    try {
      if (IS.LS.get('sound-off', 0)) return; unlock(); if (!ctx) return;
      var now = ctx.currentTime, notes = strong ? [880, 1175, 1568] : [784, 1047];
      notes.forEach(function (f, i) {
        var o = ctx.createOscillator(), g = ctx.createGain(), t = now + i * 0.13;
        o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(strong ? 0.35 : 0.22, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.35);
      });
      if (navigator.vibrate) navigator.vibrate(strong ? [180, 80, 180, 80, 180] : [150]);
    } catch (e) {}
  };

  /* ---------- new notifications while the app is open ---------- */
  var last = null, busy = false;
  function mine(x) { return x.actor !== IS.ME.id && (x.user_id ? x.user_id === IS.ME.id : (!IS.announcementInSection || IS.announcementInSection(x))); }
  async function check() {
    if (!IS.ME || busy || document.visibilityState !== 'visible' || (DB.live && !navigator.onLine)) return;
    busy = true;
    try {
      var read = DB._q || DB.q, rows = (await read('notices', { order: ['created_at', false], limit: 25 })).filter(mine);
      var top = rows[0];
      /* switching speciality or section shows that space's older notices: they are not new, so start counting again without a sound
         (owner, 20 Nov 2026: "each time I open any speciality there is a notification about a course") */
      var space = (IS.SPEC || '') + '/' + ((IS.mySection && IS.mySection() || {}).id || '');
      if (last === null || last.u !== IS.ME.id || last.k !== space) { last = { u: IS.ME.id, k: space, id: top ? top.id : '', at: top ? top.created_at : '' }; return; }
      rows = rows.filter(function (x) { return !last.at || String(x.created_at) > String(last.at); });
      top = rows[0] || top;
      if (!top || top.id === last.id) return;
      var fresh = []; for (var i = 0; i < rows.length && rows[i].id !== last.id; i++) fresh.push(rows[i]);
      last.id = top.id; if (fresh.length) last.at = fresh[0].created_at;
      if (!fresh.length) return;
      var forTeam = fresh.some(function (x) { return x.kind === 'team'; });
      IS.chime(forTeam);
      IS.toast((fresh.length > 1 ? fresh.length + ' · ' : '') + IS.noticeTitle(fresh[0]) + (fresh[0].body ? ': ' + String(fresh[0].body).slice(0, 60) : ''));
      if (IS.bell) IS.bell();
    } catch (e) {} finally { busy = false; }
  }
  IS.checkAlerts = check;
  var tick = 0;
  setInterval(function () { tick++; if (team() || tick % 2 === 0) check(); }, 20000);   // team every 20 s, others every 40 s
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') check(); });
  if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d.ishPush) check();
    if (d.ishGo) location.hash = String(d.ishGo).replace(/^#/, '');
  });

  /* ---------- phone notifications ---------- */
  async function save(sub) {
    if (!DB.live || !IS.ME) return;
    var s = IS.mySection && IS.mySection();
    await DB.sb.rpc('ish_push_save', { p_endpoint: sub.endpoint, p_spec: IS.SPEC || null, p_cat: s ? s.id : null, p_ua: navigator.userAgent.slice(0, 200) });
    IS._pk = IS.ME.id + '/' + IS.SPEC + '/' + (s ? s.id : '');
  }
  IS.pushEnable = async function () {
    if (!CAN) { IS.toast(IOS ? A('على iPhone: اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية»، وافتح التطبيق من أيقونته ثم فعّل التنبيهات.', 'On iPhone: tap Share → Add to Home Screen, open the app from its icon, then turn alerts on.') :
      A('هذا المتصفح لا يدعم تنبيهات الهاتف. استخدم Chrome.', 'This browser does not support phone alerts. Use Chrome.'), true); return false; }
    if (!DB.live) { IS.toast(A('تنبيهات الهاتف تعمل في المنصة الحقيقية فقط.', 'Phone alerts work on the live platform only.'), true); return false; }
    try {
      var p = await Notification.requestPermission();
      if (p !== 'granted') { IS.toast(A('لم يُسمح بالتنبيهات. اسمح بها من إعدادات المتصفح لهذا الموقع.', 'Alerts were not allowed. Allow them in the browser settings for this site.'), true); return false; }
      var reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription();
      if (!sub) { var k = await fetch('/api/push?key=1', { cache: 'no-store' }).then(function (r) { return r.json(); }); sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: u8(k.key) }); }
      await save(sub); IS.LS.set('push-later', 0);
      IS.toast(A('فُعّلت التنبيهات على هذا الجهاز ✓', 'Alerts are on for this device ✓')); IS.chime(false);
      return true;
    } catch (e) { IS.toast(A('تعذّر تفعيل التنبيهات: ', 'Could not turn alerts on: ') + (e.message || ''), true); return false; }
  };
  IS.pushDisable = async function () {
    try { var reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription();
      if (sub) { if (DB.live) await DB.sb.from('push_subs').delete().eq('endpoint', sub.endpoint); await sub.unsubscribe(); } } catch (e) {}
    IS.toast(A('أُوقفت تنبيهات الهاتف على هذا الجهاز.', 'Phone alerts are off for this device.'));
  };
  async function pushOn() { try { if (!CAN || Notification.permission !== 'granted') return false; var reg = await navigator.serviceWorker.ready; return !!(await reg.pushManager.getSubscription()); } catch (e) { return false; } }
  /* the device follows the student to another speciality or section */
  async function refresh() {
    if (!CAN || !DB.live || !IS.ME || Notification.permission !== 'granted') return;
    var s = IS.mySection && IS.mySection(), key = IS.ME.id + '/' + IS.SPEC + '/' + (s ? s.id : '');
    if (IS._pk === key) return;
    try { var reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription(); if (sub) await save(sub); } catch (e) {}
  }

  /* ---------- asking once, and the switch in Settings ---------- */
  function askCard() {
    return '<div class="pushask" role="region" aria-label="' + esc(A('تنبيهات الهاتف', 'Phone alerts')) + '"><i class="pai">' + ic('bell') + '</i><div class="pat"><b>' +
      esc(team() ? A('فعّل تنبيهات الهاتف لتصلك طلبات المستخدمين فورًا', 'Turn on phone alerts to get users’ requests at once') : A('فعّل التنبيهات لتصلك المنشورات والردود على هاتفك', 'Turn on alerts for new posts and replies on your phone')) +
      '</b><small>' + esc(IOS ? A('على iPhone: أضف التطبيق إلى الشاشة الرئيسية أولًا ثم افتحه من أيقونته.', 'On iPhone: add the app to the Home Screen first, then open it from its icon.') :
        A('تصلك حتى والتطبيق مغلق، مع صوت.', 'They arrive even when the app is closed, with a sound.')) + '</small></div>' +
      '<div class="pab"><button type="button" class="btn pri sm" data-act="pushon">' + esc(A('فعّل', 'Turn on')) + '</button><button type="button" class="btn ghost sm" data-act="pushlater">' + esc(A('لاحقًا', 'Later')) + '</button></div></div>';
  }
  IS.ACT.pushon = async function (b) { b.disabled = true; var ok = await IS.pushEnable(); b.disabled = false; if (ok) { var c = b.closest('.pushask'); if (c) c.remove(); if (document.body.getAttribute('data-page') === 'settings' && IS.refresh) IS.refresh(); } };
  IS.ACT.pushlater = function (b) { IS.LS.set('push-later', Date.now() + (team() ? 1 : 3) * 864e5); var c = b.closest('.pushask'); if (c) c.remove(); };
  IS.ACT.pushoff = async function () { await IS.pushDisable(); if (IS.refresh) IS.refresh(); };
  IS.ACT.soundtoggle = function () { IS.LS.set('sound-off', IS.LS.get('sound-off', 0) ? 0 : 1); if (!IS.LS.get('sound-off', 0)) IS.chime(false); if (IS.refresh) IS.refresh(); };
  IS.ACT.pushtest = function () { IS.chime(team()); IS.toast(A('هكذا يبدو صوت التنبيه.', 'This is how an alert sounds.')); };
  var prev = IS.onRoute;
  IS.onRoute = function (name, arg, main) {
    if (prev) try { prev(name, arg, main); } catch (e) {}
    if (!main || !IS.ME) return;
    refresh(); check();
    var want = (name === 'home' || name === 'control') && DB.live && (IS.pushState() === 'default' || IS.pushState() === 'ios') && !(+IS.LS.get('push-later', 0) > Date.now());
    if (want && !main.querySelector('.pushask')) main.insertAdjacentHTML('afterbegin', askCard());
    if (name === 'settings' && !main.querySelector('.pushset')) pushOn().then(function (on) {
      var st = IS.pushState(), sound = !IS.LS.get('sound-off', 0);
      var box = '<section class="box pushset"><h2>' + ic('bell') + IS.T('التنبيهات', 'Alerts') + '</h2><div class="list">' +
        '<div class="li"><span><b>' + esc(A('تنبيهات الهاتف', 'Phone alerts')) + '</b><small>' + esc(on ? A('مفعّلة على هذا الجهاز: تصلك حتى والتطبيق مغلق.', 'On for this device: they arrive even when the app is closed.') :
          st === 'denied' ? A('ممنوعة من المتصفح. اسمح بها من إعدادات الموقع في المتصفح ثم عد هنا.', 'Blocked by the browser. Allow them in the site settings, then come back.') :
          st === 'ios' ? A('على iPhone: أضف التطبيق إلى الشاشة الرئيسية ثم افتحه من أيقونته.', 'On iPhone: add the app to the Home Screen, then open it from its icon.') :
          st === 'no' ? A('هذا المتصفح لا يدعمها. استخدم Chrome.', 'This browser does not support them. Use Chrome.') : A('غير مفعّلة على هذا الجهاز.', 'Off for this device.')) + '</small></span>' +
          (on ? '<button type="button" class="btn ghost sm" data-act="pushoff">' + esc(A('إيقاف', 'Turn off')) + '</button>' : st === 'default' || st === 'ios' || st === 'granted' ? '<button type="button" class="btn pri sm" data-act="pushon">' + esc(A('تفعيل', 'Turn on')) + '</button>' : '') + '</div>' +
        '<div class="li"><span><b>' + esc(A('صوت التنبيه داخل التطبيق', 'Alert sound in the app')) + '</b><small>' + esc(sound ? A('يعمل مع الاهتزاز عند وصول إشعار جديد.', 'Plays with a vibration when a new notification arrives.') : A('مكتوم.', 'Muted.')) + '</small></span>' +
          '<button type="button" class="btn ghost sm" data-act="soundtoggle">' + esc(sound ? A('كتم', 'Mute') : A('تشغيل', 'Turn on')) + '</button><button type="button" class="btn ghost sm" data-act="pushtest">' + ic('bell') + esc(A('جرّب', 'Test')) + '</button></div></div></section>';
      if (!main.querySelector('.pushset')) { var slot = main.querySelector('.st-alerts'); if (slot) slot.outerHTML = box.replace('class="box pushset"', 'class="st-card pushset"'); else main.insertAdjacentHTML('beforeend', box); }
    });
  };
})();
