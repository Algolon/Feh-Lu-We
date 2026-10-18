import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ENTRANCE_APRON_R4 } from '../src/world/arrivalStudy';
import { ENTRANCE_POTS } from '../src/world/exteriorGreenery';
import { ENTRANCE_R02 as E } from '../src/world/layout';

describe('ENT-R02-R4 finished join and entrance exterior apron', () => {
  it('keeps all entrance pavers outside the enlarged manor with no buried legacy extension', () => {
    expect(ENTRANCE_APRON_R4).toHaveLength(3);
    for(const r of ENTRANCE_APRON_R4) {
      expect(r.z1).toBeLessThan(E.faceZ);
      expect(r.x0).toBeLessThan(r.x1);
      expect(r.z0).toBeLessThan(r.z1);
    }
    const src=readFileSync('src/world/arrivalStudy.ts','utf8');
    expect(src).not.toContain('z1:78.16');
    expect(src).toContain('for (const area of ENTRANCE_APRON_R4) paving');
  });
  it('places both 0.39m radius urns on the new shoulder pavers and away from front wall',()=>{
    const [west,east]=ENTRANCE_POTS;
    expect(west.x).toBeCloseTo(86.7,4);
    expect(east.x).toBeCloseTo(93.3,4);
    expect(west.z).toBeCloseTo(75.75,4);
    expect(east.z).toBeCloseTo(75.75,4);
    for(const pot of ENTRANCE_POTS) {
      const margin=0.39;
      expect(pot.z+margin).toBeLessThan(E.faceZ);
      const shoulder=ENTRANCE_APRON_R4.find(r=>
        pot.x-margin>=r.x0 && pot.x+margin<=r.x1 &&
        pot.z-margin>=r.z0 && pot.z+margin<=r.z1);
      expect(shoulder).toBeDefined();
    }
  });
  it('makes uninterrupted entrance soffit and upstairs plaster ceiling without old Z80.4 join',()=>{
    const s=readFileSync('src/world/manor.ts','utf8');
    expect(s).toContain('slab(ENTRANCE_R02.x0, ENTRANCE_R02.x1, ENTRANCE_R02.faceZ, 84)');
    expect(s).not.toContain('slab(85, 95, 80.4, 84)');
    expect(s).toContain('const ceilingSolid = new THREE.ExtrudeGeometry(ceilingPlan)');
    expect(s).toContain('ceilingPlan.lineTo(ENTRANCE_R02.x0, ENTRANCE_R02.faceZ)');
    expect(s).toContain('ceilingPlan.lineTo(ENTRANCE_R02.x1, ENTRANCE_R02.faceZ)');
    expect(s).toContain('ceilingSolid.rotateX(Math.PI / 2)');
    expect(s).not.toContain('ceiling(c, ENTRANCE_R02.x0, ENTRANCE_R02.x1, ENTRANCE_R02.faceZ, ENTRANCE_R02.joinZ');
  });
  it('connects inner-wall returns on both stories but does not change exterior door/colliders',()=>{
    const s=readFileSync('src/world/manor.ts','utf8');
    expect(s).toContain('const sideWallJoinZ = 80.54');
    expect(s).not.toContain('sideX - 0.222, sideX + 0.222');
    expect(s).not.toContain('sideWallJoinZ + 0.032');
    expect(s).not.toContain('innerFaceX - 0.018, innerFaceX + 0.018');
    expect(s).not.toContain('a genuine plaster corner pier');
    expect(s).toContain("frameOpenings: !face.id.startsWith('south-')");
    const walls=readFileSync('src/world/arch.ts','utf8');
    expect(walls).toContain('A 100%-height structural arch has no wall ABOVE it');
    expect(walls).toContain('PLASTER END CAPS');
    // The carved swallows extend into the old/new rear-wall junction:
    // any fake finish boxes here will hide part of the sculpture.
    const art=readFileSync('src/content/props3d.ts','utf8');
    expect(art).toContain("x: 93.37, y: UF + 1.72, z: 79.30");
    expect(s).toContain("id: 'door.entranceHall'");
    expect(s).toContain("id: 'door.front'");
  });
});