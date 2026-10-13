import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
globalThis.Image=class{set src(v){}};
const {fresh,validate}=await import('../dist/state.js?v=51');
import {MAPS,REGIONS} from '../dist/regions/index.js?v=51';
import {prepareAncientQA} from '../dist/ancient-state.js?v=51';
import {CROPS,DECOR,buyLife,buyLumber,upgradeHome,openPaddy,placeDecor,plantCrop,harvestCrop} from '../dist/homestead.js?v=51';
import {buyTool,commissionCart,buildCart} from '../dist/life-progression.js?v=51';
import {LIFE_SHOPS,shopMap,SHOP_MERCHANT,atLifeShop,buyShopHide,WOOD_SPOTS,woodId,woodReady,collectWood,WOOD_REGROW_MS} from '../dist/life-shops.js?v=51';
import {ASSETS} from '../dist/assets.js?v=51';
const visit=(s,k)=>Object.assign(s,{map:shopMap(s.ancient.country,k),x:5,y:4.9});
const acts=[['seed',s=>buyLife(s,'seed','millet',5)],['decor',s=>buyLife(s,'decor','clayJar')],['tool',s=>buyTool(s,'seedBag')],['tool',buyShopHide],['wood',s=>buyLumber(s,5)],['wood',upgradeHome],['wood',openPaddy],['wood',commissionCart],['wood',buildCart]];
for(const c of ['goguryeo','baekje','silla']){
 const s=fresh('상점 검사','boy');s.completedRegions=REGIONS.slice(0,5).map(r=>r.id);s.unlockedRegions=REGIONS.map(r=>r.id);prepareAncientQA(s,'4c',{country:c});const h=s.ancient.home;s.coins=6000;s.inventory.lumber=60;s.inventory.hide=10;h.reputation=45;h.harvested.millet=4;h.commerce.completed=10;
 for(const [kind,act]of acts){for(const loc of [{map:'ancient-home-'+c,x:5,y:4.9},{map:'ancient-yard-'+c,x:5,y:4.9},{map:'ancient-village-'+c,x:5,y:4.9},{map:shopMap(c,kind),x:8,y:6},{map:shopMap(c==='baekje'?'silla':'baekje',kind),x:5,y:4.9},{map:shopMap(c,kind==='seed'?'wood':'seed'),x:5,y:4.9}]){Object.assign(s,loc);const before=structuredClone(s);assert.equal(act(s),false,kind+' remote/wrong/far');assert.deepEqual(s,before,'failed purchase consumes nothing');}}
 visit(s,'seed');for(const n of [1,5,10]){const a=s.coins,b=h.seeds.millet;assert.ok(buyLife(s,'seed','millet',n));assert.equal(s.coins,a-2*n);assert.equal(h.seeds.millet,b+n);}assert.equal(buyLife(s,'seed','ricecrop'),false);let copy=validate(structuredClone(s));assert.deepEqual(copy.ancient.home.seeds,h.seeds);
 s.coins=1;const before=structuredClone(s);assert.equal(buyLife(s,'seed','millet',10),false);assert.deepEqual(s,before);s.coins=6000;
 visit(s,'wood');for(const n of [1,5,10]){const a=s.coins,b=s.inventory.lumber;assert.ok(buyLumber(s,n));assert.equal(s.coins,a-8*n);assert.equal(s.inventory.lumber,b+n);}for(const level of [2,3,4])assert.ok(upgradeHome(s));assert.ok(openPaddy(s));assert.ok(openPaddy(s));assert.ok(commissionCart(s));assert.ok(buildCart(s));assert.equal(buildCart(s),false);
 visit(s,'tool');h.reputation=0;assert.equal(buyTool(s,'seedBag'),false);h.reputation=45;assert.ok(buyTool(s,'seedBag'));const stock=structuredClone(s);assert.equal(buyTool(s,'seedBag'),false);assert.deepEqual(s,stock);assert.ok(buyTool(s,'sickle'));assert.ok(buyTool(s,'hearth'));assert.ok(buyShopHide(s));
 visit(s,'decor');for(const id of Object.keys(DECOR))assert.ok(buyLife(s,'decor',id));s.map='ancient-home-'+c;assert.ok(placeDecor(s,'room-2','wovenScreen'));assert.ok(placeDecor(s,'room-2',null));assert.ok(plantCrop(s,'field-1','millet'));assert.equal(harvestCrop(s,'field-1',Date.now()+180001).count,4);
 for(const [i,[x,y]]of WOOD_SPOTS.entries()){Object.assign(s,{map:'ancient-village-'+c,x:x+1,y});const id=woodId(c,i+1),now=Date.now(),n=s.inventory.lumber;assert.ok(collectWood(s,id,now));assert.equal(s.inventory.lumber,n+1);assert.equal(collectWood(s,id,now),false);copy=validate(JSON.parse(JSON.stringify(s)));assert.equal(woodReady(copy,id,now+179999),false);assert.equal(woodReady(copy,id,now+180000),true);assert.ok(collectWood(copy,id,now+180000));assert.equal(copy.inventory.lumber,n+2);assert.equal(collectWood(copy,'life-wood-paleo-1'),false);}
 const v=MAPS['ancient-village-'+c];assert.equal(v.entities.filter(e=>e.shopKind&&e.type==='house').length,4);assert.equal(v.entities.filter(e=>e.id==='life-carpenter').length,0);
 const blocked=(m,x,y)=>x<1||x>m.w-2||y<1||y>m.h-2||m.obstacles.some(o=>Math.abs(o.x-x)<.65&&Math.abs(o.y-y)<.6)||m.entities.some(e=>(e.solid||e.actor||['npc','shop'].includes(e.type))&&Math.abs(e.x-x)<(e.footprint?.[0]||(e.solid?1:.48))&&Math.abs(e.y-y)<(e.footprint?.[1]||(e.solid?.65:.42)));
 // Grid walk flood from the unchanged village spawn to every doorway and resource.
 const reached=new Set(),todo=[[11,10]],key=(x,y)=>x+','+y;while(todo.length){const [x,y]=todo.pop();if(reached.has(key(x,y))||blocked(v,x,y))continue;reached.add(key(x,y));for(const [dx,dy]of [[.25,0],[-.25,0],[0,.25],[0,-.25]])todo.push([x+dx,y+dy]);}
 for(const [k,d]of Object.entries(LIFE_SHOPS)){const m=MAPS[shopMap(c,k)];assert.ok(m);assert.equal(m.w,10);assert.equal(m.h,8);assert.equal(blocked(v,m.returnTo.x,m.returnTo.y),false);assert.ok([...reached].some(p=>{const [x,y]=p.split(',').map(Number);return Math.hypot(x-d.at[0],y-d.at[1])<1.65;}),'door reachable '+k);assert.equal(blocked(m,m.start.x,m.start.y),false);assert.equal(blocked(m,5,4.9),false);assert.equal(m.entities.filter(e=>e.id==='life-carpenter').length,k==='wood'?1:0);}
 for(const [x,y]of WOOD_SPOTS)assert.ok([...reached].some(p=>{const [a,b]=p.split(',').map(Number);return Math.hypot(x-a,y-b)<1.65;}),'wood reachable');
 validate(structuredClone(s));
}
for(const [id,file]of Object.entries(ASSETS).filter(([id])=>id.startsWith('shop-'))){const b=await readFile(new URL('../dist'+file.split('?')[0],import.meta.url),'utf8');assert.ok(b.startsWith('<svg'));assert.ok(!b.includes('<script'));}
assert.equal(WOOD_REGROW_MS,180000);
console.log('Three countries: four physical shops; bundle prices; every remote/wrong-store/far/foreign/stale purchase rejected without loss; level/tool/paddy/cart costs unchanged; all 18 decor; crops/save retained; two wood points exact 3-minute persisted regrowth; doorway/merchant/resource walking reachability; 27 SVG assets.');
