// owner publishes 4 news items with pictures and 4 announcements, then the news page at laptop and phone widths
const { chromium } = require('playwright');
const S='/home/user/obstetrics-master-review/tools/ishrah/receipt.png';
(async()=>{const b=await chromium.launch();const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto('http://localhost:8820/');await p.evaluate(()=>(localStorage.clear(),localStorage.setItem('ish-spec','"medicine"')));await p.reload();await p.waitForTimeout(700);
await p.evaluate(()=>{IS.AUTHTAB='phone';IS.ACT.register({getAttribute:()=>null})});await p.waitForTimeout(300);
for(const [k,v] of [['name','د. عبدالجليل ارجا'],['phone','0911111111'],['pass','secret123'],['pass2','secret123']])await p.fill(`[data-form=signup] [name=${k}]`,v);
await p.check('[data-form=signup] [name=terms]');await p.click('form[data-form="signup"] button:not([type=button]) >> nth=-1');await p.waitForTimeout(1200);
// pictures for the news: crops of the platform's own banner photos
const pics=['img/ban_events.webp','img/ban_achievements.webp','img/ban_community.webp','img/ban_learning.webp'];
const items=[['ندوة علمية حول التطورات في الرعاية الصحية','events'],['تهنئة للطلاب المتفوقين في الفصل الماضي','achievements'],['قافلة طبية لخدمة المجتمع المحلي','initiatives'],['افتتاح مكتبة الملفات لكل التخصصات','news']];
for(let i=0;i<4;i++){await p.evaluate(()=>{location.hash='control-news'});await p.waitForTimeout(700);
 await p.fill('[data-form=newsadd] [name=title]',items[i][0]);await p.selectOption('[data-form=newsadd] [name=tag]',items[i][1]);await p.fill('[data-form=newsadd] [name=body]','نص الخبر للتجربة.');
 const buf=await p.evaluate(async u=>{const r=await fetch(u);const a=new Uint8Array(await r.arrayBuffer());return Array.from(a)},pics[i]);
 await p.setInputFiles('[data-form=newsadd] [name=cover]',{name:'n.webp',mimeType:'image/webp',buffer:Buffer.from(buf)});
 await p.click('[data-form=newsadd] button.pri');await p.waitForTimeout(900);}
await p.screenshot({path:(process.argv[2]||'.')+'/cnews.png'});
for(const t of ['بدء التسجيل للفصل الدراسي القادم','ورشة عمل: مهارات البحث العلمي','تحديث على خطة الدراسة','موعد امتحان الامتياز']){await p.evaluate(()=>{location.hash='control-notify'});await p.waitForTimeout(600);await p.fill('[data-form=broadcast] [name=title]',t);await p.click('[data-form=broadcast] button.pri');await p.waitForTimeout(700);}
for(const [w,h] of [[1440,900],[390,844]]){await p.setViewportSize({width:w,height:h});await p.evaluate(()=>{location.hash='news'});await p.waitForTimeout(900);await p.screenshot({path:(process.argv[2]||'.')+`/news-${w}.png`,fullPage:true});}
await p.evaluate(()=>{location.hash='news/all'});await p.waitForTimeout(800);
const first=await p.getAttribute('.ncard','href');await p.evaluate(h=>{location.hash=h.slice(1)},first);await p.waitForTimeout(800);await p.screenshot({path:(process.argv[2]||'.')+'/news-item.png',fullPage:true});
console.log(errs.length?errs:'ok');await b.close();})();
