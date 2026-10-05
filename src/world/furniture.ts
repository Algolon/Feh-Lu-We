// Static furniture and decor (batched), plus lamp/lantern models for interactive lights.
import * as THREE from 'three';
import { type Ctx } from './arch';
import { box, cyl, blob, compound, planMatrix, v3, getKit } from './kit';
import { paintingTexture } from './textures';
import type { World } from '../interactions/world';
import type { Batcher } from './kit';
import { makeFire } from './fire';

const rot = (dx: number, dz: number, yaw: number): [number, number] => [dx * Math.cos(yaw) + dz * Math.sin(yaw), -dx * Math.sin(yaw) + dz * Math.cos(yaw)];

/** Place a part relative to a furniture origin (x,z,yaw). Local dx = right, dz = forward (facing). */
function P(c: Ctx, mat: THREE.Material, color: THREE.ColorRepresentation, x: number, z: number, yaw: number, dx: number, y0: number, dz: number, sx: number, sy: number, sz: number, uv = 0) {
  const [rx, rz] = rot(dx, dz, yaw);
  box(c.b, mat, color, x + rx, y0, z + rz, sx, sy, sz, { yaw, uv, chunk: c.chunk });
}

function collide(c: Ctx, x: number, z: number, yaw: number, w: number, d: number, h: number, y0 = 0) {
  const swap = Math.abs(Math.sin(yaw)) > 0.7;
  c.col.addBoxC(x, z, swap ? d : w, swap ? w : d, y0, y0 + h);
}

export function table(c: Ctx, x: number, z: number, y0: number, w: number, d: number, yaw = 0, color = '#7a4a28', h = 0.76) {
  const k = c.k;
  P(c, k.M.wood, color, x, z, yaw, 0, y0 + h - 0.06, 0, w, 0.06, d, 1);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P(c, k.M.paint, '#5e3a1e', x, z, yaw, sx * (w / 2 - 0.08), y0, sz * (d / 2 - 0.08), 0.07, h - 0.06, 0.07);
  collide(c, x, z, yaw, w, d, h, y0);
}

export function roundTable(c: Ctx, x: number, z: number, y0: number, r: number, color = '#7a4a28') {
  cyl(c.b, c.k.M.wood, color, x, y0 + 0.7, z, r, r, 0.06, 20, { chunk: c.chunk });
  cyl(c.b, c.k.M.paint, '#5e3a1e', x, y0, z, 0.08, 0.08, 0.7, 8, { chunk: c.chunk });
  cyl(c.b, c.k.M.paint, '#5e3a1e', x, y0, z, 0.4, 0.4, 0.05, 12, { chunk: c.chunk });
  c.col.addCircle(x, z, r * 0.9, y0, y0 + 0.76);
}

export function chair(c: Ctx, x: number, z: number, y0: number, yaw: number, seat = '#b5643c', collideIt = true) {
  const k = c.k;
  P(c, k.M.wood, '#6b4426', x, z, yaw, 0, y0 + 0.44, 0, 0.46, 0.05, 0.46, 1);
  P(c, k.M.paint, seat, x, z, yaw, 0, y0 + 0.49, 0, 0.42, 0.05, 0.42);
  P(c, k.M.wood, '#6b4426', x, z, yaw, 0, y0 + 0.49, -0.21, 0.46, 0.6, 0.05, 1);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P(c, k.M.paint, '#5e3a1e', x, z, yaw, sx * 0.19, y0, sz * 0.19, 0.04, 0.44, 0.04);
  if (collideIt) c.col.addCircle(x, z, 0.26, y0, y0 + 0.9);
}

export function sofa(c: Ctx, x: number, z: number, y0: number, yaw: number, w = 2.2, color = '#5f7a45') {
  const k = c.k;
  P(c, k.M.paint, color, x, z, yaw, 0, y0, 0, w, 0.45, 0.9);
  P(c, k.M.paint, color, x, z, yaw, 0, y0 + 0.45, -0.35, w, 0.45, 0.22);
  for (const s of [-1, 1]) P(c, k.M.paint, color, x, z, yaw, s * (w / 2 - 0.1), y0 + 0.45, 0, 0.2, 0.22, 0.9);
  for (let i = 0; i < 3; i++) P(c, k.M.paint, ['#c4553d', '#d9a441', '#8a5a9a'][i], x, z, yaw, (i - 1) * w * 0.3, y0 + 0.45, -0.18, 0.4, 0.38, 0.12);
  collide(c, x, z, yaw, w, 0.9, 0.9, y0);
}

export function armchair(c: Ctx, x: number, z: number, y0: number, yaw: number, color = '#6b7f9a') {
  sofa(c, x, z, y0, yaw, 1.0, color);
}

const BOOK_PALETTES: Record<string, string[]> = {
  leather: ['#7a2f2a', '#8a4a2a', '#5a3a28', '#9a6a3a', '#6b2a2a'],
  navy: ['#2f3f5f', '#3f5070', '#26344a', '#5a6a80', '#7a6a4a'],
  olive: ['#4f5f32', '#6a6a3a', '#3f4a2a', '#8a7a4a', '#5a4a2a'],
  linen: ['#cbb98f', '#a88f62', '#d8c8a0', '#8a7a5a', '#b8a070'],
};
export function bookshelf(c: Ctx, x: number, z: number, y0: number, yaw: number, w = 1.6, h = 2.2, palette = 'leather', depth = 0.35) {
  const k = c.k;
  const pal = BOOK_PALETTES[palette] ?? BOOK_PALETTES.leather;
  P(c, k.M.wood, '#5a3a22', x, z, yaw, 0, y0, -0.15, w, h, 0.05, 1);
  for (const s of [-1, 1]) P(c, k.M.wood, '#5a3a22', x, z, yaw, s * (w / 2 - 0.03), y0, 0, 0.05, h, depth, 1);
  P(c, k.M.wood, '#4a2f1a', x, z, yaw, 0, y0 + h - 0.02, 0.02, w + 0.06, 0.08, depth + 0.06, 1); // cornice
  const shelves = Math.floor(h / 0.42);
  let seed = Math.floor(x * 7 + z * 13);
  const r = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i <= shelves; i++) {
    const yy = y0 + i * (h / shelves) - (i === shelves ? 0.04 : 0);
    P(c, k.M.wood, '#5a3a22', x, z, yaw, 0, yy, 0, w - 0.06, 0.04, 0.33, 1);
    if (i < shelves) {
      let bx = -w / 2 + 0.1;
      while (bx < w / 2 - 0.15) {
        const bw = 0.04 + r() * 0.06, bh = 0.24 + r() * 0.1;
        P(c, k.M.paint, pal[Math.floor(r() * pal.length)], x, z, yaw, bx + bw / 2, yy + 0.04, 0, bw, bh, 0.24);
        bx += bw + 0.01;
      }
    }
  }
  collide(c, x, z, yaw, w, depth + 0.05, h, y0);
}

export function bed(c: Ctx, x: number, z: number, y0: number, yaw: number) {
  const k = c.k;
  P(c, k.M.wood, '#6b4426', x, z, yaw, 0, y0, 0, 1.6, 0.4, 2.1, 1);
  P(c, k.M.paint, '#efe6d6', x, z, yaw, 0, y0 + 0.4, 0, 1.5, 0.2, 2.0);
  P(c, k.M.paint, '#7a3a3a', x, z, yaw, 0, y0 + 0.6, 0.25, 1.55, 0.06, 1.3);
  P(c, k.M.paint, '#ffffff', x, z, yaw, 0, y0 + 0.6, -0.75, 1.2, 0.14, 0.4);
  P(c, k.M.wood, '#6b4426', x, z, yaw, 0, y0, -1.05, 1.6, 1.1, 0.08, 1);
  collide(c, x, z, yaw, 1.6, 2.15, 0.8, y0);
}

export function counter(c: Ctx, x: number, z: number, y0: number, yaw: number, w: number, top = '#d8cdb8', body = '#7f9a8a') {
  const k = c.k;
  P(c, k.M.paint, body, x, z, yaw, 0, y0, 0, w, 0.86, 0.62);
  P(c, k.M.paint, top, x, z, yaw, 0, y0 + 0.86, 0.02, w + 0.02, 0.05, 0.66);
  for (let i = 0; i < Math.floor(w / 0.6); i++) P(c, k.M.paint, '#c9a44c', x, z, yaw, -w / 2 + 0.3 + i * 0.6, y0 + 0.72, 0.32, 0.12, 0.03, 0.03);
  collide(c, x, z, yaw, w, 0.66, 0.92, y0);
}

export function rug(c: Ctx, x: number, z: number, y: number, w: number, d: number, yaw = 0, tint = '#ffffff') {
  box(c.b, c.k.M.rug, tint, x, y, z, w, 0.012, d, { yaw, chunk: c.chunk, shadow: false });
}

export function plant(c: Ctx, x: number, z: number, y0: number, s = 1, pot = '#c9774a') {
  cyl(c.b, c.k.M.paint, pot, x, y0, z, 0.24 * s, 0.18 * s, 0.4 * s, 10, { chunk: c.chunk });
  for (let i = 0; i < 4; i++) {
    const a = i * 1.7;
    blob(c.b, c.k.M.foliage, ['#4f8a3a', '#5f9a44', '#3f7a32'][i % 3], x + Math.cos(a) * 0.15 * s, y0 + (0.6 + i * 0.12) * s, z + Math.sin(a) * 0.15 * s, 0.25 * s, 0.32 * s, 0.25 * s, { chunk: c.chunk });
  }
  c.col.addCircle(x, z, 0.22 * s, y0, y0 + 1);
}

export function crate(c: Ctx, x: number, z: number, y0: number, s = 0.6, yaw = 0, color = '#a0784a') {
  box(c.b, c.k.M.wood, color, x, y0, z, s, s, s, { yaw, uv: 1, chunk: c.chunk });
  c.col.addCircle(x, z, s * 0.6, y0, y0 + s);
}

// ---------------------------------------------------------------- paintings (one shared atlas material)
let atlasMat: THREE.MeshLambertMaterial | null = null;
function paintingAtlas() {
  if (atlasMat) return atlasMat;
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 192;
  const x = cv.getContext('2d')!;
  for (let i = 0; i < 8; i++) {
    const t = paintingTexture(i + 3);
    x.drawImage(t.image as HTMLCanvasElement, (i % 4) * 128, Math.floor(i / 4) * 96, 128, 96);
    t.dispose();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  atlasMat = new THREE.MeshLambertMaterial({ map: tex, vertexColors: true });
  return atlasMat;
}

/** Framed painting hung on a wall. Faces plan heading yaw. */
export function painting(c: Ctx, x: number, y: number, z: number, yaw: number, w = 0.9, h = 0.68, idx = 0) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const u0 = (idx % 4) / 4, v0 = 1 - (Math.floor(idx / 4) + 1) / 2;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) / 4, v0 + uv.getY(i) / 2);
  // PlaneGeometry faces +Z (three) = plan south; our facing convention: local -Z faces yaw → rotate by PI
  const [fx, fz] = [Math.sin(yaw), Math.cos(yaw)];
  c.b.add(paintingAtlas(), g, planMatrix(x + fx * 0.045, y, z + fz * 0.045, yaw + Math.PI), '#ffffff', c.chunk, false, 0);
  g.dispose();
  P(c, c.k.M.paint, '#b8892f', x, z, yaw, 0, y - h / 2 - 0.07, 0, w + 0.14, h + 0.14, 0.06);
}

// ---------------------------------------------------------------- light models (individual objects)
export interface LampModel { obj: THREE.Group; glow: THREE.MeshBasicMaterial[]; light: THREE.Vector3; flames?: THREE.Object3D }

function glowPart(w: World, geom: THREE.BufferGeometry, color = '#ffd27a') {
  const m = w.material(new THREE.MeshBasicMaterial({ color }));
  const mesh = new THREE.Mesh(geom, m);
  return { mesh, m };
}

export function tableLamp(w: World, x: number, y0: number, z: number): LampModel {
  const k = getKit();
  const obj = compound((b) => {
    cyl(b, k.M.paint, '#e8dfc8', 0, 0, 0, 0.1, 0.13, 0.32, 10);
  });
  const shade = glowPart(w, new THREE.CylinderGeometry(0.14, 0.24, 0.26, 14, 1, true), '#ffe2a8');
  shade.mesh.position.y = 0.45;
  (shade.m as THREE.MeshBasicMaterial).side = THREE.DoubleSide;
  obj.add(shade.mesh);
  obj.position.copy(v3(x, y0, z));
  w.scene.add(obj);
  return { obj, glow: [shade.m], light: v3(x, y0 + 0.5, z) };
}

export function floorLamp(w: World, x: number, y0: number, z: number): LampModel {
  const k = getKit();
  const obj = compound((b) => {
    cyl(b, k.M.paint, '#3b3026', 0, 0, 0, 0.2, 0.22, 0.04, 12);
    cyl(b, k.M.paint, '#3b3026', 0, 0, 0, 0.02, 0.02, 1.5, 6);
  });
  const shade = glowPart(w, new THREE.CylinderGeometry(0.18, 0.3, 0.32, 14, 1, true), '#ffe2a8');
  shade.mesh.position.y = 1.55;
  (shade.m as THREE.MeshBasicMaterial).side = THREE.DoubleSide;
  obj.add(shade.mesh);
  obj.position.copy(v3(x, y0, z));
  w.scene.add(obj);
  return { obj, glow: [shade.m], light: v3(x, y0 + 1.6, z) };
}

/** Hanging candle chandelier with real candle flames (shown while the lamp is on). */
export function chandelier(w: World, x: number, yTop: number, z: number, r = 0.8, drop = 1.2): LampModel {
  const k = getKit();
  const obj = new THREE.Group();
  const frame = compound((b) => {
    cyl(b, k.M.paint, '#2f2a24', 0, -drop, 0, 0.02, 0.02, drop, 5);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      box(b, k.M.paint, '#2f2a24', Math.cos(a) * r, -drop - 0.04, Math.sin(a) * r, 0.06, 0.05, r * 0.55, { yaw: Math.PI / 2 - a });
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      cyl(b, k.M.paint, '#b8892f', Math.cos(a) * r, -drop, Math.sin(a) * r, 0.05, 0.045, 0.02, 8);
      cyl(b, k.M.paint, '#efe6c8', Math.cos(a) * r, -drop + 0.02, Math.sin(a) * r, 0.026, 0.026, 0.16, 8);
    }
  });
  obj.add(frame);
  obj.position.copy(v3(x, yTop, z));
  w.scene.add(obj);
  const wicks: [number, number, number][] = [];
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; wicks.push([Math.cos(a) * r, 0, Math.sin(a) * r]); }
  const flames = makeFire(w, { kind: 'candles', x, y: yTop - drop + 0.185, z, wicks, s: 1.2 });
  // an invisible material handle keeps the LampModel contract (no glow sphere needed)
  const glow = w.material(new THREE.MeshBasicMaterial({ color: '#ffd27a' }));
  return { obj, glow: [glow], light: v3(x, yTop - drop + 0.1, z), flames };
}

/** Lantern box (iron frame + glowing glass), optionally with a symbol cut-out panel. */
export function lantern(w: World, x: number, y0: number, z: number, s = 1, yaw = 0): LampModel {
  const k = getKit();
  const obj = compound((b) => {
    box(b, k.M.paint, '#2b2622', 0, 0, 0, 0.3 * s, 0.04 * s, 0.3 * s);
    box(b, k.M.paint, '#2b2622', 0, 0.42 * s, 0, 0.34 * s, 0.05 * s, 0.34 * s);
    cyl(b, k.M.paint, '#2b2622', 0, 0.47 * s, 0, 0.02 * s, 0.17 * s, 0.12 * s, 4, { yaw: Math.PI / 4 });
    for (const dx of [-1, 1]) for (const dz of [-1, 1]) box(b, k.M.paint, '#2b2622', dx * 0.14 * s, 0, dz * 0.14 * s, 0.03 * s, 0.44 * s, 0.03 * s);
  });
  const glass = glowPart(w, new THREE.BoxGeometry(0.25 * s, 0.36 * s, 0.25 * s), '#ffd27a');
  glass.mesh.position.y = 0.22 * s;
  obj.add(glass.mesh);
  obj.position.copy(v3(x, y0, z));
  obj.rotation.y = -yaw;
  w.scene.add(obj);
  return { obj, glow: [glass.m], light: v3(x, y0 + 0.25 * s, z) };
}

export function wallSconce(w: World, x: number, y: number, z: number, yaw: number): LampModel {
  const k = getKit();
  const obj = compound((b) => {
    box(b, k.M.paint, '#b8892f', 0, -0.12, 0.03, 0.1, 0.24, 0.04);
    box(b, k.M.paint, '#b8892f', 0, -0.02, -0.08, 0.04, 0.04, 0.2);
  });
  const shade = glowPart(w, new THREE.CylinderGeometry(0.07, 0.11, 0.16, 10), '#ffe2a8');
  shade.mesh.position.set(0, 0.08, -0.18);
  obj.add(shade.mesh);
  obj.position.copy(v3(x, y, z));
  obj.rotation.y = -yaw;
  w.scene.add(obj);
  const [fx, fz] = [Math.sin(yaw), Math.cos(yaw)];
  return { obj, glow: [shade.m], light: v3(x + fx * 0.4, y + 0.1, z + fz * 0.4) };
}


export { P as part };

/** Always-on decorative lantern baked into the static batch (no per-lamp draw calls) + pooled light. */
export function staticLantern(c: Ctx, w: World, x: number, y0: number, z: number, s = 1, yaw = 0, intensity = 3, distance = 7) {
  const k = c.k;
  const b: Batcher = c.b;
  const o = { yaw, chunk: c.chunk, shadow: false };
  box(b, k.M.paint, '#2b2622', x, y0, z, 0.3 * s, 0.04 * s, 0.3 * s, o);
  box(b, k.M.paint, '#2b2622', x, y0 + 0.42 * s, z, 0.34 * s, 0.05 * s, 0.34 * s, o);
  cyl(b, k.M.paint, '#2b2622', x, y0 + 0.47 * s, z, 0.02 * s, 0.17 * s, 0.12 * s, 4, { ...o, yaw: yaw + Math.PI / 4 });
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
    const [rx, rz] = rot(dx * 0.14 * s, dz * 0.14 * s, yaw);
    box(b, k.M.paint, '#2b2622', x + rx, y0, z + rz, 0.03 * s, 0.44 * s, 0.03 * s, o);
  }
  box(b, k.M.glow, '#ffd27a', x, y0 + 0.04 * s, z, 0.25 * s, 0.36 * s, 0.25 * s, { ...o, jitter: 0 });
  w.lamps.push({ id: `fixed.${x.toFixed(2)}.${z.toFixed(2)}`, pos: v3(x, y0 + 0.25 * s, z), color: 0xffc77a, intensity, distance, on: () => true });
}

/** Always-on wall sconce baked into the static batch. Faces plan heading yaw (away from the wall). */
export function staticSconce(c: Ctx, w: World, x: number, y: number, z: number, yaw: number, intensity = 3, distance = 6) {
  const k = c.k;
  P(c, k.M.paint, '#b8892f', x, z, yaw, 0, y - 0.12, -0.03 + 0.03, 0.1, 0.24, 0.04);
  P(c, k.M.paint, '#b8892f', x, z, yaw, 0, y - 0.02, 0.08, 0.04, 0.04, 0.2);
  const [fx, fz] = [Math.sin(yaw), Math.cos(yaw)];
  cyl(c.b, k.M.glow, '#ffe2a8', x + fx * 0.18, y, z + fz * 0.18, 0.07, 0.11, 0.16, 10, { chunk: c.chunk, shadow: false, jitter: 0 });
  w.lamps.push({ id: `fixed.${x.toFixed(2)}.${z.toFixed(2)}`, pos: v3(x + fx * 0.4, y + 0.1, z + fz * 0.4), color: 0xffc77a, intensity, distance, on: () => true });
}


// ---------------------------------------------------------------- iteration 3 decor kit (rounded, chunky timber, warm textiles)
/** Bed with headboard, mattress, duvet in a given colour and two pillows. Faces plan heading yaw (foot end). */
export function bed2(c: Ctx, x: number, z: number, y0: number, yaw: number, duvet = '#7a3a3a', wood = '#6b4426', width = 1.6) {
  const k = c.k;
  P(c, k.M.wood, wood, x, z, yaw, 0, y0, 0, width, 0.38, 2.1, 1);
  P(c, k.M.paint, '#efe6d6', x, z, yaw, 0, y0 + 0.38, 0, width - 0.08, 0.18, 2.0);
  P(c, k.M.paint, duvet, x, z, yaw, 0, y0 + 0.56, 0.22, width - 0.02, 0.09, 1.45);
  P(c, k.M.paint, new THREE.Color(duvet).multiplyScalar(0.85), x, z, yaw, 0, y0 + 0.4, 0.95, width + 0.02, 0.26, 0.05);
  for (const s of [-1, 1]) P(c, k.M.paint, '#fbf6ea', x, z, yaw, s * width * 0.24, y0 + 0.56, -0.72, width * 0.42, 0.14, 0.38);
  P(c, k.M.wood, wood, x, z, yaw, 0, y0, -1.06, width + 0.1, 1.15, 0.1, 1);
  P(c, k.M.wood, new THREE.Color(wood).multiplyScalar(0.8), x, z, yaw, 0, y0 + 1.15, -1.06, width + 0.16, 0.08, 0.14, 1);
  collide(c, x, z, yaw, width, 2.15, 0.8, y0);
}
export function bedside(c: Ctx, x: number, z: number, y0: number, yaw: number, wood = '#6b4426') {
  const k = c.k;
  P(c, k.M.wood, wood, x, z, yaw, 0, y0, 0, 0.45, 0.55, 0.4, 0.5);
  P(c, k.M.wood, new THREE.Color(wood).multiplyScalar(1.1), x, z, yaw, 0, y0 + 0.55, 0, 0.5, 0.04, 0.44, 0.5);
  P(c, k.M.paint, '#c9a44c', x, z, yaw, 0, y0 + 0.36, 0.205, 0.08, 0.03, 0.02);
  collide(c, x, z, yaw, 0.5, 0.45, 0.6, y0);
}
export function wardrobe(c: Ctx, x: number, z: number, y0: number, yaw: number, w = 1.4, wood = '#6b4426') {
  const k = c.k;
  P(c, k.M.wood, wood, x, z, yaw, 0, y0, 0, w, 2.0, 0.6, 1);
  P(c, k.M.wood, new THREE.Color(wood).multiplyScalar(0.8), x, z, yaw, 0, y0 + 2.0, 0, w + 0.08, 0.1, 0.66, 1);
  for (const s of [-1, 1]) P(c, k.M.wood, new THREE.Color(wood).multiplyScalar(1.08), x, z, yaw, s * w * 0.25, y0 + 0.2, 0.305, w * 0.46, 1.6, 0.02, 0.6);
  for (const s of [-1, 1]) P(c, k.M.paint, '#c9a44c', x, z, yaw, s * 0.06, y0 + 1.0, 0.32, 0.03, 0.14, 0.03);
  collide(c, x, z, yaw, w, 0.6, 2.1, y0);
}
/** Drapes either side of a window (on a wall facing heading yaw), with a rod. */
export function curtains(c: Ctx, x: number, z: number, y0: number, yaw: number, w = 1.3, h = 1.9, color = '#3f6f78') {
  const k = c.k;
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) P(c, k.M.paint, new THREE.Color(color).multiplyScalar(0.9 + i * 0.06), x, z, yaw, s * (w / 2 + 0.05 + i * 0.07), y0, 0.06 + (i % 2) * 0.03, 0.09, h, 0.05);
  P(c, k.M.paint, '#8a6a3a', x, z, yaw, 0, y0 + h + 0.02, 0.05, w + 0.7, 0.04, 0.04);
}
export function desk(c: Ctx, x: number, z: number, y0: number, yaw: number, w = 1.5, d = 0.75, wood = '#6b4426') {
  const k = c.k;
  P(c, k.M.wood, wood, x, z, yaw, 0, y0 + 0.72, 0, w, 0.06, d, 1);
  for (const s of [-1, 1]) P(c, k.M.wood, new THREE.Color(wood).multiplyScalar(0.85), x, z, yaw, s * (w / 2 - 0.22), y0, 0, 0.42, 0.72, d - 0.06, 1);
  collide(c, x, z, yaw, w, d, 0.8, y0);
}
/** Slanted reading lectern; returns the plan point and height of the book rest. */
export function lectern(c: Ctx, x: number, z: number, y0: number, yaw: number, wood = '#5a3a22') {
  const k = c.k;
  P(c, k.M.wood, wood, x, z, yaw, 0, y0, 0, 0.5, 0.05, 0.4, 1);
  P(c, k.M.wood, wood, x, z, yaw, 0, y0, 0, 0.12, 1.0, 0.12, 1);
  box(c.b, k.M.wood, new THREE.Color(wood).multiplyScalar(1.15), x, y0 + 1.0, z, 0.62, 0.05, 0.46, { yaw, rx: -0.45, chunk: c.chunk, uv: 0.6 });
  c.col.addCircle(x, z, 0.3, y0, y0 + 1.2);
  return { x, z, y: y0 + 1.06 };
}
export function bathtub(c: Ctx, x: number, z: number, y0: number, yaw: number) {
  const k = c.k;
  P(c, k.M.paint, '#f4f1ea', x, z, yaw, 0, y0 + 0.08, 0, 0.8, 0.5, 1.7);
  P(c, k.M.paint, '#bfe0e6', x, z, yaw, 0, y0 + 0.5, 0, 0.62, 0.02, 1.5);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P(c, k.M.paint, '#c9a44c', x, z, yaw, sx * 0.3, y0, sz * 0.7, 0.08, 0.1, 0.08);
  collide(c, x, z, yaw, 0.8, 1.7, 0.6, y0);
}
export function ladder(c: Ctx, x: number, z: number, y0: number, yaw: number, h = 3.0, wood = '#8a5a33') {
  const k = c.k;
  for (const s of [-1, 1]) P(c, k.M.wood, wood, x, z, yaw, s * 0.22, y0, 0, 0.05, h, 0.05, 0.5);
  for (let y = 0.3; y < h; y += 0.3) P(c, k.M.wood, wood, x, z, yaw, 0, y0 + y, 0, 0.44, 0.04, 0.05, 0.5);
}
/** Small telescope on a tripod pointing out of a window. */
export function telescope(c: Ctx, x: number, z: number, y0: number, yaw: number) {
  const k = c.k;
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; cyl(c.b, k.M.wood, '#5a3a22', x + Math.cos(a) * 0.2, y0, z + Math.sin(a) * 0.2, 0.015, 0.02, 1.25, 5, { chunk: c.chunk, rz: Math.cos(a) * 0.16, rx: -Math.sin(a) * 0.16 }); }
  cyl(c.b, k.M.paint, '#b8892f', x, y0 + 1.25, z, 0.05, 0.06, 0.8, 10, { chunk: c.chunk, rx: Math.PI / 2 - 0.35, yaw });
  c.col.addCircle(x, z, 0.3, y0, y0 + 1.5);
}
/** A flat framed panel with its own canvas texture (signs, boards, drawn diagrams). Faces plan heading yaw. */
export function canvasPanel(w: World, x: number, y: number, z: number, yaw: number, width: number, height: number, draw: (x: CanvasRenderingContext2D, W: number, H: number) => void, px = 512, frame: string | null = '#6b4426', emissive = false) {
  const cv = document.createElement('canvas');
  cv.width = px; cv.height = Math.round((px * height) / width);
  const g = cv.getContext('2d')!;
  draw(g, cv.width, cv.height);
  const tex = w.texture(new THREE.CanvasTexture(cv));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = w.material(emissive ? new THREE.MeshBasicMaterial({ map: tex }) : new THREE.MeshLambertMaterial({ map: tex }));
  const grp = new THREE.Group();
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
  plane.position.z = 0.03;
  grp.add(plane);
  if (frame) {
    const k = getKit();
    grp.add(compound((b) => box(b, k.M.wood, frame, 0, -height / 2 - 0.05, -0.0, width + 0.1, height + 0.1, 0.04)));
  }
  grp.position.copy(v3(x, y, z));
  grp.rotation.y = Math.PI - yaw; // plane normal (+Z local) points along plan heading yaw
  // a wall-mounted panel belongs to the room it faces (sampling around it would leak through the wall)
  grp.updateMatrixWorld(true);
  const fwd = new THREE.Vector3(Math.sin(yaw) * 0.4, 0, Math.cos(yaw) * 0.4);
  grp.userData.roomProbe = { x: x + fwd.x, y, z: z + fwd.z };
  w.scene.add(grp);
  return { grp, mat, tex, canvas: cv };
}
