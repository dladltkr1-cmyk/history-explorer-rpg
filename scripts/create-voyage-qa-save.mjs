import {mkdirSync,writeFileSync} from 'node:fs';
globalThis.Image=class{set src(v){}get complete(){return false}};
const {fresh,validate}=await import('../dist/state.js?v=56');const {prepareAncientQA}=await import('../dist/ancient-state.js?v=56');
mkdirSync('qa/v56',{recursive:true});
for(const country of ['baekje','goguryeo','silla'])for(const stage of ['voyage-start','voyage-failed','voyage-help','finale-full','finale-done']){
 const s=fresh('v56 항해검수','boy');prepareAncientQA(s,stage,{country});Object.assign(s,{map:'ancient-han',x:18,y:6.4,introSeen:true,basicTutorialDone:true,audioMuted:true,coins:100,xp:0,personalCode:null});s.ancient.home.reputation=0;s.appearance={hair:3,eyes:1,skin:1,hairColor:1,outfit:1};const ready=validate(s);
 // A genuine v55-shaped wait save has no voyage or owned-exhibit fields.
 if(stage==='voyage-start'){delete ready.ancient.voyage;delete ready.ancient.home.ownedExhibits;}
 writeFileSync('qa/v56/'+country+'-'+stage+'.json',JSON.stringify(ready));
}
