// Story cargo is deliberately separate from the life inventory and cart.
export const STORY_POINTS={sender:{x:16,y:9},keeper:{x:10,y:8},south:{x:10,y:5}};
export const CARGO={large:{name:'큰 곡식 자루',weight:3},jar:{name:'항아리',weight:2},box:{name:'나무 상자',weight:2},small:{name:'작은 곡식 자루',weight:1}};
export const CARGO_ROUNDS=[['jar','box'],['large','jar','small'],['large','jar','box','small']];
export const STORY_RECORDS=[['ancient-4c-trade','한강 첫 거래','백제는 한강 유역에서 성장했다. 넓은 들에서 농사짓고, 강을 따라 물건을 옮기기 좋았다.'],['ancient-4c-cargo','나루터 일 돕기','강을 이용하면 물건을 먼 곳까지 옮길 수 있다. 배에 짐을 나누어 싣는 활동은 게임용 창작이다.'],['ancient-4c-south','백제의 남쪽 진출','근초고왕 때 백제는 남쪽으로 영향력을 넓혔다. 마한 여러 세력의 통합 범위와 시기는 연구가 이어지고 있다.']];
export const freshBaekjeStory=()=>({revision:1,parcel:false,delivered:false,observed:[],farmBonus:false,round:0,placements:[],exchanges:0,routes:0,court:false});
export const storyPeriod=s=>s.ancient?.century===4&&s.ancient?.history?.phase==='baekje-4';
export function atStory(s,key){const p=STORY_POINTS[key];return Boolean(p&&storyPeriod(s)&&s.ancient?.home?.owned&&s.ancient.country&&s.map===(key==='sender'?'ancient-village-'+s.ancient.country:'ancient-han')&&Number.isFinite(s.x)&&Number.isFinite(s.y)&&Math.hypot(s.x-p.x,s.y-p.y)<1.65);}
export function storyActive(s,index,key){return s.progress.ancient===index&&atStory(s,key);}
export function validateBaekjeStory(a){
 a.baekje4c??=freshBaekjeStory();const b=a.baekje4c;
 if(!b||b.revision!==1||!['parcel','delivered','farmBonus','court'].every(k=>typeof b[k]==='boolean')||!Array.isArray(b.observed)||b.observed.some(k=>!['river','boat','grain'].includes(k))||new Set(b.observed).size!==b.observed.length||!Number.isInteger(b.round)||b.round<0||b.round>3||!Array.isArray(b.placements)||b.placements.length>(CARGO_ROUNDS[b.round]?.length||0)||b.placements.some(v=>v!==null&&v!=='left'&&v!=='right')||!Number.isInteger(b.exchanges)||b.exchanges<0||b.exchanges>3||!Number.isInteger(b.routes)||b.routes<0||b.routes>2)throw Error('한강 이야기 진행 기록을 읽을 수 없다.');
 a.baekje4c={...b,observed:[...b.observed],placements:[...b.placements]};
}
export function takeStoryParcel(s){const b=s.ancient.baekje4c;if(!storyActive(s,21,'sender')||b.parcel||b.delivered)return false;b.parcel=true;return true;}
export function deliverStoryParcel(s){const b=s.ancient.baekje4c;if(!storyActive(s,21,'keeper')||!b.parcel||b.delivered)return false;b.parcel=false;b.delivered=true;return true;}
export function observeStory(s,id){const b=s.ancient.baekje4c;if(!storyActive(s,21,'keeper')||!b.delivered||!['river','boat','grain'].includes(id)||b.observed.includes(id))return false;b.observed.push(id);return true;}
export function cargoBalance(b){const ids=CARGO_ROUNDS[b.round]||[],weights={left:0,right:0};ids.forEach((id,i)=>{if(weights[b.placements[i]]!==undefined)weights[b.placements[i]]+=CARGO[id].weight;});return {...weights,ready:ids.length>0&&ids.every((_,i)=>['left','right'].includes(b.placements[i]))&&Math.abs(weights.left-weights.right)<=1};}
export function placeCargo(s,index,side){const b=s.ancient.baekje4c;if(!storyActive(s,22,'keeper')||!Number.isInteger(index)||!CARGO_ROUNDS[b.round]?.[index]||!['left','right'].includes(side))return false;while(b.placements.length<CARGO_ROUNDS[b.round].length)b.placements.push(null);b.placements[index]=side;return true;}
export function departCargo(s){const b=s.ancient.baekje4c;if(!storyActive(s,22,'keeper')||!cargoBalance(b).ready)return false;b.round++;b.placements=[];return true;}
export const EXCHANGES=[
 [{name:'한강 상인',art:'shopkeeper',have:'large',need:'jar'},{name:'남쪽 상인',art:'farmer',have:'jar',need:'large'},{name:'길손 상인',art:'elder',have:'box',need:'cloth'}],
 [{name:'남쪽 상인',art:'farmer',have:'box',need:'cloth'},{name:'옷감 상인',art:'elder',have:'cloth',need:'box'},{name:'한강 상인',art:'shopkeeper',have:'jar',need:'small'}],
 [{name:'한강 상인',art:'shopkeeper',have:'small',need:'jar'},{name:'남쪽 상인',art:'farmer',have:'jar',need:'small'},{name:'옷감 상인',art:'elder',have:'cloth',need:'box'}],
];
export function exchangeStory(s,first,second,expectedStage=s.ancient.baekje4c.exchanges){const b=s.ancient.baekje4c,people=EXCHANGES[b.exchanges];if(expectedStage!==b.exchanges||!storyActive(s,23,'south')||!people||!Number.isInteger(first)||!Number.isInteger(second)||first===second)return false;const a=people[first],c=people[second];if(!a||!c||a.have!==c.need||c.have!==a.need)return false;b.exchanges++;return true;}
export function chooseStoryRoute(s,id){const b=s.ancient.baekje4c;if(!storyActive(s,23,'south')||b.exchanges!==3||b.routes>=2||id!==['water','land'][b.routes])return false;b.routes++;return true;}
export function seeStoryCourt(s){const b=s.ancient.baekje4c;if(!storyActive(s,23,'south')||b.routes!==2||b.court)return false;b.court=true;return true;}
export function storyEventAllowed(s,q,event){const b=s.ancient.baekje4c;if(s.completedQuests.includes(q.id)||q.event!==event)return false;if(q.id==='ancient-4c-trade')return storyActive(s,21,'keeper')&&b.delivered&&b.observed.length===3;if(q.id==='ancient-4c-cargo')return storyActive(s,22,'keeper')&&b.round===3;if(q.id==='ancient-4c-south')return storyActive(s,23,'south')&&b.exchanges===3&&b.routes===2&&b.court;return false;}
