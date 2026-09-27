// Assemble generated production art into the existing five atlas interfaces.
// Appearance indices and save data do not change.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
const {createCanvas,loadImage}=createRequire(import.meta.url)('@napi-rs/canvas');
const SIZE=256,ROOT=new URL('../dist/assets/player/custom/',import.meta.url);
const canvas=()=>createCanvas(SIZE,SIZE);
function pixels(c){return c.getContext('2d').getImageData(0,0,c.width,c.height)}
function put(data){const c=canvas();c.getContext('2d').putImageData(data,0,0);return c}
function drawCrop(image,box,target){const c=canvas(),ctx=c.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,...box,...target);return clean(c)}
// Sprite-sheet gutters may contain a sliver from an adjacent cell. Keep the principal connected sprite.
function clean(c){const p=pixels(c),a=p.data,seen=new Uint8Array(SIZE*SIZE),groups=[];for(let i=0;i<seen.length;i++){if(seen[i]||a[i*4+3]<30)continue;const q=[i];seen[i]=1;for(let j=0;j<q.length;j++){const n=q[j],x=n%SIZE,y=Math.floor(n/SIZE);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,k=yy*SIZE+xx;if(xx>=0&&xx<SIZE&&yy>=0&&yy<SIZE&&!seen[k]&&a[k*4+3]>=30){seen[k]=1;q.push(k)}}}groups.push(q)}groups.sort((a,b)=>b.length-a.length);for(const q of groups.slice(1))for(const n of q)a[n*4+3]=0;return put(p)}
function atlas(name,items){const out=createCanvas(12*SIZE,Math.ceil(items.length/12)*SIZE),ctx=out.getContext('2d');items.forEach((c,i)=>ctx.drawImage(c,i%12*SIZE,Math.floor(i/12)*SIZE));writeFileSync(new URL(name+'.png',ROOT),out.toBuffer('image/png'));}
const skins=[[246,210,176],[231,184,143],[187,130,87],[132,84,60]];
const hairColors=[[49,53,61],[103,67,42],[183,133,61],[144,65,42]];
// Recolour only authored skin or hair material masks, preserving source shading and alpha.
function skinPixel(r,g,b){return r>155&&g>108&&b>75&&r>g*1.08&&g>b*1.08&&g/b<1.55&&r/g<1.6;}
function recolor(c,skin,hair=null){const p=pixels(c),a=p.data;for(let i=0;i<a.length;i+=4){if(a[i+3]<8)continue;const r=a[i],g=a[i+1],b=a[i+2];const isSkin=skinPixel(r,g,b);const isHair=hair!==null&&!isSkin&&r>g*1.08&&g>b*1.05&&r<190;let col=null,k=1;if(isSkin){col=skins[skin];k=(r*.3+g*.59+b*.11)/211;}else if(isHair){col=hairColors[hair];k=(r*.3+g*.59+b*.11)/76;}if(col)for(let j=0;j<3;j++)a[i+j]=Math.min(255,col[j]*k);}return put(p)}
function splitHead(c,skin,color,onlySkin){const original=pixels(c),painted=pixels(recolor(c,skin,color));for(let i=0;i<painted.data.length;i+=4){const isSkin=skinPixel(...original.data.slice(i,i+3));if(isSkin!==onlySkin)painted.data[i+3]=0;}return put(painted)}
// Continuous inverse deformation keeps cloth and limbs connected in every walk frame.
function walk(c,dir,pose){if(!pose)return c;const p=pixels(c),src=p.data,out=canvas(),q=out.getContext('2d').createImageData(SIZE,SIZE),dst=q.data,sign=pose===1?-1:1;for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
const leg=Math.max(0,Math.min(1,(y-171)/61));const side=x<128?-1:1;const arm=Math.max(0,1-Math.abs(y-150)/40)*Math.max(0,Math.min(1,(Math.abs(x-128)-26)/17));
const sy=y-sign*(side*leg*4+side*arm*2),sx=x-(dir===1?sign*leg*side*3:sign*leg*1.2);const xi=Math.floor(sx),yi=Math.floor(sy),fx=sx-xi,fy=sy-yi;
for(let channel=0;channel<4;channel++){let value=0;for(let a=0;a<2;a++)for(let b=0;b<2;b++){const xx=xi+a,yy=yi+b;if(xx>=0&&xx<SIZE&&yy>=0&&yy<SIZE)value+=src[(yy*SIZE+xx)*4+channel]*(a?fx:1-fx)*(b?fy:1-fy)}dst[(y*SIZE+x)*4+channel]=value;}}
out.getContext('2d').putImageData(q,0,0);return out;}
const config=JSON.parse(readFileSync(new URL('./art/source-v25/layout.json',import.meta.url)));
const bodiesImage=await loadImage(new URL('./art/source-v25/bodies-source.png',import.meta.url).pathname);
const headsImage=await loadImage(new URL('./art/source-v25/heads-source.png',import.meta.url).pathname);
const bodies=[];for(let outfit=0;outfit<6;outfit++)for(let skin=0;skin<4;skin++)for(let dir=0;dir<3;dir++){const spec=config.bodies[dir*6+outfit];const base=recolor(drawCrop(bodiesImage,spec.box,spec.target),skin);for(let pose=0;pose<3;pose++)bodies.push(walk(base,dir,pose));}
atlas('bodies',bodies);
// Face material and hair retain the exact same source landmarks, never independent resizes.
const headParts=[],rear=[],faces=[];
for(let hair=0;hair<6;hair++)for(let color=0;color<4;color++)for(let dir=0;dir<3;dir++){
 const spec=config.heads[dir*6+hair],base=drawCrop(headsImage,spec.box,spec.target);
 const front=splitHead(base,1,color,false),back=canvas();
 // Long hair behind the shoulders in front/profile; on top of the coat in back view.
 if(hair>=3&&dir!==2){back.getContext('2d').drawImage(front,0,116,256,140,0,116,256,140);front.getContext('2d').clearRect(0,116,256,140);}
 headParts.push(front);rear.push(back);
}
for(let hair=0;hair<6;hair++)for(let skin=0;skin<4;skin++)for(let dir=0;dir<3;dir++){const spec=config.heads[dir*6+hair];faces.push(splitHead(drawCrop(headsImage,spec.box,spec.target),skin,1,true));}
atlas('hair-front',headParts);atlas('hair-rear',rear);atlas('heads',faces);
const eyeParts=[];
for(let style=0;style<4;style++)for(let dir=0;dir<3;dir++){
 const c=canvas(),ctx=c.getContext('2d');
 if(dir!==2){for(const x of dir===1?[105]:[117,139]){
  const y=dir===1?91:91;ctx.strokeStyle='#553c30';ctx.lineWidth=1.7;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x-4,y-9);ctx.quadraticCurveTo(x,y-(style===0?12:10),x+4,y-9);ctx.stroke();
  const h=[8,8,10,5.5][style],w=[7,8,8,8][style];
  ctx.beginPath();ctx.ellipse(x,y,w/2,h/2,0,0,Math.PI*2);ctx.fillStyle='#fff7e6';ctx.fill();
  ctx.beginPath();ctx.ellipse(x+(dir===1?-1:0),y+.4,2.7,h/2,0,0,Math.PI*2);ctx.fillStyle='#45392f';ctx.fill();
  ctx.beginPath();ctx.moveTo(x-w/2,y-h/2+1.6);ctx.quadraticCurveTo(x,y-h/2-(style===0?2:0),x+w/2,y-h/2+1.6);ctx.strokeStyle='#372e2b';ctx.lineWidth=1.8;ctx.stroke();
  ctx.fillStyle='#fff7e6';ctx.beginPath();ctx.arc(x-.7,y-h/2+2,1,0,Math.PI*2);ctx.fill();
 }}eyeParts.push(c);
}
atlas('eyes',eyeParts);
console.log('v25 generated art assembled into existing atlas interfaces');
