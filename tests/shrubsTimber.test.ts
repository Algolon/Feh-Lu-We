import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { referenceBushModel, referenceStumpModel, referenceBranchModel, logModel } from '../src/world/woodkit';
import { meshAudit } from '../src/world/propkit';

describe('shrubs and sculpted dead wood', () => {
  it('keeps shrub variants finite and their mid/far foliage stable, with bounded larger crowns', () => {
    for(const species of ['hazel','holly'] as const)for(let v=0;v<3;v++){
      for(const lod of ['near','far'] as const){
        const m=referenceBushModel(species,v,lod,true);
        for(const g of [m.wood,m.leaves])for(const a of Object.values(g.attributes))expect([...a.array].every(Number.isFinite)).toBe(true);
        m.leaves.computeBoundingBox();expect(m.leaves.boundingBox!.max.y).toBeLessThan(3.5);expect(m.leaves.boundingBox!.min.y).toBeGreaterThan(-.6);
        m.wood.dispose();m.leaves.dispose();
      }
      const a=referenceBushModel(species,v,'mid',true),b=referenceBushModel(species,v,'far',true);
      for(const attr of ['position','color','uv'])expect(a.leaves.attributes[attr].array).toEqual(b.leaves.attributes[attr].array);
      a.wood.dispose();a.leaves.dispose();b.wood.dispose();b.leaves.dispose();
    }
  });
  it('keeps the relieved log ends, branch stubs and irregular stump cuts closed with outward winding', () => {
    const pieces=[referenceStumpModel(true),...Array.from({length:3},(_,v)=>referenceBranchModel(v,true)),...Array.from({length:4},(_,v)=>logModel(91+v*7,2+v*.4,.18+v*.03,{detail:true}))];
    for(const g of pieces){
      expect(meshAudit(g).open).toBe(0);expect(meshAudit(g).flipped).toBe(0);
      for(const a of Object.values(g.attributes))expect([...a.array].every(Number.isFinite)).toBe(true);
      const p=g.attributes.position,ix=g.index!.array,a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();let volume=0;
      for(let i=0;i<ix.length;i+=3){a.fromBufferAttribute(p,ix[i]);b.fromBufferAttribute(p,ix[i+1]);c.fromBufferAttribute(p,ix[i+2]);volume+=a.dot(b.cross(c))/6;}
      expect(volume).toBeGreaterThan(0);g.dispose();
    }
  });
});
