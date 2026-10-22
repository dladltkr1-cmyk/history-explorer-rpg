import {mkdirSync,writeFileSync} from 'node:fs';
globalThis.Image=class{set src(v){}get complete(){return false}};
const {fresh,validate}=await import('../dist/state.js?v=55');const {prepareAncientQA}=await import('../dist/ancient-state.js?v=55');
mkdirSync('qa/v55',{recursive:true});
for(const country of ['baekje','goguryeo','silla'])for(const stage of ['4c-done','escort-start','escort-ambush','escort-cp1','escort-cp2','escort-exit','escort-zero','escort-one','escort-both']){
 const s=fresh('v55 검수','boy');const f=prepareAncientQA(s,stage,{country});Object.assign(s,{map:f.map,x:12,y:6,introSeen:true,basicTutorialDone:true,audioMuted:true,coins:100,xp:0,personalCode:null});s.ancient.home.reputation=0;s.appearance={hair:3,eyes:1,skin:1,hairColor:1,outfit:1};
 writeFileSync('qa/v55/'+country+'-'+stage+'.json',JSON.stringify(validate(s)));
}
