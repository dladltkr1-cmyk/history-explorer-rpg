import {map,entity,person,exit,foe} from './common.js';

export const ANCIENT_COUNTRIES={
  goguryeo:{name:'고구려',village:'ancient-village-goguryeo',home:'ancient-home-goguryeo',art:'ancientHomeNorth',helperArt:'ancientHelperNorth',color:'#657f82',ground:'#8c9c7e',welcome:'산길을 지나 이곳에 왔구나. 작은 집을 준비해 두었어.'},
  baekje:{name:'백제',village:'ancient-village-baekje',home:'ancient-home-baekje',art:'ancientHomeRiver',helperArt:'ancientHelperRiver',color:'#a87558',ground:'#b6b18a',welcome:'강으로 이어지는 길이 가까워. 이 작은 집에서 쉬어 가렴.'},
  silla:{name:'신라',village:'ancient-village-silla',home:'ancient-home-silla',art:'ancientHomePlain',helperArt:'ancientHelperPlain',color:'#907d47',ground:'#b4b38c',welcome:'마을의 작은 집을 준비했어. 마당과 보관 자리를 둘러보렴.'},
};
export const ANCIENT_CHAPTERS=[
  {id:'origins',name:'0장 · 나라가 세워지다',ready:true,quests:[],next:'settlement'},
  {id:'settlement',name:'정착 · 내 거처',ready:true,quests:[],next:'4c'},
  {id:'4c',name:'1장 · 4세기',century:4,theme:'백제의 성장과 전성기',ready:false,next:'5c',questSlots:['한강 유역','근초고왕','영토 확대와 평양성 공격','해상 교역'],finalQuizCount:2},
  {id:'5c',name:'2장 · 5세기',century:5,theme:'고구려의 성장과 전성기',ready:false,next:'6c',questSlots:['광개토대왕','만주 지역으로 성장','신라를 도와 왜 격퇴','장수왕과 평양 천도','남진과 한강 유역'],finalQuizCount:2},
  {id:'6c',name:'3장 · 6세기',century:6,theme:'신라의 성장과 전성기',ready:false,next:'gaya',questSlots:['국가 정비','진흥왕','한강 유역','가야 지역의 변화'],finalQuizCount:2},
  ...[['gaya','가야와 철'],['life','고대 사람들의 생활'],['culture','삼국·가야의 문화'],['exchange','주변 나라와의 교류'],['7c','7세기 삼국의 큰 변화'],['unification','신라의 통일 과정'],['later','통일신라와 발해']].map(([id,name])=>({id,name,ready:false,questSlots:[],finalQuizCount:2})),
];
// A century view shows a representative later phase, never one border for 100 years.
export const ANCIENT_MAPS={
  4:{image:'/assets/ancient/map-baekje-original.jpg',originalName:'역사 백지도_삼국 시대(백제 전성기).jpg',title:'4세기 지도',phase:'4세기 후반 · 백제의 성장',han:'baekje',hanLabel:'백제 중심의 한강 유역',caption:'한강을 중심으로 백제가 성장하고 바닷길로 교류했다.'},
  5:{image:'/assets/ancient/map-goguryeo-original.jpg',originalName:'역사 백지도_삼국 시대(고구려 전성기).jpg',title:'5세기 지도',phase:'5세기 후반 · 고구려의 남진',han:'goguryeo',hanLabel:'고구려가 확보한 한강 유역',caption:'장수왕은 평양으로 도읍을 옮겼다. 475년 한성을 차지하며 남쪽으로 나아갔다.'},
  6:{image:'/assets/ancient/map-silla-original.jpg',originalName:'역사 백지도_삼국 시대(신라 전성기).jpg',title:'6세기 지도',phase:'6세기 후반 · 신라의 성장',han:'silla',hanLabel:'신라가 확보한 한강 유역',caption:'백제와 신라가 한강 유역을 되찾은 뒤, 553년 신라가 한강 하류를 차지했다.'},
};
// Extension contracts only. No future minigame is exposed as playable in phase 1.
export const ANCIENT_ACTIVITIES={
  murals:{chapter:'culture',implemented:false},incense:{chapter:'culture',implemented:false},
  pottery:{chapter:'culture',implemented:false},exchange:{chapter:'exchange',implemented:false},
  runner:{chapter:'7c',implemented:false,event:null},
};
export const ANCIENT_KINGS={
  jumong:{name:'주몽',art:'kingJumong',story:'건국 이야기',available:true},onjo:{name:'온조',art:'kingOnjo',story:'건국 이야기',available:true},
  hyeokgeose:{name:'박혁거세',art:'kingHyeokgeose',story:'건국 이야기',available:true},suro:{name:'김수로',art:'kingSuro',story:'건국 이야기',available:true},
  geunchogo:{name:'근초고왕',art:null,chapter:'4c',available:false},gwanggaeto:{name:'광개토대왕',art:null,chapter:'5c',available:false},jangsu:{name:'장수왕',art:null,chapter:'5c',available:false},jinheung:{name:'진흥왕',art:null,chapter:'6c',available:false},
};
export const ANCIENT_QUIZZES={
  'ancient-founders':{question:'앞에서 살펴본 건국 인물과 지역을 바르게 짝지은 것은?',options:['주몽 — 경주','온조 — 한강 유역','박혁거세 — 졸본'],answer:1,storyEvent:'quiz:ancient-founders',xp:0,coins:0},
  'ancient-meaning':{question:'고구려·신라·가야의 건국 이야기에 알이나 하늘의 도움이 등장하는 까닭은?',options:['당시 모든 사람이 알에서 태어났기 때문에','왕을 특별하고 신성하게 나타내 나라의 시작을 설명하려고','그때에는 글을 쓸 수 없었기 때문에'],answer:1,storyEvent:'quiz:ancient-meaning',xp:0,coins:0},
};
const q=(id,title,map,target,event,extra={})=>({id,title,detail:'표시된 곳으로 이동해 조사해 보자.',map,target,event,xp:12,coins:0,...extra});
export const ANCIENT_QUESTS=[
  q('ancient-opening','네 나라의 시작을 만나 보자.','ancient-origins','ancient-guide','ancient:opening'),
  q('ancient-g-trace','북쪽 숲길의 흔적을 조사하자.','ancient-origin-north','ancient-g-trace','ancient:g-trace'),
  q('ancient-g-king','이야기 속 인물을 만나자.','ancient-origin-north','king-jumong','ancient:g-king'),
  q('ancient-g-place','산 아래의 터를 확인하자.','ancient-origin-north','ancient-g-place','ancient:g-place',{record:'goguryeo'}),
  q('ancient-b-trail','남쪽으로 향한 일행의 길을 따라가자.','ancient-origin-river','ancient-b-trail','ancient:b-trail'),
  q('ancient-b-water','강가에서 새 터를 살펴보자.','ancient-origin-river','ancient-b-water','ancient:b-water'),
  q('ancient-b-king','일행에게 길 표식을 전하자.','ancient-origin-river','king-onjo','ancient:b-king',{record:'baekje'}),
  q('ancient-s-trace','동쪽 들판의 특별한 흔적을 찾아보자.','ancient-origin-east','ancient-s-trace','ancient:s-trace'),
  q('ancient-s-king','이야기 속 인물을 만나자.','ancient-origin-east','king-hyeokgeose','ancient:s-king'),
  q('ancient-s-place','새 나라의 터를 기록하자.','ancient-origin-east','ancient-s-place','ancient:s-place',{record:'silla'}),
  q('ancient-y-gather','모임 자리에 필요한 두 물건을 모으자.','ancient-origin-south','ancient-y-branch','ancient:y-gather',{detail:'가지 묶음과 끈을 찾아 모임 자리를 준비하자. 게임 속 활동이다.'}),
  q('ancient-y-king','모임 자리의 인물에게 물건을 전하자.','ancient-origin-south','king-suro','ancient:y-king'),
  q('ancient-y-place','남쪽의 건국 이야기를 기록하자.','ancient-origin-south','ancient-y-place','ancient:y-place',{record:'gaya'}),
  q('ancient-records','기록 마당에 네 이야기를 전달하자.','ancient-origins','ancient-records','ancient:records'),
  q('ancient-quiz-founders','첫 번째 확인 문제를 풀자.','ancient-origins','ancient-check1','quiz:ancient-founders',{detail:'배운 내용을 떠올려 인물과 지역을 연결해 보자.'}),
  q('ancient-quiz-meaning','두 번째 확인 문제를 풀자.','ancient-origins','ancient-check2','quiz:ancient-meaning',{detail:'이야기 속 특별한 요소가 어떤 뜻인지 생각해 보자.'}),
  q('ancient-country','어느 나라에 머물지 골라 보자.','ancient-origins','ancient-choice','ancient:country',{detail:'고구려·백제·신라 중 하나를 고르자. 능력치는 모두 같다.'}),
  q('ancient-helper','마을의 도우미를 만나자.','ancient-village-baekje','ancient-helper','ancient:helper',{location:'village'}),
  q('ancient-home','내 거처에 들어가 보자.','ancient-village-baekje','ancient-own-home','ancient:home',{location:'village'}),
  q('ancient-4c-start','내 거처의 이야기 책상을 살펴보자.','ancient-home-baekje','ancient-chapters','ancient:4c-start',{location:'home'}),
  q('ancient-4c-map','4세기 지도를 확인하자.','ancient-home-baekje','ancient-chapters','ancient:4c-map',{location:'home',detail:'지도 버튼으로 백제의 성장을 확인하자.'}),
  q('ancient-4c-next','4세기의 다음 이야기를 기다리자.','ancient-home-baekje','ancient-chapters','ancient:4c-full',{location:'home',available:false,xp:0,detail:'근초고왕의 본격 이야기는 다음 업데이트에서 이어진다. 지금은 거처와 강가를 둘러볼 수 있다.'}),
];
export const ANCIENT_QA=[
  ['opening','고대 국가 시작',0],['jumong','주몽 바로 만나기',2],['onjo','온조 바로 만나기',6],['hyeokgeose','박혁거세 바로 만나기',8],['suro','김수로 바로 만나기',11],['goguryeo','고구려 건국 이야기',1],['baekje','백제 건국 이야기',4],['silla','신라 건국 이야기',7],['gaya','가야 건국 이야기',10],['quiz','건국편 퀴즈 직전',14],['choice','나라 선택 직전',16],['chosen','나라 선택 완료',17],['helper','내 거처 안내 직전',17],['home','내 거처 획득',18],['4c','4세기 시작',19],
].map(([id,name,index])=>({id,name,index,quest:ANCIENT_QUESTS[index].id,map:ANCIENT_QUESTS[index].map,target:ANCIENT_QUESTS[index].target}));
const qa={name:'고대 국가 건국과 정착',stages:ANCIENT_QA,items:[]};
for(const [index,quest]of ANCIENT_QUESTS.entries())quest.qa={...qa,stages:[{id:'current',name:'선택 퀘스트 직전',index,quest:quest.id,map:quest.map,target:quest.target},...ANCIENT_QA]};
ANCIENT_CHAPTERS[0].quests=ANCIENT_QUESTS.slice(0,16).map(v=>v.id);
ANCIENT_CHAPTERS[1].quests=ANCIENT_QUESTS.slice(16,20).map(v=>v.id);

function place(id,name,theme,entities,extra={}) {
  const m=map(id,name,theme,entities,{ancient:true,danger:'safe',...extra});
  m.obstacles=m.obstacles.filter(o=>o.x===0||o.x===23||o.y===0||o.y===17);
  for(const [x,y]of extra.trees||[[3,4],[4,13],[19,4],[20,13],[15,3]])if(!entities.some(e=>Math.hypot(e.x-x,e.y-y)<2))m.obstacles.push({x,y,art:theme==='ancient-north'?'pine':'tree'});
  return m;
}
const story=(id,x,y,name,art,lines,extra={})=>entity(id,'ancientStory',x,y,name,{art,lines,actor:art.startsWith('ancientHelper'),...extra});
const king=(id,x,y,key,lines)=>entity(id,'ancientStory',x,y,ANCIENT_KINGS[key].name,{art:ANCIENT_KINGS[key].art,lines,king:key,legend:true,actor:true});
export const ANCIENT_HAN_TERRAIN={historicalRegion:'han',fishingRiver:{width:2.2,points:[[21.2,-2],[22,4],[21.8,7],[22.6,10],[26,11.5]],reeds:[[20.5,4],[20.5,9],[21.7,11]]},bankPath:[[3,9],[8,9],[13,9],[16,8.2],[20,7.4]]};
const maps=[
  place('ancient-origins','기록 마당','ancient-plain',[
    story('ancient-guide',10,7,'이야기 안내원','ancientHelperPlain',['네 나라의 시작을 만나 보자.','옛사람들이 전한 건국 이야기 속으로 들어간다.','실제 생활과 이야기 속 신비한 장면은 구분해서 보자.']),
    story('ancient-records',6,5,'기록 받는 사람','ancientHelperRiver',['네 이야기의 기록을 잘 받았어.','마당 건너편에서 배운 내용을 떠올려 보자.']),
    entity('ancient-check1','quiz',15,5,'이야기 살핌이',{art:'ancientHelperNorth',quiz:'ancient-founders'}),
    entity('ancient-check2','quiz',18,12,'생각 나눔이',{art:'ancientHelperPlain',quiz:'ancient-meaning'}),
    story('ancient-choice',10,12,'머무를 곳 안내','ancientHelperRiver',[]),
    exit('ancient-north-door',12,2,'북쪽 숲길','ancient-origin-north'),exit('ancient-origin-home',11,15,'탐험 본부','hq'),
  ],{entryAt:0}),
  place('ancient-origin-north','북쪽 숲길 · 건국 이야기','ancient-north',[
    exit('ancient-north-back',12,15,'기록 마당','ancient-origins'),
    story('ancient-g-trace',6,8,'새들이 감싼 흔적','ancientEgg',['[건국 이야기] 새가 알을 지켰다는 이야기가 전해진다.','흔적을 살펴보고 기록해 보자.']),
    king('king-jumong',11,6,'jumong',['옛사람들은 주몽이 알에서 태어나 활을 잘 쏘았다는 이야기를 전했어.','주몽은 졸본에 고구려를 세운 인물로 알려져 있어.','동물과 하늘의 도움을 이야기하며 왕을 특별하고 신성하게 나타내 나라의 시작을 설명했지.']),
    story('ancient-g-place',17,11,'산 아래의 터','ancientMarker',['이곳은 이야기 속 졸본의 터다.','주몽과 졸본을 함께 기록했다.']),
    exit('ancient-river-door',21,9,'남쪽으로 이어진 길','ancient-origin-river'),
    entity('ancient-n-rock','scenery',16,4,'산기슭 바위',{art:'rock',solid:true}),
  ],{entryAt:1,ground:'#8a9c81'}),
  place('ancient-origin-river','큰 강의 길 · 건국 이야기','ancient-river',[
    exit('ancient-river-back',2,9,'북쪽 숲길','ancient-origin-north'),
    story('ancient-b-trail',6,10,'일행의 길 표식','ancientMarker',['온조 일행이 고구려에서 남쪽으로 내려왔다는 이야기가 전해진다.','길 표식을 챙겨 강가에서 새 터를 찾아보자.']),
    story('ancient-b-water',19,7,'새 터를 보는 자리','ancientMarker',['넓은 강과 이어진 길이 보인다.','온조가 백제를 세운 한강 유역을 살펴보았다.']),
    king('king-onjo',12,12,'onjo',['새 터를 살폈구나. 길 표식을 전해 줘서 고맙다.','온조가 고구려에서 내려와 한강 유역에 백제를 세웠다는 이야기가 전해져.']),
    exit('ancient-east-door',12,15,'동쪽 들판','ancient-origin-east'),
  ],{...ANCIENT_HAN_TERRAIN,entryAt:4}),
  place('ancient-origin-east','동쪽 들판 · 건국 이야기','ancient-plain',[
    exit('ancient-east-back',12,2,'큰 강의 길','ancient-origin-river'),
    story('ancient-s-trace',7,7,'우물 곁의 흔적','ancientEgg',['[건국 이야기] 옛사람들은 특별한 알이 나타났다는 이야기를 전했어.','이 장면은 확인된 출생 사실이 아니라 건국 이야기다.']),
    king('king-hyeokgeose',13,5,'hyeokgeose',['옛사람들은 박혁거세가 알에서 태어났다는 이야기를 전했어.','박혁거세는 경주 지역에 신라를 세운 인물로 알려져 있어.']),
    story('ancient-s-place',17,11,'들판의 터','ancientMarker',['이야기 속 경주 지역의 터다.','박혁거세와 경주를 함께 기록했다.']),
    exit('ancient-south-door',21,9,'남쪽 모임 자리','ancient-origin-south'),
    entity('ancient-well','scenery',6,5,'우물',{art:'ancientWell',solid:true}),
  ],{entryAt:7}),
  place('ancient-origin-south','남쪽 모임 자리 · 건국 이야기','ancient-plain',[
    exit('ancient-south-back',2,9,'동쪽 들판','ancient-origin-east'),
    story('ancient-y-branch',7,6,'가지 묶음','branchIcon',['모임 자리를 준비할 가지 묶음이다.'],{gather:'branch'}),
    story('ancient-y-cord',17,12,'끈 묶음','threadIcon',['모임 자리에 쓸 끈이다.'],{gather:'cord'}),
    king('king-suro',12,8,'suro',['물건을 가져왔구나. 이야기를 들어 보렴.','옛사람들은 하늘에서 내려온 알에서 김수로가 태어났다고 전했어.','김수로는 금관가야를 세운 인물로, 가야를 대표하는 왕이야. 가야에는 여러 나라가 있었어.']),
    story('ancient-y-place',17,5,'모임의 기록','ancientEgg',['알과 하늘이 등장하는 건국 이야기를 살펴보았다.','김수로와 가야의 기록을 챙겼다.']),
    exit('ancient-courtyard-return',12,15,'기록 마당으로','ancient-origins'),
    person('ancient-gatherer',5,12,'모인 사람',['김수로의 건국 이야기를 들으러 왔어.'],'ancientHelperPlain'),
  ],{entryAt:10}),
];
for(const [id,c]of Object.entries(ANCIENT_COUNTRIES)) {
  maps.push(place(c.village,c.name+'의 거점 마을','ancient-'+(id==='goguryeo'?'north':id==='baekje'?'river':'plain'),[
    story('ancient-helper',10,8,'마을 도우미',c.helperArt,[c.welcome,'집의 보관 공간과 화로, 이야기 책상을 써 보렴.']),
    entity('ancient-own-home','ancientHome',6,7,'내 거처',{art:c.art,solid:true,to:c.home}),
    entity('ancient-horse-post','horseStable',7.8,9.8,'말 쉼터',{art:'ancientHorsePost'}),
    entity('ancient-village-house','scenery',17,5,'이웃의 집',{art:'ancientVillageHouse',solid:true}),
    entity('ancient-fire-'+id,'rest',14,11,'마을 화로',{art:'campfire'}),
    entity('ancient-shop-'+id,'shop',17,12,'물건 교환',{art:id==='goguryeo'?'elder':'farmer'}),
    exit('ancient-han-door-'+id,21,9,'강가로','ancient-han'),exit('ancient-hq-'+id,11,15,'탐험 본부','hq'),
  ],{entryAt:17,country:id,ground:c.ground,trees:id==='goguryeo'?[[3,3],[3,12],[18,3],[19,14],[15,3]]:[[3,3],[3,13],[20,3],[20,14]]}));
  const room=place(c.home,'내 거처 · '+c.name,'room',[
    exit('ancient-home-exit',11,15,'마당으로',c.village),
    entity('ancient-storage','ancientStorage',6,6,'보관 공간',{art:'roomShelf'}),
    entity('ancient-home-fire','rest',17,10,'거처의 화로',{art:'campfire'}),
    story('ancient-chapters',12,5,'이야기 책상','ancientDesk',[]),
    entity('ancient-display','ancientDisplay',18,5,'전시 공간',{art:'ancientDisplay'}),
    entity('ancient-bed','roomProp',5,11,'잠자리',{art:'roomBed'}),
    entity('ancient-jars','roomProp',18,13,'생활 항아리',{art:'roomJar'}),
  ],{country:id,entryAt:18,roomPalette:{border:'#574c3e',floor:id==='goguryeo'?['#b29b7c','#b8a486','#af987a']:id==='baekje'?['#c7b18c','#cfbb96','#bda780']:['#bfa984','#c7b38e','#b9a47c']}});
  room.obstacles=room.obstacles.filter(o=>o.x===0||o.x===23||o.y===0||o.y===17).map(o=>({...o,art:'rock'}));
  room.returnTo={map:c.village,x:6,y:8.5};maps.push(room);
}
maps.push(place('ancient-han','한강 유역의 강가','ancient-river',[
  Object.assign(exit('ancient-han-return',2,9,'내 마을로','ancient-village-baekje'),{countryReturn:true}),
  story('ancient-han-sign',8,6,'강가의 표식','ancientMarker',[],{centuryState:'sign'}),
  person('ancient-han-resident',13,9,'강가 사람',[],'ancientHelperRiver',{centuryState:'resident'}),
  entity('ancient-han-shed','scenery',16,4,'강가 보관채',{art:'ancientShed',solid:true,centuryState:'building'}),
  entity('ancient-han-fire','rest',10,12,'강가의 화로',{art:'campfire'}),
  entity('ancient-han-berries','berry',6,13,'열매',{art:'berries'}),
  foe('ancient-han-boar',16,13,'boar'),
],{...ANCIENT_HAN_TERRAIN,entryAt:20}));
export const ancient={id:'ancient',name:'고대 국가',subtitle:'나라를 선택하고 거처에서 이어지는 이야기',start:'ancient-origins',village:'ancient-origins',unlock:null,quests:ANCIENT_QUESTS,maps,artifacts:[],requests:[],shop:['ironSword','ironArmor','ironCharm','food','berries','cookedfish','rice']};
export function ancientWorld(base,s) {
  if(!base?.ancient)return base;
  const a=s.ancient,c=ANCIENT_COUNTRIES[a?.country],era=ANCIENT_MAPS[a?.century||4];
  if(base.id===c?.village && a.home.owned && s.horseUnlocked && s.horseParked) return {...base,entities:[...base.entities,{id:'ancient-my-horse',type:'parkedHorse',x:7.8,y:9.5,name:'내 말',art:'horseLeftIdle'}]};
  if(base.id!=='ancient-han')return base;
  return {...base,name:'한강 유역 · '+(a?.century||4)+'세기',entities:base.entities.map(e=>{
    if(e.countryReturn)return {...e,to:c?.village||'ancient-origins'};
    if(e.centuryState==='sign')return {...e,lines:[era.hanLabel,era.caption],banner:era.han};
    if(e.centuryState==='resident')return {...e,art:ANCIENT_COUNTRIES[era.han].helperArt,lines:[era.caption,'세기마다 이 강가의 모습과 이야기가 달라진다.']};
    if(e.centuryState==='building')return {...e,art:'ancientShed',banner:era.han};
    return e;
  })};
}
export function ancientQuest(q,s) {
  if(!q)return null;
  const c=ANCIENT_COUNTRIES[s.ancient?.country];
  return q.location&&c?{...q,map:c[q.location]}:q;
}
export function ancientDestination(s){const c=ANCIENT_COUNTRIES[s.ancient?.country];return c?c.village:'ancient-origins';}
export function ancientCanEnter(s,m) {
  if(!m?.ancient)return true;
  const p=s.progress.ancient||0;
  if(p<(m.entryAt||0))return false;
  if(m.country&&m.country!==s.ancient?.country)return false;
  if(m.theme==='room'&&!s.ancient?.home?.owned)return false;
  return true;
}
