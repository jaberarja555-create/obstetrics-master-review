// Book guide pictures (img/tour_<n>.webp of each book: Obstetrics assets/img, Surgery and Pediatrics content/img).
// Serve the book's built site, run 'node tools/tour_shots_book.js <url of index.html> <prefix orr|srr|prr> <out dir>' (writes b_<n>.png), then
// convert b_$i.png -resize 380x -quality 72 <img folder>/tour_$i.webp and rebuild. Obstetrics: use build/site (not review) so the Subscription screen shows the plans.
const pw=require('playwright');
const B=process.argv[2],PX=process.argv[3],OUT=process.argv[4];
async function ctxNew(b,touch=true){const ctx=await b.newContext({viewport:{width:390,height:780},deviceScaleFactor:2,isMobile:touch,hasTouch:touch});
await ctx.route(/supabase|workers\.dev|fonts\.g|studentmasterreview|pages\.dev/,r=>r.abort());
await ctx.addInitScript((PX)=>{try{localStorage.setItem(PX+'-chz','1');localStorage.setItem(PX+'-btour','1');localStorage.setItem('smr-setup','1');sessionStorage.setItem('smr-wel','1');}catch(e){}},PX);return ctx}
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
async function shot(p,name,marks){console.log(name,await mark(p,marks||[]));await p.waitForTimeout(200);await p.screenshot({path:OUT+'/b_'+name+'.png'})}
(async()=>{const b=await pw.chromium.launch();let ctx,p;
ctx=await ctxNew(b);p=await book(ctx);
await shot(p,'0',[['button,a','ابدأ القراءة',1],['#v2nav [data-v=v2chapters]',null,2],['#v2nav [data-v=v2practice]',null,3]]);
await clickText(p,'button,a','ابدأ القراءة');await p.waitForTimeout(2500);
await shot(p,'1',[['#pnum',null,1],['#v2rnav button, #v2rnav a','المحتويات',2],['#prBtn',null,3]]);
await p.evaluate(()=>document.getElementById('rbShow').click());await p.waitForTimeout(900);
await shot(p,'3',[['#rbShow',null,1]]);
await ctx.close();
ctx=await ctxNew(b,false);p=await book(ctx);await clickText(p,'button,a','ابدأ القراءة');await p.waitForTimeout(2500);
console.log('sel',await p.evaluate(()=>{const w=document.createTreeWalker(document.getElementById('pages'),NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){const t=n.nodeValue;if(t.trim().length<40)continue;const r=document.createRange();r.setStart(n,0);r.setEnd(n,Math.min(28,t.length));const R=r.getBoundingClientRect();if(R.top>130&&R.bottom<420&&R.width>40){const s=getSelection();s.removeAllRanges();s.addRange(r);return t.slice(0,28)}}return 'none'}));
await p.waitForTimeout(900);await shot(p,'2',[['#hlbar [data-c], #hlbar button',null,1],['#hlbar [data-ulc], #hlbar button','abc',2],['#hlbar button','ملاحظة',3]]);await ctx.close();
ctx=await ctxNew(b);p=await book(ctx);
await p.evaluate(()=>document.querySelector('#v2nav [data-v=v2practice]').click());await p.waitForTimeout(1200);
await shot(p,'4',[['button,a','ابدأ التدريب',1],['#v2practiceW button, #v2practiceW a, #v2practiceW .v2c','إنشاء اختبار',2],['button,a','البطاقات',3]]);
await p.evaluate(()=>document.querySelector('#v2nav [data-v=v2settings]').click());await p.waitForTimeout(1000);
await p.evaluate(()=>{const e=document.querySelector('#v2settingsW [data-act=sub]');e&&e.click()});await p.waitForTimeout(1200);
await shot(p,'5',[['button,a','ابدأ التجربة',1],['button,a','اشترك الآن',2]]);
await p.evaluate(()=>document.querySelector('#v2nav [data-v=v2settings]').click());await p.waitForTimeout(1000);
await p.evaluate(()=>{const e=[...document.querySelectorAll('#v2settingsW button,#v2settingsW a,#v2settingsW [data-v]')].find(x=>x.textContent.includes('دليل الاستخدام'));if(e)e.scrollIntoView({block:'center'})});await p.waitForTimeout(500);
await shot(p,'6',[['#v2settingsW [data-v=v2help]',null,1],['#v2settingsW [data-v=v2contact]',null,2]]);
await ctx.close();await b.close()})();