// WINDOW-FIX-R02 — a connected 2 × 4 light sash, not ten coplanar/intersecting boxes.
// The stone surround and plaster reveal are architecture, NOT another painted sash.
import * as THREE from 'three';
import type { Ctx } from './arch';
import { planMatrix } from './kit';

export const UNIFIED_SASH_COLOR = '#687568';
export const UNIFIED_SASH_MATERIAL = 'WINDOW-FIX-R02-ConnectedSash';

/** Closed perimeter plus eight clockwise pane holes: every rail is part of ONE solid. */
export function unifiedSashShape(width: number, height: number): THREE.Shape {
  const x0 = -width / 2, x1 = width / 2;
  const y0 = -height / 2, y1 = height / 2;
  const outline = new THREE.Shape();
  outline.moveTo(x0 - 0.04, y0 - 0.05);
  outline.lineTo(x1 + 0.04, y0 - 0.05);
  outline.lineTo(x1 + 0.04, y1 + 0.045);
  outline.lineTo(x0 - 0.04, y1 + 0.045);
  outline.closePath();

  // Outer legs 65 mm, centre mullion 36 mm; the central meeting rail stays stronger.
  const columns: [number, number][] = [[x0 + 0.025, -0.018], [0.018, x1 - 0.025]];
  const quarters = [0.25, 0.5, 0.75] as const;
  const rails = quarters.map(q => {
    const centre = y0 + height * q, half = q === 0.5 ? 0.025 : 0.017;
    return [centre - half, centre + half] as const;
  });
  const rows: [number, number][] = [
    [y0 + 0.025, rails[0][0]],
    [rails[0][1], rails[1][0]],
    [rails[1][1], rails[2][0]],
    [rails[2][1], y1 - 0.01],
  ];
  for (const [left, right] of columns) for (const [bottom, top] of rows) {
    if (right <= left || top <= bottom) throw new Error('Window too small for unified sash');
    // THREE.ShapeUtils expects hole loops clockwise in the XY plane.
    const pane = new THREE.Path();
    pane.moveTo(left, bottom);
    pane.lineTo(left, top);
    pane.lineTo(right, top);
    pane.lineTo(right, bottom);
    pane.closePath();
    outline.holes.push(pane);
  }
  return outline;
}

/** One extruded solid including all vertical/horizontal members; no intersecting end caps. */
export function unifiedSashGeometry(width: number, height: number) {
  // 49 mm thick, fully behind the stone face and 18 mm ahead of the existing glass.
  const thickness = 0.049;
  const geometry = new THREE.ExtrudeGeometry(unifiedSashShape(width, height), {
    depth: thickness, steps: 1, bevelEnabled: false, curveSegments: 1,
  });
  geometry.translate(0, 0, -thickness / 2);
  return geometry;
}

/** faceF is the exterior wall face, side points outdoors, and at runs along the wall. */
export function addUnifiedManorSash(
  c: Ctx, axis: 'x' | 'z', faceF: number, side: 1 | -1,
  at: number, y: number, width: number, height: number,
) {
  const depthFromFacade = -0.0425; // centre between -67 mm and -18 mm facade offsets
  const normal = faceF + side * depthFromFacade;
  const gx = axis === 'x' ? at : normal;
  const gz = axis === 'x' ? normal : at;
  const geometry = unifiedSashGeometry(width, height);
  // Plan yaw is inverted internally: -PI/2 maps local width to the plan-Z wall axis.
  c.b.add(c.k.M.windowSash, geometry,
    planMatrix(gx, y + height / 2, gz, axis === 'z' ? -Math.PI / 2 : 0),
    UNIFIED_SASH_COLOR, c.chunk, false, 0);
  geometry.dispose();
}
