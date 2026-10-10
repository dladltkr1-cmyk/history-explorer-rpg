// Deterministic income progression using production/actions, not QA grants. Clock acceleration is explicit.
import assert from 'node:assert/strict';
globalThis.Image=class{set src(v){}};
const {fresh,ITEMS}=await import('../dist/state.js?v=49');
import {REGIONS} from '../dist/regions/index.js?v=49';
import {prepareAncientQA} from '../dist/ancient-state.js?v=49';
import {CROPS,HOME_LEVELS,activePlots,plotState,plantCrop,harvestCrop,buyLife,buyLumber,upgradeHome} from '../dist/homestead.js?v=49';
import {LIFE_ORDERS,LIFE_TOOLS,ensureOrders,deliverOrder,buyTool,canGrow} from '../dist/life-progression.js?v=49';
import {sellItem,salePrice} from '../dist/economy.js?v=49';
for(const [id,c]of Object.entries(CROPS))console.log(`${c.name}: sale ${c.sale*4}, seed ${c.seed}, net ${c.sale*4-c.seed}, net/min ${((c.sale*4-c.seed)/c.minutes).toFixed(2)}`);
for(const supplemental of [0,3]){
 const s=fresh('경제 검수','boy');s.completedRegions=REGIONS.slice(0,5).map(r=>r.id);s.unlockedRegions=REGIONS.map(r=>r.id);prepareAncientQA(s,'4c',{country:'baekje'});s.coins=0;s.inventory.lumber=2;s.inventory.fishingrod=0;const h=s.ancient.home;let now=Date.now(),start=now,last=now,firstSale=false;const milestones={};let completedIncome=0,sales=0,supplement=0;
 ensureOrders(s);
 for(let cycle=0;cycle<500&&h.level<4;cycle++){
  s.map='ancient-home-baekje';for(const p of activePlots(h))harvestCrop(s,p.id,now);
  s.map='ancient-village-baekje';for(let pass=0;pass<6;pass++)for(const o of [...h.commerce.orders]){const r=deliverOrder(s,o.id);if(r)completedIncome+=r.reward;}
  // Sell excess while preserving each available farming order's requirements.
  const needed={};for(const o of h.commerce.orders)for(const [id,n]of Object.entries(LIFE_ORDERS[o.key].items))needed[id]=Math.max(needed[id]||0,n);
  for(const c of Object.values(CROPS)){const n=Math.max(0,(s.inventory[c.item]||0)-(needed[c.item]||0));if(n){sales+=sellItem(s,ITEMS,c.item,n);firstSale=true;}}
  // Model an optional 3 net coins/min from existing fishing/hunting. This is an estimate, not an actual reward action.
  const extra=(now-last)/60000*supplemental;last=now;s.coins+=extra;supplement+=extra;
  s.map='ancient-home-baekje';if(!h.commerce.tools.seedBag&&h.reputation>=4&&s.coins>=120){if(s.inventory.lumber<2)while(s.inventory.lumber<2&&s.coins>=8)buyLumber(s);if(buyTool(s,'seedBag'))milestones.seedBag=(now-start)/60000;}
  const d=HOME_LEVELS[h.level+1];if(d&&canGrow(s)&&s.coins>=d.coins+Math.max(0,d.lumber-s.inventory.lumber)*8+15){while(s.inventory.lumber<d.lumber)assert.ok(buyLumber(s));assert.ok(upgradeHome(s));milestones[h.level]=(now-start)/60000;}
  if(!firstSale&&s.inventory.millet>0){sales+=sellItem(s,ITEMS,'millet');firstSale=true;}
  const cropNeed=h.commerce.orders.flatMap(o=>Object.entries(LIFE_ORDERS[o.key].items)).filter(([id])=>CROPS[id]?.kind==='field').sort(([a],[b])=>CROPS[a].minutes-CROPS[b].minutes);
  for(const p of activePlots(h).filter(p=>!p.crop&&p.id.startsWith('field'))){const planned={};for(const pl of activePlots(h))if(pl.crop)planned[pl.crop]=(planned[pl.crop]||0)+4;let id=cropNeed.find(([id,n])=>(s.inventory[id]||0)+(planned[id]||0)<n)?.[0]||'millet';if(!h.seeds[id]&&!buyLife(s,'seed',id))id=Object.keys(CROPS).find(id=>CROPS[id].kind==='field'&&h.seeds[id]>0);if(id&&h.seeds[id])assert.ok(plantCrop(s,p.id,id,now));}
  const times=activePlots(h).filter(p=>p.crop).map(p=>p.plantedAt+CROPS[p.crop].minutes*60000).filter(n=>n>now);assert.ok(times.length,'zero currency stalls');now=Math.min(...times)+15000;
 }
 assert.equal(h.level,4);assert.ok(h.commerce.completed>=10);assert.ok(h.commerce.tools.seedBag);console.log(JSON.stringify({model:supplemental?'mixed estimate (+3 net/min)':'farming only',minutes:milestones,requests:h.commerce.completed,orderIncome:completedIncome,sales,supplement:Math.round(supplement),coins:Math.round(s.coins),reputation:h.reputation}));
}
