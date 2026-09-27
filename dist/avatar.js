export const HAIR = ["짧은 머리", "뾰족뾰족 머리", "뒤로 넘긴 머리", "길게 묶은 머리", "양갈래 머리", "둥근 단발머리"];
export const EYES = ["밝은 눈", "또렷한 눈", "초롱한 눈", "차분한 눈"];
export const SKIN = ["밝은색", "중간색", "갈색", "짙은색"];
export const HAIR_COLOR = ["검은색", "갈색", "금빛", "붉은 갈색"];
export const OUTFIT = ["기본복", "가벼운 여행복", "따뜻한 여행복", "활동복", "태권도복", "축구 유니폼풍"];
export const defaultAppearance = () => ({ hair: 0, eyes: 0, skin: 1, hairColor: 1, outfit: 0 });
export function validAppearance(v) {
  if (!v || typeof v !== "object") return defaultAppearance();
  const a = {};
  for (const [key, length] of [["hair", 6], ["eyes", 4], ["skin", 4], ["hairColor", 4], ["outfit", 6]])
    a[key] = Number.isInteger(v[key]) && v[key] >= 0 && v[key] < length ? v[key] : defaultAppearance()[key];
  return a;
}

// All renderers share these aligned PNG layers, including every walking frame.
const cache = new Map();
const atlases = Object.fromEntries(['bodies','heads','eyes','hair-rear','hair-front'].map(name=>{
  const img=new Image(); img.src=new URL(`./assets/player/custom/${name}.png?v=25.2`,import.meta.url).href;
  return [name,img];
}));
const ready=Promise.all(Object.values(atlases).map(img=>new Promise((resolve,reject)=>{
  if(img.complete&&img.naturalWidth)return resolve();
  img.onload=resolve; img.onerror=()=>reject(new Error('캐릭터 그림을 불러오지 못했다.'));
})));
ready.catch(()=>{});
export function avatarSource(appearance,direction='front',pose='idle'){
  const a=validAppearance(appearance),d=direction==='back'?2:['left','right'].includes(direction)?1:0;
  const p=pose==='walk-1'?1:pose==='walk-2'?2:0;
  const id=[a.hair,a.eyes,a.skin,a.hairColor,a.outfit,d,p,direction==='right'].join('-');
  if(cache.has(id))return cache.get(id);
  const result=new Image();cache.set(id,result);
  const render=()=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
    const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.scale(3.2,3.2);
    if(direction==='right'){c.translate(80,0);c.scale(-1,1);}
    // One transform moves every layer together. Feet retain the same baseline.
    if(p)c.translate(0,-1);
    const part=(name,index)=>{const tile=atlases[name].naturalWidth/12;c.drawImage(atlases[name],index%12*tile,Math.floor(index/12)*tile,tile,tile,0,0,80,80);};
    const hair=a.hair*12+a.hairColor*3+d;
    part('hair-rear',hair);
    part('bodies',a.outfit*36+a.skin*9+d*3+p);
    part('heads',a.hair*12+a.skin*3+d);
    part('eyes',a.eyes*3+d);
    part('hair-front',hair);
    result.src=canvas.toDataURL('image/png');
  };
  if(Object.values(atlases).every(i=>i.complete&&i.naturalWidth))render();else ready.then(render).catch(()=>{});
  return result;
}
