"""One-time: split the recovered app into editable sources.
  recovered/index_full.html (review copy, all pages) + site/index.html (sale shell)
  -> src/shell.html, content/pages/NNN_<file>.html, content/{meta,decks,qbank,audio}.json"""
import re, json, os, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
full = open(os.path.join(R, 'recovered/index_full.html'), encoding='utf-8').read()
sale = open(os.path.join(R, 'site/index.html'), encoding='utf-8').read()
def js(s, i): return re.search(r'<script type="application/json" id="%s">(.*?)</script>' % i, s, re.S).group(1)
os.makedirs(os.path.join(R, 'content/pages'), exist_ok=True)
for i in ['meta', 'decks', 'qbank', 'audio']:
    json.dump(json.loads(js(full, i)), open(os.path.join(R, 'content/%s.json' % i), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
tpl = re.search(r'<template id="bookPages">(.*?)</template>', full, re.S).group(1)
secs = re.findall(r'(<section class="page[^"]*" id="p(\d+)" data-file="([^"]+)">.*?</section>)', tpl, re.S)
for html, no, f in secs:
    open(os.path.join(R, 'content/pages/%03d_%s.html' % (int(no), f)), 'w', encoding='utf-8').write(html)
shell = re.sub(r'<template id="bookPages">.*?</template>', '<template id="bookPages">{{PAGES}}</template>', sale, flags=re.S)
for i in ['meta', 'decks', 'qbank', 'audio']:
    shell = re.sub(r'(<script type="application/json" id="%s">).*?(</script>)' % i, lambda m: m.group(1) + '{{%s}}' % i.upper() + m.group(2), shell, flags=re.S)
shell = re.sub(r'window\.OBS_INFO=\{.*?\}</script>', 'window.OBS_INFO={{OBS_INFO}}</script>', shell, flags=re.S)
os.makedirs(os.path.join(R, 'src'), exist_ok=True)
open(os.path.join(R, 'src/shell.html'), 'w', encoding='utf-8').write(shell)
print(len(secs), 'pages;', 'shell', len(shell))
