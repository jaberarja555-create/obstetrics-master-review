/* اشرح لي: the student side. Every list comes from the database (published courses, active lecturers, real counts). */
(function () {
  'use strict';
  var A = IS.A, esc = IS.esc, ic = IS.ic, N = IS.N, $ = IS.$;
  function me() { return IS.ME; }
  function uid() { return IS.ME && IS.ME.id; }
  /* ---------- data helpers ---------- */
  IS.pubCourses = function () { return DB.q('courses', { eq: { status: 'published' }, order: ['published_at', false] }); };
  IS.lecMap = async function () { var l = await DB.q('lecturers'); var m = {}; l.forEach(function (x) { m[x.id] = x; }); return m; };
  IS.myEnroll = async function () { if (!uid()) return {}; var e = await DB.q('enrollments', { eq: { user_id: uid() } }); var m = {}; e.forEach(function (x) { if (!m[x.course_id] || x.status === 'active') m[x.course_id] = x; }); return m; };
  IS.courseLessons = async function (cid) { var r = await Promise.all([DB.q('sections', { eq: { course_id: cid }, order: ['sort'] }), DB.q('lessons', { eq: { course_id: cid }, order: ['sort'] })]);
    return r[0].map(function (s) { s.lessons = r[1].filter(function (l) { return l.section_id === s.id; }); return s; }); };
  IS.myProgress = async function (cid) { if (!uid()) return {}; var p = await DB.q('progress', { eq: { user_id: uid(), course_id: cid } }); var m = {}; p.forEach(function (x) { m[x.lesson_id] = x; }); return m; };
  /* counts kept on the course row (in the database by triggers; in the preview here) */
  IS.recount = async function (cid) {
    if (DB.live) return; var r = await Promise.all([DB.q('lessons', { eq: { course_id: cid } }), DB.q('enrollments', { eq: { course_id: cid, status: 'active' } }), DB.q('reviews', { eq: { course_id: cid } })]);
    var mins = r[0].reduce(function (a, l) { return a + (+l.minutes || 0); }, 0), rv = r[2], avg = rv.length ? rv.reduce(function (a, x) { return a + (+x.stars || 0); }, 0) / rv.length : 0;
    await DB.upd('courses', cid, { n_lessons: r[0].length, minutes: mins, n_students: r[1].length, rating: Math.round(avg * 10) / 10, n_reviews: rv.length }).catch(function () {});
  };
  function favs() { return IS.LS.get('fav-' + (uid() || 'x'), {}); }
  function isFav(k) { return !!favs()[k]; }
  IS.favBtn = function (k, sm) { return '<button type="button" class="fav' + (sm ? ' sm' : '') + '" data-act="fav" data-k="' + esc(k) + '" aria-pressed="' + isFav(k) + '" aria-label="' + esc(A('المفضلة', 'Favourite')) + '">' + ic('heart') + '</button>'; };
  IS.ACT.fav = function (b) { if (!me()) return IS.ACT.login(); var f = favs(), k = b.getAttribute('data-k'); if (f[k]) delete f[k]; else f[k] = Date.now(); IS.LS.set('fav-' + uid(), f);
    IS.$$('[data-act=fav][data-k="' + k + '"]').forEach(function (x) { x.setAttribute('aria-pressed', !!f[k]); }); IS.toast(f[k] ? A('أضيف إلى المفضلة', 'Added to favourites') : A('أزيل من المفضلة', 'Removed')); };
  function hrs(m) { m = +m || 0; return m >= 60 ? N(Math.round(m / 6) / 10) + ' ' + A('ساعة', 'h') : N(m) + ' ' + A('دقيقة', 'min'); }
  function price(c) { return +c.price ? IS.money(c.price) : '<b class="free">' + esc(A('مجاني', 'Free')) + '</b>'; }
  function lecName(l) { return l ? l.name : ''; }

  /* ---------- course card ---------- */
  IS.courseCard = function (c, L, E) {
    var l = L && L[c.lecturer_id], e = E && E[c.id], cat = IS.cat(c.cat), sj = IS.subj(c.subject);
    return '<article class="ccard" style="--cc:' + esc(c.color || 'var(--pri)') + '"><a class="ccimg" href="#course/' + c.id + '">' + (c.cover ? '<img src="' + IS.U(c.cover) + '" alt="" loading="lazy">' : '<span class="ph">' + ic(sj ? sj.icon : 'layers') + '</span>') +
      '<span class="cctop">' + (cat ? IS.chip(esc(cat.en), 'lt') : '') + (c.n_students >= 50 ? IS.chip(ic('flame') + esc(A('الأكثر تسجيلًا', 'Popular')), 'hot') : '') + '</span></a>' + IS.favBtn('c:' + c.id, true) +
      '<div class="ccb"><h3><a href="#course/' + c.id + '">' + esc(c.title) + '</a></h3><p>' + esc(c.subtitle || '') + '</p>' +
      (l ? '<a class="cclec" href="#lecturer/' + l.id + '">' + IS.av(l, 'xs') + '<span>' + esc(l.name) + '</span></a>' : '') +
      '<div class="ccst">' + (c.n_reviews ? '<span>' + ic('star', 'gold') + N(c.rating) + ' <small>(' + N(c.n_reviews) + ')</small></span>' : '') + '<span>' + ic('video') + N(c.n_lessons || 0) + ' ' + esc(A('درس', 'lessons')) + '</span>' +
      (c.minutes ? '<span>' + ic('clock') + hrs(c.minutes) + '</span>' : '') + (c.n_students ? '<span>' + ic('users') + N(c.n_students) + '</span>' : '') + '</div>' +
      '<div class="ccf"><span class="price">' + price(c) + '</span>' + (e && e.status === 'active' ? '<a class="btn sm pri" href="#course/' + c.id + '">' + ic('play') + esc(A('تابع', 'Continue')) + '</a>' : e && e.status === 'pending' ? IS.status('pending') : '<a class="btn sm pri" href="#course/' + c.id + '">' + esc(A('التحق بالكورس', 'Enrol')) + '</a>') + '</div></div></article>';
  };
  function lecCard(l, n) {
    return '<article class="lcard" style="--cc:' + esc(l.color || 'var(--pri)') + '">' + IS.favBtn('t:' + l.id, true) + '<a href="#lecturer/' + l.id + '" class="lcav">' + IS.av(l, 'lg') + '</a><h3><a href="#lecturer/' + l.id + '">' + esc(l.name) + '</a> ' + ic('checkc', 'verified') + '</h3>' +
      '<p>' + esc(l.title || l.specialty || '') + '</p><div class="tags">' + (l.tags || []).slice(0, 3).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' +
      '<div class="lcst"><span>' + ic('layers') + N(n || 0) + ' ' + esc(A('كورس', 'courses')) + '</span>' + (l.n_students ? '<span>' + ic('users') + N(l.n_students) + '</span>' : '') + '</div>' +
      '<div class="row"><a class="btn sm pri" href="#lecturer/' + l.id + '">' + esc(A('عرض الملف', 'View profile')) + '</a></div></article>';
  }

  /* ========== HOME (navy and gold design, owner 18 Nov 2026) ========== */
  function specCard(s, cs) {
    var n = cs.filter(function (c) { return (c.spec || 'medicine') === s.id; }).length, ns = IS.SUBJ.filter(function (x) { return x.spec === s.id; }).length;
    return '<a class="spc" href="#spec/' + s.id + '"><span class="spi">' + (s.img ? '<img src="' + IS.U(s.img) + '" alt="" loading="lazy">' : '') + '</span><span class="spt"><span class="sph"><i>' + ic(s.icon) + '</i><span><b lang="en">' + esc(s.en) + '</b>' + (IS.lang === 'en' ? '' : '<small>' + esc(s.ar) + '</small>') + '</span></span>' +
      '<p>' + esc(A(s.about_ar, s.about_en)) + '</p><span class="spn">' + ic('layers') + N(n) + ' ' + esc(A('كورس', 'courses')) + ' · ' + N(ns) + ' ' + esc(A('مادة', 'subjects')) + '</span><em class="btn gline">' + esc(A('استكشف التخصص', 'Explore')) + ic('chev', 'fl') + '</em></span></a>';
  }
  IS.specCard = specCard;
  var SECIMG = { basics: 'img/sec_basics.webp', clinical: 'img/sec_clinical.webp', special: 'img/sec_special.webp', house: 'img/sec_house.webp' };
  var FEATS = [['layers', 'محتوى متكامل', 'Complete content', 'لكل التخصصات الصحية', 'For every health speciality'], ['play', 'كورسات وندوات', 'Courses & seminars', 'شرح ومراجعات متخصصة', 'Lessons and focused reviews'],
    ['open', 'مكتبة رقمية', 'Digital library', 'كتب ومراجع وملخصات', 'Books, references and summaries'], ['group', 'مجتمع طلابي', 'Student community', 'تواصل وتبادل الخبرات', 'Connect and share experience'], ['help', 'خدمات أكاديمية', 'Academic services', 'دعم وإرشاد ومساعدة بحثية', 'Support, guidance and research help']];
  function feats() { return '<section class="feats">' + FEATS.map(function (f) { return '<div class="feat">' + ic(f[0]) + '<b>' + IS.T(f[1], f[2]) + '</b><small>' + esc(A(f[3], f[4])) + '</small></div>'; }).join('') + '</section>'; }
  IS.feats = feats;
  var STEPS = [['user', 'أنشئ حسابك', 'Create your account', 'بحساب Google أو برقم هاتفك خلال دقيقة.', 'With Google or your phone number in a minute.'],
    ['grid', 'اختر تخصصك وكورسك', 'Choose your speciality and course', 'تصفّح الكورسات حسب التخصص والمادة والمحاضر.', 'Browse by speciality, subject and lecturer.'],
    ['receipt', 'ادفع عبر بنكك', 'Pay with Bankak', 'حوّل المبلغ وارفع صورة الإيصال؛ يفتح الكورس بعد المراجعة.', 'Transfer, upload the receipt; the course opens after review.'],
    ['cert', 'تعلّم واحصل على شهادتك', 'Learn and earn your certificate', 'دروس، اختبارات، ملاحظات، ثم شهادة إتمام.', 'Lessons, quizzes and notes, then a certificate.']];
  function steps() { return '<section class="hiw"><header><h2>' + IS.T('كيف تبدأ', 'How it works') + '</h2><p>' + esc(A('أربع خطوات بسيطة تفصلك عن أول كورس.', 'Four simple steps to your first course.')) + '</p></header><ol>' + STEPS.map(function (s, i) {
    return '<li><span class="hn">' + ic(s[0]) + '<i>' + N(i + 1) + '</i></span><b lang="en">' + esc(s[2]) + '</b>' + (IS.lang === 'en' ? '' : '<small>' + esc(s[1]) + '</small>') + '<p>' + esc(A(s[3], s[4])) + '</p></li>'; }).join('') + '</ol></section>'; }
  /* Home fits one screen (owner, 18 Nov 2026: "if we can make the home page not scrolling is better … clickable buttons as much as we can"):
     a slim welcome band with search, the five specialities as picture buttons, and buttons for every other place. Featured courses,
     How it works, events, figures, community and teaching now live on their own pages (Courses, About, Events, Community, Lecturers). */
  var QUICK = [['courses', 'layers', 'الكورسات', 'Courses'], ['learning', 'bookmark', 'تعلّمي', 'My learning'], ['events', 'cal', 'الفعاليات', 'Events'], ['lecturers', 'users', 'المحاضرون', 'Lecturers'],
    ['community', 'group', 'المجتمع', 'Community'], ['library', 'open', 'مكتبتي', 'My Library'], ['paths', 'route', 'المسارات', 'Paths'], ['studio-apply', 'studio', 'علّم معنا', 'Teach']];
  IS.page('home', async function () {
    var cs = await IS.pubCourses(), m = me();
    var who = m ? esc(A('مرحبًا د. ', 'Welcome, Dr. ')) + '<bdi>' + esc(String(m.name || '').replace(/^\s*(د\.|دكتور|Dr\.?)\s*/i, '').split(' ')[0]) + '</bdi> 👋' : esc(A('مرحبًا بك يا دكتور 👋', 'Welcome, Doctor 👋'));
    var h = '<div class="lh">' +
      '<section class="lhh"><img class="lhl" src="' + IS.logo('hero') + '" alt=""><img class="lhl2" src="' + IS.logo() + '" alt=""><div class="lht"><p>' + who + '</p><h1 tabindex="-1"><span>' + esc(A('منصة', 'Platform')) + '</span> <span class="gtx">اشرح لي</span></h1>' +
      '<small>' + esc(A('منصة تعليمية متكاملة لطلاب الكليات الصحية', 'A complete learning platform for health sciences students')) + '</small></div>' +
      '<div class="lhx"><form class="hsearch" role="search" data-form="search"><span>' + ic('search') + '</span><input name="q" type="search" placeholder="' + esc(A('ابحث عن كورس، مادة، محاضر أو موضوع…', 'Search a course, subject, lecturer or topic…')) + '"><button class="btn pri">' + esc(A('بحث', 'Search')) + '</button></form>' +
      (m ? '' : '<div class="row"><button class="btn pri sm" data-act="register">' + ic('user') + esc(A('أنشئ حسابك مجانًا', 'Create your free account')) + '</button><button class="btn lt sm" data-act="login">' + esc(A('تسجيل الدخول', 'Sign in')) + '</button></div>') + '</div></section>' +
      '<section class="lhs" aria-label="' + esc(A('التخصصات', 'Specialities')) + '">' + IS.SPECS.map(function (s) {
        var n = cs.filter(function (c) { return (c.spec || 'medicine') === s.id; }).length, ns = IS.SUBJ.filter(function (x) { return x.spec === s.id; }).length;
        return '<a class="lsp" href="#spec/' + s.id + '"><span class="lsi">' + (s.img ? '<img src="' + IS.U(s.img) + '" alt="" loading="lazy">' : '') + '<i>' + ic(s.icon) + '</i></span><span class="lst"><b lang="en">' + esc(s.en) + '</b>' + (IS.lang === 'en' ? '' : '<small>' + esc(s.ar) + '</small>') +
          '<p>' + esc(A(s.about_ar, s.about_en)) + '</p><em>' + N(ns) + ' ' + esc(A('مادة', 'subjects')) + (n ? ' · ' + N(n) + ' ' + esc(A('كورس', 'courses')) : '') + '</em></span>' + ic('chev', 'fl go') + '</a>'; }).join('') + '</section>' +
      '<nav class="lhq" aria-label="' + esc(A('الأقسام', 'Places')) + '">' + QUICK.map(function (q) { return '<a href="#' + q[0] + '"><i>' + ic(q[1]) + '</i>' + IS.navLbl(q[2], q[3]) + '</a>'; }).join('') + '</nav></div>';
    return h;
  });

  /* sections (Basics, Clinical, International Exams, House Officer): on the Specialities page, not on Home (owner, 18 Nov 2026: "clean Home") */
  function sections(cs) {
    return '<section class="sec"><header class="sh"><h2>' + ic('layers') + IS.T('الأقسام', 'Browse by section') + '</h2><a class="more" href="#courses">' + esc(A('كل الكورسات', 'All courses')) + ic('chev', 'fl') + '</a></header><div class="doors">' + IS.CATS.map(function (c) { var n = cs.filter(function (x) { return x.cat === c.id; }).length;
      return '<a class="door t-' + c.tone + (SECIMG[c.id] ? ' pic' : '') + '" href="#courses/' + c.id + '">' + (SECIMG[c.id] ? '<span class="dimg"><img src="' + SECIMG[c.id] + '" alt="" loading="lazy"></span>' : '') + '<span class="di">' + ic(c.icon) + '</span><b lang="en">' + esc(c.en) + '</b>' + (IS.lang === 'en' ? '' : '<small>' + esc(c.ar) + '</small>') + '<em>' + (n ? N(n) + ' ' + esc(A('كورس', 'courses')) : esc(A('قريبًا', 'Coming soon'))) + '</em>' + ic('chev', 'fl go') + '</a>'; }).join('') + '</div></section>';
  }
  /* ========== SPECIALITIES ========== */
  IS.page('specialties', async function () {
    var cs = await IS.pubCourses();
    return IS.banner(IS.T('التخصصات', 'Specialities'), esc(A('اختر تخصصك لتجد مواده وكورساته ومحاضريه في مكان واحد.', 'Choose your speciality to find its subjects, courses and lecturers in one place.')), 'grid', '', 'gold') +
      '<div class="spcs big">' + IS.SPECS.map(function (s) { return specCard(s, cs); }).join('') + '</div>' + sections(cs);
  });
  IS.page('spec', async function (id) {
    var s = IS.spec(id); if (!s) return '';
    var r = await Promise.all([IS.pubCourses(), IS.lecMap(), IS.myEnroll()]), cs = r[0].filter(function (c) { return (c.spec || 'medicine') === s.id; }), L = r[1], E = r[2];
    var lids = {}; cs.forEach(function (c) { lids[c.lecturer_id] = 1; }); var sub = IS.SUBJ.filter(function (x) { return x.spec === s.id; });
    var h = '<section class="ban gold spb"' + (s.img ? ' style="--spimg:url(' + IS.U(s.img) + ')"' : '') + '><div class="bt"><span class="bi">' + ic(s.icon) + '</span><div><p class="crumbw"><a href="#specialties">' + esc(A('التخصصات', 'Specialities')) + '</a></p><h1 tabindex="-1">' + IS.T(s.ar, s.en) + '</h1><p>' + esc(A(s.about_ar, s.about_en)) + '</p></div></div>' +
      '<div class="bnums">' + [[cs.length, A('كورس', 'courses')], [sub.length, A('مادة', 'subjects')], [Object.keys(lids).length, A('محاضر', 'lecturers')]].map(function (x) { return '<span><b>' + N(x[0]) + '</b><small>' + esc(x[1]) + '</small></span>'; }).join('') + '</div></section>';
    /* sections pack side by side, each as wide as its number of cards, so a section of two cards never sits alone in an empty row
       (owner, 18 Nov 2026: "bad empty spaces"); --c7 / --c5 = columns that give even rows at 7 / 5 cards a row */
    function evenCols(n, m) { var r = Math.ceil(n / m); return Math.ceil(n / r); }
    h += '<div class="sjgrid">';
    IS.CATS.forEach(function (c) { var ss = sub.filter(function (x) { return x.cat === c.id; }); if (!ss.length) return;
      var n = ss.length, wide = c.id === 'house';
      h += '<section class="sec sjsec' + (wide ? ' sjfull' : '') + '" style="--n:' + n + ';--c7:' + evenCols(n, 7) + ';--c5:' + evenCols(n, 5) + ';--c3:' + evenCols(n, 3) + '"><header class="sh"><h2>' + ic(c.icon) + IS.T(c.ar, c.en) + '</h2></header><div class="subjs' + (wide ? ' wide' : c.id === 'special' ? ' small' : '') + '">' + ss.map(function (x, i) { var n = cs.filter(function (k) { return k.subject === x.id; }).length;
        return '<a class="subj s' + (i % 7) + (x.img ? ' pic' : '') + '" href="#courses/' + c.id + '/' + x.id + '">' + (x.img ? '<span class="sjp"><img src="' + IS.U(x.img) + '" alt="" loading="lazy"></span>' : '<span>' + ic(x.icon) + '</span>') + '<span class="sjt">' + '<b lang="en">' + esc(x.en) + '</b>' + (IS.lang === 'en' ? '' : '<small>' + esc(x.ar) + '</small>') + '<em>' + (n ? N(n) + ' ' + esc(A('كورس', 'courses')) : esc(A('قريبًا', 'Soon'))) + '</em></span></a>'; }).join('') + '</div></section>'; });
    h += '</div>';
    h += '<section class="sec"><header class="sh"><h2>' + ic('layers') + IS.T('كورسات التخصص', 'Courses in this speciality') + '</h2><a class="more" href="#courses/@' + s.id + '">' + esc(A('كل الكورسات', 'All courses')) + ic('chev', 'fl') + '</a></header>' +
      (cs.length ? '<div class="grid g3">' + cs.slice(0, 9).map(function (c) { return IS.courseCard(c, L, E); }).join('') + '</div>' :
        '<div class="soon">' + ic('layers') + '<div><b>' + esc(A('لا توجد كورسات منشورة في هذا التخصص بعد', 'No published courses in this speciality yet')) + '</b><span>' + esc(A('اطلب الكورس الذي تحتاجه وسيصل طلبك إلى الفريق الأكاديمي، أو قدّم كورسك إن كنت محاضرًا.', 'Request the course you need and it reaches the academic team, or offer your course if you are a lecturer.')) + '</span></div><div class="row"><button class="btn ghost" data-act="ticket" data-k="course">' + ic('plus') + esc(A('اطلب كورسًا', 'Request a course')) + '</button><a class="btn pri" href="#studio-apply">' + ic('studio') + esc(A('قدّم كورسك', 'Offer a course')) + '</a></div></div>') + '</section>';
    return h;
  });

  /* ========== SETTINGS ========== */
  IS.page('settings', async function () {
    var th = IS.LS.get('theme', 'light'), fs = IS.LS.get('fs', 'n') === 'x' ? 'l' : IS.LS.get('fs', 'n'), m = me();
    function opt(act, v, cur, icon, ar, en, sub) { return '<button type="button" class="sopt' + (v === cur ? ' on' : '') + '" data-act="' + act + '" data-v="' + v + '" aria-pressed="' + (v === cur) + '">' + ic(icon) + '<b>' + esc(A(ar, en)) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</button>'; }
    function link(href, icon, ar, en, sub) { return '<a class="li" href="' + href + '">' + ic(icon) + '<span><b>' + esc(A(ar, en)) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span>' + ic('chev', 'fl') + '</a>'; }
    return IS.banner(IS.T('الإعدادات', 'Settings'), esc(A('اللغة والمظهر وحسابك في مكان واحد.', 'Language, appearance and your account in one place.')), 'gear', '', 'gold') +
      '<div class="setg"><div class="setc"><section class="box"><h2>' + ic('globe') + IS.T('اللغة', 'Language') + '</h2><div class="sopts">' + opt('setlang', 'ar', IS.lang, 'globe', 'العربية', 'العربية', 'Arabic') + opt('setlang', 'en', IS.lang, 'globe', 'English', 'English', 'الإنجليزية') + '</div>' +
      '<p class="mut">' + esc(A('العناوين الرئيسية تظهر بالإنجليزية وتحتها العربية.', 'Main titles show in English with Arabic under them in Arabic mode.')) + '</p></section>' +
      '<section class="box"><h2>' + ic('sun') + IS.T('المظهر', 'Appearance') + '</h2><div class="sopts">' + opt('settheme', 'light', th, 'sun', 'نهاري', 'Light') + opt('settheme', 'dark', th, 'moon', 'ليلي', 'Dark') + opt('settheme', 'eye', th, 'eye', 'راحة العين', 'Eye comfort', A('ألوان دافئة تخفف الضوء الأزرق', 'Warm colours, less blue light')) + opt('settheme', 'auto', th, 'gear', 'تلقائي', 'Automatic', A('حسب إعدادات الجهاز', 'Follows the device')) + '</div>' +
      '<h3 class="sub">' + esc(A('لون التطبيق', 'App colour')) + '</h3><div class="pals" role="radiogroup">' + IS.PALS.map(function (p) { var on = p[0] === IS.LS.get('pal', 'blue');
        return '<button type="button" class="pal' + (on ? ' on' : '') + '" role="radio" aria-checked="' + on + '" data-act="setpal" data-v="' + p[0] + '" style="--pc:' + p[1] + '"><i></i><span>' + esc(A(p[2], p[3])) + '</span></button>'; }).join('') + '</div>' +
      '<h3 class="sub">' + esc(A('حجم النص', 'Text size')) + '</h3><div class="sopts">' + opt('setfs', 's', fs, 'h2', 'صغير', 'Small') + opt('setfs', 'n', fs, 'h2', 'عادي', 'Normal') + opt('setfs', 'l', fs, 'h2', 'كبير', 'Large') + '</div></section>' +
      '</div><div class="setc"><section class="box"><h2>' + ic('user') + IS.T('الحساب', 'Account') + '</h2>' + (m ? '<div class="list">' + link('#account', 'user', 'الملف الشخصي', 'Profile', m.name) + link('#security', 'shield', 'الأمان والتحقق بخطوتين', 'Security and two-step login') + link('#notifications', 'bell', 'الإشعارات', 'Notifications') + link('#favorites', 'heart', 'المفضلة', 'Favourites') + '</div><button class="btn ghost bad wide" data-act="logout">' + ic('logout') + esc(A('تسجيل الخروج', 'Sign out')) + '</button>' :
        '<p class="mut">' + esc(A('سجّل الدخول لإدارة ملفك وأمانك وإشعاراتك.', 'Sign in to manage your profile, security and notifications.')) + '</p><div class="row"><button class="btn pri" data-act="login">' + esc(A('تسجيل الدخول', 'Sign in')) + '</button><button class="btn ghost" data-act="register">' + esc(A('حساب جديد', 'Create account')) + '</button></div>') + '</section>' +
      '<section class="box"><h2>' + ic('help') + IS.T('المساعدة', 'Help') + '</h2><div class="list">' + link('#support', 'chat', 'الدعم والرسائل', 'Support and messages') + link('#about', 'info', 'عن المنصة', 'About the platform') + link('#terms', 'file', 'الشروط والخصوصية', 'Terms and privacy') + '</div><p class="mut ver">اشرح لي · ' + esc(A('الإصدار', 'Version')) + ' 1.1</p></section></div></div>';
  }, { area: 'keep' });
  IS.ACT.setlang = function (b) { var v = b.getAttribute('data-v'); if (v === IS.lang) return; IS.ACT.lang(); };
  IS.ACT.settheme = function (b) { IS.setTheme(b.getAttribute('data-v')); IS.refresh(); };
  IS.ACT.setpal = function (b) { IS.setPal(b.getAttribute('data-v')); IS.refresh(); };
  IS.ACT.setfs = function (b) { IS.LS.set('fs', b.getAttribute('data-v')); IS.applyTheme(); IS.refresh(); };

  function statsBox(cs, lecs) {
    var t = { l: 0 }; cs.forEach(function (c) { t.l += +c.n_lessons || 0; });
    var st = cs.reduce(function (a, c) { return a + (+c.n_students || 0); }, 0);
    return '<section class="box nums"><h2>' + ic('chart') + IS.T('المنصة اليوم', 'The platform today') + '</h2><div>' +
      [['layers', cs.length, A('كورس منشور', 'courses')], ['users', lecs.length, A('محاضر', 'lecturers')], ['video', t.l, A('درس', 'lessons')], ['group', st, A('طالب ملتحق', 'enrolments')]].map(function (r) { return '<span>' + ic(r[0]) + '<b>' + N(r[1]) + '</b><small>' + esc(r[2]) + '</small></span>'; }).join('') + '</div></section>';
  }
  function evRow(e) {
    var d = new Date(e.starts);
    return '<a class="ev" href="#event/' + e.id + '"><span class="evd"><b>' + N(d.getDate()) + '</b><small>' + esc(IS.date(e.starts, { month: 'short' })) + '</small></span><span class="evt"><b>' + esc(e.title) + '</b><small>' + ic(e.kind === 'live' ? 'live' : 'cal') +
      esc(IS.date(e.starts, { weekday: 'long', hour: '2-digit', minute: '2-digit' })) + '</small></span>' + ic('chev', 'fl') + '</a>';
  }
  function eventsBox(ev) {
    return '<section class="box"><header class="sh"><h2>' + ic('cal') + IS.T('الفعاليات القادمة', 'Upcoming events') + '</h2><a class="more" href="#events">' + esc(A('الكل', 'All')) + '</a></header>' +
      (ev.length ? ev.map(evRow).join('') : '<p class="mut">' + esc(A('لا توجد فعاليات مجدولة الآن.', 'No events are scheduled now.')) + '</p>') + '</section>';
  }

  /* ========== SEARCH ========== */
  IS.page('search', async function (q) {
    q = decodeURIComponent(q || ''); var r = await Promise.all([IS.pubCourses(), DB.q('lecturers', { eq: { status: 'active' } }), IS.lecMap()]);
    var w = IS.norm(q).split(' ').filter(Boolean), hit = function (s) { s = IS.norm(s); return w.every(function (x) { return s.indexOf(x) >= 0; }); };
    var cs = w.length ? r[0].filter(function (c) { var s = IS.subj(c.subject), k = IS.cat(c.cat); return hit([c.title, c.subtitle, c.about, (c.learn || []).join(' '), s && s.ar, s && s.en, k && k.ar, k && k.en, (r[2][c.lecturer_id] || {}).name].join(' ')); }) : [];
    var ls = w.length ? r[1].filter(function (l) { return hit([l.name, l.title, l.specialty, (l.tags || []).join(' ')].join(' ')); }) : [];
    return '<form class="bigsearch" role="search" data-form="search"><span>' + ic('search') + '</span><input name="q" type="search" value="' + esc(q) + '" placeholder="' + esc(A('ابحث…', 'Search…')) + '" autofocus><button class="btn pri">' + esc(A('بحث', 'Search')) + '</button></form>' +
      '<h1 class="ph1" tabindex="-1">' + IS.T('نتائج البحث', 'Search results') + (q ? ': <bdi>' + esc(q) + '</bdi>' : '') + '</h1>' +
      (ls.length ? '<section class="sec"><header class="sh"><h2>' + IS.T('المحاضرون', 'Lecturers') + '</h2></header><div class="grid g4">' + ls.map(function (l) { return lecCard(l, r[0].filter(function (c) { return c.lecturer_id === l.id; }).length); }).join('') + '</div></section>' : '') +
      '<section class="sec"><header class="sh"><h2>' + IS.T('الكورسات', 'Courses') + ' (' + N(cs.length) + ')</h2></header>' + (cs.length ? '<div class="grid g3">' + cs.map(function (c) { return IS.courseCard(c, r[2], {}); }).join('') + '</div>' : IS.empty('search', w.length ? A('لا توجد نتائج', 'No results') : A('اكتب ما تبحث عنه', 'Type what you are looking for'), w.length ? A('جرّب كلمة أخرى.', 'Try another word.') : '')) + '</section>';
  });

  /* ========== COURSES CATALOGUE ========== */
  var F = { spec: '', cat: '', sub: {}, lec: {}, price: 'all', sort: 'new', view: IS.LS.get('cview', 'grid'), q: '' };
  IS.page('courses', async function (arg) {
    var p = String(arg || '').split('/'); if (p[0] && p[0][0] === '@') { F.spec = p.shift().slice(1); } else if (!p[0]) F.spec = F.spec || ''; F.cat = p[0] || ''; F.sub = {}; if (p[1]) { F.sub[p[1]] = true; var sj0 = IS.subj(p[1]); if (sj0) F.spec = sj0.spec; }
    var r = await Promise.all([IS.pubCourses(), IS.lecMap(), IS.myEnroll()]); var cs = r[0], L = r[1], E = r[2], k = IS.cat(F.cat);
    var h = IS.banner(k ? IS.T(k.ar, k.en) : IS.T('الكورسات', 'Courses'), esc(A('كورسات متكاملة لطلاب الكليات الصحية، مرتبة حسب التخصص والقسم والمادة.', 'Courses for health sciences students, arranged by speciality, section and subject.')), k ? k.icon : 'layers', '', 'gold');
    h += '<section class="specbar">' + [{ id: '', en: 'All specialities', ar: 'كل التخصصات', icon: 'grid' }].concat(IS.SPECS).map(function (x) { return '<button type="button" class="spb2' + (x.id === F.spec ? ' on' : '') + '" data-act="fspec" data-v="' + x.id + '">' + ic(x.icon) + '<span><b lang="en">' + esc(x.en) + '</b>' + (IS.lang === 'en' ? '' : '<small>' + esc(x.ar) + '</small>') + '</span></button>'; }).join('') + '</section>';
    h += '<section class="catbar">' + IS.CATS.map(function (c) { return '<a class="catb t-' + c.tone + (c.id === F.cat ? ' on' : '') + '" href="#courses' + (c.id === F.cat ? '' : '/' + c.id) + '">' + ic(c.icon) + '<span><b lang="en">' + esc(c.en) + '</b><small>' + esc(c.ar) + '</small></span></a>'; }).join('') + '</section>';
    var lecIds = Object.keys(L).filter(function (id) { return cs.some(function (c) { return c.lecturer_id === id; }); });
    h += '<div class="cols rev"><aside class="filt" id="filt"><header><h2>' + ic('filter') + IS.T('تصفية النتائج', 'Filter') + '</h2><button type="button" class="link" data-act="fclear">' + esc(A('مسح الكل', 'Clear')) + '</button></header>' +
      fg(IS.T('المادة', 'Subject'), IS.SUBJ.filter(function (s) { return (!F.cat || s.cat === F.cat) && (!F.spec || s.spec === F.spec); }).map(function (s) { var n = cs.filter(function (c) { return c.subject === s.id; }).length; return '<label class="opt"><input type="checkbox" data-f="sub" value="' + s.id + '"' + (F.sub[s.id] ? ' checked' : '') + '><span lang="en">' + esc(s.en) + (IS.lang === 'en' ? '' : ' <small>' + esc(s.ar) + '</small>') + '</span><em>' + N(n) + '</em></label>'; }).join('')) +
      (lecIds.length ? fg(IS.T('المحاضر', 'Lecturer'), lecIds.map(function (id) { return '<label class="opt"><input type="checkbox" data-f="lec" value="' + id + '"' + (F.lec[id] ? ' checked' : '') + '>' + IS.av(L[id], 'xs') + '<span>' + esc(L[id].name) + '</span></label>'; }).join('')) : '') +
      fg(IS.T('السعر', 'Price'), [['all', A('الكل', 'All')], ['free', A('مجاني', 'Free')], ['paid', A('مدفوع', 'Paid')]].map(function (o) { return '<label class="opt"><input type="radio" name="fprice" data-f="price" value="' + o[0] + '"' + (F.price === o[0] ? ' checked' : '') + '><span>' + esc(o[1]) + '</span></label>'; }).join('')) +
      '</aside><div class="main"><div class="tool"><label class="field">' + ic('search') + '<input id="cq" type="search" placeholder="' + esc(A('ابحث في الكورسات…', 'Search courses…')) + '" value="' + esc(F.q) + '"></label><button class="btn ghost only-ph" data-act="ftog">' + ic('filter') + esc(A('تصفية', 'Filter')) + '</button>' +
      '<select class="sel" id="csort">' + [['new', A('الأحدث', 'Newest')], ['pop', A('الأكثر تسجيلًا', 'Most enrolled')], ['top', A('الأعلى تقييمًا', 'Top rated')], ['low', A('الأقل سعرًا', 'Lowest price')]].map(function (o) { return '<option value="' + o[0] + '"' + (F.sort === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>' +
      '<span class="seg"><button data-act="cview" data-v="grid" aria-pressed="' + (F.view === 'grid') + '" aria-label="grid">' + ic('grid') + '</button><button data-act="cview" data-v="list" aria-pressed="' + (F.view === 'list') + '" aria-label="list">' + ic('list') + '</button></span></div><div id="cres"></div></div></div>';
    IS.after = function () { var fill = function () { fillCourses(cs, L, E); }; fill();
      /* laptops: the filter is a row of drop-down buttons above the results (owner, 18 Nov 2026: "empty space while you scroll") */
      if (window.innerWidth >= 1180) { var tl = IS.$('.cols.rev .main>.tool'), fl = IS.$('#filt'); if (tl && fl) tl.insertBefore(fl, tl.firstChild); var ds = IS.$$('#filt details.fg'); ds.forEach(function (d) { d.open = false; d.addEventListener('toggle', function () { if (d.open) ds.forEach(function (o) { if (o !== d) o.open = false; }); }); });
        var shut = function (e) { if (!document.getElementById('filt')) { document.removeEventListener('click', shut); return; } if (!e.target.closest('#filt')) ds.forEach(function (d) { d.open = false; }); };
        document.addEventListener('click', shut); }
      $('#cq').oninput = function () { F.q = this.value; fill(); }; $('#csort').onchange = function () { F.sort = this.value; fill(); };
      IS.$$('#filt input').forEach(function (i) { i.onchange = function () { var f = i.getAttribute('data-f'); if (f === 'price') F.price = i.value; else F[f][i.value] = i.checked; fill(); }; });
      IS.ACT.cview = function (b) { F.view = b.getAttribute('data-v'); IS.LS.set('cview', F.view); IS.$$('[data-act=cview]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); fill(); }; };
    return h;
  });
  function fg(t, body) { return '<details class="fg" open><summary>' + t + ic('down') + '</summary><div>' + body + '</div></details>'; }
  function on(o) { return Object.keys(o).filter(function (k) { return o[k]; }); }
  function fillCourses(cs, L, E) {
    var w = IS.norm(F.q).split(' ').filter(Boolean), s = on(F.sub), l = on(F.lec);
    var r = cs.filter(function (c) {
      if (F.spec && (c.spec || 'medicine') !== F.spec) return false; if (F.cat && c.cat !== F.cat) return false; if (s.length && s.indexOf(c.subject) < 0) return false; if (l.length && l.indexOf(c.lecturer_id) < 0) return false;
      if (F.price === 'free' && +c.price) return false; if (F.price === 'paid' && !+c.price) return false;
      if (w.length) { var hay = IS.norm([c.title, c.subtitle, c.about, (L[c.lecturer_id] || {}).name].join(' ')); if (!w.every(function (x) { return hay.indexOf(x) >= 0; })) return false; }
      return true; });
    r.sort(function (a, b) { if (F.sort === 'pop') return (b.n_students || 0) - (a.n_students || 0); if (F.sort === 'top') return (b.rating || 0) - (a.rating || 0); if (F.sort === 'low') return (+a.price || 0) - (+b.price || 0); return String(b.published_at || '').localeCompare(String(a.published_at || '')); });
    $('#cres').innerHTML = '<p class="count">' + esc(A('كل الكورسات', 'All courses')) + ' · ' + N(r.length) + ' ' + esc(A('نتيجة', 'results')) + '</p>' + (r.length ? '<div class="grid ' + (F.view === 'list' ? 'list' : 'g3') + '">' + r.map(function (c) { return IS.courseCard(c, L, E); }).join('') + '</div>' :
      IS.empty('layers', A('لا توجد كورسات هنا بعد', 'No courses here yet'), A('عند نشر كورسات في هذا القسم ستظهر هنا. يمكنك طلب كورس تحتاجه.', 'Courses published in this section will appear here. You can request a course you need.'), '<button class="btn ghost" data-act="ticket" data-k="course">' + ic('plus') + esc(A('اطلب كورسًا', 'Request a course')) + '</button>') + browseSubj());
  }
  IS.ACT.fspec = function (b) { F.spec = b.getAttribute('data-v'); F.sub = {}; IS.refresh(); };
  /* Browse subjects: grouped by speciality (owner, 18 Nov 2026: it showed only Medicine, the first 12 subjects); four of each speciality with
     a link to all of them, or up to 12 of the chosen speciality */
  function browseSubj() {
    var specs = IS.SPECS.filter(function (sp) { return !F.spec || sp.id === F.spec; }), per = F.spec ? 12 : 4;
    var out = specs.map(function (sp) { var all = IS.SUBJ.filter(function (x) { return x.spec === sp.id && (!F.cat || x.cat === F.cat); }); if (!all.length) return '';
      return '<div class="bsh"><span class="bshi">' + ic(sp.icon) + '</span><span class="bsht"><b lang="en">' + esc(sp.en) + '</b>' + (IS.lang === 'en' ? '' : '<small>' + esc(sp.ar) + '</small>') + '</span>' +
        (all.length > per || !F.spec ? '<a class="more" href="#spec/' + sp.id + '">' + esc(A('كل المواد', 'All subjects')) + ' (' + N(all.length) + ')' + ic('chev', 'fl') + '</a>' : '') + '</div>' +
        '<div class="subjs">' + all.slice(0, per).map(function (x, i) { return '<a class="subj s' + (i % 7) + (x.img ? ' pic' : '') + '" href="#courses/' + x.cat + '/' + x.id + '">' + (x.img ? '<span class="sjp"><img src="' + IS.U(x.img) + '" alt="" loading="lazy"></span>' : '<span>' + ic(x.icon) + '</span>') + '<span class="sjt"><b lang="en">' + esc(x.en) + '</b>' + (IS.lang === 'en' ? '' : '<small>' + esc(x.ar) + '</small>') + '<em>' + esc(A('قريبًا', 'Soon')) + '</em></span></a>'; }).join('') + '</div>'; }).join('');
    return out ? '<h3 class="ph2">' + IS.T('تصفّح المواد', 'Browse subjects') + '</h3>' + out : ''; }
  IS.ACT.fclear = function () { F.spec = ''; F.sub = {}; F.lec = {}; F.price = 'all'; F.q = ''; IS.refresh(); };
  IS.ACT.ftog = function () { $('#filt').classList.toggle('show'); };

  /* ========== COURSE PAGE ========== */
  IS.page('course', async function (id) {
    var c = await DB.one('courses', id); if (!c) return null;
    var mine = IS.LEC && c.lecturer_id === IS.LEC.id, staff = IS.can('review');
    if (c.status !== 'published' && !mine && !staff) return null;
    var r = await Promise.all([IS.courseLessons(id), DB.one('lecturers', c.lecturer_id), IS.myEnroll(), IS.myProgress(id), DB.q('reviews', { eq: { course_id: id }, order: ['created_at', false] })]);
    var secs = r[0], l = r[1] || {}, e = r[2][id], P = r[3], rv = r[4], all = []; secs.forEach(function (s) { all = all.concat(s.lessons); });
    var act = (e && e.status === 'active') || mine || staff, done = all.filter(function (x) { return P[x.id]; }).length, pct = all.length ? Math.round(done / all.length * 100) : 0;
    var next = all.filter(function (x) { return !P[x.id]; })[0] || all[0], cat = IS.cat(c.cat), sj = IS.subj(c.subject);
    var h = '<nav class="crumb"><a href="#courses">Courses</a>' + ic('chev', 'fl') + (cat ? '<a href="#courses/' + cat.id + '">' + esc(cat.en) + '</a>' + ic('chev', 'fl') : '') + '<span>' + esc(c.title) + '</span></nav>';
    if (c.status !== 'published') h += '<p class="note warn">' + ic('eye') + esc(A('معاينة: هذا الكورس غير منشور للطلبة بعد', 'Preview: this course is not published to students yet')) + ' · ' + IS.status(c.status) + '</p>';
    h += '<section class="chero" style="--cc:' + esc(c.color || 'var(--pri)') + (c.cover ? ';--ci:url(' + IS.U(c.cover) + ')' : '') + '"><div class="chin"><div class="cht"><span class="tags lt">' + (cat ? '<span>' + esc(cat.en) + '</span>' : '') + (sj ? '<span>' + esc(sj.en) + '</span>' : '') + (c.level ? '<span>' + esc(c.level) + '</span>' : '') + '</span>' +
      '<h1 tabindex="-1">' + esc(c.title) + '</h1><p>' + esc(c.subtitle || '') + '</p><a class="chlec" href="#lecturer/' + l.id + '">' + IS.av(l, 'sm') + '<span><b>' + esc(l.name || '') + '</b><small>' + esc(l.title || '') + '</small></span></a>' +
      '<div class="chst">' + (c.n_reviews ? '<span>' + IS.stars(c.rating) + ' <b>' + N(c.rating) + '</b> (' + N(c.n_reviews) + ')</span>' : '') + (c.n_students ? '<span>' + ic('users') + N(c.n_students) + ' ' + esc(A('طالب', 'students')) + '</span>' : '') +
      '<span>' + ic('video') + N(all.length) + ' ' + esc(A('درس', 'lessons')) + '</span>' + (c.minutes ? '<span>' + ic('clock') + hrs(c.minutes) + '</span>' : '') + '<span>' + ic('clock') + esc(A('آخر تحديث ', 'Updated ')) + esc(IS.date(c.updated_at || c.created_at)) + '</span></div></div>' +
      (c.cover ? '<img class="chimg" src="' + IS.U(c.cover) + '" alt="">' : '') + '</div></section>';
    h += '<div class="cols"><div class="main"><div class="tabs" role="tablist">' + [['about', A('نظرة عامة', 'Overview')], ['cur', A('محتوى الكورس', 'Curriculum')], ['lec', A('المحاضر', 'Lecturer')], ['rev', A('التقييمات', 'Reviews') + (rv.length ? ' (' + rv.length + ')' : '')]].map(function (t, i) {
      return '<button role="tab" data-act="tab" data-t="' + t[0] + '" aria-selected="' + (i === 0) + '">' + esc(t[1]) + '</button>'; }).join('') + '</div>';
    h += '<div class="pane" data-p="about">' + ((c.learn || []).length ? '<section class="box"><h2>' + IS.T('ماذا ستتعلم', 'What you’ll learn') + '</h2><ul class="learn">' + c.learn.map(function (x) { return '<li>' + ic('check') + esc(x) + '</li>'; }).join('') + '</ul></section>' : '') +
      (c.about ? '<section class="box"><h2>' + IS.T('عن الكورس', 'About this course') + '</h2><div class="rich">' + IS.clean(c.about) + '</div></section>' : '') +
      ((c.reqs || []).length ? '<section class="box"><h2>' + IS.T('المتطلبات', 'Requirements') + '</h2><ul class="learn dot">' + c.reqs.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></section>' : '') + '</div>';
    h += '<div class="pane" data-p="cur" hidden>' + curriculum(c, secs, P, null, act) + '</div>';
    h += '<div class="pane" data-p="lec" hidden><section class="box lecbox">' + IS.av(l, 'lg') + '<div><h2><a href="#lecturer/' + l.id + '">' + esc(l.name || '') + '</a></h2><p class="mut">' + esc(l.title || '') + '</p><div class="rich">' + IS.clean(l.bio || '') + '</div><a class="btn ghost sm" href="#lecturer/' + l.id + '">' + esc(A('عرض الملف الكامل', 'Full profile')) + '</a></div></section></div>';
    var canRev = e && e.status === 'active' && !rv.some(function (x) { return x.user_id === uid(); });
    h += '<div class="pane" data-p="rev" hidden>' + (canRev ? '<form class="box form" data-form="review"><input type="hidden" name="course" value="' + id + '"><h2>' + IS.T('قيّم الكورس', 'Rate this course') + '</h2><div class="rate">' + [5, 4, 3, 2, 1].map(function (n) { return '<input type="radio" name="stars" id="st' + n + '" value="' + n + '" required><label for="st' + n + '" aria-label="' + n + '">' + ic('star') + '</label>'; }).join('') + '</div>' +
      '<textarea name="body" rows="3" placeholder="' + esc(A('اكتب رأيك بإيجاز (اختياري)', 'A short comment (optional)')) + '"></textarea><button class="btn pri">' + esc(A('إرسال التقييم', 'Submit review')) + '</button></form>' : '') +
      (rv.length ? rv.map(function (x) { return '<div class="revw">' + IS.av({ name: x.name }, 'sm') + '<div><b>' + esc(x.name || '') + '</b> ' + IS.stars(x.stars) + '<small>' + esc(IS.ago(x.created_at)) + '</small><p>' + esc(x.body || '') + '</p></div><button class="ib" data-act="report" data-kind="review" data-id="' + x.id + '" aria-label="' + esc(A('إبلاغ', 'Report')) + '">' + ic('flag') + '</button></div>'; }).join('') :
        IS.empty('star', A('لا توجد تقييمات بعد', 'No reviews yet'), A('يقيّم الكورس الطلبة الملتحقون به.', 'Enrolled students rate the course.'))) + '</div>';
    h += '</div><aside class="aside"><section class="box buy">' + (c.promo ? '' : '') + '<div class="bp">' + price(c) + '</div>' +
      (act ? (all.length ? '<a class="btn pri wide" href="#lesson/' + id + '/' + next.id + '">' + ic('play') + esc(done ? A('تابع التعلّم', 'Continue learning') : A('ابدأ الكورس', 'Start the course')) + '</a>' : '') + (e && e.status === 'active' ? '<div class="prog">' + IS.bar(pct) + '<em>' + N(pct + '%') + '</em></div>' : '') :
        e && e.status === 'pending' ? '<div class="note warn">' + ic('clock') + '<span>' + esc(A('طلب التحاقك قيد المراجعة. سيُفتح الكورس تلقائيًا عند تأكيد الدفع.', 'Your enrolment is being reviewed. The course opens by itself once the payment is confirmed.')) + '</span></div>' :
        (e && e.status === 'rejected' ? '<div class="note bad">' + ic('x') + '<span>' + esc(A('رُفض طلبك السابق', 'Your previous request was rejected')) + (e.note ? ': ' + esc(e.note) : '') + '</span></div>' : '') + '<button class="btn pri wide" data-act="enrol" data-id="' + id + '">' + ic('wallet') + esc(+c.price ? A('التحق بالكورس', 'Enrol in the course') : A('التحق مجانًا', 'Enrol for free')) + '</button>') +
      '<div class="row">' + IS.favBtn('c:' + id) + '<button class="fav" data-act="share" data-h="course/' + id + '" aria-label="share">' + ic('share') + '</button></div>' +
      '<h3 class="sub">' + esc(A('يتضمن هذا الكورس', 'This course includes')) + '</h3><ul class="inc"><li>' + ic('video') + N(all.filter(function (x) { return x.kind === 'video'; }).length) + ' ' + esc(A('درس فيديو', 'video lessons')) + '</li>' +
      '<li>' + ic('file') + N(all.filter(function (x) { return x.kind === 'text'; }).length) + ' ' + esc(A('درس مكتوب', 'written lessons')) + '</li><li>' + ic('qb') + N(all.filter(function (x) { return x.kind === 'quiz'; }).length) + ' ' + esc(A('اختبار', 'quizzes')) + '</li>' +
      '<li>' + ic('shield') + esc(A('مشاهدة داخل التطبيق فقط (دون تنزيل)', 'Watched inside the app only (no download)')) + '</li><li>' + ic('cert') + esc(A('شهادة إتمام', 'Certificate of completion')) + '</li></ul></section></aside></div>';
    return h;
  });
  function curriculum(c, secs, P, cur, act) {
    if (!secs.length) return IS.empty('layers', A('لم تُضف دروس بعد', 'No lessons yet'));
    return '<div class="cur">' + secs.map(function (s, si) {
      var nd = s.lessons.filter(function (x) { return P[x.id]; }).length, open = cur ? s.lessons.some(function (x) { return x.id === cur; }) : si === 0;
      return '<details class="csec"' + (open ? ' open' : '') + '><summary><span class="cn' + (nd && nd === s.lessons.length ? ' ok' : '') + '">' + (nd && nd === s.lessons.length ? ic('check') : N(si + 1)) + '</span><span class="ct"><b>' + esc(s.title) + '</b><small>' + N(s.lessons.length) + ' ' + esc(A('دروس', 'lessons')) + (nd ? ' · ' + N(nd) + ' ' + esc(A('منتهٍ', 'done')) : '') + '</small></span>' + ic('down') + '</summary><ol>' +
        s.lessons.map(function (x) { var open2 = act || x.free;
          return '<li><a class="les' + (x.id === cur ? ' cur' : '') + (open2 ? '' : ' locked') + '" href="#lesson/' + c.id + '/' + x.id + '"><span class="ls ' + (P[x.id] ? 'ok' : '') + '">' + ic(P[x.id] ? 'check' : !open2 ? 'lock' : x.kind === 'quiz' ? 'qb' : x.kind === 'text' ? 'file' : 'play') + '</span><span class="ltt"><b>' + esc(x.title) + '</b><small>' +
            esc({ video: A('فيديو', 'Video'), text: A('درس مكتوب', 'Reading'), quiz: A('اختبار', 'Quiz') }[x.kind] || '') + (x.minutes ? ' · ' + N(x.minutes) + ' ' + esc(A('د', 'min')) : '') + '</small></span>' + (x.free && !act ? IS.chip(esc(A('معاينة مجانية', 'Free preview')), 'free') : '') + '</a></li>'; }).join('') + '</ol></details>';
    }).join('') + '</div>';
  }
  IS.ACT.tab = function (b) { var bar = b.parentNode; bar.querySelectorAll('[data-act=tab]').forEach(function (x) { x.setAttribute('aria-selected', x === b); });
    IS.$$(':scope > .pane', bar.parentNode).forEach(function (p) { p.hidden = p.getAttribute('data-p') !== b.getAttribute('data-t'); }); };
  IS.ACT.share = function (b) { var u = location.origin + location.pathname + '#' + b.getAttribute('data-h'); if (navigator.share) navigator.share({ title: 'اشرح لي', url: u }).catch(function () {}); else { try { navigator.clipboard.writeText(u); IS.toast(A('نُسخ الرابط', 'Link copied')); } catch (e) {} } };
  IS.SUB.review = async function (d) {
    var c = await DB.one('courses', d.course); await DB.ins('reviews', { course_id: d.course, user_id: uid(), name: me().name, stars: +d.stars, body: d.body || '' });
    await IS.recount(d.course); IS.toast(A('شكرًا على تقييمك', 'Thank you for your review')); if (c) IS.notify(c.lecturer_id, A('تقييم جديد لكورسك', 'New review of your course'), c.title + ' · ' + d.stars + '★', '#course/' + c.id); IS.refresh();
  };

  /* ---------- enrolment and payment ---------- */
  IS.ACT.enrol = async function (b) {
    if (!me()) return IS.ACT.login(); var c = await DB.one('courses', b.getAttribute('data-id'));
    if (!+c.price) { await DB.ins('enrollments', { course_id: c.id, user_id: uid(), lecturer_id: c.lecturer_id, status: 'active', price: 0, payer: me().name, phone: me().phone || '', decided_at: new Date().toISOString() }); await IS.recount(c.id); IS.toast(A('تم التحاقك بالكورس', 'You are enrolled')); IS.refresh(); return; }
    IS.sheet(esc(A('الالتحاق بالكورس', 'Enrol in the course')), '<div class="paysum"><b>' + esc(c.title) + '</b><span class="bp">' + IS.money(c.price) + '</span></div>' +
      '<ol class="steps"><li><b>' + esc(A('حوّل المبلغ عبر بنكك', 'Transfer the amount with Bankak')) + '</b><div class="acct"><span>' + esc(A('رقم الحساب', 'Account number')) + '</span><b dir="ltr">' + esc(IS.SET.bankak_account || '') + '</b><button type="button" class="ib" data-act="copy" data-c="' + esc(IS.SET.bankak_account || '') + '" aria-label="copy">' + ic('file') + '</button></div>' +
      '<div class="acct"><span>' + esc(A('اسم الحساب', 'Account name')) + '</span><b>' + esc(IS.SET.bankak_name || '') + '</b></div><div class="acct"><span>' + esc(A('المبلغ', 'Amount')) + '</span><b>' + IS.money(c.price) + '</b></div></li>' +
      '<li><b>' + esc(A('أرسل بيانات التحويل', 'Send the transfer details')) + '</b><form class="form" data-form="pay"><input type="hidden" name="course" value="' + c.id + '">' +
      '<label class="fl"><span>' + esc(A('اسم صاحب الحساب المحوِّل', 'Name on the sending account')) + ' *</span><input name="payer" required value="' + esc(me().name) + '"></label>' +
      '<label class="fl"><span>' + esc(A('رقم الهاتف', 'Phone number')) + ' *</span><input name="phone" required inputmode="tel" dir="ltr" value="' + esc(me().phone || '') + '"></label>' +
      '<label class="fl"><span>' + esc(A('رقم العملية (من إشعار بنكك)', 'Transaction number (from the Bankak notice)')) + '</span><input name="ref" dir="ltr"></label>' +
      '<label class="fl file"><span>' + esc(A('صورة الإيصال', 'Receipt picture')) + ' *</span><input type="file" name="receipt" accept="image/*" required></label>' +
      '<button class="btn pri wide">' + ic('send') + esc(A('إرسال الطلب', 'Send request')) + '</button></form></li>' +
      '<li><b>' + esc(A('يُفتح الكورس تلقائيًا', 'The course opens by itself')) + '</b><p class="mut">' + esc(A('بعد تأكيد فريق المدفوعات من التحويل يصلك إشعار ويُفتح الكورس على حسابك في كل أجهزتك.', 'Once the payments team confirms the transfer you get a notification and the course opens on your account on all your devices.')) + '</p></li></ol>');
  };
  IS.ACT.copy = function (b) { try { navigator.clipboard.writeText(b.getAttribute('data-c')); IS.toast(A('نُسخ', 'Copied')); } catch (e) {} };
  IS.SUB.pay = async function (d, f) {
    var c = await DB.one('courses', d.course), file = f.receipt.files[0]; if (!file) return IS.toast(A('أرفق صورة الإيصال', 'Attach the receipt picture'), true);
    var path = await DB.upload('receipts', await IS.shrink(file, 1400, 0.8));
    await DB.ins('enrollments', { course_id: c.id, user_id: uid(), lecturer_id: c.lecturer_id, status: 'pending', price: +c.price, payer: d.payer, phone: d.phone, ref: d.ref || '', receipt: path });
    IS.closeSheet(); IS.toast(A('أُرسل طلبك. سيصلك إشعار عند التأكيد.', 'Request sent. You will be notified when it is confirmed.')); IS.refresh();
  };

  /* ========== LESSON PLAYER ========== */
  IS.page('lesson', async function (arg) {
    var p = String(arg || '').split('/'), cid = p[0], lid = p[1]; var c = await DB.one('courses', cid); if (!c) return null;
    var r = await Promise.all([IS.courseLessons(cid), IS.myEnroll(), IS.myProgress(cid), DB.one('lecturers', c.lecturer_id)]);
    var secs = r[0], e = r[1][cid], P = r[2], l = r[3] || {}, all = []; secs.forEach(function (s) { all = all.concat(s.lessons); });
    var x = all.filter(function (y) { return y.id === lid; })[0] || all[0]; if (!x) return null; x = Object.assign({}, x, (await DB.lesson(x.id)) || {});
    var mine = IS.LEC && c.lecturer_id === IS.LEC.id, act = (e && e.status === 'active') || mine || IS.can('review'), ok = act || x.free;
    var i = all.indexOf(x), prev = all[i - 1], next = all[i + 1], done = !!P[x.id], pct = all.length ? Math.round(Object.keys(P).length / all.length * 100) : 0;
    var sec = secs.filter(function (s) { return s.id === x.section_id; })[0];
    var h = '<nav class="crumb"><a href="#courses">Courses</a>' + ic('chev', 'fl') + '<a href="#course/' + cid + '">' + esc(c.title) + '</a>' + ic('chev', 'fl') + '<span>' + esc(sec ? sec.title : '') + '</span>' + ic('chev', 'fl') + '<span>' + esc(x.title) + '</span></nav>';
    h += '<div class="lesson"><aside class="lcur"><header><a class="link" href="#course/' + cid + '">' + ic('chev', 'fr') + esc(A('عودة للكورس', 'Back to course')) + '</a><h2>' + IS.T('محتوى الكورس', 'Course content') + '</h2>' + (act ? '<div class="prog">' + IS.bar(pct) + '<em>' + N(pct + '%') + '</em></div>' : '') + '</header>' + curriculum(c, secs, P, x.id, act) + '</aside><div class="lmain">';
    if (!ok) h += '<div class="player lockd" style="' + (c.cover ? '--ci:url(' + IS.U(c.cover) + ')' : '') + '"><div>' + ic('lock') + '<h1 tabindex="-1">' + esc(x.title) + '</h1><p>' + esc(A('هذا الدرس للملتحقين بالكورس.', 'This lesson is for students enrolled in the course.')) + '</p><a class="btn gold" href="#course/' + cid + '">' + esc(A('التحق بالكورس', 'Enrol in the course')) + '</a></div></div>';
    else if (x.kind === 'video') h += '<div class="player" id="player"><div class="loading"><span class="spin"></span></div></div>';
    else if (x.kind === 'quiz') h += '<div class="box quiz" id="quiz"><h1 tabindex="-1">' + ic('qb') + esc(x.title) + '</h1>' + (x.quiz || []).map(function (q, k) { return '<fieldset class="qq" data-a="' + q.a + '"><legend>' + N(k + 1) + '. ' + esc(q.q) + '</legend>' + (q.o || []).map(function (o, j) { return '<label class="qo"><input type="radio" name="q' + k + '" value="' + j + '"><span>' + esc(o) + '</span></label>'; }).join('') + (q.e ? '<p class="qe" hidden>' + ic('info') + esc(q.e) + '</p>' : '') + '</fieldset>'; }).join('') +
      '<div class="row"><button class="btn pri" data-act="quizcheck" data-l="' + x.id + '" data-c="' + cid + '">' + esc(A('تحقق من الإجابات', 'Check answers')) + '</button><span id="qscore" class="qs"></span></div></div>';
    else h += '<article class="box article"><h1 tabindex="-1">' + esc(x.title) + '</h1><div class="rich">' + IS.clean(x.body || '') + '</div></article>';
    h += '<div class="lbar"><div><small>' + esc(sec ? sec.title : '') + '</small><h2>' + esc(x.title) + '</h2></div><div class="row">' + (ok && me() ? IS.dlBtn('lesson', x.id, ' data-c="' + cid + '" data-v="' + esc(x.kind || 'video') + '"') : '') + (prev ? '<a class="btn ghost sm" href="#lesson/' + cid + '/' + prev.id + '">' + ic('chev', 'fr') + esc(A('السابق', 'Previous')) + '</a>' : '') +
      (act ? '<button class="btn sm ' + (done ? 'ok' : 'pri') + '" data-act="done" data-l="' + x.id + '" data-c="' + cid + '">' + ic(done ? 'checkc' : 'check') + esc(done ? A('أنهيت الدرس', 'Completed') : A('أنهيت الدرس؟ علّمه', 'Mark as done')) + '</button>' : '') +
      (next ? '<a class="btn ghost sm" href="#lesson/' + cid + '/' + next.id + '">' + esc(A('التالي', 'Next')) + ic('chev', 'fl') + '</a>' : '') + '</div></div>';
    if (ok && me()) {
      h += '<div class="tabs" role="tablist">' + [['notes', ic('note') + esc(A('ملاحظاتي', 'My notes'))], ['qa', ic('chat') + esc(A('الأسئلة والنقاش', 'Q&A'))], ['info', ic('info') + esc(A('الوصف', 'Description'))]].map(function (t, k) { return '<button role="tab" data-act="tab" data-t="' + t[0] + '" aria-selected="' + (k === 0) + '">' + t[1] + '</button>'; }).join('') + '</div>' +
        '<div class="pane" data-p="notes"><div id="notesBox" class="loading"><span class="spin"></span></div></div><div class="pane" data-p="qa" hidden><div id="qaBox" class="loading"><span class="spin"></span></div></div>' +
        '<div class="pane" data-p="info" hidden><section class="box"><p>' + esc(A('من كورس', 'From the course')) + ' <a class="link" href="#course/' + cid + '">' + esc(c.title) + '</a> ' + esc(A('للمحاضر', 'by')) + ' <a class="link" href="#lecturer/' + l.id + '">' + esc(l.name || '') + '</a></p></section></div>';
    }
    h += '</div><aside class="lside"><section class="box lc"><div class="lci"' + (c.cover ? ' style="--ci:url(' + IS.U(c.cover) + ')"' : '') + '><b>' + esc(c.title) + '</b><span>' + esc(sec ? sec.title : '') + '</span></div><a class="who" href="#lecturer/' + l.id + '">' + IS.av(l, 'sm') + '<span><b>' + esc(l.name || '') + '</b><small>' + esc(l.title || '') + '</small></span></a>' +
      '<div class="lcs"><span>' + ic('video') + '<b>' + N(all.length) + '</b>' + esc(A('درس', 'lessons')) + '</span><span>' + ic('checkc') + '<b>' + N(Object.keys(P).length) + '</b>' + esc(A('منتهٍ', 'done')) + '</span><span>' + ic('chart') + '<b>' + N(pct + '%') + '</b>' + esc(A('التقدّم', 'progress')) + '</span></div>' + (act && me() ? '<button class="btn ghost wide dlc" data-act="dlcourse" data-c="' + cid + '">' + ic('download') + esc(A('تنزيل الكورس كاملًا للمشاهدة دون إنترنت', 'Download the whole course for offline')) + '</button>' : '') + '</section>' +
      (pct >= 100 ? '<a class="btn gold wide" href="#cert/' + cid + '">' + ic('cert') + esc(A('شهادة الإتمام', 'Certificate')) + '</a>' : '') + '</aside></div>';
    IS.after = async function () {
      if (ok && x.kind === 'video') { var pl = $('#player'); try { var v = await DB.videoPlay(x); pl.innerHTML = !v ? IS.empty('video', A('لم يُرفع فيديو هذا الدرس بعد', 'The video of this lesson is not uploaded yet')) :
        v.kind === 'iframe' ? '<iframe src="' + esc(v.src) + '" allow="accelerometer; gyroscope; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy" title="' + esc(x.title) + '"></iframe>' :
        '<video controls controlsList="nodownload noremoteplayback" disablePictureInPicture playsinline oncontextmenu="return false" src="' + esc(v.src) + '"></video>'; } catch (er) { pl.innerHTML = IS.empty('video', A('تعذّر تشغيل الفيديو', 'The video could not be played'), A('تحقق من الاتصال.', 'Check the connection.')); } }
      if (ok && me()) { notesBox(x); qaBox(c, x); }
    };
    return h;
  });
  IS.ACT.done = async function (b) {
    var lid = b.getAttribute('data-l'), cid = b.getAttribute('data-c'), P = await IS.myProgress(cid);
    if (P[lid]) await DB.del('progress', P[lid].id); else { await DB.ins('progress', { user_id: uid(), course_id: cid, lesson_id: lid, done_at: new Date().toISOString() }); IS.toast(A('أحسنت! أنهيت هذا الدرس', 'Well done! Lesson completed')); }
    IS.refresh();
  };
  IS.ACT.quizcheck = async function (b) {
    var qs = IS.$$('#quiz .qq'), right = 0;
    qs.forEach(function (f) { var a = +f.getAttribute('data-a'), sel = f.querySelector('input:checked'); f.querySelectorAll('.qo').forEach(function (o, j) { o.classList.toggle('right', j === a); o.classList.toggle('wrong', !!(sel && +sel.value === j && j !== a)); }); if (sel && +sel.value === a) right++; var e = f.querySelector('.qe'); if (e) e.hidden = false; });
    $('#qscore').innerHTML = N(right) + ' / ' + N(qs.length);
    var P = await IS.myProgress(b.getAttribute('data-c')), lid = b.getAttribute('data-l');
    if (!P[lid] && right === qs.length) { await DB.ins('progress', { user_id: uid(), course_id: b.getAttribute('data-c'), lesson_id: lid, done_at: new Date().toISOString(), score: right }); IS.toast(A('ممتاز! اجتزت الاختبار', 'Excellent! Quiz passed')); }
  };
  async function notesBox(x) {
    var n = (await DB.q('notes', { eq: { user_id: uid(), lesson_id: x.id } }))[0], box = $('#notesBox'); if (!box) return; box.className = '';
    box.innerHTML = '<div class="notes">' + IS.editor('note', n ? n.body : '', A('اكتب ملاحظاتك عن هذا الدرس… تُحفظ في حسابك.', 'Write your notes about this lesson… saved to your account.')) +
      '<div class="tags qt">' + [['التشخيص', 'Diagnosis'], ['التشخيص التفريقي', 'Differential'], ['العلاج', 'Treatment'], ['المضاعفات', 'Complications'], ['فخ امتحاني', 'Exam trap']].map(function (q) { return '<button type="button" data-act="qtag" data-t="' + esc(A(q[0], q[1])) + '">' + esc(A(q[0], q[1])) + '</button>'; }).join('') + '</div>' +
      '<div class="row sp"><span class="mut" id="nst">' + (n ? esc(A('آخر حفظ ', 'Saved ')) + esc(IS.ago(n.updated_at || n.created_at)) : '') + '</span><button class="btn pri sm" data-act="nsave" data-l="' + x.id + '" data-c="' + x.course_id + '" data-id="' + (n ? n.id : '') + '">' + ic('cloud') + esc(A('حفظ الملاحظات', 'Save notes')) + '</button></div></div>';
  }
  IS.ACT.qtag = function (b) { var e = $('[data-ed=note]'); if (!e) return; e.focus(); document.execCommand('insertHTML', false, '<p><b>' + esc(b.getAttribute('data-t')) + ':</b>&nbsp;</p>'); };
  IS.ACT.nsave = async function (b) {
    var body = IS.edVal(document, 'note'), id = b.getAttribute('data-id'), row = { user_id: uid(), lesson_id: b.getAttribute('data-l'), course_id: b.getAttribute('data-c'), body: body, updated_at: new Date().toISOString() };
    var r = id ? await DB.upd('notes', id, row) : await DB.ins('notes', row); b.setAttribute('data-id', r.id); $('#nst').textContent = A('حُفظت', 'Saved'); IS.toast(A('حُفظت الملاحظات', 'Notes saved'));
  };
  async function qaBox(c, x) {
    var box = $('#qaBox'); if (!box) return; var ps = await DB.q('posts', { eq: { room: 'qa', lesson_id: x.id }, order: ['created_at', false] }); ps = ps.filter(function (p) { return p.status !== 'removed'; }); box.className = '';
    box.innerHTML = '<form class="box form" data-form="ask"><input type="hidden" name="course" value="' + c.id + '"><input type="hidden" name="lesson" value="' + x.id + '"><input type="hidden" name="lecturer" value="' + c.lecturer_id + '"><label class="fl"><span>' + esc(A('اسأل المحاضر أو زملاءك عن هذا الدرس', 'Ask the lecturer or your classmates about this lesson')) + '</span><textarea name="body" rows="3" required maxlength="2000"></textarea></label><button class="btn pri sm">' + ic('send') + esc(A('نشر السؤال', 'Post question')) + '</button></form>' +
      (ps.length ? ps.map(postRow).join('') : '<p class="mut center">' + esc(A('لا توجد أسئلة بعد. كن أول من يسأل.', 'No questions yet. Be the first to ask.')) + '</p>');
  }
  IS.SUB.ask = async function (d) {
    await DB.ins('posts', { room: 'qa', course_id: d.course, lesson_id: d.lesson, lecturer_id: d.lecturer, user_id: uid(), name: me().name, photo: me().photo || '', title: '', body: d.body, status: 'open', n_replies: 0 });
    IS.notify(d.lecturer, A('سؤال جديد في كورسك', 'New question in your course'), d.body.slice(0, 120), '#studio-qa'); IS.toast(A('نُشر سؤالك', 'Question posted')); IS.refresh();
  };
  function postRow(p) {
    return '<a class="post" href="#post/' + p.id + '">' + IS.av({ name: p.name, photo: p.photo }, 'sm') + '<span class="pb"><b>' + esc(p.title || p.body.slice(0, 90)) + '</b><small>' + esc(p.name || '') + ' · ' + esc(IS.ago(p.created_at)) + (p.pinned ? ' · ' + esc(A('مثبّت', 'Pinned')) : '') + '</small></span><span class="pc">' + ic('chat') + N(p.n_replies || 0) + '</span></a>';
  }
  IS.postRow = postRow;

  /* ========== MY LEARNING ========== */
  IS.page('learning', async function () {
    var es = await DB.q('enrollments', { eq: { user_id: uid() }, order: ['created_at', false] }), ids = es.map(function (e) { return e.course_id; });
    var cs = ids.length ? await DB.q('courses', { in: { id: ids } }) : [], C = {}; cs.forEach(function (c) { C[c.id] = c; });
    var prog = await DB.q('progress', { eq: { user_id: uid() } }), L = await IS.lecMap();
    var h = IS.banner(IS.T('تعلّمي', 'My learning'), esc(A('كورساتك وتقدّمك وطلبات الالتحاق.', 'Your courses, progress and enrolment requests.')), 'bookmark');
    var act = es.filter(function (e) { return e.status === 'active' && C[e.course_id]; }), pend = es.filter(function (e) { return e.status !== 'active' && C[e.course_id]; });
    h += act.length ? '<div class="grid g3">' + act.map(function (e) { var c = C[e.course_id], n = prog.filter(function (p) { return p.course_id === c.id; }).length, pc = c.n_lessons ? Math.min(100, Math.round(n / c.n_lessons * 100)) : 0;
      return '<article class="ccard mine" style="--cc:' + esc(c.color || 'var(--pri)') + '"><a class="ccimg" href="#course/' + c.id + '">' + (c.cover ? '<img src="' + IS.U(c.cover) + '" alt="">' : '<span class="ph">' + ic('layers') + '</span>') + '</a><div class="ccb"><h3><a href="#course/' + c.id + '">' + esc(c.title) + '</a></h3>' +
        '<span class="mut">' + esc((L[c.lecturer_id] || {}).name || '') + '</span><div class="prog">' + IS.bar(pc) + '<em>' + N(pc + '%') + '</em></div><div class="row"><a class="btn pri sm" href="#course/' + c.id + '">' + ic('play') + esc(pc ? A('تابع', 'Continue') : A('ابدأ', 'Start')) + '</a>' + (pc >= 100 ? '<a class="btn gold sm" href="#cert/' + c.id + '">' + ic('cert') + esc(A('الشهادة', 'Certificate')) + '</a>' : '') + '</div></div></article>'; }).join('') + '</div>' :
      IS.empty('bookmark', A('لم تلتحق بأي كورس بعد', 'You have not enrolled in a course yet'), A('تصفح الكورسات والتحق بما تحتاجه.', 'Browse the courses and enrol in what you need.'), '<a class="btn pri" href="#courses">' + ic('layers') + esc(A('تصفح الكورسات', 'Browse courses')) + '</a>');
    if (pend.length) h += '<section class="sec"><header class="sh"><h2>' + ic('receipt') + IS.T('طلبات الالتحاق', 'Enrolment requests') + '</h2></header><div class="table">' + pend.map(function (e) { var c = C[e.course_id];
      return '<div class="tr"><a href="#course/' + c.id + '"><b>' + esc(c.title) + '</b></a><span>' + IS.money(e.price) + '</span><span>' + esc(IS.date(e.created_at)) + '</span>' + IS.status(e.status) + (e.note ? '<small class="mut">' + esc(e.note) + '</small>' : '') + '</div>'; }).join('') + '</div></section>';
    return h;
  }, { auth: true });

  /* ========== LECTURERS ========== */
  IS.page('lecturers', async function () {
    var r = await Promise.all([DB.q('lecturers', { eq: { status: 'active' } }), IS.pubCourses()]), ls = r[0], cs = r[1];
    var h = IS.banner(IS.T('المحاضرون', 'Lecturers'), esc(A('تعرّف على الأطباء والأكاديميين الذين يقدّمون الكورسات في اشرح لي.', 'Meet the doctors and academics who teach on Ishrah Li.')), 'users',
      '<div class="bnums"><span><b>' + N(ls.length) + '</b>' + esc(A('محاضر', 'lecturers')) + '</span><span><b>' + N(cs.length) + '</b>' + esc(A('كورس', 'courses')) + '</span></div>');
    return h + (ls.length ? '<div class="grid g4">' + ls.map(function (l) { return lecCard(l, cs.filter(function (c) { return c.lecturer_id === l.id; }).length); }).join('') + joinCard() + '</div>' :
      IS.empty('users', A('لا يوجد محاضرون بعد', 'No lecturers yet'), A('المحاضرون الذين يقبلهم فريق المنصة يظهرون هنا.', 'Lecturers accepted by the platform team appear here.'), '<button class="btn pri" data-act="register" data-k="lecturer">' + ic('studio') + esc(A('انضم كمحاضر', 'Teach on Ishrah Li')) + '</button>'));
  });
  function joinCard() { return '<article class="lcard join"><span class="av lg"><b>' + ic('plus') + '</b></span><h3>' + esc(A('انضم كمحاضر', 'Teach on Ishrah Li')) + '</h3><p>' + esc(A('قدّم كورساتك وصمّم صفحتك واربح من كل طالب.', 'Teach your courses, design your page and earn from every student.')) + '</p><div class="row"><a class="btn sm pri" href="#studio-apply">' + esc(A('قدّم طلبك', 'Apply')) + '</a></div></article>'; }
  IS.page('lecturer', async function (id) {
    var l = await DB.one('lecturers', id); if (!l || (l.status !== 'active' && !(IS.LEC && IS.LEC.id === id) && !IS.can('lecturers'))) return null;
    var r = await Promise.all([DB.q('courses', { eq: { lecturer_id: id, status: 'published' } }), DB.q('events', { eq: { lecturer_id: id, status: 'published' }, order: ['starts'] }), IS.myEnroll()]), cs = r[0], ev = r[1];
    var L = {}; L[id] = l; var st = cs.reduce(function (a, c) { return a + (+c.n_students || 0); }, 0), rv = cs.filter(function (c) { return c.n_reviews; }), rate = rv.length ? Math.round(rv.reduce(function (a, c) { return a + c.rating * c.n_reviews; }, 0) / rv.reduce(function (a, c) { return a + c.n_reviews; }, 0) * 10) / 10 : 0;
    var links = l.links || {};
    var h = '<nav class="crumb"><a href="#lecturers">' + esc(A('المحاضرون', 'Lecturers')) + '</a>' + ic('chev', 'fl') + '<span>' + esc(l.name) + '</span></nav>' +
      '<section class="lhero" style="--cc:' + esc(l.color || 'var(--pri)') + (l.cover ? ';--ci:url(' + IS.U(l.cover) + ')' : '') + '">' + IS.av(l, 'xl') + '<div class="lht"><h1 tabindex="-1">' + esc(l.name) + ' ' + ic('checkc', 'verified') + '</h1><p>' + esc(l.title || '') + '</p>' +
      (l.specialty ? '<p class="mut2">' + esc(l.specialty) + '</p>' : '') + '<div class="tags lt">' + (l.tags || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div></div><div class="row">' + IS.favBtn('t:' + id) + '<button class="fav" data-act="share" data-h="lecturer/' + id + '" aria-label="share">' + ic('share') + '</button></div></section>';
    h += '<div class="cols"><div class="main">' + (l.bio ? '<section class="box"><h2>' + ic('user') + IS.T('نبذة عن المحاضر', 'About the lecturer') + '</h2><div class="rich">' + IS.clean(l.bio) + '</div></section>' : '') +
      ((l.quals || []).length ? '<section class="box"><h2>' + ic('cert') + IS.T('المؤهلات والخبرة', 'Qualifications and experience') + '</h2><ul class="learn">' + l.quals.map(function (q) { return '<li>' + ic('checkc') + esc(q) + '</li>'; }).join('') + '</ul></section>' : '') +
      '<section class="sec"><header class="sh"><h2>' + ic('layers') + IS.T('الكورسات', 'Courses') + ' (' + N(cs.length) + ')</h2></header>' + (cs.length ? '<div class="grid g3">' + cs.map(function (c) { return IS.courseCard(c, L, r[2]); }).join('') + '</div>' : '<p class="mut">' + esc(A('لا توجد كورسات منشورة بعد.', 'No published courses yet.')) + '</p>') + '</section>' +
      (ev.length ? '<section class="sec"><header class="sh"><h2>' + ic('cal') + IS.T('الفعاليات', 'Events') + '</h2></header><div class="box">' + ev.map(evRow).join('') + '</div></section>' : '') + '</div>' +
      '<aside class="aside"><section class="box"><h2>' + ic('info') + IS.T('معلومات سريعة', 'Quick facts') + '</h2><ul class="kv"><li><span>' + esc(A('الكورسات', 'Courses')) + '</span><b>' + N(cs.length) + '</b></li>' + (st ? '<li><span>' + esc(A('الطلبة', 'Students')) + '</span><b>' + N(st) + '</b></li>' : '') +
      (rate ? '<li><span>' + esc(A('التقييم', 'Rating')) + '</span><b>' + IS.stars(rate) + ' ' + N(rate) + '</b></li>' : '') + '<li><span>' + esc(A('عضو منذ', 'Member since')) + '</span><b>' + esc(IS.date(l.created_at)) + '</b></li></ul></section>' +
      (Object.keys(links).some(function (k) { return links[k]; }) ? '<section class="box"><h2>' + ic('link') + IS.T('روابط التواصل', 'Links') + '</h2>' + [['whatsapp', 'wa', 'WhatsApp'], ['telegram', 'send', 'Telegram'], ['youtube', 'video', 'YouTube'], ['x', 'link', 'X'], ['linkedin', 'link', 'LinkedIn'], ['email', 'mail', 'Email']].filter(function (k) { return links[k[0]]; }).map(function (k) {
        var v = links[k[0]], href = k[0] === 'whatsapp' ? IS.wa(v) : k[0] === 'email' ? 'mailto:' + v : /^https?:/.test(v) ? v : 'https://' + v;
        return '<a class="who" target="_blank" rel="noopener" href="' + esc(href) + '"><span class="av sm"><b>' + ic(k[1]) + '</b></span><span><b>' + esc(k[2]) + '</b><small dir="ltr">' + esc(v) + '</small></span></a>'; }).join('') + '</section>' : '') + '</aside></div>';
    return h;
  });

  /* ========== EVENTS ========== */
  IS.page('events', async function () {
    var ev = await DB.q('events', { eq: { status: 'published' }, order: ['starts'] }), now = Date.now(), up = ev.filter(function (e) { return new Date(e.starts).getTime() + (e.minutes || 60) * 6e4 > now; }), past = ev.filter(function (e) { return up.indexOf(e) < 0; }).reverse();
    return IS.banner(IS.T('الفعاليات', 'Events'), esc(A('جلسات مباشرة، ورش عمل وندوات للتحضير للامتحانات.', 'Live sessions, workshops and exam-preparation seminars.')), 'cal') +
      '<section class="sec"><header class="sh"><h2>' + IS.T('القادمة', 'Upcoming') + '</h2></header>' + (up.length ? '<div class="box">' + up.map(evRow).join('') + '</div>' : IS.empty('cal', A('لا توجد فعاليات قادمة الآن', 'No upcoming events yet'), A('يعلن المحاضرون عن جلساتهم هنا.', 'Lecturers announce their sessions here.'))) + '</section>' +
      (past.length ? '<section class="sec"><header class="sh"><h2>' + IS.T('السابقة', 'Past') + '</h2></header><div class="box">' + past.map(evRow).join('') + '</div></section>' : '');
  });
  IS.page('event', async function (id) {
    var e = await DB.one('events', id); if (!e) return null; var l = await DB.one('lecturers', e.lecturer_id) || {}, regs = await DB.q('event_regs', { eq: { event_id: id } }), mine = me() && regs.some(function (x) { return x.user_id === uid(); });
    var live = Date.now() > new Date(e.starts).getTime() - 15 * 6e4;
    return '<nav class="crumb"><a href="#events">' + esc(A('الفعاليات', 'Events')) + '</a>' + ic('chev', 'fl') + '<span>' + esc(e.title) + '</span></nav>' +
      '<section class="chero"' + (e.cover ? ' style="--ci:url(' + IS.U(e.cover) + ')"' : '') + '><div class="chin"><div class="cht"><span class="tags lt"><span>' + esc(e.kind === 'live' ? A('جلسة مباشرة', 'Live session') : e.kind === 'workshop' ? A('ورشة عمل', 'Workshop') : A('ندوة', 'Seminar')) + '</span></span><h1 tabindex="-1">' + esc(e.title) + '</h1>' +
      '<div class="chst"><span>' + ic('cal') + esc(IS.date(e.starts, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })) + '</span><span>' + ic('clock') + N(e.minutes || 60) + ' ' + esc(A('دقيقة', 'min')) + '</span><span>' + ic('users') + N(regs.length) + ' ' + esc(A('مسجّل', 'registered')) + '</span></div>' +
      '<a class="chlec" href="#lecturer/' + l.id + '">' + IS.av(l, 'sm') + '<span><b>' + esc(l.name || '') + '</b><small>' + esc(l.title || '') + '</small></span></a></div></div></section>' +
      '<div class="cols"><div class="main"><section class="box"><h2>' + IS.T('عن الفعالية', 'About the event') + '</h2><div class="rich">' + IS.clean(e.about || '') + '</div></section></div><aside class="aside"><section class="box buy">' +
      (mine ? '<p class="note ok">' + ic('checkc') + esc(A('أنت مسجّل في هذه الفعالية', 'You are registered')) + '</p>' + (e.link && live ? '<a class="btn pri wide" target="_blank" rel="noopener" href="' + esc(e.link) + '">' + ic('live') + esc(A('انضم الآن', 'Join now')) + '</a>' : '<p class="mut">' + esc(A('يظهر رابط الانضمام هنا قبل البدء بربع ساعة.', 'The joining link shows here 15 minutes before the start.')) + '</p>') +
        '<button class="btn ghost wide" data-act="unreg" data-id="' + id + '">' + esc(A('إلغاء التسجيل', 'Cancel registration')) + '</button>' : '<button class="btn pri wide" data-act="reg" data-id="' + id + '">' + ic('cal') + esc(A('سجّل في الفعالية', 'Register')) + '</button>') + '</section></aside></div>';
  });
  IS.ACT.reg = async function (b) { if (!me()) return IS.ACT.login(); await DB.ins('event_regs', { event_id: b.getAttribute('data-id'), user_id: uid() }); IS.toast(A('تم تسجيلك', 'Registered')); IS.refresh(); };
  IS.ACT.unreg = async function (b) { var r = await DB.q('event_regs', { eq: { event_id: b.getAttribute('data-id'), user_id: uid() } }); for (var i = 0; i < r.length; i++) await DB.del('event_regs', r[i].id); IS.refresh(); };

  /* ========== COMMUNITY ========== */
  var ROOMS = function () { return [{ id: 'general', ar: 'النقاش العام', en: 'General', icon: 'chat' }].concat(IS.CATS.map(function (c) { return { id: c.id, ar: c.ar, en: c.en, icon: c.icon }; })).concat([{ id: 'requests', ar: 'طلبات الكورسات والمحاضرين', en: 'Course & lecturer requests', icon: 'plus' }, { id: 'support', ar: 'الدعم والمساعدة', en: 'Support', icon: 'help' }]); };
  IS.page('community', async function (room) {
    var ps = await DB.q('posts', { neq: { room: 'qa' }, order: ['created_at', false], limit: 200 }); ps = ps.filter(function (p) { return p.status !== 'removed'; });
    var cur = room || ''; var list = ps.filter(function (p) { return !cur || p.room === cur; }).sort(function (a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0); });
    var users = {}; ps.forEach(function (p) { users[p.user_id] = 1; });
    var h = IS.banner(IS.T('مجتمع الطلبة', 'Student Community'), esc(A('مساحة تفاعلية لطلبة الطب في السودان: ناقش، اسأل، شارك المعرفة، واطلب ما تحتاجه.', 'A space for medical students in Sudan: discuss, ask, share and request what you need.')), 'group',
      '<div class="bnums"><span><b>' + N(ps.length) + '</b>' + esc(A('نقاش', 'discussions')) + '</span><span><b>' + N(Object.keys(users).length) + '</b>' + esc(A('مشارك', 'members')) + '</span></div>');
    h += '<div class="cols rev"><aside class="filt show"><header><h2>' + ic('group') + IS.T('الغرف', 'Rooms') + '</h2></header><nav class="rooms"><a href="#community" class="' + (!cur ? 'on' : '') + '">' + ic('grid') + '<span>' + esc(A('كل النقاشات', 'All discussions')) + '</span><em>' + N(ps.length) + '</em></a>' +
      ROOMS().map(function (r) { return '<a href="#community/' + r.id + '" class="' + (cur === r.id ? 'on' : '') + '">' + ic(r.icon) + '<span>' + esc(A(r.ar, r.en)) + '</span><em>' + N(ps.filter(function (p) { return p.room === r.id; }).length) + '</em></a>'; }).join('') + '</nav>' +
      '<section class="rules"><h3>' + ic('shield') + esc(A('قواعد المجتمع', 'Community rules')) + '</h3><ul>' + [A('الاحترام أولًا: لا إساءة ولا تنمّر.', 'Respect first: no insults or bullying.'), A('لا تنشر محتوى الكورسات المدفوعة.', 'Do not post paid course content.'), A('لا نصائح علاجية لمرضى حقيقيين.', 'No treatment advice for real patients.'), A('أبلغ عن المخالفات ليراجعها المشرفون.', 'Report violations to the moderators.')].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></section></aside>' +
      '<div class="main">' + (me() ? '<form class="box form" data-form="post"><div class="row"><select name="room" class="sel">' + ROOMS().map(function (r) { return '<option value="' + r.id + '"' + (r.id === (cur || 'general') ? ' selected' : '') + '>' + esc(A(r.ar, r.en)) + '</option>'; }).join('') + '</select><input name="title" required maxlength="140" placeholder="' + esc(A('عنوان النقاش أو السؤال', 'Title of your discussion or question')) + '"></div>' +
        '<textarea name="body" rows="3" required maxlength="5000" placeholder="' + esc(A('اكتب التفاصيل…', 'Write the details…')) + '"></textarea><div class="row end"><button class="btn pri sm">' + ic('send') + esc(A('نشر', 'Post')) + '</button></div></form>' :
        '<div class="box center">' + esc(A('سجّل الدخول لتشارك في النقاش.', 'Sign in to join the discussion.')) + ' <button class="btn pri sm" data-act="login">' + esc(A('دخول', 'Sign in')) + '</button></div>') +
      (list.length ? '<div class="posts">' + list.map(postRow).join('') + '</div>' : IS.empty('chat', A('لا توجد نقاشات هنا بعد', 'No discussions here yet'), A('ابدأ أول نقاش.', 'Start the first one.'))) + '</div></div>';
    return h;
  });
  IS.SUB.post = async function (d) { await DB.ins('posts', { room: d.room, user_id: uid(), name: me().name, photo: me().photo || '', title: d.title, body: d.body, status: 'open', n_replies: 0, pinned: false }); IS.toast(A('نُشر', 'Posted')); IS.refresh(); };
  IS.page('post', async function (id) {
    var p = await DB.one('posts', id); if (!p || p.status === 'removed') return null; var rs = (await DB.q('replies', { eq: { post_id: id }, order: ['created_at'] })).filter(function (r) { return r.status !== 'removed'; });
    var lecs = await IS.lecMap(), mod = IS.can('community'), owner = IS.LEC && p.lecturer_id === IS.LEC.id;
    return '<nav class="crumb"><a href="#' + (p.room === 'qa' ? 'course/' + p.course_id : 'community') + '">' + esc(p.room === 'qa' ? A('الكورس', 'Course') : A('المجتمع', 'Community')) + '</a>' + ic('chev', 'fl') + '<span>' + esc(p.title || A('سؤال', 'Question')) + '</span></nav>' +
      '<article class="box thread">' + IS.av({ name: p.name, photo: p.photo }, 'md') + '<div><h1 tabindex="-1">' + esc(p.title || p.body.slice(0, 80)) + '</h1><small class="mut">' + esc(p.name || '') + ' · ' + esc(IS.ago(p.created_at)) + '</small><p class="pre">' + esc(p.body) + '</p>' +
      '<div class="row">' + (me() ? '<button class="btn ghost sm" data-act="report" data-kind="post" data-id="' + p.id + '">' + ic('flag') + esc(A('إبلاغ', 'Report')) + '</button>' : '') + (mod ? '<button class="btn ghost sm" data-act="pin" data-id="' + p.id + '">' + ic('pin') + esc(p.pinned ? A('إلغاء التثبيت', 'Unpin') : A('تثبيت', 'Pin')) + '</button><button class="btn ghost sm bad" data-act="rmpost" data-id="' + p.id + '">' + ic('trash') + esc(A('حذف', 'Remove')) + '</button>' : '') + '</div></div></article>' +
      '<h2 class="ph2">' + N(rs.length) + ' ' + esc(A('رد', 'replies')) + '</h2>' + rs.map(function (r) { var isLec = !!lecs[r.user_id];
        return '<div class="box reply' + (isLec ? ' lec' : '') + '">' + IS.av({ name: r.name, photo: r.photo }, 'sm') + '<div><b>' + esc(r.name || '') + '</b>' + (isLec ? IS.chip(esc(A('محاضر', 'Lecturer')), 'ok') : '') + ' <small class="mut">' + esc(IS.ago(r.created_at)) + '</small><p class="pre">' + esc(r.body) + '</p>' +
          (mod ? '<button class="link bad" data-act="rmreply" data-id="' + r.id + '">' + esc(A('حذف', 'Remove')) + '</button>' : me() ? '<button class="link" data-act="report" data-kind="reply" data-id="' + r.id + '">' + esc(A('إبلاغ', 'Report')) + '</button>' : '') + '</div></div>'; }).join('') +
      (me() ? '<form class="box form" data-form="reply"><input type="hidden" name="post" value="' + p.id + '"><textarea name="body" rows="3" required maxlength="4000" placeholder="' + esc(owner ? A('أجب طالبك…', 'Answer your student…') : A('اكتب ردك…', 'Write your reply…')) + '"></textarea><div class="row end"><button class="btn pri sm">' + ic('send') + esc(A('رد', 'Reply')) + '</button></div></form>' : '');
  });
  IS.SUB.reply = async function (d) {
    var p = await DB.one('posts', d.post); await DB.ins('replies', { post_id: d.post, user_id: uid(), name: me().name, photo: me().photo || '', body: d.body, status: 'open' });
    if (!DB.live) await DB.upd('posts', d.post, { n_replies: (p.n_replies || 0) + 1 });
    if (p.user_id !== uid()) IS.notify(p.user_id, A('رد جديد على مشاركتك', 'New reply to your post'), d.body.slice(0, 120), '#post/' + p.id); IS.refresh();
  };
  IS.ACT.report = async function (b) { if (!me()) return IS.ACT.login(); var why = await IS.ask(A('إبلاغ المشرفين', 'Report to moderators'), A('سبب الإبلاغ', 'Reason'), '', { area: 1, ok: A('إرسال', 'Send') }); if (!why) return;
    await DB.ins('reports', { kind: b.getAttribute('data-kind'), target: b.getAttribute('data-id'), user_id: uid(), reason: why, status: 'open' }); IS.toast(A('شكرًا، سيراجعه المشرفون', 'Thank you, moderators will review it')); };
  IS.ACT.pin = async function (b) { var p = await DB.one('posts', b.getAttribute('data-id')); await DB.upd('posts', p.id, { pinned: !p.pinned }); IS.audit(p.pinned ? 'unpin post' : 'pin post', p.title); IS.refresh(); };
  IS.ACT.rmpost = async function (b) { if (!(await IS.confirm(A('حذف هذه المشاركة؟', 'Remove this post?')))) return; await DB.upd('posts', b.getAttribute('data-id'), { status: 'removed' }); IS.audit('remove post', b.getAttribute('data-id')); IS.go('community'); };
  IS.ACT.rmreply = async function (b) { await DB.upd('replies', b.getAttribute('data-id'), { status: 'removed' }); IS.audit('remove reply', b.getAttribute('data-id')); IS.refresh(); };

  /* ========== NOTIFICATIONS ========== */
  IS.page('notifications', async function () {
    var n = (await DB.q('notices', { order: ['created_at', false], limit: 80 })).filter(function (x) { return !x.user_id || x.user_id === uid(); });
    var seen = IS.LS.get('seen-' + uid(), 0); IS.LS.set('seen-' + uid(), Date.now()); setTimeout(IS.bell, 50);
    return IS.banner(IS.T('الإشعارات', 'Notifications'), '', 'bell') + (n.length ? '<div class="list">' + n.map(function (x) {
      return '<a class="li' + (new Date(x.created_at).getTime() > seen ? ' new' : '') + '" href="' + esc(x.link || '#notifications') + '">' + ic(x.user_id ? 'bell' : 'sparkle') + '<span><b>' + esc(x.title) + '</b><small>' + esc(x.body || '') + '</small></span><em>' + esc(IS.ago(x.created_at)) + '</em></a>'; }).join('') + '</div>' :
      IS.empty('bell', A('لا توجد إشعارات', 'No notifications'), A('تصلك هنا موافقات الدفع والردود والإعلانات.', 'Payment approvals, replies and announcements arrive here.')));
  }, { auth: true });


  /* ========== ANNOUNCEMENTS & NEWS (owner's design, 18 Nov 2026) ==========
     announcements = public notices (Control → Announcements); news = table news (Control → News), each with a picture, a tag and a date */
  var NTAGS = [['news', 'أخبار', 'News'], ['events', 'فعاليات', 'Events'], ['achievements', 'إنجازات', 'Achievements'], ['initiatives', 'مبادرات', 'Initiatives'], ['academic', 'أكاديمي', 'Academic']];
  IS.NTAGS = NTAGS;
  function ntag(t) { var x = NTAGS.filter(function (k) { return k[0] === t; })[0] || NTAGS[0]; return A(x[1], x[2]); }
  async function annList() { try { return (await DB.q('notices', { order: ['created_at', false], limit: 60 })).filter(function (x) { return !x.user_id; }); } catch (e) { return []; } }
  async function newsList() { try { return (await DB.q('news', { order: ['created_at', false], limit: 120 })).filter(function (x) { return x.status !== 'draft'; }); } catch (e) { return []; } }
  function annRow(x) { return '<a class="annr" href="' + esc(x.link || '#news/ann') + '"><span class="anni">' + ic('mega') + '</span><span class="annt"><b>' + esc(x.title) + '</b>' + (x.body ? '<small>' + esc(x.body) + '</small>' : '') + '<em>' + ic('cal') + esc(IS.date(x.created_at)) + '</em></span>' + ic('pinned', 'annp') + '</a>'; }
  function newsCard(x) { return '<a class="ncard" href="#news/' + x.id + '"><span class="ncv">' + (x.cover ? '<img src="' + IS.U(x.cover) + '" alt="" loading="lazy">' : '<i>' + ic('news') + '</i>') + '<em class="ntag">' + esc(ntag(x.tag)) + '</em></span><b>' + esc(x.title) + '</b><small>' + ic('cal') + esc(IS.date(x.created_at)) + '</small></a>'; }
  IS.page('news', async function (arg) {
    var r = await Promise.all([annList(), newsList()]), an = r[0], ns = r[1];
    var ban = IS.banner(IS.T('الإعلانات والأخبار', 'Announcements & News'), esc(A('تابع آخر الإعلانات والأخبار والتحديثات الهامة.', 'Follow the latest announcements, news and important updates.')), 'news');
    if (arg && arg !== 'ann' && arg !== 'all') {
      var x = ns.filter(function (n) { return n.id === arg; })[0]; if (!x) return null;
      return '<nav class="crumb"><a href="#news">' + esc(A('الإعلانات والأخبار', 'Announcements & News')) + '</a>' + ic('chev', 'fl') + '<span>' + esc(x.title) + '</span></nav>' +
        '<article class="box narticle">' + (x.cover ? '<img class="nhero" src="' + IS.U(x.cover) + '" alt="">' : '') + '<em class="ntag">' + esc(ntag(x.tag)) + '</em><h1 tabindex="-1">' + esc(x.title) + '</h1><p class="mut">' + ic('cal') + esc(IS.date(x.created_at)) + '</p><div class="pre">' + esc(x.body || '') + '</div></article>' +
        (ns.length > 1 ? '<section class="sec"><header class="sh"><h2>' + ic('news') + IS.T('أخبار أخرى', 'More news') + '</h2></header><div class="ngrid">' + ns.filter(function (n) { return n.id !== x.id; }).slice(0, 3).map(newsCard).join('') + '</div></section>' : '');
    }
    var noAnn = IS.empty('mega', A('لا توجد إعلانات الآن', 'No announcements now'), A('تظهر هنا إعلانات فريق المنصة فور نشرها.', 'The platform team’s announcements appear here as soon as they are published.'));
    var noNews = IS.empty('news', A('لا توجد أخبار بعد', 'No news yet'), A('تظهر هنا أخبار المنصة والفعاليات والإنجازات.', 'Platform news, events and achievements appear here.'));
    if (arg === 'ann') return ban + '<section class="box"><header class="sh"><h2>' + ic('mega') + IS.T('كل الإعلانات', 'All announcements') + '</h2><a class="more" href="#news">' + esc(A('رجوع', 'Back')) + ic('chev', 'fl') + '</a></header>' + (an.length ? '<div class="annl">' + an.map(annRow).join('') + '</div>' : noAnn) + '</section>';
    if (arg === 'all') return ban + '<section class="sec"><header class="sh"><h2>' + ic('news') + IS.T('كل الأخبار', 'All news') + '</h2><a class="more" href="#news">' + esc(A('رجوع', 'Back')) + ic('chev', 'fl') + '</a></header>' + (ns.length ? '<div class="ngrid">' + ns.map(newsCard).join('') + '</div>' : noNews) + '</section>';
    return ban + '<div class="nlay"><section class="box nmain"><header class="sh"><h2>' + ic('news') + IS.T('آخر الأخبار', 'Latest news') + '</h2></header>' +
      (ns.length ? '<div class="ngrid">' + ns.slice(0, 3).map(newsCard).join('') + '</div>' : noNews) +
      (ns.length > 3 ? '<footer><a class="btn pri" href="#news/all">' + esc(A('عرض جميع الأخبار', 'All news')) + ic('chev', 'fl') + '</a></footer>' : '') + '</section>' +
      '<section class="box nside"><header class="sh"><h2>' + ic('mega') + IS.T('أهم الإعلانات', 'Top announcements') + '</h2></header>' + (an.length ? '<div class="annl">' + an.slice(0, 3).map(annRow).join('') + '</div>' : noAnn) +
      (an.length > 3 ? '<footer><a class="btn ghost" href="#news/ann">' + esc(A('عرض جميع الإعلانات', 'All announcements')) + ic('chev', 'fl') + '</a></footer>' : '') + '</section></div>';
  });

  /* ========== FAVOURITES ========== */
  IS.page('favorites', async function () {
    var f = favs(), ks = Object.keys(f).sort(function (a, b) { return f[b] - f[a]; }), cids = ks.filter(function (k) { return /^c:/.test(k); }).map(function (k) { return k.slice(2); }), tids = ks.filter(function (k) { return /^t:/.test(k); }).map(function (k) { return k.slice(2); });
    var r = await Promise.all([cids.length ? DB.q('courses', { in: { id: cids } }) : [], tids.length ? DB.q('lecturers', { in: { id: tids } }) : [], IS.lecMap(), IS.myEnroll()]);
    var h = IS.banner(IS.T('المفضلة', 'Favourites'), '', 'heart');
    if (!r[0].length && !r[1].length) return h + IS.empty('heart', A('لا توجد عناصر في المفضلة', 'No favourites yet'), A('اضغط ♡ على أي كورس أو محاضر.', 'Tap ♡ on any course or lecturer.'));
    return h + (r[0].length ? '<section class="sec"><header class="sh"><h2>' + IS.T('الكورسات', 'Courses') + '</h2></header><div class="grid g3">' + r[0].map(function (c) { return IS.courseCard(c, r[2], r[3]); }).join('') + '</div></section>' : '') +
      (r[1].length ? '<section class="sec"><header class="sh"><h2>' + IS.T('المحاضرون', 'Lecturers') + '</h2></header><div class="grid g4">' + r[1].map(function (l) { return lecCard(l, 0); }).join('') + '</div></section>' : '');
  }, { auth: true });

  /* ========== ACHIEVEMENTS, CERTIFICATE ========== */
  async function myStats() {
    var r = await Promise.all([DB.q('progress', { eq: { user_id: uid() } }), DB.q('enrollments', { eq: { user_id: uid(), status: 'active' } }), DB.q('posts', { eq: { user_id: uid() } }), DB.q('replies', { eq: { user_id: uid() } }), DB.q('event_regs', { eq: { user_id: uid() } })]);
    var ids = r[1].map(function (e) { return e.course_id; }), cs = ids.length ? await DB.q('courses', { in: { id: ids } }) : [];
    var comp = cs.filter(function (c) { return c.n_lessons && r[0].filter(function (p) { return p.course_id === c.id; }).length >= c.n_lessons; });
    var avg = cs.length ? Math.round(cs.reduce(function (a, c) { return a + (c.n_lessons ? Math.min(100, r[0].filter(function (p) { return p.course_id === c.id; }).length / c.n_lessons * 100) : 0); }, 0) / cs.length) : 0;
    var days = {}; r[0].forEach(function (p) { days[String(p.done_at).slice(0, 10)] = 1; }); var streak = 0, d = new Date(); while (days[d.toISOString().slice(0, 10)]) { streak++; d.setDate(d.getDate() - 1); }
    return { lessons: r[0].length, courses: cs.length, done: comp, avg: avg, posts: r[2].length, replies: r[3].length, events: r[4].length, streak: streak, points: r[0].length * 10 + r[2].length * 3 + r[3].length * 2 + comp.length * 100 + r[4].length * 5 };
  }
  IS.myStats = myStats;
  var BADGES = [['first', 'sparkle', 'الخطوة الأولى', 'First step', 'أنهِ أول درس', 'Finish your first lesson', function (s) { return s.lessons; }],
    ['l25', 'video', '25 درسًا', '25 lessons', 'أنهِ 25 درسًا', 'Finish 25 lessons', function (s) { return s.lessons / 25; }], ['l100', 'trophy', '100 درس', '100 lessons', 'أنهِ 100 درس', 'Finish 100 lessons', function (s) { return s.lessons / 100; }],
    ['c1', 'cert', 'كورس كامل', 'Course complete', 'أكمل كورسًا', 'Complete a course', function (s) { return s.done.length; }], ['c5', 'crown', 'خمسة كورسات', 'Five courses', 'أكمل 5 كورسات', 'Complete 5 courses', function (s) { return s.done.length / 5; }],
    ['s7', 'flame', 'أسبوع متواصل', '7-day streak', '7 أيام متتالية', '7 days in a row', function (s) { return s.streak / 7; }], ['help', 'chat', 'زميل متعاون', 'Helpful peer', '10 ردود في المجتمع', '10 community replies', function (s) { return s.replies / 10; }],
    ['ev', 'cal', 'حاضر الفعاليات', 'Event-goer', 'سجّل في 3 فعاليات', 'Register for 3 events', function (s) { return s.events / 3; }]];
  IS.page('achievements', async function () {
    var s = await myStats(), lvl = Math.floor(Math.sqrt(s.points / 50)) + 1, cur = 50 * (lvl - 1) * (lvl - 1), nx = 50 * lvl * lvl;
    return IS.banner(IS.T('الإنجازات', 'Achievements'), esc(A('نقاطك وشاراتك وشهاداتك من تعلّمك الفعلي.', 'Your points, badges and certificates from your real learning.')), 'trophy') +
      '<section class="lvl"><div class="lvn"><small>' + esc(A('المستوى', 'Level')) + '</small><b>' + N(lvl) + '</b></div><div class="lvb"><b>' + N(s.points) + ' ' + esc(A('نقطة', 'points')) + '</b>' + IS.bar((s.points - cur) / (nx - cur) * 100, 'gold') + '<small>' + N(nx - s.points) + ' ' + esc(A('نقطة للمستوى التالي', 'to the next level')) + '</small></div>' +
      '<div class="lvs">' + [['flame', s.streak, A('أيام متتالية', 'day streak')], ['checkc', s.lessons, A('درس منتهٍ', 'lessons')], ['cert', s.done.length, A('شهادة', 'certificates')]].map(function (r) { return '<span>' + ic(r[0]) + '<b>' + N(r[1]) + '</b><small>' + esc(r[2]) + '</small></span>'; }).join('') + '</div></section>' +
      '<p class="note">' + ic('info') + '<span>' + esc(A('النقاط: درس منتهٍ 10، كورس مكتمل 100، مشاركة 3، رد 2، تسجيل في فعالية 5.', 'Points: lesson 10, completed course 100, post 3, reply 2, event registration 5.')) + '</span></p>' +
      '<section class="sec"><header class="sh"><h2>' + IS.T('الشارات', 'Badges') + '</h2></header><div class="badges">' + BADGES.map(function (b) { var v = Math.min(1, b[6](s) || 0);
        return '<div class="badge' + (v >= 1 ? ' on' : '') + '"><span>' + ic(v >= 1 ? b[1] : 'lock') + '</span><b>' + esc(A(b[2], b[3])) + '</b><small>' + esc(A(b[4], b[5])) + '</small>' + (v < 1 ? IS.bar(v * 100) : '') + '</div>'; }).join('') + '</div></section>' +
      '<section class="sec"><header class="sh"><h2>' + IS.T('الشهادات', 'Certificates') + '</h2></header>' + (s.done.length ? '<div class="list">' + s.done.map(function (c) { return '<a class="li" href="#cert/' + c.id + '">' + ic('cert') + '<span><b>' + esc(c.title) + '</b></span></a>'; }).join('') + '</div>' : '<p class="mut">' + esc(A('أكمل كل دروس كورس لتحصل على شهادته.', 'Complete every lesson of a course to receive its certificate.')) + '</p>') + '</section>';
  }, { auth: true });
  IS.page('cert', async function (cid) {
    var c = await DB.one('courses', cid); if (!c) return null; var P = await IS.myProgress(cid), n = Object.keys(P).length;
    if (!c.n_lessons || n < c.n_lessons) return IS.empty('lock', A('لم يكتمل الكورس بعد', 'The course is not complete yet'), N(n) + ' / ' + N(c.n_lessons || 0), '<a class="btn pri" href="#course/' + cid + '">' + esc(A('تابع الكورس', 'Continue')) + '</a>');
    var l = await DB.one('lecturers', c.lecturer_id) || {}, dt = Object.keys(P).map(function (k) { return P[k].done_at; }).sort().pop();
    var code = (cid.slice(0, 4) + uid().slice(0, 4)).toUpperCase();
    return '<div class="certp"><div class="cert"><img src="' + IS.logo() + '" alt="" class="cl"><small class="cb">اشرح لي · Certificate of Completion</small><h1 tabindex="-1">' + IS.T('شهادة إتمام', 'Certificate of Completion') + '</h1><p>' + esc(A('تشهد منصة اشرح لي بأن', 'Ishrah Li certifies that')) + '</p><h2>' + esc(me().name) + '</h2>' +
      '<p>' + esc(A('أتمّ بنجاح كورس', 'has successfully completed the course')) + '</p><h3>' + esc(c.title) + '</h3><p class="cm">' + N(c.n_lessons) + ' ' + esc(A('درسًا', 'lessons')) + ' · ' + esc(IS.date(dt, { day: 'numeric', month: 'long', year: 'numeric' })) + '</p>' +
      '<div class="cs"><span><i></i>' + esc(l.name || '') + '<small>' + esc(A('المحاضر', 'Lecturer')) + '</small></span><span><i></i>اشرح لي<small>' + esc(A('إدارة المنصة', 'Platform')) + '</small></span></div><small class="cc" dir="ltr">ID ' + esc(code) + '</small></div>' +
      '<div class="row center"><button class="btn pri" data-act="print">' + ic('file') + esc(A('طباعة', 'Print')) + '</button></div></div>';
  }, { auth: true });
  IS.ACT.print = function () { window.print(); };

  /* ========== ACCOUNT (profile) ========== */
  IS.page('account', async function (tab) {
    var m = me(), s = await myStats(), apps = await DB.q('lecturer_apps', { eq: { user_id: m.id }, order: ['created_at', false] }), ap = apps[0];
    tab = tab || 'profile';
    var h = IS.banner(IS.T('صفحتي الشخصية', 'My profile'), '', 'user');
    h += '<section class="prof"><label class="pav">' + IS.av(m, 'xl') + '<span class="cam">' + ic('image') + '</span><input type="file" accept="image/*" id="myPhoto" hidden></label><div class="pt"><h1 tabindex="-1">' + esc(m.name) + '</h1><p>' + esc([m.university, m.year].filter(Boolean).join(' – ') || A('طالب طب', 'Medical student')) + '</p>' +
      (m.city ? '<p class="mut">' + ic('pin') + esc(m.city) + '</p>' : '') + '<button class="btn ghost sm" data-act="editme">' + ic('pen') + esc(A('تعديل الملف', 'Edit profile')) + '</button></div>' +
      '<div class="pstats">' + [['layers', s.courses, A('كورس مسجل', 'courses')], ['chart', s.avg + '%', A('معدل التقدّم', 'average progress')], ['cert', s.done.length, A('شهادات', 'certificates')], ['star', s.points, A('نقطة تعلّم', 'points')]].map(function (r) { return '<span>' + ic(r[0]) + '<b>' + N(r[1]) + '</b><small>' + esc(r[2]) + '</small></span>'; }).join('') + '</div></section>';
    h += '<div class="cols rev"><aside class="filt show"><nav class="rooms">' + [['profile', 'user', 'الملف الشخصي', 'Profile'], ['learning', 'layers', 'كورساتي', 'My courses', 1], ['achievements', 'cert', 'شهاداتي وإنجازاتي', 'Certificates', 1], ['favorites', 'heart', 'مفضلاتي', 'Favourites', 1], ['notifications', 'bell', 'الإشعارات', 'Notifications', 1], ['settings', 'gear', 'إعدادات الحساب', 'Account settings'], ['support', 'chat', 'الدعم والرسائل', 'Support & messages', 1], ['security', 'shield', 'الأمان', 'Security', 1]].map(function (x) {
      return '<a href="#' + (x[4] ? x[0] : 'account/' + x[0]) + '" class="' + (tab === x[0] ? 'on' : '') + '">' + ic(x[1]) + '<span>' + esc(A(x[2], x[3])) + '</span></a>'; }).join('') + '<button class="logout" data-act="logout">' + ic('logout') + '<span>' + esc(A('تسجيل الخروج', 'Sign out')) + '</span></button></nav></aside><div class="main">';
    if (tab === 'settings') {
      h += '<section class="box"><h2>' + ic('gear') + IS.T('إعدادات الحساب', 'Account settings') + '</h2><ul class="kv"><li><span>' + esc(A('طريقة الدخول', 'Sign-in')) + '</span><b>' + esc(m.phone ? A('رقم الهاتف', 'Phone') + ' ' + m.phone : 'Google') + '</b></li><li><span>' + esc(A('اللغة', 'Language')) + '</span><b><button class="link" data-act="lang">' + (IS.lang === 'ar' ? 'English' : 'العربية') + '</button></b></li></ul>' +
        '<p class="mut">' + esc(A('لتغيير كلمة المرور أو رقم الهاتف راسل دعم المنصة.', 'To change your password or phone number, message platform support.')) + '</p><button class="btn ghost" data-act="ticket" data-k="general" data-s="' + esc(A('مساعدة في حسابي', 'Help with my account')) + '">' + ic('chat') + esc(A('راسل الدعم', 'Message support')) + '</button> <a class="btn ghost" href="#security">' + ic('shield') + esc(A('الأمان', 'Security')) + '</a></section>';
    } else {
      h += '<div class="grid g2"><section class="box"><header class="sh"><h2>' + ic('user') + IS.T('المعلومات الشخصية', 'Personal information') + '</h2><button class="link" data-act="editme">' + ic('pen') + esc(A('تعديل', 'Edit')) + '</button></header><ul class="kv">' +
        [[A('الاسم الكامل', 'Full name'), m.name], [A('البريد الإلكتروني', 'Email'), m.email], [A('رقم الهاتف', 'Phone'), m.phone], [A('الجامعة', 'University'), m.university], [A('السنة الدراسية', 'Year'), m.year]].map(function (r) { return '<li><span>' + esc(r[0]) + '</span><b dir="auto">' + esc(r[1] || '—') + '</b></li>'; }).join('') +
        '<li><span>' + esc(A('الاهتمامات', 'Interests')) + '</span><span class="tags">' + (m.interests || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</span></li></ul></section>' +
        '<div><section class="box"><header class="sh"><h2>' + ic('user') + IS.T('نبذة عني', 'About me') + '</h2><button class="link" data-act="editme">' + ic('pen') + esc(A('تعديل', 'Edit')) + '</button></header><p class="pre">' + esc(m.bio || A('اكتب نبذة قصيرة عنك.', 'Write a short note about yourself.')) + '</p></section>' +
        '<section class="box"><h2>' + ic('trophy') + IS.T('الإنجازات', 'Achievements') + '</h2><ul class="learn">' + (s.done.length ? s.done.slice(0, 3).map(function (c) { return '<li>' + ic('checkc') + esc(A('إتمام كورس ', 'Completed ')) + esc(c.title) + '</li>'; }).join('') : '') +
        (s.events ? '<li>' + ic('checkc') + esc(A('التسجيل في ', 'Registered for ')) + N(s.events) + ' ' + esc(A('فعاليات', 'events')) + '</li>' : '') + (s.lessons ? '<li>' + ic('checkc') + esc(A('إنهاء ', 'Finished ')) + N(s.lessons) + ' ' + esc(A('درس', 'lessons')) + '</li>' : '<li class="mut">' + esc(A('تظهر إنجازاتك هنا عندما تبدأ التعلّم.', 'Your achievements appear here once you start learning.')) + '</li>') + '</ul></section></div></div>';
      h += '<div class="grid g3 lecrow">' + (IS.LEC ? '<section class="box lecjoin">' + ic('studio') + '<h2>' + IS.T('أنت محاضر في اشرح لي', 'You are a lecturer on Ishrah Li') + '</h2><a class="btn pri" href="#studio">' + esc(A('افتح استوديو المحاضر', 'Open the lecturer studio')) + '</a></section>' :
        '<section class="box lecjoin"><img src="img/teach.svg" alt=""><h2>' + IS.T('التسجيل كمحاضر', 'Become a lecturer') + '</h2><p>' + esc(A('قدّم طلبك للانضمام إلى فريق المحاضرين في اشرح لي', 'Apply to join the lecturers of Ishrah Li')) + '</p><a class="btn pri" href="#studio-apply">' + ic('chev', 'fr') + esc(ap ? A('عرض طلبي', 'View my request') : A('تقديم طلب محاضر', 'Apply as a lecturer')) + '</a></section>') +
        '<section class="box"><h2>' + ic('file') + IS.T('متطلبات التسجيل كمحاضر', 'Requirements to become a lecturer') + '</h2>' + IS.lecReqs() + '</section>' +
        '<section class="box"><h2>' + ic('cert') + IS.T('حالة طلب المحاضر', 'Lecturer request status') + '</h2>' + IS.appSteps(ap) + '</section></div>';
    }
    h += '</div></div>';
    IS.after = function () { var f = $('#myPhoto'); if (f) f.onchange = async function () { if (!f.files[0]) return; var u = await DB.upload('media', await IS.shrink(f.files[0], 480, 0.85)); await DB.upd('profiles', m.id, { photo: u }); await IS.loadMe(); IS.toast(A('تم تحديث الصورة', 'Photo updated')); IS.refresh(); }; };
    return h;
  }, { auth: true });
  IS.lecReqs = function () {
    return '<ul class="learn">' + [A('البيانات الأساسية (الاسم، البريد، الهاتف)', 'Basic details (name, email, phone)'), A('المؤهل العلمي (MBBS/MD أو أعلى)', 'Qualification (MBBS/MD or higher)'), A('التخصص والخبرة السريرية/الأكاديمية', 'Specialty and clinical/academic experience'),
      A('السيرة الذاتية (CV)', 'Curriculum vitae (CV)'), A('الشهادات والدورات ذات الصلة (اختياري)', 'Relevant certificates and courses (optional)'), A('عينة من المحتوى التعليمي (محاضرة مسجلة أو عرض)', 'A sample of your teaching (a recorded lecture or slides)'), A('خطة الكورس المقترح (العنوان، الأهداف، المحتوى)', 'Plan of the proposed course (title, aims, content)')].map(function (x) { return '<li>' + ic('checkc') + esc(x) + '</li>'; }).join('') + '</ul>';
  };
  IS.appSteps = function (ap) {
    var st = !ap ? 0 : ap.status === 'pending' ? 1 : ap.status === 'approved' ? 3 : 2;
    var steps = [[A('تقديم الطلب', 'Request sent'), ap ? A('تم إرسال الطلب بنجاح', 'Your request was sent') + ' · ' + IS.date(ap.created_at) : A('لم تقدّم طلبًا بعد', 'Not sent yet')],
      [A('قيد المراجعة', 'Under review'), A('مراجعة من قبل فريق المنصة', 'Reviewed by the platform team')],
      [ap && ap.status === 'rejected' ? A('لم يُقبل الطلب', 'Not accepted') : A('الموافقة', 'Approval'), ap && ap.status === 'rejected' ? (ap.note || A('يمكنك التقديم مرة أخرى.', 'You can apply again.')) : A('سيصلك إشعار بالنتيجة', 'You will be notified of the result')]];
    return '<ol class="tl">' + steps.map(function (s, i) { var cls = i < st ? 'ok' : i === st ? 'cur' : ''; if (i === 2 && ap && ap.status === 'rejected') cls = 'bad'; return '<li class="' + cls + '"><span>' + ic(cls === 'ok' ? 'check' : cls === 'bad' ? 'x' : cls === 'cur' ? 'clock' : 'chev') + '</span><div><b>' + esc(s[0]) + '</b><small>' + esc(s[1]) + '</small></div></li>'; }).join('') + '</ol>';
  };
  /* Edit profile (owner, 18 Nov 2026: "the profile shows a phone number but there is no place for it"): the way the student signs in (email or
     phone) is shown locked; the other one can be added or changed here */
  IS.ACT.editme = async function () {
    var m = me(), kind = await DB.authKind(), lock = '<small class="lockn">' + ic('lock') + esc(A('تُستعمل لتسجيل الدخول', 'Used to sign in')) + '</small>';
    var phoneF = '<label class="fl"><span>' + ic('phone') + esc(A('رقم الهاتف', 'Phone number')) + '</span><span class="pre" dir="ltr"><em>🇸🇩 +249</em><input name="phone" inputmode="tel" autocomplete="tel" dir="ltr" placeholder="9xxxxxxxx" value="' + esc((m.phone || '').replace(/^0/, '')) + '"' + (kind === 'phone' ? ' readonly' : '') + '></span>' + (kind === 'phone' ? lock : '') + '</label>';
    var mailF = '<label class="fl"><span>' + ic('mail') + esc(A('البريد الإلكتروني', 'Email')) + '</span><input name="email" type="email" dir="ltr" autocomplete="email" value="' + esc(m.email || '') + '"' + (kind === 'email' ? ' readonly' : '') + '>' + (kind === 'email' ? lock : '') + '</label>';
    IS.sheet(esc(A('تعديل الملف الشخصي', 'Edit profile')), '<form class="form" data-form="me"><input type="hidden" name="akind" value="' + kind + '"><label class="fl"><span>' + esc(A('الاسم الكامل', 'Full name')) + '</span><input name="name" required value="' + esc(m.name) + '"></label>' +
      '<div class="g2f">' + mailF + phoneF + '</div><div class="g2f"><label class="fl"><span>' + esc(A('الجامعة', 'University')) + '</span>' + IS.pick('university', ['University of Khartoum', 'Shendi University', 'Al Neelain University', 'Omdurman Islamic University', 'University of Gezira', 'Sudan University of Science and Technology', 'National Ribat University', 'Alzaiem Alazhari University', 'University of Medical Sciences and Technology', 'Omdurman Ahlia University', 'University of Kordofan', 'Kassala University', 'Nile Valley University', 'Sinnar University', 'University of Bahri', 'Ahfad University for Women', 'Red Sea University', 'Dongola University', 'University of El Imam El Mahdi', 'Karary University'], m.university) + '</label>' +
      '<label class="fl"><span>' + esc(A('السنة الدراسية', 'Year')) + '</span><select name="year">' + ['', 'السنة الأولى', 'السنة الثانية', 'السنة الثالثة', 'السنة الرابعة', 'السنة الخامسة', 'السنة السادسة', 'طبيب امتياز', 'طبيب عمومي', 'نائب اختصاصي', 'أخصائي'].map(function (y) { return '<option' + (m.year === y ? ' selected' : '') + '>' + esc(y) + '</option>'; }).join('') + '</select></label></div>' +
      '<label class="fl"><span>' + esc(A('المدينة', 'City')) + '</span>' + IS.pick('city', ['Khartoum', 'Omdurman', 'Khartoum North (Bahri)', 'Port Sudan', 'Wad Madani', 'Shendi', 'Atbara', 'Kassala', 'Gedaref', 'El Obeid', 'Kosti', 'Sennar', 'Dongola', 'Ed Damer', 'Nyala', 'El Fasher'], m.city) + '</label><label class="fl"><span>' + esc(A('الاهتمامات (افصل بفاصلة)', 'Interests (comma separated)')) + '</span><input name="interests" value="' + esc((m.interests || []).join('، ')) + '"></label>' +
      '<label class="fl"><span>' + esc(A('نبذة عني', 'About me')) + '</span><textarea name="bio" rows="3" maxlength="600">' + esc(m.bio || '') + '</textarea></label><button class="btn pri wide">' + esc(A('حفظ', 'Save')) + '</button></form>');
  };
  IS.SUB.me = async function (d) {
    var ph = DB.digits(d.phone || ''); if (ph && ph.length < 9) return IS.toast(A('اكتب رقم هاتف صحيح.', 'Enter a valid phone number.'));
    var row = { name: d.name, university: d.university, year: d.year, city: d.city, bio: d.bio, interests: d.interests.split(/[،,]/).map(function (x) { return x.trim(); }).filter(Boolean) };
    if (d.akind !== 'phone') row.phone = ph ? ph.replace(/^(?!0)/, '0') : ''; if (d.akind !== 'email') row.email = String(d.email || '').trim().toLowerCase();
    await DB.upd('profiles', me().id, row); await IS.loadMe(); IS.closeSheet(); IS.toast(A('حُفظ', 'Saved')); IS.refresh(); };

  /* ========== ABOUT, TERMS ========== */
  IS.page('about', async function () {
    var cs = await IS.pubCourses(), ls = await DB.q('lecturers', { eq: { status: 'active' } });
    return IS.banner(IS.T('عن المنصة', 'About the platform'), esc(A('تعرّف على منصة اشرح لي، رؤيتنا، رسالتنا وما نقدّمه لطلبة الطب في السودان', 'Meet Ishrah Li: our vision, mission and what we offer medical students in Sudan')), 'info') +
      feats() + '<section class="box about"><div><h2>' + IS.T('ما هي منصة اشرح لي؟', 'What is Ishrah Li?') + '</h2><p>' + esc(A('منصة تعليمية طبية سودانية متكاملة، صُممت خصيصًا لطلبة كليات الطب في السودان. توفر كورسات ومحاضرات ومراجعات واختبارات ومواد تعليمية عالية الجودة بإشراف نخبة من الأطباء والأكاديميين، لمساعدتك على فهم المناهج واجتياز الامتحانات والتفوق في مسيرتك الطبية.', 'A complete Sudanese medical learning platform for medical students: courses, lectures, reviews, tests and learning material of high quality by doctors and academics, to help you understand the curriculum, pass your exams and excel in your medical career.')) + '</p></div><img src="' + IS.logo() + '" alt=""></section>' +
      '<div class="grid g3">' + [['target', A('رؤيتنا', 'Our vision'), A('أن نكون المنصة التعليمية الرائدة لطلبة الطب في السودان والمنطقة، ونساهم في إعداد أطباء أكفاء يخدمون مجتمعهم بتميز.', 'To be the leading learning platform for medical students in Sudan and the region, preparing competent doctors who serve their community.')],
        ['send', A('رسالتنا', 'Our mission'), A('تقديم محتوى تعليمي طبي موثوق، شامل وسهل الوصول، يجمع بين الأساسيات النظرية والتطبيق السريري، بدعم من نخبة من المحاضرين والأطباء.', 'To provide reliable, complete and accessible medical education that joins theory and clinical practice, by the best lecturers and doctors.')],
        ['shield', A('قيمنا', 'Our values'), A('الجودة والمصداقية · دعم الطلبة وتكافؤ الفرص · التعاون ونشر المعرفة · خدمة المجتمع الطبي في السودان', 'Quality and trust · Supporting students and equal opportunity · Cooperation and sharing knowledge · Serving the medical community in Sudan')]].map(function (r) { return '<section class="box"><h2>' + ic(r[0]) + esc(r[1]) + '</h2><p>' + esc(r[2]) + '</p></section>'; }).join('') + '</div>' +
      '<section class="sec"><header class="sh"><h2>' + IS.T('أبرز ما تقدّمه المنصة', 'What the platform offers') + '</h2></header><div class="offers">' + [['route', A('مسارات تعليمية منظمة', 'Organised learning paths')], ['qb', A('اختبارات وبنوك أسئلة', 'Tests and question banks')], ['video', A('محاضرات فيديو مسجلة ومباشرة', 'Recorded and live lectures')], ['open', A('ملخصات وملفات دراسية', 'Summaries and study notes')],
        ['layers', A('كورسات شاملة', 'Complete courses')], ['users', A('نخبة من المحاضرين', 'Expert lecturers')], ['cal', A('فعاليات وورش عمل', 'Events and workshops')], ['cert', A('شهادات إتمام', 'Certificates')]].map(function (r) { return '<div class="ft">' + ic(r[0]) + '<b>' + esc(r[1]) + '</b></div>'; }).join('') + '</div></section>' +
      '<div class="cols"><div class="main"><section class="box"><h2>' + ic('users') + IS.T('لمن تناسب المنصة؟', 'Who is it for?') + '</h2><ul class="learn">' + [A('طلبة كليات الطب في السودان', 'Medical students in Sudan'), A('خريجو الطب (House Officers)', 'House officers'), A('المتقدمون لامتحان التسجيل بالمجلس الطبي السوداني', 'Candidates for the Sudan Medical Council exam'), A('الراغبون في اختبارات خاصة (USMLE, PLAB, MRCP …)', 'Those preparing for USMLE, PLAB, MRCP …')].map(function (x) { return '<li>' + ic('checkc') + esc(x) + '</li>'; }).join('') + '</ul></section>' +
      '<section class="box"><h2>' + ic('help') + IS.T('الأسئلة الشائعة', 'FAQ') + '</h2>' + [[A('كيف أدفع ثمن الكورس؟', 'How do I pay for a course?'), A('بالتحويل عبر بنكك ثم إرسال صورة الإيصال من صفحة الكورس. يُفتح الكورس بعد تأكيد فريق المدفوعات.', 'By a Bankak transfer, then sending the receipt picture from the course page. The course opens once the payments team confirms it.')],
        [A('هل يمكن تنزيل الفيديوهات؟', 'Can I download the videos?'), A('لا. المحتوى يُشاهد داخل التطبيق فقط حفاظًا على حقوق المحاضرين.', 'No. Content is watched inside the app only, to protect the lecturers’ rights.')],
        [A('كيف أصبح محاضرًا؟', 'How do I become a lecturer?'), A('أنشئ حسابًا كمحاضر وقدّم طلبك مع سيرتك الذاتية وعينة من محتواك. بعد الموافقة تصمّم صفحتك وترفع كورساتك.', 'Create a lecturer account and apply with your CV and a sample. Once approved, design your page and upload your courses.')],
        [A('كيف يحصل المحاضر على أرباحه؟', 'How are lecturers paid?'), A('لكل محاضر نسبة من كل اشتراك في كورساته، ويرى رصيده في الاستوديو، ويحوّل له فريق المالية دوريًا.', 'Each lecturer receives a share of every enrolment in their courses, sees the balance in the studio and is paid regularly by the finance team.')]].map(function (q) { return '<details class="faq"><summary>' + esc(q[0]) + ic('down') + '</summary><p>' + esc(q[1]) + '</p></details>'; }).join('') + '</section></div>' +
      '<aside class="aside">' + statsBox(cs, ls) + '<section class="box"><h2>' + ic('mail') + IS.T('تواصل معنا', 'Contact us') + '</h2><p class="mut">' + esc(A('راسل فريق المنصة من داخل التطبيق، ويصلك الرد في الإشعارات.', 'Message the platform team inside the app; the answer arrives in your notifications.')) + '</p><button class="btn pri wide" data-act="ticket">' + ic('chat') + esc(A('أرسل رسالة', 'Send a message')) + '</button></section></aside></div>' +
      steps() + '<div class="row center"><a class="btn pri" href="#courses">' + ic('play') + esc(A('استعرض الكورسات الآن', 'Browse the courses')) + '</a>' + (me() ? '' : '<button class="btn ghost" data-act="register">' + ic('user') + esc(A('انضم إلى المنصة', 'Join the platform')) + '</button>') + '</div>';
  });
  IS.page('terms', async function () {
    return IS.banner(IS.T('شروط الاستخدام وسياسة الخصوصية', 'Terms of use and privacy policy'), '', 'shield') + '<section class="box rich">' + [
      [A('الحساب', 'Your account'), A('الحساب شخصي ولا يجوز مشاركته. أنت مسؤول عن صحة بياناتك وعن سرية كلمة المرور.', 'Your account is personal and may not be shared. You are responsible for your details and for keeping your password secret.')],
      [A('المحتوى', 'Content'), A('كل الكورسات والفيديوهات ملك لمحاضريها، وتُشاهد داخل المنصة فقط. يُمنع تسجيلها أو نسخها أو نشرها، ويؤدي ذلك إلى إيقاف الحساب.', 'Courses and videos belong to their lecturers and are watched inside the platform only. Recording, copying or sharing them is forbidden and leads to the account being blocked.')],
      [A('الدفع', 'Payment'), A('يُفتح الكورس بعد تأكيد التحويل. في حال رفض الطلب يُذكر السبب، ويمكن التواصل مع الدعم.', 'A course opens after the transfer is confirmed. If a request is rejected the reason is given, and you can contact support.')],
      [A('المجتمع', 'Community'), A('الاحترام واجب. يحق للمشرفين حذف أي مشاركة مخالفة وإيقاف من يكرر المخالفة. لا تُقدَّم نصائح علاجية لمرضى حقيقيين.', 'Respect is required. Moderators may remove breaking posts and block repeat offenders. No treatment advice for real patients.')],
      [A('الخصوصية', 'Privacy'), A('نجمع الاسم والهاتف والبريد وبيانات التعلّم لتشغيل خدمتك فقط، ولا نبيعها لأي جهة. إيصالات الدفع يطّلع عليها فريق المالية فقط.', 'We collect your name, phone, email and learning data only to run the service, and never sell them. Payment receipts are seen by the finance team only.')],
      [A('المحاضرون', 'Lecturers'), A('يلتزم المحاضر بصحة المحتوى العلمي وبحقوق الملكية. تراجع المنصة كل كورس قبل نشره، وتُحتسب أرباح المحاضر بنسبته المتفق عليها.', 'Lecturers are responsible for accurate content and for rights. The platform reviews each course before publishing; earnings are paid at the agreed share.')]].map(function (s) { return '<h3>' + esc(s[0]) + '</h3><p>' + esc(s[1]) + '</p>'; }).join('') + '</section>';
  });
})();
