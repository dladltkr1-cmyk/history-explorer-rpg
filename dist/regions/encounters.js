// Candidate habitats are filtered against collisions and important objects at runtime.
export const HABITATS={boar:[[4,4],[6,10],[14,4],[16,11],[20,10],[10,12]],wolf:[[3,12],[14,2],[19,13],[7,13],[19,4],[5,6]],snake:[[5,12],[13,5],[18,13],[19,6]],bear:[[5,5],[17,5],[19,13],[8,13]],tiger:[[18,5],[6,13],[16,12]],bandit:[[6,9],[10,7],[14,9],[20,8],[12,12]]};
export const ENCOUNTER_MAPS={'paleo-forest':['boar','wolf','snake'],'paleo-deep':['wolf','snake','bear'],'pre-forest':['boar','wolf','snake'],'neo-river':['boar','snake','wolf'],'go-field':['boar','wolf'],'go-dolmen':['wolf','bandit'],'go-outskirts':['wolf','bear','bandit','tiger'],'bronze-hill':['wolf','snake'],'bronze-outskirts':['bandit','boar','wolf','bear'],'bronze-grove':['wolf','bear','snake','tiger']};
export const ENCOUNTER_STEP_DISTANCE=12,ENCOUNTER_CHANCE=.12;
export const ENCOUNTER_CHANCES={'paleo-forest':.09,'paleo-deep':.17,'pre-forest':.09,'neo-river':.08,'go-field':.08,'go-outskirts':.18,'bronze-hill':.08,'bronze-outskirts':.18,'bronze-grove':.19};
Object.assign(ENCOUNTER_MAPS,{
  'nation-iron-outskirts':['boar','wolf','bandit'],
  'nation-buyeo-road':['boar','wolf'],
  'nation-buyeo-forest':['wolf','boar'],
  'nation-goguryeo-road':['boar','wolf'],
  'nation-goguryeo-forest':['wolf','boar'],
  'nation-okjeo-road':['snake','boar'],
  'nation-okjeo-river':['boar','snake'],
  'nation-dongye-border':['wolf','snake'],
  'nation-dongye-forest':['snake','wolf'],
  'nation-samhan-mahan':['boar','wolf'],
  'nation-samhan-byeonhan':['wolf','boar']
});
for(const id of Object.keys(ENCOUNTER_MAPS).filter(id=>id.startsWith('nation-')))
  ENCOUNTER_CHANCES[id]=.09;
