/* HO Guide — drug formulary (paediatrics). Every dose comes from the hospital guidelines the owner supplied:
   K = "Guideline of common pediatric cases 2024", Kuwaiti Hospital Kassala (page numbers of that book);
   P = PCH paediatric drug table. Where the guideline gives a bedside shortcut ("wt/4 mL"), the mg/kg value below reproduces it,
   and the shortcut is shown beside the calculation so the house officer can check one against the other.
   Rule kinds:  kg = mg/kg per dose · kgd = mg/kg/day divided into n doses · band = by age (months) or weight (kg) · fix = fixed dose
                mlkg = mL/kg · iukg = IU/kg per dose · ukg = units/kg · mcg = mcg/kg/min infusion
   f = dosing interval in hours (0 = single dose, -1 = when needed). when = {amin, amax (months), dmax (days of life), wmin, wmax}.
   Form: c = mg per mL (liquids/injections), tab = mg per tablet or capsule, iu = IU per mL or per vial, sup = mg per suppository. */
(function () {
  'use strict';
  var D = {};
  function d(id, o) { o.id = id; D[id] = o; }
  var S5 = function (mg) { return mg / 5; };   // mg per 5 mL → mg per mL

  /* ---------------- Penicillins ---------------- */
  d('ampiclox', { g: 'Ampicillin + cloxacillin', b: ['Ampiclox'], cls: ['penicillin'], src: 'K p1, p147; P',
    forms: [{ id: 's250', n: 'Syrup 250 mg/5 mL (only strength)', r: 'PO', c: S5(250) }, { id: 'cap500', n: 'Capsule 500 mg', r: 'PO', tab: 500 },
      { id: 'v500', n: 'Vial 500 mg', r: 'IV', c: 100, rec: 'Dissolve 500 mg in 5 mL water = 100 mg/mL' }],
    reg: {
      po: { k: 'kg', v: 12.5, f: 6, dur: '5–7 days', forms: ['s250', 'cap500'], max: 500, sc: 'wt/4 mL of 250 mg/5 mL', note: 'Guideline text: 25 mg/kg/dose 6-hourly; bedside shortcut wt/4 mL (≈ 50 mg/kg/day). Causes diarrhoea: prefer azithromycin or cefixime if the child has diarrhoea.' },
      iv: [{ when: { dmax: 7 }, k: 'kg', v: 50, f: 12, forms: ['v500'], sc: 'wt × 50 mg 12-hourly (first week)' },
        { k: 'kg', v: 25, f: 6, forms: ['v500'], sc: 'wt × 25 mg 6-hourly' }]
    } });
  d('amoxicillin', { g: 'Amoxicillin', b: ['Amoxil'], cls: ['penicillin'], src: 'K p43, p71, p75; P',
    forms: [{ id: 's125', n: 'Syrup 125 mg/5 mL', r: 'PO', c: S5(125) }, { id: 's250', n: 'Syrup 250 mg/5 mL', r: 'PO', c: S5(250) },
      { id: 'cap250', n: 'Capsule 250 mg', r: 'PO', tab: 250 }, { id: 'cap500', n: 'Capsule 500 mg', r: 'PO', tab: 500 }],
    reg: {
      po: { k: 'kg', v: 12.5, f: 8, dur: '7 days', forms: ['s250', 's125', 'cap250', 'cap500'], max: 500, sc: '125 mg: wt/2 mL · 250 mg: wt/4 mL 8-hourly' },
      typhoid: { k: 'kg', v: 12.5, f: 8, dur: '7–10 days', forms: ['s250', 's125', 'cap500'], max: 500, sc: '125: wt/2 · 250: wt/4 mL 8-hourly' },
      hp: [{ when: { wmin: 45 }, k: 'fix', dose: 1000, unit: 'mg', f: 12, dur: '1 week', forms: ['cap500'], sc: '2 caps of 500 mg twice daily' },
        { k: 'kg', v: 12.5, f: 8, dur: '1 week', forms: ['s250', 's125', 'cap250'], sc: '125: wt/2 · 250: wt/4 mL 8-hourly' }]
    } });
  d('amoclan', { g: 'Amoxicillin + clavulanic acid (co-amoxiclav)', b: ['Amoclan', 'Augmentin', 'Clamox', 'Clavox', 'Megamox'], cls: ['penicillin'], src: 'K p6, p147',
    forms: [{ id: 's400', n: 'Syrup 400 mg/5 mL (BD)', r: 'PO', c: S5(400), bd: 1 }, { id: 's200', n: 'Syrup 200 mg/5 mL (BD)', r: 'PO', c: S5(200), bd: 1 },
      { id: 's457', n: 'Syrup 457 mg/5 mL (BD)', r: 'PO', c: S5(457), bd: 1 }, { id: 's228', n: 'Syrup 228 mg/5 mL (BD)', r: 'PO', c: S5(228), bd: 1 },
      { id: 's312', n: 'Syrup 312 mg/5 mL (TDS)', r: 'PO', c: S5(312) }, { id: 's156', n: 'Syrup 156 mg/5 mL (TDS; causes diarrhoea)', r: 'PO', c: S5(156) },
      { id: 't375', n: 'Tablet 375 mg', r: 'PO', tab: 375 }, { id: 't625', n: 'Tablet 625 mg', r: 'PO', tab: 625 }, { id: 't1g', n: 'Tablet 1 g', r: 'PO', tab: 1000 },
      { id: 'v600', n: 'Vial 600 mg', r: 'IV', c: 60, rec: '600 mg in 10 mL water = 60 mg/mL' }, { id: 'v1200', n: 'Vial 1.2 g', r: 'IV', c: 60, rec: '1.2 g in 20 mL water = 60 mg/mL' }],
    reg: {
      po: { k: 'kg', v: 20, f: 12, dur: '7 days', forms: ['s400', 's457', 's200', 's228', 't625', 't1g'], max: 875, sc: '400/457: wt/4 · 200/228: wt/2 mL twice daily', note: '20–50 mg/kg/day (amoxicillin part). Write the strength: 200 or 400 mg/5 mL.' },
      iv: [{ when: { amax: 3 }, k: 'kg', v: 30, f: 12, forms: ['v600', 'v1200'] }, { k: 'kg', v: 30, f: 8, max: 1200, forms: ['v600', 'v1200'], sc: 'wt × 30 mg 8-hourly (max 1.2 g)' }]
    } });
  d('penv', { g: 'Phenoxymethylpenicillin (penicillin V)', b: ['Ospen', 'Ospenin'], cls: ['penicillin'], src: 'K p5, p109; P 73',
    forms: [{ id: 's250', n: 'Syrup 250 mg/5 mL', r: 'PO', c: S5(250) }, { id: 't500', n: 'Tablet 500 mg', r: 'PO', tab: 500 }],
    reg: {
      tonsil: { k: 'band', by: 'age', rows: [[24, 125, 'mg'], [144, 250, 'mg'], [999, 500, 'mg']], f: 8, dur: '10 days', forms: ['s250', 't500'] },
      scd: { k: 'band', by: 'age', rows: [[24, 125, 'mg'], [999, 250, 'mg']], f: 12, dur: 'until 5 years of age', forms: ['s250', 't500'], sc: '< 2 y 2.5 mL, > 2 y 5 mL twice daily' }
    } });
  d('benzylpen', { g: 'Benzylpenicillin (crystalline penicillin)', b: ['Benzylpenicillin', 'Penicillin G'], cls: ['penicillin'], src: 'K p15, p39, p92; P 17',
    forms: [{ id: 'v1mu', n: 'Vial 1,000,000 IU (600 mg)', r: 'IV', iu: 250000, rec: '1 MU in 4 mL water = 250,000 IU/mL' }],
    reg: {
      std: [{ when: { dmax: 7 }, k: 'iukg', v: 50000, f: 12, forms: ['v1mu'], sc: '1/4 MU 12-hourly in the first week' },
        { when: { amax: 1 }, k: 'iukg', v: 50000, f: 6, forms: ['v1mu'], sc: '1/4 MU 6-hourly' },
        { k: 'iukg', v: 50000, f: 6, max: 1000000, forms: ['v1mu'], sc: '< 2 m 1/4 MU · 2–6 m 1/2 MU · > 6 m 1/2–1 MU · > 1 y 1 MU 6-hourly', note: '100,000 IU/kg/day ÷ 6-hourly (K p15).' }],
      neo: [{ when: { dmax: 7 }, k: 'iukg', v: 50000, f: 12, forms: ['v1mu'], sc: '1/4 MU 12-hourly' }, { k: 'iukg', v: 50000, f: 6, forms: ['v1mu'], sc: '1/4 MU 6-hourly (2nd week)' }],
      mening: { k: 'iukg', v: 150000, f: 6, max: 4000000, forms: ['v1mu'], sc: '150,000 IU/kg 6-hourly (meningitic dose)' }
    } });
  d('procainepen', { g: 'Procaine penicillin', b: ['Procaine penicillin'], cls: ['penicillin'], src: 'K p7; P 78',
    forms: [{ id: 'v1mu', n: 'Vial 1,000,000 IU', r: 'IM', iu: 250000, rec: '1 MU in 4 mL water' }],
    reg: { std: { k: 'iukg', v: 50000, f: 24, max: 1000000, dur: '10 days', forms: ['v1mu'], note: 'Skin sensitivity test before use. IM only.' } } });
  d('benzathine', { g: 'Benzathine penicillin', b: ['Retarpen', 'Penidure'], cls: ['penicillin'], src: 'K p33; P 16',
    forms: [{ id: 'v12', n: 'Vial 1,200,000 IU', r: 'IM', iu: 300000, rec: '1.2 MU in 4 mL water = 300,000 IU/mL' }, { id: 'v24', n: 'Vial 2,400,000 IU', r: 'IM', iu: 600000 }],
    reg: { rf: { k: 'band', by: 'wt', rows: [[27, 600000, 'IU'], [999, 1200000, 'IU']], f: 504, dur: 'every 3 weeks: 25 years (no carditis) or lifelong (RHD) [as in guideline]', forms: ['v12'], sc: '< 27 kg (< 7 y): 600,000 IU = 2 mL of the 1.2 MU vial · 7–12 y: 1.2 MU · > 12 y: 2.4 MU', note: 'Sensitivity test first; lidocaine as diluent reduces pain. Over 12 years give 2.4 MU.' } } });
  d('ampicillin', { g: 'Ampicillin', b: ['Ampicillin'], cls: ['penicillin'], src: 'K p16, p39, p93',
    forms: [{ id: 'v500', n: 'Vial 500 mg', r: 'IV', c: 100, rec: '500 mg in 5 mL water = 100 mg/mL' }],
    reg: {
      std: [{ when: { dmax: 7 }, k: 'kg', v: 50, f: 12, forms: ['v500'], sc: 'wt × 50 mg 12-hourly (first week)' }, { k: 'kg', v: 25, f: 6, max: 1000, forms: ['v500'], sc: 'wt × 25 mg 6-hourly' }],
      mening: [{ when: { dmax: 7 }, k: 'kg', v: 50, f: 8, forms: ['v500'] }, { k: 'kg', v: 50, f: 6, max: 2000, forms: ['v500'], sc: 'wt × 50 mg 6-hourly' }]
    } });

  /* ---------------- Cephalosporins and others ---------------- */
  d('cephalexin', { g: 'Cefalexin (cephalexin)', b: ['Keflex', 'Ceporex'], cls: ['cephalosporin'], src: 'K p1, p147',
    forms: [{ id: 's125', n: 'Syrup 125 mg/5 mL', r: 'PO', c: S5(125) }, { id: 's250', n: 'Syrup 250 mg/5 mL', r: 'PO', c: S5(250) }, { id: 'cap250', n: 'Capsule 250 mg', r: 'PO', tab: 250 }, { id: 'cap500', n: 'Capsule 500 mg', r: 'PO', tab: 500 }],
    reg: { po: [{ when: { wmin: 40 }, k: 'fix', dose: 500, unit: 'mg', f: 6, dur: '5–7 days', forms: ['cap500'] }, { k: 'kg', v: 12.5, f: 6, dur: '5–7 days', forms: ['s250', 's125', 'cap250'], sc: '125: wt/2 · 250: wt/4 mL 6-hourly' }] } });
  d('cefaclor', { g: 'Cefaclor', b: ['Midocef', 'Cloracef', 'Ceclor'], cls: ['cephalosporin'], src: 'K p8',
    forms: [{ id: 's125', n: 'Syrup 125 mg/5 mL', r: 'PO', c: S5(125) }, { id: 's250', n: 'Syrup 250 mg/5 mL', r: 'PO', c: S5(250) }, { id: 't250', n: 'Capsule 250 mg', r: 'PO', tab: 250 }, { id: 't500', n: 'Capsule 500 mg', r: 'PO', tab: 500 }],
    reg: { po: { k: 'kg', v: 12.5, f: 8, dur: '7 days', max: 500, forms: ['s250', 's125', 't250', 't500'], sc: '125: wt/2 · 250: wt/4 mL 8-hourly' } } });
  d('cefuroximePO', { g: 'Cefuroxime axetil (oral)', b: ['Zenon', 'Zinnat'], cls: ['cephalosporin'], src: 'K p14, p148',
    forms: [{ id: 's125', n: 'Syrup 125 mg/5 mL', r: 'PO', c: S5(125) }, { id: 's250', n: 'Syrup 250 mg/5 mL', r: 'PO', c: S5(250) }, { id: 't250', n: 'Tablet 250 mg', r: 'PO', tab: 250 }],
    reg: { po: { k: 'kg', v: 12.5, f: 12, max: 250, dur: '7 days', forms: ['s250', 's125', 't250'], sc: '125: wt/2 · 250: wt/4 mL twice daily', ci: { amin: 3 } } } });
  d('cefuroxime', { g: 'Cefuroxime sodium (injection)', b: ['Maxil', 'Zinoxime', 'Zinacef'], cls: ['cephalosporin'], src: 'K p9, p16, p134',
    forms: [{ id: 'v750', n: 'Vial 750 mg', r: 'IV', c: 100, rec: '750 mg in 7.5 mL water = 100 mg/mL' }],
    reg: { iv: [{ when: { dmax: 28 }, k: 'kg', v: 30, f: 12, forms: ['v750'] }, { k: 'kg', v: 30, f: 8, max: 750, forms: ['v750'], sc: 'wt × 30 mg 8-hourly (max 750 mg/dose)' }] } });
  d('cefixime', { g: 'Cefixime', b: ['Suprax', 'Betixim', 'Amixime', 'Magnacef'], cls: ['cephalosporin'], src: 'K p2, p64, p71, p147',
    forms: [{ id: 's100', n: 'Syrup 100 mg/5 mL (30 mL bottle)', r: 'PO', c: S5(100) }, { id: 'c200', n: 'Capsule 200 mg', r: 'PO', tab: 200 }, { id: 'c400', n: 'Capsule 400 mg', r: 'PO', tab: 400 }],
    reg: {
      po: { k: 'kg', v: 8, f: 24, max: 400, dur: '6 days', forms: ['s100', 'c200', 'c400'], sc: 'wt × 0.4 mL once daily', note: 'Bottle is 30 mL only: if the daily dose is over 6 mL, prescribe 2 bottles or capsules.' },
      typhoid: { k: 'kg', v: 8, f: 24, max: 400, dur: '10 days', forms: ['s100', 'c200', 'c400'], sc: 'wt × 0.4 mL once daily for 10 days' }
    } });
  d('cefpodoxime', { g: 'Cefpodoxime', b: ['Cefodox'], cls: ['cephalosporin'], src: 'K p83, p145',
    forms: [{ id: 's50', n: 'Syrup 50 mg/5 mL', r: 'PO', c: S5(50) }, { id: 's100', n: 'Syrup 100 mg/5 mL', r: 'PO', c: S5(100) }],
    reg: { po: { k: 'kg', v: 5, f: 12, max: 200, dur: '7 days', forms: ['s100', 's50'], sc: '50: wt/2 · 100: wt/4 mL twice daily' } } });
  d('ceftriaxone', { g: 'Ceftriaxone', b: ['Oncef', 'Samixon', 'Rocephin'], cls: ['cephalosporin'], src: 'K p16, p84, p92, p108; P 26',
    forms: [{ id: 'v250', n: 'Vial 250 mg', r: 'IV', c: 100 }, { id: 'v500', n: 'Vial 500 mg', r: 'IV', c: 100 }, { id: 'v1g', n: 'Vial 1 g', r: 'IV', c: 100, rec: '1 g in 10 mL water = 100 mg/mL; infuse over at least 30 min' }],
    ci: { neonate: 'Contraindicated in neonates (jaundice; calcium precipitates) — use cefotaxime.', jaundice: 'Avoid in a jaundiced child (worsens jaundice) — use cefotaxime, ampicillin or benzylpenicillin.' },
    reg: {
      std: { k: 'kgd', v: 50, n: 2, max: 1000, forms: ['v1g', 'v500', 'v250'], sc: 'wt × 50 mg/day (once, or ÷ 12-hourly)', note: '30–80 mg/kg/day; usual 50 mg/kg/day. Do not give 50 mg/kg twice (that is the meningitic dose).' },
      severe: { k: 'kgd', v: 80, n: 2, max: 2000, forms: ['v1g'], sc: 'wt × 40 mg 12-hourly (80 mg/kg/day)' },
      renal: { k: 'kgd', v: 50, n: 1, max: 2000, forms: ['v1g', 'v500'], sc: '50 mg/kg/day ("renal dose")' },
      mening: { k: 'kgd', v: 100, n: 2, max: 4000, forms: ['v1g'], sc: 'wt × 50 mg 12-hourly (100 mg/kg/day)', note: 'Guideline: max 1 g twice daily; international maximum 4 g/day.' },
      osteo: { k: 'kgd', v: 80, n: 1, max: 4000, dur: '6 weeks', forms: ['v1g'] }
    } });
  d('cefotaxime', { g: 'Cefotaxime', b: ['Ceftax', 'Zetax', 'Claforan'], cls: ['cephalosporin'], src: 'K p16, p39, p93',
    forms: [{ id: 'v500', n: 'Vial 500 mg', r: 'IV', c: 100 }, { id: 'v1g', n: 'Vial 1 g', r: 'IV', c: 100, rec: 'in 10 mL water = 100 mg/mL' }],
    reg: {
      std: [{ when: { dmax: 7 }, k: 'kg', v: 50, f: 12, forms: ['v500', 'v1g'], sc: 'wt × 50 mg 12-hourly (first week)' }, { k: 'kg', v: 50, f: 8, max: 2000, forms: ['v500', 'v1g'], sc: 'wt × 50 mg 8-hourly' }],
      mening: [{ when: { dmax: 7 }, k: 'kg', v: 50, f: 8, forms: ['v500', 'v1g'] }, { k: 'kg', v: 50, f: 6, max: 2000, forms: ['v500', 'v1g'], sc: 'wt × 50 mg 6-hourly (200 mg/kg/day)' }]
    } });
  d('ceftazidime', { g: 'Ceftazidime', b: ['Fortum'], cls: ['cephalosporin'], src: 'K p30, p145; P 25',
    forms: [{ id: 'v1g', n: 'Vial 1 g', r: 'IV', c: 100 }],
    reg: { iv: [{ when: { dmax: 28 }, k: 'kg', v: 25, f: 12, forms: ['v1g'] }, { k: 'kg', v: 50, f: 8, max: 2000, forms: ['v1g'], sc: '100–150 mg/kg/day ÷ 8–12-hourly' }] } });
  d('cefepime', { g: 'Cefepime', b: ['Protect', 'Maxipime'], cls: ['cephalosporin'], src: 'K p145',
    forms: [{ id: 'v1g', n: 'Vial 1 g', r: 'IV', c: 100 }],
    reg: { iv: { k: 'kg', v: 50, f: 12, max: 2000, forms: ['v1g'], note: 'Every 8 hours if severe.' } } });
  d('meropenem', { g: 'Meropenem', b: ['Meronem'], cls: ['carbapenem'], src: 'K p52, p145',
    forms: [{ id: 'v500', n: 'Vial 500 mg', r: 'IV', c: 50, rec: '500 mg in 10 mL = 50 mg/mL' }, { id: 'v1g', n: 'Vial 1 g', r: 'IV', c: 50 }],
    reg: { iv: { k: 'kg', v: 20, f: 8, max: 1000, forms: ['v500', 'v1g'], note: '20–40 mg/kg/dose 8–12-hourly (40 mg/kg in meningitis).' } } });
  d('gentamicin', { g: 'Gentamicin', b: ['Garamycin'], cls: ['aminoglycoside'], src: 'K p16, p39; P 46',
    forms: [{ id: 'a80', n: 'Ampoule 80 mg/2 mL', r: 'IV', c: 40 }],
    ci: { renal: 'Nephrotoxic: check renal function first; avoid or reduce in renal impairment.' },
    reg: { std: [{ when: { dmax: 7 }, k: 'kg', v: 2.5, f: 12, forms: ['a80'], sc: 'wt × 2.5 mg 12-hourly (or wt × 4 mg once daily) in the first week or < 2 kg' },
      { when: { wmax: 2 }, k: 'kg', v: 2.5, f: 12, forms: ['a80'] }, { k: 'kg', v: 2.5, f: 8, max: 120, forms: ['a80'], sc: 'wt × 2.5 mg 8-hourly' }] } });
  d('vancomycin', { g: 'Vancomycin', b: ['Vancocin'], cls: ['glycopeptide'], src: 'K p30, p134, p146',
    forms: [{ id: 'v500', n: 'Vial 500 mg', r: 'IV', c: 50, rec: '500 mg in 10 mL water; dilute to ≤ 5 mg/mL in NS or dextrose saline' }, { id: 'v1g', n: 'Vial 1 g', r: 'IV', c: 50 }],
    reg: { iv: { k: 'kg', v: 15, f: 8, max: 1000, forms: ['v500', 'v1g'], note: 'Infuse over ≥ 60 min, diluted to ≤ 5 mg/mL (30, 50 or 100 mL NS).' },
      osteo: { k: 'kgd', v: 60, n: 3, max: 1000, dur: '6 weeks', forms: ['v500', 'v1g'] } } });
  d('acyclovir', { g: 'Aciclovir (acyclovir)', b: ['Zovirax'], cls: ['antiviral'], src: 'K p146',
    forms: [{ id: 'v250', n: 'Vial 250 mg', r: 'IV', c: 25, rec: '250 mg in 10 mL water = 25 mg/mL; dilute to ≤ 7 mg/mL in D5 (30, 50 or 100 mL by age)' }],
    reg: { iv: { k: 'kg', v: 10, f: 8, forms: ['v250'], dur: '14–21 days (encephalitis)', note: 'Infuse over 1 hour, ≤ 7 mg/mL; keep the child well hydrated.' } } });
  d('erythromycin', { g: 'Erythromycin', b: ['Erythrocin'], cls: ['macrolide'], src: 'K p2, p27, p109, p147',
    forms: [{ id: 's125', n: 'Syrup 125 mg/5 mL', r: 'PO', c: S5(125) }, { id: 's250', n: 'Syrup 250 mg/5 mL', r: 'PO', c: S5(250) }, { id: 't250', n: 'Tablet 250 mg', r: 'PO', tab: 250 }, { id: 't500', n: 'Tablet 500 mg', r: 'PO', tab: 500 }],
    reg: { po: { k: 'kg', v: 12.5, f: 6, max: 500, dur: '7 days', forms: ['s250', 's125', 't250'], sc: '125: wt/2 · 250: wt/4 mL 6-hourly', note: 'Prokinetic: causes diarrhoea.' },
      pertussis: { k: 'kg', v: 12.5, f: 6, max: 500, dur: '14 days', forms: ['s250', 's125', 't250'], sc: '125: wt/2 · 250: wt/4 mL 6-hourly for 2 weeks' },
      rfallergy: { k: 'band', by: 'age', rows: [[84, 250, 'mg'], [999, 500, 'mg']], f: 12, dur: '10 days, then as secondary prophylaxis', forms: ['t250', 't500', 's250'] },
      cholera: { k: 'kg', v: 12.5, f: 6, dur: '3 days', forms: ['s250', 's125', 't250'] } } });
  d('azithromycin', { g: 'Azithromycin', b: ['Zomax', 'Zocin', 'Zithrokan', 'Zithromax'], cls: ['macrolide'], src: 'K p2, p28, p147',
    forms: [{ id: 's200', n: 'Syrup 200 mg/5 mL (only strength)', r: 'PO', c: S5(200) }, { id: 't250', n: 'Tablet/capsule 250 mg', r: 'PO', tab: 250 }, { id: 't500', n: 'Tablet 500 mg', r: 'PO', tab: 500 }],
    ci: { amin: 6, why: 'Not under 6 months (risk of pyloric stenosis).' },
    reg: { po: { k: 'kg', v: 10, f: 24, max: 500, dur: '3 days', forms: ['s200', 't250', 't500'], sc: 'wt/4 mL once daily' },
      pertussis: { k: 'kg', v: 10, f: 24, max: 500, dur: '5 days', forms: ['s200', 't250', 't500'], sc: 'wt/4 mL once daily for 5 days' } } });
  d('clarithromycin', { g: 'Clarithromycin', b: ['Klacid', 'Claricid'], cls: ['macrolide'], src: 'K p6, p28, p75, p147',
    forms: [{ id: 's125', n: 'Syrup 125 mg/5 mL', r: 'PO', c: S5(125) }, { id: 's250', n: 'Syrup 250 mg/5 mL', r: 'PO', c: S5(250) }, { id: 't250', n: 'Tablet 250 mg', r: 'PO', tab: 250 }, { id: 't500', n: 'Tablet 500 mg', r: 'PO', tab: 500 }],
    reg: { po: { k: 'kg', v: 7.5, f: 12, max: 500, dur: '7 days', forms: ['s250', 's125', 't250', 't500'], sc: '125: wt/3 · 250: wt/6 mL twice daily' },
      hp: [{ when: { wmin: 45 }, k: 'fix', dose: 500, unit: 'mg', f: 12, dur: '1 week', forms: ['t500'] }, { k: 'kg', v: 7.5, f: 12, max: 500, dur: '1 week', forms: ['s250', 's125', 't250'], sc: '125: wt/3 · 250: wt/6 mL twice daily' }] } });
  d('metronidazole', { g: 'Metronidazole', b: ['Flagyl'], cls: ['nitroimidazole'], src: 'K p7, p64, p134, p148',
    forms: [{ id: 's125', n: 'Syrup 125 mg/5 mL', r: 'PO', c: S5(125) }, { id: 's200', n: 'Syrup 200 mg/5 mL', r: 'PO', c: S5(200) }, { id: 't250', n: 'Tablet 250 mg', r: 'PO', tab: 250 }, { id: 'inf', n: 'Infusion 500 mg/100 mL (5 mg/mL)', r: 'IV', c: 5 }],
    reg: { po: { k: 'kg', v: 7.5, f: 8, max: 400, dur: '5–7 days', forms: ['s125', 's200', 't250'], sc: '125 mg/5 mL: wt/3 mL · 200 mg/5 mL: wt/5 mL 8-hourly', note: 'The guideline prints "syrup 200: wt/3 mL"; that is 13 mg/kg. The usual dose is 7.5 mg/kg, which wt/3 mL gives with the 125 mg/5 mL syrup. Check the bottle.' },
      iv: { k: 'kg', v: 7.5, f: 8, max: 500, forms: ['inf'], sc: 'wt × 1.5 mL 8-hourly' },
      amoeba: { k: 'kg', v: 15, f: 8, max: 800, dur: '10 days', forms: ['s200', 's125', 't250'], sc: 'double dose (wt × 2/3 mL) 8-hourly for 10 days' },
      giardia: { k: 'kg', v: 7.5, f: 8, max: 400, dur: '5–7 days', forms: ['s125', 's200', 't250'], sc: '125 mg/5 mL: wt/3 mL 8-hourly' } } });
  d('cotrimoxazole', { g: 'Co-trimoxazole (sulfamethoxazole + trimethoprim)', b: ['Septrin', 'Bactrim'], cls: ['sulfa'], src: 'K p64, p83, p148',
    forms: [{ id: 's240', n: 'Syrup 240 mg/5 mL', r: 'PO', c: S5(240) }, { id: 't480', n: 'Tablet 480 mg', r: 'PO', tab: 480 }],
    ci: { amin: 2, why: 'Guideline: not under 2 months (kernicterus risk).', g6pd: 'Haemolysis in G6PD deficiency.' },
    reg: { po: { k: 'kg', v: 24, f: 12, max: 960, dur: '5 days', forms: ['s240', 't480'], sc: 'wt/2 mL twice daily', note: 'Dose by total co-trimoxazole: wt/2 mL of 240 mg/5 mL (≈ 20 mg/kg sulfamethoxazole).' } } });
  d('nalidixic', { g: 'Nalidixic acid', b: ['NegGram'], cls: ['quinolone'], src: 'K p65, p83',
    forms: [{ id: 't500', n: 'Tablet 500 mg (no syrup)', r: 'PO', tab: 500 }],
    reg: { po: { k: 'kgd', v: 50, n: 4, max: 1000, dur: '5 days', forms: ['t500'], sc: 'wt × 50 ÷ 4 mg 6-hourly (10 kg = 1/4 tab, or 1 tab in 4 mL water: 1 mL)' } } });
  d('ciprofloxacin', { g: 'Ciprofloxacin', b: ['Cipro', 'Ciprobay'], cls: ['quinolone'], src: 'K p71',
    forms: [{ id: 't500', n: 'Tablet 500 mg', r: 'PO', tab: 500 }],
    ci: { amin: 144, why: 'Guideline uses it only over 12 years.' },
    reg: { typhoid: { k: 'fix', dose: 500, unit: 'mg', f: 12, dur: '2 weeks', forms: ['t500'] } } });
  d('doxycycline', { g: 'Doxycycline', b: ['Vibramycin'], cls: ['tetracycline'], src: 'K p67',
    forms: [{ id: 't100', n: 'Tablet/capsule 100 mg', r: 'PO', tab: 100 }],
    ci: { amin: 96, why: 'Over 8 years only (teeth staining).' },
    reg: { cholera: { k: 'fix', dose: 300, unit: 'mg', f: 0, forms: ['t100'], note: 'Cholera: single dose (guideline: doxycycline tab 100 mg over 8 years; WHO single dose 300 mg).' } } });
  d('chloramphenicol', { g: 'Chloramphenicol', b: ['Chloromycetin'], cls: ['amphenicol'], src: 'P 30', forms: [{ id: 'v1g', n: 'Vial 1 g', r: 'IV', c: 100 }, { id: 'c250', n: 'Capsule 250 mg', r: 'PO', tab: 250 }],
    reg: { std: { k: 'kgd', v: 75, n: 4, max: 1000, forms: ['v1g', 'c250'], note: '50–100 mg/kg/day ÷ 6-hourly. Avoid in neonates (grey baby).' } } });

  /* ---------------- Antimalarials ---------------- */
  d('artemether', { g: 'Artemether (injection)', b: ['Artemether', 'Paluther', 'Gvither'], cls: ['antimalarial'], src: 'K p100–101, p148; P 11',
    forms: [{ id: 'a40', n: 'Ampoule 40 mg/1 mL', r: 'IM', c: 40 }, { id: 'a80', n: 'Ampoule 80 mg/1 mL', r: 'IM', c: 80 }, { id: 'a40h', n: 'Ampoule 40 mg/0.5 mL', r: 'IM', c: 80 }],
    reg: { sev: { k: 'kg', v: 1.6, f: 24, dur: 'now, again after 12 hours, then once daily for 6 days', forms: ['a40', 'a80'], sc: '40 mg/mL: wt × 4 units · 80 mg/mL: wt × 2 units (insulin syringe)', note: 'Day 1 total 3.2 mg/kg (two doses). Not in the newest protocol (IV artesunate or quinine preferred) but still used. 40 mg ampoule up to 25 kg; 80 mg above.' } } });
  d('artesunateIV', { g: 'Artesunate (injection)', b: ['Artesun'], cls: ['antimalarial'], src: 'K p103',
    forms: [{ id: 'v60', n: 'Vial 60 mg (+ 1 mL bicarbonate + 5 mL NS = 10 mg/mL)', r: 'IV', c: 10 }, { id: 'v120', n: 'Vial 120 mg (+ 2 mL bicarbonate + 10 mL NS = 10 mg/mL)', r: 'IV', c: 10 }, { id: 'v30', n: 'Vial 30 mg (+ 0.5 mL bicarbonate + 2.5 mL NS)', r: 'IV', c: 10 }],
    reg: { sev: [{ when: { wmax: 20 }, k: 'kg', v: 3, f: 0, forms: ['v60', 'v30', 'v120'], dur: 'at 0, 12 and 24 h, then every 24 h until oral treatment' }, { k: 'kg', v: 2.4, f: 0, forms: ['v60', 'v120'], dur: 'at 0, 12 and 24 h, then every 24 h until oral treatment' }] } });
  d('artesunatePR', { g: 'Artesunate rectal capsule', b: ['Rectocap'], cls: ['antimalarial'], src: 'P (pre-referral)', forms: [{ id: 'r50', n: 'Rectal capsule 50 mg', r: 'PR', tab: 50 }, { id: 'r200', n: 'Rectal capsule 200 mg', r: 'PR', tab: 200 }],
    reg: { pre: { k: 'kg', v: 10, f: 0, forms: ['r50', 'r200'], note: 'Pre-referral: as soon as severe malaria is diagnosed; repeat if expelled within 1 hour; second dose after 24 h if referral delayed.' } } });
  d('quinine', { g: 'Quinine dihydrochloride (injection)', b: ['Quinine'], cls: ['antimalarial'], src: 'K p101–102; P 81',
    forms: [{ id: 'a600', n: 'Ampoule 600 mg/2 mL (300 mg/mL)', r: 'IV', c: 300 }],
    reg: { sev: { k: 'kg', v: 10, f: 8, max: 600, dur: '7 days (switch to tablets when able)', forms: ['a600'], note: 'Dilute 1 mg in 1 mL of D10 (or dextrose ½ saline / DNS) and infuse over 4 hours, 8-hourly. Renal impairment 5–7 mg/kg/dose. IM (if no IV, or before transfusion in severe anaemia): same dose diluted to 60 mg/mL, half into each anterior thigh.' } } });
  d('quinineTab', { g: 'Quinine sulphate (tablet)', b: ['Quinine'], cls: ['antimalarial'], src: 'K p103', forms: [{ id: 't300', n: 'Tablet 300 mg', r: 'PO', tab: 300 }],
    reg: { po: { k: 'kg', v: 10, f: 8, max: 600, dur: '7 days', forms: ['t300'], sc: '10 kg = 100 mg = 1/3 tab (dissolve 1 tab in 3 mL, give 1 mL)' } } });
  d('coartem', { g: 'Artemether + lumefantrine', b: ['Coartem'], cls: ['antimalarial'], src: 'K p102',
    forms: [{ id: 't20', n: 'Tablet 20/120 mg', r: 'PO', tab: 20 }, { id: 't80', n: 'Adult tablet 80/480 mg', r: 'PO', tab: 80 }],
    reg: { po: { k: 'band', by: 'wt', rows: [[14.9, 1, 'tab 20/120'], [24.9, 2, 'tab 20/120'], [34.9, 3, 'tab 20/120'], [999, 1, 'adult tab 80/480']], f: 12, dur: 'at 0 and 8 hours on day 1, then twice daily on days 2 and 3 (6 doses)', forms: ['t20', 't80'], note: 'Under 5 kg: adjust by weight. First line for uncomplicated malaria; give with food or milk.' } } });
  d('dhapq', { g: 'Dihydroartemisinin + piperaquine', b: ['DHAP', 'Duo-Cotecxin', 'Eurartesim'], cls: ['antimalarial'], src: 'K p102–103',
    forms: [{ id: 't20', n: 'Paediatric tablet 20/160 mg', r: 'PO', tab: 20 }, { id: 't40', n: 'Adult tablet 40/320 mg', r: 'PO', tab: 40 }],
    reg: { po: { k: 'band', by: 'wt', rows: [[7, 0.5, 'tab 20/160'], [12.9, 1, 'tab 20/160'], [23.9, 1, 'tab 40/320'], [35.9, 2, 'tab 40/320'], [74.9, 3, 'tab 40/320'], [999, 4, 'tab 40/320']], f: 24, dur: 'once daily for 3 days at the same time', note: 'Second line (failure within 4 weeks). 13–24 kg row is unclear in the guideline table; WHO gives 1 tablet of 40/320.' } } });
  d('primaquine', { g: 'Primaquine', b: ['Primaquine'], cls: ['antimalarial'], src: 'K p104; P 78',
    forms: [{ id: 't75', n: 'Tablet 7.5 mg', r: 'PO', tab: 7.5 }, { id: 't15', n: 'Tablet 15 mg', r: 'PO', tab: 15 }],
    ci: { amin: 6, why: 'Not under 6 months.', g6pd: 'Absolutely contraindicated in G6PD deficiency.' },
    reg: { vivax: { k: 'kg', v: 0.25, f: 24, max: 15, dur: '14 days (after the antimalarial)', forms: ['t75', 't15'], note: 'Malaria protocol 0.25 mg/kg/day; references 0.15 mg/kg/dose. P. ovale the same.' } } });

  /* ---------------- Analgesics and antipyretics ---------------- */
  d('paracetamol', { g: 'Paracetamol', b: ['Panadol', 'Adol', 'Calpol', 'Fevadol'], cls: ['analgesic'], src: 'K p3, p40, p90; P 70',
    forms: [{ id: 's120', n: 'Syrup 120 mg/5 mL', r: 'PO', c: S5(120) }, { id: 'dr', n: 'Drops 100 mg/mL (Adol drops)', r: 'PO', c: 100 }, { id: 'sup125', n: 'Suppository 125 mg', r: 'PR', sup: 125 },
      { id: 'sup250', n: 'Suppository 250 mg', r: 'PR', sup: 250 }, { id: 'inf', n: 'Infusion 10 mg/mL', r: 'IV', c: 10 }, { id: 't500', n: 'Tablet 500 mg', r: 'PO', tab: 500 }],
    ci: { liver: 'Hepatitis: guideline prefers ibuprofen; avoid paracetamol.' },
    reg: { prn: [{ when: { amax: 3 }, k: 'kg', v: 10, f: 6, forms: ['dr', 'sup125', 's120'], sc: 'Drops 0.1 mL/kg (5 mg/kg if jaundiced)' }, { k: 'kg', v: 10, f: 6, max: 1000, forms: ['s120', 't500', 'sup125', 'sup250'], dur: 'every 6 hours for 24 hours, then when needed', sc: 'wt/2 mL' }],
      iv: { k: 'kg', v: 10, f: 6, max: 1000, forms: ['inf'], sc: '1 mL/kg 6-hourly' },
      pr: { k: 'kg', v: 10, f: 6, forms: ['sup125', 'sup250'] } } });
  d('ibuprofen', { g: 'Ibuprofen', b: ['Brufen', 'Sapofen', 'Profinal'], cls: ['nsaid'], src: 'K p3, p106, p148',
    forms: [{ id: 's100', n: 'Syrup 100 mg/5 mL', r: 'PO', c: S5(100) }, { id: 't200', n: 'Tablet 200 mg', r: 'PO', tab: 200 }, { id: 't400', n: 'Tablet 400 mg', r: 'PO', tab: 400 }],
    ci: { amin: 6, why: 'Not under 6 months.', asthma: 'No NSAIDs in asthma (bronchospasm).', dengue: 'No NSAIDs in dengue (bleeding).' },
    reg: { prn: { k: 'kg', v: 7, f: 8, max: 400, dur: 'every 8 hours for 24 hours, then when needed', forms: ['s100', 't200', 't400'], sc: 'wt/3 mL (or wt/2 mL by severity)', note: '20 mg/kg/day; 40 mg/kg/day in severe pain (sickle crisis, arthritis).' },
      scd: { k: 'kg', v: 10, f: 8, max: 400, forms: ['s100', 't200', 't400'], sc: 'wt/2 mL 8-hourly', note: 'Up to double dose (40 mg/kg/day) in painful crisis.' } } });
  d('mefenamic', { g: 'Mefenamic acid', b: ['Mefnac', 'Fendol', 'Pangesic', 'Ponstan'], cls: ['nsaid'], src: 'K p3',
    forms: [{ id: 's50', n: 'Syrup 50 mg/5 mL', r: 'PO', c: S5(50) }, { id: 't250', n: 'Tablet 250 mg', r: 'PO', tab: 250 }, { id: 't500', n: 'Tablet 500 mg', r: 'PO', tab: 500 }],
    ci: { amin: 6, why: 'Avoid under 6 months.', asthma: 'No NSAIDs in asthma.', dengue: 'No NSAIDs in dengue.' },
    reg: { prn: { k: 'kg', v: 6.5, f: 8, max: 500, dur: 'every 8 hours for 24 hours, then when needed', forms: ['s50', 't250', 't500'], sc: 'wt/2 + 1 mL (10 kg = 6 mL)' } } });
  d('diclofenac', { g: 'Diclofenac sodium', b: ['Voltaren', 'Voltrex', 'Olfen'], cls: ['nsaid'], src: 'K p90, p106',
    forms: [{ id: 'a75', n: 'Ampoule 75 mg/3 mL (25 mg/mL)', r: 'IM', c: 25 }, { id: 'sup125', n: 'Suppository 12.5 mg', r: 'PR', sup: 12.5 }, { id: 'sup25', n: 'Suppository 25 mg', r: 'PR', sup: 25 }],
    ci: { amin: 6, why: 'Avoid under 6 months.', asthma: 'No NSAIDs in asthma.', dengue: 'No NSAIDs in dengue.', renal: 'Avoid in renal impairment.' },
    reg: { im: { k: 'kg', v: 1, f: 0, max: 75, forms: ['a75'], note: '1–3 mg/kg/dose deep IM (severe pain, high fever).' }, pr: { k: 'kg', v: 1, f: 8, max: 50, forms: ['sup125', 'sup25'] } } });
  d('pethidine', { g: 'Pethidine', b: ['Pethidine'], cls: ['opioid'], src: 'K p106; P 71', forms: [{ id: 'a50', n: 'Ampoule 50 mg/1 mL', r: 'IM', c: 50 }],
    reg: { im: { k: 'kg', v: 1, f: 6, max: 50, forms: ['a50'], note: '1–2 mg/kg/dose every 4–6 hours if needed. Monitor breathing.' } } });
  d('morphine', { g: 'Morphine', b: ['Morphine'], cls: ['opioid'], src: 'K p106; PICU', forms: [{ id: 'a10', n: 'Ampoule 10 mg/1 mL', r: 'IV', c: 10 }],
    reg: { iv: { k: 'kg', v: 0.1, f: 4, max: 10, forms: ['a10'], note: '0.1–0.2 mg/kg/dose (PICU 0.05 mg/kg IV). Have naloxone ready; monitor SpO2 and breathing.' } } });
  d('aspirin', { g: 'Acetylsalicylic acid (aspirin)', b: ['Aspirin', 'Aspocid'], cls: ['nsaid', 'salicylate'], src: 'K p33; P 12–13',
    forms: [{ id: 't300', n: 'Tablet 300 mg', r: 'PO', tab: 300 }, { id: 't100', n: 'Tablet 100 mg', r: 'PO', tab: 100 }, { id: 't75', n: 'Tablet 75 mg', r: 'PO', tab: 75 }],
    ci: { asthma: 'Caution in asthma.' },
    reg: { rf: { k: 'kgd', v: 75, n: 3, dur: '4 weeks, then taper (with a PPI)', forms: ['t300', 't100'], note: 'Only for rheumatic fever (and as directed); never as an analgesic under 12 years (Reye syndrome). Always with omeprazole.' } } });

  /* ---------------- Respiratory ---------------- */
  d('salbutamolNeb', { g: 'Salbutamol nebuliser', b: ['Ventolin'], cls: ['beta2'], src: 'K p18, p21',
    forms: [{ id: 'conc', n: 'Respirator solution 5 mg/mL', r: 'neb', c: 5 }, { id: 'nebule', n: 'Nebule 2.5 mg/2.5 mL', r: 'neb', c: 1 }],
    ci: { cardiac: 'Tachycardia, hypokalaemia: avoid in heart failure, anaemic heart failure and congenital heart disease (fatal mistake).' },
    reg: { neb: { k: 'band', by: 'age', rows: [[60, 2.5, 'mg'], [999, 5, 'mg']], f: 0, forms: ['conc', 'nebule'], dur: 'every 20 minutes for 1 hour (3 sessions), then reassess', sc: '< 5 y: 0.5 mL concentrate in 2 mL NS (or ½ nebule) · > 5 y: 1 mL in 3 mL NS (or a whole nebule)' } } });
  d('salbutamolPO', { g: 'Salbutamol (oral)', b: ['Ventolin syrup'], cls: ['beta2'], src: 'K p21, p148; P 85',
    forms: [{ id: 's2', n: 'Syrup 2 mg/5 mL', r: 'PO', c: S5(2) }, { id: 't4', n: 'Tablet 4 mg', r: 'PO', tab: 4 }],
    reg: { po: { k: 'kg', v: 0.1, f: 8, max: 4, dur: '3–5 days', forms: ['s2', 't4'], sc: 'wt/4 mL 8-hourly' } } });
  d('terbutaline', { g: 'Terbutaline (oral)', b: ['Bronclyn', 'Bricanyl'], cls: ['beta2'], src: 'K p21', forms: [{ id: 's15', n: 'Syrup 1.5 mg/5 mL', r: 'PO', c: S5(1.5) }],
    reg: { po: { k: 'band', by: 'age', rows: [[36, 2.5, 'mL'], [72, 5, 'mL'], [132, 7.5, 'mL'], [180, 10, 'mL'], [999, 15, 'mL']], f: 8, dur: '3–5 days', forms: ['s15'] } } });
  d('ipratropium', { g: 'Ipratropium bromide nebuliser', b: ['Atrovent', 'Polyneb'], cls: ['anticholinergic'], src: 'K p20, p25',
    forms: [{ id: 'n250', n: 'Solution 250 mcg/mL', r: 'neb', c: 0.25 }],
    reg: { neb: { k: 'band', by: 'wt', rows: [[20, 0.5, 'mL'], [999, 1, 'mL']], f: 0, forms: ['n250'], dur: 'every 20 minutes for 1 hour, then 4–6-hourly', sc: '< 20 kg: 0.5 mL in 2 mL NS · > 20 kg: 1 mL in 3 mL NS (can be mixed with salbutamol)' } } });
  d('adrenalineNeb', { g: 'Adrenaline (epinephrine) 1:1000 nebuliser', b: ['Adrenaline'], cls: ['adrenergic'], src: 'K p11, p20',
    forms: [{ id: 'a1', n: 'Ampoule 1 mg/mL (1:1000)', r: 'neb', c: 1 }],
    reg: { neb: { k: 'band', by: 'age', rows: [[24, 0.5, 'mL'], [999, 1, 'mL']], f: 0, forms: ['a1'], dur: 'every 20 minutes for 1 hour, then 2-hourly', sc: '0.5 mL in 2 mL NS, or 1 mL in 3 mL NS', note: 'Rebound after 2–3 h: observe before discharge.' } } });
  d('saline3', { g: 'Hypertonic saline 3% nebuliser', b: ['Hypertonic saline'], cls: ['neb'], src: 'K p19–20', forms: [{ id: 'n3', n: 'NaCl 3%', r: 'neb', c: 30 }],
    reg: { neb: { k: 'fix', dose: 3, unit: 'mL', f: 0, forms: ['n3'], dur: 'every 20 minutes for 1 hour, then 2-hourly', note: 'First choice in bronchiolitis. Normal saline 3 mL is the alternative (croup, bronchiolitis).' } } });
  d('budesonideNeb', { g: 'Budesonide nebuliser', b: ['Pulmicort'], cls: ['steroid'], src: 'K p11', forms: [{ id: 'n05', n: 'Respules 0.5 mg/2 mL', r: 'neb', c: 0.25 }],
    reg: { neb: { k: 'fix', dose: 2, unit: 'mg', f: 0, forms: ['n05'], note: 'Croup: may replace dexamethasone (2 mg once).' } } });
  d('hydrocortisone', { g: 'Hydrocortisone sodium succinate', b: ['Solu-Cortef', 'Hydrocortisone'], cls: ['steroid'], src: 'K p23, p110, p126, p137',
    forms: [{ id: 'v100', n: 'Vial 100 mg (in 2 mL water = 50 mg/mL)', r: 'IV', c: 50 }],
    reg: { asthma: { k: 'kg', v: 4, f: 6, forms: ['v100'], sc: '< 2 y max 25 mg · 2–5 y 50 mg · 5–18 y 100 mg 6-hourly', note: '4–5 mg/kg/dose 6-hourly (5–10 mg/kg severe). Oral prednisolone is as good if the child can swallow.', maxBand: [[24, 25], [60, 50], [999, 100]] },
      ana: { k: 'band', by: 'age', rows: [[6, 25, 'mg'], [72, 50, 'mg'], [144, 100, 'mg'], [999, 200, 'mg']], f: 6, forms: ['v100'], note: '4–5 mg/kg/dose.' },
      sting: { k: 'kg', v: 5, f: 6, max: 200, forms: ['v100'], sc: 'wt × 5 mg' } } });
  d('prednisolone', { g: 'Prednisolone', b: ['Prednisolone'], cls: ['steroid'], src: 'K p22, p34, p84–85; P 77',
    forms: [{ id: 't5', n: 'Tablet 5 mg', r: 'PO', tab: 5 }],
    reg: { asthma: { k: 'kgd', v: 1.5, n: 2, max: 60, dur: '3–5 days', forms: ['t5'], note: '1–2 mg/kg/day; adolescents 6 tablets/day (max 60 mg).' },
      nephrotic: { k: 'kgd', v: 2, n: 3, max: 60, dur: 'until remission, then 1.5 mg/kg (40 mg/m²) on alternate days for 1 month, then taper', forms: ['t5'], note: '60 mg/m²/day or 2 mg/kg/day in 3–4 doses; start after infection is treated and BP controlled. Guideline max 80 mg (international 60 mg).' },
      rf: { k: 'kgd', v: 2, n: 3, max: 60, dur: '2 weeks, then reduce 5 mg every 2–3 days (start aspirin 60 mg/kg/day for 6 weeks at the start of the taper)', forms: ['t5'] } } });
  d('dexamethasone', { g: 'Dexamethasone', b: ['Dexamethasone', 'Decadron'], cls: ['steroid'], src: 'K p11, p92, p145; P 32',
    forms: [{ id: 'a4', n: 'Ampoule 4 mg/1 mL', r: 'IM', c: 4 }],
    reg: { croup: { k: 'kg', v: 0.6, f: 0, max: 8, forms: ['a4'], sc: 'wt × 15 units insulin syringe (single dose; max 8 mg = 2 ampoules)' },
      croupRep: { k: 'kg', v: 0.15, f: 6, forms: ['a4'] },
      mening: { k: 'kg', v: 0.15, f: 6, max: 10, dur: '4 days', forms: ['a4'], sc: 'wt × 4 units insulin syringe 6-hourly', note: 'Give 30 minutes before the first antibiotic dose.' } } });
  d('orazone', { g: 'Dexamethasone oral solution', b: ['Orazone'], cls: ['steroid'], src: 'K p11', forms: [{ id: 's', n: 'Syrup 10 mg/100 mL (0.1 mg/mL)', r: 'PO', c: 0.1 }],
    reg: { croup: { k: 'band', by: 'age', rows: [[18, 1, 'mL'], [30, 2, 'mL'], [999, 3, 'mL']], f: 6, dur: '6-hourly day 1, 8-hourly day 2, twice day 3, once day 4, then stop', forms: ['s'] } } });
  d('mgso4', { g: 'Magnesium sulphate 50%', b: ['MgSO4'], cls: ['electrolyte'], src: 'K p24, p99', forms: [{ id: 'a50', n: 'Ampoule 50% (500 mg/mL)', r: 'IV', c: 500 }],
    reg: { asthma: { k: 'kg', v: 50, f: 0, max: 2000, forms: ['a50'], note: '50–100 mg/kg (BNF 40) = 0.1–0.2 mL/kg diluted in NS over 20 minutes. Not if hypotensive; NS bolus before.' },
      hypoMg: { k: 'mlkg', v: 0.1, f: 0, forms: ['a50'], note: '0.1–0.2 mL/kg diluted in D5 over 30 minutes.' } } });
  d('aminophylline', { g: 'Aminophylline', b: ['Aminophylline'], cls: ['xanthine'], src: 'K p24, p145; P 5', forms: [{ id: 'a250', n: 'Ampoule 250 mg/10 mL (25 mg/mL)', r: 'IV', c: 25 }],
    reg: { load: { k: 'kg', v: 5, f: 0, max: 250, forms: ['a250'], sc: 'wt × 20 units insulin syringe', note: 'In NS over 20–30 minutes (fast → arrhythmia, death). Not recommended in new guidelines; MgSO4 preferred.' } } });
  d('adrenalineSC', { g: 'Adrenaline (epinephrine) 1:1000', b: ['Adrenaline'], cls: ['adrenergic'], src: 'K p24, p137, p145; P 2',
    forms: [{ id: 'a1', n: 'Ampoule 1 mg/mL (1:1000)', r: 'IM', c: 1 }],
    reg: { ana: { k: 'kg', v: 0.01, f: 0, max: 0.5, forms: ['a1'], sc: 'wt × 1 unit insulin syringe (0.01 mL/kg) IM', note: 'Repeat every 5–15 minutes if no response.' },
      asthma: { k: 'kg', v: 0.01, f: 0, max: 0.5, forms: ['a1'], sc: 'wt × 1 unit SC', note: 'Every 30 minutes up to 3 doses. Not if HR > 180 (infant) or > 160 (older child).' },
      arrest: { k: 'kg', v: 0.01, f: 0, max: 1, forms: ['a1'], note: 'IV/IO 0.01 mg/kg = 0.1 mL/kg of 1:10,000 (1 mL + 9 mL NS) every 3–5 minutes.' } } });
  d('ketotifen', { g: 'Ketotifen', b: ['Ketofen', 'Zaditen'], cls: ['antihistamine'], src: 'K p22', forms: [{ id: 's1', n: 'Syrup 1 mg/5 mL', r: 'PO', c: S5(1) }],
    reg: { po: { k: 'band', by: 'age', rows: [[6, 0, 'mL'], [36, 2.5, 'mL'], [144, 5, 'mL'], [999, 7.5, 'mL']], f: 12, dur: 'long term (asthma prevention)', forms: ['s1'] } } });
  d('cetirizine', { g: 'Cetirizine', b: ['Cetrine', 'Zyrtec'], cls: ['antihistamine'], src: 'K p4', forms: [{ id: 's5', n: 'Syrup 5 mg/5 mL', r: 'PO', c: 1 }],
    ci: { amin: 24, why: 'From 2 years.' },
    reg: { po: { k: 'band', by: 'age', rows: [[72, 2.5, 'mL'], [144, 5, 'mL'], [999, 10, 'mL']], f: 24, dur: '5 days', forms: ['s5'] } } });
  d('loratadine', { g: 'Loratadine', b: ['Claritine', 'Lorine'], cls: ['antihistamine'], src: 'P 9', forms: [{ id: 's5', n: 'Syrup 5 mg/5 mL', r: 'PO', c: 1 }, { id: 't10', n: 'Tablet 10 mg', r: 'PO', tab: 10 }],
    ci: { amin: 24, why: '2–12 years in the PCH table.' },
    reg: { po: { k: 'band', by: 'wt', rows: [[30, 5, 'mg'], [999, 10, 'mg']], f: 24, forms: ['s5', 't10'] } } });
  d('chlorphenamine', { g: 'Chlorphenamine (chlorpheniramine)', b: ['Antistine', 'Piriton'], cls: ['antihistamine'], src: 'K p126, p137–138; P 10',
    forms: [{ id: 's2', n: 'Syrup 2 mg/5 mL', r: 'PO', c: S5(2) }, { id: 'a10', n: 'Ampoule 10 mg/1 mL', r: 'IM', c: 10 }],
    ci: { amin: 12, why: 'Oral not recommended under 1 year.' },
    reg: { inj: { k: 'band', by: 'age', rows: [[24, 2.5, 'mg'], [60, 5, 'mg'], [999, 10, 'mg']], f: 0, forms: ['a10'], sc: '< 2 y ¼ mL · 2–5 y ½ mL · > 5 y 1 mL', note: 'IM or slow IV; can be repeated up to 4 times a day.' },
      po: { k: 'band', by: 'age', rows: [[24, 2.5, 'mL'], [60, 2.5, 'mL'], [144, 5, 'mL']], f: 8, forms: ['s2'], note: '1–2 y twice daily · 2–5 y three times · 6–12 y every 4–6 h.' } } });
  d('mucolytic', { g: 'Ambroxol / bromhexine (mucolytic)', b: ['Solvexin', 'Ambolar', 'Mucoram', 'Muconab'], cls: ['mucolytic'], src: 'K p13', forms: [{ id: 's', n: 'Syrup', r: 'PO', c: null }],
    ci: { amin: 6, why: 'Cough syrups not under 6 months.' },
    reg: { po: { k: 'band', by: 'age', rows: [[60, 2.5, 'mL'], [999, 5, 'mL']], f: 8, dur: '5–6 days', forms: ['s'], note: '2.5–5 mL under 5 y; 5–10 mL over 5 y.' } } });
  d('prospan', { g: 'Ivy leaf extract', b: ['Prospan'], cls: ['herbal'], src: 'K p13', forms: [{ id: 's', n: 'Syrup', r: 'PO', c: null }],
    reg: { po: { k: 'band', by: 'age', rows: [[12, 2.5, 'mL'], [72, 2.5, 'mL'], [999, 5, 'mL']], f: 8, dur: '7 days', forms: ['s'], note: 'Secretolytic and spasmolytic; suitable in asthmatics.' } } });
  d('miniguava', { g: 'Guava leaf extract drops', b: ['Mini Guava'], cls: ['herbal'], src: 'K p13', forms: [{ id: 'dr', n: 'Drops', r: 'PO', c: null }],
    reg: { po: { k: 'band', by: 'age', rows: [[12, 5, 'drops'], [36, 10, 'drops'], [999, 20, 'drops']], f: 8, dur: '5 days', forms: ['dr'], note: 'The only cough remedy allowed under 6 months.' } } });
  d('unifed', { g: 'Pseudoephedrine + triprolidine (decongestant)', b: ['Unifed DM'], cls: ['decongestant'], src: 'K p4', forms: [{ id: 's', n: 'Syrup', r: 'PO', c: null }],
    ci: { amin: 24, why: 'Not under 2 years.' },
    reg: { po: { k: 'band', by: 'age', rows: [[72, 2.5, 'mL'], [144, 5, 'mL']], f: 8, dur: '5 days', forms: ['s'] } } });
  d('salineDrops', { g: 'Normal saline nasal drops', b: ['Apisal', 'Sinus', 'Baby Nadif', 'Physiomer'], cls: ['nasal'], src: 'K p3', forms: [{ id: 'dr', n: 'Nasal drops / spray', r: 'nasal', c: null }],
    reg: { std: { k: 'fix', dose: 2, unit: 'drops in each nostril', f: 6, dur: '5 days', forms: ['dr'] } } });
  d('otrivin', { g: 'Xylometazoline nasal drops', b: ['Otrivin'], cls: ['nasal'], src: 'K p3', forms: [{ id: 'dr', n: 'Paediatric nasal drops 0.05%', r: 'nasal', c: null }],
    ci: { amin: 24, why: 'Not under 2 years.' }, reg: { std: { k: 'fix', dose: 1, unit: 'drop in each nostril', f: 8, dur: 'not more than 7 days', forms: ['dr'] } } });

  /* ---------------- Cardiovascular ---------------- */
  d('furosemide', { g: 'Furosemide', b: ['Lasix'], cls: ['diuretic'], src: 'K p30, p87; P', forms: [{ id: 'a20', n: 'Ampoule 20 mg/2 mL', r: 'IV', c: 10 }, { id: 't40', n: 'Tablet 40 mg', r: 'PO', tab: 40 }],
    reg: { hf: { k: 'kg', v: 2, f: 0, max: 40, forms: ['a20'], note: 'Measure BP first. 2 mg/kg now (1 mg/kg if hypotensive, with inotropes), then 1 mg/kg/dose twice daily.' },
      hfm: { k: 'kg', v: 1, f: 12, max: 40, forms: ['a20', 't40'] },
      aki: { k: 'kg', v: 1, f: 0, max: 40, forms: ['a20'], note: 'After fluid challenge NS 20 mL/kg over 1 hour.' },
      tx: { k: 'kg', v: 1, f: 0, max: 20, forms: ['a20'], note: 'Before and after transfusion in heart failure. NOT in sickle cell disease.' } } });
  d('spironolactone', { g: 'Spironolactone', b: ['Aldactone'], cls: ['diuretic'], src: 'K p30; P 87', forms: [{ id: 't25', n: 'Tablet 25 mg', r: 'PO', tab: 25 }],
    reg: { po: { k: 'kgd', v: 2, n: 2, max: 100, forms: ['t25'], note: '2–3 mg/kg/day ÷ 2.' } } });
  d('captopril', { g: 'Captopril', b: ['Capoten'], cls: ['acei'], src: 'K p30', forms: [{ id: 't25', n: 'Tablet 25 mg', r: 'PO', tab: 25 }],
    reg: { po: { k: 'kg', v: 0.2, f: 12, max: 25, forms: ['t25'], note: 'Refractory heart failure: start 0.2 mg/kg/dose twice–three times daily, increase to 4 mg/kg/day. Watch BP, K and creatinine.' } } });
  d('digoxin', { g: 'Digoxin', b: ['Lanoxin'], cls: ['glycoside'], src: 'P 35', forms: [{ id: 't0625', n: 'Tablet 62.5 mcg', r: 'PO', tab: 0.0625 }, { id: 't25', n: 'Tablet 250 mcg', r: 'PO', tab: 0.25 }],
    reg: { po: { k: 'kg', v: 0.004, f: 12, forms: ['t0625'], note: 'Load 15 mcg/kg, then 5 mcg/kg after 6 h; maintenance 3–5 mcg/kg 12-hourly (PCH). Check K and pulse.' } } });
  d('dopamine', { g: 'Dopamine', b: ['Dopamine'], cls: ['inotrope'], src: 'K p111, p146; P 36', forms: [{ id: 'a200', n: 'Ampoule 200 mg/5 mL (40 mg/mL)', r: 'IV', c: 40 }],
    reg: { inf: { k: 'mcg', v: 10, forms: ['a200'], note: 'Renal 2–5, cardiac 5–15 mcg/kg/min. mg in 24 h = wt × dose × 60 × 24 ÷ 1000, in 100 mL NS over 24 h (4.2 mL/h).' } } });
  d('adrenalineInf', { g: 'Adrenaline infusion', b: ['Adrenaline'], cls: ['inotrope'], src: 'K p113; PICU', forms: [{ id: 'a1', n: 'Ampoule 1 mg/mL', r: 'IV', c: 1 }],
    reg: { inf: { k: 'mcg', v: 0.1, forms: ['a1'], note: '0.05–1 mcg/kg/min (septic shock, scorpion sting with shock).' } } });
  d('hydralazine', { g: 'Hydralazine', b: ['Apresoline'], cls: ['vasodilator'], src: 'P (HTN emergency)', forms: [{ id: 'a20', n: 'Ampoule 20 mg', r: 'IV', c: 20 }],
    reg: { iv: { k: 'kg', v: 0.2, f: 4, max: 20, forms: ['a20'], note: '0.2–0.5 mg/kg slowly IV/IM, repeat hourly until controlled (PICU 0.1–0.2 mg/kg; max 20 mg/day).' } } });
  d('nifedipine', { g: 'Nifedipine', b: ['Adalat'], cls: ['ccb'], src: 'K p111; P 69', forms: [{ id: 't10', n: 'Tablet/capsule 10 mg', r: 'PO', tab: 10 }, { id: 't20', n: 'Tablet 20 mg', r: 'PO', tab: 20 }],
    reg: { po: { k: 'kg', v: 0.25, f: 12, max: 20, forms: ['t10', 't20'], note: '0.25–0.5 mg/kg/dose 8–12-hourly.' } } });

  /* ---------------- CNS ---------------- */
  d('diazepam', { g: 'Diazepam', b: ['Valium'], cls: ['benzodiazepine'], src: 'K p53, p91, p145; P 34', forms: [{ id: 'a10', n: 'Ampoule 10 mg/2 mL (5 mg/mL)', r: 'IV', c: 5 }],
    ci: { neonate: 'Not in neonatal seizures (phenobarbitone first) except tetanus neonatorum.' },
    reg: { iv: { k: 'kg', v: 0.3, f: 0, max: 10, forms: ['a10'], sc: 'wt × 6 units insulin syringe IV', note: 'Keep beside the patient; give during a convulsion. Can repeat once after 10 minutes. Watch breathing.' },
      pr: { k: 'kg', v: 0.5, f: 0, max: 10, forms: ['a10'], sc: 'wt × 10 units insulin syringe rectally', note: 'Rectal when there is no IV line (do not delay to insert a line).' },
      tetanus: { k: 'kg', v: 0.2, f: 4, forms: ['a10'], note: '0.1–0.3 mg/kg every 3–6 hours.' } } });
  d('phenobarbitone', { g: 'Phenobarbital (phenobarbitone)', b: ['Luminal', 'Gardenal'], cls: ['anticonvulsant'], src: 'K p49, p94; P 72',
    forms: [{ id: 'a200', n: 'Ampoule 200 mg/1 mL', r: 'IV', c: 200 }, { id: 't30', n: 'Tablet 30 mg', r: 'PO', tab: 30 }],
    reg: { load: { k: 'kg', v: 20, f: 0, forms: ['a200'], note: '15–20 mg/kg IV over 20 minutes (≤ 1 mg/kg/min). Still fitting: 10 mg/kg, then another 10 mg/kg (total 40 mg/kg), then phenytoin.' },
      maint: { k: 'kgd', v: 4, n: 2, forms: ['a200', 't30'], note: '3–5 mg/kg/day ÷ 12-hourly (neonatal epilepsy maintenance 5 mg/kg/day).' } } });
  d('phenytoin', { g: 'Phenytoin', b: ['Epanutin', 'Dilantin'], cls: ['anticonvulsant'], src: 'K p49; P 74', forms: [{ id: 'a250', n: 'Ampoule 250 mg/5 mL (50 mg/mL)', r: 'IV', c: 50 }, { id: 's125', n: 'Suspension 125 mg/5 mL', r: 'PO', c: 25 }],
    reg: { load: { k: 'kg', v: 18, f: 0, forms: ['a250'], note: '15–20 mg/kg in NS over 20–60 minutes (neonate ≤ 0.5 mg/kg/min; child 1–3 mg/kg/min) with ECG/pulse monitoring. Never in dextrose.' },
      maint: { k: 'kgd', v: 5, n: 2, forms: ['a250', 's125'], note: 'Neonate 5 mg/kg/day; child 6–10 mg/kg/day.' } } });
  d('midazolam', { g: 'Midazolam', b: ['Dormicum'], cls: ['benzodiazepine'], src: 'K p50; PICU', forms: [{ id: 'a15', n: 'Ampoule 15 mg/3 mL (5 mg/mL)', r: 'IV', c: 5 }],
    reg: { load: { k: 'kg', v: 0.15, f: 0, forms: ['a15'], note: '0.15–0.2 mg/kg IV (buccal/intranasal 0.3 mg/kg also used). Infusion per local protocol.' } } });
  d('pyridoxine', { g: 'Pyridoxine (vitamin B6)', b: ['Vitamin B6'], cls: ['vitamin'], src: 'K p50; P 94', forms: [{ id: 'a100', n: 'Ampoule 100 mg/2 mL', r: 'IV', c: 50 }],
    reg: { neo: { k: 'fix', dose: 100, unit: 'mg', f: 0, forms: ['a100'], note: 'Neonatal seizures not responding: 100–200 mg IV (ideally with EEG), then 50–100 mg daily.' } } });
  d('valproate', { g: 'Sodium valproate', b: ['Depakine', 'Epilim'], cls: ['anticonvulsant'], src: 'K p94', forms: [{ id: 's200', n: 'Syrup 200 mg/5 mL', r: 'PO', c: 40 }, { id: 't200', n: 'Tablet 200 mg', r: 'PO', tab: 200 }, { id: 't500', n: 'Tablet 500 mg', r: 'PO', tab: 500 }],
    ci: { liver: 'Hepatotoxic: check liver function.' },
    reg: { start: { k: 'kgd', v: 5, n: 2, dur: '1 week, then 15 mg/kg/day (maintenance), increasing up to 40 (max 60) mg/kg/day', forms: ['s200', 't200'], note: 'Broad spectrum: generalised and all seizure types.' },
      maint: { k: 'kgd', v: 15, n: 2, forms: ['s200', 't200', 't500'] } } });
  d('carbamazepine', { g: 'Carbamazepine (write the brand: Tegretol, not carbimazole)', b: ['Tegretol'], cls: ['anticonvulsant'], src: 'K p95, p151; P 90', forms: [{ id: 's100', n: 'Syrup 100 mg/5 mL', r: 'PO', c: 20 }, { id: 't200', n: 'Tablet 200 mg', r: 'PO', tab: 200 }],
    reg: { start: { k: 'kgd', v: 5, n: 2, dur: 'increase by 2.5 mg/kg every 5 days to 10–15 mg/kg/day (max 20–25)', forms: ['s100', 't200'], note: 'Focal seizures.' } } });
  d('haloperidol', { g: 'Haloperidol', b: ['Haldol'], cls: ['antipsychotic'], src: 'K p36; P 48', forms: [{ id: 't05', n: 'Tablet 0.5 mg', r: 'PO', tab: 0.5 }],
    ci: { amin: 36, why: 'Not under 3 years.' },
    reg: { chorea: { k: 'kgd', v: 0.02, n: 2, forms: ['t05'], dur: '3–4 months', note: '0.01–0.03 mg/kg/day.' } } });
  d('chlorpromazine', { g: 'Chlorpromazine', b: ['Largactil'], cls: ['antipsychotic'], src: 'K p36, p53', forms: [{ id: 'a25', n: 'Ampoule 50 mg/2 mL', r: 'IM', c: 25 }, { id: 't50', n: 'Tablet 50 mg', r: 'PO', tab: 50 }],
    reg: { chorea: { k: 'kg', v: 0.5, f: 8, forms: ['t50'], dur: '4–6 months' }, tetanus: { k: 'kg', v: 0.5, f: 6, forms: ['a25'], note: '0.5–1 mg/kg/dose 4–6-hourly.' } } });

  /* ---------------- GI ---------------- */
  d('ors', { g: 'Oral rehydration salts (low osmolarity)', b: ['ORS'], cls: ['fluid'], src: 'K p60, p65', forms: [{ id: 'sach', n: 'Sachet for 1 litre', r: 'PO', c: null }],
    reg: { loss: { k: 'band', by: 'age', rows: [[24, 75, 'mL (50–100)'], [999, 150, 'mL (100–200)']], f: -1, dur: 'after each loose stool', forms: ['sach'], note: '1 sachet in 1 litre (8½ tea glasses). 7–10 mL/kg after each stool.' } } });
  d('zinc', { g: 'Zinc sulphate', b: ['Zinc syrup', 'Zincat'], cls: ['mineral'], src: 'K p62, p65', forms: [{ id: 's20', n: 'Syrup 20 mg/5 mL', r: 'PO', c: 4 }, { id: 's10', n: 'Syrup 10 mg/5 mL', r: 'PO', c: 2 }],
    reg: { ge: { k: 'band', by: 'age', rows: [[12, 2.5, 'mL'], [999, 5, 'mL']], f: 12, dur: '10–15 days', forms: ['s20', 's10'], note: '1–2 mg/kg/day; 5 mg/kg/day in zinc deficiency or growth failure.' } } });
  d('ondansetron', { g: 'Ondansetron', b: ['Zofran'], cls: ['antiemetic'], src: 'K p66', forms: [{ id: 'a4', n: 'Ampoule 4 mg/2 mL', r: 'IV', c: 2 }, { id: 'a8', n: 'Ampoule 8 mg/4 mL', r: 'IV', c: 2 }],
    reg: { iv: { k: 'kg', v: 0.15, f: 8, max: 4, forms: ['a4'], note: 'Safest antiemetic if one is needed (0.05–0.2 mg/kg). Antiemetics are not routine in gastroenteritis.' } } });
  d('metoclopramide', { g: 'Metoclopramide', b: ['Plasil', 'Primperan'], cls: ['antiemetic'], src: 'K p66', forms: [{ id: 'a10', n: 'Ampoule 10 mg/2 mL', r: 'IV', c: 5 }],
    ci: { amin: 12, why: 'Extrapyramidal reactions (oculogyric crisis, torticollis): avoid in children.' },
    reg: { iv: { k: 'kg', v: 0.1, f: 8, max: 10, forms: ['a10'] } } });
  d('domperidone', { g: 'Domperidone', b: ['Motilat', 'Vomilux', 'Motilium'], cls: ['antiemetic'], src: 'K p66', forms: [{ id: 's1', n: 'Suspension 5 mg/5 mL', r: 'PO', c: 1 }],
    reg: { po: { k: 'kg', v: 0.25, f: 8, max: 10, forms: ['s1'], sc: 'wt/4 mL 8-hourly, ½ hour before feeds', note: 'Only in reflux when simple measures fail.' } } });
  d('omeprazole', { g: 'Omeprazole', b: ['Omez', 'Losec', 'Risek'], cls: ['ppi'], src: 'K p74–75', forms: [{ id: 'v40', n: 'Vial 40 mg', r: 'IV', c: 4, rec: '40 mg in 10 mL' }, { id: 'c20', n: 'Capsule 20 mg', r: 'PO', tab: 20 }],
    ci: { amin: 12, why: 'IV omeprazole not recommended under 1 year (guideline).' },
    reg: { iv: { k: 'kg', v: 1, f: 24, max: 40, forms: ['v40'], note: '0.5–1.5 mg/kg/dose.' },
      po: { k: 'band', by: 'wt', rows: [[20, 10, 'mg'], [999, 20, 'mg']], f: 24, forms: ['c20'], dur: 'while on aspirin / 4 weeks' },
      hp: { k: 'band', by: 'wt', rows: [[20, 10, 'mg'], [999, 20, 'mg']], f: 12, forms: ['c20'], dur: 'twice daily for 1 week, then once daily for 1 month' } } });
  d('ranitidine', { g: 'Ranitidine', b: ['Zantac'], cls: ['h2'], src: 'K p74', forms: [{ id: 'a50', n: 'Ampoule 50 mg/2 mL', r: 'IV', c: 25 }, { id: 't150', n: 'Tablet 150 mg', r: 'PO', tab: 150 }],
    reg: { iv: [{ when: { dmax: 28 }, k: 'kg', v: 1, f: 8, forms: ['a50'] }, { k: 'kg', v: 1, f: 8, max: 50, forms: ['a50'], note: 'Slow IV over 3 min diluted, or infusion 25 mg/h.' }] } });
  d('cimetidine', { g: 'Cimetidine', b: ['Tagamet'], cls: ['h2'], src: 'K p73', forms: [{ id: 'a200', n: 'Ampoule 200 mg/2 mL', r: 'IV', c: 100 }],
    reg: { iv: [{ when: { dmax: 28 }, k: 'kgd', v: 7.5, n: 2, forms: ['a200'] }, { k: 'kgd', v: 30, n: 3, max: 200, forms: ['a200'], note: '20–40 mg/kg/day ÷ 8-hourly, in the last 100 mL of the drip. Max one ampoule per dose.' }] } });
  d('lactulose', { g: 'Lactulose', b: ['Duphalac'], cls: ['laxative'], src: 'K p131', forms: [{ id: 's', n: 'Syrup 3.3 g/5 mL', r: 'PO', c: 670 }],
    reg: { po: { k: 'band', by: 'age', rows: [[12, 2.5, 'mL'], [60, 5, 'mL'], [999, 10, 'mL']], f: 8, forms: ['s'], note: '0.5–1 mL/kg/day.' } } });
  d('simethicone', { g: 'Simethicone', b: ['Deflate', 'Infacol'], cls: ['antiflatulent'], src: 'K p78', forms: [{ id: 'dr', n: 'Drops 40 mg/mL', r: 'PO', c: 40 }],
    reg: { po: { k: 'band', by: 'age', rows: [[24, 10, 'drops (0.5 mL)'], [999, 20, 'drops (1 mL)']], f: -1, dur: 'after each feed and at bedtime', forms: ['dr'] } } });
  d('prifinium', { g: 'Prifinium bromide', b: ['Riabal'], cls: ['antispasmodic'], src: 'K p72', forms: [{ id: 's', n: 'Syrup', r: 'PO', c: null }],
    reg: { po: { k: 'band', by: 'age', rows: [[3, 1, 'mL'], [6, 1.5, 'mL'], [12, 2, 'mL'], [24, 5, 'mL'], [72, 7.5, 'mL']], f: 8, forms: ['s'] } } });
  d('hyoscine', { g: 'Hyoscine butylbromide', b: ['Buscopan'], cls: ['antispasmodic'], src: 'K p72', forms: [{ id: 'a20', n: 'Ampoule 20 mg/1 mL', r: 'IV', c: 20 }],
    ci: { amin: 72, why: 'Over 6 years in the guideline.' },
    reg: { iv: { k: 'kg', v: 0.5, f: 8, max: 20, forms: ['a20'], note: 'Guideline prints 0.01 mg/kg and "½–1 mL by age and severity"; BNF 0.5 mg/kg.' } } });
  d('mebendazole', { g: 'Mebendazole', b: ['Vermox'], cls: ['anthelmintic'], src: 'K p80–81', forms: [{ id: 's100', n: 'Suspension 100 mg/5 mL', r: 'PO', c: 20 }, { id: 't100', n: 'Tablet 100 mg', r: 'PO', tab: 100 }],
    ci: { amin: 12, why: 'Over 1 year.' },
    reg: { po: { k: 'fix', dose: 100, unit: 'mg', f: 12, dur: '3 days, repeat after 2 weeks (treat the whole family)', forms: ['s100', 't100'] } } });
  d('praziquantel', { g: 'Praziquantel', b: ['Biltricide', 'Distocide'], cls: ['anthelmintic'], src: 'K p63; P 76', forms: [{ id: 't600', n: 'Tablet 600 mg', r: 'PO', tab: 600 }],
    reg: { schisto: { k: 'kg', v: 40, f: 0, forms: ['t600'], note: 'Single dose.' }, tapeworm: { k: 'kg', v: 25, f: 0, forms: ['t600'], note: 'H. nana and Taenia: single dose.' } } });
  d('nystatin', { g: 'Nystatin oral suspension', b: ['Mycostatin'], cls: ['antifungal'], src: 'K p70', forms: [{ id: 'dr', n: 'Oral drops 100,000 IU/mL', r: 'PO', c: null }],
    reg: { std: { k: 'fix', dose: 1, unit: 'mL in the mouth', f: 8, dur: '7–10 days', forms: ['dr'] } } });
  d('miconazoleGel', { g: 'Miconazole oral gel', b: ['Mycoheal', 'Daktarin'], cls: ['antifungal'], src: 'K p70', forms: [{ id: 'gel', n: 'Oral gel 2%', r: 'topical', c: null }],
    reg: { std: { k: 'fix', dose: 1, unit: 'application to the mouth', f: 8, dur: '7–10 days', forms: ['gel'], note: 'Best for oral thrush. Treat the mother\'s nipples too.' } } });
  d('gentianViolet', { g: 'Gentian violet 0.5% paint', b: ['Gentian violet'], cls: ['antiseptic'], src: 'K p70', forms: [{ id: 'paint', n: 'Paint', r: 'topical', c: null }],
    reg: { std: { k: 'fix', dose: 1, unit: 'paint to the mouth', f: 8, dur: '5 days', forms: ['paint'] } } });

  /* ---------------- Blood, nutrition, electrolytes ---------------- */
  d('saferon', { g: 'Iron (ferrous) syrup', b: ['Saferon', 'Feroglobin', 'Hematin', 'Ferbin'], cls: ['iron'], src: 'K p127, p148', forms: [{ id: 's50', n: 'Syrup 50 mg/5 mL (elemental iron)', r: 'PO', c: 10 }],
    ci: { sam: 'No iron in the initial phase of severe acute malnutrition.' },
    reg: { tx: { k: 'kgd', v: 6, n: 2, max: 200, dur: '3 months', forms: ['s50'], sc: 'wt × 0.6 mL/day ÷ twice daily' } } });
  d('folic', { g: 'Folic acid', b: ['Folic acid'], cls: ['vitamin'], src: 'K p127; P 44', forms: [{ id: 't5', n: 'Tablet 5 mg', r: 'PO', tab: 5 }],
    reg: { po: { k: 'band', by: 'age', rows: [[18, 2.5, 'mg'], [999, 5, 'mg']], f: 24, forms: ['t5'] } } });
  d('vitK', { g: 'Phytomenadione (vitamin K1)', b: ['Konakion'], cls: ['vitamin'], src: 'K p39, p51; P 95', forms: [{ id: 'a10', n: 'Ampoule 10 mg/1 mL', r: 'IM', c: 10 }],
    reg: { proph: { k: 'fix', dose: 1, unit: 'mg', f: 0, forms: ['a10'], sc: '10 units on an insulin syringe IM', note: 'Every newborn once.' },
      hdn: { k: 'fix', dose: 5, unit: 'mg', f: 24, dur: '3–5 days', forms: ['a10'], note: 'IV slowly (regardless of weight) in haemorrhagic disease of the newborn.' } } });
  d('vitA', { g: 'Vitamin A', b: ['Vitamin A capsule'], cls: ['vitamin'], src: 'K p118, p132', forms: [{ id: 'cap', n: 'Capsule 100,000 / 200,000 IU', r: 'PO', c: null }],
    reg: { measles: { k: 'band', by: 'age', rows: [[6, 50000, 'IU'], [12, 100000, 'IU'], [999, 200000, 'IU']], f: 0, dur: 'on day 1, day 2 and day 14', forms: ['cap'] } } });
  d('cagluc', { g: 'Calcium gluconate 10%', b: ['Calcium gluconate'], cls: ['electrolyte'], src: 'K p98, p146; P 21', forms: [{ id: 'a10', n: 'Ampoule 10% 10 mL (0.22 mmol/mL)', r: 'IV', c: 100 }],
    reg: { load: { k: 'mlkg', v: 2, f: 0, max: 20, forms: ['a10'], note: 'Dilute 1:4 in D5 and give over 30 minutes with pulse monitoring (fast → bradycardia, cardiac arrest).' },
      maint: { k: 'mlkg', v: 4, f: 24, forms: ['a10'], note: '4 mL/kg/day (1 mmol/kg/day) in the maintenance fluid or ÷ 8-hourly diluted.' } } });
  d('kcl', { g: 'Potassium chloride 15%', b: ['KCl'], cls: ['electrolyte'], src: 'K p78–79', forms: [{ id: 'a20', n: 'Ampoule 20 mmol/10 mL (2 mmol/mL)', r: 'IV', c: null }],
    reg: { std: { k: 'fix', dose: 0, unit: 'see potassium calculator', f: 0, forms: ['a20'], note: 'Never undiluted or as a bolus. Max 0.4 mmol/kg/h. Only after the child passes urine.' } } });
  d('dextrose10', { g: 'Dextrose 10%', b: ['D10'], cls: ['fluid'], src: 'K p97, p112', forms: [{ id: 'b', n: 'Bag 500 mL', r: 'IV', c: 100 }],
    reg: { bolus: { k: 'mlkg', v: 2, f: 0, forms: ['b'], note: '2–5 mL/kg IV; recheck RBG after 1–2 hours. Malnourished: 5 mL/kg IV (or 50 mL orally if conscious).' }, sam: { k: 'mlkg', v: 5, f: 0, forms: ['b'] } } });
  d('insulinReg', { g: 'Insulin regular (soluble)', b: ['Actrapid', 'Humulin R'], cls: ['insulin'], src: 'K p120–123', forms: [{ id: 'v', n: 'Vial 100 units/mL', r: 'IV', c: null }],
    reg: { dka: { k: 'ukg', v: 0.1, f: 1, forms: ['v'], note: 'Infusion 100 units in 100 mL NS (1 unit/mL) at 0.1 mL/kg/h; or no pump: 0.3 U/kg SC then 0.1 U/kg SC hourly. Never stop until acidosis clears.' } } });
  d('ivig', { g: 'Immunoglobulin (IVIG)', b: ['IVIG'], cls: ['immunoglobulin'], src: 'K p47', forms: [{ id: 'v', n: 'Vial', r: 'IV', c: null }],
    reg: { jaundice: { k: 'kg', v: 500, f: 0, forms: ['v'], note: '0.5–1 g/kg in Rh/ABO isoimmunisation (reduces exchange transfusion).' } } });
  d('antiscorpion', { g: 'Scorpion antivenom', b: ['Antiscorpion serum'], cls: ['antivenom'], src: 'K p110', forms: [{ id: 'v', n: 'Vial', r: 'IV', c: null }],
    reg: { local: { k: 'fix', dose: 2, unit: 'vials (1–2)', f: 0, forms: ['v'], note: 'Local pain or paraesthesia only.' },
      systemic: { k: 'fix', dose: 5, unit: 'vials in 100 mL NS over 30 minutes', f: 0, forms: ['v'], note: 'Local pain plus cranial, autonomic or somatic neuromuscular signs.' } } });
  d('tig', { g: 'Tetanus immunoglobulin (human)', b: ['Tetagam'], cls: ['immunoglobulin'], src: 'K p53; P 92', forms: [{ id: 'v', n: 'Vial 250/500 IU', r: 'IM', c: null }],
    reg: { neo: { k: 'fix', dose: 500, unit: 'IU IM (3000–6000 IU recommended)', f: 0, forms: ['v'] } } });

  /* ---------------- Eye and skin ---------------- */
  d('chloramphenicolEye', { g: 'Chloramphenicol 0.5% eye drops', b: ['Chloramphenicol eye drops'], cls: ['eye'], src: 'K p140', forms: [{ id: 'dr', n: 'Eye drops', r: 'eye', c: null }],
    reg: { std: { k: 'fix', dose: 1, unit: 'drop in each eye', f: 8, dur: '5–7 days', forms: ['dr'] } } });
  d('gentamicinEye', { g: 'Gentamicin eye drops', b: ['Gentamicin eye drops', 'Gentadex'], cls: ['eye'], src: 'K p118, p140', forms: [{ id: 'dr', n: 'Eye/ear drops', r: 'eye', c: null }],
    reg: { std: { k: 'fix', dose: 1, unit: 'drop', f: 6, dur: '5–7 days', forms: ['dr'] } } });
  d('tobramycinEye', { g: 'Tobramycin eye drops', b: ['Tobrex'], cls: ['eye'], src: 'K p140', forms: [{ id: 'dr', n: 'Eye drops', r: 'eye', c: null }], reg: { std: { k: 'fix', dose: 1, unit: 'drop in each eye', f: 6, dur: '7 days', forms: ['dr'] } } });
  d('tetracyclineEye', { g: 'Tetracycline 1% eye ointment', b: ['Tetracycline eye ointment'], cls: ['eye'], src: 'K p140', forms: [{ id: 'oint', n: 'Eye ointment', r: 'eye', c: null }], reg: { std: { k: 'fix', dose: 1, unit: 'application to each eye', f: 12, dur: '2 weeks (chlamydia: as in guideline)', forms: ['oint'] } } });
  d('ciprofloxacinEye', { g: 'Ciprofloxacin eye drops', b: ['Apiflox', 'Ciloxan'], cls: ['eye'], src: 'K p140', forms: [{ id: 'dr', n: 'Eye drops', r: 'eye', c: null }], reg: { std: { k: 'fix', dose: 1, unit: 'drop in each eye', f: 6, dur: '7 days', forms: ['dr'] } } });
  d('zincOxide', { g: 'Zinc oxide cream', b: ['Zinc oxide'], cls: ['skin'], src: 'K p149', forms: [{ id: 'cr', n: 'Cream', r: 'topical', c: null }], reg: { std: { k: 'fix', dose: 1, unit: 'application', f: 12, dur: 'until healed', forms: ['cr'] } } });
  d('clotrimazole', { g: 'Clotrimazole 1% cream', b: ['Candid'], cls: ['antifungal'], src: 'K p149', forms: [{ id: 'cr', n: 'Cream', r: 'topical', c: null }], reg: { std: { k: 'fix', dose: 1, unit: 'application', f: 12, dur: '2 weeks', forms: ['cr'] } } });
  d('betamethasoneCr', { g: 'Betamethasone cream', b: ['Betha', 'Betnovate'], cls: ['steroid'], src: 'K p80', forms: [{ id: 'cr', n: 'Cream', r: 'topical', c: null }], reg: { std: { k: 'fix', dose: 1, unit: 'thin application', f: 12, dur: '5 days', forms: ['cr'] } } });

  window.HO_DRUGS = D;
})();
