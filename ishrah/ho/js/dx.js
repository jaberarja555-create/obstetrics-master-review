/* HO Guide — paediatric conditions from the Kassala guideline 2024 (K pages) and the PCH table.
   sx: symptom/sign id → weight (3 key feature, 2 typical, 1 supportive) for "diagnosis from symptoms".
   variants: the management plan by setting/severity; lines: first line, alternatives, adjuncts; items: {d: drug id, r: regimen key} or {txt}.
   fluid: a fluid plan computed by the engine (maint, maint23, planA/B/C, shock, resomal, neo, dka, hyperNa, scd, restrict, transfuse). */
(function () {
  'use strict';
  /* symptom and sign vocabulary (group, id, English, Arabic) */
  var S = [
    ['General', 'fever', 'Fever', 'حمى'], ['General', 'poorfeed', 'Poor feeding / refusing feeds', 'رفض الرضاعة أو الأكل'], ['General', 'lethargy', 'Lethargy or unconscious', 'خمول أو غيبوبة'],
    ['General', 'irritable', 'Irritability / excessive crying', 'تهيج أو بكاء كثير'], ['General', 'pallor', 'Pallor', 'شحوب'], ['General', 'jaundice', 'Jaundice', 'صفار'],
    ['General', 'wtloss', 'Weight loss / wasting', 'نقص وزن أو هزال'], ['General', 'oedema', 'Oedema', 'تورم'], ['General', 'bleeding', 'Bleeding', 'نزيف'], ['General', 'cyanosis', 'Cyanosis', 'زرقة'],
    ['General', 'shock', 'Cold extremities / weak pulse (shock)', 'برودة الأطراف ونبض ضعيف'], ['General', 'sweating', 'Sweating', 'تعرق'],
    ['Respiratory', 'cough', 'Cough', 'كحة'], ['Respiratory', 'sob', 'Fast breathing / chest indrawing', 'سرعة تنفس أو انسحاب الصدر'], ['Respiratory', 'wheeze', 'Wheeze', 'صفير'],
    ['Respiratory', 'stridor', 'Stridor / barking cough', 'صرير أو كحة نباحية'], ['Respiratory', 'coryza', 'Runny or blocked nose', 'رشح أو انسداد الأنف'], ['Respiratory', 'whoop', 'Paroxysmal cough with vomiting or apnoea', 'نوبات كحة مع ترجيع'],
    ['Respiratory', 'crackles', 'Crackles', 'خرخرة'], ['Respiratory', 'nightcough', 'Night / early-morning cough, recurrent', 'كحة ليلية متكررة'],
    ['ENT and mouth', 'sorethroat', 'Sore throat / dysphagia', 'ألم الحلق أو صعوبة البلع'], ['ENT and mouth', 'tonsils', 'Red enlarged tonsils', 'لوزتين ملتهبتين'], ['ENT and mouth', 'earpain', 'Ear pain / pulling the ear', 'ألم الأذن'],
    ['ENT and mouth', 'eardisch', 'Ear discharge', 'إفرازات الأذن'], ['ENT and mouth', 'snoring', 'Snoring / mouth breathing', 'شخير أو تنفس من الفم'], ['ENT and mouth', 'whitetongue', 'White coating of the tongue', 'لسان أبيض'],
    ['ENT and mouth', 'mouthulcer', 'Mouth ulcers / bleeding gums', 'تقرحات الفم'], ['ENT and mouth', 'parotid', 'Parotid swelling (lifts the ear lobe)', 'تورم الغدة النكفية'], ['ENT and mouth', 'neckmass', 'Tender neck lump', 'تورم مؤلم في الرقبة'],
    ['ENT and mouth', 'behindear', 'Swelling behind the ear', 'تورم خلف الأذن'], ['ENT and mouth', 'headache', 'Headache / facial pain', 'صداع'],
    ['Gut', 'diarrhoea', 'Diarrhoea', 'إسهال'], ['Gut', 'vomiting', 'Vomiting', 'ترجيع'], ['Gut', 'blood_stool', 'Blood or mucus in stool', 'دم أو مخاط في البراز'], ['Gut', 'ricewater', 'Profuse rice-water stool', 'إسهال مائي غزير'],
    ['Gut', 'abdpain', 'Abdominal pain', 'ألم البطن'], ['Gut', 'epigastric', 'Epigastric pain', 'ألم أعلى البطن'], ['Gut', 'distension', 'Abdominal distension', 'انتفاخ البطن'],
    ['Gut', 'constip', 'Constipation', 'إمساك'], ['Gut', 'worms', 'Worms in the stool', 'ديدان في البراز'], ['Gut', 'analitch', 'Anal itching at night', 'حكة شرجية ليلية'],
    ['Gut', 'darkurine', 'Dark urine', 'بول داكن'], ['Gut', 'palestool', 'Pale stool', 'براز فاتح'], ['Gut', 'sunken', 'Sunken eyes / slow skin pinch', 'عيون غائرة'], ['Gut', 'hepatomeg', 'Enlarged liver', 'تضخم الكبد'],
    ['Gut', 'spleno', 'Enlarged spleen', 'تضخم الطحال'],
    ['Nervous system', 'convulsion', 'Convulsion', 'تشنج'], ['Nervous system', 'neckstiff', 'Neck stiffness / bulging fontanelle', 'تيبس الرقبة أو انتفاخ اليافوخ'],
    ['Nervous system', 'chorea', 'Abnormal jerky movements', 'حركات لا إرادية'], ['Nervous system', 'headtilt', 'Head tilted / cannot turn the neck', 'ميلان الرأس'], ['Nervous system', 'weakness', 'Limb weakness', 'ضعف طرف'],
    ['Urinary and kidney', 'dysuria', 'Crying on passing urine / burning', 'حرقان البول'], ['Urinary and kidney', 'haematuria', 'Red / cola-coloured urine', 'بول أحمر'],
    ['Urinary and kidney', 'oliguria', 'Little or no urine', 'قلة البول'], ['Urinary and kidney', 'periorbital', 'Puffy eyelids / facial swelling', 'تورم الجفون'], ['Urinary and kidney', 'polyuria', 'Polyuria and thirst', 'كثرة التبول والعطش'],
    ['Urinary and kidney', 'hypert', 'High blood pressure', 'ارتفاع الضغط'], ['Urinary and kidney', 'loinpain', 'Loin / suprapubic pain', 'ألم الخاصرة'],
    ['Skin, eyes and joints', 'rash', 'Rash', 'طفح جلدي'], ['Skin, eyes and joints', 'itch', 'Itching / urticaria', 'حكة'], ['Skin, eyes and joints', 'redeye', 'Red eyes', 'احمرار العين'],
    ['Skin, eyes and joints', 'eyedisch', 'Eye discharge', 'إفرازات العين'], ['Skin, eyes and joints', 'jointpain', 'Joint pain', 'ألم المفاصل'], ['Skin, eyes and joints', 'jointswell', 'Hot swollen joint', 'تورم المفصل'],
    ['Skin, eyes and joints', 'limbswell', 'Hot tender limb swelling', 'تورم ساخن في الطرف'], ['Skin, eyes and joints', 'dactylitis', 'Hand–foot swelling', 'تورم اليدين والقدمين'], ['Skin, eyes and joints', 'nappy', 'Nappy-area rash', 'التهاب الحفاضة'],
    ['Skin, eyes and joints', 'tongueswell', 'Tongue or lip swelling', 'تورم اللسان أو الشفاه'],
    ['Heart and blood', 'chestpain', 'Chest pain', 'ألم الصدر'], ['Heart and blood', 'murmur', 'Murmur', 'لغط قلبي'], ['Heart and blood', 'feeddysp', 'Breathless on feeding / sweating', 'ضيق نفس مع الرضاعة'], ['Heart and blood', 'tachy', 'Tachycardia out of proportion', 'سرعة نبض'],
    ['Heart and blood', 'pica', 'Pica (eats soil)', 'أكل التراب'], ['Heart and blood', 'tonsilhx', 'Past recurrent tonsillitis', 'التهاب لوزتين متكرر سابقاً'], ['Heart and blood', 'sicklehx', 'Known sickle cell disease', 'أنيميا منجلية معروفة'],
    ['Newborn', 'umbilical', 'Umbilical discharge / redness', 'إفرازات السرة'], ['Newborn', 'apnoea', 'Apnoea', 'توقف التنفس'], ['Newborn', 'grunting', 'Grunting / distress at birth', 'أنين أو ضيق تنفس بعد الولادة'],
    ['Newborn', 'nocry', 'Did not cry at birth', 'لم يبكِ عند الولادة'], ['Newborn', 'lockjaw', 'Lockjaw / spasms (home delivery)', 'تيبس الفك'], ['Newborn', 'bilvomit', 'Bilious vomiting / blood in stool (preterm)', 'ترجيع أخضر'],
    ['Exposure', 'sting', 'Scorpion sting', 'لدغة عقرب'], ['Exposure', 'ingest', 'Drug ingestion', 'بلع دواء'], ['Exposure', 'kerosene', 'Kerosene ingestion', 'شرب جاز'], ['Exposure', 'hairdye', 'Hair dye (PPD) ingestion', 'شرب صبغة الشعر'],
    ['Exposure', 'drown', 'Drowning', 'غرق'], ['Exposure', 'electric', 'Electric shock', 'صعقة كهربائية'], ['Exposure', 'allergen', 'Food/drug/insect exposure', 'تعرض لمادة مسببة للحساسية'], ['Exposure', 'contactTB', 'TB contact / night sweats', 'مخالطة سل أو تعرق ليلي']
  ];

  var X = [];
  function c(o) { X.push(o); }
  var ADM_DANGER = ['General danger signs: unable to drink or breastfeed, vomits everything, convulsions, lethargic or unconscious'];

  /* ===================== Respiratory and ENT ===================== */
  c({ id: 'cold', sys: 'resp', t: 'Common cold', ar: 'نزلة برد', src: 'K p4', sx: { coryza: 3, fever: 1, cough: 1 },
    about: 'Viral upper respiratory infection: runny nose ± fever; examination normal.', inv: ['BFFM (malaria)', 'CBC if febrile (TWBC normal or lymphocytes)'],
    variants: [{ id: 'op', t: 'Outpatient', lines: [
      { t: 'Treatment', items: [{ d: 'paracetamol', r: 'prn' }, { d: 'salineDrops', r: 'std' }, { d: 'unifed', r: 'po', note: 'over 2 years' }, { d: 'cetirizine', r: 'po', note: 'if allergic rhinitis, over 2 years' }] },
      { t: 'Antibiotic only if yellow/foul discharge (treat as sinusitis)', items: [{ d: 'ampiclox', r: 'po' }] }],
      extra: ['Warm drinks (karkadi, lemon, honey over 1 year).'] }],
    comp: ['Sinusitis', 'Otitis media', 'Pneumonia'] });
  c({ id: 'sinusitis', sys: 'resp', t: 'Sinusitis', ar: 'التهاب الجيوب الأنفية', src: 'K p1–3', sx: { headache: 3, coryza: 2, fever: 2 },
    about: 'Fever, headache, nasal block or discharge; examination usually normal.', inv: ['BFFM', 'CBC (TWBC guides antibiotic strength)'],
    variants: [{ id: 'op', t: 'Outpatient', lines: [
      { t: 'First line (choose by severity: simple → potent)', items: [{ d: 'ampiclox', r: 'po' }, { d: 'cephalexin', r: 'po' }, { d: 'erythromycin', r: 'po' }] },
      { t: 'Potent options (high TWBC, diarrhoea, not improving)', items: [{ d: 'azithromycin', r: 'po' }, { d: 'cefixime', r: 'po' }, { d: 'amoclan', r: 'po' }] },
      { t: 'Symptomatic', items: [{ d: 'paracetamol', r: 'prn' }, { d: 'salineDrops', r: 'std' }, { d: 'otrivin', r: 'std', note: 'over 2 years, ≤ 7 days' }] }] }],
    traps: ['Ampiclox and erythromycin cause diarrhoea: in a child with diarrhoea choose azithromycin or cefixime.'] });
  c({ id: 'tonsillitis', sys: 'resp', t: 'Acute tonsillitis', ar: 'التهاب اللوزتين', src: 'K p5–7', sx: { sorethroat: 3, tonsils: 3, fever: 2, abdpain: 1, poorfeed: 1 },
    about: 'Fever and sore throat ± abdominal pain (mesenteric adenitis); red enlarged tonsils ± follicles. Examine throat and ears in every febrile child.', inv: ['BFFM', 'CBC'],
    variants: [
      { id: 'op', t: 'Outpatient', lines: [
        { t: 'Ideal: penicillin for 10 days', items: [{ d: 'penv', r: 'tonsil' }, { d: 'benzathine', r: 'rf', note: 'single dose alternative' }] },
        { t: 'Alternatives', items: [{ d: 'amoclan', r: 'po' }, { d: 'azithromycin', r: 'po' }, { d: 'clarithromycin', r: 'po' }, { d: 'erythromycin', r: 'po' }] },
        { t: 'Adjuncts', items: [{ d: 'paracetamol', r: 'prn', note: 'antipyretic is the most important (convulsion risk)' }, { d: 'metronidazole', r: 'po', note: 'if follicular' }] }] },
      { id: 'adm', t: 'Admitted', when: 'Refuses feeds, vomits everything, febrile convulsion', lines: [
        { t: 'Treatment', items: [{ d: 'benzylpen', r: 'std' }, { d: 'paracetamol', r: 'iv' }, { d: 'metronidazole', r: 'iv', note: 'if follicular' }] }], fluid: { k: 'maint' } }],
    admit: ['Refusing feeds', 'Vomiting everything', 'Febrile convulsion'], comp: ['Peritonsillar abscess', 'Rheumatic fever', 'Post-streptococcal glomerulonephritis', 'Scarlet fever'],
    extra: ['Recurrent tonsillitis (> 4 a year): advise tonsillectomy (prevents rheumatic fever and glomerulonephritis).'] });
  c({ id: 'scarlet', sys: 'resp', t: 'Scarlet fever', ar: 'الحمى القرمزية', src: 'K p7', sx: { sorethroat: 2, tonsils: 2, rash: 3, fever: 2 },
    about: 'Fever + tonsillitis + sandpaper rash + strawberry tongue.', inv: ['CBC', 'ASO titre'],
    variants: [{ id: 'op', t: 'Treatment', lines: [{ t: 'First line', items: [{ d: 'procainepen', r: 'std' }, { d: 'paracetamol', r: 'prn' }] }, { t: 'Penicillin allergy', items: [{ d: 'erythromycin', r: 'po', note: 'for 10 days' }] }] }] });
  c({ id: 'otitis', sys: 'resp', t: 'Otitis media', ar: 'التهاب الأذن الوسطى', src: 'K p8–9', sx: { earpain: 3, eardisch: 2, fever: 2, irritable: 2 },
    about: 'Acute: fever, ear pain, irritability, pulls ear. Chronic: discharge without pain (mastoiditis, deafness).', inv: ['BFFM', 'CBC'],
    variants: [
      { id: 'op', t: 'Outpatient', lines: [
        { t: 'Antibiotic', items: [{ d: 'ampiclox', r: 'po' }, { d: 'azithromycin', r: 'po' }, { d: 'amoclan', r: 'po' }, { d: 'cefaclor', r: 'po' }, { d: 'clarithromycin', r: 'po' }, { d: 'erythromycin', r: 'po' }] },
        { t: 'Adjuncts', items: [{ d: 'paracetamol', r: 'prn' }, { d: 'gentamicinEye', r: 'std', note: 'Gentadex/gentamicin ear drops 6-hourly for 3 days if discharging' }] }] },
      { id: 'adm', t: 'Admitted', when: 'Danger signs or suspected meningitis', lines: [{ t: 'Treatment', items: [{ d: 'cefuroxime', r: 'iv' }, { d: 'paracetamol', r: 'iv' }] }] }],
    comp: ['Mastoiditis', 'Meningitis', 'Deafness'], extra: ['Complications → ENT.'] });
  c({ id: 'mastoiditis', sys: 'resp', t: 'Mastoiditis', ar: 'التهاب عظمة الخشاء', src: 'K p9', sx: { behindear: 3, fever: 2, eardisch: 2, earpain: 1 },
    about: 'Untreated otitis media: high fever, tender swelling behind the ear.', inv: ['CBC', 'CT if available'],
    variants: [{ id: 'adm', t: 'Admitted', lines: [{ t: 'Treatment', items: [{ d: 'cefuroxime', r: 'iv' }, { d: 'ceftriaxone', r: 'std', note: 'alternative' }, { d: 'metronidazole', r: 'iv' }, { d: 'paracetamol', r: 'iv' }] }], extra: ['ENT referral: surgery may be needed.'] }] });
  c({ id: 'adenoid', sys: 'resp', t: 'Adenoid hypertrophy', ar: 'تضخم اللحمية', src: 'K p10', sx: { snoring: 3, coryza: 1 },
    about: 'Snoring, mouth breathing, apnoea, recurrent infections; late cor pulmonale.', inv: ['Lateral neck X-ray (may be needed)'],
    variants: [{ id: 'op', t: 'Management', lines: [{ t: 'Treatment', items: [{ txt: 'Most resolve with age; treat infections; adenoidectomy for obstructive sleep apnoea.' }] }] }] });
  c({ id: 'croup', sys: 'resp', t: 'Croup (laryngotracheobronchitis)', ar: 'الخانوق', src: 'K p10–12', amin: 3, amax: 72, sx: { stridor: 3, cough: 1, coryza: 1, fever: 1, sob: 1 },
    about: 'Barking cough, hoarse voice, stridor. Spasmodic croup: night attacks, no coryza, atopy — same treatment.', inv: ['Clinical; CBC; neck X-ray not routine'],
    variants: [
      { id: 'er', t: 'Emergency room', lines: [
        { t: 'Treatment', items: [{ d: 'dexamethasone', r: 'croup' }, { d: 'adrenalineNeb', r: 'neb' }, { d: 'saline3', r: 'neb', note: 'normal saline 3 mL every 20 min for 1 h if no adrenaline' }, { d: 'budesonideNeb', r: 'neb', note: 'may replace dexamethasone' }] }],
        extra: ['Observe 2–3 hours (adrenaline rebound), then discharge if settled.'] },
      { id: 'home', t: 'Discharge', lines: [{ t: 'Home', items: [{ d: 'orazone', r: 'croup' }, { d: 'paracetamol', r: 'prn' }] }] },
      { id: 'adm', t: 'Admitted', when: 'Distressed or not improving', lines: [
        { t: 'Treatment', items: [{ txt: 'Oxygen' }, { d: 'adrenalineNeb', r: 'neb', note: '2-hourly' }, { d: 'dexamethasone', r: 'croupRep' }, { d: 'benzylpen', r: 'std', note: '± if bacterial infection' }] }], fluid: { k: 'maint23' } }],
    ddx: ['Epiglottitis (toxic, drooling, muffled voice)', 'Retropharyngeal abscess', 'Foreign body (sudden choking, unilateral reduced air entry)', 'Angioneurotic oedema (hair dye)', 'Diphtheria (bull neck)'] });
  c({ id: 'pneumonia', sys: 'resp', t: 'Pneumonia', ar: 'الالتهاب الرئوي', src: 'K p13–16', sx: { cough: 3, fever: 2, sob: 2, crackles: 2 },
    about: 'Fever and cough ± fast breathing; crackles and/or wheeze.', inv: ['BFFM', 'CBC (neutrophilia)', 'Chest X-ray if severe or not resolving', 'ESR, CXR, sputum AFB if TB is suspected'],
    variants: [
      { id: 'op', t: 'Outpatient pneumonia', lines: [
        { t: 'Antibiotic', items: [{ d: 'ampiclox', r: 'po' }, { d: 'amoclan', r: 'po' }, { d: 'azithromycin', r: 'po' }, { d: 'clarithromycin', r: 'po' }, { d: 'cefaclor', r: 'po' }, { d: 'cefuroximePO', r: 'po' }] },
        { t: 'Adjuncts', items: [{ d: 'paracetamol', r: 'prn' }, { d: 'mucolytic', r: 'po', note: 'over 6 months' }, { d: 'miniguava', r: 'po', note: 'under 6 months' }] }] },
      { id: 'sev', t: 'Severe pneumonia (admitted)', when: 'Distress, SpO2 < 90%, danger signs, toxic', lines: [
        { t: 'Under 1 year (Sudan protocol)', items: [{ d: 'ampicillin', r: 'std' }, { d: 'gentamicin', r: 'std' }, { d: 'cefotaxime', r: 'std', note: 'add in severe disease' }] },
        { t: 'Over 1 year', items: [{ d: 'benzylpen', r: 'std' }, { d: 'ceftriaxone', r: 'std', note: 'or' }, { d: 'cefuroxime', r: 'iv', note: 'high TWBC or not improving' }, { d: 'amoclan', r: 'iv', note: 'or' }] },
        { t: 'Supportive', items: [{ txt: 'Oxygen to keep SpO2 ≥ 92%' }, { d: 'paracetamol', r: 'iv' }] }], fluid: { k: 'maint23', why: 'Never full maintenance in a distressed child (risk of SIADH).' } }],
    admit: ['Severe distress', 'SpO2 < 90%', 'General danger signs', 'Toxic or not improving on oral antibiotics', 'Work-up (TB)'],
    comp: ['Empyema / effusion', 'Lung abscess', 'Respiratory failure', 'Heart failure'], traps: ['High TWBC alone in a stable child is not an indication for admission: use a potent oral antibiotic.'] });
  c({ id: 'bpwheeze', sys: 'resp', t: 'Bronchopneumonia with bronchospasm', ar: 'التهاب رئوي مع ضيق الشعب', src: 'K p17–18', sx: { cough: 2, fever: 2, sob: 2, wheeze: 3, crackles: 2 },
    about: 'Severe bronchopneumonia with wheeze.', inv: ['BFFM', 'CBC', 'Chest X-ray'],
    variants: [{ id: 'adm', t: 'Admitted', lines: [
      { t: 'Antibiotic (as severe pneumonia)', items: [{ d: 'ceftriaxone', r: 'std' }, { d: 'benzylpen', r: 'std', note: 'not in known asthmatics' }] },
      { t: 'Bronchodilator', items: [{ d: 'salbutamolNeb', r: 'neb' }, { d: 'ipratropium', r: 'neb' }, { txt: 'Oxygen' }, { d: 'paracetamol', r: 'pr' }] }], fluid: { k: 'maint23' } }] });
  c({ id: 'bronchiolitis', sys: 'resp', t: 'Bronchiolitis', ar: 'التهاب القصيبات', src: 'K p19–20', amax: 24, sx: { cough: 2, sob: 3, wheeze: 3, coryza: 2, crackles: 1 },
    about: 'Infant (6 months–2 years): cough and breathlessness, little fever, looks well ("happy wheezer").', inv: ['BFFM', 'CBC (normal or lymphocytes)', 'Chest X-ray: hyperinflation'],
    variants: [
      { id: 'er', t: 'Emergency room', lines: [{ t: 'Three nebuliser sessions, then reassess', items: [{ d: 'saline3', r: 'neb', note: 'first choice' }, { d: 'adrenalineNeb', r: 'neb', note: 'if no response to saline' }, { d: 'ipratropium', r: 'neb' }, { d: 'salbutamolNeb', r: 'neb', note: 'trial only if family history of asthma' }] }],
        extra: ['Improved: home on mucolytic (Prospan) ± oral antibiotic only if bacterial infection is suspected.'] },
      { id: 'adm', t: 'Admitted', when: 'Severe distress or no improvement after 3 sessions', lines: [{ t: 'Treatment', items: [{ txt: 'Oxygen' }, { d: 'saline3', r: 'neb', note: '2-hourly' }, { d: 'adrenalineNeb', r: 'neb' }] }], fluid: { k: 'maint23' } }],
    traps: ['Wheeze is from mucus, not bronchospasm: start with 3% saline, not salbutamol.', 'Antibiotics are not routine.'] });
  c({ id: 'asthma', sys: 'resp', t: 'Bronchial asthma (acute attack)', ar: 'نوبة ربو', src: 'K p21–26', amin: 24, sx: { wheeze: 3, nightcough: 3, sob: 2, cough: 1 },
    about: 'Usually over 2 years: night/early-morning cough and breathlessness, past attacks, family history, atopy.', inv: ['Not routine'],
    variants: [
      { id: 'mild', t: 'Mild–moderate (emergency room)', lines: [{ t: 'Three nebuliser sessions, then reassess', items: [{ d: 'salbutamolNeb', r: 'neb' }] },
        { t: 'Discharge', items: [{ d: 'salbutamolPO', r: 'po' }, { d: 'terbutaline', r: 'po', note: 'alternative' }, { d: 'prednisolone', r: 'asthma' }] },
        { t: 'Prevention', items: [{ d: 'ketotifen', r: 'po' }] }] },
      { id: 'sev', t: 'Acute severe asthma (admitted)', when: 'No response to 3 sessions, distressed, tachycardic', lines: [
        { t: 'Step by step', items: [{ txt: '1 Oxygen to keep SpO2 > 95%' }, { d: 'salbutamolNeb', r: 'neb', note: '2 continue every 20 min' }, { d: 'hydrocortisone', r: 'asthma', note: '3 (or prednisolone orally)' },
          { d: 'ipratropium', r: 'neb', note: '4' }, { d: 'adrenalineSC', r: 'asthma', note: '5' }, { d: 'mgso4', r: 'asthma', note: '6 (aminophylline alternative)' }, { d: 'aminophylline', r: 'load', note: 'not recommended in new guidelines' }, { txt: '7 CPAP / intubation' }] },
        { t: 'Antibiotic only if bacterial infection', items: [{ d: 'ampiclox', r: 'iv' }, { d: 'cefuroxime', r: 'iv' }, { d: 'ceftriaxone', r: 'std' }] }], fluid: { k: 'maint23' } }],
    traps: ['No NSAIDs (mefenamic acid, ibuprofen, diclofenac) in asthma: paracetamol only.', 'Avoid benzylpenicillin in asthmatics (allergy).', 'Beta-blockers (propranolol) are dangerous in asthma.'],
    comp: ['Pneumothorax', 'Respiratory failure', 'Hypokalaemia (salbutamol)'] });
  c({ id: 'pertussis', sys: 'resp', t: 'Whooping cough (pertussis)', ar: 'السعال الديكي', src: 'K p27–28', sx: { whoop: 3, cough: 2, vomiting: 1, apnoea: 2 },
    about: 'Paroxysmal cough with vomiting, apnoea or cyanosis in infants; unvaccinated or contact; subconjunctival haemorrhage.', inv: ['CBC: leukocytosis with absolute lymphocytosis', 'Chest X-ray if complicated'],
    variants: [{ id: 'op', t: 'Outpatient', lines: [{ t: 'Drug of choice', items: [{ d: 'erythromycin', r: 'pertussis' }] }, { t: 'Alternatives', items: [{ d: 'azithromycin', r: 'pertussis' }, { d: 'clarithromycin', r: 'po' }] }] },
      { id: 'adm', t: 'Admitted', when: 'Distress or danger signs', lines: [{ t: 'Treatment', items: [{ txt: 'Oxygen' }, { d: 'benzylpen', r: 'std' }, { d: 'erythromycin', r: 'pertussis' }] }], fluid: { k: 'maint23' } }] });

  /* ===================== Cardiology ===================== */
  c({ id: 'hf', sys: 'cvs', t: 'Heart failure', ar: 'فشل القلب', src: 'K p29–30', sx: { feeddysp: 3, sob: 2, hepatomeg: 3, tachy: 2, murmur: 1, sweating: 1 },
    about: 'Breathless on feeding, tachycardia, tachypnoea, tender liver; older child raised JVP, basal crackles, gallop.', inv: ['CBC', 'Chest X-ray', 'Echocardiography', 'Hyperoxia test (cardiac vs respiratory)'],
    variants: [{ id: 'adm', t: 'Admitted', lines: [{ t: 'Treatment', items: [{ txt: 'Continuous oxygen; cardiac bed (semi-sitting)' }, { d: 'furosemide', r: 'hf' }, { d: 'furosemide', r: 'hfm' }, { d: 'spironolactone', r: 'po' }, { d: 'captopril', r: 'po', note: 'refractory' }, { d: 'digoxin', r: 'po', note: 'PCH' }] }] }],
    traps: ['Do not give salbutamol nebuliser to a breathless child with heart disease or anaemic heart failure (fatal mistake): oxygen + NS nebuliser ± ipratropium.'] });
  c({ id: 'ie', sys: 'cvs', t: 'Infective endocarditis', ar: 'التهاب شغاف القلب', src: 'K p30', sx: { fever: 3, murmur: 3, spleno: 2, haematuria: 1 },
    about: 'Prolonged fever in a child with heart disease, new murmur, splenomegaly, clubbing, haematuria.', inv: ['Blood culture (3 sets) before antibiotics', 'CBC, CRP', 'Echocardiography', 'Urine'],
    variants: [{ id: 'adm', t: 'Admitted', lines: [{ t: 'First line', items: [{ d: 'benzylpen', r: 'std' }, { d: 'gentamicin', r: 'std' }] }, { t: 'Alternative', items: [{ d: 'vancomycin', r: 'iv' }, { d: 'ceftriaxone', r: 'severe' }] }] }] });
  c({ id: 'rf', sys: 'cvs', t: 'Acute rheumatic fever', ar: 'الحمى الروماتيزمية', src: 'K p32–35, p141', amin: 36, sx: { jointpain: 3, jointswell: 2, fever: 2, tonsilhx: 3, chorea: 2, tachy: 2, murmur: 2 },
    about: '5–15 years: fever, migratory arthritis, carditis, chorea, nodules, erythema marginatum; past recurrent tonsillitis. Jones criteria (2015).', inv: ['ASO titre, CRP, ESR', 'CBC, BFFM, urine', 'ECG, chest X-ray, echocardiography'],
    variants: [{ id: 'adm', t: 'Treatment', lines: [
      { t: 'Eradication and prophylaxis', items: [{ d: 'benzathine', r: 'rf' }] }, { t: 'Penicillin allergy', items: [{ d: 'erythromycin', r: 'rfallergy' }] },
      { t: 'Anti-inflammatory', items: [{ d: 'aspirin', r: 'rf' }, { d: 'omeprazole', r: 'po', note: 'with aspirin' }, { d: 'prednisolone', r: 'rf', note: 'if aspirin not tolerated or carditis' }] }] }],
    comp: ['Rheumatic heart disease', 'Heart failure', 'Infective endocarditis'] });
  c({ id: 'rhd', sys: 'cvs', t: 'Rheumatic heart disease (decompensated)', ar: 'مرض القلب الروماتيزمي', src: 'K p35', amin: 60, sx: { sob: 2, murmur: 3, oedema: 2, tonsilhx: 2, cough: 1 },
    about: 'Over 5 years: breathlessness, cough, leg oedema, murmur.', inv: ['As rheumatic fever + echocardiography'],
    variants: [{ id: 'adm', t: 'Admitted', lines: [{ t: 'Treatment', items: [{ txt: 'Oxygen; cardiac bed' }, { d: 'benzathine', r: 'rf' }, { d: 'furosemide', r: 'hfm' }, { d: 'spironolactone', r: 'po' }, { d: 'aspirin', r: 'rf', note: '± if active carditis' }, { d: 'omeprazole', r: 'po' }] }] }] });
  c({ id: 'chorea', sys: 'cvs', t: 'Sydenham chorea', ar: 'الرقص الروماتيزمي', src: 'K p36', amin: 36, sx: { chorea: 3, tonsilhx: 1 },
    about: 'Abnormal movements, slurred speech, poor handwriting; milking grip, darting tongue, hypotonia (often isolated, up to 6 months after the infection).', inv: ['ASO, CRP, ESR', '± chest X-ray, echo'],
    variants: [{ id: 'op', t: 'Treatment', lines: [{ t: 'Options', items: [{ d: 'haloperidol', r: 'chorea' }, { d: 'chlorpromazine', r: 'chorea' }] }, { t: 'Prophylaxis', items: [{ d: 'benzathine', r: 'rf' }] }] }] });
  c({ id: 'myocarditis', sys: 'cvs', t: 'Viral myocarditis / dilated cardiomyopathy', ar: 'التهاب عضلة القلب', src: 'K p31', sx: { sob: 2, hepatomeg: 2, tachy: 3, feeddysp: 2 },
    about: 'Commonest cause of heart failure without a murmur; recent viral illness.', inv: ['CBC, ESR', 'Chest X-ray (cardiomegaly)', 'ECG, echocardiography'],
    variants: [{ id: 'adm', t: 'Treatment', lines: [{ t: 'As heart failure', items: [{ txt: 'Oxygen' }, { d: 'furosemide', r: 'hf' }, { d: 'spironolactone', r: 'po' }] }] }] });

  /* ===================== Newborn ===================== */
  c({ id: 'neosepsis', sys: 'neo', t: 'Neonatal sepsis', ar: 'تسمم الدم عند حديثي الولادة', src: 'K p37–43', amax: 1, sx: { fever: 2, poorfeed: 3, umbilical: 3, lethargy: 2, apnoea: 1, jaundice: 1, convulsion: 1 },
    about: 'Neonate (< 28 days) with fever, refusal of feeds, umbilical discharge or any system symptom; risk: PROM > 18 h, home delivery, maternal fever.', inv: ['CBC (high or low WBC, low platelets)', 'CRP (> 10)', 'RFT', 'Septic screen by symptoms: chest X-ray, urine, stool, LP'],
    variants: [
      { id: 'simple', t: 'Simple sepsis (first line)', lines: [{ t: 'Treatment', items: [{ d: 'benzylpen', r: 'neo' }, { d: 'gentamicin', r: 'std' }, { d: 'vitK', r: 'proph' }, { d: 'paracetamol', r: 'prn', note: 'Adol drops or suppository' }] }], fluid: { k: 'neo' } },
      { id: 'severe', t: 'Severe sepsis (second line)', when: 'Very ill or not responding', lines: [{ t: 'Treatment', items: [{ d: 'cefotaxime', r: 'std' }, { d: 'ampicillin', r: 'std', note: 'covers Listeria' }, { d: 'vancomycin', r: 'iv', note: 'if severely ill' }, { d: 'vitK', r: 'proph' }] }], fluid: { k: 'neo' } },
      { id: 'op', t: 'Febrile but well, normal labs', when: 'Normal TWBC and negative CRP', lines: [{ t: 'Oral (no admission)', items: [{ d: 'amoxicillin', r: 'po' }, { d: 'cefixime', r: 'po' }, { d: 'paracetamol', r: 'prn' }, { d: 'salineDrops', r: 'std' }] }] }],
    traps: ['Ceftriaxone is contraindicated in neonates (jaundice): use cefotaxime.', 'No diazepam in neonatal seizures except tetanus.'], comp: ['Meningitis', 'Septic shock', 'DIC', 'NEC'] });
  c({ id: 'dehydfever', sys: 'neo', t: 'Dehydration fever (newborn)', ar: 'حمى الجفاف عند حديث الولادة', src: 'K p44', amax: 0.3, sx: { fever: 3, poorfeed: 1 },
    about: 'First 3 days of life, hot weather, little colostrum; otherwise well; normal CBC and CRP.', inv: ['CBC, CRP (normal)'],
    variants: [{ id: 'op', t: 'Treatment', lines: [{ t: 'Treatment', items: [{ txt: 'IV maintenance or formula/D10 orally alternating with breast milk until milk is adequate' }, { d: 'paracetamol', r: 'prn' }] }], fluid: { k: 'neo' } }] });
  c({ id: 'nnj', sys: 'neo', t: 'Neonatal jaundice', ar: 'صفار حديثي الولادة', src: 'K p45–47', amax: 1, sx: { jaundice: 3, poorfeed: 1, darkurine: 1, palestool: 1 },
    about: 'Jaundice on day 1 is pathological (Rh/ABO). Kramer: face ≈ 6, chest ≈ 9, abdomen ≈ 12, feet ≈ 15 mg/dL.', inv: ['Total, direct and indirect bilirubin', 'Blood groups of baby and mother (most important)', 'CBC, retics, Coombs, CRP', 'Conjugated (> 20% direct): hepatitis screen, fasting US (biliary atresia), urine reducing substances, TORCH'],
    variants: [
      { id: 'mild', t: 'Below phototherapy line, well', lines: [{ t: 'Management', items: [{ txt: 'Reassure; frequent breast feeds; morning sun; review.' }] }] },
      { id: 'photo', t: 'Phototherapy (stable)', lines: [{ t: 'Treatment', items: [{ txt: 'Single or double phototherapy by the chart' }, { d: 'benzylpen', r: 'neo' }, { d: 'gentamicin', r: 'std' }, { d: 'vitK', r: 'proph' }] }], fluid: { k: 'neo' } },
      { id: 'ill', t: 'Very ill / exchange level', lines: [{ t: 'Treatment', items: [{ txt: 'Double phototherapy; exchange transfusion above the exchange line or with signs of kernicterus' }, { d: 'cefotaxime', r: 'std' }, { d: 'ampicillin', r: 'std' }, { d: 'ivig', r: 'jaundice', note: 'Rh/ABO, if available' }] }], fluid: { k: 'neo' } }],
    admit: ['Ill baby', 'TSB > 5 mg/dL day 1, > 9 day 2, > 15 mg/dL', 'Jaundice on day 1'], traps: ['No phototherapy in conjugated jaundice (bronze baby).', '1 mg/dL = 17 µmol/L.'], comp: ['Kernicterus (hypotonia, opisthotonus, seizures)'] });
  c({ id: 'neoseizure', sys: 'neo', t: 'Neonatal seizures', ar: 'تشنجات حديثي الولادة', src: 'K p48–50', amax: 1, sx: { convulsion: 3, apnoea: 2, lethargy: 1 },
    about: 'Causes: sepsis, hypoglycaemia, hypocalcaemia, B6 deficiency, birth asphyxia, haemorrhage. Subtle seizures in preterms: blinking, sucking, apnoea with tachycardia.', inv: ['RBG, calcium, electrolytes', 'Sepsis screen, CRP', 'Cranial ultrasound'],
    variants: [{ id: 'adm', t: 'Admitted', lines: [
      { t: 'Anticonvulsants in order', items: [{ d: 'phenobarbitone', r: 'load' }, { d: 'phenobarbitone', r: 'maint' }, { d: 'phenytoin', r: 'load' }, { d: 'pyridoxine', r: 'neo' }, { d: 'midazolam', r: 'load' }] },
      { t: 'Sepsis plan', items: [{ d: 'cefotaxime', r: 'std' }, { d: 'ampicillin', r: 'std' }, { d: 'vitK', r: 'proph' }] }], fluid: { k: 'neo' } }],
    traps: ['No diazepam in neonates (except tetanus).', 'Apnoea with bradycardia is not a seizure (consider aminophylline in preterms).'],
    extra: ['Seizure-free 48 h: taper phenytoin, keep phenobarbitone; abnormal neurology: phenobarbitone for 1 month.'] });
  c({ id: 'hdn', sys: 'neo', t: 'Haemorrhagic disease of the newborn (vitamin K deficiency)', ar: 'نزيف حديث الولادة', src: 'K p51', amax: 3, sx: { bleeding: 3, umbilical: 2, neckstiff: 1, pallor: 1 },
    about: 'Bleeding from the umbilicus (commonest), cephalhaematoma, nose, urine; bulging fontanelle = intracranial bleed.', inv: ['CBC', 'PT, APTT, INR (prolonged)'],
    variants: [{ id: 'adm', t: 'Admitted', lines: [{ t: 'Treatment', items: [{ d: 'vitK', r: 'hdn' }, { txt: 'FFP 10 mL/kg if actively bleeding' }, { txt: 'Transfuse if Hb < 10 g/dL' }, { d: 'benzylpen', r: 'neo' }, { d: 'gentamicin', r: 'std' }] }], fluid: { k: 'neo' } }] });
  c({ id: 'nec', sys: 'neo', t: 'Necrotising enterocolitis (NEC)', ar: 'التهاب الأمعاء الناخر', src: 'K p52', amax: 2, sx: { bilvomit: 3, distension: 3, blood_stool: 2, lethargy: 1 },
    about: 'Preterm, low birth weight, formula, umbilical catheter: bilious vomiting, distension, bloody stool, tender abdomen.', inv: ['Abdominal X-ray erect and supine (pneumatosis)', 'CBC (low Hb and platelets)', 'RFT, electrolytes, RBG'],
    variants: [{ id: 'adm', t: 'Admitted', lines: [{ t: 'Treatment', items: [{ txt: 'Nil by mouth 7–14 days; NG tube on free drainage' }, { d: 'cefotaxime', r: 'std' }, { d: 'ampicillin', r: 'std' }, { d: 'metronidazole', r: 'iv' }, { d: 'meropenem', r: 'iv', note: 'with vancomycin if severe' }] }], fluid: { k: 'neo' } }],
    extra: ['Surgery if perforation or no response.'] });
  c({ id: 'tetneo', sys: 'neo', t: 'Tetanus neonatorum', ar: 'تيتانوس حديثي الولادة', src: 'K p53', amax: 1, sx: { lockjaw: 3, convulsion: 2, poorfeed: 2 },
    about: 'Home delivery, contaminated cord: spasms, lockjaw, opisthotonus.', inv: ['Clinical'],
    variants: [{ id: 'adm', t: 'Admitted', lines: [{ t: 'Treatment', items: [{ txt: 'Dark quiet room; minimal handling' }, { d: 'diazepam', r: 'tetanus' }, { d: 'chlorpromazine', r: 'tetanus' }, { d: 'tig', r: 'neo' }, { d: 'benzylpen', r: 'neo' }, { d: 'gentamicin', r: 'std' }, { d: 'metronidazole', r: 'iv' }] }], fluid: { k: 'neo' } }] });
  c({ id: 'rdsneo', sys: 'neo', t: 'Respiratory distress in the newborn (RDS, TTN, MAS)', ar: 'ضيق التنفس عند حديث الولادة', src: 'K p54', amax: 1, sx: { grunting: 3, sob: 2, cyanosis: 1 },
    about: 'RDS: preterm/diabetic mother, ground-glass X-ray. TTN: caesarean, fluid in fissures. MAS: term/post-term, meconium staining, patchy X-ray.', inv: ['Chest X-ray', 'Blood gas', 'Sepsis screen'],
    variants: [{ id: 'adm', t: 'Admitted', lines: [{ t: 'Treatment', items: [{ txt: 'ABC, oxygen/CPAP; surfactant via ETT in RDS' }, { d: 'cefotaxime', r: 'std' }, { d: 'ampicillin', r: 'std' }, { d: 'vitK', r: 'proph' }] }], fluid: { k: 'neo' } }] });
  c({ id: 'hie', sys: 'neo', t: 'Birth asphyxia (HIE)', ar: 'اختناق الولادة', src: 'K p56', amax: 1, sx: { nocry: 3, grunting: 2, convulsion: 2, cyanosis: 1 },
    about: 'Did not cry at birth: breathlessness, grunting, cyanosis, convulsions.', inv: ['RBG', 'CBC', 'RFT'],
    variants: [{ id: 'adm', t: 'Admitted', lines: [{ t: 'Treatment', items: [{ txt: 'Suction and oxygen first (airway before IV line)' }, { d: 'cefotaxime', r: 'std' }, { d: 'ampicillin', r: 'std' }, { d: 'vitK', r: 'proph' }, { txt: 'Therapeutic cooling within 6 hours of birth (GA > 35 weeks): 33–35 °C for 72 hours' }] }], fluid: { k: 'neo' } }] });
  c({ id: 'ivh', sys: 'neo', t: 'Intracranial haemorrhage (newborn)', ar: 'نزيف داخل الجمجمة', src: 'K p55', amax: 1, sx: { neckstiff: 3, pallor: 3, convulsion: 2, lethargy: 2 },
    about: 'Bulging fontanelle ± seizures, pale (most important) ± shock; high BP with slow pulse.', inv: ['CBC', 'Bleeding profile', 'Cranial ultrasound / CT'],
    variants: [{ id: 'adm', t: 'Admitted', lines: [{ t: 'Treatment', items: [{ d: 'vitK', r: 'hdn' }, { txt: 'FFP 10 mL/kg; transfuse if Hb < 10 g/dL; head circumference twice daily' }, { d: 'omeprazole', r: 'iv', note: '± PPI' }] }], fluid: { k: 'neo' } }] });
  c({ id: 'neoconj', sys: 'neo', t: 'Neonatal conjunctivitis', ar: 'التهاب ملتحمة حديث الولادة', src: 'K p140', amax: 1, sx: { eyedisch: 3, redeye: 2 },
    about: 'First 48 h chemical; day 2–7 gonococcal; after day 7 chlamydial.', inv: ['Eye swab'],
    variants: [{ id: 'gc', t: 'Day 2–7 (gonococcal)', lines: [{ t: 'Treatment', items: [{ d: 'cefotaxime', r: 'std' }, { d: 'tetracyclineEye', r: 'std' }, { txt: 'Frequent eye irrigation with saline' }] }] },
      { id: 'ch', t: 'After day 7 (chlamydial)', lines: [{ t: 'Treatment', items: [{ d: 'tetracyclineEye', r: 'std' }, { d: 'erythromycin', r: 'po', note: 'if severe' }] }] },
      { id: 'nur', t: 'In the nursery', lines: [{ t: 'Treatment', items: [{ d: 'tobramycinEye', r: 'std' }] }] }] });

  /* ===================== Gastroenterology ===================== */
  c({ id: 'ge', sys: 'gi', t: 'Acute gastroenteritis', ar: 'النزلة المعوية', src: 'K p57–65', sx: { diarrhoea: 3, vomiting: 2, sunken: 2, fever: 1 },
    about: 'Diarrhoea and vomiting (mostly rotavirus). Classify dehydration: none, some (2 of: sunken eyes, slow skin pinch, irritable, drinks eagerly), severe (2 of: deeply sunken eyes, very slow skin pinch, lethargic, drinks poorly).',
    inv: ['BFFM (dysenteric malaria)', 'CBC (low TWBC: typhoid; low Hb + platelets: HUS)', 'Stool general (pus cells, RBC, trophozoites, ova)', 'RFT and electrolytes if severe'],
    variants: [
      { id: 'none', t: 'No dehydration (outpatient)', lines: [{ t: 'Treatment', items: [{ d: 'zinc', r: 'ge' }, { d: 'ors', r: 'loss' }, { d: 'paracetamol', r: 'prn' }] },
        { t: 'Antibiotic only if stool shows pus cells/RBC or blood (treat as shigella)', items: [{ d: 'cefixime', r: 'po' }, { d: 'cotrimoxazole', r: 'po' }, { d: 'nalidixic', r: 'po' }] }], fluid: { k: 'planA' } },
      { id: 'loss', t: 'No dehydration but excessive losses', when: '> 5 stools or > 4 vomits', lines: [{ t: 'Treatment', items: [{ d: 'zinc', r: 'ge' }, { d: 'ceftriaxone', r: 'std', note: 'local practice; ideal only if stool shows pus cells' }] }], fluid: { k: 'maint' } },
      { id: 'some', t: 'Some dehydration', lines: [{ t: 'Treatment', items: [{ d: 'zinc', r: 'ge' }, { d: 'ceftriaxone', r: 'std', note: 'not routine' }] }], fluid: { k: 'planB' } },
      { id: 'severe', t: 'Severe dehydration', lines: [{ t: 'Treatment', items: [{ d: 'ceftriaxone', r: 'std' }, { d: 'zinc', r: 'ge' }] }], fluid: { k: 'planC' } }],
    traps: ['No antiemetics or antimotility drugs: rehydration stops the vomiting (metoclopramide → dystonia).', 'Metronidazole only for giardia or amoeba.', 'Malnourished child: no plan B/C — use ReSoMal.'],
    comp: ['Hypo/hypernatraemia', 'Hypokalaemia (distension)', 'Acute kidney injury', 'HUS', 'Shock'] });
  c({ id: 'dysentery', sys: 'gi', t: 'Dysentery (bacillary / amoebic)', ar: 'الدوسنتاريا', src: 'K p63–64', sx: { blood_stool: 3, diarrhoea: 2, fever: 1, abdpain: 1 },
    about: 'Blood and mucus in stool. Uncountable pus cells/RBC: bacillary; with E. histolytica trophozoites: amoebic.', inv: ['Stool general', 'CBC', 'BFFM'],
    variants: [{ id: 'bac', t: 'Bacillary (shigella)', lines: [{ t: 'Treatment', items: [{ d: 'cefixime', r: 'po' }, { d: 'cotrimoxazole', r: 'po' }, { d: 'nalidixic', r: 'po' }, { d: 'ceftriaxone', r: 'std', note: 'if admitted' }, { d: 'zinc', r: 'ge' }] }] },
      { id: 'amoeba', t: 'Amoebic', lines: [{ t: 'Treatment', items: [{ d: 'metronidazole', r: 'amoeba' }] }] }], comp: ['HUS (stop antibiotics if HUS develops)'] });
  c({ id: 'giardia', sys: 'gi', t: 'Giardiasis', ar: 'الجيارديا', src: 'K p63, p72, p77', sx: { abdpain: 2, distension: 3, diarrhoea: 2 },
    about: 'Abdominal pain, gaseous distension, loose stools; G. lamblia trophozoites in stool (cysts alone: no treatment).', inv: ['Stool general'],
    variants: [{ id: 'op', t: 'Treatment', lines: [{ t: 'Treatment', items: [{ d: 'metronidazole', r: 'giardia' }, { d: 'prifinium', r: 'po', note: 'antispasmodic' }, { d: 'simethicone', r: 'po', note: 'distension' }] }] }] });
  c({ id: 'cholera', sys: 'gi', t: 'Acute watery diarrhoea (cholera)', ar: 'الإسهال المائي الحاد (الكوليرا)', src: 'K p67', sx: { ricewater: 3, diarrhoea: 2, vomiting: 1, sunken: 2 },
    about: 'Profuse rice-water stool ± vomiting with dehydration or shock.', inv: ['CBC, BFFM, stool general'],
    variants: [{ id: 'sev', t: 'Treatment', lines: [{ t: 'Antibiotic', items: [{ d: 'erythromycin', r: 'cholera', note: 'under 8 years' }, { d: 'doxycycline', r: 'cholera', note: 'over 8 years' }] }, { t: 'Other', items: [{ d: 'zinc', r: 'ge' }, { d: 'ors', r: 'loss' }] }], fluid: { k: 'planC' } }],
    extra: ["Aggressive Ringer's lactate; if not dehydrated give 1–1½ × maintenance as Ringer's lactate."] });
  c({ id: 'hyperna', sys: 'gi', t: 'Hypernatraemic dehydration', ar: 'الجفاف مع ارتفاع الصوديوم', src: 'K p68–69', sx: { diarrhoea: 2, vomiting: 1, convulsion: 2, irritable: 2 },
    about: 'Na > 145 (correct if > 150 with symptoms): pulse good and skin pinch normal despite losses (doughy skin); bottle feeding, hot weather.', inv: ['Na, K, urea, creatinine every 6 hours', 'RBG'],
    variants: [{ id: 'adm', t: 'Slow correction', lines: [{ t: 'Treatment', items: [{ txt: 'Correct over 24–48 hours; aim fall ≤ 0.5 mmol/L/h' }] }], fluid: { k: 'hyperNa' } }], comp: ['Cerebral oedema from fast correction', 'Convulsions'] });
  c({ id: 'thrush', sys: 'gi', t: 'Oral thrush / aphthous ulcers / herpetic stomatitis', ar: 'فطريات الفم وقرح الفم', src: 'K p70', sx: { whitetongue: 3, mouthulcer: 3, poorfeed: 1 },
    about: 'White coated tongue (thrush); ulcers of tongue and lips (aphthous); salivation, bleeding gums, bad odour (herpetic gingivostomatitis).', inv: ['Clinical'],
    variants: [{ id: 'thrush', t: 'Oral thrush', lines: [{ t: 'Treatment', items: [{ d: 'miconazoleGel', r: 'std' }, { d: 'nystatin', r: 'std' }] }] },
      { id: 'ulcer', t: 'Aphthous / herpetic', lines: [{ t: 'Treatment', items: [{ d: 'gentianViolet', r: 'std' }, { d: 'metronidazole', r: 'po', note: 'anaerobes' }, { d: 'paracetamol', r: 'prn' }] }] }],
    extra: ["Clean and treat the mother's nipples before feeds."] });
  c({ id: 'typhoid', sys: 'gi', t: 'Typhoid fever (enteric)', ar: 'التايفويد', src: 'K p71', amin: 12, sx: { fever: 3, headache: 2, diarrhoea: 1, constip: 1, abdpain: 1 },
    about: 'Fever, headache, diarrhoea or constipation with relative bradycardia.', inv: ['CBC: leukopenia (most important; exclude dengue)', 'Blood culture week 1, urine week 2, stool week 3', 'Widal is not reliable'],
    variants: [{ id: 'op', t: 'Outpatient', lines: [{ t: 'Treatment', items: [{ d: 'cefixime', r: 'typhoid' }, { d: 'amoxicillin', r: 'typhoid' }, { d: 'ciprofloxacin', r: 'typhoid', note: 'over 12 years' }, { d: 'paracetamol', r: 'prn' }] }] },
      { id: 'adm', t: 'Admitted', lines: [{ t: 'Treatment', items: [{ d: 'ceftriaxone', r: 'std' }, { d: 'paracetamol', r: 'iv' }] }], fluid: { k: 'maint' } }], comp: ['Intestinal perforation', 'GI bleeding', 'Encephalopathy'] });
  c({ id: 'gastritis', sys: 'gi', t: 'Gastritis / peptic ulcer / H. pylori', ar: 'التهاب المعدة', src: 'K p73–76', amin: 24, sx: { epigastric: 3, vomiting: 2, poorfeed: 1 },
    about: 'Epigastric pain ± vomiting or haematemesis; epigastric tenderness.', inv: ['H. pylori stool antigen (better than ICT)', 'Urea breath test if recurrent', 'Endoscopy for ulcer', 'BFFM, stool general'],
    variants: [{ id: 'adm', t: 'Persistent vomiting (admitted)', lines: [{ t: 'Treatment', items: [{ d: 'omeprazole', r: 'iv' }, { d: 'ranitidine', r: 'iv' }, { d: 'cimetidine', r: 'iv' }] }], fluid: { k: 'maint' } },
      { id: 'hp', t: 'H. pylori eradication (triple therapy)', lines: [{ t: '1 week', items: [{ d: 'amoxicillin', r: 'hp' }, { d: 'clarithromycin', r: 'hp' }, { d: 'omeprazole', r: 'hp' }] }] }],
    traps: ['Triple therapy has no metronidazole (that is regimen 2 with bismuth and tetracycline after failure).'] });
  c({ id: 'distension', sys: 'gi', t: 'Abdominal distension', ar: 'انتفاخ البطن', src: 'K p77–79', sx: { distension: 3, vomiting: 1, constip: 1 },
    about: 'Mostly wrong breast-feeding technique; also giardiasis, hypokalaemia (profuse losses), constipation, NEC, ascites, peritonitis.', inv: ['Stool general', 'Serum K if D/V', 'Abdominal X-ray erect and supine if obstruction', 'Ultrasound'],
    variants: [{ id: 'op', t: 'Management', lines: [{ t: 'Treatment', items: [{ txt: 'Correct the feeding technique' }, { d: 'metronidazole', r: 'giardia', note: 'if giardia' }, { d: 'simethicone', r: 'po' }, { txt: 'Hypokalaemia: see the potassium calculator' }] }] }] });
  c({ id: 'worms', sys: 'gi', t: 'Intestinal worms (Enterobius, Ascaris, hookworm)', ar: 'الديدان', src: 'K p80–81', amin: 12, sx: { analitch: 3, worms: 3, pica: 1, pallor: 1, abdpain: 1 },
    about: 'Threadworm: night anal itching (sticky-tape test). Ascaris/hookworm: worms in stool, anaemia, eosinophilia.', inv: ['Sticky-tape test (threadworm)', 'Stool general (eggs)', 'CBC'],
    variants: [{ id: 'op', t: 'Treatment', lines: [{ t: 'Treatment', items: [{ d: 'mebendazole', r: 'po' }, { d: 'betamethasoneCr', r: 'std', note: 'itching' }] }] }], extra: ['Treat the whole family.'] });
  c({ id: 'schisto', sys: 'gi', t: 'Schistosomiasis / tapeworm', ar: 'البلهارسيا والدودة الشريطية', src: 'K p63', sx: { haematuria: 2, worms: 2, abdpain: 1 },
    about: 'Ova in stool or urine.', inv: ['Stool and urine for ova'],
    variants: [{ id: 'op', t: 'Treatment', lines: [{ t: 'Treatment', items: [{ d: 'praziquantel', r: 'schisto', note: 'schistosomiasis' }, { d: 'praziquantel', r: 'tapeworm', note: 'H. nana / Taenia' }] }] }] });
  c({ id: 'hepatitis', sys: 'gi', t: 'Acute hepatitis', ar: 'التهاب الكبد', src: 'K p130–132', sx: { jaundice: 3, darkurine: 2, fever: 1, palestool: 1, hepatomeg: 2, poorfeed: 1 },
    about: 'Fever, yellow eyes, dark urine ± pale stool; tender liver.', inv: ['Bilirubin (direct > 20%)', 'HBsAg, HCV, anti-HAV', 'LFT and enzymes', 'Urine (bile)', 'BFFM; CBC + retics if haemolysis is suspected; sickling test (Hausa, Messiria)'],
    variants: [{ id: 'op', t: 'Outpatient (eating well)', lines: [{ t: 'Treatment', items: [{ d: 'ibuprofen', r: 'prn', note: 'avoid paracetamol' }, { d: 'lactulose', r: 'po', note: 'avoid constipation' }, { txt: 'B-complex / multivitamin syrup 2.5–5 mL daily' }] }] },
      { id: 'adm', t: 'Admitted', when: 'Refuses feeds, vomits everything, encephalopathy', lines: [{ t: 'Treatment', items: [{ d: 'cefotaxime', r: 'std', note: 'not ceftriaxone (jaundice)' }, { d: 'ampiclox', r: 'iv' }, { d: 'lactulose', r: 'po' }, { txt: 'Advanced disease: vitamins A, D, E, K; oral streptomycin 12–18 mg/kg daily' }] }], fluid: { k: 'maint', why: 'Use D10 as maintenance in hepatitis.' } }],
    traps: ['Avoid ceftriaxone in jaundice.', 'Protein restriction only in hepatic failure.'], comp: ['Fulminant hepatic failure', 'Encephalopathy', 'Bleeding'] });

  /* ===================== Kidney ===================== */
  c({ id: 'uti', sys: 'renal', t: 'Urinary tract infection', ar: 'التهاب المسالك البولية', src: 'K p82–84', sx: { dysuria: 3, fever: 2, loinpain: 2, irritable: 1, vomiting: 1 },
    about: 'Crying on micturition ± fever, irritability, vomiting; neonate: prolonged jaundice, weight loss; older: loin pain (pyelonephritis), urgency/frequency (cystitis).', inv: ['Urine general (> 10 pus cells), nitrite, culture (bag in infants)', 'Ultrasound: recurrent UTI in infants, or many RBC', 'Culture and sensitivity if recurrent'],
    variants: [{ id: 'op', t: 'Outpatient', lines: [{ t: 'Antibiotic', items: [{ d: 'cotrimoxazole', r: 'po' }, { d: 'cefixime', r: 'po' }, { d: 'nalidixic', r: 'po' }, { d: 'cefpodoxime', r: 'po' }] }, { t: 'Adjuncts', items: [{ txt: 'Plenty of water (most important)' }, { d: 'paracetamol', r: 'prn' }] }] },
      { id: 'adm', t: 'Admitted', when: 'Febrile convulsion, vomiting everything, refusing feeds', lines: [{ t: 'Treatment', items: [{ d: 'ceftriaxone', r: 'std' }, { d: 'paracetamol', r: 'iv' }] }], fluid: { k: 'maint' } }] });
  c({ id: 'nephrotic', sys: 'renal', t: 'Nephrotic syndrome', ar: 'المتلازمة الكلوية', src: 'K p84–85, p89', sx: { periorbital: 3, oedema: 3, distension: 1 },
    about: 'Periorbital swelling worse in the morning; generalised oedema, ascites, effusion.', inv: ['Urine: heavy proteinuria (++ / +++)', 'Serum albumin < 2.5 g/dL', 'RFT', 'Urine albumin:creatinine > 200 mg/mmol'],
    variants: [{ id: 'adm', t: 'Treatment', lines: [{ t: 'Treatment', items: [{ d: 'prednisolone', r: 'nephrotic', note: 'after infection treated and BP controlled' }, { d: 'ceftriaxone', r: 'renal', note: 'if infection (UTI)' }] }],
      extra: ['Renal chart: daily weight, BP 6-hourly, input/output, daily urine.', 'Salt restriction; encourage movement (DVT).'] }], comp: ['Infection (peritonitis)', 'Thrombosis', 'Hypovolaemia', 'Acute kidney injury'] });
  c({ id: 'agn', sys: 'renal', t: 'Acute post-streptococcal glomerulonephritis', ar: 'التهاب كبيبات الكلى الحاد', src: 'K p86', sx: { haematuria: 3, oliguria: 2, hypert: 2, periorbital: 2, tonsilhx: 2 },
    about: 'Cola-coloured urine, oliguria, hypertension ± facial oedema, 2–3 weeks after tonsillitis or skin infection.', inv: ['Urine: RBC, RBC casts', 'ASO titre (may be negative after skin infection)', 'ESR', 'C3 (low)', 'RFT, electrolytes'],
    variants: [{ id: 'adm', t: 'Admitted', lines: [{ t: 'Treatment', items: [{ d: 'benzylpen', r: 'std', note: 'or procaine penicillin / penicillin V / amoxicillin' }, { d: 'furosemide', r: 'hfm', note: 'for hypertension/oedema' }, { d: 'nifedipine', r: 'po', note: '± antihypertensive' }] }], fluid: { k: 'restrict' },
      extra: ['Bed rest until hypertension and gross haematuria settle; BP 4-hourly; restrict salt and fruit juice; renal chart.'] }], comp: ['Hypertensive encephalopathy', 'Pulmonary oedema', 'Acute kidney injury', 'Hyperkalaemia'] });
  c({ id: 'aki', sys: 'renal', t: 'Acute kidney injury', ar: 'الفشل الكلوي الحاد', src: 'K p87', sx: { oliguria: 3, oedema: 2, hypert: 2, lethargy: 1, convulsion: 1 },
    about: 'Little or no urine, oedema, hypertension, lethargy/convulsions (uraemia), signs of the cause.', inv: ['Urea, creatinine, electrolytes', 'CBC (anaemia, low platelets in HUS)', 'Ultrasound (obstruction)'],
    variants: [{ id: 'adm', t: 'Admitted', lines: [{ t: 'Fluid challenge then restriction', items: [{ txt: 'NS 20 mL/kg over 1 hour' }, { d: 'furosemide', r: 'aki' }, { txt: 'Still anuric: restrict to insensible loss + urine output; dialysis if not responding' }] }], fluid: { k: 'restrict' } }],
    extra: ['Dialysis: uraemic pericarditis or encephalopathy, urea > 250, creatinine > 8 mg/dL, refractory hyperkalaemia, fluid overload.'] });
  c({ id: 'hus', sys: 'renal', t: 'Haemolytic uraemic syndrome', ar: 'متلازمة انحلال الدم اليوريمية', src: 'K p88', sx: { blood_stool: 2, pallor: 3, oliguria: 3, hypert: 1 },
    about: 'Bloody diarrhoea days–weeks before, then haemolytic anaemia, low platelets and AKI (E. coli O157).', inv: ['CBC: anaemia, thrombocytopenia', 'Blood film: fragmented RBC', 'RFT'],
    variants: [{ id: 'adm', t: 'Supportive', lines: [{ t: 'Treatment', items: [{ txt: 'STOP antibiotics (they worsen HUS) — most important' }, { txt: 'Renal chart; fluid restriction; transfuse if needed; dialysis' }] }], fluid: { k: 'restrict' } }] });

  /* ===================== Nervous system ===================== */
  c({ id: 'febconv', sys: 'cns', t: 'Febrile convulsion', ar: 'التشنج الحراري', src: 'K p90–91', amin: 6, amax: 72, sx: { convulsion: 3, fever: 3 },
    about: '6 months–5 (6) years; fever from an extracranial cause (tonsillitis, otitis, pneumonia, viral). Meningitis and cerebral malaria are NOT febrile convulsions.', inv: ['BFFM / MAT', 'CBC', 'RBG', 'LP if meningitis is suspected (any age)'],
    variants: [{ id: 'adm', t: 'Admitted', lines: [{ t: 'Treatment', items: [{ txt: 'ABC: recovery position, suction, oxygen (before the IV line)' }, { d: 'diazepam', r: 'iv', note: 'beside the patient if it convulses' }, { d: 'diazepam', r: 'pr', note: 'if no IV line' }, { d: 'paracetamol', r: 'pr' }, { d: 'diclofenac', r: 'im', note: 'if high fever (over 6 months)' }, { txt: 'Tepid sponging' }] }] }],
    traps: ['Do not start antibiotics before the LP: dexamethasone must precede antibiotics by 30 minutes if meningitis.'] });
  c({ id: 'meningitis', sys: 'cns', t: 'Bacterial meningitis', ar: 'التهاب السحايا', src: 'K p92–93', sx: { fever: 2, neckstiff: 3, convulsion: 2, lethargy: 2, vomiting: 1, rash: 1, headache: 1 },
    about: 'Fever, convulsion, coma, rash (meningococcaemia); bulging fontanelle (< 18 months); neck stiffness, Kernig, Brudzinski (> 2 years).', inv: ['LP: CSF cells > 5, glucose < ⅓–½ of blood', 'RBG (at LP)', 'CBC (neutrophilia)', 'Blood culture'],
    variants: [
      { id: 'child', t: 'Infant and child', lines: [{ t: 'First line', items: [{ d: 'dexamethasone', r: 'mening', note: '30 min before antibiotic' }, { d: 'ceftriaxone', r: 'mening' }, { d: 'benzylpen', r: 'mening', note: '±' }] },
        { t: 'Very ill / not responding', items: [{ d: 'vancomycin', r: 'iv' }, { d: 'ceftriaxone', r: 'mening' }] }, { t: 'Supportive', items: [{ d: 'paracetamol', r: 'iv' }, { d: 'diazepam', r: 'iv', note: 'beside the patient' }] }], fluid: { k: 'maint23' } },
      { id: 'neo', t: 'Neonate', lines: [{ t: 'Treatment', items: [{ d: 'cefotaxime', r: 'mening' }, { d: 'ampicillin', r: 'mening' }, { d: 'vancomycin', r: 'iv', note: 'severe' }] }], fluid: { k: 'neo' } }],
    comp: ['SIADH', 'Subdural effusion', 'Hydrocephalus', 'Deafness (hearing test before discharge)', 'Seizures'] });
  c({ id: 'epilepsy', sys: 'cns', t: 'Epilepsy', ar: 'الصرع', src: 'K p94–95', sx: { convulsion: 3 },
    about: 'Afebrile convulsions in a child normal between attacks ± aura; diagnosis by EEG after excluding metabolic causes.', inv: ['RBG, Ca, electrolytes (normal)', 'EEG', 'MRI/CT if focal'],
    variants: [{ id: 'gen', t: 'Generalised (all types)', lines: [{ t: 'Treatment', items: [{ d: 'valproate', r: 'start' }, { d: 'valproate', r: 'maint' }] }] },
      { id: 'focal', t: 'Focal', lines: [{ t: 'Treatment', items: [{ d: 'carbamazepine', r: 'start' }] }] },
      { id: 'neo', t: 'Neonate', lines: [{ t: 'Treatment', items: [{ d: 'phenobarbitone', r: 'maint' }] }] }],
    traps: ['Write "Tegretol (carbamazepine) 200 mg", never just "carbamazepine": confused with carbimazole.', 'Infantile spasms: prednisolone.'] });
  c({ id: 'afebconv', sys: 'cns', t: 'Afebrile convulsion (metabolic)', ar: 'تشنج بدون حمى', src: 'K p96–99', sx: { convulsion: 3, poorfeed: 1, vomiting: 1, hypert: 1 },
    about: 'Hypoglycaemia, hypocalcaemia, hypo/hypernatraemia, epilepsy, hypertensive encephalopathy. Always measure BP.', inv: ['RBG', 'Ca ± Mg', 'Na (if D/V)', 'RFT', 'EEG ± MRI if all normal'],
    variants: [{ id: 'glc', t: 'Hypoglycaemia', when: 'RBG < 46 mg/dL (< 54 malnourished)', lines: [{ t: 'Treatment', items: [{ d: 'dextrose10', r: 'bolus' }] }], fluid: { k: 'maint', why: 'Recheck RBG after 1–2 h; still low → D10 as maintenance (100 mL/kg/day).' } },
      { id: 'ca', t: 'Hypocalcaemia', when: 'Ca < 8 mg/dL', lines: [{ t: 'Treatment', items: [{ d: 'cagluc', r: 'load' }, { d: 'cagluc', r: 'maint' }, { d: 'mgso4', r: 'hypoMg', note: 'if persistent (low Mg)' }] }] },
      { id: 'htn', t: 'Hypertensive encephalopathy', lines: [{ t: 'Treatment', items: [{ d: 'hydralazine', r: 'iv' }, { d: 'nifedipine', r: 'po' }] }] }] });
  c({ id: 'torticollis', sys: 'cns', t: 'Torticollis', ar: 'الصعر (ميلان الرقبة)', src: 'K p136', sx: { headtilt: 3 },
    about: 'Head tilted, cannot turn the neck (not meningism); afebrile unless lymphadenitis or retropharyngeal abscess; can be drug-induced (metoclopramide).', inv: ['Usually none; CBC, CRP sometimes'],
    variants: [{ id: 'op', t: 'Treatment', lines: [{ t: 'Supportive', items: [{ txt: 'Physiotherapy (stretching) and massage' }, { d: 'ibuprofen', r: 'prn' }, { d: 'mefenamic', r: 'prn' }] }] }] });

  /* ===================== Infections ===================== */
  c({ id: 'malaria', sys: 'inf', t: 'Uncomplicated malaria', ar: 'الملاريا غير المعقدة', src: 'K p102–103; P', sx: { fever: 3, vomiting: 1, headache: 1, sweating: 1 },
    about: 'Fever with a positive blood film/antigen test and no danger features.', inv: ['BFFM (thick and thin)', 'MAT / RDT', 'CBC'],
    variants: [{ id: 'op', t: 'Treatment', lines: [{ t: 'First line', items: [{ d: 'coartem', r: 'po' }, { d: 'paracetamol', r: 'prn' }] }, { t: 'Second line (failure within 4 weeks)', items: [{ d: 'dhapq', r: 'po' }] }, { t: 'Third line', items: [{ d: 'quinineTab', r: 'po' }] }] }],
    extra: ['Vivax or ovale: add primaquine (see vivax malaria).'] });
  c({ id: 'sevmalaria', sys: 'inf', t: 'Severe malaria', ar: 'الملاريا الحادة', src: 'K p100–103', sx: { fever: 3, convulsion: 2, lethargy: 3, vomiting: 2, pallor: 2, jaundice: 1, shock: 1 },
    about: 'Prostration, repeated convulsions, coma, persistent vomiting, severe anaemia, jaundice, shock, hypoglycaemia, haemoglobinuria.', inv: ['BFFM (hyperparasitaemia; 4–6-hourly for 3 days if negative)', 'MAT', 'CBC (anaemia, low platelets)', 'RBG (hypoglycaemia)', 'RFT'],
    variants: [{ id: 'adm', t: 'Admitted', lines: [
      { t: 'Antimalarial (choose one)', items: [{ d: 'artesunateIV', r: 'sev', note: 'preferred' }, { d: 'quinine', r: 'sev' }, { d: 'artemether', r: 'sev', note: 'if the above are unavailable' }] },
      { t: 'Pre-referral', items: [{ d: 'artesunatePR', r: 'pre' }] }, { t: 'Supportive', items: [{ d: 'paracetamol', r: 'pr' }, { d: 'diazepam', r: 'iv', note: 'if convulsing' }, { d: 'dextrose10', r: 'bolus', note: 'if hypoglycaemic' }] }], fluid: { k: 'maint' } }],
    extra: ['Severe anaemia: give quinine IM first, then transfuse. Hyperparasitaemia persisting on quinine: consider exchange transfusion.', 'Switch to oral treatment (Coartem) when able.'] });
  c({ id: 'vivax', sys: 'inf', t: 'Vivax (or ovale) malaria', ar: 'ملاريا فايفاكس', src: 'K p104', sx: { fever: 3 },
    about: 'P. vivax/ovale have a dormant liver stage (relapse); vivax can be severe.', inv: ['BFFM', 'Rapid antigen test', 'G6PD before primaquine'],
    variants: [{ id: 'op', t: 'Treatment', lines: [{ t: 'Blood stage then liver stage', items: [{ d: 'coartem', r: 'po' }, { d: 'primaquine', r: 'vivax' }] }] }] });
  c({ id: 'congmal', sys: 'neo', t: 'Congenital malaria', ar: 'الملاريا الخلقية', src: 'K p103', amax: 1, sx: { fever: 3, pallor: 1, jaundice: 1 },
    about: 'Febrile neonate whose mother had malaria in the 9th month.', inv: ['BFFM (confirm by MAT)', 'CBC (thrombocytopenia)'],
    variants: [{ id: 'adm', t: 'Treatment', lines: [{ t: 'As severe malaria', items: [{ d: 'quinine', r: 'sev' }, { d: 'artesunateIV', r: 'sev', note: 'alternative' }] }], fluid: { k: 'neo' } }] });
  c({ id: 'measles', sys: 'inf', t: 'Measles', ar: 'الحصبة', src: 'K p118', sx: { rash: 3, fever: 2, redeye: 3, cough: 2, coryza: 2 },
    about: 'High fever with coryza, cough, conjunctivitis, then rash.', inv: ['CBC, BFFM, stool general'],
    variants: [{ id: 'op', t: 'Outpatient', lines: [{ t: 'Treatment', items: [{ d: 'vitA', r: 'measles' }, { d: 'gentamicinEye', r: 'std' }, { d: 'chloramphenicolEye', r: 'std', note: 'alternative' }, { d: 'ibuprofen', r: 'prn' }, { d: 'mefenamic', r: 'prn' }] }, { t: 'If secondary infection', items: [{ d: 'amoclan', r: 'po' }] }] },
      { id: 'adm', t: 'Admitted (isolation)', when: 'Complications (pneumonia, GE) or danger signs', lines: [{ t: 'Treatment', items: [{ d: 'vitA', r: 'measles' }, { d: 'ceftriaxone', r: 'std' }, { d: 'paracetamol', r: 'pr' }] }], fluid: { k: 'maint' } }],
    comp: ['Pneumonia', 'Diarrhoea', 'Otitis media', 'Keratitis/blindness', 'Encephalitis', 'Malnutrition'] });
  c({ id: 'dengue', sys: 'inf', t: 'Dengue fever', ar: 'حمى الضنك', src: 'K p119', sx: { fever: 3, headache: 2, rash: 2, jointpain: 2, bleeding: 2 },
    about: 'Fever, severe headache, maculopapular rash, arthralgia, myalgia; or bleeding and shock.', inv: ['CBC: early leukopenia, high haematocrit, low platelets', 'Tourniquet test', 'PCR if available'],
    variants: [{ id: 'adm', t: 'Supportive', lines: [{ t: 'Treatment', items: [{ d: 'paracetamol', r: 'prn', note: 'ONLY paracetamol' }, { d: 'omeprazole', r: 'iv' }, { d: 'cimetidine', r: 'iv' }, { d: 'ceftriaxone', r: 'std', note: '± (local practice)' }] }], fluid: { k: 'maint', why: "Ringer's lactate or NS." } }],
    traps: ['No NSAIDs (mefenamic acid, ibuprofen, diclofenac, aspirin) in dengue.'] });
  c({ id: 'mumps', sys: 'inf', t: 'Mumps', ar: 'النكاف', src: 'K p135', sx: { parotid: 3, fever: 1, poorfeed: 1 },
    about: 'Parotid swelling that lifts the ear lobe (a lymph node does not); usually mild fever; non-tender.', inv: ['Not routine'],
    variants: [{ id: 'op', t: 'Treatment', lines: [{ t: 'Symptomatic', items: [{ d: 'paracetamol', r: 'prn' }, { txt: 'Avoid acidic food (lemon, karkadi)' }] }] }], comp: ['Orchitis', 'Meningitis', 'Pancreatitis'] });
  c({ id: 'lymphadenitis', sys: 'inf', t: 'Pyogenic lymphadenitis', ar: 'التهاب الغدد الليمفاوية الصديدي', src: 'K p133–134', sx: { neckmass: 3, fever: 2 },
    about: 'Tender neck or submandibular lump + fever. Night sweats/weight loss: TB or lymphoma; red eyes: Kawasaki; cat contact: cat scratch.', inv: ['CBC, ESR, CRP', 'Chest X-ray (hilar nodes)', 'Excision biopsy if atypical or suspicious'],
    variants: [{ id: 'op', t: 'Outpatient', lines: [{ t: 'Treatment', items: [{ d: 'amoclan', r: 'po' }, { d: 'cefuroximePO', r: 'po' }, { d: 'metronidazole', r: 'po' }, { d: 'paracetamol', r: 'prn' }] }] },
      { id: 'adm', t: 'Admitted (toxic)', lines: [{ t: 'Treatment', items: [{ d: 'cefuroxime', r: 'iv' }, { d: 'ceftriaxone', r: 'std', note: '+ benzylpenicillin, alternative' }, { d: 'vancomycin', r: 'iv', note: 'alternative' }, { d: 'metronidazole', r: 'iv' }] }] }] });
  c({ id: 'conjunct', sys: 'inf', t: 'Conjunctivitis', ar: 'التهاب الملتحمة', src: 'K p140', amin: 1, sx: { redeye: 3, eyedisch: 3 },
    about: 'Red eye with discharge.', inv: ['Clinical'],
    variants: [{ id: 'op', t: 'Treatment', lines: [{ t: 'Eye drops', items: [{ d: 'chloramphenicolEye', r: 'std' }, { d: 'gentamicinEye', r: 'std' }, { d: 'ciprofloxacinEye', r: 'std' }] }] }],
    extra: ['Malnourished child: add vitamin A. Severe/complicated: ophthalmology.'] });

  /* ===================== Blood ===================== */
  c({ id: 'scdpain', sys: 'blood', t: 'Sickle cell disease: painful crisis', ar: 'نوبة ألم الأنيميا المنجلية', src: 'K p105–107', sx: { sicklehx: 3, jointpain: 2, dactylitis: 3, abdpain: 1, irritable: 1 },
    about: 'Joint, back or abdominal pain; hand–foot swelling in infants; crying.', inv: ['CBC + retics (aplastic: low; hyperhaemolytic: high)', 'BFFM / MAT if febrile'],
    variants: [{ id: 'adm', t: 'Admitted', lines: [
      { t: 'Analgesia ladder', items: [{ d: 'ibuprofen', r: 'scd' }, { d: 'diclofenac', r: 'im', note: 'severe pain' }, { d: 'pethidine', r: 'im' }, { d: 'morphine', r: 'iv' }] },
      { t: 'Antibiotic', items: [{ d: 'ceftriaxone', r: 'std' }, { d: 'benzylpen', r: 'std', note: '±' }] }, { t: 'Other', items: [{ d: 'folic', r: 'po' }, { d: 'zinc', r: 'ge', note: 'reduces crises' }] }], fluid: { k: 'scd' } }],
    traps: ['No IV fluid before transfusion if Hb < 5 g/dL or anaemic heart failure.', 'No furosemide with transfusion in SCD (viscosity).'],
    comp: ['Splenic sequestration (life-threatening: rapid pallor + enlarging spleen)', 'Acute chest syndrome', 'Aplastic crisis', 'Stroke', 'Priapism', 'Osteomyelitis (Salmonella)'] });
  c({ id: 'scdother', sys: 'blood', t: 'Sickle cell disease: other emergencies', ar: 'مضاعفات الأنيميا المنجلية', src: 'K p105, p108–109', sx: { sicklehx: 3, pallor: 2, spleno: 2, limbswell: 2, chestpain: 1, weakness: 1 },
    about: 'Sequestration, severe anaemia, osteomyelitis, pneumonia (atypical), stroke.', inv: ['CBC, retics', 'Blood culture, CRP, X-ray (osteomyelitis)', 'Chest X-ray'],
    variants: [
      { id: 'seq', t: 'Splenic sequestration / severe anaemia', lines: [{ t: 'Treatment', items: [{ txt: 'ABC; oxygen; IV line; group and cross-match; NS 4 mL/kg/h until blood' }] }], fluid: { k: 'transfuse', scd: 1 } },
      { id: 'osteo', t: 'Osteomyelitis', lines: [{ t: '6 weeks', items: [{ d: 'ceftriaxone', r: 'osteo' }, { d: 'ampiclox', r: 'iv', note: 'or benzylpenicillin' }, { d: 'vancomycin', r: 'osteo', note: 'alternative' }] }] },
      { id: 'pneu', t: 'Pneumonia (atypical)', lines: [{ t: 'Treatment', items: [{ d: 'erythromycin', r: 'po' }, { d: 'ceftriaxone', r: 'std' }] }] },
      { id: 'prev', t: 'Prevention (clinic)', lines: [{ t: 'Long term', items: [{ d: 'penv', r: 'scd' }, { d: 'folic', r: 'po' }, { d: 'zinc', r: 'ge' }] }] }],
    extra: ['Stroke: exchange transfusion every 3 months + hydroxyurea. Exchange also for severe acute chest syndrome, priapism, crisis not responding to simple transfusion.'] });
  c({ id: 'ida', sys: 'blood', t: 'Iron deficiency anaemia', ar: 'أنيميا نقص الحديد', src: 'K p127–128', sx: { pallor: 3, pica: 3, poorfeed: 1, tachy: 1 },
    about: 'Fatigue, pica, poor appetite; pallor ± haemic murmur, mild splenomegaly if chronic.', inv: ['CBC: low Hb, MCV, MCH; high RDW', 'Stool for hookworm'],
    variants: [{ id: 'op', t: 'Outpatient (Hb > 5, well)', lines: [{ t: 'Treatment', items: [{ d: 'saferon', r: 'tx' }, { d: 'folic', r: 'po' }, { d: 'mebendazole', r: 'po', note: 'if pica / worms' }] }],
      extra: ['Review Hb and retics after 2–4 weeks; poor response: thalassaemia, coeliac disease.'] },
      { id: 'sev', t: 'Severe anaemia (Hb < 5 or anaemic heart failure)', lines: [{ t: 'Treatment', items: [{ txt: 'Oxygen if distressed' }, { d: 'furosemide', r: 'tx' }, { d: 'benzylpen', r: 'std', note: 'if infection' }] }], fluid: { k: 'transfuse' } }],
    traps: ['No salbutamol nebuliser in anaemic heart failure (fatal mistake): oxygen and blood.'] });
  c({ id: 'sam', sys: 'blood', t: 'Severe acute malnutrition', ar: 'سوء التغذية الحاد الشديد', src: 'K p114–116; P', sx: { wtloss: 3, oedema: 2, diarrhoea: 1, poorfeed: 1 },
    about: 'Wasting (MUAC < 11.5 cm / severe wasting) or bilateral pitting oedema (kwashiorkor).', inv: ['RBG', 'CBC', 'Stool general, urine', 'BFFM'],
    variants: [
      { id: 'dh', t: 'SAM with dehydration', lines: [{ t: 'Treatment', items: [{ d: 'ceftriaxone', r: 'std', note: 'or benzylpenicillin + gentamicin' }, { d: 'zinc', r: 'ge' }, { d: 'vitA', r: 'measles', note: 'dose by age' }, { d: 'metronidazole', r: 'po' }, { d: 'folic', r: 'po', note: 'day 1 only' }] }], fluid: { k: 'resomal' } },
      { id: 'nodh', t: 'SAM without dehydration', lines: [{ t: 'Treatment', items: [{ d: 'ceftriaxone', r: 'std' }, { d: 'vitA', r: 'measles' }, { d: 'folic', r: 'po' }] }], fluid: { k: 'f75' } },
      { id: 'shock', t: 'SAM with shock', lines: [{ t: 'Treatment', items: [{ txt: 'Oxygen; keep warm' }, { d: 'ceftriaxone', r: 'std' }] }], fluid: { k: 'samShock' } }],
    traps: ['No IV fluid unless shock (fatal mistake).', 'Skin pinch and sunken eyes are unreliable in SAM.', 'No iron or multivitamins in the initial phase.'],
    extra: ['No ReSoMal: 2 L water + 1 ORS sachet + 2–3 ampoules KCl + 5 spoons sugar.'] });
  c({ id: 'ftt', sys: 'blood', t: 'Failure to thrive', ar: 'فشل النمو', src: 'K p117', amax: 24, sx: { wtloss: 3, poorfeed: 2 },
    about: 'Mostly under 6 months; consider heart disease, metabolic disorders, cleft lip/palate.', inv: ['BFFM, RBG, stool general, CBC'],
    variants: [{ id: 'adm', t: 'Admitted', lines: [{ t: 'Treatment', items: [{ d: 'ceftriaxone', r: 'std' }, { d: 'zinc', r: 'ge' }, { d: 'folic', r: 'po', note: 'if stable' }] }], fluid: { k: 'ftt' } }] });

  /* ===================== Endocrine ===================== */
  c({ id: 'dka', sys: 'endo', t: 'Diabetic ketoacidosis', ar: 'الحماض الكيتوني السكري', src: 'K p120–124', sx: { polyuria: 3, vomiting: 2, abdpain: 2, sob: 2, lethargy: 2, sunken: 1 },
    about: 'Known or new diabetes: polyuria, polydipsia, vomiting, abdominal pain, acidotic (deep) breathing, coma; dehydrated, hypotensive.', inv: ['RBG (> 300 mg/dL)', 'Urine sugar and acetone', 'Blood gas if available', 'Electrolytes (K)', 'BFFM, CBC (precipitant)'],
    variants: [{ id: 'adm', t: 'Admitted', lines: [{ t: 'Insulin (start 1 hour after fluids)', items: [{ d: 'insulinReg', r: 'dka' }] }, { t: 'Monitoring', items: [{ txt: 'RBG and urine sugar/acetone hourly; vital signs; K after urine is passed' }] }], fluid: { k: 'dka' } }],
    extra: ['After acidosis clears: known diabetic → usual mixed insulin at meal time; new → mixed insulin 0.5–0.75 U/kg/day (⅔ morning, ⅓ evening) or regular 0.25 U/kg 6-hourly first.'],
    comp: ['Cerebral oedema', 'Hypokalaemia', 'Hypoglycaemia'] });

  /* ===================== Emergencies, poisoning, allergy ===================== */
  c({ id: 'shock', sys: 'emerg', t: 'Shock', ar: 'الصدمة', src: 'K p112–113', sx: { shock: 3, lethargy: 2, oliguria: 1 },
    about: 'Lethargic, rapid weak pulse, cold extremities, capillary refill > 3 s, oliguria; hypotension is late.', inv: ['RBG', 'CBC, group and cross-match', 'Electrolytes, RFT', 'Blood culture'],
    variants: [{ id: 'well', t: 'Well-nourished child', lines: [{ t: 'Then', items: [{ d: 'ceftriaxone', r: 'severe', note: 'septic shock after 3 boluses' }, { d: 'dopamine', r: 'inf', note: 'cardiogenic' }, { d: 'adrenalineInf', r: 'inf', note: 'septic shock' }, { d: 'hydrocortisone', r: 'ana', note: 'vasopressor-resistant' }] }], fluid: { k: 'shock' } },
      { id: 'sam', t: 'Malnourished child', lines: [{ t: 'Then', items: [{ d: 'ceftriaxone', r: 'std' }] }], fluid: { k: 'samShock' } }] });
  c({ id: 'anaphylaxis', sys: 'emerg', t: 'Anaphylaxis / allergic reaction', ar: 'الحساسية المفرطة', src: 'K p137–138', sx: { itch: 2, rash: 2, tongueswell: 3, wheeze: 2, allergen: 3, stridor: 1, shock: 1 },
    about: 'Urticaria, itch; severe: bronchospasm, tongue swelling, facial oedema, shock.', inv: ['Not routine'],
    variants: [{ id: 'mild', t: 'Rash/itch only', lines: [{ t: 'Treatment', items: [{ d: 'chlorphenamine', r: 'po' }, { d: 'chlorphenamine', r: 'inj', note: 'or injection' }] }] },
      { id: 'severe', t: 'Severe anaphylaxis', lines: [{ t: 'Treatment in order', items: [{ d: 'adrenalineSC', r: 'ana', note: 'IM first' }, { d: 'hydrocortisone', r: 'ana' }, { d: 'chlorphenamine', r: 'inj' }, { d: 'adrenalineNeb', r: 'neb', note: 'if stridor' }, { d: 'salbutamolNeb', r: 'neb', note: 'if wheeze' }] }], fluid: { k: 'shock' } }] });
  c({ id: 'scorpion', sys: 'emerg', t: 'Scorpion sting', ar: 'لدغة العقرب', src: 'K p110–111, p152', sx: { sting: 3, sweating: 2, vomiting: 1, shock: 1, hypert: 1 },
    about: 'Pain, vomiting, sweating; check pulse and BP. Shock is anaphylactic or neurogenic, not hypovolaemic.', inv: ['Pulse, BP, RBG'],
    variants: [{ id: 'none', t: 'History only, no signs', lines: [{ t: 'Treatment', items: [{ d: 'chlorphenamine', r: 'inj' }, { d: 'hydrocortisone', r: 'sting' }, { txt: 'Observe 6 hours, then discharge' }] }] },
      { id: 'local', t: 'Local pain / paraesthesia', lines: [{ t: 'Treatment', items: [{ d: 'antiscorpion', r: 'local' }, { d: 'chlorphenamine', r: 'inj' }, { d: 'hydrocortisone', r: 'sting' }, { d: 'paracetamol', r: 'prn' }] }] },
      { id: 'sys', t: 'Systemic (cranial, autonomic or neuromuscular signs)', lines: [{ t: 'Treatment', items: [{ d: 'antiscorpion', r: 'systemic' }, { d: 'hydrocortisone', r: 'sting' }, { d: 'chlorphenamine', r: 'inj' }, { d: 'adrenalineSC', r: 'ana', note: 'anaphylactic shock' }, { d: 'adrenalineInf', r: 'inf', note: 'hypotension (infants)' }, { d: 'nifedipine', r: 'po', note: 'hypertension (adolescents)' }, { d: 'cagluc', r: 'load', note: 'evidence of benefit; check pulse first' }] }],
        fluid: { k: 'maint23', why: 'If fluid is needed give ⅓–½ maintenance: no IV boluses (fatal mistake).' } }],
    traps: ['No IV fluid bolus in scorpion sting (spreads toxin, pulmonary oedema).'] });
  c({ id: 'poison', sys: 'emerg', t: 'Drug poisoning', ar: 'التسمم الدوائي', src: 'K p125', sx: { ingest: 3, lethargy: 1, vomiting: 1 },
    about: 'Identify the drug. Within 1–2 hours of ingestion: gastric lavage.', inv: ['RBG', 'Drug-specific tests if available'],
    variants: [{ id: 'er', t: 'Emergency', lines: [{ t: 'Treatment', items: [{ txt: 'Gastric lavage within 1–2 h: NG tube, NS 10 mL/kg in and out until clear (not for kerosene or corrosives)' }, { txt: 'Specific antidote if known; supportive care' }] }] }] });
  c({ id: 'kerosene', sys: 'emerg', t: 'Kerosene poisoning', ar: 'تسمم الجاز', src: 'K p125', sx: { kerosene: 3, cough: 1, sob: 1 },
    about: 'Aspiration pneumonitis risk.', inv: ['Chest X-ray on day 2'],
    variants: [{ id: 'adm', t: 'Admitted', lines: [{ t: 'Treatment', items: [{ txt: 'NO gastric lavage' }, { txt: 'Oxygen' }, { d: 'benzylpen', r: 'std' }, { d: 'hydrocortisone', r: 'sting' }] }] }] });
  c({ id: 'hairdye', sys: 'emerg', t: 'Hair dye (PPD) poisoning', ar: 'تسمم صبغة الشعر', src: 'K p126', sx: { hairdye: 3, tongueswell: 2, stridor: 2, oliguria: 1 },
    about: 'Neck and tongue swelling, stridor; later rhabdomyolysis and AKI.', inv: ['RFT, CK, urine'],
    variants: [{ id: 'adm', t: 'Admitted', lines: [{ t: 'Treatment', items: [{ d: 'adrenalineSC', r: 'ana', note: 'if swelling/anaphylaxis' }, { d: 'chlorphenamine', r: 'inj' }, { d: 'hydrocortisone', r: 'sting' }, { d: 'benzylpen', r: 'std', note: 'or cefuroxime if infection' }] }] }],
    traps: ['Avoid gastric lavage.'], extra: ['ENT urgently if facial oedema increases; ICU if distressed, reduced consciousness or irregular pulse.'] });
  c({ id: 'drowning', sys: 'emerg', t: 'Drowning', ar: 'الغرق', src: 'K p138', sx: { drown: 3 },
    about: 'Submersion; hypothermia; clear chest or crackles (contaminated water).', inv: ['Na (hyponatraemia → cerebral oedema)', 'RBG', 'CBC'],
    variants: [{ id: 'adm', t: 'Treatment', lines: [{ t: 'Treatment', items: [{ txt: 'ABC; suction; oxygen; remove wet clothes; NG tube; rewarm if < 32 °C' }, { d: 'ceftriaxone', r: 'std' }, { d: 'benzylpen', r: 'std' }, { d: 'hydrocortisone', r: 'sting', note: '±' }] }] }] });
  c({ id: 'electric', sys: 'emerg', t: 'Electric shock', ar: 'الصعقة الكهربائية', src: 'K p139', sx: { electric: 3 },
    about: 'Burns, distress, loss of consciousness, red urine (myoglobinuria).', inv: ['ECG', 'Urine (myoglobin), CK, RFT'],
    variants: [{ id: 'adm', t: 'Treatment', lines: [{ t: 'Treatment', items: [{ txt: 'ABC; IV NS or Ringer\'s lactate keeping urine ≥ 2 mL/kg/h; furosemide or mannitol for myoglobinuria' }] }] }] });

  /* ===================== Joints and skin ===================== */
  c({ id: 'septicarth', sys: 'msk', t: 'Septic arthritis / osteomyelitis', ar: 'التهاب المفصل الصديدي', src: 'K p141', sx: { jointswell: 3, fever: 3, limbswell: 2 },
    about: 'Fever (most important) with a hot, swollen, very painful joint.', inv: ['Joint aspiration and culture (most important)', 'CBC, CRP, ESR', 'Blood culture', 'X-ray / ultrasound'],
    variants: [{ id: 'adm', t: 'Admitted (3 weeks)', lines: [{ t: 'Treatment', items: [{ d: 'ceftriaxone', r: 'severe' }, { d: 'benzylpen', r: 'std' }, { d: 'ibuprofen', r: 'prn' }] }] }] });
  c({ id: 'jia', sys: 'msk', t: 'Juvenile idiopathic arthritis / SLE', ar: 'التهاب المفاصل الروماتويدي اليفعي', src: 'K p141', sx: { jointpain: 2, jointswell: 2, fever: 1, rash: 1 },
    about: 'JIA: arthritis > 6 weeks under 16 years; SLE: teenager, malar rash, weight loss.', inv: ['CBC, ESR, CRP', 'ANA, anti-dsDNA (SLE)', 'RFT'],
    variants: [{ id: 'op', t: 'Treatment', lines: [{ t: 'JIA', items: [{ d: 'ibuprofen', r: 'prn' }, { d: 'diclofenac', r: 'pr' }, { d: 'prednisolone', r: 'asthma', note: 'low dose' }] }, { t: 'SLE', items: [{ txt: 'Hydroxychloroquine + prednisolone ± NSAID ± cytotoxics (specialist)' }] }] }] });
  c({ id: 'nappy', sys: 'msk', t: 'Napkin (diaper) dermatitis', ar: 'التهاب الحفاضة', src: 'K p149', amax: 36, sx: { nappy: 3, itch: 1 },
    about: 'Rash in the nappy area; candida if satellite lesions or itch.', inv: ['Clinical'],
    variants: [{ id: 'op', t: 'Treatment', lines: [{ t: 'Treatment', items: [{ d: 'zincOxide', r: 'std' }, { d: 'clotrimazole', r: 'std', note: 'if candida' }, { d: 'ampiclox', r: 'po', note: 'if secondary bacterial infection' }, { d: 'zinc', r: 'ge', note: 'chronic diarrhoea' }] }] }] });

  window.HO_SX = S;
  window.HO_DX = X;
  window.HO_SYS = { resp: ['Chest and ENT', 'الصدر والأنف والأذن'], cvs: ['Heart', 'القلب'], neo: ['Newborn', 'حديثو الولادة'], gi: ['Gut and liver', 'الجهاز الهضمي والكبد'],
    renal: ['Kidney', 'الكلى'], cns: ['Nervous system', 'الجهاز العصبي'], inf: ['Infections', 'الأمراض المعدية'], blood: ['Blood and nutrition', 'الدم والتغذية'],
    endo: ['Endocrine', 'الغدد'], emerg: ['Emergencies and poisoning', 'الطوارئ والتسمم'], msk: ['Joints and skin', 'المفاصل والجلد'] };
})();
