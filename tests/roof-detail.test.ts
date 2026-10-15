import { describe, it, expect } from 'vitest';
import { hipRoofGeo, gableGeo } from '../src/world/kit';
import { slateCourseUV } from '../src/world/roofDetail';

describe('measured slate courses',()=>{
  it('preserves roof and attic geometry exactly',()=>{
    for(const g of [hipRoofGeo(36,30,8.2,.7),gableGeo(2.6,2.1,.8,false)]) {
      const before=Array.from(g.attributes.position.array);slateCourseUV(g);
      expect(Array.from(g.attributes.position.array)).toEqual(before);
      expect(Array.from(g.attributes.uv.array).every(Number.isFinite)).toBe(true);g.dispose();
    }
  });
  it('keeps a course horizontal on every hip face, rather than slanting across the elevation',()=>{
    const g=slateCourseUV(hipRoofGeo(36,30,8.2,.7)),p=g.attributes.position,uv=g.attributes.uv;
    for(let i=0;i<p.count;i+=3)for(let a=i;a<i+3;a++)for(let b=a+1;b<i+3;b++)
      if(Math.abs(p.getY(a)-p.getY(b))<1e-6)expect(uv.getY(a)).toBeCloseTo(uv.getY(b),6);
    g.dispose();
  });
});
