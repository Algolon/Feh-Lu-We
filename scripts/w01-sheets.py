# DEV-04D W01 review sheets: before / after pairs of the matched views and the frame sequences as strips.
# Usage: python3 scripts/w01-sheets.py [docs/dev04d/w01]   (reads before/ and after/, writes sheets/)
import json, os, sys
from PIL import Image, ImageDraw

ROOT = sys.argv[1] if len(sys.argv) > 1 else 'docs/dev04d/w01'
B, A, S = (os.path.join(ROOT, d) for d in ('before', 'after', 'sheets'))
os.makedirs(S, exist_ok=True)

def label(img, text):
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 8 + 7 * len(text), 18], fill=(0, 0, 0))
    d.text((4, 3), text, fill=(255, 255, 255))
    return img

rows = {r['name'] + '-' + r['fmt']: r for r in json.load(open(os.path.join(A, 'views.json')))['rows']}
before_rows = {r['name'] + '-' + r['fmt']: r for r in json.load(open(os.path.join(B, 'views.json')))['rows']} if os.path.exists(os.path.join(B, 'views.json')) else {}
pairs = sorted(f[:-4] for f in os.listdir(A) if f.startswith('v') and f.endswith('.jpg'))
for name in pairs:
    a = Image.open(os.path.join(A, name + '.jpg'))
    bp = os.path.join(B, name + '.jpg')
    b = Image.open(bp) if os.path.exists(bp) else Image.new('RGB', a.size, (40, 40, 40))
    land = a.width > a.height
    sheet = Image.new('RGB', (a.width, a.height * 2) if land else (a.width * 2, a.height), (0, 0, 0))
    rb, ra = before_rows.get(name, {}), rows.get(name, {})
    sheet.paste(label(b, f"BEFORE 752cb02  {rb.get('calls', '-')} calls / {rb.get('triangles', '-')} tris"), (0, 0))
    sheet.paste(label(a, f"W01  {ra.get('stage', '')}  {ra.get('calls', '-')} calls / {ra.get('triangles', '-')} tris"), (0, a.height) if land else (a.width, 0))
    sheet.save(os.path.join(S, f'pair-{name}.jpg'), quality=80)

for seq in ('s1-candle-sweep', 's2-burn', 's3-clean', 's4-refill'):
    frames = sorted((f for f in os.listdir(A) if f.startswith(seq + '-')), key=lambda f: float(f[len(seq) + 1:-5].replace('p', '.')))
    if not frames: continue
    ims = [Image.open(os.path.join(A, f)) for f in frames]
    w, h = ims[0].width // 2, ims[0].height // 2
    cols = 4 if len(ims) > 6 else 3
    nrow = (len(ims) + cols - 1) // cols
    sheet = Image.new('RGB', (w * cols, h * nrow), (0, 0, 0))
    for i, (im, f) in enumerate(zip(ims, frames)):
        sheet.paste(label(im.resize((w, h)), f[len(seq) + 1:-4].replace('p', '.')), ((i % cols) * w, (i // cols) * h))
    sheet.save(os.path.join(S, f'{seq}.jpg'), quality=80)
print('sheets in', S)
