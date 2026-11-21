/* Master Review: the speciality screen (#pick) and the section screen (#pick-section) in the owner's green and gold design
   (20 Nov 2026, his pictures). They replace the older versions of these two pages in student.js (registered again here, so this file
   loads after student.js). Styles: css/mr.css. No app top bar, side menu or bottom tabs here: the «Features» button opens every place. */
(function () {
  var A = IS.A, esc = IS.esc, ic = IS.ic, N = IS.N;
  var G = 'url(#mrg)', CR = 'url(#mrcr)';
  function svg(vb, body, extra) { return '<svg class="ic" viewBox="' + vb + '" aria-hidden="true"' + (extra || '') + '>' + body + '</svg>'; }
  var DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    '<linearGradient id="mrg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4c8"/><stop offset=".5" stop-color="#ecc56b"/><stop offset="1" stop-color="#b8862b"/></linearGradient>' +
    '<linearGradient id="mrcr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff8e6"/><stop offset="1" stop-color="#ecd9a6"/></linearGradient>' +
    '<linearGradient id="mrbl" x1="0" x2="1"><stop offset="0" stop-color="#3dff8a" stop-opacity="0"/><stop offset=".5" stop-color="#4dff96"/><stop offset="1" stop-color="#3dff8a" stop-opacity="0"/></linearGradient></defs></svg>';
  var I = {
    home: svg('0 0 24 24', '<path d="M12 3 2 11.5h3V21h5.2v-6h3.6v6H19v-9.5h3z"/>', ' fill="' + G + '"'),
    person: svg('0 0 24 24', '<circle cx="12" cy="7.5" r="4"/><path d="M4 22c0-5 3.6-8 8-8s8 3 8 8z"/><path d="M9.2 14.6 12 18l2.8-3.4" fill="#f6ecd0"/>', ' fill="#0d5a3c"'),
    bell: svg('0 0 24 24', '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.6 2H4.4z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>', ' fill="none" stroke="' + G + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'),
    sun: '<svg class="ic sun" viewBox="0 0 24 24" fill="' + G + '"><circle cx="12" cy="12" r="4.6"/><g stroke="' + G + '" stroke-width="2" stroke-linecap="round"><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7"/></g></svg>',
    moon: '<svg class="ic moon" viewBox="0 0 24 24" fill="' + G + '"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
    gear: svg('0 0 24 24', '<path d="M10.3 2h3.4l.5 2.7a7.6 7.6 0 0 1 1.9 1.1l2.6-.9 1.7 2.9-2.1 1.8a7.4 7.4 0 0 1 0 2.2l2.1 1.8-1.7 2.9-2.6-.9a7.6 7.6 0 0 1-1.9 1.1l-.5 2.7h-3.4l-.5-2.7a7.6 7.6 0 0 1-1.9-1.1l-2.6.9-1.7-2.9 2.1-1.8a7.4 7.4 0 0 1 0-2.2L3.6 7.8l1.7-2.9 2.6.9a7.6 7.6 0 0 1 1.9-1.1zM12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z" fill-rule="evenodd"/>', ' fill="' + G + '"'),
    globe: svg('0 0 24 24', '<circle cx="12" cy="12" r="9.4"/><path d="M2.6 12h18.8M12 2.6c3 3 3.8 6 3.8 9.4s-.8 6.4-3.8 9.4M12 2.6c-3 3-3.8 6-3.8 9.4s.8 6.4 3.8 9.4M4.2 7h15.6M4.2 17h15.6"/>', ' fill="none" stroke="' + G + '" stroke-width="1.8"'),
    studio: svg('0 0 24 24', '<rect x="7" y="3.5" width="15" height="10.5" rx="1.6" fill="none" stroke="' + G + '" stroke-width="1.8"/><path d="M13 6.6v5l4-2.5z" fill="' + G + '"/><circle cx="4.6" cy="9.6" r="2.4" fill="' + G + '"/><path d="M1 20c0-3.6 1.6-6 3.6-6s3.6 2.4 3.6 6z" fill="' + G + '"/><path d="M9 20.5h14" stroke="' + G + '" stroke-width="1.8" stroke-linecap="round"/>'),
    admin: svg('0 0 24 24', '<circle cx="9" cy="7" r="3.2"/><path d="M2.5 19c0-4 2.9-6.5 6.5-6.5 1.6 0 3 .5 4.1 1.3a6 6 0 0 0-1.1 5.2z"/><circle cx="16.6" cy="6" r="2.4" opacity=".85"/><path d="M19.3 13.4l.4 1.3 1.3.4v1.4l-1.3.4-.4 1.3 1 .9-1 1-1-.6-1.2.6-.4 1.3h-1.4l-.4-1.3-1.2-.6-1 .6-1-1 .6-1.1-.6-1.2-1.3-.4v-1.4l1.3-.4.6-1.2-.6-1 1-1 1 .6 1.2-.6.4-1.3h1.4l.4 1.3 1.2.6 1-.6 1 1zM16.8 15a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z" fill-rule="evenodd"/>', ' fill="' + G + '"'),
    terms: svg('0 0 24 24', '<path d="M14.5 2.5H5.6a1.6 1.6 0 0 0-1.6 1.6v15.8a1.6 1.6 0 0 0 1.6 1.6h8.2M14.5 2.5 19 7v5"/><path d="M14.5 2.5V7H19M7.6 10h7.8M7.6 13.4h7.8M7.6 16.8h4"/><path d="m15 19 2.2 2.2 4.4-4.6"/>', ' fill="none" stroke="' + G + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"'),
    star: svg('0 0 24 24', '<path d="M12 2.5l2.9 6.2 6.6.7-5 4.5 1.4 6.6L12 17.2l-5.9 3.3 1.4-6.6-5-4.5 6.6-.7z"/>', ' fill="' + G + '"'),
    steth: svg('0 0 24 24', '<path d="M6 3v5a5 5 0 0 0 10 0V3"/><path d="M11 13v2a5 5 0 0 0 10 0v-1"/><circle cx="21" cy="12" r="2"/>', ' fill="none" stroke="' + G + '" stroke-width="2" stroke-linecap="round"'),
    laurel: '<g fill="' + G + '"><path d="M30 78C12 66 6 44 14 18" fill="none" stroke="' + G + '" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="22" cy="18" rx="3.4" ry="8" transform="rotate(30 22 18)"/><ellipse cx="18" cy="30" rx="3.4" ry="8" transform="rotate(45 18 30)"/><ellipse cx="17" cy="43" rx="3.4" ry="8" transform="rotate(58 17 43)"/><ellipse cx="19" cy="56" rx="3.4" ry="8" transform="rotate(70 19 56)"/><ellipse cx="7" cy="25" rx="3" ry="7" transform="rotate(-20 7 25)"/><ellipse cx="5" cy="39" rx="3" ry="7" transform="rotate(-10 5 39)"/><ellipse cx="7" cy="53" rx="3" ry="7" transform="rotate(5 7 53)"/></g>',
    // section signs (dark green on the cream pill)
    layers: svg('0 0 24 24', '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/><path d="m3 17.5 9 4.5 9-4.5"/>', ' fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"'),
    kit: svg('0 0 24 24', '<rect x="2.5" y="7" width="19" height="13.5" rx="2.4"/><path d="M8.5 7V5a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 5v2M12 10.5v6M9 13.5h6"/>', ' fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"'),
    world: svg('0 0 24 24', '<circle cx="12" cy="12" r="9.4"/><path d="M2.6 12h18.8M12 2.6c3 3 3.8 6 3.8 9.4s-.8 6.4-3.8 9.4M12 2.6c-3 3-3.8 6-3.8 9.4s.8 6.4 3.8 9.4"/>', ' fill="none" stroke="currentColor" stroke-width="1.9"'),
    doc: svg('0 0 24 24', '<circle cx="12" cy="7" r="3.8"/><path d="M4.5 21c0-4.4 3.4-7.4 7.5-7.4s7.5 3 7.5 7.4z"/><path d="M10 14l2 3 2-3"/>', ' fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"')
  };
  /* speciality signs drawn in gold (64 × 64) */
  var SPIC = {
    medicine: svg('0 0 64 64', '<path d="M22 6v14a10 10 0 0 0 20 0V6"/><circle cx="22" cy="6" r="2" fill="' + G + '"/><circle cx="42" cy="6" r="2" fill="' + G + '"/><path d="M32 30v8a8 8 0 0 0 16 0v-4"/><circle cx="48" cy="29" r="5"/><path d="M6 48c9-4 18-4 26 2 8-6 17-6 26-2v10c-9-4-18-4-26 2-8-6-17-6-26-2z" fill="' + G + '" stroke="none"/><path d="M32 50v10" stroke="#0a4630" stroke-width="1.6"/>', ' fill="none" stroke="' + G + '" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"'),
    lab: svg('0 0 64 64', '<path d="M14 8h14M17 8v16L6 50a4 4 0 0 0 4 6h22"/><path d="M10 46h16l3 6H8z" fill="' + G + '" stroke="none" opacity=".9"/><rect x="34" y="20" width="8" height="34" rx="4"/><rect x="46" y="16" width="8" height="38" rx="4"/><path d="M35 40h6v10a3 3 0 0 1-6 0zM47 34h6v16a3 3 0 0 1-6 0z" fill="' + G + '" stroke="none"/><circle cx="34" cy="9" r="2" fill="' + G + '" stroke="none"/><circle cx="41" cy="5" r="1.6" fill="' + G + '" stroke="none"/><circle cx="46" cy="10" r="1.4" fill="' + G + '" stroke="none"/>', ' fill="none" stroke="' + G + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"'),
    nursing: svg('0 0 64 64', '<path d="M8 34c2-14 12-22 24-22s22 8 24 22c-8 4-16 6-24 6S16 38 8 34z" fill="' + G + '"/><path d="M10 38c7 3 14 4 22 4s15-1 22-4l-2 10c-6 2-13 3-20 3s-14-1-20-3z" fill="' + G + '" opacity=".85"/><path d="M29 18h6v6h6v6h-6v6h-6v-6h-6v-6h6z" fill="#0a4630"/>'),
    dentistry: svg('0 0 64 64', '<path d="M20 10c-7 0-11 6-11 13 0 8 3 12 5 20 2 9 4 15 8 15 5 0 4-14 10-14s5 14 10 14c4 0 6-6 8-15 2-8 5-12 5-20 0-7-4-13-11-13-5 0-7 3-12 3s-7-3-12-3z" fill="' + G + '"/><ellipse cx="32" cy="34" rx="28" ry="9" fill="none" stroke="' + G + '" stroke-width="2.6" transform="rotate(-14 32 34)"/><path d="M54 4l1.6 5 5 1.6-5 1.6L54 17l-1.6-4.8-5-1.6 5-1.6z" fill="' + G + '"/>'),
    pharmacy: svg('0 0 64 64', '<path d="M40 30 56 6a3.5 3.5 0 0 1 5 4L46 32z" fill="' + G + '"/><path d="M14 22c4-6 12-6 16-2-6 1-10 3-16 2z" fill="#3ca35a"/><path d="M4 30h56c0 13-10 22-24 23v4h8v5H20v-5h8v-4C14 52 4 43 4 30z" fill="' + G + '"/><path d="M29 34h6v5h5v6h-5v5h-6v-5h-5v-6h5z" fill="#0a4630"/>')
  };
  var SHORT = { lab: 'Laboratory' };
  /* section names of each speciality (owner, 20 Nov 2026: "name the different section of each speciality; medicine is ok") */
  var SECNAME = {
    lab: { clinical: ['التشخيص المخبري', 'Diagnostics'], house: ['فترة الامتياز', 'Internship'] },
    nursing: { clinical: ['التمريض الإكلينيكي', 'Clinical Nursing'], house: ['فترة الامتياز', 'Internship'] },
    dentistry: { clinical: ['طب الأسنان الإكلينيكي', 'Clinical Dentistry'], house: ['فترة الامتياز', 'Internship'] },
    pharmacy: { clinical: ['الممارسة الصيدلانية', 'Pharmacy Practice'], house: ['فترة الامتياز', 'Internship'] }
  };
  IS.secName = function (spec, c) { var n = c && (SECNAME[spec] || {})[c.id]; return n ? Object.assign({}, c, { ar: n[0], en: n[1] }) : c; };
  var mySection0 = IS.mySection;
  IS.mySection = function () { return IS.secName(IS.SPEC, mySection0.apply(this, arguments)); };
  var SECIC = { basics: 'layers', clinical: 'kit', special: 'world', house: 'doc' };
  var SECORDER = ['basics', 'clinical', 'special', 'house'];
  var WAVE = '<svg class="wave" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 34C40 6 90 6 120 22s60 22 80 0V100H0z" fill="' + CR + '"/></svg>';

  function top(homeHref) {
    var m = IS.ME;
    var me = m ? '<a class="mr-me" href="#account"><span class="mr-av">' + (m.photo ? '<img src="' + IS.U(m.photo) + '" alt="">' : I.person) + '</span><b>' + IS.greetingName(m.name, true) + '</b></a>' :
      '<button type="button" class="mr-me out" data-act="login"><span class="mr-av">' + I.person + '</span><b>' + esc(A('دخول', 'Sign in')) + '</b></button>';
    return '<header class="mr-top"><div class="mr-tl"><a class="mr-rb" href="' + homeHref + '" aria-label="' + esc(A('الرئيسية', 'Home')) + '">' + I.home + '</a><span class="mr-sep"></span>' + me + '</div>' +
      '<a class="mr-brand" href="#pick" aria-label="' + esc(IS.brandName()) + '"><img src="' + IS.U('img/mr/logo-smra.webp') + '" alt="' + esc(IS.brandName()) + '" width="1000" height="359"></a>' +
      '<div class="mr-tr">' + (m ? '<a class="mr-rb" href="#notifications" aria-label="' + esc(A('الإشعارات', 'Notifications')) + '">' + I.bell + '<i class="mr-dot" hidden></i></a>' : '') +
      '<button type="button" class="mr-rb mr-theme" data-act="theme" aria-label="' + esc(A('الوضع النهاري أو الليلي', 'Day or night')) + '">' + I.sun + I.moon + I.eye + '</button>' +
      '<a class="mr-rb" href="#settings" aria-label="' + esc(A('الإعدادات', 'Settings')) + '">' + I.gear + '</a></div></header>';
  }
  function hello() {
    var m = IS.ME, t = m ? esc(A('مرحبًا ', 'Welcome ')) + IS.greetingName(m.name, true) : esc(A('مرحبًا بك يا دكتور', 'Welcome Doctor'));
    var l = '<svg class="mr-laurel" viewBox="0 0 40 80" aria-hidden="true">' + I.laurel + '</svg>';
    return '<div class="mr-hello">' + l + '<h1 tabindex="-1">' + t + '</h1>' + l.replace('mr-laurel', 'mr-laurel r') + '</div>' +
      '<svg class="mr-beat" viewBox="0 0 520 30" preserveAspectRatio="none" aria-hidden="true"><path d="M0 16h228l8-10 10 22 10-26 9 20 6-6h249" fill="none" stroke="url(#mrbl)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 4px #4dff96)"/></svg>';
  }
  function choose(ar, en) { return '<div class="mr-choose"><i></i><h2>' + I.steth + '<span>' + esc(A(ar, en)) + '</span></h2><i></i></div>'; }
  function dock(features) {
    var b = [['lang', I.globe, A('اللغة', 'Language')],
      ['#' + (IS.LEC ? 'studio' : 'studio-apply'), I.studio, A('الاستوديو', 'Studio')],
      ['#terms', I.terms, A('الشروط', 'Terms')],
      IS.team && IS.team() ? ['#control', I.admin, A('الإدارة', 'Admin')] : null,
      features ? ['mrfeat', I.star, A('المزايا', 'Features')] : null].filter(Boolean);
    return '<nav class="mr-dock" aria-label="' + esc(A('أزرار', 'Actions')) + '">' + b.map(function (x) {
      return x[0].charAt(0) === '#' ? '<a class="mr-act" href="' + x[0] + '">' + x[1] + '<span>' + esc(x[2]) + '</span></a>' :
        '<button type="button" class="mr-act" data-act="' + x[0] + '">' + x[1] + '<span>' + esc(x[2]) + '</span></button>';
    }).join('') + '</nav>';
  }
  function after() {
    /* the red dot follows the top bar's notification count (IS.bell fills #bellN) */
    var tick = function () { var n = document.getElementById('bellN'), d = document.querySelector('.mr-dot'); if (d) d.hidden = !(n && !n.hidden); };
    tick(); setTimeout(tick, 1500); setTimeout(tick, 4000);
  }


  /* only Medicine is open for now; the other specialities show a lock and «قريبًا» for everyone except the platform owner (owner, 21 Nov 2026) */
  var LOCK = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.2" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>';
  function isOwner() { return !!(IS.ME && (IS.ME.team || []).indexOf('owner') >= 0); }
  function specLocked(id) { return id !== 'medicine' && !isOwner(); }
  IS.specLocked = specLocked;
  var setspec0 = IS.ACT.setspec;
  IS.ACT.setspec = function (b) {
    if (specLocked(b.getAttribute('data-v'))) { if (IS.toast) IS.toast(A('هذا التخصص قريبًا إن شاء الله', 'This speciality is coming soon')); return; }
    return setspec0 ? setspec0(b) : undefined;
  };

  /* ---------- the speciality screen ---------- */
  IS.page('pick', async function () {
    var cur = IS.SPEC, specs = IS.SPECS;
    IS.after = after;
    return '<div class="mrx"><div class="mr-bg" aria-hidden="true"></div>' + DEFS + '<div class="mr-page">' +
      top(cur && IS.mySection && IS.mySection() ? '#home' : '#pick') + hello() + choose('اختر تخصصك', 'Choose your speciality') +
      '<nav class="mr-specs n' + specs.length + '" aria-label="' + esc(A('التخصصات', 'Specialities')) + '">' + specs.map(function (s) {
        var locked = specLocked(s.id);
        return '<button type="button" class="mr-spec' + (locked ? ' locked' : '') + '" data-act="setspec" data-v="' + esc(s.id) + '" aria-pressed="' + (s.id === cur) + '"' + (locked ? ' aria-disabled="true"' : '') + '><span class="art">' + (SPIC[s.id] || ic(s.icon)) + '</span>' +
          (locked ? '<span class="mr-lockb" aria-hidden="true">' + LOCK + '</span><span class="mr-soon">' + esc(A('قريبًا', 'Coming soon')) + '</span>' : '') +
          '<span class="lab">' + WAVE + '<b lang="en" dir="ltr">' + esc(SHORT[s.id] || s.en) + '</b></span></button>';
      }).join('') + '</nav>' + dock(false) + '</div></div>';
  });

  /* ---------- the section screen ---------- */
  IS.page('pick-section', async function () {
    var spec = IS.mySpec(), current = IS.mySection();
    if (!spec) { IS.go('pick'); return ''; }
    var cats = IS.CATS.slice().sort(function (a, b) { var x = SECORDER.indexOf(a.id), y = SECORDER.indexOf(b.id); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y); });
    IS.after = after;
    return '<div class="mrx sec"><div class="mr-bg" aria-hidden="true"></div>' + DEFS + '<div class="mr-page">' +
      top('#pick') + hello() + choose('اختر قسمك', 'Choose your section') +
      '<nav class="mr-secs" aria-label="' + esc(A('الأقسام', 'Sections')) + '">' + cats.map(function (c) {
        var img = spec.id === 'medicine' && SECORDER.indexOf(c.id) >= 0 ? 'img/mr/sec-medicine-' + c.id + '.webp' : (IS.studyArtwork(spec.id, c.id) || spec.img || '');
        return '<a class="mr-sec" href="#home" data-act="setsection" data-v="' + esc(c.id) + '"' + (current && current.id === c.id ? ' aria-current="true"' : '') + '>' +
          '<span class="pic">' + (img ? '<img src="' + IS.U(img) + '" alt="">' : '') + '</span>' +
          '<span class="pill">' + (I[SECIC[c.id]] || ic(c.icon)) + '<b lang="en" dir="ltr">' + esc(c.id === 'special' ? 'International' : IS.secName(spec.id, c).en) + '</b></span></a>';
      }).join('') + '</nav>' + dock(true) + '</div></div>';
  });

  /* ---------- the section's own page (#home): owner's picture, 20 Nov 2026 — banner, «محتوى …» title, Sort · Post type · Publish, the posts.
     The old welcome band, search and the row of place buttons are gone from here: every place is inside Features. ---------- */
  var HI = {
    search: svg('0 0 24 24', '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>', ' fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"'),
    grid: svg('0 0 24 24', '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="3.75"/>', ' fill="currentColor"'),
    home: svg('0 0 24 24', '<path d="M12 3 2 11.5h3V21h5.2v-6h3.6v6H19v-9.5h3z"/>', ' fill="currentColor"'),
    bell: svg('0 0 24 24', '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.6 2H4.4z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>', ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'),
    sort: svg('0 0 24 24', '<path d="M4 7h16M7 12h10M10 17h4"/>', ' fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"'),
    doc: svg('0 0 24 24', '<path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3v5h5M8.5 12.5h7M8.5 16h7"/>', ' fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"'),
    plus: svg('0 0 24 24', '<path d="M12 5v14M5 12h14"/>', ' fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"'),
    layers: svg('0 0 24 24', '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/><path d="m3 17.5 9 4.5 9-4.5"/>', ' fill="none" stroke="' + G + '" stroke-width="1.9" stroke-linejoin="round"')
  };
  var SECAR = { basics: 'الأساسيات', clinical: 'الكلينكال', special: 'الامتحانات الدولية', house: 'الامتياز' };
  function htop() {
    var m = IS.ME;
    var me = m ? '<a class="mh-av" href="#account" aria-label="' + esc(A('حسابي', 'My account')) + '">' + (m.photo ? '<img src="' + IS.U(m.photo) + '" alt="">' : I.person) + '</a>' :
      '<button type="button" class="mh-in" data-act="login">' + esc(A('دخول', 'Sign in')) + '</button>';
    return '<header class="mh-top"><div class="mh-side">' +
      /* Home = the section's page; on that page it goes up to the section chooser (owner, 20 Nov 2026: "from the library how do I go back to Clinical") */
      (function () { var onHome = document.body.getAttribute('data-page') === 'home' || /^#?home$/.test(location.hash.replace(/^#/, '') || 'home');
        return '<a class="mh-b" href="#' + (onHome ? 'pick-section' : 'home') + '" aria-label="' + esc(onHome ? A('الأقسام', 'Sections') : A('الرئيسية', 'Home')) + '">' + HI.home + '</a>'; })() +
      '<a class="mh-b ghost" href="#search" aria-label="' + esc(A('بحث', 'Search')) + '">' + HI.search + '</a>' +
      '<button type="button" class="mh-b ghost" data-act="mrfeat" aria-label="' + esc(A('المزايا', 'Features')) + '">' + HI.grid + '</button></div>' +
      '<a class="mh-logo" href="#pick-section"><img src="' + IS.U('img/mr/logo-smra.webp') + '" alt="' + esc(IS.brandName()) + '" width="1000" height="359"></a>' +
      '<div class="mh-side end"><button type="button" class="mh-tog" data-act="theme" aria-label="' + esc(A('الوضع النهاري أو الليلي', 'Day or night')) + '"><i class="t-l">' + I.sun + '</i><i class="t-d">' + I.moon + '</i><i class="t-e">' + I.eye + '</i></button>' +
      (m ? '<a class="mh-b" href="#notifications" aria-label="' + esc(A('الإشعارات', 'Notifications')) + '">' + HI.bell + '<i class="mr-dot" hidden></i></a>' : '') + me + '</div></header>';
  }
  function pban(img, icon, title, sub, latin) {
    return '<section class="mh-ban' + (latin ? '' : ' ar') + '"><div class="ph">' + (img ? '<img src="' + IS.U(img) + '" alt="">' : '') + '</div>' +
      '<div class="pn"><svg class="cv" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M30 0C14 30 22 70 0 100H100V0z" fill="url(#mhpn)"/><path d="M30 0C14 30 22 70 0 100" fill="none" stroke="' + G + '" stroke-width="1.4" vector-effect="non-scaling-stroke"/>' +
      '<defs><linearGradient id="mhpn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d6b5c"/><stop offset="1" stop-color="#063f36"/></linearGradient></defs></svg>' +
      '<div class="tx"><svg class="mhb" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true"><path d="M0 12h80l5-7 6 13 6-15 5 11 4-2h94" fill="none" stroke="#7fffe0" stroke-width="1.6" stroke-linejoin="round" style="filter:drop-shadow(0 0 3px #4dffd2)"/></svg>' +
      '<h1 tabindex="-1"' + (latin ? ' lang="en" dir="ltr"' : ' dir="auto"') + '>' + icon + '<span>' + esc(title) + '</span></h1><p' + (latin ? ' lang="en" dir="ltr"' : ' dir="auto"') + '>' + sub + '</p></div></div></section>';
  }
  function hban(spec, section) {
    var img = spec.id === 'medicine' ? 'img/collection/medicine-' + section.id + '.webp' : (IS.studyArtwork(spec.id, section.id) || spec.img || '');
    var name = section.id === 'special' ? 'International' : IS.secName(spec.id, section).en;
    return pban(img, I.steth, name, esc(spec.en) + ' <i>•</i> Study <i>•</i> Review <i>•</i> Practice', true).replace('class="mh-ban"', 'class="mh-ban hs"');
  }
  function ptitle(text) { return '<div class="mh-title"><i></i><h2>' + HI.layers + '<span>' + esc(text) + '</span></h2><i></i></div>'; }
  function htitle(spec, section) {
    var n = IS.secName(spec.id, section), ar = (SECNAME[spec.id] || {})[section.id] ? n.ar : (SECAR[section.id] || n.ar);
    return ptitle(A('محتوى ' + ar, (section.id === 'special' ? 'International' : n.en) + ' content'));
  }
  function tidyFeed(main) {
    var slot = main.querySelector('[data-home-feed]'); if (!slot) return;
    function fix() {
      var f = slot.querySelector('.feed-filters'); if (!f || f.dataset.mh) return; f.dataset.mh = '1';
      var ls = f.querySelectorAll('label');
      if (ls[0]) ls[0].insertAdjacentHTML('afterbegin', HI.sort);
      if (ls[1]) ls[1].insertAdjacentHTML('afterbegin', HI.doc);
      f.insertAdjacentHTML('beforeend', '<i class="mh-sep"></i><a class="mh-pub" href="#community/new">' + HI.plus + '<span>' + esc(A('انشر', 'Publish')) + '</span></a>');
    }
    fix(); new MutationObserver(fix).observe(slot, { childList: true, subtree: true });
  }

  /* ---------- bottom bar on the new pages (owner, 20 Nov 2026: "don't forget the buttons at the bottom: Library, Courses, Community,
     Lecturers and My learning") ---------- */
  var NAV = [['home', 'home', 'الرئيسية', 'Home'], ['library', 'open', 'مكتبتي', 'Library'], ['courses', 'layers', 'الكورسات', 'Courses'], ['community', 'group', 'المجتمع', 'Community'],
    ['lecturers', 'users', 'المحاضرون', 'Lecturers'], ['learning', 'bookmark', 'تعلّمي', 'Learning']];
  function bnav(cur) {
    return '<nav class="mh-nav" aria-label="' + esc(A('التنقل', 'Navigation')) + '">' + NAV.map(function (n) {
      return '<a href="#' + n[0] + '"' + (n[0] === cur ? ' class="on" aria-current="page"' : '') + '>' + ic(n[1]) + '<span>' + esc(A(n[2], n[3])) + '</span></a>'; }).join('') + '</nav>';
  }
  var home0 = IS.pageOf && IS.pageOf('home');
  if (home0) IS.page('home', async function (arg) {
    var inner = await home0.fn(arg), spec = IS.mySpec(), section = IS.mySection();
    if (!spec || !section) return inner;
    var a0 = IS.after;
    var fkey = 'mr-feed:' + (IS.ME ? IS.ME.id : 'x') + ':' + spec.id + '/' + section.id + ':' + IS.lang;
    IS.after = function (main, remember) {
      after();
      var r = a0 ? a0(main, remember) : undefined, slot = main.querySelector('[data-home-feed]');
      /* no waiting (owner, 20 Nov 2026: "I keep feeling this delay"): the last posts of this section show at once from the phone, and the
         fresh ones replace them quietly when they arrive */
      try { var kept = localStorage.getItem(fkey); if (kept && slot && slot.querySelector('.home-feed-status')) slot.innerHTML = '<div data-stale>' + kept + '</div>'; } catch (e) {}
      tidyFeed(main);
      if (slot) { var tm; new MutationObserver(function () { clearTimeout(tm); tm = setTimeout(function () {
        if (slot.isConnected && slot.getAttribute('aria-busy') !== 'true' && !slot.querySelector('[data-stale]') && slot.querySelector('.section-feed .feed-items'))
          try { localStorage.setItem(fkey, slot.innerHTML.slice(0, 350000)); } catch (e) {}
      }, 900); }).observe(slot, { childList: true, subtree: true }); }
      return r;
    };
    return '<div class="mrx mrh"><div class="mh-bg" aria-hidden="true"></div>' + DEFS + '<div class="mh-page">' + htop() + hban(spec, section) + htitle(spec, section) + '<div class="mh-feed">' + inner + '</div></div>' + bnav('home') + '</div>';
  }, home0.o);

  /* ---------- one day/night button: each press = Day → Night → Eye comfort (owner, 20 Nov 2026) ---------- */
  I.eye = '<svg class="ic eye" viewBox="0 0 24 24" fill="none" stroke="' + G + '" stroke-width="2" stroke-linecap="round"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3.2" fill="' + G + '"/></svg>';
  var THEMES = ['light', 'dark', 'eye'];
  /* the button opens a small menu of the looks; nothing changes until one is chosen (owner, 21 Nov 2026: "should show options to choose,
     not change immediately") */
  function closeLook() { var m = document.getElementById('lookmenu'); if (m) m.remove(); document.removeEventListener('pointerdown', outLook, true); window.removeEventListener('scroll', closeLook, true); window.removeEventListener('resize', closeLook); }
  function outLook(e) { var m = document.getElementById('lookmenu'); if (m && !m.contains(e.target) && !e.target.closest('[data-act="theme"]')) closeLook(); }
  IS.ACT.theme = function (b) {
    if (document.getElementById('lookmenu')) return closeLook();
    var cur = IS.LS.get('theme', 'light'), r = b.getBoundingClientRect(), m = document.createElement('div');
    m.id = 'lookmenu'; m.className = 'lookmenu'; m.setAttribute('role', 'menu');
    m.innerHTML = '<b class="lm-t">' + esc(A('مظهر التطبيق', 'App look')) + '</b>' + [['light', '☀️', 'نهاري', 'Day'], ['dark', '🌙', 'ليلي', 'Night'], ['eye', '👁️', 'راحة العين', 'Eye comfort'], ['auto', '⚙️', 'تلقائي (حسب الجهاز)', 'Automatic (device)']].map(function (o) {
      return '<button type="button" role="menuitemradio" aria-checked="' + (o[0] === cur) + '" class="' + (o[0] === cur ? 'on' : '') + '" data-look="' + o[0] + '"><i>' + o[1] + '</i><span>' + esc(A(o[2], o[3])) + '</span>' + (o[0] === cur ? '<em>✓</em>' : '') + '</button>'; }).join('');
    document.body.appendChild(m);
    var w = m.offsetWidth, x = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), innerWidth - w - 8);
    m.style.left = x + 'px'; m.style.top = (r.bottom + 8) + 'px';
    m.querySelectorAll('[data-look]').forEach(function (o) { o.onclick = function () { var n = o.getAttribute('data-look'); closeLook(); IS.setTheme(n); IS.chrome(document.body.getAttribute('data-page')); if (document.body.getAttribute('data-page') === 'settings' && IS.refresh) IS.refresh(); }; });
    setTimeout(function () { document.addEventListener('pointerdown', outLook, true); window.addEventListener('scroll', closeLook, true); window.addEventListener('resize', closeLook); }, 0);
  };

  /* ---------- My Library in the same design (owner's picture, 20 Nov 2026): banner, «محتوى المكتبة», Sort · Content type · Share,
     My files and My sales, then the books as white cards ---------- */
  HI.book = svg('0 0 24 24', '<path d="M12 6.5C10 5 7 4.5 3 4.8v13.4c4-.3 7 .2 9 1.8 2-1.6 5-2.1 9-1.8V4.8c-4-.3-7 .2-9 1.7zM12 6.5V20"/>', ' fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"');
  HI.share = svg('0 0 24 24', '<circle cx="18" cy="5.5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="18.5" r="2.6"/><path d="m8.3 10.8 7.4-4M8.3 13.2l7.4 4"/>', ' fill="none" stroke="currentColor" stroke-width="2"');
  HI.folder = svg('0 0 24 24', '<path d="M3 7a2 2 0 0 1 2-2h4.2l2 2.2H19a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', ' fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"');
  HI.cart = svg('0 0 24 24', '<path d="M2.5 4h2.6l2.2 10.2h10.6L20.5 7H6.2"/><circle cx="9" cy="18.6" r="1.6"/><circle cx="17" cy="18.6" r="1.6"/>', ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"');
  HI.filter = svg('0 0 24 24', '<path d="M4 5h16l-6.2 7.4V19l-3.6-1.8v-4.8z"/>', ' fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"');
  var lib0 = IS.pageOf && IS.pageOf('library');
  if (lib0) IS.page('library', async function (tab) {
    var inner = await lib0.fn(tab);
    if (typeof inner !== 'string') return inner;
    var t = document.createElement('template'); t.innerHTML = inner;
    var cur = (tab || 'all').split('/')[0];
    var kinds = IS.$$ ? [].slice.call(t.content.querySelectorAll('.ltabs a')).map(function (a) { return [a.getAttribute('href').replace('#library/', ''), (a.querySelector('b') || a).textContent, (a.querySelector('small,i') || {}).textContent || '']; }) : [];
    var sortSel = t.content.querySelector('#library-sort');
    var sorts = sortSel ? [].slice.call(sortSel.options).map(function (o) { return '<option value="' + esc(o.value) + '"' + (o.selected ? ' selected' : '') + '>' + esc(o.textContent) + '</option>'; }).join('') : '';
    var subj = t.content.querySelector('.library-tools details.fg');
    var tool = '<div class="feed-filters mh-ltool">' + (sorts ? '<label>' + HI.sort + '<span>' + esc(A('الترتيب', 'Sort')) + '</span><select id="mh-lsort" aria-label="' + esc(A('الترتيب', 'Sort')) + '">' + sorts + '</select></label>' : '') +
      '<label>' + HI.doc + '<span>' + esc(A('نوع المحتوى', 'Content type')) + '</span><select id="mh-ltype" aria-label="' + esc(A('نوع المحتوى', 'Content type')) + '">' + kinds.map(function (k) {
        return '<option value="' + esc(k[0]) + '"' + (k[0] === cur ? ' selected' : '') + '>' + esc(k[1]) + '</option>'; }).join('') + '</select></label>' +
      (subj ? '<button type="button" class="mh-ib" id="mh-lsub" aria-label="' + esc(A('المواد', 'Subjects')) + '">' + HI.filter + '</button>' : '') +
      '<i class="mh-sep"></i><button type="button" class="mh-pub" data-act="share-file">' + HI.share + '<span>' + esc(A('شارك', 'Share')) + '</span></button></div>' +
      (IS.ME ? '<div class="mh-two"><a class="mh-big' + (cur === 'uploads' ? ' on' : '') + '" href="#library/uploads">' + HI.folder + '<span>' + esc(A('ملفاتي', 'My files')) + '</span></a>' +
        '<a class="mh-big pri" href="#sales">' + HI.cart + '<span>' + esc(A('مبيعاتي', 'My sales')) + '</span></a></div>' : '');
    var a0 = IS.after;
    IS.after = function (main, remember) {
      after();
      var ls = main.querySelector('#mh-lsort'), lt = main.querySelector('#mh-ltype'), sb = main.querySelector('#mh-lsub');
      if (ls) ls.onchange = function () { var o = main.querySelector('#library-sort'); if (o) { o.value = ls.value; o.dispatchEvent(new Event('change')); } };
      if (lt) lt.onchange = function () { location.hash = 'library/' + lt.value; };
      if (sb) sb.onclick = function () { var d = main.querySelector('.library-tools details.fg'); if (d) { d.classList.add('mh-open'); d.open = !d.open; sb.classList.toggle('on', d.open); } };
      return a0 ? a0(main, remember) : undefined;
    };
    return '<div class="mrx mrh mrl"><div class="mh-bg" aria-hidden="true"></div>' + DEFS + '<div class="mh-page">' + htop() +
      pban('img/collection/library.webp', HI.book, A('مكتبتي', 'My Library'), esc(A('كل كتبك وملفاتك الدراسية في مكان واحد', 'All your books and study files in one place')), IS.lang !== 'ar') +
      ptitle(A('محتوى المكتبة', 'Library content')) + tool + '<div class="mh-feed mh-lib">' + inner + '</div></div>' + bnav('library') + '</div>';
  }, lib0.o);

  /* ---------- profiles in the owner's design (20 Nov 2026, his two pictures): my profile (#account) and another person's (#person/<id>):
     cover, picture, name with the verified sign, year · speciality, bio, chips, posts · followers · following, Follow (others) or
     Edit + ⋮ (mine), tabs Posts · Files · Saved, the latest posts as picture cards and the latest files as tiles. Roles only here. ---------- */
  var PI = {
    check: '<svg class="ic pf-ok" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#0d6b5c"/><path d="m7.5 12.3 3 3 6-6.3" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    cam: svg('0 0 24 24', '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.5-2h5.6l1.5 2h2.2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="12.8" r="3.4"/>', ' fill="none" stroke="currentColor" stroke-width="2"'),
    pen: svg('0 0 24 24', '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>', ' fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"'),
    dots: svg('0 0 24 24', '<circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>', ' fill="currentColor"'),
    users: svg('0 0 24 24', '<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c0-3.8 2.9-6.2 6.5-6.2s6.5 2.4 6.5 6.2"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14c3.4-.4 5.5 1.8 5.5 5"/>', ' fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"'),
    group: svg('0 0 24 24', '<circle cx="12" cy="7.5" r="3"/><circle cx="5.5" cy="9.5" r="2.3"/><circle cx="18.5" cy="9.5" r="2.3"/><path d="M6.5 20c0-3.4 2.4-5.6 5.5-5.6s5.5 2.2 5.5 5.6M1.5 18.5c0-2.5 1.6-4 4-4M22.5 18.5c0-2.5-1.6-4-4-4"/>', ' fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"'),
    posts: svg('0 0 24 24', '<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/>', ' fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"'),
    bm: svg('0 0 24 24', '<path d="M6 3.5h12v17l-6-4.2-6 4.2z"/>', ' fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"'),
    pin: svg('0 0 24 24', '<path d="M12 21s-6.5-6.4-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.6 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.4"/>', ' fill="none" stroke="currentColor" stroke-width="1.9"'),
    cap: svg('0 0 24 24', '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 2.6 9 2.6 12 0v-5M22 9v6"/>', ' fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"'),
    kit: svg('0 0 24 24', '<rect x="3" y="7" width="18" height="13" rx="2.4"/><path d="M9 7V5.2A1.2 1.2 0 0 1 10.2 4h3.6A1.2 1.2 0 0 1 15 5.2V7M12 10.5v6M9 13.5h6"/>', ' fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"'),
    tick: svg('0 0 24 24', '<path d="m5 12.5 4.5 4.5L19 7.5"/>', ' fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"'),
    plus: svg('0 0 24 24', '<path d="M12 5v14M5 12h14"/>', ' fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"'),
    heart: '<svg class="ic" viewBox="0 0 24 24"><path d="M12 20.5S3 14.8 3 8.8A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 9 1.8c0 6-9 11.7-9 11.7z" fill="#e5383b"/></svg>',
    chat: svg('0 0 24 24', '<path d="M4 5.5h16v10H9.5L5 19.5v-4H4z"/>', ' fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"'),
    caduceus: '<svg class="pf-cad" viewBox="0 0 120 120" aria-hidden="true"><g fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2.4" stroke-linecap="round"><path d="M60 14v96"/><path d="M60 28c-30-10-42 2-50-6 10 14 26 10 50 14M60 28c30-10 42 2 50-6-10 14-26 10-50 14"/><path d="M48 46c0 10 24 10 24 20s-24 10-24 20 24 10 24 18M72 46c0 10-24 10-24 20s24 10 24 20-24 10-24 18"/></g><circle cx="60" cy="12" r="5" fill="rgba(255,255,255,.55)"/></svg>'
  };
  async function pcard(id) {
    if (DB.live) { var r = await DB.sb.rpc('ish_profile_card', { p_user: id }); if (r.error) throw r.error; return r.data; }
    var p = await DB.one('profiles', id).catch(function () { return null; }); if (!p) return null;
    var fl = await DB.q('follows').catch(function () { return []; }), lec = await DB.one('lecturers', id).catch(function () { return null; });
    var po = (await DB.q('posts', { eq: { user_id: id } })).filter(function (x) { return x.status === 'open'; }).length;
    var fi = (await DB.q('files', { eq: { owner_id: id, status: 'published' } })).length;
    return { id: p.id, name: p.name, photo: p.photo, university: p.university, year: p.year, city: p.city, bio: p.bio, spec: p.spec,
      verified: (p.team || []).length > 0 || !!(lec && lec.status === 'active'), title: lec && lec.status === 'active' ? lec.title : '',
      role: (p.team || []).filter(function (r) { return r.indexOf('p:') !== 0; })[0] || null, lecturer: !!(lec && lec.status === 'active'), created_at: p.created_at,
      followers: fl.filter(function (f) { return f.followee === id; }).length, following: fl.filter(function (f) { return f.follower === id; }).length,
      posts: po, files: fi, me_follow: !!(IS.ME && fl.some(function (f) { return f.follower === IS.ME.id && f.followee === id; })) };
  }
  function nfmt(n) { n = +n || 0; return n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e4 ? Math.round(n / 1e3) + 'K' : n >= 1000 ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K' : String(n); }
  var PKIND = { post: ['منشور', 'Post', 'pen'], discussion: ['مناقشة', 'Discussion', 'chat'], question: ['سؤال', 'Question', 'help'], announcement: ['إعلان', 'Announcement', 'mega'], course_preview: ['معاينة كورس', 'Course preview', 'video'] };
  function postTile(x) {
    var k = PKIND[x.kind] || PKIND.discussion, pic = x.preview_image || x.cover || 'img/collection/' + (x.kind === 'announcement' ? 'notifications' : x.kind === 'question' ? 'support' : 'community') + '.webp';
    var rx = (+x.like_count || 0) + (+x.love_count || 0) + (+x.angry_count || 0) + (+x.dislike_count || 0);
    return '<a class="pf-post" href="#post/' + esc(x.id) + '"><span class="pp">' + IS.poster(pic) + '<em>' + ic(k[2]) + esc(A(k[0], k[1])) + '</em></span>' +
      '<b dir="auto">' + esc(x.title || A('نقاش', 'Discussion')) + '</b><span class="pm"><span>' + PI.heart + N(rx) + '</span><span>' + PI.chat + N(+x.n_replies || 0) + '</span><i class="pd">' + PI.dots + '</i></span></a>';
  }
  function ftype(f) {
    var e = String(f.path || f.mime || '').toLowerCase(), t = /pptx?|presentation/.test(e) ? ['PPT', 'ppt'] : /docx?|word/.test(e) ? ['DOC', 'doc'] : /png|jpe?g|webp|image/.test(e) ? ['IMG', 'img'] : /txt|text/.test(e) ? ['TXT', 'doc'] : ['PDF', 'pdf'];
    return '<span class="pf-ft ' + t[1] + '"><svg viewBox="0 0 40 48" aria-hidden="true"><path d="M4 2h22l10 10v32a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#fff" stroke="currentColor" stroke-width="2"/><path d="M26 2v10h10" fill="none" stroke="currentColor" stroke-width="2"/></svg><b class="pf-ftl">' + t[0] + '</b></span>';
  }
  function fileTile(f) {
    var mb = f.size ? (f.size / 1048576).toFixed(f.size > 1048576 * 10 ? 0 : 1) + ' MB' : f.pages ? f.pages + ' ' + A('صفحة', 'pages') : '';
    return '<a class="pf-file" href="#' + (f.series_id ? 'series/' + esc(f.series_id) : 'file/' + esc(f.id)) + '">' + ftype(f) + '<b dir="auto">' + esc(f.series_title || f.title) + '</b><small><bdi dir="ltr">' + esc(mb) + '</bdi></small><i class="pd">' + PI.dots + '</i></a>';
  }
  function pbox(title, icon, more, body) {
    return '<section class="pf-box"><header><h2>' + icon + '<span>' + esc(title) + '</span></h2>' + (more ? '<a href="' + more + '">' + esc(A('عرض الكل', 'View all')) + ' ‹</a>' : '') + '</header>' + body + '</section>';
  }

  /* the stats card of every profile (owner's picture, 21 Nov 2026): four figures in one row, contact tiles, then «member since» */
  HI.mail = svg('0 0 24 24', '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>', ' fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"');
  HI.phone = svg('0 0 24 24', '<path d="M6.6 3.5h3l1.5 4.5-2 1.4a12 12 0 0 0 5.5 5.5l1.4-2 4.5 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z"/>', ' fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"');
  HI.trophy2 = svg('0 0 24 24', '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M10 14.5V18h4v-3.5M8 21h8"/>', ' fill="none" stroke="#d9a62e" stroke-width="1.9" stroke-linejoin="round"');
  function lpStats(items, contacts, since, extra) {
    return '<section class="lp-stats"><div class="lp-four">' + items.map(function (x) {
        return '<' + (x[3] ? 'a href="' + x[3] + '"' : 'span') + ' class="lp-f">' + x[0] + '<b dir="auto"' + (String(x[1]).replace(/<[^>]+>/g, '').length > 5 ? ' class="lng"' : '') + '>' + x[1] + '</b><small>' + esc(x[2]) + '</small></' + (x[3] ? 'a' : 'span') + '>'; }).join('') + '</div>' +
      (contacts.length ? '<div class="lp-contacts">' + contacts.map(function (x) {
        return '<a class="lp-ct" href="' + esc(x[3]) + '"' + (/^https?:/.test(x[3]) ? ' target="_blank" rel="noopener"' : '') + '><i>' + x[0] + '</i><span><b>' + esc(x[1]) + '</b><small dir="ltr">' + esc(x[2]) + '</small></span></a>'; }).join('') + '</div>' : '') +
      (extra || '') + (since ? '<div class="lp-row">' + HI.cal + '<b>' + esc(A('تاريخ التسجيل كعضو', 'Member since')) + '</b><span>' + esc(IS.date(since)) + '</span></div>' : '') + '</section>';
  }
  async function profilePage(id, tab, own) {
    var c = await pcard(id);
    if (!c) return null;
    var ach = 0; if (own && IS.myStats) try { var st = await IS.myStats(); ach = (st.done || []).length; } catch (e) {}
    var m = IS.ME, base = own ? '#account' : '#person/' + id;
    var sp = c.spec && IS.spec ? IS.spec(c.spec) : null, spName = sp ? sp.en : (own && IS.mySpec() ? IS.mySpec().en : '');
    var chips = [[PI.kit, spName], [PI.cap, c.university], [PI.pin, c.city]].filter(function (x) { return x[1]; });
    var res = await Promise.all([DB.q('posts', { eq: { user_id: id }, order: ['created_at', false], limit: 60 }).catch(function () { return []; }),
      DB.q('files', { eq: { owner_id: id, status: 'published' }, order: ['published_at', false] }).catch(function () { return []; })]);
    var posts = res[0].filter(function (x) { return x.status === 'open'; }), files = IS.seriesCollapse ? IS.seriesCollapse(res[1].slice()) : res[1];
    files = files.map(function (f) { return f._parts ? Object.assign({}, f._parts[0], { series_id: f.series_id, series_title: f.series_title }) : f; });
    var h = '<div class="mrx mrh mrp"><div class="mh-bg" aria-hidden="true"></div>' + DEFS + '<div class="mh-page">' + htop() +
      /* the same design as the lecturer page (owner, 21 Nov 2026: "also for admins and students with relevant different info") */
      (function () {
        var role = c.role && (IS.ROLES || []).filter(function (x) { return x[0] === c.role; })[0], isLec = c.lecturer || !!c.title;
        var roleTxt = role ? A(role[1], String(role[2]).replace(/\s*\(.*\)\s*/, '')) : '';
        if (own && !roleTxt && IS.myRoles) { var mr = IS.myRoles().filter(function (r) { return r[4] === 'adm'; })[0]; if (mr) roleTxt = A(mr[2], mr[3]); }
        var kindTxt = roleTxt || (isLec ? (c.title || A('محاضر', 'Lecturer')) : (c.year || A('طالب', 'Student')));
        var kindIc = roleTxt ? ic('crown') : isLec ? HI.brief : HI.cap.replace(G, 'currentColor');
        var section = own ? IS.mySection() : null, spn = spName;
        var tile1 = roleTxt ? [ic('shield'), A('الدور في المنصة', 'Role'), roleTxt + (isLec ? ' · ' + A('محاضر', 'Lecturer') : '')] :
          isLec ? [HI.cap.replace(G, '#c99a3e'), A('المحاضر', 'Lecturer'), c.title || A('محاضر معتمد', 'Approved lecturer')] :
          [HI.cap.replace(G, '#c99a3e'), A('الجامعة', 'University'), [c.university, c.year].filter(Boolean).join(' · ') || A('لم تُضف بعد', 'Not added yet')];
        var fourth = roleTxt || (isLec ? c.title || A('محاضر', 'Lecturer') : c.university || c.year || '—');
        if (tile1[1] === A('الجامعة', 'University')) tile1[1] = c.university ? A('الجامعة', 'University') : A('السنة', 'Year');
        var acts = own ? '<div class="lp-acts"><button type="button" class="lp-btn gold" data-act="editme">' + PI.pen + '<span>' + esc(A('تعديل الملف', 'Edit profile')) + '</span></button>' +
            '<button type="button" class="lp-btn" data-act="pfmenu">' + PI.dots + '<span>' + esc(A('المزيد', 'More')) + '</span></button></div>' :
          '<div class="lp-acts' + (roleTxt || isLec ? '' : ' one') + '"><button type="button" class="lp-btn gold' + (c.me_follow ? ' on' : '') + '" data-act="pffollow" data-id="' + esc(id) + '">' + (c.me_follow ? PI.tick : HI.userPlus) + '<span>' + esc(c.me_follow ? A('متابَع', 'Following') : A('متابعة', 'Follow')) + '</span></button>' +
            (isLec ? '<a class="lp-btn" href="#lecturer/' + esc(id) + '">' + HI.layers.replace(G, 'currentColor') + '<span>' + esc(A('صفحة المحاضر', 'Lecturer page')) + '</span></a>' :
             roleTxt ? '<a class="lp-btn" href="#support">' + PI.chat + '<span>' + esc(A('راسل الفريق', 'Message the team')) + '</span></a>' : '') + '</div>';
        return '<section class="lp-hero"><div class="lp-cover" style="--lc:url(' + IS.U('img/hero_band.webp') + ')"></div>' +
          '<svg class="lp-wave" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40C80 20 130 10 200 10s120 10 200 30V60H0z" fill="#0b5a4c"/><path d="M0 40C80 20 130 10 200 10s120 10 200 30" fill="none" stroke="#e9c46a" stroke-width="3"/></svg>' +
          '<div class="lp-body">' + (own ? '<label class="lp-av">' + IS.av(c, 'xl') + '<span class="cam">' + PI.cam + '</span><input type="file" accept="image/*" id="myPhoto" hidden></label>' :
            '<span class="lp-av">' + IS.av(c, 'xl', c.id) + (c.verified ? '<i class="lp-ok">' + PI.check + '</i>' : '') + '</span>') +
          '<h1 tabindex="-1" class="lp-name" dir="auto">' + esc(c.name || '') + '</h1>' +
          '<span class="lp-title">' + kindIc + '<b dir="auto">' + esc(kindTxt) + '</b></span>' +
          (own ? '' : '<span class="lp-seen">' + IS.seen(id) + '</span>') +
          ((section || spn) ? '<span class="lp-chips">' + (section ? '<b lang="en">' + esc(section.id === 'special' ? 'International' : section.en) + '</b>' : '') + (spn ? '<b lang="en">' + esc(spn) + '</b>' : '') + '</span>' : '') +
          (c.bio ? '<p class="lp-bio" dir="auto">' + esc(c.bio) + '</p>' : '') + acts + '</div></section>' +
          lpStats([[PI.group, nfmt(c.followers), A('متابعين', 'Followers')], [PI.posts, nfmt(c.posts), A('المنشورات', 'Posts')],
            own ? [HI.trophy2, N(ach), A('الإنجازات', 'Achievements'), '#achievements'] : [PI.users, nfmt(c.following), A('أتابع', 'Following')],
            [tile1[0].replace('#c99a3e', 'currentColor'), esc(fourth), tile1[1]]],
            own ? [m.email && [HI.mail, A('البريد الإلكتروني', 'Email'), m.email, 'mailto:' + m.email], m.phone && [HI.phone, A('رقم التواصل', 'Contact number'), m.phone, 'tel:' + m.phone]].filter(Boolean) : [],
            c.created_at, c.city ? '<div class="lp-row">' + PI.pin + '<b>' + esc(A('المدينة', 'City')) + '</b><span dir="auto">' + esc(c.city) + '</span></div>' : '') +
          '';
      })() +
      '<nav class="pf-tabs">' + [['posts', PI.posts, A('المنشورات', 'Posts')], ['files', HI.folder, A('الملفات', 'Files')]].concat(own ? [['saved', PI.bm, A('المحفوظات', 'Saved')]] : []).map(function (t) {
        return '<a href="' + base + (t[0] === 'posts' ? '' : '/' + t[0]) + '"' + (tab === t[0] || (tab === 'all' && t[0] === 'posts') ? ' class="on" aria-current="page"' : '') + '>' + t[1] + '<span>' + esc(t[2]) + '</span></a>'; }).join('') + '</nav>';
    if (tab === 'files') {
      h += pbox(A('الملفات', 'Files'), HI.folder, '', files.length ? '<div class="pf-files">' + files.map(fileTile).join('') + '</div>' : '<p class="pf-empty">' + esc(A('لا توجد ملفات منشورة بعد.', 'No published files yet.')) + '</p>');
    } else if (tab === 'saved' && own) {
      var f = IS.LS.get('fav-' + id, {}), ks = Object.keys(f).sort(function (a, b) { return f[b] - f[a]; });
      var cid = ks.filter(function (k) { return /^c:/.test(k); }).map(function (k) { return k.slice(2); }), fid = ks.filter(function (k) { return /^f:/.test(k); }).map(function (k) { return k.slice(2); });
      var got = await Promise.all([cid.length ? DB.q('courses', { in: { id: cid } }) : [], fid.length ? DB.q('files', { in: { id: fid } }) : []]);
      var tiles = got[0].map(function (x) { return '<a class="pf-post" href="#course/' + esc(x.id) + '"><span class="pp">' + IS.poster(x.cover || 'img/collection/courses.webp') + '<em>' + ic('layers') + esc(A('كورس', 'Course')) + '</em></span><b dir="auto">' + esc(x.title) + '</b></a>'; });
      h += pbox(A('المحفوظات', 'Saved'), PI.bm, '#favorites', (tiles.length ? '<div class="pf-posts">' + tiles.join('') + '</div>' : '') + (got[1].length ? '<div class="pf-files">' + got[1].map(fileTile).join('') + '</div>' : '') +
        (!tiles.length && !got[1].length ? '<p class="pf-empty">' + esc(A('اضغط ♡ على أي كورس أو ملف لتحفظه هنا.', 'Tap ♡ on any course or file to save it here.')) + '</p>' : ''));
    } else {
      var all = tab === 'all', lim = all ? 60 : 6;
      h += pbox(all ? A('كل المنشورات', 'All posts') : A('أحدث المنشورات', 'Latest posts'), PI.posts, !all && posts.length > lim ? base + '/all' : '', posts.length ? '<div class="pf-posts">' + posts.slice(0, lim).map(postTile).join('') + '</div>' :
        '<p class="pf-empty">' + esc(own ? A('لم تنشر شيئًا بعد.', 'You have not posted yet.') : A('لا توجد منشورات بعد.', 'No posts yet.')) + '</p>');
      if (files.length && !all) h += pbox(A('أحدث الملفات', 'Latest files'), HI.folder, base + '/files', '<div class="pf-files">' + files.slice(0, 4).map(fileTile).join('') + '</div>');
    }
    h += '</div>' + bnav(own ? '' : '') + '</div>';
    IS.after = function (main) {
      after();
      var fi = main.querySelector('#myPhoto');
      if (fi) fi.onchange = async function () { if (!fi.files[0]) return; var u = await DB.upload('media', await IS.shrink(fi.files[0], 480, 0.85)); await DB.upd('profiles', m.id, { photo: u }); await IS.loadMe(); IS.toast(A('تم تحديث الصورة', 'Photo updated')); IS.refresh(); };
    };
    return h;
  }
  var acc0 = IS.pageOf && IS.pageOf('account');
  if (acc0) IS.page('account', async function (tab) {
    tab = !tab || tab === 'profile' ? 'posts' : tab;
    if (!/^(posts|files|saved|all)$/.test(tab)) return acc0.fn(tab);   /* account settings keep the older page */
    return profilePage(IS.ME.id, tab, true);
  }, acc0.o);
  IS.page('person', async function (arg) {
    var p = String(arg || '').split('/'), id = p[0];
    if (!id) { IS.go('home'); return ''; }
    if (IS.ME && id === IS.ME.id) { IS.go('account' + (p[1] ? '/' + p[1] : '')); return ''; }
    return profilePage(id, p[1] === 'files' || p[1] === 'all' ? p[1] : 'posts', false);
  });
  IS.ACT.pffollow = async function (b) {
    if (!IS.ME) return IS.ACT.login();
    var id = b.getAttribute('data-id'), on = b.classList.contains('on');
    b.disabled = true;
    try {
      if (on) { var rows = await DB.q('follows', { eq: { follower: IS.ME.id, followee: id } }); for (var i = 0; i < rows.length; i++) await DB.del('follows', rows[i].id); }
      else await DB.ins('follows', { follower: IS.ME.id, followee: id });
      if (DB.forget) DB.forget(); IS.keepScroll = true; IS.refresh();
    } catch (e) { b.disabled = false; IS.toast(A('تعذّر الحفظ، حاول مرة أخرى.', 'Could not save, try again.')); }
  };
  IS.ACT.pfmenu = function () {
    var L = [['learning', 'layers', 'كورساتي', 'My courses'], ['achievements', 'cert', 'شهاداتي وإنجازاتي', 'Certificates'], ['favorites', 'heart', 'مفضلاتي', 'Favourites'],
      ['notifications', 'bell', 'الإشعارات', 'Notifications'], ['account/settings', 'gear', 'إعدادات الحساب', 'Account settings'], ['settings', 'gear', 'الإعدادات', 'Settings'],
      ['support', 'chat', 'الدعم والرسائل', 'Support & messages'], ['security', 'shield', 'الأمان', 'Security'], [IS.LEC ? 'studio' : 'studio-apply', 'studio', IS.LEC ? 'الاستوديو' : 'التسجيل كمحاضر', IS.LEC ? 'Studio' : 'Become a lecturer']];
    IS.sheet(esc(A('المزيد', 'More')), '<div class="mr-feat">' + L.map(function (x) { return '<a href="#' + x[0] + '">' + ic(x[1]) + '<span>' + esc(A(x[2], x[3])) + '</span></a>'; }).join('') +
      ((IS.ME.team || []).length ? '<a href="#account" data-act="mycard">' + ic('group') + '<span>' + esc(A('بطاقتي في فريق المنصة', 'My card on Our team')) + '</span></a>' : '') +
      '<a href="#account" data-act="logout">' + ic('logout') + '<span>' + esc(A('تسجيل الخروج', 'Sign out')) + '</span></a></div>');
  };

  /* ---------- Courses in the owner's picture (20 Nov 2026): banner, «محتوى الكورسات», Sort · Category · Create a course, and wide course cards
     (picture with the section and ♡, «كورس» label, title, subtitle, lecturer, stars and grade, price · time · students · lessons, button) ---------- */
  HI.cap = svg('0 0 24 24', '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 2.6 9 2.6 12 0v-5M22 9v6"/>', ' fill="none" stroke="' + G + '" stroke-width="1.9" stroke-linejoin="round"');
  HI.tag = svg('0 0 24 24', '<path d="M3 12.5V4h8.5L21 13.5 13.5 21z"/><circle cx="7.5" cy="8" r="1.6"/>', ' fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"');
  HI.layersW = svg('0 0 24 24', '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/><path d="m3 17.5 9 4.5 9-4.5"/>', ' fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"');
  HI.clock = svg('0 0 24 24', '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"');
  HI.vid = svg('0 0 24 24', '<rect x="2.5" y="6" width="13" height="12" rx="2"/><path d="m15.5 10.5 6-3.5v10l-6-3.5z"/>', ' fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"');
  HI.play = svg('0 0 24 24', '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l5.5-3.5z" fill="currentColor"/>', ' fill="none" stroke="currentColor" stroke-width="2"');
  HI.lock = svg('0 0 24 24', '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>', ' fill="none" stroke="currentColor" stroke-width="2"');
  function hmins(m) { m = +m || 0; return m >= 60 ? (Math.round(m / 6) / 10) + ' ' + A('ساعات', 'h') : m + ' ' + A('دقيقة', 'min'); }
  function mrCourseCard(c, L, E) {
    var l = L && L[c.lecturer_id], e = E && E[c.id], sc = IS.studyScope(c), cat = IS.cat(sc.cat), paid = +c.price > 0, on = e && e.status === 'active', wait = e && e.status === 'pending';
    var href = '#course/' + esc(c.id), cover = c.cover ? IS.poster(c.cover) : IS.poster('img/collection/courses.webp');
    return '<article class="mc-card" data-go="' + href + '"><div class="mc-txt"><span class="mc-chip">' + HI.layers + esc(A('كورس', 'Course')) + '</span>' +
      '<h3 dir="auto"><a href="' + href + '">' + esc(c.title || '') + '</a></h3>' + (c.subtitle ? '<p class="mc-sub" dir="auto">' + esc(c.subtitle) + '</p>' : '') +
      '<span class="mc-rate feed-grade sm">' + IS.gradeInner(c, 'course') + '</span></div>' +
      /* the lecturer sits under the course picture (owner, 20 Nov 2026) */
      '<div class="mc-side"><a class="mc-pic" href="' + href + '">' + cover + (cat ? '<em lang="en">' + esc(cat.id === 'special' ? 'International' : cat.en) + '</em>' : '') + '</a>' +
      '<span class="mc-fav">' + IS.favBtn('c:' + c.id, true) + '</span>' +
      (l ? '<a class="mc-lec" href="#lecturer/' + esc(l.id) + '">' + IS.av(l, 'sm', l.id) + '<b dir="auto">' + IS.lecName(l.name) + '</b></a>' : '') + '</div>' +
      '<div class="mc-foot"><span class="mc-price ' + (paid ? 'paid' : 'free') + '">' + (paid ? HI.lock + esc(A('مدفوع', 'Paid')) : esc(A('مجاني', 'Free'))) + '</span>' +
      (c.minutes ? '<span class="mc-f">' + HI.clock + '<b>' + esc(hmins(c.minutes)) + '</b></span>' : '') +
      '<span class="mc-f">' + PI.users + '<b>' + nfmt(c.n_students || 0) + '</b></span>' +
      '<span class="mc-f">' + HI.vid + '<b>' + N(c.n_lessons || 0) + ' ' + esc(A('درس', 'lessons')) + '</b></span>' +
      (wait ? '<span class="mc-btn ghost">' + esc(A('بانتظار التأكيد', 'Pending')) + '</span>' :
        '<a class="mc-btn" href="' + href + '">' + (on ? HI.play + esc(A('تابع', 'Continue')) : paid ? esc(A('عرض التفاصيل', 'View details')) + ' ‹' : HI.play + esc(A('التحق بالكورس', 'Enrol'))) + '</a>') + '</div></article>';
  }
  var cc0 = IS.courseCard;
  IS.courseCard = function (c, L, E) { return document.querySelector('.mrc #cres') ? mrCourseCard(c, L, E) : cc0.apply(this, arguments); };
  var crs0 = IS.pageOf && IS.pageOf('courses');
  if (crs0) IS.page('courses', async function (arg) {
    var inner = await crs0.fn(arg);
    if (typeof inner !== 'string' || inner.indexOf('id="cres"') < 0) return inner;
    var spec = IS.mySpec(), section = IS.mySection(), parts = String(arg || '').split('/').filter(function (x) { return x[0] !== '@'; });
    var t = document.createElement('template'); t.innerHTML = inner;
    var sortSel = t.content.querySelector('#csort');
    var sorts = sortSel ? [].slice.call(sortSel.options).map(function (o) { return '<option value="' + esc(o.value) + '"' + (o.selected ? ' selected' : '') + '>' + esc(o.textContent) + '</option>'; }).join('') : '';
    var subs = IS.SUBJ.filter(IS.inStudySpace), cur = parts[1] || '';
    var tool = '<div class="feed-filters mh-ltool"><label>' + HI.sort + '<span>' + esc(A('الترتيب', 'Sort')) + '</span><select id="mh-csort">' + sorts + '</select></label>' +
      '<label>' + HI.tag + '<span>' + esc(A('التصنيف', 'Category')) + '</span><select id="mh-ccat"><option value="">' + esc(A('الكل', 'All')) + '</option>' +
        subs.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === cur ? ' selected' : '') + '>' + esc(x.en) + '</option>'; }).join('') + '</select></label>' +
      '<button type="button" class="mh-ib" id="mh-cflt" aria-label="' + esc(A('تصفية', 'Filter')) + '">' + HI.filter + '</button><i class="mh-sep"></i>' +
      (IS.LEC ? '<a class="mh-pub" href="#studio-course/new">' + HI.plus + '<span>' + esc(A('كورس جديد', 'New course')) + '</span></a>' :
        '<a class="mh-pub" href="#course-requests/new">' + HI.plus + '<span>' + esc(A('اطلب كورسًا', 'Request a course')) + '</span></a>') + '</div>';
    var sub = [spec && spec.en, section && (section.id === 'special' ? 'International' : section.en), IS.subj(cur) && IS.subj(cur).en].filter(Boolean).join(' <i>•</i> ');
    var a0 = IS.after;
    IS.after = function (main, remember) {
      after();
      var r = a0 ? a0(main, remember) : undefined;
      var ms = main.querySelector('#mh-csort'), mc = main.querySelector('#mh-ccat'), mf = main.querySelector('#mh-cflt');
      if (ms) ms.onchange = function () { var o = main.querySelector('#csort'); if (o) { o.value = ms.value; o.dispatchEvent(new Event('change')); } };
      if (mc) mc.onchange = function () { location.hash = 'courses' + (mc.value ? '/' + ((IS.subj(mc.value) || {}).cat || (section || {}).id) + '/' + mc.value : ''); };
      if (mf) mf.onclick = function () { var f = main.querySelector('#filt'); if (f) { var o = !f.classList.contains('mh-open'); f.classList.toggle('mh-open', o); mf.classList.toggle('on', o); } };
      return r;
    };
    return '<div class="mrx mrh mrc"><div class="mh-bg" aria-hidden="true"></div>' + DEFS + '<div class="mh-page">' + htop() +
      pban('img/hero_band.webp', HI.layersW, A('الكورسات', 'Courses'), sub, IS.lang !== 'ar').replace('class="mh-ban', 'class="mh-ban hs') +
      ptitle(A('محتوى الكورسات', 'Courses content')).replace(HI.layers, HI.cap) + tool + '<div class="mh-feed mh-crs">' + inner + '</div></div>' + bnav('courses') + '</div>';
  }, crs0.o);

  /* ---------- every other student page in the new frame (owner, 20 Nov 2026: "organise the other pages in the new design; work on all remaining
     pages"): the same top bar, light page and bottom bar; css/mr.css (.mra) gives their banners, boxes, buttons and tabs the new look ---------- */
  var NAVOF = { course: 'courses', lesson: 'courses', 'course-requests': 'courses', 'course-request': 'courses', payment: 'courses', file: 'library', series: 'library',
    sales: 'library', purchase: 'library', downloads: 'library', dl: 'library', post: 'community', community: 'community', lecturer: 'lecturers', lecturers: 'lecturers',
    learning: 'learning', achievements: 'learning', favorites: 'learning', paths: 'learning', path: 'learning' };
  IS.pageFrame = function (name, html) {
    if (IS.area !== 'student' || /class="mrx/.test(html) || /^(cert|pick|pick-section)$/.test(name)) return html;
    return '<div class="mrx mrh mra" data-pg="' + esc(name) + '"><div class="mh-bg" aria-hidden="true"></div>' + DEFS + '<div class="mh-page">' + htop() +
      '<div class="mh-tools"></div><div class="mh-old">' + html + '</div></div>' + bnav(NAVOF[name] || '') + '</div>';
  };
  /* the «yours» and «team tools» bars that manage.js puts at the top of a page go under the new top bar, in one neat row;
     when «إدارة» is there the ✏️ 🗑️ bar is not shown (it already edits and deletes) */
  var route1 = IS.onRoute;
  IS.onRoute = function (name, arg, main) {
    if (route1) try { route1(name, arg, main); } catch (e) {}
    var fr = main && main.querySelector('.mra'); if (!fr) return;
    var slot = fr.querySelector('.mh-tools'), page = main.querySelector('.page');
    function move() { if (!page || !slot) return; var crumb = fr.querySelector('.mh-old .crumb'), to = crumb || slot;
      page.querySelectorAll(':scope > .ownbar, :scope > .mngbar').forEach(function (b) { to.appendChild(b); });
      if (crumb) crumb.classList.toggle('mh-has', !!crumb.querySelector('.mngbar,.ownbar')); slot.classList.toggle('has', !!slot.children.length); }
    move(); if (page) { var mo = new MutationObserver(move); mo.observe(page, { childList: true }); setTimeout(function () { mo.disconnect(); }, 8000); }
  };

  /* ---------- lecturer page in the owner's picture (20 Nov 2026): a teal card with the cover and a gold wave, the picture in a gold ring with
     the verified sign, the name in a gold-edged pill, title, last activity, section and speciality, Follow (gold) · Add to favourites ·
     Request a course or lecture; then courses · followers, qualifications · rating and «member since». The rest (about, courses, events,
     links) follows as before. ---------- */
  HI.brief = svg('0 0 24 24', '<rect x="3" y="7" width="18" height="13" rx="2.4"/><path d="M9 7V5.2A1.2 1.2 0 0 1 10.2 4h3.6A1.2 1.2 0 0 1 15 5.2V7M3 12.5h18"/>', ' fill="none" stroke="currentColor" stroke-width="1.8"');
  HI.userPlus = svg('0 0 24 24', '<circle cx="10" cy="8" r="4"/><path d="M3 21c0-4 3.1-7 7-7 1.6 0 3 .4 4.2 1.2M18 14v6M15 17h6"/>', ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"');
  HI.trophy = svg('0 0 24 24', '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M10 14.5V18h4v-3.5M8 21h8"/>', ' fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"');
  HI.cal = svg('0 0 24 24', '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>', ' fill="none" stroke="currentColor" stroke-width="1.9"');
  HI.star = svg('0 0 24 24', '<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.4l-5.6 2.9 1.1-6.2L3 9.7l6.2-.9z"/>', ' fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"');
  var lec0 = IS.pageOf && IS.pageOf('lecturer');
  if (lec0) IS.page('lecturer', async function (id) {
    var inner = await lec0.fn(id);
    if (typeof inner !== 'string' || inner.indexOf('class="lhero') < 0) return inner;
    var r = await Promise.all([DB.one('lecturers', id).catch(function () { return null; }), pcard(id).catch(function () { return null; }),
      DB.q('courses', { eq: { lecturer_id: id, status: 'published' } }).catch(function () { return []; })]);
    var l = r[0], c = r[1] || {}, courses = r[2] || [];
    if (!l) return inner;
    var t = document.createElement('template'); t.innerHTML = inner;
    [].slice.call(t.content.children).forEach(function (x) { if (x.matches('.crumb, .lhero')) x.remove(); });
    var quick = t.content.querySelector('.aside > .box'); if (quick && /kv/.test(quick.innerHTML)) quick.remove();
    var spec = IS.mySpec(), section = IS.mySection(), mine = IS.ME && IS.ME.id === id;
    var rv = courses.filter(function (x) { return x.n_reviews; }), n = rv.reduce(function (a, x) { return a + (+x.n_reviews || 0); }, 0);
    var rate = n ? Math.round(rv.reduce(function (a, x) { return a + (+x.rating || 0) * x.n_reviews; }, 0) / n * 10) / 10 : 0;
    var fav = IS.ME && !!(IS.LS.get('fav-' + IS.ME.id, {})['t:' + id]);
    var quals = (l.quals || []).slice(0, 2).join(', ');
    var hero = '<section class="lp-hero"><div class="lp-cover" style="--lc:url(' + IS.U(l.cover || 'img/hero_band.webp') + ')"></div>' +
      '<svg class="lp-wave" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40C80 20 130 10 200 10s120 10 200 30V60H0z" fill="#0b5a4c"/><path d="M0 40C80 20 130 10 200 10s120 10 200 30" fill="none" stroke="#e9c46a" stroke-width="3"/></svg>' +
      '<div class="lp-body"><span class="lp-av">' + IS.av(l, 'xl', id) + '<i class="lp-ok">' + PI.check + '</i></span>' +
      '<h1 tabindex="-1" class="lp-name" dir="auto">' + IS.lecName(l.name) + '</h1>' +
      (l.title ? '<span class="lp-title">' + HI.brief + '<b dir="auto">' + esc(l.title) + '</b></span>' : '') +
      /* university and year, then the rating beside the last activity (owner, 21 Nov 2026: "add the missing ones like the university and the rating") */
      ((c.university || c.year) ? '<span class="lp-uni">' + (c.university ? '<b dir="auto">🏛️ ' + esc(c.university) + '</b>' : '') + (c.university && c.year ? '<i></i>' : '') +
        (c.year ? '<b dir="auto">🎓 ' + esc(c.year) + '</b>' : '') + '</span>' : '') +
      '<span class="lp-rs"><span class="lp-rate">' + (n ? '<small>(' + N(n) + ')</small><b>' + rate.toFixed(1) + '</b>' : '') + '<em>' + [1, 2, 3, 4, 5].map(function (i) { return '<u class="' + (i <= Math.round(rate) ? 'on' : '') + '">★</u>'; }).join('') + '</em>' +
        (n ? '' : '<small>' + esc(A('لم يُقيَّم بعد', 'Not rated yet')) + '</small>') + '</span><i class="lp-sep"></i>' + IS.seen(id) + '</span>' +
      '<span class="lp-chips">' + (section ? '<b lang="en">' + esc(section.id === 'special' ? 'International' : section.en) + '</b>' : '') + (spec ? '<b lang="en">' + esc(spec.en) + '</b>' : '') + '</span>' +
      (mine ? '<div class="lp-acts"><a class="lp-btn gold" href="#studio-page">' + PI.pen + '<span>' + esc(A('تعديل صفحتي', 'Edit my page')) + '</span></a><a class="lp-btn" href="#studio">' + HI.layers + '<span>' + esc(A('الاستوديو', 'Studio')) + '</span></a></div>' :
        '<div class="lp-acts"><button type="button" class="lp-btn gold' + (c.me_follow ? ' on' : '') + '" data-act="pffollow" data-id="' + esc(id) + '">' + (c.me_follow ? PI.tick : HI.userPlus) + '<span>' + esc(c.me_follow ? A('متابَع', 'Following') : A('متابعة', 'Follow')) + '</span></button>' +
        '<button type="button" class="lp-btn" data-act="fav" data-k="t:' + esc(id) + '" aria-pressed="' + fav + '">' + PI.bm + '<span>' + esc(A('إضافة للمفضلة', 'Add to favourites')) + '</span></button>' +
        '<a class="lp-btn wide" href="#course-requests/new/' + esc(id) + '">' + HI.cap.replace(G, 'currentColor') + '<span>' + esc(A('اطلب كورس أو محاضرة', 'Request a course or lecture')) + '</span></a></div>') +
      '</div></section>' +
      '';
    /* owner, 21 Nov 2026: four small buttons (followers, courses, achievements, qualifications) that open their list; then contact
       (WhatsApp number and email, each opens WhatsApp or the mail app); then two small tiles: about the lecturer and the date he joined */
    var evs = await DB.q('events', { eq: { lecturer_id: id, status: 'published' } }).catch(function () { return []; });
    var students = courses.reduce(function (a, x) { return a + (+x.n_students || 0); }, 0);
    var ach = [];
    if (courses.length) ach.push(['🎓', A('نشر ' + courses.length + ' ' + (courses.length === 1 ? 'كورس' : courses.length === 2 ? 'كورسين' : 'كورسات'), 'Published ' + courses.length + ' course' + (courses.length === 1 ? '' : 's'))]);
    if (students) ach.push(['👥', A('درّس ' + students + ' طالبًا', 'Taught ' + students + ' students')]);
    if (n) ach.push(['⭐', A('تقييم ' + rate.toFixed(1) + ' من 5 (' + n + ' تقييم)', 'Rated ' + rate.toFixed(1) + ' / 5 (' + n + ' ratings)')]);
    if (evs.length) ach.push(['📅', A('قدّم ' + evs.length + ' فعالية', 'Held ' + evs.length + ' event' + (evs.length === 1 ? '' : 's'))]);
    if ((c.followers || 0) >= 10) ach.push(['❤️', A(c.followers + ' متابعًا', c.followers + ' followers')]);
    if (l.status === 'active') ach.unshift(['✅', A('محاضر معتمد في المنصة', 'Approved lecturer on the platform')]);
    LPDATA = { id: id, l: l, courses: courses, ach: ach, contacts: null };
    var k = l.links || {}, contacts = [];
    if (k.whatsapp) contacts.push(['wa', HI.phone, A('رقم التواصل', 'Contact number'), k.whatsapp, IS.wa ? IS.wa(k.whatsapp) : 'https://wa.me/' + String(k.whatsapp).replace(/\D/g, '')]);
    if (k.email) contacts.push(['mail', HI.mail, A('البريد الإلكتروني', 'Email'), k.email, 'mailto:' + k.email]);
    LPDATA.contacts = contacts;
    var btn = function (key, icon, num, label) { return '<button type="button" class="lp-q" data-act="lp-list" data-k="' + key + '">' + icon + '<b dir="auto">' + num + '</b><small>' + esc(label) + '</small></button>'; };
    var body = '<section class="lp-qs">' + btn('followers', PI.group, nfmt(c.followers || 0), A('المتابعون', 'Followers')) +
        btn('courses', HI.layers.replace(G, 'currentColor'), N(courses.length), A('الكورسات', 'Courses')) +
        btn('ach', HI.trophy2, N(ach.length), A('الإنجازات', 'Achievements')) +
        btn('quals', HI.cap.replace(G, 'currentColor'), N((l.quals || []).length), A('المؤهلات', 'Qualifications')) + '</section>' +
      (contacts.length ? '<button type="button" class="lp-cbtn" data-act="lp-contacts">' + HI.phone + '<span>' + esc(A('التواصل مع المحاضر', 'Contact the lecturer')) + '</span><i>' + contacts.map(function (x) { return x[1]; }).join('') + '</i><em>‹</em></button>' :
        mine ? '<a class="lp-addc" href="#studio-page">' + HI.phone + '<span>' + esc(A('أضف رقم التواصل والبريد في صفحتي ليظهرا للطلاب', 'Add your contact number and email on My page so students see them')) + '</span></a>' : '') +
      '<section class="lp-mini"><button type="button" class="lp-m" data-act="lp-list" data-k="about">' + PI.users + '<span><b>' + esc(A('عن المحاضر', 'About the lecturer')) + '</b><small>' + esc(l.bio ? A('اضغط للقراءة', 'Tap to read') : A('لم تُكتب بعد', 'Not written yet')) + '</small></span></button>' +
        '<span class="lp-m">' + HI.cal + '<span><b>' + esc(A('تاريخ الانضمام', 'Joined')) + '</b><small>' + esc(IS.date(l.created_at)) + '</small></span></span></section>';
    /* the long boxes (about, qualifications, quick facts, links) are now inside those buttons; courses and events stay below */
    [].slice.call(t.content.querySelectorAll('.cols > .main > .box, .cols > .aside')).forEach(function (x) { x.parentNode.removeChild(x); });
    return hero + body + t.innerHTML;
  }, lec0.o);
  var LPDATA = null;
  /* one «التواصل» button: a list of the ways to reach the lecturer, each with a small «راسل» (owner, 21 Nov 2026) */
  IS.ACT['lp-contacts'] = function () {
    var d = LPDATA; if (!d || !d.contacts) return;
    IS.sheet(esc(A('التواصل مع ', 'Contact ')) + IS.lecName(d.l.name), '<div class="lp-sheet"><div class="lp-list">' + d.contacts.map(function (x) {
      return '<span class="lp-cr"><i class="lp-ci ' + x[0] + '">' + x[1] + '</i><span class="lp-tx"><b>' + esc(x[0] === 'wa' ? A('واتساب', 'WhatsApp') : A('البريد الإلكتروني', 'Email')) + '</b><small dir="ltr">' + esc(x[3]) + '</small></span>' +
        '<a class="lp-send ' + x[0] + '" href="' + esc(x[4]) + '"' + (x[0] === 'wa' ? ' target="_blank" rel="noopener"' : '') + '>' + esc(A('راسل', 'Message')) + '</a></span>'; }).join('') + '</div></div>');
  };
  document.addEventListener('click', function (e) { if (e.target.closest('.lp-send')) setTimeout(function () { IS.closeSheet(); }, 250); });
  /* WhatsApp or email ask first (owner, 21 Nov 2026: "when you press WhatsApp or email it should confirm, then go") */
  IS.ACT['lp-contact'] = function (b) {
    var wa = b.getAttribute('data-kind') === 'wa', href = b.getAttribute('data-href'), v = b.getAttribute('data-v'), who = LPDATA && LPDATA.l ? LPDATA.l.name : '';
    IS.sheet(esc(wa ? A('التواصل عبر واتساب', 'Contact on WhatsApp') : A('التواصل عبر البريد', 'Contact by email')),
      '<div class="lp-cf"><i class="' + (wa ? 'wa' : 'mail') + '">' + (wa ? HI.phone : HI.mail) + '</i><p>' + esc(wa ? A('ستنتقل إلى واتساب لمراسلة ', 'You will go to WhatsApp to message ') : A('سيُفتح بريدك لمراسلة ', 'Your mail app will open to write to ')) +
      '<b dir="auto">' + esc(who) + '</b></p><small dir="ltr">' + esc(v) + '</small><div class="lp-cfb"><a class="lp-btn gold" href="' + esc(href) + '"' + (wa ? ' target="_blank" rel="noopener"' : '') + '>' +
      (wa ? HI.phone : HI.mail) + '<span>' + esc(wa ? A('متابعة إلى واتساب', 'Continue to WhatsApp') : A('متابعة إلى البريد', 'Continue to email')) + '</span></a></div></div>');
  };
  document.addEventListener('click', function (e) { if (e.target.closest('.lp-cf a.lp-btn')) setTimeout(function () { IS.closeSheet(); }, 250); });
  IS.ACT['lp-cf-no'] = function () { IS.closeSheet(); };
  IS.ACT['lp-list'] = async function (b) {
    var d = LPDATA, key = b.getAttribute('data-k'); if (!d) return;
    var empty = function (t) { return '<p class="lp-empty">' + esc(t) + '</p>'; }, html = '', title = '';
    if (key === 'followers') {
      title = A('المتابعون', 'Followers');
      var list = [];
      try { if (DB.live) { var r = await DB.sb.rpc('ish_followers', { p_user: d.id }); list = r.data || []; }
        else { var f = (await DB.q('follows')).filter(function (x) { return x.followee === d.id; }); for (var i = 0; i < f.length; i++) { var pp = await DB.one('profiles', f[i].follower).catch(function () { return null; }); if (pp) list.push({ id: pp.id, name: pp.name, photo: pp.photo }); } } } catch (e) {}
      html = list.length ? '<div class="lp-list">' + list.map(function (x) { return '<a href="#person/' + esc(x.id) + '">' + IS.av(x, 'sm', x.id) + '<b dir="auto">' + esc(x.name || '') + '</b><em>‹</em></a>'; }).join('') + '</div>' : empty(A('لا يوجد متابعون بعد.', 'No followers yet.'));
    } else if (key === 'courses') {
      title = A('الكورسات', 'Courses');
      html = d.courses.length ? '<div class="lp-list">' + d.courses.map(function (x) { return '<a href="#course/' + esc(x.id) + '"><span class="lp-th">' + IS.poster(x.cover || 'img/collection/courses.webp') + '</span><span class="lp-tx"><b dir="auto">' + esc(x.title || '') + '</b><small>' + esc(+x.price > 0 ? A('مدفوع', 'Paid') : A('مجاني', 'Free')) + ' · ' + N(x.n_lessons || 0) + ' ' + esc(A('درس', 'lessons')) + '</small></span><em>‹</em></a>'; }).join('') + '</div>' : empty(A('لا توجد كورسات منشورة بعد.', 'No published courses yet.'));
    } else if (key === 'ach') {
      title = A('الإنجازات', 'Achievements');
      html = d.ach.length ? '<div class="lp-list">' + d.ach.map(function (x) { return '<span><i class="lp-emo">' + x[0] + '</i><b>' + esc(x[1]) + '</b></span>'; }).join('') + '</div>' : empty(A('لا توجد إنجازات بعد.', 'No achievements yet.'));
    } else if (key === 'quals') {
      title = A('المؤهلات', 'Qualifications');
      html = (d.l.quals || []).length ? '<div class="lp-list">' + d.l.quals.map(function (q) { return '<span><i class="lp-emo">🎓</i><b dir="auto">' + esc(q) + '</b></span>'; }).join('') + '</div>' : empty(A('لم تُضف المؤهلات بعد.', 'No qualifications added yet.'));
    } else if (key === 'about') {
      title = A('عن المحاضر', 'About the lecturer');
      html = d.l.bio ? '<div class="rich lp-about">' + IS.clean(d.l.bio) + '</div>' : empty(A('لم يكتب المحاضر نبذة بعد.', 'The lecturer has not written about himself yet.'));
    }
    IS.sheet(esc(title), '<div class="lp-sheet">' + html + '</div>');
  };

  /* ---------- Lecturers list in the owner's picture (21 Nov 2026): a card per lecturer — picture panel (online badge, rating, courses) beside
     the name, title, a short bio, speciality | section and followers; buttons «عرض الملف» · «متابعة» · «تقييم» · «إعجاب» ---------- */
  HI.heart = svg('0 0 24 24', '<path d="M12 20s-7.5-4.6-9-9.3C1.9 7.3 4.2 4 7.6 4c2 0 3.4 1.1 4.4 2.6C13 5.1 14.4 4 16.4 4c3.4 0 5.7 3.3 4.6 6.7C19.5 15.4 12 20 12 20z"/>', ' fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"');
  HI.user = svg('0 0 24 24', '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>', ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"');
  var LECS = {};
  HI.steth = svg('0 0 24 24', '<path d="M6 3v5a5 5 0 0 0 10 0V3"/><path d="M11 13v2a5 5 0 0 0 10 0v-1"/><circle cx="21" cy="12" r="2"/>', ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"');
  HI.mark = svg('0 0 24 24', '<path d="M6 3.5h12v17l-6-4.2-6 4.2z"/>', ' fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"');
  HI.send = svg('0 0 24 24', '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>', ' fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"');
  /* lecturer card, owner's picture (21 Nov 2026): picture with the online / last-activity badge; name, title pill; bio beside them;
     a line of rating · section · speciality · courses · followers; buttons «عرض الملف» · «متابعة» · «طلب» · «مفضلة» */
  function mrLecCard(l, nCourses, followers, iFollow) {
    var r = IS.lecRating(l.id), n = r.rating_count, rate = n ? r.rating_points / n : 0, spec = IS.mySpec(), section = IS.mySection();
    var fav = IS.ME && !!(IS.LS.get('fav-' + IS.ME.id, {})['t:' + l.id]), mine = IS.ME && IS.ME.id === l.id;
    var bio = String(l.bio || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return '<article class="mlx" data-go="#lecturer/' + esc(l.id) + '"><div class="mlx-top">' +
      '<div class="mlx-pic"><a class="mlx-av" href="#lecturer/' + esc(l.id) + '">' + IS.av(l, 'xl', l.id) + '</a></div>' +
      '<div class="mlx-id"><h3 dir="auto"><a href="#lecturer/' + esc(l.id) + '">' + IS.lecName(l.name) + '</a>' + (l.status === 'active' ? PI.check : '') + '</h3>' +
        /* the name alone on its line; under it the title with the last activity; the picture alone (owner, 21 Nov 2026) */
        '<div class="mlx-sub">' + (l.title ? '<span class="mlx-t" dir="auto">' + HI.brief + '<b>' + esc(l.title) + '</b></span>' : '') + '<span class="mlx-on">' + IS.seen(l.id) + '</span></div></div>' +
      '</div>' +   /* no bio here: only the name with the title beside it (owner, 21 Nov 2026) */
      '<div class="mlx-meta"><span class="mlx-rate">' + (n ? '<small>(' + N(n) + ')</small>' : '') + '<em>' + [1, 2, 3, 4, 5].map(function (i) { return '<u class="' + (i <= Math.round(rate) ? 'on' : '') + '">★</u>'; }).join('') + '</em>' + (n ? '<b>' + rate.toFixed(1) + '</b>' : '') + '</span>' +
        (section ? '<b class="mlx-c s" lang="en">' + esc(section.id === 'special' ? 'International' : section.en) + '</b>' : '') + (spec ? '<i class="mlx-sl"></i><b class="mlx-c" lang="en">' + esc(spec.en) + '</b>' : '') +
        '<i class="mlx-sl"></i><span class="mlx-n">' + HI.layers.replace(G, 'currentColor') + '<b>' + N(nCourses) + '</b><small>' + esc(A('كورسات', 'courses')) + '</small></span>' +
        '<i class="mlx-sl"></i><span class="mlx-n">' + PI.users + '<b>' + nfmt(followers) + '</b><small>' + esc(A('متابع', 'followers')) + '</small></span></div>' +
      '<div class="mlx-acts"><a class="mlx-b gold" href="#lecturer/' + esc(l.id) + '">' + HI.user + '<span>' + esc(A('عرض الملف', 'View profile')) + '</span></a>' +
        (mine ? '<a class="mlx-b green" href="#studio">' + HI.layers.replace(G, 'currentColor') + '<span>' + esc(A('الاستوديو', 'Studio')) + '</span></a>' :
          '<button type="button" class="mlx-b green' + (iFollow ? ' on' : '') + '" data-act="pffollow" data-id="' + esc(l.id) + '">' + (iFollow ? PI.tick : HI.userPlus) + '<span>' + esc(iFollow ? A('متابَع', 'Following') : A('متابعة', 'Follow')) + '</span></button>') +
        (mine ? '' : '<a class="mlx-b" href="#course-requests/new/' + esc(l.id) + '">' + HI.send + '<span>' + esc(A('طلب', 'Request')) + '</span></a>') +
        '<button type="button" class="mlx-b fav" data-act="fav" data-k="t:' + esc(l.id) + '" aria-pressed="' + fav + '">' + HI.mark + '<span>' + esc(A('مفضلة', 'Saved')) + '</span></button></div></article>';
  }
  var lecs0 = IS.pageOf && IS.pageOf('lecturers');
  if (lecs0) IS.page('lecturers', async function (arg) {
    var inner = await lecs0.fn(arg);
    if (typeof inner !== 'string' || inner.indexOf('class="grid g4"') < 0) return inner;
    var r = await Promise.all([DB.q('lecturers', { eq: { status: 'active' } }), IS.pubCourses(true)]);
    var cs = r[1].filter(IS.inStudySpace), ls = IS.studyLecturers(r[0], r[1]), ids = ls.map(function (l) { return l.id; });
    var fl = IS.ME && ids.length ? await DB.q('follows', { in: { followee: ids } }).catch(function () { return []; }) : [];
    LECS = {}; ls.forEach(function (l) { LECS[l.id] = { l: l, cs: cs.filter(function (c) { return c.lecturer_id === l.id; }) }; });
    var cards = ls.map(function (l) {
      var f = fl.filter(function (x) { return x.followee === l.id; });
      return mrLecCard(l, LECS[l.id].cs.length, f.length, IS.ME && f.some(function (x) { return x.follower === IS.ME.id; }));
    }).join('');
    var t = document.createElement('template'); t.innerHTML = inner;
    var g = t.content.querySelector('.grid.g4'), join = g && g.querySelector('.lcard.join');
    if (g) { g.className = 'mlc-list mlx-list'; g.innerHTML = cards + (join ? join.outerHTML : ''); }
    return t.innerHTML;
  }, lecs0.o);
  /* lecturers are rated by the students of their courses: the button lists his courses to rate from */
  IS.ACT['mlc-rate'] = function (b) {
    var d = LECS[b.getAttribute('data-id')]; if (!d) return;
    IS.sheet(esc(A('تقييم ', 'Rate ')) + IS.lecName(d.l.name), '<div class="lp-sheet"><p class="lp-empty">' + esc(A('يقيّم الطلاب المحاضر من صفحة الكورس الذي سجّلوا فيه.', 'Students rate the lecturer from the page of the course they joined.')) + '</p>' +
      (d.cs.length ? '<div class="lp-list">' + d.cs.map(function (x) { return '<a href="#course/' + esc(x.id) + '"><span class="lp-th">' + IS.poster(x.cover || 'img/collection/courses.webp') + '</span><span class="lp-tx"><b dir="auto">' + esc(x.title || '') + '</b><small>' + esc(A('قيّم من هنا', 'Rate here')) + '</small></span><em>‹</em></a>'; }).join('') + '</div>' :
        '<p class="lp-empty">' + esc(A('لا توجد كورسات منشورة بعد.', 'No published courses yet.')) + '</p>') + '</div>');
  };

  /* ---------- Community page, owner's picture (21 Nov 2026): figures in one strip with thin separators, then four buttons that
     show only that kind of post: Announcements · Resources (course previews) · Questions · Discussions ---------- */
  HI.mega = svg('0 0 24 24', '<path d="M3 10v4h3l7 4V6L6 10z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>', ' fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"');
  HI.help = svg('0 0 24 24', '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.2-2.5 3.8M12 17h.01"/>', ' fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"');
  HI.chats = svg('0 0 24 24', '<path d="M3 5h12v8H8l-4 3v-3H3z"/><path d="M15 9h6v8h-1v3l-4-3h-5v-2"/>', ' fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"');
  HI.pen = svg('0 0 24 24', '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>', ' fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"');
  var CKINDS = [['post', HI.pen, 'المنشورات', 'Posts'], ['announcement', HI.mega, 'الإعلانات', 'Announcements'], ['course_preview', HI.mark, 'الموارد', 'Resources'], ['question', HI.help, 'الأسئلة', 'Questions'], ['discussion', HI.chats, 'النقاشات', 'Discussions']];
  var com0 = IS.pageOf && IS.pageOf('community');
  if (com0) IS.page('community', async function (room) {
    var inner = await com0.fn(room);
    if (typeof inner !== 'string' || /^new/.test(String(room || '')) || inner.indexOf('class="spacebox') < 0) return inner;
    var bar = '<nav class="cm-kinds" aria-label="' + esc(A('نوع المنشور', 'Post type')) + '">' + CKINDS.map(function (k) {
      return '<button type="button" class="cm-k" data-act="cm-kind" data-k="' + k[0] + '" aria-pressed="false">' + k[1] + '<span>' + esc(A(k[2], k[3])) + '</span></button>'; }).join('') + '</nav>';
    /* above the posts: Sort (newest · most popular · most commented) · Type · Publish, like the section page (owner, 21 Nov 2026) */
    var tools = '<div class="feed-filters mh-ltool cm-tools"><label>' + HI.sort + '<span>' + esc(A('الترتيب', 'Sort')) + '</span><select id="cm-sort">' +
      [['new', 'الأحدث', 'Newest'], ['top', 'الأكثر تفاعلًا', 'Most popular'], ['talk', 'الأكثر تعليقًا', 'Most commented']].map(function (o) { return '<option value="' + o[0] + '">' + esc(A(o[1], o[2])) + '</option>'; }).join('') + '</select></label>' +
      '<label>' + HI.doc + '<span>' + esc(A('التصنيف', 'Type')) + '</span><select id="cm-type"><option value="">' + esc(A('الكل', 'All')) + '</option>' +
      CKINDS.map(function (k) { return '<option value="' + k[0] + '">' + esc(A(k[2], k[3])) + '</option>'; }).join('') + '</select></label>' +
      (IS.ME ? '<i class="mh-sep"></i><a class="mh-pub" href="#community/new">' + HI.plus + '<span>' + esc(A('انشر', 'Publish')) + '</span></a>' : '') + '</div>';
    inner = inner.replace(/<a class="btn pri" href="#community\/new">[\s\S]*?<\/a>/, '');
    inner = /<\/details>/.test(inner) ? inner.replace(/(<details class="rules community-rules">[\s\S]*?<\/details>)/, '$1' + tools) : inner.replace(/(<div class="feed-items cm-feed">)/, tools + '$1');
    var a0 = IS.after;
    IS.after = function (main, remember) {
      var r = a0 ? a0(main, remember) : undefined;
      var fd = main.querySelector('.cm-feed'); if (fd && IS.hydrateFeedReactions) IS.hydrateFeedReactions(fd);
      var so = main.querySelector('#cm-sort'), ty = main.querySelector('#cm-type');
      if (so) so.onchange = function () { cmSort(so.value); };
      if (ty) ty.onchange = function () {
        var b = ty.value && main.querySelector('.cm-k[data-k="' + ty.value + '"]');
        if (b) { b.setAttribute('aria-pressed', 'false'); IS.ACT['cm-kind'](b); }
        else { var cur = main.querySelector('.cm-k[aria-pressed="true"]'); if (cur) IS.ACT['cm-kind'](cur); }
      };
      return r;
    };
    return inner.replace(/(<div class="spacebox[^"]*"[^>]*><div class="sts">[\s\S]*?<\/div>)/, '$1' + bar);
  }, com0.o);
  function cmSort(how) {
    var list = document.querySelector('.mra[data-pg="community"] .cm-feed'); if (!list) return;
    var rows = [].slice.call(list.children);
    var n = function (r, sel) { var e = r.querySelector(sel); return e ? Number(String(e.textContent).replace(/[^0-9]/g, '')) || 0 : 0; };
    if (!list._order) list._order = rows.slice();
    var sorted = how === 'new' ? list._order.slice() : rows.slice().sort(function (a, b) {
      return how === 'talk' ? n(b, '[data-feedback-count]') - n(a, '[data-feedback-count]') : (n(b, '.rx-k') + n(b, '[data-feedback-count]')) - (n(a, '.rx-k') + n(a, '[data-feedback-count]')); });
    sorted.forEach(function (r) { list.appendChild(r); });
  }
  IS.ACT['cm-kind'] = function (b) {
    var on = b.getAttribute('aria-pressed') !== 'true', k = b.getAttribute('data-k');
    IS.$$('.cm-k').forEach(function (x) { x.setAttribute('aria-pressed', x === b && on); });
    var tsel = document.getElementById('cm-type'); if (tsel) tsel.value = on ? k : '';
    var rows = IS.$$('.mra[data-pg="community"] .cm-feed > [data-pk]'), shown = 0;
    rows.forEach(function (r) { var ok = !on || r.getAttribute('data-pk') === k; r.hidden = !ok; if (ok) shown++; });
    var note = document.querySelector('.cm-empty'); if (note) note.hidden = true;
    if (on && !shown) {
      if (!note) { var list = document.querySelector('.mra[data-pg="community"] .cm-feed'); if (list) { list.insertAdjacentHTML('afterend', '<p class="cm-empty"></p>'); note = document.querySelector('.cm-empty'); } }
      if (note) { note.textContent = A('لا توجد منشورات من هذا النوع بعد.', 'No posts of this kind yet.'); note.hidden = false; }
    }
  };

  /* ---------- sign in, sign up, the email code and Features open in the same green and gold look (owner, 20 Nov 2026) ---------- */
  var sheet0 = IS.sheet;
  IS.sheet = function () { var d = sheet0.apply(this, arguments);
    if (d && d.querySelector('form[data-form=esignin],form[data-form=esignup],form[data-form=signin],form[data-form=signup],form[data-form=ecode],form[data-form=eforgot],form[data-form=gpreview],[data-act=google],.mr-feat')) {
      d.classList.add('mrdlg'); var h = d.querySelector('header'); if (h && !h.querySelector('.mrdlg-logo')) h.insertAdjacentHTML('afterbegin', '<img class="mrdlg-logo" src="' + IS.U('img/mr/smra-mark.webp') + '" alt="">'); }
    return d; };
  /* ---------- Features: every place of the platform (what the side menu held) ---------- */
  IS.ACT.mrfeat = function () {
    var links = IS.$$('#side nav a, #side .cnav a').map(function (a) {
      return '<a href="' + a.getAttribute('href') + '" class="' + (a.classList.contains('on') ? 'on' : '') + '">' + a.innerHTML + '</a>'; });
    IS.sheet(esc(A('المزايا', 'Features')), '<div class="mr-feat">' + links.join('') + '</div>');
  };

  /* the bottom bar fits every screen (owner, 21 Nov 2026: "in every device it doesn't fit well"): one label size for all buttons, the
     largest (12 px, 14 px on wide screens) at which every label fits its button, never below 8.5 px */
  function fitNav() {
    document.querySelectorAll('.mh-nav').forEach(function (nav) {
      var spans = nav.querySelectorAll('a span'); if (!spans.length) return;
      var size = innerWidth >= 900 ? 14 : 12; nav.style.setProperty('--navfs', size + 'px');
      for (var k = 0; k < 14; k++) {
        var over = false; spans.forEach(function (s) { if (s.scrollWidth > s.clientWidth + .5) over = true; });
        if (!over || size <= 8) break; size -= .5; nav.style.setProperty('--navfs', size + 'px');
      }
    });
  }
  IS.fitNav = fitNav;
  var route9 = IS.onRoute;
  IS.onRoute = function (name, arg, main) { if (route9) try { route9(name, arg, main); } catch (e) {} requestAnimationFrame(fitNav); setTimeout(fitNav, 400); };
  var fnT; window.addEventListener('resize', function () { clearTimeout(fnT); fnT = setTimeout(fitNav, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNav);
})();
