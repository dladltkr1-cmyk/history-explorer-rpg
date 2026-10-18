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
const {fresh,validate,activeQuest,abilities}=await import(root+'/dist/state.js?v=53');
const {REGIONS,MAPS}=await import(root+'/dist/regions/index.js?v=53');
const {ANCIENT_COUNTRIES,ANCIENT_QA,ANCIENT_QUESTS}=await import(root+'/dist/regions/ancient.js?v=53');
const original=fresh('고대 UI 원본','boy');Object.assign(original,{introSeen:true,basicTutorialDone:true,audioMuted:true,coins:317,personalCode:null});original.completedRegions=REGIONS.slice(0,5).map(r=>r.id);original.unlockedRegions=REGIONS.map(r=>r.id);original.inventory.food=7;original.inventory.fishingrod=1;original.horseUnlocked=true;original.inventory.gear.push('bronzeCharm');
localStorage.setItem('history-explorer-save-v1',JSON.stringify(original));
const intervals=new Map();let intervalId=0;globalThis.setInterval=(fn,ms)=>{intervals.set(++intervalId,{fn,ms});return intervalId;};globalThis.clearInterval=n=>intervals.delete(n);
let source=await readFile(root+'/dist/game.js','utf8');source=source.replace(/from (["'])(\.\/[^"']+)\1/g,(_,q,p)=>'from '+q+new URL(p,'file://'+root+'/dist/').href+q);
source+='\nexport const qa={state:()=>s,start,screen:()=>screen,menu:adminPanel,field:()=>{close();hud();},blocked,travel,currentMap,targetEntity,tick,life:homesteadUI,decor:()=>decorUI,selling,shop,nearby,keys,normal:()=>{adminMode=false;},resumeAdmin:()=>{adminMode=true;saved=structuredClone(adminOriginal);},login:()=>{adminOriginal=structuredClone(saved);adminMode=true;start(structuredClone(saved));adminPanel();},exit:adminExit};';
const path=root+'/scripts/.spaces-ui-test-'+process.pid+'.mjs';await writeFile(path,source);const {qa}=await import(path);
const click=selector=>{const el=document.querySelector(selector);assert.ok(el,selector+' '+document.querySelector('#overlay')?.textContent);assert.equal(el.disabled,false,selector+' disabled');el.click();};
function finishDialogue(){let count=0;while(document.querySelector('#next-dialogue')){assert.ok(count++<10);click('#next-dialogue');}}
function approach(e){const st=qa.state();const spots=[...(e.shopKind&&e.type==='house'?[[e.x,e.y+1]]:[]),[e.x-1.2,e.y],[e.x+1.2,e.y],[e.x,e.y+1.2],[e.x,e.y-1.2]];const p=spots.find(([x,y])=>!qa.blocked(x,y));assert.ok(p,'safe interaction spot '+e.id);st.x=p[0];st.y=p[1];qa.field();clock+=40;qa.tick(clock);click('#interact');}

const {prepareAncientQA}=await import(root+'/dist/ancient-state.js?v=53');
const {HOME_LEVELS,CROPS,plotState,freshLife}=await import(root+'/dist/homestead.js?v=53');
const {salePrice}=await import(root+'/dist/economy.js?v=53');
const {ITEMS}=await import(root+'/dist/state.js?v=53');
const initial=localStorage.getItem('history-explorer-save-v1');qa.login();
const pulse=()=>{for(const entry of intervals.values())if(entry.ms===500)entry.fn();};
const {atBoard,atTrader,marketMap,forestMap,BOARD,TRADER}=await import(root+'/dist/life-access.js?v=53');
const {woodId,shopMap,LIFE_SHOPS}=await import(root+'/dist/life-shops.js?v=53');
const {sellItem}=await import(root+'/dist/economy.js?v=53');
const {LIFE_ORDERS,ensureOrders}=await import(root+'/dist/life-progression.js?v=53');
const {plantCrop,harvestCrop}=await import(root+'/dist/homestead.js?v=53');
const near=e=>{qa.field();const st=qa.state();for(const [dx,dy]of [[0,1],[1,0],[-1,0],[0,-1]]){st.x=e.x+dx;st.y=e.y+dy;if(!qa.blocked(st.x,st.y)&&qa.nearby()?.id===e.id){clock+=40;qa.tick(clock);click('#interact');return;}}throw Error('cannot interact '+e.id);};
const entity=id=>qa.currentMap().entities.find(e=>e.id===id);
for(const [width,height]of [[1363,936],[1024,768],[768,1024]])for(const country of Object.keys(ANCIENT_COUNTRIES)){
 globalThis.innerWidth=width;globalThis.innerHeight=height;prepareAncientQA(qa.state(),{index:21},{country});const st=qa.state(),h=st.ancient.home;Object.assign(h,{level:2,fields:4,paddies:0,reputation:30});h.placements={};h.lamps={};st.coins=1000;st.inventory.lumber=30;st.inventory.millet=0;h.seeds.millet=4;h.commerce.cart.owned=false;
 qa.travel('ancient-yard-'+country);near(entity('life-yard-board'));assert.equal(document.querySelectorAll('[data-life-tab]').length,2);click('[data-life-plot="field-1"]');click('[data-life-plant="millet"]');const planted=h.plots[0].plantedAt;
 qa.field();near(entity('life-yard-exit'));assert.equal(st.map,'ancient-village-'+country);near(entity('life-forest-road'));assert.equal(st.map,forestMap(country));near(entity(woodId(country,1)));const before=st.inventory.lumber;const staleGather=document.querySelector('#life-gather-wood').onclick;click('#life-gather-wood');assert.equal(st.inventory.lumber,before+1);near(entity(woodId(country,1)));assert.equal(document.querySelector('#life-gather-wood').disabled,true);qa.field();near(entity('life-forest-return'));assert.equal(st.map,'ancient-village-'+country);staleGather();assert.equal(st.inventory.lumber,before+1);
 near(entity('life-request-board'));assert.ok(atBoard(st));assert.equal(document.querySelector('#life-cart-menu'),null,'no cart promotion for non-owner');const focus=document.querySelector('[data-order-focus]').onclick;const deliver=document.querySelector('[data-order-deliver]').onclick;qa.field();st.x=3;st.y=3;const money=st.coins;focus();deliver();assert.equal(st.coins,money);assert.equal(document.querySelector('[data-order-deliver]'),null,'stale board cannot reopen');
 // Growing time advances in the model; player must return to their yard to harvest.
 clock+=180001;qa.travel('ancient-yard-'+country);near(entity('life-yard-board'));click('[data-life-plot="field-1"]');assert.equal(st.inventory.millet,4);assert.equal(h.plots[0].crop,null);assert.ok(Date.now()-planted>=180000);
 qa.field();near(entity('life-yard-exit'));near(entity('life-market-road'));assert.equal(st.map,marketMap(country));near(entity('ancient-shop-'+country));click('[data-category="sell"]');const staleSale=document.querySelector('[data-sell="millet"]').onclick;click('[data-sell="millet"][data-count="4"]');assert.equal(st.inventory.millet,0);assert.equal(st.coins,money+12);st.inventory.millet=4;qa.field();st.x=14;st.y=16;const cash=st.coins;staleSale();assert.equal(st.inventory.millet,4);assert.equal(st.coins,cash);
 for(const kind of ['seed','tool','wood','decor']){qa.field();near(qa.currentMap().entities.find(e=>e.shopKind===kind));click('#enter-house');assert.equal(st.map,shopMap(country,kind));const e=qa.currentMap().entities.find(e=>e.type==='lifeMerchant');near(e);assert.ok(document.querySelector('#life-store-body'));if(kind==='decor')click('[data-store-decor="clayLamp"]');qa.field();near(entity('life-shop-exit'));assert.equal(st.map,marketMap(country));const d=LIFE_SHOPS[kind];assert.ok(Math.hypot(st.x-d.at[0],st.y-d.at[1])<1.7);}
 qa.field();near(entity('life-market-return'));assert.equal(st.map,'ancient-village-'+country);qa.travel('ancient-home-'+country);assert.equal(entity('life-board'),undefined);assert.ok(entity('ancient-chapters'));qa.field();click('#menu-btn');click('#life-home-menu');assert.ok(document.querySelector('#decor-mode'));assert.equal(document.querySelector('#decor-area'),null);click('[data-decor-pick="clayLamp"]');click('[data-decor-site="room-2"]');click('#decor-place');click('#decor-exit');assert.equal(h.placements['room-2'],'clayLamp');near(qa.currentMap().entities.find(e=>e.slot==='room-2'));click('#decor-use');assert.equal(h.lamps['room-2'],true);assert.equal(validate(structuredClone(st)).ancient.home.lamps['room-2'],true);
 qa.field();for(const page of ['farm','orders','market'])qa.life.open(page);assert.equal(document.querySelector('[data-life-plot]'),null);assert.equal(document.querySelector('[data-order-deliver]'),null);assert.equal(document.querySelector('[data-life-craft]'),null);qa.selling();assert.equal(document.querySelector('[data-sell]'),null);assert.equal(st.map,'ancient-home-'+country);
 qa.travel('ancient-village-'+country);qa.field();click('#menu-btn');assert.equal(document.querySelector('#life-home-menu'),null,'global home teleport removed');
}
// Administrator additions are registered and return to the original stored player.
qa.life.shops.adminPanel();for(const c of Object.keys(ANCIENT_COUNTRIES)){click('[data-shop-qa-country="'+c+'"]');assert.equal(qa.state().map,marketMap(c));qa.life.shops.adminPanel();for(const k of ['village','market','forest','board','trader','room','yard','workbench','away']){click('[data-space-qa="'+k+'"]');validate(structuredClone(qa.state()));qa.life.shops.adminPanel();}}
assert.equal(localStorage.getItem('history-explorer-save-v1'),initial);qa.exit();assert.equal(qa.state().nickname,original.nickname);assert.equal(qa.state().coins,317);
console.log('v53 DOM: 3 countries × 3 viewports; official field interactions and 4 shop round trips; sow/forest/board/harvest/sale/buy/decor/lamp loop; stale board/sale/wood callbacks and room/global remote actions refused; 27 QA location presets; isolated original restored. Clock/canvas mocked.');
await unlink(path);dom.window.close();process.exit(0);
