// BOSLUST: a door in the south face of the wooded hill (X 63, Z 18.2), reached through a stone-walled cut.
// Behind the cipher-locked door a stair descends into the hill (no teleport): entry cellar → rooted
// passage with three route plates and a lever → the gathering room (the finale). A long old tunnel runs
// north from the gathering room to the manor basement; it is bolted on the tunnel side, so it becomes a
// two-way shortcut only after the finale and can never bypass either gate.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { World, GameApi } from '../interactions/world';
import { type Ctx, wall, floor, ceiling, stairsZ } from './arch';
import { box, boxMM, cyl, blob, compound, v3 } from './kit';
import { table, chair, chandelier, part, staticLantern, canvasPanel, bookshelf } from './furniture';
import { makeDoor, makeAction, makeInspect, makeLamp, place } from '../interactions/props';
import { makeFire } from './fire';
import { buildHearth } from './hearth';
import { Vegetation } from './nature';
import { drawSymbol } from '../content/symbols';
import { CIPHER, PLATES, NOTCH_DIRS } from '../content/canon';
import { addClue } from '../core/state';
import { openCipherCover, plateRotations, turnPlate, pullPlateLever } from '../puzzles/rules';
import { HILL_CUT, UG, UGCEIL, BF } from './layout';
import { HUT, gridHeight, hillHeight } from './terrain';
import { Batcher } from './kit';
import { ART } from '../core/artflags';
import { cutRocks, entranceV2 } from './boslustSample';

const DOOR_X = 63, DOOR_Z = 18.2;

export function buildBoslust(w: World, g: GameApi, c: Ctx, u: Ctx, veg: Vegetation) {
  cut(w, c, veg);
  entrance(w, g, c, u);
  underground(w, g, u);
  w.checkpoints.push(
    { name: 'boslust', pose: { x: DOOR_X, y: 0, z: 13.5, yaw: 0, pitch: 0 } },
    { name: 'gathering', pose: { x: 63, y: UG, z: 47.5, yaw: 0, pitch: 0 } },
  );
}

// ---------------------------------------------------------------------------------------------
/** The flat cut in the hill's south face: dry-stone retaining walls that grow taller towards the door. */
function cut(w: World, c0: Ctx, veg: Vegetation) {
  // art sample: the same colliders, but the stone-block visuals go to a batcher that is never built (rock instead)
  const sample = ART.ext === 'sample';
  const c: Ctx = sample ? { ...c0, b: new Batcher() } : c0;
  const k = c.k;
  const { x0, x1, z0, z1 } = HILL_CUT;
  for (const [xa, xb, xs] of [[x0 - 0.6, x0, x0 - 0.6], [x1, x1 + 0.6, x1 + 0.6]] as const) {
    for (let z = z0 + 4; z < z1 + 0.01; z += 1) { // walls start north of the southern loop path
      const za = z, zb = Math.min(z1 + 0.2, z + 1);
      const top = Math.max(0.45, gridHeight(xs, za), gridHeight(xs, zb), hillHeight((xa + xb) / 2, zb)) + 0.15;
      boxMM(c.b, k.M.stone, z % 2 ? '#a89e88' : '#b4aa92', xa, xb, -0.1, top, za, zb, { chunk: c.chunk, uv: 1 });
      blob(c.b, k.M.paint, '#5f8a3e', (xa + xb) / 2, top, (za + zb) / 2, 0.42, 0.12, 0.55, { chunk: c.chunk });
      w.col.addBox(xa, xb, za, zb, -0.1, top + 0.1);
    }
  }
  // gravel floor of the cut and a few ferns along the wall feet
  boxMM(c0.b, k.M.dirt, sample ? '#958a76' : '#bfae8a', x0, x1, -0.05, 0.02, z0, z1, { chunk: c.chunk, shadow: false });
  if (sample) cutRocks(c0);
  for (let z = z0 + 4.8; z < z1 - 0.5; z += 1.7) {
    veg.smallThing('fern', x0 + 0.35, z, 0.42, '#6a9a3e', 'forest');
    veg.smallThing('fern', x1 - 0.35, z + 0.8, 0.38, '#557f34', 'forest');
  }
}

// ---------------------------------------------------------------------------------------------
/** Stone headwall with the door, the BOSLUST sign, the engraved inscription, the cipher lock and the hut. */
function entrance(w: World, g: GameApi, c0: Ctx, u: Ctx) {
  // art sample: the headwall keeps its collider (wall() on a discarded batcher); its visuals come from entranceV2
  const sample = ART.ext === 'sample';
  const c: Ctx = sample ? { ...c0, b: new Batcher() } : c0;
  const k = c.k;
  const stone = { mat: k.M.stone, color: '#c2b8a0', uv: 2 };
  wall(c, 'x', DOOR_Z, 59.4, 66.6, 0, 3.6, { ...stone, t: 0.4, openings: [{ at: DOOR_X, w: 1.2, h: 2.3 }] });
  if (sample) entranceV2(w, c0);
  boxMM(c.b, k.M.stone, '#d0c6ae', 59.3, 66.7, 3.6, 3.75, 17.95, 18.45, { chunk: c.chunk, uv: 1 });
  // timber frame + roots draping over the parapet
  for (const x of [61.95, 64.05]) box(c.b, k.M.wood, '#5a3a22', x, 0, 17.92, 0.22, 2.55, 0.18, { chunk: c.chunk, uv: 1 });
  box(c.b, k.M.wood, '#5a3a22', DOOR_X, 2.45, 17.92, 2.5, 0.22, 0.2, { chunk: c.chunk, uv: 1 });
  for (let i = 0; i < 9; i++) {
    const x = 59.8 + i * 0.85;
    const len = 0.6 + ((i * 37) % 7) * 0.12;
    cyl(c.b, k.M.bark, '#6b4a32', x, 3.65 - len, 17.86, 0.035, 0.05, len, 5, { chunk: c.chunk, rz: ((i % 3) - 1) * 0.15 });
    blob(c.b, k.M.paint, '#5f8a3e', x + 0.2, 3.75, 18.15, 0.45, 0.16, 0.35, { chunk: c.chunk });
  }
  // the sign: exactly "BOSLUST"
  canvasPanel(w, DOOR_X, 3.15, 17.93, Math.PI, 1.7, 0.46, (x, W, H) => {
    x.fillStyle = '#6b4a2a'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#3a2614'; x.lineWidth = 8; x.strokeRect(4, 4, W - 8, H - 8);
    x.fillStyle = '#f2e2b8'; x.font = `bold ${Math.round(H * 0.62)}px Georgia`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('BOSLUST', W / 2, H / 2 + 4);
  }, 512, sample ? null : '#3a2614'); // sample: the oak board behind it is the frame
  // engraved stone tablet left of the door (the inscription)
  canvasPanel(w, 60.75, 1.55, 17.97, Math.PI, 1.1, 0.62, (x, W, H) => {
    x.fillStyle = '#b8ae96'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(80,70,50,${0.05 + (i % 5) * 0.02})`; x.fillRect((i * 53) % W, (i * 31) % H, 18, 6); }
    x.fillStyle = '#3a3226'; x.font = `bold ${Math.round(H * 0.22)}px Georgia`; x.textAlign = 'center';
    const [a, b2, cc, d] = CIPHER.cipher.split(' ');
    x.fillText(`${a} ${b2}`, W / 2, H * 0.42);
    x.fillText(`${cc} ${d}`, W / 2, H * 0.78);
  }, 256, sample ? null : '#8a8270'); // sample: a stone surround in the batch is the frame
  const tab = new THREE.Group();
  place(tab, 60.75, 1.2, 17.9, 0);
  w.scene.add(tab);
  makeInspect(w, g, { id: 'inspect.boslust', obj: tab, clue: 'c.boslust', hit: [1.2, 0.8, 0.3], hitOffset: [0, 0.35, 0], label: 'Bekijken: gravure' });
  // the cipher lock right of the door: four wheels under a cover with a narrow slot
  const lock = new THREE.Group();
  place(lock, 64.85, 1.2, 17.94, 0);
  w.scene.add(lock);
  lock.add(compound((b) => {
    box(b, k.M.paint, '#6b5a3a', 0, -0.2, 0.02, 0.5, 0.42, 0.06);
    for (let i = 0; i < 4; i++) cyl(b, k.M.paint, '#c9a44c', -0.15 + i * 0.1, -0.02, -0.02, 0.04, 0.04, 0.05, 10, { rz: Math.PI / 2 });
  }));
  const cover = new THREE.Group();
  cover.position.set(0, 0.2, -0.04);
  cover.add(compound((b) => { box(b, k.M.paint, '#8a6a3a', 0, -0.38, 0, 0.46, 0.36, 0.03); box(b, k.M.paint, '#2a1f16', 0, -0.12, -0.016, 0.3, 0.025, 0.005); }));
  lock.add(cover);
  w.onSync(() => { cover.rotation.x = g.state.flags.boslustCover ? 1.9 : 0; });
  makeAction(w, {
    id: 'boslust.lock', obj: lock, hit: [0.6, 0.6, 0.3], hitOffset: [0, 0, 0],
    label: () => (g.state.flags.boslustOpen ? null : g.state.flags.boslustCover ? 'Cijferwieltjes' : 'Klepje bekijken'),
    run: () => {
      if (g.state.flags.boslustCover) { g.openPanel('boslust'); return; }
      const r = openCipherCover(g.state);
      g.act(r);
      if (r.ok) g.openPanel('boslust');
    },
  });
  makeDoor(w, g, {
    id: 'door.boslust', x: DOOR_X - 0.6, z: DOOR_Z, dir: 'x+', width: 1.2, height: 2.3, y0: 0, swing: 1, color: '#5a3a22', style: 'plank',
    unlock: 'lock.boslust', lockedMsg: 'De deur zit op slot. Naast de deur zit een slot met cijferwieltjes.',
  });
  // the hut: a short timber vestibule inside the mound, then the stair goes down into the hill
  const U = u.k;
  floor(u, HUT.x0 + 0.3, HUT.x1 - 0.3, DOOR_Z + 0.2, 20, 0, U.M.wood, '#6b4a2a', 0.15, true, 1.2);
  for (const [xa, xb] of [[HUT.x0, HUT.x0 + 0.3], [HUT.x1 - 0.3, HUT.x1]] as const) {
    boxMM(u.b, U.M.wood, '#5a3a22', xa, xb, 0, HUT.roof, DOOR_Z + 0.2, HUT.z1, { chunk: u.chunk, uv: 1.2 });
    u.col.addBox(xa, xb, DOOR_Z + 0.2, HUT.z1, 0, HUT.roof, { occludes: true });
  }
  for (const [xa, xb] of [[HUT.x0 + 0.3, 61.7], [64.3, HUT.x1 - 0.3]] as const) {
    boxMM(u.b, U.M.stone, '#8a8270', xa, xb, -3.6, HUT.roof, 20, HUT.z1, { chunk: u.chunk, uv: 1.5 });
    u.col.addBox(xa, xb, 20, HUT.z1, -3.6, HUT.roof, { occludes: true });
  }
  boxMM(u.b, U.M.wood, '#4a3020', HUT.x0, HUT.x1, 2.6, HUT.roof, DOOR_Z + 0.2, HUT.z1, { chunk: u.chunk, uv: 1.2, shadow: false });
  for (let x = HUT.x0 + 0.6; x < HUT.x1; x += 1.1) box(u.b, U.M.wood, '#5a3a22', x, 2.42, (DOOR_Z + HUT.z1) / 2, 0.14, 0.18, HUT.z1 - DOOR_Z - 0.2, { chunk: u.chunk, uv: 1 });
  part(u, U.M.wood, '#6b4426', HUT.x0 + 0.6, 19.2, Math.PI / 2, 0, 0, 0, 1.2, 0.45, 0.4, 1);
  u.col.addBox(HUT.x0 + 0.3, HUT.x0 + 0.85, 18.6, 19.8, 0, 0.5);
  for (let i = 0; i < 3; i++) cyl(u.b, U.M.paint, '#6b4426', HUT.x1 - 0.35, 1.6, 18.8 + i * 0.35, 0.02, 0.02, 0.14, 5, { chunk: u.chunk, rz: Math.PI / 2 });
  staticLantern(u, w, 63, 2.05, 19.4, 0.55, 0, 2.5, 5);
  // the descent: a real stair down into the hill, walls of stone, ceiling stepping down with it
  stairsZ(u, 61.7, 64.3, 26, 20, UG, 0, '#6b5a44', undefined, { mass: '#8a7e6a', runner: false, riser: '#7a6e5c' });
  for (const xs of [61.55, 64.45]) {
    boxMM(u.b, U.M.stone, '#9a9078', xs - 0.15, xs + 0.15, UG - 0.2, 2.6, HUT.z1, 26, { chunk: u.chunk, uv: 1.5 });
    u.col.addBox(xs - 0.15, xs + 0.15, HUT.z1, 26, UG - 0.2, 2.6, { occludes: true });
  }
  for (let z = 20; z < 26; z += 0.5) {
    const y = -((z + 0.5 - 20) / 6) * (0 - UG) + 2.55;
    boxMM(u.b, U.M.stone, '#8a8270', 61.4, 64.6, Math.min(y, 2.6), Math.min(y, 2.6) + 0.3, z, z + 0.5, { chunk: u.chunk, uv: 1, shadow: false });
  }
  for (let z = 21.5; z < 26; z += 1.5) cyl(u.b, U.M.bark, '#6b4a32', 63, -((z - 20) / 6) * (0 - UG) + 2.3, z, 0.05, 0.05, 2.8, 5, { chunk: u.chunk, rz: Math.PI / 2 });
  staticLantern(u, w, 64.15, -1.2, 23.2, 0.5, 0, 2.5, 5);
}

// ---------------------------------------------------------------------------------------------
function underground(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const st = { t: 0.3, mat: k.M.stone, color: '#9a9078', uv: 2 };
  const roots = (x0: number, x1: number, z0: number, z1: number, n: number, seed: number) => {
    for (let i = 0; i < n; i++) {
      const t = ((i * 0.618 + seed) % 1), along = x1 - x0 > z1 - z0;
      const x = along ? x0 + t * (x1 - x0) : x0 + ((i * 0.37 + seed) % 1) * (x1 - x0);
      const z = along ? z0 + ((i * 0.37 + seed) % 1) * (z1 - z0) : z0 + t * (z1 - z0);
      cyl(c.b, k.M.bark, i % 2 ? '#6b4a32' : '#7a5a3a', x, UGCEIL - 0.9 - (i % 3) * 0.3, z, 0.03, 0.07, 0.9 + (i % 3) * 0.3, 5, { chunk: c.chunk, rz: ((i % 5) - 2) * 0.12, shadow: false });
    }
  };
  // ---------------------------------------------------------------- entry cellar (58–68 × 26–33)
  floor(c, 58, 68, 26, 33, UG, k.M.tile, '#9a8e78', 0.2, true, 1.4);
  ceiling(c, 58, 68, 26, 33, UGCEIL, '#7a705e');
  wall(c, 'x', 26, 58, 68, UG, UGCEIL + 0.2, { ...st, openings: [{ at: 63, w: 2.6, h: 2.85 }] });
  wall(c, 'x', 33, 58, 68, UG, UGCEIL + 0.2, { ...st, openings: [{ at: 63, w: 2.4, h: 2.6 }] });
  wall(c, 'z', 58, 26, 33, UG, UGCEIL + 0.2, st);
  wall(c, 'z', 68, 26, 33, UG, UGCEIL + 0.2, st);
  for (const x of [59, 67]) for (const z of [27, 32]) cyl(c.b, k.M.wood, '#5a3a22', x, UG, z, 0.16, 0.18, UGCEIL - UG, 8, { chunk: c.chunk });
  for (let x = 58.8; x < 68; x += 1.6) box(c.b, k.M.wood, '#5a3a22', x, UGCEIL - 0.25, 29.5, 0.18, 0.25, 7, { chunk: c.chunk, uv: 1 });
  roots(58.5, 67.5, 26.5, 32.5, 14, 0.2);
  for (const [x, z] of [[59.2, 30], [66.8, 28]] as const) { box(c.b, k.M.wood, '#7a5232', x, UG, z, 0.7, 0.6, 1.4, { chunk: c.chunk }); c.col.addBox(x - 0.35, x + 0.35, z - 0.7, z + 0.7, UG, UG + 0.65); }
  bookshelf(c, 66.8, 31.4, UG, -Math.PI / 2, 1.6, 2.0, 'linen', 0.3);
  staticLantern(c, w, 60.5, UGCEIL - 0.6, 29.5, 0.6, 0, 3, 7);
  staticLantern(c, w, 65.5, UGCEIL - 0.6, 29.5, 0.6, 0, 3, 7);
  // ---------------------------------------------------------------- rooted passage (61–65 × 33–45) with the route plates
  floor(c, 61, 65, 33, 45, UG, k.M.tile, '#8e826c', 0.2, true, 1.4);
  ceiling(c, 61, 65, 33, 45, UGCEIL, '#6e6452');
  wall(c, 'z', 61, 33, 45, UG, UGCEIL + 0.2, st);
  wall(c, 'z', 65, 33, 45, UG, UGCEIL + 0.2, st);
  wall(c, 'x', 45, 55, 71, UG, UGCEIL + 0.2, { ...st, openings: [{ at: 63, w: 1.4, h: 2.3 }] });
  roots(61.3, 64.7, 33.3, 44.7, 22, 0.55);
  for (let z = 34; z < 45; z += 2.2) { cyl(c.b, k.M.bark, '#5a3a22', 61.25, UG, z, 0.12, 0.2, UGCEIL - UG, 6, { chunk: c.chunk }); cyl(c.b, k.M.bark, '#5a3a22', 64.75, UG, z + 1.1, 0.12, 0.2, UGCEIL - UG, 6, { chunk: c.chunk }); }
  staticLantern(c, w, 61.6, UG + 1.9, 36.0, 0.5, 0, 2.5, 6);
  staticLantern(c, w, 61.6, UG + 1.9, 42.6, 0.5, 0, 2.5, 6);
  plates(w, g, c);
  makeDoor(w, g, {
    id: 'door.gathering', x: 62.3, z: 45, dir: 'x+', width: 1.4, height: 2.3, y0: UG, swing: 1, color: '#5a3520',
    unlock: 'lock.gathering', lockedMsg: 'Een zware deur zonder klink of sleutelgat. Ernaast: drie draaibare platen en een hendel.',
  });
  gathering(w, g, c);
  tunnel(w, g, c);
}

/** Wall drawing + three rotatable route plates + lever (east wall of the passage, seen facing east). */
function plates(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const WX = 64.84;
  // facing east, the viewer's right is south: left → right = north → south
  const PZ = [41.6, 39.8, 38.0];
  const PY = UG + 1.45, R = 0.42;
  canvasPanel(w, WX, UG + 1.6, 35.2, -Math.PI / 2, 1.8, 1.25, (x, W, H) => drawPlateDiagram(x, W, H), 768, '#4a3a2a');
  const dg = new THREE.Group(); place(dg, WX - 0.05, UG + 1.0, 35.2, 0); w.scene.add(dg);
  makeInspect(w, g, { id: 'inspect.plateDiagram', obj: dg, clue: 'c.plateDiagram', hit: [0.3, 1.3, 1.9], hitOffset: [0, 0.6, 0], label: 'Bekijken: tekening' });
  const faces: THREE.Group[] = [];
  const spin = [0, 0, 0];
  PLATES.forEach((p, i) => {
    const holder = new THREE.Group();
    holder.position.copy(v3(WX, PY, PZ[i]));
    w.scene.add(holder);
    holder.add(compound((b) => cyl(b, k.M.stone, '#7a705e', 0.05, -0.05, 0, R + 0.08, R + 0.08, 0.1, 20, { rz: Math.PI / 2 })));
    const face = new THREE.Group();
    holder.add(face);
    face.add(compound((b) => cyl(b, k.M.paint, '#b8733f', -0.02, -0.04, 0, R, R, 0.08, 20, { rz: Math.PI / 2 })));
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const x = cv.getContext('2d')!;
    x.fillStyle = '#c98a4e'; x.beginPath(); x.arc(64, 64, 62, 0, Math.PI * 2); x.fill();
    drawSymbol(x, p.motif, 24, 24, 80, { color: '#e8c08a', ink: '#3a1e0a' });
    const t = w.texture(new THREE.CanvasTexture(cv)); t.colorSpace = THREE.SRGBColorSpace;
    const disc = new THREE.Mesh(new THREE.CircleGeometry(R * 0.92, 24), w.material(new THREE.MeshLambertMaterial({ map: t })));
    disc.rotation.y = -Math.PI / 2; // faces west, towards the viewer; texture right = viewer's right
    disc.position.x = -0.065;
    face.add(disc);
    const notch = compound((b) => box(b, k.M.paint, '#f3d27a', 0, R - 0.12, 0, 0.1, 0.16, 0.1));
    notch.position.x = -0.04;
    face.add(notch);
    faces.push(face);
    makeAction(w, {
      id: `plate.${p.id}`, obj: holder, hit: [0.25, R * 2.2, R * 2.2], hitOffset: [0, -R * 1.1, 0], reach: 2.4,
      label: () => (g.state.flags.platesSolved ? null : `Draaien: ${p.name}`),
      run: () => { addClue(g.state, 'c.plateDiagram'); const r = turnPlate(g.state, i); spin[i] = g.reducedMotion ? 0 : Math.PI / 2; g.act(r); },
    });
  });
  w.onSync(() => { const rot = plateRotations(g.state); faces.forEach((f, i) => { f.userData.target = rot[i]; }); });
  w.onUpdate((dt) => {
    faces.forEach((f, i) => {
      if (spin[i] > 0) spin[i] = Math.max(0, spin[i] - dt * 7);
      f.rotation.x = ((f.userData.target as number) ?? 0) * (Math.PI / 2) - spin[i];
    });
  });
  // glowing channel that joins the plates once they line up
  const glowMat = w.material(new THREE.MeshBasicMaterial({ color: '#ffcf6a' }));
  const channel = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, PZ[0] - PZ[2]), glowMat);
  channel.position.copy(v3(WX - 0.03, PY - R - 0.12, (PZ[0] + PZ[2]) / 2));
  w.scene.add(channel);
  w.onSync(() => { channel.visible = !!g.state.flags.platesSolved; });
  w.lamps.push({ id: 'plates.glow', pos: v3(63.4, UG + 1.4, 39.8), color: '#ffcf6a', intensity: 3, distance: 6, on: () => !!g.state.flags.platesSolved });
  // the lever
  const lever = new THREE.Group();
  lever.position.copy(v3(WX, UG + 1.1, 36.6));
  w.scene.add(lever);
  lever.add(compound((b) => box(b, k.M.paint, '#3a3530', 0.02, -0.15, 0, 0.08, 0.3, 0.22)));
  const arm = new THREE.Group();
  lever.add(arm);
  arm.add(compound((b) => { box(b, k.M.paint, '#5a5048', -0.06, 0, 0, 0.04, 0.5, 0.04); blob(b, k.M.paint, '#8a2f1a', -0.06, 0.52, 0, 0.06); }));
  let pull = 0;
  w.onSync(() => { arm.rotation.z = g.state.flags.platesSolved ? -0.9 : 0; });
  w.onUpdate((dt) => { if (pull > 0) { pull = Math.max(0, pull - dt * 2); if (!g.state.flags.platesSolved) arm.rotation.z = -0.9 * Math.sin(pull * Math.PI); } });
  makeAction(w, {
    id: 'plates.lever', obj: lever, hit: [0.3, 0.8, 0.4], hitOffset: [0, 0.1, 0], reach: 2.4,
    label: () => (g.state.flags.platesSolved ? null : 'Hendel overhalen'),
    run: () => { pull = g.reducedMotion ? 0 : 1; g.act(pullPlateLever(g.state)); },
  });
}

function drawPlateDiagram(x: CanvasRenderingContext2D, W: number, H: number) {
  x.fillStyle = '#e8dcbc'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#7fa04a'; x.fillRect(12, 12, W - 24, H * 0.16);
  x.strokeStyle = '#6b4a32'; x.lineWidth = 5;
  for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(30 + i * (W - 60) / 8, 12 + H * 0.16); x.quadraticCurveTo(40 + i * (W - 60) / 8, H * 0.3, 20 + i * (W - 60) / 8, H * 0.36); x.stroke(); }
  x.fillStyle = '#9a9078'; x.fillRect(12, H * 0.4, W - 24, H * 0.42);
  x.strokeStyle = '#3a2a1a'; x.lineWidth = 4; x.strokeRect(12, 12, W - 24, H - 24);
  x.fillStyle = '#3a2a1a'; x.font = `bold ${Math.round(H * 0.07)}px Georgia`; x.textAlign = 'center';
  x.fillText('Zo loopt de gang door', W / 2, H * 0.12 + 10);
  const dirs: Record<string, [number, number]> = { boven: [0, -1], rechts: [1, 0], onder: [0, 1], links: [-1, 0] };
  PLATES.forEach((p, i) => {
    const cx = W * (0.2 + i * 0.3), cy = H * 0.61, r = H * 0.15;
    x.fillStyle = '#c98a4e'; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#3a1e0a'; x.lineWidth = 3; x.stroke();
    drawSymbol(x, p.motif, cx - r * 0.62, cy - r * 0.62, r * 1.24, { color: '#e8c08a', ink: '#3a1e0a' });
    const [dx, dy] = dirs[p.notch];
    x.fillStyle = '#f3d27a'; x.strokeStyle = '#3a1e0a'; x.lineWidth = 2;
    x.beginPath(); x.rect(cx + dx * r * 0.88 - 10, cy + dy * r * 0.88 - 10, 20, 20); x.fill(); x.stroke();
    x.fillStyle = '#3a2a1a'; x.font = `${Math.round(H * 0.06)}px Georgia`;
    x.fillText(p.name, cx, H * 0.93);
  });
  void NOTCH_DIRS;
}

// ---------------------------------------------------------------------------------------------
/** The gathering room under the hill: the table is laid, the hearth and candles burn. The finale. */
function gathering(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const X0 = 55, X1 = 71, Z0 = 45, Z1 = 57;
  floor(c, X0, X1, Z0, Z1, UG, k.M.wood, '#9a6a3e', 0.2, true, 2.2);
  ceiling(c, X0, X1, Z0, Z1, UGCEIL, '#e8dcc0');
  const warm = { t: 0.3, mat: k.M.plaster, color: '#efe2c4', uv: 2 };
  wall(c, 'x', Z1, X0, X1, UG, UGCEIL + 0.2, { ...warm, openings: [{ at: 63, w: 1.4, h: 2.3 }] });
  wall(c, 'z', X0, Z0, Z1, UG, UGCEIL + 0.2, warm);
  wall(c, 'z', X1, Z0, Z1, UG, UGCEIL + 0.2, warm);
  for (let x = X0 + 1; x < X1; x += 1.8) box(c.b, k.M.wood, '#5a3a22', x, UGCEIL - 0.28, (Z0 + Z1) / 2, 0.2, 0.28, Z1 - Z0, { chunk: c.chunk, uv: 1 });
  for (const x of [X0 + 0.3, X1 - 0.3]) for (const z of [Z0 + 0.3, Z1 - 0.3]) cyl(c.b, k.M.wood, '#5a3a22', x, UG, z, 0.18, 0.2, UGCEIL - UG, 8, { chunk: c.chunk });
  // the long table, laid for everyone
  const TX = 63.5, TZ = 51;
  table(c, TX, TZ, UG, 6.2, 1.5, 0, '#7a4a28');
  for (let i = 0; i < 6; i++) {
    const x = TX - 2.5 + i;
    chair(c, x, TZ - 1.1, UG, 0, '#c4553d');
    chair(c, x, TZ + 1.1, UG, Math.PI, '#c4553d');
    for (const s of [-1, 1]) {
      cyl(c.b, k.M.paint, '#f5f0e6', x, UG + 0.76, TZ + s * 0.45, 0.13, 0.13, 0.015, 14, { chunk: c.chunk });
      cyl(c.b, k.M.paint, '#e8d8c0', x + 0.22, UG + 0.76, TZ + s * 0.38, 0.035, 0.03, 0.08, 8, { chunk: c.chunk });
    }
  }
  blob(c.b, k.M.paint, '#d9a441', TX - 1.2, UG + 0.85, TZ, 0.28, 0.1, 0.12, { chunk: c.chunk });
  blob(c.b, k.M.paint, '#f0d070', TX + 0.9, UG + 0.82, TZ, 0.16, 0.07, 0.16, { chunk: c.chunk });
  cyl(c.b, k.M.paint, '#7a2a30', TX + 0.2, UG + 0.76, TZ - 0.1, 0.06, 0.06, 0.3, 8, { chunk: c.chunk });
  for (const dx of [-2, 0, 2]) {
    cyl(c.b, k.M.paint, '#c9a44c', TX + dx, UG + 0.76, TZ + 0.05, 0.06, 0.07, 0.02, 10, { chunk: c.chunk });
    cyl(c.b, k.M.paint, '#efe6c8', TX + dx, UG + 0.78, TZ + 0.05, 0.03, 0.03, 0.22, 8, { chunk: c.chunk });
  }
  makeFire(w, { kind: 'candles', x: TX, y: UG + 1.01, z: TZ + 0.05, wicks: [[-2, 0, 0], [0, 0, 0], [2, 0, 0]] });
  w.lamps.push({ id: 'candles.gathering', pos: v3(TX, UG + 1.4, TZ), color: '#ffc06a', intensity: 5, distance: 8, on: () => true, flicker: 0.15 });
  w.patches.add(TX, UG + 0.8, TZ, 2.2, '#ffb35a', () => true, 0.3);
  const ch = chandelier(w, TX, UGCEIL, TZ, 0.8, 0.9);
  const sw = compound((b) => box(b, k.M.paint, '#c9a44c', 0, 0, 0, 0.12, 0.18, 0.03));
  place(sw, 64.6, UG + 1.35, Z0 + 0.17, 0);
  w.scene.add(sw);
  makeLamp(w, g, { id: 'lamp.gathering', obj: sw, glow: ch.glow, light: ch.light, flames: ch.flames, name: 'kroonluchter', defaultOn: true, intensity: 7, distance: 11, hit: [0.3, 0.4, 0.3], hitOffset: [0, 0.05, 0], patch: { y: UG + 0.03, r: 2.6 } });
  // hearth on the west wall
  buildHearth(w, g, c, { id: 'fire.gathering', x: X0, z: TZ, y: UG, facing: Math.PI / 2, ceil: UGCEIL, defaultLit: true });
  // bunting of little lights
  const bulbMat = w.material(new THREE.MeshBasicMaterial({ color: '#ffd27a' }));
  const bulbs = Array.from({ length: 14 }, (_, i) => new THREE.SphereGeometry(0.05, 6, 4).translate(X0 + 1.2 + i, UGCEIL - 0.35 - Math.sin((i / 13) * Math.PI) * 0.35, -TZ));
  w.scene.add(new THREE.Mesh(mergeGeometries(bulbs)!, bulbMat)); // one draw call for the whole string
  bulbs.forEach((b) => b.dispose());
  // shelf of keepsakes (east wall) — fictional objects with empty labels
  boxMM(c.b, k.M.wood, '#6b4426', X1 - 0.45, X1 - 0.15, UG, UG + 1.9, TZ - 1.2, TZ + 1.2, { chunk: c.chunk, uv: 1 });
  for (const y of [0.7, 1.3]) boxMM(c.b, k.M.wood, '#7a5232', X1 - 0.5, X1 - 0.15, UG + y, UG + y + 0.04, TZ - 1.2, TZ + 1.2, { chunk: c.chunk, uv: 1 });
  c.col.addBox(X1 - 0.5, X1, TZ - 1.25, TZ + 1.25, UG, UG + 2);
  const keeps = compound((b) => {
    box(b, k.M.paint, '#2b2622', 0, 0.74, -0.7, 0.2, 0.3, 0.2); // a broken lantern
    blob(b, k.M.glow, '#a08a5a', 0, 0.9, -0.7, 0.07, 0.1, 0.07);
    box(b, k.M.paint, '#f5f0e6', 0, 0.74, 0, 0.14, 0.05, 0.2); // a deck of cards
    box(b, k.M.paint, '#c4553d', 0, 0.79, 0.02, 0.1, 0.004, 0.06);
    blob(b, k.M.paint, '#8a8580', 0, 0.8, 0.65, 0.12, 0.08, 0.1); // a heart-shaped stone
    for (const z of [-0.7, 0, 0.65]) box(b, k.M.paint, '#f2e8d2', -0.1, 1.34, z, 0.005, 0.07, 0.12);
  });
  place(keeps, X1 - 0.32, UG, TZ, 0);
  w.scene.add(keeps);
  makeInspect(w, g, { id: 'mem.gathering.keepsakes', obj: keeps, clue: 'mem.gathering.keepsakes', hit: [0.5, 1.0, 2.4], hitOffset: [0, 1.0, 0], label: 'Bekijken: aandenkens' });
  // the final letter on the table
  const letter = compound((b) => { box(b, k.M.paint, '#f5eedc', 0, 0, 0, 0.26, 0.006, 0.34); box(b, k.M.paint, '#8a2f1a', 0, 0.006, -0.12, 0.05, 0.01, 0.05); });
  place(letter, TX - 0.4, UG + 0.77, TZ - 0.3, 0.15);
  w.scene.add(letter);
  makeAction(w, {
    id: 'finale.letter', obj: letter, hit: [0.45, 0.25, 0.5], reach: 2.6,
    label: () => (g.state.finished ? 'Lezen: brief' : 'Lezen: brief op tafel'),
    run: () => {
      if (g.state.finished) { g.inspect('c.finalLetter'); return; }
      addClue(g.state, 'c.finalLetter');
      g.changed();
      g.finish();
    },
  });
  for (const [x, z] of [[X0 + 1.2, Z1 - 1.0], [X1 - 1.2, Z1 - 1.0], [X0 + 1.2, Z0 + 1.0]] as const) staticLantern(c, w, x, UG, z, 0.9, 0, 2.5, 6);
}

/** The old tunnel to the manor basement (61.9–64.1 × 57–98, then east along Z 95.9–98.1). */
function tunnel(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const st = { t: 0.3, mat: k.M.stone, color: '#8a826c', uv: 2 };
  const TOPY = -0.85;
  makeDoor(w, g, { id: 'door.tunnelGathering', x: 62.3, z: 57, dir: 'x+', width: 1.4, height: 2.3, y0: UG, swing: -1, color: '#5a3520', style: 'plank' });
  // a short ramp from the gathering-room level up to the basement level
  boxMM(c.b, k.M.tile, '#8a806a', 61.9, 64.1, UG - 0.2, UG, 57, 62, { chunk: c.chunk, uv: 1.4 });
  for (let i = 0; i < 5; i++) boxMM(c.b, k.M.tile, '#8a806a', 61.9, 64.1, UG, UG + ((i + 1) * (BF - UG)) / 5, 57.2 + i, 58.2 + i, { chunk: c.chunk, uv: 1.4, shadow: false });
  c.col.addRamp({ minX: 61.9, maxX: 64.1, minZ: 57, maxZ: 62.2, axis: 'z', a: 57.2, ya: UG, b: 62.2, yb: BF });
  floor(c, 61.9, 64.1, 62.2, 98.1, BF, k.M.tile, '#8a806a', 0.2, true, 1.4);
  floor(c, 64.1, 76.85, 95.9, 98.1, BF, k.M.tile, '#8a806a', 0.2, true, 1.4);
  ceiling(c, 61.9, 64.1, 57, 98.1, TOPY, '#6e6452');
  ceiling(c, 64.1, 76.85, 95.9, 98.1, TOPY, '#6e6452');
  wall(c, 'z', 61.75, 57, 98.25, UG - 0.2, TOPY + 0.2, st);
  wall(c, 'z', 64.25, 57, 95.75, UG - 0.2, TOPY + 0.2, st);
  wall(c, 'x', 98.25, 61.75, 76.85, BF - 0.2, TOPY + 0.2, st);
  wall(c, 'x', 95.75, 64.25, 76.85, BF - 0.2, TOPY + 0.2, st);
  for (let z = 60; z < 96; z += 3) for (const x of [62.0, 64.0]) box(c.b, k.M.wood, '#4a3020', x, BF, z, 0.14, TOPY - BF, 0.14, { chunk: c.chunk, shadow: false });
  for (let z = 60; z < 96; z += 3) box(c.b, k.M.wood, '#4a3020', 63, TOPY - 0.16, z, 2.2, 0.16, 0.14, { chunk: c.chunk, shadow: false });
  for (const z of [64, 76, 88]) staticLantern(c, w, 63, TOPY - 0.5, z, 0.5, 0, 2.5, 7);
  staticLantern(c, w, 70, TOPY - 0.5, 97, 0.5, 0, 2.5, 7);
  void blob;
}
