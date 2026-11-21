/* اشرح لي: «مرشد المنصة», the guide assistant (owner, 21 Nov 2026: "personal guide like AI inside the app"; app guide only, Claude Haiku 5.5).
   A small round button above the bottom bar opens a chat panel; questions go to functions/api/assist.js, which answers from a fixed description
   of the app and keeps a daily limit per account. Links in an answer open only the app's own pages (#…). The conversation stays in this tab
   (sessionStorage), never on the server. */
(function () {
  var A = IS.A, esc = IS.esc, ic = IS.ic, KEY = 'ish-assist';
  var MSGS = []; try { MSGS = JSON.parse(sessionStorage.getItem(KEY) || '[]') || []; } catch (e) { MSGS = []; }
  var busy = false, LEFT = null;
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(MSGS.slice(-30))); } catch (e) {} }

  /* the answer as safe HTML: text is escaped first; only **bold**, line breaks, list lines and links to the app's own pages are kept */
  function md(t) {
    var h = esc(String(t || ''));
    h = h.replace(/\[([^\]\n]{1,80})\]\((#[a-z][a-z0-9\/_-]{0,60})\)/gi, function (m, label, href) { return '<a href="' + href + '" data-asgo>' + label + '</a>'; });
    h = h.replace(/\*\*([^*\n]{1,200})\*\*/g, '<b>$1</b>');
    return h.split(/\n/).map(function (l) {
      var m = l.match(/^\s*(\d+)[.)]\s+(.*)$/); if (m) return '<span class="asli"><i>' + m[1] + '</i><span>' + m[2] + '</span></span>';
      m = l.match(/^\s*[-•*]\s+(.*)$/); if (m) return '<span class="asli"><i>•</i><span>' + m[1] + '</span></span>';
      return l.trim() ? '<span class="asp">' + l + '</span>' : '';
    }).join('');
  }
  var SUGG = [['كيف أشترك في كورس مدفوع؟', 'How do I enrol in a paid course?'], ['كيف أرفع ملفًا للمكتبة؟', 'How do I upload a file to the library?'],
    ['كيف أصبح محاضرًا؟', 'How do I become a lecturer?'], ['كيف أغيّر القسم أو التخصص؟', 'How do I change my section?'], ['كيف أنزّل درسًا للمذاكرة بدون إنترنت؟', 'How do I download a lesson for offline study?']];

  function bubble(m) { return '<div class="asm ' + (m.role === 'user' ? 'asu' : 'ai') + (m.err ? ' err' : '') + '"><div dir="auto">' + (m.role === 'user' ? esc(m.content).replace(/\n/g, '<br>') : md(m.content)) + '</div></div>'; }
  function body() {
    var hello = '<div class="asm ai"><div><span class="asp">' + esc(A('أهلًا! أنا مرشد المنصة. اسألني عن أي شيء في استعمال التطبيق: الكورسات، الدفع، المكتبة، المجتمع، الاستوديو…', 'Hi! I am the platform guide. Ask me anything about using the app: courses, payment, the library, the community, the studio…')) + '</span><span class="asp assm">' + esc(A('أساعد في استعمال التطبيق فقط، ولا أجيب عن الأسئلة الطبية.', 'I help with using the app only; I do not answer medical questions.')) + '</span></div></div>';
    return hello + MSGS.map(bubble).join('') + (busy ? '<div class="asm ai"><div class="astyp"><i></i><i></i><i></i></div></div>' : '') +
      (!MSGS.length && !busy ? '<div class="assug">' + SUGG.map(function (s) { return '<button type="button" data-assug="' + esc(A(s[0], s[1])) + '">' + esc(A(s[0], s[1])) + '</button>'; }).join('') + '</div>' : '');
  }
  function draw() {
    var p = document.getElementById('asst'); if (!p) return;
    var log = p.querySelector('.aslog'); log.innerHTML = body(); log.scrollTop = log.scrollHeight;
    p.querySelector('.asleft').innerHTML = LEFT == null ? '' : esc(A('رسائل اليوم المتبقية: ', 'Messages left today: ')) + IS.N(LEFT);
    p.querySelector('button.assend').disabled = busy;
  }
  function open() {
    if (IS.closeSheet && document.getElementById('sheet') && !document.getElementById('sheet').hidden) IS.closeSheet();
    var p = document.getElementById('asst');
    if (!p) {
      p = document.createElement('div'); p.id = 'asst'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'true'); p.setAttribute('aria-label', A('مرشد المنصة', 'Platform guide'));
      p.innerHTML = '<div class="aspan"><header><span class="asav"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12.5a7.5 7.5 0 0 1-11 6.6L4 20l1-4.2A7.5 7.5 0 1 1 20 12.5z"/><path d="M12.5 8.6l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill="currentColor" stroke-width="1"/></svg></span><div><b>' + esc(A('مرشد المنصة', 'Platform guide')) + '</b><small class="asleft"></small></div>' +
        '<button type="button" class="ib asnew" title="' + esc(A('محادثة جديدة', 'New chat')) + '" aria-label="' + esc(A('محادثة جديدة', 'New chat')) + '">' + ic('plus') + '</button>' +
        '<button type="button" class="ib asx" aria-label="' + esc(A('إغلاق', 'Close')) + '">' + ic('x') + '</button></header>' +
        '<div class="aslog" aria-live="polite"></div><form class="asf"><textarea rows="1" maxlength="600" dir="auto" placeholder="' + esc(A('اكتب سؤالك عن التطبيق…', 'Ask about the app…')) + '"></textarea>' +
        '<button class="assend" aria-label="' + esc(A('إرسال', 'Send')) + '">' + ic('send') + '</button></form></div>';
      document.body.appendChild(p);
      p.addEventListener('click', function (e) {
        if (e.target === p || e.target.closest('.asx')) return close();
        if (e.target.closest('.asnew')) { MSGS = []; save(); draw(); return; }
        var s = e.target.closest('[data-assug]'); if (s) return ask(s.getAttribute('data-assug'));
        if (e.target.closest('a[data-asgo]')) close();
      });
      var ta = p.querySelector('textarea');
      ta.addEventListener('input', function () { ta.style.height = 'auto'; ta.style.height = Math.min(120, ta.scrollHeight) + 'px'; });
      ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && innerWidth >= 700) { e.preventDefault(); p.querySelector('form').requestSubmit(); } });
      p.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); var v = ta.value.trim(); if (!v || busy) return; ta.value = ''; ta.style.height = ''; ask(v); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !p.hidden) close(); });
    }
    p.hidden = false; document.body.classList.add('noscroll'); draw();
    if (innerWidth >= 700) setTimeout(function () { try { p.querySelector('textarea').focus(); } catch (e) {} }, 60);
  }
  function close() { var p = document.getElementById('asst'); if (p) p.hidden = true; document.body.classList.remove('noscroll'); }
  async function ask(q) {
    if (!IS.ME) { close(); IS.toast(A('سجّل الدخول لتستعمل مرشد المنصة.', 'Sign in to use the platform guide.')); if (IS.ACT.login) IS.ACT.login(); return; }
    MSGS.push({ role: 'user', content: q }); busy = true; save(); draw();
    var reply;
    try {
      if (!window.DB || !DB.live || !DB.ready) throw { code: 'preview' };
      var s = (await DB.sb.auth.getSession()).data.session;
      var r = await fetch('api/assist', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + (s ? s.access_token : '') },
        body: JSON.stringify({ messages: MSGS.filter(function (m) { return !m.err; }).map(function (m) { return { role: m.role, content: m.content }; }), page: location.hash || '#home', lang: IS.lang }) });
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok) throw { code: r.status, j: j };
      reply = { role: 'assistant', content: j.text }; if (typeof j.left === 'number') LEFT = j.left;
    } catch (e) {
      var c = e && e.code;
      reply = { role: 'assistant', err: true, content: c === 'preview' ? A('مرشد المنصة يعمل في الموقع المنشور (ishrahli.org) فقط، وليس في نسخة المعاينة.', 'The platform guide works only on the published site (ishrahli.org), not in the preview copy.')
        : c === 501 ? A('مرشد المنصة لم يُفعَّل بعد. حاول لاحقًا أو راسل [الدعم](#support).', 'The platform guide is not switched on yet. Try later or contact [Support](#support).')
        : c === 429 ? (LEFT = 0, A('وصلت إلى حدّ الرسائل لليوم. يمكنك السؤال مرة أخرى غدًا، أو مراسلة [الدعم](#support).', 'You have reached today\'s message limit. Ask again tomorrow, or contact [Support](#support).'))
        : c === 401 ? A('انتهت جلسة الدخول. سجّل الدخول مرة أخرى.', 'Your sign-in has ended. Please sign in again.')
        : A('تعذّر الوصول إلى المرشد الآن. تحقق من الاتصال وحاول مرة أخرى.', 'Could not reach the guide now. Check the connection and try again.') };
    }
    MSGS.push(reply);
    if (reply.err && MSGS.length >= 2 && MSGS[MSGS.length - 2].role === 'user') MSGS[MSGS.length - 2].err = true;   // not sent again as part of the conversation
    busy = false; save(); draw();
  }
  IS.ACT.assist = open;

  /* the round button: signed-in accounts, not while reading a book, playing a lesson or inside a dialog-like page */
  function fab() {
    var b = document.getElementById('asfab');
    if (!b) { b = document.createElement('button'); b.id = 'asfab'; b.type = 'button'; b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12.5a7.5 7.5 0 0 1-11 6.6L4 20l1-4.2A7.5 7.5 0 1 1 20 12.5z"/><path d="M12.5 8.6l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill="currentColor" stroke-width="1"/></svg><span class="asfl">' + esc(A('اسأل', 'Ask')) + '</span>'; b.onclick = open; document.body.appendChild(b); }
    var fl = b.querySelector('.asfl'); if (fl) fl.textContent = A('اسأل', 'Ask');
    b.setAttribute('aria-label', A('مرشد المنصة: اسأل عن استعمال التطبيق', 'Platform guide: ask about using the app')); b.title = A('مرشد المنصة', 'Platform guide');
    var pg = document.body.getAttribute('data-page') || '';
    b.hidden = !IS.ME || /^(lesson|reader|read|book|auth|pick|pick-section|welcome)/.test(pg) || !!document.querySelector('.rd-wrap,.reader-open');
    var lift = 0; document.querySelectorAll('.mh-nav').forEach(function (n) { var r = n.getBoundingClientRect();
      if (r.height > 0 && r.width > 0 && getComputedStyle(n).visibility !== 'hidden' && r.top > innerHeight / 2 && r.top < innerHeight) lift = Math.max(lift, innerHeight - r.top); });
    b.style.bottom = (lift + (innerWidth < 700 ? 96 : 18)) + 'px';
  }
  var on0 = IS.onRoute;
  IS.onRoute = function (name, arg, main) { if (on0) try { on0(name, arg, main); } catch (e) {} setTimeout(fab, 60); setTimeout(fab, 500); };
  window.addEventListener('resize', function () { clearTimeout(fab.t); fab.t = setTimeout(fab, 150); });
  var tuckT; window.addEventListener('scroll', function () { var b = document.getElementById('asfab'); if (!b || b.hidden) return;
    b.classList.add('tuck'); clearTimeout(tuckT); tuckT = setTimeout(function () { b.classList.remove('tuck'); }, 900); }, { passive: true, capture: true });

  /* also in the Features grid */
  var feat0 = IS.ACT.mrfeat;
  if (feat0) IS.ACT.mrfeat = function () { var r = feat0.apply(this, arguments); var g = document.querySelector('#sheet .mr-feat');
    if (g && !g.querySelector('[data-act=assist]')) g.insertAdjacentHTML('afterbegin', '<a href="#" data-act="assist" onclick="return false">' + ic('chat') + '<span>' + esc(A('مرشد المنصة', 'Platform guide')) + '</span></a>');
    return r; };
})();
