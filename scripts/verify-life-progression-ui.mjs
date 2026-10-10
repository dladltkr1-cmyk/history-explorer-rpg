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
const {fresh,validate,activeQuest,abilities}=await import(root+'/dist/state.js?v=49');
const {REGIONS,MAPS}=await import(root+'/dist/regions/index.js?v=49');
const {ANCIENT_COUNTRIES,ANCIENT_QA,ANCIENT_QUESTS}=await import(root+'/dist/regions/ancient.js?v=49');
const original=fresh('고대 UI 원본','boy');Object.assign(original,{introSeen:true,basicTutorialDone:true,audioMuted:true,coins:317,personalCode:null});original.completedRegions=REGIONS.slice(0,5).map(r=>r.id);original.unlockedRegions=REGIONS.map(r=>r.id);original.inventory.food=7;original.inventory.fishingrod=1;original.horseUnlocked=true;original.inventory.gear.push('bronzeCharm');
localStorage.setItem('history-explorer-save-v1',JSON.stringify(original));
const intervals=new Map();let intervalId=0;globalThis.setInterval=(fn,ms)=>{intervals.set(++intervalId,{fn,ms});return intervalId;};globalThis.clearInterval=n=>intervals.delete(n);
let source=await readFile(root+'/dist/game.js','utf8');source=source.replace(/from (["'])(\.\/[^"']+)\1/g,(_,q,p)=>'from '+q+new URL(p,'file://'+root+'/dist/').href+q);
source+='\nexport const qa={state:()=>s,start,screen:()=>screen,menu:adminPanel,field:()=>{close();hud();},blocked,travel,currentMap,targetEntity,tick,life:homesteadUI,normal:()=>{adminMode=false;},resumeAdmin:()=>{adminMode=true;saved=structuredClone(adminOriginal);},login:()=>{adminOriginal=structuredClone(saved);adminMode=true;start(structuredClone(saved));adminPanel();},exit:adminExit};';
const path=root+'/scripts/.ancient-ui-test-life-'+process.pid+'.mjs';await writeFile(path,source);const {qa}=await import(path);
const click=selector=>{const el=document.querySelector(selector);assert.ok(el,selector+' '+document.querySelector('#overlay')?.textContent);assert.equal(el.disabled,false,selector+' disabled');el.click();};
function finishDialogue(){let count=0;while(document.querySelector('#next-dialogue')){assert.ok(count++<10);click('#next-dialogue');}}
function approach(e){const st=qa.state();const spots=[[e.x-1.2,e.y],[e.x+1.2,e.y],[e.x,e.y+1.2],[e.x,e.y-1.2]];const p=spots.find(([x,y])=>!qa.blocked(x,y));assert.ok(p,'safe interaction spot '+e.id);st.x=p[0];st.y=p[1];qa.field();clock+=40;qa.tick(clock);click('#interact');}

const {prepareAncientQA}=await import(root+'/dist/ancient-state.js?v=49');
const {HOME_LEVELS,CROPS,plotState,freshLife}=await import(root+'/dist/homestead.js?v=49');
const {salePrice}=await import(root+'/dist/economy.js?v=49');
const {ITEMS}=await import(root+'/dist/state.js?v=49');
const initial=localStorage.getItem('history-explorer-save-v1');qa.login();
const pulse=()=>{for(const entry of intervals.values())if(entry.ms===500)entry.fn();};
const lifeTimers=()=>[...intervals.values()].filter(v=>v.ms===500).length;
const open=()=>{qa.field();click('#menu-btn');click('#life-home-menu');};
const tab=name=>click('[data-life-tab="'+name+'"]');
const {LIFE_ORDERS,TRANSPORTS,LIFE_TOOLS,ensureOrders}=await import(root+'/dist/life-progression.js?v=49');
for(const [width,height]of [[1363,936],[1024,768],[768,1024]])for(const country of Object.keys(ANCIENT_COUNTRIES)){
 globalThis.innerWidth=width;globalThis.innerHeight=height;prepareAncientQA(qa.state(),'4c',{country});let st=qa.state();const h=st.ancient.home;Object.assign(h,freshLife());st.coins=0;st.inventory.lumber=2;st.inventory.fishingrod=0;st.artifacts.push('fire');h.harvested.millet=0;h.reputation=0;h.commerce.orders=[];h.commerce.completed=0;h.commerce.history=[];h.commerce.tools={seedBag:false,sickle:false,hearth:false};h.plots.forEach(p=>{p.crop=null;p.plantedAt=0});h.seeds.millet=2;
 qa.travel('ancient-home-'+country);qa.life.open('growth');assert.equal(document.querySelector('#life-upgrade').disabled,true);qa.life.open('farm');assert.equal(document.querySelector('#life-harvest-all').disabled,true);
 click('[data-life-plot="field-1"]');click('[data-life-plant="millet"]');clock+=180000;pulse();click('[data-life-plot="field-1"]');assert.equal(st.inventory.millet,4);qa.life.board();const c=h.commerce;assert.equal(document.querySelectorAll('[data-order-deliver]').length,3);click('#life-visit-board');const order=c.orders.find(o=>o.key==='millet');assert.ok(order);click('[data-order-focus="'+order.id+'"]');click('[data-order-focus="'+order.id+'"]');assert.equal(st.inventory.millet,4);click('[data-order-deliver="'+order.id+'"]');assert.equal(st.coins,15);assert.equal(st.inventory.millet,0);const after=st.coins;assert.equal(c.completed,1);assert.equal(c.history[0].id,order.id);
 // Wealth alone fails; actual conditional growth UI mirrors the resource and activity checks.
 st.coins=3000;st.inventory.lumber=40;qa.travel('ancient-home-'+country);qa.life.open('growth');assert.equal(document.querySelector('#life-upgrade').disabled,true);h.reputation=8;qa.life.open('growth');click('#life-upgrade');click('#life-upgrade-confirm');assert.equal(h.level,2);assert.equal(st.coins,2820);
 qa.life.open('market');click('[data-life-tool="seedBag"]');assert.equal(h.commerce.tools.seedBag,true);h.seeds.millet=10;qa.life.open('farm');click('#life-batch');document.querySelector('#life-batch-crop').value='millet';document.querySelector('#life-batch-crop').dispatchEvent(new w.Event('change'));document.querySelectorAll('[data-life-batch]').forEach(b=>b.checked=true);click('#life-batch-plant');assert.equal(h.plots.filter(p=>p.crop==='millet').length,4);assert.equal(h.seeds.millet,6);
 h.reputation=10;st.inventory.hide=2;qa.life.open('market');click('[data-life-tool="sickle"]');assert.equal(h.commerce.tools.sickle,true);clock+=180000;pulse();qa.life.open('farm');click('#life-harvest-all');assert.equal(st.inventory.millet,16);qa.life.open('market');click('[data-life-tool="hearth"]');const fire=qa.currentMap().entities.find(e=>e.id==='ancient-home-fire');assert.equal(fire.art,'life-hearth');st.inventory.fish=2;approach(fire);click('[data-life-cook="fish"][data-count="2"]');assert.equal(st.inventory.fish,0);assert.ok(st.inventory.cookedfish>=2);
 qa.life.open('decor');click('[data-life-buy-decor="fineBedding"]');click('[data-life-slot="room-1"]');click('[data-life-place="fineBedding"]');st.hp=1;approach(fire);click('#life-rest');assert.equal(st.hp,Math.ceil(abilities(st).hp*.4));
 h.reputation=22;c.completed=4;qa.life.open('growth');click('#life-upgrade');click('#life-upgrade-confirm');assert.equal(h.level,3);st.coins=2000;st.inventory.lumber=6;st.inventory.hide=2;qa.life.cart();click('#life-ask-cart');click('#life-build-cart');assert.equal(c.cart.owned,true);assert.equal(st.coins,1650);assert.equal(st.inventory.lumber,0);st.progress.ancient=20;Object.assign(st.inventory,TRANSPORTS.grain.items);qa.life.cart();click('[data-life-transport="grain"]');assert.equal(st.mounted,false);const active=structuredClone(c.cart.active),cargo=structuredClone(st.inventory);
 // Exercise genuine travel input restrictions outside the administrator override.
 qa.normal();qa.travel('ancient-han',st.map,{fast:true});assert.equal(st.map,'ancient-village-'+country);qa.travel('ancient-han');assert.equal(st.map,'ancient-han');qa.life.cart();assert.equal(st.map,'ancient-han','viewing transport must not teleport');click('#life-cancel-transport');assert.deepEqual(st.inventory,cargo);assert.equal(c.cart.active,null);qa.resumeAdmin();localStorage.setItem('history-explorer-save-v1',initial);qa.login();prepareAncientQA(qa.state(),'4c',{country});st=qa.state();st.ancient.home.commerce.cart.owned=true;st.progress.ancient=20;Object.assign(st.inventory,TRANSPORTS.grain.items);qa.travel('ancient-village-'+country);qa.life.cart();click('[data-life-transport="grain"]');qa.travel('ancient-han');const recipient=qa.currentMap().entities.find(e=>e.id==='life-han-delivery');approach(recipient);const money=st.coins;click('#life-transport-deliver');assert.equal(st.coins,money+88);assert.equal(st.ancient.home.commerce.cart.active,null);assert.equal(validate(structuredClone(st)).ancient.home.commerce.cart.active,null);
}
qa.life.adminPanel();for(const selector of ['[data-life2-rep="100"]','[data-life2-rep="0"]','[data-life2-qa="new"]','[data-life2-qa="legacy"]','[data-life2-qa="orders"]','[data-life2-qa="supplyOrders"]','[data-life2-qa="complete"]','[data-life2-qa="toolsOff"]','[data-life2-qa="toolsOn"]','[data-life2-qa="baseFire"]','[data-life2-qa="betterFire"]','[data-life2-qa="cartNone"]','[data-life2-qa="cartReady"]','[data-life2-qa="cartOwned"]','[data-life2-qa="transport"]','[data-life2-qa="arrival"]','[data-life2-qa="transportDone"]','[data-life2-qa="cancel"]','[data-life2-qa="restore"]']){click(selector);validate(structuredClone(qa.state()));}
assert.equal(localStorage.getItem('history-explorer-save-v1'),initial);qa.exit();assert.equal(qa.state().coins,317);assert.equal(qa.state().inventory.food,7);
console.log('Life2 real DOM handlers: three countries × three desktop/tablet viewport variables; zero-money first harvest/delivery; rich growth lock; batch sow/sickle harvest/improved hearth; bedding rest; cart commission/build/physical arrival/cancel; fast travel guard; no menu teleport; all shared QA controls; student original restored. Mock clock and canvas, not physical tablet/browser rendering.');
await unlink(path);dom.window.close();process.exit(0);
