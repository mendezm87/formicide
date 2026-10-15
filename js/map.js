'use strict';
// ---------- map layouts ----------
const MAPS={
  clearing:{name:'Garden Clearing',max:2,W:2400,H:1600,desc:'Open field with a few puddles and a guarded sugar pile in the middle.'},
  puddles:{name:'Puddle Crossing',max:2,W:2600,H:1700,desc:'A chain of puddles splits the map. Fight over three crossings.'},
  grass:{name:'Tall Grass Valley',max:2,W:2600,H:1700,desc:'Wide grass fields hide armies. Ambush country.'},
  corners:{name:'Four Corners',max:3,W:3000,H:2000,desc:'Large map for up to three colonies, with a free corner to expand into.'},
  random:{name:'Random',max:3,desc:'A new layout every game.'}
};

// Features are described for the bottom-left base in local coords (a = distance from the left edge,
// b = distance from the bottom edge), then mirrored to every base slot so the map is fair.
function genMap(key,seed,np,tries){
  const R=mulberry(seed||1),def=MAPS[key]||MAPS.clearing,four=np>2||key==='corners';
  let W=def.W,H=def.H;if(key==='random'||four&&def.max<3){W=four?3000:2400+(R()*3|0)*200;H=four?2000:1600+(R()*2|0)*100;}
  const M={key,seed,W,H,np,four,starts:[],foods:[],aphids:[],water:[],grass:[],mounds:[],creeps:[]};
  const slots=four?4:2,tf=(s,a,b)=>s===0?[a,H-b]:s===1?[W-a,b]:s===2?[a,b]:[W-a,H-b],rf=(s,r)=>s<2?-r:r;
  const L={food:[[490,450,1200,'sugar'],[300,570,1000,'seed'],[580,150,1000,'seed']],aphid:[[150,640]],water:[],grass:[],mound:[],creep:[]};
  const C={food:[],aphid:[],water:[],grass:[],mound:[],creep:[]};
  if(key==='clearing'&&!four){
    L.food.push([900,770,1800,'sugar'],[1200,1120,1600,'seed'],[720,1270,1500,'sugar'],[380,960,1400,'seed'],[850,1450,1400,'sugar']);
    L.water.push({x:1020,y:430,rx:110,ry:65,rot:.4},{x:600,y:1150,rx:80,ry:55,rot:-.3});
    L.grass.push({x:700,y:960,rx:150,ry:90,rot:.2});L.mound.push({x:1080,y:640,r:70});
    C.food.push([W/2,H/2,2600,'sugar']);C.creep.push({type:'spider',x:W/2-70,y:H/2+10},{type:'spider',x:W/2+70,y:H/2-10});
  }else if(key==='puddles'&&!four){
    const th=Math.atan2(H,W),P=t=>({x:t*W,y:t*H});
    for(const t of[.04,.10,.16,.31,.37,.43,.57,.63,.69,.84,.90,.96]){const p=P(t);C.water.push({x:p.x,y:p.y,rx:100,ry:62,rot:th});}
    for(const[t,ty]of[[.25,'spider'],[.5,'beetle'],[.75,'spider']]){const p=P(t);C.creep.push({type:ty,x:p.x,y:p.y});}
    for(const t of[.25,.75]){const p=P(t);C.mound.push({x:p.x,y:p.y,r:72});}
    C.food.push([W/2+30,H/2-60,2600,'sugar']);
    L.food.push([900,760,1700,'sugar'],[560,1050,1400,'seed'],[1450,280,1500,'sugar']);L.aphid.push([1000,400]);
    L.grass.push({x:1300,y:300,rx:140,ry:80,rot:.1});
  }else if(key==='grass'&&!four){
    L.grass.push({x:700,y:900,rx:260,ry:150,rot:.5},{x:1200,y:450,rx:220,ry:130,rot:-.2});
    C.grass.push({x:W/2,y:H/2,rx:300,ry:170,rot:-.55});
    L.food.push([900,770,1600,'sugar'],[400,1000,1400,'seed'],[780,1300,1400,'sugar']);
    L.water.push({x:1000,y:250,rx:90,ry:55,rot:.2});L.mound.push({x:1100,y:820,r:70});
    L.creep.push({type:'spider',x:700,y:900});C.food.push([W/2,H/2,2400,'sugar']);C.creep.push({type:'mantis',x:W/2,y:H/2+40});
  }else if(key==='corners'||four&&key!=='random'){
    L.food.push([900,700,1600,'sugar']);
    L.water.push({x:1150,y:320,rx:120,ry:70,rot:.3},{x:420,y:880,rx:90,ry:60,rot:-.4});
    L.grass.push({x:1050,y:780,rx:160,ry:100,rot:.3});L.mound.push({x:1280,y:860,r:70});
    C.food.push([W/2,H/2,3000,'sugar']);C.creep.push({type:'mantis',x:W/2,y:H/2});C.aphid.push([W/2-170,H/2],[W/2+170,H/2]);
    for(const[x,y]of[[200,H/2],[W-200,H/2],[W/2,170],[W/2,H-170]]){C.food.push([x,y,1500,'seed']);C.creep.push({type:'spider',x:x+(x<W/2?60:x>W/2?-60:0),y:y+(y<H/2?60:y>H/2?-60:0)});}
  }else{
    // random: scatter features in this base's region, avoiding the base and each other
    const okLoc=(a,b,pad)=>four?a<W/2-pad&&b<H/2-pad&&a>pad&&b>pad:a>pad&&b>pad&&a<W-pad&&b<H-pad&&a/W+b/H<.9;
    const taken=[{a:280,b:280,r:430}];for(const f of L.food)taken.push({a:f[0],b:f[1],r:60});
    const place=(r,pad,n)=>{for(let k=0;k<n;k++){const a=R()*W,b=R()*H;if(!okLoc(a,b,pad))continue;if(taken.some(t=>Math.hypot(t.a-a,t.b-b)<t.r+r))continue;taken.push({a,b,r});return{a,b};}return null;};
    for(let i=0,n=2+(R()*3|0);i<n;i++){const rx=70+R()*70,p=place(rx+50,rx+40,80);if(p)L.water.push({x:p.a,y:p.b,rx,ry:45+R()*35,rot:R()*Math.PI});}
    for(let i=0,n=2+(R()*3|0);i<n;i++){const rx=120+R()*120,p=place(rx*.6,120,60);if(p)L.grass.push({x:p.a,y:p.b,rx,ry:80+R()*70,rot:R()*Math.PI});}
    for(let i=0,n=1+(R()*2|0);i<n;i++){const p=place(90,120,60);if(p)L.mound.push({x:p.a,y:p.b,r:60+R()*25});}
    for(let i=0,n=2+(R()*3|0);i<n;i++){const p=place(70,150,80);if(p){L.food.push([p.a,p.b,1300+(R()*5|0)*100,R()<.5?'sugar':'seed']);if(R()<.45)L.creep.push({type:R()<.7?'spider':'beetle',x:p.a+40,y:p.b+30});}}
    const p=place(60,150,80);if(p)L.aphid.push([p.a,p.b]);
    C.food.push([W/2,H/2,2600,'sugar']);C.creep.push({type:R()<.5?'mantis':'beetle',x:W/2+50,y:H/2});
    if(four)for(const[x,y]of[[200,H/2],[W-200,H/2],[W/2,170],[W/2,H-170]])C.food.push([x,y,1400,'seed']);
  }
  for(let s=0;s<slots;s++){const[x,y]=tf(s,280,280);M.starts.push({x,y});
    for(const f of L.food){const[a,b]=tf(s,f[0],f[1]);M.foods.push([a,b,f[2],f[3]]);}
    for(const f of L.aphid){const[a,b]=tf(s,f[0],f[1]);M.aphids.push([a,b]);}
    for(const w of L.water){const[a,b]=tf(s,w.x,w.y);M.water.push({x:a,y:b,rx:w.rx,ry:w.ry,rot:rf(s,w.rot)});}
    for(const g of L.grass){const[a,b]=tf(s,g.x,g.y);M.grass.push({x:a,y:b,rx:g.rx,ry:g.ry,rot:rf(s,g.rot)});}
    for(const m of L.mound){const[a,b]=tf(s,m.x,m.y);M.mounds.push({x:a,y:b,r:m.r});}
    for(const c of L.creep){const[a,b]=tf(s,c.x,c.y);M.creeps.push({type:c.type,x:a,y:b});}}
  M.foods.push(...C.food);M.aphids.push(...C.aphid);M.water.push(...C.water);M.grass.push(...C.grass);M.mounds.push(...C.mound);M.creeps.push(...C.creep);
  buildTerrain(M);
  if(key==='random'&&(tries||0)<6&&!connected(M))return genMap(key,(seed*31+7)%1e9,np,(tries||0)+1);
  return M;}

function inEll(e,x,y,pad){const c=Math.cos(e.rot||0),s=Math.sin(e.rot||0),dx=x-e.x,dy=y-e.y,lx=dx*c+dy*s,ly=-dx*s+dy*c;return lx*lx/(e.rx+pad)**2+ly*ly/(e.ry+pad)**2<=1;}
function buildTerrain(M){const nx=Math.ceil(M.W/CELL),ny=Math.ceil(M.H/CELL);Object.assign(M,{nx,ny,block:new Uint8Array(nx*ny),grassG:new Uint8Array(nx*ny),moundG:new Uint8Array(nx*ny)});
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const x=(i+.5)*CELL,y=(j+.5)*CELL,k=j*nx+i;
    for(const w of M.water)if(inEll(w,x,y,6)){M.block[k]=1;break;}
    for(const g of M.grass)if(inEll(g,x,y,0)){M.grassG[k]=1;break;}
    for(const m of M.mounds)if((x-m.x)**2+(y-m.y)**2<m.r*m.r){M.moundG[k]=1;break;}}
  // food and bases must never sit in water
  M.foods=M.foods.filter(f=>!M.water.some(w=>inEll(w,f[0],f[1],30)));M.aphids=M.aphids.filter(f=>!M.water.some(w=>inEll(w,f[0],f[1],30)));
  M.hasWater=M.water.length>0;}
function connected(M){const{nx,ny,block}=M,seen=new Uint8Array(nx*ny),ck=p=>Math.floor(p.y/CELL)*nx+Math.floor(p.x/CELL);
  const q=[ck(M.starts[0])];seen[q[0]]=1;
  while(q.length){const k=q.pop(),x=k%nx,y=(k/nx)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=nx||Y>=ny)continue;const n=Y*nx+X;if(!seen[n]&&!block[n]){seen[n]=1;q.push(n);}}}
  return M.starts.every(s=>seen[ck(s)])&&M.foods.every(f=>seen[ck({x:f[0],y:f[1]})]);}

// ---------- terrain queries & pathfinding ----------
const cellK=(x,y)=>clamp(Math.floor(y/CELL),0,MAP.ny-1)*MAP.nx+clamp(Math.floor(x/CELL),0,MAP.nx-1);
const blockedAt=(x,y)=>MAP.block[cellK(x,y)]===1;
const grassAt=(x,y)=>MAP.grassG[cellK(x,y)]===1;
const moundAt=(x,y)=>MAP.moundG[cellK(x,y)]===1;
function clearLine(x0,y0,x1,y1){const n=Math.ceil(Math.hypot(x1-x0,y1-y0)/(CELL*.5));for(let i=1;i<=n;i++)if(blockedAt(x0+(x1-x0)*i/n,y0+(y1-y0)*i/n))return false;return true;}
function nearestFree(x,y){const M=MAP,ci=Math.floor(x/CELL),cj=Math.floor(y/CELL);
  for(let r=0;r<24;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;const i=ci+di,j=cj+dj;
    if(i<0||j<0||i>=M.nx||j>=M.ny)continue;if(!M.block[j*M.nx+i])return{x:(i+.5)*CELL,y:(j+.5)*CELL};}
  return{x,y};}
function findPath(sx,sy,tx,ty){const M=MAP,nx=M.nx,ny=M.ny,N=nx*ny;
  if(blockedAt(tx,ty)){const f=nearestFree(tx,ty);tx=f.x;ty=f.y;}
  let s=cellK(sx,sy);const g=cellK(tx,ty);if(M.block[s]){const f=nearestFree(sx,sy);s=cellK(f.x,f.y);}
  if(s===g)return[{x:tx,y:ty}];
  if(!M.gs){M.gs=new Float32Array(N);M.came=new Int32Array(N);M.stamp=new Int32Array(N);M.closed=new Int32Array(N);M.st=0;}
  const st=++M.st,{gs,came,stamp,closed}=M,gx=g%nx,gy=(g/nx)|0;
  const h=k=>{const dx=Math.abs(k%nx-gx),dy=Math.abs(((k/nx)|0)-gy);return dx+dy-.5858*Math.min(dx,dy);};
  const heap=[];
  const push=(k,f)=>{heap.push([f,k]);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p][0]<=heap[i][0])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;
    if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===i)break;[heap[m],heap[i]]=[heap[i],heap[m]];i=m;}}return top;};
  stamp[s]=st;gs[s]=0;came[s]=-1;push(s,h(s));let found=false,iter=0;
  while(heap.length&&iter++<8000){const k=pop()[1];if(closed[k]===st)continue;closed[k]=st;if(k===g){found=true;break;}
    const x=k%nx,y=(k/nx)|0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=nx||Y>=ny)continue;
      const n=Y*nx+X;if(M.block[n]||closed[n]===st)continue;if(dx&&dy&&(M.block[y*nx+X]||M.block[Y*nx+x]))continue;
      const ng=gs[k]+(dx&&dy?1.4142:1);if(stamp[n]!==st||ng<gs[n]){stamp[n]=st;gs[n]=ng;came[n]=k;push(n,ng+h(n));}}}
  if(!found)return null;
  const pts=[];for(let k=g;k!==s&&k!==-1;k=came[k])pts.push({x:(k%nx+.5)*CELL,y:(((k/nx)|0)+.5)*CELL});pts.reverse();pts[pts.length-1]={x:tx,y:ty};
  const out=[];let cx=sx,cy=sy,i=0;
  while(i<pts.length){let j=Math.min(pts.length-1,i+14);while(j>i&&!clearLine(cx,cy,pts[j].x,pts[j].y))j--;out.push(pts[j]);cx=pts[j].x;cy=pts[j].y;i=j+1;}
  return out;}

// ---------- ground art ----------
function makeGround(M){const W=M.W,H=M.H,A=W*H/(2400*1600);
  const g=document.createElement('canvas');g.width=W;g.height=H;const c=g.getContext('2d');const R=mulberry(M.seed*7+11);
  c.fillStyle='#86643d';c.fillRect(0,0,W,H);
  for(let i=0;i<280*A;i++){const x=R()*W,y=R()*H,r=40+R()*170;const gr=c.createRadialGradient(x,y,0,x,y,r);const l=R()<.5;
    gr.addColorStop(0,l?'rgba(176,136,84,.24)':'rgba(66,44,22,.24)');gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.fillRect(x-r,y-r,2*r,2*r);}
  const cols=['#6e5030','#9c7a4f','#5b4127','#a88a5c','#7a5a36'];
  for(let i=0;i<46000*A;i++){c.fillStyle=cols[(R()*5)|0];const s=R()<.9?1.5:2.5;c.fillRect(R()*W,R()*H,s,s);}
  // mounds (high ground)
  for(const m of M.mounds){c.fillStyle='rgba(0,0,0,.22)';ell(c,m.x+8,m.y+10,m.r*1.05,m.r);
    const mg=c.createRadialGradient(m.x-m.r*.35,m.y-m.r*.4,4,m.x,m.y,m.r);mg.addColorStop(0,'#c4a272');mg.addColorStop(.7,'#9a7a4c');mg.addColorStop(1,'#7a5a36');c.fillStyle=mg;ell(c,m.x,m.y,m.r,m.r);
    c.strokeStyle='rgba(60,40,20,.25)';c.lineWidth=2;for(const k of[.45,.75]){c.beginPath();c.arc(m.x,m.y,m.r*k,0,Math.PI*2);c.stroke();}}
  for(let i=0;i<26*A;i++){const x=R()*W,y=R()*H,s=16+R()*24,a=R()*6.28;c.save();c.translate(x,y);c.rotate(a);
    c.fillStyle='rgba(0,0,0,.2)';ell(c,3,4,s,s*.45);c.fillStyle=`hsl(${28+R()*70},${38+R()*25}%,${28+R()*14}%)`;
    c.beginPath();c.moveTo(-s,0);c.quadraticCurveTo(0,-s*.9,s,0);c.quadraticCurveTo(0,s*.9,-s,0);c.fill();
    c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=1.2;c.beginPath();c.moveTo(-s*1.15,0);c.lineTo(s,0);c.stroke();c.restore();}
  for(let i=0;i<34*A;i++){const x=R()*W,y=R()*H,a=R()*6.28,l=30+R()*60;c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=5;c.lineCap='round';
    c.beginPath();c.moveTo(x+2,y+3);c.lineTo(x+Math.cos(a)*l+2,y+Math.sin(a)*l+3);c.stroke();c.strokeStyle='#5a3d22';c.lineWidth=3.5;
    c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);c.stroke();}
  for(let i=0;i<440*A;i++){const x=R()*W,y=R()*H,r=2+R()*R()*10;c.fillStyle='rgba(0,0,0,.25)';ell(c,x+1.5,y+2,r,r*.75);
    const sh=118+R()*62|0;c.fillStyle=`rgb(${sh},${sh-12},${sh-30})`;ell(c,x,y,r,r*.75,R()*3);c.fillStyle='rgba(255,255,255,.18)';ell(c,x-r*.3,y-r*.3,r*.4,r*.25);}
  for(let i=0;i<230*A;i++){const x=R()*W,y=R()*H,n=5+R()*8|0;for(let k=0;k<n;k++){const a=-Math.PI/2+(R()-.5)*1.4,l=8+R()*16;
    c.strokeStyle=`hsl(${78+R()*32},${34+R()*20}%,${24+R()*15}%)`;c.lineWidth=1.6;c.beginPath();const bx=x+(R()-.5)*7;c.moveTo(bx,y);
    c.quadraticCurveTo(bx+Math.cos(a)*l*.5,y+Math.sin(a)*l*.5,bx+Math.cos(a)*l,y+Math.sin(a)*l);c.stroke();}}
  // grass beds
  for(const e of M.grass){c.save();c.translate(e.x,e.y);c.rotate(e.rot);c.scale(1,e.ry/e.rx);const gg=c.createRadialGradient(0,0,e.rx*.2,0,0,e.rx);
    gg.addColorStop(0,'rgba(58,82,28,.75)');gg.addColorStop(.85,'rgba(70,92,34,.55)');gg.addColorStop(1,'rgba(70,92,34,0)');c.fillStyle=gg;ell(c,0,0,e.rx,e.rx);c.restore();}
  // puddles
  for(const w of M.water){c.save();c.translate(w.x,w.y);c.rotate(w.rot);
    c.fillStyle='rgba(40,26,14,.5)';ell(c,0,0,w.rx+16,w.ry+13);c.fillStyle='rgba(58,38,20,.65)';ell(c,0,0,w.rx+7,w.ry+6);
    const wg=c.createRadialGradient(-w.rx*.3,-w.ry*.3,4,0,0,Math.max(w.rx,w.ry));wg.addColorStop(0,'#62808a');wg.addColorStop(.6,'#3d5862');wg.addColorStop(1,'#263840');c.fillStyle=wg;ell(c,0,0,w.rx,w.ry);
    c.strokeStyle='rgba(255,255,255,.2)';c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.ellipse(-w.rx*.2+i*8,-w.ry*.25+i*6,w.rx*(.5-i*.12),w.ry*(.28-i*.06),0,Math.PI*1.1,Math.PI*1.7);c.stroke();}
    c.restore();}
  // grass blades drawn on a separate layer that sits on top of ground units
  const top=document.createElement('canvas');top.width=W;top.height=H;const t=top.getContext('2d');t.lineCap='round';
  for(const e of M.grass){const n=e.rx*e.ry/40;for(let i=0;i<n;i++){const a=R()*6.28,rr=Math.sqrt(R()),lx=Math.cos(a)*rr*e.rx,ly=Math.sin(a)*rr*e.ry;
      if(rr>.8&&R()<.6)continue;const x=e.x+lx*Math.cos(e.rot)-ly*Math.sin(e.rot),y=e.y+lx*Math.sin(e.rot)+ly*Math.cos(e.rot),ba=-Math.PI/2+(R()-.5)*1.2,l=10+R()*16;
      t.strokeStyle=`hsla(${80+R()*35},${38+R()*22}%,${24+R()*18}%,.9)`;t.lineWidth=1.5+R();t.beginPath();t.moveTo(x,y);
      t.quadraticCurveTo(x+Math.cos(ba)*l*.5+2,y+Math.sin(ba)*l*.5,x+Math.cos(ba)*l,y+Math.sin(ba)*l);t.stroke();}}
  const mg=document.createElement('canvas');mg.width=240;mg.height=Math.round(240*H/W);const m=mg.getContext('2d');m.drawImage(g,0,0,mg.width,mg.height);m.drawImage(top,0,0,mg.width,mg.height);
  return{ground:g,grassTop:top,mini:mg};}
