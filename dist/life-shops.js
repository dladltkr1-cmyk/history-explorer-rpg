// Physical shop access shared by the UI and every purchase mutation.
export const LIFE_SHOPS={
 seed:{name:'씨앗 가게',at:[11.5,3.8],merchant:'씨앗 상인',line:'밭에는 잡곡을, 논에는 벼를 심어 보렴.',art:'seeds'},
 tool:{name:'생활도구 가게',at:[12.8,7.2],merchant:'생활도구 상인',line:'농사와 조리를 조금 편하게 해 주는 도구들이야.',art:'tools'},
 wood:{name:'목공소',at:[20.3,3.8],merchant:'마을 목수',line:'목재와 집 확장, 수레 제작을 이곳에서 맡고 있어.',art:'wood'},
 decor:{name:'살림 가게',at:[18,7.6],merchant:'살림 상인',line:'집과 마당에 어울리는 살림을 골라 보렴.',art:'decor'},
};
export const SHOP_MERCHANT={x:5,y:3.6};
export const shopMap=(country,kind)=>'ancient-shop-'+country+'-'+kind;
export const shopDoor=kind=>'life-shop-'+kind;
export function atLifeShop(s,kind){return Boolean(LIFE_SHOPS[kind]&&s.ancient?.country&&s.ancient.home?.owned&&s.map===shopMap(s.ancient.country,kind)&&Number.isFinite(s.x)&&Number.isFinite(s.y)&&Math.hypot(s.x-SHOP_MERCHANT.x,s.y-SHOP_MERCHANT.y)<1.65);}
export function buyShopHide(s){if(!atLifeShop(s,'tool')||s.coins<30||(s.inventory.hide||0)>=99999)return false;s.coins-=30;s.inventory.hide=(s.inventory.hide||0)+1;return true;}
export const WOOD_REGROW_MS=180000;
export const woodId=(country,n)=>'life-wood-'+country+'-'+n;
export const WOOD_SPOTS=[[3.8,11.8],[4.7,14.5]];
export function woodReady(s,id,now=Date.now()){return (s.resources?.[id]?.nextAt||0)<=now;}
export function collectWood(s,id,now=Date.now()){
 const country=s.ancient?.country,n=[1,2].find(n=>id===woodId(country,n)),at=WOOD_SPOTS[(n||0)-1];
 if(!country||!s.ancient.home?.owned||s.map!=='ancient-village-'+country||!at||!Number.isFinite(now)||now<=0||Math.hypot(s.x-at[0],s.y-at[1])>=1.65||!woodReady(s,id,now)||(s.inventory.lumber||0)>=99999)return false;
 s.resources??={};s.resources[id]={nextAt:now+WOOD_REGROW_MS,slot:0};s.inventory.lumber=(s.inventory.lumber||0)+1;return true;
}
