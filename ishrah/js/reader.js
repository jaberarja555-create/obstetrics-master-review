/* اشرح لي: the book reader (owner, 19 Nov 2026: "books must open perfectly, as if you are using a real PDF reader inside: highlight,
   copy, full page …"). A full-screen layer over the app: sharp pages drawn for the screen's pixel density, real selectable text (pdf.js
   text layer) for copying and highlighting, zoom (buttons, pinch, Ctrl + wheel), page jump, search inside the book, highlights in four
   colours kept on this device per book, full screen and a tap that hides the bars, and the last page reopens. Only pages near the screen
   are drawn; far pages are released, so a 900-page book stays light. Works offline with a downloaded book (blob). */
(function () {
  var A = IS.A, esc = IS.esc, ic = IS.ic, N = IS.N, $ = IS.$;
  var PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', loading = null;
  var COLORS = [['y', '#ffe066'], ['g', '#8ce99a'], ['b', '#74c0fc'], ['p', '#f783ac']];
  function lib() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (!loading) loading = new Promise(function (ok, no) {
      var s = document.createElement('script'); s.src = PDFJS;
      s.onload = function () { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS.replace('pdf.min.js', 'pdf.worker.min.js'); ok(window.pdfjsLib); };
      s.onerror = function (e) { loading = null; s.remove(); no(e); };
      document.head.appendChild(s);
    });
    return loading;
  }
  function store(key, def) { try { var v = JSON.parse(localStorage.getItem(key) || 'null'); return v == null ? def : v; } catch (e) { return def; } }
  function keep(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }

  var R = null;   // the open reader
  IS.openReader = async function (o) {
    if (R) close(true);
    var el = document.createElement('div'); el.id = 'rdr'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = '<header class="rdr-top"><button type="button" class="rib" data-r="close" aria-label="' + esc(A('إغلاق', 'Close')) + '">' + ic('chev', 'fr') + '</button>' +
      '<b class="rdr-title" dir="auto">' + esc(o.title || '') + '</b>' +
      '<button type="button" class="rib" data-r="search" aria-label="' + esc(A('البحث في الكتاب', 'Search the book')) + '">' + ic('search') + '</button>' +
      '<button type="button" class="rib" data-r="marks" aria-label="' + esc(A('تظليلاتي', 'My highlights')) + '">' + ic('bookmark') + '</button>' +
      '<button type="button" class="rib" data-r="full" aria-label="' + esc(A('ملء الشاشة', 'Full screen')) + '">' + ic('open') + '</button></header>' +
      '<div class="rdr-find" hidden><input type="search" dir="auto" placeholder="' + esc(A('ابحث عن كلمة في الكتاب…', 'Find a word in the book…')) + '"><button type="button" class="btn sm pri" data-r="go">' + esc(A('بحث', 'Find')) + '</button><div class="rdr-hits"></div></div>' +
      '<div class="rdr-scroll" tabindex="0"><div class="rdr-pages"><div class="loading"><span class="spin"></span></div></div></div>' +
      '<footer class="rdr-bot"><button type="button" class="rib" data-r="out" aria-label="' + esc(A('تصغير', 'Zoom out')) + '">−</button>' +
      '<button type="button" class="rdr-pg" data-r="jump"><bdi dir="ltr"><span class="rdr-cur">1</span> / <span class="rdr-n">…</span></bdi></button>' +
      '<button type="button" class="rib" data-r="in" aria-label="' + esc(A('تكبير', 'Zoom in')) + '">+</button>' +
      '<button type="button" class="rib rdr-fit" data-r="fit">' + esc(A('ملاءمة', 'Fit')) + '</button></footer>' +
      '<div class="rdr-sel" hidden>' + COLORS.map(function (c) { return '<button type="button" data-hl="' + c[0] + '" style="background:' + c[1] + '" aria-label="' + esc(A('تظليل', 'Highlight')) + '"></button>'; }).join('') +
      '<button type="button" class="rdr-copy" data-r="copy">' + esc(A('نسخ', 'Copy')) + '</button><button type="button" class="rdr-del" data-r="unmark" hidden>' + esc(A('إزالة التظليل', 'Remove highlight')) + '</button></div>';
    document.body.appendChild(el); document.body.classList.add('noscroll');
    try { history.pushState({ rdr: 1 }, ''); } catch (e) {}
    R = { el: el, o: o, id: o.id || 'x', zoom: store('ish-rz', 1), pages: [], marks: store('ish-hl:' + (o.id || 'x'), []), cur: 1 };
    el.addEventListener('click', onClick);
    var sc = el.querySelector('.rdr-scroll');
    sc.addEventListener('scroll', onScroll, { passive: true });
    sc.addEventListener('wheel', function (e) { if (e.ctrlKey) { e.preventDefault(); zoomTo(R.zoom * (e.deltaY < 0 ? 1.1 : 0.9)); } }, { passive: false });
    pinch(sc);
    document.addEventListener('selectionchange', onSel);
    el.querySelector('.rdr-find input').addEventListener('keydown', function (e) { if (e.key === 'Enter') find(); });
    try {
      var pdf = await lib(), src = o.blob ? { data: await o.blob.arrayBuffer() } : { url: o.url };
      /* the standard PDF fonts and character maps: without them books that do not embed their fonts draw with wrong letter widths
         (owner, 19 Nov 2026: "the text looks very distorted") */
      var base = new URL('pdfjs/', location.href).href;   // our own copy: works offline too (sw.js keeps it)
      R.doc = await pdf.getDocument(Object.assign(src, { isEvalSupported: false, cMapUrl: base + 'cmaps/', cMapPacked: true, standardFontDataUrl: base + 'standard_fonts/', useSystemFonts: false })).promise;
    } catch (e) {
      if (R && R.el === el) el.querySelector('.rdr-pages').innerHTML = IS.empty('info', A('تعذّر فتح الكتاب', 'The book could not be opened'), navigator.onLine ? '' : A('تحقق من الإنترنت أو نزّل الكتاب للقراءة دون اتصال.', 'Check the internet, or download the book to read offline.'));
      return;
    }
    if (!R || R.el !== el) return;
    var first = await R.doc.getPage(1), v = first.getViewport({ scale: 1 });
    R.ratio = v.height / v.width; R.n = R.doc.numPages;
    el.querySelector('.rdr-n').textContent = R.n;
    var box = el.querySelector('.rdr-pages'); box.innerHTML = '';
    for (var i = 1; i <= R.n; i++) {
      var d = document.createElement('div'); d.className = 'rp'; d.dataset.p = i;
      d.innerHTML = '<canvas width="0" height="0"></canvas><div class="rhl"></div><div class="textLayer"></div><span class="rpn">' + i + '</span>';
      box.appendChild(d); R.pages.push({ el: d, ratio: R.ratio, drawn: 0 });
    }
    sizeAll();
    R.io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) draw(+e.target.dataset.p); }); }, { root: sc, rootMargin: '120% 0px' });
    R.pages.forEach(function (p) { R.io.observe(p.el); });
    var last = store('ish-rpg:' + R.id, 1); if (o.page) last = o.page;
    if (last > 1 && last <= R.n) requestAnimationFrame(function () { goPage(last, true); });
  };

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
      var scale = w / base.width, dpr = Math.min(window.devicePixelRatio || 1, 2.5), vp = page.getViewport({ scale: scale });
      var cv = p.el.querySelector('canvas'), ctx = cv.getContext('2d', { alpha: false });
      cv.width = Math.floor(vp.width * dpr); cv.height = Math.floor(vp.height * dpr);
      cv.style.width = vp.width + 'px'; cv.style.height = vp.height + 'px';
      if (p.task) try { p.task.cancel(); } catch (e) {}
      p.task = page.render({ canvasContext: ctx, viewport: vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null });
      await p.task.promise;
      var tl = p.el.querySelector('.textLayer'); tl.innerHTML = ''; tl.style.setProperty('--scale-factor', scale);
      var task = window.pdfjsLib.renderTextLayer({ textContentSource: page.streamTextContent(), container: tl, viewport: vp, textDivs: [] });
      await task.promise;
      p.drawn = want; paintMarks(n);
    } catch (e) { if (!/cancel/i.test(String(e && e.name || e))) p.drawn = 0; }
    finally { if (p) p.busy = false; }
    release();
  }
  /* pages far from the screen give back their memory */
  function release() {
    R.pages.forEach(function (p, i) {
      if (p.drawn && Math.abs(i + 1 - R.cur) > 8) { var cv = p.el.querySelector('canvas'); cv.width = 0; cv.height = 0; p.el.querySelector('.textLayer').innerHTML = ''; p.drawn = 0; }
    });
  }
  function redrawNear() { R.pages.forEach(function (p) { p.drawn = 0; }); for (var i = Math.max(1, R.cur - 1); i <= Math.min(R.n, R.cur + 2); i++) draw(i); }
  function zoomTo(z) {
    if (!R || !R.n) return; z = Math.max(0.6, Math.min(4, z)); if (Math.abs(z - R.zoom) < 0.01) return;
    var sc = R.el.querySelector('.rdr-scroll'), rel = sc.scrollTop / Math.max(1, sc.scrollHeight);
    R.zoom = z; keep('ish-rz', z); sizeAll(); sc.scrollTop = rel * sc.scrollHeight; redrawNear();
  }
  function goPage(n, now) {
    n = Math.max(1, Math.min(R.n, n)); var p = R.pages[n - 1]; if (!p) return;
    var sc = R.el.querySelector('.rdr-scroll'); sc.scrollTop = p.el.offsetTop - 8; R.cur = n; R.el.querySelector('.rdr-cur').textContent = n; keep('ish-rpg:' + R.id, n); draw(n);
  }
  var st = 0;
  function onScroll() {
    if (st) return; st = requestAnimationFrame(function () {
      st = 0; if (!R || !R.n) return; var sc = R.el.querySelector('.rdr-scroll'), mid = sc.scrollTop + Math.min(sc.clientHeight * 0.35, 160), cur = 1;
      for (var i = 0; i < R.pages.length; i++) { if (R.pages[i].el.offsetTop <= mid) cur = i + 1; else break; }
      if (cur !== R.cur) { R.cur = cur; R.el.querySelector('.rdr-cur').textContent = cur; keep('ish-rpg:' + R.id, cur); }
    });
  }
  /* two-finger pinch: the pages scale while the fingers move, and are drawn sharp again at the new size when they lift */
  function pinch(sc) {
    var d0 = 0, z0 = 1;
    function dist(t) { var x = t[0].clientX - t[1].clientX, y = t[0].clientY - t[1].clientY; return Math.sqrt(x * x + y * y); }
    sc.addEventListener('touchstart', function (e) { if (e.touches.length === 2) { d0 = dist(e.touches); z0 = R.zoom; } }, { passive: true });
    sc.addEventListener('touchmove', function (e) { if (e.touches.length === 2 && d0) { e.preventDefault(); var f = dist(e.touches) / d0; R.el.querySelector('.rdr-pages').style.transform = 'scale(' + Math.max(0.6 / z0, Math.min(4 / z0, f)) + ')'; } }, { passive: false });
    sc.addEventListener('touchend', function (e) { if (d0 && e.touches.length < 2) { var t = R.el.querySelector('.rdr-pages'), m = /scale\(([\d.]+)\)/.exec(t.style.transform); t.style.transform = ''; d0 = 0; if (m) zoomTo(z0 * +m[1]); } });
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

  /* ---- search inside the book ---- */
  async function find() {
    var q = R.el.querySelector('.rdr-find input').value.trim().toLowerCase(), out = R.el.querySelector('.rdr-hits'); if (q.length < 2) return;
    out.innerHTML = '<span class="spin"></span>'; var hits = [], token = R.findT = Date.now();
    for (var i = 1; i <= R.n && hits.length < 60; i++) {
      if (R.findT !== token) return;
      if (!R.text) R.text = {};
      if (R.text[i] == null) { var tc = await (await R.doc.getPage(i)).getTextContent(); R.text[i] = tc.items.map(function (x) { return x.str; }).join(' '); }
      var tx = R.text[i], k = tx.toLowerCase().indexOf(q);
      if (k >= 0) hits.push([i, tx.slice(Math.max(0, k - 40), k + q.length + 50)]);
    }
    out.innerHTML = hits.length ? hits.map(function (h) { return '<button type="button" data-r="hit" data-p="' + h[0] + '"><b>' + esc(A('صفحة ', 'Page ')) + h[0] + '</b><span dir="auto">' + esc(h[1]) + '</span></button>'; }).join('') :
      '<p class="mut">' + esc(A('لا توجد نتائج', 'No results')) + '</p>';
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
      else if (a === 'search') { var f = R.el.querySelector('.rdr-find'); f.hidden = !f.hidden; if (!f.hidden) f.querySelector('input').focus(); }
      else if (a === 'go') find();
      else if (a === 'hit') { goPage(+b.dataset.p); R.el.querySelector('.rdr-find').hidden = true; }
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
  function close(silent) {
    if (!R) return;
    try { if (R.io) R.io.disconnect(); if (R.doc) R.doc.destroy(); } catch (e) {}
    if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
    document.removeEventListener('selectionchange', onSel);
    R.el.remove(); R = null; document.body.classList.remove('noscroll');
  }
  window.addEventListener('popstate', function () { if (R) close(); });
  document.addEventListener('keydown', function (e) {
    if (!R) return; if (e.key === 'Escape' && !document.fullscreenElement) history.back();
    if (/^(INPUT|TEXTAREA)$/.test((document.activeElement || {}).tagName || '')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') goPage(R.cur + 1); if (e.key === 'ArrowLeft' || e.key === 'PageUp') goPage(R.cur - 1);
  });
  window.addEventListener('resize', function () { if (R && R.n) { sizeAll(); redrawNear(); } });
})();
