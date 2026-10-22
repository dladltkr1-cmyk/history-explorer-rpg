import assert from 'node:assert/strict';
globalThis.Image=class{set src(v){}get complete(){return false}};
const {fresh,validate,advance,activeQuest,gain}=await import('../dist/state.js?v=55');
const {prepareAncientQA}=await import('../dist/ancient-state.js?v=55');
const {ANCIENT_QA,ancientWorld}=await import('../dist/regions/ancient.js?v=55');
const {MAPS}=await import('../dist/regions/index.js?v=55');
import * as w from '../dist/war-story.js?v=55';
const blocks=(x,y)=>x<1||y<1||x>22||y>34||w.warBlocked(w.ESCAPE,x,y);
for(const country of ['baekje','goguryeo','silla']){
 let s=fresh('v55 호환 검수','boy');prepareAncientQA(s,'4c-done',{country});delete s.ancient.war;s.map='ancient-han';s.x=12;s.y=6;s.coins=100;s.ancient.home.reputation=0;s.xp=0;
 s=validate(JSON.parse(JSON.stringify(s)));assert.equal(activeQuest(s).id,'ancient-4c-chiyang');assert.ok(s.completedQuests.includes('ancient-4c-south'));
 const inventory=JSON.stringify(s.inventory),appearance=JSON.stringify(s.appearance);assert.equal(w.guardSide(s),country==='goguryeo'?'백제':'고구려');
 s.ancient.home.commerce.cart.active='test';assert.equal(w.beginTrail(s),false);s.ancient.home.commerce.cart.active=null;assert.ok(w.beginTrail(s));s.map=w.TRAIL;
 for(const key of ['fork','fallen','watch']){const p={fork:[12,30],fallen:[5,22],watch:[23,14]}[key];[s.x,s.y]=p;assert.ok(w.inspectWar(s,key));}
 s.x=20;s.y=26;assert.equal(w.trailStep(s),'danger');assert.equal(s.coins,100);assert.equal(s.ancient.war.trail.stage,0);
 for(const p of w.TRAIL_CHECKS.slice(1)){[s.x,s.y]=p;assert.equal(w.trailStep(s),'checkpoint');}
 s.x=14;s.y=4;assert.ok(w.deliverWarNews(s));assert.equal(advance(s,'ancient:4c-chiyang').length,1);assert.equal(s.coins,130);assert.equal(s.ancient.home.reputation,3);assert.equal(advance(s,'ancient:4c-chiyang').length,0);
 s.map='ancient-han';s.x=12;s.y=6;assert.ok(w.beginEscape(s));s.map=w.ESCAPE;w.restoreWar(s);let rt=w.createEscapeRuntime(s);
 // FOV is directional and obstructed by the exact same walls as movement.
 const g=rt.guards[0];Object.assign(g,{x:8,y:25,direction:'up'});assert.ok(w.sees(g,{x:8,y:23}));assert.equal(w.sees(g,{x:8,y:28}),false);assert.equal(w.sees({x:5,y:18,direction:'down'},{x:5,y:21}),false);
 s.x=8;s.y=26;assert.ok(w.canAmbush(s,rt));assert.ok(w.ambush(s,rt));assert.equal(w.ambush(s,rt),false);for(let i=0;i<20;i++)w.stepEscape(s,rt,.04,blocks);assert.ok(s.ancient.war.escape.down[0]);assert.equal(rt.guards[0].mode,'down');
 s=validate(JSON.parse(JSON.stringify(s)));rt=w.createEscapeRuntime(s);assert.equal(rt.guards[0].mode,'down');assert.equal(s.coins,130);
 // Save validator restores the checkpoint and all parties; no economic penalty.
 s.ancient.war.escape.checkpoint=1;s.ancient.war.escape.waiting=true;s.x=20;s.y=15;s=validate(JSON.parse(JSON.stringify(s)));assert.deepEqual([s.x,s.y],w.CHECKS[1]);rt=w.createEscapeRuntime(s);assert.equal(rt.followers.length,2);
 Object.assign(rt.guards[1],{x:s.x+.1,y:s.y,direction:'left',mode:'chase',alert:2,lastTarget:{x:s.x,y:s.y}});assert.equal(w.stepEscape(s,rt,.04,blocks),'caught');assert.equal(s.coins,130);assert.equal(s.ancient.home.reputation,3);assert.equal(s.ancient.war.escape.waiting,false);
 s.x=12;s.y=2;s.ancient.war.escape.down=[false,false,false];assert.equal(w.tryEscape(s,rt),'guard');s.ancient.war.escape.down[0]=true;rt.followers=[{x:12,y:3},{x:12,y:8}];assert.equal(w.tryEscape(s,rt),'people');rt.followers[1].y=4;assert.equal(w.tryEscape(s,rt),'success');for(let i=0;i<70;i++)w.stepEscape(s,rt,.04,blocks);assert.ok(s.ancient.war.escape.escaped);s.ancient.war.escape.history=true;s.map='ancient-han';assert.equal(advance(s,'ancient:4c-pyongyang').length,0);s.map=w.ESCAPE;s.x=12;s.y=2;assert.equal(advance(s,'ancient:4c-pyongyang').length,1);assert.equal(advance(s,'ancient:4c-pyongyang').length,0);assert.equal(s.coins,165);assert.equal(s.ancient.home.reputation,6);assert.equal(s.xp,24);assert.equal(s.progress.ancient,26);assert.equal(activeQuest(s),null);assert.equal(JSON.stringify(s.inventory),inventory);assert.equal(JSON.stringify(s.appearance),appearance);assert.ok(!s.completedRegions.includes('ancient'));validate(JSON.parse(JSON.stringify(s)));
}
// Every terrain gap is reachable with a player-sized body; all stage hints and goal can be walked to.
for(const map of [MAPS[w.TRAIL],MAPS[w.ESCAPE]]){const step=.4,q=[[map.start.x,map.start.y]],seen=new Set();const hit=(x,y)=>x<1||y<1||x>map.w-2||y>map.h-2||w.warBlocked(map.id,x,y);for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy]of [[step,0],[-step,0],[0,step],[0,-step]]){const nx=Math.round((x+dx)*10)/10,ny=Math.round((y+dy)*10)/10,k=nx+','+ny;if(!hit(nx,ny)&&!seen.has(k)){seen.add(k);q.push([nx,ny]);}}}for(const e of map.entities.filter(e=>e.type==='warStory'))assert.ok(q.some(([x,y])=>Math.hypot(x-e.x,y-e.y)<1.5),'unreachable '+e.id);}
for(const stage of ANCIENT_QA.filter(q=>q.war)){const s=fresh('war QA','boy');const r=prepareAncientQA(s,stage);s.map=r.map;w.restoreWar(s);validate(JSON.parse(JSON.stringify(s)));assert.ok(ancientWorld(MAPS[r.map],s).entities.some(e=>e.id===r.target));}
console.log('v55 rules: 3-country legacy migration, routes/obstacles/LOS, directional ambush, down-state persistence, capture/checkpoint, 0 guards/1 follower rejection, animated exit state, exact 65/+6/24 and duplicate/remote refusal, terrain reachability, all QA states.');
