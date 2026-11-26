/* HO Assistant inside SMRA (owner, 26 Nov 2026: "the app will be inside the house officer place and opens inside the platform, and can be
   installed as an app"). The assistant itself is the separate app in /ho/ (its own manifest and offline copy); here it opens in a frame
   under the platform bar, from Features and from the House Officer section. */
(function () {
  var A = IS.A, esc = IS.esc, ic = IS.ic;
  IS.page('ho', function () {
    return '<div class="ho-wrap"><div class="ho-bar"><b>🩺 ' + esc(A('مساعد طبيب الامتياز', 'HO Assistant')) + '</b><span>' + esc(A('الأطفال · دليل كسلا 2024', 'Paediatrics · Kassala 2024')) + '</span>' +
      '<a class="btn" href="/ho/" target="_blank" rel="noopener">📲 ' + esc(A('افتح كتطبيق', 'Open as app')) + '</a></div>' +
      '<iframe class="ho-fr" src="/ho/" title="HO Assistant"></iframe></div>';
  });
  function tile() { return '<a href="#ho" class="ho-feat">' + '<span class="ic">🩺</span><span>' + esc(A('مساعد الامتياز', 'HO Assistant')) + '</span></a>'; }
  var feat0 = IS.ACT.mrfeat;
  if (feat0) IS.ACT.mrfeat = function () { var r = feat0.apply(this, arguments), g = document.querySelector('#sheet .mr-feat');
    if (g && !g.querySelector('.ho-feat')) g.insertAdjacentHTML('afterbegin', tile());
    return r; };
  /* a card at the top of the House Officer section's Home */
  var on0 = IS.onRoute;
  IS.onRoute = function (name, arg, main) {
    if (on0) try { on0(name, arg, main); } catch (e) {}
    var sec = IS.mySection && IS.mySection(); if (name !== 'home' || !sec || sec.id !== 'house') return;
    var tries = 0;
    (function put() {
      var m = document.getElementById('main'); if (!m || m.querySelector('.ho-card')) return;
      var t = m.querySelector('.mh-title'); if (!t) { if (++tries < 20) setTimeout(put, 150); return; }
      t.insertAdjacentHTML('afterend', '<a href="#ho" class="ho-card"><span class="ho-ci">🩺</span><span class="ho-ct"><b>' + esc(A('مساعد طبيب الامتياز', 'HO Assistant')) + '</b><small>' +
      esc(A('أدخل بيانات المريض: الأدوية بخطوط العلاج، الجرعات المحسوبة، السوائل، الوصفة والفحوصات', 'Enter the patient: drug lines, calculated doses, fluids, prescription and investigations')) + '</small></span><span class="ho-go">' + esc(A('افتح', 'Open')) + '</span></a>');
    })();
  };
})();
