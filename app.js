const map=L.map('map').setView([43.25,43.0],9);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'&copy; OpenStreetMap'}).addTo(map);
const panel=document.getElementById('panel'),cache={},rcache={};let layer=null,sel=null,fc='Все',ft='Все';
const PEAK='<svg viewBox="0 0 24 24"><path d="M1 20 8 8l4 6 3-4 8 10z"/></svg>';
function badge(k,cls,ic){const p=POINTS[k];L.marker(p.c,{icon:L.divIcon({html:'<div class="badge '+cls+'">'+ic+p.n+'</div>',className:'',iconSize:[0,0]}),zIndexOffset:900}).addTo(map).on('click',()=>show(k))}
badge('nalchik','n','<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6"/></svg>');badge('elbrus','e',PEAK);
async function commons(q){
 const u='https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=8&gsrsearch='+encodeURIComponent(q)+'&prop=imageinfo&iiprop=url|mime&iiurlwidth=640';
 const j=await (await fetch(u)).json();if(!j.query)return null;
 return Object.values(j.query.pages).map(p=>p.imageinfo&&p.imageinfo[0]).filter(i=>i&&i.mime=='image/jpeg'&&i.thumburl)[0]||null}
async function getPhoto(k){if(cache[k])return cache[k];let r=null;
 try{r=await commons(POINTS[k].q)||await commons('Kabardino-Balkaria mountains')}catch(e){}return cache[k]=r}
function show(k){const p=POINTS[k];panel.hidden=false;
 panel.innerHTML='<button class="x">x</button><div class="ph" id="ph">'+p.n+'</div><div class="b"><h2>'+p.n+'</h2><p>'+p.t+'</p></div><div class="cr" id="cr"></div>';
 panel.querySelector('.x').onclick=()=>panel.hidden=true;
 getPhoto(k).then(i=>{if(!i||panel.querySelector('h2').textContent!=p.n)return;
  document.getElementById('ph').outerHTML='<img src="'+i.thumburl+'" alt="'+p.n+'">';
  document.getElementById('cr').innerHTML='Фото: <a href="'+i.descriptionurl+'" target="_blank">Wikimedia Commons</a>'})}
function dist(g){let d=0;for(let i=1;i<g.length;i++)d+=map.distance(g[i-1],g[i]);return d}
function fmt(m){m=Math.round(m);return m<60?m+' мин':Math.floor(m/60)+' ч'+(m%60?' '+m%60+' мин':'')}
function smooth(p){const o=[];for(let i=0;i<p.length-1;i++){const a=p[Math.max(i-1,0)],b=p[i],c=p[i+1],d=p[Math.min(i+2,p.length-1)];
 for(let t=0;t<1;t+=0.1){const t2=t*t,t3=t2*t;o.push([0,1].map(k=>0.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3)))}}
 o.push(p[p.length-1]);return o}
function footLeg(r,a,b){const A=r.stops[a],B=r.stops[b],f=A+'>'+B,rv=B+'>'+A,m=(r.mid||{});
 let mid=m[f]||(m[rv]&&m[rv].slice().reverse());
 const p0=POINTS[A].c,p1=POINTS[B].c;
 if(!mid){const dx=p1[1]-p0[1],dy=p1[0]-p0[0];mid=[[p0[0]+dy*.35-dx*.12,p0[1]+dx*.35+dy*.12],[p0[0]+dy*.7+dx*.1,p0[1]+dx*.7-dy*.1]]}
 return smooth([p0].concat(mid,[p1]))}
async function carLeg(a,b){const key=a+b;if(rcache[key])return rcache[key];
 const A=POINTS[a].c,B=POINTS[b].c,st=map.distance(A,B)/1000;let g,min,ok=false;
 try{const u='https://routing.openstreetmap.de/routed-car/route/v1/driving/'+A[1]+','+A[0]+';'+B[1]+','+B[0]+'?overview=full&geometries=geojson';
  const r=(await (await fetch(u)).json()).routes[0];g=r.geometry.coordinates.map(c=>[c[1],c[0]]);min=r.duration/60;
  ok=r.distance/1000<st*2.2+8&&min<420}catch(e){}
 if(!ok){g=smooth([A,[(A[0]+B[0])/2+(B[1]-A[1])*.1,(A[1]+B[1])/2-(B[0]-A[0])*.1],B]);min=st*1.4/45*60}
 return rcache[key]={g,min}}
async function pick(id){sel=id;render();const r=ROUTES.find(x=>x.id==id),col=COLORS[r.type];
 if(layer)map.removeLayer(layer);layer=L.layerGroup().addTo(map);const all=[],n=r.stops.length;
 for(let i=0;i<n-1;i++){let g,min;const a=r.stops[i],b=r.stops[i+1];
  if(r.lift&&a==r.lift[0]&&b==r.lift[1]){g=[POINTS[a].c,POINTS[b].c];L.polyline(g,{color:col,weight:4,dashArray:'3 8'}).addTo(layer);
   L.marker(g[0].map((v,k)=>(v+g[1][k])/2),{icon:L.divIcon({html:'<div class="leg" style="border-color:'+col+'">канатная дорога</div>',className:''})}).addTo(layer);all.push(...g);continue}
  if(r.type=='car'){({g,min}=await carLeg(a,b))}
  else{g=footLeg(r,i,i+1);min=r.mins?r.mins[i]:dist(g)/1000/2.5*60*1.25}
  if(sel!=id)return;
  L.polyline(g,{color:col,weight:5,opacity:.9,dashArray:r.type=='car'?null:'10 6'}).addTo(layer);all.push(...g);
  const day=r.days?'День '+r.days[i]+' | ':'';
  L.marker(g[Math.floor(g.length/2)],{icon:L.divIcon({html:'<div class="leg" style="border-color:'+col+'">'+day+fmt(min)+'</div>',className:''})}).addTo(layer)}
 r.stops.forEach((k,i)=>L.marker(POINTS[k].c,{icon:L.divIcon({html:'<div class="num" style="background:'+col+'">'+(i+1)+'</div>',className:'',iconSize:[24,24]}),zIndexOffset:500}).on('click',()=>show(k)).bindTooltip(POINTS[k].n,{permanent:true,direction:'right',className:'lbl',offset:[10,0]}).addTo(layer));
 map.fitBounds(L.latLngBounds(all),{padding:[70,70]})}
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
