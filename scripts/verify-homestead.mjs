import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
globalThis.Image=class{set src(v){}get complete(){return false;}};
const {fresh,validate,ITEMS,abilities}=await import('../dist/state.js?v=48');
import {MAPS,REGIONS} from '../dist/regions/index.js?v=48';
import {ANCIENT_COUNTRIES,ancientWorld} from '../dist/regions/ancient.js?v=48';
import {prepareAncientQA,setAncientCentury} from '../dist/ancient-state.js?v=48';
import {CROPS,DECOR,DECOR_SLOTS,HOME_LEVELS,activePlots,plotState,plantCrop,harvestCrop,buyLife,buyLumber,upgradeHome,openPaddy,placeDecor,craftDecor,meetsLifeRequirements,setLifeLevel,roomLayout} from '../dist/homestead.js?v=48';
import {salePrice,sellItem} from '../dist/economy.js?v=48';
import {ASSETS} from '../dist/assets.js?v=48';
const trial=country=>{const s=fresh('생활 검수','boy');s.completedRegions=REGIONS.slice(0,5).map(r=>r.id);s.unlockedRegions=REGIONS.map(r=>r.id);prepareAncientQA(s,'4c',{country});s.map=ANCIENT_COUNTRIES[country].home;return s;};
const now=Date.now();
for(const [country,countryDef]of Object.entries(ANCIENT_COUNTRIES)){
 const s=trial(country),h=s.ancient.home,stats=abilities(s);assert.equal(s.saveVersion,3);assert.equal(h.level,1);assert.equal(activePlots(h).length,2);assert.equal(h.reputation,0);assert.equal(h.starterGranted,true);assert.equal(h.seeds.millet,2);assert.equal(s.inventory.lumber,2);
 const start=structuredClone(s);assert.equal(openPaddy(s),false);assert.equal(plantCrop(s,'paddy-1','ricecrop',now),false);assert.equal(upgradeHome(s),false);assert.deepEqual(s,start,'failed actions do not mutate');
 assert.equal(plantCrop(s,'field-1','millet',now),true);const planted=structuredClone(h.plots[0]);assert.equal(plantCrop(s,'field-1','barnyard',now),false);assert.equal(h.seeds.barnyard,2);
 assert.equal(harvestCrop(s,'field-1',now+179999),null);assert.equal(plotState(h.plots[0],now+180000).status,'ready');
 assert.equal(harvestCrop(s,'field-1',now+180000).count,4);assert.equal(harvestCrop(s,'field-1',now+180000),null);assert.equal(h.reputation,1);assert.equal(h.harvested.millet,4);
 assert.equal(sellItem(s,ITEMS,'millet',4),12);assert.equal(s.coins,12);assert.equal(sellItem(s,ITEMS,'millet',4),0);
 assert.equal(buyLife(s,'seed','millet'),true);assert.equal(s.coins,10);assert.equal(buyLife(s,'seed','ricecrop'),false);assert.equal(buyLumber(s),true);assert.equal(s.coins,2);
 // Exact upgrade debit, persistent planted crops and country-independent capabilities.
 assert.equal(plantCrop(s,'field-2','barnyard',now),true);s.coins=2000;s.inventory.lumber=20;
 for(const level of [2,3,4]){const before=s.coins,wood=s.inventory.lumber,d=HOME_LEVELS[level];assert.equal(upgradeHome(s),true);assert.equal(h.level,level);assert.equal(h.fields,d.fields);assert.equal(s.coins,before-d.coins);assert.equal(s.inventory.lumber,wood-d.lumber);assert.deepEqual(h.plots[1],{id:'field-2',crop:'barnyard',plantedAt:now});assert.equal(activePlots(h).length,d.fields+h.paddies);}
 assert.equal(upgradeHome(s),false);assert.equal(h.reputation,7);assert.deepEqual(abilities(s),stats);assert.equal(openPaddy(s),true);assert.equal(openPaddy(s),true);assert.equal(openPaddy(s),false);assert.equal(activePlots(h).length,10);
 for(const [i,[id,c]]of Object.entries(Object.entries(CROPS))){h.seeds[id]=2;const plot=c.kind==='paddy'?'paddy-1':'field-'+(Number(i)+3);assert.equal(plantCrop(s,plot,id,now),true);assert.equal(plantCrop(s,plot,c.kind==='paddy'?'millet':'ricecrop',now),false);const p=h.plots.find(p=>p.id===plot);assert.equal(plotState(p,now+c.minutes*60000-1).status,'growing');assert.equal(plotState(p,now+c.minutes*60000).status,'ready');const resumed=validate(JSON.parse(JSON.stringify(s)));assert.deepEqual(resumed.ancient.home.plots,h.plots);assert.equal(harvestCrop(s,plot,now+c.minutes*60000).count,4);assert.equal(salePrice(ITEMS[c.item]),c.sale);assert.equal(sellItem(s,ITEMS,c.item,4),4*c.sale);}
 assert.equal(placeDecor(s,'yard-1','reedMat'),false);assert.equal(placeDecor(s,'room-2','clayJar'),false,'cannot place one owned jar twice');assert.equal(buyLife(s,'decor','clayJar'),true);assert.equal(placeDecor(s,'room-2','clayJar'),true);assert.equal(placeDecor(s,'room-2',null),true);assert.equal(h.decorations.clayJar,2);assert.equal(craftDecor(s,'woodBox'),true);assert.equal(h.decorations.woodBox,1);assert.equal(placeDecor(s,'yard-2','woodBox'),true);
 assert.equal(meetsLifeRequirements(s,{homeLevel:4,reputation:7,produced:{millet:4},paddy:true}),true);assert.equal(meetsLifeRequirements(s,{reputation:100}),false);
 const life=JSON.stringify(h);for(const century of [4,5,6]){assert.equal(setAncientCentury(s,century,{admin:true}),true);assert.equal(JSON.stringify(s.ancient.home),life);assert.deepEqual(validate(JSON.parse(JSON.stringify(s))).ancient.home,h);}
 for(const level of [1,2,3,4]){setLifeLevel(h,level);for(const map of [ancientWorld(MAPS[countryDef.home],s),ancientWorld(MAPS['ancient-yard-'+country],s)]){assert.equal(map.entities.some(e=>e.id==='life-board'||e.id==='life-yard-board'),true);for(const e of map.entities){if(e.type==='lifeDecor')continue;assert.ok(e.x>=1&&e.x<map.w-1&&e.y>=1&&e.y<map.h-1,'inside '+level+' '+e.id);assert.ok(!map.obstacles.some(o=>Math.abs(o.x-e.x)<.65&&Math.abs(o.y-e.y)<.6),'obstacle-free '+e.id);}assert.ok(map.entities.every(e=>!e.to||MAPS[e.to]));}assert.equal(ancientWorld(MAPS[countryDef.home],s).w,HOME_LEVELS[level].room[0]);}
 s.map='ancient-han';assert.equal(plantCrop(s,'field-1','millet',now),false);assert.equal(buyLife(s,'seed','millet'),false);
}
const old=trial('baekje');old.personalCode='HE123456';old.inventory.food=17;old.map='ancient-home-baekje';old.x=18;old.y=13;
for(const key of ['lifeRevision','level','fields','paddies','seeds','plots','decorations','placements','reputation','harvested','starterGranted'])delete old.ancient.home[key];
const migrated=validate(old);assert.equal(migrated.personalCode,old.personalCode);assert.equal(migrated.inventory.food,17);assert.equal(migrated.progress.ancient,19);assert.equal(migrated.map,old.map);assert.deepEqual([migrated.x,migrated.y],[5,5.2]);assert.equal(migrated.ancient.home.level,1);const seeds=structuredClone(migrated.ancient.home.seeds);assert.deepEqual(validate(migrated).ancient.home.seeds,seeds,'starter grant is once only');
for(const corrupt of [s=>s.ancient.home.level=5,s=>s.ancient.home.reputation=-1,s=>s.ancient.home.seeds.millet=1.5,s=>s.ancient.home.seeds.mystery=1,s=>s.ancient.home.plots.pop(),s=>s.ancient.home.plots[0]={id:'field-1',crop:'ricecrop',plantedAt:now},s=>s.ancient.home.plots[0].plantedAt=-1,s=>s.ancient.home.placements['room-2']='woodBox']){const bad=trial('baekje');corrupt(bad);assert.throws(()=>validate(bad));}
for(const [key,file]of Object.entries(ASSETS).filter(([key])=>key.startsWith('life-'))){const contents=await readFile(new URL('../dist'+file.split('?')[0],import.meta.url),'utf8');assert.ok(contents.startsWith('<svg'));assert.ok(!contents.includes('<script'));}
assert.equal(salePrice(ITEMS.fish),6);assert.equal(salePrice(ITEMS.hide),15);assert.equal(salePrice(ITEMS.food),11);
console.log('Homestead: 3 countries × 4 stages; five exact growth deadlines/4-unit harvests/prices; no double sow/harvest, wrong plot or locked paddy; exact upgrade/seed/material debits; decor ownership/placement/craft; legacy migration and once-only starter; 4/5/6 century conservation; corrupt saves rejected; all new SVG assets exist; existing fish/hunt/food economy retained.');
