import {TRAIL,ESCAPE,warMap,warBlocked,TRAIL_CHECKS,CHECKS,guardSide} from './war-story.js?v=55';
const APPEARANCES=[{hair:2,eyes:3,skin:1,hairColor:0,outfit:2},{hair:3,eyes:1,skin:2,hairColor:1,outfit:0}];
export function drawWarTerrain(ctx,m,T,s,rt){if(!warMap(m.id))return;
 const path=points=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x*T,y*T):ctx.moveTo(x*T,y*T));ctx.stroke();};
 ctx.strokeStyle='#a89b78';ctx.lineWidth=1.8*T;ctx.lineJoin='round';ctx.lineCap='round';
 path(m.id===TRAIL?[[14,33],[12,30],[5,28],[5,22],[14,22],[14,18],[23,16],[23,8],[14,5]]:[[12,33],[8,29],[8,25],[10,23],[17,22],[17,16],[17,14],[7,13],[7,9],[12,4],[12,2]]);
 ctx.strokeStyle='#77845e';ctx.lineWidth=.45*T;
 for(let i=0;i<40;i++){const x=2+(i*17%((m.w-4)*10))/10,y=2+(i*29%((m.h-4)*10))/10;ctx.beginPath();ctx.moveTo(x*T,y*T);ctx.lineTo(x*T+6,y*T-9);ctx.stroke();}
 if(m.id===TRAIL){ctx.fillStyle='#65939b';ctx.beginPath();ctx.moveTo(26*T,0);ctx.lineTo(28*T,0);ctx.lineTo(28*T,19*T);ctx.lineTo(26*T,18*T);ctx.closePath();ctx.fill();
  for(const [x,y,label]of [[14,32,'여행길'],[5,26,'숲길'],[14,18,'샛길'],[23,9,'강둑']]){ctx.fillStyle='#ddd6ac';ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.fillText(label,x*T,y*T+20);}
 }else{
 const cp=CHECKS[s.ancient.war.escape.checkpoint];ctx.strokeStyle='#d9ddad';ctx.lineWidth=2;ctx.strokeRect((cp[0]-1.2)*T,(cp[1]-.5)*T,2.4*T,.7*T);
 for(const g of rt?.guards||[]){if(g.mode==='down')continue;const angle={up:-Math.PI/2,down:Math.PI/2,left:Math.PI,right:0}[g.direction],range=(g.id===0?2.8:3.8)*Math.max(.75,1-s.ancient.war.escape.failures*.035);
 ctx.beginPath();ctx.moveTo(g.x*T,g.y*T);for(let i=0;i<=28;i++){const a=angle-.64+1.28*i/28;let d=.1;for(;d<range;d+=.1)if(warBlocked(ESCAPE,g.x+Math.cos(a)*d,g.y+Math.sin(a)*d))break;ctx.lineTo((g.x+Math.cos(a)*Math.min(d,range))*T,(g.y+Math.sin(a)*Math.min(d,range))*T);}ctx.closePath();ctx.fillStyle=g.mode==='chase'?'#eb92514b':g.mode==='suspect'?'#f0cc6650':'#edda8132';ctx.fill();
 }
 }
}
export function drawWarActor(ctx,e,T,clock,s,avatarSource){const p=e.actorData,x=e.x*T,y=e.y*T,d=p.direction==='up'?'back':p.direction==='down'?'front':p.direction,pose=p.moving?'walk-'+(1+Math.floor(clock*7)%2):'idle';
 const a=e.refugee!==undefined?APPEARANCES[e.refugee]:{hair:0,eyes:2,skin:1,hairColor:0,outfit:2};const im=avatarSource(a,d,pose),idle=avatarSource(a,d,'idle'),shown=im.complete&&im.naturalWidth?im:idle;
 if(!shown.complete||!shown.naturalWidth)return;ctx.save();ctx.translate(x,y);const down=p.mode==='down',collapse=down?Math.min(1,1-p.downTime/.5):0;if(down){ctx.translate(0,-14);ctx.rotate(-Math.PI/2*collapse);ctx.scale(1,1-.12*collapse);}
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';const bob=p.moving?Math.sin(clock*17)*1.5:0;ctx.drawImage(shown,-31,-77+bob,62,77);
 if(e.refugee===undefined){const color=guardSide(s)==='백제'?'#80564d':'#4c6868';
 // Equipment layers sit on the existing SD body, never replace the figure.
 ctx.fillStyle=color;ctx.strokeStyle='#2e3d38';ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(-9,-46+bob);ctx.lineTo(9,-46+bob);ctx.lineTo(11,-27+bob);ctx.lineTo(-11,-27+bob);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='#aeb29c';ctx.lineWidth=1;for(let z=0;z<3;z++){ctx.beginPath();ctx.moveTo(-8,-42+z*5+bob);ctx.lineTo(8,-42+z*5+bob);ctx.stroke();}ctx.fillStyle='#697774';ctx.beginPath();ctx.moveTo(-13,-62+bob);ctx.quadraticCurveTo(-12,-79+bob,0,-79+bob);ctx.quadraticCurveTo(12,-79+bob,13,-62+bob);ctx.lineTo(-13,-62+bob);ctx.fill();ctx.stroke();
 ctx.strokeStyle='#65523a';ctx.lineWidth=3;const swing=p.moving?Math.sin(clock*9)*4:0;ctx.beginPath();ctx.moveTo(18,-8+swing);ctx.lineTo(18,-58+swing);ctx.stroke();ctx.fillStyle='#b8c4bc';ctx.beginPath();ctx.moveTo(18,-68+swing);ctx.lineTo(14,-56+swing);ctx.lineTo(22,-56+swing);ctx.fill();
 }
 ctx.restore();ctx.textAlign='center';ctx.font='bold 12px system-ui';ctx.fillStyle=down?'#f3dcb7':'#fff6d9';ctx.fillText(e.refugee!==undefined?'백성 '+(e.refugee+1):down?'기절 · 제압됨':p.mode==='chase'?'! 발견':p.mode==='suspect'?'? 의심':guardSide(s)+' 순찰병',x,y+17);
 if(down){ctx.fillStyle='#ecd26f';ctx.font='18px system-ui';ctx.fillText('✧',x+22,y-24+Math.sin(clock*4)*3);}
}
