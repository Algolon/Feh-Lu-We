import { describe,expect,it } from 'vitest';
import { indoorPlantModel,INDOOR_FAMILIES,INDOOR_VARIANTS,chooseIndoorFamily } from '../src/world/indoorPlants';
import { GREEN_BRIEFS,greenPointClear } from '../src/world/interiorGreenery';
import { ROOMS } from '../src/world/roomdefs';
import { CollisionWorld } from '../src/player/collision';
describe('botanical families and interior planting',()=>{
  it('provides seven recognisable families with three distinct finite variants and valid atlas coordinates',()=>{
    expect(INDOOR_FAMILIES.length).toBe(7);expect(INDOOR_VARIANTS).toBe(3);
    for(const family of INDOOR_FAMILIES){const signatures=new Set<string>();for(let v=0;v<3;v++){
      const g=indoorPlantModel(family,v);expect(g.index).toBeNull();expect(Object.keys(g.attributes).sort()).toEqual(['color','normal','position','uv']);
      for(const a of Object.values(g.attributes))expect([...a.array].every(Number.isFinite)).toBe(true);
      const uv=g.attributes.uv;for(const n of uv.array)expect(n).toBeGreaterThanOrEqual(0);for(const n of uv.array)expect(n).toBeLessThanOrEqual(1);
      g.computeBoundingBox();expect(g.boundingBox!.min.y).toBeGreaterThan(-1.6);expect(g.boundingBox!.max.y).toBeLessThan(1.6);
      signatures.add(`${g.attributes.position.count}:${g.boundingBox!.max.y}:${g.boundingBox!.min.y}`);
      expect(g.attributes.position.count/3).toBeLessThan(14000);
    }expect(signatures.size).toBe(3);}
  });
  it('authors at least one anchor for every domestic room, with groups concentrated in larger rooms',()=>{
    const excluded=['bstair','atticStair'];
    const domestic=ROOMS.filter(r=>['g','u','a'].includes(r.floor)&&!excluded.includes(r.id));
    for(const room of domestic)expect(GREEN_BRIEFS.some(b=>b.room===room.id),room.id).toBe(true);
    expect(GREEN_BRIEFS.some(b=>b.room==='cottageEntry')).toBe(true);expect(GREEN_BRIEFS.some(b=>b.room==='cottageRoom')).toBe(true);
    expect(GREEN_BRIEFS.filter(b=>b.hang).length).toBeLessThan(5);
    expect(chooseIndoorFamily(85.7,80.9)).not.toBe(chooseIndoorFamily(94.3,80.9));
  });
  it('rejects furniture, water and full door swings instead of planting into them',()=>{
    const w=new CollisionWorld();w.addBox(1,2,1,2,0,2);w.addCircle(4,4,.3,0,2);w.addEllipse(8,8,1,1,0,2);
    for(const [x,z] of [[1.2,1.2],[4,4],[8,8]])expect(greenPointClear(x,z,0,.25,1,w.colliders,[])).toBe(false);
    expect(greenPointClear(5,5,0,.25,1,w.colliders,[{id:'door',x0:4.9,x1:5.8,z0:4.9,z1:5.1,y0:0,y1:2}])).toBe(false);
    expect(greenPointClear(6,2,0,.25,1,w.colliders,[])).toBe(true);
  });
});
