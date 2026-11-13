/* Student Master Review: the book catalogue.
   Every screen (Home, the three libraries, search, My Library, Progress) is built from this list.
   To release a planned book: set status to 'available', give it its url, and list its real tools. */
window.SMR = window.SMR || {};
/* home: the covers on each Home stand, back to front (the last one stands in front; owner, 12 Nov 2026: Anatomy and Surgery in front) */
SMR.sections = [
  { id: 'basic-sciences', key: 'basic', home: ['community-medicine', 'physiology', 'pathology', 'microbiology', 'anatomy'], layout: 'v' },
  { id: 'clinical', key: 'clinical', home: ['medicine', 'gynecology', 'pediatrics', 'obstetrics', 'surgery'], layout: 'h' },
  { id: 'house-officer', key: 'house', home: ['ho-pediatrics', 'house-officer', 'ho-medicine'], layout: 'h' }
];

/* Planned tools of every House Officer handbook (owner's plan, not built yet). */
SMR.hoTools = [
  { icon: 'pill', en: 'Drug Doses', ar: 'جرعات الأدوية',
    den: 'Medicines, routes and dosing guidance.', dar: 'الأدوية وطرق إعطائها وإرشادات الجرعات.' },
  { icon: 'notes', en: 'Disease Notes', ar: 'ملاحظات الأمراض',
    den: 'Presentation, assessment and management.', dar: 'الصورة السريرية والتقييم والعلاج.' },
  { icon: 'history', en: 'History Taking', ar: 'أخذ التاريخ المرضي',
    den: 'Structured questions and key symptoms.', dar: 'أسئلة منظّمة والأعراض المهمة.' },
  { icon: 'steth', en: 'Examination', ar: 'الفحص السريري',
    den: 'Step-by-step clinical assessment.', dar: 'خطوات الفحص السريري.' }
];

SMR.books = [
  /* Basic Sciences: planned */
  { id: 'anatomy', section: 'basic-sciences', title: 'Anatomy', series: 'Master Review', status: 'soon',
    cover: 'img/covers/anatomy.webp', w: 480, h: 720,
    sub: { en: 'Structure & clinical anatomy', ar: 'البنية والتشريح السريري' },
    areas: ['Gross Anatomy', 'Neuroanatomy', 'Histology', 'Embryology'], kw: 'تشريح' },
  { id: 'physiology', section: 'basic-sciences', title: 'Physiology', series: 'Master Review', status: 'soon',
    cover: 'img/covers/physiology.webp', w: 480, h: 720,
    sub: { en: 'How the body functions', ar: 'كيف يعمل الجسم' },
    areas: ['Cardiovascular', 'Respiratory', 'Renal', 'Neurophysiology'], kw: 'فسيولوجيا وظائف الأعضاء' },
  { id: 'biochemistry', section: 'basic-sciences', title: 'Biochemistry', series: 'Master Review', status: 'soon',
    cover: 'img/covers/biochemistry.webp', w: 480, h: 720,
    sub: { en: 'Molecules, metabolism & clinical biochemistry', ar: 'الجزيئات والاستقلاب والكيمياء الحيوية السريرية' },
    areas: ['Biomolecules', 'Enzymes & Kinetics', 'Carbohydrate Metabolism', 'Lipid Metabolism', 'Amino Acid Metabolism', 'Molecular Biology', 'Vitamins & Nutrition', 'Clinical Biochemistry'], kw: 'كيمياء حيوية الكيمياء الحيوية بايوكيمستري biochem' },
  { id: 'pathology', section: 'basic-sciences', title: 'Pathology', series: 'Master Review', status: 'soon',
    cover: 'img/covers/pathology.webp', w: 480, h: 720,
    sub: { en: 'Mechanisms of disease', ar: 'آليات المرض' },
    areas: ['General Pathology', 'Systemic Pathology', 'Cellular Injury', 'Neoplasia'], kw: 'علم الأمراض باثولوجي' },
  { id: 'pharmacology', section: 'basic-sciences', title: 'Pharmacology', series: 'Master Review', status: 'soon',
    cover: 'img/covers/pharmacology.webp', w: 480, h: 720,
    sub: { en: 'Drugs, actions & adverse effects', ar: 'الأدوية وتأثيراتها وآثارها الجانبية' },
    areas: ['General Pharmacology', 'Autonomic Pharmacology', 'Cardiovascular Drugs', 'Central Nervous System', 'Antimicrobial Agents', 'Endocrine Pharmacology', 'Chemotherapy', 'Adverse Effects & Interactions'], kw: 'علم الأدوية فارماكولوجي أدوية pharma' },
  { id: 'microbiology', section: 'basic-sciences', title: 'Microbiology', series: 'Master Review', status: 'soon',
    cover: 'img/covers/microbiology.webp', w: 480, h: 720,
    sub: { en: 'Microbes & infection', ar: 'الميكروبات والعدوى' },
    areas: ['Bacteriology', 'Virology', 'Mycology', 'Parasitology'], kw: 'الأحياء الدقيقة مايكروبيولوجي' },
  { id: 'community-medicine', section: 'basic-sciences', title: 'Community Medicine', series: 'Master Review', status: 'soon',
    cover: 'img/covers/community-medicine.webp', w: 480, h: 720,
    sub: { en: 'Population health & prevention', ar: 'صحة المجتمع والوقاية' },
    areas: ['Epidemiology', 'Biostatistics', 'Prevention', 'Public Health'], kw: 'طب المجتمع' },

  /* Clinical: three live apps (connected by their real addresses) and Medicine (planned) */
  { id: 'medicine', section: 'clinical', title: 'Medicine', series: 'Master Review', status: 'soon',
    cover: 'img/covers/medicine.webp', w: 480, h: 720,
    sub: { en: 'Internal medicine', ar: 'الطب الباطني' },
    areas: ['Cardiology', 'Respiratory Medicine', 'Gastroenterology', 'Nephrology', 'Neurology', 'Endocrinology', 'Hematology', 'Rheumatology'],
    kw: 'باطنية الطب الباطني' },
  { id: 'surgery', section: 'clinical', title: 'Surgery', series: 'Master Review', status: 'available',
    app: 'Surgery Master Review', url: 'https://srg.studentmasterreview.com/',
    cover: 'img/covers/surgery.webp', w: 480, h: 678, edition: { en: '1st edition', ar: 'الطبعة الأولى' },
    sub: { en: 'The full surgery book with its study tools', ar: 'كتاب الجراحة كاملًا مع أدوات المذاكرة' },
    tools: ['Book reader', 'Question bank', 'Flashcards', 'Rapid Review', 'Surgical drugs', 'Clinical examination & OSCE'],
    kw: 'جراحة' },
  { id: 'pediatrics', section: 'clinical', title: 'Pediatrics', series: 'Master Review', status: 'available',
    app: 'Pediatric Master Review', url: 'https://ped.studentmasterreview.com/',
    cover: 'img/covers/pediatrics.webp', w: 480, h: 678, edition: { en: '1st edition', ar: 'الطبعة الأولى' },
    sub: { en: 'The full pediatrics book with its study tools', ar: 'كتاب طب الأطفال كاملًا مع أدوات المذاكرة' },
    tools: ['Book reader', 'Question bank', 'Flashcards', 'Rapid Review', 'Pediatric drugs', 'OSCE'],
    kw: 'أطفال طب الأطفال paediatrics pediatric' },
  { id: 'obstetrics', section: 'clinical', title: 'Obstetrics', series: 'Master Review', status: 'available',
    app: 'Obstetrics Master Review', url: 'https://obs.studentmasterreview.com/',
    cover: 'img/covers/obstetrics.webp', w: 480, h: 678, edition: { en: '4th edition', ar: 'الطبعة الرابعة' },
    sub: { en: 'The full obstetrics book with its study tools', ar: 'كتاب التوليد كاملًا مع أدوات المذاكرة' },
    tools: ['Book reader', 'Question bank', 'Flashcards', 'Rapid Review', 'Obstetric drugs', 'OSCE'],
    kw: 'توليد obstetric obs' },
  { id: 'gynecology', section: 'clinical', title: 'Gynecology', series: 'Master Review', status: 'soon',
    cover: 'img/covers/gynecology.webp', w: 480, h: 720,
    sub: { en: 'Gynecology for clinical students', ar: 'أمراض النساء لطلاب المرحلة السريرية' },
    areas: ['Menstrual Disorders', 'Benign Gynecology', 'Infertility', 'Contraception', 'Gynecologic Oncology', 'Pelvic Floor Disorders', 'Infections', 'Gynecologic Emergencies'],
    kw: 'نساء أمراض النساء gynaecology gyn gyne' },
  { id: 'psychiatry', section: 'clinical', title: 'Psychiatry', series: 'Master Review', status: 'soon',
    cover: 'img/covers/psychiatry.webp', w: 480, h: 720,
    sub: { en: 'Mental health for clinical students', ar: 'الطب النفسي لطلاب المرحلة السريرية' },
    areas: ['Clinical Assessment', 'Mood Disorders', 'Psychotic Disorders', 'Anxiety & OCD', 'Trauma & Stress', 'Substance Use Disorders', 'Child & Adolescent Psychiatry', 'Psychiatric Emergencies'], kw: 'الطب النفسي نفسية psych' },
  { id: 'tropical-medicine', section: 'clinical', title: 'Tropical Medicine', series: 'Master Review', status: 'soon',
    cover: 'img/covers/tropical-medicine.webp', w: 480, h: 720,
    sub: { en: 'Infections of hot climates', ar: 'الأمراض المدارية والمعدية' },
    areas: ['Malaria', 'Tuberculosis', 'HIV Medicine', 'Parasitic Infections', 'Arboviral Diseases', 'Enteric Infections', 'Neglected Tropical Diseases', 'Clinical Approach'], kw: 'طب المناطق الحارة الأمراض المدارية tropical' },
  { id: 'forensic-medicine', section: 'clinical', title: 'Forensic Medicine', series: 'Master Review', status: 'soon',
    cover: 'img/covers/forensic-medicine.webp', w: 480, h: 720,
    sub: { en: 'Medicine and the law', ar: 'الطب الشرعي والقانون' },
    areas: ['Medical Jurisprudence', 'Identification', 'Death & Postmortem Changes', 'Forensic Traumatology', 'Toxicology', 'Evidence & Documentation', 'Forensic Psychiatry', 'Ethics & Consent'], kw: 'الطب الشرعي شرعي forensic' },
  /* House Officer: four planned handbooks */
  { id: 'ho-pediatrics', section: 'house-officer', title: 'Pediatrics', series: 'House Officer Handbook', status: 'soon',
    cover: 'img/covers/ho-pediatrics.webp', w: 480, h: 655, ho: true, kw: 'أطفال امتياز' },
  { id: 'ho-obstetrics', section: 'house-officer', title: 'Obstetrics & Gynaecology', series: 'House Officer Handbook', status: 'soon',
    cover: 'img/covers/ho-obstetrics.webp', w: 480, h: 655, ho: true, kw: 'توليد امتياز' },
  { id: 'ho-surgery', section: 'house-officer', title: 'Surgery', series: 'House Officer Handbook', status: 'soon',
    cover: 'img/covers/ho-surgery.webp', w: 480, h: 649, ho: true, kw: 'جراحة امتياز' },
  { id: 'ho-medicine', section: 'house-officer', title: 'Medicine', series: 'House Officer Handbook', status: 'soon',
    cover: 'img/covers/ho-medicine.webp', w: 480, h: 645, ho: true, kw: 'باطنية امتياز' }
];
/* The series cover shown on the House Officer stand (not a book of its own). */
SMR.covers = { 'house-officer': { cover: 'img/covers/house-officer.webp', w: 480, h: 720, title: 'House Officer Handbook' } };
