import { describe, it, expect } from 'vitest';
import { climberLeafGeo, climberPlan, greenClear, ENTRANCE_POTS, entranceLeafGeo, entrancePlantPlan } from '../src/world/exteriorGreenery';

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
    expect(g.attributes.position.count/3).toBeLessThanOrEqual(34);
    expect(Array.from(g.attributes.position.array).every(Number.isFinite)).toBe(true);
    const n=g.attributes.normal;
    for(let i=0;i<n.count;i++)expect(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))).toBeCloseTo(1,5);
    g.computeBoundingBox();expect(g.boundingBox!.max.z).toBeGreaterThan(.05);g.dispose();
    expect(climberPlan().reduce((n,s)=>n+s.leaves.length*34,0)).toBeLessThan(175000);
    for(const site of climberPlan())for(const l of site.leaves)expect(l.size*1.64).toBeLessThan(.21);
  });
  it('restores the exact owner-approved leaf outline for wall ivy',()=>{
    const g=climberLeafGeo(),position=g.attributes.position;
    // These are the 13 original contour vertices from before VEG-R10, prior to the final 180-degree rotation.
    const original=[[-.15,-.58],[-.67,-.26],[-.82,.13],[-.34,.12],[-.48,.57],[-.12,.43],[0,.92],[.12,.43],[.48,.57],[.34,.12],[.82,.13],[.67,-.26],[.15,-.58]];
    for(const [x,y] of original){
      let found=false;
      for(let i=0;i<position.count;i++)if(Math.abs(position.getX(i)+x)<1e-5&&Math.abs(position.getY(i)+y)<1e-5&&Math.abs(position.getZ(i))<1e-5)found=true;
      expect(found,`original contour point ${x},${y}`).toBe(true);
    }
    // 13 unchanged doubled wedges, four midrib and four secondary-vein triangles.
    expect(position.count/3).toBe(34);
    g.dispose();
  });
  it('has a visible, tapered two-sided midrib with a contrasting green tint',()=>{
    const g=climberLeafGeo(),position=g.attributes.position,color=g.attributes.color;
    const start=13*2*3,end=start+4*3; // 26 original front/back wedges, 4 midrib triangles
    let front=false,back=false;
    for(let i=start;i<end;i++) {
      expect(Math.abs(position.getX(i))).toBeLessThanOrEqual(.05);
      expect(Math.abs(position.getY(i))).toBeLessThanOrEqual(.84);
      front ||= position.getZ(i)>.08;
      back ||= position.getZ(i)<-.02;
      expect(color.getY(i)).toBeGreaterThan(color.getX(i));
      expect(color.getY(i)).toBeGreaterThan(1.05);
    }
    expect(front).toBe(true);expect(back).toBe(true);
    g.dispose();
  });
  it('has mirrored side-vein strokes on both faces without exceeding the mobile geometry budget',()=>{
    const g=climberLeafGeo(),position=g.attributes.position,color=g.attributes.color;
    const start=(13*2+4)*3;
    expect(position.count-start).toBe(12); // four tapered secondary-vein triangles
    const tips:{x:number;y:number;z:number}[]=[];
    for(let i=start;i<position.count;i++){
      expect(color.getY(i)).toBeGreaterThan(color.getX(i));
      if(Math.abs(position.getX(i))>.60)tips.push({x:position.getX(i),y:position.getY(i),z:position.getZ(i)});
    }
    expect(tips.length).toBe(4);
    expect(tips.some(t=>t.x>.60)).toBe(true);
    expect(tips.some(t=>t.x<-.60)).toBe(true);
    expect(tips.some(t=>t.z>.02)).toBe(true);
    expect(tips.some(t=>t.z<-.01)).toBe(true);
    expect(position.count/3).toBe(34);
    g.dispose();
  });
  it('gives entrance pots a distinct, broad and finite faceted leaf mesh with calm veins',()=>{
    const g=entranceLeafGeo(),p=g.attributes.position,c=g.attributes.color;
    expect(g.index).toBeNull();
    expect(p.count/3).toBe(192); // Eight curved longitudinal bands × six cross bands × two sides
    expect([...p.array].every(Number.isFinite)).toBe(true);
    expect([...c.array].every(Number.isFinite)).toBe(true);
    const uv=g.attributes.uv;
    expect(uv.count).toBe(p.count);
    expect([...uv.array].every(n=>n>=0&&n<=1)).toBe(true);
    g.computeBoundingBox();
    expect(g.boundingBox!.max.x-g.boundingBox!.min.x).toBeGreaterThan(1.0);
    expect(g.boundingBox!.max.x-g.boundingBox!.min.x).toBeLessThan(1.2);
    expect(g.boundingBox!.max.y-g.boundingBox!.min.y).toBeGreaterThan(1.6);
    // Veins are part of the same continuous leaf, not overlaid planes.
    const central:number[]=[],outer:number[]=[];
    let front=false,back=false;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      if(Math.abs(x)<.065&&Math.abs(y)<.48)central.push(c.getY(i));
      if(Math.abs(x)>.52&&Math.abs(y)<.3)outer.push(c.getY(i));
      front ||= z>.05; back ||= z<-.05;
      const n=g.attributes.normal;
      expect(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))).toBeCloseTo(1,5);
    }
    expect(front).toBe(true);expect(back).toBe(true);
    expect(central.length).toBeGreaterThan(5);expect(outer.length).toBeGreaterThan(5);
    const mean=(a:number[])=>a.reduce((s,v)=>s+v,0)/a.length;
    expect(mean(central)).toBeGreaterThan(mean(outer)*1.1);
    g.dispose();
  });
  it('creates two deterministic, well-connected and less cluttered entrance plants',()=>{
    for(const {seed} of ENTRANCE_POTS){
      const plan=entrancePlantPlan(seed),again=entrancePlantPlan(seed);
      expect(plan.branches).toHaveLength(7);
      expect(plan.leaves).toHaveLength(35); // Seven staggered twigs, five distinct elliptical leaves each.
      expect(plan.leaves).toEqual(again.leaves);
      for(const branch of plan.branches){
        expect(branch.points).toHaveLength(3);
        expect(branch.points[0].y).toBeCloseTo(.65);
      }
      const centers=plan.leaves.map(l=>l.centre);
      expect(Math.max(...centers.map(v=>v.y))).toBeGreaterThan(1.15);
      expect(Math.min(...centers.map(v=>v.y))).toBeLessThan(1.0);
      for(const leaf of plan.leaves){
        expect(leaf.size).toBeGreaterThanOrEqual(.172);
        expect(leaf.size).toBeLessThan(.23);
        expect(leaf.attachment.distanceTo(leaf.base)).toBeLessThan(.3);
        expect(leaf.tilt).toBeLessThan(-.1);
      }
    }
  });
  it('puts solid planters outside the entrance step footprint and central walking line',()=>{
    for(const p of ENTRANCE_POTS){
      expect(Math.abs(p.x-90)).toBeGreaterThan(3);
      expect(p.x+.39<87.375 || p.x-.39>92.625).toBe(true);
      expect(p.z+.39).toBeLessThan(79.45);
    }
  });
});
