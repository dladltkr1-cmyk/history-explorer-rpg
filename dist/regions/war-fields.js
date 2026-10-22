import {TRAIL,ESCAPE,TRAIL_WALLS,ESCAPE_WALLS,TRAIL_TREES,ESCAPE_TREES} from '../war-story.js?v=55';
const obj=(id,type,x,y,name,art,extra={})=>({id,type,x,y,name,art,...extra});
function field(id,name,w,h,walls,entities){
 const obstacles=[];for(let x=0;x<w;x++)obstacles.push({x,y:0,art:'pine'},{x,y:h-1,art:'pine'});for(let y=1;y<h-1;y++)obstacles.push({x:0,y,art:'pine'},{x:w-1,y,art:'pine'});
 for(const [x,y]of id===TRAIL?TRAIL_TREES:ESCAPE_TREES)obstacles.push({x,y,art:'pine'});
 const decor=walls.map((r,i)=>obj('war-wall-'+i,'scenery',r.x,r.y,'나무와 돌 엄폐물',r.art,{worldWidth:r.w*64,worldHeight:r.art==='warRock'?75:r.art==='rock'?60:70}));
 return {id,name,theme:'ancient-north',ancient:true,warField:true,danger:'safe',entryAt:id===TRAIL?24:25,w,h,ground:id===TRAIL?'#849076':'#7f8b75',start:{x:id===TRAIL?14:12,y:32},obstacles,entities:[...decor,...entities]};
}
export const WAR_MAPS=[field(TRAIL,'369년 · 치양 부근 전령길',30,36,TRAIL_WALLS,[obj('war-back','warStory',14,33,'한강으로 돌아가기','warGate'),obj('war-fork','warStory',12,30,'길목의 발자국','ancientMarker',{clue:'fork'}),obj('war-fallen','warStory',5,22,'쓰러진 나무와 샛길','warLog',{clue:'fallen'}),obj('war-watch','warStory',23,14,'강가의 흔적','ancientMarker',{clue:'watch'}),obj('war-recipient','warStory',14,4,'소식을 기다리는 사람','ancientHelperNorth',{actor:true}),obj('war-warning','scenery',21,28.7,'군사들이 지나는 큰길','warWarning',{worldWidth:45,worldHeight:60})]),field(ESCAPE,'371년 · 평양성 주변 피란길',24,36,ESCAPE_WALLS,[obj('war-back','warStory',12,33,'한강으로 돌아가기','warGate'),obj('war-escape','warStory',12,2,'북쪽 피란문','warGate',{worldWidth:150,worldHeight:120}),obj('war-cover-sign','scenery',17,22,'피란길 울타리','warShelter',{worldWidth:100,worldHeight:110})])];
