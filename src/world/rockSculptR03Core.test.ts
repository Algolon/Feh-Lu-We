import { describe,it,expect } from 'vitest';
import { buildHeroR03 } from './rockSculptR03Core';
describe('ROCK-R01 A01-R03 deterministic planar boulder',()=>{
  it('emits complete finite, bounded geometry',()=>{
    const a=buildHeroR03({seed:37}),b=buildHeroR03({seed:37});
    expect(a).toEqual(b);
    expect(a.positions.length).toBe(a.normals.length);
    expect(a.positions.length).toBe(a.colors.length);
    expect(a.uv.length).toBe(a.positions.length/3*2);
    expect(a.triangles).toBeGreaterThan(100);
    expect(a.triangles).toBeLessThan(1000);
    expect(a.positions.every(Number.isFinite)).toBe(true);
    expect(a.normals.every(Number.isFinite)).toBe(true);
    expect(a.colors.every(x=>Number.isFinite(x)&&x>=0&&x<=1)).toBe(true);
    expect(a.pieces.map(p=>p.name)).toEqual(['main','frontSlab']);
  });
  it('retains silhouette while reducing facets',()=>{
    const primary=buildHeroR03({detail:'primary'}),refined=buildHeroR03({detail:'refined'});
    expect(primary.triangles).toBeLessThan(refined.triangles);
    expect(primary.bounds.min).toEqual(refined.bounds.min);
    expect(primary.bounds.max).toEqual(refined.bounds.max);
  });
  it('preserves primary geometry with seed variations',()=>{
    const a=buildHeroR03({seed:37}),b=buildHeroR03({seed:38});
    expect(a.bounds).toEqual(b.bounds);
    expect(a.colors).not.toEqual(b.colors);
    expect(buildHeroR03({seed:37,detail:'primary'}).positions)
      .toEqual(buildHeroR03({seed:38,detail:'primary'}).positions);
  });
  it('has outward-wound triangles with non-zero area',()=>{
    const a=buildHeroR03();const p=a.positions,n=a.normals;
    for(let i=0;i<p.length;i+=9){
      const ux=p[i+3]-p[i],uy=p[i+4]-p[i+1],uz=p[i+5]-p[i+2];
      const vx=p[i+6]-p[i],vy=p[i+7]-p[i+1],vz=p[i+8]-p[i+2];
      const cx=uy*vz-uz*vy,cy=uz*vx-ux*vz,cz=ux*vy-uy*vx;
      expect(cx*n[i]+cy*n[i+1]+cz*n[i+2]).toBeGreaterThan(1e-7);
    }
  });
});
