'use strict';
function resize(){dpr=Math.min(window.devicePixelRatio||1,2);const r=cv.getBoundingClientRect();vw=r.width;vh=r.height;
  cv.width=Math.round(vw*dpr);cv.height=Math.round(vh*dpr);fog.width=cv.width;fog.height=cv.height;
  const mr=mini.getBoundingClientRect(),mh=mr.width*H/W;mini.width=Math.round(mr.width*dpr);mini.height=Math.round(mh*dpr);mini.style.height=mh+'px';
  panelH=$('panel').offsetHeight||70;if(running)clampCam();}
addEventListener('resize',resize);
function beginGame(conf){audioInit();audioResume();if('speechSynthesis' in window)speechSynthesis.cancel();rainSound(false);
  $('overlay').classList.add('hide');resize();initGame(conf);resize();running=true;paused=false;lastSig='';grpSig='';$('obj')._h='';
  $('obj').classList.toggle('hide',!mission);$('groups').innerHTML='';
  const n=blds.find(b=>b.team===PLAYER&&b.type==='nest'),us=units.filter(u=>u.team===PLAYER);
  if(n)centerOn(n.x,n.y);else if(us.length){const c=centroid(us);centerOn(c.x,c.y);}
  musicStart();if(mission)announce(mission.name,null);}
$('bBox').onclick=()=>{boxMode=!boxMode;tmode=null;};
$('bArmy').onclick=()=>{const a=units.filter(u=>u.team===PLAYER&&u.type!=='worker');if(a.length)setSel(a);else toast('No fighters yet. Build a War Chamber.');};
$('bIdle').onclick=()=>{const a=units.filter(u=>u.team===PLAYER&&u.type==='worker'&&u.state==='idle');if(a.length){setSel(a);centerOn(a[0].x,a[0].y);}else toast('No idle workers');};
$('bNest').onclick=goNest;$('bMenu').onclick=openPause;
$('bSound').onclick=()=>{audioInit();SET.mute=!SET.mute;saveSet();updSoundBtn();if(SET.mute&&'speechSynthesis' in window)speechSynthesis.cancel();};
$('obj').onclick=()=>$('obj').classList.toggle('min');
updSoundBtn();

let last=performance.now();
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;animT=now/1000;
  requestAnimationFrame(frame);
  if(running)try{handleKeys(dt);if(!paused&&!gameOver){update(dt*(cfg.speed||1));MUS.intensity+=((combatT>0?1:.2)-MUS.intensity)*Math.min(1,dt*.8);}render();updateUI();}
  catch(e){console.error(e);}}
scrMain();if(document.fonts)document.fonts.ready.then(drawHero);
requestAnimationFrame(frame);
