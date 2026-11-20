/* اشرح لي: library series (owner, 19 Nov 2026: "when a student uploads he should be able to upload multiple files and put them as a group,
   like sheets; a group opens nicely as a book series or sheets, ordered, so he can choose and open from an organised place").
   Each part is a normal file row (review, rating, comments, download, reader); parts share series_id / series_title / series_no
   (supabase/022_file_series.sql). The library and the Home feed show one card per series; #series/<id> lists the parts in order;
   the reader offers «next part» at the end of each part. */
(function () {
  var A = IS.A, esc = IS.esc, ic = IS.ic, N = IS.N, $ = IS.$;
  function partName(f) { return f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim(); }
  function uuid() { return (crypto.randomUUID && crypto.randomUUID()) || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }); }

  var scores = new Map(), scoreRequests = new Map();
  function viewer() { return (IS.ME && IS.ME.id) || 'visitor'; }
  IS.keepSeriesScore = function (id, values) {
    var key = viewer() + '/' + id;
    scores.set(key, Object.assign({}, scores.get(key), values));
  };
  IS.seriesScore = function (id) { return scores.get(viewer() + '/' + id) || {}; };
  function seriesTotals(rows, id, account) {
    var own = rows.find(function (row) { return row.user_id === account; }) || {};
    return { series_id: id, like_count: rows.filter(function (row) { return row.reaction === 1; }).length,
      dislike_count: rows.filter(function (row) { return row.reaction === -1; }).length,
      rating_count: rows.filter(function (row) { return row.stars; }).length,
      rating_points: rows.reduce(function (sum, row) { return sum + (row.stars || 0); }, 0),
      rated_like_count: rows.filter(function (row) { return row.stars && row.reaction === 1; }).length,
      rated_dislike_count: rows.filter(function (row) { return row.stars && row.reaction === -1; }).length,
      love_count: rows.filter(function (row) { return row.reaction === 2; }).length,
      angry_count: rows.filter(function (row) { return row.reaction === 3; }).length,
      my_reaction: own.reaction || 0, my_stars: own.stars || 0 };
  }
  IS.fetchSeriesScores = async function (ids) {
    if (!DB.live) {
      var rows = await DB.q('series_feedback', { in: { series_id: ids } }), cm = await DB.q('library_comments', { in: { series_id: ids } });
      return ids.map(function (id) { return Object.assign(seriesTotals(rows.filter(function (row) { return row.series_id === id; }), id, viewer()),
        { comment_count: cm.filter(function (c) { return c.series_id === id; }).length }); });
    }
    var response = await DB.sb.rpc('ish_series_rating_scores', { targets: ids });
    if (response.error) throw response.error;
    return response.data;
  };
  IS.hydrateSeriesScores = function (root) {
    var account = viewer();
    var ids = Array.from(new Set(IS.$$('[data-feedback^="series/"][data-reaction=""]', root).map(function (bar) {
      return bar.dataset.feedback.split('/')[1];
    }))).filter(function (id) { return !scoreRequests.has(account + '/' + id); });
    if (!ids.length) return;
    ids.forEach(function (id) { scoreRequests.set(account + '/' + id, true); });
    IS.fetchSeriesScores(ids).then(function (items) {
      if (viewer() !== account) return;
      items.forEach(function (item) {
        if (IS.seriesScore(item.series_id).my_reaction == null) IS.applySeriesScore(item);
      });
    }).catch(function () {}).finally(function () {
      ids.forEach(function (id) { scoreRequests.delete(account + '/' + id); });
    });
  };
  IS.seriesVote = async function (id, value, rating) {
    if (DB.live) {
      var result = await DB.sb.rpc('ish_series_vote', { target: id, action: rating ? 'rate' : 'react', value: value });
      if (result.error) throw result.error;
      return result.data;
    }
    var account = viewer(), fields = { series_id: id, user_id: account };
    var current = (await DB.q('series_feedback', { eq: fields }))[0];
    var change = rating ? { stars: value } : { reaction: current && current.reaction === value ? null : value };
    if (current) await DB.upd('series_feedback', current.id, change);
    else await DB.ins('series_feedback', Object.assign({}, fields, change));
    return seriesTotals(await DB.q('series_feedback', { eq: { series_id: id } }), id, account);
  };
  function seriesFeedback(id, first) {
    return IS.feedVoteBar('series', Object.assign({ id: id, owner_id: first.owner_id, _price: Number(first.price) || 0 }, IS.seriesScore(id)), true);
  }

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
      '<div class="row library-feed-actions"><a class="btn ghost sm" href="#series/' + esc(s.series_id) +
      '">' + ic('open') + esc(A('افتح السلسلة', 'Open the series')) + '</a></div></div>' + seriesFeedback(s.series_id, first) + '</article>';
  };

  /* ---- the series page: the parts in order ---- */
  IS.page('series', async function (arg) {
    var id = String(arg || '').split('/')[0];
    await IS.loadBuys();
    var parts = (await DB.q('files', { eq: { series_id: id } })).filter(function (f) { return f.status === 'published' || (IS.ME && (f.owner_id === IS.ME.id || IS.can('library', 'approve'))); })
      .sort(function (a, b) { return (a.series_no || 9999) - (b.series_no || 9999) || a.id.localeCompare(b.id); });
    if (!parts.length) return null;
    var first = parts[0], k = IS.libraryKind(first.kind), title = first.series_title || first.title;
    if (!IS.can('library') && !IS.inStudySpace(first)) return IS.outsideStudySpace(first);
    var own = parts.find(function (part) { return !!IS.editLibraryFileButton(part); });
    var pages = parts.reduce(function (a, p) { return a + (+p.pages || 0); }, 0), lastRead = 0;
    parts.forEach(function (p, i) { try { if (+JSON.parse(localStorage.getItem('ish-rpg:' + p.id) || '0') > 0) lastRead = i; } catch (e) {} });
    var h = '<nav class="crumb"><a href="#library">' + esc(A('مكتبتي', 'My Library')) + '</a>' + ic('chev', 'fl') + '<span>' + esc(title) + '</span></nav>';
    h += '<article class="box shead"><div class="sstack big">' + IS.libraryCover(first) + '<span class="scount">' + ic('layers') + N(parts.length) + '</span></div><div class="sinfo">' +
      '<span class="ftype">' + ic(k[1]) + esc(A(k[2], k[3])) + ' · ' + esc(A('سلسلة', 'Series')) + '</span><h1 tabindex="-1" dir="auto">' + esc(title) + '</h1>' +
      '<p class="mut">' + IS.librarySubjectNames({ _parts: parts }).concat(first.author).filter(Boolean).map(esc).join(' · ') + '</p>' +
      '<div class="sfacts"><span>' + ic('layers') + N(parts.length) + ' ' + esc(A('أجزاء', 'parts')) + '</span>' + (pages ? '<span>' + ic('file') + N(pages) + ' ' + esc(A('صفحة', 'pages')) + '</span>' : '') + '</div>' +
      '<div class="row fprice">' + IS.priceTag(first) + IS.tagChips(first) + '</div>' +
      (first.about ? '<p class="pre" dir="auto">' + esc(first.about) + '</p>' : '') +
      '<div class="row">' + (first.status === 'published' && !IS.fileOpenable(first) ? IS.buyBtn(first) : IS.ME ? '<button type="button" class="btn pri" data-act="sread" data-id="' + esc(parts[lastRead].id) + '">' + ic('open') +
        esc(lastRead ? A('تابع: الجزء ', 'Continue: part ') + (lastRead + 1) : A('ابدأ من الجزء الأول', 'Start with part 1')) + '</button>' :
        '<button type="button" class="btn pri" data-act="login">' + ic('lock') + esc(A('سجّل الدخول للقراءة', 'Sign in to read')) + '</button>') +
      (own ? '<button type="button" class="btn ghost" data-act="edit-library-series" data-id="' + esc(own.id) + '">' + ic('pen') + esc(A('تعديل السلسلة', 'Edit series')) + '</button>' : '') +
      '</div></div></article>';
    if (parts.some(function (part) { return part.status === 'published'; })) {
      h += '<section class="box series-feedback">' + seriesFeedback(id, first) + '</section>';
    }
    h += '<section class="box"><h2>' + ic('list') + IS.T('أجزاء السلسلة', 'Parts') + '</h2><ol class="sparts">' + parts.map(function (p, i) {
      var pg = 0; try { pg = +JSON.parse(localStorage.getItem('ish-rpg:' + p.id) || '0') || 0; } catch (e) {}
      var done = pg && p.pages && pg >= p.pages;
      var fallback = !p.cover && IS.fileOpenable(p) && IS.libraryDocument(p).path;
      return '<li class="spart' + (done ? ' done' : '') + '"><span class="sno">' + (done ? ic('check') : N(i + 1)) + '</span>' +
        '<a class="spart-cover" href="#file/' + esc(p.id) + '" aria-label="' + esc(p.title) + '"' + (fallback ? ' data-part-preview="' + esc(p.id) + '"' : '') +
        '>' + IS.libraryCover(p) + '</a><div class="sp-b"><a href="#file/' + esc(p.id) + '" dir="auto"><b>' + esc(p.title) + '</b></a>' +
        '<small>' + [p.pages ? p.pages + ' ' + A('صفحة', 'pages') : '', pg > 1 ? A('توقفت عند ص ', 'stopped at p. ') + pg : '', p.status !== 'published' ? A('بانتظار المراجعة', 'awaiting review') : ''].filter(Boolean).map(esc).join(' · ') + '</small></div>' +
        '<div class="sp-a">' + (!IS.fileOpenable(p) ? '<span class="chip">' + ic('lock') + esc(A('بعد الشراء', 'After purchase')) + '</span>' : IS.ME ? '<button type="button" class="btn ghost sm" data-act="sread" data-id="' + esc(p.id) + '">' + ic('open') + esc(A('افتح', 'Open')) + '</button>' + IS.dlBtn('file', p.id) : '') + IS.editLibraryFileButton(p) + '</div></li>';
    }).join('') + '</ol></section>';
    IS.SERIES = parts;
    IS.after = function (main) {
      IS.hydrateLibraryCovers(main).catch(function () {});
      IS.warmLibraryReader(parts[lastRead]);
      showMissingCovers(main, parts);
      if (String(arg || '').split('/')[1] === 'comments') IS.openFeedComments(main);
    };
    return h;
  });
  function showMissingCovers(main, parts) {
    if (!window.IntersectionObserver) return;
    var queue = Promise.resolve();
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        queue = queue.then(async function () {
          var target = entry.target;
          if (!target.isConnected) return;
          var part = parts.find(function (item) { return item.id === target.dataset.partPreview; });
          if (!part || !IS.fileOpenable(part)) return;
          var media = IS.libraryDocument(part), isPdf = media.mime === 'application/pdf';
          if (!isPdf && !media.mime.startsWith('image/')) return;
          var url = await DB.fileUrl('library', media.path);
          if (!url || !target.isConnected) return;
          var img = document.createElement('img');
          img.alt = '';
          if (isPdf) {
            var metadata = await IS.pdfMeta(url, true);
            if (!metadata.cover || !target.isConnected) return;
            url = URL.createObjectURL(metadata.cover);
            img.onload = img.onerror = function () { URL.revokeObjectURL(url); };
          }
          img.src = url;
          target.querySelector('.library-cover').append(img);
        }).catch(function () {});
      });
    }, { rootMargin: '100px' });
    IS.$$('[data-part-preview]', main).forEach(function (target) { observer.observe(target); });
  }
  /* open a part; the reader shows «next part» at the end of it */
  IS.ACT.sread = async function (b) {
    var parts = IS.SERIES || [], i = parts.findIndex(function (p) { return p.id === b.dataset.id; }); if (i < 0) return;
    return openPart(parts, i, b);
  };
  function openPart(parts, i, button) {
    var part = parts[i];
    if (!IS.fileOpenable(part)) {
      var buy = document.createElement('button');
      buy.dataset.id = part.id;
      buy.dataset.series = part.series_id || '';
      return IS.ACT.buyfile(buy);
    }
    var next = parts[i + 1] ? { title: A('الجزء ', 'Part ') + (i + 2) + ' · ' + parts[i + 1].title, open: function () { openPart(parts, i + 1); } } : null;
    return IS.openLibraryBook(part, button, { title: (part.series_title ? part.series_title + ' · ' : '') + part.title, next: next });
  }

  /* ---- uploading a group ---- */
  IS.seriesForm = function () {
    return '<form class="form" data-form="shareseries"><label class="fl"><span>' + esc(A('اسم السلسلة أو المجموعة', 'Series or group name')) + ' *</span><input name="series_title" required maxlength="160" placeholder="' +
      esc(A('مثال: شيتات الباطنية – أمراض القلب', 'e.g. Internal medicine sheets – Cardiology')) + '"></label>' +
      IS.libraryKindField({}) + IS.librarySubjectField({}, true) +
      '<label class="fl"><span>' + esc(A('المؤلف أو المصدر', 'Author or source')) + '</span><input name="author" maxlength="120"></label>' +
      '<label class="fl"><span>' + esc(A('وصف قصير', 'Short description')) + '</span><textarea name="about" rows="2" maxlength="600"></textarea></label>' +
      '<label class="fl file"><span>' + esc(A('الملفات (كل ملف حتى 50 ميغابايت)', 'Files (up to 50 MB each)')) + ' *</span><input type="file" name="files" multiple data-series-files accept="' + IS.libraryFileAccept + '"><small>' +
      esc(A('رتّب الأجزاء واختر صورة غلاف لكل جزء، أو استخدم أول صفحة أو شريحة. أرفق نسخة PDF لكل ملف Office.', 'Arrange the parts and choose a cover for each one, or use its first page or slide. Add a PDF copy for each Office file.')) + '</small></label>' +
      IS.sellFields({}, true) + '<ol class="sorder" id="sorder"></ol><p class="sprog mut" id="sprog" hidden></p>' +
      '<p class="note">' + ic('shield') + '<span>' + esc(A('يراجع فريق المحتوى الملفات قبل نشرها. ارفع فقط ما تملك حق مشاركته.', 'The content team reviews the files before publishing. Upload only what you have the right to share.')) + '</span></p>' +
      '<button class="btn pri wide">' + ic('upload') + esc(A('رفع المجموعة', 'Upload the group')) + '</button></form>';
  };
  var PICKED = [];
  function setCover(part, file) {
    if (part.coverUrl) URL.revokeObjectURL(part.coverUrl);
    part.cover = file;
    part.coverUrl = file ? URL.createObjectURL(file) : '';
  }
  function drawOrder(form) {
    var locked = !!form.seriesId;
    form.querySelector('#sorder').innerHTML = PICKED.map(function (part, i) {
      var disabled = locked ? ' disabled' : '', finished = part.saved ? ' disabled' : '';
      return '<li><div class="sorder-main"><span class="sno">' + (i + 1) + '</span><input class="spn" data-i="' + i + '" value="' +
        esc(part.title) + '" dir="auto" maxlength="160" aria-label="' + esc(A('اسم الجزء', 'Part name')) + '"' + disabled + '>' +
        '<button type="button" class="ib sm" data-act="smove" data-i="' + i + '" data-d="-1"' + (i ? disabled : ' disabled') + ' aria-label="' + esc(A('أعلى', 'Up')) + '">' + ic('up') + '</button>' +
        '<button type="button" class="ib sm" data-act="smove" data-i="' + i + '" data-d="1"' + (i < PICKED.length - 1 ? disabled : ' disabled') + ' aria-label="' + esc(A('أسفل', 'Down')) + '">' + ic('down') + '</button>' +
        '<button type="button" class="ib sm" data-act="sdrop" data-i="' + i + '"' + disabled + ' aria-label="' + esc(A('إزالة', 'Remove')) + '">' + ic('x') + '</button></div>' +
        '<div class="sorder-extras">' + (part.coverUrl ? '<img class="sorder-thumb" src="' + esc(part.coverUrl) + '" alt="">' : '') +
        '<label class="fl"><span>' + esc(A('صورة الغلاف (اختياري)', 'Cover picture (optional)')) + '</span>' +
        '<input type="file" data-series-cover="' + i + '" accept="image/jpeg,image/png,image/webp,image/gif"' + finished + '>' +
        (part.cover ? '<small dir="auto">' + esc(part.cover.name) + '</small>' : '') + '</label>' +
        (part.cover && !part.saved ? '<button type="button" class="btn ghost sm" data-act="scoverclear" data-i="' + i + '">' +
          esc(A('استخدم غلافًا تلقائيًا', 'Use automatic cover')) + '</button>' : '') +
        (IS.libraryNeedsReadingCopy(part.file) ? '<label class="fl"><span>' + esc(A('نسخة PDF للقراءة', 'PDF reading copy')) +
          '</span><input type="file" data-series-reading="' + i + '" accept="application/pdf,.pdf"' + finished + '>' +
          (part.reading ? '<small dir="auto">' + esc(part.reading.name) + '</small>' : '') + '</label>' : '') + '</div></li>';
    }).join('');
  }
  document.addEventListener('change', function (event) {
    var input = event.target, form = input.form;
    if (!form || form.dataset.form !== 'shareseries') return;
    var file = input.files && input.files[0];
    if (input.matches('[data-series-files]')) {
      if (form.seriesId) return;
      Array.from(input.files || []).forEach(function (item) { PICKED.push({ file: item, title: partName(item) }); });
      PICKED.sort(function (a, b) { return a.file.name.localeCompare(b.file.name, undefined, { numeric: true }); });
      input.value = '';
    } else if (file && input.matches('[data-series-cover]')) {
      var part = PICKED[+input.dataset.seriesCover];
      if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type) || !file.size || file.size > 50 * 1048576) {
        IS.toast(A('اختر صورة غلاف مدعومة بحجم 50 ميغابايت أو أقل.', 'Choose a JPEG, PNG, WebP or GIF cover up to 50 MB.'), true);
      } else { setCover(part, file); part.uploaded = null; }
    } else if (file && input.matches('[data-series-reading]')) {
      PICKED[+input.dataset.seriesReading].reading = file;
      PICKED[+input.dataset.seriesReading].uploaded = null;
    } else return;
    drawOrder(form);
  });
  document.addEventListener('input', function (event) {
    var input = event.target;
    if (input.matches('.sorder .spn')) PICKED[+input.dataset.i].title = input.value;
  });
  IS.ACT.smove = function (button) {
    if (button.form.seriesId) return;
    var i = +button.dataset.i, j = i + +button.dataset.d, part = PICKED[i];
    PICKED[i] = PICKED[j]; PICKED[j] = part;
    drawOrder(button.form);
  };
  IS.ACT.sdrop = function (button) {
    if (button.form.seriesId) return;
    setCover(PICKED.splice(+button.dataset.i, 1)[0], null);
    drawOrder(button.form);
  };
  IS.ACT.scoverclear = function (button) {
    var part = PICKED[+button.dataset.i];
    setCover(part, null);
    part.uploaded = null;
    drawOrder(button.form);
  };
  IS.SUB.shareseries = async function (data, form) {
    if (form.inert) return;
    var parts = PICKED.slice();
    if (parts.length < 2) return IS.toast(A('اختر ملفين أو أكثر للمجموعة.', 'Choose two or more files for the group.'));
    for (var candidate of parts) {
      try { IS.validateLibraryFiles(candidate.file, candidate.reading, candidate.cover); }
      catch (error) { return IS.toast(candidate.file.name + ' · ' + error.message, true); }
    }
    if (!form.seriesId) {
      var sale;
      try { sale = IS.readSell(data); } catch (error) { return IS.toast(error.message, true); }
      var metadata = IS.librarySubjectMetadata(data.subjects);
      var status = IS.can('library', 'approve') ? 'published' : 'pending';
      form.seriesId = uuid();
      form.seriesMetadata = Object.assign({ kind: data.kind, author: data.author || '', about: data.about || '', owner_id: IS.ME.id,
        owner_name: IS.ME.name, status: status, series_id: form.seriesId, series_title: data.series_title }, metadata, sale);
      form.querySelectorAll('input, select, textarea').forEach(function (field) {
        if (!field.closest('#sorder')) field.disabled = true;
      });
    }
    var prog = form.querySelector('#sprog'), btn = form.querySelector('button.pri');
    form.inert = btn.disabled = true;
    prog.hidden = false;
    try {
      for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (part.saved) continue;
        prog.textContent = A('جارٍ رفع الجزء ', 'Uploading part ') + (i + 1) + ' / ' + parts.length + '…';
        part.id = part.id || uuid();
        var row = part.uploaded;
        if (!row) {
          row = Object.assign({ id: part.id, title: (part.title.trim() || partName(part.file)).slice(0, 160), series_no: i + 1 }, form.seriesMetadata);
          await IS.attachLibraryFiles(row, part.file, part.reading, part.cover);
          if (!DB.live && row.status === 'published') row.published_at = new Date().toISOString();
          part.uploaded = row;
        }
        try { await DB.ins('files', row); } catch (error) {
          if (!await DB.one('files', row.id).catch(function () { return null; })) throw error;
        }
        part.saved = true;
      }
      if (!form.isConnected) return;
      IS.resetSeries();
      IS.closeSheet();
      IS.toast(form.seriesMetadata.status === 'published' ? A('نُشرت المجموعة', 'The group is published') :
        A('شكرًا! ستُنشر المجموعة بعد المراجعة.', 'Thank you! The group will be published after review.'));
      IS.go('series/' + form.seriesId);
    } catch (error) {
      if (form.isConnected) {
        drawOrder(form);
        IS.toast(A('توقف الرفع: ', 'Upload stopped: ') + (error.message || ''), true);
      }
    } finally { form.inert = btn.disabled = false; prog.hidden = true; }
  };
  IS.resetSeries = function () {
    PICKED.forEach(function (part) { if (part.coverUrl) URL.revokeObjectURL(part.coverUrl); });
    PICKED = [];
  };
})();
