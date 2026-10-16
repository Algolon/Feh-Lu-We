// SKY-C01-R01 visual regression + performance QA, real game canvas (WebGL2 / ANGLE SwiftShader).
// Every row renders the SAME frame twice in one session: current shader vs the pre-fix production shader (BASE,
// default 436e106) injected into the live sky material. SwiftShader evaluates all four quad lanes, so the pre-fix
// shader is well-defined here: exact equality proves the art is unchanged. The GPU defect itself is shown through
// the UB map and a stale-lane emulation of the pre-fix shader (labelled as emulation, not a device capture).
// Usage: npm run build && node scripts/sky-c01-r01-qa.mjs /abs/output [QUICK=1]
import { mkdirSync, writeFileSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openSky, render, timeSky, diffFrames } from './sky-c01-r01-lib.mjs';

const out = process.argv[2]; if (!out) throw Error('Explicit output directory required');
mkdirSync(out, { recursive: true });
const BASE = process.env.BASE ?? '436e106';
const quick = process.env.QUICK === '1';
const sha = s => createHash('sha256').update(s).digest('hex');

async function fragments(rev) {
  const dir = mkdtempSync(join(tmpdir(), 'sky-r01-'));
  for (const f of ['cloudPrototypes.ts', 'skyShader.ts']) {
    const src = rev ? execFileSync('git', ['show', `${rev}:src/world/${f}`], { encoding: 'utf8' }) : readFileSync(`src/world/${f}`, 'utf8');
    writeFileSync(join(dir, f), src.replace("from './skyShader'", "from './skyShader.ts'"));
  }
  const m = await import(join(dir, 'cloudPrototypes.ts'));
  return { procedural: m.cloudFragment('procedural'), masks: m.cloudFragment('masks') };
}
const before = await fragments(BASE), current = await fragments(null);
const use = src => `return ${JSON.stringify(src)};`;
const edit = (src, pairs) => pairs.reduce((s, [a, b]) => { if (!s.includes(a)) throw Error('emulation anchor missing: ' + a); return s.replace(a, b); }, src);
// Pre-fix shader, branch-free, with the quad neighbour that skipped the cull contributing a zeroed register to
// fwidth(distance) (what a GPU without lockstep helper evaluation can do). Emulation only.
const staleBefore = edit(before.procedural, [
  ['float shoulder(', 'float gAct = 1.0;\nfloat shoulder('],
  ['float aa = max(fwidth(distance), 0.004);', 'float aa = max(fwidth(gAct > 0.5 ? distance : 0.0), 0.004);'],
  ['if (facing < 0.55) return vec2(0.0);', 'gAct = facing < 0.55 ? 0.0 : 1.0;'],
  ['if (abs(p.x)>1.13 || p.y< -0.63 || p.y>0.78) return vec2(0.0);', 'if (abs(p.x)>1.13 || p.y< -0.63 || p.y>0.78) gAct = 0.0;'],
  ['return vec2(shape.x,clamp(lit,0.38,0.91));', 'return gAct > 0.5 ? vec2(shape.x,clamp(lit,0.38,0.91)) : vec2(0.0);'],
]);
// Quads whose 2x2 fragments disagree on a cull decision = where the pre-fix fwidth was undefined (red).
const ubBefore = edit(before.procedural, [
  ['vec2 candidateGroup(', 'float gActive = 0.0;\nvec2 candidateGroup('],
  ['  vec3 shape = candidateShape(p,id);', '  gActive += exp2(id);\n  vec3 shape = candidateShape(p,id);'],
  ['gl_FragColor = vec4(c, 1.0);', 'gl_FragColor = vec4(fwidth(gActive) > 0.0 ? vec3(3.0,0.0,0.0) : c, 1.0);'],
]);

const poses = {
  sky: { x: 90, y: 0, z: 123, yaw: 116 * Math.PI / 180, pitch: .80 },
  wide: { x: 90, y: 0, z: 123, yaw: 200 * Math.PI / 180, pitch: .45 },
  north: { x: 90, y: 0, z: 123, yaw: 340 * Math.PI / 180, pitch: .62 },
  zenith: { x: 90, y: 0, z: 123, yaw: 30 * Math.PI / 180, pitch: 1.35 },
  edge: { x: 90, y: 0, z: 123, yaw: 75 * Math.PI / 180, pitch: .30 },
  sunset: { x: 90, y: 0, z: 123, yaw: 245 * Math.PI / 180, pitch: .18 },
  arrival: { x: 90, y: 0, z: 60, yaw: 0, pitch: .22 },
};
const phases = quick ? [0, 1] : [0, 1 / 3, 2 / 3, 1];
const sessions = quick ? [['desktop', 'high']] : [['desktop', 'low'], ['desktop', 'high'], ['portrait', 'low'], ['portrait', 'high'], ['landscape', 'low'], ['landscape', 'high']];
const layouts = { desktop: { viewport: { width: 1600, height: 900 }, dpr: 1 }, portrait: { viewport: { width: 412, height: 915 }, dpr: 2.625 }, landscape: { viewport: { width: 915, height: 412 }, dpr: 2.625 } };

const rows = [], timing = [], errorsAll = [], checks = [];
const check = (name, ok, details) => { checks.push({ name, ok, details }); console.log(ok ? 'PASS' : 'FAIL', name); };
let version = '';
let port = 4221;
for (const [layout, quality] of sessions) {
  const tag = `${layout}-${quality}`;
  const s = await openSky({ port: port++, ...layouts[layout], quality });
  version = s.version;
  const { page } = s;
  try {
    // Load B's atlas once (review selector), then keep the live material on A; B renders through a cached override.
    await render(page, { pose: poses.sky, t: 0, skyOnly: true, variant: 'masks' });
    await page.waitForFunction(() => window.__r01.sky.material.uniforms.uCloudAtlas.value?.image?.naturalWidth === 1024);
    const shot = async (name, o, save) => {
      const r = await render(page, { t: 0, skyOnly: true, ...o, save });
      if (save) writeFileSync(`${out}/${tag}-${name}.png`, Buffer.from(r.png, 'base64'));
      return r;
    };
    for (const [pn, pose] of Object.entries(poses)) for (const t of phases) {
      const skyOnly = pn !== 'arrival' && pn !== 'sunset';
      const name = `${pn}-${Math.round(t * 3)}`;
      const after = await shot(`${name}-after`, { pose, t, skyOnly }, true);
      const pre = await shot(`${name}-before`, { pose, t, skyOnly, frag: use(before.procedural) }, t === 0);
      const off = await shot(`${name}-clouds0`, { pose, t, skyOnly, clouds: false }, false);
      const offPre = await shot(`${name}-clouds0-before`, { pose, t, skyOnly, clouds: false, frag: use(before.procedural) }, false);
      // Full-scene frames carry unrelated 1-LSB scene noise (manor windows); measure it with a same-shader repeat.
      const noise = skyOnly ? { max: 0, count: 0 } : await diffFrames(page, after.id, (await shot(`${name}-repeat`, { pose, t, skyOnly }, false)).id);
      const diff = await diffFrames(page, after.id, pre.id);
      const row = { tag, name, pose: pn, t, skyOnly, diff, noise, equalToBefore: skyOnly ? diff.max === 0 : diff.max <= Math.max(1, noise.max), afterHash: after.hash,
        cloudsOffEqual: (await diffFrames(page, off.id, offPre.id)).max <= (skyOnly ? 0 : 1), calls: after.calls, triangles: after.triangles, callsBefore: pre.calls, trianglesBefore: pre.triangles,
        glError: after.glError || pre.glError, failures: after.failures, width: after.width, height: after.height, pixelRatio: after.pixelRatio };
      if (t === 0 && skyOnly) {
        await shot(`${name}-stale-before`, { pose, t, frag: use(staleBefore) }, true);
        await shot(`${name}-ubmap-before`, { pose, t, frag: use(ubBefore) }, true);
        const m = await shot(`${name}-masks-after`, { pose, t, frag: use(current.masks) }, true);
        const mb = await shot(`${name}-masks-before`, { pose, t, frag: use(before.masks) }, true);
        row.masksFailures = m.failures; row.masksGlError = m.glError; row.masksDiff = await diffFrames(page, m.id, mb.id);
      }
      rows.push(row);
      console.log(tag, name, row.equalToBefore ? 'equal' : 'DIFF', row.calls, row.triangles);
    }
    // Full 360 degree turn plus exact vertical (beyond the player's 1.35 rad limit; the dome's pole fan).
    for (let yaw = 0; yaw < 360; yaw += quick ? 90 : 30) {
      const o = { pose: { ...poses.sky, yaw: yaw * Math.PI / 180, pitch: .5 }, t: 0 };
      const a = await shot(`turn-${yaw}-after`, o, yaw % 90 === 0), b = await shot(`turn-${yaw}-before`, { ...o, frag: use(before.procedural) }, false);
      rows.push({ tag, name: `turn-${yaw}`, diff: await diffFrames(page, a.id, b.id), equalToBefore: (await diffFrames(page, a.id, b.id)).max === 0, glError: a.glError, failures: a.failures, calls: a.calls, callsBefore: b.calls, triangles: a.triangles, trianglesBefore: b.triangles });
    }
    for (const yaw of [0, 1.7, 3.6]) {
      const o = { pose: poses.zenith, t: 0, camera: { pitch: Math.PI / 2 - 1e-4, yaw } };
      const a = await shot(`pole-${yaw}-after`, o, yaw === 0), b = await shot(`pole-${yaw}-before`, { ...o, frag: use(before.procedural) }, false);
      rows.push({ tag, name: `pole-${yaw}`, diff: await diffFrames(page, a.id, b.id), equalToBefore: (await diffFrames(page, a.id, b.id)).max === 0, glError: a.glError, failures: a.failures, calls: a.calls, callsBefore: b.calls, triangles: a.triangles, trianglesBefore: b.triangles });
    }
    // Software sky-only and full-scene timing, interleaved before/after (NOT physical GPU time).
    if (!quick || process.env.TIMING === '1') for (const scope of ['sky-only', 'scene']) for (let round = 0; round < 3; round++) for (const which of round % 2 ? ['after', 'before'] : ['before', 'after']) {
      const o = { pose: poses.wide, t: 0, skyOnly: scope === 'sky-only', ...(which === 'before' ? { frag: use(before.procedural) } : {}) };
      timing.push({ tag, scope, round, which, ...(await timeSky(page, o)) });
    }
  } finally { errorsAll.push(...s.errors.map(e => `${tag}: ${e}`)); await s.close(); }
}

const summary = {};
for (const r of timing) { const k = `${r.tag}|${r.scope}|${r.which}`; (summary[k] ??= []).push(r.median); }
const perf = Object.entries(summary).map(([k, v]) => { const [tag, scope, which] = k.split('|'); v.sort((a, b) => a - b); return { tag, scope, which, medianOfRoundMedians: v[v.length >> 1], rounds: v }; });
check('No shader compile failures, GL errors or page errors', rows.every(r => !r.glError && !r.failures && !r.masksFailures && !r.masksGlError) && errorsAll.length === 0, errorsAll);
check('Procedural A pixel-identical to pre-fix production in every matched frame (full scene: within same-shader repeat noise)', rows.every(r => r.equalToBefore), rows.filter(r => !r.equalToBefore).map(r => `${r.tag} ${r.name}`));
check('Clouds-off sky unchanged', rows.filter(r => 'cloudsOffEqual' in r).every(r => r.cloudsOffEqual), {});
check('No added draw calls or triangles', rows.every(r => r.calls === r.callsBefore && r.triangles === r.trianglesBefore), {});
const build = Object.fromEntries(readdirSync('dist/assets').filter(f => f.endsWith('.js')).map(f => [f, sha(readFileSync('dist/assets/' + f)).slice(0, 16)]));
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
writeFileSync(`${out}/r01-qa.json`, JSON.stringify({ head, base: BASE, browser: version, build, conditions: 'Real game canvas, WebGL2 ANGLE SwiftShader headless_shell. desktop 1600x900 DPR1; portrait 412x915 / landscape 915x412 at device DPR 2.625 (Low caps 1, High caps 1.5). Timings are synchronised software wall times, NOT physical GPU time.', checks, perf, rows, errors: errorsAll }, null, 2));
console.log(JSON.stringify(perf, null, 1));
if (checks.some(c => !c.ok)) { process.exitCode = 1; }
