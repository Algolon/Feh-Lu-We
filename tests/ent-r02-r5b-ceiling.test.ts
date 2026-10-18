import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { readFileSync } from 'node:fs';
import { buildEntranceGalleryCeilingGeometry, ENTRANCE_CEILING_BOUNDS as B } from '../src/world/entranceCeiling';
import { UCEIL } from '../src/world/layout';

describe('ENT-R02-R5B real world-aligned continuous gallery ceiling', () => {
  const close=(a:number,b:number)=>expect(a).toBeCloseTo(b,3);
  it('occupies the correct side of the world (negative Z) and exact floor height',()=>{
    const geometry=buildEntranceGalleryCeilingGeometry();
    const bound=geometry.boundingBox!;
    close(bound.min.x,B.minX);
    close(bound.max.x,B.maxX);
    close(bound.min.y,UCEIL);
    close(bound.max.y,UCEIL+B.thickness);
    close(bound.min.z,-B.backZ);
    close(bound.max.z,-B.frontZ);
    expect(bound.max.z).toBeLessThan(0);
    geometry.dispose();
  });
  it('blocks upward camera rays over the new/old join and gallery at every tested viewpoint',()=>{
    const geometry=buildEntranceGalleryCeilingGeometry();
    const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.FrontSide}));
    mesh.updateMatrixWorld(true);
    const hit=(x:number,planZ:number)=>{
      const r=new THREE.Raycaster(
        new THREE.Vector3(x,5.25,-planZ),new THREE.Vector3(0,1,0),0.01,2,
      );
      return r.intersectObject(mesh).some(i=>Math.abs(i.point.y-UCEIL)<0.002);
    };
    for(const [x,z] of [[90,77.4],[90,79.2],[90,80.4],[90,82.3],
      [86.7,79.8],[93.3,79.8],[87.1,86],[96,85]]) {
      expect(hit(x,z),`missing underside at plan X${x},Z${z}`).toBe(true);
    }
    // Preserve the outside roofline and intentional unroofed parts of the estate.
    expect(hit(84,77.4)).toBe(false);
    expect(hit(110,78.2)).toBe(false);
    mesh.material.dispose();
    geometry.dispose();
  });
  it('omits only the original outside eave that would cut through the gallery ceiling',()=>{
    const manor=readFileSync('src/world/manor.ts','utf8');
    const arch=readFileSync('src/world/arch.ts','utf8');
    const drains=readFileSync('src/world/exteriorFinish.ts','utf8');
    expect(manor).toContain('omitSouthSpan: [ENTRANCE_R02.x0 - 0.22, ENTRANCE_R02.x1 + 0.22]');
    expect(arch).toContain('const southIntervals: [number,number][]');
    expect(arch).toContain('look.omitSouthSpan');
    expect(drains).toContain('omitSouthSpan?:readonly[number,number]');
  });

});