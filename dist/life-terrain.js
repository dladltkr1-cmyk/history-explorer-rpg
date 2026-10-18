// Canvas terrain complements existing SD houses/trees without raster replacement.
export function drawLifeDistrict(ctx,m,T){
 const track=(points,width)=>{ctx.lineCap='round';ctx.lineJoin='round';for(const [color,w] of [['#817756',width+12],['#b6a17a',width],['#c4b28b',width*.55]]){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x*T,y*T):ctx.moveTo(x*T,y*T));ctx.stroke();}};
 if(m.district==='market'){
  ctx.fillStyle='#b5a17a';ctx.beginPath();ctx.ellipse(14*T,11.2*T,4.2*T,3.2*T,0,0,7);ctx.fill();
  track([[14,18],[14,14],[12,10],[14,7],[14,4]],75);
  track([[7,7],[10,8],[14,9],[18,8.5],[21.3,7.7]],61);
  track([[7.8,14.8],[11,13],[15,13.3],[18,15],[21,15.5]],61);
  for(const [k,x,y] of [['a',7,6],['b',7.8,13.8],['c',21.3,6.7],['d',21,14.5]]){ctx.fillStyle='#d1bd9455';ctx.beginPath();ctx.ellipse(x*T,(y+.65)*T,1.8*T,.6*T,0,0,7);ctx.fill();}
  for(let i=0;i<24;i++){const x=10+(i*13%80)/10,y=6+(i*17%100)/10;ctx.fillStyle=i%3?'#d5c49b99':'#95876866';ctx.fillRect(x*T,y*T,7,3);}
 }else{
  for(const [x,y,rx,ry]of [[5,5,4,3],[16,4,5,2],[7,13,5,3],[19,13,3,3]]){ctx.fillStyle='#365a3c26';ctx.beginPath();ctx.ellipse(x*T,y*T,rx*T,ry*T,0,0,7);ctx.fill();}
  track([[21,9],[18.5,9],[15,9.3],[13.4,10.7],[11,10],[9,8.7],[8,7]],40);
  track([[13.4,10.7],[14,12],[16,12]],34);
  for(let i=0;i<70;i++){const x=2+(i*37%190)/10,y=2+(i*23%130)/10;ctx.fillStyle=i%3?'#b2ae6555':'#46633c66';ctx.fillRect(x*T,y*T,4,6);}
 }
 ctx.lineCap='butt';
}
