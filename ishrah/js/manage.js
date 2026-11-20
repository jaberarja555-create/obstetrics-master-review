/* اشرح لي: one «Manage» menu for the team on every card, book and post (owner, 19 Nov 2026: "an admin should be able to delete or edit
   any post or book"). The ⋯ button shows only to team members whose role allows the action; the database checks the same permissions
   (posts: community edit · files: library approve · news: notify edit/delete · notices: notify delete · events: events edit/delete ·
   courses: review approve). Deleting a post or a file hides it (status «removed»), so a mistake can be undone from Control. */
(function () {
  var A = IS.A, esc = IS.esc, ic = IS.ic;
  var RULES = {
    post: { edit: ['community', 'edit'], del: ['community', 'edit'] },
    file: { del: ['library', 'approve'] },
    news: { edit: ['notify', 'edit'], del: ['notify', 'delete'] },
    notice: { del: ['notify', 'delete'] },
    event: { edit: ['events', 'edit'], del: ['events', 'delete'] },
    course: { edit: ['review', 'approve'], del: ['review', 'approve'] },
    request: { edit: ['review', 'approve'], del: ['review', 'delete'] },
    series: { edit: ['library', 'approve'], del: ['library', 'approve'] }
  };
  function may(kind, what) { var r = RULES[kind] && RULES[kind][what]; return !!(r && (IS.can(r[0], r[1]) || (kind === 'request' && what === 'edit' && IS.can('review', 'edit')))); }
  IS.manageBtn = function (kind, id) {
    if (!IS.ME || !(may(kind, 'edit') || may(kind, 'del'))) return '';
    return '<button type="button" class="mng" data-act="manage" data-k="' + esc(kind) + '" data-id="' + esc(id) + '" aria-label="' + esc(A('إدارة', 'Manage')) + '" title="' + esc(A('إدارة (للفريق)', 'Manage (team)')) + '">' + ic('shield') + '<span>' + esc(A('إدارة', 'Manage')) + '</span></button>';
  };
  var TABLE = { series: 'files', post: 'posts', file: 'files', news: 'news', notice: 'notices', event: 'events', course: 'courses', request: 'course_requests' };
  IS.ACT.manage = async function (b) {
    var kind = b.dataset.k, id = b.dataset.id;
    if (kind === 'series') return manageSeries(id);
    var row = await DB.one(TABLE[kind], id).catch(function () { return null; });
    if (!row) return IS.toast(A('لم يُعثر عليه', 'Not found'));
    var title = row.title || A('بدون عنوان', 'Untitled'), edit = '';
    if (kind === 'request') {   /* course requests: the full edit form (cover, price, date …) and delete through the request commands */
      var st = { pending: A('بانتظار الموافقة', 'Waiting for approval'), open: A('منشور', 'Published'), rejected: A('مرفوض', 'Declined'), closed: A('مغلق', 'Closed') }[row.status] || row.status;
      return IS.sheet(A('إدارة: ', 'Manage: ') + esc(title), '<p class="mut">' + esc(A('هذه الأدوات تظهر لفريق المنصة فقط.', 'These tools are shown to the platform team only.')) + ' · ' + esc(st) + '</p>' +
        '<div class="mng-list">' + (may(kind, 'edit') ? '<button type="button" class="btn ghost wide" data-act="cr-edit" data-request="' + esc(id) + '">' + ic('pen') + esc(A('عدّل الطلب والصورة', 'Edit the request and picture')) + '</button>' : '') +
        (row.status === 'pending' && IS.can('review', 'approve') ? '<button type="button" class="btn pri wide" data-act="cr-command" data-command="approve" data-request="' + esc(id) + '">' + ic('check') + esc(A('وافق وانشر', 'Approve and publish')) + '</button>' +
          '<button type="button" class="btn ghost bad wide" data-act="cr-command" data-command="reject" data-request="' + esc(id) + '">' + esc(A('ارفض الطلب', 'Decline request')) + '</button>' : '') +
        (may(kind, 'del') && !row.reserved_count ? '<button type="button" class="btn ghost bad wide" data-act="cr-command" data-command="delete" data-request="' + esc(id) + '">' + ic('trash') + esc(A('احذف الطلب', 'Delete request')) + '</button>' : '') + '</div>');
    }
    if (may(kind, 'edit')) {
      if (kind === 'post') edit = field('title', A('العنوان', 'Title'), row.title) + area('body', A('النص', 'Text'), row.body);
      else if (kind === 'news') edit = field('title', A('العنوان', 'Title'), row.title) + area('body', A('النص', 'Text'), row.body);
      else if (kind === 'event') edit = field('title', A('العنوان', 'Title'), row.title) + area('about', A('الوصف', 'Description'), row.about);
      else if (kind === 'course') edit = field('title', A('العنوان', 'Title'), row.title) + field('subtitle', A('الوصف المختصر', 'Short description'), row.subtitle);
    }
    IS.sheet(A('إدارة: ', 'Manage: ') + esc(title), '<p class="mut">' + esc(A('هذه الأدوات تظهر لفريق المنصة فقط.', 'These tools are shown to the platform team only.')) + '</p>' +
      (edit ? '<form class="form" data-form="manage-save"><input type="hidden" name="k" value="' + esc(kind) + '"><input type="hidden" name="id" value="' + esc(id) + '">' + edit +
        '<button class="btn pri wide">' + ic('check') + esc(A('حفظ التعديل', 'Save changes')) + '</button></form>' : '') +
      (kind === 'file' && row.owner_id && IS.libraryReturnButton ? IS.libraryReturnButton(id) : '') +
      (may(kind, 'del') ? '<div class="mng-del"><button type="button" class="btn ghost bad wide" data-act="manage-del" data-k="' + esc(kind) + '" data-id="' + esc(id) + '">' + ic('trash') +
        esc(kind === 'course' ? A('إخفاء الكورس عن الطلبة', 'Hide the course from students') : A('حذف', 'Delete')) + '</button></div>' : ''));
  };
  /* a book series: rename it for every part, open its page, or hide the whole series (every part «removed», undo from Control) */
  async function manageSeries(id) {
    var parts = (await DB.q('files', { eq: { series_id: id } }).catch(function () { return []; })).filter(function (f) { return f.status !== 'removed'; });
    if (!parts.length) return IS.toast(A('لم يُعثر عليه', 'Not found'));
    var name = parts[0].series_title || parts[0].title;
    IS.sheet(A('إدارة: ', 'Manage: ') + esc(name), '<p class="mut">' + esc(A('هذه الأدوات تظهر لفريق المنصة فقط.', 'These tools are shown to the platform team only.')) + ' · ' +
      esc(IS.partsCount ? IS.partsCount(parts.length) : parts.length) + '</p>' +
      (may('series', 'edit') ? '<form class="form" data-form="manage-save"><input type="hidden" name="k" value="series"><input type="hidden" name="id" value="' + esc(id) + '">' +
        field('series_title', A('اسم السلسلة', 'Series name'), name) + '<button class="btn pri wide">' + ic('check') + esc(A('حفظ التعديل', 'Save changes')) + '</button></form>' : '') +
      '<div class="mng-list"><a class="btn ghost wide" href="#series/' + esc(id) + '" data-close>' + ic('layers') + esc(A('افتح صفحة السلسلة وأجزاءها', 'Open the series and its parts')) + '</a></div>' +
      (may('series', 'del') ? '<div class="mng-del"><button type="button" class="btn ghost bad wide" data-act="manage-del" data-k="series" data-id="' + esc(id) + '">' + ic('trash') +
        esc(A('إخفاء السلسلة كاملة', 'Hide the whole series')) + '</button></div>' : ''));
  }
  function field(n, label, v) { return '<label class="fl"><span>' + esc(label) + '</span><input name="' + n + '" dir="auto" value="' + esc(v || '') + '"></label>'; }
  function area(n, label, v) { return '<label class="fl"><span>' + esc(label) + '</span><textarea name="' + n + '" rows="5" dir="auto">' + esc(String(v || '').replace(/<br\s*\/?>/g, '\n')) + '</textarea></label>'; }
  IS.SUB['manage-save'] = async function (d) {
    var kind = d.k;
    if (!may(kind, 'edit')) return;
    if (kind === 'series') {
      var name = String(d.series_title || '').trim(); if (!name) return IS.toast(A('الاسم مطلوب', 'A name is needed'));
      try {
        var parts = await DB.q('files', { eq: { series_id: d.id } });
        for (var i = 0; i < parts.length; i++) await DB.upd('files', parts[i].id, { series_title: name });
        IS.audit('edit series', name); IS.closeSheet(); IS.toast(A('حُفظ التعديل', 'Changes saved')); IS.refresh();
      } catch (e) { IS.toast(A('تعذّر الحفظ: ', 'Could not save: ') + (e.message || '')); }
      return;
    }
    var patch = {}; ['title', 'body', 'author', 'about', 'subtitle'].forEach(function (k) { if (d[k] != null) patch[k] = d[k]; });
    if (patch.title != null && !String(patch.title).trim()) return IS.toast(A('العنوان مطلوب', 'A title is needed'));
    try { await DB.upd(TABLE[kind], d.id, patch); IS.audit('edit ' + kind, patch.title || d.id); IS.closeSheet(); IS.toast(A('حُفظ التعديل', 'Changes saved')); IS.refresh(); }
    catch (e) { IS.toast(A('تعذّر الحفظ: ', 'Could not save: ') + (e.message || '')); }
  };
  IS.ACT['manage-del'] = async function (b) {
    var kind = b.dataset.k, id = b.dataset.id;
    if (!(await IS.confirm(kind === 'course' ? A('إخفاء هذا الكورس عن الطلبة الجدد؟', 'Hide this course from new students?') : A('حذف هذا العنصر؟ لن يظهر للطلبة بعد الآن.', 'Delete this item? Students will no longer see it.')))) return;
    try {
      if (kind === 'series') { var ps = await DB.q('files', { eq: { series_id: id } }); for (var i = 0; i < ps.length; i++) if (ps[i].status !== 'removed') await DB.upd('files', ps[i].id, { status: 'removed' }); }
      else if (kind === 'post' || kind === 'file') await DB.upd(TABLE[kind], id, { status: 'removed' });
      else if (kind === 'course') await DB.upd('courses', id, { status: 'hidden' });
      else await DB.del(TABLE[kind], id);
      IS.audit((kind === 'course' ? 'hide ' : 'delete ') + kind, id); IS.closeSheet(); IS.toast(A('تم', 'Done'));
      if (/^(post|file|series|news|event|course)$/.test((location.hash.slice(1).split('/')[0]) || '')) IS.go('home'); else IS.refresh();
    } catch (e) { IS.toast(A('تعذّر الحذف: ', 'Could not delete: ') + (e.message || '')); }
  };
  var PAGEKIND = { series: 'series', post: 'post', file: 'file', course: 'course', event: 'event', news: 'news', 'course-request': 'request', 'control-course-request': 'request', 'studio-course-request': 'request' };
  var prevRoute = IS.onRoute;
  IS.onRoute = function (name, arg, main) {
    if (prevRoute) try { prevRoute(name, arg, main); } catch (e) {}
    var kind = PAGEKIND[name], parts = String(arg || '').split('/'), id = parts[0];
    if (name === 'news' && parts[0] === 'ann') { kind = 'notice'; id = parts[1]; }
    if (!kind || !id || /^(all|ann)$/.test(id)) return;
    var btn = IS.manageBtn(kind, id), page = main.querySelector('.page'); if (!btn || !page || page.querySelector('.mngbar')) return;
    var bar = document.createElement('div'); bar.className = 'mngbar';
    bar.innerHTML = '<span>' + ic('shield') + esc(kind === 'file' ? A('أدوات مراجعة الملف', 'File moderation tools') : A('أدوات الفريق', 'Team tools')) + '</span>' + btn;
    page.insertBefore(bar, page.firstChild);
  };
})();
