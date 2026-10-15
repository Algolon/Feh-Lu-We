import {describe,it,expect} from 'vitest';
import {mushroomIntensity,easeMushroom,mushroomAreaDistance} from '../src/world/mushroomField';
import {MUSHROOM} from '../src/world/layout';
import {mushroomPlacements} from '../src/world/mushroomGrove';
import {project} from '../src/world/geom2d';
import {mushroomYoungModel} from '../src/world/mushroomModels';
import {parseSettings} from '../src/core/state';
describe('optional mushroom experience',()=>{
 it('keeps the normal estate and upper floors unaffected',()=>{
  for(const [x,z] of [[90,128],[134,102],[110,164],[163,128],[90,3]])expect(mushroomIntensity(x,z,0,0)).toBe(0);
  expect(mushroomIntensity(MUSHROOM.x,MUSHROOM.z,0,0)).toBe(1);
  expect(mushroomIntensity(MUSHROOM.x,MUSHROOM.z,8,0)).toBe(0);
 });
 it('increases along the approach without hard edges and restores to exact zero',()=>{
  const points=[[166,140],[172,149],[178,157],[181,162]];
  const values=points.map(([x,z])=>mushroomIntensity(x,z,2,2));
  expect(values[0]).toBe(0);expect(values[1]).toBeGreaterThan(values[0]);expect(values[2]).toBeGreaterThan(values[1]);expect(values[3]).toBe(1);
  let current=1;for(let i=0;i<300;i++)current=easeMushroom(current,0,1/30);expect(current).toBe(0);
  expect(easeMushroom(0,1,1)).toBeCloseTo(easeMushroom(easeMushroom(0,1,.5),1,.5),8);
 });
 it('leaves a clear lane between both increasingly large approach verges',()=>{
  const p=mushroomPlacements().filter(p=>p.zone==='approach');
  expect(p).toHaveLength(20);
  for(const m of mushroomPlacements().filter(m=>m.zone==='grove')) expect(project(m.x,m.z,MUSHROOM.approach).d-.26*m.scale).toBeGreaterThan(1);
  for(const m of p)expect(project(m.x,m.z,MUSHROOM.approach).d-.4*m.scale).toBeGreaterThan(1.25);
  expect(p.slice(-2).every(m=>m.scale>1)).toBe(true);
  expect(p.slice(0,2).every(m=>m.scale<.4)).toBe(true);
 });
 it('gives every hero a visible family, with clustered variation and a continuous clear lane',()=>{
  const list=mushroomPlacements(),young=list.filter(p=>p.zone==='young'&&!p.expansion);
  expect(young.length).toBeGreaterThan(110);expect(young.length).toBeLessThan(200);
  for(const hero of list.filter(p=>p.zone==='grove'&&p.scale>1.5&&!p.expansion)) {
   const family=young.filter(p=>Math.hypot(p.x-hero.x,p.z-hero.z)<2.3);
   expect(family.length).toBeGreaterThanOrEqual(4);
   expect(family.some(p=>p.scale>.35)).toBe(true);
  }
  for(const p of young){expect(project(p.x,p.z,MUSHROOM.approach).d).toBeGreaterThanOrEqual(1.5);expect(p.z).toBeLessThan(178);}
  expect(new Set(young.map(p=>p.species)).size).toBe(4);
  expect(mushroomPlacements()).toEqual(list);
 });
 it('scatters mixed scales across the surveyed expansion while keeping tree trunks and the return lane clear',()=>{
  const list=mushroomPlacements(),extra=list.filter(p=>p.expansion),adults=extra.filter(p=>p.zone==='grove');
  expect(adults).toHaveLength(24);
  expect(adults.filter(p=>p.scale>=1.5)).toHaveLength(6);
  for(const p of adults){expect(Math.hypot(p.x-181,p.z-162)).toBeGreaterThan(2.5+p.scale*1.15);if(p.scale>=1.5)expect(Math.hypot(p.x-MUSHROOM.x,p.z-MUSHROOM.z)).toBeGreaterThan(12);}
  for(const p of extra) {
   expect(mushroomAreaDistance(p.x,p.z)).toBeGreaterThan(.4);
   expect(project(p.x,p.z,MUSHROOM.approach).d).toBeGreaterThan(1.5);
   for(const t of MUSHROOM.landmarks)expect(Math.hypot(p.x-t.x,p.z-t.z)).toBeGreaterThan(.75);
  }
  const sides:((p:{x:number;z:number})=>boolean)[]=[p=>p.x<167,p=>p.x>193,p=>p.z>174,p=>p.z<154];
  for(const side of sides)expect(adults.some(side)).toBe(true);
  for(const [x,z] of [[165,173],[195,160],[187,176]])expect(mushroomIntensity(x,z,0,0)).toBeGreaterThan(.8);
  expect(mushroomIntensity(150,145,0,0)).toBe(0);
 });
 it('budgets four sculpted nursery geometries with real gills and per-vertex glow',()=>{
  for(let k=0;k<4;k++) {
   const g=mushroomYoungModel(k),p=g.attributes.position;
   expect(p.count/3).toBeLessThan(900);expect(p.count/3).toBeGreaterThan(500);
   expect(g.attributes.glow.count).toBe(p.count);expect(g.attributes.normal.count).toBe(p.count);
   g.computeBoundingBox();expect(g.boundingBox!.max.y).toBeGreaterThan(2);
   g.dispose();
  }
 });
 it('migrates distortion preference independently of reduced motion',()=>{
  expect(parseSettings('{}',true).mushroomDistortion).toBe(true);
  expect(parseSettings('{"mushroomDistortion":false,"reducedMotion":true}',true)).toMatchObject({mushroomDistortion:false,reducedMotion:true});
 });
});
