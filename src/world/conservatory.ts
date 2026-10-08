// Glazed pool conservatory X 116–130, Z 94–112 — "Francois' Copacabana Room" — joined to the service wing (door
// from the service corridor). The swimming pool is INSIDE, with a dry walkable perimeter; there is no outdoor pool.
// DEV-02: a 2.4 m double door (one saved state `door.consEast`) opens east onto the wellness deck; a small bar in the
// north-east corner; personal name boards inside (corridor) and outside. The barrel sauna stands on the deck, its
// raised floor (+0.80) reached by a ramp and landing from the north (no steps up from a flat path).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { World, GameApi } from '../interactions/world';
import { type Ctx, floor } from './arch';
import { Batcher, box, boxMM, cyl, blob, compound, v3, getKit } from './kit';
import { plant, staticLantern, nameBoard, lounger, joinery, bottleGeo } from './furniture';
import { Asm, artMats, lathe } from './artkit';
import { makeDoor, makePickup, makeInspect, makeAction, place } from '../interactions/props';
import { drawSymbol } from '../content/symbols';
import { registerOpening } from './openings';
import { addClue } from '../core/state';
import { turnWheel, wheels, WHEEL_SYMBOLS } from '../puzzles/rules';
import { GF, CONS, POOL, SITES, CONS_EAST_DOOR, SAUNA_RAMP, SAUNA_FLOOR } from './layout';
const poolDepth = (z: number) => -1.0 - ((z - POOL.z0) / (POOL.z1 - POOL.z0)) * 1.0; // shallow south → deep north

function mosaicTexture(sym: string) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const x = cv.getContext('2d')!;
  x.fillStyle = '#e8f4f0';
  x.fillRect(0, 0, 128, 128);
  x.strokeStyle = '#2f6f80';
  x.lineWidth = 6;
  x.strokeRect(4, 4, 120, 120);
  drawSymbol(x, sym, 14, 14, 100);
  // mosaic grout
  x.strokeStyle = 'rgba(255,255,255,0.35)';
  x.lineWidth = 1;
  for (let i = 0; i < 128; i += 8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 128); x.moveTo(0, i); x.lineTo(128, i); x.stroke(); }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function textTexture(lines: string[], w = 256, h = 96, bg = '#f2ead6', ink = '#2f5a6a') {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const x = cv.getContext('2d')!;
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  x.fillStyle = ink; x.textAlign = 'center'; x.font = `bold ${Math.round(h / (lines.length + 1.2))}px Georgia, serif`;
  lines.forEach((l, i) => x.fillText(l, w / 2, ((i + 1) * h) / (lines.length + 0.6)));
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function saunaBoardTexture() {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 320;
  const x = cv.getContext('2d')!;
  x.fillStyle = '#c99a62'; x.fillRect(0, 0, 256, 320);
  x.strokeStyle = '#4a2a12'; x.lineWidth = 5;
  x.strokeRect(70, 40, 116, 230);
  x.fillStyle = '#4a2a12'; x.textAlign = 'center'; x.font = 'bold 22px Georgia';
  x.fillText('DIEP', 128, 30); x.fillText('ONDIEP', 128, 300);
  x.lineWidth = 7;
  x.beginPath(); x.moveTo(128, 60); x.lineTo(128, 240); x.stroke();
  x.beginPath(); x.moveTo(112, 222); x.lineTo(128, 250); x.lineTo(144, 222); x.closePath(); x.fill();
  x.lineWidth = 3;
  x.font = 'bold 18px Georgia';
  for (let i = 0; i < 4; i++) { x.strokeRect(150, 64 + i * 46, 28, 28); x.fillText(String(i + 1), 164, 85 + i * 46); }
  x.font = 'italic 15px Georgia';
  x.fillText('Zoals de stoom opstijgt:', 128, 316 - 0);
  return new THREE.CanvasTexture(cv);
}

export function buildConservatory(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const { x0: X0, x1: X1, z0: Z0, z1: Z1 } = CONS;
  const H = 3.4, PX = (POOL.x0 + POOL.x1) / 2, PZ = (POOL.z0 + POOL.z1) / 2, PW = POOL.x1 - POOL.x0;
  // floor around the pool (tiles), walkable everywhere; the pool itself is a solid boundary
  for (const [a, b2, cc, d] of [[X0, X1, Z0, POOL.z0], [X0, X1, POOL.z1, Z1], [X0, POOL.x0, POOL.z0, POOL.z1], [POOL.x1, X1, POOL.z0, POOL.z1]] as const) {
    floor(c, a, b2, cc, d, GF, k.M.tile, '#efe0c4', 0.6, false, 1.2);
  }
  w.col.addFloor(X0, X1, Z0, Z1, GF);
  w.col.addBox(POOL.x0, POOL.x1, POOL.z0, POOL.z1, -3, 2.5, { tag: 'pool' });
  for (const [a, b2, cc, d] of [[POOL.x0 - 0.3, POOL.x1 + 0.3, POOL.z0 - 0.3, POOL.z0], [POOL.x0 - 0.3, POOL.x1 + 0.3, POOL.z1, POOL.z1 + 0.3], [POOL.x0 - 0.3, POOL.x0, POOL.z0, POOL.z1], [POOL.x1, POOL.x1 + 0.3, POOL.z0, POOL.z1]] as const) {
    boxMM(c.b, k.M.stone, '#f3ead6', a, b2, GF - 0.02, GF + 0.04, cc, d, { chunk: c.chunk, uv: 1 });
  }
  // basin: tiled walls and a sloping floor
  const yb = -2.3;
  boxMM(c.b, k.M.poolTile, '#ffffff', POOL.x0 - 0.2, POOL.x0, yb, GF - 0.02, POOL.z0, POOL.z1, { chunk: c.chunk, uv: 1 });
  boxMM(c.b, k.M.poolTile, '#ffffff', POOL.x1, POOL.x1 + 0.2, yb, GF - 0.02, POOL.z0, POOL.z1, { chunk: c.chunk, uv: 1 });
  boxMM(c.b, k.M.poolTile, '#ffffff', POOL.x0 - 0.2, POOL.x1 + 0.2, yb, GF - 0.02, POOL.z0 - 0.2, POOL.z0, { chunk: c.chunk, uv: 1 });
  boxMM(c.b, k.M.poolTile, '#ffffff', POOL.x0 - 0.2, POOL.x1 + 0.2, yb, GF - 0.02, POOL.z1, POOL.z1 + 0.2, { chunk: c.chunk, uv: 1 });
  const len = POOL.z1 - POOL.z0;
  const tilt = Math.atan(1 / len);
  box(c.b, k.M.poolTile, '#dff4f6', PX, -1.55, PZ, PW, 0.1, Math.hypot(len, 1), { chunk: c.chunk, uv: 1, rx: -tilt });
  // steps at the shallow (south) end
  for (let i = 0; i < 3; i++) boxMM(c.b, k.M.stone, '#f3ead6', PX - 1.4, PX + 1.4, -1.0, GF - 0.25 - i * 0.3, POOL.z0, POOL.z0 + 0.45 + i * 0.4, { chunk: c.chunk });
  for (const x of [PX - 1.5, PX + 1.5]) cyl(c.b, k.M.paint, '#d8dde2', x, GF, POOL.z0 - 0.15, 0.03, 0.03, 1.0, 6, { chunk: c.chunk });
  // mosaic symbols on the pool floor (south → north): cirkel, driehoek, golf, ruit
  ['cirkel', 'driehoek', 'golf', 'ruit'].forEach((s, i) => {
    const z = POOL.z0 + 2 + i * 3;
    const mat = w.material(new THREE.MeshLambertMaterial({ map: w.texture(mosaicTexture(s)) }));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), mat);
    m.rotation.order = 'YXZ';
    m.rotation.x = -Math.PI / 2 - tilt;
    m.position.copy(v3(PX, poolDepth(z) + 0.075, z));
    w.scene.add(m);
  });
  // water
  const waterTex = k.T.water.clone();
  waterTex.needsUpdate = true;
  waterTex.repeat.set(2, 3);
  w.texture(waterTex);
  const waterMat = w.material(new THREE.MeshLambertMaterial({ color: '#4fd0dc', map: waterTex, transparent: true, opacity: 0.42, depthWrite: false, emissive: new THREE.Color('#0a3a44') }));
  const water = new THREE.Mesh(new THREE.PlaneGeometry(PW, len), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.copy(v3(PX, -0.06, PZ));
  water.renderOrder = 2;
  w.scene.add(water);
  w.onUpdate((_dt, t) => { if (!w.reducedMotion) waterTex.offset.set(Math.sin(t * 0.2) * 0.05, t * 0.02); });
  w.emitters.push({ kind: 'water', pos: v3(PX, 0, PZ), on: () => true });
  for (const [z, txt, rotY] of [[POOL.z0 - 0.55, 'ONDIEP · 1,0 m', 0], [POOL.z1 + 0.55, 'DIEP · 2,0 m', Math.PI]] as const) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.5), w.material(new THREE.MeshLambertMaterial({ map: w.texture(textTexture([txt])) })));
    m.rotation.order = 'YXZ';
    m.rotation.set(-Math.PI / 2, rotY, 0);
    m.position.copy(v3(PX, GF + 0.012, z));
    w.scene.add(m);
  }
  const poolHit = new THREE.Group();
  place(poolHit, PX, -0.1, PZ);
  w.scene.add(poolHit);
  makeInspect(w, g, { id: 'inspect.pool', obj: poolHit, clue: 'c.poolTiles', hit: [PW, 0.15, len], hitOffset: [0, 0, 0], label: 'Bekijken: zwembad', reach: 3.2 });

  // ---------------------------------------------------------------- glass shell (the wing wall closes most of the west side)
  const glass = new Batcher();
  const fr = '#2f4a3c';
  // DEV-04A: a door gap in a glazed wall is ONE architectural system with its doors: no mullion stands in the gap and
  // the sill / knee / transom rails stop at the jambs (they used to run straight across the open double door); jamb
  // posts carry the leaves, a head beam sits over the leaves' full height, glass fills the fanlight above it
  const gw = (axis: 'x' | 'z', f: number, a0: number, a1: number, gaps: [number, number][] = [], headY = H) => {
    const inGap = (a: number) => gaps.some(([s, e]) => a > s - 0.06 && a < e + 0.06);
    const post = (a: number) => (axis === 'x' ? box(c.b, k.M.paint, fr, a, 0, f, 0.1, H, 0.1, { chunk: c.chunk }) : box(c.b, k.M.paint, fr, f, 0, a, 0.1, H, 0.1, { chunk: c.chunk }));
    const n = Math.max(1, Math.round((a1 - a0) / 2));
    for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; if (!inGap(a)) post(a); }
    for (const [s, e] of gaps) { post(s - 0.05); post(e + 0.05); } // jambs just outside the clear opening
    let cur = a0;
    const segs: [number, number][] = [];
    for (const [s, e] of [...gaps].sort((p, q) => p[0] - q[0])) { segs.push([cur, s]); cur = e; }
    segs.push([cur, a1]);
    const rail = (r0: number, r1: number, y: number) => {
      if (axis === 'x') boxMM(c.b, k.M.paint, fr, r0, r1, y, y + 0.08, f - 0.05, f + 0.05, { chunk: c.chunk });
      else boxMM(c.b, k.M.paint, fr, f - 0.05, f + 0.05, y, y + 0.08, r0, r1, { chunk: c.chunk });
    };
    for (const y of [0.0, 0.55, 2.4]) for (const [s, e] of segs) if (e - s > 0.01) rail(s, e, y);
    rail(a0, a1, H - 0.08); // the wall plate runs over everything
    for (const [s, e] of gaps) { // fanlight over the doors: glass between the head beam and the wall plate
      if (axis === 'x') boxMM(glass, k.M.glass, '#ffffff', s, e, headY, H - 0.08, f - 0.015, f + 0.015, { chunk: 'glass' });
      else boxMM(glass, k.M.glass, '#ffffff', f - 0.015, f + 0.015, headY, H - 0.08, s, e, { chunk: 'glass' });
    }
    for (const [s, e] of segs) {
      if (e - s < 0.01) continue;
      if (axis === 'x') {
        boxMM(glass, k.M.glass, '#ffffff', s, e, 0.08, H - 0.08, f - 0.015, f + 0.015, { chunk: 'glass' });
        w.col.addBox(s, e, f - 0.08, f + 0.08, 0, H, { occludes: true });
      } else {
        boxMM(glass, k.M.glass, '#ffffff', f - 0.015, f + 0.015, 0.08, H - 0.08, s, e, { chunk: 'glass' });
        w.col.addBox(f - 0.08, f + 0.08, s, e, 0, H, { occludes: true });
      }
    }
  };
  const DD = CONS_EAST_DOOR; // double door opening Z 104.8–107.2 (2.4 m clear)
  gw('x', Z0, X0, X1);
  gw('x', Z1, X0, X1);
  const headY = GF + DD.h; // the leaves stand on the floor (+0.15) and are DD.h tall: the head beam sits on top of them
  gw('z', X1, Z0, Z1, [[DD.z0, DD.z1]], headY + 0.12);
  boxMM(c.b, k.M.paint, fr, X1 - 0.06, X1 + 0.06, headY, headY + 0.12, DD.z0 - 0.1, DD.z1 + 0.1, { chunk: c.chunk });
  w.col.addBox(X1 - 0.08, X1 + 0.08, DD.z0, DD.z1, headY, H, { occludes: true }); // head + fanlight over the doors
  registerOpening({ kind: 'door', axis: 'z', f: X1, t: 0.1, a0: DD.z0, a1: DD.z1, y0: GF, y1: headY, id: 'door.consEast' });
  gw('z', X0, 109.6, Z1);
  // the wing roof meets the conservatory: a glazed lean-to strip above the wing wall
  const ridge = 5.8, half = (X1 - X0) / 2, slope = Math.atan((ridge - H) / half), rl = Math.hypot(half, ridge - H), RX = (X0 + X1) / 2;
  for (const s of [-1, 1]) {
    box(glass, k.M.glass, '#ffffff', RX + (s * half) / 2, H + (ridge - H) / 2 - 0.02, (Z0 + Z1) / 2, rl, 0.03, Z1 - Z0, { rz: s * slope, chunk: 'glass' });
    for (let z = Z0; z <= Z1 + 0.01; z += 2) box(c.b, k.M.paint, fr, RX + (s * half) / 2, H + (ridge - H) / 2 - 0.08, z, rl, 0.08, 0.08, { rz: s * slope, chunk: c.chunk });
  }
  for (const z of [Z0, Z1]) {
    const tri = new THREE.Shape();
    tri.moveTo(-half, 0); tri.lineTo(half, 0); tri.lineTo(0, ridge - H); tri.closePath();
    const tg = new THREE.ShapeGeometry(tri);
    glass.add(k.M.glass, tg, new THREE.Matrix4().makeTranslation(RX, H, -z), '#ffffff', 'glass', false, 0);
    tg.dispose();
  }
  boxMM(c.b, k.M.paint, fr, X0, X1, H - 0.05, H + 0.05, Z0 - 0.05, Z0 + 0.05, { chunk: c.chunk });
  box(c.b, k.M.paint, fr, RX, ridge - 0.06, (Z0 + Z1) / 2, 0.14, 0.14, Z1 - Z0, { chunk: c.chunk });
  const glassMeshes = glass.build(w.scene, false);
  for (const m of glassMeshes) { m.renderOrder = 3; m.castShadow = false; }

  // doors: from the service corridor (west) and to the garden (east); the conservatory key opens both
  makeDoor(w, g, { id: 'door.consWest', x: 115.8, z: 101.85, dir: 'z+', width: 1.3, height: 2.3, y0: GF, swing: 1, style: 'glass', key: 'consKey' });
  // two 1.2 m leaves opening outward (east), ONE saved state and the shared conservatory lock (no half-door bypass)
  makeDoor(w, g, {
    id: 'door.consEast', x: X1, z: DD.z0, dir: 'z+', width: (DD.z1 - DD.z0) / 2, height: DD.h, y0: GF, swing: -1, style: 'glass', key: 'consKey', lockId: 'lock.door.consWest',
    pair: { x: X1, z: DD.z1, dir: 'z-', swing: 1 },
  });
  // name board outside, on its own post beside the doors (outside the leaf sweep X 130–131.4 / Z 104.5–107.5)
  box(c.b, k.M.wood, '#4a3a2a', 130.75, 0.15, 108.7, 0.1, 1.75, 0.1, { chunk: c.chunk });
  w.col.addCircle(130.75, 108.7, 0.1, 0, 2);
  nameBoard(w, 130.82, 1.95, 108.7, Math.PI / 2);

  // ---------------------------------------------------------------- furnishings
  lounger(c, 117.4, 104.5, GF, 0, '#6fae9a');
  lounger(c, 117.4, 107.6, GF, 0, '#e0a060');
  // DEV-02: the east lounger moved out to the deck: the lane from the double door to the pool path stays free
  for (const [x, z, s] of [[116.8, 111.2, 1.6], [129.2, 94.8, 1.5], [121, 111.3, 1.3], [124.2, 111.3, 1.4]] as const) plant(c, x, z, GF, s, '#c9774a');
  { const M = artMats(), a = new Asm(c.b, c.chunk, 129.1, GF, 103.6, 0.3); // teak side table with a stack of towels
    a.add(M.timber, '#a8743f', joinery.cg('sideTable', () => lathe([[0.001, 0], [0.22, 0], [0.22, 0.03], [0.05, 0.05], [0.05, 0.45], [0.35, 0.46], [0.35, 0.5], [0.001, 0.5]], 14)), 0, 0, 0);
    for (let i = 0; i < 3; i++) a.add(M.upholstery, ['#6fae9a', '#f2ead8', '#9aa8d8'][i], joinery.sb(0.4, 0.07, 0.3, 0.025), 0, 0.535 + i * 0.07, 0, { ry: i * 0.1 });
  }
  w.col.addCircle(129.1, 103.6, 0.4, 0, 0.8);
  // ES.copacabanaBar (X 127.5–129.5 / Z 109.2–111.4): a small straw-and-wood cocktail corner, outside the pool line.
  // DEV-03: a real bar — a counter with a reed (straw) front between timber posts, a thick rounded top, a brass foot
  // rail, a straw fringe canopy on the posts; a back bar on its own frame (cabinet + two shelves of bottles and
  // glasses) instead of a shelf stuck to a glazing bar; round bar stools with foot rings
  { const { sb, bx, cg, taperLeg } = joinery, M = artMats(), a = new Asm(c.b, c.chunk, 128.6, GF, 109.7, Math.PI);
    a.add(M.timber, '#6e4a2c', bx(2.1, 1.0, 0.7), 0, 0.5, 0.0);
    for (let i = 0; i < 26; i++) a.add(M.paint, i % 2 ? '#c8a050' : '#d8b86a', bx(0.07, 0.92, 0.02), -1.0 + i * 0.08, 0.52, 0.36);
    for (const sx of [-1, 1]) a.add(M.timber, '#4a2f1a', bx(0.1, 2.35, 0.1), sx * 1.05, 1.175, 0.36);
    a.add(M.timber, '#a8743f', sb(2.25, 0.07, 0.85, 0.025), 0, 1.07, 0.06);
    a.add(M.brass, '#c9a14e', cg('footRail', () => new THREE.CylinderGeometry(0.02, 0.02, 2.0, 8).rotateZ(Math.PI / 2)), 0, 0.22, 0.5);
    a.add(M.timber, '#4a2f1a', bx(2.3, 0.08, 0.95), 0, 2.38, -0.05);
    for (let i = 0; i < 24; i++) a.add(M.paint, '#c8a050', bx(0.1, 0.3, 0.02), -1.15 + i * 0.1, 2.2 - (i % 3) * 0.02, 0.42);
    // back bar against the glass, standing on its own frame
    const bb = new Asm(c.b, c.chunk, 128.7, GF, 111.35, Math.PI);
    bb.add(M.timber, '#6e4a2c', sb(2.0, 0.9, 0.4, 0.008), 0, 0.45, 0);
    for (const sx of [-1, 1]) bb.add(M.timber, '#4a2f1a', bx(0.06, 1.1, 0.06), sx * 0.97, 1.45, -0.1);
    const bottles = ['#2f6a3a', '#c8a050', '#7a2a2a', '#e8e0c8', '#3f6fa8', '#c4553d', '#2f6a3a', '#8a5a33'];
    for (const [yy, n] of [[1.35, 8], [1.8, 6]] as const) {
      bb.add(M.timber, '#7e5636', sb(2.0, 0.03, 0.22, 0.006), 0, yy, -0.1);
      for (let i = 0; i < n; i++) bb.add(k.M.glass, '#ffffff', bottleGeo(), -0.85 + i * (1.7 / (n - 1)), yy + 0.015, -0.1, { s: [1, 1, 1] });
      for (let i = 0; i < n; i++) bb.add(M.paint, bottles[i], bottleGeo(), -0.85 + i * (1.7 / (n - 1)), yy + 0.015, -0.1, { s: [0.92, 0.85, 0.92] });
    }
    for (let i = 0; i < 5; i++) bb.add(k.M.glass, '#ffffff', cg('tumbler', () => new THREE.CylinderGeometry(0.035, 0.03, 0.09, 8)), -0.5 + i * 0.25, 0.9 + 0.045, 0.05);
    for (const x of [128.0, 129.0]) {
      const st = new Asm(c.b, c.chunk, x, GF, 108.8, 0);
      st.add(M.timber, '#4a2f1a', cg('barStoolPost', () => lathe([[0.001, 0], [0.2, 0], [0.2, 0.03], [0.04, 0.06], [0.03, 0.7], [0.001, 0.7]], 12)), 0, 0, 0);
      st.add(M.brass, '#c9a14e', cg('stoolRing', () => new THREE.TorusGeometry(0.16, 0.012, 4, 14).rotateX(Math.PI / 2)), 0, 0.28, 0);
      st.add(M.upholstery, '#7a2e2a', cg('stoolSeat', () => lathe([[0.001, 0], [0.19, 0], [0.2, 0.04], [0.17, 0.08], [0.001, 0.09]], 14)), 0, 0.7, 0);
      w.col.addCircle(x, 108.8, 0.2, 0, 0.8);
    }
    void taperLeg;
  }
  w.col.addBox(127.5, 129.7, 109.3, 110.1, 0, GF + 1.1);
  w.col.addBox(127.7, 129.7, 111.15, 111.55, 0, GF + 1.0);
  for (const [x, z] of [[119, 96], [127, 96], [119, 110], [127, 110]] as const) {
    staticLantern(c, w, x, 2.6, z, 1.0, 0, 3.5, 7);
    box(c.b, k.M.paint, '#2b2622', x, 3.0, z, 0.02, 0.4, 0.02, { chunk: c.chunk });
  }
  // the forgotten third serving trolley (thread A)
  const trolley = compound((b) => {
    for (const y of [0.25, 0.8]) box(b, k.M.paint, '#c9a44c', 0, y, 0, 0.6, 0.04, 1.0);
    for (const [x, z] of [[-0.28, -0.46], [0.28, -0.46], [-0.28, 0.46], [0.28, 0.46]]) { box(b, k.M.paint, '#8a6a2a', x, 0.05, z, 0.03, 0.8, 0.03); cyl(b, k.M.paint, '#2b2b2b', x, 0, z, 0.05, 0.05, 0.03, 8, { rz: Math.PI / 2 }); }
    for (let i = 0; i < 3; i++) box(b, k.M.paint, ['#6fae9a', '#f2ead8', '#9aa8d8'][i], 0, 0.29 + i * 0.07, -0.15, 0.45, 0.07, 0.35);
    for (const z of [0.15, 0.32]) cyl(b, k.M.paint, '#f5f0e6', 0.05, 0.84, z, 0.05, 0.04, 0.07, 10);
    box(b, k.M.paint, '#f5eedc', -0.12, 0.84, 0.3, 0.12, 0.004, 0.09, { yaw: 0.3 });
  });
  place(trolley, 128.6, GF, 99.8, 0.15);
  w.scene.add(trolley);
  w.col.addBoxC(128.6, 99.8, 0.75, 1.15, 0, 1);
  makeInspect(w, g, { id: 'inspect.trolley', obj: trolley, clue: 'c.trolley', hit: [0.8, 1.0, 1.2], hitOffset: [0, 0.4, 0], label: 'Bekijken: serveerwagen' });

  // ---------------------------------------------------------------- the cabinet against the wing wall (thread A)
  const cx0 = 116.05, cx1 = 116.6, cbz = 96.4;
  boxMM(c.b, k.M.wood, '#5f3f26', cx0, cx1, GF, GF + 0.05, cbz - 0.62, cbz + 0.62, { chunk: c.chunk });
  boxMM(c.b, k.M.wood, '#5f3f26', cx0, cx1, GF + 2.05, GF + 2.47, cbz - 0.65, cbz + 0.65, { chunk: c.chunk });
  for (const s of [-1, 1]) boxMM(c.b, k.M.wood, '#5f3f26', cx0, cx1, GF, GF + 2.05, cbz + s * 0.6 - 0.04, cbz + s * 0.6 + 0.04, { chunk: c.chunk });
  boxMM(c.b, k.M.wood, '#5f3f26', cx0, cx1, GF + 0.9, GF + 0.96, cbz - 0.6, cbz + 0.6, { chunk: c.chunk });
  boxMM(c.b, k.M.wood, '#4a2f1a', cx0, cx0 + 0.05, GF, GF + 2.05, cbz - 0.6, cbz + 0.6, { chunk: c.chunk });
  boxMM(c.b, k.M.wood, '#5f3f26', cx0, cx1 - 0.05, GF + 1.45, GF + 1.48, cbz - 0.56, cbz + 0.56, { chunk: c.chunk });
  // closed lower doors (towels)
  boxMM(c.b, k.M.wood, '#7a5232', cx1 - 0.04, cx1, GF + 0.08, GF + 0.88, cbz - 0.56, cbz - 0.01, { chunk: c.chunk });
  boxMM(c.b, k.M.wood, '#7a5232', cx1 - 0.04, cx1, GF + 0.08, GF + 0.88, cbz + 0.01, cbz + 0.56, { chunk: c.chunk });
  w.col.addBox(cx0, cx1 + 0.05, cbz - 0.66, cbz + 0.66, 0, 2.6);
  // four numbered, turnable symbol wheels in the crown board (left→right = 1→4 when facing the cabinet)
  const symMat: Record<string, THREE.MeshLambertMaterial> = {};
  for (const sname of WHEEL_SYMBOLS) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 96;
    const x = cv.getContext('2d')!; x.fillStyle = '#efe2c2'; x.fillRect(0, 0, 96, 96);
    x.strokeStyle = '#6b4a2a'; x.lineWidth = 6; x.strokeRect(3, 3, 90, 90);
    drawSymbol(x, sname, 14, 14, 68);
    const t = w.texture(new THREE.CanvasTexture(cv)); t.colorSpace = THREE.SRGBColorSpace;
    symMat[sname] = w.material(new THREE.MeshLambertMaterial({ map: t }));
  }
  const woodSide = w.material(new THREE.MeshLambertMaterial({ color: '#8a5a33' }));
  const numCv = document.createElement('canvas'); numCv.width = 256; numCv.height = 32;
  { const x = numCv.getContext('2d')!; x.fillStyle = '#5f3f26'; x.fillRect(0, 0, 256, 32); x.fillStyle = '#f3dca0'; x.font = 'bold 24px Georgia'; x.textAlign = 'center'; ['1', '2', '3', '4'].forEach((n, i) => x.fillText(n, 32 + i * 64, 25)); }
  const numTex = w.texture(new THREE.CanvasTexture(numCv)); numTex.colorSpace = THREE.SRGBColorSpace;
  const nums = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 0.13), w.material(new THREE.MeshLambertMaterial({ map: numTex })));
  nums.position.copy(v3(cx1 + 0.015, GF + 2.385, cbz));
  nums.rotation.y = Math.PI / 2;
  w.scene.add(nums);
  const wheelMeshes: THREE.Mesh[] = [];
  const spin = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    // facing the cabinet (looking west) left is south: wheel 1 sits at the south end
    const zc = cbz - 0.39 + i * 0.26;
    const grp = new THREE.Group();
    grp.position.copy(v3(cx1 + 0.03, GF + 2.2, zc));
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.22), [symMat.driehoek, woodSide, woodSide, woodSide, woodSide, woodSide]);
    grp.add(mesh);
    w.scene.add(grp);
    wheelMeshes.push(mesh);
    makeAction(w, {
      id: `cab.wheel.${i + 1}`, obj: grp, hit: [0.14, 0.26, 0.25], hitOffset: [0, 0, 0], reach: 2.8,
      label: () => (g.state.flags.cabinetPanelSolved ? null : `Tegel ${i + 1} draaien`),
      run: () => {
        addClue(g.state, 'c.cabinet');
        const r = turnWheel(g.state, i);
        spin[i] = g.reducedMotion ? 0 : Math.PI / 2;
        g.act(r);
      },
    });
  }
  w.onSync(() => {
    const cur = wheels(g.state);
    cur.forEach((sname, i) => { (wheelMeshes[i].material as THREE.Material[])[0] = symMat[sname]; });
  });
  w.onUpdate((dt) => {
    for (let i = 0; i < 4; i++) {
      if (spin[i] <= 0) { wheelMeshes[i].rotation.x = 0; continue; }
      spin[i] = Math.max(0, spin[i] - dt * 9);
      wheelMeshes[i].rotation.x = -spin[i];
    }
  });
  makeDoor(w, g, { id: 'cab.upper', x: cx1 + 0.03, z: cbz - 0.56, dir: 'z+', width: 1.12, height: 1.08, y0: GF + 0.96, swing: -1, style: 'glass', unlock: 'lock.cabinetUpper', thickness: 0.04 });
  const upIt = w.byId.get('cab.upper')!;
  const upRun = upIt.run;
  upIt.label = () => (g.state.unlocked.includes('lock.cabinetUpper') ? (g.state.open['cab.upper'] ? 'Sluiten' : 'Openen') : 'Glazen deur');
  upIt.run = () => {
    if (g.state.unlocked.includes('lock.cabinetUpper')) return upRun();
    addClue(g.state, 'c.cabinet');
    g.act({ ok: false, msg: 'De glazen deur zit vast. Erboven zitten vier draaibare tegels, genummerd 1 tot 4. Achter het glas ligt een rond terracotta zegel.', sfx: 'locked' });
  };
  // the table seal behind the glass
  const seal = compound((b) => {
    cyl(b, k.M.paint, '#c4553d', 0, 0, 0, 0.1, 0.1, 0.03, 16, { rz: Math.PI / 2 });
    box(b, k.M.paint, '#f2e6c8', 0.016, -0.03, 0, 0.005, 0.02, 0.1);
    blob(b, k.M.paint, '#ffd27a', 0.016, 0.04, 0, 0.005, 0.03, 0.015);
  });
  place(seal, cx0 + 0.3, GF + 1.6, cbz, 0);
  w.scene.add(seal);
  makePickup(w, g, { id: 'pk.tableSeal', item: 'tableSeal', obj: seal, available: () => !!g.state.open['cab.upper'], hit: [0.3, 0.3, 0.3] });

  // ---------------------------------------------------------------- barrel sauna (outside, to the right)
  buildSauna(w, g, c);

  w.checkpoints.push({ name: 'conservatory', pose: { x: 118, y: GF, z: 99.5, yaw: Math.PI / 2, pitch: -0.2 } });
}

function buildSauna(w: World, g: GameApi, c: Ctx) {
  const k = getKit();
  const SX = SITES.sauna.x, R = 1.9, Z0 = SITES.sauna.z - 2, Z1 = SITES.sauna.z + 2, AY = 0.25 + R; // barrel axis height
  const FY = 0.8; // raised floor so the curved walls leave a comfortable width
  const woodMat = w.material(new THREE.MeshLambertMaterial({ map: k.T.wood, color: '#c48a52', side: THREE.DoubleSide }));
  // shell, both end caps and the two iron bands as two merged meshes (one per material): the sauna is in many views
  const cylG = new THREE.CylinderGeometry(R, R, Z1 - Z0, 22, 1, true).rotateX(Math.PI / 2).translate(SX, AY, -(Z0 + Z1) / 2);
  const capSG = new THREE.CircleGeometry(R, 22).translate(SX, AY, -Z0);
  const cap = new THREE.Shape();
  cap.absarc(0, 0, R, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  const dh0 = FY - AY, dh1 = FY + 1.8 - AY;
  hole.moveTo(-0.38, dh0); hole.lineTo(0.38, dh0); hole.lineTo(0.38, dh1); hole.lineTo(-0.38, dh1); hole.closePath();
  cap.holes.push(hole);
  const capNG = new THREE.ShapeGeometry(cap, 22).translate(SX, AY, -Z1);
  const shell = new THREE.Mesh(mergeGeometries([cylG.toNonIndexed(), capSG.toNonIndexed(), capNG.toNonIndexed()])!, woodMat);
  [cylG, capSG, capNG].forEach((q) => q.dispose());
  shell.castShadow = shell.receiveShadow = true;
  w.scene.add(shell);
  const bands = [Z0 + 0.5, Z1 - 0.5].map((z) => new THREE.TorusGeometry(R + 0.02, 0.035, 6, 28).translate(SX, AY, -z));
  const band = new THREE.Mesh(mergeGeometries(bands)!, w.material(new THREE.MeshLambertMaterial({ color: '#3b3b3b' })));
  bands.forEach((q) => q.dispose());
  band.userData.rooms = ['out', 'sauna'];
  w.scene.add(band);
  // cradle supports + floor
  for (const z of [Z0 + 0.6, Z1 - 0.6]) box(c.b, k.M.wood, '#7a5232', SX, 0, z, 3.2, 0.35, 0.3, { chunk: c.chunk });
  boxMM(c.b, k.M.wood, '#b07e4e', SX - 1.32, SX + 1.32, FY - 0.1, FY, Z0 + 0.05, Z1 - 0.05, { chunk: c.chunk, uv: 1 });
  w.col.addFloor(SX - 1.3, SX + 1.3, Z0 + 0.1, Z1 - 0.05, FY);
  // DEV-02 (v0.2 §3): flat landing (+0.80) in front of the door, then a 1.2 m ramp down to the deck (+0.15) at < 8 %
  const RP = SAUNA_RAMP;
  floor(c, RP.x0, RP.x1, RP.zDoor, RP.zTop, SAUNA_FLOOR, k.M.wood, '#8a5a33', SAUNA_FLOOR, true);
  w.col.addBox(RP.x0, RP.x1, RP.zDoor, RP.zTop, 0, SAUNA_FLOOR - 0.01); // solid under the landing
  const rl = RP.zFoot - RP.zTop, slope = Math.atan2(RP.yTop - RP.yFoot, rl);
  box(c.b, k.M.wood, '#9a6a3e', (RP.x0 + RP.x1) / 2, (RP.yTop + RP.yFoot) / 2 - 0.06, (RP.zTop + RP.zFoot) / 2, RP.x1 - RP.x0, 0.1, Math.hypot(rl, RP.yTop - RP.yFoot), { chunk: c.chunk, rx: -slope, uv: 1 });
  w.col.addRamp({ minX: RP.x0, maxX: RP.x1, minZ: RP.zTop, maxZ: RP.zFoot, axis: 'z', a: RP.zTop, ya: RP.yTop, b: RP.zFoot, yb: RP.yFoot });
  // handrails on both sides of ramp and landing (outside the 1.2 m width): no stepping on or off sideways
  for (const [x, side] of [[RP.x0, -1], [RP.x1, 1]] as const) {
    const f = x + side * 0.05;
    boxMM(c.b, k.M.wood, '#6b4426', f - 0.04, f + 0.04, SAUNA_FLOOR + 0.9, SAUNA_FLOOR + 0.96, RP.zDoor, RP.zTop, { chunk: c.chunk });
    box(c.b, k.M.wood, '#6b4426', f, (RP.yTop + RP.yFoot) / 2 + 0.9, (RP.zTop + RP.zFoot) / 2, 0.06, 0.06, Math.hypot(rl, RP.yTop - RP.yFoot), { chunk: c.chunk, rx: -slope });
    for (let z = RP.zDoor + 0.1; z <= RP.zFoot; z += 1.0) { const y = z < RP.zTop ? SAUNA_FLOOR : RP.yTop + ((RP.yFoot - RP.yTop) * (z - RP.zTop)) / rl; box(c.b, k.M.wood, '#6b4426', f, y - 0.6, z, 0.06, 1.5, 0.06, { chunk: c.chunk }); }
    w.col.addBox(side < 0 ? f - 0.1 : f - 0.04, side < 0 ? f + 0.04 : f + 0.1, RP.zDoor, RP.zFoot - 0.05, 0, SAUNA_FLOOR + 1.1, { tag: 'railing.saunaRamp' });
  }
  // colliders: curved walls approximated by boxes
  w.col.addBox(SX - R - 0.1, SX - 1.3, Z0, Z1, 0, 4.2, { occludes: true });
  w.col.addBox(SX + 1.3, SX + R + 0.1, Z0, Z1, 0, 4.2, { occludes: true });
  w.col.addBox(SX - R, SX + R, Z0 - 0.1, Z0 + 0.1, 0, 4.2, { occludes: true });
  w.col.addBox(SX - R, SX - 0.38, Z1 - 0.1, Z1 + 0.1, 0, 4.2, { occludes: true });
  w.col.addBox(SX + 0.38, SX + R, Z1 - 0.1, Z1 + 0.1, 0, 4.2, { occludes: true });
  w.col.addBox(SX - 0.38, SX + 0.38, Z1 - 0.1, Z1 + 0.1, FY + 1.8, 4.2, { occludes: true });
  // benches
  boxMM(c.b, k.M.wood, '#d4a46a', SX - 1.3, SX - 0.8, FY, FY + 0.45, Z0 + 0.8, Z1 - 0.3, { chunk: c.chunk, uv: 0.6 });
  boxMM(c.b, k.M.wood, '#d4a46a', SX + 0.8, SX + 1.3, FY, FY + 0.45, Z0 + 0.8, Z1 - 0.3, { chunk: c.chunk, uv: 0.6 });
  w.col.addBox(SX - 1.3, SX - 0.8, Z0 + 0.8, Z1 - 0.3, 0, FY + 0.5);
  w.col.addBox(SX + 0.8, SX + 1.3, Z0 + 0.8, Z1 - 0.3, 0, FY + 0.5);
  // heater with stones
  boxMM(c.b, k.M.paint, '#3b3b3b', SX - 0.45, SX + 0.45, FY, FY + 0.7, Z0 + 0.25, Z0 + 0.75, { chunk: c.chunk });
  w.col.addBox(SX - 0.5, SX + 0.5, Z0, Z0 + 0.8, 0, FY + 0.95);
  const stonesMat = w.material(new THREE.MeshLambertMaterial({ color: '#7a7570', emissive: new THREE.Color('#000000') }));
  const stones = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09 + (i % 3) * 0.02, 0), stonesMat);
    s.position.copy(v3(SX - 0.3 + (i % 3) * 0.3, FY + 0.76 + Math.floor(i / 3) * 0.04, Z0 + 0.25 + Math.floor(i / 3) * 0.15));
    stones.add(s);
  }
  w.scene.add(stones);
  // steam puffs
  const steamMat = w.material(new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.25, depthWrite: false }));
  const puffs: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), steamMat);
    w.scene.add(p);
    puffs.push(p);
  }
  const heaterOn = () => !!g.state.lit['sauna.heater'];
  w.onSync(() => {
    stonesMat.emissive.set(heaterOn() ? '#a8401a' : '#000000');
    for (const p of puffs) p.visible = heaterOn();
  });
  w.onUpdate((_dt, t0) => {
    if (!heaterOn()) return;
    const t = w.reducedMotion ? 0 : t0; // still steam column when motion is reduced
    puffs.forEach((p, i) => {
      const ph = (t * 0.35 + i / puffs.length) % 1;
      p.position.copy(v3(SX + Math.sin(i * 2 + t) * 0.2, FY + 0.9 + ph * 1.6, Z0 + 0.4 + Math.cos(i) * 0.1));
      p.scale.setScalar(0.6 + ph * 1.6);
      (p.material as THREE.MeshBasicMaterial).opacity = 0.25;
    });
    steamMat.opacity = 0.18;
  });
  w.lamps.push({ id: 'sauna.heater', pos: v3(SX, FY + 1.0, Z0 + 0.6), color: '#ff7a3a', intensity: 4, distance: 5, on: heaterOn, flicker: 0.1 });
  w.emitters.push({ kind: 'steam', pos: v3(SX, 1.2, Z0 + 0.5), on: heaterOn });
  const heaterHit = new THREE.Group();
  place(heaterHit, SX, FY, Z0 + 0.4);
  w.scene.add(heaterHit);
  makeAction(w, {
    id: 'sauna.heater', obj: heaterHit, hit: [1.0, 1.0, 0.6], hitOffset: [0, 0.5, 0],
    label: () => (heaterOn() ? 'Kachel uitzetten' : 'Kachel aanzetten'),
    run: () => {
      g.state.lit['sauna.heater'] = !heaterOn();
      g.sfx(heaterOn() ? 'steam' : 'switch');
      g.act({ ok: true, msg: heaterOn() ? 'De kachel tikt en de stenen beginnen te gloeien. Het ruikt naar hout.' : 'De kachel koelt langzaam af.', sfx: 'none' });
    },
  });
  // diagram board on the inside of the south end, above the heater
  const boardMat = w.material(new THREE.MeshLambertMaterial({ map: w.texture(saunaBoardTexture()) }));
  const board = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.0), boardMat);
  board.rotation.y = Math.PI; // face north (into the sauna)
  const bg = new THREE.Group();
  bg.add(board);
  bg.position.copy(v3(SX + 0.85, FY + 1.35, Z0 + 0.32));
  w.scene.add(bg);
  board.rotation.y = Math.PI;
  const boardHit = new THREE.Group();
  place(boardHit, SX + 0.85, FY + 0.85, Z0 + 0.35, 0);
  w.scene.add(boardHit);
  makeInspect(w, g, { id: 'inspect.saunaBoard', obj: boardHit, clue: 'c.saunaDiagram', hit: [0.9, 1.1, 0.3], hitOffset: [0, 0.5, 0], label: 'Bekijken: houten bord' });
  // small lamp
  staticLantern(c, w, SX - 0.85, FY + 1.5, Z0 + 0.45, 0.6, 0, 2.5, 5);
  // sauna door (glass), opens outward to the north
  makeDoor(w, g, { id: 'door.sauna', x: SX - 0.38, z: Z1 + 0.02, dir: 'x+', width: 0.76, height: 1.78, y0: FY, swing: 1, style: 'glass' });
  // a little bucket + ladle outside
  cyl(c.b, k.M.wood, '#a8743f', SX + 1.0, 0.15, Z1 + 0.6, 0.18, 0.15, 0.3, 10, { chunk: c.chunk });
  blob(c.b, k.M.paint, '#6a6560', SX - 1.3, 0.25, Z1 + 0.7, 0.25, 0.15, 0.2, { chunk: c.chunk });
  w.checkpoints.push({ name: 'sauna', pose: { x: SX - 1.8, y: 0.15, z: 112.4, yaw: Math.PI, pitch: 0 } });
  // the sauna shell is exterior skin: visible from outside AND inside whatever the door does (audit VD-03)
  shell.userData.rooms = ['out', 'sauna'];
}
