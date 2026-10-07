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
const intervals=new Map();let intervalId=0;globalThis.setInterval=(fn,ms)=>{intervals.set(++intervalId,{fn,ms});return intervalId;};globalThis.clearInterval=n=>intervals.delete(n);
let source=await readFile(root+'/dist/game.js','utf8');source=source.replace(/from (["'])(\.\/[^"']+)\1/g,(_,q,p)=>'from '+q+new URL(p,'file://'+root+'/dist/').href+q);
source+='\nexport const qa={state:()=>s,start,screen:()=>screen,menu:adminPanel,field:()=>{close();hud();},blocked,travel,currentMap,targetEntity,tick,life:homesteadUI,login:()=>{adminOriginal=structuredClone(saved);adminMode=true;start(structuredClone(saved));adminPanel();},exit:adminExit};';
const path=root+'/scripts/.ancient-ui-test-life-'+process.pid+'.mjs';await writeFile(path,source);const {qa}=await import(path);
const click=selector=>{const el=document.querySelector(selector);assert.ok(el,selector+' '+document.querySelector('#overlay')?.textContent);assert.equal(el.disabled,false,selector+' disabled');el.click();};
function finishDialogue(){let count=0;while(document.querySelector('#next-dialogue')){assert.ok(count++<10);click('#next-dialogue');}}
function approach(e){const st=qa.state();const spots=[[e.x-1.2,e.y],[e.x+1.2,e.y],[e.x,e.y+1.2],[e.x,e.y-1.2]];const p=spots.find(([x,y])=>!qa.blocked(x,y));assert.ok(p,'safe interaction spot '+e.id);st.x=p[0];st.y=p[1];qa.field();clock+=40;qa.tick(clock);click('#interact');}

const {prepareAncientQA}=await import(root+'/dist/ancient-state.js?v=48');
const {HOME_LEVELS,CROPS,plotState}=await import(root+'/dist/homestead.js?v=48');
const {salePrice}=await import(root+'/dist/economy.js?v=48');
const {ITEMS}=await import(root+'/dist/state.js?v=48');
const initial=localStorage.getItem('history-explorer-save-v1');qa.login();
const pulse=()=>{for(const entry of intervals.values())if(entry.ms===500)entry.fn();};
const lifeTimers=()=>[...intervals.values()].filter(v=>v.ms===500).length;
const open=()=>{qa.field();click('#menu-btn');click('#life-home-menu');};
const tab=name=>click('[data-life-tab="'+name+'"]');
for(const [width,height]of [[1363,936],[1024,768],[768,1024]]){
 globalThis.innerWidth=width;globalThis.innerHeight=height;
 for(const [country,c]of Object.entries(ANCIENT_COUNTRIES)){
  prepareAncientQA(qa.state(),'4c',{country});let st=qa.state();st.coins=4000;st.inventory.lumber=30;st.ancient.home.level=1;st.ancient.home.fields=2;st.ancient.home.paddies=0;st.ancient.home.plots.forEach(p=>{p.crop=null;p.plantedAt=0;});st.ancient.home.placements={'yard-1':'clayJar','room-1':'reedMat'};for(const id of Object.keys(CROPS)){st.ancient.home.seeds[id]=10;st.inventory[CROPS[id].item]=0;}
  qa.travel(c.home);open();assert.equal(document.querySelectorAll('[data-life-plot]').length,2);assert.equal(lifeTimers(),1);
  click('[data-life-plot="field-1"]');click('[data-life-plant="millet"]');assert.equal(st.ancient.home.seeds.millet,9);assert.equal(st.ancient.home.plots[0].crop,'millet');
  click('[data-life-plot="field-1"]');assert.equal(document.querySelector('#life-pick').disabled,true);clock+=179999;pulse();assert.equal(document.querySelector('#life-pick').disabled,true);clock+=1;pulse();assert.equal(document.querySelector('#life-pick').disabled,false);click('#life-pick');assert.equal(st.inventory.millet,4);assert.equal(lifeTimers(),1);
  tab('market');assert.equal(lifeTimers(),0);assert.equal(document.querySelector('[data-life-buy-seed="ricecrop"]').disabled,true);const beforeSale=st.coins;click('[data-life-sell="millet"]');click('#life-sell-all');assert.equal(st.coins,beforeSale+12);assert.equal(st.inventory.millet,0);
  const seedBefore=st.ancient.home.seeds.millet;click('[data-life-buy-seed="millet"]');assert.equal(st.ancient.home.seeds.millet,seedBefore+1);assert.equal(st.coins,beforeSale+10);
  tab('farm');click('[data-life-plot="field-2"]');click('[data-life-plant="barnyard"]');const planted=structuredClone(st.ancient.home.plots[1]);
  for(const level of [2,3,4]){tab('growth');const before=st.coins,lumber=st.inventory.lumber;click('#life-upgrade');click('#life-upgrade-confirm');assert.equal(st.ancient.home.level,level);assert.equal(st.coins,before-HOME_LEVELS[level].coins);assert.equal(st.inventory.lumber,lumber-HOME_LEVELS[level].lumber);assert.deepEqual(st.ancient.home.plots[1],planted);assert.equal(qa.currentMap().w,HOME_LEVELS[level].room[0]);assert.equal(qa.blocked(st.x,st.y),false);tab('farm');assert.equal(document.querySelectorAll('[data-life-plot]').length,HOME_LEVELS[level].fields);}
  tab('growth');click('#life-open-paddy');click('#life-open-paddy');assert.equal(st.ancient.home.paddies,2);tab('farm');assert.equal(document.querySelectorAll('[data-life-plot]').length,10);
  for(const [i,[id,crop]]of Object.entries(Object.entries(CROPS))){const target=crop.kind==='paddy'?'paddy-1':'field-'+(Number(i)+3);click('[data-life-plot="'+target+'"]');click('[data-life-plant="'+id+'"]');}
  const growing=structuredClone(st.ancient.home.plots);clock+=8*60000;qa.start(validate(structuredClone(st)));st=qa.state();assert.deepEqual(st.ancient.home.plots,growing);open();pulse();assert.ok(document.querySelectorAll('.life-plot.ready').length>=5);click('#life-harvest-all');for(const crop of Object.values(CROPS))assert.ok(st.inventory[crop.item]>=4);assert.ok(st.ancient.home.reputation>=7);
  tab('decor');click('[data-life-buy-decor="stripedJar"]');const count=st.ancient.home.decorations.stripedJar;click('[data-life-slot="room-2"]');click('[data-life-place="stripedJar"]');assert.equal(st.ancient.home.placements['room-2'],'stripedJar');assert.equal(st.ancient.home.decorations.stripedJar,count);assert.ok(qa.currentMap().entities.some(e=>e.id==='life-decor-room-2'&&e.art==='life-stripedJar'));click('[data-life-slot="room-2"]');click('#life-remove');assert.equal(st.ancient.home.placements['room-2'],undefined);assert.equal(st.ancient.home.decorations.stripedJar,count);
  tab('market');click('[data-life-craft="woodBox"]');assert.ok(st.ancient.home.decorations.woodBox);click('#life-sell-other');assert.ok(document.querySelector('[data-sell="fish"]')||document.querySelector('.panel').textContent.includes('판매'));
  qa.travel('ancient-yard-'+country);qa.field();assert.equal(qa.blocked(st.x,st.y),false);const farmEntity=qa.currentMap().entities.find(e=>e.type==='farmPlot');approach(farmEntity);assert.ok(document.querySelector('[data-life-plant]'));qa.field();assert.equal(lifeTimers(),0);
  assert.equal(localStorage.getItem('history-explorer-save-v1'),initial,'life test preserves original student save');
 }
}
qa.menu();click('[data-admin-menu="interaction"]');click('[data-qa-interact="homestead"]');assert.ok(document.querySelector('#life-qa-choice'));
click('#life-qa-choice');assert.equal(qa.state().progress.ancient,16);assert.equal(qa.state().ancient.country,null);
qa.life.adminPanel();click('[data-life-qa-country="silla"]');assert.equal(qa.state().progress.ancient,17);assert.equal(qa.state().ancient.country,'silla');
qa.life.adminPanel();click('[data-life-qa-level="3"]');assert.equal(qa.state().ancient.home.level,3);document.querySelector('#life-qa-fields').value='4';document.querySelector('#life-qa-paddies').value='1';click('#life-qa-unlock');assert.equal(qa.state().ancient.home.fields,4);assert.equal(qa.state().ancient.home.paddies,1);
const seedCount=qa.state().ancient.home.seeds.millet;click('#life-qa-supply');assert.equal(qa.state().ancient.home.seeds.millet,seedCount+10);click('#life-qa-decor');assert.ok(qa.state().ancient.home.decorations.dyedCloth);
document.querySelector('#life-qa-reputation').value='37';click('#life-qa-rep');assert.equal(qa.state().ancient.home.reputation,37);click('#life-qa-planted');assert.equal(qa.state().ancient.home.plots.filter(p=>p.crop).length>=5,true);click('#life-qa-grow');assert.ok(qa.state().ancient.home.plots.filter(p=>p.crop).every(p=>plotState(p).status==='ready'));assert.equal(validate(structuredClone(qa.state())).ancient.home.level,3);
click('#life-qa-open');assert.ok(document.querySelectorAll('.life-plot.ready').length>=5);qa.field();assert.equal(lifeTimers(),0);assert.equal(localStorage.getItem('history-explorer-save-v1'),initial);qa.exit();assert.equal(qa.state().coins,original.coins);assert.equal(qa.state().nickname,original.nickname);
console.log('Life real UI handlers: 3 countries × 3 PC/tablet sizes; plant/wait/live-ready/harvest/sell/seed purchase; all 4 upgrades and 10 plots; 5 crops and offline restoration; decor purchase/place/remove/craft; physical field interaction and geometry; live timer cleanup; shared administrator QA controls and original student restoration.');
await unlink(path);dom.window.close();process.exit(0);
