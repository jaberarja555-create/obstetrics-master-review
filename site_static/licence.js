/* Obstetrics Master Review: free trial + activation codes.
   The locked pages, flashcards and questions are in content.bin, scrambled with AES-GCM.
   A valid code (checked by Supabase, no sign-in) returns the key; the key is kept on this device. */
(function(){
var CFG=window.OBS_CFG||{}, INFO=window.OBS_INFO||{};
function LS(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){return null}}
var $=function(id){return document.getElementById(id)};
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
function E(t){return '<span class="en">'+t+'</span>'}
window.__LK=INFO.locked||{};
/* device id: random, kept on this device */
var DEV=LS('orr-dev');if(!DEV||!/^[0-9a-f]{20}$/.test(DEV)){var r=new Uint8Array(10);crypto.getRandomValues(r);DEV=[].map.call(r,function(b){return ('0'+b.toString(16)).slice(-2)}).join('');LS('orr-dev',DEV)}
function kind(){var ua=navigator.userAgent;return (/Android|iPhone|iPod|iPad|Mobile/i.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1))?'phone':'computer'}
function label(){var ua=navigator.userAgent;if(/iPad/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1))return 'iPad';if(/iPhone/.test(ua))return 'iPhone';if(/Android/.test(ua))return /Mobile/.test(ua)?'Android phone':'Android tablet';if(/Windows/.test(ua))return 'Windows computer';if(/Macintosh/.test(ua))return 'Mac computer';if(/CrOS/.test(ua))return 'Chromebook';if(/Linux/.test(ua))return 'Linux computer';return 'Device'}
function b64d(s){var b=atob(s),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
/* ---------- unscramble the full book ---------- */
function decrypt(keyB64){
  return fetch('content.bin').then(function(r){if(!r.ok)throw new Error('fetch');return r.arrayBuffer()}).then(function(buf){
    var u=new Uint8Array(buf),iv=u.slice(0,12),ct=u.slice(12);
    return crypto.subtle.importKey('raw',b64d(keyB64),'AES-GCM',false,['decrypt']).then(function(k){
      return crypto.subtle.decrypt({name:'AES-GCM',iv:iv},k,ct).catch(function(){var e=new Error('badkey');e.badkey=true;throw e})})
  }).then(function(pt){
    var ds=new Response(new Blob([pt]).stream().pipeThrough(new DecompressionStream('gzip')));return ds.text()
  }).then(JSON.parse)}
function apply(data){
  var tpl=$('bookPages').content,holder=document.createElement('template');
  Object.keys(data.pages).forEach(function(f){var old=tpl.querySelector('section.page[data-file="'+f+'"]');if(!old)return;holder.innerHTML=data.pages[f];var nw=holder.content.firstElementChild;if(nw)old.replaceWith(nw)});
  var d=JSON.parse($('decks').textContent);Object.keys(data.decks).forEach(function(k){d[k]=data.decks[k]});
  var ordered={};(INFO.order||[]).forEach(function(k){if(d[k])ordered[k]=d[k]});Object.keys(d).forEach(function(k){if(!ordered[k])ordered[k]=d[k]});
  $('decks').textContent=JSON.stringify(ordered);
  $('qbank').textContent=JSON.stringify(data.qbank);
  window.__LK={};document.documentElement.classList.add('unlocked')}
var UNLOCKED=false;
/* trial (owner, 6 Nov 2026, as in Surgery): on opening, a new device chooses the trial (the WHOLE book for CFG.trial_hours,
   1 h) or the subscription. Supabase obs_trial(p_dev) keeps each device's first start and returns the key only inside the
   window (tools/supabase/obs_trial.sql). orr-trial = {s,m,x,seen}; the trial key is kept apart in orr-tk and dropped at the end.
   After the trial the free topics (first topic of each chapter) stay open as before. */
var TMS=(+CFG.trial_hours||0)*3600e3,INTRIAL=false;
function tget(){try{return JSON.parse(LS('orr-trial')||'null')}catch(e){return null}}
function tput(t){LS('orr-trial',JSON.stringify(t))}
function tleft(){var t=tget();if(!TMS||!t||!t.s||t.x)return 0;var now=Date.now();if(now<t.m-6e5)t.x=1;t.m=Math.max(t.m,now);if(now>=t.s+TMS)t.x=1;tput(t);return t.x?0:t.s+TMS-now}
function tdur(){var h=+CFG.trial_hours||1;return h===1?'ساعة كاملة':h===2?'ساعتين':h+' ساعة'}
function tleftTxt(){var ms=tleft(),h=Math.floor(ms/36e5),m=Math.floor(ms%36e5/6e4);return 'باقي '+(h?h+' ساعة و':'')+m+' دقيقة'}
function trialUI(){document.documentElement.classList.remove('unlocked');document.documentElement.classList.add('intrial');
  var up=function(){[].forEach.call(document.querySelectorAll('.unl,.trialbar'),function(b){var t=b.querySelector('b'),sm=b.querySelector('small'),nm=b.querySelector('.nms');
    if(t)t.textContent='الفترة التجريبية · '+tleftTxt();if(sm)sm.textContent='الكتاب كله مفتوح الآن. اضغط هنا للاشتراك قبل انتهاء الفترة.';if(nm)nm.hidden=true})};
  up();setInterval(up,30000);setTimeout(function(){location.reload()},Math.min(tleft()+500,2e9))}
/* plans that end (owner, 10 Nov 2026): orr-exp = end time (ms) of a monthly / annual plan, orr-plan, orr-sname = the name the owner
   approved, orr-ended = the plan ended on this device. The server decides (obs_check); the date kept here only tells when to ask. */
function saveMeta(j){LS('orr-exp',j.exp?String(Date.parse(j.exp)):null);LS('orr-plan',j.plan||null);if(j.name)LS('orr-sname',j.name);LS('orr-ended',null)}
function ended(){LS('orr-k',null);LS('orr-kc',null);LS('orr-ended','1')}
function start(){
  var k=LS('orr-k'),ex=+LS('orr-exp')||0,pre=Promise.resolve();
  if(k&&ex&&Date.now()>ex)pre=sb().then(function(c){return c.rpcAnon('obs_check',{p_dev:DEV})}).then(function(r){var j=r.data;if(r.error||!j){k=null;return}
    if(j.ok){saveMeta(j);LS('orr-kc',String(Date.now()));if(j.key){LS('orr-k',j.key);k=j.key}}else{if(j.reason==='expired')ended();else{LS('orr-k',null);LS('orr-kc',null)}k=null}}).catch(function(){k=null});
  pre.then(function(){
  var tk=!k&&!LS('orr-k')&&TMS&&LS('orr-tk');
  if(tk&&!(tleft()>0)){LS('orr-tk',null);tk=null}
  var key=k||tk,ok=window.crypto&&crypto.subtle&&window.DecompressionStream;
  var p=key&&ok?decrypt(key).then(function(data){apply(data);if(k)UNLOCKED=true;else{INTRIAL=true;trialUI()}}).catch(function(e){if(e&&e.badkey){LS(k?'orr-k':'orr-tk',null)}}):Promise.resolve();
  p.then(function(){window.__boot&&window.__boot();if(UNLOCKED)recheck();afterLogin()})})}
/* ---------- Supabase: students need no sign-in; the app's public key is enough ---------- */
var SBC=window.OBS_SB(CFG,'orr-auth');
function sb(){return SBC.ready?Promise.resolve(SBC):Promise.reject(new Error('noconfig'))}
/* sync of notes, highlights, drawings and progress between the two devices of one code (obs_sync_get / obs_sync_put).
   The server finds the code from this device id, so only an activated device can read or write its data. */
window.__obsSync={act:function(){return UNLOCKED},on:function(){return UNLOCKED&&!!SBC.ready},
  call:function(b){return sb().then(function(c){return b&&b.data?c.rpcAnon('obs_sync_put',{p_dev:DEV,p_ver:b.ver||0,p_data:b.data}):c.rpcAnon('obs_sync_get',{p_dev:DEV})})
    .then(function(r){if(r.error){var m=String(r.error.message||r.error.code||'');throw {reason:/obs_sync|function/.test(m)?'setup':'net'}}return r.data})}};
/* re-check the code every 3 days when online: switched off or devices reset → lock again */
function recheck(){var last=+(LS('orr-kc')||0);if(Date.now()-last<(LS('orr-exp')?1:3)*864e5||navigator.onLine===false)return;
  sb().then(function(c){return c.rpcAnon('obs_check',{p_dev:DEV}).then(function(r){var j=r.data;if(r.error||!j)return;
    if(j.ok){saveMeta(j);LS('orr-kc',String(Date.now()));if(j.key&&j.key!==LS('orr-k')){LS('orr-k',j.key);location.reload()}}
    else if(j.reason==='expired'){ended();location.reload()}
    else if(j.reason==='off'||j.reason==='none'){LS('orr-k',null);LS('orr-kc',null);alert(j.reason==='none'?'الكود بتاعك اتشال من الجهاز دا، فالكتاب الكامل اتقفل هنا. لو دا غلط كلّم '+(CFG.contact||'')+'.':'الكود بتاعك اتوقف، فالكتاب الكامل اتقفل في الجهاز دا. كلّم '+(CFG.contact||'')+'.');location.reload()}})}).catch(function(){})}
/* ---------- the subscription sheet ---------- */
var sh=document.createElement('div');sh.className='sheet';sh.id='subSheet';sh.hidden=true;
sh.innerHTML='<div class="in ar subin" role="dialog" aria-modal="true" dir="rtl"><h3><span>الاشتراك في الكتاب</span><button class="chip" type="button" id="subX">Close</button></h3><img class="sublogo" src="img/logo3.webp" alt=""><div id="subBody"></div></div>';
document.body.appendChild(sh);
/* MUST (owner, 6 Nov 2026): on the first opening the student has to pick one of the choices; the sheet cannot be closed until then */
var MUST=false;function setMust(v){MUST=v;sh.classList.toggle('must',v)}
function fresh(){var t=null;try{t=JSON.parse(LS('orr-trial')||'null')}catch(e){}return !!(+CFG.trial_hours)&&!UNLOCKED&&!(t&&t.s)}
$('subX').onclick=function(){if(MUST)return;sh.hidden=true};sh.addEventListener('click',function(e){if(e.target===sh&&!MUST)sh.hidden=true;if(e.target.closest('[data-choose]')){choiceSnd('free');openChoose()}});
function freeList(){return '<span class="nms">'+(INFO.free_names||[]).map(function(n){return '<span class="nmc en">'+esc(n)+'</span>'}).join('')+'</span>'}
var ERR={bad:'هذا الكود غير صحيح. تأكد منه (الحروف والأرقام) وحاول مرة أخرى.',off:'هذا الكود موقوف. تواصل مع '+esc(CFG.contact||'')+'.',noconfig:'التفعيل غير جاهز بعد. راسل '+esc(CFG.contact||'')+' في واتساب.',net:'لا يوجد اتصال بالإنترنت. التفعيل يحتاج إلى الإنترنت مرة واحدة فقط.'};
function body(html){$('subBody').innerHTML=html}
function render(){
  if(UNLOCKED){body('<p class="lead">هذا الجهاز مفعّل والكتاب مفتوح كاملًا. شكرًا لك!</p>'+(LS('orr-code')?'<div class="devc"><span>كود التفعيل</span><b dir="ltr">'+esc(LS('orr-code'))+'</b></div>':'')+
    '<div class="relx"><b class="ssth">تغيير الجهاز</b><p class="muted">إذا أردت أن تنقل الكتاب إلى جهاز آخر، أزل الكود من هذا الجهاز أولًا، ثم اكتبه في الجهاز الجديد. ملاحظاتك وتظليلك وتقدّمك محفوظة مع الكود وتظهر في الجهاز الجديد.</p>'+
    '<button type="button" class="btn relb" id="relGo">إزالة الكود من هذا الجهاز</button><p class="muted" id="relMsg"></p></div>');
    $('relGo').onclick=releaseCode;return}
  var wa=(CFG.whatsapp||'').replace(/[^0-9]/g,''),who=esc(CFG.contact||'');
  var msg='السلام عليكم '+(CFG.contact||'')+'، أرغب في الاشتراك في كتاب Obstetrics Master Review.';
  body((INTRIAL?'<p class="lead">أنت الآن في <b>الفترة التجريبية</b>: الكتاب كله مفتوح ('+tleftTxt()+').</p>':'')+'<p class="lead">النسخة المجانية تفتح لك <b>الموضوع الأول من كل فصل</b> مع بطاقاته وأسئلته:'+freeList()+'اشترك مرة واحدة لتفتح <b>الكتاب كاملًا</b>، وكل البطاقات، وبنك الأسئلة كاملًا، طوال هذه الطبعة.</p>'+
   (CFG.price?'<div class="price">قيمة الاشتراك: '+esc(CFG.price)+'</div>':'')+
   '<b class="ssth">طريقة الاشتراك</b><ol class="sst"><li><b>حوّل قيمة الاشتراك</b> عن طريق تطبيق بنكك'+(CFG.bankak?' إلى الحساب رقم <b dir="ltr">'+esc(CFG.bankak)+'</b>'+(CFG.bankak_name?' باسم '+esc(CFG.bankak_name):''):'، وسنرسل لك رقم الحساب في واتساب')+'.</li>'+
   '<li><b>اضغط زر واتساب</b> في الأسفل، وأرسل صورة إشعار التحويل إلى '+who+(CFG.whatsapp_local?' على الرقم <b dir="ltr">'+esc(CFG.whatsapp_local)+'</b>':'')+'.</li>'+
   '<li>سنرسل لك <b>كود التفعيل</b> في واتساب. الصقه في الخانة أدناه واضغط <b>تفعيل</b>. لا تحتاج إلى تسجيل دخول.</li></ol>'+
   '<p class="muted">الكود الواحد يفتح <b>هاتفًا واحدًا وحاسوبًا واحدًا</b>، وأول جهازين يستخدمانه يرتبطان به.</p>'+
   (wa?'<a class="btn wa" href="https://wa.me/'+wa+'?text='+encodeURIComponent(msg)+'" target="_blank" rel="noopener">اضغط هنا لمراسلة '+who+' في واتساب</a>':'')+
   '<div id="actArea"><p class="muted">لحظة…</p></div>');
  sb().then(function(c){
    $('actArea').innerHTML='<b class="ssth">عندك كود التفعيل؟</b><input id="actIn" dir="ltr" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="OBS-XXXX-XXXX"><button type="button" class="btn" id="actGo">تفعيل</button><p class="muted" id="actMsg"></p>';
    $('actGo').onclick=function(){var code=$('actIn').value.toUpperCase().replace(/\s+/g,'');if(!code){$('actMsg').textContent='الصق الكود أولًا.';return}
      if(!(window.crypto&&crypto.subtle&&window.DecompressionStream)){$('actMsg').textContent='هذا المتصفح قديم. افتح الكتاب في متصفح Chrome أو Safari حديث.';return}
      $('actMsg').textContent='جارٍ التفعيل…';
      c.rpcAnon('obs_activate',{p_code:code,p_dev:DEV,p_kind:kind(),p_label:label()}).then(function(r){var j=r.data;
        if(r.error||!j){$('actMsg').textContent=ERR.net;return}
        if(!j.ok){$('actMsg').textContent=j.reason==='taken'?'هذا الكود مستخدم في '+(kind()==='phone'?'هاتف':'حاسوب')+' آخر. لتنقله إلى هذا الجهاز: افتح الكتاب في الجهاز القديم، ثم «إدارة الجهاز» ← «إزالة الكود من هذا الجهاز». إذا فقدت الجهاز القديم فراسل '+(CFG.contact||'')+' في واتساب.':(ERR[j.reason]||ERR.bad);return}
        return decrypt(j.key).then(function(){saveMeta(j);LS('orr-k',j.key);LS('orr-code',j.code||code);LS('orr-kc',String(Date.now()));$('actMsg').textContent='تم التفعيل بنجاح! يُفتح الكتاب كاملًا الآن…';choiceSnd('ok');sh.hidden=true;openingFx('تم التفعيل · جارٍ فتح الكتاب كاملًا');setTimeout(function(){location.reload()},1000)})
      }).catch(function(){$('actMsg').textContent=ERR.net})}
  }).catch(function(e){$('actArea').innerHTML='<p class="muted">'+(ERR[e&&e.message]||ERR.net)+'</p>'})}
/* sound for each choice and an opening animation (owner, 6 Nov 2026, as in Surgery) */
var actx=null;function chime(notes,type){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();var t0=actx.currentTime+.02;
  notes.forEach(function(f,i){var o=actx.createOscillator(),g=actx.createGain(),t=t0+i*.09;o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.18,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+.55);o.connect(g);g.connect(actx.destination);o.start(t);o.stop(t+.6)})}catch(e){}}
function choiceSnd(k){if(k==='trial')chime([523.3,659.3,784,1046.5,1318.5,1568],'triangle');else if(k==='paid')chime([392,523.3,659.3,784],'sine');else if(k==='code')chime([880,1174.7],'sine');else if(k==='ok')chime([523.3,784,1046.5,1568],'triangle');else chime([659.3,523.3],'sine')}
function openingFx(msg){var d=$('opening');if(!d){d=document.createElement('div');d.id='opening';document.body.appendChild(d)}
  d.innerHTML='<img src="img/logo3.webp" alt=""><b dir="rtl">'+msg+'</b><i><span></span></i>';requestAnimationFrame(function(){d.classList.add('on')})}
function setTitle(t){sh.querySelector('h3 span').textContent=t}
/* the student removes the code from this device himself (owner, 6 Nov 2026): tap twice; Supabase obs_release (tools/supabase/migrations/001_obs_release.sql) */
function releaseCode(){var b=$('relGo'),m=$('relMsg');
  if(!b.dataset.sure){b.dataset.sure='1';b.textContent='تأكيد: أزل الكود من هذا الجهاز';b.classList.add('sure');m.textContent='سيُقفل الكتاب في هذا الجهاز، ويمكنك استعمال الكود في جهاز آخر.';return}
  if(navigator.onLine===false){m.textContent='يحتاج هذا إلى الإنترنت. تأكد من الاتصال وحاول مرة أخرى.';return}
  b.disabled=true;m.textContent='جارٍ الحفظ والإزالة…';
  var pre=window.__obsSyncNow?Promise.resolve(window.__obsSyncNow()).catch(function(){}):Promise.resolve();
  pre.then(function(){return sb()}).then(function(c){return c.rpcAnon('obs_release',{p_dev:DEV})}).then(function(r){
    if(r.error){b.disabled=false;m.textContent='هذه الخدمة غير جاهزة بعد. راسل '+(CFG.contact||'')+' في واتساب لنقل الكود.';return}
    choiceSnd('free');LS('orr-k',null);LS('orr-kc',null);LS('orr-code',null);m.textContent='تمت إزالة الكود من هذا الجهاز.';setTimeout(function(){location.reload()},900)
  }).catch(function(){b.disabled=false;m.textContent=ERR.net})}
/* start the trial (also called from the new subscription page) */
function startTrial(onFail){choiceSnd('trial');openingFx('جارٍ فتح الكتاب كاملًا · '+tdur());
  var fail=function(m){var d=$('opening');if(d)d.remove();onFail&&onFail(m)};
  if(!(window.crypto&&crypto.subtle&&window.DecompressionStream)){fail('هذا المتصفح قديم. افتح الكتاب في متصفح Chrome أو Safari حديث.');return}
  /* the site's own /trial function first (Cloudflare Pages); Supabase obs_trial only if that is missing */
  fetch('trial',{method:'POST',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({dev:DEV})}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){return {data:j}})
  .catch(function(){return sb().then(function(c){return c.rpcAnon('obs_trial',{p_dev:DEV})})}).then(function(r){var j=r.data,now=Date.now();
    if(r.error||!j){fail(r.error?'النسخة التجريبية غير جاهزة بعد. راسل '+(CFG.contact||'')+' في واتساب.':ERR.net);return}
    if(!j.ok){tput({s:j.start||1,m:now,x:1,seen:1});fail('استُخدمت الفترة التجريبية على هذا الجهاز من قبل.');return}
    tput({s:j.start||now,m:now});LS('orr-tk',j.key);LS('orr-chz','1');setTimeout(function(){location.reload()},500)
  }).catch(function(e){fail(ERR[e&&e.message]||ERR.net)})}
function openSub(){setTitle('الاشتراك في الكتاب');render();if(fresh())$('subBody').insertAdjacentHTML('afterbegin','<button type="button" class="chback" data-choose="1">→ الرجوع إلى الخيارات</button>');sh.hidden=false}
function openChoose(){
  var t=tget(),fresh=!t||!t.s,ic=function(d){return '<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg></i>'};
  setTitle('مرحبًا بك في الكتاب');
  body('<div class="chz"><p class="lead">اختر طريقة فتح الكتاب:</p>'+
    (fresh?'<button type="button" class="opc tr" id="chTrial">'+ic('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>')+'<span><b>النسخة التجريبية لمدة '+tdur()+'</b><small>مجانًا: الكتاب كله، البطاقات، بنك الأسئلة، المحاضرات وكل أدوات المذاكرة. يبدأ الوقت من لحظة الضغط، وبعده يبقى الموضوع الأول من كل فصل مفتوحًا.</small></span></button>'
      :'<div class="opc tr off">'+ic('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>')+'<span><b>النسخة التجريبية'+(INTRIAL?': '+tleftTxt():': انتهت')+'</b><small>'+(INTRIAL?'الكتاب كله مفتوح لك حتى نهاية الفترة.':'استُخدمت الفترة التجريبية على هذا الجهاز، ويبقى الموضوع الأول من كل فصل مفتوحًا.')+'</small></span></div>')+
    '<button type="button" class="opc pd" id="chPaid">'+ic('<path d="M2 8l4 10h12l4-10-6 4-4-7-4 7z"/>')+'<span><b>الاشتراك في النسخة المدفوعة</b><small>'+(CFG.price?esc(CFG.price)+' · ':'')+'الكتاب كاملًا طوال الطبعة على جهازين، مع مزامنة ملاحظاتك.</small></span></button>'+
    '<button type="button" class="opc cd" id="chCode">'+ic('<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2L20 3M16 7l3 3M14 9l2 2"/>')+'<span><b>عندي كود تفعيل</b><small>الصق الكود الذي وصلك في واتساب.</small></span></button>'+
    '<button type="button" class="chfree" id="chFree">متابعة بالنسخة المجانية: الموضوع الأول من كل فصل</button><p class="muted" id="chMsg"></p></div>');
  sh.hidden=false;
  if($('chTrial'))$('chTrial').onclick=function(){var b=this;b.disabled=true;sh.hidden=true;startTrial(function(m){sh.hidden=false;b.disabled=false;$('chMsg').textContent=m})};
  $('chPaid').onclick=function(){choiceSnd('paid');openSub()};$('chCode').onclick=function(){choiceSnd('code');openSub();var w=setInterval(function(){var x=$('actIn');if(x){clearInterval(w);x.scrollIntoView({block:'center'});x.focus()}},150);setTimeout(function(){clearInterval(w)},5000)};
  $('chFree').onclick=function(){choiceSnd('free');LS('orr-chz','1');setMust(false);sh.hidden=true}}
window.__openSub=openSub;
/* the new app (v2.js) has its own subscription pages; it uses these */
window.__lic={dev:DEV,kind:kind,label:label,rpc:function(n,a){return sb().then(function(c){return c.rpcAnon(n,a)})},unlocked:function(){return UNLOCKED},intrial:function(){return INTRIAL},
  fresh:fresh,trialLeft:tleftTxt,trialDur:tdur,startTrial:startTrial,
  codeEntry:function(){openSub();var w=setInterval(function(){var x=$('actIn');if(x){clearInterval(w);x.scrollIntoView({block:'center'});x.focus()}},150);setTimeout(function(){clearInterval(w)},5000)},
  adopt:function(j){return decrypt(j.key).then(function(){saveMeta(j);LS('orr-k',j.key);if(j.code)LS('orr-code',j.code);LS('orr-kc',String(Date.now()));LS('orr-tk',null);choiceSnd('ok');openingFx('تم تفعيل اشتراكك · جارٍ فتح الكتاب كاملًا');setTimeout(function(){location.reload()},1100)})}};
document.addEventListener('click',function(e){if(e.target.closest('[data-sub]')){e.preventDefault();e.stopPropagation();if(window.__v2sub){window.__v2sub();return}(fresh()?openChoose:openSub)()}},true);
function myDevice(){if(window.__v2sub||!UNLOCKED||document.getElementById('myDev'))return;var u=document.getElementById('prog')||document.querySelector('.unl');if(!u)return;
  var b=document.createElement('button');b.type='button';b.id='myDev';b.className='mydev';b.setAttribute('dir','rtl');b.setAttribute('data-sub','1');
  b.innerHTML='<span><b>أنت مشترك · الكتاب مفتوح كاملًا</b><small>الكود <bdi dir="ltr">'+esc(LS('orr-code')||'')+'</bdi> · لنقل الكتاب إلى جهاز آخر</small></span><i>إدارة الجهاز</i>';u.parentNode.insertBefore(b,u.nextSibling)}
function afterLogin(){myDevice();if(UNLOCKED||INTRIAL||!TMS)return;var t=tget();
  if(((!t||!t.s)&&!LS('orr-chz'))||(t&&t.s&&tleft()<=0&&!t.seen)){if(!t||!t.s)setMust(true);if(t&&t.s){t.seen=1;tput(t)}if(window.__v2sub){setMust(false);LS('orr-chz','1');return}   /* new app: a welcome screen, no forced choice (owner, 10 Nov 2026) */
    setTimeout(openChoose,300)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
