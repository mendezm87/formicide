'use strict';
// ---------- campaign ----------
const CAMP_DIFF={easy:{ai:'easy',scale:.7},normal:{ai:'normal',scale:1},hard:{ai:'hard',scale:1.3}};
function mSpawn(team,type,x,y,n,spread){const out=[];for(let i=0;i<n;i++){const a=Math.random()*6.28,r=Math.random()*(spread||40);
  let px=clamp(x+Math.cos(a)*r,20,W-20),py=clamp(y+Math.sin(a)*r,20,H-20);if(MAP.hasWater&&blockedAt(px,py)){const f=nearestFree(px,py);px=f.x;py=f.y;}
  out.push(spawnUnit(team,type,px,py));}return out;}
const teamUnits=(t,type)=>units.filter(u=>u.team===t&&!u.dead&&(!type||u.type===type));
const MISSIONS=[
  {name:'First Forage',sub:'Learn the basics and fend off a raid.',
    brief:'Our young colony has broken ground in a quiet garden. Gather food, raise a War Chamber and train Soldiers. Scouts report red raiders nearby, so be ready to defend the Queen.',
    tip:'Select your workers and right-click a food pile to send them there. Select the nest to train more workers.',
    make(cd){const s={};return{
      conf:{map:'clearing',seed:11,players:[{fac:'black'},{fac:'red',noBase:true,noNest:true}],res:{food:200,honey:0},weather:false,creeps:false},
      obj:[{text:()=>`Gather 300 food (${Math.min(300,Math.floor(teams[0].stats.gathered))}/300)`},{text:'Build a War Chamber'},
        {text:()=>`Train 4 Soldiers (${Math.min(4,teamUnits(0,'soldier').length)}/4)`},{text:'Destroy the red raiders',hidden:true}],
      setup(){setTimeout(()=>toast('Workers gather on their own. Build a Fungus Garden for supply, then a War Chamber.'),1500);},
      tick(){const o=this.obj;if(teams[0].stats.gathered>=300)o[0].done=true;if(hasBuilt(0,'chamber'))o[1].done=true;if(teamUnits(0,'soldier').length>=4)o[2].done=true;
        if(!s.raid&&o[0].done&&o[1].done&&o[2].done){s.raid=true;o[3].hidden=false;const st=MAP.starts[0];
          [...mSpawn(1,'soldier',W-200,200,Math.round(5*cd.scale),60),...mSpawn(1,'spitter',W-200,200,2,60)].forEach(u=>issue(u,{t:'amove',x:st.x,y:st.y}));
          announce('Red raiders are coming for the nest! Defend it!','Warning. Enemy forces approaching',1000);pings.push({x:W-200,y:200,t:0,life:3,c:'alert'});}
        if(s.raid&&!teamUnits(1).length){o[3].done=true;return'win';}}};}},
  {name:'Hold the Line',sub:'Survive 8 minutes of red waves.',
    brief:"The red colony has found us. Their Queen's Nest is sheltered by thorns, so we cannot strike back yet, and her armies will come in waves. Dig in: build Acid Towers, research upgrades, and keep the Queen alive for 8 minutes.",
    tip:'Acid Towers and Spitters can hit the flying Sky Lancers. Melee ants cannot.',
    make(cd){const s={next:75,n:0},END=480;return{
      conf:{map:'clearing',seed:22,players:[{fac:'black'},{fac:'red',ai:{diff:cd.ai,pers:'turtle'}}],res:{food:300,honey:100},weather:true,weatherNext:150,noFoot:true,creeps:false},
      obj:[{text:()=>gameTime<END?`Survive until 8:00 (${fmtT(END-gameTime)} left)`:'Survived!'},{text:"Keep your Queen's Nest alive"}],
      setup(){teams[1].ai.noAttack=true;teams[1].ai.noSpire=true;blds.find(b=>b.team===1&&b.type==='nest').invuln=true;
        // the colony starts dug in: a War Chamber, a Fungus Garden and two Acid Towers facing the enemy
        const n=blds.find(b=>b.team===0&&b.type==='nest'),a=Math.atan2(H/2-n.y,W/2-n.x),at=(d,o)=>({x:n.x+Math.cos(a+o)*d,y:n.y+Math.sin(a+o)*d});
        for(const[t,d,o]of[['chamber',120,-1.2],['garden',115,1.3],['tower',190,-.35],['tower',190,.45]]){const p=at(d,o);makeBld(0,t,p.x,p.y,true);}},
      tick(){if(gameTime>=s.next){s.n++;s.next+=60;const n=s.n,k=cd.scale,st=MAP.starts[1],x=st.x-80,y=st.y+90;
          const us=[...mSpawn(1,'soldier',x,y,Math.round((1+n)*k)),...mSpawn(1,'spitter',x,y,Math.round(n/2*k))];
          if(n>=5)us.push(...mSpawn(1,'bomb',x,y,Math.round((n-4)*k)));if(n>=7)us.push(...mSpawn(1,'inferno',x,y,Math.round(k)));if(n===3||n===5||n===7)us.push(...mSpawn(1,'lancer',x,y,Math.round(2*k)));
          us.forEach(u=>issue(u,{t:'amove',x:MAP.starts[0].x,y:MAP.starts[0].y}));announce(`Wave ${n} incoming`,'Warning. Enemy forces approaching',1000);}
        if(gameTime>=END){this.obj[0].done=this.obj[1].done=true;return'win';}}};}},
  {name:'Puddle Crossing',sub:'Destroy the red nest across the water.',
    brief:"A chain of rain puddles splits the garden, and only three crossings remain. Wild creatures guard them. The aphid herds near our nest produce honeydew, which we need for advanced ants. Tend them, build an army, and destroy the red Queen's Nest.",
    tip:'Ants standing on the high-ground mounds at the crossings see further, and ranged ants there shoot further.',
    make(cd){const s={};return{
      conf:{map:'puddles',seed:33,players:[{fac:'black'},{fac:'red',ai:{diff:cd.ai,pers:'balanced'}}],res:{food:200,honey:50},weather:true,creeps:true},
      obj:[{text:"Destroy the red Queen's Nest"},{text:'Optional: slay the Stag Beetle at the center crossing',opt:true}],
      setup(){s.beetle=units.find(u=>u.type==='beetle');setTimeout(()=>toast('Aphid herds (green bugs) give honeydew. Send a few workers to milk them.'),1500);},
      tick(){if(s.beetle&&s.beetle.dead)this.obj[1].done=true;if(!teams[1].alive){this.obj[0].done=true;return'win';}}};}},
  {name:'Royal Escort',sub:'Guide the Princess through enemy land.',
    brief:'Our Warrior Princess must reach the Royal Mound to found a new colony. The path through Tall Grass Valley is crawling with red patrols. Use the grass to hide, keep your Nurses close, and do not let her fall.',
    tip:'Select the Princess and press D to lunge at an enemy. Ants hidden in tall grass are invisible until enemies get close.',
    make(cd){const s={next:40,n:0},k=cd.scale;return{
      conf:{map:'grass',seed:44,players:[{fac:'black',noBase:true,noNest:true},{fac:'red',noBase:true,noNest:true}],res:{food:0,honey:0},weather:true,noFoot:true,creeps:true},
      obj:[{text:'Escort the Princess to the Royal Mound (top right)'},{text:'The Princess must survive'},{text:'Optional: reach the Old Root for reinforcements',opt:true}],
      setup(){const st=MAP.starts[0];s.p=spawnUnit(0,'princess',st.x,st.y);s.p.xp=130;s.p.lvl=2;s.p.maxhp*=1.12;s.p.hp=s.p.maxhp;
        mSpawn(0,'soldier',st.x+50,st.y-50,6,50);mSpawn(0,'spitter',st.x,st.y-20,2,40);mSpawn(0,'nurse',st.x-20,st.y+20,2,30);
        this.goal={x:W-230,y:230,r:110};this.cp={x:W*.42,y:H*.5,r:140};
        // red squads: some stand guard, some patrol between two points
        const g=(x,y,sol,spi,ex,pt)=>{const us=[...mSpawn(1,'soldier',x,y,Math.round(sol*k),55),...mSpawn(1,'spitter',x,y,Math.round(spi*k),55),...(ex?mSpawn(1,ex[0],x,y,ex[1],40):[])];
          if(pt)us.forEach(u=>issue(u,{t:'patrol',x:pt[0]+(Math.random()-.5)*50,y:pt[1]+(Math.random()-.5)*50}));};
        g(W*.22,H*.62,4,2);g(W*.36,H*.3,4,2,null,[W*.28,H*.52]);g(W*.5,H*.56,5,3,['bomb',1]);g(W*.56,H*.3,4,2,null,[W*.68,H*.5]);
        g(W*.7,H*.68,4,3,['inferno',1]);g(W*.8,H*.2,6,3,['inferno',1]);
        makeBld(1,'tower',W*.62,H*.42,true);makeBld(1,'tower',W*.8,H*.32,true);makeBld(1,'tower',W-400,340,true);},
      tick(){if(s.p.dead){this.endMsg='The Princess has fallen.';return'lose';}
        if(gameTime>=s.next){s.n++;s.next+=50;const n=s.n;[...mSpawn(1,'soldier',W-150,150,Math.round((2+n)*k),50),...mSpawn(1,'spitter',W-150,150,Math.round((1+n/2)*k),50)].forEach(u=>issue(u,{t:'amove',x:s.p.x,y:s.p.y}));
          if(n===1)announce('Red hunting parties are tracking the Princess','Warning. Enemy forces approaching',1000);}
        if(!this.cpDone&&Math.hypot(s.p.x-this.cp.x,s.p.y-this.cp.y)<this.cp.r){this.cpDone=true;this.obj[2].done=true;const c=this.cp;
          mSpawn(0,'soldier',c.x-60,c.y+60,4,40);mSpawn(0,'nurse',c.x-60,c.y+60,1,20);mSpawn(0,'jugg',c.x-60,c.y+60,1,20);announce('Reinforcements have arrived at the Old Root','Reinforcements have arrived',1000);}
        if(Math.hypot(s.p.x-this.goal.x,s.p.y-this.goal.y)<this.goal.r){this.obj[0].done=this.obj[1].done=true;return'win';}}};}},
  {name:'Scorched Earth',sub:'Destroy three Swarm Spires before they fire.',
    brief:'The gold colony has raised three Swarm Spires. When any one of them finishes charging, its swarm will wipe us out. Lead a strike team across the map and destroy all three before time runs out. There is no time to build a base.',
    tip:'Keep your flyers with the army: Acid Towers shred them. Each spire you destroy brings reinforcements. Burrow Charge (D) gets Juggernauts past defenders.',
    make(cd){const s={};const tm=cd.scale>1?.85:cd.scale<1?1.2:1;return{
      conf:{map:'corners',seed:55,players:[{fac:'black',noBase:true,noNest:true},{fac:'gold',ai:{diff:cd.ai,pers:'turtle'},slot:1}],res:{food:0,honey:0},weather:false,creeps:true},
      obj:[{text:()=>`Destroy the Swarm Spires (${s.sp.filter(b=>b.dead).length}/3)`},{text:()=>{const l=s.sp.filter(b=>!b.dead).map(b=>b.spT);return l.length?`Next spire fires in ${fmtT(Math.min(...l))}`:'All spires destroyed';}}],
      setup(){const T=teams[1];T.ai.noAttack=true;T.ai.noSpire=true;T.ai.noBuild=true;const st=MAP.starts[0],k=cd.scale;
        for(const[ty,n]of[['soldier',6],['spitter',4],['jugg',2],['bomb',2],['nurse',2],['scout',2],['lancer',2]])mSpawn(0,ty,st.x+40,st.y-40,n,70);
        const s1=MAP.starts[1],sites=[[MAP.starts[2].x+40,MAP.starts[2].y+40,330],[MAP.starts[3].x-40,MAP.starts[3].y-40,430],[s1.x-200,s1.y+200,520]];
        s.sp=sites.map(([x,y,t],i)=>{const b=makeBld(1,'spire',x,y,true);b.spT=t*tm;b.seen=true;makeBld(1,'tower',x+75,y,true);makeBld(1,'tower',x-75,y,true);
          [...mSpawn(1,'soldier',x,y+70,Math.round(4*k),50),...mSpawn(1,'spitter',x,y+70,Math.round(2*k),50),...(i?mSpawn(1,'gale',x,y,1):[])].forEach(u=>u.guard=true);
          if(i===2)makeBld(1,'tower',x,y+80,true);return b;});
        for(const u of units)if(u.type==='mantis')u.dead=true;},
      tick(){if(!teamUnits(0).length){this.endMsg='Your strike team was wiped out.';return'lose';}
        for(const b of s.sp)if(b.dead&&!b.rewarded){b.rewarded=true;if(s.sp.some(o=>!o.dead)){mSpawn(0,'soldier',b.x,b.y,5,50);mSpawn(0,'spitter',b.x,b.y,3,40);mSpawn(0,'jugg',b.x,b.y,1,30);mSpawn(0,'nurse',b.x,b.y,1,20);
          announce('Spire destroyed! Reinforcements have tunneled in to join you.','Reinforcements have arrived',1000);}}
        for(const b of s.sp)if(!b.dead&&b.spT<=0){const c=centroid(teamUnits(0));unleash(b,c.x,c.y);this.endMsg='A Swarm Spire fired. The swarm overran the colony.';return'lose';}
        if(s.sp.every(b=>b.dead)){this.obj[0].done=this.obj[1].done=true;return'win';}}};}},
  {name:'Formicide',sub:'Two colonies. One garden.',
    brief:"Red and gold have both marched into the garden, and they will fight each other as readily as they fight us. Build a full colony, raise your Princess and a Swarm Spire, and destroy both enemy Queen's Nests.",
    tip:'Let the rivals wear each other down, but do not wait too long: both will build Swarm Spires.',
    make(cd){return{
      conf:{map:'corners',seed:66,players:[{fac:'black'},{fac:'red',ai:{diff:cd.ai,pers:'rusher'}},{fac:'gold',ai:{diff:cd.ai,pers:'expander'}}],res:{food:200,honey:50},weather:true,creeps:true},
      obj:[{text:"Destroy the red Queen's Nest"},{text:"Destroy the gold Queen's Nest"}],
      setup(){for(const T of teams)if(T.ai)T.ai.spireAt=Math.min(T.ai.spireAt,720);},
      tick(){this.obj[0].done=!teams[1].alive;this.obj[1].done=!teams[2].alive;if(!teams[1].alive&&!teams[2].alive)return'win';}};}}
];
