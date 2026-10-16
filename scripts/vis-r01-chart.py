# VIS-R01AB: walk-in charts (no plotting library needed): visible mushroom pixels and camera triangles against the
# distance to the grove centre, one line per build. python3 scripts/vis-r01-chart.py OUT_DIR walk1.json[:label] ...
import json, sys, os, math

out = sys.argv[1]
series = []
COLORS = ['#8a8f98', '#d08a2e', '#3a7bd5', '#2e9e6a']
for i, arg in enumerate(sys.argv[2:]):
    path, _, name = arg.partition(':')
    w = json.load(open(path))['modes']['walk']
    frames = [f for f in w['frames'] if f['leg'] == 'in']
    series.append((name or os.path.basename(path).split('-')[0], COLORS[i % len(COLORS)], frames))

def chart(file, key, title, ylabel, fmt, log=False, ymax=None, guide=None):
    W, H, L, R, T, B = 760, 300, 70, 20, 34, 44
    xs = lambda d: L + (130 - min(130, d)) / 130 * (W - L - R)
    vals = [f[key] for _, _, fr in series for f in fr if f.get(key) is not None]
    top = ymax or max(vals) * 1.05
    if log:
        lo = 1
        ys = lambda v: T + (1 - math.log10(max(lo, v) + 1) / math.log10(top + 1)) * (H - T - B)
    else:
        ys = lambda v: T + (1 - v / top) * (H - T - B)
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" font-family="system-ui,sans-serif" font-size="11">',
         f'<rect width="{W}" height="{H}" fill="#ffffff"/>', f'<text x="{L}" y="18" font-size="13" font-weight="600" fill="#222">{title}</text>']
    for d in (120, 100, 80, 65, 55, 30, 0):
        x = xs(d); o.append(f'<line x1="{x}" y1="{T}" x2="{x}" y2="{H-B}" stroke="#e6e6e6"/><text x="{x}" y="{H-B+14}" text-anchor="middle" fill="#555">{d}</text>')
    o.append(f'<text x="{(L+W-R)/2}" y="{H-8}" text-anchor="middle" fill="#555">afstand tot grove-middelpunt (m), heen-route</text>')
    ticks = [0, 10, 100, 1000, 10000, 100000] if log else [top * k / 4 for k in range(5)]
    for v in ticks:
        if v > top: continue
        y = ys(v); o.append(f'<line x1="{L}" y1="{y}" x2="{W-R}" y2="{y}" stroke="#eeeeee"/><text x="{L-6}" y="{y+4}" text-anchor="end" fill="#555">{fmt(v)}</text>')
    o.append(f'<text x="14" y="{(T+H-B)/2}" transform="rotate(-90 14 {(T+H-B)/2})" text-anchor="middle" fill="#555">{ylabel}</text>')
    if guide:
        y = ys(guide[0]); o.append(f'<line x1="{L}" y1="{y}" x2="{W-R}" y2="{y}" stroke="#c0392b" stroke-dasharray="4 3"/><text x="{W-R-4}" y="{y-4}" text-anchor="end" fill="#c0392b">{guide[1]}</text>')
    for k, (name, col, fr) in enumerate(series):
        pts = [(xs(f['centreDist']), ys(f[key])) for f in fr if f.get(key) is not None]
        o.append(f'<polyline fill="none" stroke="{col}" stroke-width="1.8" points="{" ".join(f"{x:.1f},{y:.1f}" for x, y in pts)}"/>')
        o.append(f'<rect x="{L+10+k*120}" y="{T+6}" width="14" height="3" fill="{col}"/><text x="{L+28+k*120}" y="{T+10}" fill="#222">{name}</text>')
    o.append('</svg>')
    open(os.path.join(out, file), 'w').write('\n'.join(o))

chart('walk-visible-pixels.svg', 'mushroomPx', 'Zichtbare mushroom-pixels (occlusie-bewust), 915×412, mobile low', 'pixels (log)', lambda v: f'{int(v):,}'.replace(',', '.'), log=True)
chart('walk-triangles.svg', 'triangles', 'Ingediende camera-driehoeken per frame, mobile low, multi-draw', 'driehoeken', lambda v: f'{v/1000:.0f}k', ymax=800000, guide=(750000, 'PB01 750k'))
