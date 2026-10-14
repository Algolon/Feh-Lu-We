"""Audit expected evidence, current hashes/decodes and viewer references.

The original manifest is immutable historical provenance. Missing media fail
the completion gate; --allow-incomplete only supports a recovery inventory.
"""
from pathlib import Path
from PIL import Image
from html.parser import HTMLParser
import argparse, hashlib, json, re, subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--refresh', action='store_true')
parser.add_argument('--allow-incomplete', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
base = root / 'docs/vfc01'
original_path = base / 'EVIDENCE_MANIFEST_ORIGINAL.json'
if args.refresh and not original_path.exists():
    original_path.write_bytes((base / 'EVIDENCE_MANIFEST.json').read_bytes())
original = json.loads((original_path if original_path.exists() else base / 'EVIDENCE_MANIFEST.json').read_text())
captures_path = base / 'RECOVERY_CAPTURES.json'
captures = {x['path']: x for x in json.loads(captures_path.read_text())['captures']} if captures_path.exists() else {}
current = json.loads((base / 'EVIDENCE_MANIFEST.json').read_text())
current_by_path = {x['path']: x for x in current['files']}
rows, missing, failures, changed = [], [], [], []
for expected in original['files']:
    rel = expected['path']
    p = base / rel
    row = dict(expected)
    if not p.is_file():
        missing.append(rel)
        row['availability'] = 'missing; reproducible from committed scripts/source, not recovered'
        rows.append(row)
        continue
    data = p.read_bytes()
    sha = hashlib.sha256(data).hexdigest()
    if sha != expected['sha256']:
        changed.append(rel)
    if not args.refresh and sha != current_by_path[rel]['sha256']:
        failures.append(f'file checksum mismatch: {rel}')
    row.update(bytes=len(data), sha256=sha)
    row['availability'] = 'reproduced' if rel in captures else 'committed original media' if p.suffix in ['.webp', '.mp4', '.png'] else 'retained or updated document'
    if rel in captures:
        row['originalSha256'] = expected['sha256']
        row['provenance'] = {'record': 'RECOVERY_CAPTURES.json', 'sourceRevision': captures[rel]['sourceRevision'], 'sourceTree': captures[rel]['sourceTree']}
    if p.suffix in ['.webp', '.png']:
        with Image.open(p) as im:
            im.load()
            row.update(width=im.width, height=im.height, decodedPixelSha256=hashlib.sha256(im.tobytes()).hexdigest())
            if (im.width, im.height) != (expected['width'], expected['height']):
                failures.append(f'image dimensions differ: {rel}')
    if p.suffix == '.mp4':
        subprocess.run(['ffmpeg', '-v', 'error', '-i', str(p), '-f', 'null', '-'], check=True, timeout=60)
    rows.append(row)

html = (base / 'index.html').read_text()
class References(HTMLParser):
    def __init__(self):
        super().__init__(); self.refs = set()
    def handle_starttag(self, tag, attrs):
        for k, v in attrs:
            if k in ['src', 'href', 'poster'] and v and '${' not in v and not v.startswith(('http:', 'https:', '#')):
                self.refs.add(v)
refs = References(); refs.feed(html)
dataset = json.loads(html.split('const data=', 1)[1].split(';const $=', 1)[0])
refs.refs.update(x['image'] for x in dataset['matrix'] + dataset['selected'])
unresolved = sorted(x for x in refs.refs if not (base / x).is_file())
untracked_refs = sorted(set(unresolved) - set(missing))
if untracked_refs:
    failures.append(f'viewer missing references outside expected inventory: {untracked_refs}')
for name, key in [('compare/matrix.json', 'matrix'), ('compare/selected.json', 'selected')]:
    if dataset[key] != json.loads((base / name).read_text())['rows']:
        failures.append(f'viewer embedded data differs from {name}')

summary = dict(expected=len(rows), present=len(rows)-len(missing), missing=len(missing), reproduced=len(captures), originalMedia=sum(r['availability']=='committed original media' for r in rows), unresolvedViewerReferences=len(unresolved), failures=failures)
if args.refresh:
    current.update(generation='Recovery package; recovered original media and explicitly reproduced captures', validation='Current files decoded/hashed by scripts/vfc01-integrity.py. Missing files remain an explicit failed completion gate. Original validations and timings are retained separately; no new phone performance claim.', files=rows)
    (base / 'EVIDENCE_MANIFEST.json').write_text(json.dumps(current, indent=2)+'\n')
    availability = dict(checkedHead=subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip(), state='COMPLETE_MEDIA' if not missing and not failures else 'PARTIAL_RECOVERY', verifiedPresent=[r['path'] for r in rows if r['path'] not in missing], missing=missing, summary=summary, classification='Missing files are reproducible in a working Chromium/WebGL2 environment; the original binary bytes remain unavailable.')
    (base / 'UPLOAD_AVAILABILITY.json').write_text(json.dumps(availability, indent=2)+'\n')
print(json.dumps(summary, indent=2))
if failures or (missing and not args.allow_incomplete):
    raise SystemExit(1)
