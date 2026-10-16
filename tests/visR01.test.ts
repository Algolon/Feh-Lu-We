import { describe, it, expect } from 'vitest';
import * as T from 'three';
import { GROVE_LOD_PROFILES, groveLodProfile, rangeFade, selectTreeLod, type GroveCategory } from '../src/world/vegetationLod';
import { mushroomModel, mushroomYoungModel } from '../src/world/mushroomModels';
import { mirrorGeometry } from '../src/world/mushroomGrove';

const CATS: GroveCategory[] = ['hero', 'medium', 'nursery'];
const sum = (g: T.BufferGeometry, n: string) => { let t = 0; const a = g.attributes[n].array; for (let i = 0; i < a.length; i++) t += a[i]; return t; };

describe('VIS-R01 grove distance bands', () => {
  it('fades every category to nothing over its last metres: never a full-size appearance', () => {
    for (const p of Object.values(GROVE_LOD_PROFILES)) for (const c of CATS) {
      const b = p.bands[c];
      expect(rangeFade(0, b)).toBe(1);
      expect(rangeFade(b.exit - b.fade, b)).toBe(1);
      expect(rangeFade(b.exit, b)).toBe(0);
      expect(rangeFade(b.exit + 10, b)).toBe(0);
      // the first visible step is one twelfth; the scale never increases with distance
      expect(rangeFade(b.exit - 1e-3, b)).toBeCloseTo(1 / 12, 9);
      let prev = 1;
      for (let d = 0; d < b.exit + 2; d += 0.05) { const k = rangeFade(d, b); expect(k).toBeLessThanOrEqual(prev); expect(Math.round(k * 12)).toBeCloseTo(k * 12, 9); prev = k; }
    }
  });
  it('declares one geometry per level, bands in order, and hysteresis narrower than any band', () => {
    for (const p of Object.values(GROVE_LOD_PROFILES)) for (const c of CATS) {
      const b = p.bands[c], edges = [0, ...b.levels, b.exit - b.fade];
      expect(p.geometry[c]).toHaveLength(b.levels.length + 1);
      for (let i = 1; i < edges.length; i++) expect(edges[i] - edges[i - 1]).toBeGreaterThan(2 * b.hysteresis);
    }
    // larger mushrooms carry further; ambient effects stay closer than any mushroom
    for (const p of Object.values(GROVE_LOD_PROFILES)) {
      expect(p.bands.hero.exit).toBeGreaterThan(p.bands.medium.exit);
      expect(p.bands.medium.exit).toBeGreaterThan(p.bands.nursery.exit);
      expect(p.ambient.full).toBeLessThan(p.ambient.exit);
    }
    expect(groveLodProfile('unknown').id).toBe(groveLodProfile().id);
    expect(groveLodProfile().id).toBe('b');
  });
  it('keeps a LOD stable while walking back and forth inside the hysteresis', () => {
    const b = GROVE_LOD_PROFILES.b.bands;
    for (const c of CATS) b[c].levels.forEach((edge, i) => {
      let level = i, switches = 0;
      for (let step = 0; step < 400; step++) {
        const d = edge + Math.sin(step * 0.31) * (b[c].hysteresis - 0.1);
        const next = selectTreeLod(d, level, b[c].levels, b[c].hysteresis);
        if (next !== level) switches++;
        level = next;
      }
      expect(switches).toBeLessThanOrEqual(1);
    });
  });
});

describe('VIS-R01 mushroom geometry', () => {
  // Fixture from production 436e106 (before VIS-R01): triangles and attribute sums of every approved model.
  const APPROVED: Record<number, Record<'detailed' | 'small' | 'young', number[]>> = { 0: { detailed: [4694, 24418.64, 14802.41, 4015.68], small: [1252, 6752.97, 4495.18, 1262.64], young: [728, 4230.8, 2590.5, 709.2] }, 1: { detailed: [4694, 24078.81, 14854.4, 4015.68], small: [1252, 6648.18, 4449.82, 1262.64], young: [728, 3853.94, 2460.28, 709.2] }, 2: { detailed: [4694, 18928.9, 15521.81, 4015.68], small: [1252, 5237.78, 4644.74, 1262.64], young: [728, 2944.41, 2771.75, 709.2] }, 3: { detailed: [4694, 25004.64, 17283.82, 4015.68], small: [1252, 6925.49, 5008.48, 1262.64], young: [728, 4623.62, 2651.41, 709.2] } };
  it('leaves the approved detailed, medium and nursery models unchanged', () => {
    for (let k = 0; k < 4; k++) for (const [name, g] of [['detailed', mushroomModel(k, true)], ['small', mushroomModel(k, false)], ['young', mushroomYoungModel(k)]] as const) {
      const [tris, pos, col, glow] = APPROVED[k][name];
      expect(g.attributes.position.count / 3).toBe(tris);
      expect(sum(g, 'position')).toBeCloseTo(pos, 1);
      expect(sum(g, 'color')).toBeCloseTo(col, 1);
      expect(sum(g, 'glow')).toBeCloseTo(glow, 1);
    }
  });
  it('builds distant silhouettes with the same outline, colours and batch-compatible attributes', () => {
    for (let k = 0; k < 4; k++) for (const [near, far, budget] of [[mushroomModel(k, true), mushroomModel(k, false, false, true), 220], [mushroomYoungModel(k), mushroomYoungModel(k, true), 220]] as const) {
      expect(far.attributes.position.count / 3).toBeLessThanOrEqual(budget);
      expect(far.index).toBeNull();
      expect(Object.keys(far.attributes).sort()).toEqual(Object.keys(near.attributes).sort());
      for (const n of Object.keys(near.attributes)) expect(far.attributes[n].itemSize).toBe(near.attributes[n].itemSize);
      near.computeBoundingBox(); far.computeBoundingBox();
      const a = near.boundingBox!, b = far.boundingBox!, sa = a.getSize(new T.Vector3()), sb = b.getSize(new T.Vector3());
      // height within 2 %, cap span within 8 % (a 12-sided rim inside the 48-sided one, without scales and gill tips)
      expect(Math.abs(sb.y - sa.y) / sa.y).toBeLessThan(0.02);
      expect(Math.abs(sb.x - sa.x) / sa.x).toBeLessThan(0.08);
      expect(Math.abs(sb.z - sa.z) / sa.z).toBeLessThan(0.08);
      // the outer skin keeps the species' paint (no striping, no darkening): area-weighted mean colour of the cap
      // (glow 0.11) and of the stem (glow 0.05), the parts a distant silhouette shows
      const mean = (g: T.BufferGeometry, glow: number) => {
        const c = g.attributes.color, p = g.attributes.position, e = g.attributes.glow, m = [0, 0, 0], a = new T.Vector3(), b = new T.Vector3(), d = new T.Vector3();
        let total = 0;
        for (let i = 0; i < p.count; i += 3) {
          if (Math.abs(e.getX(i) - glow) > 1e-6) continue;
          a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1).sub(a); d.fromBufferAttribute(p, i + 2).sub(a);
          const area = b.cross(d).length() / 2; total += area;
          for (let j = 0; j < 3; j++) { m[0] += (c.getX(i + j) * area) / 3; m[1] += (c.getY(i + j) * area) / 3; m[2] += (c.getZ(i + j) * area) / 3; }
        }
        return m.map((v) => v / total);
      };
      for (const glow of [0.11, 0.05]) {
        const ma = mean(near, glow), mb = mean(far, glow);
        for (let i = 0; i < 3; i++) expect(Math.abs(ma[i] - mb[i])).toBeLessThan(0.03);
      }
    }
  });
  it('mirrors a model so that a conjugated instance matrix reproduces the old mirrored grove exactly', () => {
    const src = mushroomModel(2, false), g = mirrorGeometry(src.clone());
    const S = new T.Matrix4().makeScale(1, 1, -1);
    const inst = new T.Matrix4().compose(new T.Vector3(181, 2.3, 162), new T.Quaternion().setFromEuler(new T.Euler(0.1, 2.2, 0.06)), new T.Vector3(1.7, 1.7, 1.7));
    const before = S.clone().multiply(inst), after = S.clone().multiply(inst).multiply(S);
    expect(after.determinant()).toBeGreaterThan(0);
    const nb = new T.Matrix3().getNormalMatrix(before), na = new T.Matrix3().getNormalMatrix(after);
    const p = src.attributes.position as T.BufferAttribute, q = g.attributes.position as T.BufferAttribute, n = src.attributes.normal, m = g.attributes.normal;
    const v = new T.Vector3(), u = new T.Vector3();
    for (let t = 0; t < p.count; t += 3) for (let c = 0; c < 3; c++) {
      const j = t + [0, 2, 1][c]; // reversed winding
      v.fromBufferAttribute(p, t + c).applyMatrix4(before); u.fromBufferAttribute(q, j).applyMatrix4(after);
      expect(u.distanceTo(v)).toBeLessThan(1e-4);
      v.fromBufferAttribute(n, t + c).applyMatrix3(nb).normalize(); u.fromBufferAttribute(m, j).applyMatrix3(na).normalize();
      expect(u.distanceTo(v)).toBeLessThan(1e-4);
    }
    // front faces: the old mirrored object rendered clockwise-front (negative determinant); the new triangles must turn
    // the opposite way in world space, i.e. counter-clockwise-front under a positive determinant
    const tri = (a: T.BufferAttribute, i: number, mtx: T.Matrix4) => [0, 1, 2].map((c) => new T.Vector3().fromBufferAttribute(a, i + c).applyMatrix4(mtx));
    for (let t = 0; t < p.count; t += 3 * 37) {
      const [a0, a1, a2] = tri(p, t, before), [b0, b1, b2] = tri(q, t, after);
      const na0 = a1.clone().sub(a0).cross(a2.clone().sub(a0)), nb0 = b1.clone().sub(b0).cross(b2.clone().sub(b0));
      if (na0.length() < 1e-9) continue;
      expect(na0.normalize().dot(nb0.normalize())).toBeLessThan(-0.999);
    }
  });
});
