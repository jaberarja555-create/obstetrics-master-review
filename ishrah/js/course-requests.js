/* Course requests, section previews and private lecturer offers. */
(function () {
  'use strict';
  var A = IS.A, esc = IS.esc, ic = IS.ic, N = IS.N;
  var REQUESTS = 'course_requests', MEMBERS = 'course_request_members', RATINGS = 'course_request_ratings';
  var COMMENTS = 'course_request_comments', OFFERS = 'course_request_offers', MESSAGES = 'course_request_messages';
  var PUBLIC = ['open', 'closed'];
  var TITLES = ['طلبات الكورسات', 'Course requests'];
  function uid() { return IS.ME && IS.ME.id; }
  function activeLecturer() { return IS.LEC && IS.LEC.status === 'active'; }
  function isPublic(row) { return PUBLIC.indexOf(row.status) >= 0; }
  function canOffer(row) { return activeLecturer() && row.user_id !== uid() && (!row.lecturer_id || row.lecturer_id === uid()) && !row.teacher_confirmed; }
  function scope() { return { spec: IS.SPEC, cat: (IS.mySection() || {}).id }; }
  function scopeName(row) { var spec = IS.spec(row.spec), cat = IS.cat(row.cat); return [spec && spec.en, cat && A(cat.ar, cat.en)].filter(Boolean).join(' · '); }
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
    return N(row.joined_count || 0) + (row.goal ? ' / ' + N(row.goal) : '') + ' ' + text('انضموا', 'joined');
  }
  function average(row) {
    return row.rating_count ? N(Math.round(row.rating_points / row.rating_count * 10) / 10) + ' / 5 (' + N(row.rating_count) + ')' : text('بلا تقييمات', 'No ratings');
  }
  function budget(row) {
    var min = row.budget_min == null ? '' : Number(row.budget_min).toLocaleString('en-US');
    var max = row.budget_max == null ? '' : Number(row.budget_max).toLocaleString('en-US');
    if (!min && !max) return A('غير محددة', 'Flexible');
    if (min === max) return min + ' SDG';
    if (!min) return A('حتى ', 'Up to ') + max + ' SDG';
    if (!max) return A('من ', 'From ') + min + ' SDG';
    return min + ' – ' + max + ' SDG';
  }
  function date(row) {
    if (!row.proposed_at) return A('موعد مرن', 'Flexible');
    return new Intl.DateTimeFormat(IS.lang === 'ar' ? 'ar' : 'en-GB', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Khartoum'
    }).format(new Date(row.proposed_at)) + ' · ' + A('بتوقيت السودان', 'Sudan time');
  }
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
      row = await DB.ins(REQUESTS, Object.assign({}, data, { user_id: actor, author_name: IS.ME.name, lecturer_name: target ? target.name : null,
        status: 'pending', teacher_confirmed: false, joined_count: 0, rating_count: 0, rating_points: 0 }));
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
      await DB.upd(REQUESTS, id, { status: action === 'close' ? 'closed' : 'deleted' });
    } else {
      if (!isPublic(row)) throw new Error('request_unavailable');
      if (['join', 'rate', 'comment'].indexOf(action) >= 0 && row.status !== 'open') throw new Error('request_closed');
      if ((action === 'join' || action === 'rate') && owner) throw new Error('request_permission');
      if (action === 'join' || action === 'leave') {
        var member = (await DB.q(MEMBERS, { eq: { request_id: id, user_id: actor } }))[0];
        if (action === 'join' && !member) await DB.ins(MEMBERS, { request_id: id, user_id: actor });
        if (action === 'leave' && member) await DB.del(MEMBERS, member.id);
        var count = (await DB.q(MEMBERS, { eq: { request_id: id } })).length;
        await DB.upd(REQUESTS, id, { joined_count: count, status: row.auto_close && count >= row.goal ? 'closed' : row.status });
      } else if (action === 'rate') {
        var rating = (await DB.q(RATINGS, { eq: { request_id: id, user_id: actor } }))[0];
        if (rating) await DB.upd(RATINGS, rating.id, { stars: data.stars });
        else await DB.ins(RATINGS, { request_id: id, user_id: actor, stars: data.stars });
        var ratings = await DB.q(RATINGS, { eq: { request_id: id } });
        await DB.upd(REQUESTS, id, { rating_count: ratings.length, rating_points: ratings.reduce(function (sum, x) { return sum + x.stars; }, 0) });
      } else if (action === 'comment') {
        await DB.ins(COMMENTS, { request_id: id, user_id: actor, author_name: IS.ME.name, body: data.body });
      } else if (action === 'remove_comment') {
        var comment = await DB.one(COMMENTS, data.id);
        if (comment && comment.request_id === id && (comment.user_id === actor || IS.can('community', 'delete'))) await DB.del(COMMENTS, comment.id);
      } else {
        offers = await DB.q(OFFERS, { eq: { request_id: id } });
        if (action === 'offer') {
          if (!canOffer(row)) throw new Error('request_lecturer');
          offer = offers.find(function (o) { return o.lecturer_id === actor; });
          if (offer) await DB.upd(OFFERS, offer.id, { terms: data.terms, status: 'offered' });
          else offer = await DB.ins(OFFERS, { request_id: id, lecturer_id: actor, lecturer_name: IS.LEC.name, terms: data.terms, status: 'offered' });
          recipient = row.user_id;
          notice = A('عرض تدريس', 'A lecturer sent teaching terms');
        } else {
          offer = offers.find(function (o) { return o.id === data.id; });
          if (!offer || (!owner && offer.lecturer_id !== actor)) throw new Error('request_permission');
          if (action === 'accept') {
            if (!owner || offer.status !== 'offered') throw new Error('request_permission');
            for (var other of offers) await DB.upd(OFFERS, other.id, { status: other.id === offer.id ? 'accepted' : 'declined' });
            await DB.upd(REQUESTS, id, { teacher_confirmed: true });
            recipient = offer.lecturer_id;
            notice = A('قُبل عرض التدريس', 'Your teaching offer was accepted');
          } else if (action === 'message') {
            await DB.ins(MESSAGES, { offer_id: offer.id, user_id: actor, body: data.body });
            recipient = owner ? offer.lecturer_id : row.user_id;
            notice = A('رسالة عن عرض تدريس', 'New teaching offer message');
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
      '</span><span>' + ic('star') + average(row) + '</span></div></article>';
  }
  IS.sectionCourseRequests = function (limit) { return publicRows(scope(), limit); };

  async function form(selected) {
    var section = IS.mySection();
    var results = await Promise.all([DB.q('lecturers', { eq: { status: 'active' }, order: ['name'] }), IS.pubCourses(true)]);
    var teaching = new Set(results[1].map(function (c) { return c.lecturer_id; }));
    var inSection = new Set(results[1].filter(IS.inStudySpace).map(function (c) { return c.lecturer_id; }));
    var lecturers = results[0].filter(function (l) { return l.id !== uid() && (!teaching.has(l.id) || inSection.has(l.id)); });
    return IS.banner(IS.T('اطلب كورسًا', 'Request a course'), esc(scopeName(scope())), 'chat') +
      '<form class="box form" data-form="cr-create">' +
      '<label class="fl"><span>' + text('عنوان الكورس', 'Course title') + '</span><input name="title" required maxlength="140"></label>' +
      '<label class="fl"><span>' + text('ماذا تريد أن يغطي الكورس؟', 'What should the course cover?') + '</span><textarea name="details" required rows="3" maxlength="4000"></textarea></label>' +
      '<label class="fl"><span>' + text('المحاضر', 'Lecturer') + '</span><select name="lecturer"><option value="">' + text('طلب عام لأي محاضر متاح', 'General request for any available lecturer') + '</option>' +
        lecturers.map(function (l) { return '<option value="' + esc(l.id) + '"' + (l.id === selected ? ' selected' : '') + '>' + esc(l.name) + '</option>'; }).join('') + '</select></label>' +
      '<div class="g2f"><label class="fl"><span>' + text('أقل سعر للفرد (جنيه سوداني)', 'Minimum price per person (SDG)') + '</span><input name="min" type="number" min="0" max="9999999999" step=".01"></label>' +
      '<label class="fl"><span>' + text('أعلى سعر للفرد (جنيه سوداني)', 'Maximum price per person (SDG)') + '</span><input name="max" type="number" min="0" max="9999999999" step=".01"></label>' +
      '<label class="fl"><span>' + text('التاريخ المقترح', 'Proposed date') + '</span><input type="date" name="date" min="2000-01-02" max="2199-12-31"></label>' +
      '<label class="fl"><span>' + text('الوقت المقترح (بتوقيت السودان)', 'Proposed time (Sudan time)') + '</span><input type="time" name="time"></label></div>' +
      '<label class="fl"><span>' + text('القواعد أو المتطلبات للمشاركين', 'Rules or requirements for participants') + '</span><textarea name="rules" rows="3" maxlength="2000"></textarea></label>' +
      '<label class="fl"><span>' + text('العدد المستهدف من المشاركين (اختياري)', 'Target number of participants (optional)') + '</span><input name="goal" type="number" min="1" max="10000"></label>' +
      '<label class="chk"><input type="checkbox" name="auto_close"><span>' + text('أغلق الانضمام تلقائيًا عند بلوغ العدد المستهدف', 'Close joining automatically at the target') + '</span></label>' +
      note('يُنشر الطلب بعد مراجعته. اترك بيانات الاتصال وروابط الاجتماعات خارج المنشور العام.', 'The request becomes public after review. Keep contact details and meeting links out of the public post.') +
      '<div class="row end">' + link('#course-requests', 'إلغاء', 'Cancel') + '<button class="btn pri"' + (section ? '' : ' disabled') + '>' +
      text('إرسال للموافقة', 'Send for approval') + '</button></div></form>';
  }
  IS.SUB['cr-create'] = async function (d, f) {
    var minimum = d.min === '' ? null : Number(d.min), maximum = d.max === '' ? null : Number(d.max);
    if (minimum != null && maximum != null && minimum > maximum) return IS.toast(A('الحد الأعلى أقل من الحد الأدنى.', 'The maximum price must be at least the minimum.'), true);
    if (!!d.date !== !!d.time) return IS.toast(A('أدخل التاريخ والوقت معًا.', 'Enter both the date and the time.'), true);
    var goal = d.goal ? Number(d.goal) : null, auto = f.elements.auto_close.checked;
    if (auto && !goal) return IS.toast(A('أدخل العدد المستهدف أولًا.', 'Enter a target number first.'), true);
    var id = await change('create', null, Object.assign(scope(), {
      title: d.title, details: d.details, rules: d.rules, lecturer_id: d.lecturer || null, budget_min: minimum, budget_max: maximum,
      proposed_at: d.date ? d.date + 'T' + d.time + ':00+02:00' : null, goal: goal, auto_close: auto
    }));
    if (id) {
      IS.toast(A('أُرسل الطلب للموافقة', 'Request sent for approval'));
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
    return IS.banner(IS.T('مراجعة طلبات الكورسات', 'Course request review'), esc(A('تظهر الطلبات للطلاب بعد الموافقة عليها.', 'Requests appear to students after approval.')), 'eye') +
      (rows.length ? '<div class="grid g3 cr-grid">' + rows.map(function (r) { return requestCard(r, 'control-course-request'); }).join('') + '</div>' :
        IS.empty('eye', A('لا توجد طلبات بانتظار المراجعة', 'No requests awaiting review')));
  }, CONTROL);

  function publicFacts(row) {
    var list = [[A('المحاضر', 'Lecturer'), row.lecturer_name || A('طلب عام', 'General request')],
      [A('السعر المقترح للفرد', 'Proposed price per person'), budget(row)], [A('الموعد المقترح', 'Proposed date and time'), date(row)]];
    return '<ul class="kv">' + list.map(function (item) { return '<li><span>' + esc(item[0]) + '</span><b dir="auto">' + esc(item[1]) + '</b></li>'; }).join('') + '</ul>' +
      (row.rules ? '<h3>' + text('قواعد الانضمام', 'Joining rules') + '</h3><p class="pre" dir="auto">' + esc(row.rules) + '</p>' : '') +
      '<div class="row cr-meta"><span>' + ic('users') + joined(row) + '</span><span>' + ic('star') + average(row) + '</span></div>';
  }
  function contentForm(name, request, item, label, field, value, maxlength, submit) {
    return '<form class="form" data-form="' + name + '" data-request="' + esc(request) + '"' + (item ? ' data-item="' + esc(item) + '"' : '') + '>' +
      '<label class="fl"><span>' + label + '</span><textarea name="' + field + '" required maxlength="' + maxlength + '" rows="3">' + esc(value || '') + '</textarea></label>' +
      '<div class="row end"><button class="btn pri sm">' + submit + '</button></div></form>';
  }
  function offerList(row, offers, prefix) {
    if (!offers.length) return '';
    return '<section class="box"><h2>' + IS.T('عروض التدريس الخاصة', 'Private teaching offers') + '</h2><div class="list">' +
      offers.map(function (o) { return '<a class="li" href="' + href(row, prefix, o.id) + '">' + ic('mail') + '<span><b dir="auto">' + esc(o.lecturer_name) +
        '</b><small>' + offerStatus(o) + '</small></span>' + ic('chev', 'fl') + '</a>'; }).join('') + '</div></section>';
  }
  function offerStatus(o) {
    return o.status === 'accepted' ? text('مقبول', 'Accepted') : o.status === 'declined' ? text('اختير عرض آخر', 'Another offer was chosen') : text('بانتظار الرد', 'Awaiting decision');
  }
  async function offerPage(row, offer, prefix) {
    var messages = (await DB.q(MESSAGES, { eq: { offer_id: offer.id }, order: ['created_at', false], limit: 100 })).reverse();
    var owner = row.user_id === uid();
    return '<nav class="crumb">' + link(href(row, prefix), 'رجوع إلى الطلب', 'Back to request', 'link') + '</nav>' +
      '<article class="box cr-detail"><h1 tabindex="-1">' + IS.T('عرض تدريس خاص', 'Private teaching offer') + '</h1><p class="mut" dir="auto">' +
      esc(row.title) + ' · ' + esc(offer.lecturer_name) + '</p><div class="row">' + IS.chip(offerStatus(offer), offer.status === 'accepted' ? 'ok' : '') +
      '</div><h2>' + IS.T('شروط المحاضر', 'Lecturer’s terms') +
      '</h2><p class="pre" dir="auto">' + esc(offer.terms) + '</p>' +
      (owner && offer.status === 'offered' ? commandButton(row, 'accept', 'اقبل العرض', 'Accept offer', 'pri', offer.id) : '') + '</article>' +
      '<section class="box"><h2>' + IS.T('ناقش الشروط', 'Discuss the terms') + '</h2>' +
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
    if (parts[1]) {
      var offer = offers.find(function (o) { return o.id === parts[1]; });
      return offer ? offerPage(row, offer, prefix) : null;
    }
    var board = prefix === 'studio-course-request' ? '#studio-course-requests' : admin ? '#control-course-requests' : '#course-requests';
    var h = '<nav class="crumb">' + link(board, 'رجوع إلى الطلبات', 'Back to requests', 'link') + '</nav>' +
      '<article class="box cr-detail"><div class="row">' + status(row) + (row.teacher_confirmed ? IS.chip(text('تأكد المحاضر', 'Lecturer confirmed'), 'ok') : '') +
      '</div><h1 tabindex="-1" dir="auto">' + esc(row.title) + '</h1><p class="mut" dir="auto">' + esc(row.author_name) + ' · ' + esc(scopeName(row)) +
      '</p><p class="pre" dir="auto">' + esc(row.details) + '</p>' + publicFacts(row);
    if (admin || owner) {
      h += '<div class="row">' +
        (admin && row.status === 'pending' && IS.can('review', 'approve') ? commandButton(row, 'approve', 'وافق وانشر', 'Approve and publish', 'pri') + commandButton(row, 'reject', 'ارفض الطلب', 'Decline request', 'bad') : '') +
        (owner && open ? commandButton(row, 'close', 'أغلق الانضمام', 'Close joining') : '') +
        (owner || (admin && IS.can('review', 'delete')) ? commandButton(row, 'delete', 'احذف الطلب', 'Delete request', 'bad') : '') + '</div>';
    }
    if (!published || admin) return h + '</article>';

    var r = await Promise.all([
      DB.q(COMMENTS, { eq: { request_id: id }, order: ['created_at', false], limit: 100 }),
      uid() && !owner ? DB.q(MEMBERS, { eq: { request_id: id, user_id: uid() } }) : [],
      uid() && !owner && open ? DB.q(RATINGS, { eq: { request_id: id, user_id: uid() } }) : []
    ]);
    if (!owner && (open || r[1].length)) {
      h += '<div class="row">' + (uid() ? r[1].length ? commandButton(row, 'leave', 'ألغِ انضمامك', 'Leave request') :
        commandButton(row, 'join', 'انضم إلى الطلب', 'Join request', 'pri') :
        '<button class="btn pri sm" data-act="login">' + text('سجّل الدخول للانضمام', 'Sign in to join') + '</button>') + '</div>';
      if (open) h += note('الانضمام يعني إبداء الاهتمام. الدفع والتسجيل في الكورس لاحقًا.', 'Joining registers interest. Course enrolment and payment come later.');
    }
    if (!owner && uid() && open) {
      h += '<form class="form cr-rating" data-form="cr-rate" data-request="' + esc(id) + '"><label class="fl"><span>' + text('قيّم فكرة الكورس', 'Rate the course idea') +
        '</span><select name="stars" required><option value="">' + text('اختر تقييمًا', 'Choose a rating') + '</option>' +
        [5, 4, 3, 2, 1].map(function (n) { return '<option value="' + n + '"' + (r[2][0] && r[2][0].stars === n ? ' selected' : '') + '>' + N(n) + ' / 5</option>'; }).join('') +
        '</select></label><button class="btn ghost sm">' + text('احفظ التقييم', 'Save rating') + '</button></form>';
    }
    h += IS.feedVoteBar('request', row, true) + '</article>';
    if (canOffer(row)) {
      h += '<section class="box"><h2>' + IS.T('أنا متاح للتدريس', 'I’m available to teach') + '</h2>' +
        note('يرى صاحب الطلب وحده عرضك. اذكر السعر والموعد وطريقة التدريس وشروطك.', 'Only the requester can see your offer. Include your price, availability, teaching format, and terms.') +
        contentForm('cr-offer', row.id, '', text('شروط التدريس', 'Teaching terms'), 'terms', offers[0] && offers[0].terms, 4000,
          offers.length ? text('حدّث العرض', 'Update offer') : text('أرسل العرض', 'Send offer')) + '</section>';
    }
    h += offerList(row, offers, prefix);
    return h + '<section class="box"><h2>' + IS.T('التعليقات', 'Comments') + '</h2>' +
      (r[0].length ? r[0].reverse().map(function (c) {
        return '<article class="cr-message"><div class="row sp"><b dir="auto">' + esc(c.author_name) + '</b><small class="mut">' + esc(IS.ago(c.created_at)) +
          '</small></div><p class="pre" dir="auto">' + esc(c.body) + '</p>' +
          (c.user_id === uid() || IS.can('community', 'delete') ? commandButton(row, 'remove_comment', 'احذف التعليق', 'Delete comment', 'bad', c.id) : '') + '</article>';
      }).join('') : note('لا توجد تعليقات بعد.', 'No comments yet.')) +
      (open && uid() ? contentForm('cr-comment', id, '', text('تعليق عام', 'Public comment'), 'body', '', 2000, text('انشر التعليق', 'Post comment')) : '') + '</section>';
  }
  IS.page('course-request', function (arg) { return detail(arg, 'course-request'); });
  IS.page('studio-course-request', function (arg) { return detail(arg, 'studio-course-request'); }, STUDIO);
  IS.page('control-course-request', function (arg) { return detail(arg, 'control-course-request'); }, CONTROL);

  IS.ACT['cr-command'] = async function (button) {
    var action = button.dataset.command, id = button.dataset.request;
    var confirm = {
      close: ['هل تريد إغلاق الانضمام إلى هذا الطلب؟', 'Close joining for this request?'],
      delete: ['هل تريد حذف الطلب؟', 'Delete this request?'],
      reject: ['هل تريد رفض نشر الطلب؟', 'Decline publication of this request?'],
      accept: ['هل تريد قبول عرض هذا المحاضر؟', 'Accept this lecturer’s offer?'],
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
  [['cr-rate', 'rate'], ['cr-comment', 'comment'], ['cr-offer', 'offer'], ['cr-message', 'message']].forEach(function (entry) {
    IS.SUB[entry[0]] = async function (data, form) {
      data.id = form.dataset.item;
      if (data.stars) data.stars = Number(data.stars);
      if (await change(entry[1], form.dataset.request, data)) IS.refresh();
    };
  });

  IS.feedVoteBar = function (kind, row, detail) {
    function vote(value, ar, en, icon, count) {
      var label = text(ar, en);
      var contents = ic(icon) + '<span>' + label + '</span>' + N(count || 0);
      return uid() ? '<button type="button" class="btn ghost sm" data-act="feed-vote" data-kind="' + kind + '" data-id="' + esc(row.id) +
        '" data-value="' + value + '">' + contents + '</button>' : '<span class="feed-vote-count">' + contents + '</span>';
    }
    var result = '<div class="feed-votes"><div class="row">' + vote(1, 'أعجبني', 'Like', 'check', row.like_count) +
      vote(-1, 'لم يعجبني', 'Dislike', 'x', row.dislike_count) +
      (detail && kind === 'request' ? '' : '<span class="feed-vote-count">' + ic('star') + average(row) + '</span>');
    if (!detail) result += link('#' + (kind === 'post' ? 'post/' : 'course-request/') + row.id, 'التعليقات والتقييم', 'Comments and rating', 'link');
    result += '</div>';
    if (detail && kind === 'post' && uid() && uid() !== row.user_id) {
      result += '<form class="form cr-rating" data-form="post-rating" data-id="' + esc(row.id) + '"><label class="fl"><span>' + text('قيّم المنشور', 'Rate this post') +
        '</span><select name="stars" required><option value="">' + text('اختر تقييمًا', 'Choose a rating') + '</option>' +
        [5, 4, 3, 2, 1].map(function (n) { return '<option value="' + n + '">' + n + ' / 5</option>'; }).join('') +
        '</select></label><button class="btn ghost sm">' + text('احفظ التقييم', 'Save rating') + '</button></form>';
    }
    return result + '</div>';
  };
  async function feedVote(kind, id, action, value) {
    if (!uid()) return IS.ACT.login();
    if (DB.live) {
      var answer = await DB.sb.rpc('ish_feed_vote', { kind: kind, target: id, action: action, value: value });
      if (answer.error) throw answer.error;
    } else {
      var parent = kind === 'post' ? 'posts' : REQUESTS;
      var fields = kind === 'post' ? { post_id: id } : { request_id: id };
      var row = (await DB.q('feed_feedback', { eq: Object.assign({ user_id: uid() }, fields) }))[0];
      var update = action === 'react' ? { reaction: row && row.reaction === value ? null : value } : { stars: value };
      if (row) await DB.upd('feed_feedback', row.id, update);
      else await DB.ins('feed_feedback', Object.assign({ user_id: uid() }, fields, update));
      var votes = await DB.q('feed_feedback', { eq: fields });
      var stats = { like_count: votes.filter(function (v) { return v.reaction === 1; }).length, dislike_count: votes.filter(function (v) { return v.reaction === -1; }).length };
      if (kind === 'post') {
        stats.rating_count = votes.filter(function (v) { return v.stars; }).length;
        stats.rating_points = votes.reduce(function (total, v) { return total + (v.stars || 0); }, 0);
      }
      await DB.upd(parent, id, stats);
    }
    IS.refresh();
  }
  IS.ACT['feed-vote'] = async function (button) {
    button.disabled = true;
    try { await feedVote(button.dataset.kind, button.dataset.id, 'react', Number(button.dataset.value)); }
    finally { button.disabled = false; }
  };
  IS.SUB['post-rating'] = function (data, form) { return feedVote('post', form.dataset.id, 'rate', Number(data.stars)); };
})();
