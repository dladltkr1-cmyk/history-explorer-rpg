import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
globalThis.Image = class { set src(value) {this._src=value;} get complete(){return false;} };
const {fresh,validate,advance,activeQuest}=await import('../dist/state.js');
const {REGIONS}=await import('../dist/regions/index.js');
const {NATION_FINAL_QUIZZES,crossedDongyeBoundary,dongyeBoundaryX}=await import('../dist/regions/nations.js');
const quests=REGIONS.find(r=>r.id==='nations').quests;
for(const [id,mark] of [['buyeo-festival','buyeo'],['goguryeo-festival','goguryeo'],['okjeo-return','okjeo'],['dongye-ceremony','dongye'],['samhan-festival','samhan']]) {
  const s=fresh('점검','boy');s.unlockedRegions=REGIONS.map(r=>r.id);
  const i=quests.findIndex(q=>q.id===id),q=quests[i];s.progress.nations=i;s.map=q.map;s.coins=170;
  for(const [item,n] of Object.entries(q.items||{}))s.inventory[item]=n;
  assert.equal(activeQuest(s).id,id);
  assert.equal(advance(s,`inspect:${q.target}`).length,0,`Inspection cannot complete ${id}`);
  assert.equal(s.nationMarks.length,0);
  const quizId=q.event.slice(5),quiz=NATION_FINAL_QUIZZES[quizId];
  assert.equal(quiz.options.length,3);
  assert.ok(Number.isInteger(quiz.answer)&&quiz.answer>=0&&quiz.answer<3);
  const rewards=advance(s,q.event);
  assert.equal(rewards.length,1);assert.deepEqual(s.nationMarks,[mark]);
  assert.equal(s.coins,170+q.coins);
  for(const [item,n] of Object.entries(q.items||{}))assert.equal(s.inventory[item],q.consume?0:n);
  assert.equal(advance(s,q.event).length,0);
  assert.deepEqual(validate(s).nationMarks,[mark]);
}
// Before the visible stone line and just in front of it are safe. Feet beyond the line trigger once.
for(const y of [5,6.4,7.8,9.2,10.3]){
 const line=dongyeBoundaryX(y);
 assert.equal(crossedDongyeBoundary(line-.6,y,line+.15,y),false);
 assert.equal(crossedDongyeBoundary(line+.1,y,line+.27,y),true);
 assert.equal(crossedDongyeBoundary(line+.3,y,line+.5,y),false);
}
assert.equal(crossedDongyeBoundary(4,12,15,12),false);
const older=fresh('이전저장','boy');delete older.horseUnlocked;delete older.mounted;delete older.horseField;
const migrated=validate(older);assert.equal(migrated.horseUnlocked,false);assert.equal(migrated.mounted,false);
const mounted=fresh('말저장','girl');mounted.unlockedRegions=REGIONS.map(r=>r.id);mounted.map='nation-buyeo-village';mounted.horseUnlocked=true;mounted.mounted=true;
assert.equal(validate(mounted).mounted,true);
mounted.map='paleo-camp';assert.equal(validate(mounted).mounted,false);
assert.ok(REGIONS.filter(r=>r.id!=='nations').every(r=>r.maps.every(m=>m.entities.every(e=>e.type!=='horse'))));
console.log('Growth verification passed: five quiz gates, rewards, boundary threshold, and old/new save compatibility.');
