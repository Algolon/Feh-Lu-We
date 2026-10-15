// VEG-ART-R02: the opt-in oak sculpt preserves the legacy placement/rendering contract.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { oakModel, oakSculptModel, treeModel, OAK_SCULPT_PREVIEW, LEAF_U, type Lod } from '../src/world/woodkit';

const tris = (g: THREE.BufferGeometry) => (g.index ? g.index.count : g.attributes.position.count) / 3;
const size = (g: THREE.BufferGeometry) => {
  g.computeBoundingBox();
  return g.boundingBox!.getSize(new THREE.Vector3());
};
const dispose = (m: { wood: THREE.BufferGeometry; leaves: THREE.BufferGeometry }) => {
  m.wood.dispose();
  m.leaves.dispose();
};

describe('VEG-ART-R02 opt-in oak canopy', () => {
  it('keeps the ordinary model as default, with no production art toggle', () => {
    expect(OAK_SCULPT_PREVIEW).toBe(false);
    const a = treeModel('oak', 0, 'near'), b = oakModel(0, 'near');
    expect([...a.leaves.attributes.position.array]).toEqual([...b.leaves.attributes.position.array]);
    dispose(a); dispose(b);
  });

  it('retains trunk, visible tree height, and existing footprint-dependent branch skeleton', () => {
    for (let variant = 0; variant < 3; variant++) {
      const a = oakModel(variant, 'near'), b = oakSculptModel(variant, 'near');
      expect([...b.wood.attributes.position.array]).toEqual([...a.wood.attributes.position.array]);
      expect([...b.leaves.attributes.position.array]).not.toEqual([...a.leaves.attributes.position.array]);
      expect(size(b.leaves).x).toBeGreaterThan(size(b.leaves).y * 1.2);
      dispose(a); dispose(b);
    }
  });

  it('provides deterministic finite batch-ready geometry for every oak variant and LOD', () => {
    const lods: Lod[] = ['near', 'mid', 'far', 'xfar'];
    const caps: Record<Lod, number> = { near: 3200, mid: 1300, far: 900, xfar: 900 };
    for (let variant = 0; variant < 3; variant++) for (const lod of lods) {
      const m = oakSculptModel(variant, lod, 'outline');
      for (const g of [m.wood, m.leaves]) {
        expect(tris(g)).toBeGreaterThan(0);
        for (const key of ['position', 'normal', 'color', 'uv']) {
          const attr = g.attributes[key] as THREE.BufferAttribute;
          expect(attr, `${variant} ${lod} ${key}`).toBeDefined();
          expect([...attr.array].every(Number.isFinite), `${variant} ${lod} ${key}`).toBe(true);
        }
      }
      expect(tris(m.wood) + tris(m.leaves), `${variant} ${lod}`).toBeLessThan(caps[lod]);
      const uv = m.leaves.attributes.uv as THREE.BufferAttribute;
      for (let i = 0; i < uv.count; i += 13) expect(uv.getX(i)).toBeGreaterThan(LEAF_U / 2);
      const repeat = oakSculptModel(variant, lod, 'outline');
      expect([...repeat.leaves.attributes.position.array]).toEqual([...m.leaves.attributes.position.array]);
      dispose(repeat); dispose(m);
    }
  });

  it('shares the broad crown envelope across near/mid/far without new LOD origins', () => {
    for (let variant = 0; variant < 3; variant++) {
      const models = (['near', 'mid', 'far', 'xfar'] as const).map((lod) => oakSculptModel(variant, lod, 'outline'));
      const near = size(models[0].leaves);
      for (const m of models.slice(1)) {
        const s = size(m.leaves);
        for (const axis of ['x', 'y', 'z'] as const) {
          expect(Math.abs(s[axis] - near[axis]) / near[axis], `${variant} ${axis}`).toBeLessThan(0.30);
        }
      }
      models.forEach(dispose);
    }
  });
});
