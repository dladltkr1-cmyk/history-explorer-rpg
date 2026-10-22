// v55 field-only story rules. No economy, ordinary combat or player appearance mutation.
export const TRAIL='ancient-chiyang-trail',ESCAPE='ancient-pyongyang-escape';
export const warMap=id=>id===TRAIL||id===ESCAPE;
export const WAR_RECORDS=[['ancient-4c-chiyang','369년 치양 전투','고국원왕의 공격에 근초고왕은 태자 근구수를 보내 대응했다. 백제군이 고구려군을 물리쳤다.'],['ancient-4c-pyongyang','371년 평양성 전투','근초고왕과 태자 근구수가 평양성을 공격했고 고구려의 고국원왕이 전사했다. 피란길 구출은 게임용 창작이다.']];
export const CHECKS=[[12,32],[10,23],[17,14]];
export const TRAIL_CHECKS=[[14,32],[5,26],[14,18],[23,9]];
export const PATROLS=[[[7.8,25.2],[10.8,25.2]],[[14.5,16],[20,16]],[[5,6],[11,6]]];
const rect=(x,y,w,h,art='warFence')=>({x,y,w,h,art});
export const TRAIL_WALLS=[rect(15,27,20,.65),rect(6.5,20,11,.65,'warLog'),rect(23,20,6,.65,'rock'),rect(13,11,18,.65),rect(4,6,4,.65,'rock')];
export const ESCAPE_WALLS=[rect(3.5,27,5,.6),rect(17,27,10,.6),rect(8.5,19,15,.6),rect(21,19,2,.6),rect(3,11,4,.6),rect(16,11,12,.6),rect(11,21.6,2.6,1,'warRock'),rect(16,17.5,2.2,.8,'warRock'),rect(9,8.5,2.4,.9,'warRock')];
export const TRAIL_TREES=[[2,31],[7,31],[24,31],[3,24],[9,24],[10,16],[18,15],[25,7],[18,5]];
export const ESCAPE_TREES=[[4,31],[18,31],[4,23],[20,23],[3,15],[12,15],[20,9],[15,5],[3,3]];
const inRect=(p,r,pad=0)=>Math.abs(p.x-r.x)<r.w/2+pad&&Math.abs(p.y-r.y)<r.h/2+pad;
export function warBlocked(map,x,y){const p={x,y};return (map===TRAIL?TRAIL_WALLS:map===ESCAPE?ESCAPE_WALLS:[]).some(r=>inRect(p,r,.22))||(map===TRAIL?TRAIL_TREES:map===ESCAPE?ESCAPE_TREES:[]).some(([x,y])=>Math.abs(p.x-x)<.72&&Math.abs(p.y-y)<.62);}
const point=(x,y)=>({x,y,direction:'up',moving:false});
export const freshWar=()=>({revision:1,trail:{started:false,stage:0,clues:[],failures:0,delivered:false,history:false},escape:{started:false,checkpoint:0,down:[false,false,false],failures:0,waiting:false,escaped:false,history:false}});
const int=(n,max)=>Number.isInteger(n)&&n>=0&&n<=max;
export function validateWar(a){a.war??=freshWar();const w=a.war,t=w?.trail,e=w?.escape;if(w?.revision!==1||!t||!e||!['started','delivered','history'].every(k=>typeof t[k]==='boolean')||!int(t.stage,3)||!int(t.failures,99999)||!Array.isArray(t.clues)||t.clues.some(k=>!['fork','fallen','watch'].includes(k))||new Set(t.clues).size!==t.clues.length||!['started','waiting','escaped','history'].every(k=>typeof e[k]==='boolean')||!int(e.checkpoint,2)||!int(e.failures,99999)||!Array.isArray(e.down)||e.down.length!==3||e.down.some(x=>typeof x!=='boolean'))throw Error('전령길·피란길 기록을 읽을 수 없다.');a.war=structuredClone(w);}
export const warPeriod=s=>s.ancient?.country&&s.ancient?.home.owned&&s.ancient.century===4&&s.ancient.history.phase==='baekje-4';
export const atWar=(s,id,x,y,index)=>warPeriod(s)&&s.map===id&&s.progress.ancient===index&&Number.isFinite(s.x)&&Number.isFinite(s.y)&&Math.hypot(s.x-x,s.y-y)<1.65;
export function beginTrail(s){if(!atWar(s,'ancient-han',12,5,24)||s.ancient.home.commerce.cart.active)return false;s.ancient.war.trail.started=true;return true;}
export function beginEscape(s){if(!atWar(s,'ancient-han',12,5,25)||s.ancient.home.commerce.cart.active)return false;s.ancient.war.escape.started=true;return true;}
export function restoreWar(s){const w=s.ancient?.war;if(!w||!warMap(s.map))return;if(s.map===TRAIL){const p=TRAIL_CHECKS[w.trail.stage];[s.x,s.y]=p;}else {[s.x,s.y]=CHECKS[w.escape.checkpoint];}s.direction='up';}
export function inspectWar(s,key){const t=s.ancient.war.trail,spots={fork:[12,30],fallen:[5,22],watch:[23,14]};const p=spots[key];if(!p||!t.started||!atWar(s,TRAIL,...p,24))return false;if(!t.clues.includes(key))t.clues.push(key);return true;}
export function trailStep(s){if(!warPeriod(s)||s.map!==TRAIL||s.progress.ancient!==24||!s.ancient.war.trail.started)return '';const t=s.ancient.war.trail;
 const bad=(t.stage===0&&s.y<28&&s.y>25&&s.x>14)||(t.stage===2&&s.y<12&&s.y>9&&s.x<13);
 if(bad){t.failures=Math.min(99999,t.failures+1);restoreWar(s);return 'danger';}
 const next=TRAIL_CHECKS[t.stage+1];if(next&&Math.hypot(s.x-next[0],s.y-next[1])<1.4){t.stage++;return 'checkpoint';}return '';
}
export function deliverWarNews(s){const t=s.ancient.war.trail;if(!t.started||t.stage!==3||t.clues.length!==3||!atWar(s,TRAIL,14,4,24))return false;t.delivered=true;t.history=true;return true;}
export function warEventAllowed(s,q,event){if(!q||q.event!==event||s.completedQuests.includes(q.id))return false;const w=s.ancient.war;if(q.id==='ancient-4c-chiyang')return atWar(s,TRAIL,14,4,24)&&w.trail.started&&w.trail.stage===3&&w.trail.delivered&&w.trail.history;if(q.id==='ancient-4c-pyongyang')return atWar(s,ESCAPE,12,2,25)&&w.escape.started&&w.escape.down.some(Boolean)&&w.escape.escaped&&w.escape.history;return false;}
const dirVec=d=>({up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[d]||[0,-1]);
const face=(dx,dy)=>Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'up':'down';
export function lineClear(a,b){const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.12));for(let i=1;i<steps;i++)if(warBlocked(ESCAPE,a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps))return false;return true;}
export function sees(g,p,range=3.7){const dx=p.x-g.x,dy=p.y-g.y,d=Math.hypot(dx,dy),v=dirVec(g.direction);return d>0&&d<range&&(dx*v[0]+dy*v[1])/d>Math.cos(.64)&&lineClear(g,p);}
export const guardSide=s=>s.ancient.country==='goguryeo'?'백제':'고구려';
export function createEscapeRuntime(s){const e=s.ancient.war.escape,p=CHECKS[e.checkpoint];return {followers:[point(p[0],p[1]+.8),point(p[0],p[1]+1.6)],trail:[point(p[0],p[1]+1.6),point(p[0],p[1]+.8),point(p[0],p[1])],guards:PATROLS.map((r,i)=>({...point(...r[0]),id:i,leg:1,pause:i===0?1.5:.5,direction:i===0?'up':'right',alert:0,mode:e.down[i]?'down':'patrol',downTime:0})),elapsed:0,escapeTime:0,action:null};}
export function canAmbush(s,rt){if(!rt||s.map!==ESCAPE||s.progress.ancient!==25||!warPeriod(s)||!s.ancient.war.escape.started||s.ancient.war.escape.escaped||rt.action||rt.guards.some(g=>g.mode==='chase'))return null;return rt.guards.find(g=>{if(['down','chase'].includes(g.mode))return false;const dx=s.x-g.x,dy=s.y-g.y,d=Math.hypot(dx,dy),v=dirVec(g.direction);return d>.1&&d<1.25&&(dx*v[0]+dy*v[1])/d<-.35&&lineClear(g,s);})??null;}
export function ambush(s,rt){const g=canAmbush(s,rt);if(!g)return false;rt.action={time:0,id:g.id};s.direction=face(g.x-s.x,g.y-s.y);g.mode='stunned';g.alert=0;return true;}
function move(a,target,speed,dt,blocked=()=>false){const dx=target.x-a.x,dy=target.y-a.y,d=Math.hypot(dx,dy),dist=Math.min(d,speed*dt);a.moving=d>.04;if(!a.moving)return true;a.direction=face(dx,dy);const x=a.x+dx/d*dist,y=a.y+dy/d*dist;if(!blocked(x,y)){a.x=x;a.y=y;}return d<=speed*dt+.04;}
export function resetEscape(s,rt){const e=s.ancient.war.escape;e.failures=Math.min(99999,e.failures+1);e.waiting=false;restoreWar(s);Object.assign(rt,createEscapeRuntime(s));}
export function tryEscape(s,rt){const e=s.ancient.war.escape;if(!warPeriod(s)||!atWar(s,ESCAPE,12,2,25)||!e.started||e.escaped)return 'inactive';if(!e.down.some(Boolean))return 'guard';if(rt.followers.some(p=>Math.hypot(p.x-12,p.y-2)>2.8))return 'people';e.waiting=false;rt.escapeTime=.001;return 'success';}
export function stepEscape(s,rt,dt,blocked){if(!rt||s.map!==ESCAPE||s.progress.ancient!==25||!warPeriod(s))return '';const e=s.ancient.war.escape;rt.elapsed+=dt;for(const g of rt.guards)g.downTime=Math.max(0,g.downTime-dt);
 if(rt.escapeTime){rt.escapeTime+=dt;move(s,{x:12,y:1},1.8,dt);rt.followers.forEach((p,i)=>move(p,{x:12,y:1.6+i*.65},2.8,dt));if(rt.escapeTime>2.5){e.escaped=true;s.x=12;s.y=2;return 'escaped';}return '';}
 if(e.escaped)return '';
 if(rt.action){rt.action.time+=dt;const g=rt.guards[rt.action.id];if(rt.action.time>.6){g.mode='down';g.downTime=.5;e.down[g.id]=true;rt.action=null;return 'ambush';}return '';}
 const end=rt.trail.at(-1);if(Math.hypot(s.x-end.x,s.y-end.y)>.10)rt.trail.push(point(s.x,s.y));if(rt.trail.length>1500){rt.trail.shift();rt.followers.forEach(p=>p.cursor=Math.max(0,(p.cursor||0)-1));}
 if(!e.waiting){rt.followers.forEach((p,i)=>{
  let lag=.8*(i+1),idx=rt.trail.length-1;
  for(;idx>0;idx--){const a=rt.trail[idx],b=rt.trail[idx-1],d=Math.hypot(a.x-b.x,a.y-b.y);if(lag<=d)break;lag-=d;}
  if(p.cursor===undefined){let bd=Infinity;p.cursor=0;rt.trail.forEach((a,j)=>{const d=Math.hypot(a.x-p.x,a.y-p.y);if(d<bd){bd=d;p.cursor=j;}});}
  if(p.cursor>idx){p.moving=false;return;}
  let budget=4.1*dt;p.moving=false;
  while(budget>0&&p.cursor<=idx){const a=rt.trail[p.cursor],d=Math.hypot(a.x-p.x,a.y-p.y);if(d<.025){p.cursor++;continue;}
   const amount=Math.min(budget,d),x=p.x+(a.x-p.x)/d*amount,y=p.y+(a.y-p.y)/d*amount;
   if(blocked(x,y)){p.moving=false;break;}p.direction=face(x-p.x,y-p.y);p.x=x;p.y=y;p.moving=true;budget-=amount;if(amount>=d-.001)p.cursor++;else break;
  }
 });}else rt.followers.forEach(p=>p.moving=false);
 for(const g of rt.guards){if(g.mode==='down')continue;const range=(g.id===0?2.8:3.8)*Math.max(.75,1-e.failures*.035);const target=[s,...rt.followers].find(p=>sees(g,p,range));
  if(target){g.alert=Math.min(2.2,g.alert+dt);g.mode=g.alert>.8?'chase':'suspect';g.lastTarget={x:target.x,y:target.y};}else {g.alert=Math.max(0,g.alert-dt*.55);if(g.mode==='chase'&&g.alert<.1)g.mode='patrol';else if(g.mode==='suspect'&&g.alert===0)g.mode='patrol';}
  if(g.mode==='chase'){move(g,g.lastTarget,2.3,dt,(x,y)=>blocked(x,y));if([s,...rt.followers].some(p=>Math.hypot(p.x-g.x,p.y-g.y)<.52)){resetEscape(s,rt);return 'caught';}}
  else if(g.mode==='patrol'){g.pause-=dt;if(g.pause<=0){const at=PATROLS[g.id][g.leg];if(move(g,{x:at[0],y:at[1]},(.72+g.id*.16)*Math.max(.65,1-e.failures*.04),dt,(x,y)=>blocked(x,y))){g.leg=1-g.leg;g.pause=1.5;g.moving=false;}}else g.moving=false;}
 }
 const next=CHECKS[e.checkpoint+1];if(next&&e.down[0]&&Math.hypot(s.x-next[0],s.y-next[1])<1.65&&rt.followers.every(p=>Math.hypot(p.x-next[0],p.y-next[1])<3.1)&&!rt.guards.some(g=>g.mode==='chase')){e.checkpoint++;return 'checkpoint';}
 return '';
}
export function restoreStraggler(s,rt){if(s.map!==ESCAPE||s.progress.ancient!==25||!warPeriod(s))return false;restoreWar(s);Object.assign(rt,createEscapeRuntime(s));return true;}
