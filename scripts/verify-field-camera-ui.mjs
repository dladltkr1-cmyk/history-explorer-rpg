import {fileURLToPath} from 'node:url';
const {JSDOM}=await import(process.env.HISTORY_JSDOM_MODULE||'jsdom');
import {readFile,writeFile,unlink} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('..',import.meta.url)).replace(/\/$/,'');
const dom=new JSDOM(await readFile(root+'/dist/index.html','utf8'),{url:'http://localhost'}),w=dom.window;
for(const name of ['window','document','localStorage','navigator'])Object.defineProperty(globalThis,name,{value:name==='window'?w:w[name],configurable:true});
globalThis.Image=class{set src(v){this._src=v}get src(){return this._src}get complete(){return true}get naturalWidth(){return 256}get naturalHeight(){return 256}addEventListener(){}};
w.HTMLCanvasElement.prototype.toDataURL=()=>'';
globalThis.Audio=w.Audio;w.HTMLMediaElement.prototype.play=()=>Promise.resolve();w.HTMLMediaElement.prototype.pause=()=>{};
w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({measureText:()=>({width:20}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
let clock=0,id=0;const frames=new Map(),epoch=Date.now();Date.now=()=>epoch+clock;
Object.defineProperty(globalThis,'performance',{value:{now:()=>clock},configurable:true});
Object.assign(globalThis,{innerWidth:1024,innerHeight:768,devicePixelRatio:1,addEventListener:w.addEventListener.bind(w),getComputedStyle:w.getComputedStyle.bind(w),requestAnimationFrame:cb=>{frames.set(++id,cb);return id;},cancelAnimationFrame:id=>frames.delete(id)});
const {fresh,validate,activeQuest,abilities}=await import(root+'/dist/state.js?v=49');
const {REGIONS,MAPS}=await import(root+'/dist/regions/index.js?v=49');
const {ANCIENT_COUNTRIES,ANCIENT_QA,ANCIENT_QUESTS}=await import(root+'/dist/regions/ancient.js?v=49');
const original=fresh('고대 UI 원본','boy');Object.assign(original,{introSeen:true,basicTutorialDone:true,audioMuted:true,coins:317,personalCode:null});original.completedRegions=REGIONS.slice(0,5).map(r=>r.id);original.unlockedRegions=REGIONS.map(r=>r.id);original.inventory.food=7;original.inventory.fishingrod=1;original.horseUnlocked=true;original.inventory.gear.push('bronzeCharm');
localStorage.setItem('history-explorer-save-v1',JSON.stringify(original));
let source=await readFile(root+'/dist/game.js','utf8');source=source.replace(/from (["'])(\.\/[^"']+)\1/g,(_,q,p)=>'from '+q+new URL(p,'file://'+root+'/dist/').href+q);
source+='\nexport const qa={camera:()=>({...cam}),draw,state:()=>s,start,screen:()=>screen,menu:adminPanel,field:()=>{close();hud();},blocked,travel,currentMap,targetEntity,tick,login:()=>{adminOriginal=structuredClone(saved);adminMode=true;start(structuredClone(saved));adminPanel();},exit:adminExit};';
const path=root+'/scripts/.ancient-ui-test-camera-'+process.pid+'.mjs';await writeFile(path,source);const {qa}=await import(path);
const click=selector=>{const el=document.querySelector(selector);assert.ok(el,selector+' '+document.querySelector('#overlay')?.textContent);assert.equal(el.disabled,false,selector+' disabled');el.click();};
function finishDialogue(){let count=0;while(document.querySelector('#next-dialogue')){assert.ok(count++<10);click('#next-dialogue');}}
function approach(e){const st=qa.state();const spots=[[e.x-1.2,e.y],[e.x+1.2,e.y],[e.x,e.y+1.2],[e.x,e.y-1.2]];const p=spots.find(([x,y])=>!qa.blocked(x,y));assert.ok(p,'safe interaction spot '+e.id);st.x=p[0];st.y=p[1];qa.field();clock+=40;qa.tick(clock);click('#interact');}
function reachable(m){const st=qa.state(),queue=[[Math.round(st.x*2)/2,Math.round(st.y*2)/2]],seen=new Set();while(queue.length){const [x,y]=queue.shift(),key=x+','+y;if(seen.has(key)||qa.blocked(x,y))continue;seen.add(key);for(const [dx,dy]of [[.5,0],[-.5,0],[0,.5],[0,-.5]]){const nx=x+dx,ny=y+dy;if(nx>=1&&nx<=m.w-2&&ny>=1&&ny<=m.h-2)queue.push([nx,ny]);}}return e=>[...seen].some(k=>{const [x,y]=k.split(',').map(Number);return Math.hypot(x-e.x,y-e.y)<1.5;});}
const geometry=JSON.stringify(MAPS),initial=localStorage.getItem('history-explorer-save-v1');qa.login();qa.field();
const maps=['paleo-camp','pre-village','neo-river','bronze-outskirts','go-village','nation-iron-field','nation-goguryeo-road','nation-buyeo-village','room-buyeo-house-a'];
for(const [width,height]of [[1363,936],[1024,768],[768,1024]]){
 globalThis.innerWidth=width;globalThis.innerHeight=height;
 for(const id of maps){qa.travel(id);qa.field();clock+=40;qa.tick(clock);const m=qa.currentMap(),st=qa.state();assert.equal(qa.blocked(st.x,st.y),false);assert.equal(qa.camera().zoom,m.theme==='room'?1:1.18);
  for(const directions of [['ArrowUp'],['ArrowDown'],['ArrowLeft'],['ArrowRight'],['ArrowUp','ArrowRight']]){
   let spot;for(let y=5;y<13&&!spot;y++)for(let x=7;x<17;x++)if([[0,0],[.7,0],[-.7,0],[0,.7],[0,-.7],[.7,-.7]].every(([dx,dy])=>!qa.blocked(x+dx,y+dy))&&!m.entities.some(e=>e.type==='enemy'&&Math.hypot(e.x-x,e.y-y)<3)){spot=[x,y];break;}
   assert.ok(spot);[st.x,st.y]=spot;clock+=40;qa.tick(clock);
   for(const key of directions)w.dispatchEvent(new w.KeyboardEvent('keydown',{key}));for(let n=0;n<3;n++){clock+=40;qa.tick(clock);}for(const key of directions)w.dispatchEvent(new w.KeyboardEvent('keyup',{key}));
   assert.ok(Math.hypot(st.x-spot[0],st.y-spot[1])>.39,'actual movement '+id);for(let n=0;n<50;n++){clock+=40;qa.tick(clock);}assert.equal(qa.camera().aheadX,0);assert.equal(qa.camera().aheadY,0);
  }
  for(const [x,y]of [[1.2,1.2],[m.w-1.2,1.2],[1.2,m.h-1.2],[m.w-1.2,m.h-1.2]]){st.x=x;st.y=y;clock+=40;qa.tick(clock);const c=qa.camera();if(m.w*64>c.viewW){assert.ok(c.x>=0);assert.ok(c.x+c.viewW<=m.w*64+1e-8);}if(m.h*64>c.viewH){assert.ok(c.y>=0);assert.ok(c.y+c.viewH<=m.h*64+1e-8);}}
 }
}
// Existing shared admin shortcuts use the common isolated region jump.
for(const [id,map]of [['camera-field','nation-iron-field'],['camera-village','nation-buyeo-village'],['camera-path','nation-goguryeo-road'],['camera-room','room-buyeo-house-a']]){qa.menu();click('[data-admin-menu="interaction"]');click('[data-qa-interact="'+id+'"]');assert.equal(qa.state().map,map);assert.equal(qa.blocked(qa.state().x,qa.state().y),false);}
// Reach and enter a real building through the unchanged interaction button, then return.
qa.travel('nation-buyeo-village');qa.field();const house=qa.currentMap().entities.find(e=>e.to==='room-buyeo-house-a');assert.ok(house);approach(house);click('#enter-house');assert.equal(qa.state().map,'room-buyeo-house-a');clock+=40;qa.tick(clock);assert.equal(qa.camera().zoom,1);approach(qa.currentMap().entities.find(e=>e.type==='roomDoor'));assert.equal(qa.state().map,'nation-buyeo-village');clock+=40;qa.tick(clock);assert.equal(qa.camera().zoom,1.18);
// Reproduce the observed top-left HUD overlap without moving the camera past the map edge.
const playerPanel=document.querySelector('.player-panel');const originalRect=playerPanel.getBoundingClientRect;
playerPanel.getBoundingClientRect=()=>({left:14,right:332,top:10,bottom:73,width:318,height:63});
globalThis.innerWidth=1363;globalThis.innerHeight=936;qa.travel('nation-iron-field');qa.state().x=1.3;qa.state().y=1.3;qa.field();qa.draw(.04);
assert.equal(qa.camera().x,0);assert.equal(qa.camera().y,0);assert.ok(playerPanel.classList.contains('field-player-behind'),'edge player is revealed through HUD');
qa.menu();qa.draw(.04);assert.ok(!playerPanel.classList.contains('field-player-behind'),'menus retain full HUD opacity');qa.field();qa.state().x=11;qa.state().y=10;qa.draw(.04);assert.ok(!playerPanel.classList.contains('field-player-behind'),'HUD restored when player leaves overlap');playerPanel.getBoundingClientRect=originalRect;
qa.travel('nation-buyeo-village');qa.field();
const st=qa.state();let spot;for(let y=5;y<13&&!spot;y++)for(let x=6;x<16;x++)if([0,.5,1,1.5,2,2.5,3].every(dx=>!qa.blocked(x+dx,y))){spot=[x,y];break;}assert.ok(spot);const distances=[];
for(const mounted of [false,true]){[st.x,st.y]=spot;st.mounted=mounted;st.horseParked=false;qa.field();w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight'}));for(let n=0;n<10;n++){clock+=40;qa.tick(clock);}w.dispatchEvent(new w.KeyboardEvent('keyup',{key:'ArrowRight'}));distances.push(st.x-spot[0]);assert.equal(qa.camera().zoom,1.18);}
assert.ok(Math.abs(distances[0]-1.4)<1e-8);assert.ok(Math.abs(distances[1]-2.24)<1e-8);click('#mount-btn');assert.equal(st.mounted,false);
const stableGeometry=maps=>JSON.stringify(Object.fromEntries(Object.entries(maps).map(([id,m])=>[id,{...m,entities:m.entities.map(e=>{if(e.type!=='enemy')return e;const {x,y,hidden,...rest}=e;return rest;})}])));assert.equal(stableGeometry(MAPS),stableGeometry(JSON.parse(geometry)),'static coordinates and enemy definitions unchanged');const drawMaps=JSON.stringify(MAPS),drawState=JSON.stringify(st);for(let n=0;n<30;n++)qa.draw(.016);assert.equal(JSON.stringify(MAPS),drawMaps,'drawing does not mutate spawned positions');assert.equal(JSON.stringify(st),drawState,'camera does not write student state');assert.equal(localStorage.getItem('history-explorer-save-v1'),initial,'QA does not write original');qa.exit();
console.log('Actual game frame/UI: 9 representative maps × 3 viewport sizes × cardinal/diagonal movement/stop/corners; shared camera QA 4 routes; building entry/exit; zoom 1.18 on foot and horse; unchanged speeds 3.5/5.6 tiles/s, geometry and isolated student save.');
await unlink(path);dom.window.close();process.exit(0);
