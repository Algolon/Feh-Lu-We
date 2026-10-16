# VIS-R01AB: synchronised comparison videos from the harness walk videos (same deterministic route per build).
# python3 scripts/vis-r01-video.py OUT.mp4 WORKDIR mode label1=walk1.mp4:walk1.json label2=... [first_sample last_sample]
#   mode "full": columns at half size, whole walk; mode "crop": 2x crop round the view centre (the grove), columns.
import sys, os, json, subprocess, glob
from PIL import Image, ImageDraw, ImageFont

out, work, mode = sys.argv[1], sys.argv[2], sys.argv[3]
cols = [a.split('=', 1) for a in sys.argv[4:] if '=' in a]
rng = [int(a) for a in sys.argv[4:] if a.isdigit()]
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
srcs = []
for name, spec in cols:
    mp4, js = spec.split(':')
    d = os.path.join(work, name)
    os.makedirs(d, exist_ok=True)
    if not glob.glob(os.path.join(d, '*.png')):
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', mp4, os.path.join(d, '%05d.png')], check=True)
    frames = json.load(open(js))['modes']['walk']['frames']
    srcs.append((name, sorted(glob.glob(os.path.join(d, '*.png'))), frames))
n = min(len(s[1]) for s in srcs)
a, b = (rng + [0, n])[:2] if rng else (0, n)
b = min(b, n)
tmp = os.path.join(work, 'composed-' + mode)
os.makedirs(tmp, exist_ok=True)
for f in glob.glob(os.path.join(tmp, '*.jpg')): os.remove(f)
for k in range(a, b):
    tiles = []
    for name, files, frames in srcs:
        im = Image.open(files[k]).convert('RGB')
        if mode == 'crop':
            cw, ch = 360, 150
            x0, y0 = im.width // 2 - cw // 2, im.height // 2 - ch // 2
            im = im.crop((x0, y0, x0 + cw, y0 + ch)).resize((cw * 2, ch * 2), Image.LANCZOS)
        else:
            im = im.resize((im.width // 2, im.height // 2), Image.LANCZOS)
        tiles.append((name, im, frames[k] if k < len(frames) else None))
    W = sum(t[1].width for t in tiles); H = tiles[0][1].height + 26
    canvas = Image.new('RGB', (W + (W % 2), H + (H % 2)), (12, 12, 12))
    d = ImageDraw.Draw(canvas); x = 0
    for name, im, f in tiles:
        canvas.paste(im, (x, 26))
        info = f"{name}   {f['centreDist']:.0f} m van centrum · {'heen' if f['leg'] == 'in' else 'terug (achteruit)'} · {f['triangles']/1000:.0f}k tri · {f['calls']} calls" if f else name
        d.text((x + 8, 4), info, font=font, fill=(240, 240, 240))
        x += im.width
    canvas.save(os.path.join(tmp, f'{k - a:05d}.jpg'), quality=90)
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-framerate', '20', '-i', os.path.join(tmp, '%05d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', os.environ.get('CRF', '30'), '-preset', 'slow', out], check=True)
print(out, os.path.getsize(out))
