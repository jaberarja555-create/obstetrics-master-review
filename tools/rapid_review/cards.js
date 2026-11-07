// Lay the exam recap cards (build/rr/cards.json) on the Rapid Review pages: whole cards, full width, never split; a chapter
// band stays with its first card. The page's spare height is then spread between the cards (--vj) and inside them (--rqx),
// leaving KEEP px at the foot. Needs build/review/index.html; writes build/rr/pages.json (inner html of each page's main column).
const {chromium}=require('playwright');const fs=require('fs');const R=__dirname+'/../../';
const C=JSON.parse(fs.readFileSync(R+'build/rr/cards.json'));const CH=JSON.parse(fs.readFileSync(R+'build/rr/chapters.json'));
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:900,height:1300}});
await p.goto('file://'+R+'build/review/index.html');await p.waitForTimeout(1500);
await p.click('[data-tab="read"], #tabRead, .tabs button:nth-child(2)').catch(()=>{});await p.waitForTimeout(800);
await p.evaluate(()=>document.fonts.ready);
const out=await p.evaluate(({C,CH,KEEP})=>{
 const sec=document.querySelector('section.page[data-file="x902_rr2"]');sec.dataset.fd=1;sec.classList.remove('fill');sec.style.removeProperty('--ft');
 const main=sec.querySelector('.mzm'),body=sec.querySelector('.body');
 const h1=document.querySelector('section.page[data-file="x901_rr1"] h1.mzt').outerHTML;
 const sc=()=>sec.getBoundingClientRect().height/sec.offsetHeight||1;
 const free=w=>(body.getBoundingClientRect().bottom-w.getBoundingClientRect().bottom)/sc()-KEEP;
 const band=c=>`<div class="rrc c${c}"><img src="${CH[c].img}" alt=""><div class="rcn"><small>Chapter</small>${c}</div><div class="rct">${CH[c].name}</div></div>`;
 const units=[];let last=0;for(const c of C){units.push((c.ch!=last?band(c.ch):'')+c.html);last=c.ch}
 const pages=[];let i=0;
 while(i<units.length&&pages.length<80){
  main.innerHTML=(pages.length==0?h1:'')+'<div class="rqp"></div>';const w=main.querySelector('.rqp');let n=0;
  while(i<units.length){const u=document.createElement('div');u.className='rqu';u.innerHTML=units[i];w.appendChild(u);
   if(free(w)<0&&n>0){u.remove();break}n++;i++}
  // spread the spare height: first between the cards, then inside them
  let f=free(w),gaps=n-1,vj=gaps>0?Math.min(36,Math.floor(f*.3/gaps)):0;w.style.setProperty('--vj',vj+'px');
  let lo=0,hi=24;for(let k=0;k<12;k++){const m=(lo+hi)/2;w.style.setProperty('--rqx',m+'px');if(free(w)>=0)lo=m;else hi=m}
  w.style.setProperty('--rqx',(Math.floor(lo*10)/10)+'px');
  pages.push(main.innerHTML);
 }
 return pages;},{C,CH,KEEP:+process.env.KEEP||25});
fs.writeFileSync(R+'build/rr/pages.json',JSON.stringify(out));console.log('pages',out.length);await b.close()})();
