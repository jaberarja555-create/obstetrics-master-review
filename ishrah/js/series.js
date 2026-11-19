/* اشرح لي: library series (owner, 19 Nov 2026: "when a student uploads he should be able to upload multiple files and put them as a group,
   like sheets; a group opens nicely as a book series or sheets, ordered, so he can choose and open from an organised place").
   Each part is a normal file row (review, rating, comments, download, reader); parts share series_id / series_title / series_no
   (supabase/022_file_series.sql). The library and the Home feed show one card per series; #series/<id> lists the parts in order;
   the reader offers «next part» at the end of each part. */
(function () {
  var A = IS.A, esc = IS.esc, ic = IS.ic, N = IS.N, $ = IS.$;
  var TYPES = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', txt: 'text/plain' };
  function ext(f) { return f ? f.name.split('.').pop().toLowerCase() : ''; }
  function partName(f) { return f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim(); }
  function uuid() { return (crypto.randomUUID && crypto.randomUUID()) || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }); }

  /* one card per series: the first part stands for it, with all parts in order */
  IS.seriesCollapse = function (rows) {
    var out = [], seen = {};
    rows.forEach(function (f) {
      if (!f.series_id) return out.push(f);
      if (seen[f.series_id]) { seen[f.series_id]._parts.push(f); return; }
      var rep = Object.assign({}, f, { _parts: [f] }); seen[f.series_id] = rep; out.push(rep);
    });
    out.forEach(function (r) { if (r._parts) r._parts.sort(function (a, b) { return (a.series_no || 0) - (b.series_no || 0); }); });
    return out;
  };
  IS.seriesCard = function (s, feed) {
    var first = s._parts[0], k = IS.libraryKind(first.kind), pages = s._parts.reduce(function (a, p) { return a + (+p.pages || 0); }, 0);
    return '<article class="' + (feed ? 'box feed-card feed-series' : 'fcard scard') + '">' +
      (feed ? '<header class="feed-card-header"><span>' + ic('layers') + esc(A('سلسلة في المكتبة', 'Library series')) + '</span>' + (first.published_at ? '<time>' + esc(IS.ago(first.published_at)) + '</time>' : '') + '</header>' : '') +
      '<a class="fimg sstack" href="#series/' + esc(s.series_id) + '" aria-label="' + esc(s.series_title || first.title) + '">' + IS.libraryCover(first) + '<span class="scount">' + ic('layers') + N(s._parts.length) + '</span></a>' +
      '<div class="fb"><span class="ftype">' + ic(k[1]) + esc(A(k[2], k[3])) + ' · ' + esc(A('سلسلة', 'Series')) + '</span><b><a href="#series/' + esc(s.series_id) + '" dir="auto">' + esc(s.series_title || first.title) + '</a></b>' +
      '<small>' + esc(s._parts.length + ' ' + A('أجزاء', 'parts') + (pages ? ' · ' + pages + ' ' + A('صفحة', 'pages') : '')) + (first.author ? ' · ' + esc(first.author) : '') + '</small>' +
      '<a class="btn pri sm sopen" href="#series/' + esc(s.series_id) + '">' + ic('open') + esc(A('افتح السلسلة', 'Open the series')) + '</a></div></article>';
  };

  /* ---- the series page: the parts in order ---- */
  IS.page('series', async function (id) {
    var parts = (await DB.q('files', { eq: { series_id: id } })).filter(function (f) { return f.status === 'published' || (IS.ME && (f.owner_id === IS.ME.id || IS.can('library', 'approve'))); })
      .sort(function (a, b) { return (a.series_no || 0) - (b.series_no || 0); });
    if (!parts.length) return null;
    var first = parts[0], k = IS.libraryKind(first.kind), subj = IS.subj(first.subject), title = first.series_title || first.title;
    var pages = parts.reduce(function (a, p) { return a + (+p.pages || 0); }, 0), lastRead = 0;
    parts.forEach(function (p, i) { try { if (+JSON.parse(localStorage.getItem('ish-rpg:' + p.id) || '0') > 0) lastRead = i; } catch (e) {} });
    var h = '<nav class="crumb"><a href="#library">' + esc(A('مكتبتي', 'My Library')) + '</a>' + ic('chev', 'fl') + '<span>' + esc(title) + '</span></nav>';
    h += '<article class="box shead"><div class="sstack big">' + IS.libraryCover(first) + '<span class="scount">' + ic('layers') + N(parts.length) + '</span></div><div class="sinfo">' +
      '<span class="ftype">' + ic(k[1]) + esc(A(k[2], k[3])) + ' · ' + esc(A('سلسلة', 'Series')) + '</span><h1 tabindex="-1" dir="auto">' + esc(title) + '</h1>' +
      '<p class="mut">' + [subj && subj.en, first.author].filter(Boolean).map(esc).join(' · ') + '</p>' +
      '<div class="sfacts"><span>' + ic('layers') + N(parts.length) + ' ' + esc(A('أجزاء', 'parts')) + '</span>' + (pages ? '<span>' + ic('file') + N(pages) + ' ' + esc(A('صفحة', 'pages')) + '</span>' : '') + '</div>' +
      (first.about ? '<p class="pre" dir="auto">' + esc(first.about) + '</p>' : '') +
      (IS.ME ? '<button type="button" class="btn pri" data-act="sread" data-id="' + esc(parts[lastRead].id) + '">' + ic('open') +
        esc(lastRead ? A('تابع: الجزء ', 'Continue: part ') + (lastRead + 1) : A('ابدأ من الجزء الأول', 'Start with part 1')) + '</button>' :
        '<button type="button" class="btn pri" data-act="login">' + ic('lock') + esc(A('سجّل الدخول للقراءة', 'Sign in to read')) + '</button>') + '</div></article>';
    h += '<section class="box"><h2>' + ic('list') + IS.T('أجزاء السلسلة', 'Parts') + '</h2><ol class="sparts">' + parts.map(function (p, i) {
      var pg = 0; try { pg = +JSON.parse(localStorage.getItem('ish-rpg:' + p.id) || '0') || 0; } catch (e) {}
      var done = pg && p.pages && pg >= p.pages;
      return '<li class="spart' + (done ? ' done' : '') + '"><span class="sno">' + (done ? ic('check') : N(i + 1)) + '</span><div class="sp-b"><a href="#file/' + esc(p.id) + '" dir="auto"><b>' + esc(p.title) + '</b></a>' +
        '<small>' + [p.pages ? p.pages + ' ' + A('صفحة', 'pages') : '', pg > 1 ? A('توقفت عند ص ', 'stopped at p. ') + pg : '', p.status !== 'published' ? A('بانتظار المراجعة', 'awaiting review') : ''].filter(Boolean).map(esc).join(' · ') + '</small></div>' +
        '<div class="sp-a">' + (IS.ME ? '<button type="button" class="btn ghost sm" data-act="sread" data-id="' + esc(p.id) + '">' + ic('open') + esc(A('افتح', 'Open')) + '</button>' + IS.dlBtn('file', p.id) : '') + '</div></li>';
    }).join('') + '</ol></section>';
    IS.SERIES = parts;
    IS.after = function (main) { IS.hydrateLibraryCovers(main).catch(function () {}); };
    return h;
  });
  /* open a part; the reader shows «next part» at the end of it */
  IS.ACT.sread = async function (b) {
    var parts = IS.SERIES || [], i = parts.findIndex(function (p) { return p.id === b.dataset.id; }); if (i < 0) return;
    openPart(parts, i, b);
  };
  async function openPart(parts, i, b) {
    var p = parts[i], html = b && b.innerHTML; if (b) { b.disabled = true; b.innerHTML = '<span class="spin"></span>'; }
    try {
      var media = IS.libraryDocument(p), url = await DB.fileUrl('library', media.path); if (!url) throw new Error('missing');
      var next = parts[i + 1] ? { title: A('الجزء ', 'Part ') + (i + 2) + ': ' + parts[i + 1].title, open: function () { openPart(parts, i + 1); } } : null;
      if (media.mime === 'application/pdf') IS.openReader({ id: p.id, title: (p.series_title ? p.series_title + ' · ' : '') + p.title, url: url, next: next });
      else { var box = IS.sheet(esc(p.title), '<div class="viewer" id="sheetview"></div>', { wide: 1 }); await IS.renderLibraryDocument(box.querySelector('#sheetview'), media.mime, url, null, { id: p.id, title: p.title }); }
    } catch (e) { IS.toast(A('تعذّر فتح الجزء. أعد المحاولة.', 'The part could not be opened. Try again.')); }
    finally { if (b) { b.disabled = false; b.innerHTML = html; } }
  }

  /* ---- uploading a group ---- */
  IS.seriesForm = function () {
    var subj = (IS.fileFields({}, true).match(/<select name="subject">[\s\S]*?<\/select>/) || [''])[0];
    var kinds = (IS.fileFields({}, true).match(/<select name="kind">[\s\S]*?<\/select>/) || [''])[0];
    return '<form class="form" data-form="shareseries"><label class="fl"><span>' + esc(A('اسم السلسلة أو المجموعة', 'Series or group name')) + ' *</span><input name="series_title" required maxlength="160" placeholder="' +
      esc(A('مثال: شيتات الباطنية – أمراض القلب', 'e.g. Internal medicine sheets – Cardiology')) + '"></label>' +
      '<div class="g2f"><label class="fl"><span>' + esc(A('النوع', 'Type')) + '</span>' + kinds + '</label><label class="fl"><span>' + esc(A('المادة', 'Subject')) + '</span>' + subj + '</label></div>' +
      '<label class="fl"><span>' + esc(A('المؤلف أو المصدر', 'Author or source')) + '</span><input name="author" maxlength="120"></label>' +
      '<label class="fl"><span>' + esc(A('وصف قصير', 'Short description')) + '</span><textarea name="about" rows="2" maxlength="600"></textarea></label>' +
      '<label class="fl file"><span>' + esc(A('الملفات (كل ملف حتى 50 ميغابايت)', 'Files (up to 50 MB each)')) + ' *</span><input type="file" name="files" multiple data-series-files accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"><small>' +
      esc(A('اختر عدة ملفات معًا (PDF أو صور). رتّبها وسمِّ كل جزء أدناه.', 'Choose several files at once (PDF or pictures). Order them and name each part below.')) + '</small></label>' +
      '<ol class="sorder" id="sorder"></ol><p class="sprog mut" id="sprog" hidden></p>' +
      '<p class="note">' + ic('shield') + '<span>' + esc(A('يراجع فريق المحتوى الملفات قبل نشرها. ارفع فقط ما تملك حق مشاركته.', 'The content team reviews the files before publishing. Upload only what you have the right to share.')) + '</span></p>' +
      '<button class="btn pri wide">' + ic('upload') + esc(A('رفع المجموعة', 'Upload the group')) + '</button></form>';
  };
  var PICKED = [];
  function drawOrder() {
    var ol = $('#sorder'); if (!ol) return;
    ol.innerHTML = PICKED.map(function (x, i) {
      return '<li><span class="sno">' + (i + 1) + '</span><input class="spn" data-i="' + i + '" value="' + esc(x.title) + '" dir="auto" maxlength="160" aria-label="' + esc(A('اسم الجزء', 'Part name')) + '">' +
        '<button type="button" class="ib sm" data-act="smove" data-i="' + i + '" data-d="-1"' + (i ? '' : ' disabled') + ' aria-label="' + esc(A('أعلى', 'Up')) + '">' + ic('up') + '</button>' +
        '<button type="button" class="ib sm" data-act="smove" data-i="' + i + '" data-d="1"' + (i < PICKED.length - 1 ? '' : ' disabled') + ' aria-label="' + esc(A('أسفل', 'Down')) + '">' + ic('down') + '</button>' +
        '<button type="button" class="ib sm" data-act="sdrop" data-i="' + i + '" aria-label="' + esc(A('إزالة', 'Remove')) + '">' + ic('x') + '</button></li>';
    }).join('');
  }
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t.matches || !t.matches('[data-series-files]')) return;
    Array.from(t.files || []).forEach(function (f) { PICKED.push({ file: f, title: partName(f) }); });
    PICKED.sort(function (a, b) { return a.file.name.localeCompare(b.file.name, undefined, { numeric: true }); });
    t.value = ''; drawOrder();
  });
  document.addEventListener('input', function (e) { var t = e.target; if (t.classList && t.classList.contains('spn')) PICKED[+t.dataset.i].title = t.value; });
  IS.ACT.smove = function (b) { var i = +b.dataset.i, j = i + +b.dataset.d; var x = PICKED[i]; PICKED[i] = PICKED[j]; PICKED[j] = x; drawOrder(); };
  IS.ACT.sdrop = function (b) { PICKED.splice(+b.dataset.i, 1); drawOrder(); };
  IS.SUB.shareseries = async function (d, form) {
    if (PICKED.length < 2) return IS.toast(A('اختر ملفين أو أكثر للمجموعة.', 'Choose two or more files for the group.'));
    var bad = PICKED.filter(function (x) { return !TYPES[ext(x.file)] || !x.file.size || x.file.size > 50 * 1048576; });
    if (bad.length) return IS.toast(A('ملف غير مدعوم أو أكبر من 50 ميغابايت: ', 'Unsupported or over 50 MB: ') + bad[0].file.name);
    var sid = uuid(), subject = IS.subj(d.subject), scope = IS.mySection(), status = IS.can('library', 'approve') ? 'published' : 'pending';
    var prog = $('#sprog'), btn = form.querySelector('button.pri'); btn.disabled = true; prog.hidden = false;
    try {
      for (var i = 0; i < PICKED.length; i++) {
        prog.textContent = A('جارٍ رفع الجزء ', 'Uploading part ') + (i + 1) + ' / ' + PICKED.length + '…';
        var f = PICKED[i].file, type = TYPES[ext(f)], file = f.type === type ? f : new File([f], f.name, { type: type }), meta = null, cover = null;
        if (type === 'application/pdf' && IS.pdfMeta) meta = await IS.pdfMeta(file, true).catch(function () { return null; });
        if (meta && meta.cover) cover = meta.cover; else if (/^image\//.test(type)) cover = file;
        var row = { title: (PICKED[i].title || partName(f)).slice(0, 160), kind: d.kind, subject: d.subject, cat: (subject || {}).cat || (scope ? scope.id : ''),
          spec: (subject || {}).spec || IS.SPEC || 'medicine', author: d.author || '', about: d.about || '', owner_id: IS.ME.id, owner_name: IS.ME.name, status: status,
          series_id: sid, series_title: d.series_title, series_no: i + 1, mime: type, size: f.size, pages: meta ? meta.pages : 0,
          path: await DB.upload('library', /^image\//.test(type) ? await IS.shrink(file, 2000, 0.85) : file) };
        if (cover) row.cover = await DB.upload('library', await IS.shrink(cover, 600, 0.82));
        if (!DB.live && status === 'published') row.published_at = new Date().toISOString();
        await DB.ins('files', row);
      }
      PICKED = []; IS.closeSheet();
      IS.toast(status === 'published' ? A('نُشرت المجموعة', 'The group is published') : A('شكرًا! ستُنشر المجموعة بعد المراجعة.', 'Thank you! The group will be published after review.'));
      IS.go('series/' + sid);
    } catch (e) { IS.toast(A('توقف الرفع: ', 'Upload stopped: ') + (e.message || '')); }
    finally { btn.disabled = false; prog.hidden = true; }
  };
  IS.resetSeries = function () { PICKED = []; };
})();
