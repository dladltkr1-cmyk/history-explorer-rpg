// Political history is separate from century maps and all personal property.
export const HAN_PHASES={
 'baekje-4':{century:4,country:'baekje',name:'4세기 · 백제 중심',text:'한강은 백제의 중심 지역이야. 나루를 오가며 물건을 교환하고 있어.',events:[]},
 'baekje-pre475':{century:5,country:'baekje',name:'5세기 · 한성 함락 이전',text:'아직 백제가 한강 유역을 차지하고 있어. 475년 사건은 아직 일어나지 않았어.',events:[]},
 'goguryeo-post475':{century:5,country:'goguryeo',name:'475년 이후 · 고구려 확보',text:'고구려가 한성을 차지하고 한강 유역을 확보했어. 백제는 웅진으로 수도를 옮겼어.',events:['hansong-475']},
 'goguryeo-pre551':{century:6,country:'goguryeo',name:'6세기 · 551년 이전',text:'고구려가 한강 유역을 차지하고 있어. 백제와 신라의 재확보는 아직 일어나지 않았어.',events:['hansong-475']},
 'alliance-551':{century:6,country:'baekje',secondary:'silla',name:'551년 · 백제·신라 확보',text:'백제와 신라가 고구려로부터 한강 유역을 되찾았어. 백제는 하류, 신라는 상류를 나누어 차지해.',events:['hansong-475','han-551']},
 'silla-post553':{century:6,country:'silla',name:'553년 이후 · 신라 중심',text:'신라가 한강 하류까지 차지했어. 한강 주변의 길과 나루에도 신라의 표식이 보여.',events:['hansong-475','han-551','han-553']},
};
export const VILLAGE_GEOGRAPHY={goguryeo:{label:'북쪽 본거지의 생활마을',route:'북쪽 생활마을 → 남쪽으로 이어지는 여행길 → 한강 유역'},baekje:{label:'남쪽 내륙의 생활마을',route:'남쪽 내륙 생활마을 → 북쪽으로 이어지는 여행길 → 한강 유역'},silla:{label:'경주 주변의 생활마을',route:'경주 주변 생활마을 → 서북쪽 여행길 → 한강 유역'}};
export const freshHanHistory=()=>({revision:1,phase:'baekje-4',events:[]});
export const hanPhase=s=>HAN_PHASES[s.ancient?.history?.phase]||HAN_PHASES['baekje-4'];
export function validateHanHistory(a){
 a.history??=freshHanHistory();const h=a.history,p=HAN_PHASES[h?.phase];
 if(!h||h.revision!==1||!p||!Array.isArray(h.events)||JSON.stringify(h.events)!==JSON.stringify(p.events))throw Error('한강 역사 상태를 읽을 수 없다.');
 a.history={revision:1,phase:h.phase,events:[...h.events]};
}
// Only implemented, registered quest completions can trigger these events.
// Add real quest IDs here together with that future content update, never menu buttons.
export const HAN_EVENT_QUESTS=Object.freeze({});
export function completeHanHistoricalEvent(s,event){
 const quest=HAN_EVENT_QUESTS[event];if(!quest||!s.completedQuests.includes(quest))return false;
 const next={'hansong-475':'goguryeo-post475','han-551':'alliance-551','han-553':'silla-post553'}[event],p=HAN_PHASES[next],h=s.ancient.history;
 if(!p||JSON.stringify(h.events)!==JSON.stringify(p.events.slice(0,-1)))return false;
 h.phase=next;h.events=[...p.events];return true;
}
export function previewHanHistory(s,phase,{admin=false}={}){if(!admin||!HAN_PHASES[phase])return false;s.ancient.history={revision:1,phase,events:[...HAN_PHASES[phase].events]};return true;}
export function nearHanJourney(s,e){const c=s.ancient?.country;return Boolean(c&&e?.type==='exit'&&((s.map==='ancient-village-'+c&&e.id==='ancient-han-door-'+c&&e.to==='ancient-han')||(s.map==='ancient-han'&&e.id==='ancient-han-return'&&e.to==='ancient-village-'+c))&&Math.hypot(s.x-e.x,s.y-e.y)<1.8);}
export function reputationDetails(n){const bounds=[0,10,30,55,80],names=['새로 온 사람','마을에 익숙한 사람','믿음받는 사람','이름난 사람','마을의 신뢰를 얻은 사람'];let i=bounds.findLastIndex(x=>n>=x);return {name:names[i],next:n===100?'최고 단계':i===4?'최고 단계 (100점)':names[i+1],remaining:n===100?0:(bounds[i+1]??100)-n};}
