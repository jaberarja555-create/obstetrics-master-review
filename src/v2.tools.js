/* ---------- reader tools, third pass (owner, 11 Nov 2026) ----------
   1. Tool panels are sheets in the app's design: header (icon, name, on/off switch, close), labelled parts, a hint line.
   2. Highlight, underline and note are options that appear after the student selects text (no tools to switch on).
   3. The tools button holds only the drawing tools; zoom and the page number are separate controls on the page.
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
  var m=f.querySelector('.ptog[data-ink],.ptog[data-txon]')||(f.dataset.k==='m'?f.querySelector('.ptog[data-mk]'):null);
  if(m){var on=m.classList.contains('on');m.classList.add('tsw');m.setAttribute('role','switch');m.setAttribute('aria-checked',on);m.setAttribute('aria-label',m.textContent);m.innerHTML='<i></i>';h.appendChild(m)}
  var x=document.createElement('button');x.type='button';x.className='tfx';x.setAttribute('aria-label','إغلاق');x.textContent='✕';x.addEventListener('click',function(e){e.stopPropagation();penFly(false)});h.appendChild(x);
  var st=f.querySelector('.ptog[data-styl]');if(st)st.textContent=(st.classList.contains('on')?'✓ ':'')+'قلم إلكتروني فقط';
  var cl=f.querySelector('.ptog[data-ic0]');if(cl&&st){var row=document.createElement('div');row.className='zrow';st.parentNode.insertBefore(row,st);row.appendChild(st);row.appendChild(cl);st.style.marginTop=''}
  f.insertBefore(h,f.firstChild)};

/* ----- marking text (owner, 11 Nov 2026, evening): no highlight / underline / note tools to switch on. The student selects text the usual
   way (long-press, then the system's own handles) and a bar of options appears: six highlight colours, خط, ملاحظة. ----- */
try{setPens(false,false,false)}catch(e){}
var SOU='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v7a5 5 0 0 0 10 0V4"/><path d="M5 20.5h14"/></svg>',
    SON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+TIC.rNotes+'</svg>',
    SOD='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>';
if(!sp('uw'))UW=1;   /* underline starts thin (owner) */
showPalette=function(){var hb=$('hlbar');hb.className='hlbar selopt';hb.lang='ar';hb.dir='rtl';
  hb.innerHTML='<div class="sor"><b>تظليل</b><div class="soc">'+colDots('data-c')+'</div></div>'+
    '<div class="sor"><b>خط</b><div class="soc sou">'+UCOLS.map(function(c){return '<button type="button" class="ud" data-ulc="'+c+'" aria-label="خط"><span>abc</span><i style="background:'+UHEX[c]+'"></i></button>'}).join('')+'</div></div>'+
    '<div class="sob"><button class="txt" type="button" data-n="1">'+SON+'<span>ملاحظة</span></button><button class="txt sox" type="button" data-x="1" aria-label="إغلاق">✕</button></div>';hb.hidden=false};
$('hlbar').addEventListener('click',function(e){var b=e.target.closest('button[data-ulc]');if(!b||!pending)return;e.stopPropagation();UCOL=b.dataset.ulc;sp('ucol',UCOL);addHL(pending,UCOL)},true);
var _pickHL=pickHL;pickHL=function(m){_pickHL(m);var hb=$('hlbar');hb.className='hlbar selopt';hb.lang='ar';hb.dir='rtl';var bs=[].slice.call(hb.children),c=document.createElement('div'),b=document.createElement('div');c.className='soc';b.className='sob';
  bs.forEach(function(x){if(x.classList.contains('dot')||x.classList.contains('uwp'))c.appendChild(x);else{if(x.dataset.rm)x.innerHTML=SOD+'<span>حذف</span>';else if(x.dataset.an)x.innerHTML=SON+'<span>ملاحظة</span>';else if(x.dataset.x){x.classList.add('sox');x.setAttribute('aria-label','إغلاق')}b.appendChild(x)}});hb.appendChild(c);hb.appendChild(b)};
/* notes that were put freely on a page during the short time that feature existed stay readable (tap to read, edit or delete); new ones cannot be made */
var _inkEl=inkEl,_inkHit=inkHit,FN=null,FNB=document.createElement('div');
inkEl=function(x){if(x.t!=='n')return _inkEl(x);return '<g class="fn" data-id="'+x.id+'" transform="translate('+(x.x-18)+' '+(x.y-18)+') scale(1.4)"><rect x="-6" y="-6" width="38" height="38" fill="transparent"/><path d="M3 1h20a2 2 0 0 1 2 2v13l-9 9H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2z" fill="#fde68a" stroke="#b7791f" stroke-width="1.4" stroke-linejoin="round"/><path d="M6 8h14M6 12.5h9" stroke="#92400e" stroke-width="1.6" stroke-linecap="round"/></g>'};
inkHit=function(x,p){return x.t==='n'?false:_inkHit(x,p)};
FNB.id='fnb';FNB.lang='ar';FNB.dir='rtl';FNB.hidden=true;document.body.appendChild(FNB);
function fnOpen(i,it){FN={i:i,it:it};FNB.innerHTML='<div class="fnh">'+I('pen')+'<b>ملاحظة</b><span dir="ltr">p '+(PAGES[i].bn||'')+'</span></div><textarea rows="4" maxlength="1200" dir="auto"></textarea><div class="fna"><button type="button" data-fn="del" class="d">حذف</button><button type="button" data-fn="no">إلغاء</button><button type="button" data-fn="ok" class="ok">حفظ</button></div>';
  FNB.querySelector('textarea').value=it.txt;FNB.style.top='70px';FNB.hidden=false}
FNB.addEventListener('click',function(e){var b=e.target.closest('button');if(!b||!FN)return;var a=b.dataset.fn,F=FN,k=PKEY[F.i],v=FNB.querySelector('textarea').value.replace(/\s+$/,'');FN=null;FNB.hidden=true;
  if(a==='del'||(a==='ok'&&!v)){inkDo({t:'del',k:k,items:[F.it]});return}if(a!=='ok'||v===F.it.txt)return;var nw=JSON.parse(JSON.stringify(F.it));nw.id=rid();nw.txt=v;inkDo({t:'mod',k:k,del:[F.it],add:[nw]})});
pagesEl.addEventListener('click',function(e){var t=e.target,g=t.closest&&t.closest('g.fn'),pw=t.closest&&t.closest('.pw');if(!g||!pw||INKON||TXON)return;
  e.stopPropagation();e.preventDefault();var i=+pw.dataset.i,it=(INK[PKEY[i]]||[]).filter(function(x){return x.id===g.dataset.id})[0];if(it)fnOpen(i,it)},true);

/* ----- the tools button holds the drawing tools only: pen, free marker, text, notes page (+ undo / redo). Zoom and the page number
   are their own small controls on the page. ----- */
(function(){var rb=$('rbar'),sh=$('rbShow'),mk=document.createElement('button');mk.type='button';mk.id='mkBtn';
  mk.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+TIC.hlPen+'</svg><span>ماركر</span>';rb.insertBefore(mk,$('inkBtn').nextSibling);
  function mkSheet(){var f=$('penFly'),on=INKON&&ITOOL==='h';f.dataset.k='m';
    f.innerHTML='<b>الماركر</b><div class="pdots">'+HCOL.map(function(c){return '<button type="button" class="dot'+(c===PCOL?' cur':'')+'" data-mc="'+c+'" style="background:'+MHEX[c]+'" aria-label="colour"></button>'}).join('')+'</div>'+
      '<div class="isz mks">'+MKW.map(function(w,n){return '<button type="button" class="'+(n+1===MSI?'cur':'')+'" data-msz="'+(n+1)+'"><i style="height:'+Math.round(w/2.2)+'px;background:'+MHEX[PCOL]+'"></i>'+(n+1)+'</button>'}).join('')+'</div>'+
      '<button type="button" class="ptog'+(on?' on':'')+'" data-mk="1">الماركر</button><small>ظلّل بحرّية بإصبعك أو بالقلم الإلكتروني فوق أي شيء في الصفحة: كلام، صورة أو كتابة القلم.</small>';flyAt(f,mk)}
  mk.onclick=function(e){e.stopPropagation();var f=$('penFly');if(!f.hidden&&f.dataset.k==='m')penFly(false);else mkSheet()};
  var _mkFly=mkFly;mkFly=function(){if(!$('penFly').hidden&&$('penFly').dataset.k==='m'){mkSheet();return}_mkFly()};
  function at(e,r,deg,i){var a=deg*Math.PI/180;e.style.setProperty('--x',Math.round(r*Math.cos(a))+'px');e.style.setProperty('--y',Math.round(-r*Math.sin(a))+'px');e.style.setProperty('--d',(i*0.04)+'s')}
  
  sh.innerHTML='<svg class="v2ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 3.5l3 3a1.4 1.4 0 0 1 0 2L9 20l-5.5 1.5L5 16 16.5 4.5"/><path d="M14 6l4 4"/><path d="M5 16l3 3"/><path d="M5.5 2.5v4M3.5 4.5h4"/><path d="M19.5 16.5v3M18 18h3"/></svg>';
  sh.title='أدوات الكتابة والرسم';sh.setAttribute('aria-label','أدوات الكتابة والرسم');
  /* tools, zoom and full page sit in the reader's top bar beside the bookmark (owner, 11 Nov 2026 evening), not floating on the page.
     The tools open in a ring under their button; while the page is full (bars hidden) one small button on the page brings the bars back. */
  var bar=document.querySelector('.app>.bar'),bm=bar.querySelector('.rbm'),z=$('zoomBtn'),fb=$('v2full');
  z.className='ib rtl';z.setAttribute('aria-label','حجم الصفحة');z.title='حجم الصفحة';fb.className='ib rtl';sh.className='ib rtl rtools';
  var pn=$('pnum');pn.className='pnum rpg';pn.title='رقم الصفحة';
  [pn,sh,z,fb].forEach(function(x){bar.insertBefore(x,bm)});
  var fx=document.createElement('button');fx.type='button';fx.id='v2fx';fx.setAttribute('aria-label','إظهار الأشرطة');fx.title='إظهار الأشرطة';
  fx.innerHTML='<svg class="v2ic" viewBox="0 0 24 24"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';fx.onclick=function(){fb.click()};$('reader').appendChild(fx);
  function place(){var r=sh.getBoundingClientRect();rb.style.left=(r.left+r.width/2)+'px';rb.style.top=(r.top+r.height/2)+'px'}
  sh.addEventListener('click',place,true);window.addEventListener('resize',function(){if(rb.classList.contains('fan'))place()});
  [['inkBtn',150,205],['mkBtn',150,230],['txtBtn',150,255],['upBtn',150,280]].forEach(function(p,i){at($(p[0]),p[1],p[2],i)});at(rb.querySelector('.urw'),80,240,4)
})();

/* ----- the device Back button moves back inside the app ----- */
function backOne(){var w=$('v2wel');if(w&&!w.hidden)return false;
  if(!FNB.hidden){FN=null;FNB.hidden=true;return true}if(!$('hlbar').hidden){try{getSelection().removeAllRanges()}catch(e){}hideBar();return true}
  var ids=['penFly','v2tsheet','nsheet','bmMenu'],i,el;for(i=0;i<ids.length;i++){el=$(ids[i]);if(el&&!el.hidden){if(ids[i]==='penFly')penFly(false);else el.hidden=true;return true}}
  el=[].filter.call(document.querySelectorAll('.sheet,.nbox,.itx'),function(x){return !x.hidden&&x.offsetParent!==null})[0];
  if(el){var c=el.querySelector('[data-a="close"],[data-no]');if(c)c.click();else el.hidden=true;return true}
  var rb=$('rbar');if(rb&&rb.classList.contains('fan')){$('rbShow').click();return true}
  if(CURV==='reader'){$('backBtn').click();return true}
  var v=$(CURV),bk=v&&v.querySelector('.v2bk');if(bk){bk.click();return true}
  if(CURV!=='v2home'){var t=tabOf(CURV);go(t!==CURV?t:'v2home');return true}return false}
try{history.replaceState({obs:0},'');history.pushState({obs:1},'');
  window.addEventListener('popstate',function(){var ok=false;try{ok=backOne()}catch(e){}if(ok)history.pushState({obs:1},'')})}catch(e){}
/* Home is the first button of the reader's bottom bar (owner, 11 Nov 2026 evening) */
(function(){var h=document.createElement('button');h.type='button';h.id='rnHm';h.innerHTML=I('home')+'<span>الرئيسية</span>';h.onclick=function(){go('v2home')};var n=$('v2rnav');n.insertBefore(h,n.firstChild)})();

/* Student Master Review platform (owner, 11 Nov 2026): the book's real progress, sent to the platform's Progress page when the book runs inside it */
window.__smrStats=function(){var r={pages:{total:0,read:0,mastered:0},q:{total:QS.length,answered:0,correct:0,wrong:0},cards:{total:0,known:0},topics:{total:TOPICS.length,done:0},streak:0,ch:[]};
  TOPICS.forEach(function(t){var a=npg(t.id),b=tRead(t.id);r.pages.total+=a;r.pages.read+=b;r.pages.mastered+=tMast(t.id);if(a&&b>=a)r.topics.done++});
  deckIds.forEach(function(id){r.cards.total+=DECKS[id].cards.length;r.cards.known+=deckKnown(id)});
  QS.forEach(function(q){var x=QST[q.id];if(x&&(x.n||x.a)){r.q.answered++;if(x.w)r.q.wrong++;else r.q.correct++}});
  try{r.streak=streak()}catch(e){}
  META.chapters.forEach(function(c){var x=chStat(c),m=0;x.ts.forEach(function(t){m+=tMast(t.id)});r.ch.push({n:c.n,name:c.name,read:x.nr,mastered:m,total:x.np})});return r};
/* after the greeting, a device that is not subscribed chooses how to open the book (owner, 11 Nov 2026): the full subscription,
   the one-hour trial (only while it is unused) or the free version; a subscribed device or a running trial goes straight in */
(function(){var go=$('v2welGo');if(!go)return;
  function L(ar,en){return typeof LANG!=='undefined'&&LANG==='en'?en:ar}
  function due(){var a=access();return (a==='free'||a==='expired'||a==='ended')&&!(REQ&&REQ.status==='pending')&&!(a==='free'&&sp('code'))}   // a device that came with its subscription (owner, 12 Nov 2026: one app) opens by itself after the status check
  function chooser(){if($('v2chz'))return;var fr=LIC&&LIC.fresh&&LIC.fresh(),d=document.createElement('div');d.className='sheet v2chz';d.id='v2chz';
    d.innerHTML='<div class="in" role="dialog" aria-modal="true" aria-labelledby="chzT" lang="'+(L('ar','en'))+'" dir="'+L('rtl','ltr')+'"><h3 id="chzT">'+L('مرحبًا بك في الكتاب','Welcome to the book')+'</h3><p class="chzl">'+L('اختر طريقة فتح الكتاب:','Choose how to open the book:')+'</p>'+
      '<button type="button" class="v2c chzb pd" data-c="sub">'+I('crown')+'<span><b>'+L('الاشتراك في النسخة الكاملة','Subscribe to the full book')+'</b><small>'+L('الكتاب كله مع البطاقات وبنك الأسئلة','The whole book with flashcards and the question bank')+'</small></span></button>'+
      (fr?'<button type="button" class="v2c chzb tr" data-c="trial">'+I('clock')+'<span><b>'+L('النسخة التجريبية لمدة ساعة','One-hour trial')+'</b><small>'+L('الكتاب كله مفتوح ساعة كاملة، مرة واحدة','The whole book open for one hour, once')+'</small></span></button>':'')+
      '<button type="button" class="v2c chzb fr" data-c="free">'+I('book')+'<span><b>'+L('متابعة بالنسخة المجانية','Continue with the free version')+'</b><small>'+L('الموضوع الأول من كل فصل','The first topic of every chapter')+'</small></span></button>'+
      '<p class="mu" id="chzMsg" role="status"></p></div>';
    document.body.appendChild(d);
    d.addEventListener('click',function(e){var b=e.target.closest('[data-c]');if(!b)return;var c=b.dataset.c;
      if(c==='free'){d.remove();return}
      if(c==='sub'){d.remove();ACT.sub();return}
      if(c==='trial'&&LIC){b.disabled=true;LIC.startTrial(function(m){b.disabled=false;var x=$('chzMsg');if(x)x.textContent=m})}})}
  go.addEventListener('click',function(){if(due())setTimeout(chooser,1200)})})();
