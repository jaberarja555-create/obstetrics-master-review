/* Appointing people from inside the platform (owner, 21 Nov 2026: «كمالك للمنصه مفروض اقدر اعين ناس مباشره من داخل المنصه ويصلهم
   اشعار انو تم تعينهم بواسطة مالك المنصه، مثلا كمحاضر او مدير شي معين»).
   «تعيين» on a person's profile, a lecturer page and Control → Users opens a sheet: Lecturer, or one of the team roles the signed-in
   person may grant. A team role opens the existing staff form with that role chosen (department, approval, 2FA); Lecturer makes the
   lecturer row at once. The person gets a notification naming the role and who appointed them. */
(function () {
  'use strict';
  var A = function (a, e) { return IS.lang === 'en' ? e : a; }, esc = IS.esc, ic = IS.ic;
  function team() { return (IS.ME && IS.ME.team) || []; }
  function isOwner() { return team().indexOf('owner') >= 0; }
  function canGrant(r) { if (isOwner()) return true; return r !== 'owner' && r !== 'gm' && IS.can('team', 'edit'); }
  function canLec() { return isOwner() || IS.can('apps', 'approve'); }
  IS.canAssign = function () { return !!IS.ME && (isOwner() || IS.can('team', 'edit') || IS.can('apps', 'approve')); };
  /* «مالك المنصة» / «المدير العام» … : who appointed */
  IS.assignerTitle = function () {
    var r = team().filter(function (x) { return x.indexOf('p:') !== 0; })[0], row = (IS.ROLES || []).filter(function (x) { return x[0] === r; })[0];
    return row ? A(row[1], String(row[2]).replace(/\s*\(.*\)\s*/, '')) : A('إدارة المنصة', 'the platform team');
  };
  function roleName(r) { var row = (IS.ROLES || []).filter(function (x) { return x[0] === r; })[0]; return row ? A(row[1], String(row[2]).replace(/\s*\(.*\)\s*/, '')) : r; }

  IS.ACT.assign = async function (b) {
    var id = b.getAttribute('data-id'), u = await DB.one('profiles', id).catch(function () { return null; });
    if (!u) return IS.toast(A('تعذّر فتح هذا الحساب.', 'Could not open this account.'), true);
    var lec = await DB.one('lecturers', id).catch(function () { return null; }), isLec = lec && lec.status === 'active';
    var cur = (u.team || []).filter(function (x) { return x.indexOf('p:') !== 0; })[0] || ((u.team || []).length ? 'staff' : '');
    var tiles = '';
    if (canLec()) tiles += '<button type="button" class="asg-t' + (isLec ? ' on' : '') + '"' + (isLec ? ' disabled' : ' data-act="assign-lec" data-id="' + esc(id) + '"') + '>' + ic('cert') +
      '<span><b>' + esc(A('محاضر', 'Lecturer')) + '</b><small>' + esc(isLec ? A('محاضر معتمد حاليًا', 'Already an approved lecturer') : A('يفتح له استوديو المحاضر فورًا', 'Opens the lecturer studio for them at once')) + '</small></span>' + (isLec ? ic('checkc') : '') + '</button>';
    (IS.ROLES || []).filter(function (r) { return canGrant(r[0]) && (r[0] !== 'owner' || cur === 'owner'); }).forEach(function (r) {
      var on = cur === r[0];
      tiles += '<button type="button" class="asg-t' + (on ? ' on' : '') + '" data-act="assign-role" data-id="' + esc(id) + '" data-r="' + esc(r[0]) + '">' + ic(r[3]) +
        '<span><b>' + esc(A(r[1], String(r[2]).replace(/\s*\(.*\)\s*/, ''))) + '</b><small>' + esc(on ? A('دوره الحالي · اضغط للتعديل', 'Current role · tap to edit') : A(r[4] || '', r[5] || '')) + '</small></span>' + (on ? ic('checkc') : '') + '</button>';
    });
    if (!tiles) return IS.toast(A('لا تملك صلاحية التعيين.', 'You may not appoint people.'), true);
    IS.sheet(esc(A('تعيين ', 'Appoint ') + (u.name || '')),
      '<div class="asg-who">' + IS.av(u, 'sm', u.id) + '<span><b dir="auto">' + esc(u.name || '') + '</b><small>' + esc(cur ? A('الدور الحالي: ', 'Current role: ') + roleName(cur) : isLec ? A('محاضر', 'Lecturer') : A('بدون دور إداري', 'No team role')) + '</small></span></div>' +
      '<p class="mut asg-n">' + esc(A('اختر الدور. يصله إشعار بأنه عُيِّن بواسطة ', 'Choose the role. They are notified that they were appointed by ') + IS.assignerTitle() + '.') + '</p>' +
      '<div class="asg-g">' + tiles + '</div>', { nofocus: 1 });
  };

  IS.ACT['assign-lec'] = async function (b) {
    var id = b.getAttribute('data-id'), u = await DB.one('profiles', id);
    if (!(await IS.confirm(A('تعيين ', 'Appoint ') + (u.name || '') + A(' محاضرًا؟', ' as a lecturer?')))) return;
    var ex = await DB.one('lecturers', id).catch(function () { return null; }), sp = u.spec || IS.SPEC || 'medicine';
    if (ex) await DB.upd('lecturers', id, { status: 'active', teaching_specs: (ex.teaching_specs || []).length ? ex.teaching_specs : [sp] });
    else await DB.upsert('lecturers', { id: id, name: u.name || '', title: u.pub_title || '', specialty: u.specialty || '', photo: u.photo || '', teaching_specs: [sp], teaching_spaces: [],
      bio: '', quals: [], tags: [], color: '#0f7a73', share: +IS.SET.default_share || 70, status: 'active', links: {}, pay: {}, n_students: 0 });
    var by = IS.assignerTitle();
    await IS.notify(id, A('تم تعيينك محاضرًا بواسطة ', 'You were appointed as a lecturer by ') + by,
      A('افتح استوديو المحاضر لتصميم صفحتك وإنشاء أول كورس.', 'Open the lecturer studio to design your page and create your first course.'), '#studio');
    IS.audit('appoint lecturer', u.name); if (id === IS.ME.id) IS.LEC = await DB.one('lecturers', id).catch(function () { return null; });
    IS.closeSheet(); IS.toast(A('عُيِّن محاضرًا ووصله إشعار', 'Appointed as a lecturer; they were notified')); IS.refresh();
  };

  /* a team role: the existing staff form (department, manager, approval level, 2FA) with the role already chosen */
  IS.ACT['assign-role'] = async function (b) {
    var id = b.getAttribute('data-id'), r = b.getAttribute('data-r');
    IS.closeSheet();
    await IS.ACT.staffform({ getAttribute: function (k) { return k === 'data-id' ? id : null; } });
    var s = document.querySelector('form[data-form="staff"] select[name="role"]'); if (s) { s.value = r; s.dispatchEvent(new Event('change', { bubbles: true })); }
  };

  function btn(id) { return '<button type="button" class="lp-btn asg-b" data-act="assign" data-id="' + esc(id) + '">' + ic('crown') + '<span>' + esc(A('تعيين', 'Appoint')) + '</span></button>'; }
  /* the button on profiles and lecturer pages */
  var prev = IS.onRoute;
  IS.onRoute = function (name, arg, main) {
    if (prev) try { prev(name, arg, main); } catch (e) {}
    if (!IS.canAssign() || !main || !/^(person|lecturer)$/.test(name)) return;
    var id = String(arg || '').split('/')[0]; if (!id || id === IS.ME.id) return;
    var acts = main.querySelector('.lp-acts'); if (acts && !acts.querySelector('.asg-b')) { acts.classList.remove('one'); acts.insertAdjacentHTML('beforeend', btn(id)); }
  };
  /* … and in Control → Users (the person's sheet) */
  var um = IS.ACT.umenu;
  if (um) IS.ACT.umenu = async function (b) {
    await um(b); if (!IS.canAssign()) return;
    var row = document.querySelector('#sheet .row.wrap'), id = b.getAttribute('data-id');
    if (row && !row.querySelector('.asg-b2')) row.insertAdjacentHTML('afterbegin', '<button class="btn pri sm asg-b2" data-act="assign" data-id="' + esc(id) + '">' + ic('crown') + esc(A('تعيين', 'Appoint')) + '</button>');
  };
})();
