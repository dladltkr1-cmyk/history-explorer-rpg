export const ASSETS={knife:'/assets/items/weapons/knife.png',club:'/assets/items/weapons/club.png',leatherIcon:'/assets/items/armor/leather.png',meat:'/assets/items/food/meat.png',goHouse:'/assets/maps/go-house.png',storage:'/assets/maps/storage.png',palisade:'/assets/maps/palisade.png',goTree:'/assets/maps/go-tree.png',boy:'/assets/player/boy.png',girl:'/assets/player/girl.png',elder:'/assets/npc/elder.png',farmer:'/assets/npc/farmer.png',shopkeeper:'/assets/npc/shopkeeper.png',researcher:'/assets/npc/researcher.png',tree:'/assets/maps/tree.png',pine:'/assets/maps/pine.png',rock:'/assets/maps/rock.png',prehut:'/assets/maps/prehut.png',hut:'/assets/maps/hut.png',portal:'/assets/maps/portal.png',boar:'/assets/enemies/boar.png',wolf:'/assets/enemies/wolf.png',bandit:'/assets/enemies/bandit.png',berries:'/assets/items/berries.png',chest:'/assets/items/chest.png',campfire:'/assets/items/campfire.png',handaxe:'/assets/artifacts/handaxe.png',pottery:'/assets/artifacts/pottery.png',spindle:'/assets/artifacts/spindle.png',sickle:'/assets/artifacts/sickle.png',dagger:'/assets/artifacts/dagger.png',dolmen:'/assets/artifacts/dolmen.png',mirror:'/assets/artifacts/mirror.png'};
Object.assign(ASSETS,{fish:'/assets/items/food/fish.png',cookedfish:'/assets/items/food/cooked-fish.png',rawmeat:'/assets/items/food/raw-meat.png',grain:'/assets/items/food/millet-grain.png',rice:'/assets/items/food/rice-bowl.png',ricecrop:'/assets/items/food/rice-stalk.png',shelter:'/assets/maps/shelter-lean-to.png',caveEntrance:'/assets/maps/cave-entrance.png'});
for(const avatar of ['boy','girl'])for(const pose of ['back-idle','left-idle','front-walk-1','front-walk-2','back-walk-1','back-walk-2','left-walk-1','left-walk-2'])ASSETS[avatar+'-'+pose]='/assets/player/directions/'+avatar+'-'+pose+'.png?v=27.3';

ASSETS.hide='/assets/items/hide.png';
for(const country of ['goguryeo','baekje','silla'])for(const level of [1,2,3,4])ASSETS['life-home-'+country+'-'+level]='/assets/life/home-'+country+'-'+level+'.svg?v=49';
for(const crop of ['millet','barnyard','sorghum','barley','ricecrop'])for(const kind of ['crop','seed','growing','ripe'])ASSETS['life-'+kind+'-'+crop]='/assets/life/'+kind+'-'+crop+'.svg?v=49';
for(const id of ['clayJar','stripedJar','darkJar','reedMat','wovenMat','clayLamp','doubleLamp','woodBox','lowTable','wallWeave','herbPot','dyedCloth','lumber','board','workbench','cart','empty-field','empty-paddy'])ASSETS['life-'+id]='/assets/life/'+id+'.svg?v=49';
for(const [key,file]of Object.entries({ancientHomeNorth:'home-north',ancientHomeRiver:'home-river',ancientHomePlain:'home-plain',ancientVillageHouse:'village-house',ancientShed:'shed',ancientEgg:'egg',ancientMarker:'marker',ancientWell:'well',ancientDesk:'desk',ancientDisplay:'display'}))ASSETS[key]='/assets/ancient/'+file+'.svg?v=44.2';
for(const [key,file] of Object.entries({threadIcon:'thread',branchIcon:'branch',boneIcon:'bone',needleIcon:'needle',rodIcon:'rod',fishingSpotIcon:'spot'}))ASSETS[key]='/assets/items/fishing/'+file+'.svg';
Object.assign(ASSETS,{snake:'/assets/enemies/snake.png',bear:'/assets/enemies/bear.png',tiger:'/assets/enemies/tiger.png'});
ASSETS.bandit='/assets/enemies/bandit-v43.png';

Object.assign(ASSETS,{
  growthHouse:'/assets/maps/growth-house.png',growthHall:'/assets/maps/growth-hall.png',growthGranary:'/assets/maps/growth-granary.png',
  growthFestival:'/assets/maps/growth-festival.png',growthShed:'/assets/maps/growth-farm-shed.png',growthFish:'/assets/maps/growth-fish-rack.png',
  growthElder:'/assets/maps/growth-npc-elder.png',growthBuilder:'/assets/maps/growth-npc-builder.png',growthResident:'/assets/maps/growth-npc-resident.png',growthGuard:'/assets/maps/growth-npc-guard.png'
});
for(const direction of ['front','left','back','right'])for(const pose of ['Idle','Walk'])ASSETS['horse'+direction[0].toUpperCase()+direction.slice(1)+pose]='/assets/maps/horse-'+direction+'-'+pose.toLowerCase()+'.png?v=31.1';
ASSETS.coin='/assets/items/coin.svg?v=31.1';
ASSETS.roomDoor='/assets/maps/room-door.svg?v=31.1';
for(const kind of ['Bed','Shelf','Bench','Sack','Jar'])ASSETS['room'+kind]='/assets/maps/room-'+kind.toLowerCase()+'.svg?v=31.2';
Object.assign(ASSETS,{
  bronzeKnifeIcon:'/assets/items/gear/bronze-knife.svg', bronzeArmorIcon:'/assets/items/gear/bronze-armor.svg', bronzeCharmIcon:'/assets/items/gear/bronze-charm.svg',
  ironSwordIcon:'/assets/items/gear/iron-sword.svg', ironArmorIcon:'/assets/items/gear/iron-armor.svg', ironCharmIcon:'/assets/items/gear/iron-charm.svg'
});

// Existing NPC rasters retain their established faces, outlines and pixel density.
Object.assign(ASSETS,{ancientHelperNorth:ASSETS.farmer,ancientHelperRiver:ASSETS.shopkeeper,ancientHelperPlain:ASSETS.elder,ancientHorsePost:'/assets/ancient/horse-post.svg?v=44.2'});

Object.assign(ASSETS,{kingJumong:'/assets/ancient/jumong-v44.png',kingOnjo:'/assets/ancient/onjo-v44.png',kingHyeokgeose:'/assets/ancient/hyeokgeose-v44.png',kingSuro:'/assets/ancient/suro-v44.png'});
for(const id of ['requestBoard','cart-empty','cart-loaded','cart-plan','seedBag','sickle','hearth','fineBedding','grainRack','woodShelf','wovenScreen','yardArbor','diningSet'])ASSETS['life-'+id]='/assets/life2/'+id+'.svg?v=49';
