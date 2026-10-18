// Shared location checks. Never trust an open window as authority to mutate a save.
export const marketMap=c=>'ancient-market-'+c;
export const forestMap=c=>'ancient-forest-'+c;
export const BOARD={x:11,y:11},TRADER={x:15,y:12},WORKBENCH={x:17,y:8};
export function nearLife(s,map,p,r=1.65){return Boolean(s.ancient?.country&&s.ancient.home?.owned&&s.map===map&&Number.isFinite(s.x)&&Number.isFinite(s.y)&&Math.hypot(s.x-p.x,s.y-p.y)<r);}
export const atBoard=s=>nearLife(s,'ancient-village-'+s.ancient?.country,BOARD);
export const atTrader=s=>nearLife(s,marketMap(s.ancient?.country),TRADER);
export const atYard=s=>Boolean(s.ancient?.home?.owned&&s.ancient.country&&s.map==='ancient-yard-'+s.ancient.country);
export const atWorkbench=s=>atYard(s)&&s.ancient.home.level>=2&&nearLife(s,s.map,WORKBENCH);
export const canTrade=s=>!s.map?.startsWith('ancient-')||atTrader(s);
