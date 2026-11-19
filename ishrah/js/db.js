/* Medical Nerds: the data layer. One small set of calls used by every page, with two backends:
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
      reset: function () { localStorage.removeItem(K); localStorage.removeItem('ish-users'); localStorage.removeItem('ish-session'); indexedDB.deleteDatabase('ish-files'); }
    };
  })();

  /* ================= SUPABASE backend ================= */
  var Remote = LIVE ? (function () {
    var sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
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
      return entry && entry.expires > Date.now() ? entry.url : '';
    }
    function keepCovers() {
      var entries = Object.entries(covers).filter(function (entry) { return entry[1].expires > Date.now(); });
      entries.sort(function (a, b) { return b[1].expires - a[1].expires; });
      covers = Object.fromEntries(entries.slice(0, 350));
      try { localStorage.setItem(COVER_CACHE, JSON.stringify(covers)); } catch (error) {}
    }
    async function libraryCoverUrls(paths) {
      var account = UID || 'visitor';
      var unique = Array.from(new Set(paths));
      var missing = unique.filter(function (path) { return !cachedCover(account, path) && !coverRequests.has(coverKey(account, path)); });
      if (missing.length) {
        var batch = (async function () {
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
    function forget() { READS.clear(); }
    function cached(key, run) {
      var k = JSON.stringify(key), hit = READS.get(k);
      function copy(v) { return Array.isArray(v) ? v.map(function (x) { return x && typeof x === 'object' ? Object.assign({}, x) : x; }) : v && typeof v === 'object' ? Object.assign({}, v) : v; }
      if (hit && Date.now() - hit.t < 45000) return hit.p.then(copy);
      var p = run();
      var entry = { t: Date.now(), p: p };
      READS.delete(k);
      READS.set(k, entry);
      if (READS.size > 300) READS.delete(READS.keys().next().value);
      p.catch(function () { if (READS.get(k) === entry) READS.delete(k); });
      return p.then(copy);
    }
    function rawQ(t, f) { return api._q(t, f); }
    var rpc0 = sb.rpc.bind(sb);
    var readOnlyRpc = new Set(['ish_lesson', 'ish_presence', 'ish_team_seen',
      'ish_public_course_terms', 'ish_series_scores', 'ish_available_course_seats', 'ish_team_public']);
    sb.rpc = function (name) {
      if (!readOnlyRpc.has(name) && name !== 'ish_seen') forget();
      return rpc0.apply(null, arguments);
    };
    sb.auth.onAuthStateChange(function () { forget(); });
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
      q: async function (t, f) { return cached(['q', t, f || {}], function () { return rawQ(t, f); }); },
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
      ins: async function (t, row) { forget(); return chk(await sb.from(t).insert(row).select(cols(t)).single()); },
      upsert: async function (t, row) { forget(); return chk(await sb.from(t).upsert(row).select(cols(t)).single()); },
      upd: async function (t, id, p) { forget(); return chk(await sb.from(t).update(p).eq('id', id).select(cols(t)).single()); },
      del: async function (t, id) { forget(); chk(await sb.from(t).delete().eq('id', id)); },
      upload: async function (bucket, file) {
        var ext = (file.name || '').split('.').pop() || 'jpg', path = UID + '/' + uuid() + '.' + ext.toLowerCase();
        chk(await sb.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type || undefined })); return bucket === 'media' ? sb.storage.from('media').getPublicUrl(path).data.publicUrl : path;
      },
      /* the same address for the same file for 50 minutes, so the phone keeps the picture in its cache instead of downloading it again on every page */
      fileUrl: async function (bucket, path) { if (!path) return ''; if (/^(https?:|data:|blob:|img\/)/.test(path)) return path;
        var key = bucket + '/' + path, hit = SIGNED[key]; if (hit && hit.t > Date.now()) return hit.u;
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
      reset: function () {}
    };
    return api;
  })() : null;

  window.DB = Remote || Local;
  window.DB.digits = digits;
  window.DB.uuid = uuid;
})();
