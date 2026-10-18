// ENT-R02-R5B — one physically continuous upper ceiling over the entrance extension
// and old manor. Plan coordinates use +Z north; THREE world coordinates use -Z.
// Geometry is authored in *world space* and must not be offset again at placement.
import * as THREE from 'three';
import { ENTRANCE_R02, UCEIL } from './layout';

export const ENTRANCE_CEILING_BOUNDS = {
  minX: 72.4, maxX: 107.6,
  frontZ: ENTRANCE_R02.faceZ, formerZ: 80.4, backZ: 99.8,
  bottomY: UCEIL, thickness: 0.2,
} as const;

/** A single non-colliding solid; no overlapping ceiling boxes at the old façade. */
export function buildEntranceGalleryCeilingGeometry(): THREE.BufferGeometry {
  const e = ENTRANCE_CEILING_BOUNDS;
  const outline = new THREE.Shape();
  outline.moveTo(e.minX, e.formerZ);
  outline.lineTo(ENTRANCE_R02.x0, e.formerZ);
  outline.lineTo(ENTRANCE_R02.x0, e.frontZ);
  outline.lineTo(ENTRANCE_R02.x1, e.frontZ);
  outline.lineTo(ENTRANCE_R02.x1, e.formerZ);
  outline.lineTo(e.maxX, e.formerZ);
  outline.lineTo(e.maxX, e.backZ);
  outline.lineTo(e.minX, e.backZ);
  outline.closePath();

  const solid = new THREE.ExtrudeGeometry(outline, {
    depth: e.thickness, bevelEnabled: false, curveSegments: 1,
  });
  // Rotation is NEGATIVE: (x, planZ, depth) becomes (x, depth, -planZ).
  // The previous +PI/2 put this ceiling at +Z while the manor is at -Z,
  // leaving a large visible hole to the sky despite passing source-only tests.
  solid.rotateX(-Math.PI / 2);
  solid.translate(0, e.bottomY, 0);
  solid.computeBoundingBox();
  return solid;
}
