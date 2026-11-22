/* The three books inside SMRA (ishrah/PLAN-one-platform.md, stage 2; owner, 22 Nov 2026: «the books with their features open inside the
   platform»). `#books` = the shelf; `#book/<id>` = the book full screen, served from the same address (/books/<id>/, functions/books), so it
   keeps every feature of the book (reader, highlights, notes, pen, flashcards, question bank, Rapid Review, progress, sync, subscription).
   A small handle at the edge and the book's own «المكتبة» button come back to SMRA; the device Back button works too. The books shelf also
   shows at the top of My Library. Until stage 3 the book keeps its own subscription system. */
(function () {
  'use strict';
  var A = IS.A, esc = IS.esc;
  var BOOKS = IS.BOOKS = [
    { id: 'surgery', en: 'Surgery Master Review', ar: 'الجراحة', sub: ['Clinical', 'سريري'] },
    { id: 'pediatrics', en: 'Pediatric Master Review', ar: 'الأطفال', sub: ['Clinical', 'سريري'] },
    { id: 'obstetrics', en: 'Obstetrics Master Review', ar: 'النساء والتوليد', sub: ['Clinical', 'سريري'] },
  ];
  function book(id) { return BOOKS.filter(function (b) { return b.id === id; })[0]; }
  function card(b) {
    return '<a class="bk-card" href="#book/' + b.id + '"><span class="bk-cv"><img src="' + IS.U('img/books/' + b.id + '.webp') + '" alt="" loading="lazy"></span>' +
      '<span class="bk-tx"><b lang="en" dir="ltr">' + esc(b.en) + '</b><small>' + esc(A('كتاب ', 'Book · ') + A(b.ar, b.sub[0])) + '</small><em>' + esc(A('افتح الكتاب', 'Open the book')) + ' ‹</em></span></a>';
  }
  IS.booksShelf = function () {
    return '<section class="bk-shelf"><header><h2>📚 ' + esc(A('كتب Master Review', 'Master Review books')) + '</h2><a href="#books">' + esc(A('الكل', 'All')) + '</a></header>' +
      '<div class="bk-row">' + BOOKS.map(card).join('') + '</div></section>';
  };
  IS.page('books', function () {
    return '<section class="box bk-page"><h1 tabindex="-1">📚 ' + esc(A('كتب Master Review', 'Master Review books')) + '</h1><p class="mut">' +
      esc(A('الكتب كاملة بكل أدواتها: القراءة والتظليل والملاحظات والقلم والبطاقات وبنك الأسئلة والمراجعة السريعة، وتعمل دون إنترنت بعد أول فتح.',
        'The full books with all their tools: reading, highlights, notes, pen, flashcards, question bank and Rapid Review. They work offline after the first opening.')) +
      '</p><div class="bk-grid">' + BOOKS.map(card).join('') + '</div></section>';
  });
  /* the book, full screen; the frame is kept while the person moves around SMRA, so coming back is instant */
  var FR = {};
  function host() { var h = document.getElementById('bk-host'); if (!h) { h = document.createElement('div'); h.id = 'bk-host'; document.body.appendChild(h); } return h; }
  function showBook(id) {
    var h = host(), b = book(id); if (!b) return;
    Object.keys(FR).forEach(function (k) { FR[k].hidden = k !== id; });
    if (!FR[id]) {
      var f = document.createElement('iframe'); f.className = 'bk-fr'; f.title = b.en; f.src = '/books/' + id + '/';
      f.setAttribute('allow', 'fullscreen; clipboard-write; autoplay');
      h.appendChild(f); FR[id] = f;
    }
    if (!h.querySelector('.bk-back')) h.insertAdjacentHTML('beforeend', '<button type="button" class="bk-back" data-act="bk-back" aria-label="' + esc(A('العودة إلى المنصة', 'Back to the platform')) + '"><span>SMRA</span></button>');
    h.hidden = false; document.documentElement.classList.add('bk-open');
    try { localStorage.setItem('ish-lastbook', id); } catch (e) {}
  }
  function hideBook() { var h = document.getElementById('bk-host'); if (h) h.hidden = true; document.documentElement.classList.remove('bk-open'); }
  IS.page('book', function (id) {
    if (!book(id)) return null;
    setTimeout(function () { showBook(id); }, 0);
    return '<div class="bk-wait"><span class="spin"></span></div>';
  });
  /* the page the person came from (the book's own page changes also go into the browser history, so «back» is not used) */
  var FROM = /^#book\//.test(location.hash) ? '' : location.hash.slice(1);
  IS.ACT['bk-back'] = function () { hideBook(); IS.go(FROM && !/^book\//.test(FROM) ? FROM : 'books'); };
  /* leaving #book/… hides the book (the frame stays loaded) */
  window.addEventListener('hashchange', function () { if (!/^#book\//.test(location.hash)) { hideBook(); FROM = location.hash.slice(1); } });
  /* the book's own «المكتبة» button */
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data || typeof e.data !== 'object') return;
    if (e.data.smr === 'library') { hideBook(); IS.go('books'); }
  });
  /* My Library starts with the books */
  var r0 = IS.onRoute;
  IS.onRoute = function (name) {
    if (r0) try { r0.apply(this, arguments); } catch (e) {}
    if (name !== 'library') return;
    var main = document.getElementById('main'); if (!main || main.querySelector('.bk-shelf')) return;
    /* under the «محتوى المكتبة» title and the filter bar, before the files */
    var at = main.querySelector('.mh-lib'), t = main.querySelector('.mh-title');
    if (at) at.insertAdjacentHTML('afterbegin', IS.booksShelf()); else if (t) t.insertAdjacentHTML('afterend', IS.booksShelf());
  };
})();
