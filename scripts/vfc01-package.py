"""Package an offline viewer and verify existing VFC evidence; no game renders."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, hashlib, subprocess, shutil
ROOT=Path(__file__).resolve().parents[1]
r=ROOT/'docs/vfc01'
read=lambda p:json.loads((r/p).read_text())
matrix=read('compare/matrix.json'); selected=read('compare/selected.json'); lod=read('combined-lod/sequences.json')
assert len(matrix['rows'])==90 and len(selected['rows'])==9 and len(lod['rows'])==172
# Preserve redundant intermediate files outside the repository; never remove sources.
archive=ROOT.parent/'vfc-intermediate-archive-final'
keep=set()
for v in ['V3','V4']:
 for kind in ['vegetation','hero','architecture','small']:
  rows=[a for a in lod['rows'] if a['variant']==v and a['kind']==kind]
  for i in [0,len(rows)//2,len(rows)-1]:keep.add(f'{v}-{kind}-{i}.webp')
for p in list(r.rglob('*')):
 if not p.is_file():continue
 redundant=(p.suffix=='.png' or '.tmp' in p.name or (p.parent==r/'combined-lod' and p.name.startswith(('V3-','V4-')) and p.suffix=='.webp' and p.name not in keep))
 if redundant:
  q=archive/p.relative_to(r);q.parent.mkdir(parents=True,exist_ok=True);p.replace(q)
for p in sorted(r.rglob('*'),reverse=True):
 if p.is_dir() and not any(p.iterdir()):p.rmdir()
# A static contact sheet with labels OUTSIDE unmodified frame pixels.
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
out=Image.new('RGB',(915,892),'#17241f');draw=ImageDraw.Draw(out)
for y,label,name in [(0,'Production — grounded standing view, DPR 1','baseline'),(446,'Selected craft + timber/tile/stone — SAME pose/FOV, DPR 1','selected-equal')]:
 draw.text((14,y+8),label,fill='#f2e3c9',font=font)
 im=Image.open(r/f'compare/{name}-cottage-front.webp').convert('RGB');assert im.size==(915,412);out.paste(im,(0,y+34))
out.save(r/'compare/VFC01_cottage_front_equal_DPR.png')
# Encode datasets inline so the viewer also works when opened as a file.
data=json.dumps({'matrix':matrix['rows'],'selected':selected['rows']},separators=(',',':')).replace('</','<\\/')
reports=['BASELINE_AUDIT','EXPERIMENT_MATRIX','MATERIAL_REPORT','GEOMETRY_REPORT','VISIBILITY_LOD_REPORT','PERFORMANCE_REPORT','RECOMMENDATION','PHONE_PROTOCOL']
links=' · '.join(f'<a href="VFC01_{x}.md">{x.replace("_"," ").title()}</a>' for x in reports)
videos=''.join(f'<article><h3>{kind.title()} — {v}</h3><video controls preload="none" playsinline poster="combined-lod/{v}-{kind}-0.webp"><source src="combined-lod/{v}-{kind}.mp4" type="video/mp4"></video><p><a href="combined-lod/{v}-{kind}.mp4">Open/download video</a></p></article>' for kind in ['vegetation','hero','architecture','small'] for v in ['V3','V4'])
html='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Feh Lu We — VFC-01 evidence</title>
<style>body{background:#17241f;color:#f2e3c9;font:16px/1.5 system-ui;margin:0}main{max-width:1100px;padding:24px;margin:auto}h1{margin:0;font-size:28px}p{max-width:86ch}a{color:#dfb96c}label{display:inline-block;margin:6px 12px 8px 0}select{font:inherit;background:#23382e;color:#f2e3c9;border:1px solid #9b845b;padding:8px;border-radius:5px}.viewer{position:relative;width:100%;aspect-ratio:915/412;background:#101914;overflow:hidden}.viewer img{position:absolute;width:100%;height:100%;object-fit:contain}.viewer .after{clip-path:inset(0 0 0 50%)}input[type=range]{width:100%;accent-color:#d2ad6a}.captions{display:grid;grid-template-columns:1fr 1fr;gap:20px;font-size:14px}.videos{display:grid;grid-template-columns:1fr 1fr;gap:20px}video{width:100%;background:#101914}hr{border:0;border-top:1px solid #476051;margin:26px 0}.note{padding:12px;border-left:3px solid #ceab6b;background:#23382e}@media(max-width:620px){main{padding:12px}.videos{grid-template-columns:1fr}.captions{font-size:12px;gap:10px}h1{font-size:23px}}</style>
<main><h1>Feh Lu We — VFC-01</h1><p>Visual Fidelity Calibration · ART-01 preserved · isolated branch for owner review</p><p class="note">Start with the same-DPR selected comparison. Construction is clearer at standing distance; this is not a close craft view. Full material variants retain a rejected diagonal plaster experiment. Physical-phone performance remains pending.</p>
<label>Comparison <select id="case"><option value="selected-equal">Selected — equal DPR 1</option><option value="selected-crisp">Selected — candidate DPR 1.25</option><option value="V1">V1 — materials only</option><option value="V2">V2 — geometry only</option><option value="V3">V3 — full combined (failed plaster retained)</option><option value="V4">V4 — full combined + visibility</option></select></label>
<label>Camera <select id="camera"></select></label><label>Control <select id="mode"><option value="colour">Colour</option><option value="clay">Clay</option><option value="neutral">Neutral</option></select></label>
<div class="viewer"><img id="before" alt="Production baseline"><img class="after" id="after" alt="Calibration variant"></div>
<label style="display:block">Comparison split — production left, calibration right<input id="split" type="range" min="0" max="100" value="50" aria-label="Comparison split"></label>
<div class="captions"><div id="before-caption"></div><div id="after-caption"></div></div><p id="warning"></p>
<hr><h2>Deterministic visibility sequences</h2><p>V3 current behaviour versus V4 continuity. Same approach/retreat ray in each pair. Four presentation frames/s; not gameplay FPS. Hero fixture is relocated identically in both variants for an unobstructed test. Small card is an added diagnostic, not a production asset. Videos retain 915×412 content with one padded column. The current micro fade is deferred.</p><div class="videos">__VIDEOS__</div>
<hr><h2>Reports and raw evidence</h2><p>__LINKS__</p><p><a href="README.md">Package index</a> · <a href="EVIDENCE_MANIFEST.json">Hashes / dimensions</a> · <a href="compare/matrix.json">90-frame matrix</a> · <a href="compare/sweeps.json">Timing controls</a> · <a href="compare/selected.json">Selected follow-up</a> · <a href="compare/ktx.json">KTX2 probe</a> · <a href="combined-lod/sequences.json">LOD steps</a></p>
<p>Cloud Chromium uses SwiftShader. Timing controls have host drift and are not physical-device FPS. No merge, deployment or permanent DEV-04D budget revision.</p></main>
<script>const data=__DATA__;const $=id=>document.getElementById(id);const cameras=['library-player','library-medium','library-craft','cottage-player','cottage-medium','cottage-craft'];
function options(){const selected=$('case').value.startsWith('selected');const allowed=selected?['cottage-front','library-player','cottage-player']:cameras;const old=$('camera').value;$('camera').replaceChildren(...allowed.map(x=>{const o=document.createElement('option');o.value=x;o.textContent=x;return o}));if(allowed.includes(old))$('camera').value=old;$('mode').disabled=selected;if(selected)$('mode').value='colour';update()}
function info(row,label){const calls=row.cameraCalls??row.drawCalls,tris=row.cameraTriangles??row.triangles;return `${label}<br>${calls} camera calls · ${tris.toLocaleString()} triangles · DPR ${row.dpr}<br>Texture estimate ${(row.textureBytes/1048576).toFixed(2)} MiB · <a href="${row.image}">Full frame</a>`}
function update(){const c=$('camera').value,v=$('case').value,m=$('mode').value,s=v.startsWith('selected');const before=s?data.selected.find(x=>x.label==='baseline'&&x.camera===c):data.matrix.find(x=>x.variant==='V0'&&x.camera===c&&x.mode===m);const after=s?data.selected.find(x=>x.label===v&&x.camera===c):data.matrix.find(x=>x.variant===v&&x.camera===c&&x.mode===m);$('before').src=before.image;$('after').src=after.image;$('before-caption').innerHTML=info(before,'Production V0');$('after-caption').innerHTML=info(after,v);$('warning').textContent=s?(v==='selected-crisp'?'Identical pose/FOV/light. Candidate adds DPR 1.25 (1.56× pixels); use equal-DPR view to isolate geometry/materials.':'Identical pose/FOV/light/DPR. Selected timber/tile/limestone, Phong 512, normals off; production plaster/paint/fabric retained.'):'Full six-family experimental swatches. Diagonal plaster pattern is rejected, not the recommended art direction. Clay/neutral use matched controls.'}
$('case').onchange=options;$('camera').onchange=update;$('mode').onchange=update;$('split').oninput=()=>{$('after').style.clipPath=`inset(0 0 0 ${$('split').value}%)`};options();</script></html>'''
(r/'index.html').write_text(html.replace('__DATA__',data).replace('__VIDEOS__',videos).replace('__LINKS__',links))
# Follow exact metadata paths; missing files are a packaging error.
for d in ['compare/matrix.json','compare/sweeps.json','compare/selected.json','baseline/production.json']:
 for row in read(d)['rows']:
  if 'image' in row:assert (r/row['image']).is_file(),row['image']
entries=[]
for p in sorted(r.rglob('*')):
 if not p.is_file() or p.name=='EVIDENCE_MANIFEST.json':continue
 b=p.read_bytes();assert b
 entry={'path':str(p.relative_to(r)),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
 if p.suffix in ['.webp','.png']:
  im=Image.open(p);im.load();entry.update(width=im.width,height=im.height,decodedPixelSha256=hashlib.sha256(im.convert('RGBA').tobytes()).hexdigest())
  if p.suffix=='.webp':assert im.size==(915,412),p
 if p.suffix=='.mp4':
  probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=codec_name,width,height,nb_frames,r_frame_rate','-of','json',str(p)]))['streams'][0]
  assert probe['codec_name']=='h264' and (probe['width'],probe['height'])==(916,412)
  subprocess.run(['ffmpeg','-v','error','-i',str(p),'-f','null','-'],check=True,stdout=subprocess.DEVNULL)
  v,kind=p.stem.split('-');expected=sum(a['variant']==v and a['kind']==kind for a in lod['rows']);assert int(probe['nb_frames'])==expected,(p,probe,expected)
  entry.update(probe)
 entries.append(entry)
(r/'EVIDENCE_MANIFEST.json').write_text(json.dumps({'generation':'fresh reconstructed run','baselineProductionHead':'ae2a036e783400355c8d137f24e16c33bb1a8323','frameContent':[915,412],'mainFrames':90,'selectedFrames':9,'lodSteps':172,'videos':8,'validation':'All raster files fully decoded; videos ffprobe and full ffmpeg decode passed; hashes describe packaged files. Source screenshot conversion asserted exact decoded pixel equality where captured. Contact sheet labels outside unchanged frame pixels. No physical-device claim.','files':entries},indent=2)+'\n')
print(json.dumps({'files':len(entries),'bytes':sum(x['bytes'] for x in entries),'webp':sum(x['path'].endswith('.webp') for x in entries),'videos':sum(x['path'].endswith('.mp4') for x in entries)}))
