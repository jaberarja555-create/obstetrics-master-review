-- اشرح لي: specialities (owner, 18 Nov 2026: "increase the platform to other specialities").
-- Medicine, Laboratory Science, Nursing, Dentistry, Pharmacy; each subject and course belongs to one. Safe to run again.
create table if not exists specialties (id text primary key, ar text, en text, icon text, about_ar text, about_en text, img text, sort int default 0);
alter table subjects add column if not exists spec text default 'medicine';
alter table courses add column if not exists spec text default 'medicine';
alter table specialties enable row level security;
drop policy if exists r on specialties; create policy r on specialties for select using (true);
drop policy if exists w on specialties; create policy w on specialties for all using (ish_do('cats', 'edit')) with check (ish_do('cats', 'edit'));
grant select on specialties to anon, authenticated; grant insert, update, delete on specialties to authenticated;
insert into specialties (id, ar, en, icon, about_ar, about_en, img, sort) values
  ('medicine', 'الطب البشري', 'Medicine', 'steth', 'يتناول تشخيص الأمراض وعلاجها لدى مختلف الفئات العمرية، مع التركيز على الرعاية الشاملة والوقاية.', 'Diagnosis and treatment of disease at every age, with whole-person care and prevention.', 'img/sp_medicine.webp', 0),
  ('lab', 'علوم المختبرات الطبية', 'Laboratory Science', 'flask', 'يختص بإجراء التحاليل المخبرية وتشخيص الأمراض ومتابعة العلاج باستخدام أحدث التقنيات.', 'Laboratory tests that diagnose disease and follow treatment with modern techniques.', 'img/sp_lab.webp', 1),
  ('nursing', 'التمريض', 'Nursing', 'nurse', 'يُعنى بتقديم الرعاية الصحية الشاملة للمرضى ودعمهم خلال العلاج والوقاية وإعادة التأهيل.', 'Complete care of patients, supporting them through treatment, prevention and rehabilitation.', 'img/sp_nursing.webp', 2),
  ('dentistry', 'طب وجراحة الأسنان', 'Dentistry', 'tooth', 'يركز على صحة الفم والأسنان وتشخيص اضطراباتها وعلاجها والوقاية منها.', 'Oral and dental health: diagnosis, treatment and prevention of their disorders.', 'img/sp_dentistry.webp', 3),
  ('pharmacy', 'الصيدلة', 'Pharmacy', 'pill', 'تهتم بدراسة الأدوية وآلية عملها وتحضيرها وضمان استخدامها الآمن والفعّال.', 'Medicines, how they work, how they are made, and their safe and effective use.', 'img/sp_pharmacy.webp', 4)
on conflict (id) do nothing;
update subjects set spec = 'medicine' where spec is null;
insert into subjects (id, cat, spec, ar, en, icon, sort) values
  ('radiology', 'clinical', 'medicine', 'الأشعة', 'Radiology', 's_xray', 20),
  ('ent', 'clinical', 'medicine', 'الأنف والأذن والحنجرة', 'ENT', 's_ear', 21),
  ('anaesthesia', 'clinical', 'medicine', 'التخدير', 'Anaesthesia', 's_mask', 22),
  ('ophthalmology', 'clinical', 'medicine', 'طب وجراحة العيون', 'Ophthalmology', 'eye', 23),
  ('dermatology', 'clinical', 'medicine', 'الأمراض الجلدية', 'Dermatology', 's_skin', 24),
  ('haematology', 'clinical', 'lab', 'أمراض الدم', 'Haematology', 's_blood', 100),
  ('clin-chem', 'basics', 'lab', 'الكيمياء السريرية', 'Clinical Chemistry', 'flask', 101),
  ('med-micro', 'basics', 'lab', 'الأحياء الدقيقة الطبية', 'Medical Microbiology', 's_micro', 102),
  ('histopath', 'clinical', 'lab', 'علم الأنسجة والخلايا المرضية', 'Histopathology & Cytology', 's_pathology', 103),
  ('blood-bank', 'clinical', 'lab', 'بنك الدم', 'Blood Bank', 's_blood', 104),
  ('parasitology', 'basics', 'lab', 'علم الطفيليات', 'Parasitology', 's_micro', 105),
  ('nurs-fund', 'basics', 'nursing', 'أساسيات التمريض', 'Fundamentals of Nursing', 'nurse', 106),
  ('nurs-medsurg', 'clinical', 'nursing', 'تمريض باطني جراحي', 'Medical-Surgical Nursing', 's_heart', 107),
  ('nurs-mat', 'clinical', 'nursing', 'تمريض الأمومة', 'Maternity Nursing', 's_obgyn', 108),
  ('nurs-ped', 'clinical', 'nursing', 'تمريض الأطفال', 'Paediatric Nursing', 's_baby', 109),
  ('nurs-comm', 'clinical', 'nursing', 'تمريض صحة المجتمع', 'Community Health Nursing', 's_community', 110),
  ('oral-anat', 'basics', 'dentistry', 'تشريح وأنسجة الفم', 'Oral Anatomy & Histology', 'tooth', 111),
  ('dent-mat', 'basics', 'dentistry', 'المواد السنية', 'Dental Materials', 'tooth', 112),
  ('operative', 'clinical', 'dentistry', 'العلاج التحفظي', 'Operative Dentistry', 'tooth', 113),
  ('prostho', 'clinical', 'dentistry', 'التركيبات', 'Prosthodontics', 'tooth', 114),
  ('ortho', 'clinical', 'dentistry', 'تقويم الأسنان', 'Orthodontics', 'tooth', 115),
  ('omfs', 'clinical', 'dentistry', 'جراحة الفم والوجه والفكين', 'Oral & Maxillofacial Surgery', 's_scalpel', 116),
  ('perio', 'clinical', 'dentistry', 'أمراض اللثة', 'Periodontics', 'tooth', 117),
  ('pharmaceutics', 'basics', 'pharmacy', 'الصيدلانيات', 'Pharmaceutics', 'pill', 118),
  ('pharm-chem', 'basics', 'pharmacy', 'الكيمياء الصيدلانية', 'Pharmaceutical Chemistry', 'flask', 119),
  ('pharmacognosy', 'basics', 'pharmacy', 'العقاقير', 'Pharmacognosy', 'leaf', 120),
  ('ph-pharmacology', 'basics', 'pharmacy', 'علم الأدوية', 'Pharmacology', 's_pharma', 121),
  ('clin-pharm', 'clinical', 'pharmacy', 'الصيدلة السريرية', 'Clinical Pharmacy', 'pill', 122)
on conflict (id) do nothing;

-- sections (owner, 18 Nov 2026): Basics, Clinical, International Exams, House Officer (Local exam, Internship exam, Clinical work)
update categories set ar = 'الامتحانات الدولية', en = 'International Exams', icon = 'world', tone = 'gold', sort = 3 where id = 'special';
update categories set sort = 4 where id = 'house';
insert into subjects (id, cat, spec, ar, en, icon, sort) values ('ho-intern', 'house', 'medicine', 'امتحان الامتياز', 'Internship exam', 'exam', 13) on conflict (id) do nothing;
update subjects set cat = 'house', ar = 'الامتحانات المحلية', en = 'Local exam' where id = 'smc';
update subjects set ar = 'العمل السريري', en = 'Clinical work', icon = 'clinic' where id = 'ho-skills';
update courses set cat = 'house' where cat = 'local';
update subjects set cat = 'house' where cat = 'local';
update courses set subject = null where subject = 'finals';
delete from subjects where id = 'finals';
delete from categories where id = 'local';

-- the lecturer's teaching sample may be an uploaded file (owner, 18 Nov 2026)
alter table lecturer_apps add column if not exists sample_file text;

-- international exams (owner, 18 Nov 2026)
insert into subjects (id, cat, spec, ar, en, icon, sort) values
  ('usmle', 'special', 'medicine', 'امتحان الترخيص الأمريكي', 'USMLE', 'world', 40),
  ('plab', 'special', 'medicine', 'امتحان الترخيص البريطاني', 'PLAB', 'world', 41),
  ('mrcp', 'special', 'medicine', 'عضوية الكلية الملكية للأطباء', 'MRCP', 'world', 42),
  ('mrcs', 'special', 'medicine', 'عضوية الكلية الملكية للجراحين', 'MRCS', 'world', 43),
  ('mrcog', 'special', 'medicine', 'عضوية الكلية الملكية لأطباء النساء والتوليد', 'MRCOG', 'world', 44),
  ('mrcpch', 'special', 'medicine', 'عضوية الكلية الملكية لطب الأطفال', 'MRCPCH', 'world', 45),
  ('ifom', 'special', 'medicine', 'امتحان IFOM الدولي', 'IFOM', 'world', 46),
  ('canada', 'special', 'medicine', 'امتحانات كندا (MCCQE)', 'Canada exams (MCCQE)', 'world', 47),
  ('australia', 'special', 'medicine', 'امتحانات أستراليا (AMC)', 'Australia exams (AMC)', 'world', 48),
  ('oet', 'special', 'medicine', 'اختبار اللغة الإنجليزية المهني', 'OET', 'world', 49),
  ('ielts', 'special', 'medicine', 'اختبار اللغة الإنجليزية', 'IELTS', 'world', 50)
on conflict (id) do update set cat = excluded.cat, ar = excluded.ar, en = excluded.en, sort = excluded.sort;

-- a picture for each subject card (owner, 18 Nov 2026)
alter table subjects add column if not exists img text;
