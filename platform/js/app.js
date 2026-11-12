/* Student Master Review: the platform shell.
   Screens are hash routes (#clinical, #book-anatomy, #my-library …) so the site works on any static host.
   Available books are plain links to their existing apps (same tab); nothing here touches their data. */
(function () {
  'use strict';
  var S = window.SMR, T = S.T;

  /* ---------- device storage (every read/write guarded) ---------- */
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem('smr-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('smr-' + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem('smr-' + k); } catch (e) {} }
  };
  var lang = LS.get('lang', null) || 'ar';  /* Arabic unless the student chose English */
  var theme = LS.get('theme', 'light');
  /* app colour (owner, 12 Nov 2026): six colours for the platform, chosen in Settings and on the first opening */
  var PALS = [['teal', '#11807a'], ['navy', '#2f4f86'], ['lav', '#7a5bb5'], ['green', '#1e7a4c'], ['blue', '#1768b3'], ['rose', '#b4235f']];
  var pal = LS.get('pal', 'teal');  /* day (white) unless the student chose otherwise */
  var state = { q: '', view: '', fromList: false };

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function t(k, v) {
    var s = (T[lang] && T[lang][k]) || T.en[k] || k;
    if (v) Object.keys(v).forEach(function (n) { s = s.split('{' + n + '}').join(v[n]); });
    return s;
  }
  function L(o) { return o ? (o[lang] || o.en) : ''; }
  function $(s, r) { return (r || document).querySelector(s); }
  var P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    library: '<path d="M4 4.5h4V20H4zM10 4.5h4V20h-4z"/><path d="m16.2 5.6 3.4-.9 3 14.2-3.4.9z"/>',
    progress: '<path d="M4 20h16"/><path d="M7 16v-4M12 16V6M17 16v-7"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    auto: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20"/>',
    pill: '<path d="m10.5 20.5-7-7a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7z"/><path d="m7 10 7 7"/>',
    notes: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>',
    history: '<path d="M8 3h8v3H8z"/><path d="M8 4.5H6a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5.5a1 1 0 0 0-1-1h-2"/><path d="M8.5 11h.01M11.5 11h4M8.5 15h.01M11.5 15h4"/>',
    steth: '<path d="M6 3v6a5 5 0 0 0 10 0V3"/><path d="M11 14v2a4 4 0 0 0 8 0v-1"/><circle cx="19" cy="13" r="2"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/>',
    share: '<path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/>',
    addsq: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>',
    dots: '<circle cx="12" cy="5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/>',
    instpc: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M12 7v6M9.5 10.5 12 13l2.5-2.5M8 21h8"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    browser: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/>',
        photo: '<rect x="3" y="5" width="18" height="15" rx="2"/><circle cx="12" cy="12.5" r="3.5"/><path d="M8 5l1.5-2h5L16 5"/>'
  };
  function ic(n, cls) { return '<svg class="ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + P[n] + '</svg>'; }

  var BOOK = {}; S.books.forEach(function (b) { BOOK[b.id] = b; });
  var SEC = {}; S.sections.forEach(function (s) { SEC[s.id] = s; });
  function secTitle(id) { return t(SEC[id].key + '.t'); }
  function shortT(b) { return b.short || b.title.split(' & ')[0]; }
  function avail(b) { return b.status === 'available' && b.url; }
  /* Books open inside the platform, except where the platform itself is shown inside another page (for example a
     preview), which does not allow other sites inside it: there the book opens in a new tab. */
  var EMBED = (function () { try { return window.top === window.self; } catch (e) { return false; } })();
  function rlink(b) {
    if (EMBED) return 'href="#read-' + b.id + '"';
    /* in a preview copy, open the real platform at this book (it opens inside there) */
    return 'href="' + esc(S.site ? S.site + '#read-' + b.id : b.url) + '" target="_blank" rel="noopener"';
  }

  /* ---------- profile, recent, saved ---------- */
  function cleanName(n) { return String(n || '').trim().replace(/^(dr\.?|doctor|د\.?|دكتور)\s*/i, '').trim(); }
  function initials(n) { var p = cleanName(n).split(/\s+/).filter(Boolean); return ((p[0] || '')[0] || '') + ((p[1] || '')[0] || ''); }
  function avatar(big) {
    var ph = LS.get('photo', ''), n = LS.get('name', '');
    var inner = ph ? '<img src="' + esc(ph) + '" alt="">' : (initials(n) ? esc(initials(n).toUpperCase()) : ic('user'));
    return '<span class="av' + (big ? ' big' : '') + '">' + inner + '</span>';
  }
  function displayName() { var n = cleanName(LS.get('name', '')); return n ? (lang === 'ar' ? 'د. ' : 'Dr. ') + n : t('doctor'); }
  function recent() { var r = LS.get('recent', []); return Array.isArray(r) ? r.filter(function (x) { return x && BOOK[x.id]; }) : []; }
  function noteOpen(id) {
    var r = recent().filter(function (x) { return x.id !== id; });
    r.unshift({ id: id, t: Date.now() }); LS.set('recent', r.slice(0, 8));
  }
  function lastOpen(id) { var f = recent().filter(function (x) { return x.id === id; })[0]; return f ? f.t : 0; }
  function saved() { var s = LS.get('saved', []); return Array.isArray(s) ? s.filter(function (id) { return BOOK[id]; }) : []; }
  function ago(ts) {
    var d = Math.round((ts - Date.now()) / 1000), a = Math.abs(d);
    if (a < 45) return t('just');
    var u = a < 3600 ? ['minute', 60] : a < 86400 ? ['hour', 3600] : a < 2592000 ? ['day', 86400] : ['month', 2592000];
    try { return new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(Math.round(d / u[1]), u[0]); }
    catch (e) { return new Date(ts).toLocaleDateString(lang); }
  }

  /* ---------- theme and language ---------- */
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function isDark() { return theme === 'dark' || (theme === 'system' && mq && mq.matches); }
  function applyTheme() {
    var r = document.documentElement;
    if (theme === 'system') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', theme);
    var tb = $('#thb'); if (tb) { tb.innerHTML = ic(theme === 'system' ? 'auto' : isDark() ? 'moon' : 'sun'); tb.setAttribute('aria-label', t('set.look') + ': ' + t(theme === 'light' ? 'look.light' : theme === 'dark' ? 'look.dark' : 'look.system')); }
    document.querySelectorAll('[data-look]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-look') === theme ? 'true' : 'false'); });
    var m = $('meta[name="theme-color"]'); if (m) m.setAttribute('content', isDark() ? '#0c1525' : '#f7f3ec');
  }
  if (mq && mq.addEventListener) mq.addEventListener('change', applyTheme);
  function setTheme(v) { theme = v; LS.set('theme', v); applyTheme(); }
  function applyPal() { var r = document.documentElement; if (pal && pal !== 'teal') r.setAttribute('data-pal', pal); else r.removeAttribute('data-pal');
    document.querySelectorAll('[data-pal]').forEach(function (b) { if (b !== r) b.setAttribute('aria-pressed', b.getAttribute('data-pal') === pal ? 'true' : 'false'); }); }
  function setPal(v) { pal = v; LS.set('pal', v); applyPal(); }
  function palPick() { return '<div class="pals" role="group" aria-label="' + esc(t('set.color')) + '">' + PALS.map(function (p) {
    return '<button type="button" data-pal="' + p[0] + '" aria-pressed="' + (pal === p[0]) + '"><i style="--c:' + p[1] + '"></i><span>' + esc(t('pal.' + p[0])) + '</span></button>'; }).join('') + '</div>'; }
  applyPal();
  function applyLang() { var r = document.documentElement; r.lang = lang; r.dir = lang === 'ar' ? 'rtl' : 'ltr'; }
  function setLang(v) { lang = v; LS.set('lang', v); LS.set('langset', Date.now()); applyLang(); chrome(); route(true); Object.keys(FR).forEach(function (k) { tellLang(k, true); }); }

  /* ---------- chrome: header + bottom tabs ---------- */
  var NAV = [['home', 'nav.home', 'home'], ['my-library', 'nav.library', 'library'], ['progress', 'nav.progress', 'progress'], ['preferences', 'nav.settings', 'gear']];
  function navLinks() {
    return NAV.map(function (n) { return '<a href="#' + n[0] + '" data-nav="' + n[0] + '">' + ic(n[2]) + '<span>' + esc(t(n[1])) + '</span></a>'; }).join('');
  }
  function chrome() {
    $('#top').innerHTML =
      '<div class="top-in">' +
      '<a class="brand" href="#home" aria-label="Student Master Review · ' + esc(t('nav.home')) + '"><span class="mark" aria-hidden="true"></span>' +
      '<span class="bname" lang="en" dir="ltr"><span class="b1">Student </span>Master Review</span></a>' +
      '<nav class="tnav" aria-label="' + esc(t('menu')) + '">' + navLinks() + '</nav>' +
      '<div class="tbtns">' +
      '<div class="thm"><button class="ib" id="thb" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="tmenu"></button>' +
      '<div class="tmenu" id="tmenu" hidden>' + [['light', 'sun', 'look.light'], ['dark', 'moon', 'look.dark'], ['system', 'auto', 'look.system']].map(function (o) {
        return '<button type="button" data-look="' + o[0] + '" aria-pressed="false">' + ic(o[1]) + '<span>' + esc(t(o[2])) + '</span>' + ic('check', 'ck') + '</button>';
      }).join('') + '</div></div>' +
      '<a class="ib" href="#search" aria-label="' + esc(t('search.short')) + '" title="' + esc(t('search.short')) + '">' + ic('search') + '</a>' +
      '<a class="ib" href="#notifications" aria-label="' + esc(t('notif.t')) + '">' + ic('bell') + '</a>' +
      '<a class="pchip" href="#preferences" aria-label="' + esc(t('profile')) + '">' + avatar() + '<span class="pn"><bdi>' + esc(displayName()) + '</bdi></span></a>' +
      '</div></div>';
    $('#bnav').innerHTML = navLinks();
    $('#bnav').setAttribute('aria-label', t('menu'));
    $('#skip').textContent = t('skip');
    applyTheme();
    bindTopSearch();
  }
  function markNav(v) {
    var cur = v === 'home' || SEC[v] || /^book-/.test(v) ? 'home' : v;
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === cur) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  /* ---------- covers ---------- */
  function img(b, alt, lazy) {
    return '<img src="' + esc(b.cover) + '" width="' + b.w + '" height="' + b.h + '" alt="' + esc(alt || '') + '"' + (lazy === false ? '' : ' loading="lazy"') + ' decoding="async">';
  }
  function stand(ids) {
    var list = ids.map(function (id) { return BOOK[id] || S.covers[id]; });
    return '<div class="stand" aria-hidden="true"><div class="books n' + list.length + '">' + list.map(function (b) { return img(b, '', false); }).join('') + '</div><div class="plinth"></div></div>';
  }
  function single(b) {
    return '<div class="stand"><div class="one" style="--ar:' + b.w + '/' + b.h + '">' + img(b, b.title + ' ' + b.series) + '</div><div class="plinth"></div></div>';
  }
  function chip(b) { return avail(b) ? '<span class="chip ok">' + esc(t('st.available')) + '</span>' : '<span class="chip soon">' + esc(t('st.soon')) + '</span>'; }

  /* ---------- views ---------- */
  function vHome() {
    var n = cleanName(LS.get('name', ''));
    var h = '<section class="hero"><div class="hero-art" aria-hidden="true"></div>' +
      '<p class="eyebrow"><span>' + (n ? t('welcome.n', { n: '<bdi>' + esc(n) + '</bdi>' }) : esc(t('welcome'))) + '</span></p>' +
      '<h1 class="sr" tabindex="-1">Student Master Review</h1>' +
      '<p class="lead">' + esc(t('hero.sub')) + '</p>' +
      '</section><div class="stages">';
    S.sections.forEach(function (s) {
      h += '<article class="stage">' + stand(s.home) +
        '<div class="stxt"><h2>' + esc(t(s.key + '.t')) + '</h2><p class="rule">' + esc(t(s.key + '.tag')) + '</p>' +
        '<a class="btn" href="#' + s.id + '">' + esc(t(s.key + '.cta')) + ic('arrow', 'flip') + '</a></div></article>';
    });
    if (!EMBED && S.site) h = '<p class="note" style="margin-top:12px">' + ic('info') + '<span>' + esc(t('prev.note')) + ' <b style="user-select:all;word-break:break-all">' + esc(S.site) + '</b></span></p>' + h;
    return h + '</div><p class="homefoot">' + esc(t('foot')) + '</p>';
  }

  function crumbs(here) {
    return '<nav class="crumbs" aria-label="breadcrumb"><a class="link" href="#home">' + ic('back', 'flip') + esc(t('back.home')) + '</a><span class="sep" aria-hidden="true"></span>' +
      '<ol><li><a href="#home">' + esc(t('home')) + '</a></li><li aria-current="page">' + esc(here) + '</li></ol></nav>';
  }
  function bookCard(b) {
    var h = '<article class="bk">' + single(b) + '<div class="bt">' +
      '<h3><span class="en" lang="en">' + esc(b.title) + '</span><span class="series" lang="en">' + esc(b.series) + '</span></h3><span class="gl" aria-hidden="true"></span>' +
      '<div class="meta">' + chip(b) + (b.edition ? '<span class="tag">' + esc(L(b.edition)) + '</span>' : '') + '</div>';
    if (avail(b)) {
      h += '<p class="desc">' + esc(L(b.sub)) + '</p><div class="act"><a class="btn" ' + rlink(b) + ' data-open="' + b.id + '">' +
        esc(t('open', { t: shortT(b) })) + ic('arrow', 'flip') + '</a></div>';
    } else {
      h += '<p class="desc">' + esc(b.ho ? t('ho.sub') : L(b.sub)) + '</p><div class="act"><a class="btn ghost" href="#book-' + b.id + '" data-book>' +
        esc(t(b.ho ? 'plan' : 'about')) + '</a></div>';
    }
    return h + '</div></article>';
  }
  function vSection(id) {
    var s = SEC[id];
    var books = S.books.filter(function (b) { return b.section === id; });
    return crumbs(t(s.key + '.t')) +
      '<header class="shead"><h1 tabindex="-1">' + esc(t(s.key + '.t')) + '</h1><p>' + esc(t(s.key + '.intro')) + '</p></header>' +
      '<div class="shelf ' + s.layout + '">' + books.map(bookCard).join('') + '</div>';
  }

  function row(b, extra, action) {
    return '<div class="row">' + img(b, '') + '<div class="rt"><b lang="en">' + esc(b.title) + '</b><i lang="en">' + esc(b.series) + '</i><span>' + extra + '</span></div>' + action + '</div>';
  }
  function openLink(b, cls) { return '<a class="btn sm rgo ' + (cls || '') + '" ' + rlink(b) + ' data-open="' + b.id + '">' + esc(t('open.short')) + ic('arrow', 'flip') + '</a>'; }
  function vLibrary() {
    var av = S.books.filter(avail), rc = recent(), sv = saved();
    var h = '<header class="pagehead"><h1 tabindex="-1">' + esc(t('lib.t')) + '</h1><p>' + esc(t('lib.sub')) + '</p></header>';
    h += '<section class="block"><h2>' + esc(t('lib.avail')) + ' <span class="cnt">' + av.length + '</span></h2><div class="rows">' +
      av.map(function (b) { return row(b, esc(secTitle(b.section)) + (b.edition ? ' · ' + esc(L(b.edition)) : ''), openLink(b)); }).join('') + '</div></section>';
    h += '<section class="block"><h2>' + esc(t('lib.recent')) + '</h2>' + (rc.length ? '<div class="rows">' + rc.map(function (r) {
      var b = BOOK[r.id]; return row(b, ic('clock') + ' ' + esc(ago(r.t)), avail(b) ? openLink(b) : '');
    }).join('') + '</div>' : '<div class="empty">' + ic('clock') + '<span>' + esc(t('lib.recent.none')) + '</span></div>') + '</section>';
    h += '<section class="block"><h2>' + esc(t('lib.saved')) + '</h2>' + (sv.length ? '<div class="rows">' + sv.map(function (id) {
      var b = BOOK[id]; return row(b, esc(secTitle(b.section)) + ' · ' + esc(t('st.soon')), '<a class="btn sm ghost rgo" href="#book-' + b.id + '" data-book>' + esc(t('about')) + '</a>');
    }).join('') + '</div>' : '<div class="empty">' + ic('bookmark') + '<span>' + esc(t('lib.saved.none')) + '</span></div>') + '</section>';
    return h + '<p class="note">' + ic('info') + '<span>' + esc(t('lib.note')) + '</span></p>';
  }
  /* ---------- Progress: real figures sent by each book while it runs inside the platform ---------- */
  function num(x) { x = +x; return isFinite(x) && x > 0 ? Math.round(x) : 0; }
  function cleanStats(s) {
    if (!s || typeof s !== 'object') return null;
    var g = function (o, k) { return num(o && o[k]); };
    var r = { pages: { total: g(s.pages, 'total'), read: g(s.pages, 'read'), mastered: g(s.pages, 'mastered') },
      q: { total: g(s.q, 'total'), answered: g(s.q, 'answered'), correct: g(s.q, 'correct'), wrong: g(s.q, 'wrong') },
      cards: { total: g(s.cards, 'total'), known: g(s.cards, 'known') }, topics: { total: g(s.topics, 'total'), done: g(s.topics, 'done') },
      streak: num(s.streak), ch: [] };
    (Array.isArray(s.ch) ? s.ch.slice(0, 40) : []).forEach(function (c) {
      if (c && typeof c === 'object') r.ch.push({ n: String(c.n == null ? '' : c.n).slice(0, 6), name: String(c.name || '').slice(0, 90), read: num(c.read), mastered: num(c.mastered), total: num(c.total) });
    });
    return r;
  }
  function stats(id) { var x = LS.get('st-' + id, null); return x && x.s ? x : null; }
  function pc(a, b) { return b ? Math.min(100, Math.round(a / b * 100)) : 0; }
  function bar(v, cls) { return '<span class="pbar' + (cls ? ' ' + cls : '') + '"><i style="width:' + v + '%"></i></span>'; }
  function ring(v) {
    var r = 42, c = 2 * Math.PI * r;
    return '<span class="pring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="' + r + '" class="rt"/>' + (v ? '<circle cx="50" cy="50" r="' + r + '" class="rv" stroke-dasharray="' + (c * v / 100).toFixed(1) + ' ' + c.toFixed(1) + '"/>' : '') + '</svg><b>' + v + '%</b></span>';
  }
  function n(x) { return '<bdi>' + x + '</bdi>'; }
  function bookProg(b) {
    var x = stats(b.id), go = '<a class="btn sm" ' + rlink(b) + ' data-open="' + b.id + '">' + esc(t(x ? 'prog.cont' : 'prog.open', { t: shortT(b) })) + ic('arrow', 'flip') + '</a>';
    var head = '<div class="pbh">' + img(b, '') + '<div><b lang="en">' + esc(b.app) + '</b><span>' + (x ? esc(t('prog.upd', { w: ago(x.t) })) : esc(secTitle(b.section))) + '</span></div>' + go + '</div>';
    if (!x) return '<article class="pbk empty">' + head + '<p class="pnone">' + ic('info') + '<span>' + esc(t('prog.none')) + '</span></p></article>';
    var s = x.s, rp = pc(s.pages.read, s.pages.total), mp = pc(s.pages.mastered, s.pages.total), qa = pc(s.q.answered, s.q.total),
      acc = pc(s.q.correct, s.q.correct + s.q.wrong), cr = pc(s.q.correct, s.q.answered), wr = pc(s.q.wrong, s.q.answered), kp = pc(s.cards.known, s.cards.total);
    var h = '<article class="pbk">' + head +
      '<div class="pbm"><div class="pbr">' + ring(rp) + '<span class="prl">' + esc(t('prog.ring')) + '</span></div><div class="pbl">' +
      '<div class="pmet"><div class="pmh"><span class="pi">' + ic('book') + '</span><b>' + esc(t('prog.read')) + '</b><em>' + n(rp + '%') + '</em></div>' + bar(rp) +
        '<div class="pms"><span>' + esc(t('prog.pages', { a: s.pages.read, b: s.pages.total })) + '</span></div>' + bar(mp, 'gold') +
        '<div class="pms"><span class="dot gold"></span><span>' + esc(t('prog.mast', { a: s.pages.mastered })) + '</span></div></div>' +
      '<div class="pmet"><div class="pmh"><span class="pi">' + ic('notes') + '</span><b>' + esc(t('prog.qb')) + '</b><em>' + n(qa + '%') + '</em></div>' + bar(qa) +
        '<div class="pms"><span>' + esc(t('prog.qans', { a: s.q.answered, b: s.q.total })) + '</span></div>' +
        '<span class="pbar split" role="img" aria-label="' + esc(t('prog.right') + ' ' + s.q.correct + ' · ' + t('prog.wrong') + ' ' + s.q.wrong) + '"><i class="ok" style="width:' + cr + '%"></i><i class="no" style="width:' + wr + '%"></i></span>' +
        '<div class="pms"><span class="dot ok"></span><span>' + esc(t('prog.right')) + ' ' + n(s.q.correct) + '</span><span class="dot no"></span><span>' + esc(t('prog.wrong')) + ' ' + n(s.q.wrong) + '</span>' +
        (s.q.correct + s.q.wrong ? '<span class="pacc">' + esc(t('prog.acc')) + ' ' + n(acc + '%') + '</span>' : '') + '</div></div>' +
      '<div class="pmet"><div class="pmh"><span class="pi">' + ic('library') + '</span><b>' + esc(t('prog.cards')) + '</b><em>' + n(kp + '%') + '</em></div>' + bar(kp, 'violet') +
        '<div class="pms"><span>' + esc(t('prog.cknown', { a: s.cards.known, b: s.cards.total })) + '</span></div></div>' +
      '</div></div><div class="pchips"><span class="pchip2 fire">' + ic('clock') + esc(t('prog.streak', { n: s.streak })) + '</span><span class="pchip2">' + ic('check') + esc(t('prog.topics', { a: s.topics.done, b: s.topics.total })) + '</span></div>';
    if (s.ch.length) h += '<details class="pch"><summary>' + esc(t('prog.byc')) + ic('back', 'chev') + '</summary><div class="pchl">' + s.ch.map(function (c) {
      var v = pc(c.read, c.total), m = pc(c.mastered, c.total);
      return '<div class="pcr"><div class="pct"><span class="pcn">' + esc(c.n) + '</span><span class="pcname" lang="en">' + esc(c.name) + '</span><em>' + n(v + '%') + '</em></div><span class="pbar dual"><i style="width:' + v + '%"></i><i class="gold" style="width:' + m + '%"></i></span></div>';
    }).join('') + '</div></details>';
    return h + '</article>';
  }
  function vProgress() {
    var books = S.books.filter(avail), tot = { r: 0, p: 0, m: 0, qa: 0, qt: 0, c: 0, w: 0, k: 0, kt: 0 }, any = false;
    books.forEach(function (b) { var x = stats(b.id); if (!x) return; any = true; var s = x.s; tot.r += s.pages.read; tot.p += s.pages.total; tot.m += s.pages.mastered; tot.qa += s.q.answered; tot.qt += s.q.total; tot.c += s.q.correct; tot.w += s.q.wrong; tot.k += s.cards.known; tot.kt += s.cards.total; });
    var h = '<header class="pagehead"><h1 tabindex="-1">' + esc(t('prog.t')) + '</h1><p>' + esc(t('prog.sub')) + '</p></header>';
    if (any) {
      var tile = function (icn, a, b, l, cls) { return '<div class="psum ' + (cls || '') + '"><span class="pi">' + ic(icn) + '</span><b>' + n(a) + (b !== '' ? '<small> / ' + n(b) + '</small>' : '') + '</b><span>' + esc(l) + '</span></div>'; };
      h += '<div class="psums">' + tile('book', tot.r, tot.p, t('prog.sum.pages')) + tile('check', tot.m, tot.p, t('prog.sum.mast'), 'g') +
        tile('notes', tot.qa, tot.qt, t('prog.sum.q') + (tot.c + tot.w ? ' · ' + pc(tot.c, tot.c + tot.w) + '%' : '')) + tile('library', tot.k, tot.kt, t('prog.sum.c'), 'v') + '</div>';
    }
    h += '<div class="pbks">' + books.map(bookProg).join('') + '</div>';
    return h + '<p class="note">' + ic('info') + '<span>' + esc(t('prog.where')) + '</span></p>';
  }
  function seg(name, opts, cur) {
    return '<div class="seg" role="group" aria-label="' + esc(name) + '">' + opts.map(function (o) {
      return '<button type="button" data-' + o[0] + '="' + o[1] + '" aria-pressed="' + (o[1] === cur) + '"' + (o[3] ? ' class="' + o[3] + '" lang="' + o[4] + '"' : '') + '>' + esc(o[2]) + '</button>';
    }).join('') + '</div>';
  }
  function vPrefs() {
    var ph = LS.get('photo', '');
    var h = '<header class="pagehead"><h1 tabindex="-1">' + esc(t('set.t')) + '</h1></header><div class="panels">';
    h += '<section class="panel pfp"><h2>' + esc(t('set.profile')) + '</h2>' +
      '<label class="pfpic" for="pf-photo" tabindex="-1" aria-hidden="true"><span id="pfav">' + avatar(true) + '</span><span class="pfcam">' + ic('photo') + '</span></label>' +
      '<div class="pbtns pfb"><label class="btn sm quiet" for="pf-photo" tabindex="0" role="button">' + ic('photo') + '<span>' + esc(t('set.photo.add')) + '</span></label><input id="pf-photo" type="file" accept="image/*" class="sr">' +
      (ph ? '<button class="btn sm quiet" type="button" id="pf-rm">' + esc(t('set.photo.rm')) + '</button>' : '') + '</div>' +
      '<div class="pfname"><label for="pf-name">' + esc(t('set.name')) + '</label><input class="inp" id="pf-name" maxlength="40" autocomplete="name" placeholder="' + esc(t('set.name.ph')) + '" value="' + esc(LS.get('name', '')) + '"></div>' +
      '<div class="ok-msg" id="pf-ok" role="status" aria-live="polite"></div><p class="pfnote">' + esc(t('set.profile.note')) + '</p></section>';
    h += '<section class="panel"><h2>' + esc(t('set.lang')) + '</h2>' + seg(t('set.lang'), [['lang', 'en', 'English'], ['lang', 'ar', 'العربية', 'ar', 'ar']], lang) + '</section>';
    h += '<section class="panel"><h2>' + esc(t('set.look')) + '</h2>' + seg(t('set.look'), [['theme', 'light', t('look.light')], ['theme', 'dark', t('look.dark')], ['theme', 'system', t('look.system')]], theme) + '</section>';
    h += '<section class="panel"><h2>' + esc(t('set.color')) + '</h2>' + palPick() + '</section>';
    h += '<section class="panel"><h2>' + esc(t('set.acc')) + '</h2><p>' + esc(t('set.acc.txt')) + '</p><div class="rows" style="margin-top:14px">' +
      S.books.filter(avail).map(function (b) { return row(b, esc(secTitle(b.section)) + (b.edition ? ' · ' + esc(L(b.edition)) : ''), openLink(b)); }).join('') + '</div></section>';
    h += '<section class="panel"><h2>' + esc(t('set.data')) + '</h2><p>' + esc(t('set.data.txt')) + '</p><div class="confirm" id="clr"><button class="btn sm quiet" type="button" id="clr1">' + esc(t('set.clear')) + '</button></div></section>';
    h += '<section class="panel"><h2>' + esc(t('set.inst')) + '</h2>' + (STANDALONE ? '<p>' + esc(t('i.already')) + '</p>' :
      '<p>' + esc(t('set.inst.txt')) + '</p><div class="confirm"><button class="btn sm" type="button" data-install>' + ic('download') + esc(t('w.install')) + '</button></div>') + '</section>';
    h += '<section class="panel"><h2>' + esc(t('set.about')) + '</h2><p>' + esc(t('set.about.txt')) + '</p></section>';
    return h + '</div>';
  }
  function vNotif() {
    return '<header class="pagehead"><h1 tabindex="-1">' + esc(t('notif.t')) + '</h1></header><div class="empty">' + ic('bell') + '<span><b style="display:block;color:var(--tx)">' + esc(t('notif.none')) + '</b>' + esc(t('notif.txt')) + '</span></div>';
  }
  function vSearch() {
    return '<div class="spage"><header class="pagehead"><h1 tabindex="-1">' + esc(t('srch.t')) + '</h1></header><div role="search"><label class="field">' + ic('search') +
      '<input id="qpage" type="search" autocomplete="off" spellcheck="false" placeholder="' + esc(t('search.ph')) + '" aria-label="' + esc(t('search.short')) + '" value="' + esc(state.q) + '"></label></div>' +
      '<div id="sout" aria-live="polite"></div><p class="note">' + ic('info') + '<span>' + esc(t('srch.scope')) + '</span></p></div>';
  }

  /* ---------- search over the catalogue ---------- */
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
      .split(' ').map(function (w) { return w.length > 3 && w.indexOf('ال') === 0 ? w.slice(2) : w; }).join(' ');
  }
  var IDX = null;
  function index() {
    if (IDX) return IDX;
    IDX = S.sections.map(function (s) {
      return { kind: 'section', id: s.id, title: 'en', hay: norm([T.en[s.key + '.t'], T.ar[s.key + '.t'], T.en[s.key + '.tag'], T.ar[s.key + '.tag']].join(' ')), ttl: norm(T.en[s.key + '.t'] + ' ' + T.ar[s.key + '.t']) };
    }).concat(S.books.map(function (b) {
      var s = SEC[b.section];
      return { kind: 'book', id: b.id, ttl: norm(b.title + ' ' + b.series),
        hay: norm([b.title, b.series, b.app, b.kw, L(b.sub), b.sub && b.sub.en, b.sub && b.sub.ar, (b.areas || []).join(' '), (b.tools || []).join(' '),
          b.ho ? S.hoTools.map(function (x) { return x.en + ' ' + x.ar; }).join(' ') + ' house officer handbook امتياز' : '',
          T.en[s.key + '.t'], T.ar[s.key + '.t']].join(' ')) };
    }));
    return IDX;
  }
  function find(q) {
    var qs = norm(q).split(' ').filter(Boolean); if (!qs.length) return [];
    return index().filter(function (e) { return qs.every(function (w) { return e.hay.indexOf(w) >= 0; }); })
      .map(function (e) {
        var sc = (qs.every(function (w) { return e.ttl.indexOf(w) >= 0; }) ? 0 : 10) + (e.kind === 'section' ? 0 : 1) + (e.kind === 'book' && !avail(BOOK[e.id]) ? 2 : 0);
        return { e: e, sc: sc };
      }).sort(function (a, b) { return a.sc - b.sc; }).map(function (x) { return x.e; });
  }
  function resLink(e, on) {
    if (e.kind === 'section') {
      var s = SEC[e.id], cv = BOOK[s.home[0]] || S.covers[s.home[0]];
      return '<a href="#' + s.id + '"' + (on ? ' class="on"' : '') + '>' + img(cv, '') + '<span class="st"><b>' + esc(t(s.key + '.t')) + '</b><span>' + esc(t(s.key + '.tag')) + '</span></span>' + ic('arrow', 'flip') + '</a>';
    }
    var b = BOOK[e.id];
    var href = avail(b) ? rlink(b) + ' data-open="' + b.id + '"' : 'href="#book-' + b.id + '" data-book="1"';
    return '<a ' + href + (on ? ' class="on"' : '') + '>' + img(b, '') + '<span class="st"><b lang="en">' + esc(b.title) + ' · ' + esc(b.series) + '</b><span>' + esc(secTitle(b.section)) + ' · ' + esc(avail(b) ? t('st.available') : t('st.soon')) + '</span></span>' + ic('arrow', 'flip') + '</a>';
  }
  function countTxt(n) {
    if (n === 1) return t('srch.n1');
    if (lang === 'ar') return n === 2 ? 'نتيجتان' : n <= 10 ? n + ' نتائج' : n + ' نتيجة';
    return t('srch.n', { n: n });
  }
  function fillSearchPage() {
    var out = $('#sout'); if (!out) return;
    var q = state.q.trim();
    if (!q) { out.innerHTML = '<p class="scount">' + esc(t('srch.hint')) + '</p>'; return; }
    var r = find(q);
    out.innerHTML = r.length ? '<p class="scount">' + esc(countTxt(r.length)) + '</p><div class="sres">' + r.map(function (e) { return resLink(e); }).join('') + '</div>'
      : '<p class="scount">' + esc(t('srch.none', { q: q })) + '</p>';
  }
  var sel = -1;
  function bindTopSearch() {
    var q = $('#qtop'), d = $('#sdrop'); if (!q) return;
    function close() { d.hidden = true; q.setAttribute('aria-expanded', 'false'); sel = -1; }
    function draw() {
      var v = q.value.trim(); if (!v) { close(); return; }
      var r = find(v).slice(0, 6);
      d.innerHTML = (r.length ? '<div class="sres">' + r.map(function (e, i) { return resLink(e, i === sel); }).join('') + '</div>' : '<p class="scount" style="margin:6px 10px">' + esc(t('srch.none', { q: v })) + '</p>') +
        '<div class="sscope">' + esc(t('srch.scope')) + '</div>';
      d.hidden = false; q.setAttribute('aria-expanded', 'true');
    }
    q.addEventListener('input', function () { sel = -1; draw(); });
    q.addEventListener('keydown', function (e) {
      var items = d.querySelectorAll('.sres a');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!items.length) return; e.preventDefault();
        sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; draw();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (sel >= 0 && items[sel]) { items[sel].click(); }
        else if (q.value.trim()) { state.q = q.value; go('search'); }
        close();
      } else if (e.key === 'Escape') { close(); }
    });
    q.addEventListener('focus', function () { if (q.value.trim()) draw(); });
    if (!bindTopSearch.doc) { bindTopSearch.doc = 1; document.addEventListener('click', function (e) { var dd = $('#sdrop'), qq = $('#qtop'); if (dd && !e.target.closest('.tsearch')) { dd.hidden = true; if (qq) qq.setAttribute('aria-expanded', 'false'); } }); }
    d.addEventListener('click', function (e) { if (e.target.closest('a')) { close(); q.value = ''; } });
  }

  /* ---------- book panel (planned books) ---------- */
  var dlg;
  function openBook(id) {
    var b = BOOK[id]; if (!b) return;
    if (avail(b)) { location.replace('#' + b.section); return; }
    var sv = saved().indexOf(id) >= 0;
    var more = '';
    if (b.areas) more = '<p class="sh-sub">' + esc(t('areas')) + '</p><div class="areas" lang="en">' + b.areas.map(function (a) { return '<span class="tag">' + esc(a) + '</span>'; }).join('') + '</div>';
    if (b.ho) more = '<p class="sh-sub">' + esc(t('ho.tools')) + '</p><div class="tools">' + S.hoTools.map(function (x) {
      return '<div class="tool"><span class="ti">' + ic(x.icon) + '</span><div><b>' + esc(x[lang] || x.en) + '</b><span>' + esc(x['d' + lang] || x.den) + '</span><span class="tag">' + esc(t('st.planned')) + '</span></div></div>';
    }).join('') + '</div>';
    dlg.innerHTML = '<button class="ib xbtn" type="button" data-close aria-label="' + esc(t('close')) + '">' + ic('x') + '</button>' +
      '<div class="sh-in"><div class="cv">' + img(b, b.title + ' ' + b.series, false) + '</div><div>' +
      '<h2 id="shT" tabindex="-1" autofocus><span lang="en">' + esc(b.title) + '</span><span class="series" lang="en">' + esc(b.series) + '</span></h2>' +
      '<div class="meta" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">' + chip(b) + '<span class="tag">' + esc(secTitle(b.section)) + '</span></div>' +
      '<p>' + esc(t('soon.note')) + '</p></div></div>' +
      (more ? '<div style="padding:0 26px 22px" class="sh-more">' + more + '</div>' : '') +
      '<div class="sh-foot"><button class="btn ghost" type="button" id="svb" aria-pressed="' + sv + '">' + ic(sv ? 'check' : 'bookmark') + '<span>' + esc(t(sv ? 'saved' : 'save')) + '</span></button>' +
      '<button class="btn" type="button" data-close>' + esc(t('close')) + '</button></div>';
    dlg.setAttribute('aria-labelledby', 'shT');
    if (!dlg.open) { try { dlg.showModal(); } catch (e) { dlg.setAttribute('open', ''); } }
  }
  function closeBook() {
    if (!/^book-/.test(state.view)) { if (dlg.open) dlg.close(); return; }
    var b = BOOK[state.view.slice(5)], back = b ? (state.fromList || b.section) : 'home';
    if (state.cameIn) { state.cameIn = false; history.back(); } else location.replace('#' + back);
  }


  /* ---------- books inside the platform ----------
     Each available book runs in its own frame under the platform bar. Frames stay loaded while the student
     moves around the platform, so coming back resumes where they were. */
  var FR = {}, apps = null;
  /* A book opened on its own address moves the student here (owner, 12 Nov 2026: one app): #read-<book>~move=<device identity>. The identity is
     kept for this tab only and handed to the book's frame, so the subscription and synced notes follow. */
  var MOVE = {}, MOVED = false;
  /* owner, 12 Nov 2026: a student coming from a book's old link lands on the platform's Home first (so they see that everything changed);
     the book's hand-over waits on this device until that book is opened (or loaded in the background) here. */
  function moveGet(id) { try { return localStorage.getItem('smr-move-' + id); } catch (e) { return null; } }
  function moveDel(id) { try { localStorage.removeItem('smr-move-' + id); } catch (e) {} }
  (function () { var h = location.hash, m = h.match(/^#([a-z-]*)~move-([a-z-]+)=(.+)$/) || h.match(/^#read-([a-z-]+)~move=(.+)$/), id, v;
    if (!m) return; if (m.length === 4) { id = m[2]; v = m[3]; } else { id = m[1]; v = m[2]; }
    MOVE[id] = v; try { localStorage.setItem('smr-move-' + id, v); } catch (e) {}
    /* owner, 12 Nov 2026: someone coming from an old book link or book app gets the main app exactly as on a first opening:
       the greeting with «ثبّت التطبيق» / «المتابعة في المتصفح», then the language and look step, then Home */
    MOVED = true; try { sessionStorage.removeItem('smr-wel'); } catch (e) {} LS.del('setup');
    try { history.replaceState(null, '', location.pathname + location.search + '#home'); } catch (e) {} })();
  /* owner, 12 Nov 2026 ("old links open the book, I think because of #read-surgery"): an opening of the app on an address that points inside a
     book (a saved tab, bookmark or link from an older move) starts on Home with the greeting; the book is one tap away. Coming from a book's
     old address also shows the note that the books now open here. */
  (function () { if (!/^#read-/.test(location.hash)) return;
    var ref = ''; try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
    if (/^(obstetrics-master-review\.pages\.dev|surgery-master-review\.jaberarja555\.workers\.dev|pediatrics-master-review\.jaberarja555\.workers\.dev)$/.test(ref)) {
      MOVED = true; try { sessionStorage.removeItem('smr-wel'); } catch (e) {} LS.del('setup'); }
    try { history.replaceState(null, '', location.pathname + location.search + '#home'); } catch (e) {} })();
  function readBack(b) { return state.readFrom && state.readFrom !== 'read' ? state.readFrom : b.section; }
  /* Opening fast (owner, 12 Nov 2026: "all needed files downloaded from the first time, then the app acts smoothly"): right after the
     platform opens, every book is loaded once in the background, one after the other, in a frame kept off the screen but laid out
     (class .bg). Opening a book then only brings its frame forward. Each book's own service worker saves its files on the device, so the
     next openings read them from the device. Not done on "save data" connections. */
  function frameOf(id) {
    var b = BOOK[id], f = FR[id];
    if (!f) {
      var wrap = document.createElement('div'); wrap.className = 'aframe';
      wrap.innerHTML = '<div class="aload" role="status"><div class="alc">' + img(b, '', false) + '<p>' + esc(t('read.loading', { t: b.app })) + '</p><span class="spin" aria-hidden="true"></span>' +
        '<div class="aslow" hidden><p>' + esc(t('read.slow')) + '</p><div class="pbtns"><button class="btn sm" type="button" data-retry="' + id + '">' + esc(t('read.retry')) + '</button></div></div></div></div>';
      var fr = document.createElement('iframe');
      var mv = MOVE[id] || moveGet(id);
      fr.title = b.app; fr.src = b.url + (mv ? '#smr-move=' + mv : '');
      if (mv) { delete MOVE[id]; moveDel(id); }
      fr.setAttribute('allow', 'fullscreen; clipboard-read; clipboard-write; autoplay; web-share');
      fr.setAttribute('allowfullscreen', '');
      fr.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      f = FR[id] = { wrap: wrap, fr: fr, loaded: false };
      fr.addEventListener('load', function () { f.loaded = true; var l = wrap.querySelector('.aload'); if (l) l.remove(); tellLang(id, (LS.get('langset', 0) || 0) > (LS.get('lt-' + id, 0) || 0)); LS.set('lt-' + id, Date.now()); });
      f.timer = setTimeout(function () { if (!f.loaded) { var sl = wrap.querySelector('.aslow'); if (sl) sl.hidden = false; } }, 15000);
      wrap.classList.add('bg'); wrap.appendChild(fr); $('#aframes').appendChild(wrap);
    }
    return f;
  }
  function showBook(id) {
    var b = BOOK[id];
    apps.hidden = false; apps.classList.remove('bg'); apps.removeAttribute('aria-hidden');
    frameOf(id).used = Date.now(); prune(id);
    Object.keys(FR).forEach(function (k) { FR[k].wrap.classList.toggle('bg', k !== id); FR[k].wrap.hidden = false; });
    document.title = b.app + ' · Student Master Review';
    noteOpen(id);
  }
  /* the book's Library button follows the platform language when the book has no language setting of its own */
  function tellLang(id, force) { var f = FR[id]; if (!f) return; try { f.fr.contentWindow.postMessage({ smr: 'lang', lang: lang, force: !!force }, new URL(BOOK[id].url).origin); } catch (e) {} }
  /* memory (owner, 12 Nov 2026: "the app is slow"): only the books the student opened stay running, at most the last two; a book loaded in
     the background only to save its files is closed again once that is done */
  function drop(k) { var f = FR[k]; if (!f) return; try { f.wrap.remove(); } catch (e) {} delete FR[k]; }
  function prune(cur) { Object.keys(FR).filter(function (k) { return FR[k].used; }).sort(function (a, b) { return FR[b].used - FR[a].used; })
      .forEach(function (k, i) { if (i >= 2 && k !== cur) drop(k); }); }
  function hideBooks() { if (!apps || apps.classList.contains('bg')) return; if (Object.keys(FR).length) { apps.hidden = false; apps.classList.add('bg'); apps.setAttribute('aria-hidden', 'true'); } else apps.hidden = true; }
  var preT = 0;
  function preload() {
    if (preT || !EMBED) return; preT = 1;   // EMBED: the platform is the top page and can hold the books
    var c = navigator.connection; if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ''))) return;
    var ids = Object.keys(BOOK).filter(function (k) { return BOOK[k].url && BOOK[k].status === 'available'; });
    function next() {
      var id = ids.shift(); if (!id) return;
      if (FR[id]) { next(); return; }
      if (apps.hidden) { apps.hidden = false; apps.classList.add('bg'); apps.setAttribute('aria-hidden', 'true'); }
      var f = frameOf(id), done = false;
      /* the book saves its files on the device while it is open; after that it is closed unless the student opened it meanwhile */
      function go() { if (done) return; done = true; setTimeout(function () { if (FR[id] && !FR[id].used) drop(id); next(); }, 25000); }
      f.fr.addEventListener('load', go); setTimeout(go, 45000);
    }
    (window.requestIdleCallback || function (fn) { setTimeout(fn, 1200); })(next, { timeout: 4000 });
  }
  /* the small button on each book's Home asks to go back to the platform's library */
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.smr !== 'stats') return;
    var id = null; Object.keys(FR).forEach(function (k) { if (FR[k].fr.contentWindow === e.source) id = k; });
    var cs = id && cleanStats(e.data.s); if (!cs) return;
    LS.set('st-' + id, { s: cs, t: Date.now() });
    if (state.base === 'progress') { var y = window.scrollY, op = []; document.querySelectorAll('.pch[open]').forEach(function (d, i) { op.push(d.closest('.pbk') && [].indexOf.call(document.querySelectorAll('.pbk'), d.closest('.pbk'))); });
      $('#main').innerHTML = '<div class="narrow">' + vProgress() + '</div>'; var ps = document.querySelectorAll('.pbk'); op.forEach(function (k) { var d = ps[k] && ps[k].querySelector('.pch'); if (d) d.open = true; }); window.scrollTo(0, y); }
  });
  /* One name and one picture for the platform and its books (owner, 12 Nov 2026). The platform's profile is the one used; a book that already
     has a name or picture gives it to the platform the first time (until the student sets the profile); a change made inside a book comes
     here and goes to the other books. */
  function profMsg() { return { smr: 'profile', name: LS.get('name', '') || '', photo: LS.get('photo', '') || '' }; }
  function hasProf() { return !!(LS.get('profset', 0) || LS.get('name', '') || LS.get('photo', '')); }
  function tellProf(id) { var f = FR[id]; if (!f || !hasProf()) return; try { f.fr.contentWindow.postMessage(profMsg(), new URL(BOOK[id].url).origin); } catch (e) {} }
  function tellProfAll(skip) { Object.keys(FR).forEach(function (k) { if (k !== skip) tellProf(k); }); }
  function profChanged() { LS.set('profset', Date.now()); tellProfAll(); }
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.smr !== 'profile') return;
    var id = null; Object.keys(FR).forEach(function (k) { if (FR[k].fr.contentWindow === e.source) id = k; }); if (!id) return;
    var nm = typeof e.data.name === 'string' ? e.data.name.trim().slice(0, 40) : '';
    var ph = typeof e.data.photo === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(e.data.photo) && e.data.photo.length < 600000 ? e.data.photo : '';
    if (e.data.init) {
      if (!LS.get('profset', 0)) { var ch = false;
        if (nm && !LS.get('name', '')) { LS.set('name', nm); ch = true; }
        if (ph && !LS.get('photo', '')) { LS.set('photo', ph); ch = true; }
        if (ch) { LS.set('profset', Date.now()); refreshProfile(); if (state.base !== 'read') route(true); tellProfAll(id); } }
      tellProf(id); return; }
    if (nm) LS.set('name', nm); else LS.del('name');
    if (ph) LS.set('photo', ph); else LS.del('photo');
    LS.set('profset', Date.now()); refreshProfile(); if (state.base !== 'read') route(true); tellProfAll(id);
  });
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.smr !== 'library' || state.base !== 'read') return;
    var id = state.view.slice(5), b = BOOK[id];
    if (!b || !FR[id] || e.source !== FR[id].fr.contentWindow) return;
    location.hash = readBack(b);
  });

  /* ---------- opening screen: install the app or continue in the browser ----------
     Install follows the device: the browser's own install window where it offers one (Android, computers),
     otherwise the steps for that device (iPhone/iPad: Share → Add to Home Screen; Android in WhatsApp: open in Chrome first). */
  var UA = navigator.userAgent || '';
  var STANDALONE = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  var DEV = /iPad|iPhone|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'ios' : /Android/i.test(UA) ? 'android' : 'pc';
  var IOS_INAPP = DEV === 'ios' && (!/Safari\//.test(UA) || /FBAN|FBAV|Instagram|WhatsApp|Line\//.test(UA));
  var MAC_SAFARI = DEV === 'pc' && /Macintosh/.test(UA) && /Safari\//.test(UA) && !/Chrome|Chromium|Edg|Firefox/.test(UA);
  var FIREFOX = /Firefox\//.test(UA) && DEV === 'pc';
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); window.__bip = e; });
  window.addEventListener('appinstalled', function () { window.__bip = null; LS.set('installed', 1); if (!$('#wel').hidden) welDone(); });
  function wel() { return $('#wel'); }
  function welOpen(html) { $('#wcard').innerHTML = html; wel().hidden = false; document.body.classList.add('welon'); var f = $('#welT'); if (f) { f.setAttribute('tabindex', '-1'); try { f.focus({ preventScroll: true }); } catch (e) {} } }
  function welClose() { wel().hidden = true; document.body.classList.remove('welon'); try { sessionStorage.setItem('smr-wel', '1'); } catch (e) {} }
  function welHead() {
    var n = cleanName(LS.get('name', ''));
    return '<span class="wmark" aria-hidden="true"><span class="mark"></span></span>' +
      '<h2 id="welT">' + (n ? t('w.hin', { n: '<bdi>' + esc(n) + '</bdi>' }) : esc(t('w.hi'))) + '</h2>' +
      '<p class="wbrand" lang="en" dir="ltr">Student Master Review</p><p class="wsub">' + esc(t('w.sub')) + '</p>' +
      (MOVED ? '<p class="wmoved">' + ic('info') + '<span>' + esc(t('w.moved')) + '</span></p>' : '');
  }
  function welcome() {
    if (STANDALONE && !MOVED) {
      welOpen(welHead() + '<div class="wbtns"><button class="btn" type="button" data-wclose data-first>' + esc(t('w.start')) + ic('arrow', 'flip') + '</button></div>');
      return;
    }
    welOpen(welHead() +
      '<div class="wbtns"><button class="btn wbig" type="button" data-install data-first>' + ic(DEV === 'pc' ? 'instpc' : 'download') +
      '<span><b>' + esc(t('w.install')) + '</b><small>' + esc(t('w.on.' + DEV)) + '</small></span></button>' +
      '<button class="btn quiet wbig" type="button" data-wclose>' + ic('browser') + '<span><b>' + esc(t('w.browser')) + '</b></span></button></div>' +
      '<p class="wnote">' + esc(t('w.why')) + '</p>');
  }
  function step(n, txt, icn) {
    return '<li><span class="sn">' + n + '</span><span>' + esc(txt).replace('{i}', icn ? '<span class="si">' + ic(icn) + '</span>' : '') + '</span></li>';
  }
  function guide() {
    var h = '<button class="ib xbtn" type="button" data-wclose aria-label="' + esc(t('close')) + '">' + ic('x') + '</button>' +
      '<span class="wmark sm" aria-hidden="true">' + ic(DEV === 'pc' ? 'instpc' : 'phone') + '</span><h2 id="welT">' + esc(t('i.t.' + DEV)) + '</h2>';
    var st = '', extra = '';
    if (DEV === 'ios') {
      if (IOS_INAPP) st += '<li class="warn"><span>' + esc(t('i.iosapp')).replace('{i}', '<span class="si">' + ic('dots') + '</span>') + '</span></li>';
      st += step(1, t('i.ios1'), 'share') + step(2, t('i.ios2'), 'addsq') + step(3, t('i.ios3'));
      extra = '<button class="btn sm quiet" type="button" data-copy>' + esc(t('i.copy')) + '</button>';
    } else if (DEV === 'android') {
      var u = location.href.replace(/^https?:\/\//, '').replace(/#.*$/, '');
      var intent = 'intent://' + u + '#Intent;scheme=https;package=com.android.chrome;end';
      st += '<li class="warn"><span>' + esc(t('i.and0')) + '</span><a class="btn sm" href="' + esc(intent) + '">' + esc(t('i.chrome')) + '</a></li>';
      st += step(1, t('i.and1'), 'dots') + step(2, t('i.and2'), 'download') + step(3, t('i.and3'));
      extra = '<button class="btn sm quiet" type="button" data-copy>' + esc(t('i.copy')) + '</button>';
    } else if (MAC_SAFARI) {
      st += step(1, t('i.mac'));
    } else if (FIREFOX) {
      st += '<li class="warn"><span>' + esc(t('i.ff')) + '</span></li>';
      extra = '<button class="btn sm quiet" type="button" data-copy>' + esc(t('i.copy')) + '</button>';
    } else {
      st += step(1, t('i.pc1'), 'instpc') + step(2, t('i.pc2'), 'dots');
    }
    welOpen(h + '<ol class="steps">' + st + '</ol><div class="wbtns wrow">' + extra +
      '<button class="btn sm" type="button" data-wclose data-first>' + esc(t('i.ok')) + '</button></div><p class="ok-msg" id="wmsg" role="status" aria-live="polite"></p>');
  }
  /* second step of the greeting (owner, 11 Nov 2026): the app language and the day / night look, shown with the current choice; applied at once */
  function setupStep() {
    var segL = [['ar', 'العربية', 'ar'], ['en', 'English', 'en']].map(function (o) {
      return '<button type="button" data-wlang="' + o[0] + '" lang="' + o[2] + '" aria-pressed="' + (lang === o[0]) + '">' + o[1] + '</button>';
    }).join('');
    var dark = isDark(), segT = [['light', 'sun', 'look.light', !dark], ['dark', 'moon', 'look.dark', dark]].map(function (o) {
      return '<button type="button" data-wlook="' + o[0] + '" aria-pressed="' + o[3] + '">' + ic(o[1]) + '<span>' + esc(t(o[2])) + '</span></button>';
    }).join('');
    welOpen('<span class="wmark" aria-hidden="true"><span class="mark"></span></span><h2 id="welT">' + esc(t('w.setT')) + '</h2>' +
      '<div class="wset"><p class="wlab">' + esc(t('set.lang')) + '</p><div class="wseg">' + segL + '</div>' +
      '<p class="wlab">' + esc(t('set.look')) + '</p><div class="wseg">' + segT + '</div>' +
      '<p class="wlab">' + esc(t('set.color')) + '</p>' + palPick() + '</div>' +
      '<div class="wbtns"><button class="btn" type="button" data-wdone data-first>' + esc(t('w.start')) + ic('arrow', 'flip') + '</button></div>');
  }
  function welNext() { setupStep(); }
  function welDone() {
    welOpen(welHead() + '<p class="ok-msg wdone">' + ic('check') + ' ' + esc(t('i.done')) + '</p><div class="wbtns"><button class="btn" type="button" data-wclose data-first>' + esc(t('w.start')) + '</button></div>');
  }
  function install() {
    var p = window.__bip;
    if (p) {
      p.prompt();
      (p.userChoice || Promise.resolve({})).then(function (r) {
        window.__bip = null;
        if (r && r.outcome === 'accepted') { LS.set('installed', 1); welDone(); }
      });
      return;
    }
    guide();
  }
  function copyLink() {
    var u = location.href.replace(/#.*$/, ''), m = $('#wmsg');
    var done = function () { if (m) m.textContent = t('i.copied'); };
    try { navigator.clipboard.writeText(u).then(done, function () { if (m) m.textContent = u; }); } catch (e) { if (m) m.textContent = u; }
  }
  /* ---------- router ---------- */
  var VIEWS = { home: vHome, 'my-library': vLibrary, progress: vProgress, preferences: vPrefs, notifications: vNotif, search: vSearch };
  var TITLES = { 'my-library': 'nav.library', progress: 'nav.progress', preferences: 'nav.settings', notifications: 'notif.t', search: 'srch.t' };
  function go(v) { if (location.hash.slice(1) === v) route(true); else location.hash = v; }
  function route(force) {
    var v = decodeURIComponent(location.hash.slice(1)) || 'home';
    var readId = /^read-/.test(v) ? v.slice(5) : null;
    if (readId) {
      if (BOOK[readId] && avail(BOOK[readId]) && !EMBED) { location.replace('#' + BOOK[readId].section); return; }
      if (BOOK[readId] && avail(BOOK[readId])) {
        if (state.base !== 'read') state.readFrom = state.base;
        state.view = v; state.base = 'read'; document.body.setAttribute('data-view', 'read');
        if (dlg.open) dlg.close();
        showBook(readId); return;
      }
      v = 'home';
    }
    hideBooks();
    var bookId = /^book-/.test(v) ? v.slice(5) : null;
    if (bookId && !BOOK[bookId]) v = 'home', bookId = null;
    if (!bookId && !VIEWS[v] && !SEC[v]) v = 'home';
    var base = bookId ? (state.fromList && state.view === state.fromList ? state.fromList : BOOK[bookId].section) : v;
    var prevBase = state.base;
    state.view = v; state.base = base;
    document.body.setAttribute('data-view', base);
    if (force || base !== prevBase) {
      var m = $('#main');
      m.innerHTML = SEC[base] ? vSection(base) : base === 'home' ? vHome() : '<div class="narrow">' + VIEWS[base]() + '</div>';
      if (base === 'search') { fillSearchPage(); bindSearchPage(); }
      if (base === 'preferences') bindPrefs();
      if (base === 'progress') Object.keys(FR).forEach(function (k) { try { FR[k].fr.contentWindow.postMessage({ smr: 'getStats' }, new URL(BOOK[k].url).origin); } catch (e) {} });
      document.title = (base === 'home' ? '' : (SEC[base] ? t(SEC[base].key + '.t') : t(TITLES[base])) + ' · ') + 'Student Master Review';
      if (!force && prevBase !== undefined) {
        window.scrollTo(0, 0);
        var h1 = m.querySelector('h1'); if (h1 && base !== 'search') try { h1.focus({ preventScroll: true }); } catch (e) {}
      }
    }
    markNav(base);
    if (bookId) openBook(bookId); else if (dlg.open) dlg.close();
  }
  function bindSearchPage() {
    var q = $('#qpage'); if (!q) return;
    q.addEventListener('input', function () { state.q = q.value; fillSearchPage(); });
    setTimeout(function () { try { q.focus(); } catch (e) {} }, 30);
  }
  function bindPrefs() {
    var n = $('#pf-name'), ok = $('#pf-ok'), tm;
    n.addEventListener('input', function () {
      clearTimeout(tm);
      tm = setTimeout(function () {
        var v = n.value.trim(); if (v) LS.set('name', v); else LS.del('name');
        ok.textContent = t('set.saved'); refreshProfile(); profChanged();
      }, 350);
    });
    var f = $('#pf-photo');
    f.addEventListener('change', function () {
      var file = f.files && f.files[0]; if (!file) return;
      var rd = new FileReader();
      rd.onload = function () {
        var im = new Image();
        im.onload = function () {
          var s = 320, c = document.createElement('canvas'); c.width = c.height = s;
          var k = Math.min(im.width, im.height), x = c.getContext('2d');
          x.drawImage(im, (im.width - k) / 2, (im.height - k) / 2, k, k, 0, 0, s, s);
          if (LS.set('photo', c.toDataURL('image/jpeg', 0.86))) { ok.textContent = t('set.saved'); route(true); refreshProfile(); profChanged(); }
        };
        im.src = rd.result;
      };
      rd.readAsDataURL(file);
    });
    document.querySelectorAll('label.btn[for="pf-photo"]').forEach(function (l) { l.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f.click(); } }); });
    var rm = $('#pf-rm'); if (rm) rm.addEventListener('click', function () { LS.del('photo'); route(true); refreshProfile(); profChanged(); });
    $('#clr').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; var box = $('#clr');
      if (b.id === 'clr1') box.innerHTML = '<button class="btn sm" type="button" id="clr2">' + esc(t('set.clear.ok')) + '</button><button class="btn sm quiet" type="button" id="clr0">' + esc(t('cancel')) + '</button>';
      else if (b.id === 'clr0') box.innerHTML = '<button class="btn sm quiet" type="button" id="clr1">' + esc(t('set.clear')) + '</button>';
      else if (b.id === 'clr2') { LS.del('recent'); LS.del('saved'); box.innerHTML = '<span class="ok-msg" role="status">' + esc(t('set.cleared')) + '</span>'; }
    });
  }
  function refreshProfile() {
    var pc = $('.pchip'); if (pc) pc.innerHTML = avatar() + '<span class="pn"><bdi>' + esc(displayName()) + '</bdi></span>';
    var pa = $('#pfav'); if (pa) pa.innerHTML = avatar(true);
  }

  /* ---------- global events ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a,button'); if (!a) return;
    if (a.hasAttribute('data-open')) noteOpen(a.getAttribute('data-open'));
    if (a.hasAttribute('data-book')) { state.cameIn = true; state.fromList = state.base === 'my-library' || state.base === 'search' ? state.base : false; }
    if (a.id === 'thb') { var mn = $('#tmenu'), op = mn.hidden; mn.hidden = !op; a.setAttribute('aria-expanded', op ? 'true' : 'false'); if (op) { var cur = mn.querySelector('[aria-pressed="true"]'); if (cur) cur.focus(); } return; }
    if (a.hasAttribute('data-look')) { setTheme(a.getAttribute('data-look')); closeMenu(); var tb = $('#thb'); if (tb) tb.focus(); }
    if (a.id === 'lbtn') setLang(lang === 'ar' ? 'en' : 'ar');
    if (a.hasAttribute('data-lang')) setLang(a.getAttribute('data-lang'));
    if (a.hasAttribute('data-theme')) { setTheme(a.getAttribute('data-theme')); a.parentNode.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === a ? 'true' : 'false'); }); }
    if (a.hasAttribute('data-install')) { install(); return; }
    if (a.hasAttribute('data-wclose')) { welNext(); return; }
    if (a.hasAttribute('data-wdone')) { LS.set('setup', 1); welClose(); return; }
    if (a.hasAttribute('data-wlang')) { setLang(a.getAttribute('data-wlang')); setupStep(); return; }
    if (a.hasAttribute('data-wlook')) { setTheme(a.getAttribute('data-wlook')); setupStep(); return; }
    if (a.hasAttribute('data-pal')) { setPal(a.getAttribute('data-pal')); return; }
    if (a.hasAttribute('data-copy')) { copyLink(); return; }
    if (a.hasAttribute('data-close')) closeBook();
    if (a.hasAttribute('data-retry')) { var rf = FR[a.getAttribute('data-retry')]; if (rf) { rf.wrap.querySelector('.aslow').hidden = true; rf.fr.src = BOOK[a.getAttribute('data-retry')].url; } }
    if (a.id === 'svb') {
      var id = state.view.slice(5), s = saved(), i = s.indexOf(id);
      if (i >= 0) s.splice(i, 1); else s.unshift(id);
      LS.set('saved', s); var on = i < 0;
      a.setAttribute('aria-pressed', on); a.innerHTML = ic(on ? 'check' : 'bookmark') + '<span>' + esc(t(on ? 'saved' : 'save')) + '</span>';
      if (state.base === 'my-library') route(true);
    }
    if (a.id === 'skip') { var m = $('#main h1') || $('#main'); try { m.focus(); } catch (er) {} }
  });
  function closeMenu() { var mn = $('#tmenu'), tb = $('#thb'); if (mn && !mn.hidden) { mn.hidden = true; if (tb) tb.setAttribute('aria-expanded', 'false'); } }
  document.addEventListener('click', function (e) { if (!e.target.closest('.thm')) closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('#tmenu') && !$('#tmenu').hidden) { closeMenu(); var tb = $('#thb'); if (tb) tb.focus(); } });
  window.addEventListener('hashchange', function () { route(false); });

  /* ---------- start ---------- */
  dlg = $('#sheet'); apps = $('#apps');
  setTimeout(preload, 700);   // the books load in the background from the first opening
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); closeBook(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) closeBook(); });
  applyLang(); chrome(); route(true);
  /* the opening screen once per opening of the link (not again while moving around) */
  var seenWel = false; try { seenWel = sessionStorage.getItem('smr-wel') === '1'; } catch (e) {}
  if (!seenWel && !/^read-/.test(location.hash.slice(1))) welcome();
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !wel().hidden) welClose(); });
  if ('serviceWorker' in navigator && location.protocol === 'https:') { try { navigator.serviceWorker.register('sw.js'); } catch (e) {} }
})();
