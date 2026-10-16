// VIS-R01C C1 — same-build, same-pose parity between R01B and the opt-in shared LOD controller.
// Usage after npm run build:
//   MODE=views,turn,still,toggle,gameplay node scripts/vis-r01c-parity.mjs
//   MODE=views,walk,turn,still,toggle,gameplay MULTIDRAW=0 node scripts/vis-r01c-parity.mjs
//   GROVE_PROFILE=a VIEWPORT=portrait DUSK=1 node scripts/vis-r01c-parity.mjs
//
// This runs the existing vis-r01 measurement harness twice, sequentially. It compares
// geometry, visibility, LOD levels, gameplay and render counts, NOT SwiftShader timings.
// It never deploys, changes a save or switches the game's default rendering path.
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const env = process.env;
const MODE = env.MODE ?? 'views,turn,still,toggle,gameplay';
const QUALITY = env.QUALITY ?? 'low';
const VIEWPORT = env.VIEWPORT ?? 'landscape';
const DUSK = env.DUSK ?? '0';
const MULTIDRAW = env.MULTIDRAW ?? '1';
const profile = env.GROVE_PROFILE ?? 'b';
const OUT = env.OUT ?? 'scripts/out/vis-r01c-parity';
const DIST = env.DIST ?? 'dist';
const path = MULTIDRAW === '0' ? 'instanced' : 'multidraw';
const day = +DUSK ? 'dusk' : 'day';
const modeKey = MODE.split(',').join('+');
mkdirSync(OUT, { recursive: true });

function run(tag, flags) {
  const label = `${tag}-${QUALITY}-${VIEWPORT}-${day}-${path}`;
  const r = spawnSync(process.execPath, ['scripts/vis-r01-grove.mjs'], {
    encoding: 'utf8',
    env: {
      ...env, TAG: tag, DIST, OUT, MODE, QUALITY, VIEWPORT, DUSK,
      MULTIDRAW, PARAMS: flags, CHECK: '1', VIDEO: '',
    },
    timeout: Number(env.PARITY_TIMEOUT_MS ?? 900000),
    maxBuffer: 20 * 1024 * 1024,
  });
  if (r.error || r.status !== 0) {
    console.error(r.stdout?.slice(-2500), r.stderr?.slice(-2500));
    throw new Error(`VIS-R01C ${tag} measurement failed (${r.status}): ${r.error?.message ?? 'see log'}`);
  }
  const file = join(OUT, `${label}-${modeKey}.json`);
  const data = JSON.parse(readFileSync(file, 'utf8'));
  if (data.errors?.length || !data.check?.pass) throw new Error(`VIS-R01C ${tag}: acceptance gate did not pass`);
  return data;
}
const legacy = run('c1-legacy', `grovelod=${profile}`);
const shared = run('c1-shared', `grovelod=${profile}&veglodshared=1`);
const violations = [];

function compare(name, a, b) {
  if (JSON.stringify(a) !== JSON.stringify(b))
    violations.push({ name, legacy: a, shared: b });
}
function frameKey(f) {
  return {
    pos: f.pos, centreDist: f.centreDist,
    calls: f.calls, triangles: f.triangles,
    groveSubmittedTris: f.groveSubmittedTris,
    categories: f.categories, onScreen: f.onScreen,
    fog: f.fog, lights: f.lights, mushroomPx: f.mushroomPx,
    nearestMushroom: f.nearestMushroom,
  };
}
for (const mode of MODE.split(',')) {
  const a = legacy.modes[mode], b = shared.modes[mode];
  if (!a || !b) { violations.push({ name: mode, error: 'missing mode evidence' }); continue; }
  if (mode === 'views') {
    compare('views.length', a.length, b.length);
    for (let i = 0; i < Math.min(a.length, b.length); i++)
      compare(`views[${i}]`, { distance: a[i].distance, ...frameKey(a[i]) },
        { distance: b[i].distance, ...frameKey(b[i]) });
  } else if (mode === 'walk') {
    compare('walk.pops', a.pops, b.pops);
    compare('walk.visibility', a.visibility, b.visibility);
    compare('walk.frames.length', a.frames.length, b.frames.length);
    for (let i = 0; i < Math.min(a.frames.length, b.frames.length); i++)
      compare(`walk[${i}]`, frameKey(a.frames[i]), frameKey(b.frames[i]));
  } else if (mode === 'turn') {
    compare('turn.length', a.length, b.length);
    for (let i = 0; i < Math.min(a.length, b.length); i++)
      compare(`turn[${i}]`, { distance: a[i].distance, pops: a[i].pops, events: a[i].events },
        { distance: b[i].distance, pops: b[i].pops, events: b[i].events });
  } else if (mode === 'gameplay') compare('gameplay', a, b);
  else compare(mode, a, b);
}
compare('consoleErrors', legacy.errors, shared.errors);

const report = {
  branch: 'VIS-R01C C1 opt-in', profile, quality: QUALITY,
  viewport: VIEWPORT, dusk: DUSK, multidraw: MULTIDRAW, modes: MODE,
  legacyCheck: legacy.check, sharedCheck: shared.check,
  pass: violations.length === 0, mismatches: violations.length,
  examples: violations.slice(0, 25),
  // Frame-time deltas are deliberately excluded: SwiftShader is not an Android FPS metric.
};
const dest = join(OUT, `parity-${profile}-${QUALITY}-${VIEWPORT}-${day}-${path}-${modeKey}.json`);
writeFileSync(dest, JSON.stringify(report, null, 2));
console.log(`VIS-R01C ${report.pass ? 'PASS' : 'FAIL'}: ${violations.length} same-build mismatches; ${dest}`);
if (!report.pass) process.exitCode = 1;
