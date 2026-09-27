// Authoring source for aligned 80×80 pixel sprites. Runtime uses the baked PNG atlases.
export const SIZE=80;
export const ANCHORS={head:[40,24],eyes:[40,29],neck:[40,40],shoulders:[40,44],waist:[40,56],feet:[40,72]};
// Modest pixel-RPG proportion pass: same anchors in every direction and pose.
// Head stays at the same centre; the neck meets it at y=35 and feet stay at 72.
function headSpace(c){c.translate(40,35);c.scale(.94,.88);c.translate(-40,-40)}
function bodySpace(c){c.translate(0,35);c.scale(1,37/32);c.translate(0,-40)}
const skins=[['#f6d7b6','#e8b88f','#c88c6d'],['#eec19b','#dba47c','#b97858'],['#c88f65','#ae704e','#814d38'],['#986246','#7d4c37','#583727']];
const hairs=[['#333640','#4b505a','#22262e'],['#74513d','#946b49','#49382f'],['#c6994f','#e0b76c','#8d673b'],['#96513c','#b86c48','#633b31']];
const outfits=[
 {main:'#3b787e',light:'#57989a',shade:'#285159',pants:'#3b4858',seam:'#71808c',shoe:'#73503d'},
 {main:'#cb9b58',light:'#e7c681',shade:'#99723f',pants:'#5c7368',seam:'#829789',shoe:'#705544'},
 {main:'#8c5360',light:'#af7281',shade:'#633e4e',pants:'#404b63',seam:'#627087',shoe:'#654c43'},
 {main:'#e6ae43',light:'#f6d376',shade:'#b47b32',pants:'#436884',seam:'#7697ad',shoe:'#dde5dd'},
 {main:'#e9ede5',light:'#fffff1',shade:'#aebfc0',pants:'#e8ede7',seam:'#b3c3c1',shoe:null},
 {main:'#368492',light:'#69b8bd',shade:'#245663',pants:'#304958',seam:'#618894',shoe:'#ebaa53'}
];
function pen(c){
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h)};
 const poly=(p,color,line='#3c3538')=>{c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();if(line){c.strokeStyle=line;c.lineWidth=1;c.lineJoin='round';c.stroke()}};
 const path=(p,color,w=1.3)=>{c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=w;c.lineJoin='round';c.lineCap='round';c.stroke()};
 return {rect,poly,path};
}
export function body(c,outfit,skin,dir,pose){
 bodySpace(c);
 const {rect,poly,path}=pen(c), p=outfits[outfit],s=skins[skin];
 const side=dir===1,back=dir===2, step=pose===1?-2:pose===2?2:0;
 const long=outfit===2||outfit===4, short=outfit===5||outfit===3;
 const hem=outfit===2?62:outfit===1?59:57;
 // Every outfit owns its legs, feet, torso, sleeves, hands and neck.
 const leg=(x,y,w,near)=>{
   poly([[x,55],[x+w,55],[x+w,y],[x,y]],p.pants);
   rect(x+1,58,1,y-59,p.seam);path([[x+w-2,59],[x+w-2,y-2]],'#303b47',1);
   if(short){poly([[x+1,y],[x+w-1,y],[x+w-1,y+7],[x+1,y+7]],s[0]);if(outfit===5){rect(x+1,y+3,w-2,4,'#e0e8de');rect(x+1,y+3,w-2,1,p.main)}}
   const footY=short?y+7:y;
   poly([[x,footY-1],[x+w,footY-1],[x+w+(side?-1:1),footY+3],[x-(side?3:0),footY+3],[x-(side?3:0),footY+1]],p.shoe||s[0]);
   if(p.shoe){rect(x+1,footY,w-2,1,p.seam);}
   if(p.shoe)path([[x,footY+2],[x+w-1,footY+2]],p.shoe==='#dde5dd'?'#aab7bc':'#473c36',1);
 };
 if(side){leg(38,short?62-step:69-step,8,false);leg(31,short?62+step:69+step,9,true)}
 else{leg(30,short?62+step:69+step,9,true);leg(42,short?62-step:69-step,9,false)}
 poly(side?[[33,39],[43,39],[45,45],[31,45]]:[[36,38],[44,38],[45,44],[35,44]],s[0]);
 rect(side?34:37,39,6,3,s[1]);
 const arm=(x,near)=>{
   const swing=side?(near?step:-step): (x<40?step:-step)*.4;
   c.save();c.translate(swing,0);
   const width=outfit===4?8:outfit===2?8:6;
   const end=long?56:50;
   poly([[x+2,44],[x+width,44],[x+width+1,48],[x+width,end],[x,end],[x,47]],p.main);
   path([[x+2,46],[x+2,end-2]],p.light,1);path([[x+width-1,48],[x+width-1,end-1]],p.shade,1);rect(x+1,end-2,width-1,2,p.shade);
   if(!long)poly([[x+1,end],[x+width,end],[x+width,57],[x+width-2,59],[x,57]],s[0]);
   else poly([[x+1,56],[x+width-1,56],[x+width-1,59],[x+2,60],[x,58]],s[0]);
   if(!long)path([[x+width-1,52],[x+width-1,56]],s[1],1);
   c.restore();
 };
 if(side)arm(39,false);else arm(23,false);
 poly(side?[[32,43],[42,43],[47,47],[47,hem],[30,hem],[29,48]]:[[33,43],[36,42],[44,42],[48,44],[51,49],[50,hem],[30,hem],[29,49]],p.main);
 poly(side?[[41,46],[46,47],[46,hem-1],[41,hem-1]]:[[45,45],[49,48],[49,hem-1],[45,hem-1]],p.shade,null);
 path([[32,47],[32,hem-3]],p.light,1);
 if(!side){path([[34,49],[36,50]],p.light,1);path([[44,hem-3],[47,hem-4]],p.shade,1)}
 if(outfit===0){
   if(!back){poly(side?[[31,43],[38,44],[34,48],[30,46]]:[[34,43],[40,46],[46,43],[44,49],[36,49]],'#e9c578');if(!side)path([[40,47],[40,55]],p.shade,1)}
   rect(side?30:30,55,side?17:20,3,'#6a513b');rect(side?33:38,55,3,3,'#ddbc70');
   if(!side)rect(44,51,3,3,'#72a3a1');
 }else if(outfit===1){
   if(!back){poly(side?[[32,43],[37,45],[35,55],[31,57]]:[[34,43],[39,47],[37,58],[31,57]],'#f1dfb1');if(!side)poly([[44,43],[41,47],[43,58],[49,57]],'#b78143');}
   path([[side?39:42,46],[side?43:46,56]],'#705339',2);rect(side?40:43,54,6,5,'#86623c');
 }else if(outfit===2){
   poly(side?[[31,43],[42,42],[45,47],[31,47]]:[[32,44],[36,41],[44,41],[49,44],[47,48],[33,48]],'#d6c4a1');
   path([[side?37:40,48],[side?37:40,60]],p.shade,1);
   rect(side?31:31,55,side?15:18,2,'#463f43');if(!back){rect(side?34:39,50,2,2,'#e5c87c');rect(side?34:39,54,2,2,'#e5c87c')}
   path([[side?31:31,61],[side?46:49,61]],p.light,1);
 }else if(outfit===3){
   if(!back)path(side?[[31,44],[34,46],[38,44]]:[[35,43],[37,46],[43,46],[45,43]],'#fff0bd',2);
   if(!side){rect(31,51,18,3,'#f7d779');rect(31,55,18,2,p.shade)}
 }else if(outfit===4){
   if(!back){path(side?[[32,43],[37,48],[32,53]]:[[34,43],[43,51],[38,55]],p.shade,2);if(!side)path([[45,43],[38,50]],'#bdceca',1.5)}
   rect(side?30:30,54,side?17:20,3,'#333b46');
   if(!back){poly(side?[[33,54],[37,55],[35,62],[32,61]]:[[38,54],[42,54],[43,62],[40,61],[39,63],[37,62]],'#333b46');rect(side?34:39,55,2,2,'#535d67')}
 }else{
   if(!side){for(const x of [33,41])rect(x,46,4,10,'#e9ddaa');if(back){rect(38,49,4,4,p.main)}}
   if(!back)path(side?[[32,43],[35,46],[39,44]]:[[35,43],[38,46],[42,46],[45,43]],'#e9ddaa',1.7);
   rect(side?31:31,56,side?15:18,1,p.shade);
 }
 if(side)arm(38,true);else arm(50,true);
}
export function head(c,skin,dir){
 headSpace(c);
 const {rect,poly,path}=pen(c),s=skins[skin];
 if(dir===1){
   poly([[30,18],[45,17],[51,23],[50,32],[45,38],[35,39],[29,36],[27,31],[25,30],[28,27]],s[0]);
   poly([[46,21],[50,24],[49,32],[44,37],[37,38],[45,34]],s[1],null);
   poly([[44,28],[48,27],[50,29],[49,33],[45,34]],s[0]);path([[47,29],[46,32]],s[2],1);
 }else{
   poly([[26,25],[23,26],[24,32],[28,33],[29,25]],s[0]);
   poly([[53,25],[56,26],[55,32],[51,33],[50,25]],s[1]);
   poly([[29,16],[48,16],[53,23],[52,32],[48,37],[43,40],[36,40],[30,37],[27,32],[27,23]],s[0]);
   poly([[49,23],[52,24],[51,32],[47,37],[42,39],[35,38],[44,36],[49,31]],s[1],null);
   if(dir!==2){rect(30,33,3,1,s[1]);rect(47,33,3,1,s[2]);path([[39,36],[42,36]],s[2],1)}
 }
}
export function eyes(c,style,dir){
 headSpace(c);
 if(dir===2)return;
 const {rect,path}=pen(c), ink='#34323c';
 const xs=dir===1?[30]:[33,44];
 for(const x of xs){
   path([[x-1,26],[x+3,26]],'#795949',1);
   if(style===0){path([[x-1,30],[x,29],[x+2,29],[x+3,30]],ink,1);rect(x,30,3,2,'#fff5df');rect(x+1,30,2,3,ink);rect(x+1,30,1,1,'#fff9ea')}
   if(style===1){rect(x-1,28,5,4,'#fff5df');rect(x,29,3,4,ink);rect(x,29,1,1,'#fff9ea');path([[x-1,28],[x+3,28]],ink,1);rect(x+1,32,1,1,'#96724b')}
   if(style===2){rect(x-1,28,5,5,'#fff5df');rect(x,28,3,5,ink);rect(x,28,1,2,'#fff9ea');rect(x+1,32,1,1,'#987344');path([[x-1,28],[x+3,28]],ink,1)}
   if(style===3){rect(x-1,30,5,3,'#fff5df');rect(x,30,3,3,ink);rect(x,30,1,1,'#fff9ea');path([[x-1,29],[x+3,30]],ink,1)}
 }
 if(dir===1)path([[28,35],[31,35]],'#9b6654',1);
}
export function hair(c,style,color,dir,layer){
 headSpace(c);
 const {rect,poly,path}=pen(c), [base,light,dark]=hairs[color];
 const side=dir===1,back=dir===2;
 // Rear hair sits behind head and body; front fringe ends above the eye line.
 if(layer==='rear'){
   if(style===3){poly(side?[[48,21],[56,20],[59,25],[56,31],[59,38],[56,45],[51,47],[53,40],[50,33],[50,26]]:[[42,22],[49,25],[49,32],[47,38],[48,45],[42,50],[39,44],[41,37],[39,29]],base,dark);path(side?[[54,25],[53,32],[56,39],[54,44]]:[[45,29],[43,37],[44,44]],light,2)}
   if(style===4){for(const x of side?[50]:[23,52]){poly([[x,23],[x+5,24],[x+6,30],[x+4,34],[x+6,39],[x+2,44],[x-2,40],[x-3,32]],base,dark);path([[x+2,29],[x+1,34],[x+3,39]],light,1.5)}}
   if(style===5){poly([[27,18],[52,18],[56,28],[55,40],[51,44],[46,41],[32,43],[25,41],[24,29]],base,dark);path([[27,30],[27,39]],light,2)}
   return;
 }
 const shapes=[
 [[25,25],[24,19],[27,13],[32,10],[39,9],[47,11],[53,15],[55,21],[52,28],[49,24],[47,19],[43,22],[40,19],[36,24],[34,20],[29,25],[28,30]],
 [[25,27],[23,22],[25,16],[22,14],[30,14],[31,8],[36,11],[40,5],[44,11],[50,9],[50,14],[56,15],[53,21],[55,25],[50,29],[48,21],[44,24],[40,18],[36,23],[31,21],[29,29]],
 [[25,27],[24,20],[27,14],[32,11],[42,9],[51,13],[55,19],[54,27],[50,29],[48,21],[45,18],[39,18],[33,20],[29,22],[28,30]],
 [[25,28],[24,20],[27,14],[33,10],[44,10],[51,13],[54,20],[54,29],[50,30],[48,22],[44,19],[39,22],[35,19],[30,24],[28,30]],
 [[25,28],[24,21],[27,14],[33,11],[43,10],[51,14],[54,21],[53,29],[50,30],[47,22],[41,19],[37,22],[32,20],[28,29]],
 [[24,33],[24,23],[26,16],[31,11],[39,10],[48,12],[53,17],[55,25],[54,38],[51,41],[49,32],[49,23],[45,24],[41,22],[36,24],[31,23],[29,34],[28,41],[25,39]]
 ];
 let p=shapes[style];
 if(back){
   // Dedicated rear cap, nape and parting, never a rotated front fringe.
   p=style===1?[[24,28],[23,21],[26,16],[23,14],[30,14],[31,8],[36,11],[40,5],[44,11],[50,9],[50,14],[56,15],[53,21],[55,26],[52,33],[48,36],[44,34],[40,38],[35,34],[31,36],[27,32]]:
     [[25,27],[24,21],[27,14],[33,10],[44,10],[51,13],[54,20],[54,29],[51,35],[47,37],[43,36],[39,38],[34,36],[30,36],[27,32]];
   if(style===5)p=[[24,33],[24,23],[26,16],[31,11],[39,10],[48,12],[53,17],[55,25],[54,39],[49,43],[44,42],[40,44],[35,42],[30,43],[25,40]];
 }else if(side){
   const sideShapes=[
    [[26,26],[24,21],[27,15],[33,11],[42,10],[50,14],[54,21],[53,29],[49,35],[46,33],[45,27],[42,24],[36,23],[33,20],[30,25]],
    [[25,26],[23,21],[27,16],[25,13],[31,14],[32,8],[38,12],[43,6],[46,13],[52,12],[51,17],[56,21],[53,27],[54,31],[49,36],[46,32],[43,25],[38,23],[34,20],[30,25]],
    [[25,22],[26,16],[32,11],[42,9],[51,13],[55,20],[54,29],[50,35],[46,33],[45,25],[39,21],[33,20],[29,22]],
    [[25,25],[24,20],[28,14],[35,10],[45,11],[52,16],[54,24],[50,33],[46,34],[44,27],[40,24],[35,20],[30,25]],
    [[25,25],[25,19],[29,14],[36,11],[45,12],[52,17],[53,25],[49,34],[46,33],[43,26],[37,22],[33,20],[29,26]],
    [[25,26],[24,21],[27,15],[33,11],[43,11],[51,15],[54,23],[54,38],[50,43],[44,41],[43,30],[40,25],[34,22],[30,26]]
   ];p=sideShapes[style];
 }
 poly(p,base,dark);
 c.save();c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();
 poly(side?[[43,11],[52,16],[57,25],[52,37],[45,34],[48,26],[46,19]]:[[48,12],[56,19],[57,34],[48,42],[44,37],[49,29],[47,23],[50,20]],dark,null);
 path(side?[[31,16],[36,13],[42,14]]:[[29,19],[33,15],[38,14]],light,2);
 if(style!==2){path([[32,16],[31,20],[29,23]],dark,1);path([[42,14],[40,18],[37,21]],dark,1);path([[43,17],[46,21]],light,1)}
 c.restore();
 // Broken highlights follow locks rather than a solid helmet-like rim.
 path(side?[[29,17],[35,14],[42,14]]:[[29,17],[34,14],[39,13]],light,2);
 if(style===1){path([[34,15],[39,10],[41,15]],light,1.7);path([[46,17],[49,15]],light,1.5)}
 else if(style===2){path([[30,19],[38,15],[46,16]],light,1.5);path([[35,20],[43,17],[49,20]],dark,1)}
 else{path(side?[[45,17],[49,21],[50,25]]:[[44,15],[48,17],[50,21]],light,1.5);path([[35,16],[33,20]],dark,1)}
 if(back){path([[38,16],[36,24],[39,32]],dark,1.3);path([[45,18],[48,26],[46,32]],light,1.5)}
 if(style===3 && (back||side)){
   const x=side?51:42;poly([[x-2,24],[x+5,24],[x+7,31],[x+5,37],[x+6,44],[x+1,49],[x-2,44],[x,36],[x-3,30]],base,dark);rect(x-2,24,7,3,'#d9b369');path([[x+2,29],[x+3,34],[x+1,40],[x+2,44]],light,1.6);
 }
 if(style===4){for(const x of side?[50]:[25,52])rect(x-2,26,5,2,'#d9b369')}
}
