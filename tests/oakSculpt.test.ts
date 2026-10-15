import { describe, expect, it } from 'vitest';
import { oakSculptModel, referenceTreeModel } from '../src/world/woodkit';

describe('oak reference study', () => {
  it('retains the lower trunk attachment surface at every LOD and bounds the new canopy', () => {
    for (let v = 0; v < 3; v++) for (const lod of ['near', 'mid', 'far', 'xfar'] as const) {
      const old = referenceTreeModel('oak', v, lod, 'outline', 'recovered'), next = oakSculptModel(v, lod);
      const a = old.wood.attributes.position, b = next.wood.attributes.position;
      // The trunk comes first in the merged wood; stop before the first branch after its top ring.
      let lastY = -Infinity;
      for (let i = 0; i < a.count; i++) {
        const y = a.getY(i);
        if (y < lastY - .01) break;
        if (y <= 1.6) expect([b.getX(i), b.getY(i), b.getZ(i)]).toEqual([a.getX(i), y, a.getZ(i)]);
        lastY = y;
      }
      for (const g of [next.wood, next.leaves]) {
        for (const attr of Object.values(g.attributes)) expect([...attr.array].every(Number.isFinite)).toBe(true);
        g.computeBoundingBox(); expect(g.boundingBox!.max.y).toBeLessThan(12);
      }
      expect(next.leaves.index!.count).toBe(old.leaves.index!.count);
      old.wood.dispose(); old.leaves.dispose(); next.wood.dispose(); next.leaves.dispose();
    }
  });
  it('keeps foliage position and colour identical between mid/far and varies palettes between trees', () => {
    const colours = [];
    for (let v = 0; v < 3; v++) {
      const a = oakSculptModel(v, 'mid'), b = oakSculptModel(v, 'far');
      expect(a.leaves.attributes.position.array).toEqual(b.leaves.attributes.position.array);
      expect(a.leaves.attributes.color.array).toEqual(b.leaves.attributes.color.array);
      colours.push(a.leaves.attributes.color.getX(0));
      a.wood.dispose(); a.leaves.dispose(); b.wood.dispose(); b.leaves.dispose();
    }
    expect(new Set(colours).size).toBe(3);
  });
});
