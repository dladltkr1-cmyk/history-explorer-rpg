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
const {fresh,validate,activeQuest,abilities}=await import(root+'/dist/state.js?v=55');
const {REGIONS,MAPS}=await import(root+'/dist/regions/index.js?v=55');
const {ANCIENT_COUNTRIES,ANCIENT_QA,ANCIENT_QUESTS}=await import(root+'/dist/regions/ancient.js?v=55');
const original=fresh('고대 UI 원본','boy');Object.assign(original,{introSeen:true,basicTutorialDone:true,audioMuted:true,coins:317,personalCode:null});original.completedRegions=REGIONS.slice(0,5).map(r=>r.id);original.unlockedRegions=REGIONS.map(r=>r.id);original.inventory.food=7;original.inventory.fishingrod=1;original.horseUnlocked=true;original.inventory.gear.push('bronzeCharm');
localStorage.setItem('history-explorer-save-v1',JSON.stringify(original));
const intervals=new Map();let intervalId=0;globalThis.setInterval=(fn,ms)=>{intervals.set(++intervalId,{fn,ms});return intervalId;};globalThis.clearInterval=n=>intervals.delete(n);
let source=await readFile(root+'/dist/game.js','utf8');source=source.replace(/from (["'])(\.\/[^"']+)\1/g,(_,q,p)=>'from '+q+new URL(p,'file://'+root+'/dist/').href+q);
source+='\nexport const qa={state:()=>s,start,screen:()=>screen,menu:adminPanel,field:()=>{close();hud();},blocked,travel,currentMap,targetEntity,tick,life:homesteadUI,decor:()=>decorUI,selling,shop,nearby,keys,story:baekjeStoryUI,war:warUI,ancientUI,normal:()=>{adminMode=false;},resumeAdmin:()=>{adminMode=true;saved=structuredClone(adminOriginal);},login:()=>{adminOriginal=structuredClone(saved);adminMode=true;start(structuredClone(saved));adminPanel();},exit:adminExit};';
const path=root+'/scripts/.war-ui-test-'+process.pid+'.mjs';await writeFile(path,source);const {qa}=await import(path);
const click=selector=>{const el=document.querySelector(selector);assert.ok(el,selector+' '+document.querySelector('#overlay')?.textContent);assert.equal(el.disabled,false,selector+' disabled');el.click();};
function finishDialogue(){let count=0;while(document.querySelector('#next-dialogue')){assert.ok(count++<10);click('#next-dialogue');}}
function approach(e){const st=qa.state();const spots=[...(e.shopKind&&e.type==='house'?[[e.x,e.y+1]]:[]),[e.x-1.2,e.y],[e.x+1.2,e.y],[e.x,e.y+1.2],[e.x,e.y-1.2]];const p=spots.find(([x,y])=>!qa.blocked(x,y));assert.ok(p,'safe interaction spot '+e.id);st.x=p[0];st.y=p[1];qa.field();clock+=40;qa.tick(clock);click('#interact');}

const {prepareAncientQA}=await import(root+'/dist/ancient-state.js?v=55');
const {HOME_LEVELS,CROPS,plotState,freshLife}=await import(root+'/dist/homestead.js?v=55');
const {salePrice}=await import(root+'/dist/economy.js?v=55');
const {ITEMS}=await import(root+'/dist/state.js?v=55');
const initial=localStorage.getItem('history-explorer-save-v1');qa.login();
const pulse=()=>{for(const entry of intervals.values())if(entry.ms===500)entry.fn();};
const {atBoard,atTrader,marketMap,forestMap,BOARD,TRADER}=await import(root+'/dist/life-access.js?v=55');
const {woodId,shopMap,LIFE_SHOPS}=await import(root+'/dist/life-shops.js?v=55');
const {sellItem}=await import(root+'/dist/economy.js?v=55');
const {LIFE_ORDERS,ensureOrders}=await import(root+'/dist/life-progression.js?v=55');
const {plantCrop,harvestCrop}=await import(root+'/dist/homestead.js?v=55');
const near=e=>{qa.field();const st=qa.state();for(const [dx,dy]of [[0,1],[1,0],[-1,0],[0,-1]]){st.x=e.x+dx;st.y=e.y+dy;if(!qa.blocked(st.x,st.y)&&qa.nearby()?.id===e.id){clock+=40;qa.tick(clock);click('#interact');return;}}throw Error('cannot interact '+e.id);};
const entity=id=>qa.currentMap().entities.find(e=>e.id===id);


for(const [width,height]of [[1363,936],[1024,768],[768,1024]])for(const country of ['goguryeo','baekje','silla']){
 globalThis.innerWidth=width;globalThis.innerHeight=height;prepareAncientQA(qa.state(),'4c-done',{country});const st=qa.state();st.coins=100;st.xp=0;st.ancient.home.reputation=0;qa.travel('ancient-han');near(entity('war-messenger'));click('#war-go');assert.equal(st.map,'ancient-chiyang-trail');
 for(const [id,key]of [['war-fork','fork'],['war-fallen','fallen'],['war-watch','watch']]){near(entity(id));assert.ok(st.ancient.war.trail.clues.includes(key));qa.field();}
 st.x=20;st.y=26;clock+=40;qa.tick(clock);assert.equal(st.ancient.war.trail.failures,1);
 for(const [x,y]of [[5,26],[14,18],[23,9]]){st.x=x;st.y=y;clock+=40;qa.tick(clock);}
 near(entity('war-recipient'));const stale4=document.querySelector('#war-finish4').onclick;click('#war-finish4');assert.equal(st.coins,130);assert.equal(st.progress.ancient,25);stale4();assert.equal(st.coins,130);
 qa.field();near(entity('war-messenger'));assert.ok(document.querySelector('#overlay').textContent.includes('371년'));click('#war-go');assert.equal(st.map,'ancient-pyongyang-escape');assert.equal(qa.war.actors().followers.length,2);
 // Existing admin UI prepares real runtime positions and original storage stays isolated.
 qa.ancientUI.prepare('escort-ambush');qa.field();clock+=40;qa.tick(clock);assert.equal(document.querySelector('#war-ambush').disabled,false);click('#war-ambush');for(let i=0;i<20;i++){clock+=40;qa.tick(clock);}assert.equal(st.ancient.war.escape.down[0],true);assert.equal(qa.war.actors().guards[0].mode,'down');
 click('#war-follow');assert.equal(st.ancient.war.escape.waiting,true);click('#war-pause');click('#war-regroup');assert.equal(st.ancient.war.escape.waiting,true);
 qa.ancientUI.prepare('escort-zero');qa.field();clock+=40;qa.tick(clock);click('#interact');assert.equal(st.ancient.war.escape.escaped,false);
 qa.ancientUI.prepare('escort-one');qa.field();clock+=40;qa.tick(clock);click('#interact');assert.equal(qa.war.actors().escapeTime,0);
 qa.ancientUI.prepare('escort-both');qa.field();clock+=40;qa.tick(clock);click('#interact');for(let i=0;i<70;i++){clock+=40;qa.tick(clock);}assert.ok(document.querySelector('#war-finish5'));const stale=document.querySelector('#war-finish5').onclick;st.coins=130;st.ancient.home.reputation=3;click('#war-finish5');assert.equal(st.coins,165);assert.equal(st.progress.ancient,26);stale();assert.equal(st.coins,165);assert.equal(st.ancient.home.reputation,6);assert.equal(activeQuest(st),null);
 qa.field();validate(JSON.parse(JSON.stringify(st)));
}
assert.equal(localStorage.getItem('history-explorer-save-v1'),initial);qa.exit();assert.equal(qa.state().coins,317);
console.log('v55 DOM: 3 countries × 3 viewport variables; story entry/travel/clues/hazards/history/rewards, real admin presets, ambush/collapse/wait/regroup, 0-guard/1-person rejection and three-person exit, stale callbacks refused, original storage restored. Canvas/time mocked.');
await unlink(path);dom.window.close();process.exit(0);
