/* ---------- search (owner, 11 Nov 2026): one box for the whole app. Under it the student chooses where to search (everything, topics, the
   book's pages, flashcards, questions, the app's own places) and which chapter. Matching is by words, not by the exact phrase: every word
   typed must be found, in any order; case, hyphens, dashes and Arabic letter forms do not matter; a match in a topic's name comes first. ---------- */
var SSC=sp('ssc')||'all',SCH2=0;
function sn(s){return String(s||'').toLowerCase().replace(/[ً-ْـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/[‐-―\-_/'’`.,;:()\[\]"“”]+/g,' ').replace(/\s+/g,' ').trim()}
var SPLACES=[['الفصول','chapters topics contents فهرس محتويات','v:v2chapters','book'],['بنك الأسئلة','questions question bank qbank mcq test exam اختبار امتحان اسئله','v:qbank-v','q'],['البطاقات','flashcards cards بطاقات كروت مراجعه','a:allcards','layers'],
 ['بطاقات اليوم','today daily cards streak سلسله','a:cards','layers'],['المراجعة السريعة','rapid review recap ملخص','a:rr','bolt'],['أدوية التوليد','drugs doses pharmacology ادويه جرعات','a:dr','pill'],['السريري OSCE','osce clinical history examination stations محطات فحص','a:osce','steth'],
 ['الفيديو','videos video lectures فيديو','v:v2lect','play'],['المحاضرات','lectures slides lecture slides شرائح سلايدات محاضره','v:v2slides','slides'],['ملاحظاتي','notes highlights my notes تظليل ملاحظه','a:notes','pen'],['المصادر المحفوظة','saved bookmarks محفوظات علامه','v:v2saved','bm'],
 ['الاشتراك','subscription subscribe plans payment price trial bankak اشتراك دفع سعر تجربه خطه تفعيل','a:sub','crown'],['الملف الشخصي','profile name photo user number اسم صوره','v:v2profile','user'],['المظهر واللون واللغة','appearance theme colour color language night dark day arabic english لون ليلي لغه مظهر','v:v2settings','palette'],
 ['الإشعارات','notifications bell اشعار','v:v2notif','bell'],['دليل الاستخدام','user manual guide how to use شرح طريقه','v:v2help','book'],['المساعدة','help contact whatsapp telegram call phone support مساعده تواصل واتساب','v:v2contact','help'],
 ['عن الكتاب','about authors reviewers references edition copyright مؤلف مراجع حقوق','v:v2about','info'],['التنزيلات','downloads offline تنزيل','v:v2dl','dl'],['تقدّمي','progress statistics تقدم','a:prog','bars'],['الإعدادات','settings اعدادات','v:v2settings','gear']];
var STXT=null,SCARD=null,SQ=null;
function sIndex(){if(typeof textReady==='function')textReady();if(STXT&&STXT.length===TEXT.length)return;STXT=TEXT.map(sn);SCARD=[];deckIds.forEach(function(id){DECKS[id].cards.forEach(function(c){SCARD.push({id:id,c:c,n:sn(c[1]+' '+c[2])})})});
  SQ=QS.map(function(q){return {q:q,n:sn((q.stem||'')+' '+(q.q||'')+' '+(q.theme||''))}})}
function sHit(n,tk){for(var i=0;i<tk.length;i++)if(n.indexOf(tk[i])<0)return false;return true}
function sMark(raw,tk,len){var low=raw.toLowerCase(),k=-1,w='';tk.forEach(function(t){var p=low.indexOf(t);if(p>=0&&(k<0||p<k)){k=p;w=t}});if(k<0)return X(raw.slice(0,len||140))+(raw.length>(len||140)?'…':'');
  var a=Math.max(0,k-50);return (a?'…':'')+X(raw.slice(a,k))+'<mark>'+X(raw.slice(k,k+w.length))+'</mark>'+X(raw.slice(k+w.length,k+w.length+90))+'…'}
function sScopes(){var S=[['all','الكل'],['topics','المواضيع'],['pages','صفحات الكتاب'],['cards','البطاقات'],['qs','الأسئلة'],['app','التطبيق']];
  return '<div class="ssc" lang="ar">'+S.map(function(s){return '<button type="button" class="chip'+(SSC===s[0]?' on':'')+'" data-ssc="'+s[0]+'">'+s[1]+'</button>'}).join('')+
   '<select id="sChSel" aria-label="الفصل"><option value="0">كل الفصول</option>'+META.chapters.map(function(c){return '<option value="'+c.n+'"'+(SCH2===c.n?' selected':'')+'>Chapter '+c.n+' · '+X(c.name)+'</option>'}).join('')+'</select></div>'}
function sPlace(p){return '<button type="button" class="v2c sres" data-go="'+p[2]+'"><span class="ii">'+I(p[3]||'chev')+'</span><span><b lang="ar">'+p[0]+'</b></span>'+I('chev')+'</button>'}
runSearch=function(){var raw=$('q').value.trim(),out=$('results'),tk=sn(raw).split(' ').filter(function(x){return x.length>1||/\d/.test(x)}),h=sScopes();
  if(!tk.length){out.innerHTML=h+'<p class="shd" lang="ar">أماكن في التطبيق</p><div class="sgr">'+SPLACES.slice(0,12).map(sPlace).join('')+'</div>';return}
  sIndex();var on=function(k){return SSC==='all'||SSC===k},inCh=function(ch){return !SCH2||ch===SCH2},n=0,sec=function(t,c,body){n+=c;return c?'<p class="shd" lang="ar">'+t+' <small>'+c+'</small></p>'+body:''};
  if(on('topics')){var T=TOPICS.filter(function(t){return inCh(t.ch)&&sHit(sn(t.no+' '+t.title+' '+(t.sub||'')+' '+chap(t.ch).name),tk)}).sort(function(a,b){return (sHit(sn(b.title),tk)?1:0)-(sHit(sn(a.title),tk)?1:0)});
    h+=sec('المواضيع',T.length,'<div class="sgr">'+T.slice(0,20).map(function(t){return '<button type="button" class="v2c sres" data-topic="'+t.id+'"><span class="ii">'+I(locked(t.id)?'lock':'book')+'</span><span><b>'+t.no+' '+X(t.title.charAt(0).toUpperCase()+t.title.slice(1))+'</b><small>Chapter '+t.ch+' · '+X(chap(t.ch).name)+'</small></span>'+I('chev')+'</button>'}).join('')+'</div>')}
  if(on('app')&&!SCH2){var P=SPLACES.filter(function(p){return sHit(sn(p[0]+' '+p[1]),tk)});h+=sec('أماكن في التطبيق',P.length,'<div class="sgr">'+P.map(sPlace).join('')+'</div>')}
  if(on('pages')){var H=[];STXT.forEach(function(t,i){if(!sHit(t,tk))return;var p=PAGES[i],tp=p.t?TOPICS.filter(function(x){return x.id===p.t})[0]:null;if(SCH2&&(!tp||tp.ch!==SCH2))return;
      var c=0,k=t.indexOf(tk[0]);while(k>=0&&c<50){c++;k=t.indexOf(tk[0],k+1)}H.push({i:i,c:c+(sn(p.label).indexOf(tk[0])>=0?100:0)+(t.indexOf(tk.join(' '))>=0?40:0)})});H.sort(function(a,b){return b.c-a.c});
    h+=sec('صفحات الكتاب',H.length,'<div class="res">'+H.slice(0,40).map(function(x){return '<button class="ri" type="button" data-i="'+x.i+'" data-w="'+X(tk[0])+'"><span class="pn">p '+(PAGES[x.i].bn||'✎')+'</span><span><b>'+X(PAGES[x.i].label)+'</b><span>'+sMark(TEXT[x.i],tk)+'</span></span></button>'}).join('')+'</div>')}
  if(on('cards')){var C=SCARD.filter(function(x){return inCh(DCH[x.id])&&sHit(x.n,tk)});
    h+=sec('البطاقات',C.length,'<div class="res">'+C.slice(0,30).map(function(x){return '<button class="ri sc" type="button"><span class="pn">'+X(DECKS[x.id].short)+'</span><span><b>'+sMark(x.c[1],tk,200)+'</b><span class="an">'+X(x.c[2])+'</span></span></button>'}).join('')+'</div>')}
  if(on('qs')){var Q=SQ.filter(function(x){return inCh(x.q.ch)&&sHit(x.n,tk)});
    h+=sec('الأسئلة',Q.length,'<div class="res">'+Q.slice(0,30).map(function(x){var t=TOPICS.filter(function(y){return y.id===x.q.topic})[0];return '<button class="ri" type="button" data-qid="'+X(x.q.id)+'"><span class="pn">'+(t?t.no:'Q')+'</span><span><b>'+sMark((x.q.stem||x.q.q||''),tk,200)+'</b><span>'+X(x.q.q||x.q.lead||'')+'</span></span></button>'}).join('')+'</div>')}
  out.innerHTML=h+(n?'':'<p class="empty" lang="ar">لا توجد نتائج. جرّب كلمة أقصر، أو غيّر مكان البحث.</p>')};
$('q').addEventListener('input',function(){runSearch()});
$('results').onclick=function(e){var b=e.target.closest('button');if(!b)return;
  if(b.dataset.ssc){SSC=b.dataset.ssc;sp('ssc',SSC);runSearch();return}
  if(b.dataset.topic){var t=TOPICS.filter(function(x){return x.id===b.dataset.topic})[0];if(t)openTopic(t);return}
  if(b.dataset.go){var g=b.dataset.go.split(':');if(g[0]==='v')go(g[1]);else if(ACT[g[1]])ACT[g[1]](b);return}
  if(b.dataset.qid){CUR={ids:[b.dataset.qid],ans:{},sub:{},mode:'tutor',i:0,start:Date.now(),lim:75};saveQ();go('qbank-v');return}
  if(b.classList.contains('sc')){b.classList.toggle('open');return}
  if(b.dataset.i){var i=+b.dataset.i;goIdx(i);try{markIn(i,b.dataset.w||$('q').value.trim())}catch(x){}}};
$('results').addEventListener('change',function(e){if(e.target.id==='sChSel'){SCH2=+e.target.value;runSearch()}});
runSearch();
