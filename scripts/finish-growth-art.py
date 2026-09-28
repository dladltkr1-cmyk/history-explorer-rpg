"""Extract full transparent assets and remove atlas gutter fragments."""
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage

root=Path(__file__).parents[1]
maps=root/'dist/assets/maps'

def components(path,count):
    source=Image.open(path).convert('RGBA');arr=np.array(source)
    labels,_=ndimage.label(arr[:,:,3]>30,np.ones((3,3)))
    areas=np.bincount(labels.ravel());areas[0]=0
    boxes=ndimage.find_objects(labels)
    ids=sorted(np.argsort(areas)[-count:],key=lambda i:(boxes[i-1][0].start//450,boxes[i-1][1].start))
    return [(source.crop((b[1].start,b[0].start,b[1].stop,b[0].stop)),labels[b]==i) for i in ids for b in [boxes[i-1]]]

def write(crop,mask,path,size=320):
    arr=np.array(crop);arr[~mask]=0
    image=Image.fromarray(arr)
    image.thumbnail((size-24,size-24),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(size,size))
    canvas.alpha_composite(image,((size-image.width)//2,size-12-image.height))
    canvas.save(path)

horse=components(root/'scripts/art/horse-finish.png',8)
# The component sort uses row bands; preserve the four authored directions in each row.
horse=sorted(horse,key=lambda v:(0 if v[0].height>360 else 1)) if False else horse
for i,(im,mask) in enumerate(horse):
    direction=('front','back','left','right')[i%4]
    pose=('idle','walk')[i//4]
    write(im,mask,maps/f'horse-{direction}-{pose}.png')
buildings=components(root/'scripts/art/buildings-finish.png',5)
for (im,mask),name in zip(buildings,('growth-house','growth-hall','growth-granary','growth-festival','growth-farm-shed')):
    write(im,mask,maps/f'{name}.png')

# Existing production crops: retain all connected parts of the principal object,
# eliminate isolated slivers, and leave transparent margin on every side.
for name in ('growth-fish-rack','growth-npc-elder','growth-npc-builder','growth-npc-resident','growth-npc-guard'):
    path=maps/f'{name}.png';source=Image.open(path).convert('RGBA');arr=np.array(source)
    labels,_=ndimage.label(arr[:,:,3]>30,np.ones((3,3)))
    areas=np.bincount(labels.ravel());areas[0]=0
    dominant=int(np.argmax(areas)); keep=(labels==dominant)
    ys,xs=np.where(keep)
    write(source.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1)),keep[ys.min():ys.max()+1,xs.min():xs.max()+1],path)
