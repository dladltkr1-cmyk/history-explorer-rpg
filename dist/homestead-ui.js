import {atYard,atWorkbench} from './life-access.js?v=54.2';
import {createLifeShopUI} from './life-shop-ui.js?v=54.2';
import {createLifeCommerceUI} from './life-commerce-ui.js?v=54.2';
import {UPGRADE_GATES,reputationName,canGrow,hasBulkHarvest} from './life-progression.js?v=54.2';
import {CROPS,HOME_LEVELS,DECOR,DECOR_SLOTS,activePlots,plotState,atHome,canPlaceDecor,plantCrop,harvestCrop,buyLife,buyLumber,upgradeHome,openPaddy,placeDecor,craftDecor,setLifeLevel,freshLife,grantLifeStarter} from './homestead.js?v=54.2';
import {ANCIENT_COUNTRIES} from './regions/ancient.js?v=54.2';
export function createHomesteadUI(api){
  const {$,panel,imageTag,toast,save,hud,travel,esc}=api,s=()=>api.state(),home=()=>s().ancient.home;
  const commerce=createLifeCommerceUI({...api,openFarm:()=>farm(),resetLife:()=>Object.assign(home(),freshLife()),grantStarter:()=>grantLifeStarter(s())});
  const shops=createLifeShopUI({...api,toolCards:commerce.toolCards,bindTools:commerce.bindTools,cart:commerce.cart});
  const time=ms=>{const n=Math.ceil(ms/1000);return Math.floor(n/60)+'분 '+String(n%60).padStart(2,'0')+'초';};
  const art=(id,alt,cls='')=>imageTag(id,alt,cls);
  const slots=()=>DECOR_SLOTS.slice(0,HOME_LEVELS[home().level].slots);
  const nav=page=>`<nav class="life-tabs" aria-label="현재 장소">${(atYard(s())?[['farm','농사'],['decor','마당 꾸미기']]:[['decor','집 안 꾸미기']]).map(([id,name])=>`<button data-life-tab="${id}" ${page===id?'aria-current="page" class="selected"':''}>${name}</button>`).join('')}</nav>`;
  function heading(){const h=home(),c=ANCIENT_COUNTRIES[s().ancient.country];return `<div class="life-heading">${art('life-home-'+s().ancient.country+'-'+h.level,c.name+'의 '+h.level+'단계 거처')}<div><small>${c.name} · 나의 생활 공간</small><h3>${esc(s().nickname)}의 거처 <span>${h.level}단계</span></h3><p>${HOME_LEVELS[h.level].name} · ${reputationName(h.reputation)} <b>${h.reputation}/100</b></p><p class="life-wallet">${s().coins.toLocaleString()} 엽전</p></div></div>`;}
  function show(page,body){
    if(!atHome(s())||(page==='farm'&&!atYard(s()))||(page==='market'&&!atWorkbench(s())))return false;
    panel(page==='market'?'마당 작업대':atYard(s())?'내 마당':'집 안 꾸미기',heading()+nav(page)+`<div class="life-content">${body}</div>`,{wide:true,type:'homestead'});
    document.querySelectorAll('[data-life-tab]').forEach(b=>b.onclick=()=>open(b.dataset.lifeTab));return true;
  }
  function commit(message){save();hud();if(message)toast(message);}
  function clock(update){update();const timer=setInterval(update,500);api.setCleanup(()=>clearInterval(timer));}
  function farm(){
    if(!atYard(s())){toast('농사는 내 마당에서 살펴보자.');return;}
    const h=home(),plots=activePlots(h);
    show('farm',`<div class="life-section-line"><div><h3>심고, 다녀와서 수확하자.</h3><p>밭 ${h.fields}칸 · 논 ${h.paddies}칸 · 한 번 수확하면 작물 4개</p></div>${h.commerce.tools.seedBag?'<button id="life-batch">여러 칸 심기</button>':''}<button id="life-harvest-all" ${hasBulkHarvest(s())?'':'disabled'}>${hasBulkHarvest(s())?'모두 수확':'낫을 마련하면 모두 수확'}</button></div><div class="life-plots">${plots.map(p=>`<button class="life-plot" data-life-plot="${p.id}" aria-label="${p.id.startsWith('paddy')?'논':'밭'} ${p.id.split('-')[1]}">${art('life-empty-'+p.id.split('-')[0],'재배칸')}<b>${p.id.startsWith('paddy')?'논':'밭'} ${p.id.split('-')[1]}</b><span class="life-plot-name"></span><small class="life-plot-time"></small><span class="life-progress"><i></i></span></button>`).join('')}</div>${!h.paddies?`<p class="life-tip">${h.level<3?'논은 거처 3단계부터 만들 수 있어.':'상점 거리 목공소에서 논을 열면 벼를 심을 수 있어.'}</p>`:''}<p class="note">자라는 동안 낚시나 탐험을 다녀와도 좋아. 게임을 껐다 켜도 자란 시간은 이어져.</p>`);
    const update=()=>{let ready=0;for(const p of activePlots(home())){
      const b=document.querySelector(`[data-life-plot="${p.id}"]`);if(!b)continue;
      const t=plotState(p),c=CROPS[p.crop],label=p.id.startsWith('paddy')?'논':'밭';
      b.classList.toggle('ready',t.status==='ready');b.querySelector('.life-plot-name').textContent=c?.name||'비어 있음';
      b.querySelector('.life-plot-time').textContent=t.status==='empty'?'씨앗 선택하기':t.status==='ready'?'수확하기 ✓':'자라는 중 · '+time(t.remaining);
      b.querySelector('.life-progress i').style.width=t.progress*100+'%';
      const key=c?'life-'+(t.status==='ready'?'ripe':'growing')+'-'+p.crop:'life-empty-'+p.id.split('-')[0];
      if(b.dataset.art!==key){b.querySelector('img').src=api.asset(key);b.dataset.art=key;}
      b.setAttribute('aria-label',label+' '+p.id.split('-')[1]+' · '+(c?.name||'비어 있음')+' · '+b.querySelector('.life-plot-time').textContent);if(t.status==='ready')ready++;
    }const all=$('#life-harvest-all');if(all)all.disabled=!ready||!hasBulkHarvest(s());};
    document.querySelectorAll('[data-life-plot]').forEach(b=>b.onclick=()=>plot(b.dataset.lifePlot));
    if($('#life-batch'))$('#life-batch').onclick=commerce.batch;
    $('#life-harvest-all').onclick=()=>{if(!hasBulkHarvest(s()))return;let count=0;for(const p of activePlots(home()))count+=harvestCrop(s(),p.id)?.count||0;if(count)commit('작물 '+count+'개를 가방에 담았다.');farm();};clock(update);
  }
  function plot(id){
    if(!atYard(s()))return;
    const p=activePlots(home()).find(p=>p.id===id);if(!p)return;
    if(plotState(p).status==='ready'){const result=harvestCrop(s(),id);if(result){commit(CROPS[result.id].name+' '+result.count+'개 수확!');farm();}else toast('가방에 더 담을 자리가 없다.');return;}
    if(p.crop){const c=CROPS[p.crop];show('farm',`<div class="life-growing-detail">${art('life-growing-'+p.crop,c.name)}<h3 id="life-growing-title">${c.name}가 자라고 있어.</h3><p id="life-remaining"></p><button id="life-pick" class="primary full" disabled>자라는 중</button><button id="life-farm-back" class="full">다른 밭 보기</button></div>`);
      $('#life-farm-back').onclick=farm;$('#life-pick').onclick=()=>plot(id);clock(()=>{const t=plotState(p);$('#life-growing-title').textContent=c.name+(t.status==='ready'?'가 다 자랐다!':'가 자라고 있어.');const picture=$('.life-growing-detail img');if(picture.dataset.status!==t.status){picture.src=api.asset('life-'+(t.status==='ready'?'ripe':'growing')+'-'+p.crop);picture.dataset.status=t.status;}$('#life-remaining').textContent=t.status==='ready'?'다 자랐다. 수확할 수 있어!':time(t.remaining)+' 뒤 수확';$('#life-pick').disabled=t.status!=='ready';$('#life-pick').textContent=t.status==='ready'?'수확하기':'자라는 중';});return;}
    const kind=id.split('-')[0];show('farm',`<h3>${kind==='paddy'?'논':'밭'} ${id.split('-')[1]} · 무엇을 심을까?</h3><div class="life-shop-grid">${Object.entries(CROPS).filter(([,c])=>c.kind===kind).map(([key,c])=>`<article>${art('life-seed-'+key,c.name+' 씨앗')}<div><b>${c.name} 씨앗</b><p>${c.minutes}분 · 수확 ${c.yield}개</p><small>보유 ${home().seeds[key]}개 · 판매 개당 ${c.sale}엽전</small></div><button data-life-plant="${key}" ${home().seeds[key]?'':'disabled'}>심기</button></article>`).join('')}</div><p class="note">씨앗 1개로 한 칸에 심어. 비어 있는 칸에만 심을 수 있어.</p><button id="life-seed-shop" class="full">씨앗 사러 가기</button>`);
    document.querySelectorAll('[data-life-plant]').forEach(b=>b.onclick=()=>{if(!plantCrop(s(),id,b.dataset.lifePlant))return;commit(CROPS[b.dataset.lifePlant].name+'를 심었다.');farm();});$('#life-seed-shop').onclick=()=>shops.guide('seed');
  }
  function market(){if(!atWorkbench(s())){toast('내 마당의 작업대 가까이에서 만들어 보자.');return;}const h=home();
    show('market',`<h3>목재로 만드는 작은 살림</h3><p>남는 목재로 집에 놓을 가구를 만들자.</p><div class="life-shop-grid">${['woodBox','lowTable'].map(id=>`<article>${art(DECOR[id].art,DECOR[id].name)}<div><b>${DECOR[id].name}</b><p>목재 ${DECOR[id].lumber}개 · 보유 ${h.decorations[id]}개</p></div><button data-life-craft="${id}" ${(s().inventory.lumber||0)<DECOR[id].lumber?'disabled':''}>만들기</button></article>`).join('')}</div>`);
    document.querySelectorAll('[data-life-craft]').forEach(b=>b.onclick=()=>{if(craftDecor(s(),b.dataset.lifeCraft))commit(DECOR[b.dataset.lifeCraft].name+'을 만들었다.');market();});
  }
  function decor(){if(!atHome(s()))return;const h=home();show('decor',`<div class="life-decor-entry"><div><h3>내 손으로 꾸미는 거처</h3><p>집 안과 마당을 보며 가구를 고르고, 놓기 전에 미리 확인하자.</p></div><button id="decor-visual-open" class="primary">눈으로 꾸미기</button></div><h3>자리 목록으로 놓기</h3><p>자리를 고르면 놓거나 바꿀 수 있어. 치운 물건은 다시 사용할 수 있어.</p><div class="life-decor-slots">${slots().filter(slot=>slot.area===(atYard(s())?'yard':'room')).map(slot=>`<button data-life-slot="${slot.id}">${h.placements[slot.id]?art(DECOR[h.placements[slot.id]].art,DECOR[h.placements[slot.id]].name):'<span class="life-empty-slot">＋</span>'}<b>${slot.area==='room'?'집 안':'마당'} · ${slot.name}</b><small>${h.placements[slot.id]?DECOR[h.placements[slot.id]].name:'비어 있음'}</small></button>`).join('')}</div><p class="note">새 살림은 마을의 살림 가게에서 살 수 있어. 보유한 물품은 자리마다 놓거나 회수해 보자.</p><button id="life-decor-guide" class="full">살림 가게 위치 안내</button>`);
    $('#decor-visual-open').onclick=api.decorate;
    $('#life-decor-guide').onclick=()=>shops.guide('decor');
    document.querySelectorAll('[data-life-slot]').forEach(b=>b.onclick=()=>decorateSlot(b.dataset.lifeSlot));
  }
  function decorateSlot(id){const slot=slots().find(v=>v.id===id),h=home();if(!slot||slot.area!==(atYard(s())?'yard':'room'))return;const held=Object.entries(DECOR).filter(([key,d])=>(d.area==='both'||d.area===slot.area)&&(!d.wall||slot.wall)&&h.decorations[key]);
    show('decor',`<h3>${slot.name} · 무엇을 놓을까?</h3><div class="life-shop-grid">${held.map(([key,d])=>{const used=Object.values(h.placements).filter(v=>v===key).length;return `<article>${art(d.art,d.name)}<div><b>${d.name}</b><small>보유 ${h.decorations[key]} · 배치 ${used}</small></div><button data-life-place="${key}" ${!canPlaceDecor(s(),id,key)?'disabled':''}>놓기</button></article>`;}).join('')||'<p>이 자리에 놓을 물품이 아직 없다. 마을 살림 가게에서 골라 보자.</p>'}</div><div class="row"><button id="life-decor-back">다른 자리 보기</button><button id="life-remove" ${h.placements[id]?'':'disabled'}>이 자리 비우기</button></div>`);
    document.querySelectorAll('[data-life-place]').forEach(b=>b.onclick=()=>{if(placeDecor(s(),id,b.dataset.lifePlace))commit('살림을 놓았다.');decor();});$('#life-remove').onclick=()=>{if(placeDecor(s(),id,null))commit('살림을 보관했다.');decor();};$('#life-decor-back').onclick=decor;
  }
  function open(page){
    if(!atHome(s())){toast('농사는 내 마당에서, 꾸미기는 집 안이나 마당에서 하자.');return;}
    page??=atYard(s())?'farm':'decor';
    if(page==='orders'){toast('부탁은 생활마을 게시판에서 확인하자.');return;}
    if(page==='growth'){toast('집 확장은 상점 거리 목공소에 의뢰하자.');return;}
    ({farm,market,decor}[page]||decor)();
  }
  function adminPanel(){
    if(!api.admin())return;const h=home();panel('거처·농사 시험',`<p class="note">기존 관리자 시험 세션 · 학생 원본에는 반영되지 않는다.</p><div class="admin-section"><h3>나라 선택 직후</h3><button id="life-qa-choice">나라 선택 직전으로</button>${Object.entries(ANCIENT_COUNTRIES).map(([id,c])=>`<button data-life-qa-country="${id}">${c.name} 정착 직후</button>`).join('')}</div><div class="admin-section"><h3>거처 단계 · 해금</h3>${[1,2,3,4].map(n=>`<button data-life-qa-level="${n}">${n}단계</button>`).join('')}<label>밭 칸 수<select id="life-qa-fields">${[2,3,4,5,6,7,8].map(n=>`<option ${n===h.fields?'selected':''}>${n}</option>`).join('')}</select></label><label>논 칸 수<select id="life-qa-paddies">${[0,1,2].map(n=>`<option ${n===h.paddies?'selected':''}>${n}</option>`).join('')}</select></label><button id="life-qa-unlock">해금 적용</button></div><div class="admin-section"><h3>생산 · 생활 준비</h3><button id="life-qa-supply">씨앗·목재·엽전 지급</button><button id="life-qa-decor">꾸미기 18종 지급</button><button id="life-qa-planted">5작물 성장 중 준비</button><button id="life-qa-grow">심은 작물 즉시 성장</button><label>평판<input id="life-qa-reputation" type="number" min="0" max="100" value="${h.reputation}"></label><button id="life-qa-rep">평판 적용</button></div>${commerce.adminMarkup()}<div class="row"><button id="life-qa-yard">마당으로 이동</button><button id="life-qa-room">집 안으로 이동</button><button id="life-qa-open">생활 관리 열기</button><button id="life-qa-back">기존 관리자 목록</button></div>`,{wide:true});
    commerce.bindAdmin(adminPanel);
    const ready=country=>{api.prepareAncient('4c');if(country)s().ancient.country=country;api.adminJump('ancient-yard-'+s().ancient.country);};
    $('#life-qa-choice').onclick=()=>{api.prepareAncient('choice');Object.assign(home(),freshLife());};
    document.querySelectorAll('[data-life-qa-country]').forEach(b=>b.onclick=()=>{api.prepareAncient('chosen');Object.assign(home(),freshLife());s().ancient.country=b.dataset.lifeQaCountry;commit();api.adminJump(ANCIENT_COUNTRIES[s().ancient.country].village);});
    document.querySelectorAll('[data-life-qa-level]').forEach(b=>b.onclick=()=>{if(!h.owned||!s().ancient.country)ready();setLifeLevel(home(),Number(b.dataset.lifeQaLevel));api.refreshWorld();commit();adminPanel();});
    $('#life-qa-unlock').onclick=()=>{const f=Number($('#life-qa-fields').value),p=Number($('#life-qa-paddies').value),d=HOME_LEVELS[home().level];if(f>d.fields||p>d.paddies){toast('현재 단계의 밭·논 한도를 넘었다.');return;}home().fields=f;home().paddies=p;commit();adminPanel();};
    $('#life-qa-supply').onclick=()=>{if(!h.owned||!s().ancient.country)ready();for(const id of Object.keys(CROPS))home().seeds[id]=Math.min(99999,home().seeds[id]+10);s().inventory.lumber=Math.min(99999,(s().inventory.lumber||0)+12);s().coins=Math.min(1e9,s().coins+1200);commit('시험용 재료를 지급했다.');adminPanel();};
    $('#life-qa-decor').onclick=()=>{for(const id of Object.keys(DECOR))home().decorations[id]=Math.min(99999,home().decorations[id]+1);commit();adminPanel();};
    $('#life-qa-planted').onclick=()=>{ready();setLifeLevel(home(),3);home().paddies=1;let i=0;for(const [id,c]of Object.entries(CROPS)){const plotId=c.kind==='paddy'?'paddy-1':'field-'+(++i),p=home().plots.find(p=>p.id===plotId);p.crop=id;p.plantedAt=Date.now();}commit();adminPanel();};
    $('#life-qa-grow').onclick=()=>{for(const p of home().plots)if(p.crop)p.plantedAt=Date.now()-CROPS[p.crop].minutes*60000;commit();adminPanel();};
    $('#life-qa-rep').onclick=()=>{const n=Number($('#life-qa-reputation').value);if(!Number.isInteger(n)||n<0||n>100)return;home().reputation=n;commit();adminPanel();};
    $('#life-qa-yard').onclick=()=>{if(!h.owned||!s().ancient.country)ready();api.adminJump('ancient-yard-'+s().ancient.country);};$('#life-qa-room').onclick=()=>{if(!h.owned||!s().ancient.country)ready();api.adminJump(ANCIENT_COUNTRIES[s().ancient.country].home);};$('#life-qa-open').onclick=()=>{if(!atHome(s()))ready();open();};$('#life-qa-back').onclick=api.adminPanel;
  }
  function interact(e){if(shops.interact(e))return true;if(commerce.interact(e))return true;if(e.type==='homestead'){open(e.id==='life-workbench'?'market':'farm');return true;}if(e.type==='farmPlot'){plot(e.plotId);return true;}return false;}
  return {open,adminPanel,interact,shops,board:commerce.board,cart:commerce.cart};
}
