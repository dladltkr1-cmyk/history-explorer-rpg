import assert from 'node:assert/strict';
globalThis.Image=class {set src(v){} get complete(){return false;}};
const {fresh,validate,advance,ITEMS,abilities}=await import('../dist/state.js');
const {REGIONS,MAPS}=await import('../dist/regions/index.js?v=38');
const {FISHING_QA,FISHING_SITES,prepareContentQA,INTERACTION_QA}=await import('../dist/regions/fishing-content.js?v=38');
const {makeThread,pickBranch,makeNeedle,makeRod,fishingBoneDrop,createFishing,fishingPosition,pullFishing,nextFishingRound}=await import('../dist/fishing.js?v=38');
const {rollDrop,cookItem,salePrice}=await import('../dist/economy.js');
const neo=REGIONS.find(r=>r.id==='prehistoric');
const s=fresh('낚시검사','boy');s.unlockedRegions.push('prehistoric');s.map='pre-village';s.progress.prehistoric=6;
assert.equal(neo.quests[5].id,'pre-return');assert.equal(neo.quests.length,9);
advance(s,'talk:neo-technician');assert.equal(s.progress.prehistoric,7);
assert.equal(makeThread(s),false);s.artifacts.push('spindle');assert.ok(makeThread(s));assert.equal(makeThread(s),false);
assert.ok(pickBranch(s));assert.equal(pickBranch(s),false);
assert.deepEqual(fishingBoneDrop(s,'boar','paleolithic'),{});
const drop=rollDrop('boar',()=>.5);const meat=drop.items.rawmeat;
Object.assign(drop.items,fishingBoneDrop(s,'boar','prehistoric'));assert.equal(drop.items.rawmeat,meat);assert.equal(drop.items.boarbone,1);
s.inventory.boarbone=1;assert.deepEqual(fishingBoneDrop(s,'boar','prehistoric'),{});assert.ok(makeNeedle(s));assert.equal(s.inventory.boarbone,0);assert.equal(makeNeedle(s),false);
assert.ok(makeRod(s));assert.equal(makeRod(s),false);assert.ok(s.artifacts.includes('spindle'));
assert.deepEqual(['fishingthread','fishingbranch','boneneedle'].map(k=>s.inventory[k]),[0,0,0]);advance(s,'craft:fishingrod');assert.equal(s.progress.prehistoric,8);
s.map='neo-river';s.inventory.fish++;advance(s,'fishing:catch');assert.ok(s.completedRegions.includes('prehistoric'));assert.ok(s.unlockedRegions.includes('bronze'));
const coin=s.coins;assert.equal(advance(s,'fishing:catch').length,0);assert.equal(s.coins,coin);
for(const tutorial of [false,true]) {
  const g=createFishing(tutorial);
  for(let i=0;i<2;i++){fishingPosition(g,g.duration*.5);assert.equal(pullFishing(g),true);for(let j=0;j<20;j++)assert.equal(pullFishing(g),null);nextFishingRound(g);assert.equal(g.done,false);}
  fishingPosition(g,g.duration*.5);pullFishing(g);nextFishingRound(g);assert.ok(g.done&&g.won);assert.equal(g.successes,3);
  const f=createFishing(tutorial);
  for(let i=0;i<5;i++){fishingPosition(f,0);assert.equal(pullFishing(f),false);fishingPosition(f,f.duration*.5);assert.equal(pullFishing(f),null);nextFishingRound(f);}
  assert.ok(f.done&&!f.won);assert.equal(f.successes,0);
  const noPress=createFishing(tutorial);for(let i=0;i<5;i++)nextFishingRound(noPress);assert.ok(noPress.done&&!noPress.won);
}
assert.ok(createFishing(true).duration>createFishing(false).duration);assert.ok(createFishing(true).zone[0]<createFishing(false).zone[0]);
const resumed=validate(JSON.parse(JSON.stringify(s)));assert.equal(resumed.inventory.fishingrod,1);assert.equal(resumed.inventory.fish,s.inventory.fish);
resumed.personalCode='HE123456';const codeRoundTrip=validate(JSON.parse(JSON.stringify(resumed)));assert.equal(codeRoundTrip.inventory.fishingrod,1);
for(let i=0;i<=6;i++){
  const old=fresh('옛저장','girl');delete old.fishingStoryRevision;for(const id of ['fishingthread','fishingbranch','boarbone','boneneedle','fishingrod'])delete old.inventory[id];old.unlockedRegions.push('prehistoric');old.progress.prehistoric=i;if(i===6){old.completedRegions.push('prehistoric');old.unlockedRegions.push('bronze');}
  const v=validate(old);assert.equal(v.progress.prehistoric,i===6?9:i);assert.equal(v.inventory.fishingrod,0);assert.equal(v.coins,old.coins);assert.equal(v.level,old.level);
  if(i===6){v.completedQuests.push('pre-fishing-start');v.artifacts.push('spindle');makeThread(v);pickBranch(v);v.inventory.boarbone=1;makeNeedle(v);assert.ok(makeRod(v));assert.equal(v.progress.prehistoric,9);}
}
const original=JSON.stringify(s);for(const stage of FISHING_QA){const qa=structuredClone(s);prepareContentQA(qa,neo,stage);qa.map=stage.map;assert.ok(MAPS[stage.map].entities.some(e=>e.id===stage.target));assert.doesNotThrow(()=>validate(qa));assert.equal(qa.inventory.fishingrod,stage.items?.fishingrod||0);}assert.equal(JSON.stringify(s),original);
assert.equal(FISHING_QA.length,12);assert.ok(INTERACTION_QA.some(v=>v.action==='fishing'));
assert.equal(MAPS['neo-river'].entities.some(e=>e.id==='river-fish'),false);assert.ok(MAPS['paleo-forest'].entities.some(e=>e.id==='wild-fish'));
for(const site of FISHING_SITES){assert.ok(MAPS[site.map].entities.some(e=>e.id===site.id&&e.type==='fishingSpot'));assert.ok(MAPS[site.map].river||MAPS[site.map].fishingPond||['nation-okjeo-river','nation-samhan-mahan'].includes(site.map));}
assert.equal(ITEMS.fish.heal,8);assert.equal(ITEMS.cookedfish.heal,13);assert.equal(salePrice(ITEMS.fish),6);
const food=structuredClone(s);food.artifacts.push('fire');food.inventory.fish=1;assert.ok(cookItem(food,'fish'));assert.equal(food.inventory.cookedfish,1);
assert.equal(abilities(fresh('능력','boy')).attack,7);
console.log('Fishing verified: crafting/drop, 3-of-5, spam/failure, save/code serialization, 7 legacy progress cases, 12 QA stages, 6 waterside spots, cooking/economy.');
