"""Mark abbreviations and difficult words in a book page so the app shows their meaning on tap / hover.
content/terms.json: abbreviations (every occurrence), by_topic (abbreviations whose meaning depends on the topic),
glossary (first occurrence on each page; plural -s/-es also matched). Works in normal text and inside SVG diagrams
(<text>/<tspan>), never inside headings, box titles, the running head, the footer or an existing term."""
import re, json, os, html as H

T = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'content', 'terms.json'), encoding='utf-8'))
AB, BYT, GL = T['abbreviations'], T['by_topic'], T['glossary']
SKIP_CLASS = re.compile(r'\b(ab|gl|mh|mzh|ftr|mzt|bh|hdr|kicker|toc-h|lbt|no|tn|n|rvn|dgb)\b')
SKIP_TAG = {'style', 'script', 'title', 'h1', 'h2', 'h3', 'button', 'textarea'}
VOID = {'br', 'img', 'hr', 'input', 'meta', 'link', 'col', 'wbr', 'source'}

def _esc(s): return H.escape(s, quote=True)

def _ab_regex(keys):
    keys = sorted(keys, key=len, reverse=True)
    return re.compile(r'(?<![\w\-₀-₉])(' + '|'.join(re.escape(_esc(k)) for k in keys) + r')(?![\w₀-₉])')

def _gl_regex(keys):
    keys = sorted(keys, key=len, reverse=True)
    return re.compile(r'(?<![\w\-])(' + '|'.join(re.escape(k) for k in keys) + r')(e?s)?(?![\w\-])', re.I)

AB_RE = _ab_regex(list(AB) + list(BYT))
GL_RE = _gl_regex(GL)

def topic_of(fid):
    return re.sub(r'\d+$', '', fid.split('_', 1)[1]) if fid.startswith('c') and '_' in fid else ''

def termify(fid, page):
    if fid.startswith(("a0", "k", "x900", "y00")):               # cover, authors, reviewers, how-to, references, contents
        return page
    topic = topic_of(fid)
    used = set(m.lower() for m in re.findall(r'<span class="gl" data-a="([^":]+):', page))
    out, stack = [], []
    parts = re.split(r'(<[^>]+>)', page)
    for part in parts:
        if part.startswith('<'):
            m = re.match(r'<\s*(/)?\s*([a-zA-Z0-9]+)', part)
            if m:
                closing, tag = m.group(1), m.group(2).lower()
                if closing:
                    while stack:
                        t, _ = stack.pop()
                        if t == tag: break
                elif tag not in VOID and not part.endswith('/>'):
                    cls = re.search(r'class="([^"]*)"', part)
                    skip = tag in SKIP_TAG or bool(cls and SKIP_CLASS.search(cls.group(1)))
                    stack.append((tag, skip))
            out.append(part); continue
        if not part.strip() or any(s for _, s in stack):
            out.append(part); continue
        tags = [t for t, _ in stack]
        in_svg = 'svg' in tags
        if in_svg and not ('text' in tags or 'tspan' in tags):
            out.append(part); continue
        el = 'tspan' if in_svg else 'span'

        def ab_sub(m):
            raw = H.unescape(m.group(1))
            if raw in BYT:
                d = BYT[raw]
                if fid.startswith(('x9', 'y0')): return m.group(0)
                full = d.get(topic, d.get('*'))
            else:
                full = AB.get(raw)
            if not full: return m.group(0)
            return f'<{el} class="ab" data-a="{_esc(full)}">{m.group(1)}</{el}>'
        # abbreviations first, then glossary words in the text that is still plain
        pieces = re.split(r'(<t?span class="ab"[^>]*>.*?</t?span>)', AB_RE.sub(ab_sub, part))
        for i, pc in enumerate(pieces):
            if pc.startswith('<'): continue
            def gl_sub(m):
                key = m.group(1).lower()
                if key not in GL or key in used: return m.group(0)
                used.add(key)
                return f'<{el} class="gl" data-a="{_esc(key + ": " + GL[key])}">{m.group(0)}</{el}>'
            pieces[i] = GL_RE.sub(gl_sub, pc)
        out.append(''.join(pieces))
    return ''.join(out)
