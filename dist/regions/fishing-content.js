import {entity,person} from './common.js';
import {FISHING_MATERIALS} from '../fishing.js?v=40';

// New content registers its QA stages alongside its quest data.
export const FISHING_QA = [
  {id:'start',name:'퀘스트 시작',quest:'pre-fishing-start',map:'pre-village',target:'neo-technician'},
  {id:'spindle',name:'가락바퀴 조사 직전',quest:'pre-fishing-rod',map:'pre-village',target:'spindle',removeArtifacts:['spindle']},
  {id:'thread',name:'실 획득 상태',quest:'pre-fishing-rod',map:'pre-forest',target:'fishing-branch',items:{fishingthread:1}},
  {id:'branch',name:'나뭇가지 획득 상태',quest:'pre-fishing-rod',map:'pre-forest',target:'pre-boar1',items:{fishingthread:1,fishingbranch:1}},
  {id:'bone',name:'멧돼지 뼈 획득 상태',quest:'pre-fishing-rod',map:'pre-forest',target:'pre-boar1',items:{fishingthread:1,fishingbranch:1,boarbone:1}},
  {id:'needle',name:'뼈바늘 제작 상태',quest:'pre-fishing-rod',map:'pre-village',target:'neo-technician',items:{boneneedle:1}},
  {id:'materials',name:'재료 3개 모두 보유',quest:'pre-fishing-rod',map:'pre-village',target:'neo-technician',items:{fishingthread:1,fishingbranch:1,boneneedle:1}},
  {id:'deliver',name:'기술자에게 전달 직전',quest:'pre-fishing-rod',map:'pre-village',target:'neo-technician',items:{fishingthread:1,fishingbranch:1,boneneedle:1}},
  {id:'rod',name:'낚싯대 획득 직후',quest:'pre-fishing-first',map:'pre-village',target:'neo-technician',items:{fishingrod:1}},
  {id:'first',name:'첫 낚시 직전',quest:'pre-fishing-first',map:'neo-river',target:'neo-fishing',items:{fishingrod:1}},
  {id:'near',name:'퀘스트 완료 직전',quest:'pre-fishing-first',map:'neo-river',target:'neo-fishing',items:{fishingrod:1}},
  {id:'complete',name:'완료 상태',quest:'pre-fishing-first',map:'neo-river',target:'neo-fishing',items:{fishingrod:1},complete:true},
];
export const FISHING_TEST_MODES = [
  {id:'tutorial',name:'튜토리얼 낚시',options:{tutorial:true}},
  {id:'easy',name:'쉬운 난이도',options:{tutorial:false,profile:'easy'}},
  {id:'normal',name:'보통 난이도',options:{tutorial:false,profile:'normal'}},
  {id:'hard',name:'어려운 난이도',options:{tutorial:false,profile:'hard'}},
  {id:'rare',name:'희귀 난이도',options:{tutorial:false,profile:'rare'}},
  {id:'long',name:'긴 입질 대기 · 60초',options:{tutorial:false,profile:'normal',waitMs:60000}},
  {id:'success-rest',name:'낚시 성공 후 쿨타임',rest:true},
  {id:'failure-rest',name:'낚시 실패 후 재도전',rest:false},
];
export const INTERACTION_QA = [{id:'fishing',name:'낚시 미니게임 테스트',map:'neo-river',target:'neo-fishing',items:{fishingrod:1},action:'fishing',modes:FISHING_TEST_MODES}];
export const FISHING_SITES = [
  {map:'neo-river',id:'neo-fishing',x:16.7,y:6.2,name:'강가 낚시 자리'},
  {map:'bronze-village',id:'bronze-fishing',x:19.4,y:6.6,name:'마을 외곽 물가',pond:{x:21,y:5.2,rx:1.5,ry:2}},
  {map:'go-field',id:'go-fishing',x:5,y:6.4,name:'들판 물가',pond:{x:4,y:4.5,rx:2,ry:1.4}},
  {map:'nation-iron-field',id:'iron-fishing',x:19.2,y:6.3,name:'들판 물가',pond:{x:21,y:5,rx:1.5,ry:2}},
  {map:'nation-okjeo-river',id:'okjeo-fishing',x:5.9,y:6.2,name:'강가 낚시 자리'},
  {map:'nation-samhan-mahan',id:'samhan-fishing',x:8,y:13.1,name:'개울 낚시 자리'},
];
export function addFishing(regions) {
  const neo=regions.find(r=>r.id==='prehistoric');
  const qa={name:'낚싯대 만들기와 첫 낚시',stages:FISHING_QA,items:FISHING_MATERIALS,resetTutorial:'fishing',resetMonsters:['pre-boar1']};
  neo.quests.push(
    {id:'pre-fishing-start',title:'기술자와 낚싯대 이야기를 하자.',detail:'안정적으로 먹을거리를 구할 새 도구를 만들어 보자.',map:'pre-village',target:'neo-technician',event:'talk:neo-technician',xp:0,coins:0,qa},
    {id:'pre-fishing-rod',title:'낚싯대를 만들 재료를 모으자.',detail:'가락바퀴로 실 만들기 → 숲에서 가지 줍기 → 멧돼지 뼈로 뼈바늘 만들기 → 기술자에게 돌아가기.',map:'pre-village',target:'neo-technician',event:'craft:fishingrod',xp:20,coins:0,qa},
    {id:'pre-fishing-first',title:'낚싯대로 첫 물고기를 잡자.',detail:'강가 낚시 자리에서 입질을 기다린 뒤 성공 구간에 맞춰 당겨 보자.',map:'neo-river',target:'neo-fishing',event:'fishing:catch',xp:25,coins:0,qa}
  );
  neo.maps.find(m=>m.id==='pre-village').entities.push(person('neo-technician',13.5,10.5,'마을 기술자',['강에서 물고기를 잡으면 먹을거리를 더 구할 수 있어.','게임에서는 실과 나뭇가지, 뼈바늘로 간단한 낚싯대를 만들 수 있어.'],'farmer'));
  neo.maps.find(m=>m.id==='pre-forest').entities.push(entity('fishing-branch','fishingBranch',7,10.7,'떨어진 나뭇가지',{art:'branchIcon'}));
  for(const site of FISHING_SITES) {
    const m=regions.flatMap(r=>r.maps).find(m=>m.id===site.map);
    if(!m)throw Error('Missing fishing map: '+site.map);
    m.entities.push(entity(site.id,'fishingSpot',site.x,site.y,site.name,{art:'fishingSpotIcon'}));
    if(site.pond)m.fishingPond=site.pond;
    m.obstacles=m.obstacles.filter(o=>o.x===0||o.y===0||o.x===m.w-1||o.y===m.h-1||Math.hypot(o.x-site.x,o.y-site.y)>1.8);
  }
  // Replace only the repeat Neolithic bank pickup. One-time food and Paleo fishing survive.
  neo.maps.find(m=>m.id==='neo-river').entities=neo.maps.find(m=>m.id==='neo-river').entities.filter(e=>e.id!=='river-fish');
}

export function prepareContentQA(s,r,stage) {
  const index=r.quests.findIndex(q=>q.id===stage.quest);
  if(index<0)throw Error('QA quest missing');
  const ids=new Set(r.quests.map(q=>q.id));
  s.completedQuests=s.completedQuests.filter(id=>!ids.has(id));
  s.completedQuests.push(...r.quests.slice(0,index+(stage.complete?1:0)).map(q=>q.id));
  s.progress[r.id]=index+(stage.complete?1:0);
  s.completedRegions=s.completedRegions.filter(id=>id!==r.id);
  if(stage.complete)s.completedRegions.push(r.id);
  const qa=r.quests[index].qa;
  for(const id of qa.items||[])s.inventory[id]=0;
  Object.assign(s.inventory,stage.items||{});
  for(const q of r.quests.slice(0,index))if(q.event.startsWith('artifact:')&&!s.artifacts.includes(q.event.slice(9)))s.artifacts.push(q.event.slice(9));
  s.artifacts=s.artifacts.filter(id=>!(stage.removeArtifacts||[]).includes(id));
  if(qa.resetTutorial)s.tutorials[qa.resetTutorial]=Boolean(stage.complete);
  if(qa.resetTutorial==='fishing')for(const key of Object.keys(s.cooldowns))if(key.startsWith('fishing:'))delete s.cooldowns[key];
  for(const id of qa.resetMonsters||[]){delete s.cooldowns[id];delete s.monsters[id];}
  return stage;
}
