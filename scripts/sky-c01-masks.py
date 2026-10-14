"""Original cloud profile authoring source. Pillow/numpy/scipy; no downloaded artwork.
R=antialiased coverage, G=relative height/density, B=broad paint plane.
Run from repo root: python3 scripts/sky-c01-masks.py
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.interpolate import PchipInterpolator

NAMES=['Long shoulder','Leaning tower','Low broken bank','Unequal twins',
       'Wind shelf','High western shoulder','Dissolving fragment','Small ridge']
# Irregular silhouette anchors: curves interpolate the drawn outline, never circles.
TOPS=[
 [0,.13,.21,.18,.34,.47,.49,.36,.24,.29,.20,.13,.16,0],
 [0,.10,.18,.13,.24,.31,.26,.45,.65,.60,.41,.28,.14,0],
 [0,.14,.23,.24,.31,.24,.29,.19,.22,.26,.19,.24,.12,0],
 [0,.17,.29,.38,.45,.34,.23,.29,.44,.51,.43,.25,.13,0],
 [0,.07,.12,.15,.21,.19,.26,.34,.37,.32,.23,.16,.09,0],
 [0,.17,.33,.51,.62,.59,.43,.39,.28,.24,.18,.20,.10,0],
 [0,.07,.15,.21,.27,.28,.25,.21,.16,.18,.12,.07,.06,0],
 [0,.10,.20,.17,.26,.36,.32,.29,.42,.41,.28,.18,.12,0],
]
BOTTOMS=[
 [0,-.04,-.07,-.10,-.10,-.09,-.12,-.11,-.09,-.08,-.10,-.06,-.04,0],
 [0,-.05,-.09,-.11,-.12,-.11,-.10,-.11,-.13,-.11,-.10,-.07,-.03,0],
 [0,-.04,-.05,-.06,-.06,-.08,-.07,-.06,-.07,-.05,-.05,-.04,-.02,0],
 [0,-.04,-.09,-.11,-.11,-.12,-.10,-.11,-.09,-.10,-.08,-.05,-.03,0],
 [0,-.03,-.04,-.06,-.06,-.07,-.09,-.08,-.07,-.06,-.05,-.03,-.02,0],
 [0,-.05,-.08,-.10,-.13,-.12,-.13,-.12,-.10,-.07,-.06,-.04,-.03,0],
 [0,-.025,-.05,-.055,-.045,-.065,-.04,-.03,-.055,-.04,-.02,-.03,-.02,0],
 [0,-.03,-.06,-.08,-.09,-.08,-.10,-.11,-.09,-.06,-.07,-.06,-.03,0],
]
size=256
atlas=np.zeros((size*2,size*4,3),dtype=np.uint8)
tiles=[]
xs=np.linspace(-1,1,14)
x,y=np.meshgrid(np.linspace(-1.15,1.15,size),np.linspace(.80,-.65,size))
for i,(top,bottom) in enumerate(zip(TOPS,BOTTOMS)):
    t=PchipInterpolator(xs,top)(np.clip(x,-1,1))
    b=PchipInterpolator(xs,bottom)(np.clip(x,-1,1))
    # Fine contour strokes are restrained to <2% of half-width.
    yy=y+.010*np.sin(x*25+i*1.7)+.006*np.sin(x*42-i)
    dist=np.minimum(np.minimum(t-yy,yy-b),1-np.abs(x))
    alpha=np.clip(dist/.009+.5,0,1); alpha=alpha*alpha*(3-2*alpha)
    height=np.clip((yy-b)/np.maximum(t-b,.02),0,1)
    # Two large paint planes, no sphere normals or per-puff crater shading.
    paint=.5+.24*np.sin(x*5.3+y*3.5+i*1.8)+.09*np.cos(x*9-y*5+i)
    tile=np.stack([alpha,height,np.clip(paint,0,1)],axis=2)
    tile[alpha==0,0]=0
    atlas[(i//4)*size:(i//4+1)*size,(i%4)*size:(i%4+1)*size]=np.round(tile*255).astype(np.uint8)
    tiles.append((alpha,height,paint))
Path('src/assets').mkdir(exist_ok=True)
Image.fromarray(atlas).save('src/assets/sky-c01-cloud-atlas.png',optimize=True)
# Direction sheet uses original masks, not concept images masquerading as game captures.
sheet=Image.new('RGB',(1120,660),'#192c40'); d=ImageDraw.Draw(sheet)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',20)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',14)
d.text((24,20),'SKY-C01 | Eight original shape identities',font=font,fill='#edf1e8')
d.text((24,52),'Authoring sheet — these are mask profiles, not verified game renders.',font=small,fill='#b6c7d4')
for i,(alpha,height,paint) in enumerate(tiles):
    lit=.43+.38*np.clip((height-.08)/.78,0,1)+.10*(paint-.5)
    col=np.array([.50,.62,.72])[None,None,:]*(1-lit[:,:,None])+np.array([.94,.95,.91])[None,None,:]*lit[:,:,None]
    sky=np.array([.44,.59,.71])[None,None,:]
    rgb=(col*alpha[:,:,None]+sky*(1-alpha[:,:,None]))*255
    xx=24+(i%4)*274; yy=100+(i//4)*260
    sheet.paste(Image.fromarray(rgb.astype(np.uint8)).resize((250,220)),(xx,yy))
    d.text((xx,yy+226),f'{i+1:02} {NAMES[i]}',font=small,fill='#edf1e8')
d.text((24,624),'Rules: asymmetric shoulders · calm bases · broad paint planes · generous clear-sky intervals',font=small,fill='#c5d7c9')
sheet.save('docs/sky-c01/direction.jpg',quality=92)
print('Authored 1024x512 RGB atlas and direction sheet')
