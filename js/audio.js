'use strict';
// All sound is synthesized with the Web Audio API; the announcer uses the browser's speech synthesis.
const SET={vol:.7,sfx:true,music:true,voice:true};
Object.assign(SET,store('settings')||{});
function saveSet(){store('settings',SET);applyVol();}
const AU={ctx:null,master:null,sfxBus:null,musBus:null,noise:null,last:{},rain:null};

function audioInit(){if(AU.ctx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  try{const c=new AC();AU.ctx=c;AU.master=c.createGain();AU.master.connect(c.destination);
    const comp=c.createDynamicsCompressor();comp.connect(AU.master);
    AU.sfxBus=c.createGain();AU.sfxBus.connect(comp);AU.musBus=c.createGain();AU.musBus.connect(comp);
    const buf=c.createBuffer(1,c.sampleRate,c.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;AU.noise=buf;
    applyVol();}catch(_){AU.ctx=null;}}
function audioResume(){if(AU.ctx&&AU.ctx.state==='suspended')AU.ctx.resume();}
function applyVol(){if(!AU.ctx)return;const t=AU.ctx.currentTime;AU.master.gain.setTargetAtTime(SET.mute?0:SET.vol,t,.05);
  AU.sfxBus.gain.setTargetAtTime(SET.sfx?1:0,t,.05);AU.musBus.gain.setTargetAtTime(SET.music?.32:0,t,.2);}

function tone(f,dur,type,g,f2,when,bus){const c=AU.ctx,t=when||c.currentTime,o=c.createOscillator(),a=c.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
  a.gain.setValueAtTime(.0001,t);a.gain.exponentialRampToValueAtTime(Math.max(.0002,g),t+.006);a.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(a);a.connect(bus||AU.sfxBus);o.start(t);o.stop(t+dur+.03);}
function noise(dur,g,ftype,freq,q,when,bus,f2){const c=AU.ctx,t=when||c.currentTime,s=c.createBufferSource(),f=c.createBiquadFilter(),a=c.createGain();
  s.buffer=AU.noise;s.loop=true;f.type=ftype||'lowpass';f.frequency.setValueAtTime(freq||1000,t);if(f2)f.frequency.exponentialRampToValueAtTime(f2,t+dur);f.Q.value=q||1;
  a.gain.setValueAtTime(.0001,t);a.gain.exponentialRampToValueAtTime(Math.max(.0002,g),t+.006);a.gain.exponentialRampToValueAtTime(.0001,t+dur);
  s.connect(f);f.connect(a);a.connect(bus||AU.sfxBus);s.start(t,Math.random()*.5);s.stop(t+dur+.03);}
const now0=()=>AU.ctx.currentTime;

// [minimum ms between plays, synth]
const SFX={
  bite:[60,g=>noise(.06,.22*g,'bandpass',1800,2)],
  spit:[70,g=>noise(.12,.16*g,'highpass',2600,1,0,0,700)],
  zap:[70,g=>tone(900,.09,'square',.05*g,380)],
  flame:[110,g=>noise(.2,.14*g,'bandpass',700,.7,0,0,1500)],
  boom:[90,g=>{noise(.45,.45*g,'lowpass',500,1,0,0,80);tone(90,.35,'sine',.45*g,35);}],
  die:[60,g=>{noise(.1,.12*g,'lowpass',900);tone(300,.12,'triangle',.05*g,120);}],
  crumble:[200,g=>noise(.8,.4*g,'lowpass',300,1,0,0,60)],
  select:[80,g=>{tone(660,.05,'sine',.1*g);tone(990,.06,'sine',.07*g,0,now0()+.04);}],
  cmd:[80,g=>tone(520,.07,'triangle',.1*g,780)],
  error:[150,g=>tone(180,.14,'square',.06*g,150)],
  ready:[300,g=>{const t=now0();tone(660,.12,'sine',.1*g,0,t);tone(880,.18,'sine',.1*g,0,t+.1);}],
  build:[400,g=>{const t=now0();[523,659,784].forEach((f,i)=>tone(f,.25,'triangle',.1*g,0,t+i*.09));}],
  research:[400,g=>{const t=now0();[587,740,880,1175].forEach((f,i)=>tone(f,.25,'sine',.08*g,0,t+i*.08));}],
  alert:[1500,g=>{const t=now0();for(let i=0;i<4;i++)tone(i%2?330:440,.16,'sawtooth',.05*g,0,t+i*.17);}],
  stomp:[300,g=>{tone(70,.9,'sine',.8*g,25);noise(.9,.55*g,'lowpass',250,1,0,0,40);}],
  heal:[300,g=>tone(880,.3,'sine',.06*g,1320)],
  swarm:[500,g=>{const t=now0();for(let i=0;i<14;i++)tone(1200+Math.random()*1600,.05,'square',.025*g,0,t+i*.04+Math.random()*.03);}],
  level:[500,g=>{const t=now0();[523,659,784,1047].forEach((f,i)=>tone(f,.2,'square',.04*g,0,t+i*.07));}],
  charge:[300,g=>noise(.5,.3*g,'lowpass',200,1,0,0,900)],
  rally:[400,g=>tone(220,.35,'sawtooth',.07*g,440)]
};
function sfx(n,x,y){if(!AU.ctx||!SET.sfx)return;const s=SFX[n];if(!s)return;const now=performance.now();if(now-(AU.last[n]||0)<s[0])return;
  let g=1;if(x!=null&&vw){const cx=cam.x+vw/cam.z/2,cy=cam.y+vh/cam.z/2,d=Math.hypot(x-cx,y-cy),R=Math.max(vw,vh)/cam.z*.6;
    if(d>R*1.6)return;if(d>R)g=1-(d-R)/(R*.6);if(g<=.05)return;}
  AU.last[n]=now;try{s[1](g);}catch(_){}}

function rainSound(on){if(!AU.ctx)return;const c=AU.ctx,t=c.currentTime;
  if(on&&!AU.rain){const s=c.createBufferSource(),f=c.createBiquadFilter(),a=c.createGain();s.buffer=AU.noise;s.loop=true;f.type='lowpass';f.frequency.value=1600;
    a.gain.setValueAtTime(.0001,t);a.gain.exponentialRampToValueAtTime(.09,t+3);s.connect(f);f.connect(a);a.connect(AU.sfxBus);s.start();AU.rain={s,a};}
  else if(!on&&AU.rain){const r=AU.rain;AU.rain=null;r.a.gain.setTargetAtTime(.0001,t,.8);r.s.stop(t+4);}}

// ---------- announcer ----------
const VO={last:{},voice:null};
function pickVoice(){const vs=speechSynthesis.getVoices();VO.voice=vs.find(v=>/^en/i.test(v.lang)&&/david|daniel|george|guy|male|mark|fred/i.test(v.name))||vs.find(v=>/^en/i.test(v.lang))||null;}
if('speechSynthesis' in window){pickVoice();speechSynthesis.onvoiceschanged=pickVoice;}
function say(line,gap){if(!line||!SET.voice||SET.mute||!('speechSynthesis' in window))return;const now=performance.now();if(now-(VO.last[line]||-1e9)<(gap||8000))return;VO.last[line]=now;
  if(speechSynthesis.pending)return;
  try{const u=new SpeechSynthesisUtterance(line);if(VO.voice)u.voice=VO.voice;u.rate=1.05;u.pitch=.6;u.volume=Math.min(1,SET.vol*1.3);speechSynthesis.speak(u);}catch(_){}}

// ---------- music: a looping procedural groove that gets busier during fights ----------
const MUS={on:false,timer:0,next:0,step:0,intensity:.2};
const SCALE=[146.83,174.61,196,220,261.63,293.66,349.23];
const BASS=[0,0,3,0,2,0,1,0, 0,0,3,0,4,3,2,1];
function musicStart(){if(!AU.ctx||MUS.on)return;MUS.on=true;MUS.next=AU.ctx.currentTime+.15;MUS.step=0;MUS.timer=setInterval(musicTick,90);}
function musicStop(){MUS.on=false;clearInterval(MUS.timer);}
function musicTick(){const c=AU.ctx;if(!c||!MUS.on||!SET.music)return;const spb=60/94/2,B=AU.musBus;
  while(MUS.next<c.currentTime+.3){const t=MUS.next,s=MUS.step%16,bar=Math.floor(MUS.step/16)%4,I=MUS.intensity;
    if(s%8===0||(I>.55&&s===6))tone(110,.3,'sine',.5,38,t,B);
    if(s===4||s===12)noise(.16,.07+.12*I,'bandpass',1800,.8,t,B);
    if(s%4===2)noise(.04,.05+.04*I,'highpass',7000,1,t,B);
    if(I>.35&&s%2===1)noise(.03,.025,'highpass',8000,1,t,B);
    if(s%2===0){const n=SCALE[(BASS[s]+(bar===3?2:0))%SCALE.length]/2;tone(n,spb*1.7,'triangle',.18,0,t,B);}
    if(I>.5&&s%2===1&&Math.random()<.7)tone(SCALE[Math.random()*SCALE.length|0]*2,spb*.9,'square',.025,0,t,B);
    if(s===0){tone(SCALE[bar%3],spb*14,'sine',.04,0,t,B);tone(SCALE[(bar%3)+2],spb*14,'sine',.03,0,t,B);}
    MUS.next+=spb;MUS.step++;}}
