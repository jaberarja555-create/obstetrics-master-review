/* The old book platform «Student Master Review» used to live on studentmasterreview.com; since 22 Nov 2026 SMRA lives there and the old
   platform is at https://books.studentmasterreview.com until the books come inside SMRA (ishrah/PLAN-one-platform.md, stage 3).
   A phone that used the old platform here still has its settings (keys «smr-…»): it is told once where the books are now, with a button.
   Notes and subscriptions are kept by the books themselves, so nothing is lost. «Later» asks again after 3 days, «Do not show again» stops it. */
(function () {
  'use strict';
  var A = IS.A, esc = IS.esc, BOOKS = 'https://books.studentmasterreview.com/';
  function oldUser() {
    try { for (var i = 0; i < localStorage.length; i++) { if (/^smr-/.test(localStorage.key(i))) return true; } } catch (e) {}
    return false;
  }
  function due() {
    try { var v = localStorage.getItem('ish-books-moved'); if (v === 'never') return false; return !v || Date.now() > +v; } catch (e) { return false; }
  }
  IS.ACT['moved-later'] = function () { try { localStorage.setItem('ish-books-moved', String(Date.now() + 3 * 864e5)); } catch (e) {} IS.closeSheet(); };
  IS.ACT['moved-never'] = function () { try { localStorage.setItem('ish-books-moved', 'never'); } catch (e) {} IS.closeSheet(); };
  IS.ACT['moved-go'] = function () { try { localStorage.setItem('ish-books-moved', 'never'); } catch (e) {} location.href = BOOKS; };
  function show() {
    if (!/(^|\.)studentmasterreview\.com$/.test(location.hostname) || !oldUser() || !due()) return;
    if (document.querySelector('#sheet.open, .sheet.open')) { setTimeout(show, 4000); return; }
    IS.sheet(esc(A('كتبك انتقلت إلى عنوان جديد', 'Your books have a new address')),
      '<div class="mv-box"><span class="mv-i">📚</span><p>' + esc(A('كتب الجراحة والأطفال والولادة، مع ملاحظاتك واشتراكك، موجودة الآن في:', 'Surgery, Pediatrics and Obstetrics, with your notes and subscription, are now at:')) +
      '</p><b dir="ltr">books.studentmasterreview.com</b><p class="mv-s">' + esc(A('وهنا أكاديمية السودان للمراجعة الطبية: كورسات ومكتبة ومجتمع لطلبة الطب. قريبًا تفتح الكتب داخلها.',
        'This is Sudan Master Review Academy: courses, a library and a community for medical students. The books will soon open inside it.')) + '</p>' +
      '<button type="button" class="btn pri wide" data-act="moved-go">' + esc(A('افتح كتبي', 'Open my books')) + '</button>' +
      '<div class="mv-row"><button type="button" class="btn ghost sm" data-act="moved-later">' + esc(A('لاحقًا', 'Later')) + '</button>' +
      '<button type="button" class="btn ghost sm" data-act="moved-never">' + esc(A('لا تظهر مرة أخرى', 'Do not show again')) + '</button></div></div>');
  }
  setTimeout(show, 2500);
})();
