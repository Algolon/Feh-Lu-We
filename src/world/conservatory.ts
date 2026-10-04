// Glazed pool conservatory X 72–84, Z 64–82 (attached to the kitchen side of the manor).
// The swimming pool is INSIDE, with a dry walkable perimeter. The barrel sauna stands outside,
// immediately east (X 85–89, Z 69–73), enterable, with a controllable heater.
import * as THREE from 'three';
import type { World, GameApi } from '../interactions/world';
import { type Ctx, floor } from './arch';
import { Batcher, box, boxMM, cyl, blob, compound, v3, getKit } from './kit';
import { chair as _c, plant, part, staticLantern } from './furniture';
import { makeDoor, makePickup, makeInspect, makeAction, place } from '../interactions/props';
import { drawSymbol } from '../content/symbols';
import { addClue } from '../core/state';
import { GF } from './manor';
void _c;

const POOL = { x0: 74.5, x1: 81.5, z0: 67, z1: 79 };
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
  for (let i = 0; i < 4; i++) x.strokeRect(150, 64 + i * 46, 28, 28);
  x.font = 'italic 15px Georgia';
  x.fillText('Zoals de stoom opstijgt:', 128, 316 - 0);
  return new THREE.CanvasTexture(cv);
}

export function buildConservatory(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const X0 = 72, X1 = 84, Z0 = 64, Z1 = 82, H = 3.4;
  // floor around the pool (tiles), walkable everywhere; the pool itself is a solid boundary
  for (const [a, b2, cc, d] of [[X0, X1, Z0, POOL.z0], [X0, X1, POOL.z1, Z1], [X0, POOL.x0, POOL.z0, POOL.z1], [POOL.x1, X1, POOL.z0, POOL.z1]] as const) {
    floor(c, a, b2, cc, d, GF, k.M.tile, '#efe0c4', 0.6, false, 1.2);
  }
  w.col.addFloor(X0, X1, Z0, Z1, GF);
  w.col.addBox(POOL.x0, POOL.x1, POOL.z0, POOL.z1, -3, 2.5, { tag: 'pool' });
  // coping stones
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
  box(c.b, k.M.poolTile, '#dff4f6', 78, -1.55, 73, 7, 0.1, Math.hypot(len, 1), { chunk: c.chunk, uv: 1, rx: -tilt });
  // steps at the shallow (south) end
  for (let i = 0; i < 3; i++) boxMM(c.b, k.M.stone, '#f3ead6', 76.6, 79.4, -1.0, GF - 0.25 - i * 0.3, POOL.z0, POOL.z0 + 0.45 + i * 0.4, { chunk: c.chunk });
  for (const x of [76.5, 79.5]) cyl(c.b, k.M.paint, '#d8dde2', x, GF, POOL.z0 - 0.15, 0.03, 0.03, 1.0, 6, { chunk: c.chunk });
  // mosaic symbols on the pool floor (south → north): cirkel, driehoek, golf, ruit
  const order = ['cirkel', 'driehoek', 'golf', 'ruit'];
  order.forEach((s, i) => {
    const z = 69 + i * 3;
    const mat = w.material(new THREE.MeshLambertMaterial({ map: w.texture(mosaicTexture(s)) }));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), mat);
    m.rotation.order = 'YXZ';
    m.rotation.x = -Math.PI / 2 - tilt;
    m.position.copy(v3(78, poolDepth(z) + 0.02, z));
    w.scene.add(m);
  });
  // water
  const waterTex = k.T.water.clone();
  waterTex.needsUpdate = true;
  waterTex.repeat.set(2, 3);
  w.texture(waterTex);
  const waterMat = w.material(new THREE.MeshLambertMaterial({ color: '#4fd0dc', map: waterTex, transparent: true, opacity: 0.42, depthWrite: false, emissive: new THREE.Color('#0a3a44') }));
  const water = new THREE.Mesh(new THREE.PlaneGeometry(POOL.x1 - POOL.x0, POOL.z1 - POOL.z0), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.copy(v3(78, -0.06, 73));
  water.renderOrder = 2;
  w.scene.add(water);
  w.onUpdate((_dt, t) => { waterTex.offset.set(Math.sin(t * 0.2) * 0.05, t * 0.02); });
  w.emitters.push({ kind: 'water', pos: v3(78, 0, 73), on: () => true });
  // depth signs on the coping
  for (const [z, txt, rotY] of [[66.45, 'ONDIEP · 1,0 m', 0], [79.55, 'DIEP · 2,0 m', Math.PI]] as const) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.5), w.material(new THREE.MeshLambertMaterial({ map: w.texture(textTexture([txt])) })));
    m.rotation.order = 'YXZ';
    m.rotation.set(-Math.PI / 2, rotY, 0);
    m.position.copy(v3(78, GF + 0.012, z));
    w.scene.add(m);
  }
  // inspect: the pool (records the mosaic order)
  const poolHit = new THREE.Group();
  place(poolHit, 78, -0.1, 73);
  w.scene.add(poolHit);
  makeInspect(w, g, { id: 'inspect.pool', obj: poolHit, clue: 'c.poolTiles', hit: [7, 0.15, 12], hitOffset: [0, 0, 0], label: 'Bekijken: zwembad', reach: 3.2 });

  // ---------------------------------------------------------------- glass shell
  const glass = new Batcher();
  const fr = '#2f4a3c';
  const gw = (axis: 'x' | 'z', f: number, a0: number, a1: number, gaps: [number, number][] = []) => {
    // frame posts every ~2 m, glazing between, colliders with door gaps
    const n = Math.round((a1 - a0) / 2);
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      if (axis === 'x') box(c.b, k.M.paint, fr, a, 0, f, 0.1, H, 0.1, { chunk: c.chunk });
      else box(c.b, k.M.paint, fr, f, 0, a, 0.1, H, 0.1, { chunk: c.chunk });
    }
    for (const y of [0.0, 0.55, 2.4, H - 0.08]) {
      if (axis === 'x') boxMM(c.b, k.M.paint, fr, a0, a1, y, y + 0.08, f - 0.05, f + 0.05, { chunk: c.chunk });
      else boxMM(c.b, k.M.paint, fr, f - 0.05, f + 0.05, y, y + 0.08, a0, a1, { chunk: c.chunk });
    }
    let cur = a0;
    const segs: [number, number][] = [];
    for (const [s, e] of [...gaps].sort((p, q) => p[0] - q[0])) { segs.push([cur, s]); cur = e; }
    segs.push([cur, a1]);
    for (const [s, e] of segs) {
      if (e - s < 0.01) continue;
      if (axis === 'x') {
        boxMM(glass, k.M.glass, '#ffffff', s, e, 0.08, H - 0.08, f - 0.015, f + 0.015);
        w.col.addBox(s, e, f - 0.08, f + 0.08, 0, H, { occludes: true });
      } else {
        boxMM(glass, k.M.glass, '#ffffff', f - 0.015, f + 0.015, 0.08, H - 0.08, s, e);
        w.col.addBox(f - 0.08, f + 0.08, s, e, 0, H, { occludes: true });
      }
    }
  };
  gw('x', Z0, X0, X1);
  gw('x', Z1, X0, X1);
  gw('z', X1, Z0, Z1, [[74.85, 76.15]]);
  gw('z', X0, 80, Z1);
  // gabled glass roof, ridge along z
  const ridge = 5.6, half = (X1 - X0) / 2, slope = Math.atan((ridge - H) / half), rl = Math.hypot(half, ridge - H);
  for (const s of [-1, 1]) {
    box(glass, k.M.glass, '#ffffff', 78 + (s * half) / 2, H + (ridge - H) / 2 - 0.02, 73, rl, 0.03, Z1 - Z0, { rz: s * slope });
    for (let z = Z0; z <= Z1 + 0.01; z += 2) box(c.b, k.M.paint, fr, 78 + (s * half) / 2, H + (ridge - H) / 2 - 0.08, z, rl, 0.08, 0.08, { rz: s * slope, chunk: c.chunk });
  }
  // gable-end glass triangles
  for (const z of [Z0, Z1]) {
    const tri = new THREE.Shape();
    tri.moveTo(-half, 0); tri.lineTo(half, 0); tri.lineTo(0, ridge - H); tri.closePath();
    const tg = new THREE.ShapeGeometry(tri);
    glass.add(k.M.glass, tg, new THREE.Matrix4().makeTranslation(78, H, -z), '#ffffff', 'glass', false, 0);
    tg.dispose();
  }
  boxMM(c.b, k.M.paint, fr, X0, X1, H - 0.05, H + 0.05, Z0 - 0.05, Z0 + 0.05, { chunk: c.chunk });
  box(c.b, k.M.paint, fr, 78, ridge - 0.06, 73, 0.14, 0.14, Z1 - Z0, { chunk: c.chunk });
  const glassMeshes = glass.build(w.scene, false);
  for (const m of glassMeshes) { m.renderOrder = 3; m.castShadow = false; }

  makeDoor(w, g, { id: 'door.conservatoryEast', x: X1, z: 74.85, dir: 'z+', width: 1.3, height: 2.35, y0: GF, swing: 1, style: 'glass' });
  floor(c, 84, 85.4, 74.6, 76.4, 0.08, k.M.stone, '#d9ccb0', 0.2, true);

  // ---------------------------------------------------------------- furnishings
  const lounger = (x: number, z: number, yaw: number, towel: string) => {
    part(c, k.M.wood, '#a8743f', x, z, yaw, 0, GF, 0, 0.7, 0.3, 1.9, 1);
    part(c, k.M.paint, '#f2ead8', x, z, yaw, 0, GF + 0.3, 0.1, 0.62, 0.08, 1.4);
    part(c, k.M.paint, '#f2ead8', x, z, yaw, 0, GF + 0.36, -0.75, 0.62, 0.5, 0.2);
    part(c, k.M.paint, towel, x, z, yaw, 0, GF + 0.38, 0.3, 0.5, 0.04, 0.5);
    w.col.addBoxC(x, z, 0.75, 1.95, 0, 0.6);
  };
  lounger(73.1, 70, 0, '#6fae9a');
  lounger(73.1, 76.5, 0, '#e0a060');
  lounger(82.9, 70.5, Math.PI, '#9aa8d8');
  for (const [x, z, s] of [[72.7, 79.3, 1.6], [83.3, 80.9, 1.8], [83.3, 64.8, 1.5], [75.5, 81.2, 1.3], [80.5, 81.2, 1.4], [73.6, 64.9, 1.4]] as const) plant(c, x, z, GF, s, '#c9774a');
  // small table with folded towels
  cyl(c.b, k.M.wood, '#a8743f', 83.0, GF, 73.0, 0.35, 0.35, 0.5, 12, { chunk: c.chunk });
  for (let i = 0; i < 3; i++) box(c.b, k.M.paint, ['#6fae9a', '#f2ead8', '#9aa8d8'][i], 83.0, GF + 0.5 + i * 0.07, 73.0, 0.4, 0.07, 0.3, { chunk: c.chunk });
  w.col.addCircle(83, 73, 0.4, 0, 0.8);
  for (const [x, z] of [[75, 66], [81, 66], [75, 80], [81, 80]] as const) {
    staticLantern(c, w, x, 2.6, z, 1.0, 0, 3.5, 7);
    box(c.b, k.M.paint, '#2b2622', x, 3.0, z, 0.02, 0.4, 0.02, { chunk: c.chunk });
  }

  // ---------------------------------------------------------------- the cabinet (beats 5 + 6)
  const cbz = 66.2;
  boxMM(c.b, k.M.wood, '#5f3f26', 72.2, 72.75, GF, GF + 0.05, cbz - 0.62, cbz + 0.62, { chunk: c.chunk });
  boxMM(c.b, k.M.wood, '#5f3f26', 72.2, 72.75, GF + 2.05, GF + 2.2, cbz - 0.65, cbz + 0.65, { chunk: c.chunk });
  for (const s of [-1, 1]) boxMM(c.b, k.M.wood, '#5f3f26', 72.2, 72.75, GF, GF + 2.05, cbz + s * 0.6 - 0.04, cbz + s * 0.6 + 0.04, { chunk: c.chunk });
  boxMM(c.b, k.M.wood, '#5f3f26', 72.2, 72.75, GF + 0.9, GF + 0.96, cbz - 0.6, cbz + 0.6, { chunk: c.chunk });
  boxMM(c.b, k.M.wood, '#4a2f1a', 72.2, 72.25, GF, GF + 2.05, cbz - 0.6, cbz + 0.6, { chunk: c.chunk });
  boxMM(c.b, k.M.wood, '#5f3f26', 72.2, 72.7, GF + 1.45, GF + 1.48, cbz - 0.56, cbz + 0.56, { chunk: c.chunk });
  w.col.addBox(72.2, 72.8, cbz - 0.66, cbz + 0.66, 0, 2.4);
  // panel tiles on the cornice (shapes paired with colours)
  const tileMat = w.material(new THREE.MeshLambertMaterial({ map: w.texture((() => {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
    const x = cv.getContext('2d')!; x.fillStyle = '#c9a44c'; x.fillRect(0, 0, 256, 64);
    ['driehoek', 'cirkel', 'ruit', 'golf'].forEach((s, i) => drawSymbol(x, s, 8 + i * 62, 6, 52));
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  })()) }));
  const tiles = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.25), tileMat);
  tiles.position.copy(v3(72.77, GF + 2.12, cbz));
  tiles.rotation.y = Math.PI / 2;
  w.scene.add(tiles);
  const lower = makeDoor(w, g, { id: 'cab.lower', x: 72.78, z: cbz - 0.56, dir: 'z+', width: 1.12, height: 0.84, y0: GF + 0.05, swing: -1, color: '#7a5232', unlock: 'lock.cabinetLower', thickness: 0.04 });
  const upper = makeDoor(w, g, { id: 'cab.upper', x: 72.78, z: cbz - 0.56, dir: 'z+', width: 1.12, height: 1.08, y0: GF + 0.96, swing: -1, style: 'glass', unlock: 'lock.cabinetUpper', thickness: 0.04 });
  void lower; void upper;
  const lowIt = w.byId.get('cab.lower')!, upIt = w.byId.get('cab.upper')!;
  const lowRun = lowIt.run, upRun = upIt.run;
  lowIt.label = () => (g.state.unlocked.includes('lock.cabinetLower') ? (g.state.open['cab.lower'] ? 'Sluiten' : 'Openen') : 'Onderkast');
  lowIt.run = () => {
    if (g.state.unlocked.includes('lock.cabinetLower')) return lowRun();
    addClue(g.state, 'c.cabinet');
    g.act({ ok: false, msg: 'De onderkast zit dicht en heeft geen sleutelgat. Een dun draadje loopt van de kast door de vloer naar buiten, de tuin in.', sfx: 'locked' });
  };
  upIt.label = () => (g.state.unlocked.includes('lock.cabinetUpper') ? (g.state.open['cab.upper'] ? 'Sluiten' : 'Openen') : 'Paneel bekijken');
  upIt.run = () => {
    if (g.state.unlocked.includes('lock.cabinetUpper')) return upRun();
    if (addClue(g.state, 'c.cabinet')) g.changed();
    g.openPanel('cabinetPanel');
  };
  // crank inside the lower compartment
  const crank = compound((b) => {
    box(b, k.M.paint, '#3b3b3b', 0, 0, 0, 0.04, 0.04, 0.5);
    box(b, k.M.paint, '#3b3b3b', 0, 0, 0.25, 0.04, 0.3, 0.04);
    cyl(b, k.M.wood, '#8a5a33', 0.0, 0.3, 0.25, 0.03, 0.03, 0.16, 6, { rz: Math.PI / 2 });
  });
  place(crank, 72.5, GF + 0.1, cbz, 0.2);
  w.scene.add(crank);
  makePickup(w, g, { id: 'pk.crank', item: 'crank', obj: crank, available: () => !!g.state.open['cab.lower'], hit: [0.4, 0.4, 0.6] });
  // crest + well note in the upper display
  const crest = compound((b) => {
    box(b, k.M.paint, '#c0504d', 0, 0, 0, 0.03, 0.26, 0.2);
    box(b, k.M.paint, '#f2e6c8', 0.016, 0.06, 0, 0.005, 0.16, 0.03);
    box(b, k.M.paint, '#f2e6c8', 0.016, 0.12, 0, 0.005, 0.03, 0.14);
  });
  place(crest, 72.5, GF + 1.5, cbz - 0.2, 0);
  w.scene.add(crest);
  makePickup(w, g, { id: 'pk.crest', item: 'crest', obj: crest, available: () => !!g.state.open['cab.upper'], hit: [0.3, 0.35, 0.35] });
  const wellNote = compound((b) => box(b, k.M.paint, '#f5eedc', 0, 0, 0, 0.2, 0.005, 0.26));
  place(wellNote, 72.5, GF + 1.0, cbz + 0.25, 0.3);
  w.scene.add(wellNote);
  makeAction(w, {
    id: 'inspect.wellNote', obj: wellNote, hit: [0.35, 0.15, 0.4],
    label: () => (g.state.open['cab.upper'] ? 'Lezen: aanwijzing' : null),
    run: () => g.inspect('c.wellNote'),
  });

  // ---------------------------------------------------------------- barrel sauna (outside, east)
  buildSauna(w, g, c);

  w.checkpoints.push({ name: 'conservatory', pose: { x: 76, y: GF, z: 65.5, yaw: Math.PI / 2, pitch: -0.2 } });
}

function buildSauna(w: World, g: GameApi, c: Ctx) {
  const k = getKit();
  const SX = 87, R = 1.9, Z0 = 69, Z1 = 73, AY = 0.25 + R; // barrel axis height
  const FY = 0.8; // raised floor so the curved walls leave a comfortable width
  const woodMat = w.material(new THREE.MeshLambertMaterial({ map: k.T.wood, color: '#c48a52', side: THREE.DoubleSide }));
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, Z1 - Z0, 22, 1, true), woodMat);
  shell.rotation.x = Math.PI / 2;
  shell.position.copy(v3(SX, AY, (Z0 + Z1) / 2));
  shell.castShadow = shell.receiveShadow = true;
  w.scene.add(shell);
  const capS = new THREE.Mesh(new THREE.CircleGeometry(R, 22), woodMat);
  capS.position.copy(v3(SX, AY, Z0));
  w.scene.add(capS);
  const cap = new THREE.Shape();
  cap.absarc(0, 0, R, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  const dh0 = FY - AY, dh1 = FY + 1.8 - AY;
  hole.moveTo(-0.38, dh0); hole.lineTo(0.38, dh0); hole.lineTo(0.38, dh1); hole.lineTo(-0.38, dh1); hole.closePath();
  cap.holes.push(hole);
  const capN = new THREE.Mesh(new THREE.ShapeGeometry(cap, 22), woodMat);
  capN.position.copy(v3(SX, AY, Z1));
  w.scene.add(capN);
  for (const z of [Z0 + 0.5, Z1 - 0.5]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(R + 0.02, 0.035, 6, 28), w.material(new THREE.MeshLambertMaterial({ color: '#3b3b3b' })));
    band.position.copy(v3(SX, AY, z));
    w.scene.add(band);
  }
  // cradle supports + floor
  for (const z of [Z0 + 0.6, Z1 - 0.6]) box(c.b, k.M.wood, '#7a5232', SX, 0, z, 3.2, 0.35, 0.3, { chunk: c.chunk });
  boxMM(c.b, k.M.wood, '#b07e4e', SX - 1.32, SX + 1.32, FY - 0.1, FY, Z0 + 0.05, Z1 - 0.05, { chunk: c.chunk, uv: 1 });
  w.col.addFloor(SX - 1.3, SX + 1.3, Z0 + 0.1, Z1 - 0.05, FY);
  floor(c, SX - 0.6, SX + 0.6, Z1, Z1 + 0.45, 0.53, k.M.wood, '#8a5a33', 0.53, true);
  floor(c, SX - 0.6, SX + 0.6, Z1 + 0.45, Z1 + 0.9, 0.27, k.M.wood, '#8a5a33', 0.27, true);
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
  w.onUpdate((_dt, t) => {
    if (!heaterOn()) return;
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
  cyl(c.b, k.M.wood, '#a8743f', SX + 1.0, 0, Z1 + 0.6, 0.18, 0.15, 0.3, 10, { chunk: c.chunk });
  blob(c.b, k.M.paint, '#6a6560', SX - 1.3, 0.1, Z1 + 0.7, 0.25, 0.15, 0.2, { chunk: c.chunk });
  w.checkpoints.push({ name: 'sauna', pose: { x: SX, y: 0, z: Z1 + 1.8, yaw: Math.PI, pitch: 0 } });
}
