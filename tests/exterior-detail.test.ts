import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { Batcher, type Kit } from '../src/world/kit';
import { frontDoorLeaf, horizontalDoorBoards } from '../src/world/exteriorDetail';

describe('FRONT-R01 horizontal timber entrance door',()=>{
  it('has seven full-width horizontal boards with narrow even seams, inside the old opening',()=>{
    const boards=horizontalDoorBoards(1.7,2.62);
    expect(boards).toHaveLength(7);
    for(let i=0;i<boards.length;i++){
      const p=boards[i];
      expect(p.x0).toBeGreaterThanOrEqual(.043);
      expect(p.x1).toBeLessThanOrEqual(1.7-.043);
      expect(p.x1-p.x0).toBeGreaterThan(1.5);
      expect(p.y0).toBeGreaterThan(0);
      expect(p.y1).toBeLessThan(2.62);
      if(i) expect(p.y0-boards[i-1].y1).toBeCloseTo(.008,5);
    }
  });
  it('keeps original dimensions, hinge space and sane geometry with both grips and lion relief',()=>{
    const mat=new THREE.MeshLambertMaterial({vertexColors:true});
    const k={M:{wood:mat,paint:mat}} as unknown as Kit;
    const b=new Batcher();
    frontDoorLeaf(b,k,1.7,2.62,.09,'#6b3f22');
    const leaf=new THREE.Group();b.build(leaf);leaf.updateMatrixWorld(true);
    const closed=new THREE.Box3().setFromObject(leaf);
    expect(closed.min.x).toBeGreaterThanOrEqual(-.001);
    expect(closed.max.x).toBeLessThanOrEqual(1.701);
    expect(closed.min.y).toBeGreaterThanOrEqual(-.001);
    expect(closed.max.y).toBeLessThanOrEqual(2.621);
    expect(closed.max.z-closed.min.z).toBeLessThan(.27);
    expect(closed.max.z).toBeGreaterThan(.11); // negative plan Z faces outside (+Three.js Z)
    expect(leaf.children.length).toBeGreaterThan(0);
    expect(leaf.children.every(o=>o instanceof THREE.Mesh)).toBe(true);
    for(const o of leaf.children){
      const g=(o as THREE.Mesh).geometry;
      expect(Array.from(g.attributes.position.array).every(Number.isFinite)).toBe(true);
      expect(g.index).toBeNull(); // merged opaque batches
    }
    const hinge=new THREE.Group();hinge.add(leaf);
    hinge.rotation.y=1.6;hinge.updateMatrixWorld(true);
    const opened=new THREE.Box3().setFromObject(leaf);
    expect(opened.max.x-opened.min.x).toBeLessThan(.32); // sculpted knocker projects beyond flat leaf
    leaf.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});
    mat.dispose();
  });
});
