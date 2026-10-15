'use strict';
// ---------- helpers ----------
const ZMIN=.4,ZMAX=1.8,MAXSUP=100,PLAYER=0,CELL=32;
const $=id=>document.getElementById(id);
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const d2=(a,b)=>(a.x-b.x)**2+(a.y-b.y)**2;
function ell(c,x,y,rx,ry,rot){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot||0,0,Math.PI*2);c.fill();}
const fmtT=s=>{s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
function store(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem('formicide.'+k));localStorage.setItem('formicide.'+k,JSON.stringify(v));}catch(_){}return null;}
const cv=$('game'),ctx=cv.getContext('2d');
const fog=document.createElement('canvas'),fctx=fog.getContext('2d');
const mini=$('mini'),mctx=mini.getContext('2d');

// ---------- colonies ----------
const COLORS={
  black:{body:'#17140f',hi:'rgba(255,255,255,.24)',leg:'#0b0a08',mand:'#3a332b',proj:'185,240,76',projHi:'220,255,140',ring:'rgba(18,15,12,.95)',mini:'#111',miniEdge:'#f4e9d4',bandA:'rgba(170,230,80,.9)',bandB:'rgba(255,150,60,.95)',ui:'#efe6d2'},
  red:{body:'#a3261a',hi:'rgba(255,205,175,.4)',leg:'#6e170f',mand:'#4d0f08',proj:'255,179,71',projHi:'255,220,140',ring:'rgba(200,44,30,.95)',mini:'#ff3b2a',miniEdge:'#3a0a04',bandA:'rgba(255,205,80,.95)',bandB:'rgba(255,225,100,.95)',ui:'#ff5a45'},
  gold:{body:'#c08a14',hi:'rgba(255,245,200,.5)',leg:'#6b4a08',mand:'#4a3306',proj:'111,214,255',projHi:'190,240,255',ring:'rgba(230,170,30,.95)',mini:'#ffc83a',miniEdge:'#3a2a05',bandA:'rgba(70,40,10,.85)',bandB:'rgba(90,50,10,.9)',ui:'#ffc83a'}
};
const FACTIONS={
  black:{name:'Black Carpenter Legion',short:'Black',unique:'jugg',perk:'Strength in numbers: ants train 20% faster and Fungus Gardens give 20 supply.',trainMult:.8,gardenSup:20},
  red:{name:'Red Fire Colony',short:'Red',unique:'inferno',perk:'Fire venom: melee bites set enemies burning, and Acid Towers hit 25% harder.',burn:true,towerMult:1.25},
  gold:{name:'Gold Crazy Swarm',short:'Gold',unique:'gale',perk:'Frenzy: ants move 15% faster and workers carry 25% more.',spdMult:1.15,carryMult:1.25}
};

// ---------- units ----------
const UNIT={
  worker:{name:'Worker',hp:40,spd:64,dmg:4,range:4,cd:1,cost:50,time:5,r:7,sight:150,sup:1,desc:'Gathers food and honeydew. Builds and repairs structures.'},
  scout:{name:'Alate Scout',hp:45,spd:125,dmg:5,range:5,cd:.8,cost:75,time:7,r:8,sight:300,sup:1,fly:true,req:'chamber',abil:'mark',desc:'Fast winged flyer with wide vision.'},
  soldier:{name:'Soldier',hp:130,spd:56,dmg:12,range:5,cd:.9,cost:100,time:8,r:10,sight:170,sup:2,abil:'rally',desc:'Tough melee fighter. Cannot hit flyers.'},
  spitter:{name:'Acid Spitter',hp:70,spd:50,dmg:14,range:120,cd:1.6,cost:100,hon:25,time:10,r:9,sight:200,sup:2,ranged:true,abil:'pool',desc:'Sprays acid from range. Can hit flyers.'},
  nurse:{name:'Nurse Ant',hp:60,spd:60,dmg:0,range:0,cd:1,cost:75,hon:25,time:9,r:8,sight:180,sup:1,noAtk:true,heal:11,healR:110,abil:'mend',desc:'Heals wounded ants nearby.'},
  lancer:{name:'Sky Lancer',hp:95,spd:95,dmg:9,range:140,cd:1,cost:100,hon:50,time:11,r:9,sight:230,sup:2,fly:true,ranged:true,aa:2.5,req:'pit',desc:'Winged hunter. Deals 2.5x damage to flyers.'},
  bomb:{name:'Bombardier',hp:90,spd:42,dmg:32,range:240,cd:3.4,cost:150,hon:75,time:14,r:11,sight:210,sup:3,ranged:true,groundOnly:true,splash:48,bld:2.2,desc:'Long-range acid artillery with splash. Ground targets only.'},
  jugg:{name:'Juggernaut',hp:420,spd:40,dmg:26,range:6,cd:1.3,cost:200,hon:100,time:16,r:14,sight:170,sup:4,bld:1.6,abil:'charge',desc:'Black colony giant. Smashes structures.'},
  inferno:{name:'Inferno Ant',hp:240,spd:48,dmg:7,range:55,cd:.35,cost:175,hon:75,time:15,r:12,sight:170,sup:3,ranged:true,groundOnly:true,flame:true,splash:28,bld:1.3,abil:'blaze',desc:'Red colony flamethrower. Burns groups at short range.'},
  gale:{name:'Gale Drone',hp:160,spd:78,dmg:16,range:110,cd:1.3,cost:175,hon:75,time:15,r:12,sight:220,sup:3,fly:true,ranged:true,groundOnly:true,splash:32,abil:'pool',desc:'Gold colony winged bomber. Drops acid on ground troops.'},
  princess:{name:'Warrior Princess',hp:600,spd:64,dmg:22,range:6,cd:.9,cost:300,hon:150,time:30,r:13,sight:230,sup:4,hero:true,req:'pit',abil:'lunge',abil2:'swarm',desc:'Hero. Levels up in battle and inspires nearby ants.'},
  swarmling:{name:'Swarmling',hp:30,spd:110,dmg:7,range:4,cd:.6,cost:0,time:0,r:6,sight:150,sup:0,temp:true,desc:'Short-lived summoned attacker.'},
  spider:{name:'Wolf Spider',hp:380,spd:72,dmg:20,range:8,cd:1.1,r:16,sight:150,sup:0,creep:true,bounty:[150,40],desc:'Neutral hunter. Guards its territory.'},
  beetle:{name:'Stag Beetle',hp:700,spd:36,dmg:30,range:8,cd:1.6,r:19,sight:130,sup:0,creep:true,bounty:[200,80],desc:'Armored neutral brute.'},
  mantis:{name:'Praying Mantis',hp:1100,spd:55,dmg:45,range:20,cd:1.4,r:24,sight:180,sup:0,creep:true,bounty:[350,150],desc:'Deadly neutral ambusher. Guards rich food.'}
};
const BLD={
  nest:{name:"Queen's Nest",hp:1600,r:46,sight:240,sup:20,drop:true,trail:210,trains:['worker','scout','princess'],desc:'Trains workers, scouts and the Princess. Workers drop off here.'},
  outpost:{name:'Outpost Nest',hp:700,r:30,sight:200,cost:300,time:30,sup:10,drop:true,trail:160,trains:['worker'],desc:'Satellite nest near distant food. Workers drop off here. +10 supply.'},
  garden:{name:'Fungus Garden',hp:400,r:24,sight:150,cost:100,time:14,sup:15,farm:.4,desc:'Adds supply and slowly grows food.'},
  chamber:{name:'War Chamber',hp:700,r:30,sight:180,cost:150,time:18,trains:['soldier','spitter','nurse','lancer'],desc:'Trains Soldiers, Spitters, Nurses and Sky Lancers.'},
  tower:{name:'Acid Tower',hp:550,r:20,sight:230,cost:125,time:16,req:'chamber',atk:{dmg:12,range:175,cd:1.4},desc:'Spits acid at enemy ants, including flyers.'},
  pit:{name:'Evolution Pit',hp:600,r:28,sight:170,cost:200,time:22,req:'chamber',research:['carapace','mandibles','acid','legs','forage'],desc:'Researches permanent upgrades.'},
  vault:{name:'Brood Vault',hp:800,r:32,sight:180,cost:200,hon:50,time:24,req:'pit',trains:['bomb','UNIQUE'],desc:"Trains Bombardiers and your colony's giant."},
  spire:{name:'Swarm Spire',hp:1000,r:30,sight:180,cost:400,hon:200,time:40,req:'vault',charge:240,desc:'Superweapon. Charges for 4 minutes, then unleashes a swarm anywhere you can see.'}
};
const BUILDABLE=['garden','chamber','tower','pit','vault','outpost','spire'];
const UPG={
  carapace:{name:'Hardened Carapace',cost:150,hon:50,time:30,desc:'+25% fighter health'},
  mandibles:{name:'Serrated Mandibles',cost:150,hon:50,time:30,desc:'+25% melee damage'},
  acid:{name:'Potent Acid',cost:175,hon:75,time:35,desc:'+25% ranged damage, +20% range'},
  legs:{name:'Swift Legs',cost:125,hon:25,time:25,desc:'+15% movement speed'},
  forage:{name:'Efficient Foraging',cost:100,time:20,desc:'+50% food and honeydew per trip'}
};
const ABIL={
  rally:{name:'Rally Cry',key:'D',cd:30,desc:'Nearby Soldiers get +40% speed and +30% damage for 6 seconds.'},
  pool:{name:'Acid Pool',key:'D',cd:20,target:'ground',range:220,desc:'Lob a pool of acid that burns ground enemies for 6 seconds.'},
  charge:{name:'Burrow Charge',key:'D',cd:25,target:'ground',range:260,desc:'Tunnel to a spot, then burst out to smash and knock back enemies.'},
  mark:{name:'Pheromone Mark',key:'D',cd:40,target:'ground',range:500,desc:'Reveal an area for 20 seconds.'},
  mend:{name:'Healing Burst',key:'D',cd:30,desc:'Heal all nearby ants for 60 health.'},
  blaze:{name:'Blaze',key:'D',cd:25,desc:'Double attack speed for 6 seconds.'},
  lunge:{name:'Stinger Lunge',key:'D',cd:12,target:'enemy',range:200,desc:'Leap at an enemy for heavy damage and stun it for 1.5 seconds.'},
  swarm:{name:'Summon Swarm',key:'F',cd:60,lvl:3,desc:'Summon 5 Swarmlings for 30 seconds. Unlocks at level 3.'}
};
const VET=[100,300,700],VET_NAME=['','Veteran','Elite','Heroic'];
const HERO_LVL=[0,120,300,600,1000];

// ---------- AI ----------
const DIFF={
  easy:{name:'Easy',mult:.7,workers:7,wave:8,waveInc:2,chambers:[120],grace:330,pitT:480,vaultT:1e9,spireT:1e9,towers:[],abil:.3},
  normal:{name:'Normal',mult:1,workers:10,wave:6,waveInc:3,chambers:[45,330],grace:190,pitT:280,vaultT:460,spireT:900,towers:[230],abil:.7},
  hard:{name:'Hard',mult:1.35,workers:13,wave:7,waveInc:3,chambers:[25,150,320],grace:120,pitT:170,vaultT:300,spireT:560,towers:[130,280],abil:1}
};
const PERS={
  balanced:{name:'Balanced',workers:1,wave:1,grace:1,towers:0,outpostT:520,spire:1},
  rusher:{name:'Rusher',workers:.7,wave:.6,grace:.45,towers:-1,outpostT:1e9,spire:1.3,earlyChamber:true},
  turtle:{name:'Turtle',workers:1,wave:1.5,grace:1.7,towers:2,outpostT:1e9,spire:.8},
  expander:{name:'Expander',workers:1.5,wave:1.3,grace:1.3,towers:0,outpostT:240,spire:1}
};
const STATE_TXT={idle:'Idle',gather:'Gathering',ret:'Carrying home',move:'Moving',amove:'Attack-moving',attack:'Fighting',build:'Heading to build',repair:'Repairing',hold:'Holding position',cast:'Moving to cast'};
