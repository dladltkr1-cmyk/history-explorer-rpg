import assert from 'node:assert/strict';
globalThis.Image=class {set src(v){} get complete(){return false;}};
const {fresh,validate,advance,ITEMS,abilities}=await import('../dist/state.js');
const {REGIONS,MAPS}=await import('../dist/regions/index.js?v=41.1');
const {FISHING_QA,FISHING_SITES,prepareContentQA,INTERACTION_QA}=await import('../dist/regions/fishing-content.js?v=41.1');
const {makeThread,pickBranch,makeNeedle,makeRod,fishingBoneDrop,createFishing,fishingPosition,pullFishing,nextFishingRound,fishingObjective,FISHING_PROFILES,fishingWait,fishingCooldown,restFishingSite,fishingSiteKey}=await import('../dist/fishing.js?v=41.1');
const {rollDrop,cookItem,salePrice}=await import('../dist/economy.js');
const {inFishingRiver}=await import('../dist/waterside.js');
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
let seed=3904;const random=()=>{seed=seed*16807%2147483647;return (seed-1)/2147483646;};
const waits=[],requirements=new Set(),positions=new Set(),speeds=new Set(),profiles=new Set();
for(let i=0;i<1000;i++) {
  const g=createFishing(false,{},random);waits.push(g.waitMs);requirements.add(g.required);profiles.add(g.profile);
  let previous=null;
  while(!g.done){
    const [left,right]=g.zone;positions.add(left.toFixed(3));speeds.add(g.duration);
    assert.ok(left>=.079999&&right<=.920001);
    assert.ok(right-left>=FISHING_PROFILES[g.profile].width[0]-.00001);
    assert.ok(right-left<=FISHING_PROFILES[g.profile].width[1]+.00001);
    assert.ok(g.duration>=FISHING_PROFILES[g.profile].duration[0]);
    assert.ok(g.duration<=FISHING_PROFILES[g.profile].duration[1]);
    if(previous!==null)assert.ok(Math.abs(left-previous)>=.0999);
    previous=left;
    fishingPosition(g,g.duration*(left+right)/2);assert.equal(pullFishing(g),true);
    for(let j=0;j<20;j++)assert.equal(pullFishing(g),null);
    if(g.successes<g.required)assert.equal(g.done,false);
    nextFishingRound(g);
  }
  assert.ok(g.won);assert.equal(g.successes,g.required);
}
assert.deepEqual([...requirements].sort(),[2,3,4,5]);assert.equal(profiles.size,4);
assert.ok(positions.size>100&&speeds.size>100);
assert.ok(waits.every(v=>v>=5000&&v<=60000));assert.ok(Math.min(...waits)<7000&&Math.max(...waits)>58000);
const normalWaits=waits.filter(v=>v>=12000&&v<30000).length;assert.ok(normalWaits>500&&normalWaits<730);
assert.ok(waits.filter(v=>v>=45000).length<80);
// Free fishing requires a smaller, faster target than the teaching round.
for(const profile of ['easy','normal','hard','rare']) {
  assert.ok(FISHING_PROFILES[profile].width[1]<=.22);
  assert.ok(FISHING_PROFILES[profile].width[1]<FISHING_PROFILES.tutorial.width[0]);
  assert.ok(FISHING_PROFILES[profile].duration[1]<FISHING_PROFILES.tutorial.duration[0]);
}
for(const profile of ['easy','normal','hard','rare']) {
  const f=createFishing(false,{profile},random);
  for(let i=0;i<f.maxFailures;i++){
    fishingPosition(f,0);assert.equal(pullFishing(f),false);
    fishingPosition(f,f.duration*(f.zone[0]+f.zone[1])/2);assert.equal(pullFishing(f),null);
    nextFishingRound(f);assert.equal(f.done,i===f.maxFailures-1);
  }
  assert.ok(f.done&&!f.won);assert.equal(f.successes,0);
  const idle=createFishing(false,{profile},random);while(!idle.done)nextFishingRound(idle);assert.equal(idle.failures,idle.maxFailures);
  const mixed=createFishing(false,{profile},random);
  nextFishingRound(mixed);assert.equal(mixed.done,false); // one mistake never ends a game
  while(!mixed.done){fishingPosition(mixed,mixed.duration*(mixed.zone[0]+mixed.zone[1])/2);pullFishing(mixed);nextFishingRound(mixed);}
  assert.ok(mixed.won);
}
for(let i=0;i<100;i++){
 const t=createFishing(true,{},random);assert.ok(t.required===2||t.required===3);assert.ok(t.zone[1]-t.zone[0]>=.26-1e-10);assert.ok(t.duration>=2100);assert.ok(t.waitMs>=5000&&t.waitMs<=12000);
}
assert.equal(createFishing(false,{waitMs:60000}).waitMs,60000);
assert.equal(fishingWait(()=>0),5000);assert.equal(fishingWait(()=>1),60000);
const resting=structuredClone(s),now=Date.now();
restFishingSite(resting,'neo-river','neo-fishing',true,now);
assert.equal(fishingCooldown(resting,'neo-river','neo-fishing',now),60000);
assert.equal(fishingCooldown(resting,'bronze-village','bronze-fishing',now),0);
const loaded=validate(JSON.parse(JSON.stringify(resting)));
assert.equal(fishingCooldown(loaded,'neo-river','neo-fishing',now+1000),59000);
assert.equal(fishingCooldown(loaded,'neo-river','neo-fishing',now+60000),0);
restFishingSite(resting,'neo-river','neo-fishing',false,now);
assert.equal(fishingCooldown(resting,'neo-river','neo-fishing',now),7000);
assert.equal(fishingCooldown(resting,'neo-river','neo-fishing',now+7000),0);
console.log('Random fishing: 1000 catches; all 4 profiles / 2–5 successes; varied targets/speeds; weighted waits 5–60s; miss/spam guards; per-site 60s/7s cooldown and save restoration.');
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
for(const site of FISHING_SITES){assert.ok(MAPS[site.map].entities.some(e=>e.id===site.id&&e.type==='fishingSpot'));assert.ok(MAPS[site.map].river||MAPS[site.map].fishingRiver||MAPS[site.map].fishingPond||['nation-okjeo-river','nation-samhan-mahan'].includes(site.map));}
for(const [id,oldMap,newMap,village]of [
  ['bronze-fishing','bronze-village','bronze-outskirts','bronze-village'],
  ['go-fishing','go-field','go-outskirts','go-village'],
]) {
  const site=FISHING_SITES.find(e=>e.id===id),m=MAPS[newMap];
  assert.equal(site.map,newMap);assert.ok(!MAPS[oldMap].fishingPond);
  assert.ok(!MAPS[oldMap].entities.some(e=>e.id===id));
  assert.ok(!['field','bronze','ancient'].includes(m.theme));
  assert.equal(inFishingRiver(m,site.x,site.y),false);
  assert.equal(inFishingRiver(m,site.float.x,site.float.y),true);
  assert.ok(MAPS[village].entities.some(e=>e.type==='exit'&&e.to===newMap));
  for(const [x,y]of [[20,14],[20,13]]) {
    assert.ok(!MAPS[village].obstacles.some(o=>Math.abs(o.x-x)<.65&&Math.abs(o.y-y)<.6),'bank exit approach and return must stay clear');
    assert.ok(!MAPS[village].entities.some(e=>(e.solid||e.type==='npc'||e.type==='shop')&&Math.abs(e.x-x)<(e.solid?1:.48)&&Math.abs(e.y-y)<(e.solid?.65:.42)));
  }
  assert.ok(m.entities.some(e=>e.type==='exit'&&e.to===village));
  assert.ok(!m.entities.some(e=>e.type!=='fishingSpot'&&inFishingRiver(m,e.x,e.y)));
  assert.ok(INTERACTION_QA.some(e=>e.map===newMap&&e.target===id&&e.action==='fishing'));
  const prior=fresh('옛물가저장','boy');prior.cooldowns[`fishing:${oldMap}:${id}`]=now+60000;
  const v=validate(JSON.parse(JSON.stringify(prior)));
  assert.equal(fishingCooldown(v,newMap,id,now+1000),59000);
  restFishingSite(v,newMap,id,true,now+2000);
  assert.equal(fishingCooldown(v,oldMap,id,now+3000),59000);
  assert.equal(Object.keys(v.cooldowns).filter(k=>k.startsWith('fishing:')).length,1);
}
assert.equal(ITEMS.fish.heal,8);assert.equal(ITEMS.cookedfish.heal,13);assert.equal(salePrice(ITEMS.fish),6);
const food=structuredClone(s);food.artifacts.push('fire');food.inventory.fish=1;assert.ok(cookItem(food,'fish'));assert.equal(food.inventory.cookedfish,1);
assert.equal(abilities(fresh('능력','boy')).attack,7);
const guide=fresh('안내검사','boy');
assert.match(fishingObjective(guide),/가락바퀴/);
guide.inventory.fishingthread=1;assert.match(fishingObjective(guide),/나뭇가지/);
guide.inventory.fishingbranch=1;assert.match(fishingObjective(guide),/멧돼지/);
guide.inventory.boarbone=1;assert.match(fishingObjective(guide),/가방 → 기타/);
guide.inventory.boneneedle=1;assert.match(fishingObjective(guide),/기술자에게 돌아가자/);
guide.inventory.fishingrod=1;assert.match(fishingObjective(guide),/낚시 자리/);
console.log('Fishing verified: crafting/drop, random targets, spam/failure, save/code serialization, 7 legacy progress cases, 12 QA stages, 6 waterside spots, cooking/economy.');
