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
const {fresh,validate,activeQuest,abilities}=await import(root+'/dist/state.js?v=54.2');
const {REGIONS,MAPS}=await import(root+'/dist/regions/index.js?v=54.2');
const {ANCIENT_COUNTRIES,ANCIENT_QA,ANCIENT_QUESTS}=await import(root+'/dist/regions/ancient.js?v=54.2');
const original=fresh('고대 UI 원본','boy');Object.assign(original,{introSeen:true,basicTutorialDone:true,audioMuted:true,coins:317,personalCode:null});original.completedRegions=REGIONS.slice(0,5).map(r=>r.id);original.unlockedRegions=REGIONS.map(r=>r.id);original.inventory.food=7;original.inventory.fishingrod=1;original.horseUnlocked=true;original.inventory.gear.push('bronzeCharm');
localStorage.setItem('history-explorer-save-v1',JSON.stringify(original));
const intervals=new Map();let intervalId=0;globalThis.setInterval=(fn,ms)=>{intervals.set(++intervalId,{fn,ms});return intervalId;};globalThis.clearInterval=n=>intervals.delete(n);
let source=await readFile(root+'/dist/game.js','utf8');source=source.replace(/from (["'])(\.\/[^"']+)\1/g,(_,q,p)=>'from '+q+new URL(p,'file://'+root+'/dist/').href+q);
source+='\nexport const qa={state:()=>s,start,screen:()=>screen,menu:adminPanel,field:()=>{close();hud();},blocked,travel,currentMap,targetEntity,tick,life:homesteadUI,decor:()=>decorUI,selling,shop,nearby,keys,story:baekjeStoryUI,ancientUI,normal:()=>{adminMode=false;},resumeAdmin:()=>{adminMode=true;saved=structuredClone(adminOriginal);},login:()=>{adminOriginal=structuredClone(saved);adminMode=true;start(structuredClone(saved));adminPanel();},exit:adminExit};';
const path=root+'/scripts/.baekje-ui-test-'+process.pid+'.mjs';await writeFile(path,source);const {qa}=await import(path);
const click=selector=>{const el=document.querySelector(selector);assert.ok(el,selector+' '+document.querySelector('#overlay')?.textContent);assert.equal(el.disabled,false,selector+' disabled');el.click();};
function finishDialogue(){let count=0;while(document.querySelector('#next-dialogue')){assert.ok(count++<10);click('#next-dialogue');}}
function approach(e){const st=qa.state();const spots=[...(e.shopKind&&e.type==='house'?[[e.x,e.y+1]]:[]),[e.x-1.2,e.y],[e.x+1.2,e.y],[e.x,e.y+1.2],[e.x,e.y-1.2]];const p=spots.find(([x,y])=>!qa.blocked(x,y));assert.ok(p,'safe interaction spot '+e.id);st.x=p[0];st.y=p[1];qa.field();clock+=40;qa.tick(clock);click('#interact');}

const {prepareAncientQA}=await import(root+'/dist/ancient-state.js?v=54.2');
const {HOME_LEVELS,CROPS,plotState,freshLife}=await import(root+'/dist/homestead.js?v=54.2');
const {salePrice}=await import(root+'/dist/economy.js?v=54.2');
const {ITEMS}=await import(root+'/dist/state.js?v=54.2');
const initial=localStorage.getItem('history-explorer-save-v1');qa.login();
const pulse=()=>{for(const entry of intervals.values())if(entry.ms===500)entry.fn();};
const {atBoard,atTrader,marketMap,forestMap,BOARD,TRADER}=await import(root+'/dist/life-access.js?v=54.2');
const {woodId,shopMap,LIFE_SHOPS}=await import(root+'/dist/life-shops.js?v=54.2');
const {sellItem}=await import(root+'/dist/economy.js?v=54.2');
const {LIFE_ORDERS,ensureOrders}=await import(root+'/dist/life-progression.js?v=54.2');
const {plantCrop,harvestCrop}=await import(root+'/dist/homestead.js?v=54.2');
const near=e=>{qa.field();const st=qa.state();for(const [dx,dy]of [[0,1],[1,0],[-1,0],[0,-1]]){st.x=e.x+dx;st.y=e.y+dy;if(!qa.blocked(st.x,st.y)&&qa.nearby()?.id===e.id){clock+=40;qa.tick(clock);click('#interact');return;}}throw Error('cannot interact '+e.id);};
const entity=id=>qa.currentMap().entities.find(e=>e.id===id);

for(const [width,height]of [[1363,936],[1024,768],[768,1024]])for(const country of ['goguryeo','baekje','silla']){
 globalThis.innerWidth=width;globalThis.innerHeight=height;prepareAncientQA(qa.state(),'4c-trade',{country});const st=qa.state();st.coins=100;st.ancient.home.reputation=0;qa.travel('ancient-village-'+country);near(entity('story-sender'));click('#story-take');assert.equal(activeQuest(st).target,'story-keeper');near(entity('ancient-han-door-'+country));click('#han-journey-go');assert.equal(st.map,'ancient-han');near(entity('story-keeper'));click('#story-deliver');
 for(const k of ['river','boat','grain'])click('[data-story-observe="'+k+'"]');click('#story-finish1');assert.equal(st.progress.ancient,22);assert.equal(document.querySelector('[data-cargo-side]').getAttribute('aria-label'),'왼쪽에 놓기');
 for(let round=0;round<3;round++){
  const sides=round===0?['left','right']:round===1?['left','right','right']:['left','right','right','left'];
  click('[data-cargo-pick="0"]');click('[data-cargo-side="left"]');click('[data-cargo-pick="1"]');click('[data-cargo-side="left"]');assert.ok(document.querySelector('#cargo-depart').disabled);click('#cargo-hint-button');assert.ok(document.querySelector('#cargo-hint').textContent.length>10);
  for(let i=0;i<sides.length;i++){click('[data-cargo-pick="'+i+'"]');click('[data-cargo-side="'+sides[i]+'"]');}
  const snapshot=validate(JSON.parse(JSON.stringify(st)));assert.deepEqual(snapshot.ancient.baekje4c.placements,st.ancient.baekje4c.placements);qa.field();near(entity('story-keeper'));assert.ok(!document.querySelector('#cargo-depart').disabled);click('#cargo-depart');assert.ok(document.querySelector('.leaving-boat'));click('#cargo-next');
 }
 assert.equal(st.progress.ancient,23);near(entity('story-south'));
 for(let ex=0;ex<3;ex++){
  click('[data-story-merchant="0"]');click('[data-story-merchant="2"]');click('#exchange-confirm');assert.equal(st.ancient.baekje4c.exchanges,ex);assert.ok(document.querySelector('#exchange-hint').textContent.includes('아니야'));
  click('[data-story-merchant="0"]');click('[data-story-merchant="1"]');click('#exchange-confirm');assert.ok(document.querySelector('.exchange-out'));click('#exchange-next');
 }
 click('[data-story-route="land"]');assert.equal(st.ancient.baekje4c.routes,0);click('[data-story-route="water"]');assert.ok(document.querySelector('.travel-water'));click('#route-next');click('[data-story-route="water"]');assert.equal(st.ancient.baekje4c.routes,1);click('[data-story-route="land"]');assert.ok(document.querySelector('.travel-land'));click('#route-next');assert.ok(document.querySelector('.court-king'));const stale=document.querySelector('#story-finish3').onclick;click('#story-finish3');assert.equal(st.coins,175);assert.equal(st.ancient.home.reputation,6);stale();assert.equal(st.coins,175);qa.field();validate(JSON.parse(JSON.stringify(st)));assert.equal(st.progress.ancient,24);assert.equal(activeQuest(st),null);
 // New callback execution also rechecks physical location.
 prepareAncientQA(st,'4c-deliver',{country});qa.travel('ancient-han');near(entity('story-keeper'));const old=document.querySelector('#story-deliver').onclick;st.map='ancient-home-'+country;old();assert.equal(st.ancient.baekje4c.delivered,false);
}
assert.equal(localStorage.getItem('history-explorer-save-v1'),initial);qa.exit();assert.equal(qa.state().nickname,original.nickname);assert.equal(qa.state().coins,317);
console.log('v54 DOM: 3 countries × 3 viewport settings; village/official Han travel/parcel/observations/3 cargo rounds and corrections/resume/3 swaps/wrong routes/animated boats and goods/court/wait; stale callbacks refused; admin original restored. Layout/canvas and clock are mocked.');
await unlink(path);dom.window.close();process.exit(0);
