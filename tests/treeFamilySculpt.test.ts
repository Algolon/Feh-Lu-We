import { describe, expect, it } from 'vitest';
import { referenceTreeModel } from '../src/world/woodkit';

const dispose = (m: ReturnType<typeof referenceTreeModel>) => { m.wood.dispose(); m.leaves.dispose(); };
describe('tree family reference continuation', () => {
  it('preserves the approved oak exactly and changes only foliage colour on birch', () => {
    for (const sp of ['oak', 'birch'] as const) for (let v = 0; v < 3; v++) for (const lod of ['near','mid','far','xfar'] as const) {
      const a = referenceTreeModel(sp,v,lod,'outline','oak-r03'), b = referenceTreeModel(sp,v,lod,'outline','trees-r03');
      for (const attr of Object.keys(a.wood.attributes)) expect(b.wood.attributes[attr].array).toEqual(a.wood.attributes[attr].array);
      expect(b.wood.index?.array).toEqual(a.wood.index?.array);
      for (const attr of Object.keys(a.leaves.attributes)) if (sp === 'oak' || attr !== 'color') expect(b.leaves.attributes[attr].array).toEqual(a.leaves.attributes[attr].array);
      dispose(a); dispose(b);
    }
  });
  it('preserves grounded beech roots and pine attachment rings while refining their stems', () => {
    for (const sp of ['beech','pine'] as const) for (let v = 0; v < 3; v++) for (const lod of ['near','mid','far','xfar'] as const) {
      const a = referenceTreeModel(sp,v,lod,'outline','recovered'), b = referenceTreeModel(sp,v,lod,'outline','trees-r03');
      const p = a.wood.attributes.position, q = b.wood.attributes.position;
      let previousY = -Infinity, checked = 0;
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i); if (y < previousY - .01) break;
        // Sculpted beech folds now grow from .2 m upward, as explicitly requested in the relief reference.
        // Its grounded footprint stays fixed; the unchanged pine retains all low attachment rings.
        if (y <= (sp === 'beech' ? .15 : 1.6)) { expect([q.getX(i),q.getY(i),q.getZ(i)]).toEqual([p.getX(i),y,p.getZ(i)]); checked++; }
        previousY = y;
      }
      expect(checked).toBeGreaterThan(10); dispose(a); dispose(b);
    }
  });
  it('keeps all new variants finite with unit normals and stable mid/far foliage shape and colour', () => {
    for (const sp of ['beech','pine','birch'] as const) for (let v = 0; v < 3; v++) {
      for (const lod of ['near','mid','far','xfar'] as const) {
        const m = referenceTreeModel(sp,v,lod,'outline','trees-r03');
        for (const g of [m.wood,m.leaves]) {
          for (const a of Object.values(g.attributes)) expect([...a.array].every(Number.isFinite)).toBe(true);
          const n=g.attributes.normal; for(let i=0;i<n.count;i++)expect(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))).toBeCloseTo(1,4);
          g.computeBoundingBox(); expect(g.boundingBox!.max.y).toBeLessThan(17);
        }
        dispose(m);
      }
      const a=referenceTreeModel(sp,v,'mid','outline','trees-r03'),b=referenceTreeModel(sp,v,'far','outline','trees-r03');
      for(const attr of ['position','normal','color','uv'])expect(a.leaves.attributes[attr].array).toEqual(b.leaves.attributes[attr].array);
      dispose(a);dispose(b);
    }
  });
});
