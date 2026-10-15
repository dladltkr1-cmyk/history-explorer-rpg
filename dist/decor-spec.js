// World-pixel sizes, stable floor anchors and uses. Currency/item definitions stay in homestead.js.
export const DECOR_VISUALS={
 clayJar:{w:54,h:68},stripedJar:{w:58,h:74},darkJar:{w:62,h:78},
 reedMat:{w:118,h:68,floor:true},wovenMat:{w:126,h:76,floor:true},
 clayLamp:{w:58,h:66,use:'lamp',label:'불 켜기'},doubleLamp:{w:74,h:78,use:'lamp',label:'불 켜기'},
 woodBox:{w:88,h:76},lowTable:{w:114,h:90,use:'sit',label:'앉기'},
 wallWeave:{w:86,h:92,wall:true},herbPot:{w:74,h:98},dyedCloth:{w:88,h:106,wall:true},
 fineBedding:{w:142,h:116,floor:true,use:'rest',label:'휴식하기',large:true},
 grainRack:{w:122,h:126,use:'harvest',label:'곡식 살펴보기',large:true},
 woodShelf:{w:108,h:148,large:true},wovenScreen:{w:106,h:132,wall:true},
 yardArbor:{w:206,h:194,use:'shade',label:'그늘에서 쉬기',large:true},
 diningSet:{w:148,h:114,use:'sit',label:'앉기',large:true},
};
export const isLamp=id=>DECOR_VISUALS[id]?.use==='lamp';
export const decorDescription=id=>({rest:'누워 쉬기 · 기존 집 휴식 효과',sit:'앉아 쉬기 · 보상 없음',lamp:'불 켜기·끄기 · 켜짐 상태 저장',harvest:'지금까지 수확한 작물 기록 보기',shade:'그늘에서 쉬기 · 보상 없음'}[DECOR_VISUALS[id]?.use]||'공간을 꾸미는 살림');
export function decorAnchor(slot,level,dimensions,id){
 const [w,h]=dimensions,v=DECOR_VISUALS[id]||{};
 if(slot.area==='yard')return {'yard-1':[4.2,7.1],'yard-2':[19.5,5.7],'yard-3':[3.4,11.3],'yard-4':[21,12],'yard-5':[12,16]}[slot.id];
 const points={'room-1':[2.8,h-2.1],'room-2':[3.0,v.wall?2.3:4.05],'room-3':[w*.52,h*.50+.15],'room-4':[w-2.6,v.wall?2.3:4.05],'room-5':[w-2.5,h*.64],'room-6':[w*.32,h*.55],'room-7':[w*.61,v.wall?2.3:4.0]};
 return points[slot.id];
}
