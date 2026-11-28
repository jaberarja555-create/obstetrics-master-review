/* SMRA Permanent Exam — offline shell. Bump C when files change. */
var C='ex-v13';
var FILES=['./','index.html','css/exam.css','js/data.sample.js','js/data.enc','js/app.js','fonts/poppins-latin-600-normal.woff2','fonts/poppins-latin-700-normal.woff2','fonts/inter-latin-400.woff2','fonts/inter-latin-500.woff2','fonts/inter-latin-600.woff2','img/steth.webp','img/logo-smra.webp','manifest.webmanifest','img/ex-192.png','img/ex-512.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){return c.addAll(FILES).catch(function(){});}).then(function(){return self.skipWaiting();}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return /^ex-v/.test(x)&&x!==C;}).map(function(x){return caches.delete(x);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener('fetch',function(e){if(e.request.method!=='GET')return;var u=new URL(e.request.url);if(u.origin!==location.origin||u.pathname.indexOf('/exam/')<0)return;
 e.respondWith(caches.open(C).then(function(c){var net=fetch(e.request).then(function(r){if(r.ok)c.put(e.request,r.clone());return r;});
 var late=new Promise(function(res){setTimeout(function(){c.match(e.request,{ignoreSearch:true}).then(function(h){if(h)res(h);});},3000);});
 return Promise.race([net,late]).catch(function(){return c.match(e.request,{ignoreSearch:true}).then(function(h){return h||Response.error();});});}));});
