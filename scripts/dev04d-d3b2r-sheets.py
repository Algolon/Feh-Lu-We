#!/usr/bin/env python3
# DEV-04D D3-b2R evidence sheets (non-functional tooling). From the matched SET=d3b2r captures of the three builds
# (prod = production 752cb02, d3b2 = D3-b2 b2c4ae7, d3b2r = this refinement), writes:
#   compare/<pose>.jpg               production | D3-b2 | D3-b2R at 915 × 412 (the refinement's own delta is the right pair)
#   compare/<pose>-dusk.jpg / -clay.jpg   the same at late dusk / in clay
#   sheets/<room>-<variant>.jpg      per room: every pose, three columns, for 915 / 1280 / portrait / dusk / clay
#   scale/sloop.jpg, scale/moon.jpg  the scale A / B (identical builds except the scale)
# Usage: python3 scripts/dev04d-d3b2r-sheets.py [docs/dev04d/d3b2r]
import os, sys, glob
from PIL import Image, ImageDraw, ImageFont

D = sys.argv[1] if len(sys.argv) > 1 else 'docs/dev04d/d3b2r'
for sub in ('compare', 'sheets'):
    os.makedirs(f'{D}/{sub}', exist_ok=True)
try:
    FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
except OSError:
    FONT = ImageFont.load_default()
COLS = [('prod', 'production 752cb02'), ('d3b2', 'D3-b2 b2c4ae7'), ('d3b2r', 'D3-b2R')]
ROOMS = {'re': 'reiskamer', 'sk': 'sterrenkamer', 'gu': 'guest-room'}


def row(paths, labels, w=None):
    ims = [Image.open(p).convert('RGB') for p in paths]
    if w:
        ims = [im.resize((w, round(im.height * w / im.width))) for im in ims]
    bar, gap = 24, 6
    out = Image.new('RGB', (sum(i.width for i in ims) + gap * (len(ims) - 1), ims[0].height + bar), (24, 24, 24))
    d, x = ImageDraw.Draw(out), 0
    for im, lab in zip(ims, labels):
        out.paste(im, (x, bar))
        d.text((x + 6, 4), lab if im.width >= 300 else lab.split(' ')[0], fill=(230, 230, 230), font=FONT)
        x += im.width + gap
    return out


poses = sorted(os.path.basename(p)[5:-4] for p in glob.glob(f'{D}/d3b2r/d3b2-*.jpg'))
for n in poses:
    for var, suf in [('', ''), ('-dusk', '-dusk'), ('-clay', '-clay')]:
        ps = [f'{D}/{c}{var}/d3b2-{n}.jpg' for c, _ in COLS]
        if all(os.path.exists(p) for p in ps):
            row(ps, [f'{lab} · {n}{" · late dusk" if suf == "-dusk" else " · clay" if suf == "-clay" else ""}' for _, lab in COLS]).save(f'{D}/compare/{n}{suf}.jpg', quality=76)
for key, room in ROOMS.items():
    for var, w in [('', 400), ('-1280', 400), ('-portrait', 170), ('-dusk', 400), ('-clay', 400)]:
        rows = [row([f'{D}/{c}{var}/d3b2-{n}.jpg' for c, _ in COLS], [f'{lab} · {n}' for _, lab in COLS], w) for n in poses if n.startswith(f'{key}-') and all(os.path.exists(f'{D}/{c}{var}/d3b2-{n}.jpg') for c, _ in COLS)]
        if not rows:
            continue
        cols = 2 if var == '-portrait' else 1
        rw, rh = rows[0].width, max(r.height for r in rows)
        nr = (len(rows) + cols - 1) // cols
        sheet = Image.new('RGB', (rw * cols + 8 * (cols - 1), rh * nr + 8 * (nr - 1)), (12, 12, 12))
        for i, r in enumerate(rows):
            sheet.paste(r, ((i % cols) * (rw + 8), (i // cols) * (rh + 8)))
        sheet.save(f'{D}/sheets/{room}{var or "-915"}.jpg', quality=72)
for what, a, b, views in [('sloop', 'x1.15', 'x1.3', ['re-sloop', 're-desk', 're-travel', 're-enter']), ('moon', 'x1.4', 'x1.6', ['sk-moon', 'sk-bedside', 'sk-bed', 'sk-rest'])]:
    rows = [row([f'{D}/scale/{what}-{a}-{v}.jpg', f'{D}/scale/{what}-{b}-{v}.jpg'], [f'{what} {a} · {v}', f'{what} {b} · {v}'], 520) for v in views if os.path.exists(f'{D}/scale/{what}-{a}-{v}.jpg')]
    if rows:
        sheet = Image.new('RGB', (rows[0].width, sum(r.height for r in rows) + 8 * (len(rows) - 1)), (12, 12, 12))
        y = 0
        for r in rows:
            sheet.paste(r, (0, y)); y += r.height + 8
        sheet.save(f'{D}/scale/{what}.jpg', quality=76)
print(f'{len(poses)} poses → compare/, sheets/, scale/')
