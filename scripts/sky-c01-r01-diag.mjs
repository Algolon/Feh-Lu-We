// SKY-C01-R01 isolation matrix: one fixed camera/phase/quality per row, varying exactly one factor.
// Usage: node scripts/sky-c01-r01-diag.mjs /abs/output [desktop|mobile]   (needs `npm run build` first)
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { openSky, render } from './sky-c01-r01-lib.mjs';
const out = process.argv[2]; if (!out) throw Error('Explicit output directory required');
const profile = process.argv[3] ?? 'desktop';
mkdirSync(out, { recursive: true });
const view = profile === 'mobile' ? { viewport: { width: 412, height: 915 }, dpr: 2.625, quality: 'high' } : { viewport: { width: 1600, height: 900 }, dpr: 1, quality: 'high' };

// --- diagnostic shader transforms (applied to the live procedural-A fragment source) -------------------------------
const js = f => `return (${f.toString()})(s);`;
/** Quads where any cloud's early-return decision differs between the 2x2 fragments: derivatives inside the
 *  culled function are undefined there (GLSL ES 3.00: derivatives undefined in non-uniform control flow). Red = divergent quad, blue = evaluated region. */
const UB_MAP = js(s => s
  .replace('vec2 candidateGroup(', 'float gActive = 0.0;\nvec2 candidateGroup(')
  .replace('  vec3 shape = candidateShape(p,id);', '  gActive += exp2(id);\n  vec3 shape = candidateShape(p,id);')
  .replace('gl_FragColor = vec4(c, 1.0);', 'gl_FragColor = vec4(fwidth(gActive) > 0.0 ? vec3(3.0,0.0,0.0) : mix(c*0.55, vec3(0.1,0.25,0.9), gActive > 0.0 ? 0.35 : 0.0), 1.0);'));
/** Branch-free twin of candidateGroup. STALE is what a quad neighbour that skipped the branch contributes to
 *  fwidth(distance): `distance` = well-defined reference; `0.0` = a zeroed/stale register on a real GPU. */
const lanes = stale => js(new Function('s', `return s
  .replace('float shoulder(', 'float gAct = 1.0;\\nfloat shoulder(')
  .replace('float aa = max(fwidth(distance), 0.004);', 'float aa = max(fwidth(gAct > 0.5 ? distance : ${stale}), 0.004);')
  .replace('if (facing < 0.55) return vec2(0.0);', 'gAct = facing < 0.55 ? 0.0 : 1.0;')
  .replace('if (abs(p.x)>1.13 || p.y< -0.63 || p.y>0.78) return vec2(0.0);', 'if (abs(p.x)>1.13 || p.y< -0.63 || p.y>0.78) gAct = 0.0;')
  .replace('return vec2(shape.x,clamp(lit,0.38,0.91));', 'return gAct > 0.5 ? vec2(shape.x,clamp(lit,0.38,0.91)) : vec2(0.0);');`));
/** Derivative magnitude used for the edge width, max over clouds (x50). */
const AA_MAP = js(s => s
  .replace('float shoulder(', 'float gAA = 0.0;\nfloat shoulder(')
  .replace('float aa = max(fwidth(distance), 0.004);', 'float aa = max(fwidth(distance), 0.004); gAA = max(gAA, aa);')
  .replace('gl_FragColor = vec4(c, 1.0);', 'gl_FragColor = vec4(vec3(gAA*50.0), 1.0);'));
/** Per-fragment camera ray instead of the interpolated dome vertex direction. */
const RAY_VERT = 'varying vec3 vWorld; void main(){ vWorld = (modelMatrix*vec4(position,1.0)).xyz; vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }';
const RAY_FRAG = js(s => s.replace('varying vec3 vDir;', 'varying vec3 vWorld;').replace('vec3 d = normalize(vDir);', 'vec3 d = normalize(vWorld - cameraPosition);'));
/** Remove every cloud: background + sun only, with the same shader. */
const NO_SHAPE = js(s => s.replace('vec2 shape = cloudShape(d);', 'vec2 shape = vec2(0.0);'));

const poses = {
  sky: { x: 90, y: 0, z: 123, yaw: 116 * Math.PI / 180, pitch: .80 },
  wide: { x: 90, y: 0, z: 123, yaw: 200 * Math.PI / 180, pitch: .45 },
  north: { x: 90, y: 0, z: 123, yaw: 340 * Math.PI / 180, pitch: .62 },
  zenith: { x: 90, y: 0, z: 123, yaw: 30 * Math.PI / 180, pitch: 1.35 },
};
const rows = [];
const { page, errors, close, version } = await openSky({ port: 4211, ...view });
try {
  async function shot(name, o) {
    const r = await render(page, { t: 0, skyOnly: true, ...o });
    const file = `${profile}-${name}.png`;
    writeFileSync(`${out}/${file}`, Buffer.from(r.png, 'base64'));
    const hash = createHash('sha256').update(r.png).digest('hex').slice(0, 16);
    delete r.png; rows.push({ file, name, hash, ...r });
    console.log(file, hash, r.calls, r.triangles, r.glError, r.failures);
  }
  for (const [pn, pose] of Object.entries(poses)) {
    await shot(`${pn}-A`, { pose });
    await shot(`${pn}-A-ref`, { pose, frag: lanes('distance') });
    await shot(`${pn}-A-stale0`, { pose, frag: lanes('0.0') });
    await shot(`${pn}-ubmap`, { pose, frag: UB_MAP });
    await shot(`${pn}-ubmap-wire`, { pose, frag: UB_MAP, wire: true });
    await shot(`${pn}-aamap`, { pose, frag: AA_MAP });
    await shot(`${pn}-A-wire`, { pose, wire: true });
    await shot(`${pn}-clouds0`, { pose, clouds: false });
    await shot(`${pn}-noshape`, { pose, frag: NO_SHAPE });
    await shot(`${pn}-envl01`, { pose, variant: 'production' });
    await shot(`${pn}-A-48x24`, { pose, segments: [48, 24] });
    await shot(`${pn}-A-64x32`, { pose, segments: [64, 32] });
    await shot(`${pn}-A-ray`, { pose, vert: RAY_VERT, frag: RAY_FRAG });
    await shot(`${pn}-A-scene`, { pose, skyOnly: false });
  }
  // Exactly vertical camera (beyond the player's 1.35 rad limit): the dome's pole fan converges here.
  await shot('pole-A', { pose: poses.zenith, camera: { pitch: Math.PI / 2 - 1e-4, yaw: .3 } });
  await shot('pole-A-wire', { pose: poses.zenith, camera: { pitch: Math.PI / 2 - 1e-4, yaw: .3 }, wire: true });
  await shot('pole-A-ref', { pose: poses.zenith, camera: { pitch: Math.PI / 2 - 1e-4, yaw: .3 }, frag: lanes('distance') });
} finally {
  writeFileSync(`${out}/${profile}-diag.json`, JSON.stringify({ browser: version, profile, view, rows, errors }, null, 2));
  await close();
}
