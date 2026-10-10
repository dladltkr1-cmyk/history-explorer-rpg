// Additive life progression. No historical quest, combat, server or currency contract changes.
export const UPGRADE_GATES={2:{reputation:8,requests:0,harvest:true},3:{reputation:22,requests:4},4:{reputation:45,requests:10}};
export const LIFE_TOOLS={
 seedBag:{name:'씨앗 주머니',coins:100,materials:{lumber:2},reputation:4,level:1,art:'life-seedBag',text:'빈 재배칸을 골라 같은 씨앗을 한 번에 심기'},
 sickle:{name:'기본 철제 낫',coins:220,materials:{lumber:3,hide:1},reputation:10,level:2,art:'life-sickle',text:'익은 작물을 한 번에 수확 · 수확량은 그대로'},
 hearth:{name:'개선된 화로',coins:180,materials:{lumber:3},reputation:8,level:2,art:'life-hearth',text:'같은 음식 2개를 한 번에 조리'},
};
export const LIFE_ORDERS={
 millet:{name:'이웃의 곡식 바구니',items:{millet:4},value:12,rep:3,level:1,art:'life-crop-millet'},
 barnyard:{name:'마을의 잡곡 나눔',items:{barnyard:4},value:16,rep:3,level:1,art:'life-crop-barnyard'},
 sorghum:{name:'붉은 곡식 부탁',items:{sorghum:4},value:20,rep:3,level:1,art:'life-crop-sorghum'},
 barley:{name:'보리 한 바구니',items:{barley:4},value:20,rep:3,level:1,art:'life-crop-barley'},
 fish:{name:'강가의 물고기 부탁',items:{fish:2},value:12,rep:2,level:1,rod:true,art:'fish'},
 cookedfish:{name:'따뜻한 생선 식사',items:{cookedfish:2},value:18,rep:3,level:2,rod:true,fire:true,art:'cookedfish'},
 hide:{name:'바람을 막아 줄 가죽',items:{hide:1},value:15,rep:2,level:2,art:'hide'},
 ricecrop:{name:'논에서 기른 귀한 곡식',items:{ricecrop:4},value:32,rep:4,level:3,paddy:true,art:'life-crop-ricecrop'},
 mixed:{name:'여럿이 나누는 잡곡',items:{millet:4,barnyard:4},value:28,rep:4,level:3,reputation:30,art:'life-grainRack'},
};
export const TRANSPORTS={
 grain:{name:'한강 나루의 곡식 운송',items:{millet:12,barnyard:8},value:68,rep:5,target:'life-han-delivery',map:'ancient-han',art:'life-cart-loaded',text:'마을 동쪽 강가 길 → 한강 나루의 받는 사람'},
 workshop:{name:'강가 작업장의 보리와 가죽',items:{barley:12,hide:2},value:90,rep:4,target:'life-han-workshop',map:'ancient-han',art:'life-cart-loaded',text:'마을 동쪽 강가 길 → 강가 작업장의 받는 사람'},
};
export const CART_RECIPE={coins:350,materials:{lumber:6,hide:2}};
export const reputationName=n=>n<10?'새로 온 사람':n<30?'마을에 익숙한 사람':n<55?'믿음받는 사람':n<80?'이름난 사람':'마을의 신뢰를 얻은 사람';
export const addReputation=(h,n)=>{h.reputation=Math.min(100,h.reputation+n);};
export const orderReward=order=>Math.round(order.value*1.25);
export const transportReward=order=>Math.round(order.value*1.30);
export function freshCommerce(){return {revision:1,orders:[],nextId:1,completed:0,history:[],focus:null,legacyBulkHarvest:false,tools:{seedBag:false,sickle:false,hearth:false},cart:{owned:false,commissioned:false,active:null,nextId:1,completed:0}};}
const int=(v,min=0,max=99999)=>Number.isInteger(v)&&v>=min&&v<=max;
const plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
export function validateCommerce(h){const c=h.commerce;
 if(!plain(c)||c.revision!==1||!int(c.nextId,1,1e9)||!int(c.completed)||!Array.isArray(c.orders)||![0,3].includes(c.orders.length)||!Array.isArray(c.history)||c.history.length>30||typeof c.legacyBulkHarvest!=='boolean'||!plain(c.tools)||Object.keys(LIFE_TOOLS).some(id=>typeof c.tools[id]!=='boolean')||!plain(c.cart))throw Error('생활 성장 기록이 올바르지 않다.');
 if(c.history.length>c.completed||(c.orders.length===0&&c.history.length))throw Error('부탁 완료 기록이 올바르지 않다.');
 const ids=new Set();for(const o of [...c.orders,...c.history]){if(!plain(o)||!int(o.id,1,c.nextId-1)||!Object.hasOwn(LIFE_ORDERS,o.key)||ids.has(o.id))throw Error('마을 부탁 기록이 올바르지 않다.');ids.add(o.id);}
 if(c.focus!==null&&!c.orders.some(o=>o.id===c.focus))throw Error('선택한 부탁이 없다.');
 const cart=c.cart;if(typeof cart.owned!=='boolean'||typeof cart.commissioned!=='boolean'||!int(cart.nextId,1,1e9)||!int(cart.completed))throw Error('수레 기록이 올바르지 않다.');
 if(cart.active!==null&&(!cart.owned||!plain(cart.active)||!int(cart.active.id,1,cart.nextId-1)||!Object.hasOwn(TRANSPORTS,cart.active.key)||!['goguryeo','baekje','silla'].includes(cart.active.country)))throw Error('운송 기록이 올바르지 않다.');
}
export function upgradeConditions(s){const h=s.ancient.home,g=UPGRADE_GATES[h.level+1];return !g?null:{reputation:h.reputation>=g.reputation,requests:h.commerce.completed>=g.requests,harvest:!g.harvest||Object.values(h.harvested).some(n=>n>0)};}
export function canGrow(s){const c=upgradeConditions(s);return c&&Object.values(c).every(Boolean);}
const owned=s=>Boolean(s.ancient?.country&&s.ancient.home.owned);
export function eligibleOrders(s){const h=s.ancient.home;return Object.keys(LIFE_ORDERS).filter(id=>{const o=LIFE_ORDERS[id];return h.level>=o.level&&h.reputation>=(o.reputation||0)&&(!o.paddy||h.paddies>0)&&(!o.rod||s.inventory.fishingrod>0)&&(!o.fire||s.artifacts.includes('fire'));});}
function newOrder(s,slot){const c=s.ancient.home.commerce,eligible=eligibleOrders(s);const pool=slot<2?eligible.filter(id=>['millet','barnyard','sorghum','barley'].includes(id)):eligible.filter(id=>!['millet','barnyard'].includes(id));const other=c.orders.map(o=>o.key),options=pool.filter(k=>!other.includes(k));const list=options.length?options:pool;const key=list[(c.nextId-1)%list.length];return {id:c.nextId++,key};}
export function ensureOrders(s){if(!owned(s))return false;const c=s.ancient.home.commerce;if(c.orders.length)return false;for(let i=0;i<3;i++)c.orders.push(newOrder(s,i));return true;}
export function hasMaterials(s,items){return Object.entries(items).every(([id,n])=>(s.inventory[id]||0)>=n);}
const take=(s,items)=>{for(const [id,n]of Object.entries(items))s.inventory[id]-=n;};
export function focusOrder(s,id){if(!owned(s))return false;const c=s.ancient.home.commerce;if(id!==null&&!c.orders.some(o=>o.id===id))return false;c.focus=id;return true;}
export function deliverOrder(s,id){if(!owned(s)||s.map!=='ancient-village-'+s.ancient.country)return null;const h=s.ancient.home,c=h.commerce,slot=c.orders.findIndex(o=>o.id===id),o=c.orders[slot],d=LIFE_ORDERS[o?.key];
 if(!d||!hasMaterials(s,d.items)||c.completed>=99999)return null;
 take(s,d.items);const reward=orderReward(d);s.coins+=reward;addReputation(h,d.rep);c.completed++;c.history.push(o);c.history=c.history.slice(-30);c.orders.splice(slot,1);c.orders.splice(slot,0,newOrder(s,slot));if(c.focus===id)c.focus=null;return {reward,rep:d.rep};
}
export function buyTool(s,id){const h=s.ancient?.home,d=LIFE_TOOLS[id];if(!owned(s)||!s.map.startsWith('ancient-home-')&&!s.map.startsWith('ancient-yard-')||!d||h.commerce.tools[id]||h.level<d.level||h.reputation<d.reputation||s.coins<d.coins||!hasMaterials(s,d.materials))return false;
 s.coins-=d.coins;take(s,d.materials);h.commerce.tools[id]=true;return true;
}
export function commissionCart(s){if(!owned(s)||s.map!=='ancient-village-'+s.ancient.country||s.ancient.home.level<3||s.ancient.home.commerce.cart.owned)return false;s.ancient.home.commerce.cart.commissioned=true;return true;}
export function buildCart(s){const cart=s.ancient?.home.commerce.cart;if(!owned(s)||s.map!=='ancient-village-'+s.ancient.country||s.ancient.home.level<3||!cart.commissioned||cart.owned||s.coins<CART_RECIPE.coins||!hasMaterials(s,CART_RECIPE.materials))return false;s.coins-=CART_RECIPE.coins;take(s,CART_RECIPE.materials);cart.owned=true;return true;}
export function startTransport(s,key){const c=s.ancient?.home?.commerce?.cart,d=TRANSPORTS[key];if(!owned(s)||s.map!=='ancient-village-'+s.ancient.country||!c.owned||c.active||!d||(s.progress.ancient||0)<20||!hasMaterials(s,d.items))return false;c.active={id:c.nextId++,key,country:s.ancient.country};s.mounted=false;return true;}
export function cancelTransport(s){const c=s.ancient?.home?.commerce?.cart;if(!c?.active)return false;c.active=null;return true;}
export function deliverTransport(s,target,id){const h=s.ancient?.home,c=h?.commerce.cart,a=c?.active,d=TRANSPORTS[a?.key];if(!owned(s)||!a||a.id!==id||!d||s.map!==d.map||d.target!==target||Math.hypot(s.x-(target==='life-han-delivery'?14:17),s.y-(target==='life-han-delivery'?7:7.5))>1.65||!hasMaterials(s,d.items)||c.completed>=99999)return null;
 take(s,d.items);const reward=transportReward(d);s.coins+=reward;addReputation(h,d.rep);c.completed++;c.active=null;return {reward,rep:d.rep};}
export function hasBulkHarvest(s){const c=s.ancient?.home?.commerce;return Boolean(c?.tools.sickle||c?.legacyBulkHarvest);}
