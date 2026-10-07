import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
globalThis.Image=class{set src(v){}get complete(){return false;}};
const {REGIONS,MAPS}=await import('../dist/regions/index.js?v=48.1');
const {fresh,validate,advance,activeQuest,abilities,ITEMS}=await import('../dist/state.js?v=48.1');
const {ANCIENT_COUNTRIES,ANCIENT_CHAPTERS,ANCIENT_MAPS,ANCIENT_KINGS,ANCIENT_QA,ANCIENT_QUESTS,ANCIENT_QUIZZES,ancientWorld,ancientCanEnter,ancientQuest}=await import('../dist/regions/ancient.js?v=48.1');
const {chooseAncientCountry,setAncientCentury,transferAncientStorage,prepareAncientQA,completeAncientChapter,noteAncientVisit}=await import('../dist/ancient-state.js?v=48.1');
const {ancientMapImage}=await import('../dist/ancient-ui.js?v=48.1');
const {INTERACTION_QA,FISHING_SITES,prepareContentQA}=await import('../dist/regions/fishing-content.js?v=48.1');
const {inFishingRiver}=await import('../dist/waterside.js?v=44.2');
const era=REGIONS.find(r=>r.id==='ancient'),growth=REGIONS.find(r=>r.id==='nations');
for(const r of REGIONS.slice(0,5)){
 const s=fresh('이전 시대 저장','boy'),index=Math.floor(r.quests.length/2);delete s.ancient;
 s.map=r.quests[index].map;s.progress[r.id]=index;s.unlockedRegions=REGIONS.slice(0,REGIONS.indexOf(r)+1).map(v=>v.id);
 s.completedRegions=REGIONS.slice(0,REGIONS.indexOf(r)).map(v=>v.id);s.inventory.fishingrod=1;s.horseUnlocked=true;s.appearance={hair:5,eyes:2,skin:2,hairColor:1,outfit:3};s.inventory.gear.push('bronzeCharm');s.personalCode='HE123456';
 const restored=validate(JSON.parse(JSON.stringify(s)));assert.equal(restored.progress[r.id],index);assert.equal(activeQuest(restored,r).id,r.quests[index].id);assert.equal(restored.map,s.map);assert.deepEqual(restored.appearance,s.appearance);assert.deepEqual(restored.inventory,s.inventory);assert.equal(restored.horseUnlocked,true);assert.equal(restored.personalCode,s.personalCode);assert.ok(!restored.unlockedRegions.includes('ancient'));
}
assert.equal(REGIONS.length,6);assert.equal(growth.unlock,'ancient');
const partial=fresh('옛기록','boy');partial.nickname='옛기록';delete partial.ancient;partial.progress.nations=5;partial.unlockedRegions.push('ancient');assert.ok(!validate(partial).unlockedRegions.includes('ancient'));assert.equal(validate(partial).progress.nations,5);
const old=fresh('옛저장','boy');delete old.ancient;old.completedRegions.push('nations');old.unlockedRegions.push('nations');const restored=validate(old);assert.ok(restored.unlockedRegions.includes('ancient'));assert.equal(restored.ancient.country,null);assert.equal(restored.saveVersion,3);
const finishing=fresh('해금','boy');finishing.map='nation-iron-village';finishing.unlockedRegions.push('nations');finishing.progress.nations=growth.quests.length-1;finishing.nationMarks=['buyeo','goguryeo','okjeo','dongye','samhan'];advance(finishing,growth.quests.at(-1).event);assert.ok(finishing.unlockedRegions.includes('ancient'));
for(const [country,c]of Object.entries(ANCIENT_COUNTRIES)) {
 const s=structuredClone(restored);s.inventory.fishingrod=1;s.horseUnlocked=true;s.inventory.food=7;s.personalCode='HE123456';
 for(let index=0;index<21;index++){
  assert.equal(s.progress.ancient||0,index);const q=ancientQuest(ANCIENT_QUESTS[index],s);s.map=q.map;
  assert.ok(ancientCanEnter(s,MAPS[s.map]),q.id+' accessible');
  if(index===6)assert.ok(s.ancient.carry.includes('trail'));
  if(index===10){assert.equal(advance(s,q.event).length,0);s.ancient.carry.push('branch','cord');}
  if(index===14||index===15){assert.equal(advance(s,q.event).length,0);s.completedQuests.push(q.event);}
  if(index===16){const stats=abilities(s);assert.ok(chooseAncientCountry(s,country));assert.equal(chooseAncientCountry(s,'silla'),false);assert.deepEqual(abilities(s),stats);}
  if(index===18)assert.equal(s.ancient.home.owned,true);
  if(index===19)assert.ok(setAncientCentury(s,4));
  const rewards=advance(s,q.event);assert.equal(rewards.length,1,q.id);assert.equal(s.progress.ancient,index+1);
  const roundTrip=validate(JSON.parse(JSON.stringify(s)));assert.equal(roundTrip.progress.ancient,index+1);assert.equal(roundTrip.personalCode,s.personalCode);assert.equal(roundTrip.inventory.fishingrod,1);assert.equal(roundTrip.horseUnlocked,true);
 }
 assert.equal(activeQuest(s,era),null);assert.ok(!s.completedRegions.includes('ancient'));assert.equal(s.ancient.century,4);assert.equal(s.ancient.country,country);assert.equal(chooseAncientCountry(s,'goguryeo'),false);
 s.map=c.home;assert.ok(transferAncientStorage(s,ITEMS,'food',5,true));assert.equal(s.inventory.food,2);assert.equal(s.ancient.home.storage.food,5);assert.equal(transferAncientStorage(s,ITEMS,'fishingrod',1,true),false);assert.equal(transferAncientStorage(s,ITEMS,'food',3,true),false);
 const storageBefore=JSON.stringify(s.ancient.home);for(const n of [4,5,6]){assert.ok(setAncientCentury(s,n,{admin:true}));assert.equal(s.ancient.country,country);assert.equal(JSON.stringify(s.ancient.home),storageBefore);assert.ok(ANCIENT_MAPS[n]);noteAncientVisit(s,c.home);const v=validate(JSON.parse(JSON.stringify(s)));assert.equal(v.ancient.century,n);assert.equal(v.ancient.home.storage.food,5);assert.ok(v.ancient.maps[n].includes(c.home));}
 assert.equal(setAncientCentury(s,5),false);assert.equal(completeAncientChapter(s,'5c'),false);
 assert.ok(transferAncientStorage(s,ITEMS,'food',5,false));assert.equal(s.inventory.food,7);assert.equal(s.ancient.home.storage.food,0);s.map='hq';assert.equal(transferAncientStorage(s,ITEMS,'food',1,true),false);
 for(const n of [4,5,6]){s.ancient.century=n;const m=ancientWorld(MAPS['ancient-han'],s);assert.equal(m.entities.find(e=>e.countryReturn).to,c.village);assert.equal(m.entities.find(e=>e.centuryState==='sign').banner,ANCIENT_MAPS[n].han);assert.notEqual(m.entities.find(e=>e.centuryState==='sign').lines.length,0);}
}
assert.equal(new Set([4,5,6].map(n=>ancientMapImage(n))).size,3);assert.deepEqual([4,5,6].map(n=>ANCIENT_MAPS[n].han),['baekje','goguryeo','silla']);assert.equal(MAPS['ancient-han'].entities.find(e=>e.centuryState==='sign').lines.length,0,'shared definitions remain immutable');
for(const q of ANCIENT_QA){const s=fresh('시험','boy');const r=prepareContentQA(s,era,q);assert.ok(MAPS[r.map].entities.some(e=>e.id===r.target));s.map=r.map;assert.equal(validate(JSON.parse(JSON.stringify(s))).map,r.map);assert.equal(s.progress.ancient,q.index);if(q.index>=17)assert.equal(s.ancient.country,'baekje');}
for(const m of era.maps){assert.ok(m.ancient);for(const e of m.entities){assert.ok(!inFishingRiver(m,e.x,e.y),'land interaction '+e.id);if(e.to)assert.ok(MAPS[e.to],'linked map '+e.id);assert.ok(!m.obstacles.some(o=>Math.abs(o.x-e.x)<.65&&Math.abs(o.y-e.y)<.6),'tree overlap '+e.id);}}
for(const [id,k]of Object.entries(ANCIENT_KINGS)){if(k.available){const file=await readFile(new URL('../dist/assets/ancient/'+({jumong:'jumong',onjo:'onjo',hyeokgeose:'hyeokgeose',suro:'suro'}[id])+'-v44.png',import.meta.url));assert.equal(file.subarray(1,4).toString(),'PNG');assert.ok(era.maps.some(m=>m.entities.some(e=>e.king===id&&e.legend)));}else assert.equal(k.art,null);}
assert.equal(ANCIENT_CHAPTERS.filter(c=>c.ready).length,2);assert.ok(INTERACTION_QA.some(v=>v.action==='ancient'));assert.ok(FISHING_SITES.some(v=>v.map==='ancient-han'));
for(const [id,q]of Object.entries(ANCIENT_QUIZZES)){const e=MAPS['ancient-origins'].entities.find(e=>e.quiz===id);assert.ok(!e.name.includes(q.options[q.answer]));assert.equal(q.intro,undefined);assert.ok(!MAPS['ancient-origins'].name.includes('온조'));}
console.log('Ancient verified: era-5 unlock gate; legacy defaults/code preservation; 21 real event steps × 3 countries; country lock/equal stats; home item conservation; independent 4/5/6 maps and Han overlays; QA fixtures; linked land targets; dedicated founder assets; unfinished chapters stay locked.');

const {parkHorse,retrieveHorse}=await import('../dist/horse-state.js?v=48.1');
const {createHash}=await import('node:crypto');
const hashes={4:'f2ef95a9e9f5e10cb91ddd44a829796a22ffc041feb2105c096f607eb385f5b2',5:'f7da545927b312dd190627dcc69c12e72d5fc1e497f61be896a0ac1b6ba9810f',6:'93582fdef1d9dc06618d9833ea85020020b4ca55484bf6ae83148cd28a4e41c3'};
for(const n of [4,5,6]){const image=ANCIENT_MAPS[n].image;assert.equal(createHash('sha256').update(await readFile(new URL('../dist'+image,import.meta.url))).digest('hex'),hashes[n]);const html=ancientMapImage(n);assert.ok(html.includes('<img'));assert.ok(!html.includes('<svg'));assert.ok(html.includes('ancient-map-overlay'));}
for(const [country,c]of Object.entries(ANCIENT_COUNTRIES)){
 const st=fresh('말 검수','boy');st.completedRegions=REGIONS.slice(0,5).map(r=>r.id);st.unlockedRegions=REGIONS.map(r=>r.id);prepareAncientQA(st,{index:21,map:c.village,target:'ancient-helper'},{country});st.map=c.village;
 assert.equal(parkHorse(st),false);st.horseUnlocked=true;st.mounted=true;assert.equal(parkHorse(st),true);
 for(const n of [4,5,6]){setAncientCentury(st,n,{admin:true});const resumed=validate(JSON.parse(JSON.stringify(st)));assert.equal(resumed.horseParked,true);assert.equal(resumed.mounted,false);assert.equal(ancientWorld(MAPS[c.village],resumed).entities.filter(e=>e.type==='parkedHorse').length,1);assert.equal(ancientWorld(MAPS['ancient-han'],resumed).entities.filter(e=>e.type==='parkedHorse').length,0);}
 assert.equal(retrieveHorse(st),true);assert.equal(st.mounted,true);assert.equal(ancientWorld(MAPS[c.village],st).entities.filter(e=>e.type==='parkedHorse').length,0);assert.equal(retrieveHorse(st),false);
 st.map='ancient-han';assert.equal(parkHorse(st),false);assert.equal(parkHorse(st,{enteringHome:true}),true);delete st.horseParked;assert.equal(validate(st).horseParked,false);
}
console.log('v44: 3 exact original JPG hashes, image/overlay separation; 3 homes × 3 century parked-save restoration; no duplicate horse, retrieve and legacy defaults.');

const {ASSETS}=await import('../dist/assets.js?v=48.1');for(const king of Object.values(ANCIENT_KINGS).filter(v=>v.available)){assert.ok(ASSETS[king.art].endsWith('-v44.png'));}assert.equal(ASSETS.ancientHelperNorth,ASSETS.farmer);assert.equal(ASSETS.ancientHelperRiver,ASSETS.shopkeeper);assert.equal(ASSETS.ancientHelperPlain,ASSETS.elder);
