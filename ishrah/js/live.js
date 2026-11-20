/* اشرح لي: reactions and comments appear at once on every open screen, and «who reacted» like Facebook (owner, 20 Nov 2026: "comments and
   reactions don't appear instantly like in Facebook unless you move from the page and come back"; "press the reactions to know how many of
   each type"). 041_live_feedback.sql keeps one row per item in live_pulse; this file listens to it (Supabase Realtime, with a light
   check every 15 s when the live connection is not open) and re-reads the counts and comments of that item when it is on the screen. */
(function () {
  var A = IS.A, esc = IS.esc, ic = IS.ic;
  var RX = [[1, '👍', 'أعجبني', 'Like'], [2, '❤️', 'أحببته', 'Love'], [3, '😡', 'أغضبني', 'Angry'], [-1, '👎', 'لم يعجبني', 'Dislike']];
  var TABLE = { post: 'posts', request: 'course_requests', file: 'files', announcement: 'notices', course: 'courses', event: 'events', news: 'news' };
  var CTABLE = { reply: 'replies', request: 'course_request_comments', file: 'library_comments' };
  function uid() { return IS.ME && IS.ME.id; }

  /* «3 تفاعلات» in correct Arabic counting */
  IS.rxCount = function (n) {
    n = Number(n) || 0;
    if (IS.lang !== 'ar') return n + ' ' + (n === 1 ? 'reaction' : 'reactions');
    return n === 1 ? 'تفاعل واحد' : n === 2 ? 'تفاعلان' : n <= 10 ? n + ' تفاعلات' : n + ' تفاعلًا';
  };

  /* «تعليق» · «تعليقان» · «3 تعليقات» (the number is shown beside it) */
  IS.cmCount = function (n) {
    n = Number(n) || 0;
    if (IS.lang !== 'ar') return n === 1 ? 'comment' : 'comments';
    return n === 1 ? 'تعليق' : n === 2 ? 'تعليقان' : n <= 10 ? 'تعليقات' : 'تعليقًا';
  };
  /* ---------- who reacted ---------- */
  async function reactors(kind, id) {
    if (DB.live) { var r = await DB.sb.rpc('ish_reactors', { kind: kind, target: id }); if (r.error) throw r.error; return r.data || []; }
    var rows;
    if (/^c:/.test(kind)) rows = (await DB.q('comment_likes', { eq: { kind: kind.slice(2), comment_id: id } })).map(function (x) { return { user_id: x.user_id, reaction: x.reaction }; });
    else if (kind === 'series') rows = await DB.q('series_feedback', { eq: { series_id: id } });
    else rows = await DB.q('feed_feedback', { eq: { [kind + '_id']: id } });
    rows = rows.filter(function (x) { return x.reaction; });
    return Promise.all(rows.map(async function (x) { var p = await DB.one('profiles', x.user_id).catch(function () { return null; }) || {}; return { user_id: x.user_id, name: p.name || '', photo: p.photo, reaction: x.reaction }; }));
  }
  IS.ACT['rx-who'] = async function (b) {
    var bar = b.closest('[data-feedback]'), cm = b.closest('.cmt'), kind, id;
    if (cm && cm.dataset.lk) { kind = 'c:' + cm.dataset.lk; id = cm.dataset.cid; }
    else if (bar) { var k = bar.dataset.feedback.split('/'); kind = k[0]; id = k[1]; }
    if (!kind || !id) return;
    var box = IS.sheet(A('التفاعلات', 'Reactions'), '<p class="mut">' + esc(A('جارٍ التحميل…', 'Loading…')) + '</p>');
    var list;
    try { list = await reactors(kind, id); } catch (e) { box.querySelector('.mut').textContent = A('تعذّر التحميل. حاول مرة أخرى.', 'Could not load. Try again.'); return; }
    var counts = RX.map(function (r) { return [r, list.filter(function (x) { return Number(x.reaction) === r[0]; }).length]; }).filter(function (x) { return x[1]; });
    var tabs = '<div class="rxw-tabs" role="tablist"><button type="button" role="tab" class="on" data-rxf="all">' + esc(A('الكل', 'All')) + ' <b>' + list.length + '</b></button>' +
      counts.map(function (x) { return '<button type="button" role="tab" data-rxf="' + x[0][0] + '" title="' + esc(A(x[0][2], x[0][3])) + '"><span>' + x[0][1] + '</span> <b>' + x[1] + '</b></button>'; }).join('') + '</div>';
    var rows = list.map(function (x) {
      var r = RX.find(function (y) { return y[0] === Number(x.reaction); }) || RX[0];
      return '<li data-rx="' + r[0] + '"><span class="rxw-av">' + IS.av({ name: x.name, photo: x.photo }, 'sm', x.user_id) + '<i>' + r[1] + '</i></span><b dir="auto">' + esc(x.name || A('عضو', 'Member')) + '</b>' +
        (x.user_id === uid() ? '<small class="mut">' + esc(A('أنت', 'You')) + '</small>' : '') + '</li>';
    }).join('');
    box.querySelector('.mut').outerHTML = list.length ? tabs + '<ul class="rxw-list">' + rows + '</ul>' : '<p class="mut">' + esc(A('لا توجد تفاعلات بعد.', 'No reactions yet.')) + '</p>';
    IS.$$('[data-rxf]', box).forEach(function (t) {
      t.onclick = function () {
        IS.$$('[data-rxf]', box).forEach(function (o) { o.classList.toggle('on', o === t); });
        IS.$$('.rxw-list li', box).forEach(function (li) { li.hidden = t.dataset.rxf !== 'all' && li.dataset.rx !== t.dataset.rxf; });
      };
    });
  };

  /* ---------- live updates ---------- */
  var timers = {}, lastTouch = 0, lastAt = new Date().toISOString(), channel = null, live = false;
  document.addEventListener('pointerdown', function () { lastTouch = Date.now(); }, true);
  function typing(root) {
    var a = document.activeElement;
    if (a && root.contains(a) && /TEXTAREA|INPUT/.test(a.tagName) && a.value) return true;
    return IS.$$('textarea', root).some(function (t) { return t.value.trim(); }) || !!root.querySelector('.rx-pick:not([hidden])');
  }
  async function refreshItem(kind, id) {
    if (DB.forget) DB.forget();
    var key = kind + '/' + id, bars = IS.$$('[data-feedback]').filter(function (b) { return b.dataset.feedback === key; });
    if (bars.length && !(IS.voteSaving && IS.voteSaving(key))) {
      try {
        if (kind === 'series') { var s = (await IS.fetchSeriesScores([id]))[0]; if (s && IS.applySeriesScore) IS.applySeriesScore(s); }
        else if (TABLE[kind]) {
          var row = (await (DB._q || DB.q).call(DB, TABLE[kind], { eq: { id: id } }))[0];
          if (row && IS.patchFeed) {
            var v = { my_reaction: Number(bars[0].dataset.reaction) || 0, like_count: row.like_count, dislike_count: row.dislike_count,
              love_count: row.love_count, angry_count: row.angry_count };
            v[kind === 'post' ? 'n_replies' : 'comment_count'] = kind === 'post' ? row.n_replies : row.comment_count;
            IS.patchFeed(kind, id, v);
          }
        }
      } catch (e) {}
      bars.forEach(function (bar) {
        var panel = bar.querySelector('.feed-comment-panel');
        if (panel && !panel.hidden && panel.dataset.loaded && !typing(panel) && IS.reloadFeedComments) IS.reloadFeedComments(panel);
      });
    }
    /* a detail page whose comments are written into the page: draw it again in place */
    var h = location.hash.slice(1).split('/'), page = { post: 'post', 'course-request': 'request', file: 'file' }[h[0]];
    if (page === kind && h[1] === id && !bars.some(function (b) { return b.querySelector('.feed-comment-panel'); })) {
      var main = IS.$('#main');
      if (main && !typing(main) && !IS.$('#sheet:not([hidden])')) { IS.keepScroll = true; IS.refresh(); }
    }
  }
  IS.livePulse = function (key) {
    if (!key) return;
    clearTimeout(timers[key]);
    var wait = Math.max(300, 1200 - (Date.now() - lastTouch));   // let this account's own change settle first
    timers[key] = setTimeout(function () {
      delete timers[key];
      var i = key.indexOf('/'); refreshItem(key.slice(0, i), key.slice(i + 1));
    }, wait);
  };
  function onScreen(key) { return IS.$$('[data-feedback]').some(function (b) { return b.dataset.feedback === key; }) || location.hash.indexOf(key.split('/')[1]) >= 0; }
  async function poll() {
    if (!DB.live || live || document.hidden || !navigator.onLine) return;
    try {
      var r = await DB.sb.from('live_pulse').select('key,at').gt('at', lastAt).order('at', { ascending: false }).limit(50);
      if (r.error || !r.data) return;
      if (r.data[0]) lastAt = r.data[0].at;
      r.data.forEach(function (x) { if (onScreen(x.key)) IS.livePulse(x.key); });
    } catch (e) {}
  }
  function connect() {
    if (!DB.live || !DB.sb || !DB.sb.channel || channel) return;
    try {
      channel = DB.sb.channel('ish-live').on('postgres_changes', { event: '*', schema: 'public', table: 'live_pulse' }, function (p) {
        var row = p.new && p.new.key ? p.new : p.old; if (!row || !row.key) return;
        if (row.at && row.at > lastAt) lastAt = row.at;
        if (onScreen(row.key)) IS.livePulse(row.key);
      }).subscribe(function (status) { live = status === 'SUBSCRIBED'; });
    } catch (e) { channel = null; }
  }
  setInterval(poll, 15000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { poll(); if (!channel) connect(); } });
  window.addEventListener('online', function () { poll(); });
  setTimeout(connect, 1500);
})();
