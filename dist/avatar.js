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
const mountedCache = new Map();
const atlases = Object.fromEntries(['bodies','heads','eyes','hair-rear','hair-front'].map(name=>{
  const img=new Image(); img.src=new URL(`./assets/player/custom/${name}.png?v=31.1`,import.meta.url).href;
  return [name,img];
}));
const ready=Promise.all(Object.values(atlases).map(img=>new Promise((resolve,reject)=>{
  if(img.complete&&img.naturalWidth)return resolve();
  img.onload=resolve; img.onerror=()=>reject(new Error('캐릭터 그림을 불러오지 못했다.'));
})));
ready.catch(()=>{});
const horseFrames=Object.fromEntries(['front','back','left','right'].flatMap(direction=>['idle','walk'].map(pose=>{
  const img=new Image();
  img.src=new URL(`./assets/maps/horse-${direction}-${pose}.png?v=31.1`,import.meta.url).href;
  return [`${direction}-${pose}`,img];
})));
const imageReady=img=>img.complete&&img.naturalWidth ? Promise.resolve(img) : new Promise((resolve,reject)=>{
  img.addEventListener('load',()=>resolve(img),{once:true});
  img.addEventListener('error',()=>reject(new Error('탑승 그림을 불러오지 못했다.')),{once:true});
});
export const avatarReady=ready;
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

// Each final frame is a single cached canvas, assembled from the same five
// customization layers as the walking character. The horse never supplies a rider.
export function mountedSource(appearance,direction='front',pose='idle'){
  const a=validAppearance(appearance);
  const id=[a.hair,a.eyes,a.skin,a.hairColor,a.outfit,direction,pose].join('-');
  if(mountedCache.has(id))return mountedCache.get(id);
  const canvas=document.createElement('canvas');canvas.width=320;canvas.height=direction==='front'?450:400;
  const rider=avatarSource(a,direction,pose);
  const horse=horseFrames[`${direction}-${pose==='idle'?'idle':'walk'}`];
  const promise=Promise.all([imageReady(rider),imageReady(horse)]).then(()=>{
    const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    const horseY=direction==='front'?100:50;
    c.drawImage(horse,0,horseY,320,320);
    const side=direction==='left'||direction==='right';
    if(side){
      const center=direction==='left'?162:155;
      // Pelvis rests on the saddle; the near thigh turns toward the stirrup.
      c.save();c.translate(center+(direction==='left'?9:-9),189);c.rotate(direction==='left'?0.47:-0.47);
      c.drawImage(rider,126,130,35,80,-17,0,34,69);c.restore();
      c.drawImage(rider,80,18,100,127,center-56,54,112,143);
      c.save();c.translate(center,190);c.rotate(direction==='left'?0.43:-0.43);
      c.drawImage(rider,98,130,34,80,-17,0,35,69);c.restore();
      const sign=direction==='left'?-1:1;
      c.strokeStyle='#422c21';c.lineWidth=2;c.lineCap='round';
      c.beginPath();c.moveTo(center+sign*18,170);c.quadraticCurveTo(center+sign*50,176,center+sign*88,177);c.stroke();
    }else{
      c.drawImage(rider,90,132,76,83,110,direction==='front'?219:169,100,90);
      c.drawImage(rider,78,18,100,127,105,5,110,179);
      if(direction==='front'){
        // The whole horse silhouette covers the seated rider's middle, without a cut line.
        c.drawImage(horse,0,horseY,320,320);
      }
    }
    return canvas;
  });
  const entry={canvas,promise,ready:false};
  promise.then(()=>{entry.ready=true;}).catch(()=>{});
  mountedCache.set(id,entry);
  return entry;
}
export function prepareMounted(appearance){
  return Promise.all(['front','back','left','right'].flatMap(direction=>
    ['idle','walk-1','walk-2'].map(pose=>mountedSource(appearance,direction,pose).promise)));
}
