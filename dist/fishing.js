// Shared fishing rules: one press per opportunity, three successes, no loss on failure.
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
export function createFishing(tutorial=false) {
  return {tutorial,round:0,successes:0,pressed:false,done:false,won:false,
    duration:tutorial?2600:2400,zone:tutorial?[.28,.72]:[.34,.66],position:0};
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
  game.won=game.successes>=3;
  game.done=game.won||game.round>=5;
  game.pressed=false;game.position=0;
}
