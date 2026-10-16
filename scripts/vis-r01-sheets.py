# VIS-R01AB comparison sheets: rows = distances, columns = builds/variants (labels burnt in).
# python3 scripts/vis-r01-sheets.py OUT.jpg EVIDENCE_DIR "prod-low-landscape-day-multidraw,a-...,b-..." "d120,d100,..." [width]
import sys
from PIL import Image, ImageDraw
out, ev, cols, rows = sys.argv[1], sys.argv[2], sys.argv[3].split(','), sys.argv[4].split(',')
W = int(sys.argv[5]) if len(sys.argv) > 5 else 457
ims = [[Image.open(f'{ev}/{c}-{r}.jpg') for c in cols] for r in rows]
h = round(ims[0][0].height * W / ims[0][0].width)
sheet = Image.new('RGB', (W * len(cols), h * len(rows)), 'black')
d = ImageDraw.Draw(sheet)
for j, r in enumerate(rows):
    for i, c in enumerate(cols):
        sheet.paste(ims[j][i].resize((W, h)), (i * W, j * h))
        t = f'{c.split("-")[0]}  {r}'
        d.rectangle([i * W, j * h, i * W + 8 + 7 * len(t), j * h + 16], fill='black')
        d.text((i * W + 4, j * h + 2), t, fill='white')
sheet.save(out, quality=86)
