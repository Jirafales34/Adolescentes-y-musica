// ===== Comun a todas las paginas =====
(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }

  // ---- contador de visitas y caritas de animo ----
  function initComun(){
    var c=$('contador');
    if(c){
      var n=1000;
      try{ n=(parseInt(localStorage.getItem('visitas'),10)||1000)+1; localStorage.setItem('visitas',n); }catch(e){}
      var s=String(n).padStart(6,'0');
      c.innerHTML=s.split('').map(function(d){ return '<span>'+d+'</span>'; }).join('');
    }
    document.querySelectorAll('.humor button').forEach(function(b){
      b.addEventListener('click',function(){
        var m=$('humor-msg'); if(m) m.textContent=b.dataset.t;
        var e=$('estado-top'); if(e) e.textContent=b.dataset.e;
      });
    });
  }

  // ---- "Ahora suena": reproductor persistente ----
  var KEY='ahora-suena', actual=null, dock=null, iframe=null;
  try{
    var g=JSON.parse(localStorage.getItem(KEY)||'null');
    if(g && /^[A-Za-z0-9]{22}$/.test(g.id)) actual={id:g.id,nombre:String(g.nombre||'Playlist').slice(0,60)};
  }catch(e){}

  function asegurarDock(){
    if(dock) return dock;
    dock=document.createElement('div'); dock.id='as-dock';
    document.body.appendChild(dock);
    return dock;
  }
  function pintarIframe(){
    asegurarDock();
    if(!actual){ if(iframe){ iframe.remove(); iframe=null; } return; }
    var src='https://open.spotify.com/embed/playlist/'+actual.id+'?utm_source=generator';
    if(!iframe){
      iframe=document.createElement('iframe');
      iframe.setAttribute('allow','autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture');
      iframe.setAttribute('frameborder','0');
      iframe.allowFullscreen=true;
      dock.appendChild(iframe);
    }
    if(iframe.getAttribute('src')!==src){
      iframe.setAttribute('src',src);
      iframe.title='Reproductor de Spotify: '+actual.nombre;
    }
  }
  function pintarCaja(){
    var slot=$('as-slot'); if(!slot) return;
    var tit=$('as-titulo'), ayuda=$('as-ayuda'), q=$('as-quitar');
    if(actual){
      slot.hidden=false; tit.textContent='▶ Sonando: '+actual.nombre;
      ayuda.hidden=true; q.hidden=false;
    }else{
      slot.hidden=true; tit.textContent='▶ Mi playlist de hoy';
      ayuda.hidden=false; q.hidden=true;
    }
    q.onclick=function(){ API.quitar(); };
  }
  function colocar(){
    if(!dock) return;
    var slot=$('as-slot');
    if(!actual || !slot || slot.hidden){ dock.style.display='none'; return; }
    var r=slot.getBoundingClientRect();
    dock.style.display='block';
    dock.style.left=(r.left+window.pageXOffset)+'px';
    dock.style.top=(r.top+window.pageYOffset)+'px';
    dock.style.width=r.width+'px';
    dock.style.height=r.height+'px';
  }
  function render(){ pintarIframe(); pintarCaja(); colocar(); }

  var API={
    set:function(id,nombre){
      if(!/^[A-Za-z0-9]{22}$/.test(id||'')) return;
      actual={id:id,nombre:String(nombre||'Playlist').slice(0,60)};
      try{ localStorage.setItem(KEY,JSON.stringify(actual)); }catch(e){}
      render();
    },
    quitar:function(){
      actual=null;
      try{ localStorage.removeItem(KEY); }catch(e){}
      render();
      document.dispatchEvent(new CustomEvent('ahorasuena'));
    },
    actual:function(){ return actual; },
    mostrar:function(){
      var box=$('ahora-suena'); if(!box) return;
      var r=box.getBoundingClientRect();
      if(r.top<0 || r.bottom>window.innerHeight){ box.scrollIntoView({behavior:'smooth',block:'center'}); }
      box.classList.add('pulso'); setTimeout(function(){ box.classList.remove('pulso'); },1600);
    }
  };
  window.AhoraSuena=API;

  // ---- navegacion sin recargar (mantiene el reproductor sonando) ----
  var ruta=location.pathname;
  function aplicar(doc,url,push){
    var nuevo=doc.getElementById('pagina'), act=$('pagina');
    if(!nuevo||!act) throw new Error('sin pagina');
    document.querySelectorAll('script[data-soft]').forEach(function(s){ s.remove(); });
    var codigos=[];
    doc.body.querySelectorAll('script').forEach(function(s){ if(!s.getAttribute('src')) codigos.push(s.textContent); });
    act.innerHTML=nuevo.innerHTML;
    document.title=doc.title;
    if(push) history.pushState(null,'',url);
    ruta=new URL(url,location.href).pathname;
    initComun();
    render();
    codigos.forEach(function(t){
      var s=document.createElement('script'); s.setAttribute('data-soft','1'); s.textContent=t;
      document.body.appendChild(s);
    });
    var h=new URL(url,location.href).hash, dest=h?document.getElementById(decodeURIComponent(h.slice(1))):null;
    if(dest) dest.scrollIntoView(); else window.scrollTo(0,0);
    colocar();
  }
  function ir(url,push){
    fetch(url).then(function(r){ if(!r.ok) throw new Error('http'); return r.text(); })
      .then(function(html){ aplicar(new DOMParser().parseFromString(html,'text/html'),url,push); })
      .catch(function(){ location.href=url; });
  }
  if(location.protocol!=='file:' && window.fetch && window.DOMParser){
    document.addEventListener('click',function(e){
      if(e.defaultPrevented || e.button!==0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a=e.target.closest&&e.target.closest('a[href]'); if(!a) return;
      if(a.target && a.target!=='_self') return;
      if(a.hasAttribute('download')) return;
      var u=new URL(a.href,location.href);
      if(u.origin!==location.origin) return;
      if(!/\.html$/.test(u.pathname) && !/\/$/.test(u.pathname)) return;
      if(u.pathname===location.pathname){
        if(u.hash) return;
        e.preventDefault(); window.scrollTo(0,0); return;
      }
      e.preventDefault(); ir(u.href,true);
    });
    window.addEventListener('popstate',function(){
      if(location.pathname!==ruta) ir(location.href,false);
    });
  }

  window.addEventListener('resize',colocar);
  window.addEventListener('load',colocar);
  if(window.ResizeObserver) new ResizeObserver(colocar).observe(document.body);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(colocar);

  initComun();
  render();
})();
