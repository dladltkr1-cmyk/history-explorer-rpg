import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {HOME_PALETTES} from '../dist/homestead.js?v=51.1';
const root=new URL('../dist/assets/shops/',import.meta.url);await mkdir(root,{recursive:true});
const p=(d,f,s='#624c35',w=3)=>`<path d="${d}" fill="${f}" stroke="${s}" stroke-width="${w}"/>`,l=(d,c='#dbc29c',w=2)=>p(d,'none',c,w),r=(x,y,w,h,f)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${f}" stroke="#624c35" stroke-width="3"/>`,e=(x,y,rx,ry,f,s='none')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" stroke="${s}" stroke-width="2"/>`;
const svg=(b,w=256,h=224)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><g stroke-linecap="round" stroke-linejoin="round">${b}</g></svg>`;
const sack=(x,y,c='#c8b281')=>p(`M${x-13} ${y-25} Q${x} ${y-31} ${x+13} ${y-25} L${x+22} ${y+8} Q${x+18} ${y+22} ${x} ${y+23} Q${x-22} ${y+21} ${x-22} ${y+7}Z`,c)+l(`M${x-12} ${y-21}H${x+12} M${x-6} ${y-7}l11 8 M${x-6} ${y}l11 8`,'#947845',3);
const jar=(x,y,c)=>p(`M${x-10} ${y-21} L${x+10} ${y-21} Q${x+9} ${y-15} ${x+18} ${y-8} Q${x+23} ${y+12} ${x+9} ${y+18} H${x-9} Q${x-23} ${y+12} ${x-18} ${y-8} Q${x-9} ${y-15} ${x-10} ${y-21}Z`,c)+e(x,y-21,10,3,'#72523c')+l(`M${x-15} ${y}Q${x} ${y+6} ${x+16} ${y}`,'#d1b58d');
const wheel=(x,y,rad=24)=>`<circle cx="${x}" cy="${y}" r="${rad}" fill="#ac8658" stroke="#654932" stroke-width="4"/>`+l(`M${x-rad+4} ${y}H${x+rad-4} M${x} ${y-rad+4}V${y+rad-4} M${x-13} ${y-13}l26 26 M${x+13} ${y-13}l-26 26`,'#6b4e33',3)+e(x,y,4,4,'#5b4430');
const logs=(x,y)=>[[-12,0],[12,0],[0,-15]].map(([dx,dy])=>r(x-42+dx,y-10+dy,67,15,'#937047')+e(x+25+dx,y-2+dy,8,8,'#d0b484','#795736')+e(x+25+dx,y-2+dy,4,4,'none','#a38b64')).join('');
const bench=(x,y)=>p(`M${x-38} ${y-14} L${x+28} ${y-26} L${x+44} ${y-9} L${x-25} ${y+4}Z`,'#b08c5d')+l(`M${x-28} ${y+1}V${y+25} M${x+33} ${y-9}V${y+19}`,'#795739',6);
const tools=(x,y)=>l(`M${x-12} ${y+23}V${y-32} M${x+13} ${y+25}L${x+23} ${y-31}`,'#916b44',5)+p(`M${x-26} ${y-35}H${x+2}L${x-1} ${y-24}H${x-26}Z`,'#7a9291')+p(`M${x+22} ${y-35}Q${x+54} ${y-30} ${x+30} ${y-6} Q${x+44} ${y-26} ${x+22} ${y-24}Z`,'#8d9c96');
const role={seed:sack(49,176)+sack(78,184,'#d6bf80')+bench(184,176)+sack(186,147),tool:tools(74,160)+bench(171,177)+tools(180,155)+r(31,168,44,24,'#9b7953'),wood:logs(60,181)+bench(157,169)+wheel(215,163)+l('M117 173L153 159 M130 174L168 160','#816143',4),decor:jar(46,180,'#a47a56')+jar(77,188,'#746c55')+bench(175,178)+r(161,145,41,22,'#9d7450')+p('M158 103H209V142L195 136L181 143L158 137Z','#a46856')+l('M165 111H203 M165 124H203','#d8b692',3)};
for(const [country,c]of Object.entries(HOME_PALETTES))for(const kind of Object.keys(role)){
 const open=kind==='tool'||kind==='wood';let b=e(128,208,118,10,'#53482e').replace('fill="#53482e"','fill="#53482e" opacity=".12"');
 b+=p('M29 104L136 75L227 104V193L124 213L29 185Z',c.wall)+p('M124 113L227 104V193L124 213Z','#b89d76')+r(100,139,48,60,'#584731');
 if(open)b+=p('M37 122L88 110V178L37 165Z','#6a5942')+r(153,118,57,49,'#695942');else b+=p('M37 119L81 108V139L37 149Z','#746c54')+l('M44 125L77 117 M44 133L77 125','#d6bf97',3);
 b+=p(kind==='wood'?'M18 105L110 33L243 82L231 109L125 126Z':'M12 109L106 30L244 91L230 115L124 133Z',c.roof)+p('M12 109L106 30L124 133Z',c.roofLight)+l('M34 104L107 45 M53 109L112 60 M74 116L116 81 M133 52L228 95 M130 70L225 109',c.roofLight,3);
 b+=l('M34 110V183 M126 133V208 M223 112V190',c.wood,6);
 if(kind==='seed')b+=p('M37 139L103 124L111 150L43 163Z','#b4a173')+l('M42 160V187 M108 150V191',c.wood,4);
 if(kind==='decor')b+=p('M155 123H210V153L198 145L181 155L155 145Z','#7a8c80')+l('M163 130H203 M163 143H203','#cab68c',2);
 b+=role[kind]+p('M95 203L147 194L159 208L108 217Z','#c9b496');
 await writeFile(new URL(country+'-'+kind+'.svg',root),svg(b));
}
for(const kind of Object.keys(role)){
 const b='<g transform="translate(-22 -14) scale(.78)">'+role[kind]+'</g>';
 await writeFile(new URL('prop-'+kind+'.svg',root),svg(b,160,160));
 const counter=bench(80,88)+(kind==='seed'?sack(70,56):kind==='tool'?tools(84,48):kind==='wood'?logs(83,62):jar(74,58,'#a47a56')+jar(101,63,'#8e7864'));
 await writeFile(new URL('counter-'+kind+'.svg',root),svg(counter,160,160));
 const base=kind==='seed'?'farmer':kind==='wood'?'elder':'shopkeeper';
 const data=(await readFile(new URL('../dist/assets/npc/'+base+'.png',import.meta.url))).toString('base64');
 const prop=kind==='seed'?sack(105,190):kind==='tool'?tools(114,176):kind==='wood'?logs(87,206):p('M90 164H131V216L110 209L90 217Z','#a66956')+l('M95 175H126 M95 188H126','#d9b58d',3);
 await writeFile(new URL('merchant-'+kind+'.svg',root),svg(`<svg x="12" y="0" width="132" height="236" viewBox="${base==='shopkeeper'?'0 0 116 240':'64 15 128 225'}" preserveAspectRatio="xMidYMax meet"><image href="data:image/png;base64,${data}" width="${base==='shopkeeper'?116:256}" height="${base==='shopkeeper'?240:256}"/></svg>`+prop,160,240));
}
await writeFile(new URL('wood-pile.svg',root),svg(logs(83,105)+l('M29 130L93 144 M51 146L122 126','#92734c',5),160,160));
await writeFile(new URL('wood-empty.svg',root),svg(l('M38 128L90 141 M68 144L116 132','#928163',3)+e(82,142,53,5,'#a39a79'),160,160));
await writeFile(new URL('sign.svg',root),svg(r(77,57,7,94,'#947147')+r(29,30,105,71,'#c9b085')+l('M43 48H120 M43 65H120 M43 82H111','#88643f',3),160,160));
console.log('27 shop assets: 12 distinct country buildings, four role merchants, eight interior props, wood states/sign.');
