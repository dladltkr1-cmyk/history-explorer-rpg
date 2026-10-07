import { MAPS, REGIONS, ARTIFACTS, regionOf } from "./regions/index.js?v=48.1";
import { FISHING_ITEMS } from './fishing.js?v=44.2';
import { defaultAppearance, validAppearance } from "./avatar.js?v=25.1";
import { NATION_ITEM_NAMES } from "./regions/nations.js?v=37.1";
import {ancientQuest} from './regions/ancient.js?v=48.1';
import {freshAncient,validateAncient,ancientEventAllowed,onAncientQuest} from './ancient-state.js?v=48.1';
import {CROPS} from './homestead.js?v=48.1';
export const MAX_LEVEL = 10,
  KEY = "history-explorer-save-v1";
export const ITEMS = {
  berries: {
    name: "열매",
    price: 12,
    kind: "food",
    heal: 6,
    art: "berries",
    tier: 0,
    text: "HP +6",
  },
  food: {
    name: "구운 고기",
    price: 22,
    kind: "food",
    heal: 16,
    art: "meat",
    tier: 0,
    text: "HP +16",
  },
  club: {
    name: "나무 몽둥이",
    price: 65,
    kind: "weapon",
    attack: 1,
    art: "club",
    tier: 0,
    text: "공격 +1",
  },
  stoneknife: {
    name: "돌칼",
    price: 120,
    kind: "weapon",
    attack: 2,
    art: "knife",
    tier: 0,
    text: "공격 +2",
  },
  hardknife: {
    name: "단단한 돌칼",
    price: 260,
    kind: "weapon",
    attack: 4,
    art: "knife",
    tier: 1,
    text: "공격 +4",
  },
  trainingblade: {
    name: "튼튼한 연습칼",
    price: 360,
    kind: "weapon",
    attack: 6,
    art: "knife",
    tier: 2,
    text: "공격 +6",
  },
  leather: {
    name: "가죽옷",
    price: 140,
    kind: "clothes",
    defense: 3,
    art: "leatherIcon",
    tier: 0,
    text: "방어 +3",
  },
  thickleather: {
    name: "두꺼운 가죽옷",
    price: 280,
    kind: "clothes",
    defense: 4,
    art: "leatherIcon",
    tier: 1,
    text: "방어 +4",
  },
  woven: {
    name: "촘촘한 삼베옷",
    price: 390,
    kind: "clothes",
    defense: 6,
    art: "leatherIcon",
    tier: 2,
    text: "방어 +6",
  },
  pendant: {
    name: "매듭 장신구",
    price: 160,
    kind: "accessory",
    hp: 15,
    art: "spindle",
    tier: 1,
    text: "최대 HP +15",
  },
  bronzeKnife: { name: "청동 칼", price: 195, kind: "weapon", attack: 5, art: "bronzeKnifeIcon", tier: 2, text: "공격 +5" },
  bronzeArmor: { name: "청동 방어구", price: 205, kind: "clothes", defense: 5, art: "bronzeArmorIcon", tier: 2, text: "방어 +5" },
  bronzeCharm: { name: "청동 장신구", price: 170, kind: "accessory", hp: 20, art: "bronzeCharmIcon", tier: 2, text: "최대 HP +20" },
  ironSword: { name: "철제 칼", price: 450, kind: "weapon", attack: 8, art: "ironSwordIcon", tier: 3, text: "공격 +8" },
  ironArmor: { name: "철제 갑옷", price: 470, kind: "clothes", defense: 8, art: "ironArmorIcon", tier: 3, text: "방어 +8" },
  ironCharm: { name: "철제 장신구", price: 300, kind: "accessory", hp: 30, art: "ironCharmIcon", tier: 3, text: "최대 HP +30" },
};
const extraFoods = {
  rawmeat: ["생고기", 10, "rawmeat", 14],
  fish: ["생물고기", 8, "fish", 13],
  cookedfish: ["구운 물고기", 13, "cookedfish", 19],
  millet: ["조", 7, "grain", 10],
  barnyard: ["피", 7, "grain", 10],
  sorghum: ["수수", 8, "grain", 11],
  ricecrop: ["벼", 18, "ricecrop", 26],
  rice: ["쌀밥", 25, "rice", 36],
};
for (const [id, [name, heal, art, price]] of Object.entries(extraFoods))
  ITEMS[id] = {
    name,
    heal,
    art,
    price,
    kind: id === "ricecrop" ? "material" : "food",
    tier: 0,
    text: id === "ricecrop" ? "밥 짓기 재료" : "HP +" + heal,
  };
ITEMS.hide = {
  name: "가죽",
  kind: "material",
  price: 30,
  sellable: true,
  art: "hide",
  text: "판매 · 부탁 재료",
};
for (const [id, name] of Object.entries(NATION_ITEM_NAMES))
  ITEMS[id] = { name, kind: 'material', price: 0, sellable: false,
    art: ['wood','okjeowood'].includes(id) ? 'tree' : id === 'okjeobowl' ? 'pottery' : id === 'samhantool' || id === 'ironhoe' ? 'knife' : ['okjeograin','samhansack'].includes(id) ? 'grain' : 'chest',
    text: '이야기 임무 물건' };
ITEMS.rawmeat.risk = { chance: 0.25, damage: 6 };
ITEMS.fish.risk = { chance: 0.2, damage: 5 };
for (const item of Object.values(ITEMS))
  if (item.kind === "food") item.sellable = true;
for (const [id,item] of Object.entries(FISHING_ITEMS)) ITEMS[id]={...item,kind:'material',price:0,sellable:false,questOnly:true};
ITEMS.barley={name:'보리',kind:'material',price:10,sellable:true,art:'life-crop-barley',text:'밭에서 수확한 곡식 · 판매'};
ITEMS.lumber={name:'목재',kind:'material',price:8,sellable:true,art:'life-lumber',text:'거처 확장 · 작업대 재료'};
for(const [id,c]of Object.entries(CROPS)){ITEMS[c.item].salePrice=c.sale;ITEMS[c.item].sellable=true;ITEMS[c.item].art='life-crop-'+id;}
export const STACK_IDS = Object.keys(ITEMS).filter((id) =>
  ["food", "material"].includes(ITEMS[id].kind),
);
export const FOOD_IDS = Object.keys(ITEMS).filter(
  (id) => ITEMS[id].kind === "food",
);
export const xpNeed = (level) => 60 + (level - 1) * 30;
export function fresh(name, avatar) {
  return {
    saveVersion: 3,
    fishingStoryRevision: 1,
    merchantIntro: false,
    basicTutorialDone: false,
    tutorials: { fire: false, artifact: false, food: false, rice: false },
    monsters: {},
    encounter: { until: 0, distance: 0 },
    foodEffect: 0,
    energy: 20,
    audioMuted: false,
    nickname: name,
    avatar,
    appearance: defaultAppearance(),
    personalCode: null,
    introSeen: false,
    level: 1,
    xp: 0,
    hp: 36,
    coins: 0,
    equipment: { weapon: null, clothes: null, accessory: null },
    inventory: {
      ...Object.fromEntries(STACK_IDS.map((id) => [id, 0])),
      food: 0,
      berries: 1,
      rawmeat: 0,
      gear: [],
    },
    artifacts: [],
    completedQuests: [],
    unlockedRegions: ["paleolithic"],
    completedRegions: [],
    progress: {},
    ancient: freshAncient(),
    requests: {},
    cooldowns: {},
    resources: {},
    opened: [],
    discoveredMaps: [],
    nationMarks: [],
    horseUnlocked: false,
    horseParked: false,
    mounted: false,
    horseField: null,
    map: "paleo-camp",
    x: 11,
    y: 10,
    direction: "down",
    stats: { wins: 0 },
    updatedAt: Date.now(),
  };
}
export function abilities(s) {
  const es = Object.values(s.equipment).map((k) => ITEMS[k] || {});
  return {
    hp: 36 + (s.level - 1) * 7 + es.reduce((n, i) => n + (i.hp || 0), 0),
    attack: 7 + (s.level - 1) * 2 + es.reduce((n, i) => n + (i.attack || 0), 0),
    defense: 2 + (s.level - 1) + es.reduce((n, i) => n + (i.defense || 0), 0),
  };
}
export function gain(s, xp, coins) {
  let lv = s.level;
  s.coins += coins;
  if (s.level < MAX_LEVEL) {
    s.xp += xp;
    while (s.level < MAX_LEVEL && s.xp >= xpNeed(s.level)) {
      s.xp -= xpNeed(s.level);
      s.level++;
    }
    if (s.level === MAX_LEVEL) s.xp = 0;
  }
  return s.level - lv;
}
export function activeQuest(s, r = regionOf(s.map)) {
  const q=r?.quests[s.progress[r.id] || 0];
  return q?.available===false?null:r?.id==='ancient'?ancientQuest(q,s):q||null;
}
export function advance(s, event) {
  const r = regionOf(s.map);
  if (!r) return [];
  let rewards = [];
  let q = activeQuest(s, r);
  while (
    q && (r.id!=='ancient'||ancientEventAllowed(s,q,event)) &&
    ((q.event === event ||
      (q.event === "cook:any" && event?.startsWith("cook:")) ||
      (q.event.startsWith("artifact:") &&
        s.artifacts.includes(q.event.slice(9)))) &&
      (q.event !== 'craft:fishingrod' || s.inventory.fishingrod > 0) &&
      (q.event !== 'fishing:catch' || s.inventory.fishingrod > 0) &&
      (!q.items || Object.entries(q.items).every(([id,n])=>(s.inventory[id]||0)>=n)) &&
      (!q.marks || s.nationMarks.length >= q.marks) &&
      (!q.anyFood || (s.inventory.berries||0)>=2 || (s.inventory.food||0)>=1 || (s.inventory.rawmeat||0)>=1) ||
      (q.event.startsWith('win:') && s.completedQuests.includes('defeated:'+q.event.slice(4)) &&
        (!q.items || Object.entries(q.items).every(([id,n])=>(s.inventory[id]||0)>=n))) ||
      (q.event.startsWith('collect:') && q.items && Object.entries(q.items).every(([id,n])=>(s.inventory[id]||0)>=n)))
  ) {
    if (q.consume) for(const [id,n] of Object.entries(q.items||{})) s.inventory[id]-=n;
    if (q.anyFood) {
      const id = s.inventory.berries>=2 ? 'berries' : s.inventory.food>=1 ? 'food' : 'rawmeat';
      s.inventory[id]-= id==='berries' ? 2 : 1;
    }
    if (q.mark && !s.nationMarks.includes(q.mark)) s.nationMarks.push(q.mark);
    if (q.id==='iron-smith') s.inventory.ironhoe++;
    if (q.id==='bronze-grain' && !s.inventory.gear.includes('bronzeCharm')) s.inventory.gear.push('bronzeCharm');
    if (q.id==='dongye-start') s.inventory.dongyepackage++;
    if (q.id==='samhan-jinhan') s.inventory.samhansack++;
    s.completedQuests.push(q.id);
    s.progress[r.id] = (s.progress[r.id] || 0) + 1;
    if(r.id==='ancient')onAncientQuest(s,q);
    const coins = ["paleolithic", "prehistoric"].includes(r.id) ? 0 : q.coins;
    const levels = gain(s, q.xp, coins);
    rewards.push({ ...q, coins, levels });
    event = null;
    q = activeQuest(s, r);
  }
  if (!q && r.quests[s.progress[r.id]||0]?.available!==false && !s.completedRegions.includes(r.id)) {
    s.completedRegions.push(r.id);
    if (r.unlock && !s.unlockedRegions.includes(r.unlock))
      s.unlockedRegions.push(r.unlock);
  }
  return rewards;
}
function num(v, min, max) {
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
}
export function validate(raw) {
  if (!raw || ![1, 2, 3].includes(raw.saveVersion))
    throw Error("이 저장 파일은 열 수 없어.");
  let s = structuredClone(raw);
  if (
    s.saveVersion === 1 &&
    Array.isArray(s.unlockedRegions) &&
    Array.isArray(s.completedRegions) &&
    Array.isArray(s.artifacts) &&
    s.progress
  ) {
    s.unlockedRegions = [...new Set(["paleolithic", ...s.unlockedRegions])];
    s.completedRegions = [...new Set(["paleolithic", ...s.completedRegions])];
    s.progress.paleolithic = REGIONS[0].quests.length;
    if (!s.artifacts.includes("fire")) s.artifacts.push("fire");
    if (s.unlockedRegions.includes("gojoseon")) {
      s.unlockedRegions.push("bronze");
      s.completedRegions.push("bronze");
      s.progress.bronze = 4;
    } else if (s.completedRegions.includes("prehistoric"))
      s.unlockedRegions.push("bronze");
  }
  s.saveVersion = 3;
  // Original six quest indices are unchanged. Completed eras retain completion;
  // their technician offers the same recipe as optional catch-up content.
  s.fishingStoryRevision ??= 1;
  if(s.fishingStoryRevision!==1)throw Error('낚시 이야기 기록을 읽을 수 없다.');
  s.merchantIntro ??= false;
  // 이전 저장은 이미 인트로를 본 기록이므로 새 기본 튜토리얼을 강제로 다시 띄우지 않는다.
  s.basicTutorialDone ??= Boolean(s.introSeen);
  s.tutorials ??= {};
  s.monsters ??= {};
  s.encounter ??= { until: 0, distance: 0 };
  s.foodEffect ??= 0;
  s.resources ??= {};
  s.discoveredMaps ??= [];
  s.nationMarks ??= [];
  s.horseUnlocked ??= false;
  s.horseParked ??= false;
  s.mounted ??= false;
  s.horseField ??= null;
  if (typeof s.horseUnlocked !== 'boolean' || typeof s.horseParked !== 'boolean' || typeof s.mounted !== 'boolean' ||
      (s.horseField !== null && (!s.horseField || !['nation-buyeo-road','nation-goguryeo-road','nation-samhan-mahan'].includes(s.horseField.map) || typeof s.horseField.id !== 'string' || !num(s.horseField.until,0,1e15)))) throw Error('말 기록을 읽을 수 없다.');
  if (!s.horseUnlocked) { s.mounted = false; s.horseParked = false; }
  if (s.horseUnlocked) s.horseField = null;
  if (s.horseParked) s.mounted = false;
  if (!Array.isArray(s.discoveredMaps) || s.discoveredMaps.some(x=>typeof x!=='string' || !MAPS[x]) ||
      !Array.isArray(s.nationMarks) || s.nationMarks.some(x=>!['buyeo','goguryeo','okjeo','dongye','samhan'].includes(x)))
    throw Error('지역 기록을 읽을 수 없다.');
  if (
    typeof s.merchantIntro !== "boolean" ||
    typeof s.basicTutorialDone !== "boolean" ||
    !s.tutorials ||
    typeof s.tutorials !== "object" ||
    Array.isArray(s.tutorials) ||
    !s.monsters ||
    typeof s.monsters !== "object" ||
    Array.isArray(s.monsters) ||
    !s.encounter ||
    !num(s.encounter.until, 0, 1e15) ||
    !num(s.encounter.distance, 0, 100) ||
    !num(s.foodEffect, 0, 6) ||
    !s.resources || typeof s.resources !== "object" || Array.isArray(s.resources) ||
    Object.values(s.resources).some(v => !v || !num(v.nextAt, 0, 1e15) || !Number.isInteger(v.slot) || v.slot < 0 || v.slot > 20)
  )
    throw Error("탐험 기록을 읽을 수 없다.");
  for (const p of Object.values(s.monsters))
    if (
      !p ||
      !num(p.x, 1, 22) ||
      !num(p.y, 1, 16) ||
      typeof p.waiting !== "boolean"
    )
      throw Error("몬스터 기록을 읽을 수 없다.");
  if (s.foodEffect) {
    s.hp = Math.max(0, s.hp - s.foodEffect);
    s.foodEffect = 0;
  }
  s.energy ??= 20;
  s.audioMuted ??= false;
  s.appearance = validAppearance(s.appearance);
  s.personalCode ??= null;
  if (s.personalCode !== null && !/^HE(?:\d{4}|\d{6})$/.test(s.personalCode))
    throw Error("개인 코드가 올바르지 않다.");
  if (s.inventory) for (const id of STACK_IDS) s.inventory[id] ??= 0;
  if (s.completedRegions?.includes('gojoseon') && !s.unlockedRegions?.includes('nations'))
    s.unlockedRegions.push('nations');
  if (
    typeof s.nickname !== "string" ||
    !s.nickname.trim() ||
    s.nickname.length > 12 ||
    !["boy", "girl"].includes(s.avatar)
  )
    throw Error("캐릭터 정보가 올바르지 않아.");
  if (
    !num(s.level, 1, MAX_LEVEL) ||
    !Number.isInteger(s.level) ||
    !num(s.xp, 0, 10000) ||
    !num(s.coins, 0, 1e9)
  )
    throw Error("성장 정보가 올바르지 않아.");
  for (const k of [
    "artifacts",
    "completedQuests",
    "unlockedRegions",
    "completedRegions",
    "opened",
  ])
    if (!Array.isArray(s[k]) || s[k].some((v) => typeof v !== "string"))
      throw Error("저장 목록을 읽을 수 없어.");
  if (
    !s.unlockedRegions.includes("paleolithic") ||
    s.unlockedRegions.some((x) => !REGIONS.find((r) => r.id === x))
  )
    throw Error("아직 열리지 않은 시대가 있어.");
  if (
    !s.inventory ||
    !num(s.inventory.food, 0, 99999) ||
    !num(s.inventory.berries, 0, 99999) ||
    !Array.isArray(s.inventory.gear) ||
    s.inventory.gear.some((x) => !ITEMS[x])
  )
    throw Error("가방 정보가 올바르지 않아.");
  if (
    !s.equipment ||
    Object.entries(s.equipment).some(
      ([k, v]) =>
        !["weapon", "clothes", "accessory"].includes(k) ||
        (v !== null &&
          (!ITEMS[v] || ITEMS[v].kind !== k || !s.inventory.gear.includes(v))),
    )
  )
    throw Error("장비 정보가 올바르지 않아.");
  for (const k of ["progress", "requests", "cooldowns"])
    if (!s[k] || typeof s[k] !== "object" || Array.isArray(s[k]))
      throw Error("진행 정보가 올바르지 않아.");
  for (const r of REGIONS) {
    if (s.completedRegions.includes(r.id)) s.progress[r.id] = r.quests.length;
    if (
      !num(s.progress[r.id] || 0, 0, r.quests.length) ||
      !Number.isInteger(s.progress[r.id] || 0)
    )
      throw Error("임무 정보가 올바르지 않아.");
  }
  for (const [k, v] of Object.entries(s.requests))
    if (!v || !["active", "done"].includes(v.status) || !num(v.count, 0, 99999))
      throw Error("부탁 정보가 올바르지 않아.");
  for (const v of Object.values(s.cooldowns))
    if (!num(v, 0, 1e15)) throw Error("시간 정보가 올바르지 않아.");
  if (
    !num(s.energy, 0, 20) ||
    typeof s.audioMuted !== "boolean" ||
    STACK_IDS.some(
      (id) =>
        !num(s.inventory[id], 0, 99999) || !Number.isInteger(s.inventory[id]),
    )
  )
    throw Error("기력이나 음식 정보가 올바르지 않다.");
  if (!num(s.hp, 0, abilities(s).hp)) throw Error("체력 정보가 올바르지 않아.");
  validateAncient(s,ITEMS,MAPS);
  if (!s.ancient.home.owned || !s.ancient.country) s.horseParked = false;
  if (!MAPS[s.map] || !num(s.x, 1, 22) || !num(s.y, 1, 16)) {
    s.map = "hq";
    s.x = 11;
    s.y = 10;
  }
  const r = regionOf(s.map);
  if (!['nations','ancient'].includes(r?.id)||MAPS[s.map]?.theme==='room') s.mounted = false;
  if (r && !s.unlockedRegions.includes(r.id)) {
    s.map = "hq";
    s.x = 11;
    s.y = 10;
  }
  s.stats = s.stats && num(s.stats.wins, 0, 1e9) ? s.stats : { wins: 0 };
  return s;
}
export function writeSave(s) {
  s.updatedAt = Math.max(Date.now(), (s.updatedAt || 0) + 1);
  localStorage.setItem(KEY, JSON.stringify(s));
}
export function readSave() {
  const raw = localStorage.getItem(KEY);
  return raw ? validate(JSON.parse(raw)) : null;
}
export function writeAppearanceOnly(appearance) {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  const state = JSON.parse(raw);
  validate(state);
  state.appearance = validAppearance(appearance);
  state.updatedAt = Math.max(Date.now(), (state.updatedAt || 0) + 1);
  localStorage.setItem(KEY, JSON.stringify(state));
  return state;
}
