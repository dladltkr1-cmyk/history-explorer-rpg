import {CARGO,CARGO_ROUNDS,EXCHANGES,STORY_RECORDS,takeStoryParcel,deliverStoryParcel,observeStory,cargoBalance,placeCargo,departCargo,exchangeStory,chooseStoryRoute,seeStoryCourt,storyActive} from './baekje-story.js?v=55';
const sprite=(id,alt='',cls='')=>`<img class="${cls}" src="/assets/story/${id}.svg?v=55" alt="${alt}">`;
const cargoName=id=>CARGO[id]?.name||'천';
export function createBaekjeStoryUI(api){
 const {$,panel,close,save,hud,toast,finishEvent,imageTag}=api,s=()=>api.state(),b=()=>s().ancient.baekje4c;
 const commit=()=>{save();hud();};
 const allowed=(index,key)=>storyActive(s(),index,key);
 const fail=()=>{close();toast('지금 이야기의 담당자 가까이에서 다시 조사하자.');};
 function sender(){
  if(!allowed(21,'sender')){panel('마을 교역 담당자','<p>한강 이야기는 내 거처의 이야기 책상에서 확인해 보렴.</p>');return;}
  const intro={baekje:'우리 백제가 한강을 바탕으로 자라고 있어.',goguryeo:'북쪽에서 왔구나. 백제가 성장하는 한강을 함께 살펴보렴.',silla:'경주에서 왔구나. 여러 나라 사람들이 한강에서 물건을 바꾼단다.'}[s().ancient.country];
  panel('QUEST 1 · 한강으로 가는 첫 거래',`${imageTag('shopkeeper','마을 교역 담당자','story-person')}<p>${intro}<br>이 곡식 견본 꾸러미를 나루지기에게 전해 줄래?</p><p class="note">이야기 전용 물품이야. 농작물이나 수레는 필요 없어.</p><button id="story-take" class="primary full" ${b().parcel||b().delivered?'disabled':''}>${b().parcel?'꾸러미를 챙겼다':'곡식 견본 꾸러미 받기'}</button>`);
  $('#story-take').onclick=()=>{if(!takeStoryParcel(s()))return fail();commit();close();toast('마을 동쪽 한강 여행길로 가자.');};
 }
 function keeper(){
  if(s().progress.ancient===22){cargo();return;}
  if(!allowed(21,'keeper')){panel('나루지기','<p>강을 따라 물건을 보내고 있어. 지금의 이야기 목표를 살펴보렴.</p>');return;}
  if(!b().delivered){panel('나루지기',`${imageTag('shop-merchant-wood','나루지기','story-person')}<p>${b().parcel?'마을에서 보낸 꾸러미구나. 잘 가져왔어!':'네 마을 교역 담당자에게 이야기 꾸러미를 받아 오렴.'}</p><button id="story-deliver" class="primary full" ${b().parcel?'':'disabled'}>곡식 견본 꾸러미 전달</button>`);$('#story-deliver').onclick=()=>{if(!deliverStoryParcel(s()))return fail();commit();observe();};return;}
  observe();
 }
 function observe(){
  if(!allowed(21,'keeper'))return fail();
  panel('한강 나루 · 둘러보기',`<p>강·배·곡식 짐을 하나씩 눌러 살펴보자.</p><div class="story-harbor"><div class="story-ripples"></div>${sprite('dock','나무 부두','harbor-dock')}${sprite('boat','강의 목선','harbor-boat')}${sprite('cargo','곡식과 항아리','harbor-cargo')}<button data-story-observe="river" class="spot river">강 ${b().observed.includes('river')?'✓':''}</button><button data-story-observe="boat" class="spot boat">배 ${b().observed.includes('boat')?'✓':''}</button><button data-story-observe="grain" class="spot grain">곡식 짐 ${b().observed.includes('grain')?'✓':''}</button></div><p id="story-observation" aria-live="polite">${b().observed.length}/3 곳을 살펴봤다.</p><button id="story-finish1" class="primary full" ${b().observed.length===3?'':'disabled'}>한강 첫 거래 기록 · 20엽전 / 평판 +2 / 경험치 12</button>`,{wide:true,type:'baekje-story'});
  document.querySelectorAll('[data-story-observe]').forEach(el=>el.onclick=()=>{if(!allowed(21,'keeper'))return fail();observeStory(s(),el.dataset.storyObserve);commit();const text={river:'넓은 한강 주변은 농사짓기 좋고, 강은 물건을 옮기는 길이 되었어.',boat:'배를 이용하면 많은 짐을 먼 곳까지 옮길 수 있어.',grain:'백제는 한강 유역을 중심으로 성장했어. 이 짐과 상인의 이야기는 게임용 창작이야.'};el.textContent=({river:'강',boat:'배',grain:'곡식 짐'}[el.dataset.storyObserve])+' ✓';$('#story-observation').textContent=text[el.dataset.storyObserve];$('#story-finish1').disabled=b().observed.length!==3;});
  $('#story-finish1').onclick=()=>{if(!allowed(21,'keeper')||b().observed.length!==3)return fail();close();finishEvent('ancient:4c-trade');cargo();};
 }
 function cargo(selected=null){
  if(!allowed(22,'keeper'))return fail();
  if(b().round===3){departed(true);return;}
  const ids=CARGO_ROUNDS[b().round],bal=cargoBalance(b()),diff=bal.right-bal.left;
  panel('QUEST 2 · 나루터에 쌓인 짐',`<div class="story-topline"><b>${b().round+1} / 3라운드</b><span>왼쪽 ${bal.left} · 오른쪽 ${bal.right}</span></div><p>짐을 고른 다음 배의 왼쪽이나 오른쪽을 눌러 놓자.</p><div class="cargo-water"><div class="story-ripples"></div>${sprite('dock','부두','cargo-dock')}<div class="cargo-vessel" style="--tilt:${Math.max(-7,Math.min(7,diff*2))}deg">${sprite('boat-deck','화물을 싣는 나무 배','cargo-hull')}<div class="cargo-deck">${['left','right'].map(side=>`<button data-cargo-side="${side}" class="cargo-side" aria-label="${side==='left'?'왼쪽':'오른쪽'}에 놓기"><span>${side==='left'?'왼쪽':'오른쪽'}</span><div>${ids.map((id,i)=>b().placements[i]===side?sprite(id,cargoName(id),'placed-cargo'):'').join('')}</div></button>`).join('')}</div></div></div><div class="cargo-picks">${ids.map((id,i)=>`<button data-cargo-pick="${i}" class="${selected===i?'selected':''}" aria-pressed="${selected===i}">${sprite(id,cargoName(id))}<span>${cargoName(id)} <b>${CARGO[id].weight}</b></span><small>${b().placements[i]==='left'?'왼쪽':b().placements[i]==='right'?'오른쪽':'아직 싣지 않음'}</small></button>`).join('')}</div><p id="cargo-hint" aria-live="polite">${bal.ready?'균형이 맞아! 출항할 수 있어.':selected!==null?'이제 놓을 쪽을 골라 줘.':'짐을 모두 싣고 양쪽 무게 차이를 1 이하로 맞춰 보자.'}</p><div class="row"><button id="cargo-hint-button">도움말</button><button id="cargo-depart" class="primary" ${bal.ready?'':'disabled'}>이 배 출항</button></div><p class="note">언제든 짐을 골라 다시 놓을 수 있어. 닫아도 지금 배치가 저장돼.</p>`,{wide:true,type:'baekje-story'});
  document.querySelectorAll('[data-cargo-pick]').forEach(el=>el.onclick=()=>cargo(Number(el.dataset.cargoPick)));
  document.querySelectorAll('[data-cargo-side]').forEach(el=>el.onclick=()=>{if(!allowed(22,'keeper'))return fail();if(selected===null){$('#cargo-hint').textContent='아래에서 먼저 짐을 하나 골라 줘.';return;}if(placeCargo(s(),selected,el.dataset.cargoSide)){commit();cargo(selected);}});
  $('#cargo-hint-button').onclick=()=>{$('#cargo-hint').textContent=b().round===2?'무게 3+1과 2+2를 나누어 실어 보자.':b().round===1?'큰 자루 3과 항아리 2+작은 자루 1을 나누어 보자.':'무게 2인 짐을 한쪽에 하나씩 놓아 보자.';};
  $('#cargo-depart').onclick=()=>{if(!departCargo(s()))return fail();commit();departed(b().round===3);};
 }
 function departed(last){
  if(!allowed(22,'keeper'))return fail();
  panel('배가 출발한다',`<div class="story-harbor sailing">${sprite('dock','나루의 부두','harbor-dock')}<div class="leaving-boat">${sprite('boat','균형을 맞추고 출발하는 배')}${sprite('cargo','실은 짐')}</div><div class="story-ripples"></div></div><p>좋아! 이제 배가 기울지 않겠어.<br>강을 따라 먼 곳까지 물건을 보낼 수 있지.</p><button id="cargo-next" class="primary full">${last?'나루터 일 돕기 기록 · 25엽전 / 평판 +2 / 경험치 12':'다음 배 준비'}</button>`,{wide:true,type:'baekje-story'});
  $('#cargo-next').onclick=()=>{if(!allowed(22,'keeper'))return fail();if(last){close();finishEvent('ancient:4c-cargo');toast('나루지기 북쪽의 남쪽 상인을 찾아가자.');}else cargo();};
 }
 function south(first=null,second=null){
  if(!allowed(23,'south')){panel('남쪽에서 온 상인','<p>나루지기의 일을 먼저 도와주렴. 우리는 남쪽에서 물건을 가져왔어.</p>');return;}
  if(b().exchanges===3){routes();return;}
  const stage=b().exchanges,people=EXCHANGES[stage];
  panel('QUEST 3 · 남쪽에서 온 상인',`<div class="story-topline"><b>교역 ${b().exchanges+1} / 3</b><span>필요한 물건을 서로 바꾸자.</span></div><p>상인 두 명을 골라 교환 내용을 확인해 보자.</p><div class="story-merchants">${people.map((p,i)=>`<button data-story-merchant="${i}" class="${[first,second].includes(i)?'selected':''}" aria-pressed="${[first,second].includes(i)}">${imageTag(p.art,p.name)}<b>${p.name}</b><span>${sprite(p.have,cargoName(p.have))}가진 것: ${cargoName(p.have)}</span><small>필요한 것: ${cargoName(p.need)}</small></button>`).join('')}</div><p id="exchange-hint" aria-live="polite">${second!==null?people[first].name+'의 '+cargoName(people[first].have)+' ↔ '+people[second].name+'의 '+cargoName(people[second].have):'양쪽 모두 필요한 물건을 받을 수 있어야 해.'}</p><button id="exchange-confirm" class="primary full" ${second!==null?'':'disabled'}>이 물건끼리 교환하기</button><p class="note">가방의 물건과 엽전은 쓰지 않아. 이 상인과 거래는 게임용 이야기야.</p>`,{wide:true,type:'baekje-story'});
  document.querySelectorAll('[data-story-merchant]').forEach(el=>el.onclick=()=>{const i=Number(el.dataset.storyMerchant);if(first===null||second!==null)south(i,null);else if(i===first)south();else south(first,i);});
  $('#exchange-confirm').onclick=()=>{if(!allowed(23,'south'))return fail();if(!exchangeStory(s(),first,second,stage)){$('#exchange-hint').textContent='상대가 필요한 물건이 아니야. 가진 것과 필요한 것을 함께 보자.';return;}commit();panel('물건을 바꾸었다',`<div class="exchange-scene">${imageTag(people[first].art,people[first].name,'exchange-person')}${sprite(people[first].have,cargoName(people[first].have),'exchange-out')}${sprite(people[second].have,cargoName(people[second].have),'exchange-in')}${imageTag(people[second].art,people[second].name,'exchange-person')}</div><p>서로 필요한 물건을 받았어!</p><button id="exchange-next" class="primary full">${b().exchanges===3?'이제 물건을 보낼 길 고르기':'다음 거래 살펴보기'}</button>`,{wide:true,type:'baekje-story'});$('#exchange-next').onclick=()=>south();};
 }
 function routes(){
  if(!allowed(23,'south'))return fail();
  if(b().routes===2){court();return;}
  const inland=b().routes===1;
  panel('물건을 보낼 길',`<p><b>${inland?'배가 닿지 않는 내륙 마을로 천을 보내야 해.':'무거운 곡식 짐을 많이 옮겨야 해. 두 곳은 강으로 이어져 있어.'}</b></p><div class="route-map"><svg viewBox="0 0 600 250" aria-label="게임용 물길과 육로 지도"><path d="M0 175Q130 90 275 169T600 155" fill="none" stroke="#75aaa8" stroke-width="62"/><path d="M35 55Q185 15 330 70T555 55" fill="none" stroke="#c9b17b" stroke-width="17"/><path d="M220 36L246 9L276 46M369 48L400 12L433 60" fill="#7c9372"/><path d="M35 69L35 42L58 27L81 42L81 69M500 73L500 44L524 29L548 44L548 73" fill="#8d6248" stroke="#594333" stroke-width="3"/><text x="18" y="99" font-size="19" fill="#333">육로 · 내륙 마을</text><text x="375" y="222" font-size="19" fill="#244c50">물길 · 나루</text></svg><div id="route-traveler"></div></div><p id="route-hint" aria-live="polite">상황에 맞는 길을 고르면 실제로 물건을 보내.</p><div class="row"><button data-story-route="water">배를 이용하는 물길</button><button data-story-route="land">육로를 이용하기</button></div><p class="note">역사 속의 정확한 교역로를 복원한 지도는 아니야.</p>`,{wide:true,type:'baekje-story'});
  document.querySelectorAll('[data-story-route]').forEach(el=>el.onclick=()=>{if(!allowed(23,'south'))return fail();if(!chooseStoryRoute(s(),el.dataset.storyRoute)){$('#route-hint').textContent=inland?'그 마을까지는 물길이 이어지지 않아.':'좁은 산길보다 배로 많은 짐을 옮기기 편리해.';return;}commit();document.querySelectorAll('[data-story-route]').forEach(e=>e.disabled=true);$('#route-traveler').className='travel-'+el.dataset.storyRoute;$('#route-traveler').innerHTML=el.dataset.storyRoute==='water'?sprite('boat','짐을 운반하는 목선')+sprite('cargo','배에 실은 곡식 짐','route-boat-cargo'):sprite('walking-merchant','천을 지고 걷는 상인')+sprite('cloth','운반하는 천');$('#route-hint').textContent='물건이 도착했어. 서로 다른 길을 알맞게 이용했네.';const next=document.createElement('button');next.id='route-next';next.className='primary full';next.textContent='이어서 보기';next.onclick=routes;$('#route-hint').after(next);});
 }
 function court(){
  if(!allowed(23,'south')||b().routes!==2)return fail();
  const remark={baekje:'우리 백제가 한강을 바탕으로 성장하고 있구나.',goguryeo:'고구려와 경쟁하던 백제의 성장 모습을 살펴봤어.',silla:'신라에서 온 여행자로서 여러 지역의 교류를 살펴봤어.'}[s().ancient.country];
  panel('이야기 장면 · 백제의 궁정',`<div class="story-court"><div class="court-banner">백제 · 4세기</div>${sprite('geunchogo','근초고왕 전용 SD 캐릭터','court-king')}<span class="court-name">근초고왕 · 재위 346~375년</span></div><p>“한강을 오가는 사람들이 늘고 있구나.<br>남쪽 여러 지역과도 관계가 넓어지고 있어.”</p><p>${remark}<br>근초고왕 때 백제는 남쪽으로 영향력을 넓혔어.</p><p class="note">왕이 나루터에 왔다는 뜻은 아니야. 궁정 모습과 대사는 게임용 창작이야. 마한의 통합 범위와 시기는 연구가 이어지고 있어.</p><button id="story-finish3" class="primary full">백제의 남쪽 진출 기록 · 30엽전 / 평판 +2 / 경험치 12</button>`,{wide:true,type:'baekje-story'});
  $('#story-finish3').onclick=()=>{if(!allowed(23,'south'))return fail();seeStoryCourt(s());close();finishEvent('ancient:4c-south');panel('한강에서 바다까지 · 첫 모험 완료','<p>한강에서 짐을 옮기고, 서로 필요한 물건을 바꾸었어.</p><p>다음 이야기: 369년, 치양의 급한 소식.<br>한강의 북쪽 전령을 찾아가자.</p><button id="story-return-field" class="primary full">한강으로 돌아가기</button>');$('#story-return-field').onclick=close;};
 }
 function interact(e){if(e.type!=='baekjeStory')return false;if(e.id==='story-sender')sender();else if(e.id==='story-keeper')keeper();else south();return true;}
 function adminPanel(){api.ancientAdmin();}
 return {interact,cargo,south,adminPanel};
}
