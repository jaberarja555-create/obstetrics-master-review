// owner shows his card, a support manager (made in the preview store) too; then a signed-out visitor sees the team page
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto('http://localhost:8820/');await p.evaluate(()=>(localStorage.clear(),localStorage.setItem('ish-spec','"medicine"'), localStorage.setItem('ish-study-sections', '{"medicine":"clinical"}')));await p.reload();await p.waitForTimeout(700);
await p.evaluate(()=>{IS.AUTHTAB='phone';IS.ACT.register({getAttribute:()=>null})});await p.waitForTimeout(300);
for(const [k,v] of [['name','د. عبدالجليل ارجا'],['phone','0911111111'],['pass','secret123'],['pass2','secret123']])await p.fill(`[data-form=signup] [name=${k}]`,v);
await p.check('[data-form=signup] [name=terms]');await p.click('form[data-form="signup"] button:not([type=button]) >> nth=-1');await p.waitForTimeout(1200);
await p.evaluate(()=>{location.hash='account'});await p.waitForTimeout(800);await p.click('[data-act=mycard]');await p.waitForTimeout(400);
await p.check('[data-form=mycard] [name=pub_show]');await p.fill('[data-form=mycard] [name=pub_title]','Founder · استشاري');await p.fill('[data-form=mycard] [name=pub_bio]','مؤسس منصة اشرح لي، يعمل على تيسير التعليم الطبي لطلبة الكليات الصحية في السودان.');
await p.click('[data-form=mycard] button.pri');await p.waitForTimeout(800);
await p.evaluate(async()=>{for(const [n,t,d] of [['أ. سارة محمد',['support'],'support'],['د. خالد عمر',['academic'],'academic'],['م. أحمد علي',['staff'],'tech']]){await DB.ins('profiles',{name:n,phone:'',email:'',photo:'',team:t,dept:d,team_status:'active',status:'active',pub_show:true,pub_title:'',pub_bio:'',pub_order:100});}});
await p.evaluate(()=>IS.ACT.logout());await p.waitForTimeout(700);
for(const [w,h] of [[1440,900],[390,844]]){await p.setViewportSize({width:w,height:h});await p.evaluate(()=>{location.hash='team'});await p.waitForTimeout(900);await p.screenshot({path:(process.argv[2]||'.')+'/team-'+w+'.png',fullPage:true});}
console.log('cards:',await p.$$eval('.tmc',x=>x.length),'phones shown:',await p.evaluate(()=>/09\d{8}/.test(document.querySelector('#main').innerText)));
console.log(errs.length?errs:'ok');await b.close();})();
