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
for(let n=0;n<90;n++)c=update({x:0,y:0});assert.equal(c.aheadX,0);assert.equal(c.aheadY,0);
const old=c;const next=camera.update({map,width,height,x:12.14,y:10,dt:.016});assert.ok(Math.abs(next.x-old.x-8.96)<1e-8,'player tracking has no lag');
const diagonal=update({x:1,y:1});assert.ok(diagonal.aheadX>0&&diagonal.aheadY>0);
const indoor=camera.update({map:MAPS['room-buyeo-house-a'],width,height,x:5,y:5,dt:.016,direction:{x:1,y:1}});assert.equal(indoor.zoom,1);assert.equal(indoor.aheadX,0);assert.equal(indoor.aheadY,0);
assert.equal(fieldZoom({w:10,h:8,theme:'wild'},width,height),1);
assert.equal(fieldZoom(map,width,height,false),1);
assert.equal(FIELD_ZOOM,1.18);assert.ok(Math.abs((width/FIELD_ZOOM)/width-1/1.18)<1e-8);
console.log(`Camera: ${Object.keys(MAPS).length} maps × ${sizes.length} PC/tablet viewports × corners/centre × 5 directions; bounds, small interiors, 1.18 zoom, reversal easing, stop recentering and immediate player tracking passed.`);
