/* No more step-by-step waiting when a page opens (owner, 22 Nov 2026: "look for any such delay in the app, I don't want to find them one by
   one"). Many pages ask the server one thing, wait, then ask the next (a lecturer's page asked ten things in a row). This file remembers which
   reads (DB.q / DB.one) each KIND of page made (lecturer/:0, post/:0, course/:0/…, control-students …) and, the next time a page of that kind
   opens (any lecturer, any post), asks for all of them at once as the page starts. The page's own reads then find their answer already on
   the way, so a page waits about one trip instead of several. Only reads are repeated (never writes); a read that names an id the address
   does not carry (found halfway, e.g. the course of a post) is not remembered, and an unused early answer is dropped after 6 s.
   Kept per phone in localStorage `ish-pf` (150 kinds × 30 reads, about 100 KB). Loads last (after the other files have wrapped IS.route / IS.onRoute). */
(function () {
  'use strict';
  if (!window.DB || !window.IS || !IS.route) return;
  var UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, KEY = 'ish-pf', MAXK = 150, MAXR = 30, TTL = 6000;
  var LEARN = {}; try { LEARN = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { LEARN = {}; }
  var EARLY = new Map(), REC = null, saveT = 0;
  var q0 = DB.q, one0 = DB.one, orig = { q: q0, one: one0 };
  function me() { return (IS.ME && IS.ME.id) || (DB.uid && DB.uid()) || ''; }
  function keyOf(m, args) { try { return JSON.stringify([m, Array.prototype.slice.call(args)]); } catch (e) { return ''; } }
  /* the read as it would be asked; an early answer waiting for it is handed over once (a copy, so nothing is shared between callers) */
  function wrap(m) {
    return function () {
      var k = keyOf(m, arguments);
      if (k) {
        if (REC) REC.add(k);
        var e = EARLY.get(k);
        if (e) { EARLY.delete(k); if (Date.now() - e.t < TTL) return e.p.then(function (v) { try { return v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v; } catch (x) { return v; } }); }
      }
      return orig[m].apply(DB, arguments);
    };
  }
  DB.q = wrap('q'); DB.one = wrap('one');

  /* the kind of page: its name and address with every id written as :0, :1 … */
  function shape(hash) {
    var h = decodeURIComponent(String(hash || '').replace(/^#/, '')) || 'home', ids = [];
    var pat = h.replace(UUID, function (u) { var i = ids.indexOf(u.toLowerCase()); if (i < 0) { ids.push(u.toLowerCase()); i = ids.length - 1; } return ':' + i; });
    return { pat: pat, ids: ids };
  }
  /* a read is remembered only when every id in it is one of the address's ids or the account's own */
  function general(k, ids, uid) {
    var ok = true, out = k.replace(UUID, function (u) { u = u.toLowerCase(); var i = ids.indexOf(u); if (i >= 0) return ':' + i; if (uid && u === uid.toLowerCase()) return ':me'; ok = false; return u; });
    return ok ? out : null;
  }
  function fire(sh) {
    var list = LEARN[sh.pat]; if (!list || !list.length) return;
    var uid = me(), now = Date.now();
    list.forEach(function (g) {
      if (/:me/.test(g) && !uid) return;
      var k = g.replace(/:(\d+|me)\b/g, function (x, n) { return n === 'me' ? uid : (sh.ids[+n] || x); });
      if (/:\d+\b/.test(k) || EARLY.has(k)) return;
      var a; try { a = JSON.parse(k); } catch (e) { return; }
      if (!orig[a[0]]) return;
      var p; try { p = Promise.resolve(orig[a[0]].apply(DB, a[1])); } catch (e) { return; }
      p.catch(function () {});
      EARLY.set(k, { p: p, t: now });
    });
    setTimeout(function () { var t = Date.now(); EARLY.forEach(function (e, k) { if (t - e.t >= TTL) EARLY.delete(k); }); }, TTL + 50);
  }
  function learn(sh, set) {
    var uid = me(), seen = {}, out = [];
    set.forEach(function (k) { var g = general(k, sh.ids, uid); if (g && !seen[g]) { seen[g] = 1; out.push(g); } });
    if (!out.length) return;
    LEARN[sh.pat] = out.slice(0, MAXR); LEARN[sh.pat].u = Date.now();
    var kinds = Object.keys(LEARN);
    if (kinds.length > MAXK) kinds.sort(function (a, b) { return (LEARN[a].u || 0) - (LEARN[b].u || 0); }).slice(0, kinds.length - MAXK).forEach(function (k) { delete LEARN[k]; });
    clearTimeout(saveT); saveT = setTimeout(function () {
      try { var o = {}; Object.keys(LEARN).forEach(function (k) { o[k] = LEARN[k].slice(); }); localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
    }, 1200);
  }
  var route0 = IS.route;
  IS.route = function () {
    var sh = shape(location.hash);
    fire(sh);
    var set = new Set(), mine = { set: set }; REC = set; IS.route.cur = mine;
    var r = route0.apply(this, arguments);
    Promise.resolve(r).then(function () { if (IS.route.cur === mine) { REC = null; learn(sh, set); } }, function () { if (IS.route.cur === mine) REC = null; });
    return r;
  };
  /* sign-out removes `ish-pf` (core.js IS.ACT.logout) */
})();
