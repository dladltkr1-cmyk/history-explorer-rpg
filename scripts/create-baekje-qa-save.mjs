globalThis.Image=class{set src(v){} get complete(){return false;}};
const {fresh,validate}=await import('../dist/state.js?v=55');
const {prepareAncientQA}=await import('../dist/ancient-state.js?v=55');
const {roomLayout}=await import('../dist/homestead.js?v=55');
const {mkdirSync,writeFileSync}=await import('node:fs');
mkdirSync('qa/v54',{recursive:true});
for(const country of ['baekje','goguryeo','silla']){
const s=fresh('한강 검수','boy');prepareAncientQA(s,{index:20},{country});s.map='ancient-home-'+country;const p=roomLayout(s.ancient.home.level).points['ancient-chapters'];s.x=p[0];s.y=p[1]+1;Object.assign(s,{introSeen:true,basicTutorialDone:true,audioMuted:true,coins:100,personalCode:null});s.ancient.home.reputation=0;writeFileSync('qa/v54/'+country+'-start.json',JSON.stringify(validate(s)));
}
