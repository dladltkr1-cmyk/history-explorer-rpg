"""Cut the transparent four-direction mounted character sheet into independent frames."""
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage

source=Image.open(Path(__file__).parent/'art/mounted-source.png').convert('RGBA')
out=Path(__file__).parents[1]/'dist/assets/player/mounted'
out.mkdir(parents=True,exist_ok=True)
cell_w,cell_h=source.width//4,source.height//3
for row,pose in enumerate(('idle','walk-1','walk-2')):
    for col,direction in enumerate(('front','back','left','right')):
        x0,y0=col*cell_w,row*cell_h
        cell=source.crop((x0,y0,x0+cell_w,y0+cell_h))
        data=np.array(cell)
        mask=data[:,:,3]>28
        labels,count=ndimage.label(mask,np.ones((3,3)))
        sizes=np.bincount(labels.ravel());sizes[0]=0
        if count:
            # Remove isolated remnants from the adjoining grid cell.
            keep=labels==int(np.argmax(sizes))
            data[~keep]=0
        ys,xs=np.where(data[:,:,3]>20)
        if not len(xs): raise ValueError((direction,pose))
        crop=Image.fromarray(data).crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
        canvas=Image.new('RGBA',(256,256))
        crop.thumbnail((226,226),Image.Resampling.LANCZOS)
        canvas.alpha_composite(crop,((256-crop.width)//2,244-crop.height))
        canvas.save(out/f'{direction}-{pose}.png')
