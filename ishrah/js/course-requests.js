/* Course requests, public teaching terms and private offer conversations. */
(function () {
  'use strict';
  var A = IS.A, esc = IS.esc, ic = IS.ic, N = IS.N;
  var REQUESTS = 'course_requests', MEMBERS = 'course_request_members';
  var COMMENTS = 'course_request_comments', OFFERS = 'course_request_offers', MESSAGES = 'course_request_messages';
  var PUBLIC = ['open', 'closed'];
  var TITLES = ['طلبات الكورسات', 'Course requests'];
  function uid() { return IS.ME && IS.ME.id; }
  function activeLecturer() { return IS.LEC && IS.LEC.status === 'active'; }
  function isPublic(row) { return PUBLIC.indexOf(row.status) >= 0; }
  function canOffer(row) { return activeLecturer() && row.user_id !== uid() && (!row.lecturer_id || row.lecturer_id === uid()) && !row.teacher_confirmed; }
  function scope() { return { spec: IS.SPEC, cat: (IS.mySection() || {}).id }; }
  function scopeName(row) { var spec = IS.spec(row.spec), cat = IS.cat(row.cat); return [spec && A(spec.ar, spec.en), cat && cat.en].filter(Boolean).join(' · '); }
  function href(row, prefix, offer) { return '#' + (prefix || 'course-request') + '/' + row.id + (offer ? '/' + offer : ''); }
  function text(ar, en) { return esc(A(ar, en)); }
  function note(ar, en) { return '<p class="mut">' + text(ar, en) + '</p>'; }
  function link(to, ar, en, cls) { return '<a class="' + (cls || 'btn ghost sm') + '" href="' + esc(to) + '">' + text(ar, en) + '</a>'; }
  function status(row) {
    var names = { pending: ['بانتظار الموافقة', 'Awaiting approval'], open: ['الانضمام مفتوح', 'Joining open'],
      closed: ['الانضمام مغلق', 'Joining closed'], rejected: ['لم يُعتمد', 'Declined'] };
    return IS.chip(text.apply(null, names[row.status]), row.status === 'open' ? 'ok' : row.status === 'pending' ? 'warn' : '');
  }
  function joined(row) {
    return '<bdi dir="ltr">' + esc(((row.payment_required ? row.paid_count : row.joined_count) || 0) + (row.goal ? ' / ' + row.goal : '')) + '</bdi> ' + text('انضموا', 'joined');
  }
  function approval(row) {
    var likes = Number(row.like_count) || 0, dislikes = Number(row.dislike_count) || 0;
    return likes + dislikes ? Math.round(likes * 100 / (likes + dislikes)) + '%' : '—';
  }
  function priceText(value) {
    if (value == null) return A('يُتفق عليه لاحقًا', 'To be agreed');
    return Number(value) === 0 ? A('مجاني', 'Free') : Number(value).toLocaleString('en-US') + A(' ج.س', ' SDG');
  }
  function requestedPrice(row) {
    return row.budget_min != null && row.budget_max != null && Number(row.budget_min) === Number(row.budget_max) ?
      priceText(row.budget_min) : priceText(null);
  }
  function priceField(ar, en, value, required) {
    return '<label class="fl"><span>' + text(ar, en) + '</span><input name="price" type="number" min="0" max="9999999999.99" step=".01" dir="ltr" value="' +
      esc(value == null ? '' : value) + '"' + (required ? ' required' : '') + '></label>';
  }
  function date(value) {
    if (!value) return A('يُتفق عليه لاحقًا', 'To be agreed');
    return new Intl.DateTimeFormat(IS.lang === 'ar' ? 'ar' : 'en-GB', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Khartoum'
    }).format(new Date(value)) + ' · ' + A('بتوقيت السودان', 'Sudan time');
  }
  function dateFields(value, proposed) {
    var parts = value ? new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Khartoum', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date(value)).reduce(function (values, part) { values[part.type] = part.value; return values; }, {}) : null;
    return '<div class="g2f"><label class="fl"><span>' + (proposed ? text('التاريخ المقترح', 'Proposed date') : text('تاريخ التدريس', 'Teaching date')) +
      '</span><input type="date" name="date" min="2000-01-02" max="2199-12-31" value="' + (parts ? parts.year + '-' + parts.month + '-' + parts.day : '') + '"></label>' +
      '<label class="fl"><span>' + text('الوقت (بتوقيت السودان)', 'Time (Sudan time)') + '</span><input type="time" name="time" value="' +
      (parts ? parts.hour + ':' + parts.minute : '') + '"></label></div>';
  }
  function startAt(data) { return data.date ? data.date + 'T' + data.time + ':00+02:00' : null; }
  function validDate(data) {
    if (!!data.date === !!data.time) return true;
    IS.toast(A('أدخل التاريخ والوقت معًا.', 'Enter both the date and the time.'), true);
    return false;
  }
  var FILE_BUCKET = 'course-request-files';
  var FILE_TYPES = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', pdf: 'application/pdf', txt: 'text/plain',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  function attachmentType(file) { return FILE_TYPES[file.name.split('.').pop().toLowerCase()]; }
  function commandButton(row, action, ar, en, cls, id) {
    return '<button type="button" class="btn sm ' + (cls || 'ghost') + '" data-act="cr-command" data-command="' + action +
      '" data-request="' + esc(row.id) + '"' + (id ? ' data-item="' + esc(id) + '"' : '') + '>' + text(ar, en) + '</button>';
  }

  /* The device-only preview uses the same UI and the same state transitions as the RPC. */
  async function previewCommand(action, id, data) {
    var actor = uid(), row, offers, offer, recipient, notice, target;
    if (!actor || IS.ME.status === 'blocked' || IS.ME.team_status === 'suspended') throw new Error('request_sign_in');
    if (action === 'create') {
      target = data.lecturer_id && await DB.one('lecturers', data.lecturer_id);
      if (data.lecturer_id && (!target || target.status !== 'active' || target.id === actor)) throw new Error('request_lecturer');
      row = await DB.ins(REQUESTS, Object.assign({}, data, { budget_min: data.price, budget_max: data.price, user_id: actor, author_name: IS.ME.name, lecturer_name: target ? target.name : null,
        status: 'open', published_at: new Date().toISOString(), teacher_confirmed: false, joined_count: 0, rating_count: 0, rating_points: 0 }));
      for (var item of (data.attachments || [])) {
        await DB.ins('course_request_files', Object.assign({ request_id: row.id }, item));
      }
      if (target) await DB.ins('notices', { user_id: target.id, title: 'طلب تدريس موجّه إليك',
        title_en: 'A course request names you', body: row.title, link: '#studio-course-request/' + row.id });
      return row.id;
    }
    row = await DB.one(REQUESTS, id);
    if (!row || row.status === 'deleted') throw new Error('request_unavailable');
    var owner = row.user_id === actor, noticeLink = href(row);
    if (action === 'approve' || action === 'reject') {
      if (!IS.can('review', 'approve') || row.status !== 'pending') throw new Error('request_permission');
      await DB.upd(REQUESTS, id, { status: action === 'approve' ? 'open' : 'rejected', published_at: action === 'approve' ? new Date().toISOString() : null });
      recipient = row.user_id;
      notice = action === 'approve' ? A('نُشر طلبك', 'Your course request was published') : A('رُفض طلبك', 'Your course request was declined');
      if (action === 'approve' && row.lecturer_id) {
        await IS.notify(row.lecturer_id, A('طلب تدريس موجّه إليك', 'A course request names you'), row.title, href(row, 'studio-course-request'));
      }
    } else if (action === 'close' || action === 'delete') {
      if (action === 'close' && (!owner || row.status !== 'open')) throw new Error('request_permission');
      if (action === 'delete' && !owner && !IS.can('review', 'delete')) throw new Error('request_permission');
      if (action === 'delete' && row.reserved_count) throw new Error('request_has_payments');
      await DB.upd(REQUESTS, id, { status: action === 'close' ? 'closed' : 'deleted' });
    } else {
      if (!isPublic(row)) throw new Error('request_unavailable');
      if (['join', 'comment'].indexOf(action) >= 0 && row.status !== 'open') throw new Error('request_closed');
      if (action === 'join' && owner) throw new Error('request_permission');
      if (action === 'join' || action === 'leave') {
        if (row.payment_required) throw new Error('request_payment_required');
        var member = (await DB.q(MEMBERS, { eq: { request_id: id, user_id: actor } }))[0];
        if (action === 'join' && !member) await DB.ins(MEMBERS, { request_id: id, user_id: actor });
        if (action === 'leave' && member) await DB.del(MEMBERS, member.id);
        var count = (await DB.q(MEMBERS, { eq: { request_id: id } })).length;
        await DB.upd(REQUESTS, id, { joined_count: count, status: row.auto_close && count >= row.goal ? 'closed' : row.status });
      } else if (action === 'comment') {
        await DB.ins(COMMENTS, { request_id: id, user_id: actor, author_name: IS.ME.name, body: data.body });
        await DB.upd(REQUESTS, id, { comment_count: (row.comment_count || 0) + 1 });
      } else if (action === 'remove_comment') {
        var comment = await DB.one(COMMENTS, data.id);
        if (comment && comment.request_id === id && (comment.user_id === actor || IS.can('community', 'delete'))) {
          await DB.del(COMMENTS, comment.id);
          await DB.upd(REQUESTS, id, { comment_count: Math.max(0, (row.comment_count || 0) - 1) });
        }
      } else {
        offers = await DB.q(OFFERS, { eq: { request_id: id } });
        if (action === 'offer') {
          if (!canOffer(row)) throw new Error('request_lecturer');
          offer = offers.find(function (o) { return o.lecturer_id === actor; });
          if (offer && offer.terms_public && !data.public_terms) throw new Error('request_offer_public_required');
          var terms = { terms: data.terms, status: 'offered', terms_public: data.public_terms === true, price: data.price, starts_at: data.starts_at };
          if (offer) await DB.upd(OFFERS, offer.id, terms);
          else offer = await DB.ins(OFFERS, Object.assign({ request_id: id, lecturer_id: actor, lecturer_name: IS.LEC.name }, terms));
          recipient = row.user_id;
          notice = A('عرض تدريس', 'A lecturer sent teaching terms');
        } else {
          offer = offers.find(function (o) { return o.id === data.id; });
          if (!offer || (!owner && offer.lecturer_id !== actor)) throw new Error('request_permission');
          if (action === 'accept') {
            if (!owner || offer.status !== 'offered') throw new Error('request_permission');
            if (!offer.terms_public) throw new Error('request_offer_private');
            for (var other of offers) await DB.upd(OFFERS, other.id, { status: other.id === offer.id ? 'accepted' : 'declined' });
            await DB.upd(REQUESTS, id, { teacher_confirmed: true, payment_required: +offer.price > 0,
              status: +offer.price > 0 && row.auto_close && row.joined_count >= row.goal ? 'open' : row.status });
            recipient = offer.lecturer_id;
            notice = A('قُبل عرض التدريس', 'Your teaching offer was accepted');
          } else if (action === 'message') {
            await DB.ins(MESSAGES, { offer_id: offer.id, user_id: actor, body: data.body });
            recipient = owner ? offer.lecturer_id : row.user_id;
            notice = A('رسالة عن عرض تدريس', 'New teaching offer message');
          } else if (action === 'publish_terms') {
            if (offer.lecturer_id !== actor || !activeLecturer() || offer.status === 'declined') throw new Error('request_permission');
            await DB.upd(OFFERS, offer.id, { terms_public: true, price: data.price, starts_at: data.starts_at });
            if (offer.status === 'accepted' && +data.price > 0) await DB.upd(REQUESTS, id, { payment_required: true });
          }
        }
        if (offer) noticeLink = href(row, recipient === row.user_id ? 'course-request' : 'studio-course-request', offer.id);
      }
    }
    if (notice) await IS.notify(recipient, notice, row.title, noticeLink);
    return id;
  }
  async function change(action, id, payload) {
    try {
      if (!DB.live) return await previewCommand(action, id, payload || {});
      var result = await DB.sb.rpc('ish_course_request', { action: action, request: id || null, payload: payload || {} });
      if (result.error) throw result.error;
      return result.data;
    } catch (error) {
      var message = {
        request_closed: ['أُغلق الانضمام إلى هذا الطلب.', 'This request has closed.'],
        request_unavailable: ['هذا الطلب لم يعد متاحًا.', 'This request is no longer available.'],
        request_permission: ['لا يمكنك تنفيذ هذا الإجراء على الطلب.', 'Your account cannot perform this action on the request.'],
        request_lecturer: ['المحاضر غير متاح لهذا الطلب.', 'The lecturer is unavailable for this request.'],
        request_offer_decided: ['حُسم عرض التدريس بالفعل.', 'A teaching offer has already been decided.'],
        request_offer_private: ['يمكن قبول العرض بعد أن ينشر المحاضر الشروط.', 'The lecturer must publish the terms before you can accept this offer.'],
        request_offer_public_required: ['حدّث الصفحة لتعديل الشروط المنشورة.', 'Refresh the page to edit published terms.'],
        request_offer_price_required: ['أدخل سعرًا محددًا للفرد.', 'Enter one fixed price per person.'],
        request_attachment_invalid: ['أعد اختيار المرفقات وحاول مرة أخرى.', 'Choose your attachments again and retry.'],
        request_payment_required: ['أرسل إيصال الدفع للانضمام بعد تأكيد التحويل.', 'Submit your receipt to join once payment is confirmed.'],
        request_has_payments: ['يمكنك إغلاق الانضمام لهذا الطلب الذي يحوي مدفوعات.', 'You can close joining for this request with payments.'],
        request_sign_in: ['سجّل الدخول بحساب نشط للمتابعة.', 'Sign in with an active account to continue.']
      }[error.message];
      if (!message) throw error;
      IS.toast(A.apply(null, message), true);
      if (id) IS.refresh();
      return null;
    }
  }

  async function publicRows(opts, limit) {
    var query = { in: { status: PUBLIC }, order: ['published_at', false], limit: limit };
    if (opts) query.eq = opts;
    return DB.q(REQUESTS, query);
  }
  function requestCard(row, prefix) {
    return '<article class="box cr-card"><div class="row">' + status(row) + (row.teacher_confirmed ? IS.chip(text('تأكد المحاضر', 'Lecturer confirmed'), 'ok') : '') + '</div>' +
      '<h3><a dir="auto" href="' + href(row, prefix) + '">' + esc(row.title) + '</a></h3>' +
      '<p class="mut" dir="auto">' + esc(scopeName(row)) + ' · ' + esc(row.lecturer_name || A('طلب عام', 'General request')) + '</p>' +
      '<p class="cr-summary" dir="auto">' + esc(row.details) + '</p><div class="row cr-meta"><span>' + ic('users') + joined(row) +
      '</span><span>' + ic('star') + esc(approval(row)) + '</span></div></article>';
  }
  IS.sectionCourseRequests = function (limit) { return publicRows(scope(), limit); };

  async function form(selected) {
    var section = IS.mySection();
    var results = await Promise.all([DB.q('lecturers', { eq: { status: 'active' }, order: ['name'] }), IS.pubCourses(true)]);
    var lecturers = IS.studyLecturers(results[0], results[1]).filter(function (lecturer) { return lecturer.id !== uid(); });
    return IS.banner(IS.T('اطلب كورسًا', 'Request a course'), esc(scopeName(scope())), 'chat') +
      '<form class="box form" data-form="cr-create">' +
      '<label class="fl"><span>' + text('عنوان الكورس', 'Course title') + '</span><input name="title" required maxlength="140"></label>' +
      '<label class="fl"><span>' + text('ماذا تريد أن يغطي الكورس؟', 'What should the course cover?') + '</span><textarea name="details" required rows="3" maxlength="4000"></textarea></label>' +
      '<label class="fl"><span>' + text('المحاضر', 'Lecturer') + '</span><select name="lecturer"><option value="">' + text('طلب عام لأي محاضر متاح', 'General request for any available lecturer') + '</option>' +
        lecturers.map(function (l) { return '<option value="' + esc(l.id) + '"' + (l.id === selected ? ' selected' : '') + '>' + esc(l.name) + '</option>'; }).join('') + '</select></label>' +
      priceField('السعر المقترح للفرد (جنيه سوداني)', 'Proposed price per person (SDG)', null, false) +
      dateFields(null, true) +
      '<label class="fl"><span>' + text('القواعد أو المتطلبات للمشاركين', 'Rules or requirements for participants') + '</span><textarea name="rules" rows="3" maxlength="2000"></textarea></label>' +
      '<label class="fl"><span>' + text('العدد المستهدف من المشاركين (اختياري)', 'Target number of participants (optional)') + '</span><input name="goal" type="number" min="1" max="10000"></label>' +
      '<label class="chk"><input type="checkbox" name="auto_close"><span>' + text('أغلق الانضمام تلقائيًا عند بلوغ العدد المستهدف', 'Close joining automatically at the target') + '</span></label>' +
      '<label class="fl file"><span>' + text('صور أو ملفات (اختياري)', 'Pictures or files (optional)') +
      '</span><input type="file" name="attachments" multiple accept="' + Object.keys(FILE_TYPES).map(function (ext) { return '.' + ext; }).join(',') + '"><small>' +
      text('حتى 4 ملفات، 10 ميغابايت للملف. الصور وPDF وملفات Office وTXT.', 'Up to 4 files, 10 MB each. Images, PDF, Office and TXT.') + '</small></label>' +
      note('يُنشر الطلب بعد مراجعته. اترك بيانات الاتصال وروابط الاجتماعات خارج المنشور العام.', 'The request becomes public after review. Keep contact details and meeting links out of the public post.') +
      '<div class="row end">' + link('#course-requests', 'إلغاء', 'Cancel') + '<button class="btn pri"' + (section ? '' : ' disabled') + '>' +
      text('انشر الطلب', 'Publish request') + '</button></div></form>';
  }
  IS.SUB['cr-create'] = async function (d, f) {
    if (!validDate(d)) return;
    var goal = d.goal ? Number(d.goal) : null, auto = f.elements.auto_close.checked;
    if (auto && !goal) return IS.toast(A('أدخل العدد المستهدف أولًا.', 'Enter a target number first.'), true);
    var files = Array.from(f.elements.attachments.files), attachments = [], id, submitted = false, finished = false;
    if (files.length > 4 || files.some(function (file) { return !attachmentType(file) || !file.size || file.size > 10 * 1024 * 1024 || file.name.length > 240; })) {
      return IS.toast(A('اختر حتى 4 ملفات مدعومة، بحجم 10 ميغابايت أو أقل للملف.', 'Choose up to 4 supported files, 10 MB or less each.'), true);
    }
    try {
      for (var file of files) {
        var mime = attachmentType(file);
        var path = await DB.upload(FILE_BUCKET, file.type === mime ? file : new File([file], file.name, { type: mime }));
        attachments.push({ path: path, name: file.name, mime: mime, position: attachments.length + 1 });
      }
      submitted = true;
      id = await change('create', null, Object.assign(scope(), {
        title: d.title, details: d.details, rules: d.rules, lecturer_id: d.lecturer || null, price: d.price === '' ? null : Number(d.price),
        proposed_at: startAt(d), goal: goal, auto_close: auto, attachments: attachments
      }));
      finished = true;
    } finally {
      if (!id && (!submitted || finished) && DB.live && attachments.length) {
        await DB.sb.storage.from(FILE_BUCKET).remove(attachments.map(function (item) { return item.path; }));
      }
    }
    if (id) {
      IS.toast(A('نُشر الطلب', 'Request published'));
      IS.go('course-request/' + id);
    }
  };

  IS.page('course-requests', async function (tab) {
    if (tab === 'new' || (tab && tab.indexOf('new/') === 0)) {
      if (uid()) return form(tab.split('/')[1]);
      return IS.empty('user', A('سجّل الدخول لإرسال طلب', 'Sign in to make a request'), '',
        '<button class="btn pri" data-act="login">' + text('تسجيل الدخول', 'Sign in') + '</button>');
    }
    var mine = tab === 'mine' && !!uid();
    var rows = mine ? await DB.q(REQUESTS, { eq: Object.assign(scope(), { user_id: uid() }), neq: { status: 'deleted' }, order: ['created_at', false], limit: 100 }) : await publicRows(scope(), 100);
    return IS.banner(IS.T.apply(null, TITLES), esc(scopeName(scope())), 'chat', link('#course-requests/new', 'اطلب كورسًا', 'Request a course', 'btn gold')) +
      (uid() ? '<div class="row">' + link('#course-requests', 'الطلبات المنشورة', 'Published requests', 'btn sm ' + (mine ? 'ghost' : 'pri')) +
        link('#course-requests/mine', 'طلباتي', 'My requests', 'btn sm ' + (mine ? 'pri' : 'ghost')) + '</div>' : '') +
      (rows.length ? '<div class="grid g3 cr-grid">' + rows.map(function (r) { return requestCard(r); }).join('') + '</div>' :
        IS.empty('chat', mine ? A('لا توجد طلبات لك في هذا القسم', 'You have no requests in this section') : A('لا توجد طلبات منشورة بعد', 'No requests published yet')));
  });

  var STUDIO = { area: 'studio', auth: true, lec: true };
  IS.page('studio-course-requests', async function (tab) {
    if (!activeLecturer()) return null;
    var rows;
    if (tab === 'offers') {
      var ids = (await DB.q(OFFERS, { eq: { lecturer_id: uid() } })).map(function (o) { return o.request_id; });
      rows = ids.length ? await DB.q(REQUESTS, { in: { id: ids, status: PUBLIC }, order: ['published_at', false], limit: 100 }) : [];
    } else {
      var sets = await Promise.all([publicRows({ lecturer_id: null, teacher_confirmed: false }, 100), publicRows({ lecturer_id: uid(), teacher_confirmed: false }, 100)]);
      rows = sets[1].concat(sets[0]).filter(function (r) { return r.user_id !== uid(); });
    }
    return IS.banner(IS.T('فرص التدريس', 'Teaching opportunities'), esc(A('راجع طلبات الطلاب وقدّم شروطك للطلبات التي تستطيع تدريسها.', 'Review student requests and send your terms for courses you can teach.')), 'studio') +
      '<div class="row">' + link('#studio-course-requests', 'فرص التدريس', 'Opportunities') + link('#studio-course-requests/offers', 'عروضي', 'My offers') + '</div>' +
      (rows.length ? '<div class="grid g3 cr-grid">' + rows.map(function (r) { return requestCard(r, 'studio-course-request'); }).join('') + '</div>' :
        IS.empty('studio', A('لا توجد طلبات هنا بعد', 'No requests here yet')));
  }, STUDIO);

  var CONTROL = { area: 'control', auth: true, perm: 'review' };
  IS.page('control-course-requests', async function () {
    var rows = await DB.q(REQUESTS, { eq: { status: 'pending' }, order: ['created_at', true], limit: 100 });
    return IS.banner(IS.T('مراجعة طلبات الكورسات', 'Course request review'), esc(A('راجع الطلبات القديمة التي ما زالت قيد الانتظار.', 'Review older requests still awaiting a decision.')), 'eye') +
      '<div class="row">' + link('#control-questions', 'مراجعة الأسئلة', 'Review questions') + '</div>' +
      (rows.length ? '<div class="grid g3 cr-grid">' + rows.map(function (r) { return requestCard(r, 'control-course-request'); }).join('') + '</div>' :
        IS.empty('eye', A('لا توجد طلبات بانتظار المراجعة', 'No requests awaiting review')));
  }, CONTROL);

  function publicFacts(row, agreement) {
    var list = [[A('المحاضر', 'Lecturer'), agreement ? agreement.lecturer_name : row.lecturer_name || A('أي محاضر متاح', 'Any available lecturer')],
      [agreement ? A('السعر للفرد', 'Price per person') : A('السعر المقترح للفرد', 'Proposed price per person'), agreement ? priceText(agreement.price) : requestedPrice(row)],
      [agreement ? A('موعد التدريس', 'Teaching date and time') : A('الموعد المقترح', 'Proposed date and time'), date(agreement ? agreement.starts_at : row.proposed_at)]];
    return '<dl class="cr-facts">' + list.map(function (item) {
      return '<div><dt>' + esc(item[0]) + '</dt><dd><bdi>' + esc(item[1]) + '</bdi></dd></div>';
    }).join('') + '</dl>';
  }
  async function requestAttachments(id) {
    var files = await DB.q('course_request_files', { eq: { request_id: id }, order: ['position'] });
    var links = await Promise.all(files.map(async function (file) {
      var url = await DB.fileUrl(FILE_BUCKET, file.path);
      if (!url) return '';
      return '<li><a href="' + IS.U(url) + '" target="_blank" rel="noopener noreferrer">' +
        (file.mime.indexOf('image/') === 0 ? '<img src="' + IS.U(url) + '" loading="lazy" alt="">' : ic('file')) +
        '<span dir="auto">' + esc(file.name) + '</span></a></li>';
    }));
    return links.some(Boolean) ? '<section class="cr-attachments"><h3>' + IS.T('المرفقات', 'Attachments') + '</h3><ul>' + links.join('') + '</ul></section>' : '';
  }
  function requestRules(row) {
    return row.rules ? '<h3>' + text('قواعد الانضمام', 'Joining rules') + '</h3><p class="pre" dir="auto">' + esc(row.rules) + '</p>' : '';
  }
  function contentForm(name, request, item, label, field, value, maxlength, submit, extra) {
    return '<form class="form" data-form="' + name + '" data-request="' + esc(request) + '"' + (item ? ' data-item="' + esc(item) + '"' : '') + '>' +
      (extra || '') + '<label class="fl"><span>' + label + '</span><textarea name="' + field + '" required maxlength="' + maxlength + '" rows="' +
      (name === 'cr-comment' ? 2 : 3) + '">' + esc(value || '') + '</textarea></label>' +
      '<div class="row end"><button class="btn pri sm">' + submit + '</button></div></form>';
  }
  function offerList(row, offers, prefix) {
    if (!offers.length) return '';
    return '<section class="box"><h2>' + IS.T('محادثات عروض التدريس', 'Offer conversations') + '</h2><div class="list">' +
      offers.map(function (o) { return '<a class="li" href="' + href(row, prefix, o.id) + '">' + ic('mail') + '<span><b dir="auto">' + esc(o.lecturer_name) +
        '</b><small>' + offerStatus(o) + '</small></span>' + ic('chev', 'fl') + '</a>'; }).join('') + '</div></section>';
  }
  function offerStatus(o) {
    return o.status === 'accepted' ? text('مقبول', 'Accepted') : o.status === 'declined' ? text('اختير عرض آخر', 'Another offer was chosen') : text('بانتظار الرد', 'Awaiting decision');
  }
  async function publishedOffers(id) {
    if (DB.live) {
      var result = await DB.sb.rpc('ish_public_course_terms', { request: id });
      if (result.error) throw result.error;
      return result.data || [];
    }
    return DB.q(OFFERS, { eq: { request_id: id, terms_public: true }, in: { status: ['offered', 'accepted'] }, order: ['created_at', false] });
  }
  function termsBlock(offer, agreed) {
    return '<div class="cr-terms' + (agreed ? ' cr-agreement' : ' cr-proposal') + '">' +
      (agreed ? '<h3>' + ic('checkc') + IS.T('اتفاق التدريس', 'Teaching agreement') + '</h3>' :
        '<div class="cr-agreement-meta"><b dir="auto">' + esc(offer.lecturer_name) + '</b><span dir="auto">' + esc(priceText(offer.price)) +
        '</span><span dir="auto">' + esc(date(offer.starts_at)) + '</span></div>') +
      '<p class="pre" dir="auto">' + esc(offer.terms) + '</p></div>';
  }
  async function offerPage(row, offer, prefix) {
    var messages = (await DB.q(MESSAGES, { eq: { offer_id: offer.id }, order: ['created_at', false], limit: 100 })).reverse();
    var owner = row.user_id === uid();
    return '<nav class="crumb">' + link(href(row, prefix), 'رجوع إلى الطلب', 'Back to request', 'link') + '</nav>' +
      '<article class="box cr-detail"><h1 tabindex="-1">' + IS.T('عرض التدريس', 'Teaching offer') + '</h1><p class="mut" dir="auto">' +
      esc(row.title) + ' · ' + esc(offer.lecturer_name) + '</p><div class="row">' + IS.chip(offerStatus(offer), offer.status === 'accepted' ? 'ok' : '') +
      '</div>' + (offer.terms_public ? '<p class="cr-agreement-price">' + text('السعر للفرد', 'Price per person') + ' <strong dir="auto">' +
        esc(priceText(offer.price)) + '</strong> · ' + esc(date(offer.starts_at)) + '</p>' : '') + '<h2>' + (offer.terms_public ? IS.T('الشروط المنشورة', 'Published terms') : IS.T('شروط غير منشورة', 'Unpublished terms')) +
      '</h2><p class="pre" dir="auto">' + esc(offer.terms) + '</p>' +
      (offer.terms_public && owner && offer.status === 'offered' ? commandButton(row, 'accept', 'اقبل الشروط', 'Accept terms', 'pri', offer.id) : '') +
      (!offer.terms_public && offer.status !== 'declined' ? (offer.lecturer_id === uid() && activeLecturer() ?
        '<form class="form" data-form="cr-publish-terms" data-request="' + esc(row.id) + '" data-item="' + esc(offer.id) + '">' +
        priceField('السعر للفرد (جنيه سوداني)', 'Price per person (SDG)', null, true) + dateFields(offer.starts_at) +
        '<button class="btn pri sm">' + text('انشر السعر والشروط على الطلب', 'Publish price and terms') + '</button></form>' :
        note('يمكن للمحاضر نشر الشروط على صفحة الطلب ليراها المشاركون.', 'The lecturer can publish these terms on the request for interested students.')) : '') + '</article>' +
      '<section class="box"><h2>' + IS.T('محادثة خاصة', 'Private conversation') + '</h2>' +
      messages.map(function (m) { return '<article class="cr-message"><b dir="auto">' + esc(m.user_id === row.user_id ? row.author_name : offer.lecturer_name) +
        '</b> <small class="mut">' + esc(IS.ago(m.created_at)) + '</small><p class="pre" dir="auto">' + esc(m.body) + '</p></article>'; }).join('') +
      contentForm('cr-message', row.id, offer.id, text('رسالة خاصة', 'Private message'), 'body', '', 2000, text('إرسال', 'Send')) + '</section>';
  }

  async function detail(arg, prefix) {
    var parts = String(arg || '').split('/'), id = parts[0];
    if (!/^[\da-f-]{36}$/i.test(id)) return null;
    var row = await DB.one(REQUESTS, id);
    var admin = prefix === 'control-course-request' && IS.can('review');
    if (!row || row.status === 'deleted' || (!isPublic(row) && !admin && row.user_id !== uid())) return null;
    if (prefix === 'course-request' && !IS.inStudySpace(row)) return IS.outsideStudySpace(row);
    var owner = row.user_id === uid(), open = row.status === 'open', published = isPublic(row), offers = [];
    if (published && !admin && (owner || activeLecturer())) {
      var filters = { request_id: row.id };
      if (!owner) filters.lecturer_id = uid();
      offers = await DB.q(OFFERS, { eq: filters, order: ['created_at', false] });
    }
    var showComments = parts[1] === 'comments';
    if (parts[1] && !showComments) {
      var offer = offers.find(function (o) { return o.id === parts[1]; });
      return offer ? offerPage(row, offer, prefix) : null;
    }
    var board = prefix === 'studio-course-request' ? '#studio-course-requests' : admin ? '#control-course-requests' : '#course-requests';
    var r = await Promise.all([
      published && !admin ? DB.q(COMMENTS, { eq: { request_id: id }, order: ['created_at', false], limit: 100 }) : [],
      published && uid() && !owner ? DB.q(MEMBERS, { eq: { request_id: id, user_id: uid() } }) : [],
      published ? publishedOffers(id) : [],
      requestAttachments(id),
      published && row.payment_required && uid() ? DB.q('enrollments', { eq: { request_id: id, user_id: uid() }, order: ['created_at', false] }) : []
    ]);
    var agreement = r[2].find(function (o) { return o.status === 'accepted'; });
    var h = '<nav class="crumb">' + link(board, 'رجوع إلى الطلبات', 'Back to requests', 'link') + '</nav>' +
      '<article class="box cr-detail"><header class="cr-heading"><h1 tabindex="-1" dir="auto">' + esc(row.title) +
      '</h1><div class="row"><span class="mut" dir="auto">' + esc(row.author_name) + ' · ' + esc(scopeName(row)) + '</span>' + status(row) +
      '</div></header>' + publicFacts(row, agreement) + '<section class="cr-request-body"><h2>' + IS.T('تفاصيل الطلب', 'Request details') +
      '</h2><p class="pre" dir="auto">' + esc(row.details) + '</p>' + (agreement ? termsBlock(agreement, true) : '') + requestRules(row) + r[3];
    var proposals = r[2].filter(function (o) { return o.status === 'offered'; });
    if (proposals.length) h += '<section class="cr-public-offers"><h3>' + IS.T('عروض التدريس المنشورة', 'Published teaching offers') + '</h3>' +
      proposals.map(function (o) { return termsBlock(o, false); }).join('') + '</section>';
    h += '</section>';
    if (admin || owner) {
      h += '<div class="row">' +
        (admin && row.status === 'pending' && IS.can('review', 'approve') ? commandButton(row, 'approve', 'وافق وانشر', 'Approve and publish', 'pri') + commandButton(row, 'reject', 'ارفض الطلب', 'Decline request', 'bad') : '') +
        (owner && open ? commandButton(row, 'close', 'أغلق الانضمام', 'Close joining') : '') +
        (!row.reserved_count && (owner || (admin && IS.can('review', 'delete'))) ? commandButton(row, 'delete', 'احذف الطلب', 'Delete request', 'bad') : '') + '</div>';
    }
    if (!published || admin) return h + '</article>';

    h += IS.feedVoteBar('request', row, false, 'course-request/' + row.id) + '<div class="cr-join"><span class="row cr-meta">' + ic('users') + joined(row) + '</span>';
    if (row.payment_required && agreement) {
      var payment = r[4].find(function (entry) { return entry.status === 'active' || entry.status === 'pending'; }), last = r[4][0];
      var full = row.auto_close && row.reserved_count >= row.goal;
      if (payment || last) h += '<span class="row">' + IS.paymentStatus((payment || last).status) + IS.paymentLink(payment || last) + '</span>';
      if (!payment && open && !full && !offers.some(function (offer) { return offer.status === 'accepted' && offer.lecturer_id === uid(); })) {
        h += '<button type="button" class="btn pri sm" data-act="cr-pay" data-id="' + esc(id) + '">' + ic('wallet') +
          (last && last.status === 'rejected' ? text('أرسل إيصالًا جديدًا', 'Submit a new receipt') : text('ادفع للانضمام', 'Pay to join')) + '</button>';
      } else if (!payment && open && full) h += IS.chip(text('كل المقاعد محجوزة', 'All seats reserved'), '');
    } else if (!row.payment_required && !owner && (open || r[1].length)) {
      if (!uid()) h += '<button class="btn pri sm" data-act="login">' + text('سجّل الدخول للانضمام', 'Sign in to join') + '</button>';
      else if (r[1].length) h += commandButton(row, 'leave', 'ألغِ انضمامك', 'Leave request');
      else if (agreement) h += commandButton(row, 'join', 'انضم وفق هذه الشروط', 'Join under these terms', 'pri');
      else h += commandButton(row, 'join', 'أبدِ اهتمامك', 'Register interest', 'pri');
    }
    h += '</div>';
    if (open && row.payment_required) h += note('يتأكد انضمامك بعد مراجعة الإيصال.', 'Your seat is confirmed after the receipt is reviewed.');
    if (open && !agreement) h += note('يمكنك إبداء الاهتمام الآن. يتحدد التسجيل بعد الاتفاق مع المحاضر.', 'You can register interest now. Enrolment opens once the teaching terms are agreed.');
    h += '</article>';
    if (showComments) IS.after = IS.focusPostComments;
    h += '<section class="box post-comments"><h2 tabindex="-1" data-post-comments>' + IS.T('التعليقات', 'Comments') + '</h2>' +
      (open && uid() ? contentForm('cr-comment', id, '', text('اكتب تعليقًا', 'Write a comment'), 'body', '', 2000, text('انشر التعليق', 'Post comment')) : '') +
      r[0].reverse().map(function (c) {
        return '<article class="cr-message"><div class="row sp"><b dir="auto">' + esc(c.author_name) + '</b><small class="mut">' + esc(IS.ago(c.created_at)) +
          '</small></div><p class="pre" dir="auto">' + esc(c.body) + '</p>' +
          IS.reportButton('request_comment', c.id) + (c.user_id === uid() || IS.can('community', 'delete') ? commandButton(row, 'remove_comment', 'احذف التعليق', 'Delete comment', 'bad', c.id) : '') + '</article>';
      }).join('') + '</section>';
    if (canOffer(row)) {
      h += '<section class="box"><h2>' + IS.T('أنا متاح للتدريس', 'I’m available to teach') + '</h2>' +
        note('تظهر هذه الشروط للجميع على الطلب. اذكر السعر والموعد وطريقة التدريس وقواعد المجموعة.', 'Everyone can see these terms on the request. Include your price, schedule, teaching format, and group rules.') +
        contentForm('cr-offer', row.id, '', text('شروط التدريس', 'Teaching terms'), 'terms', offers[0] && offers[0].terms, 4000,
          offers[0] && offers[0].terms_public ? text('حدّث العرض', 'Update offer') : text('انشر العرض', 'Publish offer'),
          priceField('السعر للفرد (جنيه سوداني)', 'Price per person (SDG)', offers[0] && offers[0].price, true) + dateFields(offers[0] && offers[0].starts_at)) + '</section>';
    }
    return h + offerList(row, offers, prefix);
  }
  IS.page('course-request', function (arg) { return detail(arg, 'course-request'); });
  IS.page('studio-course-request', function (arg) { return detail(arg, 'studio-course-request'); }, STUDIO);
  IS.page('control-course-request', function (arg) { return detail(arg, 'control-course-request'); }, CONTROL);

  IS.ACT['cr-pay'] = async function (button) {
    if (!uid()) return IS.ACT.login();
    var id = button.dataset.id, results = await Promise.all([DB.one(REQUESTS, id), IS.requestPaymentQuote(id)]);
    var row = results[0], agreement = results[1];
    if (!row || !agreement) return IS.refresh();
    IS.paymentSheet({ request: id, title: row.title, price: agreement.price, scope: scopeName(row) });
  };
  IS.requestPaymentPreview = async function (id) {
    if (DB.live || !id) return;
    var row = await DB.one(REQUESTS, id), enrolments = await DB.q('enrollments', { eq: { request_id: id } });
    var paid = enrolments.filter(function (entry) { return entry.status === 'active'; }).length;
    var reserved = enrolments.filter(function (entry) { return entry.status === 'active' || entry.status === 'pending'; }).length;
    await DB.upd(REQUESTS, id, { paid_count: paid, reserved_count: reserved, status: row.auto_close && paid >= row.goal ? 'closed' : row.status });
  };
  IS.requestPaymentQuote = async function (id) {
    var row = await DB.one(REQUESTS, id);
    if (!row || !IS.inStudySpace(row) || row.status !== 'open' || !row.payment_required || (row.auto_close && row.reserved_count >= row.goal)) return null;
    var offer = (await publishedOffers(id)).find(function (o) { return o.status === 'accepted' && +o.price > 0; });
    if (!offer) return null;
    if (!DB.live && offer.lecturer_id === uid()) return null;
    return offer;
  };

  IS.ACT['cr-command'] = async function (button) {
    var action = button.dataset.command, id = button.dataset.request;
    var confirm = {
      close: ['هل تريد إغلاق الانضمام إلى هذا الطلب؟', 'Close joining for this request?'],
      delete: ['هل تريد حذف الطلب؟', 'Delete this request?'],
      reject: ['هل تريد رفض نشر الطلب؟', 'Decline publication of this request?'],
      accept: ['هل تريد اعتماد هذه الشروط لتظهر كاتفاق التدريس على الطلب؟', 'Accept these terms as the teaching agreement on the request?'],
      remove_comment: ['هل تريد حذف التعليق؟', 'Delete this comment?']
    }[action];
    button.disabled = true;
    try {
      if (confirm && !(await IS.confirm(A.apply(null, confirm)))) return;
      if (!(await change(action, id, { id: button.dataset.item }))) return;
      if (IS.area === 'control' && ['approve', 'reject', 'delete'].indexOf(action) >= 0) IS.go('control-course-requests');
      else if (action === 'delete') IS.go('course-requests/mine');
      else IS.refresh();
    } finally { button.disabled = false; }
  };
  [['cr-comment', 'comment'], ['cr-offer', 'offer'], ['cr-message', 'message'], ['cr-publish-terms', 'publish_terms']].forEach(function (entry) {
    IS.SUB[entry[0]] = async function (data, form) {
      data.id = form.dataset.item;
      if (data.price !== undefined) {
        if (!validDate(data)) return;
        data.price = data.price === '' ? null : Number(data.price);
        data.starts_at = startAt(data);
      }
      if (entry[1] === 'offer') data.public_terms = true;
      if (await change(entry[1], form.dataset.request, data)) IS.refresh();
    };
  });

  IS.focusPostComments = function (main) {
    var heading = main.querySelector('[data-post-comments]');
    if (!heading) return;
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: 'start' });
  };

  var FEEDBACK = { post: 'posts', request: REQUESTS, file: 'files', announcement: 'notices', course: 'courses', event: 'events', news: 'news' };
  var REACTIONS = [[1, '👍', 'أعجبني', 'Like', 'like'], [-1, '👎', 'لم يعجبني', 'Dislike', 'dislike']];
  var savingVotes = new Set();

  function voteLabel(reaction, count) { return A(reaction[2], reaction[3]) + ' (' + count + ')'; }
  function commentLabel(count) { return A('التعليقات', 'Comments') + ' (' + count + ')'; }
  function voteScore(row) {
    var score = approval(row);
    return { value: score, label: score === '—' ? A('لا توجد تفاعلات بعد', 'No reactions yet') : A('نسبة الإعجاب', 'Approval') + ' ' + score };
  }
  function emoji(symbol, count) {
    return '<span class="feed-emoji-icon" aria-hidden="true">' + symbol + '</span><bdi data-feedback-count>' + count + '</bdi>';
  }
  IS.feedVoteBar = function (kind, row, inline, shareRoute) {
    var id = esc(row.id), count = Number(row[kind === 'post' ? 'n_replies' : 'comment_count']) || 0;
    var label = esc(commentLabel(count)), panelId = 'comments-' + kind + '-' + id;
    var commentRoute = kind === 'request' ? href(row, IS.area === 'studio' ? 'studio-course-request' : 'course-request', 'comments') :
      '#' + (kind === 'file' ? 'file/' : 'post/') + id + '/comments';
    var comment = inline ?
      '<button type="button" class="feed-emoji feed-comment" data-act="feed-comments" aria-expanded="false" aria-controls="' + panelId +
        '" aria-label="' + label + '" title="' + label + '">' + emoji('💬', count) + '</button>' :
      '<a class="feed-emoji feed-comment" data-act="focus-feed-comments" href="' + esc(commentRoute) + '" aria-label="' + label + '" title="' + label + '">' + emoji('💬', count) + '</a>';
    var score = voteScore(row);
    var rating = kind === 'file' || kind === 'series' ? IS.libraryRating(row, true, kind) : '<button type="button" class="feed-grade" data-act="grade-info" data-kind="' + esc(kind) + '" aria-label="' + esc(IS.gradeLabel(row, kind)) +
      '" title="' + esc(IS.gradeLabel(row, kind)) + '">' + IS.gradeInner(row, kind) + '</button>';
    var reaction = row.my_reaction === undefined ? '' : String(Number(row.my_reaction) || 0);
    var key = kind + '/' + row.id;
    var buttons = kind === 'course' ? '' : REACTIONS.map(function (item) {
      var total = Number(row[item[4] + '_count']) || 0, name = esc(voteLabel(item, total));
      var attributes = ' class="feed-emoji feed-' + item[4] + '" aria-label="' + name + '" title="' + name + '"';
      return uid() ? '<button type="button"' + attributes + ' data-act="feed-vote" data-kind="' + kind + '" data-id="' + id +
        '" data-value="' + item[0] + '" aria-pressed="' + (Number(reaction) === item[0]) + '"' +
        (savingVotes.has(uid() + '/' + key) ? ' disabled' : '') + '>' + emoji(item[1], total) + '</button>' :
        '<span' + attributes + ' role="img">' + emoji(item[1], total) + '</span>';
    }).join('');
    var rcount = Number(row.rating_count == null ? row.n_reviews : row.rating_count) || 0;
    var counts = ' data-like="' + (Number(row.like_count) || 0) + '" data-dislike="' + (Number(row.dislike_count) || 0) + '" data-rc="' + rcount +
      '" data-rp="' + (Number(row.rating_points) || Math.round((Number(row.average_rating == null ? row.rating : row.average_rating) || 0) * rcount)) + '"';
    counts += ' data-rated-like="' + (Number(row.rated_like_count) || 0) + '" data-rated-dislike="' + (Number(row.rated_dislike_count) || 0) + '"';
    return '<div class="feed-votes" data-feedback="' + esc(key) + '" data-reaction="' + reaction + '"' + counts +
      (row.status === 'closed' ? ' data-comments-closed' : '') + '><div class="row feed-action-row">' +
      buttons + (kind === 'series' ? '' : comment) + (shareRoute ? IS.shareButton(shareRoute, true) : '') + '<span class="feed-grow"></span>' + rating + (kind === 'series' ? '' : IS.reportButton(kind, row.id, true)) + '</div>' +
      (inline ? '<div class="feed-comment-panel" id="' + panelId + '" hidden></div>' : '') + '</div>';
  };

  IS.ACT['focus-feed-comments'] = function () { IS.focusPostComments(IS.$('#main')); };

  var scoreFields = { like: 'like_count', dislike: 'dislike_count', rc: 'rating_count', rp: 'rating_points',
    ratedLike: 'rated_like_count', ratedDislike: 'rated_dislike_count' };
  function scoreRow(data) {
    var row = {};
    Object.keys(scoreFields).forEach(function (key) { row[scoreFields[key]] = Number(data[key]) || 0; });
    return row;
  }
  /* the score badge follows every like, dislike and star */
  function regrade(bar, values) {
    Object.keys(scoreFields).forEach(function (key) {
      var value = values[scoreFields[key]];
      if (value != null) bar.dataset[key] = Number(value) || 0;
    });
    var row = scoreRow(bar.dataset), kind = bar.dataset.feedback.split('/')[0];
    IS.$$('.feed-grade, .library-rating', bar).forEach(function (b) {
      b.innerHTML = IS.gradeInner(row, kind); b.setAttribute('aria-label', IS.gradeLabel(row, kind)); b.title = IS.gradeLabel(row, kind);
      if (b.matches('.library-rating')) {
        b.dataset.likes = row.like_count;
        b.dataset.dislikes = row.dislike_count;
        b.dataset.count = row.rating_count;
        b.dataset.points = row.rating_points;
        b.dataset.ratedLike = row.rated_like_count;
        b.dataset.ratedDislike = row.rated_dislike_count;
      }
    });
  }
  IS.ACT['grade-info'] = function (button) {
    var bar = button.closest('[data-feedback]'), panel = button.closest('.library-rate-panel');
    var row = bar ? scoreRow(bar.dataset) : panel ? IS.libraryRatingRow(panel.ratingButton) : {};
    var kind = button.dataset.kind, course = kind === 'course', books = kind === 'file' || kind === 'series';
    var g = IS.grade(row, kind);
    var line = function (icon, label, value) { return '<li><span class="gi">' + icon + '</span><span>' + esc(label) + '</span><b>' + value + '</b></li>'; };
    IS.sheet(A('كيف حُسب التقييم', 'How the rating is calculated'), '<div class="ginfo"><div class="feed-grade big">' + IS.gradeInner(row, kind) + '</div><ul>' +
      (course ? '' : line('👍', A('إعجابات', 'Likes'), N(g.likes)) + line('👎', A('عدم إعجاب', 'Dislikes'), N(g.dislikes))) +
      (course || books ? line('⭐', course ? A('تقييمات الطلاب الملتحقين بالكورس', 'Reviews by enrolled students') : A('تقييمات بالنجوم', 'Star ratings'),
        N(g.rc) + (g.rc ? ' · ' + (g.rp / g.rc).toFixed(1) + ' ★' : '')) : '') + '</ul>' +
      '<p class="mut">' + esc(A('يبدأ الحساب من درجة محايدة (٣ من ٥) لتقليل أثر أول تقييم. كلما زاد عدد التقييمات قلّ أثر هذه الدرجة.',
        'The calculation starts with a neutral 3 out of 5 to limit the effect of the first vote. Its influence fades as more people vote.')) + '</p>' +
      (course ? '<p class="note">' + IS.ic('lock') + '<span>' + esc(A('التقييم متاح للطلاب الملتحقين بالكورس من صفحته.', 'Students who joined can rate the course from its page.')) + '</span></p>' :
        '<p class="mut">' + esc(A('الإعجاب يعادل ٥ نجوم، وعدم الإعجاب يعادل نجمة واحدة.', 'A like counts as 5 stars and a dislike counts as 1 star.') +
          (books ? ' ' + A('إذا قيّم القارئ بالنجوم يُحسب تقييمه بالنجوم مرة واحدة بدل التفاعل.', 'If a reader gives stars, their star rating replaces their reaction in the score.') : '')) + '</p>') + '</div>');
  };
  IS.regradeBars = function (key, values) { IS.$$('[data-feedback]').filter(function (bar) { return bar.dataset.feedback === key; }).forEach(function (bar) { regrade(bar, values); }); };
  function patchFeed(kind, id, values, saving) {
    if (kind === 'series' && IS.keepSeriesScore) IS.keepSeriesScore(id, values);
    var key = kind + '/' + id;
    IS.$$('[data-feedback]').filter(function (bar) { return bar.dataset.feedback === key; }).forEach(function (bar) {
      if ('my_reaction' in values) {
        bar.dataset.reaction = Number(values.my_reaction) || 0;
        REACTIONS.forEach(function (item) {
          var button = bar.querySelector('.feed-' + item[4]);
          var total = Math.max(0, Number(values[item[4] + '_count']) || 0);
          var label = voteLabel(item, total);
          button.querySelector('[data-feedback-count]').textContent = total;
          button.setAttribute('aria-label', label);
          button.title = label;
          if (button.matches('button')) {
            button.setAttribute('aria-pressed', Number(values.my_reaction) === item[0]);
            button.disabled = saving;
          }
        });
        // Star votes may replace a reaction. Keep the saved score until that account's change returns.
        if (!saving || kind !== 'file' && kind !== 'series') regrade(bar, values);
      }
      var field = kind === 'post' ? 'n_replies' : 'comment_count';
      if (field in values) {
        var comment = bar.querySelector('.feed-comment'), label = commentLabel(values[field]);
        comment.querySelector('[data-feedback-count]').textContent = values[field];
        comment.setAttribute('aria-label', label);
        comment.title = label;
      }
    });
    var feed = document.querySelector('.section-feed');
    if (feed) feed.dispatchEvent(new CustomEvent('feed-feedback', { detail: { key: key, values: values } }));
  }

  IS.applySeriesScore = function (row) {
    patchFeed('series', row.series_id, row, false);
    if (IS.updateLibraryRating) IS.updateLibraryRating(row.series_id, row, 'series');
  };
  IS.hydrateFeedReactions = function (root) {
    if (IS.hydrateSeriesScores) IS.hydrateSeriesScores(root);
    var user = uid();
    if (!user || IS.OFFPAGE) return;
    var bars = IS.$$('[data-feedback][data-reaction=""]', root);
    Object.keys(FEEDBACK).forEach(function (kind) {
      var matches = bars.filter(function (bar) { return bar.dataset.feedback.startsWith(kind + '/'); });
      if (!matches.length) return;
      var ids = Array.from(new Set(matches.map(function (bar) { return bar.dataset.feedback.split('/')[1]; })));
      var field = kind + '_id';
      DB.q('feed_feedback', { eq: { user_id: user }, in: { [field]: ids }, select: field + ',reaction' }).then(function (rows) {
        if (uid() !== user) return;
        var own = new Map(rows.map(function (item) { return [item[field], Number(item.reaction) || 0]; }));
        matches.forEach(function (bar) {
          if (!bar.isConnected || bar.dataset.reaction !== '') return;
          var id = bar.dataset.feedback.split('/')[1];
          bar.dataset.reaction = own.get(id) || 0;
          IS.$$('[data-act="feed-vote"]', bar).forEach(function (button) {
            button.setAttribute('aria-pressed', Number(button.dataset.value) === Number(bar.dataset.reaction));
          });
        });
      }).catch(function () {});
    });
  };

  IS.feedVote = async function (kind, id, value, action) {
    if (!uid()) return IS.ACT.login();
    var rating = action === 'rate';
    if (kind === 'series') return IS.seriesVote(id, value, rating);
    if (DB.live) {
      var payload = { kind: kind, target: id, value: value };
      var answer = await DB.sb.rpc(rating ? 'ish_rate_file' : 'ish_feed_react',
        rating ? { file: id, stars: value } : payload);
      if (answer.error) throw answer.error;
      return answer.data;
    }
    var fields = { [kind + '_id']: id };
    var row = (await DB.q('feed_feedback', { eq: Object.assign({ user_id: uid() }, fields) }))[0];
    var picked = row && Number(row.reaction) === value ? null : value;
    var update = rating ? { stars: value } : { reaction: picked };
    if (row) await DB.upd('feed_feedback', row.id, update);
    else await DB.ins('feed_feedback', Object.assign({ user_id: uid() }, fields, update));
    var votes = await DB.q('feed_feedback', { eq: fields });
    var counts = {
      like_count: votes.filter(function (vote) { return vote.reaction === 1; }).length,
      dislike_count: votes.filter(function (vote) { return vote.reaction === -1; }).length
    };
    if (kind === 'file') {
      counts.rating_count = votes.filter(function (vote) { return vote.stars; }).length;
      counts.rating_points = votes.reduce(function (total, vote) { return total + (vote.stars || 0); }, 0);
      counts.average_rating = counts.rating_count ? counts.rating_points / counts.rating_count : null;
      counts.rated_like_count = votes.filter(function (vote) { return vote.stars && vote.reaction === 1; }).length;
      counts.rated_dislike_count = votes.filter(function (vote) { return vote.stars && vote.reaction === -1; }).length;
    }
    await DB.upd(FEEDBACK[kind], id, counts);
    return rating ? counts : Object.assign({ my_reaction: picked }, counts);
  };

  IS.ACT['feed-vote'] = async function (button) {
    var kind = button.dataset.kind, id = button.dataset.id, actor = uid();
    if (!actor) return IS.ACT.login();
    var bar = button.closest('[data-feedback]'), key = actor + '/' + bar.dataset.feedback, value = Number(button.dataset.value);
    if (savingVotes.has(key)) return;
    var previous = {
      my_reaction: Number(bar.dataset.reaction) || 0,
      like_count: Number(bar.querySelector('.feed-like [data-feedback-count]').textContent),
      dislike_count: Number(bar.querySelector('.feed-dislike [data-feedback-count]').textContent)
    };
    var next = previous.my_reaction === value ? 0 : value;
    var optimistic = { my_reaction: next };
    REACTIONS.forEach(function (item) {
      var field = item[4] + '_count';
      optimistic[field] = Math.max(0, previous[field] + Number(next === item[0]) - Number(previous.my_reaction === item[0]));
    });
    savingVotes.add(key);
    patchFeed(kind, id, optimistic, true);
    var saved;
    try { saved = await IS.feedVote(kind, id, value); }
    catch (error) { if (uid() === actor) IS.toast(A('تعذّر حفظ التفاعل. حاول مرة أخرى.', 'Could not save your reaction. Try again.'), true); }
    finally {
      savingVotes.delete(key);
      if (uid() === actor) patchFeed(kind, id, saved || previous, false);
    }
  };

  function commentMarkup(row, kind) {
    var report = kind === 'request' ? 'request_comment' : kind === 'file' ? 'file_comment' : 'reply';
    return IS.commentItem({ name: row.author_name || row.name, photo: row.author_photo || row.photo, when: row.created_at ? IS.ago(row.created_at) : A('الآن', 'Now'), body: row.body,
      report: report && row.id ? [report, row.id] : null });
  }

  async function loadComments(panel, kind, id) {
    var entries = panel.querySelector('[data-feed-entries]');
    var table = kind === 'request' ? COMMENTS : kind === 'file' ? 'library_comments' : 'replies';
    var revision = panel.commentRevision = (panel.commentRevision || 0) + 1;
    var limit = Number(panel.dataset.commentLimit) || 30;
    try {
      var rows = await DB.q(table, { eq: { [kind + '_id']: id }, neq: table === 'replies' ? { status: 'removed' } : null,
        order: ['created_at', false], limit: limit });
      if (revision !== panel.commentRevision) return true;
      var earlier = rows.length === limit && limit < 1000 ? '<button type="button" class="link" data-act="earlier-feed-comments">' +
        text('عرض التعليقات السابقة', 'Show earlier comments') + '</button>' : '';
      entries.innerHTML = rows.length ? earlier + rows.reverse().map(function (row) { return commentMarkup(row, kind); }).join('') :
        '<p class="mut">' + text('لا توجد تعليقات بعد.', 'No comments yet.') + '</p>';
      panel.dataset.loaded = 'true';
      return true;
    } catch (error) {
      if (revision === panel.commentRevision && !entries.querySelector('.feed-reply')) entries.innerHTML = '<p class="mut">' +
        text('تعذّر تحميل التعليقات. أغلقها وافتحها للمحاولة مجددًا.', 'Could not load comments. Close and reopen them to retry.') + '</p>';
      return false;
    }
  }

  IS.ACT['feed-comments'] = function (button) {
    var bar = button.closest('[data-feedback]'), [kind,id] = bar.dataset.feedback.split('/');
    var panel = bar.querySelector('.feed-comment-panel');
    panel.hidden = !panel.hidden;
    button.setAttribute('aria-expanded', !panel.hidden);
    if (panel.hidden) return;
    if (!panel.firstChild) {
      var form = uid() && !bar.hasAttribute('data-comments-closed') ?
        '<form class="form feed-comment-form" data-form="feed-comment"><label class="fl"><textarea name="body" rows="2" maxlength="2000" required aria-label="' +
        text('اكتب تعليقًا', 'Write a comment') + '" placeholder="' + text('اكتب تعليقًا…', 'Write a comment…') + '"></textarea></label><button class="btn pri sm">' + ic('send') + text('انشر', 'Post') + '</button></form>' :
        uid() ? '' : '<button type="button" class="btn ghost sm" data-act="login">' + text('سجّل الدخول للتعليق', 'Sign in to comment') + '</button>';
      panel.innerHTML = '<div data-feed-entries aria-live="polite"><p class="mut">' + text('جارٍ تحميل التعليقات…', 'Loading comments…') + '</p></div>' +
        '<p class="msg" data-feed-comment-error role="alert" hidden></p>' + form;
    }
    if (!panel.dataset.loaded && !panel.dataset.loading) {
      panel.dataset.loading = 'true';
      loadComments(panel, kind, id).finally(function () { delete panel.dataset.loading; });
    }
  };
  IS.openFeedComments = function (main) {
    var button = main.querySelector('[data-act="feed-comments"][aria-expanded="false"]');
    if (!button) return;
    IS.ACT['feed-comments'](button);
    button.focus({ preventScroll: true });
    button.scrollIntoView({ block: 'center' });
  };

  IS.ACT['earlier-feed-comments'] = async function (button) {
    var panel = button.closest('.feed-comment-panel'), [kind,id] = panel.closest('[data-feedback]').dataset.feedback.split('/');
    var previous = Number(panel.dataset.commentLimit) || 30;
    panel.dataset.commentLimit = Math.min(previous + 30, 1000);
    button.disabled = true;
    try {
      if (!await loadComments(panel, kind, id)) {
        panel.dataset.commentLimit = previous;
        IS.toast(A('تعذّر تحميل التعليقات السابقة.', 'Could not load earlier comments.'), true);
      }
    } finally { button.disabled = false; }
  };

  IS.SUB['feed-comment'] = async function (data, form) {
    if (!uid()) return IS.ACT.login();
    var body = data.body.trim();
    if (!body) return;
    var bar = form.closest('[data-feedback]'), [kind,id] = bar.dataset.feedback.split('/');
    var panel = form.closest('.feed-comment-panel'), area = panel.querySelector('[data-feed-entries]');
    var error = panel.querySelector('[data-feed-comment-error]'), pending = document.createElement('div');
    error.hidden = true;
    pending.className = 'feed-reply-pending';
    pending.innerHTML = commentMarkup({ name: IS.ME.name, body: body }, kind);
    area.after(pending);
    try {
      if (kind === 'file') await IS.commentOnLibraryFile(id, body);
      else if (kind === 'post') await IS.savePostReply(id, body);
      else if (kind === 'request') {
        if (DB.live) {
          var result = await DB.sb.rpc('ish_course_request', { action: 'comment', request: id, payload: { body: body } });
          if (result.error) throw result.error;
        } else await previewCommand('comment', id, { body: body });
      } else {
        var target = { [kind + '_id']: id };
        await DB.ins('replies', Object.assign({ user_id: uid(), status: 'open', name: IS.ME.name, body: body }, target));
        if (!DB.live) {
          var rows = await DB.q('replies', { eq: Object.assign({ status: 'open' }, target) });
          await DB.upd(FEEDBACK[kind], id, { comment_count: rows.length });
        }
      }
      if (form.elements.body.value.trim() === body) form.elements.body.value = '';
      var count = Number(bar.querySelector('.feed-comment [data-feedback-count]').textContent) + 1;
      patchFeed(kind, id, { [kind === 'post' ? 'n_replies' : 'comment_count']: count }, false);
      if (!await loadComments(panel, kind, id)) area.append(pending);
    } catch (err) {
      error.textContent = err.message === 'request_closed' ? A('هذا الطلب مغلق للتعليقات.', 'This request is closed to comments.') :
        A('تعذّر نشر التعليق. يمكنك المحاولة مرة أخرى.', 'Could not post your comment. Try again.');
      error.hidden = false;
    } finally {
      if (pending.parentNode !== area) pending.remove();
      else pending.classList.remove('feed-reply-pending');
    }
  };
})();
