import {map, person, exit, foe, entity} from './common.js';

const q=(id,title,mapId,target,event,detail,xp=25,coins=0,extra={})=>({id,title,map:mapId,target,event,detail,xp,coins,...extra});
const n=(id,x,y,name,lines,art='farmer')=>person(id,x,y,name,lines,art);
const task=(id,x,y,name,art='chest',extra={})=>entity(id,'story',x,y,name,{art,...extra});
const path=(id,x,y,name,to,unlockAt=0)=>({...exit(id,x,y,name,to),unlockAt});
const scatter=(m,layout)=>{
  m.obstacles=m.obstacles.filter(o=>o.x===0||o.x===23||o.y===0||o.y===17);
  m.obstacles.push(...layout.map(([x,y,art])=>({x,y,art})));
  return m;
};
const scene=(id,name,theme,entities,layout=[])=>scatter(map(id,name,theme,entities),layout);
const woods=[[3,4,'pine'],[5,6,'tree'],[8,3,'rock'],[18,4,'pine'],[20,12,'tree'],[5,13,'rock'],[15,12,'pine']];
const stones=[[3,4,'rock'],[7,5,'pine'],[17,4,'rock'],[19,12,'pine'],[5,13,'tree'],[15,14,'rock']];
const village=[[4,4,'tree'],[19,4,'tree'],[5,13,'rock'],[19,13,'tree']];

export const NATIONS=[
  {id:'buyeo',name:'부여',map:'nation-buyeo-village',places:['nation-buyeo-village','nation-buyeo-forest','nation-buyeo-festival']},
  {id:'goguryeo',name:'고구려',map:'nation-goguryeo-village',places:['nation-goguryeo-village','nation-goguryeo-homes','nation-goguryeo-forest','nation-goguryeo-festival']},
  {id:'okjeo',name:'옥저',map:'nation-okjeo-village',places:['nation-okjeo-village','nation-okjeo-homes','nation-okjeo-river']},
  {id:'dongye',name:'동예',map:'nation-dongye-village',places:['nation-dongye-village','nation-dongye-border','nation-dongye-forest','nation-dongye-festival']},
  {id:'samhan',name:'삼한',map:'nation-samhan-field',places:['nation-samhan-field','nation-samhan-mahan','nation-samhan-byeonhan','nation-samhan-jinhan','nation-samhan-festival']}
];
export const NATION_RECORDS={
  buyeo:'여러 부족이 힘을 합쳐 나라를 이끌었다. 12월에는 영고라는 축제가 있었다.',
  goguryeo:'신랑이 신부 집 뒤에 집을 짓고 살았다. 10월에는 동맹을 열었다.',
  okjeo:'어린 여성이 남성의 집에서 살면서 혼인하는 풍습이 있었다.',
  dongye:'마을끼리 영역을 침범하지 않았다. 침범하면 보상했다. 10월에는 하늘에 제사를 지냈다.',
  samhan:'마한·변한·진한을 합쳐 삼한이라고 불렀다. 벼농사가 발달했고 5월과 10월에 축제를 열었다.'
};
export const NATION_MARKS={buyeo:'부여',goguryeo:'고구려',okjeo:'옥저',dongye:'동예',samhan:'삼한'};

const quests=[
 q('iron-start','농부의 부탁을 듣자.','nation-iron-field','iron-farmer','talk:iron-farmer','농경지의 농부를 만나자.',0),
 q('iron-pieces','철 조각을 3개 찾자.','nation-iron-outskirts','iron-piece-c','collect:ironpiece','외곽과 바위 주변을 조사하자.',30,0,{items:{ironpiece:3}}),
 q('iron-smith','철 조각을 대장장이에게 주자.','nation-iron-village','iron-smith','talk:iron-smith','철 조각 3개를 가져가자.',30,0,{items:{ironpiece:3},consume:true}),
 q('iron-deliver','농기구를 농부에게 전달하자.','nation-iron-field','iron-farmer','talk:iron-farmer','농경지로 돌아가자.',30,0,{items:{ironhoe:1},consume:true}),
 q('iron-guard','길 지킴이에게 말을 걸자.','nation-iron-village','iron-guard','talk:iron-guard','마을 밖 길을 살펴보자.',0),
 q('iron-fight','외곽의 산적을 물리치자.','nation-iron-outskirts','iron-bandit','win:iron-bandit','외곽에서 전투를 해 보자.',35),
 q('iron-target','훈련 표적을 조사하자.','nation-iron-outskirts','iron-target','inspect:iron-target','외곽의 표적을 살펴보자.',25),
 q('iron-return','길 지킴이에게 돌아가자.','nation-iron-village','iron-guard','talk:iron-guard','새 길이 열린다.',25),
 q('buyeo-start','부여 대표를 만나자.','nation-buyeo-village','buyeo-leader','talk:buyeo-leader','부여 마을로 걸어가자.',0),
 q('buyeo-wolf','북쪽 숲의 늑대를 물리치자.','nation-buyeo-forest','buyeo-wolf','win:buyeo-wolf','숲길의 늑대를 찾아보자.',30),
 q('buyeo-person','숲의 사람과 이야기하자.','nation-buyeo-forest','buyeo-lost','talk:buyeo-lost','늑대를 물리친 뒤 말을 걸자.',15),
 q('buyeo-food','축제 음식을 전달하자.','nation-buyeo-village','buyeo-cook','talk:buyeo-cook','열매 2개 또는 고기 1개가 필요하다.',25,0,{anyFood:true}),
 q('buyeo-bundle','길에서 준비 물건을 찾자.','nation-buyeo-road','buyeo-bundle','collect:buyeobundle','부여로 가는 길을 다시 살펴보자.',20,0,{items:{buyeobundle:1}}),
 q('buyeo-carrier','준비 물건을 돌려주자.','nation-buyeo-village','buyeo-carrier','talk:buyeo-carrier','잃어버린 물건을 가져가자.',15,0,{items:{buyeobundle:1},consume:true}),
 q('buyeo-festival','마을 큰마당에서 마무리 문제를 풀자.','nation-buyeo-festival','buyeo-ceremony','quiz:buyeo-final','모인 사람들과 축제터를 보자.',45,20,{mark:'buyeo'}),
 q('goguryeo-start','집 짓는 사람을 만나자.','nation-goguryeo-homes','goguryeo-builder','talk:goguryeo-builder','마을 뒤의 집으로 가자.',0),
 q('goguryeo-wood','목재를 3개 모으자.','nation-goguryeo-forest','goguryeo-wood-c','collect:wood','깊은 숲에서 목재를 찾자.',25,0,{items:{wood:3}}),
 q('goguryeo-hide','가죽을 1개 구하자.','nation-goguryeo-forest','goguryeo-wolf','win:goguryeo-wolf','숲의 늑대를 찾아보자.',25,0,{items:{hide:1}}),
 q('goguryeo-build','집 재료를 전달하자.','nation-goguryeo-homes','goguryeo-builder','talk:goguryeo-builder','목재 3개와 가죽 1개를 가져가자.',40,0,{items:{wood:3,hide:1},consume:true}),
 q('goguryeo-items','행사 준비 물건을 2개 찾자.','nation-goguryeo-forest','goguryeo-feast-b','collect:festivalitem','숲 가장자리를 살펴보자.',25,0,{items:{festivalitem:2}}),
 q('goguryeo-festival','마을 모임터에서 마무리 문제를 풀자.','nation-goguryeo-festival','goguryeo-ceremony','quiz:goguryeo-final','마을 밖 모임터로 가자.',45,20,{items:{festivalitem:2},consume:true,mark:'goguryeo'}),
 q('okjeo-start','새 살림을 준비하는 사람을 만나자.','nation-okjeo-homes','okjeo-resident','talk:okjeo-resident','옥저 마을의 집을 찾아보자.',0),
 q('okjeo-supplies','생활 물건 3개를 모으자.','nation-okjeo-river','okjeo-bowl','collect:okjeobowl','장작·곡식 자루·그릇을 찾아보자.',35,0,{items:{okjeowood:1,okjeograin:1,okjeobowl:1}}),
 q('okjeo-return','생활 물건을 전하고 마무리 문제를 풀자.','nation-okjeo-homes','okjeo-resident','quiz:okjeo-final','준비한 물건을 가져가자.',45,15,{items:{okjeowood:1,okjeograin:1,okjeobowl:1},consume:true,mark:'okjeo'}),
 q('dongye-start','경계 지킴이의 부탁을 듣자.','nation-dongye-village','dongye-guard','talk:dongye-guard','다른 마을로 물건을 전하자.',0),
 q('dongye-deliver','경계를 지켜 물건을 전하자.','nation-dongye-forest','dongye-receiver','talk:dongye-receiver','표시된 길을 따라가자.',45,0,{items:{dongyepackage:1},consume:true}),
 q('dongye-ceremony','제사터에서 마무리 문제를 풀자.','nation-dongye-festival','dongye-ceremony','quiz:dongye-final','10월 제사터에 가 보자.',35,15,{mark:'dongye'}),
 q('samhan-start','삼한의 안내인을 만나자.','nation-samhan-field','samhan-guide','talk:samhan-guide','평야 입구에서 부탁을 듣자.',0),
 q('samhan-boar','마한의 멧돼지를 물리치자.','nation-samhan-mahan','samhan-boar','win:samhan-boar','농경지의 멧돼지를 찾아보자.',25),
 q('samhan-mahan','마한에서 곡식 자루를 얻자.','nation-samhan-mahan','samhan-sack-a','collect:samhansack','농경지를 살펴보자.',20,0,{items:{samhansack:1}}),
 q('samhan-byeonhan','변한의 창고를 찾아가자.','nation-samhan-byeonhan','samhan-sack-b','collect:samhansack','돌과 나무를 돌아 창고로 가자.',20,0,{items:{samhansack:2}}),
 q('samhan-tool','진한의 농사 도구를 찾자.','nation-samhan-jinhan','samhan-tool','collect:samhantool','집 바깥쪽을 살펴보자.',20),
 q('samhan-jinhan','도구를 돌려주고 자루를 받자.','nation-samhan-jinhan','samhan-farmer','talk:samhan-farmer','찾은 도구를 농부에게 가져가자.',20,0,{items:{samhantool:1},consume:true}),
 q('samhan-deliver','곡식 자루 세 개를 전하자.','nation-samhan-field','samhan-guide','talk:samhan-guide','마한·변한·진한의 자루를 모으자.',30,0,{items:{samhansack:3},consume:true}),
 q('samhan-quiz','세 지역 기록을 살펴보자.','nation-samhan-field','samhan-quiz','inspect:samhan-quiz','세 지역의 이름을 떠올려 보자.',20),
 q('samhan-festival','축제터에서 마무리 문제를 풀자.','nation-samhan-festival','samhan-ceremony','quiz:samhan-final','5월과 10월 축제를 확인하자.',45,20,{mark:'samhan'}),
 q('nations-return','처음 마을로 돌아가자.','nation-iron-village','iron-elder','talk:iron-elder','표식 5개를 모아 이야기를 전하자.',60,30,{marks:5})
];

const maps=[
 scene('nation-iron-village','철기 마을','ancient',[n('iron-elder',8,6,'마을 어른',['철로 만든 도구를 살펴보자.'],'elder'),n('iron-smith',17,6,'대장장이',['철 조각을 가져오면 농기구를 만들게.']),n('iron-guard',17,12,'길 지킴이',['외곽에는 산적이 있어.']),task('iron-workshop',17,4,'작업장','growthShed'),entity('iron-trader','shop',5,11,'교환원',{art:'farmer'}),entity('iron-fire','rest',12,12,'모닥불',{art:'campfire'}),path('iron-to-field',2,9,'농경지','nation-iron-field'),path('iron-to-out',21,9,'마을 외곽','nation-iron-outskirts'),path('iron-to-buyeo',11,2,'부여로 가는 길','nation-buyeo-road',8),path('iron-home',11,15,'탐험 본부','hq')],village),
 scene('nation-iron-field','달라지는 농경지','field',[n('iron-farmer',11,7,'농부',['철로 만든 도구가 필요해.','수확량이 늘고 사람이 모였다.']),path('field-return',21,9,'철기 마을','nation-iron-village'),foe('iron-boar',6,12,'boar')],[[4,4,'tree'],[18,4,'rock']]),
 scene('nation-iron-outskirts','철기 마을 외곽','deep-wild',[path('iron-out-return',2,9,'철기 마을','nation-iron-village'),task('iron-piece-a',7,5,'바위의 철 조각','rock',{collect:'ironpiece'}),task('iron-piece-b',18,5,'길가의 철 조각','rock',{collect:'ironpiece'}),task('iron-piece-c',17,13,'수풀의 철 조각','rock',{collect:'ironpiece'}),task('iron-target',9,13,'훈련 표적','palisade'),foe('iron-bandit',13,9,'bandit'),foe('iron-wolf',19,8,'wolf')],woods),
 scene('nation-buyeo-road','부여로 가는 길','deep-wild',[path('buyeo-road-back',2,9,'철기 마을','nation-iron-village'),path('buyeo-road-next',21,9,'부여 마을','nation-buyeo-village'),task('buyeo-bundle',16,12,'잃어버린 꾸러미','chest',{collect:'buyeobundle'}),foe('buyeo-road-boar',9,7,'boar'),entity('horse-buyeo','horse',19,14,'들판의 말',{art:'horseLeftIdle'})],stones),
 scene('nation-buyeo-village','부여 마을','ancient',[n('buyeo-leader',11,6,'마을 대표',['아직 몇 사람이 돌아오지 않았어.\n찾아봐 줄래?'],'elder'),n('buyeo-cook',7,12,'음식을 준비하는 사람',['축제 음식이 모자라.']),n('buyeo-carrier',17,11,'꾸러미 주인',['길에서 꾸러미를 잃어버렸어.']),task('buyeo-gather',13,12,'사람들이 모이는 자리','growthFestival'),entity('buyeo-house-a','scenery',6,5,'마을집',{art:'growthHouse',solid:true}),entity('buyeo-house-b','scenery',19,5,'마을집',{art:'growthHouse',solid:true}),entity('buyeo-store','scenery',19,14,'곡식 저장 공간',{art:'growthGranary',solid:true}),path('buyeo-v-back',2,9,'부여로 가는 길','nation-buyeo-road'),path('buyeo-v-forest',21,9,'북쪽 숲','nation-buyeo-forest'),path('buyeo-v-feast',11,2,'마을 큰마당','nation-buyeo-festival',14)],village),
 scene('nation-buyeo-forest','부여 북쪽 숲','deep-wild',[path('buyeo-f-back',2,9,'부여 마을','nation-buyeo-village'),n('buyeo-lost',18,6,'숲에 남은 사람',['늑대가 지나가기를 기다렸어.']),foe('buyeo-wolf',13,8,'wolf'),foe('buyeo-boar',7,12,'boar'),entity('buyeo-berries','berry',19,12,'열매',{art:'berries'})],woods),
 scene('nation-buyeo-festival','마을 큰마당','ancient',[path('buyeo-feast-back',11,15,'부여 마을','nation-buyeo-village'),task('buyeo-ceremony',11,7,'마을 제사터','growthFestival'),path('buyeo-feast-next',21,9,'고구려 산길','nation-goguryeo-road',15)],[[5,5,'tree'],[18,5,'tree'],[5,12,'rock']]),
 scene('nation-goguryeo-road','고구려 산길','deep-wild',[path('goguryeo-road-back',2,9,'마을 큰마당','nation-buyeo-festival'),path('goguryeo-road-next',21,9,'고구려 마을','nation-goguryeo-village'),foe('goguryeo-road-boar',10,11,'boar'),entity('horse-goguryeo','horse',18,13,'산길의 말',{art:'horseLeftIdle'})],stones),
 scene('nation-goguryeo-village','고구려 마을','ancient',[path('goguryeo-v-back',2,9,'산길','nation-goguryeo-road'),path('goguryeo-v-homes',21,9,'집 뒤쪽','nation-goguryeo-homes'),path('goguryeo-v-forest',11,2,'깊은 숲','nation-goguryeo-forest'),path('goguryeo-v-feast',11,15,'마을 모임터','nation-goguryeo-festival',20),task('goguryeo-mainhouse',6,5,'큰 집','growthHall',{solid:true}),entity('goguryeo-house-b','scenery',18,6,'마을집',{art:'growthHouse',solid:true}),entity('goguryeo-store','scenery',6,13,'저장 공간',{art:'growthGranary',solid:true})],village),
 scene('nation-goguryeo-homes','집 뒤쪽','ancient',[path('goguryeo-home-back',2,9,'마을','nation-goguryeo-village'),n('goguryeo-builder',15,10,'집 짓는 사람',['집을 완성하려는데 재료가 부족해.'],'growthBuilder'),task('goguryeo-smallhouse',15,7,'집 뒤의 작은 집','growthHouse'),task('goguryeo-family',15,4,'신부의 집','growthHall')],[[4,12,'tree'],[20,4,'pine'],[8,5,'rock'],[8,12,'pine']]),
 scene('nation-goguryeo-forest','고구려 깊은 숲','deep-wild',[path('goguryeo-forest-back',11,15,'마을','nation-goguryeo-village'),task('goguryeo-wood-a',6,5,'목재','tree',{collect:'wood'}),task('goguryeo-wood-b',18,5,'목재','tree',{collect:'wood'}),task('goguryeo-wood-c',18,13,'목재','tree',{collect:'wood'}),task('goguryeo-feast-a',5,13,'행사 준비 물건','chest',{collect:'festivalitem'}),task('goguryeo-feast-b',14,3,'행사 준비 물건','chest',{collect:'festivalitem'}),foe('goguryeo-wolf',12,8,'wolf'),foe('goguryeo-boar',20,10,'boar')],woods),
 scene('nation-goguryeo-festival','마을 모임터','ancient',[path('goguryeo-feast-back',11,2,'마을','nation-goguryeo-village'),task('goguryeo-ceremony',11,8,'마을 제사터','growthFestival'),path('goguryeo-feast-next',21,9,'옥저 동쪽 길','nation-okjeo-road',21)],[[4,4,'pine'],[19,4,'pine']]),
 scene('nation-okjeo-road','옥저 동쪽 길','deep-wild',[path('okjeo-road-back',2,9,'마을 모임터','nation-goguryeo-festival'),path('okjeo-road-next',21,9,'옥저 마을','nation-okjeo-village'),foe('okjeo-road-snake',14,7,'snake')],stones),
 scene('nation-okjeo-village','옥저 마을','ancient',[path('okjeo-v-back',2,9,'동쪽 길','nation-okjeo-road'),path('okjeo-v-homes',21,9,'주거 지역','nation-okjeo-homes'),path('okjeo-v-river',11,15,'강가','nation-okjeo-river'),task('okjeo-grain',16,6,'곡식 자루','grain',{collect:'okjeograin'}),entity('okjeo-house-a','scenery',7,5,'마을집',{art:'growthHouse',solid:true}),entity('okjeo-house-b','scenery',11,5,'마을집',{art:'growthHouse',solid:true}),entity('okjeo-net','scenery',18,12,'고기잡이 도구',{art:'growthFish'})],[[4,4,'tree'],[5,13,'rock'],[18,4,'tree']]),
 scene('nation-okjeo-homes','옥저 주거 지역','ancient',[path('okjeo-home-back',2,9,'마을','nation-okjeo-village'),n('okjeo-resident',16,8,'새 살림을 준비하는 사람',['새 살림에 필요한 물건을 찾아 줄래?'],'growthResident'),task('okjeo-home',16,5,'생활할 집','growthHouse'),path('okjeo-home-next',11,15,'동예 마을','nation-dongye-village',24)],[[4,4,'tree'],[5,13,'rock']]),
 scene('nation-okjeo-river','옥저 강가','field',[path('okjeo-river-back',11,2,'옥저 마을','nation-okjeo-village'),task('okjeo-firewood',6,12,'장작','tree',{collect:'okjeowood'}),task('okjeo-bowl',19,11,'그릇','pottery',{collect:'okjeobowl'}),foe('okjeo-river-boar',13,8,'boar')],[[4,4,'tree'],[18,5,'rock']]),
 scene('nation-dongye-village','동예 마을','ancient',[path('dongye-v-back',2,9,'옥저 주거 지역','nation-okjeo-homes'),path('dongye-v-border',21,9,'마을 경계길','nation-dongye-border'),n('dongye-guard',10,7,'경계 지킴이',['이곳에서는 남의 마을에 함부로 들어가지 않아.\n침범하면 보상해야 해.'],'growthGuard'),entity('dongye-house-a','scenery',5,5,'마을집',{art:'growthHouse',solid:true}),entity('dongye-house-b','scenery',18,13,'마을집',{art:'growthHouse',solid:true}),entity('dongye-edge-stone','scenery',18,4,'마을 바깥의 돌',{art:'rock'})],village),
 scene('nation-dongye-border','동예 경계길','deep-wild',[path('dongye-b-back',2,9,'동예 마을','nation-dongye-village'),path('dongye-b-next',21,9,'경계 숲','nation-dongye-forest'),task('dongye-sign',11.6,7,'경계석','rock'),foe('dongye-border-wolf',7,13,'wolf')],[[4,4,'tree'],[8,5,'rock'],[16,4,'rock'],[19,5,'pine'],[6,14,'pine'],[17,14,'pine']]),
 scene('nation-dongye-forest','동예 경계 숲','deep-wild',[path('dongye-f-back',2,9,'경계길','nation-dongye-border'),n('dongye-receiver',17,7,'물건을 받는 사람',['여기까지 길을 찾아왔구나.']),path('dongye-f-feast',11,2,'제사터','nation-dongye-festival',26),foe('dongye-forest-snake',10,12,'snake')],woods),
 scene('nation-dongye-festival','동예 제사터','ancient',[path('dongye-feast-back',11,15,'경계 숲','nation-dongye-forest'),task('dongye-ceremony',11,7,'10월 제사터','growthFestival'),path('dongye-feast-next',21,9,'삼한 평야','nation-samhan-field',27)],[[5,5,'tree'],[18,5,'tree']]),
 scene('nation-samhan-field','삼한 평야 입구','field',[path('samhan-field-back',2,9,'동예 제사터','nation-dongye-festival'),n('samhan-guide',11,7,'삼한 안내인',['마한·변한·진한을 돌아보고 곡식 자루를 모아 줘.'],'growthElder'),task('samhan-quiz',18,7,'삼한 기록','growthGranary'),path('samhan-to-mahan',5,15,'마한','nation-samhan-mahan'),path('samhan-to-byeonhan',19,15,'변한','nation-samhan-byeonhan'),path('samhan-to-jinhan',11,2,'진한','nation-samhan-jinhan'),path('samhan-to-feast',21,9,'축제터','nation-samhan-festival',35),task('samhan-grainstack',14,5,'쌓인 곡식','growthShed')],[[4,4,'tree'],[20,4,'rock']]),
 scene('nation-samhan-mahan','마한 농경지','field',[path('mahan-back',5,2,'평야 입구','nation-samhan-field'),foe('samhan-boar',13,8,'boar'),entity('horse-samhan','horse',20,14,'평야의 말',{art:'horseLeftIdle'}),task('samhan-sack-a',18,11,'마한 곡식 자루','grain',{collect:'samhansack'})],[[4,5,'tree'],[19,5,'tree']]),
 scene('nation-samhan-byeonhan','변한 창고길','deep-wild',[path('byeonhan-back',19,2,'평야 입구','nation-samhan-field'),task('samhan-sack-b',5,5,'변한 곡식 자루','growthGranary',{collect:'samhansack'}),foe('byeonhan-wolf',13,13,'wolf')],[[9,4,'rock'],[9,5,'rock'],[9,6,'rock'],[9,7,'rock'],[9,8,'rock'],[9,9,'rock'],[9,10,'rock'],[9,11,'rock'],[9,12,'rock'],[9,13,'rock'],[18,12,'pine']]),
 scene('nation-samhan-jinhan','진한 마을','ancient',[path('jinhan-back',11,15,'평야 입구','nation-samhan-field'),n('samhan-farmer',17,8,'진한 농부',['농사 도구를 잃어버렸어.']),task('samhan-tool',5,5,'잃어버린 농사 도구','knife',{collect:'samhantool'})],[[4,12,'tree'],[19,4,'tree']]),
 scene('nation-samhan-festival','삼한 축제터','ancient',[path('samhan-feast-back',2,9,'평야 입구','nation-samhan-field'),task('samhan-ceremony',11,8,'삼한 축제터','growthFestival'),path('samhan-feast-home',21,9,'철기 마을','nation-iron-village',36)],[[5,5,'tree'],[18,5,'tree']])
];

export const growth={id:'nations',name:'여러 나라의 성장',subtitle:'철의 길을 따라서',start:'nation-iron-village',village:'nation-iron-village',unlock:null,shop:['hardknife','trainingblade','thickleather','woven','bronzeKnife','bronzeArmor','bronzeCharm','ironSword','ironArmor','ironCharm','berries','food','cookedfish','rice'],artifacts:[],requests:[],quests,maps};
// Rooms live in the same era and use the existing opened-ID save field.
const enterable=[
 ['nation-iron-village','iron-workshop','작업장','growthShed'],
 ['nation-buyeo-village','buyeo-house-a','마을집','growthHouse'],
 ['nation-buyeo-village','buyeo-house-b','마을집','growthHouse'],
 ['nation-buyeo-village','buyeo-store','곡식 저장 공간','growthGranary'],
 ['nation-goguryeo-village','goguryeo-mainhouse','큰 집','growthHall'],
 ['nation-goguryeo-village','goguryeo-house-b','마을집','growthHouse'],
 ['nation-goguryeo-village','goguryeo-store','저장 공간','growthGranary'],
 ['nation-goguryeo-homes','goguryeo-family','신부의 집','growthHall'],
 ['nation-okjeo-village','okjeo-house-a','마을집','growthHouse'],
 ['nation-okjeo-village','okjeo-house-b','마을집','growthHouse'],
 ['nation-okjeo-homes','okjeo-home','생활할 집','growthHouse'],
 ['nation-dongye-village','dongye-house-a','마을집','growthHouse'],
 ['nation-dongye-village','dongye-house-b','마을집','growthHouse'],
 ['nation-samhan-field','samhan-grainstack','곡식 창고','growthGranary']
];
const roomLayouts=[
 {furniture:[[2.5,2.7],[7.4,2.7]],loot:[[3.35,3.65],[6.65,3.65]]},
 {furniture:[[3.0,2.5],[7.5,3.25]],loot:[[7.1,2.35],[2.75,4.45]]},
 {furniture:[[6.7,2.6],[2.5,3.35]],loot:[[3.15,2.35],[7.15,4.4]]},
 {furniture:[[2.65,4.0],[7.35,2.55]],loot:[[7.1,3.8],[3.65,2.45]]}
];
const roomPalettes={
 iron:{border:'#514337',floor:['#b69a71','#b99e76','#b19870']},
 buyeo:{border:'#514438',floor:['#b89c75','#bba078','#b49a72']},
 goguryeo:{border:'#4b4037',floor:['#a99473','#ad9877','#a59070']},
 okjeo:{border:'#4c453b',floor:['#b1a07e','#b4a382','#ad9c79']},
 dongye:{border:'#504438',floor:['#ac9674','#af9977','#a79170']},
 samhan:{border:'#554638',floor:['#baa17b','#bda57f','#b69d76']}
};
for(const [index,[outside,id,name,art]] of enterable.entries()){
 const parent=maps.find(m=>m.id===outside),building=parent.entities.find(e=>e.id===id);
 const roomId='room-'+id;
 Object.assign(building,{type:'house',to:roomId,art,solid:true});
 const crowdedDoor=parent.entities.some(e=>e.type==='npc' && Math.hypot(e.x-building.x,e.y-building.y-1.55)<1.35);
 const store=art==='growthGranary',work=art==='growthShed';
 const props=store?['곡식 자루','항아리']:work?['재료 상자','작업대']:['항아리','작은 상자'];
 const layout=roomLayouts[index%roomLayouts.length];
 const [[f1x,f1y],[f2x,f2y]]=layout.furniture,[[l1x,l1y],[l2x,l2y]]=layout.loot;
 maps.push({id:roomId,name:name+' 안',theme:'room',nationVisual:null,roomPalette:roomPalettes[outside.split('-')[1]],w:10,h:8,start:{x:5,y:5.1},returnTo:{map:outside,x:building.x,y:building.y+(crowdedDoor ? .85 : 1.55)},obstacles:[],entities:[
  entity(roomId+'-bed','roomProp',f1x,f1y,work?'작업 공간':store?'곡식 선반':'침구',{art:work?'roomBench':store?'roomShelf':'roomBed',solid:true}),
  entity(roomId+'-shelf','roomProp',f2x,f2y,work?'도구 선반':store?'저장 선반':'생활 선반',{art:work?'roomBench':'roomShelf',solid:true}),
  entity(roomId+'-door','roomDoor',5,6.7,'밖으로 나가기',{to:outside,art:'roomDoor'}),
  entity(roomId+'-loot-a','roomLoot',l1x,l1y,props[0],{art:store?'roomSack':work?'chest':'roomJar'}),
  entity(roomId+'-loot-b','roomLoot',l2x,l2y,props[1],{art:work?'roomBench':store?'roomJar':'chest'})
 ]});
}
maps.find(m=>m.id==='nation-dongye-border').start={x:3,y:12};
for (const m of maps) {
  m.nationVisual = m.theme==='room' ? null : m.id.split('-')[1];
  // Shared art stays consistent; natural features and clearings distinguish the settlements.
  if (m.id==='nation-goguryeo-road') m.obstacles.push(...[[5,4,'rock'],[8,6,'rock'],[17,11,'pine'],[20,13,'rock']].map(([x,y,art])=>({x,y,art})));
}
export const NATION_ITEM_NAMES={ironpiece:'철 조각',ironhoe:'철제 농기구',buyeobundle:'준비 꾸러미',wood:'목재',festivalitem:'행사 준비 물건',okjeowood:'장작',okjeograin:'곡식 자루',okjeobowl:'그릇',dongyepackage:'전할 물건',samhansack:'곡식 자루',samhantool:'농사 도구'};
export const NATION_STORY={
  'iron-target':['철기는 전투에도 유리했다.','전쟁에서 이긴 부족이 다른 부족을 흡수하며 커지기도 했다.'],
  'buyeo-ceremony':['부여에서는 여러 부족이 힘을 합쳐 나라를 이끌었다.','왕은 부족의 대표였다. 12월에는 사람들이 모여 하늘에 제사를 지냈다.'],
  'goguryeo-ceremony':['고구려에서는 신랑이 신부 집 뒤에 집을 지어 살았다.','자녀가 다 클 때까지 집안일을 도왔다. 10월에는 함께 모여 제사를 지냈다.'],
  'dongye-ceremony':['동예에서는 마을마다 자기 영역을 중요하게 여겼다.','마을 사이의 약속을 떠올려 보자.'],
  'samhan-ceremony':['평야가 많아 벼농사가 발달했다.','사람들이 5월과 10월에 모여 축제를 열었다.']
};
export const NATION_GATES={};
for(const m of maps)for(const e of m.entities)if(e.type==='exit'&&e.unlockAt)NATION_GATES[e.id]=e.unlockAt;

// The visible stone line follows this narrow diagonal. The player's feet are s.x/s.y.
export const dongyeBoundaryX = y => 11.25 + .38 * (y - 6);
export function crossedDongyeBoundary(fromX,fromY,x,y) {
  return y >= 4.7 && y <= 10.45 && x >= dongyeBoundaryX(y) + .24 &&
    (fromY < 4.7 || fromY > 10.45 || fromX < dongyeBoundaryX(fromY) + .24);
}
export const NATION_FINAL_QUIZZES = {
  'buyeo-final':{intro:"부여의 사람들이 12월에 모여 하늘에 제사를 지냈다.",question:'부여에서 12월에 열린 제사와 축제는?',options:['동맹','영고','수릿날'],answer:1,storyEvent:'quiz:buyeo-final'},
  'goguryeo-final':{intro:"고구려 사람들도 함께 모여 하늘에 제사를 지냈다.",question:'고구려에서 10월에 열린 제사와 축제는?',options:['동맹','영고','계절제'],answer:0,storyEvent:'quiz:goguryeo-final'},
  'okjeo-final':{intro:"옥저 사람들은 집과 가족을 이루는 독특한 풍습이 있었다.",question:'옥저의 혼인 풍습으로 알맞은 것은?',options:['어린 여성이 남성의 집에서 살며 혼인을 준비했다.','신랑이 신부 집 뒤에 집을 지었다.','다른 마을 영역을 침범하면 보상했다.'],answer:0,storyEvent:'quiz:okjeo-final'},
  'dongye-final':{intro:"동예에서는 마을마다 자기 영역을 중요하게 여겼다.",question:'동예에서 다른 마을의 영역을 침범하면?',options:['아무 일도 없었다.','침범한 쪽이 보상했다.','새 마을을 만들었다.'],answer:1,storyEvent:'quiz:dongye-final'},
  'samhan-final':{intro:"넓은 평야에서 농사를 지으며 세 지역 사람들이 살아갔다.",question:'삼한을 이루는 세 지역은?',options:['마한·변한·진한','부여·옥저·동예','고구려·옥저·진한'],answer:0,storyEvent:'quiz:samhan-final'}
};
