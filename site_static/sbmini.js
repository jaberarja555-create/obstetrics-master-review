/* tiny Supabase client (Google sign-in + rpc), same method as Master Note: no extra library */
window.OBS_SB=function(cfg,store){
  var base=(cfg.url||'').replace(/\/$/,''),key=cfg.anon,tok=null;
  function ls(v){try{if(v===undefined)return JSON.parse(localStorage.getItem(store)||'null');if(v===null)localStorage.removeItem(store);else localStorage.setItem(store,JSON.stringify(v))}catch(e){return null}}
  function email(a){try{var p=a.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');while(p.length%4)p+='=';return JSON.parse(decodeURIComponent(escape(atob(p)))).email||''}catch(e){return ''}}
  tok=ls();
  var q=new URLSearchParams(location.hash.slice(1));
  if(q.get('access_token')){tok={a:q.get('access_token'),r:q.get('refresh_token'),e:Date.now()+(+q.get('expires_in')||3600)*1000,m:email(q.get('access_token'))};ls(tok);try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}}
  /* one renewal at a time (owner, 13 Nov 2026: "each time I open, the sign-in screen appears"): when the hour-long access token had
     ended, every call that started together sent the SAME one-use refresh token; the server can take that as a stolen token and end the
     whole sign-in. Now the calls share one renewal, a renewal made by another tab is picked up from storage, and only a clear "this
     sign-in no longer exists" answer signs out; no connection, a busy server or too many requests keep the sign-in for the next try. */
  var busy=null;
  function token(){if(!tok)return Promise.resolve(null);if(tok.e-60000>Date.now())return Promise.resolve(tok);
    var cur=ls();if(cur&&cur.r&&cur.e-60000>Date.now()){tok=cur;return Promise.resolve(tok)}
    if(busy)return busy;var r0=tok.r;
    busy=fetch(base+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:r0})})
      .then(function(r){
        if(r.ok)return r.json().then(function(d){tok={a:d.access_token,r:d.refresh_token,e:Date.now()+(d.expires_in||3600)*1000,m:email(d.access_token)};ls(tok);return tok});
        var c2=ls();if(c2&&c2.r&&c2.r!==r0){tok=c2;return tok}
        if((r.status===400||r.status===401||r.status===403)){tok=null;ls(null);return null}
        throw new Error('net')})
      .then(function(t){busy=null;return t},function(e){busy=null;throw e});
    return busy}
  return {
    ready:!!(base&&key),
    has:function(){return !!tok},
    user:function(){return token().then(function(t){return t?{email:t.m}:null})},
    signIn:function(back){location.href=base+'/auth/v1/authorize?provider=google&redirect_to='+encodeURIComponent(back||location.origin+location.pathname)},
    signOut:function(){tok=null;ls(null);return Promise.resolve()},
    rpcAnon:function(name,args){return fetch(base+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify(args||{})})
      .then(function(r){return r.text().then(function(x){if(!r.ok)return {error:{message:x||String(r.status)}};return {data:x?JSON.parse(x):null}})})},
    rpc:function(name,args){return token().then(function(t){if(!t)return {error:{message:'signed-out'}};
      return fetch(base+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+t.a,'Content-Type':'application/json'},body:JSON.stringify(args||{})})
        .then(function(r){return r.text().then(function(x){if(!r.ok)return {error:{message:x||String(r.status)}};return {data:x?JSON.parse(x):null}})})})}
  }};
