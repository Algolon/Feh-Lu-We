// DEV-01 slice props in the manor (built only with ?review=dev01; manor.ts calls these behind SLICE).
// Positions come from placement.ts (validated keepouts); pictures come from drawings.ts (the same SVG the inspect
// overlays show). Static parts are batched into the area chunk (mHall / mLib / mUp), so the whole slice adds one
// textured draw call per area plus the three movable folios.
import * as THREE from 'three';
import type { World, GameApi } from '../interactions/world';
import { type Ctx, gableRoof } from '../world/arch';
import { box, cyl, compound, planMatrix, mesh, v3, getKit } from '../world/kit';
import { table, chair } from '../world/furniture';
import { makeAction, makePickup, place } from '../interactions/props';
import { PROPS, prop, type PropRec } from './placement';
import { B01_SLOTS, B01_FOLIOS, SRC, SLICE_IDS, B01_DRAWER, type FolioId, type SlotId, type Subject } from './ids';
import { b01Slots } from './model';
import * as D from './drawings';

// ------------------------------------------------------------------------------------------------ texture atlas
const COLS = 6, ROWS = 4, CELL = 256;
const CELLS = {
  slot_punt: 0, slot_rond: 1, slot_vierkant: 2, folio_stars: 3, folio_plants: 4, folio_travel: 5,
  clip_rond: 6, clip_punt: 7, clip_vierkant: 8, notebook: 9, fern: 10, scissors: 11,
  label: 12, note: 13, album: 14, letter: 15, photo: 16, maquette: 17,
} as const;
type CellId = keyof typeof CELLS;
const ART: Record<CellId, () => string> = {
  slot_punt: () => D.slotMark('punt'), slot_rond: () => D.slotMark('rond'), slot_vierkant: () => D.slotMark('vierkant'),
  folio_stars: () => D.folioPage('stars'), folio_plants: () => D.folioPage('plants'), folio_travel: () => D.folioPage('travel'),
  clip_rond: () => D.clipCard('rond'), clip_punt: () => D.clipCard('punt'), clip_vierkant: () => D.clipCard('vierkant'),
  notebook: D.objectArt.notebook, fern: D.objectArt.fern, scissors: D.objectArt.scissors, label: D.objectArt.label,
  note: D.noteCard, album: D.albumSpread, letter: D.letterSheet, photo: D.photoFront, maquette: D.maquetteView,
};

/** One atlas per world; cells are filled asynchronously from the SVG drawings (paper colour until decoded). */
class Atlas {
  readonly mat: THREE.MeshLambertMaterial;
  private tex: THREE.CanvasTexture;
  constructor(w: World) {
    const cv = document.createElement('canvas');
    cv.width = COLS * CELL; cv.height = ROWS * CELL;
    const x = cv.getContext('2d')!;
    x.fillStyle = '#efe6d2'; x.fillRect(0, 0, cv.width, cv.height);
    this.tex = w.texture(new THREE.CanvasTexture(cv));
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 4;
    this.mat = w.material(new THREE.MeshLambertMaterial({ map: this.tex, vertexColors: true }));
    let pending = 0;
    for (const [id, i] of Object.entries(CELLS) as [CellId, number][]) {
      const img = new Image();
      pending++;
      img.onload = () => {
        x.drawImage(img, (i % COLS) * CELL + 1, Math.floor(i / COLS) * CELL + 1, CELL - 2, CELL - 2);
        this.tex.needsUpdate = true;
        if (--pending === 0) w.scene.userData.sliceAtlasReady = true;
      };
      img.onerror = () => { if (--pending === 0) w.scene.userData.sliceAtlasReady = true; };
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(ART[id]())}`;
    }
  }
  /** Plane (w × h metres) showing one cell; local +Y is the top of the picture. */
  plane(cell: CellId, w: number, h: number) {
    const i = CELLS[cell], col = i % COLS, row = Math.floor(i / COLS);
    const g = new THREE.PlaneGeometry(w, h);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let j = 0; j < uv.count; j++) uv.setXY(j, (col + uv.getX(j)) / COLS, (ROWS - 1 - row + uv.getY(j)) / ROWS);
    return g;
  }
}

/** Batch a picture lying flat on a surface; its top points along plan heading `topYaw` (away from the reader). */
function flat(c: Ctx, a: Atlas, cell: CellId, x: number, y: number, z: number, w: number, h: number, topYaw: number) {
  const g = a.plane(cell, w, h);
  g.rotateX(-Math.PI / 2);
  c.b.add(a.mat, g, planMatrix(x, y, z, topYaw), '#ffffff', c.chunk, false, 0);
  g.dispose();
}
/** Batch an upright picture whose face looks along plan heading `faceYaw`. */
function upright(c: Ctx, a: Atlas, cell: CellId, x: number, y: number, z: number, w: number, h: number, faceYaw: number) {
  const g = a.plane(cell, w, h);
  g.rotateY(Math.PI); // PlaneGeometry faces three +Z = plan south; turn it to face plan north at yaw 0
  c.b.add(a.mat, g, planMatrix(x, y + h / 2, z, faceYaw), '#ffffff', c.chunk, false, 0);
  g.dispose();
}

/** Invisible interaction anchor at a prop part (the visuals are batched into the area chunk). */
function anchor(w: World, p: PropRec, partId: string, room: string): THREE.Group {
  const part = p.parts!.find((q) => q.id === partId)!;
  const grp = new THREE.Group();
  place(grp, p.x + part.dx, p.y + p.h, p.z + part.dz, 0);
  grp.userData.room = room;
  w.scene.add(grp);
  return grp;
}
function inspectAt(w: World, g: GameApi, p: PropRec, id: string, source: string, label: string, hit: [number, number, number]) {
  makeAction(w, { id, obj: anchor(w, p, id, p.room), hit, hitOffset: [0, hit[1] / 2 - 0.05, 0], label: () => label, run: () => g.inspect(source) });
}
const top = (p: PropRec) => p.y + p.h;

let atlas: Atlas | null = null;
const atlasFor = (w: World) => {
  if (!atlas || (w.scene.userData.sliceAtlas as Atlas | undefined) !== atlas) { atlas = new Atlas(w); w.scene.userData.sliceAtlas = atlas; }
  return atlas;
};

// ------------------------------------------------------------------------------------------------ G02 hall: DS01 A (maquette)
export function sliceHall(w: World, g: GameApi, c: Ctx) {
  const k = c.k, a = atlasFor(w), p = prop('ds01.maquetteTable');
  table(c, p.x, p.z, p.y, p.w, p.d, 0, '#6b4426', p.h);
  // gingerbread maquette (DEV-01R canon): the house in gingerbread with white icing, on a board with the grounds
  const mx = p.x - 0.04, mz = p.z + 0.12, my = top(p) + 0.032;
  box(c.b, k.M.wood, '#4a2f1a', mx, top(p), mz, 0.46, 0.03, 0.66, { chunk: c.chunk });
  flat(c, a, 'maquette', mx, my, mz, 0.62, 0.42, -Math.PI / 2);
  box(c.b, k.M.paint, '#a0622d', mx, my, mz + 0.02, 0.15, 0.09, 0.22, { chunk: c.chunk }); // gingerbread walls
  gableRoof(c, mx, mz + 0.02, 0.26, 0.19, my + 0.09, 0.075, false, k.M.paint, '#8a5226'); // gingerbread roof (ridge along z)
  for (const sgn of [-1, 1]) box(c.b, k.M.paint, '#fbf6ea', mx + sgn * 0.092, my + 0.084, mz + 0.02, 0.014, 0.014, 0.27, { chunk: c.chunk }); // icing along the eaves
  for (const dz of [-0.13, 0.13]) box(c.b, k.M.paint, '#fbf6ea', mx, my + 0.084, mz + 0.02 + dz, 0.19, 0.012, 0.012, { chunk: c.chunk }); // icing on the gable ends
  for (const dz of [-0.06, 0.06]) box(c.b, k.M.paint, '#fbf6ea', mx + 0.076, my + 0.035, mz + 0.02 + dz, 0.004, 0.03, 0.03, { chunk: c.chunk }); // iced windows (east face)
  box(c.b, k.M.paint, '#6a3a1a', mx + 0.076, my, mz + 0.02, 0.004, 0.05, 0.03, { chunk: c.chunk }); // door
  // the ordinary note, propped at the south end of the table (paper, no brass, no numerals)
  const n = p.parts![0];
  flat(c, a, 'note', p.x + n.dx, top(p) + 0.004, p.z + n.dz, 0.2, 0.14, -Math.PI / 2);
  inspectAt(w, g, p, SLICE_IDS.dsNote, SRC.dsNote, 'Lezen: notitie', [0.3, 0.16, 0.26]);
}

// ------------------------------------------------------------------------------------------------ G04 library: B01 table + DS01 B
/** Replaces the iteration-3 catalogue on the reading table. `deskDrawer` is the table's existing drawer. */
export function sliceLibraryTable(w: World, g: GameApi, c: Ctx, deskDrawer: { slider: THREE.Group; isOpen: () => boolean }) {
  const k = c.k, a = atlasFor(w), t = prop('b01.tableTop');
  const tx = t.x, tz = t.z, y = top(t);
  // chairs on the west side: the east side is the reading side (pose.table)
  chair(c, tx - 0.95, tz - 0.5, t.y, Math.PI / 2, '#3f5a6a');
  chair(c, tx - 0.95, tz + 0.5, t.y, Math.PI / 2, '#3f5a6a');
  // three engraved slots on the east half; left → right for a reader facing west = south → north
  const slotZ = (i: number) => tz + (i - 1) * 0.62;
  B01_SLOTS.forEach((s, i) => flat(c, a, `slot_${s}` as CellId, tx + 0.2, y + 0.002, slotZ(i), 0.38, 0.38, -Math.PI / 2));
  // folios = loose drawing sheets (los tekenblad): thin paper meshes sharing the atlas material (one draw call each)
  const folios = new THREE.Group();
  folios.userData.room = 'library';
  w.scene.add(folios);
  const folioObj: Record<FolioId, THREE.Object3D> = {} as Record<FolioId, THREE.Object3D>;
  for (const f of B01_FOLIOS) {
    const grp = new THREE.Group();
    grp.add(compound((b) => box(b, k.M.paint, '#e8dfca', 0, 0, 0, 0.255, 0.002, 0.335)));
    const geo = a.plane(`folio_${f}` as CellId, 0.32, 0.24);
    geo.rotateX(-Math.PI / 2);
    const cover = mesh(geo, a.mat, '#ffffff');
    geo.dispose();
    cover.position.y = 0.003;
    cover.rotation.y = Math.PI / 2; // picture top toward the west (away from the reader); sheet lies landscape
    cover.castShadow = false;
    grp.add(cover);
    folios.add(grp);
    folioObj[f] = grp;
  }
  w.onSync(() => {
    const cur = b01Slots(g.state);
    let loose = 0;
    for (const f of B01_FOLIOS) {
      const slot = (Object.keys(cur) as SlotId[]).find((s) => cur[s] === f);
      const o = folioObj[f];
      if (slot) { const i = B01_SLOTS.indexOf(slot); o.position.copy(v3(tx + 0.2, y + 0.006, slotZ(i))); o.rotation.y = 0; }
      else { o.position.copy(v3(tx - 0.27, y + 0.004 + loose * 0.028, tz - 0.5 + loose * 0.42)); o.rotation.y = 0.12 - loose * 0.1; loose++; }
    }
  });
  makeAction(w, {
    id: SLICE_IDS.table, obj: folios, hit: [1.0, 0.3, 2.2], hitOffset: [0, 0.1, 0],
    label: () => (g.state.slice?.b01.solved ? 'Bekijken: leestafel' : 'Bekijken: tekenbladen en vakken'),
    run: () => g.openPanel('b01'),
  });
  // re-anchor the hitbox on the table (the folio group sits at the origin)
  w.byId.get(SLICE_IDS.table)!.hit[0].position.copy(v3(tx, y + 0.1, tz));
  w.byId.get(SLICE_IDS.table)!.focus.copy(v3(tx, y + 0.1, tz));
  // drawer contents: the brass key (reward) and a separate card (an ordinary source, never read automatically)
  const key = compound((b) => { box(b, k.M.paint, '#c9a44c', 0, 0, 0, 0.05, 0.015, 0.16); box(b, k.M.paint, '#f5eedc', 0.04, 0.012, 0.09, 0.06, 0.004, 0.05); });
  key.position.set(0.05, -0.04, -0.12);
  deskDrawer.slider.add(key);
  makePickup(w, g, { id: 'pk.studyKey', item: 'studyKey', obj: key, available: deskDrawer.isOpen, hit: [0.24, 0.12, 0.26], label: 'Pakken: messing sleutel' });
  const card = compound((b) => box(b, k.M.paint, '#f5eedc', 0, 0, 0, 0.12, 0.004, 0.18));
  card.position.set(0.05, -0.04, 0.16);
  deskDrawer.slider.add(card);
  makeAction(w, {
    id: SLICE_IDS.card, obj: card, hit: [0.24, 0.1, 0.24],
    label: () => (g.state.open[B01_DRAWER] ? 'Lezen: kaartje' : null),
    run: () => g.inspect(SRC.archiveCard),
  });
  sliceLibraryDs01(w, g, c, a);
}

function sliceLibraryDs01(w: World, g: GameApi, c: Ctx, a: Atlas) {
  // DS01 B (DEV-01R canon): a quiet reading plank — a narrow ledge on two trestles, apart from the B01 table
  const k = c.k, p = prop('ds01.sideTable');
  for (const dz of [-0.36, 0.36]) {
    box(c.b, k.M.wood, '#5a3a22', p.x, p.y, p.z + dz, 0.06, p.h - 0.04, 0.06, { chunk: c.chunk });
    box(c.b, k.M.wood, '#5a3a22', p.x, p.y, p.z + dz, 0.5, 0.05, 0.06, { chunk: c.chunk });
  }
  box(c.b, k.M.wood, '#6b4426', p.x, p.y + p.h - 0.04, p.z, p.w, 0.04, p.d, { chunk: c.chunk, uv: 1 });
  box(c.b, k.M.wood, '#4a2f1a', p.x - p.w / 2 + 0.02, p.y + p.h, p.z, 0.03, 0.04, p.d, { chunk: c.chunk }); // back rim
  c.col.addBox(p.x - p.w / 2, p.x + p.w / 2, p.z - p.d / 2, p.z + p.d / 2, p.y, p.y + p.h);
  const al = p.parts!.find((q) => q.id === SLICE_IDS.dsAlbum)!, le = p.parts!.find((q) => q.id === SLICE_IDS.dsLetter)!;
  // open album (dark card pages) with one empty photo corner; the letter lies folded beside it
  box(c.b, k.M.paint, '#4a3426', p.x + al.dx, top(p), p.z + al.dz, 0.36, 0.03, 0.5, { chunk: c.chunk });
  flat(c, a, 'album', p.x + al.dx, top(p) + 0.032, p.z + al.dz, 0.48, 0.3, -Math.PI / 2);
  flat(c, a, 'letter', p.x + le.dx, top(p) + 0.006, p.z + le.dz, 0.17, 0.2, -Math.PI / 2 + 0.25);
  inspectAt(w, g, p, SLICE_IDS.dsAlbum, SRC.dsAlbum, 'Bekijken: album', [0.42, 0.18, 0.4]);
  inspectAt(w, g, p, SLICE_IDS.dsLetter, SRC.dsLetter, 'Lezen: briefje', [0.26, 0.14, 0.24]);
}

// ------------------------------------------------------------------------------------------------ upstairs: B01 clusters + DS01 C
const PAIRS: { sub: Subject; prop: string; room: string; topYaw: number }[] = [
  { sub: 'sterren', prop: 'b01.sterrenTable', room: 'sterren', topYaw: 0 },
  { sub: 'reizen', prop: 'b01.reisDesk', room: 'reis', topYaw: 0 },
  { sub: 'planten', prop: 'b01.botanicTable', room: 'botanic', topYaw: -Math.PI / 2 },
];
const CLIP_OF: Record<Subject, SlotId> = { sterren: 'rond', planten: 'punt', reizen: 'vierkant' };

export function sliceUpstairs(w: World, g: GameApi, c: Ctx) {
  const k = c.k, a = atlasFor(w);
  for (const q of PAIRS) {
    const p = prop(q.prop), y = top(p);
    table(c, p.x, p.z, p.y, p.w, p.d, 0, '#6b4426', p.h);
    const pair = p.parts!.find((x) => x.id === SLICE_IDS.pair(q.sub))!, clip = p.parts!.find((x) => x.id === SLICE_IDS.clip(q.sub))!;
    const px = p.x + pair.dx, pz = p.z + pair.dz;
    if (q.sub === 'sterren') {
      // EB.folio.stars: small telescope on a FORK mount, two ROUND screw heads on the pivots + notebook with three holes
      const tx = px - 0.14;
      cyl(c.b, k.M.wood, '#5a3a22', tx, y, pz, 0.075, 0.08, 0.02, 18, { chunk: c.chunk });
      box(c.b, k.M.wood, '#6b4426', tx, y + 0.02, pz, 0.03, 0.06, 0.03, { chunk: c.chunk });
      box(c.b, k.M.paint, '#3a2412', tx, y + 0.08, pz, 0.15, 0.015, 0.03, { chunk: c.chunk });
      for (const sx of [-1, 1]) box(c.b, k.M.paint, '#3a2412', tx + sx * 0.068, y + 0.08, pz, 0.014, 0.1, 0.03, { chunk: c.chunk });
      cyl(c.b, k.M.paint, '#b8892f', tx, y + 0.17 - 0.15, pz, 0.028, 0.028, 0.3, 14, { chunk: c.chunk, rx: Math.PI / 2 - 0.42 }); // centre on the fork pivots (cyl takes its base height)
      for (const sx of [-1, 1]) cyl(c.b, k.M.paint, '#d9b860', tx + sx * 0.08, y + 0.167, pz, 0.017, 0.017, 0.012, 14, { chunk: c.chunk, rz: Math.PI / 2 });
      flat(c, a, 'notebook', px + 0.17, y + 0.004, pz, 0.16, 0.19, q.topYaw + 0.08);
    } else if (q.sub === 'reizen') {
      // EB.folio.travel: suitcase with two parallel straps + a square middle patch (facing the reader) + label with cut corner
      const sx0 = px - 0.12;
      box(c.b, k.M.paint, '#8a5a33', sx0, y, pz, 0.36, 0.26, 0.12, { chunk: c.chunk });
      for (const sx of [-1, 1]) box(c.b, k.M.paint, '#4a2f1a', sx0 + sx * 0.09, y - 0.002, pz, 0.026, 0.265, 0.126, { chunk: c.chunk });
      box(c.b, k.M.paint, '#c9a46a', sx0, y + 0.1, pz - 0.063, 0.075, 0.075, 0.006, { chunk: c.chunk });
      box(c.b, k.M.paint, '#4a2f1a', sx0, y + 0.26, pz, 0.1, 0.03, 0.025, { chunk: c.chunk }); // handle
      flat(c, a, 'label', px + 0.2, y + 0.004, pz + 0.02, 0.2, 0.1, q.topYaw - 0.12);
    } else {
      // EB.folio.plants: pressed fern under glass with a broad diagonal repair strip + scissors (angular and round grip)
      flat(c, a, 'fern', px, y + 0.004, pz - 0.1, 0.2, 0.24, q.topYaw);
      box(c.b, k.M.glass, '#ffffff', px, y + 0.004, pz - 0.1, 0.22, 0.01, 0.26, { chunk: c.chunk });
      flat(c, a, 'scissors', px, y + 0.004, pz + 0.17, 0.12, 0.16, q.topYaw + 0.2);
    }
    flat(c, a, `clip_${CLIP_OF[q.sub]}` as CellId, p.x + clip.dx, y + 0.004, p.z + clip.dz, 0.24, 0.21, q.topYaw);
    inspectAt(w, g, p, SLICE_IDS.pair(q.sub), SRC.pair(q.sub), 'Bekijken: voorwerpen op het tafeltje', q.topYaw === 0 ? [0.44, 0.2, 0.36] : [0.36, 0.2, 0.44]);
    inspectAt(w, g, p, SLICE_IDS.clip(q.sub), SRC.clip(q.sub), 'Bekijken: archiefclip', [0.24, 0.16, 0.24]);
  }
  // DS01 C: a small wooden drying rack in front of the window; the photo hangs from two pegs, face to the room
  const r = prop('ds01.rack');
  for (const s of [-1, 1]) box(c.b, k.M.wood, '#a8743f', r.x + s * 0.24, r.y, r.z, 0.03, r.h, 0.03, { chunk: c.chunk });
  for (const s of [-1, 1]) box(c.b, k.M.wood, '#a8743f', r.x + s * 0.24, r.y, r.z, 0.04, 0.03, r.d, { chunk: c.chunk });
  box(c.b, k.M.wood, '#a8743f', r.x, r.y + r.h - 0.03, r.z, 0.52, 0.02, 0.02, { chunk: c.chunk });
  box(c.b, k.M.paint, '#efe8d8', r.x, r.y + r.h - 0.04, r.z, 0.5, 0.005, 0.005, { chunk: c.chunk });
  upright(c, a, 'photo', r.x, r.y + r.h - 0.26, r.z + 0.015, 0.24, 0.18, 0);
  for (const s of [-1, 1]) box(c.b, k.M.wood, '#d8c8a0', r.x + s * 0.08, r.y + r.h - 0.07, r.z + 0.02, 0.015, 0.05, 0.012, { chunk: c.chunk });
  c.col.addBox(r.x - r.w / 2, r.x + r.w / 2, r.z - r.d / 2, r.z + r.d / 2, r.y, r.y + r.h);
  const ph = new THREE.Group();
  place(ph, r.x, r.y + r.h - 0.17, r.z + 0.03, 0);
  ph.userData.room = r.room;
  w.scene.add(ph);
  makeAction(w, { id: SLICE_IDS.dsPhoto, obj: ph, hit: [0.34, 0.28, 0.12], hitOffset: [0, 0, 0], label: () => 'Bekijken: foto', run: () => g.inspect(SRC.dsPhoto) });
}

/** Debug helper: ids the slice registered (used by the debug overlay and e2e). */
export const SLICE_PROP_IDS = PROPS.map((p) => p.id);
void getKit;
