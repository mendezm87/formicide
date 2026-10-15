'use strict';
// ---------- in-game HUD ----------
let toastT=0;function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2800);}
let lastSig='',grpSig='',objT=0;
const coarse=()=>matchMedia('(pointer:coarse)').matches;
const costHtml=c=>`${c.f}<i class="ico f"></i>`+(c.h?` ${c.h}<i class="ico h"></i>`:'');
function addBtn(label,sub,fn,dis,on,title){const b=document.createElement('button');b.className='cb'+(on?' on':'');b.innerHTML=label+(sub?`<small>${sub}</small>`:'');
  b.disabled=!!dis;if(title)b.title=title;b.onclick=fn;$('cmds').appendChild(b);}
function unitStatus(u){let s=STATE_TXT[u.state]||'';if(u.patrol)s='Patrolling';if(u.charge)s='Tunneling';if(u.carry)s+=u.carryK==='honey'?', carrying honeydew':', carrying food';
  if(u.stunT>0)s+=', stunned';if(u.burnT>0)s+=', burning';if(u.buffT>0)s+=u.buffK==='rally'?', rallied':', blazing';if(u.inGrass)s+=', hidden in grass';if(u.onMound)s+=', on high ground';
  if(u.orders.length)s+=` (+${u.orders.length} queued)`;return s;}
function buildPanel(){const info=$('info'),cmds=$('cmds');cmds.innerHTML='';const T=teams[PLAYER],tap=coarse()?'Tap':'Click';
  if(!sel.length){info.innerHTML=`<div class="nm">Nothing selected</div><div class="mut">${coarse()?'Tap an ant to select it. Drag to scroll, pinch to zoom.':'Click or drag a box around your ants. Right-click to give orders.'}</div>`;return;}
  const s0=sel[0];
  if(s0.team!==PLAYER||s0.kind==='food'){const d=s0.kind==='bld'?BLD[s0.type]:UNIT[s0.type];
    info.innerHTML=`<div class="nm">${d.name} <span class="tag">${s0.team===NEU?'Wild':teams[s0.team].name}</span></div><div class="bar"><i id="selhp"></i></div><div class="mut">${d.desc}</div>`;return;}
  if(s0.kind==='bld'){const d=BLD[s0.type];let h=`<div class="nm">${d.name}</div><div class="bar"><i id="selhp"></i></div>`;
    if(!s0.built){info.innerHTML=h+`<div class="mut">Under construction <span id="cpct"></span></div>`;addBtn('Cancel','75% refund',()=>{cancelBld(s0);setSel([]);});return;}
    if(s0.type==='spire'){info.innerHTML=h+`<div class="mut" id="spst"></div>`;addBtn('Unleash','Swarm',()=>armSwarm(s0),s0.spT>0,tmode&&tmode.k==='swarm','Q: '+d.desc);return;}
    if(s0.queue.length){const it=s0.queue[0];h+=`<div class="mut">${UPG[it]?'Researching':'Training'} ${(UNIT[it]||UPG[it]).name}${s0.blocked?', waiting for supply':''}</div><div class="bar q"><i id="qprog"></i></div>
      <div class="qrow">${s0.queue.map((q,i)=>`<button class="qi" data-i="${i}" title="Cancel and refund">${(UNIT[q]||UPG[q]).name.split(' ').pop()} ✕</button>`).join('')}</div>`;}
    else h+=`<div class="mut">${d.desc}${trainsOf(s0).length?` Right-click${coarse()?' (or tap)':''} the map to set a rally point.`:''}${s0.hp<s0.maxhp?' Damaged: send workers to repair it.':''}</div>`;
    info.innerHTML=h;info.querySelectorAll('.qi').forEach(b=>b.onclick=()=>{cancelQ(s0,+b.dataset.i);lastSig='';});
    const K='QWERT';
    trainsOf(s0).forEach((t,i)=>{const u=UNIT[t],ok=reqMet(PLAYER,u.req),c=costOf(PLAYER,t),busy=u.hero&&princessBusy(PLAYER);
      addBtn(t==='princess'&&T.princessDied?'Revive Princess':u.name,!ok?reqTxt(u.req):busy?'Active':costHtml(c),()=>enqueue(s0,t),!ok||busy||T.food<c.f||T.honey<c.h||s0.queue.length>=5,false,`${K[i]}: ${u.desc} ${u.sup} supply.`);});
    if(d.research)d.research.forEach((k,i)=>{const g=UPG[k],done=T.up[k],busy=researching(PLAYER,k),c=costOf(PLAYER,k);
      addBtn(g.name,done?'Done':busy?'In progress':costHtml(c),()=>enqueue(s0,k),done||busy||T.food<c.f||T.honey<c.h||s0.queue.length>=5,done,`${K[i]}: ${g.desc}`);});
    return;}
  const cnt={};for(const u of sel)cnt[u.type]=(cnt[u.type]||0)+1;
  if(buildMenu){info.innerHTML=tmode&&tmode.k==='build'?`<div class="nm">${BLD[tmode.type].name}</div><div class="mut">${BLD[tmode.type].desc}</div>`:`<div class="nm">Build a structure</div><div class="mut">Pick one, then ${tap.toLowerCase()} a clear spot. Hold Shift to place several.</div>`;
    BUILDABLE.forEach((t,i)=>{const d=BLD[t],ok=reqMet(PLAYER,d.req),c=costOf(PLAYER,t),on=tmode&&tmode.type===t;
      addBtn(d.name,ok?costHtml(c):reqTxt(d.req),()=>chooseBuild(t),!ok||((T.food<c.f||T.honey<c.h)&&!on),on,`${i+1}: ${d.desc}`);});
    addBtn('Back','',()=>{buildMenu=false;tmode=null;});return;}
  if(sel.length===1){const u=s0,d=UNIT[u.type],tag=d.hero?'Level '+u.lvl:u.rank?VET_NAME[u.rank]:'';
    info.innerHTML=`<div class="nm">${d.name}${tag?` <span class="tag">${tag}</span>`:''}</div><div class="bar"><i id="selhp"></i></div>${d.hero&&u.lvl<5?'<div class="bar xp"><i id="selxp"></i></div>':''}<div class="mut" id="selst"></div>`;}
  else info.innerHTML=`<div class="nm">${sel.length} selected</div><div class="mut">${Object.entries(cnt).map(([t,n])=>`${n} ${UNIT[t].name}${n>1?'s':''}`).join(', ')}</div>`;
  if(cnt.worker)addBtn('Build','structures',()=>{buildMenu=true;tmode=null;},false,false,'B: open the build menu');
  if(Object.keys(cnt).some(t=>!UNIT[t].noAtk))addBtn('Attack','move',()=>{tmode=tmode&&tmode.k==='amove'?null:{k:'amove'};},false,tmode&&tmode.k==='amove','A: move and fight anything on the way');
  addBtn('Stop','',stopSel,false,false,'S: stop and clear queued orders');
  addBtn('Hold','position',holdSel,false,false,'H: stand ground and only fight what is in range');
  addBtn('Patrol','',()=>{tmode={k:'patrol'};},false,tmode&&tmode.k==='patrol','P: walk back and forth, fighting anything on the way');
  const abs=[];for(const u of sel){const d=UNIT[u.type];if(d.abil&&!abs.includes(d.abil))abs.push(d.abil);if(d.abil2&&u.lvl>=(ABIL[d.abil2].lvl||0)&&!abs.includes(d.abil2))abs.push(d.abil2);}
  for(const k of abs){const A=ABIL[k];addBtn(A.name,`<span id="cd-${k}"></span>`,()=>useAbility(k),false,tmode&&tmode.a===k,`${A.key}: ${A.desc}`);}}
function updGroups(){const ks=Object.keys(groups).filter(n=>groups[n].some(e=>!e.dead)),c=coarse(),own=sel.some(e=>e.team===PLAYER);
  const sig=ks.map(n=>n+':'+groups[n].filter(e=>!e.dead).length).join()+c+own;if(sig===grpSig)return;grpSig=sig;const el=$('groups');el.innerHTML='';
  for(const n of ks){const b=document.createElement('button');b.className='gc';b.title=`Group ${n} (press ${n})`;b.innerHTML=`${n}<small>${groups[n].filter(e=>!e.dead).length}</small>`;b.onclick=()=>recallGroup(+n);el.appendChild(b);}
  if(c&&own){const b=document.createElement('button');b.className='gc';b.textContent='+ Group';b.onclick=()=>{let n=1;while(n<9&&groups[n]&&groups[n].some(e=>!e.dead))n++;setGroup(n,false);};el.appendChild(b);}}
function updObj(){if(!mission)return;const el=$('obj');
  for(const o of mission.obj){if(o.done&&!o._was&&!o.hidden){o._was=true;if(gameTime>1){announce('Objective complete: '+(typeof o.text==='function'?o.text():o.text),'Objective complete',1000);sfx('research');}}}
  const items=mission.obj.filter(o=>!o.hidden).map(o=>`<li class="${o.done?'done':''}${o.opt?' opt':''}">${typeof o.text==='function'?o.text():o.text}</li>`).join('');
  const h=`<h4>${mission.name}</h4><ul>${items}</ul>`;if(h!==el._h){el._h=h;el.innerHTML=h;}}
function updateUI(){const s0=sel[0],T=teams[PLAYER];
  const abReady=sel.length&&s0.kind==='unit'?Object.keys(ABIL).map(k=>casters(k).some(u=>(u.acd[k]||0)<=0)?1:0).join(''):'';
  const sig=sel.map(e=>e.id).join(',')+'|'+buildMenu+JSON.stringify(tmode)+'|'+(s0?(s0.kind==='bld'?s0.queue.join()+s0.built+s0.blocked+(s0.spT>0)+(s0.hp<s0.maxhp):sel.length===1?s0.lvl+'.'+s0.rank:''):'')+'|'+
    [50,75,100,125,150,175,200,250,300,400].map(c=>T.food>=c?1:0).join('')+[25,50,75,100,150,200].map(c=>T.honey>=c?1:0).join('')+Object.keys(T.up).join()+
    ['chamber','pit','vault'].map(t=>hasBuilt(PLAYER,t)?1:0).join('')+researching(PLAYER,'x')+blds.filter(b=>b.team===PLAYER&&b.type==='pit').map(b=>b.queue.join()).join()+princessBusy(PLAYER)+T.princessDied+abReady;
  if(sig!==lastSig){lastSig=sig;buildPanel();}
  const hp=$('selhp');if(hp&&s0)hp.style.width=clamp(s0.hp/s0.maxhp*100,0,100)+'%';
  const xp=$('selxp');if(xp&&s0)xp.style.width=clamp((s0.xp-HERO_LVL[s0.lvl-1])/(HERO_LVL[s0.lvl]-HERO_LVL[s0.lvl-1])*100,0,100)+'%';
  const st=$('selst');if(st&&s0)st.textContent=unitStatus(s0);
  const qp=$('qprog');if(qp&&s0&&s0.queue&&s0.queue.length)qp.style.width=Math.min(100,s0.qt/qTime(s0,s0.queue[0])*100)+'%';
  const cp=$('cpct');if(cp&&s0)cp.textContent=Math.floor(s0.prog*100)+'%'+(s0.started?'':', waiting for a worker');
  const sp=$('spst');if(sp&&s0)sp.textContent=s0.spT>0?`Charging: ${fmtT(s0.spT)} until the swarm is ready.`:'Ready! Press Unleash, then pick a spot you can see.';
  for(const k in ABIL){const el=$('cd-'+k);if(!el)continue;const cs=casters(k);const m=cs.length?Math.min(...cs.map(u=>u.acd[k]||0)):0;el.textContent=m>0?Math.ceil(m)+'s':'Ready ('+ABIL[k].key+')';}
  $('food').textContent=Math.floor(T.food);$('honey').textContent=Math.floor(T.honey);const used=supUsed(PLAYER),cap=supCap(PLAYER);$('pop').textContent=used;$('cap').textContent=cap;$('pop').style.color=used>=cap&&cap>0?'var(--bad)':'';
  $('clock').textContent=fmtT(gameTime);
  const hint=$('hint'),t=coarse()?'Tap':'Click',tm=tmode;
  const txt=tm?tm.k==='build'?`${t} a clear spot to place the ${BLD[tm.type].name}`:tm.k==='amove'?`${t} a spot or enemy to attack-move`:tm.k==='patrol'?`${t} where to patrol to`:tm.k==='abil'?`${t} a target for ${ABIL[tm.a].name}`:`${t} a spot you can see to unleash the swarm`:boxMode?'Drag to select a group':'';
  if(hint.textContent!==txt){hint.style.display=txt?'block':'none';hint.textContent=txt;}$('bBox').classList.toggle('on',boxMode);
  const sh=blds.filter(b=>b.type==='spire'&&b.built&&!b.dead).slice(0,3).map(b=>{const S=teams[b.team];return`<span class="sp${b.spT<=0?' rdy':''}" style="border-color:${S.col.ui}">${b.team===PLAYER?'Your':S.name} swarm ${b.spT>0?fmtT(b.spT):'READY'}</span>`;}).join('');
  const se=$('spires');if(se._h!==sh){se._h=sh;se.innerHTML=sh;}
  panelH=$('panel').offsetHeight||panelH;updGroups();$('groups').style.bottom=(panelH+8)+'px';$('hint').style.bottom=(panelH+16)+'px';
  objT-=1/60;if(objT<=0){objT=.3;updObj();}}

// ---------- menus ----------
function card(h){$('overlay').classList.remove('hide');$('card').innerHTML=h;$('card').scrollTop=0;}
const opts=(obj,cur,lab)=>Object.entries(obj).map(([k,v])=>`<option value="${k}"${k===cur?' selected':''}>${lab(v,k)}</option>`).join('');
function scrMain(){running=false;musicStop();rainSound(false);
  card(`<h1>Formicide</h1><canvas id="hero" width="700" height="200"></canvas><div class="sub">Ant colony real-time strategy</div>
  <div class="menu"><button class="mb" id="mCamp">Campaign</button><button class="mb" id="mSkir">Skirmish</button><button class="mb sm" id="mHow">How to play</button><button class="mb sm" id="mSet">Settings</button></div>`);
  drawHero();$('mCamp').onclick=scrCampaign;$('mSkir').onclick=scrSkirmish;$('mHow').onclick=()=>scrHow(scrMain);$('mSet').onclick=()=>scrSettings(scrMain);}
const SK=Object.assign({fac:'black',map:'clearing',opp:'1',diff:'normal',pers:'random',res:'normal',speed:'1',weather:true,creeps:true},store('skirmish')||{});
function scrSkirmish(){
  card(`<h2>Skirmish</h2>
  <div class="row"><label for="sFac">Your colony</label><select id="sFac">${opts(FACTIONS,SK.fac,f=>f.name)}</select></div><div class="note" id="sPerk"></div>
  <div class="row"><label for="sMap">Map</label><select id="sMap">${opts(MAPS,SK.map,m=>m.name)}</select></div><div class="note" id="sMapD"></div>
  <div class="row"><label for="sOpp">Opponents</label><select id="sOpp">${opts({1:1,2:2},SK.opp,v=>v===1?'1 rival colony':'2 rival colonies (free-for-all)')}</select></div>
  <div class="row"><label for="sDiff">Difficulty</label><select id="sDiff">${opts(DIFF,SK.diff,d=>d.name)}</select></div>
  <div class="row"><label for="sPers">AI style</label><select id="sPers">${opts(Object.assign({random:{name:'Random'}},PERS),SK.pers,p=>p.name)}</select></div>
  <div class="row"><label for="sRes">Starting resources</label><select id="sRes">${opts({low:'Low',normal:'Normal',high:'High'},SK.res,v=>v)}</select></div>
  <div class="row"><label for="sSpd">Game speed</label><select id="sSpd">${opts({'0.75':'Slow','1':'Normal','1.25':'Fast','1.5':'Faster'},SK.speed,v=>v)}</select></div>
  <div class="row"><label for="sW">Rain and giant footsteps</label><input type="checkbox" id="sW"${SK.weather?' checked':''}></div>
  <div class="row"><label for="sC">Wild creatures</label><input type="checkbox" id="sC"${SK.creeps?' checked':''}></div>
  <div class="menu"><button class="mb" id="sGo">Start</button><button class="mb sm" id="sBack">Back</button></div>`);
  const upd=()=>{SK.fac=$('sFac').value;SK.map=$('sMap').value;SK.opp=$('sOpp').value;SK.diff=$('sDiff').value;SK.pers=$('sPers').value;SK.res=$('sRes').value;SK.speed=$('sSpd').value;SK.weather=$('sW').checked;SK.creeps=$('sC').checked;
    $('sPerk').textContent=FACTIONS[SK.fac].perk+' Unique unit: '+UNIT[FACTIONS[SK.fac].unique].name+'.';
    $('sMapD').textContent=MAPS[SK.map].desc+(+SK.opp+1>MAPS[SK.map].max?' (Too small for 3 colonies: Four Corners will be used.)':'');store('skirmish',SK);};
  $('card').querySelectorAll('select,input').forEach(e=>e.onchange=upd);upd();
  $('sGo').onclick=startSkirmish;$('sBack').onclick=scrMain;}
function startSkirmish(){const others=['black','red','gold'].filter(f=>f!==SK.fac),np=1+ +SK.opp;let map=SK.map;if(np>MAPS[map].max)map='corners';
  const res={low:{food:100,honey:0},normal:{food:150,honey:50},high:{food:500,honey:200}}[SK.res];
  const players=[{fac:SK.fac}];for(let i=0;i<np-1;i++)players.push({fac:others[i],ai:{diff:SK.diff,pers:SK.pers}});
  beginGame({mode:'skirmish',map,seed:map==='random'?(Math.random()*1e9|0):{clearing:7,puddles:13,grass:21,corners:5}[map],players,res,speed:+SK.speed,weather:SK.weather,creeps:SK.creeps});
  toast('Gather food, then build a Fungus Garden and a War Chamber');}
function scrCampaign(){const un=store('camp')||0,cd=store('campDiff')||'normal';
  card(`<h2>Campaign</h2><div class="note">Lead the Black Carpenter Legion through six missions.</div>
  <div class="row"><label for="cDiff">Difficulty</label><select id="cDiff">${opts(DIFF,cd,d=>d.name)}</select></div>
  <div class="mis">${MISSIONS.map((m,i)=>`<button class="mi" data-i="${i}"${i>un?' disabled':''}><b>${i+1}</b><div><div>${m.name}${i<un||store('campDone')&&i===MISSIONS.length-1?' ✓':''}</div><span>${i>un?'Locked: finish the previous mission':m.sub}</span></div></button>`).join('')}</div>
  <div class="menu"><button class="mb sm" id="cBack">Back</button></div>`);
  $('cDiff').onchange=()=>store('campDiff',$('cDiff').value);$('cBack').onclick=scrMain;
  $('card').querySelectorAll('.mi').forEach(b=>b.onclick=()=>scrBrief(+b.dataset.i));}
function scrBrief(i){const m=MISSIONS[i];
  card(`<h2>Mission ${i+1}: ${m.name}</h2><div class="brief">${m.brief}</div>${m.tip?`<div class="note" style="margin-top:8px">Tip: ${m.tip}</div>`:''}
  <div class="menu"><button class="mb" id="bGo">Begin</button><button class="mb sm" id="bBack">Back</button></div>`);
  $('bGo').onclick=()=>startMission(i);$('bBack').onclick=scrCampaign;}
function startMission(i){const cd=CAMP_DIFF[store('campDiff')||'normal'],M=MISSIONS[i],m=M.make(cd);m.idx=i;m.name=`${i+1}. ${M.name}`;
  beginGame(Object.assign({mode:'mission',res:{food:150,honey:50},speed:1},m.conf,{mission:m}));}
function scrSettings(back){
  card(`<h2>Settings</h2>
  <div class="row"><label for="stVol">Volume</label><input type="range" id="stVol" min="0" max="1" step="0.05" value="${SET.vol}"></div>
  <div class="row"><label for="stSfx">Sound effects</label><input type="checkbox" id="stSfx"${SET.sfx?' checked':''}></div>
  <div class="row"><label for="stMus">Music</label><input type="checkbox" id="stMus"${SET.music?' checked':''}></div>
  <div class="row"><label for="stVo">Announcer voice</label><input type="checkbox" id="stVo"${SET.voice?' checked':''}></div>
  <div class="note">The announcer uses your browser's built-in speech voice.</div>
  <div class="menu"><button class="mb sm" id="stBack">Back</button></div>`);
  audioInit();audioResume();
  const upd=()=>{SET.vol=+$('stVol').value;SET.sfx=$('stSfx').checked;SET.music=$('stMus').checked;SET.voice=$('stVo').checked;SET.mute=false;saveSet();updSoundBtn();sfx('select');};
  $('card').querySelectorAll('input').forEach(e=>e.onchange=upd);$('stBack').onclick=back;}
function scrHow(back){
  card(`<h2>How to play</h2><div class="how">
  <h3>Goal</h3><p>Gather food and honeydew, grow your colony, and destroy every rival Queen's Nest. In the campaign, follow the mission objectives in the top-left corner.</p>
  <h3>Mouse and keyboard</h3><ul>
  <li>Left-click or drag a box to select. Double-click an ant to select all of that kind on screen. Right-click to move, gather, attack or repair.</li>
  <li>Hold <b>Shift</b> while giving orders to queue them up. Right-drag or arrow keys to scroll, wheel to zoom, Space to jump to the latest alert.</li>
  <li><b>A</b> attack-move, <b>S</b> stop, <b>H</b> hold position, <b>P</b> patrol, <b>D</b> and <b>F</b> abilities, <b>B</b> build menu then <b>1-7</b>.</li>
  <li><b>Ctrl or Alt + 1-9</b> saves a control group, <b>1-9</b> selects it, press twice to jump to it. Shift + number adds to a group.</li>
  <li>With a structure selected, <b>Q W E R T</b> press its buttons. <b>Esc</b> opens the menu, <b>F10</b> pauses.</li></ul>
  <h3>Touch</h3><ul><li>Tap to select, double-tap to select all of a kind, tap the ground to command. Drag to scroll, pinch to zoom, ⬚ Box to drag-select, + Group to save a group.</li></ul>
  <h3>Economy</h3><ul><li><b>Food</b> comes from sugar and seed piles. <b>Honeydew</b> comes from aphid herds (little green bugs), which slowly refill. Advanced ants and upgrades need honeydew.</li>
  <li>Build an <b>Outpost Nest</b> near distant food so workers have a short trip. Fungus Gardens add supply.</li>
  <li>Your structures lay <b>pheromone trails</b> around them: your ants move 20% faster on them, heal when resting there, and ignore the rain.</li></ul>
  <h3>Combat</h3><ul><li>Melee ants cannot hit flyers. Spitters, Sky Lancers and Acid Towers can.</li>
  <li>Ants earn ranks from kills: Veteran, Elite and Heroic ranks give more health and damage.</li>
  <li>The <b>Warrior Princess</b> is a hero who levels up, boosts nearby ants and can be revived if she falls.</li>
  <li>Units hidden in <b>tall grass</b> can't be seen until enemies get close. Ranged ants on <b>high ground</b> see and shoot further.</li>
  <li>Kill <b>wild creatures</b> for a bounty of food and honeydew.</li></ul>
  <h3>Hazards and superweapons</h3><ul><li><b>Rain</b> slows ants that are off their trails. Watch for a growing <b>shadow</b>: a giant footstep is about to land.</li>
  <li>A <b>Swarm Spire</b> charges for 4 minutes, then unleashes 16 Swarmlings anywhere you can see. Everyone can see every spire's countdown.</li></ul>
  <h3>Colonies</h3><ul>${Object.values(FACTIONS).map(f=>`<li><b>${f.name}</b>: ${f.perk} Unique: ${UNIT[f.unique].name}.</li>`).join('')}</ul>
  </div><div class="menu"><button class="mb sm" id="hBack">Back</button></div>`);$('hBack').onclick=back;}
function scrPause(){card(`<h2>Paused</h2><div class="menu"><button class="mb" id="pRes">Resume</button><button class="mb sm" id="pRe">Restart</button><button class="mb sm" id="pHow">How to play</button><button class="mb sm" id="pSet">Settings</button><button class="mb sm" id="pQuit">Quit to menu</button></div>`);
  $('pRes').onclick=resumeGame;$('pRe').onclick=restart;$('pHow').onclick=()=>scrHow(scrPause);$('pSet').onclick=()=>scrSettings(scrPause);$('pQuit').onclick=scrMain;}
function openPause(){if(!running||gameOver)return;paused=true;scrPause();}
function resumeGame(){paused=false;$('overlay').classList.add('hide');}
function restart(){if(mission)startMission(mission.idx);else beginGame(Object.assign({},cfg,{seed:cfg.map==='random'?(Math.random()*1e9|0):cfg.seed}));}
function endGame(win){if(gameOver)return;gameOver=true;rainSound(false);sampleStats();const m=mission;
  say(win?(m?'Mission accomplished':'Victory'):(m?'Mission failed':'Defeat'),0);sfx(win?'level':'alert');
  if(win&&m){if(m.idx+1>(store('camp')||0))store('camp',Math.min(MISSIONS.length-1,m.idx+1));if(m.idx===MISSIONS.length-1)store('campDone',true);}
  const sub=m?(m.endMsg||(win?(m.idx===MISSIONS.length-1?'The garden belongs to the Black Legion. You have finished the campaign!':'Objectives complete.'):'')):(win?"Every rival Queen's Nest has fallen.":'Your Queen’s Nest was destroyed.');
  const rows=teams.filter(T=>!T.neutral).map(T=>{const s=T.stats;return`<tr><td><i class="dot" style="background:${T.col.ui}"></i>${T.name}${T.id===PLAYER?' (you)':''}</td><td>${Math.floor(s.gathered)}</td><td>${Math.floor(s.honey)}</td><td>${s.trained}</td><td>${s.killed}</td><td>${s.lost}</td><td>${s.bldKilled}</td></tr>`;}).join('');
  const next=win&&m&&m.idx<MISSIONS.length-1;
  card(`<h1>${win?(m?'Mission complete':'Victory'):(m?'Mission failed':'Defeat')}</h1><div class="sub">${sub}</div><div class="note">Game time ${fmtT(gameTime)}</div>
  <table class="st"><thead><tr><th>Colony</th><th>Food</th><th>Honey</th><th>Trained</th><th>Kills</th><th>Lost</th><th>Razed</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="note">Army size over time</div><canvas id="chart" width="900" height="280"></canvas>
  <div class="menu">${next?'<button class="mb" id="eNext">Next mission</button>':''}<button class="mb${next?' sm':''}" id="eAgain">${m?(win?'Replay':'Retry'):'Play again'}</button><button class="mb sm" id="eMenu">${m?'Mission list':'Main menu'}</button></div>`);
  drawChart();
  if(next)$('eNext').onclick=()=>scrBrief(m.idx+1);$('eAgain').onclick=restart;$('eMenu').onclick=()=>{scrMain();if(m)scrCampaign();};}
function drawChart(){const c=$('chart').getContext('2d'),w=900,h=280,S=stats.samples,pad=34;c.clearRect(0,0,w,h);if(S.length<2)return;
  const maxT=S[S.length-1].t||1,maxA=Math.max(10,...S.flatMap(s=>s.army));
  c.strokeStyle='rgba(255,255,255,.1)';c.lineWidth=1;c.font='18px "Chakra Petch",sans-serif';c.fillStyle='rgba(244,233,212,.6)';
  for(let i=0;i<=4;i++){const y=h-pad-(h-pad*1.5)*i/4;c.beginPath();c.moveTo(pad,y);c.lineTo(w-8,y);c.stroke();c.fillText(Math.round(maxA*i/4),2,y+6);}
  c.fillText('0:00',pad,h-6);c.textAlign='right';c.fillText(fmtT(maxT),w-8,h-6);c.textAlign='left';
  teams.filter(T=>!T.neutral).forEach((T,i)=>{c.strokeStyle=T.col.ui;c.lineWidth=3;c.beginPath();
    S.forEach((s,k)=>{const x=pad+(w-pad-8)*s.t/maxT,y=h-pad-(h-pad*1.5)*s.army[i]/maxA;k?c.lineTo(x,y):c.moveTo(x,y);});c.stroke();});}
function updSoundBtn(){$('bSound').textContent=SET.mute?'🔇':'🔊';}
