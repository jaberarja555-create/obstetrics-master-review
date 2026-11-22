/* A short opening before every lesson video (owner, 22 Nov 2026: «Introduction بسيط بيدي شكل انو الفيديو من المنصه حقتنا بال logo»).
   About 4 seconds over the player: the SMRA emblem rises with a gold glow, the academy's name in Arabic and English, a gold line, then the
   course and lesson titles. For a paid lesson it ends with one line: the content is for this account only and sharing it outside the platform
   is not allowed (owner chose this instead of a watermark). «تخطّي» skips it. The lesson's own video waits (a <video> is paused until the
   opening ends; YouTube / Drive frames do not play by themselves). Drawn in HTML and CSS: nothing is added to the video files.
   Sound (owner, 22 Nov 2026: «أضف صوت جميل»): a soft warm chord with a rising bell (C – E – G – C) and a small shimmer when the emblem
   appears, made by the browser (Web Audio, no file to download), quiet, about 2.5 s; «تخطّي» fades it out. */
(function () {
  'use strict';
  var A = IS.A, esc = IS.esc;
  /* the opening sound, built from a few soft tones; `ctx` may be an OfflineAudioContext (used to record a sample) */
  IS.introSound = function (ctx, at) {
    var t0 = (at || 0) + ctx.currentTime, out = ctx.createGain(); out.gain.value = 1.3; out.connect(ctx.destination);
    var echo = ctx.createDelay(1); echo.delayTime.value = 0.22; var fb = ctx.createGain(); fb.gain.value = 0.28; var wet = ctx.createGain(); wet.gain.value = 0.35;
    echo.connect(fb); fb.connect(echo); echo.connect(wet); wet.connect(out);
    function tone(f, start, len, vol, type, attack) {
      var o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + start); g.gain.exponentialRampToValueAtTime(vol, t0 + start + (attack || 0.02));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + start + len);
      o.connect(g); g.connect(out); g.connect(echo); o.start(t0 + start); o.stop(t0 + start + len + 0.05);
    }
    /* a warm pad under everything */
    [261.63, 329.63, 392].forEach(function (f) { tone(f, 0, 2.6, 0.035, 'triangle', 0.5); });
    /* the bell: each note with a quiet octave above it */
    [[523.25, 0.25], [659.25, 0.45], [783.99, 0.65], [1046.5, 0.9]].forEach(function (n, i) {
      tone(n[0], n[1], i === 3 ? 2.2 : 1.4, i === 3 ? 0.16 : 0.12); tone(n[0] * 2, n[1], 0.9, 0.025);
    });
    /* the sparkle on the star */
    [2093, 2637, 3136].forEach(function (f, i) { tone(f, 1.15 + i * 0.07, 0.5, 0.018); });
    return out;
  };
  var AC = null;
  function playSound() {
    try {
      if (localStorage.getItem('ish-intro-sound') === 'off') return null;
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === 'suspended') AC.resume();
      return IS.introSound(AC, 0.05);
    } catch (e) { return null; }
  }
  IS.videoIntro = function (player, o) {
    if (!player || player.querySelector('.vi')) return;
    o = o || {};
    var paid = !!o.paid, total = paid ? 5600 : 4000, done = false;
    var v = player.querySelector('video'); if (v) { v.pause(); v.removeAttribute('autoplay'); }
    var el = document.createElement('div');
    el.className = 'vi' + (paid ? ' paid' : '');
    el.setAttribute('role', 'presentation');
    el.innerHTML = '<span class="vi-sweep"></span><span class="vi-glow"></span>' +
      '<div class="vi-c"><img class="vi-mark" src="' + IS.U('img/mr/smra-mark.webp') + '" alt="">' +
      '<b class="vi-ar">أكاديمية السودان للمراجعة الطبية</b><span class="vi-en" lang="en" dir="ltr">SUDAN MASTER REVIEW ACADEMY</span>' +
      '<i class="vi-line"></i>' +
      (o.course ? '<span class="vi-course" dir="auto">' + esc(o.course) + '</span>' : '') +
      (o.lesson ? '<span class="vi-lesson" dir="auto">' + esc(o.lesson) + '</span>' : '') +
      (paid ? '<span class="vi-lock">🔒 ' + esc(A('هذا المحتوى لحسابك فقط. نشره أو تصويره خارج المنصة ممنوع ويؤدي إلى إيقاف الحساب.',
        'This content is for your account only. Sharing or recording it outside the platform is not allowed and suspends the account.')) + '</span>' : '') +
      '</div><button type="button" class="vi-skip">' + esc(A('تخطّي', 'Skip')) + ' ›</button>';
    player.appendChild(el);
    var snd = playSound();
    function end() {
      if (done) return; done = true; el.classList.add('out');
      if (snd && AC) { try { snd.gain.setTargetAtTime(0.0001, AC.currentTime, 0.15); } catch (e) {} }
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 500);
    }
    el.querySelector('.vi-skip').addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); end(); });
    setTimeout(end, total);
  };
})();
