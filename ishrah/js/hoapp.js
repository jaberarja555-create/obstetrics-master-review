/* HO Assistant inside SMRA (owner, 26 Nov 2026: "the app will be inside the house officer place and opens inside the platform, and can be
   installed as an app"). The assistant itself is the separate app in /ho/ (its own manifest and offline copy); here it opens in a frame
   under the platform bar, from Features and from the House Officer section. */
(function () {
  var A = IS.A, esc = IS.esc, ic = IS.ic;
  /* full screen like the books (owner, 26 Nov 2026: "open full on the screen with the SMRA small button beside like the other books"):
     one frame kept while the person moves around SMRA; the SMRA handle and the device Back button return to where they came from */
  var FR = null, FROM = /^#ho\b/.test(location.hash) ? '' : location.hash.slice(1);
  function host() { var h = document.getElementById('ho-host'); if (!h) { h = document.createElement('div'); h.id = 'ho-host'; h.hidden = true; document.body.appendChild(h); } return h; }
  function show() {
    var h = host();
    if (!FR) {
      FR = document.createElement('iframe'); FR.className = 'bk-fr'; FR.title = 'HO Assistant'; FR.src = '/ho/'; FR.setAttribute('allow', 'clipboard-write');
      h.appendChild(FR);
      h.insertAdjacentHTML('beforeend', '<button type="button" class="bk-back" data-act="ho-back" aria-label="' + esc(A('العودة إلى المنصة', 'Back to the platform')) + '"><span>SMRA</span></button>');
    }
    h.hidden = false; document.documentElement.classList.add('bk-open');
  }
  function hide() { var h = document.getElementById('ho-host'); if (h) h.hidden = true; if (!/^#book\//.test(location.hash)) document.documentElement.classList.remove('bk-open'); }
  IS.page('ho', function () { setTimeout(show, 0); return '<div class="bk-wait"><span class="spin"></span></div>'; });
  IS.ACT['ho-back'] = function () { hide(); IS.go(FROM && !/^ho\b/.test(FROM) ? FROM : 'home'); };
  window.addEventListener('hashchange', function () { if (!/^#ho\b/.test(location.hash)) { hide(); FROM = location.hash.slice(1); } });
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
