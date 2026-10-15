'use strict';
// ---------- computer opponents ----------
function makeAI(dk,pk){if(!PERS[pk]){const ks=Object.keys(PERS);pk=ks[Math.random()*ks.length|0];}const D=DIFF[dk],P=PERS[pk];
  return{t:Math.random()*.8,dk,pk,D,P,waveSize:Math.max(3,Math.round(D.wave*P.wave)),grace:D.grace*P.grace,spireAt:D.spireT*P.spire,noAttack:false,noBuild:false,noSpire:false};}
function aiPlace(T,type,origin,workers,dmin,dmax,dir){const d=BLD[type],c=costOf(T.id,type);if(!canPay(T.id,c))return false;
  const base=dir!=null?dir:Math.atan2(H/2-origin.y,W/2-origin.x);
  for(let k=0;k<60;k++){const a=base+(Math.random()-.5)*2.6,dd=dmin+Math.random()*(dmax-dmin),x=origin.x+Math.cos(a)*dd,y=origin.y+Math.sin(a)*dd;
    if(!canPlace(x,y,d.r))continue;pay(T.id,c);const b=makeBld(T.id,type,x,y,false);
    const free=workers.filter(w=>w.state!=='build'),w=nearestOf(free.length?free:workers,b);if(w){w.state='build';w.target=b;w.orders=[];}return true;}
  return false;}
function aiFoes(id){return teams.filter(T=>!T.neutral&&T.id!==id&&T.alive&&blds.some(b=>b.team===T.id&&!b.dead));}
function aiPickTarget(T,from){let best=null,bd=1e18;for(const F of aiFoes(T.id)){const n=blds.find(b=>b.team===F.id&&b.type==='nest'&&!b.dead)||blds.find(b=>b.team===F.id&&!b.dead);
    const d=d2(n,from)*(.8+Math.random()*.4);if(d<bd){bd=d;best=n;}}return best;}
function aiOutpostSpot(nest){let best=null,bd=1400*1400;
  for(const f of foods){if(f.dead||f.ftype==='aphid'||f.amt<500)continue;if(blds.some(b=>!b.dead&&d2(b,f)<380*380))continue;const d=d2(f,nest);if(d<bd){bd=d;best=f;}}return best;}
function aiAbilities(T,army){const p=T.ai.D.abil;
  for(const u of army){if(Math.random()>p||u.charge)continue;const d=UNIT[u.type],t=u.target,rd=k=>(u.acd[k]||0)<=0;
    if(d.abil==='mend'){if(rd('mend')){let n=0;for(const a of army)if(a.hp<a.maxhp*.7&&d2(a,u)<130*130)n++;if(n>=3)doAbility(u,'mend');}continue;}
    if(u.state!=='attack'||!t||t.dead)continue;const dd=dist(u,t);
    if(d.abil==='rally'&&rd('rally')&&army.filter(a=>a.type==='soldier'&&d2(a,u)<110*110).length>=2)doAbility(u,'rally');
    else if(d.abil==='pool'&&rd('pool')&&dd<ABIL.pool.range&&t.kind==='unit'&&!t.fly)doAbility(u,'pool',t.x,t.y);
    else if(d.abil==='charge'&&rd('charge')&&dd>90&&dd<ABIL.charge.range)doAbility(u,'charge',t.x,t.y);
    else if(d.abil==='blaze'&&rd('blaze')&&dd<120)doAbility(u,'blaze');
    else if(d.abil==='lunge'&&rd('lunge')&&dd<ABIL.lunge.range&&t.kind==='unit')doAbility(u,'lunge',t.x,t.y,t);
    if(d.abil2==='swarm'&&u.lvl>=3&&rd('swarm'))doAbility(u,'swarm');}}
function updAI(T,dt){const ai=T.ai;ai.t+=dt;if(ai.t<.8)return;ai.t=0;const id=T.id,D=ai.D,P=ai.P;
  const mine=units.filter(u=>u.team===id&&!u.dead),workers=mine.filter(u=>u.type==='worker'),army=mine.filter(u=>u.type!=='worker'&&!UNIT[u.type].temp);
  const myB=blds.filter(b=>b.team===id&&!b.dead),count=t=>myB.filter(b=>b.type===t).length;
  aiAbilities(T,army);
  if(!ai.noSpire)for(const sp of myB)if(sp.type==='spire'&&sp.built&&sp.spT<=0){const tg=aiPickTarget(T,sp);if(tg)unleash(sp,tg.x,tg.y);}
  const nest=myB.find(b=>b.type==='nest');if(!nest)return;
  // economy
  for(const w of workers)if(w.state==='idle'){w.state='gather';w.food=null;}
  if(!ai.noBuild){
    const honeyW=workers.filter(w=>w.food&&w.food.ftype==='aphid').length,wantHoney=hasBuilt(id,'chamber')?Math.ceil(workers.length*.3):0;
    if(honeyW<wantHoney){const aph=nearestRes(nest,true,900);if(aph){const w=workers.find(w=>w.state==='gather'&&!w.carry&&(!w.food||w.food.ftype!=='aphid'));if(w)w.food=aph;}}
    const wantW=Math.round(D.workers*P.workers)+count('outpost')*4;let qW=0;for(const b of myB)for(const it of b.queue)if(it==='worker')qW++;
    for(const n of myB)if(BLD[n.type].drop&&n.built&&workers.length+qW<wantW&&n.queue.length<2&&T.food>=50&&enqueue(n,'worker'))qW++;
    const cap=supCap(id);let qsup=0;for(const b of myB)for(const it of b.queue)if(UNIT[it])qsup+=UNIT[it].sup;const used=supUsed(id)+qsup;
    // pick the next structure; if it can't be afforded yet, hold back food for it instead of spending on units
    let save={f:0,h:0};
    if(workers.length>=3){
      const nCh=Math.max(P.earlyChamber?1:0,D.chambers.filter(t=>gameTime>=t*(P.earlyChamber?.5:1)).length);
      const nTw=Math.max(0,D.towers.filter(t=>gameTime>=t).length+(gameTime>200?P.towers:Math.min(0,P.towers)));
      const nearFood=foods.filter(f=>!f.dead&&f.ftype!=='aphid'&&d2(f,nest)<650*650).reduce((s,f)=>s+f.amt,0);
      const wantOut=count('outpost')<2&&(gameTime>=P.outpostT&&count('outpost')<(ai.pk==='expander'?2:1)||gameTime>200&&nearFood<600);
      const pending=t=>myB.some(b=>b.type===t&&!b.built);let want=null,spot=null;
      if(cap<MAXSUP&&cap-used<6&&!pending('garden'))want=['garden',nest,90,200];
      else if(count('chamber')<nCh&&!pending('chamber'))want=['chamber',nest,110,220];
      else if(gameTime>=D.pitT*(ai.pk==='turtle'?.8:1)&&count('pit')<1&&hasBuilt(id,'chamber'))want=['pit',nest,100,210];
      else if(gameTime>=D.vaultT&&count('vault')<1&&hasBuilt(id,'pit'))want=['vault',nest,110,230];
      else if(count('tower')<nTw&&hasBuilt(id,'chamber')&&!pending('tower'))want=['tower',nest,130,210];
      else if(wantOut&&!pending('outpost')&&(spot=aiOutpostSpot(nest)))want=['outpost',spot,spot.r+45,spot.r+95,Math.atan2(nest.y-spot.y,nest.x-spot.x)];
      else if(gameTime>=ai.spireAt&&!ai.noSpire&&count('spire')<1&&hasBuilt(id,'vault'))want=['spire',nest,100,200];
      if(want){const c=costOf(id,want[0]);if(canPay(id,c))aiPlace(T,want[0],want[1],workers,want[2],want[3],want[4]);else save=c;}}
    for(const c of myB)if(!c.built&&!c.started&&!workers.some(w=>w.state==='build'&&w.target===c)){const w=nearestOf(workers,c);if(w){w.state='build';w.target=c;}}
    const pit=myB.find(b=>b.type==='pit'&&b.built);
    if(pit&&!pit.queue.length){const k=BLD.pit.research.find(k=>!T.up[k]);if(k){const c=costOf(id,k);if(T.food>=c.f+120&&T.honey>=c.h)enqueue(pit,k);}}
    const reserve=workers.length<wantW?50:0;let free=cap-used;
    const foeFly=units.filter(u=>u.team!==id&&u.team!==NEU&&u.fly&&!u.dead).length>2;
    const prio={vault:0,nest:1,chamber:2};
    for(const c of myB.slice().sort((a,b)=>(prio[a.type]??9)-(prio[b.type]??9))){if(!c.built||c.queue.length>=2)continue;let ty=null;
      if(c.type==='chamber'){const r=Math.random(),lp=hasBuilt(id,'pit');ty=lp&&r<(foeFly?.4:.12)?'lancer':r<.55?'soldier':r<.85?'spitter':army.length>=5?'nurse':'soldier';}
      else if(c.type==='vault')ty=Math.random()<.45?'bomb':fac(id).unique;
      else if(c.type==='nest'&&hasBuilt(id,'pit')&&ai.dk!=='easy'&&!princessBusy(id)&&T.food>=400)ty='princess';
      else continue;
      const cc=costOf(id,ty);if(T.food-reserve-save.f>=cc.f&&T.honey-save.h>=cc.h&&free>=UNIT[ty].sup&&reqMet(id,UNIT[ty].req)&&enqueue(c,ty))free-=UNIT[ty].sup;}}
  // army: finished wave units push on to the next enemy structure
  for(const a of army)if(a.wave&&a.state==='idle'){const tb=nearestOf(blds.filter(b=>b.team!==id&&!b.dead),a);if(tb&&d2(tb,a)<1500*1500)issue(a,{t:'amove',x:tb.x,y:tb.y});else a.wave=false;}
  let threat=null;
  outer:for(const e of units){if(e.team===id||e.team===NEU||e.dead||e.charge)continue;for(const b of myB)if(d2(e,b)<420*420){threat=e;break outer;}}
  if(threat){for(const a of army)if(a.state!=='attack'&&!a.wave&&!a.guard&&d2(a,nest)<1100*1100)issue(a,{t:'amove',x:threat.x,y:threat.y});return;}
  if(!ai.noAttack){const home=army.filter(a=>(a.state==='idle'||a.state==='move')&&!a.wave&&!a.guard);
    if(home.length>=ai.waveSize&&gameTime>ai.grace){const tgt=aiPickTarget(T,nest);
      if(tgt){for(const a of home){a.wave=true;issue(a,{t:'amove',x:tgt.x+(Math.random()-.5)*60,y:tgt.y+(Math.random()-.5)*60});}
        ai.waveSize=Math.min(36,ai.waveSize+D.waveInc);
        if(tgt.team===PLAYER)announce(`A ${T.name.toLowerCase()} army is marching on your colony`,'Warning. Enemy forces approaching',20000);}
      return;}}
  const ra=Math.atan2(H/2-nest.y,W/2-nest.x),rx=nest.x+Math.cos(ra)*230,ry=nest.y+Math.sin(ra)*230;
  for(const a of army)if(a.state==='idle'&&!a.wave&&!a.guard&&(a.x-rx)**2+(a.y-ry)**2>110*110)moveOrder(a,rx+(Math.random()-.5)*100,ry+(Math.random()-.5)*100,false);}
