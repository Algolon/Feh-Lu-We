# VIS-R01AB: 2x crops round the view centre (the views look at the grove centre): rows = distances, cols = builds.
# python3 scripts/vis-r01-crops.py OUT.jpg EVIDENCE_DIR "prod-...,a-...,b-..." "d080,d065,d055" [cropW cropH]
import sys
from PIL import Image, ImageDraw
out, ev, cols, rows = sys.argv[1], sys.argv[2], sys.argv[3].split(','), sys.argv[4].split(',')
cw, ch = (int(sys.argv[5]), int(sys.argv[6])) if len(sys.argv) > 6 else (300, 110)
S = 2
sheet = Image.new('RGB', (cw * S * len(cols), ch * S * len(rows)), 'black')
d = ImageDraw.Draw(sheet)
for j, r in enumerate(rows):
    for i, c in enumerate(cols):
        im = Image.open(f'{ev}/{c}-{r}.jpg')
        x0, y0 = im.width // 2 - cw // 2, int(im.height * 0.5) - ch // 2
        sheet.paste(im.crop((x0, y0, x0 + cw, y0 + ch)).resize((cw * S, ch * S), Image.LANCZOS), (i * cw * S, j * ch * S))
        t = f'{c.split("-")[0]}  {r}'
        d.rectangle([i * cw * S, j * ch * S, i * cw * S + 8 + 7 * len(t), j * ch * S + 16], fill='black')
        d.text((i * cw * S + 4, j * ch * S + 2), t, fill='white')
sheet.save(out, quality=88)
