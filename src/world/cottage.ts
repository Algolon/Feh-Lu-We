// Portuguese cottage X 20–30, Z 88–96: white plaster, terracotta roof, blue shutters, two small
// terraces, and the pond (≈ (36, 92)) beside it. Inside: entry room, two niches, and the gathering room.
import * as THREE from 'three';
import type { World, GameApi } from '../interactions/world';
import { type Ctx, wall, floor, ceiling, hipRoof } from './arch';
import { box, boxMM, cyl, blob, compound, v3 } from './kit';
import { table, chair, plant, lantern, part, staticLantern } from './furniture';
import { makeFire } from './fire';
import { makeDoor, makeLamp, makeInspect, makeAction, place } from '../interactions/props';
import { drawSymbol } from '../content/symbols';

export function buildCottage(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const Y = 0.3, TOPW = 3.3;
  const white = { mat: k.M.plaster, color: '#fbf6ec', t: 0.3, uv: 2 };
  const win = (at: number) => ({ at, w: 0.9, h: 1.2, sill: 0.95 });
  wall(c, 'x', 88.15, 20, 30, 0, TOPW, { ...white, exterior: -1, openings: [{ at: 25, w: 1.0, h: 2.25 }], windows: [win(22.2), win(27.8)] });
  wall(c, 'x', 95.85, 20, 30, 0, TOPW, { ...white, exterior: 1, windows: [win(22.5), win(27.5)] });
  wall(c, 'z', 20.15, 88.3, 95.7, 0, TOPW, { ...white, exterior: -1, windows: [win(93.3)] });
  wall(c, 'z', 29.85, 88.3, 95.7, 0, TOPW, { ...white, exterior: 1, windows: [win(89.7), win(93.6)] });
  // blue shutters + terracotta trim around the front windows
  for (const x of [22.2, 27.8]) for (const s of [-1, 1]) box(c.b, k.M.wood, '#3f6fa8', x + s * 0.68, Y + 0.9, 87.95, 0.42, 1.35, 0.05, { chunk: c.chunk, uv: 1 });
  for (const z of [89.7, 93.6]) for (const s of [-1, 1]) box(c.b, k.M.wood, '#3f6fa8', 30.05, Y + 0.9, z + s * 0.68, 0.05, 1.35, 0.42, { chunk: c.chunk, uv: 1 });
  boxMM(c.b, k.M.paint, '#c8643a', 19.9, 30.1, 0, 0.3, 87.9, 96.1, { chunk: c.chunk }); // plinth band
  hipRoof(c, 25, 92, 10, 8, TOPW, 2.2, k.M.terracotta, '#ffffff', 0.55);
  box(c.b, k.M.plaster, '#fbf6ec', 21.2, 4.0, 94.6, 0.8, 2.0, 0.8, { chunk: c.chunk });
  box(c.b, k.M.terracotta, '#ffffff', 21.2, 6.0, 94.6, 1.0, 0.15, 1.0, { chunk: c.chunk });
  // interior (own chunk, culled from afar)
  const outChunk = c.chunk;
  c.chunk = 'cottageIn';
  floor(c, 20.3, 29.7, 88.3, 95.7, Y, k.M.wood, '#b88a5a', 0.3, true, 2);
  ceiling(c, 20.3, 29.7, 88.3, 95.7, 3.05, '#f4ead6');
  for (let x = 21; x < 30; x += 1.6) box(c.b, k.M.wood, '#6b4426', x, 2.88, 92, 0.16, 0.17, 7.4, { chunk: c.chunk, uv: 1 });
  wall(c, 'x', 91, 20.3, 29.7, Y, 3.05, { t: 0.2, mat: k.M.plaster, color: '#f6efe2', openings: [{ at: 25, w: 1.2, h: 2.2 }] });
  // gold trim around the gated door (visibly special)
  const trimMat = w.material(new THREE.MeshBasicMaterial({ color: '#8a6a2a' }));
  const trim = new THREE.Group();
  for (const [dx, dy, sx, sy] of [[-0.68, 1.1, 0.08, 2.3], [0.68, 1.1, 0.08, 2.3], [0, 2.3, 1.44, 0.08]] as const) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, 0.24), trimMat);
    m.position.set(dx, dy, 0);
    trim.add(m);
  }
  trim.position.copy(v3(25, Y, 91));
  w.scene.add(trim);
  // niches beside the gated door, each with a recess and a symbol hint (tree left, house right)
  const nicheTex = (sym: string) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const x = cv.getContext('2d')!; x.fillStyle = '#d9c4a0'; x.fillRect(0, 0, 64, 64);
    drawSymbol(x, sym, 12, 12, 40, { color: '#b98a4e' });
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return w.texture(t);
  };
  const nicheGrp = new THREE.Group();
  for (const [x, sym] of [[23.4, 'schuur'], [26.6, 'wapen']] as const) {
    void sym;
    const recess = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.12), w.material(new THREE.MeshLambertMaterial({ color: '#8a6a4a' })));
    recess.position.copy(v3(x, Y + 1.25, 90.94));
    w.scene.add(recess);
    const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.12, 12, 1, false, 0, Math.PI), recess.material as THREE.Material);
    arch.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    arch.position.copy(v3(x, Y + 1.575, 90.94));
    w.scene.add(arch);
  }
  void nicheTex;
  // items shown in the niches once placed
  const nicheItems: Record<string, THREE.Object3D> = {};
  for (const [slot, x] of [['left', 23.4], ['right', 26.6]] as const) {
    const grp = new THREE.Group();
    const token = compound((b) => cyl(b, k.M.wood, '#b98a4e', 0, 0, 0, 0.12, 0.12, 0.03, 14, { rx: Math.PI / 2 }));
    const crest = compound((b) => box(b, k.M.paint, '#c0504d', 0, -0.13, 0, 0.2, 0.26, 0.03));
    token.name = 'token'; crest.name = 'crest';
    grp.add(token, crest);
    grp.position.copy(v3(x, Y + 1.25, 90.86));
    w.scene.add(grp);
    nicheItems[slot] = grp;
  }
  w.onSync(() => {
    for (const slot of ['left', 'right']) {
      const it = g.state.slots[slot];
      for (const ch of nicheItems[slot].children) ch.visible = ch.name === it;
    }
    trimMat.color.set(g.state.flags.cottageSolved ? '#ffd27a' : '#8a6a2a');
  });
  void nicheGrp;
  for (const [side, x] of [['left', 23.4], ['right', 26.6]] as const) {
    const ng = new THREE.Group();
    place(ng, x, Y, 90.85);
    w.scene.add(ng);
    makeAction(w, {
      id: `cottage.niche.${side}`, obj: ng, hit: [0.9, 1.0, 0.3], hitOffset: [0, 1.25, 0],
      label: () => (g.state.flags.cottageSolved ? null : side === 'left' ? 'Linkernis' : 'Rechternis'),
      run: () => g.openPanel('slots'),
    });
  }
  makeDoor(w, g, { id: 'door.cottage', x: 24.5, z: 88.15, dir: 'x+', width: 1.0, height: 2.2, y0: Y, swing: 1, color: '#3f6fa8', key: 'cottageKey' });
  makeDoor(w, g, {
    id: 'door.gathering', x: 24.4, z: 91, dir: 'x+', width: 1.2, height: 2.15, y0: Y, swing: 1, color: '#5a3520',
    unlock: 'lock.gathering', lockedMsg: 'De deur naar de zaal gaat niet open. Er zit geen sleutelgat in — alleen twee lege nissen ernaast.',
  });
  // entry room details
  for (const x of [21.0, 28.8]) plant(c, x, 88.8, Y, 0.9, '#c9774a');
  const el = lantern(w, 29.4, Y + 1.8, 90.6, 0.7);
  makeLamp(w, g, { id: 'lamp.cottageEntry', ...el, name: 'lantaarn', defaultOn: true, intensity: 3, distance: 6, hit: [0.4, 0.5, 0.4] });

  // gathering room: warmly lit table (lights come on when the niches are solved)
  table(c, 25, 93.4, Y, 5.0, 1.4, 0, '#7a4a28');
  for (let i = 0; i < 5; i++) {
    if (i !== 2) chair(c, 23 + i, 92.3, Y, 0, '#c4553d'); // keep the doorway line clear
    chair(c, 23 + i, 94.5, Y, Math.PI, '#c4553d');
  }
  for (let i = 0; i < 5; i++) {
    cyl(c.b, k.M.paint, '#f5f0e6', 23 + i, Y + 0.76, 92.9, 0.13, 0.13, 0.015, 14, { chunk: c.chunk });
    cyl(c.b, k.M.paint, '#f5f0e6', 23 + i, Y + 0.76, 93.9, 0.13, 0.13, 0.015, 14, { chunk: c.chunk });
  }
  blob(c.b, k.M.paint, '#d9a441', 24, Y + 0.85, 93.4, 0.25, 0.1, 0.12, { chunk: c.chunk }); // bread
  blob(c.b, k.M.paint, '#f0d070', 26, Y + 0.82, 93.4, 0.15, 0.07, 0.15, { chunk: c.chunk }); // cheese
  cyl(c.b, k.M.paint, '#7a2a30', 25, Y + 0.76, 93.4, 0.06, 0.06, 0.28, 8, { chunk: c.chunk }); // bottle
  const lit = () => !!g.state.flags.cottageSolved;
  for (const x of [23.5, 26.5]) {
    cyl(c.b, k.M.paint, '#c9a44c', x, Y + 0.76, 93.4, 0.06, 0.07, 0.02, 10, { chunk: c.chunk });
    cyl(c.b, k.M.paint, '#efe6c8', x, Y + 0.78, 93.4, 0.03, 0.03, 0.22, 8, { chunk: c.chunk });
  }
  const candleFl = [makeFire(w, { kind: 'candles', x: 25, y: Y + 1.0, z: 93.4, wicks: [[-1.5, 0, 0], [1.5, 0, 0]] })];
  w.lamps.push({ id: 'cottage.table', pos: v3(25, Y + 1.6, 93.4), color: '#ffc06a', intensity: 9, distance: 9, on: lit, flicker: 0.15 });
  const bunting: THREE.MeshBasicMaterial[] = [];
  for (let i = 0; i < 9; i++) {
    const m = w.material(new THREE.MeshBasicMaterial({ color: '#5a5046' }));
    bunting.push(m);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), m);
    bulb.position.copy(v3(21 + i, 2.65 - Math.sin((i / 8) * Math.PI) * 0.25, 93.4));
    w.scene.add(bulb);
  }
  w.onSync(() => {
    for (const f of candleFl) f.visible = lit();
    for (const m of bunting) m.color.set(lit() ? '#ffd27a' : '#5a5046');
  });
  const card = compound((b) => { box(b, k.M.paint, '#f5eedc', 0, 0, 0, 0.18, 0.12, 0.01, { rx: -0.3 }); });
  place(card, 25, Y + 0.77, 92.8, 0);
  w.scene.add(card);
  makeInspect(w, g, { id: 'mem.cottage.ending', obj: card, clue: 'mem.cottage.ending', hit: [0.3, 0.25, 0.3] });
  // ending trigger: stepping into the opened gathering room
  w.onUpdate(() => {
    if (!g.state.flags.cottageSolved || g.state.flags.endingShown) return;
    const p = g.playerXZ();
    if (p.x > 20.3 && p.x < 29.7 && p.z > 91.4 && p.z < 95.7) {
      g.state.flags.endingShown = true;
      g.changed();
      g.finish();
    }
  });

  c.chunk = outChunk;
  // ---------------------------------------------------------------- terraces + pond
  floor(c, 20.4, 29.6, 85.7, 88.0, 0.15, k.M.terracotta, '#e8b090', 0.3, true, 1.2);
  floor(c, 30.0, 32.4, 89.0, 95.2, 0.15, k.M.terracotta, '#e8b090', 0.3, true, 1.2);
  table(c, 22.6, 86.8, 0.15, 1.2, 0.8, 0, '#efe6d6');
  chair(c, 21.8, 86.8, 0.15, Math.PI / 2, '#3f6fa8');
  chair(c, 23.4, 86.8, 0.15, -Math.PI / 2, '#3f6fa8');
  for (const [x, z] of [[28.8, 86.2], [20.8, 86.2], [31.8, 89.4], [31.8, 94.8]] as const) plant(c, x, z, 0.15, 1.1, '#c8643a');
  part(c, k.M.wood, '#7a5232', 31.6, 92.2, Math.PI / 2, 0, 0.15, 0, 1.6, 0.45, 0.45, 1); // terrace bench
  w.col.addBoxC(31.6, 92.2, 0.5, 1.7, 0, 0.6);
  for (const x of [24.0, 26.0]) {
    staticLantern(c, w, x, 2.3, 88.0, 0.7, 0, 3, 6);
  }
  // pond with lily pads and rocks
  const pondMat = w.material(new THREE.MeshLambertMaterial({ color: '#2f6f78', transparent: true, opacity: 0.88, emissive: new THREE.Color('#0a2a30') }));
  const pond = new THREE.Mesh(new THREE.CircleGeometry(3.2, 28), pondMat);
  pond.rotation.x = -Math.PI / 2;
  pond.position.copy(v3(36, 0.035, 92));
  pond.scale.set(1, 0.8, 1);
  w.scene.add(pond);
  w.col.addCircle(36, 92, 2.85, -1, 1.5);
  w.emitters.push({ kind: 'water', pos: v3(36, 0, 92), on: () => true });
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    blob(c.b, k.M.paint, '#9a948a', 36 + Math.cos(a) * 3.3, 0.05, 92 + Math.sin(a) * 2.7, 0.35 + (i % 3) * 0.1, 0.2, 0.3, { chunk: c.chunk });
  }
  for (const [x, z, r] of [[35, 92.8, 0.35], [37.2, 91.3, 0.3], [36.3, 93.4, 0.25], [34.6, 91.2, 0.28]] as const) {
    cyl(c.b, k.M.paint, '#4f8a3a', x, 0.04, z, r, r, 0.02, 10, { chunk: c.chunk });
    if (r > 0.3) blob(c.b, k.M.paint, '#f2c6d8', x + 0.1, 0.1, z, 0.08, 0.05, 0.08, { chunk: c.chunk });
  }
  // pond bench (optional memory)
  part(c, k.M.wood, '#7a5232', 36, 87.9, 0, 0, 0, 0, 1.6, 0.45, 0.45, 1);
  part(c, k.M.wood, '#7a5232', 36, 87.9, 0, 0, 0.45, -0.2, 1.6, 0.45, 0.06, 1);
  w.col.addBoxC(36, 87.9, 1.7, 0.5, 0, 0.6);
  const benchNote = compound((b) => box(b, k.M.paint, '#f5eedc', 0, 0, 0, 0.16, 0.004, 0.2));
  place(benchNote, 36.3, 0.46, 87.95, 0.2);
  w.scene.add(benchNote);
  makeInspect(w, g, { id: 'mem.pond.bench', obj: benchNote, clue: 'mem.pond.bench', hit: [0.4, 0.2, 0.4] });

  w.checkpoints.push({ name: 'cottage', pose: { x: 25, y: 0.15, z: 86.4, yaw: 0, pitch: 0 } });
}
