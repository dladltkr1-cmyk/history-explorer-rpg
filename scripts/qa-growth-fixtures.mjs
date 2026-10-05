import {writeFile} from 'node:fs/promises';
globalThis.Image = class { set src(v) { this._src=v; } get complete(){return false;} };
const {fresh,validate}=await import('../dist/state.js');
const {REGIONS}=await import('../dist/regions/index.js');
const quests=REGIONS.find(r=>r.id==='nations').quests;
for(const [id,map,x,y,horse] of [
 ['buyeo-festival','nation-buyeo-festival',11,8,false],
 ['goguryeo-festival','nation-goguryeo-festival',11,9,false],
 ['okjeo-return','nation-okjeo-homes',16,10,false],
 ['dongye-ceremony','nation-dongye-festival',11,8,false],
 ['samhan-festival','nation-samhan-festival',11,9,false],
 ['dongye-deliver','nation-dongye-border',9.1,8.5,false],
 ['dongye-cross','nation-dongye-border',12.40,8.5,false],
 ['horse-buyeo','nation-buyeo-road',18.4,13.1,true],
 ['mounted-buyeo','nation-buyeo-village',11,9,true]
]){
 const s=fresh('성장점검','boy');
 s.unlockedRegions=REGIONS.map(r=>r.id);s.introSeen=true;s.basicTutorialDone=true;
 s.map=map;s.x=x;s.y=y;s.progress.nations=id==='horse-buyeo'||id==='mounted-buyeo'?8:quests.findIndex(q=>q.id===(id==='dongye-cross'?'dongye-deliver':id));
 s.completedQuests=quests.slice(0,s.progress.nations).map(q=>q.id);
 s.discoveredMaps=REGIONS.find(r=>r.id==='nations').maps.map(m=>m.id);
 s.nationMarks=['buyeo','goguryeo','okjeo','dongye','samhan'].filter(n=>s.completedQuests.some(q=>q.startsWith(n+'-')&&['festival','return','ceremony'].some(end=>q.endsWith(end))));
 s.inventory.festivalitem=2;s.inventory.okjeowood=1;s.inventory.okjeograin=1;s.inventory.okjeobowl=1;
 s.coins=170;s.horseUnlocked=id==='mounted-buyeo';s.mounted=s.horseUnlocked;
 if(id==='horse-buyeo')s.horseField={map,id,until:Date.now()+300000};
 if(id==='dongye-deliver'||id==='dongye-cross')s.inventory.dongyepackage=1;
 validate(s);
 await writeFile('/workspace/scratch/b1178f27050b/qa-'+id+'.json',JSON.stringify(s));
}
console.log('9 validated game UI fixtures');
