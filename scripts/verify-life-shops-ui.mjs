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
const {fresh,validate,activeQuest,abilities}=await import(root+'/dist/state.js?v=52-reviewed');
const {REGIONS,MAPS}=await import(root+'/dist/regions/index.js?v=52-reviewed');
const {ANCIENT_COUNTRIES,ANCIENT_QA,ANCIENT_QUESTS}=await import(root+'/dist/regions/ancient.js?v=52-reviewed');
const original=fresh('고대 UI 원본','boy');Object.assign(original,{introSeen:true,basicTutorialDone:true,audioMuted:true,coins:317,personalCode:null});original.completedRegions=REGIONS.slice(0,5).map(r=>r.id);original.unlockedRegions=REGIONS.map(r=>r.id);original.inventory.food=7;original.inventory.fishingrod=1;original.horseUnlocked=true;original.inventory.gear.push('bronzeCharm');
localStorage.setItem('history-explorer-save-v1',JSON.stringify(original));
const intervals=new Map();let intervalId=0;globalThis.setInterval=(fn,ms)=>{intervals.set(++intervalId,{fn,ms});return intervalId;};globalThis.clearInterval=n=>intervals.delete(n);
let source=await readFile(root+'/dist/game.js','utf8');source=source.replace(/from (["'])(\.\/[^"']+)\1/g,(_,q,p)=>'from '+q+new URL(p,'file://'+root+'/dist/').href+q);
source+='\nexport const qa={state:()=>s,start,screen:()=>screen,menu:adminPanel,field:()=>{close();hud();},blocked,travel,currentMap,targetEntity,tick,life:homesteadUI,normal:()=>{adminMode=false;},resumeAdmin:()=>{adminMode=true;saved=structuredClone(adminOriginal);},login:()=>{adminOriginal=structuredClone(saved);adminMode=true;start(structuredClone(saved));adminPanel();},exit:adminExit};';
const path=root+'/scripts/.ancient-ui-test-verify-life-shops-ui-'+process.pid+'.mjs';await writeFile(path,source);const {qa}=await import(path);
const click=selector=>{const el=document.querySelector(selector);assert.ok(el,selector+' '+document.querySelector('#overlay')?.textContent);assert.equal(el.disabled,false,selector+' disabled');el.click();};
function finishDialogue(){let count=0;while(document.querySelector('#next-dialogue')){assert.ok(count++<10);click('#next-dialogue');}}
function approach(e){const st=qa.state();const spots=[...(e.shopKind&&e.type==='house'?[[e.x,e.y+1]]:[]),[e.x-1.2,e.y],[e.x+1.2,e.y],[e.x,e.y+1.2],[e.x,e.y-1.2]];const p=spots.find(([x,y])=>!qa.blocked(x,y));assert.ok(p,'safe interaction spot '+e.id);st.x=p[0];st.y=p[1];qa.field();clock+=40;qa.tick(clock);click('#interact');}

const {prepareAncientQA}=await import(root+'/dist/ancient-state.js?v=52-reviewed');
const {HOME_LEVELS,CROPS,plotState,freshLife}=await import(root+'/dist/homestead.js?v=52-reviewed');
const {salePrice}=await import(root+'/dist/economy.js?v=52-reviewed');
const {ITEMS}=await import(root+'/dist/state.js?v=52-reviewed');
const initial=localStorage.getItem('history-explorer-save-v1');qa.login();
const pulse=()=>{for(const entry of intervals.values())if(entry.ms===500)entry.fn();};
const lifeTimers=()=>[...intervals.values()].filter(v=>v.ms===500).length;
const open=()=>{qa.field();click('#menu-btn');click('#life-home-menu');};
const tab=name=>click('[data-life-tab="'+name+'"]');
const {LIFE_ORDERS,TRANSPORTS,LIFE_TOOLS,ensureOrders}=await import(root+'/dist/life-progression.js?v=52-reviewed');

const {LIFE_SHOPS,shopMap,WOOD_SPOTS,woodId}=await import(root+'/dist/life-shops.js?v=52-reviewed');
function enterStore(kind){qa.field();qa.travel('ancient-village-'+qa.state().ancient.country);const door=qa.currentMap().entities.find(e=>e.shopKind===kind&&e.type==='house');approach(door);click('#enter-house');assert.equal(qa.state().map,shopMap(qa.state().ancient.country,kind));const merchant=qa.currentMap().entities.find(e=>e.type==='lifeMerchant');approach(merchant);assert.ok(document.querySelector('#life-store-body'));}
for(const [width,height]of [[1363,936],[1024,768],[768,1024]])for(const country of Object.keys(ANCIENT_COUNTRIES)){
 globalThis.innerWidth=width;globalThis.innerHeight=height;prepareAncientQA(qa.state(),'4c',{country});let st=qa.state();const h=st.ancient.home;Object.assign(h,freshLife());h.owned=true;h.seeds.millet=2;h.reputation=45;h.harvested.millet=4;h.commerce.completed=10;st.coins=5000;st.inventory.lumber=30;st.inventory.hide=10;st.inventory.millet=0;st.artifacts.push('fire');
 qa.travel('ancient-home-'+country);qa.life.open('market');assert.equal(document.querySelectorAll('[data-life-tool],[data-life-buy-seed],#life-buy-lumber').length,0);qa.life.open('decor');assert.equal(document.querySelectorAll('[data-life-buy-decor]').length,0);qa.life.open('growth');assert.equal(document.querySelector('#life-upgrade'),null);qa.life.cart();assert.equal(document.querySelector('#life-ask-cart').disabled,true);assert.equal(st.map,'ancient-home-'+country);
 enterStore('seed');const before=st.coins,seed=h.seeds.millet;click('[data-store-seed="millet"][data-count="5"]');click('[data-store-seed="millet"][data-count="10"]');assert.equal(h.seeds.millet,seed+15);assert.equal(st.coins,before-30);assert.equal(document.querySelector('[data-store-seed="ricecrop"]').disabled,true);
 const stale=document.querySelector('[data-store-seed="millet"][data-count="1"]'),money=st.coins;qa.travel('ancient-home-'+country);stale.click();assert.equal(st.coins,money,'stale callback after leaving store');qa.life.open('farm');click('[data-life-plot="field-1"]');click('[data-life-plant="millet"]');const planted=h.plots[0].plantedAt;
 qa.travel('ancient-village-'+country);const pile=qa.currentMap().entities.find(e=>e.id===woodId(country,1));approach(pile);const lumber=st.inventory.lumber;click('#life-gather-wood');assert.equal(st.inventory.lumber,lumber+1);approach(pile);assert.equal(document.querySelector('#life-gather-wood').disabled,true);const loaded=validate(JSON.parse(JSON.stringify(st)));assert.equal(loaded.resources[pile.id].nextAt,st.resources[pile.id].nextAt);clock+=180000;qa.field();approach(pile);click('#life-gather-wood');assert.equal(st.inventory.lumber,lumber+2);
 enterStore('wood');const woodCoins=st.coins,woodStock=st.inventory.lumber;click('[data-store-lumber="10"]');assert.equal(st.coins,woodCoins-80);assert.equal(st.inventory.lumber,woodStock+10);click('#store-upgrade');click('#store-upgrade-confirm');assert.equal(h.level,2);assert.equal(h.plots[0].plantedAt,planted);
 enterStore('tool');click('[data-life-tool="seedBag"]');assert.ok(h.commerce.tools.seedBag);assert.equal(document.querySelector('[data-life-tool="seedBag"]').disabled,true);click('[data-life-tool="sickle"]');click('[data-life-tool="hearth"]');assert.ok(h.commerce.tools.sickle&&h.commerce.tools.hearth);
 enterStore('wood');click('#store-upgrade');click('#store-upgrade-confirm');assert.equal(h.level,3);click('#store-paddy');assert.equal(h.paddies,1);click('#store-cart');click('#life-ask-cart');click('#life-build-cart');assert.ok(h.commerce.cart.owned);
 enterStore('decor');assert.equal(document.querySelectorAll('[data-store-decor]').length,18);click('[data-store-decor="woodShelf"]');click('[data-store-decor="fineBedding"]');qa.travel('ancient-home-'+country);qa.life.open('decor');click('[data-life-slot="room-2"]');click('[data-life-place="woodShelf"]');assert.equal(h.placements['room-2'],'woodShelf');click('[data-life-slot="room-2"]');click('#life-remove');assert.equal(h.placements['room-2'],undefined);assert.equal(h.decorations.woodShelf,1);
 qa.life.open('farm');click('#life-harvest-all');assert.equal(st.inventory.millet,4);assert.equal(h.plots[0].crop,null);h.seeds.millet=4;click('#life-batch');document.querySelectorAll('[data-life-batch]').forEach(b=>b.checked=true);click('#life-batch-plant');assert.equal(h.plots.filter(p=>p.crop==='millet').length,0,'batch insufficient seeds must not partially sow');
}
qa.life.shops.adminPanel();for(const c of Object.keys(ANCIENT_COUNTRIES)){click('[data-shop-qa-country="'+c+'"]');assert.equal(qa.state().ancient.country,c);assert.equal(qa.state().map,'ancient-village-'+c);qa.life.shops.adminPanel();}
for(const kind of Object.keys(LIFE_SHOPS)){click('[data-shop-qa-visit="'+kind+'"]');assert.equal(qa.state().map,shopMap(qa.state().ancient.country,kind));assert.ok(Math.hypot(qa.state().x-5,qa.state().y-3.6)<1.65);click('#interact');assert.ok(document.querySelector('#life-store-body'));qa.life.shops.adminPanel();}
for(const k of ['ready','poor','rep','owned','growth','cart','decor','wood','wait','reset']){click('[data-shop-qa-case="'+k+'"]');validate(structuredClone(qa.state()));qa.life.shops.adminPanel();}
assert.equal(localStorage.getItem('history-explorer-save-v1'),initial);qa.exit();assert.equal(qa.state().coins,317);assert.equal(qa.state().inventory.food,7);
console.log('Actual game DOM handlers: 3 countries × 3 viewport variables; four store doorways/interiors/merchant access; 1/5/10 UI buys and exact debit; no remote/stale purchase; sow/gather/regrow/buy/tool/upgrade/cart/decor-place-return loop; 12 admin store targets and all QA cases; student original restored. Clock/canvas mocked; physical tablet not tested.');
await unlink(path);dom.window.close();process.exit(0);
