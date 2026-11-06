// Lay the Rapid Review topic cards into two columns per page using the real CSS (needs build/review/index.html built).
// Input build/rr/topics.json + build/rr/chapters.json, output build/rr/pages.json (inner html of each page's main column).
const {chromium}=require('playwright');const fs=require('fs');const R=__dirname+'/../../';
const T=JSON.parse(fs.readFileSync(R+'build/rr/topics.json'));const CH=JSON.parse(fs.readFileSync(R+'build/rr/chapters.json'));
const esc=s=>s;
for(const t of T){const seen=new Set(),kn=[];for(const [v,l] of t.nums){const k=v+'|'+l;if(seen.has(k))continue;seen.add(k);kn.push(`<div class="frow kn"><span>${l}</span><span class="ans">${v}</span></div>`)}
  if(kn.length){kn[0]=`<div class="rvsub">Key numbers</div>`+kn[0]}t.all=t.rows.concat(kn)}
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:900,height:1300}});
await p.goto('file://'+R+'build/review/index.html');await p.waitForTimeout(1500);
await p.click('[data-tab="read"], #tabRead, .tabs button:nth-child(2)').catch(()=>{});await p.waitForTimeout(800);
const out=await p.evaluate(({T,CH,KEEP})=>{
 const sec=document.querySelector('section.page[data-file="x902_rr2"]');sec.dataset.fd=1;sec.classList.remove('fill');sec.style.removeProperty('--ft');
 const main=sec.querySelector('.mzm'),body=sec.querySelector('.body');
 const h1=document.querySelector('section.page[data-file="x901_rr1"] h1.mzt').outerHTML;
 const sc=()=>sec.getBoundingClientRect().height/sec.offsetHeight||1;
 const ok=col=>(body.getBoundingClientRect().bottom-col.getBoundingClientRect().bottom)/sc()>=KEEP;
 const els=h=>{const d=document.createElement('div');d.innerHTML=h;return [...d.children]};
 const add=(cd,h)=>{const e=els(h);e.forEach(x=>cd.appendChild(x));return e};
 const band=c=>els(`<div class="rrc c${c}"><img src="${CH[c].img}" alt=""><div class="rcn"><small>Chapter</small>${c}</div><div class="rct">${CH[c].name}</div></div>`)[0];
 const card=(t,cont)=>els(cont?`<div class="rvk c${t.ch} rvkc"></div>`:`<div class="rvk c${t.ch}"><div class="rvh"><span class="rvn">${t.no}</span><span class="rvt">${t.name}</span></div></div>`)[0];
 const pages=[];let ti=0,ri=0,lastCh=0,pg=0;
 while(ti<T.length){
  main.innerHTML=(pg==0?h1:'')+`<div class="blk" data-id="rr:${pg}"><div class="rrcols"><div class="rrcol"></div><div class="rrcol"></div></div></div>`;
  for(const col of main.querySelectorAll('.rrcol')){
   while(ti<T.length){
    const t=T[ti],R=t.all;let bd=null,cd,placed=[];
    if(ri==0){ if(t.ch!=lastCh){bd=band(t.ch);col.appendChild(bd)} cd=card(t,false);col.appendChild(cd);
      let k=0;for(;k<Math.min(3,R.length);k++)placed.push(add(cd,R[k]));
      if(!ok(col)){cd.remove();if(bd)bd.remove();break}
      ri=k;lastCh=t.ch;
    } else {cd=card(t,true);col.appendChild(cd);placed.push(add(cd,R[ri]));if(!ok(col)){cd.remove();break}ri++}
    let full=false;
    while(ri<R.length){const e=add(cd,R[ri]);if(!ok(col)){e.forEach(x=>x.remove());full=true;break}placed.push(e);ri++}
    if(full){const left=R.length-ri;
      if(left>0&&left<3){const need=3-left;if(placed.length-need>=3){for(let j=0;j<need;j++){placed.pop().forEach(x=>x.remove());ri--}}}
      // never end a column on the "Key numbers" label alone
      const last=cd.lastElementChild;if(last&&last.classList.contains('rvsub')){last.remove()}
      break}
    ti++;ri=0;
   }
  }
  pages.push(main.innerHTML);pg++;if(pg>60)break;
 }
 return pages;},{T,CH,KEEP:+process.env.KEEP||40});
fs.writeFileSync(R+'build/rr/pages.json',JSON.stringify(out));console.log('pages',out.length);await b.close()})();
