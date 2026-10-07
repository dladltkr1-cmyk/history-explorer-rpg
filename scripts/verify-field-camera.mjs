import assert from 'node:assert/strict';
import {createFieldCamera,fieldZoom,FIELD_ZOOM} from '../dist/field-camera.js';
const {MAPS}=await import('../dist/regions/index.js?v=44.2');
const sizes=[[1363,936],[1920,1080],[1024,768],[768,1024],[1180,820]];
for(const [width,height]of sizes)for(const map of Object.values(MAPS)){
 const camera=createFieldCamera();const zoom=fieldZoom(map,width,height);
 for(const [x,y]of [[0,0],[map.w,0],[0,map.h],[map.w,map.h],[map.w/2,map.h/2]])for(const direction of [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1},{x:1,y:1}]){
  const c=camera.update({map,width,height,x,y,direction,dt:.04});
  if(map.w*64>=c.viewW){assert.ok(c.x>=0);assert.ok(c.x+c.viewW<=map.w*64+1e-8);}else assert.equal(c.x,(map.w*64-c.viewW)/2);
  if(map.h*64>=c.viewH){assert.ok(c.y>=0);assert.ok(c.y+c.viewH<=map.h*64+1e-8);}else assert.equal(c.y,(map.h*64-c.viewH)/2);
  assert.equal(c.zoom,zoom);
 }
 if(['room','interior','cave'].includes(map.theme))assert.equal(zoom,1);
}
const map=MAPS['nation-iron-field'],width=1024,height=768,camera=createFieldCamera();
const update=(direction,dt=.016)=>camera.update({map,width,height,x:12,y:10,direction,dt});
let c=update({x:1,y:0});for(let n=0;n<60;n++)c=update({x:1,y:0});
assert.ok(c.aheadX>29&&c.aheadX<36);const before=c.x;c=update({x:-1,y:0});assert.ok(Math.abs(c.x-before)<12,'no reversal snap');assert.ok(c.aheadX>0,'lead eases through reversal');
for(let n=0;n<150;n++)c=update({x:0,y:0});assert.equal(c.aheadX,0);assert.equal(c.aheadY,0);
const old=c;const next=camera.update({map,width,height,x:12.14,y:10,dt:.016});assert.ok(Math.abs(next.x-old.x-8.96)<1e-8,'player tracking has no lag');
const diagonal=update({x:1,y:1});assert.ok(diagonal.aheadX>0&&diagonal.aheadY>0);
const indoor=camera.update({map:MAPS['room-buyeo-house-a'],width,height,x:5,y:5,dt:.016,direction:{x:1,y:1}});assert.equal(indoor.zoom,1);assert.equal(indoor.aheadX,0);assert.equal(indoor.aheadY,0);
assert.equal(fieldZoom({w:10,h:8,theme:'wild'},width,height),1);
assert.equal(fieldZoom(map,width,height,false),1);
assert.equal(FIELD_ZOOM,1.18);assert.ok(Math.abs((width/FIELD_ZOOM)/width-1/1.18)<1e-8);
// Reproduce key-up after sustained motion: first-frame return must not jerk.
const stopMetrics=[];
for(const fps of [30,60,120])for(const direction of [{x:1,y:0},{x:0,y:-1},{x:1,y:1}]){
 const cam=createFieldCamera(),step=1/fps;
 const frame=d=>cam.update({map,width,height,x:12,y:10,direction:d,dt:step});
 let prior;for(let n=0;n<fps*2;n++)prior=frame(direction);
 const lead=Math.hypot(prior.aheadX,prior.aheadY),first=frame({x:0,y:0});
 const distance=(a,b)=>Math.hypot(a.aheadX-b.aheadX,a.aheadY-b.aheadY);
 const initial=distance(first,prior)*FIELD_ZOOM;
 assert.ok(initial<.7,'gentle first stop frame at '+fps+'fps');
 const oldInitial=lead*(1-Math.exp(-12*step))*FIELD_ZOOM;
 assert.ok(initial<oldInitial*.06,'stop kick reduced by at least 94%');
 let previous=first,peak=0;
 for(let n=1;n<fps*2;n++){
  const next=frame({x:0,y:0});peak=Math.max(peak,distance(next,previous)*FIELD_ZOOM/step);
  assert.ok(Math.hypot(next.aheadX,next.aheadY)<=lead+.01,'no stop bounce');previous=next;
 }
 assert.equal(previous.aheadX,0);assert.equal(previous.aheadY,0);
 assert.ok(peak<90,'return stays gentle throughout');stopMetrics.push({fps,initial:+initial.toFixed(3),peak:+peak.toFixed(1)});
 // Analytic damping should give the same framing for 30/60/120fps.
 cam.reset();let held;for(let n=0;n<fps;n++)held=frame(direction);
 const reference=createFieldCamera().update({map,width,height,x:12,y:10,direction,dt:1});
 assert.ok(distance(held,reference)<1e-8,'frame-rate-independent look-ahead');
 cam.reset();assert.equal(frame({x:0,y:0}).aheadX,0,'reset clears velocity as well as position');
 // Short taps and an immediate reversal retain velocity without a positional kick.
 cam.reset();let tap;for(let n=0;n<Math.ceil(fps*.1);n++)tap=frame(direction);
 const released=frame({x:0,y:0});
 assert.ok(distance(released,tap)*FIELD_ZOOM/step<150,'short-tap release stays bounded');
 const reversed=frame({x:-direction.x,y:-direction.y});
 assert.ok(distance(reversed,released)*FIELD_ZOOM/step<150,'rapid reversal stays bounded');
 for(let n=0;n<fps*2;n++){const settled=frame({x:0,y:0});assert.ok(Math.hypot(settled.aheadX,settled.aheadY)*FIELD_ZOOM<43,'no large residual drift');}
}
console.log('Stop motion (screen px / px per second):',JSON.stringify(stopMetrics));
console.log(`Camera: ${Object.keys(MAPS).length} maps × ${sizes.length} PC/tablet viewports × corners/centre × 5 directions; bounds, small interiors, 1.18 zoom, reversal easing, stop recentering and immediate player tracking passed.`);
