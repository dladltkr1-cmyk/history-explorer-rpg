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
source+='\nexport const qa={state:()=>s,start,screen:()=>screen,menu:adminPanel,field:()=>{close();hud();},blocked,travel,currentMap,targetEntity,tick,life:homesteadUI,decor:()=>decorUI,nearby,close,login:()=>{adminOriginal=structuredClone(saved);adminMode=true;start(structuredClone(saved));adminPanel();},exit:adminExit};';
const path=root+'/scripts/.decor-ui-test-'+process.pid+'.mjs';await writeFile(path,source);const {qa}=await import(path);
const click=selector=>{const el=document.querySelector(selector);assert.ok(el,selector+' '+document.querySelector('#overlay')?.textContent);assert.equal(el.disabled,false,selector+' disabled');el.click();};
function finishDialogue(){let count=0;while(document.querySelector('#next-dialogue')){assert.ok(count++<10);click('#next-dialogue');}}
function approach(e){const st=qa.state();const spots=[[e.x-1.2,e.y],[e.x+1.2,e.y],[e.x,e.y+1.2],[e.x,e.y-1.2]];const p=spots.find(([x,y])=>!qa.blocked(x,y));assert.ok(p,'safe interaction spot '+e.id);st.x=p[0];st.y=p[1];qa.field();clock+=40;qa.tick(clock);click('#interact');}

const {prepareAncientQA}=await import(root+'/dist/ancient-state.js?v=53');
const {HOME_LEVELS,DECOR,DECOR_SLOTS,canPlaceDecor,placeDecor,decorPosition,upgradeHome,applyHomeRest}=await import(root+'/dist/homestead.js?v=53');
const {DECOR_VISUALS}=await import(root+'/dist/decor-spec.js?v=53');
qa.start(validate(structuredClone(original)));qa.field();const baseline=localStorage.getItem('history-explorer-save-v1');qa.login();
const step=()=>{clock+=40;qa.tick(clock);};
function openQA(){qa.decor().adminPanel();}
function approachExact(e){const st=qa.state(),pos=[[0,.55],[.6,0],[-.6,0],[0,-.6],[1,0],[-1,0],[0,1],[0,-1]].find(([x,y])=>{if(qa.blocked(e.x+x,e.y+y))return false;st.x=e.x+x;st.y=e.y+y;return qa.nearby()?.id===e.id;});assert.ok(pos,'approach '+e.id);st.x=e.x+pos[0];st.y=e.y+pos[1];qa.field();step();assert.equal(qa.nearby()?.id,e.id);click('#interact');}
for(const [width,height]of [[1363,936],[1024,768],[768,1024]]){
 globalThis.innerWidth=width;globalThis.innerHeight=height;
 for(const country of Object.keys(ANCIENT_COUNTRIES))for(const level of [1,2,3,4]){
  prepareAncientQA(qa.state(),'4c',{country});const st=qa.state(),h=st.ancient.home;h.level=level;h.fields=HOME_LEVELS[level].fields;h.paddies=0;h.placements={};h.lamps={};for(const id of Object.keys(DECOR))h.decorations[id]=2;qa.travel(ANCIENT_COUNTRIES[country].home);qa.field();
  for(const [id,d]of Object.entries(DECOR)){
   const slot=DECOR_SLOTS.slice(0,HOME_LEVELS[level].slots).find(v=>canPlaceDecor(st,v.id,id));if(!slot)continue;
   qa.travel('ancient-'+(slot.area==='room'?'home':'yard')+'-'+country);qa.decor().open();click('[data-decor-pick="'+id+'"]');click('[data-decor-site="'+slot.id+'"]');step();assert.ok(qa.decor().preview());const preview=qa.decor().preview();assert.equal(preview.w,DECOR_VISUALS[id].w);assert.equal(preview.h,DECOR_VISUALS[id].h);
   for(const button of document.querySelectorAll('[data-decor-site]')){assert.ok(parseFloat(button.style.left)>=24&&parseFloat(button.style.left)<=width-24);assert.ok(parseFloat(button.style.top)>78&&parseFloat(button.style.top)<height-(height<600?180:240)-30,'touch site above inventory');}
   const unchanged=JSON.stringify(h.placements);click('#decor-cancel-preview');assert.equal(JSON.stringify(h.placements),unchanged);click('[data-decor-pick="'+id+'"]');click('[data-decor-site="'+slot.id+'"]');click('#decor-place');assert.equal(h.placements[slot.id],id);assert.equal(h.decorations[id],2);assert.equal(validate(JSON.parse(JSON.stringify(st))).ancient.home.placements[slot.id],id,'every fresh visual placement must immediately reload');assert.equal(h.lamps[slot.id],undefined);click('#decor-exit');assert.equal(qa.screen(),'');
   const placed=qa.currentMap().entities.find(e=>e.slot===slot.id);assert.equal(placed.w,DECOR_VISUALS[id].w);assert.ok(placed.x>=1&&placed.x<qa.currentMap().w-1);if(placed.use){approachExact(placed);assert.ok(document.querySelector('.decor-use-head'));if(placed.use==='harvest')assert.equal(document.querySelectorAll('.decor-harvest>div').length,5);else if(placed.use==='lamp'){click('#decor-use');assert.equal(h.lamps[slot.id],true);approachExact(qa.currentMap().entities.find(e=>e.slot===slot.id));click('#decor-use');assert.equal(h.lamps[slot.id],false);}else{const coins=st.coins,inv=JSON.stringify(st.inventory),beforeHP=st.hp;st.hp=1;st.energy=1;click('#decor-use');assert.ok(qa.decor().pose);step();click('#decor-rise');assert.equal(qa.decor().pose,null);assert.equal(st.coins,coins);assert.equal(JSON.stringify(st.inventory),inv);if(placed.use==='rest'){assert.equal(st.hp,Math.ceil(abilities(st).hp*.4));assert.equal(st.energy,20);}else{assert.equal(st.hp,1);assert.equal(st.energy,1);}st.hp=beforeHP;}}
   qa.field();assert.equal(placeDecor(st,slot.id,null),true);assert.equal(h.decorations[id],2);assert.equal(h.lamps[slot.id],undefined);
  }
  // Mandatory base furniture stays reachable and has priority when standing nearby.
  qa.travel(ANCIENT_COUNTRIES[country].home);qa.field();for(const id of ['life-board','ancient-home-fire','ancient-storage','ancient-story-table']){const e=qa.currentMap().entities.find(e=>e.id===id);if(e)approachExact(e);qa.field();}
  assert.equal(validate(structuredClone(st)).ancient.home.level,level);
 }
}
// Upgrade and round-trip a legacy save with all existing systems and lamp state intact.
prepareAncientQA(qa.state(),'4c',{country:'baekje'});let st=qa.state(),h=st.ancient.home;h.level=1;h.fields=2;h.paddies=0;h.placements={};h.lamps={};for(const id of Object.keys(DECOR))h.decorations[id]=3;st.coins=6000;st.inventory.lumber=100;h.reputation=100;h.commerce.completed=20;h.harvested.millet=4;
qa.travel(ANCIENT_COUNTRIES.baekje.home);placeDecor(st,'room-1','clayLamp');h.lamps['room-1']=true;const owned=JSON.stringify(h.decorations);
st.map='ancient-shop-baekje-wood';st.x=5;st.y=4.9;
for(const n of [2,3,4]){assert.equal(upgradeHome(st),true);assert.equal(h.level,n);assert.equal(h.lamps['room-1'],true);assert.equal(h.placements['room-1'],'clayLamp');assert.equal(JSON.stringify(h.decorations),owned);}
const legacy=structuredClone(st);delete legacy.ancient.home.lamps;const migrated=validate(legacy);assert.deepEqual(migrated.ancient.home.lamps,{});assert.equal(migrated.saveVersion,3);assert.equal(JSON.stringify(migrated.ancient.home.decorations),owned);
for(const [id,d]of Object.entries(DECOR))for(const slot of DECOR_SLOTS.filter(v=>(d.area==='both'||d.area===v.area)&&(!d.wall||v.wall))){const old=structuredClone(st);old.ancient.home.placements={[slot.id]:id};old.ancient.home.lamps={};delete old.ancient.home.lamps;const back=validate(old);assert.equal(back.ancient.home.placements[slot.id],id,'grandfathered v51.2 slot '+id+' '+slot.id);}
const early52=structuredClone(st);early52.ancient.home.lamps={'room-1':null};const repaired=validate(early52);assert.deepEqual(repaired.ancient.home.lamps,{});assert.deepEqual(repaired.ancient.home.placements,st.ancient.home.placements);assert.deepEqual(repaired.ancient.home.decorations,st.ancient.home.decorations);assert.equal(repaired.coins,st.coins);
const restored=validate(JSON.parse(JSON.stringify(st)));assert.equal(restored.ancient.home.lamps['room-1'],true);
for(const bad of [true,{'room-2':true},{'room-1':1}]){const corrupt=structuredClone(st);corrupt.ancient.home.lamps=bad;assert.throws(()=>validate(corrupt));}
qa.travel(ANCIENT_COUNTRIES.baekje.home);
// One owned copy moves atomically; cancel cannot mutate the saved arrangement.
h.decorations.clayLamp=1;qa.decor().open();click('[data-decor-pick="clayLamp"]');click('[data-decor-site="room-5"]');click('#decor-place');assert.equal(h.placements['room-1'],undefined);assert.equal(h.placements['room-5'],'clayLamp');assert.equal(h.lamps['room-5'],true);assert.equal(h.decorations.clayLamp,1);click('#decor-exit');
// Shared QA registration, country/stage presets, interactions and original restoration.
qa.menu();click('[data-admin-menu="interaction"]');click('[data-qa-interact="decor"]');
for(const country of Object.keys(ANCIENT_COUNTRIES)){click('[data-decor-country="'+country+'"]');for(const n of [1,2,3,4]){click('[data-decor-level="'+n+'"]');click('[data-decor-preset="full"]');assert.equal(Object.keys(qa.state().ancient.home.placements).length,HOME_LEVELS[n].slots);assert.equal(validate(structuredClone(qa.state())).ancient.home.level,n);}}
for(const id of ['fineBedding','diningSet','grainRack','yardArbor','clayLamp','doubleLamp']){openQA();click('[data-decor-test="'+id+'"]');assert.equal(qa.nearby().decorId,id);click('#interact');assert.ok(document.querySelector('.decor-use-head'));qa.field();}
openQA();click('#decor-qa-legacy');assert.deepEqual(qa.state().ancient.home.lamps,{});assert.equal(localStorage.getItem('history-explorer-save-v1'),baseline);qa.exit();assert.equal(qa.state().nickname,original.nickname);assert.equal(qa.state().coins,original.coins);const finalSave=JSON.parse(localStorage.getItem('history-explorer-save-v1')),originalSave=JSON.parse(baseline);delete finalSave.updatedAt;delete originalSave.updatedAt;assert.deepEqual(finalSave,originalSave);
console.log('v52 decor: 3 countries × 4 levels × 3 viewports, all 18 assets and viable sites; real UI preview/cancel/place/remove/move; physical proximity and existing furniture; customized avatar pose and capped old rest, lamps, harvested records; upgrade/save/legacy/corruption; shared administrator fixtures and student isolation. Canvas mocked; visual inspection reported separately.');
await unlink(path);dom.window.close();process.exit(0);
