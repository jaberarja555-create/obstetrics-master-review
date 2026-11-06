import re,glob,json,sys
sys.path.insert(0,'tools')
from merge_pieces import close_of
def rowsof(b):
    out=[];i=0
    while True:
        j=b.find('<div class="frow">',i)
        if j<0: return out
        e=close_of(b,j); out.append(b[j:e]); i=e

topics=[]
for f in sorted(glob.glob('content/pages/*_x9*.html')):
    s=open(f).read()
    for mb in re.finditer(r'<div class="mb">',s):
        e=close_of(s,mb.start()); blk=s[mb.start():e]
        h=re.match(r'<div class="mb"><div class="mh[^"]*">',blk); he=close_of(blk,len('<div class="mb">'))
        title=blk[h.end():he-6]; c0=blk.index('<div class="mc">',he); body=blk[c0+16:close_of(blk,c0)-6]
        parts=re.split(r'<h2 class="s">(.*?)</h2>',body)
        seq=[(title,parts[0])]+[(parts[i],parts[i+1]) for i in range(1,len(parts),2)]
        for t,b in seq:
            rows=rowsof(b)
            assert ''.join(rows)==b.strip(), (f,t,b[:200])
            key=__import__('html').unescape(re.sub(r'<[^>]+>','',t).strip())
            if topics and topics[-1]['key']==key: topics[-1]['rows']+=rows
            else: topics.append(dict(key=key,title=t,rows=rows))
for t in topics:
    m=re.match(r'(\d+)\.(\d+) · (.*)$',t['title'],re.S); t['ch']=int(m.group(1)); t['no']=m.group(1)+'.'+m.group(2); t['name']=m.group(3)
print(len(topics),sum(len(t['rows']) for t in topics))
json.dump(topics,open('/home/claude/obstetrics-master-review/build/rr/topics.json','w'),ensure_ascii=False)
for t in topics: print(t['no'],t['key'][:40],len(t['rows']))
