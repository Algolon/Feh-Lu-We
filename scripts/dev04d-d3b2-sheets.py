#!/usr/bin/env python3
# DEV-04D D3-b2 evidence sheets (non-functional tooling). From the matched captures of scripts/dev04d-audit-views.mjs
# (SET=d3b2, before = immutable production build, after = the D3-b2 build), writes:
#   compare/<pose>.jpg            before | after, 915 × 412 standard (one per pose)
#   compare/<pose>-dusk.jpg       the same at late dusk (DUSK=1)          — room-whole / entry poses
#   compare/<pose>-clay.jpg       the same in clay (form only)            — close-ups and room-whole poses
#   sheets/<room>-<variant>.jpg   per room: every pose, before (left) | after (right), for 915 / 1280 / portrait / dusk
# Usage: python3 scripts/dev04d-d3b2-sheets.py [docs/dev04d/d3b2]
import os, sys, glob
from PIL import Image, ImageDraw, ImageFont

D = sys.argv[1] if len(sys.argv) > 1 else 'docs/dev04d/d3b2'
os.makedirs(f'{D}/compare', exist_ok=True)
os.makedirs(f'{D}/sheets', exist_ok=True)
try:
    FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16)
except OSError:
    FONT = ImageFont.load_default()
ROOMS = {'re': 'reiskamer', 'sk': 'sterrenkamer', 'gu': 'guest-room', 'ba': 'bathroom'}
WHOLE = ('door', 'enter', 'wide', 'back', 'bed', 'travel', 'basin', 'tub', 'scope', 'corner')


def pair(a, b, label, w=None):
    A, B = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
    if w:
        A = A.resize((w, round(A.height * w / A.width)))
        B = B.resize((w, round(B.height * w / B.width)))
    bar = 26
    out = Image.new('RGB', (A.width + B.width + 6, A.height + bar), (24, 24, 24))
    out.paste(A, (0, bar)); out.paste(B, (A.width + 6, bar))
    d = ImageDraw.Draw(out)
    narrow = A.width < 360
    d.text((8, 4), f'BEFORE · {label}' if narrow else f'BEFORE (production 752cb02) · {label}', fill=(230, 230, 230), font=FONT)
    d.text((A.width + 14, 4), 'AFTER' if narrow else f'AFTER (D3-b2) · {label}', fill=(230, 230, 230), font=FONT)
    return out


poses = sorted(os.path.basename(p)[:-4] for p in glob.glob(f'{D}/after/d3b2-*.jpg'))
for n in poses:
    short = n[len('d3b2-'):]
    pair(f'{D}/before/{n}.jpg', f'{D}/after/{n}.jpg', f'{short} · 915×412').save(f'{D}/compare/{short}.jpg', quality=78)
    if short.split('-', 1)[1] in WHOLE and os.path.exists(f'{D}/after-dusk/{n}.jpg'):
        pair(f'{D}/before-dusk/{n}.jpg', f'{D}/after-dusk/{n}.jpg', f'{short} · late dusk').save(f'{D}/compare/{short}-dusk.jpg', quality=78)
    if os.path.exists(f'{D}/after-clay/{n}.jpg'):
        pair(f'{D}/before-clay/{n}.jpg', f'{D}/after-clay/{n}.jpg', f'{short} · clay').save(f'{D}/compare/{short}-clay.jpg', quality=74)

for key, room in ROOMS.items():
    for var, w in [('', 460), ('-1280', 460), ('-portrait', 200), ('-dusk', 460)]:
        rows = [pair(f'{D}/before{var}/{n}.jpg', f'{D}/after{var}/{n}.jpg', n[len('d3b2-'):], w) for n in poses if n.startswith(f'd3b2-{key}-') and os.path.exists(f'{D}/after{var}/{n}.jpg')]
        if not rows:
            continue
        cols = 2 if var == '-portrait' else 1
        rw, rh = rows[0].width, max(r.height for r in rows)
        nr = (len(rows) + cols - 1) // cols
        sheet = Image.new('RGB', (rw * cols + 8 * (cols - 1), rh * nr + 8 * (nr - 1)), (12, 12, 12))
        for i, r in enumerate(rows):
            sheet.paste(r, ((i % cols) * (rw + 8), (i // cols) * (rh + 8)))
        sheet.save(f'{D}/sheets/{room}{var or "-915"}.jpg', quality=74)
print(f'{len(poses)} poses → compare/ and sheets/')
