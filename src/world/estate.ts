// The estate: 120 × 100 units (1 unit ≈ 1 m). X east, Z north, Y up. Front gate on the south edge.
// Southern half (Z 0–50): forest. Northern half: manor, conservatory, sauna, cottage and an open garden.
import * as THREE from 'three';
import { World, type GameApi } from '../interactions/world';
import type { SceneExtras } from '../core/game';
import { makeCtx, floor } from './arch';
import { Batcher, box, boxMM, cyl, blob, getKit, v3 } from './kit';
import { table, chair, lantern, part, plant, staticLantern } from './furniture';
import { Vegetation, scatter, distToPolyline, ribbon, smooth } from './nature';
import { buildManor } from './manor';
import { buildConservatory } from './conservatory';
import { buildCottage } from './cottage';
import { buildForest, FOREST_PATHS, DRIVEWAY, SITES } from './forest';
import { addEnvironment } from './env';
import { makeLamp, makeAction, makeDoor } from '../interactions/props';
import { pressLantern } from '../puzzles/rules';
import { addClue } from '../core/state';
import { drawSymbol, SYMBOLS } from '../content/symbols';
import { mulberry32 } from '../core/rng';

export const GARDEN_PATH: [number, number][] = smooth([[51.2, 82.6], [45, 84.4], [38, 85.6], [31.5, 86.6], [26, 85.3]]);
export const LANTERNS = [
  { sym: 'zon', x: 43, z: 90 },
  { sym: 'maan', x: 57.5, z: 94 },
  { sym: 'blad', x: 72.5, z: 90 },
];

const inRect = (x: number, z: number, x0: number, x1: number, z0: number, z1: number) => x >= x0 && x <= x1 && z >= z0 && z <= z1;

export function buildEstate(g: GameApi): { world: World; extras: SceneExtras } {
  const w = new World('estate');
  w.ambience = 'estate';
  const env = addEnvironment(w);
  const veg = new Vegetation(7);
  const ground = makeCtx(w.col, 'ground');
  const manorC = makeCtx(w.col, 'manor');
  const consC = makeCtx(w.col, 'cons');
  const cotC = makeCtx(w.col, 'cottage');
  const forestC = makeCtx(w.col, 'forest');
  const gardenC = makeCtx(w.col, 'garden');

  buildGround(w);
  buildPaths(w, ground);
  buildBoundary(w, g, ground, veg);
  buildManor(w, g, manorC);
  buildConservatory(w, g, consC);
  buildCottage(w, g, cotC);
  buildForest(w, g, forestC, veg);
  buildGarden(w, g, gardenC, veg);

  for (const c of [ground, manorC, consC, cotC, forestC, gardenC]) c.b.build(w.scene);
  veg.build(w.scene, true);
  const nearRect = (x0: number, x1: number, z0: number, z1: number, m: number) => (x: number, z: number) => x > x0 - m && x < x1 + m && z > z0 - m && z < z1 + m;
  // interiors (and the props inside them) are hidden when the player is outside and away
  w.cullZone('manorIn', nearRect(48, 72, 52, 80, 12), nearRect(48.3, 71.7, 52.3, 79.7, 0));
  w.cullZone('cottageIn', nearRect(20, 30, 88, 96, 10), nearRect(20.2, 29.8, 88.2, 95.8, 0));

  w.spawn = { x: 60, y: 0, z: 3, yaw: 0, pitch: 0.02 };
  w.checkpoints.push({ name: 'garden', pose: { x: 58, y: 0.08, z: 87, yaw: Math.PI, pitch: 0 } });

  const isIndoor = (x: number, z: number) =>
    inRect(x, z, 48, 72, 52, 80) || inRect(x, z, 72, 84, 64, 82) || inRect(x, z, 20, 30, 88, 96) || inRect(x, z, 25.5, 30.5, 24.5, 28) || inRect(x, z, 85, 89, 69, 73);
  const surfaceAt = (x: number, z: number): 'grass' | 'wood' | 'stone' => {
    if (inRect(x, z, 56, 64, 52, 72) || inRect(x, z, 64, 84, 64, 82) || inRect(x, z, 51.5, 67.5, 80, 85.5)) return 'stone';
    if (isIndoor(x, z)) return 'wood';
    if (Math.abs(x - 60) < 2.2 && z < 46) return 'stone';
    if (Math.hypot(x - 60, z - 47) < 7.5) return 'stone';
    return 'grass';
  };
  return { world: w, extras: { env, isIndoor, surfaceAt } };
}

// ---------------------------------------------------------------------------------------------
function buildGround(w: World) {
  const k = getKit();
  const r = mulberry32(3);
  const CW = 2, NX = 60, NZ = 50;
  const pos: number[] = [], uv: number[] = [], col: number[] = [];
  const forest = new THREE.Color('#6f8c43'), garden = new THREE.Color('#9cc05e'), moss = new THREE.Color('#5d7a38'), dirt = new THREE.Color('#9a8456');
  const noise = new Float32Array((NX + 1) * (NZ + 1)).map(() => r());
  const colorAt = (x: number, z: number, i: number) => {
    const t = THREE.MathUtils.smoothstep(z, 46, 54);
    const c = moss.clone().lerp(forest, noise[i]).lerp(garden, t);
    let dp = Infinity;
    for (const p of FOREST_PATHS) dp = Math.min(dp, distToPolyline(x, z, p));
    if (dp < 3) c.lerp(dirt, (1 - dp / 3) * 0.35);
    return c;
  };
  const vcol: THREE.Color[] = [];
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) vcol.push(colorAt(i * CW, j * CW, j * (NX + 1) + i));
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const x0 = i * CW, z0 = j * CW, x1 = x0 + CW, z1 = z0 + CW;
    if (x0 >= 72 && x1 <= 84 && z0 >= 64 && z1 <= 82) continue; // conservatory pool basin cut-out
    const quad: [number, number, number][] = [[x0, z0, j * (NX + 1) + i], [x1, z0, j * (NX + 1) + i + 1], [x1, z1, (j + 1) * (NX + 1) + i + 1], [x0, z1, (j + 1) * (NX + 1) + i]];
    for (const idx of [0, 1, 2, 0, 2, 3]) {
      const [x, z, vi] = quad[idx];
      pos.push(x, 0, -z);
      uv.push(x / 5, z / 5);
      const c = vcol[vi];
      col.push(c.r, c.g, c.b);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const n = geo.attributes.normal;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  const mesh = new THREE.Mesh(geo, k.M.grass);
  mesh.receiveShadow = true;
  mesh.userData.noCull = true;
  w.scene.add(mesh);
  // the land beyond the estate + distant hills
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), w.material(new THREE.MeshLambertMaterial({ color: '#5f7d3a' })));
  outer.rotation.x = -Math.PI / 2;
  outer.position.set(60, -0.04, -50);
  outer.userData.noCull = true;
  w.scene.add(outer);
  const hills = new Batcher();
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + r() * 0.2;
    const d = 200 + r() * 40;
    blob(hills, k.M.paint, i % 2 ? '#5f7f58' : '#6f8a5c', 60 + Math.cos(a) * d, -8, 50 + Math.sin(a) * d, 50 + r() * 30, 22 + r() * 18, 40, { shadow: false, chunk: 'hills' });
  }
  hills.build(w.scene, false);
}

function buildPaths(w: World, c: ReturnType<typeof makeCtx>) {
  const k = c.k;
  const add = (pts: readonly (readonly [number, number])[], width: number, color: string) => {
    const g = ribbon(pts, width, 0.025);
    c.b.add(k.M.dirt, g, new THREE.Matrix4(), color, 'paths', false, 0);
    g.dispose();
  };
  add(smooth(DRIVEWAY, 2), 4.2, '#d8c3a0');
  for (const p of FOREST_PATHS) add(p, 1.9, '#c8ad80');
  add(GARDEN_PATH, 1.5, '#e2d2b0');
  const disc = new THREE.CircleGeometry(7.6, 32);
  disc.rotateX(-Math.PI / 2);
  c.b.add(k.M.dirt, disc, new THREE.Matrix4().makeTranslation(60, 0.03, -47.5), '#d8c3a0', 'paths', false, 0);
  disc.dispose();
  // central planter on the forecourt
  cyl(c.b, k.M.stone, '#d8ccb0', 60, 0, 47.5, 1.8, 1.9, 0.45, 18, { chunk: 'ground', uv: 1 });
  cyl(c.b, k.M.paint, '#6a5040', 60, 0.45, 47.5, 1.6, 1.6, 0.02, 18, { chunk: 'ground' });
  w.col.addCircle(60, 47.5, 1.9, 0, 0.8);
}

function buildBoundary(w: World, g: GameApi, c: ReturnType<typeof makeCtx>, veg: Vegetation) {
  const k = c.k;
  // south: stone wall with the front gate
  for (const [a, b2] of [[0, 57.6], [62.4, 120]] as const) {
    boxMM(c.b, k.M.stone, '#cbbf9f', a, b2, 0, 1.3, 0.05, 0.55, { chunk: 'wall', uv: 2 });
    boxMM(c.b, k.M.stone, '#b8ac8c', a, b2, 1.3, 1.42, -0.02, 0.62, { chunk: 'wall', uv: 2 });
    w.col.addBox(a, b2, 0, 0.6, 0, 2);
  }
  for (const x of [57.3, 62.7]) {
    box(c.b, k.M.stone, '#d8ccb0', x, 0, 0.3, 0.7, 2.6, 0.7, { chunk: 'wall', uv: 1 });
    box(c.b, k.M.stone, '#c8bca0', x, 2.6, 0.3, 0.85, 0.15, 0.85, { chunk: 'wall' });
    staticLantern(c, w, x, 2.75, 0.3, 0.8, 0, 3, 7);
  }
  // front gate leaves stand closed behind you (the way in, not the way on)
  makeDoor(w, g, { id: 'gate.front', x: 57.65, z: 0.3, dir: 'x+', width: 2.35, height: 1.9, y0: 0, swing: -1, style: 'gate', unlock: 'never', lockedMsg: 'Het hek is achter je dichtgevallen. Het weekend ligt de andere kant op.' });
  makeDoor(w, g, { id: 'gate.front2', x: 62.35, z: 0.3, dir: 'x-', width: 2.35, height: 1.9, y0: 0, swing: 1, style: 'gate', unlock: 'never', lockedMsg: 'Het hek is achter je dichtgevallen. Het weekend ligt de andere kant op.' });
  // fence on the other three sides (the estate bounds also clamp movement)
  const fence = (x0: number, z0: number, x1: number, z1: number) => {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(len / 2.5);
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, z = z0 + ((z1 - z0) * i) / n;
      box(c.b, k.M.wood, '#6b4a2a', x, 0, z, 0.14, 1.2, 0.14, { chunk: 'fence' });
    }
    for (const y of [0.45, 0.95]) {
      if (x0 === x1) boxMM(c.b, k.M.wood, '#7a5a3a', x0 - 0.04, x0 + 0.04, y, y + 0.1, Math.min(z0, z1), Math.max(z0, z1), { chunk: 'fence' });
      else boxMM(c.b, k.M.wood, '#7a5a3a', Math.min(x0, x1), Math.max(x0, x1), y, y + 0.1, z0 - 0.04, z0 + 0.04, { chunk: 'fence' });
    }
  };
  fence(0.2, 0.6, 0.2, 99.8);
  fence(119.8, 0.6, 119.8, 99.8);
  fence(0.2, 99.8, 119.8, 99.8);
  // woodland continues beyond the fence (visual only): low-poly crowns
  const r = mulberry32(77);
  const outside = scatter(r, -16, 136, -16, 116, 5.2, 5000, (x, z) => x < -0.8 || x > 120.8 || z < -1.5 || z > 100.8);
  for (const [x, z] of outside) {
    const kind = r() < 0.2 ? 'pine' : 'oak';
    veg.tree({ x, z, h: kind === 'pine' ? 6 + r() * 3 : 3.5 + r() * 2.5, r: 1.8 + r() * 1.0, kind, hue: r() - 0.5 }, `outer${x < 0 ? 'W' : x > 120 ? 'E' : z < 0 ? 'S' : 'N'}`);
  }
}

function buildGarden(w: World, g: GameApi, c: ReturnType<typeof makeCtx>, veg: Vegetation) {
  const k = c.k;
  const r = mulberry32(19);
  // dining terrace behind the manor
  floor(c, 51.5, 67.5, 80, 85.5, 0.08, k.M.stone, '#e2d6bc', 0.3, true, 1.5);
  table(c, 58, 83, 0.08, 6.0, 1.1, 0, '#8a6a4a');
  for (let i = 0; i < 6; i++) {
    chair(c, 55.5 + i, 82.0, 0.08, 0, '#8a6a4a');
    chair(c, 55.5 + i, 84.0, 0.08, Math.PI, '#8a6a4a');
  }
  for (const x of [56, 60]) {
    const l = lantern(w, x, 0.84, 83, 0.5);
    makeLamp(w, g, { id: `lamp.terrace.${x}`, ...l, name: 'tafellantaarn', defaultOn: true, intensity: 3, distance: 6, hit: [0.3, 0.4, 0.3] });
  }
  for (const [x, z] of [[52, 80.6], [64, 80.6], [52.2, 85], [66.8, 85]] as const) plant(c, x, z, 0.08, 1.2, '#c9774a');
  staticLantern(c, w, 67.6, 2.2, 80.25, 0.7, 0, 3, 7);

  // three lantern posts on the open lawn — beat 5
  for (const L of LANTERNS) {
    box(c.b, k.M.stone, '#e2d6bc', L.x, 0, L.z, 0.55, 1.15, 0.55, { chunk: c.chunk, uv: 1 });
    box(c.b, k.M.stone, '#d0c4a8', L.x, 1.15, L.z, 0.65, 0.08, 0.65, { chunk: c.chunk });
    w.col.addBox(L.x - 0.3, L.x + 0.3, L.z - 0.3, L.z + 0.3, 0, 1.3);
    const lm = lantern(w, L.x, 1.23, L.z, 1.25, 0);
    // symbol cut-outs on all four sides (shape + colour)
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const x = cv.getContext('2d')!;
    x.fillStyle = '#2b2622'; x.fillRect(0, 0, 64, 64);
    drawSymbol(x, L.sym, 8, 8, 48, { color: '#fff3c8', ink: '#2b2622' });
    const t = w.texture(new THREE.CanvasTexture(cv));
    t.colorSpace = THREE.SRGBColorSpace;
    const symMat = w.material(new THREE.MeshBasicMaterial({ map: t, color: '#6a6050' }));
    for (let s = 0; s < 4; s++) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), symMat);
      const a = (s * Math.PI) / 2;
      p.position.set(Math.sin(a) * 0.165, 0.29, Math.cos(a) * 0.165);
      p.rotation.y = a;
      lm.obj.add(p);
    }
    const isLit = () => !!g.state.flags.lanternsSolved || (g.state.seq.gardenLanterns ?? []).includes(L.sym);
    w.lamps.push({ id: `garden.${L.sym}`, pos: lm.light, color: '#ffcf7a', intensity: 6, distance: 9, on: isLit });
    w.onSync(() => {
      const on = isLit();
      for (const m of lm.glow) m.color.set(on ? '#ffd27a' : '#4a443c');
      symMat.color.set(on ? '#ffffff' : '#6a6050');
    });
    makeAction(w, {
      id: `garden.lantern.${L.sym}`, obj: lm.obj, hit: [0.7, 0.9, 0.7], hitOffset: [0, 0.3, 0], reach: 2.8,
      label: () => (isLit() ? null : `Aansteken: ${SYMBOLS[L.sym].name.toLowerCase()}`),
      run: () => {
        addClue(g.state, 'c.lanterns');
        const { result, outcome } = pressLantern(g.state, L.sym);
        if (result === 'solved') g.state.open['cab.lower'] = true;
        g.act(outcome);
      },
    });
  }

  // a few scattered trees + cypresses (the lawn stays open)
  const oaks: [number, number][] = [[40, 66], [36, 79], [12, 70], [8, 88], [100, 61], [110, 78], [97, 92], [84, 96], [48, 97.5], [14, 56], [92, 54], [106, 96], [4, 60], [116, 58]];
  for (const [x, z] of oaks) {
    veg.tree({ x, z, h: 4 + r() * 1.5, r: 2.4 + r() * 0.8, kind: 'oak', hue: r() - 0.5 }, 'garden');
    w.col.addCircle(x, z, 0.4, 0, 6);
  }
  for (const [x, z] of [[46.6, 53.8], [46.6, 57.6], [46.6, 75.5], [46.6, 79.4], [86.4, 63], [86.4, 82.5], [18.6, 88.6], [31.4, 96.6], [70, 50.5], [50, 50.5]] as const) {
    veg.tree({ x, z, h: 5.5 + r() * 1.5, r: 0.75, kind: 'cypress', hue: r() - 0.5 }, 'garden');
    w.col.addCircle(x, z, 0.35, 0, 6);
  }
  for (const [x, z] of [[8, 96], [116, 88], [104, 70]] as const) {
    veg.tree({ x, z, h: 5, r: 1.6, kind: 'birch', hue: 0 }, 'garden');
    w.col.addCircle(x, z, 0.25, 0, 6);
  }
  // flower patches and low shrubs (no collision)
  const patch = (cx: number, cz: number, rad: number, n: number, colors: string[]) => {
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * rad;
      veg.smallThing('flower', cx + Math.cos(a) * d, cz + Math.sin(a) * d, 0.12 + r() * 0.08, colors[Math.floor(r() * colors.length)], 'garden');
    }
  };
  const purple = ['#b89ad8', '#9a7ac8', '#f2f0e6', '#e8a8c8'];
  for (let z = 54; z < 79; z += 3) patch(47, z, 0.9, 6, purple);
  for (const L of LANTERNS) patch(L.x, L.z, 1.4, 10, purple);
  patch(36, 88, 1.2, 10, purple);
  patch(18.6, 92, 1.4, 10, ['#f2c6d8', '#f2f0e6', '#e8c547']);
  patch(70, 86, 1.5, 12, purple);
  patch(50, 86.5, 1.5, 12, purple);
  const clearOf = (x: number, z: number) => !inRect(x, z, 45, 90, 49, 86) && !inRect(x, z, 17, 41, 83, 98) && !LANTERNS.some((l) => Math.hypot(x - l.x, z - l.z) < 2) && distToPolyline(x, z, GARDEN_PATH) > 1.4;
  for (const [x, z] of scatter(r, 2, 118, 51, 99, 4.5, 900, clearOf)) {
    if (r() < 0.6) veg.smallThing('flower', x, z, 0.14, purple[Math.floor(r() * 4)], 'garden');
    else veg.smallThing('shrub', x, z, 0.4 + r() * 0.3, '#5a8a3e', 'garden');
  }
  // forecourt planter: a small clipped tree and flowers
  veg.tree({ x: 60, z: 47.5, h: 2.0, r: 1.0, kind: 'oak', hue: 0.2 }, 'garden');
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2, d = 0.9 + (i % 3) * 0.2;
    veg.smallThing(i % 4 === 0 ? 'shrub' : 'flower', 60 + Math.cos(a) * d, 47.5 + Math.sin(a) * d, i % 4 === 0 ? 0.35 : 0.14, i % 4 === 0 ? '#4f7f38' : purple[i % 4], 'garden', 0.46);
  }
  // hedges along the manor front
  for (let x = 48.5; x < 71.5; x += 1.1) if (Math.abs(x - 60) > 2.6) veg.smallThing('shrub', x, 51.2, 0.55, '#4a7a36', 'garden');
  void part; void cyl;
}

/** Overview map for the notebook/pause menu (plan view, north up). */
export function estateMapSvg(): string {
  const S = 3.2; // px per unit
  const X = (x: number) => (x * S).toFixed(1), Z = (z: number) => ((100 - z) * S).toFixed(1);
  const line = (pts: readonly (readonly [number, number])[], wdt: number, col: string) => `<polyline points="${pts.map(([x, z]) => `${X(x)},${Z(z)}`).join(' ')}" fill="none" stroke="${col}" stroke-width="${wdt}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const rect = (x0: number, z0: number, x1: number, z1: number, fill: string, label = '') =>
    `<rect x="${X(x0)}" y="${Z(z1)}" width="${((x1 - x0) * S).toFixed(1)}" height="${((z1 - z0) * S).toFixed(1)}" fill="${fill}" stroke="#3a2a1a" stroke-width="1.5"/>` +
    (label ? `<text x="${X((x0 + x1) / 2)}" y="${Z((z0 + z1) / 2)}" font-size="11" text-anchor="middle" dominant-baseline="middle">${label}</text>` : '');
  const dot = (x: number, z: number, label: string) => `<circle cx="${X(x)}" cy="${Z(z)}" r="5" fill="#c4553d" stroke="#2b2118"/><text x="${X(x)}" y="${(+Z(z) - 8).toFixed(1)}" font-size="11" text-anchor="middle">${label}</text>`;
  return `<svg class="diagram" viewBox="0 0 ${120 * S} ${100 * S}" width="${120 * S}" role="img" aria-label="Plattegrond van het landgoed">
  <rect width="${120 * S}" height="${100 * S}" fill="#a9c47a"/>
  <rect y="${Z(50)}" width="${120 * S}" height="${50 * S}" fill="#6f8c4a"/>
  <text x="${X(8)}" y="${Z(46)}" font-size="12" fill="#fff">bos</text><text x="${X(8)}" y="${Z(97)}" font-size="12">tuin</text>
  ${line(smooth(DRIVEWAY, 2), 9, '#e2d2b0')}${FOREST_PATHS.map((p) => line(p, 4, '#d9c49a')).join('')}${line(GARDEN_PATH, 4, '#efe4cc')}
  ${rect(48, 52, 72, 80, '#efe2c4', 'landhuis')}${rect(72, 64, 84, 82, '#cfe8e4', 'serre')}${rect(85, 69, 89, 73, '#c48a52', '')}
  <text x="${X(90)}" y="${Z(68)}" font-size="10">sauna</text>
  ${rect(20, 88, 30, 96, '#fbf6ec', 'huisje')}<ellipse cx="${X(36)}" cy="${Z(92)}" rx="${3.2 * S}" ry="${2.6 * S}" fill="#2f6f78"/>
  ${rect(25.5, 24.5, 30.5, 28, '#8a5a33', '')}
  ${dot(SITES.shed.x, SITES.shed.z - 4, 'schuur')}${dot(SITES.fire.x, SITES.fire.z, 'vuurplaats')}${dot(SITES.well.x, SITES.well.z, 'put')}${dot(SITES.gate.x, SITES.gate.z, 'oud hek')}
  ${LANTERNS.map((l) => `<circle cx="${X(l.x)}" cy="${Z(l.z)}" r="4" fill="#f3c45a" stroke="#2b2118"/>`).join('')}
  <text x="${X(58)}" y="${Z(88)}" font-size="10" text-anchor="middle">terras · lantaarns</text>
  <text x="${X(60)}" y="${Z(2.5)}" font-size="11" text-anchor="middle">hek</text>
  <g transform="translate(${120 * S - 26},26)" font-size="11" font-weight="bold" text-anchor="middle"><line x1="0" y1="-14" x2="0" y2="14" stroke="#2b2118" stroke-width="2"/><path d="M-5 -8 L0 -16 L5 -8 Z"/><text y="-19">N</text></g>
</svg>`;
}

void v3;
