import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Batcher, boxGeo, planMatrix } from './kit';
import { seamlessWallFaceUV } from './seamlessWallFinish';

// The physical wall is split into left/sill/lintel/right box panels.
// All front-facing vertices at matching world points must sample matching texture
// positions, and every panel must have the exact same vertex tint.
describe('WINDOW-R01-R03 seamless plaster finish', () => {
  it.each(['x', 'z'] as const)('keeps %s wall UVs anchored across separate slabs', axis => {
    const repeat = 2;
    const all: { along: number; y: number; u: number; v: number }[] = [];
    for (const [lo, hi] of [[86, 87.45], [87.45, 88.55], [88.55, 90]] as const) {
      const size = hi - lo, mid = (lo + hi) / 2;
      const g = boxGeo(axis === 'x' ? size : 0.02, 3.2, axis === 'x' ? 0.02 : size, repeat);
      const cx = axis === 'x' ? mid : 109.6, cz = axis === 'x' ? 109.6 : mid;
      seamlessWallFaceUV(g, axis, cx, 1.6, cz, repeat);
      const pos = g.getAttribute('position'), normal = g.getAttribute('normal'), uv = g.getAttribute('uv');
      for (let i = 0; i < pos.count; i++) {
        if ((axis === 'x' ? Math.abs(normal.getZ(i)) : Math.abs(normal.getX(i))) < 0.9) continue;
        const along = axis === 'x' ? cx + pos.getX(i) : cz - pos.getZ(i);
        const y = 1.6 + pos.getY(i);
        expect(uv.getX(i)).toBeCloseTo(along / repeat, 5);
        expect(uv.getY(i)).toBeCloseTo(y / repeat, 5);
        all.push({ along, y, u: uv.getX(i), v: uv.getY(i) });
      }
      g.dispose();
    }
    const seam = all.filter(v => Math.abs(v.along - 87.45) < 1e-4 && Math.abs(v.y - 3.2) < 1e-4);
    expect(seam.length).toBeGreaterThanOrEqual(4);
    expect(new Set(seam.map(v => `${v.u.toFixed(5)}/${v.v.toFixed(5)}`)).size).toBe(1);
  });

  it('never randomises brightness of sliced plaster panels', () => {
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const batch = new Batcher(), parent = new THREE.Group();
    const boxes = [[86, 87.45], [87.45, 88.55], [88.55, 90]] as const;
    for (const [left, right] of boxes) {
      const g = boxGeo(right - left, 3.2, 0.02, 2);
      seamlessWallFaceUV(g, 'x', (left + right) / 2, 1.6, 109.6, 2);
      batch.add(mat, g, planMatrix((left + right) / 2, 1.6, 109.6), '#f1e6cf', 'pilot', false, 0);
      g.dispose();
    }
    const [mesh] = batch.build(parent, false);
    const color = mesh.geometry.getAttribute('color');
    const first = new THREE.Color('#f1e6cf');
    for (let i = 0; i < color.count; i++) {
      expect(color.getX(i)).toBeCloseTo(first.r, 5);
      expect(color.getY(i)).toBeCloseTo(first.g, 5);
      expect(color.getZ(i)).toBeCloseTo(first.b, 5);
    }
    mesh.geometry.dispose();
    mat.dispose();
  });
});
