const { chromium } = require('playwright');
const sizes=(process.argv[2]||'390x844,412x915,360x740,1280x800,800x1280,1024x768,1440x900').split(',');
(async()=>{const b=await chromium.launch();
for(const s of sizes){const [w,h]=s.split('x').map(Number);const p=await(await b.newContext({viewport:{width:w,height:h},hasTouch:w<1100})).newPage();
await p.goto('http://localhost:' + (process.env.PORT || 8820) + '/');await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(1200);
const r=await p.evaluate(()=>[document.body.getAttribute('data-page'),document.documentElement.scrollHeight-innerHeight]);
console.log(s,r[0],'scroll',r[1]);await p.screenshot({path:(process.argv[3] || '.') + '/pick-'+s+'.png'});await p.close();}
await b.close();})();
