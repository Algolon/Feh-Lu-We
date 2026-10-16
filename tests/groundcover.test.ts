import { describe, expect, it } from 'vitest';
import { PLANT_VARIANTS, referencePlantModel, type PlantKind } from '../src/world/woodkit';

describe('sculpted ground cover', () => {
  it('keeps every plant deterministic, batch-compatible and within its ground-cover envelope', () => {
    for(const kind of Object.keys(PLANT_VARIANTS) as PlantKind[])for(let v=0;v<PLANT_VARIANTS[kind];v++){
      const g=referencePlantModel(kind,v,true),repeat=referencePlantModel(kind,v,true),previous=referencePlantModel(kind,v,false);
      expect(g.index).toBeNull();expect(Object.keys(g.attributes).sort()).toEqual(['color','normal','position']);
      for(const attr of Object.values(g.attributes))expect([...attr.array].every(Number.isFinite)).toBe(true);
      expect(g.attributes.position.array).toEqual(repeat.attributes.position.array);
      const pos=g.attributes.position,col=g.attributes.color,norm=g.attributes.normal;
      expect(col.count).toBe(pos.count);expect(norm.count).toBe(pos.count);
      for(let i=0;i<norm.count;i++)expect(Math.hypot(norm.getX(i),norm.getY(i),norm.getZ(i))).toBeCloseTo(1,4);
      g.computeBoundingBox();expect(g.boundingBox!.min.y).toBeGreaterThan(-.06);expect(g.boundingBox!.max.y).toBeLessThan(1.5);
      expect(g.boundingBox!.max.x-g.boundingBox!.min.x).toBeLessThan(2);expect(g.boundingBox!.max.z-g.boundingBox!.min.z).toBeLessThan(2);
      expect(pos.count).toBeLessThanOrEqual(previous.attributes.position.count*4);
      if(kind==='grass')expect(pos.count).toBeLessThanOrEqual(previous.attributes.position.count*2);
      for(const item of [g,repeat,previous])item.dispose();
    }
  });
});
