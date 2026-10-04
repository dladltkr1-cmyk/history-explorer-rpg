import {map,exit,foe,person,entity} from './common.js';

// Extra routes use the same map, quest, combat and save systems as the first four eras.
export function addExploration(paleo,neo,bronze,go){
  const get=(r,id)=>r.maps.find(m=>m.id===id);
  const add=(r,id,...things)=>get(r,id).entities.push(...things);
  const move=(r,from,to,id,x,y)=>{
    const source=get(r,from), target=get(r,to), object=source.entities.find(e=>e.id===id);
    if(!object)return;
    source.entities=source.entities.filter(e=>e!==object);
    Object.assign(object,{x,y});target.entities.push(object);
  };

  add(paleo,'paleo-forest',
    exit('paleo-deep-door',20,13,'깊은 숲','paleo-deep'),
    foe('paleo-snake',18,8,'snake'));
  const deep=map('paleo-deep','깊은 숲과 바위','deep-wild',[
    exit('deep-forest',2,9,'바위와 나무 숲','paleo-forest'),
    foe('deep-wolf',8,6,'wolf'),foe('deep-snake',17,12,'snake'),
    foe('deep-bear',19,5,'bear'),foe('deep-boar2',14,11,'boar'),
    entity('deep-berries','berry',20,13,'열매',{art:'berries'}),
    entity('deep-rock','inspect',14,4,'큰 바위',{art:'rock',lines:['숲 안쪽에는 큰 바위와 나무가 많다.']})]);
  paleo.maps.push(deep);

  add(neo,'pre-village',
    entity('neo-storage','inspect',12,13,'곡식 보관 자리',{art:'storage',lines:['움집 곁에 먹을 곡식을 모아 두었다.']}),
    exit('neo-river-door',20,14,'강가','neo-river'));
  add(neo,'pre-forest',foe('neo-snake',19,10,'snake'),foe('neo-bear',18,5,'bear'));
  const river=map('neo-river','강가와 고기잡이 자리','riverbank',[
    exit('river-village',2,9,'강가 마을','pre-village'),
    person('river-fisher',9,6,'고기잡이하는 사람',['강에서는 물고기를 잡아.\n잡은 물고기는 불에서 익힐 수 있어.'],'farmer'),
    entity('river-fish','loot',17,5,'잡은 물고기',{art:'fish',loot:{fish:2},resource:'fish',spots:[[17,5],[17,7],[20,6],[20,12]]}),
    entity('river-berry','berry',7,13,'수풀의 열매',{art:'berries'}),
    foe('river-snake',17,11,'snake'),foe('river-boar',10,13,'boar')],{river:true,
    // Return beside the village exit, outside the river collision strip.
    returnTo:{map:'pre-village',x:20,y:13}});
  neo.maps.push(river);
  move(neo,'pre-village','neo-river','pre-farmer',8,12);

  add(bronze,'bronze-outskirts',exit('grove-door',21,13,'바위숲','bronze-grove'),foe('out-snake',18,13,'snake'));
  const grove=map('bronze-grove','마을 밖 바위숲','deep-bronze',[
    exit('grove-outskirts',2,9,'마을 외곽','bronze-outskirts'),
    foe('grove-bear',9,5,'bear'),foe('grove-wolf',16,11,'wolf'),
    foe('grove-tiger',19,5,'tiger'),foe('grove-boar2',6,12,'boar'),
    entity('grove-berries','berry',20,13,'바위 뒤 열매',{art:'berries'}),
    entity('grove-rock','inspect',13,4,'큰 바위',{art:'rock',lines:['마을 밖에는 큰 바위와 울창한 숲이 있다.']})]);
  bronze.maps.push(grove);

  add(go,'go-field',exit('go-out-door',21,13,'마을 밖 숲길','go-outskirts'));
  const outskirts=map('go-outskirts','마을 밖 숲길','go-wild',[
    exit('out-field',2,9,'들판과 길','go-field'),
    foe('go-out-bandit',8,8,'bandit',{elite:true,eliteName:'산적 정찰꾼'}),foe('go-out-bear',17,5,'bear'),
    foe('go-out-wolf',16,13,'wolf',{elite:true,eliteName:'우두머리 늑대'}),foe('go-out-tiger',19,11,'tiger'),foe('go-out-boar2',13,13,'boar'),
    entity('go-out-berries','berry',20,14,'숲길 열매',{art:'berries'}),
    person('go-trail-keeper',5,5,'길 지킴이',['마을 밖 숲길은 위험해.\n필요한 물건을 챙겨 가.'],'researcher')]);
  go.maps.push(outskirts);
  Object.assign(get(go,'go-village').entities.find(e=>e.id==='go-guard'),{x:19,y:8});
  move(go,'go-village','go-field','hide-worker',19,13);
  Object.assign(get(go,'go-village').entities.find(e=>e.id==='go-store'),{
    type:'inspect',lines:['마을 사람들은 거둔 곡식을 이곳에 모아 두었다.']
  });

  // Distinct clusters open narrow passages without blocking any story target.
  const clusters={
    'paleo-deep':[[4,3],[5,3],[5,4],[11,4],[12,4],[15,7],[16,7],[20,9],[19,9],[7,12],[8,12],[13,14],[14,14]],
    'neo-river':[[4,3],[5,3],[12,3],[12,4],[7,8],[8,8],[5,14],[11,14],[15,14],[20,5]],
    'bronze-grove':[[4,3],[5,3],[6,3],[13,3],[14,3],[17,7],[18,7],[4,12],[5,12],[11,14],[12,14],[20,9]],
    'go-outskirts':[[4,3],[5,3],[11,3],[12,3],[16,7],[17,7],[7,12],[8,12],[12,14],[20,8]]
  };
  for(const r of [paleo,neo,bronze,go])for(const m of r.maps){
    if(clusters[m.id]){
      m.obstacles=m.obstacles.filter(o=>o.x===0||o.x===23||o.y===0||o.y===17);
      for(const [x,y] of clusters[m.id])if(!m.entities.some(e=>Math.hypot(e.x-x,e.y-y)<1.6))
        m.obstacles.push({x,y,art:(x+y)%4===0?'rock':m.id==='go-outskirts'?'goTree':(x+y)%3===0?'pine':'tree'});
    }
    // Clear the approach to exits and interactable objects after placing scenery.
    m.obstacles=m.obstacles.filter(o=>o.x===0||o.x===23||o.y===0||o.y===17||
      !m.entities.some(e=>['exit','artifact','inspect','loot','berry','npc','quiz'].includes(e.type)&&Math.hypot(e.x-o.x,e.y-o.y)<1.05));
    // The map's named safe area is clear; only outdoor hunting maps contain enemies.
    m.danger=['paleo-deep','bronze-grove','go-outskirts','bronze-outskirts'].includes(m.id)?'high':
      m.entities.some(e=>e.type==='enemy')?'medium':'safe';
  }
}
