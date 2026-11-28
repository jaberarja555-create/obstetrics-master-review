/* HO Guide — screens. Data: HO_DRUGS (drugs.js), HO_DX / HO_SX / HO_SYS (dx.js); calculations: HO_E (engine.js).
   Language (owner, 26–27 Nov 2026): main titles in English (T); everything else follows the chosen language (A), Arabic by default.
   Look: SMRA green and gold, with the look, colour and text size chosen in Settings. Patients stay on this device (ho-*). */
(function () {
  'use strict';
  var E = window.HO_E, DR = window.HO_DRUGS, DX = window.HO_DX, SX = window.HO_SX, SYS = window.HO_SYS;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function get(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var LANG = get('ish-lang', 'ar') === 'en' ? 'en' : 'ar', AR = LANG === 'ar';
  function A(ar, en) { return AR ? ar : en; }
  /* Arabic count of conditions: حالة واحدة · حالتان · 3–10 حالات · 11+ حالة */
  function nCase(n) { return n === 1 ? 'حالة واحدة' : n === 2 ? 'حالتان' : n <= 10 ? n + ' حالات' : n + ' حالة'; }
  function T(en) { return '<bdi dir="ltr">' + esc(en) + '</bdi>'; }
  var nice = E.nice;
  var byId = {}; DX.forEach(function (c) { byId[c.id] = c; });
  var SXN = {}; SX.forEach(function (s) { SXN[s[1]] = s; });
  var INFRAME = window.top !== window;

  /* ---------- icons ---------- */
  var IC = {
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    baby: '<circle cx="12" cy="10" r="6"/><path d="M9.5 10h.01M14.5 10h.01M10 13c1 1 3 1 4 0M12 4c0-1 1-2 2-2"/><path d="M7 20c1.5-2 3-2.5 5-2.5s3.5.5 5 2.5"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    pill: '<rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-35 12 12)"/><path d="M9.5 8.5l6 6"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17v.5"/>',
    drop: '<path d="M12 3s7 7.5 7 12a7 7 0 0 1-14 0c0-4.5 7-12 7-12z"/>',
    rx: '<path d="M6 3h6a4 4 0 0 1 0 8H6zM6 11v10M10 11l8 10M18 13l-6 8"/>',
    save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    fwd: '<path d="M9 5l7 7-7 7"/>',
    stetho: '<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M10 13v3a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="12" r="2"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/>',
    share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 11l7.6-4M8.2 13l7.6 4"/>',
    print: '<path d="M6 9V3h12v6M6 17H4v-6h16v6h-2M7 14h10v7H7z"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10z"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    route: '<path d="M4 12h12M12 6l6 6-6 6"/>',
    flask: '<path d="M9 3h6M10 3v6L4 19a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2l-6-10V3"/><path d="M7 15h10"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    install: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    palette: '<path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>',
    text: '<path d="M4 7V5h16v2M9 19h6M12 5v14"/>',
    hosp: '<path d="M4 21V7l8-4 8 4v14"/><path d="M10 21v-5h4v5M12 8v4M10 10h4"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    userplus: '<circle cx="10" cy="8" r="4"/><path d="M3 21c0-4 3.4-6.5 7-6.5 1.3 0 2.5.3 3.6.8"/><circle class="acf" cx="17.5" cy="17.5" r="4.5"/><path class="w" d="M17.5 15.5v4M15.5 17.5h4"/>',
    stetho2: '<path d="M5 3v6a4.5 4.5 0 0 0 9 0V3"/><path d="M9.5 13.5v2.5a5 5 0 0 0 10 0V13"/><circle class="ac" cx="19.5" cy="11" r="2"/>',
    clip: '<rect x="5" y="4.5" width="14" height="16.5" rx="2.2"/><path d="M9 4.5V3h6v1.5"/><path class="ac" d="M8 10.5l1.2 1.2 2.2-2.4M8 16l1.2 1.2 2.2-2.4"/><path d="M13.5 10.5h3M13.5 16h3"/>',
    pill2: '<rect x="2.8" y="8.6" width="18.4" height="6.8" rx="3.4" transform="rotate(-40 12 12)"/><path class="acf" d="M12 12l3.5-4.2a3.4 3.4 0 0 1 5.2 4.4L17.2 16.4z"/><path d="M9.6 9.1l4.8 5.8"/>',
    calc2: '<rect x="4" y="3" width="16" height="18" rx="2.4"/><path d="M12 3v18M4 12h16"/><path d="M8 6.2v3.2M6.4 7.8h3.2M6.8 14.8l2.4 2.4M9.2 14.8l-2.4 2.4"/><path class="ac" d="M14.4 7.8h3.2M14.4 15h3.2M14.4 17.4h3.2"/>',
    siren: '<path d="M7 18v-5.5a5 5 0 0 1 10 0V18"/><path d="M5 18h14v3H5z"/><path d="M12 2.5v2M4.6 5.6l1.4 1.4M19.4 5.6L18 7M2.5 12.5h2M19.5 12.5h2"/><path d="M10 13a2 2 0 0 1 2-2"/>',
    bmark: '<path d="M6.5 3.5h11v17l-5.5-4-5.5 4z"/>',
    medkit: '<rect x="3" y="7" width="18" height="13" rx="2.4"/><path d="M9 7V5h6v2"/><path class="ac" d="M12 10.5v6M9 13.5h6"/>',
    drop2: '<path d="M12 3s7 7.5 7 12a7 7 0 0 1-14 0c0-4.5 7-12 7-12z"/><path class="ac" d="M9 15.5a3 3 0 0 0 3 3"/>',
    gear2: '<circle class="ac" cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    ecg: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
    lungs: '<path d="M12 4v7"/><path d="M12 11c-1.5 0-3 1.5-4 4-.8 2-1.5 5-3.5 5S3 17 3 14c0-4 2-8 4.5-8C10 6 12 8 12 11zM12 11c1.5 0 3 1.5 4 4 .8 2 1.5 5 3.5 5S21 17 21 14c0-4-2-8-4.5-8C14 6 12 8 12 11z"/>',
    heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
    gut: '<path d="M9 3v4c0 2-3 3-3 7a6 6 0 0 0 12 0c0-3-3-3-3-5s2-2 2-4"/>',
    kidney: '<path d="M15 4c3 0 5 3 5 8s-2 8-5 8-3-3-3-4.5 2-2 2-3.5-2-2-2-3.5S12 4 15 4z"/><path d="M4 12h8"/>',
    brain: '<path d="M10 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3zM14 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3z"/>',
    virus: '<circle cx="12" cy="12" r="5"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3.5 3.5M15.5 15.5L19 19M19 5l-3.5 3.5M8.5 15.5L5 19"/>',
    bone: '<path d="M8 16l8-8"/><circle cx="6.5" cy="17.5" r="2"/><circle cx="17.5" cy="6.5" r="2"/><circle cx="4.5" cy="15.5" r="1.5"/><circle cx="19.5" cy="8.5" r="1.5"/>'
  };
  function ic(n, c) { return '<svg class="ic ' + (c || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[n] || '') + '</svg>'; }
  var SYSIC = { resp: 'lungs', cvs: 'heart', neo: 'baby', gi: 'gut', renal: 'kidney', cns: 'brain', inf: 'virus', blood: 'drop', endo: 'flask', emerg: 'bolt', msk: 'bone' };

  /* ---------- the signed-in SMRA account (read only) ---------- */
  function me() { var x = get('ish-me', null); return x && x.me ? x.me : null; }
  function drName() { var m = me(); if (!m || !m.name) return ''; var n = String(m.name).replace(/^(dr\.?|د\.?)\s*/i, '').split(/\s+/)[0]; return /[؀-ۿ]/.test(n) ? 'د. ' + n : 'Dr. ' + n; }
  function avatar(cls) {
    var m = me();
    if (m && m.photo && /^(https?:|\/)/.test(m.photo)) return '<span class="av ' + (cls || '') + '"><img src="' + esc(m.photo) + '" alt=""></span>';
    var n = m && m.name ? String(m.name).trim().charAt(0).toUpperCase() : '';
    return '<span class="av ' + (cls || '') + '">' + (n ? esc(n) : ic('user')) + '</span>';
  }
  function toPlatform(hash) { try { if (INFRAME) { window.top.location.hash = hash; return; } } catch (e) {} location.href = '/' + hash; }

  /* ---------- patient ---------- */
  var BLANK = { name: '', ay: '', am: '', ad: '', sex: '', wt: '', ht: '', set: 'op', dx: '', course: 'acute', dur: '', durU: 'd', allergy: [], allergyTxt: '', cond: [], notes: '', lab: {}, fnd: {} };
  function fresh() { return Object.assign({}, BLANK, { allergy: [], cond: [], lab: {}, fnd: {} }); }
  var P = Object.assign(fresh(), get('ho-pt', {})); P.allergy = P.allergy || []; P.cond = P.cond || []; P.lab = P.lab || {}; P.fnd = P.fnd || {};
  if (P.na && !P.lab.na) P.lab.na = P.na; if (P.k && !P.lab.k) P.lab.k = P.k;
  function savePt() { P.na = P.lab.na || ''; P.k = P.lab.k || ''; put('ho-pt', P); }
  function hasAge() { return +P.ay > 0 || +P.am > 0 || +P.ad > 0; }
  function ready() { return hasAge() || +P.wt > 0; }
  function ageUnit() { return +P.ay > 0 ? 'y' : +P.am > 0 ? 'm' : +P.ad > 0 ? 'd' : (P.ageU || 'y'); }
  function ageTxt(p) {
    p = p || P; var m = E.ageMonths(p);
    if (!AR) return E.ageText(p);
    if (m < 1) { var dd = Math.round(E.dol(p)); return dd === 1 ? 'يوم واحد' : dd === 2 ? 'يومان' : dd <= 10 ? dd + ' أيام' : dd + ' يومًا'; }
    if (m < 24) return nice(Math.round(m * 10) / 10) + ' شهر';
    var y = Math.floor(m / 12), r = Math.round(m % 12); return y + ' سنة' + (r ? ' و' + r + ' شهر' : '');
  }
  function wtTxt() { if (!ready()) return ''; return nice(E.wt(P)) + ' kg'; }
  var ALLERGIES = [['penicillin', 'بنسلين', 'Penicillin'], ['cephalosporin', 'سيفالوسبورين', 'Cephalosporin'], ['macrolide', 'ماكرولايد', 'Macrolide'], ['sulfa', 'سلفا', 'Sulfa'],
    ['nsaid', 'مسكنات NSAID', 'NSAIDs'], ['quinolone', 'كينولون', 'Quinolone'], ['aminoglycoside', 'أمينوغلايكوسايد', 'Aminoglycoside']];
  var CONDS = [['asthma', 'ربو', 'Asthma'], ['g6pd', 'نقص G6PD', 'G6PD deficiency'], ['renal', 'مرض كلوي', 'Kidney disease'], ['liver', 'مرض كبدي', 'Liver disease'],
    ['jaundice', 'صفار', 'Jaundice'], ['sam', 'سوء تغذية حاد', 'Severe malnutrition'], ['cardiac', 'مرض قلبي', 'Heart disease'], ['dengue', 'حمى الضنك', 'Dengue'], ['preterm', 'خديج', 'Preterm']];
  var SETS = [['op', 'عيادة', 'Outpatient', 'user'], ['er', 'طوارئ', 'Emergency', 'bolt'], ['adm', 'تنويم', 'Admitted', 'hosp']];
  /* investigations the house officer can enter; lo / hi flag the result (paediatric reference ranges, general) */
  var LABS = [
    ['CBC', 'drop', [['hb', 'Hb', 'g/dL', 10, 18], ['wbc', 'WBC', '×10⁹/L', 4, 15], ['plt', 'Platelets', '×10⁹/L', 150, 450], ['neut', 'Neutrophils', '%', null, 75], ['lymph', 'Lymphocytes', '%', null, null]]],
    ['Electrolytes & kidney', 'kidney', [['na', 'Na', 'mmol/L', 135, 145], ['k', 'K', 'mmol/L', 3.5, 5.5], ['ca', 'Ca', 'mg/dL', 8.5, 10.5], ['urea', 'Urea', 'mg/dL', null, 40], ['cr', 'Creatinine', 'mg/dL', null, 1.2]]],
    ['Glucose & infection', 'flask', [['rbg', 'RBG', 'mg/dL', 54, 200], ['crp', 'CRP', 'mg/L', null, 10], ['esr', 'ESR', 'mm/h', null, 20], ['mal', 'Malaria (BFFM / MAT)', 'sel', ['', 'Positive', 'Negative']]]],
    ['Liver', 'gut', [['tsb', 'Total bilirubin', 'mg/dL', null, 1.2], ['dsb', 'Direct bilirubin', 'mg/dL', null, 0.3], ['alt', 'ALT', 'U/L', null, 45], ['alb', 'Albumin', 'g/dL', 3.5, null]]],
    ['Urine & stool', 'drop', [['ug', 'Urine general', 'fnd'], ['sg', 'Stool general', 'fnd']]],
    ['Imaging', 'eye', [['cxr', 'Chest X-ray', 'fnd'], ['us', 'Ultrasound', 'fnd'], ['echo', 'Echocardiography', 'fnd'], ['img', 'Other imaging', 'txt']]],
    ['Other tests', 'list', [['oth', 'Other results', 'txt']]]
  ];
  function labFlag(f, v) { if (v === '' || v == null || isNaN(+v)) return ''; v = +v; if (f[3] != null && v < f[3]) return 'lo'; if (f[4] != null && v > f[4]) return 'hi'; return 'ok'; }
  function labsEntered() {
    var out = [];
    LABS.forEach(function (g) { g[2].forEach(function (f) { if (f[2] === 'fnd') { if ((P.fnd[f[0]] || []).length) out.push({ f: f, v: P.fnd[f[0]].join(', '), flag: '' }); if (!P.lab[f[0]]) return; } var v = P.lab[f[0]]; if (v === '' || v == null) return; out.push({ f: f, v: v, flag: f[2] === 'txt' || f[2] === 'sel' ? (v === 'Positive' ? 'hi' : '') : labFlag(f, v) }); }); });
    return out;
  }

  /* ---------- investigation findings (owner, 28 Nov 2026: "a list to pick from … the app will consider these investigations to help with the
     diagnosis or management plan, not just as useless info"). Each finding: [id, English, Arabic, {condition: weight 1–3}, what to do, page] ---------- */
  var FIND = {
    ug: [['normal', 'Normal', 'طبيعي', {}],
      ['pus', 'Pus cells > 5/HPF', 'صديد > 5', { uti: 3 }, 'Send a urine culture before the first antibiotic dose.', 'c/uti'],
      ['nitrite', 'Nitrite positive', 'نيتريت موجب', { uti: 3 }, 'Nitrite is specific for a urinary infection: treat as UTI.', 'c/uti'],
      ['le', 'Leucocyte esterase positive', 'إستيراز الكريات البيضاء موجب', { uti: 2 }],
      ['bact', 'Bacteria seen', 'بكتيريا', { uti: 1 }],
      ['rbc', 'RBCs (haematuria)', 'كريات حمراء', { agn: 2, schisto: 2, uti: 1, hus: 1 }, 'Haematuria: check the blood pressure and look for oedema (nephritis) and a history of contact with river water (schistosomiasis).'],
      ['casts', 'RBC casts', 'أسطوانات كريات حمراء', { agn: 3 }, 'RBC casts mean glomerulonephritis: blood pressure, urea, creatinine, fluid balance.', 'c/agn'],
      ['prot3', 'Protein +++ (heavy)', 'بروتين +++', { nephrotic: 3, agn: 1 }, 'Heavy proteinuria: check serum albumin and cholesterol (nephrotic syndrome).', 'c/nephrotic'],
      ['prot1', 'Protein + / ++', 'بروتين + / ++', { agn: 1, nephrotic: 1, uti: 1 }],
      ['glu', 'Glucose positive', 'سكر موجب', { dka: 2 }, 'Glucose in the urine: check the blood glucose now.'],
      ['ket', 'Ketones positive', 'كيتونات موجبة', { dka: 2, ge: 1 }, 'Ketones with high blood glucose = DKA until proven otherwise: blood gas and electrolytes now.', 'c/dka'],
      ['sh', 'S. haematobium ova', 'بويضات البلهارسيا البولية', { schisto: 3 }, 'Treat schistosomiasis (praziquantel).', 'c/schisto']],
    sg: [['normal', 'Normal', 'طبيعي', {}],
      ['pus', 'Pus cells', 'صديد', { dysentery: 2, ge: 1 }],
      ['rbc', 'RBCs', 'كريات حمراء', { dysentery: 2 }, 'Blood in the stool: treat as dysentery.', 'c/dysentery'],
      ['troph', 'E. histolytica trophozoites', 'أطوار متحركة للأميبا', { dysentery: 3 }, 'Amoebic dysentery: metronidazole (Dysentery → Amoebic).', 'c/dysentery/amoeba'],
      ['cyst', 'E. histolytica cysts only', 'أكياس الأميبا فقط', { dysentery: 1 }, 'Cysts alone in a child without bloody diarrhoea may be carriage: treat only if symptomatic.'],
      ['giardia', 'Giardia', 'جيارديا', { giardia: 3 }, 'Treat giardiasis.', 'c/giardia'],
      ['ova', 'Worm ova (Ascaris, hookworm, H. nana)', 'بويضات ديدان', { worms: 3, ida: 1 }, 'Deworm (Worms plan); hookworm also causes iron-deficiency anaemia.', 'c/worms'],
      ['sm', 'S. mansoni ova', 'بويضات البلهارسيا المعوية', { schisto: 3 }, 'Treat schistosomiasis (praziquantel).', 'c/schisto'],
      ['reducing', 'Reducing substances', 'مواد مختزلة', { ge: 1 }, 'Reducing substances after gastroenteritis: lactose intolerance is likely; it settles with time.']],
    cxr: [['normal', 'Normal', 'طبيعي', {}],
      ['lobar', 'Lobar consolidation', 'تصلّب فص', { pneumonia: 3 }, 'Lobar consolidation = bacterial pneumonia: antibiotics.', 'c/pneumonia'],
      ['patchy', 'Patchy infiltrates (bronchopneumonia)', 'ارتشاحات متفرقة', { pneumonia: 2, bronchiolitis: 1 }],
      ['hyper', 'Hyperinflation', 'انتفاخ الرئة', { bronchiolitis: 2, asthma: 2, bpwheeze: 2 }],
      ['effusion', 'Pleural effusion', 'انصباب جنبي', { pneumonia: 2 }, 'Effusion: senior review for a diagnostic tap; pus (empyema) needs a chest drain.'],
      ['ptx', 'Pneumothorax', 'استرواح صدري', {}, 'Pneumothorax: urgent senior review; a tension pneumothorax needs immediate needle decompression.'],
      ['cardio', 'Cardiomegaly', 'تضخم القلب', { hf: 3, myocarditis: 2, rhd: 2, rf: 1 }, 'Cardiomegaly: echocardiography and ECG.'],
      ['oedema', 'Pulmonary oedema / plethora', 'وذمة رئوية', { hf: 3 }, 'Pulmonary oedema: furosemide and fluid restriction (Heart failure plan).', 'c/hf'],
      ['rds', 'Ground-glass, air bronchogram (newborn)', 'زجاج مصنفر عند حديث الولادة', { rdsneo: 3 }, 'Respiratory distress syndrome: oxygen or CPAP.', 'c/rdsneo'],
      ['kero', 'Basal shadowing after kerosene', 'ظلال قاعدية بعد الكيروسين', { kerosene: 3 }, 'Chemical pneumonitis: no vomiting, no gastric lavage.', 'c/kerosene']],
    us: [['normal', 'Normal', 'طبيعي', {}],
      ['hepato', 'Hepatomegaly', 'تضخم الكبد', { hepatitis: 1, hf: 1, malaria: 1 }],
      ['spleno', 'Splenomegaly', 'تضخم الطحال', { malaria: 2, scdother: 1 }],
      ['ascites', 'Ascites', 'استسقاء', { nephrotic: 2 }],
      ['kidneys', 'Enlarged echogenic kidneys', 'كلى متضخمة شديدة الصدى', { agn: 1, nephrotic: 1, aki: 1, hus: 1 }],
      ['hydro', 'Hydronephrosis', 'استسقاء الكلى', { uti: 1 }, 'Hydronephrosis: treat the infection, then refer to paediatric surgery/urology.'],
      ['bladder', 'Bladder wall thickening / polyps', 'سماكة جدار المثانة', { schisto: 2 }],
      ['target', 'Target sign (intussusception)', 'علامة الهدف (انغلاف)', {}, 'Intussusception is a surgical emergency: nil by mouth, IV fluids, urgent surgical referral.'],
      ['ivh', 'Intraventricular haemorrhage (cranial US)', 'نزف داخل البطين', { ivh: 3 }, 'IVH: measure the head circumference daily; senior review.', 'c/ivh'],
      ['lymph', 'Enlarged lymph nodes / abscess', 'غدد متضخمة أو خراج', { lymphadenitis: 2 }]],
    echo: [['normal', 'Normal', 'طبيعي', {}],
      ['dilated', 'Dilated left ventricle, poor function', 'توسع البطين وضعف الانقباض', { myocarditis: 3, hf: 2 }, 'Poor function: heart failure treatment; avoid fluid boluses.', 'c/hf'],
      ['valve', 'Mitral/aortic valve disease', 'مرض الصمام', { rhd: 3, rf: 2 }, 'Valve disease: rheumatic heart disease; secondary prophylaxis with benzathine penicillin.', 'c/rhd'],
      ['carditis', 'Carditis / new regurgitation', 'التهاب القلب', { rf: 3 }, 'Acute rheumatic fever with carditis.', 'c/rf'],
      ['veg', 'Vegetation', 'تنبتات', { ie: 3 }, 'Endocarditis: three blood cultures before antibiotics.', 'c/ie'],
      ['peric', 'Pericardial effusion', 'انصباب تامور', {}, 'Pericardial effusion: senior/cardiology review; tamponade needs urgent drainage.'],
      ['chd', 'Congenital heart defect (VSD, PDA …)', 'عيب خلقي في القلب', { hf: 2 }, 'Congenital heart disease: heart failure treatment if symptomatic; refer to paediatric cardiology.']]
  };
  /* numbers that change the diagnosis or the plan */
  function labFacts() {
    var L = P.lab, n = function (k) { var v = L[k]; return v === '' || v == null || isNaN(+v) ? null : +v; }, out = [], neo = hasAge() && E.isNeo(P);
    function f(t, dx, note, go) { out.push({ t: t, dx: dx || {}, note: note, go: go }); }
    var hb = n('hb'); if (hb != null && hb < 5) f('Hb ' + hb + ' g/dL', { ida: 3, sevmalaria: 1 }, 'Hb < 5 g/dL: transfuse (Severe anaemia plan); no IV fluid before the transfusion.', 'c/ida/sev'); else if (hb != null && hb < 10) f('Hb ' + hb + ' g/dL', { ida: 2, malaria: 1 });
    var wbc = n('wbc'); if (wbc != null && wbc > 15) f('WBC ' + wbc, { pneumonia: 1, uti: 1, neosepsis: neo ? 2 : 0, meningitis: 1 }, 'High WBC supports a bacterial infection.');
    var plt = n('plt'); if (plt != null && plt < 50) f('Platelets ' + plt, { dengue: 2, sevmalaria: 1, hus: 2 }, 'Platelets < 50: avoid IM injections and NSAIDs (ibuprofen, diclofenac).'); else if (plt != null && plt < 150) f('Platelets ' + plt, { dengue: 1, malaria: 1 });
    var na = n('na'); if (na != null && na < 130) f('Na ' + na, { ge: 1 }, 'Low sodium: calculate the deficit.', 'calc/na'); if (na != null && na > 150) f('Na ' + na, { hyperna: 3 }, 'High sodium: correct slowly over 48 hours (Hypernatraemia plan).', 'c/hyperna');
    var k = n('k'); if (k != null && k < 3.5) f('K ' + k, { ge: 1, dka: 1 }, 'Low potassium: potassium correction.', 'calc/k'); if (k != null && k > 5.5) f('K ' + k, { aki: 2 }, 'High potassium: ECG and senior review; stop potassium in the fluids.');
    var rbg = n('rbg'); if (rbg != null && rbg < 54) f('RBG ' + rbg + ' mg/dL', {}, 'Hypoglycaemia: give dextrose 10% now and recheck in 30 minutes.', 'calc/gir'); if (rbg != null && rbg > 200) f('RBG ' + rbg + ' mg/dL', { dka: 3 }, 'High glucose: check urine ketones and a blood gas (DKA?).', 'c/dka');
    var crp = n('crp'); if (crp != null && crp > 10) f('CRP ' + crp, { neosepsis: neo ? 2 : 0, pneumonia: 1, uti: 1, septicarth: 1 }, 'Raised CRP supports a bacterial infection.');
    var ur = n('urea'), cr = n('cr'); if ((ur != null && ur > 40) || (cr != null && cr > 1.2)) f('Urea/creatinine raised', { aki: 3, agn: 1, hus: 2 }, 'Raised urea/creatinine: measure urine output; adjust or avoid kidney-cleared drugs (gentamicin).', 'c/aki');
    if (L.mal === 'Positive') f('Malaria positive', { malaria: 3, sevmalaria: 2, congmal: neo ? 3 : 0 }, 'Malaria: Severe malaria plan if any danger sign, otherwise oral treatment.', 'c/malaria');
    var tsb = n('tsb'); if (tsb != null && tsb > (neo ? 5 : 1.2)) f('Bilirubin ' + tsb + ' mg/dL', neo ? { nnj: 3 } : { hepatitis: 2, malaria: 1 }, neo ? 'Plot it on the phototherapy chart for age in hours.' : 'Jaundice: hepatitis or haemolysis.', neo ? 'c/nnj' : 'c/hepatitis');
    var alt = n('alt'); if (alt != null && alt > 100) f('ALT ' + alt, { hepatitis: 3, dengue: 1 });
    var alb = n('alb'); if (alb != null && alb < 2.5) f('Albumin ' + alb + ' g/dL', { nephrotic: 2, sam: 1 });
    return out;
  }
  function invFacts() {
    var out = labFacts();
    Object.keys(FIND).forEach(function (t) { (P.fnd[t] || []).forEach(function (id) {
      var x = FIND[t].find(function (y) { return y[0] === id; }); if (x && id !== 'normal') out.push({ t: x[1], ar: x[2], dx: x[3] || {}, note: x[4], go: x[5], test: t });
    }); });
    return out;
  }
  /* conditions the results point to, strongest first */
  function invRank() {
    var sc = {}, why = {};
    invFacts().forEach(function (f) { Object.keys(f.dx).forEach(function (c) { if (!f.dx[c] || !byId[c]) return; sc[c] = (sc[c] || 0) + f.dx[c]; (why[c] = why[c] || []).push(f.t); }); });
    return Object.keys(sc).map(function (c) { return { c: byId[c], s: sc[c], why: why[c] }; }).sort(function (a, b) { return b.s - a.s; });
  }
  function factList(F) {
    return F.filter(function (f) { return f.note; }).map(function (f) { return '<div class="ivn"><b dir="ltr">' + esc(f.t) + '</b><span dir="ltr">' + esc(f.note) + '</span>' + (f.go ? '<button class="fp-d go" data-go="' + f.go + '">' + A('افتح', 'Open') + '</button>' : '') + '</div>'; }).join('');
  }
  /* «What the results suggest» under the results on the Patient page */
  function invSuggest() {
    var F = invFacts(); if (!F.length) return '';
    var R = invRank().slice(0, 4);
    return '<section class="card ivs"><h3 class="fp-h">' + ic('flask') + T('What the results suggest') + '</h3>' +
      (R.length ? '<div class="ivr">' + R.map(function (r) { return '<button class="ivc" data-go="c/' + r.c.id + '">' + T(r.c.t) + '<small dir="ltr">' + esc(r.why.join(' · ')) + '</small></button>'; }).join('') + '</div>' : '') +
      factList(F) + '</section>';
  }
  /* on the plan page: what the results mean for THIS plan, and a warning when they point elsewhere */
  function resCard(c) {
    var F = invFacts(); if (!F.length) return '';
    var R = invRank(), mine = F.filter(function (f) { return f.dx[c.id]; }), cs = (R.find(function (x) { return x.c.id === c.id; }) || { s: 0 }).s, other = R.filter(function (r) { return r.c.id !== c.id && r.s >= 3 && r.s >= 2 * cs; })[0];
    var chips = F.map(function (f) { return '<span class="' + (f.dx[c.id] ? 'fit' : '') + '" dir="ltr">' + esc(f.t) + '</span>'; }).join('');
    return '<section class="card ivs"><h3 class="fp-h">' + ic('flask') + T('Your results') + '</h3><div class="ivchips">' + chips + '</div>' +
      (mine.length ? '<div class="ivn ok"><span>' + A('تدعم هذا التشخيص: ', 'Support this diagnosis: ') + '<b dir="ltr">' + esc(mine.map(function (f) { return f.t; }).join(', ')) + '</b></span></div>' : '') +
      (other ? '<div class="ivn warn"><span>' + A('النتائج تشير أكثر إلى ', 'The results point more to ') + T(other.c.t) + ' <small dir="ltr">(' + esc(other.why.join(' · ')) + ')</small></span><button class="fp-d go" data-go="c/' + other.c.id + '">' + A('افتح', 'Open') + '</button></div>' : '') +
      factList(F) + '</section>';
  }
  function lbl(list, id) { var x = list.find(function (a) { return a[0] === id; }); return x ? A(x[1], x[2]) : id; }

  /* ---------- router and frame ---------- */
  function go(h) { if (location.hash.slice(1) === h) render(); else location.hash = h; }
  window.addEventListener('hashchange', function () { render(); });
  function route() { return location.hash.replace(/^#/, '').split('/'); }
  var NAV = [['', 'home', 'الرئيسية', 'Home'], ['patient', 'user', 'المريض', 'Patient'], ['conds', 'list', 'الأمراض', 'Conditions'], ['drugs', 'pill', 'الأدوية', 'Drugs'], ['calc', 'medkit', 'الأدوات', 'Tools']];
  var THEMES = ['light', 'dark', 'eye'];
  function themeNow() { return document.documentElement.dataset.theme || 'light'; }
  /* the owner's design (27 Nov 2026): menu · SMRA logo with «HO Guide» · look · profile; inner pages get a title bar with a back button */
  function head(title, sub, opt) {
    opt = opt || {};
    var r = route()[0], home = !r, th = themeNow();
    $('#hb').innerHTML = '<div class="hb-s"><button class="sqb" data-act="menu" aria-label="' + A('القائمة', 'Menu') + '">' + ic('menu') + '</button><i class="hb-dv"></i></div>' +
      '<a class="hb-logo" data-go="" aria-label="HO Guide"><img src="img/logo-smra.webp" alt="SMRA" width="480" height="172"><span class="hb-sub">HO Guide</span></a>' +
      '<div class="hb-s end"><i class="hb-dv"></i><button class="rdb bellb" data-act="notes" aria-label="' + A('الإشعارات', 'Notifications') + '">' + ic('bell') + (unread() ? '<i class="bdg">' + Math.min(unread(), 9) + '</i>' : '') + '</button>' +
      '<button class="hb-me" data-act="profile" aria-label="' + A('الحساب', 'Account') + '">' + avatar() + '</button></div>';
    var cur = { c: 'conds', drug: 'drugs', dx: 'conds', rx: 'patient', orders: 'patient', saved: 'patient', emerg: 'calc', settings: '' }[r]; if (cur == null) cur = r;
    /* phones: the five tabs at the bottom; computers (owner, 28 Nov 2026: "the screen is not filling"): the same bar becomes a side menu
       with the logo, the five sections, the rest of the ☰ menu and «Back to SMRA» (the .dk items show only there) */
    var navIds = NAV.map(function (n) { return n[0]; });
    $('#bn').innerHTML = '<a class="bn-brand dk" data-go="" aria-label="HO Guide"><img src="img/logo-smra.webp" alt="SMRA" width="1000" height="359"><span class="hb-tag"><i></i><b>HO Guide</b><i></i></span></a>' +
      NAV.map(function (n) { return '<button data-go="' + n[0] + '" class="' + (cur === n[0] ? 'on' : '') + '">' + ic(n[1]) + '<span>' + A(n[2], n[3]) + '</span></button>'; }).join('') +
      '<i class="bn-sep dk"></i>' +
      MENU.filter(function (m) { return navIds.indexOf(m[0]) < 0; }).map(function (m) { return '<button data-go="' + m[0] + '" class="dk' + (r === m[0] ? ' on2' : '') + '">' + ic(m[1]) + '<span>' + A(m[2], m[3]) + '</span></button>'; }).join('') +
      '<button class="dk bn-back" data-act="toSMRA">' + ic('back') + '<span>' + A('العودة إلى منصة SMRA', 'Back to SMRA') + '</span></button>';
    $('#ph').innerHTML = home ? '' : '<div class="pbar"><button class="sqb sm" data-act="back" aria-label="' + A('رجوع', 'Back') + '">' + ic('back') + '</button><div class="pbar-t"><h1>' + T(title) + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div></div>' +
      (opt.strip !== false && !/^(patient|settings)$/.test(r) ? ptStrip() : '');
    document.title = title + ' · HO Guide';
  }
  function ptStrip() {
    var c = P.dx && byId[P.dx];
    if (!ready()) return '<button class="pts empty" data-go="patient"><span class="ib2">' + ic('userplus') + '</span><span class="pts-t"><b>' + T('New patient') + '</b><small>' + A('أدخل بيانات المريض لتُحسب الجرعات', 'Enter the patient to calculate doses') + '</small></span>' + ic('fwd', 'chv') + '</button>';
    return '<button class="pts" data-go="patient"><span class="ib2">' + ic('baby') + '</span><span class="pts-t"><b dir="auto">' + esc(P.name || A('المريض الحالي', 'Current patient')) + '</b><small>' +
      [hasAge() ? ageTxt() : '', '<bdi dir="ltr">' + wtTxt() + '</bdi>' + (+P.wt > 0 ? '' : ' ' + A('(تقديري)', '(est.)')), c ? '<bdi dir="ltr">' + esc(c.t) + '</bdi>' : ''].filter(Boolean).join(' · ') + '</small></span><span class="pts-e">' + ic('edit') + '</span></button>';
  }
  /* side menu (the ☰ button) */
  var MENU = [['', 'home', 'الرئيسية', 'Home'], ['patient', 'userplus', 'المريض', 'Patient'], ['dx', 'stetho2', 'التشخيص من الأعراض', 'Diagnose'], ['conds', 'clip', 'الأمراض وخطط العلاج', 'Conditions'],
    ['drugs', 'pill2', 'كتاب الأدوية', 'Drug book'], ['calc', 'calc2', 'الحاسبات والسوائل', 'Calculators'], ['emerg', 'siren', 'جرعات الطوارئ', 'Emergency doses'], ['rx', 'rx', 'الوصفة', 'Prescription'],
    ['orders', 'hosp', 'أوامر التنويم', 'Order sheet'], ['saved', 'bmark', 'المرضى المحفوظون', 'Saved patients'], ['settings', 'gear2', 'الإعدادات', 'Settings']];
  var ACT = {};
  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); go(g.getAttribute('data-go')); return; }
    var a = e.target.closest('[data-act]'); if (a && ACT[a.getAttribute('data-act')]) { e.preventDefault(); ACT[a.getAttribute('data-act')](a, e); }
  });
  ACT.back = function () { if (history.length > 1) history.back(); else go(''); };
  ACT.toSMRA = function () { closeSheet(); toPlatform('#home'); };
  ACT.menu = function () {
    var r = route()[0], s = $('#sheet');
    s.innerHTML = '<div class="sh-bg" data-act="shclose"></div><nav class="drawer"><div class="dr-h"><img src="img/logo-smra.webp" alt="SMRA"><span class="hb-tag"><i></i><b>HO Guide</b><i></i></span></div>' +
      MENU.map(function (m) { return '<button class="' + (r === m[0] ? 'on' : '') + '" data-go="' + m[0] + '"><span class="ib2">' + ic(m[1]) + '</span><span>' + A(m[2], m[3]) + '</span></button>'; }).join('') +
      '<button data-act="toSMRA"><span class="ib2">' + ic('back') + '</span><span>' + A('العودة إلى منصة SMRA', 'Back to SMRA') + '</span></button></nav>';
    s.hidden = false;
  };
  ACT.theme = function () { var t = THEMES[(THEMES.indexOf(themeNow()) + 1) % 3]; setTheme(t); toast({ light: A('المظهر النهاري', 'Day'), dark: A('المظهر الليلي', 'Night'), eye: A('راحة العين', 'Eye comfort') }[t]); };
  function setTheme(t) { put('ish-theme', t); var x = t === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : t; document.documentElement.dataset.theme = x; render(true); }
  ACT.profile = function () {
    var m = me();
    sheet('<div class="prof">' + avatar('big') + '<b dir="auto">' + esc(m ? m.name : A('غير مسجّل الدخول', 'Not signed in')) + '</b><small>' + A('حساب SMRA', 'SMRA account') + '</small></div>' +
      '<div class="menu">' + (m ? '<button data-act="goAcc">' + ic('user') + '<span>' + A('ملفي في SMRA', 'My SMRA profile') + '</span>' + ic('fwd', 'flip') + '</button>' :
        '<button data-act="goIn">' + ic('user') + '<span>' + A('تسجيل الدخول إلى SMRA', 'Sign in to SMRA') + '</span>' + ic('fwd', 'flip') + '</button>') +
      '<button data-act="goSaved">' + ic('save') + '<span>' + A('المرضى المحفوظون', 'Saved patients') + '</span><em>' + get('ho-pts', []).length + '</em></button>' +
      '<button data-act="goSet">' + ic('gear') + '<span>' + A('الإعدادات', 'Settings') + '</span>' + ic('fwd', 'flip') + '</button>' +
      '<button data-act="toSMRA">' + ic('home') + '<span>' + A('العودة إلى منصة SMRA', 'Back to SMRA') + '</span>' + ic('fwd', 'flip') + '</button></div>');
  };
  ACT.goAcc = function () { closeSheet(); toPlatform('#account'); };
  ACT.goIn = function () { closeSheet(); toPlatform('#pick'); };
  ACT.goSaved = function () { closeSheet(); go('saved'); };
  ACT.goSet = function () { closeSheet(); go('settings'); };

  /* ---------- notifications (owner, 28 Nov 2026: like the Permanent Exam) ---------- */
  var NOTES = null, AC = null;
  function seenAt() { return get('ho-nseen', ''); }
  function unread() { var s = seenAt(); return (NOTES || []).filter(function (n) { return String(n.at) > s; }).length; }
  function soundOn() { return !get('ho-snd-off', 0); }
  document.addEventListener('pointerdown', function () { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) {} }, { passive: true });
  function chime() {
    if (!soundOn() || !AC) return;
    try { var t = AC.currentTime; [784, 1047, 1319].forEach(function (f, i) { var o = AC.createOscillator(), g = AC.createGain(), s = t + i * 0.14; o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.25, s + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.4); o.connect(g); g.connect(AC.destination); o.start(s); o.stop(s + 0.45); });
      if (navigator.vibrate) navigator.vibrate(60); } catch (e) {}
  }
  function toTop(m) { try { if (INFRAME) window.parent.postMessage(m, '*'); } catch (e) {} }
  function gotNotes(list) {
    var first = NOTES === null, known = {}; (NOTES || []).forEach(function (n) { known[n.id] = 1; });
    var fresh = first ? [] : list.filter(function (n) { return !known[n.id] && String(n.at) > seenAt(); });
    NOTES = list;
    if (fresh.length) { chime(); toast('🔔 ' + fresh[0].t + (fresh.length > 1 ? ' (+' + (fresh.length - 1) + ')' : '')); }
    var b = document.querySelector('.bellb'); if (b) { var c = unread(), i = b.querySelector('.bdg'); if (c) { if (!i) { i = document.createElement('i'); i.className = 'bdg'; b.appendChild(i); } i.textContent = Math.min(c, 9); } else if (i) i.remove(); }
    if (document.querySelector('#sheet:not([hidden]) .nlist')) ACT.notes(true);
  }
  window.addEventListener('message', function (ev) { var d = ev.data; if (d && d.ho === 'notes') gotNotes(d.list || []); });
  if (INFRAME) setTimeout(function () { toTop({ ho: 'notes' }); }, 1500);
  function agoT(at) { var m = Math.max(1, Math.round((Date.now() - new Date(at)) / 60000)); return m < 60 ? A('قبل ' + m + ' د', m + ' min ago') : m < 1440 ? A('قبل ' + Math.round(m / 60) + ' س', Math.round(m / 60) + ' h ago') : new Date(at).toLocaleDateString(A('ar-EG', 'en-GB'), { day: 'numeric', month: 'short' }); }
  ACT.notes = function (keep) {
    if (keep !== true) toTop({ ho: 'notes' });
    var s = seenAt(), list = NOTES || [];
    sheet('<div class="sh-head"><h2 class="ch">' + ic('bell') + A('الإشعارات', 'Notifications') + '</h2><button class="snd ' + (soundOn() ? 'on' : '') + '" data-act="sndtog">' + A(soundOn() ? '🔔 الصوت مفعّل' : '🔕 الصوت متوقف', soundOn() ? '🔔 Sound on' : '🔕 Sound off') + '</button></div>' +
      '<p class="nsub">' + A('جديد طبيب الامتياز وإشعاراتك الخاصة', 'House Officer news and your own notifications') + '</p>' +
      (NOTES === null ? '<p class="nempty">' + A(INFRAME ? 'جارٍ التحميل…' : 'افتح الدليل من داخل منصة SMRA لتصلك الإشعارات.', INFRAME ? 'Loading…' : 'Open the guide inside SMRA to get notifications.') + '</p>' : list.length ? '<div class="nlist">' + list.map(function (n) {
        return '<button class="nitem' + (String(n.at) > s ? ' new' : '') + '" data-act="nopen" data-l="' + esc(n.link) + '"><span class="ndot"></span><span class="ntx"><b dir="auto">' + esc(n.t) + '</b>' + (n.b ? '<span dir="auto">' + esc(n.b) + '</span>' : '') + '<small>' + agoT(n.at) + '</small></span></button>';
      }).join('') + '</div>' : '<p class="nempty">' + A('لا توجد إشعارات بعد.', 'No notifications yet.') + '</p>'));
    if (list[0]) put('ho-nseen', String(list[0].at));
    var bd = document.querySelector('.bellb .bdg'); if (bd) bd.remove();
  };
  ACT.sndtog = function () { put('ho-snd-off', soundOn() ? 1 : 0); if (soundOn()) chime(); ACT.notes(true); };
  ACT.nopen = function (el) { closeSheet(); if (el.dataset.l) toPlatform(el.dataset.l.charAt(0) === '#' ? el.dataset.l : '#' + el.dataset.l); };
  function toast(t) { var x = $('#toast'); x.textContent = t; x.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { x.hidden = true; }, 2200); }
  function sheet(html) { var s = $('#sheet'); s.innerHTML = '<div class="sh-bg" data-act="shclose"></div><div class="sh-box"><i class="sh-grip"></i>' + html + '</div>'; s.hidden = false; }
  function closeSheet() { $('#sheet').hidden = true; }
  ACT.shclose = closeSheet;
  function disc() { return '<p class="disc">' + ic('shield') + '<span>' + A('أداة مساعدة مبنية على الأدلة العلاجية المحلية (local guidelines). راجع الجرعة مع النائب أو الصيدلي قبل الإعطاء.', 'Decision support built on local guidelines. Check every dose with your senior or the pharmacist before giving it.') + '</span></p>'; }
  function sec(title, icn, body, cls, extra) { return '<section class="card ' + (cls || '') + '"><h2 class="ch">' + (icn ? '<span class="chi">' + ic(icn) + '</span>' : '') + T(title) + (extra || '') + '</h2>' + body + '</section>'; }
  function seg(list, cur, act) {
    return '<div class="seg">' + list.map(function (x) { return '<button type="button" class="' + (String(cur) === String(x[0]) ? 'on' : '') + '" data-act="' + act + '" data-v="' + x[0] + '">' + (x[3] ? ic(x[3]) : '') + '<span>' + A(x[1], x[2]) + '</span></button>'; }).join('') + '</div>';
  }
  function opts(from, to, step, cur, fmt) { var h = '<option value="">—</option>'; for (var v = from; v <= to + 1e-9; v = Math.round((v + step) * 100) / 100) h += '<option value="' + v + '"' + (String(cur) !== '' && +cur === v ? ' selected' : '') + '>' + (fmt ? fmt(v) : v) + '</option>'; return h; }
  /* weight in one list: 0.5–10 kg by 0.1, 10–30 by 0.5, 30–90 by 1 */
  function wtOpts(cur) {
    var h = '<option value="">—</option>', c = +cur, v;
    function o(x) { var s = String(Math.round(x * 10) / 10); h += '<option value="' + s + '"' + (c && Math.abs(c - x) < 0.05 ? ' selected' : '') + '>' + s + '</option>'; }
    for (v = 0.5; v < 10; v += 0.1) o(v); for (v = 10; v < 30; v += 0.5) o(v); for (v = 30; v <= 90; v += 1) o(v);
    return h;
  }
  function ageVals(u, cur) { return u === 'd' ? opts(1, 28, 1, cur) : u === 'm' ? opts(1, 23, 1, cur) : opts(1, 17, 1, cur); }
  function ageField(attr, req) {
    var u = ageUnit(), v = u === 'y' ? P.ay : u === 'm' ? P.am : P.ad;
    return '<div class="fld"><span>' + A('العمر', 'Age') + (req ? ' <i class="req">*</i>' : '') + '</span><div class="inp pick two"><select ' + attr + '="agev" dir="ltr">' + ageVals(u, v) + '</select>' +
      '<select ' + attr + '="ageu" class="unit">' + [['d', 'يوم', 'days'], ['m', 'شهر', 'months'], ['y', 'سنة', 'years']].map(function (x) { return '<option value="' + x[0] + '"' + (u === x[0] ? ' selected' : '') + '>' + A(x[1], x[2]) + '</option>'; }).join('') + '</select></div></div>';
  }
  function wtField(attr, req) { return '<div class="fld"><span>' + A('الوزن', 'Weight') + (req ? ' <i class="req">*</i>' : '') + '</span><div class="inp pick"><select ' + attr + '="wt" dir="ltr">' + wtOpts(P.wt) + '</select><em>kg</em></div></div>'; }

  /* a small age and weight picker shown wherever doses need a patient (owner: "where does a person put age and weight?") */
  function quickPt() {
    return '<section class="card qpt" id="qpt"><h2 class="ch"><span class="chi">' + ic('baby') + '</span>' + T('Age & weight') + '</h2><p class="hint">' + (hasAge() && !(+P.wt > 0) ? A('الجرعات الآن بالوزن التقديري ', 'Doses now use the estimated weight ') + '<b dir="ltr">' + nice(E.estWeight(P)) + ' kg</b>' + A('؛ اختر الوزن الحقيقي إن وُجد.', '; pick the real weight if you have it.') : A('اختر العمر والوزن وتظهر الجرعات هنا مباشرة.', 'Pick the age and weight; the doses appear here at once.')) + '</p>' +
      '<div class="flds">' + ageField('data-q') + wtField('data-q') + '</div>' +
      '<button class="lnk" data-go="patient">' + ic('user') + A('بيانات المريض الكاملة', 'Full patient details') + '</button></section>';
  }
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t.dataset || !t.dataset.q) return;
    var q = $('#qpt'), u = $('[data-q=ageu]', q).value, v = t.dataset.q === 'ageu' ? '' : $('[data-q=agev]', q).value;
    P.ageU = u; P.ay = u === 'y' ? v : ''; P.am = u === 'm' ? v : ''; P.ad = u === 'd' ? v : '';
    P.wt = $('[data-q=wt]', q).value;
    savePt(); var y = scrollY; render(true); scrollTo(0, y); if (ready() && t.dataset.q !== 'ageu') toast(A('حُسبت الجرعات', 'Doses calculated'));
  });
  /* ================= Home ================= */
  function greet() { var h = new Date().getHours(); return h < 12 ? A('صباح الخير', 'Good morning') : A('مساء الخير', 'Good evening'); }
  function home() {
    head('HO Guide', '');
    var c = P.dx && byId[P.dx], dn = drName();
    var h = '<section class="hero"><div class="hero-art" aria-hidden="true"></div><div class="hero-tx"><small>' + greet() + (AR ? '' : ',') + '</small><h2 dir="auto">' + esc(dn || A('دكتور', 'Doctor')) + '</h2><i class="hero-bar"></i><p>' +
      A('أدخل بيانات المريض مرة واحدة، وتجد خطة العلاج والجرعات والسوائل والوصفة جاهزة.', 'Enter the patient once so the plan, doses, fluids and prescription are ready.') + '</p></div></section>';
    if (ready()) {
      h += '<section class="npc"><span class="ib2 lg">' + ic('baby') + '</span><span class="npc-t"><b dir="auto">' + esc(P.name || A('المريض الحالي', 'Current patient')) + '</b><small>' +
        [hasAge() ? ageTxt() : '', '<bdi dir="ltr">' + wtTxt() + '</bdi>', c ? '<bdi dir="ltr">' + esc(c.t) + '</bdi>' : ''].filter(Boolean).join(' · ') + '</small>' +
        (P.allergy.length ? '<em class="npc-al">' + ic('alert') + P.allergy.map(function (a) { return lbl(ALLERGIES, a); }).join('، ') + '</em>' : '') + '</span>' +
        '<button class="go-btn" data-go="' + (c ? 'c/' + c.id : 'patient') + '">' + (c ? A('الخطة', 'Plan') : A('أكمل', 'Next')) + ic('fwd') + '</button></section>' +
        '<div class="npc-acts"><button data-go="patient">' + ic('edit') + A('تعديل المريض', 'Edit patient') + '</button><button data-go="rx">' + ic('rx') + A('الوصفة', 'Prescription') + '</button><button data-act="newpt">' + ic('userplus') + A('مريض جديد', 'New patient') + '</button></div>';
    } else {
      h += '<section class="npc"><span class="ib2 lg">' + ic('userplus') + '</span><span class="npc-t"><b>' + T('New patient') + '</b><small>' + A('ابدأ بالاسم والعمر والوزن، وأي حساسية من الأدوية.', 'Start with the name, age, weight, and any drug allergy.') + '</small></span>' +
        '<button class="go-btn" data-go="patient">' + A('ابدأ', 'Start') + ic('fwd') + '</button></section>';
    }
    var tools = [['dx', 'stetho2', 'Diagnose', 'من الأعراض والعلامات', 'From symptoms and signs'], ['conds', 'clip', 'Conditions', DX.length + ' حالة بخطط علاجها', DX.length + ' conditions with plans'],
      ['drugs', 'pill2', 'Drug book', Object.keys(DR).length + ' دواء بجرعاتها', Object.keys(DR).length + ' drugs with doses'], ['calc', 'calc2', 'Calculators', 'السوائل والأملاح والمعادلات', 'Fluids, electrolytes, formulas']];
    h += '<h2 class="st">' + T('Quick tools') + '</h2><div class="qt">' + tools.map(function (t) {
      return '<button class="tool" data-go="' + t[0] + '"><span class="ib2 lg">' + ic(t[1]) + '</span><span class="tool-t"><b>' + T(t[2]) + '</b><small>' + A(t[3], t[4]) + '</small></span>' + ic('fwd', 'chv') + '</button>';
    }).join('') + '</div>';
    h += '<button class="emg" data-go="emerg"><span class="emg-i">' + ic('siren') + '</span><span class="emg-t"><b>' + T('Emergency doses') + '</b><small>' +
      (ready() ? A('محسوبة لوزن ', 'Calculated for ') + '<bdi dir="ltr">' + wtTxt() + '</bdi>' : A('كل جرعات الطوارئ بالوزن', 'Every emergency dose by weight')) + '</small></span><span class="emg-go">' + ic('fwd') + '</span></button>';
    var rec = get('ho-recent', []).filter(function (id) { return byId[id]; }).slice(0, 2);
    if (rec.length) h += '<h2 class="st rec-h">' + T('Recent') + '</h2>' + '<section class="card list recl rec">' + rec.map(function (id) { var c = byId[id]; return '<button class="lrow" data-go="c/' + id + '"><span class="lrow-i">' + ic(SYSIC[c.sys] || 'list') + '</span><span class="lrow-t">' + T(c.t) + '<small dir="ltr">' + esc((SYS[c.sys] || [''])[0]) + '</small></span>' + ic('fwd', 'flip') + '</button>'; }).join('') + '</section>';
    h += '<div class="minis"><button data-go="saved"><span class="mi">' + ic('bmark') + '<em>' + get('ho-pts', []).length + '</em></span><b>' + T('Saved') + '</b></button>' +
      '<button data-go="calc/dehyd"><span class="mi">' + ic('drop2') + '</span><b>' + T('Dehydration') + '</b></button>' +
      '<button data-go="settings"><span class="mi">' + ic('gear2') + '</span><b>' + T('Settings') + '</b></button></div>';
    return h;
  }
  /* ================= Patient ================= */
  function chips(list, sel, act) { return '<div class="chips">' + list.map(function (c) { return '<button type="button" class="chip' + (sel.indexOf(c[0]) >= 0 ? ' on' : '') + '" data-act="' + act + '" data-v="' + c[0] + '">' + A(c[1], c[2]) + '</button>'; }).join('') + '</div>'; }
  function pick(name, label, options, unit) { return '<label class="fld"><span>' + label + '</span><div class="inp pick"><select name="' + name + '" dir="ltr">' + options + '</select>' + (unit ? '<em>' + unit + '</em>' : '') + '</div></label>'; }
  function patient() {
    head('Patient', A('أدخل الأساسيات وخذ الخطة؛ الباقي اختياري', 'Enter the essentials and get the plan; the rest is optional'));
    var au = ageUnit(), av = au === 'y' ? P.ay : au === 'm' ? P.am : P.ad, est = hasAge() ? nice(E.estWeight(P)) : '', cur = P.dx && byId[P.dx];
    var nLab = labsEntered().length, more = !!(P.sex || P.ht || P.dur || P.cond.length || nLab || P.notes);
    var h = '<form id="ptf" autocomplete="off" novalidate><section class="card ess">';
    h += '<label class="fld"><span>' + A('اسم المريض', 'Patient name') + ' <i class="req">*</i></span><div class="inp"><input name="name" type="text" dir="auto" value="' + esc(P.name) + '" placeholder="' + A('الاسم الكامل', 'Full name') + '"></div></label>';
    h += '<div class="flds">' + ageField('name', 1) + wtField('name', 1) + '</div>' +
      (est && !(+P.wt > 0) ? '<button type="button" class="estb" data-act="useest">' + ic('calc') + '<span>' + A('لا يوجد ميزان؟ الوزن التقديري', 'No scale? Estimated weight') + ' <b dir="ltr">' + est + ' kg</b></span><em>' + A('استخدمه', 'Use it') + '</em></button>' : '');
    h += '<label class="fld"><span>' + A('التشخيص', 'Diagnosis') + ' <i class="req">*</i></span>' + '<input type="hidden" name="dxt" value="' + esc(cur ? cur.t : '') + '"><button type="button" class="pkb dxb" data-act="dxpick">' + (cur ? '<b dir="ltr">' + esc(cur.t) + '</b>' : '<span class="fndp">' + A('اختر التشخيص', 'Choose the diagnosis') + '</span>') + ic('fwd', 'chv') + '</button></label>' +
      '<button type="button" class="lnk" data-go="dx">' + ic('search') + A('لا تعرف التشخيص؟ ابدأ من الأعراض', 'Not sure? Start from the symptoms') + '</button>';
    h += '<div class="fld"><span>' + A('مكان العلاج', 'Setting') + '</span>' + seg(SETS.map(function (x) { return x.slice(0, 3); }), P.set, 'setset') + '</div>';
    h += '<div class="fld al"><span>' + A('حساسية من دواء', 'Drug allergy') + '</span>' + multiBtn('al') + '</div>';
    h += '</section>';
    h += '<div class="bar"><button class="btn pri" type="submit">' + ic('check') + A('أعطني خطة العلاج', 'Get the plan') + '</button><button class="btn sq" type="button" data-act="savept" aria-label="' + A('حفظ', 'Save') + '">' + ic('save') + '</button><button class="btn sq" type="button" data-act="newpt" aria-label="' + A('مريض جديد', 'New patient') + '">' + ic('plus') + '</button></div>';
    h += '<details class="card moreb"><summary><span class="chi">' + ic('plus') + '</span>' + A('تفاصيل إضافية (اختياري)', 'More details (optional)') + (nLab ? '<em class="cnt">' + nLab + '</em>' : '') + ic('fwd', 'chev') + '</summary>';
    h += '<div class="fld"><span>' + A('الجنس', 'Sex') + '</span>' + seg([['m', 'ذكر', 'Male'], ['f', 'أنثى', 'Female']], P.sex, 'setsex') + '</div>';
    h += '<div class="flds">' + pick('ht', A('الطول', 'Height'), opts(40, 190, 1, P.ht), 'cm') +
      '<div class="fld"><span>' + A('مدة الأعراض', 'Duration') + '</span><div class="inp pick two"><select name="dur" dir="ltr">' + opts(1, 30, 1, P.dur) + '</select><select name="durU">' +
      [['h', 'ساعات', 'hours'], ['d', 'أيام', 'days'], ['w', 'أسابيع', 'weeks'], ['mo', 'شهور', 'months'], ['y', 'سنوات', 'years']].map(function (u) { return '<option value="' + u[0] + '"' + (P.durU === u[0] ? ' selected' : '') + '>' + A(u[1], u[2]) + '</option>'; }).join('') + '</select></div></div></div>';
    h += '<div class="fld"><span>' + A('حالات تغيّر العلاج', 'Conditions that change treatment') + '</span>' + multiBtn('cd') + '</div>';
    h += '<div class="fld" style="margin-top:14px"><span>' + A('نتائج الفحوصات (إن وُجدت)', 'Investigation results (if any)') + '</span></div>' +
      LABS.map(function (g) {
        var cnt = g[2].filter(function (f) { return (P.lab[f[0]] !== '' && P.lab[f[0]] != null) || (P.fnd[f[0]] || []).length; }).length;
        return '<details class="lg"' + (cnt ? ' open' : '') + '><summary><span class="chi sm">' + ic(g[1]) + '</span>' + T(g[0]) + (cnt ? '<em class="cnt">' + cnt + '</em>' : '') + ic('fwd', 'chev') + '</summary><div class="flds' + (g[2][0][2] === 'txt' ? ' one' : '') + '">' +
          g[2].map(function (f) {
            var v = P.lab[f[0]] == null ? '' : P.lab[f[0]];
            /* one button per test; the findings open in a pop-up list (owner, 28 Nov 2026: "should come as a pop-up list") */
            if (f[2] === 'fnd') return '<div class="fld fndf"><span>' + T(f[1]) + '</span><button type="button" class="fndb" data-act="fndopen" data-t="' + f[0] + '">' + fndSum(f[0]) + ic('fwd', 'chv') + '</button></div>';
            if (f[2] === 'txt') return '<label class="fld"><span>' + T(f[1]) + '</span><div class="inp"><input data-lab="' + f[0] + '" type="text" dir="auto" value="' + esc(v) + '" placeholder="' + A('النتيجة', 'Result') + '"></div></label>';
            if (f[2] === 'sel') return '<label class="fld"><span>' + T(f[1]) + '</span><div class="inp pick"><select data-lab="' + f[0] + '" dir="ltr">' + f[3].map(function (o) { return '<option value="' + o + '"' + (v === o ? ' selected' : '') + '>' + (o || '—') + '</option>'; }).join('') + '</select></div></label>';
            /* numbers are chosen too (owner, 28 Nov 2026: "CBC … as a pop-up list, and Other to write it") */
            return '<div class="fld"><span>' + T(f[1]) + '</span><input type="hidden" data-lab="' + f[0] + '" value="' + esc(v) + '"><button type="button" class="pkb labb ' + labFlag(f, v) + '" data-act="labpick" data-k="' + f[0] + '">' + labTxt(f, v) + ic('fwd', 'chv') + '</button></div>';
          }).join('') + '</div></details>';
      }).join('') + '<div id="invsug">' + invSuggest() + '</div>';
    h += '<div class="fld" style="margin-top:14px"><span>' + A('ملاحظات', 'Notes') + '</span><textarea name="notes" rows="2" dir="auto">' + esc(P.notes) + '</textarea></div></details>';
    h += '</form>';
    return h;
  }
  function readForm() {
    var f = $('#ptf'); if (!f) return;
    P.name = f.name.value.trim(); P.allergyTxt = f.allergyTxt ? f.allergyTxt.value.trim() : P.allergyTxt; P.notes = f.notes ? f.notes.value.trim() : P.notes;
    var au = f.ageu.value, v = f.agev.value;
    P.ageU = au; P.ay = au === 'y' ? v : ''; P.am = au === 'm' ? v : ''; P.ad = au === 'd' ? v : '';
    P.wt = f.wt.value;
    P.ht = f.ht.value; P.dur = f.dur.value; P.durU = f.durU.value;
    $$('[data-lab]', f).forEach(function (x) { P.lab[x.dataset.lab] = x.value.trim(); });
    var t = f.dxt.value.trim().toLowerCase(); var m = DX.find(function (c) { return c.t.toLowerCase() === t; }) || (t ? DX.find(function (c) { return c.t.toLowerCase().indexOf(t) >= 0 || c.ar.indexOf(t) >= 0; }) : null);
    P.dx = m ? m.id : '';
    savePt();
  }
  function toggle(arr, v) { var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }
  function segOn(b) { $$('button', b.parentNode).forEach(function (x) { x.classList.toggle('on', x === b); }); }
  ACT.tglal = function (b) { readForm(); toggle(P.allergy, b.dataset.v); savePt(); b.classList.toggle('on'); };
  function fndSum(t) {
    var sel = (P.fnd[t] || []).map(function (id) { var x = FIND[t].find(function (y) { return y[0] === id; }); return x ? x[1] : ''; }).filter(Boolean);
    if (P.lab[t]) sel.push(P.lab[t]);
    return sel.length ? '<span class="fndv">' + sel.map(function (x) { return '<i dir="ltr">' + esc(x) + '</i>'; }).join('') + '</span>' : '<span class="fndp">' + A('اختر النتائج', 'Choose the findings') + '</span>';
  }
  /* ---------- every choice opens a pop-up list (owner, 28 Nov 2026: "make every place to choose as a pop-up list") ---------- */
  var MULTI = { al: [function () { return ALLERGIES; }, function () { return P.allergy; }, 'حساسية من دواء', 'Drug allergy'],
    cd: [function () { return CONDS; }, function () { return P.cond; }, 'حالات تغيّر العلاج', 'Conditions that change treatment'] };
  function multiBtn(k) {
    var m = MULTI[k], L = m[0](), sel = m[1]();
    var on = L.filter(function (c) { return sel.indexOf(c[0]) >= 0; }).map(function (c) { return '<i>' + esc(A(c[1], c[2])) + '</i>'; });
    if (k === 'al' && P.allergyTxt) on.push('<i dir="auto">' + esc(P.allergyTxt) + '</i>');
    return '<button type="button" class="fndb" data-act="mopen" data-k="' + k + '">' + (on.length ? '<span class="fndv">' + on.join('') + '</span>' : '<span class="fndp">' + A('لا يوجد — اضغط للاختيار', 'None — tap to choose') + '</span>') + ic('fwd', 'chv') + '</button>';
  }
  ACT.mopen = function (b) {
    readForm(); var k = b.dataset.k, m = MULTI[k], sel = m[1]();
    sheet('<h2 class="ch"><span class="chi">' + ic('list') + '</span>' + A(m[2], m[3]) + '</h2><div class="sxlist">' + m[0]().map(function (c) {
      return '<button class="alt' + (sel.indexOf(c[0]) >= 0 ? ' on' : '') + '" data-act="mtgl" data-k="' + k + '" data-v="' + c[0] + '"><span class="alt-c">' + ic('check') + '</span><span class="alt-t"><b>' + esc(A(c[1], c[2])) + '</b></span></button>';
    }).join('') + (k === 'al' ? '<button class="alt' + (P.allergyTxt ? ' on' : '') + '" data-act="mother"><span class="alt-c">' + ic('check') + '</span><span class="alt-t"><b>' + A('أخرى', 'Other') + '</b></span></button>' +
      '<div class="inp" id="alo"' + (P.allergyTxt ? '' : ' hidden') + '><input id="alot" type="text" dir="auto" value="' + esc(P.allergyTxt || '') + '" placeholder="' + A('اكتب اسم الدواء', 'Type the drug name') + '"></div>' : '') +
      '</div><button class="btn pri wide" data-act="mdone" data-k="' + k + '">' + A('تم', 'Done') + '</button>');
  };
  ACT.mtgl = function (b) { toggle(MULTI[b.dataset.k][1](), b.dataset.v); savePt(); b.classList.toggle('on'); };
  ACT.mother = function (b) { var on = b.classList.toggle('on'), box = $('#alo'); box.hidden = !on; if (on) $('#alot').focus(); else { $('#alot').value = ''; } };
  ACT.mdone = function (b) { var t = $('#alot'); if (b.dataset.k === 'al' && t) { P.allergyTxt = $('#alo').hidden ? '' : t.value.trim(); savePt(); } closeSheet(); var x = document.querySelector('[data-act=mopen][data-k="' + b.dataset.k + '"]'); if (x) x.outerHTML = multiBtn(b.dataset.k); };
  var DXQ = '';
  function dxList() {
    var q = DXQ.trim().toLowerCase();
    return Object.keys(SYS).map(function (k) {
      var L = DX.filter(function (c) { return c.sys === k && (!q || (c.t + ' ' + c.ar).toLowerCase().indexOf(q) >= 0); }); if (!L.length) return '';
      return '<h3 class="pkg">' + T(SYS[k][0]) + '</h3>' + L.map(function (c) { return '<button class="alt' + (P.dx === c.id ? ' on' : '') + '" data-act="dxset" data-v="' + c.id + '"><span class="alt-c">' + ic('check') + '</span><span class="alt-t"><b dir="ltr">' + esc(c.t) + '</b></span></button>'; }).join('');
    }).join('') || '<p class="empty">' + A('لا نتيجة', 'No match') + '</p>';
  }
  ACT.dxpick = function () {
    readForm(); DXQ = '';
    sheet('<h2 class="ch"><span class="chi">' + ic('clip') + '</span>' + A('التشخيص', 'Diagnosis') + '</h2><div class="inp srchi" style="margin-bottom:10px">' + ic('search') + '<input id="dxq" type="search" dir="auto" placeholder="' + A('ابحث', 'Search') + '"></div><div class="sxlist" id="dxlst">' + dxList() + '</div>' +
      '<button class="lnk" data-act="dxsym">' + ic('search') + A('لا تعرف التشخيص؟ ابدأ من الأعراض', 'Not sure? Start from the symptoms') + '</button>');
    var q = $('#dxq'); q.addEventListener('input', function () { DXQ = q.value; $('#dxlst').innerHTML = dxList(); });
  };
  ACT.dxsym = function () { closeSheet(); readForm(); savePt(); go('dx'); };
  ACT.dxset = function (b) {
    var c = byId[b.dataset.v]; closeSheet(); var f = $('#ptf'); if (!f || !c) return;
    f.dxt.value = c.t; P.dx = c.id; savePt();
    var x = f.querySelector('[data-act=dxpick]'); if (x) x.innerHTML = '<b dir="ltr">' + esc(c.t) + '</b>' + ic('fwd', 'chv');
  };
  /* every <select> becomes a button that opens its options in a pop-up; the select stays hidden as the value */
  function pkText(sl) { var o = sl.options[sl.selectedIndex]; return o ? o.textContent : ''; }
  function pickify(root) {
    $$('select:not([data-pk])', root || document).forEach(function (sl) {
      sl.setAttribute('data-pk', '1');
      var b = document.createElement('button'); b.type = 'button'; b.className = 'pkb ' + (sl.className || ''); b.setAttribute('dir', sl.getAttribute('dir') || 'auto');
      b.innerHTML = '<span>' + esc(pkText(sl) || '—') + '</span>' + ic('fwd', 'chv'); b.pkSel = sl;
      sl.parentNode.insertBefore(b, sl.nextSibling); sl.hidden = true;
    });
  }
  function pkLabel(sl) { var f = sl.closest('.fld, .fsel, label'); var t = f && f.querySelector('span'); return t ? t.textContent.replace('*', '').trim() : A('اختر', 'Choose'); }
  var PK = null;
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.pkb'); if (!b || !b.pkSel) return; e.preventDefault(); e.stopPropagation();
    var sl = b.pkSel, opts = Array.prototype.slice.call(sl.options), many = opts.length > 14;
    var o = document.getElementById('pk') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'pk', className: 'sh pk' }));
    function list(q) { q = (q || '').toLowerCase(); return opts.filter(function (x) { var t = x.textContent.toLowerCase(); return !q || (/^[\d.]+$/.test(q) ? t.indexOf(q) === 0 : t.indexOf(q) >= 0); }).map(function (x) {
      return '<button class="alt' + (x.selected ? ' on' : '') + '" data-pkv="' + esc(x.value) + '"><span class="alt-c">' + ic('check') + '</span><span class="alt-t"><b dir="auto">' + esc(x.textContent || '—') + '</b></span></button>'; }).join(''); }
    o.innerHTML = '<div class="sh-bg" data-pkx="1"></div><div class="sh-box"><i class="sh-grip"></i><h2 class="ch">' + esc(pkLabel(sl)) + '</h2>' +
      (many ? '<div class="inp srchi" style="margin-bottom:10px">' + ic('search') + '<input id="pkq" type="search" inputmode="decimal" dir="auto" placeholder="' + A('ابحث', 'Search') + '"></div>' : '') +
      '<div class="sxlist pkl">' + list() + '</div></div>';
    o.hidden = false; PK = sl;
    var cur = o.querySelector('.alt.on'); if (cur) cur.scrollIntoView({ block: 'center' });
    var q = o.querySelector('#pkq'); if (q) q.addEventListener('input', function () { o.querySelector('.pkl').innerHTML = list(q.value); });
  }, true);
  document.addEventListener('click', function (e) {
    var o = document.getElementById('pk'); if (!o || o.hidden) return;
    if (e.target.closest('[data-pkx]')) { o.hidden = true; return; }
    var v = e.target.closest('[data-pkv]'); if (!v || !PK) return;
    PK.value = v.getAttribute('data-pkv'); o.hidden = true;
    var b = PK.nextSibling; if (b && b.classList && b.classList.contains('pkb')) b.firstChild.textContent = pkText(PK) || '—';
    PK.dispatchEvent(new Event('change', { bubbles: true })); PK.dispatchEvent(new Event('input', { bubbles: true }));
  });
  new MutationObserver(function () { pickify(); }).observe(document.body, { childList: true, subtree: true });
  /* lab values as a pop-up grid: [from, to, step] per test; low and high values coloured; «Other» to type */
  var LRANGE = { hb: [2, 20, 0.5], wbc: [1, 40, 1], plt: [10, 800, 10], neut: [0, 100, 5], lymph: [0, 100, 5], na: [115, 170, 1], k: [1.5, 8, 0.1], ca: [5, 13, 0.1],
    urea: [5, 300, 5], cr: [0.2, 10, 0.1], rbg: [20, 600, 5], crp: [0, 300, 5], esr: [0, 150, 5], tsb: [0.5, 30, 0.5], dsb: [0.1, 15, 0.1], alt: [5, 2000, 5], alb: [1, 5.5, 0.1] };
  function labDef(k) { var f = null; LABS.forEach(function (g) { g[2].forEach(function (x) { if (x[0] === k) f = x; }); }); return f; }
  function labTxt(f, v) { return v === '' || v == null ? '<span class="fndp">' + A('اختر', 'Choose') + '</span>' : '<b dir="ltr">' + esc(v) + ' <small>' + esc(f[2]) + '</small>' + (labFlag(f, v) === 'lo' ? ' ↓' : labFlag(f, v) === 'hi' ? ' ↑' : '') + '</b>'; }
  function rng(f) { return f[3] != null && f[4] != null ? f[3] + '–' + f[4] : f[3] != null ? '≥ ' + f[3] : f[4] != null ? '≤ ' + f[4] : ''; }
  ACT.labpick = function (b) {
    readForm(); var k = b.dataset.k, f = labDef(k), r = LRANGE[k] || [0, 100, 1], cur = P.lab[k], vals = [];
    for (var x = r[0]; x <= r[1] + 1e-9; x = Math.round((x + r[2]) * 1000) / 1000) vals.push(x);
    sheet('<h2 class="ch"><span class="chi">' + ic('flask') + '</span>' + T(f[1]) + '<small class="lrng" dir="ltr">' + esc(f[2]) + (rng(f) ? ' · ' + A('الطبيعي ', 'normal ') + rng(f) : '') + '</small></h2>' +
      '<div class="lgrid">' + vals.map(function (x) { var fl = labFlag(f, x); return '<button class="lv ' + fl + (String(x) === String(cur) ? ' on' : '') + '" data-act="labset" data-k="' + k + '" data-v="' + x + '">' + x + '</button>'; }).join('') + '</div>' +
      '<div class="lother"><div class="inp"><input id="labo" type="number" inputmode="decimal" step="any" dir="ltr" value="' + esc(cur || '') + '" placeholder="' + A('قيمة أخرى (اكتبها)', 'Other value (type it)') + '"><em dir="ltr">' + esc(f[2]) + '</em></div>' +
      '<button class="btn pri" data-act="labset" data-k="' + k + '" data-o="1">' + A('تم', 'Done') + '</button></div>' +
      (cur !== '' && cur != null ? '<button class="lnk" data-act="labset" data-k="' + k + '" data-v="">' + ic('trash') + A('مسح القيمة', 'Clear the value') + '</button>' : ''));
    var on = document.querySelector('.lgrid .lv.on'); if (on) on.scrollIntoView({ block: 'center' });
  };
  ACT.labset = function (b) {
    var k = b.dataset.k, f = labDef(k), v = b.dataset.o ? ($('#labo').value || '').trim() : b.dataset.v;
    P.lab[k] = v; savePt(); closeSheet();
    var h = document.querySelector('input[type=hidden][data-lab="' + k + '"]'); if (h) h.value = v;
    var bt = document.querySelector('[data-act=labpick][data-k="' + k + '"]'); if (bt) { bt.className = 'pkb labb ' + labFlag(f, v); bt.innerHTML = labTxt(f, v) + ic('fwd', 'chv'); }
    var el = $('#invsug'); if (el) el.innerHTML = invSuggest();
  };
  ACT.fndopen = function (b) {
    readForm(); var t = b.dataset.t, f = null; LABS.forEach(function (g) { g[2].forEach(function (x) { if (x[0] === t) f = x; }); });
    sheet('<h2 class="ch"><span class="chi">' + ic('flask') + '</span>' + T(f ? f[1] : t) + '</h2><div class="sxlist">' + FIND[t].map(function (x) {
      var on = (P.fnd[t] || []).indexOf(x[0]) >= 0;
      return '<button class="alt' + (on ? ' on' : '') + '" data-act="fnd" data-t="' + t + '" data-v="' + x[0] + '"><span class="alt-c">' + ic('check') + '</span><span class="alt-t"><b dir="ltr">' + esc(x[1]) + '</b></span></button>';
    }).join('') + '</div><div class="inp sm" style="margin:10px 0"><input id="fndo" type="text" dir="auto" value="' + esc(P.lab[t] || '') + '" placeholder="' + A('نتيجة أخرى (اكتبها)', 'Another finding (type it)') + '"></div>' +
      '<button class="btn pri wide" data-act="fnddone" data-t="' + t + '">' + A('تم', 'Done') + '</button>');
  };
  ACT.fnddone = function (b) {
    var t = b.dataset.t, o = $('#fndo'); if (o) P.lab[t] = o.value.trim(); savePt(); closeSheet();
    var btn = document.querySelector('[data-act=fndopen][data-t="' + t + '"]'); if (btn) btn.innerHTML = fndSum(t) + ic('fwd', 'chv');
    var el = $('#invsug'); if (el) el.innerHTML = invSuggest();
    var lg = btn && btn.closest('details.lg'); if (lg) { var n = lg.querySelectorAll('.fndv').length; }
  };
  ACT.fnd = function (b) {
    readForm(); var t = b.dataset.t, v = b.dataset.v, cur = P.fnd[t] = P.fnd[t] || [];
    if (v === 'normal') P.fnd[t] = cur.indexOf('normal') >= 0 ? [] : ['normal'];
    else { toggle(cur, v); P.fnd[t] = cur.filter(function (x) { return x !== 'normal'; }); }
    savePt();
    $$('[data-act=fnd][data-t="' + t + '"]').forEach(function (x) { x.classList.toggle('on', P.fnd[t].indexOf(x.dataset.v) >= 0); });
    var bt = document.querySelector('[data-act=fndopen][data-t="' + t + '"]'); if (bt) bt.innerHTML = fndSum(t) + ic('fwd', 'chv');
    var el = $('#invsug'); if (el) el.innerHTML = invSuggest();
  };
  document.addEventListener('change', function (e) { var x = e.target; if (!x.dataset || x.dataset.lab == null || !$('#ptf')) return; P.lab[x.dataset.lab] = x.value.trim(); savePt(); var el = $('#invsug'); if (el) el.innerHTML = invSuggest(); });
  ACT.tglcd = function (b) { readForm(); toggle(P.cond, b.dataset.v); savePt(); b.classList.toggle('on'); };
  ACT.setset = function (b) { readForm(); P.set = b.dataset.v; savePt(); segOn(b); };
  ACT.setsex = function (b) { readForm(); P.sex = b.dataset.v; savePt(); segOn(b); };
  ACT.setcourse = function (b) { readForm(); P.course = b.dataset.v; savePt(); segOn(b); };
  ACT.setageu = function (b) { readForm(); P.ageU = b.dataset.v; P.ay = P.am = P.ad = ''; savePt(); var y = scrollY; render(true); scrollTo(0, y); };
  ACT.useest = function () { readForm(); P.wt = nice(E.estWeight(P)); savePt(); var y = scrollY; render(true); scrollTo(0, y); };
  ACT.newpt = function () { if (ready() && !confirm(A('مسح بيانات المريض الحالي والبدء بمريض جديد؟', 'Clear the current patient and start a new one?'))) return; P = fresh(); savePt(); render(); };
  function valid() {
    var miss = [];
    if (!P.name) miss.push(A('اسم المريض', 'patient name'));
    if (!hasAge()) miss.push(A('العمر', 'age'));
    if (!(+P.wt > 0)) miss.push(A('الوزن', 'weight'));
    if (!P.dx) miss.push(A('التشخيص', 'diagnosis'));
    $$('#ptf .fld').forEach(function (x) { x.classList.remove('bad'); });
    if (!P.name) $('#ptf [name=name]').closest('.fld').classList.add('bad');
    if (!hasAge()) $('#ptf [name=agev]').closest('.fld').classList.add('bad');
    if (!(+P.wt > 0)) $('#ptf [name=wt]').closest('.fld').classList.add('bad');
    if (!P.dx) $('#ptf [name=dxt]').closest('.fld').classList.add('bad');
    if (miss.length) { toast(A('أكمل: ', 'Please add: ') + miss.join('، ')); var b = $('#ptf .fld.bad'); if (b) b.scrollIntoView({ block: 'center', behavior: 'smooth' }); return false; }
    return true;
  }
  ACT.savept = function () {
    readForm(); if (!valid()) return;
    var L = get('ho-pts', []); P.id = P.id || 'p' + Date.now(); P.saved = Date.now();
    L = L.filter(function (x) { return x.id !== P.id; }); L.unshift(JSON.parse(JSON.stringify(P))); put('ho-pts', L.slice(0, 60)); savePt();
    toast(A('حُفظ المريض على هذا الجهاز', 'Saved on this device'));
  };
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.closest('#ptf')) { readForm(); if (t.dataset.lab) { var f = null; LABS.forEach(function (g) { g[2].forEach(function (x) { if (x[0] === t.dataset.lab) f = x; }); }); if (f && f[2] !== 'txt' && f[2] !== 'sel') { var w = t.closest('.inp'); w.classList.remove('lo', 'hi', 'ok'); var fl = labFlag(f, t.value); if (fl) w.classList.add(fl); } } }
    if (t.id === 'cq') { CQ = t.value; $('#clist').innerHTML = condList(route()[1]); }
    if (t.id === 'dq') { DQ = t.value; var gg = route()[1]; $('#dlist').innerHTML = drugList(gg && DGROUPS.find(function (x) { return x[0] === gg; })); }
    if (t.closest('#cf')) calcRun();
  });
  document.addEventListener('submit', function (e) {
    if (e.target.id === 'ptf') { e.preventDefault(); readForm(); if (!valid()) return; go(P.dx ? 'c/' + P.dx : 'conds'); }
  });

  /* ================= Diagnosis from symptoms ================= */
  var SXSEL = get('ho-sx', []);
  var INV = {};
  function dxScore() {
    var m = hasAge() ? E.ageMonths(P) : null;
    INV = {}; invRank().forEach(function (r) { INV[r.c.id] = r; });
    return DX.map(function (c) {
      var tot = 0, got = 0, hit = [];
      Object.keys(c.sx).forEach(function (k) { tot += c.sx[k]; if (SXSEL.indexOf(k) >= 0) { got += c.sx[k]; hit.push(k); } });
      var ok = m == null || ((c.amin == null || m >= c.amin) && (c.amax == null || m <= c.amax));
      var miss = SXSEL.filter(function (k) { return !c.sx[k]; }).length;
      var s = got ? got * got / tot - miss * 0.35 : 0;
      /* investigation results add to the score (owner, 28 Nov 2026) */
      var iv = INV[c.id]; if (iv) { s += iv.s * 0.8; }
      return { c: c, s: ok ? s : s * 0.2, pct: Math.min(100, (tot ? Math.round(100 * got / tot) : 0) + (iv ? iv.s * 10 : 0)), hit: hit, inv: iv ? iv.why : [], age: ok };
    }).filter(function (r) { return (r.hit.length || r.inv.length) && r.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 8);
  }
  var GRPIC = { 'General': 'user', 'Respiratory': 'lungs', 'ENT and mouth': 'stetho', 'Gut': 'gut', 'Nervous system': 'brain', 'Urinary and kidney': 'kidney', 'Skin, eyes and joints': 'eye', 'Heart and blood': 'heart', 'Newborn': 'baby', 'Exposure': 'alert' };
  /* Diagnose (owner, 27 Nov 2026: "one button per system; pressing it opens a menu to choose from"): system buttons, a menu of
     symptoms for each, the chosen symptoms and the likely diagnoses right under the buttons */
  var SXG = {}; SX.forEach(function (s) { (SXG[s[0]] = SXG[s[0]] || []).push(s); });
  var GRPS = { 'General': 'General', 'Respiratory': 'Chest', 'ENT and mouth': 'ENT & mouth', 'Gut': 'Gut', 'Nervous system': 'Nervous', 'Urinary and kidney': 'Kidney', 'Skin, eyes and joints': 'Skin & joints', 'Heart and blood': 'Heart & blood', 'Newborn': 'Newborn', 'Exposure': 'Exposure' };
  function dx() {
    head('Diagnose', A('اضغط على الجهاز واختر الأعراض؛ تظهر الاحتمالات تحته مرتبة حسب عمر المريض', 'Tap a system and choose the symptoms; the likely diagnoses appear below, ranked for the patient\'s age'));
    return '<div id="dxb">' + dxBody() + '</div>';
  }
  function dxBody() {
    var hasInv = invFacts().length, res = SXSEL.length || hasInv ? dxScore() : [];
    var h = '<div class="mt sxg">' + Object.keys(SXG).map(function (g) {
      var n = SXG[g].filter(function (s) { return SXSEL.indexOf(s[1]) >= 0; }).length;
      return '<button class="mtile' + (n ? ' has' : '') + '" data-act="sxgrp" data-g="' + esc(g) + '"><span class="ib2">' + ic(GRPIC[g] || 'list') + '</span><b>' + T(GRPS[g] || g) + '</b>' + (n ? '<em>' + n + '</em>' : '') + '</button>';
    }).join('') + '</div>';
    if (SXSEL.length) h += '<div class="sxsel"><div class="chips">' + SXSEL.map(function (k) { var s = SXN[k]; return s ? '<button class="chip on" data-act="sxt" data-v="' + k + '">' + esc(A(s[3], s[2])) + ' ✕</button>' : ''; }).join('') + '</div><button class="lnk" data-act="sxclear">' + ic('trash') + A('مسح الكل', 'Clear all') + '</button></div>';
    if (hasInv) h += '<div class="ivuse">' + ic('flask') + '<span>' + A('تُحسب أيضًا نتائج الفحوصات: ', 'Your investigation results are counted too: ') + '<bdi dir="ltr">' + esc(invFacts().map(function (f) { return f.t; }).join(' · ')) + '</bdi></span><button class="lnk" data-go="patient">' + A('تعديل', 'Edit') + '</button></div>';
    if (!SXSEL.length && !hasInv) return h + '<div class="res-empty">' + ic('stetho2') + '<span>' + A('اختر جهازًا من الأعلى ثم الأعراض والعلامات التي وجدتها.', 'Choose a system above, then the symptoms and signs you found.') + '</span></div>';
    if (!res.length) return h + '<p class="empty">' + A('لا يوجد تشخيص يطابق هذه الأعراض.', 'No diagnosis matches these findings.') + '</p>';
    return h + '<h2 class="st">' + T('Likely diagnoses') + '</h2><ol class="ddx">' + res.map(function (r, i) {
      return '<li data-go="c/' + r.c.id + '"><span class="rk">' + (i + 1) + '</span><div class="ddx-b"><div class="ddx-h">' + T(r.c.t) + '<span class="pct">' + r.pct + '%</span></div><div class="bar2"><i style="width:' + r.pct + '%"></i></div><small>' +
        r.hit.map(function (k) { return esc(A(SXN[k][3], SXN[k][2])); }).concat(r.inv.map(function (t) { return '🧪 <bdi dir="ltr">' + esc(t) + '</bdi>'; })).join(' · ') + (r.age ? '' : ' · <b class="warn">' + A('عمر غير معتاد', 'unusual age') + '</b>') + '</small></div>' + ic('fwd', 'chv') + '</li>';
    }).join('') + '</ol><p class="hint">' + A('ترتيب يساعدك على التفكير وليس تشخيصًا؛ افحص المريض وأكّد بالفحوصات.', 'A ranking to help you think, not a diagnosis: examine and confirm.') + '</p>';
  }
  function dxRefresh() { var el = document.getElementById('dxb'); if (el) el.innerHTML = dxBody(); }
  ACT.sxgrp = function (b) {
    var g = b.dataset.g;
    sheet('<h2 class="ch"><span class="chi">' + ic(GRPIC[g] || 'list') + '</span>' + T(GRPS[g] || g) + '</h2><div class="sxlist">' + SXG[g].map(function (s) {
      var on = SXSEL.indexOf(s[1]) >= 0;
      return '<button class="alt' + (on ? ' on' : '') + '" data-act="sxpick" data-v="' + s[1] + '"><span class="alt-c">' + ic('check') + '</span><span class="alt-t"><b>' + esc(A(s[3], s[2])) + '</b>' + (AR ? '<small dir="ltr">' + esc(s[2]) + '</small>' : '') + '</span></button>';
    }).join('') + '</div><button class="btn pri wide" data-act="shclose">' + A('تم', 'Done') + '</button>');
  };
  ACT.sxpick = function (b) { toggle(SXSEL, b.dataset.v); put('ho-sx', SXSEL); b.classList.toggle('on'); dxRefresh(); };
  ACT.sxt = function (b) { toggle(SXSEL, b.dataset.v); put('ho-sx', SXSEL); dxRefresh(); };
  ACT.sxclear = function () { SXSEL = []; put('ho-sx', SXSEL); dxRefresh(); };

  /* ================= Conditions: body systems first, then the system's list (owner: "be organised") ================= */
  var CQ = '';
  function sysCount(k) { return DX.filter(function (c) { return c.sys === k; }).length; }
  function conds(sys) {
    if (sys && SYS[sys]) {
      head(SYS[sys][0], A(SYS[sys][1] + ' · ' + nCase(sysCount(sys)), sysCount(sys) + (sysCount(sys) === 1 ? ' condition' : ' conditions')));
      return '<div class="srch">' + ic('search') + '<input id="cq" type="search" dir="auto" value="' + esc(CQ) + '" placeholder="' + A('ابحث في هذا القسم', 'Search this system') + '"></div><div id="clist">' + condList(sys) + '</div>';
    }
    head('Conditions', A('اختر الجهاز ثم الحالة، أو ابحث مباشرة', 'Choose the body system, then the condition, or search'));
    var rec = get('ho-recent', []).filter(function (id) { return byId[id]; }).slice(0, 3);
    return '<div class="srch">' + ic('search') + '<input id="cq" type="search" dir="auto" value="' + esc(CQ) + '" placeholder="' + A('ابحث في كل الأمراض (عربي أو إنجليزي)', 'Search every condition') + '"></div>' +
      '<div id="clist">' + (CQ ? condList('') : sysGrid(rec)) + '</div>';
  }
  function sysSheet() {
    sheet('<h2 class="ch"><span class="chi">' + ic('list') + '</span>' + T('Body systems') + '</h2><div class="sxlist">' + Object.keys(SYS).map(function (k) {
      return '<button class="lrow" data-act="sysopen" data-k="' + k + '"><span class="lrow-i">' + ic(SYSIC[k] || 'list') + '</span><span class="lrow-t">' + T(SYS[k][0]) + '<small>' + A(nCase(sysCount(k)), sysCount(k) + (sysCount(k) === 1 ? ' condition' : ' conditions')) + '</small></span>' + ic('fwd', 'flip') + '</button>';
    }).join('') + '</div>');
  }
  ACT.syspick = function () { sysSheet(); };
  ACT.sysopen = function (b) {
    var k = b.dataset.k;
    sheet('<h2 class="ch"><button class="sqb sm" data-act="syspick" aria-label="' + A('رجوع', 'Back') + '">' + ic('back') + '</button>' + T(SYS[k][0]) + '</h2><div class="sxlist">' +
      DX.filter(function (c) { return c.sys === k; }).map(function (c) { return '<button class="lrow" data-act="condgo" data-v="' + c.id + '"><span class="lrow-i">' + ic(SYSIC[k] || 'list') + '</span><span class="lrow-t">' + T(c.t) + '</span>' + ic('fwd', 'flip') + '</button>'; }).join('') + '</div>');
  };
  ACT.condgo = function (b) { closeSheet(); go('c/' + b.dataset.v); };
  function sysGrid(rec) {
    return (rec && rec.length ? '<h2 class="st">' + T('Recent') + '</h2><section class="card list recl">' + rec.map(function (id) { var c = byId[id]; return '<button class="lrow" data-go="c/' + id + '"><span class="lrow-i">' + ic(SYSIC[c.sys] || 'list') + '</span><span class="lrow-t">' + T(c.t) + '<small dir="ltr">' + esc((SYS[c.sys] || [''])[0]) + '</small></span>' + ic('fwd', 'flip') + '</button>'; }).join('') + '</section>' : '') +
      /* body systems in a pop-up, then the system's conditions in the same pop-up (owner, 28 Nov 2026) */
      '<h2 class="st">' + T('Body systems') + '</h2><button class="fndb sysb" data-act="syspick"><span class="ib2">' + ic('list') + '</span><span class="fndp">' + A('اختر الجهاز ثم الحالة', 'Choose a body system, then the condition') + '</span>' + ic('fwd', 'chv') + '</button>' +

      '<button class="emg alt" data-go="dx"><span class="emg-i">' + ic('stetho2') + '</span><span class="emg-t"><b>' + T('Diagnose from symptoms') + '</b><small>' + A('لا تعرف التشخيص؟ اختر الأعراض', 'Not sure? Pick the symptoms') + '</small></span>' + '<span class="emg-go">' + ic('fwd') + '</span></button>';
  }
  function condList(sys) {
    var q = CQ.trim().toLowerCase();
    if (!sys && !q) return sysGrid(get('ho-recent', []).filter(function (id) { return byId[id]; }).slice(0, 3));
    var L = DX.filter(function (c) { return (!sys || c.sys === sys) && (!q || (c.t + ' ' + c.ar).toLowerCase().indexOf(q) >= 0); });
    if (!L.length) return '<p class="empty">' + A('لا توجد نتيجة', 'Nothing found') + '</p>';
    return '<section class="card list">' + L.map(function (c) {
      return '<button class="lrow" data-go="c/' + c.id + '"><span class="lrow-i">' + ic(SYSIC[c.sys] || 'list') + '</span><span class="lrow-t">' + T(c.t) + '</span>' + ic('fwd', 'flip') + '</button>';
    }).join('') + '</section>';
  }

  /* ================= Condition management ================= */
  var SEL = get('ho-sel', {}), FORMSEL = get('ho-form', {});
  var NOPRE = /alternative|allergy|second line|third line|prevention|potent|discharge|very ill|not responding|long term|failure|if aspirin|antibiotic only|pre-referral|options/i;
  var OPT = /\b(if|or|alternative|may replace|±|evidence)\b/i;
  function agePass(note) {
    if (!note || !hasAge()) return true;
    var m = E.ageMonths(P), r = /(under|over|below|above)\s+(\d+)\s*(month|year)/i.exec(note); if (!r) return true;
    var lim = +r[2] * (/year/i.test(r[3]) ? 12 : 1);
    return /under|below/i.test(r[1]) ? m < lim : m >= lim;
  }
  function pickVariant(c, vid) {
    if (vid) { var v = c.variants.find(function (x) { return x.id === vid; }); if (v) return v; }
    var want = P.set === 'adm' ? /^(adm|sev|severe|ill|sys)$/ : P.set === 'er' ? /^(er|sev|severe|adm)$/ : /^(op|none|mild|simple|home|bac)$/;
    return c.variants.find(function (v) { return want.test(v.id); }) || c.variants[0];
  }
  function stopped(o) { return o.warn && o.warn.some(function (w) { return w.lvl === 'stop'; }); }
  function defaultSel(c, v) {
    var s = {};
    v.lines.forEach(function (l, li) {
      if (li > 0 && NOPRE.test(l.t)) return;
      var first = true;
      l.items.forEach(function (it, ii) {
        if (!it.d) return;
        if (stopped(E.dose(it.d, it.r, P))) return;
        var choose = /choose|first line|antibiotic|antimalarial|options|choice/i.test(l.t) && l.items.filter(function (x) { return x.d; }).length > 1;
        if (choose) { if (first) { s[li + '.' + ii] = 1; first = false; } return; }
        if (!OPT.test(it.note || '') && agePass(it.note)) s[li + '.' + ii] = 1;
      });
    });
    if (!Object.keys(s).some(function (k) { return k.indexOf('0.') === 0; })) {
      for (var li = 1; li < v.lines.length; li++) {
        var l = v.lines[li]; if (!/alternative|allergy/i.test(l.t)) continue;
        for (var ii = 0; ii < l.items.length; ii++) { var it = l.items[ii]; if (it.d && !stopped(E.dose(it.d, it.r, P))) { s[li + '.' + ii] = 1; li = 99; break; } }
      }
    }
    return s;
  }
  function ptSig() { return [P.ay, P.am, P.ad, P.wt, P.allergy.join(), P.cond.join(), P.set].join('|'); }
  function getSel(c, v) { var k = c.id + '|' + v.id; if (!SEL[k] || SEL[k]._pt !== ptSig()) { SEL[k] = defaultSel(c, v); SEL[k]._pt = ptSig(); put('ho-sel', SEL); } return SEL[k]; }
  function nSel(s) { return Object.keys(s).filter(function (k) { return k[0] !== '_'; }).length; }
  function warnHtml(w) { return w.map(function (x) { return '<div class="wn ' + x.lvl + '">' + ic('alert') + '<span dir="ltr">' + esc(x.t) + '</span></div>'; }).join(''); }
  function drugName(d) { var b = d.b && d.b[0] && d.b[0] !== d.g ? d.b[0] : ''; return { main: b || d.g, sub: b ? d.g : (d.b || []).slice(1, 3).join(', ') }; }
  /* the amount to give, in plain words: "2 mL", "½ tablet", "200 mg (2 mL)" for injections */
  /* under 1 year the dose is measured from the weakest syrup of the rule, so small volumes are accurate (owner, 28 Nov 2026) */
  function prefForm(drugId, key) {
    if (FORMSEL[drugId + '.' + key]) return FORMSEL[drugId + '.' + key];
    var d = DR[drugId]; if (!d || !ready() || E.ageMonths(P) >= 12) return undefined;
    var r = E.rule(d, key, P), ids = (r && r.forms) || [];
    var liq = d.forms.filter(function (f) { return f.r === 'PO' && f.c && ids.indexOf(f.id) >= 0; }).sort(function (a, b) { return a.c - b.c; });
    return liq.length > 1 ? liq[0].id : undefined;
  }
  function amount(o) {
    if (o.fixed) return o.fixed;
    var q = o.qty; if (!q) return o.text || '';
    var t = q.small ? q.txt : q.txt;
    if (/^(IV|IM|SC)$/.test(o.route) && o.mg != null && o.unit === 'mg') t = nice(o.mg) + ' mg (' + t + ')';
    else if (o.unit === 'IU' || o.unit === 'units') t = (o.unit === 'IU' ? Math.round(o.mg).toLocaleString('en') + ' IU' : nice(o.mg) + ' units') + (q.txt ? ' (' + q.txt + ')' : '');
    return t;
  }
  /* one drug as an instruction: name, the amount, how, how often, how long, and the line for the parents; the arithmetic sits behind ⓘ */
  function planRow(li, ii, it, opt) {
    opt = opt || {};
    if (!it.d) return '<div class="tx">' + ic('check') + '<span dir="ltr">' + esc(it.txt) + '</span></div>';
    var o = E.dose(it.d, it.r, P, prefForm(it.d, it.r)); if (o.err) return '';
    var d = o.drug, nm = drugName(d), rx = E.rxLine(o), key = it.d + '|' + it.r;
    if (!ready()) return '<article class="pr wait"><div class="pr-h"><span class="pr-n">' + T(nm.main) + (nm.sub ? '<small dir="ltr">' + esc(nm.sub) + '</small>' : '') + '</span></div><p class="pend">' + ic('calc') + A('تظهر الجرعة بعد اختيار العمر والوزن', 'The dose appears once age and weight are chosen') + '</p></article>';
    var stops = o.warn.filter(function (w) { return w.lvl === 'stop'; }), warns = o.warn.filter(function (w) { return w.lvl !== 'stop'; });
    /* newborn check in a children's plan (owner, 28 Nov 2026: "do the same for the treatment plan page") */
    var pc = P.dx && byId[P.dx];
    if (E.isNeo(P) && pc && pc.sys !== 'neo' && !neoOK(d)) warns.unshift({ lvl: 'warn', t: AR ? 'الدليل المحلي يعطي هذه الجرعة للأطفال ولا يذكر جرعة لحديثي الولادة: راجعها مع الأخصائي قبل الإعطاء.' : 'The local guideline gives this as a child dose with no separate newborn dose: check it with your senior before giving.' });
    var tn = (d.b || []).filter(function (b) { return b !== nm.main; });
    return '<article class="pr">' +
      '<div class="pr-h"><span class="pr-n" data-go="drug/' + d.id + '">' + T(nm.main) + (nm.sub ? '<small dir="ltr">' + esc(nm.sub) + '</small>' : '') + '</span>' +
      '<button class="pr-i" data-act="info" data-k="' + key + '" aria-label="' + A('التفاصيل', 'Details') + '">i</button>' +
      (opt.rm ? '<button class="pr-x" data-act="unsel" data-s="' + li + '.' + ii + '" aria-label="' + A('إزالة', 'Remove') + '">✕</button>' : '') + '</div>' +
      (tn.length ? '<div class="pr-tn">' + tn.slice(0, 4).map(function (b) { return '<b dir="ltr">' + esc(b) + '</b>'; }).join('') + '</div>' : '') +
      '<div class="pr-amt" dir="ltr">' + esc(amount(o)) + '</div>' + (o.fixed ? '' : '<div class="pr-from">' + fromForm(d, it.r, o) + '</div>') +
      '<div class="pr-how"><span>' + E.route(o.route, AR) + '</span><span>' + E.freq(o.f, AR) + '</span>' + (o.dur ? '<span dir="ltr">' + esc(o.dur) + '</span>' : '') + '</div>' +
      '<div class="pr-ar"><small>' + A('للأهل', 'For the parents') + '</small><span dir="rtl">' + esc(rx.ar) + '</span></div>' +
      (stops.length ? warnHtml(stops) : '') + (warns.length ? warnHtml(warns.slice(0, 1)) : '') + '</article>';
  }
  /* ⓘ: the calculation, the guideline shortcut, the preparation and notes, for whoever wants them */
  ACT.info = function (b) {
    var k = b.dataset.k.split('|'), o = E.dose(k[0], k[1], P, prefForm(k[0], k[1])), d = o.drug, nm = drugName(d);
    var forms = o.forms.length > 1 ? '<label class="fsel"><span>' + A('المستحضر', 'Preparation') + '</span><select data-fk="' + k[0] + '.' + k[1] + '" dir="ltr">' + o.forms.map(function (f) { return '<option value="' + f.id + '"' + (o.form && o.form.id === f.id ? ' selected' : '') + '>' + esc(f.n) + '</option>'; }).join('') + '</select></label>' : (o.form ? '<p class="kv1"><span>' + A('المستحضر', 'Preparation') + '</span><b dir="ltr">' + esc(o.form.n) + '</b></p>' : '');
    sheet('<h2 class="ch"><span class="chi">' + ic('pill') + '</span>' + T(nm.main) + '</h2>' + forms +
      (o.calc ? '<p class="kv1"><span>' + A('الحساب', 'Calculation') + '</span><b dir="ltr">' + esc(o.calc) + '</b></p>' : '') +
      (o.sc ? '<p class="kv1 gold"><span>' + A('اختصار الدليل', 'Guideline shortcut') + '</span><b dir="ltr">' + esc(o.sc) + '</b></p>' : '') +
      (o.form && o.form.rec ? '<p class="kv1"><span>' + A('التحضير', 'Reconstitution') + '</span><b dir="ltr">' + esc(o.form.rec) + '</b></p>' : '') +
      (o.note ? '<p class="note" dir="ltr">' + esc(o.note) + '</p>' : '') + warnHtml(o.warn) +
      '<div class="pc-btns"><button class="btn" data-go="drug/' + d.id + '">' + ic('book') + A('صفحة الدواء', 'Drug page') + '</button><button class="btn pri" data-act="shclose">' + A('تم', 'Done') + '</button></div>');
  };
  /* other drugs and alternatives: one sheet with every line of the guideline, tick to add or remove */
  ACT.alts = function () {
    var r = route(), c = byId[r[1]]; if (!c) return; var v = pickVariant(c, r[2]), s = getSel(c, v);
    sheet('<h2 class="ch"><span class="chi">' + ic('list') + '</span>' + T('Choose drugs') + '</h2><p class="hint">' + A('علّم ما تريد في الخطة؛ الممنوع لهذا المريض لا يمكن اختياره.', 'Tick what you want in the plan; drugs not allowed for this patient cannot be chosen.') + '</p>' +
      v.lines.map(function (l, li) {
        var items = l.items.map(function (it, ii) {
          if (!it.d) return '';
          var o = E.dose(it.d, it.r, P, prefForm(it.d, it.r)); if (o.err) return '';
          var nm = drugName(o.drug), stop = stopped(o), on = !!s[li + '.' + ii];
          return '<button class="alt' + (on ? ' on' : '') + (stop ? ' no' : '') + '" ' + (stop ? 'disabled' : 'data-act="tglsel" data-s="' + li + '.' + ii + '"') + '><span class="alt-c">' + ic(stop ? 'alert' : 'check') + '</span><span class="alt-t">' + T(nm.main) +
            '<small dir="ltr">' + (stop ? esc(o.warn.filter(function (w) { return w.lvl === 'stop'; })[0].t) : esc(amount(o)) + ' · ' + esc(E.freq(o.f)) + (o.dur ? ' · ' + esc(o.dur) : '')) + '</small>' + (it.note ? '<em dir="ltr">' + esc(it.note) + '</em>' : '') + '</span></button>';
        }).join('');
        return items ? '<h3 class="alth">' + T(l.t) + '</h3>' + items : '';
      }).join('') + '<button class="btn pri wide" data-act="shclose">' + A('تم', 'Done') + '</button>');
  };
  ACT.tglsel = function (b) { var r = route(), c = byId[r[1]], v = pickVariant(c, r[2]), s = getSel(c, v), k = b.dataset.s; if (s[k]) delete s[k]; else s[k] = 1; put('ho-sel', SEL); b.classList.toggle('on'); refreshPlan(); };
  ACT.unsel = function (b) { var r = route(), c = byId[r[1]], v = pickVariant(c, r[2]), s = getSel(c, v); delete s[b.dataset.s]; put('ho-sel', SEL); refreshPlan(); };
  function refreshPlan() { var el = document.getElementById('plan'); if (!el) return; var r = route(), c = byId[r[1]], v = pickVariant(c, r[2]); el.innerHTML = planList(c, v); var n = $('#rxn'); if (n) n.textContent = nSel(getSel(c, v)); }
  function planList(c, v) {
    var s = getSel(c, v), rows = [], avoided = [];
    v.lines.forEach(function (l, li) {
      l.items.forEach(function (it, ii) {
        if (!it.d) { if (!(li > 0 && NOPRE.test(l.t))) rows.push(planRow(li, ii, it)); return; }
        if (s[li + '.' + ii]) { rows.push(planRow(li, ii, it, { rm: 1 })); return; }
        if (li === 0 && ready()) { var o = E.dose(it.d, it.r, P); if (!o.err && stopped(o)) avoided.push(drugName(o.drug).main); }
      });
    });
    return (rows.length ? rows.join('') : '<p class="empty">' + A('لم تُختر أدوية.', 'No drugs chosen.') + '</p>') +
      (avoided.length ? '<p class="avoid">' + ic('alert') + '<span>' + A('استُبعد بسبب حساسية المريض أو حالته: ', 'Left out because of the patient\'s allergy or condition: ') + '<bdi dir="ltr">' + esc(avoided.join(', ')) + '</bdi></span></p>' : '') +
      '<button class="btn wide" data-act="alts">' + ic('list') + A('بدائل أو أدوية أخرى', 'Alternatives or other drugs') + '</button>';
  }
  function fluidCard(spec) {
    var f = E.fluid(spec, P); if (!f) return '';
    return '<section class="card fl"><h2 class="ch"><span class="chi">' + ic('drop') + '</span>' + T('Fluids') + '</h2>' + (f.order[0] ? '<div class="flbig" dir="ltr">' + esc(f.order.join(' · ')) + '</div>' : '') +
      '<details class="more"><summary>' + A('تفاصيل الحساب', 'How it was calculated') + ic('fwd', 'chev') + '</summary><p class="hint" dir="ltr">' + esc(f.t) + '</p><table class="kv">' + f.rows.map(function (r) { return '<tr><th dir="ltr">' + esc(r[0]) + '</th><td dir="ltr">' + esc(r[1]) + '</td></tr>'; }).join('') + '</table>' +
      (f.notes.length ? '<ul class="tips">' + f.notes.map(function (n) { return '<li dir="ltr">' + esc(n) + '</li>'; }).join('') + '</ul>' : '') + '</details></section>';
  }
  function acc(title, icn, arr, cls, open) { if (!arr || !arr.length) return ''; return '<details class="card acc ' + (cls || '') + '"' + (open ? ' open' : '') + '><summary><span class="chi">' + ic(icn) + '</span>' + T(title) + '<em class="cnt">' + arr.length + '</em>' + ic('fwd', 'chev') + '</summary><ul class="bl">' + arr.map(function (x) { return '<li dir="ltr">' + esc(x) + '</li>'; }).join('') + '</ul></details>'; }
  function labCard() {
    var L = labsEntered().filter(function (x) { return x.flag === 'lo' || x.flag === 'hi'; }); if (!L.length) return '';
    return '<div class="lres top">' + L.map(function (x) { return '<span class="' + x.flag + '"><small>' + esc(x.f[1]) + '</small><b dir="ltr">' + esc(x.v) + (x.flag === 'lo' ? ' ↓' : ' ↑') + '</b></span>'; }).join('') + '</div>';
  }
  function cond(id, vid) {
    var c = byId[id]; if (!c) return notFound();
    var v = pickVariant(c, vid), sel = getSel(c, v);
    if (P.dx !== c.id) { P.dx = c.id; savePt(); }
    var vv = get('ho-var', {}); if (vv[c.id] !== v.id) { vv[c.id] = v.id; put('ho-var', vv); }
    var rec = get('ho-recent', []).filter(function (x) { return x !== id; }); rec.unshift(id); put('ho-recent', rec.slice(0, 8));
    head(c.t, T((window.HO_SYS[c.sys] || [''])[0]));   /* no Arabic disease names (owner, 28 Nov 2026) */
    var h = '';
    if (!(+P.wt > 0)) h += quickPt();
    else { var m = E.ageMonths(P); if ((c.amin != null && m < c.amin) || (c.amax != null && m > c.amax)) h += '<div class="wn warn big">' + ic('alert') + '<span>' + A('عمر المريض غير معتاد لهذا التشخيص؛ راجع التشخيص.', 'This age is unusual for this diagnosis: review it.') + '</span></div>'; }
    if (ready() && E.isNeo(P) && c.sys !== 'neo') h += '<div class="wn warn big">' + ic('baby') + '<span>' + (AR ? 'المريض حديث ولادة (' + ageTxt() + '). هذه خطة الأطفال من الدليل المحلي؛ الأدوية التي ليس لها جرعة لحديثي الولادة معلَّمة أدناه.' : 'This patient is a newborn (' + ageTxt() + '). This is the children\'s plan of the local guideline; drugs with no newborn dose are marked below.') + '</span></div>';
    h += labCard() + resCard(c);
    if (c.variants.length > 1) h += '<div class="vtabs">' + c.variants.map(function (x) { return '<button class="' + (x === v ? 'on' : '') + '" data-go="c/' + c.id + '/' + x.id + '">' + T(x.t) + '</button>'; }).join('') + '</div>';
    h += '<section class="card plan"><h2 class="ch"><span class="chi">' + ic('pill') + '</span>' + T('Treatment') + '</h2><div id="plan">' + planList(c, v) + '</div></section>';
    if (v.fluid) h += fluidCard(v.fluid);
    var extra = (v.extra || []).concat(c.extra || []);
    if (extra.length) h += '<section class="card"><h2 class="ch"><span class="chi">' + ic('check') + '</span>' + T('Also') + '</h2><ul class="bl">' + extra.map(function (x) { return '<li dir="ltr">' + esc(x) + '</li>'; }).join('') + '</ul></section>';
    h += acc('Investigations', 'flask', c.inv);
    h += acc('Admit if', 'hosp', c.admit);
    h += acc('Traps to avoid', 'shield', c.traps, 'trap');
    h += acc('Complications', 'alert', c.comp);
    h += acc('Differential diagnosis', 'list', c.ddx);
    h += acc('About the condition', 'book', [c.about].concat(v.when ? [v.when] : []));
    h += '<div class="dock"><button class="btn pri" data-go="rx">' + ic('rx') + A('الوصفة', 'Prescription') + ' <em id="rxn">' + nSel(sel) + '</em></button><button class="btn" data-go="orders">' + ic('hosp') + A('أوامر التنويم', 'Orders') + '</button></div>';
    return h;
  }
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.closest('#ptf') && t.name === 'ageu') { P.ageU = t.value; P.ay = P.am = P.ad = ''; t.form.agev.innerHTML = ageVals(t.value, ''); readForm(); return; }
    if (t.closest('#ptf')) { readForm(); if (/^(agev|wt)$/.test(t.name)) { var b = $('.estb b'), est = hasAge() ? nice(E.estWeight(P)) : ''; if (b && est) b.textContent = est + ' kg'; else if (!b && est) { var y = scrollY; render(true); scrollTo(0, y); } } }
    if (t.matches('[data-sel]')) { var r = route(), c = byId[r[1]]; if (!c) return; var v = pickVariant(c, r[2]), s = getSel(c, v); if (t.checked) s[t.dataset.sel] = 1; else delete s[t.dataset.sel]; put('ho-sel', SEL); t.closest('.dc').classList.toggle('on', t.checked); var n = $('#rxn'); if (n) n.textContent = nSel(s); }
    if (t.matches('select[data-fk]')) { FORMSEL[t.dataset.fk] = t.value; put('ho-form', FORMSEL); var y2 = scrollY; render(true); scrollTo(0, y2); }
    if (t.closest('#cf')) calcRun();
  });

  /* ================= Prescription and orders ================= */
  function current() { var c = byId[P.dx]; if (!c) return null; var v = pickVariant(c, get('ho-var', {})[c.id]); return { c: c, v: v, sel: getSel(c, v) }; }
  function chosen(cur) {
    var out = [];
    cur.v.lines.forEach(function (l, li) { l.items.forEach(function (it, ii) { if (!cur.sel[li + '.' + ii]) return; if (it.d) out.push(E.dose(it.d, it.r, P, prefForm(it.d, it.r))); else out.push({ txt: it.txt }); }); });
    return out.filter(function (o) { return !o.err; });
  }
  function noDx(t) { head(t, ''); return '<section class="card emptyc"><span class="pc-big">' + ic('stetho') + '</span><p>' + A('اختر التشخيص أولًا حتى تُكتب الوصفة.', 'Choose the diagnosis first.') + '</p><div class="pc-btns"><button class="btn pri" data-go="conds">' + ic('list') + A('الأمراض', 'Conditions') + '</button><button class="btn" data-go="dx">' + ic('search') + A('من الأعراض', 'From symptoms') + '</button></div></section>'; }
  function today() { var d = new Date(); return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear(); }
  function rxText(cur, list) {
    var m = me(), L = ['Rx  ' + today(), (P.name ? P.name + ' · ' : '') + (hasAge() ? E.ageText(P) + ' · ' : '') + wtTxt(), 'Dx: ' + cur.c.t, ''];
    list.forEach(function (o, i) { if (o.txt) return; var r = E.rxLine(o); L.push((i + 1) + '. ' + r.name, '   ' + r.ar, '   ' + r.en); });
    L.push('', '——————', (m && m.name ? m.name : '') + '  ' + A('التوقيع', 'Signature')); return L.join('\n');
  }
  function rx() {
    var cur = current(); if (!cur) return noDx('Prescription');
    head('Prescription', T(cur.c.t));
    var list = chosen(cur).filter(function (o) { return !o.txt; }), m = me();
    var h = '<section class="paper"><div class="pp-h"><img src="img/logo-smra.webp" alt=""><div><b>' + T('Prescription') + '</b><small dir="ltr">' + today() + '</small></div></div>' +
      '<div class="pp-pt"><span><small>' + A('الاسم', 'Name') + '</small><b dir="auto">' + esc(P.name || '……………') + '</b></span><span><small>' + A('العمر', 'Age') + '</small><b>' + (hasAge() ? ageTxt() : '—') + '</b></span><span><small>' + A('الوزن', 'Weight') + '</small><b dir="ltr">' + wtTxt() + '</b></span></div>' +
      '<div class="pp-dx"><small>Dx</small>' + T(cur.c.t) + '</div><div class="pp-rx">℞</div><ol class="pp-l">' +
      list.map(function (o) { var r = E.rxLine(o); return '<li><b dir="ltr">' + esc(r.name) + '</b><div class="ar" dir="rtl">' + esc(r.ar) + '</div><small dir="ltr">' + esc(r.en) + '</small></li>'; }).join('') + '</ol>' +
      (list.length ? '' : '<p class="hint">' + A('لم تختر أي دواء من خطة العلاج.', 'No drug ticked in the plan.') + '</p>') +
      '<div class="pp-f"><span dir="auto">' + esc(m && m.name ? m.name : '') + '</span><i></i><small>' + A('التوقيع', 'Signature') + '</small></div></section>';
    h += '<div class="dock static"><button class="btn pri" data-act="copyrx">' + ic('copy') + A('نسخ', 'Copy') + '</button>' + (navigator.share ? '<button class="btn" data-act="sharerx">' + ic('share') + A('مشاركة', 'Share') + '</button>' : '') + '<button class="btn" data-act="print">' + ic('print') + A('طباعة', 'Print') + '</button><button class="btn" data-go="c/' + cur.c.id + '">' + ic('edit') + A('تعديل', 'Edit') + '</button></div>';
    h += acc('Prescription rules', 'shield', [A('اكتب التركيز لكل دواء له أكثر من تركيز (Amoclan 200 أو 400).', 'Write the strength when there are several (Amoclan 200 or 400).'), A('اكتب الطريقة والمدة بالعربي، لا OD أو BD.', 'Write route and duration in Arabic, never OD or BD.'),
      A('للأهل اكتب بالمل لا بالملغم، واطلب سرنجة 3 مل.', 'For parents write mL, not mg, and give a 3 mL syringe.'), A('اكتب Tegretol (carbamazepine) 200 mg حتى لا يختلط بـ carbimazole.', 'Write Tegretol (carbamazepine) 200 mg so it is not confused with carbimazole.'), A('أغلق الوصفة بخط ووقّع.', 'Close the prescription with a line and sign it.')], 'rules');
    return h;
  }
  ACT.copyrx = function () { var cur = current(); if (cur) copy(rxText(cur, chosen(cur))); };
  ACT.sharerx = function () { var cur = current(); if (cur) navigator.share({ title: 'Rx', text: rxText(cur, chosen(cur)) }).catch(function () {}); };
  ACT.print = function () { window.print(); };
  function copy(t) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast(A('نُسخت', 'Copied')); }, function () { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); toast(A('نُسخت', 'Copied')); } catch (e) {} a.remove(); }); }
  function ordersList(cur) {
    var o = [], list = chosen(cur), adm = /adm|sev|severe|ill|sys|shock|dh|nodh|neo|er/.test(cur.v.id) || P.set !== 'op';
    if (adm) o.push('Admit to the paediatric ward' + (P.name ? ' (' + P.name + ')' : ''));
    o.push('Weight ' + wtTxt() + (hasAge() ? ', age ' + E.ageText(P) : ''));
    o.push('Vital signs ' + (/sev|severe|shock|ill|sys/.test(cur.v.id) ? 'every hour' : 'every 4 hours') + '; input and output chart');
    if (cur.v.fluid) { var f = E.fluid(cur.v.fluid, P); if (f) f.order.forEach(function (x) { o.push(x); }); }
    list.forEach(function (d) { if (d.txt) o.push(d.txt); else o.push(E.rxLine(d).name + ': ' + (d.text || '') + ' ' + E.route(d.route) + ' ' + E.freq(d.f) + (d.dur ? ' for ' + d.dur : '')); });
    var done = labsEntered();
    if (done.length) o.push('Results: ' + done.map(function (x) { return x.f[1] + ' ' + x.v + (x.flag === 'lo' ? ' (low)' : x.flag === 'hi' && x.f[2] !== 'sel' ? ' (high)' : ''); }).join('; '));
    (cur.c.inv || []).forEach(function (x) { o.push('Investigation: ' + x); });
    return o;
  }
  function orders() {
    var cur = current(); if (!cur) return noDx('Order sheet');
    head('Order sheet', T(cur.c.t + ' · ' + cur.v.t));
    return '<section class="paper"><div class="pp-h"><img src="img/logo-smra.webp" alt=""><div><b>' + T("Doctor's orders") + '</b><small dir="ltr">' + today() + '</small></div></div><div class="pp-dx"><small>Dx</small>' + T(cur.c.t) + '</div><ol class="pp-o" dir="ltr">' +
      ordersList(cur).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol><div class="pp-f"><i></i><small>' + A('التوقيع', 'Signature') + '</small></div></section>' +
      '<div class="dock static"><button class="btn pri" data-act="copyord">' + ic('copy') + A('نسخ', 'Copy') + '</button><button class="btn" data-act="print">' + ic('print') + A('طباعة', 'Print') + '</button><button class="btn" data-go="c/' + cur.c.id + '">' + ic('list') + A('خطة العلاج', 'Plan') + '</button></div>';
  }
  ACT.copyord = function () { var cur = current(); if (cur) copy("Doctor's orders  " + today() + '\nDx: ' + cur.c.t + '\n' + ordersList(cur).map(function (x, i) { return (i + 1) + '. ' + x; }).join('\n')); };

  /* ================= Drug book ================= */
  var DQ = '';
  /* drugs by group (owner, 27 Nov 2026: "put all antibiotics in one place, then pain medications or NSAIDs; be more of groups") */
  var DGROUPS = [
    ['abx', 'Antibiotics', 'المضادات الحيوية', 'pill2', ['penicillin', 'cephalosporin', 'macrolide', 'aminoglycoside', 'carbapenem', 'glycopeptide', 'nitroimidazole', 'sulfa', 'quinolone', 'tetracycline', 'amphenicol']],
    ['mal', 'Antimalarials & worms', 'الملاريا والطفيليات', 'virus', ['antimalarial', 'anthelmintic']],
    ['avf', 'Antivirals & antifungals', 'مضادات الفيروسات والفطريات', 'virus', ['antiviral', 'antifungal', 'antiseptic']],
    ['pain', 'Pain & fever', 'المسكنات وخافضات الحرارة', 'bolt', ['analgesic', 'nsaid', 'opioid']],
    ['resp', 'Respiratory', 'الجهاز التنفسي', 'lungs', ['beta2', 'anticholinergic', 'neb', 'xanthine', 'mucolytic', 'herbal', 'decongestant', 'nasal']],
    ['all', 'Steroids & allergy', 'الستيرويد والحساسية', 'shield', ['adrenergic', 'steroid', 'antihistamine']],
    ['cvs', 'Heart', 'القلب والدورة الدموية', 'heart', ['diuretic', 'acei', 'glycoside', 'inotrope', 'vasodilator', 'ccb']],
    ['cns', 'Seizures & CNS', 'التشنجات والجهاز العصبي', 'brain', ['benzodiazepine', 'anticonvulsant', 'antipsychotic']],
    ['gi', 'Stomach & gut', 'المعدة والأمعاء', 'gut', ['antiemetic', 'ppi', 'h2', 'laxative', 'antiflatulent', 'antispasmodic']],
    ['flu', 'Fluids & blood', 'السوائل والأملاح والدم', 'drop2', ['fluid', 'electrolyte', 'iron', 'insulin']],
    ['vit', 'Vitamins & minerals', 'الفيتامينات والمعادن', 'flask', ['vitamin', 'mineral']],
    ['imm', 'Antivenoms', 'الأمصال', 'shield', ['immunoglobulin', 'antivenom']],
    ['eye', 'Eye & skin', 'العين والجلد', 'eye', ['eye', 'skin']]
  ];
  var CLSN = { penicillin: 'Penicillins', cephalosporin: 'Cephalosporins', macrolide: 'Macrolides', aminoglycoside: 'Aminoglycosides', carbapenem: 'Carbapenems', glycopeptide: 'Glycopeptides',
    nitroimidazole: 'Nitroimidazoles', sulfa: 'Sulphonamides', quinolone: 'Quinolones', tetracycline: 'Tetracyclines', amphenicol: 'Chloramphenicol', antimalarial: 'Antimalarials', anthelmintic: 'Anthelmintics',
    antiviral: 'Antivirals', antifungal: 'Antifungals', antiseptic: 'Antiseptics', analgesic: 'Simple analgesics', nsaid: 'NSAIDs', opioid: 'Opioids', beta2: 'Beta-2 agonists', anticholinergic: 'Anticholinergics',
    neb: 'Nebulised saline', xanthine: 'Xanthines', mucolytic: 'Mucolytics', herbal: 'Herbal cough remedies', decongestant: 'Decongestants', nasal: 'Nasal drops', adrenergic: 'Adrenaline',
    steroid: 'Corticosteroids', antihistamine: 'Antihistamines', diuretic: 'Diuretics', acei: 'ACE inhibitors', glycoside: 'Cardiac glycosides', inotrope: 'Inotropes', vasodilator: 'Vasodilators',
    ccb: 'Calcium-channel blockers', benzodiazepine: 'Benzodiazepines', anticonvulsant: 'Anticonvulsants', antipsychotic: 'Antipsychotics', antiemetic: 'Antiemetics', ppi: 'Proton-pump inhibitors',
    h2: 'H2 blockers', laxative: 'Laxatives', antiflatulent: 'Antiflatulents', antispasmodic: 'Antispasmodics', fluid: 'Fluids', electrolyte: 'Electrolytes', iron: 'Iron', insulin: 'Insulin',
    vitamin: 'Vitamins', mineral: 'Minerals', immunoglobulin: 'Immunoglobulins', antivenom: 'Antivenoms', eye: 'Eye drops and ointments', skin: 'Skin preparations' };
  function dgOf(d) { var c = d.cls[0]; return DGROUPS.find(function (g) { return g[4].indexOf(c) >= 0; }) || DGROUPS[DGROUPS.length - 1]; }
  function dgDrugs(g) { return Object.keys(DR).map(function (k) { return DR[k]; }).filter(function (d) { return dgOf(d) === g; }); }
  function drugs(gid) {
    var g = gid && DGROUPS.find(function (x) { return x[0] === gid; });
    if (g) {
      head(g[1], esc(g[2]) + ' · ' + A(dgDrugs(g).length + ' دواء', dgDrugs(g).length + ' drugs'));
      return '<div class="srch">' + ic('search') + '<input id="dq" type="search" dir="auto" value="' + esc(DQ) + '" placeholder="' + A('ابحث في هذه المجموعة', 'Search this group') + '"></div><div id="dlist">' + drugList(g) + '</div>';
    }
    head('Drug book', A('اختر المجموعة ثم الدواء، أو ابحث مباشرة', 'Choose the group, then the drug, or search'));
    return '<div class="srch">' + ic('search') + '<input id="dq" type="search" dir="auto" value="' + esc(DQ) + '" placeholder="' + A('ابحث باسم علمي أو تجاري', 'Search a generic or brand name') + '"></div><div id="dlist">' + drugList() + '</div>';
  }
  function drugRow(d, showGroup) {
    return '<button class="lrow" data-go="drug/' + d.id + '"><span class="lrow-i">' + ic(dgOf(d)[3]) + '</span><span class="lrow-t">' + T(d.g) + '<small dir="ltr">' + esc((d.b || []).slice(0, 3).join(' · ') || (showGroup ? dgOf(d)[1] : '')) + '</small></span>' + ic('fwd', 'chv') + '</button>';
  }
  function drugList(g) {
    var q = DQ.trim().toLowerCase();
    if (!g && !q) return '<h2 class="st">' + T('Drug groups') + '</h2><div class="qt">' + DGROUPS.map(function (x) {
      return '<button class="tool" data-go="drugs/' + x[0] + '"><span class="ib2 lg">' + ic(x[3]) + '</span><span class="tool-t"><b>' + T(x[1]) + '</b><small>' + A(dgDrugs(x).length + ' دواء', dgDrugs(x).length + ' drugs') + '</small></span>' + ic('fwd', 'chv') + '</button>';
    }).join('') + '</div>';
    var L = (g ? dgDrugs(g) : Object.keys(DR).map(function (k) { return DR[k]; })).filter(function (d) { return !q || (d.g + ' ' + (d.b || []).join(' ') + ' ' + d.cls.join(' ')).toLowerCase().indexOf(q) >= 0; });
    if (!L.length) return '<p class="empty">' + A('لا توجد نتيجة', 'Nothing found') + '</p>';
    if (!g) return '<section class="card list">' + L.sort(function (a, b) { return a.g.localeCompare(b.g); }).map(function (d) { return drugRow(d, 1); }).join('') + '</section>';
    return g[4].map(function (c) {
      var ds = L.filter(function (d) { return d.cls[0] === c; }).sort(function (a, b) { return a.g.localeCompare(b.g); }); if (!ds.length) return '';
      return '<h2 class="st sub">' + T(CLSN[c] || c) + '<small>' + ds.length + '</small></h2><section class="card list">' + ds.map(function (d) { return drugRow(d); }).join('') + '</section>';
    }).join('');
  }
  ACT.azgo = function (a) { var t = document.getElementById('az-' + a.dataset.k); if (t) scrollTo({ top: t.getBoundingClientRect().top + scrollY - 140, behavior: 'smooth' }); };
  var KEYN = { po: 'Oral', iv: 'IV', im: 'IM', pr: 'Rectal', neb: 'Nebuliser', std: 'Standard', prn: 'When needed', load: 'Loading dose', maint: 'Maintenance', start: 'Starting dose', sev: 'Severe', severe: 'Severe infection',
    mening: 'Meningitis', neo: 'Neonate', inj: 'Injection', inf: 'Infusion', ana: 'Anaphylaxis', asthma: 'Asthma', croup: 'Croup', croupRep: 'Croup (repeat)', tx: 'Treatment', proph: 'Prophylaxis', ge: 'Diarrhoea', hf: 'Heart failure (IV)',
    hfm: 'Heart failure (oral)', rf: 'Rheumatic fever', rfallergy: 'Rheumatic fever (penicillin allergy)', typhoid: 'Typhoid', hp: 'H. pylori', bolus: 'Bolus', tonsil: 'Tonsillitis', scd: 'Sickle cell disease', renal: 'Kidney infection',
    osteo: 'Osteomyelitis', pertussis: 'Whooping cough', cholera: 'Cholera', amoeba: 'Amoebiasis', giardia: 'Giardiasis', pre: 'Pre-referral', vivax: 'Vivax malaria', sting: 'Scorpion sting', nephrotic: 'Nephrotic syndrome',
    hypoMg: 'Low magnesium', arrest: 'Cardiac arrest', aki: 'Acute kidney injury', tetanus: 'Tetanus', chorea: 'Chorea', loss: 'Replacing losses', schisto: 'Schistosomiasis', tapeworm: 'Tapeworm', hdn: 'Bleeding (newborn)',
    measles: 'Measles', sam: 'Severe malnutrition', dka: 'DKA', jaundice: 'Neonatal jaundice', local: 'Local symptoms', systemic: 'Systemic symptoms' };
  /* ---- the drug page answers for the current patient (owner, 28 Nov 2026: "a 6-day-old with heart failure: can he take penicillin,
     which preparation, by mouth, 1 mL of which preparation?") ---- */
  function lines(c, id) { var out = []; c.variants.forEach(function (v) { v.lines.forEach(function (l) { l.items.forEach(function (it) { if (it.d === id) out.push({ v: v, l: l, it: it }); }); }); }); return out; }
  function planDrugs(c) { var s = []; c.variants.forEach(function (v) { v.lines.forEach(function (l) { l.items.forEach(function (it) { if (it.d && s.indexOf(it.d) < 0 && DR[it.d]) s.push(it.d); }); }); }); return s; }
  function inPlan(d) { var c = P.dx && byId[P.dx]; return !!(c && lines(c, d.id).length); }
  /* a newborn dose exists when the drug has a newborn rule, or a newborn condition of the local guidelines uses it */
  function neoUses(d) { return DX.filter(function (c) { return c.sys === 'neo' && lines(c, d.id).length; }); }
  function neoOK(d) {
    var rule = Object.keys(d.reg || {}).some(function (k) { return /^(neo|hdn|jaundice)/.test(k) || [].concat(d.reg[k]).some(function (r) { return r && r.when && r.when.dmax != null; }); });
    return rule || neoUses(d).length > 0;
  }
  function vname(v) { return v.t || v.n || v.name || ''; }
  /* the rules of this drug that fit the patient: the ones his diagnosis plan uses, and for a newborn the ones newborn plans use */
  function relRules(d) {
    if (!ready()) return [];
    var out = [], c = P.dx && byId[P.dx];
    function add(cc) { lines(cc, d.id).forEach(function (x) { if (!out.some(function (y) { return y.r === x.it.r && y.t === cc.t; })) out.push({ r: x.it.r, t: cc.t }); }); }
    if (c) add(c);
    if (E.isNeo(P)) neoUses(d).forEach(add);
    return out;
  }
  function forPatient(d) {
    if (!ready()) return '';
    var c = P.dx && byId[P.dx], rows = [], neo = E.isNeo(P);
    function row(lvl, html) { rows.push('<div class="fp-r ' + lvl + '"><span class="fp-i">' + (lvl === 'ok' ? '✓' : lvl === 'no' ? '✕' : lvl === 'info' ? 'i' : '!') + '</span><div>' + html + '</div></div>'); }
    /* 1. the patient's diagnosis */
    if (c) {
      var mine = lines(c, d.id);
      if (mine.length) row('ok', A('ضمن خطة ', 'Part of the plan for ') + T(c.t) + ': ' + mine.map(function (x) { return '<bdi dir="ltr">' + esc(vname(x.v)) + (x.l.t ? ' · ' + esc(x.l.t) : '') + '</bdi>'; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).join('، '));
      else {
        var pd = planDrugs(c);
        row('warn', A('ليس من خطة ', 'Not part of the plan for ') + T(c.t) + (pd.length ? '. ' + A('الخطة تستعمل: ', 'The plan uses: ') + pd.map(function (x) { return '<button class="fp-d" data-go="drug/' + x + '">' + T(drugName(DR[x]).main) + '</button>'; }).join('') : '') +
          ' <button class="fp-d go" data-go="c/' + c.id + '">' + A('افتح الخطة', 'Open the plan') + '</button>');
      }
    }
    /* 2. newborns */
    if (neo) {
      var nu = neoUses(d), hasRule = neoOK(d) && !nu.length ? true : Object.keys(d.reg || {}).some(function (k) { return /^(neo|hdn|jaundice)/.test(k) || [].concat(d.reg[k]).some(function (r) { return r && r.when && r.when.dmax != null; }); });
      if (nu.length) row('ok', A('يُعطى لحديثي الولادة في: ', 'Given to newborns in: ') + nu.map(function (x) { return lines(x, d.id).map(function (y) { return '<button class="fp-d" data-go="c/' + x.id + '">' + T(x.t + (vname(y.v) ? ' — ' + vname(y.v) : '')) + '</button>'; }).join(''); }).join(''));
      else if (hasRule) row('ok', A('له جرعة خاصة بحديثي الولادة (أدناه).', 'Has a newborn dose (below).'));
      else if (!inPlan(d)) row('no', A('لا توجد جرعة لحديثي الولادة في الأدلة المحلية: لا تعطِ جرعة الأطفال الكبار، واستشر الأخصائي.', 'The local guidelines give no newborn dose: do not use the older-child dose; ask your senior.') +
        (dgOf(d)[0] === 'abx' && byId.neosepsis ? ' <button class="fp-d go" data-go="c/neosepsis">' + A('عدوى حديثي الولادة: خطة Neonatal sepsis', 'Newborn infection: Neonatal sepsis plan') + '</button>' : ''));
    }
    /* 3. how it can be given */
    var routes = {}; d.forms.forEach(function (f) { (routes[f.r] = routes[f.r] || []).push(f.n.split(' ')[0].toLowerCase()); });
    row('info', A('طرق الإعطاء: ', 'Can be given: ') + Object.keys(routes).map(function (r) { return '<b>' + E.route(r, AR) + '</b> <small dir="ltr">(' + esc(routes[r].filter(function (x, i, a) { return a.indexOf(x) === i; }).join(', ')) + ')</small>'; }).join(' · '));
    /* 4. reasons it must not be given (allergy, age, conditions) */
    E.checks(d, P, null).forEach(function (w) { row(w.lvl === 'stop' ? 'no' : 'warn', '<span dir="ltr">' + esc(w.t) + '</span>'); });
    return '<section class="card fp"><h3 class="fp-h">' + ic('baby') + T('For this patient') + '<small dir="ltr">' + [hasAge() ? ageTxt() : '', wtTxt()].filter(Boolean).join(' · ') + '</small></h3>' + rows.join('') + '</section>';
  }
  /* which preparation the amount is measured from, and the same dose in the other liquids */
  function fromForm(d, k, o) {
    var f = o.form; if (!f || o.fixed) return '';
    var t = '<em class="ff">' + A('من ', 'of ') + '<bdi dir="ltr">' + esc(f.n) + '</bdi>' + (o.mg != null && o.unit === 'mg' && f.r === 'PO' ? ' <bdi dir="ltr">(' + nice(o.mg) + ' mg)</bdi>' : '') + '</em>';
    var rule = E.rule(d, k, P), ids = (rule && rule.forms) || [];
    if (f.r === 'PO' && f.c && o.mg != null) {
      var alt = d.forms.filter(function (x) { return x !== f && x.r === 'PO' && x.c && ids.indexOf(x.id) >= 0; }).map(function (x) {
        var vol = o.mg / x.c, rv = vol >= 2 ? Math.round(vol * 2) / 2 : Math.max(0.1, Math.round(vol * 10) / 10);
        return '<bdi dir="ltr">' + nice(rv) + ' mL ' + A('من ', 'of ') + esc(x.n) + '</bdi>';
      });
      if (alt.length) t += '<em class="ff alt">' + A('أو ', 'or ') + alt.join(A(' أو ', ' or ')) + '</em>';
    }
    return t;
  }
  function drug(id) {
    var d = DR[id]; if (!d) return notFound();
    head(d.g, '<bdi dir="ltr">' + esc((d.b || []).join(' · ')) + '</bdi>');
    var users = DX.filter(function (c) { return c.variants.some(function (v) { return v.lines.some(function (l) { return l.items.some(function (it) { return it.d === id; }); }); }); });
    var h = '<div class="tagrow"><span data-go="drugs/' + dgOf(d)[0] + '">' + esc(dgOf(d)[1]) + '</span><span>' + esc(CLSN[d.cls[0]] || d.cls[0]) + '</span></div>';
    /* names as written on the box (owner, 28 Nov 2026: "where is the local name for the drug") */
    if ((d.b || []).length) h += '<div class="tnames"><small>' + A('الاسم التجاري', 'Trade names') + '</small>' + d.b.map(function (b) { return '<b dir="ltr">' + esc(b) + '</b>'; }).join('') + '</div>';
    h += forPatient(d);
    h += sec('Preparations', 'flask', '<div class="preps">' + d.forms.map(function (f) { return '<div class="prep"><b dir="ltr">' + esc(f.n) + '</b><small>' + E.route(f.r, AR) + '</small>' + (f.rec ? '<p dir="ltr">' + esc(f.rec) + '</p>' : '') + '</div>'; }).join('') + '</div>');
    h += '<h2 class="st">' + T('Doses for this patient') + '</h2>' + (+P.wt > 0 ? '' : quickPt());
    var rel = relRules(d), keys = Object.keys(d.reg);
    if (rel.length) keys = keys.filter(function (k) { return rel.some(function (x) { return x.r === k; }); }).concat(keys.filter(function (k) { return !rel.some(function (x) { return x.r === k; }); }));
    h += '<section class="card list doses">' + keys.map(function (k) {
      var o = E.dose(id, k, P, prefForm(id, k)); if (o.err) return '';
      var noNeo = ready() && E.isNeo(P) && !neoOK(d) && !inPlan(d);
      var how = !ready() ? '<small dir="ltr">' + esc(o.sc || '') + '</small>' : noNeo ? '<b class="no">' + A('لا توجد جرعة لحديثي الولادة', 'No newborn dose') + '</b>' :
        '<b dir="ltr">' + esc(amount(o)) + '</b>' + fromForm(d, k, o) + '<small>' + [E.route(o.route, AR), E.freq(o.f, AR), o.dur ? '<bdi dir="ltr">' + esc(o.dur) + '</bdi>' : ''].filter(Boolean).join(' · ') + '</small>';
      var why = rel.filter(function (x) { return x.r === k; }), cls = rel.length ? (why.length ? ' hit' : ' dim') : '';
      return (rel.length && !why.length && keys.indexOf(k) === rel.reduce(function (a, x) { return a.indexOf(x.r) < 0 ? a.concat(x.r) : a; }, []).length ? '<div class="drow-sep">' + A('استعمالات أخرى', 'Other uses') + '</div>' : '') +
        '<div class="drow' + cls + '"><span class="drow-k">' + T(KEYN[k] || k) + (why.length ? '<em class="forpt">' + A('لهذا المريض', 'For this patient') + ': ' + why.map(function (x) { return T(x.t); }).join(', ') + '</em>' : '') + '</span><span class="drow-v">' + how + (ready() && stopped(o) ? '<em class="no">' + A('ممنوع لهذا المريض', 'Not for this patient') + '</em>' : '') + '</span><button class="pr-i" data-act="info" data-k="' + id + '|' + k + '">i</button></div>';
    }).join('') + '</section>';
    var ci = d.ci || {}, cil = []; if (ci.amin != null) cil.push(ci.why || ('Not under ' + ci.amin + ' months'));
    ['neonate', 'jaundice', 'asthma', 'dengue', 'g6pd', 'renal', 'liver', 'sam', 'cardiac'].forEach(function (k) { if (ci[k]) cil.push(ci[k]); });
    h += acc('Contraindications and cautions', 'shield', cil, 'trap', true);
    if (users.length) h += sec('Used in', 'list', '<div class="rec">' + users.map(function (c) { return '<button data-go="c/' + c.id + '">' + T(c.t) + '</button>'; }).join('') + '</div>');
    return h + disc();
  }

  /* ================= Calculators ================= */
  var CALCS = [
    ['maint', 'Maintenance fluids', 'drop', 'كمية السوائل الوريدية في اليوم وكل 8 ساعات', 'Daily IV fluid and the 8-hourly bag', '100 · 50 · 20 mL/kg (Holliday–Segar)'],
    ['dehyd', 'Dehydration plans', 'drop', 'خطة A و B و C والصدمة وسوء التغذية', 'Plans A, B, C, shock and SAM', 'WHO / IMCI'],
    ['drops', 'Drip rate', 'drop', 'نقطة في الدقيقة ومل في الساعة', 'Drops per minute and mL per hour', 'mL × 20 ÷ (h × 60)'],
    ['k', 'Potassium correction', 'bolt', 'كمية KCl في اليوم وفي كل محلول', 'KCl per day and per bag', '[(4 − K) × wt/2] + maintenance'],
    ['na', 'Sodium deficit', 'bolt', 'النقص بالمليمول، محلول 3% أو NS', 'Deficit as 3% or NS', 'wt × (130 − Na) × 0.6'],
    ['gir', 'Glucose infusion rate', 'calc', 'كمية الجلوكوز التي يأخذها الطفل', 'How much glucose the child receives', '% × mL/h ÷ (wt × 6)'],
    ['uo', 'Urine output', 'kidney', 'مل لكل كجم في الساعة', 'mL per kg per hour', 'mL ÷ wt ÷ h'],
    ['gfr', 'GFR (Schwartz)', 'kidney', 'وظيفة الكلى عند الأطفال', 'Kidney function in children', '0.41 × height ÷ creatinine'],
    ['bsa', 'Body surface area', 'user', 'المساحة والسوائل غير المحسوسة', 'Surface area and insensible loss', '√(wt × height ÷ 3600)'],
    ['inf', 'Inotrope infusion', 'heart', 'دوبامين أو أدرينالين في 100 مل', 'Dopamine or adrenaline in 100 mL', 'wt × mcg × 1440 ÷ 1000'],
    ['blood', 'Blood transfusion', 'drop', 'الدم الكامل أو الكريات المركزة', 'Whole blood or packed cells', '20 mL/kg · wt × ΔHb × 3'],
    ['wt', 'Weight from age', 'baby', 'وزن تقديري عند غياب الميزان', 'An estimate when there is no scale', '(m + 9)/2 · 2y + 8 · (7y − 5)/2'],
    ['prep', 'Preparing IV fluids', 'flask', 'تحضير المحاليل من المتوفر', 'Making fluids from what is available', 'D50 · D10 · NS'],
    ['ett', 'Tube sizes', 'stetho', 'أنبوب القصبة والأنبوب الأنفي', 'Endotracheal and NG tube', 'age/4 + 4']
  ];
  var CGROUPS = [['Fluids', ['maint', 'dehyd', 'drops', 'blood', 'prep']], ['Electrolytes & glucose', ['k', 'na', 'gir']], ['Kidney', ['uo', 'gfr']], ['Other', ['bsa', 'inf', 'wt', 'ett']]];
  var CSHORT = { maint: 'Maintenance', dehyd: 'Dehydration', drops: 'Drip rate', blood: 'Transfusion', prep: 'Prepare fluids', k: 'Potassium', na: 'Sodium', gir: 'GIR', uo: 'Urine output', gfr: 'GFR', bsa: 'BSA', inf: 'Inotropes', wt: 'Weight from age', ett: 'Tube sizes' };
  function calc(id) {
    if (!id) {
      head('Calculators', A('تعمل بوزن المريض الحالي تلقائيًا', 'They use the current patient\'s weight'));
      return '<button class="emg" data-go="emerg"><span class="emg-i">' + ic('siren') + '</span><span class="emg-t"><b>' + T('Emergency doses') + '</b><small>' + A('كل جرعات الطوارئ بالوزن في صفحة واحدة', 'Every emergency dose by weight on one page') + '</small></span>' + '<span class="emg-go">' + ic('fwd') + '</span></button>' +
        CGROUPS.map(function (g) { return '<h2 class="st sub">' + T(g[0]) + '</h2><div class="mt">' + g[1].map(function (id) { var c = CALCS.find(function (x) { return x[0] === id; });
          return '<button class="mtile" data-go="calc/' + id + '"><span class="ib2">' + ic(c[2]) + '</span><b>' + T(CSHORT[id]) + '</b></button>'; }).join('') + '</div>'; }).join('');
    }
    var c = CALCS.find(function (x) { return x[0] === id; }); if (!c) return notFound();
    head(c[1], A(c[3], c[4]));
    return '<section class="card clc"><div class="clc-f"><small>' + A('المعادلة', 'Formula') + '</small><code dir="ltr">' + esc(c[5]) + '</code></div>' + (id === 'prep' ? '' : '<form id="cf" data-c="' + id + '" autocomplete="off">' + calcInputs(id) + '</form>') + '</section><section id="cres"></section>';
  }
  function cin(n, lab, v, unit, step) { return '<label class="fld"><span>' + lab + '</span><div class="inp"><input name="' + n + '" type="number" inputmode="decimal" step="' + (step || 'any') + '" value="' + esc(v == null ? '' : v) + '" dir="ltr">' + (unit ? '<em>' + unit + '</em>' : '') + '</div></label>'; }
  function csel(n, lab, o, cur) { return '<label class="fld"><span>' + lab + '</span><div class="inp pick"><select name="' + n + '" dir="ltr">' + o.map(function (x) { return '<option value="' + x[0] + '"' + (String(x[0]) === String(cur) ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></div></label>'; }
  var W = function () { return ready() ? nice(E.wt(P)) : ''; };
  function calcInputs(id) {
    var w = cin('wt', A('الوزن', 'Weight'), W(), 'kg');
    var g = function () { return '<div class="flds">' + Array.prototype.join.call(arguments, '') + '</div>'; };
    switch (id) {
      case 'maint': return g(w, csel('x', A('الكمية', 'Amount'), [[1, 'Full'], [0.667, '⅔'], [1.5, '1½'], [2, 'Double']]));
      case 'dehyd': return g(w, csel('pl', A('الخطة', 'Plan'), [['planA', 'Plan A'], ['planB', 'Plan B'], ['planC', 'Plan C'], ['resomal', 'ReSoMal (SAM)'], ['shock', 'Shock'], ['samShock', 'Shock in SAM']], 'planC'));
      case 'drops': return g(cin('ml', A('الكمية', 'Volume'), 500, 'mL'), cin('h', A('المدة', 'Time'), 8, A('ساعة', 'h')), csel('set', A('جهاز التنقيط', 'Giving set'), [[20, '20 drops/mL'], [15, '15 drops/mL'], [60, '60 (micro)']]));
      case 'k': return g(w, cin('k', A('البوتاسيوم', 'Serum K'), P.lab.k, 'mmol/L', 0.1), csel('m', A('الاحتياج اليومي', 'Daily need'), [[1, '1 mmol/kg'], [2, '2 mmol/kg']]));
      case 'na': return g(w, cin('na', A('الصوديوم', 'Serum Na'), P.lab.na, 'mmol/L'));
      case 'gir': return g(w, cin('pc', A('تركيز الدكستروز', 'Dextrose'), 10, '%'), cin('r', A('معدل المحلول', 'Fluid rate'), '', 'mL/h'));
      case 'uo': return g(w, cin('ml', A('كمية البول', 'Urine'), '', 'mL'), cin('h', A('خلال', 'Over'), 12, A('ساعة', 'h')));
      case 'gfr': return g(cin('ht', A('الطول', 'Height'), P.ht, 'cm'), cin('cr', A('الكرياتينين', 'Creatinine'), P.lab.cr, 'mg/dL', 0.01));
      case 'bsa': return g(w, cin('ht', A('الطول', 'Height'), P.ht, 'cm'));
      case 'inf': return g(w, csel('dg', A('الدواء', 'Drug'), [['dop', 'Dopamine 200 mg/5 mL'], ['adr', 'Adrenaline 1 mg/mL']]), cin('mc', A('الجرعة', 'Dose'), 5, 'mcg/kg/min', 0.01));
      case 'blood': return g(w, cin('hb', A('الهيموغلوبين الحالي', 'Current Hb'), P.lab.hb, 'g/dL', 0.1), cin('tg', A('الهيموغلوبين المطلوب', 'Target Hb'), 10, 'g/dL', 0.1));
      case 'wt': return g(cin('ay', A('سنوات', 'Years'), P.ay, A('سنة', 'y'), 1), cin('am', A('شهور', 'Months'), P.am, A('شهر', 'm'), 1), cin('ad', A('أيام', 'Days'), P.ad, A('يوم', 'd'), 1));
      case 'ett': return g(cin('ay', A('العمر', 'Age'), P.ay, A('سنة', 'y'), 1), w);
      default: return '';
    }
  }
  function num(f, n) { var x = f[n] ? parseFloat(f[n].value) : NaN; return isNaN(x) ? null : x; }
  function kv(r) { return '<table class="kv">' + r.map(function (x) { return '<tr><th>' + x[0] + '</th><td dir="ltr">' + esc(x[1]) + '</td></tr>'; }).join('') + '</table>'; }
  function result(big, bigLabel, rest, notes) {
    return '<div class="res-big"><small>' + bigLabel + '</small><b dir="ltr">' + esc(big) + '</b></div>' + (rest && rest.length ? '<section class="card">' + kv(rest) + '</section>' : '') +
      (notes && notes.length ? '<ul class="tips">' + notes.map(function (n) { return '<li>' + n + '</li>'; }).join('') + '</ul>' : '');
  }
  function calcRun() {
    var f = $('#cf'), out = $('#cres'); if (!f || !out) return;
    var id = f.dataset.c, wt = num(f, 'wt'), p2 = Object.assign({}, P, { wt: wt || P.wt });
    var need = function () { out.innerHTML = '<div class="res-empty">' + ic('calc') + '<span>' + A('أدخل القيم بالأعلى وتظهر النتيجة هنا مباشرة.', 'Fill in the values above; the result appears here at once.') + '</span></div>'; };
    var H;
    if (id === 'maint') { if (!wt) return need(); var v = E.maint(wt) * +f.x.value, cp = E.capDaily(p2, v); v = cp.v; H = result(nice(v) + ' mL', A('السوائل في اليوم', 'Fluid per day'), [[A('كل 8 ساعات', 'Every 8 h'), nice(v / 3) + ' mL · ' + E.drops(v / 3, 8) + ' drops/min'], [A('بالساعة', 'Per hour'), nice(v / 24) + ' mL/h'], [A('النوع', 'Type'), E.fluidType(p2)], ['Holliday–Segar', E.maintCalc(wt)]], cp.note ? [esc(cp.note)] : []); }
    else if (id === 'dehyd') { if (!wt) return need(); var fl = E.fluid({ k: f.pl.value }, p2); H = '<div class="res-big"><small dir="ltr">' + esc(fl.t) + '</small><b dir="ltr" class="sm">' + esc(fl.order[0] || '') + '</b></div><section class="card">' + kv(fl.rows.map(function (r) { return ['<bdi dir="ltr">' + esc(r[0]) + '</bdi>', r[1]]; })) + '</section>' + (fl.notes.length ? '<ul class="tips">' + fl.notes.map(function (n) { return '<li dir="ltr">' + esc(n) + '</li>'; }).join('') + '</ul>' : ''); }
    else if (id === 'drops') { var ml = num(f, 'ml'), h = num(f, 'h'), s = +f.set.value; if (!ml || !h) return need(); H = result(Math.round(ml * s / (h * 60)) + ' drops/min', A('معدل التنقيط', 'Drip rate'), [[A('بالمضخة', 'With a pump'), nice(ml / h) + ' mL/h']]); }
    else if (id === 'k') {
      var k = num(f, 'k'); if (!wt || k == null) return need(); var mm = +f.m.value, tot = Math.max(0, (4 - k) * wt / 2) + mm * wt, pf = k >= 3 ? [0.25, 1] : k >= 2.5 ? [0.5, 2] : [0.75, 3];
      var rest = [[A('في كل محلول 8 ساعات', 'In each 8-hour bag'), nice(tot / 6) + ' mL KCl'], [A('المعادلة', 'Equation'), '[(4 − ' + k + ') × ' + nice(wt) + '/2] + ' + mm + ' × ' + nice(wt) + ' = ' + nice(tot) + ' mmol']];
      if (k < 3.5) rest.push([A('تصحيح وريدي (PFCCS)', 'IV correction (PFCCS)'), nice(pf[0] * wt) + ' mmol = ' + nice(pf[0] * wt / 2) + ' mL over ' + pf[1] + ' h']);
      rest.push([A('أقصى معدل', 'Maximum rate'), nice(0.4 * wt) + ' mmol/h']);
      H = result(nice(tot / 2) + ' mL = ' + nice(tot) + ' mmol', A('KCl 15% خلال 24 ساعة', 'KCl 15% over 24 hours'), rest, [A('بعد أن يتبول الطفل فقط. لا يعطى البوتاسيوم مركّزًا أو دفعة واحدة أبدًا.', 'Only after the child passes urine. Never undiluted or as a bolus.'), A('المعادلة الأولى شائعة في المستشفيات لكنها بلا دليل علمي.', 'The first equation is common practice without an evidence base.')]);
    }
    else if (id === 'na') { var na = num(f, 'na'); if (!wt || na == null) return need(); if (na >= 130) H = result(A('لا نقص', 'No deficit'), A('الصوديوم', 'Sodium'), [], [A('لا يحتاج تصحيحًا خاصًا.', 'No specific correction needed.')]); else { var def = wt * (130 - na) * 0.6; H = result(nice(def) + ' mmol', A('نقص الصوديوم', 'Sodium deficit'), [['3% NaCl', nice(def / 0.5) + ' mL'], ['NS 0.9%', nice(def / 0.154) + ' mL'], [A('الحساب', 'Calculation'), nice(wt) + ' × (130 − ' + na + ') × 0.6']], [A('لا يرفع الصوديوم أكثر من 10–12 mmol/L في اليوم.', 'Do not raise Na by more than 10–12 mmol/L per day.')].concat(na < 120 ? [A('مع تشنجات: 3% NaCl بسرعة لرفعه 5 mmol/L ثم ببطء.', 'With seizures: 3% saline quickly to raise Na by 5, then slowly.')] : [])); } }
    else if (id === 'gir') { var pc = num(f, 'pc'), rt = num(f, 'r'); if (!wt || !pc || !rt) return need(); var gg = pc * rt / (wt * 6); H = result(nice(gg) + ' mg/kg/min', 'GIR', [], [gg > 12 ? A('أكثر من 12: ابحث عن سبب نقص السكر المستمر.', 'Above 12: investigate persistent hypoglycaemia.') : A('القيمة أكثر من 12 تحتاج بحثًا عن سبب نقص السكر.', 'A value above 12 needs a search for the cause of hypoglycaemia.')]); }
    else if (id === 'uo') { var u = num(f, 'ml'), hh = num(f, 'h'); if (!wt || !u || !hh) return need(); var x = u / wt / hh; H = result(nice(x) + ' mL/kg/h', A('إخراج البول', 'Urine output'), [[A('التفسير', 'Meaning'), x < 0.5 ? 'Oliguria (< 0.5)' : x > 4 ? 'Polyuria (> 4)' : 'Normal (0.5–2)']]); }
    else if (id === 'gfr') { var ht = num(f, 'ht'), cr = num(f, 'cr'); if (!ht || !cr) return need(); H = result(nice(0.41 * ht / cr) + ' mL/min/1.73 m²', 'eGFR', [], [A('الكرياتينين بالـ µmol/L ÷ 88.4 = mg/dL.', 'Creatinine in µmol/L ÷ 88.4 = mg/dL.')]); }
    else if (id === 'bsa') { var h2 = num(f, 'ht'); if (!wt || !h2) return need(); var b = Math.sqrt(wt * h2 / 3600); H = result(nice(b) + ' m²', A('مساحة سطح الجسم', 'Body surface area'), [[A('السوائل غير المحسوسة', 'Insensible loss'), nice(400 * b) + ' mL/day']]); }
    else if (id === 'inf') { var mc = num(f, 'mc'); if (!wt || !mc) return need(); var mg = wt * mc * 1440 / 1000, dop = f.dg.value === 'dop'; H = result(nice(mg) + ' mg', A('في 100 مل NS خلال 24 ساعة (4.2 مل/ساعة)', 'In 100 mL NS over 24 h (4.2 mL/h)'), [[A('بالمل', 'Volume'), (dop ? nice(mg / 40) : nice(mg)) + ' mL of ' + (dop ? '200 mg/5 mL' : '1 mg/mL')]], [dop ? A('كلوي 2–5، قلبي 5–15 mcg/kg/min.', 'Renal 2–5, cardiac 5–15 mcg/kg/min.') : '0.05–1 mcg/kg/min.']); }
    else if (id === 'blood') { var hb = num(f, 'hb'), tg = num(f, 'tg'); if (!wt) return need(); var rest2 = [[A('سوء تغذية', 'Malnourished'), nice(10 * wt) + ' mL (10 mL/kg)'], [A('فشل قلب', 'Heart failure'), 'Furosemide ' + nice(wt) + ' mg before and after']]; if (hb != null && tg) rest2.unshift([A('كريات مركزة', 'Packed cells'), nice(Math.max(0, wt * (tg - hb) * 3)) + ' mL']); H = result(nice(20 * wt) + ' mL', A('دم كامل 20 مل/كجم خلال 3–4 ساعات', 'Whole blood 20 mL/kg over 3–4 h'), rest2, [A('لا فوروسيمايد مع الأنيميا المنجلية.', 'No furosemide in sickle cell disease.')]); }
    else if (id === 'wt') { var q = { ay: num(f, 'ay') || 0, am: num(f, 'am') || 0, ad: num(f, 'ad') || 0 }; if (!q.ay && !q.am && !q.ad) return need(); H = result(nice(E.estWeight(q)) + ' kg', A('الوزن التقديري', 'Estimated weight'), [], [A('تقدير فقط؛ الوزن الحقيقي أفضل دائمًا.', 'An estimate only; a real weight is always better.')]); }
    else if (id === 'ett') { var ay = num(f, 'ay'); if (ay == null) return need(); H = result(nice(ay / 4 + 4) + ' mm', A('أنبوب بدون كفة', 'Uncuffed ETT'), [[A('بكفة', 'Cuffed'), nice(ay / 4 + 3.5) + ' mm'], [A('العمق من الفم', 'Oral depth'), nice(ay / 2 + 12) + ' cm']].concat(wt ? [['NG tube', 'about ' + (wt < 5 ? 6 : wt < 15 ? 8 : 10) + ' Fr']] : []), [A('معادلات APLS المعروفة، لعمر أكثر من سنة.', 'Standard APLS formulas, for children over 1 year.')]); }
    out.innerHTML = H;
  }
  var PREP = [['Dextrose 5% ½ saline', '250 mL D10 + 250 mL NS'], ['Dextrose 5% ⅕ saline', 'Remove 200 mL from 500 mL D5W; add 100 mL D10 + 100 mL NS'], ['DNS (D5 in NS)', 'Remove 50 (60) mL from 500 mL NS; add 50 (60) mL D50'],
    ['Dextrose 7.5% ½ saline', 'DKA, RBG < 100 with acidosis: remove 25 (30) mL from 500 mL D5 ½ saline; add 25 (30) mL D50'], ['Dextrose 10% ½ saline', 'DKA; quinine with hypoglycaemia: remove 50 (60) mL from 500 mL D5 ½ saline; add 50 (60) mL D50'],
    ['Dextrose 10%', 'Remove 50 (60) mL from 500 mL D5; add 50 (60) mL D50'], ['Dextrose 12.5%', 'Resistant hypoglycaemia: remove 25 (30) mL from 500 mL D10; add 25 (30) mL D50']];

  /* ================= Emergency ================= */
  var EM = [['adrenalineSC', 'ana', 'Anaphylaxis'], ['hydrocortisone', 'ana', 'Anaphylaxis / shock'], ['chlorphenamine', 'inj', 'Allergy'], ['diazepam', 'iv', 'Convulsion · IV'], ['diazepam', 'pr', 'Convulsion · rectal'],
    ['phenobarbitone', 'load', 'Status / neonatal seizures'], ['dextrose10', 'bolus', 'Hypoglycaemia'], ['cagluc', 'load', 'Hypocalcaemia'], ['dexamethasone', 'croup', 'Croup'], ['dexamethasone', 'mening', 'Meningitis'],
    ['salbutamolNeb', 'neb', 'Wheeze'], ['mgso4', 'asthma', 'Severe asthma'], ['furosemide', 'hf', 'Heart failure']];
  function emerg() {
    head('Emergency doses', ready() ? A('محسوبة لوزن ', 'Calculated for ') + '<bdi dir="ltr">' + wtTxt() + '</bdi>' : '');
    if (!ready()) return quickPt();
    var qp = +P.wt > 0 ? '' : quickPt();
    var wt = E.wt(P);
    var h = qp + '<div class="stats">' + [[nice(20 * wt) + ' mL', 'NS / RL bolus', '20 mL/kg'], [nice(10 * wt) + ' mL', A('رضيع أو قلب', 'Neonate / heart'), '10 mL/kg'], [nice(20 * wt) + ' mL', 'Blood', '20 mL/kg'], [nice(5 * wt) + ' mL', 'D10 (SAM)', '5 mL/kg']].map(function (s) {
      return '<div class="stat"><b dir="ltr">' + s[0] + '</b><span>' + s[1] + '</span><small dir="ltr">' + s[2] + '</small></div>'; }).join('') + '</div>';
    h += '<section class="card list em">' + EM.map(function (e) {
      var o = E.dose(e[0], e[1], P); if (o.err) return '';
      return '<button class="erow" data-go="drug/' + e[0] + '"><span class="erow-t">' + T(e[2]) + '<small dir="ltr">' + esc(o.drug.g) + ' · ' + esc(o.route) + '</small></span><b dir="ltr">' + esc(o.text.replace(/ \(\d+ units on an insulin syringe\)/, '')) + (o.qty && o.qty.units ? '<small>' + o.qty.units + ' units (insulin syringe)</small>' : '') + '</b></button>';
    }).join('') + '</section>';
    h += acc('Fatal mistakes', 'shield', ['Salbutamol nebuliser in anaemic heart failure: look for pallor; give oxygen and IV NS 4 mL/kg/h until blood.',
      'Heart disease with breathlessness: salbutamol worsens tachycardia; give oxygen and an NS nebuliser ± ipratropium.', 'IV fluid in severe malnutrition (except shock): use ReSoMal and F75.',
      'IV bolus in scorpion sting: the shock is anaphylactic or neurogenic; give IM adrenaline.', 'A beta-blocker (propranolol) in asthma.'], 'trap', true);
    return h + disc();
  }

  /* ================= Saved patients ================= */
  function saved() {
    head('Saved patients', A('على هذا الجهاز فقط، ولا تُرسل لأي مكان', 'On this device only, never sent anywhere'));
    var L = get('ho-pts', []);
    if (!L.length) return '<section class="card emptyc"><span class="pc-big">' + ic('save') + '</span><p>' + A('لا يوجد مرضى محفوظون. احفظ المريض من صفحته.', 'No saved patients. Save one from the patient page.') + '</p><button class="btn pri" data-go="patient">' + ic('user') + A('بيانات المريض', 'Patient details') + '</button></section>';
    return '<section class="card list">' + L.map(function (x) {
      var c = byId[x.dx];
      return '<div class="lrow"><span class="lrow-i">' + ic('baby') + '</span><button class="lrow-t open" data-act="openpt" data-id="' + x.id + '"><b dir="auto">' + esc(x.name || A('بدون اسم', 'No name')) + '</b><small>' + ageTxt(x) + ' · <bdi dir="ltr">' + nice(E.wt(x)) + ' kg</bdi>' + (c ? ' · <bdi dir="ltr">' + esc(c.t) + '</bdi>' : '') + ' · <bdi dir="ltr">' + new Date(x.saved).toLocaleDateString() + '</bdi></small></button><button class="ib red" data-act="delpt" data-id="' + x.id + '" aria-label="' + A('حذف', 'Delete') + '">' + ic('trash') + '</button></div>';
    }).join('') + '</section>';
  }
  ACT.openpt = function (b) { var x = get('ho-pts', []).find(function (y) { return y.id === b.dataset.id; }); if (!x) return; P = Object.assign(fresh(), x); P.lab = P.lab || {}; savePt(); go(P.dx ? 'c/' + P.dx : 'patient'); };
  ACT.delpt = function (b) { if (!confirm(A('حذف هذا المريض؟', 'Delete this patient?'))) return; put('ho-pts', get('ho-pts', []).filter(function (y) { return y.id !== b.dataset.id; })); render(true); };

  /* ================= Settings ================= */
  var PALS = [['navy', '#0e3b72', 'أزرق كحلي (الأساسي)', 'Navy blue (main)'], ['blue', '#0d6b5c', 'أخضر SMRA', 'SMRA green'], ['ocean', '#1768b3', 'أزرق فاتح', 'Light blue'], ['teal', '#0b6870', 'فيروزي', 'Teal'], ['purple', '#5a3d8f', 'بنفسجي', 'Purple'], ['maroon', '#7d2843', 'عنابي', 'Maroon'], ['graphite', '#3a4450', 'رمادي داكن', 'Graphite']];
  var BIP = null; window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); BIP = e; });
  function standalone() { return matchMedia('(display-mode: standalone)').matches || navigator.standalone; }
  function settings() {
    head('Settings', '');
    var th = get('ish-theme', 'light'), pal = document.documentElement.dataset.pal, fs = document.documentElement.dataset.fs;
    var h = sec('Language', 'globe', '<p class="hint">' + A('العناوين الرئيسية بالإنجليزي دائمًا؛ هذه لغة باقي التطبيق.', 'Main titles are always English; this is the language of everything else.') + '</p>' + seg([['ar', 'العربية', 'العربية'], ['en', 'English', 'English']], LANG, 'setlang'));
    h += sec('Appearance', 'sun', '<div class="looks">' + [['light', 'sun', 'نهاري', 'Day'], ['dark', 'moon', 'ليلي', 'Night'], ['eye', 'eye', 'راحة العين', 'Eye comfort'], ['auto', 'clock', 'تلقائي', 'Automatic']].map(function (x) {
      return '<button class="look ' + x[0] + (th === x[0] ? ' on' : '') + '" data-act="setlook" data-v="' + x[0] + '"><span>' + ic(x[1]) + '</span><b>' + A(x[2], x[3]) + '</b></button>'; }).join('') + '</div>');
    h += sec('App colour', 'palette', '<div class="pals">' + PALS.map(function (x) { return '<button class="pal' + (pal === x[0] ? ' on' : '') + '" data-act="setpal" data-v="' + x[0] + '"><i style="background:' + x[1] + '"></i><span>' + A(x[2], x[3]) + '</span></button>'; }).join('') + '</div>');
    h += sec('Text size', 'text', seg([['s', 'صغير', 'Small'], ['n', 'عادي', 'Normal'], ['l', 'كبير', 'Large']], fs, 'setfs'));
    h += sec('Install as app', 'install', standalone() ? '<p class="ok">' + ic('check') + A('أنت تستعمل HO Guide كتطبيق الآن.', 'You are using HO Guide as an app now.') + '</p>' :
      '<div class="inst"><img src="img/ho-192.png" alt=""><p>' + A('يظهر على شاشة هاتفك بأيقونته، ويفتح مباشرة ويعمل بدون إنترنت.', 'It gets its own icon on your phone, opens straight away and works offline.') + '</p></div><button class="btn pri wide" data-act="install">' + ic('install') + A('ثبّت التطبيق', 'Install the app') + '</button>');
    h += sec('Saved data', 'save', '<p class="kv1"><span>' + A('المرضى المحفوظون', 'Saved patients') + '</span><b>' + get('ho-pts', []).length + '</b></p><p class="hint">' + A('كل البيانات على هذا الجهاز فقط ولا تُرسل لأي مكان.', 'All data stay on this device only.') + '</p><button class="btn wide danger" data-act="wipe">' + ic('trash') + A('احذف كل بيانات المرضى', 'Delete all patient data') + '</button>');
    h += sec('About', 'shield', '<p class="hint">' + A('HO Guide من أكاديمية SMRA. الجرعات والخطط مبنية على الأدلة العلاجية المحلية (local guidelines)، وتُضاف الباطنية والجراحة والنساء والتوليد عند وصول أدلتها.', 'HO Guide by SMRA. Doses and plans are built on local guidelines; medicine, surgery and obstetrics are added when their guidelines arrive.') + '</p>');
    return h + disc();
  }
  ACT.setlang = function (b) { LANG = b.dataset.v; AR = LANG === 'ar'; put('ish-lang', LANG); document.documentElement.lang = LANG; render(true); };
  ACT.setlook = function (b) { setTheme(b.dataset.v); };
  ACT.setpal = function (b) { put('ho-pal', b.dataset.v); document.documentElement.dataset.pal = b.dataset.v; render(true); };
  ACT.setfs = function (b) { put('ho-fs', b.dataset.v); document.documentElement.dataset.fs = b.dataset.v; segOn(b); };
  ACT.wipe = function () { if (!confirm(A('حذف كل المرضى المحفوظين والمريض الحالي؟', 'Delete every saved patient and the current one?'))) return; ['ho-pts', 'ho-pt', 'ho-sel', 'ho-sx', 'ho-recent', 'ho-var'].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} }); P = fresh(); SEL = {}; SXSEL = []; toast(A('حُذفت البيانات', 'Deleted')); render(true); };
  ACT.install = function () {
    if (INFRAME) { window.open('/ho/?install=1', '_blank', 'noopener'); return; }
    if (BIP) { var e = BIP; BIP = null; e.prompt(); return; }
    var ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    sheet('<h2 class="ch"><span class="chi">' + ic('install') + '</span>' + T('Install as app') + '</h2><ol class="steps"><li>' + (ios ? A('افتح هذه الصفحة في Safari.', 'Open this page in Safari.') : A('افتح هذه الصفحة في Chrome.', 'Open this page in Chrome.')) + '</li><li>' +
      (ios ? A('اضغط زر المشاركة ⬆️ أسفل الشاشة.', 'Tap Share ⬆️ at the bottom.') : A('اضغط ⋮ أعلى الشاشة.', 'Tap ⋮ at the top.')) + '</li><li>' + (ios ? A('اختر «إضافة إلى الشاشة الرئيسية» ثم «إضافة».', 'Choose «Add to Home Screen», then «Add».') : A('اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».', 'Choose «Install app» or «Add to Home screen».')) + '</li></ol><button class="btn pri wide" data-act="shclose">' + A('حسنًا', 'OK') + '</button>');
  };
  if (/[?&]install=1/.test(location.search)) setTimeout(function () { ACT.install(); }, 1500);

  function notFound() { head('Not found', ''); return '<p class="empty">' + A('الصفحة غير موجودة.', 'Page not found.') + '</p>'; }

  /* ================= render ================= */
  function render(keep) {
    var r = route(), h;
    closeSheet();
    switch (r[0]) {
      case '': h = home(); break;
      case 'patient': h = patient(); break;
      case 'dx': h = dx(); break;
      case 'conds': h = conds(r[1]); break;
      case 'c': h = cond(r[1], r[2]); break;
      case 'rx': h = rx(); break;
      case 'orders': h = orders(); break;
      case 'drugs': h = drugs(r[1]); break;
      case 'drug': h = drug(r[1]); break;
      case 'calc': h = calc(r[1]); break;
      case 'emerg': h = emerg(); break;
      case 'saved': h = saved(); break;
      case 'settings': h = settings(); break;
      default: h = notFound();
    }
    $('#v').innerHTML = h;
    document.body.dataset.page = r[0] || 'home';
    if (r[0] === 'calc' && r[1] === 'prep') $('#cres').innerHTML = '<section class="card">' + kv(PREP.map(function (x) { return ['<bdi dir="ltr">' + esc(x[0]) + '</bdi>', x[1]]; })) + '</section><ul class="tips"><li>' + A('المراجع تختلف: WHO 25 مل، البروتوكول القومي 30 مل، آخرون 32 مل.', 'References differ: WHO 25 mL, national protocol 30 mL, others 32 mL.') + '</li></ul>';
    else if (r[0] === 'calc' && r[1]) calcRun();
    if (keep !== true) scrollTo(0, 0);
    fitHome(); setTimeout(fitHome, 250); setTimeout(fitHome, 900);
    fitPage(); setTimeout(fitPage, 300);
  }
  /* list pages on one screen (owner, 28 Nov 2026: «make it perfect like the Permanent Exam»): Drug book, Calculators, Settings, Conditions
     have compact layouts in the css (body[data-pg1]); if a phone is still too short the page content is scaled down a little (≥ 80 %) */
  var FITP = /^(drugs|calc|settings|conds|emerg|saved|rx|orders|dx|patient)$/;
  function fitPage() {
    var v = $('#v'), r = route(); v.style.zoom = '';
    /* the space kept under the page equals the bottom bar exactly (it was a few px more, so every page scrolled a little) */
    if (innerWidth < 1024) { var bh = $('#bn').getBoundingClientRect().height; if (bh) document.body.style.paddingBottom = Math.floor(bh) + 'px'; } else document.body.style.paddingBottom = '';
    document.body.toggleAttribute('data-pg1', FITP.test(r[0] || '') && !r[1]);
    if (!document.body.hasAttribute('data-pg1') || innerWidth >= 1024) return;
    var bn = $('#bn').getBoundingClientRect(), over = document.documentElement.scrollHeight - innerHeight;
    if (over <= 0) return;
    var vr = v.getBoundingClientRect(), avail = bn.top - vr.top - 10, need = v.scrollHeight;
    if (need > avail) v.style.zoom = Math.max(0.76, Math.floor(1000 * (avail - 3) / need) / 1000);
    var left = document.documentElement.scrollHeight - innerHeight, z = +v.style.zoom || 1;
    if (left > 0 && z > 0.76) v.style.zoom = Math.max(0.76, Math.floor(1000 * z * (1 - (left + 3) / Math.max(1, v.getBoundingClientRect().height))) / 1000);
  }
  addEventListener('resize', function () { clearTimeout(fitPage.t); fitPage.t = setTimeout(fitPage, 150); });
  /* the Home fits one screen (owner, 27 Nov 2026: "I prefer compact things rather than scrolling"): tighten step by step until nothing scrolls */
  function fitHome() {
    var b = document.body; b.classList.remove('fit1', 'fit2', 'fit3', 'fit4'); b.classList.add('fitting');
    if (b.dataset.page !== 'home') { b.classList.remove('fitting'); return; }
    /* computers have their own Home layout (css: min-width 1024px); only phones are tightened */
    for (var i = 1; i <= 4 && innerWidth < 1024 && document.documentElement.scrollHeight > innerHeight + 1; i++) b.classList.add('fit' + i);
    /* what is left is shared between the sections, so the Home fills the screen exactly */
    var hb = $('#hb'), bn = $('#bn'), cs = getComputedStyle($('main'));
    var avail = innerHeight - hb.offsetHeight - bn.offsetHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 8;
    document.documentElement.style.setProperty('--avail', Math.max(0, avail) + 'px');
    b.classList.remove('fitting');
  }
  var fitT; addEventListener('resize', function () { clearTimeout(fitT); fitT = setTimeout(fitHome, 120); });
  if (document.fonts) { document.fonts.ready.then(fitHome); document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', fitHome); }
  render();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js', { scope: './' }).catch(function () {});
})();
