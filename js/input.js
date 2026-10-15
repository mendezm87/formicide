'use strict';
// ---------- camera ----------
function centerOn(x,y){cam.x=x-vw/cam.z/2;cam.y=y-(vh-panelH+44)/cam.z/2;clampCam();}
function clampCam(){const vwW=vw/cam.z,vhW=vh/cam.z,t=50/cam.z,b=(panelH+10)/cam.z,m=40/cam.z;
  cam.x=clamp(cam.x,-m,Math.max(-m,W-vwW+m));cam.y=clamp(cam.y,-t,Math.max(-t,H-vhW+b));}
const toWorld=(sx,sy)=>({x:cam.x+sx/cam.z,y:cam.y+sy/cam.z});

// ---------- selection & orders ----------
// tmode is the pending click-target mode: {k:'build',type} | {k:'amove'} | {k:'patrol'} | {k:'repair'} | {k:'abil',a} | {k:'swarm'}
let tmode=null,buildMenu=false,boxMode=false,mouse=null,lastTap={t:0},lastGroup={n:0,t:0};
const ptrs=new Map();let drag=null,pinch=null;
const ownUnits=()=>sel.filter(e=>e.kind==='unit'&&e.team===PLAYER);
function cpos(e){const r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
function pick(wx,wy,tol){let best=null,bd=1e9;
  for(const u of units){if(u.team!==PLAYER&&!u.vis)continue;const d=Math.hypot(u.x-wx,u.y-wy)-u.r*1.3;if(d<tol&&d<bd){bd=d;best=u;}}
  if(best)return best;
  for(const b of blds){if(b.team!==PLAYER&&!b.seen)continue;if(Math.hypot(b.x-wx,b.y-wy)<b.r+tol*.5)return b;}
  for(const f of foods)if(Math.hypot(f.x-wx,f.y-wy)<f.r+tol)return f;return null;}
function ping(x,y,c){pings.push({x,y,t:0,life:.6,c});}
function setSel(a){sel=a;buildMenu=false;tmode=null;}
function centroid(a){let x=0,y=0;for(const e of a){x+=e.x;y+=e.y;}return{x:x/a.length,y:y/a.length};}
function command(wx,wy,am,q){const t=pick(wx,wy,14/cam.z),us=ownUnits();
  if(!us.length){const b=sel[0];if(b&&b.kind==='bld'&&b.team===PLAYER&&b.built&&trainsOf(b).length){b.rally={x:wx,y:wy,e:t&&(t.kind==='food'||t.team!==PLAYER)?t:null};ping(wx,wy,'move');sfx('cmd');}return;}
  sfx('cmd');
  if(t&&t.kind!=='food'&&t.team!==PLAYER){for(const u of us)issue(u,canHit(u,t)?{t:'attack',e:t}:{t:'move',x:t.x,y:t.y},q);ping(t.x,t.y,'attack');return;}
  if(t&&t.kind==='food'){for(const u of us){if(u.type==='worker')issue(u,{t:'gather',e:t},q);else issue(u,{t:am?'amove':'move',x:t.x+(Math.random()-.5)*40,y:t.y+(Math.random()-.5)*40},q);}ping(t.x,t.y,'move');return;}
  if(t&&t.kind==='bld'&&t.team===PLAYER){let any=false;
    for(const u of us){if(u.type!=='worker')continue;
      if(!t.built&&!t.started){issue(u,{t:'build',e:t},q);any=true;}
      else if(t.built&&t.hp<t.maxhp){issue(u,{t:'repair',e:t},q);any=true;}
      else if(BLD[t.type].drop&&u.carry){u.state='ret';any=true;}}
    if(any){ping(t.x,t.y,'move');return;}}
  formationMove(us,wx,wy,am?'amove':'move',q);}
function formationMove(us,wx,wy,kind,q){const n=us.length,cols=Math.ceil(Math.sqrt(n)),rows=Math.ceil(n/cols),sp=Math.max(...us.map(u=>u.r))*2.3+4;
  // units that start together travel together at the pace of the slowest one
  const c=centroid(us),grp=us.filter(u=>Math.hypot(u.x-c.x,u.y-c.y)<260);let cap=0;
  if(grp.length>1&&!q){for(const u of grp)u.capSpd=0;cap=Math.min(...grp.map(u=>stat(u,'spd')));}
  const order=us.slice().sort((a,b)=>(a.y-b.y)||(a.x-b.x));
  order.forEach((u,i)=>issue(u,{t:kind,x:wx+((i%cols)-(cols-1)/2)*sp,y:wy+(Math.floor(i/cols)-(rows-1)/2)*sp,cap:grp.includes(u)?cap:0},q));
  ping(wx,wy,kind==='amove'?'attack':'move');}
function tryPlace(w,q){const ws=ownUnits().filter(e=>e.type==='worker'),type=tmode.type,d=BLD[type];
  if(!ws.length){tmode=null;buildMenu=false;return false;}
  if(!reqMet(PLAYER,d.req)){toast(reqTxt(d.req));tmode=null;return false;}
  const c=costOf(PLAYER,type);if(!canPay(PLAYER,c,true)){tmode=null;return false;}
  if(!canPlace(w.x,w.y,d.r)){toast("Can't build there");sfx('error');return false;}
  pay(PLAYER,c);const b=makeBld(PLAYER,type,w.x,w.y,false);issue(nearestOf(ws,b),{t:'build',e:b},q);ping(b.x,b.y,'move');sfx('cmd');return true;}
function casters(k){return ownUnits().filter(u=>UNIT[u.type].abil===k||(UNIT[u.type].abil2===k&&u.lvl>=(ABIL[k].lvl||0)));}
function useAbility(k){const A=ABIL[k],cs=casters(k);if(!cs.length)return;if(A.target){tmode={k:'abil',a:k};return;}
  const rdy=cs.filter(u=>(u.acd[k]||0)<=0&&!u.charge);if(!rdy.length){toast(A.name+' is not ready');sfx('error');return;}
  for(const u of rdy)doAbility(u,k,u.x,u.y);}
function castAt(k,w,q){const A=ABIL[k],cs=casters(k).filter(u=>(u.acd[k]||0)<=0&&!u.charge);if(!cs.length){toast(A.name+' is not ready');sfx('error');return;}
  let e=null;if(A.target==='enemy'){e=pick(w.x,w.y,14/cam.z);if(!e||e.kind!=='unit'||e.team===PLAYER){toast('Pick an enemy to target');sfx('error');return;}}
  issue(nearestOf(cs,w),{t:'cast',k,x:w.x,y:w.y,e},q);sfx('cmd');ping(w.x,w.y,'attack');}
function applyTmode(w,q){const m=tmode;
  if(m.k==='build'){if(tryPlace(w,q)&&!q)tmode=null;return;}
  if(m.k==='amove')command(w.x,w.y,true,q);
  else if(m.k==='patrol'){const us=ownUnits();if(us.length){formationMove(us,w.x,w.y,'patrol',q);sfx('cmd');}}
  else if(m.k==='repair'){const b=pick(w.x,w.y,14/cam.z),ws=ownUnits().filter(u=>u.type==='worker');
    if(!b||b.kind!=='bld'||b.team!==PLAYER){toast('Pick one of your structures to repair');sfx('error');return;}
    if(!b.built||b.hp>=b.maxhp){toast(b.built?`The ${BLD[b.type].name} is not damaged`:'Structures under construction repair themselves as they finish');sfx('error');tmode=null;return;}
    for(const u of ws)issue(u,{t:'repair',e:b},q);ping(b.x,b.y,'move');sfx('cmd');}
  else if(m.k==='abil')castAt(m.a,w,q);
  else if(m.k==='swarm'){const b=sel[0];if(b&&b.type==='spire'){if(!pointVisible(w.x,w.y)){toast('Target an area you can currently see');sfx('error');return;}unleash(b,w.x,w.y);}}
  if(!q)tmode=null;}
function handleTap(sx,sy,btn,touch,shift){const w=toWorld(sx,sy);
  if(tmode){if(btn===2){tmode=null;return;}applyTmode(w,shift);return;}
  if(btn===2){command(w.x,w.y,false,shift);return;}
  const e=pick(w.x,w.y,(touch?16:6)/cam.z);
  if(e&&e.team===PLAYER){const now=performance.now();
    if(e.kind==='unit'&&lastTap.type===e.type&&now-lastTap.t<380){setSel(units.filter(u=>u.team===PLAYER&&u.type===e.type&&onScreen(u)));lastTap={t:0};sfx('select');return;}
    lastTap={type:e.type,t:now};
    if(shift&&e.kind==='unit'&&sel.every(s=>s.kind==='unit'&&s.team===PLAYER)){if(sel.includes(e))setSel(sel.filter(s=>s!==e));else setSel([...sel,e]);}
    else setSel([e]);sfx('select');return;}
  if(e&&e.kind!=='food'&&!ownUnits().length){setSel([e]);return;}
  if(touch){if(ownUnits().length||sel[0]&&sel[0].team===PLAYER)command(w.x,w.y,false,false);}else if(!shift)setSel([]);}
function boxSelect(ax,ay,bx,by,shift){const a=toWorld(Math.min(ax,bx),Math.min(ay,by)),b=toWorld(Math.max(ax,bx),Math.max(ay,by));
  const v=units.filter(u=>u.team===PLAYER&&u.x>a.x-u.r&&u.x<b.x+u.r&&u.y>a.y-u.r&&u.y<b.y+u.r);
  if(shift&&sel.every(s=>s.kind==='unit'))setSel([...new Set([...sel,...v])]);else setSel(v);if(v.length)sfx('select');}
function stopSel(){for(const u of ownUnits()){u.orders=[];u.state='idle';u.target=null;u.amove=false;u.patrol=null;u.cast=null;}tmode=null;}
function holdSel(){for(const u of ownUnits())if(!UNIT[u.type].noAtk)issue(u,{t:'hold'},false);tmode=null;sfx('cmd');}
function setGroup(n,add){const own=sel.filter(e=>e.team===PLAYER);if(!own.length)return;
  groups[n]=add?[...new Set([...(groups[n]||[]).filter(e=>!e.dead),...own])]:own.slice();toast(`Group ${n}: ${groups[n].length} selected`);}
function recallGroup(n){const g=(groups[n]||[]).filter(e=>!e.dead);groups[n]=g;if(!g.length)return;const now=performance.now();
  if(lastGroup.n===n&&now-lastGroup.t<400){const c=centroid(g);centerOn(c.x,c.y);}lastGroup={n,t:now};setSel(g);sfx('select');}
function chooseBuild(t){if(tmode&&tmode.type===t){tmode=null;return;}const d=BLD[t];if(!reqMet(PLAYER,d.req)){toast(reqTxt(d.req));sfx('error');return;}
  if(!canPay(PLAYER,costOf(PLAYER,t),true))return;tmode={k:'build',type:t};}
function goNest(){const n=blds.find(b=>b.team===PLAYER&&b.type==='nest');if(n){setSel([n]);centerOn(n.x,n.y);}else{const u=units.find(u=>u.team===PLAYER);if(u)centerOn(u.x,u.y);}}
function goAlert(){if(alertPos&&gameTime-alertPos.t<12)centerOn(alertPos.x,alertPos.y);else goNest();}
function togglePause(){if(!running||gameOver)return;paused=!paused;$('bPause')&&($('bPause').textContent=paused?'▶':'❚❚');toast(paused?'Paused (F10 to resume)':'Resumed');}

// ---------- pointer ----------
cv.addEventListener('pointerdown',e=>{if(!running||gameOver||paused)return;audioResume();try{cv.setPointerCapture(e.pointerId);}catch(_){}
  const p=cpos(e);ptrs.set(e.pointerId,p);
  if(ptrs.size===2){const[a,b]=[...ptrs.values()];pinch={d0:Math.hypot(a.x-b.x,a.y-b.y)||1,z0:cam.z,wm:toWorld((a.x+b.x)/2,(a.y+b.y)/2)};drag={mode:'none'};return;}
  if(ptrs.size>2)return;
  drag={sx:p.x,sy:p.y,x:p.x,y:p.y,btn:e.button,touch:e.pointerType!=='mouse',mode:'pending',shift:e.shiftKey};});
cv.addEventListener('pointermove',e=>{const p=cpos(e);if(e.pointerType==='mouse')mouse=p;if(!ptrs.has(e.pointerId))return;ptrs.set(e.pointerId,p);
  if(pinch&&ptrs.size>=2){const[a,b]=[...ptrs.values()],mx=(a.x+b.x)/2,my=(a.y+b.y)/2,d=Math.hypot(a.x-b.x,a.y-b.y);
    cam.z=clamp(pinch.z0*d/pinch.d0,ZMIN,ZMAX);cam.x=pinch.wm.x-mx/cam.z;cam.y=pinch.wm.y-my/cam.z;clampCam();return;}
  if(!drag||drag.mode==='none')return;
  if(drag.mode==='pending'&&Math.hypot(p.x-drag.sx,p.y-drag.sy)>9)drag.mode=drag.touch?(boxMode?'box':'pan'):(drag.btn===0&&!tmode?'box':'pan');
  if(drag.mode==='pan'){cam.x-=(p.x-drag.x)/cam.z;cam.y-=(p.y-drag.y)/cam.z;clampCam();}
  drag.x=p.x;drag.y=p.y;});
function endPtr(e,cancel){if(!ptrs.has(e.pointerId))return;ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;
  if(!drag||ptrs.size>0)return;const d=drag;drag=null;if(cancel||!running||gameOver)return;
  if(d.mode==='pending')handleTap(d.sx,d.sy,d.btn,d.touch,d.shift||!!keys.Shift);
  else if(d.mode==='box'){boxSelect(d.sx,d.sy,d.x,d.y,d.shift);if(d.touch)boxMode=false;}}
cv.addEventListener('pointerup',e=>endPtr(e,false));
cv.addEventListener('pointercancel',e=>endPtr(e,true));
cv.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')mouse=null;});
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('wheel',e=>{e.preventDefault();if(!running)return;const p=cpos(e),wm=toWorld(p.x,p.y);
  cam.z=clamp(cam.z*Math.exp(-e.deltaY*.0015),ZMIN,ZMAX);cam.x=wm.x-p.x/cam.z;cam.y=wm.y-p.y/cam.z;clampCam();},{passive:false});
let miniDown=false;
const miniWorld=e=>{const r=mini.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};};
mini.addEventListener('pointerdown',e=>{if(!running||paused)return;const w=miniWorld(e);
  if(e.button===2){command(w.x,w.y,false,e.shiftKey);return;}
  if(tmode&&tmode.k!=='build'&&tmode.k!=='swarm'){applyTmode(w,e.shiftKey);return;}
  miniDown=true;try{mini.setPointerCapture(e.pointerId);}catch(_){}centerOn(w.x,w.y);});
mini.addEventListener('pointermove',e=>{if(miniDown){const w=miniWorld(e);centerOn(w.x,w.y);}});
mini.addEventListener('pointerup',()=>miniDown=false);mini.addEventListener('pointercancel',()=>miniDown=false);
mini.addEventListener('contextmenu',e=>e.preventDefault());

// ---------- keyboard ----------
const keys={};
addEventListener('keydown',e=>{const tg=e.target&&e.target.tagName;if(tg==='INPUT'||tg==='SELECT'||tg==='TEXTAREA')return;
  keys[e.key]=true;if(!running||gameOver)return;const k=e.key.toLowerCase();
  if(k==='escape'){if(tmode)tmode=null;else if(buildMenu)buildMenu=false;else if(!$('overlay').classList.contains('hide'))resumeGame();else openPause();return;}
  if(k==='f10'||k==='pause'){e.preventDefault();togglePause();return;}
  if(paused)return;
  const dg=e.code&&e.code.startsWith('Digit')?+e.code.slice(5):0;
  if(dg){e.preventDefault();if(buildMenu&&!e.ctrlKey&&!e.altKey&&!e.shiftKey){if(dg<=BUILDABLE.length)chooseBuild(BUILDABLE[dg-1]);return;}
    if(e.ctrlKey||e.altKey)setGroup(dg,false);else if(e.shiftKey)setGroup(dg,true);else recallGroup(dg);return;}
  if(k===' '){e.preventDefault();goAlert();return;}
  const us=ownUnits(),s0=sel[0];
  if(us.length){
    if(k==='a'){tmode=tmode&&tmode.k==='amove'?null:{k:'amove'};return;}
    if(k==='s'){stopSel();return;}
    if(k==='h'){holdSel();return;}
    if(k==='p'){tmode={k:'patrol'};return;}
    if(k==='b'&&us.some(u=>u.type==='worker')){buildMenu=!buildMenu;tmode=null;return;}
    if(k==='r'&&us.some(u=>u.type==='worker')){tmode=tmode&&tmode.k==='repair'?null:{k:'repair'};return;}
    if(k==='d'||k==='f'){const ab=[...new Set(us.flatMap(u=>{const d=UNIT[u.type];return k==='d'?[d.abil]:[d.abil2];}).filter(Boolean))];if(ab[0])useAbility(ab[0]);return;}}
  else if(s0&&s0.kind==='bld'&&s0.team===PLAYER&&'qwert'.includes(k)&&k.length===1){const i='qwert'.indexOf(k);
    if(s0.type==='spire'){if(i===0)armSwarm(s0);return;}
    const list=BLD[s0.type].research||trainsOf(s0),it=list[i];if(it)enqueue(s0,it);}
  if(e.key.startsWith('Arrow'))e.preventDefault();});
addEventListener('keyup',e=>{keys[e.key]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
function handleKeys(dt){const s=650*dt/cam.z;let m=false;
  if(keys.ArrowLeft){cam.x-=s;m=true;}if(keys.ArrowRight){cam.x+=s;m=true;}if(keys.ArrowUp){cam.y-=s;m=true;}if(keys.ArrowDown){cam.y+=s;m=true;}if(m)clampCam();}
function armSwarm(b){if(!b.built)return;if(b.spT>0){toast('The Swarm Spire is still charging: '+fmtT(b.spT));sfx('error');return;}tmode={k:'swarm'};}
