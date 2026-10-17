import { describe, it, expect } from 'vitest';
import { climberLeafGeo, climberPlan, greenClear, ENTRANCE_POTS } from '../src/world/exteriorGreenery';

describe('authored facade greenery',()=>{
  it('has real basal growth on both elevations and keeps every leaf clear of window/door reveals',()=>{
    const plan=climberPlan();
    expect(new Set(plan.map(s=>s.face))).toEqual(new Set(['W','N']));
    for(const site of plan) {
      expect(site.leaves.length).toBeGreaterThan(35);
      expect(site.stems.some(s=>s.points[0].y<.15)).toBe(true);
      for(const leaf of site.leaves)expect(greenClear(site.face,leaf.at,leaf.y,leaf.size*1.25)).toBe(true);
      for(const stem of site.stems)for(const p of stem.points)expect(greenClear(site.face,p.x,p.y,.003)).toBe(true);
    }
    expect(climberPlan()).toEqual(plan);
  });
  it('bounds leaf geometry cost and folds a readable silhouette without transparency',()=>{
    const g=climberLeafGeo();
    expect(g.attributes.position.count/3).toBeLessThanOrEqual(30);
    expect(Array.from(g.attributes.position.array).every(Number.isFinite)).toBe(true);
    const n=g.attributes.normal;
    for(let i=0;i<n.count;i++)expect(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))).toBeCloseTo(1,5);
    g.computeBoundingBox();expect(g.boundingBox!.max.z).toBeGreaterThan(.05);g.dispose();
    expect(climberPlan().reduce((n,s)=>n+s.leaves.length*30,0)).toBeLessThan(175000);
    for(const site of climberPlan())for(const l of site.leaves)expect(l.size*1.64).toBeLessThan(.21);
  });
  it('restores the exact owner-approved leaf outline for ivy and entrance pots',()=>{
    const g=climberLeafGeo(),position=g.attributes.position;
    // These are the 13 original contour vertices from before VEG-R10, prior to the final 180-degree rotation.
    const original=[[-.15,-.58],[-.67,-.26],[-.82,.13],[-.34,.12],[-.48,.57],[-.12,.43],[0,.92],[.12,.43],[.48,.57],[.34,.12],[.82,.13],[.67,-.26],[.15,-.58]];
    for(const [x,y] of original){
      let found=false;
      for(let i=0;i<position.count;i++)if(Math.abs(position.getX(i)+x)<1e-5&&Math.abs(position.getY(i)+y)<1e-5&&Math.abs(position.getZ(i))<1e-5)found=true;
      expect(found,`original contour point ${x},${y}`).toBe(true);
    }
    // 13 wedges with explicit backfaces plus exactly four unobtrusive vein triangles.
    expect(position.count/3).toBe(30);
    g.dispose();
  });
  it('adds a thin, tapered, two-sided midrib within the original silhouette and same leaf mesh',()=>{
    const g=climberLeafGeo(),position=g.attributes.position,color=g.attributes.color;
    // Base mesh contains 13 wedges x front/back x three vertices; remaining vertices form the midrib.
    const veinStart=13*2*3;
    expect(position.count-veinStart).toBe(12);
    let front=false,back=false;
    for(let i=veinStart;i<position.count;i++){
      expect(Math.abs(position.getX(i))).toBeLessThanOrEqual(.021);
      expect(Math.abs(position.getY(i))).toBeLessThan(.8);
      front ||= position.getZ(i)>.07;
      back ||= position.getZ(i)<-.01;
      expect(color.getY(i)).toBeGreaterThan(color.getX(i));
    }
    expect(front).toBe(true);expect(back).toBe(true);
    g.dispose();
  });
  it('puts solid planters outside the entrance step footprint and central walking line',()=>{
    for(const p of ENTRANCE_POTS){
      expect(Math.abs(p.x-90)).toBeGreaterThan(3);
      expect(p.x+.39<87.375 || p.x-.39>92.625).toBe(true);
      expect(p.z+.39).toBeLessThan(79.45);
    }
  });
});
