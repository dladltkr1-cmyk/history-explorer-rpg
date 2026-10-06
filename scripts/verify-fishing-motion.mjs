import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {JSDOM}=await import(process.env.HISTORY_JSDOM_MODULE||'jsdom');
const css=await readFile(new URL('../dist/revision.css',import.meta.url),'utf8');
const dom=new JSDOM('<style></style><div class="fishing-water"><span class="water-ring"></span><span class="fishing-float"></span></div>');
dom.window.document.querySelector('style').textContent=css;
const rules=dom.window.document.styleSheets[0].cssRules;
const water=dom.window.document.querySelector('.fishing-water');
const float=dom.window.document.querySelector('.fishing-float');
const ring=dom.window.document.querySelector('.water-ring');
function matchedRules(reduced,list=rules){
  return [...list].flatMap(rule=>{
    if(rule.selectorText)return [rule];
    if(rule.type===4&&/prefers-reduced-motion\s*:\s*reduce/.test(rule.conditionText)&&reduced)return matchedRules(reduced,rule.cssRules);
    return [];
  });
}
function value(element,property,reduced){
  let result='',winning=-1;
  for(const rule of matchedRules(reduced))for(const selector of rule.selectorText.split(',')){
    if(!element.matches(selector))continue;
    const v=rule.style.getPropertyValue(property);if(!v)continue;
    const weight=(selector.match(/#/g)||[]).length*100+(selector.match(/\./g)||[]).length*10;
    if(weight>=winning){winning=weight;result=v;}
  }
  return result;
}
for(const reduced of [false,true])for(const phase of ['waiting','biting','']){
  water.className='fishing-water'+(phase?' '+phase:'');
  assert.match(value(float,'animation',reduced),/^fishing-bob /,'float must keep animating');
  assert.match(value(ring,'animation',reduced),/^fishing-ripple /,'ripple must keep animating');
  assert.equal(value(water,'--fishing-bob-height',reduced),reduced?'2px':'5px');
  assert.equal(value(water,'--fishing-bob-tilt',reduced),reduced?'1deg':'6deg');
  if(reduced){
    assert.equal(value(float,'animation-duration',true),phase==='biting'?'.4s':'2.8s');
    assert.equal(value(ring,'animation-duration',true),'4s');
    assert.equal(value(water,'--fishing-ripple-start',true),'.95');
    assert.equal(value(water,'--fishing-ripple-end',true),'1.1');
  }
}
const frames=[...rules].filter(r=>r.type===7&&/^fishing-/.test(r.name));
assert.equal(frames.length,2);
assert.match(frames.find(r=>r.name==='fishing-bob').cssText,/var\(--fishing-bob-height\)/);
assert.match(frames.find(r=>r.name==='fishing-ripple').cssText,/var\(--fishing-ripple-end\)/);
console.log('Fishing motion: actual parsed CSS cascade for normal/reduced motion × waiting/bite/timing; gentle animation remains active, with smaller/slower movement.');
