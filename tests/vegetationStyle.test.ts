import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { birchReferenceModel, treeModel, referenceTreeModel, referenceBushModel, referencePlantModel, referenceStumpModel, referenceHedgeModel, referenceCypressModel, referenceBranchModel, PLANT_VARIANTS, type PlantKind } from '../src/world/woodkit';
import { meshAudit } from '../src/world/propkit';
import { LEAF_FAMILIES, natureStyle } from '../src/world/foliageStyle';

describe('VEG-R02 birch prototype compatibility', () => {
  it('retains branch and trunk geometry at every LOD, including clue attachment surfaces', () => {
    for (let v = 0; v < 3; v++) for (const lod of ['near', 'mid', 'far', 'xfar'] as const) {
      const old = treeModel('birch', v, lod, 'outline'), next = birchReferenceModel(v, lod);
      expect(next.wood.attributes.position.array).toEqual(old.wood.attributes.position.array);
      expect(next.wood.index?.array).toEqual(old.wood.index?.array);
      for (const m of [old, next]) { m.wood.dispose(); m.leaves.dispose(); }
    }
  });
  it('produces finite, deterministic geometry with valid normals and bounded crown detail', () => {
    for (let v = 0; v < 3; v++) for (const lod of ['near', 'mid', 'far', 'xfar'] as const) {
      const a = birchReferenceModel(v, lod), b = birchReferenceModel(v, lod);
      expect(a.leaves.attributes.position.array).toEqual(b.leaves.attributes.position.array);
      for (const attr of Object.values(a.leaves.attributes)) expect([...attr.array].every(Number.isFinite)).toBe(true);
      const n = a.leaves.attributes.normal;
      for (let i = 0; i < n.count; i++) expect(Math.hypot(n.getX(i), n.getY(i), n.getZ(i))).toBeCloseTo(1, 4);
      a.leaves.computeBoundingBox();
      expect(a.leaves.boundingBox!.max.y).toBeLessThan(14);
      expect(a.leaves.boundingBox!.min.y).toBeGreaterThan(2);
      for (const m of [a, b]) { m.wood.dispose(); m.leaves.dispose(); }
    }
  });
});

describe('VEG-R02 complete vegetation families',()=>{
  const triangles=(g:THREE.BufferGeometry)=>(g.index?.count??g.attributes.position.count)/3;
  it('keeps all structural tree identities and attachment surfaces while replacing every crown',()=>{
    for(const species of ['oak','beech','birch','pine'] as const)for(let v=0;v<3;v++)for(const lod of ['near','mid','far'] as const){
      const old=treeModel(species,v,lod,'outline'),next=referenceTreeModel(species,v,lod);
      expect(next.wood.attributes.position.array).toEqual(old.wood.attributes.position.array);
      expect(triangles(next.wood)+triangles(next.leaves)).toBeLessThan(lod==='near'?4000:1800);
      expect([...next.leaves.attributes.position.array].every(Number.isFinite)).toBe(true);
      const uv=next.leaves.attributes.uv;
      for(let i=0;i<uv.count;i++){
        const tile=Math.floor((uv.getX(i)-128)/2);expect(tile).toBe(LEAF_FAMILIES.indexOf(species));
        expect(uv.getY(i)).toBeGreaterThanOrEqual(0);expect(uv.getY(i)).toBeLessThanOrEqual(1);
      }
      for(const m of [old,next]){m.wood.dispose();m.leaves.dispose();}
    }
  });
  it('uses identical foliage anchors through mid/far to prevent distance-driven crown disappearance',()=>{
    for(const sp of ['oak','beech','birch','pine'] as const)for(let v=0;v<3;v++){
      const a=referenceTreeModel(sp,v,'mid'),b=referenceTreeModel(sp,v,'far');
      expect(a.leaves.attributes.position.array).toEqual(b.leaves.attributes.position.array);
      a.leaves.computeBoundingBox();const box=a.leaves.boundingBox!;expect(box.max.y).toBeLessThan(17);expect(box.min.y).toBeGreaterThan(1);
      a.wood.dispose();a.leaves.dispose();b.wood.dispose();b.leaves.dispose();
    }
  });
  it('keeps every bush and ground-cover variant finite and compatible with the existing flat batch',()=>{
    for(const sp of ['hazel','holly'] as const)for(let v=0;v<3;v++)for(const lod of ['near','far'] as const){
      const m=referenceBushModel(sp,v,lod);expect([...m.leaves.attributes.position.array].every(Number.isFinite)).toBe(true);expect(triangles(m.wood)+triangles(m.leaves)).toBeLessThan(3500);m.wood.dispose();m.leaves.dispose();
    }
    for(const kind of Object.keys(PLANT_VARIANTS) as PlantKind[])for(let v=0;v<PLANT_VARIANTS[kind];v++){
      const g=referencePlantModel(kind,v);expect(g.index).toBeNull();expect(Object.keys(g.attributes).sort()).toEqual(['color','normal','position']);
      for(const a of Object.values(g.attributes))expect([...a.array].every(Number.isFinite)).toBe(true);
      expect(triangles(g)).toBeLessThan(1200);g.computeBoundingBox();expect(g.boundingBox!.min.y).toBeGreaterThanOrEqual(-.005);g.dispose();
    }
  });
  it('makes closed stumps and fallen branches with outward winding and keeps the hedge/cypress grounded',()=>{
    for(const g of [referenceStumpModel(),referenceBranchModel(0),referenceBranchModel(1),referenceBranchModel(2)]){
      expect(meshAudit(g).open).toBe(0);expect(meshAudit(g).flipped).toBe(0);
      const p=g.attributes.position,ix=g.index!.array;let volume=0;
      const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
      for(let i=0;i<ix.length;i+=3){a.fromBufferAttribute(p,ix[i]);b.fromBufferAttribute(p,ix[i+1]);c.fromBufferAttribute(p,ix[i+2]);volume+=a.dot(b.cross(c))/6;}
      expect(volume).toBeGreaterThan(0);g.dispose();
    }
    for(const g of [referenceHedgeModel(12.3),referenceCypressModel()]){expect([...g.attributes.position.array].every(Number.isFinite)).toBe(true);g.computeBoundingBox();expect(g.boundingBox!.min.y).toBeLessThan(.05);g.dispose();}
  });
  it('retains explicit old/birch-only comparisons alongside the complete style',()=>{
    expect(natureStyle('baseline')).toBe('baseline');expect(natureStyle('birch-r02')).toBe('birch-r02');expect(natureStyle(null)).toBe('woodland-r02');expect(natureStyle('unknown')).toBe('woodland-r02');
  });
});
