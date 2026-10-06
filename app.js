const map=L.map('map').setView([43.25,43.0],9);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'&copy; OpenStreetMap'}).addTo(map);
const layers={},markers={};let sel=null,fc='Все',ft='Все';
const panel=document.getElementById('panel');
function pin(c){return L.divIcon({html:'<div class="pin" style="background:'+c+'"></div>',className:'',iconSize:[14,14]})}
function big(k){const p=POINTS[k];return L.marker(p.c,{icon:L.divIcon({html:'<div class="star">'+p.n+'</div>',className:'',iconAnchor:[0,0]}),zIndexOffset:900}).addTo(map).on('click',()=>show(k))}
big('nalchik');big('elbrus');
async function photo(k,el){const p=POINTS[k];if(!p.w){return}
 try{const r=await fetch('https://ru.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(p.w));const j=await r.json();
 if(j.thumbnail){el.outerHTML='<img src="'+j.thumbnail.source+'" alt="'+p.n+'">'}}catch(e){}}
function show(k){const p=POINTS[k];panel.hidden=false;
 panel.innerHTML='<button class="x">x</button><div class="ph" id="ph">'+p.n+'</div><div class="b"><h2>'+p.n+'</h2><p>'+p.t+'</p><small>Источники: '+p.s.join(', ')+'</small></div>';
 panel.querySelector('.x').onclick=()=>panel.hidden=true;photo(k,document.getElementById('ph'));}
function draw(r){const col=COLORS[r.type],ll=r.pts.map(k=>POINTS[k].c);
 const g=L.layerGroup([L.polyline(ll,{color:col,weight:4,dashArray:r.type=='car'?null:'8 6'})]);
 new Set(r.pts).forEach(k=>g.addLayer(L.marker(POINTS[k].c,{icon:pin(col)}).on('click',()=>show(k)).bindTooltip(POINTS[k].n)));
 return g}
ROUTES.forEach(r=>layers[r.id]=draw(r));
function pick(id){if(sel)map.removeLayer(layers[sel]);sel=id;const r=ROUTES.find(x=>x.id==id);layers[id].addTo(map);
 map.fitBounds(L.latLngBounds(r.pts.map(k=>POINTS[k].c)),{padding:[60,60]});render()}
function render(){const f=document.getElementById('filters');
 const mk=(a,cur,fn)=>a.map(v=>'<button class="chip '+(v==cur?'on':'')+'" data-v="'+v+'">'+v+'</button>').join('');
 f.innerHTML=mk(['Все','Безенги','Джилы-Су','Терскол'],fc)+'<br>'+mk(['Все','Поход','Прогулка','Автомобиль'],ft);
 const bs=f.querySelectorAll('.chip');bs.forEach((b,i)=>b.onclick=()=>{if(i<4)fc=b.dataset.v;else ft=b.dataset.v;render()});
 const list=ROUTES.filter(r=>(fc=='Все'||r.cl==fc)&&(ft=='Все'||TYPES[r.type]==ft));
 document.getElementById('routes').innerHTML=list.map(r=>'<div class="card '+(r.id==sel?'sel':'')+'" style="border-left-color:'+COLORS[r.type]+'" data-id="'+r.id+'"><h3>'+r.name+'</h3><div class="meta"><span class="tag" style="background:'+COLORS[r.type]+'">'+TYPES[r.type]+'</span>'+r.cl+' | '+r.dur+'</div><div class="meta">Уровень: '+r.lvl+'</div><p>'+r.d+'</p></div>').join('');
 document.querySelectorAll('.card').forEach(c=>c.onclick=()=>pick(c.dataset.id))}
render();
document.getElementById('elbrus-info').innerHTML='<h3>Как добраться до Эльбруса</h3><ul>'+ELBRUS_WAYS.map(w=>'<li>'+w+'</li>').join('')+'</ul>';
document.getElementById('srcList').innerHTML=SOURCES.map(s=>'<li>'+s+'</li>').join('');
