/* The owner's own page banners (21 Nov 2026: «A lot of those bars appear bad especially in tablet or laptop and even phone, so use these»):
   Settings, My Library, Courses, Lecturers, the Medicine → Basics home and Lecturer registration show his pictures instead of the drawn
   banner. Tablets and laptops show the whole picture; phones (≤ 699 px) the text side of it (img/mr/ban/<key>-m.webp), so the words stay
   readable. Courses and Lecturers named one section in the picture: that word was painted out (tools: scratchpad bancut.py) and the
   current speciality / section is written in its place, scaled with the picture (container units). The page keeps a hidden h1. */
(function () {
  'use strict';
  var A = IS.A, esc = IS.esc;
  var TITLE = { settings: ['الإعدادات', 'Settings'], library: ['مكتبتي', 'My Library'], courses: ['الكورسات', 'Courses'], lecturers: ['المحاضرون', 'Lecturers'],
    basics: ['الأساسيات', 'Basics'], apply: ['التسجيل كمحاضر', 'Become a lecturer'] };
  function keyOf(name) {
    if (name === 'settings' || name === 'library' || name === 'courses' || name === 'lecturers') return name;
    if (name === 'studio-apply') return 'apply';
    if (name === 'home') { var sp = IS.SPEC, sec = IS.mySection && IS.mySection(); if (sp === 'medicine' && sec && sec.id === 'basics') return 'basics'; }
    return '';
  }
  function subOf(key) {
    var sp = IS.mySpec && IS.mySpec(), sec = IS.mySection && IS.mySection();
    var secName = sec ? (sec.id === 'special' ? 'International' : sec.en) : '';
    if (key === 'courses') return [sp && sp.en, secName].filter(Boolean).join(' - ');
    if (key === 'lecturers') return secName || (sp && sp.en) || '';
    return '';
  }
  /* the picture in the app colour (owner, 21 Nov 2026: «match the bar for all color options»): maroon = his originals, the others made by
     tools/ishrah/banners_pal.py */
  function palSuffix() { var p = IS.LS ? IS.LS.get('pal', 'blue') : 'blue'; return /^(blue|ocean|teal|purple|graphite)$/.test(p) ? '-' + p : ''; }
  IS.ownerBanner = function (key) {
    var t = TITLE[key], sub = subOf(key), sf = palSuffix();
    return '<section class="mh-ban ob-ban" data-k="' + key + '"><picture><source media="(max-width:699px)" srcset="' + IS.U('img/mr/ban/' + key + '-m' + sf + '.webp') + '">' +
      '<img src="' + IS.U('img/mr/ban/' + key + sf + '.webp') + '" alt="" width="1600" height="200" decoding="async"></picture>' +
      (sub ? '<span class="ob-sub" lang="en" dir="ltr">' + esc(sub) + '</span>' : '') +
      '<h1 tabindex="-1" class="ob-h">' + esc(A(t[0], t[1])) + '</h1></section>';
  };
  /* the first banner of the page (drawn panel `.mh-ban` or the older `.ban … bpic`) becomes the picture; any figures it carried stay under it */
  function swap(name, html) {
    var key = keyOf(name); if (!key || typeof html !== 'string') return html;
    var m = /<section class="mh-ban[^"]*">[\s\S]*?<\/section>/.exec(html);
    if (m) return html.slice(0, m.index) + IS.ownerBanner(key) + html.slice(m.index + m[0].length);
    m = /<section class="ban [^"]*bpic"[^>]*>/.exec(html);
    if (!m) return html;
    /* the older banner may hold child sections? no: it closes at its first </section> */
    var end = html.indexOf('</section>', m.index); if (end < 0) return html;
    var inner = html.slice(m.index, end), extra = /<div class="bnums">[\s\S]*<\/div>/.exec(inner);
    return html.slice(0, m.index) + IS.ownerBanner(key) + (extra ? '<div class="ob-extra">' + extra[0] + '</div>' : '') + html.slice(end + 10);
  }
  /* every other drawn banner keeps one shape (CSS), so the buttons or figures it carried go in a row under it (owner: "size mismatch") */
  function moveExtras(html) {
    if (typeof html !== 'string') return html;
    var m = /<section class="ban [^"]*bpic"[^>]*>/.exec(html); if (!m) return html;
    var bt = html.indexOf('<div class="bt">', m.index), endS = html.indexOf('</section>', m.index);
    if (bt < 0 || endS < 0 || bt > endS) return html;
    var re = /<\/?div\b[^>]*>/g, d = 0, x, end = -1; re.lastIndex = bt;
    while ((x = re.exec(html))) { d += x[0].charAt(1) === '/' ? -1 : 1; if (d === 0) { end = re.lastIndex; break; } }
    if (end < 0 || end > endS) return html;
    var extra = html.slice(end, endS); if (!extra.replace(/\s+/g, '')) return html;
    return html.slice(0, end) + '</section><div class="ban-x">' + extra + '</div>' + html.slice(endS + 10);
  }
  var pf = IS.pageFrame;
  IS.pageFrame = function (name, html, arg) { html = moveExtras(swap(name, html)); return pf ? pf(name, html, arg) : html; };
})();
