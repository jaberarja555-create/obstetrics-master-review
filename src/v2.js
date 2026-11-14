/* ===== App redesign (owner, 10 Nov 2026) =====
   Five destinations (Home · Chapters · Practice · Resources · Settings); the reader opens ONE place at a time (a topic,
   the Rapid Review, the drugs, a cover), no longer the whole book in one scroll. Runs inside the boot closure, after the old app.
   New keys: orr-mode (day|night|auto), orr-pal (palette), orr-name, orr-photo, orr-bm (bookmarks), orr-lastact, orr-nread, orr-nseen. */
(function(){
var INFO=window.OBS_INFO||{},TOT=INFO.tot||{},CFG=window.OBS_CFG||{};
function X(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
var P={home:'<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>',
 book:'<path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.500-.5 6.500 0 8.500 1.500 2-1.500 5-2 8.500-1.500V5C17 4.500 14 5 12 6.500z"/><path d="M12 6.500v13"/>',
 clip:'<rect x="5" y="4.500" width="14" height="16" rx="2"/><path d="M9 4.500V3.500h6v1M9 10h6M9 14h4"/>',
 layers:'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 12.500l9 5 9-5M3 16.500l9 5 9-5"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 13.500a7.500 7.500 0 0 0 0-3l2-1.500-2-3.500-2.400 1a7.500 7.500 0 0 0-2.600-1.500L14 2.500h-4l-.4 2.500A7.500 7.500 0 0 0 7 6.500l-2.400-1-2 3.500 2 1.500a7.500 7.500 0 0 0 0 3l-2 1.500 2 3.500 2.400-1a7.500 7.500 0 0 0 2.600 1.500l.4 2.500h4l.4-2.500a7.500 7.500 0 0 0 2.600-1.500l2.400 1 2-3.500z"/>',
 arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',back:'<path d="M19 12H5M11 6l-6 6 6 6"/>',chev:'<path d="M9 6l6 6-6 6"/>',up:'<path d="M12 19V5M6 11l6-6 6 6"/>',
 q:'<circle cx="12" cy="12" r="9"/><path d="M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.7.400-1 .9-1 1.700M12 17h.01"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',play:'<circle cx="12" cy="12" r="9"/><path d="M10 8.500l5 3.500-5 3.500z"/>',
 slides:'<rect x="3" y="4" width="18" height="12" rx="1.500"/><path d="M12 16v4M8 20h8M9 9h6M9 12h3"/>',
 bars:'<path d="M5 20v-6M10 20V9M15 20v-9M20 20V5"/>',flame:'<path d="M12 3c1 3.500 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .5 1.500 1.500 2 2 2-1-3 0-6 1-8z"/>',
 lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',bm:'<path d="M7 4h10v16l-5-4-5 4z"/>',
 bolt:'<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',pill:'<rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-45 12 12)"/><path d="M9 9l6 6"/>',
 steth:'<path d="M6 3v6a4 4 0 0 0 8 0V3M10 13v3a4 4 0 0 0 8 0v-2"/><circle cx="18" cy="12" r="2"/>',pen:'<path d="M12 20h9M16.500 3.500a2.100 2.100 0 0 1 3 3L7 19l-4 1 1-4z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.900 4.900l1.400 1.400M17.700 17.700l1.400 1.400M2 12h2M20 12h2M4.900 19.100l1.400-1.400M17.700 6.300l1.400-1.400"/>',
 moon:'<path d="M21 12.800A9 9 0 1 1 11.200 3a7 7 0 0 0 9.800 9.800z"/>',auto:'<circle cx="12" cy="12" r="9"/><path d="M9 16l3-8 3 8M10 13.500h4"/>',
 crown:'<path d="M4 18h16l1-10-5 4-4-7-4 7-5-4z"/>',sync:'<path d="M20 11a8 8 0 0 0-14-4L4 9M4 5v4h4M4 13a8 8 0 0 0 14 4l2-2M20 19v-4h-4"/>',
 dl:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',bell:'<path d="M6 9a6 6 0 0 1 12 0c0 6 2.500 7 2.500 7h-17S6 15 6 9z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.7.400-1 .9-1 1.700M12 17h.01"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.500h.01"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',cam:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.500"/>',trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
 cal:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4M9 15l2 2 4-4"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
 check:'<path d="M5 12.500l4.500 4.500L19 7.500"/>',mon:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',palette:'<path d="M12 3a9 9 0 1 0 0 18c1.500 0 2-1 2-2s-.5-1.500-.5-2.500 1-1.500 2-1.500H18a3 3 0 0 0 3-3c0-5-4-9-9-9z"/><circle cx="8" cy="10" r="1"/><circle cx="12" cy="7.500" r="1"/><circle cx="16" cy="10" r="1"/>'};
function I(n,c){return '<svg class="v2ic'+(n==='back'?' fwd':'')+(c?' '+c:'')+'" viewBox="0 0 24 24">'+P[n].replace(/\.(\d)00\b/g,'.$1')+'</svg>'}
document.body.classList.add('v2');

/* ---------- display mode and colour (independent) ---------- */
var MODE=sp('mode')||'day',PAL=sp('pal')||'lav',MQ=window.matchMedia?matchMedia('(prefers-color-scheme: dark)'):{matches:false};
var PALS=[['lav','الافتراضي','#9272C6'],['navy','كحلي','#3E64A8'],['green','أخضر فاتح','#A8DDB5'],['orange','برتقالي فاتح','#F3C08A'],['red','أحمر فاتح','#F2ABAF'],['mono','أبيض وأسود','linear-gradient(135deg,#fff 50%,#161616 50%)']];
function isDark(){return MODE==='night'||(MODE==='auto'&&MQ.matches)}
function applyLook(){var d=isDark();root.setAttribute('data-pal',PAL);root.setAttribute('data-theme',d?'dark':'light');st('orr-theme',d?'dark':'light');
  SMODE=d?'night':'day';try{setNight()}catch(e){}
  $('v2th').innerHTML=I(d?'moon':'sun');var m=document.querySelector('meta[name=theme-color]');if(m)m.content=getComputedStyle(root).getPropertyValue('--bg').trim()||'#F5F1FC'}
if(MQ.addEventListener)MQ.addEventListener('change',function(){if(MODE==='auto')applyLook()});
$('v2th').onclick=function(){MODE=isDark()?'day':'night';sp('mode',MODE);applyLook();if(CURV==='v2settings')R.v2settings()};

/* ---------- profile in the shared header ---------- */
function myName(){return (sp('name')||sp('sname')||'').trim()}   // the name the owner approved, unless the student changed it
/* the greeting reads right whether the name is Arabic or English: the sentence is right-to-left and the name is isolated (owner, 10 Nov 2026) */
function greet(){var n=(myName()||'').replace(/^\s*(د\s*\.|د\s*\/|دكتور|دكتورة|dr\.?|doctor)\s*/i,'');return n?'مرحب بك يا د. <bdi>'+X(n)+'</bdi>':'مرحب بك يا دكتور'}
function avatar(el){var ph=sp('photo'),n=myName();el.style.backgroundImage=ph?'url('+ph+')':'';el.innerHTML=ph?'':(n?X(n.replace(/^(dr\.?|د\.?)\s*/i,'').slice(0,1).toUpperCase()):I('user'))}
function header(){avatar($('v2av'));$('v2nm').textContent=myName()||'Doctor';var n=notifs().filter(function(x){return !NR[x.id]}).length;$('v2bd').hidden=!n;$('v2bd').textContent=n}

/* ---------- access state (from the licence layer) ---------- */
function access(){var c=root.classList;if(c.contains('intrial'))return 'trial';if(c.contains('unlocked'))return 'paid';if(st('orr-ended'))return 'ended';var t=spj('trial');return t&&t.s?'expired':'free'}
function isFree(){var a=access();return a==='free'||a==='expired'||a==='ended'}
function openSub(){go('v2sub')}
window.__v2sub=openSub;
function locked(id){return !!(window.__LK&&window.__LK[id])}

/* ---------- reader: one place at a time ---------- */
var SCOPE=null,RET='v2home',WHOLE=false;   // WHOLE: the whole book open as one continuous book (Home → «افتح الكتاب كاملًا», owner 11 Nov 2026)
function grp(i){while(i>0&&PAGES[i].user)i--;var p=PAGES[i],f=p.f||'';if(p.t)return 't:'+p.t;if(/^x9/.test(f))return 'rr';if(/^y\d/.test(f))return 'dr';var m=f.match(/^k(\d+)_cover/);if(m)return 'k'+m[1];return f==='a00_cover'?'cover':'fm'}
function applyScope(){wraps.forEach(function(w,i){w.style.display=WHOLE||grp(i)===SCOPE?'':'none'})}
var _cp=currentPage;currentPage=function(){var sc=$('scroller');if(!sc.clientHeight&&typeof lastCur==='number'&&lastCur>=0)return lastCur;var mid=sc.scrollTop+sc.clientHeight*0.35,cur=-1,first=-1;for(var i=0;i<wraps.length;i++){if(wraps[i].style.display==='none')continue;if(first<0)first=i;if(wraps[i].offsetTop<=mid)cur=i}return cur<0?Math.max(first,0):cur};
/* the book is always one continuous book in the reader (owner, 11 Nov 2026 evening): opening a topic, the Rapid Review or the drugs jumps
   to its page and the student can keep scrolling into what follows; the title and reading bar follow the topic in view */
var _gi=goIdx;goIdx=function(i){i=Math.max(0,Math.min(PAGES.length-1,i));if(!WHOLE||SCOPE!=='all'){WHOLE=true;SCOPE='all';applyScope()}_gi(i)};
/* the page pill counts inside the open place (1 / 8), not the whole book; each place is separate (owner, 10 Nov 2026) */
/* ---------- reader, new design (owner, 10 Nov 2026): slim app bar with the place's title, read mark and bookmark; the tools live in a
   floating dock at the bottom; panels open above it; a thin line shows how far through the place the student is ---------- */
var RB=document.querySelector('#app>.bar'),RT=document.createElement('div');RT.className='rt';RT.innerHTML='<small id="v2rs"></small><b id="v2rb"></b>';RB.insertBefore(RT,$('title'));
var RBM=document.createElement('button');RBM.type='button';RBM.className='ib rbm';RBM.setAttribute('aria-label','حفظ الموضوع');RBM.innerHTML=I('bm');RB.insertBefore(RBM,$('themeBtn'));
$('v2rnav').appendChild($('prBtn'));
var RH=document.createElement('button');RH.type='button';RH.className='ib rhome';RH.setAttribute('aria-label','Home');RH.title='الرئيسية';RH.innerHTML=I('home');RH.onclick=function(){go('v2home')};RB.insertBefore(RH,RT);
var RP=document.createElement('i');RP.className='rprog';RP.innerHTML='<i></i>';RB.appendChild(RP);
$('reader').appendChild($('rbShow'));$('rbShow').innerHTML=I('pen');$('rbShow').title='إظهار الأدوات';
/* the tools open in rings around the pen button (owner, 11 Nov 2026) */
(function(){var rb=$('rbar'),sh=$('rbShow'),ur=rb.querySelector('.urw');
  var P=[['hlPen',78,96],['inkBtn',78,135],['txtBtn',78,174],['ulBtn',140,93],['rNotes',140,120],['upBtn',140,148],['zoomBtn',140,176]];
  function at(e,r,deg,i){if(!e)return;var a=deg*Math.PI/180;e.style.setProperty('--x',Math.round(r*Math.cos(a))+'px');e.style.setProperty('--y',Math.round(-r*Math.sin(a))+'px');e.style.setProperty('--d',(i*0.035)+'s')}
  P.forEach(function(p,i){at($(p[0]),p[1],p[2],i)});at(ur,196,135,7);
  function fan(on){rb.classList.toggle('fan',on);sh.classList.toggle('open',on)}
  try{setRail(true)}catch(e){}
  sh.onclick=function(e){e.stopPropagation();fan(!rb.classList.contains('fan'))};
  rb.addEventListener('click',function(e){var b=e.target.closest('button');if(b&&!b.closest('.urw'))setTimeout(function(){fan(false)},0)},true);
  document.addEventListener('pointerdown',function(e){if(rb.classList.contains('fan')&&!e.target.closest('#rbar,#rbShow'))fan(false)},true)})();
function scNow(){return WHOLE?grp(typeof lastCur==='number'&&lastCur>=0?lastCur:currentPage()):SCOPE}
/* full page (owner, 11 Nov 2026): with the pen on, a tap draws, so the bars and the side menu could not be hidden. A small button at the
   bottom left of the reader hides and shows them at any time; scrolling down with the pen on hides them too. */
var FB=document.createElement('button');FB.type='button';FB.id='v2full';FB.setAttribute('aria-label','صفحة كاملة');FB.title='صفحة كاملة';
FB.innerHTML='<svg class="v2ic" viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';FB.onclick=function(){setImm(!$('app').classList.contains('imm'),true)};
/* only this button enters or leaves full page (owner, 11 Nov 2026): a tap on the page or scrolling no longer changes it */
var _setImm=setImm;setImm=function(on,btn){if(btn)_setImm(on)};$('reader').appendChild(FB);
function rtopic(){var s=scNow();return s&&s.slice(0,2)==='t:'?TOPICS.filter(function(t){return 't:'+t.id===s})[0]:null}
RBM.onclick=function(){var t=rtopic();if(!t)return;var k='t:'+t.id;if(BM[k])delete BM[k];else BM[k]=Date.now();spj('bm',BM);syncSoon();pill()};
function pill(){var c=lastCur<0?currentPage():lastCur,k=0,n=0;for(var i=0;i<wraps.length;i++){if(wraps[i].style.display==='none')continue;n++;if(i<=c)k++}
  var pn=$('pnum');if(!pn.classList.contains('ed'))pn.textContent=(PAGES[c]&&PAGES[c].user?'✎ ':'')+k+' / '+n;
  RP.firstChild.style.width=(n?k/n*100:0)+'%';var t=rtopic(),lab=PAGES[c]?String(PAGES[c].label||''):'';
  $('v2rb').textContent=t?t.no+' '+t.title.charAt(0).toUpperCase()+t.title.slice(1):({rr:'Rapid Review',dr:'Obstetric Drugs',cover:'Book cover',fm:lab}[scNow()]||lab);
  $('v2rs').textContent=t?'Chapter '+t.ch+' · '+chap(t.ch).name:'Obstetrics Master Review';
  $('v2rnav').hidden=!t&&!WHOLE;$('rnSl').disabled=$('rnVd').disabled=!t;RBM.hidden=!t;if(t){RBM.classList.toggle('on',!!BM['t:'+t.id]);RBM.setAttribute('aria-pressed',!!BM['t:'+t.id])}}
/* Speed (12 Nov 2026): while the same page stays in view a scroll rewrites nothing (the shell calls onScroll('s') once per frame) */
var _os=onScroll;onScroll=function(how){var c0=lastCur;_os.apply(this,arguments);if(how!=='s'||lastCur!==c0)pill()};
/* panels open above a bottom button and below a top one */
flyAt=function(f,btn){var r=btn.getBoundingClientRect(),R=$('reader').getBoundingClientRect();f.hidden=false;
  if(r.top>R.top+R.height/2){f.style.top='auto';f.style.bottom=(R.bottom-r.top+10)+'px'}else{f.style.bottom='auto';f.style.top=Math.max(8,r.bottom-R.top+8)+'px'}
  f.style.right='auto';f.style.left=Math.max(8,Math.min(r.left-R.left+r.width/2-f.offsetWidth/2,R.width-f.offsetWidth-8))+'px'};
/* the side navigation (Home and the other destinations) can be hidden and shown on tablets and PCs (owner, 10 Nov 2026) */
function sbSet(off){$('app').classList.toggle('nosb',off);sp('sb',off?'off':'on');if(CURV==='reader'){try{layout()}catch(e){}}}
var SBT=document.createElement('button');SBT.type='button';SBT.className='ib sbt';SBT.setAttribute('aria-label','إظهار أو إخفاء القائمة الجانبية');SBT.innerHTML='<svg class="v2ic" viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M9 4.5v15"/></svg>';
SBT.onclick=function(){sbSet(!$('app').classList.contains('nosb'))};RB.insertBefore(SBT,RB.firstChild);
var SBT2=SBT.cloneNode(true);SBT2.className='v2hb sbt';SBT2.onclick=SBT.onclick;$('v2hd').insertBefore(SBT2,$('v2hd').firstChild);
if(sp('sb')==='off')$('app').classList.add('nosb');
/* reading bar at the bottom of the reader: this topic's slides and video, the other topics of the chapter, the progress of the page */
var FROMRD=false,FOCUS='';
function mediaAll(v,t){FOCUS=t.id;if(v==='v2slides')SCH=t.ch;else LCH=t.ch;go(v);FROMRD=true;R[v]();var e=$((v==='v2slides'?'sl-':'vd-')+t.id);if(e){e.classList.add('foc');e.scrollIntoView({block:'center'})}}
/* reader → Videos / Lectures (owner, 12 Nov 2026): open THIS topic's video or lecture on the screen, not the list of all of them. A file listed
   in INFO.video[topic] / INFO.slides[topic] plays here; until it is uploaded the topic's own card says it is coming. */
function media(v){var t=rtopic();if(!t)return;var vid=v==='v2lect',TI=INFO.timg||{},pic=TI[t.id]||chImg(t.ch),src=((vid?INFO.video:INFO.slides)||{})[t.id],tt=t.no+' '+X(t.title.charAt(0).toUpperCase()+t.title.slice(1));
  var body=src?(vid?'<video class="mvp" controls playsinline preload="metadata" poster="'+pic+'" src="'+X(src)+'"></video>':'<iframe class="mvp" src="'+X(src)+'" title="'+X(t.title)+'"></iframe>')
    :(vid?'<div class="mvp mth" style="background-image:url('+pic+')"><span class="pl">'+I('play')+'</span><span class="sn" lang="ar">قريبًا</span></div>'
      :'<div class="sld mvp"><span class="sn" lang="ar">قريبًا</span><div class="sx"><i><img src="img/v2_logo.webp" alt="">Obstetrics Master Review</i><b>'+X(t.title.charAt(0).toUpperCase()+t.title.slice(1))+'</b><ul>'+String(t.sub||'').split(' · ').slice(0,3).map(function(x){return '<li>'+X(x)+'</li>'}).join('')+'</ul></div><span class="sp" style="background-image:url('+pic+')"></span></div>')+
      '<p class="mvn" lang="ar">'+(vid?'سيُضاف فيديو هذا الموضوع قريبًا، ويظهر هنا فور رفعه.':'ستُضاف محاضرة هذا الموضوع قريبًا، وتظهر هنا فور رفعها.')+'</p>';
  var d=$('v2msheet');if(!d){d=document.createElement('div');d.className='sheet v2msheet';d.id='v2msheet';d.hidden=true;document.body.appendChild(d);
    d.addEventListener('click',function(e){if(e.target===d||e.target.closest('[data-mx]')){var vv=d.querySelector('video');if(vv)vv.pause();d.hidden=true;return}
      var b=e.target.closest('[data-mall]');if(b){d.hidden=true;mediaAll(b.dataset.mall,rtopic()||t)}})}
  d.innerHTML='<div class="in" role="dialog" aria-modal="true"><h3><span lang="ar" class="ar">'+(vid?'الفيديو':'المحاضرة')+'</span> <button class="chip" type="button" data-mx>إغلاق</button></h3>'+
    '<p class="mvt"><b>'+tt+'</b><small>'+(sp('lang')==='en'?'Chapter ':'الفصل ')+t.ch+' · '+X(chap(t.ch).name)+'</small></p>'+body+
    '<button type="button" class="v2btn ol" data-mall="'+v+'" lang="ar" style="width:100%;margin-top:12px">'+I(vid?'play':'slides')+(vid?'كل الفيديوهات':'كل المحاضرات')+'</button></div>';
  d.hidden=false}
$('rnSl').onclick=function(){media('v2slides')};$('rnVd').onclick=function(){media('v2lect')};
/* «المحتويات» opens the book contents as before (owner, 12 Nov 2026: "show the chapters like the book contents"): every chapter with its
   cover and topics and page numbers, the Rapid Review and the drugs, the current place marked */
/* the contents panel has a second tab with the student's bookmarks (owner, 12 Nov 2026: "the contents also has the bookmarks") */
var TDTAB='c';
function contents(tab){tocDrawer();var d=$('tocDr'),inn=d&&d.querySelector('.tdin0');if(!inn)return;TDTAB=tab||'c';
  var ks=Object.keys(BM).filter(function(k){return k.slice(0,2)==='t:'}).sort(function(a,b){return BM[b]-BM[a]}),rows=ks.map(function(k){var t=TOPICS.filter(function(x){return 't:'+x.id===k})[0];if(!t)return '';
    var col=(typeof CHC!=='undefined'&&CHC[t.ch])||'#2c5b8f';return '<button type="button" class="tdi" style="--tc:'+col+'" data-tp="'+t.p+'"><span class="tdin">'+X(t.no)+'</span><span class="tdl">'+X(t.title)+'</span><span class="tdp">'+t.p+'</span></button>'}).join('');
  var tabs=document.createElement('div');tabs.className='tdtabs';tabs.innerHTML='<button type="button" data-tdtab="c" lang="ar">المحتويات</button><button type="button" data-tdtab="b" lang="ar">المحفوظة <bdi>'+ks.length+'</bdi></button>';
  var bm=document.createElement('div');bm.className='tdbody tdbm';bm.innerHTML=rows||'<p class="tdemp" lang="ar">لم تحفظ أي موضوع بعد. اضغط علامة الحفظ في شريط القراءة لتحفظ الموضوع الذي تقرؤه، فيظهر هنا.</p>';
  inn.insertBefore(tabs,inn.querySelector('.tdbody'));inn.appendChild(bm);
  function show(t){TDTAB=t;[].forEach.call(tabs.children,function(b){b.classList.toggle('on',b.dataset.tdtab===t)});inn.querySelector('.tdbody:not(.tdbm)').hidden=t!=='c';bm.hidden=t!=='b'}
  tabs.onclick=function(e){var b=e.target.closest('[data-tdtab]');if(b)show(b.dataset.tdtab)};show(TDTAB)}
$('rnTp').onclick=function(){if(typeof tocDrawer==='function'){contents('c');return}var t=rtopic();
  if(!t){if(!WHOLE)return;$('v2tbody').innerHTML='<div class="tpl">'+META.chapters.map(function(c){return '<button type="button" class="v2c tpr" data-act="wch" data-n="'+c.n+'"><span class="li">'+I('book')+'</span><span class="tmn"><b>Chapter '+c.n+' · '+X(c.name)+'</b></span><span></span></button>'}).join('')+'</div>';$('v2tsheet').hidden=false;return}
  var c=chap(t.ch),ts=chStat(c).ts;
  $('v2tbody').innerHTML='<p class="v2crumb" style="margin:0 0 8px;direction:ltr;text-align:left">Chapter '+c.n+' · '+X(c.name)+'</p><div class="tpl">'+ts.map(function(x){var lk=locked(x.id),p=pct(x.id);
    return '<button type="button" class="v2c tpr'+(lk?' lk':'')+(x.id===t.id?' cur':'')+'" data-act="tpick" data-id="'+x.id+'"><span class="li">'+I(lk?'lock':'book')+'</span><span class="tmn"><b>'+x.no+' '+X(x.title.charAt(0).toUpperCase()+x.title.slice(1))+'</b><span class="pr">'+bar(p)+p+'%</span></span><span></span></button>'}).join('')+'</div>'+
    '<button type="button" class="v2btn ol" data-act="tall" lang="ar" style="width:100%;margin-top:12px">'+I('book')+'كل الفصول</button>';$('v2tsheet').hidden=false};
$('v2tsx').onclick=function(){$('v2tsheet').hidden=true};$('v2tsheet').addEventListener('click',function(e){if(e.target===this)this.hidden=true});
var _ur=upgRebuild;upgRebuild=function(){_ur.apply(this,arguments);if(SCOPE)applyScope()};
var tb=document.createElement('button');tb.type='button';tb.className='ib';tb.setAttribute('aria-label','Contents');tb.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>';
tb.onclick=function(){$('tocBtn').click()};tb.hidden=true;   // owner, 10 Nov 2026: no whole-book contents inside a place; Chapters is the way between places
$('rbShow').parentNode.insertBefore(tb,$('rbShow'));
$('backBtn').onclick=function(){go(RET||'v2home')};

/* ---------- views ---------- */
var V2=['v2home','v2chapters','v2chapter','v2practice','v2resources','v2settings','v2profile','v2notif','v2saved','v2slides','v2lect','v2sub','v2pay','v2dl','v2help','v2about','v2poster','v2contact','v2msg'],R={};
var NAV=[['v2home','Home','home'],['v2chapters','Chapters','book'],['v2practice','Practice','clip'],['v2resources','Resources','layers'],['v2settings','Settings','gear']];
function tabOf(v){if(v==='reader')return SCOPE==='rr'||SCOPE==='dr'?'v2resources':'v2chapters';
  return {v2chapter:'v2chapters',cards:'v2practice','qbank-v':'v2practice',lect:'v2resources',v2lect:'v2resources',v2slides:'v2resources',v2saved:'v2resources',v2profile:'v2settings',v2sub:'v2settings',v2pay:'v2settings',v2dl:'v2settings',v2help:'v2settings',v2about:'v2settings',v2contact:'v2settings',v2poster:'v2settings',search:'v2home',v2notif:'v2home'}[v]||v}
var _show=show;
function go(v){if(v==='home')v='v2home';var was=CURV;if(v!=='reader'){try{_setImm(false)}catch(e){}}if(v!=='v2slides'&&v!=='v2lect')FROMRD=false;if(v!=='reader'&&v!=='v2slides'&&v!=='v2lect')WHOLE=false;$('v2tsheet').hidden=true;
  if(V2.indexOf(v)>=0){if(typeof setImm==='function')setImm(false);views.forEach(function(x){$(x).hidden=true});V2.forEach(function(x){$(x).hidden=x!==v});CURV=v;try{hideBar();penFly(false)}catch(e){}R[v]();$(v).scrollTop=v===was?$(v).scrollTop:0}
  else{V2.forEach(function(x){$(x).hidden=true});if(v==='reader'&&was!=='reader'&&!(FROMRD&&(was==='v2slides'||was==='v2lect')))RET=V2.indexOf(was)>=0||was==='search'?was:RET;_show(v);
    var a={reader:'read',cards:'cards','qbank-v':'qb'}[v];if(a)spj('lastact',{k:a,t:Date.now()});
    if(v==='search'&&document.activeElement===$('v2q'))setTimeout(function(){$('v2q').focus()},80)}
  $('app').classList.toggle('rd',v==='reader');var t=tabOf(v);
  [].forEach.call(document.querySelectorAll('#v2nav button,#v2sn button'),function(b){b.classList.toggle('on',b.dataset.v===t)});header()}
show=go;
var nb=NAV.map(function(n){return '<button type="button" data-v="'+n[0]+'">'+I(n[2])+'<span>'+n[1]+'</span></button>'}).join('');$('v2nav').innerHTML=nb;$('v2sn').innerHTML=nb;
document.addEventListener('click',function(e){var b=e.target.closest('[data-v]');if(b&&!e.target.closest('.bk')&&(b.dataset.v==='home'||(document.getElementById(b.dataset.v)||{}).className&&/\bview\b/.test(document.getElementById(b.dataset.v).className))){go(b.dataset.v);return}
  b=e.target.closest('[data-act]');if(b&&ACT[b.dataset.act])ACT[b.dataset.act](b,e)});
$('v2sb').onclick=function(){go('search')};$('v2me').onclick=function(){go('v2profile')};$('v2bell').onclick=function(){go('v2notif')};
$('v2q').addEventListener('input',function(){if(CURV!=='search')go('search');$('q').value=this.value;runSearch()});

/* ---------- shared data helpers ---------- */
function topicAt(i){var g=grp(i);if(g.slice(0,2)!=='t:')return null;var id=g.slice(2);for(var k=0;k<TOPICS.length;k++)if(TOPICS[k].id===id)return TOPICS[k];return null}
function chap(n){for(var i=0;i<META.chapters.length;i++)if(META.chapters[i].n===n)return META.chapters[i];return {n:n,name:''}}
function chImg(n){return 'img/chcov'+n+'.jpg'}   // chapter previews use the still-life chapter pictures (owner, 10 Nov 2026: the old banner strips looked bad)
function npg(id){return (tpages[id]||[]).length}
function ring(p,sz){var r=15.5,c=2*Math.PI*r;return '<svg class="rg" viewBox="0 0 36 36" width="'+sz+'" height="'+sz+'"><circle cx="18" cy="18" r="'+r+'" fill="none" stroke="var(--sel)" stroke-width="4"/>'+(p>0?'<circle cx="18" cy="18" r="'+r+'" fill="none" stroke="var(--pri)" stroke-width="4" stroke-linecap="round" stroke-dasharray="'+(c*p/100).toFixed(1)+' '+c.toFixed(1)+'" transform="rotate(-90 18 18)"/>':'')+'</svg>'}
function overall(){var tp=0,tr=0;TOPICS.forEach(function(t){tp+=npg(t.id);tr+=tRead(t.id)});return pc(tr,tp)}
function dueToday(){try{var D=daily();return Math.max(0,D.keys.length-D.done.length)}catch(e){return 0}}
function qTotal(){return TOT.qs||QS.length}function cTotal(){var n=0;deckIds.forEach(function(id){n+=DECKS[id].cards.length});return TOT.cards||n}
var BM=spj('bm')||{};window.__bmSet=function(v){BM=v||{};try{if(CURV==='v2saved')R.v2saved();pill()}catch(e){}};function bmk(k){return '<button type="button" class="bmk'+(BM[k]?' on':'')+'" data-act="bm" data-k="'+k+'" aria-label="حفظ" aria-pressed="'+!!BM[k]+'">'+I('bm')+'</button>'}
function openTopic(t){if(locked(t.id)){openSub();return}goPage(t.p-1)}
function bar(v){return '<span class="v2bar"><i style="width:'+v+'%"></i></span>'}
function title(t,back,crumb){ return '<div class="v2pt" lang="ar">'+(back?'<button type="button" class="v2bk" data-v="'+back+'" aria-label="رجوع">'+I('arrow')+'</button>':'')+'<h2>'+t+'</h2>'+(crumb?'<span class="v2crumb">'+crumb+'</span>':'')+'</div>'}

/* ---------- Home ---------- */
R.v2home=function(){var a=access(),lp=lastPage(),has=sp('pk')&&lp>0,t=has?topicAt(lp):TOPICS[0],nm=myName();
  var acc={free:['النسخة المجانية','استمتع بالوصول المحدود للمحتوى: الموضوع الأول من كل فصل','ترقية','up'],
    trial:['الفترة التجريبية','الكتاب كله مفتوح الآن حتى تنتهي الفترة','اشترك','up'],
    paid:['النسخة الكاملة','هذا الجهاز مفعّل والكتاب مفتوح كاملًا','الاشتراك','crown'],
    expired:['انتهت الفترة التجريبية','الموضوع الأول من كل فصل ما زال مفتوحًا','اشترك','up'],
    ended:['انتهى اشتراكك','ملاحظاتك وتقدّمك محفوظة · جدّد لفتح الكتاب كاملًا','تجديد','up']}[a];
  if(a!=='paid'&&REQ&&REQ.status==='pending')acc=['طلبك قيد المراجعة','سيُفتح الكتاب كاملًا تلقائيًا بعد الموافقة','الحالة','clock'];
  /* reading card (owner, 11 Nov 2026 evening): the chapter picture is shown whole; the chapter name and the continue row are two bars over it */
  /* reading card (owner, 12 Nov 2026): the chapter picture alone, nothing over it; under it two buttons: the chapter (small, clear text)
     and «تابع القراءة»; a thin line under the picture shows how much of the topic is read */
  var ct=t?'<button type="button" class="hcn" data-act="ch" data-n="'+t.ch+'"><small dir="auto">'+(sp('lang')==='en'?'Chapter ':'الفصل ')+t.ch+' · '+pct(t.id)+'%</small><b>'+X(chap(t.ch).name)+'</b></button>'
    :'<button type="button" class="hcn" data-act="cont"><small>'+(sp('lang')==='en'?'Page ':'صفحة ')+PAGES[lp].bn+'</small><b>'+X(PAGES[lp].label)+'</b></button>';
  var la=spj('lastact'),lal=la?{read:t?t.title:PAGES[lp].label,cards:'البطاقات',qb:'بنك الأسئلة',lect:'الفيديو'}[la.k]:'';
  var sk=0;try{sk=streak()}catch(e){}
  $('v2homeW').innerHTML='<div class="hgr"><div class="l"><b>Obstetrics Master Review</b><span>4th Edition · 2026</span></div><h2 lang="ar" dir="rtl">'+greet()+'</h2><p>Obstetrics Master Review</p></div>'+
   '<div class="v2c hacc" lang="ar">'+I('book')+'<div><b>'+acc[0]+'</b><small>'+acc[1]+'</small></div><button type="button" class="v2btn sm" data-act="sub">'+I(acc[3])+acc[2]+'</button></div>'+
   '<div class="hgrid"><div>'+
    '<div class="v2c hcont hc3"><div class="ph"'+(t?' style="background-image:url('+chImg(t.ch)+')"':'')+'><i class="hpl"><i style="width:'+(t?pct(t.id):0)+'%"></i></i></div><div class="hcb">'+ct+'<button type="button" class="v2btn hgo" data-act="cont" lang="ar">'+(has?'تابع القراءة':'ابدأ القراءة')+I('arrow','fwd2')+'</button></div></div>'+
    '<div class="v2c hbook"><img src="img/v2_cover_'+PAL+'.jpg" alt="Book cover"><div><h3>Obstetrics Master Review</h3><span class="ed">4th Edition</span>'+
      '<div class="ct"><div><b>'+META.chapters.length+'</b><span>chapters</span></div><div><b>'+TOPICS.length+'</b><span>topics</span></div><div><b>'+cTotal()+'</b><span>flashcards</span></div><div><b>'+qTotal()+'</b><span>questions</span></div></div>'+
      '<button type="button" class="v2btn ol" data-act="cover" lang="ar">'+I('book')+'افتح الكتاب كاملًا</button></div></div>'+
   '</div><div>'+
    '<div class="hsm2" lang="ar"><button type="button" class="v2c" data-act="prog"><span class="ic fl">'+I('flame')+'</span><span class="tx"><b><bdi>'+sk+'</bdi> '+(sk===1?'يوم':'أيام')+'</b><small>'+(sk?'سلسلة المراجعة اليومية':'ابدأ سلسلتك اليوم')+'</small></span></button>'+
     '<button type="button" class="v2c" data-act="prog"><span class="ic">'+ring(overall(),34)+'</span><span class="tx"><b><bdi>'+overall()+'%</bdi></b><small>التقدم الكلي</small></span></button></div>'+
    '<div class="hst" lang="ar"><button type="button" class="v2c" data-act="cards"><span class="t">'+I('layers')+'بطاقات اليوم</span><span class="n">'+(dueToday()?dueToday()+' بطاقات':'اكتملت ✓')+'</span><span class="a">ابدأ المراجعة'+I('back')+'</span></button>'+
      '<button type="button" class="v2c" data-v="qbank-v"><span class="t">'+I('q')+'بنك الأسئلة</span><span class="n">'+qTotal()+' سؤال</span><span class="a">ابدأ التدريب'+I('back')+'</span></button></div>'+
    '<div class="hq" lang="ar"><button type="button" class="v2c" data-act="last">'+I('clock')+'<span>آخر نشاط'+(lal?'<small dir="ltr">'+X(lal)+'</small>':'')+'</span>'+I('chev','cv')+'</button>'+
      '<button type="button" class="v2c" data-v="v2lect">'+I('play')+'<span>الفيديو</span>'+I('chev','cv')+'</button>'+
      '<button type="button" class="v2c" data-v="v2slides">'+I('slides')+'<span>المحاضرات</span>'+I('chev','cv')+'</button></div>'+
   '</div></div>'};

/* ---------- Chapters ---------- */
var CHF='all',CHQ='',CH=1,CHRET='v2chapters';
function chStat(c){var ts=TOPICS.filter(function(t){return t.ch===c.n}),np=0,nr=0;ts.forEach(function(t){np+=npg(t.id);nr+=tRead(t.id)});return {ts:ts,np:np,pr:pc(nr,np),nr:nr}}
R.v2chapters=function(){var q=CHQ.trim().toLowerCase();
  var rows=META.chapters.map(function(c){var s=chStat(c);
    if(CHF==='prog'&&!(s.nr>0&&s.pr<100))return '';if(CHF==='bm'&&!s.ts.some(function(t){return BM['t:'+t.id]}))return '';
    if(q&&c.name.toLowerCase().indexOf(q)<0&&!s.ts.some(function(t){return t.title.toLowerCase().indexOf(q)>=0}))return '';
    return '<button type="button" class="v2c chr" data-act="ch" data-n="'+c.n+'"><span class="im" style="background-image:url('+chImg(c.n)+')"></span><span><b>Chapter '+c.n+' · '+X(c.name)+'</b><small>'+I('book')+s.ts.length+' topics'+bar(s.pr)+s.pr+'%</small></span>'+I('chev')+'</button>'}).join('');
  var keep=document.activeElement&&document.activeElement.id==='chQ';
  $('v2chaptersW').innerHTML=title('الفصول')+'<label class="chs2" lang="ar">'+I('book')+'<input id="chQ" type="search" placeholder="ابحث في الفصول أو الموضوعات…" value="'+X(CHQ)+'" dir="auto"></label>'+
    '<div class="chf" lang="ar">'+[['all','الكل'],['prog','قيد القراءة'],['bm','المحفوظة']].map(function(f){return '<button type="button" data-act="chf" data-f="'+f[0]+'" class="'+(CHF===f[0]?'on':'')+'">'+f[1]+'</button>'}).join('')+'</div>'+
    '<div class="chl">'+(rows||'<div class="v2emp" lang="ar">'+I('book')+'<br>لا توجد فصول مطابقة.</div>')+'</div>';
  var el=$('chQ');el.oninput=function(){CHQ=this.value;R.v2chapters()};if(keep){el.focus();el.setSelectionRange(CHQ.length,CHQ.length)}};
R.v2chapter=function(){var c=chap(CH),s=chStat(c),fr=isFree();
  $('v2chapterW').innerHTML='<div class="v2pt" lang="ar"><button type="button" class="v2bk" data-v="'+CHRET+'" aria-label="رجوع">'+I('arrow')+'</button><span class="v2crumb" style="flex:1;text-align:right">'+(CHRET==='v2resources'?'المصادر':'الفصول')+' ‹ <bdi>Chapter '+c.n+'</bdi></span></div>'+
   '<div class="v2c chd"><div class="ph" style="background-image:url('+chImg(c.n)+')"></div><em>Chapter '+c.n+'</em><h3>'+X(c.name)+'</h3><small>'+s.ts.length+' topics · '+s.np+' pages · '+s.pr+'% read</small></div>'+
   '<div class="tpl">'+s.ts.map(function(t){var lk=locked(t.id),n=npg(t.id),p=pct(t.id);
     return '<div class="v2c tpr'+(lk?' lk':'')+'"><span class="li">'+I(lk?'lock':'book')+'</span><button type="button" class="tmn" data-act="topic" data-id="'+t.id+'"><b>'+t.no+' '+X(t.title.charAt(0).toUpperCase()+t.title.slice(1))+'</b>'+(fr&&!lk?'<span class="fr">FREE</span>':'')+
       '<small>'+n+' page'+(n===1?'':'s')+'</small><span class="pr">'+bar(p)+p+'%</span></button>'+bmk('t:'+t.id)+'</div>'}).join('')+'</div>'+
   '<div class="cha" lang="ar"><button type="button" class="v2btn" data-act="chread">ابدأ القراءة'+I('back')+'</button><button type="button" class="v2btn ol" data-act="chq">'+I('q')+'أسئلة الفصل</button><button type="button" class="v2btn ol" data-act="chc">'+I('layers')+'بطاقات الفصل</button></div>'};

/* ---------- Practice ---------- */
var PSEG=sp('pseg')==='c'?'c':'q';
R.v2practice=function(){var fr=isFree(),wide=window.matchMedia&&matchMedia('(min-width:760px)').matches;
  function qp(){var qa=0,ok=0,mk=0;QS.forEach(function(q){var s=QST[q.id];if(s){if(s.n||s.a){qa++;if(!s.w)ok++}if(s.m)mk++}});
    return '<div class="pstat" lang="ar"><div class="v2c"><b>'+QS.length+'</b><span>سؤال'+(fr&&TOT.qs?' من '+TOT.qs:'')+'</span></div><div class="v2c"><b>'+qa+'</b><span>تمت الإجابة</span></div><div class="v2c"><b>'+(qa?pc(ok,qa)+'%':'–')+'</b><span>إجابات صحيحة</span></div></div>'+
      '<button type="button" class="v2btn" data-v="qbank-v" lang="ar" style="height:50px">'+I('play')+'ابدأ التدريب</button>'+
      '<button type="button" class="v2c hrow" data-v="qbank-v" lang="ar"><span class="ii">'+I('clip')+'</span><span><b>إنشاء اختبار</b><small>تدريب أو امتحان بالوقت · اختيار الفصول وعدد الأسئلة · '+mk+' سؤال محفوظ</small></span>'+I('chev')+'</button>'}
  function cp(){var tc=0,tk=0;deckIds.forEach(function(id){tc+=DECKS[id].cards.length;tk+=deckKnown(id)});
    return '<div class="pstat" lang="ar"><div class="v2c"><b>'+tc+'</b><span>بطاقة'+(fr&&TOT.cards?' من '+TOT.cards:'')+'</span></div><div class="v2c"><b>'+tk+'</b><span>عرفتها</span></div><div class="v2c"><b>'+dueToday()+'</b><span>مستحق اليوم</span></div></div>'+
      '<button type="button" class="v2btn" data-act="cards" lang="ar" style="height:50px">'+I('play')+'ابدأ مراجعة اليوم</button>'+
      '<button type="button" class="v2c hrow" data-act="allcards" lang="ar"><span class="ii">'+I('layers')+'</span><span><b>كل البطاقات</b><small>حسب الفصل والموضوع</small></span>'+I('chev')+'</button>'}
  var h=title('الممارسة والتقييم');
  if(wide)h+='<div class="pgrid"><div class="ppane"><h3 lang="ar">'+I('layers')+'البطاقات</h3>'+cp()+'</div><div class="ppane"><h3 lang="ar">'+I('q')+'الأسئلة</h3>'+qp()+'</div></div>';
  else h+='<div class="v2c pseg" lang="ar"><button type="button" data-act="pseg" data-s="q" class="'+(PSEG==='q'?'on':'')+'">'+I('q')+'الأسئلة</button><button type="button" data-act="pseg" data-s="c" class="'+(PSEG==='c'?'on':'')+'">'+I('layers')+'البطاقات</button></div>'+(PSEG==='q'?qp():cp());
  if(wide)h+='<div class="ppane"><h3 lang="ar">'+I('book')+'تدرّب حسب الفصل</h3><div class="pchs">'+META.chapters.map(function(c){var s=chStat(c);
    return '<div class="v2c pch"><b>Chapter '+c.n+'</b><span>'+X(c.name)+'</span><div lang="ar"><button type="button" class="v2btn sm ol" data-act="pq" data-n="'+c.n+'">'+I('q')+'أسئلة</button><button type="button" class="v2btn sm ol" data-act="pc" data-n="'+c.n+'">'+I('layers')+'بطاقات</button></div></div>'}).join('')+'</div></div>';
  if(fr)h+='<button type="button" class="v2c hacc" data-act="sub" lang="ar">'+I('lock')+'<div><b>النسخة المجانية</b><small>الأسئلة والبطاقات هنا من الموضوع الأول في كل فصل. اشترك لفتح الكل.</small></div></button>';
  $('v2practiceW').innerHTML=h};
window.addEventListener('resize',function(){if(CURV==='v2practice')R.v2practice()});

/* ---------- Resources ---------- */
R.v2resources=function(){var nn=0;Object.keys(HL||{}).forEach(function(k){(HL[k]||[]).forEach(function(x){if(x.n)nn++})});var nb=Object.keys(BM).length;
  function row(act,ic,a,b,attr){return '<button type="button" class="v2c hrow" '+(attr||'data-act="'+act+'"')+'><span class="ii">'+I(ic)+'</span><span><b>'+a+'</b><small>'+b+'</small></span>'+I('chev')+'</button>'}
  $('v2resourcesW').innerHTML=title('المصادر')+'<div class="hub" lang="ar">'+
    row('rr','bolt','المراجعة السريعة','بطاقة امتحان لكل موضوع')+row('dr','pill','أدوية التوليد','الجرعات والمحاذير')+
    row('osce','steth','السريري OSCE',''+TOPICS.filter(function(t){return t.ch===7}).length+' محطات')+row('','play','الفيديو','فيديو شرح لكل موضوع','data-v="v2lect"')+
    row('','slides','المحاضرات','محاضرة لكل موضوع','data-v="v2slides"')+row('notes','pen','ملاحظاتي','ملاحظاتك وتظليلك'+(nn?' · '+nn:''))+row('','bm','المصادر المحفوظة','ما حفظته بعلامة الحفظ'+(nb?' · '+nb:''),'data-v="v2saved"')+'</div>'};
var LCH=0;
R.v2lect=function(){var TI=INFO.timg||{},ts=TOPICS.filter(function(t){return !LCH||t.ch===LCH}),au=0;try{au=Object.keys(AU).length}catch(e){}
  $('v2lectW').innerHTML=title('الفيديو',FROMRD?'reader':'v2resources')+
   '<div class="chf lcf" lang="ar"><button type="button" data-act="lch" data-n="0" class="'+(LCH?'':'on')+'">الكل</button>'+META.chapters.map(function(c){return '<button type="button" data-act="lch" data-n="'+c.n+'" class="'+(LCH===c.n?'on':'')+'"><bdi>Ch '+c.n+'</bdi></button>'}).join('')+'</div>'+
   '<div class="v2c hacc" lang="ar">'+I('play')+'<div><b>محاضرات الفيديو قادمة</b><small>ستُضاف محاضرة فيديو لكل موضوع، وتظهر هنا فور رفعها.</small></div></div>'+
   '<div class="vgl">'+ts.map(function(t){return '<div class="v2c vcd" id="vd-'+t.id+'"><div class="th" style="background-image:url('+(TI[t.id]||chImg(t.ch))+')"><span class="pl">'+I('play')+'</span><span class="sn" lang="ar">قريبًا</span></div>'+
     '<b>'+t.no+' '+X(t.title.charAt(0).toUpperCase()+t.title.slice(1))+'</b><small>Chapter '+t.ch+' · '+X(chap(t.ch).name)+'</small></div>'}).join('')+'</div>'+
   ''};
var SCH=0;
R.v2slides=function(){var TI=INFO.timg||{},ts=TOPICS.filter(function(t){return !SCH||t.ch===SCH});
  $('v2slidesW').innerHTML=title('المحاضرات',FROMRD?'reader':'v2resources')+
   '<div class="chf lcf" lang="ar"><button type="button" data-act="sch" data-n="0" class="'+(SCH?'':'on')+'">الكل</button>'+META.chapters.map(function(c){return '<button type="button" data-act="sch" data-n="'+c.n+'" class="'+(SCH===c.n?'on':'')+'"><bdi>Ch '+c.n+'</bdi></button>'}).join('')+'</div>'+
   '<div class="v2c hacc" lang="ar">'+I('slides')+'<div><b>المحاضرات قادمة</b><small>ستُضاف محاضرة لكل موضوع، وتظهر هنا فور رفعها.</small></div></div>'+
   '<div class="vgl">'+ts.map(function(t){var bl=String(t.sub||'').split(' · ').slice(0,3);
     return '<div class="v2c vcd" id="sl-'+t.id+'"><div class="sld"><span class="sn" lang="ar">قريبًا</span><div class="sx"><i><img src="img/v2_logo.webp" alt="">Obstetrics Master Review</i><b>'+X(t.title.charAt(0).toUpperCase()+t.title.slice(1))+'</b><ul>'+bl.map(function(x){return '<li>'+X(x)+'</li>'}).join('')+'</ul></div><span class="sp" style="background-image:url('+(TI[t.id]||chImg(t.ch))+')"></span></div>'+
     '<b>'+t.no+' '+X(t.title.charAt(0).toUpperCase()+t.title.slice(1))+'</b><small>Chapter '+t.ch+' · '+X(chap(t.ch).name)+'</small></div>'}).join('')+'</div>'};
R.v2dl=function(){$('v2dlW').innerHTML=title('التنزيلات','v2settings')+
  '<div class="v2c sbx" lang="ar"><b>'+I('play')+'محاضرات الفيديو</b><p class="mu">لا توجد محاضرات منزّلة. عند إضافة محاضرات الفيديو يمكنك تنزيلها لمشاهدتها بدون إنترنت، وتظهر هنا.</p><button type="button" class="v2btn sm ol" data-v="v2lect">الفيديو'+I('back')+'</button></div>'+
  '<div class="v2c sbx" lang="ar"><b>'+I('slides')+'المحاضرات</b><p class="mu">لا توجد محاضرات منزّلة. عند إضافة المحاضرات يمكنك تنزيلها، وتظهر هنا.</p><button type="button" class="v2btn sm ol" data-v="v2slides">المحاضرات'+I('back')+'</button></div>'};
/* user manual (owner, 10 Nov 2026): every part of the app in clear steps with a picture of the screen (assets/img/help_*.jpg, made by tools/help_shots.js) */
var HELP=[['home','الرئيسية','من هنا تبدأ كل شيء.',['<b>تابع القراءة</b>: يعيدك إلى آخر موضوع كنت تقرؤه.','<b>افتح الكتاب كاملًا</b>: يفتح الكتاب كله متصلًا من الغلاف إلى آخر صفحة.','<b>بطاقات اليوم</b> و<b>بنك الأسئلة</b>: يبدآن المراجعة والتدريب مباشرة.','<b>آخر نشاط · الفيديو · المحاضرات</b>: اختصارات سريعة.','الشريط السفلي ينقلك بين: Home · Chapters · Practice · Resources · Settings.']],
 ['chapters','الفصول','الكتاب مقسّم إلى سبعة فصول، وكل موضوع يُفتح وحده.',['اضغط <b>Chapters</b> ثم اختر الفصل.','ابحث باسم الفصل أو الموضوع، أو اعرض «قيد القراءة» أو «المحفوظة».','اضغط الموضوع لفتحه. علامة <b>FREE</b> تعني أنه مفتوح في النسخة المجانية، والقفل يعني أنه يحتاج إلى اشتراك.','علامة الحفظ بجانب الموضوع تضيفه إلى «المصادر المحفوظة».','أسفل الفصل: <b>ابدأ القراءة</b>، <b>أسئلة الفصل</b>، <b>بطاقات الفصل</b>.']],
 ['reader','القراءة وأدوات المذاكرة','الأدوات رموز في شريط أعلى الصفحة، وأزرار القراءة في الأسفل. يختفي الشريطان أثناء النزول في القراءة ويعودان بضغطة على الصفحة.',['<b>تظليل</b> و<b>خط</b>: اضغط مطوّلًا على كلمة ثم مدّ التحديد إلى ما تريد، فيظهر شريط الخيارات: اختر لون التظليل أو «خط».','<b>قلم</b>: للرسم والكتابة على الصفحة، و<b>نص</b>: لكتابة ملاحظة في أي مكان.','<b>ملاحظات</b>: حدّد الكلام بالطريقة نفسها ثم اختر «ملاحظة» من الشريط واكتب ملاحظتك.','<b>صفحة</b>: يضيف صفحة فارغة لك، و<b>الحجم</b>: يكبّر الصفحة أو يصغّرها.','في الأسفل: <b>المحاضرات</b> و<b>الفيديو</b> لهذا الموضوع، و<b>المحتويات</b> لمحتويات الكتاب كاملة: كل الفصول ومواضيعها وأرقام صفحاتها.','<b>تقدّم الصفحة</b> (الدائرة في الأسفل): اختر «قرأتها» أو «أتقنتها» ليُحسب تقدّمك.','في أعلى الشاشة: السهم يعيدك إلى الفصل، وزر <b>البيت</b> يعيدك إلى الرئيسية، ثم علامة الحفظ ولون الصفحة. على الجهاز اللوحي والحاسوب يوجد زر يخفي القائمة الجانبية ويظهرها.']],
 ['practice','الممارسة: الأسئلة والبطاقات','اختبر نفسك بعد كل موضوع.',['اضغط <b>Practice</b> ثم اختر «الأسئلة» أو «البطاقات».','<b>الأسئلة</b>: اختر نمط التدريب أو الامتحان بالوقت، ثم الفصول وعدد الأسئلة، واضغط Start. بعد الإجابة يظهر الشرح.','<b>البطاقات</b>: اضغط البطاقة ليظهر الجواب، ثم اختر «عرفتها» أو «مرة أخرى».','<b>بطاقات اليوم</b>: عشر بطاقات كل يوم، وإكمالها يزيد سلسلة أيامك.']],
 ['resources','المصادر','كل ما تحتاجه للمراجعة في مكان واحد.',['<b>المراجعة السريعة</b>: بطاقة امتحان لكل موضوع.','<b>أدوية التوليد</b>: الجرعات والمحاذير.','<b>السريري OSCE</b>: محطات الفحص والتاريخ المرضي.','<b>الفيديو</b> و<b>المحاضرات</b>: تظهر هنا عند إضافتها.','<b>ملاحظاتي</b>: كل ملاحظاتك وتظليلك، و<b>المصادر المحفوظة</b>: ما حفظته بعلامة الحفظ.']],
 ['sub','الاشتراك','من الإعدادات ← الاشتراك.',['<b>الخطة التجريبية</b>: اضغط «ابدأ التجربة» ليُفتح الكتاب كاملًا ساعة واحدة.','للاشتراك: اختر الخطة (شهري أو سنوي أو مدى الحياة) ثم اضغط <b>اشترك الآن</b>.','حوّل المبلغ إلى الحساب الظاهر، ثم اكتب اسمك ورقم هاتفك وأرفق صورة الإيصال واضغط <b>إرسال طلب التفعيل</b>.','يظهر «طلبك قيد المراجعة». يمكنك <b>تعديل الطلب</b> أو <b>إلغاؤه</b> قبل الموافقة.','بعد الموافقة يُفتح الكتاب كاملًا تلقائيًا، بلا أي كود.','<b>جهاز آخر</b>: من جهازك المشترك اضغط «أضف جهازًا آخر»، واكتب رقم الربط في الجهاز الجديد (حتى ثلاثة أجهزة).','عند انتهاء الاشتراك تبقى ملاحظاتك وتقدّمك محفوظة وتعود عند التجديد.']],
 ['settings','الإعدادات','اضبط التطبيق كما تحب.',['<b>الملف الشخصي</b>: اسمك وصورتك ورقم المستخدم.','<b>المظهر</b>: نهاري أو ليلي أو تلقائي. زر الشمس أو القمر في أعلى الشاشة يبدّل بسرعة.','<b>لون التطبيق</b>: ستة ألوان، ويتغيّر معها غلاف الكتاب.','<b>المزامنة</b>: تحفظ ملاحظاتك وتقدّمك بين أجهزتك.','<b>التنزيلات</b> و<b>الإشعارات</b> و<b>تقدّمي</b>.','<b>المساعدة</b>: راسلنا في واتساب أو بالهاتف.','<b>مراسلة الإدارة</b>: من «المساعدة» أو من «الإشعارات» اكتب رسالتك داخل التطبيق، وتصلك الإجابة في الإشعارات مع صوت تنبيه.']]];
/* the owner's five user-guide posters come first (11 Nov 2026), then the detailed steps with screenshots */
var UG5=['التنقّل والرئيسية','القراءة والتعليقات','الأسئلة والبطاقات','المصادر وأدوات الدراسة','الإعدادات والاشتراك'];
R.v2help=function(){$('v2helpW').innerHTML=title('دليل الاستخدام','v2settings')+
  '<div class="chf lcf" lang="ar">'+UG5.map(function(t,i){return '<button type="button" data-act="ugjump" data-i="'+(i+1)+'">'+(i+1)+' · '+t+'</button>'}).join('')+'<button type="button" data-act="ugjump" data-i="d">شرح مفصّل بالصور</button></div>'+
  UG5.map(function(t,i){return '<div class="v2c abp" id="ug'+(i+1)+'"><img src="img/ug_'+(i+1)+'.jpg" alt="دليل المستخدم: '+t+'" loading="lazy"></div>'}).join('')+
  '<h3 class="ugh" id="ugd" lang="ar">شرح مفصّل بصور من التطبيق</h3>'+
  HELP.map(function(h,i){return '<div class="v2c hlp" id="hlp'+i+'" lang="ar"><div class="hx"><b><i>'+(i+1)+'</i>'+h[1]+'</b><p class="mu">'+h[2]+'</p><ol>'+h[3].map(function(s){return '<li>'+s+'</li>'}).join('')+'</ol></div><img src="img/help_'+h[0]+'.jpg" alt="صورة شاشة: '+h[1]+'" loading="lazy"></div>'}).join('')};
/* About the book (owner's design, 11 Nov 2026): a hero and eight tiles; five open the owner's posters, three lead to places of the app */
var ABOUT=[['authors','مؤلفا الكتاب','p'],['reviewers','مراجعو الكتاب','p'],['edition','عن هذه الطبعة','p'],['howto','كيف تستخدم الكتاب','p'],['tools','أدوات الدراسة','help:2'],['refs','مراجع الكتاب','p'],['contents','محتويات الكتاب','v2chapters'],['goals','أهدافنا المستقبلية','p'],['rights','حقوق النشر وشروط الاستخدام','p']],POST='authors';
R.v2about=function(){$('v2aboutW').innerHTML=title('عن الكتاب','v2settings')+
  '<div class="v2c abh" lang="ar"><img src="img/v2_cover_'+PAL+'.jpg" alt="غلاف الكتاب"><div><h3>رفيقك في رحلة تعلّم التوليد</h3><span class="abl">'+I('book')+'</span><p>تعرّف على الكتاب، وفريقه، وطريقة الاستفادة منه</p></div></div>'+
  '<div class="abg" lang="ar">'+ABOUT.slice(0,8).map(function(a){return '<button type="button" class="v2c abt" data-act="about" data-k="'+a[0]+'"><span class="im" style="background-image:url(img/abt_'+a[0]+'.jpg)"></span><span class="lb"><b>'+a[1]+'</b>'+I('chev')+'</span></button>'}).join('')+'</div>'+
  '<button type="button" class="v2c hrow" data-act="about" data-k="rights" lang="ar"><span class="ii">'+I('info')+'</span><span><b>حقوق النشر وشروط الاستخدام</b><small>إخلاء المسؤولية العلمية والطبية</small></span>'+I('chev')+'</button>'};
/* Help (owner, 11 Nov 2026): the author's name and number with three ways to reach him */
var HPS=[['د. عبدالجليل ارجا','0116984258','249116984258'],['د. العباس عبدالرحمن','0965859782','249965859782']];
R.v2contact=function(){var P='<svg class="v2ic" viewBox="0 0 24 24">',ph='<path d="M8.6 4.5l1.6 3.6-1.5 1.6c.9 2 2.6 3.7 4.6 4.6l1.6-1.5 3.6 1.6v2.7c0 .8-.7 1.4-1.5 1.4C10.600 18.5 5.5 13.400 5.500 6c0-.8.6-1.500 1.400-1.500z"/>';
  $('v2contactW').innerHTML=title('المساعدة','v2settings')+
  '<div class="v2c hcd" lang="ar"><img src="img/v2_logo.webp" alt=""><p>للاستفسار عن الكتاب أو الاشتراك، أو للإبلاغ عن خطأ، تواصل مع أحد المؤلفين بالطريقة التي تناسبك.</p></div>'+
  '<button type="button" class="v2c hrow" data-act="msgs" lang="ar"><span class="ii">'+I('mail')+'</span><span><b>راسِل الإدارة من داخل التطبيق</b><small>اكتب سؤالك أو ملاحظتك، وتصلك الإجابة في الإشعارات</small></span>'+I('chev')+'</button>'+
  '<div class="hpp" lang="ar">'+HPS.map(function(h){return '<div class="v2c hpc"><h3>'+h[0]+'</h3><a class="hph" href="tel:+'+h[2]+'" dir="ltr">'+h[1]+'</a><div class="hcg">'+
    '<a class="hco wa" href="https://wa.me/'+h[2]+'" target="_blank" rel="noopener"><span>'+P+'<path d="M12 3.5a8.500 8.500 0 0 0-7.300 12.800L3.500 20.500l4.300-1.100A8.500 8.500 0 1 0 12 3.500z"/><path d="M9.300 8.300l.9 1.900-.8.9c.5 1 1.400 1.900 2.400 2.400l.9-.8 1.900.9v1c0 .5-.4.8-.9.800-3.300-.2-6-2.900-6.200-6.200 0-.5.300-.900.800-.900z"/></svg></span><b>واتساب</b></a>'+
    '<a class="hco tg" href="https://t.me/+'+h[2]+'" target="_blank" rel="noopener"><span>'+P+'<path d="M20.500 4.500L3.500 11l5 1.800 1.800 5.700 2.800-3.400 4.400 3.400z"/><path d="M8.500 12.800l8-5.300-6.200 6.900"/></svg></span><b>تيليجرام</b></a>'+
    '<a class="hco cl" href="tel:+'+h[2]+'"><span>'+P+ph+'</svg></span><b>اتصال</b></a></div></div>'}).join('')+'</div>'};
R.v2poster=function(){var a=ABOUT.filter(function(x){return x[0]===POST})[0];$('v2posterW').innerHTML=title(a[1],'v2about')+'<div class="v2c abp"><img src="img/ab_'+a[0]+'.jpg" alt="'+a[1]+'"></div>'+(a[0]==='howto'?'<button type="button" class="v2btn" data-v="v2help" lang="ar" style="max-width:760px;width:100%;margin:0 auto;height:50px">'+I('book')+'دليل الاستخدام المفصّل بالصور</button>':'')};
R.v2saved=function(){var ks=Object.keys(BM).sort(function(a,b){return BM[b]-BM[a]});
  $('v2savedW').innerHTML=title('المصادر المحفوظة','v2resources')+(ks.length?'<div class="tpl">'+ks.map(function(k){var t=TOPICS.filter(function(x){return 't:'+x.id===k})[0];if(!t)return '';
    return '<div class="v2c tpr"><span class="li">'+I(locked(t.id)?'lock':'book')+'</span><button type="button" class="tmn" data-act="topic" data-id="'+t.id+'"><b>'+t.no+' '+X(t.title)+'</b><small>Chapter '+t.ch+' · '+X(chap(t.ch).name)+'</small></button>'+bmk(k)+'</div>'}).join('')+'</div>'
    :'<div class="v2c v2emp" lang="ar">'+I('bm')+'<br>لم تحفظ شيئًا بعد.<br>اضغط علامة الحفظ بجانب أي موضوع ليظهر هنا.</div>')};

/* ---------- Settings and profile ---------- */
R.v2settings=function(){var a=access(),sy=window.__obsSync&&window.__obsSync.act();
  function row(act,ic,t,em,attr){return '<button type="button" class="srow" '+(attr||'data-act="'+act+'"')+'>'+I(ic)+'<span>'+t+'</span>'+(em?'<em>'+em+'</em>':'')+I('chev')+'</button>'}
  $('v2settingsW').innerHTML=title('الإعدادات')+'<div class="sgrid" lang="ar"><div>'+
   '<button type="button" class="v2c hrow" data-v="v2profile"><span class="v2av" id="setAv" style="width:44px;height:44px"></span><span><b>'+X(myName()||'الملف الشخصي')+'</b><small>الاسم والصورة ورقم المستخدم</small></span>'+I('chev')+'</button>'+
   '<div class="v2c sgrp"><h4>'+I('mon')+'المظهر</h4><div class="sseg">'+[['day','نهاري','sun'],['night','ليلي','moon'],['auto','تلقائي','auto']].map(function(m){return '<button type="button" data-act="mode" data-m="'+m[0]+'" class="'+(MODE===m[0]?'on':'')+'" aria-pressed="'+(MODE===m[0])+'">'+I(m[2])+m[1]+'</button>'}).join('')+'</div></div>'+
   '<div class="v2c sgrp"><h4>'+I('info')+'اللغة</h4><div class="sseg" data-notr>'+[['ar','العربية'],['en','English']].map(function(m){return '<button type="button" data-act="lang" data-l="'+m[0]+'" class="'+(LANG===m[0]?'on':'')+'" aria-pressed="'+(LANG===m[0])+'">'+m[1]+'</button>'}).join('')+'</div></div>'+
   '<div class="v2c sgrp"><h4>'+I('palette')+'لون التطبيق</h4><div class="spal">'+PALS.map(function(p){return '<button type="button" data-act="pal" data-p="'+p[0]+'" class="'+(PAL===p[0]?'on':'')+'" aria-pressed="'+(PAL===p[0])+'"><i style="background:'+p[2]+'">'+(PAL===p[0]?I('check'):'')+'</i>'+p[1]+'</button>'}).join('')+'</div></div>'+
   '</div><div><div class="v2c">'+
    row('sub','crown','الاشتراك',{free:'النسخة المجانية',trial:'فترة تجريبية',paid:'مفعّل',expired:'انتهت التجربة',ended:'انتهى الاشتراك'}[a])+
    row('sync','sync','المزامنة',sy?'بين أجهزتك':'بعد التفعيل')+row('','dl','التنزيلات','الفيديو والمحاضرات','data-v="v2dl"')+row('','bell','الإشعارات','','data-v="v2notif"')+
    row('prog','bars','تقدّمي',overall()+'%')+row('','book','دليل الاستخدام','شرح التطبيق بالصور','data-v="v2help"')+row('','help','المساعدة','واتساب · تيليجرام · اتصال','data-v="v2contact"')+row('','info','عن الكتاب','المؤلفان · المراجعون · المراجع','data-v="v2about"')+
   '</div></div></div>';avatar($('setAv'))};
R.v2profile=function(){var dev=st('orr-dev')||'',code=st('orr-code')||'';
  $('v2profileW').innerHTML=title('الملف الشخصي','v2settings')+'<div class="v2c prf" lang="ar"><span class="v2av" id="prAv"></span>'+
   '<label class="v2btn sm" style="cursor:pointer">'+I('cam')+'تغيير الصورة<input id="prF" type="file" accept="image/*" hidden></label>'+(sp('photo')?'<button type="button" class="v2crumb" data-act="nophoto">إزالة الصورة</button>':'')+
   '<label>الاسم<input id="prN" type="text" maxlength="40" value="'+X(myName())+'" placeholder="Dr. …" dir="auto"></label>'+
   '<label>رقم المستخدم (رقم هذا الجهاز)<span class="ro"><span>'+X(dev.slice(0,10).toUpperCase())+'</span><button type="button" class="bmk" data-act="copy" data-c="'+X(dev.slice(0,10).toUpperCase())+'" aria-label="نسخ">'+I('copy')+'</button></span></label>'+
   '<div style="display:grid;grid-template-columns:2fr 1fr;gap:10px;align-self:stretch"><button type="button" class="v2btn" data-act="saveprof">'+I('check')+'حفظ التغييرات</button><button type="button" class="v2btn ol" data-v="v2settings">إلغاء</button></div></div>';
  avatar($('prAv'));
  $('prF').onchange=function(){var f=this.files[0];if(!f)return;var im=new Image();im.onload=function(){var c=document.createElement('canvas'),s=Math.min(im.width,im.height);c.width=c.height=200;
    c.getContext('2d').drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,200,200);sp('photo',c.toDataURL('image/jpeg',.82));URL.revokeObjectURL(im.src);R.v2profile();header()};im.src=URL.createObjectURL(f)}};

/* ---------- notifications: real events of this device, kept apart from browser push ---------- */
var NR=spj('nread')||{},NS=spj('nseen')||{},MSGS=spj('msgs')||[];
/* a new notification arrives with a soft two-note sound and a small swing of the bell (owner, 11 Nov 2026). Browsers allow sound only
   after the first touch, so one that arrives before it waits for that touch. */
var UG=false,NPEND=false;
function nding(){try{var b=$('v2bd').parentNode;b.classList.remove('ring');void b.offsetWidth;b.classList.add('ring')}catch(e){}
  try{var a=new (window.AudioContext||window.webkitAudioContext)(),t=a.currentTime+.03;[[880,0],[1318.5,.13]].forEach(function(n){var o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.value=n[0];
    g.gain.setValueAtTime(0,t+n[1]);g.gain.linearRampToValueAtTime(.09,t+n[1]+.02);g.gain.exponentialRampToValueAtTime(.0001,t+n[1]+.55);o.connect(g);g.connect(a.destination);o.start(t+n[1]);o.stop(t+n[1]+.6)});
    setTimeout(function(){try{a.close()}catch(e){}},1500)}catch(e){}}
document.addEventListener('pointerdown',function(){if(UG)return;UG=true;if(NPEND){NPEND=false;setTimeout(nding,2200)}},true);
function notifs(){var a=[],d=dueToday(),lp=lastPage(),ac=access();
  /* messages from the administration come first, newest at the top (owner, 13 Nov 2026) */
  (MSGS||[]).filter(function(m){return m.dir==='out'}).slice(-30).reverse().forEach(function(m){a.push({id:'m'+m.id,ic:'mail',t:'رسالة من الإدارة',s:m.body,act:'msgs',ts:Date.parse(m.t)})});
  if(d>0)a.push({id:'cards:'+today(),ic:'cal',t:'حان وقت المراجعة',s:d+' بطاقات في انتظارك اليوم',act:'cards'});
  if(sp('pk')&&lp>0)a.push({id:'cont',q:1,ic:'book',t:'تابع من حيث توقفت',s:PAGES[lp].label,ltr:1,act:'cont'});
  if(ac==='trial')a.push({id:'trial:'+today(),ic:'clock',t:'الفترة التجريبية جارية',s:'الكتاب كله مفتوح الآن. اشترك قبل انتهاء الفترة.',act:'sub'});
  if(ac==='ended')a.push({id:'subend',ic:'lock',t:'انتهى اشتراكك',s:'ملاحظاتك وتقدّمك محفوظة. جدّد الاشتراك لفتح الكتاب كاملًا.',act:'sub'});
  if(REQ&&REQ.status==='pending')a.push({id:'req:'+REQ.t,ic:'clock',t:'طلب الاشتراك قيد المراجعة',s:'سيُفتح الكتاب تلقائيًا بعد الموافقة.',act:'sub'});
  if(REQ&&REQ.status==='rejected'&&ac!=='paid')a.push({id:'rej:'+REQ.t,ic:'info',t:'لم يُقبل طلب الاشتراك',s:REQ.reason||'راجع بيانات التحويل وأرسل الطلب من جديد.',act:'sub'});
  if(ac==='expired')a.push({id:'trialend',ic:'lock',t:'انتهت الفترة التجريبية',s:'الموضوع الأول من كل فصل ما زال مفتوحًا. اشترك لفتح الكتاب كاملًا.',act:'sub'});
  a.push({id:'welcome',ic:'mail',t:'مرحبًا بك في Obstetrics Master Review',s:'ابدأ المراجعة واستفد من جميع المزايا.'});
  var ch=0;var sv=0;a.forEach(function(n){if(!NS[n.id]){NS[n.id]=Date.now();sv=1;if(!n.q)ch=1}});if(sv)spj('nseen',NS);if(ch){if(UG)setTimeout(nding,300);else NPEND=true}return a}
function ago(ts){var m=Math.round((Date.now()-ts)/6e4);return m<1?'الآن':m<60?'قبل '+m+' دقيقة':m<1440?'قبل '+Math.round(m/60)+' ساعة':'قبل '+Math.round(m/1440)+' يوم'}
var NF='all';
R.v2notif=function(){var all=notifs(),un=all.filter(function(n){return !NR[n.id]}),ls=NF==='un'?un:all;
  $('v2notifW').innerHTML=title('الإشعارات','v2home')+'<button type="button" class="v2c hrow nfm" data-act="msgs" lang="ar"><span class="ii">'+I('mail')+'</span><span><b>مراسلة الإدارة</b><small>اكتب سؤالك أو ملاحظتك، وتصلك الإجابة هنا</small></span>'+I('chev')+'</button><div class="v2c pseg" lang="ar"><button type="button" data-act="nf" data-f="all" class="'+(NF==='all'?'on':'')+'">الكل ('+all.length+')</button><button type="button" data-act="nf" data-f="un" class="'+(NF==='un'?'on':'')+'">غير المقروءة ('+un.length+')</button></div>'+
   (un.length?'<button type="button" class="v2btn sm" data-act="nall" lang="ar">'+I('check')+'تحديد الكل كمقروء</button>':'')+
   (ls.length?'<div class="nfl" lang="ar">'+ls.map(function(n){return '<div class="v2c nfr'+(NR[n.id]?' rd':'')+'"><i class="dot"></i>'+I(n.ic)+'<span><b>'+n.t+'</b><small'+(n.ltr?' dir="ltr" style="text-align:right"':'')+'>'+X(n.s)+'</small><time>'+ago(n.ts||NS[n.id]||Date.now())+'</time></span>'+
     (n.act?'<button type="button" class="v2btn sm" data-act="nopen" data-id="'+X(n.id)+'" data-go2="'+n.act+'">فتح'+I('back')+'</button>':(NR[n.id]?'<span></span>':'<button type="button" class="bmk" data-act="nread" data-id="'+X(n.id)+'" aria-label="تحديد كمقروء">'+I('check')+'</button>'))+'</div>'}).join('')+'</div>'
    :'<div class="v2c v2emp" lang="ar">'+I('bell')+'<br>لا توجد إشعارات غير مقروءة.</div>')};

/* ---------- subscription: plans, payment request, automatic opening after the owner approves (no codes) ---------- */
var LIC=window.__lic||null,PLANS=CFG.plans||[],REQ=spj('req')||null,PAY={plan:sp('plan2')||'month',file:null,busy:false};
function plan(id){if(id==='device')return {id:id,ar:'ربط هذا الجهاز باشتراكك',en:'Add device',price:''};if(id==='old')return {id:id,ar:'كود قديم',en:'',price:''};return PLANS.filter(function(p){return p.id===id})[0]||PLANS[0]||{id:id,ar:id,en:id,price:''}}
function fdate(ms){try{return new Date(+ms).toLocaleDateString('ar-EG-u-nu-latn',{day:'numeric',month:'long',year:'numeric'})}catch(e){return new Date(+ms).toDateString()}}
function poll(){if(!LIC||LIC.unlocked()||navigator.onLine===false)return Promise.resolve();
  return autoJoin().then(function(j){if(j)return;return LIC.rpc('obs_request_status',{p_dev:LIC.dev,p_kind:LIC.kind(),p_label:LIC.label()}).then(function(r){var d=r.data;if(r.error||!d||!d.ok)return;
    if(d.active)return LIC.rpc('obs_check',{p_dev:LIC.dev}).then(function(q){if(q.data&&q.data.ok&&q.data.key){spj('req',null);return LIC.adopt(q.data)}});
    var was=JSON.stringify(REQ);REQ=d.status==='none'||d.status==='cancelled'?null:{status:d.status,plan:d.plan,t:d.created,reason:d.reason};spj('req',REQ);if(JSON.stringify(REQ)!==was&&(CURV==='v2sub'||CURV==='v2home'))R[CURV]();header()})}).catch(function(){})}
/* A book added by the admin opens by itself (owner, 14 Nov 2026: "it has to be automatic, not the student copying the message into the
   book"). Inside Student Master Review the platform passes this book the device numbers of the other books on the same phone
   ({smr:'devs'}); a device with no subscription asks obs_auto_join (migration 023), which joins it to the same student's subscription of
   this book (same student id or phone number). The link number in the message stays as a fallback. */
var SIB=spj('sib')||[],AJT=0;
function smrOrg(){try{return window.top!==window.self?(sessionStorage.getItem('smr-parent')||''):''}catch(e){return ''}}
function devTell(){var o=smrOrg();if(!o||!LIC||!LIC.dev)return;try{parent.postMessage({smr:'dev',dev:LIC.dev,sub:!!LIC.unlocked()},o)}catch(e){}}
function autoJoin(){if(!LIC||LIC.unlocked()||!SIB.length||navigator.onLine===false||Date.now()-AJT<15000)return Promise.resolve(false);AJT=Date.now();
  return LIC.rpc('obs_auto_join',{p_dev:LIC.dev,p_kind:LIC.kind(),p_label:LIC.label(),p_book:(typeof BK!=='undefined'&&BK&&BK.book)||'obs',p_others:SIB}).then(function(r){var d=r.data;
    if(r.error||!d||!d.ok)return false;
    return LIC.rpc('obs_check',{p_dev:LIC.dev}).then(function(q){if(q.data&&q.data.ok&&q.data.key){spj('req',null);return Promise.resolve(LIC.adopt(q.data)).then(function(){return true})}return false})}).catch(function(){return false})}
window.addEventListener('message',function(e){var o=smrOrg();if(!o||e.origin!==o||!e.data||e.data.smr!=='devs'||!Array.isArray(e.data.devs))return;
  var L=e.data.devs.filter(function(x){return typeof x==='string'&&/^[0-9a-f]{20,64}$/.test(x)&&(!LIC||x!==LIC.dev)}).slice(0,6);
  if(JSON.stringify(L)!==JSON.stringify(SIB)){SIB=L;spj('sib',L);AJT=0}autoJoin()});
setTimeout(devTell,1500);
setInterval(function(){if(!document.hidden&&((REQ&&REQ.status==='pending')||CURV==='v2sub'))poll()},45000);
/* a device whose subscription ended, was switched off or removed asks again every 10 minutes (and on every opening / return to the app),
   so a renewal or switch-on in the admin opens it by itself */
setInterval(function(){if(!document.hidden&&(st('orr-ended')||st('orr-wassub')))poll()},600000);
document.addEventListener('visibilitychange',function(){if(!document.hidden)poll()});window.addEventListener('online',function(){poll()});
/* the licence layer saw a new end date, plan or name from the admin: show it now */
/* ---------- messages with the administration (owner, 13 Nov 2026): the student writes from Help or Notifications, the owner answers
   from the admin page; answers arrive in the notifications with the sound. Asked on opening, on return to the app, when the internet
   returns, every 10 minutes, and every 20 s while the conversation is open. ---------- */
var MRET='v2contact',MBUSY=false,MSEL=0,MEDIT=0;
/* the whole conversation comes every time, so a message changed or deleted on the other side changes here too */
function mpoll(){if(!LIC||!LIC.rpc||!LIC.dev||navigator.onLine===false||MBUSY)return Promise.resolve();MBUSY=true;
  return LIC.rpc('obs_msg_list',{p_dev:LIC.dev,p_after:0}).then(function(r){MBUSY=false;var a=r&&r.data;if(!r||r.error||!Array.isArray(a))return;
    a.sort(function(x,y){return x.id-y.id});if(JSON.stringify(a)===JSON.stringify(MSGS))return;
    MSGS=a.slice(-300);spj('msgs',MSGS);header();if(CURV==='v2msg')R.v2msg();else if(CURV==='v2notif')R.v2notif()},function(){MBUSY=false})}
setTimeout(mpoll,3000);setInterval(function(){if(!document.hidden&&(CURV==='v2msg'||Date.now()-(mpoll.t||0)>6e5)){mpoll.t=Date.now();mpoll()}},20000);
document.addEventListener('visibilitychange',function(){if(!document.hidden)mpoll()});window.addEventListener('online',function(){mpoll()});
R.v2msg=function(){var h=title('مراسلة الإدارة',MRET),o=$('msT'),keep=o?o.value:'',foc=o&&document.activeElement===o,ol=$('msL'),
    atEnd=!ol||ol.scrollHeight-ol.scrollTop-ol.clientHeight<40,top=ol?ol.scrollTop:0;
  MSGS.forEach(function(m){if(m.dir==='out')NR['m'+m.id]=1});spj('nread',NR);header();
  if(MEDIT&&!MSGS.some(function(m){return m.id===MEDIT&&m.dir==='in'}))MEDIT=0;
  h+='<div class="v2c msgw" lang="ar"><div class="msl" id="msL">'+(MSGS.length?MSGS.map(function(m){var me=m.dir==='in';
      return '<div class="msb '+(me?'me':'ad')+(me&&MSEL===m.id?' sel':'')+(MEDIT===m.id?' ed':'')+'"'+(me?' data-act="msel" data-id="'+m.id+'" role="button" tabindex="0"':'')+'>'+(me?'':'<b>الإدارة</b>')+
        '<p dir="auto">'+X(m.body).replace(/\n/g,'<br>')+'</p><time>'+ago(Date.parse(m.t))+(m.e?'<i class="mset">عُدّلت</i>':'')+'</time>'+
        (me&&MSEL===m.id&&!MEDIT?'<span class="msa"><button type="button" data-act="medit" data-id="'+m.id+'">'+I('pen')+'تعديل</button><button type="button" data-act="mdel" data-id="'+m.id+'">'+I('trash')+'حذف</button></span>':'')+'</div>'}).join(''):
    '<p class="mu msemp">اكتب سؤالك أو ملاحظتك عن الكتاب أو الاشتراك، وستصلك إجابة الإدارة هنا وفي الإشعارات.</p>')+'</div>'+
    (MEDIT?'<div class="mse"><span>'+I('pen')+'تعديل الرسالة</span><button type="button" data-act="mcancel">إلغاء</button></div>':'')+
    '<div class="msf"><textarea id="msT" rows="2" maxlength="1500" placeholder="اكتب رسالتك…" dir="auto"></textarea><button type="button" class="v2btn" data-act="msend">'+(MEDIT?'حفظ':'إرسال')+'</button></div><p class="mu" id="msM"></p></div>';
  $('v2msgW').innerHTML=h;var L=$('msL'),t=$('msT');if(L)L.scrollTop=atEnd?L.scrollHeight:top;if(t){t.value=keep;if(foc)t.focus()}};
window.addEventListener('obs-sub',function(){try{header();if(CURV==='v2sub'||CURV==='v2home'||CURV==='v2settings')R[CURV]()}catch(e){}});
R.v2sub=function(){var a=access(),ex=+st('orr-exp')||0,pl=st('orr-plan'),pend=a!=='paid'&&REQ&&REQ.status==='pending',h=title('الاشتراك',CURV==='v2sub'&&RETS?RETS:'v2settings');
  function chk(t){return '<li>'+I('check')+t+'</li>'}
  if(a==='paid')h+='<div class="v2c sbx ok" lang="ar"><b>'+I('crown')+'اشتراكك فعّال</b><p>'+(pl?'الخطة: '+plan(pl).ar+' · ':'')+(ex?'ينتهي في '+fdate(ex):'بلا تاريخ انتهاء')+'</p><p class="mu">اشتراكك يفتح هاتفك وجهازك اللوحي وحاسوبك، وملاحظاتك وتقدّمك تظهر في كل أجهزتك.</p><button type="button" class="v2btn sm" data-act="pairnew">'+I('sync')+'أضف جهازًا آخر</button><div id="prBox"></div></div>';
  if(a==='ended')h+='<div class="v2c sbx" lang="ar"><b>'+I('lock')+'انتهى اشتراكك</b><p>ملاحظاتك وتظليلك وتقدّمك محفوظة، وتعود كما هي عند تجديد الاشتراك. الموضوع الأول من كل فصل ما زال مفتوحًا.</p></div>';
  if(pend)h+='<div class="v2c sbx" lang="ar"><b>'+I('clock')+'طلبك قيد المراجعة</b><p>'+(REQ.plan==='device'?'':'الخطة: ')+plan(REQ.plan).ar+' · أُرسل '+ago(Date.parse(REQ.t))+'</p><p class="mu">'+(REQ.plan==='device'?'اشتراكك وصل إلى حدّ أجهزته أو يحتاج إلى مراجعة، فأُرسل طلب إلى الإدارة. ':'')+'بعد الموافقة يُفتح الكتاب كاملًا في هذا الجهاز تلقائيًا، ولا تحتاج إلى أي كود.</p><div class="brow">'+(REQ.plan==='device'?'':'<button type="button" class="v2btn sm" data-act="reqedit">'+I('pen')+'تعديل الطلب</button>')+'<button type="button" class="v2btn sm ol" data-act="reqcancel">إلغاء الطلب</button><button type="button" class="v2btn sm ol" data-act="repoll">'+I('sync')+'تحديث الحالة</button></div><p class="mu" id="rqMsg" role="status"></p></div>';
  if(!pend&&a!=='paid'&&REQ&&REQ.status==='rejected')h+='<div class="v2c sbx bad" lang="ar"><b>'+I('info')+'لم يُقبل طلبك</b><p>'+X(REQ.reason||'راجع بيانات التحويل ثم أرسل الطلب من جديد.')+'</p></div>';
  if(a!=='paid'){var fr=LIC&&LIC.fresh();
    h+='<div class="v2c sbx tr" lang="ar"><b>الخطة التجريبية</b><ul>'+chk('وصول كامل لمدة ساعة')+chk('بنفس مزايا الاشتراك الكامل')+'</ul>'+
      (a==='trial'?'<p class="mu">التجربة جارية الآن · '+(LIC?LIC.trialLeft():'')+'</p>':fr?'<button type="button" class="v2btn" data-act="trial">ابدأ التجربة'+I('back')+'</button><p class="mu" id="trMsg"></p>':'<p class="mu">استُخدمت الفترة التجريبية على هذا الجهاز.</p>')+'</div>'+
      '<div class="v2c sbx" lang="ar"><b>'+I('book')+'المجانية</b><ul>'+chk('أول موضوع من كل فصل')+chk('عدد محدود من البطاقات والأسئلة')+'</ul></div>'}
  if(!pend&&(a!=='paid'||ex)){h+='<div class="v2crumb" lang="ar" style="text-align:right">'+(a==='paid'?'تجديد الاشتراك':'اختر خطة الاشتراك')+'</div><div class="plans" lang="ar">'+PLANS.map(function(p){return '<button type="button" class="v2c pln'+(PAY.plan===p.id?' on':'')+'" data-act="plan" data-p="'+p.id+'" aria-pressed="'+(PAY.plan===p.id)+'"><i></i><span>'+(sp('lang')==='en'?p.en:p.ar)+'</span><b dir="ltr">'+X(p.price)+'</b></button>'}).join('')+'</div>'+
    '<button type="button" class="v2btn" data-v="v2pay" lang="ar" style="height:50px">اشترك الآن'+I('back')+'</button>'+
    (a!=='paid'?'<div class="v2c sbx frm" lang="ar"><b>'+I('sync')+'مشترك على جهاز آخر؟</b><p class="mu">في جهازك المشترك افتح «الاشتراك» واضغط «أضف جهازًا آخر»، ثم اكتب هنا رقم الربط الذي يظهر هناك. يُفتح هذا الجهاز فورًا بملاحظاتك وتقدّمك.</p>'+
      '<label>رقم الربط<input id="dvPin" type="tel" maxlength="9" dir="ltr" inputmode="numeric" placeholder="0000 0000" autocomplete="one-time-code"></label><button type="button" class="v2btn" data-act="pairuse">ربط هذا الجهاز'+I('back')+'</button><p class="mu" id="pnMsg" role="status"></p>'+
      '<details><summary>لا أستطيع الوصول إلى جهازي المشترك</summary><p class="mu">اكتب اسمك ورقم الهاتف الذي اشتركت به، وسيُربط هذا الجهاز بعد موافقة الإدارة.</p>'+
      '<label>الاسم<input id="dvN" type="text" maxlength="60" value="'+X(myName())+'" dir="auto"></label><label>رقم هاتف الاشتراك<input id="dvP" type="tel" maxlength="20" value="'+X(sp('tel')||'')+'" dir="ltr" inputmode="tel" placeholder="09XXXXXXXX"></label>'+
      '<button type="button" class="v2btn ol" data-act="adddev">إرسال طلب الربط'+I('back')+'</button><p class="mu" id="dvMsg" role="status"></p></details></div>':'')}
  $('v2subW').innerHTML=h};
var RETS='';
R.v2pay=function(){var ED=PAY.edit&&REQ&&REQ.status==='pending',p=plan(PAY.plan),dev=LIC?LIC.dev.slice(0,10).toUpperCase():'';if(!ED)PAY.edit=false;
  $('v2payW').innerHTML=title(ED?'تعديل الطلب':'إكمال الاشتراك','v2sub')+
   (ED?'<div class="plans" lang="ar">'+PLANS.map(function(q){return '<button type="button" class="v2c pln'+(PAY.plan===q.id?' on':'')+'" data-act="plan2" data-p="'+q.id+'" aria-pressed="'+(PAY.plan===q.id)+'"><i></i><span>'+(sp('lang')==='en'?q.en:q.ar)+'</span><b dir="ltr">'+X(q.price)+'</b></button>'}).join('')+'</div>'
   :'<div class="v2c sbx" lang="ar"><div class="prow"><span>'+I('cal')+'الخطة المختارة</span><b>'+p.ar+' · <bdi dir="ltr">'+X(p.price)+'</bdi></b><button type="button" class="v2btn sm ol" data-v="v2sub">تغيير الخطة</button></div></div>')+
   '<div class="v2c sbx" lang="ar"><b>'+I('sync')+'التحويل إلى الحساب</b><p>اسم الحساب: <b>'+X(CFG.bankak_name||'')+'</b></p><div class="acct"><span dir="ltr">'+X(CFG.bankak||'')+'</span><button type="button" class="v2btn sm ol" data-act="copy2" data-c="'+X(CFG.bankak||'')+'">'+I('copy')+'نسخ رقم الحساب</button></div><p class="mu">حوّل <bdi dir="ltr">'+X(p.price)+'</bdi> ثم أرفق صورة إشعار التحويل وأرسل الطلب.</p></div>'+
   '<div class="v2c sbx frm" lang="ar"><label class="upl" id="rcL">'+I('dl')+'<span id="rcT">'+(PAY.file?'✓ '+X(PAY.file.name):ED?'الإيصال المرسل محفوظ · اضغط لتغييره':'رفع الإيصال (صورة أو PDF)')+'</span><input id="rcF" type="file" accept="image/*,application/pdf" hidden></label>'+
    '<label>الاسم<input id="pyN" type="text" maxlength="60" value="'+X(sp('rname')||myName())+'" dir="auto" autocomplete="name"></label>'+
    '<label>رقم الهاتف<input id="pyP" type="tel" maxlength="20" value="'+X(sp('tel')||'')+'" dir="ltr" inputmode="tel" placeholder="09XXXXXXXX" autocomplete="tel"></label>'+
    '<label>رقم المستخدم<input type="text" value="'+dev+'" readonly dir="ltr"></label>'+
    '<label>تعليق (اختياري)<textarea id="pyC" maxlength="500" rows="2" dir="auto"></textarea></label></div>'+
   '<button type="button" class="v2btn" id="pyGo" data-act="send" lang="ar" style="height:50px">'+(ED?'حفظ التعديل':'إرسال طلب التفعيل')+I('back')+'</button><p class="v2crumb" id="pyMsg" lang="ar" style="text-align:center" role="status">يُراجع طلبك بعد إرساله، ويُفتح الكتاب تلقائيًا بعد الموافقة.</p>';
  $('rcF').onchange=function(){var f=this.files[0],T=$('rcT');if(!f)return;PAY.file=null;
    function done(mime,b64){if(b64.length>2000000){T.textContent='الملف كبير جدًا. اختر صورة أصغر.';return}PAY.file={mime:mime,data:b64,name:f.name};T.textContent='✓ '+f.name}
    if(f.type==='application/pdf'){if(f.size>1400000){T.textContent='ملف PDF كبير جدًا (الحد 1.4 ميغابايت). أرسل صورة بدلًا منه.';return}var fr=new FileReader();fr.onload=function(){done('application/pdf',String(fr.result).split(',')[1]||'')};fr.readAsDataURL(f);return}
    var im=new Image();im.onload=function(){var s=Math.min(1,1500/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(im.src);done('image/jpeg',c.toDataURL('image/jpeg',.72).split(',')[1])};
    im.onerror=function(){T.textContent='تعذّر قراءة الصورة. اختر صورة أخرى.'};im.src=URL.createObjectURL(f)}};

/* ---------- actions ---------- */
function idxOf(re){for(var i=0;i<PAGES.length;i++)if(!PAGES[i].user&&re.test(PAGES[i].f||''))return i;return 0}
var ACT={sub:function(){RETS=V2.indexOf(CURV)>=0&&CURV!=='v2sub'&&CURV!=='v2pay'?CURV:'v2settings';go('v2sub');poll()},
  adddev:function(b){var M=$('dvMsg'),nm=$('dvN').value.trim(),ph=$('dvP').value.replace(/[٠-٩]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'.indexOf(d)}).trim();
    if(PAY.busy)return;if(!LIC){M.textContent='غير متاح في نسخة المراجعة.';return}if(nm.length<2){M.textContent='اكتب اسمك.';return}if(!/^[0-9+ ]{7,20}$/.test(ph)){M.textContent='اكتب رقم هاتف صحيحًا.';return}
    PAY.busy=true;b.disabled=true;M.textContent='جارٍ إرسال الطلب…';sp('tel',ph);
    LIC.rpc('obs_request_submit',{p_dev:LIC.dev,p_kind:LIC.kind(),p_label:LIC.label(),p_name:nm,p_phone:ph,p_plan:'device',p_comment:'',p_mime:null,p_data:null}).then(function(r){PAY.busy=false;b.disabled=false;var d=r.data;
      if(r.error||!d||(!d.ok&&d.reason!=='pending')){M.textContent=d&&d.reason==='many'?'أرسلت عدة طلبات اليوم. انتظر المراجعة.':'تعذّر الإرسال. تأكد من الاتصال وحاول مرة أخرى.';return}
      REQ={status:'pending',plan:'device',t:new Date().toISOString()};spj('req',REQ);header();R.v2sub()},function(){PAY.busy=false;b.disabled=false;M.textContent='تعذّر الإرسال. تأكد من الاتصال وحاول مرة أخرى.'})},
  reqedit:function(){PAY.edit=true;PAY.file=null;PAY.plan=REQ.plan;go('v2pay')},
  plan2:function(b){sp('rname',$('pyN').value.trim());sp('tel',$('pyP').value.trim());PAY.plan=b.dataset.p;R.v2pay()},
  reqcancel:function(b){var M=$('rqMsg');if(!b.dataset.sure){b.dataset.sure='1';b.textContent='تأكيد الإلغاء';M.textContent='سيُحذف الطلب والإيصال، ويمكنك إرسال طلب جديد في أي وقت.';return}
    if(!LIC)return;b.disabled=true;LIC.rpc('obs_request_cancel',{p_dev:LIC.dev}).then(function(r){if(r.error){b.disabled=false;M.textContent='تعذّر الإلغاء. تأكد من الاتصال وحاول مرة أخرى.';return}REQ=null;spj('req',null);header();poll();R.v2sub()},function(){b.disabled=false;M.textContent='تعذّر الإلغاء. تأكد من الاتصال وحاول مرة أخرى.'})},
  pairnew:function(b){var B=$('prBox');if(!LIC||!B)return;b.disabled=true;B.innerHTML='<p class="mu">لحظة…</p>';
    LIC.rpc('obs_pair_new',{p_dev:LIC.dev}).then(function(r){b.disabled=false;var d=r.data;if(r.error||!d||!d.ok){B.innerHTML='<p class="mu">تعذّر إنشاء رقم الربط. تأكد من الاتصال وحاول مرة أخرى.</p>';return}
      B.innerHTML='<div class="acct"><span dir="ltr">'+d.pin.slice(0,4)+' '+d.pin.slice(4)+'</span></div><p class="mu">رقم الربط صالح لمدة 10 دقائق ولجهاز واحد. افتح التطبيق في الجهاز الآخر ← الإعدادات ← الاشتراك ← «مشترك على جهاز آخر» واكتب هذا الرقم.</p>'},function(){b.disabled=false;B.innerHTML='<p class="mu">تعذّر إنشاء رقم الربط. تأكد من الاتصال وحاول مرة أخرى.</p>'})},
  pairuse:function(b){var M=$('pnMsg'),pin=$('dvPin').value.replace(/[٠-٩]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'.indexOf(d)}).replace(/[^0-9]/g,'');if(!LIC){M.textContent='غير متاح في نسخة المراجعة.';return}
    if(pin.length!==8){M.textContent='رقم الربط ثمانية أرقام.';return}b.disabled=true;M.textContent='جارٍ الربط…';
    LIC.rpc('obs_pair_use',{p_dev:LIC.dev,p_kind:LIC.kind(),p_label:LIC.label(),p_pin:pin}).then(function(r){var d=r.data;b.disabled=false;
      if(r.error||!d){M.textContent='تعذّر الربط. تأكد من الاتصال وحاول مرة أخرى.';return}
      if(d.ok){M.textContent='تم الربط · جارٍ فتح الكتاب كاملًا…';return LIC.rpc('obs_check',{p_dev:LIC.dev}).then(function(q){if(q.data&&q.data.ok&&q.data.key)return LIC.adopt(q.data);M.textContent='تم الربط. أعد فتح التطبيق.'})}
      if(d.reason==='full'){REQ={status:'pending',plan:'device',t:new Date().toISOString()};spj('req',REQ);header();R.v2sub();return}
      M.textContent=d.reason==='busy'?'المحاولات كثيرة الآن. حاول بعد دقيقة.':'رقم الربط غير صحيح أو انتهت مدته. اطلب رقمًا جديدًا من جهازك المشترك.'},function(){b.disabled=false;M.textContent='تعذّر الربط. تأكد من الاتصال وحاول مرة أخرى.'})},
  repoll:function(b){b.disabled=true;poll().then(function(){b.disabled=false})},
  plan:function(b){PAY.plan=b.dataset.p;sp('plan2',PAY.plan);R.v2sub()},
  trial:function(b){if(!LIC)return;b.disabled=true;LIC.startTrial(function(m){b.disabled=false;var e=$('trMsg');if(e)e.textContent=m})},
  copy2:function(b){try{navigator.clipboard.writeText(b.dataset.c);var t=b.innerHTML;b.innerHTML=I('check')+'تم النسخ';setTimeout(function(){b.innerHTML=t},1400)}catch(e){}},
  send:function(b){var M=$('pyMsg'),nm=$('pyN').value.trim(),ph=$('pyP').value.replace(/[٠-٩]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'.indexOf(d)}).trim();
    if(PAY.busy)return;if(!LIC){M.textContent='إرسال الطلب غير متاح في نسخة المراجعة.';return}
    var ED=PAY.edit&&REQ&&REQ.status==='pending';if(nm.length<2){M.textContent='اكتب اسمك.';return}if(!/^[0-9+ ]{7,20}$/.test(ph)){M.textContent='اكتب رقم هاتف صحيحًا.';return}
    if(navigator.onLine===false){M.textContent='لا يوجد اتصال بالإنترنت. حاول مرة أخرى عند توفر الاتصال.';return}
    PAY.busy=true;b.disabled=true;M.textContent=ED?'جارٍ حفظ التعديل…':'جارٍ إرسال الطلب…';sp('tel',ph);sp('rname',nm);if(!sp('name'))sp('name',nm);
    (ED?LIC.rpc('obs_request_update',{p_dev:LIC.dev,p_name:nm,p_phone:ph,p_plan:PAY.plan,p_comment:$('pyC').value,p_mime:PAY.file?PAY.file.mime:null,p_data:PAY.file?PAY.file.data:null})
      :LIC.rpc('obs_request_submit',{p_dev:LIC.dev,p_kind:LIC.kind(),p_label:LIC.label(),p_name:nm,p_phone:ph,p_plan:PAY.plan,p_comment:$('pyC').value,p_mime:PAY.file?PAY.file.mime:null,p_data:PAY.file?PAY.file.data:null})).then(function(r){PAY.busy=false;b.disabled=false;var d=r.data;
      if(r.error||!d){M.textContent='تعذّر الإرسال. تأكد من الاتصال واضغط الزر مرة أخرى.';return}
      if(!d.ok&&d.reason==='none'&&ED){PAY.edit=false;M.textContent='تمت مراجعة طلبك قبل التعديل.';poll();return}
      if(!d.ok&&d.reason!=='pending'){M.textContent={wait:'انتظر لحظات ثم اضغط مرة أخرى.',many:'أرسلت عدة طلبات اليوم. انتظر المراجعة أو راسلنا في واتساب.',busy:'الطلبات كثيرة الآن. حاول بعد قليل.',name:'اكتب اسمك.',phone:'اكتب رقم هاتف صحيحًا.',file:'الإيصال غير مقبول. ارفع صورة أو ملف PDF.'}[d.reason]||'تعذّر الإرسال. حاول مرة أخرى.';return}
      PAY.file=null;PAY.edit=false;REQ={status:'pending',plan:PAY.plan,t:ED&&REQ?REQ.t:new Date().toISOString()};spj('req',REQ);header();go('v2sub')},function(){PAY.busy=false;b.disabled=false;M.textContent='تعذّر الإرسال. تأكد من الاتصال واضغط الزر مرة أخرى.'})},
  cont:function(){goIdx(sp('pk')&&lastPage()>0?lastPage():BIDX[TOPICS[0].p-1])},
  cover:function(){WHOLE=true;SCOPE='all';applyScope();goIdx(0)},
  prog:function(){var np=0,nr=0,td=0;TOPICS.forEach(function(t){var a=npg(t.id),b=tRead(t.id);np+=a;nr+=b;if(a&&b>=a)td++});
    var ck=0,ct=0;deckIds.forEach(function(id){ck+=deckKnown(id);ct+=DECKS[id].cards.length});var qu=0,qo=0;QS.forEach(function(q){var s=QST[q.id];if(s&&(s.n||s.a)){qu++;if(!s.w)qo++}});var sk=0;try{sk=streak()}catch(e){}
    function tile(ic,a,b,l){return '<div class="v2c ptl"><span class="ic">'+I(ic)+'</span><b><bdi>'+a+'</bdi>'+(b!==''?'<small> / <bdi>'+b+'</bdi></small>':'')+'</b><span>'+l+'</span></div>'}
    $('v2pbody').innerHTML='<div class="v2c ptop" lang="ar"><span class="pr">'+ring(overall(),120)+'<b><bdi>'+overall()+'%</bdi></b></span><div><h4>التقدم الكلي</h4><p>نسبة الصفحات التي علّمتها «قرأتها» أو «أتقنتها» من كل صفحات الكتاب.</p></div></div>'+
      '<div class="ptg" lang="ar">'+tile('book',nr,np,'صفحات مقروءة')+tile('check',td,TOPICS.length,'مواضيع مكتملة')+tile('layers',ck,ct,'بطاقات معروفة')+tile('q',qu,QS.length,'أسئلة محلولة')+tile('bars',(qu?Math.round(qo/qu*100):0)+'%','','إجابات صحيحة')+tile('flame',sk,'','أيام متتالية')+'</div>'+
      '<p class="shd" lang="ar">التقدم في كل فصل</p><div class="v2c pch">'+META.chapters.map(function(c){var s=chStat(c);return '<div><span><b>Chapter '+c.n+'</b> '+X(c.name)+'</span><em><bdi>'+s.pr+'%</bdi></em>'+bar(s.pr)+'</div>'}).join('')+'</div>';
    $('v2psheet').hidden=false},
  cards:function(){curDeck='daily';started=false;go('cards')},
  allcards:function(){curDeck='all';started=false;go('cards')},
  last:function(){var la=spj('lastact');if(!la||la.k==='read')ACT.cont();else if(la.k==='cards')go('cards');else if(la.k==='qb')go('qbank-v');else go('v2lect')},
  ch:function(b){CH=+b.dataset.n;CHRET='v2chapters';go('v2chapter')},
  chf:function(b){CHF=b.dataset.f;R.v2chapters()},
  topic:function(b){var t=TOPICS.filter(function(x){return x.id===b.dataset.id})[0];if(t)openTopic(t)},
  bm:function(b){var k=b.dataset.k;if(BM[k])delete BM[k];else BM[k]=Date.now();spj('bm',BM);syncSoon();if(CURV==='v2saved')R.v2saved();else{b.classList.toggle('on',!!BM[k]);b.setAttribute('aria-pressed',!!BM[k])}},
  chread:function(){var ts=chStat(chap(CH)).ts,t=ts.filter(function(x){return pct(x.id)<100})[0]||ts[0];if(t)openTopic(t)},
  chq:function(){qset.ch={};qset.ch[CH]=true;spj('qbset',qset);if(CUR&&CUR.done)CUR=null;go('qbank-v')},
  chc:function(){curDeck='ch:'+CH;started=false;try{sp('fcch',String(CH))}catch(e){}go('cards')},
  pq:function(b){CH=+b.dataset.n;ACT.chq()},pc:function(b){CH=+b.dataset.n;ACT.chc()},
  pseg:function(b){PSEG=b.dataset.s;sp('pseg',PSEG);R.v2practice()},
  rr:function(){goIdx(idxOf(/^x9/))},dr:function(){goIdx(idxOf(/^y0/))},
  tpick:function(b){$('v2tsheet').hidden=true;var t=TOPICS.filter(function(x){return x.id===b.dataset.id})[0];if(t)openTopic(t)},
  tall:function(){go('v2chapters')},
  wch:function(b){$('v2tsheet').hidden=true;var ts=chStat(chap(+b.dataset.n)).ts;if(ts&&ts[0])openTopic(ts[0])},
  ugjump:function(b){var e=$('ug'+b.dataset.i);if(e)e.scrollIntoView({behavior:'smooth',block:'start'})},
  oldcode:function(){var m=$('ocMsg');if(!LIC||!LIC.activate){m.textContent='تعذّر التفعيل الآن.';return}LIC.activate($('ocIn').value,function(t){m.textContent=t})},
  hjump:function(b){var e=$('hlp'+b.dataset.i);if(e)e.scrollIntoView({behavior:'smooth',block:'start'})},
  lch:function(b){LCH=+b.dataset.n;R.v2lect()},
  sch:function(b){SCH=+b.dataset.n;R.v2slides()},
  osce:function(){CH=7;CHRET='v2resources';go('v2chapter')},
  notes:function(){openNotes()},
  mode:function(b){MODE=b.dataset.m;sp('mode',MODE);applyLook();R.v2settings()},
  pal:function(b){PAL=b.dataset.p;sp('pal',PAL);applyLook();R.v2settings()},
  sync:function(b){if(!(window.__obsSync&&window.__obsSync.act())){openSub();return}var em=b.querySelector('em');if(em)em.textContent='جارٍ المزامنة…';Promise.resolve(window.__obsSyncNow&&window.__obsSyncNow()).then(function(){if(em)em.textContent='تمت المزامنة ✓'},function(){if(em)em.textContent='تعذّرت المزامنة'})},
  help:function(){window.open('https://wa.me/'+CFG.whatsapp,'_blank')},
  about:function(b){var a=ABOUT.filter(function(x){return x[0]===b.dataset.k})[0];if(!a)return;
    if(a[2]==='p'){POST=a[0];go('v2poster');$('v2poster').scrollTop=0}else if(a[2].indexOf('help:')===0){go('v2help');var e=$('hlp'+a[2].slice(5));if(e)e.scrollIntoView({block:'start'})}else go(a[2])},
  saveprof:function(){sp('name',$('prN').value.trim());header();try{window.__smrProfile()}catch(e){}go('v2settings')},
  nophoto:function(){try{localStorage.removeItem('orr-photo')}catch(e){}R.v2profile();header()},
  copy:function(b){try{navigator.clipboard.writeText(b.dataset.c);b.innerHTML=I('check');setTimeout(function(){b.innerHTML=I('copy')},1200)}catch(e){}},
  nf:function(b){NF=b.dataset.f;R.v2notif()},
  nall:function(){notifs().forEach(function(n){NR[n.id]=1});spj('nread',NR);R.v2notif();header()},
  nread:function(b){NR[b.dataset.id]=1;spj('nread',NR);R.v2notif();header()},
  msgs:function(){if(CURV!=='v2msg')MRET=CURV&&CURV.indexOf('v2')===0?CURV:'v2contact';go('v2msg');mpoll()},
  msel:function(b,e){if(e&&e.target.closest('.msa'))return;var id=+b.dataset.id;MSEL=MSEL===id?0:id;R.v2msg()},
  medit:function(b){var id=+b.dataset.id,m=MSGS.filter(function(x){return x.id===id})[0];if(!m)return;MEDIT=id;MSEL=0;R.v2msg();
    var t=$('msT');if(t){t.value=m.body;t.focus();try{t.setSelectionRange(t.value.length,t.value.length)}catch(e){}}},
  mcancel:function(){MEDIT=0;MSEL=0;R.v2msg();var t=$('msT');if(t)t.value=''},
  mdel:function(b){var id=+b.dataset.id,M=$('msM');if(!confirm(sp('lang')==='en'?'Delete this message?':'حذف هذه الرسالة؟'))return;
    if(!LIC||!LIC.rpc||navigator.onLine===false){M.textContent='لا يوجد اتصال بالإنترنت.';return}
    LIC.rpc('obs_msg_delete',{p_dev:LIC.dev,p_id:id}).then(function(r){var d=r&&r.data;
      if(!r||r.error||!d||!d.ok){M.textContent='تعذّر الحذف. تأكد من الاتصال بالإنترنت.';return}
      MSEL=0;MSGS=MSGS.filter(function(x){return x.id!==id});spj('msgs',MSGS);R.v2msg();mpoll()},function(){M.textContent='تعذّر الحذف. تأكد من الاتصال بالإنترنت.'})},
  msend:function(b){var t=$('msT'),M=$('msM'),v=(t&&t.value||'').trim();if(!v){M.textContent='اكتب رسالتك أولًا.';return}
    if(!LIC||!LIC.rpc){M.textContent='تعذّر الإرسال الآن.';return}if(navigator.onLine===false){M.textContent='لا يوجد اتصال بالإنترنت. أرسل الرسالة عند عودة الاتصال.';return}
    b.disabled=true;var eid=MEDIT;M.textContent=eid?'جارٍ الحفظ…':'جارٍ الإرسال…';
    (eid?LIC.rpc('obs_msg_edit',{p_dev:LIC.dev,p_id:eid,p_body:v}):LIC.rpc('obs_msg_send',{p_dev:LIC.dev,p_name:myName(),p_phone:sp('tel')||'',p_body:v})).then(function(r){b.disabled=false;var d=r&&r.data;
      if(!r||r.error||!d||!d.ok){M.textContent=d&&d.reason==='many'?'أرسلت رسائل كثيرة اليوم. حاول مرة أخرى غدًا.':eid?'تعذّر حفظ التعديل. تأكد من الاتصال بالإنترنت.':'تعذّر الإرسال. تأكد من الاتصال بالإنترنت.';return}
      t.value='';if(eid){MEDIT=0;MSGS.forEach(function(x){if(x.id===eid){x.body=v;x.e=new Date().toISOString()}});R.v2msg()}
      mpoll().then(function(){var m=$('msM');if(m)m.textContent=eid?'حُفظ التعديل.':'أُرسلت رسالتك. ستصلك الإجابة في الإشعارات.'})},function(){b.disabled=false;M.textContent='تعذّر الإرسال. تأكد من الاتصال بالإنترنت.'})},
  nopen:function(b){NR[b.dataset.id]=1;spj('nread',NR);header();ACT[b.dataset.go2]()}};

/* progress details live in a sheet now */
$('v2psx').onclick=function(){$('v2psheet').hidden=true};$('v2psheet').addEventListener('click',function(e){if(e.target===this)this.hidden=true});
applyLook();go('v2home');poll();
/* welcome on every opening (owner, 10 Nov 2026): logo, greeting, «ابدأ»; the press plays a rising chime and the screen opens with a glow */
(function(){var w=$('v2wel'),nm=myName();$('v2welT').innerHTML=greet();$('v2welT').dir='rtl';w.hidden=false;
  /* opening sound (owner, 11 Nov 2026: the first rising chime was annoying, the second was too quiet to hear): a soft, warm three-note bell
     (pure sine notes with a light octave above, quick gentle start, long fade), loud enough for a phone speaker */
  function snd(){try{var a=new (window.AudioContext||window.webkitAudioContext)();if(a.resume)a.resume();var t=a.currentTime+.04,out=a.createGain();out.gain.value=.9;out.connect(a.destination);
    [[523.25,0,.20],[659.25,.13,.17],[783.99,.26,.19]].forEach(function(n){[[1,1],[2,.22]].forEach(function(h){var o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.value=n[0]*h[0];
      g.gain.setValueAtTime(0,t+n[1]);g.gain.linearRampToValueAtTime(n[2]*h[1],t+n[1]+.025);g.gain.exponentialRampToValueAtTime(.0001,t+n[1]+(h[0]===1?1.5:.7));o.connect(g);g.connect(out);o.start(t+n[1]);o.stop(t+n[1]+1.6)})});
    setTimeout(function(){try{a.close()}catch(e){}},2400)}catch(e){}}
  $('v2welGo').onclick=function(){snd();w.classList.add('go');setTimeout(function(){w.hidden=true;w.classList.remove('go')},1150)};
  setTimeout(function(){try{$('v2welGo').focus()}catch(e){}},50)})();
})();
