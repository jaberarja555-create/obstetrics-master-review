/* اشرح لي: free or paid library files with tags, sold by anyone who shares them (owner, 19 Nov 2026: "the upload file should also appear as
   paid or free and has tag; even students can share paid files or free; publishing goes through admin; students can gain money according to
   their selling"). Database: supabase/023_paid_library.sql (files.price, files.tags, file_buys, seller_accounts, seller_payouts).
   - Upload (one file or a series): Free / Paid + price in SDG + up to 8 tags. Student uploads wait for the team's review (as before).
   - A paid file (or a whole paid series) shows its price and a Buy button; Bankak receipt → Finance approves in Control → Library sales →
     the buyer can open and download it. The seller earns `file_share` % (Control → General settings, default 70 %).
   - #sales: the seller's sales, balance, Bankak account and payout request; Finance records the transfer with its receipt. */
(function () {
  var A = IS.A, esc = IS.esc, ic = IS.ic, N = IS.N, $ = IS.$;
  function me() { return IS.ME; }
  function share() { return +IS.SET.file_share || 70; }
  function paid(f) { return f && +f.price > 0; }
  IS.BUYS = [];
  IS.loadBuys = async function () {
    if (!me()) { IS.BUYS = []; return IS.BUYS; }
    try { IS.BUYS = await DB.q('file_buys', { eq: { user_id: me().id }, order: ['created_at', false] }); } catch (e) { IS.BUYS = IS.BUYS || []; }
    return IS.BUYS;
  };
  /* the newest purchase of this file or of its series (active first) */
  IS.fileBuy = function (f) {
    var mine = (IS.BUYS || []).filter(function (b) { return (b.file_id && b.file_id === f.id) || (b.series_id && f.series_id && b.series_id === f.series_id); });
    return mine.filter(function (b) { return b.status === 'active'; })[0] || mine.filter(function (b) { return b.status === 'pending'; })[0] || mine[0] || null;
  };
  IS.fileOpenable = function (f) {
    if (!paid(f)) return true;
    if (!me()) return false;
    if (f.owner_id === me().id || IS.can('library')) return true;
    var b = IS.fileBuy(f); return !!(b && b.status === 'active');
  };
  IS.priceTag = function (f, cls) {
    return paid(f) ? '<span class="ptag paid' + (cls ? ' ' + cls : '') + '">' + ic('tag') + IS.money(f.price) + '</span>' :
      '<span class="ptag free' + (cls ? ' ' + cls : '') + '">' + esc(A('مجاني', 'Free')) + '</span>';
  };
  IS.tagChips = function (f, max) {
    var t = (f.tags || []).filter(Boolean).slice(0, max || 8);
    return t.length ? '<span class="ftags">' + t.map(function (x) { return '<button type="button" class="ftag" dir="auto" data-act="ftag" data-t="' + esc(x) + '">#' + esc(x) + '</button>'; }).join('') + '</span>' : '';
  };
  IS.ACT.ftag = function (b) {
    var t = b.dataset.t, box = $('#lq');
    if (box) { box.value = t; if (IS.libFill) IS.libFill(); box.focus(); return; }
    IS.LTAG = t; IS.go('library/all');
  };
  /* the bar under a library file: Buy, waiting for review, or the normal open/download buttons */
  IS.buyBtn = function (f, sm, seriesWide) {
    var b = me() && IS.fileBuy(f), sid = seriesWide !== false && f.series_id;
    if (b && b.status === 'pending') return '<a class="btn ghost' + (sm ? ' sm' : '') + ' buywait" href="#purchase/' + esc(b.id) + '">' + ic('clock') + esc(A('الدفع قيد المراجعة', 'Payment under review')) + '</a>';
    return '<button type="button" class="btn gold' + (sm ? ' sm' : '') + ' buyb" data-act="buyfile" data-id="' + esc(f.id) + '"' + (sid ? ' data-series="' + esc(f.series_id) + '"' : '') + '>' +
      ic('cart') + esc(sid ? A('اشترِ السلسلة · ', 'Buy the series · ') : A('اشترِ · ', 'Buy · ')) + IS.money(f.price) + '</button>';
  };

  /* ---- upload form: Free / Paid, price and tags ---- */
  IS.sellFields = function (f, series) {
    f = f || {}; var isPaid = paid(f);
    return '<fieldset class="sellf"><legend>' + esc(series ? A('سعر السلسلة', 'Price of the series') : A('السعر', 'Price')) + '</legend>' +
      '<div class="seg2" role="radiogroup"><label><input type="radio" name="sale" value="free"' + (isPaid ? '' : ' checked') + '><span>' + ic('open') + esc(A('مجاني', 'Free')) + '</span></label>' +
      '<label><input type="radio" name="sale" value="paid"' + (isPaid ? ' checked' : '') + '><span>' + ic('tag') + esc(A('مدفوع', 'Paid')) + '</span></label></div>' +
      '<div class="sellp"' + (isPaid ? '' : ' hidden') + '><label class="fl"><span>' + esc(A('السعر بالجنيه السوداني', 'Price in SDG')) + ' *</span><input name="price" type="number" inputmode="decimal" dir="ltr" min="1" step="1" max="9999999" value="' +
      esc(isPaid ? String(+f.price) : '') + '"></label><p class="note">' + ic('money') + '<span>' + esc(A('تحصل على ', 'You receive ') + share() + A('٪ من كل عملية بيع بعد تأكيد الدفع، وتطلب تحويل أرباحك إلى حسابك في بنكك من «مبيعاتي».',
        '% of every sale once the payment is confirmed, and you can ask for your earnings to be sent to your Bankak account from “My sales”.')) +
      (series ? esc(A(' يشتري الطالب السلسلة كاملة بهذا السعر.', ' A student buys the whole series for this price.')) : '') + '</span></p></div></fieldset>' +
      '<label class="fl"><span>' + esc(A('الوسوم (حتى 8، افصل بينها بفاصلة)', 'Tags (up to 8, separated by commas)')) + '</span><input name="tags" maxlength="200" dir="auto" value="' +
      esc((f.tags || []).join('، ')) + '" placeholder="' + esc(A('مثال: قلب، ملخص، أسئلة', 'e.g. cardiology, summary, MCQs')) + '"></label>';
  };
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t.matches || !t.matches('input[name=sale]')) return;
    var box = t.form && t.form.querySelector('.sellp'); if (!box) return;
    box.hidden = t.value !== 'paid'; var p = box.querySelector('[name=price]'); p.required = t.value === 'paid'; if (!box.hidden) p.focus();
  });
  IS.readSell = function (d) {
    var price = d.sale === 'paid' ? Math.round(+d.price || 0) : 0;
    if (d.sale === 'paid' && !(price >= 1)) throw new Error(A('اكتب سعرًا صحيحًا أو اختر «مجاني».', 'Enter a valid price or choose Free.'));
    var tags = String(d.tags || '').split(/[,،;\n]+/).map(function (x) { return x.replace(/^#/, '').trim().slice(0, 30); }).filter(Boolean);
    tags = tags.filter(function (x, i) { return tags.map(function (y) { return y.toLowerCase(); }).indexOf(x.toLowerCase()) === i; }).slice(0, 8);
    return { price: price, tags: tags };
  };

  /* ---- buying ---- */
  IS.ACT.buyfile = async function (b) {
    if (!me()) return IS.ACT.login();
    var f = await DB.one('files', b.dataset.id); if (!f || !paid(f) || f.status !== 'published') return IS.toast(A('هذا الملف غير متاح للبيع الآن.', 'This file is not for sale now.'), true);
    if (f.owner_id === me().id) return IS.toast(A('هذا ملفك.', 'This is your own file.'));
    if (!IS.SET.bankak_account || !IS.SET.bankak_name) return IS.toast(A('بيانات بنكك غير متوفرة الآن.', 'Bankak details are currently unavailable.'), true);
    var series = b.dataset.series || '', title = series ? (f.series_title || f.title) : f.title;
    IS.sheet(esc(A('شراء من المكتبة', 'Buy from the library')), '<div class="paysum"><b dir="auto">' + esc(title) + '</b><span class="bp">' + IS.money(f.price) + '</span></div>' +
      '<p class="mut">' + esc((series ? A('السلسلة كاملة', 'The whole series') : A('ملف واحد', 'One file')) + (f.owner_name ? ' · ' + A('من ', 'by ') + f.owner_name : '')) + '</p>' +
      '<ol class="steps"><li><b>' + esc(A('حوّل المبلغ عبر بنكك', 'Transfer the amount with Bankak')) + '</b><div class="acct"><span>' + esc(A('رقم الحساب', 'Account number')) + '</span><b dir="ltr">' + esc(IS.SET.bankak_account) +
      '</b><button type="button" class="ib" data-act="copy" data-c="' + esc(IS.SET.bankak_account) + '" aria-label="' + esc(A('نسخ', 'Copy')) + '">' + ic('file') + '</button></div>' +
      '<div class="acct"><span>' + esc(A('اسم الحساب', 'Account name')) + '</span><b dir="auto">' + esc(IS.SET.bankak_name) + '</b></div><div class="acct"><span>' + esc(A('المبلغ', 'Amount')) + '</span><b>' + IS.money(f.price) + '</b></div></li>' +
      '<li><b>' + esc(A('أرسل بيانات التحويل', 'Send the transfer details')) + '</b><form class="form" data-form="buyfile"><input type="hidden" name="file" value="' + esc(f.id) + '"><input type="hidden" name="series" value="' + esc(series) + '">' +
      '<label class="fl"><span>' + esc(A('الاسم', 'Name')) + ' *</span><input name="payer" required value="' + esc(me().name || '') + '"></label>' +
      '<label class="fl"><span>' + esc(A('رقم الهاتف', 'Phone number')) + ' *</span><input name="phone" required inputmode="tel" dir="ltr" value="' + esc(me().phone || '') + '"></label>' +
      '<label class="fl file"><span>' + esc(A('صورة الإيصال', 'Receipt picture')) + ' *</span><input type="file" name="receipt" accept="image/*" required></label>' +
      '<button class="btn pri wide">' + ic('send') + esc(A('أرسل الإيصال للمراجعة', 'Send receipt for review')) + '</button></form></li>' +
      '<li><b>' + esc(A('افتحه بعد التأكيد', 'Open it after confirmation')) + '</b><p class="mut">' + esc(A('يصلك إشعار بعد مراجعة التحويل، ثم تقرأ الملف وتنزّله داخل التطبيق.', 'You’ll get a notification once the transfer is checked; then you can read and download it in the app.')) + '</p></li></ol>');
    if (IS.fileUI) IS.fileUI();
  };
  IS.SUB.buyfile = async function (d, form) {
    if (!me()) return IS.ACT.login();
    if (!d.payer || !d.phone) return IS.toast(A('أدخل اسمك ورقم هاتفك.', 'Enter your name and phone number.'), true);
    var file = form.elements.receipt.files[0];
    if (!file || !/^image\//.test(file.type) || file.size > 10 * 1024 * 1024) return IS.toast(A('أرفق صورة للإيصال بحجم 10 ميغابايت أو أقل.', 'Attach a receipt image of 10 MB or less.'), true);
    var f = await DB.one('files', d.file); if (!f || !paid(f) || f.status !== 'published') { IS.closeSheet(); return IS.toast(A('هذا الملف غير متاح للبيع الآن.', 'This file is not for sale now.'), true); }
    var btn = form.querySelector('button.pri'); btn.disabled = true;
    try {
      var path = await DB.upload('receipts', await IS.shrink(file, 1400, 0.8));
      var row = { file_id: d.series ? null : f.id, series_id: d.series || null, user_id: me().id, payer: d.payer, phone: d.phone, receipt: path };
      if (!DB.live) Object.assign(row, { status: 'pending', price: +f.price, title: d.series ? (f.series_title || f.title) : f.title, seller_id: f.owner_id, seller_name: f.owner_name });
      var entry = await DB.ins('file_buys', row);
    } catch (error) {
      btn.disabled = false;
      if (error.code === '23505' || /duplicate|one_open/.test(error.message)) { IS.closeSheet(); await IS.loadBuys(); IS.toast(A('لديك طلب شراء لهذا الملف من قبل.', 'You already have a purchase for this file.'), true); return IS.refresh(); }
      throw error;
    }
    await IS.loadBuys();
    IS.closeSheet();
    IS.go('purchase/' + entry.id);
  };
  IS.page('purchase', async function (id) {
    var b = await DB.one('file_buys', id);
    if (!b || !me() || b.user_id !== me().id) return null;
    var link = b.series_id ? '#series/' + esc(b.series_id) : '#file/' + esc(b.file_id);
    var detail = b.status === 'active' ? A('تم تأكيد الدفع. يمكنك الآن قراءة الملف وتنزيله داخل التطبيق.', 'Payment confirmed. You can now read and download it in the app.') :
      b.status === 'rejected' ? A('رُفض الإيصال. يمكنك الشراء مرة أخرى بإيصال صحيح.', 'The receipt was rejected. You can buy again with a valid receipt.') :
        A('تم إرسال الإيصال. سيصلك إشعار بعد مراجعته.', 'Receipt submitted. You’ll receive a notification after review.');
    return '<nav class="crumb"><a href="#library">' + esc(A('مكتبتي', 'My Library')) + '</a></nav>' + IS.banner(IS.T('حالة الشراء', 'Purchase status'), esc(b.title || ''), 'cart') +
      '<section class="box"><div class="row sp">' + IS.paymentStatus(b.status) + '<strong>' + IS.money(b.price) + '</strong></div><p>' + esc(detail) + '</p>' +
      (b.status === 'rejected' && b.note ? '<div class="note bad"><div><b>' + esc(A('سبب الرفض', 'Reason for rejection')) + '</b><p class="pre" dir="auto">' + esc(b.note) + '</p></div></div>' : '') +
      '<a class="btn ' + (b.status === 'active' ? 'pri' : 'ghost') + ' sm" href="' + link + '">' + ic('open') + esc(b.series_id ? A('افتح السلسلة', 'Open the series') : A('افتح الملف', 'Open the file')) + '</a></section>';
  }, { auth: true });

  /* ---- the seller: #sales ---- */
  async function sellerData(sellerId) {
    var r = await Promise.all([DB.q('file_buys', { eq: { seller_id: sellerId }, order: ['created_at', false] }), DB.q('seller_payouts', { eq: { seller_id: sellerId }, order: ['created_at', false] })]);
    var buys = r[0], outs = r[1], ok = buys.filter(function (b) { return b.status === 'active'; });
    var earned = ok.reduce(function (a, b) { return a + (+b.price) * (+b.share || share()) / 100; }, 0);
    var sent = outs.filter(function (p) { return p.status === 'paid'; }).reduce(function (a, p) { return a + (+p.amount); }, 0);
    var asked = outs.filter(function (p) { return p.status === 'requested'; })[0] || null;
    return { buys: buys, ok: ok, outs: outs, earned: Math.round(earned * 100) / 100, sent: sent, balance: Math.max(0, Math.round((earned - sent) * 100) / 100), asked: asked };
  }
  IS.sellerData = sellerData;
  IS.page('sales', async function () {
    var x = await sellerData(me().id), files = await DB.q('files', { eq: { owner_id: me().id }, order: ['created_at', false] });
    var forSale = files.filter(paid), acct = null;
    try { acct = await DB.one('seller_accounts', me().id); } catch (e) {}
    var h = IS.banner(IS.T('مبيعاتي', 'My sales'), esc(A('ما بعته من ملفات في المكتبة وأرباحك منها.', 'What you sold in the library and what you earned.')), 'cart');
    h += '<div class="tiles t4">' + [['cart', N(x.ok.length), A('عمليات بيع مؤكدة', 'Confirmed sales')], ['money', IS.money(x.earned), A('أرباحك (', 'Your earnings (') + share() + '%)'],
      ['wallet', IS.money(x.sent), A('حُوِّل إليك', 'Sent to you')], ['sparkle', IS.money(x.balance), A('الرصيد المستحق', 'Balance due')]].map(function (t) {
      return '<div class="tile">' + ic(t[0]) + '<b>' + t[1] + '</b><small>' + esc(t[2]) + '</small></div>'; }).join('') + '</div>';
    h += '<div class="cols cflow sales-cols"><section class="box"><h2>' + ic('wallet') + IS.T('تحويل الأرباح', 'Get paid') + '</h2>' +
      '<form class="form" data-form="selleracct"><div class="g2f"><label class="fl"><span>' + esc(A('رقم حساب بنكك', 'Bankak account number')) + ' *</span><input name="account" required maxlength="80" dir="ltr" value="' + esc(acct ? acct.account : '') + '"></label>' +
      '<label class="fl"><span>' + esc(A('اسم صاحب الحساب', 'Account holder name')) + ' *</span><input name="account_name" required maxlength="150" dir="auto" value="' + esc(acct ? acct.account_name : '') + '"></label></div>' +
      '<button class="btn ghost">' + ic('check') + esc(A('حفظ الحساب', 'Save account')) + '</button></form>' +
      (x.asked ? '<p class="note">' + ic('clock') + '<span>' + esc(A('طلبت تحويل ', 'You asked for ')) + IS.money(x.asked.amount) + esc(A('، وهو قيد المراجعة لدى فريق المالية.', '; the finance team is handling it.')) + '</span></p>' :
        '<button class="btn pri wide" data-act="sellask"' + (x.balance > 0 && acct ? '' : ' disabled') + '>' + ic('send') + esc(A('اطلب تحويل الرصيد', 'Ask for your balance')) + ' · ' + IS.money(x.balance) + '</button>' +
        (acct ? '' : '<small class="mut">' + esc(A('احفظ حساب بنكك أولًا.', 'Save your Bankak account first.')) + '</small>')) +
      (x.outs.filter(function (p) { return p.status === 'paid'; }).length ? '<h3>' + esc(A('التحويلات', 'Transfers')) + '</h3><div class="table">' + x.outs.filter(function (p) { return p.status === 'paid'; }).map(function (p) {
        return '<div class="tr">' + ic('wallet') + '<span class="grow"><b>' + IS.money(p.amount) + '</b><small class="mut">' + esc(IS.date(p.paid_at || p.created_at)) + (p.note ? ' · ' + esc(p.note) : '') + '</small></span>' +
          (p.receipt ? '<button class="btn sm ghost" data-act="sellrcpt" data-p="' + esc(p.receipt) + '">' + ic('receipt') + esc(A('الإيصال', 'Receipt')) + '</button>' : '') + '</div>';
      }).join('') + '</div>' : '') + '</section>' +
      '<section class="box"><h2>' + ic('tag') + IS.T('ملفاتي المعروضة للبيع', 'My files for sale') + '</h2>' + (forSale.length ? '<div class="table">' + forSale.map(function (f) {
        var n = x.ok.filter(function (b) { return b.file_id === f.id || (f.series_id && b.series_id === f.series_id); }).length;
        return '<div class="tr">' + ic('file') + '<span class="grow"><a href="#file/' + esc(f.id) + '"><b dir="auto">' + esc(f.series_id ? (f.series_title || '') + ' · ' + f.title : f.title) + '</b></a><small class="mut">' +
          IS.money(f.price) + ' · ' + esc(f.status === 'published' ? A('منشور', 'Published') : f.status === 'pending' ? A('بانتظار المراجعة', 'Waiting for review') : IS.statusText ? IS.statusText(f.status) : f.status) + ' · ' + N(n) + ' ' + esc(A('مبيعات', 'sales')) + '</small></span></div>';
      }).join('') + '</div>' : IS.empty('tag', A('لا توجد ملفات مدفوعة بعد', 'No paid files yet'), A('اختر «مدفوع» عند رفع ملف لتبيعه.', 'Choose “Paid” when you upload a file to sell it.'),
        '<button class="btn pri" data-act="share-file">' + ic('upload') + esc(A('شارك ملفًا', 'Share a file')) + '</button>')) + '</section></div>';
    h += '<section class="box"><h2>' + ic('receipt') + IS.T('عمليات البيع', 'Sales') + '</h2>' + (x.buys.length ? '<div class="table">' + x.buys.map(function (b) {
      var cut = b.status === 'active' ? (+b.price) * (+b.share || share()) / 100 : 0;
      return '<div class="tr">' + ic('cart') + '<span class="grow"><b dir="auto">' + esc(b.title || '') + '</b><small class="mut">' + esc(IS.date(b.created_at)) + ' · ' + IS.money(b.price) +
        (cut ? ' · ' + esc(A('نصيبك ', 'your share ')) + IS.money(cut) : '') + '</small></span>' + IS.paymentStatus(b.status) + '</div>';
    }).join('') + '</div>' : IS.empty('cart', A('لم تُبع ملفات بعد', 'No sales yet'))) + '</section>';
    return h;
  }, { auth: true });
  IS.SUB.selleracct = async function (d) {
    var row = { id: me().id, account: String(d.account || '').trim(), account_name: String(d.account_name || '').trim() };
    if (!row.account || !row.account_name) return;
    await DB.upsert('seller_accounts', row); IS.toast(A('حُفظ الحساب', 'Account saved')); IS.refresh();
  };
  IS.ACT.sellrcpt = async function (b) { var u = await DB.fileUrl('payout-receipts', b.dataset.p); if (u) IS.sheet(esc(A('إيصال التحويل', 'Transfer receipt')), /\.pdf($|\?)/i.test(b.dataset.p) ? '<a class="btn pri" target="_blank" rel="noopener" href="' + esc(u) + '">' + esc(A('افتح الإيصال', 'Open receipt')) + '</a>' : '<img class="rcpt" src="' + esc(u) + '" alt="">', { wide: 1, nofocus: 1 }); };
  async function sellerPayout(action, seller, amount, pending, path, note, ref) {
    if (DB.live) {
      var r = await DB.sb.rpc('ish_seller_payout', { action: action, seller: seller, amount: amount, pending: pending || null, receipt_path: path || null, transfer_note: note || null, reference: ref || null });
      var errs = { payout_account: ['يجب حفظ حساب بنكك أولًا.', 'A Bankak account must be saved first.'], payout_balance: ['المبلغ أكبر من الرصيد المستحق.', 'The amount is more than the balance due.'],
        payout_request_pending: ['لديك طلب تحويل قيد المراجعة.', 'You already have a payout request under review.'], payout_request_closed: ['تم التعامل مع هذا الطلب بالفعل.', 'This request has already been handled.'],
        payout_receipt: ['تعذّر التحقق من الإيصال. اختر الملف مرة أخرى.', 'The receipt could not be verified. Choose the file again.'], payout_amount: ['تحقّق من المبلغ.', 'Check the amount.'] };
      if (r.error) { var m = errs[r.error.message]; throw new Error(m ? A(m[0], m[1]) : r.error.message); }
      return r.data;
    }
    var x = await sellerData(seller), who = await DB.one('profiles', seller);
    if (amount > x.balance + 0.001) throw new Error(A('المبلغ أكبر من الرصيد المستحق.', 'The amount is more than the balance due.'));
    if (action === 'request') { if (x.asked) throw new Error(A('لديك طلب تحويل قيد المراجعة.', 'You already have a payout request under review.')); return (await DB.ins('seller_payouts', { seller_id: seller, name: who && who.name, amount: amount, status: 'requested' })).id; }
    var row = { status: 'paid', amount: amount, receipt: path, note: note || '', ref: ref || '', paid_at: new Date().toISOString(), paid_by: me().id };
    var out = pending ? await DB.upd('seller_payouts', pending, row) : await DB.ins('seller_payouts', Object.assign({ seller_id: seller, name: who && who.name }, row));
    IS.notify(seller, A('وصلك تحويل أرباح مبيعاتك', 'Your sales payout was sent'), '', '#sales');
    return out.id;
  }
  IS.ACT.sellask = async function (b) {
    var x = await sellerData(me().id); if (!(x.balance > 0)) return;
    b.disabled = true;
    try { await sellerPayout('request', me().id, x.balance); IS.toast(A('أُرسل طلب التحويل إلى فريق المالية.', 'Your payout request was sent to the finance team.')); }
    catch (e) { IS.toast(e.message, true); }
    IS.refresh();
  };

  /* ---- Control → Library sales ---- */
  IS.page('control-sales', async function (tab) {
    tab = tab || 'pending';
    var buys = await DB.q('file_buys', { order: ['created_at', false] }), approve = IS.can('pay', 'approve'), payer = IS.can('payout', 'approve');
    var count = function (s) { return buys.filter(function (b) { return b.status === s; }).length; };
    var h = IS.banner(IS.T('مبيعات المكتبة', 'Library sales'), esc(A('راجع إيصالات شراء الملفات المدفوعة، وحوّل للبائعين نصيبهم.', 'Check receipts for paid library files and send sellers their share.')), 'cart') +
      '<div class="tabs pills">' + [['pending', A('قيد المراجعة', 'Under review'), count('pending')], ['active', A('مقبولة', 'Approved')], ['rejected', A('مرفوضة', 'Rejected')]].concat(payer ? [['sellers', A('مستحقات البائعين', 'Sellers to pay')]] : [])
        .map(function (t) { return '<a href="#control-sales/' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '">' + esc(t[1]) + (t[2] != null ? ' <i>' + N(t[2]) + '</i>' : '') + '</a>'; }).join('') + '</div>';
    if (tab === 'sellers' && payer) {
      var ids = Array.from(new Set(buys.filter(function (b) { return b.status === 'active' && b.seller_id; }).map(function (b) { return b.seller_id; })));
      var rows = await Promise.all(ids.map(async function (id) { var d = await sellerData(id); d.id = id; d.name = (buys.filter(function (b) { return b.seller_id === id; })[0] || {}).seller_name; return d; }));
      rows.sort(function (a, b) { return (b.asked ? 1 : 0) - (a.asked ? 1 : 0) || b.balance - a.balance; });
      return h + (rows.length ? '<div class="table">' + rows.map(function (d) {
        return '<div class="tr">' + IS.av({ name: d.name }, 'sm') + '<span class="grow"><b dir="auto">' + esc(d.name || '') + '</b><small class="mut">' + N(d.ok.length) + ' ' + esc(A('مبيعات', 'sales')) + ' · ' +
          esc(A('الأرباح ', 'earned ')) + IS.money(d.earned) + ' · ' + esc(A('حُوِّل ', 'sent ')) + IS.money(d.sent) + '</small>' + (d.asked ? '<small>' + IS.chip(esc(A('طلب تحويل ', 'Asked for ')) + IS.money(d.asked.amount), 'st warn') + '</small>' : '') + '</span>' +
          '<b class="sbal">' + IS.money(d.balance) + '</b>' + (d.balance > 0 ? '<button class="btn sm pri" data-act="sellpay" data-id="' + esc(d.id) + '">' + ic('wallet') + esc(A('سجّل تحويلًا', 'Record transfer')) + '</button>' : '') + '</div>';
      }).join('') + '</div>' : IS.empty('wallet', A('لا توجد مستحقات بعد', 'Nothing to pay yet')));
    }
    var list = buys.filter(function (b) { return b.status === tab; });
    return h + (list.length ? '<div class="paylist">' + list.map(function (b) {
      return '<article class="box payc"><button class="rimg" data-act="receipt" data-p="' + esc(b.receipt || '') + '">' + ic('receipt') + '<span>' + esc(A('عرض الإيصال', 'View receipt')) + '</span></button><div class="grow"><b dir="auto">' + esc(b.title || '') + '</b>' +
        '<ul class="kv sm"><li><span>' + esc(A('المشتري', 'Buyer')) + '</span><b dir="auto">' + esc(b.payer || '') + '</b></li><li><span>' + esc(A('الهاتف', 'Phone')) + '</span><b dir="ltr">' + esc(b.phone || '') + '</b></li>' +
        '<li><span>' + esc(A('المبلغ', 'Amount')) + '</span><b>' + IS.money(b.price) + '</b></li><li><span>' + esc(A('البائع', 'Seller')) + '</span><b dir="auto">' + esc(b.seller_name || '') + '</b></li>' +
        '<li><span>' + esc(A('تاريخ الإرسال', 'Submitted on')) + '</span><b>' + esc(IS.date(b.created_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) + '</b></li></ul>' +
        (b.note ? '<small class="mut" dir="auto">' + esc(b.note) + '</small>' : '') + '</div><div class="col">' +
        (tab === 'pending' && approve ? '<button class="btn pri" data-act="buyok" data-id="' + esc(b.id) + '">' + ic('check') + esc(A('تأكيد وفتح الملف', 'Approve and open')) + '</button>' +
          '<button class="btn ghost bad" data-act="buyno" data-id="' + esc(b.id) + '">' + ic('x') + esc(A('رفض', 'Reject')) + '</button>' : IS.paymentStatus(b.status)) +
        '<a class="btn ghost" href="' + (b.series_id ? '#series/' + esc(b.series_id) : '#file/' + esc(b.file_id)) + '">' + ic('open') + esc(A('الملف', 'The file')) + '</a></div></article>';
    }).join('') + '</div>' : IS.empty('receipt', A('لا توجد مدفوعات هنا', 'Nothing here')));
  }, { area: 'control', auth: true, perm: 'pay' });
  IS.ACT.buyok = async function (b) {
    var e = await DB.one('file_buys', b.dataset.id); if (!e || e.status !== 'pending') return IS.refresh();
    e = await DB.upd('file_buys', e.id, DB.live ? { status: 'active' } : { status: 'active', share: share(), decided_at: new Date().toISOString(), decided_by: me().id });
    var link = e.series_id ? '#series/' + e.series_id : '#file/' + e.file_id;
    IS.notify(e.user_id, A('تم تأكيد شرائك', 'Your purchase is confirmed'), e.title, link);
    if (e.seller_id) IS.notify(e.seller_id, A('بِعت ملفًا في المكتبة', 'You sold a library file'), e.title + ' · ' + (+e.price) * (+e.share || share()) / 100 + ' ' + A('ج.س', 'SDG'), '#sales');
    IS.audit('approve file purchase', e.title + ' · ' + e.payer); IS.toast(A('تم التأكيد', 'Approved')); IS.refresh();
  };
  IS.ACT.buyno = async function (b) {
    var e = await DB.one('file_buys', b.dataset.id); if (!e || e.status !== 'pending') return IS.refresh();
    var why = await IS.ask(A('سبب الرفض', 'Reason for rejection'), A('يظهر للطالب', 'Shown to the student'), '', { area: 1, ok: A('رفض', 'Reject') });
    if (!why) return;
    e = await DB.upd('file_buys', e.id, DB.live ? { status: 'rejected', note: why } : { status: 'rejected', note: why, decided_at: new Date().toISOString(), decided_by: me().id });
    IS.notify(e.user_id, A('رُفض إيصال الشراء', 'Your purchase receipt was rejected'), e.title + (why ? ': ' + why : ''), '#purchase/' + e.id);
    IS.audit('reject file purchase', e.title); IS.refresh();
  };
  IS.ACT.sellpay = async function (b) {
    if (!IS.can('payout', 'approve')) return;
    var d = await sellerData(b.dataset.id), acct = null; try { acct = await DB.one('seller_accounts', b.dataset.id); } catch (e) {}
    IS.sheet(esc(A('تحويل أرباح بائع', 'Seller payout')), (acct ? '<ul class="kv"><li><span>' + esc(A('حساب بنكك', 'Bankak account')) + '</span><b dir="ltr">' + esc(acct.account) + '</b></li><li><span>' + esc(A('الاسم', 'Name')) + '</span><b dir="auto">' + esc(acct.account_name) + '</b></li><li><span>' +
      esc(A('الرصيد المستحق', 'Balance due')) + '</span><b>' + IS.money(d.balance) + '</b></li></ul>' : '<p class="note bad">' + esc(A('لم يحفظ البائع حساب بنكك بعد.', 'The seller has not saved a Bankak account yet.')) + '</p>') +
      (acct ? '<form class="form" data-form="sellpay"><input type="hidden" name="id" value="' + esc(b.dataset.id) + '"><input type="hidden" name="pending" value="' + esc(d.asked ? d.asked.id : '') + '">' +
        '<label class="fl"><span>' + esc(A('المبلغ بالجنيه السوداني', 'Amount in SDG')) + '</span><input name="amount" type="number" dir="ltr" min="0.01" step="0.01" max="' + d.balance + '" value="' + (d.asked ? +d.asked.amount : d.balance) + '" required></label>' +
        '<label class="fl file"><span>' + esc(A('إيصال التحويل', 'Transfer receipt')) + '</span><input name="receipt" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required></label>' +
        '<label class="fl"><span>' + esc(A('ملاحظة للبائع', 'Note to the seller')) + '</span><textarea rows="2" name="note" maxlength="2000" dir="auto"></textarea></label>' +
        '<label class="fl"><span>' + esc(A('مرجع التحويل (اختياري)', 'Transfer reference (optional)')) + '</span><input name="ref" maxlength="150" dir="auto"></label>' +
        '<button class="btn pri wide">' + ic('check') + esc(A('حفظ التحويل وإشعار البائع', 'Save transfer and notify the seller')) + '</button></form>' : ''));
    if (IS.fileUI) IS.fileUI();
  };
  IS.SUB.sellpay = async function (d, form) {
    var file = form.elements.receipt.files[0];
    if (!file || file.size > 8 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) return IS.toast(A('اختر صورة أو PDF للإيصال بحجم لا يزيد عن 8 ميغابايت.', 'Choose an image or PDF receipt up to 8 MB.'), true);
    if (form.payFile !== file) { form.payPath = await DB.upload('payout-receipts', file); form.payFile = file; }
    await sellerPayout('record', d.id, +d.amount, d.pending, form.payPath, d.note, d.ref);
    IS.closeSheet(); IS.toast(A('حُفظ التحويل وأُشعر البائع.', 'Transfer saved and the seller notified.')); IS.refresh();
  };
})();
