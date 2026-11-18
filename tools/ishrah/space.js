const { chromium } = require('playwright');
const W=+(process.argv[2]||1366);
(async()=>{const b=await chromium.launch();const p=await(await b.newContext({viewport:{width:W,height:W<600?844:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto('http://localhost:8820/');await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(1200);
const first=await p.evaluate(()=>document.body.getAttribute('data-page'));await p.screenshot({path:`shots/sp-${W}-1pick.png`,fullPage:true});
await p.evaluate(()=>{location.hash='courses'});await p.waitForTimeout(700);const still=await p.evaluate(()=>document.body.getAttribute('data-page'));
await p.click('[data-act=setspec][data-v=dentistry]');await p.waitForTimeout(1500);await p.screenshot({path:`shots/sp-${W}-2home.png`,fullPage:true});
const home=await p.evaluate(()=>[document.body.getAttribute('data-page'),IS.SPEC,(document.querySelector('main').innerText.match(/Orthodontics|Surgery\b|Pharmaceutics/g)||[]).join(',')]);
const res={};for(const h of ['courses','lecturers','library','community','events','paths','settings','search/a']){await p.evaluate(x=>{location.hash=x},h);await p.waitForTimeout(600);
 res[h]=await p.evaluate(()=>[document.body.getAttribute('data-page'),!!document.querySelector('main .specbar'),document.documentElement.scrollWidth>innerWidth+1])}
await p.evaluate(()=>{location.hash='courses'});await p.waitForTimeout(700);await p.screenshot({path:`shots/sp-${W}-3courses.png`});
const subs=await p.evaluate(()=>[...document.querySelectorAll('#filt .opt span[lang=en]')].map(x=>x.firstChild.textContent).join(','));
await p.evaluate(()=>{location.hash='pick'});await p.waitForTimeout(600);await p.click('[data-act=setspec][data-v=nursing]');await p.waitForTimeout(900);
console.log('first page:',first,'| courses before choosing ->',still,'| home:',home.join(' '),'| filter subjects:',subs,'| after change:',await p.evaluate(()=>IS.SPEC));
console.log(JSON.stringify(res));console.log(errs.length?errs.join('|'):'no errors');await b.close();})();
