/* اشرح لي: offline use (owner, 18 Nov 2026: "add the offline bar; nobody can download to the phone, but things can be downloaded IN the platform
   and watched without internet: videos, lectures, books and others").
   • Offline bar under the top bar while there is no connection, with a link to My downloads.
   • Downloads are kept INSIDE the platform only: IndexedDB `ish-offline`, every piece encrypted (AES-GCM) with a key that cannot be exported
     (CryptoKey with extractable false, one per account), so the files are not in the phone's files or gallery and cannot be copied out as
     videos or PDFs. Another account on the same phone cannot see or open them.
   • A download lasts 30 days and is renewed whenever the platform checks it online (still enrolled / still published); a removed access deletes it.
   • Lessons (video, written, quiz), whole courses and library files (PDF, pictures). Videos in 360p / 480p / 720p.
   Pages: #downloads (list, storage used, delete) and #dl/<id> (the offline viewer). */
(function () {
  'use strict';
  var A = IS.A, esc = IS.esc, ic = IS.ic, N = IS.N, $ = IS.$;
  var DAYS = 30, CH = 4 * 1048576, PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';

  /* ---------- offline bar ---------- */
  function bar() {
    var b = document.getElementById('offbar'); if (!b) { b = document.createElement('div'); b.id = 'offbar'; b.setAttribute('role', 'status'); b.hidden = true; document.body.appendChild(b); }
    if (!navigator.onLine) {
      b.className = 'off'; b.innerHTML = ic('offline') + '<span>' + esc(A('أنت غير متصل. الصفحات التي فتحتها من قبل تعمل، وتعليقاتك وتفاعلاتك تُرسل عند عودة الاتصال.', 'You are offline. Pages you opened before still work, and your comments and reactions are sent when you are back online.')) + (DB.outbox && DB.outbox() ? ' <b>' + esc(A('بانتظار الإرسال: ', 'Waiting to send: ')) + N(DB.outbox()) + '</b>' : '') + '</span><a href="#downloads">' + ic('download') + esc(A('تنزيلاتي', 'My downloads')) + '</a>';
      b.hidden = false; document.body.classList.add('isoff');
    } else if (document.body.classList.contains('isoff')) {
      document.body.classList.remove('isoff'); b.className = 'on'; b.innerHTML = ic('checkc') + '<span>' + esc(A('عاد الاتصال بالإنترنت', 'You are back online')) + '</span>'; b.hidden = false;
      clearTimeout(bar.t); bar.t = setTimeout(function () { b.hidden = true; }, 3000);
    } else b.hidden = true;
  }
  IS.offBar = bar;
  window.addEventListener('online', bar); window.addEventListener('offline', bar);
  window.addEventListener('ish-outbox', function () { if (!navigator.onLine) bar(); });
  window.addEventListener('hashchange', function () { if (!navigator.onLine) bar(); });

  /* ---------- encrypted store ---------- */
  var DBP;
  function idb() {
    return DBP || (DBP = new Promise(function (ok, no) {
      var r = indexedDB.open('ish-offline', 1);
      r.onupgradeneeded = function () { var d = r.result; d.createObjectStore('items', { keyPath: 'id' }); d.createObjectStore('chunks', { keyPath: 'k' }); d.createObjectStore('keys', { keyPath: 'u' }); };
      r.onsuccess = function () { ok(r.result); }; r.onerror = function () { no(r.error); };
    }));
  }
  function op(store, mode, fn) {
    return idb().then(function (d) { return new Promise(function (ok, no) {
      var t = d.transaction(store, mode), q = fn(t.objectStore(store)); t.oncomplete = function () { ok(q && 'result' in q ? q.result : undefined); }; t.onerror = t.onabort = function () { no(t.error); };
    }); });
  }
  var get = function (s, k) { return op(s, 'readonly', function (o) { return o.get(k); }); };
  var put = function (s, v) { return op(s, 'readwrite', function (o) { return o.put(v); }); };
  function uid() { return IS.ME && IS.ME.id; }
  async function key() {
    var u = uid(), r = await get('keys', u); if (r) return r.k;
    var k = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); await put('keys', { u: u, k: k }); return k;
  }
  async function seal(k, id, n, bytes) { var iv = crypto.getRandomValues(new Uint8Array(12)); await put('chunks', { k: id + '#' + n, iv: iv, d: await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, k, bytes) }); }
  async function open1(k, id, n) { var c = await get('chunks', id + '#' + n); if (!c) throw new Error('missing'); return crypto.subtle.decrypt({ name: 'AES-GCM', iv: c.iv }, k, c.d); }
  async function drop(id) {
    await op('chunks', 'readwrite', function (o) { return o.delete(IDBKeyRange.bound(id + '#', id + '#￿')); });
    await op('items', 'readwrite', function (o) { return o.delete(id); }); delete HAVE[id]; show(id);
  }
  async function items() { var u = uid(); if (!u) return []; return ((await op('items', 'readonly', function (o) { return o.getAll(); })) || []).filter(function (x) { return x.u === u; }); }

  var HAVE = {}, RUN = {};
  async function loadHave() { HAVE = {}; try { (await items()).forEach(function (x) { HAVE[x.id] = x; }); } catch (e) {} Object.keys(HAVE).forEach(show); }
  IS.dlReady = loadHave;
  function did(kind, id) { return uid() + ':' + kind + ':' + id; }
  /* is this library file on the phone (opened once, or downloaded)? While offline the others are marked «needs internet» (22 Nov 2026) */
  IS.fileSaved = function (fileId) { var it = HAVE[did('file', fileId)]; return !!(it && it.u === uid()); };
  function markNet() {
    var off = !navigator.onLine;
    IS.$$('#main a[href^="#file/"], #main [data-go^="#file/"]').forEach(function (a) {
      var id = (a.getAttribute('href') || a.getAttribute('data-go') || '').split('/')[1]; if (!id) return;
      var c0 = a.closest('.bcard, .feed-card, .fcard, .card') || a, card = c0.querySelector('.fimg, .pst') || c0;   /* the label sits on the cover */
      var need = off && !IS.fileSaved(id), tag = card.querySelector(':scope > .needs-net');
      card.classList.toggle('net-need', need);
      if (need && !tag) card.insertAdjacentHTML('afterbegin', '<span class="needs-net">🌐 ' + esc(A('يحتاج إنترنت', 'Needs internet')) + '</span>');
      if (!need && tag) tag.parentNode.removeChild(tag);
    });
  }
  IS.markNeedsNet = markNet;
  window.addEventListener('offline', function () { setTimeout(markNet, 300); });
  window.addEventListener('online', function () { setTimeout(markNet, 300); });
  var rN = IS.onRoute;
  IS.onRoute = function () { if (rN) try { rN.apply(this, arguments); } catch (e) {} setTimeout(markNet, 200); };

  /* save one item: optional media (fetched in pieces, each encrypted) + encrypted details (#m) */
  async function save(meta, info, url) {
    var k = await key(), ctl = new AbortController(), id = meta.id; RUN[id] = { p: 0, ctl: ctl, t: meta.title }; show(id);
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {}); } catch (e) {}
    try {
      var n = 0, got = 0;
      if (url) {
        var r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error('net ' + r.status);
        var total = +r.headers.get('content-length') || 0, rd = r.body.getReader(), buf = [], bl = 0;
        var flush = async function () { if (!bl) return; var a = new Uint8Array(bl), o = 0; buf.forEach(function (x) { a.set(x, o); o += x.length; }); buf = []; bl = 0; await seal(k, id, n, a); n++; };
        for (;;) { var x = await rd.read(); if (x.done) break; buf.push(x.value); bl += x.value.length; got += x.value.length; if (bl >= CH) await flush(); RUN[id].p = total ? Math.min(99, Math.round(got / total * 100)) : 0; show(id); }
        await flush();
      }
      await seal(k, id, 'm', new TextEncoder().encode(JSON.stringify(info || {})));
      var it = Object.assign({}, meta, { u: uid(), n: n, size: got, saved: Date.now(), exp: Date.now() + DAYS * 864e5, chk: Date.now() });
      await put('items', it); HAVE[id] = it; delete RUN[id]; show(id); return it;
    } catch (e) { delete RUN[id]; try { await drop(id); } catch (e2) {} show(id); throw e; }
  }
  async function readInfo(it) { return JSON.parse(new TextDecoder().decode(await open1(await key(), it.id, 'm'))); }
  async function readBlob(it) { var k = await key(), parts = []; for (var i = 0; i < it.n; i++) parts.push(await open1(k, it.id, i)); return new Blob(parts, { type: it.mime || 'application/octet-stream' }); }

  /* a book already on this device (downloaded, or kept after it was opened) opens from here, not from the internet
     (owner, 19 Nov 2026: "opening a book is still slow"); the copy must be for the same file version */
  IS.bookBlob = async function (file, path) {
    try {
      if (!uid()) return null; if (!Object.keys(HAVE).length) await loadHave();
      var it = HAVE[did('file', file.id)]; if (!it || it.u !== uid()) return null;
      if (it.pth && path && it.pth !== path) return null;
      if (it.exp < Date.now() && !(navigator.onLine && await renew(it).catch(function () { return false; }))) return null;
      return await readBlob(it);
    } catch (e) { return null; }
  };
  /* after a book opened from the internet, keep it on the device in the background (encrypted, like a download; up to 80 MB; not on
     data-saver connections), so the next opening is instant */
  IS.bookKeep = async function (file, path, mime) {
    try {
      var id = did('file', file.id);
      if (!uid() || HAVE[id] || RUN[id] || !navigator.onLine || (navigator.connection || {}).saveData) return;
      if (+file.size > 80 * 1048576) return;
      var source = await DB.fileUrl('library', path); if (!source) return;
      await save({ id: id, kind: 'file', title: file.title, sub: file.author || '', ref: file.id, mime: mime || 'application/pdf', pth: path, auto: 1 },
        { title: file.title, author: file.author || '', pages: file.pages || 0, about: file.about || '' }, source);
    } catch (e) {}
  };

  /* ---------- buttons on lessons and files ---------- */
  function inner(id, compact) {
    if (RUN[id]) return ic('download') + '<span>' + esc(A('جارٍ التنزيل', 'Downloading')) + ' ' + N(RUN[id].p + '%') + '</span><i class="dlbar" style="--p:' + RUN[id].p + '%"></i>';
    if (HAVE[id]) return ic('checkc') + '<span>' + esc(A('متاح دون إنترنت', compact ? 'Saved offline' : 'Available offline')) + '</span>';
    return ic('download') + '<span>' + esc(compact ? A('تنزيل', 'Download') : A('تنزيل للمشاهدة دون إنترنت', 'Download for offline')) + '</span>';
  }
  function show(id) { IS.$$('[data-dlid="' + id + '"]').forEach(function (b) { b.innerHTML = inner(id, b.hasAttribute('data-dl-compact')); b.classList.toggle('have', !!HAVE[id]); b.classList.toggle('run', !!RUN[id]); }); var l = $('#dlrun'); if (l) l.innerHTML = runList(); }
  IS.dlBtn = function (kind, id, extra, compact) {
    if (!uid()) return '';
    var d = did(kind, id);
    return '<button type="button" class="btn ghost sm dlb' + (HAVE[d] ? ' have' : '') + '" data-act="dl" data-k="' + kind + '" data-id="' +
      id + '"' + (extra || '') + (compact ? ' data-dl-compact' : '') + ' data-dlid="' + d + '">' + inner(d, compact) + '</button>';
  };

  function quality() {
    return new Promise(function (ok) {
      var cur = IS.LS.get('dlq', '480');
      IS.sheet(esc(A('جودة الفيديو', 'Video quality')), '<p class="lead">' + esc(A('تُحفظ الفيديوهات داخل المنصة فقط. الجودة الأقل أصغر حجمًا.', 'Videos are kept inside the platform only. A lower quality takes less space.')) + '</p><div class="dlq">' +
        [['360', 'أصغر حجمًا', 'Smallest'], ['480', 'موصى بها', 'Recommended'], ['720', 'أوضح صورة', 'Sharpest']].map(function (q) { return '<button type="button" class="sopt' + (q[0] === cur ? ' on' : '') + '" data-q="' + q[0] + '">' + ic('video') + '<b>' + q[0] + 'p</b><small>' + esc(A(q[1], q[2])) + '</small></button>'; }).join('') + '</div>');
      var d = $('#sheet'); d.querySelectorAll('[data-q]').forEach(function (b) { b.onclick = function () { IS.LS.set('dlq', b.getAttribute('data-q')); IS.closeSheet(); ok(b.getAttribute('data-q')); }; });
      var cl = d.querySelector('[data-close]'); if (cl) cl.addEventListener('click', function () { ok(null); });
    });
  }
  function why(e) {
    var m = e && e.message || ''; return m === 'extlink' ? A('فيديو هذا الدرس من رابط YouTube أو Google Drive، فيُشاهد بالإنترنت فقط ولا يُنزّل.', 'This lesson plays from a YouTube or Google Drive link, so it needs the internet and cannot be downloaded.') : m === 'denied' ? A('هذا الدرس للملتحقين بالكورس.', 'This lesson is for enrolled students.') : m === 'nodl' ? A('تنزيل الفيديوهات لم يُفعَّل بعد على المنصة.', 'Video downloads are not switched on yet.') :
      /quota|space/i.test(m) ? A('لا توجد مساحة كافية على الجهاز.', 'Not enough space on the device.') : /abort/i.test(m) ? A('أُلغي التنزيل', 'Download cancelled') : A('تعذّر التنزيل. تحقق من الاتصال.', 'The download failed. Check the connection.');
  }
  async function lessonJob(lid, cid, q) {
    var id = did('lesson', lid); if (HAVE[id] || RUN[id]) return;
    var c = await DB.one('courses', cid), x = await DB.lesson(lid); if (!x) throw new Error('missing');
    var info = { kind: x.kind || 'video', title: x.title, body: x.body || '', quiz: x.quiz || [], course: c ? c.title : '', cid: cid, paid: !!(c && +c.price > 0 && !x.free) }, url = null;
    if (info.kind === 'video') { if (!x.video_id && DB.live) throw new Error('denied'); url = await DB.videoFile(x, q); }
    else if (info.kind === 'audio') { var au = await DB.audioPlay(x); if (!au) throw new Error('denied'); url = au.src; }
    else if (!info.body && !(info.quiz || []).length) throw new Error('denied');
    await save({ id: id, kind: 'lesson', lk: info.kind, title: x.title, sub: info.course, cid: cid, ref: lid, mime: info.kind === 'audio' ? 'audio/mpeg' : 'video/mp4' }, info, url);
  }
  IS.ACT.dl = async function (b) {
    var kind = b.getAttribute('data-k'), rid = b.getAttribute('data-id'), id = did(kind, rid);
    if (HAVE[id]) return IS.go('dl/' + id);
    if (RUN[id]) { if (await IS.confirm(A('إلغاء هذا التنزيل؟', 'Cancel this download?'))) RUN[id] && RUN[id].ctl.abort(); return; }
    if (!navigator.onLine) return IS.toast(A('التنزيل يحتاج إلى الإنترنت.', 'Downloading needs the internet.'));
    try {
      if (kind === 'lesson') {
        var q = null; if (b.getAttribute('data-v') === 'video') { q = await quality(); if (!q) return; }
        await lessonJob(rid, b.getAttribute('data-c'), q);
      } else {
        var f = await DB.one('files', rid); if (!f) throw new Error('missing');
        if (f.status !== 'published' || !IS.inStudySpace(f)) throw new Error('denied');
        var document = IS.libraryDocument(f);
        if (document.mime === 'application/pdf') {
          await Promise.all([PDFJS, PDFJS.replace('pdf.min.js', 'pdf.worker.min.js')].map(async function (asset) {
            if (!(await fetch(asset)).ok) throw new Error('PDF reader unavailable');
          }));
        }
        var source = await DB.fileUrl('library', document.path);
        if (!source) throw new Error('missing library file');
        await save({ id: id, kind: 'file', title: f.title, sub: f.author || '', ref: rid, mime: document.mime, pth: document.path },
          { title: f.title, author: f.author || '', pages: f.pages || 0, about: f.about || '' }, source);
      }
      IS.toast(A('نُزّل داخل المنصة. يعمل دون إنترنت من «تنزيلاتي».', 'Downloaded inside the platform. Open it offline from “My downloads”.'));
    } catch (e) { IS.toast(why(e)); }
  };
  IS.ACT.dlcourse = async function (b) {
    if (!navigator.onLine) return IS.toast(A('التنزيل يحتاج إلى الإنترنت.', 'Downloading needs the internet.'));
    var cid = b.getAttribute('data-c'), secs = await IS.courseLessons(cid), all = []; secs.forEach(function (s) { all = all.concat(s.lessons); });
    var todo = all.filter(function (x) { return !HAVE[did('lesson', x.id)]; }); if (!todo.length) return IS.toast(A('كل دروس الكورس منزّلة.', 'Every lesson of the course is downloaded.'));
    var q = todo.some(function (x) { return (x.kind || 'video') === 'video'; }) ? await quality() : '480'; if (!q) return;
    IS.toast(A('بدأ تنزيل ', 'Downloading ') + todo.length + A(' درسًا…', ' lessons…'));
    var saved = 0, lastError;
    for (var i = 0; i < todo.length; i++) {
      try { await lessonJob(todo[i].id, cid, q); saved++; }
      catch (error) { lastError = error; if (/abort/i.test(error.message || '')) break; }
    }
    if (!saved && lastError) return IS.toast(why(lastError), true);
    IS.toast(A('نُزّل ', 'Downloaded ') + saved + ' / ' + todo.length + A(' من الدروس', ' lessons'));
  };

  /* ---------- renew: still enrolled / still published (online, at most once a day per item) ---------- */
  async function renew(it) {
    var allowed;
    if (it.kind === 'file') { var f = await DB.one('files', it.ref); allowed = !!(f && f.status === 'published'); }
    else { var x = await DB.lesson(it.ref); allowed = !!(x && (it.lk === 'video' || it.lk === 'audio' ? (x.video_id || !DB.live) : (x.body || (x.quiz || []).length))); }
    if (!allowed) { await drop(it.id); return false; }
    it.exp = Date.now() + DAYS * 864e5; it.chk = Date.now(); await put('items', it); HAVE[it.id] = it; return true;
  }
  async function renewAll(list) { if (!navigator.onLine) return; for (var i = 0; i < list.length; i++) { if (Date.now() - (list[i].chk || 0) > 864e5) { try { await renew(list[i]); } catch (e) {} } } }

  /* ---------- My downloads ---------- */
  function size(b) { return '<bdi dir="ltr">' + size0(b) + '</bdi>'; }
  function size0(b) { return b > 1073741824 ? (b / 1073741824).toFixed(1) + ' GB' : b > 1048576 ? Math.round(b / 1048576) + ' MB' : (b ? Math.max(1, Math.round(b / 1024)) : 0) + ' KB'; }
  function runList() { var ks = Object.keys(RUN); return ks.length ? '<section class="box"><h2>' + ic('download') + IS.T('جارٍ التنزيل', 'Downloading now') + '</h2>' + ks.map(function (k) { return '<div class="dlr"><span class="grow"><b>' + esc(RUN[k].t) + '</b><i class="dlbar" style="--p:' + RUN[k].p + '%"></i></span><em>' + N(RUN[k].p + '%') + '</em><button class="ib sm" data-act="dlstop" data-id="' + esc(k) + '" aria-label="' + esc(A('إلغاء', 'Cancel')) + '">' + ic('x') + '</button></div>'; }).join('') + '</section>' : ''; }
  IS.ACT.dlstop = function (b) { var r = RUN[b.getAttribute('data-id')]; if (r) r.ctl.abort(); };
  function row(it) {
    var exp = it.exp < Date.now(), icn = it.kind === 'file' ? (/pdf/.test(it.mime) ? 'file' : 'image') : it.lk === 'quiz' ? 'qb' : it.lk === 'video' ? 'video' : 'file';
    return '<div class="dlr' + (exp ? ' exp' : '') + '"><span class="dli">' + ic(icn) + '</span><a class="grow" href="#dl/' + esc(it.id) + '"><b dir="auto">' + esc(it.title) + '</b><small>' + esc(it.sub || '') + (it.size ? ' · ' + size(it.size) : '') + ' · ' +
      (exp ? esc(A('انتهت المدة: اتصل بالإنترنت للتجديد', 'Expired: connect to renew')) : esc(A('متاح حتى ', 'Available until ')) + esc(IS.date(new Date(it.exp).toISOString()))) + '</small></a>' +
      '<a class="btn sm pri" href="#dl/' + esc(it.id) + '">' + ic(icn === 'video' ? 'play' : 'open') + esc(A('فتح', 'Open')) + '</a><button class="ib sm" data-act="dldel" data-id="' + esc(it.id) + '" aria-label="' + esc(A('حذف', 'Delete')) + '">' + ic('trash') + '</button></div>';
  }
  IS.ACT.dldel = async function (b) { if (!(await IS.confirm(A('حذف هذا التنزيل من المنصة؟', 'Delete this download from the platform?')))) return; await drop(b.getAttribute('data-id')); IS.refresh(); };
  IS.ACT.dldelall = async function () { if (!(await IS.confirm(A('حذف كل التنزيلات من هذا الجهاز؟', 'Delete every download on this device?')))) return; var l = await items(); for (var i = 0; i < l.length; i++) await drop(l[i].id); IS.refresh(); };
  IS.page('downloads', async function () {
    var l = await items(); l.sort(function (a, b) { return b.saved - a.saved; });
    var used = l.reduce(function (s, x) { return s + (x.size || 0); }, 0), est = null; try { est = navigator.storage && await navigator.storage.estimate(); } catch (e) {}
    var les = l.filter(function (x) { return x.kind === 'lesson'; }), fil = l.filter(function (x) { return x.kind === 'file'; }), byC = {};
    les.forEach(function (x) { (byC[x.sub || ''] = byC[x.sub || ''] || []).push(x); });
    var h = IS.banner(IS.T('تنزيلاتي', 'My downloads'), esc(A('دروس وكتب نزّلتها داخل المنصة لتعمل دون إنترنت.', 'Lessons and books you downloaded inside the platform to use without internet.')), 'download') +
      '<section class="dlhead"><div class="dlst">' + [['video', les.length, A('درس', 'lessons')], ['open', fil.length, A('ملف', 'files')], ['layers', size(used), A('مستخدمة', 'used')]].map(function (t) { return '<span>' + ic(t[0]) + '<b>' + (typeof t[1] === 'number' ? N(t[1]) : t[1]) + '</b><small>' + esc(t[2]) + '</small></span>'; }).join('') + '</div>' +
      (est && est.quota ? '<div class="dlq2"><small>' + esc(A('مساحة المنصة على هذا الجهاز', 'Platform space on this device')) + ': <bdi dir="ltr">' + size0(est.usage || 0) + ' / ' + size0(est.quota) + '</bdi>' + '</small>' + IS.bar(Math.round((est.usage || 0) / est.quota * 100)) + '</div>' : '') +
      '<p class="note">' + ic('shield') + '<span>' + esc(A('التنزيلات محفوظة ومشفّرة داخل المنصة فقط: لا تظهر في ملفات الهاتف ولا يمكن نسخها. تبقى ' + DAYS + ' يومًا وتتجدد تلقائيًا عند الاتصال بالإنترنت.', 'Downloads are kept encrypted inside the platform only: they do not appear in the phone’s files and cannot be copied. They last ' + DAYS + ' days and renew by themselves when you are online.')) + '</span></p></section>' +
      '<div id="dlrun">' + runList() + '</div>';
    if (!l.length) return h + IS.empty('download', A('لا توجد تنزيلات بعد', 'No downloads yet'), A('افتح درسًا أو كتابًا واضغط «تنزيل للمشاهدة دون إنترنت».', 'Open a lesson or a book and press “Download for offline”.'), '<a class="btn pri" href="#learning">' + ic('layers') + esc(A('كورساتي', 'My courses')) + '</a>');
    h += Object.keys(byC).map(function (c) { return '<section class="box"><h2>' + ic('layers') + esc(c || A('دروس', 'Lessons')) + '</h2><div class="dll">' + byC[c].map(row).join('') + '</div></section>'; }).join('');
    if (fil.length) h += '<section class="box"><h2>' + ic('open') + IS.T('الكتب والملفات', 'Books and files') + '</h2><div class="dll">' + fil.map(row).join('') + '</div></section>';
    h += '<div class="row center"><button class="btn ghost bad" data-act="dldelall">' + ic('trash') + esc(A('حذف كل التنزيلات', 'Delete all downloads')) + '</button></div>';
    IS.after = function () { renewAll(l).then(function (ch) { }); };
    return h;
  }, { auth: true });

  /* ---------- offline viewer ---------- */
  var URLNOW = null;
  IS.page('dl', async function (id) {
    var it = HAVE[id] || await get('items', id); if (!it || it.u !== uid()) return null;
    if (it.exp < Date.now()) { var ok = false; if (navigator.onLine) { try { ok = await renew(it); } catch (e) {} } if (!ok) return IS.empty('lock', A('انتهت مدة هذا التنزيل', 'This download has expired'), navigator.onLine ? A('لم يعد هذا المحتوى متاحًا لحسابك.', 'This content is no longer available to your account.') : A('اتصل بالإنترنت ليتجدد تلقائيًا.', 'Connect to the internet and it renews by itself.'), '<a class="btn pri" href="#downloads">' + esc(A('تنزيلاتي', 'My downloads')) + '</a>'); }
    var info = await readInfo(it), h = '<nav class="crumb"><a href="#downloads">' + esc(A('تنزيلاتي', 'My downloads')) + '</a>' + ic('chev', 'fl') + '<span>' + esc(it.title) + '</span></nav>';
    var head = '<header class="dlvh"><span class="chip">' + ic('download') + esc(A('دون إنترنت', 'Offline')) + '</span><h1 tabindex="-1">' + esc(it.title) + '</h1><p class="mut">' + esc(it.sub || '') + '</p></header>';
    if (it.kind === 'lesson' && info.kind === 'video') h += head + '<div class="player" id="dlview"><div class="loading"><span class="spin"></span></div></div>';
    else if (it.kind === 'lesson' && info.kind === 'audio') h += head + '<div class="aplayer-wrap" id="dlview"><div class="loading"><span class="spin"></span></div></div>' + (info.body ? '<article class="box lesson-reading"><div class="rich">' + IS.clean(info.body) + '</div></article>' : '');
    else if (it.kind === 'lesson' && info.kind === 'quiz') h += '<div class="box quiz" id="quiz">' + head + (info.quiz || []).map(function (q, k) { return '<fieldset class="qq" data-a="' + q.a + '"><legend>' + N(k + 1) + '. ' + esc(q.q) + '</legend>' + (q.o || []).map(function (o, j) { return '<label class="qo"><input type="radio" name="q' + k + '" value="' + j + '"><span>' + esc(o) + '</span></label>'; }).join('') + (q.e ? '<p class="qe" hidden>' + ic('info') + esc(q.e) + '</p>' : '') + '</fieldset>'; }).join('') +
      '<div class="row"><button class="btn pri" data-act="dlquiz">' + esc(A('تحقق من الإجابات', 'Check answers')) + '</button><span id="qscore" class="qs"></span></div></div>';
    else if (it.kind === 'lesson') h += '<article class="box article">' + head + '<div class="rich">' + IS.clean(info.body || '') + '</div></article>';
    else h += '<section class="box">' + head + (info.about ? '<p>' + esc(info.about) + '</p>' : '') + '<div class="viewer" id="dlview" oncontextmenu="return false"><div class="loading"><span class="spin"></span></div></div></section>';
    IS.after = async function () {
      var v = $('#dlview'); if (!v) return; if (URLNOW) { URL.revokeObjectURL(URLNOW); URLNOW = null; }
      try {
        var blob = await readBlob(it); URLNOW = URL.createObjectURL(blob);
        if (it.kind === 'lesson' && info.kind === 'audio') { v.innerHTML = IS.audioPlayer(URLNOW, { title: it.title }); IS.audioWire(v, { id: it.ref, title: it.title }); return; }
        if (it.kind === 'lesson') { v.innerHTML = '<video controls controlsList="nodownload noremoteplayback" disablePictureInPicture playsinline oncontextmenu="return false" src="' + URLNOW + '"></video>';
          if (IS.videoIntro) IS.videoIntro(v, { course: info.course, lesson: it.title, paid: !!info.paid }); return; }
        await IS.renderLibraryDocument(v, it.mime || 'application/pdf', URLNOW, blob, { id: it.ref || it.id, title: it.title });
      } catch (e) { v.innerHTML = IS.empty('file', A('تعذّر فتح التنزيل', 'The download could not be opened'), A('احذفه ونزّله مرة أخرى عند الاتصال.', 'Delete it and download it again when online.')); }
    };
    return h;
  }, { auth: true });
  IS.ACT.dlquiz = function () {
    var qs = IS.$$('#quiz .qq'), right = 0;
    qs.forEach(function (f) { var a = +f.getAttribute('data-a'), sel = f.querySelector('input:checked'); f.querySelectorAll('.qo').forEach(function (o, j) { o.classList.toggle('right', j === a); o.classList.toggle('wrong', !!(sel && +sel.value === j && j !== a)); }); if (sel && +sel.value === a) right++; var e = f.querySelector('.qe'); if (e) e.hidden = false; });
    $('#qscore').innerHTML = N(right) + ' / ' + N(qs.length);
  };

  /* start: the bar now, the list of this account's downloads once the account is known */
  bar();
  var st = IS.start; IS.start = async function () { await st.apply(this, arguments); await loadHave(); bar(); };
  var lm = IS.loadMe; IS.loadMe = async function () { await lm.apply(this, arguments); loadHave(); };
})();
