// Drop rules are independent of era and combat calculations.
export const DROPS={boar:{item:'rawmeat',doubleChance:.15},wolf:{item:'hide'},snake:{item:'rawmeat'},bear:{item:'rawmeat',doubleChance:.22,extraItem:'hide',extraChance:.12},tiger:{item:'hide',doubleChance:.25},bandit:{berriesChance:.4,coinsChance:.25,minCoins:5,maxCoins:15}};
export function rollRoomReward(random=Math.random){
  const roll=random();
  if(roll<.08)return {coins:10+Math.floor(random()*11)};
  if(roll<.78)return {item:['berries','rawmeat','food','fish','grain'][Math.floor(random()*5)]};
  return {};
}
export function rollDrop(enemy,random=Math.random){
  const rule=DROPS[enemy];if(!rule)return {items:{},coins:0};
  if(rule.item){const items={[rule.item]:rule.doubleChance&&random()<rule.doubleChance?2:1};if(rule.extraItem&&random()<rule.extraChance)items[rule.extraItem]=1;return {items,coins:0};}
  if(!rule.berriesChance)return {items:{},coins:0};
  const roll=random();if(roll<rule.berriesChance)return {items:{berries:random()<.25?2:1},coins:0};
  if(roll<rule.berriesChance+rule.coinsChance)return {items:{},coins:rule.minCoins+Math.floor(random()*(rule.maxCoins-rule.minCoins+1))};
  return {items:{},coins:0};
}
export const COOKING={rawmeat:'food',fish:'cookedfish',ricecrop:'rice'};
export const RESPAWN_MS=120000,ENCOUNTER_PROTECTION_MS=45000;
export function salePrice(item){return item?.sellable&&['food','material'].includes(item.kind)?item.salePrice??Math.floor(item.price/2):0;}
export function sellItem(state,items,id,count=1){const price=salePrice(items[id]);if(!price||!Number.isInteger(count)||count<1||(state.inventory[id]||0)<count)return 0;state.inventory[id]-=count;state.coins+=price*count;return price*count;}
export function gearSalePrice(item){return item&&['weapon','clothes','accessory'].includes(item.kind)&&!item.questOnly?Math.floor(item.price/2):0;}
export function sellGear(state,items,id){
  const price=gearSalePrice(items[id]);
  if(!price||!state.inventory.gear.includes(id)||Object.values(state.equipment).includes(id))return 0;
  state.inventory.gear.splice(state.inventory.gear.indexOf(id),1);
  state.coins+=price;
  return price;
}
export function cookItem(state,id,count=1){const out=COOKING[id];if(!state.artifacts.includes('fire')||!out||!Number.isInteger(count)||count<1||(state.inventory[id]||0)<count)return null;state.inventory[id]-=count;state.inventory[out]=(state.inventory[out]||0)+count;return out;}
