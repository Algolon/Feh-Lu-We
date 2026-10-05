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

function makeMaterial(transparent: boolean) {
  const m = new THREE.MeshBasicMaterial({ vertexColors: true, transparent, opacity: transparent ? 0.78 : 1, depthWrite: !transparent, side: THREE.DoubleSide, fog: true });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = FIRE_UNIFORMS.uTime;
    sh.uniforms.uMotion = FIRE_UNIFORMS.uMotion;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aFlame; uniform float uTime; uniform float uMotion;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float h = aFlame.y;              // 0 at the base of a tongue, 1 at the tip
        float ph = aFlame.x;
        float amp = aFlame.z * uMotion;
        float s1 = sin(uTime * 9.0 + ph * 6.2831 + h * 3.0);
        float s2 = sin(uTime * 13.7 + ph * 11.0);
        transformed.x += (s1 * 0.6 + s2 * 0.4) * amp * h * h;
        transformed.z += cos(uTime * 7.3 + ph * 4.0 + h * 2.0) * amp * 0.7 * h * h;
        transformed.y += (0.5 + 0.5 * s2) * amp * 0.8 * h;`);
  };
  m.customProgramCacheKey = () => `flame-${transparent}`;
  return m;
}
let MATS: { outer: THREE.MeshBasicMaterial; core: THREE.MeshBasicMaterial } | null = null;
function mats() {
  if (!MATS) MATS = { outer: makeMaterial(true), core: makeMaterial(false) };
  return MATS;
}

interface Tongue { x: number; y: number; z: number; h: number; r: number; lean?: number }

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

export type FireKind = 'hearth' | 'campfire' | 'candle' | 'candles';
export interface FireOpts {
  kind: FireKind;
  x: number; y: number; z: number; // plan position of the fire base
  s?: number;
  /** candle cluster: offsets (plan dx, dy, dz) of each wick tip relative to x/y/z */
  wicks?: [number, number, number][];
  seed?: number;
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
  } else {
    const wicks = o.kind === 'candles' ? o.wicks ?? [[0, 0, 0]] : [[0, 0, 0] as [number, number, number]];
    tongues = wicks.map(([dx, dy, dz]) => ({ x: dx, y: dy, z: dz, h: 0.075 * s, r: 0.022 * s }));
    amp = 0.12;
  }
  const grp = new THREE.Group();
  const m = mats();
  const outer = new THREE.Mesh(buildTongues(tongues, 'outer', seed, amp, embers), m.outer);
  const core = new THREE.Mesh(buildTongues(tongues, 'core', seed, amp), m.core);
  outer.renderOrder = 4;
  for (const me of [outer, core]) { me.castShadow = false; me.receiveShadow = false; grp.add(me); }
  grp.position.copy(v3(o.x, o.y, o.z));
  grp.userData.fire = true;
  w.scene.add(grp);
  return grp;
}

/** Advance the shared flame clock (called once per frame by the game). */
export function tickFires(t: number, reducedMotion: boolean) {
  FIRE_UNIFORMS.uTime.value = t;
  FIRE_UNIFORMS.uMotion.value = reducedMotion ? 0 : 1;
}
