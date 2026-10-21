import assert from 'node:assert/strict';
globalThis.Image=class{set src(v){}};
const {fresh,validate,ITEMS}=await import('../dist/state.js?v=54');
const {REGIONS,MAPS}=await import('../dist/regions/index.js?v=54');
const {prepareAncientQA}=await import('../dist/ancient-state.js?v=54');
const {ANCIENT_COUNTRIES,ancientWorld}=await import('../dist/regions/ancient.js?v=54');
const {atBoard,atTrader,marketMap,forestMap,BOARD,TRADER}=await import('../dist/life-access.js?v=54');
const {WOOD_SPOTS,woodId,collectWood,woodReady,LIFE_SHOPS,shopMap}=await import('../dist/life-shops.js?v=54');
const {plantCrop,harvestCrop,plantBatch,craftDecor,DECOR,HOME_LEVELS}=await import('../dist/homestead.js?v=54');
const {sellItem,sellGear}=await import('../dist/economy.js?v=54');
const {ensureOrders,focusOrder,deliverOrder,LIFE_ORDERS,startTransport,TRANSPORTS,deliverTransport}=await import('../dist/life-progression.js?v=54');
const make=c=>{const s=fresh('공간 검수','girl');s.completedRegions=REGIONS.slice(0,5).map(r=>r.id);s.unlockedRegions=REGIONS.map(r=>r.id);prepareAncientQA(s,{index:21},{country:c});return s;};
const loc=(s,map,x,y)=>Object.assign(s,{map,x,y});
let paths=0;
for(const c of Object.keys(ANCIENT_COUNTRIES)){
 const s=make(c),h=s.ancient.home;Object.assign(h,{level:4,fields:8,paddies:2});Object.assign(s.inventory,{millet:100,fish:10,hide:10,lumber:100});h.commerce.cart.owned=true;h.commerce.tools.seedBag=true;h.seeds.millet=10;s.inventory.gear.push('bronzeCharm');s.coins=5000;ensureOrders(s);
 const oldH=structuredClone(h),oldInventory=structuredClone(s.inventory);
 for(const map of ['ancient-home-'+c,'ancient-yard-'+c,'ancient-village-'+c,forestMap(c),'ancient-han',...Object.keys(LIFE_SHOPS).map(k=>shopMap(c,k)),marketMap(c)]){
  loc(s,map,3,3);const before=JSON.stringify(s);assert.equal(sellItem(s,ITEMS,'millet'),0);assert.equal(sellGear(s,ITEMS,'bronzeCharm'),0);assert.equal(deliverOrder(s,h.commerce.orders[0].id),null);assert.equal(focusOrder(s,h.commerce.orders[0].id),false);assert.equal(startTransport(s,'grain'),false);assert.equal(JSON.stringify(s),before,'forbidden mutations '+map);
  if(map!=='ancient-yard-'+c){assert.equal(plantCrop(s,'field-1','millet'),false);assert.equal(plantBatch(s,['field-1'],'millet'),false);assert.equal(harvestCrop(s,'field-1'),null);}assert.equal(craftDecor(s,'woodBox'),false);
 }
 loc(s,marketMap(c),TRADER.x,TRADER.y+1);assert.ok(atTrader(s));assert.equal(sellItem(s,ITEMS,'millet',5),15);assert.equal(sellGear(s,ITEMS,'bronzeCharm'),Math.floor(ITEMS.bronzeCharm.price/2));assert.equal(sellItem(s,ITEMS,'millet',95),285);loc(s,marketMap(c),TRADER.x+2,TRADER.y);assert.equal(sellItem(s,ITEMS,'fish'),0);
 loc(s,'ancient-village-'+c,BOARD.x,BOARD.y+1);assert.ok(atBoard(s));const o=h.commerce.orders[0],d=LIFE_ORDERS[o.key];Object.assign(s.inventory,d.items);assert.ok(focusOrder(s,o.id));const coins=s.coins;const delivery=deliverOrder(s,o.id);assert.equal(s.coins,coins+delivery.reward);assert.equal(deliverOrder(s,o.id),null);
 for(const key of Object.keys(TRANSPORTS)){loc(s,'ancient-village-'+c,BOARD.x,BOARD.y+1);Object.assign(s.inventory,TRANSPORTS[key].items);assert.ok(startTransport(s,key));const active=structuredClone(h.commerce.cart.active);const restored=validate(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored.ancient.home.commerce.cart.active,active);loc(s,'ancient-han',key==='grain'?14:17,key==='grain'?8:8.5);const got=deliverTransport(s,TRANSPORTS[key].target,active.id);assert.equal(got.reward,key==='grain'?88:117);assert.equal(deliverTransport(s,TRANSPORTS[key].target,active.id),null);}
 for(const [i,[x,y]]of WOOD_SPOTS.entries()){const id=woodId(c,i+1),now=Date.now();s.resources[id]={nextAt:now+50000,slot:0};loc(s,forestMap(c),x,y+1);let restored=validate(JSON.parse(JSON.stringify(s)));assert.equal(collectWood(restored,id,now),false);assert.equal(woodReady(restored,id,now+49999),false);assert.ok(collectWood(restored,id,now+50000));assert.equal(collectWood(restored,id,now+50000+179999),false);assert.ok(collectWood(restored,id,now+50000+180000));loc(s,'ancient-village-'+c,x,y);assert.equal(collectWood(s,id,now+1e6),false);}
 loc(s,'ancient-yard-'+c,12,9);assert.ok(plantCrop(s,'field-1','millet',Date.now()-180001));loc(s,'ancient-home-'+c,5,4);assert.equal(harvestCrop(s,'field-1'),null);loc(s,'ancient-yard-'+c,12,9);assert.equal(harvestCrop(s,'field-1').count,4);loc(s,'ancient-yard-'+c,17,9);assert.ok(craftDecor(s,'woodBox'));
 for(const level of [1,2,3,4]){h.level=level;h.fields=HOME_LEVELS[level].fields;h.paddies=0;assert.equal(ancientWorld(MAPS['ancient-home-'+c],s).entities.some(e=>e.id==='life-board'),false);assert.ok(ancientWorld(MAPS['ancient-home-'+c],s).entities.some(e=>e.id==='ancient-chapters'));}
 h.level=4;h.fields=8;
 const village=MAPS['ancient-village-'+c],market=MAPS[marketMap(c)],forest=MAPS[forestMap(c)];assert.equal(village.entities.some(e=>e.type==='shop'||e.type==='lifeWood'||e.shopKind),false);assert.equal(market.entities.filter(e=>e.shopKind).length,4);assert.equal(forest.entities.filter(e=>e.type==='lifeWood').length,2);
 for(const m of [village,market,forest]){
  const blocked=(x,y)=>x<1||x>m.w-2||y<1||y>m.h-2||m.obstacles.some(o=>Math.abs(o.x-x)<.65&&Math.abs(o.y-y)<.6)||m.entities.some(e=>(e.solid||e.actor||['npc','shop'].includes(e.type))&&Math.abs(e.x-x)<(e.footprint?.[0]||(e.solid?1:.48))&&Math.abs(e.y-y)<(e.footprint?.[1]||(e.solid?.65:.42)));
  const queue=[[Math.round(m.start.x*4)/4,Math.round(m.start.y*4)/4]],seen=new Set();while(queue.length){const [x,y]=queue.pop(),key=x+','+y;if(seen.has(key)||blocked(x,y))continue;seen.add(key);for(const [dx,dy]of [[.25,0],[-.25,0],[0,.25],[0,-.25]])queue.push([x+dx,y+dy]);}
  assert.ok(seen.size,'safe spawn '+m.id);for(const e of m.entities.filter(e=>['exit','house','shop','lifeRequests','lifeWood'].includes(e.type))){assert.ok([...seen].some(k=>{const [x,y]=k.split(',').map(Number);return Math.hypot(x-e.x,y-e.y)<1.6;}),'walk reachable '+m.id+'/'+e.id);paths++;}
 }
 for(const k of Object.keys(LIFE_SHOPS)){const room=MAPS[shopMap(c,k)];assert.equal(room.returnTo.map,marketMap(c));const restored=validate({...structuredClone(s),map:room.id,x:5,y:5});assert.equal(restored.map,room.id);assert.equal(MAPS[restored.map].entities[0].to,marketMap(c));}
 loc(s,marketMap(c),25,17);assert.equal(validate(structuredClone(s)).map,marketMap(c),'larger map save bounds');
}
for(const map of ['paleo-village','pre-village','bronze-village','go-village','nation-iron-village']){const s=make('baekje');s.map=map;s.inventory.fish=2;assert.equal(sellItem(s,ITEMS,'fish'),6,'old-era sale rule '+map);}
console.log('v53 spaces: 3 countries, 6 new maps, '+paths+' physically reachable destinations; precise dealer/board/workbench checks; remote/stale mutations refused; old wood IDs and 3-minute timestamps; both cargo rewards; house desk removal; larger-map/store saves; all earlier-era sale rules unchanged.');
