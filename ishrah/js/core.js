/* اشرح لي: shared core: language, icons, router, signed-in user and team roles, sheets, toasts, forms, shell (top bar, side menu, tabs).
   Pages register themselves with IS.page(name, render, opts) in student.js, studio.js and control.js. */
(function () {
  'use strict';
  var IS = window.IS = {};
  var LS = IS.LS = {
    get: function (k, d) { try { var v = localStorage.getItem('ish-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('ish-' + k, JSON.stringify(v)); } catch (e) {} }
  };
  IS.lang = LS.get('lang', 'ar');
  var A = IS.A = function (ar, en) { return IS.lang === 'en' ? (en == null ? ar : en) : ar; };
  /* titles (owner, 18 Nov 2026): the big line is English, the Arabic sits under it in small text; English mode shows English only */
  IS.T = function (ar, en) { if (en == null || en === ar) return IS.esc(ar); if (IS.lang === 'en') return IS.esc(en); return '<span class="tt"><b lang="en" dir="ltr">' + IS.esc(en) + '</b><small>' + IS.esc(ar) + '</small></span>'; };
  var esc = IS.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  IS.N = function (x) { return '<bdi>' + (typeof x === 'number' ? x.toLocaleString('en-US') : esc(x)) + '</bdi>'; };
  IS.money = function (x) { return '<bdi>' + (+x || 0).toLocaleString('en-US') + '</bdi> ' + esc(IS.SET.currency === 'SDG' ? A('ج.س', 'SDG') : (IS.SET.currency || '')); };
  IS.$ = function (s, r) { return (r || document).querySelector(s); };
  IS.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  IS.ago = function (ts) {
    var d = (Date.now() - new Date(ts).getTime()) / 1000; if (!(d >= 0)) return '';
    if (d < 60) return A('الآن', 'now'); if (d < 3600) return A('قبل ' + Math.round(d / 60) + ' دقيقة', Math.round(d / 60) + ' min ago');
    if (d < 86400) return A('قبل ' + Math.round(d / 3600) + ' ساعة', Math.round(d / 3600) + ' h ago'); if (d < 86400 * 30) return A('قبل ' + Math.round(d / 86400) + ' يوم', Math.round(d / 86400) + ' days ago');
    return IS.date(ts);
  };
  IS.date = function (ts, o) { try { return new Date(ts).toLocaleDateString(IS.lang === 'en' ? 'en-GB' : 'ar-SD', o || { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ''; } };
  IS.norm = function (s) { return String(s || '').toLowerCase().replace(/[ً-ٟـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); };

  /* ---------- icons ---------- */
  var I = IS.I = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/><path d="m3 17.5 9 4.5 9-4.5" opacity=".55"/>',
    route: '<circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="5" r="2.2"/><path d="M8.2 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.8"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    group: '<circle cx="12" cy="7.5" r="3"/><circle cx="5" cy="9.5" r="2.3"/><circle cx="19" cy="9.5" r="2.3"/><path d="M6.5 20a5.5 5.5 0 0 1 11 0M1.5 18.5A3.8 3.8 0 0 1 5 15M22.5 18.5A3.8 3.8 0 0 0 19 15"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>', heart: '<path d="M12 20s-7.5-4.6-9.2-9.4C1.6 7 3.8 4 7 4c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.2 0 5.4 3 4.2 6.6C19.5 15.4 12 20 12 20z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4M12 13v4M8 21h8M9.5 17h5v4h-5z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>', gear: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    chart: '<path d="M4 20h16"/><path d="M7 16v-4M12 16V6M17 16v-7"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>', play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>',
    video: '<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="m15.5 10.5 6-3.5v10l-6-3.5"/>', book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20"/>',
    open: '<path d="M2.5 5.5C5 4.5 8.5 4.3 12 6.5c3.5-2.2 7-2 9.5-1v13c-2.5-1-6-1.2-9.5 1-3.5-2.2-7-2-9.5-1z"/><path d="M12 6.5v13"/>', qb: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.5v.6M12 17v.3"/>',
    file: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>', folder: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    filter: '<path d="M3.5 5h17l-6.5 8v6l-4-2v-4z"/>', check: '<path d="m5 12 5 5 9-10"/>', checkc: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>', chev: '<path d="m9 6 6 6-6 6"/>', down: '<path d="m6 9 6 6 6-6"/>', up: '<path d="m6 15 6-6 6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>', wa: '<path d="M4 20l1.2-4.2A8 8 0 1 1 8.4 19z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-1.8-1-.9.8c-1-.4-2-1.4-2.4-2.4l.8-.9-1-1.8z" fill="currentColor" stroke="none"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>', note: '<path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5M8.5 9h7M8.5 12.5h4"/>',
    pen: '<path d="m4 20 1-4L16 5l3 3L8 19z"/><path d="m14 7 3 3"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>', flame: '<path d="M12 21c-4 0-6.5-2.7-6.5-6.3C5.5 10 10 8 10 3c3.5 2 7 6 7 10.5 0 1.2-.3 2.2-.8 3 .3-2-1-3.5-2.2-4.2.3 3.2-1.3 4.3-2.5 4.3-1.4 0-2.2-1.1-2-2.6-1.6 1.2-1.4 3.7.3 5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>', cert: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M7 8.5h10M7 12h6"/><circle cx="16.5" cy="15.5" r="2.8"/><path d="m15 18-1 3.5 2.5-1.3 2.5 1.3-1-3.5"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.7 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.8 7.5-9.5V6z"/><path d="m8.8 12 2.3 2.3 4.2-4.6"/>', flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M12 16v.5M12 13.5c0-2.5 3-2.4 3-4.7a3 3 0 0 0-5.9-.6"/>', cloud: '<path d="M7 18h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9 4.5 4.5 0 0 0 7 18z"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>', menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    more: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
    sparkle: '<path d="M12 3c.6 4 2 5.4 6 6-4 .6-5.4 2-6 6-.6-4-2-5.4-6-6 4-.6 5.4-2 6-6z"/>', send: '<path d="M21 3 3 10.5l7 3 3 7z"/><path d="m10 13.5 4.5-4.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6 8.5-6"/>', eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    money: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/><path d="M6 9.5v5M18 9.5v5"/>', wallet: '<path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1z"/><path d="M4 7l11-3v3M16 13.5h.01"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>', studio: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="m10 8 4 2-4 2z" fill="currentColor"/><path d="M8 20h8M12 16v4"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 12h18"/>', org: '<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/>', crown: '<path d="m3 8 4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>', steth: '<path d="M6 3v6a5 5 0 0 0 10 0V3"/><path d="M11 14v2a5 5 0 0 0 10 0v-3"/><circle cx="21" cy="11" r="2"/>', flask: '<path d="M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3"/><path d="M7 15h10"/>',
    nurse: '<path d="M4 11c0-4 3.6-7 8-7s8 3 8 7v2H4z"/><path d="M12 6.5v4M10 8.5h4M6 13v3a6 6 0 0 0 12 0v-3"/>', tooth: '<path d="M12 5.5C10 4 7 3.5 5.5 5S4 9 5 12c.8 2.3 1 5 1.6 7 .4 1.4 2 1.4 2.4 0l1.2-4a1.9 1.9 0 0 1 3.6 0l1.2 4c.4 1.4 2 1.4 2.4 0 .6-2 .8-4.7 1.6-7 1-3 1-5.5-.5-7S14 4 12 5.5z"/>',
    pill: '<rect x="2.5" y="8" width="19" height="8" rx="4" transform="rotate(-40 12 12)"/><path d="m9 9 6 6"/>', leaf: '<path d="M5 20c0-9 5-15 15-16-1 10-7 15-15 16z"/><path d="M5 20 13 12"/>',
    s_blood: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>', s_xray: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 6v12M8 8.5c2 1 6 1 8 0M7.5 12c2.5 1 6.5 1 9 0M8 15.5c2 1 6 1 8 0"/>',
    s_ear: '<path d="M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 .5"/><path d="M10 9a2 2 0 0 1 4 0c0 1.5-2 2-2 3.5"/>', s_mask: '<path d="M4 9h16v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z"/><path d="M8 18v3h8v-3M2 9h2M20 9h2"/>',
    s_skin: '<path d="M3 15c3-2 6-2 9 0s6 2 9 0M3 9c3-2 6-2 9 0s6 2 9 0"/><circle cx="8" cy="12" r=".6"/><circle cx="16" cy="12" r=".6"/>', logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h10"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-8 9"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.7 3 2.7 15 0 18M12 3c-2.7 3-2.7 15 0 18"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>', list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>', live: '<circle cx="12" cy="12" r="2.5"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.9 4.9a10 10 0 0 0 0 14.2M19.1 4.9a10 10 0 0 1 0 14.2"/>',
    download: '<path d="M12 3.5v11.5M7 10.5l5 5 5-5"/><path d="M4.5 17v2.5h15V17"/>',
    offline: '<path d="M2 8.8a15 15 0 0 1 4.2-2.6M9.6 5.2A15 15 0 0 1 22 8.8M5 12.3a10 10 0 0 1 3.4-2.1M14 10.4a10 10 0 0 1 5 1.9M8.6 15.6a5 5 0 0 1 6.8 0"/><circle cx="12" cy="19.2" r=".9" fill="currentColor"/><path d="M3 3l18 18"/>',
    news: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7 8.5h10M7 12h4M7 15.5h4"/><rect x="13" y="11.5" width="4" height="4" rx=".8"/>',
    mega: '<path d="M3.5 10v4a1 1 0 0 0 1 1H7l6 4V5L7 9H4.5a1 1 0 0 0-1 1z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/>',
    pinned: '<path d="M9 3h6l-1 6 3 3H7l3-3z"/><path d="M12 12v9"/>',
    link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>', pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    bold: '<path d="M7 4h6a3.8 3.8 0 0 1 0 7.6H7zM7 11.6h7a3.9 3.9 0 0 1 0 7.9H7z"/>', ital: '<path d="M10 4h8M6 20h8M14 4l-4 16"/>', ul: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2" fill="currentColor"/><circle cx="4.5" cy="12" r="1.2" fill="currentColor"/><circle cx="4.5" cy="18" r="1.2" fill="currentColor"/>',
    h2: '<path d="M4 5v14M12 5v14M4 12h8M15 11a2.5 2.5 0 1 1 4 2l-4 5h5"/>', hl: '<path d="m14.5 4 5.5 5.5-8 8H6.5v-5.5z"/><path d="M4 21h20" stroke-width="3" opacity=".5"/>',
    clinic: '<path d="M4 21V8l8-5 8 5v13z"/><path d="M12 9v6M9 12h6M9 21v-3h6v3"/>', exam: '<rect x="5" y="3.5" width="14" height="17.5" rx="2"/><path d="M9 3.5h6v3H9z"/><path d="m8.5 13 2 2 4.5-4.5"/>',
    sudan: '<path d="M5 5h9l1.5 2.5L19 8l1 5-2 2 .5 3-4 1.5-3-1L8 20l-2-3-2-1V9z"/>', world: '<circle cx="12" cy="12" r="9"/><path d="M3.5 9h17M3.5 15h17M12 3c-3 3.5-3 14.5 0 18M12 3c3 3.5 3 14.5 0 18"/>',
    house: '<rect x="4" y="7" width="16" height="13" rx="2"/><path d="M9 7V4.5h6V7M12 10.5v6M9 13.5h6"/>',
    s_anatomy: '<circle cx="12" cy="4.5" r="2.2"/><path d="M8 8.5h8l-1 6h-1.5l-.5 7h-2l-.5-7H9z"/><path d="M8 8.5 5 14M16 8.5l3 5.5"/>',
    s_physiology: '<path d="M12 20s-7.5-4.6-9.2-9.4C1.6 7 3.8 4 7 4c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.2 0 5.4 3 4.2 6.6"/><path d="M13 12h2.5l1.5-3 2 6 1.5-3h2"/>',
    s_pathology: '<path d="M9 3h5M11.5 3v3"/><path d="M8 6.5h7l-1.5 6h-4z"/><path d="M5 21h14M9 21c0-3 1.5-5 3.5-6M16.5 14a5 5 0 0 1-2.5 7"/>',
    s_micro: '<circle cx="12" cy="12" r="5"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4M5.3 5.3l2.8 2.8M15.9 15.9l2.8 2.8M5.3 18.7l2.8-2.8M15.9 8.1l2.8-2.8"/>',
    s_pharma: '<path d="m10.5 20.5-7-7a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7z"/><path d="m7 10 7 7"/>', s_biochem: '<path d="M7 3c0 6 10 6 10 12s-10 6-10 6M17 3c0 6-10 6-10 12"/><path d="M8.5 7h7M9 12h6M8.5 17h7"/>',
    s_community: '<circle cx="12" cy="8" r="3"/><path d="M6 20a6 6 0 0 1 12 0"/><path d="M3.5 13.5a3 3 0 1 1 3.5-4.5M20.5 13.5A3 3 0 1 0 17 9"/>',
    s_heart: '<path d="M12 20s-7.5-4.6-9.2-9.4C1.6 7 3.8 4 7 4c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.2 0 5.4 3 4.2 6.6C19.5 15.4 12 20 12 20z"/><path d="M6.5 11h3l1.5-3 2 5 1.5-2h3"/>',
    s_scalpel: '<path d="M3 21 14 10l3 3-4 3.5C10 19 6 20.5 3 21z"/><path d="m14 10 6-6"/>', s_baby: '<circle cx="12" cy="9" r="5.5"/><path d="M9.8 9h.01M14.2 9h.01M10.5 11.5a2.2 2.2 0 0 0 3 0M7 21a5 5 0 0 1 10 0"/>',
    s_obgyn: '<circle cx="12" cy="11" r="6"/><path d="M12 17v4M9.5 19.5h5"/><circle cx="13" cy="10" r="2" fill="currentColor" opacity=".35"/>', s_brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h0V4zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3V4z"/>'
  };
  IS.ic = function (n, c) { return '<svg class="ico' + (c ? ' ' + c : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (I[n] || I.layers) + '</svg>'; };
  var ic = IS.ic;
  /* video from a link (owner, 18 Nov 2026, until Bunny): a lesson's video_id holds 'yt:<id>' (YouTube, unlisted) or 'gd:<id>' (Google Drive);
     a Bunny upload is a plain GUID. The id is returned by ish_lesson only to students who may watch the lesson, like an uploaded video. */
  IS.extVideo = function (u) {
    u = String(u || '').trim(); var m;
    if ((m = u.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/))) return 'yt:' + m[1];
    if ((m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?(?:.*&)?id=|uc\?(?:.*&)?id=)([A-Za-z0-9_-]{20,})/)) || (m = u.match(/docs\.google\.com\/file\/d\/([A-Za-z0-9_-]{20,})/))) return 'gd:' + m[1];
    return null;
  };
  IS.extEmbed = function (vid) {
    var m = String(vid || '').match(/^(yt|gd):([A-Za-z0-9_-]+)$/); if (!m) return null;
    return m[1] === 'yt' ? { kind: 'iframe', host: 'yt', src: 'https://www.youtube-nocookie.com/embed/' + m[2] + '?rel=0&modestbranding=1&playsinline=1' }
      : { kind: 'iframe', host: 'gd', src: 'https://drive.google.com/file/d/' + m[2] + '/preview' };
  };
  IS.U = function (p) { try { return esc(new URL(p, location.href).href); } catch (e) { return esc(p); } };

  /* ---------- signed-in user, lecturer record, team roles ---------- */
  IS.ME = null; IS.LEC = null; IS.SET = {}; IS.CATS = []; IS.SUBJ = []; IS.SPECS = []; IS.SPEC = LS.get('spec', '');
  /* the platform's administrative structure (owner's chart, 17 Nov 2026). Each role has, per section, the actions it may do:
     view · add · edit · delete · approve. The owner edits this matrix in the control app (the general manager for roles below him); the
     database applies the same matrix (supabase role_perms + ish_can), so hiding a button is never the only protection.
     Staff get sections chosen for them personally: 'p:<section>' (view, add, edit) and 'p:<section>:approve'. */
  var ALL = ['view', 'add', 'edit', 'delete', 'approve'];
  IS.ACTS = [['view', 'عرض', 'View'], ['add', 'إضافة', 'Add'], ['edit', 'تعديل', 'Edit'], ['delete', 'حذف', 'Delete'], ['approve', 'اعتماد', 'Approve']];
  var DEF = { gm: ['dash', 'students', 'lecturers', 'apps', 'review', 'paths', 'library', 'requests', 'pay', 'payout', 'events', 'community', 'notify', 'reports', 'cats', 'settings', 'audit', 'team', 'tickets', 'tasks'],
    academic: ['dash', 'apps', 'lecturers', 'review', 'paths', 'reports', 'tickets', 'tasks'], finance: ['dash', 'pay', 'payout', 'reports', 'tickets', 'tasks', ['lecturers', ['view', 'edit']]],
    content: ['dash', 'library', 'requests', 'cats', 'tickets', 'tasks'], community: ['dash', 'community', 'events', 'notify', 'tickets', 'tasks'],
    support: ['dash', 'students', 'requests', 'notify', 'tickets', 'tasks'], tech: ['dash', 'settings', 'audit', 'cats', 'reports', 'tickets', 'tasks'], staff: [['dash', ['view']], ['tasks', ['view', 'edit']]] };
  IS.DEFRP = {}; Object.keys(DEF).forEach(function (r) { IS.DEFRP[r] = {}; DEF[r].forEach(function (x) { if (typeof x === 'string') IS.DEFRP[r][x] = ALL.slice(); else IS.DEFRP[r][x[0]] = x[1].slice(); }); });
  IS.RP = IS.DEFRP;
  var PERMS = IS.PERMS = {}; Object.keys(IS.DEFRP).forEach(function (r) { PERMS[r] = Object.keys(IS.DEFRP[r]); }); PERMS.owner = ['*'];
  /* the department each manager role runs (tickets, tasks and staff are grouped by it) */
  IS.DEPTS = [['academic', 'القسم الأكاديمي', 'Academic'], ['finance', 'القسم المالي', 'Finance'], ['content', 'المحتوى والمكتبة', 'Content & library'], ['community', 'المجتمع والفعاليات', 'Community & events'],
    ['support', 'خدمة العملاء', 'Customer support'], ['tech', 'القسم التقني', 'Technical']];
  IS.ROLES = [['owner', 'مالك المنصة', 'Owner (Super Admin)', 'shield', 'التحكم الأعلى في النظام، إدارة الصلاحيات الحساسة، وتعيين المدير العام', 'Highest control, sensitive permissions and appointing the general manager'],
    ['gm', 'المدير العام', 'General Manager', 'briefcase', 'الإشراف على الأقسام، اعتماد القرارات، متابعة الأداء والتقارير العامة', 'Oversees the departments, approves decisions, follows performance and reports'],
    ['academic', 'المدير الأكاديمي', 'Academic Director', 'cert', 'إدارة المحاضرين، الكورسات، والمحتوى الأكاديمي وضمان جودته', 'Lecturers, courses and the quality of academic content'],
    ['finance', 'المدير المالي', 'Finance Manager', 'wallet', 'إدارة الاشتراكات، المدفوعات، مستحقات المحاضرين والتقارير المالية', 'Subscriptions, payments, lecturer payouts and financial reports'],
    ['content', 'مدير المحتوى والمكتبة', 'Content & Library Manager', 'open', 'إدارة الكتب، الشيتات، الملخصات، الملفات وطلبات المكتبة', 'Books, sheets, summaries, files and library requests'],
    ['community', 'مدير المجتمع والفعاليات', 'Community Manager', 'group', 'إدارة المجتمع والنقاشات والبلاغات، والفعاليات التعليمية والإعلانات', 'Community, discussions, reports, events and announcements'],
    ['support', 'مدير خدمة العملاء', 'Support Manager', 'help', 'الرد على استفسارات المستخدمين، معالجة الطلبات والشكاوى', 'User enquiries, requests and complaints'],
    ['tech', 'المدير التقني', 'Technical Manager', 'gear', 'إدارة النظام والمنصة، البنية التقنية، الأمان والدعم الفني', 'The system, technical infrastructure, security and technical support'],
    ['staff', 'المشرفون والموظفون', 'Supervisors & Staff', 'users', 'تنفيذ المهام التشغيلية في الأقسام المختلفة تحت إشراف مديري الأقسام', 'Operational tasks in the departments under the department managers']];
  IS.can = function (p, act) {
    act = act || 'view'; var me = IS.ME, t = (me && me.team) || []; if (!t.length) return false;
    if (me.status === 'blocked' || me.team_status === 'suspended') return false;
    if (IS.MFA_NEEDED) return false;   // two-factor login required and not done yet
    if (t.indexOf('owner') >= 0) return true;
    if (act === 'approve' && me.approval === 'none') return false;
    if (t.indexOf('p:' + p + ':' + act) >= 0 || (t.indexOf('p:' + p) >= 0 && ['view', 'add', 'edit'].indexOf(act) >= 0)) return true;
    return t.some(function (r) { var x = IS.RP[r] && IS.RP[r][p]; return !!(x && x.indexOf(act) >= 0); });
  };
  IS.dept = function () { var me = IS.ME; if (!me) return ''; if (me.dept) return me.dept; var t = me.team || []; return (IS.DEPTS.filter(function (d) { return t.indexOf(d[0]) >= 0; })[0] || [''])[0]; };
  IS.manager = function () { var t = (IS.ME && IS.ME.team) || []; return t.some(function (r) { return r !== 'staff' && r.indexOf('p:') !== 0; }); };
  IS.team = function () { return !!(IS.ME && (IS.ME.team || []).length); };
  IS.loadMe = async function () {
    var uid = DB.uid(); IS.ME = null; IS.LEC = null; IS.OFFME = false;
    if (!uid && !navigator.onLine) { try { var oc = JSON.parse(localStorage.getItem('ish-me') || 'null'); if (oc && oc.uid) { IS.ME = oc.me; IS.LEC = oc.lec; IS.OFFME = true; return; } } catch (e) {} }
    if (uid) {
      IS.ME = await DB.one('profiles', uid).catch(function () { return null; });
      if (!IS.ME && DB.live) { await new Promise(function (r) { setTimeout(r, 900); }); IS.ME = await DB.one('profiles', uid).catch(function () { return null; }); }
      if (IS.ME) IS.LEC = await DB.one('lecturers', uid).catch(function () { return null; });
      if (IS.ME && IS.ME.spec && IS.ME.spec !== IS.SPEC) { IS.SPEC = IS.ME.spec; LS.set('spec', IS.SPEC); }
      else if (IS.ME && IS.SPEC && !IS.ME.spec) { IS.ME.spec = IS.SPEC; DB.upd('profiles', IS.ME.id, { spec: IS.SPEC }).catch(function () {}); }
      /* without internet the last known profile of this account is used (owner, 18 Nov 2026: offline use) */
      try { if (IS.ME) localStorage.setItem('ish-me', JSON.stringify({ uid: uid, me: IS.ME, lec: IS.LEC })); else { var c = JSON.parse(localStorage.getItem('ish-me') || 'null'); if (c && c.uid === uid && !navigator.onLine) { IS.ME = c.me; IS.LEC = c.lec; IS.OFFME = true; } } } catch (e) {}
    }
  };
  /* the student's speciality space: kept on the device and in the profile, so it follows the account to every device */
  IS.setSpec = function (id) { IS.SPEC = id || ''; LS.set('spec', IS.SPEC); if (IS.ME && IS.ME.spec !== IS.SPEC) { IS.ME.spec = IS.SPEC; DB.upd('profiles', IS.ME.id, { spec: IS.SPEC }).catch(function () {}); }
    IS.LSPEC = ''; document.dispatchEvent(new Event('ish-spec')); };
  IS.mySpec = function () { return IS.spec(IS.SPEC); };
  IS.loadBase = async function () {
    var r = await Promise.all([DB.q('settings'), DB.q('categories', { order: ['sort'] }), DB.q('subjects', { order: ['sort'] }), DB.q('specialties', { order: ['sort'] }).catch(function () { return []; })]);
    IS.SET = {}; r[0].forEach(function (s) { IS.SET[s.id] = s.value; }); IS.CATS = r[1]; IS.SUBJ = r[2].map(function (x) { if (!x.spec) x.spec = 'medicine'; if (!x.img && (window.ISH_SUBIMG || []).indexOf(x.id) >= 0) x.img = 'img/sub_' + x.id + '.webp'; return x; }); IS.SPECS = r[3];
    try { var rp = await DB.q('role_perms'), m = JSON.parse(JSON.stringify(IS.DEFRP)), seen = {}; rp.forEach(function (x) { if (!seen[x.role]) { seen[x.role] = 1; m[x.role] = {}; } if ((x.acts || ALL).length) m[x.role][x.perm] = x.acts || ALL.slice(); }); IS.RP = m; } catch (e) {}
  };
  IS.cat = function (id) { return IS.CATS.filter(function (c) { return c.id === id; })[0]; };
  IS.subj = function (id) { return IS.SUBJ.filter(function (c) { return c.id === id; })[0]; };
  IS.spec = function (id) { return IS.SPECS.filter(function (c) { return c.id === id; })[0]; };
  IS.audit = function (action, target) { if (!IS.ME) return; DB.ins('audit', { user_id: IS.ME.id, name: IS.ME.name, action: action, target: target || '' }).catch(function () {}); };
  IS.notify = function (uid, title, body, link) { return DB.ins('notices', { user_id: uid || null, title: title, body: body || '', link: link || '' }).catch(function () {}); };

  /* ---------- small UI parts ---------- */
  IS.av = function (o, cls) {
    o = o || {}; var nm = String(o.name || '').replace(/^(د\.|Dr\.?)\s*/, '').trim().split(/\s+/), ini = (nm[0] || '؟')[0] + (nm.length > 1 ? nm[nm.length - 1][0] : '');
    return '<span class="av ' + (cls || '') + '">' + (o.photo ? '<img src="' + IS.U(o.photo) + '" alt="" loading="lazy">' : '<b>' + esc(ini) + '</b>') + '</span>';
  };
  IS.chip = function (t, c) { return '<span class="chip ' + (c || '') + '">' + t + '</span>'; };
  IS.bar = function (v, c) { v = Math.max(0, Math.min(100, Math.round(v || 0))); return '<span class="bar' + (c ? ' ' + c : '') + '"><i style="width:' + v + '%"></i></span>'; };
  IS.empty = function (icon, t1, t2, act) { return '<div class="empty">' + ic(icon) + '<b>' + esc(t1) + '</b>' + (t2 ? '<span>' + esc(t2) + '</span>' : '') + (act || '') + '</div>'; };
  /* page banners with the owner's pictures (18 Nov 2026): text and icon on one side, the photo on the other, a bright blue wave between */
  var BANIMG = { team: 'community', downloads: 'library', news: 'news', 'control-news': 'news', 'control-notify': 'news', courses: 'courses', specialties: 'specialties', learning: 'learning', events: 'events', lecturers: 'lecturers', community: 'community', library: 'library', paths: 'paths', path: 'paths',
    support: 'support', ticket: 'support', achievements: 'achievements', cert: 'achievements', 'control-tickets': 'support', 'control-paths': 'paths', 'control-events': 'events', 'control-lecturers': 'lecturers',
    'control-community': 'community', 'control-library': 'library', 'control-review': 'courses', 'control-cats': 'specialties', 'control-apps': 'lecturers', 'studio-courses': 'courses', 'studio-events': 'events', 'studio-apply': 'lecturers',
    favorites: 'library', notifications: 'support', settings: 'support', account: 'learning', about: 'community', terms: 'library', search: 'courses', lecturer: 'lecturers', event: 'events', post: 'community',
    'control-pay': 'admin', 'control-payouts': 'admin', 'studio-money': 'admin', 'studio-students': 'community', 'studio-qa': 'support', 'studio-page': 'lecturers', studio: 'courses' };
  IS.banner = function (title, sub, icon, extra, cls) { var pg = document.body.getAttribute('data-page') || '', im = BANIMG[pg] || (/^control|^security/.test(pg) ? 'admin' : /^studio/.test(pg) ? 'lecturers' : 'learning');
    return '<section class="ban ' + (cls || '') + (im ? ' bpic' : '') + '"' + (im ? ' style="--bimg:url(' + IS.U('img/ban_' + im + '.webp') + ')"' : '') + '>' + (im ? '<span class="bph" aria-hidden="true"></span><svg class="bwave" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M60 0 C40 30 45 70 22 100 L0 100 L0 0Z" fill="currentColor"/><path d="M62 0 C42 30 47 70 24 100" fill="none" style="stroke:var(--sky2)" stroke-width="1.6"/></svg>' : '') +
      '<div class="bt"><span class="bi">' + ic(icon) + '</span><div><h1 tabindex="-1"' + (function () { var m = /<b[^>]*>([^<]*)<\/b>/.exec(title), n = (m ? m[1] : String(title).replace(/<[^>]+>/g, '')).length; return n > 30 ? ' class="tl3"' : n > 20 ? ' class="tl2"' : ''; })() + '>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div></div>' + (extra || '') + '</section>'; };
  IS.stars = function (v) { var h = ''; for (var i = 1; i <= 5; i++) h += ic('star', i <= Math.round(v) ? 'on' : ''); return '<span class="stars">' + h + '</span>'; };
  IS.status = function (s) {
    var m = { pending: ['قيد المراجعة', 'Pending', 'warn'], active: ['مفعّل', 'Active', 'ok'], approved: ['مقبول', 'Approved', 'ok'], rejected: ['مرفوض', 'Rejected', 'bad'], draft: ['مسودة', 'Draft', ''], review: ['قيد المراجعة', 'In review', 'warn'],
      published: ['منشور', 'Published', 'ok'], hidden: ['مخفي', 'Hidden', 'bad'], blocked: ['موقوف', 'Blocked', 'bad'], open: ['مفتوح', 'Open', 'warn'], resolved: ['تمت المعالجة', 'Resolved', 'ok'], removed: ['محذوف', 'Removed', 'bad'] }[s] || [s, s, ''];
    return IS.chip(esc(A(m[0], m[1])), 'st ' + m[2]);
  };
  IS.wa = function (num, txt) { return 'https://wa.me/' + String(num || IS.SET.whatsapp || '').replace(/[^0-9]/g, '') + (txt ? '?text=' + encodeURIComponent(txt) : ''); };

  /* toast */
  IS.toast = function (m, bad) { var t = IS.$('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = m; t.className = 'on' + (bad ? ' bad' : ''); clearTimeout(IS.toast.tm); IS.toast.tm = setTimeout(function () { t.className = ''; }, 2800); };
  IS.fail = function (e) { if (window.console) console.error(e); IS.toast(A('تعذّر الحفظ. تحقق من الاتصال وحاول مرة أخرى.', 'Could not save. Check the connection and try again.') + (e && e.message && e.message.length < 90 ? ' (' + e.message + ')' : ''), true); };

  /* sheet (dialog) */
  IS.sheet = function (title, body, opt) {
    opt = opt || {}; var d = IS.$('#sheet'); if (!d) { d = document.createElement('div'); d.id = 'sheet'; document.body.appendChild(d);
      d.addEventListener('click', function (e) { if (e.target === d || e.target.closest('[data-close]')) IS.closeSheet(); }); }
    d.innerHTML = '<div class="dlg' + (opt.wide ? ' wide' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(title.replace(/<[^>]+>/g, '')) + '"><header><h2>' + title + '</h2><button type="button" class="ib" data-close aria-label="' + esc(A('إغلاق', 'Close')) + '">' + ic('x') + '</button></header><div class="shb">' + body + '</div></div>';
    d.hidden = false; document.body.classList.add('noscroll'); var f = d.querySelector('input:not([type=hidden]),textarea,select'); if (f && !opt.nofocus) setTimeout(function () { try { f.focus(); } catch (e) {} }, 60);
    return d.querySelector('.dlg');
  };
  IS.closeSheet = function () { var d = IS.$('#sheet'); if (d) { d.hidden = true; d.innerHTML = ''; } document.body.classList.remove('noscroll'); };
  IS.confirm = function (msg, yes) { return new Promise(function (ok) { var s = IS.sheet(A('تأكيد', 'Confirm'), '<p class="lead">' + esc(msg) + '</p><div class="row end"><button class="btn ghost" data-close>' + esc(A('إلغاء', 'Cancel')) + '</button><button class="btn pri" id="cfy">' + esc(yes || A('نعم', 'Yes')) + '</button></div>', { nofocus: 1 });
    s.querySelector('#cfy').onclick = function () { IS.closeSheet(); ok(true); }; var d = IS.$('#sheet'), h = function () { if (d.hidden) { ok(false); } }; setTimeout(function () { d.addEventListener('click', h, { once: true }); }, 0); }); };
  IS.ask = function (title, label, val, opt) { opt = opt || {}; return new Promise(function (ok) {
    var s = IS.sheet(title, '<form class="form" id="askf"><label class="fl"><span>' + esc(label) + '</span>' + (opt.area ? '<textarea name="v" rows="4">' + esc(val || '') + '</textarea>' : '<input name="v" value="' + esc(val || '') + '"' + (opt.type ? ' type="' + opt.type + '"' : '') + '>') + '</label><div class="row end"><button type="button" class="btn ghost" data-close>' + esc(A('إلغاء', 'Cancel')) + '</button><button class="btn pri">' + esc(opt.ok || A('حفظ', 'Save')) + '</button></div></form>');
    s.querySelector('#askf').onsubmit = function (e) { e.preventDefault(); var v = this.v.value.trim(); IS.closeSheet(); ok(v); }; }); };

  /* image picked by a user → resized JPEG file (covers, photos, receipts) */
  IS.shrink = function (file, max, q) { return new Promise(function (ok) {
    if (!file || !/^image\//.test(file.type)) return ok(file); var rd = new FileReader();
    rd.onload = function () { var im = new Image(); im.onload = function () { var k = Math.min(1, (max || 1400) / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); c.toBlob(function (b) { ok(b ? new File([b], (file.name || 'img').replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file); }, 'image/jpeg', q || 0.82); }; im.onerror = function () { ok(file); }; im.src = rd.result; };
    rd.readAsDataURL(file); }); };
  IS.form = function (f) { var o = {}; new FormData(f).forEach(function (v, k) { if (v instanceof File) return; if (o[k] !== undefined) { if (!Array.isArray(o[k])) o[k] = [o[k]]; o[k].push(v); } else o[k] = typeof v === 'string' ? v.trim() : v; });
    Object.keys(o).forEach(function (k) { if (o[k] === '__o') { o[k] = o[k + '__o'] || ''; } if (/__o$/.test(k)) delete o[k]; }); return o; };
  /* a list to choose from, with "Other" that opens a box to type (owner, 18 Nov 2026) */
  IS.pick = function (name, opts, v, req, ph) { v = v || ''; var norm = function (o) { return typeof o === 'string' ? [o, o] : o; };
    opts = opts.map(function (o) { return o && o.g ? { g: o.g, o: o.o.map(norm) } : norm(o); });
    var flat = []; opts.forEach(function (o) { if (o.g) flat = flat.concat(o.o); else flat.push(o); }); var known = flat.some(function (o) { return o[0] === v; }), other = v && !known;
    var one = function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === v ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; };
    return '<span class="pick"><select name="' + name + '" data-pick' + (req ? ' required' : '') + '><option value="">' + esc(A('اختر…', 'Choose…')) + '</option>' + opts.map(function (o) { return o.g ? '<optgroup label="' + esc(o.g) + '">' + o.o.map(one).join('') + '</optgroup>' : one(o); }).join('') +
      '<option value="__o"' + (other ? ' selected' : '') + '>' + esc(A('أخرى (اكتب)', 'Other (type it)')) + '</option></select><input name="' + name + '__o" class="pko"' + (other ? '' : ' hidden') + ' value="' + esc(other ? v : '') + '" placeholder="' + esc(ph || A('اكتب هنا', 'Type here')) + '"></span>'; };
  document.addEventListener('change', function (e) { var s = e.target.closest && e.target.closest('select[data-pick]'); if (!s) return; var i = s.parentNode.querySelector('.pko'); if (!i) return; i.hidden = s.value !== '__o'; i.required = s.value === '__o'; if (!i.hidden) i.focus(); });
  IS.lines = function (s) { return String(s || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); };
  /* rich text: only these tags survive (lecturers write formatted text; students never get scripts) */
  IS.clean = function (html) {
    var d = document.createElement('div'); d.innerHTML = String(html || '');
    (function walk(n) { Array.prototype.slice.call(n.childNodes).forEach(function (c) {
      if (c.nodeType === 1) { var t = c.tagName.toLowerCase();
        if (['b', 'strong', 'i', 'em', 'u', 'p', 'br', 'ul', 'ol', 'li', 'h2', 'h3', 'blockquote', 'mark', 'span', 'div'].indexOf(t) < 0) { c.replaceWith(document.createTextNode(c.textContent)); return; }
        Array.prototype.slice.call(c.attributes).forEach(function (a) { c.removeAttribute(a.name); }); walk(c); }
      else if (c.nodeType !== 3) c.remove(); }); })(d);
    return d.innerHTML;
  };
  IS.editor = function (name, html, ph) {
    return '<div class="ed"><div class="edbar" role="toolbar">' + [['bold', 'bold'], ['italic', 'ital'], ['insertUnorderedList', 'ul'], ['formatBlock:h3', 'h2'], ['hiliteColor:#fff1a6', 'hl']].map(function (b) {
      return '<button type="button" data-cmd="' + b[0] + '" aria-label="' + b[0].split(':')[0] + '">' + ic(b[1]) + '</button>'; }).join('') + '</div><div class="edin" contenteditable="true" data-ed="' + name + '" data-ph="' + esc(ph || '') + '">' + IS.clean(html) + '</div></div>';
  };
  IS.edVal = function (root, name) { var e = IS.$('[data-ed="' + name + '"]', root); return e ? IS.clean(e.innerHTML) : ''; };
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-cmd]'); if (!b) return; e.preventDefault(); var p = b.getAttribute('data-cmd').split(':'); var ed = b.closest('.ed'); var x = ed && ed.querySelector('.edin'); if (x) x.focus();
    if (p[0] === 'formatBlock') document.execCommand('formatBlock', false, p[1]); else if (p[0] === 'hiliteColor') { if (!document.execCommand('hiliteColor', false, p[1])) document.execCommand('backColor', false, p[1]); } else document.execCommand(p[0]); });

  /* ---------- router ---------- */
  var PAGES = {};
  IS.page = function (name, fn, opt) { PAGES[name] = { fn: fn, o: opt || {} }; };
  IS.go = function (h) { if (location.hash.slice(1) === h) IS.route(); else location.hash = h; };
  IS.ACT = {};   // data-act handlers
  IS.SUB = {};   // data-form submit handlers
  IS.after = null;
  var SEQ = 0;
  IS.route = async function () {
    var h = decodeURIComponent(location.hash.slice(1)) || 'home', m = h.match(/^([a-z-]+?)(?:\/(.*))?$/), name = m ? m[1] : 'home', arg = m ? m[2] : '';
    var P = PAGES[name] || PAGES.home, o = P.o, my = ++SEQ, main = IS.$('#main');
    if ((!o.area || o.area === 'student' || (o.area === 'keep' && IS.area === 'student')) && name !== 'pick' && name !== 'terms' && name !== 'security' && (!IS.SPEC || !IS.spec(IS.SPEC)) && IS.SPECS.length) { name = 'pick'; P = PAGES.pick; o = P.o; }
    IS.area = o.area === 'keep' ? (IS.area || 'student') : (o.area || 'student'); document.body.setAttribute('data-area', IS.area); document.body.setAttribute('data-page', name);
    IS.chrome(name);
    if (o.auth && !IS.ME) { main.innerHTML = authGate(); return; }
    if (IS.mfaGate) { var g = IS.mfaGate(); if (g) { main.innerHTML = g; return; } }
    if (o.perm && !IS.can(o.perm)) { main.innerHTML = IS.empty('lock', A('لا تملك صلاحية هذه الصفحة', 'You do not have access to this page'), A('اطلب الصلاحية من مالك المنصة.', 'Ask the platform owner for access.')); return; }
    if (o.lec && !IS.LEC) { IS.go('studio-apply'); return; }
    main.innerHTML = '<div class="loading"><span class="spin"></span></div>';
    var html; IS.after = null;
    /* without internet (owner, 18 Nov 2026: the home page kept spinning): pages that need the internet say so at once; downloads, settings and
       the guide still open. Any page that takes more than 12 s while the connection is gone or very weak shows the offline card instead. */
    var OFFOK = { downloads: 1, dl: 1, settings: 1, terms: 1, pick: 1, 'studio-guide': 1 };
    if (!navigator.onLine && DB.live && !OFFOK[name]) { IS.OFFPAGE = true; main.innerHTML = '<div class="page">' + IS.offEmpty() + '</div>'; return; }
    IS.OFFPAGE = false;
    try { html = await Promise.race([P.fn(arg), new Promise(function (ok, no) { setTimeout(function () { no(new Error('slow')); }, DB.live ? 12000 : 60000); })]); } catch (e) { if (e && e.message === 'slow') { if (my !== SEQ) return; IS.OFFPAGE = true; }  if (window.console) console.error(e); html = !navigator.onLine ? IS.offEmpty() : e && e.message === 'slow' ? IS.empty('offline', A('الاتصال ضعيف جدًا', 'The connection is very weak'), A('لم تكتمل الصفحة. تحقق من الإنترنت ثم أعد المحاولة.', 'The page did not finish loading. Check the internet and try again.'), '<button class="btn pri" data-act="retry">' + IS.ic('route') + IS.esc(A('أعد المحاولة', 'Try again')) + '</button> <a class="btn ghost" href="#downloads">' + IS.ic('download') + IS.esc(A('تنزيلاتي', 'My downloads')) + '</a>') : IS.empty('info', A('تعذّر فتح الصفحة', 'This page could not be opened'), String(e && e.message || '')); }
    if (my !== SEQ) return;
    main.innerHTML = '<div class="page">' + (html || IS.empty('search', A('غير موجود', 'Not found'), A('ربما حُذف أو لم يُنشر بعد.', 'It may have been removed or not published yet.'))) + '</div>';
    if (!IS.keepScroll) window.scrollTo(0, 0); IS.keepScroll = false;
    var h1 = main.querySelector('h1'); if (h1) try { h1.focus({ preventScroll: true }); } catch (e) {}
    var tt = h1 && (h1.querySelector('.tt small') || h1); document.title = (tt ? tt.textContent.trim() + ' · ' : '') + 'اشرح لي';
    if (IS.after) try { await IS.after(main); } catch (e) { if (window.console) console.error(e); }
    IS.balance(); IS.evenRows();
  };
  /* a side column much shorter than its main column becomes a row of cards above it (owner, 18 Nov 2026: no empty spaces) */
  IS.balance = function () { if (window.innerWidth < 1180) return; IS.$$('#main .cols').forEach(function (c) {
    if (c.classList.contains('cflow')) return; var a = c.querySelector(':scope>.aside'), m = c.querySelector(':scope>.main'); if (!a || !m || c.querySelector(':scope>.filt')) return;
    c.classList.toggle('flat', m.offsetHeight - a.offsetHeight > 240); }); };
  /* rows of cards are always even: 8 badges are 4 + 4, never 7 + 1 with the last card stretched across the row (owner, 18 Nov 2026) */
  var EVEN = { '.badges': 150, '.tiles': 170, '.stp': 250, '.tools': 110, '.spadm': 200, '.rtiles': 190, '.ptiles': 150, '.kgrid': 190, '.rolecards': 230, '.qa': 130, '.sopts': 92, '.offers': 190, '.rkinds': 150, '.hsn': 120 };
  IS.evenRows = function () { Object.keys(EVEN).forEach(function (sel) { Array.prototype.forEach.call(document.querySelectorAll('#main ' + sel), function (c) {
    var n = c.children.length, W = c.clientWidth; if (!n || !W) return; var g = parseFloat(getComputedStyle(c).columnGap) || 12, max = Math.max(1, Math.floor((W + g) / (EVEN[sel] + g)));
    var cols = Math.min(n, max), rows = Math.ceil(n / cols); cols = Math.ceil(n / rows);
    c.style.setProperty('display', 'grid', 'important'); c.style.gridTemplateColumns = 'repeat(' + cols + ',minmax(0,1fr))'; }); }); };
  window.addEventListener('resize', function () { clearTimeout(IS._bt); IS._bt = setTimeout(function () { IS.balance(); IS.evenRows(); }, 200); });
  IS.ACT = IS.ACT || {}; IS.ACT.retry = function () { IS.route(); };
  /* back online: the page that could not open opens by itself */
  window.addEventListener('online', function () { if (IS.OFFPAGE) setTimeout(function () { IS.loadMe().then(function () { IS.route(); }); }, 800); });
  IS.offEmpty = function () { return IS.empty('offline', A('لا يوجد اتصال بالإنترنت', 'No internet connection'), A('هذه الصفحة تحتاج إلى الإنترنت. ما نزّلته داخل المنصة يعمل دون اتصال.', 'This page needs the internet. What you downloaded inside the platform works offline.'), '<a class="btn pri" href="#downloads">' + IS.ic('download') + IS.esc(A('افتح تنزيلاتي', 'Open my downloads')) + '</a>'); };
  IS.refresh = function () { IS.keepScroll = true; return IS.route(); };
  function authGate() {
    return '<div class="page"><div class="gate">' + ic('lock') + '<h1 tabindex="-1">' + IS.T('سجّل الدخول للمتابعة', 'Sign in to continue') + '</h1><p>' + esc(A('أنشئ حسابًا مجانيًا خلال دقيقة، أو ادخل بحسابك.', 'Create a free account in a minute, or sign in.')) + '</p>' +
      '<div class="row center"><button class="btn pri" data-act="login">' + esc(A('تسجيل الدخول', 'Sign in')) + '</button><button class="btn ghost" data-act="register">' + esc(A('حساب جديد', 'Create account')) + '</button></div></div></div>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b || b.disabled) return; var f = IS.ACT[b.getAttribute('data-act')]; if (!f) return; e.preventDefault();
    Promise.resolve(f(b, e)).catch(IS.fail);
  });
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('[data-form]'); if (!f) return; var h = IS.SUB[f.getAttribute('data-form')]; if (!h) return; e.preventDefault();
    var btn = f.querySelector('button:not([type=button])'); if (btn) { if (btn.disabled) return; btn.disabled = true; btn.classList.add('busy'); }
    Promise.resolve(h(IS.form(f), f)).catch(IS.fail).then(function () { if (btn) { btn.disabled = false; btn.classList.remove('busy'); } });
  });
  window.addEventListener('hashchange', function () { IS.closeSheet(); IS.route(); });

  /* ---------- shell ---------- */
  var NAV = {
    student: [['home', 'home', 'الرئيسية', 'Home'], ['courses', 'layers', 'الكورسات', 'Courses'], ['learning', 'bookmark', 'تعلّمي', 'My learning'], ['events', 'cal', 'الفعاليات', 'Events'], ['news', 'news', 'الإعلانات والأخبار', 'News'], ['downloads', 'download', 'تنزيلاتي', 'Downloads'],
      ['lecturers', 'users', 'المحاضرون', 'Lecturers'], ['community', 'group', 'المجتمع', 'Community'], ['library', 'open', 'مكتبتي', 'My Library'], ['paths', 'route', 'المسارات', 'Paths'], ['favorites', 'heart', 'المفضلة', 'Favourites'], ['achievements', 'trophy', 'الإنجازات', 'Achievements'], ['support', 'chat', 'الدعم والرسائل', 'Support & messages'], ['team', 'group', 'فريق المنصة', 'Our team'], ['about', 'info', 'عن المنصة', 'About'], ['settings', 'gear', 'الإعدادات', 'Settings']],
    studio: [['studio', 'chart', 'لوحة المحاضر', 'Dashboard'], ['studio-courses', 'layers', 'كورساتي', 'My courses'], ['studio-page', 'user', 'صفحتي', 'My page'], ['studio-events', 'cal', 'فعالياتي', 'My events'],
      ['studio-students', 'users', 'طلابي', 'My students'], ['studio-qa', 'chat', 'الأسئلة', 'Questions'], ['studio-money', 'wallet', 'الأرباح', 'Earnings'], ['studio-guide', 'book', 'دليل المحاضر', 'Lecturer guide'], ['settings', 'gear', 'الإعدادات', 'Settings']],
    control: [['control', 'chart', 'لوحة التحكم', 'Dashboard', 'dash'], ['control-pay', 'receipt', 'المدفوعات', 'Payments', 'pay'], ['control-review', 'eye', 'مراجعة الكورسات', 'Course review', 'review'], ['control-apps', 'user', 'طلبات المحاضرين', 'Lecturer requests', 'apps'],
      ['control-lecturers', 'users', 'المحاضرون', 'Lecturers', 'lecturers'], ['control-payouts', 'wallet', 'مستحقات المحاضرين', 'Payouts', 'payout'], ['control-students', 'group', 'الطلبة', 'Students', 'students'],
      ['control-community', 'flag', 'البلاغات والمجتمع', 'Community', 'community'], ['control-events', 'cal', 'الفعاليات', 'Events', 'events'], ['control-cats', 'grid', 'الأقسام والمواد', 'Categories', 'cats'],
      ['control-notify', 'bell', 'الإعلانات', 'Announcements', 'notify'], ['control-team', 'crown', 'فريق المنصة', 'Team', 'team'], ['control-settings', 'gear', 'الإعدادات', 'Settings', 'settings'], ['control-audit', 'clock', 'سجل العمليات', 'Activity log', 'audit']]
  };
  IS.NAV = NAV;
  IS.navLbl = function (ar, en) { return '<span class="nl"><b lang="en">' + esc(en) + '</b>' + (IS.lang === 'en' ? '' : '<small>' + esc(ar) + '</small>') + '</span>'; };
  function navItems(area) { if (area === 'control' && IS.ctrlItems) return IS.ctrlItems(); return NAV[area].filter(function (n) { return !n[4] || IS.can(n[4]); }); }
  IS.chrome = function (page) {
    var me = IS.ME, area = IS.area;
    var areaSw = '<div class="areas">' + [['student', 'home', A('المنصة', 'Platform'), true], ['studio', 'studio', A('استوديو المحاضر', 'Lecturer studio'), !!me], ['control', 'crown', A('التحكم', 'Control'), IS.team()]].filter(function (x) { return x[3]; }).map(function (x) {
      return '<a href="#' + (x[0] === 'student' ? 'home' : x[0]) + '" class="' + (area === x[0] ? 'on' : '') + '">' + ic(x[1]) + '<span>' + esc(x[2]) + '</span></a>'; }).join('') + '</div>';
    IS.$('#top').innerHTML = '<div class="tin"><a class="brand" href="#home"><img src="' + IS.logo() + '" alt="" width="46" height="40"><span><b>اشرح لي</b><small>' + esc(area === 'control' ? A('تطبيق التحكم', 'Control app') : area === 'studio' ? A('استوديو المحاضر', 'Lecturer studio') : A('منصة تعليمية متكاملة لطلاب الكليات الصحية', 'Learning platform for health sciences students')) + '</small></span></a>' +
      (area === 'student' ? '<form class="tsearch" role="search" data-form="search"><span>' + ic('search') + '</span><input name="q" type="search" autocomplete="off" placeholder="' + esc(A('ابحث عن كورس أو مادة أو محاضر…', 'Search courses, subjects, lecturers…')) + '" aria-label="' + esc(A('بحث', 'Search')) + '"></form>' : '<span class="tsp"></span>') +
      (area === 'student' && IS.mySpec() ? '<a class="tspec" href="#pick" aria-label="' + esc(A('تغيير التخصص', 'Change speciality')) + '">' + ic(IS.mySpec().icon) + '<span lang="en">' + esc(IS.mySpec().en.replace('Laboratory Science', 'Lab Science')) + '</span>' + ic('down') + '</a>' : '') + '<div class="tbtn"><a class="ib only-ph" href="#search" aria-label="' + esc(A('بحث', 'Search')) + '">' + ic('search') + '</a><a class="ib" href="#settings" aria-label="' + esc(A('الإعدادات', 'Settings')) + '">' + ic('gear') + '</a>' +
      (me ? '<a class="ib bell" href="#notifications" aria-label="' + esc(A('الإشعارات', 'Notifications')) + '">' + ic('bell') + '<i id="bellN" hidden></i></a><a class="me" href="#account">' + IS.av(me, 'sm') + '<span>' + esc(me.name || '') + '</span></a>' :
        '<button class="btn pri sm" data-act="login">' + esc(A('دخول', 'Sign in')) + '</button>') + '</div></div>';
    var items = navItems(area);
    var mys = area === 'student' && IS.mySpec(), spBox = mys ? '<a class="myspec" href="#pick"' + (mys.img ? ' style="--sp:url(' + IS.U(mys.img) + ')"' : '') + '><span class="msi">' + ic(mys.icon) + '</span><span class="msn"><b lang="en">' + esc(mys.en) + '</b><small>' + esc(A(mys.ar, 'Your speciality')) + '</small></span><em>' + esc(A('تغيير', 'Change')) + '</em></a>' : '';
    IS.$('#side').innerHTML = areaSw + spBox + (area === 'control' && IS.ctrlSide ? '<nav class="cnav">' + IS.ctrlSide(page) + '</nav>' : '<nav>' + items.map(function (n) { return '<a href="#' + n[0] + '" class="' + (n[0] === page || (page.indexOf(n[0] + '-') === 0 && area === 'student') ? 'on' : '') + '">' + ic(n[1]) + IS.navLbl(n[2], n[3]) + '</a>'; }).join('') + '</nav>');
    var tabs = area === 'student' ? ['home', 'courses', 'learning', 'library'] : items.slice(0, 4).map(function (n) { return n[0]; });
    IS.$('#tabs').innerHTML = tabs.map(function (k) { var n = items.filter(function (x) { return x[0] === k; })[0]; if (!n) return ''; return '<a href="#' + n[0] + '" class="' + (n[0] === page ? 'on' : '') + '">' + ic(n[1]) + '<span>' + esc(n[3]) + '</span></a>'; }).join('') +
      '<a href="#more" data-act="more">' + ic('menu') + '<span>More</span></a>';
    if (me) IS.bell(); topH();
  };
  /* height of the fixed phone top bar, so the page starts below it */
  function topH() { var t = document.getElementById('top'); if (t) document.documentElement.style.setProperty('--toph', t.offsetHeight + 'px'); }
  window.addEventListener('resize', topH); setTimeout(topH, 50);
  IS.bell = async function () {
    try { var seen = LS.get('seen-' + IS.ME.id, 0), n = await DB.q('notices', { order: ['created_at', false], limit: 40 });
      n = n.filter(function (x) { return (!x.user_id || x.user_id === IS.ME.id) && new Date(x.created_at).getTime() > seen; }); var b = IS.$('#bellN'); if (b) { b.hidden = !n.length; b.textContent = n.length > 9 ? '9+' : n.length; } } catch (e) {}
  };
  IS.ACT.more = function () {
    var items = navItems(IS.area), extra = IS.area === 'student' ? [['pick', 'grid', 'تغيير التخصص', 'Change speciality'], ['notifications', 'bell', 'الإشعارات', 'Notifications'], ['account', 'user', 'حسابي', 'My account'], ['search', 'search', 'البحث', 'Search']] : [['security', 'shield', 'الأمان والتحقق', 'Security']].concat(IS.area === 'control' ? [['settings', 'gear', 'الإعدادات', 'Settings']] : []);
    var areas = [['home', 'home', 'المنصة', 'Platform', true], ['studio', 'studio', 'استوديو المحاضر', 'Lecturer studio', !!IS.ME], ['control', 'crown', 'التحكم', 'Control', IS.team()]].filter(function (x) { return x[4]; });
    var ms = IS.area === 'student' && IS.mySpec();
    IS.sheet(A('المزيد', 'More'), (ms ? '<a class="myspec big" href="#pick"' + (ms.img ? ' style="--sp:url(' + IS.U(ms.img) + ')"' : '') + '><span class="msi">' + ic(ms.icon) + '</span><span class="msn"><b lang="en">' + esc(ms.en) + '</b><small>' + esc(A('تخصصك', 'Your speciality')) + '</small></span><em>' + esc(A('تغيير', 'Change')) + '</em></a>' : '') + '<div class="mgrid">' + items.concat(extra).map(function (n) { return '<a href="#' + n[0] + '">' + ic(n[1]) + '<span>' + esc(A(n[2], n[3])) + '</span></a>'; }).join('') + '</div>' +
      (areas.length > 1 ? '<h3 class="sub">' + esc(A('الانتقال إلى', 'Switch to')) + '</h3><div class="mgrid">' + areas.map(function (n) { return '<a href="#' + n[0] + '" class="alt">' + ic(n[1]) + '<span>' + esc(A(n[2], n[3])) + '</span></a>'; }).join('') + '</div>' : ''), { nofocus: 1 });
  };
  IS.ACT.lang = function () { IS.lang = IS.lang === 'ar' ? 'en' : 'ar'; LS.set('lang', IS.lang); applyLang(); IS.route(); };
  IS.setTheme = function (t) { LS.set('theme', t); applyTheme(); };
  function applyTheme() { var t = LS.get('theme', 'light'); if (t === 'auto') t = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; document.documentElement.setAttribute('data-theme', t);
    document.documentElement.setAttribute('data-fs', LS.get('fs', 'n')); }
  IS.applyTheme = applyTheme;
  /* colour of the app (owner, 18 Nov 2026): one stylesheet per colour, made by tools/ishrah/palettes.py */
  IS.PALS = [['blue', '#0d3a7d', 'أزرق ملكي', 'Royal blue'], ['teal', '#0b5f63', 'فيروزي', 'Teal'], ['green', '#0f5a3a', 'أخضر', 'Green'],
    ['purple', '#3f2a7d', 'بنفسجي', 'Purple'], ['maroon', '#6e1d36', 'عنابي', 'Maroon'], ['graphite', '#2c3340', 'رمادي داكن', 'Graphite']];
  /* the logo in the chosen colour (its navy parts; tools/ishrah/palettes.py makes the files) */
  IS.logo = function (k) { var p = LS.get('pal', 'blue'), x = p === 'blue' ? '' : '_' + p; return k === 'hero' ? 'img/logo_hero' + x + '.webp' : 'img/logo_gold' + x + '.svg'; };
  IS.setPal = function (p) { LS.set('pal', p); var l = document.getElementById('ishcss'), v = (l && /v=(\d+)/.exec(l.getAttribute('href')) || [0, '25'])[1];
    if (l) l.setAttribute('href', 'css/' + (p === 'blue' ? 'app' : 'pal-' + p) + '.css?v=' + v);
    var m = document.querySelector('meta[name=theme-color]'), c = IS.PALS.filter(function (x) { return x[0] === p; })[0]; if (m && c) m.setAttribute('content', c[1]); };
  IS.ACT.theme = function () { IS.setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); IS.chrome(document.body.getAttribute('data-page')); };
  function applyLang() { document.documentElement.lang = IS.lang; document.documentElement.dir = IS.lang === 'ar' ? 'rtl' : 'ltr'; }
  applyLang();
  applyTheme();

  /* ---------- sign in / register ---------- */
  IS.ACT.login = function () { authSheet('in'); };
  /* sign in / create account (owner, 18 Nov 2026: "the email must be a real connection with the email, with a password"): Google, or
     EMAIL + password (a 6-digit code sent to the inbox proves the email before the account opens; forgotten password = a new code),
     or PHONE + password. IS.AUTHTAB = 'email' | 'phone'. */
  var GSVG = '<svg viewBox="0 0 24 24" class="ico" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" stroke="none"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" stroke="none"/><path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2z" stroke="none"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.8 9.4 6 12 6z" stroke="none"/></svg>';
  function fld(name, icon, label, attrs) { return '<label class="fl"><span>' + ic(icon) + esc(label) + '</span><input name="' + name + '" ' + attrs + '></label>'; }
  function authSheet(mode, kind) {
    var up = mode === 'up', tab = IS.AUTHTAB || 'email'; kind = kind || IS.AUTHKIND || 'student'; IS.AUTHMODE = mode;
    var pw = fld('pass', 'lock', A('كلمة المرور', 'Password') + ' *', 'type="password" required minlength="8" autocomplete="' + (up ? 'new-password' : 'current-password') + '"' + (up ? ' placeholder="' + esc(A('8 أحرف على الأقل', 'At least 8 characters')) + '"' : ''));
    var pw2 = up ? fld('pass2', 'lock', A('تأكيد كلمة المرور', 'Confirm password') + ' *', 'type="password" required minlength="8" autocomplete="new-password"') : '';
    var terms = up ? '<label class="chk"><input type="checkbox" name="terms" required><span>' + esc(A('أوافق على ', 'I agree to the ')) + '<a href="#terms" class="link" data-close>' + esc(A('شروط الاستخدام وسياسة الخصوصية', 'terms of use and privacy policy')) + '</a></span></label>' : '';
    var form = tab === 'email' ?
      '<form class="form" data-form="' + (up ? 'esignup' : 'esignin') + '"><input type="hidden" name="kind" value="' + kind + '">' +
        (up ? fld('name', 'user', A('الاسم الكامل', 'Full name') + ' *', 'required maxlength="60" autocomplete="name"') : '') +
        fld('email', 'mail', A('البريد الإلكتروني', 'Email') + ' *', 'type="email" required autocomplete="email" dir="ltr" placeholder="name@example.com"') + pw + pw2 + terms +
        (up ? '<p class="note">' + ic('shield') + '<span>' + esc(A('سنرسل رمزًا من 6 أرقام إلى بريدك للتأكد منه قبل فتح الحساب.', 'We will send a 6-digit code to your email to confirm it before the account opens.')) + '</span></p>' : '') +
        '<p class="msg" id="authMsg" role="alert"></p><button class="btn pri wide">' + ic(up ? 'send' : 'logout') + '<span>' + esc(up ? A('أرسل رمز التأكيد', 'Send the confirmation code') : A('دخول', 'Sign in')) + '</span></button></form>' :
      '<form class="form" data-form="' + (up ? 'signup' : 'signin') + '"><input type="hidden" name="kind" value="' + kind + '">' +
        (up ? fld('name', 'user', A('الاسم الكامل', 'Full name') + ' *', 'required maxlength="60" autocomplete="name"') : '') +
        '<label class="fl"><span>' + ic('phone') + esc(A('رقم الهاتف', 'Phone number')) + ' *</span><span class="pre" dir="ltr"><em>🇸🇩 +249</em><input name="phone" required inputmode="tel" autocomplete="tel" placeholder="9xxxxxxxx" dir="ltr"></span></label>' + pw + pw2 + terms +
        '<p class="msg" id="authMsg" role="alert"></p><button class="btn pri wide">' + ic(up ? 'user' : 'logout') + '<span>' + esc(up ? A('إنشاء الحساب', 'Create account') : A('دخول', 'Sign in')) + '</span></button></form>';
    IS.sheet(esc(up ? A('إنشاء حساب جديد', 'Create a new account') : A('تسجيل الدخول', 'Sign in')),
      (up ? '<p class="lead center">' + esc(A('انضم إلى مجتمع اشرح لي', 'Join the Ishrah Li community')) + '</p><h3 class="sub center">' + esc(A('اختر نوع حسابك', 'Choose your account type')) + '</h3><div class="kinds" role="radiogroup">' +
        [['student', 'cert', 'طالب', 'Student', 'للوصول إلى الكورسات والمحتوى التعليمي', 'To reach the courses and learning content'], ['lecturer', 'studio', 'محاضر', 'Lecturer', 'لتقديم الكورسات والمحاضرات', 'To teach courses and lectures']].map(function (k) {
          return '<button type="button" class="kind' + (kind === k[0] ? ' on' : '') + '" role="radio" aria-checked="' + (kind === k[0]) + '" data-act="kind" data-k="' + k[0] + '">' + ic(k[1]) + '<b>' + esc(A(k[2], k[3])) + '</b><small>' + esc(A(k[4], k[5])) + '</small></button>'; }).join('') + '</div>' : '') +
      '<button class="btn google wide" data-act="google">' + GSVG + '<span>' + esc(A('المتابعة بحساب Google', 'Continue with Google')) + '</span></button>' +
      '<p class="or"><span>' + esc(A('أو', 'or')) + '</span></p>' +
      '<div class="atabs" role="tablist">' + [['email', 'mail', 'البريد الإلكتروني', 'Email'], ['phone', 'phone', 'رقم الهاتف', 'Phone']].map(function (t) {
        return '<button type="button" role="tab" aria-selected="' + (tab === t[0]) + '" class="' + (tab === t[0] ? 'on' : '') + '" data-act="authtab" data-t="' + t[0] + '">' + ic(t[1]) + '<span>' + esc(A(t[2], t[3])) + '</span></button>'; }).join('') + '</div>' + form +
      '<p class="alt">' + (up ? esc(A('لديك حساب بالفعل؟', 'Already have an account?')) + ' <button class="link" data-act="login">' + esc(A('تسجيل الدخول', 'Sign in')) + '</button>' :
        esc(A('ليس لديك حساب؟', 'No account?')) + ' <button class="link" data-act="register">' + esc(A('أنشئ حسابًا', 'Create one')) + '</button><br>' +
        (tab === 'email' ? '<button class="link" data-act="eforgot">' : '<button class="link" data-act="ticket" data-k="password">') + esc(A('نسيت كلمة المرور؟', 'Forgot your password?')) + '</button>') + '</p>' +
      (DB.live ? '' : '<p class="pv">' + IS.ic('info') + esc(A('نسخة معاينة: الحسابات والبيانات محفوظة على هذا الجهاز فقط ولا تُرسل رسائل بريد؛ يظهر رمز التأكيد على الشاشة. أول حساب يُنشأ هو مالك المنصة.', 'Preview copy: accounts and data stay on this device only and no email is sent; the confirmation code is shown on the screen. The first account created is the platform owner.')) + '</p>'));
    IS.AUTHKIND = kind;
  }
  IS.ACT.authtab = function (b) { IS.AUTHTAB = b.getAttribute('data-t'); authSheet(IS.AUTHMODE || 'in', IS.AUTHKIND); };
  /* the code step: shared by creating an account and by a forgotten password */
  var PEND = null;
  function codeSheet(note) {
    var em = PEND.email, reset = PEND.reset;
    IS.sheet(esc(reset ? A('تعيين كلمة مرور جديدة', 'Set a new password') : A('تأكيد البريد الإلكتروني', 'Confirm your email')),
      '<div class="otp">' + ic('mail') + '<p>' + esc(A('أرسلنا رمزًا من 6 أرقام إلى', 'We sent a 6-digit code to')) + '</p><b dir="ltr">' + esc(em) + '</b><small>' + esc(A('افتح بريدك (وتحقق من مجلد الرسائل غير المرغوبة) واكتب الرمز هنا.', 'Open your email (check the spam folder too) and type the code here.')) + '</small></div>' +
      (note ? '<p class="pv">' + IS.ic('info') + esc(note) + '</p>' : '') +
      '<form class="form" data-form="ecode"><label class="fl"><span>' + ic('lock') + esc(A('رمز التأكيد', 'Confirmation code')) + ' *</span><input name="code" class="otpin" required inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" dir="ltr" placeholder="••••••"></label>' +
      (reset ? fld('pass', 'lock', A('كلمة المرور الجديدة', 'New password') + ' *', 'type="password" required minlength="8" autocomplete="new-password"') + fld('pass2', 'lock', A('تأكيد كلمة المرور', 'Confirm password') + ' *', 'type="password" required minlength="8" autocomplete="new-password"') : '') +
      '<p class="msg" id="authMsg" role="alert"></p><button class="btn pri wide">' + ic('checkc') + '<span>' + esc(reset ? A('تأكيد وحفظ كلمة المرور', 'Confirm and save the password') : PEND.google ? A('تأكيد والدخول', 'Confirm and sign in') : A('تأكيد وإنشاء الحساب', 'Confirm and create the account')) + '</span></button></form>' +
      '<p class="alt"><button class="link" data-act="eresend" id="eresend">' + esc(A('إعادة إرسال الرمز', 'Send the code again')) + '</button> · <button class="link" data-act="' + (reset ? 'eforgot' : 'register') + '">' + esc(A('تغيير البريد', 'Change the email')) + '</button></p>');
    var b = IS.$('#eresend'), t = 60; if (b) { b.disabled = true; var iv = setInterval(function () { t--; if (!document.body.contains(b)) return clearInterval(iv); b.textContent = A('إعادة إرسال الرمز', 'Send the code again') + (t > 0 ? ' (' + t + ')' : ''); if (t <= 0) { b.disabled = false; clearInterval(iv); } }, 1000); }
    var c = IS.$('.otpin'); if (c) setTimeout(function () { try { c.focus(); } catch (e) {} }, 80);
  }
  function codeErr(e) { return e.message === 'exists' ? A('هذا البريد مسجّل من قبل: سجّل الدخول، أو استعمل «نسيت كلمة المرور؟».', 'This email is already registered: sign in, or use “Forgot your password?”.') :
    e.message === 'nouser' ? A('لا يوجد حساب بهذا البريد.', 'There is no account with this email.') : e.message === 'wait' ? A('انتظر دقيقة ثم أعد المحاولة.', 'Wait a minute, then try again.') : A('تعذّر إرسال الرمز: ', 'Could not send the code: ') + e.message; }
  async function sendCode() { var r = await DB.emailCode({ email: PEND.email, name: PEND.name, create: !PEND.reset, any: !!PEND.google }); codeSheet(r && r.preview ? A('نسخة معاينة: لا تُرسل رسائل بريد. الرمز هو ', 'Preview copy: no email is sent. The code is ') + r.preview : ''); }
  IS.SUB.esignup = async function (d) {
    if ((d.pass || '').length < 8) return authMsg(A('كلمة المرور 8 أحرف على الأقل.', 'The password needs at least 8 characters.'));
    if (d.pass !== d.pass2) return authMsg(A('كلمتا المرور غير متطابقتين.', 'The passwords do not match.'));
    PEND = { email: String(d.email).trim().toLowerCase(), name: d.name, pass: d.pass, kind: d.kind };
    try { await sendCode(); } catch (e) { authMsg(codeErr(e)); }
  };
  IS.ACT.eforgot = function () {
    IS.sheet(esc(A('نسيت كلمة المرور', 'Forgot your password')), '<p class="lead">' + esc(A('اكتب بريدك الإلكتروني وسنرسل إليه رمزًا لتعيين كلمة مرور جديدة.', 'Type your email and we will send it a code to set a new password.')) + '</p>' +
      '<form class="form" data-form="eforgot">' + fld('email', 'mail', A('البريد الإلكتروني', 'Email') + ' *', 'type="email" required autocomplete="email" dir="ltr" placeholder="name@example.com"') +
      '<p class="msg" id="authMsg" role="alert"></p><button class="btn pri wide">' + ic('send') + '<span>' + esc(A('أرسل الرمز', 'Send the code')) + '</span></button></form><p class="alt"><button class="link" data-act="login">' + esc(A('الرجوع إلى الدخول', 'Back to sign in')) + '</button></p>');
  };
  IS.SUB.eforgot = async function (d) { PEND = { email: String(d.email).trim().toLowerCase(), reset: true }; try { await sendCode(); } catch (e) { authMsg(codeErr(e)); } };
  IS.ACT.eresend = async function () { if (!PEND) return; try { await sendCode(); IS.toast(A('أُرسل رمز جديد', 'A new code was sent')); } catch (e) { authMsg(codeErr(e)); } };
  IS.SUB.ecode = async function (d) {
    if (!PEND) return; if (PEND.reset) { if ((d.pass || '').length < 8) return authMsg(A('كلمة المرور 8 أحرف على الأقل.', 'The password needs at least 8 characters.')); if (d.pass !== d.pass2) return authMsg(A('كلمتا المرور غير متطابقتين.', 'The passwords do not match.')); }
    try { await DB.emailVerify({ email: PEND.email, code: d.code }); } catch (e) { return authMsg(A('الرمز غير صحيح أو انتهت صلاحيته.', 'The code is wrong or has expired.')); }
    if (!PEND.google) try { await DB.setOwnPassword(PEND.reset ? d.pass : PEND.pass); } catch (e) { return authMsg(A('تعذّر حفظ كلمة المرور: ', 'Could not save the password: ') + e.message); }
    var k = PEND.kind, reset = PEND.reset; PEND = null; IS.closeSheet(); await IS.loadMe();
    IS.toast(reset ? A('حُفظت كلمة المرور الجديدة', 'The new password is saved') : A('تم تأكيد بريدك. مرحبًا د. ', 'Your email is confirmed. Welcome, Dr. ') + (IS.ME && !reset ? IS.ME.name : ''));
    if (k === 'lecturer') IS.go('studio-apply'); else IS.route();
  };
  IS.SUB.esignin = async function (d) {
    try { await DB.signInEmail({ email: d.email, pass: d.pass }); } catch (e) { return authMsg(e.message === 'unconfirmed' ? A('لم يُؤكَّد هذا البريد بعد: أنشئ الحساب مرة أخرى لتصلك رسالة التأكيد.', 'This email is not confirmed yet: create the account again to receive the code.') : A('البريد أو كلمة المرور غير صحيحة.', 'Wrong email or password.')); }
    IS.closeSheet(); await IS.loadMe(); if (IS.ME && IS.ME.status === 'blocked') { await DB.signOut(); IS.ME = null; return IS.toast(A('هذا الحساب موقوف. تواصل مع الدعم.', 'This account is blocked. Contact support.')); }
    IS.route();
  };
  IS.ACT.kind = function (b) { IS.AUTHKIND = b.getAttribute('data-k'); IS.$$('.kind').forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); }); var h = IS.$('[name=kind]'); if (h) h.value = IS.AUTHKIND; };
  IS.ACT.register = function (b) { authSheet('up', b && b.getAttribute('data-k')); };
  function authMsg(t) { var m = IS.$('#authMsg'); if (m) m.textContent = t; }
  IS.SUB.signup = async function (d) {
    if (DB.digits(d.phone).length < 9) return authMsg(A('اكتب رقم هاتف صحيح.', 'Enter a valid phone number.'));
    if (d.pass !== d.pass2) return authMsg(A('كلمتا المرور غير متطابقتين.', 'The passwords do not match.'));
    if ((d.pass || '').length < 8) return authMsg(A('كلمة المرور 8 أحرف على الأقل.', 'The password needs at least 8 characters.'));
    try { await DB.signUp({ name: d.name, phone: d.phone, pass: d.pass, email: '' }); } catch (e) { return authMsg(e.message === 'exists' ? A('هذا الرقم مسجّل من قبل: سجّل الدخول.', 'This number is already registered: sign in.') : A('تعذّر إنشاء الحساب: ', 'Could not create the account: ') + e.message); }
    IS.closeSheet(); await IS.loadMe(); IS.toast(A('مرحبًا د. ', 'Welcome, Dr. ') + (IS.ME ? IS.ME.name : ''));
    if (d.kind === 'lecturer') IS.go('studio-apply'); else IS.route();
  };
  IS.SUB.signin = async function (d) {
    try { await DB.signIn({ phone: d.phone, pass: d.pass }); } catch (e) { return authMsg(A('الرقم أو كلمة المرور غير صحيحة.', 'Wrong phone number or password.')); }
    IS.closeSheet(); await IS.loadMe(); if (IS.ME && IS.ME.status === 'blocked') { await DB.signOut(); IS.ME = null; IS.toast(A('هذا الحساب موقوف. تواصل مع الدعم.', 'This account is blocked. Contact support.'), true); }
    if (IS.mfaCheck) await IS.mfaCheck(); if (IS.team()) IS.go('control'); else IS.route();
  };
  /* preview copy (no real Google yet): the Google button asks for the Gmail address and proves it with a 6-digit code, never by the address
     alone (owner, 18 Nov 2026). The live platform opens the real Google sign-in. */
  IS.SUB.gpreview = async function (d) { PEND = { email: String(d.email).trim().toLowerCase(), name: '', google: true, kind: IS.AUTHKIND }; try { await sendCode(); } catch (e) { authMsg(codeErr(e)); } };
  IS.ACT.google = async function () { if (!DB.live) {
      IS.sheet(esc(A('الدخول بحساب Google', 'Sign in with Google')), '<p class="pv">' + IS.ic('info') + esc(A('نسخة معاينة: Google الحقيقي يعمل بعد ربط المنصة. هنا نتحقق من بريدك برمز من 6 أرقام.', 'Preview copy: real Google sign-in works once the platform is connected. Here your email is checked with a 6-digit code.')) + '</p>' +
        '<form class="form" data-form="gpreview">' + fld('email', 'mail', A('بريد Gmail', 'Gmail address') + ' *', 'type="email" required autocomplete="email" dir="ltr" placeholder="name@gmail.com"') +
        '<p class="msg" id="authMsg" role="alert"></p><button class="btn pri wide">' + ic('send') + '<span>' + esc(A('أرسل الرمز', 'Send the code')) + '</span></button></form>'); return; }
    if (IS.AUTHKIND === 'lecturer') LS.set('afterlogin', 'studio-apply'); await DB.google(); if (!DB.live) { IS.closeSheet(); await IS.loadMe(); var a = LS.get('afterlogin', ''); LS.set('afterlogin', ''); if (a) IS.go(a); else IS.route(); } };
  IS.ACT.logout = async function () { await DB.signOut(); try { localStorage.removeItem('ish-me'); } catch (e) {} IS.ME = null; IS.LEC = null; IS.go('home'); };
  IS.SUB.search = function (d) { IS.go('search/' + encodeURIComponent(d.q || '')); };

  /* ---------- start ---------- */
  IS.start = async function () {
    if (DB.ready) await DB.ready;
    try { await IS.loadBase(); try { localStorage.setItem('ish-base', JSON.stringify({ SET: IS.SET, CATS: IS.CATS, SUBJ: IS.SUBJ, SPECS: IS.SPECS })); } catch (e2) {} }
    catch (e) { IS.SET = {}; try { var cb = JSON.parse(localStorage.getItem('ish-base') || 'null'); if (cb) { IS.SET = cb.SET || {}; IS.CATS = cb.CATS || []; IS.SUBJ = cb.SUBJ || []; IS.SPECS = cb.SPECS || []; } } catch (e3) {} }
    await IS.loadMe();
    if (IS.mfaCheck) await IS.mfaCheck();
    if (IS.ME) DB.upd('profiles', IS.ME.id, { last_seen: new Date().toISOString() }).catch(function () {});
    DB.onAuth(async function () { await IS.loadMe(); if (IS.mfaCheck) await IS.mfaCheck(); IS.route(); });
    IS.route();
    if (!DB.live) document.body.classList.add('preview');
  };
})();
