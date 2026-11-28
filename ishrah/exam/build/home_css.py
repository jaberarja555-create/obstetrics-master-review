"""SMRA Permanent Exam Home styles, copied from the owner's approved mockup (28 Nov 2026). Re-run: python3 exam/build/home_css.py
Write the exact-mockup Home CSS into exam/css/exam.css.
Sizes are written as Nu (CSS px on a 430-wide phone, scaled with the screen) and Nfz (font sizes, also x the user's text-size)."""
import re
import os
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'css', 'exam.css')
s = open(P).read()

# 1) drop my earlier attempts (everything appended from the paid-access banner onwards)
cut = s.find('/* ===== Home — exact copy')
if cut < 0: cut = s.find('/* paid access: free-preview banner')
assert cut > 0
s = s[:cut].rstrip() + '\n'

# 2) the default palette = the mockup's medical blue + cyan (other palettes keep their own lines)
old_root = s[s.index(':root{'):s.index('}', s.index(':root{')) + 1]
new_root = old_root
for k, v in {
    '--p': '#1269b0', '--p2': '#0b4f8f', '--acc': '#22b8d4', '--accs': '#e2f4fb', '--accl': '#bfe9f4',
    '--bg': '#ebf5fd', '--soft': '#e1effa', '--line': '#d3e5f2', '--bd': '#e1edf7', '--tx': '#0f2747', '--mut': '#5d6f84',
}.items():
    new_root, n = re.subn(re.escape(k) + r':[^;]+;', k + ':' + v + ';', new_root, count=1)
    assert n == 1, k
new_root = re.sub(r'--hero:[^;]+;', '--hero:linear-gradient(105deg,#0c5a9b 0%,#1172b4 48%,#1b8fca 78%,#2bb6d8 100%);', new_root, count=1)
s = s.replace(old_root, new_root)

CSS = r'''
/* ===== Home — exact copy of the owner's mockup (28 Nov 2026). Sizes measured on the mockup; 1u = 1 CSS px on a 430-wide phone ===== */
@font-face{font-family:'Poppins';font-weight:600;font-display:swap;src:url(../fonts/poppins-latin-600-normal.woff2) format('woff2')}
@font-face{font-family:'Poppins';font-weight:700;font-display:swap;src:url(../fonts/poppins-latin-700-normal.woff2) format('woff2')}
@font-face{font-family:'Inter';font-weight:400;font-display:swap;src:url(../fonts/inter-latin-400.woff2) format('woff2')}
@font-face{font-family:'Inter';font-weight:500;font-display:swap;src:url(../fonts/inter-latin-500.woff2) format('woff2')}
@font-face{font-family:'Inter';font-weight:600;font-display:swap;src:url(../fonts/inter-latin-600.woff2) format('woff2')}
:root{--u:min(1px,calc(100vw / 430));--hf:'Poppins',system-ui,'Segoe UI',Roboto,Cairo,sans-serif;--bf:'Inter',system-ui,'Segoe UI',Roboto,Cairo,sans-serif;
  --m-ink:#0f2747;--m-sub:#3b4a5e;--m-btn:linear-gradient(90deg,#1a8fd2,#0d66b2);--m-btnsh:rgba(13,100,176,.28);
  --m-hero:linear-gradient(105deg,#0c5a9b 0%,#1172b4 48%,#1b8fca 78%,#2bb6d8 100%);
  --m-mock:linear-gradient(100deg,#0a67a4 0%,#0d6fad 55%,#1179b6 100%);
  --m-prog:linear-gradient(100deg,#1ba9c8 0%,#1899ba 55%,#1590b1 100%);
  --m-tile-ic:linear-gradient(150deg,#eaf6fd,#d2ebf8);--m-ic:#0b5784;--m-bar:linear-gradient(180deg,#36d0dc,#1aa8c4);
  --m-card:#fff;--m-prev:linear-gradient(100deg,#f9feff 0%,#f0faff 45%,#ddf2fc 100%);--m-nav:#fff;--m-navtx:#4a5d73}
:root[data-pal]:not([data-pal=navy]){--m-ink:var(--tx);--m-sub:var(--mut);--m-btn:var(--grad);--m-btnsh:color-mix(in srgb,var(--p) 30%,transparent);--m-hero:var(--hero);
  --m-mock:linear-gradient(100deg,var(--p2),var(--p));--m-prog:linear-gradient(100deg,color-mix(in srgb,var(--acc) 85%,var(--p)),color-mix(in srgb,var(--acc) 62%,var(--p2)));
  --m-tile-ic:var(--accs);--m-ic:var(--p);--m-bar:var(--acc);--m-prev:linear-gradient(100deg,var(--sf),var(--accs))}
:root[data-theme=dark]{--m-ink:var(--tx);--m-sub:var(--mut);--m-tile-ic:var(--soft);--m-ic:#cfe6f7;--m-card:var(--sf);--m-prev:var(--sf);--m-nav:var(--sf);--m-navtx:#a9bcd4}
:root[data-theme=eye]{--m-card:var(--sf);--m-prev:linear-gradient(100deg,var(--sf),var(--accs));--m-nav:var(--sf)}
body{padding-bottom:calc(84u + env(safe-area-inset-bottom))}
main{padding:4u 15u 16u}

/* header */
.hb{padding:calc(14u + env(safe-area-inset-top)) 16u 6u;min-height:64u}
.hbm{width:34u;height:34u;display:grid;place-items:center;flex:none;color:#0f3e70;margin-inline-start:-1u}
.hbm .ic{width:24u;height:24u;stroke-width:2.2}
:root[data-theme=dark] .hbm{color:#cfe0f5}
.hb-logo{gap:4u}
.hb-tag{gap:7u}.hb-tag i{width:21u;height:2.2u;background:#3cc3e3}
.hb-tag b{font:700 14.61fz/1.25 var(--hf);padding:2.5u 15u;letter-spacing:.01em;background:var(--m-btn);box-shadow:0 3u 8u var(--m-btnsh)}
.hb-sub{font:600 10.2fz/1.2 var(--hf);letter-spacing:.34em;margin-inline-start:.34em;color:#4a5568}
:root[data-theme=dark] .hb-sub{color:var(--mut)}
.hb-s.end{gap:12u}
.rdb{width:32u;height:32u;border-radius:9u;background:#dcecf8;color:#145e98}
.rdb .ic{width:19u;height:19u}
:root[data-theme=dark] .rdb{background:var(--soft);color:#cfe0f5}
.av{width:35u;height:35u;border:2.5u solid #44c8da;background:linear-gradient(150deg,#1b9fb4,#0d7f99)}
.av .ic{width:19u;height:19u}

/* Free Preview card */
.prev-card{position:relative;overflow:hidden;margin:0 0 12.6u;padding:9u 19u 10u;border-radius:14u;background:var(--m-prev);
  border:1px solid rgba(255,255,255,.95);box-shadow:0 6u 18u rgba(40,110,160,.10),inset 0 1px 0 #fff}
:root[data-theme=dark] .prev-card{border-color:var(--line);box-shadow:none}
.prev-img{position:absolute;inset-inline-end:4u;top:3u;width:96u;height:87u;object-fit:cover;pointer-events:none;
  -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 30%,#000 93%,transparent 100%),linear-gradient(180deg,transparent 0,#000 8%,#000 86%,transparent 100%);-webkit-mask-composite:source-in;mask-image:linear-gradient(90deg,transparent 0,#000 30%,#000 93%,transparent 100%),linear-gradient(180deg,transparent 0,#000 8%,#000 86%,transparent 100%);mask-composite:intersect}
.prev-h{position:relative;display:flex;align-items:center;gap:8u;height:26u}
.prev-crown{width:26u;height:26u;border-radius:7u;display:grid;place-items:center;flex:none;background:linear-gradient(150deg,#7ad6e6,#2fa3c4);box-shadow:0 3u 8u rgba(40,160,200,.3)}
.prev-crown svg{width:16u;height:16u}
.prev-h b{position:relative;top:-3u;font:700 16.83fz/1 var(--hf);color:var(--m-ink)}
.prev-card>p{position:relative;margin:-.3u 0 0;max-width:282u;font:400 11.65fz/16u var(--bf);color:#2b3b50}
:root[data-theme=dark] .prev-card>p{color:var(--mut)}
.prev-card .sb-acts{position:relative;display:flex;gap:10u;margin-top:9.3u}
.prev-card .btn{flex:none;height:31u;padding:0 12u;border-radius:16u;display:inline-flex;align-items:center;justify-content:center;gap:7u;white-space:nowrap;font:700 12.79fz/1 var(--hf)}
.prev-card .btn svg{width:15u;height:15u}
.prev-card .btn.pri{width:153u;color:#fff;background:var(--m-btn);border:0;box-shadow:0 4u 10u var(--m-btnsh)}
.prev-card .btn.gh{width:149u;font-size:calc(11.32*var(--u)*var(--fs));color:#0d4f8f;background:rgba(255,255,255,.55);border:1.5px solid #7fcbe8}
:root[data-theme=dark] .prev-card .btn.gh{color:#bfe7f4;background:transparent}
.sb-pend{position:relative;display:inline-flex;gap:6u;align-items:center;margin-top:7u;padding:7u 12u;border-radius:999px;font:600 12fz var(--bf);color:var(--org);background:var(--orgbg)}
.sb-pend .ic{width:15u;height:15u}
.btn.gh{background:transparent;border:1.5px solid var(--bd);color:var(--tx)}

/* hero */
.hero.hm{display:block;position:relative;overflow:hidden;height:132u;margin:0;padding:10u 22u 0;border-radius:16u;background:var(--m-hero);box-shadow:0 10u 24u rgba(12,90,155,.22)}
.hero.hm::before{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;
  background:radial-gradient(ellipse 46% 62% at 100% 100%,rgba(70,220,238,.55),transparent 70%),radial-gradient(ellipse 34% 46% at 84% 0,rgba(120,200,240,.16),transparent 70%)}
.hero.hm .hero-tx{position:relative;z-index:3;max-width:262u}
.hero.hm small{display:block;font:500 13.6fz/18u var(--bf);color:#fff;opacity:.96}
.hero.hm h2{margin:0;font:700 27.58fz/34u var(--hf);color:#fff;letter-spacing:-.005em;white-space:nowrap}
.hero.hm .hero-bar{display:block;width:48u;height:5u;border-radius:3u;margin:4u 0 0;background:linear-gradient(90deg,#8ffcff,#3ccfe0);box-shadow:0 0 8u rgba(80,230,245,.45)}
.hero.hm p{margin:6u 0 0;max-width:none;font:400 13.37fz/17u var(--bf);color:#fff;opacity:.93}
.hring{position:absolute;z-index:3;inset-inline-end:27.5u;top:50%;transform:translateY(-50%);width:89u;height:89u;display:grid;place-items:center}
.hring svg{position:absolute;inset:0;width:100%;height:100%}
.hring::before{content:"";position:absolute;inset:10u;border-radius:50%;background:radial-gradient(circle at 50% 38%,rgba(30,125,195,.55),rgba(10,78,140,.35))}
.hring b{position:relative;font:700 21.02fz/1 var(--hf);color:#fff}
.hgrid{position:absolute;z-index:1;top:0;inset-inline-end:0;bottom:0;width:42%;pointer-events:none;
  background-image:linear-gradient(rgba(255,255,255,.075) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.075) 1px,transparent 1px);background-size:11u 11u;
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 75%);mask-image:linear-gradient(90deg,transparent,#000 75%)}
.hcross{position:absolute;z-index:2;top:13u;inset-inline-end:12u;width:22u;height:22u;opacity:.85}
.hecg{position:absolute;z-index:2;inset-inline-start:63%;width:21%;bottom:16.5u;height:30u;overflow:visible;filter:drop-shadow(0 0 3u rgba(90,235,250,.85))}

/* Mock Exam */
.mock{position:relative;overflow:hidden;display:flex;align-items:center;gap:0;width:100%;height:66u;margin-top:12.3u;padding:0;padding-inline-start:21.5u;border-radius:15u;color:#fff;text-align:start;
  background:var(--m-mock);border:1px solid rgba(110,190,235,.45);box-shadow:0 8u 20u rgba(10,90,160,.22)}
.mock::before{content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(ellipse 62% 150% at 96% 115%,rgba(90,190,240,.32),transparent 60%),linear-gradient(162deg,transparent 52%,rgba(255,255,255,.07) 53%,transparent 76%)}
.mock-play{position:relative;width:53u;height:43u;border-radius:10u;display:grid;place-items:center;flex:none;background:linear-gradient(150deg,#55b8ea,#2287cf);
  border:1px solid rgba(255,255,255,.35);box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 4u 10u rgba(5,60,120,.25)}
.mock-play svg{width:20u;height:20u;margin-inline-start:2u}
.mock-div{position:relative;flex:none;width:1px;height:35u;margin:0;margin-inline:12.5u 16u;background:rgba(255,255,255,.28)}
.mock-t{position:relative;top:-3u;flex:1;min-width:0;margin:0;padding:0;border:0}
.mock-t b{display:block;font:700 16.78fz/22u var(--hf)}
.mock-t small{display:block;font:400 12.36fz/18u var(--bf);opacity:.93}
.mock-ch{position:relative;flex:none;width:15u;height:15u;margin:0;margin-inline-end:16.5u;stroke-width:2.6}

/* Start Practising + tiles */
.st.hst{margin:12u 0 10u;gap:10u;font:700 16.25fz/24u var(--hf);color:var(--m-ink)}
.st.hst::before{width:4u;height:16.5u;border-radius:2u;background:var(--m-bar)}
.qt.hq{display:grid;grid-template-columns:1fr 1fr;gap:9u 11u}
.qt.hq .tool{height:53.5u;padding:0;padding-inline-start:14.6u;gap:12u;border-radius:12u;background:var(--m-card);border:1px solid rgba(255,255,255,.9);box-shadow:0 4u 14u rgba(30,90,140,.08)}
:root[data-theme=dark] .qt.hq .tool{border-color:var(--line);box-shadow:none}
.qt.hq .ib2{width:37u;height:37u;border-radius:9u;background:var(--m-tile-ic);color:var(--m-ic)}
.qt.hq .ib2 .ic{width:22u;height:22u;stroke-width:2.1}
.qt.hq .tool-t{min-width:0;position:relative;top:-2u}
.qt.hq .tool b{display:block;font:700 13fz/18u var(--hf);color:var(--m-ink);white-space:nowrap}
.qt.hq .tool small{display:block;font:400 10.36fz/15u var(--bf);color:var(--m-sub);white-space:nowrap}
.qt.hq .tool .ch{width:14u;height:14u;margin:0;margin-inline:auto 9.5u;color:#5d6d80;stroke-width:2.4}

/* Progress Assessment */
.prog-card{position:relative;overflow:hidden;display:flex;align-items:center;gap:0;width:100%;height:94u;margin-top:17u;padding:0;padding-inline-start:16.5u;border-radius:14u;color:#fff;text-align:start;
  background:var(--m-prog);border:1px solid rgba(140,225,240,.5);box-shadow:0 8u 22u rgba(20,140,180,.25)}
.prog-card::before{content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(ellipse 55% 70% at 88% -10%,rgba(120,235,250,.45),transparent 70%),radial-gradient(ellipse 40% 60% at 100% 110%,rgba(70,215,235,.35),transparent 70%)}
.prog-ic{position:relative;z-index:2;width:45u;height:44u;border-radius:10u;display:grid;place-items:center;flex:none;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.35)}
.prog-ic svg{width:24u;height:24u}
.prog-div{position:relative;z-index:2;flex:none;width:1px;height:66u;margin:0;margin-inline:12.5u 13u;background:rgba(255,255,255,.35)}
.prog-tx{position:relative;z-index:2;flex:1;min-width:0;align-self:flex-start;padding-top:6u}
.prog-tx>b{display:block;font:700 16.88fz/24u var(--hf);white-space:nowrap}
.prog-tx>small{display:block;margin:1u 0 0;font:400 10.79fz/16u var(--bf);opacity:.96;white-space:nowrap}
.prog-pills{display:flex;gap:10.5u;margin-top:6u;flex-wrap:nowrap}
.ppill{display:inline-flex;align-items:center;gap:7u;height:24u;padding:0;padding-inline:8u 16u;border-radius:12u;background:rgba(240,252,255,.93);color:#0f2a4a;font:500 9.6fz/1 var(--bf);white-space:nowrap}
.ppill svg{width:13u;height:13u;flex:none}.ppill b{display:inline;font:700 9.6fz/1 var(--bf)}
.prog-ch{position:absolute;z-index:2;inset-inline-end:12.5u;top:50%;width:15u;height:15u;transform:translateY(-50%);stroke-width:2.6}
.prog-card .hgrid{width:34%;opacity:.7}
.prog-card .hecg{inset-inline-start:74%;width:25%;bottom:7u;height:24u;opacity:.5;filter:none}

/* Arabic: cards mirror (text right, ring / photo / chevrons left) */
:root[lang=ar] .prev-card,:root[lang=ar] .hero.hm,:root[lang=ar] .mock,:root[lang=ar] .qt.hq,:root[lang=ar] .prog-card,:root[lang=ar] .st.hst{direction:rtl}
:root[lang=ar] .mock-ch,:root[lang=ar] .qt.hq .tool .ch{transform:scaleX(-1)}
:root[lang=ar] .prog-ch{transform:translateY(-50%) scaleX(-1)}
:root[lang=ar] .prev-img{-webkit-mask-image:linear-gradient(270deg,transparent 0,#000 30%,#000 93%,transparent 100%),linear-gradient(180deg,transparent 0,#000 8%,#000 86%,transparent 100%);mask-image:linear-gradient(270deg,transparent 0,#000 30%,#000 93%,transparent 100%),linear-gradient(180deg,transparent 0,#000 8%,#000 86%,transparent 100%)}
:root[lang=ar] .hgrid{-webkit-mask-image:linear-gradient(270deg,transparent,#000 75%);mask-image:linear-gradient(270deg,transparent,#000 75%)}
:root[lang=ar] .hero.hm::before{background:radial-gradient(ellipse 46% 62% at 0 100%,rgba(70,220,238,.55),transparent 70%),radial-gradient(ellipse 34% 46% at 16% 0,rgba(120,200,240,.16),transparent 70%)}
:root[lang=ar] .mock::before{background:radial-gradient(ellipse 62% 150% at 4% 115%,rgba(90,190,240,.32),transparent 60%)}
:root[lang=ar] .prog-card::before{background:radial-gradient(ellipse 55% 70% at 12% -10%,rgba(120,235,250,.45),transparent 70%),radial-gradient(ellipse 40% 60% at 0 110%,rgba(70,215,235,.35),transparent 70%)}
:root[lang=ar] .hero.hm h2,:root[lang=ar] .prev-h b,:root[lang=ar] .mock-t b,:root[lang=ar] .qt.hq .tool b,:root[lang=ar] .prog-tx>b,:root[lang=ar] .st.hst{font-family:Cairo,var(--hf)}
/* night: the photo has a light background, so it is left out */
:root[data-theme=dark] .prev-img{display:none}

/* bottom bar */
.bn{left:4u;right:4u;gap:0;padding:7u 12u calc(12.3u + env(safe-area-inset-bottom));border-radius:18u 18u 0 0;background:var(--m-nav);box-shadow:0 -4u 18u rgba(20,70,120,.08)}
.bn button{height:47.5u;margin:0 5u;padding:0;gap:2u;justify-content:center;border-radius:16u;color:var(--m-navtx);font:600 12fz/1.2 var(--bf)}
.bn button .ic{width:22u;height:22u;stroke-width:1.9}
.bn button.on{background:var(--m-btn);color:#fff;font-weight:700;box-shadow:0 6u 14u var(--m-btnsh)}
'''
CSS = re.sub(r'(\d+(?:\.\d+)?)fz\b', r'calc(\1*var(--u)*var(--fs))', CSS)
CSS = re.sub(r'(?<![\w#.])(-?(?:\d+(?:\.\d+)?|\.\d+))u\b', r'calc(\1*var(--u))', CSS)
s = s + CSS
open(P, 'w').write(s)
print('written', len(s))
