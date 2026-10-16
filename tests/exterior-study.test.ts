import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { gravelUV, dressedLatheUV } from '../src/world/exteriorStudy';

describe('arrival gravel physical scale', () => {
  const plane = (w: number, d: number, x: number, z: number) => gravelUV(new THREE.PlaneGeometry(w,d).rotateX(-Math.PI/2).translate(x,.03,-z));
  it('keeps a 1.6 m repeat on both small and large ground footprints', () => {
    for(const [w,d] of [[2,3],[38.5,6],[23.1,6]]) {
      const g=plane(w,d,90,70),uv=g.attributes.uv;
      const us=Array.from({length:uv.count},(_,i)=>uv.getX(i));
      const vs=Array.from({length:uv.count},(_,i)=>uv.getY(i));
      expect(Math.max(...us)-Math.min(...us)).toBeCloseTo(w/1.6,4);
      expect(Math.max(...vs)-Math.min(...vs)).toBeCloseTo(d/1.6,4);
      g.dispose();
    }
  });
  it('aligns pebble coordinates across adjacent separately authored surfaces', () => {
    const a=plane(8,6,86,70),b=plane(12,6,96,70);
    const edge=(g:THREE.BufferGeometry)=>{
      const p=g.attributes.position,uv=g.attributes.uv;
      return Array.from({length:p.count},(_,i)=>i).filter(i=>Math.abs(p.getX(i)-90)<.001).map(i=>[uv.getX(i),uv.getY(i)]).sort((p,q)=>p[1]-q[1]);
    };
    expect(edge(a)).toEqual(edge(b));a.dispose();b.dispose();
  });
  it('does not move the physical surface while changing texture coordinates', () => {
    const g=new THREE.PlaneGeometry(12,8).rotateX(-Math.PI/2).translate(90,.03,-70);
    const before=Array.from(g.attributes.position.array);gravelUV(g);
    expect(Array.from(g.attributes.position.array)).toEqual(before);g.dispose();
  });
});


describe('round cut-stone grain',()=>{
  it('uses the same physical height repeat on a tall column and a short planter without changing their shape',()=>{
    for(const [radius,height] of [[.24,2.5],[.39,.75]]) {
      const g=new THREE.LatheGeometry([new THREE.Vector2(radius,0),new THREE.Vector2(radius,height)],16);
      const before=Array.from(g.attributes.position.array);dressedLatheUV(g);
      expect(Array.from(g.attributes.position.array)).toEqual(before);
      const p=g.attributes.position,uv=g.attributes.uv;
      for(let i=0;i<p.count;i++)expect(uv.getY(i)).toBeCloseTo(p.getY(i)/.6,5);
      g.dispose();
    }
  });
});
