"""Rapid Review and Obstetric Drugs cover pages (x900_rrcover, y00_drcover) in the chapter-cover style, with the pictures from the owner's posters (rrpic.jpg, drpic.jpg: cropped, purple recoloured to navy). Run from the repo root."""
import json,re,html as H
m=json.load(open('content/meta.json'))
def top():
  return ('<div class="cvtop"><img class="cvseal" src="img/logo3.webp" alt=""><div class="cvbook"><b>OBSTETRICS</b><span>Master Review</span></div>'
          '<div class="cvtag">Student Master Note Series · 4th edition · 2026</div></div>')
bot='<div class="cvbot"><span>Obstetrics Master Review</span><i></i><span>4th edition · 2026</span></div>'
VARS='--ch:#1f4e8c;--ch-dark:#0e2547;--ch-mid:#4f7ab8;--ch-tint:#e6edf6;--ch-line:#d6e0ef;--ch-line2:#e8eef6;overflow:hidden'
tops=[t for t in m['topics'] if t.get('ch') and t['id']!='rr']
rows=''.join(f'<div class="cvr"><i>{c["n"]}</i><div><b>{H.escape(c["name"])}</b><span>{sum(1 for t in tops if t["ch"]==c["n"])} topic cards</span></div><em></em></div>' for c in m['chapters'])
rr=(f'<section class="page chcov cx" id="p327" data-file="x900_rrcover" style="{VARS}">'+top()+
 f'<div class="cvhead"><div class="cvno"><b>Rapid Review</b><span>{len(tops)} topic cards</span></div><h1 class="cvt">The exam recap of every topic</h1></div>'
 '<div class="cvimg own2"><img src="img/rrpic.jpg" alt=""></div>'
 f'<div class="cvin"><h3>Chapters in this section</h3><div class="cvg">{rows}</div></div>'+bot+'</section>\n')
d=json.load(open('content/drugs.json'))
grows=''.join(f'<div class="cvr"><i>{i+1}</i><div><b>{re.sub(r"<[^>]+>","",g["title"])}</b><span>{len(g["drugs"])} drugs</span></div><em></em></div>' for i,g in enumerate(d['groups']))
n=sum(len(g['drugs']) for g in d['groups'])
dr=(f'<section class="page chcov cx" id="p353" data-file="y00_drcover" style="{VARS}">'+top()+
 f'<div class="cvhead"><div class="cvno"><b>Obstetric Drugs</b><span>{n} drugs in {len(d["groups"])} groups</span></div><h1 class="cvt">Drugs used in pregnancy and labour</h1></div>'
 '<div class="cvimg own2"><img src="img/drpic.jpg" alt=""></div>'
 f'<div class="cvin"><h3>Drug groups</h3><div class="cvg">{grows}<div class="cvr"><i>+</i><div><b>Reference pages</b><span>Drugs by trimester · safe drugs · breastfeeding · drugs to avoid</span></div><em></em></div></div></div>'+bot+'</section>\n')
open('content/pages/327_x900_rrcover.html','w').write(rr)
open('content/pages/353_y00_drcover.html','w').write(dr)
print('ok',n,len(tops))
