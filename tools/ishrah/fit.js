// visits every page at phone, tablet, laptop and desktop widths and reports anything wider than the screen
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();
p.on('dialog',d=>d.accept());const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8820/');await p.evaluate(()=>{localStorage.clear()});await p.reload();await p.waitForTimeout(800);
await p.evaluate(()=>(IS.AUTHTAB='phone',IS.ACT.register)({getAttribute:()=>null}));await p.waitForTimeout(300);
for(const [k,v] of [['name','د. عبدالجليل ارجا'],['phone','0911111111'],['pass','secret12'],['pass2','secret12']])await p.fill(`[data-form=signup] [name=${k}]`,v);
await p.check('[data-form=signup] [name=terms]');await p.click('form[data-form="signup"] button:not([type=button]) >> nth=-1');await p.waitForTimeout(1200);
const pages=['home','specialties','spec/medicine','courses','courses/@lab','learning','events','news','news/all','news/ann','control-news','lecturers','community','library','library/requests','paths','favorites','achievements','support','about','team','settings','account','notifications','search/heart',
 'studio-apply','studio','control','control-tickets','control-tasks','control-pay','control-review','control-apps','control-lecturers','control-payouts','control-students','control-library','control-requests','control-community','control-events','control-notify','control-cats','control-settings','control-audit','control-reports','control-team','control-structure','security'];
for(const W of [390,768,1024,1440]){await p.setViewportSize({width:W,height:900});
 for(const h of pages){await p.evaluate(x=>{location.hash=x},h);await p.waitForTimeout(450);
  const r=await p.evaluate(()=>{const Wd=document.documentElement.clientWidth,sw=document.documentElement.scrollWidth,out=[];
   document.querySelectorAll('body *').forEach(e=>{const x=e.getBoundingClientRect();if(x.width>0&&x.height>0&&(x.right>Wd+1||x.left<-1)&&getComputedStyle(e).position!=='fixed'){let a=e.parentElement,skip=false;while(a){const o=getComputedStyle(a).overflowX;if(o==='auto'||o==='scroll'||o==='hidden'){skip=true;break}a=a.parentElement}if(!skip)out.push(e.tagName.toLowerCase()+'.'+String(e.className).split(' ')[0]+' '+Math.round(x.left)+'..'+Math.round(x.right))}});
   return {sw,Wd,out:out.slice(0,4)}});
  if(r.sw>r.Wd+1||r.out.length)console.log(W,h,'page',r.sw,'>',r.Wd,'|',r.out.join(' ; '));}}
console.log(errs.length?'ERR '+[...new Set(errs)].join(' | '):'checked');await b.close();})();
