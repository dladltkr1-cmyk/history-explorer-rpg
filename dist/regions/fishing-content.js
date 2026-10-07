import {entity,person,exit} from './common.js';
import {inFishingRiver,pathDistance} from '../waterside.js?v=44.2';
import {FISHING_MATERIALS} from '../fishing.js?v=44.2';
import {prepareAncientQA} from '../ancient-state.js?v=48';

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
export const INTERACTION_QA = [
  {id:'homestead',name:'내 거처 · 농사/성장/꾸미기 시험',map:'ancient-home-baekje',target:'life-board',action:'homestead'},
  {id:'camera-field',name:'카메라 · 넓은 들판',map:'nation-iron-field',target:null,action:'camera'},
  {id:'camera-village',name:'카메라 · 작은 마을',map:'nation-buyeo-village',target:null,action:'camera'},
  {id:'camera-path',name:'카메라 · 좁은 산길',map:'nation-goguryeo-road',target:null,action:'camera'},
  {id:'camera-room',name:'카메라 · 작은 실내 (10×8)',map:'room-buyeo-house-a',target:null,action:'camera'},
  {id:'ancient-horse',name:'내 거처 · 말 맡기기/데려오기 시험',map:'ancient-village-baekje',target:'ancient-horse-post',action:'ancient-horse'},
  {id:'ancient',name:'고대 국가 · 건국/나라/거처/세기/지도 시험',map:'ancient-origins',target:'ancient-guide',action:'ancient'},
  {id:'ancient-bank',name:'고대 국가 강가 · 기존 낚시 시험',map:'ancient-han',target:'ancient-fishing',items:{fishingrod:1},action:'ancient-fishing',modes:FISHING_TEST_MODES},
  {id:'fishing',name:'낚시 미니게임 테스트',map:'neo-river',target:'neo-fishing',items:{fishingrod:1},action:'fishing',modes:FISHING_TEST_MODES},
  {id:'bronze-bank',name:'청동기 외곽 강가 낚시',map:'bronze-outskirts',target:'bronze-fishing',items:{fishingrod:1},action:'fishing',modes:FISHING_TEST_MODES},
  {id:'go-bank',name:'고조선 외곽 강가 낚시',map:'go-outskirts',target:'go-fishing',items:{fishingrod:1},action:'fishing',modes:FISHING_TEST_MODES},
];
export const FISHING_SITES = [
  {map:'ancient-han',id:'ancient-fishing',x:20,y:7.5,name:'강가 낚시 자리',float:{x:21.8,y:7.5}},
  {map:'neo-river',id:'neo-fishing',x:16.7,y:6.2,name:'강가 낚시 자리'},
  {map:'bronze-outskirts',id:'bronze-fishing',x:20.0,y:7.3,name:'숲길 강가 낚시 자리',float:{x:21.8,y:7.3}},
  {map:'go-outskirts',id:'go-fishing',x:20.0,y:7.5,name:'외곽 강가 낚시 자리',float:{x:21.8,y:7.5}},
  {map:'nation-iron-field',id:'iron-fishing',x:19.2,y:6.3,name:'들판 물가',pond:{x:21,y:5,rx:1.5,ry:2}},
  {map:'nation-okjeo-river',id:'okjeo-fishing',x:5.9,y:6.2,name:'강가 낚시 자리'},
  {map:'nation-samhan-mahan',id:'samhan-fishing',x:8,y:13.1,name:'개울 낚시 자리'},
];
export function addFishing(regions) {
  const maps=regions.flatMap(r=>r.maps),get=id=>maps.find(m=>m.id===id);
  for(const [villageId,outsideId,doorId,backY]of [
    ['bronze-village','bronze-outskirts','bronze-bank-door',9],
    ['go-village','go-outskirts','go-bank-door',13],
  ]) {
    const village=get(villageId),outside=get(outsideId);
    village.entities.push(exit(doorId,21,14,'숲길 강가로',outsideId));
    outside.entities.push(exit(doorId+'-return',2,backY,'마을로',villageId));
    village.obstacles=village.obstacles.filter(o=>Math.hypot(o.x-21,o.y-14)>2.2);
    outside.fishingRiver={width:2.2,points:[[21.2,-2],[22,4],[21.8,7],[22.6,10],[26,11.5]],reeds:[[20.5,4],[20.5,9],[21.7,11]]};
    outside.bankPath=[[3,backY],[6,10],[11,9],[16,8.2],[20,7.4]];
    outside.obstacles=outside.obstacles.filter(o=>!inFishingRiver(outside,o.x,o.y,.7)&&
      (o.x===0||o.y===0||o.x===outside.w-1||o.y===outside.h-1||pathDistance(outside.bankPath,o.x,o.y)>1.1));
  }
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
    m.entities.push(entity(site.id,'fishingSpot',site.x,site.y,site.name,{art:'fishingSpotIcon',...(site.float?{float:site.float}:{})}));
    if(site.pond)m.fishingPond=site.pond;
    m.obstacles=m.obstacles.filter(o=>o.x===0||o.y===0||o.x===m.w-1||o.y===m.h-1||Math.hypot(o.x-site.x,o.y-site.y)>1.8);
  }
  // Replace only the repeat Neolithic bank pickup. One-time food and Paleo fishing survive.
  neo.maps.find(m=>m.id==='neo-river').entities=neo.maps.find(m=>m.id==='neo-river').entities.filter(e=>e.id!=='river-fish');
}

export function prepareContentQA(s,r,stage) {
  if(r.id==='ancient')return prepareAncientQA(s,stage);
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
