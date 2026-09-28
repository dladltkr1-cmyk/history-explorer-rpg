export const ASSETS={knife:'/assets/items/weapons/knife.png',club:'/assets/items/weapons/club.png',leatherIcon:'/assets/items/armor/leather.png',meat:'/assets/items/food/meat.png',goHouse:'/assets/maps/go-house.png',storage:'/assets/maps/storage.png',palisade:'/assets/maps/palisade.png',goTree:'/assets/maps/go-tree.png',boy:'/assets/player/boy.png',girl:'/assets/player/girl.png',elder:'/assets/npc/elder.png',farmer:'/assets/npc/farmer.png',shopkeeper:'/assets/npc/shopkeeper.png',researcher:'/assets/npc/researcher.png',tree:'/assets/maps/tree.png',pine:'/assets/maps/pine.png',rock:'/assets/maps/rock.png',prehut:'/assets/maps/prehut.png',hut:'/assets/maps/hut.png',portal:'/assets/maps/portal.png',boar:'/assets/enemies/boar.png',wolf:'/assets/enemies/wolf.png',bandit:'/assets/enemies/bandit.png',berries:'/assets/items/berries.png',chest:'/assets/items/chest.png',campfire:'/assets/items/campfire.png',handaxe:'/assets/artifacts/handaxe.png',pottery:'/assets/artifacts/pottery.png',spindle:'/assets/artifacts/spindle.png',sickle:'/assets/artifacts/sickle.png',dagger:'/assets/artifacts/dagger.png',dolmen:'/assets/artifacts/dolmen.png',mirror:'/assets/artifacts/mirror.png'};
Object.assign(ASSETS,{fish:'/assets/items/food/fish.png',cookedfish:'/assets/items/food/cooked-fish.png',rawmeat:'/assets/items/food/raw-meat.png',grain:'/assets/items/food/millet-grain.png',rice:'/assets/items/food/rice-bowl.png',ricecrop:'/assets/items/food/rice-stalk.png',shelter:'/assets/maps/shelter-lean-to.png',caveEntrance:'/assets/maps/cave-entrance.png'});
for(const avatar of ['boy','girl'])for(const pose of ['back-idle','left-idle','front-walk-1','front-walk-2','back-walk-1','back-walk-2','left-walk-1','left-walk-2'])ASSETS[avatar+'-'+pose]='/assets/player/directions/'+avatar+'-'+pose+'.png?v=27.3';

ASSETS.hide='/assets/items/hide.png';
Object.assign(ASSETS,{snake:'/assets/enemies/snake.png',bear:'/assets/enemies/bear.png',tiger:'/assets/enemies/tiger.png'});

Object.assign(ASSETS,{
  growthHouse:'/assets/maps/growth-house.png',growthHall:'/assets/maps/growth-hall.png',growthGranary:'/assets/maps/growth-granary.png',
  growthFestival:'/assets/maps/growth-festival.png',growthShed:'/assets/maps/growth-farm-shed.png',growthFish:'/assets/maps/growth-fish-rack.png',
  growthElder:'/assets/maps/growth-npc-elder.png',growthBuilder:'/assets/maps/growth-npc-builder.png',growthResident:'/assets/maps/growth-npc-resident.png',growthGuard:'/assets/maps/growth-npc-guard.png'
});
for(const direction of ['front','left','back','right'])for(const pose of ['Idle','Walk'])ASSETS['horse'+direction[0].toUpperCase()+direction.slice(1)+pose]='/assets/maps/horse-'+direction+'-'+pose.toLowerCase()+'.png?v=31.1';
for(const direction of ['front','back','left','right'])for(const pose of ['idle','walk-1','walk-2'])ASSETS['mounted-'+direction+'-'+pose]='/assets/player/mounted/'+direction+'-'+pose+'.png?v=31.1';
ASSETS.coin='/assets/items/coin.svg?v=31.1';
ASSETS.roomDoor='/assets/maps/room-door.svg?v=31.1';
