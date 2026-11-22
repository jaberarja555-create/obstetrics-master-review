/* اشرح لي: the data layer. One small set of calls used by every page, with two backends:
   - PREVIEW (no config): tables in localStorage, files and videos in IndexedDB, accounts on this device. Lets the owner try every page and
     every flow (register, enrol, pay, approve, upload a video, publish, pay a doctor) before the database exists.
   - SUPABASE (config filled): the same calls go to the real database; its row-level rules (supabase/001_schema.sql) decide who may
     read or change what. Videos go to Bunny Stream through the site's own functions (functions/api/video.js).
   Tables and fields are the same in both, so the pages never know which backend they use. */
(function () {
  'use strict';
  var CFG = window.ISH_CONFIG || {};
  var LIVE = !!(CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase);
  function uuid() { return (crypto.randomUUID && crypto.randomUUID()) || 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2); }
  function now() { return new Date().toISOString(); }
  function digits(p) { return String(p || '').replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); }).replace(/[^0-9]/g, '').replace(/^(00249|249)/, '0'); }
  function phoneMail(p) { return digits(p).replace(/^0/, '') + '@phone.ishrah.app'; }
  async function sha(s) { var b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return Array.from(new Uint8Array(b)).map(function (x) { return x.toString(16).padStart(2, '0'); }).join(''); }

  /* ---------- seed data: the categories and subjects of the platform (editable in the control app) ---------- */
  var SEED = {
    categories: [
      { id: 'basics', ar: 'العلوم الأساسية', en: 'Basics', icon: 'layers', tone: 'blue', sort: 1 },
      { id: 'clinical', ar: 'الجانب الإكلينيكي', en: 'Clinical', icon: 'clinic', tone: 'teal', sort: 2 },
      { id: 'special', ar: 'الامتحانات الدولية', en: 'International Exams', icon: 'world', tone: 'gold', sort: 3 },
      { id: 'house', ar: 'طبيب الامتياز', en: 'House Officer', icon: 'house', tone: 'violet', sort: 4 }],
    subjects: [
      ['anatomy', 'basics', 'التشريح', 'Anatomy', 's_anatomy'], ['physiology', 'basics', 'الفسيولوجيا', 'Physiology', 's_physiology'], ['biochemistry', 'basics', 'الكيمياء الحيوية', 'Biochemistry', 's_biochem'],
      ['pathology', 'basics', 'علم الأمراض', 'Pathology', 's_pathology'], ['microbiology', 'basics', 'الأحياء الدقيقة', 'Microbiology', 's_micro'], ['pharmacology', 'basics', 'علم الأدوية', 'Pharmacology', 's_pharma'],
      ['community', 'basics', 'طب المجتمع', 'Community Medicine', 's_community'], ['medicine', 'clinical', 'الباطنية', 'Internal Medicine', 's_heart'], ['surgery', 'clinical', 'الجراحة', 'Surgery', 's_scalpel'],
      ['pediatrics', 'clinical', 'طب الأطفال', 'Pediatrics', 's_baby'], ['obgyn', 'clinical', 'النساء والتوليد', 'Obstetrics & Gynecology', 's_obgyn'], ['psychiatry', 'clinical', 'الطب النفسي', 'Psychiatry', 's_brain'],
      ['radiology', 'clinical', 'الأشعة', 'Radiology', 's_xray'], ['ent', 'clinical', 'الأنف والأذن والحنجرة', 'ENT', 's_ear'], ['anaesthesia', 'clinical', 'التخدير', 'Anaesthesia', 's_mask'],
      ['ophthalmology', 'clinical', 'طب وجراحة العيون', 'Ophthalmology', 'eye'], ['dermatology', 'clinical', 'الأمراض الجلدية', 'Dermatology', 's_skin'],
      ['smc', 'house', 'الامتحانات المحلية', 'Local exam', 'sudan'], ['ho-intern', 'house', 'امتحان الامتياز', 'Internship exam', 'exam'],
      ['usmle', 'special', 'امتحان الترخيص الأمريكي', 'USMLE', 'world'], ['plab', 'special', 'امتحان الترخيص البريطاني', 'PLAB', 'world'], ['mrcp', 'special', 'عضوية الكلية الملكية للأطباء', 'MRCP', 'world'], ['mrcs', 'special', 'عضوية الكلية الملكية للجراحين', 'MRCS', 'world'], ['mrcog', 'special', 'عضوية الكلية الملكية لأطباء النساء والتوليد', 'MRCOG', 'world'], ['mrcpch', 'special', 'عضوية الكلية الملكية لطب الأطفال', 'MRCPCH', 'world'], ['ifom', 'special', 'امتحان IFOM الدولي', 'IFOM', 'world'], ['canada', 'special', 'امتحانات كندا (MCCQE)', 'Canada exams (MCCQE)', 'world'], ['australia', 'special', 'امتحانات أستراليا (AMC)', 'Australia exams (AMC)', 'world'], ['oet', 'special', 'اختبار اللغة الإنجليزية المهني', 'OET', 'world'], ['ielts', 'special', 'اختبار اللغة الإنجليزية', 'IELTS', 'world'],
      ['ho-skills', 'house', 'العمل السريري', 'Clinical work', 'clinic']
    ].map(function (r, i) { return { id: r[0], cat: r[1], ar: r[2], en: r[3], icon: r[4], sort: i, spec: 'medicine' }; }).concat([
      ['haematology', 'clinical', 'lab', 'أمراض الدم', 'Haematology', 's_blood'], ['clin-chem', 'basics', 'lab', 'الكيمياء السريرية', 'Clinical Chemistry', 'flask'], ['med-micro', 'basics', 'lab', 'الأحياء الدقيقة الطبية', 'Medical Microbiology', 's_micro'],
      ['histopath', 'clinical', 'lab', 'علم الأنسجة والخلايا المرضية', 'Histopathology & Cytology', 's_pathology'], ['blood-bank', 'clinical', 'lab', 'بنك الدم', 'Blood Bank', 's_blood'], ['parasitology', 'basics', 'lab', 'علم الطفيليات', 'Parasitology', 's_micro'],
      ['nurs-fund', 'basics', 'nursing', 'أساسيات التمريض', 'Fundamentals of Nursing', 'nurse'], ['nurs-medsurg', 'clinical', 'nursing', 'تمريض باطني جراحي', 'Medical-Surgical Nursing', 's_heart'], ['nurs-mat', 'clinical', 'nursing', 'تمريض الأمومة', 'Maternity Nursing', 's_obgyn'],
      ['nurs-ped', 'clinical', 'nursing', 'تمريض الأطفال', 'Paediatric Nursing', 's_baby'], ['nurs-comm', 'clinical', 'nursing', 'تمريض صحة المجتمع', 'Community Health Nursing', 's_community'],
      ['oral-anat', 'basics', 'dentistry', 'تشريح وأنسجة الفم', 'Oral Anatomy & Histology', 'tooth'], ['dent-mat', 'basics', 'dentistry', 'المواد السنية', 'Dental Materials', 'tooth'], ['operative', 'clinical', 'dentistry', 'العلاج التحفظي', 'Operative Dentistry', 'tooth'],
      ['prostho', 'clinical', 'dentistry', 'التركيبات', 'Prosthodontics', 'tooth'], ['ortho', 'clinical', 'dentistry', 'تقويم الأسنان', 'Orthodontics', 'tooth'], ['omfs', 'clinical', 'dentistry', 'جراحة الفم والوجه والفكين', 'Oral & Maxillofacial Surgery', 's_scalpel'], ['perio', 'clinical', 'dentistry', 'أمراض اللثة', 'Periodontics', 'tooth'],
      ['pharmaceutics', 'basics', 'pharmacy', 'الصيدلانيات', 'Pharmaceutics', 'pill'], ['pharm-chem', 'basics', 'pharmacy', 'الكيمياء الصيدلانية', 'Pharmaceutical Chemistry', 'flask'], ['pharmacognosy', 'basics', 'pharmacy', 'العقاقير', 'Pharmacognosy', 'leaf'],
      ['ph-pharmacology', 'basics', 'pharmacy', 'علم الأدوية', 'Pharmacology', 's_pharma'], ['clin-pharm', 'clinical', 'pharmacy', 'الصيدلة السريرية', 'Clinical Pharmacy', 'pill']
    ].map(function (r, i) { return { id: r[0], cat: r[1], spec: r[2], ar: r[3], en: r[4], icon: r[5], sort: 100 + i }; })),
    specialties: [
      ['medicine', 'الطب البشري', 'Medicine', 'steth', 'كورسات ومراجعات لكل المواد من العلوم الأساسية حتى السنوات الإكلينيكية، مع تحضير للامتحانات المحلية والدولية.', 'Courses and reviews for every subject from basic sciences to the clinical years, with local and international exam preparation.'],
      ['lab', 'علوم المختبرات الطبية', 'Laboratory Science', 'flask', 'شرح مبسّط للتحاليل وتفسير النتائج بالفيديو والصور، مع مراجعات وأسئلة لامتحاناتك.', 'Clear video lessons on laboratory tests and reading results, with reviews and questions for your exams.'],
      ['nursing', 'التمريض', 'Nursing', 'nurse', 'دروس عملية في المهارات والرعاية التمريضية، ومراجعات وأسئلة تساعدك في الامتحانات والتدريب.', 'Practical lessons on nursing skills and care, with reviews and questions for exams and training.'],
      ['dentistry', 'طب وجراحة الأسنان', 'Dentistry', 'tooth', 'كورسات للمواد النظرية والسريرية بشرح مصوّر خطوة بخطوة، مع مراجعات قبل الامتحانات.', 'Courses for theory and clinical subjects with step-by-step visual teaching and pre-exam reviews.'],
      ['pharmacy', 'الصيدلة', 'Pharmacy', 'pill', 'شرح واضح للأدوية والمواد الصيدلانية، مع ملخصات ومراجعات وبنوك أسئلة لكل مادة.', 'Clear teaching of drugs and pharmaceutical subjects, with summaries, reviews and question banks for each subject.']
    ].map(function (r, i) { return { id: r[0], ar: r[1], en: r[2], icon: r[3], about_ar: r[4], about_en: r[5], img: 'img/sp_' + r[0] + '.webp', sort: i }; }),
    settings: [
      { id: 'bankak_account', value: '4674587' }, { id: 'bankak_name', value: 'سعاد عبدالكريم' }, { id: 'whatsapp', value: '249116984258' },
      { id: 'currency', value: 'SDG' }, { id: 'default_share', value: '70' }]
  };

  /* ================= PREVIEW backend ================= */
  var Local = (function () {
    var K = 'ish-db', DB;
    function load() { try { DB = JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) { DB = null; }
      if (!DB) { DB = { _v: 6 }; Object.keys(SEED).forEach(function (t) { DB[t] = SEED[t].map(function (r) { return Object.assign({}, r); }); }); save(); return; }
      /* an older preview store: add the specialities and their subjects (Nov 2026) */
      if ((DB._v || 1) < 6 && DB.specialties) { /* speciality texts: what the platform offers (owner, 18 Nov 2026) */ DB.specialties.forEach(function (x) { var n = SEED.specialties.filter(function (y) { return y.id === x.id; })[0]; if (n) { x.about_ar = n.about_ar; x.about_en = n.about_en; } }); }
      if ((DB._v || 1) < 5) { /* international exams (owner, 18 Nov 2026) */ var hv = {}; (DB.subjects || []).forEach(function (x) { hv[x.id] = x; });
        SEED.subjects.filter(function (x) { return x.cat === 'special'; }).forEach(function (x) { if (hv[x.id]) Object.assign(hv[x.id], { ar: x.ar, en: x.en, sort: x.sort }); else DB.subjects.push(Object.assign({}, x)); }); }
      if ((DB._v || 1) < 4) { /* sections (owner, 18 Nov 2026): Basics, Clinical, International Exams, House Officer */
        DB.categories = SEED.categories.map(function (r) { return Object.assign({}, r); }); DB.subjects = (DB.subjects || []).filter(function (x) { return x.id !== 'finals'; });
        DB.subjects.forEach(function (x) { var n = SEED.subjects.filter(function (y) { return y.id === x.id; })[0]; if (n && (x.id === 'smc' || x.id === 'ho-skills')) Object.assign(x, n); });
        (DB.courses || []).forEach(function (c) { if (c.cat === 'local') c.cat = 'house'; }); DB._v = 3.5; }
      if ((DB._v || 1) < 4) { if (!DB.specialties) DB.specialties = SEED.specialties.map(function (r) { return Object.assign({}, r); }); var have = {}; (DB.subjects || []).forEach(function (x) { have[x.id] = 1; if (!x.spec) x.spec = 'medicine'; });
        SEED.subjects.forEach(function (x) { if (!have[x.id]) DB.subjects.push(Object.assign({}, x)); }); (DB.courses || []).forEach(function (c) { if (!c.spec) c.spec = 'medicine'; }); DB._v = 6; save(); } else if (DB._v < 6) { DB._v = 6; save(); } }
    function save() { try { localStorage.setItem(K, JSON.stringify(DB)); } catch (e) { alert('مساحة المعاينة على هذا الجهاز امتلأت.'); } }
    load();
    function tb(t) { return DB[t] || (DB[t] = []); }
    function match(r, f) {
      f = f || {};
      if (f.eq) for (var k in f.eq) if (f.eq[k] !== undefined && r[k] !== f.eq[k]) return false;
      if (f.in) for (var k2 in f.in) if (f.in[k2].indexOf(r[k2]) < 0) return false;
      if (f.neq) for (var k3 in f.neq) if (r[k3] === f.neq[k3]) return false;
      return true;
    }
    var IDB = null;
    function idb() { return IDB || (IDB = new Promise(function (ok, no) { var q = indexedDB.open('ish-files', 1); q.onupgradeneeded = function () { q.result.createObjectStore('f'); }; q.onsuccess = function () { ok(q.result); }; q.onerror = function () { no(q.error); }; })); }
    function fput(k, blob) { return idb().then(function (d) { return new Promise(function (ok, no) { var x = d.transaction('f', 'readwrite'); x.objectStore('f').put(blob, k); x.oncomplete = function () { ok(k); }; x.onerror = function () { no(x.error); }; }); }); }
    function fget(k) { return idb().then(function (d) { return new Promise(function (ok) { var q = d.transaction('f').objectStore('f').get(k); q.onsuccess = function () { ok(q.result || null); }; q.onerror = function () { ok(null); }; }); }); }
    var URLS = {};
    var users = function () { try { return JSON.parse(localStorage.getItem('ish-users') || '[]'); } catch (e) { return []; } };
    var setUsers = function (u) { localStorage.setItem('ish-users', JSON.stringify(u)); };
    var listeners = [];
    function fire() { listeners.forEach(function (f) { try { f(); } catch (e) {} }); }
    function mkProfile(u, name, phone, email) {
      var owner = !tb('profiles').some(function (p) { return (p.team || []).indexOf('owner') >= 0; });
      var p = { id: u.id, name: name, phone: phone || '', email: email || '', photo: '', university: '', year: '', team: owner ? ['owner'] : [], status: 'active', created_at: now() };
      var inv = tb('invites').filter(function (v) { return v.status === 'pending' && ((phone && v.phone && digits(v.phone) === digits(phone)) || (email && v.email && v.email === String(email).toLowerCase())); })[0];
      if (inv) { p.team = [inv.role].concat(inv.extras || []); p.dept = inv.dept; p.manager_id = inv.manager_id; p.approval = inv.approval; p.mfa_required = inv.mfa_required; p.team_status = inv.team_status || 'active'; inv.status = 'used'; }
      tb('profiles').push(p); save(); return p;
    }
    return {
      live: false,
      uid: function () { return localStorage.getItem('ish-session') || null; },
      onAuth: function (f) { listeners.push(f); },
      signUp: async function (o) {
        var ph = digits(o.phone); if (users().some(function (u) { return u.phone === ph; })) throw new Error('exists');
        var u = { id: uuid(), phone: ph, hash: await sha(ph + ':' + o.pass) }; var us = users(); us.push(u); setUsers(us);
        mkProfile(u, o.name, ph, o.email || ''); localStorage.setItem('ish-session', u.id); fire(); return u.id;
      },
      signIn: async function (o) {
        var ph = digits(o.phone), h = await sha(ph + ':' + o.pass), u = users().filter(function (x) { return x.phone === ph; })[0];
        if (!u || u.hash !== h) throw new Error('bad'); localStorage.setItem('ish-session', u.id); fire(); return u.id;
      },
      google: async function () {
        var em = prompt('معاينة: اكتب بريد Gmail (في النسخة الحقيقية يفتح Google مباشرة)'); if (!em || !/@/.test(em)) return null; em = em.trim().toLowerCase();
        var u = users().filter(function (x) { return x.email === em; })[0];
        if (!u) { u = { id: uuid(), email: em }; var us = users(); us.push(u); setUsers(us); mkProfile(u, em.split('@')[0], '', em); }
        localStorage.setItem('ish-session', u.id); fire(); return u.id;
      },
      signOut: async function () { localStorage.removeItem('ish-session'); try { Object.keys(sessionStorage).forEach(function (k) { if (/^ish-aal2-/.test(k)) sessionStorage.removeItem(k); }); } catch (e) {} fire(); },
      setPassword: async function (uid, pass) { var us = users(), u = us.filter(function (x) { return x.id === uid; })[0]; if (!u || !u.phone) throw new Error('nophone'); u.hash = await sha(u.phone + ':' + pass); setUsers(us); },
      /* email accounts (owner, 18 Nov 2026): a 6-digit code proves the email; in this preview the code is shown on the screen */
      authKind: async function () { var id = localStorage.getItem('ish-session'), u = users().filter(function (x) { return x.id === id; })[0]; return u && u.phone ? 'phone' : 'email'; },
      emailCode: async function (o) {
        var em = String(o.email || '').trim().toLowerCase(), u = users().filter(function (x) { return x.email === em; })[0];
        if (!o.any) { if (o.create && u && u.hash) throw new Error('exists'); if (!o.create && !u) throw new Error('nouser'); }
        var code = String(Math.floor(100000 + Math.random() * 900000)); localStorage.setItem('ish-otp', JSON.stringify({ e: em, c: code, n: o.name || '', t: Date.now() })); return { preview: code };
      },
      emailVerify: async function (o) {
        var em = String(o.email || '').trim().toLowerCase(), p = JSON.parse(localStorage.getItem('ish-otp') || 'null');
        if (!p || p.e !== em || p.c !== String(o.code).trim() || Date.now() - p.t > 3600e3) throw new Error('badcode'); localStorage.removeItem('ish-otp');
        var u = users().filter(function (x) { return x.email === em; })[0];
        if (!u) { u = { id: uuid(), email: em }; var us = users(); us.push(u); setUsers(us); mkProfile(u, p.n || em.split('@')[0], '', em); }
        localStorage.setItem('ish-session', u.id); fire(); return u.id;
      },
      setOwnPassword: async function (pass) { var id = localStorage.getItem('ish-session'), us = users(), u = us.filter(function (x) { return x.id === id; })[0]; if (!u) throw new Error('nosession');
        u.hash = await sha((u.email || u.phone) + ':' + pass); setUsers(us); },
      signInEmail: async function (o) {
        var em = String(o.email || '').trim().toLowerCase(), u = users().filter(function (x) { return x.email === em; })[0];
        if (!u || !u.hash || u.hash !== await sha(em + ':' + o.pass)) throw new Error('bad'); localStorage.setItem('ish-session', u.id); fire(); return u.id;
      },
      q: async function (t, f) {
        f = f || {}; var r = tb(t).filter(function (x) { return match(x, f); }).map(function (x) { return Object.assign({}, x); });
        if (f.order) { var c = f.order[0], asc = f.order[1] !== false; r.sort(function (a, b) { return (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (asc ? 1 : -1); }); }
        if (f.limit) r = r.slice(0, f.limit); return r;
      },
      lesson: async function (id) { return this.one('lessons', id); },
      one: async function (t, id) { var r = tb(t).filter(function (x) { return x.id === id; })[0]; return r ? Object.assign({}, r) : null; },
      ins: async function (t, row) { var r = Object.assign({ id: uuid(), created_at: now() }, row); tb(t).push(r); save(); return Object.assign({}, r); },
      upsert: async function (t, row) { var x = tb(t).filter(function (y) { return y.id === row.id; })[0]; if (x) Object.assign(x, row); else tb(t).push(Object.assign({ created_at: now() }, row)); save(); return row; },
      upd: async function (t, id, p) { var x = tb(t).filter(function (y) { return y.id === id; })[0]; if (!x) throw new Error('missing'); Object.assign(x, p); save(); return Object.assign({}, x); },
      del: async function (t, id) { DB[t] = tb(t).filter(function (y) { return y.id !== id; }); save(); },
      upload: async function (bucket, file) { if (bucket === 'media') return await new Promise(function (ok) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.readAsDataURL(file); }); var k = bucket + '/' + uuid(); await fput(k, file); return k; },
      fileUrl: async function (bucket, path) { if (!path) return ''; if (/^(https?:|data:|blob:|img\/)/.test(path)) return path; if (URLS[path]) return URLS[path]; var b = await fget(path); return b ? (URLS[path] = URL.createObjectURL(b)) : ''; },
      videoUpload: async function (file, o) { var k = 'video/' + uuid(); if (o && o.onProgress) o.onProgress(30); await fput(k, file); if (o && o.onProgress) o.onProgress(100); return k; },
      videoFile: async function (lesson) { if (IS.extEmbed(lesson.video_id)) throw new Error('extlink'); var u = await this.fileUrl('video', lesson.video_id); if (!u) throw new Error('novideo'); return u; },
      videoPlay: async function (lesson) { var e = IS.extEmbed(lesson.video_id); if (e) return e; var u = await this.fileUrl('video', lesson.video_id); return u ? { kind: 'video', src: u } : null; },
      /* audio lectures (R2 when live; this device in the preview) */
      audioUpload: async function (file, o) { var k = 'audio/' + uuid(); if (o && o.onProgress) o.onProgress(40); await fput(k, file); await this.upd('lessons', o.lesson, { kind: 'audio', video_id: 'au:' + k }); if (o && o.onProgress) o.onProgress(100); return 'au:' + k; },
      audioPlay: async function (lesson) { if (!/^au:/.test(lesson.video_id || '')) return null; var u = await this.fileUrl('audio', lesson.video_id.slice(3)); return u ? { kind: 'audio', src: u } : null; },
      audioRemove: async function (id) { var x = tb('lessons').filter(function (y) { return y.id === id; })[0]; if (x) { x.video_id = ''; save(); } },
      reset: function () { localStorage.removeItem(K); localStorage.removeItem('ish-users'); localStorage.removeItem('ish-session'); indexedDB.deleteDatabase('ish-files'); }
    };
  })();

  /* ================= SUPABASE backend ================= */
  var Remote = LIVE ? (function () {
    var sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true,
      /* the sign-in lock is shared by every open tab of the site; a sleeping background tab could hold it and leave a new tab on the loading
         circle for ever (owner's laptop, 21 Nov 2026). Wait for it at most 3 s, then go on. */
      lock: function (name, wait, fn) {
        if (!navigator.locks || !navigator.locks.request) return fn();
        return new Promise(function (ok, no) {
          var done = false, run = function () { if (done) return; done = true; clearTimeout(t); return Promise.resolve().then(fn).then(ok, no); };
          var t = setTimeout(run, 3000);
          navigator.locks.request(name, function () { return run(); }).catch(function () { run(); });
        });
      } } });
    var UID = null, listeners = [];
    sb.auth.getSession().then(function (r) { UID = r.data.session ? r.data.session.user.id : null; listeners.forEach(function (f) { f(); }); });
    sb.auth.onAuthStateChange(function (_e, s) { var n = s ? s.user.id : null; if (n !== UID) { UID = n; listeners.forEach(function (f) { f(); }); } });
    var LCOLS = 'id,course_id,section_id,title,kind,minutes,free,sort,created_at,has_video';
    function cols(t) { return t === 'lessons' ? LCOLS : '*'; }
    function chk(r) { if (r.error) throw new Error(r.error.message); return r.data; }
    /* reads are kept for 45 s (and the same read asked twice at once is sent once), so moving between pages does not wait for the
       database again (owner, 19 Nov 2026: "very slow when changing from one place to another"); any change empties it */
    var READS = new Map(), SIGNED = {};
    try { SIGNED = JSON.parse(localStorage.getItem('ish-signed') || '{}'); Object.keys(SIGNED).forEach(function (k) { if (!(SIGNED[k].t > Date.now())) delete SIGNED[k]; }); } catch (e) { SIGNED = {}; }
    var COVER_CACHE = 'ish-library-covers', covers = {}, coverRequests = new Map();
    try { covers = JSON.parse(localStorage.getItem(COVER_CACHE) || '{}') || {}; } catch (error) {}
    function coverKey(account, path) { return account + '/' + path; }
    function cachedCover(account, path) {
      var entry = covers[coverKey(account, path)];
      return entry && (entry.expires > Date.now() || !navigator.onLine) ? entry.url : '';
    }
    function keepCovers() {
      var entries = Object.entries(covers).filter(function (entry) { return entry[1].expires > Date.now() - 30 * 86400000; });
      entries.sort(function (a, b) { return b[1].expires - a[1].expires; });
      covers = Object.fromEntries(entries.slice(0, 350));
      try { localStorage.setItem(COVER_CACHE, JSON.stringify(covers)); } catch (error) {}
    }
    /* library files and covers come from Cloudflare R2 (owner, 22 Nov 2026: free downloads); permission is still Supabase's own storage rule.
       If the R2 function does not answer, the old Supabase signed address is used, so nothing stops working. */
    var LIBR2 = true;
    async function libUrls(paths) {
      if (!LIBR2 || !paths.length) return null;
      try {
        var t = UID ? await token() : '';
        var r = await fetch('/api/lib', { method: 'POST', headers: Object.assign({ 'content-type': 'application/json' }, t ? { authorization: 'Bearer ' + t } : {}), body: JSON.stringify({ paths: paths }) });
        if (r.status === 501 || r.status === 404) { LIBR2 = false; return null; }
        if (!r.ok) return null;
        var j = await r.json(), out = {};
        Object.keys(j.urls || {}).forEach(function (p) { out[p] = location.origin + j.urls[p]; });
        return out;
      } catch (e) { return null; }
    }
    async function libraryCoverUrls(paths) {
      var account = UID || 'visitor';
      var unique = Array.from(new Set(paths));
      var missing = unique.filter(function (path) { return !cachedCover(account, path) && !coverRequests.has(coverKey(account, path)); });
      if (missing.length) {
        var batch = (async function () {
          var viaR2 = await libUrls(missing);
          if (viaR2 && Object.keys(viaR2).length) {
            Object.keys(viaR2).forEach(function (p) { covers[coverKey(account, p)] = { url: viaR2[p], expires: Date.now() + 5 * 3600000 }; });
            keepCovers(); return;
          }
          var result = await sb.storage.from('library').createSignedUrls(missing, 3600);
          (result.data || []).forEach(function (item) {
            if (item.signedUrl) covers[coverKey(account, item.path)] = { url: item.signedUrl, expires: Date.now() + 50 * 60000 };
          });
          if (result.data) keepCovers();
        })().finally(function () {
          missing.forEach(function (path) { coverRequests.delete(coverKey(account, path)); });
        });
        missing.forEach(function (path) { coverRequests.set(coverKey(account, path), batch); });
      }
      var pending = new Set(unique.map(function (path) { return coverRequests.get(coverKey(account, path)); }).filter(Boolean));
      await Promise.all(pending);
      return new Map(unique.map(function (path) { return [path, (UID || 'visitor') === account ? cachedCover(account, path) : '']; }));
    }
    /* Saved data on the phone (owner, 20 Nov 2026: "make the user feel no delay and also it works offline"): every read is kept in
       IndexedDB per account. Next time the same read is answered at once from the phone and checked with the server in the
       background; when the server's answer differs the page is redrawn quietly (event ish-fresh). Without internet the saved answer is
       used, so every page opened before works offline. After a change the saved answer is "dirty": the server is asked first and the saved
       answer is used only if it does not reply within 1.5 s. */
    var PERS = new Map(), PDB = null, PDIRTY = new Set(), PWRITE = new Map(), PTIMER = 0, PMAX = 900;
    var PREADY = new Promise(function (done) {
      try {
        var open = indexedDB.open('ish-data', 1);
        open.onupgradeneeded = function () { open.result.createObjectStore('r'); };
        open.onerror = function () { done(); };
        open.onsuccess = function () {
          PDB = open.result;
          try {
            var all = [], cur = PDB.transaction('r').objectStore('r').openCursor();
            cur.onsuccess = function () { var c = cur.result; if (c) { all.push([c.key, c.value]); c.continue(); return; }
              all.sort(function (a, b) { return a[1].t - b[1].t; });
              var drop = all.length > PMAX ? all.splice(0, all.length - PMAX) : [];
              all.forEach(function (e) { PERS.set(e[0], e[1]); });
              if (drop.length) try { var st = PDB.transaction('r', 'readwrite').objectStore('r'); drop.forEach(function (e) { st.delete(e[0]); }); } catch (e) {}
              done(); };
            cur.onerror = function () { done(); };
          } catch (e) { done(); }
        };
      } catch (e) { done(); }
      setTimeout(done, 1500);
    });
    function pkey(k) { return (UID || (window.IS && IS.ME && IS.ME.id) || 'visitor') + '|' + k; }
    function pput(pk, v) {
      var e = { t: Date.now(), v: v }; PERS.set(pk, e); PDIRTY.delete(pk); PWRITE.set(pk, e);
      if (PERS.size > PMAX + 100) { var old = PERS.keys().next().value; PERS.delete(old); PWRITE.set(old, null); }
      clearTimeout(PTIMER); PTIMER = setTimeout(pflush, 600);
    }
    function pflush() {
      if (!PDB || !PWRITE.size) return;
      try { var st = PDB.transaction('r', 'readwrite').objectStore('r');
        PWRITE.forEach(function (e, k) { if (e) st.put(e, k); else st.delete(k); }); } catch (e) {}
      PWRITE.clear();
    }
    window.addEventListener('pagehide', pflush);
    var FRESH = 0;
    function fresh() { clearTimeout(FRESH); FRESH = setTimeout(function () { window.dispatchEvent(new CustomEvent('ish-fresh')); }, 350); }
    function same(a, b) { try { return JSON.stringify(a) === JSON.stringify(b); } catch (e) { return false; } }
    var WSEQ = 0;   /* changes made by this person; a read that started before one is out of date when it answers */
    function forget() { WSEQ++; READS.clear(); PERS.forEach(function (_v, k) { PDIRTY.add(k); }); }
    /* a comment or a reaction changes only its own tables and the counts of what it is on, so the rest of the
       saved reads stay and the next page opens at once (owner, 20 Nov 2026: "should not feel slow, like Facebook").
       Any other write still forgets everything. */
    var FEED = ['posts', 'files', 'courses', 'course_requests', 'events', 'news', 'notices', 'feed_feedback'];
    var CMT = ['replies', 'library_comments', 'course_request_comments', 'comment_likes', 'posts', 'files', 'course_requests', 'notifications'];
    var NEAR = { replies: CMT, library_comments: CMT, course_request_comments: CMT, comment_likes: CMT, feed_feedback: FEED,
      ish_comment_react: CMT, ish_comment_reply: CMT, ish_library_comment: CMT, ish_series_comment: CMT,
      ish_feed_react: FEED, ish_feed_rate: FEED, ish_series_vote: FEED, reader_state: ['reader_state'], push_subs: ['push_subs'] };
    function forgetFor(name) {
      var near = NEAR[name]; if (!near) return forget();
      WSEQ++;
      READS.forEach(function (v, k) { var t = JSON.parse(k)[1]; if (name === t || near.indexOf(t) >= 0) READS.delete(k); });
      PERS.forEach(function (v, pk) { var t; try { t = JSON.parse(pk.slice(pk.indexOf('|') + 1))[1]; } catch (e) {} if (name === t || near.indexOf(t) >= 0) PDIRTY.add(pk); });
    }
    function copy(v) { return Array.isArray(v) ? v.map(function (x) { return x && typeof x === 'object' ? Object.assign({}, x) : x; }) : v && typeof v === 'object' ? Object.assign({}, v) : v; }
    async function cached(key, run) {
      var k = JSON.stringify(key), hit = READS.get(k);
      if (hit && Date.now() - hit.t < 45000) {
        /* shown at once; a read older than 1.5 s is checked with the server in the background (the page redraws if it changed) */
        if (Date.now() - hit.t > 1500 && navigator.onLine && !hit.bg) {
          hit.bg = true;
          var bseq = WSEQ;
          Promise.all([hit.p, run()]).then(function (two) {
            if (bseq !== WSEQ) { hit.bg = false; return; }
            READS.set(k, { t: Date.now(), p: Promise.resolve(two[1]) }); pput(pkey(k), two[1]);
            if (!same(two[0], two[1])) fresh();
          }).catch(function () { hit.bg = false; });
        }
        return hit.p.then(copy);
      }
      if (!PERS.size) await PREADY;
      var pk = pkey(k), saved = PERS.get(pk);
      if (saved && !navigator.onLine) return copy(saved.v);
      if (!navigator.onLine) { var fb = offFallback(key); if (fb !== undefined) return copy(fb); throw new Error('offline'); }
      var p = run(), seq = WSEQ;
      var entry = { t: Date.now(), p: p };
      READS.delete(k);
      READS.set(k, entry);
      if (READS.size > 300) READS.delete(READS.keys().next().value);
      p.then(function (v) {
        if (seq !== WSEQ) { if (READS.get(k) === entry) READS.delete(k); PDIRTY.add(pk); return; }   /* answered from before a change */
        var before = PERS.get(pk); pput(pk, v);
        if (before && entry.shown && !same(before.v, v)) fresh();
      }, function () { if (READS.get(k) === entry) READS.delete(k); });
      if (!saved) return p.then(copy);
      if (!PDIRTY.has(pk)) { entry.shown = true; p.catch(function () {}); return copy(saved.v); }
      /* changed lately: wait a little for the server, then show the saved answer and redraw when the server answers */
      return Promise.race([p.then(copy), new Promise(function (ok) { setTimeout(function () { entry.shown = true; ok(copy(saved.v)); }, 1500); })])
        .catch(function () { return copy(saved.v); });
    }
    /* without internet and no saved answer for this exact read (owner, 22 Nov 2026: «some pages say no internet»): a single row is
       looked up in any saved list of its table (a course opened from the courses list), a list becomes empty and a read-only rpc gives no
       data, so the page still opens with what the phone has; `api.offMiss` counts these so the router can prefer a saved page copy */
    function offFallback(key) {
      if (key[0] === 'one') {
        var me = pkey(''), found;
        PERS.forEach(function (e, pk) {
          if (found || pk.indexOf(me) !== 0 || !Array.isArray(e.v)) return;
          var k; try { k = JSON.parse(pk.slice(me.length)); } catch (x) { return; }
          if (k[0] !== 'q' || k[1] !== key[1]) return;
          for (var i = 0; i < e.v.length; i++) if (e.v[i] && e.v[i].id === key[2]) { found = e.v[i]; break; }
        });
        if (found) return found;
        return undefined;
      }
      api.offMiss = (api.offMiss || 0) + 1;
      if (key[0] === 'q') return [];
      if (key[0] === 'rpc') return { data: null, error: null };
      return undefined;
    }
    function rawQ(t, f) { return api._q(t, f); }
    /* a sign-in that expired quietly (the phone slept, the token was not renewed) made every save fail while the pages still showed from
       the saved copies (owner, 22 Nov 2026: «reactions and download don't work»). A request refused for the sign-in is sent once more
       after renewing it. */
    var rpcRaw = sb.rpc.bind(sb);
    function authErr(e) { var m = String((e && (e.message || e.code || e.hint)) || ''); return (e && e.status === 401) || /JWT|jwt|PGRST30[0-9]|not authenticated|request_sign_in|invalid claim|session/i.test(m); }
    window.ISH_AUTHERR = authErr;
    var rpc0 = function (name, args, opts) {
      return Promise.resolve(rpcRaw(name, args, opts)).then(function (r) {
        if (!r || !r.error || !authErr(r.error)) return r;
        return sb.auth.refreshSession().then(function (x) { return x && x.data && x.data.session ? Promise.resolve(rpcRaw(name, args, opts)) : r; }, function () { return r; });
      });
    };
    /* comments and reactions made without internet wait in an outbox on the phone and are sent, in order, when it returns
       (owner, 20 Nov 2026: "it works offline"). Other changes (payments, uploads, editing) still need the internet. */
    var OUTK = 'ish-outbox', LASTQ = 0;
    function outbox() { try { return JSON.parse(localStorage.getItem(OUTK) || '[]'); } catch (e) { return []; } }
    function saveOut(list) { try { localStorage.setItem(OUTK, JSON.stringify(list)); } catch (e) {} window.dispatchEvent(new CustomEvent('ish-outbox', { detail: { n: list.length } })); }
    function netErr(e) { var m = String((e && (e.message || e.details)) || e || ''); return !navigator.onLine || /Failed to fetch|NetworkError|Load failed|network|fetch/i.test(m); }
    function queueable(name, a) {
      a = a || {};
      if (name === 'ish_comment_react' || name === 'ish_comment_reply' || name === 'ish_series_comment' || name === 'ish_feed_react') return true;
      if (name === 'ish_library_comment') return !!a.message && !a.remove;
      if (name === 'ish_series_vote') return a.action === 'react';
      if (name === 'ish_course_request') return a.action === 'comment';
      return name === 'ins:replies';
    }
    function enqueue(kind, name, args) {
      var list = outbox(), id = 'q-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      list.push({ id: id, u: UID, k: kind, n: name, a: args, t: new Date().toISOString() }); saveOut(list); LASTQ = Date.now();
      if (kind === 'ins') return Object.assign({ id: id, created_at: new Date().toISOString(), user_id: UID, status: 'open', _queued: true }, args);
      return { data: null, error: null, queued: true };
    }
    var SENDING = false;
    async function sendOutbox() {
      if (SENDING || !navigator.onLine || !UID) return;
      var list = outbox().filter(function (x) { return x.u === UID; }); if (!list.length) return;
      SENDING = true; var sent = 0;
      try {
        for (var i = 0; i < list.length; i++) {
          var x = list[i], r;
          try {
            r = x.k === 'ins' ? await sb.from(x.n.slice(4)).insert(x.a) : await rpc0(x.n, x.a);
            if (r && r.error && netErr(r.error)) break;
          } catch (e) { if (netErr(e)) break; }
          sent++; saveOut(outbox().filter(function (y) { return y.id !== x.id; }));
        }
      } finally { SENDING = false; }
      if (sent) { forget(); fresh(); }
    }
    window.addEventListener('online', function () { setTimeout(sendOutbox, 800); });
    setInterval(sendOutbox, 30000);
    /* comments still waiting in the outbox are added to the comments read from the phone, so they stay in place */
    var QTAB_ALL = { replies: 1, library_comments: 1, course_request_comments: 1 };
    var QTAB = { 'ins:replies': 'replies', ish_library_comment: 'library_comments', ish_series_comment: 'library_comments', ish_course_request: 'course_request_comments' };
    function pendingRows(t, f) {
      var me = (window.IS && IS.ME) || {}, rows = [];
      outbox().forEach(function (x) {
        if (x.u !== UID) return;
        var a = x.a || {}, row = null;
        if (x.n === 'ins:replies' && t === 'replies') row = Object.assign({}, a);
        else if (x.n === 'ish_library_comment' && t === 'library_comments') row = { file_id: a.file, body: a.message };
        else if (x.n === 'ish_series_comment' && t === 'library_comments') row = { series_id: a.series, body: a.message };
        else if (x.n === 'ish_course_request' && t === 'course_request_comments') row = { request_id: a.request, body: (a.payload || {}).body };
        else if (x.n === 'ish_comment_reply') { var tb = { reply: 'replies', request: 'course_request_comments', file: 'library_comments' }[a.kind]; if (tb === t) row = { parent_id: a.parent, body: a.body }; }
        if (!row) return;
        row = Object.assign({ id: x.id, user_id: UID, name: me.name, author_name: me.name, photo: me.photo, author_photo: me.photo, status: 'open', created_at: x.t, _queued: true }, row);
        var ok = true;
        Object.keys((f && f.eq) || {}).forEach(function (k) { if (f.eq[k] !== undefined && f.eq[k] !== null && k !== 'status' && row[k] !== f.eq[k]) ok = false; });
        Object.keys((f && f.in) || {}).forEach(function (k) { if (f.in[k].indexOf(row[k]) < 0) ok = false; });
        if (ok) rows.push(row);
      });
      return rows;
    }
    var readOnlyRpc = new Set(['ish_lesson', 'ish_presence', 'ish_team_seen',
      'ish_public_course_terms', 'ish_series_scores', 'ish_available_course_seats', 'ish_team_public', 'ish_series_rating_scores', 'ish_reactors',
      'ish_space_stats', 'ish_usage', 'ish_assist_usage']);
    var QUIET_RPC = new Set(['ish_seen', 'ish_space_join', 'ish_push_save', 'ish_reader_state']);   /* background calls that change nothing the pages show */
    var SAVE_RPC = new Set(['ish_public_course_terms', 'ish_series_rating_scores', 'ish_team_public', 'ish_space_stats', 'ish_reactors', 'ish_available_course_seats',
      /* every read a page makes is kept on the phone, so it opens offline too (22 Nov 2026) */
      'ish_profile_card', 'ish_followers', 'ish_presence', 'ish_team_seen', 'ish_space_people', 'ish_series_scores', 'ish_lesson']);
    sb.rpc = function (name, args) {
      if (SAVE_RPC.has(name)) return cached(['rpc', name, args || {}], function () {
        return rpc0(name, args).then(function (r) { if (r.error) throw r.error; return { data: r.data, error: null }; });
      }).catch(function (e) { return { data: null, error: e }; });
      if (!readOnlyRpc.has(name) && !QUIET_RPC.has(name)) {
        var q = queueable(name, args);
        if (q && !navigator.onLine) return Promise.resolve(enqueue('rpc', name, args));
        forgetFor(name);
        var call = Promise.resolve(rpc0.apply(null, arguments));   /* run the request once: a supabase builder sends it again on every then() */
        call.then(function () { forgetFor(name); }, function () {});
        if (NEAR[name]) call.then(function (r) { if (r && !r.error) window.dispatchEvent(new CustomEvent('ish-sent', { detail: { name: name, args: args } })); }, function () {});
        if (!q) return call;
        return Promise.resolve(call).then(function (r) { return r && r.error && netErr(r.error) ? enqueue('rpc', name, args) : r; },
          function (e) { if (netErr(e)) return enqueue('rpc', name, args); throw e; });
      }
      return rpc0.apply(null, arguments);
    };
    sb.auth.onAuthStateChange(function (ev) { if (ev === 'TOKEN_REFRESHED') return; forget(); setTimeout(sendOutbox, 1500); });
    async function token() { var s = (await sb.auth.getSession()).data.session; return s ? s.access_token : ''; }
    var api = {
      live: true, sb: sb,
      cachedLibraryCover: function (path) { return cachedCover(UID || 'visitor', path); },
      libraryCoverUrls: libraryCoverUrls,
      uid: function () { return UID; },
      ready: sb.auth.getSession(),
      onAuth: function (f) { listeners.push(f); },
      signUp: async function (o) { var r = await sb.auth.signUp({ email: phoneMail(o.phone), password: o.pass, options: { data: { name: o.name, phone: digits(o.phone), contact_email: o.email || '' } } }); if (r.error) throw new Error(/registered/i.test(r.error.message) ? 'exists' : r.error.message); return r.data.user && r.data.user.id; },
      signIn: async function (o) { var r = await sb.auth.signInWithPassword({ email: phoneMail(o.phone), password: o.pass }); if (r.error) throw new Error('bad'); return r.data.user.id; },
      googleToken: async function (token, nonce) { var r = await sb.auth.signInWithIdToken({ provider: 'google', token: token, nonce: nonce }); if (r.error) throw r.error; UID = r.data.user.id; return UID; },
      google: async function () {
        chk(await sb.auth.signInWithOAuth({ provider: 'google', options: {
          redirectTo: location.origin + location.pathname, queryParams: { prompt: 'select_account' }
        } }));
      },
      signOut: async function () { await sb.auth.signOut(); },
      authKind: async function () { var u = (await sb.auth.getUser()).data.user; return u && /@phone\.ishrah\.app$/.test(u.email || '') ? 'phone' : 'email'; },
      emailCode: async function (o) {
        var r = await sb.auth.signInWithOtp({ email: String(o.email).trim().toLowerCase(), options: { shouldCreateUser: !!o.create, data: o.create ? { name: o.name || '' } : undefined } });
        if (r.error) throw new Error(/signups not allowed|not found/i.test(r.error.message) ? 'nouser' : /rate|seconds/i.test(r.error.message) ? 'wait' : r.error.message); return {};
      },
      emailVerify: async function (o) { var r = await sb.auth.verifyOtp({ email: String(o.email).trim().toLowerCase(), token: String(o.code).trim(), type: 'email' }); if (r.error) throw new Error('badcode'); return r.data.user.id; },
      setOwnPassword: async function (pass) { var r = await sb.auth.updateUser({ password: pass }); if (r.error) throw new Error(r.error.message); },
      signInEmail: async function (o) { var r = await sb.auth.signInWithPassword({ email: String(o.email).trim().toLowerCase(), password: o.pass }); if (r.error) throw new Error(/confirm/i.test(r.error.message) ? 'unconfirmed' : 'bad'); return r.data.user.id; },
      setPassword: async function (uid, pass) { var r = await fetch('api/admin', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + await token() }, body: JSON.stringify({ act: 'password', uid: uid, pass: pass }) }); if (!r.ok) throw new Error(await r.text()); },
      forget: function () { forget(); },   /* live updates (js/live.js): read fresh after another account changed something */
      q: async function (t, f) {
        var rows = await cached(['q', t, f || {}], function () { return rawQ(t, f); });
        if (QTAB_ALL[t] && Array.isArray(rows)) { var more = pendingRows(t, f); if (more.length) rows = rows.concat(more); }
        return rows;
      },
      outbox: function () { return outbox().filter(function (x) { return x.u === UID; }).length; },
      sendOutbox: sendOutbox,
      clearSaved: function () { READS.clear(); PERS.clear(); PWRITE.clear(); PDIRTY.clear(); try { if (PDB) PDB.transaction('r', 'readwrite').objectStore('r').clear(); } catch (e) {} },
      wasQueued: function () { return Date.now() - LASTQ < 300; },
      one: async function (t, id) { return cached(['one', t, id], async function () { return chk(await sb.from(t).select(cols(t)).eq('id', id).maybeSingle()); }); },
      _q: async function (t, f) {
        f = f || {}; var x = sb.from(t).select(f.select || cols(t));
        if (f.eq) Object.keys(f.eq).forEach(function (k) { if (f.eq[k] !== undefined) x = f.eq[k] === null ? x.is(k, null) : x.eq(k, f.eq[k]); });
        if (f.in) Object.keys(f.in).forEach(function (k) { x = x.in(k, f.in[k]); });
        if (f.neq) Object.keys(f.neq).forEach(function (k) { x = x.neq(k, f.neq[k]); });
        if (f.order) x = x.order(f.order[0], { ascending: f.order[1] !== false });
        if (f.limit) x = x.limit(f.limit);
        return chk(await x) || [];
      },
      lesson: async function (id) { return chk(await sb.rpc('ish_lesson', { p_id: id })); },
      ins: async function (t, row) {
        if (queueable('ins:' + t) && !navigator.onLine) return enqueue('ins', 'ins:' + t, row);
        forgetFor(t);
        try { var made = chk(await sb.from(t).insert(row).select(cols(t)).single());
          if (t === 'replies') window.dispatchEvent(new CustomEvent('ish-sent', { detail: { name: 'ins:replies', args: row } }));
          return made; }
        catch (e) { if (queueable('ins:' + t) && netErr(e)) return enqueue('ins', 'ins:' + t, row); throw e; }
      },
      upsert: async function (t, row) { forgetFor(t); return chk(await sb.from(t).upsert(row).select(cols(t)).single()); },
      upd: async function (t, id, p) { forgetFor(t); return chk(await sb.from(t).update(p).eq('id', id).select(cols(t)).single()); },
      del: async function (t, id) { forgetFor(t); chk(await sb.from(t).delete().eq('id', id)); },
      upload: async function (bucket, file) {
        var ext = (file.name || '').split('.').pop() || 'jpg', path = UID + '/' + uuid() + '.' + ext.toLowerCase();
        /* the upload reports its progress (owner, 20 Nov 2026: "it takes a long time to upload a file or make or edit a post"): the button of the
           form shows «جارٍ الرفع 45٪» (event ish-upload); if this way fails, the normal upload is used */
        var sent = false;
        try {
          var tk = await token();
          await new Promise(function (ok, no) {
            var x = new XMLHttpRequest();
            x.open('POST', CFG.supabaseUrl + '/storage/v1/object/' + bucket + '/' + path.split('/').map(encodeURIComponent).join('/'));
            x.setRequestHeader('authorization', 'Bearer ' + (tk || CFG.supabaseAnonKey));
            x.setRequestHeader('apikey', CFG.supabaseAnonKey);
            x.setRequestHeader('x-upsert', 'false');
            if (file.type) x.setRequestHeader('content-type', file.type);
            x.upload.onprogress = function (e) { if (e.lengthComputable) window.dispatchEvent(new CustomEvent('ish-upload', { detail: { loaded: e.loaded, total: e.total } })); };
            x.onload = function () { if (x.status >= 200 && x.status < 300) { sent = true; ok(); } else no(new Error(x.responseText || ('upload ' + x.status))); };
            x.onerror = function () { no(new Error('network')); };
            x.send(file);
          });
        } catch (e) { if (/already exists|Duplicate/i.test(e.message || '')) sent = true; }
        if (!sent) chk(await sb.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type || undefined }));
        window.dispatchEvent(new CustomEvent('ish-upload', { detail: { done: true } })); return bucket === 'media' ? sb.storage.from('media').getPublicUrl(path).data.publicUrl : path;
      },
      /* the same address for the same file for 50 minutes, so the phone keeps the picture in its cache instead of downloading it again on every page */
      fileUrl: async function (bucket, path) { if (!path) return ''; if (/^(https?:|data:|blob:|img\/)/.test(path)) return path;
        var key = bucket + '/' + path, hit = SIGNED[key]; if (hit && hit.t > Date.now()) return hit.u;
        if (bucket === 'library') { var r2 = await libUrls([path]); if (r2 && r2[path]) { SIGNED[key] = { u: r2[path], t: Date.now() + 5 * 3600000 }; try { localStorage.setItem('ish-signed', JSON.stringify(SIGNED)); } catch (e) {} return r2[path]; } }
        var r = await sb.storage.from(bucket).createSignedUrl(path, 3600); if (!r.data) return '';
        SIGNED[key] = { u: r.data.signedUrl, t: Date.now() + 50 * 60000 }; try { localStorage.setItem('ish-signed', JSON.stringify(SIGNED)); } catch (e) {} return r.data.signedUrl; },
      videoUpload: async function (file, o) {
        var r = await fetch('api/video', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + await token() }, body: JSON.stringify({ act: 'create', lesson: o.lesson, title: o.title || file.name }) });
        if (!r.ok) throw new Error(await r.text()); var j = await r.json();
        await new Promise(function (ok, no) {
          var up = new window.tus.Upload(file, { endpoint: 'https://video.bunnycdn.com/tusupload', retryDelays: [0, 3000, 5000, 10000, 20000],
            headers: { AuthorizationSignature: j.signature, AuthorizationExpire: String(j.expire), VideoId: j.videoId, LibraryId: String(j.libraryId) },
            metadata: { filetype: file.type, title: o.title || file.name },
            onError: no, onProgress: function (a, b) { if (o.onProgress) o.onProgress(Math.round(a / b * 100)); }, onSuccess: ok });
          up.start();
        });
        return j.videoId;
      },
      videoFile: async function (lesson, q) { if (IS.extEmbed(lesson.video_id)) throw new Error('extlink'); var r = await fetch('api/video?lesson=' + encodeURIComponent(lesson.id) + '&dl=' + (q || 480), { headers: { authorization: 'Bearer ' + await token() } }); if (!r.ok) throw new Error(r.status === 501 ? 'nodl' : r.status === 403 ? 'denied' : 'net'); return (await r.json()).src; },
      videoPlay: async function (lesson) { var e = IS.extEmbed(lesson.video_id); if (e) return e; var r = await fetch('api/video?lesson=' + encodeURIComponent(lesson.id), { headers: { authorization: 'Bearer ' + await token() } }); if (!r.ok) return null; return r.json(); },
      /* audio lectures in Cloudflare R2 (functions/api/audio.js): the file goes to our own function, which saves it and marks the lesson */
      audioUpload: async function (file, o) {
        var t = await token();
        var j = await new Promise(function (ok, no) {
          var x = new XMLHttpRequest(); x.open('PUT', 'api/audio?lesson=' + encodeURIComponent(o.lesson));
          x.setRequestHeader('authorization', 'Bearer ' + t); x.setRequestHeader('content-type', file.type === 'audio/mp3' ? 'audio/mpeg' : file.type);
          x.upload.onprogress = function (e) { if (e.lengthComputable && o.onProgress) o.onProgress(Math.min(99, Math.round(e.loaded / e.total * 100))); };
          x.onload = function () { var r = {}; try { r = JSON.parse(x.responseText); } catch (e) {} if (x.status >= 200 && x.status < 300) ok(r); else no(new Error(x.status === 501 ? 'nostore' : x.status === 413 ? 'toobig' : x.status === 415 ? 'notaudio' : x.status === 403 ? 'denied' : 'net')); };
          x.onerror = function () { no(new Error('net')); }; x.send(file);
        });
        DB.forget && DB.forget(); if (o.onProgress) o.onProgress(100); return j.ref;
      },
      audioPlay: async function (lesson) { if (!/^au:/.test(lesson.video_id || '') && !(lesson.kind === 'audio' && lesson.has_video)) return null; var r = await fetch('api/audio?lesson=' + encodeURIComponent(lesson.id), { headers: { authorization: 'Bearer ' + await token() } }); if (!r.ok) { if (r.status === 501) throw new Error('nostore'); return null; } return r.json(); },
      audioRemove: async function (id) { var r = await fetch('api/audio?lesson=' + encodeURIComponent(id), { method: 'DELETE', headers: { authorization: 'Bearer ' + await token() } }); DB.forget && DB.forget(); return r.ok; },
      reset: function () {}
    };
    return api;
  })() : null;

  window.DB = Remote || Local;
  window.DB.digits = digits;
  window.DB.uuid = uuid;
})();
