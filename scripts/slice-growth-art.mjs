// Source paintings are retained beside this script's metadata; output sprites are cropped from equal atlas cells.
import {execFileSync} from 'node:child_process';
const py = `from PIL import Image\nfrom pathlib import Path\nroot=Path.cwd()\nout=root/'dist/assets/maps'\ndef slice_atlas(source, names, cols, rows, prefix):\n im=Image.open(root/'scripts/art/source-growth'/source).convert('RGBA')\n w,h=im.size\n for i,name in enumerate(names):\n  cell=im.crop((i%cols*w//cols,i//cols*h//rows,(i%cols+1)*w//cols,(i//cols+1)*h//rows))\n  if prefix=='horse-':
   alpha=cell.getchannel('A'); aw,ah=cell.size; aa=list(alpha.getdata()); seen=set(); groups=[]
   for start,val in enumerate(aa):
    if val<8 or start in seen: continue
    stack=[start]; seen.add(start); group=[]
    while stack:
     k=stack.pop();group.append(k);x=k%aw;y=k//aw
     for q in (k-1 if x else -1,k+1 if x<aw-1 else -1,k-aw if y else -1,k+aw if y<ah-1 else -1):
      if q>=0 and q not in seen and aa[q]>=8:seen.add(q);stack.append(q)
    groups.append(group)
   if groups:
    keep=set(max(groups,key=len)); pixels=list(cell.getdata())
    cell.putdata([pix if i in keep else (0,0,0,0) for i,pix in enumerate(pixels)])
  bbox=cell.getchannel('A').getbbox()\n  if not bbox: raise RuntimeError(name)\n  crop=cell.crop(bbox)\n  if prefix=='horse-':\n   side=max(crop.size);square=Image.new('RGBA',(side,side));square.paste(crop,((side-crop.width)//2,(side-crop.height)//2));crop=square\n  crop.save(out/(prefix+name+'.png'),optimize=False)\n  if (out/(prefix+name+'.png')).stat().st_size < 1000: raise RuntimeError('Empty sprite: '+name)\nslice_atlas('buildings-atlas.png',['house','hall','granary','festival','farm-shed','fish-rack'],3,2,'growth-')\nslice_atlas('npcs-atlas.png',['elder','builder','resident','guard'],4,1,'growth-npc-')\nslice_atlas('horse-atlas.png',[d+'-'+p for p in ['idle','walk'] for d in ['front','left','back','right']],4,2,'horse-')\nprint('18 growth and horse sprites written')`;
execFileSync('python3',['-c',py],{stdio:'inherit'});
