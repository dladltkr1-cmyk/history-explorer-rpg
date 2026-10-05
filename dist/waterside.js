// The two relocated banks share their painted and collision geometry.
export function pathDistance(points,x,y) {
  let closest=Infinity;
  for(let i=1;i<points.length;i++) {
    const [ax,ay]=points[i-1],[bx,by]=points[i],dx=bx-ax,dy=by-ay;
    const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));
    closest=Math.min(closest,Math.hypot(x-ax-t*dx,y-ay-t*dy));
  }
  return closest;
}
export const inFishingRiver=(m,x,y,margin=0)=>Boolean(m.fishingRiver&&pathDistance(m.fishingRiver.points,x,y)<m.fishingRiver.width/2+margin);
function pointAt(points,t) {
  const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
  let distance=t*lengths.reduce((a,b)=>a+b,0);
  for(let i=0;i<lengths.length;i++) {
    if(distance<=lengths[i]||i===lengths.length-1) {
      const u=distance/lengths[i],a=points[i],b=points[i+1];
      return [a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u];
    }
    distance-=lengths[i];
  }
}
export function drawFishingRiver(ctx,m,tile,clock) {
  const river=m.fishingRiver;if(!river)return;
  const stroke=(points,width,color)=>{
    ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x*tile,y*tile):ctx.moveTo(x*tile,y*tile));
    ctx.lineWidth=width*tile;ctx.strokeStyle=color;ctx.stroke();
  };
  ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
  stroke(m.bankPath,.65,'#b7ac7c');
  stroke(river.points,river.width+.75,'#889775');
  stroke(river.points,river.width+.22,'#c4bc8e');
  stroke(river.points,river.width,'#58a6ae');
  ctx.fillStyle='#a1d1ce';
  for(let i=0;i<24;i++) {
    const [x,y]=pointAt(river.points,(i/24+clock*.013)%1);
    ctx.fillRect(x*tile-10+(i%3-1)*11,y*tile,19,2);
  }
  // Sparse reeds on the bank; no built waterfront facilities.
  ctx.strokeStyle='#658a54';ctx.lineWidth=2;
  for(const [x,y]of river.reeds) {
    ctx.beginPath();ctx.moveTo(x*tile,y*tile);ctx.lineTo(x*tile-4,y*tile-15);
    ctx.moveTo(x*tile+4,y*tile);ctx.lineTo(x*tile+6,y*tile-19);ctx.stroke();
  }
  ctx.restore();
}
