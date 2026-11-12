/* Offline copy, fast opening and quick updates (owner, 12 Nov 2026; the same file in the three books).
   - First opening: the book's page and its small files are saved at once; the pictures are saved in the background (and whenever shown).
   - Every opening with internet: the page is asked from the internet first (up to 3 s), so a new version shows at once; with no or slow
     internet the saved copy opens. Pictures and fonts always come from the device.
   - A new version (new cache name) copies the pictures already saved from the older copy (no download again), saves only the new page, then
     reloads every open page of the book, also pages still running an older copy. */
var C='orr-0',ASSETS=[];
var SKIP=/^\/(check|activate|sync|release|trial|api\/|admin|audio\/|video\/)|^\/img$/;   // server calls and media, never saved
function fill(c,list){var n=0;function more(){var part=list.splice(0,6);if(!part.length)return Promise.resolve();
  return Promise.all(part.map(function(u){return c.match(u).then(function(m){if(m)return;return fetch(u,{cache:'no-cache'}).then(function(r){if(r.ok)return c.put(u,r)}).catch(function(){})})})).then(more)}return more()}
self.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){
  var small=ASSETS.filter(function(u){return !/^img\//.test(u)});   // the page, scripts, fonts: needed to open; pictures come after
  return caches.keys().then(function(ks){var old=ks.filter(function(k){return k!==C&&/^(orr|prr|srr)-/.test(k)&&!/-audio$/.test(k)});
    /* pictures already on the device from an older copy are copied, not downloaded again */
    return Promise.all(old.map(function(k){return caches.open(k).then(function(o){return o.keys().then(function(rs){return Promise.all(rs.map(function(r){
      if(!/\/img\//.test(r.url))return;return o.match(r).then(function(m){if(m)return c.put(r,m)})}))})})}))}).then(function(){
    return Promise.all(small.map(function(u){return fetch(u,{cache:'no-cache'}).then(function(r){if(r.ok)return c.put(u,r)}).catch(function(){})}))})}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){var old=ks.filter(function(k){return k!==C&&/^(orr|prr|srr)-/.test(k)&&!/-audio$/.test(k)});
  return Promise.all(old.map(function(k){return caches.delete(k)})).then(function(){return self.clients.claim()}).then(function(){
    caches.open(C).then(function(c){fill(c,ASSETS.filter(function(u){return /^img\//.test(u)}))});   // the remaining pictures, in the background
    if(!old.length)return;return self.clients.matchAll({type:'window'}).then(function(cs){cs.forEach(function(c){try{c.navigate(c.url)}catch(er){}})})})}))});
self.addEventListener('fetch',function(e){var r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||r.headers.has('range')||r.destination==='video'||r.destination==='audio')return;
  if(u.origin!==location.origin||SKIP.test(u.pathname))return;
  if(r.mode==='navigate'||/\/(index\.html)?$/.test(u.pathname)){   // the book itself: newest from the internet when it answers within 3 s
    var net=fetch(r,{cache:'no-cache'}).then(function(res){if(res&&res.ok){var cp=res.clone();caches.open(C).then(function(c){c.put('./',cp)})}return res});
    e.waitUntil(net.then(function(){},function(){}));
    e.respondWith(new Promise(function(done){var t=setTimeout(function(){caches.match('./').then(function(m){if(m)done(m)})},3000);
      net.then(function(res){clearTimeout(t);done(res)},function(){clearTimeout(t);caches.match('./').then(function(m){done(m||Response.error())})})}));return}
  e.respondWith(caches.match(r).then(function(m){return m||fetch(r).then(function(res){if(res&&res.ok){var cp=res.clone();caches.open(C).then(function(c){c.put(r,cp)})}return res})}))});
