'use strict';
// ---------- creatures ----------
const AB={bomb:1.45,spitter:1.22,soldier:1.05,jugg:1.05,princess:1.1,inferno:1.3,gale:1.35,nurse:1.1};
const BANDS={spitter:[.25,.6],bomb:[.18,.42,.66],inferno:[.2,.45,.7],gale:[.3,.62],nurse:[.5]};
function drawAnt(c,u,alpha,dead){
  const s=u.r,ty=u.type,C=u.col||colOf(u.team),fl=u.flash>0,d=UNIT[ty],fly=d.fly&&!dead;
  const body=fl?'#fff':C.body,leg=C.leg;
  c.save();c.translate(u.x,u.y);if(alpha!=null)c.globalAlpha=alpha;
  if(!dead){c.fillStyle=fly?'rgba(0,0,0,.16)':'rgba(0,0,0,.22)';const ox=fly?7:2,oy=fly?13:3;c.save();c.translate(ox,oy);c.rotate(u.ang);ell(c,-s*.2,0,s*1.9,s*.75);c.restore();}
  if(!dead&&u.buffT>0){c.fillStyle=u.buffK==='blaze'?'rgba(255,140,40,.22)':'rgba(224,80,62,.22)';ell(c,0,0,s*1.9,s*1.9);}
  c.rotate(u.ang);
  const ph=u.phase||0,mv=u.moving&&!fly?.45:.05;
  c.strokeStyle=leg;c.lineWidth=Math.max(1.1,s*.15);c.lineCap='round';c.lineJoin='round';
  for(let i=0;i<3;i++)for(const sd of[-1,1]){
    const sw=dead?-.6:fly?-.35:Math.sin(ph+(i%2?Math.PI:0)+(sd>0?Math.PI:0))*mv;
    const bx=s*(.22-i*.22),a=sd*(.8+i*.75-sw),kx=bx+Math.cos(a)*s*.75,ky=Math.sin(a)*s*.75,a2=a+sd*(dead?1.4:(i-1)*.55);
    c.beginPath();c.moveTo(bx,0);c.lineTo(kx,ky);c.lineTo(kx+Math.cos(a2)*s*.85,ky+Math.sin(a2)*s*.85);c.stroke();}
  const ab=AB[ty]||1,abx=-s*(.95+(ab-1)*.45);
  c.fillStyle=body;if(ty==='princess')ell(c,abx-s*.2,0,s*1*ab,s*.58*ab);else ell(c,abx,0,s*.8*ab,s*.6*ab);
  const bands=BANDS[ty];
  if(bands&&!fl){c.strokeStyle=ty==='bomb'?C.bandB:ty==='inferno'?'rgba(255,120,30,.95)':ty==='nurse'?'rgba(255,255,255,.85)':C.bandA;c.lineWidth=Math.max(1,s*.13);
    for(const k of bands){const xx=abx+s*.8*ab*(k-.5)*1.6,hh=s*.6*ab*Math.sqrt(Math.max(0,1-((k-.5)*1.6)**2))*.9;c.beginPath();c.moveTo(xx,-hh);c.quadraticCurveTo(xx-s*.12,0,xx,hh);c.stroke();}}
  if(ty==='inferno'&&!dead){c.fillStyle=`rgba(255,${120+Math.sin(animT*9+u.id)*40|0},30,.35)`;ell(c,abx-s*.3,0,s*.45,s*.3);}
  c.fillStyle=body;ell(c,-s*.38,0,s*.17,s*.14);ell(c,s*.08,0,s*.42,s*.26);
  if(ty==='jugg'&&!dead){c.fillStyle=C.mand;for(const sd of[-1,1]){c.beginPath();c.moveTo(-s*.1,sd*s*.2);c.lineTo(s*.05,sd*s*.48);c.lineTo(s*.2,sd*s*.2);c.fill();}}
  const hr=ty==='jugg'?s*.58:ty==='soldier'||ty==='princess'?s*.5:ty==='bomb'?s*.32:s*.38,hx=s*.55+hr;ell(c,hx,0,hr,hr*.9);
  if(ty==='jugg'&&!fl){c.strokeStyle=C.hi;c.lineWidth=s*.08;c.beginPath();c.moveTo(hx-hr*.7,0);c.lineTo(hx+hr*.6,0);c.stroke();}
  const big=ty==='soldier'||ty==='jugg'||ty==='princess',op=u.atk>0?.6:.12;c.strokeStyle=C.mand;c.lineWidth=Math.max(1,s*(big?.2:.12));
  for(const sd of[-1,1]){c.beginPath();c.moveTo(hx+hr*.7,sd*hr*.38);c.quadraticCurveTo(hx+hr*1.5,sd*hr*(.5+op),hx+hr*1.6,sd*hr*op*.6);c.stroke();}
  c.strokeStyle=leg;c.lineWidth=Math.max(1,s*.09);const aw=dead?0:Math.sin(ph*.7)*.15;
  for(const sd of[-1,1]){c.beginPath();c.moveTo(hx+hr*.4,sd*hr*.5);c.lineTo(hx+hr*.85,sd*(hr*1.25+s*.2));c.lineTo(hx+hr*1.9+s*.3,sd*(hr*1.05+s*(.35+aw)));c.stroke();}
  if(!dead){c.fillStyle=C.hi;ell(c,abx-s*.15,-s*.22*ab,s*.32*ab,s*.15*ab);ell(c,hx-hr*.2,-hr*.35,hr*.35,hr*.18);ell(c,s*.05,-s*.1,s*.2,s*.08);}
  if(ty==='princess'){if(!dead){c.fillStyle='rgba(235,240,255,.35)';c.strokeStyle='rgba(255,255,255,.45)';c.lineWidth=.8;
      for(const sd of[-1,1]){c.save();c.rotate(sd*(Math.PI-.18));c.beginPath();c.ellipse(s*.85,0,s*.95,s*.26,0,0,Math.PI*2);c.fill();c.stroke();c.restore();}}
    c.fillStyle='#ffd34d';c.strokeStyle='#8a5a00';c.lineWidth=1;c.beginPath();const cx=hx-hr*.35;
    c.moveTo(cx-hr*.25,-hr*.55);c.lineTo(cx-hr*.1,-hr*.95);c.lineTo(cx,-hr*.6);c.lineTo(cx+hr*.12,-hr*1);c.lineTo(cx+hr*.22,-hr*.6);c.lineTo(cx+hr*.35,-hr*.9);c.lineTo(cx+hr*.4,-hr*.5);c.closePath();c.fill();c.stroke();}
  if(fly){const fp=.55+Math.sin(animT*(ty==='gale'?24:38)+u.id)*.4,tint=ty==='lancer'?'rgba(255,220,150,.45)':ty==='gale'?'rgba(255,240,170,.4)':'rgba(225,238,255,.42)',big2=ty==='gale'?1.4:1;
    c.fillStyle=tint;c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=.8;
    for(const sd of[-1,1])for(const[len,off]of[[1.5*big2,0],[1.15*big2,.35]]){const a=sd*(Math.PI-fp-off);c.save();c.translate(s*.05,0);c.rotate(a);c.beginPath();c.ellipse(s*len*.55,0,s*len*.6,s*.26*big2,0,0,Math.PI*2);c.fill();c.stroke();c.restore();}}
  if(u.carry){const cx=hx+hr*1.15;if(u.carryK==='honey'){c.fillStyle='#f0a830';ell(c,cx+3,0,3.6,3.6);c.fillStyle='rgba(255,255,255,.6)';ell(c,cx+2,-1,1.2,1.2);}
    else{c.fillStyle='#fff8e6';c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=.8;c.fillRect(cx,-3,6,6);c.strokeRect(cx,-3,6,6);}}
  c.restore();}

function drawCreep(c,u,alpha,dead){const s=u.r,ty=u.type,fl=u.flash>0,ph=u.phase||0,mv=u.moving?.4:.06;
  c.save();c.translate(u.x,u.y);if(alpha!=null)c.globalAlpha=alpha;
  if(!dead){c.fillStyle='rgba(0,0,0,.25)';c.save();c.translate(3,5);c.rotate(u.ang);ell(c,-s*.3,0,s*1.6,s*.9);c.restore();}
  c.rotate(u.ang);c.lineCap='round';
  if(ty==='spider'){c.strokeStyle=fl?'#fff':'#3b2a1a';c.lineWidth=s*.13;
    for(let i=0;i<4;i++)for(const sd of[-1,1]){const sw=dead?-.4:Math.sin(ph+i*1.3+(sd>0?Math.PI:0))*mv,a=sd*(.55+i*.5+sw),bx=s*(.3-i*.12),kx=bx+Math.cos(a)*s*1.05,ky=Math.sin(a)*s*1.05,a2=a+sd*(dead?1.2:-.5+i*.35);
      c.beginPath();c.moveTo(bx,0);c.lineTo(kx,ky);c.lineTo(kx+Math.cos(a2)*s*1.1,ky+Math.sin(a2)*s*1.1);c.stroke();}
    c.fillStyle=fl?'#fff':'#4a3420';ell(c,-s*.65,0,s*.75,s*.6);c.fillStyle='#8a6a44';for(let i=0;i<3;i++){c.beginPath();const x=-s*(.35+i*.28);c.moveTo(x,-s*.18);c.lineTo(x-s*.16,0);c.lineTo(x,s*.18);c.lineTo(x-s*.06,0);c.fill();}
    c.fillStyle=fl?'#fff':'#5a4128';ell(c,s*.2,0,s*.5,s*.42);c.fillStyle='#111';for(const[x,y]of[[.55,-.12],[.55,.12],[.48,-.24],[.48,.24]])ell(c,s*x,s*y,s*.07,s*.07);
    c.fillStyle='rgba(255,255,255,.7)';ell(c,s*.57,-.12*s,s*.025,s*.025);}
  else if(ty==='beetle'){c.strokeStyle=fl?'#fff':'#1c1a10';c.lineWidth=s*.12;
    for(let i=0;i<3;i++)for(const sd of[-1,1]){const sw=dead?-.4:Math.sin(ph+(i%2?Math.PI:0)+(sd>0?Math.PI:0))*mv,a=sd*(1.1+i*.55-sw),bx=s*(.35-i*.35);
      c.beginPath();c.moveTo(bx,0);const kx=bx+Math.cos(a)*s*.8,ky=Math.sin(a)*s*.8;c.lineTo(kx,ky);c.lineTo(kx+Math.cos(a-sd*.4)*s*.6,ky+Math.sin(a-sd*.4)*s*.6);c.stroke();}
    const g=c.createLinearGradient(0,-s*.7,0,s*.7);g.addColorStop(0,fl?'#fff':'#3d4a22');g.addColorStop(.5,fl?'#fff':'#20280f');g.addColorStop(1,fl?'#fff':'#141a08');
    c.fillStyle=g;ell(c,-s*.25,0,s*.95,s*.72);c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=1.5;c.beginPath();c.moveTo(-s*1.15,0);c.lineTo(s*.6,0);c.stroke();
    c.fillStyle='rgba(200,230,150,.25)';ell(c,-s*.45,-s*.35,s*.4,s*.12);
    c.fillStyle=fl?'#fff':'#2a2414';ell(c,s*.65,0,s*.32,s*.42);ell(c,s*1,0,s*.22,s*.26);
    c.strokeStyle='#5a3a1a';c.lineWidth=s*.14;const op=u.atk>0?.25:0;
    for(const sd of[-1,1]){c.beginPath();c.moveTo(s*1.1,sd*s*.15);c.quadraticCurveTo(s*1.7,sd*s*(.55+op),s*1.85,sd*s*.1);c.stroke();}}
  else{c.strokeStyle=fl?'#fff':'#4f7a33';c.lineWidth=s*.07;
    for(let i=0;i<2;i++)for(const sd of[-1,1]){const sw=dead?-.4:Math.sin(ph+i*Math.PI+(sd>0?Math.PI:0))*mv,a=sd*(1.6+i*.6-sw),bx=-s*(.1+i*.3);
      c.beginPath();c.moveTo(bx,0);const kx=bx+Math.cos(a)*s*.9,ky=Math.sin(a)*s*.9;c.lineTo(kx,ky);c.lineTo(kx+Math.cos(a+sd*.6)*s*.9,ky+Math.sin(a+sd*.6)*s*.9);c.stroke();}
    c.fillStyle=fl?'#fff':'#6aa84f';ell(c,-s*.75,0,s*.85,s*.3);c.fillStyle='rgba(60,110,40,.7)';ell(c,-s*.6,0,s*.75,s*.22);
    c.fillStyle=fl?'#fff':'#7cbc5c';ell(c,s*.15,0,s*.55,s*.13);
    c.beginPath();c.moveTo(s*.95,0);c.lineTo(s*.7,-s*.25);c.lineTo(s*.62,0);c.lineTo(s*.7,s*.25);c.closePath();c.fill();
    c.fillStyle='#c9e27a';ell(c,s*.72,-s*.2,s*.08,s*.08);ell(c,s*.72,s*.2,s*.08,s*.08);
    c.strokeStyle=fl?'#fff':'#5e9a42';c.lineWidth=s*.1;const st=u.atk>0?.5:0;
    for(const sd of[-1,1]){c.beginPath();c.moveTo(s*.45,sd*s*.08);c.lineTo(s*(.75+st),sd*s*.4);c.lineTo(s*(.55+st*1.4),sd*s*.18);c.stroke();}}
  c.restore();}
const drawUnit=(c,u,a,dead)=>UNIT[u.type].creep?drawCreep(c,u,a,dead):drawAnt(c,u,a,dead);

// ---------- structures & food ----------
function drawBld(c,b){const r=b.r,ty=b.type,C=colOf(b.team);c.save();c.translate(b.x,b.y);
  if(!b.built)c.globalAlpha=.45+.5*b.prog;
  c.fillStyle='rgba(0,0,0,.32)';ell(c,5,7,r*1.06,r*.98);
  const g=c.createRadialGradient(-r*.3,-r*.35,r*.08,0,0,r);
  if(b.flash>0){g.addColorStop(0,'#f2d6b0');g.addColorStop(1,'#a5764a');}
  else if(ty==='pit'){g.addColorStop(0,'#8a6440');g.addColorStop(.7,'#6b4a2a');g.addColorStop(1,'#4a3119');}
  else{g.addColorStop(0,'#c39566');g.addColorStop(.6,'#946a40');g.addColorStop(1,'#5c3f23');}
  c.fillStyle=g;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();
  for(const[gx,gy,gs,l]of b.grains){c.fillStyle=l?'rgba(230,200,150,.55)':'rgba(60,38,18,.5)';c.fillRect(gx,gy,gs,gs);}
  c.strokeStyle=C.ring;c.lineWidth=5;c.setLineDash([7,5]);c.beginPath();c.arc(0,0,r+3,0,Math.PI*2);c.stroke();c.setLineDash([]);
  const hole=(hx,hy,hr)=>{const hg=c.createRadialGradient(hx,hy+hr*.2,0,hx,hy,hr);hg.addColorStop(0,'#0a0603');hg.addColorStop(.7,'#24160a');hg.addColorStop(1,'rgba(60,38,18,0)');
    c.fillStyle=hg;ell(c,hx,hy,hr*1.15,hr);c.fillStyle='rgba(0,0,0,.85)';ell(c,hx,hy+hr*.1,hr*.6,hr*.5);};
  const flag=k=>{c.fillStyle=C.body;c.strokeStyle='#3b2410';c.lineWidth=2;c.beginPath();c.moveTo(r*.55,-r*.55);c.lineTo(r*.55,-r*(.55+.7*k));c.stroke();
    c.beginPath();c.moveTo(r*.55,-r*(.55+.7*k));c.lineTo(r*(.55+.5*k),-r*(.55+.55*k));c.lineTo(r*.55,-r*(.55+.4*k));c.fill();};
  if(ty==='nest'){hole(0,0,r*.3);flag(1);}
  else if(ty==='outpost'){hole(0,r*.05,r*.28);flag(1.2);}
  else if(ty==='chamber'){hole(-r*.32,-r*.18,r*.2);hole(r*.34,-r*.1,r*.18);hole(0,r*.36,r*.19);}
  else if(ty==='garden'){hole(r*.45,r*.35,r*.16);c.strokeStyle='rgba(245,240,225,.35)';c.lineWidth=1;
    for(const[dx,dy]of b.deco){c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(dx*.5+3,dy*.5-3,dx,dy);c.stroke();}
    for(const[dx,dy,s]of b.deco){const m=r*.17*s;c.fillStyle='#d9ccb0';c.fillRect(dx-m*.18,dy,m*.36,m*.7);c.fillStyle='#f3ead6';ell(c,dx,dy,m,m*.7);c.fillStyle='rgba(150,110,70,.55)';ell(c,dx-m*.3,dy-m*.15,m*.18,m*.12);ell(c,dx+m*.25,dy-m*.25,m*.14,m*.1);}}
  else if(ty==='pit'){const pg=c.createRadialGradient(0,0,0,0,0,r*.68);pg.addColorStop(0,'#050302');pg.addColorStop(.75,'#1e1209');pg.addColorStop(1,'rgba(40,25,12,0)');c.fillStyle=pg;ell(c,0,0,r*.7,r*.62);
    const glow=b.queue.length?.55+.35*Math.sin(animT*4):.35;for(const[dx,dy,s]of b.deco.slice(0,4)){const ag=c.createRadialGradient(dx*.75,dy*.75,0,dx*.75,dy*.75,r*.15*s);ag.addColorStop(0,`rgba(255,200,70,${glow})`);ag.addColorStop(1,'rgba(240,160,30,0)');c.fillStyle=ag;ell(c,dx*.75,dy*.75,r*.15*s,r*.15*s);}}
  else if(ty==='vault'){hole(-r*.3,0,r*.26);hole(r*.32,-r*.05,r*.22);
    for(const[dx,dy,s,a]of b.deco.slice(0,6)){c.save();c.translate(dx*.9,dy*.9);c.rotate(a);c.fillStyle='#fbf6ea';ell(c,0,0,r*.09*s+2,r*.05*s+1.2);c.fillStyle='rgba(180,160,130,.6)';ell(c,r*.04*s,0,1,r*.04*s+.8);c.restore();}}
  else if(ty==='tower'){const tg=c.createRadialGradient(-r*.2,-r*.25,0,0,0,r*.65);tg.addColorStop(0,'#a77b4e');tg.addColorStop(1,'#4f3519');c.fillStyle=tg;ell(c,0,-2,r*.62,r*.6);
    c.save();c.translate(0,-3);c.rotate(b.ang);c.fillStyle=C.body;ell(c,r*.15,0,r*.32,r*.29);c.strokeStyle=C.mand;c.lineWidth=2;
    for(const sd of[-1,1]){c.beginPath();c.moveTo(r*.38,sd*r*.12);c.quadraticCurveTo(r*.6,sd*r*.22,r*.66,sd*r*.04);c.stroke();}
    c.fillStyle=`rgb(${C.proj})`;ell(c,r*.5,0,r*.07,r*.07);c.restore();}
  else if(ty==='spire'){for(let i=0;i<4;i++){const k=1-i*.2;const sg=c.createRadialGradient(-r*.2*k,-r*.25*k-i*4,0,0,-i*4,r*k*.9);sg.addColorStop(0,'#c9a06c');sg.addColorStop(1,'#5c3f23');c.fillStyle=sg;ell(c,0,-i*4,r*k*.9,r*k*.85);}
    const rdy=b.built&&b.spT<=0,pulse=rdy?.6+.4*Math.sin(animT*6):.35+.15*Math.sin(animT*2);
    const cg=c.createRadialGradient(0,-14,0,0,-14,r*.45);cg.addColorStop(0,`rgba(${C.projHi},${pulse})`);cg.addColorStop(1,`rgba(${C.proj},0)`);c.fillStyle=cg;ell(c,0,-14,r*.45,r*.45);
    if(b.built){const k=1-b.spT/BLD.spire.charge;c.strokeStyle=`rgba(${C.proj},.85)`;c.lineWidth=4;c.beginPath();c.arc(0,0,r+12,-Math.PI/2,-Math.PI/2+k*Math.PI*2);c.stroke();}}
  c.restore();
  if(!b.built){c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=5;c.beginPath();c.arc(b.x,b.y,r+10,0,Math.PI*2);c.stroke();
    c.strokeStyle='#f0b429';c.lineWidth=3;c.beginPath();c.arc(b.x,b.y,r+10,-Math.PI/2,-Math.PI/2+b.prog*Math.PI*2);c.stroke();}}

function drawFood(c,f){c.save();c.translate(f.x,f.y);
  if(f.ftype==='aphid'){c.fillStyle='rgba(0,0,0,.2)';ell(c,3,5,f.r*1.1,f.r*.7);
    c.save();c.rotate(-.5);c.fillStyle='#4f7a2a';ell(c,0,0,f.r*1.2,f.r*.6);c.strokeStyle='#3d5c1f';c.lineWidth=1.5;c.beginPath();c.moveTo(-f.r*1.3,0);c.lineTo(f.r*1.1,0);c.stroke();c.restore();
    for(const b of f.bugs){const a=b.a+Math.sin(animT*.6+b.p)*.15,x=Math.cos(a)*b.d,y=Math.sin(a)*b.d*.8;
      c.fillStyle='#9ccc4a';ell(c,x,y,b.s,b.s*.75,a);c.fillStyle='rgba(255,255,255,.35)';ell(c,x-b.s*.3,y-b.s*.3,b.s*.35,b.s*.2);c.fillStyle='#2f4a12';ell(c,x+Math.cos(a)*b.s*.8,y+Math.sin(a)*b.s*.8,b.s*.35,b.s*.35);}
    const n=Math.ceil(f.amt/f.max*6);for(let i=0;i<n;i++){const a=i*1.05+.3,x=Math.cos(a)*f.r*.6,y=Math.sin(a)*f.r*.5;c.fillStyle='#f0a830';ell(c,x,y,2.8,2.8);c.fillStyle='rgba(255,255,255,.6)';ell(c,x-.8,y-.8,.9,.9);}
    c.restore();return;}
  const k=Math.ceil(f.crumbs.length*f.amt/f.max);
  c.fillStyle='rgba(0,0,0,.2)';ell(c,3,4,f.r*(.4+.6*f.amt/f.max),f.r*.8*(.4+.6*f.amt/f.max));
  for(let i=k-1;i>=0;i--){const q=f.crumbs[i];c.save();c.translate(q.x,q.y);c.rotate(q.rot);
    if(f.ftype==='sugar'){const col=q.c<.4?'#fffdf6':q.c<.75?'#f3ead8':'#e5d9c1';c.fillStyle='#bfb29a';c.fillRect(-q.s/2+1,-q.s/2+1,q.s,q.s);c.fillStyle=col;c.fillRect(-q.s/2,-q.s/2,q.s,q.s);}
    else{c.fillStyle=q.c<.5?'#d9b46a':'#c0954d';ell(c,0,0,q.s*.75,q.s*.45);c.fillStyle='rgba(255,255,255,.3)';ell(c,-q.s*.2,-q.s*.12,q.s*.25,q.s*.12);}
    c.restore();}
  c.restore();}

function hpBar(c,e,w){const p=clamp(e.hp/e.maxhp,0,1),x=e.x-w/2,y=e.y-e.r-(e.kind==='bld'?18:e.fly?16:10);
  c.fillStyle='rgba(0,0,0,.65)';c.fillRect(x-1,y-1,w+2,5);c.fillStyle=p>.6?'#8bc34a':p>.3?'#f0b429':'#e0503e';c.fillRect(x,y,w*p,3);
  if(e.kind!=='unit')return;
  if(e.rank){c.fillStyle='#ffd34d';for(let i=0;i<e.rank;i++){const cx=x+w+4+i*5;c.beginPath();c.moveTo(cx,y-2);c.lineTo(cx+2.5,y+1);c.lineTo(cx,y+4);c.lineTo(cx+1,y+1);c.fill();}}
  if(UNIT[e.type].hero){c.fillStyle='#ffd34d';ell(c,x-6,y+1,5,5);c.fillStyle='#2a1a08';c.font='bold 8px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(e.lvl,x-6,y+1.5);}
  if(e.stunT>0){c.fillStyle='#fff6a0';for(let i=0;i<3;i++){const a=animT*6+i*2.1;ell(c,e.x+Math.cos(a)*e.r*.8,y-6+Math.sin(a)*2,1.6,1.6);}}
  if(e.burnT>0&&Math.random()<.6){c.fillStyle=`rgba(255,${100+Math.random()*100|0},20,.85)`;ell(c,e.x+(Math.random()-.5)*e.r,e.y+(Math.random()-.5)*e.r,2,3);}}

// ---------- frame ----------
const RAIN=Array.from({length:170},()=>({x:Math.random()*2400,y:Math.random()*1400,v:520+Math.random()*320}));
function render(){
  const src=computeVis();
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#1a120a';ctx.fillRect(0,0,cv.width,cv.height);
  let ox=0,oy=0;if(shakeT>0){const m=Math.min(12,shakeT*24);ox=(Math.random()-.5)*m;oy=(Math.random()-.5)*m;}
  const z=cam.z*dpr;ctx.setTransform(z,0,0,z,-cam.x*z+ox*dpr,-cam.y*z+oy*dpr);
  const x0=cam.x-80,y0=cam.y-80,x1=cam.x+vw/cam.z+80,y1=cam.y+vh/cam.z+80,inV=e=>e.x>x0&&e.x<x1&&e.y>y0&&e.y<y1;
  const sx0=Math.max(0,Math.floor(cam.x)),sy0=Math.max(0,Math.floor(cam.y)),sw=Math.min(W-sx0,Math.ceil(vw/cam.z)+2),sh=Math.min(H-sy0,Math.ceil(vh/cam.z)+2);
  if(sw>0&&sh>0)ctx.drawImage(GR.ground,sx0,sy0,sw,sh,sx0,sy0,sw,sh);
  ctx.strokeStyle='rgba(0,0,0,.55)';ctx.lineWidth=8;ctx.strokeRect(-4,-4,W+8,H+8);
  ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=1.5;
  for(const w of MAP.water){if(w.x+w.rx<x0||w.x-w.rx>x1||w.y+w.rx<y0||w.y-w.rx>y1)continue;ctx.save();ctx.translate(w.x,w.y);ctx.rotate(w.rot);
    for(let i=0;i<2;i++){const k=(animT*.25+i*.5+w.x*.001)%1;ctx.globalAlpha=1-k;ctx.beginPath();ctx.ellipse(0,0,w.rx*(.3+k*.6),w.ry*(.3+k*.6),0,0,Math.PI*2);ctx.stroke();}ctx.restore();}
  ctx.globalAlpha=1;
  // pheromone trails
  for(const b of blds){if(!b.built||(b.team!==PLAYER&&!b.seen))continue;const R=trailR(b);if(b.x+R<x0||b.x-R>x1||b.y+R<y0||b.y-R>y1)continue;
    const C=colOf(b.team),tg=ctx.createRadialGradient(b.x,b.y,b.r,b.x,b.y,R);tg.addColorStop(0,'rgba(40,25,10,.16)');tg.addColorStop(.85,'rgba(40,25,10,.08)');tg.addColorStop(1,'rgba(40,25,10,0)');
    ctx.fillStyle=tg;ctx.beginPath();ctx.arc(b.x,b.y,R,0,Math.PI*2);ctx.fill();ctx.strokeStyle=C.ring;ctx.globalAlpha=.18;ctx.lineWidth=2;ctx.setLineDash([2,9]);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}
  for(const f of fx){if(!inV(f))continue;const a=1-f.t/f.life;
    if(f.k==='rubble'){ctx.globalAlpha=a;ctx.fillStyle='#4a3119';ell(ctx,f.x,f.y,f.r*.9,f.r*.7);ctx.fillStyle='#2a1a0c';ell(ctx,f.x,f.y,f.r*.4,f.r*.3);ctx.globalAlpha=1;}
    else if(f.k==='crater'){ctx.globalAlpha=Math.min(1,a*1.5)*.6;ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.rot);ctx.fillStyle='#3a2612';ell(ctx,0,0,f.r*1.05,f.r*.6);ctx.fillStyle='#2a1a0c';ell(ctx,f.r*.45,0,f.r*.4,f.r*.4);ctx.restore();ctx.globalAlpha=1;}
    else if(f.k==='corpse')drawUnit(ctx,{x:f.x,y:f.y,ang:f.ang,r:f.r,team:f.team,col:f.col,type:f.type,phase:0,moving:false},.55*a,true);}
  for(const p of pools){if(!inV(p))continue;const a=Math.min(1,(p.life-p.t)/1.2);ctx.fillStyle=`rgba(${p.rgb},${.28*a})`;ell(ctx,p.x,p.y,p.r,p.r*.82);
    ctx.fillStyle=`rgba(${p.rgb},${.6*a})`;for(let i=0;i<5;i++){const an=i*1.3+p.x,b=(animT*1.5+i*.37)%1;ell(ctx,p.x+Math.cos(an)*p.r*.55,p.y+Math.sin(an)*p.r*.45,2+b*3,2+b*3);}}
  if(foot&&!foot.done){const k=foot.t/foot.warn;ctx.fillStyle=`rgba(0,0,0,${.12+.4*k})`;ctx.save();ctx.translate(foot.x,foot.y);ctx.rotate(foot.rot);ell(ctx,0,0,foot.r*(1.6-.6*k)*1.05,foot.r*(1.6-.6*k)*.6);ctx.restore();
    ctx.strokeStyle=`rgba(224,80,62,${.5+.5*Math.sin(animT*10)})`;ctx.lineWidth=3;ctx.setLineDash([10,8]);ctx.beginPath();ctx.arc(foot.x,foot.y,foot.r,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  for(const m of marks){if(m.team!==PLAYER)continue;ctx.strokeStyle=`rgba(${colOf(m.team).proj},${.35+.15*Math.sin(animT*3)})`;ctx.lineWidth=2;ctx.setLineDash([6,8]);ctx.beginPath();ctx.arc(m.x,m.y,m.r,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  if(mission)for(const z of[mission.goal,mission.cp]){if(!z||(z===mission.cp&&mission.cpDone))continue;const p=.5+.5*Math.sin(animT*3);
    ctx.fillStyle=`rgba(240,180,41,${.1+.08*p})`;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle=`rgba(240,180,41,${.5+.4*p})`;ctx.lineWidth=3;ctx.setLineDash([12,8]);ctx.stroke();ctx.setLineDash([]);}
  for(const f of foods)if(inV(f))drawFood(ctx,f);
  for(const b of blds)if((b.team===PLAYER||b.seen)&&inV(b))drawBld(ctx,b);
  ctx.lineWidth=2/cam.z+.5;
  for(const e of sel){ctx.strokeStyle=e.team===PLAYER?'#8bc34a':'#e0503e';ctx.beginPath();if(e.kind==='bld')ctx.arc(e.x,e.y,e.r+6,0,Math.PI*2);else ctx.ellipse(e.x,e.y,e.r*1.7,e.r*1.3,0,0,Math.PI*2);ctx.stroke();
    if(e.kind==='bld'&&BLD[e.type].atk){ctx.strokeStyle='rgba(240,180,41,.35)';ctx.setLineDash([4,6]);ctx.beginPath();ctx.arc(e.x,e.y,BLD[e.type].atk.range*(teams[e.team].up.acid?1.2:1),0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
    if(e.kind==='unit'&&UNIT[e.type].heal){ctx.strokeStyle='rgba(139,195,74,.25)';ctx.setLineDash([3,6]);ctx.beginPath();ctx.arc(e.x,e.y,UNIT[e.type].healR,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}}
  // queued orders
  ctx.lineWidth=1.5;ctx.setLineDash([4,5]);
  for(const u of sel){if(u.kind!=='unit'||u.team!==PLAYER)continue;const pts=[];
    if(u.patrol){ctx.strokeStyle='rgba(120,180,255,.6)';ctx.beginPath();ctx.moveTo(u.patrol.ax,u.patrol.ay);ctx.lineTo(u.patrol.bx,u.patrol.by);ctx.stroke();continue;}
    if(u.state==='move'||u.state==='amove')pts.push({x:u.tx,y:u.ty,a:u.amove});else if(u.cast)pts.push({x:u.cast.e?u.cast.e.x:u.cast.x,y:u.cast.e?u.cast.e.y:u.cast.y,a:true});
    for(const o of u.orders){const p=o.e||o;if(p.x!=null)pts.push({x:p.x,y:p.y,a:o.t==='amove'||o.t==='attack'});}
    if(!pts.length)continue;let px=u.x,py=u.y;for(const p of pts){ctx.strokeStyle=p.a?'rgba(224,80,62,.6)':'rgba(139,195,74,.6)';ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.fillStyle=ctx.strokeStyle;ell(ctx,p.x,p.y,2.5,2.5);px=p.x;py=p.y;}}
  ctx.setLineDash([]);
  if(mouse&&!matchMedia('(pointer:coarse)').matches){const w=toWorld(mouse.x,mouse.y);const h=pick(w.x,w.y,6/cam.z);if(h&&h.kind!=='food'&&h.team!==PLAYER){ctx.strokeStyle='#e0503e';ctx.beginPath();ctx.arc(h.x,h.y,(h.kind==='bld'?h.r+6:h.r*1.7),0,Math.PI*2);ctx.stroke();}}
  const shown=u=>(u.team===PLAYER||u.vis)&&inV(u);
  for(const u of units)if(!u.fly&&!u.charge&&shown(u))drawUnit(ctx,u,u.team===PLAYER&&u.inGrass?.75:null);
  for(const u of units)if(u.charge&&u.team===PLAYER){ctx.fillStyle='rgba(60,40,20,.6)';ell(ctx,u.x,u.y,u.r,u.r*.7);}
  if(MAP.grass.length&&sw>0&&sh>0)ctx.drawImage(GR.grassTop,sx0,sy0,sw,sh,sx0,sy0,sw,sh);
  for(const p of projs){const col=`rgb(${p.rgb})`;
    if(p.lob){const h=Math.sin(p.k*Math.PI)*p.h0;ctx.fillStyle='rgba(0,0,0,.25)';ell(ctx,p.x,p.y,4,3);ctx.fillStyle=col;ell(ctx,p.x,p.y-h,p.pool?7:5.5,p.pool?7:5.5);ctx.fillStyle='rgba(255,255,255,.5)';ell(ctx,p.x-1.5,p.y-h-1.5,1.8,1.8);continue;}
    ctx.strokeStyle=col;ctx.globalAlpha=.5;ctx.lineWidth=2.5;ctx.beginPath();
    for(let i=0;i<p.trail.length;i+=2)i?ctx.lineTo(p.trail[i],p.trail[i+1]):ctx.moveTo(p.trail[i],p.trail[i+1]);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle=col;ell(ctx,p.x,p.y,3.2,3.2);}
  for(const u of units)if(u.fly&&shown(u))drawUnit(ctx,u);
  for(const u of units){if(!UNIT[u.type].heal||!u.healT||u.healT.dead||!shown(u))continue;const t=u.healT;ctx.strokeStyle=`rgba(139,230,90,${.4+.3*Math.sin(animT*8)})`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(u.x,u.y);ctx.lineTo(t.x,t.y);ctx.stroke();}
  for(const f of fx){if(!inV(f))continue;const a=1-f.t/f.life;
    if(f.k==='splash'){ctx.fillStyle=`rgba(${f.rgb},${a*.7})`;for(let i=0;i<5;i++){const an=i*1.26+f.x,rr=4+f.t*30;ell(ctx,f.x+Math.cos(an)*rr,f.y+Math.sin(an)*rr,2.4*a+.5,2.4*a+.5);}}
    else if(f.k==='boom'){const rr=f.r*(.4+.6*Math.min(1,f.t*4));ctx.fillStyle=`rgba(${f.rgb},${a*.35})`;ell(ctx,f.x,f.y,rr,rr*.8);
      ctx.fillStyle=`rgba(${f.rgb2||f.rgb},${a*.8})`;for(let i=0;i<9;i++){const an=i*.7+f.x,d=rr*(.5+.5*((i*37)%10)/10);ell(ctx,f.x+Math.cos(an)*d,f.y+Math.sin(an)*d*.8,3*a+.5,3*a+.5);}}
    else if(f.k==='bite'){ctx.strokeStyle=`rgba(255,255,240,${a})`;ctx.lineWidth=1.5;for(let i=0;i<4;i++){const an=i*1.57+.7,r1=4+f.t*30;ctx.beginPath();ctx.moveTo(f.x+Math.cos(an)*2,f.y+Math.sin(an)*2);ctx.lineTo(f.x+Math.cos(an)*r1,f.y+Math.sin(an)*r1);ctx.stroke();}}
    else if(f.k==='flame'){for(let i=0;i<7;i++){const k=(i/7+f.t*3)%1,x=f.x+(f.tx-f.x)*k+(Math.random()-.5)*10*k,y=f.y+(f.ty-f.y)*k+(Math.random()-.5)*10*k;ctx.fillStyle=`rgba(255,${80+k*140|0},20,${a*.8})`;ell(ctx,x,y,2+k*6,2+k*6);}}
    else if(f.k==='ring'){ctx.strokeStyle=`rgba(${f.rgb},${a})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(.3+.7*(1-a)),0,Math.PI*2);ctx.stroke();}
    else if(f.k==='puff'){ctx.fillStyle=`rgba(220,200,170,${a*.5})`;ell(ctx,f.x,f.y,6+f.t*20,6+f.t*20);}
    else if(f.k==='dirt'){ctx.fillStyle=`rgba(90,60,30,${a*.7})`;ell(ctx,f.x,f.y,4,3);}
    else if(f.k==='spark'){ctx.fillStyle=`rgba(255,230,150,${a})`;ell(ctx,f.x+f.t*10,f.y-f.t*14,1.5,1.5);}
    else if(f.k==='txt'){ctx.globalAlpha=a;ctx.font='bold 13px "Chakra Petch",sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.7)';ctx.strokeText(f.s,f.x,f.y-f.t*18);ctx.fillStyle=f.c;ctx.fillText(f.s,f.x,f.y-f.t*18);ctx.globalAlpha=1;}}
  for(const e of sel)if(e.kind==='bld'&&e.rally&&e.team===PLAYER){const r=e.rally;ctx.strokeStyle='rgba(240,180,41,.8)';ctx.setLineDash([5,5]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(r.x,r.y);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#f0b429';ctx.fillRect(r.x-1,r.y-14,2,14);ctx.beginPath();ctx.moveTo(r.x+1,r.y-14);ctx.lineTo(r.x+10,r.y-10);ctx.lineTo(r.x+1,r.y-6);ctx.fill();}
  for(const u of units)if(shown(u)&&(u.hp<u.maxhp||sel.includes(u)||u.rank||UNIT[u.type].hero||u.stunT>0))hpBar(ctx,u,u.r*2.4);
  for(const b of blds)if((b.team===PLAYER||b.seen)&&inV(b)){if(b.hp<b.maxhp||sel.includes(b))hpBar(ctx,b,Math.max(36,b.r*1.6));
    if(b.type==='spire'&&b.built){ctx.font='bold 13px "Chakra Petch",sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.75)';const t=b.spT>0?fmtT(b.spT):'READY';ctx.strokeText(t,b.x,b.y+b.r+28);ctx.fillStyle=b.spT>0?'#f4e9d4':'#ff6a50';ctx.fillText(t,b.x,b.y+b.r+28);}}
  for(const p of pings){const a=1-p.t/p.life;ctx.strokeStyle=p.c==='attack'?`rgba(224,80,62,${a})`:p.c==='alert'?`rgba(255,140,40,${a})`:`rgba(139,195,74,${a})`;ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(p.x,p.y,4+p.t*(p.c==='alert'?60:22),0,Math.PI*2);ctx.stroke();}
  if(tmode&&mouse){const w=toWorld(mouse.x,mouse.y);
    if(tmode.k==='build'){const r=BLD[tmode.type].r,ok=canPlace(w.x,w.y,r);ctx.fillStyle=ok?'rgba(139,195,74,.3)':'rgba(224,80,62,.35)';ctx.strokeStyle=ok?'#8bc34a':'#e0503e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(w.x,w.y,r,0,Math.PI*2);ctx.fill();ctx.stroke();}
    else if(tmode.k==='abil'){const A=ABIL[tmode.a];const cs=casters(tmode.a);const c0=cs.length?nearestOf(cs,w):null;
      if(c0&&A.range){ctx.strokeStyle='rgba(240,180,41,.35)';ctx.setLineDash([4,6]);ctx.beginPath();ctx.arc(c0.x,c0.y,A.range,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
      const rr=tmode.a==='pool'?55:tmode.a==='charge'?70:tmode.a==='mark'?170:16;ctx.strokeStyle='rgba(240,180,41,.9)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(w.x,w.y,rr,0,Math.PI*2);ctx.stroke();}
    else if(tmode.k==='swarm'){const ok=pointVisible(w.x,w.y);ctx.strokeStyle=ok?'rgba(240,180,41,.9)':'rgba(224,80,62,.9)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(w.x,w.y,90,0,Math.PI*2);ctx.stroke();}}
  if(foot&&foot.done&&foot.t<foot.warn+.7){const a=1-(foot.t-foot.warn)/.7;ctx.save();ctx.translate(foot.x,foot.y);ctx.rotate(foot.rot);ctx.globalAlpha=a*.85;ctx.fillStyle='#2b2118';
    ctx.beginPath();ctx.ellipse(-foot.r*.35,0,foot.r*.95,foot.r*.62,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(foot.r*.9,0,foot.r*.5,foot.r*.45,0,0,Math.PI*2);ctx.fill();ctx.restore();ctx.globalAlpha=1;}
  // fog of war
  fctx.setTransform(1,0,0,1,0,0);fctx.globalCompositeOperation='source-over';fctx.clearRect(0,0,fog.width,fog.height);
  fctx.fillStyle='rgba(12,7,2,.55)';fctx.fillRect(0,0,fog.width,fog.height);fctx.globalCompositeOperation='destination-out';
  for(let i=0;i<src.length;i+=3){const sx=(src[i]-cam.x)*z,sy=(src[i+1]-cam.y)*z,R=src[i+2]*z;if(sx<-R||sy<-R||sx>fog.width+R||sy>fog.height+R)continue;
    const g=fctx.createRadialGradient(sx,sy,R*.55,sx,sy,R);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');fctx.fillStyle=g;fctx.fillRect(sx-R,sy-R,2*R,2*R);}
  fctx.globalCompositeOperation='source-over';
  ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(fog,0,0);
  const ra=weather?(weather.rain?Math.min(1,(gameTime-weather.start)/3):Math.max(0,1-(gameTime-weather.stop)/3)):0;
  if(ra>0){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=`rgba(20,30,50,${.2*ra})`;ctx.fillRect(0,0,vw,vh);ctx.strokeStyle=`rgba(200,215,235,${.35*ra})`;ctx.lineWidth=1;ctx.beginPath();
    for(const d of RAIN){const y=(d.y+animT*d.v)%(vh+40)-20,x=(d.x+animT*d.v*.25)%(vw+40)-20;ctx.moveTo(x,y);ctx.lineTo(x-3.5,y-15);}ctx.stroke();}
  if(drag&&drag.mode==='box'){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.strokeStyle='#8bc34a';ctx.fillStyle='rgba(139,195,74,.12)';ctx.lineWidth=1.5;
    const x=Math.min(drag.sx,drag.x),y=Math.min(drag.sy,drag.y),w=Math.abs(drag.x-drag.sx),h=Math.abs(drag.y-drag.sy);ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h);}
  drawMini();}

function drawMini(){const c=mctx,mw=mini.width,mh=mini.height,sx=mw/W,sy=mh/H;c.setTransform(1,0,0,1,0,0);c.drawImage(GR.mini,0,0,mw,mh);
  c.fillStyle='rgba(0,0,0,.22)';c.fillRect(0,0,mw,mh);const u1=Math.max(2,mw/90);
  for(const f of foods){c.fillStyle=f.ftype==='aphid'?'#9ccc4a':'#fff3cf';c.fillRect(f.x*sx-u1,f.y*sy-u1,u1*2,u1*2);}
  if(mission)for(const z of[mission.goal,mission.cp])if(z&&!(z===mission.cp&&mission.cpDone)){c.strokeStyle='#f0b429';c.lineWidth=2;c.beginPath();c.arc(z.x*sx,z.y*sy,Math.max(4,z.r*sx),0,Math.PI*2);c.stroke();}
  for(const b of blds){if(b.team!==PLAYER&&!b.seen)continue;const C=colOf(b.team),s=b.r*sx*1.6;c.fillStyle=C.miniEdge;c.fillRect(b.x*sx-s/2-1,b.y*sy-s/2-1,s+2,s+2);c.fillStyle=C.mini;c.fillRect(b.x*sx-s/2,b.y*sy-s/2,s,s);}
  for(const u of units){if(u.team!==PLAYER&&!u.vis)continue;
    if(u.team===NEU){c.fillStyle='#b8b0a0';c.fillRect(u.x*sx-u1*.7,u.y*sy-u1*.7,u1*1.4,u1*1.4);continue;}
    const C=colOf(u.team);c.fillStyle=C.miniEdge;c.fillRect(u.x*sx-u1*.75,u.y*sy-u1*.75,u1*1.5,u1*1.5);c.fillStyle=C.mini;c.fillRect(u.x*sx-u1*.45,u.y*sy-u1*.45,u1*.9,u1*.9);}
  if(foot&&!foot.done){c.strokeStyle='#e0503e';c.lineWidth=2;c.beginPath();c.arc(foot.x*sx,foot.y*sy,foot.r*sx,0,Math.PI*2);c.stroke();}
  for(const p of pings)if(p.c==='alert'){c.strokeStyle='#ff8c28';c.lineWidth=2;c.beginPath();c.arc(p.x*sx,p.y*sy,4+p.t*10,0,Math.PI*2);c.stroke();}
  c.strokeStyle='#fff';c.lineWidth=Math.max(1,dpr);c.strokeRect(cam.x*sx,cam.y*sy,vw/cam.z*sx,vh/cam.z*sy);}

function drawHero(){const h=$('hero');if(!h)return;const c=h.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,h.width,h.height);c.translate(0,10);
  const A=(x,y,ang,r,f,type,ph)=>drawAnt(c,{x,y,ang,r,col:COLORS[f],type,phase:ph,moving:true,atk:1,id:x});
  A(140,95,0,30,'black','jugg',1);A(290,40,.3,16,'black','scout',0);A(250,150,.1,18,'gold','gale',.4);
  A(540,95,Math.PI,30,'red','soldier',2.5);A(400,150,Math.PI*.9,16,'red','bomb',1.2);
  c.font="40px Bungee, Impact, sans-serif";c.fillStyle='#f0b429';c.textAlign='center';c.textBaseline='middle';c.fillText('VS',350,88);}
