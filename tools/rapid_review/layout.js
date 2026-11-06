const {chromium}=require('playwright');const fs=require('fs');
const T=JSON.parse(fs.readFileSync('/home/claude/obstetrics-master-review/build/rr/topics.json'));const CH=JSON.parse(fs.readFileSync('/home/claude/obstetrics-master-review/build/rr/chapters.json'));
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:900,height:1300}});
await p.goto('file:///home/claude/obstetrics-master-review/build/review/index.html');await p.waitForTimeout(1500);
await p.click('[data-tab="read"], #tabRead, .tabs button:nth-child(2)').catch(()=>{});await p.waitForTimeout(800);
const out=await p.evaluate(({T,CH,KEEP})=>{
 const sec=document.querySelector('section.page[data-file="x902_rr2"]');sec.dataset.fd=1;sec.classList.remove('fill');sec.style.removeProperty('--ft');
 const main=sec.querySelector('.mzm'),body=sec.querySelector('.body');
 const h1=document.querySelector('section.page[data-file="x901_rr1"] h1.mzt').outerHTML;
 const sc=()=>sec.getBoundingClientRect().height/sec.offsetHeight||1;
 const ok=col=>(body.getBoundingClientRect().bottom-col.getBoundingClientRect().bottom)/sc()>=KEEP;
 const el=h=>{const d=document.createElement('div');d.innerHTML=h;return d.firstElementChild};
 const band=c=>el(`<div class="rrc c${c}"><img src="${CH[c].img}" alt=""><div class="rcn"><small>Chapter</small>${c}</div><div class="rct">${CH[c].name}</div></div>`);
 const card=(t,cont)=>el(cont?`<div class="rvk c${t.ch} rvkc"></div>`:`<div class="rvk c${t.ch}"><div class="rvh"><span class="rvn">${t.no}</span><span class="rvt">${t.name}</span></div></div>`);
 const pages=[];let ti=0,ri=0,lastCh=0,pg=0;
 while(ti<T.length){
  main.innerHTML=(pg==0?h1:'')+`<div class="blk" data-id="rr:${pg}"><div class="rrcols"><div class="rrcol"></div><div class="rrcol"></div></div></div>`;
  for(const col of main.querySelectorAll('.rrcol')){
   while(ti<T.length){
    const t=T[ti];let bd=null,cd;
    if(ri==0){ if(t.ch!=lastCh){bd=band(t.ch);col.appendChild(bd)} cd=card(t,false);col.appendChild(cd);
      let k=0;for(;k<Math.min(3,t.rows.length);k++)cd.appendChild(el(t.rows[k]));
      if(!ok(col)){cd.remove();if(bd)bd.remove();break}
      ri=k;lastCh=t.ch;
    } else {cd=card(t,true);col.appendChild(cd);cd.appendChild(el(t.rows[ri]));if(!ok(col)){cd.remove();break}ri++}
    let full=false;
    while(ri<t.rows.length){const r=el(t.rows[ri]);cd.appendChild(r);if(!ok(col)){r.remove();full=true;break}ri++}
    if(full){const left=t.rows.length-ri;
      if(left>0&&left<3){const need=3-left;const here=cd.querySelectorAll('.frow').length;if(here-need>=3){for(let j=0;j<need;j++){cd.lastElementChild.remove();ri--}}}
      break}
    ti++;ri=0;
   }
  }
  pages.push(main.innerHTML);pg++;if(pg>40)break;
 }
 return pages;},{T,CH,KEEP:+process.env.KEEP||40});
fs.writeFileSync('/home/claude/obstetrics-master-review/build/rr/pages.json',JSON.stringify(out));console.log('pages',out.length);await b.close()})();
