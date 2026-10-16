# VIS-R01AB: markdown tables from the harness JSON (scripts/vis-r01-grove.mjs).
# python3 scripts/vis-r01-tables.py EVIDENCE_DIR > tables.md
import json, sys, glob, os

ev = sys.argv[1]
runs = {}
for f in sorted(glob.glob(os.path.join(ev, '*.json'))):
    try:
        d = json.load(open(f))
    except Exception:
        continue
    if 'label' not in d:
        continue
    runs[os.path.basename(f)[:-5]] = d

def views_table(labels, title):
    print(f'\n#### {title}\n')
    print('| Afstand | ' + ' | '.join(labels) + ' |')
    print('|---:|' + '---:|' * len(labels))
    rows = {}
    for lab in labels:
        r = next((v for k, v in runs.items() if k.startswith(lab) and 'views' in v['modes']), None)
        if not r:
            continue
        for v in r['modes']['views']:
            rows.setdefault(v['distance'], {})[lab] = v
    for d in sorted(rows, reverse=True):
        cells = []
        for lab in labels:
            v = rows[d].get(lab)
            if not v:
                cells.append('–'); continue
            drawn = '/'.join(str(v['categories'].get(c, {}).get('drawn', 0)) for c in ('hero', 'medium', 'nursery'))
            cells.append(f"{v['calls']} · {v['triangles']/1000:.1f}k · {v.get('mushroomPx', '–')} px · {drawn}")
        print(f'| {d} m | ' + ' | '.join(cells) + ' |')

def walk_table(labels):
    print('\n#### Wandeling heen (vooruit) en terug (achteruit), steeds kijkend naar de grove\n')
    print('| Build | samples | calls min–max | driehoeken min / mediaan / max | zichtbare pops (≥2 px na fog) | max pops in 1 frame | grootste sprong zichtbare mushroom-px voorbij 35 m | eerst ≥50 px / ≥500 px zichtbaar | LOD-wissels (max px) | programmawissels | SwiftShader ms mediaan / p95 |')
    print('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|')
    for lab in labels:
        r = next((v for k, v in runs.items() if k.startswith(lab) and 'walk' in v['modes'] and v['modes']['walk'].get('visibility')), None)
        if not r:
            continue
        w = r['modes']['walk']; s = w['summary']; p = dict(w['pops']); vis = w['visibility']
        # runs recorded before the smoothstep fix stored linear fog: recompute the visible-pop count from the events
        ev = [e for e in w['events'] if e['kind'] in ('appear', 'vanish')]
        p['visiblePops'] = sum(1 for e in ev if e['px'] * (1 - e['fog'] * e['fog'] * (3 - 2 * e['fog'])) >= 2) if r.get('fogModel') != 'smoothstep' else p['visiblePops']
        # largest frame-to-frame change of visible mushroom pixels beyond 35 m (nearer, ordinary motion dominates)
        px = [f for f in w['frames'] if f.get('mushroomPx') is not None and f['centreDist'] > 35]
        js = sorted(((b['mushroomPx'] - a['mushroomPx'], a['centreDist'], b['centreDist'], b['leg']) for a, b in zip(px, px[1:]) if a['leg'] == b['leg']), key=lambda t: -abs(t[0]))
        jump = f"{js[0][0]:+d} px ({js[0][1]}→{js[0][2]} m, {js[0][3]})" if js else '–'
        print(f"| {lab} | {s['frames']} | {s['calls']['min']}–{s['calls']['max']} | {s['triangles']['min']/1000:.0f}k / {s['triangles']['median']/1000:.0f}k / {s['triangles']['max']/1000:.0f}k | {p['visiblePops']} | {p['maxPopsInOneFrame']} | {jump} | {vis['firstVisible50px']} m / {vis['firstVisible500px']} m | {p['lodSwitches']} ({p['maxLodPx']}) | {len(w['programsChanged'])} | {s['swiftshaderMs']['median']} / {s['swiftshaderMs']['p95']} |")

def misc_table(labels):
    print('\n#### Draaien, stilstaan, heen-en-weer schuifelen\n')
    print('| Build | draaien 360° (55/65/80 m): toestandswissels | stilstaan (24,5–65,5 m): wissels | schuifelen ±1,5 m (25/55/65 m): zichtbare pops / LOD-wissels |')
    print('|---|---|---|---|')
    for lab in labels:
        r = next((v for k, v in runs.items() if k.startswith(lab) and 'turn' in v['modes']), None)
        if not r:
            continue
        t = ' / '.join(str(x['pops']['events']) for x in r['modes']['turn'])
        st = ' / '.join(str(x['events']) for x in r['modes'].get('still', []))
        tg = ' · '.join(f"{x['distance']} m: {x['visiblePops']} / {x['lodSwitches']}" for x in r['modes'].get('toggle', []))
        print(f'| {lab} | {t} | {st} | {tg} |')

def lodpop_table():
    for k, r in runs.items():
        if 'lodpopSummary' in r['modes']:
            print(f"\n#### LOD-wissel: gewijzigde pixels rond het exemplaar ({r['label']})\n")
            print('| Overgang | exemplaren | mediaan % px Δ>24 | max % px Δ>24 |')
            print('|---|---:|---:|---:|')
            for name, s in r['modes']['lodpopSummary'].items():
                print(f"| {name} | {s['n']} | {s['medianChanged24']} | {s['maxChanged24']} |")

cols = sys.argv[2].split(',') if len(sys.argv) > 2 else ['prod', 'a', 'b', 'final']
for suffix, title in [('low-landscape-day-multidraw', 'Mobile low · landscape 915×412 · dag · multi-draw'),
                      ('low-landscape-day-instanced', 'Mobile low · landscape · dag · InstancedMesh-fallback (?multidraw=0)'),
                      ('low-landscape-dusk-multidraw', 'Mobile low · landscape · avond (dusk 1) · multi-draw'),
                      ('high-desktop-day-multidraw', 'High · desktop 1280×720 · dag · multi-draw'),
                      ('low-portrait-day-multidraw', 'Mobile low · portrait 412×915 · dag · multi-draw')]:
    views_table([f'{c}-{suffix}' for c in cols], title + ' — calls · driehoeken · zichtbare mushroom-px · getekend hero/medium/nursery')
walk_table([f'{c}-low-landscape-day-multidraw' for c in cols] + [f'{c}-low-landscape-day-instanced' for c in cols])
misc_table([f'{c}-low-landscape-day-multidraw' for c in cols] + [f'{c}-low-landscape-day-instanced' for c in cols])
lodpop_table()
