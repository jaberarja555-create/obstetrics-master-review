/* Private study sessions use Google Meet for the call and SMRA for scheduling and access. */
(function () {
  'use strict';
  var A=IS.A, esc=IS.esc, ic=IS.ic;
  var uuid=/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;
  var meetPath=/^\/[a-z]{3}-[a-z]{4}-[a-z]{3}\/?$/;

  function t(ar,en) { return esc(A(ar,en)); }
  function isAdmin(role) { return role==='owner' || role==='admin'; }
  function detailHash(id) { return '#study-lecture/' + esc(id); }
  function button(action,id,label,icon,primary) {
    return '<button type="button" class="btn sm ' + (primary ? 'pri' : 'ghost') + '" data-act="study-lecture-' + action +
      '" data-id="' + esc(id) + '">' + ic(icon) + esc(label) + '</button>';
  }
  function back(hash,label) {
    return '<nav class="crumb"><a href="#' + esc(hash) + '">' + ic('chev','fr') + esc(label) + '</a></nav>';
  }
  function errorText(error) {
    var messages={
      study_lecture_unavailable: ['هذه المحاضرة أو المجموعة غير متاحة لحسابك.','This lecture or group is unavailable to your account.'],
      study_lecture_forbidden: ['حسابك لا يملك صلاحية هذا الإجراء.','Your account cannot perform this action.'],
      study_lecture_invalid: ['تحقّق من العنوان والموعد المستقبلي والمدة.','Check the title, future start time and duration.'],
      study_contact: ['احذف بيانات التواصل من عنوان المحاضرة.','Remove contact details from the lecture title.'],
      study_lecture_link: ['أدخل رابط اجتماع صالحًا من Google Meet.','Enter a valid Google Meet meeting link.'],
      study_lecturer_unavailable: ['هذا المحاضر غير متاح الآن.','This lecturer is unavailable.'],
      study_lecture_stale: ['انتهت الدعوة أو تغيّرت حالة المحاضرة.','The invitation expired or the lecture status changed.']
    };
    var msg=messages[error.message] || ['تعذّر الاتصال بخدمة المحاضرات. حاول مجددًا.','Could not reach lecture scheduling. Try again.'];
    return A(msg[0],msg[1]);
  }
  async function rpc(method,op,id,value) {
    if (!DB.live) throw new Error('study_lecture_unavailable');
    var args={p_op:op,p_id:id || null};
    if (method==='read') args.p_query=value || null;
    else args.p_data=value || {};
    var result=await DB.sb.rpc('ish_study_lecture_' + method,args);
    if (result.error) throw new Error(result.error.message);
    return result.data;
  }
  function read(op,id,query) { return rpc('read',op,id,query); }
  function action(op,id,data) { return rpc('action',op,id,data); }
  function unavailable(error) {
    return back('study-groups',A('المجموعات والقنوات','Groups & channels')) +
      IS.empty('video',errorText(error));
  }
  function meetUrl(value) {
    try {
      var url=new URL(value);
      if (url.origin!=='https://meet.google.com' || url.username || url.password || !meetPath.test(url.pathname)) return '';
      return url.origin + url.pathname.replace(/\/$/,'');
    } catch (error) { return ''; }
  }
  function when(lecture) {
    var date=new Intl.DateTimeFormat(IS.lang,{weekday:'short',day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'});
    return '<time datetime="' + esc(lecture.starts_at) + '">' + esc(date.format(new Date(lecture.starts_at))) + '</time> · ' +
      esc(A(IS.N(lecture.duration) + ' دقيقة',IS.N(lecture.duration) + ' min'));
  }
  function status(lecture) {
    if (lecture.status==='invited') return !lecture.started ?
      A('بانتظار رد المحاضر','Waiting for lecturer') : A('انتهت الدعوة','Invitation expired');
    if (lecture.status==='declined') return A('اعتذر المحاضر','Lecturer declined');
    if (lecture.status==='cancelled') return A('أُلغيت','Cancelled');
    return lecture.ended ? A('انتهت','Ended') : A('مجدولة','Scheduled');
  }
  function lectureList(rows) {
    return '<div class="study-lecture-list">' + rows.map(function (lecture) {
      return '<a class="box study-lecture-item" href="' + detailHash(lecture.id) + '">' + ic('video') +
        '<span><b dir="auto">' + esc(lecture.title) + '</b><small>' + when(lecture) + '</small></span><span class="chip">' +
        esc(status(lecture)) + '</span></a>';
    }).join('') + '</div>';
  }

  IS.page('study-lectures',async function (id) {
    try {
      if (!id) {
        var invites=await read('inbox');
        return back('study-groups',A('المجموعات والقنوات','Groups & channels')) +
          IS.banner(IS.T('دعوات المحاضرات','Lecture invitations'),t('دعوات لتقديم محاضرات مباشرة.','Invitations to teach live lectures.'),'video') +
          (invites.length ? lectureList(invites) : IS.empty('video',A('لا توجد دعوات حالية','No current invitations')));
      }
      if (!uuid.test(id)) throw new Error('study_lecture_unavailable');
      var schedule=await read('group',id);
      return back('study-group/' + id,A('العودة للمحادثة','Back to conversation')) +
        IS.banner(IS.T('المحاضرات المباشرة','Live lectures'),t('تُفتح الجلسات في Google Meet.','Sessions open in Google Meet.'),'video') +
        (isAdmin(schedule.role) ? '<div class="row study-lecture-actions">' +
          button('host',id,A('استخدام رابط Meet','Use a Meet link'),'cal',true) +
          button('invite',id,A('دعوة محاضر','Invite a lecturer'),'users') + '</div>' : '') +
        (schedule.sessions.length ? lectureList(schedule.sessions) : IS.empty('video',A('لا توجد محاضرات قادمة','No upcoming lectures')));
    } catch (error) { return unavailable(error); }
  },{auth:true});

  function meetField() {
    return '<label class="fl"><span>' + t('رابط Google Meet','Google Meet link') + '</span>' +
      '<input name="meet_url" type="url" dir="ltr" required maxlength="300" placeholder="https://meet.google.com/abc-defg-hij"></label>' +
      '<p class="mut"><a href="https://meet.google.com/" target="_blank" rel="noopener noreferrer">' + t('أنشئ اجتماعًا في Google Meet','Create a meeting in Google Meet') +
      '</a> · ' + t('استخدم أدوات المضيف في Meet للتحكم في دخول الحاضرين.','Use the host controls in Meet to admit attendees.') + '</p>';
  }
  function formError(form,error) { if (form.isConnected) form.querySelector('[data-lecture-error]').textContent=errorText(error); }
  function errorSlot() { return '<p class="study-lecture-error" data-lecture-error role="alert"></p>'; }
  function dateFloor() {
    var time=new Date(Date.now()+60000);
    return new Date(+time-time.getTimezoneOffset()*60000).toISOString().slice(0,16);
  }
  function openCreate(id,invite) {
    var search=invite ? '<form class="form" data-form="study-lecture-search"><input type="hidden" name="id" value="' + esc(id) +
      '"><label class="fl"><span>' + t('ابحث باسم المحاضر (حرفان على الأقل)','Search by lecturer name (at least two characters)') +
      '</span><input type="search" name="query" minlength="2" maxlength="80" required dir="auto"></label><button class="btn ghost">' +
      t('بحث','Search') + '</button><div class="study-lecture-results" aria-live="polite"></div>' + errorSlot() + '</form>' : '';
    var zone=Intl.DateTimeFormat().resolvedOptions().timeZone;
    var dialog=IS.sheet(invite ? t('دعوة محاضر','Invite a lecturer') : t('محاضرة عبر Google Meet','Google Meet lecture'), search +
      '<form class="form" data-form="study-lecture-create"' + (invite ? ' hidden' : '') + '><input type="hidden" name="id" value="' + esc(id) +
      '"><input type="hidden" name="lecturer"><p data-lecture-chosen dir="auto"' + (invite ? '' : ' hidden') + '></p>' +
      '<label class="fl"><span>' + t('عنوان المحاضرة','Lecture title') + '</span><input name="title" required maxlength="100" dir="auto"></label>' +
      (invite ? '' : '<label class="check"><input name="start_now" type="checkbox" value="1"> ' + t('ابدأ الآن','Start now') + '</label>') +
      '<label class="fl"><span>' + t('بداية المحاضرة بتوقيت جهازك','Start time on your device') + (zone ? ' · <bdi>' + esc(zone) + '</bdi>' : '') +
      '</span><input name="starts" type="datetime-local" min="' + dateFloor() + '" required></label>' +
      '<label class="fl"><span>' + t('المدة بالدقائق','Duration in minutes') + '</span><input name="duration" type="number" min="1" max="60" value="45" required></label>' +
      (invite ? '<p class="mut">' + t('يظهر الموعد للأعضاء بعد قبول المحاضر وإضافة رابط Meet.',
        'Members see the session once the lecturer accepts and supplies a Meet link.') + '</p>' : meetField()) +
      errorSlot() + '<button class="btn pri">' + (invite ? t('إرسال الدعوة','Send invitation') : t('نشر المحاضرة','Publish lecture')) + '</button></form>');
    var immediate=dialog.querySelector('[name=start_now]');
    if (immediate) immediate.addEventListener('change',function () {
      var starts=immediate.form.elements.starts;
      starts.disabled=immediate.checked;
      starts.closest('label').hidden=immediate.checked;
    });
  }
  IS.ACT['study-lecture-host']=function (b) { openCreate(b.dataset.id,false); };
  IS.ACT['study-lecture-invite']=function (b) { openCreate(b.dataset.id,true); };
  IS.SUB['study-lecture-search']=async function (data,form) {
    try {
      var rows=await read('lecturers',data.id,data.query);
      if (!form.isConnected) return;
      form.querySelector('[data-lecture-error]').textContent='';
      form.querySelector('.study-lecture-results').innerHTML=rows.length ? '<div class="study-lecture-search-list">' + rows.map(function (lec) {
        return '<button type="button" class="btn ghost" data-act="study-lecture-select" data-id="' + esc(lec.id) +
          '"><bdi>' + esc(lec.name) + '</bdi></button>';
      }).join('') + '</div>' : '<p>' + t('لا يوجد محاضر مطابق.','No matching lecturer.') + '</p>';
    } catch (error) { formError(form,error); }
  };
  IS.ACT['study-lecture-select']=function (b) {
    var form=b.closest('.shb').querySelector('[data-form=study-lecture-create]');
    form.elements.lecturer.value=b.dataset.id;
    form.querySelector('[data-lecture-chosen]').textContent=A('المحاضر المختار','Selected lecturer') + ' · ' + b.textContent.trim();
    form.hidden=false;
    form.elements.title.focus();
  };
  IS.SUB['study-lecture-create']=async function (data,form) {
    try {
      var now=data.start_now==='1', starts=new Date(data.starts), url=meetUrl(data.meet_url);
      if (!now && (!Number.isFinite(starts.getTime()) || starts<=new Date())) throw new Error('study_lecture_invalid');
      if (!data.lecturer && !url) throw new Error('study_lecture_link');
      form.lectureNonce=form.lectureNonce || crypto.randomUUID();
      var item=await action('create',data.id,{title:data.title,starts_at:now ? null : starts.toISOString(),start_now:now,duration:Number(data.duration),
        meet_url:url,lecturer:data.lecturer,nonce:form.lectureNonce});
      IS.toast(data.lecturer ? A('أُرسلت الدعوة','Invitation sent') : A('تمت جدولة المحاضرة','Lecture scheduled'));
      if (form.isConnected) { IS.closeSheet(); IS.go(detailHash(item.id).slice(1)); }
    } catch (error) { formError(form,error); }
  };

  IS.page('study-lecture',async function (id) {
    try {
      if (!uuid.test(id)) throw new Error('study_lecture_unavailable');
      var lecture=await read('get',id), url=meetUrl(lecture.meet_url);
      var destination=lecture.group_id ? 'study-lectures/' + lecture.group_id : 'study-lectures';
      var manage=(isAdmin(lecture.role) || lecture.is_lecturer) && !lecture.ended &&
        (lecture.status==='scheduled' || lecture.status==='invited' && !lecture.can_respond);
      return back(destination,lecture.group_id ? A('المحاضرات المباشرة','Live lectures') : A('دعوات المحاضرات','Lecture invitations')) +
        '<section class="box study-lecture-detail"><div class="row"><span class="chip">' + esc(status(lecture)) +
        '</span></div><h1 tabindex="-1" dir="auto">' + esc(lecture.title) + '</h1><p>' + when(lecture) + '</p>' +
        (lecture.lecturer ? '<p class="mut" dir="auto">' + esc(lecture.lecturer) + '</p>' : '') +
        (lecture.can_respond ? '<form class="form" data-form="study-lecture-accept"><input type="hidden" name="id" value="' + esc(id) +
          '">' + meetField() + errorSlot() + '<div class="row"><button class="btn pri">' + t('قبول وجدولة','Accept and schedule') + '</button>' +
          button('decline',id,A('اعتذار','Decline'),'x') + '</div></form>' : '') +
        (url || manage ? '<div class="row study-lecture-actions">' +
          (url ? '<a class="btn pri" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + ic('video') + t('انضم عبر Google Meet','Join in Google Meet') + '</a>' +
            button('calendar',id,A('أضف إلى التقويم','Add to calendar'),'cal') : '') +
          (manage ? button('cancel',id,A('إلغاء المحاضرة','Cancel lecture'),'x') : '') + '</div>' : '') + '</section>';
    } catch (error) { return unavailable(error); }
  },{auth:true});
  IS.SUB['study-lecture-accept']=async function (data,form) {
    try {
      var url=meetUrl(data.meet_url);
      if (!url) throw new Error('study_lecture_link');
      await action('accept',data.id,{meet_url:url});
      IS.toast(A('تمت جدولة المحاضرة','Lecture scheduled'));
      if (form.isConnected) await IS.route();
    } catch (error) { formError(form,error); }
  };
  ['decline','cancel'].forEach(function (op) {
    IS.ACT['study-lecture-'+op]=async function (b) {
      var decline=op==='decline';
      if (!(await IS.confirm(decline ? A('هل تريد الاعتذار عن هذه الدعوة؟','Decline this lecture invitation?') :
        A('هل تريد إلغاء هذه المحاضرة؟','Cancel this lecture?')))) return;
      try {
        await action(op,b.dataset.id);
        IS.toast(decline ? A('أُرسل اعتذارك','Invitation declined') : A('أُلغيت المحاضرة','Lecture cancelled'));
        if (b.isConnected) await IS.route();
      } catch (error) { IS.toast(errorText(error),true); }
    };
  });

  function calendarText(value) { return value.replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/[,;]/g,'\\$&'); }
  function calendarDate(date) { return date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''); }
  function foldLine(line) {
    var result='', length=0, encoder=new TextEncoder();
    for (var char of line) {
      var bytes=encoder.encode(char).length;
      if (length+bytes>75) { result+='\r\n '; length=1; }
      result+=char; length+=bytes;
    }
    return result;
  }
  IS.ACT['study-lecture-calendar']=async function (b) {
    b.disabled=true;
    try {
      var lecture=await read('get',b.dataset.id);
      if (!b.isConnected) return;
      if (!meetUrl(lecture.meet_url)) throw new Error('study_lecture_unavailable');
      var starts=new Date(lecture.starts_at), ends=new Date(+starts+lecture.duration*60000);
      var url=new URL(detailHash(lecture.id),location.href).href;
      var ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//SMRA//Live Lectures//EN','BEGIN:VEVENT',
        'UID:' + lecture.id + '@studentmasterreview.com','DTSTAMP:' + calendarDate(new Date()),'DTSTART:' + calendarDate(starts),
        'DTEND:' + calendarDate(ends),'SUMMARY:' + calendarText(lecture.title),'URL:' + url,'DESCRIPTION:' + calendarText(url),
        'BEGIN:VALARM','TRIGGER:-PT10M','ACTION:DISPLAY','DESCRIPTION:SMRA live lecture','END:VALARM','END:VEVENT','END:VCALENDAR'];
      var object=URL.createObjectURL(new Blob([ics.map(foldLine).join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'}));
      var link=document.createElement('a'); link.href=object; link.download='smra-lecture.ics'; link.click();
      setTimeout(function () { URL.revokeObjectURL(object); },1000);
    } catch (error) { IS.toast(errorText(error),true); }
    finally { b.disabled=false; }
  };
})();
