const map=L.map('map').setView([43.25,43.0],9);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'&copy; OpenStreetMap'}).addTo(map);
const panel=document.getElementById('panel'),cache={},rcache={};let layer=null,sel=null,fc='Все',ft='Все';
function pin(c){return L.divIcon({html:'<div class="pin" style="background:'+c+'"></div>',className:'',iconSize:[14,14]})}
['nalchik','elbrus'].forEach(k=>{const p=POINTS[k];L.marker(p.c,{icon:L.divIcon({html:'<div class="star">'+p.n+'</div>',className:''}),zIndexOffset:900}).addTo(map).on('click',()=>show(k))});
async function commons(q){
 const u='https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=8&gsrsearch='+encodeURIComponent(q)+'&prop=imageinfo&iiprop=url|mime&iiurlwidth=640';
 const j=await (await fetch(u)).json();if(!j.query)return null;
 const a=Object.values(j.query.pages).map(p=>p.imageinfo&&p.imageinfo[0]).filter(i=>i&&i.mime=='image/jpeg'&&i.thumburl);
 return a[0]||null}
async function getPhoto(k){if(cache[k])return cache[k];
 let r=null;try{r=await commons(POINTS[k].q)||await commons('Kabardino-Balkaria mountains')}catch(e){}
 return cache[k]=r}
function show(k){const p=POINTS[k];panel.hidden=false;
 panel.innerHTML='<button class="x">x</button><div class="ph" id="ph">'+p.n+'</div><div class="b"><h2>'+p.n+'</h2><p>'+p.t+'</p></div><div class="cr" id="cr"></div>';
 panel.querySelector('.x').onclick=()=>panel.hidden=true;
 getPhoto(k).then(i=>{if(!i||panel.querySelector('h2').textContent!=p.n)return;
  document.getElementById('ph').outerHTML='<img src="'+i.thumburl+'" alt="'+p.n+'">';
  document.getElementById('cr').innerHTML='Фото: <a href="'+i.descriptionurl+'" target="_blank">Wikimedia Commons</a>'})}
function arc(a,b){const m=[(a[0]+b[0])/2,(a[1]+b[1])/2],dx=b[1]-a[1],dy=b[0]-a[0],o=0.12,pts=[];
 const c=[m[0]+dx*o,m[1]-dy*o];for(let t=0;t<=1;t+=0.1)pts.push([(1-t)*(1-t)*a[0]+2*t*(1-t)*c[0]+t*t*b[0],(1-t)*(1-t)*a[1]+2*t*(1-t)*c[1]+t*t*b[1]]);return pts}
function dist(g){let d=0;for(let i=1;i<g.length;i++)d+=map.distance(g[i-1],g[i]);return d}
function fmt(min){min=Math.round(min);return min<60?min+' мин':Math.floor(min/60)+' ч'+(min%60?' '+min%60+' мин':'')}
async function leg(prof,a,b){const key=prof+a+b;if(rcache[key])return rcache[key];
 let g,min;
 try{const u='https://routing.openstreetmap.de/routed-'+prof+'/route/v1/driving/'+a[1]+','+a[0]+';'+b[1]+','+b[0]+'?overview=full&geometries=geojson';
  const j=await (await fetch(u)).json(),r=j.routes[0];g=r.geometry.coordinates.map(c=>[c[1],c[0]]);
  min=prof=='car'?r.duration/60:dist(g)/1000/2.5*60}
 catch(e){g=arc(a,b);min=prof=='car'?dist(g)/1000/40*60:dist(g)/1000/2.5*60}
 return rcache[key]={g,min}}
async function pick(id){sel=id;render();const r=ROUTES.find(x=>x.id==id),col=COLORS[r.type],prof=r.type=='car'?'car':'foot';
 if(layer)map.removeLayer(layer);layer=L.layerGroup().addTo(map);
 const all=[];
 const legs=await Promise.all(r.pts.slice(1).map((k,i)=>leg(prof,POINTS[r.pts[i]].c,POINTS[k].c)));
 if(sel!=id)return;
 legs.forEach(l=>{L.polyline(l.g,{color:col,weight:5,opacity:.85}).addTo(layer);all.push(...l.g);
  L.marker(l.g[Math.floor(l.g.length/2)],{icon:L.divIcon({html:'<div class="leg" style="border-color:'+col+'">'+fmt(l.min)+'</div>',className:''})}).addTo(layer)});
 new Set(r.pts).forEach(k=>L.marker(POINTS[k].c,{icon:pin(col),zIndexOffset:500}).on('click',()=>show(k)).bindTooltip(POINTS[k].n).addTo(layer));
 map.fitBounds(L.latLngBounds(all.concat(r.pts.map(k=>POINTS[k].c))),{padding:[70,70]})}
function render(){const f=document.getElementById('filters');
 const mk=(a,cur)=>a.map(v=>'<button class="chip '+(v==cur?'on':'')+'">'+v+'</button>').join('');
 f.innerHTML=mk(['Все','Безенги','Джилы-Су','Терскол'],fc)+mk(['Все','Поход','Прогулка','Автомобиль'],ft);
 f.querySelectorAll('.chip').forEach((b,i)=>b.onclick=()=>{if(i<4)fc=b.textContent;else ft=b.textContent;render()});
 const list=ROUTES.filter(r=>(fc=='Все'||r.cl==fc)&&(ft=='Все'||TYPES[r.type]==ft));
 document.getElementById('routes').innerHTML=list.map(r=>'<div class="card '+(r.id==sel?'sel':'')+'" style="border-left-color:'+COLORS[r.type]+'" data-id="'+r.id+'"><h3>'+r.name+'</h3><div class="meta"><span class="tag" style="background:'+COLORS[r.type]+'">'+TYPES[r.type]+'</span>'+r.cl+' | '+r.dur+'</div><div class="meta">Уровень: '+r.lvl+'</div><p>'+r.d+'</p><div class="src">Источники маршрута: ['+r.src.join('], [')+']</div></div>').join('');
 document.querySelectorAll('.card').forEach(c=>c.onclick=()=>pick(c.dataset.id))}
render();
document.getElementById('elbrus-info').innerHTML='<h3>Как добраться до Эльбруса</h3><ul>'+ELBRUS_WAYS.map(w=>'<li>'+w+'</li>').join('')+'</ul>';
document.getElementById('srcList').innerHTML=SOURCES.map(s=>'<li>'+s+'</li>').join('');
