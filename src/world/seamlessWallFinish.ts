// WINDOW-R01-R03: keep opaque facade/inner plaster UV coordinates continuous across
// the rectangles produced by a window aperture. No change to legacy unsliced wall UVs.
import * as THREE from 'three';

/**
 * BoxGeometry has distinct vertex groups per normal direction. Align only the broad
 * two wall faces to the global along-wall axis and height; keep the usual UV scale on
 * narrow reveals/top/bottom. The segment can be split anywhere without restarting
 * plaster or stone texture (and no new material/draw call is required).
 *
 * plan X = three X; plan Z = minus three Z. Box vertices are still local here.
 */
export function seamlessWallFaceUV(
  g: THREE.BufferGeometry, axis: 'x' | 'z',
  planX: number, worldY: number, planZ: number, metresPerRepeat: number,
) {
  if (!(metresPerRepeat > 0)) throw new RangeError('Wall UV scale must be positive');
  const pos = g.getAttribute('position'), norm = g.getAttribute('normal'), uv = g.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) {
    const broadFace = axis === 'x' ? Math.abs(norm.getZ(i)) > 0.9 : Math.abs(norm.getX(i)) > 0.9;
    if (!broadFace) continue;
    // The same physical point has the same UV, irrespective of the panel's width,
    // height, starting coordinate, or the plane's outward-facing normal.
    const along = axis === 'x' ? planX + pos.getX(i) : planZ - pos.getZ(i);
    uv.setXY(i, along / metresPerRepeat, (worldY + pos.getY(i)) / metresPerRepeat);
  }
  uv.needsUpdate = true;
  return g;
}
