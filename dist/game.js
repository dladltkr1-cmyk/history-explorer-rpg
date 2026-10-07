import {createFieldCamera} from './field-camera.js?v=46';
import {parkHorse} from './horse-state.js?v=44.2';
import { REGIONS, MAPS, ARTIFACTS, regionOf } from "./regions/index.js?v=44.2";
import {
  MAX_LEVEL,
  ITEMS,
  FOOD_IDS,
  STACK_IDS,
  KEY,
  xpNeed,
  fresh,
  abilities,
  gain,
  activeQuest,
  advance,
  writeSave,
  writeAppearanceOnly,
  readSave,
  validate,
} from "./state.js?v=44.2";
import { ASSETS } from "./assets.js?v=44.2";
import {FIELD_SPRITES,fieldSpriteSize} from './field-sprites.js?v=44.2';
import {ANCIENT_COUNTRIES,ANCIENT_QUIZZES,ANCIENT_QUESTS,ancientWorld,ancientDestination,ancientCanEnter} from './regions/ancient.js?v=44.2';
import {noteAncientVisit} from './ancient-state.js?v=44.2';
import {createAncientUI} from './ancient-ui.js?v=44.2';
import { hasRod, fishingStarted, rodReady, fishingObjective, ROD_RECIPE, makeThread, pickBranch, makeNeedle, makeRod, fishingBoneDrop, createFishing, fishingPosition, pullFishing, nextFishingRound, fishingCooldown, fishingSiteKey, restFishingSite } from './fishing.js?v=44.2';
import { INTERACTION_QA, prepareContentQA } from './regions/fishing-content.js?v=46';
import {inFishingRiver,drawFishingRiver} from './waterside.js?v=44.2';
import { QUIZZES } from "./regions/expansion.js";
import { NATIONS, NATION_RECORDS, NATION_MARKS, NATION_STORY, NATION_ITEM_NAMES, NATION_FINAL_QUIZZES, crossedDongyeBoundary, dongyeBoundaryX } from './regions/nations.js?v=37.1';
import { music } from "./audio.js";
import { issueCode, loadCode, pushCode, normalizedCode, cloudSaveUrl, verifyAdminCode } from "./cloud-save.js?v=32";
import { avatarSource, mountedSource, prepareMounted, HAIR, EYES, SKIN, HAIR_COLOR, OUTFIT, defaultAppearance } from "./avatar.js?v=35";
import {
  rollDrop,
  rollRoomReward,
  salePrice,
  sellItem,
  gearSalePrice,
  sellGear,
  cookItem,
  COOKING,
  RESPAWN_MS,
  ENCOUNTER_PROTECTION_MS,
} from "./economy.js";
import { resourceReady, harvestResource, refreshResources } from "./resources.js";
import {
  HABITATS,
  ENCOUNTER_MAPS,
  ENCOUNTER_STEP_DISTANCE,
  ENCOUNTER_CHANCE,
  ENCOUNTER_CHANCES,
} from "./regions/encounters.js?v=20";
const $ = (s) => document.querySelector(s),
  canvas = $("#world"),
  ctx = canvas.getContext("2d"),
  mini = $("#mini").getContext("2d"),
  overlay = $("#overlay"),
  intro = $("#intro"),
  basicTutorial = $("#basic-tutorial"),
  defeat = $("#defeat");
const images = {};
for (const [k, v] of Object.entries(ASSETS)) {
  let im = new Image();
  im.src = v;
  images[k] = im;
}
let saved = null,
  saveError = false;
try {
  saved = readSave();
} catch {
  saveError = true;
}
let s = fresh("탐험가", "boy"),
  adminMode = false,
  adminOriginal = null,
  syncTimer = null,
  syncing = false,
  syncAgain = false,
  syncPaused = false,
  cloudRetry = null,
  qaCloudCode = null,
  playing = false,
  screen = "",
  battle = null,
  last = 0,
  clock = 0,
  saveClock = 0,
  cam = { x: 0, y: 0 },
  keys = new Set(),
  moving = false,
  toastTimer,
  saveTimer,
  invuln = 0,
  spawnClock = 0,
  safeArea = null,
  lastQuestId = null,
  questPinned = false,
  questPeekTimer,
  stopFishing = null;
const fieldCamera = createFieldCamera();
let cameraDirection = {x:0,y:0};
s.map = "paleo-camp";
s.x = 11;
s.y = 9;
const esc = (v) =>
  String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const imageTag = (art, alt = "", cls = "") =>
  `<img src="${ASSETS[art] || ASSETS.chest}" alt="${esc(alt)}" class="${cls}">`;
const currentMap=()=>ancientWorld(MAPS[s.map],s);
const canMount=()=>s.map.startsWith('nation-') || (MAPS[s.map]?.ancient && MAPS[s.map].theme!=='room');
const ancientUI=createAncientUI({$,esc,panel,dialogue,imageTag,close,save,hud,toast,finishEvent,travel,adminJump,activeQuest,items:ITEMS,maps:MAPS,prepareContentQA,regions:REGIONS,state:()=>s,admin:()=>adminMode,adminPanel,prepareMounted});
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").style.opacity = 1;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").style.opacity = 0), 3600);
}
function save() {
  if (!playing) return;
  if (adminMode) { $("#saved").textContent = "관리자 시험 중"; return; }
  try {
    writeSave(s);
    saved = structuredClone(s);
    $("#saved").textContent = s.personalCode ? "기기 저장됨 · 코드 저장 중" : "저장됨 ✓";
    if (s.personalCode) scheduleCloudSave();
  } catch {
    $("#saved").textContent =
      "저장 공간이 부족하다. 설정에서 파일로 내보내야 한다.";
  }
  $("#saved").style.opacity = 1;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => ($("#saved").style.opacity = 0), 2000);
}
function scheduleCloudSave(delay = 15000) {
  if (syncTimer || syncPaused) return;
  if (syncing) { syncAgain = true; return; }
  if (!s.personalCode || adminMode) return;
  syncTimer = setTimeout(async () => {
    syncTimer = null;
    syncing = true;
    const snapshot = structuredClone(s);
    try {
      const result = await pushCode(snapshot.personalCode, snapshot);
      if (result.saved && s.updatedAt === snapshot.updatedAt)
        $("#saved").textContent = "코드 저장됨 ✓";
      else if (result.saved) syncAgain = true;
      else if (result.stale) {
        syncPaused = true;
        $("#saved").textContent = "기기 저장됨 · 서버 기록 확인 필요";
        showSaveConflict(snapshot.personalCode);
      }
    }
    catch {
      $("#saved").textContent = "기기에는 저장했어. 인터넷 연결 후 다시 저장할게.";
      clearTimeout(cloudRetry);
      cloudRetry = setTimeout(() => scheduleCloudSave(0), 30000);
    }
    finally { syncing = false; if (syncAgain) { syncAgain = false; scheduleCloudSave(); } }
  }, delay);
}
window.addEventListener("online", () => { clearTimeout(cloudRetry); scheduleCloudSave(0); });
async function showSaveConflict(code) {
  try {
    const remote = validate((await loadCode(code)).state);
    if (!playing || adminMode || s.personalCode !== code) return;
    panel("서버에 더 새로운 기록이 있어", `<p>다른 기기에서 이어한 기록일 수 있어.</p><div class="row"><button id="keep-device">이 기기에서만 계속</button><button id="use-server" class="primary">서버 기록 불러오기</button></div>`);
    $("#keep-device").onclick = () => { close(); toast("기기에는 계속 저장해. 서버에 저장하려면 기록을 다시 불러와 줘."); };
    $("#use-server").onclick = () => { syncPaused = false; start(remote); toast("서버 기록을 불러왔어."); };
  } catch { $("#saved").textContent = "서버 기록 확인이 필요해. 개인 코드로 다시 불러와 줘."; }
}
window.addEventListener("pagehide", () => {
  if (!playing || adminMode || syncPaused || !s.personalCode) return;
  clearTimeout(syncTimer);
  fetch(cloudSaveUrl(s.personalCode), {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ state: s }),
    keepalive: true,
  }).catch(() => {});
});
function setAvatarImage(el, direction = "front", pose = "idle") {
  if (!el) return;
  const img = avatarSource(s.appearance, direction, pose);
  const token=JSON.stringify(s.appearance)+direction+pose;
  if(el.dataset.token===token && el.src) return;
  el.dataset.token=token;
  if(!el.src)el.style.visibility='hidden';
  const show=()=>{ if(el.isConnected && el.dataset.token===token){el.src=img.src;el.style.visibility='visible';} };
  if(img.complete && img.naturalWidth)show();else img.addEventListener('load',show,{once:true});
}
function close() {
  stopFishing?.(); stopFishing=null;
  overlay.hidden = true;
  overlay.innerHTML = "";
  screen = "";
  keys.clear();
  last = performance.now();
}
function panel(
  title,
  body,
  { wide = false, closable = true, type = "panel" } = {},
) {
  stopFishing?.(); stopFishing=null;
  keys.clear();
  screen = type;
  overlay.hidden = false;
  overlay.innerHTML = `<section class="panel ${wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="panel-heading"><h2>${title}</h2>${closable ? '<button class="close" aria-label="닫기">×</button>' : ""}</div>${body}</section>`;
  overlay.querySelector(".close")?.addEventListener("click", close);
  overlay.querySelector("button,input")?.focus();
}
function dialogue(name, lines, art = "elder", done = () => {}) {
  let i = 0;
  keys.clear();
  screen = "dialogue";
  overlay.hidden = false;
  function show() {
    overlay.innerHTML = `<section class="panel dialogue" role="dialog" aria-modal="true" aria-label="대화">${imageTag(art)}<div class="speech"><div class="speaker">${esc(name)}</div><p>${esc(lines[i])}</p><button class="primary" id="next-dialogue">${i < lines.length - 1 ? "다음 →" : "확인"}</button></div></section>`;
    $("#next-dialogue").onclick = () => {
      if (++i < lines.length) show();
      else {
        close();
        done();
      }
    };
    $("#next-dialogue").focus();
  }
  show();
}
function start(state) {
  fieldCamera.reset();
  s = state;
  s.discoveredMaps ??= [];
  s.nationMarks ??= [];
  lastQuestId = null;
  questPinned = false;
  setQuestExpanded(false);
  playing = true;
  music.start(s.audioMuted);
  $("#title").hidden = true;
  $("#hud").hidden = false;
  document.querySelector(".admin-mode-badge")?.remove();
  if (adminMode) $("#game").insertAdjacentHTML("beforeend", '<div class="admin-mode-badge">관리자 시험 기록 · 학생 저장과 분리</div>');
  close();
  if (blocked(s.x, s.y)) {
    s.x = currentMap().start.x;
    s.y = currentMap().start.y;
  }
  refreshResources(s, currentMap());
  placeMonsters();
  save();
  hud();
  if (s.introSeen && !s.basicTutorialDone && !adminMode)
    setTimeout(startBasicTutorial, 0);
  if(!adminMode&&s.map==='ancient-origins'&&(s.progress.ancient||0)===0)ancientUI.entry();
}
const BASIC_TUTORIAL_STEPS = [
  { target: ".health-track", text: "이것은 체력이야.\n전투에서 공격받으면 줄어들어." },
  { target: ".health-track", text: "체력이 0이 되면 전투에서 지게 돼.\n음식을 먹으면 체력을 회복할 수 있어." },
  { target: "#energy", text: "이것은 기력이야.\n강한 공격 같은 행동에 사용해." },
  { target: "#wallet", text: "엽전은 게임에서 물건을 사고팔 때 사용하는 돈이야." },
  { target: "#wallet", text: "실제 선사 시대에는 이런 엽전을 사용하지 않았어.\n엽전은 이 게임에서 사용하는 가상 화폐야." },
  { target: ".story-hud", text: "왼쪽에는 지금 해야 할 메인스토리가 보여." },
  { target: "#quest", text: "무엇을 해야 할지 모르겠다면 여기를 확인해." },
  { target: "#bag-btn", text: "가방에서는 얻은 음식과 물건을 확인할 수 있어." },
  { target: "#menu-btn", text: "탐험수첩에서는 유물, 퀘스트와 게임 정보를 확인할 수 있어." },
  { target: "#menu-btn", text: "탐험수첩의 '탐험 본부로'를 누르면 열린 시대를 확인하고 이동할 수 있어." },
  { target: null, text: "준비 끝!\n이제 주변을 살펴보자.", final: true },
];
let tutorialStep = 0;
function clearTutorialFocus() {
  document.querySelectorAll(".tutorial-focus").forEach((el) => el.classList.remove("tutorial-focus"));
}
function showTutorialStep() {
  clearTutorialFocus();
  const step = BASIC_TUTORIAL_STEPS[tutorialStep];
  basicTutorial.classList.toggle("final-step", Boolean(step.final));
  if (step.target) $(step.target)?.classList.add("tutorial-focus");
  $("#tutorial-text").textContent = step.text;
  $("#tutorial-count").textContent = `${tutorialStep + 1} / ${BASIC_TUTORIAL_STEPS.length}`;
  $("#tutorial-next").textContent = step.final ? "탐험 시작" : "다음";
  $("#tutorial-next").focus();
}
function startBasicTutorial() {
  if (!playing || s.basicTutorialDone || screen === "tutorial") return;
  keys.clear();
  tutorialStep = 0;
  screen = "tutorial";
  basicTutorial.hidden = false;
  showTutorialStep();
}
async function finishBasicTutorial(skipped = false) {
  $("#tutorial-next").disabled = true;
  $("#tutorial-skip").disabled = true;
  s.basicTutorialDone = true;
  save();
  if (s.personalCode && !adminMode) {
    try {
      const result = await pushCode(s.personalCode, structuredClone(s));
      if (result.saved) $("#saved").textContent = "코드 저장됨 ✓";
      if (result.stale) { syncPaused = true; showSaveConflict(s.personalCode); }
    } catch { $("#saved").textContent = "기기 저장됨 · 코드 저장 재시도 중"; }
  }
  clearTutorialFocus();
  basicTutorial.hidden = true;
  basicTutorial.className = "";
  screen = "";
  hud();
  if (skipped) toast("튜토리얼을 건너뛰었습니다.");
  else toast("마을 사람에게 말을 걸어 보자.");
}
$("#tutorial-next").onclick = () => {
  const step = BASIC_TUTORIAL_STEPS[tutorialStep];
  if (step.final) finishBasicTutorial();
  else {
    tutorialStep++;
    showTutorialStep();
  }
};
$("#tutorial-skip").onclick = () => finishBasicTutorial(true);
function playIntro() {
  const scenes = [
    { image: "/assets/intro/scene1.webp", text: "이건 뭐지?", duration: 3400 },
    { image: "/assets/intro/scene2.webp", text: "어...?", duration: 3400 },
    { image: "/assets/intro/scene3.webp", text: "으아아악!", duration: 3400 },
    {
      image: "/assets/intro/scene4.webp",
      text: "여긴 어디지?",
      duration: 5000,
    },
  ];
  let index = 0,
    timers = [];
  keys.clear();
  screen = "intro";
  intro.hidden = false;
  setAvatarImage($("#intro-player"));
  const finish = () => {
    timers.forEach(clearTimeout);
    intro.hidden = true;
    intro.className = "";
    screen = "";
    s.introSeen = true;
    save();
    hud();
    startBasicTutorial();
  };
  const show = () => {
    const scene = scenes[index];
    intro.className = `intro-scene-${index + 1}`;
    $("#intro-bg").style.backgroundImage = `url(${scene.image})`;
    $("#intro-caption").textContent = scene.text;
    if (index === 3)
      timers.push(
        setTimeout(
          () => ($("#intro-caption").textContent = "일단 주변을 살펴보자."),
          2500,
        ),
      );
    timers.push(
      setTimeout(() => {
        index++;
        index < scenes.length ? show() : finish();
      }, scene.duration),
    );
  };
  $("#intro-skip").onclick = finish;
  show();
}
function create() {
  const nameForm = () => {
    panel("나의 이름", `<label for="nickname">이름을 정해 주세요.</label><input type="text" id="nickname" maxlength="12" placeholder="예시: 이삭샘" autocomplete="off"><button class="primary full" id="name-next">다음</button>`);
    $("#name-next").onclick = () => {
      const name = $("#nickname").value.trim();
      if (!name) return $("#nickname").focus();
      customize(name);
    };
    $("#nickname").onkeydown = e => { if (e.key === "Enter") $("#name-next").click(); };
  };
  if (saved || saveError) {
    panel("새로 시작할까?", `<p>이 기기의 이전 기록이 바뀐다.<br>먼저 저장 파일을 내보낼 수 있다.</p><div class="row"><button id="backup-old">이전 기록 내보내기</button><button class="danger" id="reset-confirm">새로 시작</button></div>`);
    $("#backup-old").onclick = () => exportSave(saved);
    $("#reset-confirm").onclick = nameForm;
  } else nameForm();
}
function customize(name) {
  appearanceEditor(defaultAppearance(), async (appearance, button) => {
    button.textContent = "코드 만드는 중...";
    const state = fresh(name, appearance.hair >= 3 ? "girl" : "boy");
    state.appearance = { ...appearance };
    const { code } = await issueCode(state);
    state.personalCode = code;
    panel("개인 코드", `<div class="code-reveal"><p>개인 코드가 만들어졌다.</p><strong>${code}</strong><p>이 코드를 기억해 두면 다른 기기에서도 이어할 수 있다.</p><button id="code-start" class="primary full">게임 시작</button></div>`, {closable:false});
    $("#code-start").onclick = () => { adminMode = false; start(state); playIntro(); };
  });
}
function appearanceEditor(initial, onApply, { admin = false, onSaveCurrent = null } = {}) {
  const appearance = { ...initial };
  const groups = [["hair", "머리", HAIR], ["eyes", "눈", EYES], ["skin", "피부색", SKIN], ["hairColor", "머리색", HAIR_COLOR], ["outfit", "옷", OUTFIT]];
  panel("캐릭터 꾸미기", `<div class="creator-layout"><div class="creator-preview"><div><img id="preview-front" alt="정면" /><small>정면</small></div><div class="creator-directions"><div><img id="preview-side" alt="옆면" /><small>옆면</small></div><div><img id="preview-back" alt="뒷면" /><small>뒷면</small></div></div></div><div class="creator-options">${groups.map(([key,label,values]) => `<section class="creator-group"><strong>${label}</strong><div class="option-row">${values.map((value,i) => `<button type="button" data-option="${key}" data-index="${i}" class="${i === appearance[key] ? "selected" : ""}" aria-pressed="${i === appearance[key]}"><span class="creator-thumb ${key}"><img alt="" data-thumb="${key}-${i}"></span><span>${value}</span></button>`).join("")}</div></section>`).join("")}</div></div><button id="appearance-done" class="primary full creator-start">${admin ? '적용' : '이 모습으로 시작!'}</button>${admin ? `<button id="appearance-save-current" class="full" ${onSaveCurrent ? '' : 'disabled'}>현재 저장에 외형 적용</button><button id="appearance-back" class="full">플레이어 설정</button>` : ''}`, {wide:true});
  const setSprite=(el,a,dir)=>{
    const token=JSON.stringify(a)+dir;
    if(el.dataset.token===token && el.src)return;
    el.dataset.token=token;
    if(!el.src)el.style.visibility='hidden';
    const img=avatarSource(a,dir);
    const show=()=>{if(el.isConnected&&el.dataset.token===token){el.src=img.src;el.style.visibility='visible';}};
    if(img.complete&&img.naturalWidth)show();else img.addEventListener('load',show,{once:true});
  };
  const show = () => {
    for (const [id,dir] of [["preview-front","front"],["preview-side","left"],["preview-back","back"]]) {
      setSprite($("#"+id),appearance,dir);
    }
    for(const [key,,values] of groups)for(let i=0;i<values.length;i++)
      setSprite(document.querySelector(`[data-thumb="${key}-${i}"]`),{...appearance,[key]:i},'front');
  };
  document.querySelectorAll("[data-option]").forEach(button => button.onclick = () => {
    appearance[button.dataset.option] = Number(button.dataset.index);
    document.querySelectorAll(`[data-option="${button.dataset.option}"]`).forEach(b => {
      b.classList.toggle("selected",b === button);
      b.setAttribute('aria-pressed',String(b===button));
    });
    show();
  });
  show();
  $("#appearance-done").onclick = async () => {
    const button = $("#appearance-done");
    button.disabled = true;
    try {
      await onApply({ ...appearance }, button);
    } catch (error) {
      button.disabled = false;
      button.textContent = admin ? "적용" : "이 모습으로 시작!";
      toast(error.message);
    }
  };
  if (admin) {
    $("#appearance-back").onclick = adminPlayer;
    if (onSaveCurrent) $("#appearance-save-current").onclick = async () => {
      const button = $("#appearance-save-current");
      button.disabled = true;
      try { await onSaveCurrent({ ...appearance }); }
      catch (error) { toast(error.message); }
      finally { if (button.isConnected) button.disabled = false; }
    };
  }
}
$("#new").onclick = create;
$("#continue").disabled = !saved;
$("#continue").onclick = async () => {
  if (!saved) return;
  adminMode = false;
  const state = structuredClone(saved);
  if (!state.personalCode) {
    try { const { code } = await issueCode(state); state.personalCode = code; }
    catch { toast("개인 코드를 만들지 못했다. 기기 기록으로 이어한다."); }
  }
  const issued = !saved.personalCode && state.personalCode;
  start(state);
  if (issued) toast("개인 코드 " + state.personalCode + "가 만들어졌다.");
};
async function loadByCode(event) {
  event.preventDefault();
  const code = normalizedCode($("#code-input").value);
  if (!/^HE(?:\d{4}|\d{6})$/.test(code)) return toast("코드 형식이 올바르지 않습니다.");
  const button = $("#code-form button");
  button.disabled = true;
  try {
    const { state } = await loadCode(code);
    let data = validate(state);
    if (data.personalCode !== code) throw Error("저장 기록을 확인할 수 없다.");
    const accept = (chosen = data) => { adminMode = false; syncPaused = false; start(chosen); toast("개인 코드 기록을 불러왔다."); };
    const localNewer = saved?.personalCode === code && saved.updatedAt > data.updatedAt;
    if (saved) {
      panel("기록을 불러올까?", `<p>${esc(data.nickname)} · Lv.${data.level}<br>서버에 저장한 때: ${new Date(data.updatedAt).toLocaleString('ko-KR')}<br>${localNewer?'이 기기의 기록이 더 새로워 보여. 어느 기록을 쓸까?':'이 기기의 기록이 바뀐다.'}</p><div class="row"><button id="cancel-code">취소</button>${localNewer?'<button id="keep-local">기기 기록 유지</button>':''}<button id="confirm-code" class="primary">서버 기록으로 이어하기</button></div>`);
      $("#cancel-code").onclick = close;
      if (localNewer) $("#keep-local").onclick = () => { syncPaused = true; accept(structuredClone(saved)); syncPaused = true; clearTimeout(syncTimer); toast("이 기기에만 저장해. 서버 기록은 그대로야."); };
      $("#confirm-code").onclick = () => accept();
    } else accept();
  } catch (error) { toast(error.message); }
  finally { button.disabled = false; }
}
$("#code-form").onsubmit = loadByCode;
$("#code-load-open").onclick = () => $("#code-input").focus();
if (saved) {
  $("#continue").textContent = "이어하기 · " + saved.nickname;
  if(saved.horseUnlocked)prepareMounted(saved.appearance).catch(()=>{});
}
const titleImage=avatarSource(saved?.appearance || defaultAppearance());
const titleAvatar=$("#title-avatar");
const showTitleAvatar=()=>{titleAvatar.src=titleImage.src;titleAvatar.style.visibility='visible';};
if(titleImage.complete&&titleImage.naturalWidth)showTitleAvatar();
else titleImage.addEventListener('load',showTitleAvatar,{once:true});
if (saveError) toast("저장 기록을 읽지 못했다. 새로 시작하기에서 백업할 수 있다.");
function adminLogin() {
  panel("관리자 모드", `<label for="admin-pass">관리자 코드</label><input id="admin-pass" type="password" inputmode="numeric" maxlength="8" autocomplete="off"><button class="primary full" id="admin-enter">확인</button>`);
  $("#admin-enter").onclick = async () => {
    const button=$("#admin-enter");button.disabled=true;
    try {if(!await verifyAdminCode($("#admin-pass").value)){toast("코드가 다르다.");return;}}
    catch {toast("관리자 코드를 확인할 수 없다. 인터넷 연결을 확인해 줘.");return;}
    finally {button.disabled=false;}
    clearTimeout(syncTimer);
    adminOriginal = saved ? structuredClone(saved) : null;
    qaCloudCode = null;
    adminMode = true;
    const test = saved ? structuredClone(saved) : fresh("관리자", "boy");
    test.introSeen = true; test.basicTutorialDone = true;
    start(test);
    adminPanel();
  };
  $("#admin-pass").onkeydown = e => { if (e.key === "Enter") $("#admin-enter").click(); };
}
$("#admin-open").onclick = adminLogin;
function adminPanel() {
  panel('관리자 테스트',`<p class="note">별도 시험 세션 · 학생 기록에는 저장되지 않는다.</p><div class="admin-grid">${[['quest','퀘스트 테스트'],['travel','지역 이동'],['player','플레이어 설정'],['item','아이템 지급'],['interaction','상호작용 테스트'],['data','저장/데이터']].map(([id,label])=>`<button data-admin-menu="${id}">${label}</button>`).join('')}</div><button class="full" id="admin-exit">관리자 모드 종료</button>`,{wide:true});
  document.querySelectorAll('[data-admin-menu]').forEach(b=>b.onclick=()=>({quest:adminQuests,travel:adminTravel,player:adminPlayer,item:adminItems,interaction:adminInteractions,data:adminData})[b.dataset.adminMenu]());
  $('#admin-exit').onclick=adminExit;
}
function adminExit() {
  clearTimeout(syncTimer);
  close(); adminMode=false;
  delete s.adminInvulnerable; delete s.adminSpeed;
  if (adminOriginal) {
    const original=adminOriginal; adminOriginal=null;
    start(original);
    toast('원래 플레이 기록으로 돌아왔다.');
  } else {
    adminOriginal=null; playing=false; music.stop(); $('#hud').hidden=true; $('#title').hidden=false;
    document.querySelector('.admin-mode-badge')?.remove();
  }
}
function adminBack() { $('#admin-back').onclick=adminPanel; }
function adminJump(id,target=null) {
  if (!MAPS[id]) return;
  fieldCamera.reset();
  s.unlockedRegions=REGIONS.map(r=>r.id);
  s.map=id;
  if (!s.discoveredMaps.includes(id)) s.discoveredMaps.push(id);
  const m=MAPS[id];
  s.x=m.start.x; s.y=m.start.y;
  refreshResources(s,m); placeMonsters(true);
  if (target) {
    const candidates=[[target.x-1.2,target.y],[target.x+1.2,target.y],[target.x,target.y+1.2],[target.x,target.y-1.2]];
    for(const [x,y] of candidates) if(!blocked(x,y)){s.x=x;s.y=y;break;}
  }
  close(); hud(); save();
  toast(m.name+' 시험 위치로 이동했다.');
}
function adminGive(id,count=1) {
  if (!ITEMS[id]) return;
  if (['weapon','clothes','accessory'].includes(ITEMS[id].kind)) {
    if(!s.inventory.gear.includes(id)) s.inventory.gear.push(id);
  } else s.inventory[id]=(s.inventory[id]||0)+count;
}
function adminRequirements(q) {
  for(const [id,amount] of Object.entries(q.items||{})) if(ITEMS[id]) s.inventory[id]=Math.max(s.inventory[id]||0,amount);
  if(q.anyFood && (s.inventory.berries||0)<2 && !(s.inventory.food||s.inventory.rawmeat)) s.inventory.berries=2;
  if(q.marks) s.nationMarks=Object.keys(NATION_MARKS).slice(0,q.marks);
  if(q.event?.startsWith('quiz:')) {
    s.completedQuests=s.completedQuests.filter(id=>id!==q.event);
    delete s.cooldowns[q.event];
  }
  if(q.target) s.opened=s.opened.filter(id=>id!==q.target);
  if(q.event?.startsWith('win:')) delete s.cooldowns[q.target];
}
function adminPrepareQuest(regionId,index,stage) {
  const r=REGIONS.find(v=>v.id===regionId), q=r?.quests[index];
  if(!q) return;
  if(r.id==='ancient') {
    const fixture=q.qa.stages.find(v=>v.id===stage)||{id:q.id,name:q.title,index,quest:q.id,map:q.map,target:q.target};
    ancientUI.prepare(fixture);return;
  }
  if(q.qa) {
    const id=stage==='current'?q.id==='pre-fishing-start'?'start':q.id==='pre-fishing-rod'?'spindle':'first':stage==='next'?q.id==='pre-fishing-start'?'spindle':'first':stage;
    const fixture=q.qa.stages.find(v=>v.id===id)||q.qa.stages[0];
    prepareContentQA(s,r,fixture);
    s.unlockedRegions=REGIONS.map(v=>v.id);
    adminJump(fixture.map,MAPS[fixture.map].entities.find(e=>e.id===fixture.target));return;
  }
  s.unlockedRegions=REGIONS.map(v=>v.id);
  s.progress[r.id]=index;
  s.completedRegions=s.completedRegions.filter(id=>id!==r.id);
  if(r.id==='nations') s.nationMarks=[...new Set(r.quests.slice(0,index).map(v=>v.mark).filter(Boolean))];
  const ids=new Set(r.quests.map(v=>v.id));
  s.completedQuests=s.completedQuests.filter(id=>!ids.has(id) && !r.quests.some(v=>v.event===id));
  for(const previous of r.quests.slice(0,index)) {
    s.completedQuests.push(previous.id);
    if(previous.event?.startsWith('artifact:') && !s.artifacts.includes(previous.event.slice(9))) s.artifacts.push(previous.event.slice(9));
    if(previous.mark && !s.nationMarks.includes(previous.mark)) s.nationMarks.push(previous.mark);
  }
  if(r.id==='paleolithic' && index>=r.quests.length-1) {
    for(const id of ['handaxe','flint','fire']) if(!s.artifacts.includes(id))s.artifacts.push(id);
    if(!s.completedQuests.includes('paleo-cook'))s.completedQuests.push('paleo-cook');
  }
  adminRequirements(q);
  if(stage==='complete') {
    if(q.mark && !s.nationMarks.includes(q.mark)) s.nationMarks.push(q.mark);
    s.completedQuests.push(q.id);
    s.progress[r.id]=index+1;
    if(index+1===r.quests.length && !s.completedRegions.includes(r.id)) s.completedRegions.push(r.id);
  }
  const next=r.quests[s.progress[r.id]]||q;
  if(stage==='next' && index+1<r.quests.length) {
    s.completedQuests.push(q.id);
    if(q.mark && !s.nationMarks.includes(q.mark))s.nationMarks.push(q.mark);
    s.progress[r.id]=index+1;adminRequirements(next);
  }
  const destination=r.quests[s.progress[r.id]]||q;
  const target=MAPS[destination.map]?.entities.find(e=>e.id===destination.target);
  adminJump(destination.map,stage==='start'?null:target);
}
function adminQuests(regionId=REGIONS[0].id,index=0) {
  const r=REGIONS.find(v=>v.id===regionId)||REGIONS[0];
  index=Math.min(index,r.quests.length-1);
  panel('퀘스트 테스트',`<p>시대와 퀘스트를 고르면 해당 장소와 필요한 물건을 준비한다.</p><label>시대<select id="qa-era">${REGIONS.map(v=>`<option value="${v.id}" ${v.id===r.id?'selected':''}>${v.name}</option>`).join('')}</select></label><label>퀘스트<select id="qa-quest">${r.quests.map((q,i)=>`<option value="${i}" ${i===index?'selected':''}>${i+1}. ${esc(q.title)}</option>`).join('')}</select></label><div class="admin-grid">${[['start','처음부터 테스트'],['current','현재 단계로 이동'],['next','다음 단계'],['near','완료 직전'],['complete','완료 처리']].map(([a,label])=>`<button data-qa-stage="${a}">${label}</button>`).join('')}</div><button id="admin-back">관리자 메뉴</button>`,{wide:true});
  $('#qa-era').onchange=e=>adminQuests(e.target.value,0);
  $('#qa-quest').onchange=e=>adminQuests(r.id,Number(e.target.value));
  if(r.quests[index].qa) {
    const grid=$('#qa-quest').closest('section').querySelector('.admin-grid');
    grid.innerHTML=r.quests[index].qa.stages.map(stage=>`<button data-qa-stage="${stage.id}">${stage.name}</button>`).join('');
  }
  document.querySelectorAll('[data-qa-stage]').forEach(b=>b.onclick=()=>adminPrepareQuest(r.id,index,b.dataset.qaStage));
  adminBack();
}
function adminTravel(era='all') {
  const groups=[['all','모든 시대'],...REGIONS.map(r=>[r.id,r.name])];
  const list=Object.entries(MAPS).filter(([id])=>era==='all'||regionOf(id)?.id===era);
  panel('지역 이동',`<label>시대<select id="qa-map-era">${groups.map(([id,name])=>`<option value="${id}" ${id===era?'selected':''}>${name}</option>`).join('')}</select></label><label>지역<select id="qa-map">${list.map(([id,m])=>`<option value="${id}">${esc(m.name)}</option>`).join('')}</select></label><button id="qa-go" class="primary full">즉시 이동</button><button id="admin-back">관리자 메뉴</button>`);
  $('#qa-map-era').onchange=e=>adminTravel(e.target.value);
  $('#qa-go').onclick=()=>adminJump($('#qa-map').value);
  adminBack();
}
function adminPlayer() {
  panel('플레이어 설정',`<p>레벨 ${s.level} · 엽전 ${s.coins} · HP ${s.hp} · 기력 ${s.energy}</p><div class="admin-grid">${[['heal','HP 완전 회복'],['energy','기력 완전 회복'],['invulnerable',`무적 ${s.adminInvulnerable?'끄기':'켜기'}`],['xp','경험치 +50'],['coin','엽전 +100'],['speed',`이동속도 ${s.adminSpeed?'원래대로':'빠르게'}`]].map(([id,label])=>`<button data-qa-player="${id}">${label}</button>`).join('')}</div><label>레벨<select id="qa-level">${Array.from({length:MAX_LEVEL},(_,i)=>`<option value="${i+1}" ${s.level===i+1?'selected':''}>${i+1}</option>`).join('')}</select></label><button id="qa-level-set">레벨 적용</button><button id="qa-appearance" class="full">캐릭터 외형 변경</button><button id="admin-back">관리자 메뉴</button>`);
  document.querySelectorAll('[data-qa-player]').forEach(b=>b.onclick=()=>{const a=b.dataset.qaPlayer;if(a==='heal')s.hp=abilities(s).hp;if(a==='energy')s.energy=20;if(a==='invulnerable')s.adminInvulnerable=!s.adminInvulnerable;if(a==='xp')gain(s,50,0);if(a==='coin')s.coins+=100;if(a==='speed')s.adminSpeed=!s.adminSpeed;hud();adminPlayer();});
  $('#qa-level-set').onclick=()=>{s.level=Number($('#qa-level').value);s.hp=Math.min(s.hp,abilities(s).hp);hud();adminPlayer();};
  $('#qa-appearance').onclick=adminAppearance;
  adminBack();
}
function adminAppearance() {
  const apply = async appearance => {
    if (s.horseUnlocked) await prepareMounted(appearance);
    s.appearance = { ...appearance };
    hud();
    close();
    toast('시험 세션에 외형을 적용했다.');
  };
  const saveCurrent = saved ? async appearance => {
    if (s.horseUnlocked) await prepareMounted(appearance);
    const record = writeAppearanceOnly(appearance);
    if (!record) throw Error('현재 저장 기록이 없다.');
    saved = validate(record);
    adminOriginal = structuredClone(saved);
    s.appearance = { ...appearance };
    hud();
    close();
    toast('현재 저장에 외형만 적용했다.');
    if (record.personalCode) {
      try {
        const result = await pushCode(record.personalCode, record);
        if (result.stale) toast('기기 외형은 저장했다. 서버 기록은 더 새로워서 바꾸지 않았다.');
      } catch { toast('기기 외형은 저장했다. 서버 연결 후 기록을 확인해 줘.'); }
    }
  } : null;
  appearanceEditor(s.appearance, apply, { admin: true, onSaveCurrent: saveCurrent });
}
function adminItems(category='food') {
  const categories=[['food','음식'],['material','재료'],['weapon','무기'],['clothes','방어구'],['quest','퀘스트 아이템']];
  const questIds=new Set(REGIONS.flatMap(r=>r.quests.flatMap(q=>[...Object.keys(q.items||{}),...(q.qa?.items||[])])));
  const list=Object.entries(ITEMS).filter(([id,v])=>category==='quest'?questIds.has(id):category==='material'?v.kind==='material'&&!questIds.has(id):category==='clothes'?['clothes','accessory'].includes(v.kind):v.kind===category&&!questIds.has(id));
  panel('아이템 지급',`<label>종류<select id="qa-item-category">${categories.map(([id,name])=>`<option value="${id}" ${id===category?'selected':''}>${name}</option>`).join('')}</select></label><label>물건<select id="qa-item">${list.map(([id,v])=>`<option value="${id}">${esc(v.name)}</option>`).join('')}</select></label><button id="qa-give" class="primary full">지급</button><button id="admin-back">관리자 메뉴</button>`);
  $('#qa-item-category').onchange=e=>adminItems(e.target.value);
  $('#qa-give').onclick=()=>{const id=$('#qa-item').value;adminGive(id);hud();toast(ITEMS[id]?.name+' 지급');};adminBack();
}
function adminInteractions() {
  const shortcuts=[['npc','NPC 대화 · 퀘스트'],['artifact','유물 조사'],['resource','열매 · 자원'],['fire','모닥불 조리'],['shop','상점 · 구매 · 판매'],['combat','전투 · 패배'],['map','지도 · 빠른 이동'],['quiz','나라 마무리 퀴즈'],['border','동예 경계 미션'],['horse','말 출현 · 길들이기 · 탑승']];
  shortcuts.push(...INTERACTION_QA.map(v=>[v.id,v.name]));
  panel('상호작용 테스트',`<p>선택한 대상 가까이로 이동한다. 상호작용 버튼으로 실제 기능을 시험하자.</p><div class="admin-grid">${shortcuts.map(([id,name])=>`<button data-qa-interact="${id}">${name}</button>`).join('')}</div><button id="admin-back">관리자 메뉴</button>`,{wide:true});
  document.querySelectorAll('[data-qa-interact]').forEach(b=>b.onclick=()=>{
    const a=b.dataset.qaInteract;
    const registered=INTERACTION_QA.find(v=>v.id===a);
    if(registered) {
      if(registered.action==='ancient-horse'){ancientUI.adminPanel();return;}
      if(registered.action==='ancient'){ancientUI.adminPanel();return;}
      if(registered.action==='ancient-fishing'){ancientUI.prepare('4c');s.progress.ancient=21;s.ancient.century=4;s.ancient.chapter='4c';}
      for(const [id,n] of Object.entries(registered.items||{}))adminGive(id,n);
      const target=MAPS[registered.map].entities.find(e=>e.id===registered.target);
      adminJump(registered.map,target);
      if(['fishing','ancient-fishing'].includes(registered.action))adminFishingQA(target,registered.modes);
      return;
    }
    if(a==='map'){nationMap();return;}
    if(a==='quiz'){const r=REGIONS.find(v=>v.id==='nations');adminPrepareQuest(r.id,r.quests.findIndex(q=>q.id==='buyeo-festival'),'near');return;}
    if(a==='border'){const r=REGIONS.find(v=>v.id==='nations');adminPrepareQuest(r.id,r.quests.findIndex(q=>q.id==='dongye-deliver'),'near');adminJump('nation-dongye-border');return;}
    if(a==='horse'){s.horseUnlocked=false;s.horseParked=false;s.mounted=false;s.horseField={map:'nation-buyeo-road',id:'horse-buyeo',until:Date.now()+600000};adminJump('nation-buyeo-road',MAPS['nation-buyeo-road'].entities.find(e=>e.id==='horse-buyeo'));return;}
    const artifact=Object.values(MAPS).flatMap(m=>m.entities.filter(e=>e.type==='artifact').map(e=>[m.id,e.id]))[0];
    if(a==='fire')s.artifacts=[...new Set([...s.artifacts,'fire'])];
    const lookup={npc:['nation-buyeo-village','buyeo-leader'],artifact,resource:['nation-buyeo-forest','buyeo-berries'],fire:['nation-iron-village','iron-fire'],shop:['nation-iron-village','iron-trader'],combat:['nation-buyeo-forest','buyeo-wolf']};
    const [map,id]=lookup[a]||[]; const target=MAPS[map]?.entities.find(e=>e.id===id);
    if(target)adminJump(map,target);else toast('대상을 찾지 못했다. 지역 이동에서 선택해 보자.');
  });adminBack();
}
function adminData() {
  const r=regionOf(s.map),q=r&&activeQuest(s);
  panel('저장/데이터',`<p>개인 코드: ${esc(adminOriginal?.personalCode||'없음')}<br>원래 저장: ${adminOriginal?'있음':'없음'}<br>시험 시대: ${esc(r?.name||'탐험 본부')}<br>시험 지역: ${esc(currentMap().name)}<br>시험 퀘스트: ${esc(q?.title||'완료 또는 대기')}</p><p id="qa-cloud-status">서버 시험 코드: ${esc(qaCloudCode||'없음')}</p><button id="qa-local" class="full">현재 로컬 저장 확인</button><button id="qa-server" class="full">원래 서버 저장 확인</button><button id="qa-cloud-push" class="full">시험 기록 서버에 저장</button><button id="qa-cloud-load" class="full">시험 기록 서버에서 불러오기</button><button id="qa-reset" class="full">시험 세션 초기화</button><button id="qa-restore" class="primary full">원래 저장으로 돌아가기</button><button id="admin-back">관리자 메뉴</button>`);
  const status = message => { const el=$('#qa-cloud-status'); if(el) el.textContent=message; };
  $('#qa-local').onclick=()=>status(saved?`기기 저장: ${saved.nickname} · ${new Date(saved.updatedAt).toLocaleString('ko-KR')}`:'기기 저장 없음');
  $('#qa-server').onclick=async()=>{try { if(!adminOriginal?.personalCode) return status('원래 개인 코드 없음'); const {state}=await loadCode(adminOriginal.personalCode);status(`서버 저장: ${state.nickname} · ${new Date(state.updatedAt).toLocaleString('ko-KR')}`); } catch(e){status(e.message);} };
  $('#qa-cloud-push').onclick=async()=>{try {const test=structuredClone(s);test.updatedAt=Date.now();if(!qaCloudCode) qaCloudCode=(await issueCode(test)).code;test.personalCode=qaCloudCode;const result=await pushCode(qaCloudCode,test);status(result.saved?`시험 코드 ${qaCloudCode} · 서버 저장 성공`:'시험 코드의 서버 기록이 더 새로워. 다시 불러와 줘.');}catch(e){status(e.message);} };
  $('#qa-cloud-load').onclick=async()=>{try {if(!qaCloudCode)return status('먼저 시험 기록을 서버에 저장해 줘.');const {state}=await loadCode(qaCloudCode);const test=validate(state);s=structuredClone(test);hud();status(`시험 코드 ${qaCloudCode} · 서버 기록 불러옴 (학생 기록과 분리)`);}catch(e){status(e.message);} };
  $('#qa-reset').onclick=()=>{const test=adminOriginal?structuredClone(adminOriginal):fresh('관리자','boy');test.introSeen=true;test.basicTutorialDone=true;start(test);adminPanel();};
  $('#qa-restore').onclick=adminExit;adminBack();
}
function setQuestExpanded(open) {
  const quest = $("#quest");
  quest.classList.toggle("expanded", open);
  $("#quest-extra").hidden = !open;
  $("#quest-toggle").setAttribute("aria-expanded", String(open));
  $("#quest-arrow").textContent = open ? "▴" : "▾";
  safeArea = null;
}
$("#quest-toggle").onclick = () => {
  const open = !$("#quest").classList.contains("expanded");
  clearTimeout(questPeekTimer);
  questPinned = open;
  setQuestExpanded(open);
};
function hud() {
  if (!playing) return;
  $("#energy").textContent = "기력 " + s.energy + " / 20";
  $("#energy-fill").style.width = (s.energy / 20) * 100 + "%";
  $("#sound-btn").textContent = s.audioMuted ? "🔇" : "🔊";
  $("#sound-btn").setAttribute(
    "aria-label",
    s.audioMuted ? "음악 켜기" : "음악 끄기",
  );
  const done = REGIONS.reduce(
      (n, r) => n + Math.min(s.progress[r.id] || 0, r.quests.length),
      0,
    ),
    total = REGIONS.reduce((n, r) => n + r.quests.length, 0);
  $("#story-progress").style.width = (done / total) * 100 + "%";
  $("#story-count").textContent = done + " / " + total;
  const a = abilities(s),
    r = regionOf(s.map),
    q = activeQuest(s);
  if (lastQuestId !== null && q?.id !== lastQuestId && !questPinned) {
    setQuestExpanded(true);
    clearTimeout(questPeekTimer);
    questPeekTimer = setTimeout(() => { if (!questPinned) setQuestExpanded(false); }, 4200);
  }
  lastQuestId = q?.id || null;
  $("#name").textContent = s.nickname;
  $("#level").textContent = `Lv. ${s.level}`;
  $("#hp").textContent = `체력 ${s.hp} / ${a.hp}`;
  $("#health").classList.toggle("critical", s.hp / a.hp <= 0.25);
  $("#health").style.width = `${(s.hp / a.hp) * 100}%`;
  setAvatarImage($("#portrait"));
  $("#place").textContent = currentMap().name;
  $('#mount-btn').hidden=!(s.horseUnlocked && !s.horseParked && canMount());
  $('#mount-btn').textContent=s.mounted?'내리기':'말 타기';
  $("#era").textContent = r?.name || "시간탐험대";
  $("#coins").textContent = s.coins.toLocaleString();
  $("#quest-count").textContent = q
    ? `${(s.progress[r.id] || 0) + 1} / ${r.quests.length}`
    : "";
  $("#quest-title").textContent =
    (r?.id==='ancient'&&!q?`${s.ancient.century}세기 · 다음 이야기 준비 중`:q?.title) || (s.map === "hq" ? "시대의 문으로 가 보자." : "자유 탐험");
  const paleoStatus = r?.id === "paleolithic" && q
    ? `\n주먹도끼 ${s.artifacts.includes("handaxe") ? "✓" : "·"}  뗀석기 ${s.artifacts.includes("flint") ? "✓" : "·"}\n불의 사용 ${s.artifacts.includes("fire") ? "✓" : "·"}  음식 조리 ${s.completedQuests.includes("paleo-cook") ? "✓" : "·"}`
    : "";
  const nationItems = r?.id==='nations' && q?.items
    ? '\n'+Object.entries(q.items).map(([id,n])=>`${NATION_ITEM_NAMES[id]||ITEMS[id]?.name||id} ${Math.min(s.inventory[id]||0,n)} / ${n}`).join(' · ')
    : '';
  $("#quest-detail").textContent =
    (q?.detail ? q.detail + paleoStatus + nationItems + (q.id==='pre-fishing-rod'?'\n'+fishingMaterialsText(): '') + (r?.id === 'nations' ? `\n탐험 표식 ${s.nationMarks.length} / 5` : '') : "") ||
    (s.map === "hq"
      ? "가까이 가서 조사 / 말하기를 눌러."
      : "놓친 유물과 부탁을 찾아보자.");
  $("#quest-place").textContent = q
    ? `⌖ ${MAPS[q.map].name}`
    : s.map === "hq"
      ? "⌖ 본부 위쪽의 시대의 문"
      : "자유 탐험";
  safeArea = null;
}
function finishEvent(event) {
  const r = regionOf(s.map),
    before = s.completedRegions.length,
    rewards = advance(s, event);
  save();
  hud();
  if (rewards.length) {
    rewardFeedback(
      rewards.reduce((n, q) => n + q.xp, 0),
      rewards.reduce((n, q) => n + q.coins, 0),
    );
    if (rewards.some((q) => q.levels)) toast("레벨 " + s.level + "이 되었다.");
    if (rewards.some((q) => q.id === 'bronze-grain')) feedback('청동 장신구 +1', 'item');
  }
  if (r?.id==='nations' && (s.progress.nations||0)===8 && !s.tutorials.nationMap) {
    s.tutorials.nationMap=true;save();toast('지도에서 발견한 지역을 확인할 수 있다.');
  }
  if (s.completedRegions.length > before) {
    const nextEra = REGIONS.find((x) => x.id === r.unlock);
    dialogue(
      "탐험 완료",
      [
        r.id === "prehistoric"
          ? "강과 바다에서도 먹을거리를 얻을 수 있었어.\n청동기 시대가 열렸다."
          : r.id === "bronze"
            ? "고조선 시대가 열렸다."
            : nextEra
              ? r.name + " 탐험을 마쳤다.\n" + nextEra.name + "가 열렸다."
              : r.id === 'nations' ? "여러 나라의 기록을 완성했다.\n다음 시대는 준비 중이다." : "탐험을 마쳤다.\n다음 시대는 준비 중이다.",
      ],
      s.avatar,
      eraMenu,
    );
  }
}
function eraMenu() {
  panel(
    "어느 시대로 갈까?",
    `<div class="era-list">${REGIONS.map((r, i) => `<button class="era-button" data-era="${r.id}" ${!adminMode && !s.unlockedRegions.includes(r.id) ? "disabled" : ""}><span class="era-number">0${i + 1}</span><div><strong>${r.name}</strong><small>${r.subtitle}</small></div><span class="status">${s.completedRegions.includes(r.id) ? "완료 ✓" : s.unlockedRegions.includes(r.id) ? "열림" : "잠김"}</span></button>`).join("")}</div><p class="note">이야기 임무를 마치면 다음 시대가 열린다.</p>`,
  );
  document
    .querySelectorAll("[data-era]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          travel(b.dataset.era==='ancient'?ancientDestination(s):REGIONS.find((r) => r.id === b.dataset.era).start)),
    );
}
function rollHorse(id) {
  const sites = ['nation-buyeo-road','nation-goguryeo-road','nation-samhan-mahan'];
  s.horseField = null;
  if (!s.horseUnlocked && sites.includes(id) && Math.random() < .19) {
    const horseId = MAPS[id].entities.find(e=>e.type==='horse')?.id;
    if (horseId) s.horseField = {map:id,id:horseId,until:Date.now()+5*60*1000};
  }
}
function travel(id, from = s.map, {fast=false} = {}) {
  if (!MAPS[id]) return;
  const sourceExit = MAPS[from]?.entities.find(e=>e.to===id);
  if (!fast && !adminMode && sourceExit?.unlockAt && (s.progress.nations||0) < sourceExit.unlockAt) {
    toast('지금 해야 할 일을 먼저 마치자.'); return;
  }
  const r = regionOf(id);
  if(!adminMode && !ancientCanEnter(s,MAPS[id])) {toast('지금의 이야기 임무를 먼저 마치자.');return;}
  if (!adminMode && r && !s.unlockedRegions.includes(r.id)) {
    toast("아직 잠긴 시대다.");
    return;
  }
  if (s.mounted && id === 'ancient-home-' + s.ancient?.country) parkHorse(s,{enteringHome:true});
  s.map = id;
  fieldCamera.reset();
  if (!id.startsWith('nation-') && !(MAPS[id]?.ancient && MAPS[id].theme!=='room')) s.mounted = false;
  rollHorse(id);
  let discovery='';
  if (id.startsWith('nation-') && !s.discoveredMaps.includes(id)) {
    s.discoveredMaps.push(id);
    const nation = NATIONS.find(n=>n.map===id);
    if (nation) discovery='새로운 지역을 발견했다. ' + nation.name;
  }
  const roomReturn = MAPS[from]?.returnTo?.map === id ? MAPS[from].returnTo : null;
  const back = ancientWorld(MAPS[id],s).entities.find(
    (e) => e.type === "exit" && e.to === from,
  );
  s.x = roomReturn ? roomReturn.x : !fast && back
    ? back.x + (back.x < 5 ? 1 : back.x > 19 ? -1 : 0)
    : MAPS[id].start.x;
  s.y = roomReturn ? roomReturn.y : !fast && back
    ? back.y + (back.y < 4 ? 1 : back.y > 13 ? -1 : 0)
    : MAPS[id].start.y;
  if (blocked(s.x, s.y)) {
    s.x = MAPS[id].start.x;
    s.y = MAPS[id].start.y;
  }
  if (fast) {
    const m=MAPS[id], sx=s.x, sy=s.y;
    const safe=(x,y)=>!blocked(x,y) && !m.entities.some(e=>e.type==='enemy' && Math.hypot(e.x-x,e.y-y)<2);
    if (!safe(s.x,s.y)) {
      const candidate=[];
      for(let y=2;y<=15;y++)for(let x=2;x<=21;x++)if(safe(x,y))candidate.push({x,y,d:Math.hypot(x-sx,y-sy)});
      candidate.sort((a,b)=>a.d-b.d);
      if(candidate.length){s.x=candidate[0].x;s.y=candidate[0].y;}
    }
  }
  invuln = 3;
  s.encounter.distance = 0;
  refreshResources(s, MAPS[id]);
  placeMonsters(true);
  close();
  save();
  hud();
  noteAncientVisit(s,id);save();
  toast(discovery || currentMap().name);
  if(!adminMode&&id==='ancient-origins'&&(s.progress.ancient||0)===0)ancientUI.entry();
}
function menu() {
  panel(
    "탐험수첩",
    `<div class="menu-grid"><button id="codex">역사 도감<small>${s.artifacts.length} / ${ARTIFACTS.length} 기록</small></button><button id="nation-records">여러 나라 기록<small>탐험 표식 ${s.nationMarks.length} / 5</small></button><button id="requests">퀘스트<small>스토리 퀘스트 · 서브 퀘스트</small></button>${currentMap().ancient?'<button id="ancient-records-menu">고대 국가 기록</button><button id="ancient-chapters-menu">고대 국가 이야기</button>':''}<button id="settings">환경설정<small>음악 · 저장 파일</small></button><button id="home">탐험 본부로</button>${adminMode ? '<button id="admin-menu">관리자 시험 도구</button>' : ""}<button id="to-title">시작화면으로</button></div>`,
  );
  $("#codex").onclick = codex;
  $("#nation-records").onclick = nationRecords;
  $("#requests").onclick = requestsMenu;
  $('#ancient-records-menu')?.addEventListener('click',ancientUI.records);
  $('#ancient-chapters-menu')?.addEventListener('click',ancientUI.chapters);
  $("#settings").onclick = settings;
  $("#home").onclick = () => travel("hq");
  if (adminMode) $("#admin-menu").onclick = adminPanel;
  $("#to-title").onclick = () => {
    if(adminMode){adminExit();return;}
    save();
    close();
    playing = false;
    adminMode = false;
    document.querySelector(".admin-mode-badge")?.remove();
    music.stop();
    $("#hud").hidden = true;
    $("#title").hidden = false;
    $("#continue").disabled = !saved;
    $("#continue").textContent = saved ? `이어하기 · ${saved.nickname}` : "이어하기";
  };
}
$("#menu-btn").onclick = () => {
  if (
    !["battle", "intro", "tutorial", "defeat", "dialogue", "eating"].includes(
      screen,
    )
  )
    menu();
};
function nationRecords() {
  panel('여러 나라 기록', `<div class="nation-records">${NATIONS.map(n=>{
    const parts = n.id==='okjeo' || n.id==='dongye' ? [n.id] : [n.id];
    const unlocked = parts.every(id=>s.nationMarks.includes(id));
    return `<article><b>${unlocked ? n.name : n.name + ' ?'}</b><p>${unlocked ? esc(NATION_RECORDS[n.id]) : '아직 기록하지 않았다.'}</p></article>`;
  }).join('')}</div><p class="note">탐험 표식 ${s.nationMarks.length} / 5 · 표식은 게임 진행용 물건이다.</p>`,{wide:true});
}
function nationMap() {
  if (!adminMode && (!s.unlockedRegions.includes('nations') || ((s.progress.nations||0)<8 && !s.completedRegions.includes('nations')))) {
    toast('철기 마을의 이야기 임무를 먼저 마치자.'); return;
  }
  const places=[
    {id:'buyeo',name:'부여',map:'nation-buyeo-village',maps:['nation-buyeo-road',...NATIONS[0].places],x:42,y:20},
    {id:'goguryeo',name:'고구려',map:'nation-goguryeo-village',maps:['nation-goguryeo-road',...NATIONS[1].places],x:43,y:31},
    {id:'okjeo',name:'옥저',map:'nation-okjeo-village',maps:['nation-okjeo-road',...NATIONS[2].places],x:61,y:46},
    {id:'dongye',name:'동예',map:'nation-dongye-village',maps:NATIONS[3].places,x:59,y:57},
    {id:'mahan',name:'마한',map:'nation-samhan-mahan',maps:['nation-samhan-mahan'],x:55,y:77},
    {id:'byeonhan',name:'변한',map:'nation-samhan-byeonhan',maps:['nation-samhan-byeonhan'],x:62,y:85},
    {id:'jinhan',name:'진한',map:'nation-samhan-jinhan',maps:['nation-samhan-jinhan'],x:72,y:74}
  ];
  if (s.map.startsWith('nation-') && !s.discoveredMaps.includes(s.map)) {s.discoveredMaps.push(s.map);save();}
  const current=places.find(p=>p.maps.includes(s.map));
  const visited=p=>adminMode || p.maps.some(id=>s.discoveredMaps.includes(id));
  panel('지역 지도', `<p class="map-location">현재 위치: ${esc(currentMap().name)}</p><div class="nation-map" role="group" aria-label="원본 역사 지도">${places.map(p=>{
      const here=current?.id===p.id,seen=visited(p);
      return `<button class="nation-pin ${seen?'seen':'unknown'}" style="left:${p.x}%;top:${p.y}%" data-nation="${p.id}" aria-label="${p.name}${here?' 현재 위치':seen?' 발견':' 미발견'}"><span class="sr-only">${p.name}</span></button>${here?`<span class="nation-current" style="left:${p.x}%;top:${p.y}%" aria-hidden="true">●</span>`:''}`;
    }).join('')}</div><p class="note">원본 역사 지도 · 위치는 학습용 표시다.</p><div id="map-selection" aria-live="polite">지도에 적힌 지역 이름을 눌러 보자.</div>`,{wide:true});
  document.querySelectorAll('[data-nation]').forEach(b=>b.onclick=()=>{
    const p=places.find(p=>p.id===b.dataset.nation);
    if(!visited(p)) {$('#map-selection').innerHTML=`<h3>${p.name}</h3><p>아직 가 보지 않은 지역이다.</p>`;return;}
    const details=[p.map,...p.maps.filter(id=>id!==p.map)];
    const here=current?.id===p.id;
    $('#map-selection').innerHTML=`<h3>${p.name}</h3><p>발견한 장소: ${details.map(id=>s.discoveredMaps.includes(id)||adminMode?'✓ '+esc(MAPS[id].name):'????').join(' · ')}</p>${here?'<p class="map-here">● 현재 위치</p>':`<button class="primary full" id="fast-travel">${p.name} 지역으로 이동하기</button>`}`;
    if(!here) $('#fast-travel').onclick=()=>travel(p.map,s.map,{fast:true});
  });
}
$('#map-btn').onclick=()=>safeMenu(currentMap().ancient?ancientUI.map:nationMap);
$('#mount-btn').onclick=async()=>{
  if(!s.horseUnlocked || s.horseParked || !canMount()) return;
  if(!s.mounted){
    const button=$('#mount-btn');button.disabled=true;
    try {await prepareMounted(s.appearance);} catch {toast('말 그림을 불러오지 못했다. 다시 시도해 줘.');button.disabled=false;return;}
    button.disabled=false;
  }
  s.mounted=!s.mounted;save();hud();toast(s.mounted?'말에 탔다.':'말에서 내렸다.');
};
function inventory(tab = "food") {
  panel(
    "가방",
    `<div class="shop-balance">${s.coins} 엽전</div><div class="shop-tabs">${[
      ["food", "음식"],
      ["gear", "장비"],
      ["other", "기타"],
    ]
      .map(
        ([id, name]) =>
          `<button data-bag="${id}" class="${id === tab ? "selected" : ""}">${name}</button>`,
      )
      .join("")}</div><div class="bag-grid">${
      tab === "food"
        ? FOOD_IDS.filter((id) => s.inventory[id] > 0)
            .map(
              (id) =>
                `<div class="item">${itemIcon(id)}<div class="info"><b>${ITEMS[id].name} × ${s.inventory[id]}</b><small>${ITEMS[id].text}</small></div><button data-eat="${id}" ${s.hp >= abilities(s).hp ? "disabled" : ""}>먹기</button></div>`,
            )
            .join("")
        : tab === "gear"
          ? s.inventory.gear
              .map(
                (id) =>
                  `<div class="item">${itemIcon(id)}<div class="info"><b>${ITEMS[id].name}</b><small>${ITEMS[id].text}</small></div><button data-equip="${id}" ${s.equipment[ITEMS[id].kind] === id ? "disabled" : ""}>${s.equipment[ITEMS[id].kind] === id ? "장착 중" : "장착"}</button></div>`,
              )
              .join("")
          : STACK_IDS.filter(
              (id) => ITEMS[id].kind === "material" && s.inventory[id] > 0,
            )
              .map(
                (id) =>
                  `<div class="item">${itemIcon(id)}<div class="info"><b>${ITEMS[id].name} × ${s.inventory[id]}</b><small>${ITEMS[id].text}</small></div>${id==='boarbone'?'<button id="craft-needle">뼈바늘 만들기</button>':''}</div>`,
              )
              .join("") + '<p class="note">유물은 역사 도감에 기록된다.</p>'
    }</div>`,
    { wide: true },
  );
  document
    .querySelectorAll("[data-bag]")
    .forEach((b) => (b.onclick = () => inventory(b.dataset.bag)));
  document
    .querySelectorAll("[data-eat]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          chooseFood(b.dataset.eat, false, () => inventory(tab))),
    );
  document.querySelectorAll("[data-equip]").forEach(
    (b) =>
      (b.onclick = () => {
        equip(b.dataset.equip);
        inventory(tab);
      }),
  );
  $('#craft-needle')?.addEventListener('click',()=>{if(makeNeedle(s)){save();hud();inventory('other');feedback('뼈를 다듬어 뼈바늘을 만들었다.','item');if(rodReady(s))toast(fishingObjective(s));}else toast('기술자에게 낚싯대 이야기를 먼저 들어 보자.');});
}
function profile() {
  const a = abilities(s);
  panel(
    "나",
    `<div class="profile-head"><img id="profile-avatar" alt="내 캐릭터"><h2>${esc(s.nickname)} · Lv.${s.level}</h2></div><p>개인 코드 <strong>${esc(s.personalCode || "없음")}</strong></p><div class="stats"><div><b>${s.hp}/${a.hp}</b><small>HP</small></div><div><b>${s.energy}/20</b><small>기력</small></div><div><b>${a.attack}</b><small>공격</small></div><div><b>${a.defense}</b><small>방어</small></div></div><p>경험치 ${s.xp} / ${s.level === MAX_LEVEL ? "최대" : xpNeed(s.level)}</p>${["weapon", "clothes", "accessory"].map((kind, i) => `<div class="item">${s.equipment[kind] ? itemIcon(s.equipment[kind]) : '<span class="empty-slot">—</span>'}<div class="info"><small>${["무기", "방어구", "장신구"][i]}</small><b>${ITEMS[s.equipment[kind]]?.name || "장착한 장비 없음"}</b><small>${ITEMS[s.equipment[kind]]?.text || ""}</small></div></div>`).join("")}`,
  );
  setAvatarImage($("#profile-avatar"));
}
function safeMenu(fn) {
  if (
    playing &&
    !["battle", "intro", "tutorial", "defeat", "dialogue", "eating", "fishing"].includes(screen)
  )
    fn();
}
$("#profile-btn").onclick = () => safeMenu(profile);
$("#bag-btn").onclick = () => safeMenu(inventory);
$("#sound-btn").onclick = () => {
  s.audioMuted = !s.audioMuted;
  music.mute(s.audioMuted);
  save();
  hud();
};
function itemIcon(id) {
  const i = ITEMS[id];
  return imageTag(i.art, i.name, `item-icon tier-${i.tier || 0}`);
}
function equip(id) {
  s.equipment[ITEMS[id].kind] = id;
  s.hp = Math.min(s.hp, abilities(s).hp);
  save();
  hud();
}
function feedback(text, kind = "xp", sound = kind) {
  if (sound) music.effect(sound);
  let host = $("#number-feedback");
  if (!host) {
    host = document.createElement("div");
    host.id = "number-feedback";
    host.setAttribute("aria-live", "polite");
    document.body.append(host);
  }
  const el = document.createElement("div");
  el.className = "number " + kind;
  if(kind==='coin') {
    const coin=document.createElement('img');coin.src=ASSETS.coin;coin.alt='';coin.className='coin-icon';el.append(coin);
  }
  el.append(document.createTextNode(text));
  host.append(el);
  setTimeout(() => el.remove(), 3000);
}
function rewardFeedback(xp, coins) {
  if (xp && s.level < MAX_LEVEL) feedback("경험치 +" + xp, "xp");
  if (coins) feedback("+" + coins + " 엽전", "coin");
}
async function eatFood(id) {
  const state = s,
    a = abilities(s),
    item = ITEMS[id];
  if (!FOOD_IDS.includes(id) || !s.inventory[id] || s.hp >= a.hp) return 0;
  const n = Math.min(item.heal, a.hp - s.hp);
  s.inventory[id]--;
  s.hp += n;
  s.foodEffect =
    item.risk && Math.random() < item.risk.chance ? item.risk.damage : 0;
  feedback("HP +" + n, "heal");
  save();
  hud();
  updateBattle();
  if (s.foodEffect) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (s !== state) return n;
    const damage = Math.min(s.hp, s.foodEffect);
    s.hp -= damage;
    s.foodEffect = 0;
    toast("배가 아프다.");
    feedback("HP -" + damage, "damage");
    save();
    hud();
    updateBattle();
  }
  return n;
}
function chooseFood(id, inBattle = false, done = () => inventory()) {
  if (ITEMS[id].risk) {
    if (inBattle) {
      const host = $("#battle-foods");
      host.innerHTML = `<div class="raw-food"><p>익히지 않은 음식이다.</p><div class="row"><button id="raw-eat">먹기</button><button id="raw-cancel">취소</button></div></div>`;
      host.hidden = false;
      $("#raw-eat").onclick = () => {
        battleUI();
        turn(id);
      };
      $("#raw-cancel").onclick = battleUI;
    } else {
      panel(
        ITEMS[id].name,
        `<p>익히지 않은 음식이다.</p><div class="row"><button id="raw-eat">먹기</button><button id="raw-cancel">취소</button></div>`,
      );
      $("#raw-eat").onclick = () => consumeOutside(id, done);
      $("#raw-cancel").onclick = done;
    }
  } else if (inBattle) turn(id);
  else consumeOutside(id, done);
}
async function consumeOutside(id, done) {
  panel(
    "음식",
    `<p>${ITEMS[id].name}${(ITEMS[id].name.charCodeAt(ITEMS[id].name.length - 1) - 44032) % 28 ? "을" : "를"} 먹었다.</p>`,
    { closable: false, type: "eating" },
  );
  await eatFood(id);
  done();
}
function codex() {
  panel(
    "역사 도감",
    `<p class="note">${s.artifacts.length} / ${ARTIFACTS.length} 발견 · 유물을 누르면 설명이 열린다.</p><div class="artifact-grid">${ARTIFACTS.map((a) => (s.artifacts.includes(a.id) ? `<button class="artifact" data-relic="${a.id}">${imageTag(a.art)}<b>${a.name}</b><small>${a.period}</small></button>` : `<div class="artifact locked"><span>?</span><b>???</b><small>미발견</small></div>`)).join("")}</div>`,
    { wide: true },
  );
  document
    .querySelectorAll("[data-relic]")
    .forEach((b) => (b.onclick = () => artifactDetail(b.dataset.relic, false)));
}
function artifactDetail(id, found = false, done = codex) {
  const a = ARTIFACTS.find((a) => a.id === id),
    first = found && !s.artifacts.includes(id);
  s.tutorials ??= {};
  const tip =
    first && !s.tutorials.artifact
      ? '<p class="artifact-tip">찾은 유물은 탐험수첩에 기록할 수 있어!</p>'
      : "";
  if (first && !s.tutorials.artifact) {
    s.tutorials.artifact = true;
    save();
  }
  panel(
    first
      ? `${a.name}${/[가-힣]/.test(a.name.at(-1)) && (a.name.charCodeAt(a.name.length - 1) - 44032) % 28 ? "을" : "를"} 발견했다.`
      : "유물 설명",
    `<div class="artifact-detail">${imageTag(a.art, a.name)}<div><div class="eyebrow">${a.period}</div><h2>${a.name}</h2><p>${esc(a.text).replaceAll("\n", "<br>")}</p></div></div>${tip}<button id="relic-ok" class="primary full">${first ? "도감에 기록" : "닫기"}</button>`,
    { closable: false },
  );
  $("#relic-ok").onclick = () => {
    if (first) {
      s.artifacts.push(id);
      music.effect("artifact");
      save();
      toast("도감에 기록했다.");
    }
    close();
    done();
  };
}
function shop(tab = "weapon") {
  if (tab === "sell") {
    selling();
    return;
  }
  const r =
      regionOf(s.map) ||
      REGIONS.filter((r) => s.unlockedRegions.includes(r.id)).at(-1),
    stock = r.shop;
  panel(
    "상점",
    `<div class="shop-balance">${s.coins.toLocaleString()} 엽전</div><div class="shop-tabs" role="tablist">${[["weapon", "무기"], ["clothes", "방어구"], ["food", "음식"], ...(['gojoseon','nations','ancient'].includes(regionOf(s.map)?.id) ? [["sell", "판매"]] : [])].map(([k, n]) => `<button role="tab" aria-selected="${tab === k}" data-category="${k}" class="${tab === k ? "selected" : ""}">${n}</button>`).join("")}</div><div class="shop-grid">${stock
      .filter(
        (id) =>
          ITEMS[id].kind === tab ||
          (tab === "clothes" && ITEMS[id].kind === "accessory"),
      )
      .map((id) => {
        const i = ITEMS[id],
          owned = s.inventory.gear.includes(id),
          stat = i.attack ? "attack" : i.defense ? "defense" : "hp",
          label = { attack: "공격", defense: "방어", hp: "최대 HP" }[stat],
          current = ITEMS[s.equipment[i.kind]]?.[stat] || 0,
          delta = (i[stat] || 0) - current;
        return `<article class="shop-item">${itemIcon(id)}<div class="info"><b>${i.name}</b><small>${i.text}</small>${i.kind !== "food" ? `<small class="compare">현재 +${current} → 새 장비 +${i[stat]}<br><span class="${delta < 0 ? "loss" : "improve"}">${label} ${delta > 0 ? "+" : ""}${delta} ${delta > 0 ? "↑" : delta < 0 ? "↓" : "="}</span></small>` : ""}</div><span class="price">${i.price} 엽전</span><button data-buy="${id}" ${s.coins < i.price || owned ? "disabled" : ""}>${owned ? "보유 중" : "구매"}</button></article>`;
      })
      .join("")}</div><p class="note">엽전은 이 게임에서 쓰는 돈이다.</p>`,
    { wide: true },
  );
  document
    .querySelectorAll("[data-category]")
    .forEach((b) => (b.onclick = () => shop(b.dataset.category)));
  document.querySelectorAll("[data-buy]").forEach(
    (b) =>
      (b.onclick = () => {
        const id = b.dataset.buy,
          i = ITEMS[id];
        if (s.coins < i.price || s.inventory.gear.includes(id)) return;
        s.coins -= i.price;
        feedback("-" + i.price + " 엽전", "coin", null);
        if (i.kind === "food") {
          s.inventory[id]++;
          save();
          hud();
          shop(tab);
        } else {
          s.inventory.gear.push(id);
          save();
          hud();
          panel(
            "지금 장착할까?",
            `<div class="purchased">${itemIcon(id)}<b>${i.name}</b></div><div class="row"><button id="equip-now" class="primary full">장착</button><button id="store-gear" class="full">가방에 넣기</button></div>`,
            { closable: false },
          );
          $("#equip-now").onclick = () => {
            equip(id);
            shop(tab);
          };
          $("#store-gear").onclick = () => shop(tab);
        }
      }),
  );
}
function merchant(e) {
  if (regionOf(s.map)?.id === "gojoseon" && !s.merchantIntro) {
    s.merchantIntro = true;
    save();
    dialogue(
      e.name,
      ["남는 물건은 교환원에게 팔 수 있어.\n엽전으로 바꿔 줄게."],
      e.art,
      shop,
    );
  } else shop();
}
function selling() {
  if (!['gojoseon','nations','ancient'].includes(regionOf(s.map)?.id)) return;
  const ids = STACK_IDS.filter(
    (id) => salePrice(ITEMS[id]) && s.inventory[id] > 0,
  );
  const gear = s.inventory.gear.filter(id => gearSalePrice(ITEMS[id]));
  const gearRows = gear.map(id => {
    const worn = Object.values(s.equipment).includes(id);
    return `<article class="shop-item">${itemIcon(id)}<div class="info"><b>${ITEMS[id].name}</b><small>판매 가격</small></div><span class="price">${gearSalePrice(ITEMS[id])} 엽전</span><button data-sell-gear="${id}" ${worn ? 'disabled' : ''}>${worn ? '착용 중' : '판매'}</button></article>`;
  });
  panel(
    "상점",
    `<div class="shop-balance">${s.coins.toLocaleString()} 엽전</div><div class="shop-tabs" role="tablist">${[
      ["weapon", "무기"],
      ["clothes", "방어구"],
      ["food", "음식"],
      ["sell", "판매"],
    ]
      .map(
        ([id, label]) =>
          `<button role="tab" aria-selected="${id === "sell"}" class="${id === "sell" ? "selected" : ""}" data-category="${id}">${label}</button>`,
      )
      .join(
        "",
      )}</div><div class="shop-grid">${ids.map((id) => `<article class="shop-item">${itemIcon(id)}<div class="info"><b>${ITEMS[id].name} × ${s.inventory[id]}</b><small>판매 가격</small></div><span class="price">${salePrice(ITEMS[id])} 엽전</span><button data-sell="${id}">판매</button></article>`).concat(gearRows).join("") || "<p>판매할 물건이 없다.</p>"}</div>`,
    { wide: true },
  );
  document
    .querySelectorAll("[data-category]")
    .forEach((b) => (b.onclick = () => shop(b.dataset.category)));
  document.querySelectorAll("[data-sell]").forEach(
    (b) =>
      (b.onclick = () => {
        const coins = sellItem(s, ITEMS, b.dataset.sell);
        if (!coins) return;
        save();
        hud();
        feedback("+" + coins + " 엽전", "coin");
        selling();
      }),
  );
  document.querySelectorAll('[data-sell-gear]').forEach(b => b.onclick = () => {
    const id = b.dataset.sellGear;
    if (Object.values(s.equipment).includes(id) || !s.inventory.gear.includes(id)) return;
    panel('장비 판매', `<p>${ITEMS[id].name}을 ${gearSalePrice(ITEMS[id])}엽전에 팔까?</p><div class="row"><button id="cancel-gear-sale">취소</button><button id="confirm-gear-sale" class="primary">판매</button></div>`);
    $('#cancel-gear-sale').onclick = selling;
    $('#confirm-gear-sale').onclick = () => {
      const coins = sellGear(s, ITEMS, id);
      if (coins) {
        save(); hud(); feedback('+' + coins + ' 엽전', 'coin');
      }
      selling();
    };
  });
}
function requestCount(q, p) {
  return q.kind === "berries"
    ? s.inventory.berries
    : q.kind === "item"
      ? s.inventory[q.item] || 0
      : p?.count || 0;
}
function requestBy(id) {
  return REGIONS.flatMap((r) => r.requests).find((q) => q.id === id);
}
function requestTalk(
  id,
  npc = currentMap().entities.find((e) => e.request === id),
) {
  const original = requestBy(id),
    q = {
      ...original,
      coins: ["paleolithic", "prehistoric"].includes(regionOf(s.map)?.id)
        ? 0
        : original.coins,
    },
    p = s.requests[id];
  if (p?.status === "done") {
    dialogue(
      npc?.name || "마을 사람",
      ["도와줘서 고마워!\n다른 곳도 자유롭게 둘러봐."],
      npc?.art || "farmer",
    );
    return;
  }
  if (!p) {
    panel(
      q.name,
      `<p>${esc(q.text).replace("\n", "<br>")}</p><div class="reward">보상: 경험치 ${q.xp}${q.coins ? ` · 엽전 ${q.coins}` : ""}</div><div class="row"><button class="full" id="later">나중에</button><button class="primary full" id="accept">수락</button></div>`,
    );
    $("#later").onclick = close;
    $("#accept").onclick = () => {
      s.requests[id] = { status: "active", count: 0 };
      save();
      close();
      toast("부탁을 받았다.");
    };
    return;
  }
  let n = requestCount(q, p);
  if (n >= q.need) {
    if (q.kind === "berries") s.inventory.berries -= q.need;
    else if (q.kind === "item") s.inventory[q.item] -= q.need;
    p.status = "done";
    gain(s, q.xp, q.coins);
    rewardFeedback(q.xp, q.coins);
    s.completedQuests.push(id);
    save();
    hud();
    dialogue(
      npc?.name || "마을 사람",
      [q.complete || "고마워! 덕분에 도움이 됐어."],
      npc?.art || "farmer",
    );
  } else
    dialogue(
      npc?.name || "마을 사람",
      [
        `${q.kind === "berries" ? "열매를 모아 줘." : q.kind === "item" ? ITEMS[q.item].name + "을 모아 줘." : "이 시대의 적을 물리쳐 줘."}\n지금은 ${n} / ${q.need}만큼 했어.`,
      ],
      npc?.art || "farmer",
    );
}
function requestsMenu() {
  const r = regionOf(s.map),
    q = activeQuest(s);
  panel(
    "임무와 부탁",
    `<div class="eyebrow">이야기 임무</div><div class="quest-item"><b>${q?.title || "시대의 문에서 탐험할 곳을 골라 봐."}</b><p>${q ? MAPS[q.map].name : "완료한 시대도 다시 갈 수 있어."}</p></div><div class="eyebrow">부탁 · 선택 임무</div>${REGIONS.filter(
      (r) => s.unlockedRegions.includes(r.id),
    )
      .flatMap((r) =>
        r.requests.map((q) => {
          let p = s.requests[q.id],
            n = requestCount(q, p);
          const where = MAPS[q.map || r.village].name;
          return `<div class="quest-item"><b>${q.name}</b><p>${p?.status === "done" ? "완료 ✓" : p ? `${Math.min(n, q.need)} / ${q.need} · 부탁한 사람에게 돌아가자.` : `${where}에서 부탁을 찾아보자.`}</p><span class="reward">경험치 ${q.xp}${q.coins ? ` · 엽전 ${q.coins}` : ""}</span></div>`;
        }),
      )
      .join("")}`,
  );
}
function exportSave(data = s) {
  const raw = data
    ? JSON.stringify(data, null, 2)
    : localStorage.getItem(KEY) || "{}";
  const blob = new Blob([raw], { type: "application/json" }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = "시간탐험대_저장.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
function settings() {
  panel(
    "설정과 저장",
    `<button class="full" id="setting-sound">${s.audioMuted ? "음악 켜기" : "음악 끄기"}</button><p class="tip">개인 코드 <strong>${esc(s.personalCode || "없음")}</strong><br>이 기기에도 자동 저장된다.</p><button class="full primary" id="export">저장 데이터 내보내기</button><label for="file-input">저장 데이터 불러오기</label><input id="file-input" type="file" accept=".json,application/json"><p class="note">불러오면 현재 기록이 바뀐다.<br>저장 파일로 다른 기기에 옮길 수 있다.</p><details><summary>조작 방법과 게임 안내</summary><p class="note">방향키 / WASD: 이동<br>스페이스 / Enter: 조사와 말하기<br>Esc: 메뉴 열기와 닫기<br>태블릿: 왼쪽 이동 버튼과 오른쪽 조사 버튼<br>마을의 모닥불: HP 30%까지만 회복<br>그림과 옷차림은 게임에 맞게 단순하게 표현했다.</p><a href="https://contents.history.go.kr/mobile/eh/view.do?code=eh_age_10&levelId=eh_r0011_0010" target="_blank" rel="noopener">역사 내용 참고: 국사편찬위원회 우리역사넷</a></details>`,
  );
  $("#setting-sound").onclick = () => {
    s.audioMuted = !s.audioMuted;
    music.mute(s.audioMuted);
    save();
    hud();
    settings();
  };
  $("#export").onclick = () => {
    save();
    exportSave();
  };
  $("#file-input").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (file.size > 500000) throw Error("파일이 너무 크다.");
      const data = validate(JSON.parse(await file.text()));
      panel(
        "이 기록을 불러올까?",
        `<p>${esc(data.nickname)} · Lv.${data.level}<br>현재 기록이 이 탐험 기록으로 바뀐다.</p><div class="row"><button id="cancel-import">취소</button><button id="confirm-import" class="primary">불러오기</button></div>`,
      );
      $("#cancel-import").onclick = settings;
      $("#confirm-import").onclick = () => {
        start(data);
        toast("저장 기록을 불러왔다.");
      };
    } catch (err) {
      toast(
        err.message === "Unexpected end of JSON input"
          ? "저장 파일을 읽을 수 없다."
          : err.message,
      );
    }
  };
}
function fishingMaterialsText() {
  return Object.keys(ROD_RECIPE).map(id=>`${ITEMS[id].name} ${Math.min(s.inventory[id]||0,1)} / 1`).join(' · ')+(rodReady(s)?'':'\n'+fishingObjective(s));
}
function spindleThread() {
  panel('가락바퀴로 실 만들기',`<div class="artifact-detail">${imageTag('spindle','가락바퀴')}<p>가락바퀴를 이용하면 섬유를 꼬아 실을 만들 수 있어.</p></div><p>가락바퀴와 도감 기록은 그대로 남아.</p><button id="make-thread" class="primary full" ${s.inventory.fishingthread?'disabled':''}>실 만들기${s.inventory.fishingthread?' · 이미 준비됨':''}</button>`);
  $('#make-thread').onclick=()=>{if(makeThread(s)){close();save();hud();feedback('실 +1','item');if(rodReady(s))toast(fishingObjective(s));}};
}
function fishingTechnician(e,q) {
  clearTimeout(toastTimer);
  $('#toast').style.opacity=0;
  if(hasRod(s)){dialogue(e.name,['낚싯대는 계속 사용할 수 있어. 물가의 낚시 자리로 가 보자.'],e.art);return;}
  if(!fishingStarted(s)) {
    if(q?.id!=='pre-fishing-start'&&!s.completedRegions.includes('prehistoric')) {
      dialogue(e.name,['찾던 도구를 살펴보고 어른께 돌아간 뒤 다시 만나자.'],e.art);return;
    }
    dialogue(e.name,e.lines,e.art,()=>{
      if(activeQuest(s)?.id==='pre-fishing-start')finishEvent('talk:neo-technician');
      else {s.completedQuests.push('pre-fishing-start');save();hud();}
      toast('실, 나뭇가지, 뼈바늘을 준비하자. 뼈바늘은 가방에서 만들 수 있어.');
    });return;
  }
  const craft=()=>{
    if(!makeRod(s))return;
    close();finishEvent('craft:fishingrod');feedback('낚싯대 획득!','item','artifact');
    toast('강가 낚시 자리에서 첫 물고기를 잡아 보자.');
  };
  if(rodReady(s)) {
    dialogue(e.name,['재료를 다 모았구나.','좋아. 낚싯대를 만들어 줄게.'],e.art,craft);
    return;
  }
  panel('낚싯대 만들기',`<p>${fishingMaterialsText().replaceAll('\n','<br>')}</p><p>실은 가락바퀴에서, 가지는 숲에서 구해 보자.<br>멧돼지를 잡아 얻은 뼈는 가방 → 기타에서 뼈바늘로 만들 수 있어.</p><p class="note">게임에서는 이 재료들을 이용해 간단한 낚싯대를 만들 수 있어.</p><button id="make-rod" class="primary full" disabled>낚싯대 만들기</button>`);
}
function adminFishingQA(e,modes=INTERACTION_QA.find(v=>v.id==='fishing').modes) {
  if(!adminMode)return;
  panel('낚시 미니게임 테스트',`<p>시험 조건을 선택하자. 학생 원래 기록에는 저장되지 않아.</p><div class="admin-grid">${modes.map(v=>`<button data-fishing-test="${v.id}">${v.name}</button>`).join('')}</div><button id="qa-fishing-reset" class="full">이 낚시터 쿨타임 초기화</button><button id="admin-back">관리자 메뉴</button>`);
  document.querySelectorAll('[data-fishing-test]').forEach(b=>b.onclick=()=>{
    const mode=modes.find(v=>v.id===b.dataset.fishingTest);
    delete s.cooldowns[fishingSiteKey(s.map,e.id)];
    if(mode.rest!==undefined)restFishingSite(s,s.map,e.id,mode.rest);
    fishingMenu(e,mode.options||{});
  });
  $('#qa-fishing-reset').onclick=()=>{delete s.cooldowns[fishingSiteKey(s.map,e.id)];hud();toast('시험 낚시터가 다시 열렸다.');};
  adminBack();
}
function watchFishingCooldown(e,button,status) {
  const state=s,map=s.map;
  let frame=0,alive=true;
  stopFishing=()=>{alive=false;cancelAnimationFrame(frame);};
  function update() {
    if(!alive||s!==state)return;
    const remaining=fishingCooldown(state,map,e.id);
    button.disabled=remaining>0;
    button.textContent=remaining>0?`다시 낚시하기 · ${Math.ceil(remaining/1000)}초 뒤`:'다시 낚시하기';
    if(status&&remaining<=0)status.textContent='다시 낚시할 수 있어.';
    if(remaining>0)frame=requestAnimationFrame(update);
  }
  update();
}
function fishingMenu(e,options={}) {
  if(!hasRod(s)){dialogue(e.name,['낚싯대가 필요해. 신석기 마을 기술자에게 만들어 달라고 하자.'],'rodIcon');return;}
  if(!adminMode)options={};
  const tutorial=options.tutorial??!s.tutorials.fishing;
  const resting=fishingCooldown(s,s.map,e.id)>0;
  panel(e.name,`${resting?'<p id="fishing-rest">지금은 물고기가 보이지 않는다.<br>조금 뒤에 다시 와 보자.</p>':`<div class="fishing-intro">${imageTag('rodIcon','나무 막대와 실로 만든 낚싯대')}<p>입질을 기다린 뒤,<br>표시가 성공 구간에 왔을 때 <b>당기기!</b></p></div><p>물고기마다 필요한 성공 횟수와 타이밍이 달라.<br>한 기회에 한 번만 당길 수 있어. 실패해도 잃는 것은 없어.</p>${tutorial?'<p class="note">첫 낚시는 조금 더 쉬워. 성공 2~3회로 잡을 수 있어.</p>':'<p class="note">입질은 금방 올 수도, 1분 가까이 걸릴 수도 있어.</p>'}`}<button id="cast-fishing" class="primary full" ${resting?'disabled':''}>낚시 시작</button>${adminMode?'<button id="qa-fishing-clear" class="full">시험 쿨타임 초기화</button><button id="qa-fishing-back">낚시 시험 조건</button>':''}`);
  $('#cast-fishing').onclick=()=>startFishing(e,tutorial,options);
  if(resting)watchFishingCooldown(e,$('#cast-fishing'),$('#fishing-rest'));
  if(adminMode){
    $('#qa-fishing-clear').onclick=()=>{delete s.cooldowns[fishingSiteKey(s.map,e.id)];fishingMenu(e,options);};
    $('#qa-fishing-back').onclick=()=>adminFishingQA(e);
  }
}
function startFishing(e,tutorial,options={}) {
  if(fishingCooldown(s,s.map,e.id)>0){fishingMenu(e,options);return;}
  const game=createFishing(tutorial,adminMode?options:{}),state=s,map=s.map;
  panel('낚시',`<div class="fishing-water waiting" aria-hidden="true"><span class="water-ring"></span><span class="fishing-float">│<br>●</span></div><p id="fishing-status" role="status">낚싯대를 던졌다. 입질을 기다리는 중...</p><p id="fishing-count"></p><div class="fishing-gauge" hidden aria-label="움직이는 표시와 성공 구간"><span class="fishing-zone">성공</span><span id="fishing-marker" class="fishing-marker" data-in-zone="false"></span></div><button id="pull-fishing" class="primary full fishing-pull" disabled>당기기!</button><p class="note">한 기회에 한 번만! 성공 구간 밖에서 누르면 이번 기회는 끝나.</p>${adminMode?'<button id="qa-fishing-skip" class="full">시험 대기 건너뛰기</button>':''}`,{type:'fishing'});
  const button=$('#pull-fishing'),marker=$('#fishing-marker'),status=$('#fishing-status'),count=$('#fishing-count'),gauge=$('.fishing-gauge'),zone=$('.fishing-zone'),water=$('.fishing-water');
  let frame=0,alive=true,active=false,biteShown=false,biteAt=performance.now()+game.waitMs,roundAt=biteAt+900;
  const updateCount=()=>{count.textContent=`성공 ${game.successes} / ${game.required} · 실수 ${game.round+(game.pressed?1:0)-game.successes} / ${game.maxFailures}`;};
  const updateZone=()=>{zone.style.left=`${game.zone[0]*100}%`;zone.style.width=`${(game.zone[1]-game.zone[0])*100}%`;};
  updateCount();updateZone();
  stopFishing=()=>{alive=false;cancelAnimationFrame(frame);};
  if(adminMode)$('#qa-fishing-skip').onclick=()=>{if(biteShown)return;biteAt=performance.now();roundAt=biteAt+900;$('#qa-fishing-skip').disabled=true;};
  music.effect('click');
  button.onclick=()=>{
    if(!alive||!active||game.pressed||s!==state)return;
    fishingPosition(game,performance.now()-roundAt);
    if(game.position>=1)return;
    const success=pullFishing(game);
    button.disabled=true;
    status.textContent=success?'좋아! 물고기를 당겼다.':'이번에는 빗나갔다.';
    updateCount();
    music.effect(success?'xp':'click');
  };
  function complete() {
    close();
    restFishingSite(state,map,e.id,game.won);
    if(game.won) {
      state.inventory.fish++;state.tutorials.fishing=true;
      feedback('물고기를 잡았다! 생물고기 +1','item','artifact');
      finishEvent('fishing:catch');
      if(screen==='dialogue')return;
    } else save();
    panel(game.won?'물고기를 잡았다!':'물고기가 도망갔다!',`<p>${game.won?'생물고기 1마리를 얻었다. 모닥불에서 익힐 수 있어.<br>이 낚시터는 1분 동안 쉬어. 다른 물가를 찾아보자.':'다시 도전해 보자. HP와 엽전, 낚싯대는 그대로야.<br>잠시 기다리면 이 낚시터가 다시 열려.'}</p><button id="fish-retry" class="primary full" disabled>다시 낚시하기</button>${adminMode?'<button id="qa-fishing-back">낚시 시험 조건</button>':''}`);
    $('#fish-retry').onclick=()=>fishingMenu(e,options);
    watchFishingCooldown(e,$('#fish-retry'));
    if(adminMode)$('#qa-fishing-back').onclick=()=>adminFishingQA(e);
  }
  function animate(now) {
    if(!alive||screen!=='fishing'||s!==state)return;
    if(now>=biteAt&&!biteShown){
      biteShown=true;water.className='fishing-water biting';
      status.textContent='입질이다! 곧 당길 준비!';music.effect('xp');
      if(adminMode)$('#qa-fishing-skip').disabled=true;
    }
    if(now>=roundAt) {
      if(!active){active=true;gauge.hidden=false;button.disabled=false;water.className='fishing-water';status.textContent='성공 구간에 맞춰 당기기!';}
      const pos=fishingPosition(game,now-roundAt);
      marker.style.left=`${pos*100}%`;
      marker.dataset.inZone=String(pos>=game.zone[0]&&pos<=game.zone[1]);
      if(pos>=1) {
        active=false;button.disabled=true;gauge.hidden=true;
        nextFishingRound(game);updateCount();
        if(game.done){complete();return;}
        updateZone();status.textContent='물고기가 다시 움직인다. 다음 기회!';
        roundAt=now+450;
        marker.style.left='0%';marker.dataset.inZone='false';
      }
    }
    frame=requestAnimationFrame(animate);
  }
  frame=requestAnimationFrame(animate);
}
function nearby() {
  return currentMap().entities
    .filter(
      (e) =>
        e.type !== "scenery" &&
        e.type !== "roomProp" &&
        !(e.type==='roomLoot' && s.opened.includes(e.id)) &&
        !(e.type==='story' && !e.collect && activeQuest(s)?.target!==e.id && e.id!=='dongye-sign') &&
        (!['berry','loot','chest'].includes(e.type) || resourceReady(s,e)) &&
        !(e.type==='story' && e.collect && s.opened.includes(e.id)) &&
        !(e.type === "enemy" && !enemyVisible(e)) &&
        !(e.type === "enemy" && (s.cooldowns[e.id] || 0) > Date.now()) &&
        !(e.type === 'horse' && (s.horseUnlocked || s.horseField?.map!==s.map || s.horseField?.id!==e.id || s.horseField.until<Date.now())),
    )
    .map((e) => ({ ...e, d: Math.hypot(e.x - s.x, e.y - s.y) }))
    .filter((e) => e.d < (e.type==='horse' ? 1.9 : 1.65))
    .sort((a, b) => a.d - b.d)[0];
}
function interact() {
  if (!playing || screen) return;
  const e = nearby();
  if (!e) {
    toast("사람이나 물건 가까이로 가 보자.");
    return;
  }
  const q = activeQuest(s);
  if(currentMap().ancient&&ancientUI.interact(e,q))return;
  if(e.type==='fishingSpot'){fishingMenu(e);return;}
  if(e.type==='fishingBranch') {
    if(!fishingStarted(s)){toast('먼저 마을 기술자에게 낚싯대 이야기를 들어 보자.');return;}
    panel(e.name,`<p>나무 아래에 튼튼한 가지가 떨어져 있다.</p><button id="pick-branch" class="primary full" ${s.inventory.fishingbranch||hasRod(s)?'disabled':''}>줍기</button>`);
    $('#pick-branch').onclick=()=>{if(pickBranch(s)){close();save();hud();feedback('나뭇가지 +1','item');if(rodReady(s))toast(fishingObjective(s));}};return;
  }
  if(e.id==='neo-technician'){fishingTechnician(e,q);return;}
  if(e.type==='roomDoor') { travel(e.to); return; }
  if(e.type==='roomLoot') {
    s.opened.push(e.id);
    const reward=rollRoomReward();
    if(reward.coins){s.coins+=reward.coins;feedback('+'+reward.coins+' 엽전','coin');}
    else if(reward.item){const id=reward.item;s.inventory[id]=(s.inventory[id]||0)+1;feedback(ITEMS[id].name+' +1','item');}
    else toast('비어 있다.');
    save();hud();return;
  }
  if (e.type==='horse') {
    if (s.horseUnlocked) { dialogue('말',['이 말은 이미 길들였다. 말 타기 버튼으로 탈 수 있다.'],'horseFrontIdle'); return; }
    panel('들판의 말', '<p>놀라지 않게 천천히 다가가 보자.</p><button class="primary full" id="tame-horse">천천히 다가가기</button>');
    $('#tame-horse').onclick=()=>dialogue('들판의 말',['말이 잠시 바라본다.','천천히 손을 내밀자 말이 곁에 머문다.'], 'horseFrontIdle',()=>{
      s.horseUnlocked=true; s.horseParked=false; s.horseField=null; save(); hud(); toast('희귀 말 탈것을 얻었다!');
    });
    return;
  }
  if (regionOf(s.map)?.id==='nations' && interactNation(e,q)) return;
  if (e.type === "npc") {
    if (e.request) {
      requestTalk(e.request, e);
      return;
    }
    if (e.id === "nation-elder" && q?.event === "quiz:nation") {
      quiz("nation", e);
      return;
    }
    if (
      q?.id === "paleo-return" &&
      (!['handaxe','flint','fire'].every((id) => s.artifacts.includes(id)) ||
        !s.completedQuests.includes('paleo-cook'))
    ) {
      dialogue(e.name, ["아직 못 찾은 흔적이 있는 것 같구나."], e.art);
      return;
    }
    const turnIn = q?.target === e.id && q.id.endsWith("return");
    const completed = !q && e.id.includes("elder");
    dialogue(
      e.name,
      turnIn
        ? ["오, 탐험을 마쳤구나!"]
        : completed
          ? ["이곳을 자유롭게 둘러보렴."]
          : e.lines,
      e.art,
      () => finishEvent("talk:" + e.id),
    );
  } else if (e.type === "quiz") {
    if(e.quiz==='samhan' && q?.id!=='samhan-quiz') dialogue(e.name,['먼저 세 지역을 둘러보자.'],e.art);
    else quiz(e.quiz,e);
  }
  else if (e.type === "house") {
    panel(
      e.name,
      `<button id="enter-house" class="primary full">들어가기</button>`,
    );
    $("#enter-house").onclick = () => travel(e.to);
  } else if (e.type === "artifact") {
    const found = !s.artifacts.includes(e.artifact);
    artifactDetail(e.artifact, found, () => {
      finishEvent("artifact:" + e.artifact);
      if (e.artifact === "fire") restMenu(e);
      if (e.artifact === 'spindle' && fishingStarted(s) && !hasRod(s)) spindleThread();
    });
  } else if (e.type === "inspect") {
    dialogue(e.name, e.lines, e.art, () => finishEvent("inspect:" + e.id));
  } else if (e.type === "exit") travel(e.to);
  else if (e.type === "gate") eraMenu();
  else if (e.type === "shop") merchant(e);
  else if (e.type === "archive") codex();
  else if (e.type === "rest") {
    const target = Math.ceil(abilities(s).hp * 0.3),
      before = s.hp;
    s.hp = Math.max(s.hp, target);
    s.energy = 20;
    save();
    hud();
    if (s.hp > before) feedback("HP +" + (s.hp - before), "heal");
    restMenu(e);
  } else if (e.type === "berry" || e.type === "loot" || e.type === "chest") {
    if (!harvestResource(s,e)) return;
    const loot = e.loot || (e.type === "berry" ? { berries: 2 } : { food: 1 });
    for (const [id, n] of Object.entries(loot))
      s.inventory[id] = (s.inventory[id] || 0) + n;
    s.tutorials ??= {};
    const firstFood =
      !s.tutorials.food &&
      Object.keys(loot).some((id) => ITEMS[id]?.kind === "food");
    if (firstFood) s.tutorials.food = true;
    save();
    hud();
    for (const [id, n] of Object.entries(loot))
      feedback(ITEMS[id].name + " +" + n, "item");
    if (firstFood) toast("음식은 가방에서 먹을 수 있어.");
  } else if (e.type === "enemy") startBattle(e);
}
function interactNation(e,q) {
  if (e.type==='story') {
    if (e.collect) {
      if (s.opened.includes(e.id)) return true;
      // 마한의 곡식은 멧돼지 전투 후에만 챙길 수 있다.
      if (e.id==='samhan-sack-a' && !s.completedQuests.includes('samhan-boar')) {toast('먼저 멧돼지를 물리치자.');return true;}
      s.opened.push(e.id);
      s.inventory[e.collect]=(s.inventory[e.collect]||0)+1;
      feedback(NATION_ITEM_NAMES[e.collect]+' +1','item',null);
      finishEvent('collect:'+e.collect);
      return true;
    }
    if (q?.target===e.id && q.event.startsWith('quiz:') && NATION_FINAL_QUIZZES[q.event.slice(5)]) {
      if (q.items && Object.entries(q.items).some(([id,n])=>(s.inventory[id]||0)<n)) { toast('아직 준비 물건이 모자라.'); return true; }
      quiz(q.event.slice(5), e);
    } else if (q?.target===e.id && q.event==='inspect:'+e.id) {
      dialogue(e.name,NATION_STORY[e.id]||['살펴보았다.'],e.art,()=>{
        finishEvent('inspect:'+e.id);
      });
    } else if(e.id==='goguryeo-smallhouse')
      dialogue(e.name,[s.completedQuests.includes('goguryeo-build')?'작은 집이 완성되었다.':'재료가 아직 모이지 않았다.'],e.art);
    else if(e.id==='dongye-sign') dialogue(e.name,['낮은 돌을 따라 경계가 이어진다.','남쪽 길로 돌아가자.'],e.art);
    else return false;
    return true;
  }
  if(e.type!=='npc') return false;
  if(q?.target===e.id && q.map===s.map && q.event.startsWith('quiz:') && NATION_FINAL_QUIZZES[q.event.slice(5)]) {
    if (q.items && Object.entries(q.items).some(([id,n])=>(s.inventory[id]||0)<n)) { dialogue(e.name,['아직 준비한 물건이 모자라.'],e.art); return true; }
    quiz(q.event.slice(5),e); return true;
  }
  if(q?.target!==e.id || q.map!==s.map || !q.event.startsWith('talk:')) {
    dialogue(e.name,e.lines,e.art); return true;
  }
  if(q.items && Object.entries(q.items).some(([id,n])=>(s.inventory[id]||0)<n)) {
    dialogue(e.name,['아직 필요한 물건이 모자라.'],e.art); return true;
  }
  if(q.anyFood && (s.inventory.berries||0)<2 && (s.inventory.food||0)<1 && (s.inventory.rawmeat||0)<1) {
    dialogue(e.name,['열매 2개나 고기 1개를 가져와 줘.'],e.art); return true;
  }
  const lines={
    'iron-start':['철로 만든 도구가 필요해.','외곽에서 철 조각 세 개를 찾아 줘.'],
    'iron-smith':['철 조각으로 농기구를 만들었다.','농부에게 가져가 줘.'],
    'iron-deliver':['철제 농기구를 사용하면서 농사가 더 잘되었다.','수확량과 사람이 늘어 부족도 커졌다.'],
    'iron-guard':['외곽의 산적을 물리치고 표적을 살펴봐.'],
    'iron-return':['새 길로 갈 수 있다.','지도에서 발견한 곳으로 다시 이동할 수 있다.'],
    'buyeo-start':['아직 몇 사람이 돌아오지 않았어.','숲과 길을 살펴봐 줄래?'],
    'buyeo-person':['늑대가 사라졌어.','이제 마을로 돌아갈게.'],
    'buyeo-food':['음식 준비가 끝났다.'],
    'buyeo-carrier':['잃어버린 물건을 찾았다. 고마워.'],
    'goguryeo-start':['집을 완성하려는데 재료가 부족해.','목재 3개와 가죽 1개를 구해 줘.'],
    'goguryeo-build':['작은 집을 완성했다.','신랑은 이곳에 살며 자녀가 클 때까지 집안일을 도왔다.'],
    'okjeo-start':['새 살림에 필요한 물건을 찾아 줄래?','장작, 곡식 자루, 그릇이 필요해.'],
    'okjeo-return':['새 살림을 준비했다.','옥저에는 어린 여성이 남성의 집에서 살면서 혼인하는 풍습이 있었다.'],
    'dongye-start':['남의 마을 영역을 침범하지 말고 물건을 전해 줘.','길목에서는 남쪽으로 돌아가면 돼.'],
    'dongye-deliver':['영역을 지켜서 도착했어.'],
    'samhan-start':['마한·변한·진한에서 곡식 자루를 가져와 줘.'],
    'samhan-jinhan':['농사 도구를 찾았구나.','곡식 자루를 가져가.'],
    'samhan-deliver':['세 지역의 곡식이 모였다.','마한·변한·진한을 합쳐 삼한이라고 불렀다.'],
    'nations-return':['철기는 농업과 전투에도 사용되었다.','여러 지역에서 새로운 나라가 성장했다.']
  };
  dialogue(e.name,lines[q.id]||e.lines,e.art,()=>finishEvent(q.event));
  return true;
}
function restMenu(e) {
  const fire = s.artifacts.includes("fire") && e?.art === "campfire";
  s.tutorials ??= {};
  if (fire && !s.tutorials.fire) {
    s.tutorials.fire = true;
    save();
    toast("모닥불에서는 얻은 음식을 익히거나 조리할 수 있어!");
  }
  panel(
    "휴식",
    `<p>HP는 최대 30%까지만 회복된다.<br>기력이 회복되었다.</p>${fire ? '<button id="open-cooking" class="primary full">조리하기</button>' : ""}`,
  );
  if (fire) $("#open-cooking").onclick = () => cookingMenu(e);
}
function cookingMenu(e) {
  if (!s.artifacts.includes("fire") || e?.art !== "campfire") return;
  s.tutorials ??= {};
  const era = regionOf(s.map)?.id;
  const cookingIds = Object.keys(COOKING).filter(
    (id) => id !== "ricecrop" || ["bronze", "gojoseon"].includes(era),
  );
  if (
    ["bronze", "gojoseon"].includes(era) &&
    s.inventory.ricecrop > 0 &&
    !s.tutorials.rice
  ) {
    s.tutorials.rice = true;
    save();
    toast("벼에서 얻은 쌀로 밥을 지을 수 있다.");
  }
  panel(
    "음식 조리",
    cookingIds
      .map((id) => {
        const rice = id === "ricecrop",
          verb = rice ? "밥 짓기" : "굽기";
        return `<div class="item">${itemIcon(id)}<div class="info"><b>${ITEMS[id].name} × ${s.inventory[id]}</b><small>${ITEMS[COOKING[id]].name}</small></div><button data-cook="${id}" data-count="1" ${!s.inventory[id] ? "disabled" : ""}>1개 ${verb}</button><button data-cook="${id}" data-count="all" ${!s.inventory[id] ? "disabled" : ""}>모두 ${verb}</button></div>`;
      })
      .join(""),
    { wide: true },
  );
  document.querySelectorAll("[data-cook]").forEach(
    (b) =>
      (b.onclick = () => {
        const id = b.dataset.cook,
          n = b.dataset.count === "all" ? s.inventory[id] : 1,
          out = cookItem(s, id, n);
        if (!out) return;
        if (["food", "cookedfish"].includes(out)) finishEvent("cook:" + out);
        else save();
        feedback(ITEMS[out].name + " +" + n, "item");
        toast(
          id === "ricecrop"
            ? "벼에서 얻은 쌀로 밥을 지었다."
            : ITEMS[out].name + "를 만들었다.",
        );
        cookingMenu(e);
      }),
  );
}
function quiz(id, npc) {
  const q = ANCIENT_QUIZZES[id] || NATION_FINAL_QUIZZES[id] || QUIZZES[id],
    key = "quiz:" + id;
  if (s.completedQuests.includes(key)) {
    dialogue(npc.name, ["이미 맞힌 문제다."], npc.art);
    return;
  }
  if ((s.cooldowns[key] || 0) > Date.now()) {
    toast("잠시 탐험한 뒤 다시 도전할 수 있다.");
    return;
  }
  panel(
    npc.name,
    `<p>${q.intro ? esc(q.intro).replace("\n", "<br>") + "<br><br>" : ""}${id === "nation" ? "우리나라의 첫 나라가 세워졌다.<br>" : ""}${q.question}</p><div class="quiz-options">${q.options.map((x, i) => `<button data-answer="${i}">${x}</button>`).join("")}</div>`,
  );
  document.querySelectorAll("[data-answer]").forEach(
    (b) =>
      (b.onclick = () => {
        if (+b.dataset.answer !== q.answer) {
          if(ANCIENT_QUIZZES[id]) {
            panel('다시 생각해 보자', '<p>이번 선택은 맞지 않아. 앞에서 살펴본 내용을 떠올려 보자.</p><button id="ancient-quiz-retry" class="primary full">다시 도전하기</button>');
            $('#ancient-quiz-retry').onclick=()=>quiz(id,npc);return;
          }
          s.cooldowns[key] = Date.now() + (NATION_FINAL_QUIZZES[id] ? 30000 : 60000);
          const loss = NATION_FINAL_QUIZZES[id] ? 0 : Math.min(s.coins, q.wrongCoins || 0);
          s.coins -= loss;
          save();
          hud();
          close();
          toast(NATION_FINAL_QUIZZES[id] ? '아직 헷갈리는 것 같다. 마을을 더 살펴보고 30초 뒤 다시 도전하자.' : "틀렸다. 나중에 다시 도전해.");
          if (loss) feedback("-" + loss + " 엽전", "coin", null);
          return;
        }
        s.completedQuests.push(key);
        const xp = s.level < MAX_LEVEL && !q.storyEvent ? q.xp : 0;
        gain(s, xp, q.coins ?? 0);
        save();
        hud();
        close();
        toast("맞았다!");
        rewardFeedback(xp, q.coins ?? 0);
        if (q.storyEvent) finishEvent(q.storyEvent);
        else if (id === "nation") finishEvent("quiz:nation");
      }),
  );
}
$("#interact").onclick = interact;
const ENEMIES = {
  boar: { name: "멧돼지", hp: 38, attack: 9, defense: 1, xp: 13, coins: 0 },
  wolf: { name: "늑대", hp: 50, attack: 11, defense: 2, xp: 18, coins: 0 },
  snake: { name: "뱀", hp: 25, attack: 13, defense: 0, xp: 11, coins: 0 },
  bear: { name: "곰", hp: 87, attack: 17, defense: 3, xp: 29, coins: 0 },
  tiger: { name: "호랑이", hp: 105, attack: 20, defense: 4, xp: 39, coins: 0 },
  bandit: { name: "산적", hp: 74, attack: 14, defense: 3, xp: 26, coins: 0 },
};
function startBattle(e) {
  if (screen || invuln > 0) return;
  s.encounter.until = Date.now() + ENCOUNTER_PROTECTION_MS;
  s.encounter.distance = 0;
  const r = regionOf(s.map),
    boss = e.id === "pre-cave-wolf" || e.id === "go-bandit2",
    eraBoost = ({paleolithic:1,prehistoric:1.12,bronze:1.25,gojoseon:1.35,nations:1.35,ancient:1.35})[r?.id] || 1,
    boost = eraBoost * (boss || e.elite ? 1.3 : 1),
    def = ENEMIES[e.enemy];
  if (!def) return;
  battle = {
    entity: e,
    ...def,
    name:e.eliteName || def.name,
    boss,
    level: ({paleolithic:1,prehistoric:2,bronze:4,gojoseon:5,nations:7,ancient:7})[r?.id] + (boss || e.elite ? 2 : 0),
    maxHp: Math.round(def.hp * boost),
    hp: Math.round(def.hp * boost),
    attack:
      Math.round(def.attack * (['gojoseon','nations','ancient'].includes(r?.id) ? 1.2 : 1)) +
      (boss || e.elite ? 2 : 0),
    xp: def.xp * (boss ? 2 : e.elite ? 1.5 : 1),
    coins: def.coins * (boss ? 2 : 1),
    round: 0,
    busy: false,
    log: boss ? "우두머리와 마주쳤다." : "상대가 다가왔다.",
  };
  battleUI();
}
function battleUI() {
  const b = battle,
    a = abilities(s);
  panel(
    "전투",
    `<div class="battle-scene ${regionOf(s.map)?.id === "gojoseon" ? "bronze-battle" : ""}"><div class="combatant enemy-side" id="enemy-side"><div class="fighter-info"><b>${b.boss ? "우두머리 " : ""}${esc(b.name)} <small>Lv.${b.level}</small></b><div class="battle-hp"><i id="enemy-health"></i></div><small id="enemy-hp"></small></div><div class="battle-sprite ${b.entity.elite ? "elite-enemy" : ""}" id="enemy-sprite">${imageTag(b.entity.enemy)}<span class="hit-spark">✦</span></div></div><div class="combatant player-side" id="player-side"><div class="battle-sprite" id="player-sprite">${imageTag(s.avatar)}<span class="hit-spark">✦</span></div><div class="fighter-info"><b>${esc(s.nickname)} <small>Lv.${s.level}</small></b><div class="battle-hp"><i id="player-health"></i></div><small id="player-hp"></small></div></div></div><p class="battle-log" role="status"></p><div class="battle-actions"><button data-fight="attack" class="primary">공격</button><button data-fight="strong">강한 공격 <small>기력 4 · 성공 65%</small></button><button data-fight="food">음식</button><button data-fight="run">도망</button>${adminMode?'<button id="qa-defeat">패배 화면 시험</button>':''}</div><div id="battle-foods" class="battle-foods" hidden>${FOOD_IDS.filter(
      (id) => s.inventory[id] > 0,
    )
      .map(
        (id) =>
          `<button data-food="${id}">${itemIcon(id)}${ITEMS[id].name} · HP +${ITEMS[id].heal}<small id="count-${id}"></small></button>`,
      )
      .join("")}<button id="food-back">닫기</button></div>`,
    { closable: false, type: "battle", wide: true },
  );
  setAvatarImage($("#player-sprite img"));
  document
    .querySelectorAll("[data-fight]")
    .forEach(
      (el) =>
        (el.onclick = () =>
          el.dataset.fight === "food"
            ? ($("#battle-foods").hidden = false)
            : turn(el.dataset.fight)),
    );
  document.querySelectorAll("[data-food]").forEach(
    (el) =>
      (el.onclick = () => {
        if (!b.busy && s.inventory[el.dataset.food] && s.hp < a.hp) {
          $("#battle-foods").hidden = true;
          chooseFood(el.dataset.food, true);
        }
      }),
  );
  $("#food-back").onclick = () => ($("#battle-foods").hidden = true);
  if(adminMode) $('#qa-defeat').onclick=()=>showDefeat(b);
  updateBattle();
}
function updateBattle() {
  if (!battle || screen !== "battle") return;
  const b = battle,
    a = abilities(s);
  for (const [who, hp, max] of [
    ["enemy", b.hp, b.maxHp],
    ["player", s.hp, a.hp],
  ]) {
    const ratio = Math.max(0, hp) / max;
    $("#" + who + "-health").style.width = ratio * 100 + "%";
    $("#" + who + "-health").classList.toggle("critical", ratio <= 0.25);
    $("#" + who + "-hp").textContent = Math.max(0, hp) + " / " + max;
  }
  $(".battle-log").textContent = b.log;
  document
    .querySelectorAll("[data-fight]")
    .forEach(
      (el) =>
        (el.disabled =
          b.busy ||
          (el.dataset.fight === "strong" && s.energy < 4) ||
          (el.dataset.fight === "run" && b.boss) ||
          (el.dataset.fight === "food" &&
            (!FOOD_IDS.some((id) => s.inventory[id] > 0) || s.hp >= a.hp))),
    );
  for (const id of FOOD_IDS.filter((id) => $("#count-" + id))) {
    $("#count-" + id).textContent = s.inventory[id] + "개";
    document.querySelector('[data-food="' + id + '"]').disabled =
      b.busy || !s.inventory[id] || s.hp >= a.hp;
  }
}
function strike(from, to) {
  music.effect(from === "player" ? "attack" : "damage");
  const attacker = $("#" + from + "-sprite"),
    target = $("#" + to + "-sprite");
  attacker.classList.remove("lunge");
  target.classList.remove("hit");
  void attacker.offsetWidth;
  attacker.classList.add("lunge");
  target.classList.add("hit");
  setTimeout(() => {
    attacker.classList.remove("lunge");
    target.classList.remove("hit");
  }, 500);
}
function showDefeat(b) {
  music.effect("defeat");
  const village = regionOf(s.map).id==='ancient'?ancientDestination(s):regionOf(s.map).village,
    loss = Math.min(100, Math.floor(s.coins * 0.1));
  s.coins -= loss;
  s.hp = Math.ceil(abilities(s).hp * 0.25);
  retireMonster(b.entity, RESPAWN_MS);
  battle = null;
  close();
  screen = "defeat";
  save();
  hud();
  defeat.hidden = false;
  defeat.className = "";
  setAvatarImage($("#defeat-player"));
  $("#defeat-result").innerHTML = "";
  requestAnimationFrame(() => defeat.classList.add("active"));
  setTimeout(() => defeat.classList.add("dark"), 600);
  setTimeout(() => {
    defeat.classList.add("result");
    $("#defeat-result").innerHTML =
      `<h2>전투에서 졌다.</h2><p>${loss} 엽전을 잃었다.</p><button id="return-village" class="primary">마을로 돌아가기</button>`;
    $("#return-village").onclick = () => {
      defeat.hidden = true;
      defeat.className = "";
      screen = "";
      s.map = village;
      s.x = MAPS[village].start.x;
      s.y = MAPS[village].start.y;
      invuln = 3;
      save();
      hud();
    };
    $("#return-village").focus();
  }, 1500);
}
async function turn(action) {
  const b = battle;
  if (!b || b.busy) return;
  const a = abilities(s);
  if (action === "strong" && s.energy < 4) return;
  if (action === "run") {
    if (b.boss) return;
    const e = b.entity;
    if (!e.random) {
      const dx = s.x - e.x,
        dy = s.y - e.y,
        len = Math.hypot(dx, dy) || 1,
        nx = s.x + (dx / len) * 1,
        ny = s.y + (dy / len) * 1;
      if (!blocked(nx, ny)) {
        s.x = nx;
        s.y = ny;
      }
      delete s.cooldowns[e.id];
      s.monsters[e.id] = { x: e.x, y: e.y, waiting: false };
    }
    s.encounter.until = Date.now() + 1000;
    s.encounter.distance = 0;
    invuln = 1.1;
    battle = null;
    close();
    save();
    toast("전투에서 벗어났다.");
    return;
  }
  if (FOOD_IDS.includes(action) && (!s.inventory[action] || s.hp >= a.hp))
    return;
  b.busy = true;
  if (action === "strong") s.energy -= 4;
  else if (action === "attack") s.energy = Math.min(20, s.energy + 1);
  hud();
  if (FOOD_IDS.includes(action)) {
    const n = await eatFood(action);
    b.log = "HP +" + n;
  } else {
    const damage =
      action === "strong" && Math.random() > 0.65
        ? 0
        : Math.max(
            1,
            Math.round(a.attack * (action === "strong" ? 1.9 : 1)) - b.defense,
          );
    b.hp = Math.max(0, b.hp - damage);
    b.log = damage ? "상대 HP -" + damage : "공격이 빗나갔다.";
    strike("player", "enemy");
    if (damage) feedback("상대 HP -" + damage, "damage");
  }
  updateBattle();
  setTimeout(() => {
    if (battle !== b) return;
    if (b.hp <= 0) {
      winBattle();
      return;
    }
    b.round++;
    if (b.round % 3 === 2) {
      b.log = "상대가 힘을 모은다. 다음 공격이 강해진다.";
      b.busy = false;
      updateBattle();
      return;
    }
    const charged = b.round % 3 === 0,
      damage = Math.min(
        s.hp,
        Math.max(1, Math.round(b.attack * (charged ? 1.65 : 1)) - a.defense),
      );
    s.hp -= adminMode && s.adminInvulnerable ? 0 : damage;
    strike("enemy", "player");
    feedback("HP -" + damage, "damage");
    b.log = (charged ? "강한 공격 · " : "") + "HP -" + damage;
    hud();
    updateBattle();
    setTimeout(() => {
      if (battle !== b) return;
      if (s.hp <= 0) showDefeat(b);
      else {
        b.busy = false;
        updateBattle();
      }
    }, 550);
  }, 650);
}
function winBattle() {
  const b = battle,
    r = regionOf(s.map),
    drop = rollDrop(b.entity.enemy);
  Object.assign(drop.items,fishingBoneDrop(s,b.entity.enemy,r?.id));
  if (
    b.entity.id === "go-bandit2" &&
    !s.completedQuests.includes("first-bandit-reward")
  ) {
    drop.coins = 35;
    drop.items = {};
    s.completedQuests.push("first-bandit-reward");
  }
  const up = gain(s, b.xp, drop.coins);
  s.tutorials ??= {};
  const firstFood =
    !s.tutorials.food &&
    Object.keys(drop.items).some((id) => ITEMS[id]?.kind === "food");
  if (firstFood) s.tutorials.food = true;
  for (const [id, n] of Object.entries(drop.items))
    s.inventory[id] = (s.inventory[id] || 0) + n;
  s.stats.wins++;
  if (r?.id==='nations' && ['iron-bandit','buyeo-wolf','goguryeo-wolf','samhan-boar'].includes(b.entity.id) &&
      !s.completedQuests.includes('defeated:'+b.entity.id))
    s.completedQuests.push('defeated:'+b.entity.id);
  retireMonster(b.entity, RESPAWN_MS);
  for (const q of r.requests) {
    const p = s.requests[q.id];
    if (q.kind === "wins" && p?.status === "active") p.count++;
  }
  battle = null;
  invuln = 3;
  save();
  hud();
  close();
  if (r.id==='nations' && activeQuest(s)?.event==='win:'+b.entity.id)
    finishEvent('win:'+b.entity.id);
  rewardFeedback(b.xp, drop.coins);
  for (const [id, n] of Object.entries(drop.items))
    feedback(ITEMS[id].name + " +" + n, "item");
  if (firstFood) toast("음식은 가방에서 먹을 수 있어.");
  else if (up) toast("레벨 " + s.level + "이 되었다.");
}
function retireMonster(e, delay) {
  s.cooldowns[e.id] = Date.now() + delay;
  s.encounter.until = Date.now() + ENCOUNTER_PROTECTION_MS;
  s.encounter.distance = 0;
  if (!e.random) s.monsters[e.id] = { x: e.x, y: e.y, waiting: true };
}
function enemyVisible(e) {
  return !e.hidden || Math.hypot(e.x - s.x, e.y - s.y) < 2.3;
}
function placeMonsters(force = false) {
  let changed = false;
  const m = currentMap();
  for (const e of m.entities.filter((e) => e.type === "enemy")) {
    e.hidden = ["wolf","snake","tiger"].includes(e.enemy) || e.id.endsWith("boar");
    const old = s.monsters[e.id],
      boss = ["pre-cave-wolf", "go-bandit2"].includes(e.id);
    if (boss) continue;
    if (!force && old && !old.waiting) {
      e.x = old.x;
      e.y = old.y;
      continue;
    }
    if ((s.cooldowns[e.id] || 0) > Date.now()) {
      if (old) {
        e.x = old.x;
        e.y = old.y;
      }
      continue;
    }
    if ((e.enemy === "tiger" || (e.enemy === "bear" && m.id === "paleo-deep")) && Math.random() > (e.enemy === "tiger" ? .28 : .4)) {
      s.cooldowns[e.id] = Date.now() + RESPAWN_MS;
      continue;
    }
    const spots = [
      ...(HABITATS[e.enemy] || []),
      ...m.obstacles
        .filter((o) => o.x > 1 && o.x < 22 && o.y > 1 && o.y < 16)
        .map((o) => [o.x, o.y - 0.85]),
    ].filter(
      ([x, y]) =>
        !blocked(x, y) &&
        Math.hypot(x - s.x, y - s.y) > 3 &&
        Math.hypot(x - m.start.x, y - m.start.y) > 2 &&
        (!old || Math.hypot(x - old.x, y - old.y) > 1) &&
        !m.entities.some(
          (o) => o.id !== e.id && Math.hypot(o.x - x, o.y - y) < 2,
        ),
    );
    if (!spots.length) continue;
    const [x, y] = spots[Math.floor(Math.random() * spots.length)];
    e.x = x;
    e.y = y;
    e.hidden = ["wolf","snake","tiger"].includes(e.enemy) || e.id.endsWith("boar");
    s.monsters[e.id] = { x, y, waiting: false };
    changed = true;
  }
  return changed;
}
function checkRandomEncounter(distance) {
  const types = ENCOUNTER_MAPS[s.map];
  if (!types || distance <= 0 || invuln > 0 || Date.now() < s.encounter.until)
    return;
  s.encounter.distance += distance;
  if (s.encounter.distance < ENCOUNTER_STEP_DISTANCE) return;
  s.encounter.distance = 0;
  if (
    currentMap().entities.some((e) => Math.hypot(e.x - s.x, e.y - s.y) < 2) ||
    Math.random() >= (ENCOUNTER_CHANCES[s.map] || ENCOUNTER_CHANCE)
  )
    return;
  const pool = types.flatMap(type => type === "tiger" ? [type] : type === "bear" ? [type,type] : [type,type,type,type,type,type]);
  const enemy = pool[Math.floor(Math.random() * pool.length)];
  startBattle({
    id: "random:" + s.map,
    enemy,
    art: enemy,
    type: "enemy",
    x: s.x,
    y: s.y,
    random: true,
  });
}
function blocked(x, y) {
  let m = currentMap();
  if (x < 1 || x > m.w-2 || y < 1 || y > m.h-2) return true;
  if (m.river && x > 17.5 && x < 19.5 && !(y > 8.25 && y < 9.75)) return true;
  if(inFishingRiver(m,x,y))return true;
  if(m.fishingPond) {
    const p=m.fishingPond,dx=x-p.x,dy=y-p.y;
    const rx=dx*Math.cos(.15)-dy*Math.sin(.15),ry=dx*Math.sin(.15)+dy*Math.cos(.15);
    if((rx/p.rx)**2+(ry/p.ry)**2<1)return true;
  }
  if (
    m.obstacles.some((o) => Math.abs(o.x - x) < 0.65 && Math.abs(o.y - y) < 0.6)
  )
    return true;
  return m.entities.some(
    (e) =>
      (e.solid ||
        e.type === "npc" || e.actor ||
        e.type === "shop" ||
        e.art === "dolmen") &&
      Math.abs(e.x - x) < (e.solid ? 1 : 0.48) &&
      Math.abs(e.y - y) < (e.solid ? 0.65 : 0.42),
  );
}
function marker(e) {
  if(e.type==='ancientStory'||e.type==='ancientHome') {
    if(activeQuest(s)?.target===e.id || (activeQuest(s)?.id==='ancient-y-gather'&&e.gather&&!s.ancient.carry.includes(e.gather)))return '!';
    return '';
  }
  if (e.type === "npc") {
    if(e.id==='neo-technician') {
      if(hasRod(s))return '';
      if(fishingStarted(s))return rodReady(s)?'?':'';
      if(activeQuest(s)?.id==='pre-fishing-start'||s.completedRegions.includes('prehistoric'))return '!';
    }
    const q = activeQuest(s);
    if (q?.target === e.id && q.map === s.map)
      return q.id.endsWith("return") ? "?" : "!";
    if (e.request) {
      const q = requestBy(e.request),
        p = s.requests[e.request];
      if (!p) return "!";
      if (p.status === "active" && requestCount(q, p) >= q.need) return "?";
    }
    return "";
  }
  if (
    ((e.type === "story" && activeQuest(s)?.target===e.id && !s.opened.includes(e.id)) ||
      (e.type === "artifact" && !s.artifacts.includes(e.artifact)) ||
      (e.type === "inspect" && activeQuest(s)?.target === e.id)) &&
    Math.hypot(e.x - s.x, e.y - s.y) < 1.65
  )
    return "조사";
  return "";
}
function targetEntity() {
  const q = activeQuest(s);
  if (s.map === "hq") return MAPS.hq.entities[0];
  if (!q) return null;
  if(q.id==='ancient-y-gather'){const missing=currentMap().entities.find(e=>e.gather&&!s.ancient.carry.includes(e.gather));if(missing)return missing;}
  let targetMap=q.map, targetId=q.target;
  if(q.id==='pre-fishing-rod'&&!rodReady(s)) {
    if(!s.inventory.fishingthread){targetMap='pre-village';targetId='spindle';}
    else if(!s.inventory.fishingbranch){targetMap='pre-forest';targetId='fishing-branch';}
    else if(!s.inventory.boarbone&&!s.inventory.boneneedle){targetMap='pre-forest';targetId='pre-boar1';}
    else if(!s.inventory.boneneedle)return null;
  }
  if (regionOf(s.map)?.id==='nations' && q.event.startsWith('collect:')) {
    const missing=Object.entries(q.items||{}).filter(([id,n])=>(s.inventory[id]||0)<n).map(([id])=>id);
    const options=REGIONS.find(r=>r.id==='nations').maps.flatMap(m=>m.entities.filter(e=>e.collect && missing.includes(e.collect) && !s.opened.includes(e.id)).map(e=>({map:m.id,id:e.id})));
    const choice=options.find(o=>o.map===s.map)||options[0];
    if(choice){targetMap=choice.map;targetId=choice.id;}
  }
  if (targetMap === s.map)
    return currentMap().entities.find((e) => e.id === targetId);
  let todo = [{ id: s.map, first: null }],
    seen = new Set();
  while (todo.length) {
    let n = todo.shift();
    if (seen.has(n.id)) continue;
    seen.add(n.id);
    if (n.id === targetMap) return n.first;
    for (const e of ancientWorld(MAPS[n.id],s).entities.filter(
      (e) => ["exit", "house", "ancientHome"].includes(e.type) && e.to !== "hq",
    ))
      if(MAPS[e.to])todo.push({ id: e.to, first: n.first || e });
  }
  return null;
}
function resize() {
  let d = Math.min(devicePixelRatio || 1, 2);
  canvas.width = innerWidth * d;
  canvas.height = innerHeight * d;
  ctx.setTransform(d, 0, 0, d, 0, 0);
}
addEventListener("resize", resize);
resize();
const SPRITE_BASELINE = {
  boy: 0.0664,
  girl: 0.0742,
  elder: 0.0625,
  farmer: 0.0625,
  pottery: 0.0625,
  goHouse: 0.1328,
  storage: 0.0625,
  palisade: 0.1445,
  goTree: 0.0703,
};
function drawSprite(art, x, y, w, h) {
  const im = images[art];
  if (im?.complete && im.naturalWidth) {
    const profile=FIELD_SPRITES[art];
    if(profile){ctx.drawImage(im,...profile.source,x-w/2,y-h,w,h);return;}
    ctx.drawImage(im, x - w / 2, y - h + h * (SPRITE_BASELINE[art] || 0), w, h);
  }
}
const WALKING_PLAYER_SCALE = 1.06;
function drawPlayer(x, y, w, h) {
  let direction =
    s.direction === "up"
      ? "back"
      : s.direction === "left" || s.direction === "right"
        ? s.direction
        : "front";
  const pose = moving ? "walk-" + ((Math.floor(clock * 7) % 2) + 1) : "idle";
  const custom = avatarSource(s.appearance, direction, pose);
  const stable=avatarSource(s.appearance,direction,'idle');
  const shown=custom.complete&&custom.naturalWidth?custom:stable;
  if(shown.complete&&shown.naturalWidth){ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(shown,x-w/2,y-h,w,h);ctx.restore();}
}
function drawMountedPlayer(x,y) {
  const dir=s.direction==='up'?'back':s.direction==='down'?'front':s.direction;
  const gait=moving?'walk-'+(1+Math.floor(clock*4)%2):'idle';
  const frame=mountedSource(s.appearance,dir,gait);
  const shown=frame.ready?frame:mountedSource(s.appearance,dir,'idle');
  if(shown.ready){const w=70,h=105;ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(shown.canvas,x-w/2,y-h,w,h);ctx.restore();}
  else drawPlayer(x,y,53,53);
}
function roundRect(x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}
function drawObjectShadow(e, x, y, w, h) {
  const tree = ["tree", "pine", "goTree"].includes(e.art),
    building = ["prehut", "goHouse", "shelter", "storage", "palisade", "caveEntrance", "growthHouse", "growthHall", "growthGranary", "growthShed", "growthFestival"].includes(e.art),
    rock = e.art === "rock" || e.art === "dolmen";
  if (!e.actor && !["player", "npc", "quiz", "shop", "enemy", "horse", "parkedHorse", "obstacle", "house", "scenery"].includes(e.type) && !rock && !building) return;
  ctx.fillStyle = tree ? "#263f2b3a" : building ? "#2c3e2d27" : "#263f2b2e";
  const rx = tree ? 11 : building ? w * .22 : rock ? w * .21 : 10;
  const ry = building ? 4 : tree ? 5 : rock ? 5 : 4;
  ctx.beginPath();
  ctx.ellipse(x, y + 2, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}
function playerSafeArea(W, H) {
  if (safeArea && safeArea.w === W && safeArea.h === H) return safeArea;
  const rect = selector => $(selector).getBoundingClientRect();
  const visibleLeft = selector => $(selector).getClientRects().length ? rect(selector).left : W;
  const left = Math.max(rect(".player-panel").right, rect(".story-hud").right,
    rect("#quest").right, rect("#dpad").right) + 18;
  const right = Math.min(rect(".hud-buttons").left, visibleLeft(".mini-wrap"),
    rect("#interact").left) - 18;
  const top = Math.max(rect("header").bottom, rect(".story-hud").bottom,
    rect("#quest").bottom) + 16;
  const bottom = Math.min(rect("#dpad").top, rect("#interact").top) - 16;
  // Small landscape tablets still keep one character-sized clear corridor.
  const l = Math.min(left, W * .42), r = Math.max(right, W * .58);
  const b = Math.max(bottom, H * .48), t = Math.min(top, b - 90);
  return safeArea = {w:W,h:H,left:l,right:r,top:t,bottom:b};
}
function drawNationTerrain(m,T) {
  const poly=(pts,color)=>{ctx.fillStyle=color;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x*T,y*T):ctx.moveTo(x*T,y*T));ctx.closePath();ctx.fill();};
  const field=(x,y,w,h)=>{
    ctx.fillStyle='#aa965f';ctx.fillRect(x*T,y*T,w*T,h*T);
    ctx.fillStyle='#d8c77a';
    for(let row=0;row<h*T;row+=26)ctx.fillRect(x*T+8,y*T+row+9,w*T-16,9);
    ctx.fillStyle='#678b60';for(let i=0;i<w*3;i++)ctx.fillRect(x*T+14+i*18,y*T+14+(i%3)*25,4,7);
  };
  const creek=(pts)=>{
    ctx.strokeStyle='#568f9c';ctx.lineWidth=29;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x*T,y*T):ctx.moveTo(x*T,y*T));ctx.stroke();
    ctx.strokeStyle='#a6c7bc';ctx.lineWidth=5;ctx.stroke();
  };
  const track=(pts,width=38)=>{
    ctx.strokeStyle='#a39571';ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
    ctx.moveTo(pts[0][0]*T,pts[0][1]*T);
    for(let i=1;i<pts.length-1;i++)ctx.quadraticCurveTo(pts[i][0]*T,pts[i][1]*T,(pts[i][0]+pts[i+1][0])*T/2,(pts[i][1]+pts[i+1][1])*T/2);
    ctx.lineTo(pts.at(-1)[0]*T,pts.at(-1)[1]*T);ctx.stroke();
    ctx.strokeStyle='#c0b083';ctx.lineWidth=width*.55;ctx.stroke();
  };
  if(m.nationVisual==='buyeo'){
    if(m.id==='nation-buyeo-village'){
      track([[2,9],[7,9],[11,8.7],[16,9],[21,9]],46);
      track([[11,2],[11,6],[12,9],[11,14]],36);
      poly([[8.7,8],[9.3,6.4],[12,6],[14.9,6.8],[16,8.5],[15.8,11],[13.7,12.6],[10.2,12.5],[8.3,10.9]],'#c8ba8e');
      for(const [x,y] of [[8,7],[16,7],[8,12],[16,12]]){ctx.fillStyle='#8b7555';ctx.fillRect(x*T,y*T,28,8);}
    }else if(m.id==='nation-buyeo-festival'){
      track([[11,15],[10,11],[11,7],[12,3]],42);
      ctx.fillStyle='#c6b58d';ctx.beginPath();ctx.ellipse(11*T,8*T,4*T,3*T,0,0,7);ctx.fill();
    }
  }
  if(m.nationVisual==='goguryeo'){
    poly([[2,2],[6,2],[8,6],[4,8],[1,6]],'#788e7299');
    poly([[16,3],[21,2],[23,6],[19,8],[16,6]],'#748b7299');
    poly([[3,13],[6,11],[9,13],[8,16],[2,16]],'#758d7099');
    if(m.id==='nation-goguryeo-road'||m.id==='nation-goguryeo-village')track([[2,9],[5,10],[8,8],[11,9],[14,7],[17,9],[21,9]],34);
    if(m.id==='nation-goguryeo-homes'){
      track([[2,9],[8,9],[14,10],[15,7],[15,4]],31);
      ctx.fillStyle='#9b8660';ctx.fillRect(13*T,5*T,4*T,1*T);
    }
  }
  if(m.nationVisual==='okjeo'){
    if(m.id==='nation-okjeo-village'){
      creek([[22,1],[21.7,5],[22,9],[21.5,13],[22,17]]);
      track([[2,9],[7,9],[11,10],[16,9],[20,9]],29);
      track([[11,10],[11,15]],24);
      for(const [x,y] of [[5,7],[8,8],[13,6],[15,12]]){ctx.fillStyle='#b8a783';ctx.fillRect(x*T,y*T,25,17);}
    }
    if(m.id==='nation-okjeo-river')creek([[3,1],[5,5],[4,9],[6,13],[7,17]]);
  }
  if(m.nationVisual==='dongye'){
    if(m.id==='nation-dongye-village'){
      track([[2,9],[9,9],[15,10],[21,9]],30);
      // The outer path narrows into a quiet village edge; no palisade wall.
      track([[17,4],[18.5,6],[19,9],[18.4,12]],19);
    }
    if(m.id==='nation-dongye-border'){
      track([[2,12],[7,12],[12,12.6],[17,12],[21,9]],38);
      // Scattered low stones, earth and worn grass show the narrow edge without a wall.
      for(const y of [5,5.75,6.4,7.1,7.8,8.45,9.2,9.8,10.3]){
        const x=dongyeBoundaryX(y)+.16,px=x*T,py=y*T;
        ctx.fillStyle='#a99b76';ctx.beginPath();ctx.ellipse(px-4,py+6,12,4,-.3,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#838574';ctx.beginPath();ctx.ellipse(px,py,8,5,-.25,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#d0cbb4';ctx.fillRect(px-3,py-3,5,2);
      }
      ctx.fillStyle='#6e704c';for(const [x,y] of [[10.3,4.5],[12.4,5.4],[10.1,8.8],[13.3,10.5]])ctx.fillRect(x*T,y*T,17,4);
    }
  }
  if(m.nationVisual==='samhan'){
    if(m.id==='nation-samhan-field'||m.id==='nation-samhan-mahan'){
      field(3.3,3.4,5.4,3.2);field(15,11.2,5.5,2.8);
      creek([[1,14],[5,13.5],[10,14.5],[15,14],[23,15.3]]);
    }else if(m.id==='nation-samhan-byeonhan')field(14,3.6,5,2.4);
    else if(m.id==='nation-samhan-jinhan')field(4,10.5,5,2.8);
    track([[2,9],[8,9],[12,8],[17,9],[21,9]],29);
  }
  if(m.nationVisual==='iron'&&m.id==='nation-iron-field')field(4,4,5,3);
}
function draw(dt = 0) {
  const W = innerWidth,
    H = innerHeight,
    m = currentMap(),
    T = 64;
  ctx.imageSmoothingEnabled = false;
  const safe = playing ? playerSafeArea(W,H) : {left:0,right:W,top:0,bottom:H};
  cam = fieldCamera.update({map:m,width:W,height:H,x:s.x,y:s.y,
    direction:playing && !screen ? cameraDirection : {x:0,y:0},dt,playing,safe});
  const ground = m.ground || (m.theme === 'room' ? (m.roomPalette?.border || '#514337') : m.theme === "cave" || m.theme === "interior" ? "#8d907d"
    : ["paleo-deep","bronze-grove","go-outskirts"].includes(m.id) ? "#748664"
    : m.id.startsWith("paleo-") ? "#a89e77"
    : m.id.startsWith('nation-buyeo') ? '#a5b482'
    : m.id.startsWith('nation-goguryeo') ? '#869d7c'
    : m.id.startsWith('nation-okjeo') ? '#a4bdad'
    : m.id.startsWith('nation-dongye') ? '#96a778'
    : m.id.startsWith('nation-samhan') ? '#c7b982'
    : m.id.startsWith('nation-iron') ? '#b8ac83'
    : m.id.startsWith("bronze-") || m.id.startsWith("go-") ? "#c2b981" : "#8fb878");
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-cam.x, -cam.y);
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, m.w*T, m.h*T);
  if(m.theme==='room'){
    ctx.fillStyle=m.roomPalette?.floor?.[0] || '#b69a71';ctx.fillRect(T,1.2*T,(m.w-2)*T,(m.h-2.2)*T);
  }
  const cave = m.theme === "cave" || m.theme === "interior" || m.theme === 'room',
    bronze = m.id.startsWith("go-") || m.id.startsWith("bronze-") || m.id.startsWith('nation-'),
    natural =
      m.ancient || m.id.startsWith("pre-") ||
      m.id.startsWith("paleo-") ||
      ["neo-river","bronze-outskirts","bronze-grove","go-outskirts"].includes(m.id) || m.id.startsWith('nation-');
  for (let y = 0; y < m.h; y++)
    for (let x = 0; x < m.w; x++) {
      if(m.theme==='room' && (x<1 || x>=m.w-1 || y<2 || y>=m.h-1))continue;
      let hash = (x * 17 + y * 31) % 11;
      ctx.fillStyle = m.ground&&m.theme!=='room' ? m.ground : m.theme==='room' ? (m.roomPalette?.floor || ['#b69a71','#b99e76','#b19870'])[hash%3] : cave
        ? ["#92947f", "#8b8f7b", "#888c78"][hash % 3]
        : ["paleo-deep","bronze-grove","go-outskirts"].includes(m.id)
          ? ["#687f61", "#708863", "#778b63", "#827f5d"][hash % 4]
        : m.id === "neo-river"
          ? ["#88b67b", "#8ebe80", "#91bb7d"][hash % 3]
        : bronze
          ? ["#c1b781", "#c4ba83", "#bdb47c"][hash % 3]
          : m.id.startsWith("paleo-")
            ? ["#a99d75", "#a49b70", "#a8a078"][hash % 3]
            : ["#8db775", "#90b977", "#8ab272"][hash % 3];
      if(hash===1 || hash===8){
        ctx.globalAlpha=.13;
        ctx.fillRect(x*T+12+(hash%3)*9,y*T+21,18,7);
        ctx.globalAlpha=1;
      }
      if (!cave && hash < 6) {
        ctx.fillStyle = "#729f6155";
        ctx.fillRect(x * T + 13, y * T + 30, 3, 7);
        ctx.fillRect(x * T + 17, y * T + 27, 3, 10);
        if (hash === 2) {
          ctx.fillStyle = "#e7dc8d";
          ctx.fillRect(x * T + 42, y * T + 49, 4, 4);
        }
      }
    }
  if(m.theme==='room'){
    ctx.fillStyle='#604635';ctx.fillRect(0,0,m.w*T,1.2*T);ctx.fillRect(0,0,1*T,m.h*T);ctx.fillRect((m.w-1)*T,0,T,m.h*T);
    ctx.fillStyle='#896849';ctx.fillRect(T,1.1*T,(m.w-2)*T,10);ctx.fillRect(T,(m.h-1)*T,(m.w-2)*T,9);
    ctx.strokeStyle='#9b7b55';ctx.lineWidth=2;for(let y=2;y<m.h-1;y++){
      ctx.beginPath();ctx.moveTo(T,y*T);ctx.lineTo((m.w-1)*T,y*T);ctx.stroke();
    }
  }
  if (!natural && !cave && !["go-field","go-dolmen","bronze-hill"].includes(m.id)) {
    ctx.fillStyle = cave ? "#b4ad94" : "#c8b487";
    ctx.fillRect(1 * T, 8.4 * T, 22 * T, 1.3 * T);
    ctx.fillRect(10.5 * T, 2 * T, 1.5 * T, 14 * T);
    ctx.fillStyle = cave ? "#a49e87" : "#c8bd89";
    for (let i = 0; i < 60; i++) {
      let x = 70 + ((i * 137) % 1400),
        y = 8.4 * T + ((i * 19) % 80);
      ctx.fillRect(x, y, 5, 3);
    }
  }
  if(m.ancient&&m.theme!=='room'){
    if(m.country){const c=m.country;ctx.fillStyle=c==='goguryeo'?'#a6997c':c==='baekje'?'#ccbb93':'#bea775';ctx.beginPath();ctx.ellipse(6.8*T,8.5*T,c==='baekje'?3*T:2.7*T,1.8*T,0,0,Math.PI*2);ctx.fill();if(c==='goguryeo')drawSprite('rock',4*T,9*T,58,48);if(c==='silla'){ctx.fillStyle='#758252';for(const x of [4.5,5,9])ctx.fillRect(x*T,9.7*T,5,14);}}
    ctx.strokeStyle='#bca57c';ctx.lineWidth=50;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(3*T,9*T);ctx.lineTo(10*T,9*T);ctx.lineTo(13*T,11*T);ctx.lineTo(20*T,9*T);ctx.stroke();
    ctx.beginPath();ctx.moveTo(12*T,3*T);ctx.lineTo(10*T,9*T);ctx.lineTo(11*T,15*T);ctx.stroke();
  }
  if (m.river) {
    ctx.fillStyle = "#54aab2";
    ctx.fillRect(17.5 * T, 0, 2 * T, m.h * T);
    ctx.fillStyle = "#8bcbd0";
    for (let i = 0; i < 32; i++) {
      ctx.fillRect(
        17.7 * T + (i % 3) * 32,
        (i * 37 + clock * 10) % (m.h * T),
        24,
        3,
      );
    }
    ctx.fillStyle = "#ab8a58";
    ctx.fillRect(17.3 * T, 8.25 * T, 2.4 * T, 1.5 * T);
    ctx.fillStyle = "#cfaf76";
    for (let x = 17.3 * T; x < 19.7 * T; x += 13)
      ctx.fillRect(x, 8.28 * T, 9, 1.45 * T);
  }
  if (m.id === "pre-forest") {
    ctx.fillStyle = "#ae945f";
    ctx.fillRect(16.5 * T, 11.5 * T, 3.5 * T, 1.6 * T);
    ctx.fillStyle = "#d6c772";
    for (let j = 0; j < 3; j++)
      for (let i = 0; i < 7; i++)
        ctx.fillRect((16.7 + i * 0.45) * T, (11.65 + j * 0.4) * T, 4, 13);
  }
  if (!m.nationVisual && (m.theme === "field" || m.theme === "ancient" || m.theme === "bronze")) {
    ctx.fillStyle = "#9d8050";
    ctx.fillRect(4 * T, 3.5 * T, 5 * T, 3 * T);
    ctx.fillRect(15 * T, 11.5 * T, 5 * T, 2 * T);
    ctx.fillStyle = "#c8bf5c";
    for (let yy = 0; yy < 4; yy++)
      for (let xx = 0; xx < 9; xx++)
        ctx.fillRect((4.2 + xx * 0.5) * T, (3.8 + yy * 0.65) * T, 6, 20);
  }
  if (m.id==='nation-iron-field' && (s.progress.nations||0)<4) {
    ctx.fillStyle='#ab9770';
    ctx.fillRect(4*T,3.5*T,5*T,3*T);
    ctx.fillRect(15*T,11.5*T,5*T,2*T);
  }
  if (m.nationVisual) drawNationTerrain(m,T);
  if(m.fishingPond) {
    const p=m.fishingPond;
    ctx.fillStyle='#799981';ctx.beginPath();ctx.ellipse(p.x*T,p.y*T,(p.rx+.22)*T,(p.ry+.2)*T,-.15,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#639eaa';ctx.beginPath();ctx.ellipse(p.x*T,p.y*T,p.rx*T,p.ry*T,-.15,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#aacbca';ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse((p.x-.3+i*.2)*T,(p.y-.6+i*.55)*T,.5*T,.06*T,0,0,Math.PI*2);ctx.stroke();}
  }
  drawFishingRiver(ctx,m,T,clock);
  if (["deep-wild","deep-bronze","go-wild"].includes(m.theme)) {
    // Broken earth and low brush make the remote hunting grounds distinct from a village road.
    for (let i=0;i<38;i++) {
      const x=2+((i*47+Math.floor(i/4)*5)%20), y=2+((i*29+Math.floor(i/3)*7)%14);
      ctx.fillStyle=i%3 ? "#4e744047" : "#aa935b70";
      ctx.fillRect(x*T+10,y*T+23,18+(i%4)*8,4+(i%3)*4);
    }
  }
  if (m.theme === "hq") {
    ctx.fillStyle = "#c8cda5";
    ctx.beginPath();
    ctx.ellipse(12 * T, 9 * T, 5.5 * T, 4 * T, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#a4b387";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  const target = playing ? targetEntity() : null,
    labels = [];
  let objects = m.obstacles
    .map((o) => ({ ...o, type: "obstacle" }))
    .concat(
      m.entities.filter(
        (e) =>
          !(e.type==='story' && e.collect && s.opened.includes(e.id)) &&
          !(e.type==='horse' && (s.horseUnlocked || s.horseField?.map!==s.map || s.horseField?.id!==e.id || s.horseField.until<Date.now())) &&
          !(
            e.type === "enemy" &&
            ((s.cooldowns[e.id] || 0) > Date.now() || !enemyVisible(e))
          ),
      ),
    )
    .concat([{ id: "player", x: s.x, y: s.y, type: "player", art: s.avatar }]);
  if (m.id==='nation-goguryeo-homes' && s.completedQuests.includes('goguryeo-build')) {
    const house=objects.find(o=>o.id==='goguryeo-smallhouse');if(house)house.art='growthHouse';
  }
  if (m.id==='nation-okjeo-homes' && s.completedQuests.includes('okjeo-return')) {
    const house=objects.find(o=>o.id==='okjeo-home');if(house)house.art='growthHouse';
  }
  if (m.id==='nation-buyeo-village' && s.completedQuests.includes('buyeo-carrier'))
    objects.push({id:'buyeo-returned',x:14,y:5,type:'npc',name:'돌아온 사람',art:'farmer'});
  if (m.id==='nation-samhan-field' && !s.completedQuests.includes('samhan-deliver'))
    objects=objects.filter(o=>o.id!=='samhan-grainstack');
  objects.sort((a, b) => a.y - b.y);
  for (const e of objects) {
    let x = e.x * T,
      y = e.y * T;
    if(e.type==='fishingSpot'&&e.float) {
      const fx=e.float.x*T,fy=e.float.y*T;
      ctx.strokeStyle='#b0d4ca';ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(fx,fy,17+Math.sin(clock*2)*3,5,0,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#e5dfc0';ctx.fillRect(fx-2,fy-20,4,14);
      ctx.fillStyle='#af6556';ctx.fillRect(fx-3,fy-12,6,11);
      labels.push({x,y,label:e.name});
      continue;
    }
    const isPlayer = e.type === "player";
    let w =
        isPlayer || ["npc", "quiz", "shop", "enemy"].includes(e.type) ? 58 : 64,
      h = isPlayer || ["npc", "shop", "enemy"].includes(e.type) ? 72 : 66;
    if(e.type==='ancientStory'&&e.actor){w=58;h=72;}
    if (e.type === 'horse' || e.type==='parkedHorse') { w=88; h=88; }
    if(e.type==='horseStable'){w=64;h=48;}
    if (e.type==='roomLoot') {w=52;h=54;}
    if (e.type==='roomProp') {w=78;h=66;}
    if (e.type==='roomDoor') {w=55;h=57;}
    if (e.id === 'dongye-sign') { w=30; h=25; }
    if (e.type === "obstacle") {
      w = e.art === "rock" ? 78 : 110;
      h = e.art === "rock" ? 65 : 138;
    }
    if (e.type === "scenery" || e.type === "house" || e.type==='ancientHome') {
      w = 170;
      h = 145;
    }
    if (e.art==='growthHall' || e.art==='growthFestival') { w=195; h=142; }
    if (e.art==='growthGranary' || e.art==='growthShed' || e.art==='growthFish') { w=122; h=106; }
    if (['iron-workshop','goguryeo-mainhouse','goguryeo-smallhouse','goguryeo-family','okjeo-home'].includes(e.id)) {
      w=150;h=125;
    }
    if (m.id==='nation-goguryeo-homes') {
      if (e.id==='goguryeo-family') { w=215;h=175; }
      if (e.id==='goguryeo-smallhouse') { w=105;h=90; }
    }
    if (e.art === "portal") {
      w = 112;
      h = 123;
    }
    if (e.art === "dolmen") {
      w = 155;
      h = 115;
    }
    if (e.type === "artifact" && e.art !== "dolmen") {
      w = 44;
      h = 49;
    }
    if (e.type === "berry") {
      w = 70;
      h = 66;
    }
    const fieldSize=fieldSpriteSize(e.art,e.elite);
    if(fieldSize){w=fieldSize.w;h=fieldSize.h;}
    else if (e.type === "enemy" && e.elite) { w *= 1.13; h *= 1.13; }
    if (x + w < cam.x || x - w > cam.x + cam.viewW || y < cam.y || y - h > cam.y + cam.viewH)
      continue;
    drawObjectShadow(e, x, y, w, h);
    if (isPlayer) {
      ctx.strokeStyle = "#fff7c4";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(x, y + 4, 25, 11, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (e.type === "artifact") {
      ctx.fillStyle = s.artifacts.includes(e.id) ? "#79a786" : "#eec94c";
      ctx.beginPath();
      ctx.arc(x, y - 22, 29, 0, Math.PI * 2);
      ctx.globalAlpha = 0.23;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (['berry','loot','chest'].includes(e.type) && !resourceReady(s,e)) {
      ctx.globalAlpha = .5;
      ctx.filter = 'grayscale(1)';
    }
    const bob = isPlayer && moving ? Math.sin(clock * 17) * 2 : 0;
    if (isPlayer) s.mounted && canMount() ? drawMountedPlayer(x,y+bob) : drawPlayer(x, y + bob, w * WALKING_PLAYER_SCALE, h * WALKING_PLAYER_SCALE);
    else {
      if (e.type === "enemy" && e.elite) ctx.filter = "sepia(.28) saturate(1.2)";
      drawSprite(e.art, x, y + bob, w, h);
      ctx.filter = "none";
    }
    if (e.type === "shop") {
      drawSprite("chest", x + 27, y + 4, 34, 34);
      drawSprite("berries", x - 25, y + 4, 28, 28);
    }
    ctx.globalAlpha = 1;
    if(e.banner){ctx.fillStyle=ANCIENT_COUNTRIES[e.banner].color;ctx.fillRect(x+25,y-h+15,20,15);ctx.fillStyle='#77583e';ctx.fillRect(x+24,y-h+12,3,40);}
    const mark = marker(e);
    if (mark) {
      const dy = Math.sin(clock * 3) * 3;
      roundRect(
        x - (mark === "조사" ? 25 : 14),
        y - h - 32 + dy,
        mark === "조사" ? 50 : 28,
        27,
        7,
        "#f4cd59",
      );
      ctx.fillStyle = "#3f583c";
      ctx.font = "bold 21px system-ui";
      ctx.textAlign = "center";
      ctx.font = "bold 17px system-ui";
      ctx.fillText(mark, x, y - h - 11 + dy);
    }
    if (
      [
        "npc",
        "ancientStory",
        "ancientHome",
        "ancientStorage",
        "ancientDisplay",
        "quiz",
        "horse",
        "house",
        "exit",
        "gate",
        "shop",
        "archive",
        "rest",
      ].includes(e.type) ||
      (isPlayer && playing)
    ) {
      labels.push({ x, y, label: isPlayer ? s.nickname : e.name, isPlayer });
    }
  }
  for (const { x, y, label, isPlayer } of labels) {
    ctx.font = "600 12px system-ui";
    let tw = ctx.measureText(label).width;
    roundRect(
      x - tw / 2 - 9,
      y + 13,
      tw + 18,
      24,
      6,
      isPlayer ? "#fff9de" : "#244a38d9",
    );
    ctx.fillStyle = isPlayer ? "#3d623d" : "#fff6d9";
    ctx.textAlign = "center";
    ctx.fillText(label, x, y + 29);
  }
  if (playing && !screen) {
    let e = nearby();
    if (e && e.type !== "enemy") {
      ctx.strokeStyle = "#fffbd9";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.ellipse(e.x * T, e.y * T + 5, 35, 16, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    $("#interact").firstChild.textContent = e
      ? e.type === 'fishingSpot' ? fishingCooldown(s,s.map,e.id)>0 ? '낚시터 쉬는 중 ' : '낚시하기 '
      : e.type === 'fishingBranch' ? '줍기 '
      : e.type === "exit"
        ? "이동하기 "
        : e.type === "npc" || e.type === "shop"
          ? "말하기 "
          : "조사하기 "
      : "조사 / 말하기 ";
  }
  ctx.restore();
  if (playing) drawMini(m, target);
}
function drawMini(m, target) {
  mini.fillStyle = m.theme==='room' ? '#b69a71' : m.theme === "cave" ? "#919782" : "#95b47c";
  mini.fillRect(0, 0, 144, 108);
  if(m.theme==='room'){
    mini.fillStyle='#604635';mini.fillRect(0,0,144,10);mini.fillRect(0,0,10,108);mini.fillRect(134,0,10,108);
  }
  mini.fillStyle = "#d6cba2";
  if (m.theme!=='room' && !m.id.startsWith("pre-") && !m.id.startsWith("paleo-") && !["neo-river","go-outskirts","bronze-outskirts","bronze-grove","go-field","go-dolmen","bronze-hill"].includes(m.id)) {
    mini.fillRect(6, 50, 132, 10);
    mini.fillRect(64, 12, 9, 84);
  }
  mini.fillStyle = "#587b53";
  for (const o of m.obstacles) mini.fillRect(o.x * 6 - 2, o.y * 6 - 2, 5, 5);
  if (m.river) {
    mini.fillStyle = "#68b6c3";
    mini.fillRect(105, 0, 12, 108);
    mini.fillStyle = "#d6cba2";
    mini.fillRect(103, 50, 16, 10);
  }
  if (target) {
    mini.fillStyle = "#f7cd58";
    mini.fillRect(target.x * 6 - 3, target.y * 6 - 3, 6, 6);
  }
  mini.fillStyle = "#fff";
  mini.beginPath();
  mini.arc(s.x * 6, s.y * 6, 3, 0, 7);
  mini.fill();
}
function tick(t) {
  music.mode(playing ? (screen === "battle" ? "battle" : "exploration") : null);
  let dt = Math.min((t - last) / 1000, 0.04) || 0;
  last = t;
  clock += dt;
  invuln = Math.max(0, invuln - dt);
  moving = false;
  cameraDirection = {x:0,y:0};
  if (playing && !screen) {
    spawnClock += dt;
    if (spawnClock > 1) {
      const refreshed = refreshResources(s, currentMap());
      if (placeMonsters() || refreshed) save();
      spawnClock = 0;
    }
    const oldX = s.x,
      oldY = s.y;
    let dx = keys.has("left") ? -1 : keys.has("right") ? 1 : 0,
      dy = keys.has("up") ? -1 : keys.has("down") ? 1 : 0;
    if (dx || dy) {
      moving = true;
      s.direction = dx < 0 ? "left" : dx > 0 ? "right" : dy < 0 ? "up" : "down";
      let speed = ((s.mounted && canMount() ? 5.6 : 3.5) * (adminMode && s.adminSpeed ? 1.5 : 1) * dt) / (dx && dy ? Math.SQRT2 : 1);
      if (!blocked(s.x + dx * speed, s.y)) s.x += dx * speed;
      if (!blocked(s.x, s.y + dy * speed)) s.y += dy * speed;
      cameraDirection = {x:s.x-oldX,y:s.y-oldY};
      saveClock += dt;
      if (saveClock > 3) {
        save();
        saveClock = 0;
      }
    }
    checkRandomEncounter(Math.hypot(s.x - oldX, s.y - oldY));
    if (!screen && invuln <= 0 && (dx || dy) && s.map==='nation-dongye-border' &&
        (s.progress.nations||0)===25 && crossedDongyeBoundary(oldX,oldY,s.x,s.y)) {
      const loss=Math.min(100,Math.floor(s.coins*.1));
      s.coins-=loss;s.x=3;s.y=12;invuln=2;save();hud();
      dialogue('경계 지킴이',['다른 마을의 영역을 침범했다.','보상해야 한다.'],'elder',()=>{
        if(loss)feedback('-'+loss+' 엽전','coin',null);
      });
    }
    if (!screen && invuln <= 0) {
      let e = currentMap().entities.find(
        (e) =>
          e.type === "enemy" &&
          (s.cooldowns[e.id] || 0) <= Date.now() &&
          Math.hypot(e.x - s.x, e.y - s.y) < 0.65,
      );
      if (e) startBattle(e);
    }
  }
  draw(dt);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
const keyMap = {
  ArrowUp: "up",
  w: "up",
  W: "up",
  ArrowDown: "down",
  s: "down",
  S: "down",
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right",
};
addEventListener("keydown", (e) => {
  if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
  if (keyMap[e.key] && playing && !screen) {
    e.preventDefault();
    keys.add(keyMap[e.key]);
  }
  if ((e.key === " " || e.key === "Enter") && playing && !screen) {
    e.preventDefault();
    if (!e.repeat) interact();
  }
  if (e.key === "Escape" && playing) {
    if (["battle", "dialogue", "intro", "tutorial", "defeat", "eating"].includes(screen))
      return;
    screen ? close() : menu();
  }
  if (e.key === "Tab" && screen) {
    const f = [
      ...overlay.querySelectorAll("button:not(:disabled),input,a,summary"),
    ];
    if (!f.length) return;
    const first = f[0],
      last = f.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});
addEventListener("keyup", (e) => keys.delete(keyMap[e.key]));
addEventListener("blur", () => {
  keys.clear();
  save();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    keys.clear();
    save();
  }
});
addEventListener("pagehide", save);
document.querySelectorAll("[data-dir]").forEach((b) => {
  b.onpointerdown = (e) => {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    if (!screen) keys.add(b.dataset.dir);
  };
  b.onpointerup =
    b.onpointercancel =
    b.onlostpointercapture =
      () => keys.delete(b.dataset.dir);
});
