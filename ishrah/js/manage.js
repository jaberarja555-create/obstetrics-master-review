/* اشرح لي: the same team tools on every post, and edit / delete for authors (owner, 19–20 Nov 2026: "an admin should be able to delete or edit
   any post or book"; "admin control should be the same in all posts: delete, suspend, send to the owner to adjust; use nice emoji instead of
   words; owners have edit and delete on their posts as nice emoji").
   Team (only roles that allow it; the database checks the same in ish_team_act, 045_team_tools.sql):
     ✏️ edit · ⏸️ suspend / ▶️ publish again · 📨 send back to the author with a note (optionally suspended until fixed) · 🗑️ delete
     kinds: post · file · series · course · event · news · notice · request. A suspended item has status 'suspended' (a request: 'pending').
   Authors: ✏️ (their own edit flow) and 🗑️ (ish_own_delete) on their own cards. */
(function () {
  var A = IS.A, esc = IS.esc, ic = IS.ic;
  var RULES = {
    post: { edit: ['community', 'edit'], del: ['community', 'edit'] },
    file: { edit: ['library', 'approve'], del: ['library', 'approve'] },
    series: { edit: ['library', 'approve'], del: ['library', 'approve'] },
    news: { edit: ['notify', 'edit'], del: ['notify', 'delete'] },
    notice: { edit: ['notify', 'edit'], del: ['notify', 'delete'] },
    event: { edit: ['events', 'edit'], del: ['events', 'delete'] },
    course: { edit: ['review', 'approve'], del: ['review', 'approve'] },
    request: { edit: ['review', 'approve'], del: ['review', 'delete'] }
  };
  function may(kind, what) { var r = RULES[kind] && RULES[kind][what]; return !!(r && (IS.can(r[0], r[1]) || (kind === 'request' && what === 'edit' && IS.can('review', 'edit')))); }
  IS.manageBtn = function (kind, id) {
    if (!IS.ME || !(may(kind, 'edit') || may(kind, 'del'))) return '';
    return '<button type="button" class="mng" data-act="manage" data-k="' + esc(kind) + '" data-id="' + esc(id) + '" aria-label="' + esc(A('إدارة', 'Manage')) + '" title="' +
      esc(A('إدارة (للفريق)', 'Manage (team)')) + '"><i class="mng-e" aria-hidden="true">🛡️</i><span>' + esc(A('إدارة', 'Manage')) + '</span></button>';
  };
  var TABLE = { series: 'files', post: 'posts', file: 'files', news: 'news', notice: 'notices', event: 'events', course: 'courses', request: 'course_requests' };
  var LIVE = { post: 'open', request: 'open' };
  function authorOf(kind, row) { return kind === 'post' || kind === 'request' ? row.user_id : kind === 'file' || kind === 'series' ? row.owner_id : kind === 'course' || kind === 'event' ? row.lecturer_id : kind === 'news' ? row.author_id : null; }
  function isOff(kind, row) { return kind === 'request' ? row.status === 'pending' : row.status === 'suspended'; }

  async function load(kind, id) {
    if (kind === 'series') {
      var parts = (await DB.q('files', { eq: { series_id: id } }).catch(function () { return []; })).filter(function (f) { return f.status !== 'removed'; })
        .sort(function (a, b) { return (a.series_no || 9999) - (b.series_no || 9999); });
      if (!parts.length) return null;
      return Object.assign({}, parts[0], { id: id, title: parts[0].series_title || parts[0].title, _parts: parts,
        status: parts.every(function (p) { return p.status === 'suspended'; }) ? 'suspended' : parts[0].status });
    }
    return DB.one(TABLE[kind], id).catch(function () { return null; });
  }
  function tile(act, emoji, label, extra, tone) {
    return '<button type="button" class="mtile' + (tone ? ' ' + tone : '') + '" data-act="' + act + '"' + (extra || '') + '><i aria-hidden="true">' + emoji + '</i><span>' + esc(label) + '</span></button>';
  }
  IS.ACT.manage = async function (b) {
    var kind = b.dataset.k, id = b.dataset.id, row = await load(kind, id);
    if (!row) return IS.toast(A('لم يُعثر عليه', 'Not found'));
    var title = row.title || A('بدون عنوان', 'Untitled'), off = isOff(kind, row), author = authorOf(kind, row), k = ' data-k="' + esc(kind) + '" data-id="' + esc(id) + '"';
    var tiles = [];
    if (may(kind, 'edit')) tiles.push(kind === 'request' ? tile('cr-edit', '✏️', A('تعديل', 'Edit'), ' data-request="' + esc(id) + '"') : tile('mng-edit', '✏️', A('تعديل', 'Edit'), k));
    if (kind === 'request' && row.status === 'pending' && IS.can('review', 'approve')) {
      tiles.push(tile('cr-command', '✅', A('وافق وانشر', 'Approve'), ' data-command="approve" data-request="' + esc(id) + '"', 'ok'));
      tiles.push(tile('cr-command', '🚫', A('ارفض', 'Decline'), ' data-command="reject" data-request="' + esc(id) + '"', 'warn'));
    } else if (may(kind, 'edit') || may(kind, 'del')) {
      tiles.push(off ? tile('mng-state', '▶️', A('أعد النشر', 'Publish again'), k + ' data-to="resume"', 'ok') : tile('mng-state', '⏸️', A('إيقاف مؤقت', 'Suspend'), k + ' data-to="suspend"', 'warn'));
    }
    if (author && (may(kind, 'edit') || may(kind, 'del'))) tiles.push(tile('mng-return', '📨', A('أرسل للمالك ليعدّل', 'Send back to the author'), k));
    if (may(kind, 'del')) tiles.push(tile('mng-del', kind === 'course' ? '🙈' : '🗑️', kind === 'course' ? A('إخفاء الكورس', 'Hide course') : A('حذف', 'Delete'), k, 'bad'));
    var state = off ? '<span class="mng-st off">' + esc(kind === 'request' ? A('بانتظار الموافقة', 'Waiting for approval') : A('موقوف مؤقتًا', 'Suspended')) + '</span>' :
      '<span class="mng-st on">' + esc(A('منشور', 'Published')) + '</span>';
    IS.sheet('🛡️ ' + esc(A('إدارة', 'Manage')), '<div class="mng-head"><b dir="auto">' + esc(title) + '</b>' + state + (kind === 'series' && row._parts ? '<small class="mut">' + esc(IS.partsCount ? IS.partsCount(row._parts.length) : '') + '</small>' : '') + '</div>' +
      '<div class="mtiles">' + tiles.join('') + '</div><p class="mut mng-note">' + esc(A('هذه الأدوات تظهر لفريق المنصة فقط، وكل إجراء يُسجَّل في سجل النشاط.', 'Only the platform team sees these tools; every action is written to the activity log.')) + '</p>', { nofocus: true });
  };

  /* one call for every team action: the live database command, or the same change in the preview store */
  async function act(kind, id, action, note, data) {
    if (DB.live) { var r = await DB.sb.rpc('ish_team_act', { kind: kind, target: id, action: action, note: note || null, data: data || {} }); if (r.error) throw r.error; return; }
    var row = await load(kind, id), ids = kind === 'series' ? row._parts.map(function (p) { return p.id; }) : [id], table = TABLE[kind];
    var live = LIVE[kind] || 'published', st = action === 'resume' ? live : kind === 'request' ? 'pending' : 'suspended';
    for (var i = 0; i < ids.length; i++) {
      if (action === 'edit') await DB.upd(table, ids[i], data);
      else if (action === 'suspend' || action === 'resume' || (action === 'return' && data && data.suspend)) await DB.upd(table, ids[i], { status: st });
      else if (action === 'delete') { if (kind === 'event' || kind === 'news' || kind === 'notice') await DB.del(table, ids[i]); else await DB.upd(table, ids[i], { status: kind === 'course' ? 'hidden' : kind === 'request' ? 'deleted' : 'removed' }); }
    }
    if (action === 'return') { var who = authorOf(kind, row); if (who && IS.notify) IS.notify(who, A('طلب الفريق تعديل منشورك: ', 'The team asked you to edit your post: ') + (row.title || ''), note, '#' + (kind === 'request' ? 'course-request' : kind) + '/' + id); }
    if (IS.audit) IS.audit('team ' + action + ' ' + kind, id);
  }
  function errText(e) {
    var m = String((e && e.message) || e || '');
    return /own_delete_paid/.test(m) ? A('هذا محتوى مدفوع؛ اطلب حذفه من الإدارة.', 'This is paid content; ask the team to delete it.') :
      /permission/.test(m) ? A('دورك لا يسمح بهذا الإجراء.', 'Your role does not allow this.') : /payments/.test(m) ? A('في هذا الطلب دفعات؛ لا يمكن حذفه.', 'This request has payments and cannot be deleted.') :
      navigator.onLine ? A('تعذّر التنفيذ: ', 'Could not do it: ') + m : A('هذا يحتاج إلى الإنترنت.', 'This needs the internet.');
  }
  function after(msg, leave) {
    IS.closeSheet(); IS.toast(msg);
    if (leave && /^(post|file|series|news|event|course)$/.test((location.hash.slice(1).split('/')[0]) || '')) IS.go('home'); else { IS.keepScroll = true; IS.refresh(); }
  }

  function field(n, label, v) { return '<label class="fl"><span>' + esc(label) + '</span><input name="' + n + '" dir="auto" value="' + esc(v || '') + '"></label>'; }
  function area(n, label, v) { return '<label class="fl"><span>' + esc(label) + '</span><textarea name="' + n + '" rows="5" dir="auto">' + esc(String(v || '').replace(/<br\s*\/?>/g, '\n')) + '</textarea></label>'; }
  IS.ACT['mng-edit'] = async function (b) {
    var kind = b.dataset.k, id = b.dataset.id, row = await load(kind, id); if (!row) return;
    var f = kind === 'post' || kind === 'news' || kind === 'notice' ? field('title', A('العنوان', 'Title'), row.title) + area('body', A('النص', 'Text'), row.body) :
      kind === 'event' ? field('title', A('العنوان', 'Title'), row.title) + area('about', A('الوصف', 'Description'), row.about) :
      kind === 'course' ? field('title', A('العنوان', 'Title'), row.title) + field('subtitle', A('الوصف المختصر', 'Short description'), row.subtitle) :
      kind === 'file' ? field('title', A('العنوان', 'Title'), row.title) + field('author', A('المؤلف', 'Author'), row.author) + area('about', A('الوصف', 'Description'), row.about) :
      kind === 'series' ? field('series_title', A('اسم السلسلة', 'Series name'), row.title) : '';
    IS.sheet('✏️ ' + esc(A('تعديل', 'Edit')), '<form class="form" data-form="mng-save"><input type="hidden" name="k" value="' + esc(kind) + '"><input type="hidden" name="id" value="' + esc(id) + '">' + f +
      '<button class="btn pri wide">' + ic('check') + esc(A('حفظ التعديل', 'Save changes')) + '</button></form>');
  };
  IS.SUB['mng-save'] = async function (d) {
    var kind = d.k, data = {}; ['title', 'body', 'author', 'about', 'subtitle', 'series_title'].forEach(function (k) { if (d[k] != null) data[k] = d[k]; });
    if ((data.title != null && !String(data.title).trim()) || (data.series_title != null && !String(data.series_title).trim())) return IS.toast(A('العنوان مطلوب', 'A title is needed'));
    try { await act(kind, d.id, 'edit', null, data); after(A('حُفظ التعديل', 'Changes saved')); } catch (e) { IS.toast(errText(e), true); }
  };
  IS.ACT['mng-state'] = async function (b) {
    var to = b.dataset.to;
    if (to === 'suspend' && !(await IS.confirm(A('إيقاف هذا المنشور مؤقتًا؟ يختفي عن الطلاب حتى تعيد نشره.', 'Suspend this post? Students will not see it until you publish it again.'), A('أوقفه', 'Suspend')))) return;
    try { await act(b.dataset.k, b.dataset.id, to); after(to === 'suspend' ? A('⏸️ أُوقف مؤقتًا', '⏸️ Suspended') : A('▶️ نُشر من جديد', '▶️ Published again')); } catch (e) { IS.toast(errText(e), true); }
  };
  IS.ACT['mng-return'] = function (b) {
    IS.sheet('📨 ' + esc(A('أرسل للمالك ليعدّل', 'Send back to the author')), '<form class="form" data-form="mng-return"><input type="hidden" name="k" value="' + esc(b.dataset.k) + '"><input type="hidden" name="id" value="' + esc(b.dataset.id) + '">' +
      '<label class="fl"><span>' + esc(A('ما الذي يجب تعديله؟ تصل الملاحظة للمالك في إشعاراته.', 'What should be changed? The note reaches the author in their notifications.')) + '</span><textarea name="note" rows="4" required maxlength="1000" dir="auto"></textarea></label>' +
      '<label class="chk"><input type="checkbox" name="suspend" checked> <span>⏸️ ' + esc(A('أوقفه مؤقتًا حتى يعدّله', 'Suspend it until it is fixed')) + '</span></label>' +
      '<button class="btn pri wide">📨 ' + esc(A('أرسل', 'Send')) + '</button></form>');
  };
  IS.SUB['mng-return'] = async function (d) {
    if (!String(d.note || '').trim()) return;
    try { await act(d.k, d.id, 'return', d.note.trim(), { suspend: !!d.suspend }); after(A('📨 أُرسلت الملاحظة للمالك', '📨 Note sent to the author')); } catch (e) { IS.toast(errText(e), true); }
  };
  IS.ACT['mng-del'] = async function (b) {
    var kind = b.dataset.k;
    if (!(await IS.confirm(kind === 'course' ? A('إخفاء هذا الكورس عن الطلبة الجدد؟', 'Hide this course from new students?') : A('حذف هذا المنشور؟ لن يظهر للطلبة بعد الآن.', 'Delete this post? Students will no longer see it.'), kind === 'course' ? A('أخفِه', 'Hide') : A('احذف', 'Delete')))) return;
    try { await act(kind, b.dataset.id, 'delete'); after(A('🗑️ تم', '🗑️ Done'), true); } catch (e) { IS.toast(errText(e), true); }
  };
  /* old names still used by other pages */
  IS.ACT['manage-del'] = IS.ACT['mng-del'];

  /* ---- authors: ✏️ and 🗑️ on their own posts ---- */
  IS.ownBtns = function (kind, row, partId) {
    if (!IS.ME || !row || authorOf(kind, row) !== IS.ME.id || kind === 'news' || kind === 'notice') return '';
    var id = esc(row.series_id && kind === 'series' ? row.series_id : row.id), edit;
    if (kind === 'post') edit = 'data-act="post-edit" data-id="' + id + '"';
    else if (kind === 'file') edit = 'data-act="edit-library-upload" data-id="' + id + '"';
    else if (kind === 'series') edit = 'data-act="edit-library-series" data-id="' + esc(partId || row.id) + '"';
    else if (kind === 'request') edit = 'data-act="cr-edit" data-request="' + id + '"';
    else if (kind === 'event') edit = 'data-act="evform" data-id="' + id + '"';
    else if (kind === 'course') edit = 'data-go="#studio-course/' + id + '/details" data-act="own-go"';
    if (!edit) return '';
    var paid = /^(course|file|series)$/.test(kind) && +row.price > 0;
    if (paid) return '<span class="own"><button type="button" class="own-b" data-act="own-ask" data-what="edit" data-k="' + esc(kind) + '" data-id="' + id + '" data-t="' + esc(row.series_title || row.title || '') +
      '" aria-label="' + esc(A('طلب تعديل من الإدارة', 'Ask the team to edit')) + '" title="' + esc(A('تعديل (عبر الإدارة لأنه مدفوع)', 'Edit (through the team: paid)')) + '">✏️</button>' +
      '<button type="button" class="own-b" data-act="own-ask" data-what="delete" data-k="' + esc(kind) + '" data-id="' + id + '" data-t="' + esc(row.series_title || row.title || '') +
      '" aria-label="' + esc(A('طلب حذف من الإدارة', 'Ask the team to delete')) + '" title="' + esc(A('حذف (عبر الإدارة لأنه مدفوع)', 'Delete (through the team: paid)')) + '">🗑️</button></span>';
    return '<span class="own"><button type="button" class="own-b" ' + edit + ' aria-label="' + esc(A('تعديل منشورك', 'Edit your post')) + '" title="' + esc(A('تعديل', 'Edit')) + '">✏️</button>' +
      ('<button type="button" class="own-b" data-act="own-del" data-k="' + esc(kind) + '" data-id="' + id + '" aria-label="' + esc(A('حذف منشورك', 'Delete your post')) + '" title="' + esc(A('حذف', 'Delete')) + '">🗑️</button>') + '</span>';
  };
  IS.ACT['own-go'] = function (b) { location.hash = b.dataset.go; };
  /* a paid item: the author asks the team (students have paid for it) */
  IS.ACT['own-ask'] = function (b) {
    var del = b.dataset.what === 'delete', kind = b.dataset.k, t = b.dataset.t || '';
    if (!IS.newTicket) return IS.toast(A('راسل فريق المنصة من «الدعم والرسائل».', 'Message the platform team from Support.'));
    IS.newTicket('content', { subject: (del ? A('طلب حذف: ', 'Delete request: ') : A('طلب تعديل: ', 'Edit request: ')) + t + ' (' + kind + ')', course: kind === 'course' ? b.dataset.id : '' });
    setTimeout(function () { var n = document.querySelector('#sheet form[data-form=ticket] .note span'); if (n) n.textContent = A('هذا محتوى مدفوع، لذلك يمر التعديل أو الحذف عبر فريق المنصة حفاظًا على حقوق الطلاب الذين دفعوا. اكتب ما تريد تغييره.', 'This is paid content, so editing or deleting goes through the platform team to protect students who paid. Write what you want changed.'); }, 60);
  };
  IS.ACT['own-del'] = async function (b) {
    var kind = b.dataset.k, id = b.dataset.id;
    if (!(await IS.confirm(A('حذف منشورك؟ لن يراه أحد بعد الآن.', 'Delete your post? Nobody will see it any more.'), A('احذف', 'Delete')))) return;
    try {
      if (DB.live) { var r = await DB.sb.rpc('ish_own_delete', { kind: kind, target: id }); if (r.error) throw r.error; }
      else if (kind === 'event') await DB.del('events', id);
      else if (kind === 'course') await DB.upd('courses', id, { status: 'hidden' });
      else if (kind === 'series') { var ps = await DB.q('files', { eq: { series_id: id } }); for (var i = 0; i < ps.length; i++) await DB.upd('files', ps[i].id, { status: 'removed' }); }
      else await DB.upd(TABLE[kind], id, { status: kind === 'request' ? 'deleted' : 'removed' });
      after(A('🗑️ حُذف منشورك', '🗑️ Your post was deleted'), true);
    } catch (e) { IS.toast(errText(e), true); }
  };

  var PAGEKIND = { series: 'series', post: 'post', file: 'file', course: 'course', event: 'event', news: 'news', 'course-request': 'request', 'control-course-request': 'request', 'studio-course-request': 'request' };
  var prevRoute = IS.onRoute;
  IS.onRoute = function (name, arg, main) {
    if (prevRoute) try { prevRoute(name, arg, main); } catch (e) {}
    var kind = PAGEKIND[name], parts = String(arg || '').split('/'), id = parts[0];
    if (name === 'news' && parts[0] === 'ann') { kind = 'notice'; id = parts[1]; }
    if (!kind || !id || /^(all|ann)$/.test(id)) return;
    if (IS.ME && /^(course|event|file|series|request)$/.test(kind) && !/^(control|studio)-/.test(name)) load(kind, id).then(function (row) {
      var page = main.querySelector('.page'), own = row && IS.ownBtns(kind, row, row._parts && row._parts[0] && row._parts[0].id);
      if (!own || !page || page.querySelector('.ownbar')) return;
      var bar = document.createElement('div'); bar.className = 'ownbar';
      bar.innerHTML = '<span>' + esc(kind === 'course' ? A('كورسك', 'Your course') : kind === 'event' ? A('فعاليتك', 'Your event') : kind === 'request' ? A('طلبك', 'Your request') : A('ملفك', 'Your upload')) +
        (/^(course|file|series)$/.test(kind) && +row.price > 0 ? ' · ' + esc(A('مدفوع: التعديل والحذف عبر الإدارة', 'paid: edit and delete through the team')) : '') + '</span>' + own;
      page.insertBefore(bar, page.firstChild);
    }).catch(function () {});
    var btn = IS.manageBtn(kind, id), page = main.querySelector('.page'); if (!btn || !page || page.querySelector('.mngbar')) return;
    var bar = document.createElement('div'); bar.className = 'mngbar';
    bar.innerHTML = '<span>🛡️ ' + esc(A('أدوات الفريق', 'Team tools')) + '</span>' + btn;
    page.insertBefore(bar, page.firstChild);
  };
})();
