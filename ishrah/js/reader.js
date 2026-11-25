/* اشرح لي: the book reader (owner, 19 Nov 2026: "books must open perfectly, as if you are using a real PDF reader inside: highlight,
   copy, full page …"). A full-screen layer over the app: sharp pages drawn for the screen's pixel density, real selectable text (pdf.js
   text layer) for copying and highlighting, zoom (buttons, pinch, Ctrl + wheel), page jump, search inside the book, highlights in four
   colours kept on this device per book, full screen and a tap that hides the bars, and the last page reopens. Only pages near the screen
   are drawn; far pages are released, so a 900-page book stays light. Works offline with a downloaded book (blob). */
(function () {
  var A = IS.A, esc = IS.esc, ic = IS.ic, N = IS.N, $ = IS.$;
  var COLORS = [['y', '#ffe066'], ['g', '#8ce99a'], ['b', '#74c0fc'], ['p', '#f783ac']];
  function store(key, def) { try { var v = JSON.parse(localStorage.getItem(key) || 'null'); return v == null ? def : v; } catch (e) { return def; } }
  function keep(key, v) {
    if (R && R.temporary) return;
    try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {}
    if (R && (key === R.bookmarksKey || key === 'ish-hl:' + R.id || key === 'ish-rpg:' + R.id)) dirty(key === 'ish-rpg:' + R.id ? 4000 : 1200);
  }
  /* bookmarks, highlights and last page follow the account (table reader_state, supabase/032_reader_state.sql): the newest change wins */
  function stateKey(r) { return 'ish-rst:' + r.account + '/' + r.id; }
  function dirty(wait) {
    var r = R; if (!r || !IS.ME) return;
    try { localStorage.setItem(stateKey(r), String(Date.now())); } catch (e) {}
    clearTimeout(r.pushT); r.pushT = setTimeout(function () { push(r); }, wait);
  }
  function push(r) {
    if (!IS.ME || !navigator.onLine) return;
    var row = { user_id: IS.ME.id, book: String(r.id).slice(0, 80), bookmarks: r.bookmarks.slice(0, 500), marks: r.marks.slice(-3000),
      last_page: store('ish-rpg:' + r.id, 1), updated_at: new Date(+store(stateKey(r), Date.now())).toISOString() };
    if (!DB.live) row.id = row.user_id + '/' + row.book;
    return DB.upsert('reader_state', row).catch(function () {});
  }
  async function pull(r) {
    if (!IS.ME || !navigator.onLine) return;
    try {
      var rows = await DB.q('reader_state', { eq: { user_id: IS.ME.id, book: String(r.id).slice(0, 80) }, limit: 1 }), row = rows[0];
      var mine = +store(stateKey(r), 0);
      if (!row) { if (mine || r.bookmarks.length || r.marks.length) push(r); return; }
      if (mine && mine > Date.parse(row.updated_at)) return push(r);
      if (R !== r) return;
      r.bookmarks = Array.isArray(row.bookmarks) ? row.bookmarks : []; r.marks = Array.isArray(row.marks) ? row.marks : [];
      try { localStorage.setItem(r.bookmarksKey, JSON.stringify(r.bookmarks)); localStorage.setItem('ish-hl:' + r.id, JSON.stringify(r.marks));
        localStorage.setItem(stateKey(r), String(Date.parse(row.updated_at))); } catch (e) {}
      r.remotePage = row.last_page;
      if (r.n) applyRemote(r);
    } catch (e) {}
  }
  function applyRemote(r) {
    r.pages.forEach(function (p, i) { if (p.drawn) paintMarks(i + 1); });
    paintBookmarks();
    if (r.remotePage && !r.moved && r.remotePage !== r.cur && r.remotePage <= r.n) goPage(r.remotePage);
    r.remotePage = null;
  }

  var R = null;   // the open reader
  IS.openReader = async function (o) {
    if (R) close();
    var el = document.createElement('div'); el.id = 'rdr'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = '<header class="rdr-top"><button type="button" class="rib" data-r="close" aria-label="' + esc(o.context === 'chat' ? A('العودة للمحادثة', 'Back to conversation') :
      o.temporary ? A('العودة إلى الطلب', 'Back to request') : A('إغلاق', 'Close')) + '">' + ic('chev', 'fr') + '</button>' +
      '<b class="rdr-title" dir="auto">' + esc(o.title || '') + '</b>' +
      '<button type="button" class="rib" data-r="search" disabled aria-label="' + esc(A('البحث في الكتاب', 'Search the book')) + '">' + ic('search') + '</button>' +
      '<button type="button" class="rib" data-r="bookmarks" disabled aria-expanded="false" aria-controls="rdr-bookmark-panel" aria-label="' +
        esc(A('المحتويات والإشارات', 'Contents and bookmarks')) + '">' + ic('list') + '</button>' +
      '<button type="button" class="rib rdr-bmq" data-r="save-bookmark" disabled aria-pressed="false" aria-label="' + esc(A('إشارة لهذه الصفحة', 'Bookmark this page')) + '">' + ic('bookmark') + '</button>' +
      '<button type="button" class="rib" data-r="marks" disabled aria-label="' + esc(A('تظليلاتي', 'My highlights')) + '">' + ic('pen') + '</button>' +
      '<button type="button" class="rib" data-r="full" aria-label="' + esc(A('ملء الشاشة', 'Full screen')) + '">' + ic('expand') + '</button></header>' +
      '<div class="rdr-find" hidden><input type="search" dir="auto" placeholder="' + esc(A('ابحث عن كلمة في الكتاب…', 'Find a word in the book…')) + '"><button type="button" class="btn sm pri" data-r="go">' + esc(A('بحث', 'Find')) + '</button><div class="rdr-hits"></div></div>' +
      '<section class="rdr-bookmarks" id="rdr-bookmark-panel" aria-label="' + esc(A('المحتويات والإشارات', 'Contents and bookmarks')) + '" hidden>' +
        '<div class="rdr-tabs" role="tablist"><button type="button" class="on" data-r="tab" data-t="toc">' + ic('list') + esc(A('المحتويات', 'Contents')) + '</button>' +
        '<button type="button" data-r="tab" data-t="bm">' + ic('bookmark') + esc(A('إشاراتي', 'My bookmarks')) + ' <i class="rdr-bmn"></i></button></div>' +
        '<div class="rdr-tab" data-t="toc"><div class="rdr-outline"></div></div>' +
        '<div class="rdr-tab" data-t="bm" hidden><button type="button" class="btn sm pri rdr-bmsave" data-r="save-bookmark"></button><div class="rdr-bookmark-list"></div></div></section>' +
      '<div class="rdr-scroll" tabindex="0"><div class="rdr-pages"><div class="loading" role="status"><span class="spin"></span><span>' +
      esc(o.temporary ? A('جارٍ فتح المرفق…', 'Opening attachment…') : A('جارٍ فتح الكتاب…', 'Opening the book…')) + '</span><b class="rdr-prog"></b><span class="rdr-bar"><i></i></span></div></div></div>' +
      '<footer class="rdr-bot"><button type="button" class="rib" data-r="out" aria-label="' + esc(A('تصغير', 'Zoom out')) + '">−</button>' +
      '<button type="button" class="rdr-pg" data-r="jump"><bdi dir="ltr"><span class="rdr-cur">1</span> / <span class="rdr-n">…</span></bdi></button>' +
      '<button type="button" class="rib" data-r="in" aria-label="' + esc(A('تكبير', 'Zoom in')) + '">+</button>' +
      '<button type="button" class="rib rdr-fit" data-r="fit">' + esc(A('ملاءمة', 'Fit')) + '</button></footer>' +
      '<div class="rdr-sel" hidden>' + COLORS.map(function (c) { return '<button type="button" data-hl="' + c[0] + '" style="background:' + c[1] + '" aria-label="' + esc(A('تظليل', 'Highlight')) + '"></button>'; }).join('') +
      '<button type="button" class="rdr-copy" data-r="copy">' + esc(A('نسخ', 'Copy')) + '</button><button type="button" class="rdr-del" data-r="unmark" hidden>' + esc(A('إزالة التظليل', 'Remove highlight')) + '</button></div>';
    document.body.appendChild(el); document.body.classList.add('noscroll');
    if (!o.reuseHistory) try { history.pushState({ rdr: 1 }, ''); } catch (e) {}
    var id = o.id || 'x', account = (IS.ME || {}).id || 'local';
    var bookmarksKey = 'ish-rbm:' + account + '/' + id;
    var reader = R = { el: el, id: id, account: account, temporary: o.temporary, zoom: o.temporary ? 1 : store('ish-rz:' + id, 1), pages: [],
      marks: o.temporary ? [] : store('ish-hl:' + id, []), bookmarksKey: bookmarksKey, bookmarks: o.temporary ? [] : store(bookmarksKey, []), cur: 1 };
    el.addEventListener('click', onClick);
    if (!reader.temporary) reader.pulled = pull(reader);
    /* iPhone Safari: the reader zooms the book itself, never the whole screen */
    ['gesturestart', 'gesturechange'].forEach(function (t) { el.addEventListener(t, function (e) { e.preventDefault(); }); });
    var sc = el.querySelector('.rdr-scroll');
    sc.addEventListener('scroll', onScroll, { passive: true });
    sc.addEventListener('wheel', function (e) { if (e.ctrlKey) { e.preventDefault(); zoomTo(R.zoom * (e.deltaY < 0 ? 1.1 : 0.9)); } }, { passive: false });
    pinch(sc);
    document.addEventListener('selectionchange', onSel);
    var unsel = function () { setTimeout(function () { var s = document.getSelection(); if (!s || s.isCollapsed) IS.$$('.textLayer.selecting', el).forEach(function (t) { t.classList.remove('selecting'); }); }, 0); };
    ['pointerup', 'pointercancel', 'touchend'].forEach(function (t) { document.addEventListener(t, unsel, true); });
    reader.unsel = unsel;
    el.querySelector('.rdr-find input').addEventListener('keydown', function (e) { if (e.key === 'Enter') find(); });
    var box = el.querySelector('.rdr-pages'), first, last;
    try {
      var source = o.blob ? o.blob.arrayBuffer() : o.getUrl ? Promise.resolve().then(o.getUrl) : o.url;
      var ready = await Promise.all([IS.loadPdfLibrary(), source]);
      if (R !== reader) return;
      if (!ready[1]) throw new Error('missing file');
      /* a book up to 15 MB comes down in ONE request with a real progress bar (owner, 23 Nov 2026: a 2 MB book stalled at «25% · 0.5 MB»):
         fetched in pieces, every piece paid the slow trip to the server again; the whole file is also kept on the phone at once */
      if (!o.blob && !(o.size > WHOLE)) {
        var whole = await fetchWhole(ready[1], reader, el);
        if (R !== reader) return;
        if (whole) { ready[1] = await whole.arrayBuffer(); o.blob = whole; if (o.onWhole) try { o.onWhole(whole); } catch (e) {} }
      }
      var src = o.blob ? { data: ready[1] } : { url: ready[1] };
      var base = new URL('pdfjs/', document.baseURI).href;
      reader.loadingTask = ready[0].getDocument(Object.assign(src, { isEvalSupported: false, cMapUrl: base + 'cmaps/', cMapPacked: true,
        standardFontDataUrl: base + 'standard_fonts/', useSystemFonts: false, disableAutoFetch: true, disableStream: true, rangeChunkSize: chunk() }));
      /* always say how much has arrived (on a slow line the size is often unknown and the screen looked stuck; owner, 22 Nov 2026) */
      reader.loadingTask.onProgress = function (pr) {
        var out = el.querySelector('.rdr-prog'); if (!out) return;
        var mb = (pr.loaded / 1048576).toFixed(pr.loaded < 10485760 ? 1 : 0);
        out.textContent = pr.total ? Math.min(99, Math.round(pr.loaded / pr.total * 100)) + '% · ' + mb + ' MB' : mb + ' MB';
      };
      reader.slowT = setTimeout(function () {
        var l = el.querySelector('.rdr-pages .loading'); if (!l || R !== reader || l.querySelector('.rdr-slow')) return;
        var d = document.createElement('p'); d.className = 'rdr-slow';
        d.textContent = reader.temporary ? A('الاتصال بطيء، والمرفق ما زال يُحمَّل.', 'The connection is slow. The attachment is still loading.') :
          A('الاتصال بطيء، والكتاب ما زال يُحمَّل. بعد أول فتح يُحفظ على جهازك ويفتح بسرعة.', 'The connection is slow; the book is still loading. After the first opening it is kept on this device and opens quickly.');
        l.appendChild(d);
      }, 12000);
      reader.doc = await reader.loadingTask.promise;
      clearTimeout(reader.slowT);
      if (R !== reader) return;
      reader.n = reader.doc.numPages;
      last = Math.max(1, Math.min(reader.n, Number(o.page || (reader.temporary ? 1 : store('ish-rpg:' + reader.id, 1))) || 1));
      first = await reader.doc.getPage(last);
    } catch (error) {
      if (R === reader && reader.temporary) box.innerHTML = IS.empty('info', A('تعذّر فتح المرفق', 'Could not open the attachment'),
        (o.context === 'chat' ? A('ارجع للمحادثة وحاول مرة أخرى.', 'Go back to the conversation and try again.') :
          A('ارجع إلى الطلب وحاول مرة أخرى.', 'Go back to the request and try again.')), o.externalUrl ?
          '<a class="btn ghost" target="_blank" rel="noopener noreferrer" href="' + esc(o.externalUrl) + '">' + ic('link') +
            esc(A('فتح الموقع الخارجي', 'Open external site')) + '</a>' : '');
      else if (R === reader) box.innerHTML = IS.empty('info', A('تعذّر فتح الكتاب', 'The book could not be opened'), navigator.onLine ?
        A('أغلق القارئ وأعد فتحه للمحاولة مجددًا.', 'Close and reopen the reader to try again.') :
        A('افتح النسخة المحفوظة من تنزيلاتي.', 'Open the saved copy from My downloads.'));
      return;
    }
    if (R !== reader) return;
    var v = first.getViewport({ scale: 1 });
    reader.ratio = v.height / v.width;
    el.querySelector('.rdr-n').textContent = reader.n;
    var pages = document.createDocumentFragment();
    for (var i = 1; i <= reader.n; i++) {
      var d = document.createElement('div'); d.className = 'rp'; d.dataset.p = i;
      d.innerHTML = '<canvas width="0" height="0"></canvas><div class="rhl"></div><div class="rfindhl" aria-hidden="true"></div><div class="textLayer"></div><span class="rpn">' + i + '</span>';
      pages.appendChild(d); reader.pages.push({ el: d, ratio: reader.ratio, drawn: 0 });
    }
    if (o.next) {
      var nx = document.createElement('div'); nx.className = 'rdr-next';
      nx.innerHTML = '<span>' + esc(A('انتهى هذا الجزء', 'End of this part')) + '</span><button type="button" class="btn pri">' + esc(o.next.title) + ic('chev', 'fl') + '</button>';
      nx.querySelector('button').onclick = function () { history.back(); setTimeout(o.next.open, 150); };
      pages.appendChild(nx);
    }
    box.replaceChildren(pages);
    sizeAll();
    await goPage(last);
    if (R !== reader) return;
    IS.$$('[data-r]:disabled', el).forEach(function (button) { button.disabled = false; });
    if (o.onFirst) setTimeout(function () { if (R === reader) o.onFirst(); }, 120000);   /* owner, 22 Nov 2026: a book needs internet only the first time; once opened it is kept (was after 2 minutes of reading) */ //   // kept on the phone only after 2 minutes of reading: a quick look does not download the whole book (owner, 19 Nov 2026)
    if (reader.remotePage !== undefined && reader.remotePage !== null) applyRemote(reader);
    updateZoomLabel();
    reader.io = new IntersectionObserver(function (entries) {
      if (R !== reader) return;
      entries.forEach(function (entry) { if (entry.isIntersecting) need(+entry.target.dataset.p); });
    }, { root: sc, rootMargin: '120% 0px' });
    reader.pages.forEach(function (p) { reader.io.observe(p.el); });
  };

  var WHOLE = 15 * 1048576;
  /* the whole file with progress; null = too big (the reader then asks for pieces) */
  async function fetchWhole(url, reader, el) {
    var ctl = new AbortController(); reader.ctl = ctl;
    var r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error('net ' + r.status);
    var total = +r.headers.get('content-length') || 0;
    if (total > WHOLE || !r.body) { try { ctl.abort(); } catch (e) {} return null; }
    var rd = r.body.getReader(), parts = [], got = 0, out = el.querySelector('.rdr-prog'), bar = el.querySelector('.rdr-bar i');
    for (;;) {
      var x = await rd.read(); if (x.done) break;
      parts.push(x.value); got += x.value.length;
      if (got > WHOLE && !total) { try { ctl.abort(); } catch (e) {} return null; }
      var mb = (got / 1048576).toFixed(1) + ' MB';
      if (out) out.textContent = total ? Math.min(99, Math.round(got / total * 100)) + '% · ' + mb + ' / ' + (total / 1048576).toFixed(1) + ' MB' : mb;
      if (bar && total) bar.style.width = Math.min(100, got / total * 100) + '%';
    }
    return new Blob(parts, { type: 'application/pdf' });
  }
  /* smaller pieces on slow connections: the first page needs only a few of them */
  function chunk() {
    var c = navigator.connection || {}, t = c.effectiveType || '';
    if (c.saveData || /2g/.test(t) || (c.downlink && c.downlink < 0.7)) return 131072;
    if (t === '3g' || (c.downlink && c.downlink < 3)) return 262144;
    return 524288;
  }
  function width() { var sc = R.el.querySelector('.rdr-scroll'); return Math.max(240, Math.min(sc.clientWidth - 16, 1000)) * R.zoom; }
  function sizeAll() {
    var w = width();
    R.pages.forEach(function (p) { p.el.style.width = w + 'px'; p.el.style.height = Math.round(w * p.ratio) + 'px'; p.el.style.setProperty('--scale-factor', w / (p.base || 612)); });
  }
  async function draw(n) {
    var p = R && R.pages[n - 1]; if (!p) return;
    var w = width(), want = Math.round(w); if (p.drawn === want || p.busy) return;
    p.busy = true;
    try {
      var page = await R.doc.getPage(n), base = page.getViewport({ scale: 1 });
      if (!R || R.pages[n - 1] !== p) return;
      p.base = base.width; p.ratio = base.height / base.width;
      p.el.style.height = Math.round(w * p.ratio) + 'px';
      var scale = w / base.width, coarse = matchMedia('(pointer:coarse)').matches, vp = page.getViewport({ scale: scale });
      var dpr = Math.min(window.devicePixelRatio || 1, coarse ? 2 : 2.5, Math.sqrt((coarse ? 5e6 : 12e6) / Math.max(1, vp.width * vp.height)));
      dpr = Math.max(0.75, dpr);
      var cv = p.el.querySelector('canvas'), ctx = cv.getContext('2d', { alpha: false });
      cv.width = Math.floor(vp.width * dpr); cv.height = Math.floor(vp.height * dpr);
      cv.style.width = vp.width + 'px'; cv.style.height = vp.height + 'px';
      if (p.task) try { p.task.cancel(); } catch (e) {}
      p.task = page.render({ canvasContext: ctx, viewport: vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null });
      await p.task.promise;
      var tl = p.el.querySelector('.textLayer'); tl.innerHTML = ''; tl.style.setProperty('--scale-factor', scale);
      var textDivs = [];
      var task = window.pdfjsLib.renderTextLayer({ textContentSource: page.streamTextContent(), container: tl, viewport: vp, textDivs: textDivs });
      await task.promise;
      /* a selection never jumps to the whole page (owner, 22 Nov 2026: on a phone the highlight covered every word): the empty end of
         the page catches the finger while selecting, as in the PDF.js viewer */
      var eoc = document.createElement('div'); eoc.className = 'endOfContent'; tl.appendChild(eoc);
      if (!tl._sel) { tl._sel = 1; tl.addEventListener('pointerdown', function () { tl.classList.add('selecting'); }); }
      if (R && R.pages[n - 1] === p) { p.drawn = want; p.textDivs = textDivs; paintMarks(n); paintSearch(n); }
    } catch (e) { if (!/cancel/i.test(String(e && e.name || e))) p.drawn = 0; }
    finally { if (p) p.busy = false; }
    if (R && R.pages[n - 1] === p) { release(); sweepSoon(); }
  }
  /* pages far from the screen give back their memory */
  function release() {
    R.pages.forEach(function (p, i) {
      if (p.drawn && Math.abs(i + 1 - R.cur) > 8) {
        var cv = p.el.querySelector('canvas'); cv.width = 0; cv.height = 0;
        p.el.querySelector('.textLayer').replaceChildren();
        p.el.querySelector('.rfindhl').replaceChildren();
        p.textDivs = null; p.drawn = 0;
      }
    });
  }
  /* every page on or near the screen that is blank or drawn at an older size is drawn now (owner, 23 Nov 2026: a page stayed white;
     a page skipped while another drawing or a zoom was running was never asked again until it left the screen and came back) */
  /* one page drawn at a time, the page on the screen first (owner, 23 Nov 2026: slow opening; several pages drawn together made the
     page in view wait behind the others on a slow phone) */
  var WANT = new Set(), PUMP = false;
  function need(n) { WANT.add(n); pump(); }
  async function pump() {
    if (PUMP) return; PUMP = true;
    try {
      while (R && WANT.size) {
        var sc = R.el.querySelector('.rdr-scroll'), mid = sc.scrollTop + sc.clientHeight / 2, best = null, bd = 1e12;
        WANT.forEach(function (n) { var p = R.pages[n - 1]; if (!p) { WANT.delete(n); return; } var d = Math.abs(p.el.offsetTop + p.el.offsetHeight / 2 - mid); if (d < bd) { bd = d; best = n; } });
        if (best === null) break;
        WANT.delete(best);
        if (bd > sc.clientHeight * 2.5) continue;   /* left far behind by scrolling */
        await draw(best);
      }
    } finally { PUMP = false; }
  }
  var swT = 0;
  function sweepSoon() { clearTimeout(swT); swT = setTimeout(sweep, 120); }
  function sweep() {
    if (!R || !R.n || !R.doc) return;
    var sc = R.el.querySelector('.rdr-scroll'), top = sc.scrollTop - sc.clientHeight * 0.6, bot = sc.scrollTop + sc.clientHeight * 1.6, want = Math.round(width());
    R.pages.forEach(function (p, i) {
      var y = p.el.offsetTop, h = p.el.offsetHeight;
      if (y + h >= top && y <= bot && p.drawn !== want && !p.busy) need(i + 1);
    });
  }
  function redrawNear() { R.pages.forEach(function (p) { p.drawn = 0; }); for (var i = Math.max(1, R.cur - 1); i <= Math.min(R.n, R.cur + 2); i++) need(i); sweepSoon(); }
  /* the page and the spot on it under (x, y) */
  function anchorAt(x, y) {
    var best = null, bd = 1e9;
    R.pages.forEach(function (p) { var r = p.el.getBoundingClientRect(), d = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0; if (d < bd) { bd = d; best = { p: p, r: r }; } });
    if (!best) return null;
    return { p: best.p, fx: (x - best.r.left) / best.r.width, fy: (y - best.r.top) / best.r.height };
  }
  /* new zoom; the anchored spot ends at screen point (x, y) */
  function updateZoomLabel() {
    var b = R && R.el.querySelector('.rdr-fit'); if (!b) return;
    var fit = Math.abs(R.zoom - 1) < 0.02; b.textContent = fit ? A('ملاءمة', 'Fit') : Math.round(R.zoom * 100) + '%';
    b.classList.toggle('on', !fit); b.setAttribute('aria-label', fit ? A('ملاءمة عرض الصفحة', 'Fit page width') : A('رجوع لعرض الصفحة', 'Back to page width'));
  }
  function zoomTo(z, x, y, anchor) {
    if (!R || !R.n) return; z = Math.max(0.6, Math.min(4, z));
    var sc = R.el.querySelector('.rdr-scroll'), box = sc.getBoundingClientRect();
    if (x == null) { x = box.left + box.width / 2; y = box.top + box.height / 2; }
    anchor = anchor || anchorAt(x, y);
    if (Math.abs(z - R.zoom) < 0.01 && !anchor) return;
    R.zoom = z; keep('ish-rz:' + R.id, z); sizeAll(); updateZoomLabel();
    if (anchor) { var r = anchor.p.el.getBoundingClientRect(); sc.scrollLeft += r.left + anchor.fx * r.width - x; sc.scrollTop += r.top + anchor.fy * r.height - y; }
    clearTimeout(R.zt); R.zt = setTimeout(redrawNear, 60);
  }
  function goPage(n) {
    if (!R || !R.n) return;
    n = Math.max(1, Math.min(R.n, n)); var p = R.pages[n - 1]; if (!p) return;
    var sc = R.el.querySelector('.rdr-scroll'); sc.scrollTop = p.el.offsetTop - 8;
    showPageNumber(n);
    return draw(n);
  }
  var st = 0;
  function onScroll() {
    if (st) return; st = requestAnimationFrame(function () {
      st = 0; if (!R || !R.n) return;
      var sc = R.el.querySelector('.rdr-scroll'), mid = sc.scrollTop + Math.min(sc.clientHeight * 0.35, 160), cur = 1;
      if (sc.scrollTop > 0 && sc.scrollHeight - sc.clientHeight - sc.scrollTop <= 2) cur = R.n;
      else for (var i = 0; i < R.pages.length; i++) { if (R.pages[i].el.offsetTop <= mid) cur = i + 1; else break; }
      if (cur !== R.cur) showPageNumber(cur);
      sweepSoon();
    });
  }
  /* two fingers: the pages grow or shrink around the fingers and follow them; when the fingers lift, the pages are laid out at the new size
     with the same spot under the fingers, then drawn sharp. Double tap: 2× at that spot, again to fit the width. */
  function pinch(sc) {
    var g = null, lastTap = 0, tapXY = null, moved = false;
    function mid(t) { return { x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 }; }
    function dist(t) { var x = t[0].clientX - t[1].clientX, y = t[0].clientY - t[1].clientY; return Math.sqrt(x * x + y * y) || 1; }
    sc.addEventListener('touchstart', function (e) {
      moved = false;
      if (e.touches.length === 2 && R && R.n) {
        var m = mid(e.touches), pages = R.el.querySelector('.rdr-pages'), pr = pages.getBoundingClientRect();
        g = { d: dist(e.touches), m: m, z: R.zoom, f: 1, mx: m.x, my: m.y, anchor: anchorAt(m.x, m.y), pages: pages };
        pages.style.transformOrigin = (m.x - pr.left) + 'px ' + (m.y - pr.top) + 'px';
        pages.style.willChange = 'transform';
      }
    }, { passive: true });
    sc.addEventListener('touchmove', function (e) {
      moved = true;
      if (!g || e.touches.length !== 2) return;
      e.preventDefault();
      var m = mid(e.touches);
      g.f = Math.max(0.6 / g.z, Math.min(4 / g.z, dist(e.touches) / g.d)); g.mx = m.x; g.my = m.y;
      g.pages.style.transform = 'translate(' + (m.x - g.m.x) + 'px,' + (m.y - g.m.y) + 'px) scale(' + g.f + ')';
    }, { passive: false });
    sc.addEventListener('touchend', function (e) {
      if (g && e.touches.length < 2) {
        var done = g; g = null;
        done.pages.style.transform = ''; done.pages.style.willChange = '';
        zoomTo(done.z * done.f, done.mx, done.my, done.anchor);
        lastTap = 0; return;
      }
      if (e.touches.length || e.changedTouches.length !== 1 || moved) return;
      var t = e.changedTouches[0], now = Date.now();
      if (now - lastTap < 320 && tapXY && Math.abs(tapXY.x - t.clientX) < 30 && Math.abs(tapXY.y - t.clientY) < 30) {
        lastTap = 0; R.el.classList.toggle('bare');   // undo the single-tap bar toggle of the first tap
        zoomTo(R.zoom > 1.3 ? 1 : 2, t.clientX, t.clientY);
        return;
      }
      lastTap = now; tapXY = { x: t.clientX, y: t.clientY };
    });
  }

  /* ---- selection: highlight in four colours, copy ---- */
  var selT = 0, tapped = null;
  function onSel() {
    clearTimeout(selT); selT = setTimeout(function () {
      if (!R) return; var s = document.getSelection(), bar = R.el.querySelector('.rdr-sel');
      var ok = s && !s.isCollapsed && s.rangeCount && R.el.querySelector('.rdr-pages').contains(s.anchorNode);
      if (ok) { tapped = null; showBar(s.getRangeAt(0).getBoundingClientRect(), false); } else if (!tapped) bar.hidden = true;
    }, 180);
  }
  function showBar(rect, removing) {
    var bar = R.el.querySelector('.rdr-sel'); bar.hidden = false;
    bar.querySelectorAll('[data-hl], .rdr-copy').forEach(function (b) { b.hidden = removing; }); bar.querySelector('.rdr-del').hidden = !removing;
    var top = rect.top - 54; if (top < 60) top = rect.bottom + 10;
    bar.style.top = Math.min(window.innerHeight - 70, top) + 'px';
    bar.style.left = Math.max(8, Math.min(window.innerWidth - bar.offsetWidth - 8, rect.left + rect.width / 2 - bar.offsetWidth / 2)) + 'px';
  }
  function addMark(color) {
    var s = document.getSelection(); if (!s || s.isCollapsed) return;
    var range = s.getRangeAt(0), rects = Array.from(range.getClientRects()), byPage = {};
    rects.forEach(function (r) {
      if (r.width < 1 || r.height < 1) return;
      var pe = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); pe = pe && pe.closest('.rp'); if (!pe) return;
      var b = pe.getBoundingClientRect(), n = +pe.dataset.p;
      (byPage[n] = byPage[n] || []).push([(r.left - b.left) / b.width, (r.top - b.top) / b.height, r.width / b.width, r.height / b.height].map(function (v) { return Math.round(v * 10000) / 10000; }));
    });
    var text = s.toString().trim().slice(0, 500), t = Date.now();
    Object.keys(byPage).forEach(function (n) { R.marks.push({ id: t + '-' + n, p: +n, c: color, r: byPage[n], t: text }); paintMarks(+n); });
    keep('ish-hl:' + R.id, R.marks); s.removeAllRanges(); R.el.querySelector('.rdr-sel').hidden = true;
    IS.toast(A('ظُلّل النص', 'Highlighted'));
  }
  function paintMarks(n) {
    var p = R.pages[n - 1]; if (!p) return; var layer = p.el.querySelector('.rhl');
    layer.innerHTML = R.marks.filter(function (m) { return m.p === n; }).map(function (m) {
      var col = (COLORS.filter(function (c) { return c[0] === m.c; })[0] || COLORS[0])[1];
      return m.r.map(function (r) { return '<i data-m="' + esc(m.id) + '" style="left:' + r[0] * 100 + '%;top:' + r[1] * 100 + '%;width:' + r[2] * 100 + '%;height:' + r[3] * 100 + '%;background:' + col + '"></i>'; }).join('');
    }).join('');
  }
  function copySel() {
    var s = document.getSelection(), t = s ? s.toString() : ''; if (!t) return;
    (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(t) : Promise.reject()).catch(function () { document.execCommand('copy'); })
      .then(function () { IS.toast(A('نُسخ النص', 'Copied')); });
    R.el.querySelector('.rdr-sel').hidden = true;
  }
  function markAt(x, y) {
    var pe = document.elementFromPoint(x, y); pe = pe && pe.closest('.rp'); if (!pe) return null;
    var b = pe.getBoundingClientRect(), fx = (x - b.left) / b.width, fy = (y - b.top) / b.height, n = +pe.dataset.p;
    return R.marks.filter(function (m) { return m.p === n && m.r.some(function (r) { return fx >= r[0] && fx <= r[0] + r[2] && fy >= r[1] && fy <= r[1] + r[3]; }); })[0] || null;
  }

  function showPageNumber(page) {
    if (R.n && R.cur && page !== R.cur && R.shown) R.moved = true;
    R.shown = true;
    R.cur = page;
    R.el.querySelector('.rdr-cur').textContent = page;
    keep('ish-rpg:' + R.id, page);
    syncBookmark();
  }
  function syncBookmark() {
    var active = R.bookmarks.includes(R.cur);
    var save = R.el.querySelector('.rdr-bmsave');
    save.innerHTML = ic('bookmark') + esc(active ? A('أزل إشارة الصفحة ', 'Remove bookmark of page ') : A('أضف إشارة للصفحة ', 'Bookmark page ')) + R.cur;
    IS.$$('[data-r=save-bookmark]', R.el).forEach(function (b) { b.setAttribute('aria-pressed', active); b.classList.toggle('on', active); });
    var n = R.el.querySelector('.rdr-bmn'); if (n) n.textContent = R.bookmarks.length ? R.bookmarks.length : '';
    R.pages.forEach(function (p, i) { p.el.classList.toggle('bm', R.bookmarks.includes(i + 1)); });
  }
  function paintBookmarks() {
    syncBookmark();
    var out = R.el.querySelector('.rdr-bookmark-list');
    var pages = R.bookmarks.filter(function (page) { return page >= 1 && page <= R.n; }).slice().sort(function (a,b) { return a - b; });
    out.innerHTML = pages.length ? pages.map(function (page) {
      var name = '<b class="rbn">' + N(page) + '</b><span class="rbt"><small>' + esc(A('صفحة ', 'Page ')) + page + '</small><em data-snip="' + page + '" dir="auto">' + esc(snippet(page) || '') + '</em></span>';
      return '<div class="rdr-bookmark-row"><button data-r="bookmark-page" data-p="' + page + '">' + name +
        '</button><button class="rib" data-r="remove-bookmark" data-p="' + page + '" aria-label="' +
        esc(A('إزالة إشارة الصفحة ', 'Remove bookmark for page ') + page) + '">' + ic('trash') + '</button></div>';
    }).join('') : '<p>' + esc(A('لا توجد صفحات محفوظة بعد.', 'No bookmarked pages yet.')) + '</p>';
  }
  function snippet(page) {
    var t = R.text && R.text[page];
    if (t != null) return t.replace(/\s+/g, ' ').trim().slice(0, 90);
    var r = R; r.text = r.text || {};
    r.doc.getPage(page).then(function (p) { return p.getTextContent(); }).then(function (tc) {
      r.text[page] = tc.items.map(function (x) { return x.str; }).join(' ');
      var el = r.el.querySelector('[data-snip="' + page + '"]'); if (el) el.textContent = r.text[page].replace(/\s+/g, ' ').trim().slice(0, 90);
    }).catch(function () {});
    return '';
  }
  function changeBookmark(page, remove) {
    var index = R.bookmarks.indexOf(page);
    if (index >= 0) R.bookmarks.splice(index, 1);
    else if (!remove) R.bookmarks.push(page);
    keep(R.bookmarksKey, R.bookmarks);
    paintBookmarks();
    if (!remove) IS.toast(R.bookmarks.includes(page) ? A('أُضيفت إشارة للصفحة ', 'Bookmarked page ') + page : A('أُزيلت إشارة الصفحة ', 'Bookmark removed from page ') + page);
  }
  function toggleBookmarks(open) {
    var panel = R.el.querySelector('.rdr-bookmarks');
    panel.hidden = !open;
    R.el.style.setProperty('--rtop', R.el.querySelector('.rdr-top').offsetHeight + 'px');
    R.el.querySelector('[data-r=bookmarks]').setAttribute('aria-expanded', open);
    if (!open) return;
    R.el.querySelector('.rdr-find').hidden = true;
    paintBookmarks();
    var reader = R, out = panel.querySelector('.rdr-outline');
    if (reader.outline) return;
    reader.outline = [];
    function pageList() {
      out.innerHTML = '<p>' + esc(A('لا يحتوي هذا الكتاب على فهرس. اختر صفحة:', 'This book has no contents list. Choose a page:')) + '</p><div class="rdr-pgrid">' +
        Array.from({ length: reader.n }, function (_, i) { return '<button type="button" data-r="bookmark-page" data-p="' + (i + 1) + '">' + (i + 1) + '</button>'; }).join('') + '</div>';
    }
    out.innerHTML = '<p><span class="spin"></span></p>';
    reader.doc.getOutline().then(function (outline) {
      if (R !== reader) return;
      function items(entries, level) {
        entries.forEach(function (item) {
          if (item.dest) reader.outline.push({ title: item.title, dest: item.dest, level: level });
          if (item.items && item.items.length) items(item.items, level + 1);
        });
      }
      if (outline) items(outline, 0);
      if (!reader.outline.length) return pageList();
      out.innerHTML = reader.outline.map(function (item, index) {
        return '<button class="rdr-outline-item" style="--lv:' + Math.min(item.level, 3) + '" data-r="outline-page" data-i="' + index + '" dir="auto">' + esc(item.title) + '</button>';
      }).join('');
    }).catch(function () { if (R === reader) pageList(); });
  }
  async function openOutline(index) {
    var reader = R, entry = reader.outline[index];
    if (!entry) return;
    try {
      var dest = typeof entry.dest === 'string' ? await reader.doc.getDestination(entry.dest) : entry.dest;
      if (!dest || dest[0] == null) return;
      var page = Number.isInteger(dest[0]) ? dest[0] : await reader.doc.getPageIndex(dest[0]);
      if (R === reader) { toggleBookmarks(false); goPage(page + 1); }
    } catch (error) {}
  }

  /* ---- search inside the book ---- */
  function searchPattern(query) {
    return new RegExp(query.split(/\s+/).map(function (word) {
      return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('\\s+'), 'giu');
  }
  function paintSearch(page) {
    var p = R.pages[page - 1], layer = p.el.querySelector('.rfindhl');
    layer.replaceChildren();
    if (!R.searchQuery || !p.textDivs) return;
    var spans = [], whole = '';
    p.textDivs.forEach(function (span) {
      var node = span.firstChild;
      if (!node || node.nodeType !== Node.TEXT_NODE || !span.isConnected) return;
      spans.push({ node: node, start: whole.length });
      whole += node.textContent + ' ';
    });
    var pattern = searchPattern(R.searchQuery), match;
    var box = p.el.getBoundingClientRect(), fragment = document.createDocumentFragment(), first;
    for (var i = 0; i < 200 && (match = pattern.exec(whole)); i++) {
      var start = match.index, end = start + match[0].length;
      spans.forEach(function (span) {
        var from = Math.max(0, start - span.start), to = Math.min(span.node.length, end - span.start);
        if (from >= to) return;
        var range = document.createRange();
        range.setStart(span.node, from);
        range.setEnd(span.node, to);
        Array.from(range.getClientRects()).forEach(function (rect) {
          if (!rect.width || !rect.height) return;
          if (!first) first = rect;
          var mark = document.createElement('i');
          Object.assign(mark.style, { left: (rect.left - box.left) + 'px', top: (rect.top - box.top) + 'px',
            width: rect.width + 'px', height: rect.height + 'px' });
          fragment.appendChild(mark);
        });
      });
    }
    layer.appendChild(fragment);
    if (first && R.searchJump === page) {
      R.searchJump = null;
      var scroll = R.el.querySelector('.rdr-scroll'), view = scroll.getBoundingClientRect();
      if (first.top < view.top + 8 || first.bottom > view.bottom - 8) scroll.scrollTop += first.top - view.top - 52;
    }
  }
  async function find() {
    var reader = R, q = reader.el.querySelector('.rdr-find input').value.trim(), out = reader.el.querySelector('.rdr-hits');
    var token = reader.findT = (reader.findT || 0) + 1;
    reader.searchQuery = q.length >= 2 ? q : '';
    reader.searchJump = null;
    reader.pages.forEach(function (page, index) { if (page.drawn) paintSearch(index + 1); });
    if (!reader.doc || q.length < 2) { out.replaceChildren(); return; }
    out.innerHTML = '<span class="spin"></span>'; var hits = [];
    var pattern = searchPattern(q);
    if (!reader.text) reader.text = {};
    try {
      for (var i = 1; i <= reader.n && hits.length < 60; i++) {
        if (R !== reader || reader.findT !== token) return;
        if (reader.text[i] == null) {
          var tc = await (await reader.doc.getPage(i)).getTextContent();
          reader.text[i] = tc.items.map(function (x) { return x.str; }).join(' ');
        }
        var tx = reader.text[i];
        pattern.lastIndex = 0;
        var match = pattern.exec(tx);
        if (match) hits.push([i, tx.slice(Math.max(0, match.index - 40), match.index + match[0].length + 50)]);
      }
      if (R !== reader || reader.findT !== token) return;
      out.innerHTML = hits.length ? hits.map(function (h) {
        return '<button type="button" data-r="hit" data-p="' + h[0] + '"><b>' + esc(A('صفحة ', 'Page ')) + h[0] +
          '</b><span dir="auto">' + esc(h[1]) + '</span></button>';
      }).join('') : '<p class="mut">' + esc(A('لا توجد نتائج', 'No results')) + '</p>';
    } catch (error) {
      if (R === reader && reader.findT === token) out.innerHTML = '<p class="mut">' + esc(A('تعذّر البحث في الكتاب.', 'Could not search the book.')) + '</p>';
    }
  }
  function marksSheet() {
    var list = R.marks.slice().sort(function (a, b) { return a.p - b.p; });
    IS.sheet(A('تظليلاتي', 'My highlights'), list.length ? '<div class="rmarks">' + list.map(function (m) {
      var col = (COLORS.filter(function (c) { return c[0] === m.c; })[0] || COLORS[0])[1];
      return '<div class="rmk" style="--hc:' + col + '"><button type="button" data-rgo="' + m.p + '"><b>' + esc(A('صفحة ', 'Page ')) + m.p + '</b><span dir="auto">' + esc(m.t || '') + '</span></button><button type="button" class="ib" data-rdel="' + esc(m.id) + '" aria-label="' + esc(A('حذف', 'Delete')) + '">' + ic('trash') + '</button></div>';
    }).join('') + '</div>' : IS.empty('bookmark', A('لا توجد تظليلات بعد', 'No highlights yet'), A('حدّد نصًا في الكتاب ثم اختر لونًا.', 'Select text in the book, then choose a colour.')));
    var d = $('#sheet'); d.style.zIndex = 1300;
    d.onclick = function (e) {
      var g = e.target.closest('[data-rgo]'), x = e.target.closest('[data-rdel]');
      if (g) { IS.closeSheet(); goPage(+g.dataset.rgo); }
      if (x) { var m = R.marks.filter(function (k) { return k.id === x.dataset.rdel; })[0]; R.marks = R.marks.filter(function (k) { return k !== m; }); keep('ish-hl:' + R.id, R.marks); if (m) paintMarks(m.p); x.closest('.rmk').remove(); }
    };
  }

  function onClick(e) {
    var b = e.target.closest('[data-r], [data-hl]');
    if (b && b.dataset.hl) { if (tapped) { tapped.c = b.dataset.hl; keep('ish-hl:' + R.id, R.marks); paintMarks(tapped.p); tapped = null; R.el.querySelector('.rdr-sel').hidden = true; } else addMark(b.dataset.hl); return; }
    if (b) {
      var a = b.dataset.r;
      if (a === 'close') { history.back(); return; }
      if (a === 'in') zoomTo(R.zoom * 1.25); else if (a === 'out') zoomTo(R.zoom / 1.25); else if (a === 'fit') zoomTo(1);
      else if (a === 'copy') copySel();
      else if (a === 'unmark' && tapped) { var m = tapped; R.marks = R.marks.filter(function (k) { return k !== m; }); keep('ish-hl:' + R.id, R.marks); paintMarks(m.p); tapped = null; R.el.querySelector('.rdr-sel').hidden = true; }
      else if (a === 'search') {
        var f = R.el.querySelector('.rdr-find'); f.hidden = !f.hidden;
        if (!f.hidden) { toggleBookmarks(false); f.querySelector('input').focus(); }
      }
      else if (a === 'bookmarks') toggleBookmarks(R.el.querySelector('.rdr-bookmarks').hidden);
      else if (a === 'save-bookmark') changeBookmark(R.cur);
      else if (a === 'tab') { IS.$$('.rdr-tabs [data-r=tab]', R.el).forEach(function (x) { x.classList.toggle('on', x === b); }); IS.$$('.rdr-tab', R.el).forEach(function (x) { x.hidden = x.dataset.t !== b.dataset.t; }); }
      else if (a === 'remove-bookmark') changeBookmark(+b.dataset.p, true);
      else if (a === 'bookmark-page') { toggleBookmarks(false); goPage(+b.dataset.p); }
      else if (a === 'outline-page') openOutline(+b.dataset.i);
      else if (a === 'go') find();
      else if (a === 'hit') {
        var page = +b.dataset.p;
        R.el.querySelector('.rdr-find').hidden = true;
        R.searchJump = page;
        goPage(page);
        if (R.pages[page - 1].drawn) paintSearch(page);
      }
      else if (a === 'marks') marksSheet();
      else if (a === 'full') { var fs = document.fullscreenElement; if (fs) document.exitFullscreen().catch(function () {}); else if (R.el.requestFullscreen) R.el.requestFullscreen().catch(function () {}); R.el.classList.toggle('bare', !fs); }
      else if (a === 'jump') IS.ask(A('اذهب إلى الصفحة', 'Go to page'), '1 – ' + R.n, String(R.cur)).then(function (v) { var n = parseInt(v, 10); if (n) goPage(n); });
      return;
    }
    if (e.target.closest('.rdr-pages')) {
      var s = document.getSelection(); if (s && !s.isCollapsed) return;
      var m2 = markAt(e.clientX, e.clientY);
      if (m2) { tapped = m2; showBar({ top: e.clientY, bottom: e.clientY, left: e.clientX, width: 0 }, true); R.el.querySelector('.rdr-sel').querySelectorAll('[data-hl]').forEach(function (x) { x.hidden = false; }); return; }
      tapped = null; R.el.querySelector('.rdr-sel').hidden = true;
      R.el.classList.toggle('bare');   // a tap shows or hides the bars: the whole screen for the page
    }
  }
  function close() {
    if (!R) return;
    if (R.pushT) { clearTimeout(R.pushT); push(R); }
    if (R.io) R.io.disconnect();
    if (R.loadingTask) R.loadingTask.destroy().catch(function () {});
    if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
    document.removeEventListener('selectionchange', onSel);
    if (R.unsel) ['pointerup', 'pointercancel', 'touchend'].forEach(function (t) { document.removeEventListener(t, R.unsel, true); });
    clearTimeout(R.slowT);
    if (R.ctl) try { R.ctl.abort(); } catch (e) {}
    R.el.remove(); R = null; document.body.classList.remove('noscroll');
  }
  window.addEventListener('popstate', function () { if (R) close(); });
  window.addEventListener('hashchange', function () { if (R && R.temporary) close(); });
  document.addEventListener('keydown', function (e) {
    if (!R) return; if (e.key === 'Escape' && !document.fullscreenElement) history.back();
    if (/^(INPUT|TEXTAREA)$/.test((document.activeElement || {}).tagName || '')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') goPage(R.cur + 1); if (e.key === 'ArrowLeft' || e.key === 'PageUp') goPage(R.cur - 1);
  });
  window.addEventListener('resize', function () { if (R && R.n) { var a = anchorAt(innerWidth / 2, innerHeight / 2); sizeAll(); if (a) zoomTo(R.zoom, null, null, a); else redrawNear(); } });
})();
