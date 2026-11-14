// Pictures of the first-opening guide (platform/img/tour/<n>.webp): real phone screens with orange numbered marks.
// Serve the Surgery book's docs/ on :8841 and platform/ on :8842, run 'node tools/tour_shots.js' (writes t_*.png here), then convert:
//   i=0; for n in home lib bhome reader select tools practice sub settings; do convert t_$n.png -resize 380x -quality 72 platform/img/tour/$i.webp; i=$((i+1)); done
const pw=require('playwright');
const B='http://localhost:8841/index.html',P='http://localhost:8842/';
async function ctxNew(b,touch=true){const ctx=await b.newContext({viewport:{width:390,height:780},deviceScaleFactor:2,isMobile:touch,hasTouch:touch});
await ctx.route(/supabase|workers\.dev|fonts\.g|studentmasterreview|pages\.dev/,r=>r.abort());
await ctx.addInitScript(()=>{try{localStorage.setItem('srr-chz','1');localStorage.setItem('smr-setup','1');sessionStorage.setItem('smr-wel','1');}catch(e){}});return ctx}
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
async function shot(p,name,marks){console.log(name,await mark(p,marks||[]));await p.waitForTimeout(200);await p.screenshot({path:'t_'+name+'.png'})}
(async()=>{const b=await pw.chromium.launch();let ctx,p;
ctx=await ctxNew(b);p=await ctx.newPage();
await p.goto(P+'#home');await p.waitForTimeout(2200);await shot(p,'home',[['.bnav a, nav a, nav button','الرئيسية',1],['.bnav a, nav a, nav button','مكتبتي',2],['a,button','استكشف المرحلة',3]]);
await p.goto(P+'#my-library');await p.waitForTimeout(1800);await shot(p,'lib',[['a,button','افتح',1]]);
await ctx.close();
ctx=await ctxNew(b);p=await book(ctx);
await shot(p,'bhome',[['button,a','ابدأ القراءة',1],['#v2nav [data-v=v2chapters]',null,2],['#v2nav [data-v=v2practice]',null,3],['.hgr button, #smrBack, .smrback',null,4]]);
await clickText(p,'button,a','ابدأ القراءة');await p.waitForTimeout(2500);
await shot(p,'reader',[['#pnum',null,1],['#v2rnav button, #v2rnav a','المحتويات',2],['#prBtn',null,3]]);
await p.evaluate(()=>document.getElementById('rbShow').click());await p.waitForTimeout(900);
await shot(p,'tools',[['#rbShow',null,1]]);
await ctx.close();
ctx=await ctxNew(b,false);p=await book(ctx);await clickText(p,'button,a','ابدأ القراءة');await p.waitForTimeout(2500);
await p.evaluate(()=>{const e=document.querySelector('#pages .page p.nblead');const t=e.firstChild;const rg=document.createRange();rg.setStart(t,0);rg.setEnd(t,30);const s=getSelection();s.removeAllRanges();s.addRange(rg)});
await p.waitForTimeout(900);await shot(p,'select',[['#hlbar [data-c], #hlbar button',null,1],['#hlbar [data-ulc], #hlbar button','abc',2],['#hlbar button','ملاحظة',3]]);await ctx.close();
ctx=await ctxNew(b);p=await book(ctx);
await p.evaluate(()=>document.querySelector('#v2nav [data-v=v2practice]').click());await p.waitForTimeout(1200);
await shot(p,'practice',[['button,a','ابدأ التدريب',1],['#v2practiceW button, #v2practiceW a, #v2practiceW .v2c','إنشاء اختبار',2],['button,a','البطاقات',3]]);
await p.evaluate(()=>document.querySelector('#v2nav [data-v=v2settings]').click());await p.waitForTimeout(1000);
await shot(p,'settings',[['#v2settingsW button','العربية',1],['#v2settingsW button','نهاري',2]]);
await p.evaluate(()=>{const e=document.querySelector('#v2settingsW [data-act=sub]');e&&e.click()});await p.waitForTimeout(1200);
await shot(p,'sub',[['button,a','ابدأ التجربة',1],['button,a','اشترك الآن',2]]);
await ctx.close();await b.close()})();
