/* HO Guide — calculation engine: patient, doses, fluids, warnings, prescriptions.
   Pure functions over window.HO_DRUGS (drugs.js) and window.HO_DX (dx.js); no DOM here, so tests can run it in Node. */
(function (root) {
  'use strict';
  var E = {};
  var D = function () { return root.HO_DRUGS || {}; };

  /* ---------- numbers ---------- */
  function r1(x) { return Math.round(x * 10) / 10; }
  function nice(x) { if (x == null || isNaN(x)) return ''; var v = Math.abs(x) >= 100 ? Math.round(x) : Math.abs(x) >= 10 ? r1(x) : Math.round(x * 100) / 100; return String(v); }
  function frac(t) {   // tablets to the nearest quarter, written as a fraction
    var q = Math.round(t * 4) / 4, w = Math.floor(q), p = q - w, s = { 0: '', 0.25: '¼', 0.5: '½', 0.75: '¾' }[p];
    return (w ? w + (s ? ' ' : '') : '') + (s || (w ? '' : '0'));
  }
  E.nice = nice; E.frac = frac;

  /* ---------- patient ---------- */
  /* age in months (decimal) and days of life from the patient form */
  E.ageMonths = function (p) { return (+p.ay || 0) * 12 + (+p.am || 0) + (+p.ad || 0) / 30.4; };
  E.dol = function (p) { var m = E.ageMonths(p); return m * 30.4; };
  E.isNeo = function (p) { return E.dol(p) <= 28; };
  /* PCH weight-for-age formulas (estimate only; the real weight is always better) */
  E.estWeight = function (p) {
    var m = E.ageMonths(p), y = m / 12;
    if (m < 1) return 3.3;
    if (m < 3) return 3.3 + m * 0.9;
    if (m <= 12) return (m + 9) / 2;
    if (y <= 6) return y * 2 + 8;
    if (y <= 12) return (y * 7 - 5) / 2;
    return Math.min(60, (y * 7 - 5) / 2);
  };
  E.wt = function (p) { return +p.wt > 0 ? +p.wt : E.estWeight(p); };
  E.bsa = function (p) { var w = E.wt(p), h = +p.ht; return h > 0 ? Math.sqrt(w * h / 3600) : null; };
  E.ageText = function (p) {
    var m = E.ageMonths(p);
    if (m < 1) return Math.round(E.dol(p)) + ' days';
    if (m < 24) return r1(m) + ' months';
    return Math.floor(m / 12) + ' y' + (Math.round(m % 12) ? ' ' + Math.round(m % 12) + ' m' : '');
  };

  /* ---------- picking a rule ---------- */
  function fits(w, p) {
    if (!w) return true;
    var m = E.ageMonths(p), wt = E.wt(p), dl = E.dol(p);
    if (w.amin != null && m < w.amin) return false;
    if (w.amax != null && m > w.amax) return false;
    if (w.dmax != null && dl > w.dmax) return false;
    if (w.wmin != null && wt < w.wmin) return false;
    if (w.wmax != null && wt > w.wmax) return false;
    return true;
  }
  E.rule = function (drug, key, p) {
    var r = drug.reg && drug.reg[key];
    if (!r) return null;
    if (Array.isArray(r)) { for (var i = 0; i < r.length; i++) if (fits(r[i].when, p)) return r[i]; return r[r.length - 1]; }
    return r;
  };

  /* ---------- frequency words ---------- */
  var FREQ = {
    '-1': ['when needed', 'عند اللزوم'], '0': ['single dose', 'جرعة واحدة'], '1': ['every hour', 'كل ساعة'],
    '4': ['every 4 hours', 'كل ٤ ساعات'], '6': ['every 6 hours', 'كل ٦ ساعات'], '8': ['every 8 hours', 'كل ٨ ساعات'],
    '12': ['every 12 hours (morning and evening)', 'صباحاً ومساءً'], '24': ['once daily', 'مرة واحدة يومياً'], '504': ['every 3 weeks', 'كل ٣ أسابيع']
  };
  E.freq = function (f, ar) { var x = FREQ[String(f)]; return x ? x[ar ? 1 : 0] : (ar ? 'كل ' + f + ' ساعة' : 'every ' + f + ' hours'); };
  E.perDay = function (f) { return f > 0 && f < 168 ? 24 / f : 1; };
  var ROUTE = { PO: ['by mouth', 'بالفم'], IV: ['IV', 'بالوريد'], IM: ['IM', 'بالعضل'], PR: ['rectally', 'شرجي'], neb: ['by nebuliser', 'بخار'], eye: ['to the eye', 'في العين'],
    nasal: ['in the nose', 'في الأنف'], topical: ['on the skin', 'دهان'], SC: ['SC', 'تحت الجلد'] };
  E.route = function (r, ar) { var x = ROUTE[r]; return x ? x[ar ? 1 : 0] : r; };

  /* ---------- the dose ---------- */
  /* returns everything a drug card needs; formId chooses the preparation (default: the rule's first that suits the patient) */
  E.dose = function (drugId, key, p, formId) {
    var drug = D()[drugId]; if (!drug) return { err: 'Unknown drug ' + drugId };
    var rule = E.rule(drug, key, p); if (!rule) return { err: 'No regimen ' + key + ' for ' + drugId };
    var wt = E.wt(p), m = E.ageMonths(p);
    var forms = (rule.forms || drug.forms.map(function (f) { return f.id; })).map(function (id) { return drug.forms.find(function (f) { return f.id === id; }); }).filter(Boolean);
    var out = { drug: drug, rule: rule, key: key, forms: forms, f: rule.f, calc: '', warn: [] };
    var mg = null, unitTxt = 'mg', fixedText = null;
    if (rule.k === 'kg') { mg = rule.v * wt; out.calc = rule.v + ' mg/kg × ' + nice(wt) + ' kg = ' + nice(mg) + ' mg'; }
    else if (rule.k === 'kgd') { var day = rule.v * wt; mg = day / rule.n; out.f = 24 / rule.n; out.calc = rule.v + ' mg/kg/day × ' + nice(wt) + ' kg = ' + nice(day) + ' mg/day ÷ ' + rule.n + ' = ' + nice(mg) + ' mg'; }
    else if (rule.k === 'iukg') { mg = rule.v * wt; unitTxt = 'IU'; out.calc = nice(rule.v) + ' IU/kg × ' + nice(wt) + ' kg = ' + Math.round(mg).toLocaleString('en') + ' IU'; }
    else if (rule.k === 'ukg') { mg = rule.v * wt; unitTxt = 'units'; out.calc = rule.v + ' units/kg × ' + nice(wt) + ' kg = ' + nice(mg) + ' units'; }
    else if (rule.k === 'mlkg') { out.ml = rule.v * wt; unitTxt = 'mL'; out.calc = rule.v + ' mL/kg × ' + nice(wt) + ' kg = ' + nice(out.ml) + ' mL'; if (rule.max && out.ml > rule.max) { out.ml = rule.max; out.calc += ' → max ' + rule.max + ' mL'; } }
    else if (rule.k === 'band' || rule.k === 'fix') {
      var row = null;
      if (rule.k === 'band') { var x = rule.by === 'wt' ? wt : m; row = rule.rows.find(function (r) { return x <= r[0]; }) || rule.rows[rule.rows.length - 1];
        out.calc = 'By ' + (rule.by === 'wt' ? 'weight (' + nice(wt) + ' kg)' : 'age (' + E.ageText(p) + ')'); }
      else row = [0, rule.dose, rule.unit];
      if (row[2] === 'mg') mg = row[1];
      else if (row[2] === 'IU') { mg = row[1]; unitTxt = 'IU'; }
      else if (row[2] === 'mL') { out.ml = row[1]; unitTxt = 'mL'; }
      else fixedText = (row[1] ? nice(row[1]) + ' ' : '') + row[2];
      if (row[1] === 0 && rule.k === 'band') out.warn.push('No dose at this age (see notes).');
    }
    else if (rule.k === 'mcg') {
      var mg24 = wt * rule.v * 60 * 24 / 1000; out.mg24 = mg24;
      out.calc = nice(wt) + ' kg × ' + rule.v + ' mcg/kg/min × 1440 min ÷ 1000 = ' + nice(mg24) + ' mg per 24 hours';
      fixedText = nice(mg24) + ' mg in 100 mL NS over 24 h (≈ 4.2 mL/h) for ' + rule.v + ' mcg/kg/min';
    }
    if (mg != null && unitTxt === 'mg') {
      var cap = rule.max;
      if (rule.maxBand) { var mb = rule.maxBand.find(function (r) { return m <= r[0]; }); if (mb) cap = Math.min(cap || 1e9, mb[1]); }
      if (cap && mg > cap) { out.calc += ' → maximum ' + nice(cap) + ' mg'; mg = cap; }
    }
    if (mg != null && unitTxt === 'IU' && rule.max && mg > rule.max) { out.calc += ' → maximum ' + rule.max.toLocaleString('en') + ' IU'; mg = rule.max; }
    out.mg = mg; out.unit = unitTxt; out.fixed = fixedText;
    /* preparation */
    var form = forms.find(function (f) { return f.id === formId; }) || pickForm(forms, mg, p);
    out.form = form;
    out.qty = qty(form, mg, unitTxt, out.ml);
    out.dur = rule.dur || '';
    out.route = form ? form.r : '';
    out.sc = rule.sc || '';
    out.note = rule.note || '';
    out.text = doseText(out);
    out.warn = out.warn.concat(E.checks(drug, p, rule));
    return out;
  };
  function pickForm(forms, mg, p) {
    if (!forms.length) return null;
    var m = E.ageMonths(p);
    /* tablets are for older children: use them only when the dose is at least half a tablet and the child is over 6 years */
    for (var i = 0; i < forms.length; i++) {
      var f = forms[i];
      if (f.tab && mg != null) { if (m < 72 || mg < f.tab * 0.5) continue; }
      return f;
    }
    return forms[0];
  }
  function qty(f, mg, unit, ml) {
    if (!f) return null;
    if (ml != null) return { ml: ml, txt: nice(ml) + ' mL' };
    if (mg == null) return null;
    if (unit === 'IU' && f.iu) { var v = mg / f.iu; return { ml: r1(v), txt: r1(v) + ' mL' }; }
    if (f.c) {
      var vol = mg / f.c, inj = f.r !== 'PO';
      var rv = inj ? Math.round(vol * 10) / 10 : (vol >= 2 ? Math.round(vol * 2) / 2 : Math.max(0.1, Math.round(vol * 10) / 10));
      var o = { ml: rv, exact: vol, txt: nice(rv) + ' mL' };
      if (inj && rv < 1) o.units = Math.round(vol * 100);
      return o;
    }
    if (f.tab) {
      var t = mg / f.tab, cap = f.n.indexOf('Capsule') === 0;
      if (t < 0.24 && !cap) {   /* too small to cut: dissolve one tablet in water and give part of it */
        var w = t * 5 >= 0.5 ? 5 : 10, give = Math.max(0.1, Math.round(t * w * 10) / 10);
        return { ml: give, small: true, diss: w, txt: 'dissolve 1 tablet in ' + w + ' mL water, give ' + nice(give) + ' mL', ar: 'تذاب حبة في ' + w + ' مل ماء ويعطى ' + nice(give) + ' مل' };
      }
      return { tabs: Math.round(t * 4) / 4, exact: t, txt: frac(t) + ' ' + (cap ? 'capsule' : 'tablet') + (t > 1.1 ? 's' : '') };
    }
    if (f.sup) { var s = mg / f.sup; return { sup: Math.round(s * 2) / 2, txt: frac(Math.round(s * 2) / 2) + ' suppository of ' + f.sup + ' mg' }; }
    return null;
  }
  function doseText(o) {
    if (o.fixed) return o.fixed;
    var a = o.unit === 'IU' ? Math.round(o.mg).toLocaleString('en') + ' IU' : o.unit === 'units' ? nice(o.mg) + ' units' : o.unit === 'mL' ? '' : nice(o.mg) + ' mg';
    var q = o.qty && o.qty.txt ? o.qty.txt : '';
    if (o.qty && o.qty.units) q += ' (' + o.qty.units + ' units on an insulin syringe)';
    return [a, q].filter(Boolean).join(' = ');
  }

  /* ---------- warnings (contraindications, allergies, guideline traps) ---------- */
  var ALLERGY = { penicillin: ['penicillin'], cephalosporin: ['cephalosporin'], macrolide: ['macrolide'], sulfa: ['sulfa'], nsaid: ['nsaid', 'salicylate'], quinolone: ['quinolone'], aminoglycoside: ['aminoglycoside'] };
  E.checks = function (drug, p, rule) {
    var w = [], m = E.ageMonths(p), c = drug.ci || {}, al = p.allergy || [], cond = p.cond || [];
    al.forEach(function (a) {
      if ((ALLERGY[a] || [a]).some(function (k) { return drug.cls.indexOf(k) >= 0; })) w.push({ lvl: 'stop', t: 'ALLERGY: patient is allergic to ' + a + '.' });
      if (a === 'penicillin' && drug.cls.indexOf('cephalosporin') >= 0) w.push({ lvl: 'warn', t: 'Penicillin allergy: cephalosporins carry a small cross-reaction risk (avoid after anaphylaxis).' });
      if (a === 'penicillin' && drug.cls.indexOf('carbapenem') >= 0) w.push({ lvl: 'warn', t: 'Penicillin allergy: carbapenem cross-reaction is rare; caution.' });
    });
    if (c.amin != null && m < c.amin) w.push({ lvl: 'stop', t: c.why || ('Not under ' + c.amin + ' months.') });
    if (c.neonate && E.isNeo(p)) w.push({ lvl: 'stop', t: c.neonate });
    var map = { asthma: 'asthma', g6pd: 'g6pd', renal: 'renal', liver: 'liver', jaundice: 'jaundice', sam: 'sam', cardiac: 'cardiac', dengue: 'dengue' };
    Object.keys(map).forEach(function (k) { if (c[k] && cond.indexOf(map[k]) >= 0) w.push({ lvl: k === 'renal' || k === 'liver' ? 'warn' : 'stop', t: c[k] }); });
    if (cond.indexOf('asthma') >= 0 && drug.id === 'benzylpen') w.push({ lvl: 'warn', t: 'Guideline: avoid benzylpenicillin in asthmatics (may trigger allergy); use ampicillin, cefuroxime or ceftriaxone.' });
    if (rule && rule.when && rule.when.dmax && !E.isNeo(p)) { /* fine */ }
    return w;
  };

  /* ---------- fluids ---------- */
  E.maint = function (wt) { var v = wt <= 10 ? wt * 100 : wt <= 20 ? 1000 + (wt - 10) * 50 : 1500 + (wt - 20) * 20; return v; };
  E.maintCalc = function (wt) {
    if (wt <= 10) return nice(wt) + ' × 100 = ' + nice(E.maint(wt)) + ' mL/day';
    if (wt <= 20) return '10 × 100 + ' + nice(wt - 10) + ' × 50 = ' + nice(E.maint(wt)) + ' mL/day';
    return '10 × 100 + 10 × 50 + ' + nice(wt - 20) + ' × 20 = ' + nice(E.maint(wt)) + ' mL/day';
  };
  E.fluidType = function (p) {
    var dl = E.dol(p), m = E.ageMonths(p);
    if (dl <= 2) return 'Dextrose 10% (D10)';
    if (m <= 6) return 'Dextrose 5% with ⅕ saline';
    if (m <= 60) return 'Dextrose 5% with ½ saline';
    return 'Dextrose 5% with normal saline (DNS)';
  };
  E.capDaily = function (p, v) { var cap = p.sex === 'f' ? 2000 : 2500; return v > cap ? { v: cap, note: 'Capped at ' + cap + ' mL/day (guideline maximum ' + (p.sex === 'f' ? '2 L female' : '2.5 L male') + ').' } : { v: v }; };
  function dpm(ml, h) { return Math.round(ml * 20 / (h * 60)); }
  E.drops = dpm;
  /* every fluid plan returns {t, rows:[[label, value]], order:[lines for the order sheet], notes:[]} */
  E.fluid = function (spec, p) {
    var wt = E.wt(p), k = spec.k, o = { rows: [], order: [], notes: [] };
    if (k === 'maint' || k === 'maint23' || k === 'maint15' || k === 'maint2') {
      var x = { maint: 1, maint23: 2 / 3, maint15: 1.5, maint2: 2 }[k];
      var v = E.maint(wt) * x, c = E.capDaily(p, v); v = c.v;
      o.t = { 1: 'Maintenance IV fluid', 0.6666666666666666: '⅔ maintenance IV fluid', 1.5: '1½ × maintenance IV fluid', 2: 'Double maintenance (half oral, half IV)' }[x];
      o.rows.push(['Holliday–Segar', E.maintCalc(wt)]);
      if (x !== 1) o.rows.push(['× ' + (x === 2 / 3 ? '⅔' : x), nice(v) + ' mL/day']);
      if (c.note) o.notes.push(c.note);
      o.rows.push(['Fluid', E.fluidType(p)]);
      o.rows.push(['Per 8 hours', nice(v / 3) + ' mL (' + dpm(v / 3, 8) + ' drops/min)']);
      o.rows.push(['Rate', nice(v / 24) + ' mL/h']);
      o.order.push(E.fluidType(p) + ' ' + Math.round(v / 3) + ' mL every 8 hours (' + nice(v / 24) + ' mL/h)');
      if (spec.why) o.notes.push(spec.why);
      return o;
    }
    if (k === 'planA') {
      o.t = 'Plan A — no dehydration (home)';
      o.rows.push(['After each loose stool', E.ageMonths(p) < 24 ? '50–100 mL ORS' : '100–200 mL ORS']);
      o.rows.push(['Also', 'Continue breast feeding; more fluids than usual; zinc']);
      o.order.push('ORS ' + (E.ageMonths(p) < 24 ? '50–100' : '100–200') + ' mL after each loose stool');
      return o;
    }
    if (k === 'planB') {
      var ors = 75 * wt, rl = 55 * wt;
      o.t = 'Plan B — some dehydration';
      o.rows.push(['ORS (plan B)', '75 mL/kg = ' + nice(ors) + ' mL over 4 hours (cup, spoon or NG)']);
      o.rows.push(['Or modified plan B (IV)', "Ringer's lactate 50–60 mL/kg = " + nice(50 * wt) + '–' + nice(60 * wt) + ' mL over 4 hours (' + dpm(rl, 4) + ' drops/min)']);
      o.rows.push(['Then', 'Reassess; maintenance ' + nice(E.maint(wt) / 3) + ' mL 8-hourly of ' + E.fluidType(p)]);
      o.order.push("Ringer's lactate " + Math.round(rl) + ' mL over 4 hours, then ' + E.fluidType(p) + ' ' + Math.round(E.maint(wt) / 3) + ' mL every 8 hours');
      return o;
    }
    if (k === 'planC') {
      var tot = 100 * wt, inf = E.ageMonths(p) < 12;
      o.t = 'Plan C — severe dehydration';
      o.rows.push(["Ringer's lactate", '100 mL/kg = ' + nice(tot) + ' mL']);
      o.rows.push(['First ⅓', nice(tot / 3) + ' mL over ' + (inf ? '1 hour' : '½ hour') + ' (' + dpm(tot / 3, inf ? 1 : 0.5) + ' drops/min)']);
      o.rows.push(['Then ⅔', nice(tot * 2 / 3) + ' mL over ' + (inf ? '5 hours' : '2½ hours') + ' (' + dpm(tot * 2 / 3, inf ? 5 : 2.5) + ' drops/min)']);
      o.rows.push(['No IV access', 'ORS 20 mL/kg/h by NG = ' + nice(20 * wt) + ' mL every hour for 6 hours (' + nice(120 * wt) + ' mL); watch for distension']);
      o.order.push("Ringer's lactate " + Math.round(tot / 3) + ' mL over ' + (inf ? '1 hour' : '½ hour') + ', then ' + Math.round(tot * 2 / 3) + ' mL over ' + (inf ? '5 hours' : '2½ hours'));
      o.notes.push('Reassess every 1–2 hours; if the radial pulse is still weak after the first portion, repeat it. Then reclassify (A, B or C).');
      return o;
    }
    if (k === 'shock') {
      o.t = 'Shock — fluid bolus';
      var b = (spec.small || E.isNeo(p) || (p.cond || []).indexOf('cardiac') >= 0) ? 10 : 20;
      o.rows.push(["NS or Ringer's lactate", b + ' mL/kg = ' + nice(b * wt) + ' mL over 5–10 minutes (push with a syringe)']);
      o.rows.push(['Reassess', 'Repeat up to 3 times; then septic shock: broad-spectrum antibiotic, blood, inotrope']);
      o.rows.push(['While waiting for blood', 'NS 4 mL/kg/h = ' + nice(4 * wt) + ' mL/h']);
      if (b === 10) o.notes.push('Neonates and children with heart disease or heart failure: smaller boluses (5–10 mL/kg).');
      o.order.push('NS ' + Math.round(b * wt) + ' mL IV now over 5–10 minutes; reassess and repeat up to 3 times');
      return o;
    }
    if (k === 'samShock') {
      o.t = 'Shock in severe malnutrition';
      o.rows.push(['First', 'D10 5 mL/kg = ' + nice(5 * wt) + ' mL IV + oxygen']);
      o.rows.push(["Ringer's lactate (or NS)", '15 mL/kg = ' + nice(15 * wt) + ' mL over 1 hour']);
      o.rows.push(['Improved', 'Repeat 15 mL/kg over 1 hour, then ReSoMal orally/NG']);
      o.rows.push(['Not improved', 'Transfuse fresh blood 10 mL/kg = ' + nice(10 * wt) + ' mL over 3 hours']);
      o.order.push('D10 ' + Math.round(5 * wt) + ' mL IV now + oxygen; Ringer\'s lactate ' + Math.round(15 * wt) + ' mL over 1 hour');
      return o;
    }
    if (k === 'resomal') {
      o.t = 'Rehydration in severe malnutrition (no IV fluid)';
      o.rows.push(['ReSoMal', '5 mL/kg every ½ hour for 2 hours = ' + nice(5 * wt) + ' mL each time (or ' + nice(20 * wt) + ' mL over 2 hours)']);
      o.rows.push(['Then', 'ReSoMal alternating with F75, 5–10 mL/kg hourly for up to 10 hours (' + nice(5 * wt) + '–' + nice(10 * wt) + ' mL)']);
      o.rows.push(['After each stool', E.ageMonths(p) < 24 ? '50–100 mL' : '100–200 mL'] );
      o.rows.push(['F75', '130 mL/kg/day = ' + nice(130 * wt) + ' mL/day: ' + nice(130 * wt / 12) + ' mL 2-hourly or ' + nice(130 * wt / 8) + ' mL 3-hourly']);
      o.notes.push('No IV fluid in malnutrition unless in shock (fatal mistake). Oedematous child: ReSoMal 30 mL after each stool.');
      o.order.push('ReSoMal ' + Math.round(5 * wt) + ' mL every ½ hour for 2 hours, then alternating with F75 hourly');
      return o;
    }
    if (k === 'f75') {
      o.t = 'Feeds in severe malnutrition';
      o.rows.push(['F75', '130 mL/kg/day = ' + nice(130 * wt) + ' mL/day: ' + nice(130 * wt / 12) + ' mL 2-hourly, or ' + nice(130 * wt / 8) + ' mL 3-hourly']);
      o.rows.push(['ReSoMal', nice(15 * wt) + '–' + nice(30 * wt) + ' mL after each loose stool']);
      o.order.push('F75 ' + Math.round(130 * wt / 12) + ' mL every 2 hours');
      return o;
    }
    if (k === 'ftt') {
      o.t = 'Feeds in failure to thrive';
      o.rows.push(['Diluted F100', '150 mL/kg/day = ' + nice(150 * wt) + ' mL: ' + nice(150 * wt / 8) + ' mL 3-hourly by NG/cup']);
      o.order.push('Diluted F100 ' + Math.round(150 * wt / 8) + ' mL every 3 hours');
      return o;
    }
    if (k === 'neo') {
      var dlf = Math.max(1, Math.ceil(E.dol(p))), pre = (p.cond || []).indexOf('preterm') >= 0;
      var term = [60, 90, 120, 150, 150], preT = [80, 100, 120, 150, 180];
      var perKg = (pre ? preT : term)[Math.min(4, dlf - 1)], vol = perKg * wt;
      o.t = 'Neonatal fluids / feeds (day ' + dlf + (pre ? ', preterm' : '') + ')';
      o.rows.push(['Volume', perKg + ' mL/kg/day = ' + nice(vol) + ' mL/day']);
      o.rows.push(['Feeds', nice(vol / 12) + ' mL 2-hourly or ' + nice(vol / 8) + ' mL 3-hourly (breast milk by NG tube size 5)']);
      o.rows.push(['IV', (dlf <= 2 ? 'D10' : 'D5 with ⅕ saline (or D10 + Na 2–3 mmol/kg/day)') + ' at ' + nice(vol / 24) + ' mL/h']);
      if (dlf >= 3) o.rows.push(['If nil by mouth (from day 3)', 'add KCl ' + nice(wt) + ' mL (1 mmol/kg) and calcium gluconate 10% ' + nice(2 * wt) + ' mL per 24 hours']);
      o.notes.push('Day 1 50–60, day 2 80–90, day 3 100–120, day 4 130–150, then 150 mL/kg/day (term). Some units cap IV at 100 mL/kg/day. Too much fluid in preterms → PDA.');
      o.order.push((dlf <= 2 ? 'D10' : 'D5 ⅕ saline') + ' ' + Math.round(vol) + ' mL over 24 hours (' + nice(vol / 24) + ' mL/h), or breast milk ' + nice(vol / 12) + ' mL 2-hourly by NG tube');
      return o;
    }
    if (k === 'dka') {
      var def = 100 * wt, mt = E.maint(wt), tot24 = def / 2 + mt;
      o.t = 'DKA fluids (½ deficit + maintenance in 24 h)';
      o.rows.push(['Deficit (severe)', '100 mL/kg = ' + nice(def) + ' mL; half = ' + nice(def / 2) + ' mL']);
      o.rows.push(['Maintenance', E.maintCalc(wt)]);
      o.rows.push(['Total in 24 h', nice(tot24) + ' mL = ' + nice(tot24 / 24) + ' mL/h of normal saline']);
      o.rows.push(['When RBG < 300 mg/dL', 'Change to dextrose 5% with ½ saline; if RBG < 100 with acidosis use dextrose 7.5% (add 25–30 mL D50 to 500 mL)']);
      o.rows.push(['Potassium', 'Add 1 ampoule KCl to each bag once the child passes urine']);
      o.rows.push(['Insulin (pump)', '100 units in 100 mL NS at 0.1 mL/kg/h = ' + nice(0.1 * wt) + ' mL/h']);
      o.rows.push(['Insulin (no pump)', nice(0.3 * wt) + ' units SC now, then ' + nice(0.1 * wt) + ' units SC every hour']);
      o.order.push('Normal saline ' + Math.round(tot24) + ' mL over 24 hours (' + nice(tot24 / 24) + ' mL/h); regular insulin infusion ' + nice(0.1 * wt) + ' units/h (start 1 hour after fluids)');
      o.notes.push('Never stop the hourly insulin until acidosis clears (no acidotic breathing, not dehydrated, drinking well) — not because glucose is low.');
      return o;
    }
    if (k === 'hyperNa') {
      var dft = 100 * wt, mtt = E.maint(wt);
      o.t = 'Hypernatraemic dehydration (slow correction)';
      o.rows.push(['Deficit', '100 mL/kg = ' + nice(dft) + ' mL']);
      o.rows.push(['Option 1 (24 h)', '½ deficit + maintenance = ' + nice(dft / 2 + mtt) + ' mL over 24 h (' + nice((dft / 2 + mtt) / 24) + ' mL/h)']);
      o.rows.push(['Option 2 (48 h)', 'deficit + 2 × maintenance = ' + nice(dft + 2 * mtt) + ' mL over 48 h']);
      o.rows.push(['Fluid', 'Dextrose with ½ saline (or ⅕ saline)']);
      o.notes.push('Aim for a fall of 0.5 mmol/L per hour (about 12 mmol/L per day); sodium every 6 hours. Faster correction causes cerebral oedema.');
      o.order.push('Dextrose ½ saline ' + Math.round(dft / 2 + mtt) + ' mL over 24 hours; serum Na every 6 hours');
      return o;
    }
    if (k === 'scd') {
      var vv = E.maint(wt) * 1.5;
      o.t = 'Sickle cell crisis fluids (1½ × maintenance; ideal double, half orally)';
      o.rows.push(['1½ × maintenance', nice(vv) + ' mL/day = ' + nice(vv / 3) + ' mL 8-hourly of ' + E.fluidType(p)]);
      o.notes.push('No IV fluid before transfusion when Hb < 5 g/dL or there is anaemic heart failure.');
      o.order.push(E.fluidType(p) + ' ' + Math.round(vv / 3) + ' mL every 8 hours');
      return o;
    }
    if (k === 'restrict') {
      var bsa = E.bsa(p);
      o.t = 'Fluid restriction (renal)';
      if (bsa) {
        o.rows.push(['Surface area', nice(bsa) + ' m²']);
        o.rows.push(['Insensible loss', '400 mL/m² = ' + nice(400 * bsa) + ' mL/day']);
        o.rows.push(['Intake', nice(400 * bsa) + ' mL + previous day\'s urine output']);
      } else o.rows.push(['Intake', '400 mL/m² + previous day\'s urine output (enter height for surface area)']);
      o.order.push('Fluid intake = insensible loss + previous day\'s urine output; renal chart');
      return o;
    }
    if (k === 'transfuse') {
      var vol2 = (spec.mlkg || 20) * wt;
      o.t = 'Blood transfusion';
      o.rows.push(['Whole blood', (spec.mlkg || 20) + ' mL/kg = ' + nice(vol2) + ' mL over 3–4 hours']);
      o.rows.push(['Packed cells', '10–15 mL/kg = ' + nice(10 * wt) + '–' + nice(15 * wt) + ' mL (wt × desired Hb rise × 3)']);
      o.rows.push(['Malnourished', '10 mL/kg = ' + nice(10 * wt) + ' mL']);
      if (!spec.scd) o.rows.push(['Heart failure', 'Furosemide ' + nice(wt) + ' mg (1 mg/kg) before and after']);
      else o.notes.push('Sickle cell disease: whole blood without furosemide (furosemide increases viscosity).');
      o.order.push('Fresh blood ' + Math.round(vol2) + ' mL (grouped and cross-matched) over 4 hours');
      return o;
    }
    return null;
  };

  /* ---------- prescription and order sheet ---------- */
  var DIG = '0123456789'; function arNum(s) { return String(s); }   /* western digits (clear for pharmacists) */
  E.rxLine = function (o) {
    var d = o.drug, brand = d.b && d.b[0] ? d.b[0] : '', f = o.form;
    var name = (brand && brand !== d.g ? brand + ' (' + d.g + ')' : d.g) + (f ? ' ' + f.n.replace(/\s*\(.*\)$/, '') : '');
    var amt = o.qty && o.qty.ar ? o.qty.ar : o.qty && o.qty.ml != null ? arNum(nice(o.qty.ml)) + ' مل' : o.qty && o.qty.tabs != null ? frac(o.qty.tabs) + ' حبة' : o.qty && o.qty.sup ? frac(o.qty.sup) + ' تحميلة' : o.fixed || '';
    var ar = [amt, E.route(o.route, true), E.freq(o.f, true), o.dur ? 'لمدة ' + o.dur.replace(/days?/, 'أيام').replace(/weeks?/, 'أسابيع') : ''].filter(Boolean).join(' · ');
    var en = [o.text, E.route(o.route), E.freq(o.f), o.dur].filter(Boolean).join(' · ');
    return { name: name, ar: ar, en: en };
  };

  root.HO_E = E;
  if (typeof module !== 'undefined') module.exports = E;
})(typeof window !== 'undefined' ? window : globalThis);
