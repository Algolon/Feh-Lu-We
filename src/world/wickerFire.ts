// DEV-04C Wickerman setpiece, DEV-04D W01 repeatable ritual: an optional environmental interaction in the clearing —
// never puzzle evidence, never a gate, no toasts (the prompt carries the state, the scene shows the change).
//   READY → (one action: the candles light one after another from the nearest) RING_LIT → (matches) BURNING (≈ 80 s;
//   the candles go out one by one at the end) → CHARRED (blackened willow, charred hay, ash) → (clean, 1.8 s)
//   EMPTY_FRAME → (hay from the bale: CARRYING_HAY, session only) → (refill, 1.6 s) READY … indefinitely.
// The rules are pure (wickerRitual.ts); this file builds the visuals and wires the interactables. State lives in
// `state.lit` (`wicker.candles`, `wicker.figure`, `wicker.empty`): save version 4, no schema change.
//
// Cost (W01): the figure and its hay are their own two meshes (char / glow / remnant / fill uniforms on one program
// each), the candle flames one fire (2 meshes), the jars one mesh, the floor glow one mesh. While burning: the flame
// sheets (2 meshes), embers (1), smoke (1). CHARRED adds the ash heap (1); the clean adds the ash puff (1) for 1.8 s.
// Everything belongs to the clearing's `wick` region, so none of it is drawn where the clearing is not.
import * as THREE from 'three';
import type { Outcome } from '../puzzles/rules';
import { has } from '../core/state';
import { WICKER } from './wickerman';
import type { World, GameApi } from '../interactions/world';
import { v3, hitbox } from './kit';
import { makeFire, makeEmbers, regionOwned, FIRE_UNIFORMS, type FireReveal, type Tongue } from './fire';
import { propMats } from './propkit';
import { ITEMS } from '../content/items';
import {
  WICKER_KEYS, WICKER_IDS, newSession, wickerStage, normaliseWicker, candlesLit, figureLit, frameEmpty, lightCandles, blowCandles, igniteFigure,
  settleBurn, cleanFigure, takeHay, putHayBack, refillFigure, figurePrompt, ringPrompt, balePrompt, burnLook, afterglow, candlesOutReveal, candlesShown,
  cleanLook, fillFront, ritualMix, ss, CANDLE_SWEEP, WICKER_BURN, CANDLES_OUT, CLEAN_TIME, REFILL_TIME, CARRY_RADIUS, type RitualMix,
} from './wickerRitual';

// the C / C-R API keeps its names (tests and the DEV-04C suites import them from here)
export {
  WICKER_KEYS, WICKER_IDS, candlesLit, figureLit, lightCandles, blowCandles, igniteFigure, CANDLE_SWEEP, candlesShown, WICKER_BURN, burnLook,
} from './wickerRitual';
export { figureMessage, type BurnLook } from './wickerRitual';

/**
 * Flame columns over the figure (W01 sheet fire; plan offsets from the figure's foot point, plan z = −local z): a few
 * broad columns that follow the legs, the torso, the arms and the head. Each is drawn as an open, noise-shaded flame
 * sheet (flameSheets), so neighbouring columns merge into one fire instead of a stack of separate teardrop "petals".
 * `y` is the column's base: the fire climbs the figure base by base (uSpread) and dies back from below (uOut).
 */
export function effigyTongues(part: 'low' | 'high'): Tongue[] {
  const J = WICKER, out: Tongue[] = [];
  if (part === 'low') {
    for (const sd of [-1, 1]) {
      out.push({ x: sd * J.footX * 0.95, y: J.ankle - 0.06, z: 0.0, h: 1.0, r: 0.17, lean: sd * 0.05 });
      out.push({ x: sd * (J.footX * 0.85 + J.hipX * 0.15), y: J.knee - 0.12, z: 0.02, h: 1.05, r: 0.19, lean: sd * 0.04 });
    }
    out.push({ x: 0, y: J.hip - 0.28, z: 0.0, h: 1.4, r: 0.4 });
    out.push({ x: 0.03, y: J.hip - 0.1, z: -0.05, h: 1.1, r: 0.3 });
  } else {
    out.push({ x: 0, y: J.waist, z: 0.0, h: 1.9, r: 0.4 });
    out.push({ x: -0.04, y: J.chest - 0.1, z: 0.05, h: 1.5, r: 0.3 });
    for (const sd of [-1, 1]) {
      const sh = [sd * J.shoulderX, J.shoulder - 0.1], el = [sd * J.elbow[0], J.elbow[1]], wr = [sd * J.wrist[0], J.wrist[1]];
      out.push({ x: (sh[0] + el[0]) / 2, y: (sh[1] + el[1]) / 2 - 0.1, z: 0.03, h: 0.8, r: 0.16, lean: sd * 0.12 });
      out.push({ x: el[0], y: el[1] - 0.12, z: 0.06, h: 0.7, r: 0.14, lean: sd * 0.16 });
      out.push({ x: (el[0] + wr[0]) / 2 + sd * 0.04, y: (el[1] + wr[1]) / 2 - 0.12, z: 0.05, h: 0.6, r: 0.12, lean: sd * 0.18 });
    }
    out.push({ x: 0, y: J.neck - 0.12, z: 0.0, h: 1.55, r: 0.27 });
    out.push({ x: 0.04, y: J.head + 0.02, z: 0.02, h: 1.15, r: 0.15 });
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ shared textures
/** Tileable value-noise fbm (128², RGBA, one channel used) for the flame sheets. */
let NOISE: THREE.DataTexture | null = null;
function noiseTex() {
  if (NOISE) return NOISE;
  const N = 128, data = new Uint8Array(N * N * 4);
  const lattice = (f: number, seed: number) => { const a = new Float32Array(f * f); let s = seed; for (let i = 0; i < a.length; i++) { s = (s * 16807) % 2147483647; a[i] = s / 2147483647; } return a; };
  const octaves = [[4, 0.5, 11], [8, 0.28, 23], [16, 0.15, 37], [32, 0.07, 51]] as const;
  const L = octaves.map(([f, , seed]) => lattice(f, seed));
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let v = 0;
    octaves.forEach(([f, amp], o) => {
      const fx = (x / N) * f, fy = (y / N) * f, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty), g = (i: number, j: number) => L[o][((j + f) % f) * f + ((i + f) % f)];
      v += amp * (g(x0, y0) * (1 - sx) * (1 - sy) + g(x0 + 1, y0) * sx * (1 - sy) + g(x0, y0 + 1) * (1 - sx) * sy + g(x0 + 1, y0 + 1) * sx * sy);
    });
    const q = (y * N + x) * 4, b = Math.round(Math.min(1, v / 1.0) * 255);
    data[q] = data[q + 1] = data[q + 2] = b; data[q + 3] = 255;
  }
  NOISE = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  NOISE.wrapS = NOISE.wrapT = THREE.RepeatWrapping;
  NOISE.magFilter = THREE.LinearFilter; NOISE.minFilter = THREE.LinearFilter;
  NOISE.needsUpdate = true;
  NOISE.userData.shared = true;
  return NOISE;
}
/** Four soft, irregular smoke puffs (2 × 2 cells of 64²): alpha = cloudy coverage, red = internal shading. */
let PUFFS: THREE.DataTexture | null = null;
function puffTex() {
  if (PUFFS) return PUFFS;
  const C = 64, N = C * 2, data = new Uint8Array(N * N * 4);
  let s = 97; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let cell = 0; cell < 4; cell++) {
    const blobs = Array.from({ length: 7 }, (_, i) => { const a = rnd() * Math.PI * 2, d = i === 0 ? 0 : 0.18 + rnd() * 0.22; return { x: Math.cos(a) * d, y: Math.sin(a) * d * 0.8 - 0.05, r: (i === 0 ? 0.36 : 0.16 + rnd() * 0.14) }; });
    const ox = (cell % 2) * C, oy = Math.floor(cell / 2) * C;
    for (let j = 0; j < C; j++) for (let i = 0; i < C; i++) {
      const u = (i + 0.5) / C * 2 - 1, v = (j + 0.5) / C * 2 - 1;
      let a = 0, lit = 0;
      for (const b of blobs) { const w = Math.exp(-(((u - b.x) ** 2 + (v - b.y) ** 2) / (b.r * b.r))); a += w; lit += w * (0.5 + 0.5 * (b.y - v + b.x * 0.3 - u * 0.3)); }
      const n = 0.85 + 0.3 * Math.sin(u * 13.1 + v * 7.3 + cell) * Math.sin(v * 11.7 - u * 5.1);
      const edge = Math.max(0, 1 - Math.hypot(u, v) ** 3);
      const al = Math.min(1, Math.max(0, (a * n - 0.28) / 0.9)) * edge;
      const q = ((oy + j) * N + ox + i) * 4;
      data[q] = Math.round(Math.min(1, Math.max(0, lit / Math.max(a, 1e-3))) * 255); data[q + 1] = data[q + 2] = 0; data[q + 3] = Math.round(al * al * (3 - 2 * al) * 255);
    }
  }
  PUFFS = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  PUFFS.magFilter = THREE.LinearFilter; PUFFS.minFilter = THREE.LinearFilter;
  PUFFS.needsUpdate = true;
  PUFFS.userData.shared = true;
  return PUFFS;
}

const OUT_CHUNKS = '#include <tonemapping_fragment>\n#include <colorspace_fragment>\n#include <fog_fragment>';

// ------------------------------------------------------------------------------------------------ sheet fire
export interface FlameUniforms { uLow: { value: number }; uHigh: { value: number }; uSpread: { value: number }; uOut: { value: number } }
/**
 * W01 sheet fire: every column is an open, tapered tube whose fragments are shaped by scrolling noise into one body of
 * flame at the base that breaks into tongues towards the top (warm authored ramp: deep red → orange → yellow → a pale
 * core). One mesh per group (lower / upper body), unlit, alpha-blended without depth writes, fogged; the flutter runs
 * on the shared flame clock (frozen in reduced motion: a still but fully shaped fire).
 */
function flameSheets(w: World, cols: Tongue[], group: 0 | 1, U: FlameUniforms) {
  const parts: THREE.BufferGeometry[] = [];
  cols.forEach((c, i) => {
    const g = new THREE.CylinderGeometry(c.r * 0.42, c.r, c.h, 9, 5, true).translate(0, c.h / 2, 0);
    const p = g.attributes.position, n = p.count, sheet = new Float32Array(n * 4), grp = new Float32Array(n).fill(group);
    const seed = ((i * 0.618 + group * 0.37) % 1);
    for (let v = 0; v < n; v++) {
      const a = Math.atan2(p.getZ(v), p.getX(v));
      sheet.set([(a / (Math.PI * 2) + 1) % 1, p.getY(v) / c.h, c.y, seed], v * 4);
    }
    if (c.lean) g.rotateZ(c.lean);
    g.translate(c.x, c.y, -c.z);
    g.setAttribute('aSheet', new THREE.BufferAttribute(sheet, 4));
    g.setAttribute('aGroup', new THREE.BufferAttribute(grp, 1));
    g.deleteAttribute('uv');
    parts.push(g.toNonIndexed());
    g.dispose();
  });
  const geo = mergeAll(parts, ['position', 'normal', 'aSheet', 'aGroup']);
  parts.forEach((p) => p.dispose());
  const mat = w.material(new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: FIRE_UNIFORMS.uTime, uMotion: FIRE_UNIFORMS.uMotion, uNoise: { value: noiseTex() }, ...U },
    vertexShader: `#include <common>
#include <fog_pars_vertex>
attribute vec4 aSheet; attribute float aGroup;
uniform float uTime; uniform float uMotion; uniform float uLow; uniform float uHigh; uniform float uSpread; uniform float uOut;
varying vec2 vUv; varying float vK; varying float vV; varying float vSeed; varying float vFacing;
void main() {
  float k = (aGroup < 0.5 ? uLow : uHigh) * smoothstep(aSheet.z - 0.15, aSheet.z + 0.55, uSpread) * (1.0 - 0.85 * smoothstep(aSheet.z - 0.3, aSheet.z + 0.5, uOut));
  vK = k;
  float v = aSheet.y, t = uTime * uMotion;
  vec3 p = position;
  p.y = aSheet.z + (p.y - aSheet.z) * (0.3 + 0.7 * k); // a weak flame is a short flame
  p.x += sin(t * 5.3 + aSheet.w * 6.28 + p.y * 3.1) * 0.07 * v * v * (0.4 + k);
  p.z += cos(t * 4.1 + aSheet.w * 4.0 + p.y * 2.3) * 0.06 * v * v * (0.4 + k);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  vFacing = abs(normalize(normalMatrix * normal).z);
  vUv = vec2(aSheet.x, p.y); vV = v; vSeed = aSheet.w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: `#include <common>
#include <fog_pars_fragment>
uniform sampler2D uNoise; uniform float uTime; uniform float uMotion;
varying vec2 vUv; varying float vK; varying float vV; varying float vSeed; varying float vFacing;
void main() {
  if (vK < 0.01) discard;
  float t = uTime * uMotion;
  float n1 = texture2D(uNoise, vec2(vUv.x + vSeed, vUv.y * 0.42 - t * 0.55)).r;
  float n2 = texture2D(uNoise, vec2(vUv.x * 2.0 - vSeed * 1.7, vUv.y * 0.85 - t * 1.15)).r;
  float n = n1 * 0.62 + n2 * 0.38;
  float v = vV;
  // a body of flame low in the column, breaking into licking tongues above it; holes let the willow show through
  float m = n * 1.35 + (1.0 - v) * (0.5 + 0.3 * vK) - 0.95 - v * v * 0.3 + 0.15 * vK;
  if (m < 0.0) discard;
  float a = smoothstep(0.0, 0.12, m) * mix(0.55, 1.0, vFacing) * smoothstep(0.0, 0.1, v);
  float heat = clamp(m * 1.15 + (1.0 - v) * 0.1 + vFacing * 0.06, 0.0, 1.0);
  // authored ramp (sRGB): ember red at the ragged edges and tips → orange body → warm yellow → a pale core low down
  vec3 col = mix(vec3(0.55, 0.1, 0.03), vec3(0.97, 0.42, 0.08), smoothstep(0.0, 0.3, heat));
  col = mix(col, vec3(1.0, 0.68, 0.24), smoothstep(0.3, 0.65, heat));
  col = mix(col, vec3(1.0, 0.9, 0.62), smoothstep(0.72, 0.98, heat));
  col = pow(col, vec3(2.2)); // to linear: the output chunk encodes back to sRGB
  gl_FragColor = vec4(col * 1.15, a * 0.92);
  ${OUT_CHUNKS}
}`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
  }));
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 4;
  mesh.userData.fire = true;
  return mesh;
}

// ------------------------------------------------------------------------------------------------ soft smoke
export interface SmokeOpts { h: number; n: number; size: number; wind: number; speed: number; low: string; high: string; seed?: number }
/**
 * W01 smoke: soft, irregular camera-facing puffs (four painted puff shapes, each rotating slowly), rising with varied
 * drift and scale, warm-lit at the base by the fire, thinning out as they disperse. Replaces the faceted icosahedron
 * column. One mesh, one draw call; `uDensity` drives the whole column (0 = hidden).
 */
function ritualSmoke(w: World, o: SmokeOpts) {
  const pos: number[] = [], corner: number[] = [], puff: number[] = [], idx: number[] = [];
  let s = o.seed ?? 5; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < o.n; i++) {
    const seed = rnd(), phase = (i + rnd() * 0.6) / o.n, speed = o.speed * (0.8 + rnd() * 0.4), variant = rnd();
    for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(0, 0, 0); corner.push(cx, cy); puff.push(seed, phase, speed, variant); }
    const b = i * 4; idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aCorner', new THREE.Float32BufferAttribute(corner, 2));
  geo.setAttribute('aPuff', new THREE.Float32BufferAttribute(puff, 4));
  geo.setIndex(idx);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(o.wind * 0.5, o.h / 2, 0), o.h * 0.6 + o.size * 2 + Math.abs(o.wind));
  const uDensity = { value: 0 }, uFireLit = { value: 0 };
  const mat = w.material(new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: FIRE_UNIFORMS.uTime, uMotion: FIRE_UNIFORMS.uMotion, uPuffTex: { value: puffTex() }, uDensity, uFireLit,
      uLowC: { value: new THREE.Color(o.low) }, uHighC: { value: new THREE.Color(o.high) } },
    vertexShader: `#include <common>
#include <fog_pars_vertex>
attribute vec2 aCorner; attribute vec4 aPuff;
uniform float uTime; uniform float uMotion; uniform float uDensity;
varying vec2 vUv; varying float vA; varying float vK;
void main() {
  float t = uTime * uMotion + aPuff.x * 40.0;
  float k = fract(aPuff.y + t * aPuff.z);
  float s = aPuff.x;
  vec3 c = vec3(sin(s * 6.28 + k * 2.6) * 0.32 * k + k * k * ${o.wind.toFixed(3)}, k * ${o.h.toFixed(3)}, cos(s * 9.1 + k * 2.1) * 0.28 * k);
  float size = ${o.size.toFixed(3)} * mix(0.32, 1.3, sqrt(k)) * (0.75 + 0.5 * fract(s * 7.31)); // the upper puffs swell and overlap: one dispersing plume, not discs
  vec4 mvPosition = modelViewMatrix * vec4(c, 1.0);
  float ang = s * 6.28 + t * 0.25 * (fract(s * 3.7) - 0.5);
  mvPosition.xy += vec2(cos(ang) * aCorner.x - sin(ang) * aCorner.y, sin(ang) * aCorner.x + cos(ang) * aCorner.y) * size;
  gl_Position = projectionMatrix * mvPosition;
  float cell = floor(aPuff.w * 3.999);
  vUv = (aCorner * 0.5 + 0.5) * 0.5 + vec2(mod(cell, 2.0), floor(cell / 2.0)) * 0.5;
  vA = smoothstep(0.0, 0.14, k) * (1.0 - smoothstep(0.3, 0.9, k)) * (1.0 - 0.35 * k) * uDensity;
  vK = k;
  #include <fog_vertex>
}`,
    fragmentShader: `#include <common>
#include <fog_pars_fragment>
uniform sampler2D uPuffTex; uniform vec3 uLowC; uniform vec3 uHighC; uniform float uFireLit;
varying vec2 vUv; varying float vA; varying float vK;
void main() {
  vec4 tx = texture2D(uPuffTex, vUv);
  float a = tx.a * vA;
  if (a < 0.008) discard;
  vec3 col = mix(uLowC, uHighC, smoothstep(0.0, 0.65, vK)) * (0.78 + 0.36 * tx.r);
  col = mix(col, vec3(0.86, 0.24, 0.05), uFireLit * (1.0 - smoothstep(0.0, 0.3, vK)) * 0.55); // linear: a warm underside
  gl_FragColor = vec4(col, a);
  ${OUT_CHUNKS}
}`,
    transparent: true, depthWrite: false, fog: true,
  }));
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 6;
  mesh.frustumCulled = true;
  return { mesh, uDensity, uFireLit };
}

// ------------------------------------------------------------------------------------------------ burn material
/** Shader uniforms of the figure (willow) and its hay. */
export interface BurnUniforms {
  uChar: { value: number }; uGlow: { value: number }; uEmber: { value: number };
  /** W01: hay drawn as the charred remnant (1) instead of hay (0) */ uRemnant: { value: number };
  /** W01: remnant above this height (local m) is cleaned away (the clean crumbles it from the top) */ uClean: { value: number };
  /** W01: refill front over the hay's `aFill` order (≥ 1.04 = full) */ uFill: { value: number };
}
/**
 * Shader extension for the figure / hay materials: a char front rising from the feet with an ember band at it (C), and
 * (W01, hay only) the refill front, the charred remnant (black / ash clumps, about half of the volume, slumped a little,
 * ember spots fading) and its top-down crumble while cleaning. Same program per kind in every stage.
 */
export function burnMaterial(m: THREE.MeshLambertMaterial, u: BurnUniforms, time: { value: number }, kind: 'willow' | 'hay') {
  const top = (WICKER.head + WICKER.headR * 1.6).toFixed(2), hay = kind === 'hay';
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u, { uTime: time });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vBurnP;${hay ? '\nattribute float aFill; varying float vFill; uniform float uRemnant;' : ''}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvBurnP = position;${hay ? '\nvFill = aFill;\nif (uRemnant > 0.5) { transformed.xz *= 0.95; transformed.y = transformed.y * 0.97 - 0.02; } // the remnant slumps inside the cage' : ''}`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vBurnP; uniform float uChar; uniform float uGlow; uniform float uEmber; uniform float uTime;${hay ? '\nvarying float vFill; uniform float uRemnant; uniform float uClean; uniform float uFill;' : ''}
float burnN(vec3 p) { return sin(p.x * 23.0 + p.y * 7.0) * sin(p.z * 19.0 - p.y * 13.0) * 0.09 + sin((p.x - p.z) * 41.0 + p.y * 29.0) * 0.04; }
float burnH(vec3 p, float s) { return fract(sin(dot(floor(p * s), vec3(12.9898, 78.233, 37.719))) * 43758.5453); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
  float front = uChar * (${top} + 0.4) - 0.2;
  float hh = vBurnP.y + burnN(vBurnP);
  float charred = 0.0, band = 0.0, rem = 0.0;
  ${hay ? `if (vFill > uFill) discard; // W01 refill: the hay packs in from the feet up, the tufts last
  if (uRemnant > 0.5) {
    // W01 charred remnant: lumpy black / ash clumps (more of it low down, where it fell), crumbling from the top
    float clump = sin(vBurnP.x * 9.0 + vBurnP.y * 5.0) * sin(vBurnP.z * 8.0 - vBurnP.y * 7.0) + 0.5 * sin((vBurnP.x + vBurnP.z) * 13.0 + vBurnP.y * 11.0);
    float keep = 0.1 - 0.55 * (1.0 - smoothstep(0.3, 1.9, vBurnP.y)); // more of it low down, where it fell
    if (clump < keep - 0.45 || hh > uClean) discard; // broad clumps with holes (≈ 60 % kept), not speckle
    float ash = smoothstep(0.05, 1.0, clump) * 0.8 + burnH(vBurnP, 23.0) * 0.2;
    float scorch = smoothstep(0.35, 0.75, sin(vBurnP.x * 17.0 - vBurnP.z * 11.0 + vBurnP.y * 6.0) * 0.5 + 0.5) * (1.0 - smoothstep(0.55, 0.9, ash));
    // grey ash on the tops of the clumps, charcoal in the breaks, a few patches of scorched (not yet burned) straw:
    // lighter and warmer than the black willow, so the remnant reads, and not one flat grey
    vec3 rc = mix(vec3(0.06, 0.055, 0.05), vec3(0.4, 0.385, 0.36), clamp(ash + smoothstep(uClean - 0.25, uClean, hh) * 0.4, 0.0, 1.0));
    diffuseColor.rgb = mix(rc, vec3(0.3, 0.19, 0.1), scorch * 0.45);
    rem = 1.0;
    charred = 1.0;
  } else {
    if (hh < front - 0.12) discard; // the hay is burned away below the front
    charred = 1.0 - smoothstep(front - 0.22, front + 0.04, hh);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.075, 0.06, 0.05) + diffuseColor.rgb * 0.1, charred * 0.75);
    band = smoothstep(front - 0.3, front - 0.04, hh) * (1.0 - smoothstep(front - 0.04, front + 0.22, hh));
  }` : `charred = 1.0 - smoothstep(front - 0.22, front + 0.04, hh);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.075, 0.06, 0.05) + diffuseColor.rgb * 0.1, charred * 0.94);
  band = smoothstep(front - 0.3, front - 0.04, hh) * (1.0 - smoothstep(front - 0.04, front + 0.08, hh));`}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  float flick = 0.75 + 0.25 * sin(uTime * 7.0 + vBurnP.y * 9.0 + vBurnP.x * 13.0);
  float spot = step(${hay ? '0.6' : '0.72'}, burnH(vBurnP, 9.0));
  totalEmissiveRadiance += vec3(1.0, 0.36, 0.07) * (band * uGlow * ${hay ? '1.6' : '1.1'} * flick + charred * spot * uEmber * (0.5 + 0.5 * sin(uTime * 2.3 + vBurnP.y * 17.0)) * smoothstep(${hay ? '1.6' : '0.9'}, 0.0, vBurnP.y)${hay ? ' * (1.0 + rem)' : ''});`);
  };
  m.customProgramCacheKey = () => `wicker-burn-w01-${kind}`;
  return m;
}

/** W01: the ash heap on the plinth between the feet, with a few charcoal lumps (local: y 0 = the plinth top). */
function ashHeapGeo() {
  const parts: THREE.BufferGeometry[] = [];
  const hash = (x: number, y: number, z: number) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); };
  const heap = (cx: number, cz: number, rx: number, ry: number, rz: number) => {
    const g = new THREE.SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(rx, ry, rz);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = 1 + 0.22 * (hash(x * 9, 0, z * 9) - 0.5) * (y > 0.001 ? 1 : 0); p.setXYZ(i, x * n + cx, y * (0.8 + 0.4 * hash(z, y, x)), z * n + cz); }
    return g;
  };
  parts.push(heap(0, 0.02, 0.4, 0.14, 0.32), heap(-0.12, -0.18, 0.18, 0.07, 0.14), heap(0.2, 0.2, 0.16, 0.06, 0.12));
  for (let i = 0; i < 9; i++) { const a = i * 2.4, d = 0.12 + (i % 3) * 0.09; parts.push(new THREE.DodecahedronGeometry(0.025 + (i % 4) * 0.008, 0).scale(1.6, 0.7, 1).rotateY(a).translate(Math.cos(a) * d, 0.05 + (i % 2) * 0.03, Math.sin(a) * d)); }
  const all = parts.map((g) => { if (g.attributes.uv) g.deleteAttribute('uv'); return g.index ? g.toNonIndexed() : g; });
  const out = mergeAll(all, ['position', 'normal']);
  all.forEach((g) => g.dispose());
  const p = out.attributes.position as THREE.BufferAttribute, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), lump = i >= p.count - 9 * 36, k = hash(x * 21, y * 21, z * 21);
    const g = lump ? 0.05 + 0.04 * k : k < 0.22 ? 0.09 : 0.3 + 0.16 * k; // ash grey with charcoal flecks
    col.set([g * 1.02, g, g * 0.95], i * 3);
  }
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.computeVertexNormals();
  return out;
}

// ------------------------------------------------------------------------------------------------ build

export interface WickerSetOpts {
  x: number; z: number; gy: number; foot: number;
  figure: THREE.BufferGeometry; hay: THREE.BufferGeometry;
  candles: { x: number; y: number; z: number }[];
  jar: THREE.BufferGeometry; jarY: number[];
  region: string;
  /** W01: the hay bale (plan centre, heading, ground height): its hitbox becomes `wicker.bale` */
  bale: { x: number; z: number; yaw: number; y: number };
}

/** Build the interactive layer of the clearing (called from grounds.ts during the estate build). */
export function buildWickerSetpiece(w: World, g: GameApi, o: WickerSetOpts) {
  const { x, z, gy, foot, region } = o;
  const s = () => g.state;
  const sess = newSession();
  // ---- figure + hay: own meshes so their materials can char, glow, crumble and refill
  const U: BurnUniforms = { uChar: { value: 0 }, uGlow: { value: 0 }, uEmber: { value: 0 }, uRemnant: { value: 0 }, uClean: { value: 9 }, uFill: { value: 2 } };
  const willowMat = w.material(burnMaterial(new THREE.MeshLambertMaterial({ vertexColors: true }), U, FIRE_UNIFORMS.uTime, 'willow'));
  // W01: the hay a touch lighter and warmer than the prop sheet, so "filled" reads against the willow at clearing distance
  const hayMat = w.material(burnMaterial(new THREE.MeshLambertMaterial({ vertexColors: true, map: propMats().props.map, color: new THREE.Color(1.3, 1.2, 0.98), side: THREE.DoubleSide }), U, FIRE_UNIFORMS.uTime, 'hay')); // double-sided: where the burn front or the remnant opens a lump, its far inside shows, not the sky
  const figure = new THREE.Mesh(o.figure, willowMat), hay = new THREE.Mesh(o.hay, hayMat);
  for (const m of [figure, hay]) { m.position.copy(v3(x, foot, z)); m.castShadow = true; m.receiveShadow = true; m.userData.wicker = true; regionOwned(w, m, region); }
  figure.userData.wickerFigure = true; hay.userData.wickerHay = true;
  // W01: the ash heap (CHARRED) on the plinth top between the feet
  const ashU = { uEmber: { value: 0 } };
  const ashMat = w.material(new THREE.MeshLambertMaterial({ vertexColors: true }));
  ashMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, ashU, { uTime: FIRE_UNIFORMS.uTime });
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vAshP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvAshP = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vAshP; uniform float uEmber; uniform float uTime;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\nfloat sp = step(0.86, fract(sin(dot(floor(vAshP * 26.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453));\ntotalEmissiveRadiance += vec3(1.0, 0.33, 0.06) * sp * uEmber * (0.6 + 0.4 * sin(uTime * 1.7 + vAshP.x * 40.0));');
  };
  ashMat.customProgramCacheKey = () => 'wicker-ash';
  const ash = new THREE.Mesh(ashHeapGeo(), ashMat);
  ash.position.copy(v3(x, foot - 0.12, z));
  ash.visible = false;
  regionOwned(w, ash, region);

  // ---- candle ring: glass jars that glow when lit, one fire for all nine flames (revealed one after another)
  const n = o.candles.length;
  const jarParts = o.candles.map((cd, i) => {
    const jg = o.jar.clone().translate(cd.x - x, o.jarY[i] - gy, -(cd.z - z));
    jg.setAttribute('aOrder', new THREE.BufferAttribute(new Float32Array(jg.attributes.position.count).fill((i + 0.5) / n), 1));
    return jg.index ? jg.toNonIndexed() : jg;
  });
  const jarGeo = mergeAll(jarParts, ['position', 'normal', 'aOrder']);
  const flames = makeFire(w, { kind: 'candles', x, y: gy, z, wicks: o.candles.map((cd) => [cd.x - x, cd.y - gy, cd.z - z] as [number, number, number]), s: 1.35, reveal: true, owner: { region } });
  const reveal = flames.userData.reveal as FireReveal;
  const jarMat = w.material(new THREE.MeshLambertMaterial({ color: '#d5e1d8', transparent: true, opacity: 0.45, depthWrite: false, emissive: new THREE.Color('#000000') }));
  const jarGlow = { value: 0 };
  jarMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uReveal: reveal.uReveal, uStart: reveal.uStart, uJarGlow: jarGlow });
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aOrder; uniform float uReveal; uniform float uStart; varying float vLitJar;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLitJar = fract(aOrder - uStart + 1.0) > uReveal ? 0.0 : 1.0;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vLitJar; uniform float uJarGlow;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.62, 0.26) * 0.55 * vLitJar * uJarGlow;\ndiffuseColor.a = mix(diffuseColor.a, 0.7, vLitJar * uJarGlow);');
  };
  jarMat.customProgramCacheKey = () => 'wicker-jar';
  const jars = new THREE.Mesh(jarGeo, jarMat);
  jars.position.copy(v3(x, gy, z));
  jars.renderOrder = 3;
  regionOwned(w, jars, region);

  // ---- the figure's fire (W01 sheet fire: lower body, upper body), embers, smoke, smouldering remains, ash puff
  const FU: FlameUniforms = { uLow: { value: 0 }, uHigh: { value: 0 }, uSpread: { value: 0 }, uOut: { value: -1 } };
  const fireRoot = new THREE.Group();
  fireRoot.position.copy(v3(x, foot, z));
  const fLow = flameSheets(w, effigyTongues('low'), 0, FU), fHigh = flameSheets(w, effigyTongues('high'), 1, FU);
  fireRoot.add(fLow, fHigh);
  regionOwned(w, fireRoot, region);
  const embers = makeEmbers(w, { x, y: foot + 0.4, z, r: 0.5, h: 4.6, n: 46, owner: { region } });
  const smoke = ritualSmoke(w, { h: 8, n: 18, size: 1.9, wind: 2.2, speed: 0.05, low: '#3d3833', high: '#a19e99', seed: 11 });
  smoke.mesh.position.copy(v3(x, foot + 2.3, z));
  regionOwned(w, smoke.mesh, region);
  const puff = ritualSmoke(w, { h: 1.3, n: 9, size: 0.42, wind: 0.25, speed: 0.55, low: '#6f6a64', high: '#b9b4ab', seed: 23 });
  puff.mesh.position.copy(v3(x, foot - 0.05, z));
  regionOwned(w, puff.mesh, region);
  const smoulder = makeFire(w, { kind: 'hearth', x, y: foot - 0.02, z, s: 0.55, seed: 13, owner: { region } });

  // ---- light: the ring (soft, warm) and the fire (strong, flickering, fading to an ember glow)
  let look = burnLook(null), glowK = 0;
  w.lamps.push({ id: WICKER_KEYS.candles, pos: v3(x, gy + 0.6, z), color: '#ffb35a', get intensity() { return 3.2 * Math.max(0.12, reveal.uReveal.value); }, distance: 9, on: () => candlesLit(s()), flicker: 0.18, room: 'out' }); // ramps with the sweep
  w.lamps.push({ id: WICKER_KEYS.figure, pos: v3(x, foot + 1.4, z - 0.6), color: '#ff8a3a', get intensity() { return 18 * Math.max(0.05, look.light); }, distance: 20, on: () => sess.burning || (figureLit(s()) && glowK > 0.02), flicker: 0.32, room: 'out' });
  // floor glow under the candles and the fire: the clearing's own additive mesh (in the shared LightPatches mesh its
  // bounding sphere would span the estate and cost a draw call in every view)
  const glow = glowPatches(w, x, gy, z, [...o.candles.map((cd, i) => ({ x: cd.x, y: cd.y - 0.12, z: cd.z, r: 0.42, k: 0, order: (i + 0.5) / n })), { x, y: gy + 0.05, z, r: 3.4, k: 1, order: 0 }], reveal);
  regionOwned(w, glow.mesh, region);

  // ---- W01 ritual sound: the procedural layers and one-shot events, localised by Game.updateAudio (World.ritual)
  const events: string[] = [];
  w.ritual = { pos: v3(x, foot + 1.2, z), mix: () => mix, events };
  let mix: RitualMix = ritualMix(null);

  // ---- timeline. Session clocks: litAt (sweep), ignAt (burn; -Infinity = loaded aftermath), cleanAt, fillAt.
  let now = 0, litAt = -Infinity, ignAt: number | null = null, cleanAt = -Infinity, fillAt = -Infinity, seen = false, shownLast = -1;
  const burnT = () => (ignAt === null ? null : ignAt === -Infinity ? Infinity : now - ignAt);
  const apply = () => {
    const st = wickerStage(s(), sess), t = burnT();
    look = burnLook(t);
    const cl = candlesLit(s());
    // candles: the sweep when lit; while the burn settles they go out one by one in reverse sweep order
    let rev = cl ? Math.min(1, (now - litAt) / CANDLE_SWEEP) : 0;
    if (sess.burning && t !== null && t > CANDLES_OUT.start) rev = Math.min(rev, candlesOutReveal(t));
    reveal.uReveal.value = rev;
    flames.visible = cl && rev > 0;
    jarGlow.value = cl ? 1 : 0;
    glow.uCandle.value = cl ? 0.24 : 0; // per candle: each floor glow follows its own candle in the sweep (glowPatches)
    // after the burn: ember spots and the remains' glow fade over AFTERGLOW s (a loaded remnant is cold)
    glowK = st === 'BURNING' ? 1 : st === 'CHARRED' ? afterglow(t) : 0;
    glow.uFire.value = st === 'BURNING' ? 0.34 * Math.max(0.25, look.light) : st === 'CHARRED' ? 0.34 * 0.25 * glowK : 0;
    glow.mesh.visible = cl || glow.uFire.value > 0.004;
    // fire
    const burning = st === 'BURNING';
    FU.uLow.value = burning ? look.flameLow : 0; FU.uHigh.value = burning ? look.flameHigh : 0;
    FU.uSpread.value = t === null || !Number.isFinite(t) ? 0 : 0.1 + 3.2 * ss(0, 14, t);
    FU.uOut.value = t === null || !Number.isFinite(t) ? -1 : -0.6 + 4.0 * ss(46, 72, t);
    fLow.visible = burning && look.flameLow > 0.01; fHigh.visible = burning && look.flameHigh > 0.01;
    smoulder.visible = (burning || st === 'CHARRED') && look.smoulder * glowK > 0.03; smoulder.scale.setScalar(0.3 + 0.7 * look.smoulder * glowK);
    embers.visible = burning ? look.flameLow > 0.15 || look.smoulder > 0.3 : st === 'CHARRED' && glowK > 0.4;
    smoke.uDensity.value = burning ? Math.min(1, Math.max(look.flameLow, look.flameHigh) * 0.9 + look.smoulder * 0.25) : st === 'CHARRED' ? 0.22 * glowK : 0;
    smoke.uFireLit.value = burning ? Math.max(look.flameLow, look.flameHigh) : 0;
    smoke.mesh.visible = smoke.uDensity.value > 0.01;
    // the figure: C burn look, then W01 remnant / clean / refill
    const pc = (now - cleanAt) / CLEAN_TIME, pf = (now - fillAt) / REFILL_TIME;
    if (st === 'CHARRED' || st === 'BURNING') {
      U.uChar.value = look.char; U.uGlow.value = look.glow; U.uEmber.value = 0.4 * look.smoulder * glowK;
      U.uRemnant.value = look.settled ? 1 : 0; U.uClean.value = 9; U.uFill.value = 2;
      hay.visible = true;
      ash.visible = look.char > 0.55; ash.scale.set(1, Math.max(0.05, ss(0.55, 1, look.char)), 1);
      ashU.uEmber.value = 0.8 * glowK * look.smoulder;
      puff.mesh.visible = false;
    } else if ((st === 'EMPTY_FRAME' || st === 'CARRYING_HAY') && pc < 1) { // cleaning (1.8 s)
      const c = cleanLook(pc);
      U.uChar.value = c.char; U.uGlow.value = 0; U.uEmber.value = 0;
      U.uRemnant.value = 1; U.uClean.value = -0.25 + (WICKER.head + 0.5) * c.remnant; U.uFill.value = 2;
      hay.visible = c.remnant > 0.001;
      ash.visible = c.ash > 0.02; ash.scale.set(0.6 + 0.4 * c.ash, Math.max(0.05, c.ash), 0.6 + 0.4 * c.ash); ashU.uEmber.value = 0;
      puff.uDensity.value = 0.85 * c.puff; puff.mesh.visible = c.puff > 0.01;
    } else {
      U.uChar.value = 0; U.uGlow.value = 0; U.uEmber.value = 0; U.uRemnant.value = 0; U.uClean.value = 9;
      const filling = (st === 'READY' || st === 'RING_LIT') && pf < 1;
      U.uFill.value = filling ? fillFront(Math.max(0, pf)) : 2;
      hay.visible = st === 'READY' || st === 'RING_LIT';
      ash.visible = false; puff.mesh.visible = false;
    }
    mix = st === 'BURNING' || st === 'CHARRED' ? ritualMix(t) : ritualMix(null);
    // a candle lit / going out: one soft sound each (strike in the sweep, a puff as it dies)
    const shown = flames.visible ? candlesShown(rev, n) : 0;
    if (shownLast >= 0 && shown !== shownLast) events.push(shown > shownLast ? 'strike' : 'puff');
    shownLast = shown;
  };
  w.onSync(() => {
    if (!seen) { seen = true; normaliseWicker(s()); } // §3.1, once per world (a loaded state); written with the next save
    if (figureLit(s()) && ignAt === null) { ignAt = -Infinity; sess.burning = false; } // loaded burned: the settled aftermath
    if (!figureLit(s())) { ignAt = null; sess.burning = false; }
    if (!frameEmpty(s()) && sess.carrying) dropHay(false);
    if (!candlesLit(s())) litAt = -Infinity;
    else if (litAt === -Infinity) litAt = -1e6; // lit without the sweep (a loaded save): all at once
    apply();
  });
  w.onUpdate((_dt, t) => {
    now = t;
    if (sess.burning && ignAt !== null && now - ignAt >= WICKER_BURN.settled) {
      settleBurn(s(), sess); // the ring is out, the remnant stays: saved
      events.push('settle');
      g.changed();
    }
    if (sess.carrying) { const p = g.playerXZ(); if (Math.hypot(p.x - x, p.z - z) > CARRY_RADIUS) dropHay(true); } // leaving the clearing: back on the bale
    if (candlesLit(s()) || figureLit(s()) || now - cleanAt < CLEAN_TIME + 0.2 || now - fillAt < REFILL_TIME + 0.2) apply();
  });

  // ---- interaction: the ring (nine hit boxes, one id), the figure, the bale. No toasts (DEV-04C-R): the action label
  // says what will happen and the scene shows that it did.
  const quiet = (r: Outcome) => g.act({ ...r, msg: '' }, { save: r.ok });
  const lightRing = (item: string) => {
    const p = g.playerXZ();
    let best = 0, bd = Infinity; // the sweep starts at the candle nearest the player and runs round the ring
    o.candles.forEach((cd, i) => { const d = Math.hypot(cd.x - p.x, cd.z - p.z); if (d < bd) { bd = d; best = i; } });
    const r = lightCandles(s(), item, sess);
    if (r.ok) { litAt = now; reveal.uStart.value = best / n; shownLast = 0; events.push('match'); }
    quiet({ ...r, sfx: r.ok ? 'none' : r.sfx });
  };
  const ignite = (item: string) => {
    const r = igniteFigure(s(), item, sess);
    if (r.ok) { ignAt = now; events.push('match', 'ignite'); }
    quiet({ ...r, sfx: r.ok ? 'none' : r.sfx });
  };
  const HAY_HELD = { name: 'Bundel hooi', icon: 'hay' };
  function dropHay(back: boolean) {
    if (!putHayBack(sess)) return;
    g.carry(null);
    if (back) events.push('rustle');
    apply();
  }
  const ring = new THREE.Group();
  ring.position.copy(v3(x, gy, z));
  regionOwned(w, ring, region);
  const hits = o.candles.map((cd) => hitbox(ring, 0.42, 0.42, 0.42, cd.x - x, cd.y - gy - 0.08, -(cd.z - z)));
  w.add({
    id: WICKER_IDS.candles, obj: ring, hit: hits, focus: v3(x, gy + 0.3, z), reach: 2.4,
    label: () => ringPrompt(s(), sess),
    run: () => {
      if (candlesLit(s())) { const r = blowCandles(s(), sess); quiet({ ...r, sfx: 'none' }); }
      else if (has(s(), 'matches')) lightRing('matches');
      else g.sfx('locked');
    },
    acceptsItems: true,
    itemLabel: (item) => (ringPrompt(s(), sess) === null || candlesLit(s()) ? null : item === 'matches' ? 'Kaarsen aansteken' : `Gebruik: ${ITEMS[item]?.name ?? item}`),
    useItem: lightRing,
  });
  const fig = new THREE.Group();
  fig.position.copy(v3(x, foot, z));
  regionOwned(w, fig, region);
  const fh = hitbox(fig, 1.1, 2.7, 0.75, 0, 1.4, 0);
  w.add({
    id: WICKER_IDS.figure, obj: fig, hit: [fh], focus: v3(x, foot + 1.4, z), reach: 3.4,
    label: () => figurePrompt(s(), sess),
    run: () => {
      switch (wickerStage(s(), sess)) {
        case 'RING_LIT': if (has(s(), 'matches')) ignite('matches'); else g.sfx('locked'); return;
        case 'CHARRED': { const r = cleanFigure(s(), sess); if (r.ok) { cleanAt = now; events.push('brush'); } quiet(r); return; }
        case 'CARRYING_HAY': { const r = refillFigure(s(), sess); if (r.ok) { g.carry(null); fillAt = now; events.push('refill'); } quiet(r); return; }
        default: g.sfx('locked');
      }
    },
    acceptsItems: true,
    // the gate reads in the prompt itself: before the ring burns the matches offer nothing but "eerst de kaarsen"
    itemLabel: (item) => {
      const st = wickerStage(s(), sess);
      if (st !== 'READY' && st !== 'RING_LIT') return null;
      return item === 'matches' ? (st === 'RING_LIT' ? 'Stroman aansteken' : 'Stroman — eerst de kaarsen') : `Gebruik: ${ITEMS[item]?.name ?? item}`;
    },
    useItem: ignite,
  });
  // W01: the bale. Usable only while the frame is empty; one bundle, one trip; a session-only held bundle
  const bale = new THREE.Group();
  bale.position.copy(v3(o.bale.x, o.bale.y, o.bale.z));
  bale.rotation.y = -o.bale.yaw;
  regionOwned(w, bale, region);
  const bh = hitbox(bale, 1.05, 0.62, 0.62, 0, 0.32, 0);
  w.add({
    id: WICKER_IDS.bale, obj: bale, hit: [bh], focus: v3(o.bale.x, o.bale.y + 0.35, o.bale.z), reach: 2.2,
    label: () => balePrompt(s(), sess),
    run: () => {
      if (sess.carrying) { dropHay(true); return; }
      const r = takeHay(s(), sess);
      if (!r.ok) { g.sfx('locked'); return; }
      g.carry({ ...HAY_HELD, release: () => { if (putHayBack(sess)) { events.push('rustle'); apply(); } } });
      events.push('rustle');
      apply();
    },
  });
  w.scene.userData.wickerSet = {
    look: () => look, stage: () => wickerStage(s(), sess), session: () => ({ ...sess }), mix: () => mix, glow: () => glowK,
    litCount: () => (candlesLit(s()) && flames.visible ? candlesShown(reveal.uReveal.value, n) : 0),
    ids: WICKER_IDS, figure, hay, flames, fLow, fHigh, embers, smoke: smoke.mesh, smokeU: smoke, puff: puff.mesh, smoulder, ash, jars, reveal, burnUniforms: U, flameUniforms: FU,
    /** evidence / tests only: forget the session (a fresh world would), keeping the saved state */
    reset: () => { dropHay(false); ignAt = null; cleanAt = fillAt = -Infinity; sess.burning = false; },
  };
}

function mergeAll(parts: THREE.BufferGeometry[], names: string[]) {
  const all = parts.map((p) => (p.index ? p.toNonIndexed() : p));
  let count = 0; for (const p of all) count += p.attributes.position.count;
  const out = new THREE.BufferGeometry();
  for (const name of names) {
    const size = all[0].attributes[name].itemSize, arr = new Float32Array(count * size);
    let off = 0; for (const p of all) { arr.set(p.attributes[name].array as Float32Array, off); off += p.attributes[name].count * size; }
    out.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  out.computeBoundingSphere();
  return out;
}

/** Soft additive floor glows (one mesh): `k` 0 = candle patches (uCandle), 1 = the fire patch (uFire). */
function glowPatches(w: World, x: number, gy: number, z: number, items: { x: number; y: number; z: number; r: number; k: number; order: number }[], reveal: FireReveal) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const c2 = cv.getContext('2d')!, img = c2.createImageData(64, 64);
  for (let j = 0; j < 64; j++) for (let i = 0; i < 64; i++) {
    const d = Math.hypot((i + 0.5) / 32 - 1, (j + 0.5) / 32 - 1), a = d >= 1 ? 0 : Math.exp(-3.2 * d * d) * (1 - d * d), q = (j * 64 + i) * 4;
    img.data[q] = img.data[q + 1] = img.data[q + 2] = Math.round(a * 255); img.data[q + 3] = 255;
  }
  c2.putImageData(img, 0, 0);
  const parts = items.map((p) => {
    const g = new THREE.PlaneGeometry(p.r * 2, p.r * 2).rotateX(-Math.PI / 2).translate(p.x - x, p.y - gy, -(p.z - z));
    g.setAttribute('aKind', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(p.k), 1));
    g.setAttribute('aOrder', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(p.order), 1));
    return g.index ? g.toNonIndexed() : g;
  });
  const geo = mergeAll(parts, ['position', 'uv', 'aKind', 'aOrder']);
  const uCandle = { value: 0 }, uFire = { value: 0 };
  const mat = w.material(new THREE.MeshBasicMaterial({ map: w.texture(new THREE.CanvasTexture(cv)), color: '#ffffff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uCandle, uFire, uReveal: reveal.uReveal, uStart: reveal.uStart });
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aKind; attribute float aOrder; uniform float uReveal; uniform float uStart; varying float vKind; varying float vLit;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvKind = aKind; vLit = fract(aOrder - uStart + 1.0) > uReveal ? 0.0 : 1.0;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vKind; varying float vLit; uniform float uCandle; uniform float uFire;')
      .replace('#include <opaque_fragment>', 'outgoingLight *= mix(vec3(1.0, 0.68, 0.33) * uCandle * vLit, vec3(1.0, 0.54, 0.23) * uFire, vKind);\n#include <opaque_fragment>');
  };
  mat.customProgramCacheKey = () => 'wicker-glow';
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(v3(x, gy, z));
  mesh.renderOrder = 1;
  return { mesh, uCandle, uFire };
}
