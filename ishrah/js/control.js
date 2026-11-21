/* اشرح لي: the control app (owner's admin design, 17 Nov 2026). Every member of the platform team sees only the parts of their role:
   owner · administrator · finance · content review · community moderator · student support. Also: learning paths (managed here, shown to students). */
(function () {
  'use strict';
  var A = IS.A, esc = IS.esc, ic = IS.ic, N = IS.N, $ = IS.$;
  var O = { area: 'control', auth: true };
  function P(perm) { return Object.assign({ perm: perm }, O); }
  function uid() { return IS.ME.id; }
  /* grouped side menu */
  IS.CTRL = [
    [null, [['control', 'home', 'لوحة التحكم', 'Dashboard', 'dash'], ['control-tickets', 'mail', 'صندوق الرسائل', 'Inbox', 'tickets'], ['control-tasks', 'checkc', 'المهام', 'Tasks', 'tasks']]],
    [['users', 'المستخدمون', 'Users'], [['control-students', 'user', 'الطلاب', 'Students', 'students'], ['control-lecturers', 'users', 'المحاضرون', 'Lecturers', 'lecturers'], ['control-apps', 'cert', 'طلبات المحاضرين', 'Lecturer requests', 'apps']]],
    [['layers', 'المحتوى التعليمي', 'Content'], [['control-review', 'eye', 'الكورسات والمراجعة', 'Courses & review', 'review'], ['control-library', 'open', 'الكتب والملفات', 'Books & files', 'library'], ['control-paths', 'route', 'المسارات التعليمية', 'Learning paths', 'paths']]],
    [['cal', 'الفعاليات', 'Events'], [['control-events', 'cal', 'إدارة الفعاليات', 'Manage events', 'events']]],
    [['receipt', 'الطلبات', 'Requests'], [['control-requests', 'receipt', 'طلبات المكتبة', 'Library requests', 'requests'], ['control-course-requests', 'chat', 'طلبات الكورسات', 'Course requests', 'review'], ['control-questions', 'help', 'مراجعة المنشورات والأسئلة', 'Posts and questions review', 'review']]],
    [['group', 'المجتمع والتواصل', 'Community'], [['control-community', 'flag', 'البلاغات والنقاشات', 'Reports & posts', 'community'], ['control-news', 'news', 'الأخبار', 'News', 'notify'], ['control-notify', 'bell', 'الإعلانات والإشعارات', 'Announcements', 'notify']]],
    [['wallet', 'الاشتراكات والمدفوعات', 'Payments'], [['control-pay', 'receipt', 'مراجعة المدفوعات', 'Payment review', 'pay'], ['control-payouts', 'wallet', 'مستحقات المحاضرين', 'Lecturer payouts', 'payout'], ['control-sales', 'cart', 'مبيعات المكتبة', 'Library sales', 'pay']]],
    [['chart', 'التقارير والتحليلات', 'Reports'], [['control-reports', 'chart', 'التقارير', 'Reports', 'reports']]],
    [['shield', 'إدارة الصلاحيات', 'Permissions'], [['control-structure', 'org', 'الهيكل الإداري', 'Administrative structure', 'dash'], ['control-team', 'shield', 'المستخدمون والصلاحيات', 'Users & permissions', 'team']]],
    [['gear', 'إدارة الموقع والتطبيق', 'Site & app'], [['control-cats', 'grid', 'الأقسام والمواد', 'Categories & subjects', 'cats'], ['control-settings', 'gear', 'الإعدادات العامة', 'General settings', 'settings'], ['control-usage', 'chart', 'الاستهلاك والسعة', 'Usage', 'settings'], ['control-audit', 'clock', 'سجل العمليات', 'Activity log', 'audit'], ['settings', 'globe', 'اللغة والمظهر', 'Language & appearance', 'dash']]]];
  IS.ctrlSide = function (page) {
    return IS.CTRL.map(function (g) {
      var it = g[1].filter(function (n) { return IS.can(n[4]); }); if (!it.length) return '';
      if (!g[0]) return it.map(function (n) { return '<a href="#' + n[0] + '" class="top' + (page === n[0] ? ' on' : '') + '">' + ic(n[1]) + IS.navLbl(n[2], n[3]) + '</a>'; }).join('');
      var open = it.some(function (n) { return n[0] === page || page.indexOf(n[0] + '/') === 0; });
      return '<details class="grp"' + (open ? ' open' : '') + '><summary>' + ic(g[0][0]) + IS.navLbl(g[0][1], g[0][2]) + ic('down', 'chv') + '</summary>' + it.map(function (n) { return '<a href="#' + n[0] + '" class="' + (page === n[0] ? 'on' : '') + '">' + IS.navLbl(n[2], n[3]) + '</a>'; }).join('') + '</details>';
    }).join('') + '<button class="logout" data-act="logout">' + ic('logout') + '<span>' + esc(A('تسجيل الخروج', 'Sign out')) + '</span></button>';
  };
  IS.ctrlItems = function () { var a = []; IS.CTRL.forEach(function (g) { g[1].forEach(function (n) { if (IS.can(n[4])) a.push(n); }); }); return a; };

  /* ---------- helpers ---------- */
  function months(n) { var a = [], d = new Date(); d.setDate(1); for (var i = n - 1; i >= 0; i--) { var x = new Date(d.getFullYear(), d.getMonth() - i, 1); a.push(x.toISOString().slice(0, 7)); } return a; }
  function area(points, labels) {
    var max = Math.max.apply(null, points.concat([1])), W = 300, H = 120, step = W / Math.max(1, points.length - 1);
    var pts = points.map(function (v, i) { return [i * step, H - 10 - v / max * (H - 26)]; }), line = pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
    return '<svg class="area" viewBox="-6 0 ' + (W + 12) + ' ' + (H + 18) + '" role="img"><polygon points="0,' + H + ' ' + line + ' ' + W + ',' + H + '"></polygon><polyline points="' + line + '"></polyline>' +
      pts.map(function (p, i) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.2"></circle>' + (i === pts.length - 1 ? '<text x="' + Math.min(p[0], W - 30) + '" y="' + (p[1] - 8) + '" class="tl">' + points[i] + '</text>' : ''); }).join('') +
      labels.map(function (l, i) { return '<text x="' + (i * step) + '" y="' + (H + 14) + '" text-anchor="middle">' + esc(l) + '</text>'; }).join('') + '</svg>';
  }
  function donut(parts, center, sub) {
    var tot = parts.reduce(function (a, p) { return a + p[1]; }, 0) || 1, a0 = 0, R = 40, C = 2 * Math.PI * R;
    return '<div class="donut"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="' + R + '" class="dbg"></circle>' + parts.map(function (p) { var len = p[1] / tot * C, s = '<circle cx="50" cy="50" r="' + R + '" stroke="' + p[2] + '" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-a0).toFixed(2) + '"></circle>'; a0 += len; return s; }).join('') +
      '</svg><div><b>' + center + '</b><small>' + esc(sub) + '</small></div></div>';
  }
  var PAL = ['#c99a2e', '#3fb7a8', '#7fd3c3', '#e9c46a', '#a996ff', '#c7cbd6', '#f28f6b'];
  function csv(name, rows) { var s = '﻿' + rows.map(function (r) { return r.map(function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([s], { type: 'text/csv;charset=utf-8' })); a.download = name + '.csv'; a.click(); }
  function q(sel) { return sel; }
  function tabsBar(base, cur, list) { return '<div class="tabs pills">' + list.map(function (t) { return '<a href="#' + base + '/' + t[0] + '" class="' + (cur === t[0] ? 'on' : '') + '">' + esc(t[1]) + (t[2] != null ? ' <i>' + N(t[2]) + '</i>' : '') + '</a>'; }).join('') + '</div>'; }

  /* ========== DASHBOARD ========== */
  IS.ctrlOverview = async function () {
    var r = await Promise.all([DB.q('profiles'), DB.q('lecturers'), DB.q('courses'), DB.q('lessons'), DB.q('files'), DB.q('events'), DB.q('requests', { order: ['created_at', false] }), DB.q('lecturer_apps', { order: ['created_at', false] }),
      DB.q('enrollments'), DB.q('progress'), DB.q('posts'), DB.q('event_regs'), DB.q('reports', { eq: { status: 'open' } }), DB.q('audit', { order: ['created_at', false], limit: 6 })]);
    var us = r[0], lec = r[1], cs = r[2], ls = r[3], fs = r[4], ev = r[5], rq = r[6], ap = IS.cleanApps(r[7], r[1]), en = r[8], pr = r[9], po = r[10], er = r[11], rp = r[12];
    var apWait = ap.filter(function (a) { return a.status === 'pending' || a.status === 'changes'; });
    var lecIds = {}; lec.forEach(function (l) { lecIds[l.id] = 1; }); var students = us.filter(function (u) { return !lecIds[u.id] && !(u.team || []).length; });
    var now = new Date(), mk = now.toISOString().slice(0, 7), ms = months(6);
    var act = en.filter(function (e) { return e.status === 'active'; }), rev = act.filter(function (e) { return String(e.decided_at || '').slice(0, 7) === mk; }).reduce(function (a, e) { return a + (+e.price || 0); }, 0);
    var rated = cs.filter(function (c) { return c.n_reviews; }), avg = rated.length ? (rated.reduce(function (a, c) { return a + c.rating * c.n_reviews; }, 0) / rated.reduce(function (a, c) { return a + c.n_reviews; }, 0)).toFixed(1) : '—';
    var started = act.filter(function (e) { return pr.some(function (p) { return p.user_id === e.user_id && p.course_id === e.course_id; }); }).length;
    var completed = act.filter(function (e) { var c = cs.filter(function (x) { return x.id === e.course_id; })[0]; return c && c.n_lessons && pr.filter(function (p) { return p.user_id === e.user_id && p.course_id === e.course_id; }).length >= c.n_lessons; }).length;
    var pc = function (a, b) { return b ? Math.round(a / b * 100) : 0; };
    var posters = {}; po.forEach(function (p) { posters[p.user_id] = 1; }); var regsU = {}; er.forEach(function (x) { regsU[x.user_id] = 1; });
    var pend = { apps: ap.filter(function (a) { return a.status === 'pending'; }).length, rev: cs.filter(function (c) { return c.status === 'review'; }).length, pay: en.filter(function (e) { return e.status === 'pending'; }).length,
      req: rq.filter(function (x) { return x.status === 'pending' || x.status === 'progress'; }).length, files: fs.filter(function (f) { return f.status === 'pending'; }).length, rep: rp.length, out: 0 };
    var growth = ms.map(function (m) { return us.filter(function (u) { return String(u.created_at).slice(0, 7) <= m; }).length; });
    var h = '<section class="cban"><img src="' + IS.logo() + '" alt=""><div><h1 tabindex="-1">' + IS.T('مرحبًا بك في لوحة إدارة منصة أكاديمية السودان للمراجعة', 'Welcome to the Sudan Master Review Academy admin panel') + '</h1><p>' + esc(A('تحكم كامل في المستخدمين، المحتوى، الكورسات، الفعاليات، الطلبات والأنظمة', 'Full control of users, content, courses, events, requests and systems')) + '</p></div>' +
      '<span class="role">' + ic('shield') + esc((IS.ME.team || []).map(function (t) { var x = IS.ROLES.filter(function (r) { return r[0] === t; })[0]; return x ? A(x[1], x[2]) : t; }).join(' · ')) + '</span></section>';
    h += '<div class="ctiles">' + [['users', us.length, A('إجمالي المستخدمين', 'Users')], ['cert', students.length, A('طلاب', 'Students')], ['studio', lec.length, A('محاضر', 'Lecturers')], ['layers', cs.filter(function (c) { return c.status === 'published'; }).length, A('كورس منشور', 'Courses')],
      ['video', ls.filter(function (l) { return l.kind === 'video'; }).length, A('محاضرة فيديو', 'Video lectures')], ['file', fs.filter(function (f) { return f.status === 'published'; }).length, A('ملف في المكتبة', 'Library files')], ['cal', ev.filter(function (e) { return new Date(e.starts) > now; }).length, A('فعالية قادمة', 'Upcoming events')], ['receipt', pend.req, A('طلب قيد التنفيذ', 'Open requests')]].map(function (t) {
        return '<div class="ctile">' + ic(t[0]) + '<b>' + N(t[1]) + '</b><small>' + esc(t[2]) + '</small></div>'; }).join('') + '</div>';
    if ((IS.ME.team || []).indexOf('owner') >= 0 || (IS.ME.team || []).indexOf('gm') >= 0) {
      var setup = [[!!IS.ME.mfa_on, 'shield', A('فعّل التحقق بخطوتين لحسابك', 'Turn on two-step login for your account'), '#security'], [!!IS.SET.bankak_account, 'wallet', A('راجع بيانات حساب بنكك للدفع', 'Check the Bankak payment details'), '#control-settings'],
        [us.some(function (u) { return u.id !== IS.ME.id && (u.team || []).length; }), 'crown', A('أضف فريق المنصة وحدّد الصلاحيات', 'Add the platform team and their permissions'), '#control-team'], [IS.SPECS.length > 0, 'grid', A('راجع التخصصات والأقسام والمواد', 'Review specialities, sections and subjects'), '#control-cats'],
        [lec.length > 0, 'studio', A('اعتمد أول محاضر', 'Approve the first lecturer'), '#control-apps'], [cs.some(function (c) { return c.status === 'published'; }), 'layers', A('انشر أول كورس', 'Publish the first course'), '#control-review'], [ev.length > 0, 'cal', A('أضف أول فعالية', 'Add the first event'), '#control-events']];
      var done = setup.filter(function (x) { return x[0]; }).length;
      if (done < setup.length) h += '<section class="box setup"><header class="sh"><h2>' + ic('route') + IS.T('تجهيز المنصة للإطلاق', 'Getting the platform ready') + '</h2><span class="chip">' + N(done) + ' / ' + N(setup.length) + '</span></header><div class="bar gold"><i style="width:' + Math.round(done / setup.length * 100) + '%"></i></div><ol class="stp">' +
        setup.map(function (x) { return '<li class="' + (x[0] ? 'ok' : '') + '"><a href="' + x[3] + '">' + ic(x[0] ? 'checkc' : x[1]) + '<span>' + esc(x[2]) + '</span>' + (x[0] ? '' : ic('chev', 'fl')) + '</a></li>'; }).join('') + '</ol></section>';
    }
    h += '<div class="cgrid"><section class="box"><header class="sh"><h2>' + ic('chart') + IS.T('نمو المستخدمين', 'User growth') + '</h2><span class="chip">' + esc(A('آخر 6 أشهر', 'Last 6 months')) + '</span></header>' + area(growth, ms.map(function (m) { return new Date(m + '-01').toLocaleDateString('en-GB', { month: 'short' }); })) + '</section>' +
      '<section class="box"><h2>' + ic('target') + IS.T('التفاعل', 'Engagement') + '</h2><div class="dwrap">' + donut([[started, 0, '#c99a2e'], [Math.max(0, act.length - started), 0, '#e6e2d6']].map(function (x) { return [x[2] === '#c99a2e' ? 'a' : 'b', x[0], x[2]]; }), N(pc(started, act.length) + '%'), A('بدأوا التعلّم', 'started')) +
      '<ul class="dleg">' + [[A('إكمال الكورسات', 'Course completion'), pc(completed, act.length), 'cert'], [A('حضور الفعاليات', 'Event registration'), pc(Object.keys(regsU).length, us.length), 'cal'], [A('التفاعل في النقاشات', 'Community participation'), pc(Object.keys(posters).length, us.length), 'chat'], [A('الالتحاق بكورس', 'Enrolled in a course'), pc(Object.keys(act.reduce(function (a, e) { a[e.user_id] = 1; return a; }, {})).length, students.length || 1), 'layers']].map(function (x) { return '<li>' + ic(x[2]) + '<span>' + esc(x[0]) + '</span><b>' + N(x[1] + '%') + '</b></li>'; }).join('') + '</ul></div></section>' +
      '<section class="box"><h2>' + ic('file') + IS.T('توزيع المحتوى', 'Content distribution') + '</h2><div class="dwrap">' + donut(IS.FKINDS.map(function (k, i) { return [k[0], fs.filter(function (f) { return f.kind === k[0]; }).length, PAL[i % PAL.length]]; }), N(fs.length), A('ملف', 'files')) +
      '<ul class="dleg">' + IS.FKINDS.map(function (k, i) { var n = fs.filter(function (f) { return f.kind === k[0]; }).length; return '<li><i style="background:' + PAL[i % PAL.length] + '"></i><span>' + esc(A(k[2], k[3])) + '</span><b>' + N(pc(n, fs.length) + '%') + '</b></li>'; }).join('') + '</ul></div></section>' +
      '<section class="box"><h2>' + ic('live') + IS.T('حالة المنصة', 'Platform status') + '</h2><p class="chip ' + (DB.live ? 'ok' : 'warn') + ' big">' + esc(DB.live ? A('تعمل بشكل طبيعي · قاعدة البيانات متصلة', 'Running normally · database connected') : A('نسخة معاينة على هذا الجهاز', 'Preview copy on this device')) + '</p>' +
      '<h3 class="sub">' + ic('chart') + esc(A('إحصاءات سريعة', 'Quick figures')) + '</h3><ul class="kv"><li><span>' + esc(A('اشتراكات مدفوعة مؤكدة في الكورسات', 'Confirmed paid course enrolments')) + '</span><b>' + N(act.filter(function (e) { return +e.price > 0; }).length) + '</b></li>' +
      '<li><span>' + esc(A('تسجيلات في كورسات مجانية', 'Free course enrolments')) + '</span><b>' + N(act.filter(function (e) { return !(+e.price > 0); }).length) + '</b></li><li><span>' + esc(A('إيرادات الشهر الحالي', 'Revenue this month')) + '</span><b>' + IS.money(rev) + '</b></li><li><span>' + esc(A('متوسط تقييم الكورسات', 'Average course rating')) + '</span><b><bdi dir="ltr">' + esc(avg) + (avg !== '—' ? ' / 5' : '') + '</bdi></b></li></ul></section></div>';
    var QA = [['control-students', 'users', A('إدارة المستخدمين', 'Manage users'), 0, 'students'], ['control-apps', 'cert', A('اعتماد المحاضرين', 'Approve lecturers'), pend.apps, 'apps'], ['control-review', 'layers', A('مراجعة الكورسات', 'Review courses'), pend.rev, 'review'], ['control-library', 'folder', A('إدارة الملفات', 'Manage files'), pend.files, 'library'],
      ['control-requests', 'receipt', A('مراجعة الطلبات', 'Review requests'), pend.req, 'requests'], ['control-pay', 'wallet', A('مراجعة المدفوعات', 'Review payments'), pend.pay, 'pay'], ['control-events', 'cal', A('إدارة الفعاليات', 'Manage events'), 0, 'events'], ['control-notify', 'bell', A('إضافة إعلان', 'Add announcement'), 0, 'notify']].filter(function (x) { return IS.can(x[4]); });
    h += '<div class="cols cflow"><div class="main"><section class="box"><h2>' + ic('sparkle') + IS.T('إجراءات سريعة', 'Quick actions') + '</h2><div class="qa">' + QA.map(function (x) { return '<a href="#' + x[0] + '">' + ic(x[1]) + '<span>' + esc(x[2]) + '</span>' + (x[3] ? '<i>' + N(x[3]) + '</i>' : '') + '</a>'; }).join('') + '</div></section>';
    h += '<div class="grid g2">' + (IS.can('requests') ? '<section class="box"><header class="sh"><h2>' + ic('receipt') + IS.T('أحدث الطلبات', 'Latest requests') + '</h2><a class="more" href="#control-requests">' + esc(A('عرض الكل', 'All')) + '</a></header>' + (rq.length ? '<div class="mtable"><div class="mh"><span>#</span><span>' + esc(A('المستخدم', 'User')) + '</span><span>' + esc(A('النوع', 'Type')) + '</span><span>' + esc(A('الحالة', 'Status')) + '</span></div>' +
      rq.slice(0, 5).map(function (x, i) { var k = IS.RKINDS.filter(function (y) { return y[0] === x.kind; })[0] || IS.RKINDS[4]; return '<a class="mr" href="#control-requests"><span class="mut">#' + (rq.length - i) + '</span><span><b>' + esc(x.title) + '</b><small>' + esc(x.name || '') + '</small></span><span>' + esc(A(k[2].replace('طلب ', ''), k[3])) + '</span>' + IS.rstatus(x.status) + '</a>'; }).join('') + '</div>' : '<p class="mut">' + esc(A('لا توجد طلبات.', 'No requests.')) + '</p>') + '</section>' : '') +
      (IS.can('apps') ? '<section class="box"><header class="sh"><h2>' + ic('cert') + IS.T('طلبات المحاضرين (للاعتماد)', 'Lecturer requests') + '</h2><a class="more" href="#control-apps">' + esc(A('عرض الكل', 'All')) + '</a></header>' + (apWait.length ? '<div class="mtable"><div class="mh"><span>' + esc(A('الاسم', 'Name')) + '</span><span>' + esc(A('التخصص', 'Specialty')) + '</span><span>' + esc(A('المؤهل', 'Qualification')) + '</span><span>' + esc(A('الحالة', 'Status')) + '</span></div>' +
      apWait.slice(0, 5).map(function (x) { return '<a class="mr" href="#control-apps"><span><b>' + esc(x.name) + '</b></span><span>' + esc(x.specialty) + '</span><span dir="ltr">' + esc(x.qual) + '</span>' + IS.status(x.status) + '</a>'; }).join('') + '</div>' : '<p class="mut">' + esc(A('لا توجد طلبات بانتظار الاعتماد.', 'No requests waiting for approval.')) + '</p>') + '</section>' : '') + '</div>';
    h += '<div class="grid g2"><section class="box"><h2>' + ic('chart') + IS.T('تقارير وتحليلات', 'Reports and analytics') + '</h2><div class="tools">' + [['users', A('تقرير المستخدمين', 'Users report'), 'users'], ['layers', A('تقرير الكورسات', 'Courses report'), 'courses'], ['money', A('تقرير الإيرادات', 'Revenue report'), 'revenue'], ['chart', A('تقرير التفاعل', 'Engagement report'), 'engagement'], ['cal', A('تقرير الفعاليات', 'Events report'), 'events']].map(function (x) { return '<a href="#control-reports/' + x[2] + '">' + ic(x[0]) + '<span>' + esc(x[1]) + '</span></a>'; }).join('') + '</div></section>' +
      '<section class="box"><h2>' + ic('gear') + IS.T('أدوات النظام', 'System tools') + '</h2><div class="tools">' + [['link', A('تكاملات خارجية', 'Integrations'), 'control-settings', 'settings'], ['clock', A('السجلات (Logs)', 'Logs'), 'control-audit', 'audit'], ['cloud', A('النسخ الاحتياطي', 'Backup'), 'control-settings/backup', 'settings'], ['shield', A('إدارة الصلاحيات', 'Permissions'), 'control-team', 'team'], ['grid', A('الأقسام والمواد', 'Categories'), 'control-cats', 'cats']].filter(function (x) { return IS.can(x[3]); }).map(function (x) { return '<a href="#' + x[2] + '">' + ic(x[0]) + '<span>' + esc(x[1]) + '</span></a>'; }).join('') + '</div></section></div></div>';
    var tasks = [[A('مراجعة طلبات المحاضرين', 'Review lecturer requests'), pend.apps, 'control-apps', 'apps'], [A('اعتماد كورسات جديدة', 'Approve new courses'), pend.rev, 'control-review', 'review'], [A('تأكيد مدفوعات الطلبة', 'Confirm student payments'), pend.pay, 'control-pay', 'pay'], [A('الرد على طلبات المكتبة', 'Answer library requests'), pend.req, 'control-requests', 'requests'],
      [A('مراجعة ملفات مرفوعة', 'Review uploaded files'), pend.files, 'control-library', 'library'], [A('معالجة البلاغات', 'Handle reports'), pend.rep, 'control-community', 'community']].filter(function (x) { return IS.can(x[3]); });
    h += '<aside class="aside"><section class="box"><h2>' + ic('checkc') + IS.T('المهام الإدارية', 'Admin tasks') + '</h2><ul class="tasks">' + tasks.map(function (x) { return '<li class="' + (x[1] ? '' : 'ok') + '"><a href="#' + x[2] + '">' + ic(x[1] ? 'clock' : 'checkc') + '<span>' + esc(x[0]) + (x[1] ? ' (' + N(x[1]) + ')' : '') + '</span></a></li>'; }).join('') + '</ul></section>' +
      '<section class="box"><h2>' + ic('bell') + IS.T('إشعارات النظام', 'System notifications') + '</h2><ul class="snote">' + (pend.apps ? '<li class="red">' + N(pend.apps) + ' ' + esc(A('طلبات محاضرين بانتظار المراجعة', 'lecturer requests waiting')) + '</li>' : '') + (pend.pay ? '<li class="red">' + N(pend.pay) + ' ' + esc(A('مدفوعات بانتظار التأكيد', 'payments waiting')) + '</li>' : '') + (pend.req ? '<li class="red">' + N(pend.req) + ' ' + esc(A('طلب محتوى جديد من الطلاب', 'new content requests')) + '</li>' : '') +
      cs.filter(function (c) { return c.status === 'review'; }).slice(0, 3).map(function (c) { return '<li class="grn">' + esc(A('كورس جديد جاهز للنشر: ', 'New course ready to publish: ')) + esc(c.title) + '</li>'; }).join('') +
      r[13].map(function (a) { return '<li>' + esc(a.name || '') + ': ' + esc(a.action) + ' <small>' + esc(IS.ago(a.created_at)) + '</small></li>'; }).join('') + (!pend.apps && !r[13].length && !cs.some(function (c) { return c.status === 'review'; }) ? '<li class="none">' + esc(A('لا توجد إشعارات جديدة', 'No new notifications')) + '</li>' : '') + '</ul></section></aside></div>';
    return h;
  };

  /* ========== PAYMENTS ========== */
  function canMessagePayment() { return IS.can('pay') && (IS.can('pay', 'edit') || IS.can('pay', 'approve')); }
  IS.page('control-pay', async function (tab) {
    tab = tab || 'pending';
    var tables = await Promise.all([DB.q('enrollments', { order: ['created_at', false] }), DB.q('courses'), DB.q('course_requests')]);
    var en = tables[0], targets = new Map(tables[1].concat(tables[2]).map(function (row) { return [row.id, row]; }));
    var list = en.filter(function (e) { return e.status === tab && +e.price > 0; });
    var approve = IS.can('pay', 'approve'), send = canMessagePayment();
    var h = IS.banner(IS.T('مراجعة المدفوعات', 'Payment review'),
      esc(A('راجع الإيصال وطابق المبلغ في بنكك، ثم اقبل الدفع أو ارفضه.', 'Check the receipt and match the amount in Bankak, then approve or reject the payment.')), 'receipt') +
      tabsBar('control-pay', tab, [['pending', A('قيد المراجعة', 'Under review'), en.filter(function (e) { return e.status === 'pending' && +e.price > 0; }).length],
        ['active', A('مقبولة', 'Approved')], ['rejected', A('مرفوضة', 'Rejected')]]);
    h += list.length ? '<div class="paylist">' + list.map(function (e) {
      var target = targets.get(e.request_id || e.course_id);
      return '<article class="box payc"><button class="rimg" data-act="receipt" data-p="' + esc(e.receipt || '') + '">' + ic('receipt') +
        '<span>' + esc(A('عرض الإيصال', 'View receipt')) + '</span></button><div class="grow"><b>' + esc(target ? target.title : '') +
        '</b><ul class="kv sm"><li><span>' + esc(A('الاسم', 'Name')) + '</span><b dir="auto">' + esc(e.payer || '') +
        '</b></li><li><span>' + esc(A('الهاتف', 'Phone')) + '</span><b dir="ltr">' + esc(e.phone || '') +
        '</b></li><li><span>' + esc(A('المبلغ', 'Amount')) + '</span><b>' + IS.money(e.price) +
        '</b></li><li><span>' + esc(A('تاريخ الإرسال', 'Submitted on')) + '</span><b>' +
        esc(IS.date(e.created_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) + '</b></li></ul>' +
        (e.note ? '<small class="mut" dir="auto">' + esc(e.note) + '</small>' : '') + '</div><div class="col">' +
        (tab === 'pending' && approve ? '<button class="btn pri" data-act="payok" data-id="' + e.id + '">' + ic('check') +
          esc(e.request_id ? A('أكّد الانضمام', 'Confirm seat') : A('تأكيد وفتح الكورس', 'Approve and open')) +
          '</button><button class="btn ghost bad" data-act="payno" data-id="' + e.id + '">' + ic('x') + esc(A('رفض', 'Reject')) + '</button>' : IS.paymentStatus(e.status)) +
        (send && e.user_id ? '<button class="btn ghost" data-act="paymsg" data-id="' + e.id + '">' + ic('mail') + esc(A('راسل الطالب', 'Message student')) + '</button>' : '') +
        '</div></article>';
    }).join('') + '</div>' : IS.empty('receipt', A('لا توجد مدفوعات هنا', 'Nothing here'));
    return h;
  }, P('pay'));
  IS.ACT.paymsg = async function (button) {
    if (!canMessagePayment()) return;
    var entry = await DB.one('enrollments', button.dataset.id);
    if (!entry || !entry.user_id || !(+entry.price > 0)) return;
    var messages = await DB.q('payment_messages', { eq: { enrollment_id: entry.id }, order: ['created_at', false], limit: 50 });
    IS.sheet(esc(A('راسل الطالب', 'Message student')), '<form class="form" data-form="paymsg"><input type="hidden" name="id" value="' +
      esc(entry.id) + '"><label class="fl"><span>' + esc(A('الرسالة إلى ', 'Message to ')) + '<bdi>' + esc(entry.payer) + '</bdi>' +
      '</span><textarea name="body" rows="3" required maxlength="2000"></textarea></label><button class="btn pri">' +
      ic('send') + esc(A('أرسل الرسالة', 'Send message')) + '</button></form>' + IS.paymentMessages(messages));
  };
  IS.SUB.paymsg = async function (data) {
    if (!canMessagePayment() || !data.body) return;
    var entry = await DB.one('enrollments', data.id);
    if (!entry || !entry.user_id || !(+entry.price > 0)) return;
    await DB.ins('payment_messages', { enrollment_id: entry.id, body: data.body });
    if (!DB.live) await IS.notify(entry.user_id, A('رسالة من فريق المدفوعات', 'Message from the payments team'), '', '#payment/' + entry.id);
    IS.closeSheet();
    IS.toast(A('أُرسلت الرسالة إلى الطالب.', 'Message sent to the student.'));
  };
  IS.ACT.receipt = async function (b) { var p = b.getAttribute('data-p'); if (!p) return IS.toast(A('لا يوجد إيصال', 'No receipt'), true); var u = await DB.fileUrl('receipts', p); IS.sheet(esc(A('الإيصال', 'Receipt')), '<img class="rcpt" src="' + esc(u) + '" alt="">', { wide: 1, nofocus: 1 }); };
  IS.ACT.payok = async function (b) {
    var entry = await DB.one('enrollments', b.dataset.id);
    if (!entry || entry.status !== 'pending') return IS.refresh();
    var targets = await Promise.all([
      DB.one(entry.request_id ? 'course_requests' : 'courses', entry.request_id || entry.course_id),
      entry.lecturer_id ? DB.one('lecturers', entry.lecturer_id) : null
    ]);
    var title = targets[0] ? targets[0].title : '';
    var share = (targets[1] && +targets[1].share) || +IS.SET.default_share || 70;
    var e = await DB.upd('enrollments', entry.id, { status: 'active', share: share, decided_at: new Date().toISOString(), decided_by: uid() });
    if (e.request_id) await IS.requestPaymentPreview(e.request_id); else await IS.recount(e.course_id);
    var page = '#payment/' + e.id;
    IS.notify(e.user_id, A('تم تأكيد دفعك', 'Your payment is confirmed'),
      (e.request_id ? A('تأكد مقعدك في ', 'Your seat is confirmed for ') : A('فُتح لك كورس ', 'You can now study ')) + title, page);
    if (e.lecturer_id && title) IS.notify(e.lecturer_id, A('طالب جديد في كورسك', 'New student in your course'), title, '#studio-students');
    IS.audit('approve payment', title + ' · ' + e.payer); IS.toast(A('تم التأكيد', 'Approved')); IS.refresh();
  };
  IS.ACT.payno = async function (b) {
    var entry = await DB.one('enrollments', b.dataset.id);
    if (!entry || entry.status !== 'pending') return IS.refresh();
    var why = await IS.ask(A('سبب الرفض', 'Reason for rejection'), A('يظهر للطالب', 'Shown to the student'), '',
      { area: 1, ok: A('رفض', 'Reject') });
    if (!why) return;
    var e = await DB.upd('enrollments', b.dataset.id, { status: 'rejected', note: why, decided_at: new Date().toISOString(), decided_by: uid() });
    if (e.request_id) await IS.requestPaymentPreview(e.request_id);
    IS.notify(e.user_id, A('رُفض إيصال الدفع', 'Payment receipt rejected'), '', '#payment/' + e.id);
    IS.audit('reject payment', e.payer); IS.refresh();
  };

  /* ========== COURSE REVIEW ========== */
  IS.page('control-review', async function (tab) {
    tab = tab || 'review'; var cs = await DB.q('courses', { order: ['updated_at', false] }), L = await IS.lecMap(), list = cs.filter(function (c) { return tab === 'all' ? true : c.status === tab; });
    return IS.banner(IS.T('الكورسات والمراجعة', 'Courses & review'), esc(A('افتح الكورس كما يراه الطالب وراجع دروسه، ثم انشره أو أعده للمحاضر بملاحظات.', 'Open the course as a student sees it and check its lessons, then publish it or return it with notes.')), 'eye') +
      tabsBar('control-review', tab, [['review', A('بانتظار المراجعة', 'Waiting'), cs.filter(function (c) { return c.status === 'review'; }).length], ['published', A('منشورة', 'Published')], ['hidden', A('مخفية', 'Hidden')], ['draft', A('مسودات', 'Drafts')], ['all', A('الكل', 'All')]]) +
      (list.length ? '<div class="table">' + list.map(function (c) { var l = L[c.lecturer_id] || {}; return '<div class="tr crow">' + (c.cover ? '<img src="' + IS.U(c.cover) + '" alt="">' : '<span class="ph sm">' + ic('layers') + '</span>') + '<span class="grow"><b>' + esc(c.title) + '</b><small class="mut">' + esc(l.name || '') + ' · ' + N(c.n_lessons || 0) + ' ' + esc(A('درس', 'lessons')) + ' · ' + (+c.price ? IS.money(c.price) : esc(A('مجاني', 'Free'))) + (c.n_students ? ' · ' + N(c.n_students) + ' ' + esc(A('طالب', 'students')) : '') + '</small></span>' + IS.status(c.status) +
        '<a class="btn sm ghost" href="#course/' + c.id + '" target="_blank">' + ic('eye') + esc(A('معاينة', 'Preview')) + '</a>' + (c.status === 'review' ? '<button class="btn sm pri" data-act="cpub" data-id="' + c.id + '">' + esc(A('نشر', 'Publish')) + '</button><button class="btn sm ghost bad" data-act="crej" data-id="' + c.id + '">' + esc(A('إعادة بملاحظات', 'Return')) + '</button>' :
          c.status === 'published' ? '<button class="btn sm ghost bad" data-act="chide" data-id="' + c.id + '">' + esc(A('إخفاء', 'Hide')) + '</button>' : c.status === 'hidden' ? '<button class="btn sm ghost" data-act="cpub" data-id="' + c.id + '">' + esc(A('إظهار', 'Show')) + '</button>' : '') + '</div>'; }).join('') + '</div>' : IS.empty('layers', A('لا توجد كورسات هنا', 'No courses here')));
  }, P('review'));
  IS.ACT.cpub = async function (b) { var c = await DB.upd('courses', b.getAttribute('data-id'), { status: 'published', published_at: new Date().toISOString(), review_note: '' }); IS.notify(c.lecturer_id, A('نُشر كورسك 🎉', 'Your course is published 🎉'), c.title, '#course/' + c.id); IS.audit('publish course', c.title); IS.refresh(); };
  IS.ACT.crej = async function (b) { var n = await IS.ask(A('ملاحظات للمحاضر', 'Notes for the lecturer'), A('ما الذي يجب تعديله؟', 'What should be changed?'), '', { area: 1, ok: A('إعادة', 'Return') }); if (!n) return; var c = await DB.upd('courses', b.getAttribute('data-id'), { status: 'rejected', review_note: n }); IS.notify(c.lecturer_id, A('كورسك يحتاج تعديلات', 'Your course needs changes'), n, '#studio-course/' + c.id + '/publish'); IS.audit('return course', c.title); IS.refresh(); };
  IS.ACT.chide = async function (b) { if (!(await IS.confirm(A('إخفاء الكورس عن الطلبة الجدد؟ يحتفظ الملتحقون بوصولهم.', 'Hide the course from new students? Enrolled students keep access.')))) return; var c = await DB.upd('courses', b.getAttribute('data-id'), { status: 'hidden' }); IS.audit('hide course', c.title); IS.refresh(); };

  /* ========== LECTURER APPLICATIONS ========== */
  IS.page('control-apps', async function (tab) {
    tab = tab || 'pending'; var ap = await DB.q('lecturer_apps', { order: ['created_at', false] }), lecs = {};
    (await DB.q('lecturers')).forEach(function (l) { if (l.status === 'active') lecs[l.id] = 1; });
    /* a waiting request of someone who is already a lecturer is closed, and a person with several open requests shows once (the newest) */
    var seenU = {}; ap = ap.filter(function (a) { var open = a.status === 'pending' || a.status === 'changes'; if (!open) return true;
      if (lecs[a.user_id]) { DB.upd('lecturer_apps', a.id, { status: 'approved', decided_at: a.decided_at || new Date().toISOString() }).catch(function () {}); a.status = 'approved'; return true; }
      if (seenU[a.user_id]) return false; seenU[a.user_id] = 1; return true; });
    var seenD = {}; ap = ap.filter(function (a) { if (a.status === 'pending' || a.status === 'changes') return true; var k = a.status + '/' + a.user_id; if (seenD[k]) return false; seenD[k] = 1; return true; });   // one decided row per person
    var list = ap.filter(function (a) { return a.status === tab; });
    return IS.banner(IS.T('طلبات المحاضرين', 'Lecturer requests'), esc(A('راجع المؤهل والسيرة والعينة وخطة الكورس قبل الاعتماد.', 'Check the qualification, CV, sample and course plan before approving.')), 'cert') +
      tabsBar('control-apps', tab, [['pending', A('بانتظار المراجعة', 'Waiting'), ap.filter(function (a) { return a.status === 'pending'; }).length], ['changes', A('مطلوب تعديل', 'Changes asked'), ap.filter(function (a) { return a.status === 'changes'; }).length], ['approved', A('معتمد', 'Approved')], ['rejected', A('مرفوض', 'Rejected')]]) +
      (list.length ? list.map(function (a) { return '<article class="box app"><header class="sh"><h2>' + IS.av(a, 'sm') + esc(a.name) + '</h2>' + IS.status(a.status) + '</header><ul class="kv sm"><li><span>' + esc(A('المؤهل', 'Qualification')) + '</span><b dir="ltr">' + esc(a.qual) + '</b></li><li><span>' + esc(A('التخصص', 'Specialty')) + '</span><b>' + esc(a.specialty) + '</b></li>' +
        ((a.teaching_spaces || []).length ? '<li><span>' + esc(A('التخصصات والأقسام', 'Teaching specialities and sections')) + '</span><b>' +
          esc(a.teaching_spaces.map(function (space) {
            var parts = space.split('/'), speciality = IS.spec(parts[0]), section = IS.cat(parts[1]);
            return [speciality && A(speciality.ar, speciality.en), section && A(section.ar, section.en)].filter(Boolean).join(' · ');
          }).join(' / ')) + '</b></li>' : '') + '<li><span>' + esc(A('اللقب', 'Title')) + '</span><b>' + esc(a.title || '—') + '</b></li><li><span>' + esc(A('الهاتف', 'Phone')) + '</span><b dir="ltr">' + esc(a.phone) + '</b></li><li><span>' + esc(A('البريد', 'Email')) + '</span><b dir="ltr">' + esc(a.email || '—') + '</b></li></ul>' +
        '<h3 class="sub">' + esc(A('الخبرة', 'Experience')) + '</h3><p class="pre">' + esc(a.experience) + '</p><h3 class="sub">' + esc(A('الكورس المقترح', 'Proposed course')) + ': ' + esc(a.plan_title) + '</h3><p class="pre">' + esc(a.plan) + '</p>' +
        '<div class="row">' + (a.cv ? '<button class="btn sm ghost" data-act="appfile" data-p="' + esc(a.cv) + '">' + ic('file') + esc(A('السيرة الذاتية', 'CV')) + '</button>' : '') + (a.certs ? '<button class="btn sm ghost" data-act="appfile" data-p="' + esc(a.certs) + '">' + ic('cert') + esc(A('الشهادات', 'Certificates')) + '</button>' : '') + (a.sample_file ? '<button class="btn sm ghost" data-act="appfile" data-p="' + esc(a.sample_file) + '">' + ic('video') + esc(A('ملف العينة', 'Sample file')) + '</button>' : '') + (a.sample ? '<a class="btn sm ghost" target="_blank" rel="noopener" href="' + esc(/^https?:/.test(a.sample) ? a.sample : 'https://' + a.sample) + '">' + ic('video') + esc(A('العينة', 'Sample')) + '</a>' : '') +
        '</div>' + (a.note && a.status !== 'rejected' ? '<p class="note' + (a.status === 'changes' ? ' warn' : '') + '">' + ic('chat') + '<span><b>' + esc(a.status === 'changes' ? A('التعديل المطلوب (بانتظار المحاضر): ', 'Changes asked (waiting for the applicant): ') : A('عُدّل الطلب بعد طلبكم: ', 'Updated after you asked: ')) + '</b>' + esc(a.note) + '</span></p>' : '') +
        (a.status === 'pending' ? '<div class="row end"><button class="btn ghost bad" data-act="appno" data-id="' + a.id + '">' + esc(A('رفض', 'Reject')) + '</button><button class="btn ghost" data-act="appchg" data-id="' + a.id + '">' + ic('pen') + esc(A('طلب تعديل', 'Request changes')) + '</button><button class="btn pri" data-act="appok" data-id="' + a.id + '">' + ic('check') + esc(A('اعتماد كمحاضر', 'Approve as lecturer')) + '</button></div>' : (a.note ? '<p class="mut">' + esc(a.note) + '</p>' : '')) + '</article>'; }).join('') : IS.empty('cert', A('لا توجد طلبات هنا', 'No requests here')));
  }, P('apps'));
  IS.ACT.appfile = async function (b) { var u = await DB.fileUrl('apps', b.getAttribute('data-p')); if (u) window.open(u, '_blank', 'noopener'); };
  IS.ACT.appok = async function (b) {
    var a = await DB.one('lecturer_apps', b.getAttribute('data-id')), ex = await DB.one('lecturers', a.user_id), share = +IS.SET.default_share || 70;
    var row = { id: a.user_id, name: a.name, title: a.title || '', specialty: a.specialty, teaching_specs: a.teaching_specs || [], teaching_spaces: a.teaching_spaces || [], bio: esc(a.experience).replace(/\n/g, '<br>'), quals: [a.qual + ' — ' + a.specialty], tags: [a.specialty], color: '#0f7a73', share: share, status: 'active', links: { whatsapp: a.phone }, pay: {}, n_students: 0 };
    if (ex) await DB.upd('lecturers', a.user_id, { status: 'active', teaching_specs: row.teaching_specs.length ? row.teaching_specs : ex.teaching_specs || [],
      teaching_spaces: row.teaching_spaces.length ? row.teaching_spaces : ex.teaching_spaces || [] }); else await DB.upsert('lecturers', row);
    await DB.upd('lecturer_apps', a.id, { status: 'approved', decided_at: new Date().toISOString(), decided_by: uid() });
    /* any other open copy of this person's request closes with it */
    var others = (await DB.q('lecturer_apps', { eq: { user_id: a.user_id } })).filter(function (x) { return x.id !== a.id && (x.status === 'pending' || x.status === 'changes'); });
    for (var i = 0; i < others.length; i++) await DB.upd('lecturer_apps', others[i].id, { status: 'approved', decided_at: new Date().toISOString(), decided_by: uid() }).catch(function () {});
    if (a.user_id === uid()) IS.LEC = await DB.one('lecturers', a.user_id).catch(function () { return null; });
    IS.notify(a.user_id, A('مبروك! تم اعتمادك محاضرًا', 'Congratulations! You are approved as a lecturer'), A('افتح استوديو المحاضر لتصميم صفحتك وإنشاء أول كورس.', 'Open the lecturer studio to design your page and create your first course.'), '#studio'); IS.audit('approve lecturer', a.name); IS.refresh();
  };
  IS.ACT.appchg = async function (b) {
    var n = await IS.ask(A('ما الذي يحتاج المحاضر إلى إضافته أو تعديله؟', 'What should the applicant add or change?'), A('يظهر للمحاضر في صفحة طلبه ويصله إشعار', 'Shown on the applicant’s request page; they get a notification'), '', { area: 1, ok: A('إرسال طلب التعديل', 'Send the request for changes') }); if (!n) return;
    var a = await DB.upd('lecturer_apps', b.getAttribute('data-id'), { status: 'changes', note: n, decided_at: new Date().toISOString(), decided_by: uid() });
    IS.notify(a.user_id, A('طلب المحاضر يحتاج إلى تعديل', 'Your lecturer request needs changes'), n, '#studio-apply'); IS.audit('ask changes to lecturer request', a.name); IS.toast(A('أُرسل طلب التعديل للمحاضر', 'The request for changes was sent')); IS.refresh();
  };
  IS.ACT.appno = async function (b) { var n = await IS.ask(A('سبب عدم القبول', 'Reason'), A('يظهر لصاحب الطلب', 'Shown to the applicant'), '', { area: 1, ok: A('رفض', 'Reject') }); if (!n) return; var a = await DB.upd('lecturer_apps', b.getAttribute('data-id'), { status: 'rejected', note: n, decided_at: new Date().toISOString(), decided_by: uid() });
    IS.notify(a.user_id, A('لم يُقبل طلب المحاضر', 'Lecturer request not accepted'), n, '#account'); IS.audit('reject lecturer', a.name); IS.refresh(); };

  /* ========== LECTURERS (shares, status, balances) ========== */
  async function balances() {
    var r = await Promise.all([DB.q('lecturers'), DB.q('enrollments', { eq: { status: 'active' } }), IS.can('payout', 'approve') ? DB.q('payouts') : [], DB.q('courses')]);
    return r[0].map(function (l) { var es = r[1].filter(function (e) { return e.lecturer_id === l.id; }), ps = r[2].filter(function (p) { return p.lecturer_id === l.id; });
      var gross = es.reduce(function (a, e) { return a + (+e.price || 0); }, 0), earned = es.reduce(function (a, e) { return a + IS.earnedShare(e, l.share == null ? 70 : +l.share); }, 0), paid = ps.filter(function (p) { return p.status === 'paid'; }).reduce(function (a, p) { return a + (+p.amount || 0); }, 0);
      return { l: l, n: es.length, gross: gross, earned: earned, paid: paid, bal: Math.max(0, earned - paid), courses: r[3].filter(function (c) { return c.lecturer_id === l.id; }).length }; });
  }
  IS.page('control-lecturers', async function () {
    var b = await balances();
    return IS.banner(IS.T('المحاضرون', 'Lecturers'), esc(A('نسبة كل محاضر من المبيعات، حالته، ورصيده.', 'Each lecturer’s share of sales, status and balance.')), 'users') + (b.length ? '<div class="table">' + b.map(function (x) { var l = x.l;
      return '<div class="tr">' + IS.av(l, 'sm', l.id) + '<span class="grow"><a href="#lecturer/' + l.id + '"><b>' + esc(l.name) + '</b></a> ' + IS.seen(l.id) + '<small class="mut">' + esc(l.specialty || '') + ' · ' + N(x.courses) + ' ' + esc(A('كورس', 'courses')) + ' · ' + N(x.n) + ' ' + esc(A('التحاق', 'enrolments')) + '</small></span>' +
        '<span class="cell"><small>' + esc(A('النسبة', 'Share')) + '</small><b>' + N((l.share == null ? 70 : l.share) + '%') + '</b></span>' + (IS.can('payout', 'approve') ? '<span class="cell"><small>' + esc(A('الرصيد', 'Balance')) + '</small><b>' + IS.money(x.bal) + '</b></span>' : '') + IS.status(l.status) +
        (IS.can('payout') ? '<button class="btn sm ghost" data-act="share" data-id="' + l.id + '" data-v="' + (l.share == null ? 70 : l.share) + '">' + ic('pen') + esc(A('النسبة', 'Share')) + '</button>' : '') + (IS.can('review') ? '<button class="btn sm ghost' + (l.status === 'active' ? ' bad' : '') + '" data-act="lstat" data-id="' + l.id + '" data-s="' + (l.status === 'active' ? 'hidden' : 'active') + '">' + esc(l.status === 'active' ? A('إيقاف', 'Suspend') : A('تفعيل', 'Activate')) + '</button>' : '') + '</div>'; }).join('') + '</div>' : IS.empty('users', A('لا يوجد محاضرون بعد', 'No lecturers yet')));
  }, P('lecturers'));
  IS.ACT.share = async function (b) { var v = await IS.ask(A('نسبة المحاضر من كل التحاق', 'Lecturer share of each enrolment'), '%', b.getAttribute('data-v'), { type: 'number' }); if (v === '' || v == null) return; v = Math.max(0, Math.min(100, +v)); var l = await DB.upd('lecturers', b.getAttribute('data-id'), { share: v }); IS.audit('set share ' + v + '%', l.name); IS.refresh(); };
  IS.ACT.lstat = async function (b) { var l = await DB.upd('lecturers', b.getAttribute('data-id'), { status: b.getAttribute('data-s') }); IS.audit((l.status === 'active' ? 'activate' : 'suspend') + ' lecturer', l.name); IS.refresh(); };

  /* ========== PAYOUTS ========== */
  IS.page('control-payouts', async function () {
    if (!IS.can('payout', 'approve')) return IS.empty('lock', A('يلزم إذن اعتماد تحويل الأرباح', 'Payout approval permission required'));
    var b = await balances(), ps = await DB.q('payouts', { order: ['created_at', false] });
    var open = ps.filter(function (p) { return p.status === 'requested'; });
    var history = ps.filter(function (p) { return p.status !== 'requested'; });
    var tot = b.reduce(function (a, x) { a.e += x.earned; a.p += x.paid; a.b += x.bal; return a; }, { e: 0, p: 0, b: 0 });
    var due = b.filter(function (x) { return x.bal > 0; });
    return IS.banner(IS.T('مستحقات المحاضرين', 'Lecturer payouts'), esc(A('حوّل عبر بنكك ثم سجّل التحويل مع إيصال الكورس.', 'Transfer with Bankak, then record the payment and attach the receipt to its course.')), 'wallet') +
      '<div class="tiles">' + [['wallet', IS.money(tot.e), A('حصة المحاضرين', 'Lecturers’ share')], ['checkc', IS.money(tot.p), A('تم تحويله', 'Paid out')], ['clock', IS.money(tot.b), A('مستحق للمحاضرين', 'Owed to lecturers')]].map(function (t) { return '<div class="tile">' + ic(t[0]) + '<b>' + t[1] + '</b><small>' + esc(t[2]) + '</small></div>'; }).join('') + '</div>' +
      (open.length ? '<section class="box"><h2>' + ic('clock') + IS.T('طلبات قيد التحويل', 'Pending payout requests') + '</h2><div class="table">' + open.map(function (p) {
        return '<div class="tr"><span class="grow"><b dir="auto">' + esc(p.name || '') + '</b><small class="mut" dir="auto">' +
          esc(p.course_title || A('حدد الكورس عند التسجيل', 'Select a course when recording')) + '</small></span><b>' + IS.money(p.amount) +
          '</b><button class="btn sm pri" data-act="payout" data-id="' + esc(p.lecturer_id) + '" data-pending="' + esc(p.id) + '">' +
          ic('send') + esc(A('سجّل تحويل الطلب', 'Record requested payout')) + '</button></div>';
      }).join('') + '</div></section>' : '') +
      '<div class="payout-lists"><section class="box"><h2>' + ic('users') + IS.T('الأرصدة المستحقة', 'Outstanding balances') + '</h2>' +
      (due.length ? '<div class="table">' + due.map(function (x) {
        return '<div class="tr">' + IS.av(x.l, 'sm') + '<span class="grow"><b dir="auto">' + esc(x.l.name) + '</b></span><b>' + IS.money(x.bal) +
          '</b><button class="btn sm ghost" data-act="payout" data-id="' + esc(x.l.id) + '">' +
          ic('send') + esc(A('سجّل تحويلًا', 'Record payout')) + '</button></div>';
      }).join('') + '</div>' : '<p class="mut">' + esc(A('لا توجد أرصدة مستحقة.', 'No outstanding balances.')) + '</p>') + '</section>' +
      '<section class="box"><h2>' + ic('receipt') + IS.T('سجل التحويلات', 'Payout history') + '</h2>' +
      (history.length ? '<div class="list">' + history.map(function (p) {
        return '<a class="li" href="#control-payout/' + esc(p.id) + '">' + ic('receipt') + '<span><b dir="auto">' + esc(p.name || '') +
          '</b><small dir="auto">' + esc([p.course_title, IS.date(p.paid_at || p.created_at)].filter(Boolean).join(' · ')) + '</small></span><b>' +
          IS.money(p.amount) + '</b>' + IS.payoutStatus(p) + '</a>';
      }).join('') + '</div>' : '<p class="mut">' + esc(A('لا توجد تحويلات.', 'No payouts.')) + '</p>') + '</section></div>';
  }, P('payout'));
  IS.page('control-payout', async function (id) {
    if (!IS.can('payout', 'approve')) return null;
    var row = await DB.one('payouts', id);
    return row ? IS.payoutDetail(row, 'control-payouts') : null;
  }, P('payout'));
  IS.ACT.payout = async function (button) {
    if (!IS.can('payout', 'approve')) return;
    var id = button.dataset.id;
    var data = await Promise.all([
      DB.one('lecturers', id), DB.one('lecturer_payout_accounts', id),
      DB.q('enrollments', { eq: { lecturer_id: id, status: 'active' } }), DB.q('payouts', { eq: { lecturer_id: id } })
    ]);
    var lecturer = data[0], bank = data[1];
    if (!lecturer) return;
    if (!bank) return IS.toast(A('لم يضف المحاضر حساب بنكك بعد.', 'The lecturer has yet to add a Bankak account.'), true);
    var pending = data[3].find(function (row) { return row.id === button.dataset.pending && row.status === 'requested'; });
    if (button.dataset.pending && !pending) return IS.refresh();
    var fields = IS.payoutSelect(await IS.payoutOptions(lecturer, data[2], data[3]), pending);
    if (!fields) return IS.toast(A('لا يوجد رصيد متاح للكورس أو المجموعة.', 'No balance is available for this course or group.'), true);
    var sheet = IS.sheet(esc(A('تسجيل تحويل أرباح', 'Record a payout')), '<form class="form" data-form="payout">' +
      '<input type="hidden" name="id" value="' + esc(id) + '"><input type="hidden" name="pending" value="' + esc(pending ? pending.id : '') + '">' +
      '<section class="payout-recipient"><h3>' + ic('lock') + esc(A('حساب بنكك للمحاضر', 'Lecturer’s Bankak account')) + '</h3>' +
      '<dl class="payout-bank"><div><dt>' + esc(A('اسم صاحب الحساب', 'Account holder')) + '</dt><dd dir="auto">' + esc(bank.account_name) +
      '</dd></div><div><dt>' + esc(A('رقم الحساب', 'Account number')) + '</dt><dd dir="ltr">' + esc(bank.account) + '</dd></div></dl></section>' + fields +
      '<label class="fl file"><span>' + esc(A('إيصال التحويل', 'Transfer receipt')) + '</span><input name="receipt" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required></label>' +
      '<label class="fl"><span>' + esc(A('ملاحظة للمحاضر', 'Note to the lecturer')) + '</span><textarea rows="3" name="note" maxlength="2000" dir="auto"></textarea></label>' +
      '<label class="fl"><span>' + esc(A('مرجع التحويل (اختياري)', 'Transfer reference (optional)')) + '</span><input name="ref" maxlength="150" dir="auto"></label>' +
      '<button class="btn pri wide">' + ic('check') + esc(A('حفظ التحويل وإشعار المحاضر', 'Save payout and notify lecturer')) + '</button></form>');
    IS.bindPayoutAmount(sheet.querySelector('form'));
  };
  IS.SUB.payout = async function (d, form) {
    if (!IS.can('payout', 'approve')) return;
    var file = form.elements.receipt.files[0];
    if (!file || file.size > 8 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      return IS.toast(A('اختر صورة أو PDF للإيصال بحجم لا يزيد عن 8 ميغابايت.', 'Choose an image or PDF receipt up to 8 MB.'), true);
    }
    if (form.payoutFile !== file) {
      form.payoutPath = await DB.upload('payout-receipts', file);
      form.payoutFile = file;
    }
    var id = await IS.savePayout(d, 'record', form.payoutPath);
    IS.closeSheet();
    IS.toast(A('حُفظ التحويل وأُشعر المحاضر.', 'Payout saved and lecturer notified.'));
    IS.go('control-payout/' + id);
  };

  /* ========== STUDENTS ========== */
  IS.page('control-students', async function (q) {
    q = decodeURIComponent(q || ''); var us = await DB.q('profiles', { order: ['created_at', false] }), lec = await IS.lecMap(), en = await DB.q('enrollments');
    var w = IS.norm(q).split(' ').filter(Boolean), list = us.filter(function (u) { return !w.length || w.every(function (x) { return IS.norm([u.name, u.phone, u.email, u.university].join(' ')).indexOf(x) >= 0; }); });
    return IS.banner(IS.T('المستخدمون', 'Users'), N(us.length) + ' ' + esc(A('حساب', 'accounts')), 'user', '<button class="btn lt" data-act="exportusers">' + ic('file') + esc(A('تصدير CSV', 'Export CSV')) + '</button>') +
      '<form class="tool" data-form="usearch"><label class="field">' + ic('search') + '<input name="q" type="search" value="' + esc(q) + '" placeholder="' + esc(A('ابحث بالاسم أو الهاتف أو البريد…', 'Search by name, phone or email…')) + '"></label><button class="btn pri">' + esc(A('بحث', 'Search')) + '</button></form>' +
      '<div class="table">' + list.slice(0, 300).map(function (u) { var n = en.filter(function (e) { return e.user_id === u.id && e.status === 'active'; }).length;
        return '<div class="tr">' + IS.av(u, 'sm', u.id) + '<span class="grow"><b>' + esc(u.name) + '</b> ' + IS.seen(u.id, u.last_seen) + '<small class="mut" dir="auto">' + esc([u.phone, u.email, u.university, u.year].filter(Boolean).join(' · ')) + '</small></span>' + (lec[u.id] ? IS.chip(esc(A('محاضر', 'Lecturer')), 'ok') : '') + ((u.team || []).length ? IS.chip(esc(A('فريق', 'Team')), 'warn') : '') +
          '<span class="cell"><small>' + esc(A('كورسات', 'Courses')) + '</small><b>' + N(n) + '</b></span><span class="mut">' + esc(IS.date(u.created_at)) + '</span>' + IS.status(u.status || 'active') + '<button class="btn sm ghost" data-act="umenu" data-id="' + u.id + '">' + ic('more') + '</button></div>'; }).join('') + '</div>';
  }, P('students'));
  IS.SUB.usearch = function (d) { IS.go('control-students/' + encodeURIComponent(d.q || '')); };
  IS.ACT.umenu = async function (b) {
    var u = await DB.one('profiles', b.getAttribute('data-id')), en = await DB.q('enrollments', { eq: { user_id: u.id } }), cs = await DB.q('courses'), C = {}; cs.forEach(function (c) { C[c.id] = c; });
    IS.sheet(esc(u.name), '<ul class="kv"><li><span>' + esc(A('الهاتف', 'Phone')) + '</span><b dir="ltr">' + esc(u.phone || '—') + '</b></li><li><span>' + esc(A('البريد', 'Email')) + '</span><b dir="ltr">' + esc(u.email || '—') + '</b></li><li><span>' + esc(A('التسجيل', 'Joined')) + '</span><b>' + esc(IS.date(u.created_at)) + '</b></li></ul>' +
      '<h3 class="sub">' + esc(A('الكورسات', 'Courses')) + '</h3>' + (en.length ? '<div class="list">' + en.map(function (e) { return '<div class="li"><span><b>' + esc((C[e.course_id] || {}).title || '') + '</b><small>' + IS.money(e.price) + '</small></span>' + IS.status(e.status) + '</div>'; }).join('') + '</div>' : '<p class="mut">—</p>') +
      '<div class="row wrap"><button class="btn ghost sm" data-act="grant" data-id="' + u.id + '">' + ic('plus') + esc(A('منح كورس', 'Grant a course')) + '</button>' + (u.phone ? '<button class="btn ghost sm" data-act="setpass" data-id="' + u.id + '">' + ic('lock') + esc(A('تعيين كلمة مرور', 'Set password')) + '</button>' : '') +
      '<button class="btn ghost sm" data-act="umsg" data-id="' + u.id + '">' + ic('bell') + esc(A('إشعار خاص', 'Send notice')) + '</button><button class="btn sm ' + (u.status === 'blocked' ? 'pri' : 'ghost bad') + '" data-act="ublock" data-id="' + u.id + '" data-s="' + (u.status === 'blocked' ? 'active' : 'blocked') + '">' + esc(u.status === 'blocked' ? A('إلغاء الإيقاف', 'Unblock') : A('إيقاف الحساب', 'Block')) + '</button></div>', { nofocus: 1 });
  };
  IS.ACT.ublock = async function (b) { var u = await DB.upd('profiles', b.getAttribute('data-id'), { status: b.getAttribute('data-s') }); IS.audit(u.status === 'blocked' ? 'block user' : 'unblock user', u.name); IS.closeSheet(); IS.refresh(); };
  IS.ACT.setpass = async function (b) { var p = await IS.ask(A('كلمة مرور جديدة', 'New password'), A('6 أحرف على الأقل، أرسلها للطالب', 'At least 6 characters; send it to the student')); if (!p || p.length < 6) return; await DB.setPassword(b.getAttribute('data-id'), p); IS.audit('set password', b.getAttribute('data-id')); IS.toast(A('عُيّنت كلمة المرور', 'Password set')); };
  IS.ACT.umsg = async function (b) { var t = await IS.ask(A('إشعار خاص', 'Personal notice'), A('النص', 'Text'), '', { area: 1, ok: A('إرسال', 'Send') }); if (!t) return; await IS.notify(b.getAttribute('data-id'), A('رسالة من إدارة المنصة', 'Message from the platform'), t, '#notifications'); IS.toast(A('أُرسل', 'Sent')); };
  IS.ACT.grant = async function (b) { var cs = await DB.q('courses', { eq: { status: 'published' } }), uid2 = b.getAttribute('data-id');
    IS.sheet(esc(A('منح كورس دون دفع', 'Grant a course without payment')), '<form class="form" data-form="grant"><input type="hidden" name="u" value="' + uid2 + '"><label class="fl"><span>' + esc(A('الكورس', 'Course')) + '</span><select name="c">' + cs.map(function (c) { return '<option value="' + c.id + '">' + esc(c.title) + '</option>'; }).join('') + '</select></label><label class="fl"><span>' + esc(A('السبب', 'Reason')) + '</span><input name="note" required></label><button class="btn pri wide">' + esc(A('منح', 'Grant')) + '</button></form>'); };
  IS.SUB.grant = async function (d) { var c = await DB.one('courses', d.c), u = await DB.one('profiles', d.u); await DB.ins('enrollments', { course_id: c.id, user_id: u.id, lecturer_id: c.lecturer_id, status: 'active', price: 0, payer: u.name, phone: u.phone || '', note: d.note, decided_at: new Date().toISOString(), decided_by: uid() });
    await IS.recount(c.id); IS.notify(u.id, A('فُتح لك كورس', 'A course was opened for you'), c.title, '#course/' + c.id); IS.audit('grant course', c.title + ' → ' + u.name); IS.closeSheet(); IS.toast(A('مُنح', 'Granted')); };
  IS.ACT.exportusers = async function () { var us = await DB.q('profiles'); csv('ishrah-users', [['name', 'phone', 'email', 'university', 'year', 'joined', 'status']].concat(us.map(function (u) { return [u.name, u.phone, u.email, u.university, u.year, String(u.created_at).slice(0, 10), u.status]; }))); IS.audit('export users'); };

  /* ========== STRUCTURE, ROLES AND PERMISSIONS (owner's design, 17 Nov 2026) ========== */
  var SECTIONS = [['students', 'users', 'إدارة المستخدمين', 'Users'], ['apps', 'cert', 'المحاضرون (الاعتماد)', 'Lecturers (approval)'], ['review', 'layers', 'الكورسات', 'Courses'], ['paths', 'route', 'المسارات', 'Paths'],
    ['library', 'open', 'المحتوى والمكتبة', 'Content & library'], ['requests', 'receipt', 'طلبات المكتبة', 'Library requests'], ['pay', 'wallet', 'المدفوعات والاشتراكات', 'Payments'], ['payout', 'money', 'مستحقات المحاضرين', 'Payouts'],
    ['events', 'cal', 'الفعاليات', 'Events'], ['community', 'group', 'المجتمع والبلاغات', 'Community'], ['notify', 'bell', 'الإعلانات', 'Announcements'], ['reports', 'chart', 'التقارير والإحصائيات', 'Reports'], ['settings', 'gear', 'إعدادات النظام', 'System settings'], ['team', 'shield', 'الأدوار والصلاحيات', 'Roles & permissions']];
  function roleOf(t) { return IS.ROLES.filter(function (r) { return r[0] === t; })[0]; }
  function hasPerm(role, p) { var a = IS.PERMS[role] || []; return a.indexOf('*') >= 0 || a.indexOf(p) >= 0; }
  IS.page('control-structure', async function () {
    var us = (await DB.q('profiles')).filter(function (u) { return (u.team || []).length; }), cnt = function (r) { return us.filter(function (u) { return (u.team || []).indexOf(r) >= 0; }).length; };
    function box(r, cls) { var x = roleOf(r); return '<div class="obox ' + (cls || '') + '"><span class="oi">' + ic(x[3]) + '</span><div><b>' + esc(A(x[1], x[2])) + '</b><p>' + esc(A(x[4], x[5])) + '</p><em>' + N(cnt(r)) + ' ' + esc(A('عضو', 'members')) + '</em></div></div>'; }
    return IS.banner(IS.T('الهيكل الإداري للمنصة', 'Administrative structure'), esc(A('التنظيم الإداري والهرمي لصلاحيات وإدارة منصة أكاديمية السودان للمراجعة', 'How Sudan Master Review Academy is organised and who controls what')), 'org') +
      '<div class="org">' + box('owner', 'top') + '<i class="oline"></i>' + box('gm', 'top') + '<i class="oline"></i><div class="ogrid">' + ['academic', 'finance', 'community', 'content', 'support', 'tech'].map(function (r) { return box(r); }).join('') + '</div><i class="oline"></i>' + box('staff', 'wide') + '</div>' +
      (IS.can('team') ? '<div class="row center"><a class="btn pri" href="#control-team">' + ic('shield') + esc(A('إدارة الأدوار والصلاحيات', 'Manage roles and permissions')) + '</a></div>' : '');
  }, P('dash'));
  IS.page('control-team', async function () {
    var us = await DB.q('profiles'), team = us.filter(function (u) { return (u.team || []).length; }), log = await DB.q('audit', { order: ['created_at', false], limit: 6 }), cnt = function (r) { return team.filter(function (u) { return (u.team || []).indexOf(r) >= 0; }).length; };
    var h = IS.banner(IS.T('إدارة الأدوار والصلاحيات', 'Roles and permissions'), esc(A('تحديد أدوار المسؤولين وصلاحيات كل دور بدقة لضمان الأمان والفصل بين المهام', 'Each manager’s role and permissions, for safety and separation of duties')), 'shield',
      '<div class="bfeat"><span>' + ic('user') + esc(A('دخول مخصص لكل دور', 'A dashboard per role')) + '</span><span>' + ic('shield') + esc(A('صلاحيات محددة وآمنة', 'Precise, safe permissions')) + '</span><span>' + ic('file') + esc(A('تسجيل كامل لجميع الإجراءات', 'Every action recorded')) + '</span></div>');
    h += '<header class="sh"><h2>' + ic('users') + IS.T('الأدوار الإدارية في المنصة', 'Administrative roles') + '</h2><div class="row"><a class="btn ghost sm" href="#control-audit">' + ic('list') + esc(A('سجل العمليات', 'Activity log')) + '</a><a class="btn ghost sm" href="#control-structure">' + ic('org') + esc(A('الهيكل الإداري', 'Structure')) + '</a><button class="btn pri sm" data-act="addteam">' + ic('plus') + esc(A('إضافة عضو', 'Add member')) + '</button></div></header>';
    h += '<div class="rolecards">' + IS.ROLES.filter(function (r) { return r[0] !== 'owner'; }).map(function (r, i) { var perms = SECTIONS.filter(function (s) { return hasPerm(r[0], s[0]); }).slice(0, 4);
      return '<article class="rcard r' + i + '"><span class="chip ok">' + ic('check') + esc(A('مفعّل', 'Active')) + '</span><span class="ri">' + ic(r[3]) + '</span><h3>' + esc(A(r[1], r[2])) + '</h3><p class="rc">' + ic('user') + N(cnt(r[0])) + ' ' + esc(A('عضو', 'members')) + '</p>' +
        '<b class="rp">' + esc(A('أهم الصلاحيات:', 'Main permissions:')) + '</b><ul>' + (r[0] === 'staff' ? '<li>' + ic('check') + esc(A('أقسام يحددها المدير لكل موظف', 'Sections chosen for each member')) + '</li>' : perms.map(function (s) { return '<li>' + ic('check') + esc(A(s[2], s[3])) + '</li>'; }).join('')) + '</ul>' +
        '<button class="btn ' + (i === 0 ? 'pri' : 'ghost') + ' wide" data-act="rolemembers" data-r="' + r[0] + '">' + esc(A('أعضاء الدور', 'Role members')) + '</button></article>'; }).join('') + '</div>';
    h += '<div class="grid g2"><section class="box"><header class="sh"><h2>' + ic('clock') + IS.T('سجل العمليات', 'Activity log') + '</h2><a class="more" href="#control-audit">' + esc(A('عرض الكل', 'All')) + '</a></header>' + (log.length ? '<div class="mtable"><div class="mh"><span>' + esc(A('المستخدم', 'User')) + '</span><span>' + esc(A('العملية', 'Action')) + '</span><span>' + esc(A('التفاصيل', 'Details')) + '</span><span>' + esc(A('التاريخ', 'Date')) + '</span></div>' +
      log.map(function (x) { return '<div class="mr"><span><b>' + esc(x.name || '') + '</b></span><span>' + esc(x.action) + '</span><span class="mut">' + esc(x.target || '') + '</span><span class="mut" dir="ltr">' + esc(String(x.created_at).slice(0, 16).replace('T', ' ')) + '</span></div>'; }).join('') + '</div>' : '<p class="mut">' + esc(A('لا توجد عمليات بعد.', 'Nothing yet.')) + '</p>') + '</section>' +
      '<section class="box"><h2>' + ic('shield') + IS.T('مصفوفة الصلاحيات', 'Permission matrix') + '</h2><div class="matrix"><table><thead><tr><th>' + esc(A('الدور / الوحدة', 'Role / section')) + '</th>' + IS.ROLES.filter(function (r) { return r[0] !== 'owner' && r[0] !== 'staff'; }).map(function (r) { return '<th>' + esc(r[1]) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      SECTIONS.map(function (s) { return '<tr><th>' + ic(s[1]) + esc(A(s[2], s[3])) + '</th>' + IS.ROLES.filter(function (r) { return r[0] !== 'owner' && r[0] !== 'staff'; }).map(function (r) { var y = hasPerm(r[0], s[0]); return '<td class="' + (y ? 'y' : 'n') + '">' + ic(y ? 'checkc' : 'x') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' +
      '<p class="mut">' + ic('info') + esc(A('المالك يملك كل الصلاحيات. للموظفين تُحدَّد الأقسام لكل شخص.', 'The owner has every permission. Staff get the sections chosen for each person.')) + '</p></section></div>';
    h += '<section class="box"><h2>' + ic('users') + IS.T('أعضاء الفريق', 'Team members') + ' (' + N(team.length) + ')</h2><div class="table">' + team.map(function (u) { return '<div class="tr">' + IS.av(u, 'sm', u.id) + '<span class="grow"><b>' + esc(u.name) + '</b> ' + IS.seen(u.id, u.last_seen) + '<small class="mut" dir="auto">' + esc(u.phone || u.email || '') + '</small></span><span class="tags">' +
      (u.team || []).filter(function (t) { return t.indexOf('p:') !== 0; }).map(function (t) { var r = roleOf(t); return '<span>' + esc(r ? A(r[1], r[2]) : t) + '</span>'; }).join('') + (u.team || []).filter(function (t) { return t.indexOf('p:') === 0; }).map(function (t) { var s = SECTIONS.filter(function (x) { return 'p:' + x[0] === t; })[0]; return '<span class="lt2">' + esc(s ? A(s[2], s[3]) : t) + '</span>'; }).join('') + '</span>' +
      '<button class="btn sm ghost" data-act="roles" data-id="' + u.id + '">' + ic('pen') + esc(A('الصلاحيات', 'Permissions')) + '</button></div>'; }).join('') + '</div></section>';
    return h;
  }, P('team'));
  IS.ACT.rolemembers = async function (b) { var r = roleOf(b.getAttribute('data-r')), us = (await DB.q('profiles')).filter(function (u) { return (u.team || []).indexOf(r[0]) >= 0; });
    IS.sheet(esc(r[1]), '<p class="mut">' + esc(A(r[4], r[5])) + '</p>' + (us.length ? '<div class="list">' + us.map(function (u) { return '<button class="li" data-act="roles" data-id="' + u.id + '">' + IS.av(u, 'sm') + '<span><b>' + esc(u.name) + '</b><small>' + esc(u.phone || u.email || '') + '</small></span></button>'; }).join('') + '</div>' : '<p class="mut">' + esc(A('لا يوجد أعضاء بعد.', 'No members yet.')) + '</p>') +
      '<button class="btn pri wide" data-act="addteam">' + ic('plus') + esc(A('إضافة عضو', 'Add member')) + '</button>', { nofocus: 1 }); };
  IS.ACT.addteam = async function () { var k = await IS.ask(A('إضافة عضو للفريق', 'Add a team member'), A('رقم هاتف العضو أو بريده (يجب أن يكون له حساب)', 'Member’s phone or email (they must have an account)')); if (!k) return;
    var d = DB.digits(k), us = await DB.q('profiles'), u = us.filter(function (x) { return (d.length > 6 && DB.digits(x.phone) === d) || (x.email && x.email.toLowerCase() === k.toLowerCase()); })[0];
    if (!u) return IS.toast(A('لا يوجد حساب بهذا الرقم/البريد. اطلب منه التسجيل أولًا.', 'No account with that phone/email. Ask them to register first.'), true); IS.ACT.roles({ getAttribute: function () { return u.id; } }); };
  IS.ACT.roles = async function (b) {
    var u = await DB.one('profiles', b.getAttribute('data-id')), owner = (IS.ME.team || []).indexOf('owner') >= 0, t = u.team || [];
    IS.sheet(esc(A('صلاحيات ', 'Permissions of ')) + esc(u.name), '<form class="form" data-form="roles"><input type="hidden" name="id" value="' + u.id + '"><h3 class="sub">' + esc(A('الدور', 'Role')) + '</h3>' + IS.ROLES.map(function (r) { var lock = (r[0] === 'owner' || r[0] === 'gm') && !owner;
      return '<label class="chk"><input type="checkbox" name="r" value="' + r[0] + '"' + (t.indexOf(r[0]) >= 0 ? ' checked' : '') + (lock || (u.id === uid() && r[0] === 'owner') ? ' disabled' : '') + '><span><b>' + esc(A(r[1], r[2])) + '</b><small>' + esc(A(r[4], r[5])) + '</small></span></label>'; }).join('') +
      '<h3 class="sub">' + esc(A('أقسام إضافية لهذا الشخص (للموظفين والمشرفين)', 'Extra sections for this person (staff and supervisors)')) + '</h3><div class="g2f">' + SECTIONS.filter(function (s) { return s[0] !== 'team' || owner; }).map(function (s) { return '<label class="chk"><input type="checkbox" name="r" value="p:' + s[0] + '"' + (t.indexOf('p:' + s[0]) >= 0 ? ' checked' : '') + '><span>' + esc(A(s[2], s[3])) + '</span></label>'; }).join('') + '</div>' +
      '<div class="row sp">' + (t.length && u.id !== uid() ? '<button type="button" class="btn ghost bad" data-act="rmteam" data-id="' + u.id + '">' + esc(A('إزالة من الفريق', 'Remove from team')) + '</button>' : '<span></span>') + '<button class="btn pri">' + esc(A('حفظ', 'Save')) + '</button></div></form>');
  };
  IS.SUB.roles = async function (d, f) { var u = await DB.one('profiles', d.id), keep = (u.team || []).filter(function (x) { return (x === 'owner' || x === 'gm') && (IS.ME.team || []).indexOf('owner') < 0; });
    var t = IS.$$('input[name=r]:checked', f).map(function (i) { return i.value; }).concat(keep).filter(function (v, i, a) { return a.indexOf(v) === i; }); if (d.id === uid() && (IS.ME.team || []).indexOf('owner') >= 0 && t.indexOf('owner') < 0) t.push('owner');
    await DB.upd('profiles', d.id, { team: t }); IS.audit(A('تحديث صلاحيات', 'update permissions') + ' (' + t.join(', ') + ')', u.name); if (d.id === uid()) await IS.loadMe(); IS.closeSheet(); IS.refresh(); };
  IS.ACT.rmteam = async function (b) { var u = await DB.one('profiles', b.getAttribute('data-id')); if ((u.team || []).indexOf('owner') >= 0 && (IS.ME.team || []).indexOf('owner') < 0) return; if (!(await IS.confirm(A('إزالة ', 'Remove ') + u.name + A(' من فريق المنصة؟', ' from the team?')))) return;
    await DB.upd('profiles', u.id, { team: [] }); IS.audit('remove from team', u.name); IS.closeSheet(); IS.refresh(); };

  /* ========== LIBRARY FILES ========== */
  IS.page('control-library', async function (tab) {
    var origins = { original: A('عمل أصلي حسب إقرار الرافع', 'Uploader declares original work'),
      free_source: A('مجاني بترخيص يسمح بالمشاركة', 'Free with redistribution licence'),
      permission: A('مجاني بإذن من صاحب العمل', 'Free with creator permission') };
    tab = tab || 'pending'; var fs = await DB.q('files', { order: ['created_at', false] }), list = fs.filter(function (f) { return tab === 'all' || f.status === tab; });
    var revisions = IS.can('library', 'approve') ? await DB.q('library_file_revisions', { eq: { status: 'pending' }, order: ['created_at', false] }) : [];
    var edits = new Set(revisions.filter(function (revision) { return !revision.for_series; }).map(function (revision) { return revision.file_id; }));
    var editQueue = (tab === 'pending' || tab === 'all') && revisions.length ? '<section class="box"><h2>' + ic('pen') +
      IS.T('تعديلات بانتظار المراجعة', 'Edits awaiting review') + '</h2><div class="table">' + revisions.map(function (revision) {
        return '<div class="tr"><b class="grow" dir="auto">' + esc(revision.changes.title) + '</b>' +
          (revision.for_series ? '<span class="chip">' + esc(A('سلسلة', 'Series')) + '</span>' : '') +
          '<button class="btn sm ghost" data-act="review-library-edit" data-id="' + esc(revision.id) + '">' +
          ic('eye') + esc(A('مراجعة التعديل', 'Review edit')) + '</button></div>';
      }).join('') + '</div></section>' : '';
    return IS.banner(IS.T('الكتب والملفات', 'Books and files'), esc(A('ارفع ملفات المكتبة، وراجع ما يشاركه الطلبة والمحاضرون قبل نشره.', 'Upload library files and review what students and lecturers share before publishing.')), 'open', '<button class="btn gold" data-act="addfile">' + ic('upload') + esc(A('رفع ملف', 'Upload file')) + '</button>') +
      tabsBar('control-library', tab, [['pending', A('بانتظار المراجعة', 'Waiting'), fs.filter(function (f) { return f.status === 'pending'; }).length], ['published', A('منشورة', 'Published')], ['rejected', A('مرفوضة', 'Rejected')], ['all', A('الكل', 'All')]]) +
      editQueue + (list.length ? '<div class="table">' + list.map(function (f) { var k = IS.FKINDS.filter(function (x) { return x[0] === f.kind; })[0] || IS.libraryKind('other');
        return '<div class="tr">' + ic(k[1]) + '<span class="grow"><a href="#file/' + f.id + '"><b>' + esc(f.title) + '</b></a><small class="mut">' + esc(A(k[2], k[3])) + (f.owner_name ? ' · ' + esc(A('من ', 'by ')) + esc(f.owner_name) : '') + ' · ' + (+f.price > 0 ? IS.money(f.price) : esc(A('مجاني', 'Free'))) + ((f.tags || []).length ? ' · #' + f.tags.map(esc).join(' #') : '') + (f.pages ? ' · ' + N(f.pages) + ' ' + esc(A('صفحة', 'pages')) : '') + '</small>' +
          (IS.librarySubjectNames(f).length ? '<small class="mut" lang="en" dir="ltr">' + esc(IS.librarySubjectNames(f).join(' · ')) + '</small>' : '') +
          (f.rights_origin ? '<small class="mut" dir="auto">' + esc(origins[f.rights_origin] || '') +
            (f.rights_source ? ' · ' + esc(f.rights_source) : '') + '</small>' : '') + '</span>' + IS.status(f.status) +
          (f.status !== 'published' && !edits.has(f.id) ? '<button class="btn sm pri" data-act="fpub" data-id="' + f.id + '">' + esc(A('نشر', 'Publish')) + '</button>' : '') + (f.status !== 'rejected' ? '<button class="btn sm ghost bad" data-act="frej" data-id="' + f.id + '">' + esc(f.status === 'published' ? A('إزالة', 'Remove') : A('رفض', 'Reject')) + '</button>' : '') +
          (IS.can('library', 'approve') && f.owner_id ? fileReturnButton(f.id) : '') + '</div>'; }).join('') + '</div>' : IS.empty('open', A('لا توجد ملفات هنا', 'No files here')));
  }, P('library'));
  IS.ACT.addfile = function () { IS.sheet(esc(A('رفع ملف للمكتبة', 'Upload a library file')), '<form class="form" data-form="cfile">' + IS.fileFields({}) + '<button class="btn pri wide">' + ic('upload') + esc(A('رفع ونشر', 'Upload and publish')) + '</button></form>'); };
  IS.SUB.cfile = async function (d, f) { var row = await IS.saveFile(d, f, { owner_id: uid(), owner_name: A('مكتبة أكاديمية السودان للمراجعة', 'Sudan Master Review Academy library'), status: 'published' }); await DB.ins('files', row); IS.audit('add file', d.title); IS.closeSheet(); IS.refresh(); };
  IS.ACT.fpub = async function (b) {
    var file = await DB.one('files', b.dataset.id);
    if (!file) return;
    if (+file.price > 0 && !(await IS.confirm(A('هل تحققت من أن هذا المحتوى عمل أصلي للرافع وغير متاح مجانًا؟',
      'Have you verified this is the uploader’s original work and is not already freely available?')))) return;
    var change = { status: 'published' };
    if (!DB.live) change.published_at = new Date().toISOString();
    var f = await DB.upd('files', b.getAttribute('data-id'), change); if (f.owner_id && f.owner_id !== uid()) IS.notify(f.owner_id, A('نُشر الملف الذي شاركته', 'The file you shared is published'), f.title, '#file/' + f.id); IS.audit('publish file', f.title); IS.refresh(); };
  IS.ACT.frej = async function (b) { var f = await DB.upd('files', b.getAttribute('data-id'), { status: 'rejected' }); IS.audit('reject file', f.title); IS.refresh(); };
  function fileReturnButton(id) {
    return '<button type="button" class="btn ghost sm" data-act="return-library-file" data-id="' + esc(id) + '">' +
      ic('chat') + esc(A('اطلب تعديلًا من المالك', 'Ask uploader to edit')) + '</button>';
  }
  IS.libraryReturnButton = fileReturnButton;
  IS.ACT['return-library-file'] = async function (button) {
    if (!IS.can('library', 'approve')) return;
    var file = await DB.one('files', button.dataset.id);
    if (!file || !file.owner_id) return;
    var note = await IS.ask(A('اطلب تعديلًا من المالك', 'Ask uploader to edit'),
      A('ما الذي يحتاج إلى تعديل؟', 'What needs to change?'), '', { area: 1 });
    if (!note || !note.trim()) return;
    note = note.trim().slice(0, 1000);
    if (DB.live) {
      var result = await DB.sb.rpc('ish_return_library_file', { target: file.id, note: note });
      if (result.error) throw result.error;
    } else {
      IS.notify(file.owner_id, A('طلب تعديل ملفك', 'Please edit your upload'), note, '#file/' + file.id);
      IS.audit('request library edit', file.id);
    }
    IS.toast(A('أُرسل الطلب إلى المالك', 'Edit request sent to the uploader'));
  };
  IS.ACT['review-library-edit'] = async function (button) {
    if (!IS.can('library', 'approve')) return;
    var revision = await DB.one('library_file_revisions', button.dataset.id);
    if (!revision || revision.status !== 'pending') return;
    var file = await DB.one('files', revision.file_id), changes = revision.changes;
    if (!file) return;
    var attachments = await Promise.all([[changes.path, A('الملف المعدّل', 'Proposed file')],
      [changes.reading_path, A('نسخة القراءة', 'Reading copy')], [changes.cover, A('الغلاف المعدّل', 'Proposed cover')]]
      .filter(function (entry) { return !!entry[0]; }).map(async function (entry) {
        var url = await DB.fileUrl('library', entry[0]);
        return url ? '<a class="btn ghost sm" href="' + IS.U(url) + '" target="_blank" rel="noopener noreferrer">' +
          esc(entry[1]) + '</a>' : '<span class="mut">' + esc(entry[1] + ' · ' + A('غير متاح', 'Unavailable')) + '</span>';
      }));
    var seriesInfo = '';
    if (revision.for_series && changes.full) {   // whole-series edit: cover, type, price, tags and the parts in their new order
      var parts = (await DB.q('files', { eq: { series_id: file.series_id, owner_id: file.owner_id } })).filter(function (p) { return p.status !== 'removed'; });
      var byId = {}; parts.forEach(function (p) { byId[p.id] = p; });
      var k = IS.libraryKind(changes.kind);
      seriesInfo = (changes.series_cover ? '<img class="rev-cover" src="' + IS.U(changes.series_cover) + '" alt="">' : '') +
        '<p>' + IS.priceTag({ price: changes.price }) + ' · ' + esc(A(k[2], k[3])) + '</p>' +
        '<ol class="rev-parts">' + (changes.order || []).map(function (id) { var p = byId[id] || {}, t = (changes.titles || {})[id];
          return '<li dir="auto">' + esc(t || p.title || '') + (t ? ' <small class="mut">(' + esc(A('كان: ', 'was: ') + (p.title || '')) + ')</small>' : '') + '</li>'; }).join('') + '</ol>' +
        ((changes.remove || []).length ? '<p class="note bad">' + esc(A('أجزاء ستُزال: ', 'Parts to remove: ')) + (changes.remove || []).map(function (id) { return esc((byId[id] || {}).title || id); }).join(' · ') + '</p>' : '');
    }
    IS.sheet(esc(A('مراجعة تعديل الملف', 'Review file edit')), '<h2 dir="auto">' + esc(changes.title) + '</h2>' + seriesInfo + '<p dir="auto">' +
      esc(changes.author) + '</p><p class="pre" dir="auto">' + esc(changes.about) + '</p><p dir="auto">' +
      esc((changes.tags || []).join(' · ')) + '</p>' + (changes.subjects ? '<p><strong>' + esc(A('المواد المقترحة', 'Proposed subjects')) +
        '</strong> · <bdi lang="en">' + esc(IS.librarySubjectNames(changes).join(' · ') || '—') + '</bdi></p>' : '') +
      '<p class="mut" dir="auto">' + esc(changes.rights_origin === 'original' ?
        A('عمل أصلي حسب إقرار الرافع', 'Uploader declares original work') : changes.rights_source || '') +
      '</p><div class="row">' + attachments.join('') + '</div><div class="row">' +
      '<button class="btn pri" data-act="decide-library-edit" data-id="' + esc(revision.id) + '" data-publish="1">' +
      esc(A('اعتمد التعديل', 'Approve edit')) + '</button><button class="btn ghost bad" data-act="decide-library-edit" data-id="' +
      esc(revision.id) + '" data-publish="0">' + esc(A('أعد التعديل إلى المالك', 'Return edit to uploader')) + '</button></div>');
  };
  IS.ACT['decide-library-edit'] = async function (button) {
    if (!IS.can('library', 'approve')) return;
    var revision = await DB.one('library_file_revisions', button.dataset.id);
    if (!revision || revision.status !== 'pending') return;
    var file = await DB.one('files', revision.file_id), publish = button.dataset.publish === '1', note = '';
    if (!file) return;
    if (publish && !revision.for_series && +file.price > 0 && !(await IS.confirm(A('هل تحققت من أن التعديل يحافظ على قواعد النشر المدفوع؟',
      'Have you verified that the edit follows the paid-content rules?')))) return;
    if (!publish) {
      note = await IS.ask(A('أعد التعديل إلى المالك', 'Return edit to uploader'), A('اذكر المطلوب تعديله', 'Explain what needs to change'), '', { area: 1 });
      if (!note || !note.trim()) return;
      note = note.trim().slice(0, 1000);
    }
    if (DB.live) {
      var result = await DB.sb.rpc('ish_review_library_revision', { target: revision.id, publish: publish, note: note });
      if (result.error) throw result.error;
    } else {
      if (publish && revision.for_series) {
        var proposed = revision.changes;
        var parts = await DB.q('files', { eq: { series_id: file.series_id, owner_id: file.owner_id, spec: file.spec, cat: file.cat } });
        await Promise.all(parts.map(function (part) {
          var change = { series_title: proposed.series_title, author: proposed.author, about: proposed.about, subjects: proposed.subjects, subject: proposed.subjects[0] || null };
          if (proposed.full) {
            Object.assign(change, { kind: proposed.kind, tags: proposed.tags, price: proposed.price, rights_origin: proposed.rights_origin, rights_source: proposed.rights_source,
              series_cover: proposed.series_cover || null });
            var at = (proposed.order || []).indexOf(part.id); if (at >= 0) change.series_no = at + 1;
            if (proposed.titles && proposed.titles[part.id]) change.title = proposed.titles[part.id];
            if ((proposed.remove || []).indexOf(part.id) >= 0) change.status = 'removed';
          }
          return DB.upd('files', part.id, change);
        }));
      } else if (publish) {
        var changes = revision.changes;
        var subject = changes.subjects ? { subject: changes.subjects[0] || null } : {};
        await DB.upd('files', file.id, Object.assign({}, changes, subject, {
          status: 'published', published_at: file.published_at || new Date().toISOString()
        }));
      }
      await DB.upd('library_file_revisions', revision.id, { status: publish ? 'approved' : 'rejected', review_note: note });
      IS.notify(file.owner_id, A('مراجعة تعديل ملفك', 'Your file edit was reviewed'), note, revision.for_series ? '#series/' + file.series_id : '#file/' + file.id);
    }
    IS.closeSheet();
    IS.toast(publish ? A('تم اعتماد التعديل', 'Edit approved') : A('أُعيد التعديل إلى المالك', 'Edit returned to the uploader'));
    IS.refresh();
  };


  /* ========== LIBRARY REQUESTS ========== */
  IS.page('control-requests', async function (tab) {
    tab = tab || 'open'; var rq = await DB.q('requests', { order: ['created_at', false] }), list = rq.filter(function (r) { return tab === 'open' ? r.status === 'pending' || r.status === 'progress' : r.status === tab; });
    var top = {}; rq.forEach(function (r) { var k = IS.norm(r.title); top[k] = top[k] || { t: r.title, n: 0 }; top[k].n++; });
    return IS.banner(IS.T('طلبات المكتبة', 'Library requests'), esc(A('ما يطلبه الطلبة من كتب وملفات وشروحات.', 'What students ask for: books, files and explanations.')), 'receipt') +
      tabsBar('control-requests', tab, [['open', A('مفتوحة', 'Open'), rq.filter(function (r) { return r.status === 'pending' || r.status === 'progress'; }).length], ['done', A('مكتملة', 'Done')], ['rejected', A('مرفوضة', 'Rejected')]]) +
      (Object.keys(top).length ? '<section class="box"><h2>' + ic('flame') + IS.T('أكثر الطلبات طلبًا', 'Most requested') + '</h2><div class="tags">' + Object.keys(top).sort(function (a, b) { return top[b].n - top[a].n; }).slice(0, 10).map(function (k) { return '<span>' + esc(top[k].t) + ' (' + top[k].n + ')</span>'; }).join('') + '</div></section>' : '') +
      (list.length ? '<div class="table">' + list.map(function (r) { var k = IS.RKINDS.filter(function (x) { return x[0] === r.kind; })[0] || IS.RKINDS[4];
        return '<div class="tr">' + ic(k[1]) + '<span class="grow"><b>' + esc(r.title) + '</b><small class="mut">' + esc(A(k[2], k[3])) + ' · ' + esc(r.name || '') + ' · ' + esc(IS.date(r.created_at)) + '</small>' + (r.details ? '<small>' + esc(r.details) + '</small>' : '') + '</span>' + IS.rstatus(r.status) + '<button class="btn sm ghost" data-act="rq" data-id="' + r.id + '">' + ic('pen') + esc(A('معالجة', 'Handle')) + '</button></div>'; }).join('') + '</div>' : IS.empty('receipt', A('لا توجد طلبات هنا', 'Nothing here')));
  }, P('requests'));
  IS.ACT.rq = async function (b) { var r = await DB.one('requests', b.getAttribute('data-id')), fs = await DB.q('files', { eq: { status: 'published' } });
    IS.sheet(esc(r.title), '<form class="form" data-form="rq"><input type="hidden" name="id" value="' + r.id + '"><p class="pre">' + esc(r.details || '') + '</p><label class="fl"><span>' + esc(A('الحالة', 'Status')) + '</span><select name="status">' + [['pending', A('جديد', 'New')], ['progress', A('قيد التنفيذ', 'In progress')], ['done', A('مكتمل', 'Done')], ['rejected', A('مرفوض', 'Rejected')]].map(function (o) { return '<option value="' + o[0] + '"' + (r.status === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fl"><span>' + esc(A('ربط بملف في المكتبة (اختياري)', 'Link to a library file (optional)')) + '</span><select name="file"><option value="">—</option>' + fs.map(function (f) { return '<option value="' + f.id + '"' + (r.file_id === f.id ? ' selected' : '') + '>' + esc(f.title) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fl"><span>' + esc(A('رد للطالب', 'Reply to the student')) + '</span><textarea name="reply" rows="3">' + esc(r.reply || '') + '</textarea></label><button class="btn pri wide">' + esc(A('حفظ وإشعار الطالب', 'Save and notify')) + '</button></form>'); };
  IS.SUB.rq = async function (d) { var r = await DB.upd('requests', d.id, { status: d.status, reply: d.reply, file_id: d.file || '' }); IS.notify(r.user_id, A('تحديث على طلبك', 'Update on your request'), r.title + (d.reply ? ': ' + d.reply : ''), d.file ? '#file/' + d.file : '#library/requests'); IS.audit('request ' + d.status, r.title); IS.closeSheet(); IS.refresh(); };

  IS.page('control-questions', async function () {
    var rows = await DB.q('posts', { eq: { status: 'pending' }, order: ['created_at'], limit: 100 });
    var courses = Array.from(new Set(rows.filter(function (question) { return question.room === 'qa'; }).map(function (question) { return question.course_id; })));
    var courseRows = courses.length ? await DB.q('courses', { in: { id: courses } }) : [];
    var titles = new Map(courseRows.map(function (course) { return [course.id, course.title]; }));
    return IS.banner(IS.T('مراجعة المنشورات والأسئلة', 'Posts and questions review'), esc(A('راجع الأسئلة والمنشورات المعدّلة قبل نشرها.', 'Review questions and edited posts before publication.')), 'eye') +
      '<div class="row"><a class="btn ghost sm" href="#control-course-requests">' + esc(A('مراجعة طلبات الكورسات', 'Review course requests')) + '</a></div>' +
      (rows.length ? rows.map(function (question) {
        var section = IS.cat(question.room), speciality = IS.spec(question.spec);
        var context = question.room === 'qa' ? [A('سؤال في درس', 'Lesson question'), titles.get(question.course_id)] :
          [speciality && A(speciality.ar, speciality.en), section && A(section.ar, section.en)];
        var edited = question.post_kind !== 'question' && question.room !== 'qa';
        return '<article class="box"><div class="row sp"><h2 dir="auto">' + esc(question.title || (edited ? A('منشور', 'Post') : A('سؤال في درس', 'Lesson question'))) +
          (edited ? ' ' + IS.chip(esc(A('منشور معدّل', 'Edited post')), 'lt') : '') +
          '</h2>' + IS.status('pending') + '</div><p class="mut" dir="auto">' + esc([question.name].concat(context).filter(Boolean).join(' · ')) +
          '</p><p class="pre" dir="auto">' + esc(question.body) + '</p>' + (IS.can('review', 'approve') ?
            '<div class="row end"><button class="btn ghost bad sm" data-act="review-question" data-id="' + esc(question.id) + '">' +
            esc(A('ارفض', 'Decline')) + '</button><button class="btn pri sm" data-act="review-question" data-publish="1" data-id="' + esc(question.id) + '">' +
            esc(A('وافق وانشر', 'Approve and publish')) + '</button></div>' : '') + '</article>';
      }).join('') : IS.empty('help', A('لا يوجد شيء بانتظار المراجعة', 'Nothing awaiting review')));
  }, P('review'));
  IS.ACT['review-question'] = async function (button) {
    if (!IS.can('review', 'approve')) return;
    var publish = button.dataset.publish === '1', note = '';
    if (!publish) {
      note = await IS.ask(A('سبب الرفض', 'Reason for declining'), A('يظهر لصاحب السؤال', 'Shown to the author'), '', { area: 1, ok: A('ارفض السؤال', 'Decline question') });
      if (!note || note.length > 2000) return;
    }
    if (DB.live) {
      var result = await DB.sb.rpc('ish_review_question', { question: button.dataset.id, publish: publish, note: note });
      if (result.error) throw result.error;
    } else {
      var p = await DB.one('posts', button.dataset.id);
      if (!p || p.status !== 'pending') return IS.refresh();
      await DB.upd('posts', p.id, { status: publish ? 'open' : 'rejected', review_note: note });
      await IS.notify(p.user_id, publish ? A('نُشر سؤالك', 'Your question was published') : A('لم يُنشر سؤالك', 'Your question was declined'), p.title, '#post/' + p.id);
      if (publish && p.room === 'qa' && p.user_id !== p.lecturer_id) await IS.notify(p.lecturer_id,
        A('سؤال جديد في كورسك', 'New question in your course'), '', '#studio-qa');
      IS.audit(publish ? 'approve question' : 'reject question', p.id);
    }
    IS.refresh();
  };

  /* ========== COMMUNITY MODERATION ========== */
  var reportSources = { post: 'posts', reply: 'replies', review: 'reviews', request: 'course_requests', request_comment: 'course_request_comments',
    news: 'news', announcement: 'notices', course: 'courses', event: 'events', file: 'files', file_comment: 'library_comments' };
  IS.page('control-community', async function () {
    var reports = await DB.q('reports', { eq: { status: 'open' }, order: ['created_at', false] });
    var h = IS.banner(IS.T('البلاغات والنقاشات', 'Reports and discussions'), esc(A('راجع البلاغات واتخذ الإجراء المناسب.', 'Review reports and take action.')), 'flag');
    if (!reports.length) return h + IS.empty('shield', A('لا توجد بلاغات مفتوحة', 'No open reports'));
    var labels = { post: A('مشاركة', 'Post'), reply: A('تعليق', 'Comment'), review: A('تقييم', 'Review'),
      request: A('طلب كورس', 'Course request'), request_comment: A('تعليق على طلب كورس', 'Course request comment'),
      news: A('خبر', 'News'), announcement: A('إعلان', 'Announcement'), course: A('كورس', 'Course'),
      event: A('فعالية', 'Event'), file: A('ملف', 'Library file'), file_comment: A('تعليق على ملف', 'Library comment') };
    var edit = IS.can('community', 'edit');
    var cards = await Promise.all(reports.map(async function (r) {
      var source = Object.prototype.hasOwnProperty.call(reportSources, r.kind) && reportSources[r.kind];
      var t = source && await DB.one(source, r.target);
      var routes = t ? { post: 'post/' + t.id, review: 'course/' + t.course_id,
        request: 'course-request/' + t.id, request_comment: 'course-request/' + t.request_id + '/comments',
        course: 'course/' + t.id, event: 'event/' + t.id, news: 'news/' + t.id, announcement: 'news/ann/' + t.id,
        file: 'file/' + t.id, file_comment: 'file/' + t.file_id + '/comments' } : {};
      if (r.kind === 'reply' && t) {
        var parents = { post_id: 'post/', announcement_id: 'news/ann/', course_id: 'course/', event_id: 'event/', news_id: 'news/' };
        var parent = Object.keys(parents).find(function (field) { return t[field]; });
        if (parent) routes.reply = parents[parent] + t[parent] + '/comments';
      }
      var removable = t && !(r.kind === 'request' && t.reserved_count) && !['course', 'event', 'file'].includes(r.kind);
      return '<article class="box"><header class="sh"><h2>' + ic('flag') + esc(labels[r.kind] || r.kind) +
        '</h2><small class="mut">' + esc(IS.ago(r.created_at)) + '</small></header><p><b>' + esc(A('سبب البلاغ', 'Report reason')) +
        '</b> ' + esc(r.reason) + '</p><blockquote class="pre">' + esc(t ? [t.title, t.body || t.details].filter(Boolean).join('\n') :
          A('المحتوى غير متاح', 'Content unavailable')) + '</blockquote><div class="row">' +
        (routes[r.kind] ? '<a class="btn sm ghost" href="#' + esc(routes[r.kind]) + '">' + esc(A('فتح', 'Open')) + '</a>' : '') +
        (edit ? '<button class="btn sm ghost" data-act="repok" data-id="' + esc(r.id) + '">' + esc(A('إغلاق البلاغ', 'Close report')) + '</button>' : '') +
        (edit && removable ? '<button class="btn sm bad ghost" data-act="repdel" data-id="' + esc(r.id) +
          '">' + ic('trash') + esc(A('حذف المحتوى', 'Remove content')) + '</button>' : '') + '</div></article>';
    }));
    return h + cards.join('');
  }, P('community'));
  async function moderateReport(button, remove) {
    if (!IS.can('community', 'edit')) return;
    var entry = await DB.one('reports', button.dataset.id);
    if (!entry || entry.status !== 'open') return;
    if (remove && !(await IS.confirm(A('حذف المحتوى المُبلّغ عنه؟', 'Remove the reported content?')))) return;
    if (DB.live && !(remove && entry.kind === 'review')) {
      var result = await DB.sb.rpc('ish_moderate_feed_report', { report_id: entry.id, remove_content: remove });
      if (result.error) throw result.error;
    } else {
      if (remove && entry.kind === 'review') {
        var review = await DB.one('reviews', entry.target);
        if (review) { await DB.del('reviews', review.id); await IS.recount(review.course_id); }
      } else if (remove) {
        var source = Object.prototype.hasOwnProperty.call(reportSources, entry.kind) && reportSources[entry.kind];
        if (!source) return;
        var target = await DB.one(source, entry.target);
        if (target) {
          if (entry.kind === 'request' && target.reserved_count) throw new Error('request_has_payments');
          if (['announcement', 'request_comment', 'file_comment'].includes(entry.kind)) await DB.del(source, target.id);
          else await DB.upd(source, target.id, { status: entry.kind === 'request' ? 'deleted' : 'removed' });
        }
        IS.audit('remove reported ' + entry.kind, entry.target);
      }
      await DB.upd('reports', entry.id, { status: 'resolved', handled_by: uid() });
    }
    IS.refresh();
  }
  IS.ACT.repok = function (button) { return moderateReport(button, false); };
  IS.ACT.repdel = function (button) { return moderateReport(button, true); };

  /* ========== EVENTS ========== */
  IS.page('control-events', async function () {
    var ev = await DB.q('events', { order: ['starts', false] }), L = await IS.lecMap(), regs = await DB.q('event_regs');
    return IS.banner(IS.T('إدارة الفعاليات', 'Manage events'), '', 'cal') + (ev.length ? '<div class="table">' + ev.map(function (e) { return '<div class="tr"><span class="grow"><a href="#event/' + e.id + '"><b>' + esc(e.title) + '</b></a><small class="mut">' + esc((L[e.lecturer_id] || {}).name || '') + ' · ' + esc(IS.date(e.starts, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) + ' · ' + N(regs.filter(function (r) { return r.event_id === e.id; }).length) + ' ' + esc(A('مسجّل', 'registered')) + '</small></span>' + IS.status(e.status) +
      '<button class="btn sm ghost' + (e.status === 'published' ? ' bad' : '') + '" data-act="evstat" data-id="' + e.id + '" data-s="' + (e.status === 'published' ? 'hidden' : 'published') + '">' + esc(e.status === 'published' ? A('إخفاء', 'Hide') : A('نشر', 'Publish')) + '</button></div>'; }).join('') + '</div>' : IS.empty('cal', A('لا توجد فعاليات', 'No events')));
  }, P('events'));
  IS.ACT.evstat = async function (b) { var e = await DB.upd('events', b.getAttribute('data-id'), { status: b.getAttribute('data-s') }); IS.audit(e.status + ' event', e.title); IS.refresh(); };

  /* ========== ANNOUNCEMENTS ========== */
  function audienceField() {
    return '<label class="fl"><span>' + esc(A('الجمهور', 'Audience')) + '</span><select name="scope"><option value="">' +
      esc(A('كل المنصة', 'Whole platform')) + '</option>' + IS.SPECS.map(function (spec) {
        return '<optgroup label="' + esc(spec.en) + '">' + IS.CATS.map(function (cat) {
          return '<option value="' + esc(spec.id + '/' + cat.id) + '">' + esc(A(cat.ar, cat.en)) + '</option>';
        }).join('') + '</optgroup>';
      }).join('') + '</select></label>';
  }
  function audience(value) {
    var parts = (value || '').split('/');
    return IS.spec(parts[0]) && IS.cat(parts[1]) ? { spec: parts[0], cat: parts[1] } : { spec: null, cat: null };
  }
  IS.page('control-notify', async function () {
    var n = await DB.q('notices', { eq: { user_id: null }, order: ['created_at', false], limit: 50 });
    return IS.banner(IS.T('الإعلانات والإشعارات', 'Announcements'), esc(A('انشر إعلانًا عامًا أو خصصه لمساحة دراسية.', 'Publish to the whole platform or a study section.')), 'bell') +
      '<form class="box form" data-form="broadcast"><label class="fl"><span>' + esc(A('العنوان', 'Title')) + '</span><input name="title" required maxlength="120"></label><label class="fl"><span>' + esc(A('النص', 'Text')) + '</span><textarea name="body" rows="2" maxlength="600"></textarea></label><label class="fl"><span>' + esc(A('رابط داخل المنصة (اختياري)', 'Link inside the platform (optional)')) + '</span><input name="link" dir="ltr" placeholder="#courses"></label>' + audienceField() + '<button class="btn pri">' +
      ic('send') + esc(A('نشر الإعلان', 'Publish announcement')) + '</button></form>' +
      (n.length ? '<div class="list">' + n.map(function (x) { return '<div class="li">' + ic('sparkle') + '<span><b>' + esc(x.title) + '</b><small>' + esc(x.body) + '</small></span><em>' + esc(IS.ago(x.created_at)) + '</em><button class="ib sm" data-act="delnote" data-id="' + x.id + '" aria-label="delete">' + ic('trash') + '</button></div>'; }).join('') + '</div>' : '');
  }, P('notify'));
  IS.SUB.broadcast = async function (d) {
    if (d.link && d.link[0] !== '#') return IS.toast(A('أدخل رابطًا داخل المنصة يبدأ بـ #.', 'Enter a link inside the platform that starts with #.'), true);
    await DB.ins('notices', Object.assign({ user_id: null, title: d.title, body: d.body, link: d.link }, audience(d.scope)));
    IS.audit('announcement', d.title); IS.toast(A('نُشر الإعلان', 'Announcement published')); IS.refresh();
  };
  IS.ACT.delnote = async function (b) { await DB.del('notices', b.getAttribute('data-id')); IS.refresh(); };


  /* ========== NEWS (Announcements & News page) ========== */
  IS.page('control-news', async function () {
    var ns = []; try { ns = await DB.q('news', { order: ['created_at', false], limit: 100 }); } catch (e) {}
    return IS.banner(IS.T('الأخبار', 'News'), esc(A('أخبار بصورة تظهر في صفحة الإعلانات والأخبار.', 'News with a picture, shown on the Announcements & News page.')), 'news') +
      '<form class="box form" data-form="newsadd"><div class="g2f"><label class="fl"><span>' + esc(A('العنوان', 'Title')) + ' *</span><input name="title" required maxlength="140"></label>' +
      '<label class="fl"><span>' + esc(A('التصنيف', 'Tag')) + '</span><select name="tag">' + IS.NTAGS.map(function (t) { return '<option value="' + t[0] + '">' + esc(A(t[1], t[2])) + '</option>'; }).join('') + '</select></label></div>' +
      audienceField() + '<label class="fl"><span>' + esc(A('النص', 'Text')) + '</span><textarea name="body" rows="4" maxlength="4000"></textarea></label>' +
      '<label class="fl file"><span>' + esc(A('الصورة', 'Picture')) + '</span><input type="file" name="cover" accept="image/*"></label>' +
      '<label class="chk"><input type="checkbox" name="notify"><span>' + esc(A('أرسل إشعارًا إلى الجمهور المحدد', 'Also notify the selected audience')) + '</span></label>' +
      '<button class="btn pri">' + ic('send') + esc(A('نشر الخبر', 'Publish')) + '</button></form>' +
      (ns.length ? '<div class="table">' + ns.map(function (x) { return '<div class="tr">' + ic('news') + '<span class="grow"><a href="#news/' + x.id + '"><b>' + esc(x.title) + '</b></a><small class="mut">' + esc(IS.date(x.created_at)) + '</small></span>' +
        '<button class="ib sm" data-act="newsdel" data-id="' + x.id + '" aria-label="' + esc(A('حذف', 'Delete')) + '">' + ic('trash') + '</button></div>'; }).join('') + '</div>' : IS.empty('news', A('لم تُنشر أخبار بعد', 'No news published yet')));
  }, P('notify'));
  IS.SUB.newsadd = async function (d, f) {
    var scope = audience(d.scope), row = Object.assign({ title: d.title, tag: d.tag || 'news', body: d.body || '', status: 'published', author_id: IS.ME.id }, scope), c = f.cover.files[0];
    if (c) row.cover = await DB.upload('media', await IS.shrink(c, 1200, 0.84));
    var x = await DB.ins('news', row);
    if (d.notify) await DB.ins('notices', Object.assign({ user_id: null, title: d.title, body: A('خبر جديد في أكاديمية السودان للمراجعة', 'New on Sudan Master Review Academy'), link: '#news/' + x.id }, scope));
    IS.audit('publish news', d.title); IS.toast(A('نُشر الخبر', 'News published')); IS.refresh();
  };
  IS.ACT.newsdel = async function (b) { if (!(await IS.confirm(A('حذف هذا الخبر؟', 'Delete this news item?')))) return; await DB.del('news', b.getAttribute('data-id')); IS.refresh(); };

  /* ========== CATEGORIES & SUBJECTS ========== */
  IS.page('control-cats', async function () {
    return IS.banner(IS.T('التخصصات والأقسام والمواد', 'Specialities, sections and subjects'), esc(A('التخصصات والأقسام تظهر في الرئيسية وصفحة الكورسات؛ والمواد يختارها المحاضر لكل كورس.', 'Specialities and sections appear on Home and Courses; lecturers pick a subject for each course.')), 'grid', '<button class="btn gold" data-act="subjform">' + ic('plus') + esc(A('مادة جديدة', 'New subject')) + '</button>') +
      '<section class="box"><header class="sh"><h2>' + ic('grid') + IS.T('التخصصات', 'Specialities') + '</h2></header><div class="spadm">' + IS.SPECS.map(function (k) { return '<button class="spa" data-act="specform" data-id="' + k.id + '">' + (k.img ? '<img src="' + IS.U(k.img) + '" alt="">' : '') + '<span><b lang="en">' + esc(k.en) + '</b><em>' + N(IS.SUBJ.filter(function (x) { return x.spec === k.id; }).length) + ' ' + esc(A('مادة', 'subjects')) + '</em></span>' + ic('pen') + '</button>'; }).join('') + '</div></section>' +
      /* subjects of each speciality, section by section, as aligned tiles (owner, 18 Nov 2026: "the text and order are not good enough") */
      IS.SPECS.map(function (k) { var ss = IS.SUBJ.filter(function (x) { return x.spec === k.id; });
        return '<section class="box sjadm"><header class="sh"><h2>' + ic(k.icon) + IS.T(k.ar, k.en) + '</h2><em class="sjn">' + IS.cnt(ss.length, 'sub') + '</em><button class="btn sm ghost" data-act="subjform" data-spec="' + k.id + '">' + ic('plus') + esc(A('مادة جديدة', 'New subject')) + '</button></header>' +
          IS.CATS.map(function (c) { var cs = ss.filter(function (x) { return x.cat === c.id; }); if (!cs.length) return '';
            return '<div class="sjg"><h3>' + ic(c.icon) + '<b>' + esc(A(c.ar, c.en)) + '</b>' + '<em>' + N(cs.length) + '</em></h3><div class="sjtiles">' +
              cs.map(function (x) { return '<button class="sjtile" data-act="subjform" data-id="' + x.id + '">' + (x.img ? '<img src="' + IS.U(x.img) + '" alt="" loading="lazy">' : '<i>' + ic(x.icon || 'layers') + '</i>') + '<span><b lang="en" dir="ltr">' + esc(x.en) + '</b>' + '</span>' + ic('pen', 'sjpen') + '</button>'; }).join('') + '</div></div>'; }).join('') + '</section>'; }).join('') +
      '<section class="box sjadm"><header class="sh"><h2>' + ic('layers') + IS.T('الأقسام', 'Sections') + '</h2></header><div class="sjtiles">' + IS.CATS.map(function (c) { return '<button class="sjtile" data-act="catform" data-id="' + c.id + '"><i>' + ic(c.icon) + '</i><span><b>' + esc(A(c.ar, c.en)) + '</b>' + '</span>' + ic('pen', 'sjpen') + '</button>'; }).join('') + '</div></section>';
  }, P('cats'));
  IS.ACT.specform = function (b) { var k = IS.spec(b.getAttribute('data-id'));
    IS.sheet(esc(k.en), '<form class="form" data-form="spec"><input type="hidden" name="id" value="' + k.id + '"><label class="fl"><span>English</span><input name="en" required value="' + esc(k.en) + '"></label><label class="fl"><span>العربية</span><input name="ar" required value="' + esc(k.ar) + '"></label>' +
      '<label class="fl"><span>' + esc(A('الوصف بالعربية', 'Description in Arabic')) + '</span><textarea name="about_ar" rows="2">' + esc(k.about_ar || '') + '</textarea></label><label class="fl"><span>' + esc(A('الوصف بالإنجليزية', 'Description in English')) + '</span><textarea name="about_en" rows="2" dir="ltr">' + esc(k.about_en || '') + '</textarea></label>' +
      '<label class="fl"><span>' + esc(A('صورة جديدة (اختياري)', 'New picture (optional)')) + '</span><input type="file" name="img" accept="image/*"></label><button class="btn pri wide">' + esc(A('حفظ', 'Save')) + '</button></form>'); };
  IS.SUB.spec = async function (d, f) { var row = { en: d.en, ar: d.ar, about_ar: d.about_ar, about_en: d.about_en }, file = f.querySelector('[name=img]').files[0];
    if (file) row.img = await DB.upload('media', file); await DB.upd('specialties', d.id, row); await IS.loadBase(); IS.audit('edit speciality', d.en); IS.closeSheet(); IS.refresh(); };
  IS.ACT.catform = function (b) { var c = IS.cat(b.getAttribute('data-id')); IS.sheet(esc(c.en), '<form class="form" data-form="cat"><input type="hidden" name="id" value="' + c.id + '"><label class="fl"><span>English</span><input name="en" required value="' + esc(c.en) + '"></label><label class="fl"><span>العربية</span><input name="ar" required value="' + esc(c.ar) + '"></label><button class="btn pri wide">' + esc(A('حفظ', 'Save')) + '</button></form>'); };
  IS.SUB.cat = async function (d) { await DB.upd('categories', d.id, { ar: d.ar, en: d.en }); await IS.loadBase(); IS.audit('edit category', d.en); IS.closeSheet(); IS.refresh(); };
  IS.ACT.subjform = function (b) { var s = b.getAttribute('data-id') ? IS.subj(b.getAttribute('data-id')) : { cat: 'clinical', icon: 'layers', spec: b.getAttribute('data-spec') || 'medicine' };
    IS.sheet(esc(s.id ? s.en : A('مادة جديدة', 'New subject')), '<form class="form" data-form="subj"><input type="hidden" name="old" value="' + esc(s.id || '') + '">' +
      '<label class="fl"><span>' + esc(A('التخصص', 'Speciality')) + '</span><select name="spec">' + IS.SPECS.map(function (k) { return '<option value="' + k.id + '"' + (s.spec === k.id ? ' selected' : '') + '>' + esc(k.en) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fl"><span>' + esc(A('القسم', 'Section')) + '</span><select name="cat">' + IS.CATS.map(function (c) { return '<option value="' + c.id + '"' + (s.cat === c.id ? ' selected' : '') + '>' + esc(c.en) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fl"><span>English</span><input name="en" required value="' + esc(s.en || '') + '"></label><label class="fl"><span>العربية</span><input name="ar" required value="' + esc(s.ar || '') + '"></label><label class="fl file"><span>' + esc(A('صورة المادة (اختياري)', 'Subject picture (optional)')) + (s.img ? ' ✓' : '') + '</span><input type="file" name="img" accept="image/*"></label><button class="btn pri wide">' + esc(A('حفظ', 'Save')) + '</button></form>'); };
  IS.SUB.subj = async function (d, f) { var file = f.querySelector('[name=img]').files[0], row = { spec: d.spec, cat: d.cat, ar: d.ar, en: d.en }; if (file) row.img = await DB.upload('media', file);
    if (d.old) await DB.upd('subjects', d.old, row); else await DB.ins('subjects', Object.assign(row, { id: d.en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || DB.uuid(), icon: 'layers', sort: IS.SUBJ.length }));
    await IS.loadBase(); IS.audit('subject', d.en); IS.closeSheet(); IS.refresh(); };

  /* ========== SETTINGS ========== */
  IS.page('control-settings', async function (tab) {
    var S = IS.SET;
    return IS.banner(IS.T('الإعدادات العامة', 'General settings'), '', 'gear') + '<form class="box form" data-form="settings"><h2>' + ic('wallet') + IS.T('الدفع', 'Payment') + '</h2><div class="g2f"><label class="fl"><span>' + esc(A('رقم حساب بنكك لاستلام المدفوعات', 'Bankak account for payments')) + '</span><input name="bankak_account" dir="ltr" value="' + esc(S.bankak_account || '') + '"></label><label class="fl"><span>' + esc(A('اسم صاحب الحساب', 'Account name')) + '</span><input name="bankak_name" value="' + esc(S.bankak_name || '') + '"></label>' +
      '<label class="fl"><span>' + esc(A('العملة', 'Currency')) + '</span><input name="currency" value="' + esc(S.currency || 'SDG') + '"></label><label class="fl"><span>' + esc(A('نسبة المحاضر الافتراضية %', 'Default lecturer share %')) + '</span><input name="default_share" type="number" min="0" max="100" value="' + esc(S.default_share || 70) + '"></label></div><button class="btn pri">' + esc(A('حفظ', 'Save')) + '</button></form>' +
      '<section class="box" id="backup"><h2>' + ic('cloud') + IS.T('النسخ الاحتياطي والتكاملات', 'Backup and integrations') + '</h2><ul class="kv"><li><span>' + esc(A('قاعدة البيانات', 'Database')) + '</span><b>' + esc(DB.live ? 'Supabase · ' + A('متصلة', 'connected') : A('معاينة على هذا الجهاز', 'Preview on this device')) + '</b></li><li><span>' + esc(A('الفيديو', 'Video')) + '</span><b>' + esc((window.ISH_CONFIG || {}).bunnyLibrary ? 'Bunny Stream · ' + window.ISH_CONFIG.bunnyLibrary : A('لم يُربط بعد', 'Not connected yet')) + '</b></li></ul>' +
      (DB.live ? '<p class="mut">' + esc(A('يأخذ Supabase نسخة احتياطية يومية تلقائيًا (Project Settings → Database → Backups).', 'Supabase takes a daily backup automatically (Project Settings → Database → Backups).')) + '</p>' : '<button class="btn ghost" data-act="backup">' + ic('file') + esc(A('تنزيل نسخة من بيانات المعاينة', 'Download a copy of the preview data')) + '</button> <button class="btn ghost bad" data-act="wipe">' + ic('trash') + esc(A('مسح بيانات المعاينة', 'Clear the preview data')) + '</button>') + '</section>';
  }, P('settings'));
  IS.SUB.settings = async function (d) { var ks = Object.keys(d); for (var i = 0; i < ks.length; i++) await DB.upsert('settings', { id: ks[i], value: String(d[ks[i]]) }); await IS.loadBase(); IS.audit('settings'); IS.toast(A('حُفظت', 'Saved')); };
  IS.ACT.backup = function () { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([localStorage.getItem('ish-db') || '{}'], { type: 'application/json' })); a.download = 'ishrah-preview-backup.json'; a.click(); };
  IS.ACT.wipe = async function () { if (!(await IS.confirm(A('مسح كل بيانات المعاينة على هذا الجهاز؟', 'Clear all preview data on this device?'), A('مسح', 'Clear')))) return; DB.reset(); location.hash = ''; location.reload(); };

  /* ========== ACTIVITY LOG ========== */
  IS.page('control-audit', async function () {
    var a = await DB.q('audit', { order: ['created_at', false], limit: 300 });
    return IS.banner(IS.T('سجل العمليات', 'Activity log'), esc(A('كل قرار يتخذه الفريق: من، ماذا، ومتى.', 'Every team decision: who, what and when.')), 'clock') + (a.length ? '<div class="table">' + a.map(function (x) { return '<div class="tr"><b>' + esc(x.name || '') + '</b><span class="grow">' + esc(x.action) + (x.target ? ' · <span class="mut">' + esc(x.target) + '</span>' : '') + '</span><span class="mut">' + esc(IS.date(x.created_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) + '</span></div>'; }).join('') + '</div>' : IS.empty('clock', A('السجل فارغ', 'Nothing yet')));
  }, P('audit'));

  /* ========== REPORTS ========== */
  IS.page('control-reports', async function (tab) {
    tab = tab || 'revenue'; var r = await Promise.all([DB.q('enrollments'), DB.q('courses'), DB.q('profiles'), DB.q('progress'), DB.q('events'), DB.q('event_regs'), IS.lecMap()]);
    var en = r[0], cs = r[1], us = r[2], pr = r[3], ev = r[4], rg = r[5], L = r[6], ms = months(12), act = en.filter(function (e) { return e.status === 'active'; });
    var h = IS.banner(IS.T('التقارير والتحليلات', 'Reports and analytics'), '', 'chart') + tabsBar('control-reports', tab, [['revenue', A('الإيرادات', 'Revenue')], ['courses', A('الكورسات', 'Courses')], ['users', A('المستخدمون', 'Users')], ['engagement', A('التفاعل', 'Engagement')], ['events', A('الفعاليات', 'Events')]]);
    if (tab === 'revenue') { var m = ms.map(function (k) { return [k.slice(5) + '/' + k.slice(2, 4), act.filter(function (e) { return String(e.decided_at || '').slice(0, 7) === k; }).reduce(function (a, e) { return a + (+e.price || 0); }, 0)]; });
      h += '<section class="box"><header class="sh"><h2>' + IS.T('الإيرادات الشهرية', 'Monthly revenue') + '</h2><button class="btn ghost sm" data-act="csvrev">' +
        ic('file') + esc(A('تصدير CSV', 'Export CSV')) + '</button></header>' + IS.barChart(m) + '</section>';
      IS.ACT.csvrev = function () { csv('ishrah-revenue', [['date', 'course', 'student', 'phone', 'amount', 'ref', 'lecturer', 'share %']].concat(act.map(function (e) { var c = cs.filter(function (x) { return x.id === e.course_id; })[0] || {}; return [String(e.decided_at || '').slice(0, 10), c.title, e.payer, e.phone, e.price, e.ref, (L[e.lecturer_id] || {}).name, e.share]; }))); }; }
    if (tab === 'courses') h += '<div class="table">' + cs.slice().sort(function (a, b) { return (b.n_students || 0) - (a.n_students || 0); }).map(function (c) { var rev = act.filter(function (e) { return e.course_id === c.id; }).reduce(function (a, e) { return a + (+e.price || 0); }, 0);
      return '<div class="tr"><span class="grow"><b>' + esc(c.title) + '</b><small class="mut">' + esc((L[c.lecturer_id] || {}).name || '') + '</small></span>' + IS.status(c.status) + '<span class="cell"><small>' + esc(A('طلبة', 'Students')) + '</small><b>' + N(c.n_students || 0) + '</b></span><span class="cell"><small>' + esc(A('تقييم', 'Rating')) + '</small><b>' + (c.n_reviews ? N(c.rating) : '—') + '</b></span><span class="cell"><small>' + esc(A('إيراد', 'Revenue')) + '</small><b>' + IS.money(rev) + '</b></span></div>'; }).join('') + '</div>';
    if (tab === 'users') h += '<section class="box"><h2>' + IS.T('التسجيلات الشهرية', 'Monthly sign-ups') + '</h2>' + IS.barChart(ms.map(function (k) { return [k.slice(5) + '/' + k.slice(2, 4), us.filter(function (u) { return String(u.created_at).slice(0, 7) === k; }).length]; })) + '</section>';
    if (tab === 'engagement') h += '<section class="box"><h2>' + IS.T('الدروس المنتهية شهريًا', 'Lessons completed per month') + '</h2>' + IS.barChart(ms.map(function (k) { return [k.slice(5) + '/' + k.slice(2, 4), pr.filter(function (p) { return String(p.done_at).slice(0, 7) === k; }).length]; })) + '</section>';
    if (tab === 'events') h += '<div class="table">' + ev.map(function (e) { return '<div class="tr"><span class="grow"><b>' + esc(e.title) + '</b><small class="mut">' + esc(IS.date(e.starts)) + '</small></span><span class="cell"><small>' + esc(A('مسجّلون', 'Registered')) + '</small><b>' + N(rg.filter(function (x) { return x.event_id === e.id; }).length) + '</b></span></div>'; }).join('') + '</div>';
    return h;
  }, P('reports'));

  /* ========== LEARNING PATHS (managed here; student pages below) ========== */
  IS.page('control-paths', async function () {
    var ps = await DB.q('paths', { order: ['sort'] });
    return IS.banner(IS.T('المسارات التعليمية', 'Learning paths'), esc(A('مسار = مجموعة كورسات بترتيب يأخذ الطالب من البداية حتى الامتحان.', 'A path is a set of courses in an order that takes the student from the start to the exam.')), 'route', '<button class="btn gold" data-act="pathform">' + ic('plus') + esc(A('مسار جديد', 'New path')) + '</button>') +
      (ps.length ? '<div class="table">' + ps.map(function (p) { return '<div class="tr"><span class="grow"><b>' + esc(p.title) + '</b><small class="mut">' + N((p.steps || []).length) + ' ' + esc(A('كورس', 'courses')) + '</small></span>' + IS.status(p.status) + '<button class="btn sm ghost" data-act="pathform" data-id="' + p.id + '">' + ic('pen') + esc(A('تعديل', 'Edit')) + '</button></div>'; }).join('') + '</div>' : IS.empty('route', A('لا توجد مسارات بعد', 'No paths yet')));
  }, P('paths'));
  IS.ACT.pathform = async function (b) {
    var p = b.getAttribute('data-id') ? await DB.one('paths', b.getAttribute('data-id')) : { steps: [], status: 'published' }, cs = await DB.q('courses', { eq: { status: 'published' } });
    IS.sheet(esc(p.id ? p.title : A('مسار جديد', 'New path')), '<form class="form" data-form="path"><input type="hidden" name="id" value="' + esc(p.id || '') + '"><label class="fl"><span>' + esc(A('العنوان', 'Title')) + '</span><input name="title" required value="' + esc(p.title || '') + '"></label><label class="fl"><span>' + esc(A('الوصف', 'Description')) + '</span><textarea name="about" rows="2">' + esc(p.about || '') + '</textarea></label>' +
      '<label class="fl"><span>' + esc(A('القسم', 'Category')) + '</span><select name="cat">' + IS.CATS.map(function (c) { return '<option value="' + c.id + '"' + (p.cat === c.id ? ' selected' : '') + '>' + esc(A(c.ar, c.en)) + '</option>'; }).join('') + '</select></label><fieldset class="fl"><legend>' + esc(A('الكورسات (بالترتيب الذي تختاره به)', 'Courses (in the order you tick them)')) + '</legend>' +
      cs.map(function (c) { var i = (p.steps || []).indexOf(c.id); return '<label class="chk"><input type="checkbox" name="s" value="' + c.id + '"' + (i >= 0 ? ' checked data-o="' + i + '"' : '') + '><span>' + esc(c.title) + '</span></label>'; }).join('') + '</fieldset>' +
      '<label class="chk"><input type="checkbox" name="pub"' + (p.status !== 'hidden' ? ' checked' : '') + '><span>' + esc(A('منشور للطلبة', 'Published to students')) + '</span></label><div class="row sp">' + (p.id ? '<button type="button" class="btn ghost bad" data-act="delpath" data-id="' + p.id + '">' + esc(A('حذف', 'Delete')) + '</button>' : '<span></span>') + '<button class="btn pri">' + esc(A('حفظ', 'Save')) + '</button></div></form>');
    var seq = (p.steps || []).slice(); IS.$$('#sheet input[name=s]').forEach(function (i) { i.onchange = function () { var k = seq.indexOf(i.value); if (i.checked && k < 0) seq.push(i.value); if (!i.checked && k >= 0) seq.splice(k, 1); }; }); IS.PSEQ = function () { return seq; };
  };
  IS.SUB.path = async function (d, f) { var row = { title: d.title, about: d.about, cat: d.cat, steps: IS.PSEQ ? IS.PSEQ() : [], status: f.pub.checked ? 'published' : 'hidden' }; if (d.id) await DB.upd('paths', d.id, row); else { row.sort = (await DB.q('paths')).length; await DB.ins('paths', row); } IS.audit('path', d.title); IS.closeSheet(); IS.refresh(); };
  IS.ACT.delpath = async function (b) { await DB.del('paths', b.getAttribute('data-id')); IS.closeSheet(); IS.refresh(); };
  /* student pages for paths */
  function pathInStudySpace(path, courses) {
    var section = IS.mySection(), steps = path.steps || [];
    return IS.inSpec(path) && (!section || !path.cat || path.cat === section.id) &&
      (steps.length ? steps.every(function (id) { return courses.some(function (c) { return c.id === id; }); }) : path.cat === (section && section.id));
  }
  IS.page('paths', async function () {
    var cs = await IS.pubCourses(), ps = (await DB.q('paths', { eq: { status: 'published' }, order: ['sort'] })).filter(function (p) { return pathInStudySpace(p, cs); });
    return IS.banner(IS.T('المسارات التعليمية', 'Learning paths'), esc(A('مسارات منظمة ومتكاملة من الأساسيات وحتى المراجعة النهائية', 'Organised paths from the basics to the final review')), 'route') + (ps.length ? '<div class="grid g3">' + ps.map(function (p) { var st = (p.steps || []).filter(function (id) { return cs.some(function (c) { return c.id === id; }); });
      return '<a class="pcard" href="#path/' + p.id + '"><span class="pi">' + ic('route') + '</span><b>' + esc(p.title) + '</b><small>' + esc(p.about || '') + '</small><em>' + N(st.length) + ' ' + esc(A('كورس', 'courses')) + '</em></a>'; }).join('') + '</div>' : IS.empty('route', A('لا توجد مسارات بعد', 'No paths yet'), A('يضيف فريق المنصة المسارات عند توفر الكورسات.', 'The platform team adds paths as courses become available.')));
  });
  IS.page('path', async function (id) {
    var p = await DB.one('paths', id); if (!p || p.status !== 'published') return null;
    var cs = await IS.pubCourses(); if (!pathInStudySpace(p, cs)) return IS.outsideStudySpace({ spec: p.spec || IS.SPEC, cat: p.cat });
    var L = await IS.lecMap(), E = await IS.myEnroll(), steps = (p.steps || []).map(function (s) { return cs.find(function (c) { return c.id === s; }); });
    var prog = IS.ME ? await DB.q('progress', { eq: { user_id: IS.ME.id } }) : [];
    return '<nav class="crumb"><a href="#paths">' + esc(A('المسارات', 'Paths')) + '</a>' + ic('chev', 'fl') + '<span>' + esc(p.title) + '</span></nav>' + IS.banner(esc(p.title), esc(p.about || ''), 'route') + '<ol class="psteps">' + steps.map(function (c, i) { var n = prog.filter(function (x) { return x.course_id === c.id; }).length, pc = c.n_lessons ? Math.min(100, Math.round(n / c.n_lessons * 100)) : 0;
      return '<li class="' + (pc >= 100 ? 'ok' : '') + '"><span class="sn">' + (pc >= 100 ? ic('check') : N(i + 1)) + '</span>' + IS.courseCard(c, L, E) + '<div class="prog">' + IS.bar(pc) + '<em>' + N(pc + '%') + '</em></div></li>'; }).join('') + '</ol>';
  });
})();

/* Usage (owner, 19 Nov 2026: "how much can this free account hold, and when do I pay"): storage per kind of file, database size, counts,
   the largest files, against the plan's limits (settings plan_storage_gb, plan_db_mb, plan_name); download traffic only on Supabase's page */
(function () {
  var A = IS.A, esc = IS.esc, ic = IS.ic, N = IS.N;
  var NAMES = { library: ['الكتب والملفات', 'Books and files'], media: ['الصور العامة', 'Public pictures'], receipts: ['إيصالات الدفع', 'Payment receipts'],
    'payout-receipts': ['إيصالات التحويل', 'Payout receipts'], apps: ['ملفات طلبات المحاضرين', 'Lecturer application files'], 'course-request-files': ['مرفقات طلبات الكورسات', 'Course request attachments'] };
  function size(b) { b = +b || 0; return b >= 1073741824 ? (b / 1073741824).toFixed(2) + ' GB' : b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(0, Math.round(b / 1024)) + ' KB'; }
  function bar(used, limit) {
    var pc = limit ? Math.min(100, used / limit * 100) : 0, cls = pc >= 90 ? 'bad' : pc >= 70 ? 'warn' : 'ok';
    return '<div class="ubar ' + cls + '"><i style="width:' + pc.toFixed(1) + '%"></i></div><p class="ufig"><b dir="ltr">' + size(used) + '</b> ' + esc(A('من', 'of')) + ' <b dir="ltr">' + size(limit) + '</b> · <b>' + Math.round(pc) + '%</b></p>';
  }
  async function data() {
    if (DB.live) { var r = await DB.sb.rpc('ish_usage'); if (r.error) throw r.error; return r.data; }
    var tables = ['profiles', 'posts', 'replies', 'files', 'courses', 'lessons', 'enrollments', 'file_buys', 'notices'], counts = {};
    for (var i = 0; i < tables.length; i++) counts[tables[i]] = (await DB.q(tables[i])).length;
    var raw = 0; try { raw = (localStorage.getItem('ish-db') || '').length; } catch (e) {}
    var files = await DB.q('files'), lib = files.reduce(function (a, f) { return a + (+f.size || 0); }, 0);
    return { db_bytes: raw, buckets: [{ id: 'library', files: files.length, bytes: lib }], counts: counts, largest: files.slice().sort(function (a, b) { return (+b.size || 0) - (+a.size || 0); }).slice(0, 10).map(function (f) { return { bucket: 'library', name: f.title, bytes: +f.size || 0, at: f.created_at }; }), at: new Date().toISOString() };
  }
  IS.page('control-usage', async function () {
    var u; try { u = await data(); } catch (e) { return IS.banner(IS.T('الاستهلاك والسعة', 'Usage'), '', 'chart') + IS.empty('info', A('تعذّر قراءة الاستهلاك', 'Usage could not be read'), e.message); }
    var S = IS.SET, plan = S.plan_name || 'free', sLimit = (+S.plan_storage_gb || (plan === 'pro' ? 100 : 1)) * 1073741824, dLimit = (+S.plan_db_mb || (plan === 'pro' ? 8192 : 500)) * 1048576;
    var used = (u.buckets || []).reduce(function (a, b) { return a + (+b.bytes || 0); }, 0), pc = used / sLimit * 100, dpc = (+u.db_bytes || 0) / dLimit * 100;
    var advice = Math.max(pc, dpc) >= 90 ? ['bad', A('اقتربت من الحد. رقِّ الخطة إلى Pro (حوالي 25 دولارًا شهريًا) أو انقل ملفات المكتبة إلى Cloudflare R2 قبل أن تتوقف الرفوع.', 'You are close to the limit. Upgrade to Pro (about $25 a month) or move the library files to Cloudflare R2 before uploads stop.')] :
      Math.max(pc, dpc) >= 70 ? ['warn', A('تجاوزت ٧٠٪. خطّط للترقية إلى Pro أو لنقل ملفات المكتبة إلى Cloudflare R2 قريبًا.', 'Over 70%. Plan to upgrade to Pro or move the library files to Cloudflare R2 soon.')] :
        ['ok', A('الاستهلاك ضمن الحدود. لا حاجة للدفع الآن.', 'Usage is within the limits. No need to pay yet.')];
    var h = IS.banner(IS.T('الاستهلاك والسعة', 'Usage'), esc(A('كم تستهلك المنصة من مساحة الملفات وقاعدة البيانات مقارنةً بحدود خطتك.', 'How much file storage and database the platform uses against your plan.')), 'chart');
    h += '<div class="note ' + advice[0] + ' unote">' + ic(advice[0] === 'ok' ? 'check' : 'info') + '<span>' + esc(advice[1]) + '</span></div>';
    h += '<div class="grid g2 ugrid"><section class="box"><h2>' + ic('upload') + IS.T('مساحة الملفات', 'File storage') + ' <span class="chip">' + esc(plan === 'pro' ? 'Pro' : A('مجانية', 'Free')) + '</span></h2>' + bar(used, sLimit) +
      '<div class="table">' + (u.buckets || []).map(function (b) { var n = NAMES[b.id] || [b.id, b.id];
        return '<div class="tr"><span class="grow"><b>' + esc(A(n[0], n[1])) + '</b><small class="mut">' + N(b.files) + ' ' + esc(A('ملف', 'files')) + '</small></span><b dir="ltr">' + size(b.bytes) + '</b></div>'; }).join('') + '</div></section>' +
      '<section class="box"><h2>' + ic('layers') + IS.T('قاعدة البيانات', 'Database') + '</h2>' + bar(u.db_bytes, dLimit) +
      '<div class="table">' + [['profiles', 'الحسابات', 'Accounts'], ['posts', 'المنشورات', 'Posts'], ['replies', 'التعليقات والردود', 'Comments and replies'], ['files', 'ملفات المكتبة', 'Library files'],
        ['courses', 'الكورسات', 'Courses'], ['lessons', 'الدروس', 'Lessons'], ['enrollments', 'الالتحاقات', 'Enrolments'], ['file_buys', 'مشتريات المكتبة', 'Library purchases'], ['notices', 'الإشعارات', 'Notifications']].map(function (t) {
        return '<div class="tr"><span class="grow">' + esc(A(t[1], t[2])) + '</span><b>' + N((u.counts || {})[t[0]] || 0) + '</b></div>'; }).join('') + '</div></section></div>';
    h += '<section class="box"><h2>' + ic('file') + IS.T('أكبر الملفات', 'Largest files') + '</h2>' + ((u.largest || []).length ? '<div class="table">' + u.largest.map(function (f) { var n = NAMES[f.bucket] || [f.bucket, f.bucket];
      return '<div class="tr"><span class="grow"><b dir="auto" class="uname">' + esc(String(f.name || '').split('/').pop()) + '</b><small class="mut">' + esc(A(n[0], n[1])) + (f.at ? ' · ' + esc(IS.date(f.at)) : '') + '</small></span><b dir="ltr">' + size(f.bytes) + '</b></div>'; }).join('') + '</div>' :
      IS.empty('file', A('لا توجد ملفات بعد', 'No files yet'))) + '</section>';
    h += '<section class="box"><h2>' + ic('download') + IS.T('حركة التنزيل', 'Download traffic') + '</h2><p>' + esc(A('حركة التنزيل (فتح الكتب والصور وتنزيلها) تظهر فقط في لوحة Supabase: المؤسسة ← Usage ← Egress. الخطة المجانية تسمح بحوالي 5 GB شهريًا، وPro بحوالي 250 GB. الكتب التي فُتحت مرة تُفتح بعدها من الجهاز فلا تُحسب مرة أخرى.',
      'Download traffic (opening and downloading books and pictures) is shown only in Supabase: Organization → Usage → Egress. Free allows about 5 GB a month, Pro about 250 GB. A book opened once then opens from the phone, so it is not counted again.')) + '</p>' +
      '<a class="btn ghost" href="' + esc('https://supabase.com/dashboard/project/' + ((/https:\/\/([a-z0-9]+)\.supabase\.co/.exec((window.ISH_CONFIG || {}).supabaseUrl || '') || [])[1] || '')) + '" target="_blank" rel="noopener">' + ic('link') + esc(A('افتح صفحة الاستهلاك في Supabase', 'Open the usage page in Supabase')) + '</a></section>';
    h += '<section class="box"><h2>' + ic('gear') + IS.T('حدود خطتك', 'Your plan limits') + '</h2><form class="form" data-form="planlimits"><div class="g2f">' +
      '<label class="fl"><span>' + esc(A('الخطة', 'Plan')) + '</span><select name="plan_name"><option value="free"' + (plan === 'free' ? ' selected' : '') + '>' + esc(A('مجانية', 'Free')) + '</option><option value="pro"' + (plan === 'pro' ? ' selected' : '') + '>Pro</option></select></label>' +
      '<label class="fl"><span>' + esc(A('مساحة الملفات (GB)', 'File storage (GB)')) + '</span><input name="plan_storage_gb" type="number" min="1" step="1" dir="ltr" value="' + esc(String(sLimit / 1073741824)) + '"></label>' +
      '<label class="fl"><span>' + esc(A('قاعدة البيانات (MB)', 'Database (MB)')) + '</span><input name="plan_db_mb" type="number" min="100" step="100" dir="ltr" value="' + esc(String(dLimit / 1048576)) + '"></label></div>' +
      '<button class="btn pri">' + ic('check') + esc(A('حفظ', 'Save')) + '</button></form><small class="mut">' + esc(A('آخر تحديث: ', 'Updated: ')) + esc(IS.date(u.at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) + '</small></section>';
    return h;
  }, { area: 'control', auth: true, perm: 'settings' });
  IS.SUB.planlimits = async function (d) {
    if (!IS.can('settings', 'edit')) return IS.toast(A('لا تملك صلاحية تعديل الإعدادات.', 'You cannot edit settings.'), true);
    if (d.plan_name !== (IS.SET.plan_name || '') && d.plan_storage_gb === String((+IS.SET.plan_storage_gb || 1))) { d.plan_storage_gb = d.plan_name === 'pro' ? '100' : '1'; d.plan_db_mb = d.plan_name === 'pro' ? '8192' : '500'; }
    for (var k of ['plan_name', 'plan_storage_gb', 'plan_db_mb']) { await DB.upsert('settings', { id: k, value: String(d[k]) }); IS.SET[k] = String(d[k]); }
    IS.toast(A('حُفظت الحدود', 'Limits saved')); IS.refresh();
  };
})();
