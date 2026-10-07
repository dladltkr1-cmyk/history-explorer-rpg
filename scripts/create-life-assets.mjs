import {mkdir,writeFile} from 'node:fs/promises';
import {CROPS,HOME_LEVELS,HOME_PALETTES,DECOR} from '../dist/homestead.js';
const root=new URL('../dist/assets/life/',import.meta.url);await mkdir(root,{recursive:true});
const svg=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><g stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
const path=(d,fill,stroke='#65543d',width=2)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
const rect=(x,y,w,h,fill,stroke='#65543d',width=2)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
const line=(d,color='#746043',width=2)=>path(d,'none',color,width);
async function out(id,w,h,body){await writeFile(new URL(id+'.svg',root),svg(w,h,body));}
function roof(x,y,w,h,p,level){
 let body=path(`M${x} ${y+h} L${x+w*.46} ${y} L${x+w} ${y+h*.84} L${x+w*.91} ${y+h+8} L${x+8} ${y+h+10} Z`,p.roof,p.wood,3);
 body+=line(`M${x+8} ${y+h-6} L${x+w*.46} ${y+8} L${x+w-10} ${y+h*.84-6}`,p.roofLight,4);
 for(let i=1;i<9+level;i++){const px=x+i*w/(9+level);const top=y+Math.abs(px-(x+w*.46))/w*h*1.8;body+=line(`M${px} ${Math.min(y+h-7,top+10)} L${px-6} ${y+h-2}`,p.roofLight,1.7);}
 body+=line(`M${x+7} ${y+h+7} L${x+w*.91} ${y+h+5}`,p.wood,4);return body;
}
for(const [country,p]of Object.entries(HOME_PALETTES))for(const [n,d]of Object.entries(HOME_LEVELS)){
 const level=Number(n),[w,h]=d.house,bottom=h-12,mainW=level===1?w*.79:level===2?w*.78:w*.69,x=(w-mainW)/2,y=h*.37,wallH=bottom-y;
 let body=rect(x-5,bottom-6,mainW+10,9,'#a7997b',p.wood,2);
 if(level>=3){const wx=level===3?w*.69:w*.64,wy=h*.50,ww=w-wx-8;body+=rect(wx,wy,ww,bottom-wy,p.wall,p.wood,3)+rect(wx+ww*.33,wy+15,ww*.31,24,'#68533a',p.wood)+roof(wx-5,wy-29,ww+11,34,p,level);}
 body+=rect(x,y,mainW,wallH,p.wall,p.wood,3);
 for(const px of [x+6,x+mainW-7,...(level>=2?[x+mainW*.34,x+mainW*.67]:[])])body+=rect(px,y+5,5,wallH-4,p.wood,p.wood,1);
 body+=line(`M${x+4} ${bottom-9} L${x+mainW-4} ${bottom-9}`,p.wood,4);
 const doorX=x+mainW*.44,doorW=mainW*.20;body+=rect(doorX,y+wallH*.31,doorW,wallH*.69,'#604a34',p.wood,3);
 body+=line(`M${doorX+doorW*.5} ${y+wallH*.32} L${doorX+doorW*.5} ${bottom}`, '#a28458',2);
 const winX=x+mainW*.13;body+=rect(winX,y+wallH*.32,mainW*.17,wallH*.24,'#7b6549',p.wood,2);
 body+=line(`M${winX+mainW*.085} ${y+wallH*.32} L${winX+mainW*.085} ${y+wallH*.56}`, '#d0b995',2);
 if(level>=2){const rx=x+mainW*.76;body+=rect(rx,y+wallH*.34,mainW*.14,wallH*.22,'#8c7755',p.wood,2);body+=line(`M${rx} ${y+wallH*.45} L${rx+mainW*.14} ${y+wallH*.45}`, '#d7c3a0',2);}
 body+=roof(x-9,12,mainW+18,y-7,p,level);
 if(level>=2){body+=path(`M${doorX-14} ${bottom-9} L${doorX+doorW+15} ${bottom-9} L${doorX+doorW+22} ${bottom+4} L${doorX-19} ${bottom+4} Z`,'#b99e75',p.wood,2);body+=line(`M${doorX-11} ${bottom-8} L${doorX-11} ${bottom+2} M${doorX+doorW+12} ${bottom-8} L${doorX+doorW+12} ${bottom+2}`,p.wood,3);}
 if(level>=3){body+=rect(x+8,bottom-19,14,17,'#9c7551',p.wood,2)+line(`M${x+9} ${bottom-15} L${x+21} ${bottom-15}`,'#c7a97a',2);}
 if(level===4){body+=path(`M${x-10} ${bottom-28} L${x+mainW*.28} ${bottom-31} L${x+mainW*.32} ${bottom-21} L${x-12} ${bottom-17} Z`,p.roof,p.wood,2);body+=line(`M${x-6} ${bottom-19} L${x-6} ${bottom+1} M${x+mainW*.27} ${bottom-22} L${x+mainW*.27} ${bottom+1}`,p.wood,4);body+=line(`M${doorX-18} ${bottom+7} L${doorX+doorW+22} ${bottom+7}`,'#d8c6a2',3);}
 await out('home-'+country+'-'+level,w,h,body);
}
function stalk(id,x,y,scale=1,ripe=true){
 const c=CROPS[id],head=ripe?c.color:'#87a666',green=ripe?'#71874d':'#6f9854';let body=line(`M${x} ${y} Q${x+2*scale} ${y-17*scale} ${x+4*scale} ${y-37*scale}`,green,2.5*scale);
 body+=path(`M${x+1*scale} ${y-13*scale} Q${x-14*scale} ${y-23*scale} ${x-10*scale} ${y-28*scale} Q${x-1*scale} ${y-27*scale} ${x+2*scale} ${y-13*scale}`,green,green,1);
 body+=path(`M${x+2*scale} ${y-20*scale} Q${x+13*scale} ${y-31*scale} ${x+16*scale} ${y-31*scale} Q${x+14*scale} ${y-21*scale} ${x+2*scale} ${y-20*scale}`,green,green,1);
 if(id==='sorghum'){body+=path(`M${x+4*scale} ${y-33*scale} Q${x-8*scale} ${y-39*scale} ${x+1*scale} ${y-54*scale} Q${x+13*scale} ${y-51*scale} ${x+11*scale} ${y-39*scale} Z`,head,'#875f40',1.5);for(let i=0;i<7;i++)body+=`<circle cx="${x+(i%3)*4*scale}" cy="${y-(37+Math.floor(i/3)*6)*scale}" r="${1.5*scale}" fill="#d8a065"/>`;}
 else if(id==='ricecrop'){body+=line(`M${x+4*scale} ${y-36*scale} Q${x+9*scale} ${y-49*scale} ${x+22*scale} ${y-35*scale}`,green,2*scale);for(let i=0;i<6;i++)body+=`<ellipse cx="${x+(7+i*2.6)*scale}" cy="${y-(43-i*.8)*scale}" rx="${2.3*scale}" ry="${4*scale}" transform="rotate(-25 ${x+(7+i*2.6)*scale} ${y-(43-i*.8)*scale})" fill="${head}"/>`;}
 else if(id==='barley'){for(let i=0;i<5;i++){body+=path(`M${x+4*scale} ${y-(34+i*3.8)*scale} l${-5*scale} ${-3*scale} l${4*scale} ${-3*scale} l${6*scale} ${2*scale} Z`,head,'#a38a4c',.8);body+=line(`M${x+scale} ${y-(38+i*3.8)*scale} l${-4*scale} ${-10*scale} M${x+7*scale} ${y-(37+i*3.8)*scale} l${5*scale} ${-9*scale}`,head,1);}}
 else {const tilt=id==='millet'?7:0;body+=path(`M${x+3*scale} ${y-34*scale} Q${x+(17+tilt)*scale} ${y-54*scale} ${x+(9+tilt)*scale} ${y-54*scale} Q${x-scale} ${y-56*scale} ${x-scale} ${y-39*scale} Z`,head,'#95844d',1);for(let i=0;i<6;i++)body+=line(`M${x+(i%2?5:0)*scale} ${y-(39+i*2)*scale} l${5*scale} ${-scale}`,ripe?'#e5cf84':'#b3c38b',1);if(id==='barnyard')for(let i=0;i<5;i++)body+=line(`M${x+5*scale} ${y-(39+i*3)*scale} l${9*scale} ${-4*scale}`,head,1);}
 return body;
}
function soil(kind){return path('M10 24 L96 24 L108 65 L4 65 Z',kind==='paddy'?'#84afb0':'#9d7d50',kind==='paddy'?'#697e63':'#70583b',3)+line('M18 36 L96 36 M14 48 L101 48 M9 59 L104 59',kind==='paddy'?'#b9d4c4':'#c1a26e',2);}
await out('empty-field',112,100,soil('field')+line('M25 69 L93 69','#766142',3));await out('empty-paddy',112,100,soil('paddy')+line('M20 40 Q32 34 46 41 M61 56 Q74 51 91 56','#d1e0cc',2));
for(const [id,c]of Object.entries(CROPS)){
 await out('crop-'+id,64,64,stalk(id,29,61,.88,true));
 const sack=path('M20 15 L43 15 L40 25 Q57 40 48 58 L15 58 Q8 39 23 25 Z','#cab78a','#816b48',2.5)+line('M19 17 L44 17 M22 22 L41 22','#9f8052',3)+stalk(id,29,54,.45,true);
 await out('seed-'+id,64,64,sack);
 await out('growing-'+id,112,100,soil(c.kind)+[29,55,79].map((x,i)=>stalk(id,x,62-i%2*5,.45,false)).join(''));
 await out('ripe-'+id,112,100,soil(c.kind)+[28,51,75].map((x,i)=>stalk(id,x,64-i%2*4,.81,true)).join(''));
}
const jars={clayJar:['#b48760','#d0ab7b',0],stripedJar:['#af9870','#e0ca9a',2],darkJar:['#777968','#b2b39b',-2]};
for(const [id,[fill,light,shift]]of Object.entries(jars)){let body=path(`M23 14 L41 14 L39 23 Q${57+shift} 33 51 49 Q48 60 32 61 Q15 60 13 49 Q${8-shift} 32 25 23 Z`,fill,'#67583f',2.5)+rect(21,9,22,7,light,'#67583f',2)+line('M18 36 Q32 42 48 36',light,2);if(id==='stripedJar')body+=line('M17 44 Q31 49 49 43 M20 31 L26 28 L32 32 L39 28 L45 31',light,2);if(id==='darkJar')body+=line('M20 44 L26 40 L32 44 L39 40 L46 44',light,2);await out(id,64,64,body);}
for(const [id,fill]of [['reedMat','#c4b77e'],['wovenMat','#ae9872']]){let body=path('M4 24 L49 9 L61 41 L16 56 Z',fill,'#756343',2);for(let i=0;i<9;i++)body+=line(`M${7+i*5} ${24-i*1.6} L${18+i*5} ${52-i*1.6}`,id==='reedMat'?'#e0d49c':'#d7bd8d',1);body+=line('M9 30 L53 15 M11 38 L56 24 M14 46 L59 34','#8f7955',1);if(id==='wovenMat')body+=path('M26 29 L34 20 L44 31 L36 41 Z','#886c51','#665a43',1);await out(id,64,64,body);}
function lamp(x,y){return path(`M${x-12} ${y} Q${x} ${y+18} ${x+12} ${y} Z`,'#a18a62','#6d5d42',2)+line(`M${x-10} ${y} L${x+10} ${y}`,'#d5b880',2)+path(`M${x+6} ${y-2} Q${x-1} ${y-12} ${x+7} ${y-22} Q${x+16} ${y-7} ${x+6} ${y-2} Z`,'#e7bd66','#b99148',1)+path(`M${x+7} ${y-4} Q${x+4} ${y-10} ${x+8} ${y-15} Q${x+12} ${y-8} ${x+7} ${y-4} Z`,'#f5dda0','none',0);}
await out('clayLamp',64,64,lamp(30,42)+rect(20,54,21,5,'#877352'));await out('doubleLamp',64,64,rect(18,48,29,6,'#8c7650')+lamp(19,34)+lamp(44,41));
await out('woodBox',64,64,path('M8 23 L42 14 L58 26 L24 36 Z','#c6a171')+path('M8 23 L24 36 L24 58 L8 45 Z','#95714d')+path('M24 36 L58 26 L58 49 L24 58 Z','#ad875b')+line('M28 44 L54 36 M28 51 L54 43 M16 31 L16 50','#d5b588',2)+line('M34 17 L47 29 L47 51','#766342',3));
await out('lowTable',64,64,line('M13 36 L13 55 M48 30 L48 50 M50 45 L50 61','#745635',5)+path('M4 25 L44 13 L60 35 L20 47 Z','#bd9868','#725537',2.5)+path('M4 25 L4 32 L20 53 L60 41 L60 35 L20 47 Z','#95734b')+line('M13 27 L42 19 M19 36 L48 27','#d4b88a',2));
await out('wallWeave',64,64,rect(11,8,43,46,'#bdad7b','#775e40')+line('M16 12 L16 60 M24 12 L24 57 M32 12 L32 60 M40 12 L40 57 M48 12 L48 60','#e0c996',2)+path('M19 29 L31 17 L44 30 L31 42 Z','#8c8461','#746b50',1)+line('M8 6 L57 6','#705337',4));
await out('dyedCloth',64,64,path('M11 9 L53 9 L50 53 L14 53 Z','#ac775a','#735c43',2)+line('M9 7 L56 7','#705438',4)+line('M18 11 L17 51 M26 11 L25 52 M36 11 L35 52 M45 11 L44 52','#d9b68b',2)+line('M15 23 L51 23 M15 41 L50 41','#705c4b',3)+line('M17 53 L17 60 M24 53 L24 58 M32 53 L32 60 M40 53 L40 59 M47 53 L47 60','#ac775a',2));
await out('herbPot',64,64,path('M18 41 L46 41 L41 59 L23 59 Z','#b58c62')+line('M16 41 L48 41','#d2b48a',4)+line('M30 43 L30 17 M31 29 L18 17 M31 35 L47 20','#70854e',2)+path('M30 17 Q14 2 22 26 Q28 26 30 17 Z','#91a66a','#667948',1)+path('M32 28 Q51 5 53 17 Q51 29 32 28 Z','#799759','#5b7547',1)+path('M28 33 Q8 18 12 34 Q18 40 28 33 Z','#a0af6e','#71804d',1));
await out('lumber',64,64,path('M8 35 L41 11 L56 20 L25 46 Z','#b38a59')+path('M7 48 L37 24 L54 34 L24 60 Z','#c39b68')+line('M23 24 L37 34 M18 42 L30 53','#746445',5)+`<ellipse cx="18" cy="51" rx="10" ry="7" fill="#d9bd89" stroke="#92734b" stroke-width="2"/><ellipse cx="18" cy="51" rx="5" ry="3" fill="none" stroke="#af8c5b"/>`);
await out('board',80,70,line('M18 38 L18 65 M62 36 L62 64','#6e5137',7)+path('M7 24 L51 12 L73 34 L28 49 Z','#b69767')+path('M7 24 L7 31 L28 56 L73 42 L73 34 L28 49 Z','#8e6e48')+rect(25,22,24,17,'#ddcdaa','#a28b61')+line('M28 26 L45 26 M28 31 L44 31','#7c7656',2)+path('M53 20 L62 20 L62 35 L53 35 Z','#8d7960'));
await out('workbench',100,80,line('M16 39 L16 74 M82 36 L82 70','#715236',7)+path('M4 26 L68 10 L96 35 L31 53 Z','#b59a6d')+path('M4 26 L4 35 L31 63 L96 45 L96 35 L31 53 Z','#94704a')+line('M39 23 L60 20 M47 28 L66 25','#dac092',5)+line('M67 32 L82 26','#656a5b',5)+line('M76 26 L80 39','#785b3d',4));
await out('cart',100,80,path('M13 27 L64 17 L90 36 L37 49 Z','#b49160')+path('M13 27 L13 44 L37 64 L37 49 Z','#96724a')+path('M37 49 L90 36 L90 54 L37 64 Z','#ad8759')+line('M37 57 L83 45 M15 34 L32 49 M22 44 L5 62','#6c5137',3)+`<circle cx="30" cy="65" r="12" fill="#8b704c" stroke="#5b4935" stroke-width="3"/><circle cx="81" cy="58" r="12" fill="#8b704c" stroke="#5b4935" stroke-width="3"/>`+line('M20 65 L40 65 M30 55 L30 75 M71 58 L91 58 M81 48 L81 68','#d2b17b',2));
console.log('Life SVG assets: 12 structural home variants, 5 distinct crops/seeds/growth/harvests, 12 decor variants and 5 field/work objects.');
