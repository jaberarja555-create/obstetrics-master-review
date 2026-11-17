/* اشرح لي: the platform's organisation (owner, 17 Nov 2026).
   - Messages and support tickets inside the platform (no WhatsApp): every request goes to the department that answers it.
   - A dashboard for every role (owner/GM overview, finance, academic, content, community, support, technical, staff).
   - Tasks: a manager assigns tasks to the staff of the department; staff see only their own work.
   - Users & permissions: staff accounts (role, department, direct manager, approval level, 2FA, status), an editable permission matrix
     (view · add · edit · delete · approve), the hierarchy and the activity log.
   - Two-factor login (TOTP authenticator app) for admin accounts. The database checks it too (supabase/002_org.sql). */
(function () {
  'use strict';
  var A = IS.A, esc = IS.esc, ic = IS.ic, N = IS.N, $ = IS.$;
  var O = { area: 'control', auth: true };
  function P(perm) { return Object.assign({ perm: perm }, O); }
  function me() { return IS.ME; }
  function uid() { return IS.ME && IS.ME.id; }
  function role(t) { return IS.ROLES.filter(function (r) { return r[0] === t; })[0]; }
  function deptName(d) { var x = IS.DEPTS.filter(function (y) { return y[0] === d; })[0]; return x ? A(x[1], x[2]) : '—'; }
  function top() { var t = (me() && me().team) || []; return t.indexOf('owner') >= 0 || t.indexOf('gm') >= 0; }
  function mainRole() { var t = (me() && me().team) || []; return ['owner', 'gm', 'finance', 'academic', 'content', 'community', 'support', 'tech', 'staff'].filter(function (r) { return t.indexOf(r) >= 0; })[0] || (t.some(function (x) { return x.indexOf('p:') === 0; }) ? 'staff' : ''); }
  IS.mainRole = mainRole;

  /* ======================= TICKETS (messages to the platform) ======================= */
  var KINDS = IS.TKINDS = [['general', 'استفسار عام', 'General question', 'support', 'help'], ['payment', 'مشكلة في الدفع أو الاشتراك', 'Payment or enrolment problem', 'finance', 'wallet'],
    ['refund', 'طلب استرداد مبلغ', 'Refund request', 'finance', 'money'], ['course', 'طلب كورس أو مادة', 'Request a course or subject', 'academic', 'layers'],
    ['lecturer', 'اقتراح محاضر', 'Suggest a lecturer', 'academic', 'users'], ['content', 'ملاحظة على محتوى', 'Comment on content', 'academic', 'file'],
    ['event', 'اقتراح فعالية', 'Suggest an event', 'community', 'cal'], ['tech', 'مشكلة تقنية في التطبيق', 'Technical problem', 'tech', 'gear'],
    ['complaint', 'شكوى', 'Complaint', 'support', 'flag'], ['password', 'نسيت كلمة المرور', 'Forgot password', 'support', 'lock']];
  function kind(k) { return KINDS.filter(function (x) { return x[0] === k; })[0] || KINDS[0]; }
  IS.tstatus = function (s) { var m = { open: ['جديدة', 'New', 'warn'], waiting: ['بانتظار ردك', 'Awaiting your reply', 'ok'], answered: ['تم الرد', 'Answered', 'ok'], closed: ['مغلقة', 'Closed', ''] }[s] || [s, s, ''];
    return IS.chip(esc(A(m[0], m[1])), 'st ' + m[2]); };
  /* new ticket form, used by students, lecturers and from the sign-in sheet (forgot password) */
  IS.newTicket = function (k, extra) {
    extra = extra || {}; var signed = !!me();
    IS.sheet(esc(A('رسالة إلى فريق المنصة', 'Message the platform team')), '<form class="form" data-form="ticket">' +
      '<label class="fl"><span>' + esc(A('نوع الرسالة', 'Type')) + '</span><select name="kind">' + KINDS.filter(function (x) { return signed || x[0] === 'password'; }).map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === k ? ' selected' : '') + '>' + esc(A(x[1], x[2])) + '</option>'; }).join('') + '</select></label>' +
      (signed ? '' : '<label class="fl"><span>' + esc(A('اسمك', 'Your name')) + ' *</span><input name="name" required></label><label class="fl"><span>' + esc(A('رقم الهاتف المسجّل', 'Registered phone number')) + ' *</span><input name="phone" required inputmode="tel" dir="ltr"></label>') +
      '<label class="fl"><span>' + esc(A('الموضوع', 'Subject')) + ' *</span><input name="subject" required maxlength="140" value="' + esc(extra.subject || '') + '"></label>' +
      (extra.course ? '<input type="hidden" name="course" value="' + esc(extra.course) + '">' : '') +
      '<label class="fl"><span>' + esc(A('التفاصيل', 'Details')) + ' *</span><textarea name="body" rows="5" required maxlength="4000"></textarea></label>' +
      '<p class="note">' + ic('shield') + '<span>' + esc(A('تصل رسالتك إلى القسم المختص داخل المنصة، ويصلك الرد في «الدعم والرسائل» وفي الإشعارات.', 'Your message reaches the right department inside the platform; the answer arrives in “Support & messages” and in your notifications.')) + '</span></p>' +
      '<button class="btn pri wide">' + ic('send') + esc(A('إرسال', 'Send')) + '</button></form>');
  };
  IS.SUB.ticket = async function (d) {
    var k = kind(d.kind), m = me(), now = new Date().toISOString();
    if (!m && DB.live) { await DB.sb.rpc('ish_reset_request', { p_name: d.name, p_phone: DB.digits(d.phone), p_subject: d.subject, p_body: d.body }).then(function (r) { if (r.error) throw new Error(r.error.message); });
      IS.closeSheet(); IS.toast(A('وصل طلبك. سيتواصل معك فريق الدعم على رقمك.', 'Request received. Support will contact you on your number.')); return; }
    var t = await DB.ins('tickets', { user_id: m ? m.id : null, name: m ? m.name : d.name, phone: m ? (m.phone || '') : DB.digits(d.phone), kind: k[0], dept: k[3], subject: d.subject, course_id: d.course || null,
      status: 'open', last_by: 'user', updated_at: now });
    await DB.ins('ticket_msgs', { ticket_id: t.id, user_id: m ? m.id : null, name: m ? m.name : d.name, staff: false, body: d.body });
    IS.closeSheet(); IS.toast(m ? A('وصلت رسالتك. سيصلك الرد هنا.', 'Message sent. The answer will come here.') : A('وصل طلبك. سيتواصل معك فريق الدعم على رقمك.', 'Request received. Support will contact you on your number.'));
    if (m) IS.go('ticket/' + t.id);
  };
  IS.ACT.ticket = function (b) { if (!me() && b.getAttribute('data-k') !== 'password') return IS.ACT.login(); IS.newTicket(b.getAttribute('data-k') || 'general', { subject: b.getAttribute('data-s') || '', course: b.getAttribute('data-c') || '' }); };
  IS.page('support', async function () {
    var ts = await DB.q('tickets', { eq: { user_id: uid() }, order: ['updated_at', false] });
    return IS.banner(esc(A('الدعم والرسائل', 'Support & messages')), esc(A('راسل فريق المنصة مباشرة: استفسار، مشكلة في الدفع، طلب كورس، أو أي ملاحظة.', 'Write to the platform team: a question, a payment problem, a course request or any comment.')), 'chat', '<button class="btn gold" data-act="ticket">' + ic('plus') + esc(A('رسالة جديدة', 'New message')) + '</button>') +
      '<section class="kgrid">' + KINDS.filter(function (k) { return k[0] !== 'password'; }).map(function (k) { return '<button class="kbtn" data-act="ticket" data-k="' + k[0] + '">' + ic(k[4]) + '<span>' + esc(A(k[1], k[2])) + '</span></button>'; }).join('') + '</section>' +
      '<section class="sec"><header class="sh"><h2>' + ic('mail') + esc(A('رسائلي', 'My messages')) + '</h2></header>' + (ts.length ? '<div class="list">' + ts.map(function (t) { var k = kind(t.kind);
        return '<a class="li' + (t.status === 'waiting' ? ' new' : '') + '" href="#ticket/' + t.id + '">' + ic(k[4]) + '<span><b>' + esc(t.subject) + '</b><small>' + esc(A(k[1], k[2])) + ' · ' + esc(deptName(t.dept)) + '</small></span>' + IS.tstatus(t.status === 'waiting' ? 'answered' : t.status) + '<em>' + esc(IS.ago(t.updated_at || t.created_at)) + '</em></a>'; }).join('') + '</div>' :
        IS.empty('chat', A('لا توجد رسائل بعد', 'No messages yet'), A('اختر نوع رسالتك من الأعلى.', 'Choose the type of your message above.'))) + '</section>';
  }, { auth: true });
  async function thread(id, staff) {
    var t = await DB.one('tickets', id); if (!t) return null;
    if (!staff && t.user_id !== uid()) return null;
    var ms = await DB.q('ticket_msgs', { eq: { ticket_id: id }, order: ['created_at'] }), k = kind(t.kind), team = staff ? (await DB.q('profiles')).filter(function (u) { return (u.team || []).length && (top() || u.dept === t.dept || (u.team || []).indexOf(t.dept) >= 0); }) : [];
    var h = '<nav class="crumb"><a href="#' + (staff ? 'control-tickets' : 'support') + '">' + esc(staff ? A('صندوق الرسائل', 'Inbox') : A('الدعم والرسائل', 'Support & messages')) + '</a>' + ic('chev', 'fl') + '<span>' + esc(t.subject) + '</span></nav>' +
      '<header class="fhead"><div><h1 tabindex="-1">' + esc(t.subject) + '</h1><p class="mut">' + ic(k[4]) + ' ' + esc(A(k[1], k[2])) + ' · ' + esc(deptName(t.dept)) + (staff ? ' · ' + esc(t.name || '') + (t.phone ? ' · <bdi>' + esc(t.phone) + '</bdi>' : '') : '') + (t.assigned_name ? ' · ' + esc(A('مسند إلى ', 'Assigned to ')) + esc(t.assigned_name) : '') + '</p></div>' + IS.tstatus(t.status) + '</header>';
    h += '<div class="chat">' + ms.map(function (m) { return '<div class="cmsg' + (m.staff ? ' st' : '') + '">' + IS.av({ name: m.name }, 'sm') + '<div><b>' + esc(m.staff ? (staff ? m.name : A('فريق اشرح لي', 'Ishrah Li team') + ' · ' + m.name) : m.name) + '</b><p class="pre">' + esc(m.body) + '</p><small>' + esc(IS.ago(m.created_at)) + '</small></div></div>'; }).join('') + '</div>';
    if (t.status !== 'closed') h += '<form class="box form" data-form="treply"><input type="hidden" name="id" value="' + t.id + '"><input type="hidden" name="staff" value="' + (staff ? 1 : '') + '"><textarea name="body" rows="3" required maxlength="4000" placeholder="' + esc(A('اكتب ردك…', 'Write your reply…')) + '"></textarea>' +
      '<div class="row sp"><div class="row">' + (staff && IS.can('tickets', 'edit') ? '<select class="sel" data-assign="' + t.id + '"><option value="">' + esc(A('إسناد إلى…', 'Assign to…')) + '</option>' + team.map(function (u) { return '<option value="' + u.id + '"' + (t.assigned_to === u.id ? ' selected' : '') + '>' + esc(u.name) + '</option>'; }).join('') + '</select>' : '') +
      (staff && t.kind === 'refund' && t.course_id && IS.can('pay', 'approve') ? '<button type="button" class="btn ghost sm" data-act="refund" data-id="' + t.id + '">' + ic('money') + esc(A('اعتماد الاسترداد', 'Approve refund')) + '</button>' : '') +
      (staff && t.kind === 'password' && IS.can('students', 'edit') ? '<button type="button" class="btn ghost sm" data-act="tpass" data-id="' + t.id + '">' + ic('lock') + esc(A('تعيين كلمة مرور مؤقتة', 'Set a temporary password')) + '</button>' : '') +
      '<button type="button" class="btn ghost sm" data-act="tclose" data-id="' + t.id + '">' + ic('checkc') + esc(A('إغلاق المحادثة', 'Close')) + '</button></div><button class="btn pri">' + ic('send') + esc(A('إرسال', 'Send')) + '</button></div></form>';
    else h += '<p class="note">' + ic('checkc') + '<span>' + esc(A('أُغلقت هذه المحادثة. يمكنك فتح رسالة جديدة متى احتجت.', 'This conversation is closed. You can open a new message any time.')) + '</span></p>';
    IS.after = function () { var s = $('[data-assign]'); if (s) s.onchange = async function () { if (!s.value) return; var u = team.filter(function (x) { return x.id === s.value; })[0];
      await DB.upd('tickets', t.id, { assigned_to: u.id, assigned_name: u.name }); IS.notify(u.id, A('أُسندت إليك رسالة', 'A message was assigned to you'), t.subject, '#control-ticket/' + t.id); IS.audit(A('إسناد رسالة', 'assign ticket'), t.subject + ' → ' + u.name); IS.toast(A('أُسندت', 'Assigned')); }; };
    return h;
  }
  IS.page('ticket', function (id) { return thread(id, false); }, { auth: true });
  IS.page('control-ticket', function (id) { return thread(id, true); }, P('tickets'));
  IS.SUB.treply = async function (d) {
    var t = await DB.one('tickets', d.id), staff = !!d.staff; await DB.ins('ticket_msgs', { ticket_id: t.id, user_id: uid(), name: me().name, staff: staff, body: d.body });
    await DB.upd('tickets', t.id, { status: staff ? 'waiting' : 'open', last_by: staff ? 'staff' : 'user', updated_at: new Date().toISOString(), assigned_to: t.assigned_to || (staff ? uid() : null), assigned_name: t.assigned_name || (staff ? me().name : '') });
    if (staff && t.user_id) IS.notify(t.user_id, A('رد من فريق اشرح لي', 'Reply from the Ishrah Li team'), t.subject, '#ticket/' + t.id);
    if (!staff && t.assigned_to) IS.notify(t.assigned_to, A('رد جديد من الطالب', 'New reply from the student'), t.subject, '#control-ticket/' + t.id);
    if (staff) IS.audit(A('رد على رسالة', 'reply to ticket'), t.subject); IS.refresh();
  };
  IS.ACT.tclose = async function (b) { var t = await DB.upd('tickets', b.getAttribute('data-id'), { status: 'closed', updated_at: new Date().toISOString() }); if (IS.area === 'control') IS.audit(A('إغلاق رسالة', 'close ticket'), t.subject); IS.refresh(); };
  IS.ACT.tpass = async function (b) {
    var t = await DB.one('tickets', b.getAttribute('data-id')), us = await DB.q('profiles'), u = us.filter(function (x) { return x.phone && DB.digits(x.phone) === DB.digits(t.phone); })[0];
    if (!u) return IS.toast(A('لا يوجد حساب بهذا الرقم.', 'No account has this phone number.'), true);
    var p = await IS.ask(A('كلمة مرور مؤقتة لـ ', 'Temporary password for ') + u.name, A('6 أحرف على الأقل. أبلغ بها الطالب هاتفيًا، وليغيّرها بعد الدخول.', 'At least 6 characters. Tell the student by phone; they change it after signing in.')); if (!p || p.length < 6) return;
    await DB.setPassword(u.id, p); await DB.ins('ticket_msgs', { ticket_id: t.id, user_id: uid(), name: me().name, staff: true, body: A('عُيّنت كلمة مرور مؤقتة وأُبلغ بها صاحب الحساب.', 'A temporary password was set and given to the account holder.') });
    await DB.upd('tickets', t.id, { status: 'closed', updated_at: new Date().toISOString() }); IS.audit(A('كلمة مرور مؤقتة', 'temporary password'), u.name); IS.refresh();
  };
  IS.ACT.refund = async function (b) {
    var t = await DB.one('tickets', b.getAttribute('data-id')), es = await DB.q('enrollments', { eq: { user_id: t.user_id, course_id: t.course_id, status: 'active' } }); if (!es[0]) return IS.toast(A('لا يوجد التحاق مفعّل لهذا الكورس.', 'No active enrolment for this course.'), true);
    if (!(await IS.confirm(A('اعتماد استرداد ', 'Approve a refund of ') + (+es[0].price).toLocaleString('en-US') + A('؟ يُغلق الكورس على حساب الطالب.', '? The course closes on the student’s account.')))) return;
    await DB.upd('enrollments', es[0].id, { status: 'refunded', note: A('استرداد معتمد', 'Refund approved'), decided_at: new Date().toISOString(), decided_by: uid() }); await IS.recount(t.course_id);
    await DB.ins('ticket_msgs', { ticket_id: t.id, user_id: uid(), name: me().name, staff: true, body: A('اعتُمد الاسترداد. سيُحوَّل المبلغ إلى حسابك قريبًا.', 'The refund is approved. The amount will be transferred to you soon.') });
    await DB.upd('tickets', t.id, { status: 'waiting', updated_at: new Date().toISOString() }); IS.notify(t.user_id, A('اعتُمد طلب الاسترداد', 'Refund approved'), t.subject, '#ticket/' + t.id); IS.audit(A('اعتماد استرداد', 'approve refund'), t.name + ' · ' + es[0].price); IS.refresh();
  };
  async function myTickets() {
    var all = await DB.q('tickets', { order: ['updated_at', false] }), d = IS.dept();
    return top() ? all : all.filter(function (t) { return t.dept === d || t.assigned_to === uid(); });
  }
  IS.page('control-tickets', async function (tab) {
    tab = tab || 'open'; var all = await myTickets(), list = all.filter(function (t) { return tab === 'mine' ? t.assigned_to === uid() && t.status !== 'closed' : t.status === tab; });
    var tabs = [['open', A('جديدة / بانتظارنا', 'New / waiting for us'), all.filter(function (t) { return t.status === 'open'; }).length], ['mine', A('المسندة إليّ', 'Assigned to me'), all.filter(function (t) { return t.assigned_to === uid() && t.status !== 'closed'; }).length], ['waiting', A('بانتظار رد الطالب', 'Waiting for the student')], ['closed', A('مغلقة', 'Closed')]];
    return IS.banner(esc(A('صندوق الرسائل', 'Inbox')), esc(top() ? A('رسائل الطلبة والمحاضرين لكل الأقسام.', 'Messages from students and lecturers for every department.') : A('رسائل ', 'Messages for ') + deptName(IS.dept())), 'mail') +
      '<div class="tabs pills">' + tabs.map(function (x) { return '<a href="#control-tickets/' + x[0] + '" class="' + (tab === x[0] ? 'on' : '') + '">' + esc(x[1]) + (x[2] ? ' <i>' + N(x[2]) + '</i>' : '') + '</a>'; }).join('') + '</div>' +
      (list.length ? '<div class="table">' + list.map(function (t) { var k = kind(t.kind); return '<a class="tr" href="#control-ticket/' + t.id + '">' + ic(k[4]) + '<span class="grow"><b>' + esc(t.subject) + '</b><small class="mut">' + esc(t.name || '') + ' · ' + esc(A(k[1], k[2])) + (top() ? ' · ' + esc(deptName(t.dept)) : '') + (t.assigned_name ? ' · ' + esc(t.assigned_name) : '') + '</small></span>' + IS.tstatus(t.status) + '<span class="mut">' + esc(IS.ago(t.updated_at || t.created_at)) + '</span></a>'; }).join('') + '</div>' :
        IS.empty('mail', A('لا توجد رسائل هنا', 'No messages here')));
  }, P('tickets'));

  /* ======================= TASKS ======================= */
  IS.tkst = function (s) { var m = { todo: ['جديدة', 'To do', 'warn'], doing: ['قيد التنفيذ', 'In progress', 'warn'], done: ['منجزة', 'Done', 'ok'] }[s] || [s, s, '']; return IS.chip(esc(A(m[0], m[1])), 'st ' + m[2]); };
  async function myStaff() {
    var us = (await DB.q('profiles')).filter(function (u) { return (u.team || []).length && u.id !== uid(); }), d = IS.dept();
    if (top()) return us.filter(function (u) { return (u.team || []).indexOf('owner') < 0; });
    return us.filter(function (u) { return u.manager_id === uid() || (d && (u.dept === d)); });
  }
  IS.page('control-tasks', async function (tab) {
    tab = tab || 'mine'; var all = await DB.q('tasks', { order: ['created_at', false] }), d = IS.dept(), mgr = IS.manager();
    var lists = { mine: all.filter(function (t) { return t.assigned_to === uid(); }), given: all.filter(function (t) { return t.assigned_by === uid(); }), dept: all.filter(function (t) { return top() || t.dept === d; }) };
    var list = lists[tab] || lists.mine;
    var h = IS.banner(esc(A('المهام', 'Tasks')), esc(mgr ? A('أسند المهام لموظفي قسمك وتابع إنجازها.', 'Assign tasks to your department’s staff and follow them.') : A('المهام التي أسندها إليك مديرك.', 'The tasks your manager assigned to you.')), 'checkc', mgr ? '<button class="btn gold" data-act="taskform">' + ic('plus') + esc(A('مهمة جديدة', 'New task')) + '</button>' : '');
    h += '<div class="tabs pills"><a href="#control-tasks/mine" class="' + (tab === 'mine' ? 'on' : '') + '">' + esc(A('مهامي', 'My tasks')) + (lists.mine.filter(function (t) { return t.status !== 'done'; }).length ? ' <i>' + N(lists.mine.filter(function (t) { return t.status !== 'done'; }).length) + '</i>' : '') + '</a>' +
      (mgr ? '<a href="#control-tasks/given" class="' + (tab === 'given' ? 'on' : '') + '">' + esc(A('أسندتها', 'Assigned by me')) + '</a><a href="#control-tasks/dept" class="' + (tab === 'dept' ? 'on' : '') + '">' + esc(top() ? A('كل المهام', 'All tasks') : A('مهام القسم', 'Department tasks')) + '</a>' : '') + '</div>';
    h += list.length ? '<div class="tasksb">' + ['todo', 'doing', 'done'].map(function (s) { var l = list.filter(function (t) { return t.status === s; });
      return '<section class="tcol"><h3>' + IS.tkst(s) + ' <em>' + N(l.length) + '</em></h3>' + l.map(function (t) { var late = t.due && t.status !== 'done' && new Date(t.due) < new Date();
        return '<article class="tcard' + (t.priority === 'high' ? ' hi' : '') + '"><b>' + esc(t.title) + '</b>' + (t.details ? '<p>' + esc(t.details) + '</p>' : '') + '<small class="mut">' + ic('user') + esc(tab === 'mine' ? (t.by_name || '') : (t.assigned_name || '')) + (t.due ? ' · <span class="' + (late ? 'bad' : '') + '">' + ic('clock') + esc(IS.date(t.due)) + '</span>' : '') + '</small>' +
          (t.link ? '<a class="link" href="' + esc(t.link) + '">' + ic('link') + esc(A('افتح', 'Open')) + '</a>' : '') + '<div class="row">' + (t.assigned_to === uid() && s !== 'done' ? '<button class="btn sm ' + (s === 'todo' ? 'ghost' : 'pri') + '" data-act="tmove" data-id="' + t.id + '" data-s="' + (s === 'todo' ? 'doing' : 'done') + '">' + esc(s === 'todo' ? A('ابدأ', 'Start') : A('تم الإنجاز', 'Mark done')) + '</button>' : '') +
          (t.assigned_by === uid() || top() ? '<button class="ib sm" data-act="taskform" data-id="' + t.id + '" aria-label="edit">' + ic('pen') + '</button><button class="ib sm" data-act="tdel" data-id="' + t.id + '" aria-label="delete">' + ic('trash') + '</button>' : '') + '</div></article>'; }).join('') + '</section>'; }).join('') + '</div>' :
      IS.empty('checkc', A('لا توجد مهام هنا', 'No tasks here'));
    return h;
  }, P('tasks'));
  IS.ACT.taskform = async function (b) {
    var t = b.getAttribute('data-id') ? await DB.one('tasks', b.getAttribute('data-id')) : { priority: 'normal' }, staff = await myStaff();
    if (!staff.length) return IS.toast(A('لا يوجد موظفون في قسمك بعد. أضفهم من «المستخدمون والصلاحيات».', 'No staff in your department yet. Add them in Users & permissions.'), true);
    IS.sheet(esc(t.id ? A('تعديل المهمة', 'Edit task') : A('مهمة جديدة', 'New task')), '<form class="form" data-form="task"><input type="hidden" name="id" value="' + esc(t.id || '') + '"><label class="fl"><span>' + esc(A('المهمة', 'Task')) + ' *</span><input name="title" required maxlength="140" value="' + esc(t.title || '') + '"></label>' +
      '<label class="fl"><span>' + esc(A('التفاصيل', 'Details')) + '</span><textarea name="details" rows="3">' + esc(t.details || '') + '</textarea></label><div class="g2f"><label class="fl"><span>' + esc(A('المكلَّف', 'Assigned to')) + ' *</span><select name="to" required>' + staff.map(function (u) { return '<option value="' + u.id + '"' + (t.assigned_to === u.id ? ' selected' : '') + '>' + esc(u.name) + ' · ' + esc(deptName(u.dept || (u.team || [])[0])) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fl"><span>' + esc(A('موعد الإنجاز', 'Due date')) + '</span><input name="due" type="date" value="' + esc(String(t.due || '').slice(0, 10)) + '"></label><label class="fl"><span>' + esc(A('الأولوية', 'Priority')) + '</span><select name="priority"><option value="normal">' + esc(A('عادية', 'Normal')) + '</option><option value="high"' + (t.priority === 'high' ? ' selected' : '') + '>' + esc(A('عالية', 'High')) + '</option></select></label>' +
      '<label class="fl"><span>' + esc(A('رابط داخل المنصة (اختياري)', 'Link inside the platform (optional)')) + '</span><input name="link" dir="ltr" placeholder="#control-pay" value="' + esc(t.link || '') + '"></label></div><button class="btn pri wide">' + esc(A('حفظ وإسناد', 'Save and assign')) + '</button></form>');
  };
  IS.SUB.task = async function (d) {
    var u = await DB.one('profiles', d.to), row = { title: d.title, details: d.details, assigned_to: u.id, assigned_name: u.name, dept: u.dept || IS.dept() || (u.team || [])[0] || '', due: d.due || null, priority: d.priority, link: d.link };
    if (d.id) await DB.upd('tasks', d.id, row); else { Object.assign(row, { assigned_by: uid(), by_name: me().name, status: 'todo' }); await DB.ins('tasks', row); IS.notify(u.id, A('مهمة جديدة من ', 'New task from ') + me().name, d.title, '#control-tasks'); }
    IS.audit(d.id ? A('تعديل مهمة', 'edit task') : A('إسناد مهمة', 'assign task'), d.title + ' → ' + u.name); IS.closeSheet(); IS.refresh();
  };
  IS.ACT.tmove = async function (b) { var t = await DB.upd('tasks', b.getAttribute('data-id'), { status: b.getAttribute('data-s'), done_at: b.getAttribute('data-s') === 'done' ? new Date().toISOString() : null });
    if (t.status === 'done' && t.assigned_by) IS.notify(t.assigned_by, A('أُنجزت مهمة', 'Task done'), t.title + ' · ' + me().name, '#control-tasks/given'); IS.audit(A('مهمة: ', 'task: ') + t.status, t.title); IS.refresh(); };
  IS.ACT.tdel = async function (b) { if (!(await IS.confirm(A('حذف المهمة؟', 'Delete the task?')))) return; await DB.del('tasks', b.getAttribute('data-id')); IS.refresh(); };

  /* ======================= ROLE DASHBOARDS ======================= */
  var SECTIONS = IS.SECTIONS = [['dash', 'chart', 'لوحة التحكم', 'Dashboard'], ['students', 'users', 'إدارة المستخدمين', 'Users'], ['apps', 'cert', 'تسجيل واعتماد المحاضرين', 'Lecturer approval'], ['lecturers', 'studio', 'المحاضرون ونسبهم', 'Lecturers & shares'],
    ['review', 'layers', 'الكورسات والمحتوى', 'Courses & content'], ['paths', 'route', 'المسارات', 'Paths'], ['library', 'open', 'المكتبة (كتب، شيتات، ملفات)', 'Library'], ['requests', 'receipt', 'طلبات المكتبة', 'Library requests'],
    ['pay', 'wallet', 'المدفوعات والاشتراكات', 'Payments'], ['payout', 'money', 'مستحقات المحاضرين', 'Payouts'], ['events', 'cal', 'الفعاليات', 'Events'], ['community', 'group', 'المجتمع والبلاغات', 'Community'],
    ['notify', 'bell', 'الإعلانات', 'Announcements'], ['tickets', 'mail', 'الرسائل والدعم', 'Messages & support'], ['tasks', 'checkc', 'المهام', 'Tasks'], ['reports', 'chart', 'التقارير والإحصائيات', 'Reports'],
    ['cats', 'grid', 'الأقسام والمواد', 'Categories'], ['settings', 'gear', 'إعدادات النظام', 'System settings'], ['audit', 'clock', 'سجل العمليات', 'Activity log'], ['team', 'shield', 'المستخدمون والصلاحيات', 'Users & permissions']];
  function permTiles() {
    return '<section class="box"><h2>' + ic('shield') + esc(A('صلاحيات هذا الحساب', 'Permissions of this account')) + '</h2><div class="ptiles">' + SECTIONS.filter(function (s) { return IS.can(s[0]); }).map(function (s) {
      return '<div>' + ic(s[1]) + '<b>' + esc(A(s[2], s[3])) + '</b><small>' + IS.ACTS.filter(function (a) { return IS.can(s[0], a[0]); }).map(function (a) { return esc(A(a[1], a[2])); }).join(' · ') + '</small></div>'; }).join('') + '</div></section>';
  }
  function restricted(r) { var x = role(r); return '<section class="box rnote">' + ic('lock') + '<b>' + esc(A('وصول مقيد', 'Restricted access')) + '</b><p>' + esc(A('هذا الحساب مخصص لـ«' + (x ? x[1] : '') + '» فقط، ولا يمكنه الوصول إلى الأقسام الأخرى في المنصة.', 'This account is for “' + (x ? x[2] : '') + '” only and cannot reach the other sections of the platform.')) + '</p></section>'; }
  function tile(icn, v, l, cls, href) { return '<' + (href ? 'a href="' + href + '"' : 'div') + ' class="rtile ' + (cls || '') + '">' + ic(icn) + '<span><small>' + esc(l) + '</small><b>' + v + '</b></span></' + (href ? 'a' : 'div') + '>'; }
  function months(n) { var a = [], d = new Date(); d.setDate(1); for (var i = n - 1; i >= 0; i--) a.push(new Date(d.getFullYear(), d.getMonth() - i, 1).toISOString().slice(0, 7)); return a; }
  function area(points, labels, money) {
    var max = Math.max.apply(null, points.concat([1])), W = 300, H = 120, step = W / Math.max(1, points.length - 1), pts = points.map(function (v, i) { return [i * step, H - 10 - v / max * (H - 26)]; }), line = pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
    return '<svg class="area" viewBox="-6 0 ' + (W + 12) + ' ' + (H + 18) + '"><polygon points="0,' + H + ' ' + line + ' ' + W + ',' + H + '"></polygon><polyline points="' + line + '"></polyline>' + pts.map(function (p, i) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.2"></circle>' + (i === pts.length - 1 ? '<text x="' + Math.min(p[0], W - 60) + '" y="' + (p[1] - 8) + '" class="tl">' + points[i].toLocaleString('en-US') + (money ? ' ' + (IS.SET.currency || '') : '') + '</text>' : ''); }).join('') +
      labels.map(function (l, i) { return '<text x="' + (i * step) + '" y="' + (H + 14) + '" text-anchor="middle">' + esc(l) + '</text>'; }).join('') + '</svg>';
  }
  IS.chartArea = area;
  function donut(parts, center, sub) { var tot = parts.reduce(function (a, p) { return a + p[1]; }, 0) || 1, a0 = 0, R = 40, C = 2 * Math.PI * R;
    return '<div class="donut"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="' + R + '" class="dbg"></circle>' + parts.map(function (p) { var len = p[1] / tot * C, s = '<circle cx="50" cy="50" r="' + R + '" stroke="' + p[2] + '" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-a0).toFixed(2) + '"></circle>'; a0 += len; return s; }).join('') + '</svg><div><b>' + center + '</b><small>' + esc(sub) + '</small></div></div>'; }
  var PAL = ['#0f6e6a', '#3fb7a8', '#a6dccf', '#e9c46a', '#a996ff', '#c7cbd6', '#f28f6b'];
  function auditBox(rows, title) { return '<section class="box"><header class="sh"><h2>' + ic('clock') + esc(title || A('سجل التدقيق', 'Audit log')) + '</h2><a class="more" href="#control-audit">' + esc(A('الكل', 'All')) + '</a></header>' + (rows.length ? '<div class="mtable"><div class="mh"><span>' + esc(A('المستخدم', 'User')) + '</span><span>' + esc(A('الإجراء', 'Action')) + '</span><span>' + esc(A('التفاصيل', 'Details')) + '</span><span>' + esc(A('الوقت', 'Time')) + '</span></div>' +
    rows.slice(0, 6).map(function (x) { return '<div class="mr"><span><b>' + esc(x.name || '') + '</b></span><span>' + esc(x.action) + '</span><span class="mut">' + esc(x.target || '') + '</span><span class="mut" dir="ltr">' + esc(String(x.created_at).slice(0, 16).replace('T', ' ')) + '</span></div>'; }).join('') + '</div>' : '<p class="mut">' + esc(A('لا توجد عمليات بعد.', 'Nothing yet.')) + '</p>') + '</section>'; }
  async function tasksBox() { var t = (await DB.q('tasks', { eq: { assigned_to: uid() } })).filter(function (x) { return x.status !== 'done'; });
    return '<section class="box"><header class="sh"><h2>' + ic('checkc') + esc(A('مهامي', 'My tasks')) + '</h2><a class="more" href="#control-tasks">' + esc(A('الكل', 'All')) + '</a></header>' + (t.length ? '<ul class="tasks">' + t.slice(0, 6).map(function (x) { return '<li><a href="#control-tasks">' + ic('clock') + '<span>' + esc(x.title) + (x.due ? ' · ' + esc(IS.date(x.due)) : '') + '</span></a></li>'; }).join('') + '</ul>' : '<p class="mut">' + esc(A('لا توجد مهام مفتوحة.', 'No open tasks.')) + '</p>') + '</section>'; }
  function head(r, title, sub) { var x = role(r); return '<section class="cban"><span class="bi">' + ic(x ? x[3] : 'chart') + '</span><div><h1 tabindex="-1">' + esc(title) + '</h1><p>' + esc(sub) + '</p></div><span class="role">' + ic('shield') + esc(x ? A(x[1], x[2]) : '') + '</span></section>'; }
  async function finance() {
    var r = await Promise.all([DB.q('enrollments'), DB.q('courses'), DB.q('payouts', { order: ['created_at', false] }), myTickets(), DB.q('audit', { order: ['created_at', false], limit: 60 })]), en = r[0], cs = r[1], ps = r[2], tk = r[3];
    var act = en.filter(function (e) { return e.status === 'active' && +e.price > 0; }), mk = new Date().toISOString().slice(0, 7), ms = months(6), tot = act.reduce(function (a, e) { return a + (+e.price || 0); }, 0), mon = act.filter(function (e) { return String(e.decided_at || '').slice(0, 7) === mk; }).reduce(function (a, e) { return a + (+e.price || 0); }, 0);
    var pend = en.filter(function (e) { return e.status === 'pending'; }), refunds = tk.filter(function (t) { return t.kind === 'refund' && t.status !== 'closed'; }), byCat = {}; act.forEach(function (e) { var c = cs.filter(function (x) { return x.id === e.course_id; })[0]; var k = c ? c.cat : 'other'; byCat[k] = (byCat[k] || 0) + 1; });
    var h = head('finance', A('لوحة المدير المالي', 'Finance dashboard'), A('إدارة المدفوعات والاشتراكات والإيرادات ومستحقات المحاضرين', 'Payments, enrolments, revenue and lecturer payouts'));
    h += '<div class="rtiles">' + tile('money', IS.money(tot), A('إجمالي الإيرادات', 'Total revenue'), 'c1') + tile('wallet', IS.money(mon), A('إيرادات هذا الشهر', 'Revenue this month'), 'c2') + tile('users', N(act.length), A('الاشتراكات النشطة', 'Active enrolments'), 'c3') +
      tile('receipt', N(pend.length), A('مدفوعات قيد المراجعة', 'Payments under review'), 'c4', '#control-pay') + tile('flag', N(refunds.length), A('طلبات استرداد', 'Refund requests'), 'c5', '#control-tickets') + '</div>';
    h += '<div class="cgrid"><section class="box"><h2>' + ic('chart') + esc(A('الإيرادات خلال آخر 6 أشهر', 'Revenue, last 6 months')) + '</h2>' + area(ms.map(function (m) { return act.filter(function (e) { return String(e.decided_at || '').slice(0, 7) === m; }).reduce(function (a, e) { return a + (+e.price || 0); }, 0); }), ms.map(function (m) { return new Date(m + '-01').toLocaleDateString(IS.lang === 'en' ? 'en-GB' : 'ar', { month: 'short' }); }), true) + '</section>' +
      '<section class="box"><h2>' + ic('target') + esc(A('توزيع الاشتراكات النشطة', 'Active enrolments by section')) + '</h2><div class="dwrap">' + donut(Object.keys(byCat).map(function (k, i) { return [k, byCat[k], PAL[i % PAL.length]]; }), N(act.length), A('مشترك', 'enrolled')) +
      '<ul class="dleg">' + Object.keys(byCat).map(function (k, i) { var c = IS.cat(k); return '<li><i style="background:' + PAL[i % PAL.length] + '"></i><span>' + esc(c ? A(c.ar, c.en) : k) + '</span><b>' + N(Math.round(byCat[k] / act.length * 100) + '%') + '</b></li>'; }).join('') + '</ul></div></section></div>';
    h += '<div class="grid g3"><section class="box"><header class="sh"><h2>' + ic('receipt') + esc(A('المدفوعات قيد المراجعة', 'Payments under review')) + '</h2><a class="more" href="#control-pay">' + esc(A('مراجعة الكل', 'Review all')) + '</a></header>' + (pend.length ? '<div class="list">' + pend.slice(0, 5).map(function (e) { return '<a class="li" href="#control-pay">' + ic('receipt') + '<span><b>' + esc(e.payer || '') + '</b><small>' + esc(IS.ago(e.created_at)) + '</small></span><b>' + IS.money(e.price) + '</b></a>'; }).join('') + '</div>' : '<p class="mut">' + esc(A('لا توجد مدفوعات معلقة.', 'Nothing waiting.')) + '</p>') + '</section>' +
      '<section class="box"><header class="sh"><h2>' + ic('flag') + esc(A('طلبات الاسترداد', 'Refund requests')) + '</h2></header>' + (refunds.length ? '<div class="list">' + refunds.slice(0, 5).map(function (t) { return '<a class="li" href="#control-ticket/' + t.id + '">' + ic('money') + '<span><b>' + esc(t.name || '') + '</b><small>' + esc(t.subject) + '</small></span>' + IS.tstatus(t.status) + '</a>'; }).join('') + '</div>' : '<p class="mut">' + esc(A('لا توجد طلبات استرداد.', 'No refund requests.')) + '</p>') + '</section>' +
      '<section class="box"><header class="sh"><h2>' + ic('wallet') + esc(A('آخر الأنشطة المالية', 'Latest financial activity')) + '</h2></header><div class="list">' + act.slice().sort(function (a, b) { return String(b.decided_at).localeCompare(String(a.decided_at)); }).slice(0, 4).map(function (e) { return '<div class="li">' + ic('checkc') + '<span><b>' + esc(A('اشتراك كورس', 'Enrolment')) + '</b><small>' + esc(IS.date(e.decided_at)) + '</small></span><b>' + IS.money(e.price) + '</b></div>'; }).join('') +
      ps.slice(0, 3).map(function (p) { return '<div class="li">' + ic('send') + '<span><b>' + esc(A('تحويل لمحاضر', 'Payout')) + ' · ' + esc(p.name || '') + '</b><small>' + esc(IS.date(p.paid_at || p.created_at)) + '</small></span><b>' + IS.money(p.amount) + '</b></div>'; }).join('') + '</div></section></div>';
    return h + '<div class="grid g2">' + auditBox(r[4].filter(function (x) { return /payment|payout|refund|دفع|تحويل|استرداد|share|نسبة/i.test(x.action); }), A('سجل التدقيق المالي', 'Finance audit log')) + permTiles() + '</div>' + restricted('finance');
  }
  async function academic() {
    var r = await Promise.all([DB.q('lecturers'), DB.q('courses'), DB.q('lecturer_apps', { order: ['created_at', false] }), DB.q('reports', { eq: { status: 'open' } }), myTickets(), DB.q('audit', { order: ['created_at', false], limit: 40 })]), cs = r[1];
    var rev = cs.filter(function (c) { return c.status === 'review'; }), ap = r[2].filter(function (a) { return a.status === 'pending'; }), rated = cs.filter(function (c) { return c.n_reviews; }), avg = rated.length ? (rated.reduce(function (a, c) { return a + c.rating; }, 0) / rated.length).toFixed(1) : '—';
    var h = head('academic', A('لوحة المدير الأكاديمي', 'Academic dashboard'), A('المحاضرون والكورسات وجودة المحتوى العلمي', 'Lecturers, courses and the quality of academic content'));
    h += '<div class="rtiles">' + tile('users', N(r[0].filter(function (l) { return l.status === 'active'; }).length), A('محاضر معتمد', 'Approved lecturers'), 'c1') + tile('layers', N(cs.filter(function (c) { return c.status === 'published'; }).length), A('كورس منشور', 'Published courses'), 'c2') +
      tile('eye', N(rev.length), A('كورسات بانتظار المراجعة', 'Courses awaiting review'), 'c4', '#control-review') + tile('cert', N(ap.length), A('طلبات محاضرين', 'Lecturer requests'), 'c5', '#control-apps') + tile('star', esc(avg), A('متوسط تقييم الكورسات', 'Average course rating'), 'c3') + '</div>';
    h += '<div class="grid g3"><section class="box"><header class="sh"><h2>' + ic('eye') + esc(A('كورسات للمراجعة', 'Courses to review')) + '</h2><a class="more" href="#control-review">' + esc(A('الكل', 'All')) + '</a></header>' + (rev.length ? '<div class="list">' + rev.map(function (c) { return '<a class="li" href="#course/' + c.id + '">' + ic('layers') + '<span><b>' + esc(c.title) + '</b><small>' + N(c.n_lessons || 0) + ' ' + esc(A('درس', 'lessons')) + '</small></span></a>'; }).join('') + '</div>' : '<p class="mut">' + esc(A('لا شيء بانتظار المراجعة.', 'Nothing waiting.')) + '</p>') + '</section>' +
      '<section class="box"><header class="sh"><h2>' + ic('cert') + esc(A('طلبات المحاضرين', 'Lecturer requests')) + '</h2><a class="more" href="#control-apps">' + esc(A('الكل', 'All')) + '</a></header>' + (ap.length ? '<div class="list">' + ap.map(function (a) { return '<a class="li" href="#control-apps">' + IS.av(a, 'sm') + '<span><b>' + esc(a.name) + '</b><small>' + esc(a.specialty) + ' · ' + esc(a.qual) + '</small></span></a>'; }).join('') + '</div>' : '<p class="mut">' + esc(A('لا توجد طلبات.', 'No requests.')) + '</p>') + '</section>' +
      '<section class="box"><h2>' + ic('star') + esc(A('الأعلى تقييمًا', 'Top rated')) + '</h2><div class="list">' + rated.sort(function (a, b) { return b.rating - a.rating; }).slice(0, 5).map(function (c) { return '<a class="li" href="#course/' + c.id + '">' + ic('star', 'gold') + '<span><b>' + esc(c.title) + '</b><small>' + N(c.rating) + ' · ' + N(c.n_reviews) + '</small></span></a>'; }).join('') + '</div></section></div>';
    return h + '<div class="grid g2">' + (await tasksBox()) + permTiles() + '</div>' + restricted('academic');
  }
  async function simple(r, title, sub, blocks) { var h = head(r, title, sub) + blocks; return h + '<div class="grid g2">' + (await tasksBox()) + permTiles() + '</div>' + restricted(r); }
  async function content() {
    var r = await Promise.all([DB.q('files'), DB.q('requests'), myTickets()]), fs = r[0], rq = r[1].filter(function (x) { return x.status === 'pending' || x.status === 'progress'; });
    return simple('content', A('لوحة مدير المحتوى والمكتبة', 'Content & library dashboard'), A('الكتب والشيتات والملخصات والملفات وطلبات المكتبة', 'Books, sheets, summaries, files and library requests'),
      '<div class="rtiles">' + tile('open', N(fs.filter(function (f) { return f.status === 'published'; }).length), A('ملف منشور', 'Published files'), 'c1') + tile('eye', N(fs.filter(function (f) { return f.status === 'pending'; }).length), A('ملفات بانتظار المراجعة', 'Files awaiting review'), 'c4', '#control-library') +
      tile('receipt', N(rq.length), A('طلبات مكتبة مفتوحة', 'Open library requests'), 'c5', '#control-requests') + tile('mail', N(r[2].filter(function (t) { return t.status === 'open'; }).length), A('رسائل جديدة', 'New messages'), 'c2', '#control-tickets') + '</div>');
  }
  async function community() {
    var r = await Promise.all([DB.q('reports', { eq: { status: 'open' } }), DB.q('posts'), DB.q('events')]), wk = Date.now() - 7 * 864e5;
    return simple('community', A('لوحة مدير المجتمع والفعاليات', 'Community & events dashboard'), A('النقاشات والبلاغات والفعاليات والإعلانات', 'Discussions, reports, events and announcements'),
      '<div class="rtiles">' + tile('flag', N(r[0].length), A('بلاغات مفتوحة', 'Open reports'), 'c5', '#control-community') + tile('chat', N(r[1].filter(function (p) { return new Date(p.created_at).getTime() > wk; }).length), A('نقاشات هذا الأسبوع', 'Discussions this week'), 'c2', '#community') +
      tile('cal', N(r[2].filter(function (e) { return new Date(e.starts) > new Date(); }).length), A('فعاليات قادمة', 'Upcoming events'), 'c3', '#control-events') + '</div>');
  }
  async function support() {
    var r = await Promise.all([myTickets(), DB.q('profiles')]), tk = r[0], wk = Date.now() - 7 * 864e5;
    return simple('support', A('لوحة مدير خدمة العملاء', 'Customer support dashboard'), A('استفسارات المستخدمين والطلبات والشكاوى', 'User enquiries, requests and complaints'),
      '<div class="rtiles">' + tile('mail', N(tk.filter(function (t) { return t.status === 'open'; }).length), A('رسائل بانتظار الرد', 'Messages awaiting reply'), 'c5', '#control-tickets') + tile('lock', N(tk.filter(function (t) { return t.kind === 'password' && t.status !== 'closed'; }).length), A('طلبات استعادة كلمة المرور', 'Password requests'), 'c4', '#control-tickets') +
      tile('users', N(r[1].length), A('إجمالي المستخدمين', 'Users'), 'c1', '#control-students') + tile('user', N(r[1].filter(function (u) { return new Date(u.created_at).getTime() > wk; }).length), A('مسجلون هذا الأسبوع', 'New this week'), 'c2') + '</div>' +
      '<section class="box"><header class="sh"><h2>' + ic('mail') + esc(A('أحدث الرسائل', 'Latest messages')) + '</h2><a class="more" href="#control-tickets">' + esc(A('الكل', 'All')) + '</a></header><div class="list">' + tk.filter(function (t) { return t.status !== 'closed'; }).slice(0, 6).map(function (t) { var k = kind(t.kind); return '<a class="li" href="#control-ticket/' + t.id + '">' + ic(k[4]) + '<span><b>' + esc(t.subject) + '</b><small>' + esc(t.name || '') + '</small></span>' + IS.tstatus(t.status) + '</a>'; }).join('') + '</div></section>');
  }
  async function tech() {
    var r = await Promise.all([DB.q('audit', { order: ['created_at', false], limit: 40 }), DB.q('profiles')]), staff = r[1].filter(function (u) { return (u.team || []).length; });
    return simple('tech', A('لوحة المدير التقني', 'Technical dashboard'), A('النظام والمنصة والأمان والدعم الفني', 'The system, platform, security and technical support'),
      '<div class="rtiles">' + tile('live', esc(DB.live ? A('متصلة', 'Connected') : A('معاينة', 'Preview')), A('قاعدة البيانات', 'Database'), DB.live ? 'c3' : 'c4') + tile('shield', N(staff.filter(function (u) { return u.mfa_on || u.mfa_required; }).length) + ' / ' + N(staff.length), A('حسابات إدارية بالتحقق الثنائي', 'Admin accounts with 2FA'), 'c1') +
      tile('mail', N((await myTickets()).filter(function (t) { return t.status === 'open'; }).length), A('بلاغات تقنية', 'Technical messages'), 'c5', '#control-tickets') + '</div>' + auditBox(r[0], A('سجل العمليات', 'Activity log')));
  }
  async function staffDash() {
    var t = (await DB.q('tasks', { eq: { assigned_to: uid() } })), tk = (await DB.q('tickets', { eq: { assigned_to: uid() } })).filter(function (x) { return x.status !== 'closed'; });
    var h = head('staff', A('مرحبًا ', 'Welcome, ') + me().name, A('مهامك والرسائل المسندة إليك والأقسام المسموح لك بها.', 'Your tasks, the messages assigned to you and the sections you may use.'));
    h += '<div class="rtiles">' + tile('checkc', N(t.filter(function (x) { return x.status !== 'done'; }).length), A('مهام مفتوحة', 'Open tasks'), 'c4', '#control-tasks') + tile('mail', N(tk.length), A('رسائل مسندة إليّ', 'Messages assigned to me'), 'c5', '#control-tickets/mine') + tile('check', N(t.filter(function (x) { return x.status === 'done'; }).length), A('مهام منجزة', 'Tasks done'), 'c3') + '</div>';
    return h + '<div class="grid g2">' + (await tasksBox()) + permTiles() + '</div>' + restricted('staff');
  }
  /* owner / GM: the full overview (control.js) + department performance */
  async function deptPerf() {
    var r = await Promise.all([DB.q('tickets'), DB.q('tasks'), DB.q('enrollments', { eq: { status: 'pending' } }), DB.q('courses', { eq: { status: 'review' } }), DB.q('lecturer_apps', { eq: { status: 'pending' } }), DB.q('reports', { eq: { status: 'open' } }), DB.q('files', { eq: { status: 'pending' } }), DB.q('profiles')]);
    var open = function (d) { return r[0].filter(function (t) { return t.dept === d && t.status === 'open'; }).length; }, tasks = function (d) { return r[1].filter(function (t) { return t.dept === d && t.status !== 'done'; }).length; }, people = function (d) { return r[7].filter(function (u) { return (u.team || []).indexOf(d) >= 0 || u.dept === d; }).length; };
    var extra = { finance: [r[2].length, A('مدفوعات معلقة', 'pending payments')], academic: [r[3].length + r[4].length, A('كورسات وطلبات محاضرين', 'courses & lecturer requests')], content: [r[6].length, A('ملفات للمراجعة', 'files to review')], community: [r[5].length, A('بلاغات', 'reports')], support: [open('support'), A('رسائل', 'messages')], tech: [open('tech'), A('بلاغات تقنية', 'technical issues')] };
    return '<section class="sec"><header class="sh"><h2>' + ic('org') + esc(A('أداء الأقسام', 'Department performance')) + '</h2><a class="more" href="#control-structure">' + esc(A('الهيكل الإداري', 'Structure')) + '</a></header><div class="dperf">' + IS.DEPTS.map(function (d) { var x = role(d[0]), e = extra[d[0]];
      return '<div class="dp"><span class="oi">' + ic(x[3]) + '</span><b>' + esc(A(x[1], x[2])) + '</b><ul><li><span>' + esc(e[1]) + '</span><b>' + N(e[0]) + '</b></li><li><span>' + esc(A('رسائل جديدة', 'new messages')) + '</span><b>' + N(open(d[0])) + '</b></li><li><span>' + esc(A('مهام مفتوحة', 'open tasks')) + '</span><b>' + N(tasks(d[0])) + '</b></li><li><span>' + esc(A('الفريق', 'team')) + '</span><b>' + N(people(d[0])) + '</b></li></ul></div>'; }).join('') + '</div></section>';
  }
  IS.page('control', async function () {
    var r = mainRole();
    if (r === 'owner' || r === 'gm') return (await IS.ctrlOverview()) + (await deptPerf());
    return ({ finance: finance, academic: academic, content: content, community: community, support: support, tech: tech })[r] ? await ({ finance: finance, academic: academic, content: content, community: community, support: support, tech: tech })[r]() : await staffDash();
  }, P('dash'));

  /* ======================= USERS & PERMISSIONS ======================= */
  var APPROVAL = [['none', 'بدون اعتماد', 'No approval'], ['dept', 'اعتماد قسم', 'Department approval'], ['full', 'اعتماد كامل', 'Full approval']];
  function canGrant(r) { var t = me().team || []; if (t.indexOf('owner') >= 0) return true; return r !== 'owner' && r !== 'gm' && IS.can('team', 'edit'); }
  IS.page('control-team', async function (rsel) {
    var us = await DB.q('profiles'), team = us.filter(function (u) { return (u.team || []).length; }), inv = await DB.q('invites', { eq: { status: 'pending' } }), log = await DB.q('audit', { order: ['created_at', false], limit: 6 });
    var cnt = function (r) { return team.filter(function (u) { return (u.team || []).indexOf(r) >= 0; }).length; };
    rsel = rsel || 'finance';
    var h = IS.banner(esc(A('إدارة المستخدمين والصلاحيات', 'Users & Permissions Management')), esc(A('إنشاء الحسابات الإدارية، تحديد الأدوار، توزيع الصلاحيات، ومتابعة الأنشطة', 'Create admin accounts, set roles, give permissions and follow activity')), 'shield');
    h += '<div class="rtiles">' + tile('chart', esc(A('نظرة عامة', 'Overview')), '', 'c0') + tile('briefcase', N(IS.ROLES.length), A('الأدوار الوظيفية', 'System roles'), 'c1') + tile('layers', N(IS.DEPTS.length), A('الأقسام الإدارية', 'Departments'), 'c2') + tile('users', N(team.length), A('إجمالي الحسابات الإدارية', 'Admin accounts'), 'c3') + tile('clock', N(inv.length), A('دعوات بانتظار التسجيل', 'Pending invitations'), 'c4') + '</div>';
    h += '<div class="tgrid">';
    /* hierarchy */
    h += '<section class="box"><h2>' + ic('org') + esc(A('الهيكل الإداري', 'Organizational Hierarchy')) + '</h2><ul class="hier">' + IS.ROLES.map(function (r) { var ms = team.filter(function (u) { return (u.team || []).indexOf(r[0]) >= 0 || (r[0] === 'staff' && (u.team || []).some(function (x) { return x.indexOf('p:') === 0; }) && !(u.team || []).some(function (x) { return x.indexOf('p:') !== 0 && x !== 'staff'; })); });
      return '<li class="' + (r[0] === 'owner' ? 'own' : '') + '"><details' + (r[0] === 'owner' ? ' open' : '') + '><summary>' + ic(r[3]) + '<span><b>' + esc(r[1]) + '</b><small lang="en">' + esc(r[2]) + '</small></span><em>' + N(ms.length) + '</em></summary>' + (ms.length ? ms.map(function (u) { return '<button class="hm" data-act="staffform" data-id="' + u.id + '">' + IS.av(u, 'xs') + esc(u.name) + (u.team_status === 'suspended' ? ' · ' + esc(A('معلق', 'Suspended')) : '') + '</button>'; }).join('') : '<small class="mut">—</small>') + '</details></li>'; }).join('') + '</ul></section>';
    /* create staff account */
    h += '<section class="box"><h2>' + ic('user') + esc(A('إنشاء حساب إداري جديد', 'Create Staff Account')) + '</h2>' + staffForm({}, team) + '</section>';
    /* permission matrix */
    var canEditMatrix = (me().team || []).indexOf('owner') >= 0 || (IS.can('team', 'edit') && rsel !== 'gm');
    h += '<section class="box mx"><h2>' + ic('gear') + esc(A('إدارة الصلاحيات', 'Permissions Management')) + '</h2><p class="mut">' + esc(A('حدّد صلاحيات كل دور على مستوى كل وحدة في النظام.', 'Set what each role may do in each section.')) + '</p>' +
      '<label class="fl"><span>' + esc(A('الدور المعروض', 'Role shown')) + '</span><select id="rsel">' + IS.ROLES.filter(function (r) { return r[0] !== 'owner'; }).map(function (r) { return '<option value="' + r[0] + '"' + (r[0] === rsel ? ' selected' : '') + '>' + esc(r[1]) + '</option>'; }).join('') + '</select></label>' +
      '<form data-form="matrix"><input type="hidden" name="role" value="' + rsel + '"><div class="matrix"><table><thead><tr><th>' + esc(A('الوحدة / الصلاحية', 'Section / action')) + '</th>' + IS.ACTS.map(function (a) { return '<th>' + esc(A(a[1], a[2])) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      SECTIONS.map(function (s) { var cur = (IS.RP[rsel] || {})[s[0]] || []; return '<tr><th>' + ic(s[1]) + esc(A(s[2], s[3])) + '</th>' + IS.ACTS.map(function (a) { return '<td><input type="checkbox" name="m" value="' + s[0] + ':' + a[0] + '"' + (cur.indexOf(a[0]) >= 0 ? ' checked' : '') + (canEditMatrix ? '' : ' disabled') + ' aria-label="' + esc(s[3] + ' ' + a[2]) + '"></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' +
      (canEditMatrix ? '<div class="row sp"><button type="button" class="btn ghost sm" data-act="copyperms" data-r="' + rsel + '">' + ic('file') + esc(A('نسخ صلاحيات من دور آخر', 'Copy from another role')) + '</button><button class="btn pri">' + ic('check') + esc(A('حفظ الصلاحيات', 'Save permissions')) + '</button></div>' : '<p class="mut">' + esc(A('صلاحيات المدير العام يعدّلها مالك المنصة فقط.', 'Only the owner edits the general manager’s permissions.')) + '</p>') + '</form></section>';
    h += '</div>';
    /* accounts + audit */
    h += '<div><section class="box"><header class="sh"><h2>' + ic('users') + esc(A('الحسابات الإدارية', 'Administrative Accounts')) + '</h2><button class="btn ghost sm" data-act="staffform">' + ic('plus') + esc(A('إضافة مستخدم جديد', 'Add a user')) + '</button></header><div class="mtable acc"><div class="mh"><span>' + esc(A('الاسم', 'Name')) + '</span><span>' + esc(A('الدور', 'Role')) + '</span><span>' + esc(A('القسم', 'Department')) + '</span><span>' + esc(A('الحالة', 'Status')) + '</span><span>' + esc(A('آخر دخول', 'Last sign-in')) + '</span><span></span></div>' +
      team.map(function (u) { var r = role((u.team || []).filter(function (x) { return x.indexOf('p:') !== 0; })[0] || 'staff'); return '<div class="mr"><span><b>' + esc(u.name) + '</b>' + (u.mfa_on ? '<small class="ok">' + ic('shield') + '2FA</small>' : '') + '</span><span>' + esc(r ? r[1] : '') + '</span><span>' + esc(deptName(u.dept || (u.team || [])[0])) + '</span>' + IS.chip(esc(u.team_status === 'suspended' ? A('معلق', 'Suspended') : A('مفعل', 'Active')), 'st ' + (u.team_status === 'suspended' ? 'warn' : 'ok')) +
        '<span class="mut">' + esc(u.last_seen ? IS.ago(u.last_seen) : '—') + '</span><span class="row">' + (canGrant((u.team || [])[0]) ? '<button class="ib sm" data-act="staffform" data-id="' + u.id + '" aria-label="edit">' + ic('pen') + '</button>' : '') + '</span></div>'; }).join('') +
      inv.map(function (v) { var r = role(v.role); return '<div class="mr"><span><b>' + esc(v.name) + '</b><small class="mut" dir="ltr">' + esc(v.phone || v.email || '') + '</small></span><span>' + esc(r ? r[1] : '') + '</span><span>' + esc(deptName(v.dept)) + '</span>' + IS.chip(esc(A('بانتظار التسجيل', 'Awaiting sign-up')), 'st warn') + '<span class="mut">—</span><span><button class="ib sm" data-act="delinv" data-id="' + v.id + '" aria-label="cancel">' + ic('x') + '</button></span></div>'; }).join('') + '</div></section>' + auditBox(log, A('سجل الأنشطة', 'Audit log')) + '</div>';
    IS.after = function () { var s = $('#rsel'); if (s) s.onchange = function () { IS.go('control-team/' + s.value); }; };
    return h;
  }, P('team'));
  function staffForm(u, team) {
    var t = u.team || [], r = t.filter(function (x) { return x.indexOf('p:') !== 0; })[0] || 'staff', extras = t.filter(function (x) { return x.indexOf('p:') === 0; });
    return '<form class="form" data-form="staff"><input type="hidden" name="id" value="' + esc(u.id || '') + '"><div class="g2f"><label class="fl"><span>' + ic('user') + esc(A('الاسم الكامل', 'Full name')) + ' *</span><input name="name" required value="' + esc(u.name || '') + '"></label>' +
      '<label class="fl"><span>' + ic('mail') + esc(A('البريد الإلكتروني', 'Email')) + '</span><input name="email" type="email" dir="ltr" value="' + esc(u.email || '') + '"' + (u.id ? ' readonly' : '') + '></label>' +
      '<label class="fl"><span>' + ic('phone') + esc(A('رقم الهاتف', 'Phone')) + '</span><input name="phone" dir="ltr" inputmode="tel" value="' + esc(u.phone || '') + '"' + (u.id ? ' readonly' : '') + '></label>' +
      '<label class="fl"><span>' + ic('briefcase') + esc(A('الدور الوظيفي', 'Role')) + ' *</span><select name="role">' + IS.ROLES.filter(function (x) { return canGrant(x[0]); }).map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === r ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fl"><span>' + ic('layers') + esc(A('القسم', 'Department')) + '</span><select name="dept"><option value="">—</option>' + IS.DEPTS.map(function (d) { return '<option value="' + d[0] + '"' + (u.dept === d[0] ? ' selected' : '') + '>' + esc(A(d[1], d[2])) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fl"><span>' + ic('users') + esc(A('المدير المباشر', 'Direct manager')) + '</span><select name="manager"><option value="">—</option>' + (team || []).filter(function (x) { return x.id !== u.id; }).map(function (x) { return '<option value="' + x.id + '"' + (u.manager_id === x.id ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fl"><span>' + ic('shield') + esc(A('مستوى الاعتماد', 'Approval level')) + '</span><select name="approval">' + APPROVAL.map(function (x) { return '<option value="' + x[0] + '"' + ((u.approval || 'dept') === x[0] ? ' selected' : '') + '>' + esc(A(x[1], x[2])) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fl"><span>' + esc(A('حالة الحساب', 'Account status')) + '</span><select name="tstatus"><option value="active">' + esc(A('مفعل', 'Active')) + '</option><option value="suspended"' + (u.team_status === 'suspended' ? ' selected' : '') + '>' + esc(A('معلق', 'Suspended')) + '</option></select></label></div>' +
      '<label class="chk sw2"><input type="checkbox" name="mfa"' + (u.mfa_required !== false ? ' checked' : '') + '><span><b>' + esc(A('المصادقة الثنائية (2FA) إلزامية', 'Two-factor authentication (2FA) required')) + '</b><small>' + esc(A('لا يفتح الحساب لوحة التحكم إلا برمز من تطبيق المصادقة على هاتفه.', 'The account opens the control app only with a code from an authenticator app on its phone.')) + '</small></span></label>' +
      '<details class="fg"><summary>' + esc(A('أقسام إضافية لهذا الشخص', 'Extra sections for this person')) + ic('down') + '</summary><div class="g2f">' + SECTIONS.filter(function (s) { return s[0] !== 'team'; }).map(function (s) { return '<label class="chk"><input type="checkbox" name="x" value="p:' + s[0] + '"' + (extras.indexOf('p:' + s[0]) >= 0 ? ' checked' : '') + '><span>' + esc(A(s[2], s[3])) + '</span></label>'; }).join('') + '</div></details>' +
      '<div class="row sp">' + (u.id && u.id !== uid() ? '<button type="button" class="btn ghost bad" data-act="rmteam" data-id="' + u.id + '">' + esc(A('إزالة من الفريق', 'Remove from team')) + '</button>' : '<span></span>') + '<button class="btn pri">' + ic('user') + esc(u.id ? A('حفظ', 'Save') : A('إنشاء الحساب', 'Create account')) + '</button></div></form>';
  }
  IS.ACT.staffform = async function (b) { var id = b.getAttribute && b.getAttribute('data-id'), u = id ? await DB.one('profiles', id) : {}, team = (await DB.q('profiles')).filter(function (x) { return (x.team || []).length; });
    if (u.id && !canGrant((u.team || [])[0])) return IS.toast(A('لا تملك صلاحية تعديل هذا الحساب.', 'You may not edit this account.'), true);
    IS.sheet(esc(u.id ? u.name : A('حساب إداري جديد', 'New staff account')), staffForm(u, team), { wide: 1 }); };
  IS.SUB.staff = async function (d, f) {
    if (!canGrant(d.role)) return IS.toast(A('لا تملك صلاحية منح هذا الدور.', 'You may not grant this role.'), true);
    var x = IS.$$('input[name=x]:checked', f).map(function (i) { return i.value; }), team = [d.role].concat(x), row = { dept: d.dept || '', manager_id: d.manager || null, approval: d.approval, mfa_required: !!f.mfa.checked, team_status: d.tstatus };
    var u = d.id ? await DB.one('profiles', d.id) : null;
    if (!u) { var dg = DB.digits(d.phone || ''), us = await DB.q('profiles'); u = us.filter(function (p) { return (dg.length > 6 && DB.digits(p.phone) === dg) || (d.email && p.email && p.email.toLowerCase() === d.email.toLowerCase()); })[0]; }
    if (u) { if ((u.team || []).indexOf('owner') >= 0 && team.indexOf('owner') < 0) team.push('owner');
      await DB.upd('profiles', u.id, Object.assign({ team: team }, row)); IS.notify(u.id, A('أصبحت ضمن فريق اشرح لي', 'You joined the Ishrah Li team'), A('افتح «التحكم» من القائمة. فعّل المصادقة الثنائية عند الطلب.', 'Open “Control” from the menu. Turn on two-factor login when asked.'), '#control'); IS.audit(A('تحديث حساب إداري', 'update staff account') + ' (' + team.join(', ') + ')', u.name); if (u.id === uid()) await IS.loadMe(); }
    else { if (!d.phone && !d.email) return IS.toast(A('اكتب الهاتف أو البريد.', 'Enter the phone or email.'), true);
      await DB.ins('invites', Object.assign({ name: d.name, phone: DB.digits(d.phone || ''), email: (d.email || '').toLowerCase(), role: d.role, extras: x, status: 'pending', by: uid() }, row)); IS.audit(A('دعوة حساب إداري', 'invite staff account'), d.name);
      IS.toast(A('أُنشئت الدعوة: يصبح الحساب إداريًا فور تسجيله بهذا الرقم أو البريد.', 'Invitation created: the account becomes staff as soon as it registers with this phone or email.')); }
    IS.closeSheet(); IS.refresh();
  };
  IS.ACT.delinv = async function (b) { await DB.del('invites', b.getAttribute('data-id')); IS.refresh(); };
  IS.ACT.rmteam = async function (b) { var u = await DB.one('profiles', b.getAttribute('data-id')); if (!canGrant((u.team || [])[0])) return; if (!(await IS.confirm(A('إزالة ', 'Remove ') + u.name + A(' من فريق المنصة؟', ' from the team?')))) return;
    await DB.upd('profiles', u.id, { team: [], dept: '', manager_id: null }); IS.audit(A('إزالة من الفريق', 'remove from team'), u.name); IS.closeSheet(); IS.refresh(); };
  IS.SUB.matrix = async function (d, f) {
    var r = d.role; if (r === 'gm' && (me().team || []).indexOf('owner') < 0) return; var m = {}; IS.$$('input[name=m]:checked', f).forEach(function (i) { var p = i.value.split(':'); (m[p[0]] = m[p[0]] || []).push(p[1]); });
    var old = await DB.q('role_perms', { eq: { role: r } }); for (var i = 0; i < old.length; i++) await DB.del('role_perms', old[i].id);
    var ks = SECTIONS.map(function (s) { return s[0]; }); for (var j = 0; j < ks.length; j++) await DB.ins('role_perms', { id: r + ':' + ks[j], role: r, perm: ks[j], acts: m[ks[j]] || [] });
    await IS.loadBase(); IS.audit(A('تعديل صلاحيات دور', 'edit role permissions'), role(r)[1]); IS.toast(A('حُفظت الصلاحيات', 'Permissions saved')); IS.refresh();
  };
  IS.ACT.copyperms = async function (b) { var from = await IS.ask(A('نسخ من دور', 'Copy from role'), IS.ROLES.filter(function (r) { return r[0] !== 'owner'; }).map(function (r) { return r[0] + ' = ' + r[1]; }).join(' · '), 'support'); if (!from || !IS.RP[from]) return;
    IS.$$('input[name=m]').forEach(function (i) { var p = i.value.split(':'); i.checked = ((IS.RP[from] || {})[p[0]] || []).indexOf(p[1]) >= 0; }); IS.toast(A('نُسخت. اضغط «حفظ الصلاحيات».', 'Copied. Press “Save permissions”.')); };

  /* ======================= TWO-FACTOR LOGIN ======================= */
  var B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  function b32dec(s) { var bits = '', out = []; s.replace(/=+$/, '').toUpperCase().split('').forEach(function (c) { var v = B32.indexOf(c); if (v >= 0) bits += ('00000' + v.toString(2)).slice(-5); }); for (var i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2)); return new Uint8Array(out); }
  async function totp(secret, step) { var key = await crypto.subtle.importKey('raw', b32dec(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']), c = new ArrayBuffer(8), v = new DataView(c); v.setUint32(4, step); var h = new Uint8Array(await crypto.subtle.sign('HMAC', key, c)), o = h[19] & 15;
    return String((((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1e6).padStart(6, '0'); }
  async function totpOk(secret, code) { var s = Math.floor(Date.now() / 30000); for (var d = -1; d <= 1; d++) if (await totp(secret, s + d) === String(code).trim()) return true; return false; }
  var MFA = DB.live ? {
    state: async function () { var sb = DB.sb, a = (await sb.auth.mfa.getAuthenticatorAssuranceLevel()).data || {}, f = ((await sb.auth.mfa.listFactors()).data || {}).totp || []; var v = f.filter(function (x) { return x.status === 'verified'; })[0]; return { on: !!v, factor: v && v.id, aal2: a.currentLevel === 'aal2' }; },
    enroll: async function () { var r = await DB.sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Ishrah Li ' + Date.now() }); if (r.error) throw r.error; return { id: r.data.id, qr: r.data.totp.qr_code, secret: r.data.totp.secret }; },
    verify: async function (factor, code) { var c = await DB.sb.auth.mfa.challenge({ factorId: factor }); if (c.error) throw c.error; var v = await DB.sb.auth.mfa.verify({ factorId: factor, challengeId: c.data.id, code: code }); if (v.error) throw v.error; return true; }
  } : {
    state: async function () { var p = await DB.one('profiles', uid()); return { on: !!(p && p.mfa_on), factor: 'local', aal2: sessionStorage.getItem('ish-aal2-' + uid()) === '1' }; },
    enroll: async function () { var a = new Uint8Array(20); crypto.getRandomValues(a); var s = ''; a.forEach(function (x) { s += B32[x & 31]; }); await DB.upd('profiles', uid(), { mfa_secret: s }); return { id: 'local', secret: s, uri: 'otpauth://totp/Ishrah%20Li:' + encodeURIComponent(me().name) + '?secret=' + s + '&issuer=Ishrah%20Li' }; },
    verify: async function (factor, code) { var p = await DB.one('profiles', uid()); if (!(await totpOk(p.mfa_secret, code))) throw new Error('bad'); sessionStorage.setItem('ish-aal2-' + uid(), '1'); return true; }
  };
  IS.MFA = MFA;
  IS.mfaCheck = async function () {
    IS.MFA_NEEDED = false; IS.MFA_SETUP = false; if (!IS.team()) return;
    try { var s = await MFA.state(); IS.MFA_STATE = s; if (s.on && !s.aal2) IS.MFA_NEEDED = true; else if (!s.on && me().mfa_required) IS.MFA_SETUP = true; } catch (e) {}
  };
  IS.mfaGate = function () {
    if (IS.area !== 'control' || !IS.team()) return '';
    if (IS.MFA_NEEDED) return '<div class="page"><div class="gate">' + ic('shield') + '<h1 tabindex="-1">' + esc(A('التحقق بخطوتين', 'Two-step verification')) + '</h1><p>' + esc(A('اكتب الرمز المكوّن من 6 أرقام من تطبيق المصادقة على هاتفك.', 'Enter the 6-digit code from the authenticator app on your phone.')) + '</p>' +
      '<form class="form otp" data-form="mfacode"><input name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required dir="ltr" placeholder="••••••"><button class="btn pri">' + esc(A('تحقق', 'Verify')) + '</button></form></div></div>';
    if (IS.MFA_SETUP) return '<div class="page">' + mfaSetup(true) + '</div>';
    return '';
  };
  function mfaSetup(forced) {
    return '<section class="box mfa">' + ic('shield') + '<h1 tabindex="-1">' + esc(A('فعّل المصادقة الثنائية', 'Turn on two-factor login')) + '</h1>' + (forced ? '<p class="note warn">' + ic('lock') + '<span>' + esc(A('حسابك الإداري يتطلب المصادقة الثنائية قبل فتح لوحة التحكم.', 'Your admin account needs two-factor login before the control app opens.')) + '</span></p>' : '') +
      '<ol class="steps"><li>' + esc(A('ثبّت تطبيق مصادقة على هاتفك: Google Authenticator أو Microsoft Authenticator.', 'Install an authenticator app: Google Authenticator or Microsoft Authenticator.')) + '</li><li>' + esc(A('اضغط «ابدأ» ثم امسح الرمز بالتطبيق.', 'Press “Start”, then scan the code with the app.')) + '</li><li>' + esc(A('اكتب الرمز المكوّن من 6 أرقام لتأكيد التفعيل.', 'Type the 6-digit code to confirm.')) + '</li></ol>' +
      '<div id="mfabox"><button class="btn pri" data-act="mfaenroll">' + ic('shield') + esc(A('ابدأ', 'Start')) + '</button></div></section>';
  }
  IS.mfaSetup = mfaSetup;
  IS.ACT.mfaenroll = async function () {
    var r = await MFA.enroll(), box = $('#mfabox'); IS.MFA_FACTOR = r.id;
    box.innerHTML = '<div class="qr" id="qr">' + (r.qr ? '<img src="' + esc(r.qr) + '" alt="QR">' : '') + '</div><p class="mut">' + esc(A('أو اكتب هذا المفتاح في التطبيق:', 'Or type this key into the app:')) + '</p><code class="key" dir="ltr">' + esc(r.secret) + '</code>' +
      '<form class="form otp" data-form="mfaconfirm"><input name="code" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" required dir="ltr" placeholder="••••••"><button class="btn pri">' + esc(A('تأكيد التفعيل', 'Confirm')) + '</button></form>';
    if (!r.qr && r.uri) { var draw = function () { try { new window.QRCode($('#qr'), { text: r.uri, width: 180, height: 180 }); } catch (e) {} }; if (window.QRCode) draw(); else { var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'; s.onload = draw; document.head.appendChild(s); } }
  };
  IS.SUB.mfaconfirm = async function (d) {
    try { await MFA.verify(IS.MFA_FACTOR, d.code); } catch (e) { return IS.toast(A('الرمز غير صحيح. حاول مرة أخرى.', 'Wrong code. Try again.'), true); }
    if (!DB.live) await DB.upd('profiles', uid(), { mfa_on: true }); else await DB.upd('profiles', uid(), { mfa_on: true }).catch(function () {});
    await IS.loadMe(); await IS.mfaCheck(); IS.audit(A('تفعيل المصادقة الثنائية', 'turn on 2FA')); IS.toast(A('فُعّلت المصادقة الثنائية', '2FA is on')); IS.route();
  };
  IS.SUB.mfacode = async function (d) {
    try { await MFA.verify((IS.MFA_STATE || {}).factor, d.code); } catch (e) { return IS.toast(A('الرمز غير صحيح.', 'Wrong code.'), true); }
    await IS.mfaCheck(); IS.audit(A('دخول بالتحقق بخطوتين', 'sign-in with 2FA')); IS.route();
  };
  IS.page('security', async function () {
    var s = IS.team() ? await MFA.state().catch(function () { return {}; }) : {};
    return IS.banner(esc(A('الأمان', 'Security')), '', 'shield') + (IS.team() ? (s.on ? '<section class="box">' + ic('checkc') + ' <b>' + esc(A('المصادقة الثنائية مفعّلة على حسابك.', 'Two-factor login is on for your account.')) + '</b></section>' : mfaSetup(false)) :
      IS.empty('shield', A('المصادقة الثنائية للحسابات الإدارية', 'Two-factor login is for admin accounts'), A('حسابك محمي بكلمة المرور أو بحساب Google.', 'Your account is protected by its password or Google account.')));
  }, { auth: true });
})();
