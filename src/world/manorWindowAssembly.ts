// WINDOW-R02 — one shared physical glazing/reveal/sill assembly for each rectangular manor window.
import * as THREE from 'three';
import type { World } from '../interactions/world';
import type { Ctx } from './arch';
import { boxMM, boxGeo, planMatrix } from './kit';
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

  // Physically solid pane for movement/picking, transparent ONLY to visual rays.
  const low = Math.min(glazingF - 0.025, glazingF + 0.025);
  const high = Math.max(glazingF - 0.025, glazingF + 0.025);
  const glass = s.axis === 'x'
    ? w.col.addBox(x0, x1, low, high, y0, y1, { occludes: true, tag: 'window.' + s.id })
    : w.col.addBox(low, high, x0, x1, y0, y1, { occludes: true, tag: 'window.' + s.id });
  w.visualPassThrough.add(glass);
}
