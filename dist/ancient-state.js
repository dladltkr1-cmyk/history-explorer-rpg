import {ANCIENT_COUNTRIES,ANCIENT_CHAPTERS,ANCIENT_MAPS,ANCIENT_QUESTS,ANCIENT_QA,ancientQuest} from './regions/ancient.js?v=44';

export const ANCIENT_EXHIBITS={}; // Register sourced culture records here with their content update.
export const ANCIENT_EXTENSIONS=['field','workbench','storage','culture','horse'];
export function freshAncient(){return {revision:1,country:null,century:null,chapter:'origins',quest:'ancient-opening',records:[],carry:[],completedChapters:[],maps:{4:[],5:[],6:[]},home:{owned:false,storage:{},exhibits:[],extensions:[]}};}
export function syncAncient(s) {
  s.ancient??=freshAncient();const a=s.ancient,p=s.progress.ancient||0;
  a.records=ANCIENT_QUESTS.slice(0,p).map(q=>q.record).filter(Boolean);
  a.quest=ANCIENT_QUESTS[p]?.id||null;
  if(p>=16&&!a.completedChapters.includes('origins'))a.completedChapters.push('origins');
  if(p>=18)a.home.owned=true;
  if(p>=20){a.century??=4;a.chapter=a.century+'c';if(!a.completedChapters.includes('settlement'))a.completedChapters.push('settlement');}
  else {a.century=null;a.chapter=p>=16?'settlement':'origins';}
}
const plain=o=>o&&typeof o==='object'&&!Array.isArray(o);
const list=(a,allowed)=>Array.isArray(a)&&a.length<=200&&a.every(v=>typeof v==='string'&&allowed.includes(v))&&new Set(a).size===a.length;
export function validateAncient(s,items,maps) {
  const raw=s.ancient;
  if(raw===undefined||raw===null)s.ancient=freshAncient();
  else {
    if(!plain(raw)||raw.revision!==1)throw Error('고대 국가 기록을 읽을 수 없다.');
    const a={...freshAncient(),...raw,home:{...freshAncient().home,...raw.home},maps:{...freshAncient().maps,...raw.maps}};
    if((a.country!==null&&!Object.hasOwn(ANCIENT_COUNTRIES,a.country))||!([null,4,5,6].includes(a.century))||!ANCIENT_CHAPTERS.some(c=>c.id===a.chapter)||
      !list(a.records,['goguryeo','baekje','silla','gaya'])||!list(a.carry,['trail','branch','cord'])||!list(a.completedChapters,ANCIENT_CHAPTERS.map(c=>c.id))||!plain(a.home)||typeof a.home.owned!=='boolean'||!plain(a.home.storage)||
      !list(a.home.exhibits,Object.keys(ANCIENT_EXHIBITS))||!list(a.home.extensions,ANCIENT_EXTENSIONS)||!plain(a.maps))throw Error('고대 국가의 거처나 진행 기록이 올바르지 않다.');
    for(const [id,n]of Object.entries(a.home.storage))if(!Object.hasOwn(items,id)||!['food','material'].includes(items[id].kind)||items[id].questOnly||items[id].sellable===false||!Number.isInteger(n)||n<0||n>99999)throw Error('거처 보관 기록이 올바르지 않다.');
    for(const century of [4,5,6])if(!list(a.maps[century],Object.keys(maps).filter(id=>id.startsWith('ancient-'))))throw Error('고대 국가 지도 기록이 올바르지 않다.');
    s.ancient=a;
  }
  const p=s.progress.ancient||0;
  if(p>=17&&!s.ancient.country)throw Error('머무는 나라 기록이 없다.');
  if(p<16&&s.ancient.country)throw Error('건국 이야기를 먼저 완료해야 한다.');
  syncAncient(s);
  // Existing saves unlock era 6 only after era 5 is complete.
  const unlocked=s.completedRegions.includes('nations');
  s.unlockedRegions=s.unlockedRegions.filter(id=>id!=='ancient');
  if(unlocked)s.unlockedRegions.push('ancient');
  if(s.map.startsWith('ancient-')&&(!unlocked||!ancientCanRestore(s,maps[s.map]))) {s.map='hq';s.x=11;s.y=10;s.mounted=false;}
}
function ancientCanRestore(s,m){const a=s.ancient;return m&&(s.progress.ancient||0)>=(m.entryAt||0)&&(!m.country||m.country===a.country)&&(m.theme!=='room'||a.home.owned);}
export function ancientEventAllowed(s,q,event) {
  if(!q||q.available===false)return false;
  const a=s.ancient;
  if(q.id==='ancient-country')return Boolean(a.country)&&a.records.length===4;
  if(q.id==='ancient-home')return a.home.owned;
  if(q.id==='ancient-y-gather'||q.id==='ancient-y-king')return ['branch','cord'].every(id=>a.carry.includes(id));
  if(q.id==='ancient-b-king')return a.carry.includes('trail');
  if(q.event.startsWith('quiz:'))return s.completedQuests.includes(q.event);
  return event===q.event;
}
export function onAncientQuest(s,q) {
  if(q.id==='ancient-b-trail'&&!s.ancient.carry.includes('trail'))s.ancient.carry.push('trail');
  if(q.id==='ancient-b-king')s.ancient.carry=s.ancient.carry.filter(x=>x!=='trail');
  if(q.id==='ancient-y-place')s.ancient.carry=s.ancient.carry.filter(x=>!['branch','cord'].includes(x));
  if(q.id==='ancient-helper')s.ancient.home.owned=true;
  syncAncient(s);
}
export function chooseAncientCountry(s,id,{admin=false}={}) {
  if(!Object.hasOwn(ANCIENT_COUNTRIES,id)||(!admin&&((s.progress.ancient||0)!==16||s.ancient.country)))return false;
  s.ancient.country=id;return true;
}
export function setAncientCentury(s,century,{admin=false}={}) {
  if(!ANCIENT_MAPS[century]||!s.ancient.country||!s.ancient.home.owned)return false;
  if(!admin&&century!==4)return false;
  if(!admin&&(s.progress.ancient||0)<19)return false;
  s.ancient.century=century;s.ancient.chapter=century+'c';return true;
}
// Later chapters plug in real quest sets before using this transition.
export function completeAncientChapter(s,id) {
  const c=ANCIENT_CHAPTERS.find(v=>v.id===id);
  if(!c?.ready||!c.quests?.length||!c.quests.every(q=>s.completedQuests.includes(q)))return false;
  if(!s.ancient.completedChapters.includes(id))s.ancient.completedChapters.push(id);
  const next=ANCIENT_CHAPTERS.find(v=>v.id===c.next);
  if(next?.century){s.ancient.century=next.century;s.ancient.chapter=next.id;}
  return true;
}
export function transferAncientStorage(s,items,id,count,toStorage) {
  const item=items[id],home=s.ancient?.home,c=ANCIENT_COUNTRIES[s.ancient?.country];
  if(!home?.owned||s.map!==c?.home||!item||!['food','material'].includes(item.kind)||item.questOnly||item.sellable===false||!Number.isInteger(count)||count<1||count>10)return false;
  const from=toStorage?s.inventory:home.storage,to=toStorage?home.storage:s.inventory;
  if((from[id]||0)<count||(to[id]||0)+count>99999)return false;
  from[id]-=count;to[id]=(to[id]||0)+count;return true;
}
export function noteAncientVisit(s,id){if(s.ancient.century&&id.startsWith('ancient-')&&!s.ancient.maps[s.ancient.century].includes(id))s.ancient.maps[s.ancient.century].push(id);}
export function prepareAncientQA(s,stage,{country=s.ancient?.country||'baekje'}={}) {
  if(!Object.hasOwn(ANCIENT_COUNTRIES,country))country='baekje';
  const fixture=typeof stage==='string'?ANCIENT_QA.find(v=>v.id===stage):stage;
  if(!fixture)return null;
  const savedHome=structuredClone(s.ancient?.home||freshAncient().home);
  s.ancient=freshAncient();s.ancient.home=savedHome;s.ancient.home.owned=false;
  s.progress.ancient=fixture.index;
  // The isolated trial must also survive the normal save validator/cloud round trip.
  if(!s.completedRegions.includes('nations'))s.completedRegions.push('nations');
  s.completedRegions=s.completedRegions.filter(id=>id!=='ancient');
  s.completedQuests=s.completedQuests.filter(id=>!id.startsWith('ancient-')&&!id.startsWith('quiz:ancient-'));
  for(const q of ANCIENT_QUESTS.slice(0,fixture.index)){s.completedQuests.push(q.id);if(q.event.startsWith('quiz:'))s.completedQuests.push(q.event);}
  if(fixture.index>=17)s.ancient.country=country;
  if(fixture.index===6)s.ancient.carry.push('trail');
  if(fixture.index===11)s.ancient.carry.push('branch','cord');
  for(const key of Object.keys(s.cooldowns))if(key.startsWith('quiz:ancient-'))delete s.cooldowns[key];
  syncAncient(s);
  const q=ancientQuest(ANCIENT_QUESTS[fixture.index],s);
  return {...fixture,map:q.map,target:q.target};
}
