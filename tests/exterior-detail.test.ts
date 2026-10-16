import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { Batcher, type Kit } from '../src/world/kit';
import { frontDoorLeaf, entrancePanels } from '../src/world/exteriorDetail';

describe('constructed entrance door',()=>{
  it('keeps the four fields between structural stiles and rails',()=>{
    const panels=entrancePanels(1.7,2.62);expect(panels).toHaveLength(4);
    for(const p of panels){expect(p.x0).toBeGreaterThan(.14);expect(p.x1).toBeLessThan(1.7-.14);expect(p.y0).toBeGreaterThanOrEqual(.14);expect(p.y1).toBeLessThanOrEqual(2.62-.14);}
    for(let a=0;a<panels.length;a++)for(let b=a+1;b<panels.length;b++){
      const p=panels[a],q=panels[b];expect(p.x1<=q.x0 || q.x1<=p.x0 || p.y1<=q.y0 || q.y1<=p.y0).toBe(true);
    }
  });
  it('fits the existing leaf/hit envelope and carries all fittings through the hinge transform',()=>{
    const mat=new THREE.MeshLambertMaterial({vertexColors:true}),k={M:{wood:mat,paint:mat}} as unknown as Kit;
    const b=new Batcher();frontDoorLeaf(b,k,1.7,2.62,.09,'#6b3f22');
    const leaf=new THREE.Group();b.build(leaf);leaf.updateMatrixWorld(true);
    const closed=new THREE.Box3().setFromObject(leaf);
    expect(closed.min.x).toBeGreaterThanOrEqual(-.001);expect(closed.max.x).toBeLessThanOrEqual(1.701);
    expect(closed.min.y).toBeGreaterThanOrEqual(-.001);expect(closed.max.y).toBeLessThanOrEqual(2.621);
    expect(closed.max.z-closed.min.z).toBeLessThan(.23); // no larger than the original handles' envelope
    expect(leaf.children.every(o=>o instanceof THREE.Mesh)).toBe(true);
    for(const o of leaf.children){const g=(o as THREE.Mesh).geometry;expect(Array.from(g.attributes.position.array).every(Number.isFinite)).toBe(true);}
    const hinge=new THREE.Group();hinge.add(leaf);hinge.rotation.y=1.6;hinge.updateMatrixWorld(true);
    const opened=new THREE.Box3().setFromObject(leaf);expect(opened.max.x-opened.min.x).toBeLessThan(.3);
    leaf.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});mat.dispose();
  });
});
