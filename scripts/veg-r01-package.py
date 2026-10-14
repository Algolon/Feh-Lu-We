"""Package completed real-render sequences; preserve bulky capture intermediates outside the git deliverable."""
import json, subprocess, shutil, statistics, os, tempfile
from pathlib import Path
root=Path('docs/veg-r01/comparison'); out=Path('docs/veg-r01/videos');out.mkdir(exist_ok=True)
scratch=Path(os.environ.get('VEG_INTERMEDIATES', str(Path(tempfile.gettempdir())/'veg-r01-intermediates')));scratch.mkdir(parents=True,exist_ok=True)
routes=['boslust','dense','garden-edge','treeline']
for directory in sorted(root.iterdir()):
 if not (directory/'results.json').exists() or (directory/'moving-summary.json').exists():continue
 frames={n:json.loads((directory/(n+'-frames.json')).read_text()) for n in routes}
 if any(len(v)!=100 for v in frames.values()):raise RuntimeError('Incomplete sequence '+directory.name)
 video=out/(directory.name+'.mp4');cmd=['ffmpeg','-v','error','-y']
 for n in routes:cmd+=['-framerate','10','-i',str(directory/(n+'-%04d.jpg'))]
 cmd+=['-filter_complex','[0:v][1:v][2:v][3:v]concat=n=4:v=1:a=0[v]','-map','[v]','-c:v','libx264','-threads','1','-preset','fast','-crf','27','-pix_fmt','yuv420p','-movflags','+faststart',str(video)]
 subprocess.run(cmd,check=True)
 probe=json.loads(subprocess.check_output(['ffprobe','-v','quiet','-show_format','-show_streams','-of','json',str(video)]));
 if abs(float(probe['format']['duration'])-40)>.2:raise RuntimeError('Video duration mismatch')
 summary={'conditions':'Real normal game, low, 768x432 DPR1, 30 Hz collision simulation, 10 Hz rendered capture. 0-10s BOSLUST; 10-20s dense; 20-30s garden edge; 30-40s open treeline. Each: approach 4s, backward retreat 4s, lateral turn 2s. Playback is simulation time, not hardware frame rate.', 'routes':{},'video':str(video.relative_to('docs/veg-r01'))}
 for name,fs in frames.items():
  events=[];previous={}
  for f in fs:
   current={t['index']:t for t in f['trees']}
   for i,t in current.items():
    p=previous.get(i)
    if p and t['geometry']!=p['geometry']:events.append({'frame':f['i'],'phase':f['phase'],'index':i,'key':t['key'],'distance':t['distance'],'from':p['level'],'to':t['level'],'triangleDelta':t['triangles']-p['triangles']})
   previous=current
  def stats(v):return{'min':min(v),'median':statistics.median(v),'p95':sorted(v)[int((len(v)-1)*.95)],'max':max(v)}
  summary['routes'][name]={'cameraTriangles':stats([f['triangles']for f in fs]),'drawCalls':stats([f['calls']for f in fs]),'cpuSubmitMs':stats([f['cpuSubmitMs']for f in fs]),'transitionEventsInRange':events,'diagnosticTreesAtApproachEnd':sorted(fs[39]['trees'],key=lambda t:t['distance'])[:16], 'frames':[{k:f[k]for k in ['i','phase','pose','calls','triangles','cpuSubmitMs']}for f in fs]}
 target=scratch/directory.name;target.mkdir(exist_ok=True)
 for n in routes:shutil.move(str(directory/(n+'-frames.json')),target/(n+'-frames.json'))
 for p in directory.glob('*-[0-9][0-9][0-9][0-9].jpg'):shutil.move(str(p),target/p.name)
 (directory/'moving-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
 print(directory.name,video.stat().st_size,flush=True)
