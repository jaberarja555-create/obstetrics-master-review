/* Deals stay inside the platform (owner, 22 Nov 2026: «ممكن محاضر او طالب يتحايل علي المنصه ويتواصلو مع بعض ويمشو يتفقو في الخاص»).
   Before a student or a lecturer sends a post, comment, request, offer, course text or message to a lecturer, the text is checked for a
   phone number, a WhatsApp / Telegram link or an email address. If one is there, the sending stops and a note in the form explains why; the person
   removes it and sends again. The database does the same check on every write (supabase/056_contact_guard.sql: it hides what it finds,
   logs it and alerts the team), so this is only the friendly first step. The team's own writing and messages to the team are not checked. */
(function () {
  'use strict';
  var A = IS.A, esc = IS.esc;
  var DIG = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9' };
  var MAIL = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}/;
  var LINK = /(https?:\/\/)?(www\.)?(wa\.me|(api|chat|web)\.whatsapp\.com|whatsapp\.com|t\.me|telegram\.(me|dog|org))(\/\S*)?/i;
  var PHONE = [/\+\d(?:[\s.()\-]?\d){8,}/, /(^|\D)00\d(?:[\s.()\-]?\d){8,}/, /(^|\D)249(?:[\s.\-]?\d){9}(?!\d)/, /(^|\D)0[19](?:[\s.\-]?\d){8}(?!\d)/, /(^|\D)9\d{8}(?!\d)/];
  /* what kind of contact a text holds: 'mail' · 'link' · 'phone' · '' */
  IS.contactHit = function (t) {
    t = String(t || '').replace(/[٠-٩۰-۹]/g, function (d) { return DIG[d]; });
    if (!t) return '';
    if (MAIL.test(t)) return 'mail';
    if (LINK.test(t)) return 'link';
    for (var i = 0; i < PHONE.length; i++) if (PHONE[i].test(t)) return 'phone';
    return '';
  };
  /* forms that go to the team (or are the person's own account details) are never checked */
  var FREE = ['apply', 'pay', 'paymsg', 'payout', 'payout-bank', 'selleracct', 'sellpay', 'buyfile', 'ecode', 'eforgot', 'gpreview', 'mfacode',
    'mfaconfirm', 'staff', 'roles', 'matrix', 'grant', 'settings', 'planlimits', 'task', 'broadcast', 'newsadd', 'cat', 'subj', 'spec', 'path',
    'usearch', 'search', 'mycard', 'mng-return', 'mng-save', 'askpay'];
  var SKIPNAME = /phone|tel|mail|link|url|video|^l_|code|pass|account|bank|iban|search|q$/i;
  function checked(f) {
    var name = f.getAttribute('data-form') || '';
    if (!IS.ME || IS.area === 'control' || (IS.team && IS.team())) return false;
    if (FREE.indexOf(name) >= 0) return false;
    if (name === 'ticket') return !!(f.lec && f.lec.value);          // a message to one lecturer; to the team it is free
    if (name === 'treply') return f.hasAttribute('data-lec');          // a conversation with a lecturer
    return true;
  }
  var WHAT = { phone: ['رقم هاتف', 'a phone number'], link: ['رابط واتساب أو تلقرام', 'a WhatsApp or Telegram link'], mail: ['بريدًا إلكترونيًا', 'an email address'] };
  /* the note is shown inside the same form (a sheet would replace the form the person is writing in and lose the text) */
  function warn(kind, field, f) {
    var w = WHAT[kind] || WHAT.phone, old = document.querySelector('.cg-inl'); if (old) old.remove();
    var html = '<div class="cg-inl" role="alert"><span class="cg-i">🔒</span><div><b>' + esc(A('كتابتك فيها ', 'Your text contains ')) + esc(A(w[0], w[1])) + '</b>' +
      '<p>' + esc(A('التواصل والاتفاق والدفع داخل المنصة فقط، لحفظ حقك: الدفع مضمون والفريق يتابع أي مشكلة. احذفه ثم أرسل مرة أخرى. تكرار المخالفة قد يوقف الحساب.',
        'Contact, agreements and payment stay inside the platform to protect you: payment is guaranteed and the team follows any problem. Remove it and send again. Repeated attempts may suspend the account.')) + '</p></div>' +
      '<button type="button" class="cg-x" data-act="cg-ok" aria-label="' + esc(A('إغلاق', 'Close')) + '">×</button></div>';
    if (f.classList.contains('cmt-compose')) f.insertAdjacentHTML('beforebegin', html); else f.insertAdjacentHTML('afterbegin', html);
    try { field.focus(); field.classList.add('cg-bad'); setTimeout(function () { field.classList.remove('cg-bad'); }, 3000); } catch (e) {}
    var n = document.querySelector('.cg-inl'); if (n && n.scrollIntoView) n.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  IS.ACT['cg-ok'] = function (b) { var n = b.closest('.cg-inl'); if (n) n.remove(); };
  /* called by the form handler in core.js: true = stop sending */
  IS.contactStop = function (f) {
    if (!f || !checked(f)) return false;
    var els = [].slice.call(f.querySelectorAll('textarea, input:not([type]), input[type=text], input[type=search]')), ed = [].slice.call(f.querySelectorAll('[contenteditable=true]'));
    for (var i = 0; i < els.length; i++) {
      var el = els[i]; if (el.type === 'hidden' || SKIPNAME.test(el.name || '')) continue;
      var k = IS.contactHit(el.value); if (k) { warn(k, el, f); return true; }
    }
    for (var j = 0; j < ed.length; j++) { var k2 = IS.contactHit(ed[j].innerText); if (k2) { warn(k2, ed[j], f); return true; } }
    var o = document.querySelector('.cg-inl'); if (o) o.remove();
    return false;
  };
})();
