import {fileURLToPath} from 'node:url';
import {readFile,writeFile,unlink} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {JSDOM}=await import(process.env.HISTORY_JSDOM_MODULE||'jsdom');
const root=fileURLToPath(new URL('..',import.meta.url)).replace(/\/$/,'');
const dom=new JSDOM(await readFile(root+'/dist/index.html','utf8'),{url:'http://localhost'}),w=dom.window;
for(const name of ['window','document','localStorage','navigator'])Object.defineProperty(globalThis,name,{value:name==='window'?w:w[name],configurable:true});
globalThis.Image=class{complete=true;naturalWidth=256;naturalHeight=256;set src(v){this._src=v}get src(){return this._src}addEventListener(){}};
globalThis.Audio=w.Audio;w.HTMLMediaElement.prototype.play=()=>Promise.resolve();w.HTMLMediaElement.prototype.pause=()=>{};
const draws=[];
w.HTMLCanvasElement.prototype.getContext=function(){const world=this.id==='world';return new Proxy({drawImage:(...args)=>{if(world)draws.push(args)},measureText:()=>({width:20}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});};
w.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/png;base64,';
let clock=0,id=0;const epoch=Date.now();Date.now=()=>epoch+clock;
Object.defineProperty(globalThis,'performance',{value:{now:()=>clock},configurable:true});
Object.assign(globalThis,{innerWidth:1024,innerHeight:768,devicePixelRatio:1,addEventListener:w.addEventListener.bind(w),getComputedStyle:w.getComputedStyle.bind(w),requestAnimationFrame:()=>++id,cancelAnimationFrame:()=>{}});
const {fresh,validate}=await import(root+'/dist/state.js?v=48');
const {MAPS,REGIONS}=await import(root+'/dist/regions/index.js?v=48');
let source=await readFile(root+'/dist/game.js','utf8');source=source.replace(/from (["'])(\.\/[^"']+)\1/g,(_,q,p)=>'from '+q+new URL(p,'file://'+root+'/dist/').href+q);
source+='\nexport const qa={state:()=>s,start,screen:()=>screen,tick,blocked,nearby,field:()=>{close();hud();},enemies:ENEMIES,battle:()=>battle};';
const path=root+'/scripts/.field-test-'+process.pid+'.mjs';await writeFile(path,source);
try{
 const {qa}=await import(path);let st=fresh('필드 검수','boy');
 Object.assign(st,{map:'go-outskirts',x:5,y:6.5,introSeen:true,basicTutorialDone:true,audioMuted:true,personalCode:null});
 st.completedRegions=REGIONS.slice(0,5).map(r=>r.id);st.unlockedRegions=REGIONS.map(r=>r.id);
 const spots={'go-out-bandit':[3.8,6.5],'go-out-bear':[7.3,6.5],'go-out-wolf':[3.8,8],'go-out-tiger':[6.3,8],'go-out-boar2':[13,13]};
 for(const [id,[x,y]]of Object.entries(spots))st.monsters[id]={x,y,waiting:false};
 qa.start(validate(st));st=qa.state();qa.field();draws.length=0;clock+=40;qa.tick(clock);
 const bandit=draws.find(a=>a[0]?.src?.includes('bandit-v43')),tiger=draws.find(a=>a[0]?.src?.includes('enemies/tiger'));
 assert.ok(bandit&&tiger,'actual field draws both sprites');assert.equal(bandit.length,9);assert.equal(tiger.length,9);
 assert.equal(bandit[8],71.76);assert.equal(tiger[8],91);
 const playerHeight=72*1.06*(236-26)/256;
 assert.ok(bandit[8]/playerHeight>=1.05&&bandit[8]/playerHeight<=1.15);
 assert.ok(tiger[8]/playerHeight>=1.35&&tiger[8]/playerHeight<=1.5);
 assert.ok(bandit[7]<58*.6,'bandit narrower due to new anatomy');
 for(const a of [bandit,tiger])assert.ok(Math.abs(a[7]/a[3]-a[8]/a[4])<1e-9,'uniform scale, no horizontal distortion');
 assert.equal(qa.enemies.bandit.hp,74);assert.equal(qa.enemies.bandit.attack,14);assert.equal(qa.enemies.tiger.hp,105);assert.equal(qa.enemies.tiger.attack,20);
 for(const id of ['go-out-bandit','go-out-tiger']){
  const e=MAPS['go-outskirts'].entities.find(e=>e.id===id);
  // Move other test entities away; production map/spawn data are never rewritten.
  for(const other of MAPS['go-outskirts'].entities.filter(o=>o.type==='enemy'&&o!==e)){other.x=18;other.y=12;st.monsters[other.id]={x:18,y:12,waiting:false};}
  e.x=9;e.y=9;st.monsters[id]={x:9,y:9,waiting:false};
  Object.assign(st,{x:9.66,y:9});qa.field();for(let n=0;n<90;n++){clock+=40;qa.tick(clock);}
  assert.equal(qa.screen(),'','no battle at distance 0.66 despite graphic size');
  assert.equal(qa.blocked(9.2,9),false,'enemy image does not add solid collision');
  st.x=10.2;qa.field();assert.equal(qa.nearby()?.id,id,'normal interaction at distance 1.2');document.querySelector('#interact').click();assert.equal(qa.battle().entity.id,id);qa.field();
  st.x=9.64;clock+=40;qa.tick(clock);assert.ok(qa.battle());assert.equal(qa.battle().entity.id,id,'existing distance 0.64 begins battle');
  assert.equal(qa.battle().attack,id.endsWith('tiger')?24:19,'regional / elite attack unchanged');
  qa.field();
 }
 console.log('Field: actual canvas draws, bandit ×1.10 / tiger ×1.45, aspect ratio, interaction at 1.2, collision unchanged, battle 0.64 vs 0.66, original HP/attack passed.');
}finally{await unlink(path);dom.window.close();}
process.exit(0);
