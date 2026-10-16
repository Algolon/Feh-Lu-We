import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { gardenPot, gardenSoil, gardenHouseplant, gardenHedge } from '../src/world/gardenkit';
import { referencePlantModel, PLANT_VARIANTS, type PlantKind } from '../src/world/woodkit';
const finite=(g:THREE.BufferGeometry)=>{for(const a of Object.values(g.attributes))expect([...a.array].every(Number.isFinite)).toBe(true);};
describe('close-view garden assets',()=>{
  it('leaves the pot opening hollow and places soil below the rim, above the inner floor',()=>{
    for(const radius of [.06,.245]){
      const h=radius*1.6,pot=gardenPot(radius,h),soil=gardenSoil(radius*.89);
      const body=new THREE.Mesh(pot,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));body.updateMatrixWorld();
      const ray=new THREE.Raycaster(new THREE.Vector3(radius*.03,h*2,0),new THREE.Vector3(0,-1,0));
      const hit=ray.intersectObject(body)[0];expect(hit).toBeDefined();expect(hit.point.y).toBeCloseTo(h*.13,5);
      const earth=new THREE.Mesh(soil,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));earth.position.y=h*.82;earth.updateMatrixWorld();
      expect(ray.intersectObject(earth)[0].point.y).toBeCloseTo(h*.82,5);finite(pot);finite(soil);pot.dispose();soil.dispose();
    }
  });
  it('provides finite curved plant surfaces and covers every clipped hedge face within a bounded cost',()=>{
    for(let v=0;v<3;v++){const g=gardenHouseplant(v);finite(g);g.computeBoundingBox();expect(g.boundingBox!.max.y).toBeLessThan(1.1);expect(g.index).toBeNull();g.dispose();}
    const g=gardenHedge(3),p=g.attributes.position;finite(g);
    for(const [axis,sign,threshold] of [['x',1,1.49],['x',-1,1.49],['z',1,.31],['z',-1,.31],['y',1,.68]] as const){
      let count=0;for(let i=0;i<p.count;i++)if((axis==='x'?p.getX(i):axis==='y'?p.getY(i):p.getZ(i))*sign>threshold)count++;
      expect(count).toBeGreaterThan(100);
    }
    expect(p.count/3).toBeLessThan(18000);g.dispose();
  });
  it('keeps all 19 refined ground plants grounded and batch-compatible with bounded added detail',()=>{
    for(const kind of Object.keys(PLANT_VARIANTS) as PlantKind[])for(let v=0;v<PLANT_VARIANTS[kind];v++){
      const g=referencePlantModel(kind,v,true,true),old=referencePlantModel(kind,v,true,false);finite(g);
      expect(g.index).toBeNull();expect(Object.keys(g.attributes).sort()).toEqual(['color','normal','position']);
      expect(g.attributes.position.count).toBeLessThan(old.attributes.position.count*4);
      g.computeBoundingBox();expect(g.boundingBox!.min.y).toBeGreaterThan(-.06);expect(g.boundingBox!.max.y).toBeLessThan(1.5);
      const n=g.attributes.normal;for(let i=0;i<n.count;i++)expect(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))).toBeCloseTo(1,4);
      g.dispose();old.dispose();
    }
  });
});
