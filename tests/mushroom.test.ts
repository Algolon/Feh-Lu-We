import {describe,it,expect} from 'vitest';
import {mushroomIntensity,easeMushroom} from '../src/world/mushroomField';
import {MUSHROOM} from '../src/world/layout';
import {mushroomPlacements} from '../src/world/mushroomGrove';
import {project} from '../src/world/geom2d';
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
 it('migrates distortion preference independently of reduced motion',()=>{
  expect(parseSettings('{}',true).mushroomDistortion).toBe(true);
  expect(parseSettings('{"mushroomDistortion":false,"reducedMotion":true}',true)).toMatchObject({mushroomDistortion:false,reducedMotion:true});
 });
});
