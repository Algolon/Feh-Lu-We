import { describe, it, expect } from 'vitest';
import { buildHeroR04 } from './rockSculptR04Core';

describe('ROCK-R01 A01-R04 procedural planar hero boulder', () => {
  it('generates a deterministic, finite and bounded mesh', () => {
    const a=buildHeroR04({seed:37}),b=buildHeroR04({seed:37});
    expect(a).toEqual(b);
    expect(a.triangles).toBe(128);
    expect(a.pieces.map(p=>p.name)).toEqual(['main','frontSlab']);
    expect(a.positions.length).toBe(a.triangles*9);
    expect(a.normals.length).toBe(a.positions.length);
    expect(a.colors.length).toBe(a.positions.length);
    expect(a.uv.length).toBe(a.triangles*6);
    for(const arr of [a.positions,a.normals,a.colors,a.uv])expect(arr.every(Number.isFinite)).toBe(true);
    expect(a.colors.every(v=>v>=0 && v<=1)).toBe(true);
  });
  it('varies color and secondary folds without randomizing the primary shape',()=>{
    const a=buildHeroR04({seed:37}),b=buildHeroR04({seed:41});
    expect(a.colors).not.toEqual(b.colors);
    expect(buildHeroR04({seed:37,detail:'primary'}).positions)
      .toEqual(buildHeroR04({seed:41,detail:'primary'}).positions);
  });
  it('keeps the simplified shape within 3cm of refined bounds',()=>{
    const a=buildHeroR04({detail:'primary'}),b=buildHeroR04({detail:'refined'});
    expect(a.triangles).toBeLessThan(b.triangles);
    for(const k of ['min','max'] as const)for(let i=0;i<3;i++)
      expect(Math.abs(a.bounds[k][i]-b.bounds[k][i])).toBeLessThan(0.03);
  });
  it('emits consistently wound, closed components with nonzero triangle areas',()=>{
    const d=buildHeroR04({seed:37});
    let offset=0;
    const q=(x:number)=>Math.round(x*100000);
    for(const part of d.pieces){
      const edges=new Map<string,number>();
      for(let f=0;f<part.triangles;f++){
        const j=(offset+f)*9,p=d.positions,n=d.normals;
        const v=[
          [p[j],p[j+1],p[j+2]], [p[j+3],p[j+4],p[j+5]], [p[j+6],p[j+7],p[j+8]]
        ];
        const u=v[1].map((x,i)=>x-v[0][i]),w=v[2].map((x,i)=>x-v[0][i]);
        const cr=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];
        expect(cr.reduce((a,x,i)=>a+x*n[j+i],0)).toBeGreaterThan(1e-8);
        for(let e=0;e<3;e++){
          const a=v[e].map(q).join(','),b=v[(e+1)%3].map(q).join(',');
          const key=[a,b].sort().join('|');edges.set(key,(edges.get(key)??0)+1);
        }
      }
      expect([...edges.values()].every(x=>x===2)).toBe(true);
      offset+=part.triangles;
    }
  });
});