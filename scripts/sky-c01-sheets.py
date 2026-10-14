"""Contact sheets from real canvas captures, no crops/paintovers. Pillow required.
python3 scripts/sky-c01-sheets.py RAW_DIRECTORY OUTPUT_DIRECTORY
"""
import sys,json,hashlib
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
raw,out=map(Path,sys.argv[1:3]);out.mkdir(parents=True,exist_ok=True)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',20)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15)
variants=['production','procedural','masks']; labels=['Huidige productie','A | Procedureel','B | Getekende maskers']
phases=['Daylight','Golden afternoon','Blue hour','Late dusk']
manifest=[]
def add(sheet,file,x,y,w,h):
    im=Image.open(raw/file).convert('RGB');sheet.paste(im.resize((w,h),Image.Resampling.LANCZOS),(x,y))
    manifest.append(dict(rawFile=file,rawSHA256=hashlib.sha256((raw/file).read_bytes()).hexdigest(),sheet=current,rectangle=[x,y,w,h]))
def header(sheet,title,colw):
    d=ImageDraw.Draw(sheet);d.text((20,16),'SKY-C01 | '+title,font=font,fill='#edf1e8')
    d.text((20,46),'Actual Three.js game | SwiftShader | matching camera / phase / quality',font=small,fill='#b9cbd8')
    for i,t in enumerate(labels):d.text((20+i*colw,80),t,font=small,fill='#edf1e8')
for name in ['sky','garden','arrival','woodland']:
 for layout in ['landscape','portrait']:
    w,h=(430,194) if layout=='landscape' else (240,533)
    colw=w+20;rowh=h+45
    current=f'{name}-{layout}.jpg';sheet=Image.new('RGB',(colw*3+20,115+rowh*4),'#192c40');header(sheet,name+' | '+layout+' | Low',colw)
    d=ImageDraw.Draw(sheet)
    for phase in range(4):
      yy=115+phase*rowh;d.text((20,yy),phases[phase],font=small,fill='#b9cbd8')
      for i,v in enumerate(variants):add(sheet,f'{name}-{phase}-{layout}-low-{v}.jpg',20+i*colw,yy+24,w,h)
    sheet.save(out/current,quality=91,optimize=True)
current='comparison.jpg';sheet=Image.new('RGB',(1370,1120),'#192c40');header(sheet,'Owner comparison',450);d=ImageDraw.Draw(sheet)
for row,(name,phase,layout,y,w,h) in enumerate([('arrival',0,'landscape',140,430,194),('arrival',0,'portrait',380,240,533),('woodland',3,'landscape',960,430,194)]):
    # Extend summary if needed, retaining full portrait and landscape frames.
    if y+h>sheet.height:
      extended=Image.new('RGB',(sheet.width,y+h+22),'#192c40');extended.paste(sheet,(0,0));sheet=extended;d=ImageDraw.Draw(sheet)
    d.text((20,y-27),f'{name} | {phases[phase]} | {layout} | Low',font=small,fill='#b9cbd8')
    for i,v in enumerate(variants):add(sheet,f'{name}-{phase}-{layout}-low-{v}.jpg',20+i*450+(430-w)//2,y,w,h)
sheet.save(out/current,quality=93,optimize=True)
for category,turns in [('turns',[0,90,180,270]),('seam',[359.9,.1])]:
    current=f'{category}.jpg';sheet=Image.new('RGB',(1370,115+239*len(turns)),'#192c40');header(sheet,category+' | Daylight | Low',450);d=ImageDraw.Draw(sheet)
    for j,angle in enumerate(turns):
      yy=115+j*239;d.text((20,yy),f'Azimuth {angle} degrees',font=small,fill='#b9cbd8')
      for i,v in enumerate(variants):add(sheet,f'turn-{angle}-0-landscape-low-{v}.jpg',20+i*450,yy+24,430,194)
    sheet.save(out/current,quality=91,optimize=True)
current='quality.jpg';sheet=Image.new('RGB',(1370,115+239*4),'#192c40');header(sheet,'Low / High | arrival',450);d=ImageDraw.Draw(sheet)
for j,(phase,q) in enumerate([(0,'low'),(0,'high'),(3,'low'),(3,'high')]):
    yy=115+j*239;d.text((20,yy),phases[phase]+' | '+q,font=small,fill='#b9cbd8')
    for i,v in enumerate(variants):add(sheet,f'arrival-{phase}-landscape-{q}-{v}.jpg',20+i*450,yy+24,430,194)
sheet.save(out/current,quality=91,optimize=True)
(out/'sheet-manifest.json').write_text(json.dumps(manifest,indent=2))
print('Saved twelve sheets and raw-to-sheet provenance manifest')
