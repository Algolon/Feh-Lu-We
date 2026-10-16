#!/usr/bin/env python3
"""SKY-C01-R01 evidence sheets from real game-canvas PNGs (no paintover). Requires Pillow + numpy.
Usage: python3 scripts/sky-c01-r01-sheets.py <qa-output-dir> <diag-output-dir> <docs-dir>"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFont

qa, diag, docs = (Path(p) for p in sys.argv[1:4])
docs.mkdir(parents=True, exist_ok=True)
try:
    FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 17)
except OSError:
    FONT = ImageFont.load_default()

def img(path): return Image.open(path).convert('RGB')
def arr(path): return np.asarray(img(path)).astype(int)
def fit(im, w):
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
def label(im, text):
    out = Image.new('RGB', (im.width, im.height + 28), (24, 24, 28))
    out.paste(im, (0, 28)); ImageDraw.Draw(out).text((8, 5), text, fill=(235, 235, 235), font=FONT)
    return out
def grid(cells, cols, gap=6):
    w = max(c.width for c in cells); rows = [cells[i:i + cols] for i in range(0, len(cells), cols)]
    hs = [max(c.height for c in r) for r in rows]
    out = Image.new('RGB', (cols * w + (cols - 1) * gap, sum(hs) + gap * (len(rows) - 1)), (24, 24, 28))
    y = 0
    for r, h in zip(rows, hs):
        for i, c in enumerate(r): out.paste(c, (i * (w + gap), y))
        y += h + gap
    return out
def save(im, name):
    im.save(docs / name, quality=88, optimize=True); print(name, im.size)
def busiest(diff, w, h):
    """Top-left of the w x h window holding the most changed pixels."""
    c = np.pad((diff > 0).astype(np.int64).cumsum(0).cumsum(1), ((1, 0), (1, 0)))
    s = c[h:, w:] - c[:-h, w:] - c[h:, :-w] + c[:-h, :-w]
    y, x = np.unravel_index(np.argmax(s), s.shape); return int(x), int(y)

# 1. Mechanism: UB map on the dome triangulation, stale-lane emulation, fixed render. Desktop High, daylight.
for pose in ['sky', 'wide']:
    tag = f'desktop-high-{pose}-0'
    after, stale = qa / f'{tag}-after.png', qa / f'{tag}-stale-before.png'
    d = np.abs(arr(after) - arr(stale)).max(axis=2)
    x, y = busiest(d, 320, 180)
    box = (x, y, x + 320, y + 180)
    zoom = lambda p, k=1.0: ImageEnhance.Contrast(img(p).crop(box)).enhance(k).resize((960, 540), Image.NEAREST)
    cells = [label(fit(img(qa / f'{tag}-ubmap-before.png'), 960), 'Pre-fix: orange (tone-mapped red) = quads with undefined fwidth'),
             label(zoom(stale, 3), 'Pre-fix, GPU stale-lane EMULATION, 3x zoom, contrast x3'),
             label(zoom(after, 3), 'Fixed, same frame/crop, contrast x3 (no lines)'),
             label(fit(img(after), 960), f'Fixed render, full frame (crop box {box})')]
    save(grid(cells, 2), f'mechanism-{pose}.jpg')

wire = diag / 'desktop-sky-ubmap-wire.png'
if wire.exists():
    save(label(fit(img(wire), 1280), 'Pre-fix UB map (orange after tone mapping) vs dome triangulation (magenta): unrelated'), 'ubmap-vs-dome.jpg')

# 2. Native before / after, identical conditions (pixel-identical: diff shown amplified x50).
cells = []
for tag in ['desktop-high-sky-0', 'portrait-high-north-0', 'landscape-low-wide-0']:
    b, a = qa / f'{tag}-before.png', qa / f'{tag}-after.png'
    if not (a.exists() and b.exists()): continue
    d = np.abs(arr(a) - arr(b)).max(axis=2)
    amp = Image.fromarray(np.minimum(d * 50, 255).astype(np.uint8)).convert('RGB')
    w = 520
    cells += [label(fit(img(b), w), f'Before (production) {tag}'), label(fit(img(a), w), 'After (fix)'), label(fit(amp, w), f'|diff| x50: max {d.max()}, {int((d > 0).sum())} px')]
save(grid(cells, 3), 'before-after-native.jpg')

# 3. Four light phases x views, fixed shader (desktop High and portrait High).
for layout, w in [('desktop-high', 420), ('portrait-high', 210)]:
    cells = []
    for pose in ['sky', 'wide', 'edge', 'sunset', 'arrival']:
        for t in range(4):
            p = qa / f'{layout}-{pose}-{t}-after.png'
            if p.exists(): cells.append(label(fit(img(p), w), f'{pose} phase {t}'))
    if cells: save(grid(cells, 4), f'phases-{layout}.jpg')

# 4. Rotation and vertical camera, Low/High and portrait/landscape.
cells = []
for tag in ['desktop-low', 'landscape-high', 'portrait-low']:
    for n in ['turn-0', 'turn-90', 'turn-180', 'turn-270', 'pole-0']:
        p = qa / f'{tag}-{n}-after.png'
        if p.exists(): cells.append(label(fit(img(p), 300), f'{tag} {n}'))
if cells: save(grid(cells, 5), 'turns-pole.jpg')

# 5. Dome density / per-fragment ray (pre-fix build, diag harness): differences are rounding only.
cells = []
for v, text in [('A-48x24', 'dome 48x24 vs 24x12'), ('A-64x32', 'dome 64x32 vs 24x12'), ('A-ray', 'camera ray vs interpolated vDir')]:
    a, b = diag / 'desktop-sky-A.png', diag / f'desktop-sky-{v}.png'
    if not b.exists(): continue
    d = np.abs(arr(a) - arr(b)).max(axis=2)
    cells.append(label(fit(Image.fromarray(np.minimum(d * 60, 255).astype(np.uint8)).convert('RGB'), 520), f'{text}: max {d.max()}/255, x60'))
if cells: save(grid(cells, 3), 'dome-ray-diffs.jpg')

# 6. B (review-only masks): explicit-gradient lookup vs implicit, same frame.
cells = []
for tag in ['desktop-high-sky-0', 'portrait-high-wide-0']:
    a, b = qa / f'{tag}-masks-after.png', qa / f'{tag}-masks-before.png'
    if a.exists() and b.exists():
        d = np.abs(arr(a) - arr(b)).max(axis=2)
        cells += [label(fit(img(b), 480), f'B before {tag}'), label(fit(img(a), 480), f'B after (textureGrad), max diff {d.max()}')]
if cells: save(grid(cells, 2), 'masks-b.jpg')

(docs / 'sheets.json').write_text(json.dumps({'sheets': sorted(p.name for p in docs.glob('*.jpg')),
  'note': 'Composed from real game-canvas PNGs of scripts/sky-c01-r01-qa.mjs and -diag.mjs; regenerate rather than edit.'}, indent=1))
