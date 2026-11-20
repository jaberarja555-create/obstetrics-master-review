/* اشرح لي: comments like Facebook (owner, 20 Nov 2026: "make people interactions in post like in Facebook; now people can't reply to
   each other"). Every comment is a bubble (name + text) with small actions under it: time · Like · Reply · Report / Delete, and the number
   of likes on the bubble. Replies sit under their comment, indented, each naming the person answered; long threads fold into
   «عرض الردود (N)». Like = ish_comment_like, Reply = ish_comment_reply (039_comment_threads.sql). Used by the post page, the comment panel
   of every feed card, the course request page and the library file page.
   Comment kinds: 'reply' (table replies: posts, courses, events, news, announcements) · 'request' (course_request_comments) · 'file'
   (library_comments). */
(function () {
  var A = IS.A, esc = IS.esc, ic = IS.ic;
  var TABLE = { reply: 'replies', request: 'course_request_comments', file: 'library_comments' };
  var MINE = {};   // kind → Set of comment ids this account liked
  function uid() { return IS.ME && IS.ME.id; }
  function name(row) { return row.name || row.author_name || ''; }

  /* one comment: o = { row, lk (kind), name, photo, when, body, report, del, badge, reply (bool) } (old callers pass only name/when/body/…) */
  IS.commentItem = function (o) {
    var row = o.row || {}, id = row.id, lk = o.lk, likes = Number(row.like_count) || 0, liked = !!(id && lk && MINE[lk] && MINE[lk].has(id));
    var acts = [];
    acts.push('<small class="cmt-t">' + esc(o.when || '') + '</small>');
    if (id && lk && uid()) {
      acts.push('<button type="button" class="cl' + (liked ? ' on' : '') + '" data-act="cmt-like" data-k="' + lk + '" data-id="' + esc(id) + '" aria-pressed="' + liked + '">' + esc(A('أعجبني', 'Like')) + '</button>');
      if (o.reply !== false) acts.push('<button type="button" class="cl" data-act="cmt-reply" data-k="' + lk + '" data-id="' + esc(id) + '" data-name="' + esc(o.name || name(row)) + '">' + esc(A('رد', 'Reply')) + '</button>');
    }
    if (o.report && IS.ME) acts.push('<button type="button" class="cl" data-act="report" data-kind="' + esc(o.report[0]) + '" data-id="' + esc(o.report[1]) + '">' + esc(A('إبلاغ', 'Report')) + '</button>');
    if (o.del) acts.push(String(o.del).replace(/class="cact( bad)?"/, 'class="cl bad"').replace(/<svg[\s\S]*?<\/svg>/, ''));
    var to = row.reply_to_name ? '<b class="cmt-to" dir="auto">' + esc(row.reply_to_name) + '</b> ' : '';
    return '<article class="cmt' + (row.parent_id ? ' kid' : '') + '"' + (id ? ' data-cid="' + esc(id) + '"' : '') + '>' + IS.av({ name: o.name, photo: o.photo }, row.parent_id ? 'xs' : 'sm', row.user_id) +
      '<div class="cmt-b"><div class="cmt-bub"><div class="cmt-h"><b dir="auto">' + esc(o.name || '') + '</b>' + (o.badge || '') + '</div>' +
      '<p class="pre" dir="auto">' + to + esc(o.body || '') + '</p>' +
      (likes ? '<span class="cmt-lk" title="' + esc(A('إعجابات', 'Likes')) + '">👍 <bdi>' + likes + '</bdi></span>' : '') + '</div>' +
      '<div class="cmt-a">' + acts.join('<i>·</i>') + '</div></div></article>';
  };

  /* comments and their replies: rows = every comment of one page (tops and replies, any order); item(row) → commentItem options */
  IS.thread = function (rows, lk, item, opts) {
    opts = opts || {};
    var ids = new Set(rows.map(function (r) { return r.id; })), kids = {}, tops = [];
    rows.forEach(function (r) {
      if (r.parent_id) { if (ids.has(r.parent_id)) (kids[r.parent_id] = kids[r.parent_id] || []).push(r); }   // a reply whose comment was removed is hidden
      else tops.push(r);
    });
    var by = function (a, b) { return a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0; };
    tops.sort(opts.newest ? function (a, b) { return by(b, a); } : by);
    if (!tops.length) return opts.empty || '';
    return tops.map(function (t) {
      var ks = (kids[t.id] || []).sort(by), open = opts.openId === t.id || ks.length <= 2;
      var one = function (r) { return IS.commentItem(Object.assign({ row: r, lk: lk, reply: opts.reply !== false }, item(r))); };
      return '<div class="cth" data-top="' + esc(t.id) + '">' + one(t) +
        (ks.length ? '<div class="cmt-kids">' + (open ? '' : '<button type="button" class="cmt-more" data-act="cmt-more">' + ic('chat') +
          esc(A('عرض الردود السابقة (' + (ks.length - 1) + ')', 'View ' + (ks.length - 1) + ' more ' + (ks.length - 1 === 1 ? 'reply' : 'replies'))) + '</button>') +
          ks.map(function (r, i) { return '<div class="cmt-k"' + (open || i === ks.length - 1 ? '' : ' hidden') + '>' + one(r) + '</div>'; }).join('') + '</div>' : '') + '</div>';
    }).join('');
  };
  /* this account's likes for the comments about to be shown (call before IS.thread) */
  IS.loadCommentLikes = async function (lk, rows) {
    if (!uid() || !rows.length) return;
    try {
      var got = await DB.q('comment_likes', { eq: { kind: lk, user_id: uid() }, in: { comment_id: rows.map(function (r) { return r.id; }) } });
      var s = MINE[lk] = MINE[lk] || new Set(); got.forEach(function (x) { s.add(x.comment_id); });
    } catch (e) {}
  };
  /* comments of a page plus the replies of the comments shown and the comments that shown replies answer */
  IS.withThreads = async function (lk, rows, target) {
    var table = TABLE[lk], have = new Set(rows.map(function (r) { return r.id; }));
    var tops = rows.filter(function (r) { return !r.parent_id; }).map(function (r) { return r.id; });
    var lost = Array.from(new Set(rows.filter(function (r) { return r.parent_id && !have.has(r.parent_id); }).map(function (r) { return r.parent_id; })));
    var more = await Promise.all([
      tops.length ? DB.q(table, { in: { parent_id: tops } }).catch(function () { return []; }) : [],
      lost.length ? DB.q(table, { in: { id: lost } }).catch(function () { return []; }) : []
    ]);
    more[0].concat(more[1]).forEach(function (r) { if (!have.has(r.id) && (!target || Object.keys(target).every(function (k) { return r[k] === target[k]; }))) { have.add(r.id); rows.push(r); } });
    rows = rows.filter(function (r) { return r.status !== 'removed'; });
    await IS.loadCommentLikes(lk, rows);
    return rows;
  };

  IS.ACT['cmt-more'] = function (b) {
    var box = b.closest('.cmt-kids'); IS.$$('.cmt-k', box).forEach(function (k) { k.hidden = false; }); b.remove();
  };

  IS.ACT['cmt-like'] = async function (b) {
    if (!uid()) return IS.ACT.login();
    var lk = b.dataset.k, id = b.dataset.id, s = MINE[lk] = MINE[lk] || new Set(), was = s.has(id);
    var art = b.closest('.cmt'), bub = art.querySelector('.cmt-bub'), cnt = bub.querySelector('.cmt-lk bdi'), n = cnt ? Number(cnt.textContent) : 0;
    function show(liked, count) {
      if (liked) s.add(id); else s.delete(id);
      b.classList.toggle('on', liked); b.setAttribute('aria-pressed', liked);
      var el = bub.querySelector('.cmt-lk');
      if (count > 0) { if (!el) { el = document.createElement('span'); el.className = 'cmt-lk'; bub.appendChild(el); } el.innerHTML = '👍 <bdi>' + count + '</bdi>'; }
      else if (el) el.remove();
    }
    show(!was, Math.max(0, n + (was ? -1 : 1)));
    b.disabled = true;
    try {
      var r;
      if (DB.live) { var x = await DB.sb.rpc('ish_comment_like', { kind: lk, comment: id }); if (x.error) throw x.error; r = x.data; }
      else {
        var mine = (await DB.q('comment_likes', { eq: { kind: lk, comment_id: id, user_id: uid() } }))[0];
        if (mine) await DB.del('comment_likes', mine.id); else await DB.ins('comment_likes', { kind: lk, comment_id: id, user_id: uid() });
        var count = (await DB.q('comment_likes', { eq: { kind: lk, comment_id: id } })).length;
        await DB.upd(TABLE[lk], id, { like_count: count }); r = { liked: !mine, count: count };
      }
      show(r.liked, r.count);
    } catch (e) { show(was, n); IS.toast(A('تعذّر حفظ الإعجاب.', 'Could not save the like.'), true); }
    finally { b.disabled = false; }
  };

  IS.ACT['cmt-reply'] = function (b) {
    if (!uid()) return IS.ACT.login();
    var th = b.closest('.cth'), kids = th.querySelector('.cmt-kids');
    if (!kids) { kids = document.createElement('div'); kids.className = 'cmt-kids'; th.appendChild(kids); }
    IS.$$('.cmt-k[hidden]', kids).forEach(function (k) { k.hidden = false; }); var more = kids.querySelector('.cmt-more'); if (more) more.remove();
    var f = kids.querySelector('form.cmt-rf');
    if (!f) {
      f = document.createElement('form'); f.className = 'cmt-rf'; f.dataset.form = 'cmt-reply';
      f.innerHTML = IS.av(IS.ME, 'xs') + '<div class="cmt-rbox"><span class="cmt-rto"></span><textarea name="body" rows="1" maxlength="2000" required dir="auto"></textarea>' +
        '<button class="cmt-send" aria-label="' + esc(A('أرسل الرد', 'Send reply')) + '">' + ic('send') + '</button></div><input type="hidden" name="k"><input type="hidden" name="parent">';
      kids.appendChild(f);
      var ta = f.querySelector('textarea');
      ta.addEventListener('input', function () { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'; });
      ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) { e.preventDefault(); f.requestSubmit(); } });
    }
    f.elements.k.value = b.dataset.k; f.elements.parent.value = b.dataset.id;
    f.querySelector('.cmt-rto').innerHTML = esc(A('الرد على ', 'Replying to ')) + '<b dir="auto">' + esc(b.dataset.name || '') + '</b>';
    var t = f.elements.body; t.placeholder = A('اكتب ردًا على ', 'Reply to ') + (b.dataset.name || '') + '…';
    t.focus(); f.scrollIntoView({ block: 'nearest' });
  };
  IS.SUB['cmt-reply'] = async function (d, f) {
    var body = String(d.body || '').trim(); if (!body) return;
    var lk = d.k, parent = d.parent, btn = f.querySelector('.cmt-send'); btn.disabled = true;
    try {
      if (DB.live) { var x = await DB.sb.rpc('ish_comment_reply', { kind: lk, parent: parent, body: body }); if (x.error) throw x.error; }
      else {
        var p = await DB.one(TABLE[lk], parent); if (!p) throw new Error('comment_unavailable');
        var row = { user_id: uid(), body: body, parent_id: p.parent_id || p.id, reply_to: p.user_id, reply_to_name: name(p), like_count: 0 };
        ['post_id', 'announcement_id', 'course_id', 'event_id', 'news_id', 'request_id', 'file_id'].forEach(function (k) { if (p[k]) row[k] = p[k]; });
        if (lk === 'reply') { row.name = IS.ME.name; row.photo = IS.ME.photo; row.status = 'open'; } else row.author_name = IS.ME.name;
        await DB.ins(TABLE[lk], row);
        if (p.user_id !== uid()) await IS.notify(p.user_id, 'ردّ ' + IS.ME.name + ' على تعليقك', body.slice(0, 140), location.hash || '#home');
        var cnt = function (t, k, v, col) { return DB.q(t, { eq: { [k]: v } }).then(function (rs) { return DB.upd(col[0], v, { [col[1]]: rs.filter(function (r) { return r.status !== 'removed'; }).length }); }).catch(function () {}); };
        if (row.post_id) await cnt('replies', 'post_id', row.post_id, ['posts', 'n_replies']);
        else if (row.request_id) await cnt(TABLE.request, 'request_id', row.request_id, ['course_requests', 'comment_count']);
        else if (row.file_id) await cnt(TABLE.file, 'file_id', row.file_id, ['files', 'comment_count']);
      }
      var panel = f.closest('.feed-comment-panel');
      var top = f.closest('.cth') && f.closest('.cth').dataset.top;
      if (panel && IS.reloadFeedComments) { f.remove(); IS.reloadFeedComments(panel, top); }
      else IS.refresh();
    } catch (e) {
      btn.disabled = false;
      IS.toast(e && /closed/.test(e.message || '') ? A('أُغلقت التعليقات هنا.', 'Comments are closed here.') : A('تعذّر نشر الرد. حاول مرة أخرى.', 'Could not post your reply. Try again.'), true);
    }
  };
})();
