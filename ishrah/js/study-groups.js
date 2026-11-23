/* Authenticated, section-based study group chats. Reads intentionally bypass the offline page/data cache. */
(function () {
  'use strict';
  var A = IS.A, esc = IS.esc, ic = IS.ic;
  var emojis = ['👍','❤️','😂','🎉','🙏','👀'];
  var fileTypes = ['image/jpeg','image/png','image/webp','application/pdf','audio/webm','audio/ogg','audio/mp4','audio/mpeg'];
  var uuid = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;
  var active;

  function t(ar,en) { return esc(A(ar,en)); }
  function button(action,label,icon,data,solid) {
    return '<button type="button" class="btn sm ' + (solid ? 'pri' : 'ghost') + '" data-act="study-' + action + '"' +
      Object.keys(data || {}).map(function (key) { return ' data-' + key + '="' + esc(data[key]) + '"'; }).join('') +
      '>' + (icon ? ic(icon) : '') + esc(label) + '</button>';
  }
  function areaTitle(spec,section) {
    return [(IS.spec(spec) || {}).en,(IS.cat(section) || {}).en].filter(Boolean).join(' · ');
  }
  function plainCount(value) { return Number(value || 0).toLocaleString('en-US'); }
  function admin(role) { return role === 'owner' || role === 'admin'; }
  function errorText(error) {
    var messages = {
      study_unavailable: ['المجموعة أو الرسالة غير متاحة، أو انتهت صلاحية الدعوة.', 'The group, message or invite is unavailable.'],
      study_forbidden: ['هذا الإجراء غير متاح لحسابك.', 'Your account cannot perform this action.'],
      study_join_first: ['انضم إلى المجموعة أولًا.', 'Join the group first.'],
      study_read_only: ['الإرسال متاح لمشرفي المجموعة.', 'Only group admins can send messages.'],
      study_transfer_first: ['انقل ملكية المجموعة قبل المغادرة.', 'Transfer ownership before leaving.'],
      study_invalid_poll: ['أدخل سؤالًا وخيارين إلى ستة خيارات مختلفة.', 'Enter a question and two to six different options.'],
      study_contact: ['احذف معلومات التواصل الخارجية وحاول مجددًا.', 'Remove external contact details and try again.'],
      study_empty: ['اكتب رسالة أو أرفق ملفًا.', 'Write a message or attach a file.'],
      study_invalid_attachment: ['تعذّر إرفاق هذا الملف.', 'This attachment could not be added.']
    };
    var match = messages[error && error.message];
    return match ? A(match[0],match[1]) : A('تعذّر إتمام الطلب. حاول مرة أخرى.', 'The request could not be completed. Try again.');
  }
  async function rpc(method,op,id,data) {
    if (!DB.live) throw new Error('study_unavailable');
    var res = await DB.sb.rpc('ish_study_' + method, { p_op: op, p_group: id || null, p_data: data || {} });
    if (res.error) throw new Error(res.error.message);
    return res.data;
  }
  function read(op,id,data) { return rpc('read',op,id,data); }
  function act(op,id,data) { return rpc('action',op,id,data); }
  async function perform(op,id,data) {
    try { return await act(op,id,data); } catch (error) { IS.toast(errorText(error),true); return null; }
  }
  function failure(error) {
    return IS.empty('group',errorText(error),'','<a class="btn ghost" href="#study-groups">' + t('مجموعات الدراسة','Study groups') + '</a>');
  }
  function scope() { var section=IS.mySection(); return { spec:IS.SPEC,section:section ? section.id : '' }; }
  function intro() {
    return IS.banner(IS.T('مجموعات الدراسة','Study groups'),t('محادثات ومجموعات تعلّم داخل أقسام الأكاديمية.','Group conversations inside the academy’s study sections.'),'group','');
  }
  function settingsFields(g) {
    return '<label class="fl"><span>' + t('اسم المجموعة','Group name') + '</span><input name="title" required maxlength="80" dir="auto" value="' + esc(g.title || '') + '"></label>' +
      '<label class="fl"><span>' + t('الوصف','Description') + '</span><textarea name="description" maxlength="500" rows="3" dir="auto">' + esc(g.description || '') + '</textarea></label>' +
      '<label class="fl"><span>' + t('الخصوصية','Privacy') + '</span><select name="visibility"><option value="private">' + t('خاصة برابط دعوة','Private · invite link') +
      '</option><option value="open"' + (g.visibility==='open' ? ' selected' : '') + '>' + t('مفتوحة في القسم','Open in this section') + '</option></select></label>' +
      '<label class="chk"><input type="checkbox" name="admin_only" value="true"' + (g.admin_only ? ' checked' : '') + '><span>' +
      t('المشرفون فقط يرسلون الرسائل','Only admins can send messages') + '</span></label>';
  }
  IS.page('study-groups',async function () {
    if (!DB.live) return intro() + IS.empty('group',A('تتوفّر المجموعات في الأكاديمية المتصلة.','Groups are available on the connected academy.'));
    try {
      var groups=await read('list',null,scope());
      var cards=groups.map(function (g) {
        return '<a class="box study-group-card" href="#study-group/' + g.id + '"><span class="study-group-icon">' + ic(g.visibility==='private' ? 'lock' : 'group') +
          '</span><div><h2 dir="auto">' + esc(g.title) + '</h2><small>' + esc(areaTitle(g.spec,g.section)) + ' · ' + IS.N(g.members) + ' ' +
          t('أعضاء','members') + '</small>' + (g.description ? '<p dir="auto">' + esc(g.description) + '</p>' : '') + '</div>' +
          (g.unread ? '<span class="chip">' + t('جديد','Unread') + '</span>' : '') + '</a>';
      }).join('');
      return intro() + '<div class="row study-tools">' + (IS.mySection() ? button('new',A('مجموعة جديدة','New group'),'plus',null,true) :
        '<a class="btn pri" href="#pick-section">' + t('اختر قسمًا لإنشاء مجموعة','Choose a section to create a group') + '</a>') +
        '<a class="btn ghost sm" href="#community">' + t('المجتمع','Community') + '</a></div>' +
        (cards ? '<div class="study-group-list">' + cards + '</div>' : IS.empty('group',A('لا توجد مجموعات هنا بعد','No groups here yet'),A('أنشئ مجموعة أو افتح رابط دعوة.','Create a group or open an invite link.')));
    } catch (error) { return intro() + failure(error); }
  },{auth:true});
  IS.ACT['study-new']=function () {
    IS.sheet(t('مجموعة جديدة','New group'),'<form class="form" data-form="study-settings">' + settingsFields({}) + '<button class="btn pri">' + t('إنشاء المجموعة','Create group') + '</button></form>');
  };
  IS.SUB['study-settings']=async function (data) {
    var id=data.id;
    var saved=await perform(id ? 'settings' : 'create',id,Object.assign(scope(),data));
    if (!saved) return;
    IS.closeSheet();
    if (id) IS.refresh(); else IS.go('study-group/' + saved.id);
  };

  IS.page('study-invite',async function (token) {
    if (!uuid.test(token)) return failure(new Error('study_unavailable'));
    return intro() + '<section class="box"><h2>' + t('دعوة إلى مجموعة دراسة','Study group invitation') + '</h2>' +
      button('join',A('قبول الدعوة والانضمام','Accept invitation and join'),'group',{token:token},true) +
      '</section>';
  },{auth:true});
  IS.ACT['study-join']=async function (b) {
    var joined=await perform(b.dataset.token ? 'invite' : 'join',b.dataset.id,{token:b.dataset.token});
    if (joined) IS.go('study-group/' + joined.id);
  };

  function chatHeader(g) {
    return '<header class="study-chat-head"><a href="#study-groups" class="study-group-icon" aria-label="' + t('مجموعات الدراسة','Study groups') + '">' + ic('group') +
      '</a><div><h1 tabindex="-1" dir="auto">' + esc(g.title) + '</h1><small>' + esc(areaTitle(g.spec,g.section)) + '</small></div>' +
      (g.role ? button('info',A('معلومات المجموعة','Group info'),'info',{id:g.id}) : '') + '</header>';
  }
  function composer() {
    return '<form class="study-compose" data-form="study-send"><div class="study-reply" hidden></div><label class="study-attach">' + ic('file') +
      '<input type="file" data-fui aria-label="' + t('إرفاق ملف','Attach file') + '" accept="' + fileTypes.join(',') + '"><span>' + t('إرفاق','Attach') + '</span></label>' +
      (window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia ? button('record',A('تسجيل صوت','Voice note'),'mic') : '') +
      '<textarea name="body" maxlength="4000" rows="2" dir="auto" aria-label="' + t('رسالة','Message') + '" placeholder="' + t('اكتب رسالة…','Write a message…') + '"></textarea>' +
      '<button class="btn pri" type="submit">' + ic('send') + t('إرسال','Send') + '</button><small class="study-file-label" hidden></small></form>';
  }
  IS.page('study-group',async function (id) {
    if (!uuid.test(id)) return failure(new Error('study_unavailable'));
    try {
      var g=await read('group',id);
      if (!g.role) return '<section class="box study-chat">' + chatHeader(g) + '<p dir="auto">' + esc(g.description) + '</p>' +
        button('join',A('انضم إلى المجموعة','Join group'),'group',{id:id},true) + '</section>';
      var initial=await read('messages',id);
      IS.after=function (main) { mount(main.querySelector('.study-chat'),g,initial); };
      return '<section class="box study-chat" data-id="' + id + '">' + chatHeader(g) +
        '<div class="study-chat-tools"><form data-form="study-search"><input type="search" name="q" maxlength="120" placeholder="' +
        t('ابحث في الرسائل','Search messages') + '" aria-label="' + t('ابحث في الرسائل','Search messages') + '"><button class="btn ghost sm">' + ic('search') +
        t('بحث','Search') + '</button></form>' + button('poll',A('استطلاع','Poll'),'chart') + '</div>' +
        '<div class="study-pin" hidden></div><div class="study-chat-status" role="status" hidden></div>' +
        '<div class="study-log" tabindex="0" aria-label="' + t('رسائل المجموعة','Group messages') + '"></div>' +
        '<p class="study-read-only" hidden>' + t('المشرفون فقط يرسلون الرسائل.','Only group admins can send messages.') + '</p>' + composer() + '</section>';
    } catch (error) { return failure(error); }
  },{auth:true});

  function renderMessage(m,state) {
    var mine=m.sender===state.user, ownClass=mine ? ' mine' : '';
    if (m.removed) return '<article class="study-message removed' + ownClass + '" data-mid="' + m.id + '">' + t('حُذفت الرسالة','Message deleted') + '</article>';
    var poll=m.options ? '<div class="study-poll">' + m.options.map(function (option,i) {
      return button('vote',option + ' · ' + plainCount(m.votes[i]),m.my_vote===i+1 ? 'check' : '',{id:m.id,choice:i+1},m.my_vote===i+1);
    }).join('') + '</div>' : '';
    return '<article class="study-message' + ownClass + '" data-mid="' + m.id + '"><header><b dir="auto">' + esc(m.name || A('عضو','Member')) +
      '</b><time datetime="' + esc(m.sent_at) + '">' + esc(new Date(m.sent_at).toLocaleTimeString(IS.lang,{hour:'numeric',minute:'2-digit'})) + '</time>' +
      (m.edited_at ? '<small>' + t('عُدّلت','Edited') + '</small>' : '') + '</header>' +
      (m.reply_to ? '<blockquote dir="auto">' + esc(m.reply_excerpt || A('رد على رسالة','Reply to a message')) + '</blockquote>' : '') +
      (m.body ? '<p dir="auto">' + esc(m.body) + '</p>' : '') + poll +
      (m.attachment ? button('file',m.attachment_name,'file',{id:m.id}) + '<div class="study-attachment" hidden></div>' : '') +
      '<footer>' + m.reactions.map(function (r) { return button('react',r.emoji + ' ' + plainCount(r.n),'',{id:m.id,emoji:r.emoji},r.mine); }).join('') +
      button('message',A('إجراءات','Actions'),'menu',{id:m.id}) + '</footer></article>';
  }
  function stopRecording(state,keep) {
    clearTimeout(state.voiceTimer);
    if (state.recorder && state.recorder.state==='recording') {
      state.keepVoice=keep;
      state.recorder.stop();
    }
  }
  function dispose(state) {
    clearInterval(state.timer);
    document.removeEventListener('visibilitychange',state.visibility);
    stopRecording(state,false);
  }
  function mount(root,g,initial) {
    if (active) dispose(active);
    var state=active={root:root,g:g,user:IS.ME.id,log:root.querySelector('.study-log'),rows:new Map(),term:'',more:initial.messages.length===40,seen:0};
    apply(state,initial,false);
    state.log.scrollTop=state.log.scrollHeight;
    state.log.addEventListener('scroll',function () { markSeen(state); },{passive:true});
    state.root.querySelector('input[type=file]').onchange=function () {
      state.voice=null;
      showFile(state,this.files[0]);
    };
    state.timer=setInterval(function () {
      if (!mounted(state)) dispose(state);
      else if (!document.hidden && !state.term && !state.root.closest('[inert]') && !state.loading) reload(state,{poll:true});
    },5000);
    document.addEventListener('visibilitychange',state.visibility=function () {
      if (mounted(state) && !document.hidden && !state.term) reload(state);
    });
  }
  function mounted(state) { return active===state && state.root.isConnected && IS.ME && IS.ME.id===state.user && document.body.dataset.page==='study-group'; }
  function markSeen(state) {
    if (!mounted(state) || state.term || document.hidden || state.log.scrollHeight-state.log.scrollTop-state.log.clientHeight>50) return;
    var last=Math.max(0,...state.rows.keys());
    if (last<=state.seen || state.marking) return;
    state.marking=true;
    act('seen',state.g.id,{id:last}).then(function () { state.seen=last; }).catch(function () {}).finally(function () { state.marking=false; });
  }
  function apply(state,response,keepPosition) {
    var log=state.log, top=log.scrollTop, stick=log.scrollHeight-top-log.clientHeight<50, oldHeight=log.scrollHeight;
    state.revision=response.revision;
    response.messages.forEach(function (m) { state.rows.set(m.id,m); });
    if (state.g.role!==response.role && admin(state.g.role)) state.g.invite=null;
    state.g.role=response.role;
    state.g.admin_only=response.admin_only;
    var canWrite=!response.admin_only || admin(response.role);
    state.root.querySelector('.study-compose').hidden=!canWrite;
    state.root.querySelector('.study-read-only').hidden=canWrite;
    state.root.querySelector('[data-act="study-poll"]').hidden=!canWrite;
    var pin=state.root.querySelector('.study-pin');
    pin.hidden=!response.pinned;
    if (response.pinned) pin.innerHTML=button('jump',A('مثبّتة · ','Pinned · ') + (response.pin_text || ''),'pin',{id:response.pinned});
    var rows=Array.from(state.rows.values()).sort(function (a,b) { return a.id-b.id; });
    var result=JSON.stringify([rows,state.more]);
    if (result!==state.rendered) {
      state.rendered=result;
      var existing=new Map(Array.from(log.querySelectorAll('.study-message'),function (node) { return [Number(node.dataset.mid),node]; }));
      var wrapper=document.createElement('div');
      if (state.more) wrapper.innerHTML=button('older',A('رسائل أقدم','Older messages'),'up');
      if (!rows.length) wrapper.innerHTML='<p class="study-empty">' + (state.term ? t('لا توجد نتائج.','No matches.') : t('ابدأ المحادثة.','Start the conversation.')) + '</p>';
      rows.forEach(function (m) {
        var node=existing.get(m.id), html=renderMessage(m,state);
        if (node && node.studyHtml===html) wrapper.append(node);
        else {
          var template=document.createElement('template');
          template.innerHTML=html;
          node=template.content.firstElementChild;
          node.studyHtml=html;
          wrapper.append(node);
        }
      });
      log.replaceChildren(...wrapper.childNodes);
      log.scrollTop=keepPosition ? top+log.scrollHeight-oldHeight : stick ? log.scrollHeight : top;
    }
    markSeen(state);
  }
  async function reload(state,opts) {
    opts=opts || {};
    if (!mounted(state)) return;
    if (state.loading) { state.pending=opts; return; }
    state.loading=true;
    var status=state.root.querySelector('.study-chat-status');
    try {
      if (opts.poll) {
        var latest=await read('version',state.g.id);
        if (!mounted(state) || (latest.revision===state.revision && latest.role===state.g.role && latest.admin_only===state.g.admin_only)) return;
      }
      var response=await read('messages',state.g.id,{search:opts.search===undefined?state.term:opts.search,before:opts.before});
      if (!mounted(state)) return;
      if (opts.search!==undefined) { state.term=opts.search; state.rows.clear(); }
      if (!state.term && !opts.before && opts.search===undefined && response.messages.length===40 && state.rows.size &&
          response.messages[0].id>Math.max(...state.rows.keys())) state.rows.clear();
      if (opts.before || opts.search!==undefined || !state.rows.size) state.more=response.messages.length===40;
      apply(state,response,Boolean(opts.before));
      status.hidden=true;
      if (opts.jump) {
        var target=state.log.querySelector('[data-mid="' + opts.jump + '"]');
        if (target) { target.scrollIntoView({block:'center'}); target.classList.add('study-highlight'); }
      }
    } catch (error) {
      if (!mounted(state)) return;
      if (['study_unavailable','study_join_first','study_sign_in'].includes(error.message)) {
        state.root.innerHTML=failure(error);
        dispose(state);
        active=null;
        return;
      }
      status.hidden=false;
      status.textContent=A('تعذّر تحديث الرسائل. ستُعاد المحاولة.','Could not refresh messages. Try searching again or wait for a retry.');
    } finally {
      state.loading=false;
      if (state.pending) { var next=state.pending; state.pending=null; reload(state,next); }
    }
  }
  var oldRoute=IS.onRoute;
  IS.onRoute=function (name,arg,main) {
    if (active && !mounted(active)) { dispose(active); active=null; }
    if (oldRoute) oldRoute(name,arg,main);
  };
  IS.SUB['study-search']=function (data) { if (active) return reload(active,{search:String(data.q || '').trim()}); };
  IS.ACT['study-older']=function () { if (active && active.rows.size) return reload(active,{before:Math.min(...active.rows.keys())}); };
  IS.ACT['study-jump']=async function (b) {
    if (!active) return;
    var state=active, id=Number(b.dataset.id), node=state.log.querySelector('[data-mid="' + id + '"]');
    if (node) { node.scrollIntoView({block:'center'}); node.classList.add('study-highlight'); return; }
    state.root.querySelector('[name=q]').value='';
    return reload(state,{search:'',before:id+1,jump:id});
  };

  async function sendMessage(state,data,form) {
    var result=await perform('send',state.g.id,data);
    if (!result) return false;
    if (!mounted(state)) return true;
    state.root.querySelector('[name=q]').value='';
    if (state.term) await reload(state,{search:''}); else await reload(state);
    state.log.scrollTop=state.log.scrollHeight;
    markSeen(state);
    if (form && form.isConnected) form.reset();
    return true;
  }
  IS.SUB['study-send']=async function (data,form) {
    var state=active;
    if (!state || !mounted(state) || state.sending) return;
    if (state.recorder) return IS.toast(A('أوقف التسجيل أولًا.','Stop the recording first.'),true);
    var file=state.voice || form.querySelector('input[type=file]').files[0];
    if (!String(data.body || '').trim() && !file) return;
    if (file && IS.contactHit && IS.contactHit(file.name)) return IS.toast(errorText(new Error('study_contact')),true);
    if (file && (!fileTypes.includes(file.type) || file.size>12582912)) return IS.toast(A('أرفق صورة أو PDF أو ملفًا صوتيًا حتى 12 ميغابايت.','Attach an image, PDF or audio file up to 12 MB.'),true);
    var fingerprint=JSON.stringify([data.body,state.reply,file && [file.name,file.size,file.lastModified]]);
    if (!state.draft || state.draft.key!==fingerprint) state.draft={key:fingerprint,nonce:crypto.randomUUID()};
    var draft=state.draft;
    state.sending=true;
    try {
      if (file && !draft.uploaded) {
        draft.path=state.g.id + '/' + state.user + '/' + crypto.randomUUID();
        var result=await DB.sb.storage.from('study-group-files').upload(draft.path,file,{contentType:file.type,cacheControl:'0'});
        if (result.error) throw result.error;
        draft.uploaded=true;
      }
      if (await sendMessage(state,{body:data.body,reply:state.reply,nonce:draft.nonce,attachment:draft.path,filename:file && file.name},form)) {
        state.draft=null; state.voice=null; clearReply(state); showFile(state,null);
      }
    } catch (error) { IS.toast(errorText(error),true); }
    finally { state.sending=false; }
  };
  function showFile(state,file) {
    var label=state.root.querySelector('.study-file-label');
    label.hidden=!file;
    label.textContent=file ? file.name : '';
    if (file) label.append(' ',Object.assign(document.createElement('button'),{
      type:'button',className:'btn ghost sm',textContent:A('إزالة المرفق','Remove attachment'),
      onclick:function () {
        state.voice=null;
        state.root.querySelector('input[type=file]').value='';
        showFile(state,null);
      }
    }));
  }
  IS.ACT['study-record']=async function (b) {
    var state=active;
    if (!state || state.sending) return;
    if (state.recorder) return stopRecording(state,true);
    b.disabled=true;
    var stream;
    try {
      stream=await navigator.mediaDevices.getUserMedia({audio:true});
      if (!mounted(state)) { stream.getTracks().forEach(function (track) { track.stop(); }); return; }
      var recorder=new MediaRecorder(stream), chunks=[];
      recorder.ondataavailable=function (event) { if (event.data.size) chunks.push(event.data); };
      recorder.onstop=function () {
        stream.getTracks().forEach(function (track) { track.stop(); });
        state.recorder=null;
        b.textContent=A('تسجيل صوت','Voice note');
        if (!mounted(state) || !state.keepVoice || !chunks.length) return;
        var mime=(recorder.mimeType || chunks[0].type).split(';')[0];
        var ext={'audio/mp4':'m4a','audio/ogg':'ogg','audio/webm':'webm'}[mime];
        if (!ext) return IS.toast(A('صيغة التسجيل غير مدعومة.','This recording format is unsupported.'),true);
        state.voice=new File(chunks,A('رسالة صوتية','Voice note')+'.'+ext,{type:mime});
        state.root.querySelector('input[type=file]').value='';
        showFile(state,state.voice);
      };
      recorder.start(250);
      state.recorder=recorder;
      b.textContent=A('إيقاف التسجيل','Stop recording');
      state.voiceTimer=setTimeout(function () { stopRecording(state,true); },90000);
    } catch (error) {
      if (stream) stream.getTracks().forEach(function (track) { track.stop(); });
      IS.toast(A('تعذّر الوصول إلى الميكروفون.','Could not access the microphone.'),true);
    } finally { b.disabled=false; }
  };
  function clearReply(state) {
    state.reply=null;
    state.root.querySelector('.study-reply').hidden=true;
  }
  IS.ACT['study-cancel-reply']=function () { if (active) clearReply(active); };
  IS.ACT['study-reply']=function (b) {
    if (!active || active.root.querySelector('.study-compose').hidden) return;
    var m=active.rows.get(Number(b.dataset.id));
    if (!m) return;
    IS.closeSheet();
    active.reply=m.id;
    var bar=active.root.querySelector('.study-reply');
    bar.innerHTML='<span dir="auto">' + esc(m.name + ' · ' + (m.body || m.attachment_name || '').slice(0,120)) + '</span>' +
      button('cancel-reply',A('إلغاء','Cancel'),'x');
    bar.hidden=false;
    active.root.querySelector('[name=body]').focus();
  };
  IS.ACT['study-message']=function (b) {
    var state=active, m=state && state.rows.get(Number(b.dataset.id));
    if (!m) return;
    var data={id:m.id}, own=m.sender===state.user, manages=admin(state.g.role);
    IS.sheet(t('إجراءات الرسالة','Message actions'),'<div class="row study-emoji">' + emojis.map(function (emoji) {
      return button('react',emoji,'',{id:m.id,emoji:emoji,sheet:'1'});
    }).join('') + '</div><div class="row study-tools">' +
      ((!state.g.admin_only || manages) ? button('reply',A('رد','Reply'),'chat',data) : '') +
      (own && !m.options ? button('edit',A('تعديل','Edit'),'pen',data) : '') +
      (manages ? button('pin',A('تثبيت أو إلغاء التثبيت','Pin or unpin'),'pin',{id:m.id,sheet:'1'}) : '') +
      (own || manages ? button('delete',A('حذف','Delete'),'trash',{id:m.id,sheet:'1'}) : '') +
      (!own ? button('report',A('إبلاغ','Report'),'flag',data) : '') + '</div>',{nofocus:true});
  };
  for (const action of ['react','vote','delete','pin']) {
    IS.ACT['study-'+action]=async function (b) {
      if (!active) return;
      var state=active;
      if (action==='delete' && !await IS.confirm(A('حذف هذه الرسالة للجميع؟','Delete this message for everyone?'))) return;
      if (await perform(action,state.g.id,{id:b.dataset.id,emoji:b.dataset.emoji,choice:b.dataset.choice})) {
        if (b.dataset.sheet && action!=='delete') IS.closeSheet();
        // Older messages and search results may fall outside the current page of the timeline.
        var id=Number(b.dataset.id);
        await reload(state,state.rows.size && id<Math.max(...state.rows.keys())-39 ? {before:id+1} : {});
      }
    };
  }
  for (const action of ['edit','report']) {
    IS.ACT['study-'+action]=function (b) {
      if (!active) return;
      var message=active.rows.get(Number(b.dataset.id));
      if (!message) return;
      IS.sheet(action==='edit' ? t('تعديل الرسالة','Edit message') : t('إبلاغ عن رسالة','Report message'),
        '<form class="form" data-form="study-message-form"><input type="hidden" name="op" value="' + action +
        '"><input type="hidden" name="id" value="' + message.id + '"><textarea dir="auto" name="body" maxlength="' +
        (action==='edit' ? 4000 : 500) + '" rows="4" aria-label="' + t('النص','Text') + '">' + esc(action==='edit' ? message.body : '') +
        '</textarea><button class="btn pri">' + t('إرسال','Submit') + '</button></form>');
    };
  }
  IS.SUB['study-message-form']=async function (data) {
    if (!active) return;
    var state=active;
    if (await perform(data.op,state.g.id,Object.assign({reason:data.body},data))) {
      IS.closeSheet();
      if (data.op==='report') IS.toast(A('أُرسل البلاغ للمراجعة.','Report sent for review.'));
      else await reload(state,{before:Number(data.id)+1});
    }
  };
  IS.ACT['study-poll']=function () {
    IS.sheet(t('استطلاع جديد','New poll'),'<form class="form" data-form="study-poll"><label class="fl"><span>' + t('السؤال','Question') +
      '</span><input name="body" maxlength="300" required dir="auto"></label><label class="fl"><span>' + t('الخيارات، خيار في كل سطر','Options, one per line') +
      '</span><textarea name="options" required rows="5" maxlength="605" dir="auto"></textarea></label><button class="btn pri">' + t('إرسال الاستطلاع','Send poll') + '</button></form>');
  };
  IS.SUB['study-poll']=async function (data,form) {
    if (!active) return;
    form.studyNonce=form.studyNonce || crypto.randomUUID();
    if (await sendMessage(active,{body:data.body,options:data.options.split('\n').map(function (line) { return line.trim(); }).filter(Boolean),nonce:form.studyNonce})) IS.closeSheet();
  };
  IS.ACT['study-file']=async function (b) {
    var state=active, m=state && state.rows.get(Number(b.dataset.id));
    if (!m || !m.attachment) return;
    try {
      var image=m.attachment_type.startsWith('image/'), audio=m.attachment_type.startsWith('audio/');
      var result=await DB.sb.storage.from('study-group-files').createSignedUrl(m.attachment,60,
        image || audio ? undefined : {download:m.attachment_name});
      if (!mounted(state) || !b.isConnected) return;
      if (result.error) throw result.error;
      var panel=b.parentElement.querySelector('.study-attachment');
      panel.replaceChildren();
      var link=document.createElement('a');
      link.className='btn ghost sm';
      link.href=result.data.signedUrl;
      link.rel='noopener noreferrer';
      link.download=m.attachment_name;
      link.target='_blank';
      link.textContent=A('تنزيل أو فتح الملف','Download or open file');
      if (image || audio) {
        var media=document.createElement(image ? 'img' : 'audio');
        if (image) media.alt=m.attachment_name;
        else media.controls=true;
        media.src=result.data.signedUrl;
        panel.append(media);
      }
      panel.append(link);
      panel.hidden=false;
    } catch (error) { IS.toast(errorText(error),true); }
  };
  IS.ACT['study-info']=async function (b) {
    try {
      var id=b.dataset.id, pair=await Promise.all([read('group',id),read('members',id)]), g=pair[0];
      var members=pair[1].map(function (m) {
        var commands='', change={id:id,user:m.id};
        if (IS.ME.id!==m.id && m.role!=='owner' && (g.role==='owner' || (g.role==='admin' && m.role!=='admin'))) {
          commands+=button('member',m.role==='removed' ? A('إعادة السماح','Restore') : A('إزالة','Remove'),'',
            Object.assign({role:m.role==='removed'?'member':'removed'},change));
          if (g.role==='owner' && m.role!=='removed') commands+=button('member',m.role==='admin' ? A('إلغاء الإشراف','Demote') : A('تعيين مشرف','Promote'),'',
            Object.assign({role:m.role==='admin'?'member':'admin'},change)) + button('member',A('نقل الملكية','Transfer ownership'),'',
            Object.assign({role:'owner'},change));
        }
        return '<li><span dir="auto">' + esc(m.name) + ' <small>' + esc(roleLabel(m.role)) + '</small></span><div class="row">' + commands + '</div></li>';
      }).join('');
      IS.sheet(esc(g.title),'<p dir="auto">' + esc(g.description) + '</p><div class="row study-tools">' + (admin(g.role) ?
        IS.shareButton('study-invite/' + g.invite) + button('rotate',A('تجديد رابط الدعوة','Reset invite link'),'route',{id:id}) +
        button('settings',A('إعدادات المجموعة','Group settings'),'gear',{id:id}) +
        button('reports',A('بلاغات المجموعة','Group reports'),'flag',{id:id}) : '') +
        (g.role!=='owner' ? button('leave',A('مغادرة','Leave group'),'logout',{id:id}) : '') +
        '</div><h3>' + t('الأعضاء','Members') + '</h3><ul class="study-members">' + members + '</ul>',{nofocus:true});
    } catch (error) { IS.toast(errorText(error),true); }
  };
  function roleLabel(role) {
    return {owner:A('المالك','Owner'),admin:A('مشرف','Admin'),member:A('عضو','Member'),removed:A('تمت الإزالة','Removed')}[role];
  }
  IS.ACT['study-settings']=async function (b) {
    var id=b.dataset.id;
    try {
      var g=await read('group',id);
      IS.sheet(t('إعدادات المجموعة','Group settings'),'<form class="form" data-form="study-settings"><input type="hidden" name="id" value="' + id +
        '">' + settingsFields(g) + '<button class="btn pri">' + t('حفظ','Save') + '</button></form>');
    } catch (error) { IS.toast(errorText(error),true); }
  };
  for (const action of ['member','rotate','leave']) {
    IS.ACT['study-'+action]=async function (b) {
      var d=b.dataset;
      if ((d.role==='owner' || d.role==='removed' || action!=='member') &&
          !await IS.confirm(A('تأكيد هذا الإجراء؟','Confirm this action?'))) return;
      var op=action==='member' ? (d.role==='owner' ? 'transfer' : 'role') : action;
      if (!await perform(op,d.id,{user:d.user,role:d.role})) return;
      IS.closeSheet();
      if (action==='leave') IS.go('study-groups');
      else if (action==='rotate') { IS.toast(A('تم تجديد رابط الدعوة القديم.','The old invite link was replaced.')); IS.ACT['study-info'](b); }
      else IS.refresh();
    };
  }
  function reportsList(rows,id) {
    return rows.length ? rows.map(function (r) {
      return '<article class="box"><h3 dir="auto">' + esc(r.title) + '</h3><p dir="auto">' + esc(r.reason) + '</p><blockquote dir="auto">' +
        esc(r.removed ? A('حُذفت الرسالة','Message deleted') : r.body || A('رسالة تحتوي على مرفق','Message with an attachment')) +
        '</blockquote><div class="row">' + (id || IS.can('community','edit') ?
          button('resolve',A('إغلاق البلاغ','Dismiss report'),'check',{id:id || '',report:r.id,op:'dismiss-report'}) +
          (!r.removed ? button('resolve',A('حذف الرسالة','Remove message'),'trash',{id:id || '',report:r.id,op:'remove-reported'}) : '') : '') + '</div></article>';
    }).join('') : IS.empty('shield',A('لا توجد بلاغات مفتوحة','No open reports'));
  }
  IS.ACT['study-reports']=async function (b) {
    try {
      var rows=await read('reports',b.dataset.id);
      IS.sheet(t('بلاغات المجموعة','Group reports'),reportsList(rows,b.dataset.id),{nofocus:true});
    } catch (error) { IS.toast(errorText(error),true); }
  };
  IS.page('control-study-reports',async function () {
    var banner=IS.banner(IS.T('بلاغات مجموعات الدراسة','Study group reports'),'','flag',
      '<a class="btn ghost" href="#control-community">' + t('بلاغات المجتمع','Community reports') + '</a>');
    if (!DB.live) return banner;
    try { return banner + reportsList(await read('reports')); } catch (error) { return banner + failure(error); }
  },{area:'control',perm:'community'});
  IS.ACT['study-resolve']=async function (b) {
    var d=b.dataset;
    if (d.op==='remove-reported' && !await IS.confirm(A('حذف الرسالة المبلّغ عنها؟','Remove the reported message?'))) return;
    if (!await perform(d.op,d.id,{report:d.report})) return;
    if (d.id) IS.ACT['study-reports'](b); else IS.refresh();
  };
})();
