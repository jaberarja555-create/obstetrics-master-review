/* SMRA Permanent Exam — app. Data in window.EXAM (data.js). */
(function () {
  'use strict';

  var E = window.EXAM || { exams: [], subjects: [], questions: [], total: 0, groups: [] };
  var AR0 = (function () { try { return JSON.parse(localStorage.getItem('ish-lang')) === 'en' ? false : false; } catch (e) { return false; } })();
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function A(ar, en) { return document.documentElement.lang === 'ar' ? ar : en; }
  var AR = function () { return document.documentElement.lang === 'ar'; };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function get(k, d) { try { var x = localStorage.getItem('ex-' + k); return x == null ? d : JSON.parse(x); } catch (e) { return d; } }
  function put(k, v) { try { localStorage.setItem('ex-' + k, JSON.stringify(v)); } catch (e) {} }

  /* ---- icons ---- */
  var I = {
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', back: '<path d="m15 6-6 6 6 6"/>', fwd: '<path d="m9 6 6 6-6 6"/>', chv: '<path d="m9 6 6 6-6 6"/>',
    sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>', eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>', bars: '<path d="M6 20v-5M10 20v-8M14 20v-11M18 20V6"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>', cam: '<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', phone: '<path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z"/>', out: '<path d="M14 4h5v16h-5"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>', home: '<path d="M4 11 12 4l8 7v9H4z"/>', list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    play: '<path d="M7 5v14l11-7z"/>', timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>', chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
    flask: '<path d="M9 3h6M10 3v6l-5 8a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 17l-5-8V3"/>', book: '<path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z"/><path d="M8 3v18"/>',
    mark: '<path d="M6 3h12v18l-6-4-6 4z"/>', cross: '<path d="M18 6 6 18M6 6l12 12"/>', check: '<path d="m5 12 5 5 9-11"/>', checkc: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.3 2.3L15.5 9.5" stroke="#fff"/>',
    palette: '<circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1.3"/><circle cx="12" cy="8" r="1.3"/><circle cx="16" cy="10" r="1.3"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 2H9.8l-.4 2.5a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.5h4.4l.4-2.5a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5"/>', flag: '<path d="M5 21V4M5 4h11l-1.5 3L16 10H5"/>', shuffle: '<path d="M16 4h4v4M20 4l-6 6M4 20l16-16M16 20h4v-4M4 4l6 6"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', bolt: '<path d="M13 3 4 14h6l-1 7 9-11h-6z"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    marker: '<path d="m14.6 4.2 5.2 5.2-8.9 8.9H5.7v-5.2z"/><path d="M3.5 21h9"/>', crown: '<path d="M3 7l4 4 5-7 5 7 4-4-2 12H5z"/>', target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>'
  };
  function ic(n, c) { return '<svg class="ic' + (c ? ' ' + c : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (I[n] || I.list) + '</svg>'; }

  /* ---- data maps ---- (rebuilt when the real bank arrives after decryption) */
  var Q = {}, EXM = {}, SUBN = {};
  var LOCKED = false, PRICE = 0, BANKAK = null, PENDING = false, DV = '2';
  function setData(obj) {
    if (obj) E = obj;
    LOCKED = !!(E && E.sample);
    Q = {}; (E.questions || []).forEach(function (q) { Q[q.g] = q; });
    EXM = {}; (E.exams || []).forEach(function (x) { EXM[x.id] = x; });
    SUBN = {}; (E.subjects || []).forEach(function (s) { SUBN[s[0]] = s[1]; });
  }
  setData(E);
  function money(n) { try { return (+n).toLocaleString(AR() ? 'ar-EG' : 'en') + (AR() ? ' ج.س' : ' SDG'); } catch (e) { return n + (AR() ? ' ج.س' : ' SDG'); } }
  var SICO = { MED: 'book', SURG: 'flask', PAED: 'user', OBG: 'user', COMM: 'chart', OTHER: 'layers' };

  /* ---- answered history / marks ---- */
  function seen() { return get('seen', {}); }
  function marks() { return get('mark', {}); }
  function markOn(g) { var m = marks(); return !!m[g]; }
  function toggleMark(g) { var m = marks(); if (m[g]) delete m[g]; else m[g] = 1; put('mark', m); }
  function record(g, chosen, correct) { var s = seen(); s[g] = { a: chosen, c: correct ? 1 : 0, t: Date.now() }; put('seen', s); }

  /* ---- router ---- */
  function go(h) { if (location.hash.slice(1) === h) render(); else location.hash = h; }
  window.addEventListener('hashchange', render);
  function route() { return location.hash.replace(/^#/, '').split('/'); }

  var THEMES = ['light', 'dark', 'eye'];
  function theme() { return document.documentElement.dataset.theme || 'light'; }
  function cycleTheme() { var t = get2('ish-theme', 'light'); var seq = ['light', 'dark', 'eye']; var n = seq[(seq.indexOf(t) + 1) % 3]; try { localStorage.setItem('ish-theme', JSON.stringify(n)); } catch (e) {} document.documentElement.dataset.theme = n; render(); toast(A('المظهر: ', 'Look: ') + A({ light: 'نهار', dark: 'ليل', eye: 'راحة العين' }[n], { light: 'Day', dark: 'Night', eye: 'Eye comfort' }[n])); }
  function get2(k, d) { try { var x = localStorage.getItem(k); return x == null ? d : JSON.parse(x); } catch (e) { return d; } }

  function head(title, sub, back) {
    var th = theme();
    $('#hb').innerHTML = '<div class="hb-s"><button class="hbm" data-act="menu" aria-label="Menu">' + ic('menu') + '</button><i class="hb-dv"></i></div>' +
      '<div class="hb-logo"><img class="hb-img" src="img/logo-smra.webp" alt="SMRA" width="480" height="172" decoding="async"><span class="hb-sub">Permanent Exam</span></div>' +
      '<div class="hb-s end"><i class="hb-dv"></i>' +
      '<button class="rdb bellb" data-act="notes" aria-label="' + A('الإشعارات', 'Notifications') + '">' + ic('bell') + (unread() ? '<i class="bdg">' + Math.min(unread(), 9) + '</i>' : '') + '</button>' +
      '<button class="av" data-act="profile" aria-label="' + A('الملف الشخصي', 'Profile') + '">' + avatar() + '</button></div>';
    var r = route()[0] || 'home';
    var nav = [['home', 'home', 'الرئيسية', 'Home'], ['exams', 'list', 'الامتحانات', 'Exams'], ['progress', 'chart', 'تقدمي', 'Progress'], ['more', 'layers', 'المزيد', 'More']];
    $('#bn').innerHTML = nav.map(function (n) {
      return '<button data-go="' + n[0] + '" class="' + (r === n[0] ? 'on' : '') + '">' + ic(n[1]) + '<span>' + A(n[2], n[3]) + '</span></button>';
    }).join('');
    $('#ph').innerHTML = back ? '<div class="pbar"><button class="sqb sm" data-act="back">' + ic('back') + '</button><div class="pbar-t"><h1>' + esc(title) + '</h1>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div></div>' : '';
    document.body.classList.remove('running');
    document.title = title + ' · SMRA Permanent Exam';
  }

  function ring(pct, size) {
    size = size || 76; var r = (size - 12) / 2, c = 2 * Math.PI * r, o = c * (1 - pct / 100);
    return '<span class="ring"><svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="7"/><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + o + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/><text class="rv" x="50%" y="52%" text-anchor="middle" dominant-baseline="middle">' + pct + '%</text></svg></span>';
  }

  /* ---- overall stats ---- */
  function ntotal() { return (E && E.total) || 4206; }
  function nsub() { return (E.subjects || []).length || 6; }
  function weakCount() {
    var s = seen(), w = 0;
    (E.subjects || []).forEach(function (su) { var qs = qsOfSubject(su[0]), a = 0, c = 0; qs.forEach(function (g) { if (s[g]) { a++; if (s[g].c) c++; } }); if (a >= 3 && Math.round(100 * c / a) < 60) w++; });
    return w;
  }
  function stats() {
    var s = seen(), ans = 0, cor = 0; Object.keys(s).forEach(function (g) { ans++; if (s[g].c) cor++; });
    return { answered: ans, correct: cor, pct: ans ? Math.round(100 * cor / ans) : 0, unused: ntotal() - ans, marked: Object.keys(marks()).length };
  }

  /* hero decoration: faint ECG trace + medical cross + grid, white on the gradient */
  function heroArt(k) {
    var g = 'eg' + (k || 'h');
    return '<i class="hgrid" aria-hidden="true"></i>' +
      (k ? '' : '<svg class="hcross" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 2.5h6v6.5h6.5v6H15v6.5H9V15H2.5V9H9z" fill="none" stroke="#5fe0ef" stroke-width="1.6" stroke-linejoin="round"/></svg>') +
      '<svg class="hecg" width="146" height="30" viewBox="0 0 146 30" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="' + g + '" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#7ff3ff" stop-opacity="0"/><stop offset=".22" stop-color="#8ff6ff"/><stop offset=".72" stop-color="#6eeaf6"/><stop offset="1" stop-color="#5fe3f2" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="M0 21H25l4-3.5 4 3.5H52l5-18 6.5 26 4-8h5l3.5-3 3.5 3H146" fill="none" stroke="url(#' + g + ')" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>';
  }

  /* ---------- HOME ---------- */
  function home() {
    head('SMRA Permanent Exam', '');
    var st = stats(), pc = st.pct, R = 39.5, C = 2 * Math.PI * R;
    var ringSvg = '<svg width="89" height="89" viewBox="0 0 89 89" aria-hidden="true"><circle cx="44.5" cy="44.5" r="' + R + '" fill="none" stroke="rgba(150,232,248,.42)" stroke-width="10"/>' +
      (pc > 0 ? '<circle cx="44.5" cy="44.5" r="' + R + '" fill="none" stroke="#9af4ff" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="' + (C * (1 - pc / 100)) + '" transform="rotate(-90 44.5 44.5)"/>' : '') + '</svg>';
    var h = '<div class="hgp">' + '<section class="hero hm"><div class="hero-tx"><small>' + A('مرحبًا دكتور', 'Welcome, Doctor') + '</small><h2>' + A('امتحان البرمننت', 'Permanent Exam') + '</h2><i class="hero-bar"></i>' +
      '<p>' + A('أسئلة الدورات والشيتات السابقة<br>مع الشرح.', 'Practice questions from past<br>papers and sheets with explanations.') + '</p></div>' +
      /* two small circles (owner, 28 Nov 2026): % of answers right, and how many questions answered (the circle fills over the whole bank) */
      '<div class="hrings">' + miniRing(pc, pc + '%', A('صحيح', 'Correct')) +
        miniRing(ntotal() ? Math.max(st.answered ? 2 : 0, Math.round(100 * st.answered / ntotal())) : 0, st.answered.toLocaleString(AR() ? 'ar-EG' : 'en'), A('سؤال مُجاب', 'Answered')) + '</div>' + heroArt() + '</section></div><div class="hgp">';
    h += '<button class="mock" data-act="mock"><span class="mock-play"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4.8v14.4a1.1 1.1 0 0 0 1.7.93l11-7.2a1.1 1.1 0 0 0 0-1.86l-11-7.2A1.1 1.1 0 0 0 8 4.8z" fill="#fff"/></svg></span><i class="mock-div"></i>' +
      '<span class="mock-t"><b>' + A('امتحان تجريبي', 'Mock Exam') + '</b><small>' + A('200 سؤال عشوائي \u2022 بوقت محدد', '200 random questions \u2022 timed') + '</small></span>' + ic('fwd', 'mock-ch') + '</button>';
    h += '</div><div class="hgp"><h2 class="st hst">' + A('ابدأ المذاكرة', 'Start Practising') + '</h2><div class="qt hq">' +
      tile('exams', 'list', A('الامتحانات', 'Exams'), A('الدورات والشيتات', 'Papers & sheets')) +
      tile('subjects', 'layers', A('حسب المادة', 'By Subject'), nsub() + ' ' + A('مواد', 'subjects')) +
      tile('set/incorrect', 'cross', A('الأخطاء', 'Incorrect'), A('مراجعة الأخطاء', 'Review mistakes')) +
      tile('set/marked', 'mark', A('المعلّمة', 'Marked'), A('أسئلة محفوظة', 'Saved questions')) + '</div></div><div class="hgp">';
    h += '<button class="prog-card" data-go="progress"><span class="prog-ic"><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="#fff"><rect x="3" y="14" width="3.3" height="7" rx="1"/><rect x="8.3" y="10" width="3.3" height="11" rx="1"/><rect x="13.6" y="6.2" width="3.3" height="14.8" rx="1"/><rect x="18.9" y="2.6" width="3.3" height="18.4" rx="1"/></svg></span><i class="prog-div"></i>' +
      '<span class="prog-tx"><b>' + A('تقييم التقدم', 'Progress Assessment') + '</b>' +
      '<small>' + A('تابع الأسئلة المُجابة وحدّد نقاط الضعف.', 'Track answered questions and identify weak areas.') + '</small>' +
      '<span class="prog-pills"><span class="ppill"><svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#1597b5"/><path d="m7 12.4 3.3 3.3L17.2 8.8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span><b>' + st.answered + '</b> ' + A('مُجاب', 'Answered') + '</span></span>' +
      '<span class="ppill"><svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#1597b5" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.8" fill="#1597b5" stroke="none"/><path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4"/></svg><span><b>' + weakCount() + '</b> ' + A('نقاط ضعف', 'Weak Areas') + '</span></span></span></span>' +
      ic('fwd', 'prog-ch') + heroArt('p') + '</button>';
    /* owner, 28 Nov 2026: «why down there is empty space» — Home goes on with practice by level and the newest papers */
    var cnt = { 1: 0, 2: 0, 3: 0 }; E.questions.forEach(function (q) { if (!q.b) cnt[level(q)]++; });
    h += '</div><div class="hgp"><h2 class="st hst">' + A('تدرّب حسب المستوى', 'Practise by Level') + '</h2><div class="lvrow">' + [1, 2, 3].map(function (l) {
      return '<button class="lvt lv' + l + '" data-act="lvstart" data-lv="' + l + '"' + (cnt[l] ? '' : ' disabled') + '><span class="lvt-d">' + ic('bars') + '</span><span class="lvt-t"><b>' + A(LVN[l][0], LVN[l][1]) + '</b><small>' + cnt[l].toLocaleString(AR() ? 'ar-EG' : 'en') + ' ' + A('سؤال', 'questions') + '</small></span></button>';
    }).join('') + '</div></div>';
    var s = seen(), latest = (E.exams || []).filter(function (x) { return x.group === 'Past papers' && /^perm/i.test(x.id); }).slice(-3).reverse();
    if (latest.length) h += '<div class="hgp"><h2 class="st hst">' + A('أحدث الامتحانات', 'Latest Papers') + '</h2><section class="card list hpl">' + latest.map(function (x) {
      var qs = qsOfExam(x.id), done = qs.filter(function (gid) { return s[gid]; }).length, pct = qs.length ? Math.round(100 * done / qs.length) : 0;
      return '<button class="lrow" data-act="start" data-k="exam" data-i="' + x.id + '"><span class="ib2">' + ic('doc') + '</span><span class="lrow-t"><b>' + esc(x.title) + '</b><small>' + x.n + ' ' + A('سؤال', 'questions') + (done ? ' · ' + pct + '%' : '') + '</small></span>' + ic('chv') + '</button>';
    }).join('') + '</section></div>';
    return '<div class="hmw">' + h + '</div>';
  }
  function miniRing(pct, val, label) {
    var R = 25, C = 2 * Math.PI * R;
    return '<span class="mr"><span class="mr-c"><svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="' + R + '" fill="none" stroke="rgba(150,232,248,.35)" stroke-width="6"/>' +
      (pct > 0 ? '<circle cx="30" cy="30" r="' + R + '" fill="none" stroke="#9af4ff" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="' + (C * (1 - Math.min(100, pct) / 100)) + '" transform="rotate(-90 30 30)"/>' : '') +
      '</svg><b>' + val + '</b></span><small>' + label + '</small></span>';
  }
  function tile(goh, icn, t, s) { var st = goh.indexOf('set/') === 0; return '<button class="tool" ' + (st ? 'data-act="start" data-k="' + goh.slice(4) + '"' : 'data-go="' + goh + '"') + '><span class="ib2">' + ic(icn) + '</span><span class="tool-t"><b>' + esc(t) + '</b><small>' + esc(s) + '</small></span>' + ic('chv', 'ch') + '</button>'; }

  /* ---------- EXAMS LIST ---------- */
  /* Exams on one screen (owner, 28 Nov 2026): the four groups are tabs, each group's papers are compact tiles two to a row with a thin
     progress line; the page is fitted to the phone height like Home (fitHome). The chosen tab is kept (ex-grp). */
  var GRPN = { 'Past papers': ['الدورات السابقة', 'Past papers'], 'Pool': ['البنك', 'Pool'], 'Sheets': ['الشيتات', 'Sheets'], 'Fageery': ['الفقيري', 'Fageery'] };
  function shortTitle(t, g) {
    t = String(t || '').replace(/Perminant|Perminent/gi, 'Permanent').replace(/Permanent(?=\d)/, 'Permanent ').replace(/\s*quizzes\s*$/i, '').trim();
    if (g === 'Past papers' && /^Permanent\s+\S/.test(t) && !/^Permanent Pool/i.test(t)) t = t.replace(/^Permanent\s+/, '');
    t = t.replace(/^(\d{1,2})(dec|may|jan|nov|june|aug)\b/i, function (m, d, mo) { return d + ' ' + mo.charAt(0).toUpperCase() + mo.slice(1).toLowerCase(); }).replace(/(\d)(may|dec)\b/i, '$1 $2');
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function exams() {
    head('Exams', A('اختر امتحانًا للمذاكرة', 'Choose a paper or sheet'), true);
    var s = seen();
    var byg = {}; (E.exams || []).forEach(function (x) { (byg[x.group] = byg[x.group] || []).push(x); });
    var gs = (E.groups || []).filter(function (g) { return byg[g]; }), cur = get2('ex-grp', gs[0]); if (gs.indexOf(cur) < 0) cur = gs[0];
    var h = '<div class="fitw exw"><div class="exg">' + gs.map(function (g) {
      var nm = GRPN[g] ? A(GRPN[g][0], GRPN[g][1]) : g;
      return '<button class="exgt' + (g === cur ? ' on' : '') + '" data-act="exgrp" data-g="' + esc(g) + '"><b>' + esc(nm) + '</b><small>' + byg[g].length + '</small></button>';
    }).join('') + '</div><div class="exl">' + (byg[cur] || []).map(function (x) {
      var qs = qsOfExam(x.id), done = qs.filter(function (gid) { return s[gid]; }).length, pct = qs.length ? Math.round(100 * done / qs.length) : 0;
      return '<button class="ext" data-act="start" data-k="exam" data-i="' + x.id + '" title="' + esc(x.title) + '"><span class="ext-i">' + ic('doc') + '</span><span class="ext-t"><b dir="ltr">' + esc(shortTitle(x.title, cur)) + '</b>' +
        '<small>' + x.n + ' ' + A('سؤال', 'questions') + (done ? ' · ' + pct + '%' : '') + '</small></span><i class="ext-p"><i style="width:' + pct + '%"></i></i></button>';
    }).join('') + '</div></div>';
    return h;
  }
  function qsOfExam(id) { var out = []; E.questions.forEach(function (q) { if (q.x.indexOf(id) >= 0) out.push(q.g); }); return out; }

  /* ---------- SUBJECTS ---------- */
  function subjects() {
    head('By subject', A('اختر مادة', 'Choose a subject'), true);
    var s = seen();
    return '<section class="card list">' + (E.subjects || []).map(function (su) {
      var qs = qsOfSubject(su[0]), done = qs.filter(function (g) { return s[g]; }).length, pct = qs.length ? Math.round(100 * done / qs.length) : 0;
      return '<button class="lrow" data-act="start" data-k="subject" data-i="' + su[0] + '"><span class="ib2">' + ic(SICO[su[0]] || 'layers') + '</span><span class="lrow-t"><b>' + esc(su[1]) + '</b><small>' + su[2] + ' ' + A('سؤال', 'questions') + (done ? ' · ' + pct + '%' : '') + '</small>' + (done ? '<span class="pbln"><i style="width:' + pct + '%"></i></span>' : '') + '</span>' + ic('chv', 'ch') + '</button>';
    }).join('') + '</section>';
  }
  function qsOfSubject(code) { var out = []; E.questions.forEach(function (q) { if (q.s === code) out.push(q.g); }); return out; }

  /* ---------- question levels (owner, 28 Nov 2026: «easy, medium and hard — سهل، متوسط، صعب») ----------
     The bank is encrypted and stays unread outside the phone, so the level is worked out here from the question itself, with the same
     meaning as the levels of the books' cards: 1 easy = direct recall (a definition, a normal value, a drug of choice, a short fact);
     2 medium = understanding or applying a fact, a short case; 3 hard = clinical reasoning on a longer case (diagnosis, next step,
     management), «all EXCEPT / NOT» questions and calculations. A level written in the data (q.d) or in LV_FIX always wins. */
  var LV_FIX = {};   /* g → 1|2|3: corrections by hand */
  var LVN = { 1: ['سهل', 'Easy'], 2: ['متوسط', 'Medium'], 3: ['صعب', 'Hard'] };
  function level(q) {
    if (!q) return 2;
    if (q.d >= 1 && q.d <= 3) return q.d;
    if (LV_FIX[q.g]) return LV_FIX[q.g];
    var t = String(q.q || ''), w = t.split(/\s+/).filter(Boolean).length;
    var opt = (q.o || []).join(' ').split(/\s+/).length / Math.max(1, (q.o || []).length);
    var vignette = /\b\d{1,3}\s*[- ]?(years?|yrs?|y\/o|months?|weeks?|days?)[- ]?old\b|\b(presents?|presented|presenting|complain(s|ed|ing)?|brought|admitted|attended|came)\b|\b(pt|patient|man|woman|boy|girl|child|baby|neonate|infant|lady|gentleman|primigravida|multigravida|G\d+P\d+)\b/i.test(t);
    var reason = /next step|best (initial |next )?(management|treatment|investigation|step)|most appropriate|management|how (to|would you) manage|treatment of choice|investigation of choice|most likely|diagnosis|what (is|would) (the|you)|cause of (his|her|this)/i.test(t);
    var except = /\b(EXCEPT|NOT)\b/.test(t) || /\b(false|incorrect|least likely|is not|are not)\b/i.test(t);
    var calc = /\bcalculat|\bhow many\b|\bwhat is (the|his|her) (dose|rate|ratio)/i.test(t) && /\d/.test(t);
    var recall = /is called|is defined|refers to|stands for|is known as|definition|normal (value|range|level)|drug of choice|which of the following is (a|an|the)\b|the commonest|the most common/i.test(t);
    if (calc || (except && (vignette || w > 20)) || (vignette && reason && w >= 28) || (vignette && w >= 45) || w >= 75) return 3;
    var pic = /\b(shown|picture|image|photo|x-?ray|ecg|ct|mri|film)\b/i.test(t);
    if (!q.img && !pic && !vignette && !except && (recall || w <= 12) && opt <= 6) return 1;
    return 2;
  }
  window.__exLevel = level;
  var LVSEL = 0;

  /* ---------- build a question set ---------- */
  function buildSet(kind, id) {
    var s = seen(), out = [];
    if (kind === 'exam') out = qsOfExam(id);
    else if (kind === 'subject') out = qsOfSubject(id);
    else if (kind === 'marked') out = Object.keys(marks()).map(Number).filter(function (g) { return Q[g]; });
    else if (kind === 'incorrect') out = Object.keys(s).filter(function (g) { return s[g].c === 0 && Q[g]; }).map(Number);
    else if (kind === 'unused') out = E.questions.filter(function (q) { return !s[q.g]; }).map(function (q) { return q.g; });
    else if (kind === 'all') out = E.questions.map(function (q) { return q.g; });
    else if (kind === 'mock') { out = E.questions.map(function (q) { return q.g; }); shuffle(out); out = out.slice(0, 200); }
    return out.filter(function (g) { return Q[g] && !Q[g].b && (!LVSEL || level(Q[g]) === LVSEL); });
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ---------- RUNNER ---------- */
  var T = null; /* current test */
  function setName(kind, id) { return kind === 'all' ? A('كل الأسئلة', 'All questions') : kind === 'mock' ? A('امتحان تجريبي', 'Mock exam') : kind === 'exam' ? (EXM[id] || {}).title : kind === 'subject' ? SUBN[id] : kind === 'marked' ? A('الأسئلة المعلّمة', 'Marked questions') : kind === 'incorrect' ? A('الأخطاء', 'Incorrect questions') : kind === 'unused' ? A('أسئلة لم تُحل', 'Unused questions') : kind; }
  function setCount(kind, id) { return buildSet(kind, id).length; }
  function openStart(kind, id, keep) {
    if (!keep) LVSEL = 0;
    var sel = LVSEL; LVSEL = 0; var all = buildSet(kind, id), cnt = { 1: 0, 2: 0, 3: 0 }; all.forEach(function (g) { cnt[level(Q[g])]++; }); LVSEL = sel;
    var n = setCount(kind, id);
    if (!all.length) { toast(A('لا توجد أسئلة', 'No questions here')); return; }
    var lv = '<div class="lvsel">' + [[0, A('الكل', 'All'), all.length], [1, A(LVN[1][0], LVN[1][1]), cnt[1]], [2, A(LVN[2][0], LVN[2][1]), cnt[2]], [3, A(LVN[3][0], LVN[3][1]), cnt[3]]].map(function (x) {
      return '<button class="lvc lv' + x[0] + (LVSEL === x[0] ? ' on' : '') + '" data-act="lvsel" data-lv="' + x[0] + '" data-k="' + kind + '" data-i="' + (id || '') + '"' + (x[0] && !x[2] ? ' disabled' : '') + '><b>' + x[1] + '</b><small>' + x[2] + '</small></button>';
    }).join('') + '</div>';
    sheet('<h2 class="ch2">' + ic('play') + esc(setName(kind, id)) + '</h2><p style="color:var(--mut);margin:0 0 10px">' + n + ' ' + A('سؤال · اختر المستوى ثم نمط المذاكرة', 'questions · choose a level, then a mode') + '</p>' + lv +
      '<button class="alt" data-start="tutor" data-k="' + kind + '" data-i="' + (id || '') + '"><span class="ib2">' + ic('book') + '</span><span class="lrow-t"><b>' + A('نمط التعلّم', 'Tutor') + '</b><small>' + A('تظهر الإجابة والشرح بعد كل سؤال', 'See the answer and explanation after each question') + '</small></span></button>' +
      '<button class="alt" data-start="timed" data-k="' + kind + '" data-i="' + (id || '') + '"><span class="ib2">' + ic('timer') + '</span><span class="lrow-t"><b>' + A('نمط الامتحان', 'Timed') + '</b><small>' + A('دقيقة لكل سؤال، النتيجة في النهاية', 'One minute per question, result at the end') + '</small></span></button>');
  }
  function tick() {
    if (!T || !T.timed) return;
    var rem = Math.max(0, T.endAt - Date.now()), el = document.getElementById('tmr');
    if (el) el.innerHTML = ic('timer') + fmt(rem);
    if (rem <= 0) { clearInterval(T.timer); ACT.finish(); }
  }
  function fmt(ms) { var s = Math.round(ms / 1000), m = Math.floor(s / 60); return m + ':' + ('0' + (s % 60)).slice(-2); }
  function startTest(kind, id, opt) {
    opt = opt || {};
    var set = buildSet(kind, id);
    if (kind !== 'mock' && opt.shuffle !== false) { /* keep exam order by default */ }
    if (!set.length) { toast(A('لا توجد أسئلة', 'No questions')); return; }
    var tutor = opt.tutor !== false;
    T = { kind: kind, id: id, list: set, i: 0, answers: {}, pick: {}, tutor: tutor, timed: !tutor, started: Date.now(), lv: LVSEL }; LVSEL = 0;
    if (T.timed) { T.endAt = Date.now() + set.length * 60000; T.timer = setInterval(tick, 1000); }
    location.hash = 'q';
  }
  function runner() {
    if (!T) { go('home'); return; }
    var g = T.list[T.i], q = Q[g], a = T.answers[g];
    $('#hb').innerHTML = '';
    $('#ph').innerHTML = '';
    document.body.classList.add('running');
    var tt = T.kind === 'mock' ? A('امتحان تجريبي', 'Mock exam') : T.kind === 'exam' ? (EXM[T.id] || {}).title : T.kind === 'subject' ? SUBN[T.id] : T.kind === 'marked' ? A('المعلّمة', 'Marked') : A('الأخطاء', 'Incorrect');
    var reveal = T.tutor && a != null, pk = T.tutor ? T.pick[g] : a, H = hlOf(g), HL = hlOn();
    var h = '<div class="qtop"><button class="sqb sm" data-act="quit">' + ic('back') + '</button><span class="pbln" style="margin:0"><i style="width:' + Math.round(100 * (T.i + 1) / T.list.length) + '%"></i></span><b style="font-size:.85em;white-space:nowrap">' + (T.i + 1) + '/' + T.list.length + '</b><button class="sqb sm hlbtn' + (HL ? ' on' : '') + '" data-act="hlmode" aria-label="' + A('قلم التظليل', 'Highlighter') + '" aria-pressed="' + HL + '">' + ic('marker') + '</button>' + (T.timed ? '<span class="pill" id="tmr">' + ic('timer') + fmt(Math.max(0, T.endAt - Date.now())) + '</span>' : '') + '</div>';
    var qlv = level(q);
    h += '<div class="qmeta"><span class="pill">' + esc(tt) + '</span><span class="pill">' + ic(SICO[q.s] || 'layers') + esc(SUBN[q.s] || q.s) + '</span><span class="pill lvp lv' + qlv + '">' + A(LVN[qlv][0], LVN[qlv][1]) + '</span>' + (q.x && q.x.length > 1 ? '<span class="pill" title="appears in several papers">' + ic('layers') + A('مكرر', 'repeat') + '</span>' : '') + '</div>';
    h += '<div class="qcard"><span class="qnum">' + A('سؤال', 'Question') + ' ' + (T.i + 1) + '</span><p class="qtext hla' + (HL ? ' hlon' : '') + '" data-hk="q">' + markText(q.q, H.q) + '</p>';
    if (q.img) h += '<img class="qimg" src="' + esc(q.img) + '" alt="">';
    h += '<div class="opts">';
    q.o.forEach(function (op, k) {
      var cls = '';
      if (reveal) { if (k === q.a) cls = ' right'; else if (k === a) cls = ' wrong'; }
      else if (pk === k) cls = ' sel';
      h += '<button class="opt' + cls + '" data-opt="' + k + '"' + (reveal ? ' disabled' : '') + '><span class="k">' + String.fromCharCode(65 + k) + '</span><span class="ot">' + esc(op) + '</span>' + (reveal && (k === q.a || k === a) ? '<span class="m">' + ic(k === q.a ? 'check' : 'cross') + '</span>' : '') + '</button>';
    });
    h += '</div>';
    if (reveal) h += '<div class="exp"><b>' + ic('info') + ' ' + (a === q.a ? A('صحيح', 'Correct') : A('الإجابة الصحيحة: ', 'Correct answer: ') + String.fromCharCode(65 + q.a)) + '</b><p class="hla' + (HL ? ' hlon' : '') + '" data-hk="e">' + (q.e ? markText(q.e, H.e) : esc(A('لا يوجد شرح.', 'No explanation.'))) + '</p></div>';
    h += '</div>';
    $('#v').innerHTML = h;
    $('#bn').innerHTML = '';
    bottomBar(g, a, pk);
  }
  function bottomBar(g, a, pk) {
    var last = T.i >= T.list.length - 1, answered = a != null, needSubmit = T.tutor && !answered;
    var bar = document.getElementById('rbar'); if (bar) bar.remove();
    bar = document.createElement('div'); bar.id = 'rbar'; bar.className = 'rbar';
    bar.innerHTML = '<button class="rbtn icon markbtn ' + (markOn(g) ? 'on' : '') + '" data-act="mark">' + ic('mark') + '</button>' +
      '<button class="rbtn' + (needSubmit ? ' icon' : '') + '" data-act="prev"' + (T.i === 0 ? ' disabled' : '') + ' aria-label="' + A('السابق', 'Previous') + '">' + ic('back') + '</button>' +
      (needSubmit
        ? '<button class="rbtn pri submitb" data-act="submit"' + (pk == null ? ' disabled' : '') + '>' + ic('check') + A('تأكيد الإجابة', 'Submit answer') + '</button>' +
          (last ? '<button class="rbtn icon" data-act="finish" aria-label="' + A('إنهاء', 'Finish') + '">' + ic('flag') + '</button>' : '<button class="rbtn icon" data-act="next" aria-label="' + A('التالي', 'Next') + '">' + ic('fwd') + '</button>')
        : last ? '<button class="rbtn pri" data-act="finish">' + A('إنهاء', 'Finish') + ic('check') + '</button>'
            : '<button class="rbtn pri" data-act="next">' + A('التالي', 'Next') + ic('fwd') + '</button>');
    document.body.appendChild(bar);
  }
  function choose(k) {
    var g = T.list[T.i], q = Q[g];
    if (T.tutor) { if (T.answers[g] != null) return; T.pick[g] = k; }   /* only selects; Submit reveals */
    else { T.answers[g] = k; }
    runner();
  }
  function submit() {
    var g = T.list[T.i], q = Q[g], k = T.pick[g];
    if (k == null || T.answers[g] != null) return;
    T.answers[g] = k; record(g, k, k === q.a);
    runner();
  }

  /* ---- highlighter: offsets in the plain text of the question (q) and the explanation (e), per question ---- */
  function hlOn() { return !!get('hlon', false); }
  function hlOf(g) { var all = get('hl', {}), h = all[g] || {}; return { q: h.q || [], e: h.e || [] }; }
  function hlSave(g, k, list) { var all = get('hl', {}); all[g] = all[g] || {}; all[g][k] = list; if (!list.length) delete all[g][k]; if (!all[g].q && !all[g].e) delete all[g]; put('hl', all); }
  function hlMerge(list) {
    list = list.filter(function (r) { return r[1] > r[0]; }).sort(function (a, b) { return a[0] - b[0]; });
    var out = [];
    list.forEach(function (r) { var l = out[out.length - 1]; if (l && r[0] <= l[1]) l[1] = Math.max(l[1], r[1]); else out.push([r[0], r[1]]); });
    return out;
  }
  function markText(t, list) {
    t = String(t == null ? '' : t); var h = '', at = 0;
    hlMerge(list || []).forEach(function (r) { var a = Math.max(at, Math.min(r[0], t.length)), b = Math.min(r[1], t.length); if (b <= a) return;
      h += esc(t.slice(at, a)) + '<mark class="hl" data-a="' + a + '" data-b="' + b + '">' + esc(t.slice(a, b)) + '</mark>'; at = b; });
    return h + esc(t.slice(at));
  }
  function hlTake() {
    if (!T || !hlOn()) return false;
    var sel = window.getSelection(); if (!sel || sel.isCollapsed || !sel.rangeCount) return false;
    var r = sel.getRangeAt(0), box = (r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer : r.commonAncestorContainer.parentNode).closest('.hla');
    if (!box) return false;
    var pre = document.createRange(); pre.selectNodeContents(box); pre.setEnd(r.startContainer, r.startOffset);
    var a = pre.toString().length, b = a + r.toString().length;
    var txt = box.textContent; while (a < b && /\s/.test(txt[a])) a++; while (b > a && /\s/.test(txt[b - 1])) b--;
    if (b <= a) return false;
    var g = T.list[T.i], k = box.dataset.hk, H = hlOf(g), q = Q[g], list = hlMerge(H[k].concat([[a, b]]));
    hlSave(g, k, list); sel.removeAllRanges();
    box.innerHTML = markText(k === 'q' ? q.q : q.e, list);
    return true;
  }
  var hlT = 0;
  document.addEventListener('selectionchange', function () { clearTimeout(hlT); if (T && hlOn()) hlT = setTimeout(hlTake, 650); });
  ['mouseup', 'touchend'].forEach(function (ev) { document.addEventListener(ev, function () { if (T && hlOn()) setTimeout(function () { clearTimeout(hlT); hlTake(); }, 30); }); });
  document.addEventListener('click', function (e) {   /* tap a highlight (highlighter on) to remove it */
    var m = e.target.closest && e.target.closest('mark.hl'); if (!m || !T || !hlOn()) return;
    var sel = window.getSelection(); if (sel && !sel.isCollapsed) return;
    var box = m.closest('.hla'), g = T.list[T.i], k = box.dataset.hk, q = Q[g], a = +m.dataset.a, b = +m.dataset.b;
    var list = hlOf(g)[k].filter(function (r) { return r[1] <= a || r[0] >= b; });
    hlSave(g, k, list); box.innerHTML = markText(k === 'q' ? q.q : q.e, list);
  });

  function finish() {
    if (T.timer) clearInterval(T.timer);
    if (T.timed) T.list.forEach(function (g) { var a = T.answers[g]; if (a != null) record(g, a, a === Q[g].a); });
    var total = T.list.length, ans = 0, cor = 0, bysub = {};
    T.list.forEach(function (g) { var a = T.answers[g]; if (a != null) { ans++; var c = a === Q[g].a; if (c) cor++; var s = Q[g].s; bysub[s] = bysub[s] || [0, 0]; bysub[s][0]++; if (c) bysub[s][1]++; } });
    var pct = ans ? Math.round(100 * cor / ans) : 0;
    var tests = get('tests', []); tests.unshift({ kind: T.kind, id: T.id, n: total, ans: ans, cor: cor, pct: pct, t: Date.now() }); put('tests', tests.slice(0, 50));
    bumpStreak();
    T = null; location.hash = 'result/' + pct + '/' + cor + '/' + ans + '/' + total;
    window.__lastSub = bysub;
  }
  function result() {
    var r = route(); var pct = +r[1], cor = +r[2], ans = +r[3], total = +r[4];
    head('Result', '', true);
    var h = '<div class="result">' + ring(pct, 120).replace('.25', '.12').replace('#fff', 'var(--p)').replace('#fff', 'var(--acc)') +
      '<div class="rscore" style="color:var(--p)">' + pct + '%</div><p class="rsub">' + A('إجابات صحيحة', 'correct') + ' ' + cor + '/' + ans + '</p>' +
      '<div class="rgrid"><div class="rtile"><b>' + cor + '</b><small>' + A('صحيح', 'Correct') + '</small></div><div class="rtile"><b>' + (ans - cor) + '</b><small>' + A('خطأ', 'Wrong') + '</small></div><div class="rtile"><b>' + (total - ans) + '</b><small>' + A('متروك', 'Skipped') + '</small></div></div>';
    var bs = window.__lastSub || {};
    if (Object.keys(bs).length) {
      h += '<h2 class="st">' + A('حسب المادة', 'By subject') + '</h2><section class="card list">' + Object.keys(bs).map(function (s) {
        var p = Math.round(100 * bs[s][1] / bs[s][0]);
        return '<div class="lrow"><span class="lrow-t"><b>' + esc(SUBN[s] || s) + '</b><span class="pbln"><i style="width:' + p + '%;background:' + (p >= 60 ? 'var(--ok)' : 'var(--red)') + '"></i></span></span><span class="cnt">' + bs[s][1] + '/' + bs[s][0] + '</span></div>';
      }).join('') + '</section>';
    }
    h += '</div><div style="display:flex;gap:10px;margin-top:16px"><button class="btn wide pri" data-go="home">' + A('الرئيسية', 'Home') + '</button><button class="btn wide" data-act="mock">' + A('امتحان آخر', 'Another') + '</button></div>';
    return h;
  }

  /* ---- streak ---- */
  function bumpStreak() {
    var today = new Date().toDateString(), st = get('streak', { d: '', n: 0 });
    if (st.d === today) return;
    var y = new Date(Date.now() - 864e5).toDateString();
    st.n = st.d === y ? st.n + 1 : 1; st.d = today; put('streak', st);
  }

  /* ---------- PROGRESS ---------- */
  /* Progress on one screen (owner, 28 Nov 2026): summary card (accuracy circle + Answered · Correct · Wrong · Day streak), six subject tiles two
     to a row, and one card switching between Weak areas and Previous tests (top 3 each, `ex-prtab`); fitted to the phone like Home. */
  function progress() {
    head('Progress', A('تقييم أدائك', 'Your performance'), true);
    var s = seen(), st = stats(), streak = get('streak', { n: 0 }), N = function (x) { return (+x || 0).toLocaleString(AR() ? 'ar-EG' : 'en'); };
    var h = '<div class="fitw prw"><div class="hgp"><section class="prs">' + miniRing(st.pct, st.pct + '%', A('الدقة', 'Accuracy')) +
      '<div class="prs-g">' + [[N(st.answered), A('مُجاب', 'Answered'), ''], [N(st.correct), A('صحيح', 'Correct'), 'ok'], [N(st.answered - st.correct), A('خطأ', 'Wrong'), 'bad'], [N(streak.n), A('يوم متتالٍ', 'Day streak'), '']].map(function (x) {
        return '<span class="prs-t ' + x[2] + '"><b>' + x[0] + '</b><small>' + x[1] + '</small></span>'; }).join('') + '</div>' +
      '<p class="prs-n">' + A(N(st.unused) + ' سؤالًا لم تُجب عنها بعد من ' + N(ntotal()), N(st.unused) + ' of ' + N(ntotal()) + ' questions not tried yet') + '</p></section></div>';
    var subj = (E.subjects || []).map(function (su) { var qs = qsOfSubject(su[0]), a = 0, c = 0; qs.forEach(function (g) { if (s[g]) { a++; if (s[g].c) c++; } }); return { id: su[0], n: su[1], a: a, c: c, p: a ? Math.round(100 * c / a) : 0 }; });
    h += '<div class="hgp"><h2 class="st hst">' + A('الأداء حسب المادة', 'Performance by Subject') + '</h2><div class="prsub">' + subj.map(function (x) {
      var col = !x.a ? '' : x.p >= 75 ? ' good' : x.p >= 60 ? ' mid' : ' low';
      return '<button class="prt' + col + '" data-act="start" data-k="subject" data-i="' + esc(x.id) + '"><span class="ext-i">' + ic(SICO[x.id] || 'layers') + '</span><span class="prt-t"><b dir="auto">' + esc(x.n) + '</b>' +
        '<small>' + (x.a ? x.p + '% · ' + x.c + '/' + x.a : A('لم تبدأ', 'Not started')) + '</small><i class="prt-b"><i style="width:' + (x.a ? x.p : 0) + '%"></i></i></span></button>';
    }).join('') + '</div></div>';
    var weak = subj.filter(function (x) { return x.a >= 3 && x.p < 60; }).sort(function (a, b) { return a.p - b.p; });
    var tests = get('tests', []), tab = get2('ex-prtab', 'weak');
    /* a subject is weak once 3 or more of its questions are answered and under 60 % of them are right; a tap practises that subject */
    var body = tab === 'tests' ? (tests.length ? tests.slice(0, 3).map(function (t) {
        var name = t.kind === 'mock' ? A('امتحان تجريبي', 'Mock exam') : t.kind === 'exam' ? shortTitle((EXM[t.id] || {}).title || '', '') : t.kind === 'subject' ? SUBN[t.id] : t.kind === 'all' ? A('كل الأسئلة', 'All questions') : t.kind;
        return '<div class="prr"><span class="ext-i">' + ic('chart') + '</span><span class="prr-t"><b dir="auto">' + esc(name || t.kind) + '</b><small>' + new Date(t.t).toLocaleDateString(A('ar-EG', 'en-GB'), { day: 'numeric', month: 'short' }) + ' · ' + t.ans + '/' + t.n + '</small></span><span class="prr-p ' + (t.pct >= 60 ? 'ok' : 'bad') + '">' + t.pct + '%</span></div>';
      }).join('') : '<p class="prx">' + A('لم تُنهِ أي اختبار بعد.', 'You have not finished a test yet.') + '</p>')
      : (weak.length ? weak.slice(0, 3).map(function (w) {
        return '<button class="prr" data-act="start" data-k="subject" data-i="' + esc(w.id) + '"><span class="ext-i wk">' + ic('target') + '</span><span class="prr-t"><b>' + esc(w.n) + '</b><small>' + A(w.p + '% صحيح من ' + w.a + ' · اضغط للتدرّب', w.p + '% correct of ' + w.a + ' · tap to practise') + '</small></span>' + ic('chv') + '</button>';
      }).join('') : '<p class="prx">' + A('تظهر المادة هنا عندما تجيب 3 أسئلة أو أكثر منها وتكون إجاباتك الصحيحة أقل من 60%.', 'A subject shows here once you have answered 3 or more of its questions and under 60% of them are right.') + '</p>');
    h += '<div class="hgp"><section class="prc"><div class="prtabs"><button class="' + (tab !== 'tests' ? 'on' : '') + '" data-act="prtab" data-t="weak">' + A('نقاط الضعف', 'Weak areas') + (weak.length ? ' <i>' + weak.length + '</i>' : '') + '</button>' +
      '<button class="' + (tab === 'tests' ? 'on' : '') + '" data-act="prtab" data-t="tests">' + A('اختباراتك السابقة', 'Previous tests') + (tests.length ? ' <i>' + tests.length + '</i>' : '') + '</button></div><div class="prbody">' + body + '</div></section></div></div>';
    return h;
  }

  /* ---------- MORE ---------- */
  /* More on one screen (owner, 28 Nov 2026): six study tiles two to a row (they take the spare height) and a compact account card */
  function more() {
    head('More', A('كل ما في التطبيق', 'Everything in the app'), true);
    var st = stats(), N = function (x) { return (+x || 0).toLocaleString(AR() ? 'ar-EG' : 'en'); };
    var tiles = [['data-act="mock"', 'play', A('امتحان تجريبي', 'Mock exam'), A('200 سؤال بوقت', '200 timed')],
      ['data-go="exams"', 'list', A('كل الامتحانات', 'All exams'), N((E.exams || []).length) + ' ' + A('امتحان', 'papers')],
      ['data-go="subjects"', 'layers', A('المواد', 'Subjects'), N(nsub()) + ' ' + A('مواد', 'subjects')],
      ['data-act="start" data-k="unused"', 'book', A('لم تُحل', 'Unused'), N(st.unused) + ' ' + A('سؤال', 'questions')],
      ['data-act="start" data-k="incorrect"', 'cross', A('الأخطاء', 'Incorrect'), N(st.answered - st.correct) + ' ' + A('سؤال', 'questions')],
      ['data-act="start" data-k="marked"', 'mark', A('المعلّمة', 'Marked'), N(st.marked) + ' ' + A('سؤال', 'questions')]];
    var rows = [['profile', 'user', A('ملفي الشخصي', 'My profile')], ['notes', 'bell', A('الإشعارات', 'Notifications')],
      ['settings', 'palette', A('المظهر واللغة', 'Appearance & language')], [LOCKED ? 'subscribe' : 'profile', 'crown', LOCKED ? A('الاشتراك', 'Subscribe') : A('اشتراكي', 'My subscription')]];
    return '<div class="fitw mrw"><div class="hgp mrt"><h2 class="st hst">' + A('المذاكرة', 'Study') + '</h2><div class="mrg">' + tiles.map(function (t) {
        return '<button class="mrb" ' + t[0] + '><span class="ext-i">' + ic(t[1]) + '</span><span class="mrb-t"><b>' + t[2] + '</b><small>' + t[3] + '</small></span></button>'; }).join('') + '</div></div>' +
      '<div class="hgp"><h2 class="st hst">' + A('حسابي والتطبيق', 'Account & App') + '</h2><section class="prc mrl">' + rows.map(function (r) {
        return '<button class="prr" data-act="' + r[0] + '"><span class="ext-i">' + ic(r[1]) + '</span><span class="prr-t"><b>' + r[2] + '</b></span>' + ic('chv') + '</button>'; }).join('') + '</section></div></div>';
  }
  function mrow(goh, icn, t, c, act) {
    var st = goh.indexOf('set/') === 0; var attr = act === 1 ? 'data-act="mock"' : act === 2 ? 'data-act="settings"' : st ? 'data-act="start" data-k="' + goh.slice(4) + '"' : 'data-go="' + goh + '"';
    return '<button class="lrow" ' + attr + '><span class="ib2">' + ic(icn) + '</span><span class="lrow-t"><b>' + esc(t) + '</b></span>' + (c ? '<span class="cnt">' + c + '</span>' : '') + ic('chv', 'ch') + '</button>';
  }

  /* ---------- sheets ---------- */
  function sheet(html) { var s = $('#sheet'); s.innerHTML = '<div class="sh-bg" data-act="shclose"></div><div class="sh-box"><i class="sh-grip"></i>' + html + '</div>'; s.hidden = false; }
  function closeSheet() { $('#sheet').hidden = true; }
  function toast(m) { var t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast._); toast._ = setTimeout(function () { t.hidden = true; }, Math.max(1800, String(m).length * 45)); }

  var PALS = [['navy', 'Default', '#1269b0'], ['blue', 'Green', '#0d6b5c'], ['ocean', 'Ocean', '#1768b3'], ['teal', 'Teal', '#0b6870'], ['purple', 'Purple', '#5a3d8f'], ['maroon', 'Maroon', '#7d2843'], ['graphite', 'Graphite', '#3a4450']];
  function settings() {
    var pal = document.documentElement.dataset.pal, fs = document.documentElement.dataset.fs;
    var thm = get2('ish-theme', 'light');
    sheet('<h2 class="ch2">' + ic('palette') + A('المظهر والألوان', 'Appearance & colour') + '</h2>' +
      '<p style="color:var(--mut);font-size:.85em;margin:0 0 8px">' + A('المظهر', 'Look') + '</p><div style="display:flex;gap:8px;margin-bottom:14px">' +
      [['light', A('نهار', 'Day'), 'sun'], ['dark', A('ليل', 'Night'), 'moon'], ['eye', A('راحة العين', 'Eye comfort'), 'eye']].map(function (x) { return '<button class="btn wide ' + (thm === x[0] ? 'pri' : '') + '" data-thm="' + x[0] + '">' + ic(x[2]) + x[1] + '</button>'; }).join('') + '</div>' +
      '<p style="color:var(--mut);font-size:.85em;margin:0 0 8px">' + A('لون التطبيق', 'App colour') + '</p><div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px">' +
      PALS.map(function (p) { return '<button data-pal="' + p[0] + '" aria-label="' + p[1] + '" style="width:40px;height:40px;border-radius:50%;background:' + p[2] + ';border:3px solid ' + (pal === p[0] ? 'var(--acc)' : 'transparent') + '"></button>'; }).join('') + '</div>' +
      '<p style="color:var(--mut);font-size:.85em;margin:0 0 8px">' + A('حجم الخط', 'Text size') + '</p><div style="display:flex;gap:8px;margin-bottom:14px">' +
      [['s', A('صغير', 'Small')], ['n', A('عادي', 'Normal')], ['l', A('كبير', 'Large')]].map(function (x) { return '<button class="btn wide ' + (fs === x[0] ? 'pri' : '') + '" data-fs="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<p style="color:var(--mut);font-size:.85em;margin:0 0 8px">' + A('اللغة (العناوين بالإنجليزية دائمًا)', 'Language (titles stay English)') + '</p><div style="display:flex;gap:8px;margin-bottom:6px">' +
      [['ar', 'العربية'], ['en', 'English']].map(function (x) { return '<button class="btn wide ' + (document.documentElement.lang === x[0] ? 'pri' : '') + '" data-lang="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>');
  }

  /* ---------- actions ---------- */
  var ACT = {
    menu: function () { go('more'); }, settings: settings, theme: cycleTheme, shclose: closeSheet,
    prtab: function (el) { try { localStorage.setItem('ex-prtab', JSON.stringify(el.dataset.t)); } catch (e) {} render(); },
    exgrp: function (el) { try { localStorage.setItem('ex-grp', JSON.stringify(el.dataset.g)); } catch (e) {} render(); },
    lvstart: function (el) { LVSEL = +el.dataset.lv || 0; openStart('all', '', true); },
    lvsel: function (el) { LVSEL = +el.dataset.lv || 0; openStart(el.dataset.k, el.dataset.i || '', true); },
    profile: function () { profileSheet(); }, notes: function () { notesSheet(); toParent({ exam: 'notes' }); },
    sndtog: function () { try { localStorage.setItem('ex-snd-off', JSON.stringify(soundOn() ? 1 : 0)); } catch (e) {} if (soundOn()) chime(); notesSheet(); },
    nopen: function (el) { closeSheet(); if (el.dataset.l) toParent({ exam: 'go', link: el.dataset.l }); },
    signin: function () { closeSheet(); toParent({ exam: 'login' }); }, goprog: function () { closeSheet(); go('progress'); },
    back: function () { if (history.length > 1) history.back(); else go('home'); },
    mock: function () { openStart('mock', ''); },
    start: function (el) { openStart(el.dataset.k, el.dataset.i || ''); },
    quit: function () { if (confirm(A('إنهاء هذا الاختبار؟', 'Quit this test?'))) { if (T && T.timer) clearInterval(T.timer); T = null; var b = document.getElementById('rbar'); if (b) b.remove(); go('home'); } },
    prev: function () { if (T.i > 0) { T.i--; runner(); } },
    next: function () { if (T.i < T.list.length - 1) { T.i++; runner(); } },
    finish: function () { var b = document.getElementById('rbar'); if (b) b.remove(); finish(); },
    submit: function () { submit(); },
    hlmode: function () { var on = !hlOn(); put('hlon', on); runner(); toast(on ? A('التظليل مفعّل: حدّد نصًا لتظليله، والمس التظليل لإزالته', 'Highlighter on: select text to highlight it; tap a highlight to remove it') : A('أُوقف التظليل', 'Highlighter off')); },
    mark: function () { var g = T.list[T.i]; toggleMark(g); $$('.markbtn').forEach(function (x) { x.classList.toggle('on', markOn(g)); }); },
    subscribe: function () { try { (window.parent && window.parent !== window ? window.parent : window.top).postMessage({ exam: 'buy' }, '*'); } catch (e) {} if (!(window.parent && window.parent !== window)) toast(A('الاشتراك من داخل منصة SMRA', 'Subscribe from inside the SMRA platform')); },
    recheck: function () {
      RECHK = true; askParent(); toast(A('جارٍ التحقق…', 'Checking…'));
      clearTimeout(RECHK_T); RECHK_T = setTimeout(function () { if (RECHK) { RECHK = false; toast(A('تعذّر التحقق الآن. تأكد من الاتصال بالإنترنت ثم حاول مرة أخرى.', 'Could not check now. Check your internet connection and try again.')); } }, 10000);
    }
  };
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-go],[data-act],[data-opt],[data-pal],[data-fs],[data-lang],[data-start],[data-thm]');
    if (!el || el === document.documentElement || el === document.body) return;
    if (el.dataset.go != null) { go(el.dataset.go); return; }
    if (el.dataset.opt != null) { choose(+el.dataset.opt); return; }
    if (el.dataset.thm) { try { localStorage.setItem('ish-theme', JSON.stringify(el.dataset.thm)); } catch (x) {} document.documentElement.dataset.theme = el.dataset.thm; settings(); render(); return; }
    if (el.dataset.pal) { try { localStorage.setItem('ex-pal', JSON.stringify(el.dataset.pal)); } catch (x) {} document.documentElement.dataset.pal = el.dataset.pal; settings(); return; }
    if (el.dataset.fs) { try { localStorage.setItem('ex-fs', JSON.stringify(el.dataset.fs)); } catch (x) {} document.documentElement.dataset.fs = el.dataset.fs; settings(); return; }
    if (el.dataset.lang) { try { localStorage.setItem('ish-lang', JSON.stringify(el.dataset.lang)); } catch (x) {} document.documentElement.lang = el.dataset.lang; closeSheet(); render(); return; }
    if (el.dataset.start) { var sk = el.dataset.k, si = el.dataset.i; closeSheet(); startTest(sk, si, { tutor: el.dataset.start === 'tutor' }); return; }
    if (el.dataset.act && ACT[el.dataset.act]) ACT[el.dataset.act](el);
  });

  /* ---------- render ---------- */
  function render() {
    var r = route(), n = r[0] || 'home';
    if (!E.questions.length) { head('SMRA Permanent Exam', '', false); $('#v').innerHTML = lockedScreen(); document.body.classList.remove('running'); return; }
    if (n === 'q') { runner(); return; }
    var h;
    if (n === 'home' || n === '') h = home();
    else if (n === 'exams') h = exams();
    else if (n === 'subjects') h = subjects();
    else if (n === 'progress') h = progress();
    else if (n === 'more') h = more();
    else if (n === 'result') { h = result(); }
    else if (n === 'run') { $('#v').innerHTML = home(); openStart(r[1], r[2]); return; }
    else if (n === 'set') { $('#v').innerHTML = home(); openStart(r[1], ''); return; }
    else { h = home(); }
    if (LOCKED && n !== 'result') h = subBanner() + h;
    $('#v').innerHTML = h;
    document.body.classList.remove('running');
    document.body.classList.toggle('hmpage', !!$('#v .hmw, #v .fitw') && !LOCKED);
    scrollTo(0, 0);
    fitHome();
  }
  /* owner, 28 Nov 2026 (his picture): Home on one screen, no scrolling. The free height is measured; the blocks share it (space-between),
     and on a short screen the scale unit (--hk) is lowered down to 82 % before the page is allowed to scroll. */
  function fitHome() {
    var w = $('#v .hmw, #v .fitw'); document.documentElement.style.removeProperty('--hk');
    if (!w || LOCKED) return;
    var hb = $('#hb').getBoundingClientRect().height, bn = $('#bn').getBoundingClientRect().height, ph = $('#ph').getBoundingClientRect().height;
    var avail = innerHeight - hb - ph - bn - 22;
    w.style.minHeight = '0px';
    var need = w.scrollHeight;
    if (need > avail) { var k = Math.max(0.82, avail / need); document.documentElement.style.setProperty('--hk', k.toFixed(3)); need = w.scrollHeight; }
    w.style.minHeight = Math.max(need, avail) + 'px';
  }
  var FT = 0; addEventListener('resize', function () { clearTimeout(FT); FT = setTimeout(fitHome, 120); });

  /* ---------- paid access ---------- */
  function subBanner() {
    return '<div class="prev-card"><img class="prev-img" src="img/steth.webp" alt="" width="96" height="87" decoding="async">' +
      '<div class="prev-h"><span class="prev-crown"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="#fff"><path d="M2.6 7.6 7.6 11.4 12 4.6l4.4 6.8 5-3.8-1.9 9.6H4.5z"/><rect x="4.6" y="18.6" width="14.8" height="2.4" rx="1.1"/></svg></span><b>' + A('النسخة التجريبية المجانية', 'Free Preview') + '</b></div>' +
      '<p>' + A('جرّب ' + E.questions.length + ' سؤالًا. اشترك لفتح ' + ntotal().toLocaleString('ar-EG') + ' سؤالًا مع الشرح والامتحان التجريبي وتقييم التقدم.',
        'Try ' + E.questions.length + ' questions. Subscribe to unlock ' + ntotal().toLocaleString('en') + ' questions, explanations, mock exam and progress.') + '</p>' +
      (PRICE ? '<p class="sb-from"><b>' + A('الاشتراك من ' + money(PRICE) + ' شهريًا', 'Plans from ' + money(PRICE) + ' a month') + '</b> · ' + A('3 أشهر · سنة · مدى الحياة', '3 months · 1 year · lifetime') + '</p>' : '') +
      (PENDING ? '<span class="sb-pend">' + ic('timer') + A('إيصالك قيد المراجعة…', 'Your receipt is under review…') + '</span>'
        : '<div class="sb-acts"><button class="btn pri" data-act="subscribe"><svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"><path d="M13 2.5 4.5 13.5h6.5L10 21.5l8.5-11H12z"/></svg>' + A('اشترك', 'Subscribe') + '</button>' +
          '<button class="btn gh" data-act="recheck">' + A('التحقق من الاشتراك', 'Check subscription') + '</button></div>') + '</div>';
  }
  function lockedScreen() {
    return '<section class="hero" style="margin-top:20px"><small>SMRA</small><h2>' + A('امتحان البرمننت', 'Permanent Exam') + '</h2><i class="hero-bar"></i>' +
      (PENDING ? '<p>' + A('إيصالك قيد المراجعة. سيُفتح البنك بعد التأكيد.', 'Your receipt is under review. The bank opens once it is confirmed.') + '</p>' +
          '<button class="btn gh wide" data-act="recheck" style="margin-top:12px">' + A('تحقّق الآن', 'Check now') + '</button>'
        : '<p>' + A('بنك أسئلة الامتحان الدائم — 4٬206 سؤالًا مع الشرح، امتحان تجريبي وتقييم التقدم.', 'The Permanent Exam bank — 4,206 questions with explanations, a mock exam and progress assessment.') + '</p>' +
          '<button class="btn pri wide" data-act="subscribe" style="margin-top:12px">' + ic('bolt') + A('اشترك الآن', 'Subscribe now') + (PRICE ? ' · ' + A('من ', 'from ') + money(PRICE) : '') + '</button>' +
          '<button class="btn gh wide" data-act="recheck" style="margin-top:8px">' + A('لقد اشتركت — تحقّق', 'I subscribed — check') + '</button>') + '</section>';
  }
  /* ---------- profile, notifications (owner, 28 Nov 2026) ---------- */
  var ME = null, NOTES = null;
  function avatar() {
    if (ME && ME.photo) return '<img src="' + esc(ME.photo) + '" alt="">';
    var n = ME && ME.name ? ME.name.trim().split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase() : '';
    return n ? '<b>' + esc(n) + '</b>' : ic('user');
  }
  function seenAt() { return get2('ex-nseen', ''); }
  function unread() { var s = seenAt(); return (NOTES || []).filter(function (n) { return String(n.at) > s; }).length; }
  function soundOn() { return !get2('ex-snd-off', 0); }
  var AC = null;
  document.addEventListener('pointerdown', function () { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) {} }, { passive: true });
  function chime() {
    if (!soundOn() || !AC) return;
    try { var t = AC.currentTime; [784, 1047, 1319].forEach(function (f, i) { var o = AC.createOscillator(), g = AC.createGain(), s = t + i * 0.14; o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.25, s + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.4); o.connect(g); g.connect(AC.destination); o.start(s); o.stop(s + 0.45); });
      if (navigator.vibrate) navigator.vibrate(60); } catch (e) {}
  }
  function gotNotes(list) {
    var first = NOTES === null, known = {}; (NOTES || []).forEach(function (n) { known[n.id] = 1; });
    var fresh = first ? [] : list.filter(function (n) { return !known[n.id] && String(n.at) > seenAt(); });
    NOTES = list;
    if (fresh.length) { chime(); toast('🔔 ' + fresh[0].t + (fresh.length > 1 ? ' (+' + (fresh.length - 1) + ')' : '')); }
    var b = document.querySelector('.bellb'); if (b) { var c = unread(), i = b.querySelector('.bdg'); if (c) { if (!i) { i = document.createElement('i'); i.className = 'bdg'; b.appendChild(i); } i.textContent = Math.min(c, 9); } else if (i) i.remove(); }
    if (document.querySelector('#sheet:not([hidden]) .nlist')) notesSheet();
  }
  function ago(at) {
    var m = Math.max(1, Math.round((Date.now() - new Date(at)) / 60000));
    return m < 60 ? A('قبل ' + m + ' د', m + ' min ago') : m < 1440 ? A('قبل ' + Math.round(m / 60) + ' س', Math.round(m / 60) + ' h ago') : new Date(at).toLocaleDateString(A('ar-EG', 'en-GB'), { day: 'numeric', month: 'short' });
  }
  function notesSheet() {
    var s = seenAt(), list = NOTES || [];
    sheet('<div class="sh-head"><h2 class="ch2">' + ic('bell') + A('الإشعارات', 'Notifications') + '</h2><button class="snd ' + (soundOn() ? 'on' : '') + '" data-act="sndtog">' + A(soundOn() ? '🔔 الصوت مفعّل' : '🔕 الصوت متوقف', soundOn() ? '🔔 Sound on' : '🔕 Sound off') + '</button></div>' +
      '<p class="nsub">' + A('جديد طبيب الامتياز وإشعاراتك الخاصة', 'House Officer news and your own notifications') + '</p>' +
      (NOTES === null ? '<p class="nempty">' + A('جارٍ التحميل…', 'Loading…') + '</p>' : list.length ? '<div class="nlist">' + list.map(function (n) {
        return '<button class="nitem' + (String(n.at) > s ? ' new' : '') + '" data-act="nopen" data-l="' + esc(n.link) + '"><span class="ndot"></span><span class="ntx"><b dir="auto">' + esc(n.t) + '</b>' +
          (n.b ? '<span dir="auto">' + esc(n.b) + '</span>' : '') + '<small>' + ago(n.at) + '</small></span></button>';
      }).join('') + '</div>' : '<p class="nempty">' + A('لا توجد إشعارات بعد.', 'No notifications yet.') + '</p>'));
    if (list[0]) { try { localStorage.setItem('ex-nseen', JSON.stringify(String(list[0].at))); } catch (e) {} }
    var b = document.querySelector('.bellb .bdg'); if (b) b.remove();
  }
  function profileSheet() {
    if (!ME) {
      sheet('<div class="pf-top">' + '<span class="av big">' + ic('user') + '</span><h2>' + A('لم تسجّل الدخول', 'You are not signed in') + '</h2><p class="nsub">' + A('سجّل الدخول لحفظ ملفك واشتراكك.', 'Sign in to keep your profile and subscription.') + '</p>' +
        '<button class="btn pri wide" data-act="signin">' + A('تسجيل الدخول', 'Sign in') + '</button></div>' + menuRows());
      return;
    }
    var until = SUB.expires ? new Date(SUB.expires).toLocaleDateString(A('ar-EG', 'en-GB'), { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    var subTxt = !LOCKED ? (until ? A('مشترك حتى ' + until, 'Subscribed until ' + until) : A('مشترك', 'Subscribed')) : PENDING ? A('إيصالك قيد المراجعة', 'Receipt under review') : A('غير مشترك', 'Not subscribed');
    sheet('<form class="pf" data-form="pf"><div class="pf-top"><label class="av big pf-av">' + avatar() + '<span class="pf-cam">' + ic('cam') + '</span><input type="file" accept="image/*" id="pfPhoto" hidden></label>' +
      '<h2 dir="auto">' + esc(ME.name || '') + '</h2><span class="pf-sub ' + (!LOCKED ? 'ok' : '') + '">' + ic(!LOCKED ? 'checkc' : 'crown') + subTxt + '</span></div>' +
      '<label class="pf-f"><span>' + A('الاسم', 'Name') + '</span><input name="name" value="' + esc(ME.name || '') + '" maxlength="80" dir="auto" required></label>' +
      '<label class="pf-f"><span>' + A('رقم الهاتف', 'Phone number') + ' <em>' + ic('lock') + A('تراه الإدارة فقط', 'Seen only by the admins') + '</em></span><input name="phone" value="' + esc(ME.phone || '') + '" inputmode="tel" dir="ltr" placeholder="09…"></label>' +
      (ME.email ? '<p class="pf-mail" dir="ltr">' + esc(ME.email) + '</p>' : '') +
      '<button class="btn pri wide" type="submit">' + A('حفظ', 'Save') + '</button></form>' + menuRows());
    var fi = document.getElementById('pfPhoto');
    if (fi) fi.onchange = function () { var f = fi.files[0]; if (!f || !/^image\//.test(f.type)) return; var r = new FileReader(); r.onload = function () { PHOTO = r.result; var a = document.querySelector('.pf-av'); if (a) a.innerHTML = '<img src="' + PHOTO + '" alt=""><span class="pf-cam">' + ic('cam') + '</span>'; }; r.readAsDataURL(f); };
  }
  var PHOTO = '', SUB = {};
  function menuRows() {
    var rows = [['palette', A('المظهر والألوان واللغة', 'Appearance, colour and language'), 'settings'], ['bell', A('الإشعارات والصوت', 'Notifications and sound'), 'notes'],
      ['crown', LOCKED ? A('الاشتراك', 'Subscribe') : A('تجديد الاشتراك', 'Renew subscription'), 'subscribe'], ['checkc', A('التحقق من الاشتراك', 'Check subscription'), 'recheck'], ['chart', A('تقدّمي', 'My progress'), 'goprog']];
    return '<div class="pf-menu">' + rows.map(function (r) { return '<button data-act="' + r[2] + '">' + ic(r[0]) + '<span>' + r[1] + '</span>' + ic('chv') + '</button>'; }).join('') + '</div>';
  }
  document.addEventListener('submit', function (e) {
    var f = e.target; if (!f.matches || !f.matches('form[data-form="pf"]')) return; e.preventDefault();
    var b = f.querySelector('button[type=submit]'); b.disabled = true; b.textContent = A('جارٍ الحفظ…', 'Saving…');
    SAVING = true; (window.parent && window.parent !== window ? window.parent : window).postMessage({ exam: 'profile', name: f.elements.name.value, phone: f.elements.phone.value, photo: PHOTO }, '*');
    setTimeout(function () { if (SAVING) { SAVING = false; b.disabled = false; b.textContent = A('حفظ', 'Save'); toast(A('تعذّر الحفظ الآن. تأكد من الاتصال.', 'Could not save now. Check your connection.')); } }, 20000);
  });
  var SAVING = false;
  function askParent() { try { (window.parent && window.parent !== window ? window.parent : window.top).postMessage({ exam: 'key' }, '*'); } catch (e) {} }
  var RECHK = false, RECHK_T = 0;
  var WHY = {
    signin: ['سجّل الدخول أولًا بالحساب الذي اشتركت به، ثم اضغط «التحقق من الاشتراك».', 'Sign in first with the account you subscribed with, then tap «Check subscription».'],
    pending: ['إيصالك قيد المراجعة. يُفتح البنك تلقائيًا بعد موافقة الإدارة.', 'Your receipt is under review. The bank opens by itself once it is approved.'],
    locked: ['لا يوجد اشتراك على هذا الحساب بعد. اضغط «اشترك» للاشتراك.', 'This account has no subscription yet. Tap «Subscribe» to subscribe.'],
    nokey: ['اشتراكك مفعّل، لكن بنك الأسئلة لم يُجهَّز بعد على الخادم. راسل الإدارة.', 'Your access is active, but the question bank is not set up on the server yet. Please contact the team.'],
    ended: ['انتهى اشتراكك. اضغط «اشترك» لتجديده.', 'Your subscription has ended. Tap «Subscribe» to renew it.'],
    offline: ['لا يوجد اتصال بالإنترنت. اتصل ثم حاول مرة أخرى.', 'You are offline. Connect and try again.'],
    error: ['تعذّر التحقق الآن. حاول مرة أخرى بعد قليل.', 'Could not check now. Try again in a moment.']
  };
  function applyState(s) {
    ME = s.me || null; SUB = { plan: s.plan, expires: s.expires };
    if (SAVING) { SAVING = false; PHOTO = ''; toast(s.saved ? A('حُفظ ملفك', 'Your profile was saved') : s.err === 'phone' ? A('رقم الهاتف غير صحيح', 'The phone number is not valid') : A('تعذّر الحفظ. حاول مرة أخرى.', 'Could not save. Try again.')); if (s.saved) closeSheet(); }
    var asked = RECHK; RECHK = false; clearTimeout(RECHK_T);
    if (asked && !s.key && WHY[s.why]) toast(A(WHY[s.why][0], WHY[s.why][1]));
    if (asked && s.key) { var until = s.expires ? new Date(s.expires).toLocaleDateString(A('ar-EG', 'en-GB'), { day: 'numeric', month: 'long', year: 'numeric' }) : '';
      toast(until ? A('اشتراكك مفعّل حتى ' + until, 'Your subscription is active until ' + until) : A('تم التحقق: اشتراكك مفعّل', 'Checked: your subscription is active')); }
    PRICE = s.price || PRICE; BANKAK = s.bankak || BANKAK; PENDING = !!s.pending;
    if (s.key) { unlock(s.key); return; }
    LOCKED = true;
    if (!E.questions.length && window.EXAM_SAMPLE) setData(window.EXAM_SAMPLE);
    render();
  }
  async function unlock(keyB64) {
    try {
      var raw = Uint8Array.from(atob(keyB64), function (c) { return c.charCodeAt(0); });
      var ck = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['decrypt']);
      var buf = new Uint8Array(await (await fetch('js/data.enc?v=' + DV)).arrayBuffer());
      var pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: buf.slice(0, 12) }, ck, buf.slice(12));
      setData(JSON.parse(new TextDecoder().decode(pt)));
      LOCKED = false; render();
    } catch (e) { LOCKED = true; if (!E.questions.length && window.EXAM_SAMPLE) setData(window.EXAM_SAMPLE); render(); }
  }
  window.addEventListener('message', function (ev) { var d = ev.data; if (d && d.exam === 'state') applyState(d); if (d && d.exam === 'notes') gotNotes(d.list || []); });
  function toParent(m) { try { (window.parent && window.parent !== window ? window.parent : window.top).postMessage(m, '*'); } catch (e) {} }
  if (window.parent && window.parent !== window) { setTimeout(function () { toParent({ exam: 'notes' }); }, 1500); }

  /* ---------- boot ---------- */
  if (window.EXAM && (window.EXAM.questions || []).length) { render(); }   /* dev / local: full bank bundled */
  else {
    if (window.EXAM_SAMPLE) setData(window.EXAM_SAMPLE);                     /* free preview straight away */
    if (window.parent && window.parent !== window) { askParent(); render(); }   /* inside SMRA: fetch the real key */
    else { LOCKED = true; render(); }                                        /* opened on its own */
  }
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js', { scope: './' }).catch(function () {});
})();
