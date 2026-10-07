// Shared life content: no quest/map initialization and no wall-clock mutation on render.
export const CROPS = {
  millet:{name:'조',item:'millet',minutes:3,sale:3,seed:2,yield:4,kind:'field',color:'#c8ab57'},
  barnyard:{name:'피',item:'barnyard',minutes:4,sale:4,seed:3,yield:4,kind:'field',color:'#a89259'},
  sorghum:{name:'수수',item:'sorghum',minutes:5,sale:5,seed:4,yield:4,kind:'field',color:'#a65846'},
  barley:{name:'보리',item:'barley',minutes:6,sale:5,seed:4,yield:4,kind:'field',color:'#d3b975'},
  ricecrop:{name:'벼',item:'ricecrop',minutes:8,sale:8,seed:6,yield:4,kind:'paddy',color:'#ceb86b'},
};
export const HOME_LEVELS = {
  1:{name:'작은 거처',fields:2,paddies:0,room:[10,8],yard:[14,12],slots:3,coins:0,lumber:0,house:[150,132]},
  2:{name:'살림이 늘어난 집',fields:4,paddies:0,room:[12,9],yard:[16,13],slots:5,coins:90,lumber:2,house:[180,150]},
  3:{name:'마당이 넓어진 집',fields:6,paddies:1,room:[14,10],yard:[20,14],slots:8,coins:240,lumber:4,house:[214,176]},
  4:{name:'넉넉한 생활 거처',fields:8,paddies:2,room:[16,12],yard:[22,16],slots:12,coins:480,lumber:6,house:[248,198]},
};
export const DECOR = {
  clayJar:{name:'흙빛 항아리',price:12,area:'both',art:'life-clayJar'},
  stripedJar:{name:'줄무늬 항아리',price:18,area:'both',art:'life-stripedJar'},
  darkJar:{name:'짙은 항아리',price:22,area:'both',art:'life-darkJar'},
  reedMat:{name:'갈대 자리',price:12,area:'room',art:'life-reedMat'},
  wovenMat:{name:'무늬 자리',price:18,area:'room',art:'life-wovenMat'},
  clayLamp:{name:'흙 등잔',price:16,area:'room',art:'life-clayLamp'},
  doubleLamp:{name:'두 불빛 등잔',price:24,area:'room',art:'life-doubleLamp'},
  woodBox:{name:'나무 상자',price:18,area:'both',art:'life-woodBox',lumber:2},
  lowTable:{name:'작은 상',price:28,area:'room',art:'life-lowTable',lumber:3},
  wallWeave:{name:'벽 짜임 장식',price:20,area:'room',art:'life-wallWeave',wall:true},
  herbPot:{name:'풀을 담은 토기',price:16,area:'yard',art:'life-herbPot'},
  dyedCloth:{name:'물들인 천',price:24,area:'room',art:'life-dyedCloth',wall:true},
};
export const DECOR_SLOTS = [
  {id:'room-1',area:'room',name:'잠자리 곁',at:[.23,.70]},
  {id:'yard-1',area:'yard',name:'문 왼편',at:[9,7.5]},
  {id:'room-2',area:'room',name:'왼쪽 벽 앞',at:[.29,.35],wall:true},
  {id:'yard-2',area:'yard',name:'문 오른편',at:[15,7.5]},
  {id:'room-3',area:'room',name:'가운데 자리',at:[.47,.57]},
  {id:'room-4',area:'room',name:'오른쪽 벽 앞',at:[.70,.35],wall:true},
  {id:'yard-3',area:'yard',name:'마당 왼쪽',at:[5,8]},
  {id:'room-5',area:'room',name:'화로 곁',at:[.72,.71]},
  {id:'yard-4',area:'yard',name:'수레 옆',at:[18,8.5]},
  {id:'room-6',area:'room',name:'작업 공간',at:[.32,.51]},
  {id:'yard-5',area:'yard',name:'마당 입구 곁',at:[15.5,15.5]},
  {id:'room-7',area:'room',name:'넓은 벽 앞',at:[.58,.35],wall:true},
];
export const PLOT_IDS = [...Array.from({length:8},(_,i)=>'field-'+(i+1)), 'paddy-1','paddy-2'];
export const HOME_PALETTES = {
  goguryeo:{roof:'#657176',roofLight:'#849195',wall:'#c2b395',wood:'#63503c',ground:'#9aa487'},
  baekje:{roof:'#ad7854',roofLight:'#c7946b',wall:'#e0c7a0',wood:'#816049',ground:'#b6b18a'},
  silla:{roof:'#aa985b',roofLight:'#c3ae6f',wall:'#d6c397',wood:'#786042',ground:'#b3b18a'},
};
const int=(v,min=0,max=99999)=>Number.isInteger(v)&&v>=min&&v<=max;
const plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
const counts=keys=>Object.fromEntries(keys.map(k=>[k,0]));
export function freshLife(){return {lifeRevision:1,level:1,fields:2,paddies:0,seeds:counts(Object.keys(CROPS)),plots:PLOT_IDS.map(id=>({id,crop:null,plantedAt:0})),decorations:counts(Object.keys(DECOR)),placements:{},reputation:0,harvested:counts(Object.keys(CROPS)),starterGranted:false};}
export function ensureLife(home){
  const defaults=freshLife();for(const [key,value]of Object.entries(defaults))if(home[key]===undefined)home[key]=structuredClone(value);
  if(home.fields===undefined)home.fields=HOME_LEVELS[home.level]?.fields||2;
  return home;
}
export function validateLife(home){
  // Missing life fields are migrated; malformed supplied fields are rejected.
  const legacy=home.lifeRevision===undefined;ensureLife(home);
  if(legacy&&home.level!==1)home.fields=HOME_LEVELS[home.level]?.fields||2;
  const d=HOME_LEVELS[home.level];
  if(home.lifeRevision!==1||!int(home.level,1,4)||!d||!int(home.fields,2,d.fields)||!int(home.paddies,0,d.paddies)||!int(home.reputation,0,999999)||typeof home.starterGranted!=='boolean')throw Error('거처 성장 기록이 올바르지 않다.');
  for(const [key,allowed]of [['seeds',CROPS],['harvested',CROPS],['decorations',DECOR]]){
    if(!plain(home[key])||Object.keys(home[key]).some(id=>!Object.hasOwn(allowed,id)))throw Error('거처 물품 기록이 올바르지 않다.');
    for(const id of Object.keys(allowed)){home[key][id]??=0;if(!int(home[key][id]))throw Error('거처 물품 개수가 올바르지 않다.');}
  }
  if(!Array.isArray(home.plots)||home.plots.length!==10)throw Error('재배칸 기록이 올바르지 않다.');
  const ids=new Set();for(const p of home.plots){
    if(!plain(p)||!PLOT_IDS.includes(p.id)||ids.has(p.id)||!Number.isFinite(p.plantedAt)||p.plantedAt<0||p.plantedAt>1e15||
      (p.crop!==null&&(!CROPS[p.crop]||CROPS[p.crop].kind!==p.id.split('-')[0]||p.plantedAt<=0))||(p.crop===null&&p.plantedAt!==0))throw Error('작물 재배 기록이 올바르지 않다.');ids.add(p.id);
  }
  if(!plain(home.placements))throw Error('꾸미기 배치 기록이 올바르지 않다.');
  const used={};for(const [slot,id]of Object.entries(home.placements)){
    const spot=DECOR_SLOTS.find(v=>v.id===slot),item=DECOR[id];
    if(!spot||!item||DECOR_SLOTS.indexOf(spot)>=d.slots||(item.area!=='both'&&item.area!==spot.area)||(item.wall&&!spot.wall))throw Error('꾸미기 위치가 올바르지 않다.');
    used[id]=(used[id]||0)+1;if(used[id]>home.decorations[id])throw Error('꾸미기 물품이 부족하다.');
  }
}
export function grantLifeStarter(s){
  const h=ensureLife(s.ancient.home);if(!h.owned||h.starterGranted)return false;
  h.starterGranted=true;for(const [id,n]of Object.entries({millet:2,barnyard:2,sorghum:1,barley:1}))h.seeds[id]=Math.min(99999,h.seeds[id]+n);
  h.decorations.clayJar=Math.min(99999,h.decorations.clayJar+1);h.decorations.reedMat=Math.min(99999,h.decorations.reedMat+1);h.placements['yard-1']='clayJar';h.placements['room-1']='reedMat';
  s.inventory.lumber=Math.min(99999,(s.inventory.lumber||0)+2);return true;
}
export function activePlots(home){return home.plots.filter(p=>Number(p.id.split('-')[1])<=(p.id.startsWith('field')?home.fields:home.paddies));}
export function plotState(plot,now=Date.now()){
  if(!plot.crop)return {status:'empty',remaining:0,progress:0};
  const duration=CROPS[plot.crop].minutes*60000,elapsed=Math.max(0,now-plot.plantedAt);
  return {status:elapsed>=duration?'ready':'growing',remaining:Math.max(0,duration-elapsed),progress:Math.min(1,elapsed/duration)};
}
export function atHome(s){return Boolean(s.ancient?.country&&s.ancient.home.owned&&['ancient-home-'+s.ancient.country,'ancient-yard-'+s.ancient.country].includes(s.map));}
export function plantCrop(s,plotId,cropId,now=Date.now()){
  if(!atHome(s)||!Number.isFinite(now)||now<=0)return false;
  const h=s.ancient.home,p=activePlots(h).find(p=>p.id===plotId),c=CROPS[cropId];
  if(!p||p.crop||!c||c.kind!==plotId.split('-')[0]||h.seeds[cropId]<1)return false;
  h.seeds[cropId]--;p.crop=cropId;p.plantedAt=now;return true;
}
export function harvestCrop(s,plotId,now=Date.now()){
  if(!atHome(s))return null;const h=s.ancient.home,p=activePlots(h).find(p=>p.id===plotId);
  if(!p||plotState(p,now).status!=='ready')return null;const id=p.crop,c=CROPS[id];
  if((s.inventory[c.item]||0)+c.yield>99999||h.harvested[id]+c.yield>99999)return null;
  s.inventory[c.item]=(s.inventory[c.item]||0)+c.yield;
  if(Object.values(h.harvested).every(n=>n===0))h.reputation=Math.min(999999,h.reputation+1);
  h.harvested[id]+=c.yield;p.crop=null;p.plantedAt=0;return {id,item:c.item,count:c.yield};
}
export function buyLife(s,type,id,count=1){
  if(!atHome(s)||!int(count,1,10))return false;const h=s.ancient.home;
  const source=type==='seed'?CROPS:type==='decor'?DECOR:null;
  const item=source?.[id],price=type==='seed'?item?.seed:item?.price;
  if(type==='seed'&&id==='ricecrop'&&!h.paddies)return false;
  if(!item||s.coins<price*count)return false;const inv=type==='seed'?h.seeds:h.decorations;
  if((inv[id]||0)+count>99999)return false;s.coins-=price*count;inv[id]=(inv[id]||0)+count;return true;
}
export function buyLumber(s,count=1){
  if(!atHome(s)||!int(count,1,10)||s.coins<count*8||(s.inventory.lumber||0)+count>99999)return false;
  s.coins-=count*8;s.inventory.lumber=(s.inventory.lumber||0)+count;return true;
}
export function upgradeHome(s){
  if(!atHome(s))return false;const h=s.ancient.home,d=HOME_LEVELS[h.level+1];
  if(!d||s.coins<d.coins||(s.inventory.lumber||0)<d.lumber)return false;
  s.coins-=d.coins;s.inventory.lumber-=d.lumber;h.level++;h.fields=d.fields;h.reputation=Math.min(999999,h.reputation+2);return true;
}
export function openPaddy(s){
  if(!atHome(s))return false;const h=s.ancient.home,max=HOME_LEVELS[h.level].paddies,price=h.paddies?45:30;
  if(h.paddies>=max||s.coins<price)return false;s.coins-=price;h.paddies++;return true;
}
export function placeDecor(s,slot,id){
  if(!atHome(s))return false;const h=s.ancient.home,spot=DECOR_SLOTS.slice(0,HOME_LEVELS[h.level].slots).find(v=>v.id===slot);
  if(!spot)return false;if(id===null){delete h.placements[slot];return true;}
  const d=DECOR[id],used=Object.entries(h.placements).filter(([key,value])=>key!==slot&&value===id).length;
  if(!d||(d.area!=='both'&&d.area!==spot.area)||(d.wall&&!spot.wall)||h.decorations[id]<=used)return false;h.placements[slot]=id;return true;
}
export function craftDecor(s,id){
  const d=DECOR[id],h=s.ancient?.home;if(!atHome(s)||h.level<2||!d?.lumber||(s.inventory.lumber||0)<d.lumber||h.decorations[id]>=99999)return false;
  s.inventory.lumber-=d.lumber;h.decorations[id]++;return true;
}
export function meetsLifeRequirements(s,{homeLevel=1,reputation=0,produced={},paddy=false}={}){
  const h=s.ancient?.home;return Boolean(h?.owned&&h.level>=homeLevel&&h.reputation>=reputation&&(!paddy||h.paddies>0)&&Object.entries(produced).every(([id,n])=>(h.harvested[id]||0)>=n));
}
export function roomLayout(level){const [w,h]=HOME_LEVELS[level].room;return {w,h,start:{x:w/2,y:h-2.8},points:{'ancient-home-exit':[w/2,h-1.7],'ancient-storage':[2.3,2.9],'ancient-home-fire':[w-2.6,h-2.5],'ancient-chapters':[w/2,2.7],'ancient-display':[w-2.2,2.8],'ancient-bed':[2.3,h-2.5],'ancient-jars':[w-2.5,h-4.3],'life-board':[w/2,h-4.1]}};}
export function plotPosition(id){const n=Number(id.split('-')[1])-1;return id.startsWith('paddy')?[17+n*2.5,13.3]:[6+(n%4)*2.5,10.5+Math.floor(n/4)*3];}
export function decorPosition(slot,level){const [w,h]=HOME_LEVELS[level].room;return slot.area==='yard'?slot.at:[slot.at[0]*w,slot.wall?1.9:slot.at[1]*h];}
export function setLifeLevel(home,level){
  if(!HOME_LEVELS[level])return false;home.level=level;home.fields=HOME_LEVELS[level].fields;home.paddies=Math.min(home.paddies,HOME_LEVELS[level].paddies);
  for(const id of Object.keys(home.placements))if(!DECOR_SLOTS.slice(0,HOME_LEVELS[level].slots).some(v=>v.id===id))delete home.placements[id];return true;
}
