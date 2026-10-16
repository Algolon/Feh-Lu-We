import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { castBronzeMetal, lionHeadReliefGeometry, LION_BRONZE } from '../src/world/lionKnocker';
import { Batcher, type Kit } from '../src/world/kit';
import { frontDoorLeaf } from '../src/world/exteriorDetail';
import { readFileSync } from 'node:fs';

describe('FRONT-R04 - authored 3D lion sculpture, bronze hardware, narrow steel joinery',()=>{
  it('loads one continuous closed volumetric sculpture with authored patina',()=>{
    const g=lionHeadReliefGeometry();
    const p=g.getAttribute('position') as THREE.BufferAttribute;
    const c=g.getAttribute('color') as THREE.BufferAttribute;
    expect(g.userData.keepColor).toBe(true);
    expect(p.count).toBeGreaterThan(1000);
    expect(g.index!.count/3).toBeLessThan(55000); // explicit high-detail sculpt, capped for mobile
    expect(g.index!.count/3).toBeGreaterThan(20000); // reject fallback to R03's flat procedural relief
    expect(g.getAttribute('normal').count).toBe(p.count);
    const box=new THREE.Box3().setFromBufferAttribute(p);
    expect(box.max.x-box.min.x).toBeLessThan(.36); // true ears + cast mane extend beyond the old flat oval
    expect(box.min.x).toBeGreaterThan(-.18);
    expect(box.max.x).toBeLessThan(.18); // verify no grid-edge clipping
    expect(box.max.y-box.min.y).toBeGreaterThan(.27);
    expect(box.max.y-box.min.y).toBeLessThan(.41);
    expect(box.min.y).toBeGreaterThan(-.207);
    expect(box.max.y).toBeLessThan(.211);
    expect(box.max.z-box.min.z).toBeGreaterThan(.095);
    expect(box.max.z-box.min.z).toBeLessThan(.22); // true volumetric profile, no excessively protruding relief
    expect(Array.from(p.array).every(Number.isFinite)).toBe(true);
    expect(Array.from(c.array).every(Number.isFinite)).toBe(true);
    // Every vertex in the sculpt belongs to the sole connected mesh.
    const parent=Array.from({length:p.count},(_,i)=>i);
    const find=(n:number):number=>parent[n]===n?n:(parent[n]=find(parent[n]));
    const unite=(a:number,b:number)=>{parent[find(a)]=find(b);};
    for(let i=0;i<g.index!.count;i+=3){
      const a=g.index!.getX(i),b=g.index!.getX(i+1),c=g.index!.getX(i+2);
      unite(a,b);unite(a,c);
    }
    expect(new Set(parent.map((_,i)=>find(i))).size).toBe(1);
    // Dark bronze with localized warm highlights instead of flat orange-brown paint.
    const lightness=Array.from({length:c.count},(_,i)=>c.getX(i)+c.getY(i)+c.getZ(i));
    expect(Math.max(...lightness)-Math.min(...lightness)).toBeGreaterThan(.045);
    expect(Math.max(...Array.from(c.array))).toBeLessThan(.60); // true blackened bronze, not ivory
    expect(LION_BRONZE.recess).toBe('#242322');
    g.dispose();
  });

  it('preserves the exact 1.7 m front door footprint, swing clearance and batched hardware',()=>{
    const mat=new THREE.MeshLambertMaterial({vertexColors:true});
    const k={M:{wood:mat,paint:mat}} as unknown as Kit;
    const b=new Batcher();
    frontDoorLeaf(b,k,1.7,2.62,.09,'#6b3f22');
    const leaf=new THREE.Group();b.build(leaf);leaf.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(leaf);
    expect(bounds.min.x).toBeGreaterThanOrEqual(-.001);
    expect(bounds.max.x).toBeLessThanOrEqual(1.701);
    expect(bounds.max.y).toBeLessThanOrEqual(2.621);
    expect(bounds.min.y).toBeGreaterThanOrEqual(-.001);
    expect(bounds.max.z-bounds.min.z).toBeLessThan(.35); // full sculptural head and matching pulls
    const hinge=new THREE.Group();hinge.add(leaf);hinge.rotation.y=1.6;
    hinge.updateMatrixWorld(true);
    const opened=new THREE.Box3().setFromObject(leaf);
    expect(opened.max.x-opened.min.x).toBeLessThan(.40); // measured cast relief projects 37cm at this swing
    leaf.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});mat.dispose();
  });

  it('matches handle and lion through the SAME bronze vertex-patina system',()=>{
    const pull=castBronzeMetal(new THREE.CylinderGeometry(.018,.018,1.13,16,1));
    expect(pull.userData.keepColor).toBe(true);
    const col=pull.getAttribute('color') as THREE.BufferAttribute;
    const tones=Array.from({length:col.count},(_,i)=>col.getX(i)+col.getY(i)+col.getZ(i));
    expect(Math.max(...tones)-Math.min(...tones)).toBeGreaterThan(.03);
    const source=readFileSync(new URL('../src/world/exteriorDetail.ts',import.meta.url).pathname,'utf8');
    expect(source).toContain("const pull=castBronzeMetal(");
    expect(source).toContain("addLionKnocker(b,metal");
    expect(source).not.toContain("'#946a43'");
    pull.dispose();
  });

  it('uses narrow front-door-specific metal joinery, not the old oak head cap and plinths',()=>{
    const arch=readFileSync(new URL('../src/world/arch.ts',import.meta.url).pathname,'utf8');
    const manor=readFileSync(new URL('../src/world/manor.ts',import.meta.url).pathname,'utf8');
    expect(arch).toContain("const L=t/2+.005, lip=.0024, casing=.018");
    expect(arch).toContain("const innerLiner=col"); // R04-R01: interior jamb follows black metal frame
    expect(arch).toContain("B(s-.0162,s+lip,y0,y1,-L,L,innerLiner)");
    expect(arch).toContain("B(e-lip,e+.0162,y0,y1,-L,L,innerLiner)");
    expect(arch).toContain("B(s-.0162,e+.0162,y1-lip,y1+.0162,-L,L,innerLiner)");
    expect(arch).not.toContain("const stoneReveal='#d7d0bf'");
    expect(arch).not.toContain("casing=.030");
    expect(arch).toContain("if(frameStyle==='slim-metal')");
    expect(manor).toContain("frameStyle: face.axis==='x'&&face.f===80.2?'slim-metal':undefined");
  });
});
