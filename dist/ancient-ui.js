import {ANCIENT_COUNTRIES,ANCIENT_CHAPTERS,ANCIENT_MAPS,ANCIENT_QUESTS,ANCIENT_QA,ancientDestination,ancientQuest} from './regions/ancient.js?v=42.2';
import {chooseAncientCountry,setAncientCentury,transferAncientStorage,noteAncientVisit,syncAncient,ANCIENT_EXHIBITS} from './ancient-state.js?v=42.2';

const peninsula='M 69 9 L 80 15 L 76 23 L 83 30 L 76 39 L 73 49 L 76 56 L 75 66 L 78 73 L 72 83 L 67 91 L 59 97 L 51 96 L 46 92 L 44 86 L 45 81 L 42 76 L 45 70 L 42 64 L 45 59 L 45 53 L 40 48 L 42 40 L 39 33 L 46 28 L 47 21 L 55 19 L 60 13 Z';
const names={...Object.fromEntries(Object.entries(ANCIENT_COUNTRIES).map(([id,c])=>[id,c.name])),gaya:'가야'};
export function ancientMapSVG(century) {
  const d=ANCIENT_MAPS[century],colors={goguryeo:'#719b9d',baekje:'#ce936c',silla:'#c8b765',gaya:'#aa99b4'};
  return `<svg viewBox="20 0 75 105" class="ancient-history-map" role="img" aria-label="${d.title} ${d.phase}"><defs><clipPath id="ancient-land"><path d="${peninsula}"/></clipPath><filter id="ancient-soft"><feGaussianBlur stdDeviation="2.5"/></filter></defs><path d="${peninsula}" fill="#e0d8b7" stroke="#8c9b85" stroke-width=".5"/><g clip-path="url(#ancient-land)" filter="url(#ancient-soft)">${d.regions.map(r=>`<ellipse cx="${r.x}" cy="${r.y}" rx="${r.rx}" ry="${r.ry}" fill="${colors[r.id]}" opacity=".72"/>`).join('')}</g><path d="M 47 59 Q 57 61 68 59" stroke="#568f9a" stroke-width="1" fill="none"/><text x="33" y="61" fill="#354d57">한강</text>${d.regions.map(r=>`<text x="${r.x}" y="${r.y}" text-anchor="middle" fill="#293e3a" font-weight="bold">${names[r.id]}${century===6&&r.id==='gaya'?'*':''}</text>`).join('')}${d.routes.includes('sea')?'<path d="M 42 72 Q 28 62 33 40" stroke="#aa7955" stroke-dasharray="2 2" fill="none"/><text x="25" y="72">바닷길</text>':d.routes.includes('south')?'<path d="M 58 33 Q 52 47 50 56" stroke="#4f7e80" stroke-width="1.4" fill="none"/><path d="M 47 53 L 50 57 L 53 53" fill="none" stroke="#4f7e80"/>':'<circle cx="49" cy="59" r="4" fill="none" stroke="#aa903d" stroke-width="1.5"/>'}</svg>`;
}
export function createAncientUI(api) {
  const {$,esc,panel,dialogue,imageTag,close,save,hud,toast,finishEvent,travel,adminJump,activeQuest,items,maps,prepareContentQA,regions}=api;
  const state=()=>api.state(),isAdmin=()=>api.admin();
  function countryChoice() {
    const s=state();
    if(s.ancient.country&&!isAdmin()){toast('이미 머물 나라를 정했다.');return;}
    if((s.progress.ancient||0)!==16&&!isAdmin()){toast('네 건국 이야기와 확인 문제를 먼저 마치자.');return;}
    panel('어느 나라에 머물까?',`<p>머무는 마을은 달라도 세 나라와 가야의 역사를 모두 배우게 된다.</p><div class="ancient-country-cards">${Object.entries(ANCIENT_COUNTRIES).map(([id,c])=>`<button data-country="${id}">${imageTag(c.art,c.name+'의 작은 거처')}<b>${c.name}</b><small>${id==='goguryeo'?'산기슭의 거점':id==='baekje'?'강으로 이어진 거점':'들판의 거점'}</small></button>`).join('')}</div><p class="note">어느 나라를 골라도 공격력·방어력·체력은 같다.</p>`,{wide:true});
    document.querySelectorAll('[data-country]').forEach(b=>b.onclick=()=>{
      const id=b.dataset.country,c=ANCIENT_COUNTRIES[id];
      panel(c.name+'에서 시작할까?',`<p>확정하면 이 나라에 내 거처를 마련한다.<br>이후에도 다른 나라의 필수 이야기를 함께 경험한다.</p><div class="row"><button id="country-back">다시 고르기</button><button class="primary" id="country-confirm">시작하기</button></div>`);
      $('#country-back').onclick=countryChoice;
      $('#country-confirm').onclick=()=>{
        if(!chooseAncientCountry(s,id,{admin:isAdmin()}))return;
        close();finishEvent('ancient:country');save();travel(c.village);
      };
    });
  }
  function storage() {
    const s=state(),a=s.ancient;
    const ids=Object.keys(items).filter(id=>['food','material'].includes(items[id].kind)&&!items[id].questOnly&&items[id].sellable!==false&&((s.inventory[id]||0)||(a.home.storage[id]||0)));
    panel('내 거처 · 보관 공간',`<p>가방과 거처 사이에 물건을 옮길 수 있다. 세기가 바뀌어도 남는다.</p><label>옮길 개수<select id="ancient-count"><option value="1">1개</option><option value="5">5개</option><option value="10">10개</option></select></label><div class="ancient-storage-list">${ids.length?ids.map(id=>`<article><b>${esc(items[id].name)}</b><span>가방 ${s.inventory[id]||0} · 보관 ${a.home.storage[id]||0}</span><div class="row"><button data-store="${id}" ${s.inventory[id]?'':'disabled'}>맡기기</button><button data-take="${id}" ${a.home.storage[id]?'':'disabled'}>꺼내기</button></div></article>`).join(''):'<p>가방과 보관 공간에 옮길 물건이 없다.</p>'}</div>`,{wide:true});
    for(const [attr,to]of [['store',true],['take',false]])document.querySelectorAll(`[data-${attr}]`).forEach(b=>b.onclick=()=>{
      const id=b.dataset[attr],count=Number($('#ancient-count').value);
      if(!transferAncientStorage(s,items,id,count,to)){toast('옮길 수 있는 개수를 확인해 보자.');return;}
      save();hud();storage();
    });
  }
  function display() {
    const a=state().ancient;
    panel('내 거처 · 전시 공간',a.home.exhibits.length?`<div class="nation-records">${a.home.exhibits.map(id=>`<article><b>${esc(ANCIENT_EXHIBITS[id].name)}</b><p>${esc(ANCIENT_EXHIBITS[id].text)}</p></article>`).join('')}</div>`:'<div class="ancient-empty-display">세 칸의 전시 자리가 비어 있다.</div><p>앞으로 문화 이야기를 경험하면 이곳에 기록을 전시할 수 있다.</p>');
  }
  function chapters() {
    const s=state(),a=s.ancient,p=s.progress.ancient||0;
    if(p===19){
      panel('시간이 흐른다',`<div class="ancient-time"><small>정착을 마쳤다.</small><strong>4세기</strong><p>백제가 한강을 중심으로 성장하고 있다.</p></div><button id="ancient-begin4" class="primary full">새 시기 시작하기</button>`);
      $('#ancient-begin4').onclick=()=>{if(!setAncientCentury(s,4))return;close();finishEvent('ancient:4c-start');noteAncientVisit(s,s.map);save();hud();toast('지도에서 4세기의 모습을 확인해 보자.');};return;
    }
    panel('고대 국가 이야기',`<p>${a.country?ANCIENT_COUNTRIES[a.country].name+'의 내 거처':'건국 이야기'} · ${a.century?a.century+'세기':'정착 전'}</p><div class="ancient-chapters">${ANCIENT_CHAPTERS.map(c=>`<article><b>${c.name}</b><p>${c.theme||''}</p><small>${a.chapter===c.id?'현재 시기':a.completedChapters.includes(c.id)?'완료':c.ready?'이야기 기록':'다음 이야기 준비 중'}</small></article>`).join('')}</div>${a.century?'<button id="ancient-current-map" class="primary full">현재 시기 지도 보기</button>':''}<p class="note">4~6세기 왕의 본격 임무와 문화·교류·통일 이야기는 후속 업데이트에서 이어진다.</p>`,{wide:true});
    if(a.century)$('#ancient-current-map').onclick=historicalMap;
  }
  function historicalMap() {
    const s=state(),a=s.ancient;
    if(!a.century){panel('고대 국가의 길',`<p>지금은 건국 이야기와 정착을 진행하고 있다.<br>내 거처에서 4세기를 시작하면 역사 지도가 열린다.</p><button id="ancient-open-chapters" class="full">이야기 진행 보기</button>`);$('#ancient-open-chapters').onclick=chapters;return;}
    noteAncientVisit(s,s.map);if((s.progress.ancient||0)===20)finishEvent('ancient:4c-map');save();
    const d=ANCIENT_MAPS[a.century],current=ANCIENT_COUNTRIES[a.country];
    panel(d.title,`<p class="ancient-map-phase">${d.phase}</p><div class="ancient-map-layout">${ancientMapSVG(a.century)}<div><p>${esc(d.caption)}</p><p class="map-location">현재 위치: ${esc(maps[s.map].name)}</p><p>● 머무는 나라: ${current.name}<br>◆ 한강 유역: ${d.hanLabel}</p><div class="ancient-map-places">${[['village','내 마을',current.village],['home','내 거처',current.home],['han','한강 유역','ancient-han']].map(([id,name,map])=>`<button data-ancient-place="${map}" ${isAdmin()||a.maps[a.century].includes(map)?'':'disabled'}>${name}${s.map===map?' · 현재 위치':a.maps[a.century].includes(map)?' · 방문함':' · 길로 찾아가기'}</button>`).join('')}</div><p>다른 나라와 가야의 본격 지역은 다음 이야기에서 열린다.</p></div></div><p class="note">학습용 간략 지도 · 색은 주요 성장 지역을 나타낸다. 정확한 국경선이나 세기 전체의 고정 영토가 아니다.${a.century===6?' *가야는 여러 나라로 이루어졌으며 6세기에 차례로 신라에 병합되었다.':''}</p>`,{wide:true});
    document.querySelectorAll('[data-ancient-place]').forEach(b=>b.onclick=()=>travel(b.dataset.ancientPlace,s.map,{fast:true}));
  }
  function records() {
    const a=state().ancient,lines={goguryeo:'주몽 · 졸본. 알과 새의 도움이 등장하는 건국 이야기.',baekje:'온조 · 한강 유역. 고구려에서 남쪽으로 내려온 일행의 이야기.',silla:'박혁거세 · 경주. 특별한 알이 등장하는 건국 이야기.',gaya:'김수로 · 가야. 하늘과 알이 등장하는 건국 이야기. 가야에는 여러 나라가 있었다.'};
    panel('고대 국가 기록',`<div class="nation-records">${Object.keys(lines).map(id=>`<article><b>${names[id]}</b><p>${a.records.includes(id)?esc(lines[id]):'아직 살펴보지 않았다.'}</p></article>`).join('')}</div><p class="note">건국 이야기의 신비한 장면은 확인된 출생 사실과 구분한다.</p>`,{wide:true});
  }
  function interact(e,q) {
    const s=state();
    if(e.type==='ancientStorage'){storage();return true;}
    if(e.type==='ancientDisplay'){display();return true;}
    if(e.type==='ancientHome') {
      if(!s.ancient.home.owned){dialogue('내 거처',['먼저 마을 도우미를 만나 보자.'],e.art);return true;}
      panel('내 거처',`${imageTag(e.art,'나의 작은 거처','ancient-house-preview')}<p>작은 마당을 지나 집 안으로 들어간다.</p><button id="ancient-enter-home" class="primary full">들어가기</button>`);
      $('#ancient-enter-home').onclick=()=>{travel(e.to);finishEvent('ancient:home');};return true;
    }
    if(e.type==='quiz'&&e.quiz?.startsWith('ancient-')) {
      if(q?.event!=='quiz:'+e.quiz){dialogue(e.name,['먼저 지금의 이야기 임무를 마치자.'],e.art);return true;}
      return false;
    }
    if(e.type!=='ancientStory')return false;
    if(e.id==='ancient-choice'){countryChoice();return true;}
    if(e.id==='ancient-chapters'){chapters();return true;}
    if(e.gather) {
      if(q?.id!=='ancient-y-gather'){toast('지금은 가져갈 필요가 없다.');return true;}
      if(s.ancient.carry.includes(e.gather)){toast('이미 챙긴 물건이다.');return true;}
      panel(e.name,`<p>${esc(e.lines[0])}</p><button id="ancient-gather" class="primary full">챙기기</button>`);
      $('#ancient-gather').onclick=()=>{s.ancient.carry.push(e.gather);close();save();hud();if(['branch','cord'].every(id=>s.ancient.carry.includes(id)))finishEvent('ancient:y-gather');else toast('다른 물건도 찾아보자.');};return true;
    }
    if(e.id==='ancient-records'&&q?.id==='ancient-records') {
      panel('네 이야기 전달',`<p>숲길과 강가, 들판과 모임 자리의 기록을 모았다.</p><div class="ancient-record-bundles">${s.ancient.records.map(id=>`<span>${names[id]} 기록 ✓</span>`).join('')}</div><button id="ancient-deliver-records" class="primary full">기록 전달하기</button>`);
      $('#ancient-deliver-records').onclick=()=>{close();finishEvent('ancient:records');toast('마당 건너편의 확인 문제로 가 보자.');};return true;
    }
    if(q?.target!==e.id){dialogue(e.king?'건국 이야기 · '+e.name:e.name,e.lines.length?e.lines:['지금의 이야기 임무부터 이어가 보자.'],e.art);return true;}
    if(['ancient-g-trace','ancient-s-trace','ancient-b-trail','ancient-b-water','ancient-g-place','ancient-s-place','ancient-y-place'].includes(e.id)){
      panel(e.name,`<p class="ancient-legend">건국 이야기</p>${imageTag(e.art,'이야기 속 흔적','ancient-trace-preview')}<p>${e.lines.map(esc).join('<br>')}</p><button id="ancient-observe" class="primary full">${e.id==='ancient-b-trail'?'길 표식 챙기기':'살펴보고 기록하기'}</button>`);
      $('#ancient-observe').onclick=()=>{close();finishEvent(q.event);};return true;
    }
    dialogue(e.king?'건국 이야기 · '+e.name:e.name,e.lines,e.art,()=>finishEvent(q.event));return true;
  }
  function prepare(stage) {
    const s=state(),r=regions.find(v=>v.id==='ancient');
    const fixture=typeof stage==='string'?ANCIENT_QA.find(v=>v.id===stage):stage;
    if(!fixture)return;
    const ready=prepareContentQA(s,r,fixture);s.unlockedRegions=regions.map(v=>v.id);
    adminJump(ready.map,maps[ready.map].entities.find(e=>e.id===ready.target));
  }
  function adminPanel() {
    const s=state(),a=s.ancient;
    panel('고대 국가 시험',`<p class="note">기존 별도 시험 세션 · 원본 학생 기록에는 저장하지 않는다.</p><p>나라: ${a.country?names[a.country]:'선택 전'} · 시기: ${a.century?a.century+'세기':'건국/정착'}</p><h3>건국과 정착</h3><div class="admin-grid">${ANCIENT_QA.map(v=>`<button data-ancient-stage="${v.id}">${v.name}</button>`).join('')}</div><h3>머무는 나라 변경</h3><div class="row">${Object.entries(ANCIENT_COUNTRIES).map(([id,c])=>`<button data-ancient-country="${id}">${c.name}</button>`).join('')}</div><h3>세기·지도·한강 상태</h3><div class="admin-grid">${[4,5,6].map(n=>`<button data-ancient-century="${n}">${n}세기 상태</button><button data-ancient-map="${n}">${n}세기 지도</button><button data-ancient-han="${n}">${n}세기 한강</button>`).join('')}</div><button id="ancient-qa-home" class="full">내 거처 · 보관/전시 시험</button><button id="ancient-qa-reset-quiz" class="full">퀴즈 완료/재도전 기록 초기화</button><button id="ancient-qa-back" class="full">관리자 메뉴</button>`,{wide:true});
    document.querySelectorAll('[data-ancient-stage]').forEach(b=>b.onclick=()=>prepare(b.dataset.ancientStage));
    document.querySelectorAll('[data-ancient-country]').forEach(b=>b.onclick=()=>{if((s.progress.ancient||0)<17)prepare('chosen');chooseAncientCountry(s,b.dataset.ancientCountry,{admin:true});save();adminJump(ANCIENT_COUNTRIES[s.ancient.country].village);});
    const setup=n=>{if((s.progress.ancient||0)<19)prepare('4c');s.progress.ancient=21;syncAncient(s);setAncientCentury(s,n,{admin:true});save();};
    for(const attr of ['century','map','han'])document.querySelectorAll(`[data-ancient-${attr}]`).forEach(b=>b.onclick=()=>{
      const n=Number(b.dataset['ancient'+attr[0].toUpperCase()+attr.slice(1)]);setup(n);
      adminJump(attr==='han'?'ancient-han':ANCIENT_COUNTRIES[s.ancient.country].village);
      noteAncientVisit(s,s.map);save();if(attr==='map')historicalMap();
    });
    $('#ancient-qa-home').onclick=()=>{if((s.progress.ancient||0)<19)prepare('4c');adminJump(ANCIENT_COUNTRIES[s.ancient.country].home);};
    $('#ancient-qa-reset-quiz').onclick=()=>{prepare('quiz');toast('건국편 확인 문제를 다시 시험할 수 있다.');};
    $('#ancient-qa-back').onclick=api.adminPanel;
  }
  return {interact,choice:countryChoice,storage,display,chapters,map:historicalMap,records,prepare,adminPanel,entry:()=>{const s=state();if((s.progress.ancient||0)===0&&s.map==='ancient-origins')interact(maps[s.map].entities.find(e=>e.id==='ancient-guide'),activeQuest(s));}};
}
