import {TRAIL,ESCAPE,warMap,beginTrail,beginEscape,restoreWar,inspectWar,deliverWarNews,createEscapeRuntime,canAmbush,ambush,trailStep,stepEscape,tryEscape,resetEscape,restoreStraggler,guardSide,CHECKS,warPeriod} from './war-story.js?v=55';
export function createWarUI(api){
 const {$,state,panel,close,save,hud,toast,travel,finishEvent,imageTag}=api;let runtime=null,identity=null,exiting=false;
 const s=()=>state(),w=()=>s().ancient.war;
 function sync(){if(identity!==s()||!warMap(s().map)){identity=s();runtime=null;}if(s().map===ESCAPE&&!runtime)runtime=createEscapeRuntime(s());return runtime;}
 function commit(){save();hud();}
 function near(e){return Math.hypot(s().x-e.x,s().y-e.y)<1.65;}
 function history4(){panel('369년 · 치양 전투',`${imageTag('kingGeunchogo','근초고왕','story-person')}<p>고국원왕이 치양을 공격했어.<br>근초고왕은 <b>태자 근구수</b>를 보내 대응했지.<br>근구수가 이끄는 백제군이 고구려군을 물리쳤어.</p><p class="note">전령길과 주민에게 소식을 전하는 임무는 게임용 창작이야. 실제 전쟁 결과를 바꾸지는 않아.</p><button id="war-finish4" class="primary full">369년 치양 전투 기록 · 30엽전 / 평판 +3 / 경험치 12</button>`);$('#war-finish4').onclick=()=>{if(!deliverWarNews(s()))return;close();finishEvent('ancient:4c-chiyang');travel('ancient-han');toast('전령에게 돌아가 371년 이야기를 이어가자.');};}
 function history5(){panel('371년 · 평양성 전투',`<p>근초고왕은 태자 근구수와 함께 평양성을 공격했어.<br>이 전투에서 고구려의 고국원왕이 전사했지.<br>당시 백제는 고구려와의 경쟁에서 우세했어.</p><p>두 사람과 함께 안전한 길을 찾았어. 전쟁 속에서 사람들을 도운 모험을 기억하자.</p><p class="note">피란길·순찰·구출은 게임용 창작이야. 왕을 직접 공격한 이야기는 아니야.</p><button id="war-finish5" class="primary full">371년 평양성 전투 기록 · 35엽전 / 평판 +3 / 경험치 12</button>`);$('#war-finish5').onclick=()=>{if(!warPeriod(s())||s().map!==ESCAPE||s().progress.ancient!==25||!w().escape.escaped||!near({x:12,y:2}))return;w().escape.history=true;close();finishEvent('ancient:4c-pyongyang');travel('ancient-han');panel('다음 이야기 · 바다를 건너는 사신단','<p>다음은 372년, 백제와 중국 동진의 외교 이야기야.</p><p>QUEST 6은 다음 업데이트에서 이어진다.</p>');};}
 function journey(){const index=s().progress.ancient,version=index===24?4:5;if(![24,25].includes(index))return;
 const country=s().ancient.country;
 if(s().ancient.home.commerce.cart.active){panel('먼 길을 떠나기 전에','<p>지금 운송 중인 수레 짐이 있어. 먼저 한강에서 납품하거나 마을 게시판에서 운송을 취소하고 돌아오자.</p><p>운송 기록과 물건은 그대로 남아 있어.</p>');return;}
 panel(version===4?'369년 · 치양의 급한 소식':'시간이 흘러 · 371년',version===4?'<p>치양에서 고구려와 백제가 싸운다는 소식이야.<br>위험한 길을 살펴 주민들에게 알려 줄래?</p><div class="war-route">한강 유역 → 먼 북쪽 여행길 → 치양 부근 산길</div><p class="note">멀리 떨어진 곳을 압축한 게임 여행이야. 실제 도로나 전투를 복원한 지도는 아니야.</p><button id="war-go" class="primary full">전령길로 출발</button>':`<p>고구려와 백제 사이에 다시 큰 전쟁이 벌어졌어.<br>이번에는 백제가 북쪽으로 진격해 평양성을 공격했지.</p><p>${country==='goguryeo'?'고구려 주민 두 명이 피란길에서 고립됐어. 백제 측 순찰병을 피해 주민을 돕자.':country==='baekje'?'백제에서 온 여행자로서 고립된 주민을 돕자. 주변을 경계하는 고구려 측 순찰병이 있어.':'전쟁 지역을 지나던 여행자로서 고립된 주민을 돕자. 고구려 측 순찰병이 길을 지키고 있어.'}</p><div class="war-route">한강 유역 → 긴 여행 → 평양성 주변 가상 피란길</div><p class="note">피란길 구출과 군사의 배치는 창작이야. 선택한 나라의 군사가 되거나 실제 전쟁 결과를 바꾸지는 않아.</p><button id="war-go" class="primary full">두 사람과 피란길로</button>`);
 $('#war-go').onclick=()=>{if(s().ancient.country!==country||s().progress.ancient!==index||!(index===24?beginTrail(s()):beginEscape(s())))return;close();travel(index===24?TRAIL:ESCAPE);restoreWar(s());identity=null;sync();commit();toast(index===24?'길목의 발자국부터 조사해 보자.':'두 사람: 뒤를 따라갈게요! 첫 순찰병의 등을 살펴보자.');};
 }
 function pause(){if(!warMap(s().map))return false;panel('잠시 쉬어 가기',`<p>${s().map===TRAIL?'전령길':'피란길'} 진행은 안전 지점에 기록돼.</p><button id="war-resume" class="primary full">계속하기</button><button id="war-regroup" class="full">안전 지점에서 다시 모이기</button><button id="war-leave" class="full">한강으로 돌아가기</button><p class="note">다시 전령을 만나면 안전 지점부터 이어져. 재산은 잃지 않아.</p>`);$('#war-regroup').onclick=()=>{if(s().map===ESCAPE)restoreStraggler(s(),sync());else restoreWar(s());commit();close();};$('#war-resume').onclick=close;$('#war-leave').onclick=()=>{if(!warMap(s().map))return;exiting=false;close();travel('ancient-han');};return true;}
 function interact(e){if(e.type!=='warStory')return false;if(!near(e))return true;if(e.id==='war-messenger'){journey();return true;}if(e.id==='war-back'){pause();return true;}
 if(e.clue){if(inspectWar(s(),e.clue)){commit();panel(e.name,`<p>${{fork:'큰길에는 군사들의 말발굽 자국이 많아. 서쪽 숲길을 살펴보자.',fallen:'쓰러진 나무가 숲길을 막았어. 나무를 치우기보다 동쪽의 바위 사이 통로를 찾아보자.',watch:'서쪽 강가는 군사들이 지나는 길이야. 동쪽 강둑의 좁은 길을 따라 북쪽으로 가자.'}[e.clue]}</p>`);}return true;}
 if(e.id==='war-recipient'){if(w().trail.stage!==3||w().trail.clues.length!==3){panel('소식을 기다리는 사람','<p>길의 세 구간과 현장 흔적 세 곳을 모두 살펴보고 알려 주렴.</p>');}else history4();return true;}
 if(e.id==='war-escape'){const result=tryEscape(s(),sync());if(result==='guard')toast('먼저 순찰병 한 명 이상을 뒤에서 기습해야 해.');if(result==='people')toast('아직 백성들이 뒤따라오고 있어!');if(result==='success'){exiting=true;commit();}if(w().escape.escaped)history5();return true;}return true;
 }
 function tick(dt,blocked){sync();const visible=api.playing()&&warMap(s().map);$('#war-controls').hidden=!visible;if(!visible)return;const isEscape=s().map===ESCAPE;
 $('#war-ambush').hidden=!isEscape;$('#war-follow').hidden=!isEscape;$('#war-ambush').disabled=!canAmbush(s(),runtime)||Boolean(api.screen());$('#war-follow').disabled=Boolean(api.screen())||exiting;
 $('#war-follow').textContent=w().escape.waiting?'따라와':'기다려';
 const e=w().escape,t=w().trail;
 const line=isEscape?`호위 2명 · 제압 ${e.down.filter(Boolean).length}/3 · 안전 지점 ${e.checkpoint+1}/3${e.waiting?' · 백성 대기 중':''}${runtime.guards.some(g=>g.mode==='chase')?' · 발견! 엄폐물 뒤로!':runtime.guards.some(g=>g.mode==='suspect')?' · 의심받는 중!':''}`:`전령길 ${t.stage+1}/4 · 흔적 ${t.clues.length}/3${t.failures>=2?' · 큰길보다 좁은 숲길을 살펴보자.':''}`;
 if($('#war-status').textContent!==line)$('#war-status').textContent=line;
 if(api.screen())return;
 if(isEscape){const ev=stepEscape(s(),runtime,dt,blocked);if(ev==='caught'){exiting=false;commit();panel('순찰병에게 붙잡혔다',`<p>두 사람과 안전 지점 ${e.checkpoint+1}로 돌아왔어. 재산이나 체력은 잃지 않았어.</p><p>${e.failures>=2?'시야가 조금 좁아지고 순찰이 느려졌어. 울타리와 바위 뒤에서 기다려 보자.':'적의 앞쪽 부채꼴을 피해 등을 돌아가 보자.'}</p><button id="war-retry" class="primary full">다시 도전</button>`);$('#war-retry').onclick=close;}else if(ev==='escaped'){commit();history5();}else if(ev){commit();if(ev==='checkpoint')toast('두 사람과 안전 지점을 통과했다.');}
 }else{const ev=trailStep(s());if(ev){commit();toast(ev==='danger'?'위험한 큰길이야! 안전 지점으로 돌아왔어. HP와 엽전은 그대로야.':'안전한 우회로를 찾았다.');}}
 }
 $('#war-ambush').onclick=()=>{if(api.screen())return;if(ambush(s(),sync())){api.clearKeys();toast('뒤에서 접근해 제압!');}};
 $('#war-follow').onclick=()=>{if(api.screen()||s().map!==ESCAPE||s().progress.ancient!==25||w().escape.escaped)return;w().escape.waiting=!w().escape.waiting;commit();};
 $('#war-pause').onclick=pause;
 function prepareQA(f){identity=null;runtime=null;exiting=false;sync();if(s().map!==ESCAPE)return;const id=f.id||'';
  if(id==='escort-ambush'){s().x=7.8;s().y=26.2;Object.assign(runtime.guards[0],{x:7.8,y:25.2,direction:'up',pause:8});}
  else if(['escort-exit','escort-zero','escort-one','escort-both'].includes(id)){s().x=12;s().y=2;runtime.followers=[{x:12,y:3,direction:'up'},{x:12,y:id==='escort-one'?7:3.8,direction:'up'}];}
  else {restoreWar(s());runtime=createEscapeRuntime(s());}
  if(id==='escort-caught'){Object.assign(runtime.guards[1],{x:s().x+.2,y:s().y,direction:'left',mode:'chase',alert:2,lastTarget:{x:s().x,y:s().y}});}
  if(id==='escort-lag')runtime.followers[1]={x:12,y:32,direction:'up'};
 }
 return {tick,interact,pause,actors:()=>{sync();return s().map===ESCAPE?runtime:null;},locked:()=>Boolean(runtime?.action||runtime?.escapeTime)&&s().map===ESCAPE,ambush:()=>$('#war-ambush').click(),reset:()=>{identity=null;runtime=null;exiting=false;},prepareQA,history5};
}
