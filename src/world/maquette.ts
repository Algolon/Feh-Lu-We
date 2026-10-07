// Hall maquette (DEV-01 review follow-up, DEV-02): a miniature of THIS house — main block with its hip roof and the
// entrance bay, the single-storey service wing and the glass Copacabana Room — on a presentation table against the
// hall's west wall (no longer free-standing in the hall). Inspectable as an object (memory `mem.hall.maquette`). The
// gingerbread house stays a subtle, descriptive wink: white "icing" piping along the eaves, nothing more; the album
// photo (DS01) shows the first little house, so photo and maquette are no longer duplicates.
// Plan mapping (viewer stands east of the table, looking west): real X → table +Z, real Z (north) → table −X.
import * as THREE from 'three';
import type { World, GameApi } from '../interactions/world';
import type { Ctx } from './arch';
import { box, boxMM, geo, hipRoofGeo, gableGeo } from './kit';
import { table } from './furniture';
import { makeInspect, place } from '../interactions/props';
import { MAQUETTE, MANOR, WING, CONS, GF } from './layout';

const S = 1 / 50; // model scale
const RX = 101, RZ = 96; // real-world point at the model centre

export function buildMaquette(w: World, g: GameApi, c: Ctx) {
  const k = c.k, M = MAQUETTE;
  table(c, M.x, M.z, GF, M.w, M.d, 0, '#5a3a22', M.h);
  const top = GF + M.h;
  const bx = M.x, bz = M.z + 0.2; // board centre (the note, when present, lies at the south end)
  const tx = (rz: number) => bx + (RZ - rz) * S, tz = (rx: number) => bz + (rx - RX) * S;
  boxMM(c.b, k.M.wood, '#3e2a1a', bx - 0.34, bx + 0.34, top, top + 0.025, bz - 0.64, bz + 0.64, { chunk: c.chunk });
  boxMM(c.b, k.M.paint, '#8fae62', bx - 0.33, bx + 0.33, top + 0.025, top + 0.03, bz - 0.63, bz + 0.63, { chunk: c.chunk, shadow: false });
  const y0 = top + 0.03;
  // forecourt drive (gravel) towards the viewer, terrace on the garden side
  boxMM(c.b, k.M.paint, '#e2d2b0', tx(80), bx + 0.33, y0, y0 + 0.003, tz(88.5), tz(91.5), { chunk: c.chunk, shadow: false });
  boxMM(c.b, k.M.paint, '#d9ccb0', tx(117), tx(110), y0, y0 + 0.004, tz(78), tz(102), { chunk: c.chunk, shadow: false });
  // main block + hip roof, entrance bay with pediment
  const block = (r: { x0: number; x1: number; z0: number; z1: number }, h: number, col: string) =>
    boxMM(c.b, k.M.paint, col, tx(r.z1), tx(r.z0), y0, y0 + h * S, tz(r.x0), tz(r.x1), { chunk: c.chunk });
  block(MANOR, 6.4, '#f2e6cc');
  const roof = hipRoofGeo((MANOR.z1 - MANOR.z0) * S, (MANOR.x1 - MANOR.x0) * S, 8.2 * S, 0.7 * S);
  geo(c.b, k.M.paint, '#8a93a8', roof, tx((MANOR.z0 + MANOR.z1) / 2), y0 + 6.4 * S, tz((MANOR.x0 + MANOR.x1) / 2), { chunk: c.chunk });
  roof.dispose();
  boxMM(c.b, k.M.paint, '#f6ead0', tx(80.05), tx(79.55), y0, y0 + 6.4 * S, tz(86.4), tz(93.6), { chunk: c.chunk });
  const ped = gableGeo(0.6 * S, 7.8 * S, 2.6 * S, true);
  geo(c.b, k.M.paint, '#f6ead0', ped, tx(79.8), y0 + 6.65 * S, tz(90), { chunk: c.chunk });
  ped.dispose();
  // windows as dark dots on the front (the side facing the viewer)
  for (const x of [75.5, 79, 82.5, 98, 101.5, 105]) for (const y of [1.6, 4.6]) box(c.b, k.M.paint, '#3f4a5a', tx(79.9), y0 + y * S, tz(x), 0.002, 1.3 * S, 1.0 * S, { chunk: c.chunk, shadow: false });
  // service wing (single storey, hipped) and the glass Copacabana Room
  block(WING, 3.9, '#efe2c8');
  const wr = hipRoofGeo((WING.z1 - WING.z0) * S, (WING.x1 - WING.x0) * S, 2.6 * S, 0.5 * S);
  geo(c.b, k.M.paint, '#848da0', wr, tx((WING.z0 + WING.z1) / 2), y0 + 3.9 * S, tz((WING.x0 + WING.x1) / 2), { chunk: c.chunk });
  wr.dispose();
  block(CONS, 3.4, '#bcd8d4');
  const cr = gableGeo((CONS.z1 - CONS.z0) * S, (CONS.x1 - CONS.x0) * S, 2.4 * S, true);
  geo(c.b, k.M.paint, '#d8ece8', cr, tx((CONS.z0 + CONS.z1) / 2), y0 + 3.4 * S, tz((CONS.x0 + CONS.x1) / 2), { chunk: c.chunk });
  cr.dispose();
  // the wink: white piping along the main eaves, like icing on a gingerbread house
  const ey = y0 + 6.4 * S, o = 0.7 * S;
  const icing = (x0: number, x1: number, z0: number, z1: number) => boxMM(c.b, k.M.paint, '#fbf6ea', x0, x1, ey - 0.004, ey + 0.004, z0, z1, { chunk: c.chunk, shadow: false });
  icing(tx(MANOR.z1) - o, tx(MANOR.z0) + o, tz(MANOR.x0) - o - 0.004, tz(MANOR.x0) - o + 0.004);
  icing(tx(MANOR.z1) - o, tx(MANOR.z0) + o, tz(MANOR.x1) + o - 0.004, tz(MANOR.x1) + o + 0.004);
  icing(tx(MANOR.z0) + o - 0.004, tx(MANOR.z0) + o + 0.004, tz(MANOR.x0) - o, tz(MANOR.x1) + o);
  icing(tx(MANOR.z1) - o - 0.004, tx(MANOR.z1) - o + 0.004, tz(MANOR.x0) - o, tz(MANOR.x1) + o);
  // inspectable as one object (the note of DS01, when present, has its own target at the table's south end)
  const anchor = new THREE.Group();
  place(anchor, bx, top, bz, 0);
  anchor.userData.room = 'hall';
  w.scene.add(anchor);
  makeInspect(w, g, { id: 'mem.hall.maquette', obj: anchor, clue: 'mem.hall.maquette', hit: [0.68, 0.36, 1.26], label: 'Bekijken: maquette' });
}
