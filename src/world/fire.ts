// Shared combustion visual for fireplaces, campfires and candles.
// - Flames are unlit (MeshBasic) so they stay visible whatever the dynamic light budget does.
// - All tongues of one fire are merged into two meshes (translucent outer + opaque bright core); the
//   flutter runs in the vertex shader from a per-vertex phase, so one fire costs two draw calls and
//   no per-frame CPU work. Reduced motion sets one shared uniform to 0: a steady, clearly lit flame.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { v3 } from './kit';
import type { World } from '../interactions/world';

/** Shared uniforms: one clock for every flame in the scene. */
export const FIRE_UNIFORMS = { uTime: { value: 0 }, uMotion: { value: 1 } };

let tongueGeo: THREE.BufferGeometry | null = null;
/** Unit teardrop (height 1, max radius ≈0.5 near the bottom third), with a height attribute. */
function unitTongue() {
  if (tongueGeo) return tongueGeo;
  const pts: THREE.Vector2[] = [];
  const N = 9;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    // rounded bottom, widest at ~30%, tapering to a point
    const r = 0.5 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.25 + 0.02)), 0.7) * Math.pow(1 - t, 0.55);
    pts.push(new THREE.Vector2(Math.max(0.001, r), t));
  }
  tongueGeo = new THREE.LatheGeometry(pts, 7);
  tongueGeo.userData.shared = true;
  return tongueGeo;
}

/** Per-fire reveal (DEV-04C): tongues whose order (0..1, `aOrder`) lies within `uReveal` of `uStart` (wrapping) are shown. */
export interface FireReveal { uReveal: { value: number }; uStart: { value: number } }
function makeMaterial(transparent: boolean, reveal?: FireReveal) {
  const m = new THREE.MeshBasicMaterial({ vertexColors: true, transparent, opacity: transparent ? 0.78 : 1, depthWrite: !transparent, side: THREE.DoubleSide, fog: true });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = FIRE_UNIFORMS.uTime;
    sh.uniforms.uMotion = FIRE_UNIFORMS.uMotion;
    if (reveal) { sh.uniforms.uReveal = reveal.uReveal; sh.uniforms.uStart = reveal.uStart; }
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nattribute vec3 aFlame; uniform float uTime; uniform float uMotion;${reveal ? '\nattribute float aOrder; uniform float uReveal; uniform float uStart;' : ''}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>${reveal ? '\n        if (fract(aOrder - uStart + 1.0) > uReveal) transformed = vec3(0.0, -500.0, 0.0); // not yet lit: degenerate, off-screen' : ''}
        float h = aFlame.y;              // 0 at the base of a tongue, 1 at the tip
        float ph = aFlame.x;
        float amp = aFlame.z * uMotion;
        float s1 = sin(uTime * 9.0 + ph * 6.2831 + h * 3.0);
        float s2 = sin(uTime * 13.7 + ph * 11.0);
        transformed.x += (s1 * 0.6 + s2 * 0.4) * amp * h * h;
        transformed.z += cos(uTime * 7.3 + ph * 4.0 + h * 2.0) * amp * 0.7 * h * h;
        transformed.y += (0.5 + 0.5 * s2) * amp * 0.8 * h;`);
  };
  m.customProgramCacheKey = () => `flame-${transparent}${reveal ? '-reveal' : ''}`;
  return m;
}
let MATS: { outer: THREE.MeshBasicMaterial; core: THREE.MeshBasicMaterial } | null = null;
function mats() {
  if (!MATS) MATS = { outer: makeMaterial(true), core: makeMaterial(false) };
  return MATS;
}

export interface Tongue { x: number; y: number; z: number; h: number; r: number; lean?: number; /** reveal order 0..1 */ order?: number }

function buildTongues(tongues: Tongue[], kind: 'outer' | 'core', seed: number, amp: number, embers?: { r: number; y: number }) {
  const parts: THREE.BufferGeometry[] = [];
  const base = unitTongue();
  const cBase = new THREE.Color(kind === 'outer' ? '#d8380f' : '#ffc23e');
  const cTip = new THREE.Color(kind === 'outer' ? '#ff9a26' : '#fffbe0');
  tongues.forEach((tg, i) => {
    const g = base.clone();
    const scale = kind === 'core' ? 0.6 : 1;
    g.scale(tg.r * 2 * scale, tg.h * (kind === 'core' ? 0.68 : 1), tg.r * 2 * scale);
    if (tg.lean) g.rotateZ(tg.lean);
    g.translate(tg.x, tg.y + (kind === 'core' ? tg.h * 0.02 : 0), -tg.z);
    const n = g.attributes.position.count;
    const fl = new Float32Array(n * 3), col = new Float32Array(n * 3);
    const ph = ((seed * 7.13 + i * 0.618) % 1 + 1) % 1;
    const pos = base.attributes.position;
    for (let v = 0; v < n; v++) {
      const h = pos.getY(v); // unit tongue height 0..1
      fl[v * 3] = ph; fl[v * 3 + 1] = h; fl[v * 3 + 2] = amp * tg.h;
      const c = cBase.clone().lerp(cTip, Math.min(1, h * 1.3));
      col[v * 3] = c.r; col[v * 3 + 1] = c.g; col[v * 3 + 2] = c.b;
    }
    g.setAttribute('aFlame', new THREE.BufferAttribute(fl, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aOrder', new THREE.BufferAttribute(new Float32Array(n).fill(tg.order ?? 0), 1));
    g.deleteAttribute('uv');
    g.deleteAttribute('normal');
    parts.push(g);
  });
  if (embers && kind === 'outer') {
    // glowing ember bed: a flattened dome, static (zero amplitude), deep orange-red
    const e = new THREE.SphereGeometry(1, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2);
    e.scale(embers.r, embers.r * 0.18, embers.r);
    e.translate(0, embers.y, 0);
    const n = e.attributes.position.count;
    const fl = new Float32Array(n * 3), col = new Float32Array(n * 3);
    const c1 = new THREE.Color('#7a1d0a'), c2 = new THREE.Color('#ff7a1e');
    for (let v = 0; v < n; v++) {
      const h = (e.attributes.position.getY(v) - embers.y) / (embers.r * 0.18);
      const c = c1.clone().lerp(c2, Math.min(1, h * 1.4 + ((v * 37) % 7) / 20));
      col[v * 3] = c.r; col[v * 3 + 1] = c.g; col[v * 3 + 2] = c.b;
    }
    e.setAttribute('aFlame', new THREE.BufferAttribute(fl, 3));
    e.setAttribute('color', new THREE.BufferAttribute(col, 3));
    e.setAttribute('aOrder', new THREE.BufferAttribute(new Float32Array(n), 1));
    e.deleteAttribute('uv'); e.deleteAttribute('normal');
    const ne = e.toNonIndexed();
    e.dispose();
    parts.push(ne);
  }
  const nonIdx = parts.map((p) => (p.index ? p.toNonIndexed() : p));
  const merged = mergeGeometries(nonIdx, false)!;
  parts.forEach((p) => p.dispose());
  nonIdx.forEach((p) => p.dispose());
  merged.computeBoundingSphere();
  return merged;
}

export type FireKind = 'hearth' | 'campfire' | 'candle' | 'candles' | 'custom';
export interface FireOpts {
  kind: FireKind;
  x: number; y: number; z: number; // plan position of the fire base
  s?: number;
  /** candle cluster: offsets (plan dx, dy, dz) of each wick tip relative to x/y/z */
  wicks?: [number, number, number][];
  seed?: number;
  /** kind 'custom' (DEV-04C, e.g. the burning Wickerman): the tongues themselves, plan offsets from x/y/z */
  tongues?: Tongue[];
  /** flutter amplitude (per metre of tongue height) for 'custom' */
  amp?: number;
  /** DEV-04C: a dedicated material pair with reveal uniforms (candles lit one after another); returned in userData.reveal */
  reveal?: boolean;
  /**
   * DEV-04C visibility owner. A flame must be drawn exactly when the thing it burns on is: `parent` hangs it in its
   * fixture (a chandelier: culled together), `region` gives it to the host's room-region batch (a hearth, table candles,
   * a fire pit: drawn while that batch is). Without an owner the flame is culled on its own (size-based distance), which
   * let flames vanish 10–20 m before their fixture or room did.
   */
  owner?: { parent: THREE.Object3D } | { region: string };
}

/**
 * Give a state-toggled object (flames, a laid fire) to a room region: it is wrapped in a holder that the region shows
 * and hides with its batch, while the object's own `.visible` stays free for game state. The holder is never culled on
 * its own (`noCull`). Must be called before `World.roomRegion` collects the region (i.e. during the build).
 */
export function regionOwned<T extends THREE.Object3D>(w: World, obj: T, region: string): T {
  const holder = new THREE.Group();
  holder.userData.region = region;
  holder.userData.noCull = true;
  if (obj.parent) obj.parent.remove(obj);
  holder.add(obj);
  w.scene.add(holder);
  return obj;
}

/** Build a fire. Returns its root group; toggle `.visible` from game state (logical state lives elsewhere). */
export function makeFire(w: World, o: FireOpts): THREE.Group {
  const s = o.s ?? 1;
  const seed = o.seed ?? Math.abs(Math.round(o.x * 13 + o.z * 7));
  let tongues: Tongue[] = [];
  let embers: { r: number; y: number } | undefined;
  let amp = 0.06;
  if (o.kind === 'hearth' || o.kind === 'campfire') {
    const n = o.kind === 'hearth' ? 6 : 8;
    const spread = o.kind === 'hearth' ? 0.32 : 0.42;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (i % 2) * 0.4;
      const d = i === 0 ? 0 : spread * (0.45 + ((i * 53) % 10) / 22);
      const h = (i === 0 ? 0.75 : 0.42 + ((i * 31) % 10) / 30) * (o.kind === 'campfire' ? 1.25 : 1);
      tongues.push({ x: Math.cos(a) * d * s, y: 0.06 * s, z: Math.sin(a) * d * s * (o.kind === 'hearth' ? 0.6 : 1), h: h * s, r: (i === 0 ? 0.17 : 0.11 + ((i * 17) % 5) / 100) * s, lean: Math.cos(a) * d * -0.35 });
    }
    embers = { r: spread * 1.15 * s, y: 0.02 * s };
    amp = 0.07;
  } else if (o.kind === 'custom') {
    tongues = (o.tongues ?? []).map((t) => ({ ...t, x: t.x * s, y: t.y * s, z: t.z * s, h: t.h * s, r: t.r * s }));
    amp = o.amp ?? 0.07;
  } else {
    const wicks = o.kind === 'candles' ? o.wicks ?? [[0, 0, 0]] : [[0, 0, 0] as [number, number, number]];
    tongues = wicks.map(([dx, dy, dz], i) => ({ x: dx, y: dy, z: dz, h: 0.075 * s, r: 0.022 * s, order: (i + 0.5) / wicks.length }));
    amp = 0.12;
  }
  const grp = new THREE.Group();
  const reveal: FireReveal | undefined = o.reveal ? { uReveal: { value: 1 }, uStart: { value: 0 } } : undefined;
  const m = reveal ? { outer: makeMaterial(true, reveal), core: makeMaterial(false, reveal) } : mats();
  if (reveal) { grp.userData.reveal = reveal; grp.userData.ownMaterials = [m.outer, m.core]; w.material(m.outer); w.material(m.core); }
  const outer = new THREE.Mesh(buildTongues(tongues, 'outer', seed, amp, embers), m.outer);
  const core = new THREE.Mesh(buildTongues(tongues, 'core', seed, amp), m.core);
  outer.renderOrder = 4;
  for (const me of [outer, core]) { me.castShadow = false; me.receiveShadow = false; grp.add(me); }
  grp.position.copy(v3(o.x, o.y, o.z));
  grp.userData.fire = true;
  if (o.owner && 'parent' in o.owner) {
    const p = o.owner.parent;
    p.updateWorldMatrix(true, false);
    p.worldToLocal(grp.position);
    grp.quaternion.copy(p.getWorldQuaternion(new THREE.Quaternion()).invert());
    p.add(grp);
  } else if (o.owner && 'region' in o.owner) regionOwned(w, grp, o.owner.region);
  else w.scene.add(grp);
  return grp;
}

/** Advance the shared flame clock (called once per frame by the game). */
export function tickFires(t: number, reducedMotion: boolean) {
  FIRE_UNIFORMS.uTime.value = t;
  FIRE_UNIFORMS.uMotion.value = reducedMotion ? 0 : 1;
}

/**
 * DEV-04C rising embers: `n` tiny glowing flecks looping up through a column (radius r, height h) above a fire, drifting
 * and fading near the top. One merged mesh, one draw call, animated entirely in the vertex shader on the shared flame
 * clock (frozen in reduced motion, still visible). Returns the mesh; toggle `.visible` from game state.
 */
export function makeEmbers(w: World, o: { x: number; y: number; z: number; r: number; h: number; n?: number; seed?: number; owner?: FireOpts['owner'] }) {
  const n = o.n ?? 36, parts: THREE.BufferGeometry[] = [];
  let r = (o.seed ?? 7) * 0.001 + 0.31;
  const rnd = () => (r = (r * 9301 + 0.49297) % 1);
  for (let i = 0; i < n; i++) {
    const g = new THREE.TetrahedronGeometry(0.018 + rnd() * 0.014, 0).toNonIndexed();
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * o.r;
    const ph = rnd(), sp = 0.55 + rnd() * 0.7;
    const cnt = g.attributes.position.count, at = new Float32Array(cnt * 4), col = new Float32Array(cnt * 3);
    const c = new THREE.Color().setHSL(0.06 + rnd() * 0.05, 1, 0.55 + rnd() * 0.15);
    for (let v = 0; v < cnt; v++) { at.set([Math.cos(a) * d, -Math.sin(a) * d, ph, sp], v * 4); col.set([c.r, c.g, c.b], v * 3); }
    g.setAttribute('aEmber', new THREE.BufferAttribute(at, 4));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.deleteAttribute('uv'); g.deleteAttribute('normal');
    parts.push(g);
  }
  const geo = mergeGeometries(parts, false)!;
  parts.forEach((p) => p.dispose());
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, o.h / 2, 0), Math.max(o.r, o.h));
  const mat = w.material(new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: true }));
  const H = o.h.toFixed(3);
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = FIRE_UNIFORMS.uTime;
    sh.uniforms.uMotion = FIRE_UNIFORMS.uMotion;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 aEmber; uniform float uTime; uniform float uMotion; varying float vFade;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float tt = uTime * uMotion + aEmber.z * 9.0;
        float k = fract(aEmber.z + tt * aEmber.w * 0.16);           // 0 at the base → 1 at the top of the column
        float y = k * ${H};
        transformed *= 1.0 - 0.7 * k;
        transformed += vec3(aEmber.x * (1.0 - 0.4 * k) + sin(tt * 1.7 + aEmber.z * 20.0) * 0.18 * k, y, aEmber.y * (1.0 - 0.4 * k) + cos(tt * 1.3 + aEmber.z * 13.0) * 0.18 * k);
        vFade = (1.0 - k) * smoothstep(0.0, 0.08, k);`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vFade;')
      .replace('#include <opaque_fragment>', 'outgoingLight *= 1.6; diffuseColor.a = vFade;\n#include <opaque_fragment>');
  };
  mat.customProgramCacheKey = () => 'embers';
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(v3(o.x, o.y, o.z));
  mesh.renderOrder = 5;
  mesh.userData.fire = true;
  if (o.owner && 'region' in o.owner) regionOwned(w, mesh, o.owner.region);
  else if (o.owner && 'parent' in o.owner) o.owner.parent.add(mesh);
  else w.scene.add(mesh);
  return mesh;
}

/**
 * DEV-04C smoke: a slow column of low-poly puffs (the same faceted language as the foliage) rising, swelling and
 * thinning out. One mesh, one draw call, vertex-shader motion on the shared clock (frozen in reduced motion).
 */
export function makeSmoke(w: World, o: { x: number; y: number; z: number; h: number; n?: number; owner?: FireOpts['owner'] }) {
  const n = o.n ?? 12, parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const g = new THREE.IcosahedronGeometry(0.3, 0).toNonIndexed();
    const cnt = g.attributes.position.count, at = new Float32Array(cnt * 2);
    for (let v = 0; v < cnt; v++) at.set([(i + 0.5) / n, ((i * 37) % 11) / 11], v * 2);
    g.setAttribute('aPuff', new THREE.BufferAttribute(at, 2));
    parts.push(g);
  }
  const geo = mergeGeometries(parts, false)!;
  parts.forEach((p) => p.dispose());
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, o.h / 2, 0), o.h);
  const mat = w.material(new THREE.MeshLambertMaterial({ color: '#8c8780', transparent: true, opacity: 0.32, depthWrite: false }));
  const H = o.h.toFixed(3);
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = FIRE_UNIFORMS.uTime;
    sh.uniforms.uMotion = FIRE_UNIFORMS.uMotion;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 aPuff; uniform float uTime; uniform float uMotion; varying float vPuff;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float k = fract(aPuff.x + uTime * uMotion * 0.045);
        transformed *= 0.6 + 2.4 * k;
        transformed += vec3(sin(aPuff.y * 6.28 + k * 3.0) * 0.9 * k + k * 1.4 + (aPuff.y - 0.5) * 0.5, k * ${H}, cos(aPuff.y * 6.28 + k * 2.0) * 0.8 * k);
        vPuff = smoothstep(0.0, 0.12, k) * (1.0 - smoothstep(0.55, 1.0, k));`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vPuff;')
      .replace('#include <opaque_fragment>', 'diffuseColor.a *= vPuff;\n#include <opaque_fragment>');
  };
  mat.customProgramCacheKey = () => 'smoke';
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(v3(o.x, o.y, o.z));
  mesh.renderOrder = 6;
  if (o.owner && 'region' in o.owner) regionOwned(w, mesh, o.owner.region);
  else w.scene.add(mesh);
  return mesh;
}
