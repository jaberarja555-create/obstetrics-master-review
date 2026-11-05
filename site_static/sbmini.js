/* tiny Supabase client (Google sign-in + rpc), same method as Master Note: no extra library */
window.OBS_SB=function(cfg,store){
  var base=(cfg.url||'').replace(/\/$/,''),key=cfg.anon,tok=null;
  function ls(v){try{if(v===undefined)return JSON.parse(localStorage.getItem(store)||'null');if(v===null)localStorage.removeItem(store);else localStorage.setItem(store,JSON.stringify(v))}catch(e){return null}}
  function email(a){try{var p=a.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');while(p.length%4)p+='=';return JSON.parse(decodeURIComponent(escape(atob(p)))).email||''}catch(e){return ''}}
  tok=ls();
  var q=new URLSearchParams(location.hash.slice(1));
  if(q.get('access_token')){tok={a:q.get('access_token'),r:q.get('refresh_token'),e:Date.now()+(+q.get('expires_in')||3600)*1000,m:email(q.get('access_token'))};ls(tok);try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}}
  function token(){if(!tok)return Promise.resolve(null);if(tok.e-60000>Date.now())return Promise.resolve(tok);
    return fetch(base+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:tok.r})})
      .then(function(r){if(r.status>=400&&r.status<500){tok=null;ls(null);return null}if(!r.ok)throw new Error('net');return r.json().then(function(d){tok={a:d.access_token,r:d.refresh_token,e:Date.now()+(d.expires_in||3600)*1000,m:email(d.access_token)};ls(tok);return tok})})}
  return {
    ready:!!(base&&key),
    user:function(){return token().then(function(t){return t?{email:t.m}:null})},
    signIn:function(back){location.href=base+'/auth/v1/authorize?provider=google&redirect_to='+encodeURIComponent(back||location.origin+location.pathname)},
    signOut:function(){tok=null;ls(null);return Promise.resolve()},
    rpcAnon:function(name,args){return fetch(base+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify(args||{})})
      .then(function(r){return r.text().then(function(x){if(!r.ok)return {error:{message:x||String(r.status)}};return {data:x?JSON.parse(x):null}})})},
    rpc:function(name,args){return token().then(function(t){if(!t)return {error:{message:'signed-out'}};
      return fetch(base+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+t.a,'Content-Type':'application/json'},body:JSON.stringify(args||{})})
        .then(function(r){return r.text().then(function(x){if(!r.ok)return {error:{message:x||String(r.status)}};return {data:x?JSON.parse(x):null}})})})}
  }};
