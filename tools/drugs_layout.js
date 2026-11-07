// Obstetric drugs pages (owner, 7 Nov 2026): every drug group starts on its own page and ends on its own pages, so no
// group leaves one or two cards on the next page. A group is packed a little tighter (.dcmp) when that saves a page;
// its cards are then shared evenly over its pages and the spare height is spread between and inside the cards.
// The reference tables follow, whole. Input build/dr/units.json (tools/drugs.py), output build/dr/pages.json.
const {chromium}=require('playwright');const fs=require('fs');const R=__dirname+'/../';
const U=JSON.parse(fs.readFileSync(R+'build/dr/units.json'));const KEEP=+process.env.KEEP||25;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:900,height:1300}});
await p.goto('file://'+R+'build/review/index.html');await p.waitForTimeout(1500);
await p.click('[data-tab="read"], #tabRead, .tabs button:nth-child(2)').catch(()=>{});await p.waitForTimeout(800);
await p.evaluate(()=>document.fonts.ready);
const out=await p.evaluate(({U,KEEP})=>{
 const sec=document.querySelector('section.page[data-file="y01x2_dr1"]');sec.dataset.fd=1;
 const main=sec.querySelector('.mzm'),body=sec.querySelector('.body');
 const h1=document.querySelector('section.page[data-file="y01_dr1"] h1.mzt').outerHTML;
 const sc=()=>sec.getBoundingClientRect().height/sec.offsetHeight||1;
 const free=w=>(body.getBoundingClientRect().bottom-w.getBoundingClientRect().bottom)/sc()-KEEP;
 // try a page: head html + list of units, compact or not → free px (negative = does not fit)
 const tryPage=(head,us,cmp)=>{main.innerHTML=head+'<div class="rqp'+(cmp?' dcmp':'')+'">'+us.map(u=>'<div class="rqu">'+u+'</div>').join('')+'</div>';return free(main.querySelector('.rqp'))};
 const greedy=(us,heads,cmp)=>{const P=[];let i=0;while(i<us.length){const head=heads(P.length);let n=0;
   while(i+n<us.length&&(n==0||tryPage(head,us.slice(i,i+n+1),cmp)>=0))n++;P.push(us.slice(i,i+n));i+=n}return P};
 const finish=(head,us,cmp)=>{tryPage(head,us,cmp);const w=main.querySelector('.rqp');const f=free(w),gaps=us.length-1;
   const vj=gaps>0?Math.min(30,Math.floor(f*.3/gaps)):0;w.style.setProperty('--vj',vj+'px');
   let lo=0,hi=20;for(let k=0;k<12;k++){const m=(lo+hi)/2;w.style.setProperty('--rqx',m+'px');if(free(w)>=0)lo=m;else hi=m}
   w.style.setProperty('--rqx',(Math.floor(lo*10)/10)+'px');return main.innerHTML};
 const pages=[];
 U.groups.forEach((g,gi)=>{
  const heads=k=>(gi==0&&k==0)?h1+U.intro:'';
  let P=greedy(g,heads,false),cmp=false;const Pc=greedy(g,heads,true);if(Pc.length<P.length){P=Pc;cmp=true}
  // share the cards evenly: move cards forward while the next page stays fuller-fitting and less full than the one before
  for(let it=0;it<40;it++){let moved=false;
   for(let k=P.length-2;k>=0;k--){if(P[k].length<2)continue;
    const a=tryPage(heads(k),P[k],cmp),bfree=tryPage(heads(k+1),P[k+1],cmp);
    const nb=[P[k][P[k].length-1]].concat(P[k+1]);const nbf=tryPage(heads(k+1),nb,cmp),naf=tryPage(heads(k),P[k].slice(0,-1),cmp);
    if(nbf>=0&&Math.max(naf,nbf)<Math.max(a,bfree)){P[k+1]=nb;P[k]=P[k].slice(0,-1);moved=true}}
   if(!moved)break}
  P.forEach((us,k)=>pages.push(finish(heads(k),us,cmp)));
 });
 greedy(U.refs,()=>'',false).forEach(us=>pages.push(finish('',us,false)));
 return pages;},{U,KEEP});
fs.writeFileSync(R+'build/dr/pages.json',JSON.stringify(out));console.log('pages',out.length);await b.close()})();
