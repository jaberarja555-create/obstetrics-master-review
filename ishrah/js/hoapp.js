/* HO Guide inside SMRA (owner, 26 Nov 2026: "the app will be inside the house officer place and opens inside the platform, and can be
   installed as an app"). The assistant itself is the separate app in /ho/ (its own manifest and offline copy); here it opens in a frame
   under the platform bar, from Features and from the House Officer section. */
(function () {
  var A = IS.A, esc = IS.esc, ic = IS.ic;
  /* full screen like the books (owner, 26 Nov 2026: "open full on the screen with the SMRA small button beside like the other books"):
     one frame kept while the person moves around SMRA; the SMRA handle and the device Back button return to where they came from */
  var HOV = '34';   /* change with ho/sw.js C so a page that kept the frame loads the new guide */
  var FR = null, FROM = /^#ho\b/.test(location.hash) ? '' : location.hash.slice(1);
  function host() { var h = document.getElementById('ho-host'); if (!h) { h = document.createElement('div'); h.id = 'ho-host'; h.hidden = true; document.body.appendChild(h); } return h; }
  function show() {
    var h = host();
    if (!FR) {
      FR = document.createElement('iframe'); FR.className = 'bk-fr'; FR.title = 'HO Guide'; FR.src = '/ho/?v=' + HOV; FR.setAttribute('allow', 'clipboard-write');
      h.appendChild(FR);
      h.insertAdjacentHTML('beforeend', '<button type="button" class="bk-back" data-act="ho-back" aria-label="' + esc(A('العودة إلى المنصة', 'Back to the platform')) + '"><span>SMRA</span></button>');
    }
    h.hidden = false; document.documentElement.classList.add('bk-open');
  }
  function hide() { var h = document.getElementById('ho-host'); if (h) h.hidden = true; if (!/^#book\//.test(location.hash)) document.documentElement.classList.remove('bk-open'); }
  IS.page('ho', function () { setTimeout(show, 0); return '<div class="bk-wait"><span class="spin"></span></div>'; });
  /* notifications for the HO Guide (owner, 28 Nov 2026): House Officer news + the student's own, sent on request and every 40 s while it is in front */
  async function hoNotes() {
    if (!FR) return; var list = [];
    try {
      if (IS.ME && (!DB.live || navigator.onLine)) list = (await DB.q('notices', { order: ['created_at', false], limit: 80 })).filter(function (x) {
        if (x.actor === IS.ME.id) return false; if (x.user_id) return x.user_id === IS.ME.id; return x.cat === 'house' && x.status !== 'suspended';
      }).slice(0, 30).map(function (x) { return { id: x.id, t: IS.noticeTitle ? IS.noticeTitle(x) : (x.title || ''), b: String(x.body || '').slice(0, 220), at: x.created_at, link: x.link || '' }; });
    } catch (e) {}
    try { FR.contentWindow.postMessage({ ho: 'notes', list: list }, '*'); } catch (e) {}
  }
  window.addEventListener('message', function (ev) { if (FR && ev.source === FR.contentWindow && ev.data && ev.data.ho === 'notes') hoNotes(); });
  setInterval(function () { var h = document.getElementById('ho-host'); if (FR && h && !h.hidden && document.visibilityState === 'visible') hoNotes(); }, 40000);
  IS.ACT['ho-back'] = function () { hide(); IS.go(FROM && !/^ho\b/.test(FROM) ? FROM : 'home'); };
  window.addEventListener('hashchange', function () { if (!/^#ho\b/.test(location.hash)) { hide(); FROM = location.hash.slice(1); } });
  /* the HO Guide as a book (owner, 27 Nov 2026: "it must appear as a book with a name like HO Guide app"; his picture is the cover) */
  function hoBook() {
    return '<article class="bk-card ho-book"><a href="#ho" class="bk-cv" aria-label="HO Guide"><img src="' + IS.U('img/books/ho.webp') + '" alt="" width="600" height="800" loading="lazy" decoding="async"></a>' +
      '<div class="bk-tx"><span class="bk-subject">' + esc(A('طبيب الامتياز', 'House Officer')) + '</span><h2 lang="en" dir="auto"><a href="#ho">HO Guide</a></h2>' +
      '<p class="bk-authors"><bdi lang="en" dir="ltr">House Officer Clinical Guide · SMRA</bdi></p>' +
      '<p class="bk-tools">' + ic('qb') + esc(A('الجرعات المحسوبة · خطة العلاج · السوائل · الوصفة · التشخيص من الأعراض', 'Calculated doses · Treatment plans · Fluids · Prescription · Diagnosis from symptoms')) + '</p>' +
      '<a class="btn ghost sm bk-read" href="#ho">' + ic('open') + esc(A('افتح الدليل', 'Open the guide')) + '</a></div>' +
      '<div class="bk-feedback" data-ho-fb hidden></div></article>';
  }
  IS.hoBook = hoBook;
  /* On the House Officer home (owner's picture, 27 Nov 2026): cover beside «House Officer» chip, title, «House Officer Clinical Guide · SMRA»,
     stars with score, the tools line and «Open the guide»; then Paid | Like · Comment · Share · Report like the other books
     ("why the app has no comment, like, rate, share and report"). Feedback lives on its files row (supabase/066_ho_guide_feedback.sql). */
  var HOID = 'c9a994a8-e7c1-42a8-b61a-933ea9a30683';
  IS.HO_FILE = HOID;
  function hoFeed() {
    return '<article class="box feed-card feed-library feed-ho" data-go="#ho">' +
      '<div class="feed-card-content"><a class="feed-image" href="#ho" aria-label="HO Guide"><img src="' + IS.U('img/books/ho.webp') + '" alt="" width="600" height="800" loading="lazy" decoding="async"></a>' +
      '<div><div class="ho-head"><h3><a href="#ho" lang="en" dir="ltr">HO Guide</a></h3><span class="fchip ho-tag">' + esc(A('طبيب الامتياز', 'House Officer')) + '</span></div>' +
      '<p class="feed-summary"><bdi lang="en" dir="ltr">House Officer Clinical Guide · SMRA</bdi></p>' +
      '<p class="feed-stars" data-ho-stars></p>' +
      '<p class="ho-feat" dir="auto">' + esc(A('الجرعات المحسوبة · خطة العلاج · السوائل · الوصفة · التشخيص من الأعراض', 'Calculated doses · Treatment plans · Fluids · Prescription · Diagnosis from symptoms')) + '</p></div>' +
      '<div class="row library-feed-actions feed-wide-acts"><a class="btn ghost sm fopen" href="#ho">' + ic('open') + '<span>' + esc(A('افتح الدليل', 'Open the guide')) + '</span>' + ic('chev', 'fchev') + '</a></div></div>' +
      '<div data-ho-fb></div></article>';
  }
  async function hoFeedback(card) {
    try {
      if (!DB.live && !(await DB.one('files', HOID))) await DB.ins('files', { id: HOID, kind: 'master_review', spec: 'master-review', cat: 'house', status: 'published', title: 'HO Guide', author: 'SMRA' });
      var row = (await DB.q('files', { in: { id: [HOID] }, eq: { status: 'published' } }))[0];
      if (!row || !card.isConnected) return;
      var fb = card.querySelector('[data-ho-fb]'); if (!fb) return;
      if (card.classList.contains('ho-book')) {   /* on the books shelf: the same bar as the other Master Review books */
        fb.innerHTML = IS.feedVoteBar('file', row, true, 'ho'); fb.hidden = false;
      } else {
        row = Object.assign({}, row, { _lay: 1 });
        var stars = card.querySelector('[data-ho-stars]'); if (stars) stars.innerHTML = IS.libraryRating(row, true, 'file');
        fb.innerHTML = IS.feedVoteBar('file', row, true, 'ho').replace('<div class="fv-acts fv-lay">',
          '<div class="fv-acts fv-lay"><span class="fv-price"><span class="ptag paid sm">' + ic('tag') + esc(A('مدفوع', 'Paid')) + '</span></span>');
      }
      if (IS.hydrateFeedReactions) IS.hydrateFeedReactions(fb);
    } catch (e) {}
  }
  /* a link or alert to the HO Guide's record opens the guide's card */
  window.addEventListener('hashchange', function () { if (location.hash.indexOf('#file/' + HOID) === 0) IS.go('home'); });
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
    if (name === 'books' || name === 'library') setTimeout(function () { Array.prototype.forEach.call((main || document).querySelectorAll('.ho-book'), function (c) { hoFeedback(c); }); }, 0);
    var sec = IS.mySection && IS.mySection(); if (name !== 'home' || !sec || sec.id !== 'house') return;
    var tries = 0;
    (function put() {
      var m = document.getElementById('main'); if (!m) return;
      /* a saved copy of the page may already hold the card: then only its stars and buttons are loaded again */
      var have = m.querySelector('.ho-card .feed-ho'); if (have) { hoFeedback(have); return; }
      var t = m.querySelector('.mh-title'); if (!t) { if (++tries < 20) setTimeout(put, 150); return; }
      t.insertAdjacentHTML('afterend', '<div class="ho-card">' + hoFeed() + '</div>');
      hoFeedback(m.querySelector('.ho-card .feed-ho'));
    })();
  };
})();
