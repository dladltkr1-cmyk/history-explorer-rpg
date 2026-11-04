import {VOYAGE_STAGES,obstaclePosition} from './voyage.js?v=56.2';
const cache=new Map();
export function voyageImage(id){if(!cache.has(id)){const im=new Image();im.src=new URL('./assets/voyage/'+id+'.svg?v=56',import.meta.url).href;cache.set(id,im);}return cache.get(id);}
const ready=im=>im?.complete&&im.naturalWidth>0;
function picture(ctx,id,x,y,w,h){const im=voyageImage(id);if(ready(im))ctx.drawImage(im,x,y,w,h);}
export function drawPassenger(ctx,avatarSource,appearance,x,y,clock,moving=false){const im=avatarSource(appearance,'back',moving?'walk-'+(1+Math.floor(clock*7)%2):'idle');if(ready(im))ctx.drawImage(im,x-23,y-59,46,59);}
const envoy={hair:0,eyes:2,skin:1,hairColor:0,outfit:0};
export function drawVoyage(canvas,s,rt,avatarSource){if(!canvas)return;const ctx=canvas.getContext('2d'),clock=rt.elapsed||0,stage=Math.min(2,rt.stage||0);ctx.clearRect(0,0,1000,700);
 const g=ctx.createLinearGradient(0,0,0,700);g.addColorStop(0,['#609a97','#447d91','#406f87'][stage]);g.addColorStop(1,['#2d7379','#285f79','#234c6b'][stage]);ctx.fillStyle=g;ctx.fillRect(0,0,1000,700);
 // The scenery is illustrative, not a reconstruction of the historical route.
 ctx.fillStyle=stage===0?'#889c72':'#5c8681';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(100,0);ctx.bezierCurveTo(35,190,85,330,30,430);ctx.lineTo(0,590);ctx.fill();ctx.beginPath();ctx.moveTo(1000,0);ctx.lineTo(925,0);ctx.bezierCurveTo(965,150,915,255,990,400);ctx.lineTo(1000,500);ctx.fill();
 for(let i=0;i<35;i++){const x=45+(i*173%910),y=(i*97+clock*(stage===2?80:48))%760-30;ctx.strokeStyle=i%3?'#c2e1d128':'#d9efde4a';ctx.lineWidth=2+(i%2);ctx.beginPath();ctx.moveTo(x-15,y);ctx.quadraticCurveTo(x,y+7,x+21,y);ctx.stroke();}
 if(stage===2){const dx=Math.sign(Math.sin(clock*.72));ctx.strokeStyle='#c1e1d962';ctx.lineWidth=3;for(let i=0;i<5;i++){const y=(i*140+clock*90)%760-30;ctx.beginPath();ctx.moveTo(400+dx*40,y-11);ctx.lineTo(400+dx*60,y);ctx.lineTo(400+dx*40,y+11);ctx.stroke();}}
 if(rt.scene==='boarding'||rt.scene==='arrival'){
  const t=Math.min(1,clock/3.6),arrival=rt.scene==='arrival';ctx.fillStyle='#9b8057';ctx.strokeStyle='#4e5341';ctx.lineWidth=6;ctx.fillRect(20,250,335,170);ctx.strokeRect(20,250,335,170);for(let y=270;y<420;y+=24){ctx.beginPath();ctx.moveTo(25,y);ctx.lineTo(350,y);ctx.stroke();}for(const y of [250,420]){ctx.fillStyle='#68533a';ctx.fillRect(300,y-8,22,35);}
  const bx=arrival?650-t*120:540+Math.max(0,t-.55)*330,by=475;if(!arrival&&t<.75){ctx.save();ctx.translate(335,403);ctx.rotate(.35);ctx.fillStyle='#b59a66';ctx.fillRect(0,-12,210,24);ctx.strokeStyle='#705c3d';ctx.lineWidth=3;ctx.strokeRect(0,-12,210,24);for(let q=15;q<210;q+=22){ctx.beginPath();ctx.moveTo(q,-12);ctx.lineTo(q,12);ctx.stroke();}ctx.restore();}drawBoat(ctx,s,bx,by,Math.sin(clock*2)*.018,avatarSource,clock,t>.7||arrival);
  if(!arrival&&t<.7){drawPassenger(ctx,avatarSource,envoy,250+(bx-24-250)*Math.min(1,t/.45),350+(by-10-350)*Math.min(1,t/.45),clock,true);drawPassenger(ctx,avatarSource,s.appearance,190+(bx+26-190)*Math.min(1,Math.max(0,(t-.12)/.58)),410+(by+55-410)*Math.min(1,Math.max(0,(t-.12)/.58)),clock,true);}
  ctx.fillStyle='#f6ead0';ctx.font='bold 24px system-ui';ctx.textAlign='center';ctx.fillText(arrival?'안전한 항구에 도착했다':'사신과 함께 목선에 오르자',500,90);return;
 }
 for(const row of rt.rows||[]){const p=obstaclePosition(rt,row,s.ancient.voyage.failures[rt.stage]);if(clock<row.at||p.y< -180||p.y>850)continue;const imW=row.rx*2,imH=row.ry*2;picture(ctx,row.kind,p.x-imW/2,p.y-imH/2,imW,imH);}
 const x=rt.x||500,y=525;ctx.strokeStyle='#d9ede580';ctx.lineWidth=3;
 for(let i=0;i<4;i++){const dy=((clock*80+i*28)%115);ctx.beginPath();ctx.ellipse(x,y+115+dy,25+dy*.32,7+dy*.055,0,0,Math.PI);ctx.stroke();}
 drawBoat(ctx,s,x,y,rt.lean+Math.sin(clock*2.7)*.014,avatarSource,clock,true);
 if(rt.splash>0){ctx.strokeStyle='#e5f1d7';ctx.lineWidth=4;for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*65,y+Math.sin(a)*90);ctx.lineTo(x+Math.cos(a)*(80+rt.splash*30),y+Math.sin(a)*(110+rt.splash*20));ctx.stroke();}}
 ctx.fillStyle='#f5edce';ctx.font='bold 17px system-ui';ctx.textAlign='center';ctx.fillText('← 조종 가능한 바닷길 →',500,682);
}
function drawBoat(ctx,s,x,y,angle,avatarSource,clock,people){ctx.save();ctx.translate(x,y+Math.sin(clock*3)*2);ctx.rotate(angle);picture(ctx,'boat',-90,-175,180,306);if(people){drawPassenger(ctx,avatarSource,envoy,-22,9+Math.sin(clock*3)*1.2,clock);drawPassenger(ctx,avatarSource,s.appearance,29,75+Math.sin(clock*3+.3),clock);}ctx.restore();}
