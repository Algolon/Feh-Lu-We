import { describe, it, expect } from 'vitest';
import { treeLodProfile, selectTreeLod } from '../src/world/vegetationLod';
import { treeModel, type TreeSpecies } from '../src/world/woodkit';

describe('VEG-R01 selection and model continuity',()=>{
  it('keeps symmetric hysteresis without oscillation at every boundary',()=>{
    for(const name of ['baseline','a','b','hybrid']) {
      const p=treeLodProfile(name);
      p.distances.forEach((d,i)=>{
        expect(selectTreeLod(d-2.9,i+1,p.distances,3)).toBe(i+1);
        expect(selectTreeLod(d-3.1,i+1,p.distances,3)).toBe(i);
        expect(selectTreeLod(d+2.9,i,p.distances,3)).toBe(i);
        expect(selectTreeLod(d+3.1,i,p.distances,3)).toBe(i+1);
      });
    }
  });
  it('retains the exact baseline selection rule and rejects unknown profiles',()=>{
    const p=treeLodProfile('baseline');
    for(let d=0;d<120;d+=.2)for(let previous=0;previous<4;previous++){
      let expected=0;while(expected<3&&d>=p.distances[expected]+(previous<=expected?3:-3))expected++;
      expect(selectTreeLod(d,previous,p.distances,3)).toBe(expected);
    }
    expect(treeLodProfile('unknown').id).toBe(treeLodProfile().id);
  });
  it('preserves every near model byte-for-byte; all candidate geometry is finite and bounded',()=>{
    for(const species of ['oak','beech','birch','pine'] as TreeSpecies[])for(let v=0;v<3;v++){
      const base=treeModel(species,v,'near'),b=treeModel(species,v,'near',true);
      expect([...b.wood.attributes.position.array]).toEqual([...base.wood.attributes.position.array]);
      expect([...b.leaves.attributes.position.array]).toEqual([...base.leaves.attributes.position.array]);
      for(const mode of [true,'outline'] as const)for(const lod of ['mid','far','xfar'] as const){
        const m=treeModel(species,v,lod,mode);
        for(const g of [m.wood,m.leaves]){
          expect([...g.attributes.position.array].every(Number.isFinite)).toBe(true);g.computeBoundingBox();
          const n=base.leaves; n.computeBoundingBox();
          expect(g.boundingBox!.max.y).toBeLessThan(18);
          g.dispose();
        }
      }
      for(const m of [base,b]){m.wood.dispose();m.leaves.dispose();}
    }
  });
});
