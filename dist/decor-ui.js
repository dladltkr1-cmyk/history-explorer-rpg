import {DECOR,CROPS,DECOR_SLOTS,HOME_LEVELS,atHome,canPlaceDecor,placeDecor,decorPosition,toggleDecorLamp,setLifeLevel} from './homestead.js?v=52-furniture';
import {DECOR_VISUALS,decorDescription} from './decor-spec.js?v=52-furniture';
export function createDecorUI(api){
 const {$,panel,imageTag,esc,save,hud,toast}=api;let mode=null,pose=null,poseTimer,legacyTrial=null;
 const state=()=>api.state(),home=()=>state().ancient.home,area=()=>state().map.includes('-yard-')?'yard':'room';
 const activeSlots=()=>DECOR_SLOTS.slice(0,HOME_LEVELS[home().level].slots).filter(v=>v.area===area());
 function cancel(){mode=null;pose=null;clearTimeout(poseTimer);document.querySelector('#decor-mode')?.remove();document.querySelector('#decor-pose')?.remove();document.body.classList.remove('decorating');}
 function candidate(slot){
  const st=state(),h=home();if(!mode?.id)return false;
  const copy={...st,ancient:{...st.ancient,home:{...h,placements:{...h.placements}}}};
  if(mode.from)delete copy.ancient.home.placements[mode.from];return canPlaceDecor(copy,slot,mode.id);
 }
 function open(selected=null){
  if(!atHome(state()))return;api.close();mode={map:state().map,id:selected,slot:null,from:null};api.pause('decor');document.body.classList.add('decorating');render();
 }
 function render(){
  if(!mode)return;document.querySelector('#decor-mode')?.remove();
  const items=Object.entries(DECOR).filter(([id,d])=>home().decorations[id]&&(d.area==='both'||d.area===area()));
  const root=document.createElement('section');root.id='decor-mode';root.setAttribute('aria-label','눈으로 꾸미기');
  root.innerHTML=`<div class="decor-toolbar"><div><small>내 거처 · ${home().level}단계</small><strong>눈으로 꾸미기</strong></div><button id="decor-area">${area()==='room'?'마당 꾸미기':'집 안 꾸미기'}</button><button id="decor-exit">꾸미기 끝내기</button></div><div class="decor-sites">${activeSlots().map(v=>`<button data-decor-site="${v.id}" aria-label="${esc(v.name)} · ${home().placements[v.id]?DECOR[home().placements[v.id]].name:'빈 자리'}">＋<small>${v.name}</small></button>`).join('')}</div><div class="decor-dock"><p id="decor-hint">${mode.id?'놓을 자리를 골라 줘.':'① 보유한 가구 선택 → ② 자리를 터치 → ③ 놓기'}</p><div class="decor-inventory">${items.map(([id,d])=>{const used=Object.values(home().placements).filter(v=>v===id).length;return `<button data-decor-pick="${id}" aria-pressed="${mode.id===id}">${imageTag(d.art,d.name)}<b>${d.name}</b><small>${home().decorations[id]-used>0?'남음 '+(home().decorations[id]-used)+'개':'놓은 가구 옮기기'}</small></button>`;}).join('')||'<p>살림 가게에서 가구를 마련해 보자.</p>'}</div><div class="decor-confirm"><span id="decor-choice">실제 공간을 보며 골라 줘.</span><button id="decor-cancel-preview">선택 취소</button><button id="decor-remove" disabled>회수</button><button id="decor-place" class="primary" disabled>놓기</button></div></div>`;
  document.querySelector('#game').append(root);
  $('#decor-exit').onclick=api.close;
  $('#decor-area').onclick=()=>{const id=mode.id;const target=area()==='room'?'ancient-yard-'+state().ancient.country:'ancient-home-'+state().ancient.country;api.travel(target);if(state().map===target)open(id);};
  document.querySelectorAll('[data-decor-pick]').forEach(b=>b.onclick=()=>{mode.id=b.dataset.decorPick;mode.slot=null;const used=Object.values(home().placements).filter(v=>v===mode.id).length;mode.from=home().decorations[mode.id]<=used?Object.keys(home().placements).find(k=>home().placements[k]===mode.id):null;update();project(camera(innerWidth,innerHeight,api.map()));});
  document.querySelectorAll('[data-decor-site]').forEach(b=>b.onclick=()=>{mode.slot=b.dataset.decorSite;update();});
  $('#decor-cancel-preview').onclick=()=>{mode.id=null;mode.slot=null;mode.from=null;render();};
  $('#decor-remove').onclick=()=>{const slot=mode.slot;if(slot&&placeDecor(state(),slot,null)){save();hud();toast('살림을 보관했다.');mode.slot=null;render();}};
  $('#decor-place').onclick=()=>{
   if(!mode.slot||!candidate(mode.slot))return;const h=home(),from=mode.from,oldFrom=from&&h.placements[from],oldLit=from&&h.lamps[from];
   if(from){delete h.placements[from];delete h.lamps[from];}
   if(!placeDecor(state(),mode.slot,mode.id)){if(from){h.placements[from]=oldFrom;if(oldLit!==undefined)h.lamps[from]=oldLit;}return;}
   if(oldLit!==undefined)h.lamps[mode.slot]=oldLit;save();hud();toast(DECOR[mode.id].name+'을 놓았다!');mode.from=null;mode.slot=null;mode.id=null;render();
  };update();project(camera(innerWidth,innerHeight,api.map()));
 }
 function update(){if(!mode)return;for(const b of document.querySelectorAll('[data-decor-pick]'))b.setAttribute('aria-pressed',String(b.dataset.decorPick===mode.id));for(const b of document.querySelectorAll('[data-decor-site]')){b.classList.toggle('allowed',Boolean(mode.id&&candidate(b.dataset.decorSite)));b.classList.toggle('chosen',b.dataset.decorSite===mode.slot);b.setAttribute('aria-pressed',String(b.dataset.decorSite===mode.slot));}
  const slot=DECOR_SLOTS.find(v=>v.id===mode.slot),ok=Boolean(slot&&candidate(slot.id));$('#decor-place').disabled=!ok;$('#decor-remove').disabled=!slot||!home().placements[slot.id];
  $('#decor-choice').textContent=slot?(mode.id?DECOR[mode.id].name+' · '+slot.name+(ok?'':' · 이 자리에는 놓을 수 없어'):slot.name):'실제 공간을 보며 골라 줘.';
 }
 function camera(width,height,map){
  if(!mode)return null;const dock=height<600?180:218,top=78;
  const box=area()==='room'?{left:.7,right:map.w-.7,top:.6,bottom:map.h-.7}:{left:1.4,right:22.5,top:2.5,bottom:16.6};
  const zoom=Math.min(1.12,(width-48)/((box.right-box.left)*64),(height-dock-top-20)/((box.bottom-box.top)*64));
  return {zoom,x:(box.left+box.right)*32-width/(2*zoom),y:box.top*64-top/zoom,viewW:width/zoom,viewH:height/zoom};
 }
 function project(cam){if(!mode)return;if(mode.map!==state().map){api.close();return;}for(const b of document.querySelectorAll('[data-decor-site]')){const slot=DECOR_SLOTS.find(v=>v.id===b.dataset.decorSite),[x,y]=decorPosition(slot,home().level,mode.id||home().placements[slot.id]);b.style.left=(x*64-cam.x)*cam.zoom+'px';b.style.top=(y*64-cam.y)*cam.zoom+'px';}}
 function preview(){if(!mode?.id||!mode.slot||!candidate(mode.slot))return null;const slot=DECOR_SLOTS.find(v=>v.id===mode.slot),[x,y]=decorPosition(slot,home().level,mode.id);return {id:'decor-preview',type:'lifeDecor',decorId:mode.id,slot:mode.slot,x,y,name:DECOR[mode.id].name,art:DECOR[mode.id].art,...DECOR_VISUALS[mode.id],preview:true};}
 const valid=e=>atHome(state())&&state().map===(e.slot.startsWith('room-')?'ancient-home-':'ancient-yard-')+state().ancient.country&&home().placements[e.slot]===e.decorId&&Math.hypot(state().x-e.x,state().y-e.y)<1.85;
 function use(e){
  const v=DECOR_VISUALS[e.decorId];if(!v?.use||!valid(e))return false;
  const label=v.use==='lamp'?(home().lamps[e.slot]?'불 끄기':'불 켜기'):v.label;
  panel(e.name,`<div class="decor-use-head">${imageTag(e.art,e.name)}<div><p>${decorDescription(e.decorId)}</p>${v.use==='rest'?'<small>누비 침구의 기존 집 휴식 효과를 적용해.</small>':''}</div></div>${v.use==='harvest'?`<div class="decor-harvest">${Object.entries(CROPS).map(([id,c])=>`<div>${imageTag('life-crop-'+id,c.name)}<b>${c.name}</b><span>${home().harvested[id]}개 수확</span></div>`).join('')}</div>`:`<button id="decor-use" class="primary full">${label}</button>`}`);
  if($('#decor-use'))$('#decor-use').onclick=()=>{if(!valid(e))return;if(v.use==='lamp'){if(toggleDecorLamp(state(),e.slot)){save();hud();toast(home().lamps[e.slot]?'등잔불을 켰다.':'등잔불을 껐다.');api.close();}}else beginPose(e,v.use);};return true;
 }
 function beginPose(e,kind){
  if(!valid(e)||pose)return;api.close();pose={...e,kind,map:state().map};api.pause('decor-pose');
  const box=document.createElement('div');box.id='decor-pose';box.innerHTML=`<span>${kind==='rest'?'잠시 누워 쉬는 중':kind==='shade'?'그늘에서 쉬는 중':'잠시 앉아 쉬는 중'}</span><button id="decor-rise">일어나기</button>`;document.querySelector('#game').append(box);
  const finish=()=>{if(!pose)return;const p=pose;pose=null;clearTimeout(poseTimer);api.close();if(p.map===state().map&&valid(p)){if(p.kind==='rest')api.rest();save();hud();toast(p.kind==='rest'?'편히 쉬었다.':'잠시 쉬었다.');}};
  $('#decor-rise').onclick=finish;poseTimer=setTimeout(finish,5000);
 }
 function adminPanel(){
  if(!api.admin())return;
  legacyTrial??=structuredClone(state());
  panel('집 꾸미기 집중 시험',`<p class="note">관리자 시험 세션에만 적용해. 학생 원본은 관리자 종료 시 복원돼.</p><h3>세 나라 · 집 1~4단계</h3><div class="row">${[['goguryeo','고구려'],['baekje','백제'],['silla','신라']].map(([id,name])=>`<button data-decor-country="${id}">${name}</button>`).join('')}</div><div class="row">${[1,2,3,4].map(n=>`<button data-decor-level="${n}">집 ${n}단계</button>`).join('')}</div><h3>보유 · 배치 준비</h3><div class="row"><button data-decor-preset="owned">18종 전부 보유</button><button data-decor-preset="empty">배치 없음</button><button data-decor-preset="partial">일부 배치 · 3개</button><button data-decor-preset="full">전체 자리 채움 · 최대 12개</button></div><h3>직접 사용 · 4단계 표본</h3><div class="row">${[['fineBedding','누비 침구 휴식'],['diningSet','식사 자리 앉기'],['grainRack','수확 기록'],['yardArbor','마당 그늘막'],['clayLamp','등잔 켜짐'],['doubleLamp','등잔 꺼짐']].map(([id,name])=>`<button data-decor-test="${id}">${name}</button>`).join('')}</div><p class="note">확장 전후는 집 1→2→3→4단계로 바꾼 뒤 확인해. 기존 배치와 등잔 상태는 늘릴 때 유지돼.</p><div class="row"><button id="decor-qa-room">집 안에서 꾸미기</button><button id="decor-qa-yard">마당에서 꾸미기</button><button id="decor-qa-legacy">v51.2 형식 표본 복원</button><button id="decor-qa-life">기존 거처·확장 시험</button><button id="decor-qa-back">관리자 목록</button></div>`,{wide:true});
  const ready=()=>{if(!home().owned||!state().ancient.country)api.prepareAncient('4c');};
  const jump=where=>api.adminJump('ancient-'+where+'-'+state().ancient.country);
  const owned=()=>{for(const id of Object.keys(DECOR))home().decorations[id]=Math.max(1,home().decorations[id]);};
  const preset=kind=>{ready();owned();if(kind==='owned')return;home().placements={};home().lamps={};const list=[['room-1','fineBedding'],['yard-1','yardArbor'],['room-2','woodShelf'],['yard-2','herbPot'],['room-3','diningSet'],['room-4','grainRack'],['yard-3','stripedJar'],['room-5','clayLamp'],['yard-4','woodBox'],['room-6','wovenMat'],['yard-5','darkJar'],['room-7','wovenScreen']];
   for(const [slot,id]of list.slice(0,kind==='partial'?3:kind==='empty'?0:12))placeDecor(state(),slot,id);
  };
  document.querySelectorAll('[data-decor-country]').forEach(b=>b.onclick=()=>{ready();state().ancient.country=b.dataset.decorCountry;jump('home');adminPanel();});
  document.querySelectorAll('[data-decor-level]').forEach(b=>b.onclick=()=>{ready();setLifeLevel(home(),Number(b.dataset.decorLevel));jump('home');adminPanel();});
  document.querySelectorAll('[data-decor-preset]').forEach(b=>b.onclick=()=>{ready();jump('home');preset(b.dataset.decorPreset);save();hud();adminPanel();});
  document.querySelectorAll('[data-decor-test]').forEach(b=>b.onclick=()=>{ready();setLifeLevel(home(),4);jump('home');preset('full');const id=b.dataset.decorTest,slot=id==='doubleLamp'?'room-5':Object.keys(home().placements).find(k=>home().placements[k]===id);if(id==='doubleLamp')placeDecor(state(),slot,id);if(id==='clayLamp')home().lamps[slot]=true;
   jump(slot.startsWith('yard')?'yard':'home');const spot=DECOR_SLOTS.find(v=>v.id===slot),[x,y]=decorPosition(spot,home().level,id);state().x=x+.9;state().y=y+.5;save();hud();api.close();
  });
  $('#decor-qa-room').onclick=()=>{ready();jump('home');open();};$('#decor-qa-yard').onclick=()=>{ready();jump('yard');open();};
  $('#decor-qa-legacy').onclick=()=>{const old=structuredClone(legacyTrial);if(old.ancient?.home)delete old.ancient.home.lamps;api.restoreState(old);save();hud();api.close();toast('등잔 필드가 없는 이전 형식 표본을 복원했다.');};
  $('#decor-qa-life').onclick=api.homeAdmin;$('#decor-qa-back').onclick=api.adminPanel;
 }

 return {open,cancel,camera,project,preview,use,adminPanel,get mode(){return mode;},get pose(){return pose;}};
}
