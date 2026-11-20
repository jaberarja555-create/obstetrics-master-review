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
  var MINE = {};   // kind → Map comment id → this account's reaction (1 like · 2 love · 3 angry · -1 dislike)
  var RX = [[1, '👍', 'أعجبني', 'Like', 'like'], [2, '❤️', 'أحببته', 'Love', 'love'], [3, '😡', 'أغضبني', 'Angry', 'angry'], [-1, '👎', 'لم يعجبني', 'Dislike', 'dislike']];
  function rxOf(v) { return RX.find(function (r) { return r[0] === Number(v); }); }
  function mine(lk, id) { return (MINE[lk] && MINE[lk].get(id)) || 0; }
  function counts(row) {
    var c = row.rx && typeof row.rx === 'object' ? row.rx : {};
    if (!Object.keys(c).length && Number(row.like_count)) c = { 1: Number(row.like_count) };
    return c;
  }
  function badge(c) {
    var list = RX.map(function (r) { return [r, Number(c[r[0]]) || 0]; }).filter(function (x) { return x[1]; }).sort(function (a, b) { return b[1] - a[1]; });
    var total = list.reduce(function (t, x) { return t + x[1]; }, 0);
    return total ? '<button type="button" class="cmt-lk" data-act="rx-who" data-rx="' + esc(JSON.stringify(c)) + '" aria-label="' + esc(A('من تفاعل؟ ', 'Who reacted? ') + list.map(function (x) { return x[0][1] + ' ' + x[1]; }).join(' · ')) + '">' +
      '<span class="cmt-es" dir="ltr">' + list.slice(0, 3).map(function (x) { return '<i>' + x[0][1] + '</i>'; }).join('') + '</span><b>' + total + '</b></button>' : '';
  }
  /* under a comment the chosen reaction is its word in its colour, not the emoji (the emojis are only in the count) */
  function rxLabel(v) { var r = rxOf(v); return r ? esc(A(r[2], r[3])) : esc(A('أعجبني', 'Like')); }
  function uid() { return IS.ME && IS.ME.id; }
  function name(row) { return row.name || row.author_name || ''; }

  /* one comment: o = { row, lk (kind), name, photo, when, body, report, del, badge, reply (bool) } (old callers pass only name/when/body/…) */
  IS.commentItem = function (o) {
    var row = o.row || {}, id = row._queued ? null : row.id, lk = o.lk, my = id && lk ? mine(lk, id) : 0, cur = rxOf(my);
    /* your own comments always show your current picture and name (owner, 20 Nov 2026: "I changed my profile picture but it didn't appear") */
    if (IS.ME && row.user_id && row.user_id === IS.ME.id) { o = Object.assign({}, o, { name: IS.ME.name || o.name, photo: IS.ME.photo || o.photo }); }
    var acts = [];
    acts.push('<small class="cmt-t">' + esc(row._queued ? A('⏳ يُرسل عند عودة الاتصال', '⏳ Sends when you are back online') : o.when || '') + '</small>');
    if (id && lk && uid()) {
      acts.push('<span class="rx-wrap cmt-rxw"><button type="button" class="cl' + (cur ? ' on rx-v-' + cur[4] : '') + '" data-act="cmt-rx-open" aria-haspopup="true" aria-expanded="false">' + rxLabel(my) + '</button>' +
        '<span class="rx-pick" role="menu" hidden>' + RX.map(function (r) {
          return '<button type="button" role="menuitem" data-act="cmt-react" data-k="' + lk + '" data-id="' + esc(id) + '" data-value="' + r[0] + '" aria-pressed="' + (my === r[0]) +
            '" aria-label="' + esc(A(r[2], r[3])) + '" title="' + esc(A(r[2], r[3])) + '"><span>' + r[1] + '</span></button>';
        }).join('') + '</span></span>');
      if (o.reply !== false) acts.push('<button type="button" class="cl" data-act="cmt-reply" data-k="' + lk + '" data-id="' + esc(id) + '" data-name="' + esc(o.name || name(row)) + '">' + esc(A('رد', 'Reply')) + '</button>');
    }
    var menu = (o.report && IS.ME ? '<button type="button" class="cmt-rep" data-act="report" data-kind="' + esc(o.report[0]) + '" data-id="' + esc(o.report[1]) + '" aria-label="' +
        esc(A('إبلاغ', 'Report')) + '" title="' + esc(A('إبلاغ', 'Report')) + '">' + ic('flag') + '</button>' : '') +
      (o.del ? '<span class="cmt-del">' + String(o.del) + '</span>' : '');
    var to = row.reply_to_name && !o.hideTo ? '<b class="cmt-to" dir="auto">' + esc(row.reply_to_name) + '</b> ' : '';
    return '<article class="cmt' + (row.parent_id ? ' kid' : '') + '"' + (id ? ' data-cid="' + esc(id) + '"' : '') + (lk ? ' data-lk="' + lk + '"' : '') + '>' + IS.av({ name: o.name, photo: o.photo }, row.parent_id ? 'xs' : 'sm', row.user_id) +
      '<div class="cmt-b"><div class="cmt-row"><div class="cmt-bub"><div class="cmt-h"><b dir="auto">' + esc(o.name || '') + '</b>' + (o.badge || '') + '</div>' +
      '<p class="pre" dir="auto">' + to + esc(o.body || '') + '</p></div></div>' +
      '<div class="cmt-a">' + acts.join('') + badge(counts(row)) +
      (menu ? '<span class="cmt-tools">' + menu + '</span>' : '') +
      '</div></div></article>';
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
      var ks = (kids[t.id] || []).sort(by), open = opts.openId === t.id;
      var one = function (r) { return IS.commentItem(Object.assign({ row: r, lk: lk, reply: opts.reply !== false, hideTo: r.parent_id && r.reply_to === t.user_id }, item(r))); };
      var prev = function (r) { var x = item(r);
        return '<button type="button" class="cmt-prev" data-act="cmt-more">' + IS.av({ name: x.name, photo: x.photo }, 'xs', r.user_id) + '<span><b dir="auto">' + esc(x.name || '') + '</b> <bdi>' + esc(String(x.body || '').slice(0, 120)) + '</bdi></span></button>'; };
      return '<div class="cth" data-top="' + esc(t.id) + '">' + one(t) +
        (ks.length ? '<div class="cmt-kids">' + (open ? '' : ks.slice(-2).map(prev).join('') + (ks.length > 2 ? '<button type="button" class="cmt-more" data-act="cmt-more">' +
          esc(A('عرض كل الردود (' + ks.length + ')', 'View all ' + ks.length + ' replies')) + '</button>' : '')) +
          ks.map(function (r) { return '<div class="cmt-k"' + (open ? '' : ' hidden') + '>' + one(r) + '</div>'; }).join('') + '</div>' : '') + '</div>';
    }).join('');
  };
  /* this account's likes for the comments about to be shown (call before IS.thread) */
  IS.loadCommentLikes = async function (lk, rows) {
    if (!uid() || !rows.length) return;
    try {
      var got = await DB.q('comment_likes', { eq: { kind: lk, user_id: uid() }, in: { comment_id: rows.map(function (r) { return r.id; }) } });
      var m = MINE[lk] = MINE[lk] || new Map(); got.forEach(function (x) { m.set(x.comment_id, Number(x.reaction) || 1); });
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
    var box = b.closest('.cmt-kids'); IS.$$('.cmt-k', box).forEach(function (k) { k.hidden = false; }); IS.$$('.cmt-prev, .cmt-more', box).forEach(function (x) { x.remove(); });
  };

  /* the comment boxes grow with the text; Enter sends on computers (Shift+Enter = new line) */
  IS.cmtBox = function (form, hidden, label) {
    return '<form class="cmt-compose" data-form="' + form + '">' + (hidden || '') + (IS.ME ? IS.av(IS.ME, 'xs') : '') + '<div class="cmt-rbox"><textarea name="body" rows="1" maxlength="2000" required dir="auto" placeholder="' +
      esc(label || A('اكتب تعليقًا…', 'Write a comment…')) + '" aria-label="' + esc(label || A('اكتب تعليقًا', 'Write a comment')) + '"></textarea><button class="cmt-send" aria-label="' + esc(A('أرسل', 'Send')) + '">' + ic('send') + '</button></div></form>';
  };
  document.addEventListener('input', function (e) { var t = e.target; if (t.matches && t.matches('.cmt-rbox textarea')) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 160) + 'px'; } });
  document.addEventListener('keydown', function (e) {
    var t = e.target; if (!t.matches || !t.matches('.cmt-rbox textarea') || e.key !== 'Enter' || e.shiftKey || matchMedia('(hover:none)').matches) return;
    e.preventDefault(); if (t.value.trim()) t.form.requestSubmit();
  });
  /* a comment appears the moment it is sent (owner, 20 Nov 2026: "making a post or editing … should not feel slow, like Facebook") */
  IS.instantComment = function (form, body) {
    var list = form.parentNode.querySelector('.cthreads') || form.closest('.post-comments, .feed-comment-panel, section') && (form.closest('.post-comments, .feed-comment-panel, section').querySelector('.cthreads, [data-feed-entries]'));
    if (!list) return null;
    var empty = list.querySelector(':scope > p.mut'); if (empty) empty.remove();
    var el = document.createElement('div'); el.className = 'cth sending';
    el.innerHTML = IS.commentItem({ name: IS.ME ? IS.ME.name : '', photo: IS.ME && IS.ME.photo, when: A('جارٍ الإرسال…', 'Sending…'), body: body });
    list.appendChild(el);
    var t = form.querySelector('textarea'); if (t) { t.value = ''; t.style.height = ''; }
    return { done: function () { var w = el.querySelector('.cmt-t');
        if (DB.wasQueued && DB.wasQueued()) { if (w) w.textContent = A('⏳ يُرسل عند عودة الاتصال', '⏳ Sends when you are back online'); return; }
        el.classList.remove('sending'); if (w) w.textContent = A('الآن', 'Now'); },
      fail: function () { el.remove(); if (t) t.value = body; IS.toast(A('لم يُرسل التعليق. تحقق من الاتصال وحاول مرة أخرى.', 'The comment was not sent. Check the connection and try again.'), true); } };
  };
  IS.quietRefresh = function () { if (DB.wasQueued && DB.wasQueued()) return; IS.keepScroll = true; IS.refresh(); };
  IS.ACT['cmt-menu'] = function (b) {
    var m = b.parentNode.querySelector('.cmt-menu'), open = m.hidden;
    IS.$$('.cmt-menu:not([hidden])').forEach(function (x) { x.hidden = true; });
    m.hidden = !open;
  };
  document.addEventListener('click', function (e) { if (e.target.closest && !e.target.closest('.cmt-mw')) IS.$$('.cmt-menu:not([hidden])').forEach(function (x) { x.hidden = true; }); });
  IS.ACT['cmt-rx-open'] = function (b) {
    var pick = b.parentNode.querySelector('.rx-pick'), open = pick.hidden;
    IS.$$('.rx-pick:not([hidden])').forEach(function (p) { if (p !== pick) p.hidden = true; });
    pick.hidden = !open; b.setAttribute('aria-expanded', open);
  };
  IS.ACT['cmt-react'] = async function (b) {
    if (!uid()) return IS.ACT.login();
    var lk = b.dataset.k, id = b.dataset.id, value = Number(b.dataset.value), m = MINE[lk] = MINE[lk] || new Map();
    var wrap = b.closest('.rx-wrap'), pick = wrap.querySelector('.rx-pick'), main = wrap.querySelector('[data-act="cmt-rx-open"]');
    var art = b.closest('.cmt'), bub = art.querySelector('.cmt-bub');
    var before = m.get(id) || 0, beforeCounts = JSON.parse(art.dataset.rx || 'null') || {};
    if (!art.dataset.rx) { var el0 = art.querySelector('.cmt-a .cmt-lk'); beforeCounts = el0 ? JSON.parse(el0.dataset.rx || '{}') : {}; }
    function show(my, c) {
      if (my) m.set(id, my); else m.delete(id);
      var cur = rxOf(my);
      main.className = 'cl' + (cur ? ' on rx-v-' + cur[4] : ''); main.innerHTML = rxLabel(my); main.setAttribute('aria-expanded', 'false');
      IS.$$('[data-act="cmt-react"]', pick).forEach(function (x) { x.setAttribute('aria-pressed', Number(x.dataset.value) === my); });
      var line = art.querySelector('.cmt-a'), old = line.querySelector('.cmt-lk'); if (old) old.remove();
      line.insertAdjacentHTML('beforeend', badge(c)); art.dataset.rx = JSON.stringify(c);
    }
    var next = before === value ? 0 : value, guess = Object.assign({}, beforeCounts);
    if (before) guess[before] = Math.max(0, (Number(guess[before]) || 0) - 1);
    if (next) guess[next] = (Number(guess[next]) || 0) + 1;
    pick.hidden = true; show(next, guess);
    try {
      var r;
      if (DB.live) { var x = await DB.sb.rpc('ish_comment_react', { kind: lk, comment: id, value: value }); if (x.error) throw x.error; r = x.queued ? { mine: next, rx: guess } : x.data; }
      else {
        var own = (await DB.q('comment_likes', { eq: { kind: lk, comment_id: id, user_id: uid() } }))[0];
        if (own && Number(own.reaction) === value) await DB.del('comment_likes', own.id);
        else if (own) await DB.upd('comment_likes', own.id, { reaction: value });
        else await DB.ins('comment_likes', { kind: lk, comment_id: id, user_id: uid(), reaction: value });
        var all = await DB.q('comment_likes', { eq: { kind: lk, comment_id: id } }), c = {};
        all.forEach(function (l) { c[l.reaction] = (c[l.reaction] || 0) + 1; });
        await DB.upd(TABLE[lk], id, { like_count: all.length, rx: c });
        r = { mine: own && Number(own.reaction) === value ? null : value, rx: c };
      }
      show(Number(r.mine) || 0, r.rx || {});
    } catch (e) { show(before, beforeCounts); IS.toast(A('تعذّر حفظ التفاعل.', 'Could not save your reaction.'), true); }
  };

  IS.ACT['cmt-reply'] = function (b) {
    if (!uid()) return IS.ACT.login();
    var th = b.closest('.cth'), kids = th.querySelector('.cmt-kids');
    if (!kids) { kids = document.createElement('div'); kids.className = 'cmt-kids'; th.appendChild(kids); }
    IS.$$('.cmt-k[hidden]', kids).forEach(function (k) { k.hidden = false; }); IS.$$('.cmt-prev, .cmt-more', kids).forEach(function (x) { x.remove(); });
    var f = kids.querySelector('form.cmt-rf');
    if (!f) {
      f = document.createElement('form'); f.className = 'cmt-rf'; f.dataset.form = 'cmt-reply';
      f.innerHTML = IS.av(IS.ME, 'xs') + '<div class="cmt-rbox"><span class="cmt-rto"></span><textarea name="body" rows="1" maxlength="2000" required dir="auto"></textarea>' +
        '<button class="cmt-send" aria-label="' + esc(A('أرسل الرد', 'Send reply')) + '">' + ic('send') + '</button></div><input type="hidden" name="k"><input type="hidden" name="parent">';
      kids.appendChild(f);
    }
    f.elements.k.value = b.dataset.k; f.elements.parent.value = b.dataset.id;
    f.querySelector('.cmt-rto').innerHTML = esc(A('الرد على ', 'Replying to ')) + '<b dir="auto">' + esc(b.dataset.name || '') + '</b>';
    var t = f.elements.body; t.placeholder = A('اكتب ردًا على ', 'Reply to ') + (b.dataset.name || '') + '…';
    t.focus(); f.scrollIntoView({ block: 'nearest' });
  };
  IS.SUB['cmt-reply'] = async function (d, f) {
    var body = String(d.body || '').trim(); if (!body) return;
    var lk = d.k, parent = d.parent, btn = f.querySelector('.cmt-send'); btn.disabled = true;
    var kids = f.closest('.cmt-kids'), pend = document.createElement('div'); pend.className = 'cmt-k sending';
    pend.innerHTML = IS.commentItem({ row: { parent_id: parent, reply_to_name: (f.querySelector('.cmt-rto b') || {}).textContent }, name: IS.ME.name, photo: IS.ME.photo, when: A('جارٍ الإرسال…', 'Sending…'), body: body });
    if (kids) kids.insertBefore(pend, f); f.elements.body.value = '';
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
      var tm = pend.querySelector('.cmt-t');
      if (DB.wasQueued && DB.wasQueued()) { if (tm) tm.textContent = A('⏳ يُرسل عند عودة الاتصال', '⏳ Sends when you are back online'); f.remove(); btn.disabled = false; return; }
      pend.classList.remove('sending'); if (tm) tm.textContent = A('الآن', 'Now');
      if (panel && IS.reloadFeedComments) { f.remove(); IS.reloadFeedComments(panel, top); }
      else IS.quietRefresh();
    } catch (e) {
      pend.remove(); f.elements.body.value = body;
      btn.disabled = false;
      IS.toast(e && /closed/.test(e.message || '') ? A('أُغلقت التعليقات هنا.', 'Comments are closed here.') : A('تعذّر نشر الرد. حاول مرة أخرى.', 'Could not post your reply. Try again.'), true);
    }
  };
})();
