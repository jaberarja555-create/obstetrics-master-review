#!/usr/bin/env python3
"""SMRA Permanent Exam — build the question data.
  1. Put the owner's source (exams/*.json, index.json, resources.json) in  ishrah/exam/build/src/
  2. Run:  python3 ishrah/exam/build/pipeline.py
  -> writes ishrah/exam/js/data.js (gitignored; paid content) and prints a report.
Corrections live in build/patches.json (committed), so edits survive across accounts."""
import json, glob, re, os, collections
HERE = os.path.dirname(os.path.abspath(__file__))
SRC  = os.path.join(HERE, 'src')
OUT  = os.path.join(HERE, '..', 'js', 'data.js')
patches = json.load(open(os.path.join(HERE, 'patches.json')))
idx = json.load(open(os.path.join(SRC, 'index.json')))
titles = {e['id']: e['title'] for e in idx['exams']}
order  = [e['id'] for e in idx['exams']]
res = json.load(open(os.path.join(SRC, 'resources.json')))
imgmap = {(im['examId'], im.get('questionNumber')): im['file']
          for im in res.get('questionImages', []) if im.get('status') == 'downloaded' and im.get('file')}

LETTER = re.compile(r'^\s*[\(\[]?([A-Ha-h])[\)\.\:\-]\s+')
clean = lambda o: LETTER.sub('', o).strip()
def norm(s): s = re.sub(r'[^a-z0-9 ]', ' ', (s or '').lower()); return re.sub(r'\s+', ' ', s).strip()

SUBJ = [
 ('OBG', r'pregnan|gestat|antenatal|postpartum|post ?natal|labou?r|eclampsia|placenta|fetal|foetal|cervix|cervical|uter(us|ine)|vagin|menstru|menorrhagia|amenorrh|dysmenorrh|ovar|contracept|preeclampsia|obstetric|gynae?col|primigravida|multigravida|parity|ectopic|miscarriage|abortion|puerper|lochia|episiotomy|breech|nipple discharge|breast lump|breast mass|mammogra|\bhrt\b|menopaus|fibroid|endometri|pcos|pelvic inflam|\bpid\b|cervical smear|pap smear|bishop score|oxytocin|misoprostol|\bpph\b|antepartum|intrapartum|preterm labou?r|pregnant'),
 ('PAED', r'neonat|infant|child|paediatr|pediatr|newborn|immuni[sz]ation|vaccine|rickets|kawasaki|intussuscept|pyloric|hirschsprung|congenital|months? old|years? old (boy|girl|child)|yrs? old|breast ?fed|weaning|developmental mile|fontan|imci|malnourish|kwashiorkor|marasmus|puberty|pubertal|wilms|neuroblastoma|ewing|cerebral palsy|down syndrome|turner|klinefelter|cystic fibrosis|phenylketonuria|galactosa|maple syrup|crigler|biliary atresia|duodenal atresia|undescended test|nocturnal enuresis|febrile convulsion|bronchiolitis|croup|apgar'),
 ('SURG', r'appendic|hernia|cholecyst|gallbladder|biliary colic|bowel obstruct|intestinal obstruct|perforat|laparotom|laparoscop|trauma|fracture|dislocat|burn|abscess|thyroidectom|peritonitis|acute abdomen|surgical|post ?operat|pre ?operat|incision|anal fissure|haemorrhoid|hemorrhoid|fistula|volvulus|diverticul|varicose|leg ulcer|amputation|melanoma|basal cell|squamous cell|lipoma|sebaceous|goit(re|er)|parathyroid|pancreatit|splenectomy|cholangi|obstructive jaundice|courvoisier|dysphagia|oesophag|esophag|gastrectomy|stoma|colostomy|appendix|limb ischaem|claudicat|aneurysm|compartment syndrome|prostate|\bbph\b|renal stone|ureteric|urolog|scrotal|testicular tors|hydrocele|varicocele|wound|graft|flap|mastectomy|lymph node biopsy|carcinoma of|breast cancer'),
 ('COMM', r'prevention|epidemiolog|incidence|prevalence|odds ratio|relative risk|screening|sensitivity|specificit|positive predictive|negative predictive|confound|\bbias\b|outbreak|surveillance|notifiab|primary health|health (education|promotion|campaign|policy)|statistic|\bmean is|median|\bmode\b|standard deviation|normal distribution|study design|cohort study|case.control|cross.sectional|randomi[sz]ed|clinical trial|vaccine coverage|herd immun|sanitation|public health|p.?value|confidence interval|number needed|consent|ethic|autonomy|confidential|negligence|malpractice|disclosure|capacity|mortality rate|morbidity|demograph|census|sampling|null hypothesis|type (1|2|i|ii) error'),
 ('MED', r'hypertens|diabet|myocard|angina|heart failure|arrhythm|atrial fib|\bcopd\b|asthma|pneumonia|tuberculosis|\btb\b|hepatit|cirrhosis|ascites|renal failure|nephrot|nephrit|\bckd\b|\baki\b|stroke|\btia\b|seizure|epilep|parkinson|multiple sclerosis|myasthen|guillain|anaemi|anemi|leukaem|leukem|lymphoma|myeloma|thalassaem|sickle|haemophil|thrombocytopen|thyroid|graves|addison|cushing|acromegaly|\bsle\b|lupus|rheumatoid|\bgout\b|vasculitis|ulcerative colitis|crohn|coeliac|peptic ulcer|\bgerd\b|reflux|malaria|\bhiv\b|meningitis|encephalitis|electrolyte|potassium|sodium|hyperkal|hypokal|hypernatr|hyponatr|acid.?base|metabolic acidosis|hyperlip|cholesterol|poison|overdose|tramadol|paracetamol|organophosph|snake bite|serotonin syndrome|\bsvt\b|bradycard|tachycard|\becg\b|infective endocarditis|pericard|\bdvt\b|pulmonary embol|pleural effusion|pulmonary oedema|b12|folate|hypersegment|pernicious|haemoly|hemoly|pancytopen|hodgkin|ophthalm|\beye\b|glaucoma|cataract|retinopath|visual|hemianop|optic|conjunctiv|uveitis|psychiat|depress|schizophren|anxiety|bipolar|dementia|delirium|dermat|\bskin\b|psoriasis|eczema|urticaria|\brash\b|\bent\b|otitis|tonsill|sinusit|epistaxis|hearing|vertigo|tinnitus|microbiolog|bacteri|virus|viral|fungal|parasit|antibiotic|penicillin|resistance'),
]
def subject(q):
    t = norm(q['q'] + ' ' + ' '.join(q['options']))
    for name, pat in SUBJ:
        if re.search(pat, t): return name
    return 'OTHER'

drop = set(patches.get('drop', []))
fixes = {}
for fx in patches.get('fixes', []):
    fixes.setdefault(fx['exam'] + ':' + str(fx['qno']), {})[fx['field']] = fx['value']

rows = []
for f in sorted(glob.glob(os.path.join(SRC, 'exams', '*.json'))):
    exid = os.path.basename(f)[:-5]
    for q in json.load(open(f)):
        key = exid + ':' + str(q.get('id'))
        if key in drop: continue
        opts = [clean(o) for o in q.get('options', [])]
        r = {'exam': exid, 'qno': q.get('id'), 'q': (q.get('question') or '').strip(),
             'options': opts, 'answer': q.get('correctAnswer'), 'explanation': (q.get('explanation') or '').strip()}
        img = patches.get('images', {}).get(key) or imgmap.get((exid, q.get('id')))
        if img: r['image'] = img
        for fld, val in fixes.get(key, {}).items():
            r['explanation' if fld == 'explanation' else fld] = val
        rows.append(r)
# subjects
for r in rows:
    r['subject'] = fixes.get(r['exam'] + ':' + str(r['qno']), {}).get('subject') or subject(r)
# broken flags
for r in rows:
    b = []
    if not r['options']: b.append('no options')
    elif len(r['options']) < 2: b.append('one option')
    a = r['answer']
    if a is None or (isinstance(a, int) and (a < 0 or a >= len(r['options']))): b.append('no/invalid answer')
    if b: r['broken'] = b
# dedup -> unique with exams[] membership
by = collections.defaultdict(list)
for r in rows:
    k = norm(r['q'])
    (by[k] if len(k) > 15 else by['__' + str(id(r))]).append(r)
keep = []; removed = 0
for k, grp in by.items():
    grp.sort(key=lambda x: (0 if x.get('image') else 1, -len(x['options']), -len(x['explanation']), order.index(x['exam']) if x['exam'] in order else 99))
    c = grp[0]; c['exams'] = sorted({x['exam'] for x in grp}); keep.append(c); removed += len(grp) - 1
for i, r in enumerate(keep, 1): r['gid'] = i

cnt = collections.Counter()
for r in keep:
    for ex in r['exams']: cnt[ex] += 1
def group(i):
    return 'Fageery' if i.startswith('fageery') else 'Pool' if i == 'pool' else 'Sheets' if i.startswith('sheet') else 'Past papers'
exams = [{'id': i, 'title': titles.get(i, i), 'group': group(i), 'n': cnt[i]} for i in order]
sc = collections.Counter(r['subject'] for r in keep)
SUBN = [['MED','Medicine'],['SURG','Surgery'],['PAED','Paediatrics'],['OBG','Obstetrics & Gynaecology'],['COMM','Community Medicine'],['OTHER','Other / mixed']]
qs = []
for r in keep:
    o = {'g': r['gid'], 'q': r['q'], 'o': r['options'], 'a': r['answer'], 'e': r['explanation'], 's': r['subject'], 'x': r['exams'], 'no': r['qno']}
    if r.get('image'): o['img'] = r['image']
    if r.get('broken'): o['b'] = 1
    qs.append(o)
data = {'exams': exams, 'groups': ['Past papers', 'Pool', 'Sheets', 'Fageery'],
        'subjects': [[c, n, sc[c]] for c, n in SUBN], 'total': len(qs), 'questions': qs}
open(OUT, 'w').write('window.EXAM=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';')
open(os.path.join(HERE, 'data.json'), 'w').write(json.dumps(data, ensure_ascii=False, separators=(',', ':')))
print('questions kept:', len(keep), '| duplicates removed:', removed, '| broken:', sum(1 for r in keep if r.get('broken')))
print('subjects:', dict(sc))
print('wrote', OUT)
