// Chapter 1 closure rules. No general combat, inventory or history-phase mutation.
export const ENVOY={x:18,y:5.3};
export const EXHIBIT_ID='han-trade-plaque';
export const VOYAGE_STAGES=[{name:'강에서 바다로',seconds:24,speed:145},{name:'서해의 바닷길',seconds:27,speed:165},{name:'거친 물결',seconds:29,speed:178}];
export const VOYAGE_RECORDS=[['ancient-4c-voyage','372년 동진과의 외교','372년 백제는 중국 동진과 공식 외교 관계를 맺었다. 항해 조종과 장애물은 창작 체험이다.'],['ancient-4c-finale','4세기 백제편 완료','한강의 이점, 남쪽 진출, 고구려와의 경쟁, 동진 외교를 살펴보았다.']];
export const REVIEW=[
 {id:'river',title:'한강의 이점',art:'boat',time:'한강을 중심으로 성장',text:'넓은 들에서 농사짓고, 강을 따라 많은 물자를 옮기기 좋았어.'},
 {id:'south',title:'남쪽으로 성장',art:'cargo',time:'남쪽 여러 지역과 관계 변화',text:'근초고왕 때 백제는 남쪽으로 영향력을 넓혔어. 마한 여러 세력의 통합 시기와 범위는 연구가 이어지고 있어.'},
 {id:'competition',title:'고구려와의 경쟁',art:'king',time:'369년 치양 → 371년 평양성',text:'369년에는 태자 근구수가 고구려군을 물리쳤어. 371년 근초고왕과 태자는 평양성을 공격했고, 고국원왕이 전사했지.'},
 {id:'diplomacy',title:'동진과의 외교',art:'document',time:'372년 사신 파견',text:'백제는 중국 동진과 공식 외교 관계를 맺었어. 외교는 나라끼리 뜻을 전하고 관계를 맺는 일이야. 물건을 사고파는 교역과는 달라.'}
];
export const FINAL_QUIZ=[
 {id:'han-growth',question:'백제가 한강 유역을 중심으로 성장하는 데 도움이 된 이유는?',options:['한강 주변에는 다른 나라가 전혀 없었기 때문에','농사짓기 좋고 강을 따라 물자를 옮기기 편리했기 때문에','한강을 차지하면 전쟁이 절대 일어나지 않았기 때문에'],answer:1,hint:'한강 주변의 들과 물길을 떠올려 보자.'},
 {id:'geunchogo-era',question:'4세기 근초고왕 때의 역사적 사실로 알맞은 것은?',options:['백제가 평양성을 공격하고 중국 동진과 외교 관계를 맺었다.','고구려 장수왕이 한성을 함락하고 백제가 웅진으로 수도를 옮겼다.','신라 진흥왕이 한강 유역을 차지했다.'],answer:0,hint:'369년·371년·372년의 기록을 다시 떠올려 보자. 나머지 두 사건은 더 뒤의 이야기야.'}
];
export const freshVoyage=()=>({revision:1,prepared:false,boarded:false,started:false,stage:0,hull:3,failures:[0,0,0],seed:372,success:false,history:false,review:[],quiz:0,ending:false});
export function validateVoyage(a){a.voyage??=freshVoyage();const v=a.voyage,int=(n,max)=>Number.isInteger(n)&&n>=0&&n<=max;
 if(!v||v.revision!==1||!['prepared','boarded','started','success','history','ending'].every(k=>typeof v[k]==='boolean')||!int(v.stage,3)||!int(v.hull,3)||!int(v.seed,2147483646)||!Array.isArray(v.failures)||v.failures.length!==3||v.failures.some(n=>!int(n,99999))||!Array.isArray(v.review)||v.review.some(id=>!REVIEW.some(r=>r.id===id))||new Set(v.review).size!==v.review.length||!int(v.quiz,2)||v.success!==(v.stage===3)||v.boarded&&!v.prepared||v.started&&!v.boarded||v.history&&!v.success||v.ending&&v.quiz!==2||v.quiz>0&&v.review.length!==4)throw Error('항해·마지막 역사 기록을 읽을 수 없다.');
 a.voyage=structuredClone(v);
}
export const atEnvoy=s=>Boolean(s.ancient?.country&&s.ancient.home.owned&&s.map==='ancient-han'&&s.ancient.century===4&&s.ancient.history.phase==='baekje-4'&&Number.isFinite(s.x)&&Number.isFinite(s.y)&&Math.hypot(s.x-ENVOY.x,s.y-ENVOY.y)<1.65);
export const activeVoyage=s=>atEnvoy(s)&&s.progress.ancient===26&&!s.ancient.home.commerce.cart.active;
export const activeFinale=s=>atEnvoy(s)&&s.progress.ancient===27;
export function prepareVoyage(s){if(!activeVoyage(s))return false;s.ancient.voyage.prepared=true;return true;}
export function boardVoyage(s){if(!activeVoyage(s)||!s.ancient.voyage.prepared)return false;s.ancient.voyage.boarded=true;s.ancient.voyage.started=true;return true;}
export function voyagePattern(stage,seed=372,failures=0){const profile=VOYAGE_STAGES[stage];if(!profile)return [];let n=(seed+stage*997)>>>0,previous=1;const rnd=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};const rows=[];
 for(let time=1.2,i=0;time<profile.seconds-5;time+=3.2,i++){
  const safe=Math.max(0,Math.min(2,previous+(rnd()<.5?-1:1)));previous=i===0?1:safe;
  for(let lane=0;lane<3;lane++)if(lane!==previous)rows.push({id:stage+'-'+i+'-'+lane,at:time,x:[205,500,795][lane],kind:stage===0?'log':rnd()<.55?'reef':'log',rx:(stage===0?58:64)*(failures>=3?.9:1),ry:stage===0?30:42});
 }return rows;
}
export function createVoyageRuntime(s){const v=s.ancient.voyage;return {stage:v.stage,elapsed:0,x:500,lean:0,invulnerable:0,splash:0,hitIds:[],status:v.success?'arrived':v.hull===0?'failed':'sailing',paused:false,rows:voyagePattern(v.stage,v.seed,v.failures[v.stage]||0)};}
export function obstaclePosition(rt,o,failures=0){return {x:o.x,y:-150+(rt.elapsed-o.at)*VOYAGE_STAGES[rt.stage].speed*(failures>=3?.84:1)};}
export function voyageCollision(x,y,o){return ((x-o.x)/(54+o.rx))**2+((y-o.y)/(100+o.ry))**2<1;}
export function stepVoyage(s,rt,dt,input=0){if(!activeVoyage(s)||!s.ancient.voyage.started||rt.stage!==s.ancient.voyage.stage||rt.status!=='sailing'||rt.paused||!Number.isFinite(dt)||dt<=0)return '';
 const v=s.ancient.voyage;let event='',remaining=Math.min(dt,5);
 while(remaining>0&&rt.status==='sailing'){
  const h=Math.min(remaining,1/120);remaining-=h;rt.elapsed+=h;rt.invulnerable=Math.max(0,rt.invulnerable-h);rt.splash=Math.max(0,rt.splash-h);
  const flow=rt.stage===2?Math.sin(rt.elapsed*.72)*38:0,axis=Math.sign(input);rt.x=Math.max(110,Math.min(890,rt.x+(axis*360+flow)*h));rt.lean+=(axis*.095+flow*.0007-rt.lean)*Math.min(1,h*7);
  if(rt.invulnerable===0){for(const row of rt.rows){const o={...row,...obstaclePosition(rt,row,v.failures[rt.stage])};if(rt.elapsed<row.at||rt.hitIds.includes(o.id))continue;if(voyageCollision(rt.x,525,o)){v.hull--;rt.hitIds.push(o.id);rt.invulnerable=1.3;rt.splash=.55;event='hit';if(v.hull===0){v.failures[v.stage]=Math.min(99999,v.failures[v.stage]+1);rt.status='failed';return 'failed';}break;}}}
  if(rt.elapsed>=VOYAGE_STAGES[rt.stage].seconds){v.stage++;v.success=v.stage===3;rt.status=v.success?'arrived':'checkpoint';return v.success?'arrived':'checkpoint';}
 }return event;
}
export function retryVoyage(s,rt){if(!activeVoyage(s)||rt.status!=='failed'||rt.stage!==s.ancient.voyage.stage)return false;s.ancient.voyage.hull=3;return true;}
export function confirmDiplomacy(s){if(!activeVoyage(s)||!s.ancient.voyage.success)return false;s.ancient.voyage.history=true;return true;}
export function reviewRecord(s,id){const v=s.ancient.voyage;if(!activeFinale(s)||!REVIEW.some(r=>r.id===id))return false;if(!v.review.includes(id))v.review.push(id);return true;}
export function answerFinal(s,index,answer){const v=s.ancient.voyage;if(!activeFinale(s)||v.review.length!==4||v.quiz!==index||!FINAL_QUIZ[index]||FINAL_QUIZ[index].answer!==answer)return false;v.quiz++;return true;}
export function completeEnding(s){const v=s.ancient.voyage;if(!activeFinale(s)||v.review.length!==4||v.quiz!==2)return false;v.ending=true;return true;}
export function voyageEventAllowed(s,q,event){if(!q||q.event!==event||s.completedQuests.includes(q.id))return false;const v=s.ancient.voyage;
 return q.id==='ancient-4c-voyage'?activeVoyage(s)&&v.started&&v.prepared&&v.boarded&&v.success&&v.history:q.id==='ancient-4c-finale'?activeFinale(s)&&v.review.length===4&&v.quiz===2&&v.ending:false;
}
export const VOYAGE_QA=[
 ...[['voyage-start','QUEST 6 · 372년 도입',{}],['voyage-prep','출항 준비',{prepared:true}],['voyage-board','배 탑승 직전',{prepared:true}],['voyage-stage1','항해 1구간 시작',{prepared:true,boarded:true,started:true}],['voyage-hit','1구간 충돌',{prepared:true,boarded:true,started:true,hull:2}],['voyage-stage2','1구간 완료 · 2구간',{prepared:true,boarded:true,started:true,stage:1}],['voyage-reef','암초 충돌',{prepared:true,boarded:true,started:true,stage:1,hull:2}],['voyage-one','내구도 1칸',{prepared:true,boarded:true,started:true,stage:1,hull:1}],['voyage-failed','내구도 0 · 현재 구간 재도전',{prepared:true,boarded:true,started:true,stage:1,hull:0,failures:[0,1,0]}],['voyage-stage3','2구간 완료 · 거친 물살',{prepared:true,boarded:true,started:true,stage:2}],['voyage-help','반복 실패 완화',{prepared:true,boarded:true,started:true,stage:2,failures:[0,0,3]}],['voyage-success','최종 성공 · 동진 외교',{prepared:true,boarded:true,started:true,stage:3,success:true}]].map(([id,name,voyage])=>({id,name,index:26,voyage})),
 ...[['finale-start','QUEST 7 · 역사 기록판',{}],['finale-records','네 역사 기록 확인',{review:REVIEW.map(r=>r.id)}],['finale-quiz1','확인 문제 1 / 오답 재도전',{review:REVIEW.map(r=>r.id)}],['finale-quiz2','확인 문제 2',{review:REVIEW.map(r=>r.id),quiz:1}],['finale-ending','두 문제 정답 · 근초고왕 엔딩',{review:REVIEW.map(r=>r.id),quiz:2}],['finale-full','전시 3칸 가득 찬 상태',{review:REVIEW.map(r=>r.id),quiz:2}],['finale-done','기록판 지급 · 4세기 완료 / 5세기 대기',{review:REVIEW.map(r=>r.id),quiz:2,ending:true}]].map(([id,name,voyage])=>({id,name,index:id==='finale-done'?28:27,voyage}))
];
