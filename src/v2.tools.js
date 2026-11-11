/* ---------- reader tools, third pass (owner, 11 Nov 2026) ----------
   1. Tool panels are sheets in the app's design: header (icon, name, on/off switch, close), labelled parts, a hint line.
   2. Calm selection: with the highlighter, underline or note tool on, a swipe or long-press only SELECTS (whole words); the student
      adjusts the two ends by their handles and presses the confirm button; nothing is marked before that. (A mouse marks at once.)
   3. Free notes: with the note tool on, a tap anywhere on the page (a word or an empty place) puts a note there (ink item t='n').
   4. The device Back button goes back inside the app instead of closing it. */
var TIC={hlPen:'<path d="M14.5 3.5l6 6-9 9H6.5l-1-1v-5z"/><path d="M12 6l6 6"/><path d="M6.5 18.5L4 21"/><path class="ink" d="M11 21.5h10" stroke-width="3"/>',
 ulBtn:'<path d="M6.5 16L12 3l5.5 13"/><path d="M8.6 11.5h6.8"/><path class="ink" d="M4 21h16" stroke-width="3"/>',
 inkBtn:'<path d="M12 19l7-7 3 3-7 7z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z"/><path d="M2 2l7.6 7.6"/><circle cx="11" cy="11" r="2"/>',
 txtBtn:'<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 9V7.5h8V9M12 7.5v9M10 16.5h4"/>',
 rNotes:'<path d="M5 3h14a2 2 0 0 1 2 2v9l-7 7H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M21 14h-5a2 2 0 0 0-2 2v5"/><path d="M8 8.5h8M8 12.5h4"/>',
 upBtn:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M12 11.5v6M9 14.5h6"/>',
 zoomBtn:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/>'};
Object.keys(TIC).forEach(function(id){var s=$(id)&&$(id).querySelector('svg');if(s){s.innerHTML=TIC[id];s.setAttribute('stroke-width','1.8');s.setAttribute('stroke-linecap','round');s.setAttribute('stroke-linejoin','round')}});
flyAt=function(f,btn){f.hidden=false;f.classList.add('tsheet');f.style.top=f.style.bottom=f.style.left=f.style.right='';if(f.querySelector('.tfh'))return;
  var b=f.firstElementChild,tt={hlPen:'التظليل',upBtn:'صفحة للملاحظات'}[btn&&btn.id]||'';if(b&&b.tagName==='B'){if(!tt||btn.id==='hlPen'){tt=tt||b.textContent;b.remove()}}
  [].forEach.call(f.querySelectorAll(':scope>b'),function(x){x.className='tfl'});
  function lab(sel,t){[].forEach.call(f.querySelectorAll(sel),function(x){var p=x.previousElementSibling;if(p&&p.classList.contains('tfl'))return;var l=document.createElement('b');l.className='tfl';l.textContent=t;x.parentNode.insertBefore(l,x)})}
  lab('.pdots','اللون');lab('.hst','شكل التظليل');lab('.isz.tsz','حجم الخط');lab('.isz.mks','عرض الماركر');lab('.isz:not(.tsz):not(.mks)','السماكة');
  var h=document.createElement('div');h.className='tfh';var sv=btn&&btn.querySelector('svg');h.innerHTML='<span class="tfi">'+(sv?sv.outerHTML:'')+'</span><span class="tft"></span>';h.querySelector('.tft').textContent=tt;
  var m=f.querySelector('.ptog[data-pen],.ptog[data-upen],.ptog[data-npen],.ptog[data-ink],.ptog[data-txon]');
  if(m){var on=m.classList.contains('on');m.classList.add('tsw');m.setAttribute('role','switch');m.setAttribute('aria-checked',on);m.setAttribute('aria-label',m.textContent);m.innerHTML='<i></i>';h.appendChild(m)}
  var x=document.createElement('button');x.type='button';x.className='tfx';x.setAttribute('aria-label','إغلاق');x.textContent='✕';x.addEventListener('click',function(e){e.stopPropagation();penFly(false)});h.appendChild(x);
  f.insertBefore(h,f.firstChild)};

/* ----- calm selection ----- */
var PS=null,SWIPE=false,_penApply=penApply,PSB=document.createElement('div'),PH=[document.createElement('i'),document.createElement('i')],PHD=null;
PSB.id='psb';PSB.lang='ar';PSB.dir='rtl';PSB.hidden=true;$('reader').appendChild(PSB);
PH.forEach(function(h,n){h.className='psh '+(n?'e':'s');h.hidden=true;document.body.appendChild(h)});
function psSnap(){var s=getSelection();if(!s.rangeCount||s.isCollapsed)return;var r=s.getRangeAt(0).cloneRange(),a=r.startContainer,b=r.endContainer,i=r.startOffset,j=r.endOffset,ch=false;
  if(a.nodeType===3){var t=a.nodeValue,i0=i;while(i<t.length&&/\s/.test(t[i])&&(a!==b||i<j-1))i++;while(i>0&&/\S/.test(t[i-1]))i--;if(i!==i0){r.setStart(a,i);ch=true}}
  if(b.nodeType===3){var u=b.nodeValue,j0=j;while(j>0&&/\s/.test(u[j-1])&&(a!==b||j>i+1))j--;while(j<u.length&&/\S/.test(u[j]))j++;if(j!==j0){r.setEnd(b,j);ch=true}}
  if(ch){s.removeAllRanges();s.addRange(r)}}
function psRects(){var s=getSelection();if(!s.rangeCount||s.isCollapsed)return null;var rs=[].filter.call(s.getRangeAt(0).getClientRects(),function(r){return r.width>1&&r.height>4});return rs.length?rs:null}
function psPlace(){var rs=PS&&SWIPE&&psRects();PH[0].hidden=PH[1].hidden=!rs;if(!rs)return;var a=rs[0],b=rs[rs.length-1];
  PH[0].style.left=(a.left-11)+'px';PH[0].style.top=(a.bottom-2)+'px';PH[1].style.left=(b.right-11)+'px';PH[1].style.top=(b.bottom-2)+'px'}
function psShow(){var w=NPEN?'اكتب ملاحظة':UPEN?'ضع الخط':'ظلِّل';PSB.innerHTML='<button type="button" class="x" data-ps="x" aria-label="إلغاء">✕</button><span>'+(SWIPE?'اسحب الطرفين لتعديل التحديد':'عدّل التحديد ثم أكّد')+'</span><button type="button" class="ok" data-ps="ok">'+I('check')+w+'</button>';PSB.hidden=false;psPlace()}
function psClear(keep){PS=null;PSB.hidden=true;PH[0].hidden=PH[1].hidden=true;if(!keep){try{getSelection().removeAllRanges()}catch(e){}}}
penApply=function(o){if(lastPT==='mouse'){_penApply(o);return}if(!PHD)psSnap();PS=selOffsets()||o;psShow()};
PSB.addEventListener('pointerdown',function(e){e.preventDefault()});PSB.addEventListener('mousedown',function(e){e.preventDefault()});PSB.addEventListener('touchstart',function(e){if(e.cancelable)e.preventDefault();var b=e.target.closest('button');if(b)psAct(b.dataset.ps)},{passive:false});
function psAct(a){if(!PS)return;var o=selOffsets()||PS;if(a==='ok'){psClear(true);_penApply(o)}else psClear()}
PSB.addEventListener('click',function(e){var b=e.target.closest('button');if(b)psAct(b.dataset.ps)});
pagesEl.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse')SWIPE=false},true);
pagesEl.addEventListener('pointerup',function(){if(penDrag&&penDrag.on)SWIPE=true},true);
$('scroller').addEventListener('scroll',function(){if(PS)psPlace()},{passive:true});
PH.forEach(function(h,n){h.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();var s=getSelection();if(!s.rangeCount)return;var r=s.getRangeAt(0);
    PHD={n:n,c:n?r.startContainer:r.endContainer,o:n?r.startOffset:r.endOffset};try{h.setPointerCapture(e.pointerId)}catch(_){}});
  h.addEventListener('pointermove',function(e){if(!PHD)return;e.preventDefault();var c=caretAt(e.clientX,e.clientY-20);if(!c||!c.startContainer||!pagesEl.contains(c.startContainer))return;var r=document.createRange();
    try{r.setStart(PHD.c,PHD.o);r.setEnd(PHD.c,PHD.o);if(r.comparePoint(c.startContainer,c.startOffset)<0)r.setStart(c.startContainer,c.startOffset);else r.setEnd(c.startContainer,c.startOffset)}catch(_){return}
    if(r.collapsed)return;var s=getSelection();s.removeAllRanges();s.addRange(r);psPlace()});
  function end(){if(!PHD)return;PHD=null;psSnap();var o=selOffsets();if(o)PS=o;psPlace()}h.addEventListener('pointerup',end);h.addEventListener('pointercancel',end)});
var _setPens=setPens;setPens=function(h,n,u){if(PS)psClear();_setPens(h,n,u)};

/* ----- free notes: a note anywhere on the page ----- */
var _inkEl=inkEl,_inkHit=inkHit,FN=null,FNB=document.createElement('div');
inkEl=function(x){if(x.t!=='n')return _inkEl(x);return '<g class="fn" data-id="'+x.id+'" transform="translate('+(x.x-18)+' '+(x.y-18)+') scale(1.4)"><title>'+esc(String(x.txt||'').slice(0,80))+'</title><rect x="-6" y="-6" width="38" height="38" fill="transparent"/><path d="M3 1h20a2 2 0 0 1 2 2v13l-9 9H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2z" fill="#fde68a" stroke="#b7791f" stroke-width="1.4" stroke-linejoin="round"/><path d="M25 16h-7a2 2 0 0 0-2 2v7" fill="#fbbf24" stroke="#b7791f" stroke-width="1.4" stroke-linejoin="round"/><path d="M6 8h14M6 12.5h9" stroke="#92400e" stroke-width="1.6" stroke-linecap="round"/></g>'};
inkHit=function(x,p){return x.t==='n'?false:_inkHit(x,p)};
FNB.id='fnb';FNB.lang='ar';FNB.dir='rtl';FNB.hidden=true;document.body.appendChild(FNB);
function fnOpen(i,it,x,y){FN={i:i,it:it,x:x,y:y};FNB.innerHTML='<div class="fnh">'+I('pen')+'<b>'+(it?'ملاحظة':'ملاحظة جديدة')+'</b><span dir="ltr">p '+(PAGES[i].bn||'')+'</span></div><textarea rows="4" maxlength="1200" dir="auto" placeholder="اكتب ملاحظتك هنا…"></textarea><div class="fna">'+(it?'<button type="button" data-fn="del" class="d">حذف</button>':'')+'<button type="button" data-fn="no">إلغاء</button><button type="button" data-fn="ok" class="ok">حفظ</button></div>';
  var ta=FNB.querySelector('textarea');ta.value=it?it.txt:'';FNB.hidden=false;fnPlace();if(!it)setTimeout(function(){ta.focus();fnPlace()},60)}
function fnPlace(){if(FNB.hidden)return;var vv=window.visualViewport;FNB.style.top=((vv?vv.offsetTop:0)+70)+'px'}
if(window.visualViewport){visualViewport.addEventListener('resize',fnPlace);visualViewport.addEventListener('scroll',fnPlace)}
FNB.addEventListener('click',function(e){var b=e.target.closest('button');if(!b||!FN)return;var a=b.dataset.fn,F=FN,k=PKEY[F.i],v=FNB.querySelector('textarea').value.replace(/\s+$/,'');FN=null;FNB.hidden=true;
  if(a==='del'&&F.it){inkDo({t:'del',k:k,items:[F.it]});return}if(a!=='ok')return;
  if(!v){if(F.it)inkDo({t:'del',k:k,items:[F.it]});return}
  if(F.it){if(v===F.it.txt)return;var nw=JSON.parse(JSON.stringify(F.it));nw.id=rid();nw.txt=v;inkDo({t:'mod',k:k,del:[F.it],add:[nw]})}
  else inkDo({t:'add',k:k,items:[{t:'n',id:rid(),x:Math.round(F.x),y:Math.round(F.y),txt:v}]})});
pagesEl.addEventListener('click',function(e){var t=e.target,g=t.closest&&t.closest('g.fn'),pw=t.closest&&t.closest('.pw');
  if(g&&pw&&!INKON&&!TXON){e.stopPropagation();e.preventDefault();var i=+pw.dataset.i,it=(INK[PKEY[i]]||[]).filter(function(x){return x.id===g.dataset.id})[0];if(it)fnOpen(i,it);return}
  if(PS){psClear();e.stopPropagation();e.preventDefault();return}
  if(!NPEN||NOTE||!pw||multiTouch()||Date.now()-lastScroll<300||!getSelection().isCollapsed||t.closest('mark.uhl,span.nm'))return;
  e.stopPropagation();e.preventDefault();var r=pw.getBoundingClientRect();fnOpen(+pw.dataset.i,null,Math.max(16,Math.min(800,(e.clientX-r.left)/r.width*816)),Math.max(16,Math.min(1136,(e.clientY-r.top)/r.height*1152)))},true);
var _hlHtml=hlHtml;hlHtml=function(){var h=_hlHtml();if(HLTAB!=='n'&&!/data-ht="n"/.test(h))return h;var L=[];PAGES.forEach(function(p,i){(INK[PKEY[i]]||[]).forEach(function(x){if(x.t==='n')L.push({i:i,x:x})})});if(!L.length)return h;
  h=h.replace(/(data-ht="n"[^>]*><b>[^<]*<\/b><span>)(\d+)/,function(m,a,n){return a+(+n+L.length)});if(HLTAB!=='n')return h;
  return h.replace(/<p class="empty">[\s\S]*?<\/p>/,'')+L.map(function(o){return '<button class="hli isn" type="button" data-p="'+(o.i+1)+'"><i class="y"></i><span><b>p '+(PAGES[o.i].bn||'✎')+' · '+esc(PAGES[o.i].label)+'</b><em class="hn">'+esc(o.x.txt)+'</em></span></button>'}).join('')};
var _noteFly=noteFly;noteFly=function(){_noteFly();var s=$('penFly').querySelector('small');if(s)s.textContent=NPEN?'اضغط أي مكان في الصفحة، على كلمة أو في مكان فارغ، لتضع ملاحظة هناك. أو اسحب إصبعك على كلام لتكتب ملاحظة عليه.':'شغّل قلم الملاحظات ثم اضغط أي مكان في الصفحة لتضع ملاحظة.'};
$('rNotes').onclick=function(e){e.stopPropagation();var f=$('penFly');if(!f.hidden&&f.dataset.k==='n')penFly(false);else noteFly()};

/* ----- the device Back button moves back inside the app ----- */
function backOne(){var w=$('v2wel');if(w&&!w.hidden)return false;
  if(!FNB.hidden){FN=null;FNB.hidden=true;return true}if(PS){psClear();return true}
  var ids=['penFly','v2tsheet','nsheet','bmMenu'],i,el;for(i=0;i<ids.length;i++){el=$(ids[i]);if(el&&!el.hidden){if(ids[i]==='penFly')penFly(false);else el.hidden=true;return true}}
  el=[].filter.call(document.querySelectorAll('.sheet,.nbox,.itx'),function(x){return !x.hidden&&x.offsetParent!==null})[0];
  if(el){var c=el.querySelector('[data-a="close"],[data-no]');if(c)c.click();else el.hidden=true;return true}
  var rb=$('rbar');if(rb&&rb.classList.contains('fan')){$('rbShow').click();return true}
  if(CURV==='reader'){$('backBtn').click();return true}
  var v=$(CURV),bk=v&&v.querySelector('.v2bk');if(bk){bk.click();return true}
  if(CURV!=='v2home'){var t=tabOf(CURV);go(t!==CURV?t:'v2home');return true}return false}
try{history.replaceState({obs:0},'');history.pushState({obs:1},'');
  window.addEventListener('popstate',function(){var ok=false;try{ok=backOne()}catch(e){}if(ok)history.pushState({obs:1},'')})}catch(e){}

/* tips and hints say what the tools do now (select, adjust, confirm) */
var _railTip=railTip;railTip=function(m){m=String(m);if(m.indexOf('التظليل السريع يعمل')===0)m='التظليل يعمل: حدّد الكلام، عدّل طرفيه، ثم اضغط «ظلِّل»';else if(m.indexOf('الخط السريع يعمل')===0)m='الخط يعمل: حدّد الكلام، عدّل طرفيه، ثم اضغط «ضع الخط»';
  else if(m.indexOf('قلم الملاحظات يعمل')===0)m='قلم الملاحظات يعمل: اضغط أي مكان في الصفحة لتضع ملاحظة';else if(m==='التظليل السريع متوقف')m='التظليل متوقف';else if(m==='الخط السريع متوقف')m='الخط متوقف';_railTip(m)};
var _flyAt3=flyAt;flyAt=function(f,btn){var k=btn&&btn.id,s=f.querySelector('small');if(s&&!FINE&&((k==='hlPen'&&PEN)||(k==='ulBtn'&&UPEN)))s.textContent='اسحب إصبعك على الكلام أو اضغط مطوّلًا على كلمة لتحديدها، ثم اسحب طرفي التحديد لتعديله واضغط زر التأكيد. لا يُطبَّق شيء قبل أن تؤكّد.';_flyAt3(f,btn)};
