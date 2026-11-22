/* The academy's welcome (owner, 22 Nov 2026: «the welcome now is for the app itself; the app logo as welcome with the same sound as the book
   welcome»). Once each time the app is opened: the SMRA logo with soft gold rings, «مرحبًا بك يا د. <name>», and «ابدأ». The button plays the
   books' own opening sound (the soft three-note bell C – E – G, the same notes and timing as the books) and the screen lifts away. A button is
   needed because phones play no sound before the first touch. Not shown inside the books' frames or on the hand-over pages. */
(function () {
  'use strict';
  var A = IS.A, esc = IS.esc;
  try { if (window.top !== window.self) return; if (sessionStorage.getItem('ish-wel')) return; } catch (e) {}
  function snd() {
    try {
      var a = new (window.AudioContext || window.webkitAudioContext)(); if (a.resume) a.resume();
      var t = a.currentTime + .04, out = a.createGain(); out.gain.value = .9; out.connect(a.destination);
      [[523.25, 0, .20], [659.25, .13, .17], [783.99, .26, .19]].forEach(function (n) {
        [[1, 1], [2, .22]].forEach(function (h) {
          var o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.value = n[0] * h[0];
          g.gain.setValueAtTime(0, t + n[1]); g.gain.linearRampToValueAtTime(n[2] * h[1], t + n[1] + .025);
          g.gain.exponentialRampToValueAtTime(.0001, t + n[1] + (h[0] === 1 ? 1.5 : .7)); o.connect(g); g.connect(out); o.start(t + n[1]); o.stop(t + n[1] + 1.6);
        });
      });
      setTimeout(function () { try { a.close(); } catch (e) {} }, 2400);
    } catch (e) {}
  }
  var w = document.createElement('div'); w.id = 'smwel'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true');
  function who() { var m = IS.ME, n = m && (IS.greetingName ? IS.greetingName(m.name, true) : m.name); return n ? A('مرحبًا بك يا ', 'Welcome, ') + esc(n) : esc(A('مرحبًا بك يا دكتور', 'Welcome, Doctor')); }
  w.innerHTML = '<div class="sw-in"><span class="sw-ring r1"></span><span class="sw-ring r2"></span><img class="sw-logo" src="' + IS.U('img/mr/logo-smra.webp') + '" alt="Sudan Master Review Academy">' +
    '<h1 class="sw-t" dir="auto">' + who() + '</h1><p class="sw-s">' + esc(A('ابدأ رحلتك مع أكاديمية السودان للمراجعة الطبية', 'Start your journey with Sudan Master Review Academy')) + '</p>' +
    '<button type="button" class="sw-go">' + esc(A('ابدأ', 'Start')) + '</button></div>';
  function close() {
    try { sessionStorage.setItem('ish-wel', '1'); } catch (e) {}
    snd(); w.classList.add('go'); setTimeout(function () { if (w.parentNode) w.parentNode.removeChild(w); }, 1100);
  }
  w.querySelector('.sw-go').addEventListener('click', close);
  document.body.appendChild(w);
  /* the name arrives once the account is read */
  var tries = 0, nt = setInterval(function () { tries++; var h = w.querySelector('.sw-t'); if (h && IS.ME) { h.innerHTML = who(); clearInterval(nt); } if (tries > 40) clearInterval(nt); }, 250);
  setTimeout(function () { try { w.querySelector('.sw-go').focus(); } catch (e) {} }, 60);
})();
