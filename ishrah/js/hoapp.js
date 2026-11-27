/* HO Guide inside SMRA (owner, 26 Nov 2026: "the app will be inside the house officer place and opens inside the platform, and can be
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
      FR = document.createElement('iframe'); FR.className = 'bk-fr'; FR.title = 'HO Guide'; FR.src = '/ho/'; FR.setAttribute('allow', 'clipboard-write');
      h.appendChild(FR);
      h.insertAdjacentHTML('beforeend', '<button type="button" class="bk-back" data-act="ho-back" aria-label="' + esc(A('العودة إلى المنصة', 'Back to the platform')) + '"><span>SMRA</span></button>');
    }
    h.hidden = false; document.documentElement.classList.add('bk-open');
  }
  function hide() { var h = document.getElementById('ho-host'); if (h) h.hidden = true; if (!/^#book\//.test(location.hash)) document.documentElement.classList.remove('bk-open'); }
  IS.page('ho', function () { setTimeout(show, 0); return '<div class="bk-wait"><span class="spin"></span></div>'; });
  IS.ACT['ho-back'] = function () { hide(); IS.go(FROM && !/^ho\b/.test(FROM) ? FROM : 'home'); };
  window.addEventListener('hashchange', function () { if (!/^#ho\b/.test(location.hash)) { hide(); FROM = location.hash.slice(1); } });
  /* the HO Guide as a book (owner, 27 Nov 2026: "it must appear as a book with a name like HO Guide app"; his picture is the cover) */
  function hoBook() {
    return '<article class="bk-card ho-book"><a href="#ho" class="bk-cv" aria-label="HO Guide"><img src="' + IS.U('img/books/ho.webp') + '" alt="" width="600" height="800" loading="lazy" decoding="async"></a>' +
      '<div class="bk-tx"><span class="bk-subject">' + esc(A('طبيب الامتياز', 'House Officer')) + '</span><h2 lang="en" dir="auto"><a href="#ho">HO Guide</a></h2>' +
      '<p class="bk-authors"><bdi lang="en" dir="ltr">House Officer Clinical Guide · SMRA</bdi></p>' +
      '<p class="bk-tools">' + ic('qb') + esc(A('الجرعات المحسوبة · خطة العلاج · السوائل · الوصفة · التشخيص من الأعراض', 'Calculated doses · Treatment plans · Fluids · Prescription · Diagnosis from symptoms')) + '</p>' +
      '<a class="btn ghost sm bk-read" href="#ho">' + ic('open') + esc(A('افتح الدليل', 'Open the guide')) + '</a></div></article>';
  }
  IS.hoBook = hoBook;
  var shelf0 = IS.booksShelf;
  if (shelf0) IS.booksShelf = function () { return shelf0.apply(this, arguments).replace('<div class="bk-row">', '<div class="bk-row">' + hoBook()); };
  function tile() { return '<a href="#ho" class="ho-feat">' + '<span class="ic">🩺</span><span>HO Guide</span></a>'; }
  var feat0 = IS.ACT.mrfeat;
  if (feat0) IS.ACT.mrfeat = function () { var r = feat0.apply(this, arguments), g = document.querySelector('#sheet .mr-feat');
    if (g && !g.querySelector('.ho-feat')) g.insertAdjacentHTML('afterbegin', tile());
    return r; };
  /* a card at the top of the House Officer section's Home */
  var on0 = IS.onRoute;
  IS.onRoute = function (name, arg, main) {
    if (on0) try { on0(name, arg, main); } catch (e) {}
    if (name === 'books' && !arg) { var gd = (main || document).querySelector('.bk-grid'); if (gd && !gd.querySelector('.ho-book')) gd.insertAdjacentHTML('afterbegin', hoBook()); }
    var sec = IS.mySection && IS.mySection(); if (name !== 'home' || !sec || sec.id !== 'house') return;
    var tries = 0;
    (function put() {
      var m = document.getElementById('main'); if (!m || m.querySelector('.ho-card')) return;
      var t = m.querySelector('.mh-title'); if (!t) { if (++tries < 20) setTimeout(put, 150); return; }
      t.insertAdjacentHTML('afterend', '<div class="ho-card">' + hoBook() + '</div>');
    })();
  };
})();
