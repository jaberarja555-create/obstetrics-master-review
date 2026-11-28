/* SMRA Permanent Exam inside SMRA (owner, 28 Nov 2026: "in the house officer place, same design as the HO Guide and books").
   The exam bank is the separate app in /exam/ (its own manifest and offline copy); here it opens full-screen in a frame with the SMRA
   handle, from the House Officer section, the books shelf and Features — exactly like the HO Guide. */
(function () {
  var A = IS.A, esc = IS.esc, ic = IS.ic;
  var EXV = '4';   /* bump with exam/sw.js C so a page that kept the frame loads the new version */
  var FR = null, FROM = /^#exam\b/.test(location.hash) ? '' : location.hash.slice(1);
  function host() { var h = document.getElementById('ex-host'); if (!h) { h = document.createElement('div'); h.id = 'ex-host'; h.hidden = true; document.body.appendChild(h); } return h; }
  function show() {
    var h = host();
    if (!FR) {
      FR = document.createElement('iframe'); FR.className = 'bk-fr'; FR.title = 'SMRA Permanent Exam'; FR.src = '/exam/?v=' + EXV; FR.setAttribute('allow', 'clipboard-write');
      h.appendChild(FR);
      h.insertAdjacentHTML('beforeend', '<button type="button" class="bk-back" data-act="ex-back" aria-label="' + esc(A('العودة إلى المنصة', 'Back to the platform')) + '"><span>SMRA</span></button>');
    }
    h.hidden = false; document.documentElement.classList.add('bk-open');
  }
  function hide() { var h = document.getElementById('ex-host'); if (h) h.hidden = true; if (!/^#book\//.test(location.hash)) document.documentElement.classList.remove('bk-open'); }
  IS.page('exam', function () { setTimeout(show, 0); return '<div class="bk-wait"><span class="spin"></span></div>'; });
  IS.ACT['ex-back'] = function () { hide(); IS.go(FROM && !/^exam\b/.test(FROM) ? FROM : 'home'); };
  window.addEventListener('hashchange', function () { if (!/^#exam\b/.test(location.hash)) { hide(); FROM = location.hash.slice(1); } });

  var EXID = '4c00d0f9-ed8e-465e-ac56-37cafe1980bc';
  IS.EXAM_FILE = EXID;
  var COVER = 'img/books/perm.webp', TITLE = 'Permanent Exam', SUB = 'Sudan Medical Council · Questions Bank · SMRA';

  /* Paid access bridge (owner, 28 Nov 2026). The exam frame ships the question bank encrypted; the key is given only to a
     device allowed to open the Permanent Exam file (owner, library staff or an active purchase). The frame asks us for it
     (postMessage {exam:'key'}); we answer with the key + price + Bankak, reusing the platform's own paid-file flow. A locked
     device gets a free preview and a Subscribe button that opens the platform's buy sheet ({exam:'buy'}). */
  async function examState() {
    var key = null, st = { open: false, price: 0, pending: false };
    try {
      if (DB.live) {
        var r = await DB.sb.rpc('ish_exam_state'); if (!r.error && r.data) st = r.data;
        if (st.open) { var kr = await DB.sb.rpc('ish_exam_key'); if (!kr.error && kr.data) key = kr.data; }
      } else { st.open = true; }   /* local preview without Supabase: the frame uses its bundled data.js */
    } catch (e) {}
    return { exam: 'state', key: key, open: !!st.open, price: st.price || 0, pending: !!st.pending,
      bankak: (IS.SET && IS.SET.bankak_account) ? { account: IS.SET.bankak_account, name: IS.SET.bankak_name } : null,
      name: (IS.ME && IS.ME.name) || '' };
  }
  window.addEventListener('message', function (ev) {
    if (!FR || ev.source !== FR.contentWindow) return;
    var d = ev.data; if (!d || d.exam == null) return;
    if (d.exam === 'key') { examState().then(function (s) { try { FR.contentWindow.postMessage(s, '*'); } catch (e) {} }); return; }
    if (d.exam === 'buy') { hide(); if (!IS.ME) { if (IS.ACT.login) IS.ACT.login(); return; } if (IS.ACT.buyfile) IS.ACT.buyfile({ dataset: { id: EXID } }); return; }
  });

  /* on the books shelf — a book card like the Master Review books */
  function examBook() {
    return '<article class="bk-card exam-book"><a href="#exam" class="bk-cv" aria-label="' + esc(TITLE) + '"><img src="' + IS.U(COVER) + '" alt="" width="600" height="900" loading="lazy" decoding="async"></a>' +
      '<div class="bk-tx"><span class="bk-subject">' + esc(A('طبيب الامتياز', 'House Officer')) + '</span><h2 lang="en" dir="auto"><a href="#exam">' + esc(TITLE) + '</a></h2>' +
      '<p class="bk-authors"><bdi lang="en" dir="ltr">' + esc(SUB) + '</bdi></p>' +
      '<p class="bk-tools">' + ic('qb') + esc(A('بنك أسئلة الامتحان الدائم · شرح · امتحان تجريبي · تقييم التقدم', 'Permanent exam bank · explanations · mock exam · progress')) + '</p>' +
      '<a class="btn ghost sm bk-read" href="#exam">' + ic('open') + esc(A('ابدأ', 'Open the bank')) + '</a></div>' +
      '<div class="bk-feedback" data-ex-fb hidden></div></article>';
  }
  IS.examBook = examBook;

  /* on the House Officer home — the same layout as the HO Guide card: cover, title + chip, subtitle, tools line, Open; then Paid | Like · Comment · Share · Report */
  function examFeed() {
    return '<article class="box feed-card feed-library feed-ho feed-exam" data-go="#exam">' +
      '<div class="feed-card-content"><a class="feed-image" href="#exam" aria-label="' + esc(TITLE) + '"><img src="' + IS.U(COVER) + '" alt="" width="600" height="900" loading="lazy" decoding="async"></a>' +
      '<div><div class="ho-head"><h3><a href="#exam" lang="en" dir="ltr">' + esc(TITLE) + '</a></h3><span class="fchip ho-tag">' + esc(A('طبيب الامتياز', 'House Officer')) + '</span></div>' +
      '<p class="feed-summary"><bdi lang="en" dir="ltr">' + esc(SUB) + '</bdi></p>' +
      '<p class="feed-stars" data-ex-stars></p>' +
      '<p class="ho-feat" dir="auto">' + esc(A('بنك أسئلة الامتحان الدائم مع الشرح · امتحان تجريبي · مذاكرة بالوقت أو التعلّم · تقييم التقدم', 'Permanent exam bank with explanations · mock exam · timed or tutor · progress assessment')) + '</p></div>' +
      '<div class="row library-feed-actions feed-wide-acts"><a class="btn ghost sm fopen" href="#exam">' + ic('open') + '<span>' + esc(A('ابدأ البنك', 'Open the bank')) + '</span>' + ic('chev', 'fchev') + '</a></div></div>' +
      '<div data-ex-fb></div></article>';
  }
  async function examFeedback(card) {
    try {
      if (!DB.live && !(await DB.one('files', EXID))) await DB.ins('files', { id: EXID, kind: 'master_review', spec: 'master-review', cat: 'house', status: 'published', title: TITLE, author: 'SMRA' });
      var row = (await DB.q('files', { in: { id: [EXID] }, eq: { status: 'published' } }))[0];
      if (!row || !card.isConnected) return;
      var fb = card.querySelector('[data-ex-fb]'); if (!fb) return;
      if (card.classList.contains('exam-book')) {
        fb.innerHTML = IS.feedVoteBar('file', row, true, 'exam'); fb.hidden = false;
      } else {
        row = Object.assign({}, row, { _lay: 1 });
        var stars = card.querySelector('[data-ex-stars]'); if (stars) stars.innerHTML = IS.libraryRating(row, true, 'file');
        fb.innerHTML = IS.feedVoteBar('file', row, true, 'exam').replace('<div class="fv-acts fv-lay">',
          '<div class="fv-acts fv-lay"><span class="fv-price"><span class="ptag paid sm">' + ic('tag') + esc(A('مدفوع', 'Paid')) + '</span></span>');
      }
      if (IS.hydrateFeedReactions) IS.hydrateFeedReactions(fb);
    } catch (e) {}
  }
  window.addEventListener('hashchange', function () { if (location.hash.indexOf('#file/' + EXID) === 0) IS.go('home'); });

  /* add to the books shelf after the HO Guide */
  var shelf0 = IS.booksShelf;
  if (shelf0) IS.booksShelf = function () { var h = shelf0.apply(this, arguments); return h.indexOf('ho-book') >= 0 ? h.replace('</article>', '</article>' + examBook(), 1) : h.replace('<div class="bk-row">', '<div class="bk-row">' + examBook()); };

  function tile() { return '<a href="#exam" class="ho-feat"><span class="ic">📝</span><span>' + esc(TITLE) + '</span></a>'; }
  var feat0 = IS.ACT.mrfeat;
  if (feat0) IS.ACT.mrfeat = function () { var r = feat0.apply(this, arguments), g = document.querySelector('#sheet .mr-feat'); if (g && !g.querySelector('.ho-feat[href="#exam"]')) { var ho = g.querySelector('.ho-feat'); if (ho) ho.insertAdjacentHTML('afterend', tile()); else g.insertAdjacentHTML('afterbegin', tile()); } return r; };

  /* the card on the House Officer home (under the HO Guide card) and on the books / library grid */
  var on0 = IS.onRoute;
  IS.onRoute = function (name, arg, main) {
    if (on0) try { on0(name, arg, main); } catch (e) {}
    if (name === 'books' && !arg) { var gd = (main || document).querySelector('.bk-grid'); if (gd && !gd.querySelector('.exam-book')) { var ho = gd.querySelector('.ho-book'); if (ho) ho.insertAdjacentHTML('afterend', examBook()); else gd.insertAdjacentHTML('afterbegin', examBook()); } }
    if (name === 'books' || name === 'library') setTimeout(function () { Array.prototype.forEach.call((main || document).querySelectorAll('.exam-book'), function (c) { examFeedback(c); }); }, 0);
    var sec = IS.mySection && IS.mySection(); if (name !== 'home' || !sec || sec.id !== 'house') return;
    var tries = 0;
    (function put() {
      var m = document.getElementById('main'); if (!m) return;
      var have = m.querySelector('.exam-card .feed-exam'); if (have) { examFeedback(have); return; }
      var hoCard = m.querySelector('.ho-card');
      if (hoCard) { hoCard.insertAdjacentHTML('afterend', '<div class="exam-card ho-card">' + examFeed() + '</div>'); examFeedback(m.querySelector('.exam-card .feed-exam')); return; }
      var t = m.querySelector('.mh-title'); if (!t) { if (++tries < 25) setTimeout(put, 150); return; }
      t.insertAdjacentHTML('afterend', '<div class="exam-card ho-card">' + examFeed() + '</div>');
      examFeedback(m.querySelector('.exam-card .feed-exam'));
    })();
  };
})();
