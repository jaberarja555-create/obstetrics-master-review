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
      { id: 'local', ar: 'الامتحانات المحلية', en: 'Local Exam', icon: 'sudan', tone: 'gold', sort: 3 },
      { id: 'special', ar: 'الاختبارات الخاصة', en: 'Special Exams', icon: 'exam', tone: 'rose', sort: 4 },
      { id: 'house', ar: 'طبيب الامتياز', en: 'House Officer', icon: 'house', tone: 'violet', sort: 5 }],
    subjects: [
      ['anatomy', 'basics', 'التشريح', 'Anatomy', 's_anatomy'], ['physiology', 'basics', 'الفسيولوجيا', 'Physiology', 's_physiology'], ['biochemistry', 'basics', 'الكيمياء الحيوية', 'Biochemistry', 's_biochem'],
      ['pathology', 'basics', 'علم الأمراض', 'Pathology', 's_pathology'], ['microbiology', 'basics', 'الأحياء الدقيقة', 'Microbiology', 's_micro'], ['pharmacology', 'basics', 'علم الأدوية', 'Pharmacology', 's_pharma'],
      ['community', 'basics', 'طب المجتمع', 'Community Medicine', 's_community'], ['medicine', 'clinical', 'الباطنية', 'Internal Medicine', 's_heart'], ['surgery', 'clinical', 'الجراحة', 'Surgery', 's_scalpel'],
      ['pediatrics', 'clinical', 'طب الأطفال', 'Pediatrics', 's_baby'], ['obgyn', 'clinical', 'النساء والتوليد', 'Obstetrics & Gynecology', 's_obgyn'], ['psychiatry', 'clinical', 'الطب النفسي', 'Psychiatry', 's_brain'],
      ['smc', 'local', 'امتحان المجلس الطبي السوداني', 'Sudan Medical Council', 'sudan'], ['finals', 'local', 'الامتحانات الجامعية', 'University finals', 'exam'],
      ['usmle', 'special', 'USMLE', 'USMLE', 'world'], ['plab', 'special', 'PLAB', 'PLAB', 'world'], ['mrcp', 'special', 'MRCP / MRCS', 'MRCP / MRCS', 'world'],
      ['ho-skills', 'house', 'مهارات الامتياز', 'House officer skills', 'house']
    ].map(function (r, i) { return { id: r[0], cat: r[1], ar: r[2], en: r[3], icon: r[4], sort: i }; }),
    settings: [
      { id: 'bankak_account', value: '4674587' }, { id: 'bankak_name', value: 'سعاد عبدالكريم' }, { id: 'whatsapp', value: '249116984258' },
      { id: 'currency', value: 'SDG' }, { id: 'default_share', value: '70' }]
  };

  /* ================= PREVIEW backend ================= */
  var Local = (function () {
    var K = 'ish-db', DB;
    function load() { try { DB = JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) { DB = null; }
      if (!DB) { DB = {}; Object.keys(SEED).forEach(function (t) { DB[t] = SEED[t].map(function (r) { return Object.assign({}, r); }); }); save(); } }
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
      signOut: async function () { localStorage.removeItem('ish-session'); fire(); },
      setPassword: async function (uid, pass) { var us = users(), u = us.filter(function (x) { return x.id === uid; })[0]; if (!u || !u.phone) throw new Error('nophone'); u.hash = await sha(u.phone + ':' + pass); setUsers(us); },
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
      videoPlay: async function (lesson) { var u = await this.fileUrl('video', lesson.video_id); return u ? { kind: 'video', src: u } : null; },
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
    async function token() { var s = (await sb.auth.getSession()).data.session; return s ? s.access_token : ''; }
    return {
      live: true, sb: sb,
      uid: function () { return UID; },
      ready: sb.auth.getSession(),
      onAuth: function (f) { listeners.push(f); },
      signUp: async function (o) { var r = await sb.auth.signUp({ email: phoneMail(o.phone), password: o.pass, options: { data: { name: o.name, phone: digits(o.phone), contact_email: o.email || '' } } }); if (r.error) throw new Error(/registered/i.test(r.error.message) ? 'exists' : r.error.message); return r.data.user && r.data.user.id; },
      signIn: async function (o) { var r = await sb.auth.signInWithPassword({ email: phoneMail(o.phone), password: o.pass }); if (r.error) throw new Error('bad'); return r.data.user.id; },
      google: async function () { await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } }); return null; },
      signOut: async function () { await sb.auth.signOut(); },
      setPassword: async function (uid, pass) { var r = await fetch('api/admin', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + await token() }, body: JSON.stringify({ act: 'password', uid: uid, pass: pass }) }); if (!r.ok) throw new Error(await r.text()); },
      q: async function (t, f) {
        f = f || {}; var x = sb.from(t).select(f.select || cols(t));
        if (f.eq) Object.keys(f.eq).forEach(function (k) { if (f.eq[k] !== undefined) x = f.eq[k] === null ? x.is(k, null) : x.eq(k, f.eq[k]); });
        if (f.in) Object.keys(f.in).forEach(function (k) { x = x.in(k, f.in[k]); });
        if (f.neq) Object.keys(f.neq).forEach(function (k) { x = x.neq(k, f.neq[k]); });
        if (f.order) x = x.order(f.order[0], { ascending: f.order[1] !== false });
        if (f.limit) x = x.limit(f.limit);
        return chk(await x) || [];
      },
      one: async function (t, id) { return chk(await sb.from(t).select(cols(t)).eq('id', id).maybeSingle()); },
      lesson: async function (id) { return chk(await sb.rpc('ish_lesson', { p_id: id })); },
      ins: async function (t, row) { return chk(await sb.from(t).insert(row).select(cols(t)).single()); },
      upsert: async function (t, row) { return chk(await sb.from(t).upsert(row).select(cols(t)).single()); },
      upd: async function (t, id, p) { return chk(await sb.from(t).update(p).eq('id', id).select(cols(t)).single()); },
      del: async function (t, id) { chk(await sb.from(t).delete().eq('id', id)); },
      upload: async function (bucket, file) {
        var ext = (file.name || '').split('.').pop() || 'jpg', path = UID + '/' + uuid() + '.' + ext.toLowerCase();
        chk(await sb.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type || undefined })); return bucket === 'media' ? sb.storage.from('media').getPublicUrl(path).data.publicUrl : path;
      },
      fileUrl: async function (bucket, path) { if (!path) return ''; if (/^(https?:|data:|blob:|img\/)/.test(path)) return path; var r = await sb.storage.from(bucket).createSignedUrl(path, 600); return r.data ? r.data.signedUrl : ''; },
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
      videoPlay: async function (lesson) { var r = await fetch('api/video?lesson=' + encodeURIComponent(lesson.id), { headers: { authorization: 'Bearer ' + await token() } }); if (!r.ok) return null; return r.json(); },
      reset: function () {}
    };
  })() : null;

  window.DB = Remote || Local;
  window.DB.digits = digits;
  window.DB.uuid = uuid;
})();
