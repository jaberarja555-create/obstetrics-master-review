/* Master Review: the speciality screen (#pick) and the section screen (#pick-section) in the owner's green and gold design
   (20 Nov 2026, his pictures). They replace the older versions of these two pages in student.js (registered again here, so this file
   loads after student.js). Styles: css/mr.css. No app top bar, side menu or bottom tabs here: the «Features» button opens every place. */
(function () {
  var A = IS.A, esc = IS.esc, ic = IS.ic;
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
      '<button type="button" class="mr-me out" data-act="login"><span class="mr-av">' + I.person + '</span><b>' + esc(A('تسجيل الدخول', 'Sign in')) + '</b></button>';
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

  /* ---------- the speciality screen ---------- */
  IS.page('pick', async function () {
    var cur = IS.SPEC, specs = IS.SPECS;
    IS.after = after;
    return '<div class="mrx"><div class="mr-bg" aria-hidden="true"></div>' + DEFS + '<div class="mr-page">' +
      top(cur && IS.mySection && IS.mySection() ? '#home' : '#pick') + hello() + choose('اختر تخصصك', 'Choose your speciality') +
      '<nav class="mr-specs n' + specs.length + '" aria-label="' + esc(A('التخصصات', 'Specialities')) + '">' + specs.map(function (s) {
        return '<button type="button" class="mr-spec" data-act="setspec" data-v="' + esc(s.id) + '" aria-pressed="' + (s.id === cur) + '"><span class="art">' + (SPIC[s.id] || ic(s.icon)) + '</span>' +
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
      '<a class="mh-b" href="#pick-section" aria-label="' + esc(A('الأقسام', 'Sections')) + '">' + HI.home + '</a>' +
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
    return pban(img, I.steth, name, esc(spec.en) + ' <i>•</i> Study <i>•</i> Review <i>•</i> Practice', true);
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
  var home0 = IS.pageOf && IS.pageOf('home');
  if (home0) IS.page('home', async function (arg) {
    var inner = await home0.fn(arg), spec = IS.mySpec(), section = IS.mySection();
    if (!spec || !section) return inner;
    var a0 = IS.after;
    IS.after = function (main, remember) { after(); tidyFeed(main); return a0 ? a0(main, remember) : undefined; };
    return '<div class="mrx mrh"><div class="mh-bg" aria-hidden="true"></div>' + DEFS + '<div class="mh-page">' + htop() + hban(spec, section) + htitle(spec, section) + '<div class="mh-feed">' + inner + '</div></div></div>';
  }, home0.o);

  /* ---------- one day/night button: each press = Day → Night → Eye comfort (owner, 20 Nov 2026) ---------- */
  I.eye = '<svg class="ic eye" viewBox="0 0 24 24" fill="none" stroke="' + G + '" stroke-width="2" stroke-linecap="round"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3.2" fill="' + G + '"/></svg>';
  var THEMES = ['light', 'dark', 'eye'];
  IS.ACT.theme = function () {
    var c = document.documentElement.getAttribute('data-theme'), n = THEMES[(THEMES.indexOf(c) + 1) % 3];
    IS.setTheme(n); IS.chrome(document.body.getAttribute('data-page'));
    if (IS.toast) IS.toast(n === 'dark' ? A('الوضع الليلي', 'Night') : n === 'eye' ? A('راحة العين', 'Eye comfort') : A('الوضع النهاري', 'Day'));
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
      ptitle(A('محتوى المكتبة', 'Library content')) + tool + '<div class="mh-feed mh-lib">' + inner + '</div></div></div>';
  }, lib0.o);

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
})();
