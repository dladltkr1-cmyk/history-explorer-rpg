import {map,entity,exit} from './common.js';
import {marketMap,forestMap,TRADER} from '../life-access.js?v=55';
import {LIFE_SHOPS,shopDoor,shopMap,woodId,WOOD_SPOTS} from '../life-shops.js?v=55';
// Shared town plan, different country palette and tree species. Safe, short walks.
export function makeLifeDistricts(id,c){
 const boundary=(w,h)=>{const a=[];for(let x=0;x<w;x++)a.push({x,y:0,art:'tree'},{x,y:h-1,art:'tree'});for(let y=1;y<h-1;y++)a.push({x:0,y,art:'tree'},{x:w-1,y,art:'tree'});return a;};
 const prop=(key,x,y,art,w,h)=>entity('district-'+key,'scenery',x,y,'',{art,w,h});
 const market=map(marketMap(id),c.name+' · 상점 거리','ancient-market',[
  exit('life-market-return',14,17.5,'생활마을로',c.village),
  ...Object.entries(LIFE_SHOPS).map(([kind,d])=>entity(shopDoor(kind),'house',...d.at,d.name,{art:'shop-'+id+'-'+kind,solid:true,to:shopMap(id,kind),shopKind:kind,footprint:[1.3,.7]})),
  entity('ancient-shop-'+id,'shop',TRADER.x,TRADER.y,'거래 상인',{art:c.helperArt}),
  prop('trade-stall',15,11.4,'district-stall',165,126),
  prop('seed-goods',9.1,6.9,'shop-prop-seed',84,72),
  prop('seed-jars',5.1,7,'life-grainRack',80,85),
  prop('tool-goods',5.4,14.7,'shop-prop-tool',78,66),
  prop('wood-stack',23.6,7.6,'shop-wood-pile',95,68),
  prop('wheel',19,7.1,'district-wheel',64,72),
  prop('decor-goods',23.5,15,'shop-prop-decor',94,80),
  prop('decor-cloth',18.8,14.7,'life-dyedCloth',62,75),
  prop('north-fence',14,3,'district-fence',188,52),
  prop('flower-pot',11.5,14.4,'life-herbPot',62,82),
  entity('market-neighbor','npc',12,9,'장을 보러 온 이웃',{art:c.helperArt,lines:['곡식과 남는 물건은 가운데 거래 상인에게 팔 수 있어.','씨앗과 생활도구, 집에 놓을 살림도 이 거리에서 골라 보렴.']}),
 ],{ancient:true,country:id,entryAt:18,danger:'safe',district:'market',w:28,h:20,start:{x:14,y:16.3},ground:id==='goguryeo'?'#98a080':id==='baekje'?'#b8ad84':'#b6ae82',obstacles:[...boundary(28,20),...[[3,3],[4,3.6],[24,3],[25,4],[3,10],[25,11],[3,17],[24,17.5],[10,2.4],[19,2.3]].map(([x,y])=>({x,y,art:id==='goguryeo'?'pine':'tree'}))]});
 const trees=[[3,3],[4.2,3.5],[6,2.4],[8,3.2],[10.3,2.7],[13,3],[15.5,2.8],[18,3.1],[20.8,3.5],[3,6],[4.2,7],[3,9],[5,10.4],[6.3,12],[3.2,13],[4.3,15],[8,15.1],[11,14.8],[12,12.1],[12.2,8],[14,6],[17,6],[19.5,6.4],[20.6,9],[19.8,11],[20.5,14.7],[17,15.2],[15,15.5]];
 const forest=map(forestMap(id),c.name+' · 마을 외곽 숲','ancient-forest',[
  exit('life-forest-return',21,9,'생활마을로',c.village),
  ...WOOD_SPOTS.map(([x,y],n)=>entity(woodId(id,n+1),'lifeWood',x,y,'떨어진 목재',{art:'shop-wood-pile'})),
  prop('stump-a',9.2,6.3,'district-stump',56,46),prop('stump-b',17.2,11.1,'district-stump',62,48),
  prop('branch-a',7,8.7,'branchIcon',72,38),prop('branch-b',14.4,12.8,'branchIcon',66,36),
  ...[[5.5,5],[10,5.1],[10.2,10.8],[17.8,8.2],[7.3,13.7],[18.2,13.9]].map(([x,y],i)=>prop('brush-'+i,x,y,'district-brush',86,64)),
  prop('stone-a',5.7,8,'rock',68,46),prop('stone-b',18.2,4.6,'rock',84,59),
 ],{ancient:true,country:id,entryAt:18,danger:'safe',district:'forest',w:24,h:18,start:{x:19.7,y:9},ground:id==='goguryeo'?'#73866c':id==='baekje'?'#84936c':'#8a956d',obstacles:[...boundary(24,18),...trees.filter(([x,y])=>Math.hypot(x-21,y-9)>1.3&&WOOD_SPOTS.every(([a,b])=>Math.hypot(x-a,y-b)>1.3)).map(([x,y],i)=>({x,y,art:id==='goguryeo'||i%4===0?'pine':'tree'}))]});
 return [market,forest];
}
