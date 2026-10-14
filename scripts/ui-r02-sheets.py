"""Arrange actual browser captures for review, without altering the captured scenes/UI.
Usage: python3 scripts/ui-r02-sheets.py BASELINE_DIR [PILOT_DIR] [OUTPUT_DIR]
Pillow is required only for this optional evidence packaging step.
"""
from pathlib import Path
import hashlib
import json
import shutil
import sys
from PIL import Image, ImageDraw, ImageFont

baseline = Path(sys.argv[1])
pilot = Path(sys.argv[2] if len(sys.argv) > 2 else 'scripts/out/ui-r02')
output = Path(sys.argv[3] if len(sys.argv) > 3 else 'docs/ui-r02/evidence')
output.mkdir(parents=True, exist_ok=True)
font = ImageFont.truetype('DejaVuSans.ttf', 15)
index = []

def sheet(name, rows):
    sizes = [[Image.open(path).size for path, _ in row] for row in rows]
    width = max(sum(w for w, h in row) for row in sizes)
    height = sum(max(h for w, h in row) + 34 for row in sizes)
    canvas = Image.new('RGB', (width, height), '#17221d')
    draw = ImageDraw.Draw(canvas)
    y = 0
    entries = []
    for row, dimensions in zip(rows, sizes):
        x = 0
        for (path, title), (w, h) in zip(row, dimensions):
            draw.text((x + 12, y + 9), title, font=font, fill='#f1ebdc')
            with Image.open(path) as source:
                canvas.paste(source.convert('RGB'), (x, y + 34))
            entries.append({'source': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'title': title, 'position': [x, y + 34], 'size': [w, h]})
            x += w
        y += max(h for w, h in dimensions) + 34
    target = output / name
    canvas.save(target, quality=91, subsampling=0)
    index.append({'file': name, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'tiles': entries, 'processing': 'native-size arrangement; caption bands; JPEG encoding only'})

sheet('before-after.jpg', [
    [(baseline / 'boslust-exploration.jpg', 'Production baseline · BOSLUST · 852 × 393'), (pilot / 'phone-boslust-exploration.jpg', 'Woodland Archive pilot · same pose / viewport')],
    [(baseline / 'boslust-notebook-evidence.jpg', 'Production notebook · Aanwijzingen · same recorded clues'), (pilot / 'phone-boslust-notebook-evidence.jpg', 'Pilot notebook · Aanwijzingen · same recorded clues')],
])
sheet('mobile-states.jpg', [
    [(pilot / 'phone-context-action.jpg', 'Real reticle action · Bekijken: gravure'), (pilot / 'phone-held-feedback.jpg', 'Selected item + real message · capture hold 12 s')],
    [(pilot / 'phone-notebook-map.jpg', 'Existing map / discovery filters · notebook route'), (pilot / 'phone-notebook-memory.jpg', 'Recorded lake-bench memory · real inspect action')],
])
sheet('small-landscape.jpg', [
    [(pilot / 'small-boslust-exploration.jpg', 'Smaller landscape · 640 × 360'), (pilot / 'small-home-tutorial.jpg', 'Tutorial layout fixture · coaching + checklist')],
    [(pilot / 'small-boslust-notebook-evidence.jpg', 'Notebook · independent content scroll'), (pilot / 'small-context-action.jpg', 'Actual contextual action · 640 × 360')],
])
sheet('desktop.jpg', [
    [(pilot / 'desktop-boslust-exploration.jpg', 'Desktop · 1440 × 900 · normal exploration')],
    [(pilot / 'desktop-boslust-notebook-evidence.jpg', 'Desktop notebook · same BOSLUST pose')],
])
sheet('contrast.jpg', [[
    (pilot / 'phone-boslust-dark.jpg', 'Actual world · dusk fixture initially .95 · lighting unchanged'),
    (pilot / 'phone-garden-bright.jpg', 'Actual world · bright garden · production start phase'),
]])
sheet('portrait.jpg', [[
    (pilot / 'portrait-boslust-exploration.jpg', 'Portrait fallback · 393 × 852'),
    (pilot / 'portrait-boslust-notebook-evidence.jpg', 'Portrait notebook · stacked index'),
]])
for src, name in [('phone-boslust-exploration.jpg', 'phone-exploration.jpg'), ('phone-boslust-notebook-evidence.jpg', 'phone-notebook.jpg')]:
    shutil.copyfile(pilot / src, output / name)
    index.append({'file': name, 'source': src, 'sha256': hashlib.sha256((output / name).read_bytes()).hexdigest(), 'processing': 'unaltered browser screenshot'})
(output / 'sheets.json').write_text(json.dumps(index, indent=2) + '\n')
print(f'{len(index)} review images; {sum(p.stat().st_size for p in output.glob("*.jpg")) / 1024 / 1024:.2f} MiB')
