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
const {fresh,validate,activeQuest,abilities}=await import(root+'/dist/state.js?v=56');
const {REGIONS,MAPS}=await import(root+'/dist/regions/index.js?v=56');
const {ANCIENT_COUNTRIES,ANCIENT_QA,ANCIENT_QUESTS}=await import(root+'/dist/regions/ancient.js?v=56');
const original=fresh('고대 UI 원본','boy');Object.assign(original,{introSeen:true,basicTutorialDone:true,audioMuted:true,coins:317,personalCode:null});original.completedRegions=REGIONS.slice(0,5).map(r=>r.id);original.unlockedRegions=REGIONS.map(r=>r.id);original.inventory.food=7;original.inventory.fishingrod=1;original.horseUnlocked=true;original.inventory.gear.push('bronzeCharm');
localStorage.setItem('history-explorer-save-v1',JSON.stringify(original));
const intervals=new Map();let intervalId=0;globalThis.setInterval=(fn,ms)=>{intervals.set(++intervalId,{fn,ms});return intervalId;};globalThis.clearInterval=n=>intervals.delete(n);
let source=await readFile(root+'/dist/game.js','utf8');source=source.replace(/from (["'])(\.\/[^"']+)\1/g,(_,q,p)=>'from '+q+new URL(p,'file://'+root+'/dist/').href+q);
source+='\nexport const qa={state:()=>s,start,screen:()=>screen,menu:adminPanel,field:()=>{close();hud();},blocked,travel,currentMap,targetEntity,tick,life:homesteadUI,decor:()=>decorUI,selling,shop,nearby,keys,voyage:voyageUI,story:baekjeStoryUI,war:warUI,ancientUI,normal:()=>{adminMode=false;},resumeAdmin:()=>{adminMode=true;saved=structuredClone(adminOriginal);},login:()=>{adminOriginal=structuredClone(saved);adminMode=true;start(structuredClone(saved));adminPanel();},exit:adminExit};';
const path=root+'/scripts/.voyage-ui-test-'+process.pid+'.mjs';await writeFile(path,source);const {qa}=await import(path);
const click=selector=>{const el=document.querySelector(selector);assert.ok(el,selector+' '+document.querySelector('#overlay')?.textContent);assert.equal(el.disabled,false,selector+' disabled');el.click();};
function finishDialogue(){let count=0;while(document.querySelector('#next-dialogue')){assert.ok(count++<10);click('#next-dialogue');}}
function approach(e){const st=qa.state();const spots=[...(e.shopKind&&e.type==='house'?[[e.x,e.y+1]]:[]),[e.x-1.2,e.y],[e.x+1.2,e.y],[e.x,e.y+1.2],[e.x,e.y-1.2]];const p=spots.find(([x,y])=>!qa.blocked(x,y));assert.ok(p,'safe interaction spot '+e.id);st.x=p[0];st.y=p[1];qa.field();clock+=40;qa.tick(clock);click('#interact');}

const {prepareAncientQA}=await import(root+'/dist/ancient-state.js?v=56');
const {HOME_LEVELS,CROPS,plotState,freshLife}=await import(root+'/dist/homestead.js?v=56');
const {salePrice}=await import(root+'/dist/economy.js?v=56');
const {ITEMS}=await import(root+'/dist/state.js?v=56');
const initial=localStorage.getItem('history-explorer-save-v1');qa.login();
const pulse=()=>{for(const entry of intervals.values())if(entry.ms===500)entry.fn();};
const {atBoard,atTrader,marketMap,forestMap,BOARD,TRADER}=await import(root+'/dist/life-access.js?v=56');
const {woodId,shopMap,LIFE_SHOPS}=await import(root+'/dist/life-shops.js?v=56');
const {sellItem}=await import(root+'/dist/economy.js?v=56');
const {LIFE_ORDERS,ensureOrders}=await import(root+'/dist/life-progression.js?v=56');
const {plantCrop,harvestCrop}=await import(root+'/dist/homestead.js?v=56');
const near=e=>{qa.field();const st=qa.state();for(const [dx,dy]of [[0,1],[1,0],[-1,0],[0,-1]]){st.x=e.x+dx;st.y=e.y+dy;if(!qa.blocked(st.x,st.y)&&qa.nearby()?.id===e.id){clock+=40;qa.tick(clock);click('#interact');return;}}throw Error('cannot interact '+e.id);};
const entity=id=>qa.currentMap().entities.find(e=>e.id===id);


const {VOYAGE_STAGES,obstaclePosition}=await import(root+'/dist/voyage.js?v=56');
const {roomLayout}=await import(root+'/dist/homestead.js?v=56');
const frame=(ms=1000/60)=>{clock+=ms;qa.tick(clock);};
const cut=()=>{for(let i=0;i<240;i++)frame();};
function input(direction,down){window.dispatchEvent(new w.KeyboardEvent(down?'keydown':'keyup',{key:direction>0?'ArrowRight':'ArrowLeft',bubbles:true,cancelable:true}));}
function steer(rt,st){const times=[...new Set(rt.rows.map(o=>o.at))],time=times.find(t=>-150+(rt.elapsed-t)*VOYAGE_STAGES[rt.stage].speed<674);if(time===undefined)return 0;const occupied=rt.rows.filter(o=>o.at===time).map(o=>o.x),target=[205,500,795].find(x=>!occupied.includes(x));return Math.abs(rt.x-target)<4?0:Math.sign(target-rt.x);}
for(const [width,height]of [[1363,936],[1024,768],[768,1024]])for(const country of ['baekje','goguryeo','silla']){
 globalThis.innerWidth=width;globalThis.innerHeight=height;prepareAncientQA(qa.state(),'voyage-start',{country});const st=qa.state();st.coins=100;st.xp=0;st.ancient.home.reputation=0;qa.travel('ancient-han');near(entity('voyage-envoy'));assert.ok(document.querySelector('#overlay').textContent.includes('372년'));click('#voyage-prep');const staleBoard=document.querySelector('#voyage-board').onclick;click('#voyage-board');assert.equal(qa.voyage.runtime().scene,'boarding');cut();assert.equal(qa.voyage.runtime().status,'sailing');staleBoard();assert.equal(qa.voyage.runtime().status,'sailing');
 click('#voyage-pause');const elapsed=qa.voyage.runtime().elapsed;for(let i=0;i<100;i++)frame();assert.equal(qa.voyage.runtime().elapsed,elapsed);click('#voyage-action');
 for(let stage=0;stage<3;stage++){let axis=0;for(let i=0;i<2000&&qa.voyage.runtime()?.status==='sailing';i++){const next=steer(qa.voyage.runtime(),st);if(next!==axis){if(axis)input(axis,false);if(next)input(next,true);axis=next;}frame();}if(axis)input(axis,false);assert.equal(st.ancient.voyage.hull,3);assert.equal(st.ancient.voyage.stage,stage+1);if(stage<2)click('#voyage-action');}
 assert.equal(qa.voyage.runtime().scene,'arrival');cut();const oldFinish=document.querySelector('#voyage-finish').onclick;click('#voyage-finish');assert.equal(st.progress.ancient,27);oldFinish();assert.equal(st.coins,140);assert.ok(document.querySelector('[data-voyage-record]'));
 for(const id of ['river','south','competition','diplomacy'])click('[data-voyage-record="'+id+'"]');click('#voyage-to-quiz');click('[data-final-answer="0"]');assert.equal(st.ancient.voyage.quiz,0);assert.ok(document.querySelector('#final-feedback').textContent.includes('물길'));click('[data-final-answer="1"]');assert.equal(st.ancient.voyage.quiz,1);click('#final-review');assert.ok(document.querySelector('[data-voyage-record]'));click('#voyage-to-quiz');const staleAnswer=document.querySelector('[data-final-answer="0"]').onclick;click('[data-final-answer="0"]');staleAnswer();assert.equal(st.ancient.voyage.quiz,2);assert.ok(document.querySelector('.ending-king').src.includes('geunchogo'));
 st.ancient.home.exhibits=['origin-goguryeo','origin-baekje','origin-silla'];click('#final-ending-next');click('#final-ending-next');const staleEnding=document.querySelector('#final-ending-next').onclick;click('#final-ending-next');staleEnding();assert.equal(st.progress.ancient,28);assert.equal(st.coins,185);assert.equal(st.xp,24);assert.equal(st.ancient.home.reputation,8);assert.equal(st.ancient.century,4);assert.ok(st.ancient.completedChapters.includes('4c'));assert.equal(st.ancient.home.exhibits.length,3);assert.ok(st.ancient.home.ownedExhibits.includes('han-trade-plaque'));
 qa.travel('ancient-home-'+country);near(entity('ancient-display'));document.querySelector('#exhibit-slot').value='1';click('[data-exhibit-equip="han-trade-plaque"]');assert.equal(st.ancient.home.exhibits[1],'han-trade-plaque');assert.ok(st.ancient.home.ownedExhibits.includes('origin-baekje'));qa.field();assert.ok(entity('exhibit-view-1').art==='voyagePlaque');validate(JSON.parse(JSON.stringify(st)));
}
// Input press/release between rendered frames still moves for its actual held duration.
qa.ancientUI.prepare('voyage-stage1');qa.travel('ancient-han');near(entity('voyage-envoy'));const tap=qa.voyage.runtime(),startX=tap.x;input(-1,true);clock+=400;input(-1,false);frame(1000);assert.ok(Math.abs(tap.x-(startX-144))<.01);assert.ok(Math.abs(tap.elapsed-1.4)<.01);
// Real pointer handlers, cancellation, collision, retry and a callback from an old student state.
qa.ancientUI.prepare('voyage-stage2');qa.travel('ancient-han');near(entity('voyage-envoy'));const rt=qa.voyage.runtime(),st=qa.state(),left=document.querySelector('#voyage-left');const event=new w.Event('pointerdown',{cancelable:true});left.dispatchEvent(event);frame(100);assert.ok(rt.x<500);left.dispatchEvent(new w.Event('pointercancel'));const stopped=rt.x;frame(100);assert.equal(rt.x,stopped);
rt.rows=[{id:'hit',at:0,x:rt.x,kind:'reef',rx:64,ry:42}];rt.elapsed=675/165;frame(10);assert.equal(st.ancient.voyage.hull,2);assert.ok(rt.invulnerable>1);qa.ancientUI.prepare('voyage-failed');qa.travel('ancient-han');near(entity('voyage-envoy'));assert.equal(qa.voyage.runtime().status,'failed');click('#voyage-action');assert.equal(st.ancient.voyage.hull,3);assert.equal(qa.voyage.runtime().stage,1);
qa.ancientUI.prepare('finale-ending');qa.travel('ancient-han');near(entity('voyage-envoy'));const old=document.querySelector('#final-ending-next').onclick;qa.ancientUI.prepare('voyage-start');old();assert.equal(st.ancient.voyage.ending,false);assert.equal(st.progress.ancient,26);
assert.equal(localStorage.getItem('history-explorer-save-v1'),initial);qa.exit();assert.equal(qa.state().coins,317);
console.log('v56 DOM PASS: all 3 countries × 3 viewport variables, boarding/departure, 80s real game ticks/keyboard, pause, pointer hold/cancel, collision and stage retry, arrival, quiz wrong/review/correct, original king, one-time 85/+8/24, full slots/display, stale panels and admin-original isolation. Canvas/time mocked; viewport layout and physical touch require browser review.');
await unlink(path);dom.window.close();process.exit(0);
