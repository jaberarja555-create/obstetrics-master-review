/* SMRA Permanent Exam inside SMRA (owner, 28 Nov 2026: "in the house officer place, same design as the HO Guide and books").
   The exam bank is the separate app in /exam/ (its own manifest and offline copy); here it opens full-screen in a frame with the SMRA
   handle, from the House Officer section, the books shelf and Features — exactly like the HO Guide. */
(function () {
  var A = IS.A, esc = IS.esc, ic = IS.ic;
  var EXV = '20';   /* bump with exam/sw.js C so a page that kept the frame loads the new version */
  var FR = null, FROM = /^#exam\b/.test(location.hash) ? '' : location.hash.slice(1);
  function host() { var h = document.getElementById('ex-host'); if (!h) { h = document.createElement('div'); h.id = 'ex-host'; h.hidden = true; document.body.appendChild(h); } return h; }
  function show() {
    var h = host();
    if (!FR) {
      FR = document.createElement('iframe'); FR.className = 'bk-fr'; FR.title = 'SMRA Permanent Exam'; FR.src = '/exam/?v=' + EXV; FR.setAttribute('allow', 'clipboard-write');
      h.appendChild(FR);
      h.insertAdjacentHTML('beforeend', '<button type="button" class="bk-back" data-act="ex-back" aria-label="' + esc(A('العودة إلى المنصة', 'Back to the platform')) + '"><span>SMRA</span></button>');
    }
    h.hidden = false; document.documentElement.classList.add('bk-open');
  }
  function hide() { var h = document.getElementById('ex-host'); if (h) h.hidden = true; if (!/^#book\//.test(location.hash)) document.documentElement.classList.remove('bk-open'); }
  IS.page('exam', function () { setTimeout(show, 0); return '<div class="bk-wait"><span class="spin"></span></div>'; });
  IS.ACT['ex-back'] = function () { hide(); IS.go(FROM && !/^exam\b/.test(FROM) ? FROM : 'home'); };
  window.addEventListener('hashchange', function () { if (!/^#exam\b/.test(location.hash)) { hide(); FROM = location.hash.slice(1); } });

  var EXID = '4c00d0f9-ed8e-465e-ac56-37cafe1980bc';
  IS.EXAM_FILE = EXID;
  var COVER = 'img/books/perm.webp', TITLE = 'Permanent Exam', SUB = 'Sudan Medical Council · Questions Bank · SMRA';

  /* Paid access bridge (owner, 28 Nov 2026). The exam frame ships the question bank encrypted; the key is given only to a
     device allowed to open the Permanent Exam file (owner, library staff or an active purchase). The frame asks us for it
     (postMessage {exam:'key'}); we answer with the key + price + Bankak, reusing the platform's own paid-file flow. A locked
     device gets a free preview and a Subscribe button that opens the platform's buy sheet ({exam:'buy'}). */
  async function examState() {
    var key = null, st = { open: false, price: 0, pending: false }, why = '';
    try {
      if (DB.live) {
        if (!navigator.onLine) why = 'offline';
        var r = await DB.sb.rpc('ish_exam_state'); if (r.error) why = why || 'error'; else if (r.data) st = r.data;
        if (st.open) { var kr = await DB.sb.rpc('ish_exam_key'); if (!kr.error && kr.data) key = kr.data; else why = kr.error ? 'error' : 'nokey'; }
      } else { st.open = true; }   /* local preview without Supabase: the frame uses its bundled data.js */
    } catch (e) { why = navigator.onLine ? 'error' : 'offline'; }
    /* why the bank stays locked, so «Check subscription» always answers (owner, 28 Nov 2026: «it says Checking… and gives nothing») */
    if (!key && !why) why = !IS.ME ? 'signin' : st.pending ? 'pending' : st.ended ? 'ended' : 'locked';
    PLANS = st.plans || PLANS;
    return { exam: 'state', key: key, why: why, open: !!st.open, price: st.price || 0, pending: !!st.pending, plans: PLANS, plan: st.plan || null,
      expires: st.expires || null, pendingPlan: st.pending_plan || null,
      me: IS.ME ? { name: IS.ME.name || '', phone: IS.ME.phone || '', photo: IS.ME.photo ? IS.U(IS.ME.photo) : '', email: IS.ME.email || '' } : null,
      bankak: (IS.SET && IS.SET.bankak_account) ? { account: IS.SET.bankak_account, name: IS.SET.bankak_name } : null,
      name: (IS.ME && IS.ME.name) || '' };
  }
  window.addEventListener('message', function (ev) {
    if (!FR || ev.source !== FR.contentWindow) return;
    var d = ev.data; if (!d || d.exam == null) return;
    if (d.exam === 'key') { examState().then(function (s) { try { FR.contentWindow.postMessage(s, '*'); } catch (e) {} }); return; }
    if (d.exam === 'buy') { openPlans(); return; }
    if (d.exam === 'login') { hide(); EXSHEET = true; if (IS.ACT.login) IS.ACT.login(); return; }
    if (d.exam === 'notes') { sendNotes(); return; }
    if (d.exam === 'go' && d.link) { hide(); IS.go(String(d.link).replace(/^#/, '')); return; }
    if (d.exam === 'profile') { saveProfile(d); return; }
  });

  /* ---- profile from inside the exam (owner, 28 Nov 2026: «name, profile picture, phone number that will be seen by admins») ----
     The exam frame sends {exam:'profile', name, phone, photo?(data URL)}; saved on the account (profiles), so admins see the phone in Control. */
  async function saveProfile(d) {
    var ok = true, msg = '';
    try {
      if (!IS.ME) throw new Error('signin');
      var patch = {}, name = String(d.name || '').trim().slice(0, 80), phone = String(d.phone || '').replace(/[^\d+]/g, '').slice(0, 16);
      if (name && name !== IS.ME.name) patch.name = name;
      if (phone !== (IS.ME.phone || '')) { if (phone && phone.replace(/\D/g, '').length < 9) throw new Error('phone'); patch.phone = phone; }
      if (d.photo && /^data:image\//.test(d.photo)) {
        var blob = await (await fetch(d.photo)).blob();
        patch.photo = await DB.upload('media', await IS.shrink(new File([blob], 'me.jpg', { type: blob.type || 'image/jpeg' }), 480, 0.85));
      }
      if (Object.keys(patch).length) { await DB.upd('profiles', IS.ME.id, patch); if (DB.forget) DB.forget(); await IS.loadMe(); }
    } catch (e) { ok = false; msg = e.message === 'phone' ? 'phone' : e.message === 'signin' ? 'signin' : 'error'; }
    try { var s = await examState(); s.saved = ok ? 1 : 0; s.err = msg; FR.contentWindow.postMessage(s, '*'); } catch (e) {}
  }

  /* ---- notifications for the exam: House Officer news and the student's own (payment approved…), with the exam's own sound,
     because the platform's sound cannot play while the exam frame is in front (taps inside the frame do not unlock the platform's audio) ---- */
  async function sendNotes() {
    if (!FR) return;
    var list = [];
    try {
      if (IS.ME && (!DB.live || navigator.onLine)) {
        var rows = (await DB.q('notices', { order: ['created_at', false], limit: 80 })).filter(function (x) {
          if (x.actor === IS.ME.id) return false;
          if (x.user_id) return x.user_id === IS.ME.id;
          return x.cat === 'house' && (x.status !== 'suspended');
        }).slice(0, 30);
        list = rows.map(function (x) { return { id: x.id, t: IS.noticeTitle ? IS.noticeTitle(x) : (x.title || ''), b: String(x.body || '').slice(0, 220), at: x.created_at, link: x.link || '' }; });
      }
    } catch (e) {}
    try { FR.contentWindow.postMessage({ exam: 'notes', list: list }, '*'); } catch (e) {}
  }
  setInterval(function () { var h = document.getElementById('ex-host'); if (FR && h && !h.hidden && document.visibilityState === 'visible') sendNotes(); }, 40000);

  /* ---- Subscription with plans, like the books (owner, 28 Nov 2026: «monthly 20,000 SDG, 3 months 50, 1 year 100, lifetime 200»).
     Prices come from the server (ish_exam_state.plans, migration 070); these are only the fallback for the preview. The window opens over the
     platform; when it closes in any way the exam screen comes back (EXSHEET). Approval: Control → Library sales, like a library purchase. */
  var PLANS = [{ id: 'month', months: 1, price: 20000 }, { id: 'quarter', months: 3, price: 50000 }, { id: 'year', months: 12, price: 100000 }, { id: 'life', months: null, price: 200000 }];
  var PLN = { month: ['شهر واحد', '1 month', 'يتجدد بإيصال جديد كل شهر', 'Renew with a new receipt each month'],
    quarter: ['3 أشهر', '3 months', 'توفّر 10,000 ج.س', 'Save 10,000 SDG'],
    year: ['سنة كاملة', '1 year', 'الأوفر لسنة الامتياز', 'Best value for the house-officer year'],
    life: ['مدى الحياة', 'Lifetime', 'ادفع مرة واحدة ويبقى مفتوحًا', 'Pay once, open for good'] };
  IS.examPlanName = function (id) { var p = PLN[id]; return p ? A(p[0], p[1]) : ''; };
  var EXSHEET = false;
  var close0 = IS.closeSheet;
  IS.closeSheet = function () { var r = close0.apply(this, arguments); if (EXSHEET) { EXSHEET = false; if (/^#exam\b/.test(location.hash)) show(); } return r; };
  async function tellFrame() { try { var s = await examState(); if (FR) FR.contentWindow.postMessage(s, '*'); } catch (e) {} }
  async function openPlans() {
    if (!IS.ME) { hide(); EXSHEET = true; if (IS.ACT.login) IS.ACT.login(); return; }
    var st = await examState();
    if (st.pending) { try { FR.contentWindow.postMessage(st, '*'); } catch (e) {} IS.toast(A('لديك إيصال قيد المراجعة. يُفتح البنك تلقائيًا بعد الموافقة.', 'You have a receipt under review. The bank opens by itself once it is approved.')); return; }
    if (!IS.SET.bankak_account || !IS.SET.bankak_name) { IS.toast(A('بيانات بنكك غير متوفرة الآن.', 'Bankak details are currently unavailable.'), true); return; }
    hide(); EXSHEET = true;
    var sel = 'year';
    var cards = PLANS.map(function (p) {
      var t = PLN[p.id] || [p.id, p.id, '', ''];
      return '<label class="xpl' + (p.id === 'year' ? ' best' : '') + '"><input type="radio" name="plan" value="' + esc(p.id) + '"' + (p.id === sel ? ' checked' : '') + '>' +
        '<span class="xpl-n">' + esc(A(t[0], t[1])) + '</span><span class="xpl-p">' + IS.money(p.price) + '</span><small>' + esc(A(t[2], t[3])) + '</small>' +
        (p.id === 'year' ? '<em>' + esc(A('الأكثر اختيارًا', 'Most chosen')) + '</em>' : '') + '</label>';
    }).join('');
    var cur = st.plan && st.open ? '<p class="note">' + ic('checkc') + '<span>' + esc(A('اشتراكك الحالي: ', 'Your current plan: ') + IS.examPlanName(st.plan) +
      (st.expires ? A(' · حتى ', ' · until ') + IS.date(st.expires, { day: 'numeric', month: 'long', year: 'numeric' }) + A('. التجديد يبدأ من نهاية اشتراكك.', '. A renewal starts when it ends.') : '')) + '</span></p>' : '';
    IS.sheet(esc(A('الاشتراك في بنك الامتحان الدائم', 'Subscribe to the Permanent Exam bank')), cur +
      '<p class="mut">' + esc(A('4,206 سؤالًا مع الشرح، الامتحان التجريبي، ومتابعة تقدّمك. اختر مدة الاشتراك:', '4,206 questions with explanations, the mock exam and your progress. Choose a plan:')) + '</p>' +
      '<form class="form" data-form="exambuy"><div class="xplans">' + cards + '</div>' +
      '<ol class="steps"><li><b>' + esc(A('حوّل المبلغ عبر بنكك', 'Transfer the amount with Bankak')) + '</b><div class="acct"><span>' + esc(A('رقم الحساب', 'Account number')) + '</span><b dir="ltr">' + esc(IS.SET.bankak_account) +
      '</b><button type="button" class="ib" data-act="copy" data-c="' + esc(IS.SET.bankak_account) + '" aria-label="' + esc(A('نسخ', 'Copy')) + '">' + ic('file') + '</button></div>' +
      '<div class="acct"><span>' + esc(A('اسم الحساب', 'Account name')) + '</span><b dir="auto">' + esc(IS.SET.bankak_name) + '</b></div>' +
      '<div class="acct"><span>' + esc(A('المبلغ', 'Amount')) + '</span><b id="xamt">' + IS.money((PLANS.filter(function (p) { return p.id === sel; })[0] || PLANS[0]).price) + '</b></div></li>' +
      '<li><b>' + esc(A('أرسل بيانات التحويل', 'Send the transfer details')) + '</b>' +
      '<label class="fl"><span>' + esc(A('الاسم', 'Name')) + ' *</span><input name="payer" required value="' + esc(IS.ME.name || '') + '"></label>' +
      '<label class="fl"><span>' + esc(A('رقم الهاتف', 'Phone number')) + ' *</span><input name="phone" required inputmode="tel" dir="ltr" value="' + esc(IS.ME.phone || '') + '"></label>' +
      '<label class="fl file"><span>' + esc(A('صورة الإيصال', 'Receipt picture')) + ' *</span><input type="file" name="receipt" accept="image/*" required></label>' +
      '<button class="btn pri wide">' + ic('send') + esc(A('أرسل الإيصال للمراجعة', 'Send receipt for review')) + '</button></li>' +
      '<li><b>' + esc(A('يُفتح البنك بعد التأكيد', 'The bank opens after confirmation')) + '</b><p class="mut">' + esc(A('يصلك إشعار بعد مراجعة التحويل، ويُفتح البنك كاملًا تلقائيًا.', 'You will get a notification once the transfer is checked, and the whole bank opens by itself.')) + '</p></li></ol></form>');
    var form = document.querySelector('#sheet form[data-form="exambuy"]');
    if (form) form.addEventListener('change', function () { var v = (form.querySelector('input[name=plan]:checked') || {}).value, p = PLANS.filter(function (x) { return x.id === v; })[0]; var a = document.getElementById('xamt'); if (p && a) a.innerHTML = IS.money(p.price); });
    if (IS.fileUI) IS.fileUI();
  }
  IS.ACT.exambuy = openPlans;
  IS.SUB.exambuy = async function (d, form) {
    if (!IS.ME) return IS.ACT.login();
    var plan = PLANS.filter(function (p) { return p.id === d.plan; })[0];
    if (!plan) return IS.toast(A('اختر مدة الاشتراك.', 'Choose a plan.'), true);
    if (!d.payer || !d.phone) return IS.toast(A('أدخل اسمك ورقم هاتفك.', 'Enter your name and phone number.'), true);
    var file = form.elements.receipt.files[0];
    if (!file || !/^image\//.test(file.type) || file.size > 10 * 1024 * 1024) return IS.toast(A('أرفق صورة للإيصال بحجم 10 ميغابايت أو أقل.', 'Attach a receipt image of 10 MB or less.'), true);
    var path = await DB.upload('receipts', await IS.shrink(file, 1400, 0.8));
    var row = { file_id: EXID, user_id: IS.ME.id, payer: d.payer, phone: d.phone, receipt: path, plan: plan.id };
    if (!DB.live) Object.assign(row, { status: 'pending', price: plan.price, title: TITLE + ' · ' + IS.examPlanName(plan.id) });
    try { await DB.ins('file_buys', row); }
    catch (error) {
      if (error.code === '23505' || /duplicate|one_pending/.test(error.message || '')) { IS.closeSheet(); tellFrame(); return IS.toast(A('لديك إيصال قيد المراجعة من قبل.', 'You already have a receipt under review.'), true); }
      throw error;
    }
    if (IS.loadBuys) IS.loadBuys().catch(function () {});
    IS.closeSheet(); tellFrame();
    IS.toast(A('أُرسل إيصالك للمراجعة. يُفتح البنك تلقائيًا بعد الموافقة.', 'Your receipt was sent for review. The bank opens by itself once it is approved.'));
  };

  /* on the books shelf — a book card like the Master Review books */
  function examBook() {
    return '<article class="bk-card exam-book"><a href="#exam" class="bk-cv" aria-label="' + esc(TITLE) + '"><img src="' + IS.U(COVER) + '" alt="" width="600" height="900" loading="lazy" decoding="async"></a>' +
      '<div class="bk-tx"><span class="bk-subject">' + esc(A('طبيب الامتياز', 'House Officer')) + '</span><h2 lang="en" dir="auto"><a href="#exam">' + esc(TITLE) + '</a></h2>' +
      '<p class="bk-authors"><bdi lang="en" dir="ltr">' + esc(SUB) + '</bdi></p>' +
      '<p class="bk-tools">' + ic('qb') + esc(A('بنك أسئلة الامتحان الدائم · شرح · امتحان تجريبي · تقييم التقدم', 'Permanent exam bank · explanations · mock exam · progress')) + '</p>' +
      '<a class="btn ghost sm bk-read" href="#exam">' + ic('open') + esc(A('ابدأ', 'Open the bank')) + '</a></div>' +
      '<div class="bk-feedback" data-ex-fb hidden></div></article>';
  }
  IS.examBook = examBook;

  /* on the House Officer home — the same layout as the HO Guide card: cover, title + chip, subtitle, tools line, Open; then Paid | Like · Comment · Share · Report */
  function examFeed() {
    return '<article class="box feed-card feed-library feed-ho feed-exam" data-go="#exam">' +
      '<div class="feed-card-content"><a class="feed-image" href="#exam" aria-label="' + esc(TITLE) + '"><img src="' + IS.U(COVER) + '" alt="" width="600" height="900" loading="lazy" decoding="async"></a>' +
      '<div><div class="ho-head"><h3><a href="#exam" lang="en" dir="ltr">' + esc(TITLE) + '</a></h3><span class="fchip ho-tag">' + esc(A('طبيب الامتياز', 'House Officer')) + '</span></div>' +
      '<p class="feed-summary"><bdi lang="en" dir="ltr">' + esc(SUB) + '</bdi></p>' +
      '<p class="feed-stars" data-ex-stars></p>' +
      '<p class="ho-feat" dir="auto">' + esc(A('بنك أسئلة الامتحان الدائم مع الشرح · امتحان تجريبي · مذاكرة بالوقت أو التعلّم · تقييم التقدم', 'Permanent exam bank with explanations · mock exam · timed or tutor · progress assessment')) + '</p></div>' +
      '<div class="row library-feed-actions feed-wide-acts"><a class="btn ghost sm fopen" href="#exam">' + ic('open') + '<span>' + esc(A('ابدأ البنك', 'Open the bank')) + '</span>' + ic('chev', 'fchev') + '</a></div></div>' +
      '<div data-ex-fb></div></article>';
  }
  async function examFeedback(card) {
    try {
      if (!DB.live && !(await DB.one('files', EXID))) await DB.ins('files', { id: EXID, kind: 'master_review', spec: 'master-review', cat: 'house', status: 'published', title: TITLE, author: 'SMRA' });
      var row = (await DB.q('files', { in: { id: [EXID] }, eq: { status: 'published' } }))[0];
      if (!row || !card.isConnected) return;
      var fb = card.querySelector('[data-ex-fb]'); if (!fb) return;
      if (card.classList.contains('exam-book')) {
        fb.innerHTML = IS.feedVoteBar('file', row, true, 'exam'); fb.hidden = false;
      } else {
        row = Object.assign({}, row, { _lay: 1 });
        var stars = card.querySelector('[data-ex-stars]'); if (stars) stars.innerHTML = IS.libraryRating(row, true, 'file');
        fb.innerHTML = IS.feedVoteBar('file', row, true, 'exam').replace('<div class="fv-acts fv-lay">',
          '<div class="fv-acts fv-lay"><span class="fv-price"><span class="ptag paid sm">' + ic('tag') + esc(A('مدفوع', 'Paid')) + '</span></span>');
      }
      if (IS.hydrateFeedReactions) IS.hydrateFeedReactions(fb);
    } catch (e) {}
  }
  window.addEventListener('hashchange', function () { if (location.hash.indexOf('#file/' + EXID) === 0) IS.go('home'); });

  /* add to the books shelf after the HO Guide */
  var shelf0 = IS.booksShelf;
  if (shelf0) IS.booksShelf = function () { var h = shelf0.apply(this, arguments); return h.indexOf('ho-book') >= 0 ? h.replace('</article>', '</article>' + examBook(), 1) : h.replace('<div class="bk-row">', '<div class="bk-row">' + examBook()); };

  function tile() { return '<a href="#exam" class="ho-feat"><span class="ic">📝</span><span>' + esc(TITLE) + '</span></a>'; }
  var feat0 = IS.ACT.mrfeat;
  if (feat0) IS.ACT.mrfeat = function () { var r = feat0.apply(this, arguments), g = document.querySelector('#sheet .mr-feat'); if (g && !g.querySelector('.ho-feat[href="#exam"]')) { var ho = g.querySelector('.ho-feat'); if (ho) ho.insertAdjacentHTML('afterend', tile()); else g.insertAdjacentHTML('afterbegin', tile()); } return r; };

  /* the card on the House Officer home (under the HO Guide card) and on the books / library grid */
  var on0 = IS.onRoute;
  IS.onRoute = function (name, arg, main) {
    if (on0) try { on0(name, arg, main); } catch (e) {}
    if (name === 'books' && !arg) { var gd = (main || document).querySelector('.bk-grid'); if (gd && !gd.querySelector('.exam-book')) { var ho = gd.querySelector('.ho-book'); if (ho) ho.insertAdjacentHTML('afterend', examBook()); else gd.insertAdjacentHTML('afterbegin', examBook()); } }
    if (name === 'books' || name === 'library') setTimeout(function () { Array.prototype.forEach.call((main || document).querySelectorAll('.exam-book'), function (c) { examFeedback(c); }); }, 0);
    var sec = IS.mySection && IS.mySection(); if (name !== 'home' || !sec || sec.id !== 'house') return;
    var tries = 0;
    (function put() {
      var m = document.getElementById('main'); if (!m) return;
      var have = m.querySelector('.exam-card .feed-exam'); if (have) { examFeedback(have); return; }
      var hoCard = m.querySelector('.ho-card');
      if (hoCard) { hoCard.insertAdjacentHTML('afterend', '<div class="exam-card ho-card">' + examFeed() + '</div>'); examFeedback(m.querySelector('.exam-card .feed-exam')); return; }
      var t = m.querySelector('.mh-title'); if (!t) { if (++tries < 25) setTimeout(put, 150); return; }
      t.insertAdjacentHTML('afterend', '<div class="exam-card ho-card">' + examFeed() + '</div>');
      examFeedback(m.querySelector('.exam-card .feed-exam'));
    })();
  };
})();
