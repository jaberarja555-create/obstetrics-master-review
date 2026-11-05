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
function start(){
  var k=LS('orr-k');
  var p=k&&window.crypto&&crypto.subtle&&window.DecompressionStream?decrypt(k).then(function(data){apply(data);UNLOCKED=true}).catch(function(e){if(e&&e.badkey){LS('orr-k',null)}}):Promise.resolve();
  p.then(function(){window.__boot&&window.__boot();if(UNLOCKED)recheck();afterLogin()})}
/* ---------- Supabase: students need no sign-in; the app's public key is enough ---------- */
var SBC=window.OBS_SB(CFG,'orr-auth');
function sb(){return SBC.ready?Promise.resolve(SBC):Promise.reject(new Error('noconfig'))}
/* sync of notes, highlights, drawings and progress between the two devices of one code (obs_sync_get / obs_sync_put).
   The server finds the code from this device id, so only an activated device can read or write its data. */
window.__obsSync={act:function(){return UNLOCKED},on:function(){return UNLOCKED&&!!SBC.ready},
  call:function(b){return sb().then(function(c){return b&&b.data?c.rpcAnon('obs_sync_put',{p_dev:DEV,p_ver:b.ver||0,p_data:b.data}):c.rpcAnon('obs_sync_get',{p_dev:DEV})})
    .then(function(r){if(r.error){var m=String(r.error.message||r.error.code||'');throw {reason:/obs_sync|function/.test(m)?'setup':'net'}}return r.data})}};
/* re-check the code every 3 days when online: switched off or devices reset → lock again */
function recheck(){var last=+(LS('orr-kc')||0);if(Date.now()-last<3*864e5||navigator.onLine===false)return;
  sb().then(function(c){return c.rpcAnon('obs_check',{p_dev:DEV}).then(function(r){var j=r.data;if(r.error||!j)return;
    if(j.ok){LS('orr-kc',String(Date.now()));if(j.key&&j.key!==LS('orr-k')){LS('orr-k',j.key);location.reload()}}
    else if(j.reason==='off'||j.reason==='none'){LS('orr-k',null);LS('orr-kc',null);alert(j.reason==='none'?'الكود بتاعك اتشال من الجهاز دا، فالكتاب الكامل اتقفل هنا. لو دا غلط كلّم '+(CFG.contact||'')+'.':'الكود بتاعك اتوقف، فالكتاب الكامل اتقفل في الجهاز دا. كلّم '+(CFG.contact||'')+'.');location.reload()}})}).catch(function(){})}
/* ---------- the subscription sheet ---------- */
var sh=document.createElement('div');sh.className='sheet';sh.id='subSheet';sh.hidden=true;
sh.innerHTML='<div class="in ar subin" role="dialog" aria-modal="true" dir="rtl"><h3><span>افتح الكتاب كامل</span><button class="chip" type="button" id="subX">Close</button></h3><img class="sublogo" src="img/logo.webp" alt=""><div id="subBody"></div></div>';
document.body.appendChild(sh);
$('subX').onclick=function(){sh.hidden=true};sh.addEventListener('click',function(e){if(e.target===sh)sh.hidden=true});
function freeList(){return '<span class="nms">'+(INFO.free_names||[]).map(function(n){return '<span class="nmc en">'+esc(n)+'</span>'}).join('')+'</span>'}
var ERR={bad:'الكود دا ما صحيح. اتأكّد منه (الحروف والأرقام) وجرّب تاني.',off:'الكود دا اتوقف. كلّم '+esc(CFG.contact||'')+'.',noconfig:'التفعيل لسه ما جاهز. رسّل لـ '+esc(CFG.contact||'')+' في الواتساب.',net:'ما في إنترنت. التفعيل محتاج إنترنت مرّة واحدة بس.'};
function body(html){$('subBody').innerHTML=html}
function render(){
  if(UNLOCKED){body('<p class="lead">الجهاز دا متفعّل والكتاب كلّه مفتوح. شكراً ليك!</p>'+(LS('orr-code')?'<div class="devc"><span>الكود</span><b dir="ltr">'+esc(LS('orr-code'))+'</b></div>':''));return}
  var wa=(CFG.whatsapp||'').replace(/[^0-9]/g,''),who=esc(CFG.contact||'');
  var msg='السلام عليكم '+(CFG.contact||'')+'، داير أشترك في Obstetrics Master Review.';
  body('<p class="lead">الـ '+E('free trial')+' بيفتح ليك أول '+E('topic')+' في كل '+E('chapter')+' كامل:'+freeList()+'مع الـ '+E('flashcards')+' والـ '+E('QBank')+' بتاعتهم. لو اشتركت مرّة واحدة بيتفتح ليك <b>الكتاب كلّه</b>، وكل الـ '+E('flashcards')+'، والـ '+E('QBank')+' كامل، للطبعة دي كلّها.</p>'+
   (CFG.price?'<div class="price">'+esc(CFG.price)+'</div>':'')+
   '<ol class="sst"><li><b>حوّل المبلغ بـ بنكك</b>'+(CFG.bankak?': رقم الحساب <b class="en">'+esc(CFG.bankak)+'</b>'+(CFG.bankak_name?' ('+esc(CFG.bankak_name)+')':''):' (رقم الحساب بنرسله ليك في الواتساب)')+'.</li>'+
   '<li><b>رسّل صورة الإشعار</b> واتساب لـ '+who+(CFG.whatsapp_local?' (<span class="en">'+esc(CFG.whatsapp_local)+'</span>)':'')+'.</li>'+
   '<li>بنرسل ليك <b>'+E('activation code')+'</b>: ألصقه تحت ودوس '+E('Activate')+'. ما محتاج تسجّل دخول. الكود الواحد بيفتح <b>موبايل واحد ولابتوب واحد</b>، وأول جهازين يستعملوه بيمسكوه.</li></ol>'+
   (wa?'<a class="btn wa" href="https://wa.me/'+wa+'?text='+encodeURIComponent(msg)+'" target="_blank" rel="noopener">رسّل واتساب لـ '+who+'</a>':'')+
   '<div id="actArea"><p class="muted">لحظة…</p></div>');
  sb().then(function(c){
    $('actArea').innerHTML='<p class="muted">لمّا يصلك الكود ألصقه هنا:</p><input id="actIn" dir="ltr" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="OBS-XXXX-XXXX"><button type="button" class="btn" id="actGo"><span class="en">Activate</span></button><p class="muted" id="actMsg"></p>';
    $('actGo').onclick=function(){var code=$('actIn').value.toUpperCase().replace(/\s+/g,'');if(!code){$('actMsg').textContent='ألصق الكود الأول.';return}
      if(!(window.crypto&&crypto.subtle&&window.DecompressionStream)){$('actMsg').textContent='المتصفح دا قديم. افتح الكتاب في Chrome أو Safari جديد.';return}
      $('actMsg').textContent='لحظة…';
      c.rpcAnon('obs_activate',{p_code:code,p_dev:DEV,p_kind:kind(),p_label:label()}).then(function(r){var j=r.data;
        if(r.error||!j){$('actMsg').textContent=ERR.net;return}
        if(!j.ok){$('actMsg').textContent=j.reason==='taken'?'الكود دا شغّال في '+(kind()==='phone'?'موبايل':'لابتوب')+' تاني. لو غيّرت جهازك رسّل لـ '+(CFG.contact||'')+' في الواتساب عشان يحوّله ليك.':(ERR[j.reason]||ERR.bad);return}
        return decrypt(j.key).then(function(){LS('orr-k',j.key);LS('orr-code',j.code||code);LS('orr-kc',String(Date.now()));$('actMsg').textContent='تمام، اتفعّل! الكتاب كلّه بيفتح هسّي…';setTimeout(function(){location.reload()},800)})
      }).catch(function(){$('actMsg').textContent=ERR.net})}
  }).catch(function(e){$('actArea').innerHTML='<p class="muted">'+(ERR[e&&e.message]||ERR.net)+'</p>'})}
function openSub(){render();sh.hidden=false}
window.__openSub=openSub;
document.addEventListener('click',function(e){if(e.target.closest('[data-sub]')){e.preventDefault();e.stopPropagation();openSub()}},true);
function afterLogin(){}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
