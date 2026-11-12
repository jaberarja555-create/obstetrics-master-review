/* Offline copy and fast opening (owner, 12 Nov 2026: "all needed files downloaded from the first time, then the app opens fast and
   smoothly"; the same file in the three books). At the first opening every file of the book is saved on the device. After that the book
   opens from the saved copy at once, and the newest copy is fetched in the background for the next opening. A new version of the book
   has a new cache name, so it is saved whole and replaces the old one. */
var C='orr-0',ASSETS=[];
var SKIP=/^\/(check|activate|sync|release|trial|api\/|admin|audio\/|video\/)|^\/img$/;   // server calls and media, never saved
self.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){
  /* one file at a time in small groups, and a missing file does not stop the rest */
  var list=ASSETS.slice(),n=0;function more(){var part=list.splice(0,6);if(!part.length)return Promise.resolve();
    return Promise.all(part.map(function(u){return fetch(u,{cache:'no-cache'}).then(function(r){if(r.ok)return c.put(u,r)}).catch(function(){})})).then(more)}
  return more()}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==C&&/^(orr|prr|srr)-/.test(k)}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){var r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||r.headers.has('range')||r.destination==='video'||r.destination==='audio')return;
  if(u.origin!==location.origin||SKIP.test(u.pathname))return;
  if(r.mode==='navigate'||/\/(index\.html)?$/.test(u.pathname)){   // the book itself: saved copy now, newest copy saved for the next opening
    var net=fetch(r).then(function(res){if(res&&res.ok){var cp=res.clone();return caches.open(C).then(function(c){return c.put('./',cp)}).then(function(){return res})}return res});
    e.waitUntil(net.then(function(){},function(){}));
    e.respondWith(caches.match('./').then(function(m){return m||net}).catch(function(){return caches.match('./')}));return}
  e.respondWith(caches.match(r).then(function(m){return m||fetch(r).then(function(res){if(res&&res.ok){var cp=res.clone();caches.open(C).then(function(c){c.put(r,cp)})}return res})}))});   // pictures, fonts, files: from the device
