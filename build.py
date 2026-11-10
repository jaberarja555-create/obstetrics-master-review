"""Build the Obstetrics Master Review.

  python3 build.py            -> build/site/   (Cloudflare deploy: free pages + locked placeholders + encrypted content.bin)
                                 build/review/index.html (whole book open, for the authors / artifact)

The AES key that opens content.bin is NOT in this repo. It is read from $OBS_KEY_FILE (default ../secret/licence_key.txt)
or $OBS_KEY. It must stay the same key that Supabase gives activated devices (table obs_secret, column k).
"""
import os, re, json, gzip, glob, shutil, hashlib, base64, html as H
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

R = os.path.dirname(os.path.abspath(__file__))
C = os.path.join(R, 'content')
OUT = os.path.join(R, 'build')
FREE = json.load(open(os.path.join(C, 'access.json')))['free']        # topic ids open in the free trial

def load(n): return json.load(open(os.path.join(C, n), encoding='utf-8'))
def dump(o): return json.dumps(o, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')

meta, decks, qbank, audio = load('meta.json'), load('decks.json'), load('qbank.json'), load('audio.json')
topics = [t for t in meta['topics'] if t['id'] != 'rr']
TT = {t['id']: t['title'] for t in topics}
files = sorted(glob.glob(os.path.join(C, 'pages', '*.html')))
pages = [(re.match(r'\d+_(.+)\.html', os.path.basename(f)).group(1), open(f, encoding='utf-8').read()) for f in files]
from termify import termify
pages = [(f, termify(f, s)) for f, s in pages]   # meanings of abbreviations and difficult words (content/terms.json)

def topic_of(f):
    return re.sub(r'\d+$', '', f.split('_', 1)[1]) if f.startswith('c') and '_' in f else ''

def locked(f):
    if f.startswith(('x900', 'y00')): return False   # Rapid Review and drugs covers stay open
    if f.startswith('x9') or bool(re.match(r'y\d', f)): return True
    t = topic_of(f)
    return bool(t) and t not in FREE

LOCK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'

def placeholder(f, sec):
    name = 'Rapid review' if f.startswith('x9') else 'Obstetric drugs' if re.match(r'y\d', f) else TT.get(topic_of(f), '')
    name = name[0].upper() + name[1:] if name else name
    body = (f'<div class="body"><div class="lockpg"><div class="lki">{LOCK_SVG}</div><div class="lkt">{H.escape(name)}</div>'
            '<div class="lkar" dir="rtl"><b>هذه الصفحة للمشتركين</b><span>النسخة المجانية تفتح الموضوع الأول من كل فصل. اشترك لتفتح الكتاب كاملًا مع كل البطاقات وبنك الأسئلة.</span></div>'
            '<button type="button" class="lkb" data-sub="1" dir="rtl">اضغط هنا للاشتراك</button></div></div>')
    return re.sub(r'<div class="body">.*(?=<div class="ftr">)', lambda m: body, sec, count=1, flags=re.S)

def key():
    k = os.environ.get('OBS_KEY')
    if not k:
        p = os.environ.get('OBS_KEY_FILE', os.path.join(R, '..', 'secret', 'licence_key.txt'))
        k = open(p).read().strip()
    b = base64.b64decode(k)
    assert len(b) == 32, 'licence key must be 32 bytes (base64)'
    return b

def v2(shell):
    """App redesign (owner, 10 Nov 2026): src/v2.css, v2.html (<!--TOP--> <!--VIEWS--> <!--NAV-->) and v2.js are laid over the old shell."""
    rd = lambda n: open(os.path.join(R, 'src', n), encoding='utf-8').read()
    top, rest = rd('v2.html').split('<!--TOP-->')[1].split('<!--VIEWS-->')
    vw, nav = rest.split('<!--NAV-->')
    def ins(s, anchor, new, before=True):
        assert s.count(anchor) == 1, anchor
        return s.replace(anchor, new + anchor if before else anchor + new)
    i = shell.rindex('</style>')
    shell = shell[:i] + rd('v2.css') + shell[i:]
    shell = ins(shell, '<div class="app" id="app">', top, False)
    shell = ins(shell, '<div class="ap" id="ap" hidden>', vw)
    j = shell.index('</nav>', shell.index('<nav class="tabs" id="tabs">')) + 6
    shell = shell[:j] + nav + shell[j:]
    return ins(shell, 'refreshCont();\n});\n</script>', rd('v2.js') + '\n', True).replace(rd('v2.js') + '\nrefreshCont();\n});', 'refreshCont();\n' + rd('v2.js') + '\n});')

def main():
    shell = v2(open(os.path.join(R, 'src', 'shell.html'), encoding='utf-8').read())
    # a picture for every topic (video lecture cards): its first figure, else its chapter picture
    timg = {}
    for f, s in pages:
        t = topic_of(f)
        if t and t not in timg:
            mm = re.search(r'<img[^>]+src="(img/[^"]+)"', s)
            if mm: timg[t] = mm.group(1)
    for t in topics:
        if t['id'] not in timg:
            c = 'img/chcov%d.jpg' % t['ch']
            timg[t['id']] = c if os.path.exists(os.path.join(R, 'assets', c)) else 'img/ban%d.jpg' % t['ch']
    TOTALS = {'cards': sum(len(d['cards']) for d in decks.values()),
              'qs': sum(len(q.get('items', [])) if q.get('type') == 'emq' else 1 for ch in qbank for q in ch['questions'])}
    order = [t['id'] for t in topics]
    info = {'locked': {t: 1 for t in order if t not in FREE},
            'free_names': [TT[t][0].upper() + TT[t][1:] for t in order if t in FREE],
            'order': order, 'tot': TOTALS, 'timg': timg}
    lk_pages = {f: s for f, s in pages if locked(f)}
    sale_pages = ''.join(placeholder(f, s) if f in lk_pages else s for f, s in pages)
    free_decks = {k: v for k, v in decks.items() if k in FREE}
    lk_decks = {k: v for k, v in decks.items() if k not in FREE}
    free_qb, lk_qb = [], []
    for ch in qbank:
        qs = ch['questions']
        free_qb.append(dict(ch, questions=[q for q in qs if q.get('topic') in FREE]))
        lk_qb.append(ch)   # the unlocked app replaces the question bank with the whole bank

    def fill(s, pg, dk, qb, inf):
        rrp = next(i + 1 for i, p in enumerate(meta['pages']) if p['f'].startswith('x9'))
        drp = next(i + 1 for i, p in enumerate(meta['pages']) if p['f'].startswith('y0'))
        pill = f"{len(topics)} topics · {len(meta['pages'])} pages"
        s = s.replace('{{RRP}}', str(rrp)).replace('{{DRP}}', str(drp)).replace('{{PILL}}', pill)
        return (s.replace('{{PAGES}}', pg).replace('{{META}}', dump(meta)).replace('{{DECKS}}', dump(dk))
                 .replace('{{QBANK}}', dump(qb)).replace('{{AUDIO}}', dump(audio)).replace('{{OBS_INFO}}', dump(inf)))

    # ---- deploy folder ----
    site = os.path.join(OUT, 'site')
    if os.path.exists(site): shutil.rmtree(site)
    shutil.copytree(os.path.join(R, 'site_static'), site)
    for d in ('img', 'audio', 'fonts'):
        if os.path.exists(os.path.join(R, 'assets', d)):
            shutil.copytree(os.path.join(R, 'assets', d), os.path.join(site, d))
    open(os.path.join(site, 'index.html'), 'w', encoding='utf-8').write(fill(shell, sale_pages, free_decks, free_qb, info))
    payload = gzip.compress(json.dumps({'pages': lk_pages, 'decks': lk_decks, 'qbank': lk_qb}, ensure_ascii=False).encode())
    iv = os.urandom(12)
    open(os.path.join(site, 'content.bin'), 'wb').write(iv + AESGCM(key()).encrypt(iv, payload, None))
    ver = hashlib.sha1(open(os.path.join(site, 'index.html'), 'rb').read()).hexdigest()[:10]
    swp = os.path.join(site, 'sw.js')
    sw = open(swp).read()
    imgs = sorted('img/' + n for n in os.listdir(os.path.join(site, 'img'))) if os.path.exists(os.path.join(site, 'img')) else []
    assets = ["./", "index.html", "content.bin", "licence.js", "sbmini.js", "licence-config.js", "manifest.json", "icon.png", "icon-192.png", "apple-touch-icon.png"] + imgs + sorted('fonts/' + n for n in os.listdir(os.path.join(site, 'fonts')) if n.endswith(('.woff', '.woff2')))
    sw = re.sub(r"var C='[^']*',ASSETS=\[.*?\]", lambda m: f"var C='orr-{ver}',ASSETS=" + json.dumps(assets), sw, count=1, flags=re.S)
    open(swp, 'w').write(sw)

    # ---- review copy: whole book open, no activation ----
    rv = fill(shell, ''.join(s for f, s in pages), decks, qbank, {'locked': {}, 'free_names': [], 'order': order, 'tot': TOTALS, 'timg': timg})
    rv = re.sub(r'<script src="(licence-config|sbmini|licence)\.js"></script>', '', rv)
    rv = rv.replace('<html lang="en">', '<html lang="en" class="unlocked">', 1)
    rv = rv.replace('</body>', '<script>window.__boot&&window.__boot()</script></body>', 1)
    rvd = os.path.join(OUT, 'review')
    if os.path.exists(rvd): shutil.rmtree(rvd)
    os.makedirs(rvd)
    for d in ('img', 'fonts'):
        if os.path.exists(os.path.join(site, d)): shutil.copytree(os.path.join(site, d), os.path.join(rvd, d))
    for n in ('icon.png', 'icon-192.png', 'apple-touch-icon.png'): shutil.copy(os.path.join(site, n), rvd)
    open(os.path.join(OUT, 'review', 'index.html'), 'w', encoding='utf-8').write(rv)
    print(f'{len(pages)} pages | locked {len(lk_pages)} | content.bin {os.path.getsize(os.path.join(site, "content.bin"))} | ver {ver}')

if __name__ == '__main__':
    main()
