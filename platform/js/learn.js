/* اشرح لي (owner, 17 Nov 2026): the learning platform screens laid over the library shell (js/app.js).
   Courses (built from the real books, js/courses.js), lesson player, learning paths, events, lecturers, student community,
   My Library with collections, favourites, learning history, achievements and certificates, About.
   Rules: real content and real numbers only (no invented students, ratings or lecturers); nothing can be downloaded as a file;
   books and recorded lessons work offline once saved on the device. Arabic first, main titles in English. */
window.SMR = window.SMR || {};
SMR.ext = function (c) {
  'use strict';
  var LS = c.LS, esc = c.esc;
  function lang() { return c.lang(); }
  function A(ar, en) { return lang() === 'en' ? en : ar; }
  function E(s) { return '<span lang="en" dir="ltr" class="enw">' + esc(s) + '</span>'; }   // an English title inside Arabic text
  function N(x) { return '<bdi>' + (typeof x === 'number' ? x.toLocaleString('en-US') : x) + '</bdi>'; }
  var CONTENT = SMR.content || {};
  var VIDEOS = SMR.videos || {};      // 'book.topic' → {src, min}  (filled when recordings are uploaded)
  var EVENTS = SMR.events || [];      // {id, title, type, date, end, who, place, link, rec}
  var NAME = 'اشرح لي';

  /* ---------- icons (24 px line icons) ---------- */
  var I = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/><path d="m3 17.5 9 4.5 9-4.5" opacity=".55"/>',
    route: '<circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="5" r="2.2"/><path d="M8.2 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.8"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="m9 15 2 2 4-4"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    group: '<circle cx="12" cy="7.5" r="3"/><circle cx="5" cy="9.5" r="2.3"/><circle cx="19" cy="9.5" r="2.3"/><path d="M6.5 20a5.5 5.5 0 0 1 11 0M1.5 18.5A3.8 3.8 0 0 1 5 15M22.5 18.5A3.8 3.8 0 0 0 19 15"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
    heart: '<path d="M12 20s-7.5-4.6-9.2-9.4C1.6 7 3.8 4 7 4c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.2 0 5.4 3 4.2 6.6C19.5 15.4 12 20 12 20z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4M12 13v4M8 21h8M9.5 17h5v4h-5z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
    chart: '<path d="M4 20h16"/><path d="M7 16v-4M12 16V6M17 16v-7"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>',
    video: '<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="m15.5 10.5 6-3.5v10l-6-3.5"/>',
    book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20"/>',
    open: '<path d="M2.5 5.5C5 4.5 8.5 4.3 12 6.5c3.5-2.2 7-2 9.5-1v13c-2.5-1-6-1.2-9.5 1-3.5-2.2-7-2-9.5-1z"/><path d="M12 6.5v13"/>',
    qb: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.5v.6M12 17v.3"/>',
    cards: '<rect x="3" y="6" width="13" height="15" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v12"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    steth: '<path d="M6 3v6a5 5 0 0 0 10 0V3"/><path d="M11 14v2a4 4 0 0 0 8 0v-1"/><circle cx="19" cy="13" r="2"/>',
    live: '<circle cx="12" cy="12" r="2.5"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.9 4.9a10 10 0 0 0 0 14.2M19.1 4.9a10 10 0 0 1 0 14.2"/>',
    slides: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/>',
    file: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
    link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
    folder: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
    filter: '<path d="M3.5 5h17l-6.5 8v6l-4-2v-4z"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    checkc: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
    wa: '<path d="M4 20l1.2-4.2A8 8 0 1 1 8.4 19z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-1.8-1-.9.8c-1-.4-2-1.4-2.4-2.4l.8-.9-1-1.8z" fill="currentColor" stroke="none"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    note: '<path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5M8.5 9h7M8.5 12.5h4"/>',
    pen: '<path d="m4 20 1-4L16 5l3 3L8 19z"/><path d="m14 7 3 3"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    flame: '<path d="M12 21c-4 0-6.5-2.7-6.5-6.3C5.5 10 10 8 10 3c3.5 2 7 6 7 10.5 0 1.2-.3 2.2-.8 3 .3-2-1-3.5-2.2-4.2.3 3.2-1.3 4.3-2.5 4.3-1.4 0-2.2-1.1-2-2.6-1.6 1.2-1.4 3.7.3 5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>',
    cert: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M7 8.5h10M7 12h6"/><circle cx="16.5" cy="15.5" r="2.8"/><path d="m15 18-1 3.5 2.5-1.3 2.5 1.3-1-3.5"/>',
    medal: '<circle cx="12" cy="14.5" r="5.5"/><path d="M8.5 10 6 3h4l2 4 2-4h4l-2.5 7"/><path d="m12 12 .8 1.7 1.8.2-1.3 1.2.4 1.8-1.7-.9-1.7.9.4-1.8-1.3-1.2 1.8-.2z" fill="currentColor"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.7 3 2.7 15 0 18M12 3c-2.7 3-2.7 15 0 18"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.7 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.8 7.5-9.5V6z"/><path d="m8.8 12 2.3 2.3 4.2-4.6"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M12 16v.5M12 13.5c0-2.5 3-2.4 3-4.7a3 3 0 0 0-5.9-.6"/>',
    offline: '<path d="M7 18h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9 4.5 4.5 0 0 0 7 18z"/><path d="m9.5 13.5 2 2 3.5-4"/>',
    cloud: '<path d="M7 18h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9 4.5 4.5 0 0 0 7 18z"/>',
    more: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    sparkle: '<path d="M12 3c.6 4 2 5.4 6 6-4 .6-5.4 2-6 6-.6-4-2-5.4-6-6 4-.6 5.4-2 6-6zM18.5 15c.3 1.8.9 2.4 2.5 2.7-1.6.3-2.2.9-2.5 2.6-.3-1.7-.9-2.3-2.5-2.6 1.6-.3 2.2-.9 2.5-2.7z"/>',
    send: '<path d="M21 3 3 10.5l7 3 3 7z"/><path d="m10 13.5 4.5-4.5"/>',
    pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6 8.5-6"/>',
    bold: '<path d="M7 4h6a3.8 3.8 0 0 1 0 7.6H7zM7 11.6h7a3.9 3.9 0 0 1 0 7.9H7z"/>',
    ital: '<path d="M10 4h8M6 20h8M14 4l-4 16"/>',
    ul: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2" fill="currentColor"/><circle cx="4.5" cy="12" r="1.2" fill="currentColor"/><circle cx="4.5" cy="18" r="1.2" fill="currentColor"/>',
    hl: '<path d="m14.5 4 5.5 5.5-8 8H6.5v-5.5z"/><path d="M4 21h16" stroke-width="3" opacity=".5"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    /* subjects (duotone) */
    s_anatomy: '<circle cx="12" cy="4.5" r="2.2"/><path d="M8 8.5h8l-1 6h-1.5l-.5 7h-2l-.5-7H9z"/><path d="M8 8.5 5 14M16 8.5l3 5.5"/>',
    s_physiology: '<path d="M12 20s-7.5-4.6-9.2-9.4C1.6 7 3.8 4 7 4c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.2 0 5.4 3 4.2 6.6"/><path d="M13 12h2.5l1.5-3 2 6 1.5-3h2"/>',
    s_pathology: '<path d="M9 3h5M11.5 3v3"/><path d="M8 6.5h7l-1.5 6h-4z"/><path d="M5 21h14M9 21c0-3 1.5-5 3.5-6M16.5 14a5 5 0 0 1-2.5 7"/>',
    s_micro: '<circle cx="12" cy="12" r="5"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4M5.3 5.3l2.8 2.8M15.9 15.9l2.8 2.8M5.3 18.7l2.8-2.8M15.9 8.1l2.8-2.8"/><circle cx="10.5" cy="11" r="1" fill="currentColor"/><circle cx="13.5" cy="13.5" r="1" fill="currentColor"/>',
    s_pharma: '<path d="m10.5 20.5-7-7a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7z"/><path d="m7 10 7 7"/>',
    s_biochem: '<path d="M7 3c0 6 10 6 10 12s-10 6-10 6M17 3c0 6-10 6-10 12"/><path d="M8.5 7h7M9 12h6M8.5 17h7"/>',
    s_community: '<circle cx="12" cy="8" r="3"/><path d="M6 20a6 6 0 0 1 12 0"/><path d="M3.5 13.5a3 3 0 1 1 3.5-4.5M20.5 13.5A3 3 0 1 0 17 9"/>',
    s_clinic: '<path d="M4 21V8l8-5 8 5v13z"/><path d="M12 9v6M9 12h6M9 21v-3h6v3"/>',
    s_exam: '<rect x="5" y="3.5" width="14" height="17.5" rx="2"/><path d="M9 3.5h6v3H9z"/><path d="m8.5 13 2 2 4.5-4.5"/>',
    s_world: '<circle cx="12" cy="12" r="9"/><path d="M3.5 9h17M3.5 15h17M12 3c-3 3.5-3 14.5 0 18M12 3c3 3.5 3 14.5 0 18"/>',
    s_sudan: '<path d="M5 5h9l1.5 2.5L19 8l1 5-2 2 .5 3-4 1.5-3-1L8 20l-2-3-2-1V9z"/>',
    s_house: '<rect x="4" y="7" width="16" height="13" rx="2"/><path d="M9 7V4.5h6V7M12 10.5v6M9 13.5h6"/>'
  };
  function U(p) { try { return esc(new URL(p, location.href).href); } catch (e) { return esc(p); } }   // url() inside a CSS variable is read from the stylesheet's folder: give a full address
  function ic(n, cls) { return '<svg class="ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (I[n] || '') + '</svg>'; }
  c.addIcons(I);

  /* ---------- the catalogue ---------- */
  var CATS = [
    { id: 'basics', en: 'Basics', ar: 'العلوم الأساسية', dar: 'العلوم الطبية الأساسية', den: 'The basic medical sciences', icon: 's_exam', ico: 'layers', tone: 'blue', sec: 'basic-sciences' },
    { id: 'clinical', en: 'Clinical', ar: 'الجانب الإكلينيكي', dar: 'المواد السريرية والتطبيق العملي', den: 'Clinical subjects and practice', ico: 's_clinic', tone: 'teal', sec: 'clinical' },
    { id: 'local', en: 'Local Exam', ar: 'الامتحانات المحلية', dar: 'امتحان المجلس الطبي السوداني والامتحانات الجامعية', den: 'Sudan Medical Council and university exams', ico: 's_sudan', tone: 'gold' },
    { id: 'special', en: 'Special Exams', ar: 'الاختبارات الخاصة', dar: 'USMLE · PLAB · MRCP وغيرها', den: 'USMLE · PLAB · MRCP and others', ico: 's_exam', tone: 'rose' },
    { id: 'house', en: 'House Officer', ar: 'طبيب الامتياز', dar: 'مراجع عملية لفترة الامتياز', den: 'Practical handbooks for the internship', ico: 's_house', tone: 'violet', sec: 'house-officer' }
  ];
  var CAT = {}; CATS.forEach(function (x) { CAT[x.id] = x; });
  var SUBJ = { anatomy: 's_anatomy', physiology: 's_physiology', pathology: 's_pathology', microbiology: 's_micro', pharmacology: 's_pharma', biochemistry: 's_biochem', 'community-medicine': 's_community' };
  var SUBJ_AR = { anatomy: 'التشريح', physiology: 'الفسيولوجيا', pathology: 'علم الأمراض', microbiology: 'الأحياء الدقيقة', pharmacology: 'علم الأدوية', biochemistry: 'الكيمياء الحيوية', 'community-medicine': 'طب المجتمع',
    medicine: 'الباطنية', surgery: 'الجراحة', pediatrics: 'طب الأطفال', obstetrics: 'التوليد', gynecology: 'أمراض النساء', psychiatry: 'الطب النفسي', 'tropical-medicine': 'طب المناطق الحارة', 'forensic-medicine': 'الطب الشرعي' };
  var PEOPLE = [
    { id: 'arja', ar: 'د. عبدالجليل عبدالكريم ارجا', en: 'Dr. Abdaljalil Abdalkareem Arja', rar: 'مؤلف سلسلة Master Review ومؤسس المنصة', ren: 'Author of the Master Review series and founder of the platform',
      sp: ['Obstetrics', 'Surgery', 'Pediatrics'], courses: ['obstetrics', 'surgery', 'pediatrics'], tel: '0116984258', wa: '249116984258', tone: 'teal' },
    { id: 'alabass', ar: 'د. العباس عبدالرحمن', en: 'Dr. Alabass Abdulrahman', rar: 'مؤلف مشارك في سلسلة Master Review', ren: 'Co-author of the Master Review series',
      sp: ['Obstetrics', 'Surgery', 'Pediatrics'], courses: ['obstetrics', 'surgery', 'pediatrics'], tel: '0965859782', wa: '249965859782', tone: 'navy' },
    { id: 'amnia', ar: 'امنيه بكري علي', en: 'Amnia Bakri Ali', rar: 'مؤلفة مشاركة في Surgery Master Review', ren: 'Co-author of Surgery Master Review',
      sp: ['Surgery'], courses: ['surgery'], photo: 'img/people/amnia.webp', tone: 'rose' },
    { id: 'areej', ar: 'أريج يوسف', en: 'Areej Yousif', rar: 'مؤلفة مشاركة في Surgery Master Review', ren: 'Co-author of Surgery Master Review',
      sp: ['Surgery'], courses: ['surgery'], photo: 'img/people/areej.webp', tone: 'violet' }
  ];
  var PERSON = {}; PEOPLE.forEach(function (p) { PERSON[p.id] = p; });

  function catOf(b) { return b.section === 'basic-sciences' ? 'basics' : b.section === 'house-officer' ? 'house' : 'clinical'; }
  var COURSES = SMR.books.map(function (b) {
    var ct = CONTENT[b.id], live = c.avail(b) && ct;
    var chs = live ? ct.chapters : [];
    return { id: b.id, b: b, cat: catOf(b), live: !!live, title: b.title, series: b.series, ct: ct || null, chs: chs,
      img: (chs[0] && chs[0].img) || b.cover, people: live ? PEOPLE.filter(function (p) { return p.courses.indexOf(b.id) >= 0; }).map(function (p) { return p.id; }) : [],
      types: live ? ['book', 'qbank', 'cards', 'rr', 'osce'] : [] };
  });
  var COURSE = {}; COURSES.forEach(function (x) { COURSE[x.id] = x; });
  function liveCourses() { return COURSES.filter(function (x) { return x.live; }); }
  function topicOf(cid, tid) { var x = COURSE[cid]; if (!x) return null; for (var i = 0; i < x.chs.length; i++) for (var j = 0; j < x.chs[i].topics.length; j++) if (x.chs[i].topics[j].id === tid) return { ch: x.chs[i], t: x.chs[i].topics[j], ci: i, ti: j }; return null; }
  function lessonsOf(cid) { var a = []; (COURSE[cid] ? COURSE[cid].chs : []).forEach(function (ch) { ch.topics.forEach(function (t) { a.push({ ch: ch, t: t }); }); }); return a; }
  function osceCh(cid) { var x = COURSE[cid]; return x ? x.chs.filter(function (ch) { return /OSCE/i.test(ch.title); })[0] : null; }

  /* ---------- learning paths: built from the real courses ---------- */
  var PATHS = [
    { id: 'final-clinical', tone: 'teal', ar: 'المراجعة النهائية للجانب الإكلينيكي', en: 'Final Clinical Review',
      dar: 'الجراحة ثم التوليد ثم طب الأطفال: الكتب الثلاثة كاملة بترتيب يناسب سنة التخرج.', den: 'Surgery, then Obstetrics, then Pediatrics: the three books in a graduation-year order.',
      steps: function () { return ['surgery', 'obstetrics', 'pediatrics'].map(function (id) { return { k: 'course', id: id }; }); } },
    { id: 'osce', tone: 'violet', ar: 'التحضير لامتحان الأوسكي', en: 'OSCE Preparation',
      dar: 'محطات الفحص السريري وأخذ التاريخ المرضي في الكتب الثلاثة، مع الأسئلة التي يسألها الممتحن.', den: 'Clinical examination and history stations from the three books, with the examiners’ questions.',
      steps: function () { return ['surgery', 'obstetrics', 'pediatrics'].map(function (id) { var ch = osceCh(id); return ch ? { k: 'chapter', id: id, n: ch.n } : null; }).filter(Boolean); } },
    { id: 'exam-week', tone: 'gold', ar: 'أسبوع الامتحان: مراجعة سريعة', en: 'Exam Week Rapid Review',
      dar: 'المراجعة السريعة لكل كتاب ثم اختبار موقوت من بنك الأسئلة.', den: 'The Rapid Review of each book, then a timed test from the question bank.',
      steps: function () { var a = []; ['surgery', 'obstetrics', 'pediatrics'].forEach(function (id) { a.push({ k: 'tool', id: id, tool: 'rr' }); a.push({ k: 'tool', id: id, tool: 'qbank' }); }); return a; } },
    { id: 'surgery-chapters', tone: 'blue', ar: 'الجراحة فصلًا فصلًا', en: 'Surgery, Chapter by Chapter',
      dar: 'فصول Surgery Master Review بالترتيب، من السوائل والصدمة حتى الغدة الدرقية والأوسكي.', den: 'The Surgery Master Review chapters in order, from fluids and shock to thyroid and OSCE.',
      steps: function () { return (COURSE.surgery ? COURSE.surgery.chs : []).map(function (ch) { return { k: 'chapter', id: 'surgery', n: ch.n }; }); } },
    { id: 'pediatrics-chapters', tone: 'green', ar: 'طب الأطفال فصلًا فصلًا', en: 'Pediatrics, Chapter by Chapter',
      dar: 'فصول Pediatric Master Review بالترتيب، من النمو والتطعيم حتى الطوارئ والأوسكي.', den: 'The Pediatric Master Review chapters in order, from growth and immunization to emergencies and OSCE.',
      steps: function () { return (COURSE.pediatrics ? COURSE.pediatrics.chs : []).map(function (ch) { return { k: 'chapter', id: 'pediatrics', n: ch.n }; }); } }
  ];
  var PATH = {}; PATHS.forEach(function (p) { PATH[p.id] = p; });

  /* ---------- device data: done lessons, notes, favourites, history, collections, path steps ---------- */
  function get(k, d) { var v = LS.get(k, d); return v && typeof v === 'object' ? v : d; }
  function done() { return get('ldone', {}); }
  function isDone(cid, tid) { return !!done()[cid + '.' + tid]; }
  function setDone(cid, tid, v) { var d = done(); if (v) d[cid + '.' + tid] = Date.now(); else delete d[cid + '.' + tid]; LS.set('ldone', d); }
  function favs() { return get('fav', {}); }
  function isFav(k) { return !!favs()[k]; }
  function togFav(k) { var f = favs(); if (f[k]) delete f[k]; else f[k] = Date.now(); LS.set('fav', f); return !!f[k]; }
  function hist() { var h = LS.get('hist', []); return Array.isArray(h) ? h : []; }
  function addHist(k) { var h = hist().filter(function (x) { return x.k !== k; }); h.unshift({ k: k, t: Date.now() }); LS.set('hist', h.slice(0, 120)); }
  function colls() { var x = LS.get('coll', []); return Array.isArray(x) ? x : []; }
  function pstep() { return get('pstep', {}); }

  function coursePct(cid) {
    var s = c.stats(cid), ls = lessonsOf(cid), d = done(), n = 0;
    ls.forEach(function (l) { if (d[cid + '.' + l.t.id]) n++; });
    var a = ls.length ? Math.round(n / ls.length * 100) : 0, b = s && s.s.pages.total ? Math.round(s.s.pages.read / s.s.pages.total * 100) : 0;
    return Math.min(100, Math.max(a, b));
  }
  function chPct(cid, n) {
    var s = c.stats(cid), x = s && s.s.ch.filter(function (q) { return String(q.n) === String(n); })[0];
    var ch = COURSE[cid].chs.filter(function (q) { return q.n === n; })[0], d = done(), k = 0;
    if (ch) ch.topics.forEach(function (t) { if (d[cid + '.' + t.id]) k++; });
    var a = ch && ch.topics.length ? Math.round(k / ch.topics.length * 100) : 0, b = x && x.total ? Math.round(x.read / x.total * 100) : 0;
    return Math.min(100, Math.max(a, b));
  }
  function stepPct(s) {
    if (s.k === 'course') return coursePct(s.id);
    if (s.k === 'chapter') return chPct(s.id, s.n);
    return pstep()[s.id + '.' + s.tool] ? 100 : 0;
  }
  function pathPct(p) { var st = p.steps(); if (!st.length) return 0; var t = 0; st.forEach(function (s) { t += stepPct(s); }); return Math.round(t / st.length); }

  /* ---------- small parts ---------- */
  function bar(v, cls) { return '<span class="xbar' + (cls ? ' ' + cls : '') + '" role="img" aria-label="' + v + '%"><i style="width:' + v + '%"></i></span>'; }
  function chipS(txt, cls) { return '<span class="xchip ' + (cls || '') + '">' + txt + '</span>'; }
  function soon() { return chipS(esc(A('قريبًا', 'Coming soon')), 'soon'); }
  function banner(title, sub, ico, img, extra) {
    return '<section class="xban"' + (img ? ' style="--bi:url(' + U(img) + ')"' : '') + '><div class="xbt">' + (ico ? '<span class="xbi">' + ic(ico) + '</span>' : '') +
      '<div><h1 tabindex="-1">' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div></div>' + (extra || '') + '</section>';
  }
  function empty(ico, t1, t2, act) { return '<div class="xempty">' + ic(ico) + '<b>' + esc(t1) + '</b>' + (t2 ? '<span>' + esc(t2) + '</span>' : '') + (act || '') + '</div>'; }
  function personAv(p, cls) {
    var nm = A(p.ar, p.en).replace(/^(د\.|Dr\.)\s*/, ''), pt = nm.split(/\s+/); pt = [pt[0], pt[pt.length - 1]];
    return '<span class="xav ' + (cls || '') + ' t-' + p.tone + '">' + (p.photo ? '<img src="' + esc(p.photo) + '" alt="" loading="lazy">' : '<b>' + esc((pt[0] || '')[0] + ((pt[1] || '')[0] || '')) + '</b>') + '</span>';
  }
  function favBtn(k, small) { var on = isFav(k); return '<button type="button" class="xfav' + (small ? ' sm' : '') + '" data-fav="' + esc(k) + '" aria-pressed="' + on + '" aria-label="' + esc(A('أضف إلى المفضلة', 'Add to favourites')) + '">' + ic('heart') + '</button>'; }
  function typeName(ty) { return { book: A('الكتاب', 'Book'), qbank: A('بنك الأسئلة', 'QBank'), cards: A('البطاقات', 'Flashcards'), rr: 'Rapid Review', osce: 'OSCE', video: A('محاضرات فيديو', 'Video lectures'), live: A('جلسات مباشرة', 'Live sessions'), slides: A('العروض التقديمية', 'Slides'), sum: A('الملخصات', 'Summaries') }[ty] || ty; }
  function typeIc(ty) { return { book: 'open', qbank: 'qb', cards: 'cards', rr: 'bolt', osce: 'steth', video: 'video', live: 'live', slides: 'slides', sum: 'file' }[ty] || 'file'; }
  function wa(num, txt) { return 'https://wa.me/' + num + (txt ? '?text=' + encodeURIComponent(txt) : ''); }
  var OWNER_WA = '249116984258';

  /* ---------- course card ---------- */
  function courseCard(x, opt) {
    opt = opt || {};
    var ct = x.ct, p = x.live ? coursePct(x.id) : 0, ppl = x.people.map(function (id) { return PERSON[id]; });
    var badge = x.live ? (x.b.edition ? chipS(esc(c.L(x.b.edition)), 'ed') : '') : soon();
    var h = '<article class="xcard' + (x.live ? '' : ' off') + '"><a class="xcimg" href="#course-' + x.id + '" style="--ci:url(' + U(x.live ? x.img : x.b.cover) + ')">' +
      (x.live ? '' : '<img class="xcov" src="' + esc(x.b.cover) + '" alt="" loading="lazy">') + '<span class="xcb">' + badge + '</span></a>' + favBtn('c:' + x.id, true) +
      '<div class="xcbody"><h3><a href="#course-' + x.id + '">' + E(x.title) + '</a><small>' + esc(A(SUBJ_AR[x.id] || '', x.series)) + '</small></h3>';
    if (x.live) {
      h += '<div class="xppl">' + ppl.slice(0, 3).map(function (q) { return personAv(q, 'sm'); }).join('') + '<span>' + esc(A(ppl[0].ar, ppl[0].en)) + (ppl.length > 1 ? ' <bdi>+' + (ppl.length - 1) + '</bdi>' : '') + '</span></div>' +
        '<div class="xstats"><span>' + ic('layers') + N(ct.n.ch) + ' ' + esc(A('فصول', 'chapters')) + '</span><span>' + ic('open') + N(ct.n.topics) + ' ' + esc(A('درس', 'lessons')) + '</span><span>' + ic('qb') + N(ct.n.qs) + ' ' + esc(A('سؤال', 'questions')) + '</span><span>' + ic('cards') + N(ct.n.cards) + ' ' + esc(A('بطاقة', 'cards')) + '</span></div>';
      if (p) h += '<div class="xprog">' + bar(p) + '<em>' + N(p + '%') + '</em></div>';
      h += '<div class="xact"><a class="xbtn pri" href="#course-' + x.id + '">' + ic(p ? 'play' : 'open') + '<span>' + esc(p ? A('تابع التعلّم', 'Continue') : A('ابدأ الكورس', 'Start course')) + '</span></a>' +
        '<a class="xbtn ghost" data-read="' + x.id + '" href="#read-' + x.id + '">' + ic('book') + '<span>' + esc(A('افتح الكتاب', 'Open book')) + '</span></a></div>';
    } else {
      h += '<p class="xdesc">' + esc(c.L(x.b.sub) || A('مرجع عملي للامتياز', 'Practical handbook')) + '</p><div class="xact"><a class="xbtn ghost" href="#course-' + x.id + '">' + ic('info') + '<span>' + esc(A('التفاصيل', 'Details')) + '</span></a>' +
        '<button type="button" class="xbtn ghost" data-notify="' + x.id + '">' + ic('bell') + '<span>' + esc(LS.get('ntf', {})[x.id] ? A('سننبهك', 'We’ll notify you') : A('نبّهني', 'Notify me')) + '</span></button></div>';
    }
    return h + '</div></article>';
  }

  /* ========== HOME ========== */
  function vHome() {
    var nm = c.cleanName(LS.get('name', '')), live = liveCourses(), tot = { l: 0, q: 0, k: 0 };
    live.forEach(function (x) { tot.l += x.ct.n.topics; tot.q += x.ct.n.qs; tot.k += x.ct.n.cards; });
    var h = '<section class="xhero"><div class="xhin"><p class="xhi">' + esc(nm ? A('مرحبًا د. ', 'Welcome, Dr. ') : A('مرحبًا بك يا دكتور', 'Welcome, Doctor')) + (nm ? '<bdi>' + esc(nm) + '</bdi>' : '') + ' 👋</p>' +
      '<h1 tabindex="-1">' + NAME + '</h1><p class="xhs">' + esc(A('منصة تعليمية متكاملة لطلبة الطب في السودان', 'A complete learning platform for medical students in Sudan')) + '</p>' +
      '<p class="xht">' + [A('كورسات', 'Courses'), A('بنوك أسئلة', 'Question banks'), A('مراجعات', 'Reviews'), A('محاضرات', 'Lectures'), A('فعاليات', 'Events')].map(esc).join(' · ') + '</p>' +
      '<form class="xhsearch" role="search" data-hsearch><span>' + ic('search') + '</span><input type="search" name="q" autocomplete="off" placeholder="' + esc(A('ابحث عن كورس أو مادة أو درس…', 'Search a course, subject or lesson…')) + '" aria-label="' + esc(A('بحث', 'Search')) + '"><button type="submit" class="xbtn pri">' + esc(A('بحث', 'Search')) + '</button></form>' +
      '</div><div class="xhart" aria-hidden="true"></div></section>';
    /* continue learning */
    var last = hist().filter(function (x) { return /^l:|^c:/.test(x.k); })[0];
    if (last) {
      var m = last.k.match(/^l:([^.]+)\.(.+)$/), cc = m ? COURSE[m[1]] : COURSE[last.k.slice(2)], tp = m ? topicOf(m[1], m[2]) : null;
      if (cc && cc.live) {
        var p = coursePct(cc.id);
        h += '<a class="xcont" href="' + (tp ? '#lesson-' + cc.id + '.' + tp.t.id : '#course-' + cc.id) + '"><span class="xci" style="--ci:url(' + U(tp ? tp.ch.img || cc.img : cc.img) + ')"><b>' + ic('play') + '</b></span><span class="xct"><small>' + esc(A('تابع من حيث توقفت', 'Continue where you left off')) + '</small><b>' + E(tp ? tp.t.no + ' ' + tp.t.title : cc.b.app) + '</b><span>' + E(cc.b.app) + '</span>' + bar(p) + '</span><span class="xcp">' + N(p + '%') + '</span></a>';
      }
    }
    /* four doors */
    h += '<section class="xdoors">' + CATS.filter(function (k) { return k.id !== 'house'; }).map(function (k) {
      var n = COURSES.filter(function (x) { return x.cat === k.id && x.live; }).length;
      return '<a class="xdoor t-' + k.tone + '" href="#cat-' + k.id + '"><span class="xdi">' + ic(k.ico) + '</span><b>' + esc(A(k.ar, k.en)) + '</b><small>' + esc(A(k.dar, k.den)) + '</small>' +
        '<em>' + (n ? esc(A(n + ' كورسات متاحة', n + ' available')) : esc(A('قريبًا', 'Coming soon'))) + '</em></a>';
    }).join('') + '</section>';
    /* basic subjects */
    h += '<section class="xsec"><header class="xsh"><h2>' + esc(A('المواد الأساسية', 'Basic subjects')) + '</h2><a href="#cat-basics" class="xmore">' + esc(A('عرض الكل', 'View all')) + ic('chev', 'fl') + '</a></header><div class="xsubj">' +
      Object.keys(SUBJ).map(function (id) { var b = c.BOOK[id]; if (!b) return ''; return '<a class="xsj" href="#course-' + id + '"><span class="xsji">' + ic(SUBJ[id]) + '</span><b>' + esc(A(SUBJ_AR[id], b.title)) + '</b>' + (c.avail(b) ? '' : '<small>' + esc(A('قريبًا', 'Soon')) + '</small>') + '</a>'; }).join('') + '</div></section>';
    /* layout: main + side */
    h += '<div class="xcols"><div class="xmain">';
    h += '<section class="xsec"><header class="xsh"><h2>' + ic('star', 'gold') + esc(A('الكورسات المتاحة', 'Available courses')) + '</h2><a href="#courses" class="xmore">' + esc(A('كل الكورسات', 'All courses')) + ic('chev', 'fl') + '</a></header>' +
      '<div class="xgrid c3">' + live.map(function (x) { return courseCard(x); }).join('') + '</div></section>';
    h += '<section class="xsec"><header class="xsh"><h2>' + ic('route') + esc(A('المسارات التعليمية', 'Learning paths')) + '</h2><a href="#paths" class="xmore">' + esc(A('كل المسارات', 'All paths')) + ic('chev', 'fl') + '</a></header><div class="xpaths">' +
      PATHS.slice(0, 3).map(pathCard).join('') + '</div></section>';
    h += '</div><aside class="xside">' + eventsBox(3) + statsBox(live.length, tot) + commBox() + '</aside></div>';
    return h;
  }
  function statsBox(nc, tot) {
    return '<section class="xbox xnums"><h2>' + ic('chart') + esc(A('المنصة اليوم', 'The platform today')) + '</h2><div>' +
      [['layers', nc, A('كورسات متاحة', 'courses')], ['open', tot.l, A('درسًا', 'lessons')], ['qb', tot.q, A('سؤالًا', 'questions')], ['cards', tot.k, A('بطاقة مراجعة', 'flashcards')]].map(function (r) {
        return '<span>' + ic(r[0]) + '<b>' + N(r[1]) + '</b><small>' + esc(r[2]) + '</small></span>'; }).join('') + '</div></section>';
  }
  function commBox() {
    return '<a class="xbox xjoin" href="#community"><b>' + esc(A('مجتمع طلبة الطب', 'Medical students’ community')) + '</b><span>' + esc(A('ناقش، اسأل، واطلب الكورس الذي تحتاجه.', 'Discuss, ask, and request the course you need.')) + '</span><em class="xbtn pri">' + ic('group') + esc(A('ادخل المجتمع', 'Open the community')) + '</em></a>';
  }

  /* ========== EVENTS ========== */
  function upcoming() { var now = Date.now(); return EVENTS.filter(function (e) { return new Date(e.end || e.date).getTime() > now; }).sort(function (a, b) { return new Date(a.date) - new Date(b.date); }); }
  function past() { var now = Date.now(); return EVENTS.filter(function (e) { return new Date(e.end || e.date).getTime() <= now; }).sort(function (a, b) { return new Date(b.date) - new Date(a.date); }); }
  function fmtDate(d, o) { try { return new Date(d).toLocaleDateString(lang() === 'en' ? 'en-GB' : 'ar-SD', o || { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) { return d; } }
  function evRow(e) {
    var d = new Date(e.date);
    return '<div class="xev"><span class="xevd"><b>' + N(d.getDate()) + '</b><small>' + esc(fmtDate(e.date, { month: 'short' })) + '</small></span><span class="xevt"><b>' + esc(A(e.ar || e.title, e.title || e.ar)) + '</b><small>' +
      ic(e.type === 'live' ? 'live' : 'cal') + esc(fmtDate(e.date, { weekday: 'long', hour: '2-digit', minute: '2-digit' })) + '</small></span>' +
      (e.link ? '<a class="xbtn sm pri" href="' + esc(e.link) + '" target="_blank" rel="noopener">' + esc(A('انضم', 'Join')) + '</a>' : '') + '</div>';
  }
  function eventsBox(n) {
    var up = upcoming().slice(0, n);
    return '<section class="xbox"><header class="xsh"><h2>' + ic('cal') + esc(A('الفعاليات القادمة', 'Upcoming events')) + '</h2><a class="xmore" href="#events">' + esc(A('الكل', 'All')) + ic('chev', 'fl') + '</a></header>' +
      (up.length ? up.map(evRow).join('') : '<p class="xnone">' + esc(A('لا توجد فعاليات مجدولة الآن. ستظهر هنا الجلسات المباشرة وورش العمل عند الإعلان عنها.', 'No events are scheduled now. Live sessions and workshops will appear here when announced.')) + '</p>' +
        '<button type="button" class="xbtn ghost wide" data-notify="events">' + ic('bell') + '<span>' + esc(LS.get('ntf', {}).events ? A('سننبهك عند الإعلان', 'We’ll notify you') : A('نبّهني عند الإعلان', 'Notify me')) + '</span></button>') + '</section>';
  }
  function vEvents() {
    var up = upcoming(), ps = past();
    var h = banner(esc(A('الفعاليات', 'Events')), esc(A('جلسات مراجعة مباشرة، ورش OSCE، وندوات للتحضير للامتحانات.', 'Live revision sessions, OSCE workshops and exam-preparation seminars.')), 'cal', 'img/ui/library.webp');
    h += '<div class="xcols"><div class="xmain"><section class="xsec"><header class="xsh"><h2>' + esc(A('القادمة', 'Upcoming')) + '</h2></header>' +
      (up.length ? '<div class="xevl">' + up.map(evRow).join('') + '</div>' : empty('cal', A('لا توجد فعاليات قادمة الآن', 'No upcoming events yet'), A('عند الإعلان عن جلسة أو ورشة ستظهر هنا مع موعدها ورابط الانضمام، ثم يُضاف تسجيلها بعد انتهائها.', 'When a session or workshop is announced it appears here with its time and joining link; its recording is added afterwards.'),
        '<button type="button" class="xbtn pri" data-notify="events">' + ic('bell') + '<span>' + esc(LS.get('ntf', {}).events ? A('سننبهك عند الإعلان', 'We’ll notify you') : A('نبّهني عند الإعلان', 'Notify me')) + '</span></button>')) + '</section>' +
      '<section class="xsec"><header class="xsh"><h2>' + esc(A('التسجيلات', 'Recordings')) + '</h2></header>' + (ps.length ? '<div class="xevl">' + ps.map(evRow).join('') + '</div>' : '<p class="xnone">' + esc(A('لا توجد تسجيلات بعد.', 'No recordings yet.')) + '</p>') + '</section></div>' +
      '<aside class="xside"><section class="xbox"><h2>' + ic('sparkle') + esc(A('اقترح فعالية', 'Suggest an event')) + '</h2><p class="xnone">' + esc(A('موضوع تريد جلسة مباشرة عنه؟ أرسل اقتراحك وسيُنظر فيه عند جدولة الفعاليات.', 'A topic you want a live session on? Send it and it will be considered when events are planned.')) + '</p>' +
      '<a class="xbtn ghost wide" target="_blank" rel="noopener" href="' + wa(OWNER_WA, 'اقتراح فعالية على منصة اشرح لي: ') + '">' + ic('wa') + '<span>' + esc(A('أرسل الاقتراح', 'Send suggestion')) + '</span></a></section></aside></div>';
    return h;
  }

  /* ========== COURSES CATALOGUE ========== */
  var F = { cat: {}, sub: {}, who: {}, ty: {}, st: 'all', sort: 'pop', view: LS.get('cview', 'grid'), q: '' };
  function vCourses(catId) {
    if (catId) { F.cat = {}; F.cat[catId] = 1; }
    var k = catId && CAT[catId];
    var h = banner(k ? esc(A(k.ar, k.en)) + ' <small>' + E(k.en) + '</small>' : 'Courses', esc(k ? A(k.dar, k.den) : A('كورسات متكاملة: كتاب، دروس، بنك أسئلة، بطاقات ومراجعة سريعة لكل مادة.', 'Complete courses: book, lessons, question bank, flashcards and rapid review for every subject.')), k ? k.ico : 'layers', 'img/ui/hero-anatomy.webp');
    h += '<section class="xcats">' + CATS.map(function (q) {
      return '<button type="button" class="xcat t-' + q.tone + '" data-fcat="' + q.id + '" aria-pressed="' + !!F.cat[q.id] + '">' + ic(q.ico) + '<span><b>' + esc(q.en) + '</b><small>' + esc(q.ar) + '</small></span></button>'; }).join('') + '</section>';
    h += '<div class="xcols rev"><aside class="xfilt" id="xfilt"><header><h2>' + ic('filter') + esc(A('تصفية النتائج', 'Filter')) + '</h2><button type="button" class="xlink" data-fclear>' + esc(A('مسح الكل', 'Clear')) + '</button></header>' +
      fgroup(A('الحالة', 'Status'), [['all', A('الكل', 'All')], ['live', A('متاح الآن', 'Available now')], ['soon', A('قريبًا', 'Coming soon')]].map(function (o) {
        return '<label class="xopt"><input type="radio" name="fst" value="' + o[0] + '"' + (F.st === o[0] ? ' checked' : '') + '><span>' + esc(o[1]) + '</span></label>'; }).join('')) +
      fgroup(A('المادة', 'Subject'), COURSES.map(function (x) { return '<label class="xopt"><input type="checkbox" data-fsub="' + x.id + '"' + (F.sub[x.id] ? ' checked' : '') + '><span>' + E(x.title + (x.b.ho ? ' (HO)' : '')) + '</span><em>' + esc(SUBJ_AR[x.id] || '') + '</em></label>'; }).join(''), true) +
      fgroup(A('المحاضر', 'Lecturer'), PEOPLE.map(function (p) { return '<label class="xopt"><input type="checkbox" data-fwho="' + p.id + '"' + (F.who[p.id] ? ' checked' : '') + '>' + personAv(p, 'xs') + '<span>' + esc(A(p.ar, p.en)) + '</span></label>'; }).join('')) +
      fgroup(A('نوع المحتوى', 'Content type'), ['book', 'qbank', 'cards', 'rr', 'osce', 'video', 'live'].map(function (ty) { return '<label class="xopt"><input type="checkbox" data-fty="' + ty + '"' + (F.ty[ty] ? ' checked' : '') + '>' + ic(typeIc(ty)) + '<span>' + esc(typeName(ty)) + '</span></label>'; }).join('')) +
      '</aside><div class="xmain"><div class="xtool"><label class="xfield">' + ic('search') + '<input type="search" id="xcq" placeholder="' + esc(A('ابحث في الكورسات…', 'Search courses…')) + '" value="' + esc(F.q) + '"></label>' +
      '<button type="button" class="xbtn ghost xonly-ph" data-ftog>' + ic('filter') + '<span>' + esc(A('تصفية', 'Filter')) + '</span></button>' +
      '<select class="xsel" id="xsort" aria-label="' + esc(A('ترتيب', 'Sort')) + '">' + [['pop', A('المتاح أولًا', 'Available first')], ['az', A('أبجديًا', 'A–Z')], ['prog', A('الأكثر تقدّمًا', 'My progress')]].map(function (o) { return '<option value="' + o[0] + '"' + (F.sort === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>' +
      '<span class="xseg"><button type="button" data-cview="grid" aria-pressed="' + (F.view === 'grid') + '" aria-label="grid">' + ic('grid') + '</button><button type="button" data-cview="list" aria-pressed="' + (F.view === 'list') + '" aria-label="list">' + ic('list') + '</button></span></div>' +
      '<div id="xcres"></div></div></div>';
    return h;
  }
  function fgroup(t, body, scroll) { return '<details class="xfg" open><summary>' + esc(t) + ic('down') + '</summary><div' + (scroll ? ' class="scr"' : '') + '>' + body + '</div></details>'; }
  function any(o) { return Object.keys(o).some(function (k) { return o[k]; }); }
  function fillCourses() {
    var out = document.getElementById('xcres'); if (!out) return;
    var q = c.norm(F.q), r = COURSES.filter(function (x) {
      if (any(F.cat) && !F.cat[x.cat]) return false;
      if (any(F.sub) && !F.sub[x.id]) return false;
      if (any(F.who) && !x.people.some(function (p) { return F.who[p]; })) return false;
      if (any(F.ty) && !Object.keys(F.ty).filter(function (k) { return F.ty[k]; }).every(function (k) { return x.types.indexOf(k) >= 0; })) return false;
      if (F.st === 'live' && !x.live) return false; if (F.st === 'soon' && x.live) return false;
      if (q) { var hay = c.norm([x.title, x.series, SUBJ_AR[x.id], x.b.kw, (x.b.areas || []).join(' '), x.chs.map(function (ch) { return ch.title; }).join(' ')].join(' ')); if (!q.split(' ').every(function (w) { return hay.indexOf(w) >= 0; })) return false; }
      return true;
    });
    r.sort(function (a, b) { if (F.sort === 'az') return a.title.localeCompare(b.title); if (F.sort === 'prog') return coursePct(b.id) - coursePct(a.id); return (b.live - a.live) || 0; });
    var tyOnly = any(F.ty) && ['video', 'live'].some(function (k) { return F.ty[k]; });
    out.innerHTML = '<p class="xcount">' + esc(A('النتائج', 'Results')) + ' ' + N(r.length) + '</p>' + (r.length ? '<div class="xgrid ' + (F.view === 'list' ? 'xlist' : 'c3') + '">' + r.map(function (x) { return courseCard(x); }).join('') + '</div>' :
      empty(tyOnly ? 'video' : 'search', tyOnly ? A('لا توجد كورسات فيديو أو جلسات مباشرة بعد', 'No video or live courses yet') : A('لا توجد نتائج', 'No results'), tyOnly ? A('المحاضرات المسجلة تُضاف إلى دروس الكورسات تباعًا، وتظهر في هذا الفلتر عند رفعها.', 'Recorded lectures are being added to course lessons and will appear under this filter when uploaded.') : A('جرّب كلمة أخرى أو امسح عوامل التصفية.', 'Try another word or clear the filters.'),
        '<a class="xbtn ghost" target="_blank" rel="noopener" href="' + wa(OWNER_WA, 'طلب كورس على منصة اشرح لي: ') + '">' + ic('plus') + '<span>' + esc(A('اطلب كورسًا', 'Request a course')) + '</span></a>'));
  }

  /* ========== COURSE PAGE ========== */
  function vCourse(id) {
    var x = COURSE[id]; if (!x) return null;
    addHist('c:' + id);
    if (!x.live) return vCourseSoon(x);
    var ct = x.ct, p = coursePct(id), s = c.stats(id), ls = lessonsOf(id), d = done(), nd = ls.filter(function (l) { return d[id + '.' + l.t.id]; }).length;
    var next = ls.filter(function (l) { return !d[id + '.' + l.t.id]; })[0] || ls[0];
    var h = '<nav class="xcrumb"><a href="#courses">Courses</a>' + ic('chev', 'fl') + '<a href="#cat-' + x.cat + '">' + esc(CAT[x.cat].en) + '</a>' + ic('chev', 'fl') + '<span>' + E(x.title) + '</span></nav>';
    h += '<section class="xchero" style="--ci:url(' + U(x.img) + ')"><div class="xchin"><img class="xchcov" src="' + esc(x.b.cover) + '" alt="" width="' + x.b.w + '" height="' + x.b.h + '">' +
      '<div class="xcht"><span class="xchk">' + chipS(esc(CAT[x.cat].en), 'lt') + (x.b.edition ? chipS(esc(c.L(x.b.edition)), 'lt') : '') + '</span><h1 tabindex="-1">' + E(x.b.app) + '</h1>' +
      '<p>' + esc(c.L(x.b.sub)) + '</p><div class="xchs">' +
      [['layers', ct.n.ch, A('فصول', 'chapters')], ['open', ct.n.topics, A('درس', 'lessons')], ['qb', ct.n.qs, A('سؤال', 'questions')], ['cards', ct.n.cards, A('بطاقة', 'flashcards')]].map(function (r) { return '<span>' + ic(r[0]) + '<b>' + N(r[1]) + '</b>' + esc(r[2]) + '</span>'; }).join('') +
      '</div><div class="xcha"><a class="xbtn gold" href="#lesson-' + id + '.' + next.t.id + '">' + ic('play') + '<span>' + esc(nd ? A('تابع الدرس التالي', 'Continue to next lesson') : A('ابدأ أول درس', 'Start first lesson')) + '</span></a>' +
      '<a class="xbtn lt" href="#read-' + id + '" data-read="' + id + '">' + ic('book') + '<span>' + esc(A('افتح الكتاب كاملًا', 'Open the whole book')) + '</span></a>' + favBtn('c:' + id) +
      '<button type="button" class="xfav" data-share="course-' + id + '" aria-label="' + esc(A('مشاركة', 'Share')) + '">' + ic('share') + '</button></div></div></div></section>';
    /* tabs */
    h += '<div class="xcols"><div class="xmain"><div class="xtabs" role="tablist">' + [['cur', A('محتوى الكورس', 'Curriculum')], ['ov', A('نظرة عامة', 'Overview')], ['ppl', A('المحاضرون', 'Lecturers')], ['tools', A('أدوات الدراسة', 'Study tools')]].map(function (tb, i) {
      return '<button type="button" role="tab" data-tab="' + tb[0] + '" aria-selected="' + (i === 0) + '">' + esc(tb[1]) + '</button>'; }).join('') + '</div>';
    h += '<div class="xpane" data-pane="cur">' + curriculum(id, null) + '</div>';
    h += '<div class="xpane" data-pane="ov" hidden><section class="xbox"><h2>' + esc(A('ماذا ستتعلم', 'What you’ll learn')) + '</h2><ul class="xlearn">' + x.chs.map(function (ch) { return '<li>' + ic('check') + E(ch.title) + '</li>'; }).join('') + '</ul></section>' +
      '<section class="xbox"><h2>' + esc(A('ما يشمله الكورس', 'This course includes')) + '</h2><ul class="xinc">' +
      ['book', 'qbank', 'cards', 'rr', 'osce'].map(function (ty) { return '<li>' + ic(typeIc(ty)) + '<span>' + esc(typeName(ty)) + '</span></li>'; }).join('') +
      '<li class="off">' + ic('video') + '<span>' + esc(A('محاضرات فيديو لكل درس', 'A video lecture for each lesson')) + '</span>' + soon() + '</li>' +
      '<li>' + ic('offline') + '<span>' + esc(A('يعمل دون إنترنت بعد الفتح الأول', 'Works offline after the first opening')) + '</span></li><li>' + ic('cloud') + '<span>' + esc(A('مزامنة الملاحظات والتقدّم بين أجهزتك', 'Notes and progress synced between your devices')) + '</span></li>' +
      '<li>' + ic('cert') + '<span>' + esc(A('شهادة إتمام عند إنهاء الكورس', 'Certificate of completion')) + '</span></li></ul></section>' +
      '<section class="xbox"><h2>' + esc(A('مجاني للتجربة', 'Free to try')) + '</h2><p class="xnone">' + esc(A('أول درس من كل فصل مفتوح مجانًا. الاشتراك يفتح الكورس كاملًا على أجهزتك.', 'The first lesson of every chapter is free. A subscription opens the whole course on your devices.')) + '</p></section></div>';
    h += '<div class="xpane" data-pane="ppl" hidden><div class="xgrid c2">' + x.people.map(function (pid) { return personCard(PERSON[pid]); }).join('') + '</div></div>';
    h += '<div class="xpane" data-pane="tools" hidden><div class="xtools">' + toolTiles(id) + '</div></div>';
    h += '</div><aside class="xside"><section class="xbox xmyp"><h2>' + ic('target') + esc(A('تقدّمك في الكورس', 'Your progress')) + '</h2><div class="xbig">' + N(p + '%') + '</div>' + bar(p) +
      '<ul class="xkv"><li><span>' + esc(A('دروس أنهيتها', 'Lessons completed')) + '</span><b>' + N(nd) + ' / ' + N(ls.length) + '</b></li>' +
      (s ? '<li><span>' + esc(A('صفحات مقروءة', 'Pages read')) + '</span><b>' + N(s.s.pages.read) + ' / ' + N(s.s.pages.total) + '</b></li><li><span>' + esc(A('أسئلة مُجابة', 'Questions answered')) + '</span><b>' + N(s.s.q.answered) + '</b></li><li><span>' + esc(A('بطاقات تعرفها', 'Cards known')) + '</span><b>' + N(s.s.cards.known) + '</b></li>' : '') + '</ul>' +
      (p >= 100 ? '<a class="xbtn gold wide" href="#cert-' + id + '">' + ic('cert') + '<span>' + esc(A('شهادة الإتمام', 'Certificate')) + '</span></a>' : '<p class="xnone">' + esc(A('أنهِ كل الدروس لتحصل على شهادة الإتمام.', 'Finish every lesson to receive the certificate of completion.')) + '</p>') + '</section>' +
      '<section class="xbox"><h2>' + ic('users') + esc(A('المحاضرون', 'Lecturers')) + '</h2>' + x.people.map(function (pid) { var q = PERSON[pid]; return '<a class="xpr" href="#lecturer-' + q.id + '">' + personAv(q, 'sm') + '<span><b>' + esc(A(q.ar, q.en)) + '</b><small>' + esc(A(q.rar, q.ren)) + '</small></span></a>'; }).join('') + '</section></aside></div>';
    return h;
  }
  function vCourseSoon(x) {
    var b = x.b, h = '<nav class="xcrumb"><a href="#courses">Courses</a>' + ic('chev', 'fl') + '<a href="#cat-' + x.cat + '">' + esc(CAT[x.cat].en) + '</a>' + ic('chev', 'fl') + '<span>' + E(x.title) + '</span></nav>';
    h += '<section class="xchero soon" style="--ci:url(' + U(b.cover) + ')"><div class="xchin"><img class="xchcov" src="' + esc(b.cover) + '" alt="" width="' + b.w + '" height="' + b.h + '"><div class="xcht"><span class="xchk">' + soon() + '</span>' +
      '<h1 tabindex="-1">' + E(b.title) + ' <small>' + E(b.series) + '</small></h1><p>' + esc(b.ho ? A('مرجع عملي لطبيب الامتياز: جرعات الأدوية، ملاحظات الأمراض، أخذ التاريخ المرضي والفحص.', 'A practical house-officer handbook: drug doses, disease notes, history taking and examination.') : c.L(b.sub)) + '</p>' +
      '<div class="xcha"><button type="button" class="xbtn gold" data-notify="' + x.id + '">' + ic('bell') + '<span>' + esc(LS.get('ntf', {})[x.id] ? A('سننبهك عند الإصدار', 'We’ll notify you') : A('نبّهني عند الإصدار', 'Notify me on release')) + '</span></button>' + favBtn('c:' + x.id) + '</div></div></div></section>';
    var areas = b.areas || (b.ho ? SMR.hoTools.map(function (q) { return A(q.ar, q.en); }) : []);
    h += '<section class="xbox"><h2>' + esc(A('المحتوى المخطط', 'Planned contents')) + '</h2><ul class="xlearn">' + areas.map(function (a) { return '<li>' + ic('check') + (lang() === 'ar' && !b.ho ? E(a) : esc(a)) + '</li>'; }).join('') + '</ul>' +
      '<p class="xnone">' + esc(A('هذا الكورس قيد الإعداد ولم يصدر بعد، فلا توجد دروس لفتحها الآن.', 'This course is being prepared and has not been released yet, so there are no lessons to open.')) + '</p></section>';
    return h;
  }
  function curriculum(id, cur) {
    var x = COURSE[id], d = done(), free = (x.ct && x.ct.free) || [];
    return '<div class="xcur">' + x.chs.map(function (ch) {
      var nd = ch.topics.filter(function (t) { return d[id + '.' + t.id]; }).length, open = cur ? ch.topics.some(function (t) { return t.id === cur; }) : false, all = nd === ch.topics.length;
      return '<details class="xchap"' + (open ? ' open' : '') + '><summary><span class="xcn' + (all ? ' ok' : '') + '">' + (all ? ic('check') : N(ch.n)) + '</span><span class="xctt">' + E(ch.title) + '<small>' + N(ch.topics.length) + ' ' + esc(A('دروس', 'lessons')) + (nd ? ' · ' + N(nd) + ' ' + esc(A('منتهٍ', 'done')) : '') + '</small></span>' + ic('down') + '</summary><ol>' +
        ch.topics.map(function (t) {
          var dn = d[id + '.' + t.id], vid = VIDEOS[id + '.' + t.id];
          return '<li><a class="xles' + (t.id === cur ? ' cur' : '') + '" href="#lesson-' + id + '.' + t.id + '"><span class="xlst ' + (dn ? 'ok' : '') + '">' + ic(dn ? 'check' : t.id === cur ? 'play' : vid ? 'video' : 'open') + '</span>' +
            '<span class="xlt"><b>' + E(t.no + ' ' + t.title) + '</b><small>' + (vid && vid.min ? N(vid.min) + ' ' + esc(A('دقيقة', 'min')) + ' · ' : '') + (t.qs ? N(t.qs) + ' ' + esc(A('سؤال', 'Q')) + ' · ' : '') + (t.cards ? N(t.cards) + ' ' + esc(A('بطاقة', 'cards')) : '') + '</small></span>' +
            (free.indexOf(t.id) >= 0 ? chipS(esc(A('مجاني', 'Free')), 'free') : '') + '</a></li>';
        }).join('') + '</ol></details>';
    }).join('') + '</div>';
  }
  function toolTiles(id) {
    var x = COURSE[id], oc = osceCh(id);
    return [['book', A('قراءة الكتاب', 'Read the book'), A('الكتاب كاملًا بأدوات التظليل والملاحظات والرسم', 'The whole book with highlights, notes and drawing'), 'book'],
      ['qbank', A('بنك الأسئلة', 'Question bank'), N(x.ct.n.qs) + ' ' + A('سؤال باختبارات موقوتة وتعليمية', 'questions in timed and tutor tests'), 'qbank'],
      ['cards', A('البطاقات', 'Flashcards'), N(x.ct.n.cards) + ' ' + A('بطاقة مع بطاقات اليوم', 'cards with daily cards'), 'cards'],
      ['rr', 'Rapid Review', A('مراجعة سريعة لكل موضوع قبل الامتحان', 'A short recap of every topic before the exam'), 'rr'],
      ['osce', 'OSCE', oc ? E(oc.title) : A('محطات الفحص السريري', 'Clinical stations'), 'osce']].map(function (r) {
        return '<button type="button" class="xtt t-' + r[0] + '" data-tool="' + id + '.' + r[3] + '">' + ic(typeIc(r[0])) + '<b>' + esc(r[1]) + '</b><small>' + (r[2].indexOf('<') >= 0 ? r[2] : esc(r[2])) + '</small></button>'; }).join('');
  }

  /* ========== LESSON PLAYER ========== */
  function vLesson(arg) {
    var m = arg.match(/^([^.]+)\.(.+)$/); if (!m) return null; var id = m[1], tp = topicOf(id, m[2]); if (!tp || !COURSE[id].live) return null;
    var x = COURSE[id], t = tp.t, key = id + '.' + t.id, ls = lessonsOf(id), i = ls.map(function (l) { return l.t.id; }).indexOf(t.id), prev = ls[i - 1], next = ls[i + 1], vid = VIDEOS[key], dn = isDone(id, t.id), p = coursePct(id);
    addHist('l:' + key);
    var h = '<nav class="xcrumb"><a href="#courses">Courses</a>' + ic('chev', 'fl') + '<a href="#course-' + id + '">' + E(x.title) + '</a>' + ic('chev', 'fl') + '<span>' + E(tp.ch.title) + '</span>' + ic('chev', 'fl') + '<span>' + E(t.no + ' ' + t.title) + '</span></nav>';
    h += '<div class="xlesson"><aside class="xlcur"><header><a class="xlink" href="#course-' + id + '">' + ic('chev', 'fr') + esc(A('عودة للكورس', 'Back to course')) + '</a><h2>' + esc(A('محتوى الكورس', 'Course content')) + '</h2><div class="xprog">' + bar(p) + '<em>' + N(p + '%') + '</em></div></header>' + curriculum(id, t.id) + '</aside>';
    h += '<div class="xlmain"><div class="xplayer">' + (vid ? '<video id="xvid" controls controlsList="nodownload noplaybackrate" disablePictureInPicture playsinline preload="metadata" src="' + esc(vid.src) + '"></video>' :
      '<div class="xposter" style="--ci:url(' + U(tp.ch.img || x.img) + ')"><div><span class="xpb">' + E(x.b.app) + '</span><h1 tabindex="-1">' + E(t.title) + '</h1><span class="xkp">' + esc(A('أهم النقاط', 'Key points')) + '</span><ul>' +
      t.sub.split(/\s*·\s*/).filter(Boolean).slice(0, 6).map(function (s) { return '<li>' + E(s) + '</li>'; }).join('') + '</ul><p class="xvs">' + ic('video') + esc(A('فيديو هذا الدرس قيد التسجيل. اقرأ الدرس في الكتاب الآن.', 'The video of this lesson is being recorded. Read it in the book now.')) + '</p>' +
      '<button type="button" class="xbtn gold" data-tool="' + id + '.' + t.id + '.book">' + ic('book') + '<span>' + esc(A('اقرأ الدرس في الكتاب', 'Read the lesson in the book')) + '</span></button></div></div>') + '</div>';
    h += '<div class="xlbar"><div><small>' + E(t.no + ' · ' + tp.ch.title) + '</small><h2>' + E(t.title) + '</h2></div><div class="xlba">' +
      (prev ? '<a class="xbtn ghost sm" href="#lesson-' + id + '.' + prev.t.id + '">' + ic('chev', 'fr') + '<span>' + esc(A('السابق', 'Previous')) + '</span></a>' : '') +
      '<button type="button" class="xbtn ' + (dn ? 'ok' : 'pri') + ' sm" data-done="' + key + '" aria-pressed="' + dn + '">' + ic(dn ? 'checkc' : 'check') + '<span>' + esc(dn ? A('أنهيت هذا الدرس', 'Completed') : A('أنهيت الدرس', 'Mark as done')) + '</span></button>' +
      (next ? '<a class="xbtn ghost sm" href="#lesson-' + id + '.' + next.t.id + '"><span>' + esc(A('التالي', 'Next')) + '</span>' + ic('chev', 'fl') + '</a>' : '') + favBtn('l:' + key, true) + '</div></div>';
    h += '<div class="xtabs" role="tablist">' + [['note', ic('note') + esc(A('ملاحظاتي', 'My notes'))], ['desc', ic('info') + esc(A('الوصف', 'Description'))], ['files', ic('link') + esc(A('مواد الدرس', 'Materials'))], ['quiz', ic('target') + esc(A('الاختبار', 'Quiz'))], ['qa', ic('chat') + esc(A('الأسئلة والنقاش', 'Q&A'))]].map(function (tb, k) {
      return '<button type="button" role="tab" data-tab="' + tb[0] + '" aria-selected="' + (k === 0) + '">' + tb[1] + '</button>'; }).join('') + '</div>';
    var nt = get('lnote', {})[key];
    h += '<div class="xpane" data-pane="note"><div class="xnotes"><div class="xnbar" role="toolbar">' + [['bold', 'bold'], ['italic', 'ital'], ['insertUnorderedList', 'ul'], ['hilite', 'hl']].map(function (b) {
      return '<button type="button" data-cmd="' + b[0] + '" aria-label="' + b[0] + '">' + ic(b[1]) + '</button>'; }).join('') + '<span class="xsp"></span>' +
      [['التشخيص', 'Diagnosis'], ['التشخيص التفريقي', 'Differential'], ['العلاج', 'Treatment'], ['المضاعفات', 'Complications'], ['فخ امتحاني', 'Exam trap']].map(function (q) { return '<button type="button" class="xtag" data-qtag="' + esc(A(q[0], q[1])) + '">' + esc(A(q[0], q[1])) + '</button>'; }).join('') +
      '</div><div class="xned" id="xned" contenteditable="true" role="textbox" aria-multiline="true" data-key="' + key + '" data-ph="' + esc(A('اكتب ملاحظاتك عن هذا الدرس هنا… تُحفظ تلقائيًا على جهازك.', 'Write your notes about this lesson… saved automatically on this device.')) + '">' + (nt ? nt.h : '') + '</div>' +
      '<div class="xnfoot"><span id="xnst">' + (nt ? esc(A('آخر حفظ: ', 'Last saved: ')) + esc(c.ago(nt.t)) : '') + '</span><button type="button" class="xbtn pri sm" data-nsave>' + ic('cloud') + '<span>' + esc(A('حفظ الملاحظات', 'Save notes')) + '</span></button></div></div></div>';
    h += '<div class="xpane" data-pane="desc" hidden><section class="xbox"><h2>' + E(t.title) + '</h2><p>' + esc(A('هذا الدرس من الفصل', 'This lesson belongs to chapter')) + ' ' + N(tp.ch.n) + ' ' + E(tp.ch.title) + ' ' + esc(A('في', 'of')) + ' ' + E(x.b.app) + '.</p><ul class="xlearn">' +
      t.sub.split(/\s*·\s*/).filter(Boolean).map(function (s) { return '<li>' + ic('check') + E(s) + '</li>'; }).join('') + '</ul></section></div>';
    h += '<div class="xpane" data-pane="files" hidden><div class="xmat">' +
      [['book', A('صفحات الدرس في الكتاب', 'The lesson pages in the book'), A('مع أدوات التظليل والملاحظات', 'with highlighting and notes'), 'book'], ['qbank', A('أسئلة هذا الدرس', 'Questions of this lesson'), N(t.qs) + ' ' + A('سؤال', 'questions'), 'qbank'],
        ['cards', A('بطاقات هذا الدرس', 'Flashcards of this lesson'), N(t.cards) + ' ' + A('بطاقة', 'cards'), 'cards'], ['rr', 'Rapid Review', A('ملخص الدرس للامتحان', 'Exam summary of the lesson'), 'rr']].map(function (r) {
          return '<button type="button" class="xmi" data-tool="' + id + '.' + t.id + '.' + r[3] + '">' + ic(typeIc(r[0])) + '<span><b>' + esc(r[1]) + '</b><small>' + (/</.test(r[2]) ? r[2] : esc(r[2])) + '</small></span>' + ic('chev', 'fl') + '</button>'; }).join('') +
      '<p class="xnone">' + ic('shield') + esc(A('المواد تُفتح داخل التطبيق ولا تُنزَّل كملفات، وتعمل دون إنترنت بعد فتحها أول مرة.', 'Materials open inside the app and are not downloaded as files; they work offline after the first opening.')) + '</p></div></div>';
    h += '<div class="xpane" data-pane="quiz" hidden><section class="xbox xquiz">' + ic('target') + '<b>' + esc(A('اختبر نفسك في هذا الدرس', 'Test yourself on this lesson')) + '</b><span>' + N(t.qs) + ' ' + esc(A('سؤال من بنك الأسئلة مع الشرح', 'questions from the question bank, with explanations')) + '</span>' +
      '<button type="button" class="xbtn pri" data-tool="' + id + '.' + t.id + '.qbank">' + ic('play') + '<span>' + esc(A('ابدأ الاختبار', 'Start the quiz')) + '</span></button></section></div>';
    var lec = PERSON[x.people[0]];
    h += '<div class="xpane" data-pane="qa" hidden><section class="xbox xquiz">' + ic('chat') + '<b>' + esc(A('اسأل عن هذا الدرس', 'Ask about this lesson')) + '</b><span>' + esc(A('النقاش العام لكل درس يفتح مع مجتمع الطلبة. حتى ذلك الحين أرسل سؤالك مباشرة وسيُرد عليك.', 'Public discussion of each lesson opens with the student community. Until then, send your question directly and you will get an answer.')) + '</span>' +
      '<a class="xbtn pri" target="_blank" rel="noopener" href="' + wa(lec.wa || OWNER_WA, 'سؤال عن درس ' + t.no + ' ' + t.title + ' (' + x.b.app + '): ') + '">' + ic('wa') + '<span>' + esc(A('أرسل سؤالك', 'Send your question')) + '</span></a></section></div>';
    h += '</div><aside class="xlside"><section class="xbox xlc" style="--ci:url(' + U(tp.ch.img || x.img) + ')"><div class="xlci"><b>' + E(x.b.app) + '</b><span>' + E(tp.ch.title) + '</span>' + chipS(esc(CAT[x.cat].en), 'lt') + '</div>' +
      '<a class="xpr" href="#lecturer-' + lec.id + '">' + personAv(lec, 'sm') + '<span><b>' + esc(A(lec.ar, lec.en)) + '</b><small>' + esc(A(lec.rar, lec.ren)) + '</small></span></a>' +
      '<div class="xlcs"><span>' + ic('open') + '<b>' + N(x.ct.n.topics) + '</b>' + esc(A('درس', 'lessons')) + '</span><span>' + ic('qb') + '<b>' + N(x.ct.n.qs) + '</b>' + esc(A('سؤال', 'questions')) + '</span><span>' + ic('cards') + '<b>' + N(x.ct.n.cards) + '</b>' + esc(A('بطاقة', 'cards')) + '</span></div></section>' +
      '<section class="xbox"><h2>' + ic('bolt') + esc(A('اختصارات', 'Shortcuts')) + '</h2><div class="xmat sm">' + [['rr', 'Rapid Review', 'rr'], ['qbank', A('بنك أسئلة الكورس', 'Course question bank'), 'qbank'], ['cards', A('بطاقات اليوم', 'Today’s cards'), 'cards']].map(function (r) {
        return '<button type="button" class="xmi" data-tool="' + id + '.' + r[2] + '">' + ic(typeIc(r[0])) + '<span><b>' + esc(r[1]) + '</b></span>' + ic('chev', 'fl') + '</button>'; }).join('') + '</div></section></aside></div>';
    return h;
  }

  /* ========== LEARNING PATHS ========== */
  function pathCard(p) {
    var st = p.steps(), v = pathPct(p);
    return '<a class="xpath t-' + p.tone + '" href="#path-' + p.id + '"><span class="xpi">' + ic('route') + '</span><span class="xpt"><b>' + esc(A(p.ar, p.en)) + '</b><small>' + esc(A(p.dar, p.den)) + '</small>' +
      '<span class="xpm"><em>' + N(st.length) + ' ' + esc(A('خطوات', 'steps')) + '</em>' + bar(v) + '<em>' + N(v + '%') + '</em></span></span></a>';
  }
  function vPaths() {
    return banner(esc(A('المسارات التعليمية', 'Learning Paths')), esc(A('مسارات منظّمة تأخذك من البداية حتى المراجعة النهائية، خطوة بعد خطوة.', 'Organised paths that take you from the start to the final review, step by step.')), 'route', 'img/ui/library.webp') +
      '<div class="xpaths big">' + PATHS.map(pathCard).join('') + '</div>' +
      '<p class="xnote">' + ic('info') + '<span>' + esc(A('تُبنى المسارات من الكورسات المتاحة، وتُضاف مسارات العلوم الأساسية والامتحانات الخاصة عند صدور كورساتها.', 'Paths are built from the available courses; Basic Sciences and Special Exams paths are added as their courses are released.')) + '</span></p>';
  }
  function stepRow(s, i) {
    var x = COURSE[s.id], v = stepPct(s), t1, t2, href, ico, act;
    if (s.k === 'course') { t1 = E(x.b.app); t2 = esc(A('الكورس كاملًا', 'The whole course')) + ' · ' + N(x.ct.n.topics) + ' ' + esc(A('درس', 'lessons')); href = '#course-' + s.id; ico = 'layers'; }
    else if (s.k === 'chapter') { var ch = x.chs.filter(function (q) { return q.n === s.n; })[0]; t1 = E(ch.title); t2 = E(x.title) + ' · ' + esc(A('الفصل', 'Chapter')) + ' ' + N(ch.n) + ' · ' + N(ch.topics.length) + ' ' + esc(A('دروس', 'lessons')); href = '#lesson-' + s.id + '.' + ch.topics[0].id; ico = 'open'; }
    else { t1 = esc(typeName(s.tool)) + ' · ' + E(x.title); t2 = esc(s.tool === 'rr' ? A('اقرأ المراجعة السريعة كاملة', 'Read the whole Rapid Review') : A('اختبار موقوت من بنك الأسئلة', 'A timed test from the question bank')); href = null; ico = typeIc(s.tool); }
    act = href ? '<a class="xbtn sm ' + (v >= 100 ? 'ghost' : 'pri') + '" href="' + href + '">' + esc(v >= 100 ? A('مراجعة', 'Review') : v ? A('تابع', 'Continue') : A('ابدأ', 'Start')) + '</a>' :
      '<button type="button" class="xbtn sm pri" data-tool="' + s.id + '.' + s.tool + '">' + esc(A('افتح', 'Open')) + '</button><button type="button" class="xbtn sm ' + (v ? 'ok' : 'ghost') + '" data-pstep="' + s.id + '.' + s.tool + '" aria-pressed="' + !!v + '">' + ic('check') + '</button>';
    return '<li class="xstep' + (v >= 100 ? ' ok' : '') + '"><span class="xsn">' + (v >= 100 ? ic('check') : N(i + 1)) + '</span><span class="xsi">' + ic(ico) + '</span><span class="xst"><b>' + t1 + '</b><small>' + t2 + '</small>' + (s.k !== 'tool' ? bar(v) : '') + '</span><span class="xsa">' + act + '</span></li>';
  }
  function vPath(id) {
    var p = PATH[id]; if (!p) return null; addHist('p:' + id);
    var st = p.steps(), v = pathPct(p);
    return '<nav class="xcrumb"><a href="#paths">' + esc(A('المسارات', 'Paths')) + '</a>' + ic('chev', 'fl') + '<span>' + esc(A(p.ar, p.en)) + '</span></nav>' +
      banner(esc(A(p.ar, p.en)), esc(A(p.dar, p.den)), 'route', null, '<div class="xbanp"><b>' + N(v + '%') + '</b>' + bar(v) + '<small>' + N(st.length) + ' ' + esc(A('خطوات', 'steps')) + '</small>' + favBtn('p:' + id) + '</div>') +
      '<ol class="xsteps">' + st.map(stepRow).join('') + '</ol>';
  }

  /* ========== LECTURERS ========== */
  function personCard(p) {
    var cs = p.courses.map(function (id) { return COURSE[id]; }).filter(function (x) { return x && x.live; });
    return '<article class="xperson">' + favBtn('t:' + p.id, true) + personAv(p, 'lg') + '<h3><a href="#lecturer-' + p.id + '">' + esc(A(p.ar, p.en)) + '</a></h3><p>' + esc(A(p.rar, p.ren)) + '</p>' +
      '<div class="xtags">' + p.sp.map(function (s) { return '<span>' + E(s) + '</span>'; }).join('') + '</div><div class="xpst"><span>' + ic('layers') + N(cs.length) + ' ' + esc(A('كورسات', 'courses')) + '</span></div>' +
      '<div class="xact"><a class="xbtn pri" href="#lecturer-' + p.id + '">' + ic('users') + '<span>' + esc(A('الملف', 'Profile')) + '</span></a><a class="xbtn ghost" href="#lecturer-' + p.id + '">' + ic('layers') + '<span>' + esc(A('الكورسات', 'Courses')) + '</span></a></div></article>';
  }
  function vLecturers() {
    return banner(esc(A('المحاضرون', 'Lecturers')), esc(A('الأطباء الذين يكتبون ويشرحون محتوى المنصة.', 'The doctors who write and teach the platform’s content.')), 'users', 'img/ui/hero-anatomy.webp') +
      '<div class="xgrid c4">' + PEOPLE.map(personCard).join('') +
      '<article class="xperson join">' + '<span class="xav lg t-gold"><b>' + ic('plus') + '</b></span><h3>' + esc(A('انضم كمحاضر', 'Teach on ' + NAME)) + '</h3><p>' + esc(A('طبيب أو أستاذ وتريد تقديم كورس أو جلسة؟ تواصل معنا.', 'A doctor or teacher who wants to give a course or session? Contact us.')) + '</p>' +
      '<div class="xact"><a class="xbtn pri" target="_blank" rel="noopener" href="' + wa(OWNER_WA, 'أرغب في الانضمام كمحاضر في منصة اشرح لي. التخصص: ') + '">' + ic('wa') + '<span>' + esc(A('تواصل', 'Contact')) + '</span></a></div></article></div>';
  }
  function vLecturer(id) {
    var p = PERSON[id]; if (!p) return null; addHist('t:' + id);
    var cs = p.courses.map(function (k) { return COURSE[k]; }).filter(function (x) { return x && x.live; });
    var h = '<nav class="xcrumb"><a href="#lecturers">' + esc(A('المحاضرون', 'Lecturers')) + '</a>' + ic('chev', 'fl') + '<span>' + esc(A(p.ar, p.en)) + '</span></nav>';
    h += '<section class="xprof">' + personAv(p, 'xl') + '<div><h1 tabindex="-1">' + esc(A(p.ar, p.en)) + '</h1><p>' + esc(A(p.rar, p.ren)) + '</p><div class="xtags lt">' + p.sp.map(function (s) { return '<span>' + E(s) + '</span>'; }).join('') + '</div></div>' +
      '<div class="xprofa">' + favBtn('t:' + id) + '<button type="button" class="xfav" data-share="lecturer-' + id + '" aria-label="share">' + ic('share') + '</button></div></section>';
    h += '<div class="xcols"><div class="xmain"><section class="xsec"><header class="xsh"><h2>' + ic('layers') + esc(A('الكورسات', 'Courses')) + ' (' + N(cs.length) + ')</h2></header><div class="xgrid c3">' + cs.map(function (x) { return courseCard(x); }).join('') + '</div></section></div>' +
      '<aside class="xside"><section class="xbox"><h2>' + ic('info') + esc(A('معلومات', 'About')) + '</h2><ul class="xkv"><li><span>' + esc(A('الكورسات', 'Courses')) + '</span><b>' + N(cs.length) + '</b></li><li><span>' + esc(A('الدروس', 'Lessons')) + '</span><b>' + N(cs.reduce(function (a, x) { return a + x.ct.n.topics; }, 0)) + '</b></li>' +
      '<li><span>' + esc(A('الأسئلة', 'Questions')) + '</span><b>' + N(cs.reduce(function (a, x) { return a + x.ct.n.qs; }, 0)) + '</b></li></ul></section>' +
      (p.wa ? '<section class="xbox"><h2>' + ic('chat') + esc(A('التواصل', 'Contact')) + '</h2><a class="xpr" target="_blank" rel="noopener" href="' + wa(p.wa) + '"><span class="xav sm t-green"><b>' + ic('wa') + '</b></span><span><b>WhatsApp</b><small dir="ltr">' + esc(p.tel) + '</small></span></a>' +
        '<a class="xpr" href="tel:' + esc(p.tel) + '"><span class="xav sm t-blue"><b>' + ic('phone') + '</b></span><span><b>' + esc(A('اتصال', 'Call')) + '</b><small dir="ltr">' + esc(p.tel) + '</small></span></a></section>' : '') + '</aside></div>';
    return h;
  }

  /* ========== COMMUNITY ========== */
  function vCommunity() {
    var rooms = [['Surgery', 'surgery', 'الجراحة: الحالات والامتحانات'], ['Obstetrics', 'obstetrics', 'التوليد: المحطات والأسئلة'], ['Pediatrics', 'pediatrics', 'طب الأطفال: OSCE والمراجعة'], ['Sudan Medical Council', 'local', 'امتحان المجلس الطبي السوداني'], ['USMLE · PLAB', 'special', 'الاختبارات الخاصة'], ['Basic Sciences', 'basics', 'العلوم الأساسية']];
    var h = banner(esc(A('مجتمع الطلبة', 'Student Community')), esc(A('مساحة لطلبة الطب في السودان: ناقش، اسأل، شارك المعرفة، واطلب ما تحتاجه.', 'A space for medical students in Sudan: discuss, ask, share knowledge and request what you need.')), 'group', 'img/ui/library.webp');
    h += '<div class="xcols"><div class="xmain"><section class="xopen"><span>' + ic('sparkle') + '</span><div><b>' + esc(A('المجتمع قيد الافتتاح', 'The community is opening soon')) + '</b><p>' + esc(A('غرف النقاش والأسئلة ومجموعات الدراسة تُفتح على مراحل مع مشرفين، حتى يبقى المجتمع مفيدًا ومحترمًا. يمكنك الآن طلب كورس أو محاضر، أو التواصل مع الدعم.', 'Discussion rooms, Q&A and study groups open in stages with moderators, so the community stays useful and respectful. You can already request a course or a lecturer, or contact support.')) + '</p></div>' +
      '<button type="button" class="xbtn pri" data-notify="community">' + ic('bell') + '<span>' + esc(LS.get('ntf', {}).community ? A('سننبهك عند الافتتاح', 'We’ll notify you') : A('نبّهني عند الافتتاح', 'Notify me')) + '</span></button></section>';
    h += '<section class="xsec"><header class="xsh"><h2>' + esc(A('ما يقدّمه المجتمع', 'What the community offers')) + '</h2></header><div class="xfeat">' +
      [['chat', A('صفحات الدردشة', 'Discussions'), A('نقاشات حسب الموضوع', 'Topic discussions'), 0], ['group', A('غرف النقاش', 'Study rooms'), A('مجموعات طلابية لكل مادة', 'Student groups per subject'), 0], ['qb', A('الأسئلة والاستفسارات', 'Q&A'), A('اسأل ويجيب الزملاء والمحاضرون', 'Ask; peers and lecturers answer'), 0],
        ['slides', A('غرف تجهيز الكورسات', 'Course rooms'), A('للمحاضرين أثناء إعداد كورساتهم', 'For lecturers preparing courses'), 0], ['users', A('طلب محاضر', 'Request a lecturer'), A('اقترح طبيبًا لتقديم كورس', 'Suggest a doctor to teach'), 1], ['layers', A('طلب كورس', 'Request a course'), A('مادة أو امتحان غير متوفر', 'A subject or exam not yet here'), 1], ['help', A('الدعم والمساعدة', 'Support'), A('مشكلة في الاشتراك أو التطبيق', 'Subscription or app problems'), 1]].map(function (r) {
          var on = r[3], txt = { 'طلب محاضر': 'طلب محاضر على منصة اشرح لي: ', 'طلب كورس': 'طلب كورس على منصة اشرح لي: ', 'الدعم والمساعدة': 'أحتاج مساعدة في منصة اشرح لي: ' }[r[1]] || { 'Request a lecturer': 'طلب محاضر على منصة اشرح لي: ', 'Request a course': 'طلب كورس على منصة اشرح لي: ', 'Support': 'أحتاج مساعدة في منصة اشرح لي: ' }[r[1]];
          return on ? '<a class="xft on" target="_blank" rel="noopener" href="' + wa(OWNER_WA, txt) + '">' + ic(r[0]) + '<b>' + esc(r[1]) + '</b><small>' + esc(r[2]) + '</small><em>' + esc(A('متاح الآن', 'Available now')) + '</em></a>' :
            '<div class="xft">' + ic(r[0]) + '<b>' + esc(r[1]) + '</b><small>' + esc(r[2]) + '</small><em class="s">' + esc(A('قريبًا', 'Coming soon')) + '</em></div>'; }).join('') + '</div></section>';
    h += '<section class="xsec"><header class="xsh"><h2>' + esc(A('غرف النقاش المخططة', 'Planned discussion rooms')) + '</h2></header><div class="xrooms">' + rooms.map(function (r) {
      return '<div class="xroom">' + ic(r[1] === 'local' ? 's_sudan' : r[1] === 'special' ? 's_world' : r[1] === 'basics' ? 'layers' : 'group') + '<span><b lang="en">' + esc(r[0]) + '</b><small>' + esc(r[2]) + '</small></span>' + soon() + '</div>'; }).join('') + '</div></section></div>';
    h += '<aside class="xside">' + eventsBox(3) + '<section class="xbox"><h2>' + ic('shield') + esc(A('قواعد المجتمع', 'Community rules')) + '</h2><ul class="xrules">' +
      [A('الاحترام أولًا: لا إساءة ولا تنمّر.', 'Respect first: no insults or bullying.'), A('لا مشاركة لصفحات الكتب أو الأسئلة المدفوعة خارج المنصة.', 'Do not share paid book pages or questions outside the platform.'), A('لا نصائح علاجية لمرضى حقيقيين.', 'No treatment advice for real patients.'), A('اكتب سؤالك بوضوح واذكر المادة والموضوع.', 'Write your question clearly with the subject and topic.'), A('أبلغ عن أي مخالفة ليراجعها المشرفون.', 'Report any violation for the moderators.')].map(function (r) { return '<li>' + ic('check') + esc(r) + '</li>'; }).join('') + '</ul></section></aside></div>';
    return h;
  }

  /* ========== MY LIBRARY ========== */
  var LIB = { ty: 'all', q: '', view: LS.get('lview', 'grid') };
  function libItems() {
    var a = [];
    liveCourses().forEach(function (x) {
      a.push({ k: 'book:' + x.id, ty: 'book', t: x.b.app, sub: A('الكتاب كاملًا', 'The whole book'), img: x.b.cover, n: x.ct.n.topics + ' ' + A('درس', 'lessons'), act: x.id + '.book' });
      a.push({ k: 'rr:' + x.id, ty: 'rr', t: 'Rapid Review · ' + x.title, sub: A('مراجعة سريعة لكل موضوع', 'Recap of every topic'), img: x.img, act: x.id + '.rr' });
      a.push({ k: 'qb:' + x.id, ty: 'qbank', t: 'QBank · ' + x.title, sub: A('أسئلة مع الشرح', 'Questions with explanations'), img: x.chs[1] ? x.chs[1].img : x.img, n: x.ct.n.qs + ' ' + A('سؤال', 'questions'), act: x.id + '.qbank' });
      a.push({ k: 'fc:' + x.id, ty: 'cards', t: 'Flashcards · ' + x.title, sub: A('بطاقات المراجعة', 'Review cards'), img: x.chs[2] ? x.chs[2].img : x.img, n: x.ct.n.cards + ' ' + A('بطاقة', 'cards'), act: x.id + '.cards' });
      var oc = osceCh(x.id); if (oc) a.push({ k: 'os:' + x.id, ty: 'osce', t: 'OSCE · ' + x.title, sub: oc.title, img: oc.img || x.img, n: oc.topics.length + ' ' + A('محطات', 'stations'), act: x.id + '.osce' });
    });
    return a;
  }
  function libCard(it) {
    var inC = colls().filter(function (cl) { return (cl.items || []).indexOf(it.k) >= 0; }).length;
    return '<article class="xlib"><button type="button" class="xlibi" data-tool="' + it.act + '" style="--ci:url(' + U(it.img) + ')"><span class="xltg t-' + it.ty + '">' + ic(typeIc(it.ty)) + esc(typeName(it.ty)) + '</span></button>' +
      '<div class="xlibb"><b lang="en">' + esc(it.t) + '</b><small>' + (lang() === 'ar' || /[\u0600-\u06ff]/.test(it.sub) ? esc(it.sub) : '<span lang="en">' + esc(it.sub) + '</span>') + '</small>' + (it.n ? '<em>' + esc(it.n) + '</em>' : '') + '</div>' +
      '<div class="xlibf">' + favBtn('k:' + it.k, true) + '<button type="button" class="xfav sm" data-addc="' + esc(it.k) + '" aria-label="' + esc(A('أضف إلى مجموعة', 'Add to collection')) + '"' + (inC ? ' aria-pressed="true"' : '') + '>' + ic('folder') + '</button></div></article>';
  }
  function vLibrary() {
    var all = libItems(), tabs = [['all', A('الكل', 'All Files'), 'grid'], ['book', A('الكتب', 'Books'), 'open'], ['rr', 'Rapid Review', 'bolt'], ['qbank', A('بنوك الأسئلة', 'QBanks'), 'qb'], ['cards', A('البطاقات', 'Flashcards'), 'cards'], ['osce', 'OSCE', 'steth'], ['slides', A('العروض التقديمية', 'Slides'), 'slides'], ['sum', A('الملخصات', 'Summaries'), 'file']];
    var h = banner(esc(A('مكتبتي', 'My Library')), esc(A('كل كتبك وأدوات مذاكرتك في مكان واحد، وتعمل دون إنترنت بعد فتحها.', 'All your books and study tools in one place, working offline once opened.')), 'bookmark', 'img/ui/library.webp');
    h += '<section class="xltabs">' + tabs.map(function (tb) { var n = tb[0] === 'all' ? all.length : all.filter(function (i) { return i.ty === tb[0]; }).length;
      return '<button type="button" class="xltab" data-lty="' + tb[0] + '" aria-pressed="' + (LIB.ty === tb[0]) + '">' + ic(tb[2]) + '<b>' + esc(tb[1]) + '</b><small>' + N(n) + '</small></button>'; }).join('') + '</section>';
    h += '<div class="xcols"><div class="xmain"><div class="xtool"><label class="xfield">' + ic('search') + '<input type="search" id="xlq" placeholder="' + esc(A('ابحث في مكتبتي…', 'Search my library…')) + '" value="' + esc(LIB.q) + '"></label></div><div id="xlres"></div>' +
      '<section class="xsec"><header class="xsh"><h2>' + ic('clock') + esc(A('فتحتها مؤخرًا', 'Recently opened')) + '</h2><a class="xmore" href="#history">' + esc(A('سجل التعلم', 'History')) + ic('chev', 'fl') + '</a></header>' + histList(6) + '</section></div>';
    h += '<aside class="xside"><section class="xbox" id="xstore"><h2>' + ic('offline') + esc(A('التخزين على الجهاز', 'Storage on this device')) + '</h2><p class="xnone">' + esc(A('جارٍ الحساب…', 'Measuring…')) + '</p></section>' +
      '<section class="xbox"><h2>' + ic('folder') + esc(A('مجموعاتي', 'My collections')) + '</h2>' + collList() + '<button type="button" class="xlink add" data-newc>' + ic('plus') + esc(A('إنشاء مجموعة جديدة', 'New collection')) + '</button></section>' +
      '<a class="xbox xpr" href="#favorites"><span class="xav sm t-rose"><b>' + ic('heart') + '</b></span><span><b>' + esc(A('المفضلة', 'Favourites')) + '</b><small>' + N(Object.keys(favs()).length) + ' ' + esc(A('عنصر', 'items')) + '</small></span>' + ic('chev', 'fl') + '</a></aside></div>';
    return h;
  }
  function collList() {
    var cl = colls();
    return cl.length ? '<ul class="xcoll">' + cl.map(function (q, i) { return '<li><button type="button" data-openc="' + i + '">' + ic('folder') + '<span>' + esc(q.n) + '</span><em>' + N((q.items || []).length) + '</em></button><button type="button" class="xdel" data-delc="' + i + '" aria-label="' + esc(A('حذف', 'Delete')) + '">' + ic('x') + '</button></li>'; }).join('') + '</ul>' :
      '<p class="xnone">' + esc(A('اجمع ما تحتاجه لامتحان معيّن في مجموعة: مثلًا «مراجعة النهائي» أو «OSCE».', 'Group what you need for an exam into a collection, e.g. “Final review” or “OSCE”.')) + '</p>';
  }
  function fillLibrary() {
    var out = document.getElementById('xlres'); if (!out) return;
    var q = c.norm(LIB.q), all = libItems(), r = all.filter(function (i) { return (LIB.ty === 'all' || i.ty === LIB.ty) && (!q || q.split(' ').every(function (w) { return c.norm(i.t + ' ' + i.sub).indexOf(w) >= 0; })); });
    if (LIB.coll != null) { var cl = colls()[LIB.coll]; if (cl) r = all.filter(function (i) { return (cl.items || []).indexOf(i.k) >= 0; }); }
    var head = LIB.coll != null && colls()[LIB.coll] ? '<p class="xcount">' + ic('folder') + esc(colls()[LIB.coll].n) + ' <button type="button" class="xlink" data-openc="-1">' + esc(A('عرض الكل', 'Show all')) + '</button></p>' : '';
    out.innerHTML = head + (r.length ? '<div class="xgrid c3 xlibg">' + r.map(libCard).join('') + '</div>' :
      empty(LIB.ty === 'slides' ? 'slides' : LIB.ty === 'sum' ? 'file' : 'folder', LIB.ty === 'slides' || LIB.ty === 'sum' ? A('تُضاف قريبًا', 'Coming soon') : A('لا شيء هنا بعد', 'Nothing here yet'), LIB.ty === 'slides' ? A('عروض المحاضرات تُضاف مع الفيديوهات، وتُعرض داخل التطبيق دون تنزيل.', 'Lecture slides are added with the videos and shown inside the app, without downloading.') : LIB.ty === 'sum' ? A('الملخصات والشيتات تُضاف تباعًا.', 'Summaries and sheets are being added.') : ''));
  }
  function histList(n) {
    var h = hist().slice(0, n || 200); if (!h.length) return '<p class="xnone">' + esc(A('ما تفتحه من كورسات ودروس ومسارات يظهر هنا.', 'Courses, lessons and paths you open appear here.')) + '</p>';
    return '<ul class="xhist">' + h.map(histRow).filter(Boolean).join('') + '</ul>';
  }
  function histRow(e) {
    var k = e.k, m, a, t1, t2, ico, href;
    if ((m = k.match(/^l:([^.]+)\.(.+)$/))) { a = topicOf(m[1], m[2]); if (!a) return ''; t1 = E(a.t.no + ' ' + a.t.title); t2 = E(COURSE[m[1]].b.app); ico = isDone(m[1], m[2]) ? 'checkc' : 'open'; href = '#lesson-' + m[1] + '.' + m[2]; }
    else if ((m = k.match(/^c:(.+)$/))) { a = COURSE[m[1]]; if (!a) return ''; t1 = E(a.b.app || a.title + ' ' + a.series); t2 = esc(A('كورس', 'Course')); ico = 'layers'; href = '#course-' + m[1]; }
    else if ((m = k.match(/^p:(.+)$/))) { a = PATH[m[1]]; if (!a) return ''; t1 = esc(A(a.ar, a.en)); t2 = esc(A('مسار تعليمي', 'Learning path')); ico = 'route'; href = '#path-' + m[1]; }
    else if ((m = k.match(/^t:(.+)$/))) { a = PERSON[m[1]]; if (!a) return ''; t1 = esc(A(a.ar, a.en)); t2 = esc(A('محاضر', 'Lecturer')); ico = 'users'; href = '#lecturer-' + m[1]; }
    else if ((m = k.match(/^b:(.+)$/))) { a = c.BOOK[m[1]]; if (!a) return ''; t1 = E(a.app || a.title); t2 = esc(A('الكتاب', 'Book')); ico = 'book'; href = '#read-' + m[1]; }
    else return '';
    return '<li><a href="' + href + '">' + ic(ico) + '<span><b>' + t1 + '</b><small>' + t2 + '</small></span><em>' + esc(c.ago(e.t)) + '</em></a></li>';
  }
  function storage() {
    var box = document.getElementById('xstore'); if (!box) return;
    var p = box.querySelector('p');
    if (!navigator.storage || !navigator.storage.estimate) { p.textContent = A('المتصفح لا يعرض المساحة المستخدمة.', 'This browser does not report storage use.'); return; }
    navigator.storage.estimate().then(function (e) {
      var mb = function (b) { return b > 1073741824 ? (b / 1073741824).toFixed(1) + ' GB' : Math.max(1, Math.round(b / 1048576)) + ' MB'; }, v = e.quota ? Math.max(1, Math.round(e.usage / e.quota * 100)) : 0;
      p.outerHTML = '<p class="xstorage"><span>' + esc(A('المستخدم', 'Used')) + ' <b dir="ltr">' + mb(e.usage || 0) + '</b></span><span>' + esc(A('المتاح', 'Available')) + ' <b dir="ltr">' + mb(e.quota || 0) + '</b></span></p>' + bar(Math.min(100, v)) +
        '<p class="xnone">' + esc(A('الكتب والدروس التي فتحتها محفوظة هنا وتعمل دون إنترنت. لا تُنزَّل كملفات.', 'Books and lessons you opened are kept here and work offline. They are not downloaded as files.')) + '</p>' +
        (navigator.storage.persist ? '<button type="button" class="xbtn ghost wide" data-persist>' + ic('shield') + '<span>' + esc(A('احمِ المحتوى المحفوظ من الحذف التلقائي', 'Protect saved content from automatic clearing')) + '</span></button>' : '');
    }).catch(function () {});
  }

  /* ========== FAVOURITES, HISTORY, ACHIEVEMENTS, CERTIFICATE ========== */
  function vFavorites() {
    var f = favs(), keys = Object.keys(f).sort(function (a, b) { return f[b] - f[a]; });
    var cs = keys.filter(function (k) { return /^c:/.test(k) && COURSE[k.slice(2)]; }).map(function (k) { return COURSE[k.slice(2)]; });
    var rest = keys.filter(function (k) { return !/^c:/.test(k); }).map(function (k) { var m = k.match(/^k:(.+)$/); if (m) { var it = libItems().filter(function (i) { return i.k === m[1]; })[0]; return it ? '<li><button type="button" data-tool="' + it.act + '">' + ic(typeIc(it.ty)) + '<span><b lang="en">' + esc(it.t) + '</b><small>' + esc(typeName(it.ty)) + '</small></span></button></li>' : ''; }
      return histRow({ k: k, t: f[k] }); }).filter(Boolean);
    var h = banner(esc(A('المفضلة', 'Favourites')), esc(A('الكورسات والدروس والمسارات والمحاضرون الذين حفظتهم.', 'Courses, lessons, paths and lecturers you saved.')), 'heart');
    if (!keys.length) return h + empty('heart', A('لا توجد عناصر في المفضلة', 'No favourites yet'), A('اضغط ♡ على أي كورس أو درس أو مسار ليظهر هنا.', 'Tap ♡ on any course, lesson or path to keep it here.'), '<a class="xbtn pri" href="#courses">' + ic('layers') + '<span>' + esc(A('تصفح الكورسات', 'Browse courses')) + '</span></a>');
    if (cs.length) h += '<section class="xsec"><header class="xsh"><h2>' + esc(A('الكورسات', 'Courses')) + '</h2></header><div class="xgrid c3">' + cs.map(function (x) { return courseCard(x); }).join('') + '</div></section>';
    if (rest.length) h += '<section class="xsec"><header class="xsh"><h2>' + esc(A('عناصر أخرى', 'Other items')) + '</h2></header><ul class="xhist">' + rest.join('') + '</ul></section>';
    return h;
  }
  function vHistory() {
    var h = hist(), groups = {}, order = [];
    h.forEach(function (e) { var d = new Date(e.t), k = d.toDateString(); if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(e); });
    var out = banner(esc(A('سجل التعلم', 'Learning history')), esc(A('ما فتحته على هذا الجهاز، يومًا بيوم.', 'What you opened on this device, day by day.')), 'clock');
    if (!h.length) return out + empty('clock', A('السجل فارغ', 'No history yet'), A('ابدأ درسًا أو افتح كورسًا ليظهر هنا.', 'Start a lesson or open a course to see it here.'));
    out += order.map(function (k) { var d = new Date(k); return '<section class="xsec"><header class="xsh"><h2>' + esc(fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' })) + '</h2></header><ul class="xhist">' + groups[k].map(histRow).filter(Boolean).join('') + '</ul></section>'; }).join('');
    return out + '<button type="button" class="xbtn ghost" data-clrhist>' + ic('x') + '<span>' + esc(A('مسح السجل', 'Clear history')) + '</span></button>';
  }
  function totals() {
    var t = { r: 0, p: 0, m: 0, qa: 0, c: 0, w: 0, k: 0, st: 0, td: 0 };
    liveCourses().forEach(function (x) { var s = c.stats(x.id); if (!s) return; s = s.s; t.r += s.pages.read; t.p += s.pages.total; t.m += s.pages.mastered; t.qa += s.q.answered; t.c += s.q.correct; t.w += s.q.wrong; t.k += s.cards.known; t.st = Math.max(t.st, s.streak); t.td += s.topics.done; });
    t.ld = Object.keys(done()).length; return t;
  }
  var BADGES = [
    ['first', 'sparkle', 'الخطوة الأولى', 'First step', 'افتح أول درس', 'Open your first lesson', function (t) { return Math.min(1, hist().length); }],
    ['l10', 'checkc', 'عشرة دروس', 'Ten lessons', 'أنهِ 10 دروس', 'Finish 10 lessons', function (t) { return t.ld / 10; }],
    ['p100', 'open', 'قارئ', 'Reader', 'اقرأ 100 صفحة', 'Read 100 pages', function (t) { return t.r / 100; }],
    ['p500', 'book', 'قارئ نهم', 'Avid reader', 'اقرأ 500 صفحة', 'Read 500 pages', function (t) { return t.r / 500; }],
    ['q100', 'qb', 'مئة سؤال', 'A hundred questions', 'أجب عن 100 سؤال', 'Answer 100 questions', function (t) { return t.qa / 100; }],
    ['q1000', 'target', 'ألف سؤال', 'A thousand questions', 'أجب عن 1000 سؤال', 'Answer 1,000 questions', function (t) { return t.qa / 1000; }],
    ['acc', 'medal', 'دقة عالية', 'Sharp', 'دقة 75% بعد 100 سؤال', '75% accuracy after 100 questions', function (t) { return t.qa >= 100 ? (t.c / Math.max(1, t.c + t.w)) / .75 : t.qa / 100 * .99; }],
    ['k300', 'cards', 'ذاكرة قوية', 'Strong memory', 'اعرف 300 بطاقة', 'Know 300 cards', function (t) { return t.k / 300; }],
    ['s7', 'flame', 'أسبوع متواصل', 'Seven-day streak', '7 أيام متتالية', '7 days in a row', function (t) { return t.st / 7; }],
    ['s30', 'flame', 'شهر متواصل', 'Thirty-day streak', '30 يومًا متتالية', '30 days in a row', function (t) { return t.st / 30; }],
    ['m50', 'star', 'إتقان', 'Mastery', 'أتقن 50 صفحة', 'Master 50 pages', function (t) { return t.m / 50; }],
    ['course', 'cert', 'كورس كامل', 'Course complete', 'أنهِ كورسًا كاملًا', 'Finish a whole course', function () { return Math.max.apply(null, liveCourses().map(function (x) { return coursePct(x.id); }).concat([0])) / 100; }]
  ];
  function vAchievements() {
    var t = totals(), pts = t.r + t.qa + Math.round(t.k / 2) + t.ld * 5, lvl = Math.floor(Math.sqrt(pts / 25)) + 1, cur = 25 * (lvl - 1) * (lvl - 1), nxt = 25 * lvl * lvl, lp = Math.round((pts - cur) / (nxt - cur) * 100);
    var got = BADGES.filter(function (b) { return b[6](t) >= 1; }).length;
    var h = banner(esc(A('الإنجازات', 'Achievements')), esc(A('نقاطك وشاراتك وشهاداتك من دراستك الفعلية في الكتب.', 'Your points, badges and certificates from your real study in the books.')), 'trophy');
    h += '<section class="xlvl"><div class="xlvn"><small>' + esc(A('المستوى', 'Level')) + '</small><b>' + N(lvl) + '</b></div><div class="xlvb"><b>' + N(pts) + ' ' + esc(A('نقطة', 'points')) + '</b>' + bar(lp, 'gold') + '<small>' + N(nxt - pts) + ' ' + esc(A('نقطة للمستوى التالي', 'points to the next level')) + '</small></div>' +
      '<div class="xlvs">' + [['flame', t.st, A('أيام متتالية', 'day streak')], ['medal', got + '/' + BADGES.length, A('شارات', 'badges')], ['checkc', t.ld, A('دروس منتهية', 'lessons done')]].map(function (r) { return '<span>' + ic(r[0]) + '<b>' + N(r[1]) + '</b><small>' + esc(r[2]) + '</small></span>'; }).join('') + '</div></section>';
    h += '<p class="xnote">' + ic('info') + '<span>' + esc(A('النقاط: صفحة مقروءة = 1، سؤال مُجاب = 1، بطاقتان معروفتان = 1، درس منتهٍ = 5. تُحدَّث الأرقام عند فتح كل كتاب داخل المنصة.', 'Points: page read = 1, question answered = 1, two known cards = 1, lesson completed = 5. Figures update when each book is opened inside the platform.')) + '</span></p>';
    h += '<section class="xsec"><header class="xsh"><h2>' + ic('medal') + esc(A('الشارات', 'Badges')) + '</h2></header><div class="xbadges">' + BADGES.map(function (b) {
      var v = Math.min(1, b[6](t) || 0), on = v >= 1;
      return '<div class="xbadge' + (on ? ' on' : '') + '"><span>' + ic(on ? b[1] : 'lock') + '</span><b>' + esc(A(b[2], b[3])) + '</b><small>' + esc(A(b[4], b[5])) + '</small>' + (on ? '' : bar(Math.round(v * 100))) + '</div>'; }).join('') + '</div></section>';
    h += '<section class="xsec"><header class="xsh"><h2>' + ic('cert') + esc(A('الشهادات', 'Certificates')) + '</h2></header><div class="xcerts">' + liveCourses().map(function (x) {
      var p = coursePct(x.id);
      return '<div class="xcertc' + (p >= 100 ? ' on' : '') + '">' + ic(p >= 100 ? 'cert' : 'lock') + '<span><b>' + E(x.b.app) + '</b><small>' + (p >= 100 ? esc(A('مكتملة', 'Completed')) : N(p + '%') + ' ' + esc(A('من الكورس', 'of the course'))) + '</small>' + (p < 100 ? bar(p) : '') + '</span>' +
        (p >= 100 ? '<a class="xbtn gold sm" href="#cert-' + x.id + '">' + esc(A('عرض', 'View')) + '</a>' : '<a class="xbtn ghost sm" href="#course-' + x.id + '">' + esc(A('تابع', 'Continue')) + '</a>') + '</div>'; }).join('') + '</div></section>';
    return h;
  }
  function vCert(id) {
    var x = COURSE[id]; if (!x || !x.live) return null; var p = coursePct(id), nm = c.cleanName(LS.get('name', ''));
    if (p < 100) return banner(esc(A('شهادة الإتمام', 'Certificate')), esc(A('تُمنح عند إنهاء كل دروس الكورس.', 'Awarded when every lesson of the course is finished.')), 'cert') + empty('lock', A('لم يكتمل الكورس بعد', 'The course is not complete yet'), N(p + '%') && (p + '% ' + A('مكتمل', 'complete')), '<a class="xbtn pri" href="#course-' + id + '">' + esc(A('تابع الكورس', 'Continue the course')) + '</a>');
    var dt = Math.max.apply(null, lessonsOf(id).map(function (l) { return done()[id + '.' + l.t.id] || 0; }).concat([Date.now()]));
    return '<div class="xcertp"><div class="xcert" id="xcert"><img src="img/ui/ishrah.svg" alt="" class="xcl"><small class="xcbr">' + NAME + ' · Certificate of Completion</small><h1 tabindex="-1">' + esc(A('شهادة إتمام', 'Certificate of Completion')) + '</h1>' +
      '<p>' + esc(A('تشهد منصة اشرح لي بأن', 'Ishrah Li certifies that')) + '</p><h2>' + (nm ? '<bdi>' + esc((lang() === 'ar' ? 'د. ' : 'Dr. ') + nm) + '</bdi>' : esc(A('الطالب', 'the student'))) + '</h2><p>' + esc(A('أتمّ دراسة كورس', 'has completed the course')) + '</p><h3>' + E(x.b.app) + '</h3>' +
      '<p class="xcm">' + N(x.ct.n.topics) + ' ' + esc(A('درسًا في', 'lessons in')) + ' ' + N(x.ct.n.ch) + ' ' + esc(A('فصلًا', 'chapters')) + ' · ' + esc(fmtDate(dt, { day: 'numeric', month: 'long', year: 'numeric' })) + '</p>' +
      '<div class="xcs">' + x.people.slice(0, 2).map(function (pid) { return '<span><i></i>' + esc(A(PERSON[pid].ar, PERSON[pid].en)) + '</span>'; }).join('') + '</div>' +
      (nm ? '' : '<p class="xnone">' + esc(A('أضف اسمك في الإعدادات ليظهر في الشهادة.', 'Add your name in Settings to show it on the certificate.')) + '</p>') + '</div>' +
      '<div class="xact"><button type="button" class="xbtn pri" data-print>' + ic('file') + '<span>' + esc(A('طباعة', 'Print')) + '</span></button><a class="xbtn ghost" href="#achievements">' + esc(A('الإنجازات', 'Achievements')) + '</a></div></div>';
  }

  /* ========== ABOUT ========== */
  function vAbout() {
    var live = liveCourses(), tot = { l: 0, q: 0, k: 0 }; live.forEach(function (x) { tot.l += x.ct.n.topics; tot.q += x.ct.n.qs; tot.k += x.ct.n.cards; });
    var h = banner(esc(A('عن المنصة', 'About the platform')), esc(A('تعرّف على اشرح لي: رؤيتنا ورسالتنا وما نقدّمه لطلبة الطب في السودان.', 'Meet Ishrah Li: our vision, mission and what we offer medical students in Sudan.')), 'info', 'img/ui/library.webp');
    h += '<section class="xabout"><div><h2>' + esc(A('ما هي منصة اشرح لي؟', 'What is Ishrah Li?')) + '</h2><p>' + esc(A('منصة تعليمية سودانية متكاملة صُممت خصيصًا لطلبة كليات الطب. تجمع كتب سلسلة Master Review بأدواتها الكاملة: القراءة مع التظليل والملاحظات، بنوك الأسئلة، البطاقات، المراجعة السريعة ومحطات OSCE، وتضيف إليها الكورسات والمسارات والمحاضرات والفعاليات ومجتمع الطلبة.', 'A complete Sudanese learning platform made for medical students. It brings together the Master Review books with all their tools (reading with highlights and notes, question banks, flashcards, rapid review and OSCE stations) and adds courses, paths, lectures, events and a student community.')) + '</p></div>' +
      '<img src="img/ui/ishrah.svg" alt="" class="xabl"></section>';
    h += '<div class="xvmv">' + [['target', A('رؤيتنا', 'Our vision'), A('أن نكون المنصة التعليمية الرائدة لطلبة الطب في السودان والمنطقة، ونساهم في إعداد أطباء أكفاء يخدمون مجتمعهم.', 'To be the leading learning platform for medical students in Sudan and the region, helping prepare competent doctors who serve their community.')],
      ['send', A('رسالتنا', 'Our mission'), A('تقديم محتوى طبي موثوق وشامل وسهل الوصول، يجمع بين الأساسيات النظرية والتطبيق السريري، ويتبع الإرشادات الحديثة مع مراعاة الممارسة المحلية.', 'To offer reliable, complete and accessible medical content that joins theory to clinical practice, follows current guidelines and respects local practice.')],
      ['shield', A('قيمنا', 'Our values'), A('الجودة والمصداقية · دعم الطلبة وتكافؤ الفرص · الخصوصية: بياناتك على جهازك · خدمة المجتمع الطبي في السودان', 'Quality and accuracy · Supporting students and equal opportunity · Privacy: your data stays on your device · Serving the medical community in Sudan')]].map(function (r) {
        return '<section class="xbox"><h2>' + ic(r[0]) + esc(r[1]) + '</h2><p>' + esc(r[2]) + '</p></section>'; }).join('') + '</div>';
    h += '<section class="xsec"><header class="xsh"><h2>' + esc(A('أبرز ما تقدّمه المنصة', 'What the platform offers')) + '</h2></header><div class="xfeat">' +
      [['layers', A('كورسات شاملة', 'Complete courses')], ['open', A('كتب تفاعلية', 'Interactive books')], ['qb', A('بنوك أسئلة', 'Question banks')], ['cards', A('بطاقات مراجعة', 'Flashcards')], ['route', A('مسارات تعليمية', 'Learning paths')], ['video', A('محاضرات فيديو', 'Video lectures')], ['cal', A('فعاليات وورش', 'Events & workshops')], ['cert', A('شهادات إتمام', 'Certificates')], ['offline', A('يعمل دون إنترنت', 'Works offline')], ['cloud', A('مزامنة بين أجهزتك', 'Sync between devices')]].map(function (r) {
        return '<div class="xft on">' + ic(r[0]) + '<b>' + esc(r[1]) + '</b></div>'; }).join('') + '</div></section>';
    h += '<div class="xcols"><div class="xmain"><section class="xbox"><h2>' + ic('users') + esc(A('لمن تناسب المنصة؟', 'Who is it for?')) + '</h2><ul class="xrules">' +
      [A('طلبة كليات الطب في السودان، من العلوم الأساسية حتى سنة التخرج', 'Medical students in Sudan, from basic sciences to the final year'), A('أطباء الامتياز وحديثو التخرج', 'House officers and new graduates'), A('المتقدمون لامتحان المجلس الطبي السوداني', 'Candidates for the Sudan Medical Council exam'), A('المستعدون للاختبارات الخاصة: USMLE وPLAB وغيرها', 'Those preparing for USMLE, PLAB and similar exams')].map(function (r) { return '<li>' + ic('check') + esc(r) + '</li>'; }).join('') + '</ul></section>' +
      '<section class="xbox"><h2>' + ic('help') + esc(A('الأسئلة الشائعة', 'Frequently asked questions')) + '</h2>' + [
        [A('هل يعمل التطبيق دون إنترنت؟', 'Does it work offline?'), A('نعم. الكتب والدروس التي فتحتها مرة تُحفظ على جهازك وتعمل دون إنترنت، وتُزامن ملاحظاتك عند عودة الاتصال.', 'Yes. Books and lessons you opened once are kept on your device and work offline; your notes sync when you are back online.')],
        [A('هل يمكن تنزيل الكتب كملفات؟', 'Can I download the books as files?'), A('لا. المحتوى يُفتح داخل التطبيق فقط حمايةً لحقوق المؤلفين، لكنه محفوظ على جهازك ويعمل دون إنترنت.', 'No. Content opens inside the app only, to protect the authors’ rights, but it is kept on your device and works offline.')],
        [A('كيف أشترك؟', 'How do I subscribe?'), A('افتح أي كتاب ثم «الاشتراك»: اختر الخطة وأرسل إيصال التحويل، ويُفتح الكتاب بعد الموافقة تلقائيًا. أول موضوع من كل فصل مجاني.', 'Open any book, then Subscription: choose a plan and send the transfer receipt; the book opens by itself after approval. The first topic of every chapter is free.')],
        [A('هل تنتقل ملاحظاتي بين أجهزتي؟', 'Do my notes move between devices?'), A('نعم، للمشتركين: التظليل والملاحظات والتقدّم تُزامن تلقائيًا.', 'Yes, for subscribers: highlights, notes and progress sync automatically.')]].map(function (q) { return '<details class="xfaq"><summary>' + esc(q[0]) + ic('down') + '</summary><p>' + esc(q[1]) + '</p></details>'; }).join('') + '</section></div>' +
      '<aside class="xside">' + statsBox(live.length, tot) + '<section class="xbox"><h2>' + ic('mail') + esc(A('تواصل معنا', 'Contact us')) + '</h2>' +
        PEOPLE.filter(function (p) { return p.wa; }).map(function (p) { return '<a class="xpr" target="_blank" rel="noopener" href="' + wa(p.wa) + '">' + personAv(p, 'sm') + '<span><b>' + esc(A(p.ar, p.en)) + '</b><small dir="ltr">WhatsApp ' + esc(p.tel) + '</small></span></a>'; }).join('') + '</section></aside></div>';
    h += '<div class="xact center"><a class="xbtn pri" href="#courses">' + ic('play') + '<span>' + esc(A('استعرض الكورسات الآن', 'Browse the courses')) + '</span></a><a class="xbtn ghost" href="#paths">' + ic('route') + '<span>' + esc(A('المسارات التعليمية', 'Learning paths')) + '</span></a></div>';
    return h;
  }

  /* ========== search entries (topics, courses, paths, people) ========== */
  function index() {
    var a = [];
    liveCourses().forEach(function (x) { x.chs.forEach(function (ch) { ch.topics.forEach(function (t) {
      a.push({ kind: 'lesson', hay: [t.title, t.sub, t.no, x.title, ch.title].join(' '), ttl: t.title, href: '#lesson-' + x.id + '.' + t.id, t: t.no + ' ' + t.title, s: x.b.app + ' · ' + ch.title, ico: 'open' }); }); }); });
    PATHS.forEach(function (p) { a.push({ kind: 'path', hay: p.ar + ' ' + p.en + ' ' + p.dar + ' ' + p.den, ttl: p.ar + ' ' + p.en, href: '#path-' + p.id, t: A(p.ar, p.en), s: A('مسار تعليمي', 'Learning path'), ico: 'route' }); });
    PEOPLE.forEach(function (p) { a.push({ kind: 'person', hay: p.ar + ' ' + p.en + ' ' + p.sp.join(' '), ttl: p.ar + ' ' + p.en, href: '#lecturer-' + p.id, t: A(p.ar, p.en), s: A('محاضر', 'Lecturer'), ico: 'users' }); });
    [['courses', 'Courses الكورسات كورسات', 'layers'], ['paths', 'Learning paths المسارات', 'route'], ['events', 'Events الفعاليات جلسات ورش', 'cal'], ['lecturers', 'Lecturers المحاضرون', 'users'], ['community', 'Community المجتمع نقاش أسئلة', 'group'], ['achievements', 'Achievements الإنجازات شارات شهادات', 'trophy'], ['about', 'About عن المنصة الأسئلة الشائعة', 'info']].forEach(function (r) {
      a.push({ kind: 'place', hay: r[1], ttl: r[1], href: '#' + r[0], t: r[1].split(' ').slice(1).join(' ') + ' · ' + r[1].split(' ')[0], s: A('صفحة في المنصة', 'Platform page'), ico: r[2] }); });
    return a;
  }

  /* ========== events: clicks and inputs on the new screens ========== */
  function rerender(fn) { var y = window.scrollY; c.route(true); window.scrollTo(0, y); if (fn) fn(); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fav],[data-notify],[data-tab],[data-tool],[data-done],[data-pstep],[data-fcat],[data-fclear],[data-ftog],[data-cview],[data-lty],[data-newc],[data-addc],[data-openc],[data-delc],[data-cmd],[data-qtag],[data-nsave],[data-share],[data-clrhist],[data-print],[data-persist],[data-read],[data-more]');
    if (!b) return;
    if (b.hasAttribute('data-read')) { addHist('b:' + b.getAttribute('data-read')); return; }
    e.preventDefault();
    if (b.hasAttribute('data-fav')) { var on = togFav(b.getAttribute('data-fav')); document.querySelectorAll('[data-fav="' + b.getAttribute('data-fav') + '"]').forEach(function (q) { q.setAttribute('aria-pressed', on); }); toast(on ? A('أضيف إلى المفضلة', 'Added to favourites') : A('أزيل من المفضلة', 'Removed from favourites')); return; }
    if (b.hasAttribute('data-notify')) { var n = LS.get('ntf', {}) || {}, k = b.getAttribute('data-notify'); n[k] = n[k] ? 0 : Date.now(); LS.set('ntf', n); rerender(); toast(n[k] ? A('سنرسل لك تنبيهًا في الإشعارات', 'You’ll get a notification') : A('أُلغي التنبيه', 'Notification cancelled')); return; }
    if (b.hasAttribute('data-tab')) { var bar0 = b.parentNode, pane = b.getAttribute('data-tab'); bar0.querySelectorAll('[data-tab]').forEach(function (q) { q.setAttribute('aria-selected', q === b); });
      var root = bar0.parentNode; root.querySelectorAll(':scope > .xpane').forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== pane; }); return; }
    if (b.hasAttribute('data-tool')) { var pt = b.getAttribute('data-tool').split('.'), cid = pt[0], topic = pt.length === 3 ? pt[1] : null, tool = pt[pt.length - 1];
      if (tool === 'osce' && !topic) { var oc = osceCh(cid); if (oc) { topic = oc.topics[0].id; tool = 'book'; } }
      addHist(topic ? 'l:' + cid + '.' + topic : 'b:' + cid); c.openAt(cid, topic, tool); return; }
    if (b.hasAttribute('data-done')) { var dk = b.getAttribute('data-done').split('.'), v = !isDone(dk[0], dk.slice(1).join('.')); setDone(dk[0], dk.slice(1).join('.'), v); if (v) toast(A('أحسنت! أنهيت هذا الدرس', 'Well done! Lesson completed')); rerender(); return; }
    if (b.hasAttribute('data-pstep')) { var ps = pstep(), pk = b.getAttribute('data-pstep'); if (ps[pk]) delete ps[pk]; else ps[pk] = Date.now(); LS.set('pstep', ps); rerender(); return; }
    if (b.hasAttribute('data-fcat')) { var fc = b.getAttribute('data-fcat'); F.cat[fc] = !F.cat[fc]; b.setAttribute('aria-pressed', !!F.cat[fc]); fillCourses(); return; }
    if (b.hasAttribute('data-fclear')) { F.cat = {}; F.sub = {}; F.who = {}; F.ty = {}; F.st = 'all'; F.q = ''; rerender(fillCourses); return; }
    if (b.hasAttribute('data-ftog')) { var fl = document.getElementById('xfilt'); if (fl) fl.classList.toggle('show'); return; }
    if (b.hasAttribute('data-cview')) { F.view = b.getAttribute('data-cview'); LS.set('cview', F.view); b.parentNode.querySelectorAll('button').forEach(function (q) { q.setAttribute('aria-pressed', q === b); }); fillCourses(); return; }
    if (b.hasAttribute('data-lty')) { LIB.ty = b.getAttribute('data-lty'); LIB.coll = null; b.parentNode.querySelectorAll('button').forEach(function (q) { q.setAttribute('aria-pressed', q === b); }); fillLibrary(); return; }
    if (b.hasAttribute('data-newc')) { var nm = prompt(A('اسم المجموعة', 'Collection name')); if (nm && nm.trim()) { var cl = colls(); cl.push({ n: nm.trim().slice(0, 40), items: [] }); LS.set('coll', cl); rerender(); } return; }
    if (b.hasAttribute('data-addc')) { addToColl(b.getAttribute('data-addc')); return; }
    if (b.hasAttribute('data-openc')) { var oi = +b.getAttribute('data-openc'); LIB.coll = oi < 0 ? null : oi; fillLibrary(); var r0 = document.getElementById('xlres'); if (r0) r0.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (b.hasAttribute('data-delc')) { var di = +b.getAttribute('data-delc'), cl2 = colls(); if (cl2[di] && confirm(A('حذف المجموعة «' + cl2[di].n + '»؟', 'Delete the collection “' + cl2[di].n + '”?'))) { cl2.splice(di, 1); LS.set('coll', cl2); LIB.coll = null; rerender(fillLibrary); } return; }
    if (b.hasAttribute('data-cmd')) { var cm = b.getAttribute('data-cmd'); var ed = document.getElementById('xned'); if (ed) ed.focus(); if (cm === 'hilite') document.execCommand('hiliteColor', false, '#fff1a6') || document.execCommand('backColor', false, '#fff1a6'); else document.execCommand(cm); saveNote(); return; }
    if (b.hasAttribute('data-qtag')) { var ed2 = document.getElementById('xned'); if (!ed2) return; ed2.focus(); document.execCommand('insertHTML', false, '<p><b>' + esc(b.getAttribute('data-qtag')) + ':</b>&nbsp;</p>'); saveNote(); return; }
    if (b.hasAttribute('data-nsave')) { saveNote(true); return; }
    if (b.hasAttribute('data-share')) { var url = location.origin + location.pathname + '#' + b.getAttribute('data-share'); if (navigator.share) navigator.share({ title: NAME, url: url }).catch(function () {}); else { try { navigator.clipboard.writeText(url); toast(A('نُسخ الرابط', 'Link copied')); } catch (er) {} } return; }
    if (b.hasAttribute('data-clrhist')) { if (confirm(A('مسح سجل التعلم من هذا الجهاز؟', 'Clear the learning history on this device?'))) { LS.set('hist', []); rerender(); } return; }
    if (b.hasAttribute('data-print')) { window.print(); return; }
    if (b.hasAttribute('data-persist')) { navigator.storage.persist().then(function (ok) { toast(ok ? A('المحتوى المحفوظ محميّ الآن', 'Saved content is now protected') : A('لم يسمح المتصفح بذلك الآن', 'The browser did not allow it now')); }); return; }
    if (b.hasAttribute('data-more')) { moreSheet(); return; }
  });
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (el.id === 'xcq') { F.q = el.value; fillCourses(); }
    else if (el.id === 'xlq') { LIB.q = el.value; fillLibrary(); }
    else if (el.id === 'xned') { clearTimeout(saveNote.tm); saveNote.tm = setTimeout(saveNote, 700); }
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.name === 'fst') { F.st = el.value; fillCourses(); }
    else if (el.hasAttribute('data-fsub')) { F.sub[el.getAttribute('data-fsub')] = el.checked; fillCourses(); }
    else if (el.hasAttribute('data-fwho')) { F.who[el.getAttribute('data-fwho')] = el.checked; fillCourses(); }
    else if (el.hasAttribute('data-fty')) { F.ty[el.getAttribute('data-fty')] = el.checked; fillCourses(); }
    else if (el.id === 'xsort') { F.sort = el.value; fillCourses(); }
  });
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('[data-hsearch]'); if (!f) return; e.preventDefault(); c.search(f.q.value);
  });
  function saveNote(say) {
    var ed = document.getElementById('xned'); if (!ed) return; var k = ed.getAttribute('data-key'), all = get('lnote', {}), html = ed.innerHTML.trim();
    if (html && html !== '<br>') all[k] = { h: html.slice(0, 60000), t: Date.now() }; else delete all[k];
    LS.set('lnote', all); var st = document.getElementById('xnst'); if (st) st.textContent = A('حُفظت على هذا الجهاز', 'Saved on this device');
    if (say === true) toast(A('حُفظت الملاحظات', 'Notes saved'));
  }
  function addToColl(k) {
    var cl = colls();
    if (!cl.length) { var nm = prompt(A('اسم أول مجموعة (مثلًا: مراجعة النهائي)', 'Name of your first collection (e.g. Final review)')); if (!nm || !nm.trim()) return; cl.push({ n: nm.trim().slice(0, 40), items: [] }); }
    var opts = cl.map(function (q, i) { return (i + 1) + '. ' + q.n + ((q.items || []).indexOf(k) >= 0 ? ' ✓' : ''); }).join('\n');
    var pick = cl.length === 1 ? '1' : prompt(A('اختر رقم المجموعة:', 'Choose the collection number:') + '\n' + opts, '1'); var i = parseInt(pick, 10) - 1; if (!(i >= 0 && cl[i])) return;
    var it = cl[i].items || (cl[i].items = []), at = it.indexOf(k); if (at >= 0) it.splice(at, 1); else it.push(k);
    LS.set('coll', cl); toast(at >= 0 ? A('أزيل من «' + cl[i].n + '»', 'Removed from “' + cl[i].n + '”') : A('أضيف إلى «' + cl[i].n + '»', 'Added to “' + cl[i].n + '”')); rerender(fillLibrary);
  }
  function toast(msg) {
    var t = document.getElementById('xtoast'); if (!t) { t = document.createElement('div'); t.id = 'xtoast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.className = 'on'; clearTimeout(toast.tm); toast.tm = setTimeout(function () { t.className = ''; }, 2400);
  }

  /* ---------- navigation: side menu (computer), five tabs + More (phone) ---------- */
  var SIDE = [['home', 'home', 'الرئيسية', 'Home'], ['courses', 'layers', 'الكورسات', 'Courses'], ['paths', 'route', 'المسارات', 'Paths'], ['events', 'cal', 'الفعاليات', 'Events'], ['lecturers', 'users', 'المحاضرون', 'Lecturers'],
    ['community', 'group', 'المجتمع', 'Community'], ['my-library', 'bookmark', 'مكتبتي', 'My Library'], ['favorites', 'heart', 'المفضلة', 'Favourites'], ['history', 'clock', 'سجل التعلم', 'History'],
    ['progress', 'chart', 'التقدّم', 'Progress'], ['achievements', 'trophy', 'الإنجازات', 'Achievements'], ['about', 'info', 'عن المنصة', 'About'], ['preferences', 'gear', 'الإعدادات', 'Settings']];
  var TABS = ['home', 'courses', 'my-library', 'community'];
  function sideHTML() {
    return SIDE.map(function (s, i) { return (i === 6 || i === 9 || i === 11 ? '<hr>' : '') + '<a href="#' + s[0] + '" data-nav="' + s[0] + '">' + ic(s[1]) + '<span>' + esc(A(s[2], s[3])) + '</span></a>'; }).join('');
  }
  function tabsHTML() {
    return TABS.map(function (k) { var s = SIDE.filter(function (q) { return q[0] === k; })[0]; return '<a href="#' + s[0] + '" data-nav="' + s[0] + '">' + ic(s[1]) + '<span>' + esc(A(s[2], s[3])) + '</span></a>'; }).join('') +
      '<a href="#more" data-more data-nav="more">' + ic('menu') + '<span>' + esc(A('المزيد', 'More')) + '</span></a>';
  }
  function moreSheet() {
    var d = document.getElementById('xmore'); if (!d) { d = document.createElement('div'); d.id = 'xmore'; document.body.appendChild(d); d.addEventListener('click', function (e) { if (e.target === d || e.target.closest('a')) d.hidden = true; }); }
    d.innerHTML = '<div class="xmsh" role="dialog" aria-label="' + esc(A('المزيد', 'More')) + '"><span class="xgrab"></span><div class="xmg">' + SIDE.filter(function (s) { return TABS.indexOf(s[0]) < 0; }).map(function (s) { return '<a href="#' + s[0] + '">' + ic(s[1]) + '<span>' + esc(A(s[2], s[3])) + '</span></a>'; }).join('') +
      '<a href="#notifications">' + ic('bell') + '<span>' + esc(A('الإشعارات', 'Notifications')) + '</span></a><a href="#search">' + ic('search') + '<span>' + esc(A('البحث', 'Search')) + '</span></a></div></div>';
    d.hidden = false;
  }
  function navKey(base) {
    if (/^(course|lesson|cat|cert)-/.test(base) || base === 'courses' || SMR.sections.some(function (s) { return s.id === base; }) || /^book-/.test(base)) return 'courses';
    if (/^path-/.test(base)) return 'paths'; if (/^lecturer-/.test(base)) return 'lecturers';
    return base;
  }
  function notifications() {
    var n = LS.get('ntf', {}) || {}, a = [];
    var up = upcoming(); up.slice(0, 5).forEach(function (e) { a.push({ ico: 'cal', t: A(e.ar || e.title, e.title || e.ar), s: fmtDate(e.date, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }), href: '#events' }); });
    Object.keys(n).filter(function (k) { return n[k]; }).forEach(function (k) {
      var b = c.BOOK[k]; a.push({ ico: 'bell', t: b ? A('تنبيه عند إصدار ', 'Release alert: ') + b.title + (b.ho ? ' (House Officer)' : '') : k === 'events' ? A('تنبيه عند الإعلان عن فعاليات', 'Alert when events are announced') : A('تنبيه عند افتتاح المجتمع', 'Alert when the community opens'), s: A('مفعّل منذ ', 'On since ') + c.ago(n[k]), href: b ? '#course-' + k : '#' + (k === 'events' ? 'events' : 'community') });
    });
    return a;
  }
  function vNotif() {
    var a = notifications();
    var h = banner(esc(A('الإشعارات', 'Notifications')), esc(A('الفعاليات القادمة والتنبيهات التي فعّلتها.', 'Upcoming events and the alerts you turned on.')), 'bell');
    return h + (a.length ? '<ul class="xhist">' + a.map(function (x) { return '<li><a href="' + x.href + '">' + ic(x.ico) + '<span><b>' + esc(x.t) + '</b><small>' + esc(x.s) + '</small></span></a></li>'; }).join('') + '</ul>' :
      empty('bell', A('لا توجد إشعارات', 'No notifications'), A('فعّل «نبّهني» على كورس قادم أو على الفعاليات لتصلك التنبيهات هنا.', 'Turn on “Notify me” for a coming course or for events to get alerts here.'))) +
      '<p class="xnote">' + ic('info') + '<span>' + esc(A('رسائل الإدارة الخاصة باشتراكك تصل داخل كل كتاب: الإعدادات ← مراسلة الإدارة.', 'Admin messages about your subscription arrive inside each book: Settings → Message the admin.')) + '</span></p>';
  }

  return {
    views: { home: vHome, courses: function () { return vCourses(null); }, paths: vPaths, events: vEvents, lecturers: vLecturers, community: vCommunity, 'my-library': vLibrary,
      favorites: vFavorites, history: vHistory, achievements: vAchievements, about: vAbout, notifications: vNotif },
    param: { course: vCourse, lesson: vLesson, path: vPath, lecturer: vLecturer, cert: vCert, cat: function (id) { return CAT[id] ? vCourses(id) : null; } },
    title: function (base) {
      var m = base.match(/^(\w+)-(.+)$/), s = SIDE.filter(function (q) { return q[0] === base; })[0];
      if (s) return A(s[2], s[3]);
      if (m && m[1] === 'course' && COURSE[m[2]]) return COURSE[m[2]].title;
      if (m && m[1] === 'lesson') { var q = m[2].match(/^([^.]+)\.(.+)$/), tp = q && topicOf(q[1], q[2]); return tp ? tp.t.title : ''; }
      if (m && m[1] === 'path' && PATH[m[2]]) return A(PATH[m[2]].ar, PATH[m[2]].en);
      if (m && m[1] === 'lecturer' && PERSON[m[2]]) return A(PERSON[m[2]].ar, PERSON[m[2]].en);
      if (m && m[1] === 'cat' && CAT[m[2]]) return CAT[m[2]].en;
      if (m && m[1] === 'cert') return A('شهادة الإتمام', 'Certificate');
      return '';
    },
    bind: function (base) {
      if (base === 'courses' || /^cat-/.test(base)) fillCourses();
      if (base === 'my-library') { fillLibrary(); storage(); }
    },
    side: sideHTML, tabs: tabsHTML, navKey: navKey, index: index, icon: ic, name: NAME, notifCount: function () { return notifications().length; }
  };
};
