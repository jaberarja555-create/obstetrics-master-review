/* اشرح لي: the student side. Every list comes from the database (published courses, active lecturers, real counts). */
(function () {
  'use strict';
  var A = IS.A, esc = IS.esc, ic = IS.ic, N = IS.N, $ = IS.$;
  function me() { return IS.ME; }
  function uid() { return IS.ME && IS.ME.id; }
  /* ---------- data helpers ---------- */
  IS.studyScope = function (item) {
    var subject = IS.subj(item.subject);
    return { spec: (subject && subject.spec) || item.spec || 'medicine', cat: (subject && subject.cat) || item.cat || '' };
  };
  IS.inStudySpace = function (item) {
    var scope = IS.studyScope(item), section = IS.mySection();
    return (!IS.SPEC || scope.spec === IS.SPEC) && (!section || scope.cat === section.id);
  };
  IS.outsideStudySpace = function (item) {
    var scope = IS.studyScope(item), spec = IS.spec(scope.spec), section = IS.cat(scope.cat);
    var action = spec && section && !IS.inStudySpace(item) ? '<button class="btn pri" data-act="open-study-space" data-spec="' + esc(spec.id) + '" data-v="' + esc(section.id) + '">' +
      esc(A('انتقل إلى ', 'Switch to ') + spec.en + ' · ' + A(section.ar, section.en)) + '</button>' : '';
    return IS.empty('layers', A('هذا المحتوى خارج القسم الحالي', 'This content is outside your current section'), '', action);
  };
  IS.ACT['open-study-space'] = function (b) {
    var spec = IS.spec(b.getAttribute('data-spec')), section = IS.cat(b.getAttribute('data-v'));
    if (!spec || !section) return;
    if (IS.SPEC !== spec.id) IS.setSpec(spec.id);
    IS.setSection(section.id);
    IS.route();
  };
  IS.pubCourses = function (all) { return DB.q('courses', { eq: { status: 'published' }, order: ['published_at', false] }).then(function (cs) { return !all && IS.area === 'student' ? cs.filter(IS.inStudySpace) : cs; }); };
  IS.legacyTeachingSpec = function (lecturer) {
    var field = IS.norm(lecturer.specialty || '');
    var exact = IS.SPECS.find(function (spec) { return field && [spec.id, spec.en, spec.ar].some(function (name) { return field === IS.norm(name); }); });
    if (exact) return exact.id;
    var subject = IS.SUBJ.find(function (row) { return field && (field === IS.norm(row.en) || field === IS.norm(row.ar)); });
    if (subject) return subject.spec;
    var inferred = [
      ['dentistry', /dent|orthodont|prosthodont|endodont|periodont|اسنان|الاسنان|الفم/],
      ['nursing', /nurs|midwi|تمريض|قابله/],
      ['pharmacy', /pharm|صيدل/],
      ['lab', /laborator|lab science|medical microbiology|blood bank|haematolog|hematolog|مختبر/]
    ].find(function (item) { return item[1].test(field); });
    return inferred ? inferred[0] : 'medicine';
  };
  IS.studyLecturers = function (lecturers, courses) {
    var listed = new Set(courses.map(function (c) { return c.lecturer_id; }));
    var current = new Set(courses.filter(IS.inStudySpace).map(function (c) { return c.lecturer_id; }));
    return lecturers.filter(function (lecturer) {
      if (lecturer.status !== 'active') return false;
      if ((lecturer.teaching_spaces || []).length) {
        var section = IS.mySection();
        return !IS.SPEC || (section ? lecturer.teaching_spaces.includes(IS.SPEC + '/' + section.id) : lecturer.teaching_specs.includes(IS.SPEC));
      }
      if (listed.has(lecturer.id)) return current.has(lecturer.id);
      return !IS.SPEC || IS.legacyTeachingSpec(lecturer) === IS.SPEC;
    });
  };
  IS.inSpec = function (x) { return !IS.SPEC || !x || !x.spec || x.spec === IS.SPEC; };
  IS.lecMap = async function () { var l = await DB.q('lecturers'); var m = {}; l.forEach(function (x) { m[x.id] = x; }); return m; };
  IS.myEnroll = async function () {
    if (!uid()) return {};
    var rows = await DB.q('enrollments', { eq: { user_id: uid() }, order: ['created_at', false] }), latest = {};
    rows.forEach(function (e) {
      if (e.course_id && (!latest[e.course_id] || (e.status === 'active' && latest[e.course_id].status !== 'active'))) latest[e.course_id] = e;
    });
    return latest;
  };
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
  function price(c) { return +c.price > 0 ? '<small class="course-price-type">' + esc(A('مدفوع', 'Paid')) + '</small>' + IS.money(c.price) :
    '<b class="free">' + esc(A('مجاني', 'Free')) + '</b>'; }
  function lecName(l) { return l ? l.name : ''; }

  /* ---------- course card ---------- */
  IS.courseCard = function (c, L, E) {
    var l = L && L[c.lecturer_id], e = E && E[c.id], cat = IS.cat(IS.studyScope(c).cat), sj = IS.subj(c.subject);
    return '<article class="ccard" style="--cc:' + esc(c.color || 'var(--pri)') + '"><a class="ccimg" href="#course/' + c.id + '">' + (c.cover ? '<img src="' + IS.U(c.cover) + '" alt="" loading="lazy">' : '<span class="ph">' + ic(sj ? sj.icon : 'layers') + '</span>') +
      '<span class="cctop">' + (cat ? IS.chip(esc(A(cat.ar, cat.en)), 'lt') : '') + (c.n_students >= 50 ? IS.chip(ic('flame') + esc(A('الأكثر تسجيلًا', 'Popular')), 'hot') : '') + '</span></a>' + IS.favBtn('c:' + c.id, true) +
      '<div class="ccb"><h3><a href="#course/' + c.id + '">' + esc(c.title) + '</a></h3><p>' + esc(c.subtitle || '') + '</p>' +
      (l ? '<a class="cclec" href="#lecturer/' + l.id + '">' + IS.av(l, 'xs', l.id) + '<span>' + esc(l.name) + '</span></a>' : '') +
      '<div class="ccst">' + (c.n_reviews ? '<span>' + ic('star', 'gold') + N(c.rating) + ' <small>(' + N(c.n_reviews) + ')</small></span>' : '') + '<span>' + ic('video') + N(c.n_lessons || 0) + ' ' + esc(A('درس', 'lessons')) + '</span>' +
      (c.minutes ? '<span>' + ic('clock') + hrs(c.minutes) + '</span>' : '') + (c.n_students ? '<span>' + ic('users') + N(c.n_students) + '</span>' : '') + '</div>' +
      '<div class="ccf"><span class="price">' + price(c) + '</span>' + (e && e.status === 'active' ? '<a class="btn sm pri" href="#course/' + c.id + '">' + ic('play') + esc(A('تابع', 'Continue')) + '</a>' : e && e.status === 'pending' ? IS.status('pending') : '<a class="btn sm pri" href="#course/' + c.id + '">' + esc(A('التحق بالكورس', 'Enrol')) + '</a>') + '</div></div></article>';
  };
  function lecCard(l, n) {
    return '<article class="lcard" style="--cc:' + esc(l.color || 'var(--pri)') + '">' + IS.favBtn('t:' + l.id, true) + '<a href="#lecturer/' + l.id + '" class="lcav">' + IS.av(l, 'lg', l.id) + '</a><h3><a href="#lecturer/' + l.id + '">' + esc(l.name) + '</a> ' + ic('checkc', 'verified') + '</h3>' +
      '<p>' + esc(l.title || l.specialty || '') + '</p>' + IS.seen(l.id) + '<div class="tags">' + (l.tags || []).slice(0, 3).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' +
      '<div class="lcst"><span>' + ic('layers') + N(n || 0) + ' ' + esc(A('كورس', 'courses')) + '</span>' + (l.n_students ? '<span>' + ic('users') + N(l.n_students) + '</span>' : '') + '</div>' +
      '<div class="row"><a class="btn sm pri" href="#lecturer/' + l.id + '">' + esc(A('عرض الملف', 'View profile')) + '</a></div></article>';
  }

  /* ========== HOME (navy and gold design, owner 18 Nov 2026) ========== */
  var SECTION_PICTURES = {
    medicine: { basics: 'sec_basics', clinical: 'sec_clinical', special: 'sec_special', house: 'sec_house' },
    lab: { basics: 'sub_clin-chem', clinical: 'sub_histopath', special: 'sub_haematology', house: 'sub_blood-bank' },
    dentistry: { basics: 'sub_oral-anat', clinical: 'sub_operative', special: 'sub_ortho', house: 'sub_omfs' },
    nursing: { basics: 'sub_nurs-fund', clinical: 'sub_nurs-medsurg', special: 'sub_nurs-comm', house: 'sub_nurs-mat' },
    pharmacy: { basics: 'sub_pharmaceutics', clinical: 'sub_clin-pharm', special: 'sub_ph-pharmacology', house: 'sub_pharm-chem' }
  };
  function sectionPicture(speciality, section) {
    var image = ((SECTION_PICTURES[speciality.id] || {})[section]);
    return image ? 'img/' + image + '.webp' : speciality.img;
  }
  var FEATS = [['layers', 'محتوى متكامل', 'Complete content', 'لكل التخصصات الصحية', 'For every health speciality'], ['play', 'كورسات وندوات', 'Courses & seminars', 'شرح ومراجعات متخصصة', 'Lessons and focused reviews'],
    ['open', 'مكتبة رقمية', 'Digital library', 'كتب ومراجع وملخصات', 'Books, references and summaries'], ['group', 'مجتمع طلابي', 'Student community', 'تواصل وتبادل الخبرات', 'Connect and share experience'], ['help', 'خدمات أكاديمية', 'Academic services', 'دعم وإرشاد ومساعدة بحثية', 'Support, guidance and research help']];
  function feats() { return '<section class="feats">' + FEATS.map(function (f) { return '<div class="feat">' + ic(f[0]) + '<b>' + IS.T(f[1], f[2]) + '</b><small>' + esc(A(f[3], f[4])) + '</small></div>'; }).join('') + '</section>'; }
  IS.feats = feats;
  var STEPS = [['user', 'أنشئ حسابك', 'Create your account', 'بحساب Google أو برقم هاتفك خلال دقيقة.', 'With Google or your phone number in a minute.'],
    ['grid', 'اختر تخصصك وكورسك', 'Choose your speciality and course', 'تصفّح الكورسات حسب التخصص والمادة والمحاضر.', 'Browse by speciality, subject and lecturer.'],
    ['receipt', 'ادفع عبر بنكك', 'Pay with Bankak', 'حوّل المبلغ وارفع صورة الإيصال؛ يفتح الكورس بعد المراجعة.', 'Transfer, upload the receipt; the course opens after review.'],
    ['cert', 'تعلّم واحصل على شهادتك', 'Learn and earn your certificate', 'دروس، اختبارات، ملاحظات، ثم شهادة إتمام.', 'Lessons, quizzes and notes, then a certificate.']];
  function steps() { return '<section class="hiw"><header><h2>' + IS.T('كيف تبدأ', 'How it works') + '</h2><p>' + esc(A('أربع خطوات بسيطة تفصلك عن أول كورس.', 'Four simple steps to your first course.')) + '</p></header><ol>' + STEPS.map(function (s, i) {
    return '<li><span class="hn">' + ic(s[0]) + '<i>' + N(i + 1) + '</i></span><b>' + esc(A(s[1], s[2])) + '</b>' + '<p>' + esc(A(s[3], s[4])) + '</p></li>'; }).join('') + '</ol></section>'; }
  /* Student home for the selected speciality and section. */
  var QUICK = [['courses', 'layers', 'الكورسات', 'Courses'], ['learning', 'bookmark', 'تعلّمي', 'My learning'], ['events', 'cal', 'الفعاليات', 'Events'], ['lecturers', 'users', 'المحاضرون', 'Lecturers'],
    ['course-requests', 'chat', 'الطلبات', 'Requests'], ['library', 'open', 'مكتبتي', 'My Library'], ['community', 'group', 'المجتمع', 'Community'], ['studio-apply', 'studio', 'علّم معنا', 'Teach']];
  IS.page('home', async function () {
    var m = me(), spec = IS.mySpec(), section = IS.mySection();
    var name = m && IS.greetingName(m.name, true);
    var who = name ? esc(A('مرحبًا ', 'Welcome, ')) + name + ' 👋' : esc(A('مرحبًا بك 👋', 'Welcome 👋'));
    var h = '<div class="lh">' +
      '<section class="lhh"><img class="lhl" src="' + IS.logo() + '" alt=""><img class="lhl2" src="' + IS.logo() + '" alt=""><div class="lht"><p>' + who + '</p><h1 tabindex="-1">' + (section ? IS.T(section.ar, section.en) : '<span class="gtx">' + esc(IS.brandName()) + '</span>') + '</h1>' +
      (spec ? '<small lang="en">' + esc(spec.en) + '</small>' : '') + (m && IS.myRoles().length > 1 ? IS.roleChips('hr') : '') + '</div>' +
      '<div class="lhx"><form class="hsearch" role="search" data-form="search"><span>' + ic('search') + '</span><input name="q" type="search" placeholder="' + esc(A('ابحث عن كورس، مادة، محاضر أو موضوع…', 'Search a course, subject, lecturer or topic…')) + '"><button class="btn pri">' + esc(A('بحث', 'Search')) + '</button></form>' +
      (m ? '' : '<div class="row"><button class="btn pri sm" data-act="register">' + ic('user') + esc(A('أنشئ حسابك مجانًا', 'Create your free account')) + '</button><button class="btn lt sm" data-act="login">' + esc(A('تسجيل الدخول', 'Sign in')) + '</button></div>') + '</div></section>' +
'<nav class="lhq" aria-label="' + esc(A('الأقسام', 'Places')) + '">' + QUICK.map(function (q) { return q[0] === 'studio-apply' && IS.LEC ? ['studio', 'studio', 'الاستوديو', 'My studio'] : q; }).map(function (q) { return '<a href="#' + q[0] + '"><i>' + ic(q[1]) + '</i>' + IS.navLbl(q[2], q[3]) + '</a>'; }).join('') + '</nav></div>';
    return h + (section ? await sectionHome(section) : '');
  });

  IS.page('specialties', async function () { IS.go('pick'); return ''; });
  IS.page('specialties-old', async function () { IS.go('pick'); return ''; });
  IS.page('spec', async function (id) {
    if (IS.spec(id) && id !== IS.SPEC) IS.setSpec(id);
    IS.go('pick-section');
    return '';
  });
  IS.page('pick-section', async function () {
    var spec = IS.mySpec(), current = IS.mySection();
    if (!spec) return IS.empty('grid', A('اختر تخصصك أولًا', 'Choose your speciality first'), '', '<a class="btn pri" href="#pick">' + esc(A('التخصصات', 'Specialities')) + '</a>');
    IS.after = fitSectionPicker;
    return '<div class="section-picker"><header class="section-picker-heading">' + ic('layers') + '<h1 tabindex="-1">' +
      IS.T('اختر قسمك', 'Choose your section') + '</h1></header><nav class="section-picker-grid" aria-label="' + esc(A('أقسام التخصص', 'Study sections')) + '">' + IS.CATS.map(function (c) {
      var img = sectionPicture(spec, c.id), selected = current && current.id === c.id;
      return '<a class="section-choice" href="#home" data-act="setsection" data-v="' + esc(c.id) + '"' + (selected ? ' aria-current="true"' : '') + '>' +
        '<span class="section-choice-art">' + (img ? '<img src="' + img + '" alt="">' : ic(c.icon)) + '</span>' +
        '<span class="section-choice-label">' + IS.navLbl(c.ar, c.en) + '</span>' +
        (selected ? '<span class="section-choice-current" title="' + esc(A('قسمك الحالي', 'Current section')) + '">' + ic('check') + '</span>' : '') + '</a>';
    }).join('') + '</nav></div>';
  });
  function fitSectionPicker() {
    var picker = IS.$('#main .section-picker'); if (!picker) return;
    var main = IS.$('#main'), tabs = IS.$('#tabs'), bottom = window.innerHeight;
    if (tabs.getClientRects().length && getComputedStyle(tabs).position === 'fixed') bottom = Math.min(bottom, tabs.getBoundingClientRect().top);
    var zoom = parseFloat(getComputedStyle(main).zoom) || 1;
    picker.style.setProperty('--section-height', Math.floor((bottom - (picker.getBoundingClientRect().top + window.scrollY) - 10) / zoom) + 'px');
  }
  window.addEventListener('resize', fitSectionPicker);
  IS.ACT.setsection = function (b) {
    if (!IS.setSection(b.getAttribute('data-v'))) return;
    if (/^#(?:course|course-request|lesson|lecturer|file|path|cert|post)\//.test(location.hash)) IS.route();
    else IS.go('home');
  };
  function subjectCard(subject, index, courses) {
    var n = courses.filter(function (c) { return c.subject === subject.id; }).length;
    return '<a class="subj s' + (index % 7) + (subject.img ? ' pic' : '') + '" href="#courses/' + esc(subject.cat) + '/' + esc(subject.id) + '">' +
      (subject.img ? '<span class="sjp"><img src="' + IS.U(subject.img) + '" alt="" loading="lazy"></span>' : '<span>' + ic(subject.icon) + '</span>') +
      '<span class="sjt"><b lang="en">' + esc(subject.en) + '</b>' +
      '<em>' + (n ? IS.cnt(n, 'course') : esc(A('قريبًا', 'Soon'))) + '</em></span></a>';
  }
  var FEED_TYPES = {
    course: ['الكورسات', 'Courses', 'layers'], announcement: ['الإعلانات', 'Announcements', 'mega'],
    request: ['الطلبات', 'Requests', 'chat'], event: ['الفعاليات', 'Events', 'cal'],
    news: ['الأخبار', 'News', 'news'], discussion: ['النقاشات', 'Discussions', 'group'],
    question: ['الأسئلة', 'Questions', 'help'], course_preview: ['معاينات الكورسات', 'Course previews', 'video'],
    library: ['المكتبة', 'Library', 'open']
  };
  var feedSettings = {};
  async function sectionHome(section) {
    var query = { spec: IS.SPEC, cat: section.id }, key = IS.SPEC + '/' + section.id;
    var results = await Promise.all([IS.pubCourses(), annList(40), IS.sectionCourseRequests(40),
      DB.q('events', { eq: Object.assign({ status: 'published' }, query), order: ['created_at', false], limit: 40 }),
      newsList(40), DB.q('posts', { eq: { room: section.id, spec: IS.SPEC, status: 'open' }, order: ['created_at', false], limit: 40 }),
      IS.sectionLibraryFiles(IS.SPEC, section.id)]);
    var coursesById = new Map(results[0].map(function (course) { return [course.id, course]; }));
    results[5].forEach(function (post) {
      var linked = coursesById.get(post.course_id);
      if (linked) post.linked_price = linked.price;
    });
    var newsLinks = new Set(results[4].map(function (row) { return '#news/' + row.id; }));
    var items = [
      ['course', results[0].slice(0, 80)],
      ['announcement', results[1].filter(function (row) { return !newsLinks.has(row.link); })],
      ['request', results[2]], ['event', results[3]], ['news', results[4]], ['discussion', results[5]], ['library', results[6]]
    ].flatMap(function (group) { return group[1].map(function (row) { return { type: group[0] === 'discussion' ? postKind(row) : group[0], row: row }; }); });
    var preferences = feedSettings[key] || (feedSettings[key] = { sort: 'new', type: 'all' });
    var limit = 12;
    function list() {
      var filtered = items.filter(function (item) { return preferences.type === 'all' || item.type === preferences.type; });
      filtered.sort(function (a, b) {
        var difference = preferences.sort === 'popular' ? feedScore(b) - feedScore(a) :
          preferences.sort === 'new' ? 0 : IS.ratingSort(a.row, b.row, preferences.sort);
        return difference || String(b.row.published_at || b.row.created_at || '').localeCompare(String(a.row.published_at || a.row.created_at || ''));
      });
      return filtered.length ? filtered.slice(0, limit).map(feedCard).join('') +
        (filtered.length > limit ? '<button type="button" class="btn ghost feed-more">' + esc(A('عرض المزيد', 'Show more')) + '</button>' : '') :
        IS.empty('group', A('لا توجد منشورات هنا بعد', 'No updates here yet'));
    }
    function options(type, values) {
      return values.map(function (value) { return '<option value="' + value[0] + '"' + (preferences[type] === value[0] ? ' selected' : '') + '>' + esc(A(value[1], value[2])) + '</option>'; }).join('');
    }
    IS.after = function (main) {
      var stream = main.querySelector('.section-feed'); if (!stream) return;
      var content = stream.querySelector('.feed-items');
      function covers() { IS.hydrateLibraryCovers(content).catch(function () {}); }
      covers();
      stream.querySelectorAll('select[data-feed]').forEach(function (field) {
        field.onchange = function () { preferences[field.dataset.feed] = field.value; limit = 12; content.innerHTML = list(); covers(); };
      });
      content.onclick = function (event) {
        if (event.target.closest('.feed-more')) { limit += 12; content.innerHTML = list(); covers(); }
      };
    };
    return '<section class="section-feed"><header class="feed-toolbar"><h2>' + IS.T('آخر المستجدات', 'Section feed') + '</h2><div class="row">' +
      '<a class="btn pri sm" href="#course-requests/new">' + ic('plus') + esc(A('اطلب كورسًا', 'Request a course')) + '</a>' +
      '<a class="btn ghost sm" href="#community/new">' + ic('pen') + esc(A('اكتب منشورًا', 'Create a post')) + '</a></div>' +
      '<div class="feed-filters"><label><span>' + esc(A('الترتيب', 'Sort by')) + '</span><select class="sel" id="feed-sort" data-feed="sort">' +
      options('sort', [['new', 'الأحدث', 'Newest'], ['popular', 'الأكثر تفاعلًا', 'Popular'],
        ['best', 'الأعلى تقييمًا', 'Best rated'], ['most-rated', 'الأكثر تقييمًا', 'Most rated']]) + '</select></label>' +
      '<label><span>' + esc(A('نوع المنشور', 'Post type')) + '</span><select class="sel" id="feed-type" data-feed="type">' +
      options('type', [['all', 'الكل', 'All posts']].concat(Object.keys(FEED_TYPES).map(function (type) { return [type].concat(FEED_TYPES[type]); }))) +
      '</select></label></div></header><div class="feed-items">' + list() + '</div></section>';
  }
  function feedScore(item) {
    var r = item.row;
    return (Number(r.n_students) || 0) + (Number(r.joined_count) || 0) +
      (Number(r.registered_count) || 0) + (Number(r.n_replies) || 0) + (Number(r.like_count) || 0) +
      (item.type === 'library' ? (Number(r.comment_count) || 0) + (Number(r.rating_count) || 0) : 0);
  }
  function feedCard(item) {
    var row = item.row, type = item.type, label = FEED_TYPES[type], when = row.published_at || row.created_at;
    var isPost = !!row.room && Object.prototype.hasOwnProperty.call(POST_KINDS, type), library = type === 'library';
    var target = isPost ? 'post/' : { course: 'course/', announcement: 'news/ann/', request: 'course-request/', event: 'event/', news: 'news/', library: 'file/' }[type];
    var summary = row.subtitle || row.details || row.body || (row.about || '').replace(/<br\s*\/?\s*>/g, '\n');
    var title = type === 'announcement' && !isPost ? IS.noticeTitle(row) : row.title || A('نقاش', 'Discussion');
    var media = row.preview_image || row.cover;
    var libraryKind = library && IS.libraryKind(row.kind);
    var librarySubject = library && IS.subj(row.subject);
    var details = type === 'event' && row.starts ? esc(IS.date(row.starts, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Khartoum' })) :
      library ? [A(libraryKind[2], libraryKind[3]), librarySubject && librarySubject.en, row.author || row.owner_name].filter(Boolean).map(esc).join(' · ') :
      isPost ? esc(row.name || '') + (row.linked_price != null ? ' · ' + (+row.linked_price ? IS.money(row.linked_price) : esc(A('مجاني', 'Free'))) : '') :
      type === 'request' ? '<bdi dir="ltr">' + esc(((row.payment_required ? row.paid_count : row.joined_count) || 0) + (row.goal ? ' / ' + row.goal : '')) + '</bdi> ' + esc(A('منضمّون', 'joined')) :
      type === 'course' ? [courseFormat(row), +row.price ? IS.money(row.price) : esc(A('مجاني', 'Free')), row.starts_at && courseSchedule(row)].filter(Boolean).join(' · ') : '';
    return '<article class="box feed-card feed-' + type + (isPost ? ' feed-post' : '') + '" data-kind="' + type + '"><header class="feed-card-header"><span>' + ic(label[2]) +
      esc(A(label[0], label[1])) + '</span>' + (when ? '<time datetime="' + esc(when) + '">' + esc(IS.ago(when)) + '</time>' : '') + '</header>' +
      '<div class="feed-card-content">' + (library || media ? '<a class="feed-image" href="#' + target + esc(row.id) + '" aria-label="' + esc(title) + '">' +
        (library ? IS.libraryCover(row) : '<img loading="lazy" src="' + IS.U(media) + '" alt="">') + '</a>' : '') +
      '<div><h3 dir="auto"><a href="#' + target + esc(row.id) + '">' + esc(title) + '</a></h3>' +
      (summary ? '<p class="feed-summary" dir="auto">' + esc(summary.slice(0, 280)) + '</p>' : '') +
      (details ? '<p class="feed-detail">' + details + '</p>' : '') + '</div></div>' +
      (isPost ? postPreview(row, true) + IS.feedVoteBar('post', row) : type === 'request' ? IS.feedVoteBar('request', row) : library ?
        '<div class="row library-feed-actions"><a class="btn ghost sm" href="#file/' + esc(row.id) + '/read">' + ic('open') +
        esc(A('اقرأ داخل التطبيق', 'Read in the app')) + '</a>' + IS.dlBtn('file', row.id) + '</div>' + IS.feedVoteBar('file', row) : '') + '</article>';
  }

  /* ========== START PAGE: sign in and choose a speciality (owner, 18 Nov 2026) ========== */
  IS.page('pick', async function () {
    var m = me(), cur = IS.SPEC;
    var language = IS.lang === 'ar' ? '<span lang="en">English</span>' : '<span lang="ar">العربية</span>';
    var h = '<div class="pick"><header class="pkh"><img src="' + IS.logo() + '" alt="" class="pkl"><div><h1 tabindex="-1"><span class="gtx">' + esc(IS.brandName()) + '</span></h1><p>' + esc(A('منصة تعليمية متكاملة لطلاب الكليات الصحية', 'A complete learning platform for health sciences students')) + '</p></div>' +
      (m ? '<div class="pk-account"><div class="pkme">' + IS.av(m, 'sm') + '<span>' + esc(A('مرحبًا ', 'Welcome, ')) + IS.greetingName(m.name, true) + '</span></div></div>' :
        '<div class="pkin"><button class="btn gold" data-act="login">' + ic('user') + esc(A('تسجيل الدخول', 'Sign in')) + '</button><button class="btn lt" data-act="register">' + esc(A('حساب جديد', 'Create account')) + '</button></div>') + '</header>' +
      '<section class="pkb"><h2>' + IS.T('اختر تخصصك', 'Choose your speciality') + '</h2><p class="mut">' + esc(A('بعد اختيار التخصص، اختر القسم الذي تريد الدراسة فيه.', 'After choosing your speciality, choose the section you want to study in.')) + '</p>' +
      '<div class="pks">' + IS.SPECS.map(function (s) { var ns = IS.SUBJ.filter(function (x) { return x.spec === s.id; }).length;
        return '<button type="button" class="pk' + (s.id === cur ? ' on' : '') + '" data-act="setspec" data-v="' + s.id + '"><span class="pki">' + (s.img ? '<img src="' + IS.U(s.img) + '" alt="" loading="lazy">' : '') + '</span><span class="pkt"><i>' + ic(s.icon) + '</i><b lang="en">' + esc(s.en) + '</b><em>' + IS.cnt(ns, 'sub') + '</em></span>' + (s.id === cur ? '<span class="pkc">' + ic('check') + '</span>' : '') + '</button>'; }).join('') + '</div></section>' +
      '<footer class="pick-footer">' +
      (IS.team() || IS.LEC ? '<nav class="pkx" aria-label="' + esc(A('مساحات العمل', 'Workspaces')) + '">' +
        (IS.LEC ? '<a class="btn ghost sm" href="#studio">' + ic('studio') + esc(A('استوديو المحاضر', 'Lecturer studio')) + '</a>' : '') +
        (IS.team() ? '<a class="btn ghost sm" href="#control">' + ic('crown') + esc(A('تطبيق التحكم', 'Control app')) + '</a>' : '') + '</nav>' : '') +
      '<div class="pkf"><button type="button" class="btn ghost sm" data-act="lang" aria-label="' +
        esc(A('غيّر اللغة إلى الإنجليزية', 'Switch language to Arabic')) + '">' + ic('globe') + language + '</button>' +
      '<a class="btn ghost sm" href="#terms">' + ic('shield') + esc(A('الشروط والخصوصية', 'Terms and privacy')) + '</a></div></footer></div>';
    /* the start page always fits the screen (owner, 18 Nov 2026: "not well organised, scrolling for nothing" on phone and tablet):
       the page takes exactly the height left under the top of #main, and the speciality cards share it */
    IS.after = function () { IS.fitPick(); };
    return h;
  });
  IS.fitPick = function () { var p = document.querySelector('#main .pick'); if (!p) return;
    var top = p.getBoundingClientRect().top + window.scrollY, pb = parseFloat(getComputedStyle(document.getElementById('main')).paddingBottom) || 0;
    p.style.height = Math.max(420, window.innerHeight - top - Math.min(pb, 16)) + 'px'; };
  window.addEventListener('resize', function () { if (document.body.getAttribute('data-page') === 'pick') IS.fitPick(); });
  IS.ACT.setspec = function (b) { var spec = IS.spec(b.getAttribute('data-v')); if (!spec) return; IS.setSpec(spec.id); IS.go('pick-section'); };

  /* ========== SETTINGS ========== */
  IS.page('settings', async function () {
    var th = IS.LS.get('theme', 'light'), fs = IS.LS.get('fs', 'n') === 'x' ? 'l' : IS.LS.get('fs', 'n'), m = me();
    function opt(act, v, cur, icon, ar, en, sub) { return '<button type="button" class="sopt' + (v === cur ? ' on' : '') + '" data-act="' + act + '" data-v="' + v + '" aria-pressed="' + (v === cur) + '">' + ic(icon) + '<b>' + esc(A(ar, en)) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</button>'; }
    function link(href, icon, ar, en, sub) { return '<a class="li" href="' + href + '">' + ic(icon) + '<span><b>' + esc(A(ar, en)) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span>' + ic('chev', 'fl') + '</a>'; }
    return IS.banner(IS.T('الإعدادات', 'Settings'), esc(A('اللغة والمظهر وحسابك في مكان واحد.', 'Language, appearance and your account in one place.')), 'gear', '', 'gold') +
      '<div class="setg">' + (IS.mySpec() ? '<section class="box"><h2>' + ic('grid') + IS.T('تخصصك', 'Your speciality') + '</h2><a class="myspec big" href="#pick"' + (IS.mySpec().img ? ' style="--sp:url(' + IS.U(IS.mySpec().img) + ')"' : '') + '><span class="msi">' + ic(IS.mySpec().icon) + '</span><span class="msn"><b lang="en">' + esc(IS.mySpec().en) + '</b></span><em>' + esc(A('تغيير التخصص', 'Change speciality')) + '</em></a><a class="link" href="#pick-section">' + ic('layers') + esc(A('تغيير القسم', 'Change section')) + '</a><p class="mut">' + esc(A('اختر تخصصك ثم القسم لعرض كورساته ومحاضريه.', 'Choose a speciality, then a section to see its courses and lecturers.')) + '</p></section>' : '') + '<div class="setc"><section class="box"><h2>' + ic('globe') + IS.T('اللغة', 'Language') + '</h2><div class="sopts">' + opt('setlang', 'ar', IS.lang, 'globe', 'العربية', 'العربية', 'Arabic') + opt('setlang', 'en', IS.lang, 'globe', 'English', 'English', 'الإنجليزية') + '</div>' +
      '</section>' +
      '<section class="box"><h2>' + ic('sun') + IS.T('المظهر', 'Appearance') + '</h2><div class="sopts">' + opt('settheme', 'light', th, 'sun', 'نهاري', 'Light') + opt('settheme', 'dark', th, 'moon', 'ليلي', 'Dark') + opt('settheme', 'eye', th, 'eye', 'راحة العين', 'Eye comfort', A('ألوان دافئة تخفف الضوء الأزرق', 'Warm colours, less blue light')) + opt('settheme', 'auto', th, 'gear', 'تلقائي', 'Automatic', A('حسب إعدادات الجهاز', 'Follows the device')) + '</div>' +
      '<h3 class="sub">' + esc(A('لون التطبيق', 'App colour')) + '</h3><div class="pals" role="radiogroup">' + IS.PALS.map(function (p) { var on = p[0] === IS.LS.get('pal', 'blue');
        return '<button type="button" class="pal' + (on ? ' on' : '') + '" role="radio" aria-checked="' + on + '" data-act="setpal" data-v="' + p[0] + '" style="--pc:' + p[1] + '"><i></i><span>' + esc(A(p[2], p[3])) + '</span></button>'; }).join('') + '</div>' +
      '<h3 class="sub">' + esc(A('حجم النص', 'Text size')) + '</h3><div class="sopts">' + opt('setfs', 's', fs, 'h2', 'صغير', 'Small') + opt('setfs', 'n', fs, 'h2', 'عادي', 'Normal') + opt('setfs', 'l', fs, 'h2', 'كبير', 'Large') + '</div></section>' +
      '</div><div class="setc"><section class="box"><h2>' + ic('user') + IS.T('الحساب', 'Account') + '</h2>' + (m ? '<div class="list">' + link('#account', 'user', 'الملف الشخصي', 'Profile', m.name) + link('#security', 'shield', 'الأمان والتحقق بخطوتين', 'Security and two-step login') + link('#notifications', 'bell', 'الإشعارات', 'Notifications') + link('#favorites', 'heart', 'المفضلة', 'Favourites') + '</div>' +
        /* lecturers and team members choose whether students see that they are online (owner, 18 Nov 2026) */
        ((IS.LEC || (m.team || []).length) ? '<h3 class="sub">' + esc(A('حالة الاتصال', 'Online status')) + '</h3><div class="sopts">' + opt('setseen', 'show', m.hide_seen ? 'hide' : 'show', 'eye', 'ظاهرة للطلاب', 'Shown to students') + opt('setseen', 'hide', m.hide_seen ? 'hide' : 'show', 'lock', 'مخفية', 'Hidden') + '</div><p class="mut">' + esc(A('عند الإظهار يرى الطلاب «متصل الآن» أو وقت آخر نشاط لك. فريق المنصة يراها دائمًا.', 'When shown, students see “Online now” or when you were last active. The platform team always sees it.')) + '</p>' : '') +
        '<button class="btn ghost bad wide" data-act="logout">' + ic('logout') + esc(A('تسجيل الخروج', 'Sign out')) + '</button>' :
        '<p class="mut">' + esc(A('سجّل الدخول لإدارة ملفك وأمانك وإشعاراتك.', 'Sign in to manage your profile, security and notifications.')) + '</p><div class="row"><button class="btn pri" data-act="login">' + esc(A('تسجيل الدخول', 'Sign in')) + '</button><button class="btn ghost" data-act="register">' + esc(A('حساب جديد', 'Create account')) + '</button></div>') + '</section>' +
      '<section class="box"><h2>' + ic('help') + IS.T('المساعدة', 'Help') + '</h2><div class="list">' + link('#support', 'chat', 'الدعم والرسائل', 'Support and messages') + link('#about', 'info', 'عن المنصة', 'About the platform') + link('#terms', 'file', 'الشروط والخصوصية', 'Terms and privacy') + '</div><p class="mut ver">' + esc(IS.brandName()) + ' · ' + esc(A('الإصدار', 'Version')) + ' 1.1</p></section></div></div>';
  }, { area: 'keep' });
  IS.ACT.setlang = function (b) { var v = b.getAttribute('data-v'); if (v === IS.lang) return; IS.ACT.lang(); };
  IS.ACT.settheme = function (b) { IS.setTheme(b.getAttribute('data-v')); IS.refresh(); };
  IS.ACT.setseen = async function (b) { var h = b.getAttribute('data-v') === 'hide'; await DB.upd('profiles', me().id, { hide_seen: h }); IS.ME.hide_seen = h;
    IS.toast(h ? A('حالتك مخفية عن الطلاب', 'Your status is hidden from students') : A('حالتك ظاهرة للطلاب', 'Your status is shown to students')); IS.refresh(); };
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
    q = decodeURIComponent(q || ''); var r = await Promise.all([IS.pubCourses(true), DB.q('lecturers', { eq: { status: 'active' } })]);
    var courseLecturers = Object.fromEntries(r[1].map(function (lecturer) { return [lecturer.id, lecturer]; }));
    var w = IS.norm(q).split(' ').filter(Boolean), hit = function (s) { s = IS.norm(s); return w.every(function (x) { return s.indexOf(x) >= 0; }); };
    var cs = w.length ? r[0].filter(IS.inStudySpace).filter(function (c) { var s = IS.subj(c.subject), k = IS.cat(c.cat); return hit([c.title, c.subtitle, c.about, (c.learn || []).join(' '), s && s.ar, s && s.en, k && k.ar, k && k.en, (courseLecturers[c.lecturer_id] || {}).name].join(' ')); }) : [];
    var ls = w.length ? IS.studyLecturers(r[1], r[0]).filter(function (l) { return hit([l.name, l.title, l.specialty, (l.tags || []).join(' ')].join(' ')); }) : [];
    return '<form class="bigsearch" role="search" data-form="search"><span>' + ic('search') + '</span><input name="q" type="search" value="' + esc(q) + '" placeholder="' + esc(A('ابحث…', 'Search…')) + '" autofocus><button class="btn pri">' + esc(A('بحث', 'Search')) + '</button></form>' +
      '<h1 class="ph1" tabindex="-1">' + IS.T('نتائج البحث', 'Search results') + (q ? ': <bdi>' + esc(q) + '</bdi>' : '') + '</h1>' +
      (ls.length ? '<section class="sec"><header class="sh"><h2>' + IS.T('المحاضرون', 'Lecturers') + '</h2></header><div class="grid g4">' + ls.map(function (l) { return lecCard(l, r[0].filter(IS.inStudySpace).filter(function (c) { return c.lecturer_id === l.id; }).length); }).join('') + '</div></section>' : '') +
      '<section class="sec"><header class="sh"><h2>' + IS.T('الكورسات', 'Courses') + ' (' + N(cs.length) + ')</h2></header>' + (cs.length ? '<div class="grid g3">' + cs.map(function (c) { return IS.courseCard(c, courseLecturers, {}); }).join('') + '</div>' : IS.empty('search', w.length ? A('لا توجد نتائج', 'No results') : A('اكتب ما تبحث عنه', 'Type what you are looking for'), w.length ? A('جرّب كلمة أخرى.', 'Try another word.') : '')) + '</section>';
  });

  /* ========== COURSES CATALOGUE ========== */
  var F = { scope: '', sub: {}, lec: {}, price: 'all', sort: 'new', view: IS.LS.get('cview', 'grid'), q: '' };
  IS.page('courses', async function (arg) {
    var section = IS.mySection(), parts = String(arg || '').split('/'), spec = IS.SPEC;
    if (parts[0] && parts[0][0] === '@') spec = parts.shift().slice(1);
    var subject = IS.subj(parts[1]), cat = IS.cat(parts[0]) || section;
    var requested = subject ? { spec: subject.spec, cat: subject.cat } : { spec: spec, cat: cat && cat.id };
    if (!IS.inStudySpace(requested)) return IS.outsideStudySpace(requested);
    var scope = IS.SPEC + '/' + (section ? section.id : '');
    if (F.scope !== scope) { F.scope = scope; F.lec = {}; F.price = 'all'; F.q = ''; }
    F.sub = {}; if (subject) F.sub[subject.id] = true;
    var r = await Promise.all([IS.pubCourses(), IS.lecMap(), IS.myEnroll()]), cs = r[0], L = r[1], E = r[2];
    var speciality = IS.mySpec();
    var context = [speciality && A(speciality.ar, speciality.en), section && A(section.ar, section.en), subject && subject.en].filter(Boolean).join(' · ');
    var picture = (subject && subject.img) || 'img/ban_course_catalogue.webp';
    var h = IS.banner(IS.T('الكورسات', 'Courses'), esc(context), 'layers', '', 'gold course-catalogue-banner', picture);
    var lecIds = Object.keys(L).filter(function (id) { return cs.some(function (c) { return c.lecturer_id === id; }); });
    h += '<div class="cols rev"><aside class="filt" id="filt"><header><h2>' + ic('filter') + IS.T('تصفية النتائج', 'Filter') + '</h2><button type="button" class="link" data-act="fclear">' + esc(A('مسح الكل', 'Clear')) + '</button></header>' +
      fg(IS.T('المادة', 'Subject'), IS.SUBJ.filter(function (s) { return IS.inStudySpace(s); }).map(function (s) { var n = cs.filter(function (c) { return c.subject === s.id; }).length; return '<label class="opt"><input type="checkbox" data-f="sub" value="' + s.id + '"' + (F.sub[s.id] ? ' checked' : '') + '><span lang="en">' + esc(s.en) + '</span><em>' + N(n) + '</em></label>'; }).join('')) +
      (lecIds.length ? fg(IS.T('المحاضر', 'Lecturer'), lecIds.map(function (id) { return '<label class="opt"><input type="checkbox" data-f="lec" value="' + id + '"' + (F.lec[id] ? ' checked' : '') + '>' + IS.av(L[id], 'xs') + '<span>' + esc(L[id].name) + '</span></label>'; }).join('')) : '') +
      fg(IS.T('السعر', 'Price'), [['all', A('الكل', 'All')], ['free', A('مجاني', 'Free')], ['paid', A('مدفوع', 'Paid')]].map(function (o) { return '<label class="opt"><input type="radio" name="fprice" data-f="price" value="' + o[0] + '"' + (F.price === o[0] ? ' checked' : '') + '><span>' + esc(o[1]) + '</span></label>'; }).join('')) +
      '</aside><div class="main"><div class="tool"><label class="field">' + ic('search') + '<input id="cq" type="search" placeholder="' + esc(A('ابحث في الكورسات…', 'Search courses…')) + '" value="' + esc(F.q) + '"></label><button class="btn ghost only-ph" data-act="ftog">' + ic('filter') + esc(A('تصفية', 'Filter')) + '</button>' +
      '<select class="sel" id="csort">' + [['new', A('الأحدث', 'Newest')], ['pop', A('الأكثر تسجيلًا', 'Most enrolled')], ['top', A('الأعلى تقييمًا', 'Top rated')], ['low', A('الأقل سعرًا', 'Lowest price')]].map(function (o) { return '<option value="' + o[0] + '"' + (F.sort === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>' +
      '<span class="seg"><button data-act="cview" data-v="grid" aria-pressed="' + (F.view === 'grid') + '" aria-label="grid">' + ic('grid') + '</button><button data-act="cview" data-v="list" aria-pressed="' + (F.view === 'list') + '" aria-label="list">' + ic('list') + '</button></span></div><div id="cres"></div></div></div>';
    IS.after = function () { var fill = function () { fillCourses(cs, L, E); IS.evenRows(); }; fill();
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
      if (s.length && s.indexOf(c.subject) < 0) return false; if (l.length && l.indexOf(c.lecturer_id) < 0) return false;
      if (F.price === 'free' && +c.price) return false; if (F.price === 'paid' && !+c.price) return false;
      if (w.length) { var hay = IS.norm([c.title, c.subtitle, c.about, (L[c.lecturer_id] || {}).name].join(' ')); if (!w.every(function (x) { return hay.indexOf(x) >= 0; })) return false; }
      return true; });
    r.sort(function (a, b) { if (F.sort === 'pop') return (b.n_students || 0) - (a.n_students || 0); if (F.sort === 'top') return (b.rating || 0) - (a.rating || 0); if (F.sort === 'low') return (+a.price || 0) - (+b.price || 0); return String(b.published_at || '').localeCompare(String(a.published_at || '')); });
    $('#cres').innerHTML = '<p class="count">' + esc(A('كل الكورسات', 'All courses')) + ' · ' + N(r.length) + ' ' + esc(A('نتيجة', 'results')) + '</p>' + (r.length ? '<div class="grid ' + (F.view === 'list' ? 'list' : 'g3') + '">' + r.map(function (c) { return IS.courseCard(c, L, E); }).join('') + '</div>' :
      IS.empty('layers', A('لا توجد كورسات هنا بعد', 'No courses here yet'), A('عند نشر كورسات في هذا القسم ستظهر هنا. يمكنك طلب كورس تحتاجه.', 'Courses published in this section will appear here. You can request a course you need.'), '<a class="btn ghost" href="#course-requests/new">' + ic('plus') + esc(A('اطلب كورسًا', 'Request a course')) + '</a>') + browseSubj(cs));
  }
  function browseSubj(courses) {
    var subjects = IS.SUBJ.filter(IS.inStudySpace);
    return subjects.length ? '<h3 class="ph2">' + IS.T('تصفّح المواد', 'Browse subjects') + '</h3><div class="subjs">' +
      subjects.map(function (s, i) { return subjectCard(s, i, courses); }).join('') + '</div>' : '';
  }
  IS.ACT.fclear = function () { F.lec = {}; F.price = 'all'; F.q = ''; IS.go('courses'); };
  IS.ACT.ftog = function () { $('#filt').classList.toggle('show'); };

  IS.courseFormats = function () {
    return [['recorded', A('دروس مسجّلة', 'Recorded lessons')], ['live', A('مباشر عبر الإنترنت', 'Live online')],
      ['hybrid', A('دروس مسجّلة وجلسات مباشرة', 'Recorded + live')]];
  };
  IS.sudanTimeInput = function (value) {
    if (!value) return '';
    var parts = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Khartoum', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date(value)).forEach(function (part) { parts[part.type] = part.value; });
    return parts.year + '-' + parts.month + '-' + parts.day + 'T' + parts.hour + ':' + parts.minute;
  };
  IS.previewVideoUrl = function (value) {
    var video = IS.extEmbed(value);
    return video ? video.src : value || '';
  };
  IS.courseLiveLink = async function (id) {
    var row = (await DB.q('course_live_links', { eq: { course_id: id }, limit: 1 }))[0];
    return row && /^https:\/\//.test(row.url) ? row.url : '';
  };
  async function availableSeats(course) {
    if (!course.seat_limit || course.status !== 'published') return null;
    if (DB.live) {
      var result = await DB.sb.rpc('ish_available_course_seats', { course: course.id });
      if (result.error) throw result.error;
      return result.data;
    }
    var reserved = await DB.q('enrollments', { eq: { course_id: course.id }, in: { status: ['pending', 'active'] } });
    return Math.max(0, course.seat_limit - new Set(reserved.map(function (e) { return e.user_id; })).size);
  }
  function courseFormat(course) {
    var format = IS.courseFormats().find(function (item) { return item[0] === course.delivery; });
    return format ? esc(format[1]) : '';
  }
  function courseSchedule(course) {
    return esc(IS.date(course.starts_at, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Khartoum' })) +
      ' · ' + esc(A('بتوقيت السودان', 'Sudan time'));
  }
  function courseInfo(course, link) {
    if (!course.delivery && !course.starts_at && !course.teaching_method && !course.seat_limit) return '';
    var facts = [
      [A('نوع الكورس', 'Format'), courseFormat(course)],
      [A('موعد البدء', 'Start date'), course.starts_at && courseSchedule(course)],
      [A('الحد الأقصى للطلاب', 'Maximum students'), course.seat_limit && N(course.seat_limit)]
    ].filter(function (item) { return item[1]; });
    return '<section class="box"><h2>' + IS.T('الموعد وطريقة التدريس', 'Schedule and teaching') + '</h2>' +
      (facts.length ? '<ul class="kv">' + facts.map(function (item) { return '<li><span>' + esc(item[0]) + '</span><b>' + item[1] + '</b></li>'; }).join('') + '</ul>' : '') +
      (course.teaching_method ? '<p class="pre" dir="auto">' + esc(course.teaching_method) + '</p>' : '') +
      (link ? '<a class="btn pri sm" data-live-course href="' + IS.U(link) + '" target="_blank" rel="noopener noreferrer">' +
        ic('video') + esc(A('انضم للجلسة المباشرة', 'Join the live session')) + '</a>' : '') + '</section>';
  }

  /* ========== COURSE PAGE ========== */
  IS.page('course', async function (id) {
    var c = await DB.one('courses', id); if (!c) return null;
    var mine = IS.LEC && c.lecturer_id === IS.LEC.id, staff = IS.can('review');
    if (c.status !== 'published' && !mine && !staff) return null;
    if (!mine && !staff && !IS.inStudySpace(c)) return IS.outsideStudySpace(c);
    var r = await Promise.all([IS.courseLessons(id), DB.one('lecturers', c.lecturer_id), IS.myEnroll(), IS.myProgress(id), DB.q('reviews', { eq: { course_id: id }, order: ['created_at', false] }), availableSeats(c),
      uid() && (c.delivery === 'live' || c.delivery === 'hybrid') ? IS.courseLiveLink(c.id) : '']);
    var secs = r[0], l = r[1] || {}, e = r[2][id], P = r[3], rv = r[4], seats = r[5], all = []; secs.forEach(function (s) { all = all.concat(s.lessons); });
    var act = (e && e.status === 'active') || mine || staff, done = all.filter(function (x) { return P[x.id]; }).length, pct = all.length ? Math.round(done / all.length * 100) : 0;
    var next = all.filter(function (x) { return !P[x.id]; })[0] || all[0], cat = IS.cat(IS.studyScope(c).cat), sj = IS.subj(c.subject);
    var h = '<nav class="crumb"><a href="#courses">' + esc(A('الكورسات', 'Courses')) + '</a>' + ic('chev', 'fl') + (cat ? '<a href="#courses/' + cat.id + '">' + esc(A(cat.ar, cat.en)) + '</a>' + ic('chev', 'fl') : '') + '<span>' + esc(c.title) + '</span></nav>';
    if (c.status !== 'published') h += '<p class="note warn">' + ic('eye') + esc(A('معاينة: هذا الكورس غير منشور للطلبة بعد', 'Preview: this course is not published to students yet')) + ' · ' + IS.status(c.status) + '</p>';
    h += '<section class="chero" style="--cc:' + esc(c.color || 'var(--pri)') + (c.cover ? ';--ci:url(' + IS.U(c.cover) + ')' : '') + '"><div class="chin"><div class="cht"><span class="tags lt">' + (cat ? '<span>' + esc(A(cat.ar, cat.en)) + '</span>' : '') + (sj ? '<span>' + esc(sj.en) + '</span>' : '') + (c.level ? '<span>' + esc(c.level) + '</span>' : '') + '</span>' +
      '<h1 tabindex="-1">' + esc(c.title) + '</h1>' + (c.subtitle ? '<p>' + esc(c.subtitle) + '</p>' : '') + '<a class="chlec" href="#lecturer/' + l.id + '">' + IS.av(l, 'sm', l.id) + '<span><b>' + esc(l.name || '') + '</b><small>' + esc(l.title || '') + '</small>' + IS.seen(l.id) + '</span></a>' +
      '<div class="chst">' + (c.n_reviews ? '<span>' + IS.stars(c.rating) + ' <b>' + N(c.rating) + '</b> (' + N(c.n_reviews) + ')</span>' : '') + (c.n_students ? '<span>' + ic('users') + N(c.n_students) + ' ' + esc(A('طالب', 'students')) + '</span>' : '') +
      '<span>' + ic('video') + N(all.length) + ' ' + esc(A('درس', 'lessons')) + '</span>' + (c.minutes ? '<span>' + ic('clock') + hrs(c.minutes) + '</span>' : '') + '<span>' + ic('clock') + esc(A('آخر تحديث ', 'Updated ')) + esc(IS.date(c.updated_at || c.created_at)) + '</span></div></div>' +
      (c.cover ? '<img class="chimg" src="' + IS.U(c.cover) + '" alt="">' : '') + '</div></section>';
    h += '<section class="box buy"><div class="buy-actions"><div class="bp">' + price(c) + '</div>' +
      (seats !== null && !act ? '<p class="mut">' + (seats ? esc(A('المقاعد المتاحة', 'Seats available')) + ' · ' + N(seats) : esc(A('اكتملت المقاعد', 'Course is full'))) + '</p>' : '') +
      (e && +e.price > 0 ? '<div class="row">' + IS.paymentStatus(e.status) + IS.paymentLink(e) + '</div>' : '') +
      (act ? (all.length ? '<a class="btn pri" href="#lesson/' + id + '/' + next.id + '">' + ic('play') + esc(done ? A('تابع التعلّم', 'Continue learning') : A('ابدأ الكورس', 'Start the course')) + '</a>' : '') + (e && e.status === 'active' ? '<div class="prog">' + IS.bar(pct) + '<em>' + N(pct + '%') + '</em></div>' : '') :
        e && e.status === 'pending' ? '<p class="mut">' + esc(A('يُفتح الكورس بعد تأكيد الدفع.', 'The course opens after payment is confirmed.')) + '</p>' :
        seats === 0 ? '' : '<button class="btn pri" data-act="enrol" data-id="' + id + '">' + ic('wallet') +
        esc(+c.price ? (e && e.status === 'rejected' ? A('أرسل إيصالًا جديدًا', 'Submit a new receipt') : A('ادفع للالتحاق', 'Pay to enrol')) : A('التحق مجانًا', 'Enrol for free')) + '</button>') +
      '<div class="row buy-tools">' + IS.favBtn('c:' + id) + '<button class="fav" data-act="share" data-h="course/' + id + '" aria-label="share">' + ic('share') + '</button></div>' +
      '</div><div class="buy-includes"><h2 class="sub">' + esc(A('يتضمن هذا الكورس', 'This course includes')) + '</h2><ul class="inc">' +
      [['video', 'video', 'درس فيديو', 'video lessons'], ['text', 'file', 'درس مكتوب', 'written lessons'], ['quiz', 'qb', 'اختبار', 'quizzes']].map(function (kind) {
        var count = all.filter(function (lesson) { return lesson.kind === kind[0]; }).length;
        return count ? '<li>' + ic(kind[1]) + N(count) + ' ' + esc(A(kind[2], kind[3])) + '</li>' : '';
      }).join('') +
      '<li>' + ic('shield') + esc(A('مشاهدة داخل التطبيق فقط (دون تنزيل)', 'Watched inside the app only (no download)')) + '</li><li>' + ic('cert') + esc(A('شهادة إتمام', 'Certificate of completion')) + '</li></ul></div></section>';
    h += '<div class="course-details"><div class="tabs" role="tablist">' + [['about', A('نظرة عامة', 'Overview')], ['cur', A('محتوى الكورس', 'Curriculum')], ['lec', A('المحاضر', 'Lecturer')], ['rev', A('التقييمات', 'Reviews') + (rv.length ? ' (' + rv.length + ')' : '')]].map(function (t, i) {
      return '<button role="tab" data-act="tab" data-t="' + t[0] + '" aria-selected="' + (i === 0) + '">' + esc(t[1]) + '</button>'; }).join('') + '</div>';
    var promo = IS.extEmbed(c.promo) ? c.promo : IS.extVideo(c.promo);
    var liveLink = act ? r[6] : '';
    var overview = ((c.learn || []).length ? '<section class="course-overview-item"><h2>' + IS.T('ماذا ستتعلم', 'What you’ll learn') + '</h2><ul class="learn">' + c.learn.map(function (x) { return '<li>' + ic('check') + esc(x) + '</li>'; }).join('') + '</ul></section>' : '') +
      (c.about ? '<section class="course-overview-item"><h2>' + IS.T('عن الكورس', 'About this course') + '</h2><div class="rich">' + IS.clean(c.about) + '</div></section>' : '') +
      ((c.reqs || []).length ? '<section class="course-overview-item"><h2>' + IS.T('المتطلبات', 'Requirements') + '</h2><ul class="learn dot">' + c.reqs.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></section>' : '');
    var schedule = courseInfo(c, liveLink);
    h += '<div class="pane" data-p="about">' + (promo ? '<section class="box"><h2>' + IS.T('معاينة الكورس', 'Course preview') + '</h2>' + postPreview({ preview_video: promo }) + '</section>' : '') +
      schedule + (overview ? '<div class="box course-overview">' + overview + '</div>' : '') +
      (!promo && !schedule && !overview ? IS.empty('layers', A('لم تُضف تفاصيل بعد', 'No course details yet')) : '') + '</div>';
    h += '<div class="pane" data-p="cur" hidden>' + curriculum(c, secs, P, null, act) + '</div>';
    h += '<div class="pane" data-p="lec" hidden><section class="box lecbox">' + IS.av(l, 'lg') + '<div><h2><a href="#lecturer/' + l.id + '">' + esc(l.name || '') + '</a></h2><p class="mut">' + esc(l.title || '') + '</p><div class="rich">' + IS.clean(l.bio || '') + '</div><a class="btn ghost sm" href="#lecturer/' + l.id + '">' + esc(A('عرض الملف الكامل', 'Full profile')) + '</a></div></section></div>';
    var canRev = e && e.status === 'active' && !rv.some(function (x) { return x.user_id === uid(); });
    h += '<div class="pane" data-p="rev" hidden>' + (canRev ? '<form class="box form" data-form="review"><input type="hidden" name="course" value="' + id + '"><h2>' + IS.T('قيّم الكورس', 'Rate this course') + '</h2><div class="rate">' + [5, 4, 3, 2, 1].map(function (n) { return '<input type="radio" name="stars" id="st' + n + '" value="' + n + '" required><label for="st' + n + '" aria-label="' + n + '">' + ic('star') + '</label>'; }).join('') + '</div>' +
      '<textarea name="body" rows="3" placeholder="' + esc(A('اكتب رأيك بإيجاز (اختياري)', 'A short comment (optional)')) + '"></textarea><button class="btn pri">' + esc(A('إرسال التقييم', 'Submit review')) + '</button></form>' : '') +
      (rv.length ? rv.map(function (x) { return '<div class="revw">' + IS.av({ name: x.name }, 'sm') + '<div><b>' + esc(x.name || '') + '</b> ' + IS.stars(x.stars) + '<small>' + esc(IS.ago(x.created_at)) + '</small><p>' + esc(x.body || '') + '</p></div><button class="ib" data-act="report" data-kind="review" data-id="' + x.id + '" aria-label="' + esc(A('إبلاغ', 'Report')) + '">' + ic('flag') + '</button></div>'; }).join('') :
        IS.empty('star', A('لا توجد تقييمات بعد', 'No reviews yet'), A('يقيّم الكورس الطلبة الملتحقون به.', 'Enrolled students rate the course.'))) + '</div>';
    return h + '</div>';
  });
  function lessonKind(kind) {
    return { video: A('فيديو', 'Video'), text: A('درس مكتوب', 'Reading'), quiz: A('اختبار', 'Quiz') }[kind] || '';
  }
  function curriculum(c, secs, P, cur, act) {
    if (!secs.length) return IS.empty('layers', A('لم تُضف دروس بعد', 'No lessons yet'));
    return '<div class="cur">' + secs.map(function (s, si) {
      var nd = s.lessons.filter(function (x) { return P[x.id]; }).length, open = cur ? s.lessons.some(function (x) { return x.id === cur; }) : si === 0;
      return '<details class="csec"' + (open ? ' open' : '') + '><summary><span class="cn' + (nd && nd === s.lessons.length ? ' ok' : '') + '">' + (nd && nd === s.lessons.length ? ic('check') : N(si + 1)) + '</span><span class="ct"><b><bdi>' + esc(s.title) + '</bdi></b><small>' + N(s.lessons.length) + ' ' + A('دروس', s.lessons.length === 1 ? 'lesson' : 'lessons') + (nd ? ' · ' + N(nd) + ' ' + esc(A('منتهٍ', 'done')) : '') + '</small></span>' + ic('down') + '</summary><ol>' +
        s.lessons.map(function (x) { var open2 = act || x.free;
          return '<li><a class="les' + (open2 ? '' : ' locked') + '"' + (x.id === cur ? ' aria-current="page"' : '') + ' href="#lesson/' + c.id + '/' + x.id + '"><span class="ls ' + (P[x.id] ? 'ok' : '') + '">' + ic(P[x.id] ? 'check' : !open2 ? 'lock' : x.kind === 'quiz' ? 'qb' : x.kind === 'text' ? 'file' : 'play') + '</span><span class="ltt"><b><bdi>' + esc(x.title) + '</bdi></b><small>' +
            esc(lessonKind(x.kind)) + (x.minutes ? ' · ' + N(x.minutes) + ' ' + esc(A('د', 'min')) : '') + '</small></span>' + (x.free && !act ? IS.chip(esc(A('معاينة مجانية', 'Free preview')), 'free') : '') + '</a></li>'; }).join('') + '</ol></details>';
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
    if (!me()) return IS.ACT.login();
    var c = await DB.one('courses', b.dataset.id);
    if (!c || c.status !== 'published' || !IS.inStudySpace(c)) return IS.refresh();
    if (await availableSeats(c) === 0) return IS.refresh();
    if (!+c.price) {
      try {
        await DB.ins('enrollments', { course_id: c.id, user_id: uid(), lecturer_id: c.lecturer_id, status: 'active', price: 0, payer: me().name, phone: me().phone || '', decided_at: new Date().toISOString() });
      } catch (error) {
        if (!['course_no_seats', 'course_already_enrolled'].includes(error.message)) throw error;
        return IS.refresh();
      }
      await IS.recount(c.id);
      IS.toast(A('تم التحاقك بالكورس', 'You are enrolled'));
      return IS.refresh();
    }
    var section = IS.studyScope(c), specialty = IS.spec(section.spec), category = IS.cat(section.cat);
    IS.paymentSheet({ course: c.id, title: c.title, price: c.price, scope: [specialty, category].filter(Boolean).map(function (item) { return A(item.ar, item.en); }).join(' · ') });
  };
  IS.paymentStatus = function (status) {
    if (status === 'pending') return IS.chip(esc(A('قيد المراجعة', 'Under review')), 'st warn');
    if (status === 'active') return IS.chip(esc(A('مقبول', 'Approved')), 'st ok');
    return IS.status(status);
  };
  IS.paymentLink = function (entry) {
    return '<a class="link" href="#payment/' + esc(entry.id) + '">' + esc(A('حالة الدفع', 'Payment status')) + '</a>';
  };
  IS.paymentMessages = function (messages) {
    return messages.map(function (message) {
      return '<article class="cr-message"><div class="row sp"><b>' + esc(A('فريق المدفوعات', 'Payments team')) +
        '</b><small class="mut">' + esc(IS.ago(message.created_at)) + '</small></div><p class="pre" dir="auto">' + esc(message.body) + '</p></article>';
    }).join('');
  };
  IS.page('payment', async function (id) {
    var entry = await DB.one('enrollments', id);
    if (!entry || entry.user_id !== uid() || !(+entry.price > 0)) return null;
    var data = await Promise.all([
      DB.one(entry.request_id ? 'course_requests' : 'courses', entry.request_id || entry.course_id),
      DB.q('payment_messages', { eq: { enrollment_id: entry.id }, order: ['created_at', false], limit: 50 })
    ]);
    var target = data[0], paymentMessages = data[1], targetUrl = target && '#' + (entry.request_id ? 'course-request/' : 'course/') + esc(target.id);
    var detail = entry.status === 'active' ?
      (entry.request_id ? A('تم تأكيد الدفع وحجز مقعدك.', 'Payment confirmed. Your seat is booked.') : A('تم تأكيد الدفع ويمكنك بدء الكورس.', 'Payment confirmed. You can start the course.')) :
      entry.status === 'rejected' ? (entry.request_id ?
        A('رُفض الإيصال. يمكنك إرسال إيصال جديد من صفحة الطلب.', 'The receipt was rejected. You can submit a new one from the request page.') :
        A('رُفض الإيصال. يمكنك إرسال إيصال جديد من صفحة الكورس.', 'The receipt was rejected. You can submit a new one from the course page.')) :
        A('تم إرسال الإيصال. سيصلك إشعار بعد مراجعته.', 'Receipt submitted. You’ll receive a notification after review.');
    return '<nav class="crumb"><a href="#learning">' + esc(A('تعلّمي', 'My learning')) + '</a></nav>' +
      IS.banner(IS.T('حالة الدفع', 'Payment status'), target ? esc(target.title) : '', 'receipt') +
      '<section class="box"><div class="row sp">' + IS.paymentStatus(entry.status) + '<strong>' + IS.money(entry.price) + '</strong></div><p>' + esc(detail) + '</p>' +
      (entry.status === 'rejected' && entry.note ? '<div class="note bad"><div><b>' + esc(A('سبب الرفض', 'Reason for rejection')) +
        '</b><p class="pre" dir="auto">' + esc(entry.note) + '</p></div></div>' : '') +
      (targetUrl ? '<a class="btn ghost sm" href="' + targetUrl + '">' + esc(entry.request_id ? A('افتح الطلب', 'Open request') : A('افتح الكورس', 'Open course')) + '</a>' : '') +
      '</section>' + (paymentMessages.length ? '<section class="box"><h2>' + IS.T('رسائل فريق المدفوعات', 'Messages from the payments team') + '</h2>' +
        IS.paymentMessages(paymentMessages) + '</section>' : '');
  }, { auth: true });
  IS.paymentSheet = function (quote) {
    if (!IS.SET.bankak_account || !IS.SET.bankak_name) {
      return IS.toast(A('بيانات بنكك غير متوفرة الآن.', 'Bankak details are currently unavailable.'), true);
    }
    IS.sheet(esc(A('الدفع للانضمام', 'Pay to join')), '<div class="paysum"><b dir="auto">' + esc(quote.title) + '</b><span class="bp">' + IS.money(quote.price) + '</span></div>' +
      (quote.scope ? '<p class="mut">' + esc(quote.scope) + '</p>' : '') +
      '<ol class="steps"><li><b>' + esc(A('حوّل المبلغ عبر بنكك', 'Transfer the amount with Bankak')) + '</b><div class="acct"><span>' + esc(A('رقم الحساب', 'Account number')) + '</span><b dir="ltr">' + esc(IS.SET.bankak_account) + '</b><button type="button" class="ib" data-act="copy" data-c="' + esc(IS.SET.bankak_account) + '" aria-label="' + esc(A('انسخ رقم الحساب', 'Copy account number')) + '">' + ic('file') + '</button></div>' +
      '<div class="acct"><span>' + esc(A('اسم الحساب', 'Account name')) + '</span><b dir="auto">' + esc(IS.SET.bankak_name) + '</b></div><div class="acct"><span>' + esc(A('المبلغ', 'Amount')) + '</span><b>' + IS.money(quote.price) + '</b></div></li>' +
      '<li><b>' + esc(A('أرسل بيانات التحويل', 'Send the transfer details')) + '</b><form class="form" data-form="pay"><input type="hidden" name="' + (quote.request ? 'request' : 'course') + '" value="' + esc(quote.request || quote.course) + '">' +
      '<label class="fl"><span>' + esc(A('الاسم', 'Name')) + ' *</span><input name="payer" required value="' + esc(me().name) + '"></label>' +
      '<label class="fl"><span>' + esc(A('رقم الهاتف', 'Phone number')) + ' *</span><input name="phone" required inputmode="tel" dir="ltr" value="' + esc(me().phone || '') + '"></label>' +
      '<label class="fl file"><span>' + esc(A('صورة الإيصال', 'Receipt picture')) + ' *</span><input type="file" name="receipt" accept="image/*" required></label>' +
      '<button class="btn pri wide">' + ic('send') + esc(A('أرسل الإيصال للمراجعة', 'Send receipt for review')) + '</button></form></li>' +
      '<li><b>' + esc(A('انتظر تأكيد الدفع', 'Wait for payment confirmation')) + '</b><p class="mut">' + esc(A('يصلك إشعار بعد مراجعة التحويل وتأكيد انضمامك.', 'You’ll receive a notification once the transfer is verified and your enrolment is confirmed.')) + '</p></li></ol>');
  };
  IS.ACT.copy = function (b) { try { navigator.clipboard.writeText(b.getAttribute('data-c')); IS.toast(A('نُسخ', 'Copied')); } catch (e) {} };
  IS.SUB.pay = async function (d, f) {
    if (!me()) return IS.ACT.login();
    if (!d.payer || !d.phone) return IS.toast(A('أدخل اسمك ورقم هاتفك.', 'Enter your name and phone number.'), true);
    var file = f.receipt.files[0];
    if (!file || !/^image\//.test(file.type) || file.size > 10 * 1024 * 1024) return IS.toast(A('أرفق صورة للإيصال بحجم 10 ميغابايت أو أقل.', 'Attach a receipt image of 10 MB or less.'), true);
    var quote = d.request ? await IS.requestPaymentQuote(d.request) : await DB.one('courses', d.course);
    if (!quote || +quote.price <= 0 || (!d.request && (quote.status !== 'published' || !IS.inStudySpace(quote) || await availableSeats(quote) === 0))) {
      IS.closeSheet();
      IS.toast(A('التسجيل غير متاح الآن.', 'Enrolment is currently unavailable.'), true);
      return IS.refresh();
    }
    var path = await DB.upload('receipts', await IS.shrink(file, 1400, 0.8));
    var entry;
    try {
      entry = await DB.ins('enrollments', {
        course_id: d.course || null, request_id: d.request || null, user_id: uid(), lecturer_id: quote.lecturer_id,
        status: 'pending', price: +quote.price, payer: d.payer, phone: d.phone, receipt: path
      });
    } catch (error) {
      if (!['request_closed', 'request_no_seats', 'course_no_seats', 'course_already_enrolled'].includes(error.message) && error.code !== '23505') throw error;
      IS.closeSheet();
      IS.toast(A('تغيّر توفر المقاعد. راجع حالة التسجيل في الصفحة.', 'Seat availability changed. Check your enrolment status on the page.'), true);
      return IS.refresh();
    }
    if (d.request) await IS.requestPaymentPreview(d.request);
    IS.closeSheet();
    IS.go('payment/' + entry.id);
  };

  /* ========== LESSON PLAYER ========== */
  IS.page('lesson', async function (arg) {
    var ids = String(arg || '').split('/'), cid = ids[0], c = await DB.one('courses', cid);
    if (!c) return null;
    var mine = IS.LEC && c.lecturer_id === IS.LEC.id, staff = IS.can('review');
    if (c.status !== 'published' && !mine && !staff) return null;
    if (!mine && !staff && !IS.inStudySpace(c)) return IS.outsideStudySpace(c);
    var r = await Promise.all([IS.courseLessons(cid), IS.myEnroll(), IS.myProgress(cid), DB.one('lecturers', c.lecturer_id)]);
    var secs = r[0], enrolment = r[1][cid], progress = r[2], lecturer = r[3];
    var all = secs.flatMap(function (section) { return section.lessons; });
    if (!all.length) return null;
    var idx = Math.max(0, all.findIndex(function (lesson) { return lesson.id === ids[1]; }));
    var x = Object.assign({}, all[idx], (await DB.lesson(all[idx].id)) || {});
    var active = !!((enrolment && enrolment.status === 'active') || mine || staff);
    var allowed = active || x.free, canStudy = allowed && !!me(), done = !!progress[x.id];
    var prev = all[idx - 1], next = all[idx + 1];
    var completed = all.filter(function (lesson) { return progress[lesson.id]; }).length;
    var pct = Math.round(completed / all.length * 100);
    var section = secs.find(function (item) { return item.id === x.section_id; });
    var position = A('الدرس ' + N(idx + 1) + ' من ' + N(all.length), 'Lesson ' + N(idx + 1) + ' of ' + N(all.length));
    var metadata = [position, section && secs.length > 1 ? '<bdi>' + esc(section.title) + '</bdi>' : '', esc(lessonKind(x.kind)),
      x.minutes ? N(x.minutes) + ' ' + A('د', 'min') : ''].filter(Boolean);
    var courseUrl = '#course/' + esc(cid), heading = A('محتوى الكورس', 'Course content');
    var sideOutline = allowed && x.kind === 'video';
    var h = '<div class="lesson-layout' + (sideOutline ? ' lesson-layout-video' : '') + '"><header class="lesson-heading"><a class="lesson-course-link" href="' + courseUrl +
      '">' + ic('chev', 'fr') + '<bdi>' + esc(c.title) + '</bdi></a><h1 tabindex="-1"><bdi>' + esc(x.title) +
      '</bdi></h1><p class="lesson-meta">' + metadata.map(function (item) { return '<span>' + item + '</span>'; }).join('') + '</p></header>';
    h += '<div class="lesson-media">';
    if (!allowed) h += '<section class="player lockd" style="' + (c.cover ? '--ci:url(' + IS.U(c.cover) + ')' : '') + '"><div>' + ic('lock') +
      '<h2>' + esc(A('هذا الدرس للملتحقين بالكورس', 'This lesson is for enrolled students')) +
      '</h2><a class="btn gold" href="' + courseUrl + '">' + esc(A('التحق بالكورس', 'Enrol in the course')) + '</a></div></section>';
    else if (x.kind === 'video') h += '<div class="player" id="player" aria-label="' + esc(A('فيديو الدرس', 'Lesson video')) +
      '"><div class="loading"><span class="spin"></span></div></div>';
    else if (x.kind === 'quiz') h += '<section class="box quiz" id="quiz" aria-label="' + esc(A('أسئلة الاختبار', 'Quiz questions')) + '">' +
      (x.quiz || []).map(function (q, k) { return '<fieldset class="qq" data-a="' + q.a + '"><legend>' + N(k + 1) + '. ' + esc(q.q) +
        '</legend>' + (q.o || []).map(function (o, j) { return '<label class="qo"><input type="radio" name="q' + k + '" value="' + j +
          '"><span>' + esc(o) + '</span></label>'; }).join('') + (q.e ? '<p class="qe" hidden>' + ic('info') + esc(q.e) + '</p>' : '') +
        '</fieldset>'; }).join('') + '<div class="row"><button class="btn pri" data-act="quizcheck" data-l="' + esc(x.id) + '" data-c="' +
      esc(cid) + '">' + esc(A('تحقق من الإجابات', 'Check answers')) + '</button><span id="qscore" class="qs" aria-live="polite"></span></div></section>';
    else h += '<article class="box lesson-reading"><div class="rich">' + IS.clean(x.body || '') + '</div></article>';

    var download = canStudy && !IS.extEmbed(x.video_id) ? IS.dlBtn('lesson', x.id, ' data-c="' + esc(cid) + '" data-v="' + esc(x.kind || 'video') + '"', true) : '';
    var mark = active ? '<button class="btn sm ' + (done ? 'ok' : 'pri') + '" data-act="done" data-l="' + esc(x.id) + '" data-c="' +
      esc(cid) + '" aria-pressed="' + done + '">' + ic(done ? 'checkc' : 'check') + esc(done ? A('أنهيت الدرس', 'Completed') : A('إتمام الدرس', 'Mark as done')) + '</button>' : '';
    function adjacent(lesson, before) {
      if (!lesson) return '';
      var label = before ? A('السابق', 'Previous') : A('التالي', 'Next');
      var arrow = ic('chev', before ? 'fr' : 'fl');
      return '<a class="btn ghost sm" rel="' + (before ? 'prev' : 'next') + '" href="#lesson/' + esc(cid) + '/' + esc(lesson.id) + '">' +
        (before ? arrow : '') + esc(label) + (before ? '' : arrow) + '</a>';
    }
    if (mark || download || prev || next) h += '<div class="lesson-actions">' +
      (mark || download ? '<div class="row lesson-utilities">' + mark + download + '</div>' : '') +
      (prev || next ? '<nav class="row lesson-nav" aria-label="' + esc(A('التنقّل بين الدروس', 'Lesson navigation')) + '">' +
        adjacent(prev, true) + adjacent(next, false) + '</nav>' : '') + '</div>';
    h += '</div>';

    var progressLabel = A(N(completed) + ' من ' + N(all.length) + ' مكتمل', N(completed) + ' of ' + N(all.length) + ' complete');
    h += '<aside class="lesson-outline" aria-label="' + esc(heading) + '"><details class="lesson-outline-toggle"' +
      (sideOutline && window.matchMedia('(min-width: 960px)').matches ? ' open' : '') + '><summary><span class="lesson-outline-icon">' + ic('layers') +
      '</span><span><b>' + esc(heading) + '</b><small>' + (active ? progressLabel : N(all.length) + ' ' + A('دروس', all.length === 1 ? 'lesson' : 'lessons')) +
      '</small></span>' + ic('down') + '</summary><div class="lesson-outline-body">' +
      (active ? '<div class="prog lesson-progress" role="progressbar" aria-label="' + esc(A('التقدّم في الكورس', 'Course progress')) +
        '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '">' + IS.bar(pct) + '<em>' + N(pct + '%') + '</em></div>' : '') +
      curriculum(c, secs, progress, x.id, active) + ((active && me()) || completed === all.length ?
        '<div class="lesson-outline-actions">' + (active && me() ?
          '<button class="btn ghost wide dlc" data-act="dlcourse" data-c="' + esc(cid) + '">' + ic('download') +
          esc(A('تنزيل الكورس', 'Download course')) + '</button>' : '') +
        (completed === all.length ? '<a class="btn gold wide" href="#cert/' + esc(cid) + '">' + ic('cert') +
          esc(A('شهادة الإتمام', 'Certificate')) + '</a>' : '') + '</div>' : '') + '</div></details></aside>';

    var tabs = [['notes', 'note', A('ملاحظاتي', 'My notes')], ['qa', 'chat', A('الأسئلة', 'Q&A')], ['info', 'info', A('الوصف', 'Description')]];
    if (canStudy) h += '<section class="lesson-study"><div class="tabs lesson-tabs" role="tablist" aria-label="' +
      esc(A('الملاحظات والأسئلة والوصف', 'Notes, questions and description')) + '">' + tabs.map(function (tab, k) {
        return '<button type="button" role="tab" id="lesson-tab-' + tab[0] + '" aria-controls="lesson-pane-' + tab[0] +
          '" tabindex="' + (k ? '-1' : '0') + '" data-act="tab" data-t="' + tab[0] + '" aria-selected="' + (k === 0) + '">' +
          ic(tab[1]) + esc(tab[2]) + '</button>';
      }).join('') + '</div>' +
      '<div class="pane" id="lesson-pane-notes" role="tabpanel" aria-labelledby="lesson-tab-notes" data-p="notes"><div class="box lesson-notes" id="notesBox"><div class="loading"><span class="spin"></span></div></div></div>' +
      '<div class="pane" id="lesson-pane-qa" role="tabpanel" aria-labelledby="lesson-tab-qa" data-p="qa" hidden><div id="qaBox"><div class="loading"><span class="spin"></span></div></div></div>' +
      '<div class="pane" id="lesson-pane-info" role="tabpanel" aria-labelledby="lesson-tab-info" data-p="info" hidden><section class="box lesson-info"><h2>' +
      esc(A('عن الكورس', 'About the course')) + '</h2><a class="link" href="' + courseUrl + '"><bdi>' + esc(c.title) + '</bdi></a>' +
      (lecturer ? '<a class="who" href="#lecturer/' + esc(lecturer.id) + '">' + IS.av(lecturer, 'sm') + '<span><b><bdi>' +
        esc(lecturer.name || '') + '</bdi></b><small><bdi>' + esc(lecturer.title || '') + '</bdi></small></span></a>' : '') +
      (c.about ? '<div class="rich">' + IS.clean(c.about) + '</div>' : '') + '</section></div></section>';

    IS.after = function (main) {
      var player = main.querySelector('#player');
      if (player) playLesson(player, x);
      var tabs = main.querySelector('.lesson-tabs');
      if (tabs) initLessonStudy(main, tabs, c, x);
    };
    return h + '</div>';
  });

  async function playLesson(player, lesson) {
    function showUnavailable(title, message) {
      player.classList.add('player-unavailable');
      player.closest('.lesson-layout').querySelector('.lesson-outline-toggle').open = false;
      player.innerHTML = IS.empty('video', title, message);
    }
    try {
      var video = await DB.videoPlay(lesson);
      if (!video) showUnavailable(A('لم يُرفع فيديو هذا الدرس بعد', 'The video of this lesson is not uploaded yet'));
      else if (video.kind === 'iframe') player.innerHTML = '<iframe src="' + esc(video.src) +
        '" allow="accelerometer; gyroscope; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="' + esc(lesson.title) + '"></iframe>';
      else player.innerHTML = '<video controls controlsList="nodownload noremoteplayback" disablePictureInPicture playsinline oncontextmenu="return false" src="' +
        esc(video.src) + '"></video>';
    } catch (error) {
      showUnavailable(A('تعذّر تشغيل الفيديو', 'The video could not be played'), A('تحقق من الاتصال.', 'Check the connection.'));
    }
  }

  function initLessonStudy(main, bar, course, lesson) {
    var buttons = Array.from(bar.querySelectorAll('[role=tab]'));
    var notes = main.querySelector('#notesBox'), questions = main.querySelector('#qaBox');
    function failed(box) {
      box.innerHTML = '<p class="mut">' + esc(A('تعذّر التحميل. أعد فتح الدرس للمحاولة مرة أخرى.', 'Could not load this. Reopen the lesson to try again.')) + '</p>';
    }
    notesBox(lesson, notes).catch(function () { failed(notes); });
    bar.addEventListener('click', function (event) {
      var button = event.target.closest('[role=tab]');
      if (button) buttons.forEach(function (tab) { tab.tabIndex = tab === button ? 0 : -1; });
    });
    buttons[1].addEventListener('click', function () {
      qaBox(course, lesson, questions).catch(function () { failed(questions); });
    }, { once: true });
    bar.addEventListener('keydown', function (event) {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      var direction = (event.key === 'ArrowRight' ? 1 : -1) * (document.documentElement.dir === 'rtl' ? -1 : 1);
      var index = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 :
        (buttons.indexOf(event.target) + direction + buttons.length) % buttons.length;
      buttons[index].focus();
      buttons[index].click();
    });
  }
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
  async function notesBox(x, box) {
    var n = (await DB.q('notes', { eq: { user_id: uid(), lesson_id: x.id } }))[0];
    box.innerHTML = '<div class="notes">' + IS.editor('note', n ? n.body : '', A('اكتب ملاحظاتك عن هذا الدرس… تُحفظ في حسابك.', 'Write your notes about this lesson… saved to your account.')) +
      '<div class="tags qt">' + [['التشخيص', 'Diagnosis'], ['التشخيص التفريقي', 'Differential'], ['العلاج', 'Treatment'], ['المضاعفات', 'Complications'], ['فخ امتحاني', 'Exam trap']].map(function (q) { return '<button type="button" data-act="qtag" data-t="' + esc(A(q[0], q[1])) + '">' + esc(A(q[0], q[1])) + '</button>'; }).join('') + '</div>' +
      '<div class="row sp"><span class="mut" id="nst">' + (n ? esc(A('آخر حفظ ', 'Saved ')) + esc(IS.ago(n.updated_at || n.created_at)) : '') + '</span><button class="btn pri sm" data-act="nsave" data-l="' + x.id + '" data-c="' + x.course_id + '" data-id="' + (n ? n.id : '') + '">' + ic('cloud') + esc(A('حفظ الملاحظات', 'Save notes')) + '</button></div></div>';
  }
  IS.ACT.qtag = function (b) { var e = $('[data-ed=note]'); if (!e) return; e.focus(); document.execCommand('insertHTML', false, '<p><b>' + esc(b.getAttribute('data-t')) + ':</b>&nbsp;</p>'); };
  IS.ACT.nsave = async function (b) {
    var body = IS.edVal(document, 'note'), id = b.getAttribute('data-id'), row = { user_id: uid(), lesson_id: b.getAttribute('data-l'), course_id: b.getAttribute('data-c'), body: body, updated_at: new Date().toISOString() };
    var r = id ? await DB.upd('notes', id, row) : await DB.ins('notes', row); b.setAttribute('data-id', r.id); $('#nst').textContent = A('حُفظت', 'Saved'); IS.toast(A('حُفظت الملاحظات', 'Notes saved'));
  };
  async function qaBox(c, x, box) {
    var ps = await DB.q('posts', { eq: { room: 'qa', lesson_id: x.id }, order: ['created_at', false] });
    ps = ps.filter(function (p) { return IS.publicPost(p) || (privateQuestion(p) && p.user_id === uid()); });
    box.innerHTML = '<form class="box form" data-form="ask"><input type="hidden" name="course" value="' + c.id + '"><input type="hidden" name="lesson" value="' + x.id + '"><input type="hidden" name="lecturer" value="' + c.lecturer_id + '"><label class="fl"><span>' + esc(A('اسأل المحاضر أو زملاءك عن هذا الدرس', 'Ask the lecturer or your classmates about this lesson')) + '</span><textarea name="body" rows="3" required maxlength="2000"></textarea></label><button class="btn pri sm">' + ic('send') + esc(A('أرسل للمراجعة', 'Send for review')) + '</button></form>' +
      (ps.length ? ps.map(postRow).join('') : '<p class="mut center">' + esc(A('لا توجد أسئلة بعد. كن أول من يسأل.', 'No questions yet. Be the first to ask.')) + '</p>');
  }
  IS.SUB.ask = async function (d) {
    var post = await DB.ins('posts', { room: 'qa', course_id: d.course, lesson_id: d.lesson, lecturer_id: d.lecturer,
      user_id: uid(), name: me().name, photo: me().photo || '', title: '', body: d.body, status: 'pending', n_replies: 0 });
    IS.go('post/' + post.id);
  };
  function postRow(p) {
    return '<a class="post" href="#post/' + p.id + '">' + IS.av({ name: p.name, photo: p.photo }, 'sm', p.user_id) + '<span class="pb"><b>' + esc(p.title || p.body.slice(0, 90)) + '</b><small>' + esc(p.name || '') + ' · ' + esc(IS.ago(p.created_at)) + (p.pinned ? ' · ' + esc(A('مثبّت', 'Pinned')) : '') + '</small></span>' + (privateQuestion(p) ? IS.status(p.status) : '<span class="pc">' + ic('chat') + N(p.n_replies || 0) + '</span>') + '</a>';
  }
  IS.postRow = postRow;

  /* ========== MY LEARNING ========== */
  IS.page('learning', async function () {
    var es = await DB.q('enrollments', { eq: { user_id: uid() }, order: ['created_at', false] }), ids = es.map(function (e) { return e.course_id; }).filter(Boolean);
    var cs = ids.length ? (await DB.q('courses', { in: { id: ids } })).filter(IS.inStudySpace) : [], C = {}; cs.forEach(function (c) { C[c.id] = c; });
    var prog = await DB.q('progress', { eq: { user_id: uid() } }), L = await IS.lecMap();
    var h = IS.banner(IS.T('تعلّمي', 'My learning'), esc(A('كورساتك وتقدّمك وطلبات الالتحاق.', 'Your courses, progress and enrolment requests.')), 'bookmark');
    var act = es.filter(function (e) { return e.status === 'active' && C[e.course_id]; }), pend = es.filter(function (e) { return e.status !== 'active' && C[e.course_id]; });
    h += act.length ? '<div class="grid g3">' + act.map(function (e) { var c = C[e.course_id], n = prog.filter(function (p) { return p.course_id === c.id; }).length, pc = c.n_lessons ? Math.min(100, Math.round(n / c.n_lessons * 100)) : 0;
      return '<article class="ccard mine" style="--cc:' + esc(c.color || 'var(--pri)') + '"><a class="ccimg" href="#course/' + c.id + '">' + (c.cover ? '<img src="' + IS.U(c.cover) + '" alt="">' : '<span class="ph">' + ic('layers') + '</span>') + '</a><div class="ccb"><h3><a href="#course/' + c.id + '">' + esc(c.title) + '</a></h3>' +
        '<span class="mut">' + esc((L[c.lecturer_id] || {}).name || '') + '</span><div class="prog">' + IS.bar(pc) + '<em>' + N(pc + '%') + '</em></div><div class="row"><a class="btn pri sm" href="#course/' + c.id + '">' + ic('play') + esc(pc ? A('تابع', 'Continue') : A('ابدأ', 'Start')) + '</a>' + (pc >= 100 ? '<a class="btn gold sm" href="#cert/' + c.id + '">' + ic('cert') + esc(A('الشهادة', 'Certificate')) + '</a>' : '') + '</div></div></article>'; }).join('') + '</div>' :
      IS.empty('bookmark', A('لم تلتحق بأي كورس بعد', 'You have not enrolled in a course yet'), A('تصفح الكورسات والتحق بما تحتاجه.', 'Browse the courses and enrol in what you need.'), '<a class="btn pri" href="#courses">' + ic('layers') + esc(A('تصفح الكورسات', 'Browse courses')) + '</a>');
    if (pend.length) h += '<section class="sec"><header class="sh"><h2>' + ic('receipt') + IS.T('طلبات الالتحاق', 'Enrolment requests') + '</h2></header><div class="table">' + pend.map(function (e) { var c = C[e.course_id];
      return '<div class="tr"><a href="#course/' + c.id + '"><b>' + esc(c.title) + '</b></a><span>' + IS.money(e.price) + '</span><span>' + esc(IS.date(e.created_at)) + '</span>' + (+e.price > 0 ? IS.paymentStatus(e.status) + IS.paymentLink(e) : IS.status(e.status)) + '</div>'; }).join('') + '</div></section>';
    var requestIds = Array.from(new Set(es.map(function (entry) { return entry.request_id; }).filter(Boolean)));
    if (requestIds.length) {
      var groups = (await DB.q('course_requests', { in: { id: requestIds } })).filter(IS.inStudySpace);
      if (groups.length) h += '<section class="box"><h2>' + IS.T('مجموعات التدريس', 'Teaching groups') + '</h2><div class="list">' + groups.map(function (group) {
        var entry = es.find(function (payment) { return payment.request_id === group.id; });
        return '<a class="li" href="#payment/' + esc(entry.id) + '">' + ic('users') + '<span><b dir="auto">' +
          esc(group.title) + '</b></span>' + IS.paymentStatus(entry.status) + '</a>';
      }).join('') + '</div></section>';
    }
    return h;
  }, { auth: true });

  /* ========== LECTURERS ========== */
  IS.page('lecturers', async function () {
    var r = await Promise.all([DB.q('lecturers', { eq: { status: 'active' } }), IS.pubCourses(true)]), cs = r[1].filter(IS.inStudySpace), ls = IS.studyLecturers(r[0], r[1]);
    var section = IS.mySection();
    var h = IS.banner(IS.T('المحاضرون', 'Lecturers'), section ? IS.navLbl(section.ar, section.en) : '', 'users',
      '<div class="bnums"><span><b>' + N(ls.length) + '</b>' + esc(A('محاضر', 'lecturers')) + '</span><span><b>' + N(cs.length) + '</b>' + esc(A('كورس', 'courses')) + '</span></div>');
    return h + (ls.length ? '<div class="grid g4">' + ls.map(function (l) { return lecCard(l, cs.filter(function (c) { return c.lecturer_id === l.id; }).length); }).join('') + joinCard() + '</div>' :
      IS.empty('users', A('لا يوجد محاضرون في هذا القسم بعد', 'No lecturers in this section yet'),
        A('تظهر هنا ملفات المحاضرين المعتمدين في هذا التخصص.', 'Approved lecturers teaching in this speciality appear here.'),
        '<a class="btn pri" href="#' + (IS.LEC ? 'studio' : 'studio-apply') + '">' + ic('studio') + esc(IS.LEC ? A('افتح الاستوديو', 'Open the studio') : A('انضم كمحاضر', 'Teach on Ishrah Li')) + '</a>'));
  });
  function joinCard() { if (IS.LEC) return '<article class="lcard join"><span class="av lg"><b>' + ic('studio') + '</b></span><h3>' + esc(A('استوديو المحاضر', 'Lecturer studio')) + '</h3><p>' + esc(A('أنت محاضر في اشرح لي: أنشئ كورساتك وتابع طلابك.', 'You are a lecturer on Ishrah Li: create your courses and follow your students.')) + '</p><div class="row"><a class="btn sm gold" href="#studio">' + ic('studio') + esc(A('افتح الاستوديو', 'Open the studio')) + '</a></div></article>';
    return '<article class="lcard join"><span class="av lg"><b>' + ic('plus') + '</b></span><h3>' + esc(A('انضم كمحاضر', 'Teach on Ishrah Li')) + '</h3><p>' + esc(A('قدّم كورساتك وصمّم صفحتك واربح من كل طالب.', 'Teach your courses, design your page and earn from every student.')) + '</p><div class="row"><a class="btn sm pri" href="#studio-apply">' + esc(A('قدّم طلبك', 'Apply')) + '</a></div></article>'; }
  IS.page('lecturer', async function (id) {
    var l = await DB.one('lecturers', id); if (!l || (l.status !== 'active' && !(IS.LEC && IS.LEC.id === id) && !IS.can('lecturers'))) return null;
    var courses = await DB.q('courses', { eq: { lecturer_id: id, status: 'published' }, order: ['published_at', false] });
    var cs = courses.filter(IS.inStudySpace), preview = (IS.LEC && IS.LEC.id === id) || IS.can('lecturers');
    if (!preview && !IS.studyLecturers([l], courses).length) {
      var selected = (l.teaching_spaces || []).find(function (space) { return space.startsWith(IS.SPEC + '/'); }) || (l.teaching_spaces || [])[0];
      var parts = selected && selected.split('/');
      var other = parts ? { spec: parts[0], cat: parts[1] } :
        courses.find(function (c) { return IS.studyScope(c).spec === IS.SPEC; }) || courses[0] ||
        { spec: IS.legacyTeachingSpec(l), cat: (IS.mySection() || IS.CATS[0] || {}).id };
      return IS.outsideStudySpace(other);
    }
    if (preview && !IS.mySection()) cs = courses;
    var r = await Promise.all([DB.q('events', { eq: { lecturer_id: id, status: 'published' }, order: ['starts'] }), IS.myEnroll()]);
    var ev = r[0].filter(IS.announcementInSection);
    var L = {}; L[id] = l; var st = cs.reduce(function (a, c) { return a + (+c.n_students || 0); }, 0), rv = cs.filter(function (c) { return c.n_reviews; }), rate = rv.length ? Math.round(rv.reduce(function (a, c) { return a + c.rating * c.n_reviews; }, 0) / rv.reduce(function (a, c) { return a + c.n_reviews; }, 0) * 10) / 10 : 0;
    var links = l.links || {};
    var h = '<nav class="crumb"><a href="#lecturers">' + esc(A('المحاضرون', 'Lecturers')) + '</a>' + ic('chev', 'fl') + '<span>' + esc(l.name) + '</span></nav>' +
      '<section class="lhero" style="--cc:' + esc(l.color || 'var(--pri)') + (l.cover ? ';--ci:url(' + IS.U(l.cover) + ')' : '') + '">' + IS.av(l, 'xl', id) + '<div class="lht"><h1 tabindex="-1">' + esc(l.name) + ' ' + ic('checkc', 'verified') + '</h1><p>' + esc(l.title || '') + '</p>' + IS.seen(id) +
      (l.specialty ? '<p class="mut2">' + esc(l.specialty) + '</p>' : '') + '<div class="tags lt">' + (l.tags || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div></div><div class="row">' + (!(me() && me().id === id) ? '<a class="btn sm gold" href="#course-requests/new/' + esc(id) + '">' + ic('mail') + esc(A('اطلب كورسًا أو محاضرة', 'Request a course or lecture')) + '</a>' : '') + IS.favBtn('t:' + id) + '<button class="fav" data-act="share" data-h="lecturer/' + id + '" aria-label="share">' + ic('share') + '</button></div></section>';
    h += '<div class="cols"><div class="main">' + (l.bio ? '<section class="box"><h2>' + ic('user') + IS.T('نبذة عن المحاضر', 'About the lecturer') + '</h2><div class="rich">' + IS.clean(l.bio) + '</div></section>' : '') +
      ((l.quals || []).length ? '<section class="box"><h2>' + ic('cert') + IS.T('المؤهلات والخبرة', 'Qualifications and experience') + '</h2><ul class="learn">' + l.quals.map(function (q) { return '<li>' + ic('checkc') + esc(q) + '</li>'; }).join('') + '</ul></section>' : '') +
      '<section class="sec"><header class="sh"><h2>' + ic('layers') + IS.T('الكورسات', 'Courses') + ' (' + N(cs.length) + ')</h2></header>' + (cs.length ? '<div class="grid g3">' + cs.map(function (c) { return IS.courseCard(c, L, r[1]); }).join('') + '</div>' : '<p class="mut">' + esc(A('لا توجد كورسات منشورة بعد.', 'No published courses yet.')) + '</p>') + '</section>' +
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
    var ev = (await DB.q('events', { eq: { status: 'published' }, order: ['starts'] })).filter(IS.announcementInSection), now = Date.now(), up = ev.filter(function (e) { return new Date(e.starts).getTime() + (e.minutes || 60) * 6e4 > now; }), past = ev.filter(function (e) { return up.indexOf(e) < 0; }).reverse();
    return IS.banner(IS.T('الفعاليات', 'Events'), esc(A('جلسات مباشرة، ورش عمل وندوات للتحضير للامتحانات.', 'Live sessions, workshops and exam-preparation seminars.')), 'cal') +
      '<section class="sec"><header class="sh"><h2>' + IS.T('القادمة', 'Upcoming') + '</h2></header>' + (up.length ? '<div class="box">' + up.map(evRow).join('') + '</div>' : IS.empty('cal', A('لا توجد فعاليات قادمة الآن', 'No upcoming events yet'), A('يعلن المحاضرون عن جلساتهم هنا.', 'Lecturers announce their sessions here.'))) + '</section>' +
      (past.length ? '<section class="sec"><header class="sh"><h2>' + IS.T('السابقة', 'Past') + '</h2></header><div class="box">' + past.map(evRow).join('') + '</div></section>' : '');
  });
  IS.page('event', async function (id) {
    var e = await DB.one('events', id); if (!e || e.status !== 'published') return null; if (!IS.announcementInSection(e) && !IS.can('events') && !(IS.LEC && IS.LEC.id === e.lecturer_id)) return IS.outsideStudySpace(e); var l = await DB.one('lecturers', e.lecturer_id) || {}, regs = await DB.q('event_regs', { eq: { event_id: id } }), mine = me() && regs.some(function (x) { return x.user_id === uid(); });
    var live = Date.now() > new Date(e.starts).getTime() - 15 * 6e4;
    return '<nav class="crumb"><a href="#events">' + esc(A('الفعاليات', 'Events')) + '</a>' + ic('chev', 'fl') + '<span>' + esc(e.title) + '</span></nav>' +
      '<section class="chero"' + (e.cover ? ' style="--ci:url(' + IS.U(e.cover) + ')"' : '') + '><div class="chin"><div class="cht"><span class="tags lt"><span>' + esc(e.kind === 'live' ? A('جلسة مباشرة', 'Live session') : e.kind === 'workshop' ? A('ورشة عمل', 'Workshop') : A('ندوة', 'Seminar')) + '</span></span><h1 tabindex="-1">' + esc(e.title) + '</h1>' +
      '<div class="chst"><span>' + ic('cal') + esc(IS.date(e.starts, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })) + '</span><span>' + ic('clock') + N(e.minutes || 60) + ' ' + esc(A('دقيقة', 'min')) + '</span><span>' + ic('users') + N(DB.live ? e.registered_count || 0 : regs.length) + ' ' + esc(A('مسجّل', 'registered')) + '</span></div>' +
      '<a class="chlec" href="#lecturer/' + l.id + '">' + IS.av(l, 'sm', l.id) + '<span><b>' + esc(l.name || '') + '</b><small>' + esc(l.title || '') + '</small>' + IS.seen(l.id) + '</span></a></div></div></section>' +
      '<section class="box buy event-registration">' +
      (mine ? '<p class="note ok">' + ic('checkc') + esc(A('أنت مسجّل في هذه الفعالية', 'You are registered')) + '</p>' + (e.link && live ? '<a class="btn pri" target="_blank" rel="noopener" href="' + esc(e.link) + '">' + ic('live') + esc(A('انضم الآن', 'Join now')) + '</a>' : '<p class="mut">' + esc(A('يظهر رابط الانضمام هنا قبل البدء بربع ساعة.', 'The joining link shows here 15 minutes before the start.')) + '</p>') +
        '<button class="btn ghost" data-act="unreg" data-id="' + id + '">' + esc(A('إلغاء التسجيل', 'Cancel registration')) + '</button>' : '<button class="btn pri" data-act="reg" data-id="' + id + '">' + ic('cal') + esc(A('سجّل في الفعالية', 'Register')) + '</button>') + '</section>' +
      (e.about ? '<section class="box"><h2>' + IS.T('عن الفعالية', 'About the event') + '</h2><div class="rich">' + IS.clean(e.about) + '</div></section>' : '');
  });
  async function eventCount(id) {
    if (DB.live) return;
    var registrations = await DB.q('event_regs', { eq: { event_id: id } });
    await DB.upd('events', id, { registered_count: registrations.length });
  }
  IS.ACT.reg = async function (b) {
    if (!me()) return IS.ACT.login();
    var id = b.getAttribute('data-id');
    await DB.ins('event_regs', { event_id: id, user_id: uid() }); await eventCount(id);
    IS.toast(A('تم تسجيلك', 'Registered')); IS.refresh();
  };
  IS.ACT.unreg = async function (b) {
    var id = b.getAttribute('data-id'), rows = await DB.q('event_regs', { eq: { event_id: id, user_id: uid() } });
    for (var row of rows) await DB.del('event_regs', row.id);
    await eventCount(id); IS.refresh();
  };

  /* ========== COMMUNITY ========== */
  var POST_KINDS = {
    discussion: {
      name: ['نقاش', 'Discussion'], title: ['عنوان النقاش', 'Discussion title'], body: ['موضوع النقاش', 'Discussion topic'],
      hint: ['ما الذي ترغب في مناقشته؟', 'What would you like to discuss?'], submit: ['انشر النقاش', 'Publish discussion']
    },
    question: {
      name: ['سؤال', 'Question'], title: ['سؤالك', 'Your question'], body: ['تفاصيل السؤال (اختياري)', 'Question details (optional)'],
      hint: ['أضف ما يساعد الآخرين على الإجابة.', 'Add any context that will help people answer.'], submit: ['أرسل للمراجعة', 'Send for review']
    },
    announcement: {
      name: ['إعلان', 'Announcement'], title: ['عنوان الإعلان', 'Announcement title'], body: ['نص الإعلان', 'Announcement text'],
      hint: ['ما الذي يحتاج الطلاب إلى معرفته؟', 'What do students need to know?'], submit: ['انشر الإعلان', 'Publish announcement']
    },
    course_preview: {
      name: ['معاينة كورس', 'Course preview'], title: ['عنوان الكورس', 'Course title'], body: ['نبذة عن الكورس (اختياري)', 'Course overview (optional)'],
      hint: ['ما الذي سيتعلمه الطلاب؟', 'What will students learn?'], submit: ['انشر معاينة الكورس', 'Publish course preview']
    }
  };
  function postKind(row) {
    if (Object.prototype.hasOwnProperty.call(POST_KINDS, row.post_kind)) return row.post_kind;
    return row.course_id || row.preview_video || row.preview_image || (row.highlights || []).length ? 'course_preview' : 'discussion';
  }
  function teacherPostAllowed() { return (IS.LEC && IS.LEC.status === 'active') || IS.can('notify', 'add'); }
  function privateQuestion(row) { return row.status === 'pending' || row.status === 'rejected'; }
  IS.publicPost = function (row) { return row.status !== 'removed' && !privateQuestion(row); };
  function postChoices(section) {
    var spec = IS.spec(IS.SPEC);
    var context = [spec && A(spec.ar, spec.en), section && A(section.ar, section.en)].filter(Boolean).join(' · ');
    var choices = [
      ['course-requests/new', 'receipt', 'اطلب كورسًا', 'Request a course', 'اختر محاضرًا أو اترك الطلب مفتوحًا. يُنشر بعد المراجعة.', 'Name a lecturer or leave the request open. It’s published after review.'],
      ['community/new/question', 'help', 'اسأل سؤالًا', 'Ask a question', 'يُنشر السؤال بعد مراجعة الإدارة.', 'An admin reviews the question before it appears.'],
      ['community/new/discussion', 'chat', 'ابدأ نقاشًا', 'Start a discussion', 'شارك موضوعًا للنقاش مع طلاب هذا القسم.', 'Start a conversation with students in this section.']
    ];
    if (IS.LEC && IS.LEC.status === 'active') choices.unshift(
      ['studio-course/new', 'layers', 'أنشئ كورسًا', 'Create a course', 'أضف الرسوم والموعد وطريقة التدريس والمعاينة.', 'Set the fee, schedule, teaching format and preview.'],
      ['studio-events/new', 'cal', 'أنشئ فعالية', 'Create an event', 'أعلن عن ورشة أو ندوة أو جلسة مباشرة.', 'Announce a workshop, seminar or live session.']);
    if (teacherPostAllowed()) choices.push(
      ['community/new/course_preview', 'video', 'معاينة كورس', 'Course preview', 'شارك صورة أو فيديو أو اربط كورسًا منشورًا.', 'Share a picture or video, or link a published course.'],
      ['community/new/announcement', 'mega', 'اكتب إعلانًا', 'Write an announcement', 'شارك تحديثًا في هذا القسم.', 'Share an update with this section.']);
    return '<section class="box post-composer"><h2 tabindex="-1" data-post-composer>' + IS.T('اختر ما تريد نشره', 'Choose what to post') + '</h2>' +
      '<p class="mut">' + esc(context) + '</p><div class="list">' + choices.map(function (choice) {
        return '<a class="li" href="#' + choice[0] + '">' + ic(choice[1]) + '<span><b>' + esc(A(choice[2], choice[3])) +
          '</b><small>' + esc(A(choice[4], choice[5])) + '</small></span>' + ic('chev', 'fl') + '</a>';
      }).join('') + '</div></section>';
  }
  async function postComposer(kind) {
    var spec = POST_KINDS[kind], preview = kind === 'course_preview';
    return '<form class="box form post-composer" data-form="post"><input type="hidden" name="kind" value="' + kind + '">' +
      '<div class="row sp"><h2 tabindex="-1" data-post-composer>' + IS.T.apply(null, spec.name) + '</h2><a class="link" href="#community/new">' +
      esc(A('خيارات النشر', 'Post options')) + '</a></div>' +
      '<label class="fl"><span>' + esc(A.apply(null, spec.title)) + '</span><input name="title" required maxlength="140"></label>' +
      '<label class="fl"><span>' + esc(A.apply(null, spec.body)) + '</span><textarea name="body" rows="3" maxlength="5000"' +
      (kind === 'discussion' || kind === 'announcement' ? ' required' : '') + ' placeholder="' + esc(A.apply(null, spec.hint)) + '"></textarea></label>' +
      (preview ? await lecturerPostFields() : '') +
      (kind === 'question' ? '<p class="mut">' + esc(A('يظهر السؤال للطلاب بعد موافقة الإدارة.', 'Students see your question after admin approval.')) + '</p>' : '') +
      '<div class="row end"><button class="btn pri sm">' + ic('send') + esc(A.apply(null, spec.submit)) + '</button></div></form>';
  }
  async function lecturerPostFields() {
    var courses = (await IS.pubCourses()).filter(function (c) { return IS.inStudySpace(c) && (c.lecturer_id === uid() || IS.can('notify', 'add')); });
    return '<fieldset class="fl post-extras"><legend>' + IS.T('مواد المعاينة', 'Preview materials') + '</legend>' +
      (courses.length ? '<label class="fl"><span>' + esc(A('اربط كورسًا منشورًا', 'Link a published course')) + '</span><select name="course"><option value="">' +
        esc(A('بدون كورس مرتبط', 'No linked course')) + '</option>' + courses.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.title) + ' · ' + (+c.price ? IS.money(c.price) : esc(A('مجاني', 'Free'))) + '</option>'; }).join('') +
        '</select><small>' + esc(A('يظهر سعر الكورس المسجّل تلقائيًا، ويدفع الطالب قبل الالتحاق بالكورس المدفوع.', 'The course fee is shown automatically. Students pay before enrolling in a paid course.')) + '</small></label>' : '') +
      '<div class="g2f"><label class="fl"><span>' + esc(A('صورة المعاينة', 'Preview picture')) + '</span><input type="file" accept="image/*" name="preview_image"></label>' +
      '<label class="fl"><span>' + esc(A('رابط فيديو المعاينة', 'Preview video link')) + '</span><input type="url" name="preview_video" dir="ltr" placeholder="YouTube / Google Drive"></label></div>' +
      '<label class="fl"><span>' + esc(A('مميزات الكورس (سطر لكل نقطة)', 'Course highlights (one per line)')) + '</span><textarea name="highlights" maxlength="600" rows="2"></textarea></label></fieldset>';
  }
  function postPreview(row, imageShown) {
    var video = IS.extEmbed(row.preview_video), highlights = row.highlights || [];
    if (!video && !row.preview_image && !highlights.length && !row.course_id) return '';
    return '<div class="post-preview">' +
      (!imageShown && row.preview_image ? '<img class="post-preview-photo" src="' + IS.U(row.preview_image) + '" alt="" loading="lazy">' : '') +
      (highlights.length ? '<ul class="post-highlights">' + highlights.map(function (feature) { return '<li dir="auto">' + esc(feature) + '</li>'; }).join('') + '</ul>' : '') +
      '<div class="row">' + (video ? '<button type="button" class="btn ghost sm" data-act="post-video" data-video="' + esc(row.preview_video) + '">' +
        ic('play') + esc(A('شاهد المعاينة', 'Watch preview')) + '</button>' : '') +
      (row.course_id ? '<a class="btn ' + (+row.linked_price ? 'pri' : 'ghost') + ' sm" href="#course/' + esc(row.course_id) + '">' +
        esc(+row.linked_price ? A('الدفع والالتحاق', 'Payment & enrolment') : A('عرض الكورس', 'View course')) + '</a>' : '') +
      '</div></div>';
  }
  IS.ACT['post-video'] = function (button) {
    var video = IS.extEmbed(button.dataset.video); if (!video) return;
    var player = document.createElement('div'); player.className = 'post-video';
    player.innerHTML = '<iframe src="' + esc(video.src) + '" allowfullscreen title="' + esc(A('معاينة الكورس', 'Course preview')) + '"></iframe>';
    button.closest('.post-preview').appendChild(player);
    button.remove();
    player.firstChild.focus();
  };
  IS.page('community', async function (room) {
    var section = IS.mySection(), cur = section ? section.id : 'general';
    var parts = String(room || '').split('/'), writing = parts[0] === 'new';
    var kind = ['question', 'discussion'].includes(parts[1]) || (['course_preview', 'announcement'].includes(parts[1]) && teacherPostAllowed()) ? parts[1] : '';
    if (section && IS.cat(room) && room !== section.id) return IS.outsideStudySpace({ spec: IS.SPEC, cat: room });
    var ps = await DB.q('posts', { eq: { room: cur }, order: ['created_at', false], limit: 200 });
    ps = ps.filter(function (p) { return IS.inSpec(p) && (IS.publicPost(p) || (privateQuestion(p) && p.user_id === uid())); });
    var own = ps.filter(privateQuestion);
    ps = ps.filter(IS.publicPost);
    var composer = me() && writing ? (kind ? await postComposer(kind) : postChoices(section)) :
      me() ? '<a class="btn pri" href="#community/new">' + ic('pen') + esc(A('اكتب منشورًا', 'Create a post')) + '</a>' : '';
    if (writing && composer) IS.after = function (main) {
      var heading = main.querySelector('[data-post-composer]');
      if (!heading) return;
      heading.focus({ preventScroll: true });
      heading.closest('.post-composer').scrollIntoView({ block: 'start' });
    };
    var list = ps.slice().sort(function (a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0); });
    var users = {}; ps.forEach(function (p) { users[p.user_id] = 1; });
    var h = IS.banner(IS.T('مجتمع الطلبة', 'Student Community'), esc(A('مساحة تفاعلية لطلبة الطب في السودان: ناقش، اسأل، شارك المعرفة، واطلب ما تحتاجه.', 'A space for medical students in Sudan: discuss, ask, share and request what you need.')), 'group',
      '<div class="bnums"><span><b>' + N(ps.length) + '</b>' + esc(A('نقاش', 'discussions')) + '</span><span><b>' + N(Object.keys(users).length) + '</b>' + esc(A('مشارك', 'members')) + '</span></div>');
    h += '<details class="rules community-rules"><summary>' + ic('shield') + esc(A('قواعد المجتمع', 'Community rules')) + ic('down') + '</summary><ul>' + [A('الاحترام أولًا: لا إساءة ولا تنمّر.', 'Respect first: no insults or bullying.'), A('لا تنشر محتوى الكورسات المدفوعة.', 'Do not post paid course content.'), A('لا نصائح علاجية لمرضى حقيقيين.', 'No treatment advice for real patients.'), A('أبلغ عن المخالفات ليراجعها المشرفون.', 'Report violations to the moderators.')].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></details>' +
      (me() ? composer :
        '<div class="box center">' + esc(A('سجّل الدخول لتشارك في النقاش.', 'Sign in to join the discussion.')) + ' <button class="btn pri sm" data-act="login">' + esc(A('دخول', 'Sign in')) + '</button></div>') +
      (own.length ? '<section class="box"><h2>' + IS.T('حالة أسئلتي', 'My question status') + '</h2><div class="posts">' + own.map(postRow).join('') + '</div></section>' : '') +
      (list.length ? '<div class="posts">' + list.map(postRow).join('') + '</div>' : IS.empty('chat', A('لا توجد نقاشات هنا بعد', 'No discussions here yet'), A('ابدأ أول نقاش.', 'Start the first one.')));
    return h;
  });
  IS.SUB.post = async function (d, form) {
    var section = IS.mySection();
    if (!me() || !section) return;
    var kind = Object.prototype.hasOwnProperty.call(POST_KINDS, d.kind) ? d.kind : 'discussion';
    if (['course_preview', 'announcement'].includes(kind) && !teacherPostAllowed()) return;
    var row = { room: section.id, post_kind: kind, spec: IS.SPEC, user_id: uid(), name: me().name, photo: me().photo || '', title: d.title, body: d.body || '', status: kind === 'question' ? 'pending' : 'open', n_replies: 0, pinned: false };
    if (kind === 'course_preview') {
      var picture = form.elements.preview_image && form.elements.preview_image.files[0];
      var video = d.preview_video && IS.extVideo(d.preview_video), highlights = IS.lines(d.highlights);
      if (d.preview_video && !video) return IS.toast(A('استخدم رابط يوتيوب أو Google Drive صالحًا.', 'Use a valid YouTube or Google Drive link.'), true);
      if (highlights.length > 6) return IS.toast(A('اكتب ست مميزات أو أقل.', 'Use six highlights or fewer.'), true);
      if (picture && (!/^image\//.test(picture.type) || picture.size > 10 * 1024 * 1024)) {
        return IS.toast(A('اختر صورة لا تتجاوز 10 ميغابايت.', 'Choose a picture under 10 MB.'), true);
      }
      row.course_id = d.course || null;
      if (IS.LEC && IS.LEC.status === 'active') row.lecturer_id = uid();
      row.preview_video = video || null; row.highlights = highlights;
      if (picture) row.preview_image = await DB.upload('media', await IS.shrink(picture, 1280, 0.84));
    }
    var post = await DB.ins('posts', row);
    if (kind !== 'question') IS.toast(A('نُشر', 'Posted'));
    IS.go('post/' + post.id);
  };
  IS.page('post', async function (arg) {
    var parts = String(arg || '').split('/'), id = parts[0];
    var p = await DB.one('posts', id); if (!p || p.status === 'removed') return null;
    if (privateQuestion(p)) {
      if (p.user_id !== uid() && !IS.can('review')) return null;
      var back = p.room === 'qa' ? '#lesson/' + p.course_id + '/' + p.lesson_id : '#community';
      var pending = p.status === 'pending';
      return '<nav class="crumb"><a href="' + esc(back) + '">' + esc(p.room === 'qa' ? A('الدرس', 'Lesson') : A('المجتمع', 'Community')) +
        '</a></nav><article class="box thread"><div><h1 tabindex="-1" dir="auto">' + esc(p.title || A('سؤالك', 'Your question')) + '</h1>' +
        IS.status(p.status) + '<p class="pre" dir="auto">' + esc(p.body) + '</p><p class="mut">' +
        esc(pending ? A('سيصلك إشعار بقرار الإدارة.', 'You’ll receive a notification with the review decision.') :
          A('لم يُنشر السؤال.', 'This question was declined.')) + '</p>' +
        (p.review_note ? '<p class="note bad pre" dir="auto">' + esc(p.review_note) + '</p>' : '') + '</div></article>';
    }
    var mod = IS.can('community'), owner = IS.LEC && p.lecturer_id === IS.LEC.id;
    if (!mod && !owner) {
      if (p.room === 'qa') {
        var course = await DB.one('courses', p.course_id);
        if (!course) return null;
        if (!IS.inStudySpace(course)) return IS.outsideStudySpace(course);
      } else if (IS.cat(p.room) && (!IS.inSpec(p) || (IS.mySection() && IS.mySection().id !== p.room))) {
        return IS.outsideStudySpace({ spec: p.spec || IS.SPEC, cat: p.room });
      } else if (!IS.inSpec(p)) return null;
    }
    if (p.room !== 'qa' && p.course_id) {
      var linked = await DB.one('courses', p.course_id);
      if (linked && linked.status === 'published') p.linked_price = linked.price;
      else p.course_id = null;
    }
    var rs = (await DB.q('replies', { eq: { post_id: id }, order: ['created_at'] })).filter(function (r) { return r.status !== 'removed'; });
    var lecs = await IS.lecMap();
    if (parts[1] === 'comments') IS.after = IS.focusPostComments;
    var composer = me() ? '<form class="form" data-form="reply"><input type="hidden" name="post" value="' + p.id + '">' +
      '<label class="fl"><span>' + esc(p.room === 'qa' ? A('اكتب ردًا', 'Write a reply') : A('اكتب تعليقًا', 'Write a comment')) +
      '</span><textarea name="body" rows="2" required maxlength="4000"></textarea></label>' +
      '<div class="row end"><button class="btn pri sm">' + ic('send') + esc(p.room === 'qa' ? A('أرسل الرد', 'Send reply') : A('انشر التعليق', 'Post comment')) + '</button></div></form>' : '';
    return '<nav class="crumb"><a href="#' + (p.room === 'qa' ? 'course/' + p.course_id : 'community') + '">' + esc(p.room === 'qa' ? A('الكورس', 'Course') : A('المجتمع', 'Community')) + '</a>' + ic('chev', 'fl') + '<span>' + esc(p.title || A('سؤال', 'Question')) + '</span></nav>' +
      '<article class="box thread">' + IS.av({ name: p.name, photo: p.photo }, 'md', p.user_id) + '<div><h1 tabindex="-1">' + esc(p.title || p.body.slice(0, 80)) + '</h1><small class="mut">' + esc(p.name || '') + ' · ' + esc(IS.ago(p.created_at)) + '</small><p class="pre">' + esc(p.body) + '</p>' + (p.room !== 'qa' ? postPreview(p, false) + IS.feedVoteBar('post', p) : '') +
      '<div class="row">' + (me() ? '<button class="btn ghost sm" data-act="report" data-kind="post" data-id="' + p.id + '">' + ic('flag') + esc(A('إبلاغ', 'Report')) + '</button>' : '') + (mod ? '<button class="btn ghost sm" data-act="pin" data-id="' + p.id + '">' + ic('pin') + esc(p.pinned ? A('إلغاء التثبيت', 'Unpin') : A('تثبيت', 'Pin')) + '</button><button class="btn ghost sm bad" data-act="rmpost" data-id="' + p.id + '">' + ic('trash') + esc(A('حذف', 'Remove')) + '</button>' : '') + '</div></div></article>' +
      '<section class="box post-comments"><h2 tabindex="-1" data-post-comments>' +
      (p.room === 'qa' ? IS.T('الردود', 'Replies') : IS.T('التعليقات', 'Comments')) + '</h2>' + composer + rs.map(function (r) { var isLec = !!lecs[r.user_id];
        return '<div class="box reply' + (isLec ? ' lec' : '') + '">' + IS.av({ name: r.name, photo: r.photo }, 'sm', r.user_id) + '<div><b>' + esc(r.name || '') + '</b>' + (isLec ? IS.chip(esc(A('محاضر', 'Lecturer')), 'ok') : '') + ' <small class="mut">' + esc(IS.ago(r.created_at)) + '</small><p class="pre">' + esc(r.body) + '</p>' +
          (mod ? '<button class="link bad" data-act="rmreply" data-id="' + r.id + '">' + esc(A('حذف', 'Remove')) + '</button>' : me() ? '<button class="link" data-act="report" data-kind="reply" data-id="' + r.id + '">' + esc(A('إبلاغ', 'Report')) + '</button>' : '') + '</div></div>'; }).join('') +
      '</section>';
  });
  IS.SUB.reply = async function (d) {
    var p = await DB.one('posts', d.post);
    if (!p || !IS.publicPost(p)) return;
    await DB.ins('replies', { post_id: d.post, user_id: uid(), name: me().name, photo: me().photo || '', body: d.body, status: 'open' });
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
    var n = (await DB.q('notices', { order: ['created_at', false], limit: 80 })).filter(function (x) { return x.user_id ? x.user_id === uid() : IS.announcementInSection(x); });
    var seen = IS.LS.get('seen-' + uid(), 0); IS.LS.set('seen-' + uid(), Date.now()); setTimeout(IS.bell, 50);
    return IS.banner(IS.T('الإشعارات', 'Notifications'), '', 'bell') + (n.length ? '<div class="list">' + n.map(function (x) {
      return '<a class="li' + (new Date(x.created_at).getTime() > seen ? ' new' : '') + '" href="' + esc(x.link || '#notifications') + '">' + ic(x.user_id ? 'bell' : 'sparkle') + '<span><b>' + esc(IS.noticeTitle(x)) + '</b>' + (x.body ? '<small>' + esc(x.body) + '</small>' : '') + '</span><em>' + esc(IS.ago(x.created_at)) + '</em></a>'; }).join('') + '</div>' :
      IS.empty('bell', A('لا توجد إشعارات', 'No notifications'), A('تصلك هنا موافقات الدفع والردود والإعلانات.', 'Payment approvals, replies and announcements arrive here.')));
  }, { auth: true });


  /* ========== ANNOUNCEMENTS & NEWS (owner's design, 18 Nov 2026) ==========
     announcements = public notices (Control → Announcements); news = table news (Control → News), each with a picture, a tag and a date */
  var NTAGS = [['news', 'أخبار', 'News'], ['events', 'فعاليات', 'Events'], ['achievements', 'إنجازات', 'Achievements'], ['initiatives', 'مبادرات', 'Initiatives'], ['academic', 'أكاديمي', 'Academic']];
  IS.NTAGS = NTAGS;
  function ntag(t) { var x = NTAGS.filter(function (k) { return k[0] === t; })[0] || NTAGS[0]; return A(x[1], x[2]); }
  IS.announcementInSection = function (notice) {
    var section = IS.mySection();
    return (!notice.spec || notice.spec === IS.SPEC) && (!notice.cat || (section && notice.cat === section.id));
  };
  async function sharedFeedRows(table, filters, limit) {
    var section = IS.mySection(), base = { order: ['created_at', false], limit: limit };
    var query = function (fields) { return DB.q(table, Object.assign({ eq: Object.assign({}, filters, fields) }, base)); };
    if (!DB.live) return (await query({})).filter(IS.announcementInSection).slice(0, limit);
    var sets = [query({ spec: null, cat: null })];
    if (IS.SPEC && section) sets.push(query({ spec: IS.SPEC, cat: section.id }));
    return (await Promise.all(sets)).flat().sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); }).slice(0, limit);
  }
  function annList(limit) { return sharedFeedRows('notices', { user_id: null }, limit || 60); }
  function newsList(limit) { return sharedFeedRows('news', { status: 'published' }, limit || 120); }
  function annRow(x) { return '<a class="annr" href="' + esc(x.link && x.link[0] === '#' ? x.link : '#news/ann') + '"><span class="anni">' + ic('mega') + '</span><span class="annt"><b>' + esc(IS.noticeTitle(x)) + '</b>' + (x.body ? '<small>' + esc(x.body) + '</small>' : '') + '<em>' + ic('cal') + esc(IS.date(x.created_at)) + '</em></span>' + ic('pinned', 'annp') + '</a>'; }
  function newsCard(x) { return '<a class="ncard" href="#news/' + x.id + '"><span class="ncv">' + (x.cover ? '<img src="' + IS.U(x.cover) + '" alt="" loading="lazy">' : '<i>' + ic('news') + '</i>') + '<em class="ntag">' + esc(ntag(x.tag)) + '</em></span><b>' + esc(x.title) + '</b><small>' + ic('cal') + esc(IS.date(x.created_at)) + '</small></a>'; }
  IS.page('news', async function (arg) {
    var r = await Promise.all([annList(), newsList()]), an = r[0], ns = r[1];
    var ban = IS.banner(IS.T('الإعلانات والأخبار', 'Announcements & News'), esc(A('تابع آخر الإعلانات والأخبار والتحديثات الهامة.', 'Follow the latest announcements, news and important updates.')), 'news');
    if (arg && arg.indexOf('ann/') === 0) {
      var announcement = await DB.one('notices', arg.slice(4));
      if (!announcement || announcement.user_id || !IS.announcementInSection(announcement)) return null;
      return '<article class="box narticle"><h1 tabindex="-1" dir="auto">' + esc(IS.noticeTitle(announcement)) + '</h1><p class="mut">' +
        esc(IS.date(announcement.created_at)) + '</p><p class="pre" dir="auto">' + esc(announcement.body || '') + '</p>' +
        (announcement.link && announcement.link[0] === '#' && announcement.link !== '#news/ann' ?
          '<a class="btn pri" href="' + esc(announcement.link) + '">' + esc(A('افتح الرابط', 'Open link')) + '</a>' : '') + '</article>';
    }
    if (arg && arg !== 'ann' && arg !== 'all') {
      var x = await DB.one('news', arg); if (!x || x.status !== 'published' || !IS.announcementInSection(x)) return null;
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


  /* ========== OUR TEAM (owner, 18 Nov 2026): the people who run the platform, with photos, so students know them and can reach them ==========
     only staff marked "show on the team page" (profiles.pub_show); students and visitors get the public card only (ish_team_public): no phone or email.
     "Message" opens a platform message to that person's department. */
  var TMSG = { owner: 'special', gm: 'special', academic: 'content', finance: 'payment', content: 'content', community: 'event', support: 'general', tech: 'tech' };
  async function teamList() {
    if (DB.live) { var r = await DB.sb.rpc('ish_team_public'); if (r.error) throw r.error; return r.data || []; }
    return (await DB.q('profiles')).filter(function (p) { return (p.team || []).length && p.pub_show && (p.team_status || 'active') === 'active' && p.status !== 'blocked'; })
      .map(function (p) { return { id: p.id, name: p.name, photo: p.photo, team: (p.team || []).filter(function (t) { return t.indexOf('p:') !== 0; }), dept: p.dept || '', pub_title: p.pub_title || '', pub_bio: p.pub_bio || '', pub_order: p.pub_order || 100 }; })
      .sort(function (a, b) { return a.pub_order - b.pub_order || String(a.name).localeCompare(String(b.name)); });
  }
  function roleOf(p) { var r = (p.team || [])[0]; return IS.ROLES.filter(function (x) { return x[0] === r; })[0] || IS.ROLES[IS.ROLES.length - 1]; }
  function deptOf(p) { var d = p.dept || ((p.team || []).filter(function (t) { return IS.DEPTS.some(function (x) { return x[0] === t; }); })[0]) || ''; return d; }
  function tcard(p, big) {
    var r = roleOf(p), d = deptOf(p), dn = IS.DEPTS.filter(function (x) { return x[0] === d; })[0], k = TMSG[(p.team || [])[0]] || TMSG[d] || 'general';
    return '<article class="tmc' + (big ? ' big' : '') + '"><div class="tmp">' + (p.photo ? '<img src="' + IS.U(p.photo) + '" alt="" loading="lazy">' : IS.av(p, 'xl')) + '</div>' +
      '<h3 dir="auto">' + esc(p.name) + '</h3>' + IS.seen(p.id) + '<p class="tmr">' + ic(r[3]) + '<span>' + esc(p.pub_title || A(r[1], r[2])) + '</span></p>' + (dn && !big ? '<p class="tmd">' + esc(A(dn[1], dn[2])) + '</p>' : '') +
      (p.pub_bio ? '<p class="tmb">' + esc(p.pub_bio) + '</p>' : '') +
      '<button class="btn sm ghost" data-act="ticket" data-k="' + k + '" data-s="' + esc(A('رسالة إلى ', 'Message to ') + p.name) + '">' + ic('chat') + esc(A('راسل', 'Message')) + '</button></article>';
  }
  IS.page('team', async function () {
    var all = []; try { all = await teamList(); } catch (e) { if (!navigator.onLine) throw e; }
    var h = IS.banner(IS.T('فريق المنصة', 'Our team'), esc(A('تعرّف على الفريق الذي يدير اشرح لي، وراسل أي قسم مباشرة من داخل المنصة.', 'Meet the people who run Ishrah Li, and message any department directly inside the platform.')), 'group');
    if (!all.length) return h + IS.empty('group', A('يظهر فريق المنصة هنا قريبًا', 'The platform team appears here soon'), A('يمكنك مراسلة الفريق الآن من «الدعم والرسائل».', 'You can message the team now from “Support & messages”.'), '<a class="btn pri" href="#support">' + ic('chat') + esc(A('الدعم والرسائل', 'Support & messages')) + '</a>');
    var lead = all.filter(function (p) { return ['owner', 'gm'].indexOf((p.team || [])[0]) >= 0; }), rest = all.filter(function (p) { return lead.indexOf(p) < 0; });
    if (lead.length) h += '<section class="sec"><header class="sh"><h2>' + ic('crown') + IS.T('قيادة المنصة', 'Leadership') + '</h2></header><div class="tmg lead">' + lead.map(function (p) { return tcard(p, true); }).join('') + '</div></section>';
    /* departments: one grid of fixed-size cards (department named on each card), and a row of buttons to message each department */
    var order = IS.DEPTS.map(function (d) { return d[0]; }), rk = function (p) { var i = order.indexOf(deptOf(p)); return (i < 0 ? 99 : i) * 10 + (roleOf(p)[0] === 'staff' ? 1 : 0); };
    rest.sort(function (a, b) { return rk(a) - rk(b) || (a.pub_order - b.pub_order); });
    var ds = IS.DEPTS.filter(function (d) { return rest.some(function (p) { return deptOf(p) === d[0]; }); });
    if (rest.length) h += '<section class="sec"><header class="sh"><h2>' + ic('group') + IS.T('الأقسام والفريق', 'Departments and team') + '</h2></header>' +
      (ds.length ? '<div class="tmdep">' + ds.map(function (d) { return '<button class="btn sm ghost" data-act="ticket" data-k="' + (TMSG[d[0]] || 'general') + '">' + ic('chat') + '<span>' + esc(A('راسل ', 'Message ')) + esc(A(d[1], d[2])) + '</span></button>'; }).join('') + '</div>' : '') +
      '<div class="tmg">' + rest.map(function (p) { return tcard(p); }).join('') + '</div></section>';
    return h;
  });
  /* the staff member's own card on the team page (also editable by managers in Users & permissions) */
  IS.pubFields = function (u) {
    return '<fieldset class="pubf"><legend>' + ic('group') + esc(A('بطاقتي في صفحة «فريق المنصة»', 'Card on the “Our team” page')) + '</legend>' +
      '<label class="chk sw2"><input type="checkbox" name="pub_show"' + (u.pub_show ? ' checked' : '') + '><span><b>' + esc(A('اعرض في صفحة فريق المنصة', 'Show on the Our team page')) + '</b><small>' + esc(A('تظهر الصورة والاسم والمسمى والنبذة فقط؛ لا يظهر الهاتف ولا البريد.', 'Only the photo, name, title and bio are shown; never the phone or email.')) + '</small></span></label>' +
      '<div class="g2f"><label class="fl"><span>' + esc(A('المسمى الظاهر (اختياري)', 'Title shown (optional)')) + '</span><input name="pub_title" maxlength="80" value="' + esc(u.pub_title || '') + '" placeholder="' + esc(A('مثال: استشاري الجراحة، المدير الأكاديمي', 'e.g. Consultant surgeon, Academic Director')) + '"></label>' +
      '<label class="fl"><span>' + esc(A('الترتيب في الصفحة', 'Order on the page')) + '</span><input name="pub_order" type="number" min="1" max="999" value="' + esc(u.pub_order || 100) + '"></label></div>' +
      '<label class="fl"><span>' + esc(A('نبذة قصيرة', 'Short bio')) + '</span><textarea name="pub_bio" rows="3" maxlength="600">' + esc(u.pub_bio || '') + '</textarea></label></fieldset>';
  };
  IS.pubRow = function (d, f) { return { pub_show: !!(f.pub_show && f.pub_show.checked), pub_title: (d.pub_title || '').trim(), pub_bio: (d.pub_bio || '').trim(), pub_order: Math.max(1, Math.min(999, parseInt(d.pub_order, 10) || 100)) }; };
  IS.ACT.mycard = function () { var m = me(); IS.sheet(esc(A('بطاقتي في فريق المنصة', 'My card on Our team')), '<form class="form" data-form="mycard">' + IS.pubFields(m) + '<p class="note">' + ic('image') + '<span>' + esc(A('الصورة هي صورة ملفك الشخصي.', 'The photo is your profile photo.')) + '</span></p><button class="btn pri wide">' + esc(A('حفظ', 'Save')) + '</button></form>'); };
  IS.SUB.mycard = async function (d, f) { await DB.upd('profiles', me().id, IS.pubRow(d, f)); await IS.loadMe(); IS.closeSheet(); IS.toast(A('حُفظت بطاقتك', 'Your card is saved')); IS.refresh(); };

  /* ========== FAVOURITES ========== */
  IS.page('favorites', async function () {
    var f = favs(), ks = Object.keys(f).sort(function (a, b) { return f[b] - f[a]; }), cids = ks.filter(function (k) { return /^c:/.test(k); }).map(function (k) { return k.slice(2); }), tids = ks.filter(function (k) { return /^t:/.test(k); }).map(function (k) { return k.slice(2); });
    var r = await Promise.all([cids.length ? DB.q('courses', { in: { id: cids } }) : [], tids.length ? DB.q('lecturers', { in: { id: tids } }) : [], IS.lecMap(), IS.myEnroll(), tids.length ? IS.pubCourses(true) : []]);
    r[0] = r[0].filter(IS.inStudySpace); r[1] = IS.studyLecturers(r[1], r[4]);
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
    var certificates = s.done.filter(IS.inStudySpace);
    return IS.banner(IS.T('الإنجازات', 'Achievements'), esc(A('نقاطك وشاراتك وشهاداتك من تعلّمك الفعلي.', 'Your points, badges and certificates from your real learning.')), 'trophy') +
      '<section class="lvl"><div class="lvn"><small>' + esc(A('المستوى', 'Level')) + '</small><b>' + N(lvl) + '</b></div><div class="lvb"><b>' + N(s.points) + ' ' + esc(A('نقطة', 'points')) + '</b>' + IS.bar((s.points - cur) / (nx - cur) * 100, 'gold') + '<small>' + N(nx - s.points) + ' ' + esc(A('نقطة للمستوى التالي', 'to the next level')) + '</small></div>' +
      '<div class="lvs">' + [['flame', s.streak, A('أيام متتالية', 'day streak')], ['checkc', s.lessons, A('درس منتهٍ', 'lessons')], ['cert', s.done.length, A('شهادة', 'certificates')]].map(function (r) { return '<span>' + ic(r[0]) + '<b>' + N(r[1]) + '</b><small>' + esc(r[2]) + '</small></span>'; }).join('') + '</div></section>' +
      '<p class="note">' + ic('info') + '<span>' + esc(A('النقاط: درس منتهٍ 10، كورس مكتمل 100، مشاركة 3، رد 2، تسجيل في فعالية 5.', 'Points: lesson 10, completed course 100, post 3, reply 2, event registration 5.')) + '</span></p>' +
      '<section class="sec"><header class="sh"><h2>' + IS.T('الشارات', 'Badges') + '</h2></header><div class="badges">' + BADGES.map(function (b) { var v = Math.min(1, b[6](s) || 0);
        return '<div class="badge' + (v >= 1 ? ' on' : '') + '"><span>' + ic(v >= 1 ? b[1] : 'lock') + '</span><b>' + esc(A(b[2], b[3])) + '</b><small>' + esc(A(b[4], b[5])) + '</small>' + (v < 1 ? IS.bar(v * 100) : '') + '</div>'; }).join('') + '</div></section>' +
      '<section class="sec"><header class="sh"><h2>' + IS.T('الشهادات', 'Certificates') + '</h2></header>' + (certificates.length ? '<div class="list">' + certificates.map(function (c) { return '<a class="li" href="#cert/' + c.id + '">' + ic('cert') + '<span><b>' + esc(c.title) + '</b></span></a>'; }).join('') + '</div>' : '<p class="mut">' + esc(A('أكمل كل دروس كورس لتحصل على شهادته.', 'Complete every lesson of a course to receive its certificate.')) + '</p>') + '</section>';
  }, { auth: true });
  IS.page('cert', async function (cid) {
    var c = await DB.one('courses', cid); if (!c) return null; if (!IS.inStudySpace(c)) return IS.outsideStudySpace(c); var P = await IS.myProgress(cid), n = Object.keys(P).length;
    if (!c.n_lessons || n < c.n_lessons) return IS.empty('lock', A('لم يكتمل الكورس بعد', 'The course is not complete yet'), N(n) + ' / ' + N(c.n_lessons || 0), '<a class="btn pri" href="#course/' + cid + '">' + esc(A('تابع الكورس', 'Continue')) + '</a>');
    var l = await DB.one('lecturers', c.lecturer_id) || {}, dt = Object.keys(P).map(function (k) { return P[k].done_at; }).sort().pop();
    var code = (cid.slice(0, 4) + uid().slice(0, 4)).toUpperCase();
    return '<div class="certp"><div class="cert"><img src="' + IS.logo() + '" alt="" class="cl"><small class="cb">' + esc(IS.brandName()) + '</small><h1 tabindex="-1">' + IS.T('شهادة إتمام', 'Certificate of Completion') + '</h1><p>' + esc(A('تشهد منصة اشرح لي بأن', 'Ishrah Li certifies that')) + '</p><h2>' + esc(me().name) + '</h2>' +
      '<p>' + esc(A('أتمّ بنجاح كورس', 'has successfully completed the course')) + '</p><h3>' + esc(c.title) + '</h3><p class="cm">' + N(c.n_lessons) + ' ' + esc(A('درسًا', 'lessons')) + ' · ' + esc(IS.date(dt, { day: 'numeric', month: 'long', year: 'numeric' })) + '</p>' +
      '<div class="cs"><span><i></i>' + esc(l.name || '') + '<small>' + esc(A('المحاضر', 'Lecturer')) + '</small></span><span><i></i>' + esc(IS.brandName()) + '<small>' + esc(A('إدارة المنصة', 'Platform')) + '</small></span></div><small class="cc" dir="ltr">ID ' + esc(code) + '</small></div>' +
      '<div class="row center"><button class="btn pri" data-act="print">' + ic('file') + esc(A('طباعة', 'Print')) + '</button></div></div>';
  }, { auth: true });
  IS.ACT.print = function () { window.print(); };

  /* ========== ACCOUNT (profile) ========== */
  IS.page('account', async function (tab) {
    var m = me(), s = await myStats(), apps = await DB.q('lecturer_apps', { eq: { user_id: m.id }, order: ['created_at', false] }), ap = apps[0];
    tab = tab || 'profile';
    var h = IS.banner(IS.T('صفحتي الشخصية', 'My profile'), '', 'user');
    h += '<section class="prof"><label class="pav">' + IS.av(m, 'xl') + '<span class="cam">' + ic('image') + '</span><input type="file" accept="image/*" id="myPhoto" hidden></label><div class="pt"><h1 tabindex="-1">' + esc(m.name) + '</h1><p>' + esc([m.university, m.year].filter(Boolean).join(' – ') || (IS.myRoles().filter(function (r) { return r[4] !== 'stu'; }).map(function (r) { return A(r[2], r[3]); }).join(' · ') || A('طالب', 'Student') + ' · ' + IS.mySpec().en)) + '</p>' +
      (m.city ? '<p class="mut">' + ic('pin') + esc(m.city) + '</p>' : '') + '<button class="btn ghost sm" data-act="editme">' + ic('pen') + esc(A('تعديل الملف', 'Edit profile')) + '</button>' + ((m.team || []).length ? ' <button class="btn ghost sm" data-act="mycard">' + ic('group') + esc(A('بطاقتي في فريق المنصة', 'My card on Our team')) + '</button>' : '') + '</div>' +
      '<div class="pstats">' + [['layers', s.courses, A('كورس مسجل', 'courses')], ['chart', s.avg + '%', A('معدل التقدّم', 'average progress')], ['cert', s.done.length, A('شهادات', 'certificates')], ['star', s.points, A('نقطة تعلّم', 'points')]].map(function (r) { return '<span>' + ic(r[0]) + '<b>' + N(r[1]) + '</b><small>' + esc(r[2]) + '</small></span>'; }).join('') + '</div></section>';
    h += '<nav class="rooms account-nav">' + [['profile', 'user', 'الملف الشخصي', 'Profile'], ['learning', 'layers', 'كورساتي', 'My courses', 1], ['achievements', 'cert', 'شهاداتي وإنجازاتي', 'Certificates', 1], ['favorites', 'heart', 'مفضلاتي', 'Favourites', 1], ['notifications', 'bell', 'الإشعارات', 'Notifications', 1], ['settings', 'gear', 'إعدادات الحساب', 'Account settings'], ['support', 'chat', 'الدعم والرسائل', 'Support & messages', 1], ['security', 'shield', 'الأمان', 'Security', 1]].map(function (x) {
      return '<a href="#' + (x[4] ? x[0] : 'account/' + x[0]) + '" class="' + (tab === x[0] ? 'on' : '') + '">' + ic(x[1]) + '<span>' + esc(A(x[2], x[3])) + '</span></a>'; }).join('') + '<button class="logout" data-act="logout">' + ic('logout') + '<span>' + esc(A('تسجيل الخروج', 'Sign out')) + '</span></button></nav><div class="account-content">';
    if (tab === 'settings') {
      h += '<section class="box"><h2>' + ic('gear') + IS.T('إعدادات الحساب', 'Account settings') + '</h2><ul class="kv"><li><span>' + esc(A('طريقة الدخول', 'Sign-in')) + '</span><b>' + esc(m.phone ? A('رقم الهاتف', 'Phone') + ' ' + m.phone : 'Google') + '</b></li><li><span>' + esc(A('اللغة', 'Language')) + '</span><b><button class="link" data-act="lang">' + (IS.lang === 'ar' ? 'English' : 'العربية') + '</button></b></li></ul>' +
        '<p class="mut">' + esc(A('لتغيير كلمة المرور أو رقم الهاتف راسل دعم المنصة.', 'To change your password or phone number, message platform support.')) + '</p><button class="btn ghost" data-act="ticket" data-k="general" data-s="' + esc(A('مساعدة في حسابي', 'Help with my account')) + '">' + ic('chat') + esc(A('راسل الدعم', 'Message support')) + '</button> <a class="btn ghost" href="#security">' + ic('shield') + esc(A('الأمان', 'Security')) + '</a></section>';
    } else {
      h += '<div class="grid g2"><section class="box"><header class="sh"><h2>' + ic('user') + IS.T('المعلومات الشخصية', 'Personal information') + '</h2></header><ul class="kv">' +
        [[A('الاسم الكامل', 'Full name'), m.name], [A('البريد الإلكتروني', 'Email'), m.email], [A('رقم الهاتف', 'Phone'), m.phone], [A('الجامعة', 'University'), m.university], [A('السنة الدراسية', 'Year'), m.year]].map(function (r) { return '<li><span>' + esc(r[0]) + '</span><b dir="auto">' + esc(r[1] || '—') + '</b></li>'; }).join('') +
        '<li><span>' + esc(A('الاهتمامات', 'Interests')) + '</span><span class="tags">' + (m.interests || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</span></li></ul></section>' +
        '<div><section class="box"><header class="sh"><h2>' + ic('user') + IS.T('نبذة عني', 'About me') + '</h2></header><p class="pre">' + esc(m.bio || A('اكتب نبذة قصيرة عنك.', 'Write a short note about yourself.')) + '</p></section>' +
        '<section class="box"><h2>' + ic('trophy') + IS.T('الإنجازات', 'Achievements') + '</h2><ul class="learn">' + (s.done.length ? s.done.slice(0, 3).map(function (c) { return '<li>' + ic('checkc') + esc(A('إتمام كورس ', 'Completed ')) + esc(c.title) + '</li>'; }).join('') : '') +
        (s.events ? '<li>' + ic('checkc') + esc(A('التسجيل في ', 'Registered for ')) + N(s.events) + ' ' + esc(A('فعاليات', 'events')) + '</li>' : '') + (s.lessons ? '<li>' + ic('checkc') + esc(A('إنهاء ', 'Finished ')) + N(s.lessons) + ' ' + esc(A('درس', 'lessons')) + '</li>' : '<li class="mut">' + esc(A('تظهر إنجازاتك هنا عندما تبدأ التعلّم.', 'Your achievements appear here once you start learning.')) + '</li>') + '</ul></section></div></div>';
      h += '<div class="grid g3 lecrow">' + (IS.LEC ? '<section class="box lecjoin">' + ic('studio') + '<h2>' + IS.T('أنت محاضر في اشرح لي', 'You are a lecturer on Ishrah Li') + '</h2><a class="btn pri" href="#studio">' + esc(A('افتح استوديو المحاضر', 'Open the lecturer studio')) + '</a></section>' :
        '<section class="box lecjoin"><img src="img/teach.svg" alt=""><h2>' + IS.T('التسجيل كمحاضر', 'Become a lecturer') + '</h2><p>' + esc(A('قدّم طلبك للانضمام إلى فريق المحاضرين في اشرح لي', 'Apply to join the lecturers of Ishrah Li')) + '</p><a class="btn pri" href="#studio-apply">' + ic('chev', 'fr') + esc(ap ? A('عرض طلبي', 'View my request') : A('تقديم طلب محاضر', 'Apply as a lecturer')) + '</a></section>') +
        '<section class="box"><h2>' + ic('file') + IS.T('متطلبات التسجيل كمحاضر', 'Requirements to become a lecturer') + '</h2>' + IS.lecReqs() + '</section>' +
        '<section class="box"><h2>' + ic('cert') + IS.T('حالة طلب المحاضر', 'Lecturer request status') + '</h2>' + IS.appSteps(ap) + '</section></div>';
    }
    h += '</div>';
    IS.after = function () { var f = $('#myPhoto'); if (f) f.onchange = async function () { if (!f.files[0]) return; var u = await DB.upload('media', await IS.shrink(f.files[0], 480, 0.85)); await DB.upd('profiles', m.id, { photo: u }); await IS.loadMe(); IS.toast(A('تم تحديث الصورة', 'Photo updated')); IS.refresh(); }; };
    return h;
  }, { auth: true });
  IS.lecReqs = function () {
    return '<ul class="learn">' + [A('البيانات الأساسية (الاسم، البريد، الهاتف)', 'Basic details (name, email, phone)'), A('المؤهل العلمي في تخصصك (مثل MBBS، BDS، BPharm، BSc تمريض أو مختبرات، أو أعلى)', 'Qualification in your speciality (e.g. MBBS, BDS, BPharm, BSc Nursing or Laboratory Science, or higher)'), A('التخصص والخبرة السريرية/الأكاديمية', 'Specialty and clinical/academic experience'),
      A('السيرة الذاتية (CV)', 'Curriculum vitae (CV)'), A('الشهادات والدورات ذات الصلة (اختياري)', 'Relevant certificates and courses (optional)'), A('عينة من المحتوى التعليمي (محاضرة مسجلة أو عرض)', 'A sample of your teaching (a recorded lecture or slides)'), A('خطة الكورس المقترح (العنوان، الأهداف، المحتوى)', 'Plan of the proposed course (title, aims, content)')].map(function (x) { return '<li>' + ic('checkc') + esc(x) + '</li>'; }).join('') + '</ul>';
  };
  IS.appSteps = function (ap) {
    var st = !ap ? 0 : ap.status === 'pending' || ap.status === 'changes' ? 1 : ap.status === 'approved' ? 3 : 2;
    var steps = [[A('تقديم الطلب', 'Request sent'), ap ? A('تم إرسال الطلب بنجاح', 'Your request was sent') + ' · ' + IS.date(ap.created_at) : A('لم تقدّم طلبًا بعد', 'Not sent yet')],
      ap && ap.status === 'changes' ? [A('مطلوب تعديل', 'Changes requested'), ap.note || A('عدّل طلبك وأرسله مرة أخرى.', 'Update your request and send it again.')] : [A('قيد المراجعة', 'Under review'), A('مراجعة من قبل فريق المنصة', 'Reviewed by the platform team')],
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
    var cs = await IS.pubCourses(true), ls = await DB.q('lecturers', { eq: { status: 'active' } });
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
