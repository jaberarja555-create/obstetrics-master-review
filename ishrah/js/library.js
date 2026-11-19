/* اشرح لي: My Library (owner's design, 17 Nov 2026): books, sheets, summaries, slides, question banks, references and other files,
   viewed inside the app only (PDF pages drawn on the screen, no download link); student requests (book, PDF, printed copy, explanation, other)
   with their status; students can share a useful file, which the content team reviews before it is published. */
(function () {
  'use strict';
  var A = IS.A, esc = IS.esc, ic = IS.ic, N = IS.N, $ = IS.$;
  var KINDS = IS.FKINDS = [['book', 'open', 'الكتب', 'Books'], ['sheet', 'layers', 'الشيتات', 'Sheets'], ['summary', 'file', 'الملخصات', 'Summaries'], ['slides', 'studio', 'العروض التقديمية', 'Slides (PPT)'],
    ['qbank', 'qb', 'بنوك الأسئلة', 'QBanks'], ['reference', 'link', 'المراجع', 'References'], ['other', 'folder', 'أخرى', 'Others'],
    ['exam', 'receipt', 'Exams', 'Exams'], ['mcq', 'checkc', 'MCQs', 'MCQs']];
  var TABS = ['exam', 'sheet', 'summary', 'mcq', 'qbank', 'reference', 'other'];
  var RKINDS = IS.RKINDS = [['book', 'layers', 'طلب كتاب', 'Request Book'], ['pdf', 'file', 'طلب ملف PDF', 'Request PDF'], ['printed', 'receipt', 'طلب نسخة مطبوعة', 'Printed Book'], ['explain', 'video', 'طلب شرح/محاضرة', 'Request Explanation'], ['research', 'pen', 'طلب كتابة بحث', 'Research Writing'], ['other', 'grid', 'طلبات أخرى', 'Other Requests']];
  /* research writing (owner, 18 Nov 2026: «كتابة بحث»): the kind of research, its stage and the deadline go with the request */
  var RTYPES = [['مشروع تخرج (بكالوريوس)', 'Graduation project'], ['رسالة ماجستير', 'Master’s thesis'], ['أطروحة دكتوراه', 'Doctoral thesis'], ['مقالة علمية أصلية', 'Original research article'], ['مراجعة منهجية / تحليل تجميعي', 'Systematic review / meta-analysis'], ['تقرير حالة (Case report)', 'Case report'], ['بحث تدريب أو تخصص (Board / Fellowship)', 'Residency or board research']];
  /* the parts of the work the student needs (owner, 18 Nov 2026: "options for which analysis, proposal, all and the others") */
  /* what the student orders, the way a research is written (owner, 18 Nov 2026: "be smart … the research has chapters: literature review,
     methodology and others"; approvals are not something to order). Chapters, then separate services. */
  var RCHAP = [['all', 'البحث كاملًا: كل الفصول', 'Full research · all chapters'], ['title', '', 'Topic and Title Selection'],
    ['intro', '', 'Chapter 1: Introduction and Objectives'], ['litrev', '', 'Chapter 2: Literature Review'],
    ['method', '', 'Chapter 3: Methodology'], ['results', '', 'Chapter 4: Results and Analysis'],
    ['discuss', '', 'Chapter 5: Discussion'], ['conclude', '', 'Conclusion and Recommendations'],
    ['abstract', '', 'Abstract'], ['refs', '', 'References and Citations']];
  var RSERV = [['proposal', 'المقترح البحثي', 'Research proposal'], ['tool', 'تصميم الاستبيان', 'Questionnaire / data tool'], ['sample', 'حساب حجم العينة', 'Sample size'],
    ['analysis', 'التحليل الإحصائي فقط', 'Statistical analysis only'], ['entry', 'إدخال البيانات', 'Data entry'], ['edit', 'التدقيق اللغوي', 'Editing & proofreading'],
    ['plag', 'فحص الاقتباس وتقليله', 'Plagiarism check'], ['format', 'التنسيق حسب دليل الجامعة', 'University formatting'], ['slides', 'عرض المناقشة أو الملصق', 'Defence slides or poster'],
    ['publish', 'التجهيز للنشر في مجلة', 'Journal preparation'], ['other', 'أخرى', 'Other']];
  var RANAL = [['desc', 'إحصاء وصفي', 'Descriptive statistics'], ['chi', 'مربع كاي / فيشر', 'Chi-square / Fisher'], ['ttest', 'اختبار t', 't-test'], ['anova', 'تحليل التباين', 'ANOVA'],
    ['nonpar', 'اختبارات لا معلمية', 'Non-parametric tests'], ['corr', 'الارتباط', 'Correlation'], ['linreg', 'الانحدار الخطي', 'Linear regression'], ['logreg', 'الانحدار اللوجستي', 'Logistic regression'],
    ['surv', 'تحليل البقاء', 'Survival analysis'], ['diag', 'دقة الاختبار التشخيصي / ROC', 'Diagnostic accuracy / ROC'], ['meta', 'التحليل التجميعي', 'Meta-analysis'], ['unsure', 'لست متأكدًا: انصحوني', 'Not sure · advise me']];
  var RSOFT = [['SPSS', 'SPSS'], ['R', 'R'], ['Stata', 'Stata'], ['Excel', 'Excel'], ['GraphPad', 'GraphPad Prism'], ['any', 'لا يهم', 'Any program']];
  function chks(name, list) { return '<div class="rchk">' + list.map(function (x) {
    var academicTitle = name === 'rchap' && x[0] !== 'all';
    return '<label class="opt"><input type="checkbox" name="' + name + '" value="' + esc(x[0]) + '"><span' +
      (academicTitle ? ' lang="en" dir="ltr"' : '') + '>' + esc(academicTitle ? x[2] : A(x[1], x[2])) + '</span></label>';
  }).join('') + '</div>'; }
  function en(ar, e) { return '<b>' + esc(A(ar, e)) + '</b>'; }
  function opt2(ar, e) { return esc(A(ar, e)); }
  function lbls(list, v) { v = [].concat(v || []); return list.filter(function (x) { return v.indexOf(x[0]) >= 0; }).map(function (x) { return x[2] || x[1]; }).join('، '); }
  var RSTAGES = [['لم أبدأ بعد', 'Not started'], ['اخترت الموضوع', 'Topic chosen'], ['جمعت البيانات', 'Data collected'], ['أكتب الفصول', 'Writing the chapters'], ['أحتاج مراجعة نهائية', 'Needs a final review']];
  function kind(k) { return KINDS.filter(function (x) { return x[0] === k; })[0] || KINDS.find(function (x) { return x[0] === 'other'; }); }
  function rkind(k) { return RKINDS.filter(function (x) { return x[0] === k; })[0] || RKINDS[RKINDS.length - 1]; }
  IS.rstatus = function (s) { var m = { pending: ['جديد', 'New', 'warn'], progress: ['قيد التنفيذ', 'In progress', 'warn'], done: ['مكتمل', 'Done', 'ok'], rejected: ['مرفوض', 'Rejected', 'bad'] }[s] || [s, s, ''];
    return IS.chip(ic(s === 'done' ? 'checkc' : s === 'rejected' ? 'x' : 'clock') + esc(A(m[0], m[1])), 'st ' + m[2]); };
  var T = { k: 'all', q: '', sub: '', sp: '' };
  /* specialities in the library (owner, 18 Nov 2026: "update the library so it includes the other specialities") */
  function fspec(f) { return IS.studyScope(f).spec; }
  function spName(id) { var x = IS.SPECS.filter(function (s) { return s.id === id; })[0]; return x ? x.en : ''; }
  function specBar() { return '<section class="specbar">' + [{ id: '', en: 'All specialities', ar: 'كل التخصصات', icon: 'grid' }].concat(IS.SPECS).map(function (x) {
    return '<a class="spb2' + (x.id === T.sp ? ' on' : '') + '" href="#library/@' + (x.id || 'all') + '">' + ic(x.icon) + '<span><b lang="en">' + esc(x.id ? x.en : A(x.ar, x.en)) + '</b>' + '</span></a>'; }).join('') + '</section>'; }
  function subjOptions(cur, scoped) { var sp = cur ? (IS.subj(cur) || {}).spec : T.sp; return IS.SPECS.map(function (g) { var ss = IS.SUBJ.filter(function (x) { return x.spec === g.id && (!scoped || IS.inStudySpace(x)); }); if (!ss.length) return '';
    return '<optgroup label="' + esc(g.en) + '">' + ss.map(function (x, i) { return '<option value="' + x.id + '"' + (cur ? (cur === x.id ? ' selected' : '') : (g.id === sp && i === 0 ? ' selected' : '')) + '>' + esc(x.en) + '</option>'; }).join('') + '</optgroup>'; }).join(''); }

  IS.libraryKind = kind;
  function inKind(file, tab) { return tab === 'all' || file.kind === tab || (tab === 'reference' && file.kind === 'book'); }
  function publishedTime(file) { return file.published_at || file.created_at || ''; }
  function starsCount(file) { return Number(file.rating_count == null ? file.n_reviews : file.rating_count) || 0; }
  function starsAverage(file) { return Number(file.average_rating == null ? file.rating : file.average_rating) || 0; }
  IS.ratingSort = function (first, second, order) {
    var a = IS.grade(first._parts ? IS.seriesScore(first.series_id) : first);
    var b = IS.grade(second._parts ? IS.seriesScore(second.series_id) : second);
    var byCount = b.n - a.n, byAverage = b.score - a.score;
    return order === 'best' ? byAverage || byCount : byCount || byAverage;
  };
  function ratingContents(file) { return IS.gradeInner(file); }
  function ratingLabel(file) {
    var series = file.feedback_kind === 'series', grade = IS.grade(file);
    var label = series ? A('قيّم السلسلة', 'Rate this series') : A('قيّم الملف', 'Rate this file');
    return grade.n ? label + ' · ' + grade.score.toFixed(1) + ' / 5 (' + N(grade.n) + ')' : label;
  }
  function ratingData(file) {
    return { rating_count: starsCount(file), rating_points: Number(file.rating_points) || Math.round(starsAverage(file) * starsCount(file)),
      average_rating: starsAverage(file) };
  }
  IS.libraryRating = function (file, interactive, feedbackKind) {
    file = Object.assign({ feedback_kind: feedbackKind || 'file' }, file);
    var rating = ratingData(file);
    var attributes = ' class="library-rating" data-library-file="' + esc(file.id) + '" data-library-kind="' + file.feedback_kind + '" aria-label="' + esc(ratingLabel(file)) + '"';
    return interactive ? '<button type="button"' + attributes + ' data-act="rate-library-file" aria-expanded="false" data-owner="' + esc(file.owner_id || '') +
      '" data-likes="' + (Number(file.like_count) || 0) + '" data-dislikes="' + (Number(file.dislike_count) || 0) + '" data-own-stars="' + (file.my_stars == null ? '' : Number(file.my_stars)) + '" data-count="' + rating.rating_count + '" data-points="' + rating.rating_points + '">' +
      ratingContents(file) + '</button>' : '<span' + attributes + ' role="img">' + ratingContents(file) + '</span>';
  };
  function updateRating(id, file, feedbackKind) {
    feedbackKind = feedbackKind || 'file';
    if (feedbackKind === 'series') IS.keepSeriesScore(id, file);
    IS.$$('[data-library-file]').filter(function (el) { return el.dataset.libraryFile === id && el.dataset.libraryKind === feedbackKind; }).forEach(function (el) {
      file = Object.assign({ like_count: Number(el.dataset.likes) || 0, dislike_count: Number(el.dataset.dislikes) || 0,
        feedback_kind: feedbackKind }, file);
      el.innerHTML = ratingContents(file);
      el.setAttribute('aria-label', ratingLabel(file));
      el.dataset.count = starsCount(file);
      el.dataset.points = Number(file.rating_points) || 0;
      el.dataset.likes = Number(file.like_count) || 0;
      el.dataset.dislikes = Number(file.dislike_count) || 0;
      if (file.my_stars != null) el.dataset.ownStars = file.my_stars;
    });
    if (IS.regradeBars) IS.regradeBars(feedbackKind + '/' + id, file);
    var home = IS.$('.section-feed'), library = IS.$('#lres');
    if (home) home.dispatchEvent(new CustomEvent('feed-feedback', { detail: { key: feedbackKind + '/' + id, values: file } }));
    if (library && feedbackKind === 'file') library.dispatchEvent(new CustomEvent('library-feedback', { detail: { id: id, values: file } }));
  }
  IS.updateLibraryRating = updateRating;
  function syncStars(panel, value) {
    IS.$$('[data-act=save-library-stars]', panel).forEach(function (button) {
      var stars = Number(button.dataset.stars);
      button.classList.toggle('on', stars <= value);
      button.setAttribute('aria-pressed', stars === value);
    });
  }
  function closeRating(button) {
    button.ratingPanel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  }
  IS.ACT['rate-library-file'] = function (button) {
    var panel = button.ratingPanel, d = button.dataset, series = d.libraryKind === 'series';
    if (panel && !panel.hidden) return closeRating(button);
    if (!panel) {
      var myId = IS.ME && IS.ME.id, own = myId && myId === d.owner;
      panel = button.ratingPanel = document.createElement('section');
      panel.className = 'library-rate-panel';
      panel.id = 'rate-file-' + d.libraryFile;
      panel.setAttribute('aria-label', series ? A('تقييم السلسلة', 'Series rating') : A('تقييم الملف', 'File rating'));
      button.setAttribute('aria-controls', panel.id);
      panel.innerHTML = '<strong>' + esc(own ? A('تقييمات القرّاء', 'Reader ratings') : A('تقييمك', 'Your rating')) + '</strong>' +
        (myId && !own ? '<div class="library-rate-stars" role="group" aria-label="' + esc(A('اختر عدد النجوم', 'Choose your stars')) + '">' +
          [1, 2, 3, 4, 5].map(function (star) {
            return '<button type="button" data-act="save-library-stars" data-stars="' + star + '" aria-pressed="false" aria-label="' +
              esc(A(star + ' من 5', star + ' out of 5')) + '">' + ic('star') + '</button>';
          }).join('') + '</div>' : own ? IS.libraryRating({ id: d.libraryFile, rating_count: Number(d.count),
          average_rating: Number(d.count) ? Number(d.points) / Number(d.count) : 0 }, false) :
          '<button type="button" class="btn ghost sm" data-act="login">' + esc(A('سجّل الدخول للتقييم', 'Sign in to rate')) + '</button>') +
        '<span class="mut" data-rating-result role="status"></span>';
      button.closest('.feed-action-row, .ff').after(panel);
      panel.ratingButton = button;
      panel.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') return;
        closeRating(button);
        button.focus();
      });
      if (myId && !own) {
        if (d.ownStars !== '') {
          panel.myStars = Number(d.ownStars);
          syncStars(panel, panel.myStars);
        } else {
          var starsQuery = { eq: { file_id: d.libraryFile, user_id: myId }, select: 'stars', limit: 1 };
          panel.ownRating = (series ? IS.fetchSeriesScores([d.libraryFile]) : DB.q('feed_feedback', starsQuery)).then(function (rows) {
            var stars = Number(rows[0] && (series ? rows[0].my_stars : rows[0].stars)) || 0;
            if (panel.isConnected && !panel.touched) {
              panel.myStars = stars;
              button.dataset.ownStars = stars;
              syncStars(panel, stars);
            }
            return stars;
          }).catch(function () {});
        }
      }
    }
    panel.hidden = false;
    button.setAttribute('aria-expanded', 'true');
  };
  IS.ACT['save-library-stars'] = async function (button) {
    var panel = button.closest('.library-rate-panel'), opener = panel.ratingButton;
    var account = IS.ME && IS.ME.id;
    if (panel.saving || !account) return;
    var value = Number(button.dataset.stars), previous = panel.myStars;
    var id = opener.dataset.libraryFile, feedbackKind = opener.dataset.libraryKind, count = Number(opener.dataset.count), points = Number(opener.dataset.points);
    var status = panel.querySelector('[data-rating-result]');
    var controls = IS.$$('[data-act=save-library-stars]', panel);
    panel.saving = panel.touched = true;
    controls.forEach(function (control) { control.disabled = true; });
    syncStars(panel, value);
    status.textContent = A('جارٍ حفظ التقييم…', 'Saving rating…');
    if (previous != null) {
      var total = count + Number(previous === 0), nextPoints = points + value - previous;
      updateRating(id, { rating_count: total, rating_points: nextPoints, average_rating: nextPoints / total }, feedbackKind);
    }
    try {
      var saved = await IS.feedVote(feedbackKind, id, value, 'rate');
      if (!saved) throw new Error('rating_unavailable');
      if ((IS.ME || {}).id !== account) return;
      panel.myStars = value;
      updateRating(id, saved, feedbackKind);
      IS.$$('[data-act=rate-library-file]').filter(function (el) { return el.dataset.libraryFile === id && el.dataset.libraryKind === feedbackKind; }).forEach(function (el) {
        el.dataset.ownStars = value;
      });
      status.textContent = A('حُفظ تقييمك', 'Rating saved');
    } catch (error) {
      if ((IS.ME || {}).id !== account) return;
      if (previous != null) updateRating(id, { rating_count: count, rating_points: points, average_rating: count ? points / count : 0 }, feedbackKind);
      panel.myStars = previous == null ? await panel.ownRating : previous;
      syncStars(panel, panel.myStars || 0);
      status.textContent = A('تعذّر الحفظ. اختر التقييم مرة أخرى.', 'Could not save. Choose a star to retry.');
    } finally {
      panel.saving = false;
      controls.forEach(function (control) { control.disabled = false; });
    }
  };
  IS.sectionLibraryFiles = async function (spec, cat) {
    if (IS.loadBuys) await IS.loadBuys();
    var scope = { status: 'published', spec: spec, cat: cat };
    var groups = await Promise.all([
      DB.q('files', { eq: scope, order: ['published_at', false], limit: 40 }),
      DB.q('files', { eq: scope, neq: { rating_count: 0 }, order: ['average_rating', false], limit: 40 }),
      DB.q('files', { eq: scope, neq: { rating_count: 0 }, order: ['rating_count', false], limit: 40 })
    ]);
    var files = Array.from(new Map(groups.flat().filter(IS.inStudySpace).map(function (file) { return [file.id, file]; })).values());
    return IS.seriesCollapse ? IS.seriesCollapse(files) : files;
  };
  IS.libraryCover = function (file) {
    var genre = kind(file.kind);
    var shortTitle = String(file.title || '').slice(0, 54);
    var cover = file.cover || '', publicCover = /^(https:\/\/|img\/|data:image\/)/.test(cover);
    var src = publicCover ? IS.U(cover) : esc(cover && DB.cachedLibraryCover ? DB.cachedLibraryCover(cover) : '');
    return '<span class="library-cover k-' + esc(genre[0]) + '"><span class="library-cover-placeholder" aria-hidden="true">' + ic(genre[1]) +
      '<b dir="auto">' + esc(shortTitle) + '</b></span>' + (cover ? '<img loading="lazy" alt=""' +
        (src ? ' src="' + src + '"' : '') + (!publicCover ? ' data-library-cover="' + esc(cover) + '"' : '') + '>' : '') + '</span>';
  };
  IS.hydrateLibraryCovers = async function (root) {
    var photos = IS.$$('img[data-library-cover]', root).filter(function (photo) {
      var src = photo.getAttribute('src');
      return !src || (DB.live && src !== DB.cachedLibraryCover(photo.dataset.libraryCover));
    });
    if (!photos.length) return;
    var paths = Array.from(new Set(photos.map(function (photo) { return photo.dataset.libraryCover; })));
    var urls = new Map();
    if (DB.live) {
      urls = await DB.libraryCoverUrls(paths);
    } else {
      await Promise.all(paths.map(async function (path) { urls.set(path, await DB.fileUrl('library', path)); }));
    }
    photos.forEach(function (photo) { var url = urls.get(photo.dataset.libraryCover); if (url && photo.isConnected) photo.src = url; });
  };

  IS.page('library', async function (tab) {
    if (tab && tab.charAt(0) === '@') { T.sp = tab === '@all' ? '' : tab.slice(1); tab = T.k; } if (IS.SPEC) T.sp = IS.SPEC;
    var scope = IS.SPEC + '/' + ((IS.mySection() || {}).id || '');
    if (T.scope !== scope) { T.scope = scope; T.k = 'all'; T.sort = 'new'; IS.LCOLL = null; }
    T.k = tab || T.k || 'all';
    if (IS.loadBuys) await IS.loadBuys();
    var fs = (await DB.q('files', { eq: { status: 'published' }, order: ['published_at', false] })).filter(function (f) { return (!T.sp || fspec(f) === T.sp) && IS.inStudySpace(f); }), me = IS.ME;
    var reqs = me ? await DB.q('requests', { eq: { user_id: me.id }, order: ['created_at', false] }) : [];
    var h = IS.banner(IS.T('مكتبتي', 'My Library'), esc(A('كل كتبك وملفاتك الدراسية في مكان واحد', 'All your books and study files in one place')), 'open', '', 'libban') + (IS.SPEC ? '' : specBar());
    h += '<section class="ltabs"><a href="#library/requests" class="lt req' + (T.k === 'requests' ? ' on' : '') + '">' + ic('receipt') + '<b>' + esc(A('الطلبات', 'Requests')) + '</b>' + (reqs.filter(function (r) { return r.status === 'pending' || r.status === 'progress'; }).length ? '<i>' + N(reqs.filter(function (r) { return r.status === 'pending' || r.status === 'progress'; }).length) + '</i>' : '') + '</a>' +
      '<a href="#library/all" class="lt' + (T.k === 'all' ? ' on' : '') + '">' + ic('grid') + '<b>' + esc(A('الكل', 'All Files')) + '</b><small>' + N(fs.length) + '</small></a>' +
      TABS.map(function (id) { var k = kind(id); return '<a href="#library/' + k[0] + '" class="lt' + (T.k === k[0] ? ' on' : '') + '">' + ic(k[1]) + '<b>' + esc(A(k[2], k[3])) + '</b><small>' + N(fs.filter(function (f) { return inKind(f, k[0]); }).length) + '</small></a>'; }).join('') + '</section>';
    if (T.k === 'requests') return h + requestsView(reqs, fs);
    var list = fs.filter(function (f) { return inKind(f, T.k); });
    function renderFiles(rows, coll) {
      if (IS.seriesCollapse) rows = IS.seriesCollapse(rows);
      rows.sort(function (a, b) { return (T.sort === 'new' ? 0 : IS.ratingSort(a, b, T.sort)) || publishedTime(b).localeCompare(publishedTime(a)); });
      return (coll ? '<p class="count">' + ic('folder') + esc(coll.n) + ' <button class="link" data-act="lcoll" data-i="-1">' + esc(A('عرض الكل', 'Show all')) + '</button></p>' : '') +
        (rows.length ? '<div class="grid g4 files">' + rows.map(function (f) { return f._parts ? IS.seriesCard(f) : fileCard(f); }).join('') + '</div>' :
          IS.empty(kind(T.k)[1], A('لا توجد ملفات هنا بعد', 'No files here yet'), A('لم تجد ما تبحث عنه؟ اطلبه من المكتبة.', 'Can’t find it? Request it from the library.'), '<a class="btn pri" href="#library/requests">' + ic('plus') + esc(A('اطلبه الآن', 'Request it')) + '</a>'));
    }
    var subjects = IS.SUBJ.filter(IS.inStudySpace);
    h += '<div class="tool library-tools"><label class="field">' + ic('search') + '<input id="lq" type="search" placeholder="' + esc(A('ابحث في مكتبتي…', 'Search the library…')) + '"></label>' +
      (subjects.length ? '<details class="fg"><summary>' + ic('filter') + esc(A('المادة', 'Subject')) + ic('down') + '</summary><div>' + subjects.map(function (s) { return '<label class="opt"><input type="checkbox" data-lf="sub" value="' + s.id + '"><span>' + esc(s.en) + '</span><em>' + N(fs.filter(function (f) { return f.subject === s.id; }).length) + '</em></label>'; }).join('') + '</div></details>' : '') +
      '<select class="sel" id="library-sort" aria-label="' + esc(A('ترتيب الملفات', 'Sort library files')) + '">' +
      [['new', 'الأحدث', 'Newest'], ['best', 'الأعلى تقييمًا', 'Best rated'], ['most-rated', 'الأكثر تقييمًا', 'Most rated']].map(function (item) {
        return '<option value="' + item[0] + '"' + (T.sort === item[0] ? ' selected' : '') + '>' + esc(A(item[1], item[2])) + '</option>';
      }).join('') + '</select>' +
      '<button class="btn pri" data-act="share-file">' + ic('upload') + esc(A('شارك ملفًا', 'Share a file')) + '</button>' +
      (me ? '<a class="btn ghost" href="#sales">' + ic('cart') + esc(A('مبيعاتي', 'My sales')) + '</a>' : '') + '</div><div id="lres">' + renderFiles(list.slice()) + '</div>' +
      (me ? '<div class="library-extra">' + collBox() + '</div>' : '');
    IS.after = function () {
      var sel = {}, fill = function () {
        var w = IS.norm(($('#lq') || {}).value || '').split(' ').filter(Boolean), subs = Object.keys(sel).filter(function (k) { return sel[k]; }), coll = IS.LCOLL;
        var r = list.filter(function (f) { if (subs.length && subs.indexOf(f.subject) < 0) return false; if (coll && (coll.items || []).indexOf(f.id) < 0) return false;
          if (w.length) { var hay = IS.norm([f.title, f.about, f.author, f.series_title].concat(f.tags || [], kind(f.kind).slice(2), +f.price > 0 ? ['paid', 'مدفوع'] : ['free', 'مجاني']).join(' ')); if (!w.every(function (x) { return hay.indexOf(x) >= 0; })) return false; } return true; });
        $('#lres').innerHTML = renderFiles(r, coll);
        IS.hydrateLibraryCovers($('#lres')).catch(function () {});
        if (IS.hydrateFeedReactions) IS.hydrateFeedReactions($('#lres'));
      };
      $('#lres').addEventListener('library-feedback', function (event) {
        var file = fs.find(function (row) { return row.id === event.detail.id; });
        if (file) Object.assign(file, event.detail.values);
      });
      if (IS.LTAG) { $('#lq').value = IS.LTAG; IS.LTAG = ''; }
      IS.libFill = fill; fill(); $('#lq').oninput = fill;
      $('#library-sort').onchange = function () { T.sort = this.value; fill(); };
      IS.$$('[data-lf]').forEach(function (i) { i.onchange = function () { sel[i.value] = i.checked; fill(); }; });
    };
    return h;
  });
  function fileCard(f) {
    var k = kind(f.kind);
    var open = !IS.fileOpenable || IS.fileOpenable(f);
    return '<article class="fcard"><a class="fimg" href="#file/' + esc(f.id) + '" aria-label="' + esc(f.title) + '">' + IS.libraryCover(f) + (IS.priceTag ? IS.priceTag(f, 'oncov') : '') + '</a>' +
      '<div class="fb"><span class="ftype">' + ic(k[1]) + esc(A(k[2], k[3])) + ' · ' + esc(spName(fspec(f))) + '</span><b><a href="#file/' + esc(f.id) + '">' + esc(f.title) +
      '</a></b>' + (f.author ? '<small dir="auto">' + esc(f.author) + '</small>' : '') + (IS.tagChips ? IS.tagChips(f, 3) : '') + '</div>' +
      '<div class="ff">' + IS.libraryRating(f, true) + IS.favBtn('f:' + f.id, true) +
      (IS.ME ? '<button class="fav sm" data-act="addcoll" data-id="' + esc(f.id) + '" aria-label="' + esc(A('أضف إلى مجموعة', 'Add to collection')) + '">' + ic('folder') + '</button>' : '') +
      '</div>' + (!open ? '<div class="library-download">' + IS.buyBtn(f, true, false) + '</div>' : IS.ME ? '<div class="library-download">' + IS.dlBtn('file', f.id) + '</div>' : '') + '</article>';
  }
  /* collections (folders) of the student, kept on the account's device list */
  function colls() { return IS.LS.get('coll-' + (IS.ME ? IS.ME.id : 'x'), []); }
  function setColls(c) { IS.LS.set('coll-' + IS.ME.id, c); }
  function collBox() {
    var c = colls();
    return '<section class="box"><h2>' + ic('folder') + IS.T('مجموعاتي', 'My collections') + '</h2>' + (c.length ? '<ul class="colls">' + c.map(function (x, i) { return '<li><button data-act="lcoll" data-i="' + i + '">' + ic('folder') + '<span>' + esc(x.n) + '</span><em>(' + N((x.items || []).length) + ')</em></button><button class="ib sm" data-act="delcoll" data-i="' + i + '" aria-label="delete">' + ic('x') + '</button></li>'; }).join('') + '</ul>' :
      '<p class="mut">' + esc(A('اجمع ملفات امتحان معيّن في مجموعة: «مراجعة النهائي»، «USMLE Step 2 CK»…', 'Group the files of an exam: “Final review”, “USMLE Step 2 CK”…')) + '</p>') + '<button class="link" data-act="newcoll">' + ic('plus') + esc(A('إنشاء مجموعة جديدة', 'New collection')) + '</button></section>';
  }
  IS.ACT.newcoll = async function () { var n = await IS.ask(A('مجموعة جديدة', 'New collection'), A('اسم المجموعة', 'Name')); if (!n) return; var c = colls(); c.push({ n: n.slice(0, 40), items: [] }); setColls(c); IS.refresh(); };
  IS.ACT.delcoll = async function (b) { var c = colls(), i = +b.getAttribute('data-i'); if (!(await IS.confirm(A('حذف المجموعة «' + c[i].n + '»؟', 'Delete “' + c[i].n + '”?')))) return; c.splice(i, 1); setColls(c); IS.LCOLL = null; IS.refresh(); };
  IS.ACT.lcoll = function (b) { var i = +b.getAttribute('data-i'); IS.LCOLL = i < 0 ? null : colls()[i]; if (IS.libFill) IS.libFill(); };
  IS.ACT.addcoll = function (b) {
    var id = b.getAttribute('data-id'), c = colls();
    IS.sheet(esc(A('أضف إلى مجموعة', 'Add to a collection')), '<div class="list">' + c.map(function (x, i) { var on = (x.items || []).indexOf(id) >= 0; return '<button class="li" data-act="togcoll" data-i="' + i + '" data-id="' + id + '">' + ic(on ? 'checkc' : 'folder') + '<span><b>' + esc(x.n) + '</b></span></button>'; }).join('') + '</div><button class="btn ghost wide" data-act="newcoll2" data-id="' + id + '">' + ic('plus') + esc(A('مجموعة جديدة', 'New collection')) + '</button>', { nofocus: 1 });
  };
  IS.ACT.togcoll = function (b) { var c = colls(), x = c[+b.getAttribute('data-i')], id = b.getAttribute('data-id'), it = x.items || (x.items = []), k = it.indexOf(id); if (k >= 0) it.splice(k, 1); else it.push(id); setColls(c); IS.closeSheet(); IS.toast(k >= 0 ? A('أزيل', 'Removed') : A('أضيف إلى «' + x.n + '»', 'Added to “' + x.n + '”')); IS.refresh(); };
  IS.ACT.newcoll2 = async function (b) { var n = await IS.ask(A('مجموعة جديدة', 'New collection'), A('اسم المجموعة', 'Name')); if (!n) return; var c = colls(); c.push({ n: n.slice(0, 40), items: [b.getAttribute('data-id')] }); setColls(c); IS.toast(A('أضيف', 'Added')); IS.refresh(); };

  /* ---------- requests ---------- */
  function requestsView(reqs, fs) {
    var me = IS.ME, c = { all: reqs.length, prog: reqs.filter(function (r) { return r.status === 'pending' || r.status === 'progress'; }).length, done: reqs.filter(function (r) { return r.status === 'done'; }).length, rej: reqs.filter(function (r) { return r.status === 'rejected'; }).length };
    var h = '<header class="sh big"><h2>' + ic('receipt') + IS.T('طلبات المكتبة', 'Library requests') + '</h2><p class="mut">' + esc(A('اطلب ما تحتاجه من كتب أو ملفات أو شروحات وسنعمل على توفيره لك', 'Request the books, files or explanations you need and we will work on providing them')) + '</p></header>';
    h += '<section class="rkinds">' + RKINDS.map(function (k) { return '<button class="rk k-' + k[0] + '" data-act="rkind" data-k="' + k[0] + '">' + ic(k[1]) + '<b>' + esc(A(k[2], k[3])) + '</b>' + '</button>'; }).join('') + '</section>';
    /* figures as one row of tiles, then the form and the list side by side at the same height (owner, 18 Nov 2026: "remove all the empty spaces") */
    h += '<section class="rstats">' + [['receipt', c.all, A('إجمالي الطلبات', 'Total requests')], ['clock', c.prog, A('قيد التنفيذ', 'In progress')], ['checkc', c.done, A('مكتملة', 'Done')], ['x', c.rej, A('مرفوضة', 'Rejected')]].map(function (x) {
      return '<span>' + ic(x[0]) + '<b>' + N(x[1]) + '</b><small>' + esc(x[2]) + '</small></span>'; }).join('') + '</section>';
    h += '<div class="rgrid"><section class="box newreq"><h2 class="bandh">' + ic('plus') + IS.T('إنشاء طلب جديد', 'New request') + '</h2>' + (me ? '<form class="form" data-form="request"><label class="fl"><span>' + en('نوع الطلب', 'Request type') + ' *</span><select name="kind" id="rkSel">' + RKINDS.map(function (k) { return '<option value="' + k[0] + '">' + opt2(k[2], k[3]) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fl"><span>' + en('التخصص', 'Speciality') + '</span><select name="spec">' + IS.SPECS.map(function (x) { return '<option value="' + x.id + '"' + (x.id === (T.sp || 'medicine') ? ' selected' : '') + '>' + esc(x.en) + '</option>'; }).join('') + '</select></label>' +
      '<div class="rsx" id="rsx" hidden><label class="fl"><span>' + en('نوع البحث', 'Kind of research') + '</span><select name="rtype">' + RTYPES.map(function (x) { return '<option value="' + esc(x[1]) + '">' + opt2(x[0], x[1]) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fl"><span>' + en('المرحلة الحالية', 'Current stage') + '</span><select name="rstage">' + RSTAGES.map(function (x) { return '<option value="' + esc(x[1]) + '">' + opt2(x[0], x[1]) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fl"><span>' + en('موعد التسليم', 'Deadline') + '</span><input name="rdue" type="date"></label>' +
      '<fieldset class="rfs"><legend>' + en('فصول البحث المطلوبة', 'Chapters you need') + '</legend>' + chks('rchap', RCHAP) + '</fieldset>' +
      '<fieldset class="rfs"><legend>' + en('خدمات أخرى (اختياري)', 'Other services (optional)') + '</legend>' + chks('rserv', RSERV) + '<input name="rserv_o" class="pko" hidden placeholder="' + esc(A('اكتب ما تحتاجه', 'Type what you need')) + '"></fieldset>' +
      '<fieldset class="rfs" id="ranal" hidden><legend>' + en('أي تحليل إحصائي؟', 'Which statistical analysis?') + '</legend>' + chks('ranal', RANAL) +
      '<p class="rsub">' + en('البرنامج المفضّل', 'Preferred program') + '</p>' + chks('rsoft', RSOFT) + '</fieldset></div>' +
      '<label class="fl"><span id="rtl">' + esc(A('عنوان الكتاب أو الموضوع', 'Title of the book or topic')) + ' *</span><input name="title" required maxlength="160" placeholder="' + esc(A('مثال: Oxford Obstetrics (4th ed.)', 'e.g. Oxford Obstetrics (4th ed.)')) + '"></label>' +
      '<label class="fl"><span>' + en('تفاصيل إضافية (اختياري)', 'More details (optional)') + '</span><textarea name="details" rows="3" maxlength="1000" placeholder="' + esc(A('حدد الطبعة، اللغة، أو أي ملاحظات أخرى…', 'Edition, language or any other notes…')) + '"></textarea></label>' +
      '<button class="btn pri wide">' + ic('send') + esc(A('إرسال الطلب', 'Send request')) + '</button></form>' : '<div class="rgate">' + ic('lock') + '<b>' + esc(A('سجّل الدخول لإرسال طلب', 'Sign in to send a request')) + '</b><span>' + esc(A('اطلب كتابًا أو ملفًا أو شرحًا وتابع حالته هنا.', 'Ask for a book, file or explanation and follow it here.')) + '</span><button class="btn pri wide" data-act="login">' + esc(A('دخول', 'Sign in')) + '</button></div>') + '</section>';
    h += '<section class="box"><header class="sh"><h2>' + ic('clock') + IS.T('أحدث الطلبات', 'Latest requests') + '</h2></header>' + (reqs.length ? '<div class="rtable"><div class="rh"><span>' + esc(A('الطلب', 'Request')) + '</span><span>' + esc(A('النوع', 'Type')) + '</span><span>' + esc(A('الحالة', 'Status')) + '</span><span>' + esc(A('التاريخ', 'Date')) + '</span></div>' +
      reqs.map(function (r) { var k = rkind(r.kind); return '<button class="rr" data-act="viewreq" data-id="' + r.id + '"><b>' + esc(A(k[2], k[3])) + ': ' + esc(r.title) + '</b><span class="chip">' + ic(k[1]) + esc(A(k[2].replace('طلب ', ''), k[3].replace('Request ', ''))) + (r.spec ? ' · ' + esc(spName(r.spec)) : '') + '</span>' + IS.rstatus(r.status) + '<span class="mut">' + esc(IS.date(r.created_at)) + '</span>' + ic('chev', 'fl') + '</button>'; }).join('') + '</div>' :
      IS.empty('receipt', A('لم ترسل أي طلب بعد', 'You have not sent a request yet'), A('اختر نوع الطلب من الأزرار أعلاه أو املأ النموذج.', 'Pick a request type above or fill in the form.'))) + '</section>';
    h += '</div>';
    h += '<section class="box upl wide">' + ic('upload') + '<b>' + esc(A('هل لديك كتاب أو ملف مفيد؟', 'Have a useful book or file?')) + '</b><span>' + esc(A('شاركه مع زملائك في المكتبة', 'Share it with your classmates in the library')) + '</span><button class="btn pri sm" data-act="share-file">' + ic('upload') + esc(A('رفع ملف للمكتبة', 'Upload to the library')) + '</button></section>';
    return h;
  }
  IS.ACT.rkind = function (b) { var s = $('#rkSel'); if (s) { s.value = b.getAttribute('data-k'); rsxShow(); var t = s.form.title; if (b.getAttribute('data-t') && !t.value) t.placeholder = b.getAttribute('data-t'); t.focus(); s.form.scrollIntoView({ behavior: 'smooth', block: 'center' }); } else if (!IS.ME) IS.ACT.login(); };
  function rsxShow() { var s = $('#rkSel'), x = $('#rsx'), t = $('#rtl'); if (!s || !x) return; var r = s.value === 'research'; x.hidden = !r;
    if (t) t.textContent = (r ? A('عنوان البحث أو فكرته', 'Research title or idea') : A('عنوان الكتاب أو الموضوع', 'Title of the book or topic')) + ' *';
    var ti = s.form.title; if (ti) ti.placeholder = r ? A('مثال: معدل فقر الدم لدى الحوامل في مستشفى ود مدني', 'e.g. Anaemia in pregnant women at Wad Medani Hospital') : A('مثال: Oxford Obstetrics (4th ed.)', 'e.g. Oxford Obstetrics (4th ed.)'); }
  document.addEventListener('change', function (e) { var t = e.target; if (!t) return; if (t.id === 'rkSel') rsxShow();
    if (t.name === 'rchap' || t.name === 'rserv') { var f = t.form;
      if (t.name === 'rchap') { if (t.value === 'all') IS.$$('[name=rchap]', f).forEach(function (x) { x.checked = t.checked; }); else if (!t.checked) { var a = f.querySelector('[name=rchap][value=all]'); if (a) a.checked = false; } }
      var on = function (n, v) { var x = f.querySelector('[name=' + n + '][value=' + v + ']'); return x && x.checked; }, box = $('#ranal'); if (box) box.hidden = !(on('rchap', 'results') || on('rserv', 'analysis'));
      var oi = f.querySelector('[name=rserv_o]'); if (oi) { oi.hidden = !on('rserv', 'other'); if (!oi.hidden && t.value === 'other') oi.focus(); } } });
  IS.SUB.request = async function (d) {
    if (d.kind === 'research') { var sv = [].concat(d.rserv || []), ch = [].concat(d.rchap || []); if (!sv.length && !ch.length) { IS.toast(A('اختر الفصول أو الخدمات التي تحتاجها.', 'Choose the chapters or services you need.')); return; }
      var an = sv.indexOf('analysis') >= 0 || ch.indexOf('results') >= 0;
      d.details = [A('نوع البحث: ', 'Kind: ') + d.rtype, A('المرحلة: ', 'Stage: ') + d.rstage, d.rdue ? A('موعد التسليم: ', 'Deadline: ') + d.rdue : '',
        ch.length ? A('الفصول: ', 'Chapters: ') + (ch.indexOf('all') >= 0 ? lbls(RCHAP, ['all']) : lbls(RCHAP, ch)) : '',
        sv.length ? A('خدمات: ', 'Services: ') + lbls(RSERV, sv) + (sv.indexOf('other') >= 0 && d.rserv_o ? ' (' + d.rserv_o + ')' : '') : '',
        an && d.ranal ? A('التحليل: ', 'Analysis: ') + lbls(RANAL, d.ranal) : '', an && d.rsoft ? A('البرنامج: ', 'Program: ') + lbls(RSOFT, d.rsoft) : '', d.details || ''].filter(Boolean).join('\n'); }
    await DB.ins('requests', { user_id: IS.ME.id, name: IS.ME.name, phone: IS.ME.phone || '', kind: d.kind, spec: d.spec || IS.SPEC || 'medicine', title: d.title, details: d.details || '', status: 'pending', reply: '' }); IS.toast(A('أُرسل طلبك. سيصلك إشعار عند تنفيذه.', 'Request sent. You will be notified.')); IS.refresh(); };
  IS.ACT.viewreq = async function (b) { var r = await DB.one('requests', b.getAttribute('data-id')), k = rkind(r.kind);
    IS.sheet(esc(r.title), '<ul class="kv"><li><span>' + esc(A('النوع', 'Type')) + '</span><b>' + esc(A(k[2], k[3])) + '</b></li><li><span>' + esc(A('الحالة', 'Status')) + '</span>' + IS.rstatus(r.status) + '</li><li><span>' + esc(A('التاريخ', 'Date')) + '</span><b>' + esc(IS.date(r.created_at)) + '</b></li></ul>' + (r.details ? '<p class="pre">' + esc(r.details) + '</p>' : '') +
      (r.reply ? '<div class="note ok">' + ic('chat') + '<span>' + esc(r.reply) + '</span></div>' : '') + (r.file_id ? '<a class="btn pri wide" href="#file/' + r.file_id + '">' + ic('open') + esc(A('افتح الملف', 'Open the file')) + '</a>' : ''), { nofocus: 1 }); };

  /* ---------- sharing a file (student or lecturer); published after review ---------- */
  IS.ACT['share-file'] = function () {
    if (!IS.ME) return IS.ACT.login();
    if (IS.resetSeries) IS.resetSeries();
    IS.sheet(esc(A('رفع ملف للمكتبة', 'Upload a file to the library')), '<div class="upmode" role="tablist"><button type="button" class="on" data-act="upmode" data-m="one">' + ic('file') + esc(A('ملف واحد', 'One file')) + '</button>' +
      '<button type="button" data-act="upmode" data-m="many">' + ic('layers') + esc(A('مجموعة ملفات (شيتات أو سلسلة)', 'A group of files (sheets or a series)')) + '</button></div>' +
      '<div data-up="many" hidden>' + (IS.seriesForm ? IS.seriesForm() : '') + '</div>' +
      '<div data-up="one"><form class="form" data-form="sharefile">' + fileFields({}, true) + '<p class="note">' + ic('shield') + '<span>' + esc(A('يراجع فريق المحتوى الملف قبل نشره. ارفع فقط ما تملك حق مشاركته.', 'The content team reviews the file before publishing. Upload only what you have the right to share.')) + '</span></p><button class="btn pri wide">' + ic('upload') + esc(A('رفع', 'Upload')) + '</button></form></div>');
  };
  IS.ACT.upmode = function (b) { var d = b.closest('.dlg'); IS.$$('[data-act=upmode]', d).forEach(function (x) { x.classList.toggle('on', x === b); });
    IS.$$('[data-up]', d).forEach(function (x) { x.hidden = x.dataset.up !== b.dataset.m; }); };
  var OFFICE_TYPES = {
    ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    odp: 'application/vnd.oasis.opendocument.presentation', odt: 'application/vnd.oasis.opendocument.text',
    ods: 'application/vnd.oasis.opendocument.spreadsheet'
  };
  var DOCUMENT_TYPES = Object.assign({
    pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
    txt: 'text/plain', md: 'text/plain', csv: 'text/plain'
  }, OFFICE_TYPES);
  IS.libraryFileAccept = Object.keys(DOCUMENT_TYPES).map(function (key) { return '.' + key; }).join(',');
  IS.libraryNeedsReadingCopy = function (file) { return Object.hasOwn(OFFICE_TYPES, extension(file)); };
  function extension(file) { return file ? file.name.split('.').pop().toLowerCase() : ''; }
  function typedFile(file, type) { return file.type === type ? file : new File([file], file.name, { type: type }); }

  function fileFields(f, scoped) {
    return '<label class="fl"><span>' + esc(A('العنوان', 'Title')) + ' *</span><input name="title" required maxlength="160" value="' + esc(f.title || '') +
      '"></label><div class="g2f"><label class="fl"><span>' + esc(A('النوع', 'Type')) + '</span><select name="kind">' +
      TABS.concat(f.kind === 'book' || f.kind === 'slides' ? [f.kind] : []).map(function (id) { var k = kind(id); return '<option value="' + k[0] + '"' + (f.kind === k[0] ? ' selected' : '') + '>' + esc(A(k[2], k[3])) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fl"><span>' + esc(A('المادة', 'Subject')) + '</span><select name="subject">' + subjOptions(f.subject, scoped) + '</select></label></div>' +
      '<label class="fl"><span>' + esc(A('المؤلف أو المصدر', 'Author or source')) + '</span><input name="author" maxlength="120" value="' + esc(f.author || '') +
      '"></label><label class="fl"><span>' + esc(A('وصف قصير', 'Short description')) + '</span><textarea name="about" rows="2" maxlength="600">' + esc(f.about || '') + '</textarea></label>' +
      '<label class="fl file"><span>' + esc(A('الملف (حتى 50 ميغابايت)', 'File (up to 50 MB)')) + (f.id ? '' : ' *') +
      '</span><input type="file" name="file" data-library-upload accept="' + IS.libraryFileAccept +
      '"' + (f.id ? '' : ' required') + '><small>' + esc(A('PDF أو صورة أو نص أو ملف Office.', 'PDF, image, text or Office file.')) + '</small></label>' +
      '<label class="fl file" data-reading-upload hidden><span>' + esc(A('نسخة PDF للقراءة داخل التطبيق', 'PDF reading copy')) +
      ' *</span><input type="file" name="reading" accept="application/pdf,.pdf" disabled><small>' +
      esc(A('تُستخدم هذه النسخة لفتح المستند أو العرض داخل التطبيق وتنزيله للقراءة دون إنترنت.', 'This copy opens inside the app and can be saved for offline reading.')) + '</small></label>' +
      '<label class="fl file"><span>' + esc(A('صورة الغلاف (اختياري)', 'Cover picture (optional)')) +
      '</span><input type="file" name="cover" accept="image/jpeg,image/png,image/webp,image/gif"><small>' +
      esc(A('يُستخدم غلاف الملف أو أول صفحة من PDF إذا لم ترفع صورة.', 'If you leave this blank, the app uses the image or first PDF page when available.')) + '</small></label>' +
      (IS.sellFields ? IS.sellFields(f) : '');
  }
  document.addEventListener('change', function (event) {
    var upload = event.target;
    if (!upload.matches('[data-library-upload]')) return;
    var reading = upload.form.elements.reading;
    var office = Object.hasOwn(OFFICE_TYPES, extension(upload.files[0]));
    reading.closest('[data-reading-upload]').hidden = reading.disabled = !office;
    reading.required = office;
  });
  IS.fileFields = fileFields;
  IS.saveFile = async function (data, form, extra) {
    var original = form.elements.file.files[0], cover = form.elements.cover.files[0];
    var subject = IS.subj(data.subject), scope = IS.mySection();
    var row = Object.assign({ title: data.title, kind: data.kind, subject: data.subject,
      cat: (subject || {}).cat || (scope ? scope.id : ''), spec: (subject || {}).spec || IS.SPEC || 'medicine',
      author: data.author || '', about: data.about || '' }, IS.readSell ? IS.readSell(data) : {}, extra);
    await IS.attachLibraryFiles(row, original, form.elements.reading.files[0], cover);
    if (!DB.live && row.status === 'published') row.published_at = new Date().toISOString();
    return row;
  };
  IS.validateLibraryFiles = function (original, reading, cover) {
    var suffix = extension(original), type = DOCUMENT_TYPES[suffix];
    if (original && !Object.hasOwn(DOCUMENT_TYPES, suffix)) throw new Error(A('اختر ملفًا مدعومًا.', 'Choose a supported file.'));
    if (IS.libraryNeedsReadingCopy(original) && extension(reading) !== 'pdf') {
      throw new Error(A('أرفق نسخة PDF للقراءة.', 'Add the PDF reading copy.'));
    }
    if ([original, reading].some(function (file) { return file && (!file.size || file.size > 50 * 1048576); })) {
      throw new Error(A('اختر ملفات بحجم لا يتجاوز 50 ميغابايت لكل ملف.', 'Choose files up to 50 MB each.'));
    }
    if (cover && (!/^image\/(jpeg|png|webp|gif)$/.test(cover.type) || !cover.size || cover.size > 50 * 1048576)) {
      throw new Error(A('اختر صورة غلاف مدعومة بحجم 50 ميغابايت أو أقل.', 'Choose a JPEG, PNG, WebP or GIF cover up to 50 MB.'));
    }
    return type;
  };
  IS.attachLibraryFiles = async function (row, original, reading, cover) {
    var type = IS.validateLibraryFiles(original, reading, cover), metadata;
    if (original) {
      if (reading || type === 'application/pdf') {
        metadata = await pdfMetadata(reading || original, !cover).catch(function () { return null; });
        if (reading && !metadata) throw new Error(A('تعذّر فتح نسخة PDF. اختر نسخة صالحة.', 'The reading copy could not be opened. Choose a valid PDF.'));
      }
      var file = typedFile(original, type);
      row.path = await DB.upload('library', /^image\//.test(type) ? await IS.shrink(file, 2000, 0.85) : file);
      row.mime = type;
      row.size = original.size;
      row.pages = metadata ? metadata.pages : 0;
      row.reading_path = reading ? await DB.upload('library', typedFile(reading, 'application/pdf')) : null;
      if (!cover) cover = metadata && metadata.cover || (/^image\//.test(type) ? file : null);
    }
    if (cover) row.cover = await DB.upload('library', await IS.shrink(cover, 600, 0.82));
  };
  IS.SUB.sharefile = async function (data, form) {
    var row = await IS.saveFile(data, form, { owner_id: IS.ME.id, owner_name: IS.ME.name, status: IS.can('library', 'approve') ? 'published' : 'pending' });
    await DB.ins('files', row);
    IS.closeSheet();
    IS.toast(row.status === 'published' ? A('نُشر الملف', 'File published') : A('شكرًا! سيُنشر بعد المراجعة.', 'Thank you! It will be published after review.'));
    IS.refresh();
  };

  var PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', pdfLoading;
  function pdfLib() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (!pdfLoading) pdfLoading = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = PDFJS;
      script.onload = function () {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS.replace('pdf.min.js', 'pdf.worker.min.js');
        resolve(window.pdfjsLib);
      };
      script.onerror = function (error) { pdfLoading = null; script.remove(); reject(error); };
      document.head.appendChild(script);
    });
    return pdfLoading;
  }
  IS.pdfMeta = function (file, needsCover) { return pdfMetadata(file, needsCover); };
  async function pdfMetadata(file, needsCover) {
    var lib = await pdfLib();
    var source = typeof file === 'string' ? { url: file, disableAutoFetch: true, disableStream: true } : { data: await file.arrayBuffer() };
    var assets = new URL('pdfjs/', document.baseURI).href;
    var task = lib.getDocument(Object.assign(source, { isEvalSupported: false,
      cMapUrl: assets + 'cmaps/', cMapPacked: true, standardFontDataUrl: assets + 'standard_fonts/' }));
    var doc;
    try { doc = await task.promise; } catch (error) { await task.destroy(); throw error; }
    try {
      if (!needsCover) return { pages: doc.numPages };
      var cover = await (async function () {
        var page = await doc.getPage(1), base = page.getViewport({ scale: 1 });
        var viewport = page.getViewport({ scale: Math.min(600 / base.width, 760 / base.height) });
        var canvas = document.createElement('canvas');
        canvas.width = viewport.width; canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
        var bytes = await new Promise(function (resolve) { canvas.toBlob(resolve, 'image/jpeg', 0.82); });
        return bytes ? new File([bytes], 'cover.jpg', { type: 'image/jpeg' }) : null;
      })().catch(function () { return null; });
      return { pages: doc.numPages, cover: cover };
    } finally { await doc.destroy(); }
  }
  IS.libraryDocument = function (file) {
    var path = file.reading_path || file.path || '';
    var mime = file.reading_path || /\.pdf(?:$|[?#])/i.test(path) ? 'application/pdf' : file.mime || 'application/pdf';
    return { path: path, mime: mime };
  };
  IS.renderLibraryDocument = async function (target, media, url, blob, meta) {
    if (/^image\//.test(media)) {
      target.innerHTML = '<img src="' + esc(url) + '" alt="" draggable="false">';
      return;
    }
    if (media === 'text/plain' || media === 'text/csv') {
      var textFile = blob || await fetch(url).then(function (response) {
        if (!response.ok) throw new Error('file unavailable');
        return response.blob();
      });
      target.innerHTML = '<pre class="library-text" dir="auto"></pre>';
      target.firstChild.textContent = await textFile.text();
      return;
    }
    if (media !== 'application/pdf') throw new Error('unsupported');
    /* PDFs open in the full-screen reader (js/reader.js): sharp pages, copy, highlight, zoom, search, full screen */
    if (IS.openReader) {
      meta = meta || {};
      var open = function () { IS.openReader({ id: meta.id, title: meta.title, url: url, blob: blob }); };
      /* a light book card (owner, 19 Nov 2026: the dark box under «اقرأ داخل التطبيق» looked bad): cover, title, where the reader stopped,
         the reader's tools and one big button */
      var last = 0, marks = 0;
      try { last = +JSON.parse(localStorage.getItem('ish-rpg:' + meta.id) || '0') || 0; marks = (JSON.parse(localStorage.getItem('ish-hl:' + meta.id) || '[]') || []).length; } catch (e) {}
      target.classList.add('viewer-card');
      target.innerHTML = '<div class="rdr-open">' + (meta.cover ? '<div class="rdr-cover">' + meta.cover + '</div>' : '<div class="rdr-cover rdr-nocover">' + ic('open') + '</div>') +
        '<div class="rdr-info"><b dir="auto">' + esc(meta.title || A('الكتاب', 'The book')) + '</b>' +
        (last > 1 ? '<span class="rdr-last">' + ic('bookmark') + esc(A('توقفت عند الصفحة ', 'You stopped at page ')) + '<bdi>' + last + '</bdi></span>' : '') +
        '<ul class="rdr-feats">' + [['search', A('بحث في الكتاب', 'Search the book')], ['pen', A('تظليل ونسخ', 'Highlight and copy')], ['open', A('ملء الشاشة وتكبير', 'Full screen and zoom')]].map(function (f) {
          return '<li>' + ic(f[0]) + '<span>' + esc(f[1]) + '</span></li>'; }).join('') + '</ul>' +
        '<button type="button" class="btn pri rdr-go">' + ic('open') + esc(last > 1 ? A('تابع القراءة', 'Continue reading') : A('افتح الكتاب', 'Open the book')) + '</button>' +
        (marks ? '<small class="mut">' + esc(A('تظليلاتك: ', 'Your highlights: ')) + '<bdi>' + marks + '</bdi></small>' : '') + '</div></div>';
      target.querySelector('.rdr-go').onclick = open; if (IS.hydrateLibraryCovers) IS.hydrateLibraryCovers(target).catch(function () {});
      if (meta.auto !== false) open();
      return;
    }
    var lib = await pdfLib();
    var opts = blob ? { data: await blob.arrayBuffer() } : { url: url };
    var doc = await lib.getDocument(Object.assign(opts, { isEvalSupported: false })).promise;
    var width = Math.min(target.clientWidth - 8, 980), shown = 0;
    target.innerHTML = '<p class="mut center">' + N(doc.numPages) + ' ' + esc(A('صفحة', 'pages')) + '</p>';
    async function more() {
      var end = Math.min(doc.numPages, shown + 6);
      for (var i = shown + 1; i <= end; i++) {
        if (!target.isConnected) { await doc.destroy(); return; }
        var page = await doc.getPage(i), base = page.getViewport({ scale: 1 });
        var scale = width / base.width * Math.min(window.devicePixelRatio || 1, 2), viewport = page.getViewport({ scale: scale });
        var canvas = document.createElement('canvas');
        canvas.width = viewport.width; canvas.height = viewport.height; canvas.style.width = width + 'px';
        target.appendChild(canvas);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
      }
      shown = end;
      if (shown === doc.numPages) { await doc.destroy(); return; }
      var button = document.createElement('button');
      button.type = 'button'; button.className = 'btn ghost wide morepg';
      button.textContent = A('عرض الصفحات التالية', 'Show the next pages') + ' (' + shown + ' / ' + doc.numPages + ')';
      button.onclick = function () { button.remove(); more().catch(function () { target.appendChild(button); }); };
      target.appendChild(button);
    }
    await more();
  };

  /* «Open the book»: PDFs go straight to the full-screen reader; pictures and text files open in a sheet */
  IS.ACT.readbook = async function (b) {
    var file = IS.FILEOPEN && IS.FILEOPEN.id === b.dataset.id ? IS.FILEOPEN : await DB.one('files', b.dataset.id);
    if (!file) return;
    if (!IS.fileOpenable(file)) { b.dataset.id = file.id; return IS.ACT.buyfile(b); }
    var html = b.innerHTML; b.disabled = true; b.innerHTML = '<span class="spin"></span>' + esc(A('جارٍ الفتح…', 'Opening…'));
    try {
      var media = IS.libraryDocument(file), url = await DB.fileUrl('library', media.path); if (!url) throw new Error('missing file');
      if (media.mime === 'application/pdf' && IS.openReader) IS.openReader({ id: file.id, title: file.title, url: url });
      else { var box = IS.sheet(esc(file.title || ''), '<div class="viewer" id="sheetview"></div>', { wide: 1 }); await IS.renderLibraryDocument(box.querySelector('#sheetview'), media.mime, url, null, { id: file.id, title: file.title }); }
    } catch (e) { IS.toast(navigator.onLine ? A('تعذّر فتح الملف. أعد المحاولة.', 'The file could not be opened. Try again.') : A('لا يوجد إنترنت: افتح نسخته المنزّلة من «تنزيلاتي».', 'No internet: open its downloaded copy from My downloads.')); }
    finally { b.disabled = false; b.innerHTML = html; }
  };
  function canRemoveComment(comment) {
    return IS.ME && (IS.ME.id === comment.user_id || IS.can('library', 'approve') || IS.can('community', 'delete'));
  }
  async function libraryComment(id, message, remove) {
    if (!IS.ME) return IS.ACT.login();
    if (DB.live) {
      var result = await DB.sb.rpc('ish_library_comment', { file: id, message: message || null, remove: remove || null });
      if (result.error) throw result.error;
    } else {
      var file = await DB.one('files', id);
      if (!file || file.status !== 'published') return;
      if (remove) {
        var comment = await DB.one('library_comments', remove);
        if (!comment || comment.file_id !== id || !canRemoveComment(comment)) return;
        await DB.del('library_comments', remove);
      } else {
        await DB.ins('library_comments', { file_id: id, user_id: IS.ME.id, author_name: IS.ME.name, body: message });
      }
      var comments = await DB.q('library_comments', { eq: { file_id: id } });
      await DB.upd('files', id, { comment_count: comments.length });
    }
  }
  IS.commentOnLibraryFile = libraryComment;
  IS.SUB['library-comment'] = async function (data) {
    if (!data.body) return;
    await libraryComment(data.file, data.body);
    IS.refresh();
  };
  IS.ACT['remove-library-comment'] = async function (button) {
    if (!await IS.confirm(A('احذف هذا التعليق؟', 'Delete this comment?'))) return;
    await libraryComment(button.dataset.file, null, button.dataset.id);
    IS.refresh();
  };
  function fileComments(file, comments) {
    var signedIn = !!IS.ME;
    return '<section class="box post-comments"><h2 tabindex="-1" data-post-comments>' + IS.T('التعليقات', 'Comments') + '</h2>' +
      (signedIn ? '<form class="form" data-form="library-comment"><input type="hidden" name="file" value="' + esc(file.id) +
        '"><label class="fl"><span>' + esc(A('اكتب تعليقًا', 'Write a comment')) + '</span><textarea name="body" required rows="2" maxlength="2000"></textarea></label>' +
        '<div class="row end"><button class="btn pri sm">' + ic('send') + esc(A('انشر التعليق', 'Post comment')) + '</button></div></form>' :
        '<p class="mut">' + esc(A('سجّل الدخول للمشاركة في التعليقات.', 'Sign in to join the conversation.')) + '</p>') +
      comments.map(function (comment) {
        return IS.commentItem({ name: comment.author_name, photo: comment.author_photo, when: IS.ago(comment.created_at), body: comment.body, report: ['file_comment', comment.id],
          del: canRemoveComment(comment) ? '<button type="button" class="cact bad" data-act="remove-library-comment" data-id="' + esc(comment.id) + '" data-file="' + esc(file.id) + '">' + ic('trash') + esc(A('حذف', 'Delete')) + '</button>' : '' });
      }).join('') + '</section>';
  }

  IS.page('file', async function (arg) {
    var parts = String(arg || '').split('/'), id = parts[0];
    var file = await DB.one('files', id);
    if (IS.loadBuys) await IS.loadBuys();
    if (!file || (file.status !== 'published' && !(IS.ME && (file.owner_id === IS.ME.id || IS.can('library'))))) return null;
    if (!IS.can('library') && !IS.inStudySpace(file)) return IS.outsideStudySpace(file);
    var published = file.status === 'published', genre = kind(file.kind), subject = IS.subj(file.subject);
    var browseKind = file.kind === 'book' ? kind('reference') : genre;
    var data = published ? await Promise.all([
      DB.q('library_comments', { eq: { file_id: id }, order: ['created_at', false], limit: 60 }),
      IS.ME ? DB.q('feed_feedback', { eq: { file_id: id, user_id: IS.ME.id }, limit: 1 }) : []
    ]) : [[], []];
    var own = data[1][0] || {};
    file.my_reaction = own.reaction || null;
    file.my_stars = Number(own.stars) || 0;
    var h = '<nav class="crumb"><a href="#library">' + esc(A('مكتبتي', 'My Library')) + '</a>' +
      (genre[0] === 'slides' ? '' : ic('chev', 'fl') + '<a href="#library/' + esc(browseKind[0]) + '">' + esc(A(browseKind[2], browseKind[3])) + '</a>') + '</nav><article class="box library-detail">' +
      IS.libraryCover(file) + '<div><h1 tabindex="-1"><bdi>' + esc(file.title) + '</bdi></h1><p class="mut">' +
      [A(genre[2], genre[3]), spName(fspec(file)), subject && subject.en, file.author].filter(Boolean).map(esc).join(' · ') + '</p>' +
      '<div class="row fprice">' + IS.priceTag(file) + IS.tagChips(file) + '</div>' +
      (file.about ? '<p class="pre" dir="auto">' + esc(file.about) + '</p>' : '') +
      (file.reading_path ? '<p class="mut">' + esc(A('متاح للقراءة بصيغة PDF.', 'Available to read as a PDF.')) + '</p>' : '') +
      (published ? IS.feedVoteBar('file', file) : IS.status(file.status)) +
      (file.series_id ? '<a class="schip" href="#series/' + esc(file.series_id) + '">' + ic('layers') + esc(A('الجزء ', 'Part ') + (file.series_no || 1) + A(' من سلسلة: ', ' of the series: ')) + '<b dir="auto">' + esc(file.series_title || '') + '</b>' + ic('chev', 'fl') + '</a>' : '') +
      '<div class="row file-actions">' + (function () {
        var last = 0; try { last = +JSON.parse(localStorage.getItem('ish-rpg:' + id) || '0') || 0; } catch (e) {}
        if (published && !IS.fileOpenable(file)) return IS.buyBtn(file, false, !!file.series_id);
        return IS.ME ? '<button type="button" class="btn pri file-open" data-act="readbook" data-id="' + esc(id) + '">' + ic('open') +
          esc(last > 1 ? A('تابع القراءة · ص ', 'Continue reading · p. ') + last : A('افتح الكتاب', 'Open the book')) + '</button>' :
          '<button type="button" class="btn pri file-open" data-act="login">' + ic('lock') + esc(A('سجّل الدخول لفتح الكتاب', 'Sign in to open the book')) + '</button>';
      })() + IS.favBtn('f:' + id) + (IS.ME && published && IS.fileOpenable(file) ? IS.dlBtn('file', id) : '') +
      (IS.ME ? '<button class="fav" data-act="addcoll" data-id="' + esc(id) + '" aria-label="' + esc(A('أضف إلى مجموعة', 'Add to collection')) + '">' +
        ic('folder') + '</button>' : '') + '</div></div></article>';
    IS.FILEOPEN = file;
    if (published) h += fileComments(file, data[0].reverse());
    IS.after = function (main) {
      IS.hydrateLibraryCovers(main).catch(function () {});
      if (parts[1] === 'comments') IS.focusPostComments(main);
      else if (parts[1] === 'rating') {
        var rating = main.querySelector('[data-act=rate-library-file]');
        if (rating) IS.ACT['rate-library-file'](rating);
      }
      if (parts[1] === 'read' && IS.ME) { var b = main.querySelector('[data-act=readbook]'); if (b) IS.ACT.readbook(b); }
    };
    return h;
  });
})();
