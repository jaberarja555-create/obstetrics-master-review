/* اشرح لي: My Library (owner's design, 17 Nov 2026): books, sheets, summaries, slides, question banks, references and other files,
   viewed inside the app only (PDF pages drawn on the screen, no download link); student requests (book, PDF, printed copy, explanation, other)
   with their status; students can share a useful file, which the content team reviews before it is published. */
(function () {
  'use strict';
  var A = IS.A, esc = IS.esc, ic = IS.ic, N = IS.N, $ = IS.$;
  var KINDS = IS.FKINDS = [['book', 'open', 'الكتب', 'Books'], ['sheet', 'layers', 'الشيتات', 'Sheets'], ['summary', 'file', 'الملخصات', 'Summaries'], ['slides', 'studio', 'العروض التقديمية', 'Slides (PPT)'],
    ['qbank', 'qb', 'بنوك الأسئلة', 'QBanks'], ['reference', 'link', 'المراجع', 'References'], ['other', 'folder', 'أخرى', 'Others']];
  var RKINDS = IS.RKINDS = [['book', 'layers', 'طلب كتاب', 'Request Book'], ['pdf', 'file', 'طلب ملف PDF', 'Request PDF'], ['printed', 'receipt', 'طلب نسخة مطبوعة', 'Printed Book'], ['explain', 'video', 'طلب شرح/محاضرة', 'Request Explanation'], ['research', 'pen', 'طلب كتابة بحث', 'Research Writing'], ['other', 'grid', 'طلبات أخرى', 'Other Requests']];
  /* research writing (owner, 18 Nov 2026: «كتابة بحث»): the kind of research, its stage and the deadline go with the request */
  var RTYPES = [['مشروع تخرج', 'Graduation project'], ['مقترح بحث (Proposal)', 'Research proposal'], ['مقالة علمية', 'Scientific article'], ['مراجعة منهجية أو أدبية', 'Systematic / literature review'], ['رسالة ماجستير أو دكتوراه', 'Master’s or doctoral thesis'], ['تحليل إحصائي', 'Statistical analysis'], ['ملصق علمي (Poster)', 'Scientific poster'], ['تدقيق ومراجعة لغوية', 'Editing and proofreading']];
  var RSTAGES = [['لم أبدأ بعد', 'Not started'], ['اخترت الموضوع', 'Topic chosen'], ['جمعت البيانات', 'Data collected'], ['أكتب الفصول', 'Writing the chapters'], ['أحتاج مراجعة نهائية', 'Needs a final review']];
  function kind(k) { return KINDS.filter(function (x) { return x[0] === k; })[0] || KINDS[6]; }
  function rkind(k) { return RKINDS.filter(function (x) { return x[0] === k; })[0] || RKINDS[RKINDS.length - 1]; }
  IS.rstatus = function (s) { var m = { pending: ['جديد', 'New', 'warn'], progress: ['قيد التنفيذ', 'In progress', 'warn'], done: ['مكتمل', 'Done', 'ok'], rejected: ['مرفوض', 'Rejected', 'bad'] }[s] || [s, s, ''];
    return IS.chip(ic(s === 'done' ? 'checkc' : s === 'rejected' ? 'x' : 'clock') + esc(A(m[0], m[1])), 'st ' + m[2]); };
  var T = { k: 'all', q: '', sub: '', sp: '' };
  /* specialities in the library (owner, 18 Nov 2026: "update the library so it includes the other specialities") */
  function fspec(f) { return f.spec || (IS.subj(f.subject) || {}).spec || 'medicine'; }
  function spName(id) { var x = IS.SPECS.filter(function (s) { return s.id === id; })[0]; return x ? x.en : ''; }
  function specBar() { return '<section class="specbar">' + [{ id: '', en: 'All specialities', ar: 'كل التخصصات', icon: 'grid' }].concat(IS.SPECS).map(function (x) {
    return '<a class="spb2' + (x.id === T.sp ? ' on' : '') + '" href="#library/@' + (x.id || 'all') + '">' + ic(x.icon) + '<span><b lang="en">' + esc(x.en) + '</b>' + (IS.lang === 'en' ? '' : '<small>' + esc(x.ar) + '</small>') + '</span></a>'; }).join('') + '</section>'; }
  function subjOptions(cur) { var sp = cur ? (IS.subj(cur) || {}).spec : T.sp; return IS.SPECS.map(function (g) { var ss = IS.SUBJ.filter(function (x) { return x.spec === g.id; }); if (!ss.length) return '';
    return '<optgroup label="' + esc(g.en + (IS.lang === 'en' ? '' : ' · ' + g.ar)) + '">' + ss.map(function (x, i) { return '<option value="' + x.id + '"' + (cur ? (cur === x.id ? ' selected' : '') : (g.id === sp && i === 0 ? ' selected' : '')) + '>' + esc(x.en) + '</option>'; }).join('') + '</optgroup>'; }).join(''); }

  IS.page('library', async function (tab) {
    if (tab && tab.charAt(0) === '@') { T.sp = tab === '@all' ? '' : tab.slice(1); tab = T.k; } if (IS.SPEC) T.sp = IS.SPEC;
    T.k = tab || T.k || 'all';
    var fs = (await DB.q('files', { eq: { status: 'published' }, order: ['created_at', false] })).filter(function (f) { return !T.sp || fspec(f) === T.sp; }), me = IS.ME;
    var reqs = me ? await DB.q('requests', { eq: { user_id: me.id }, order: ['created_at', false] }) : [];
    var h = IS.banner('<span>' + esc(A('مكتبتي', 'My Library')) + '</span> <small lang="en">My Library</small>', esc(A('كل كتبك وملفاتك الدراسية في مكان واحد', 'All your books and study files in one place')), 'open', '', 'libban') + (IS.SPEC ? '' : specBar());
    h += '<section class="ltabs"><a href="#library/requests" class="lt req' + (T.k === 'requests' ? ' on' : '') + '">' + ic('receipt') + '<b lang="en">Requests</b>' + (IS.lang === 'en' ? '' : '<small>' + esc('الطلبات') + '</small>') + (reqs.filter(function (r) { return r.status === 'pending' || r.status === 'progress'; }).length ? '<i>' + N(reqs.filter(function (r) { return r.status === 'pending' || r.status === 'progress'; }).length) + '</i>' : '') + '</a>' +
      '<a href="#library/all" class="lt' + (T.k === 'all' ? ' on' : '') + '">' + ic('grid') + '<b>' + esc(A('الكل', 'All Files')) + '</b><small>' + N(fs.length) + '</small></a>' +
      KINDS.map(function (k) { return '<a href="#library/' + k[0] + '" class="lt' + (T.k === k[0] ? ' on' : '') + '">' + ic(k[1]) + '<b>' + esc(A(k[2], k[3])) + '</b><small>' + N(fs.filter(function (f) { return f.kind === k[0]; }).length) + '</small></a>'; }).join('') + '</section>';
    if (T.k === 'requests') return h + requestsView(reqs, fs);
    var list = fs.filter(function (f) { return T.k === 'all' || f.kind === T.k; });
    var subjects = IS.SUBJ.filter(function (s) { return T.sp ? s.spec === T.sp : fs.some(function (f) { return f.subject === s.id; }); });
    h += '<div class="cols rev"><aside class="filt" id="filt"><header><h2>' + ic('filter') + IS.T('تصفية المكتبة', 'Filter the library') + '</h2></header>' +
      '<details class="fg" open><summary>' + esc(A('القسم', 'Section')) + ic('down') + '</summary><div>' + IS.CATS.map(function (c) { var n = fs.filter(function (f) { return f.cat === c.id; }).length; return '<label class="opt"><input type="checkbox" data-lf="cat" value="' + c.id + '"><span>' + esc(c.en) + '</span><em>' + N(n) + '</em></label>'; }).join('') + '</div></details>' +
      (subjects.length ? '<details class="fg" open><summary>' + esc(A('المادة', 'Subject')) + ic('down') + '</summary><div>' + subjects.map(function (s) { return '<label class="opt"><input type="checkbox" data-lf="sub" value="' + s.id + '"><span>' + esc(s.en) + '</span><em>' + N(fs.filter(function (f) { return f.subject === s.id; }).length) + '</em></label>'; }).join('') + '</div></details>' : '') + '</aside>' +
      '<div class="main"><div class="tool"><label class="field">' + ic('search') + '<input id="lq" type="search" placeholder="' + esc(A('ابحث في مكتبتي…', 'Search the library…')) + '"></label><button class="btn ghost only-ph" data-act="ftog">' + ic('filter') + esc(A('تصفية', 'Filter')) + '</button>' +
      (me ? '<button class="btn pri" data-act="share-file">' + ic('upload') + esc(A('شارك ملفًا', 'Share a file')) + '</button>' : '') + '</div><div id="lres"></div></div>' +
      '<aside class="aside">' + (me ? collBox() : '') + '<section class="box upl">' + ic('upload') + '<b>' + esc(A('هل لديك كتاب أو ملف مفيد؟', 'Have a useful book or file?')) + '</b><span>' + esc(A('شاركه مع زملائك في المكتبة بعد مراجعته من فريق المحتوى.', 'Share it with your classmates after the content team reviews it.')) + '</span><button class="btn pri sm" data-act="share-file">' + esc(A('رفع ملف للمكتبة', 'Upload to the library')) + '</button></section></aside></div>';
    IS.after = function () {
      var sel = { cat: {}, sub: {} }, fill = function () {
        var w = IS.norm(($('#lq') || {}).value || '').split(' ').filter(Boolean), cats = Object.keys(sel.cat).filter(function (k) { return sel.cat[k]; }), subs = Object.keys(sel.sub).filter(function (k) { return sel.sub[k]; }), coll = IS.LCOLL;
        var r = list.filter(function (f) { if (cats.length && cats.indexOf(f.cat) < 0) return false; if (subs.length && subs.indexOf(f.subject) < 0) return false; if (coll && (coll.items || []).indexOf(f.id) < 0) return false;
          if (w.length) { var hay = IS.norm([f.title, f.about, f.author].join(' ')); if (!w.every(function (x) { return hay.indexOf(x) >= 0; })) return false; } return true; });
        $('#lres').innerHTML = (coll ? '<p class="count">' + ic('folder') + esc(coll.n) + ' <button class="link" data-act="lcoll" data-i="-1">' + esc(A('عرض الكل', 'Show all')) + '</button></p>' : '') + (r.length ? '<div class="grid g4 files">' + r.map(fileCard).join('') + '</div>' :
          IS.empty(kind(T.k === 'all' ? 'other' : T.k)[1], A('لا توجد ملفات هنا بعد', 'No files here yet'), A('لم تجد ما تبحث عنه؟ اطلبه من المكتبة.', 'Can’t find it? Request it from the library.'), '<a class="btn pri" href="#library/requests">' + ic('plus') + esc(A('اطلبه الآن', 'Request it')) + '</a>'));
      };
      IS.libFill = fill; fill(); $('#lq').oninput = fill;
      IS.$$('[data-lf]').forEach(function (i) { i.onchange = function () { sel[i.getAttribute('data-lf')][i.value] = i.checked; fill(); }; });
    };
    return h;
  });
  function fileCard(f) {
    var k = kind(f.kind);
    return '<article class="fcard"><a class="fimg" href="#file/' + f.id + '">' + (f.cover ? '<img src="' + IS.U(f.cover) + '" alt="" loading="lazy">' : '<span class="fph k-' + f.kind + '">' + ic(k[1]) + '<b>' + esc(f.title.slice(0, 40)) + '</b></span>') + '</a>' +
      '<div class="fb"><span class="ftype">' + ic(/pdf/.test(f.mime || '') ? 'file' : 'image') + esc(A(k[2], k[3])) + ' · ' + esc(spName(fspec(f))) + '</span><b><a href="#file/' + f.id + '">' + esc(f.title) + '</a></b>' + (f.author ? '<small>' + esc(f.author) + '</small>' : '') + '</div>' +
      '<div class="ff"><span class="mut">' + (f.pages ? N(f.pages) + ' ' + esc(A('صفحة', 'pages')) : '') + '</span>' + IS.favBtn('f:' + f.id, true) + (IS.ME ? '<button class="fav sm" data-act="addcoll" data-id="' + f.id + '" aria-label="' + esc(A('أضف إلى مجموعة', 'Add to collection')) + '">' + ic('folder') + '</button>' : '') + '</div></article>';
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
    h += '<section class="rkinds">' + RKINDS.map(function (k) { return '<button class="rk k-' + k[0] + '" data-act="rkind" data-k="' + k[0] + '">' + ic(k[1]) + '<b lang="en">' + esc(k[3]) + '</b>' + (IS.lang === 'en' ? '' : '<small>' + esc(k[2]) + '</small>') + '</button>'; }).join('') + '</section>';
    /* figures as one row of tiles, then the form and the list side by side at the same height (owner, 18 Nov 2026: "remove all the empty spaces") */
    h += '<section class="rstats">' + [['receipt', c.all, A('إجمالي الطلبات', 'Total requests')], ['clock', c.prog, A('قيد التنفيذ', 'In progress')], ['checkc', c.done, A('مكتملة', 'Done')], ['x', c.rej, A('مرفوضة', 'Rejected')]].map(function (x) {
      return '<span>' + ic(x[0]) + '<b>' + N(x[1]) + '</b><small>' + esc(x[2]) + '</small></span>'; }).join('') + '</section>';
    h += '<div class="rgrid"><section class="box newreq"><h2 class="bandh">' + ic('plus') + IS.T('إنشاء طلب جديد', 'New request') + '</h2>' + (me ? '<form class="form" data-form="request"><label class="fl"><span>' + esc(A('نوع الطلب', 'Request type')) + ' *</span><select name="kind" id="rkSel">' + RKINDS.map(function (k) { return '<option value="' + k[0] + '">' + esc(A(k[2], k[3])) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fl"><span>' + esc(A('التخصص', 'Speciality')) + '</span><select name="spec">' + IS.SPECS.map(function (x) { return '<option value="' + x.id + '"' + (x.id === (T.sp || 'medicine') ? ' selected' : '') + '>' + esc(x.en + (IS.lang === 'en' ? '' : ' · ' + x.ar)) + '</option>'; }).join('') + '</select></label>' +
      '<div class="rsx" id="rsx" hidden><label class="fl"><span>' + esc(A('نوع البحث', 'Kind of research')) + '</span><select name="rtype">' + RTYPES.map(function (x) { return '<option value="' + esc(x[1]) + '">' + esc(A(x[0], x[1])) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fl"><span>' + esc(A('المرحلة الحالية', 'Current stage')) + '</span><select name="rstage">' + RSTAGES.map(function (x) { return '<option value="' + esc(x[1]) + '">' + esc(A(x[0], x[1])) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fl"><span>' + esc(A('موعد التسليم', 'Deadline')) + '</span><input name="rdue" type="date"></label></div>' +
      '<label class="fl"><span id="rtl">' + esc(A('عنوان الكتاب أو الموضوع', 'Title of the book or topic')) + ' *</span><input name="title" required maxlength="160" placeholder="' + esc(A('مثال: Oxford Obstetrics (4th ed.)', 'e.g. Oxford Obstetrics (4th ed.)')) + '"></label>' +
      '<label class="fl"><span>' + esc(A('تفاصيل إضافية (اختياري)', 'More details (optional)')) + '</span><textarea name="details" rows="3" maxlength="1000" placeholder="' + esc(A('حدد الطبعة، اللغة، أو أي ملاحظات أخرى…', 'Edition, language or any other notes…')) + '"></textarea></label>' +
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
  document.addEventListener('change', function (e) { if (e.target && e.target.id === 'rkSel') rsxShow(); });
  IS.SUB.request = async function (d) { if (d.kind === 'research') d.details = [A('نوع البحث: ', 'Kind: ') + d.rtype, A('المرحلة: ', 'Stage: ') + d.rstage, d.rdue ? A('موعد التسليم: ', 'Deadline: ') + d.rdue : '', d.details || ''].filter(Boolean).join('\n');
    await DB.ins('requests', { user_id: IS.ME.id, name: IS.ME.name, phone: IS.ME.phone || '', kind: d.kind, spec: d.spec || IS.SPEC || 'medicine', title: d.title, details: d.details || '', status: 'pending', reply: '' }); IS.toast(A('أُرسل طلبك. سيصلك إشعار عند تنفيذه.', 'Request sent. You will be notified.')); IS.refresh(); };
  IS.ACT.viewreq = async function (b) { var r = await DB.one('requests', b.getAttribute('data-id')), k = rkind(r.kind);
    IS.sheet(esc(r.title), '<ul class="kv"><li><span>' + esc(A('النوع', 'Type')) + '</span><b>' + esc(A(k[2], k[3])) + '</b></li><li><span>' + esc(A('الحالة', 'Status')) + '</span>' + IS.rstatus(r.status) + '</li><li><span>' + esc(A('التاريخ', 'Date')) + '</span><b>' + esc(IS.date(r.created_at)) + '</b></li></ul>' + (r.details ? '<p class="pre">' + esc(r.details) + '</p>' : '') +
      (r.reply ? '<div class="note ok">' + ic('chat') + '<span>' + esc(r.reply) + '</span></div>' : '') + (r.file_id ? '<a class="btn pri wide" href="#file/' + r.file_id + '">' + ic('open') + esc(A('افتح الملف', 'Open the file')) + '</a>' : ''), { nofocus: 1 }); };

  /* ---------- sharing a file (student or lecturer); published after review ---------- */
  IS.ACT['share-file'] = function () {
    if (!IS.ME) return IS.ACT.login();
    IS.sheet(esc(A('رفع ملف للمكتبة', 'Upload a file to the library')), '<form class="form" data-form="sharefile">' + fileFields({}) + '<p class="note">' + ic('shield') + '<span>' + esc(A('يراجع فريق المحتوى الملف قبل نشره. ارفع فقط ما تملك حق مشاركته.', 'The content team reviews the file before publishing. Upload only what you have the right to share.')) + '</span></p><button class="btn pri wide">' + ic('upload') + esc(A('رفع', 'Upload')) + '</button></form>');
  };
  function fileFields(f) {
    return '<label class="fl"><span>' + esc(A('العنوان', 'Title')) + ' *</span><input name="title" required maxlength="160" value="' + esc(f.title || '') + '"></label><div class="g2f"><label class="fl"><span>' + esc(A('النوع', 'Type')) + '</span><select name="kind">' + KINDS.map(function (k) { return '<option value="' + k[0] + '"' + (f.kind === k[0] ? ' selected' : '') + '>' + esc(A(k[2], k[3])) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fl"><span>' + esc(A('المادة', 'Subject')) + '</span><select name="subject">' + subjOptions(f.subject) + '</select></label></div>' +
      '<label class="fl"><span>' + esc(A('المؤلف أو المصدر', 'Author or source')) + '</span><input name="author" maxlength="120" value="' + esc(f.author || '') + '"></label><label class="fl"><span>' + esc(A('وصف قصير', 'Short description')) + '</span><textarea name="about" rows="2" maxlength="600">' + esc(f.about || '') + '</textarea></label>' +
      '<label class="fl file"><span>' + esc(A('الملف (PDF أو صورة، حتى 50 MB)', 'File (PDF or picture, up to 50 MB)')) + (f.id ? '' : ' *') + '</span><input type="file" name="file" accept="application/pdf,image/*"' + (f.id ? '' : ' required') + '></label>' +
      '<label class="fl file"><span>' + esc(A('صورة الغلاف (اختياري)', 'Cover picture (optional)')) + '</span><input type="file" name="cover" accept="image/*"></label>';
  }
  IS.fileFields = fileFields;
  IS.saveFile = async function (d, f, extra) {
    var file = f.file.files[0], cover = f.cover.files[0], row = { title: d.title, kind: d.kind, subject: d.subject, cat: (IS.subj(d.subject) || {}).cat || '', spec: (IS.subj(d.subject) || {}).spec || 'medicine', author: d.author || '', about: d.about || '' };
    if (file) { if (file.size > 50 * 1048576) throw new Error(A('الملف أكبر من 50 MB', 'File larger than 50 MB')); row.path = await DB.upload('library', /^image\//.test(file.type) ? await IS.shrink(file, 2000, 0.85) : file); row.mime = file.type; row.size = file.size; if (/pdf/.test(file.type)) row.pages = await pdfPages(file).catch(function () { return 0; }); }
    if (cover) row.cover = await DB.upload('media', await IS.shrink(cover, 600, 0.82));
    Object.assign(row, extra || {}); return row;
  };
  IS.SUB.sharefile = async function (d, f) { var row = await IS.saveFile(d, f, { owner_id: IS.ME.id, owner_name: IS.ME.name, status: IS.can('library') ? 'published' : 'pending' }); await DB.ins('files', row); IS.closeSheet(); IS.toast(row.status === 'published' ? A('نُشر الملف', 'File published') : A('شكرًا! سيُنشر بعد المراجعة.', 'Thank you! It will be published after review.')); IS.refresh(); };

  /* ---------- viewer: inside the app only ---------- */
  var PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  function pdfLib() { return window.pdfjsLib ? Promise.resolve(window.pdfjsLib) : new Promise(function (ok, no) { var s = document.createElement('script'); s.src = PDFJS; s.onload = function () { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS.replace('pdf.min.js', 'pdf.worker.min.js'); ok(window.pdfjsLib); }; s.onerror = no; document.head.appendChild(s); }); }
  async function pdfPages(file) { var lib = await pdfLib(), doc = await lib.getDocument({ data: await file.arrayBuffer() }).promise; return doc.numPages; }
  IS.page('file', async function (id) {
    var f = await DB.one('files', id); if (!f) return null; if (f.status !== 'published' && !(IS.ME && (f.owner_id === IS.ME.id || IS.can('library')))) return null;
    var k = kind(f.kind), sj = IS.subj(f.subject);
    var h = '<nav class="crumb"><a href="#library">' + esc(A('مكتبتي', 'My Library')) + '</a>' + ic('chev', 'fl') + '<a href="#library/' + f.kind + '">' + esc(A(k[2], k[3])) + '</a>' + ic('chev', 'fl') + '<span>' + esc(f.title) + '</span></nav>' +
      '<header class="fhead"><div><h1 tabindex="-1">' + esc(f.title) + '</h1><p class="mut">' + [A(k[2], k[3]), spName(fspec(f)), sj ? sj.en : '', f.author, f.pages ? f.pages + ' ' + A('صفحة', 'pages') : ''].filter(Boolean).map(esc).join(' · ') + '</p></div><div class="row">' + IS.favBtn('f:' + id) + (IS.ME && f.status === 'published' ? IS.dlBtn('file', id) : '') + (IS.ME ? '<button class="fav" data-act="addcoll" data-id="' + id + '" aria-label="collection">' + ic('folder') + '</button>' : '') + '</div></header>' +
      (f.about ? '<p>' + esc(f.about) + '</p>' : '') + (IS.ME ? '<div class="viewer" id="viewer" oncontextmenu="return false"><div class="loading"><span class="spin"></span></div></div>' : '<div class="gate">' + ic('lock') + '<p>' + esc(A('سجّل الدخول لعرض الملف.', 'Sign in to view the file.')) + '</p><button class="btn pri" data-act="login">' + esc(A('دخول', 'Sign in')) + '</button></div>');
    IS.after = async function () {
      var v = $('#viewer'); if (!v) return; var url = await DB.fileUrl('library', f.path); if (!url) { v.innerHTML = IS.empty('file', A('الملف غير متاح', 'File not available')); return; }
      if (/^image\//.test(f.mime || '')) { v.innerHTML = '<img src="' + esc(url) + '" alt="" draggable="false">'; return; }
      try { var lib = await pdfLib(), doc = await lib.getDocument({ url: url }).promise; v.innerHTML = '<p class="mut center">' + N(doc.numPages) + ' ' + esc(A('صفحة', 'pages')) + '</p>';
        var W = Math.min(v.clientWidth - 8, 980), shown = 0;
        var more = async function () { var to = Math.min(doc.numPages, shown + 6); for (var i = shown + 1; i <= to; i++) { var pg = await doc.getPage(i), vp0 = pg.getViewport({ scale: 1 }), sc = W / vp0.width * (window.devicePixelRatio || 1), vp = pg.getViewport({ scale: sc }), cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height; cv.style.width = W + 'px'; v.appendChild(cv); await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise; } shown = to;
          var old = v.querySelector('.morepg'); if (old) old.remove(); if (shown < doc.numPages) { var b = document.createElement('button'); b.className = 'btn ghost wide morepg'; b.textContent = A('عرض الصفحات التالية', 'Show the next pages') + ' (' + shown + ' / ' + doc.numPages + ')'; b.onclick = more; v.appendChild(b); } };
        await more();
      } catch (e) { v.innerHTML = IS.empty('file', A('تعذّر عرض الملف', 'The file could not be shown'), A('تحقق من الاتصال.', 'Check the connection.')); }
    };
    return h;
  });
})();
