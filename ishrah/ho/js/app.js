/* HO Assistant — screens. Data: HO_DRUGS (drugs.js), HO_DX / HO_SX / HO_SYS (dx.js); calculations: HO_E (engine.js).
   Everything stays on this device (localStorage ho-*); nothing is sent anywhere. */
(function () {
  'use strict';
  var E = window.HO_E, DR = window.HO_DRUGS, DX = window.HO_DX, SX = window.HO_SX, SYS = window.HO_SYS;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function get(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var LANG = get('ish-lang', 'ar') === 'en' ? 'en' : 'ar';
  function A(ar, en) { return LANG === 'ar' ? ar : en; }
  var nice = E.nice;
  var byId = {}; DX.forEach(function (c) { byId[c.id] = c; });
  var SXN = {}; SX.forEach(function (s) { SXN[s[1]] = s; });

  /* ---------- icons ---------- */
  var IC = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    pill: '<rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-35 12 12)"/><path d="M9.5 8.5l6 6"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17v.5"/>',
    drop: '<path d="M12 3s7 7.5 7 12a7 7 0 0 1-14 0c0-4.5 7-12 7-12z"/>',
    rx: '<path d="M6 3h6a4 4 0 0 1 0 8H6zM6 11v10M10 11l8 10M18 13l-6 8"/>',
    save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    stetho: '<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M10 13v3a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="12" r="2"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/>',
    share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 11l7.6-4M8.2 13l7.6 4"/>',
    print: '<path d="M6 9V3h12v6M6 17H4v-6h16v6h-2M7 14h10v7H7z"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>'
  };
  function ic(n, c) { return '<svg class="ic ' + (c || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (IC[n] || '') + '</svg>'; }

  /* ---------- patient ---------- */
  var BLANK = { name: '', bed: '', ay: '', am: '', ad: '', sex: '', wt: '', ht: '', set: 'op', dx: '', course: 'acute', dur: '', allergy: [], allergyTxt: '', cond: [], notes: '', na: '', k: '' };
  var P = Object.assign({}, BLANK, get('ho-pt', {}));
  function savePt() { put('ho-pt', P); }
  function hasAge() { return +P.ay > 0 || +P.am > 0 || +P.ad > 0; }
  function ready() { return hasAge() || +P.wt > 0; }
  function wtText() { if (!ready()) return ''; var w = E.wt(P); return nice(w) + ' kg' + (+P.wt > 0 ? '' : ' ' + A('(تقدير)', '(est.)')); }
  function ptChip() {
    if (!ready()) return '<span class="pt-none">' + ic('user') + A('مريض جديد', 'New patient') + '</span>';
    return ic('user') + '<span>' + esc(hasAge() ? E.ageText(P) : '') + (hasAge() ? ' · ' : '') + esc(wtText()) + '</span>';
  }
  var ALLERGIES = [['penicillin', 'بنسلين', 'Penicillin'], ['cephalosporin', 'سيفالوسبورين', 'Cephalosporin'], ['macrolide', 'ماكرولايد', 'Macrolide'], ['sulfa', 'سلفا', 'Sulfa'],
    ['nsaid', 'مسكنات NSAID / أسبرين', 'NSAIDs / aspirin'], ['quinolone', 'كينولون', 'Quinolone'], ['aminoglycoside', 'أمينوغلايكوسايد', 'Aminoglycoside']];
  var CONDS = [['asthma', 'ربو', 'Asthma'], ['g6pd', 'نقص G6PD', 'G6PD deficiency'], ['renal', 'مرض كلوي', 'Kidney disease'], ['liver', 'مرض كبدي', 'Liver disease'],
    ['jaundice', 'صفار', 'Jaundice'], ['sam', 'سوء تغذية حاد', 'Severe malnutrition'], ['cardiac', 'مرض قلبي', 'Heart disease'], ['dengue', 'حمى الضنك', 'Dengue'], ['preterm', 'خديج', 'Preterm']];
  var SETS = [['op', 'عيادة خارجية', 'Outpatient'], ['er', 'الطوارئ', 'Emergency room'], ['adm', 'تنويم', 'Admitted']];

  /* ---------- router ---------- */
  var HIST = [];
  function go(h) { if (location.hash.slice(1) === h) render(); else location.hash = h; }
  window.addEventListener('hashchange', render);
  function route() { var h = location.hash.replace(/^#/, ''); return h.split('/'); }

  var NAV = [['', 'home', 'الرئيسية', 'Home'], ['patient', 'user', 'المريض', 'Patient'], ['conds', 'list', 'الأمراض', 'Conditions'], ['drugs', 'pill', 'الأدوية', 'Drugs'], ['calc', 'calc', 'الحاسبات', 'Calculators']];
  function chrome(title, sub, back) {
    $('#hbTitle').textContent = title; $('#hbSub').textContent = sub || '';
    var b = $('#hbBack'); b.innerHTML = ic('back'); b.style.visibility = back === false ? 'hidden' : 'visible';
    $('#hbPt').innerHTML = ptChip();
    $('#hbLang').textContent = LANG === 'ar' ? 'EN' : 'ع';
    var r = route()[0];
    var cur = { c: 'conds', drug: 'drugs', dx: 'conds', rx: 'patient', orders: 'patient', saved: 'patient', emerg: '' }[r]; if (cur == null) cur = r;
    $('#bn').innerHTML = NAV.map(function (n) { return '<button data-go="' + n[0] + '" class="' + (cur === n[0] ? 'on' : '') + '">' + ic(n[1]) + '<span>' + A(n[2], n[3]) + '</span></button>'; }).join('');
    document.title = title + ' · HO Assistant';
  }
  $('#hbBack').addEventListener('click', function () { if (history.length > 1 && location.hash) history.back(); else go(''); });
  $('#hbLang').addEventListener('click', function () { LANG = LANG === 'ar' ? 'en' : 'ar'; put('ish-lang', LANG); document.documentElement.lang = LANG; document.documentElement.dir = LANG === 'ar' ? 'rtl' : 'ltr'; render(); });
  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-go]'); if (g && !e.defaultPrevented) { e.preventDefault(); go(g.getAttribute('data-go')); return; }
    var a = e.target.closest('[data-act]'); if (a && ACT[a.getAttribute('data-act')]) { e.preventDefault(); ACT[a.getAttribute('data-act')](a, e); }
  });

  function toast(t) { var x = $('#toast'); x.textContent = t; x.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { x.hidden = true; }, 2200); }
  function sheet(html) { var s = $('#sheet'); s.innerHTML = '<div class="sh-bg" data-act="shclose"></div><div class="sh-box">' + html + '</div>'; s.hidden = false; }
  var ACT = {};
  ACT.shclose = function () { $('#sheet').hidden = true; };

  function disclaimer() {
    return '<p class="disc">' + ic('alert') + A('أداة مساعدة مبنية على دليل كسلا للحالات الشائعة عند الأطفال 2024 وجدول أدوية PCH. راجع الجرعة مع النائب أو الصيدلي قبل الإعطاء.',
      'Decision support from the Kassala 2024 paediatric guideline and the PCH drug table. Check every dose with your senior or the pharmacist before giving it.') + '</p>';
  }

  /* ================= Home ================= */
  function home() {
    chrome('HO Assistant', A('مساعد طبيب الامتياز · الأطفال', 'House officer assistant · Paediatrics'), false);
    var cur = P.dx && byId[P.dx];
    var tiles = [
      ['patient', 'user', 'مريض جديد', 'New patient', 'العمر والوزن والحساسية', 'Age, weight, allergies'],
      ['dx', 'search', 'التشخيص من الأعراض', 'Diagnose from symptoms', 'اختر الأعراض والعلامات', 'Pick symptoms and signs'],
      ['conds', 'list', 'الأمراض وخطط العلاج', 'Conditions & plans', DX.length + ' حالة', DX.length + ' conditions'],
      ['drugs', 'pill', 'كتاب الأدوية', 'Drug book', Object.keys(DR).length + ' دواء', Object.keys(DR).length + ' drugs'],
      ['calc', 'calc', 'الحاسبات والسوائل', 'Calculators & fluids', 'سوائل، بوتاسيوم، GIR…', 'Fluids, K, GIR…'],
      ['emerg', 'bolt', 'جرعات الطوارئ', 'Emergency doses', 'بالوزن مباشرة', 'By weight at once'],
      ['saved', 'save', 'المرضى المحفوظون', 'Saved patients', 'على هذا الجهاز فقط', 'On this device only'],
      ['rx', 'rx', 'الوصفة وأوامر التنويم', 'Prescription & orders', 'جاهزة للنسخ والطباعة', 'Ready to copy and print']
    ];
    var h = '<section class="hero"><div class="hero-t"><span class="hero-i">' + ic('stetho') + '</span><div><h1>HO Assistant</h1><p>' +
      A('أدخل بيانات المريض، ويعطيك التطبيق الأدوية بخطوط العلاج والجرعات المحسوبة والسوائل والوصفة والفحوصات.', 'Enter the patient once: drug lines with calculated doses, fluids, prescription, orders and investigations follow.') + '</p></div></div>';
    if (ready()) {
      h += '<div class="hero-pt"><div>' + ic('user') + '<b>' + esc(P.name || A('المريض الحالي', 'Current patient')) + '</b><span>' + esc(hasAge() ? E.ageText(P) : '') + ' · ' + esc(wtText()) + (cur ? ' · ' + esc(cur.t) : '') + '</span></div>' +
        (cur ? '<button class="btn pri" data-go="c/' + cur.id + '">' + A('خطة العلاج', 'Management') + '</button>' : '<button class="btn pri" data-go="patient">' + A('أكمل البيانات', 'Complete details') + '</button>') + '</div>';
    } else h += '<button class="btn pri big" data-go="patient">' + ic('plus') + A('ابدأ بمريض جديد', 'Start a new patient') + '</button>';
    h += '</section><div class="tiles">' + tiles.map(function (t) {
      return '<button class="tile" data-go="' + t[0] + '"><span class="ti">' + ic(t[1]) + '</span><b>' + A(t[2], t[3]) + '</b><small>' + A(t[4], t[5]) + '</small></button>';
    }).join('') + '</div>';
    var standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (!standalone) h += '<button class="btn inst" data-act="install">📲 ' + A('ثبّت HO Assistant كتطبيق على هاتفك', 'Install HO Assistant as an app') + '</button>';
    h += '<section class="card soon"><h3>' + ic('book') + A('التخصصات', 'Specialities') + '</h3><div class="spl"><span class="on">' + A('الأطفال · دليل كسلا 2024 + PCH', 'Paediatrics · Kassala 2024 + PCH') + '</span><span>' +
      A('الباطنية · قريبًا', 'Medicine · soon') + '</span><span>' + A('الجراحة · قريبًا', 'Surgery · soon') + '</span><span>' + A('النساء والتوليد · قريبًا', 'Obstetrics · soon') + '</span></div><p class="mut">' +
      A('تُضاف التخصصات الأخرى عند وصول أدلتها المحلية.', 'Other specialities are added when their local guidelines arrive.') + '</p></section>' + disclaimer();
    return h;
  }

  /* ================= Patient ================= */
  function chips(list, sel, act) {
    return '<div class="chips">' + list.map(function (c) { return '<button type="button" class="chip' + (sel.indexOf(c[0]) >= 0 ? ' on' : '') + '" data-act="' + act + '" data-v="' + c[0] + '">' + A(c[1], c[2]) + '</button>'; }).join('') + '</div>';
  }
  function patient() {
    chrome(A('بيانات المريض', 'Patient details'), A('تُحفظ على هذا الجهاز', 'Kept on this device'));
    var est = hasAge() ? nice(E.estWeight(P)) : '';
    var dxopts = DX.map(function (c) { return '<option value="' + esc(c.t) + '">'; }).join('');
    var cur = P.dx && byId[P.dx];
    return '<form class="card form" id="ptf" autocomplete="off">' +
      '<div class="g2"><label>' + A('الاسم أو رقم السرير (اختياري)', 'Name or bed (optional)') + '<input name="name" value="' + esc(P.name) + '"></label>' +
      '<label>' + A('الجنس', 'Sex') + '<select name="sex"><option value="">—</option><option value="m"' + (P.sex === 'm' ? ' selected' : '') + '>' + A('ذكر', 'Male') + '</option><option value="f"' + (P.sex === 'f' ? ' selected' : '') + '>' + A('أنثى', 'Female') + '</option></select></label></div>' +
      '<fieldset><legend>' + A('العمر', 'Age') + '</legend><div class="g3"><label>' + A('سنوات', 'Years') + '<input name="ay" type="number" inputmode="numeric" min="0" max="18" value="' + esc(P.ay) + '"></label>' +
      '<label>' + A('شهور', 'Months') + '<input name="am" type="number" inputmode="numeric" min="0" max="11" value="' + esc(P.am) + '"></label>' +
      '<label>' + A('أيام', 'Days') + '<input name="ad" type="number" inputmode="numeric" min="0" max="31" value="' + esc(P.ad) + '"></label></div></fieldset>' +
      '<div class="g2"><label>' + A('الوزن (كجم)', 'Weight (kg)') + '<input name="wt" type="number" inputmode="decimal" step="0.1" min="0.4" max="120" value="' + esc(P.wt) + '" placeholder="' + (est ? A('تقدير ', 'est. ') + est : '') + '">' +
      (est ? '<button type="button" class="lnk" data-act="useest">' + A('استخدم الوزن التقديري ', 'Use estimated ') + est + ' kg</button>' : '') + '</label>' +
      '<label>' + A('الطول (سم، للمساحة و GFR)', 'Height (cm, for BSA and GFR)') + '<input name="ht" type="number" inputmode="decimal" min="30" max="200" value="' + esc(P.ht) + '"></label></div>' +
      '<fieldset><legend>' + A('مكان العلاج', 'Setting') + '</legend>' + chips(SETS, [P.set], 'setset') + '</fieldset>' +
      '<label>' + A('التشخيص', 'Diagnosis') + '<input name="dxt" list="dxl" value="' + esc(cur ? cur.t : '') + '" placeholder="' + A('ابحث: pneumonia، gastroenteritis…', 'Search: pneumonia, gastroenteritis…') + '"><datalist id="dxl">' + dxopts + '</datalist>' +
      '<button type="button" class="lnk" data-go="dx">' + A('لا تعرف التشخيص؟ ابدأ من الأعراض', 'Not sure? Start from the symptoms') + '</button></label>' +
      '<div class="g2"><label>' + A('حاد أم مزمن', 'Acute or chronic') + '<select name="course"><option value="acute"' + (P.course !== 'chronic' ? ' selected' : '') + '>' + A('حاد', 'Acute') + '</option><option value="chronic"' + (P.course === 'chronic' ? ' selected' : '') + '>' + A('مزمن', 'Chronic') + '</option></select></label>' +
      '<label>' + A('المدة (أيام)', 'Duration (days)') + '<input name="dur" type="number" inputmode="numeric" min="0" value="' + esc(P.dur) + '"></label></div>' +
      '<fieldset><legend>' + A('حساسية من دواء', 'Drug allergy') + '</legend>' + chips(ALLERGIES, P.allergy, 'tglal') + '<input name="allergyTxt" value="' + esc(P.allergyTxt) + '" placeholder="' + A('حساسية أخرى (اكتبها)', 'Other allergy (type it)') + '"></fieldset>' +
      '<fieldset><legend>' + A('حالات تؤثر على العلاج', 'Conditions that change treatment') + '</legend>' + chips(CONDS, P.cond, 'tglcd') + '</fieldset>' +
      '<div class="g2"><label>' + A('الصوديوم (اختياري)', 'Serum Na (optional)') + '<input name="na" type="number" inputmode="decimal" value="' + esc(P.na) + '"></label>' +
      '<label>' + A('البوتاسيوم (اختياري)', 'Serum K (optional)') + '<input name="k" type="number" inputmode="decimal" step="0.1" value="' + esc(P.k) + '"></label></div>' +
      '<label>' + A('ملاحظات', 'Notes') + '<textarea name="notes" rows="2">' + esc(P.notes) + '</textarea></label>' +
      '<div class="acts"><button class="btn pri big" type="submit">' + ic('check') + A('أعطني خطة العلاج', 'Get the management') + '</button>' +
      '<button class="btn" type="button" data-act="savept">' + ic('save') + A('احفظ المريض', 'Save patient') + '</button>' +
      '<button class="btn ghost" type="button" data-act="newpt">' + ic('plus') + A('مريض جديد', 'New patient') + '</button></div></form>' + disclaimer();
  }
  function readForm() {
    var f = $('#ptf'); if (!f) return;
    ['name', 'sex', 'ay', 'am', 'ad', 'wt', 'ht', 'course', 'dur', 'allergyTxt', 'notes', 'na', 'k'].forEach(function (k) { if (f[k]) P[k] = f[k].value.trim(); });
    var t = f.dxt.value.trim().toLowerCase(); var m = DX.find(function (c) { return c.t.toLowerCase() === t; }) || (t ? DX.find(function (c) { return c.t.toLowerCase().indexOf(t) >= 0 || c.ar.indexOf(t) >= 0; }) : null);
    P.dx = m ? m.id : '';
    if (P.allergyTxt) { var x = P.allergyTxt.toLowerCase(); ALLERGIES.forEach(function (a) { if (x.indexOf(a[0].slice(0, 5)) >= 0 && P.allergy.indexOf(a[0]) < 0) P.allergy.push(a[0]); }); }
    savePt();
  }
  function toggle(arr, v) { var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }
  ACT.tglal = function (b) { readForm(); toggle(P.allergy, b.dataset.v); savePt(); b.classList.toggle('on'); $('#hbPt').innerHTML = ptChip(); };
  ACT.tglcd = function (b) { readForm(); toggle(P.cond, b.dataset.v); savePt(); b.classList.toggle('on'); };
  ACT.setset = function (b) { readForm(); P.set = b.dataset.v; savePt(); $$('[data-act=setset]').forEach(function (x) { x.classList.toggle('on', x === b); }); };
  ACT.useest = function () { readForm(); P.wt = nice(E.estWeight(P)); savePt(); render(); };
  ACT.newpt = function () { if (ready() && !confirm(A('مسح بيانات المريض الحالي؟', 'Clear the current patient?'))) return; P = Object.assign({}, BLANK, { allergy: [], cond: [] }); savePt(); put('ho-sel', {}); render(); };
  ACT.savept = function () {
    readForm(); if (!ready()) return toast(A('أدخل العمر أو الوزن أولًا', 'Enter age or weight first'));
    var L = get('ho-pts', []); P.id = P.id || 'p' + Date.now(); P.saved = Date.now();
    L = L.filter(function (x) { return x.id !== P.id; }); L.unshift(JSON.parse(JSON.stringify(P))); put('ho-pts', L.slice(0, 60)); savePt();
    toast(A('حُفظ المريض على هذا الجهاز', 'Patient saved on this device'));
  };
  document.addEventListener('input', function (e) { if (e.target.closest('#ptf')) { readForm(); $('#hbPt').innerHTML = ptChip(); } });
  document.addEventListener('submit', function (e) {
    if (e.target.id === 'ptf') { e.preventDefault(); readForm(); if (!ready()) return toast(A('أدخل العمر أو الوزن', 'Enter age or weight'));
      go(P.dx ? 'c/' + P.dx : 'dx'); }
  });

  /* ================= Diagnosis from symptoms ================= */
  var SXSEL = get('ho-sx', []);
  function dxScore() {
    var m = hasAge() ? E.ageMonths(P) : null;
    return DX.map(function (c) {
      var tot = 0, got = 0, hit = [];
      Object.keys(c.sx).forEach(function (k) { tot += c.sx[k]; if (SXSEL.indexOf(k) >= 0) { got += c.sx[k]; hit.push(k); } });
      var ok = m == null || ((c.amin == null || m >= c.amin) && (c.amax == null || m <= c.amax));
      var miss = SXSEL.filter(function (k) { return !c.sx[k]; }).length;
      var s = got ? got * got / tot - miss * 0.35 : 0;
      return { c: c, s: ok ? s : s * 0.2, pct: tot ? Math.round(100 * got / tot) : 0, hit: hit, age: ok };
    }).filter(function (r) { return r.hit.length && r.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 10);
  }
  function dx() {
    chrome(A('التشخيص من الأعراض', 'Diagnosis from symptoms'), A('اختر ما وجدته', 'Pick what you found'));
    var groups = {}; SX.forEach(function (s) { (groups[s[0]] = groups[s[0]] || []).push(s); });
    var res = SXSEL.length ? dxScore() : [];
    var h = '<section class="card"><div class="row sb"><h3>' + A('الأعراض المختارة', 'Selected') + ' (' + SXSEL.length + ')</h3>' + (SXSEL.length ? '<button class="lnk" data-act="sxclear">' + A('مسح', 'Clear') + '</button>' : '') + '</div>';
    if (!SXSEL.length) h += '<p class="mut">' + A('اختر من القائمة أدناه. ترتيب الاحتمالات يأخذ عمر المريض في الحساب.', 'Choose below. The ranking takes the patient\'s age into account.') + '</p>';
    else h += '<div class="chips">' + SXSEL.map(function (k) { var s = SXN[k]; return s ? '<button class="chip on" data-act="sxt" data-v="' + k + '">' + esc(A(s[3], s[2])) + ' ✕</button>' : ''; }).join('') + '</div>';
    h += '</section>';
    if (res.length) {
      h += '<section class="card"><h3>' + A('التشخيصات المحتملة', 'Likely diagnoses') + '</h3><ol class="ddx">' + res.map(function (r) {
        return '<li data-go="c/' + r.c.id + '"><div class="ddx-h"><b>' + esc(r.c.t) + '</b><span class="pct">' + r.pct + '%</span></div><small>' + esc(r.c.ar) + (r.age ? '' : ' · ' + A('العمر غير معتاد', 'unusual for this age')) + '</small>' +
          '<div class="bar"><i style="width:' + r.pct + '%"></i></div><small class="mut">' + r.hit.map(function (k) { return esc(A(SXN[k][3], SXN[k][2])); }).join(' · ') + '</small></li>';
      }).join('') + '</ol><p class="mut sm">' + A('هذا ترتيب مساعد وليس تشخيصًا؛ افحص المريض وأكد بالفحوصات.', 'A ranking to help you think, not a diagnosis: examine and confirm.') + '</p></section>';
    }
    h += Object.keys(groups).map(function (g) {
      return '<section class="card"><h4>' + esc(g) + '</h4><div class="chips">' + groups[g].map(function (s) { return '<button class="chip' + (SXSEL.indexOf(s[1]) >= 0 ? ' on' : '') + '" data-act="sxt" data-v="' + s[1] + '">' + esc(A(s[3], s[2])) + '</button>'; }).join('') + '</div></section>';
    }).join('');
    return h;
  }
  ACT.sxt = function (b) { toggle(SXSEL, b.dataset.v); put('ho-sx', SXSEL); var y = scrollY; render(); scrollTo(0, y); };
  ACT.sxclear = function () { SXSEL = []; put('ho-sx', SXSEL); render(); };

  /* ================= Conditions list ================= */
  var CQ = '';
  function conds() {
    chrome(A('الأمراض وخطط العلاج', 'Conditions & plans'), DX.length + A(' حالة', ' conditions'));
    var h = '<div class="srch">' + ic('search') + '<input id="cq" type="search" value="' + esc(CQ) + '" placeholder="' + A('ابحث عن مرض', 'Search a condition') + '"></div><div id="clist">' + condList() + '</div>';
    return h;
  }
  function condList() {
    var q = CQ.toLowerCase(), groups = {};
    DX.forEach(function (c) { if (q && (c.t + ' ' + c.ar + ' ' + (c.about || '')).toLowerCase().indexOf(q) < 0) return; (groups[c.sys] = groups[c.sys] || []).push(c); });
    var ks = Object.keys(SYS).filter(function (k) { return groups[k]; });
    if (!ks.length) return '<p class="empty">' + A('لا نتيجة', 'Nothing found') + '</p>';
    return ks.map(function (k) {
      return '<section class="card"><h3>' + esc(A(SYS[k][1], SYS[k][0])) + '</h3><div class="clist">' + groups[k].map(function (c) {
        return '<button class="crow" data-go="c/' + c.id + '"><b>' + esc(c.t) + '</b><small>' + esc(c.ar) + '</small></button>';
      }).join('') + '</div></section>';
    }).join('');
  }
  document.addEventListener('input', function (e) { if (e.target.id === 'cq') { CQ = e.target.value; $('#clist').innerHTML = condList(); } if (e.target.id === 'dq') { DQ = e.target.value; $('#dlist').innerHTML = drugList(); } });

  /* ================= Condition management ================= */
  var SEL = get('ho-sel', {}), FORMSEL = get('ho-form', {});
  var NOPRE = /alternative|allergy|second line|third line|prevention|potent|discharge|very ill|not responding|long term|failure|if aspirin|antibiotic only|pre-referral|options/i;
  var OPT = /\b(if|or|alternative|may replace|±|evidence)\b/i;
  function pickVariant(c, vid) {
    if (vid) { var v = c.variants.find(function (x) { return x.id === vid; }); if (v) return v; }
    var want = P.set === 'adm' ? /^(adm|sev|severe|ill|sys)$/ : P.set === 'er' ? /^(er|sev|severe|adm)$/ : /^(op|none|mild|simple|home|bac)$/;
    return c.variants.find(function (v) { return want.test(v.id); }) || c.variants[0];
  }
  function defaultSel(c, v) {
    var s = {};
    v.lines.forEach(function (l, li) {
      if (li > 0 && NOPRE.test(l.t)) return;
      var first = true;
      l.items.forEach(function (it, ii) {
        if (!it.d) return;
        var o = E.dose(it.d, it.r, P), stop = o.warn && o.warn.some(function (w) { return w.lvl === 'stop'; });
        if (stop) return;
        var choose = /choose|first line|antibiotic|antimalarial|options|choice/i.test(l.t) && l.items.filter(function (x) { return x.d; }).length > 1;
        if (choose) { if (first) { s[li + '.' + ii] = 1; first = false; } return; }
        if (!OPT.test(it.note || '') && agePass(it.note)) s[li + '.' + ii] = 1;
      });
    });
    /* first line blocked by allergy → take the first allowed alternative */
    if (!Object.keys(s).some(function (k) { return k.indexOf('0.') === 0; }) && v.lines.length > 1) {
      for (var li = 1; li < v.lines.length; li++) {
        var l = v.lines[li]; if (!/alternative|allergy/i.test(l.t)) continue;
        for (var ii = 0; ii < l.items.length; ii++) { var it = l.items[ii]; if (!it.d) continue; var o = E.dose(it.d, it.r, P); if (!o.warn.some(function (w) { return w.lvl === 'stop'; })) { s[li + '.' + ii] = 1; li = 99; break; } }
      }
    }
    return s;
  }
  /* item notes such as "under 6 months" or "over 2 years" limit the drug by age */
  function agePass(note) {
    if (!note || !hasAge()) return true;
    var m = E.ageMonths(P), r = /(under|over|below|above)\s+(\d+)\s*(month|year)/i.exec(note); if (!r) return true;
    var lim = +r[2] * (/year/i.test(r[3]) ? 12 : 1);
    return /under|below/i.test(r[1]) ? m < lim : m >= lim;
  }
  function selKey(c, v) { return c.id + '|' + v.id; }
  function getSel(c, v) { var k = selKey(c, v); if (!SEL[k] || SEL[k]._pt !== ptSig()) { SEL[k] = defaultSel(c, v); SEL[k]._pt = ptSig(); } return SEL[k]; }
  function ptSig() { return [P.ay, P.am, P.ad, P.wt, P.allergy.join(), P.cond.join(), P.set].join('|'); }

  function warnHtml(w) { return w.map(function (x) { return '<div class="wn ' + x.lvl + '">' + ic('alert') + esc(x.t) + '</div>'; }).join(''); }
  function doseCard(c, v, li, ii, it, sel) {
    if (!it.d) return '<div class="dc txt">' + ic('check') + '<span>' + esc(it.txt) + '</span></div>';
    var fk = it.d + '.' + it.r, o = E.dose(it.d, it.r, P, FORMSEL[fk]);
    if (o.err) return '<div class="dc err">' + esc(o.err) + '</div>';
    var d = o.drug, on = sel[li + '.' + ii], stop = o.warn.some(function (w) { return w.lvl === 'stop'; });
    var forms = o.forms.length > 1 ? '<select class="fsel" data-fk="' + fk + '">' + o.forms.map(function (f) { return '<option value="' + f.id + '"' + (o.form && o.form.id === f.id ? ' selected' : '') + '>' + esc(f.n) + '</option>'; }).join('') + '</select>' : (o.form ? '<span class="fone">' + esc(o.form.n) + '</span>' : '');
    var rx = E.rxLine(o);
    return '<div class="dc' + (on ? ' on' : '') + (stop ? ' stop' : '') + (agePass(it.note) ? '' : ' dim') + '">' +
      '<div class="dc-h"><label class="tick"><input type="checkbox" data-sel="' + li + '.' + ii + '"' + (on ? ' checked' : '') + '><span></span></label>' +
      '<div class="dc-n" data-go="drug/' + d.id + '"><b>' + esc(d.b && d.b[0] && d.b[0] !== d.g ? d.b[0] : d.g) + '</b><small>' + esc(d.g) + (d.b && d.b.length > 1 ? ' · ' + esc(d.b.slice(1, 4).join(', ')) : '') + '</small></div>' +
      (it.note ? '<span class="dc-tag">' + esc(it.note) + '</span>' : '') + '</div>' +
      '<div class="dc-dose"><b>' + esc(o.text || '') + '</b><span>' + esc(E.route(o.route)) + ' · ' + esc(E.freq(o.f)) + (o.dur ? ' · ' + esc(o.dur) : '') + '</span></div>' +
      '<div class="dc-ar" dir="rtl">' + esc(rx.ar) + '</div>' +
      (o.calc ? '<div class="dc-c">' + ic('calc') + esc(o.calc) + '</div>' : '') +
      (o.sc ? '<div class="dc-c sc">' + A('اختصار الدليل: ', 'Guideline shortcut: ') + esc(o.sc) + '</div>' : '') +
      '<div class="dc-f">' + forms + (o.form && o.form.rec ? '<small>' + esc(o.form.rec) + '</small>' : '') + '</div>' +
      (o.note ? '<p class="dc-note">' + esc(o.note) + '</p>' : '') + warnHtml(o.warn) + '</div>';
  }
  function fluidCard(spec) {
    var f = E.fluid(spec, P); if (!f) return '';
    return '<section class="card fl"><h3>' + ic('drop') + esc(f.t) + '</h3><table class="kv">' + f.rows.map(function (r) { return '<tr><th>' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>'; }).join('') + '</table>' +
      (f.notes.length ? '<ul class="nt">' + f.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' : '') + '</section>';
  }
  function listCard(title, icn, arr, cls) { if (!arr || !arr.length) return ''; return '<section class="card ' + (cls || '') + '"><h3>' + ic(icn) + title + '</h3><ul class="bl">' + arr.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></section>'; }
  function cond(id, vid) {
    var c = byId[id]; if (!c) return notFound();
    var v = pickVariant(c, vid), sel = getSel(c, v);
    if (P.dx !== c.id) { P.dx = c.id; savePt(); }
    var vv = get('ho-var', {}); if (vv[c.id] !== v.id) { vv[c.id] = v.id; put('ho-var', vv); }
    chrome(c.t, c.ar + ' · ' + c.src);
    var h = '';
    if (!ready()) h += '<div class="wn warn">' + ic('alert') + A('أدخل العمر والوزن لحساب الجرعات. ', 'Enter age and weight to calculate doses. ') + '<a data-go="patient">' + A('بيانات المريض', 'Patient details') + '</a></div>';
    else {
      var m = E.ageMonths(P);
      if ((c.amin != null && m < c.amin) || (c.amax != null && m > c.amax)) h += '<div class="wn warn">' + ic('alert') + A('عمر المريض غير معتاد لهذا التشخيص؛ راجع التشخيص.', 'This age is unusual for this diagnosis: review it.') + '</div>';
    }
    h += '<section class="card about"><p>' + esc(c.about) + '</p>' + (P.allergy.length || P.cond.length ? '<p class="ptx">' + ic('user') + [P.allergy.length ? A('حساسية: ', 'Allergy: ') + P.allergy.join(', ') : '', P.cond.length ? A('حالات: ', 'Conditions: ') + P.cond.join(', ') : ''].filter(Boolean).join(' · ') + '</p>' : '') + '</section>';
    if (c.variants.length > 1) h += '<div class="vtabs">' + c.variants.map(function (x) { return '<button class="' + (x === v ? 'on' : '') + '" data-go="c/' + c.id + '/' + x.id + '">' + esc(x.t) + '</button>'; }).join('') + '</div>';
    if (v.when) h += '<p class="when">' + A('متى: ', 'When: ') + esc(v.when) + '</p>';
    h += '<section class="card"><h3>' + ic('pill') + A('العلاج', 'Treatment') + '<small>' + A('علّم الأدوية التي تريدها في الوصفة', 'Tick the drugs for the prescription') + '</small></h3>' + v.lines.map(function (l, li) {
      return '<div class="line"><h4>' + esc(l.t) + '</h4>' + l.items.map(function (it, ii) { return doseCard(c, v, li, ii, it, sel); }).join('') + '</div>';
    }).join('') + '</section>';
    if (v.fluid) h += fluidCard(v.fluid);
    h += listCard(A('إجراءات إضافية', 'Additional management'), 'check', (v.extra || []).concat(c.extra || []));
    h += listCard(A('الفحوصات', 'Investigations'), 'search', c.inv, 'inv');
    h += listCard(A('دواعي التنويم', 'Admit if'), 'alert', c.admit);
    h += listCard(A('المضاعفات', 'Complications'), 'alert', c.comp);
    h += listCard(A('التشخيص التفريقي', 'Differential diagnosis'), 'list', c.ddx);
    h += listCard(A('أخطاء يجب تجنبها', 'Traps to avoid'), 'alert', c.traps, 'trap');
    h += '<div class="sticky"><button class="btn pri" data-go="rx">' + ic('rx') + A('الوصفة', 'Prescription') + ' (' + Object.keys(sel).filter(function (k) { return k[0] !== '_'; }).length + ')</button><button class="btn" data-go="orders">' + ic('list') + A('أوامر التنويم', 'Order sheet') + '</button></div>';
    h += disclaimer();
    return h;
  }
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches('[data-sel]')) { var r = route(), c = byId[r[1]]; if (!c) return; var v = pickVariant(c, r[2]), s = getSel(c, v); if (t.checked) s[t.dataset.sel] = 1; else delete s[t.dataset.sel]; put('ho-sel', SEL); t.closest('.dc').classList.toggle('on', t.checked);
      var b = $('.sticky .pri'); if (b) b.innerHTML = ic('rx') + A('الوصفة', 'Prescription') + ' (' + Object.keys(s).filter(function (k) { return k[0] !== '_'; }).length + ')'; }
    if (t.matches('.fsel')) { FORMSEL[t.dataset.fk] = t.value; put('ho-form', FORMSEL); var y = scrollY; render(); scrollTo(0, y); }
  });

  /* ================= Prescription and order sheet ================= */
  function current() { var c = byId[P.dx]; if (!c) return null; var v = pickVariant(c, (get('ho-var', {})[c.id])); return { c: c, v: v, sel: getSel(c, v) }; }
  function chosen(cur) {
    var out = [];
    cur.v.lines.forEach(function (l, li) { l.items.forEach(function (it, ii) { if (it.d && cur.sel[li + '.' + ii]) out.push(E.dose(it.d, it.r, P, FORMSEL[it.d + '.' + it.r])); else if (!it.d && cur.sel[li + '.' + ii]) out.push({ txt: it.txt }); }); });
    return out.filter(function (o) { return !o.err; });
  }
  function noDx(t) { chrome(t, ''); return '<section class="card empty"><p>' + A('اختر تشخيصًا أولًا.', 'Choose a diagnosis first.') + '</p><button class="btn pri" data-go="conds">' + A('الأمراض', 'Conditions') + '</button> <button class="btn" data-go="dx">' + A('من الأعراض', 'From symptoms') + '</button></section>'; }
  function today() { var d = new Date(); return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear(); }
  function rxText(cur, list) {
    var L = ['Rx — ' + today(), (P.name ? P.name + ' · ' : '') + (hasAge() ? E.ageText(P) + ' · ' : '') + wtText(), 'Dx: ' + cur.c.t, ''];
    list.forEach(function (o, i) { if (o.txt) return; var r = E.rxLine(o); L.push((i + 1) + '. ' + r.name); L.push('   ' + r.ar); L.push('   ' + r.en); });
    L.push('', '——————', A('توقيع الطبيب: ', 'Doctor: ')); return L.join('\n');
  }
  function rx() {
    var cur = current(); if (!cur) return noDx(A('الوصفة', 'Prescription'));
    chrome(A('الوصفة', 'Prescription'), cur.c.t);
    var list = chosen(cur).filter(function (o) { return !o.txt; });
    var h = '<section class="paper" id="paper"><div class="pp-h"><b>' + A('وصفة طبية', 'Prescription') + '</b><span>' + today() + '</span></div>' +
      '<div class="pp-pt"><span>' + A('الاسم: ', 'Name: ') + '<b>' + esc(P.name || '……………') + '</b></span><span>' + A('العمر: ', 'Age: ') + '<b>' + esc(hasAge() ? E.ageText(P) : '—') + '</b></span><span>' + A('الوزن: ', 'Weight: ') + '<b>' + esc(wtText()) + '</b></span></div>' +
      '<div class="pp-dx">Dx: <b>' + esc(cur.c.t) + '</b></div><ol class="pp-l">' + list.map(function (o) { var r = E.rxLine(o); return '<li><b>' + esc(r.name) + '</b><div dir="rtl" class="ar">' + esc(r.ar) + '</div><small>' + esc(r.en) + '</small></li>'; }).join('') + '</ol>' +
      (list.length ? '' : '<p class="mut">' + A('لم تختر أي دواء.', 'No drug ticked.') + '</p>') + '<div class="pp-f">——— ' + A('توقيع الطبيب', 'Signature') + ' ———</div></section>';
    h += '<div class="acts"><button class="btn pri" data-act="copyrx">' + ic('copy') + A('نسخ', 'Copy') + '</button>' + (navigator.share ? '<button class="btn" data-act="sharerx">' + ic('share') + A('مشاركة', 'Share') + '</button>' : '') + '<button class="btn" data-act="print">' + ic('print') + A('طباعة', 'Print') + '</button><button class="btn ghost" data-go="c/' + cur.c.id + '">' + A('تعديل الأدوية', 'Edit drugs') + '</button></div>';
    h += '<section class="card tips"><h3>' + ic('alert') + A('قواعد كتابة الوصفة (الدليل)', 'Prescription rules (guideline)') + '</h3><ul class="bl"><li>' +
      A('اكتب التركيز لكل دواء له أكثر من تركيز (Amoclan 200 أو 400).', 'Write the strength when there are several (Amoclan 200 or 400).') + '</li><li>' +
      A('اكتب الطريقة والمدة بالعربي، لا OD أو BD.', 'Write route and duration in Arabic, never OD or BD.') + '</li><li>' +
      A('للأهل اكتب بالمل لا بالملغم، واطلب سرنجة 3 مل.', 'For parents write mL, not mg, and give a 3 mL syringe.') + '</li><li>' +
      A('اكتب Tegretol (carbamazepine) 200 mg حتى لا يختلط بـ carbimazole.', 'Write Tegretol (carbamazepine) 200 mg so it is not mistaken for carbimazole.') + '</li><li>' +
      A('أغلق الوصفة بخط ووقّع.', 'Close the prescription with a line and sign it.') + '</li></ul></section>';
    return h;
  }
  ACT.copyrx = function () { var cur = current(); if (!cur) return; copy(rxText(cur, chosen(cur))); };
  ACT.sharerx = function () { var cur = current(); if (!cur) return; navigator.share({ title: 'Rx', text: rxText(cur, chosen(cur)) }).catch(function () {}); };
  ACT.print = function () { window.print(); };
  function copy(t) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast(A('نُسخت', 'Copied')); }, function () { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); toast(A('نُسخت', 'Copied')); } catch (e) {} a.remove(); }); }
  function ordersList(cur) {
    var o = [], list = chosen(cur), adm = /adm|sev|severe|ill|sys|shock|dh|nodh|neo|er/.test(cur.v.id) || P.set !== 'op';
    if (adm) o.push('Admit to the paediatric ward' + (P.name ? ' (' + P.name + ')' : ''));
    o.push('Weight ' + wtText() + (hasAge() ? ', age ' + E.ageText(P) : ''));
    o.push('Vital signs ' + (/sev|severe|shock|ill|sys/.test(cur.v.id) ? 'every hour' : 'every 4 hours') + '; input and output chart');
    if (cur.v.fluid) { var f = E.fluid(cur.v.fluid, P); if (f) f.order.forEach(function (x) { o.push(x); }); }
    list.forEach(function (d) { if (d.txt) o.push(d.txt); else o.push(E.rxLine(d).name + ': ' + (d.text || '') + ' ' + E.route(d.route) + ' ' + E.freq(d.f) + (d.dur ? ' for ' + d.dur : '')); });
    (cur.c.inv || []).forEach(function (x) { o.push('Investigation: ' + x); });
    return o;
  }
  function orders() {
    var cur = current(); if (!cur) return noDx(A('أوامر التنويم', 'Order sheet'));
    chrome(A('أوامر التنويم', 'Order sheet'), cur.c.t + ' · ' + cur.v.t);
    var o = ordersList(cur);
    return '<section class="paper" id="paper"><div class="pp-h"><b>Doctor\'s orders</b><span>' + today() + '</span></div><div class="pp-dx">Dx: <b>' + esc(cur.c.t) + '</b> — ' + esc(cur.v.t) + '</div><ol class="pp-o">' +
      o.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol><div class="pp-f">——— Signature ———</div></section>' +
      '<div class="acts"><button class="btn pri" data-act="copyord">' + ic('copy') + A('نسخ', 'Copy') + '</button><button class="btn" data-act="print">' + ic('print') + A('طباعة', 'Print') + '</button><button class="btn ghost" data-go="c/' + cur.c.id + '">' + A('العودة للخطة', 'Back to the plan') + '</button></div>';
  }
  ACT.copyord = function () { var cur = current(); if (cur) copy('Orders — ' + today() + '\nDx: ' + cur.c.t + '\n' + ordersList(cur).map(function (x, i) { return (i + 1) + '. ' + x; }).join('\n')); };

  /* ================= Drug book ================= */
  var DQ = '';
  var CLS = { penicillin: 'Penicillins', cephalosporin: 'Cephalosporins', macrolide: 'Macrolides', aminoglycoside: 'Aminoglycosides', carbapenem: 'Carbapenems', antimalarial: 'Antimalarials' };
  function drugs() { chrome(A('كتاب الأدوية', 'Drug book'), Object.keys(DR).length + A(' دواء', ' drugs')); return '<div class="srch">' + ic('search') + '<input id="dq" type="search" value="' + esc(DQ) + '" placeholder="' + A('اسم علمي أو تجاري', 'Generic or brand name') + '"></div><div id="dlist">' + drugList() + '</div>'; }
  function drugList() {
    var q = DQ.toLowerCase();
    var L = Object.keys(DR).map(function (k) { return DR[k]; }).filter(function (d) { return !q || (d.g + ' ' + (d.b || []).join(' ') + ' ' + d.cls.join(' ')).toLowerCase().indexOf(q) >= 0; }).sort(function (a, b) { return a.g.localeCompare(b.g); });
    if (!L.length) return '<p class="empty">' + A('لا نتيجة', 'Nothing found') + '</p>';
    return '<section class="card"><div class="clist">' + L.map(function (d) { return '<button class="crow" data-go="drug/' + d.id + '"><b>' + esc(d.g) + '</b><small>' + esc((d.b || []).join(' · ')) + (d.cls[0] ? ' — ' + esc(d.cls[0]) : '') + '</small></button>'; }).join('') + '</div></section>';
  }
  var KEYN = { po: 'Oral', iv: 'IV', im: 'IM', pr: 'Rectal', neb: 'Nebuliser', std: 'Standard', prn: 'When needed', load: 'Loading dose', maint: 'Maintenance', sev: 'Severe', severe: 'Severe infection', mening: 'Meningitis', neo: 'Neonate', inj: 'Injection', inf: 'Infusion', ana: 'Anaphylaxis', asthma: 'Asthma', croup: 'Croup', tx: 'Treatment', proph: 'Prophylaxis', ge: 'Gastroenteritis' };
  function drug(id) {
    var d = DR[id]; if (!d) return notFound();
    chrome(d.g, (d.b || []).join(' · '));
    var users = DX.filter(function (c) { return c.variants.some(function (v) { return v.lines.some(function (l) { return l.items.some(function (it) { return it.d === id; }); }); }); });
    var h = '<section class="card"><div class="tags">' + d.cls.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '<span class="src">' + esc(d.src || '') + '</span></div>' +
      '<h4>' + A('المستحضرات', 'Preparations') + '</h4><ul class="bl">' + d.forms.map(function (f) { return '<li><b>' + esc(f.n) + '</b> · ' + esc(E.route(f.r)) + (f.rec ? '<br><small>' + esc(f.rec) + '</small>' : '') + '</li>'; }).join('') + '</ul></section>';
    h += '<section class="card"><h3>' + ic('calc') + A('الجرعات لهذا المريض', 'Doses for this patient') + '</h3>' + (ready() ? '' : '<div class="wn warn">' + ic('alert') + A('أدخل العمر والوزن.', 'Enter age and weight.') + '</div>') +
      Object.keys(d.reg).map(function (k) {
        var o = E.dose(id, k, P, FORMSEL[id + '.' + k]); if (o.err) return '';
        return '<div class="dc on"><div class="dc-h"><div class="dc-n"><b>' + esc(KEYN[k] || k) + '</b></div></div>' + (ready() ? '<div class="dc-dose"><b>' + esc(o.text) + '</b><span>' + esc(E.route(o.route)) + ' · ' + esc(E.freq(o.f)) + (o.dur ? ' · ' + esc(o.dur) : '') + '</span></div><div class="dc-ar" dir="rtl">' + esc(E.rxLine(o).ar) + '</div>' + (o.calc ? '<div class="dc-c">' + ic('calc') + esc(o.calc) + '</div>' : '') : '') +
          (o.sc ? '<div class="dc-c sc">' + A('اختصار الدليل: ', 'Guideline shortcut: ') + esc(o.sc) + '</div>' : '') + (o.note ? '<p class="dc-note">' + esc(o.note) + '</p>' : '') + (ready() ? warnHtml(o.warn) : '') + '</div>';
      }).join('') + '</section>';
    var ci = d.ci || {}, cil = [];
    if (ci.amin != null) cil.push(ci.why || ('Not under ' + ci.amin + ' months'));
    ['neonate', 'jaundice', 'asthma', 'dengue', 'g6pd', 'renal', 'liver', 'sam', 'cardiac'].forEach(function (k) { if (ci[k]) cil.push(ci[k]); });
    h += listCard(A('موانع الاستعمال والتحذيرات', 'Contraindications and cautions'), 'alert', cil, 'trap');
    if (users.length) h += '<section class="card"><h3>' + ic('list') + A('يستعمل في', 'Used in') + '</h3><div class="chips">' + users.map(function (c) { return '<button class="chip" data-go="c/' + c.id + '">' + esc(c.t) + '</button>'; }).join('') + '</div></section>';
    return h + disclaimer();
  }

  /* ================= Calculators ================= */
  var CALCS = [
    ['maint', 'السوائل اليومية (هوليداي)', 'Maintenance fluids (Holliday–Segar)'], ['dehyd', 'خطط الجفاف A · B · C', 'Dehydration plans A · B · C'], ['drops', 'معدل التنقيط', 'Drip rate'],
    ['k', 'تصحيح البوتاسيوم', 'Potassium correction'], ['na', 'نقص الصوديوم', 'Sodium deficit'], ['gir', 'معدل الجلوكوز GIR', 'Glucose infusion rate'],
    ['uo', 'إخراج البول', 'Urine output'], ['gfr', 'GFR (شوارتز)', 'GFR (Schwartz)'], ['bsa', 'مساحة الجسم', 'Body surface area'],
    ['inf', 'دوبامين / أدرينالين بالتسريب', 'Dopamine / adrenaline infusion'], ['blood', 'نقل الدم', 'Blood transfusion'], ['wt', 'الوزن التقديري من العمر', 'Estimated weight from age'],
    ['prep', 'تحضير المحاليل', 'Preparing IV fluids'], ['ett', 'مقاسات الأنابيب', 'Tube sizes']
  ];
  function calc(id) {
    if (!id) {
      chrome(A('الحاسبات', 'Calculators'), A('بوزن المريض الحالي', 'With the current weight'));
      return '<div class="tiles sm">' + CALCS.map(function (c) { return '<button class="tile" data-go="calc/' + c[0] + '"><span class="ti">' + ic(c[0] === 'drops' || c[0] === 'maint' || c[0] === 'dehyd' || c[0] === 'prep' ? 'drop' : 'calc') + '</span><b>' + A(c[1], c[2]) + '</b></button>'; }).join('') + '</div>';
    }
    var c = CALCS.find(function (x) { return x[0] === id; }); if (!c) return notFound();
    chrome(A(c[1], c[2]), A('الحاسبات', 'Calculators'));
    return '<form class="card form calc" id="cf" data-c="' + id + '">' + calcInputs(id) + '</form><section class="card res" id="cres"></section>';
  }
  function inp(n, lab, v, step) { return '<label>' + lab + '<input name="' + n + '" type="number" inputmode="decimal" step="' + (step || 'any') + '" value="' + esc(v == null ? '' : v) + '"></label>'; }
  var W = function () { return ready() ? nice(E.wt(P)) : ''; };
  function calcInputs(id) {
    var w = inp('wt', A('الوزن (كجم)', 'Weight (kg)'), W());
    switch (id) {
      case 'maint': return '<div class="g2">' + w + '<label>' + A('الكمية', 'Amount') + '<select name="x"><option value="1">' + A('كاملة', 'Full') + '</option><option value="0.667">⅔</option><option value="1.5">1½</option><option value="2">' + A('ضعف', 'Double') + '</option></select></label></div>';
      case 'dehyd': return '<div class="g2">' + w + '<label>' + A('الخطة', 'Plan') + '<select name="pl"><option value="planA">A</option><option value="planB">B</option><option value="planC" selected>C</option><option value="resomal">ReSoMal (SAM)</option><option value="shock">Shock</option><option value="samShock">Shock in SAM</option></select></label></div>';
      case 'drops': return '<div class="g3">' + inp('ml', A('الكمية (مل)', 'Volume (mL)'), 500) + inp('h', A('الساعات', 'Hours'), 8) + '<label>' + A('جهاز التنقيط', 'Giving set') + '<select name="set"><option value="20">20 ' + A('نقطة/مل', 'drops/mL') + '</option><option value="15">15</option><option value="60">60 (micro)</option></select></label></div>';
      case 'k': return '<div class="g3">' + w + inp('k', A('البوتاسيوم الحالي', 'Serum K (mmol/L)'), P.k, 0.1) + '<label>' + A('الاحتياج اليومي', 'Daily need') + '<select name="m"><option value="1">1 mmol/kg</option><option value="2">2 mmol/kg</option></select></label></div>';
      case 'na': return '<div class="g2">' + w + inp('na', A('الصوديوم الحالي', 'Serum Na (mmol/L)'), P.na) + '</div>';
      case 'gir': return '<div class="g3">' + w + inp('pc', A('تركيز الدكستروز %', 'Dextrose %'), 10) + inp('r', A('المعدل (مل/ساعة)', 'Rate (mL/h)'), '') + '</div>';
      case 'uo': return '<div class="g3">' + w + inp('ml', A('كمية البول (مل)', 'Urine (mL)'), '') + inp('h', A('خلال (ساعات)', 'Over (hours)'), 12) + '</div>';
      case 'gfr': return '<div class="g2">' + inp('ht', A('الطول (سم)', 'Height (cm)'), P.ht) + inp('cr', A('الكرياتينين (mg/dL)', 'Creatinine (mg/dL)'), '', 0.01) + '</div>';
      case 'bsa': return '<div class="g2">' + w + inp('ht', A('الطول (سم)', 'Height (cm)'), P.ht) + '</div>';
      case 'inf': return '<div class="g3">' + w + '<label>' + A('الدواء', 'Drug') + '<select name="dg"><option value="dop">Dopamine (200 mg/5 mL)</option><option value="adr">Adrenaline (1 mg/mL)</option></select></label>' + inp('mc', 'mcg/kg/min', 5, 0.01) + '</div>';
      case 'blood': return '<div class="g3">' + w + inp('hb', A('الهيموغلوبين الحالي', 'Current Hb (g/dL)'), '', 0.1) + inp('tg', A('الهدف', 'Target Hb'), 10, 0.1) + '</div>';
      case 'wt': return '<div class="g3">' + inp('ay', A('سنوات', 'Years'), P.ay) + inp('am', A('شهور', 'Months'), P.am) + inp('ad', A('أيام', 'Days'), P.ad) + '</div>';
      case 'ett': return '<div class="g2">' + inp('ay', A('العمر (سنوات)', 'Age (years)'), P.ay) + w + '</div>';
      default: return '';
    }
  }
  function num(f, n) { var x = f[n] ? parseFloat(f[n].value) : NaN; return isNaN(x) ? null : x; }
  function rows(r) { return '<table class="kv">' + r.map(function (x) { return '<tr><th>' + esc(x[0]) + '</th><td>' + esc(x[1]) + '</td></tr>'; }).join('') + '</table>'; }
  function calcRun() {
    var f = $('#cf'), out = $('#cres'); if (!f || !out) return;
    var id = f.dataset.c, wt = num(f, 'wt'), r = [], notes = [];
    var need = function () { out.innerHTML = '<p class="mut">' + A('أدخل القيم المطلوبة.', 'Enter the values.') + '</p>'; };
    var p2 = Object.assign({}, P, { wt: wt || P.wt });
    if (id === 'maint') { if (!wt) return need(); var v = E.maint(wt) * +f.x.value, c2 = E.capDaily(p2, v); v = c2.v; r.push(['Holliday–Segar', E.maintCalc(wt)], [A('اليوم', 'Per day'), nice(v) + ' mL'], [A('كل 8 ساعات', 'Per 8 h'), nice(v / 3) + ' mL (' + E.drops(v / 3, 8) + ' drops/min)'], [A('بالساعة', 'Per hour'), nice(v / 24) + ' mL/h'], [A('النوع', 'Type'), E.fluidType(p2)]); if (c2.note) notes.push(c2.note); }
    else if (id === 'dehyd') { if (!wt) return need(); var fl = E.fluid({ k: f.pl.value }, p2); out.innerHTML = '<h3>' + esc(fl.t) + '</h3>' + rows(fl.rows) + (fl.notes.length ? '<ul class="nt">' + fl.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' : ''); return; }
    else if (id === 'drops') { var ml = num(f, 'ml'), h = num(f, 'h'), s = +f.set.value; if (!ml || !h) return need(); r.push([A('نقطة/دقيقة', 'Drops/min'), String(Math.round(ml * s / (h * 60)))], [A('مل/ساعة (مضخة)', 'mL/h (pump)'), nice(ml / h)]); notes.push('Drops/min = mL × ' + s + ' ÷ (hours × 60)'); }
    else if (id === 'k') {
      var k = num(f, 'k'); if (!wt || k == null) return need(); var mm = +f.m.value, tot = Math.max(0, (4 - k) * wt / 2) + mm * wt;
      r.push([A('المعادلة المستعملة في المستشفى', 'Hospital equation'), '[(4 − ' + k + ') × ' + nice(wt) + '/2] + ' + mm + ' × ' + nice(wt) + ' = ' + nice(tot) + ' mmol/24 h'],
        ['KCl 15% (2 mmol/mL)', nice(tot / 2) + ' mL in the 24-hour maintenance fluid, or ' + nice(tot / 6) + ' mL in each 8-hour bag']);
      var pf = k >= 3 ? [0.25, 1] : k >= 2.5 ? [0.5, 2] : [0.75, 3];
      if (k < 3.5) r.push(['PFCCS (IV correction)', nice(pf[0] * wt) + ' mmol = ' + nice(pf[0] * wt / 2) + ' mL KCl over ' + pf[1] + ' h (diluted)']);
      r.push([A('أقصى معدل', 'Maximum rate'), nice(0.4 * wt) + ' mmol/h (0.4 mmol/kg/h)']);
      notes.push(A('بعد أن يتبول الطفل فقط. لا يعطى البوتاسيوم مركزًا أو دفعة واحدة أبدًا.', 'Only after the child passes urine. Never undiluted or as a bolus.'), A('المعادلة الأولى شائعة في المستشفيات لكن بلا دليل علمي (الدليل).', 'The first equation is common practice without an evidence base (guideline).'));
    }
    else if (id === 'na') { var na = num(f, 'na'); if (!wt || na == null) return need(); if (na >= 130) r.push([A('النتيجة', 'Result'), A('لا نقص يحتاج تصحيحًا خاصًا', 'No specific deficit to correct')]); else { var def = wt * (130 - na) * 0.6; r.push([A('النقص', 'Deficit'), nice(wt) + ' × (130 − ' + na + ') × 0.6 = ' + nice(def) + ' mmol'], ['3% NaCl (0.5 mmol/mL)', nice(def / 0.5) + ' mL'], ['NS (0.154 mmol/mL)', nice(def / 0.154) + ' mL']); if (na < 120) notes.push(A('مع تشنجات: 3% NaCl بسرعة لرفع الصوديوم 5 mmol/L ثم ببطء.', 'With seizures: 3% saline quickly to raise Na by 5 mmol/L, then slowly.')); notes.push(A('لا يزيد الصوديوم أكثر من 10–12 mmol/L في اليوم.', 'Do not raise Na by more than 10–12 mmol/L per day.')); } }
    else if (id === 'gir') { var pc = num(f, 'pc'), rt = num(f, 'r'); if (!wt || !pc || !rt) return need(); var g = pc * rt / (wt * 6); r.push(['GIR', nice(g) + ' mg/kg/min']); notes.push('GIR = % × mL/h ÷ (wt × 6). ' + A('أكثر من 12: ابحث عن سبب نقص السكر المستمر.', 'Above 12: investigate persistent hypoglycaemia.')); }
    else if (id === 'uo') { var u = num(f, 'ml'), hh = num(f, 'h'); if (!wt || !u || !hh) return need(); var x = u / wt / hh; r.push([A('إخراج البول', 'Urine output'), nice(x) + ' mL/kg/h'], [A('التفسير', 'Meaning'), x < 0.5 ? A('قلة بول (أقل من 0.5)', 'Oliguria (< 0.5)') : x > 4 ? A('كثرة بول (أكثر من 4)', 'Polyuria (> 4)') : A('طبيعي (0.5–2)', 'Normal (0.5–2)')]); }
    else if (id === 'gfr') { var ht = num(f, 'ht'), cr = num(f, 'cr'); if (!ht || !cr) return need(); r.push(['eGFR', nice(0.41 * ht / cr) + ' mL/min/1.73 m²']); notes.push('Schwartz: 0.41 × height (cm) ÷ creatinine (mg/dL). µmol/L ÷ 88.4 = mg/dL.'); }
    else if (id === 'bsa') { var ht2 = num(f, 'ht'); if (!wt || !ht2) return need(); var b = Math.sqrt(wt * ht2 / 3600); r.push(['BSA (Mosteller)', nice(b) + ' m²'], [A('السوائل غير المحسوسة', 'Insensible loss'), nice(400 * b) + ' mL/day (400 mL/m²)']); }
    else if (id === 'inf') {
      var mc = num(f, 'mc'); if (!wt || !mc) return need();
      if (f.dg.value === 'dop') { var mg = wt * mc * 1440 / 1000; r.push(['Dopamine', nice(mg) + ' mg = ' + nice(mg / 40) + ' mL of 200 mg/5 mL'], [A('في', 'In'), '100 mL NS over 24 h (4.2 mL/h)']); notes.push(A('كلوي 2–5، قلبي 5–15 mcg/kg/min.', 'Renal 2–5, cardiac 5–15 mcg/kg/min.')); }
      else { var mg2 = wt * mc * 1440 / 1000; r.push(['Adrenaline', nice(mg2) + ' mg = ' + nice(mg2) + ' mL of 1 mg/mL'], [A('في', 'In'), '100 mL NS over 24 h (4.2 mL/h)']); notes.push('0.05–1 mcg/kg/min.'); }
    }
    else if (id === 'blood') { var hb = num(f, 'hb'), tg = num(f, 'tg'); if (!wt) return need(); r.push([A('دم كامل', 'Whole blood'), nice(20 * wt) + ' mL (20 mL/kg) over 3–4 h'], [A('سوء تغذية', 'Malnourished'), nice(10 * wt) + ' mL (10 mL/kg)']); if (hb != null && tg) r.push(['Packed cells (PCH)', nice(wt) + ' × (' + tg + ' − ' + hb + ') × 3 = ' + nice(Math.max(0, wt * (tg - hb) * 3)) + ' mL']); r.push([A('فشل قلب', 'Heart failure'), 'Furosemide ' + nice(wt) + ' mg before and after (not in sickle cell disease)']); }
    else if (id === 'wt') { var q = { ay: num(f, 'ay') || 0, am: num(f, 'am') || 0, ad: num(f, 'ad') || 0 }; if (!q.ay && !q.am && !q.ad) return need(); r.push([A('الوزن التقديري', 'Estimated weight'), nice(E.estWeight(q)) + ' kg']); notes.push(A('تقدير فقط؛ الوزن الحقيقي أفضل دائمًا. <12 شهر: (الشهور + 9) ÷ 2 · 1–6 سنوات: سنوات × 2 + 8 · 7–12: (سنوات × 7 − 5) ÷ 2.', 'Estimate only. < 12 months: (months + 9) ÷ 2 · 1–6 y: years × 2 + 8 · 7–12 y: (years × 7 − 5) ÷ 2.')); }
    else if (id === 'ett') { var ay = num(f, 'ay'); if (ay == null) return need(); r.push(['ETT uncuffed (ID)', nice(ay / 4 + 4) + ' mm'], ['ETT cuffed (ID)', nice(ay / 4 + 3.5) + ' mm'], [A('عمق الأنبوب (الفم)', 'Oral ETT depth'), nice(ay / 2 + 12) + ' cm']); if (wt) r.push(['NG tube', 'about ' + (wt < 5 ? 6 : wt < 15 ? 8 : 10) + ' Fr']); notes.push(A('معادلات APLS المعروفة (ليست من الدليل المحلي)، لعمر أكثر من سنة.', 'Standard APLS formulas (not from the local guideline), for children over 1 year.')); }
    out.innerHTML = rows(r) + (notes.length ? '<ul class="nt">' + notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' : '');
  }
  var PREP = [['Dextrose 5% ½ saline', '250 mL D10 + 250 mL NS'], ['Dextrose 5% ⅕ saline', 'Remove 200 mL from 500 mL D5W; add 100 mL D10 + 100 mL NS'], ['DNS (D5 in NS)', 'Remove 50 (60) mL from 500 mL NS; add 50 (60) mL D50'],
    ['Dextrose 7.5% ½ saline (DKA, RBG < 100 with acidosis)', 'Remove 25 (30) mL from 500 mL D5 ½ saline; add 25 (30) mL D50'], ['Dextrose 10% ½ saline (DKA; quinine with hypoglycaemia)', 'Remove 50 (60) mL from 500 mL D5 ½ saline; add 50 (60) mL D50'],
    ['Dextrose 10%', 'Remove 50 (60) mL from 500 mL D5; add 50 (60) mL D50'], ['Dextrose 12.5% (resistant hypoglycaemia)', 'Remove 25 (30) mL from 500 mL D10; add 25 (30) mL D50']];
  document.addEventListener('input', function (e) { if (e.target.closest('#cf')) calcRun(); });
  document.addEventListener('change', function (e) { if (e.target.closest('#cf')) calcRun(); });

  /* ================= Emergency ================= */
  var EM = [['adrenalineSC', 'ana', 'Anaphylaxis'], ['hydrocortisone', 'ana', 'Anaphylaxis / shock'], ['chlorphenamine', 'inj', 'Allergy'], ['diazepam', 'iv', 'Convulsion (IV)'], ['diazepam', 'pr', 'Convulsion (rectal)'],
    ['phenobarbitone', 'load', 'Status / neonatal seizures'], ['dextrose10', 'bolus', 'Hypoglycaemia'], ['cagluc', 'load', 'Hypocalcaemia'], ['dexamethasone', 'croup', 'Croup'], ['dexamethasone', 'mening', 'Meningitis'],
    ['salbutamolNeb', 'neb', 'Wheeze'], ['mgso4', 'asthma', 'Severe asthma'], ['aminophylline', 'load', 'Severe asthma (old)'], ['furosemide', 'hf', 'Heart failure']];
  function emerg() {
    chrome(A('جرعات الطوارئ', 'Emergency doses'), ready() ? wtText() : '');
    if (!ready()) return '<section class="card empty"><p>' + A('أدخل الوزن أو العمر أولًا.', 'Enter weight or age first.') + '</p><button class="btn pri" data-go="patient">' + A('بيانات المريض', 'Patient details') + '</button></section>';
    var wt = E.wt(P);
    var h = '<section class="card"><h3>' + ic('drop') + A('السوائل', 'Fluids') + '</h3>' + rows([["NS / Ringer's bolus", nice(20 * wt) + ' mL (20 mL/kg) over 5–10 min'], [A('حديث ولادة أو قلب', 'Neonate / heart disease'), nice(10 * wt) + ' mL (10 mL/kg)'], ['Blood', nice(20 * wt) + ' mL (20 mL/kg)'], ['D10 (SAM shock)', nice(5 * wt) + ' mL (5 mL/kg)']]) + '</section>';
    h += '<section class="card"><h3>' + ic('bolt') + A('الأدوية', 'Drugs') + '</h3>' + EM.map(function (e) {
      var o = E.dose(e[0], e[1], P); if (o.err) return '';
      return '<div class="em"><div><b>' + esc(e[2]) + '</b><small data-go="drug/' + e[0] + '">' + esc(o.drug.g) + '</small></div><div><b>' + esc(o.text) + '</b><small>' + esc(E.route(o.route)) + (o.sc ? ' · ' + esc(o.sc) : '') + '</small></div></div>';
    }).join('') + '</section>';
    h += listCard(A('أخطاء قاتلة (الدليل)', 'Fatal mistakes (guideline)'), 'alert', [
      'Salbutamol nebuliser in anaemic heart failure: look for pallor; give oxygen and IV NS 4 mL/kg/h until blood.',
      'Heart disease with breathlessness: salbutamol worsens tachycardia; give oxygen and an NS nebuliser ± ipratropium.',
      'IV fluid in severe malnutrition (except shock): use ReSoMal and F75.',
      'IV bolus in scorpion sting: the shock is anaphylactic or neurogenic; give IM adrenaline (an adrenaline infusion may be needed).',
      'A beta-blocker (propranolol) in asthma.'], 'trap');
    return h + disclaimer();
  }

  /* ================= Saved patients ================= */
  function saved() {
    chrome(A('المرضى المحفوظون', 'Saved patients'), A('على هذا الجهاز فقط', 'On this device only'));
    var L = get('ho-pts', []);
    if (!L.length) return '<section class="card empty"><p>' + A('لا يوجد مرضى محفوظون. احفظ المريض من صفحة بياناته.', 'No saved patients. Save one from the patient page.') + '</p><button class="btn pri" data-go="patient">' + A('بيانات المريض', 'Patient details') + '</button></section>';
    return '<section class="card"><div class="clist">' + L.map(function (x) {
      var c = byId[x.dx];
      return '<div class="crow pt"><button data-act="openpt" data-id="' + x.id + '"><b>' + esc(x.name || A('بدون اسم', 'No name')) + '</b><small>' + esc(E.ageText(x)) + ' · ' + esc(nice(E.wt(x))) + ' kg' + (c ? ' · ' + esc(c.t) : '') + ' · ' + new Date(x.saved).toLocaleDateString() + '</small></button><button class="ib" data-act="delpt" data-id="' + x.id + '" aria-label="Delete">' + ic('trash') + '</button></div>';
    }).join('') + '</div></section><p class="mut sm">' + A('تبقى البيانات على هذا الجهاز ولا ترسل لأي مكان.', 'Data stay on this device and are never sent anywhere.') + '</p>';
  }
  ACT.openpt = function (b) { var x = get('ho-pts', []).find(function (y) { return y.id === b.dataset.id; }); if (!x) return; P = Object.assign({}, BLANK, x); savePt(); go(P.dx ? 'c/' + P.dx : 'patient'); };
  ACT.delpt = function (b) { if (!confirm(A('حذف هذا المريض؟', 'Delete this patient?'))) return; put('ho-pts', get('ho-pts', []).filter(function (y) { return y.id !== b.dataset.id; })); render(); };

  /* installing: inside SMRA the frame cannot install, so the app's own address opens in a new tab, where the browser offers it */
  var BIP = null; window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); BIP = e; });
  ACT.install = function () {
    if (window.top !== window) { window.open('/ho/?install=1', '_blank', 'noopener'); return; }
    if (BIP) { var e = BIP; BIP = null; e.prompt(); return; }
    var ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    sheet('<h3>📲 ' + A('ثبّت التطبيق', 'Install the app') + '</h3><ol class="bl"><li>' + (ios ? A('افتح هذه الصفحة في Safari، اضغط زر المشاركة ⬆️', 'Open this page in Safari and tap Share ⬆️') : A('افتح هذه الصفحة في Chrome، اضغط ⋮ أعلى الشاشة', 'Open this page in Chrome and tap ⋮')) + '</li><li>' +
      (ios ? A('اختر «إضافة إلى الشاشة الرئيسية» ثم «إضافة»', 'Choose «Add to Home Screen», then «Add»') : A('اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»', 'Choose «Install app» or «Add to Home screen»')) + '</li></ol><button class="btn pri big" data-act="shclose">' + A('حسنًا', 'OK') + '</button>');
  };
  if (/[?&]install=1/.test(location.search)) setTimeout(function () { ACT.install(); }, 1500);
  function notFound() { chrome(A('غير موجود', 'Not found'), ''); return '<p class="empty">' + A('الصفحة غير موجودة.', 'Page not found.') + '</p>'; }

  /* ================= render ================= */
  function render() {
    var r = route(), h;
    $('#sheet').hidden = true;
    switch (r[0]) {
      case '': h = home(); break;
      case 'patient': h = patient(); break;
      case 'dx': h = dx(); break;
      case 'conds': h = conds(); break;
      case 'c': h = cond(r[1], r[2]); break;
      case 'rx': h = rx(); break;
      case 'orders': h = orders(); break;
      case 'drugs': h = drugs(); break;
      case 'drug': h = drug(r[1]); break;
      case 'calc': h = calc(r[1]); break;
      case 'emerg': h = emerg(); break;
      case 'saved': h = saved(); break;
      default: h = notFound();
    }
    $('#v').innerHTML = h;
    if (r[0] === 'calc' && r[1] === 'prep') $('#cres').innerHTML = rows(PREP) + '<ul class="nt"><li>' + A('المراجع تختلف: WHO 25 مل، البروتوكول القومي 30 مل، آخرون 32 مل.', 'References differ: WHO 25 mL, national protocol 30 mL, others 32 mL.') + '</li></ul>';
    else if (r[0] === 'calc' && r[1]) calcRun();
    if (r[0] !== 'dx' || !render.keep) scrollTo(0, 0);
  }
  /* condition variant chosen in the URL must also be the one the prescription uses */
  render();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js', { scope: './' }).catch(function () {});
})();
