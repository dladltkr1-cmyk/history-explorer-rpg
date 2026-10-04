import prehistoric from './prehistoric.js';import gojoseon from './gojoseon.js';import {map,person,entity} from './common.js';
import {paleolithic,bronze,expand} from './expansion.js';
import {addExploration} from './exploration.js?v=40.1';
import {growth} from './nations.js?v=37.1';
import {addFishing} from './fishing-content.js?v=40.1';
expand(prehistoric,gojoseon);
// Keep each era's story objects and optional activities in their own period.
const neoCave=prehistoric.maps.find(m=>m.id==='pre-cave');
neoCave.name='강가 바위 그늘';
const neoForest=prehistoric.maps.find(m=>m.id==='pre-forest');neoForest.entities.find(e=>e.id==='forest-cave').name='바위 그늘로';
neoForest.entities.find(e=>e.id==='pre-hunter').lines=['강가 바위 그늘은 북쪽에 있어.\n힘들면 마을 모닥불에서 쉬어 가.'];
neoCave.entities=neoCave.entities.filter(e=>e.artifact!=='bronze-tool');
const neoTrace=neoCave.entities.find(e=>e.id==='cave-trace');
Object.assign(neoTrace,{name:'강가의 바위 그늘',art:'rock',lines:['신석기 사람들은 강가에 움집을 짓고 살았다.\n이곳에서는 고기잡이와 사냥도 계속했다.']});
prehistoric.quests[4]={...prehistoric.quests[4],title:'강가의 바위 그늘을 살펴보자.',detail:'움집 밖에서도 이어진 생활을 알아보자.',target:'cave-trace',event:'inspect:cave-trace'};
prehistoric.quests[5]={id:'pre-return',title:'마을 어른에게 돌아가자.',detail:'찾은 도구 이야기를 들려드리자.',map:'pre-village',target:'pre-elder',event:'talk:pre-elder',xp:36,coins:0};
const eraDescriptions={
 'paleo-home':'나뭇가지와 가죽으로 만든 막집이다.',
 'cave-door':'구석기 사람들이 머물던 동굴이다.',
 'pre-hut1':'신석기 사람들이 땅을 파고 지붕을 덮어 만든 움집이다.',
 'bronze-house':'농업이 발달하며 만들어진 청동기 시대의 큰 집이다.',
 'go-hut1':'고조선 마을 사람들이 생활하던 집이다.'
};
for(const r of [paleolithic,prehistoric,bronze,gojoseon])for(const m of r.maps)for(const e of m.entities)if(eraDescriptions[e.id])e.description=eraDescriptions[e.id];
const village=gojoseon.maps.find(m=>m.id==='go-village'),field=gojoseon.maps.find(m=>m.id==='go-field'),hill=gojoseon.maps.find(m=>m.id==='go-dolmen');
const quizzes=village.entities.filter(e=>e.type==='quiz');village.entities=village.entities.filter(e=>e.type!=='quiz');
const [stoneQuiz,potQuiz,grainQuiz]=quizzes;Object.assign(stoneQuiz,{x:9,y:12});Object.assign(potQuiz,{x:19,y:5});Object.assign(grainQuiz,{x:7,y:9});
village.entities.push(stoneQuiz);field.entities.push(potQuiz);hill.entities.push(grainQuiz);
const council=hill.entities.find(e=>e.id==='go-council');if(council)council.art='storage';
gojoseon.requests.push({id:'go-hide',name:'가죽 모으기',npc:'hide-worker',kind:'item',item:'hide',need:3,xp:25,coins:55,text:'가죽 3개를 가져와 줘.\n마을에서 쓸 곳이 있어.'});gojoseon.maps[0].entities.push(person('hide-worker',12,13,'가죽 일꾼',['가죽을 모으고 있어.'],'farmer',{request:'go-hide'}));
addExploration(paleolithic,prehistoric,bronze,gojoseon);
gojoseon.unlock='nations';
export const REGIONS=[paleolithic,prehistoric,bronze,gojoseon,growth];
addFishing(REGIONS);
export const HUB=map('hq','탐험 본부','hq',[entity('era-gate','gate',12,5,'시대의 문',{art:'portal'}),person('hq-guide',9,8,'탐험 안내원',['시대의 문에서 탐험할 곳을 골라 봐.\n찾은 유물은 역사 도감에 남아.'],'researcher'),entity('shop','shop',17,9,'상점',{art:'shopkeeper'}),entity('archive','archive',6,9,'역사 도감',{art:'chest'}),entity('hq-rest','rest',12,12,'쉬어 가기',{art:'campfire'})]);
export const MAPS=Object.fromEntries([HUB,...REGIONS.flatMap(r=>r.maps)].map(m=>[m.id,m]));
export const ARTIFACTS=REGIONS.flatMap(r=>r.artifacts);
export const regionOf=mapId=>REGIONS.find(r=>r.maps.some(m=>m.id===mapId));
