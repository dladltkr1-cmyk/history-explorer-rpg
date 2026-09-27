export const entity=(id,type,x,y,name,extra={})=>({id,type,x,y,name,...extra});
export function map(id,name,theme,entities=[],extras={}){
  let obstacles=[];
  for(let x=0;x<24;x++)obstacles.push({x,y:0,art:theme==='cave'?'rock':'tree'},{x,y:17,art:theme==='cave'?'rock':'tree'});
  for(let y=1;y<17;y++)obstacles.push({x:0,y,art:theme==='cave'?'rock':'tree'},{x:23,y,art:theme==='cave'?'rock':'tree'});
  [[2,3],[3,3],[20,3],[21,3],[2,13],[3,14],[20,14],[21,13],[15,3],[16,14],[8,14]].forEach(([x,y],i)=>obstacles.push({x,y,art:theme==='cave'?'rock':i%3===0?'pine':'tree'}));
  if(id.startsWith('pre-')&&theme!=='cave')[[4,10],[7,2],[13,13],[16,7],[4,15],[20,12],[8,6]].forEach(([x,y],i)=>obstacles.push({x,y,art:i%3===0?'rock':i%2?'pine':'tree'}));
  if(id==='bronze-outskirts')[[4,5],[7,10],[10,4],[13,13],[16,4],[19,7],[20,14],[5,15],[15,9]].forEach(([x,y],i)=>obstacles.push({x,y,art:i%3===0?'rock':i%2?'pine':'tree'}));
  if(id.startsWith('go-'))obstacles=obstacles.map((o,i)=>({...o,art:'goTree',...(i>78?{x:Math.max(1,Math.min(22,o.x+(i%2?.7:-.6))),y:Math.max(1,Math.min(16,o.y-.5))}:{})}));
  return {id,name,theme,w:24,h:18,start:{x:11,y:10},entities,obstacles,...extras};
}
export const exit=(id,x,y,name,to)=>entity(id,'exit',x,y,name,{to,art:'portal'});
export const person=(id,x,y,name,lines,art='elder',extra={})=>entity(id,'npc',x,y,name,{lines,art,...extra});
export const relic=(id,x,y,name,art)=>entity(id,'artifact',x,y,name,{artifact:id,art});
export const MONSTER_NAMES={boar:'멧돼지',wolf:'늑대',snake:'뱀',bear:'곰',tiger:'호랑이',bandit:'산적'};
export const foe=(id,x,y,enemy,extra={})=>entity(id,'enemy',x,y,extra.eliteName||MONSTER_NAMES[enemy],{enemy,art:enemy,...extra});
