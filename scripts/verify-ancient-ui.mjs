import {fileURLToPath} from 'node:url';
const {JSDOM}=await import(process.env.HISTORY_JSDOM_MODULE||'jsdom');
import {readFile,writeFile,unlink} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('..',import.meta.url)).replace(/\/$/,'');
const dom=new JSDOM(await readFile(root+'/dist/index.html','utf8'),{url:'http://localhost'}),w=dom.window;
for(const name of ['window','document','localStorage','navigator'])Object.defineProperty(globalThis,name,{value:name==='window'?w:w[name],configurable:true});
globalThis.Image=class{set src(v){this._src=v}get src(){return this._src}get complete(){return true}get naturalWidth(){return 256}get naturalHeight(){return 256}addEventListener(){}};
w.HTMLCanvasElement.prototype.toDataURL=()=>'';
globalThis.Audio=w.Audio;w.HTMLMediaElement.prototype.play=()=>Promise.resolve();w.HTMLMediaElement.prototype.pause=()=>{};
w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({measureText:()=>({width:20}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
let clock=0,id=0;const frames=new Map(),epoch=Date.now();Date.now=()=>epoch+clock;
Object.defineProperty(globalThis,'performance',{value:{now:()=>clock},configurable:true});
Object.assign(globalThis,{innerWidth:1024,innerHeight:768,devicePixelRatio:1,addEventListener:w.addEventListener.bind(w),getComputedStyle:w.getComputedStyle.bind(w),requestAnimationFrame:cb=>{frames.set(++id,cb);return id;},cancelAnimationFrame:id=>frames.delete(id)});
const {fresh,validate,activeQuest,abilities}=await import(root+'/dist/state.js?v=48');
const {REGIONS,MAPS}=await import(root+'/dist/regions/index.js?v=48');
const {ANCIENT_COUNTRIES,ANCIENT_QA,ANCIENT_QUESTS}=await import(root+'/dist/regions/ancient.js?v=48');
const original=fresh('고대 UI 원본','boy');Object.assign(original,{introSeen:true,basicTutorialDone:true,audioMuted:true,coins:317,personalCode:null});original.completedRegions=REGIONS.slice(0,5).map(r=>r.id);original.unlockedRegions=REGIONS.map(r=>r.id);original.inventory.food=7;original.inventory.fishingrod=1;original.horseUnlocked=true;original.inventory.gear.push('bronzeCharm');
localStorage.setItem('history-explorer-save-v1',JSON.stringify(original));
let source=await readFile(root+'/dist/game.js','utf8');source=source.replace(/from (["'])(\.\/[^"']+)\1/g,(_,q,p)=>'from '+q+new URL(p,'file://'+root+'/dist/').href+q);
source+='\nexport const qa={state:()=>s,start,screen:()=>screen,menu:adminPanel,field:()=>{close();hud();},blocked,travel,currentMap,targetEntity,tick,login:()=>{adminOriginal=structuredClone(saved);adminMode=true;start(structuredClone(saved));adminPanel();},exit:adminExit};';
const path=root+'/scripts/.ancient-ui-test-'+process.pid+'.mjs';await writeFile(path,source);const {qa}=await import(path);
const click=selector=>{const el=document.querySelector(selector);assert.ok(el,selector+' '+document.querySelector('#overlay')?.textContent);assert.equal(el.disabled,false,selector+' disabled');el.click();};
function finishDialogue(){let count=0;while(document.querySelector('#next-dialogue')){assert.ok(count++<10);click('#next-dialogue');}}
function approach(e){const st=qa.state();const spots=[[e.x-1.2,e.y],[e.x+1.2,e.y],[e.x,e.y+1.2],[e.x,e.y-1.2]];const p=spots.find(([x,y])=>!qa.blocked(x,y));assert.ok(p,'safe interaction spot '+e.id);st.x=p[0];st.y=p[1];qa.field();clock+=40;qa.tick(clock);click('#interact');}
function reachable(m){const st=qa.state(),queue=[[Math.round(st.x*2)/2,Math.round(st.y*2)/2]],seen=new Set();while(queue.length){const [x,y]=queue.shift(),key=x+','+y;if(seen.has(key)||qa.blocked(x,y))continue;seen.add(key);for(const [dx,dy]of [[.5,0],[-.5,0],[0,.5],[0,-.5]]){const nx=x+dx,ny=y+dy;if(nx>=1&&nx<=m.w-2&&ny>=1&&ny<=m.h-2)queue.push([nx,ny]);}}return e=>[...seen].some(k=>{const [x,y]=k.split(',').map(Number);return Math.hypot(x-e.x,y-e.y)<1.5;});}
const outputs=[];
for(const [country,c]of Object.entries(ANCIENT_COUNTRIES)){
 qa.start(validate(structuredClone(original)));qa.travel('ancient-origins');finishDialogue();assert.equal(qa.state().progress.ancient,1,'opening dialogue');
 for(let index=1;index<21;index++){
  const st=qa.state(),q=activeQuest(st);assert.equal(q.id,ANCIENT_QUESTS[index].id);if(st.map!==q.map)qa.travel(q.map);const m=qa.currentMap(),e=m.entities.find(e=>e.id===q.target);assert.ok(reachable(m)(e),'reachable from entry '+e.id);assert.equal(qa.blocked(st.x,st.y),false);
  const coins=st.coins;
  if(index===10){for(const id of ['ancient-y-branch','ancient-y-cord']){approach(m.entities.find(e=>e.id===id));click('#ancient-gather');}}
  else if(index===20){click('#map-btn');assert.ok(document.querySelector('.ancient-history-map'));assert.ok(document.querySelector('.panel').textContent.includes('4세기'));}
  else {approach(e);
   if(document.querySelector('#ancient-observe'))click('#ancient-observe');
   else if(index===13)click('#ancient-deliver-records');
   else if(index===14||index===15){assert.equal(document.querySelector('.quiz-options').previousElementSibling.textContent.includes('왕을 특별'),false);click('[data-answer="0"]');assert.equal(st.progress.ancient,index);assert.equal(st.coins,coins);assert.ok(!document.querySelector('.panel').textContent.includes('정답'));click('#ancient-quiz-retry');click('[data-answer="1"]');}
   else if(index===16){click('[data-country="'+country+'"]');click('#country-back');assert.equal(st.ancient.country,null);click('[data-country="'+country+'"]');const stats=abilities(st);click('#country-confirm');assert.equal(st.ancient.country,country);assert.equal(st.map,c.village);assert.deepEqual(abilities(st),stats);}
   else if(index===18)click('#ancient-enter-home');
   else if(index===19)click('#ancient-begin4');
   else finishDialogue();
  }
  assert.equal(st.progress.ancient,index+1,'UI progress '+q.id);assert.equal(validate(JSON.parse(localStorage.getItem('history-explorer-save-v1'))).progress.ancient,index+1);
 }
 const st=qa.state();assert.equal(st.map,c.home);assert.equal(st.mounted,false);assert.equal(activeQuest(st),null);assert.equal(st.ancient.country,country);assert.equal(st.ancient.century,4);
 approach(qa.currentMap().entities.find(e=>e.type==='ancientStorage'));document.querySelector('#ancient-count').value='5';click('[data-store="food"]');assert.equal(st.inventory.food,2);assert.equal(st.ancient.home.storage.food,5);click('[data-take="food"]');assert.equal(st.inventory.food,3);assert.equal(st.ancient.home.storage.food,4);
 approach(qa.currentMap().entities.find(e=>e.type==='ancientDisplay'));assert.ok(document.querySelector('.panel').textContent.includes('비어 있다'));
 qa.travel(c.village);assert.equal(qa.blocked(st.x,st.y),false);qa.travel('ancient-han');assert.equal(qa.blocked(st.x,st.y),false);assert.ok(reachable(qa.currentMap())(qa.currentMap().entities.find(e=>e.id==='ancient-fishing')));qa.travel(c.village);assert.equal(qa.blocked(st.x,st.y),false);
 qa.field();clock+=40;qa.tick(clock);
 st.mounted=true;approach(qa.currentMap().entities.find(e=>e.type==='horseStable'));click('#ancient-horse-action');assert.equal(st.horseParked,true);assert.equal(st.mounted,false);assert.equal(document.querySelector('#mount-btn').hidden,true);
 let parked=qa.currentMap().entities.filter(e=>e.type==='parkedHorse');assert.equal(parked.length,1);assert.equal(reachable(qa.currentMap())(parked[0]),true);assert.equal(validate(JSON.parse(localStorage.getItem('history-explorer-save-v1'))).horseParked,true);
 qa.start(validate(JSON.parse(localStorage.getItem('history-explorer-save-v1'))));let resumed=qa.state();assert.equal(qa.currentMap().entities.filter(e=>e.type==='parkedHorse').length,1);assert.equal(resumed.mounted,false);
 approach(qa.currentMap().entities.find(e=>e.type==='parkedHorse'));click('#ancient-horse-action');for(let i=0;i<50;i++)await Promise.resolve();assert.equal(resumed.horseParked,false);assert.equal(resumed.mounted,true);assert.equal(qa.currentMap().entities.filter(e=>e.type==='parkedHorse').length,0);assert.equal(validate(JSON.parse(localStorage.getItem('history-explorer-save-v1'))).mounted,true);
 qa.travel(c.home);assert.equal(resumed.mounted,false);assert.equal(resumed.horseParked,true);qa.travel(c.village);assert.equal(qa.currentMap().entities.filter(e=>e.type==='parkedHorse').length,1);
 outputs.push(country+': all 21 normal UI steps, wrong→retry→right twice, confirm/back/locked country, home/storage/exhibit/map, park→save/reload→retrieve→mounted save→indoor parking, bank access.');
}
// Start a new isolated admin session from the last real player save.
const originalText=localStorage.getItem('history-explorer-save-v1');const before=JSON.parse(originalText);qa.login();
function ancientMenu(){qa.menu();click('[data-admin-menu="interaction"]');click('[data-qa-interact="ancient"]');}
for(const fixture of ANCIENT_QA){ancientMenu();click('[data-ancient-stage="'+fixture.id+'"]');assert.equal(qa.state().progress.ancient,fixture.index);assert.equal(qa.blocked(qa.state().x,qa.state().y),false);assert.equal(qa.targetEntity()?.id,activeQuest(qa.state())?.target);}
for(const country of Object.keys(ANCIENT_COUNTRIES)){ancientMenu();click('[data-ancient-country="'+country+'"]');assert.equal(qa.state().ancient.country,country);for(const n of [4,5,6]){ancientMenu();click('[data-ancient-map="'+n+'"]');assert.ok(document.querySelector('.ancient-history-map').getAttribute('aria-label').includes(n+'세기'));ancientMenu();click('[data-ancient-han="'+n+'"]');assert.equal(qa.state().map,'ancient-han');assert.equal(qa.state().ancient.century,n);clock+=40;qa.tick(clock);assert.equal(qa.currentMap().entities.find(e=>e.centuryState==='sign').banner,{4:'baekje',5:'goguryeo',6:'silla'}[n]);}}
for(const country of Object.keys(ANCIENT_COUNTRIES)){ancientMenu();click('[data-ancient-home="'+country+'"]');assert.equal(qa.state().ancient.country,country);assert.equal(qa.state().ancient.home.owned,true);assert.equal(qa.state().map,ANCIENT_COUNTRIES[country].village);}
for(const mode of ['none','owned','mounted','parked']){ancientMenu();click('[data-ancient-horse="'+mode+'"]');assert.equal(qa.state().horseUnlocked,mode!=='none');assert.equal(qa.state().horseParked,mode==='parked');assert.equal(qa.state().mounted,mode==='mounted');assert.equal(qa.blocked(qa.state().x,qa.state().y),false);}
ancientMenu();click('#ancient-qa-style');assert.equal(document.querySelectorAll('.ancient-actor-comparison figure').length,9);
// Every new quest can be prepared directly via the existing quest menu.
for(let index=0;index<ANCIENT_QUESTS.length;index++){qa.menu();click('[data-admin-menu="quest"]');const era=document.querySelector('#qa-era');era.value='ancient';era.dispatchEvent(new w.Event('change'));const select=document.querySelector('#qa-quest');select.value=String(index);select.dispatchEvent(new w.Event('change'));click('[data-qa-stage="current"]');assert.equal(qa.state().progress.ancient,index);assert.ok(!qa.blocked(qa.state().x,qa.state().y));}
for(const r of REGIONS){qa.travel(r.village);qa.field();clock+=40;qa.tick(clock);}
// Exercise the actual movement loop on the existing horse map and the new village.
for(const map of ['nation-buyeo-village','ancient-village-silla']){
 qa.travel(map);qa.field();const st=qa.state();let start;
 for(let y=4;y<13&&!start;y++)for(let x=4;x<18;x++)if([0,.5,1,1.5,2,2.5,3].every(dx=>!qa.blocked(x+dx,y))){start=[x,y];break;}
 assert.ok(start);const distances=[];
 for(const mounted of [false,true]){[st.x,st.y]=start;st.horseParked=false;st.mounted=mounted;w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight'}));for(let n=0;n<10;n++){clock+=40;qa.tick(clock);}w.dispatchEvent(new w.KeyboardEvent('keyup',{key:'ArrowRight'}));distances.push(st.x-start[0]);}
 assert.ok(distances[0]>1.3);assert.ok(Math.abs(distances[1]/distances[0]-1.6)<.01,'horse speed preserved '+map);click('#mount-btn');assert.equal(st.mounted,false);
}
qa.state().hp=abilities(qa.state()).hp-2;qa.menu();click('[data-admin-menu="interaction"]');click('[data-qa-interact="combat"]');const enemy=qa.currentMap().entities.find(e=>e.id==='buyeo-wolf');qa.state().x=enemy.x-.4;qa.state().y=enemy.y;qa.field();for(let n=0;n<85;n++){clock+=40;qa.tick(clock);}click('#interact');assert.equal(qa.screen(),'battle');const hp=qa.state().hp,food=qa.state().inventory.food;click('[data-fight="food"]');click('[data-food="food"]');assert.equal(qa.state().inventory.food,food-1);assert.equal(qa.state().hp,hp+2);await new Promise(resolve=>setTimeout(resolve,1250));const coins=qa.state().coins;click('[data-fight="run"]');assert.equal(qa.screen(),'');assert.equal(qa.state().coins,coins);assert.ok(qa.state().monsters['buyeo-wolf']);
console.log('Regression: actual frame loop on old/new maps; horse speed ×1.6 and dismount; battle entry/food consumption/enemy turn/escape keeps enemy and gives no coins.');
assert.equal(localStorage.getItem('history-explorer-save-v1'),originalText);qa.exit();const restored=structuredClone(qa.state());delete restored.updatedAt;delete before.updatedAt;assert.deepEqual(restored,before);const stored=JSON.parse(localStorage.getItem('history-explorer-save-v1'));delete stored.updatedAt;assert.deepEqual(stored,before);
console.log(outputs.join('\n'));console.log('Admin: 15 stage fixtures including all four founders; 22 individually selected quests; 3 countries × 3 maps/Han overlays; student save untouched throughout QA; original content restored (normal save timestamp excepted).');
await unlink(path);dom.window.close();process.exit(0);
