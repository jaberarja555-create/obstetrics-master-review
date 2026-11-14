// App guide pictures (platform/img/tour/<n>.webp). Serve platform/ on :8842 and the Surgery book's docs/ on :8841 (the book frame is routed there),
// run 'node tools/tour_shots_app.js' (writes p_<n>.png in the current folder), then: convert p_$i.png -resize 380x -quality 72 platform/img/tour/$i.webp
const pw=require('playwright');
const B='http://localhost:8841/index.html',P='http://localhost:8842/';
async function ctxNew(b,touch=true){const ctx=await b.newContext({viewport:{width:390,height:780},deviceScaleFactor:2,isMobile:touch,hasTouch:touch});
await ctx.route(/supabase|workers\.dev|fonts\.g|pages\.dev/,r=>r.abort());
await ctx.route(/srg\.studentmasterreview\.com/,async r=>{const u=new URL(r.request().url());try{const res=await r.fetch({url:'http://localhost:8841'+u.pathname+u.search});await r.fulfill({response:res})}catch(e){r.abort()}});
await ctx.route(/(obs|ped)\.studentmasterreview\.com/,r=>r.abort());
await ctx.addInitScript(()=>{try{localStorage.setItem('srr-chz','1');localStorage.setItem('srr-btour','1');localStorage.setItem('smr-tour','1');localStorage.setItem('smr-setup','1');sessionStorage.setItem('smr-wel','1');}catch(e){}});return ctx}
async function book(ctx){const p=await ctx.newPage();await p.goto(B);await p.waitForTimeout(2200);await p.click('#v2welGo');await p.waitForTimeout(1400);
const c=await p.$('#v2chz [data-c="free"]');if(c&&await c.isVisible()){await c.click();await p.waitForTimeout(400);}return p}
const clickText=(p,sel,txt)=>p.evaluate(([s,t])=>{const e=[...document.querySelectorAll(s)].find(x=>x.offsetParent&&x.textContent.includes(t));if(!e)return 'none';e.click();return 'ok'},[sel,txt]);
// marks: [selector, textOrNull, number]
async function mark(p,marks){return p.evaluate(ms=>{document.querySelectorAll('.tmk').forEach(e=>e.remove());try{document.activeElement&&document.activeElement.blur()}catch(e){}const out=[];
 for(const [s,t,n] of ms){const c=[...document.querySelectorAll(s)].filter(x=>{const r=x.getBoundingClientRect();return r.width>0&&r.height>0&&r.top<780&&r.bottom>0&&(!t||x.textContent.includes(t))});c.sort((a,b)=>{const A=a.getBoundingClientRect(),B=b.getBoundingClientRect();return A.width*A.height-B.width*B.height});const e=c[0];if(!e){out.push('miss '+s+' '+t);continue}
 const r=e.getBoundingClientRect(),ring=document.createElement('div');ring.className='tmk';
 Object.assign(ring.style,{position:'fixed',left:(r.left-4)+'px',top:(r.top-4)+'px',width:(r.width+8)+'px',height:(r.height+8)+'px',border:'3px solid #f59e0b',borderRadius:'12px',zIndex:2147483646,boxShadow:'0 0 0 4px rgba(245,158,11,.25)',pointerEvents:'none'});
 const bd=document.createElement('div');bd.className='tmk';bd.textContent=n;const bx=Math.min(Math.max(r.left-12,2),360),by=Math.max(r.top-14,2);
 Object.assign(bd.style,{position:'fixed',left:bx+'px',top:by+'px',width:'26px',height:'26px',borderRadius:'50%',background:'#f59e0b',color:'#fff',font:'700 15px/26px Arial',textAlign:'center',zIndex:2147483647,boxShadow:'0 2px 6px rgba(0,0,0,.35)',pointerEvents:'none',border:'2px solid #fff'});
 document.body.append(ring,bd);out.push('ok '+n)}return out.join(', ')},marks)}
async function shot(p,name,marks){console.log(name,await mark(p,marks||[]));await p.waitForTimeout(200);await p.screenshot({path:'p_'+name+'.png'})}
(async()=>{const b=await pw.chromium.launch();let ctx,p;
ctx=await ctxNew(b);p=await ctx.newPage();
await p.goto(P+'#home');await p.waitForTimeout(2200);
await shot(p,'0',[['.bnav a, nav a, nav button','الرئيسية',1],['.bnav a, nav a, nav button','مكتبتي',2],['a,button','استكشف المرحلة',3]]);
await shot(p,'4',[['#thb',null,1],['header [aria-label="بحث"]',null,2],['header [aria-label="الإشعارات"]',null,3],['header .pchip, header [aria-label^="الملف"]',null,4]]);
await p.goto(P+'#my-library');await p.waitForTimeout(1800);await shot(p,'1',[['a,button','افتح',1]]);
await p.goto(P+'#read-surgery');await p.waitForTimeout(6000);
const f=p.frames().find(x=>x.url().includes('srg.studentmasterreview'));console.log('frame',!!f);
if(f){try{await f.click('#v2welGo',{timeout:4000})}catch(e){} await p.waitForTimeout(1500);await f.evaluate(()=>{const c=document.querySelector('#v2chz [data-c="free"]');c&&c.click()});await p.waitForTimeout(600);
 const r=await f.evaluate(()=>{const e=document.getElementById('smrBack')||document.querySelector('.smrback,[data-smr-back]');if(!e)return null;const R=e.getBoundingClientRect();return [R.left,R.top,R.width,R.height]});console.log('lib btn',r);
 if(r){await p.evaluate(r=>{document.querySelectorAll('.tmk').forEach(e=>e.remove());const ring=document.createElement('div');ring.className='tmk';Object.assign(ring.style,{position:'fixed',left:(r[0]-4)+'px',top:(r[1]-4)+'px',width:(r[2]+8)+'px',height:(r[3]+8)+'px',border:'3px solid #f59e0b',borderRadius:'12px',zIndex:2147483646,boxShadow:'0 0 0 4px rgba(245,158,11,.25)'});const bd=document.createElement('div');bd.className='tmk';bd.textContent='1';Object.assign(bd.style,{position:'fixed',left:Math.max(r[0]-12,2)+'px',top:Math.max(r[1]-14,2)+'px',width:'26px',height:'26px',borderRadius:'50%',background:'#f59e0b',color:'#fff',font:'700 15px/26px Arial',textAlign:'center',zIndex:2147483647,border:'2px solid #fff'});document.body.append(ring,bd)},r)}
 await p.screenshot({path:'p_2.png'})}
await p.goto(P+'#progress');await p.waitForTimeout(1800);await shot(p,'3',[]);
await p.goto(P+'#preferences');await p.waitForTimeout(1800);await p.evaluate(()=>{const h=[...document.querySelectorAll('main h2')].find(x=>x.textContent.trim()==='اللغة');h&&window.scrollTo(0,h.getBoundingClientRect().top+scrollY-90)});await p.waitForTimeout(500);await shot(p,'5',[['main button','العربية',1],['main [data-theme="dark"]',null,2],['main .pal, main [data-pal]',null,3]]);
await ctx.close();await b.close()})();