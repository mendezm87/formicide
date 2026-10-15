'use strict';
// ---------- state ----------
let W=2400,H=1600,MAP=null,GR=null,cfg=null,mission=null;
let lairs=[],units=[],blds=[],foods=[],projs=[],fx=[],pings=[],pools=[],marks=[],teams=[],sel=[],groups={};
let gameTime=0,nextId=1,NEU=1,stats=null,weather=null,foot=null,shakeT=0,combatT=0,lastAlert=-99,alertPos=null,visSrc=[];
let running=false,paused=false,gameOver=false;
const cam={x:0,y:0,z:1};
let dpr=1,vw=0,vh=0,panelH=70,animT=0;

const fac=t=>(teams[t]&&FACTIONS[teams[t].fac])||{};
const colOf=t=>(teams[t]&&teams[t].col)||COLORS.black;
const trailR=b=>BLD[b.type].trail||b.r+110;
const onScreen=(e,m=0)=>e.x>cam.x-m&&e.y>cam.y-m&&e.x<cam.x+vw/cam.z+m&&e.y<cam.y+vh/cam.z+m;
function shake(s,e){if(!e||onScreen(e,200))shakeT=Math.max(shakeT,s);}
function announce(msg,line,gap){toast(msg);say(line,gap);}
function floatTxt(x,y,s,c){fx.push({k:'txt',x,y,s,c:c||'#f0b429',t:0,life:1.6});}

// ---------- entities ----------
function spawnUnit(team,type,x,y){const d=UNIT[type],T=teams[team];const hp=d.hp*(T.up.carapace&&type!=='worker'&&!d.creep&&!d.temp?1.25:1);
  const u={id:nextId++,kind:'unit',type,team,x,y,lx:x,ly:y,r:d.r,hp,maxhp:hp,fly:!!d.fly,ang:team===NEU?Math.random()*6.28:Math.atan2(H/2-y,W/2-x),
    state:'idle',tx:x,ty:y,target:null,cd:0,carry:0,carryK:'food',food:null,phase:Math.random()*6,scan:Math.random()*.3,gt:0,amove:false,leash:0,ox:x,oy:y,
    bestD:1e9,stuck:0,flash:0,atk:0,moving:false,vis:team===PLAYER,orders:[],patrol:null,capSpd:0,xp:0,rank:0,lvl:d.hero?1:0,acd:{},buffT:0,buffK:null,
    burnT:0,burnD:0,burnSrc:null,stunT:0,life:d.temp?30:0,lastHit:-99,revealT:0,path:null,pdx:0,pdy:0,losT:0,inGrass:false,onMound:false,onTrail:false,
    auraT:0,auraV:0,resolveT:0,healT:null,cast:null,charge:null,home:d.creep?{x,y}:null,aggro:0,wave:false};
  units.push(u);return u;}
function makeBld(team,type,x,y,built){const d=BLD[type];const R=mulberry(nextId*97+3);const grains=[],deco=[];
  for(let i=0;i<46;i++){const a=R()*6.28,rr=Math.sqrt(R())*d.r*.92;grains.push([Math.cos(a)*rr,Math.sin(a)*rr,1+R()*2.2,R()<.5]);}
  for(let i=0;i<9;i++){const a=R()*6.28,rr=(.35+R()*.5)*d.r;deco.push([Math.cos(a)*rr,Math.sin(a)*rr,.6+R()*.6,R()*6.28]);}
  const b={id:nextId++,kind:'bld',type,team,x,y,r:d.r,maxhp:d.hp,hp:built?d.hp:d.hp*.1,built,started:built,prog:built?1:0,queue:[],paid:[],qt:0,
    rally:null,grains,deco,flash:0,seen:false,vis:false,blocked:false,cd:0,ang:Math.atan2(H/2-y,W/2-x),tgt:null,spT:built&&d.charge?d.charge:0,invuln:false};
  blds.push(b);return b;}
function addFood(x,y,amt,kind){const R=mulberry(Math.floor(x*7+y*13));
  if(kind==='aphid'){const bugs=[];for(let i=0;i<9;i++)bugs.push({a:R()*6.28,d:8+R()*18,s:3+R()*2.5,p:R()*6});
    foods.push({id:nextId++,kind:'food',x,y,amt,max:amt,r:24,ftype:'aphid',bugs,regen:.6,dead:false});return;}
  const r=14+amt/2500*14;const crumbs=[];
  for(let i=0;i<34;i++){const a=R()*6.28,rr=Math.sqrt(R())*r;crumbs.push({x:Math.cos(a)*rr,y:Math.sin(a)*rr*.85,s:3+R()*4,rot:R()*3,c:R()});}
  crumbs.sort((a,b)=>(a.x*a.x+a.y*a.y)-(b.x*b.x+b.y*b.y));
  foods.push({id:nextId++,kind:'food',x,y,amt,max:amt,r,crumbs,ftype:kind,dead:false});}

// ---------- rules ----------
function supCap(t){let c=0;for(const b of blds)if(b.team===t&&b.built&&!b.dead&&BLD[b.type].sup)c+=b.type==='garden'?(fac(t).gardenSup||15):BLD[b.type].sup;return Math.min(MAXSUP,c);}
function supUsed(t){let c=0;for(const u of units)if(u.team===t&&!u.dead)c+=UNIT[u.type].sup||0;return c;}
const hasBuilt=(t,type)=>blds.some(b=>b.team===t&&b.type===type&&b.built&&!b.dead);
const reqMet=(t,req)=>!req||hasBuilt(t,req);
const reqTxt=req=>'Needs '+BLD[req].name;
const researching=(t,k)=>blds.some(b=>b.team===t&&!b.dead&&b.queue.includes(k));
const trainsOf=b=>(BLD[b.type].trains||[]).map(x=>x==='UNIQUE'?fac(b.team).unique:x);
const princessBusy=t=>units.some(u=>u.team===t&&u.type==='princess'&&!u.dead)||blds.some(b=>b.team===t&&!b.dead&&b.queue.includes('princess'));
function qTime(b,it){return UNIT[it]?UNIT[it].time*(fac(b.team).trainMult||1):UPG[it].time;}
function costOf(t,it){const i=UNIT[it]||UPG[it]||BLD[it];if(it==='princess'&&teams[t].princessDied)return{f:150,h:75};return{f:i.cost||0,h:i.hon||0};}
function canPay(t,c,msg){const T=teams[t];
  if(T.food<c.f){if(msg&&t===PLAYER){announce('Not enough food','Not enough food',4000);sfx('error');}return false;}
  if(T.honey<c.h){if(msg&&t===PLAYER){announce('Not enough honeydew','Not enough honeydew',4000);sfx('error');}return false;}return true;}
function pay(t,c){teams[t].food-=c.f;teams[t].honey-=c.h;}
function refund(t,c,k){teams[t].food+=c.f*(k||1);teams[t].honey+=c.h*(k||1);}
function stat(u,k){const d=UNIT[u.type],T=teams[u.team],up=T.up,F=fac(u.team);let v=d[k]||0;
  if(k==='spd'){if(up.legs)v*=1.15;if(F.spdMult)v*=F.spdMult;if(u.buffT>0&&u.buffK==='rally')v*=1.4;
    if(u.onTrail)v*=1.2;else if(weather&&weather.rain&&!u.fly)v*=.65;if(u.capSpd)v=Math.min(v,u.capSpd);if(u.stunT>0)v=0;}
  else if(k==='dmg'){if(d.ranged){if(up.acid)v*=1.25;}else if(up.mandibles)v*=1.25;v*=1+u.rank*.12+(u.lvl>1?(u.lvl-1)*.1:0);
    if(u.buffT>0&&u.buffK==='rally')v*=1.3;if(u.auraT>0)v*=1+u.auraV;}
  else if(k==='range'){if(d.ranged&&up.acid)v*=1.2;if(u.onMound&&d.ranged)v*=1.15;}
  else if(k==='sight'){if(u.onMound)v*=1.25;if(weather&&weather.rain)v*=.75;}
  else if(k==='cd'){if(u.buffT>0&&u.buffK==='blaze')v*=.5;}
  return v;}
function canHit(u,t){const d=UNIT[u.type];if(d.noAtk)return false;if(t.kind==='bld')return true;if(t.fly)return(!!d.fly||!!d.ranged)&&!d.groundOnly;return true;}
const unitVal=t=>{const d=UNIT[t.type];return d.creep?d.bounty[0]+d.bounty[1]:d.temp?20:(d.cost||0)+(d.hon||0);};

function enqueue(b,it){const T=teams[b.team],pl=b.team===PLAYER;
  if(!b.built||b.queue.length>=5)return false;
  if(UPG[it]){if(T.up[it]||researching(b.team,it))return false;}
  else{const u=UNIT[it];if(!reqMet(b.team,u.req)){if(pl){toast(reqTxt(u.req));sfx('error');}return false;}
    if(u.hero&&princessBusy(b.team)){if(pl){toast('You can only have one Princess');sfx('error');}return false;}}
  const c=costOf(b.team,it);if(!canPay(b.team,c,true))return false;pay(b.team,c);b.queue.push(it);b.paid.push(c);if(pl)sfx('cmd');return true;}
function cancelQ(b,i){const it=b.queue[i];if(it==null)return;refund(b.team,b.paid[i]||costOf(b.team,it));b.queue.splice(i,1);b.paid.splice(i,1);if(i===0){b.qt=0;b.blocked=false;}}
function cancelBld(b){if(b.built)return;refund(b.team,costOf(b.team,b.type),.75);b.dead=true;fx.push({k:'rubble',x:b.x,y:b.y,r:b.r,t:0,life:8});}

// ---------- movement ----------
function nearestOf(arr,p){let b=null,bd=1e18;for(const e of arr){if(e.dead)continue;const d=d2(e,p);if(d<bd){bd=d;b=e;}}return b;}
function nearestRes(p,honey,maxD){let b=null,bd=(maxD||1e9)**2;for(const f of foods){if(f.dead||(f.ftype==='aphid')!==!!honey)continue;const d=d2(f,p);if(d<bd){bd=d;b=f;}}return b;}
function nearestDrop(u){let b=null,bd=1e18;for(const n of blds){if(n.dead||n.team!==u.team||!BLD[n.type].drop||!n.built)continue;const d=d2(u,n);if(d<bd){bd=d;b=n;}}return b;}
function turn(u,a,dt){let da=a-u.ang;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;u.ang+=da*Math.min(1,dt*10);}
function stepTo(u,x,y,dt,stop){let dx=x-u.x,dy=y-u.y;const L=Math.hypot(dx,dy);if(L<=stop+.5)return true;
  let nx=dx/L,ny=dy/L;
  if(!u.fly)for(const b of blds){if(b.dead)continue;if(Math.hypot(x-b.x,y-b.y)<b.r+12)continue;const rx=u.x-b.x,ry=u.y-b.y,d=Math.hypot(rx,ry);
    if(d<b.r+u.r+14){const dot=(nx*rx+ny*ry)/d;if(dot<.2){let tx=-ry/d,ty=rx/d;if(tx*nx+ty*ny<0){tx=-tx;ty=-ty;}nx=nx*.25+tx;ny=ny*.25+ty;const l=Math.hypot(nx,ny);nx/=l;ny/=l;}}}
  const s=Math.min(stat(u,'spd')*dt,L-stop),px=u.x,py=u.y;u.x+=nx*s;u.y+=ny*s;
  if(!u.fly&&MAP.hasWater&&blockedAt(u.x,u.y)){if(!blockedAt(u.x,py))u.y=py;else if(!blockedAt(px,u.y))u.x=px;else{u.x=px;u.y=py;}}
  turn(u,Math.atan2(ny,nx),dt);u.moving=s>0;return false;}
function navStep(u,x,y,dt,stop){if(u.fly||!MAP.hasWater)return stepTo(u,x,y,dt,stop);
  u.losT-=dt;
  if(u.path&&(Math.abs(u.pdx-x)>40||Math.abs(u.pdy-y)>40))u.path=null;
  if(!u.path&&u.losT<=0){u.losT=.4+Math.random()*.2;if(!clearLine(u.x,u.y,x,y)){
    // give up re-planning toward the same spot after a few tries so the stuck check can end the order
    u.repath=Math.abs(u.pdx-x)<40&&Math.abs(u.pdy-y)<40?(u.repath||0)+1:0;u.pdx=x;u.pdy=y;u.path=u.repath>4?[]:findPath(u.x,u.y,x,y)||[];}}
  if(u.path&&u.path.length){let wp=u.path[0];
    if(Math.hypot(wp.x-u.x,wp.y-u.y)<14){u.path.shift();if(!u.path.length){u.path=null;return stepTo(u,x,y,dt,stop);}wp=u.path[0];}
    stepTo(u,wp.x,wp.y,dt,0);return false;}
  return stepTo(u,x,y,dt,stop);}
function moveOrder(u,x,y,am){x=clamp(x,10,W-10);y=clamp(y,10,H-10);if(!u.fly&&MAP.hasWater&&blockedAt(x,y)){const f=nearestFree(x,y);x=f.x;y=f.y;}
  u.state=am?'amove':'move';u.amove=am;u.tx=x;u.ty=y;u.repath=0;u.target=null;u.bestD=1e9;u.stuck=0;u.path=null;u.losT=0;}

// ---------- orders (shift-queue, patrol, hold) ----------
function exec(u,o){u.patrol=null;u.capSpd=0;u.cast=null;
  switch(o.t){
    case 'move':case 'amove':moveOrder(u,o.x,o.y,o.t==='amove');u.capSpd=o.cap||0;break;
    case 'patrol':moveOrder(u,o.x,o.y,true);u.patrol={ax:u.x,ay:u.y,bx:o.x,by:o.y};break;
    case 'attack':if(o.e.dead)return nextOrder(u);u.state='attack';u.target=o.e;u.amove=false;u.leash=0;break;
    case 'gather':if(o.e.dead)return nextOrder(u);u.food=o.e;u.target=null;u.gt=0;u.state=u.carry?'ret':'gather';break;
    case 'build':if(o.e.dead||o.e.started)return nextOrder(u);u.state='build';u.target=o.e;break;
    case 'repair':u.state='repair';u.target=o.e;break;
    case 'hold':u.state='hold';u.target=null;break;
    case 'cast':u.state='cast';u.cast=o;break;}}
function issue(u,o,q){if(q&&(!['idle','hold','gather'].includes(u.state)||u.orders.length)){u.orders.push(o);return;}u.orders=[];exec(u,o);}
function nextOrder(u){u.capSpd=0;const o=u.orders.shift();if(o)exec(u,o);else{u.state='idle';u.target=null;u.amove=false;}}
function afterJob(u){if(u.orders.length)nextOrder(u);else u.state=u.food&&!u.food.dead?'gather':'idle';}

// ---------- unit update ----------
function env(u){u.inGrass=!u.fly&&grassAt(u.x,u.y);u.onMound=!u.fly&&moundAt(u.x,u.y);u.onTrail=false;
  if(!u.fly&&u.team!==NEU)for(const b of blds)if(b.team===u.team&&b.built&&!b.dead){const R=trailR(b);if(d2(u,b)<R*R){u.onTrail=true;break;}}}
function findEnemy(u,range){let best=null,bd=range*range;const T=u.team;
  for(const e of units){if(e.team===T||e.dead||e.charge)continue;if(e.team===NEU&&e.aggro<=0)continue;if(!canHit(u,e))continue;
    const dd=d2(u,e);if(dd>=bd)continue;if(e.inGrass&&e.revealT<=0&&dd>70*70)continue;bd=dd;best=e;}
  if(best)return best;
  for(const b of blds){if(b.team===T||b.dead)continue;const dd=(Math.max(0,dist(u,b)-b.r))**2;if(dd<bd){bd=dd;best=b;}}
  return best;}
function updUnit(u,dt){const d=UNIT[u.type];
  u.cd-=dt;u.scan-=dt;u.flash-=dt;u.atk-=dt;u.buffT-=dt;u.auraT-=dt;u.resolveT-=dt;u.revealT-=dt;u.moving=false;
  for(const k in u.acd)u.acd[k]-=dt;
  if(u.burnT>0){u.burnT-=dt;damage(u,u.burnD*dt,u.burnSrc,true);if(u.dead)return;}
  if(d.temp){u.life-=dt;if(u.life<=0){u.dead=true;fx.push({k:'puff',x:u.x,y:u.y,t:0,life:.5});return;}}
  if(u.stunT>0){u.stunT-=dt;return;}
  if(u.charge){updCharge(u,dt);return;}
  if(d.creep){updCreep(u,dt);return;}
  if(u.target&&(u.target.dead||u.target.charge)){u.target=null;if(u.state==='attack'){if(u.amove){u.state='amove';u.bestD=1e9;u.stuck=0;}else nextOrder(u);}}
  if(u.scan<=0){u.scan=.25+Math.random()*.1;env(u);
    if(!d.noAtk&&((u.state==='idle'&&u.type!=='worker')||u.state==='amove'||(u.state==='hold'&&!u.target))){
      const hold=u.state==='hold',e=findEnemy(u,hold?stat(u,'range')+u.r+30:Math.max(stat(u,'sight'),stat(u,'range')+20));
      if(e){u.target=e;if(!hold){u.leash=u.amove?0:stat(u,'sight')*1.6;u.ox=u.x;u.oy=u.y;u.state='attack';}}}
    if(d.heal)nurseScan(u);}
  if(d.heal&&u.healT)nurseHeal(u,dt);
  regen(u,dt);
  switch(u.state){
    case 'move':case 'amove':{const tp=u.path&&u.path.length?u.path[0]:null;if(tp!==u.lastTp){u.lastTp=tp;u.bestD=1e9;}
      const dd=tp?Math.hypot(tp.x-u.x,tp.y-u.y):Math.hypot(u.tx-u.x,u.ty-u.y);if(dd<u.bestD-.4){u.bestD=dd;u.stuck=0;}else u.stuck+=dt;
      if(navStep(u,u.tx,u.ty,dt,3)||u.stuck>1.2){u.capSpd=0;
        if(u.patrol){const p=u.patrol;[p.ax,p.bx,p.ay,p.by]=[p.bx,p.ax,p.by,p.ay];moveOrder(u,p.bx,p.by,true);}else{u.amove=false;nextOrder(u);}}break;}
    case 'hold':{const t=u.target;if(t){if(t.dead||!canHit(u,t)||dist(u,t)-u.r-t.r>stat(u,'range')+2)u.target=null;
        else{turn(u,Math.atan2(t.y-u.y,t.x-u.x),dt);if(u.cd<=0){u.cd=stat(u,'cd');fire(u,t);}}}break;}
    case 'attack':{const t=u.target;if(!t||!canHit(u,t)){u.target=null;nextOrder(u);break;}
      if(u.leash&&Math.hypot(u.x-u.ox,u.y-u.oy)>u.leash){moveOrder(u,u.ox,u.oy,false);break;}
      const rng=stat(u,'range'),gap=dist(u,t)-u.r-t.r;
      if(gap<=rng){turn(u,Math.atan2(t.y-u.y,t.x-u.x),dt);if(u.cd<=0){u.cd=stat(u,'cd');fire(u,t);}}
      else navStep(u,t.x,t.y,dt,u.r+t.r+rng*.8);break;}
    case 'gather':{if(u.carry>0){u.state='ret';break;}
      if(!u.food||u.food.dead){u.food=nearestRes(u,u.food&&u.food.ftype==='aphid')||nearestRes(u,false);if(!u.food){u.state='idle';break;}}
      const f=u.food,gap=dist(u,f)-u.r-f.r;
      if(gap>4){navStep(u,f.x,f.y,dt,u.r+f.r+2);u.gt=0;}
      else{const hon=f.ftype==='aphid',take=Math.round((hon?4:8)*(fac(u.team).carryMult||1)*(teams[u.team].up.forage?1.5:1));
        turn(u,Math.atan2(f.y-u.y,f.x-u.x),dt);u.gt+=dt;
        if(u.gt>=(hon?1.8:1.3)&&(!hon||f.amt>=take)){u.gt=0;const got=Math.min(take,f.amt);f.amt-=got;u.carry=got;u.carryK=hon?'honey':'food';if(!hon&&f.amt<=0)f.dead=true;u.state='ret';}}
      break;}
    case 'ret':{const n=nearestDrop(u);if(!n){u.state='idle';break;}
      if(dist(u,n)-u.r-n.r>4)navStep(u,n.x,n.y,dt,u.r+n.r+2);
      else{const T=teams[u.team],v=u.carry*T.mult;if(u.carryK==='honey'){T.honey+=v;T.stats.honey+=u.carry;}else{T.food+=v;T.stats.gathered+=u.carry;}
        u.carry=0;u.state='gather';if(u.orders.length)nextOrder(u);}break;}
    case 'build':{const b=u.target;if(!b||b.dead||b.built||b.started){u.target=null;afterJob(u);break;}
      if(dist(u,b)-u.r-b.r>6)navStep(u,b.x,b.y,dt,u.r+b.r+3);else{b.started=true;u.target=null;afterJob(u);}break;}
    case 'repair':{const b=u.target;if(!b||b.dead||!b.built||b.hp>=b.maxhp){u.target=null;afterJob(u);break;}
      if(dist(u,b)-u.r-b.r>6)navStep(u,b.x,b.y,dt,u.r+b.r+3);
      else{b.hp=Math.min(b.maxhp,b.hp+14*dt);turn(u,Math.atan2(b.y-u.y,b.x-u.x),dt);u.atk=.1;if(Math.random()<dt*4)fx.push({k:'spark',x:u.x+Math.cos(u.ang)*u.r*1.6,y:u.y+Math.sin(u.ang)*u.r*1.6,t:0,life:.4});}break;}
    case 'cast':{const c=u.cast;if(!c||(c.e&&c.e.dead)){u.cast=null;nextOrder(u);break;}
      const tx=c.e?c.e.x:c.x,ty=c.e?c.e.y:c.y,rg=(ABIL[c.k].range||0)+(c.e?c.e.r:0);
      if(Math.hypot(tx-u.x,ty-u.y)>rg)navStep(u,tx,ty,dt,rg*.9);
      else{u.cast=null;if((u.acd[c.k]||0)<=0)doAbility(u,c.k,tx,ty,c.e);if(u.state==='cast')nextOrder(u);}break;}
  }
  if(u.moving)u.phase+=dt*d.spd*.33;}
function regen(u,dt){if(u.hp>=u.maxhp)return;let r=0;if(gameTime-u.lastHit>6&&u.onTrail)r+=2+u.maxhp*.01;
  if(u.rank>=3||UNIT[u.type].hero)r+=1.5;if(u.resolveT>0)r+=5;if(r)u.hp=Math.min(u.maxhp,u.hp+r*dt);}
function nurseScan(u){const d=UNIT[u.type],R=u.state==='idle'?d.healR*1.8:d.healR;let best=null,bv=0;
  for(const a of units){if(a.team!==u.team||a.dead||a===u||UNIT[a.type].creep)continue;const miss=a.maxhp-a.hp;if(miss<1||d2(u,a)>R*R)continue;if(miss>bv){bv=miss;best=a;}}u.healT=best;}
function nurseHeal(u,dt){const a=u.healT,d=UNIT[u.type];if(a.dead||a.hp>=a.maxhp){u.healT=null;return;}const dd=dist(u,a);
  if(dd>d.healR){if(u.state==='idle'&&dd<d.healR*1.9)stepTo(u,a.x,a.y,dt,d.healR*.7);else u.healT=null;return;}
  a.hp=Math.min(a.maxhp,a.hp+d.heal*dt);}
function auras(){for(const p of units){if(p.dead||!UNIT[p.type].hero)continue;
  for(const a of units){if(a.team!==p.team||a.dead||d2(a,p)>160*160)continue;a.auraT=.3;a.auraV=.04+.03*p.lvl;if(p.lvl>=5)a.resolveT=.3;}}}

// ---------- neutral creeps ----------
function updCreep(u,dt){const d=UNIT[u.type],h=u.home;u.aggro-=dt;
  if(u.scan<=0){u.scan=.3;if(!u.target||u.target.dead||u.target.charge){u.target=null;let bd=1e18;
    for(const e of units){if(e.team===NEU||e.dead||e.charge||!canHit(u,e))continue;if(Math.hypot(e.x-h.x,e.y-h.y)>(u.aggro>0?260:120))continue;const dd=d2(u,e);if(dd<bd){bd=dd;u.target=e;}}}}
  const t=u.target;
  if(t&&(t.dead||t.charge||Math.hypot(t.x-h.x,t.y-h.y)>300))u.target=null;
  if(u.target){const gap=dist(u,t)-u.r-t.r;
    if(gap<=d.range){turn(u,Math.atan2(t.y-u.y,t.x-u.x),dt);if(u.cd<=0){u.cd=d.cd;u.atk=.25;damage(t,d.dmg,u);fx.push({k:'bite',x:t.x,y:t.y,t:0,life:.2});sfx('bite',t.x,t.y);}}
    else navStep(u,t.x,t.y,dt,u.r+t.r+d.range*.8);}
  else if(Math.hypot(u.x-h.x,u.y-h.y)>10)navStep(u,h.x,h.y,dt,6);
  else{u.hp=Math.min(u.maxhp,u.hp+u.maxhp*.06*dt);u.ang+=Math.sin(animT*.5+u.id)*dt*.3;}
  if(u.moving)u.phase+=dt*d.spd*.25;}
function creepAggro(c,src){c.aggro=6;if(!c.target||c.target.dead)c.target=src;
  for(const o of units)if(o.team===NEU&&o!==c&&!o.dead&&d2(o,c)<220*220){o.aggro=6;if(!o.target)o.target=src;}}

// ---------- combat ----------
function fire(u,t){const d=UNIT[u.type];u.atk=.18;u.revealT=1.5;let dmg=stat(u,'dmg');if(t.fly&&d.aa)dmg*=d.aa;const C=colOf(u.team);
  if(d.flame){flame(u,t,dmg);return;}
  if(d.splash){const L=dist(u,t);projs.push({lob:true,sx:u.x,sy:u.y,x:u.x,y:u.y,tx:t.x,ty:t.y,k:0,dur:Math.max(.4,L/(d.fly?300:220)),h0:d.fly?20:Math.min(110,L*.4),team:u.team,dmg,src:u,splash:d.splash,bld:d.bld||1,rgb:C.proj,rgb2:C.projHi});sfx('spit',u.x,u.y);return;}
  if(d.ranged){projs.push({x:u.x+Math.cos(u.ang)*u.r*1.4,y:u.y+Math.sin(u.ang)*u.r*1.4,t,team:u.team,dmg,src:u,trail:[],rgb:C.proj});sfx(d.fly?'zap':'spit',u.x,u.y);return;}
  damage(t,dmg*(t.kind==='bld'&&d.bld?d.bld:1),u);
  if(fac(u.team).burn&&t.kind==='unit'&&!t.dead){t.burnT=3;t.burnD=4;t.burnSrc=u;}
  const L=Math.max(1,dist(u,t));fx.push({k:'bite',x:t.x+(u.x-t.x)*t.r/L,y:t.y+(u.y-t.y)*t.r/L,t:0,life:.2});sfx('bite',t.x,t.y);}
function flame(u,t,dmg){const d=UNIT[u.type];fx.push({k:'flame',x:u.x+Math.cos(u.ang)*u.r,y:u.y+Math.sin(u.ang)*u.r,tx:t.x,ty:t.y,t:0,life:.3});sfx('flame',u.x,u.y);
  for(const e of[...units,...blds]){if(e.dead||e.team===u.team||e.fly||e.charge)continue;if(e.team===NEU&&e!==t&&e.aggro<=0)continue;
    if(e!==t&&Math.hypot(e.x-t.x,e.y-t.y)>d.splash+e.r)continue;damage(e,dmg*(e.kind==='bld'?d.bld:1),u);if(e.kind==='unit'&&!e.dead){e.burnT=3;e.burnD=5;e.burnSrc=u;}}}
function damage(t,dmg,src,dot){if(t.dead||t.invuln||t.charge)return;t.hp-=dmg;if(!dot)t.flash=.1;t.lastHit=gameTime;
  const live=src&&!src.dead&&src.team!=null&&src.team!==t.team;
  if(t.kind==='unit'&&live){if(t.state==='idle'&&canHit(t,src)){t.target=src;t.state='attack';t.amove=false;t.leash=stat(t,'sight')*1.6;t.ox=t.x;t.oy=t.y;}
    if(t.team===NEU)creepAggro(t,src);}
  if(t.team===PLAYER||(src&&src.team===PLAYER))combatT=4;
  if(t.team===PLAYER&&!dot&&gameTime-lastAlert>15&&!onScreen(t,-40)){lastAlert=gameTime;alertPos={x:t.x,y:t.y,t:gameTime};
    announce('Your colony is under attack (Space to jump there)','Our colony is under attack',15000);sfx('alert');pings.push({x:t.x,y:t.y,t:0,life:2.5,c:'alert'});}
  if(t.hp<=0)kill(t,src);}
function kill(t,src){t.dead=true;const kt=src&&src.team!=null?src.team:-1;
  if(t.kind==='unit'){const d=UNIT[t.type];
    fx.push(d.temp?{k:'puff',x:t.x,y:t.y,t:0,life:.5}:{k:'corpse',x:t.x,y:t.y,ang:t.ang,team:t.team,col:colOf(t.team),type:t.type,r:t.r,t:0,life:16});
    sfx('die',t.x,t.y);
    if(!d.temp&&teams[t.team].stats)teams[t.team].stats.lost++;
    if(!d.temp&&kt>=0&&teams[kt].stats)teams[kt].stats.killed++;
    if(src&&src.kind==='unit'&&!src.dead)giveXp(src,unitVal(t));
    if(d.creep&&kt>=0&&kt!==NEU){const T=teams[kt],bf=Math.round(d.bounty[0]*(t.bountyMult||1)),bh=Math.round(d.bounty[1]*(t.bountyMult||1));T.food+=bf;T.honey+=bh;floatTxt(t.x,t.y-20,`+${bf} food  +${bh} honeydew`);
      if(kt===PLAYER){toast(`${d.name} slain: +${bf} food, +${bh} honeydew`);sfx('research');}}
    if(d.hero){teams[t.team].princessDied=true;if(t.team===PLAYER)announce("Your Princess has fallen. Revive her at the Queen's Nest.",'Our Princess has fallen',2000);}}
  else{fx.push({k:'rubble',x:t.x,y:t.y,r:t.r,t:0,life:40});sfx('crumble',t.x,t.y);shake(.35,t);
    if(teams[t.team].stats)teams[t.team].stats.bldLost++;if(kt>=0&&teams[kt].stats)teams[kt].stats.bldKilled++;
    if(t.team===PLAYER&&t.type!=='nest')toast(BLD[t.type].name+' destroyed');}}
function giveXp(u,v){const d=UNIT[u.type];if(d.temp||d.creep)return;u.xp+=v;
  if(d.hero){while(u.lvl<5&&u.xp>=HERO_LVL[u.lvl]){u.lvl++;u.maxhp*=1.12;u.hp=u.maxhp;floatTxt(u.x,u.y-24,'Level '+u.lvl+'!');
      if(u.team===PLAYER){sfx('level');toast('Princess reached level '+u.lvl+(u.lvl===3?': Summon Swarm unlocked':u.lvl===5?": Queen's Resolve aura unlocked":''));}}}
  else while(u.rank<3&&u.xp>=VET[u.rank]){u.rank++;u.maxhp*=1.15;u.hp=Math.min(u.maxhp,u.hp*1.15+20);floatTxt(u.x,u.y-18,VET_NAME[u.rank]+'!','#ffe08a');if(u.team===PLAYER)sfx('level',u.x,u.y);}}

// ---------- abilities ----------
function doAbility(u,k,x,y,e){const A=ABIL[k];u.acd[k]=A.cd;u.revealT=2;
  switch(k){
    case 'rally':for(const a of units)if(a.team===u.team&&!a.dead&&(a.type==='soldier'||a===u)&&d2(a,u)<110*110){a.buffT=6;a.buffK='rally';}
      fx.push({k:'ring',x:u.x,y:u.y,t:0,life:.6,r:110,rgb:'224,80,62'});sfx('rally',u.x,u.y);break;
    case 'pool':{const C=colOf(u.team);projs.push({lob:true,pool:true,sx:u.x,sy:u.y,x:u.x,y:u.y,tx:x,ty:y,k:0,dur:Math.max(.4,Math.hypot(x-u.x,y-u.y)/260),h0:u.fly?15:80,team:u.team,dmg:0,src:u,splash:55,rgb:C.proj,rgb2:C.projHi});sfx('spit',u.x,u.y);break;}
    case 'charge':startCharge(u,x,y);break;
    case 'mark':marks.push({x,y,r:170,t:0,life:20,team:u.team});fx.push({k:'ring',x,y,t:0,life:.8,r:170,rgb:colOf(u.team).proj});break;
    case 'mend':for(const a of units)if(a.team===u.team&&!a.dead&&!UNIT[a.type].creep&&d2(a,u)<130*130)a.hp=Math.min(a.maxhp,a.hp+60);
      fx.push({k:'ring',x:u.x,y:u.y,t:0,life:.7,r:130,rgb:'139,195,74'});sfx('heal',u.x,u.y);break;
    case 'blaze':u.buffT=6;u.buffK='blaze';fx.push({k:'ring',x:u.x,y:u.y,t:0,life:.5,r:40,rgb:'255,140,40'});sfx('flame',u.x,u.y);break;
    case 'lunge':{if(!e||e.dead)return;const a=Math.atan2(u.y-e.y,u.x-e.x);u.x=e.x+Math.cos(a)*(e.r+u.r+2);u.y=e.y+Math.sin(a)*(e.r+u.r+2);
      damage(e,stat(u,'dmg')*3.5,u);if(!e.dead)e.stunT=1.5;u.target=e.dead?null:e;u.state=e.dead?'idle':'attack';u.amove=false;u.leash=0;
      fx.push({k:'boom',x:e.x,y:e.y,t:0,life:.4,r:30,rgb:'255,240,200',rgb2:'255,255,255'});sfx('bite',e.x,e.y);sfx('boom',e.x,e.y);break;}
    case 'swarm':for(let i=0;i<5;i++)spawnUnit(u.team,'swarmling',u.x+Math.cos(i*1.26)*30,u.y+Math.sin(i*1.26)*30);sfx('swarm',u.x,u.y);break;}}
function startCharge(u,x,y){const p=MAP.hasWater&&blockedAt(x,y)?nearestFree(x,y):{x,y};u.target=null;u.state='idle';u.orders=[];
  u.charge={sx:u.x,sy:u.y,tx:p.x,ty:p.y,k:0,dur:Math.max(.35,Math.hypot(p.x-u.x,p.y-u.y)/420)};sfx('charge',u.x,u.y);}
function updCharge(u,dt){const c=u.charge;c.k+=dt/c.dur;const k=Math.min(1,c.k);u.x=c.sx+(c.tx-c.sx)*k;u.y=c.sy+(c.ty-c.sy)*k;u.ang=Math.atan2(c.ty-c.sy,c.tx-c.sx);
  if(Math.random()<.7)fx.push({k:'dirt',x:u.x+(Math.random()-.5)*16,y:u.y+(Math.random()-.5)*16,t:0,life:1.4});
  if(c.k<1)return;u.charge=null;u.lx=u.x;u.ly=u.y;fx.push({k:'boom',x:u.x,y:u.y,t:0,life:.5,r:70,rgb:'160,120,70',rgb2:'210,180,130'});shake(.25,u);sfx('boom',u.x,u.y);
  const dmg=45*(1+u.rank*.12);
  for(const e of units){if(e.team===u.team||e.dead||e.fly)continue;const dd=dist(u,e);if(dd>70+e.r)continue;damage(e,dmg,u);
    if(!e.dead&&!UNIT[e.type].creep){const a=Math.atan2(e.y-u.y,e.x-u.x);e.x+=Math.cos(a)*50;e.y+=Math.sin(a)*50;e.stunT=Math.max(e.stunT,.6);}}
  for(const b of blds)if(b.team!==u.team&&!b.dead&&dist(u,b)<70+b.r)damage(b,60,u);}
function unleash(b,x,y){if(b.dead||!b.built||b.spT>0)return false;b.spT=BLD.spire.charge;
  for(let i=0;i<16;i++){const a=i/16*6.28,rr=30+Math.random()*50;let px=clamp(x+Math.cos(a)*rr,20,W-20),py=clamp(y+Math.sin(a)*rr,20,H-20);
    if(MAP.hasWater&&blockedAt(px,py)){const f=nearestFree(px,py);px=f.x;py=f.y;}const s=spawnUnit(b.team,'swarmling',px,py);s.ang=a;moveOrder(s,x,y,true);}
  fx.push({k:'ring',x,y,t:0,life:1.2,r:160,rgb:colOf(b.team).proj});sfx('swarm');shake(.3,{x,y});
  if(b.team!==PLAYER)announce('Enemy swarm unleashed!','Warning. Enemy swarm unleashed',2000);else say('Swarm unleashed',2000);
  return true;}

// ---------- structures ----------
function updBld(b,dt){const d=BLD[b.type],T=teams[b.team];b.flash-=dt;
  if(!b.built){if(b.started){const p=dt/d.time;b.prog+=p;b.hp=Math.min(b.maxhp,b.hp+b.maxhp*.9*p);if(b.prog>=1){b.prog=1;b.built=true;onBuilt(b);}}return;}
  if(d.farm)T.food+=d.farm*dt*T.mult;
  if(d.atk)towerAtk(b,dt);
  if(d.charge&&b.spT>0){b.spT-=dt;if(b.spT<=0){b.spT=0;spireReady(b);}}
  if(b.queue.length){const it=b.queue[0];
    if(UNIT[it]&&supUsed(b.team)+UNIT[it].sup>supCap(b.team)){
      if(!b.blocked&&b.team===PLAYER){if(supCap(PLAYER)>=MAXSUP)toast('Supply is maxed at 100');else announce('Need more supply. Build a Fungus Garden.','We require more fungus gardens',8000);}
      b.blocked=true;return;}
    b.blocked=false;b.qt+=dt;
    if(b.qt>=qTime(b,it)){b.qt=0;b.queue.shift();b.paid.shift();if(UNIT[it])spawnFrom(b,it);else finishUpg(b.team,it);}}}
function onBuilt(b){const d=BLD[b.type];if(d.charge){b.spT=d.charge;if(b.team!==PLAYER)announce(`Enemy Swarm Spire detected. It will be ready in ${fmtT(d.charge)}.`,'Warning. Enemy swarm spire detected',3000);}
  if(b.team===PLAYER){announce(d.name+' complete','Construction complete',3000);sfx('build',b.x,b.y);}}
function spireReady(b){if(b.team===PLAYER)announce('Swarm Spire ready. Select it and pick a target.','Swarm spire ready',2000);
  else announce('Warning: an enemy Swarm Spire is ready to fire','Warning. Enemy swarm ready',2000);}
function towerAtk(b,dt){const a=BLD[b.type].atk,T=teams[b.team],rng=a.range*(T.up.acid?1.2:1);b.cd-=dt;
  if(!b.tgt||b.tgt.dead||b.tgt.charge||dist(b,b.tgt)-b.tgt.r>rng){b.tgt=null;let bd=rng;
    for(const e of units){if(e.team===b.team||e.dead||e.charge)continue;if(e.team===NEU&&e.aggro<=0)continue;if(e.inGrass&&e.revealT<=0)continue;const dd=dist(b,e)-e.r;if(dd<bd){bd=dd;b.tgt=e;}}}
  if(b.tgt){b.ang=Math.atan2(b.tgt.y-b.y,b.tgt.x-b.x);if(b.cd<=0){b.cd=a.cd;
    projs.push({x:b.x+Math.cos(b.ang)*b.r*.7,y:b.y+Math.sin(b.ang)*b.r*.7,t:b.tgt,team:b.team,dmg:a.dmg*(T.up.acid?1.25:1)*(fac(b.team).towerMult||1),src:b,trail:[],rgb:colOf(b.team).proj});sfx('spit',b.x,b.y);}}}
function finishUpg(t,k){teams[t].up[k]=true;
  if(k==='carapace')for(const u of units)if(u.team===t&&u.type!=='worker'&&!UNIT[u.type].temp){u.hp*=1.25;u.maxhp*=1.25;}
  if(t===PLAYER){announce(UPG[k].name+' researched','Research complete',3000);sfx('research');}}
function spawnFrom(b,type){let a=b.rally?Math.atan2(b.rally.y-b.y,b.rally.x-b.x):Math.atan2(H/2-b.y,W/2-b.x);a+=(Math.random()-.5)*.7;
  let x=b.x+Math.cos(a)*(b.r+10),y=b.y+Math.sin(a)*(b.r+10);if(MAP.hasWater&&blockedAt(x,y)){const f=nearestFree(x,y);x=f.x;y=f.y;}
  const u=spawnUnit(b.team,type,x,y),T=teams[b.team];u.ang=a;T.stats.trained++;
  if(UNIT[type].hero)T.princessDied=false;
  const r=b.rally,re=r&&r.e&&!r.e.dead?r.e:null;
  if(type==='worker'){if(re&&re.kind==='food')u.food=re,u.state='gather';else if(r&&!r.e)moveOrder(u,r.x,r.y,false);else u.state='gather';}
  else if(re&&re.team!==b.team&&re.kind!=='food')moveOrder(u,re.x,re.y,true);
  else if(r)moveOrder(u,r.x+(Math.random()-.5)*30,r.y+(Math.random()-.5)*30,false);
  else moveOrder(u,b.x+Math.cos(a)*(b.r+55),b.y+Math.sin(a)*(b.r+55),false);
  if(b.team===PLAYER){sfx('ready',b.x,b.y);if(UNIT[type].hero)announce('The Princess is ready for battle','Princess ready',1000);else say('Unit ready',6000);}}
function canPlace(x,y,r){if(x<r+10||y<r+10||x>W-r-10||y>H-r-10)return false;
  for(const b of blds)if(!b.dead&&Math.hypot(b.x-x,b.y-y)<b.r+r+14)return false;
  for(const f of foods)if(!f.dead&&Math.hypot(f.x-x,f.y-y)<f.r+r+12)return false;
  if(MAP.hasWater){if(blockedAt(x,y))return false;for(let a=0;a<8;a++)if(blockedAt(x+Math.cos(a*.785)*r,y+Math.sin(a*.785)*r))return false;}
  return true;}

// ---------- physics ----------
function separate(){
  for(let i=0;i<units.length;i++){const a=units[i];if(a.dead||a.charge)continue;
    for(let j=i+1;j<units.length;j++){const b=units[j];if(b.dead||b.charge||b.fly!==a.fly)continue;
      if(!a.fly&&a.type==='worker'&&b.type==='worker'&&a.team===b.team&&(a.state!=='idle'||b.state!=='idle'))continue;
      const dx=b.x-a.x,dy=b.y-a.y,m=a.r+b.r;if(Math.abs(dx)>m||Math.abs(dy)>m)continue;
      const d=Math.hypot(dx,dy)||.01;if(d<m){const p=(m-d)*(a.fly?.2:.25);a.x-=dx/d*p;a.y-=dy/d*p;b.x+=dx/d*p;b.y+=dy/d*p;}}
    if(!a.fly)for(const b of blds){if(b.dead)continue;const dx=a.x-b.x,dy=a.y-b.y,m=b.r+a.r-3;if(Math.abs(dx)>m||Math.abs(dy)>m)continue;
      const d=Math.hypot(dx,dy)||.01;if(d<m){a.x=b.x+dx/d*m;a.y=b.y+dy/d*m;}}
    a.x=clamp(a.x,8,W-8);a.y=clamp(a.y,8,H-8);}
  if(MAP.hasWater)for(const a of units){if(a.dead||a.fly||a.charge)continue;
    if(blockedAt(a.x,a.y)){if(!blockedAt(a.lx,a.ly)){a.x=a.lx;a.y=a.ly;}else{const f=nearestFree(a.x,a.y);a.x=f.x;a.y=f.y;}}a.lx=a.x;a.ly=a.y;}}
function updProjs(dt){for(const p of projs){
    if(p.lob){p.k+=dt/p.dur;if(p.k>=1){p.dead=true;if(p.pool)pools.push({x:p.tx,y:p.ty,r:p.splash,team:p.team,t:0,life:6,dps:12,src:p.src,rgb:p.rgb});else explode(p);}
      else{p.x=p.sx+(p.tx-p.sx)*p.k;p.y=p.sy+(p.ty-p.sy)*p.k;}continue;}
    const t=p.t;if(t.dead){p.dead=true;continue;}
    p.trail.push(p.x,p.y);if(p.trail.length>10)p.trail.splice(0,2);
    const dx=t.x-p.x,dy=t.y-p.y,L=Math.hypot(dx,dy),s=300*dt;
    if(L<=s+t.r*.5){damage(t,p.dmg,p.src);fx.push({k:'splash',x:t.x,y:t.y,t:0,life:.35,rgb:p.rgb});p.dead=true;}
    else{p.x+=dx/L*s;p.y+=dy/L*s;}}
  projs=projs.filter(p=>!p.dead);}
function explode(p){for(const arr of[units,blds])for(const e of arr){if(e.dead||e.team===p.team||e.fly||e.charge)continue;const dd=Math.hypot(e.x-p.tx,e.y-p.ty)-e.r;
    if(dd<p.splash)damage(e,p.dmg*(e.kind==='bld'?p.bld:1)*(dd<p.splash*.4?1:.6),p.src);}
  fx.push({k:'boom',x:p.tx,y:p.ty,t:0,life:.6,r:p.splash,rgb:p.rgb,rgb2:p.rgb2});sfx('boom',p.tx,p.ty);}
function updPools(dt){for(const p of pools){p.t+=dt;for(const e of units){if(e.dead||e.fly||e.team===p.team||e.charge)continue;
    if(Math.hypot(e.x-p.x,e.y-p.y)<p.r+e.r*.5)damage(e,p.dps*dt,p.src,true);}}
  pools=pools.filter(p=>p.t<p.life);}

// ---------- weather & the giant foot ----------
function updWorld(dt){const w=weather;
  if(!w.rain&&gameTime>=w.next){w.rain=true;w.start=gameTime;w.end=gameTime+45;announce('Rain is coming. Ants off the pheromone trails will slow down.','Rain is coming',1000);rainSound(true);}
  else if(w.rain&&gameTime>=w.end){w.rain=false;w.stop=gameTime;w.next=gameTime+200+Math.random()*160;rainSound(false);toast('The rain has stopped');}
  if(!foot&&gameTime>=w.footNext){w.footNext=gameTime+150+Math.random()*150;
    const cand=units.filter(u=>!u.dead&&u.team!==NEU&&!u.fly);
    if(cand.length){const c=cand[Math.random()*cand.length|0];foot={x:clamp(c.x+(Math.random()-.5)*120,110,W-110),y:clamp(c.y+(Math.random()-.5)*120,110,H-110),r:110,t:0,warn:4.5,rot:Math.random()*6.28};
      const mine=units.some(u=>u.team===PLAYER&&!u.dead&&Math.hypot(u.x-foot.x,u.y-foot.y)<foot.r+60)||blds.some(b=>b.team===PLAYER&&!b.dead&&Math.hypot(b.x-foot.x,b.y-foot.y)<foot.r+b.r);
      if(mine){announce('A footstep is coming down! Move your ants out of the shadow!','Footstep incoming',1000);pings.push({x:foot.x,y:foot.y,t:0,life:3,c:'alert'});}}}
  if(foot){foot.t+=dt;if(!foot.done&&foot.t>=foot.warn){foot.done=true;stomp(foot);}if(foot.t>=foot.warn+3)foot=null;}}
function stomp(f){sfx('stomp');shake(.7);fx.push({k:'crater',x:f.x,y:f.y,r:f.r,rot:f.rot,t:0,life:30});
  for(const u of units)if(!u.dead&&!u.fly&&Math.hypot(u.x-f.x,u.y-f.y)<f.r+u.r*.5)damage(u,350,null);
  for(const b of blds)if(!b.dead&&Math.hypot(b.x-f.x,b.y-f.y)<f.r+b.r*.5)damage(b,300,null);}

// ---------- wild creature lairs: cleared camps come back after a while, if nobody is camping on them ----------
const LAIR_RESPAWN=270,LAIR_BOUNTY=.6;
function updLairs(){let back=0;
  for(const L of lairs){if(!L.unit.dead){continue;}if(L.deadAt==null){L.deadAt=gameTime;continue;}if(gameTime-L.deadAt<LAIR_RESPAWN)continue;
    if(units.some(u=>u.team!==NEU&&!u.dead&&Math.hypot(u.x-L.x,u.y-L.y)<260)||blds.some(b=>!b.dead&&Math.hypot(b.x-L.x,b.y-L.y)<300+b.r))continue;
    L.unit=spawnUnit(NEU,L.type,L.x,L.y);L.unit.bountyMult=LAIR_BOUNTY;L.deadAt=null;pings.push({x:L.x,y:L.y,t:0,life:4,c:'creep'});back++;}
  if(back)toast('Wild creatures have returned to their lair');}

// ---------- vision ----------
function computeVis(){const src=[],rain=weather&&weather.rain?.75:1;
  for(const u of units)if(u.team===PLAYER&&!u.dead)src.push(u.x,u.y,stat(u,'sight'));
  for(const b of blds)if(b.team===PLAYER&&!b.dead&&(b.built||b.started))src.push(b.x,b.y,BLD[b.type].sight*rain);
  for(const m of marks)if(m.team===PLAYER)src.push(m.x,m.y,m.r);
  const chk=e=>{for(let i=0;i<src.length;i+=3){const dx=e.x-src[i],dy=e.y-src[i+1],r=src[i+2]+e.r;if(dx*dx+dy*dy<r*r)return true;}return false;};
  const near=e=>units.some(u=>u.team===PLAYER&&!u.dead&&d2(u,e)<75*75);
  for(const u of units)if(u.team!==PLAYER)u.vis=!u.charge&&chk(u)&&!(u.inGrass&&u.revealT<=0&&!near(u));
  for(const b of blds)if(b.team!==PLAYER){b.vis=chk(b);if(b.vis)b.seen=true;}
  visSrc=src;return src;}
function pointVisible(x,y){for(let i=0;i<visSrc.length;i+=3)if((x-visSrc[i])**2+(y-visSrc[i+1])**2<visSrc[i+2]**2)return true;return false;}

// ---------- game flow ----------
function sampleStats(){stats.samples.push({t:gameTime,army:teams.filter(T=>!T.neutral).map(T=>{let s=0;for(const u of units)if(u.team===T.id&&!u.dead&&u.type!=='worker'&&!UNIT[u.type].temp)s+=UNIT[u.type].sup;return s;})});}
function checkElim(){for(const T of teams){if(T.neutral||!T.alive||T.noNest)continue;if(blds.some(b=>b.team===T.id&&b.type==='nest'&&!b.dead))continue;T.alive=false;
    if(T.id===PLAYER)continue;
    for(const u of units)if(u.team===T.id&&!u.dead){u.dead=true;fx.push({k:'corpse',x:u.x,y:u.y,ang:u.ang,team:u.team,col:T.col,type:u.type,r:u.r,t:0,life:16});}
    for(const b of blds)if(b.team===T.id&&!b.dead){b.dead=true;fx.push({k:'rubble',x:b.x,y:b.y,r:b.r,t:0,life:40});}
    announce(`The ${T.name} colony has been eliminated`,`${T.name} colony eliminated`,1000);}}
function update(dt){gameTime+=dt;combatT-=dt;shakeT=Math.max(0,shakeT-dt);
  auras();
  for(const u of units)if(!u.dead)updUnit(u,dt);
  for(const b of blds)if(!b.dead)updBld(b,dt);
  separate();updProjs(dt);updPools(dt);
  for(const f of fx)f.t+=dt;fx=fx.filter(f=>f.t<f.life);
  for(const p of pings)p.t+=dt;pings=pings.filter(p=>p.t<p.life);
  for(const m of marks)m.t+=dt;marks=marks.filter(m=>m.t<m.life);
  for(const f of foods)if(f.regen&&f.amt<f.max)f.amt=Math.min(f.max,f.amt+f.regen*dt);
  foods=foods.filter(f=>!f.dead);
  for(const T of teams)if(T.ai&&T.alive)updAI(T,dt);
  updWorld(dt);updLairs();
  units=units.filter(u=>!u.dead);blds=blds.filter(b=>!b.dead);
  const before=sel.length;sel=sel.filter(e=>!e.dead);if(before&&!sel.length){buildMenu=false;tmode=null;}
  if(gameTime>=stats.next){stats.next+=5;sampleStats();}
  checkElim();
  if(!teams[PLAYER].alive){endGame(false);return;}
  if(mission){const r=mission.tick(dt);if(r)endGame(r==='win');return;}
  if(teams.every(T=>T.neutral||T.id===PLAYER||!T.alive))endGame(true);}

function initGame(conf){cfg=conf;mission=conf.mission||null;
  const np=conf.players.length;
  MAP=genMap(conf.map,conf.seed,np);W=MAP.W;H=MAP.H;GR=makeGround(MAP);
  units=[];blds=[];foods=[];projs=[];fx=[];pings=[];pools=[];marks=[];sel=[];groups={};
  gameTime=0;nextId=1;tmode=null;buildMenu=false;boxMode=false;gameOver=false;paused=false;lastAlert=-99;alertPos=null;foot=null;combatT=0;shakeT=0;
  teams=conf.players.map((p,i)=>({id:i,fac:p.fac,col:COLORS[p.fac],name:FACTIONS[p.fac].short,food:conf.res.food,honey:conf.res.honey,up:{},
    ai:p.ai?makeAI(p.ai.diff,p.ai.pers):null,mult:p.ai?DIFF[p.ai.diff].mult:1,alive:true,noNest:!!p.noNest,princessDied:false,slot:p.slot!=null?p.slot:i,
    stats:{gathered:0,honey:0,trained:0,killed:0,lost:0,bldLost:0,bldKilled:0}}));
  NEU=teams.length;teams.push({id:NEU,neutral:true,up:{},alive:true,mult:1,col:null,stats:null,food:0,honey:0,name:'Wild'});
  for(const[x,y,a,k]of MAP.foods)addFood(x,y,a,k);
  for(const[x,y]of MAP.aphids)addFood(x,y,1200,'aphid');
  conf.players.forEach((p,i)=>{if(p.noBase)return;const s=MAP.starts[teams[i].slot];const n=makeBld(i,'nest',s.x,s.y,true);
    for(let k=0;k<5;k++){const a=Math.atan2(H/2-n.y,W/2-n.x)+(k-2)*.45;const u=spawnUnit(i,'worker',n.x+Math.cos(a)*(n.r+14),n.y+Math.sin(a)*(n.r+14));u.ang=a;u.state='gather';}});
  lairs=[];if(conf.creeps!==false)for(const c of MAP.creeps){const p=blockedAt(c.x,c.y)?nearestFree(c.x,c.y):c;lairs.push({type:c.type,x:p.x,y:p.y,unit:spawnUnit(NEU,c.type,p.x,p.y),deadAt:null});}
  if(!conf.creepRespawn)lairs=[];
  const wOn=conf.weather!==false;
  weather={rain:false,start:-99,stop:-99,next:wOn?(conf.weatherNext||240+Math.random()*120):1e9,footNext:wOn&&!conf.noFoot?330+Math.random()*120:1e9};
  stats={samples:[],next:0};
  if(mission&&mission.setup)mission.setup();
  cam.z=vw<700?.75:1;const home=blds.find(b=>b.team===PLAYER&&b.type==='nest')||units.find(u=>u.team===PLAYER)||MAP.starts[0];centerOn(home.x,home.y);}
