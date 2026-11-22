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
      '</p><div class="bk-grid">' + BOOKS.map(card).join('') + '</div>' +
      '<div class="bk-inst"><h2>📲 ' + esc(A('ثبّت كتابًا كتطبيق مستقل', 'Install a book as its own app')) + '</h2><p class="mut">' +
      esc(A('يظهر الكتاب على شاشة هاتفك بأيقونته ويفتح مباشرة، بنفس حسابك وبياناتك، وزر SMRA على الجانب ينقلك إلى المنصة.', 'The book gets its own icon on your phone and opens straight away, with the same account and data; the SMRA button on the side takes you to the platform.')) +
      '</p><div class="bk-ibtns">' + BOOKS.map(function (b) { return '<button type="button" class="btn ghost" data-act="bk-install" data-v="' + b.id + '"><img src="' + IS.U('img/apps/' + b.id + '-192.png') + '" alt="">' + esc(A('ثبّت ', 'Install ')) + '<bdi lang="en" dir="ltr">' + esc(b.en.replace(' Master Review', '')) + '</bdi></button>'; }).join('') + '</div></div></section>';
  });
  /* the book, full screen; the frame is kept while the person moves around SMRA, so coming back is instant */
  var FR = {};
  function host() { var h = document.getElementById('bk-host'); if (!h) { h = document.createElement('div'); h.id = 'bk-host'; h.hidden = true; document.body.appendChild(h); } return h; }
  function showBook(id) {
    var h = host(), b = book(id); if (!b) return;
    Object.keys(FR).forEach(function (k) { FR[k].hidden = k !== id; });
    if (!FR[id]) {
      var f = document.createElement('iframe'); f.className = 'bk-fr'; f.title = b.en; f.src = '/books/' + id + '/';
      f.setAttribute('allow', 'fullscreen; clipboard-write; autoplay');
      h.appendChild(f); FR[id] = f; quiet(f, id);
    }
    if (!h.querySelector('.bk-back')) h.insertAdjacentHTML('beforeend', '<button type="button" class="bk-back" data-act="bk-back" aria-label="' + esc(A('العودة إلى المنصة', 'Back to the platform')) + '"><span>SMRA</span></button>');
    h.hidden = false; document.documentElement.classList.add('bk-open');
    try { localStorage.setItem('ish-lastbook', id); } catch (e) {}
  }
  /* inside the academy the book opens straight to its content (owner, 22 Nov 2026: «the books should open without welcome; the welcome now
     is for the app itself»): the frame is on the same address, so its welcome screen, its tour and its first-opening choices are hidden as
     soon as its page exists, and the tour is marked as seen */
  var PX = { surgery: 'srr', pediatrics: 'prr', obstetrics: 'orr' };
  function quiet(f, id) {
    try { localStorage.setItem(PX[id] + '-btour', '1'); } catch (e) {}
    var n = 0, t = setInterval(function () {
      n++; var d = null; try { d = f.contentDocument; } catch (e) {}
      if (d && d.head && d.location && /\/books\//.test(d.location.pathname) && !d.getElementById('smra-quiet')) {
        var st = d.createElement('style'); st.id = 'smra-quiet';
        st.textContent = '#v2wel,#v2chz,.v2bt{display:none!important}';
        d.head.appendChild(st);
      }
      if (n > 200) clearInterval(t);   /* 10 s, also after the book reloads itself */
      if (d && d.getElementById('smra-quiet') && d.readyState === 'complete' && n > 40) clearInterval(t);
    }, 50);
    f.addEventListener('load', function () { quiet2(f); });
  }
  function quiet2(f) { try { var d = f.contentDocument; if (d && d.head && !d.getElementById('smra-quiet')) { var st = d.createElement('style'); st.id = 'smra-quiet'; st.textContent = '#v2wel,#v2chz,.v2bt{display:none!important}'; d.head.appendChild(st); } } catch (e) {} }
  function hideBook() { var h = document.getElementById('bk-host'); if (h) h.hidden = true; document.documentElement.classList.remove('bk-open'); }
  IS.page('book', function (id) {
    if (!book(id)) return null;
    setTimeout(function () { showBook(id); }, 0);
    return '<div class="bk-wait"><span class="spin"></span></div>';
  });
  /* the page the person came from (the book's own page changes also go into the browser history, so «back» is not used) */
  var FROM = /^#book\//.test(location.hash) ? '' : location.hash.slice(1);
  /* opened as the book's own app (/?app=<book>): the SMRA handle goes into the platform */
  IS.ACT['bk-back'] = function () { hideBook(); IS.go(FROM && !/^book\//.test(FROM) ? FROM : window.ISH_APP ? 'home' : 'books'); };
  /* installing a book as its own app (owner, 22 Nov 2026): the install file of a page is fixed when it opens, so the button first opens
     /?app=<book>#book/<book> (index.html then offers apps/<book>.webmanifest), then shows the install window or the steps for the phone */
  var BIP = null;
  window.addEventListener('beforeinstallprompt', function (e) { if (window.ISH_APP) { e.preventDefault(); BIP = e; } });
  IS.ACT['bk-install'] = function (b) {
    var id = b.getAttribute('data-v'); if (!book(id)) return;
    if (window.ISH_APP !== id) { try { sessionStorage.setItem('ish-inst', id); } catch (e) {} location.href = '/?app=' + id + '#book/' + id; return; }
    instSheet(id);
  };
  function instSheet(id) {
    var b = book(id), name = b.en.replace(' Master Review', ''), ua = navigator.userAgent || '';
    var standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    var ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document), android = /Android/.test(ua);
    var steps = ios ? [A('افتح هذه الصفحة في Safari.', 'Open this page in Safari.'), A('اضغط زر المشاركة ⬆️ أسفل الشاشة.', 'Tap the Share button ⬆️ at the bottom.'), A('اختر «إضافة إلى الشاشة الرئيسية» ثم «إضافة».', 'Choose «Add to Home Screen», then «Add».')] :
      android ? [A('افتح هذه الصفحة في Chrome.', 'Open this page in Chrome.'), A('اضغط ⋮ في أعلى الشاشة.', 'Tap ⋮ at the top.'), A('اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».', 'Choose «Install app» or «Add to Home screen».')] :
      [A('في Chrome أو Edge اضغط زر التثبيت في شريط العنوان، أو القائمة ← «تثبيت».', 'In Chrome or Edge press the install button in the address bar, or the menu → «Install».')];
    IS.sheet('📲 ' + esc(A('ثبّت كتاب ', 'Install ')) + '<bdi lang="en" dir="ltr">' + esc(name) + '</bdi>',
      '<div class="bk-isheet"><img src="' + IS.U('img/apps/' + id + '-192.png') + '" alt=""><p>' + esc(A('سيظهر الكتاب على شاشة هاتفك بأيقونته ويفتح مباشرة. زر SMRA على الجانب ينقلك إلى المنصة، وحسابك وبياناتك نفسها.', 'The book will appear on your phone with its own icon and open straight away. The SMRA button on the side takes you to the platform; your account and data are the same.')) + '</p>' +
      (standalone && window.ISH_APP === id ? '<p class="note ok">' + esc(A('أنت تستعمل الكتاب كتطبيق الآن.', 'You are using the book as an app now.')) + '</p>' :
        BIP ? '<button type="button" class="btn pri wide" id="bkInstGo">' + esc(A('ثبّت الآن', 'Install now')) + '</button>' :
        '<ol class="bk-steps">' + steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>') + '</div>', { nofocus: 1 });
    var go = document.getElementById('bkInstGo');
    if (go) go.onclick = function () { var e = BIP; BIP = null; IS.closeSheet(); e.prompt(); e.userChoice.then(function (c) { if (c && c.outcome === 'accepted') IS.toast(A('ثُبّت الكتاب. تجده على شاشة هاتفك.', 'Installed. You will find the book on your home screen.')); }).catch(function () {}); };
  }
  if (window.ISH_APP) { var want = ''; try { want = sessionStorage.getItem('ish-inst'); sessionStorage.removeItem('ish-inst'); } catch (e) {}
    if (want === window.ISH_APP) setTimeout(function () { instSheet(want); }, 1500); }
  /* leaving #book/… hides the book (the frame stays loaded) */
  window.addEventListener('hashchange', function () { if (!/^#book\//.test(location.hash)) { hideBook(); FROM = location.hash.slice(1); } });
  /* the book's own «المكتبة» button */
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data || typeof e.data !== 'object') return;
    if (e.data.smr === 'library') { hideBook(); IS.go('books'); }
  });
  /* Every book ready without internet, even one never opened (owner, 22 Nov 2026: «if someone opens the app but no book, the second time
     he opens a book he should not need internet»), and no waiting (the last opened book is ready at once).
     While the app is online and the person is not touching it, each book that has no saved copy yet is loaded once in a hidden frame, one at a
     time: its own service worker saves the book on the phone (page, scripts, pictures). Not on data-saver connections. The last opened book
     is then kept ready (hidden) so it opens instantly. */
  var TOUCH = Date.now();
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, function () { TOUCH = Date.now(); }, { passive: true, capture: true }); });
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  async function idle() { while (Date.now() - TOUCH < 4000 || document.hidden) { await sleep(1500); } }
  async function saved(id) {
    try { var r = await navigator.serviceWorker.getRegistration('/books/' + id + '/'); return !!(r && r.active && r.scope.indexOf('/books/' + id + '/') > 0); } catch (e) { return false; }
  }
  /* Light saving (owner, 22 Nov 2026: «I feel slowness»): loading each book in a hidden frame ran a whole second app on the phone. Now only
     the book's own service worker is installed (/books/<id>/sw.js, scope /books/<id>/): it saves the book page and scripts at once and the
     pictures in the background by itself, with no page drawn. Obstetrics keeps its locked content in content.bin, which is put into the same
     saved copy. Nothing stays loaded in memory; a book opens quickly from its saved copy. */
  var PX2 = { surgery: 'srr', pediatrics: 'prr', obstetrics: 'orr' };
  async function extras(id) {
    try {
      var keys = await caches.keys(), k = keys.filter(function (x) { return x.indexOf(PX2[id] + '-') === 0 && !/-audio$/.test(x); })[0]; if (!k) return;
      var c = await caches.open(k), u = '/books/' + id + '/content.bin';
      if (await c.match(u)) return;
      var r = await fetch(u, { cache: 'no-cache' }); if (r.ok) await c.put(u, r);
    } catch (e) {}
  }
  var PREP = false;
  IS.prepareBooks = async function () {
    if (PREP || !('serviceWorker' in navigator) || !navigator.onLine) return;
    if (navigator.connection && navigator.connection.saveData) return;
    PREP = true;
    try {
      for (var i = 0; i < BOOKS.length; i++) {
        var id = BOOKS[i].id;
        if (!(await saved(id))) {
          await idle(); if (!navigator.onLine) break;
          try { await navigator.serviceWorker.register('/books/' + id + '/sw.js', { scope: '/books/' + id + '/' }); } catch (e) { continue; }
          var t0 = Date.now();
          while (!(await saved(id)) && Date.now() - t0 < 120000) await sleep(2000);
        }
        if (id === 'obstetrics') await extras(id);
      }
    } finally { PREP = false; }
  };
  if (window.top === window.self) {
    setTimeout(function () { IS.prepareBooks(); }, 12000);
    window.addEventListener('online', function () { setTimeout(function () { IS.prepareBooks(); }, 8000); });
  }
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
