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
  function modeName(channel) { return channel ? A('قناة خاصة','Private channel') : A('مجموعة خاصة','Private group'); }
  function admin(role) { return role === 'owner' || role === 'admin'; }
  function errorText(error) {
    var messages = {
      study_unavailable: ['المجموعة أو الرسالة غير متاحة، أو انتهت صلاحية الدعوة.', 'The group, message or invite is unavailable.'],
      study_forbidden: ['هذا الإجراء غير متاح لحسابك.', 'Your account cannot perform this action.'],
      study_join_first: ['انضم إلى المجموعة أولًا.', 'Join the group first.'],
      study_already_member: ['الحساب موجود بالفعل أو أزيل من المساحة.','This account is already a member or was removed.'],
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
    return IS.banner(IS.T('المجموعات والقنوات','Groups & channels'),
      t('مساحات خاصة للدراسة والنقاش والإعلانات.','Private spaces for study, discussion and announcements.'),'group','');
  }
  function settingsFields(g) {
    var choices=[[false,'group','مجموعة خاصة','Private group','الأعضاء يرسلون الرسائل ويردّون ويتفاعلون.','Members can message, reply and react.'],
      [true,'mega','قناة خاصة','Private channel','المشرفون ينشرون، والمشتركون يقرأون ويتفاعلون.','Admins publish. Subscribers can read and react.']];
    return '<fieldset class="study-modes"><legend>' + t('نوع المساحة','Space type') + '</legend>' +
      choices.map(function (mode) {
        return '<label class="study-mode"><input type="radio" name="mode" value="' + (mode[0] ? 'channel' : 'group') + '"' +
          (mode[0]===Boolean(g.admin_only) ? ' checked' : '') + '>' + ic(mode[1]) + '<span><b>' + t(mode[2],mode[3]) +
          '</b><small>' + t(mode[4],mode[5]) + '</small></span></label>';
      }).join('') + '</fieldset><label class="fl"><span>' + t('الاسم','Name') + '</span><input name="title" required maxlength="80" dir="auto" value="' +
      esc(g.title || '') + '"></label><label class="fl"><span>' + t('الوصف','Description') +
      '</span><textarea name="description" maxlength="500" rows="3" dir="auto">' + esc(g.description || '') + '</textarea></label>';
  }
  function groupCard(g) {
    return '<a class="box study-group-card" href="#study-group/' + g.id + '"><span class="study-group-icon">' + ic(g.admin_only ? 'mega' : 'group') +
      '</span><div><h2 dir="auto">' + esc(g.title) + '</h2><small>' + esc(areaTitle(g.spec,g.section)) + ' · ' + IS.N(g.members) + ' ' +
      (g.admin_only ? t('مشتركون','subscribers') : t('أعضاء','members')) + '</small>' +
      (g.description ? '<p dir="auto">' + esc(g.description) + '</p>' : '') + '</div>' +
      (g.unread ? '<span class="chip">' + t('جديد','Unread') + '</span>' : '') + '</a>';
  }
  function directorySection(groups,channel) {
    var cards=groups.filter(function (g) { return g.admin_only===channel; }).map(groupCard).join('');
    return cards ? '<section class="study-directory"><h2>' + (channel ? t('قنواتي','My channels') : t('مجموعاتي','My groups')) +
      '</h2><div class="study-group-list">' + cards + '</div></section>' : '';
  }
  function invitationInbox(invites) {
    return invites.length ? '<section class="study-directory"><h2>' + t('الدعوات الواردة','Invitations') + '</h2><div class="study-group-list">' +
      invites.map(function (invite) {
        return '<a class="box study-group-card" href="#study-invite/' + invite.token + '"><span class="study-group-icon">' + ic('mail') +
          '</span><div><h2 dir="auto">' + esc(invite.title) + '</h2><small>' + esc(modeName(invite.admin_only)) +
          '</small></div><span class="chip">' + t('عرض الدعوة','View invite') + '</span></a>';
      }).join('') + '</div></section>' : '';
  }
  IS.page('study-groups',async function () {
    if (!DB.live) return intro() + IS.empty('group',A('تتوفّر المجموعات في الأكاديمية المتصلة.','Groups are available on the connected academy.'));
    try {
      var lists=await Promise.all([read('list'),read('inbox')]);
      var groups=lists[0];
      return intro() + '<div class="row study-tools">' + (IS.mySection() ? button('new',A('إنشاء مجموعة أو قناة','Create group or channel'),'plus',null,true) :
        '<a class="btn pri" href="#pick-section">' + t('اختر قسمًا لإنشاء مساحة','Choose a section to create a space') + '</a>') +
        '<a class="btn ghost sm" href="#community">' + t('المجتمع','Community') + '</a></div>' + invitationInbox(lists[1]) +
        directorySection(groups,false) + directorySection(groups,true) +
        (groups.length || lists[1].length ? '' : IS.empty('group',A('لا توجد مجموعات أو قنوات بعد','No groups or channels yet'),
          A('أنشئ مساحة أو افتح رابط دعوة.','Create a private space or open an invitation.')));
    } catch (error) { return intro() + failure(error); }
  },{auth:true});
  IS.ACT['study-new']=function () {
    IS.sheet(t('إنشاء مجموعة أو قناة','Create group or channel'),'<form class="form" data-form="study-settings">' + settingsFields({}) + '<button class="btn pri">' + t('إنشاء','Create') + '</button></form>');
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
    return intro() + '<section class="box"><h2>' + t('دعوة إلى مساحة خاصة','Private space invitation') + '</h2>' +
      button('join',A('قبول الدعوة والانضمام','Accept invitation and join'),'group',{token:token},true) +
      '</section>';
  },{auth:true});
  IS.ACT['study-join']=async function (b) {
    var joined=await perform(b.dataset.token ? 'invite' : 'join',b.dataset.id,{token:b.dataset.token});
    if (joined) IS.go('study-group/' + joined.id);
  };

  function iconButton(action,label,icon,id) {
    return '<button type="button" class="study-icon-button" data-act="study-' + action + '"' +
      (id ? ' data-id="' + esc(id) + '"' : '') + ' aria-label="' + esc(label) + '" title="' + esc(label) + '">' + ic(icon) + '</button>';
  }
  function chatHeader(g) {
    return '<header class="study-chat-head"><a href="#community" class="study-icon-button study-chat-back" aria-label="' +
      t('الرجوع للمجتمع','Back to Community') + '">' + ic('chev') + '</a><span class="study-group-icon">' +
      ic(g.admin_only ? 'mega' : 'group') + '</span><div><h1 tabindex="-1" dir="auto">' + esc(g.title) + '</h1><small>' +
      esc(modeName(g.admin_only)) + ' · ' + IS.N(g.member_count || 0) + ' ' +
      (g.admin_only ? t('مشتركون','subscribers') : t('أعضاء','members')) + '</small></div>' +
      (g.role ? iconButton('info',g.admin_only ? A('معلومات القناة','Channel info') : A('معلومات المجموعة','Group info'),'info',g.id) : '') + '</header>';
  }
  function composer() {
    return '<form class="study-compose" data-form="study-send"><div class="study-reply" hidden></div>' +
      '<div class="study-compose-field"><label class="study-attach study-icon-button" title="' + t('إرفاق ملف','Attach file') + '">' + ic('file') +
      '<input type="file" data-fui aria-label="' + t('إرفاق ملف','Attach file') + '" accept="' + fileTypes.join(',') + '"></label>' +
      '<textarea name="body" maxlength="4000" rows="1" dir="auto" aria-label="' + t('رسالة','Message') + '" placeholder="' + t('اكتب رسالة…','Write a message…') + '"></textarea>' +
      (window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia ? iconButton('record',A('تسجيل صوت','Voice note'),'mic') : '') +
      '</div><button class="study-send btn pri" type="submit" aria-label="' + t('إرسال','Send') + '" title="' + t('إرسال','Send') + '">' +
      ic('send') + '</button><small class="study-file-label" hidden></small></form>';
  }
  IS.page('study-group',async function (id) {
    if (!uuid.test(id)) return failure(new Error('study_unavailable'));
    try {
      var g=await read('group',id);
      if (!g.role) return '<section class="box study-chat">' + chatHeader(g) + '<p dir="auto">' + esc(g.description) + '</p>' +
        button('join',A('انضم إلى المجموعة','Join group'),'group',{id:id},true) + '</section>';
      var initial=await read('messages',id);
      IS.after=function (main) { mount(main.querySelector('.study-chat'),g,initial); };
      return '<div class="study-chat-frame"><section class="study-chat' + (g.admin_only ? ' study-channel' : '') + '" data-id="' + id + '">' + chatHeader(g) +
        '<div class="study-chat-tools"><details class="study-search"><summary aria-label="' + t('ابحث في الرسائل','Search messages') + '">' +
        ic('search') + '<span>' + t('بحث في المحادثة','Search conversation') + '</span></summary><form data-form="study-search"><input type="search" name="q" maxlength="120" placeholder="' +
        t('ابحث في الرسائل','Search messages') + '" aria-label="' + t('ابحث في الرسائل','Search messages') + '"><button class="btn ghost sm">' + ic('search') +
        t('بحث','Search') + '</button></form></details>' + button('poll',A('استطلاع','Poll'),'chart') + '</div>' +
        '<div class="study-pin" hidden></div><div class="study-chat-status" role="status" hidden></div>' +
        '<div class="study-log" tabindex="0" aria-label="' + t('رسائل المجموعة','Group messages') + '"></div>' +
        '<p class="study-read-only" hidden>' + t('هذه قناة بث. ينشر المشرفون، ويمكنك التفاعل والتصويت.','This is a broadcast channel. Admins publish, and you can react and vote.') + '</p>' + composer() + '</section></div>';
    } catch (error) { return failure(error); }
  },{auth:true});

  function showDay(date) {
    var now=new Date(), yesterday=new Date();
    yesterday.setDate(now.getDate()-1);
    if (date.toDateString()===now.toDateString()) return A('اليوم','Today');
    if (date.toDateString()===yesterday.toDateString()) return A('أمس','Yesterday');
    return date.toLocaleDateString(IS.lang,{day:'numeric',month:'long',year:date.getFullYear()===now.getFullYear() ? undefined : 'numeric'});
  }
  function renderMessage(m,state,continued) {
    var mine=m.sender===state.user, ownClass=mine ? ' mine' : '';
    if (m.removed) return '<article class="study-message removed' + ownClass + '" data-mid="' + m.id + '">' + t('حُذفت الرسالة','Message deleted') + '</article>';
    var poll=m.options ? '<div class="study-poll">' + m.options.map(function (option,i) {
      return button('vote',option + ' · ' + plainCount(m.votes[i]),m.my_vote===i+1 ? 'check' : '',{id:m.id,choice:i+1},m.my_vote===i+1);
    }).join('') + '</div>' : '';
    var channel=state.g.admin_only;
    var author=channel && !admin(state.g.role) ? state.g.title : m.name || A('عضو','Member');
    var avatar=channel ? '<span class="study-msg-avatar study-group-icon" aria-hidden="true">' + ic('mega') + '</span>' :
      '<span class="study-msg-avatar" aria-hidden="true"' + (m.sender ? ' data-avatar="' + esc(m.sender) + '"' : '') + '>' +
      (m.name ? IS.av({name:m.name},'xs') : '<span class="av xs">' + ic('user') + '</span>') + '</span>';
    var reactions=m.reactions.map(function (r) { return button('react',r.emoji + ' ' + plainCount(r.n),'',{id:m.id,emoji:r.emoji},r.mine); }).join('');
    return '<article class="study-message' + ownClass + (continued ? ' continued' : '') + '" data-mid="' + m.id + '" aria-label="' +
      esc(author) + '">' + avatar + '<div class="study-bubble"><header><b dir="auto">' + esc(author) + '</b></header>' +
      (m.reply_to ? '<button type="button" class="study-quote" data-act="study-jump" data-id="' + m.reply_to + '" dir="auto">' +
        esc(m.reply_excerpt || A('رد على رسالة','Reply to a message')) + '</button>' : '') +
      (m.body ? '<p dir="auto">' + esc(m.body) + '</p>' : '') + poll +
      (m.attachment ? button('file',m.attachment_name,'file',{id:m.id}) + '<div class="study-attachment" hidden></div>' : '') +
      '<footer><span class="study-message-meta">' + (m.edited_at ? '<small>' + t('عُدّلت','Edited') + '</small>' : '') +
      '<time datetime="' + esc(m.sent_at) + '">' + esc(new Date(m.sent_at).toLocaleTimeString(IS.lang,{hour:'numeric',minute:'2-digit'})) + '</time></span>' +
      iconButton('message',A('إجراءات','Actions'),'menu',m.id) + '</footer>' +
      (reactions ? '<div class="study-reactions">' + reactions + '</div>' : '') + '</div></article>';
  }
  function resizeDraft(field) {
    field.style.height='auto';
    field.style.height=field.scrollHeight + 'px';
  }
  function paintAvatars(state) {
    state.log.querySelectorAll('[data-avatar]').forEach(function (avatar) {
      var photo=state.avatars.get(avatar.dataset.avatar);
      if (!photo || avatar.querySelector('img')) return;
      var url;
      try { url=new URL(photo,location.href); } catch (error) { return; }
      if (!['https:','http:'].includes(url.protocol)) return;
      var image=document.createElement('img');
      image.alt='';
      image.onload=function () { image.classList.add('ready'); };
      image.onerror=function () { image.remove(); };
      image.src=url.href;
      avatar.append(image);
    });
  }
  async function loadAvatars(state) {
    if (state.g.admin_only || state.avatarLoading) return;
    var visible=Array.from(new Set(Array.from(state.log.querySelectorAll('[data-avatar]'),function (el) { return el.dataset.avatar; })));
    var missing=visible.filter(function (id) { return !state.avatars.has(id); }).slice(-60);
    if (!missing.length) return;
    state.avatarLoading=true;
    try {
      var response=await DB.sb.rpc('ish_study_avatars',{p_group:state.g.id,p_users:missing});
      if (!response.error && mounted(state)) {
        missing.forEach(function (id) { state.avatars.set(id,(response.data || {})[id] || ''); });
        paintAvatars(state);
      }
    } finally {
      state.avatarLoading=false;
    }
  }
  function stopRecording(state,keep) {
    clearTimeout(state.voiceTimer);
    if (state.recorder && state.recorder.state==='recording') {
      state.keepVoice=keep;
      state.recorder.stop();
    }
  }
  function fitChat(state) {
    var frame=state.root.closest('.mrx'), nav=frame && frame.querySelector('.mh-nav');
    var navHeight=nav && nav.getClientRects().length ? nav.getBoundingClientRect().height : 0;
    var scale=parseFloat(getComputedStyle(document.getElementById('main')).zoom) || 1;
    var top=state.root.getBoundingClientRect().top + window.scrollY;
    var available=window.innerHeight-top-navHeight-14;
    state.root.style.setProperty('--chat-height',Math.floor(available/scale)+'px');
  }
  function dispose(state) {
    clearInterval(state.timer);
    window.removeEventListener('resize',state.resize);
    if (state.fitObserver) state.fitObserver.disconnect();
    document.removeEventListener('visibilitychange',state.visibility);
    stopRecording(state,false);
  }
  function bubbleGestures(state) {
    var start=null, hold;
    function cancel() { clearTimeout(hold); start=null; }
    state.log.addEventListener('pointerdown',function (e) {
      var bubble=e.target.closest('.study-bubble');
      if (e.pointerType!=='touch' || !bubble || e.target.closest('button,a,audio,input')) return;
      start={x:e.clientX,y:e.clientY,id:bubble.closest('[data-mid]').dataset.mid,pointer:e.pointerId};
      hold=setTimeout(function () {
        if (start && mounted(state)) IS.ACT['study-message']({dataset:{id:start.id}});
        cancel();
      },580);
    });
    state.log.addEventListener('pointermove',function (e) {
      if (!start || start.pointer!==e.pointerId) return;
      if (Math.abs(e.clientX-start.x)>9 || Math.abs(e.clientY-start.y)>9) clearTimeout(hold);
      if (Math.abs(e.clientY-start.y)>25) cancel();
    });
    state.log.addEventListener('pointerup',function (e) {
      if (start && start.pointer===e.pointerId && !state.g.admin_only &&
          (e.clientX-start.x)*(document.dir==='rtl' ? -1 : 1)>56 && Math.abs(e.clientY-start.y)<25) {
        IS.ACT['study-reply']({dataset:{id:start.id}});
      }
      cancel();
    });
    state.log.addEventListener('pointercancel',cancel);
  }
  function mount(root,g,initial) {
    if (active) dispose(active);
    var state=active={root:root,g:g,user:IS.ME.id,log:root.querySelector('.study-log'),rows:new Map(),avatars:new Map(),term:'',more:initial.messages.length===40,seen:0};
    state.resize=function () { fitChat(state); };
    fitChat(state);
    window.addEventListener('resize',state.resize);
    if (window.ResizeObserver) {
      state.fitObserver=new ResizeObserver(state.resize);
      var frame=state.root.closest('.mrx');
      if (frame) frame.querySelectorAll('.mh-top,.mh-nav').forEach(function (el) { state.fitObserver.observe(el); });
    }
    bubbleGestures(state);
    apply(state,initial,false);
    state.log.scrollTop=state.log.scrollHeight;
    root.querySelector('.study-compose textarea').addEventListener('input',function () {
      var atEnd=state.log.scrollHeight-state.log.scrollTop-state.log.clientHeight<50;
      resizeDraft(this);
      if (atEnd) state.log.scrollTop=state.log.scrollHeight;
    });
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
    var changeHeader=state.g.admin_only!==response.admin_only || state.g.member_count!==response.member_count;
    if (state.g.role!==response.role && admin(state.g.role)) state.g.invite=null;
    state.g.role=response.role;
    state.g.admin_only=response.admin_only;
    state.g.member_count=response.member_count;
    if (changeHeader) {
      state.root.classList.toggle('study-channel',response.admin_only);
      state.root.querySelector('.study-chat-head').outerHTML=chatHeader(state.g);
    }
    var canWrite=!response.admin_only || admin(response.role);
    state.root.querySelector('.study-compose').hidden=!canWrite;
    state.root.querySelector('.study-read-only').hidden=canWrite;
    state.root.querySelector('[data-act="study-poll"]').hidden=!canWrite;
    var pin=state.root.querySelector('.study-pin');
    pin.hidden=!response.pinned;
    if (response.pinned) pin.innerHTML=button('jump',A('مثبّتة · ','Pinned · ') + (response.pin_text || ''),'pin',{id:response.pinned});
    var rows=Array.from(state.rows.values()).sort(function (a,b) { return a.id-b.id; });
    var result=JSON.stringify([rows,state.more,state.g.role,state.g.admin_only]);
    if (result!==state.rendered) {
      state.rendered=result;
      var existing=new Map(Array.from(log.querySelectorAll('.study-message'),function (node) { return [Number(node.dataset.mid),node]; }));
      var wrapper=document.createElement('div');
      if (state.more) wrapper.innerHTML=button('older',A('رسائل أقدم','Older messages'),'up');
      if (!rows.length) wrapper.innerHTML='<p class="study-empty">' + (state.term ? t('لا توجد نتائج.','No matches.') : t('ابدأ المحادثة.','Start the conversation.')) + '</p>';
      var previous=null, focused=document.activeElement;
      rows.forEach(function (m) {
        var date=new Date(m.sent_at), previousDate=previous && new Date(previous.sent_at);
        var sameDay=previousDate && date.toDateString()===previousDate.toDateString();
        if (!sameDay) {
          var divider=document.createElement('p');
          divider.className='study-date';
          divider.textContent=showDay(date);
          wrapper.append(divider);
        }
        var continued=sameDay && !state.g.admin_only && !m.removed && !previous.removed && m.sender && m.sender===previous.sender &&
          date-previousDate<5*60*1000;
        previous=m;
        var node=existing.get(m.id), html=renderMessage(m,state,continued);
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
      if (focused && log.contains(focused)) focused.focus({preventScroll:true});
      paintAvatars(state);
      loadAvatars(state).catch(function () {});
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
        if (!mounted(state) || (latest.revision===state.revision && latest.role===state.g.role && latest.admin_only===state.g.admin_only && latest.member_count===state.g.member_count)) return;
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
    if (form && form.isConnected) {
      form.reset();
      resizeDraft(form.querySelector('textarea'));
    }
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
        b.setAttribute('aria-label',A('تسجيل صوت','Voice note'));
        b.title=A('تسجيل صوت','Voice note');
        b.removeAttribute('data-recording');
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
      b.setAttribute('aria-label',A('إيقاف التسجيل','Stop recording'));
      b.title=A('إيقاف التسجيل','Stop recording');
      b.setAttribute('data-recording','');
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
      (m.body && navigator.clipboard ? button('copy-text',A('نسخ النص','Copy text'),'file',data) : '') +
      (own && !m.options ? button('edit',A('تعديل','Edit'),'pen',data) : '') +
      (manages ? button('pin',A('تثبيت أو إلغاء التثبيت','Pin or unpin'),'pin',{id:m.id,sheet:'1'}) : '') +
      (own || manages ? button('delete',A('حذف','Delete'),'trash',{id:m.id,sheet:'1'}) : '') +
      (!own ? button('report',A('إبلاغ','Report'),'flag',data) : '') + '</div>',{nofocus:true});
  };
  IS.ACT['study-copy-text']=async function (b) {
    var message=active && active.rows.get(Number(b.dataset.id));
    if (!message || !message.body) return;
    await navigator.clipboard.writeText(message.body);
    IS.closeSheet();
    IS.toast(A('نُسخت الرسالة','Message copied'));
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
          if (m.role==='member' || (g.role==='owner' && m.role==='admin')) commands+=button('member',
            m.role==='admin' ? A('إلغاء الإشراف','Demote') : A('تعيين مشرف','Make admin'),'',
            Object.assign({role:m.role==='admin'?'member':'admin'},change));
          if (g.role==='owner' && m.role!=='removed') commands+=button('member',A('نقل الملكية','Transfer ownership'),'',
            Object.assign({role:'owner'},change));
        }
        return '<li><span dir="auto">' + esc(m.name) + ' <small>' + esc(roleLabel(m.role)) + '</small></span><div class="row">' + commands + '</div></li>';
      }).join('');
      IS.sheet(esc(g.title),'<p dir="auto">' + esc(g.description) + '</p><div class="row study-tools">' + (admin(g.role) ?
        button('people',A('إضافة أعضاء أو دعوتهم','Add or invite people'),'users',{id:id},true) +
        IS.shareButton('study-invite/' + g.invite) + button('rotate',A('تجديد رابط الدعوة','Reset invite link'),'route',{id:id}) +
        button('settings',A('إعدادات المجموعة','Group settings'),'gear',{id:id}) +
        button('reports',A('بلاغات المجموعة','Group reports'),'flag',{id:id}) : '') +
        (g.role!=='owner' ? button('leave',A('مغادرة','Leave group'),'logout',{id:id}) : '') +
        '</div>' + (g.admin_only && !admin(g.role) ? '<p>' + IS.N(g.member_count) + ' ' + t('مشتركون','subscribers') + '</p>' :
          '<h3>' + (g.admin_only ? t('المشتركون','Subscribers') : t('الأعضاء','Members')) + '</h3><ul class="study-members">' + members + '</ul>'),{nofocus:true});
    } catch (error) { IS.toast(errorText(error),true); }
  };
  IS.ACT['study-people']=function (b) {
    IS.sheet(t('إضافة أعضاء أو دعوتهم','Add or invite people'),
      '<form class="form" data-form="study-people"><input type="hidden" name="id" value="' + esc(b.dataset.id) +
      '"><label class="fl"><span>' + t('ابحث باسم الحساب (٣ أحرف على الأقل)','Search by account name (at least 3 characters)') +
      '</span><input name="query" type="search" minlength="3" maxlength="80" required dir="auto"></label>' +
      '<button class="btn pri">' + t('بحث','Search') + '</button><div class="study-person-results" aria-live="polite"></div></form>');
  };
  IS.SUB['study-people']=async function (data,form) {
    var region=form.querySelector('.study-person-results');
    try {
      var rows=await read('people',data.id,{query:data.query});
      if (!form.isConnected) return;
      region.innerHTML=rows.length ? '<ul class="study-members">' + rows.map(function (person) {
        var opts={id:data.id,user:person.id};
        return '<li><span dir="auto">' + esc(person.name) + '</span><div class="row">' +
          button('add-member',A('إضافة','Add member'),'plus',opts) +
          button('send-invite',A('إرسال دعوة','Send in-app invite'),'send',opts) + '</div></li>';
      }).join('') + '</ul>' : '<p>' + t('لا توجد حسابات مطابقة.','No matching accounts.') + '</p>';
    } catch (error) { region.textContent=errorText(error); }
  };
  for (const op of ['add-member','send-invite']) {
    IS.ACT['study-'+op]=async function (b) {
      b.disabled=true;
      var outcome=await perform(op,b.dataset.id,{user:b.dataset.user});
      if (!outcome) { b.disabled=false; return; }
      var row=b.closest('li');
      if (row && op==='add-member') row.remove();
      b.textContent=outcome.already_sent ? A('الدعوة مرسلة بالفعل','Already invited') : A('أُرسلت الدعوة','Invite sent');
      IS.toast(op==='add-member' ? A('تمت إضافة العضو','Member added') : A('أُرسلت الدعوة داخل التطبيق','In-app invitation sent'));
    };
  }
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
        '</blockquote><div class="row">' + (id ?
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
  IS.ACT['study-resolve']=async function (b) {
    var d=b.dataset;
    if (d.op==='remove-reported' && !await IS.confirm(A('حذف الرسالة المبلّغ عنها؟','Remove the reported message?'))) return;
    if (!await perform(d.op,d.id,{report:d.report})) return;
    IS.ACT['study-reports'](b);
  };
})();
