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
    expect(g.attributes.position.count/3).toBeLessThanOrEqual(28);
    expect(Array.from(g.attributes.position.array).every(Number.isFinite)).toBe(true);
    const n=g.attributes.normal;
    for(let i=0;i<n.count;i++)expect(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))).toBeCloseTo(1,5);
    g.computeBoundingBox();expect(g.boundingBox!.max.z).toBeGreaterThan(.05);g.dispose();
    expect(climberPlan().reduce((n,s)=>n+s.leaves.length,0)).toBeLessThan(1400);
  });
  it('puts solid planters outside the entrance step footprint and central walking line',()=>{
    for(const p of ENTRANCE_POTS){
      expect(Math.abs(p.x-90)).toBeGreaterThan(3);
      expect(p.x+.39<87.375 || p.x-.39>92.625).toBe(true);
      expect(p.z+.39).toBeLessThan(79.45);
    }
  });
});
