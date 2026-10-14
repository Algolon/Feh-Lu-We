"""Reproduce VEG evidence checks; no thresholds or production files are changed.

Run after veg-r01-compare.mjs / veg-r01-package.py. Optional argv[1] is the
geometry JSON emitted by veg-r01-models.mjs; PIL raster masks are diagnostics,
never substitutes for real-render visual review.
"""
import hashlib
import json
import statistics
import sys
from pathlib import Path

ROOT = Path('docs/veg-r01')
PROFILES = ['baseline', 'a', 'b', 'hybrid']
def read(p):
    return json.loads(p.read_text())
def stats(values):
    v = sorted(values)
    return {'min': v[0], 'median': statistics.median(v),
            'p95': v[int((len(v)-1)*.95)], 'p99': v[int((len(v)-1)*.99)], 'max': v[-1]}

result = {'conditions': 'Recovered actual-game low-quality 768x432 DPR1, shadows off; matched 30Hz simulation/10Hz captured samples. Counts are submitted geometry, timings are SwiftShader only.',
          'policySource': 'production 5af9779 scripts/performance-budget.mjs and docs/PERFORMANCE_BUDGET.md',
          'cameraCeiling': 750000, 'callGuide': 150, 'deviceValidated': False, 'profiles': {}}
baseline = {path: read(ROOT/'comparison'/f'baseline-{path}'/'results.json') for path in ['multi', 'fallback']}
base_moving = read(ROOT/'comparison'/'baseline-multi'/'moving-summary.json')['routes']
for profile in PROFILES:
    paths = {}
    for path in ['multi', 'fallback']:
        directory = ROOT/'comparison'/f'{profile}-{path}'
        j = read(directory/'results.json')
        moving = read(directory/'moving-summary.json')['routes']
        assert not j['errors'], (profile, path, j['errors'])
        assert j['memory']['path'] == {'multi':'multi-draw','fallback':'instanced'}[path]
        frames = [f for route in moving.values() for f in route['frames']]
        assert len(frames) == 400
        assert j['memory']['shadows'] is False
        assert j['memory']['dpr'] == 1 and j['memory']['buffer'] == [768,432]
        deltas = []
        for name, route in moving.items():
            assert len(route['frames']) == 100
            for f, b in zip(route['frames'], base_moving[name]['frames']):
                assert f['pose'] == b['pose'], (profile, path, name, f['i'])
                deltas.append(f['triangles']/b['triangles']-1)
        fresh = read(ROOT/'recovery'/'fresh-static'/f'{profile}-{path}'/'results.json')
        assert not fresh['errors']
        assert [(v['name'],v['calls'],v['triangles']) for v in fresh['views']] == [(v['name'],v['calls'],v['triangles']) for v in j['views'][:10]]
        all_counts = j['views'] + frames
        reference = []
        for v,b in zip(j['views'],baseline[path]['views']):
            assert v['name'] == b['name']
            reference.append({'name':v['name'],'triangles':v['triangles'],'baselineTriangles':b['triangles'],
                              'growthPercent':round(100*(v['triangles']/b['triangles']-1),3),
                              'calls':v['calls'],'baselineCalls':b['calls']})
        m=j['memory']
        paths[path] = {'views':len(j['views']), 'movingSamples':len(frames),
            'cameraTriangles':stats([f['triangles'] for f in all_counts]),
            'drawCalls':stats([f['calls'] for f in all_counts]),
            'movingRelativeGrowthPercent':{k:round(v*100,3) for k,v in stats(deltas).items()},
            'samplesAbove750k':sum(f['triangles']>750000 for f in all_counts),
            'samplesAbove150Calls':sum(f['calls']>150 for f in all_counts),
            'newCallOvershootsStatic':[v['name'] for v in reference if v['calls']>150 and v['baselineCalls']<=150],
            'movingSamplesAbove8Percent':sum(v>.08 for v in deltas),
            'movingSamplesAbove2Percent':sum(v>.02 for v in deltas),
            'geometryChangesWithin90m':sum(len(r['transitionEventsInRange']) for r in moving.values()),
            'staticReference':reference,
            'memoryEstimates':{k:m[k] for k in ['geometryBytes','instanceBytes','batchTextureBytes','geometries','textures']},
            'shadowControl':fresh['shadow'], 'freshStaticCountsReproduced':True}
        pacefile=ROOT/'recovery'/'pacing'/f'{profile}-{path}'/'results.json'
        if pacefile.exists():
            pacing=read(pacefile)['pacing']['intervalsMs']
            paths[path]['softwareFrameIntervalsMs']={**stats(pacing),'over50ms':sum(t>50 for t in pacing),'over100ms':sum(t>100 for t in pacing),'samples':len(pacing)}
    multi=read(ROOT/'comparison'/f'{profile}-multi'/'moving-summary.json')['routes']
    fallback=read(ROOT/'comparison'/f'{profile}-fallback'/'moving-summary.json')['routes']
    for name in multi:
        assert [f['triangles'] for f in multi[name]['frames']] == [f['triangles'] for f in fallback[name]['frames']]
    result['profiles'][profile]=paths
result['decision'] = 'Retain baseline default. Hybrid is preferred experimental candidate; activation/merge not ready: relative review guards exceeded, inherited call overshoots, device validation pending.'
(ROOT/'assessment.json').write_text(json.dumps(result,indent=2)+'\n')

integrated = ROOT/'recovery'/'integrated-moving'
if all((integrated/f'{p}-{path}'/'results.json').exists() for p in ['baseline','hybrid'] for path in ['multi','fallback']):
    replay = {'production':'5af9779', 'temporaryIntegrationTree':'0b378e1a8c3510e29fec246cbe651ee8d8309331',
              'conditions':'Unpublished production+VEG combination. Same routes/settings, but ten static warm-up views rather than the recovered 24; early LOD history can differ. Software CPU times excluded from performance conclusions.', 'profiles':{}}
    for profile in ['baseline','hybrid']:
        for path in ['multi','fallback']:
            directory=integrated/f'{profile}-{path}';j=read(directory/'results.json')
            old=read(ROOT/'comparison'/directory.name/'results.json')
            assert not j['errors']
            assert [(v['name'],v['calls'],v['triangles']) for v in j['views']] == [(v['name'],v['calls'],v['triangles']) for v in old['views'][:10]]
            routes={};oldroutes=read(ROOT/'comparison'/directory.name/'moving-summary.json')['routes']
            for name,before in oldroutes.items():
                frames=read(directory/f'{name}-frames.json')
                # The sibling path is compared explicitly below; keep diagnostics independent of serialization order.
                sibling=integrated/f"{profile}-{'fallback' if path=='multi' else 'multi'}"/f'{name}-frames.json'
                other=read(sibling)
                assert len(frames)==100
                assert [f['pose']for f in frames]==[f['pose']for f in before['frames']]
                assert [(f['pose'],f['triangles'])for f in frames]==[(f['pose'],f['triangles'])for f in other]
                routes[name]={'cameraTriangles':stats([f['triangles']for f in frames]),'drawCalls':stats([f['calls']for f in frames]),'cameraPosesMatchRecovered':True,'multiDrawFallbackCameraParity':True,'maxTriangleDifferenceFromRecoveredHistory':max(abs(f['triangles']-b['triangles'])for f,b in zip(frames,before['frames']))}
            replay['profiles'][directory.name]={'freshStaticCountsMatchRecovered':True,'routes':routes,'pageErrors':j['errors']}
    (integrated/'summary.json').write_text(json.dumps(replay,indent=2)+'\n')

if len(sys.argv)>1:
    from PIL import Image, ImageDraw, ImageChops
    models=read(Path(sys.argv[1])); index={(r['species'],r['v'],r['profile'],r['level']):r for r in models}
    pairs=[]
    for species in ['oak','beech','birch','pine']:
        for variant in range(3):
            for angle in range(4):
                near=index[species,variant,'baseline','near']['projections'][angle]
                xs,ys=near[::2],near[1::2];lo=min(xs),min(ys); scale=244/max(max(xs)-min(xs),max(ys)-min(ys))
                def mask(row):
                    p=row['projections'][angle];im=Image.new('1',(256,256));draw=ImageDraw.Draw(im)
                    pts=[((x-lo[0])*scale+6,(y-lo[1])*scale+6) for x,y in zip(p[::2],p[1::2])]
                    for i in range(0,len(pts),3):draw.polygon(pts[i:i+3],fill=1)
                    return im
                for profile in ['baseline','b','hybrid']:
                    masks={level:mask(index[species,variant,profile,level]) for level in ['near','mid','far','xfar']}
                    for before,after in [('near','mid'),('mid','far'),('far','xfar')]:
                        a,b=masks[before],masks[after];intersection=sum(ImageChops.logical_and(a,b).getdata());union=sum(ImageChops.logical_or(a,b).getdata())
                        pairs.append({'species':species,'variant':variant,'angle':angle,'profile':profile,'transition':before+'-'+after,'silhouetteIoU':round(intersection/union,4)})
    summary={p:{t:{'meanIoU':round(statistics.mean(x['silhouetteIoU']for x in pairs if x['profile']==p and x['transition']==t),4),'minIoU':min(x['silhouetteIoU']for x in pairs if x['profile']==p and x['transition']==t)}for t in ['near-mid','mid-far','far-xfar']}for p in ['baseline','b','hybrid']}
    (ROOT/'model-continuity.json').write_text(json.dumps({'conditions':'Fresh 256px binary triangle masks; four orthographic bearings, per-bearing baseline near frame with 6px padding. A shares baseline geometry. Diagnostic outline overlap only; no colour/normals/perceptual metric. Hybrid xfar uses the actual far geometry alias.','summary':summary,'pairs':pairs},indent=2)+'\n')
print(json.dumps({p:{path:{k:v[k]for k in ['cameraTriangles','drawCalls','geometryChangesWithin90m']}for path,v in paths.items()}for p,paths in result['profiles'].items()},indent=2))
