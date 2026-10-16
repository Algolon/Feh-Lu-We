// WINDOW-R02 — one shared physical glazing/reveal/sill assembly for each rectangular manor window.
import * as THREE from 'three';
import type { World } from '../interactions/world';
import type { Ctx } from './arch';
import { boxMM, boxGeo, planMatrix, rod, blob } from './kit';
import { windowDepths, type ManorWindow } from './manorWindowLayout';

function segment(c: Ctx, axis: ManorWindow['axis'], along0: number, along1: number,
  y0: number, y1: number, normal0: number, normal1: number,
  material: THREE.Material, color: string) {
  const opts = { chunk: c.chunk, shadow: false, jitter: 0 };
  if (axis === 'x') boxMM(c.b, material, color, along0, along1, y0, y1,
    Math.min(normal0, normal1), Math.max(normal0, normal1), opts);
  else boxMM(c.b, material, color, Math.min(normal0, normal1), Math.max(normal0, normal1),
    y0, y1, along0, along1, opts);
}

export function sillBoardGeometry(s: ManorWindow, inside: number, nearGlass: number) {
  const sx = s.axis === 'x' ? s.w + 0.21 : Math.abs(nearGlass - inside);
  const sz = s.axis === 'x' ? Math.abs(nearGlass - inside) : s.w + 0.21;
  const g = boxGeo(sx, 0.04, sz, 1.45);
  if (s.axis === 'z') {
    // BoxGeometry's top face has U=X, V=Z; the custom oak grain runs along U.
    // Rotate the UV orientation on its horizontal faces so the grain follows the
    // long axis of the wall regardless of the facade's orientation.
    const uv = g.getAttribute('uv'), normal = g.getAttribute('normal');
    for (let i = 0; i < uv.count; i++) if (Math.abs(normal.getY(i)) > 0.9) {
      const u = uv.getX(i), v = uv.getY(i);
      uv.setXY(i, v, u);
    }
  }
  return g;
}

/** Static antique-brass window latch. The one real exterior-set sash carries it on its
 * ROOM-FACING side, not on a second interior window frame or floating in the reveal.
 * Generic casement detail: no opening interaction is introduced by this polish.
 */
export function manorLatchPose(s: ManorWindow) {
  const { exteriorFace, glazingF } = windowDepths(s);
  return {
    along: s.at + s.w / 2 - 0.018, // near the sash's inner edge, clear of the plaster return
    y: s.y0 + s.sill + s.h * 0.63,
    sashInnerFace: exteriorFace - s.exterior * 0.067,
    glassPlane: glazingF,
    facing: s.exterior,
  };
}

export function buildManorWindowLatch(c: Ctx, s: ManorWindow) {
  const p = manorLatchPose(s), metal = c.k.M.paint;
  const n = p.sashInnerFace, side = p.facing, a = p.along, y = p.y;
  // Narrow patinated bronze backplate, recessed into the original single sash.
  // The mounting plate overlaps that sash's actual inner plane by 4 mm.
  segment(c, s.axis, a - 0.027, a + 0.027, y - 0.091, y + 0.091,
    n + side * 0.004, n - side * 0.013, metal, '#705038');
  segment(c, s.axis, a - 0.019, a + 0.019, y - 0.078, y + 0.078,
    n - side * 0.013, n - side * 0.017, metal, '#b08b5c');
  const fastenerN = n - side * 0.021;
  for (const dy of [-0.065, 0.065]) {
    const x = s.axis === 'x' ? a : fastenerN;
    const z = s.axis === 'x' ? fastenerN : a;
    blob(c.b, metal, '#4a3425', x, y + dy, z, 0.006, 0.006, 0.003,
      { chunk: c.chunk, shadow: false, jitter: 0 });
  }
  // Stem projects toward the room; vertical traditional latch lever and small rounded finial.
  const stemN = n - side * 0.037;
  segment(c, s.axis, a - 0.010, a + 0.010, y - 0.008, y + 0.012,
    n - side * 0.014, stemN - side * 0.006, metal, '#b08a59');
  const leverN = n - side * 0.054;
  const lx = s.axis === 'x' ? a : leverN;
  const lz = s.axis === 'x' ? leverN : a;
  rod(c.b, metal, '#b08a59', lx, y + 0.018, lz, 0.012, 0.012, 0.111, 8,
    { chunk: c.chunk, shadow: false, jitter: 0 });
  blob(c.b, metal, '#c19a65', lx, y + 0.075, lz, 0.022, 0.023, 0.022,
    { chunk: c.chunk, shadow: false, jitter: 0 });
}

export function buildManorWindow(w: World, c: Ctx, s: ManorWindow) {
  const k = c.k, { glazingF, interiorF } = windowDepths(s);
  const x0 = s.at - s.w / 2, x1 = s.at + s.w / 2;
  const y0 = s.y0 + s.sill, y1 = y0 + s.h;
  segment(c, s.axis, x0, x1, y0, y1, glazingF - 0.006, glazingF + 0.006,
    k.M.windowGlass, '#ffffff');

  // Interior has ONLY plastered deep jambs and head. The one green sash lives
  // close to the outside face and is created by wall() / studyWindow().
  const plaster = '#e9dfcf', edge = 0.014;
  segment(c, s.axis, x0, x0 + edge, y0, y1, interiorF, glazingF, k.M.plaster, plaster);
  segment(c, s.axis, x1 - edge, x1, y0, y1, interiorF, glazingF, k.M.plaster, plaster);
  segment(c, s.axis, x0, x1, y1 - edge, y1, interiorF, glazingF, k.M.plaster, plaster);

  // Thin dark-oak interior board; 9 cm overhang into the room, never outside.
  const sill0 = interiorF - s.exterior * 0.09;
  const sill1 = glazingF - s.exterior * 0.012;
  const centreA = s.at, centreN = (sill0 + sill1) / 2;
  const gx = s.axis === 'x' ? centreA : centreN;
  const gz = s.axis === 'x' ? centreN : centreA;
  const board = sillBoardGeometry(s, sill0, sill1);
  c.b.add(k.M.windowSillWood, board, planMatrix(gx, y0 - 0.01, gz),
    '#ffffff', c.chunk, false, 0);
  board.dispose();

  // Small static latch on the one actual sash, facing the room (no duplicate interior frame).
  buildManorWindowLatch(c, s);

  // Physically solid pane for movement/picking, transparent ONLY to visual rays.
  const low = Math.min(glazingF - 0.025, glazingF + 0.025);
  const high = Math.max(glazingF - 0.025, glazingF + 0.025);
  const glass = s.axis === 'x'
    ? w.col.addBox(x0, x1, low, high, y0, y1, { occludes: true, tag: 'window.' + s.id })
    : w.col.addBox(low, high, x0, x1, y0, y1, { occludes: true, tag: 'window.' + s.id });
  w.visualPassThrough.add(glass);
}
