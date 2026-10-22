import assert from 'node:assert/strict';
globalThis.Image=class{set src(v){} get complete(){return false;}};
const {fresh,validate,advance,activeQuest,gain}=await import('../dist/state.js?v=55');
const {prepareAncientQA}=await import('../dist/ancient-state.js?v=55');
const {MAPS}=await import('../dist/regions/index.js?v=55');
const {ANCIENT_QA,ancientWorld}=await import('../dist/regions/ancient.js?v=55');
import * as st from '../dist/baekje-story.js?v=55';
const go=(s,key)=>{s.map=key==='sender'?'ancient-village-'+s.ancient.country:'ancient-han';Object.assign(s,st.STORY_POINTS[key]);s.x+=1;};
for(const country of ['goguryeo','baekje','silla'])for(const farm of [false,true]){
 let s=fresh('이야기 검수','boy');prepareAncientQA(s,'4c-trade',{country});s.map='ancient-home-'+country;s.x=5;s.y=5;s.coins=100;s.ancient.home.reputation=0;
 // Real v53 save has no new field and remains at the first new quest.
 delete s.ancient.baekje4c;s=validate(JSON.parse(JSON.stringify(s)));assert.equal(activeQuest(s).id,'ancient-4c-trade');assert.equal(s.saveVersion,3);
 if(farm)s.ancient.home.harvested.millet=4;
 const inventory=JSON.stringify(s.inventory),home=s.ancient.home;const before={level:s.level,xp:s.xp};
 assert.equal(st.takeStoryParcel(s),false);go(s,'sender');assert.equal(st.takeStoryParcel(s),true);assert.equal(st.takeStoryParcel(s),false);s=validate(JSON.parse(JSON.stringify(s)));go(s,'keeper');assert.equal(st.deliverStoryParcel(s),true);assert.equal(st.deliverStoryParcel(s),false);assert.equal(advance(s,'ancient:4c-trade').length,0);
 for(const id of ['river','boat','grain'])assert.ok(st.observeStory(s,id));
 s=validate(JSON.parse(JSON.stringify(s)));assert.equal(advance(s,'ancient:4c-trade').length,1);assert.equal(s.coins,120+(farm?5:0));assert.equal(s.ancient.home.reputation,2);assert.equal(advance(s,'ancient:4c-trade').length,0);
 for(let r=0;r<3;r++){
  const ids=st.CARGO_ROUNDS[r];for(let i=0;i<ids.length;i++)assert.ok(st.placeCargo(s,i,'left'));assert.equal(st.cargoBalance(s.ancient.baekje4c).ready,false);assert.equal(st.departCargo(s),false);
  const sides=r===0?['left','right']:r===1?['left','right','right']:['left','right','right','left'];for(let i=0;i<sides.length;i++)st.placeCargo(s,i,sides[i]);assert.ok(st.cargoBalance(s.ancient.baekje4c).ready);s=validate(JSON.parse(JSON.stringify(s)));assert.ok(st.departCargo(s));assert.equal(st.departCargo(s),false);
 }
 assert.equal(advance(s,'ancient:4c-cargo').length,1);assert.equal(advance(s,'ancient:4c-cargo').length,0);go(s,'south');
 for(let i=0;i<3;i++){assert.equal(st.exchangeStory(s,0,2),false);assert.ok(st.exchangeStory(s,0,1,i));assert.equal(st.exchangeStory(s,0,1,i),false);s=validate(JSON.parse(JSON.stringify(s)));}
 assert.equal(st.chooseStoryRoute(s,'land'),false);assert.ok(st.chooseStoryRoute(s,'water'));assert.equal(st.chooseStoryRoute(s,'water'),false);assert.ok(st.chooseStoryRoute(s,'land'));assert.equal(advance(s,'ancient:4c-south').length,0);assert.ok(st.seeStoryCourt(s));assert.equal(advance(s,'ancient:4c-south').length,1);assert.equal(advance(s,'ancient:4c-south').length,0);
 assert.equal(s.coins,175+(farm?5:0));assert.equal(s.ancient.home.reputation,6);const expected={...s,...before};gain(expected,36,0);assert.equal(s.level,expected.level);assert.equal(s.xp,expected.xp);assert.equal(JSON.stringify(s.inventory),inventory);assert.equal(activeQuest(s).id,'ancient-4c-chiyang');assert.equal(s.progress.ancient,24);assert.ok(!s.completedRegions.includes('ancient'));validate(JSON.parse(JSON.stringify(s)));
}
for(const stage of ANCIENT_QA.filter(q=>q.index>=21&&q.index<=24&&!q.war)){const s=fresh('관리자 시험','boy'),r=prepareAncientQA(s,stage);s.map=r.map;s.x=10;s.y=9;validate(JSON.parse(JSON.stringify(s)));assert.ok(ancientWorld(MAPS[r.map],s).entities.some(e=>e.id===r.target));}
const s=fresh('위치와 상한','boy');prepareAncientQA(s,'4c-deliver');go(s,'keeper');st.deliverStoryParcel(s);for(const id of ['river','boat','grain'])st.observeStory(s,id);s.ancient.home.reputation=99;s.map='ancient-home-baekje';assert.equal(advance(s,'ancient:4c-trade').length,0);go(s,'keeper');advance(s,'ancient:4c-trade');assert.equal(s.ancient.home.reputation,100);s.ancient.history.phase='goguryeo-post475';s.ancient.history.events=['hansong-475'];assert.ok(!ancientWorld(MAPS['ancient-han'],s).entities.some(e=>e.type==='baekjeStory'));assert.equal(st.placeCargo(s,0,'left'),false);
console.log('v54: 3 countries × farming/no farming; legacy defaults; all 3 quests, 3 cargo rounds, 3 exchanges, 2 routes, court; save restore each step; 75(+5)/6/36 exact rewards and duplicates refused; location/period guards; inventory preserved; QA presets; reputation cap.');
