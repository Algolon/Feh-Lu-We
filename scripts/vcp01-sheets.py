"""Compose genuine rendered frames; no retouching or generated imagery."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root=Path('docs/vcp01');out=root/'compare';out.mkdir(exist_ok=True)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
def sheet(name,shots,mode=''):
    W,H=844,195;rh=H+28
    im=Image.new('RGB',(W,48+len(shots)*rh),'#211d19');d=ImageDraw.Draw(im)
    d.text((12,10),'PRODUCTION BASELINE',font=font,fill='#e5d8be');d.text((434,10),'VCP-01 PILOT',font=font,fill='#e5d8be')
    for i,shot in enumerate(shots):
        y=48+i*rh;d.text((12,y+3),shot.replace('-',' ')+' | '+(mode[1:] or 'standard'),font=small,fill='#e5d8be')
        for j,variant in enumerate(['production','pilot']):
            p=root/'frames'/variant/(shot+mode+'.jpg')
            frame=Image.open(p).resize((422,H),Image.Resampling.LANCZOS)
            im.paste(frame,(j*422,y+28))
    im.save(out/(name+'.jpg'),quality=88,optimize=True)
shots=['library-wide','table-near','seating-near','globe-3m','library-alternate']
for mode in ['', '-clay','-neutral']:sheet('library'+(mode or '-standard'),shots,mode)
for mode in ['', '-clay','-neutral']:sheet('globe'+(mode or '-standard'),['globe-1m','globe-side','globe-rear'],mode)
# Portrait kept native-width, paired. Labels do not cover the rendered viewport.
im=Image.new('RGB',(780,882),'#211d19');d=ImageDraw.Draw(im)
for i,variant in enumerate(['production','pilot']):
 d.text((i*390+12,10),variant.upper(),font=font,fill='#e5d8be')
 im.paste(Image.open(root/'frames'/variant/'globe-portrait.jpg'),(i*390,38))
im.save(out/'portrait.jpg',quality=88,optimize=True)
