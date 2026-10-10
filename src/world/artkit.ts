// Art-refresh kit (step 2, interior sample): shaped geometry, a small material set, baked shading and contact
// grounding. Everything here is additive: existing builders keep using kit.ts unchanged, so assets elsewhere
// in the estate look exactly as before until a sample is approved.
//
// Conventions
// - Geometry is authored in three.js LOCAL space with the piece facing -z (forward): x = right, y = up.
//   `Asm` places parts at local PLAN offsets (lx right, ly up, lz forward) relative to a furniture origin.
// - Shading split: rounded/turned parts get smooth normals; flat faces stay flat because they are planar.
// - Baked shading lives in vertex colours (flag `keepColor`, see Batcher.add). It only encodes OCCLUSION
//   (contact, seams, soot), never light direction, so it stays correct when lamps or the fire toggle.
import * as THREE from 'three';
import { surface } from './surfaces';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { planMatrix, type Batcher } from './kit';
import { mulberry32 } from '../core/rng';

// ------------------------------------------------------------------------------------------------ geometry
/**
 * Rounded box, smooth-shaded (flat faces stay flat, edges roll). Centred at the origin. `seg` steps per rounded
 * edge, `mid` steps across each flat face (mid > 1 gives interior vertices, needed when the box is deformed,
 * e.g. a crowned cushion). A box grid is remapped so the edge zone gets `seg` steps, then each vertex is pulled
 * onto the rounded surface (inner box + radius).
 */
export function softBox(sx: number, sy: number, sz: number, r: number, seg = 2, mid = 1): THREE.BufferGeometry {
  r = Math.min(r, sx / 2 - 1e-4, sy / 2 - 1e-4, sz / 2 - 1e-4);
  const N = 2 * seg + mid;
  const g0 = new THREE.BoxGeometry(1, 1, 1, N, N, N);
  g0.deleteAttribute('normal');
  g0.deleteAttribute('uv');
  const p = g0.attributes.position as THREE.BufferAttribute;
  const remap = (u: number, h: number) => {
    const i = Math.round((u + 0.5) * N);
    if (i <= seg) return -h + (r * i) / seg;
    if (i >= N - seg) return h - (r * (N - i)) / seg;
    return -h + r + ((2 * h - 2 * r) * (i - seg)) / mid;
  };
  const v = new THREE.Vector3(), c = new THREE.Vector3(), hx = sx / 2, hy = sy / 2, hz = sz / 2;
  for (let i = 0; i < p.count; i++) {
    v.set(remap(p.getX(i), hx), remap(p.getY(i), hy), remap(p.getZ(i), hz));
    c.set(THREE.MathUtils.clamp(v.x, -hx + r, hx - r), THREE.MathUtils.clamp(v.y, -hy + r, hy - r), THREE.MathUtils.clamp(v.z, -hz + r, hz - r));
    const d = v.clone().sub(c);
    if (d.lengthSq() > 1e-12) v.copy(c).add(d.setLength(r));
    p.setXYZ(i, v.x, v.y, v.z);
  }
  const g = mergeVertices(g0, 1e-6);
  g0.dispose();
  g.computeVertexNormals();
  return g;
}

/** Push vertices with a function of their (local) position, then recompute smooth normals. */
export function deform(g: THREE.BufferGeometry, fn: (p: THREE.Vector3) => void): THREE.BufferGeometry {
  const p = g.attributes.position as THREE.BufferAttribute, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); fn(v); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals();
  return g;
}

/** Cushion: a soft box whose top (or front, -z) face crowns by `crown` metres in the middle. */
export function cushion(sx: number, sy: number, sz: number, r: number, crown: number, face: 'top' | 'front' = 'top', seg = 2, mid = 4) {
  const g = softBox(sx, sy, sz, r, seg, mid);
  const hx = sx / 2, hy = sy / 2, hz = sz / 2;
  return deform(g, (p) => {
    if (face === 'top' && p.y > 0) p.y += crown * (1 - (p.x / hx) ** 2) * (1 - (p.z / hz) ** 2) * (p.y / hy);
    if (face === 'front' && p.z < 0) p.z -= crown * (1 - (p.x / hx) ** 2) * (1 - (p.y / hy) ** 2) * (-p.z / hz);
  });
}

/** Lathe around +y from [radius, height] pairs (local metres). */
export function lathe(profile: [number, number][], seg = 16): THREE.BufferGeometry {
  return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(Math.max(0, r), y)), seg);
}

/**
 * Straight moulding: a 2D profile in the (depth d, height h) plane extruded along local x for `len` metres,
 * centred on x = 0. d points FORWARD (away from the wall: local -z), h up.
 */
export function moulding(profile: [number, number][], len: number, curveSeg = 1): THREE.BufferGeometry {
  const s = new THREE.Shape(profile.map(([d, h]) => new THREE.Vector2(d, h)));
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false, curveSegments: curveSeg });
  // shape x = d (forward) → plan z ; shape y = h ; extrusion along shape z → plan x
  g.rotateY(Math.PI / 2); // shape +x → three -z (= plan +z forward), extrusion +z → three +x
  g.translate(-len / 2, 0, 0);
  return g;
}

/** Arc of a profile: (d, h) points sampled from a quarter round / ogee helper. */
export function arcPts(cx: number, cy: number, r: number, a0: number, a1: number, n = 4): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return out;
}

/** Planar UV projection by dominant normal, in metres / scale. `grain` = the local axis wood grain runs along. */
export function projectUV(g: THREE.BufferGeometry, scale = 1, grain: 'x' | 'y' | 'z' = 'x'): THREE.BufferGeometry {
  const p = g.attributes.position, n = g.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    const x = p.getX(i) / scale, y = p.getY(i) / scale, z = p.getZ(i) / scale;
    // the two in-plane axes; the grain axis goes to U when it lies in the plane
    let u: number, v: number;
    if (ax >= ay && ax >= az) { [u, v] = grain === 'y' ? [y, z] : [z, y]; }
    else if (ay >= az) { [u, v] = grain === 'z' ? [z, x] : [x, z]; }
    else { [u, v] = grain === 'y' ? [y, x] : [x, y]; }
    uv[i * 2] = u; uv[i * 2 + 1] = v;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

/** Bake an occlusion colour into vertices: `f(localPos)` returns a brightness factor (1 = untouched). */
export function bake(g: THREE.BufferGeometry, f: (p: THREE.Vector3) => number): THREE.BufferGeometry {
  const p = g.attributes.position, v = new THREE.Vector3();
  const c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p as THREE.BufferAttribute, i); const k = f(v); c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = k; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  g.userData.keepColor = true;
  return g;
}
/** Base occlusion: darker toward the bottom of a part (contact), lighter above `h`. */
export const baseAO = (y0: number, h: number, lo = 0.62) => (p: THREE.Vector3) => lo + (1 - lo) * THREE.MathUtils.smoothstep(p.y, y0, y0 + h);

const tmpM = new THREE.Matrix4();
const tmpL = new THREE.Matrix4();
const tmpE = new THREE.Euler();
/**
 * Assembler: places local-plan parts relative to an origin (plan x, y0, plan z, heading yaw).
 * Parts are merged by the Batcher into the area's existing per-material meshes (no extra draw calls per part).
 */
export class Asm {
  private base: THREE.Matrix4;
  private rec: { name: string; y0: number; boxes: THREE.Box3[]; tris: number } | null = null;
  constructor(public b: Batcher, public chunk: string, x: number, y0: number, z: number, yaw: number) {
    this.base = planMatrix(x, y0, z, yaw).clone();
  }
  /** Add geometry `g` at local (lx, ly, lz) with optional local rotations (radians, plan frame) and scale. */
  add(mat: THREE.Material, color: THREE.ColorRepresentation, g: THREE.BufferGeometry, lx: number, ly: number, lz: number, o: { rx?: number; ry?: number; rz?: number; s?: [number, number, number]; shadow?: boolean } = {}) {
    tmpE.set(o.rx ?? 0, -(o.ry ?? 0), o.rz ?? 0, 'YXZ');
    tmpL.makeRotationFromEuler(tmpE);
    if (o.s) tmpL.scale(new THREE.Vector3(...o.s));
    tmpL.setPosition(lx, ly, -lz);
    tmpM.multiplyMatrices(this.base, tmpL);
    if (this.rec) {
      if (!g.boundingBox) g.computeBoundingBox();
      this.rec.boxes.push(g.boundingBox!.clone().applyMatrix4(tmpM));
      this.rec.tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
    }
    this.b.add(mat, g, tmpM, color, this.chunk, o.shadow ?? true, 0);
  }
  /**
   * DEV-04B construction audit: from here until `end()`, every part's world bounds are recorded. `end()` checks the
   * piece stands on its support (its lowest point within `tol` of the origin height: no floating feet, no legs sunk
   * into the floor) and that every part touches the rest of the piece (no disconnected child pieces). Failures go to
   * `assetWarnings` (the DEV-04B browser suite fails on any).
   */
  begin(name: string) { this.rec = { name, y0: this.base.elements[13], boxes: [], tris: 0 }; return this; }
  end(o: { ground?: boolean; tol?: number; gap?: number } = {}) {
    const r = this.rec;
    this.rec = null;
    if (!r || !r.boxes.length) return;
    assetAudits.push(r.name);
    assetTris[r.name] = (assetTris[r.name] ?? 0) + r.tris;
    const issues = auditParts(r.boxes, o.ground === false ? null : r.y0, o.tol ?? 0.012, o.gap ?? 0.006);
    for (const m of issues) assetWarnings.push(`${r.name}: ${m}`);
  }
}

/** DEV-04B: construction problems found by `Asm.begin/end` (ground contact, disconnected parts). */
export const assetWarnings: string[] = [];
/** Names of every audited piece (the browser suite checks the families are actually covered). */
export const assetAudits: string[] = [];
/** DEV-04B: triangles per audited asset name (summed over its instances), for the performance report. */
export const assetTris: Record<string, number> = {};
/**
 * Pure audit used by Asm.end (exported for tests): the lowest point must be within `tol` of `y0` (when given), and
 * the parts' bounds (grown by `gap`) must form one connected group. Returns a list of human-readable problems.
 */
export function auditParts(boxes: THREE.Box3[], y0: number | null, tol = 0.012, gap = 0.006): string[] {
  const out: string[] = [];
  const minY = Math.min(...boxes.map((b) => b.min.y));
  if (y0 != null && Math.abs(minY - y0) > tol) out.push(`${minY > y0 ? 'floats' : 'sinks'} ${(Math.abs(minY - y0) * 100).toFixed(1)} cm ${minY > y0 ? 'above' : 'into'} its support`);
  const grown = boxes.map((b) => b.clone().expandByScalar(gap));
  const seen = new Uint8Array(boxes.length), stack = [0];
  seen[0] = 1;
  while (stack.length) {
    const i = stack.pop()!;
    for (let j = 0; j < boxes.length; j++) if (!seen[j] && grown[i].intersectsBox(grown[j])) { seen[j] = 1; stack.push(j); }
  }
  const loose = [...seen].map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  if (loose.length) out.push(`${loose.length} part(s) not touching the rest (first at y ${boxes[loose[0]].min.y.toFixed(2)})`);
  return out;
}

// ------------------------------------------------------------------------------------------------ textures
function cv(w: number, h = w): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')!];
}
function tex(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
const grey = (v: number) => { const k = Math.round(Math.max(0, Math.min(1, v)) * 255); return `rgb(${k},${k},${k})`; };

/** Wood grain along U (1 texture repeat ≈ 1 m along the grain, 0.5 m across). Value-only, 0.8–1. */
function grainTex() {
  const [c, x] = cv(256, 128);
  const r = mulberry32(41);
  x.fillStyle = grey(0.93); x.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 70; i++) {
    const y = r() * 128, amp = 1 + r() * 3, ph = r() * 6, len = 0.012 + r() * 0.02;
    x.strokeStyle = grey(0.8 + r() * 0.12); x.globalAlpha = 0.35 + r() * 0.4; x.lineWidth = 0.6 + r() * 1.6;
    x.beginPath();
    for (let u = -4; u <= 260; u += 4) { const yy = y + Math.sin(u * len + ph) * amp; if (u === -4) x.moveTo(u, yy); else x.lineTo(u, yy); }
    x.stroke();
    // wrap vertically
    x.save(); x.translate(0, y > 64 ? -128 : 128); x.stroke(); x.restore();
  }
  x.globalAlpha = 1;
  return tex(c);
}
/** Fine fabric weave, value-only 0.88–1, 1 repeat ≈ 0.25 m. */
function weaveTex() {
  const [c, x] = cv(64);
  const r = mulberry32(42);
  for (let j = 0; j < 64; j++) for (let i = 0; i < 64; i++) {
    const w = ((i >> 1) + (j >> 1)) % 2 ? 0.965 : 0.93;
    x.fillStyle = grey(w + (r() - 0.5) * 0.04); x.fillRect(i, j, 1, 1);
  }
  return tex(c);
}
/** Dressed stone (ashlar) courses; 1 repeat ≈ 1.2 m. Value-only with a whisper of warmth per block. */
function ashlarTex() {
  const [c, x] = cv(256);
  const r = mulberry32(43);
  x.fillStyle = grey(0.78); x.fillRect(0, 0, 256, 256);
  const rows = [52, 44, 60, 48, 52]; // course heights (px) summing to 256
  let y = 0;
  rows.forEach((h, ri) => {
    let xx = -((ri * 37) % 60);
    while (xx < 256) {
      const w = 60 + r() * 70;
      const v = 0.9 + r() * 0.08;
      const warm = (r() - 0.5) * 10;
      for (const ox of [0, 256]) {
        x.fillStyle = `rgb(${Math.round(v * 255 + warm)},${Math.round(v * 252)},${Math.round(v * 244 - warm)})`;
        x.fillRect(xx + 2 - ox, y + 2, w - 4, h - 4);
        // soft dressed face: a lighter top edge, darker bottom edge
        x.fillStyle = 'rgba(255,255,255,0.10)'; x.fillRect(xx + 2 - ox, y + 2, w - 4, 3);
        x.fillStyle = 'rgba(0,0,0,0.07)'; x.fillRect(xx + 2 - ox, y + h - 5, w - 4, 3);
      }
      xx += w;
    }
    y += h;
  });
  return tex(c);
}
/** Calm rug: muted madder field, linen border, a small ink-blue medallion; low contrast so it supports the room. */
function rugTex() {
  const [c, x] = cv(256, 384);
  const W = 256, H = 384;
  x.fillStyle = '#6e3a30'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#b9a785'; x.fillRect(0, 0, W, 20); x.fillRect(0, H - 20, W, 20); x.fillRect(0, 0, 20, H); x.fillRect(W - 20, 0, 20, H);
  x.fillStyle = '#3f4a58'; x.fillRect(20, 20, W - 40, 5); x.fillRect(20, H - 25, W - 40, 5); x.fillRect(20, 20, 5, H - 40); x.fillRect(W - 25, 20, 5, H - 40);
  x.strokeStyle = 'rgba(192,138,62,0.6)'; x.lineWidth = 2; x.strokeRect(34, 34, W - 68, H - 68);
  // medallion
  x.save(); x.translate(W / 2, H / 2);
  x.fillStyle = '#3f4a58'; x.beginPath(); x.ellipse(0, 0, 46, 70, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#8a5a34'; x.beginPath(); x.ellipse(0, 0, 30, 46, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#6e3a30'; x.beginPath(); x.ellipse(0, 0, 18, 28, 0, 0, Math.PI * 2); x.fill();
  x.restore();
  // field motifs (sparse, low contrast)
  x.fillStyle = 'rgba(185,167,133,0.35)';
  for (let j = 0; j < 6; j++) for (let i = 0; i < 4; i++) {
    const px = 52 + i * 51, py = 56 + j * 55;
    if (Math.hypot((px - W / 2) / 64, (py - H / 2) / 90) < 1) continue;
    x.beginPath(); x.moveTo(px, py - 5); x.lineTo(px + 4, py); x.lineTo(px, py + 5); x.lineTo(px - 4, py); x.fill();
  }
  // pile variation
  const r = mulberry32(44);
  for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.05})`; x.fillRect(r() * W, r() * H, 2, 2); }
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

// ------------------------------------------------------------------------------------------------ materials
export interface ArtMats {
  upholstery: THREE.MeshLambertMaterial;
  timber: THREE.MeshLambertMaterial;
  stone: THREE.MeshLambertMaterial;
  paint: THREE.MeshLambertMaterial;
  brass: THREE.MeshPhongMaterial;
  ceramic: THREE.MeshPhongMaterial;
  rug: THREE.MeshLambertMaterial;
}
let mats: ArtMats | null = null;
/**
 * The sample material set. Lambert (diffuse only) for cloth, wood, stone, paint; Phong with a tinted, moderate
 * highlight only for the two small "lively" materials (brass, glazed ceramic). Colour comes from vertex/part
 * colour so one material serves many pieces (one draw call per material per area).
 */
export function artMats(): ArtMats {
  if (mats) return mats;
  const lam = (o: THREE.MeshLambertMaterialParameters) => new THREE.MeshLambertMaterial({ vertexColors: true, ...o });
  mats = {
    upholstery: lam({ map: weaveTex() }),
    timber: lam({ map: grainTex() }),
    stone: lam({ map: ashlarTex() }),
    paint: lam({}),
    brass: new THREE.MeshPhongMaterial({ vertexColors: true, color: '#ffffff', specular: '#d8b26a', shininess: 38 }),
    ceramic: new THREE.MeshPhongMaterial({ vertexColors: true, color: '#ffffff', specular: '#6a6a66', shininess: 70 }),
    rug: lam({ map: rugTex(), polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
  };
  // DEV-04C ART-01.1 authored surfaces (surfaces.ts)
  surface(mats.upholstery, 'fabric'); surface(mats.timber, 'timber'); surface(mats.stone, 'stone'); surface(mats.paint, 'paint');
  surface(mats.brass, 'metal'); surface(mats.ceramic, 'metal'); surface(mats.rug, 'fabric');
  return mats;
}

// ------------------------------------------------------------------------------------------------ contact shadows
let shadowTex: THREE.Texture | null = null;
/** Soft rounded-rectangle occlusion mask (alpha), computed per pixel — no canvas filters needed. */
function contactTex() {
  if (shadowTex) return shadowTex;
  const N = 64;
  const [c, x] = cv(N);
  const img = x.createImageData(N, N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const u = Math.abs((i + 0.5) / N - 0.5) * 2, v = Math.abs((j + 0.5) / N - 0.5) * 2; // 0 centre → 1 edge
    // distance outside an inner rounded rect (half-size 0.55, corner 0.25), normalised to the quad edge
    // dense out to 60 % of the quad (≈ the footprint edge when the quad is ~0.35 m larger), soft falloff beyond
    const qx = Math.max(u - 0.6, 0), qy = Math.max(v - 0.6, 0);
    const d = Math.hypot(qx, qy) / 0.4;
    const a = Math.pow(Math.max(0, 1 - d), 1.5);
    const k = (j * N + i) * 4;
    img.data[k] = img.data[k + 1] = img.data[k + 2] = 255;
    img.data[k + 3] = Math.round(a * 255);
  }
  x.putImageData(img, 0, 0);
  shadowTex = new THREE.CanvasTexture(c);
  return shadowTex;
}

/**
 * Contact shadows: one instanced, multiply-blended quad per grounded object (one draw call for a whole area).
 * Static occlusion only: they never depend on a lamp being on. Each quad lies just above the surface below it.
 */
export class ContactShadows {
  private items: { x: number; y: number; z: number; sx: number; sz: number; yaw: number; k: number; n?: THREE.Vector3 }[] = [];
  /**
   * Plan position, quad size (sx across, sz along heading `yaw`; ≈ footprint + 0.35 m), strength 0–1, and an
   * optional ground normal (three.js space) so the decal lies on sloping terrain instead of cutting into it.
   */
  add(x: number, y: number, z: number, sx: number, sz: number, yaw = 0, k = 0.55, n?: THREE.Vector3) {
    this.items.push({ x, y, z, sx, sz, yaw, k, n });
  }
  build(scene: THREE.Scene, region: string, tint: THREE.ColorRepresentation = '#3a2618') {
    if (!this.items.length) return null;
    const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: contactTex() }, tint: { value: new THREE.Color(tint) } },
      vertexShader: `varying vec2 vUv; varying float vK;
        void main(){ vUv = uv; vK = 1.0;
          #ifdef USE_INSTANCING_COLOR
            vK = instanceColor.r;
          #endif
          vec4 p = vec4(position, 1.0);
          #ifdef USE_INSTANCING
            p = instanceMatrix * p;
          #endif
          gl_Position = projectionMatrix * modelViewMatrix * p; }`,
      fragmentShader: `uniform sampler2D map; uniform vec3 tint; varying vec2 vUv; varying float vK;
        void main(){ float a = texture2D(map, vUv).a * vK; gl_FragColor = vec4(mix(vec3(1.0), tint, a), 1.0); }`,
      transparent: true, depthWrite: false, blending: THREE.MultiplyBlending, premultipliedAlpha: true, toneMapped: false,
      polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
    });
    const m = new THREE.InstancedMesh(geo, mat, this.items.length);
    const q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), mx = new THREE.Matrix4(), col = new THREE.Color();
    this.items.forEach((it, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -it.yaw);
      if (it.n) q.premultiply(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), it.n));
      mx.compose(p.set(it.x, it.y, -it.z), q, s.set(it.sx, 1, it.sz));
      m.setMatrixAt(i, mx);
      m.setColorAt(i, col.setRGB(it.k, it.k, it.k));
    });
    m.computeBoundingSphere();
    m.renderOrder = 0.5; // after opaque surfaces, before additive light patches
    m.userData.region = region;
    m.userData.contactShadows = true;
    scene.add(m);
    return m;
  }
}
