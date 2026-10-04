// Shared fishing rules and per-site timers. Live mini-game state is never saved.
export const FISHING_MATERIALS = ['fishingthread','fishingbranch','boarbone','boneneedle','fishingrod'];
export const ROD_RECIPE = { fishingthread:1, fishingbranch:1, boneneedle:1 };
export const FISHING_ITEMS = {
  fishingthread:{name:'실',art:'threadIcon',text:'가락바퀴로 만든 낚싯대 재료'},
  fishingbranch:{name:'나뭇가지',art:'branchIcon',text:'낚싯대의 몸체로 쓸 재료'},
  boarbone:{name:'멧돼지 뼈',art:'boneIcon',text:'가방에서 뼈바늘을 만들 수 있어'},
  boneneedle:{name:'뼈바늘',art:'needleIcon',text:'뼈를 다듬은 생활 도구 · 낚싯대 재료'},
  fishingrod:{name:'낚싯대',art:'rodIcon',text:'영구 탐험 도구 · 물가에서 낚시하기'},
};
export const hasRod = s => (s.inventory.fishingrod||0)>0;
export const fishingStarted = s => s.completedQuests.includes('pre-fishing-start');
export const rodReady = s => Object.entries(ROD_RECIPE).every(([id,n])=>(s.inventory[id]||0)>=n);
export function fishingObjective(s) {
  if(hasRod(s))return '강가 낚시 자리에서 물고기를 잡아 보자.';
  if(rodReady(s))return '재료를 모두 모았다. 마을 기술자에게 돌아가자.';
  if(!s.inventory.fishingthread)return '가락바퀴를 조사하고 실을 만들자.';
  if(!s.inventory.fishingbranch)return '숲의 나무 주변에서 나뭇가지를 줍자.';
  if(!s.inventory.boneneedle)return s.inventory.boarbone
    ? '가방 → 기타에서 멧돼지 뼈로 뼈바늘을 만들자.'
    : '신석기 숲에서 멧돼지를 잡아 뼈를 얻자.';
}
export function makeThread(s) {
  if(!fishingStarted(s)||!s.artifacts.includes('spindle')||hasRod(s)||s.inventory.fishingthread) return false;
  s.inventory.fishingthread=1;return true;
}
export function pickBranch(s) {
  if(!fishingStarted(s)||hasRod(s)||s.inventory.fishingbranch) return false;
  s.inventory.fishingbranch=1;return true;
}
export function makeNeedle(s) {
  if(!fishingStarted(s)||hasRod(s)||!s.inventory.boarbone||s.inventory.boneneedle) return false;
  s.inventory.boarbone--;s.inventory.boneneedle=1;return true;
}
export function makeRod(s) {
  if(!fishingStarted(s)||hasRod(s)||!rodReady(s)) return false;
  for(const [id,n] of Object.entries(ROD_RECIPE))s.inventory[id]-=n;
  s.inventory.fishingrod=1;return true;
}
export function fishingBoneDrop(s,enemy,era) {
  if(era!=='prehistoric'||enemy!=='boar'||!fishingStarted(s)||hasRod(s)||s.inventory.boarbone||s.inventory.boneneedle)return {};
  return {boarbone:1};
}
export const FISHING_PROFILES = {
  tutorial:{required:[2,3],width:[.26,.30],duration:[2100,2400],mistakesAllowed:2},
  easy:{required:[2,2],width:[.20,.22],duration:[1750,1950],mistakesAllowed:2},
  normal:{required:[3,3],width:[.16,.18],duration:[1500,1700],mistakesAllowed:2},
  hard:{required:[4,4],width:[.13,.15],duration:[1400,1550],mistakesAllowed:1},
  rare:{required:[5,5],width:[.10,.12],duration:[1300,1450],mistakesAllowed:1},
};
const between=(range,random)=>range[0]+(range[1]-range[0])*random();
export function fishingWait(random=Math.random) {
  const roll=random();
  const range=roll<.18?[5000,12000]:roll<.80?[12000,30000]:roll<.96?[30000,45000]:[45000,60000];
  return Math.round(between(range,random));
}
function configureFishingRound(game) {
  const profile=FISHING_PROFILES[game.profile],random=game.random;
  const width=between(profile.width,random);
  let left=.08+(1-width-.16)*random();
  // Keep successive targets visibly distinct, even when random rolls are alike.
  if(game.zone&&Math.abs(left-game.zone[0])<.10)
    left=game.zone[0]<.40?1-.08-width:.08;
  game.zone=[left,left+width];
  game.duration=Math.round(between(profile.duration,random));
  game.position=0;game.pressed=false;
}
export function createFishing(tutorial=false,options={},random=Math.random) {
  const roll=random();
  const profile=tutorial?'tutorial':options.profile&&FISHING_PROFILES[options.profile]?options.profile:
    roll<.24?'easy':roll<.70?'normal':roll<.94?'hard':'rare';
  const rules=FISHING_PROFILES[profile];
  const game={tutorial,profile,random,round:0,successes:0,failures:0,pressed:false,done:false,won:false,
    required:Math.round(between(rules.required,random)),maxFailures:rules.mistakesAllowed+1,
    waitMs:options.waitMs??(tutorial?Math.round(between([5000,12000],random)):fishingWait(random))};
  configureFishingRound(game);return game;
}
export const fishingSiteKey=(map,id)=>`fishing:${map}:${id}`;
export const fishingCooldown=(s,map,id,now=Date.now())=>Math.max(0,(s.cooldowns[fishingSiteKey(map,id)]||0)-now);
export function restFishingSite(s,map,id,won,now=Date.now()) {
  s.cooldowns[fishingSiteKey(map,id)]=now+(won?60000:7000);
}
export function fishingPosition(game,elapsed) {
  game.position=Math.min(1,Math.max(0,elapsed/game.duration));return game.position;
}
export function pullFishing(game) {
  if(game.done||game.pressed)return null;
  game.pressed=true;
  const success=game.position>=game.zone[0]&&game.position<=game.zone[1];
  if(success)game.successes++;
  return success;
}
export function nextFishingRound(game) {
  if(game.done)return;
  game.round++;
  game.failures=game.round-game.successes;
  game.won=game.successes>=game.required;
  game.done=game.won||game.failures>=game.maxFailures;
  game.pressed=false;
  if(!game.done)configureFishingRound(game);
}
