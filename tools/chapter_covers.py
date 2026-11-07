"""Chapter cover pages (owner, Nov 2026, as in Surgery): one page before each chapter with the book title band, emblem,
chapter number and title, the chapter picture (assets/img/chcover_<n>.jpg if present, else the chapter banner) and the
chapter's topics with their pages. Free in the trial. Re-run after pages move (rewrites the covers in place)."""
import os, re, json, glob, subprocess, tempfile, html as H
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(R, 'content', 'pages')
def names(): return [re.match(r'\d+_(.+)\.html', os.path.basename(f)).group(1) for f in sorted(glob.glob(os.path.join(P, '*.html')))]
def cover(ch, tops, no):
    n = ch['n']; img = f'img/chcover_{n}.jpg' if os.path.exists(os.path.join(R, 'assets', 'img', f'chcover_{n}.jpg')) else ch['img']
    rows = ''.join(f'<div class="cvr" data-p="{t["p"]}"><i>{t["no"]}</i><div><b>{H.escape(t["title"][0].upper() + t["title"][1:])}</b>'
                   f'<span>{H.escape(t.get("sub", ""))}</span></div><em>{t["p"]}</em></div>' for t in tops)
    cls = ' cv2' if len(tops) > 5 else ''
    return (f'<section class="page chcov c{n}" id="p{no}" data-file="k{n}_cover">'
            f'<div class="cvtop"><img class="cvseal" src="img/logo3.webp" alt=""><div class="cvbook"><b>OBSTETRICS</b><span>Master Review</span></div>'
            f'<div class="cvtag">Student Master Note Series · 4th edition · 2026</div></div>'
            f'<div class="cvhead"><div class="cvno"><b>Chapter {n}</b><span>{len(tops)} topic{"s" * (len(tops) > 1)}</span></div>'
            f'<h1 class="cvt">{H.escape(ch["name"])}</h1></div>'
            f''            + (f'<div class="cvimg own2"><img src="img/chcov{n}.jpg" alt=""{' style="object-position:center 8%"' if n == 7 else ''}></div>' if os.path.exists(os.path.join(R, 'assets', 'img', f'chcov{n}.jpg')) else f'<div class="cvart"><span>{n}</span></div>') +
            f''
            f'<div class="cvin{cls}"><h3>In this chapter</h3><div class="cvg">{rows}</div></div>'
            f'<div class="cvbot"><span>Obstetrics Master Review</span><i></i><span>4th edition · 2026</span></div></section>')
meta = json.load(open(os.path.join(R, 'content/meta.json'), encoding='utf-8'))
# 1. make sure every chapter has its cover page right before its first topic page
for ch in meta['chapters']:
    n = ch['n']; nm = names()
    if f'k{n}_cover' in nm: continue
    first = next(i for i, f in enumerate(nm) if f.startswith(f'c{n}s'))
    tmp = tempfile.NamedTemporaryFile('w', suffix='.html', delete=False, encoding='utf-8'); tmp.write(cover(ch, [], '{{NO}}')); tmp.close()
    subprocess.run(['python3', os.path.join(R, 'tools/insert_page.py'), nm[first - 1], f'k{n}_cover', f'Chapter {n} · {ch["name"]}', tmp.name], check=True, stdout=subprocess.DEVNULL)
subprocess.run(['python3', os.path.join(R, 'tools/fix_contents.py')], check=True, stdout=subprocess.DEVNULL)
# 2. write every cover with the current page numbers
meta = json.load(open(os.path.join(R, 'content/meta.json'), encoding='utf-8'))
fl = {re.match(r'\d+_(.+)\.html', os.path.basename(f)).group(1): f for f in glob.glob(os.path.join(P, '*.html'))}
for ch in meta['chapters']:
    f = fl[f'k{ch["n"]}_cover']; no = int(re.match(r'(\d+)_', os.path.basename(f)).group(1))
    tops = [t for t in meta['topics'] if t.get('ch') == ch['n'] and t['id'] != 'rr']
    open(f, 'w', encoding='utf-8').write(cover(ch, tops, no))
print('covers written')
