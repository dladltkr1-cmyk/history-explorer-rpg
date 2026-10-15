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
const {fresh,validate,activeQuest,abilities}=await import(root+'/dist/state.js?v=52');
const {REGIONS,MAPS}=await import(root+'/dist/regions/index.js?v=52');
const {ANCIENT_COUNTRIES,ANCIENT_QA,ANCIENT_QUESTS}=await import(root+'/dist/regions/ancient.js?v=52');
const original=fresh('고대 UI 원본','boy');Object.assign(original,{introSeen:true,basicTutorialDone:true,audioMuted:true,coins:317,personalCode:null});original.completedRegions=REGIONS.slice(0,5).map(r=>r.id);original.unlockedRegions=REGIONS.map(r=>r.id);original.inventory.food=7;original.inventory.fishingrod=1;original.horseUnlocked=true;original.inventory.gear.push('bronzeCharm');
localStorage.setItem('history-explorer-save-v1',JSON.stringify(original));
let source=await readFile(root+'/dist/game.js','utf8');source=source.replace(/from (["'])(\.\/[^"']+)\1/g,(_,q,p)=>'from '+q+new URL(p,'file://'+root+'/dist/').href+q);
source+='\nexport const qa={state:()=>s,start,screen:()=>screen,menu:adminPanel,field:()=>{close();hud();},blocked,travel,currentMap,targetEntity,tick,login:()=>{adminOriginal=structuredClone(saved);adminMode=true;start(structuredClone(saved));adminPanel();},exit:adminExit};';
const path=root+'/scripts/.ancient-ui-test-'+process.pid+'.mjs';await writeFile(path,source);const {qa}=await import(path);
const click=selector=>{const el=document.querySelector(selector);assert.ok(el,selector+' '+document.querySelector('#overlay')?.textContent);assert.equal(el.disabled,false,selector+' disabled');el.click();};
function finishDialogue(){let count=0;while(document.querySelector('#next-dialogue')){assert.ok(count++<10);click('#next-dialogue');}}
function approach(e){const st=qa.state();const spots=[[e.x-1.2,e.y],[e.x+1.2,e.y],[e.x,e.y+1.2],[e.x,e.y-1.2]];const p=spots.find(([x,y])=>!qa.blocked(x,y));assert.ok(p,'safe interaction spot '+e.id);st.x=p[0];st.y=p[1];qa.field();clock+=40;qa.tick(clock);click('#interact');}
function reachable(m){const st=qa.state(),queue=[[Math.round(st.x*2)/2,Math.round(st.y*2)/2]],seen=new Set();while(queue.length){const [x,y]=queue.shift(),key=x+','+y;if(seen.has(key)||qa.blocked(x,y))continue;seen.add(key);for(const [dx,dy]of [[.5,0],[-.5,0],[0,.5],[0,-.5]]){const nx=x+dx,ny=y+dy;if(nx>=1&&nx<=m.w-2&&ny>=1&&ny<=m.h-2)queue.push([nx,ny]);}}return e=>[...seen].some(k=>{const [x,y]=k.split(',').map(Number);return Math.hypot(x-e.x,y-e.y)<1.5;});}

const {VILLAGE_GEOGRAPHY,HAN_PHASES,hanPhase,previewHanHistory,completeHanHistoricalEvent,reputationDetails}=await import(root+'/dist/ancient-history.js?v=52');
const {prepareAncientQA,setAncientCentury}=await import(root+'/dist/ancient-state.js?v=52');
const {startTransport,deliverTransport,TRANSPORTS,ensureOrders,LIFE_ORDERS,orderReward}=await import(root+'/dist/life-progression.js?v=52');
const {plantCrop,harvestCrop}=await import(root+'/dist/homestead.js?v=52');
qa.start(validate(structuredClone(original)));qa.field();const baseline=localStorage.getItem('history-explorer-save-v1');assert.equal(document.querySelector('#reputation-hud').hidden,true);
qa.login();function ancientMenu(){qa.menu();click('[data-admin-menu="interaction"]');click('[data-qa-interact="ancient"]');}
for(const [country,c]of Object.entries(ANCIENT_COUNTRIES)){
 ancientMenu();click('[data-ancient-country="'+country+'"]');ancientMenu();click('[data-ancient-stage="4c"]');qa.state().progress.ancient=21;
 qa.travel(c.village);qa.field();assert.equal(document.querySelector('#reputation-hud').hidden,false);
 for(const n of [0,9,10,29,30,54,55,79,80,100]){ancientMenu();click('[data-reputation-qa="'+n+'"]');click('#profile-btn');const content=document.querySelector('.profile-reputation').textContent,d=reputationDetails(n);assert.ok(content.includes(n+' / 100'));assert.ok(content.includes(d.name));assert.ok(content.includes(d.next));if(n<100)assert.ok(content.includes(d.remaining+'점'));qa.field();}
 const home=JSON.stringify(qa.state().ancient.home),inventory=JSON.stringify(qa.state().inventory);
 for(const [phase,p]of Object.entries(HAN_PHASES)){
  ancientMenu();click('[data-han-phase="'+phase+'"]');const st=qa.state(),m=qa.currentMap();assert.equal(m.name,'한강 유역 · '+p.name);assert.equal(m.entities.find(e=>e.countryReturn).to,c.village);assert.equal(m.entities.find(e=>e.id==='ancient-han-guard').art,'han-guard-'+p.country);assert.equal(m.entities.find(e=>e.id==='ancient-han-standard').art,'han-standard-'+(p.secondary?'alliance':p.country));assert.equal(m.entities.find(e=>e.id==='ancient-han-resident').art,ANCIENT_COUNTRIES[p.country].helperArt);assert.equal(JSON.stringify(st.ancient.home),home);assert.equal(JSON.stringify(st.inventory),inventory);
  assert.equal(validate(JSON.parse(JSON.stringify(st))).ancient.history.phase,phase);assert.equal(previewHanHistory(st,'silla-post553'),false);assert.equal(completeHanHistoricalEvent(st,'han-553'),false);
  approach(m.entities.find(e=>e.id==='ancient-han-return'));assert.ok(document.querySelector('#han-journey-go'));click('#han-journey-go');assert.equal(st.map,c.village);assert.equal(qa.blocked(st.x,st.y),false);
  approach(qa.currentMap().entities.find(e=>e.id==='ancient-han-door-'+country));click('#han-journey-go');assert.equal(st.map,'ancient-han');assert.equal(qa.blocked(st.x,st.y),false);
 }
 for(const key of ['grain','workshop']){const st=qa.state();qa.travel(c.village);st.ancient.home.commerce.cart.owned=true;st.ancient.home.reputation=50;st.inventory.millet=40;st.inventory.barnyard=40;st.inventory.barley=40;st.inventory.hide=10;assert.ok(startTransport(st,key));approach(qa.currentMap().entities.find(e=>e.id==='ancient-han-door-'+country));click('#han-journey-go');const job=TRANSPORTS[key],recipient=qa.currentMap().entities.find(e=>e.id===job.target);st.x=recipient.x-1;st.y=recipient.y;const coins=st.coins;assert.ok(deliverTransport(st,job.target,st.ancient.home.commerce.cart.active.id));assert.ok(st.coins>coins);assert.equal(st.ancient.home.commerce.cart.active,null);approach(qa.currentMap().entities.find(e=>e.countryReturn));click('#han-journey-go');assert.equal(st.map,c.village);}
 const old=structuredClone(qa.state());delete old.ancient.history;old.ancient.century=6;assert.equal(validate(old).ancient.history.phase,'baekje-4');
 const st=qa.state(),phase=st.ancient.history.phase;for(const n of [4,5,6]){setAncientCentury(st,n,{admin:true});assert.equal(st.ancient.history.phase,phase);}
 qa.travel(REGIONS[0].village);qa.field();assert.equal(document.querySelector('#reputation-hud').hidden,true);assert.equal(st.ancient.home.reputation,54);
}
qa.exit();const beforeTrial=JSON.parse(baseline),afterTrial=JSON.parse(localStorage.getItem('history-explorer-save-v1'));delete beforeTrial.updatedAt;delete afterTrial.updatedAt;assert.deepEqual(afterTrial,beforeTrial);assert.equal(qa.state().coins,317);assert.equal(qa.state().inventory.food,7);
// Normal (non-admin) UI must honour cargo restrictions and preserve in-flight old saves.
for(const [country,c] of Object.entries(ANCIENT_COUNTRIES)) {
 for(const key of ['grain','workshop']) {
  const student=validate(structuredClone(original));prepareAncientQA(student,{index:21},{country});
  student.map=c.village;student.ancient.home.commerce.cart.owned=true;student.ancient.home.reputation=24;
  Object.assign(student.inventory,{millet:40,barnyard:40,barley:40,hide:10});qa.start(student);qa.field();const st=qa.state();
  approach(qa.currentMap().entities.find(e=>e.type==='lifeRequests'));click('#life-cart-menu');click('[data-life-transport="'+key+'"]');qa.field();
  assert.equal(st.mounted,false);assert.ok(st.ancient.home.commerce.cart.active);
  const old=structuredClone(st);delete old.ancient.history;assert.deepEqual(validate(old).ancient.home,st.ancient.home);
  click('#mount-btn');assert.equal(st.mounted,false);qa.travel('ancient-han',st.map,{fast:true});assert.equal(st.map,c.village);
  approach(qa.currentMap().entities.find(e=>e.id==='ancient-han-door-'+country));assert.ok(document.querySelector('.han-journey').textContent.indexOf(c.name)<document.querySelector('.han-journey').textContent.indexOf('한강'));
  const callback=document.querySelector('#han-journey-go').onclick;st.x=3;st.y=3;callback();assert.equal(st.map,c.village);
  approach(qa.currentMap().entities.find(e=>e.id==='ancient-han-door-'+country));click('#han-journey-go');assert.equal(st.map,'ancient-han');
  qa.travel(c.home);assert.equal(st.map,'ancient-han'); // disconnected shortcut cannot skip the return journey
  const restored=validate(JSON.parse(JSON.stringify(st)));assert.deepEqual(restored.ancient.home.commerce.cart.active,st.ancient.home.commerce.cart.active);
  const job=TRANSPORTS[key],recipient=qa.currentMap().entities.find(e=>e.id===job.target),inventory=structuredClone(st.inventory),coins=st.coins;
  approach(recipient);const deliver=document.querySelector('#life-transport-deliver').onclick;click('#life-transport-deliver');
  assert.equal(st.coins,coins+Math.round(job.value*1.30));assert.equal(st.ancient.home.reputation,24+job.rep);assert.equal(st.ancient.home.commerce.cart.active,null);
  for(const [id,n]of Object.entries(job.items))assert.equal(st.inventory[id],inventory[id]-n);
  assert.equal(document.querySelector('#reputation-hud b').textContent,String(24+job.rep));assert.equal(document.querySelector('#reputation-gain').textContent,'★ 평판 +'+job.rep);
  deliver();assert.equal(st.coins,coins+Math.round(job.value*1.30));
  approach(qa.currentMap().entities.find(e=>e.countryReturn));assert.ok(document.querySelector('.han-journey').textContent.indexOf('한강')<document.querySelector('.han-journey').textContent.indexOf(c.name));assert.ok(document.querySelector('#overlay').textContent.includes(VILLAGE_GEOGRAPHY[country].backRoute));click('#han-journey-go');assert.equal(st.map,c.village);
  ensureOrders(st);for(const n of [24,99,100]){st.ancient.home.reputation=n;qa.field();const o=st.ancient.home.commerce.orders[0],d=LIFE_ORDERS[o.key];Object.assign(st.inventory,d.items);
   approach(qa.currentMap().entities.find(e=>e.type==='lifeRequests'));const before=st.coins;click('[data-order-deliver="'+o.id+'"]');
   assert.equal(st.ancient.home.reputation,Math.min(100,n+d.rep));assert.equal(st.coins,before+orderReward(d));assert.equal(document.querySelector('#reputation-hud b').textContent,String(Math.min(100,n+d.rep)));qa.field();
  }
  for(const r of REGIONS.filter(r=>r.id!=='ancient')){qa.travel(r.village);qa.field();assert.equal(document.querySelector('#reputation-hud').hidden,true);assert.equal(st.ancient.home.reputation,100);}
 }
}
// Real normal state HUD gain, no admin snapshot notifications.
const student=validate(structuredClone(original));prepareAncientQA(student,{index:21},{country:'baekje'});student.map='ancient-yard-baekje';qa.start(student);qa.field();const st=qa.state();assert.ok(plantCrop(st,'field-1','millet',Date.now()-181000));assert.ok(harvestCrop(st,'field-1'));qa.field();assert.equal(document.querySelector('#reputation-hud b').textContent,'1');assert.equal(document.querySelector('#reputation-gain').textContent,'★ 평판 +1');
const stale=qa.currentMap();qa.travel('ancient-village-baekje');approach(qa.currentMap().entities.find(e=>e.id==='ancient-han-door-baekje'));const callback=document.querySelector('#han-journey-go').onclick;st.x=3;st.y=3;callback();assert.equal(st.map,'ancient-village-baekje');
await unlink(path);console.log('v51 DOM: 3 countries × 10 reputation boundaries × 6 political states; 36 guarded outward/return journeys, 6 cargo deliveries, all home/items retained, conservative old-save migration, 6 non-admin UI cargo deliveries with reload, exact debit/reward, blocked mount/fast/home shortcuts and duplicate delivery; request gain/cap and all earlier-era HUD hiding; real first-harvest HUD gain, stale route blocked, original admin save restored. Canvas/time mocked; no physical tablet claim.');
