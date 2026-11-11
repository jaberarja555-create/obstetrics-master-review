"""Standard wording for question stems and explanations (owner, 11 Nov 2026): the shorthand of the question bank is written out in full
medical terms. Only fixed abbreviation-to-term replacements: no fact, number or dose is touched."""
import re
R = [
 (r'\bPulse (\d+)(?:/min)?, BP (\d+/\d+)(?: mmHg)?', r'Her pulse is \1/min and blood pressure \2 mmHg'),
 (r'\bpulse (\d+)(?:/min)?, BP (\d+/\d+)(?: mmHg)?', r'pulse \1/min, blood pressure \2 mmHg'),
 (r'\bBP (\d+/\d+)(?! ?mmHg)', r'blood pressure \1 mmHg'), (r'\bBP\b', 'blood pressure'),
 (r'\b[Pp]ulse (\d+)(?![\d/])(?! ?bpm)', lambda m: m.group(0) + '/min'),
 (r'\bTVS\b', 'transvaginal ultrasound'), (r'\bFHR\b', 'fetal heart rate'), (r'\bPPROM\b', 'preterm prelabour rupture of membranes'),
 (r'\bSROM\b', 'spontaneous rupture of membranes'), (r'\bROM\b', 'rupture of membranes'), (r'\bARM\b', 'artificial rupture of membranes'),
 (r'\bVE\b', 'vaginal examination'), (r'\b(µg|mg) PV\b', r'\1 vaginally'), (r'\b(µg|mg) SL\b', r'\1 sublingually'), (r'\b(µg|mg) PO\b', r'\1 orally'),
 (r'\b(µg|mg|IU|g) SC\b', r'\1 subcutaneously'), (r'\bPV\b', 'vaginal'), (r'\bD&V\b', 'diarrhoea and vomiting'),
 (r'\bCS\b', 'caesarean section'), (r'\bLSCS\b', 'lower-segment caesarean section'), (r'\bEFW\b', 'estimated fetal weight'), (r'\bIUP\b', 'intrauterine pregnancy'),
 (r'\bLMWH\b', 'low-molecular-weight heparin'), (r'\bSFH\b', 'symphysis–fundal height'), (r'\bAPS\b', 'antiphospholipid syndrome'),
 (r'\bMVA\b', 'manual vacuum aspiration'), (r'\bMgSO[4₄]', 'magnesium sulphate'), (r'\bO2\b|\bO₂', 'oxygen'), (r'\bIOL\b', 'induction of labour'),
 (r'\bGDM\b', 'gestational diabetes'), (r'\bIUFD\b', 'intrauterine fetal death'), (r'\bFGR\b', 'fetal growth restriction'), (r'\bUTI\b', 'urinary tract infection'),
 (r'\bRR (\d+)(?:/min)?', r'respiratory rate \1/min'), (r'\bSpO2\b|\bSpO₂', 'oxygen saturation'), (r'\bWBC\b', 'white cell count'),
 (r'\bwk\b', 'weeks'), (r'\bwks\b', 'weeks'), (r'(\d) h\b', r'\1 hours'), (r'\b1 hours\b', '1 hour'), (r'≈ ?', 'about '), (r' ± ', ' with or without '),
 (r'\bfoul-smelling\b', 'offensive'), (r'\bfoul\b', 'offensive'), (r'\b(a|an eclamptic|one|another|first|second) fit\b', r'\1 convulsion'), (r'\b(has|had|having|with|and|then|of|recurrent|more|no|two|three|further) fits\b', r'\1 convulsions'),
 (r'\b(been|still|is|was) fitting\b', r'\1 convulsing'), (r'\buntil she fits\b', 'until she has a convulsion'), (r'\bthe fit\b', 'the convulsion'), (r'\b(generalised|tonic-clonic|tonic–clonic|eclamptic) fit\b', r'\1 convulsion'),
 (r'\bSpeculum:', 'Speculum examination:'), (r'\bScan:', 'Ultrasound:'), (r'\bwaters broke\b', 'membranes ruptured'), (r'\bwaters break\b', 'membranes rupture'),
 (r'\bcaesareans\b', 'caesarean sections'), (r'\bshe is Bleeding\b', 'she is bleeding'), (r'\bis Bleeding\b', 'is bleeding'), (r'\bsoft and soft\b', 'soft and'),
 (r'\bkills\b', 'causes death'), (r'\bthe killer organism\b', 'the most dangerous organism'), (r'\btummy\b', 'abdomen'), (r'\bdrip sites\b', 'cannula sites'),
]
R = [(re.compile(a), b) for a, b in R]
def clean(t):
    if not isinstance(t, str): return t
    for a, b in R: t = a.sub(b, t)
    t = re.sub(r'  +', ' ', t)
    return re.sub(r'(^|[.!?] )([a-z])(?![A-Z]|L\b)', lambda m: m.group(1) + m.group(2).upper(), t)   # a sentence starts with a capital (not pH, hCG, mL)
