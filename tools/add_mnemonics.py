"""Insert the mnemonic boxes (owner, Nov 2026) into their pages. Idempotent: a box already present is not added again."""
import re, glob, os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def tiles(pairs): return '<div class="mnl">' + ''.join(f'<span><i>{l}</i>{w}</span>' for l, w in pairs) + '</div>'
M = [
 ('nl3', 'Mechanism of labour', 'mn-nl', 'Mnemonic · The cardinal movements of labour, in order',
  [('E','ngagement'),('D','escent'),('F','lexion'),('I','nternal rotation'),('E','xtension'),('R','estitution'),('E','xternal rotation'),('E','xpulsion')],
  'Each movement follows the one before it: the head engages and descends, flexes, rotates to bring the occiput anterior, extends to be born, then restitutes and rotates externally so that the shoulders can deliver.'),
 ('iol2', 'Choosing the method', 'mn-iol', 'Mnemonic · Modified Bishop score: “Call PEDS”',
  [('C','onsistency'),('P','osition'),('E','ffacement (cervical length)'),('D','ilatation'),('S','tation')],
  'Each item scores 0–3 (consistency and position 0–2). A score of 8 or more means a favourable cervix; 6 or less means the cervix must be ripened first.'),
 ('lq2', None, 'mn-lq', 'Mnemonic · Causes of oligohydramnios: “DRIPP”',
  [('D','emise of the fetus'),('R','enal agenesis or obstruction'),('I','UGR (placental insufficiency)'),('P','ost-term pregnancy'),('P','ROM: rupture of membranes')], ''),
 ('ps2', 'Recognising sepsis', 'mn-ps', 'Mnemonic · Causes of postpartum fever by day: the six Ws',
  [('W','omb: endometritis (days 2–3)'),('W','ind: atelectasis, pneumonia (days 1–2)'),('W','ater: urinary infection (days 3–5)'),('W','ound: caesarean or perineal wound (days 5–7)'),('W','alking: DVT, pelvic thrombophlebitis (days 7–10)'),('W','onder drugs: drug fever, transfusion')],
  'Mastitis and breast abscess (usually in the second week) must also be checked in every febrile postnatal woman.'),
 ('np4', None, 'mn-np', 'Mnemonic · The postnatal examination: “BUBBLE-HE”',
  [('B','reasts'),('U','terus'),('B','ladder'),('B','owels'),('L','ochia'),('E','pisiotomy or wound'),('H','omans: legs for DVT'),('E','motions')], ''),
 ('p5x2_nl5', '4th stage', 'mn-apgar', 'Mnemonic · The Apgar score at 1 and 5 minutes: “APGAR”',
  [('A','ppearance (colour)'),('P','ulse'),('G','rimace (reflex irritability)'),('A','ctivity (muscle tone)'),('R','espiration')],
  'Each sign scores 0, 1 or 2 (total 10). A score of 7–10 is normal; 4–6 needs stimulation and support; 0–3 needs immediate resuscitation.'),
]
for key, anchor, bid, title, pairs, note in M:
    f = [x for x in glob.glob(os.path.join(R, 'content/pages/*.html')) if re.search(r's\d+p\d+_' + key + r'\.html$', x) or x.endswith(key + '.html') and '_' in key]
    assert len(f) == 1, (key, f); f = f[0]
    s = open(f, encoding='utf-8').read()
    if f'data-id="{bid}"' in s: continue
    box = (f'<div class="blk" data-id="{bid}"><div class="xrow"><div class="box mnem"><div class="bh">{title}</div>' + tiles(pairs) +
           (f'<p class="mnn">{note}</p>' if note else '') + '</div></div></div>')
    pos = None
    if anchor:
        a = s.find(anchor); assert a > 0, (key, anchor)
        n = s.find('<div class="blk"', a)
        pos = n if n > 0 else None
    if pos is None: pos = s.rindex('</div></div><div class="ftr">')
    s = s[:pos] + box + s[pos:]
    s = re.sub(r'class="main mzm vg" style="--vg:\d+px"', 'class="main mzm"', s)
    open(f, 'w', encoding='utf-8').write(s); print('added', bid, '->', os.path.basename(f))
