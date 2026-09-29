from PIL import Image, ImageDraw
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / 'dist' / 'assets'
OUT = ROOT / 'player' / 'mounted'
OUT.mkdir(parents=True, exist_ok=True)
W = 80
H = 120
S = 4
CELL = 256
RIDER_HEIGHT = 384

# Outfit palette follows the six existing avatar outfits, in saved-ID order.
OUTFITS = [
    ('#236783','#16455e','#dbac4d','#1e4757','#463323'),
    ('#b67b36','#744923','#eee0b6','#4c5330','#523729'),
    ('#9e3829','#5d2822','#c78045','#303f3b','#423027'),
    ('#e8ae38','#ba7625','#e8cf68','#304d6a','#36434b'),
    ('#eeeae1','#c8c4bb','#292b2c','#e8e6db','#c4ad8b'),
    ('#125c87','#0d345b','#3296aa','#172b4d','#171d2a'),
]
SKINS = [('#f3ceac','#d59d75'),('#e3b78a','#b87b52'),('#bd8760','#925b3a'),('#80583f','#593b30')]
INK = '#292725'

def poly(d, points, fill, outline=INK):
    points=[(x*S,y*S) for x,y in points]
    d.polygon(points, fill=fill)
    if outline: d.line(points + [points[0]], fill=outline, width=S, joint='curve')

def line(d, points, fill, width=2): d.line([(x*S,y*S) for x,y in points], fill=fill, width=width*S, joint='curve')

def rider(outfit, skin, direction, gait):
    main, shade, accent, pants, boots = OUTFITS[outfit]
    flesh, flesh_shade = SKINS[skin]
    far = Image.new('RGBA',(W*S,H*S)); core = Image.new('RGBA',(W*S,H*S)); near = Image.new('RGBA',(W*S,H*S))
    f,c,n = (ImageDraw.Draw(i) for i in (far,core,near))
    bob = 1 if gait == 1 else 0
    # A seated figure is drawn from fresh shapes, never extracted from walking bodies.
    if direction == 'side':
        # Far calf disappears behind the horse; only its stirrup and shoe peek out.
        poly(f,[(45,65+bob),(52,68+bob),(50,77+bob),(47,84+bob),(43,83+bob),(45,73+bob)],pants)
        poly(f,[(42,82+bob),(48,82+bob),(49,87+bob),(40,87+bob)],boots)
        poly(c,[(34,37+bob),(44,36+bob),(49,43+bob),(47,59+bob),(45,66+bob),(34,66+bob),(30,58+bob),(30,44+bob)],main)
        poly(c,[(33,56+bob),(47,57+bob),(48,65+bob),(33,66+bob)],shade)
        # Bent upper leg follows the saddle; the near shin hangs beside the flank.
        poly(n,[(37,63+bob),(49,63+bob),(47,70+bob),(31,74+bob),(26,71+bob),(31,67+bob)],pants)
        poly(n,[(27,71+bob),(34,72+bob),(35,82+bob),(32,90+bob),(27,89+bob),(28,81+bob)],pants)
        if outfit==5:
            poly(n,[(28,77+bob),(34,77+bob),(34,84+bob),(28,84+bob)],flesh)
            line(n,[(28,84+bob),(33,84+bob)],'#ece7dc',2)
        poly(n,[(27,86+bob),(33,87+bob),(36,91+bob),(27,92+bob),(25,90+bob)],boots)
        poly(n,[(31,40+bob),(36,42+bob),(34,51+bob),(28,56+bob),(22,54+bob),(21,51+bob),(27,49+bob)],main)
        poly(n,[(21,50+bob),(25,51+bob),(24,57+bob),(20,58+bob),(18,55+bob)],flesh)
        line(ImageDraw.Draw(core),[(34,42+bob),(40,43+bob)],accent,2)
        if outfit==4: line(c,[(35,40+bob),(43,48+bob),(36,54+bob)],shade,2)
        if outfit==5: line(c,[(40,40+bob),(40,60+bob)],accent,2)
    else:
        # Both shoulders and thighs are visible, but the horse covers the pelvis.
        poly(f,[(30,62+bob),(38,64+bob),(35,75+bob),(30,84+bob),(25,82+bob),(27,73+bob)],pants)
        poly(f,[(43,64+bob),(50,62+bob),(54,74+bob),(56,83+bob),(51,85+bob),(46,75+bob)],pants)
        if outfit==5:
            poly(f,[(26,75+bob),(34,76+bob),(31,82+bob),(25,82+bob)],flesh)
            poly(f,[(48,76+bob),(55,75+bob),(56,82+bob),(50,82+bob)],flesh)
        poly(f,[(24,81+bob),(31,81+bob),(31,87+bob),(22,87+bob)],boots)
        poly(f,[(50,81+bob),(57,81+bob),(59,87+bob),(49,87+bob)],boots)
        poly(c,[(31,38+bob),(48,38+bob),(52,43+bob),(50,64+bob),(46,68+bob),(34,68+bob),(29,63+bob),(28,44+bob)],main)
        poly(c,[(32,59+bob),(49,59+bob),(48,67+bob),(33,67+bob)],shade)
        poly(n,[(29,42+bob),(33,43+bob),(31,57+bob),(27,67+bob),(23,66+bob),(25,55+bob)],main)
        poly(n,[(48,43+bob),(52,42+bob),(56,55+bob),(57,65+bob),(53,67+bob),(49,56+bob)],main)
        poly(n,[(22,64+bob),(28,64+bob),(27,70+bob),(23,71+bob)],flesh)
        poly(n,[(52,64+bob),(58,64+bob),(59,70+bob),(54,71+bob)],flesh)
        if outfit==4:
            line(c,[(33,40+bob),(41,52+bob),(47,40+bob)],shade,3)
            line(c,[(31,61+bob),(49,61+bob)],INK,2)
        elif outfit==5:
            line(c,[(38,40+bob),(38,60+bob)],accent,2)
            line(c,[(44,40+bob),(44,60+bob)],accent,2)
        else: line(c,[(39,40+bob),(39,58+bob)],accent,2)
    if outfit==0: line(c,[(33,57+bob),(46,57+bob)],accent,2)
    if outfit==1: line(c,[(35,40+bob),(35,57+bob),(45,57+bob),(45,40+bob)],shade,2)
    if outfit==2: line(c,[(34,42+bob),(47,42+bob)],accent,2)
    if outfit==3: line(c,[(34,55+bob),(47,55+bob)],shade,2)
    return far,core,near

# 6 outfits × 4 skins × 3 directions (front, side, back) × 3 poses.
for layer in range(3):
    atlas=Image.new('RGBA',(12*CELL,18*RIDER_HEIGHT))
    for outfit in range(6):
        for skin in range(4):
            for direction in range(3):
                for gait in range(3):
                    index=outfit*36+skin*9+direction*3+gait
                    tile=rider(outfit,skin,'side' if direction==1 else 'back' if direction==2 else 'front',gait)[layer]
                    tile=tile.resize((CELL,RIDER_HEIGHT),Image.Resampling.LANCZOS)
                    atlas.alpha_composite(tile,((index%12)*CELL,(index//12)*RIDER_HEIGHT))
    atlas.save(OUT / ('far.png','body.png','near.png')[layer],optimize=True)

# Preserve the full horse drawing so it reduces as smoothly as the walking avatar.
horse_atlas=Image.new('RGBA',(4*CELL,3*CELL))
for di,direction in enumerate(('front','back','left','right')):
    idle_raw=Image.open(ROOT/'maps'/f'horse-{direction}-idle.png').convert('RGBA').resize((CELL,CELL),Image.Resampling.LANCZOS)
    idle_box=idle_raw.getchannel('A').point(lambda p:255 if p>=16 else 0).getbbox()
    for gait in range(3):
        pose = 'idle' if gait == 0 else 'walk'
        original=Image.open(ROOT/'maps'/f'horse-{direction}-{pose}.png').convert('RGBA')
        colors=original.resize((CELL,CELL),Image.Resampling.LANCZOS)
        if gait:
            box=colors.getchannel('A').point(lambda p:255 if p>=16 else 0).getbbox()
            fitted=colors.crop(box).resize((idle_box[2]-idle_box[0],idle_box[3]-idle_box[1]),Image.Resampling.LANCZOS)
            aligned=Image.new('RGBA',(CELL,CELL));aligned.alpha_composite(fitted,idle_box[:2]);colors=aligned
        if gait==2:
            # A second stride with the weight shifted and a slight body bob.
            shifted=Image.new('RGBA',(CELL,CELL)); shifted.alpha_composite(colors,(0,-3));colors=shifted
        horse_atlas.alpha_composite(colors,(di*CELL,gait*CELL))
horse_atlas.save(OUT/'horse.png',optimize=True)
