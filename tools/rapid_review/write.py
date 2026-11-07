import json,glob,re,sys
sys.path.insert(0,'tools')
from merge_pieces import close_of
P=json.load(open('build/rr/pages.json'))
F=sorted(f for f in glob.glob('content/pages/*_x9*_rr*.html') if 'rrcover' not in f)
assert len(F)==len(P),(len(F),len(P))
for f,h in zip(F,P):
    s=open(f).read(); m=re.search(r'<div class="main mzm[^"]*"[^>]*>',s); e=close_of(s,m.start())
    s=s[:m.end()]+h+s[e-6:]
    open(f,'w').write(s)
