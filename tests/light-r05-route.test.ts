import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { LightPool, type LampSource, type LightView } from '../src/interactions/world';
import { RoomGraph } from '../src/world/rooms';

const rooms = new RoomGraph([
  { id:'living', name:'Woonkamer',floor:'g',x0:68,x1:84.8,z0:80,z1:96,y0:0,y1:6 },
  { id:'hall', name:'Hal',floor:'g',x0:84.8,x1:96,z0:80,z1:96,y0:0,y1:6 },
], [{ a:'hall', b:'living',kind:'arch' }]);
const fixture = (id:string,x:number,y:number,z:number,intensity:number,distance:number,room:string): LampSource => ({
  id,pos:new THREE.Vector3(x,y,-z),intensity,distance,color:0xffc77a,
  on:()=>true,room
});
const lamps = [
 fixture('fixed.hall',85.52,2.3,83.2,2.5,5,'hall'),
 fixture('lamp.hallChandelier',89.9,4.5,90,9,13,'hall'),
 fixture('lamp.livingFloor',84.2,1.75,83.6,5,8,'living'),
 fixture('fire.living',73.35,.75,86.7,7,8,'living'),
];
function tick(pool:LightPool,x:number,dt=.05,view?:LightView){
 pool.update(dt,0,lamps,new THREE.Vector3(x,1.75,-86.7),rooms,()=>true,view);
}
function walk(pool:LightPool,start:number,end:number) {
 const trace:{x:number,fire:number,ids:(string|null)[]}[]=[];
 for(let i=0;i<=Math.round(Math.abs(end-start)/.25);i++){
  const x=start+(end-start)*i/Math.round(Math.abs(end-start)/.25);
  for(let j=0;j<3;j++)tick(pool,x);
  const slot=pool.assigned().indexOf('fire.living');
  trace.push({x,fire:slot<0?0:pool.lights[slot].intensity,ids:pool.assigned()});
 }
 return trace;
}
describe('LIGHT-R05 route and mobile slot safety',()=>{
 it('preselects a living hearth while approaching its physical influence range, without extra lights',()=>{
  const pool=new LightPool(new THREE.Scene(),3);
  const trace=walk(pool,92,77);
  const near=trace.find(t=>Math.abs(t.x-81)<.01)!;
  const closer=trace.find(t=>Math.abs(t.x-79.25)<.01)!;
  expect(pool.lights).toHaveLength(3);
  expect(near.ids).toContain('fire.living');
  expect(near.fire).toBeGreaterThan(0.5); // the range-edge must already receive environmental light
  expect(closer.fire).toBeGreaterThan(2);
  expect(trace.at(-1)!.fire).toBeGreaterThan(6.8); // >97% of the target 7 after an intentional slow handover
 });
 it('never selects a different fixture just because the camera rotates',()=>{
  const pool=new LightPool(new THREE.Scene(),3);
  walk(pool,92,80.5);
  for(let i=0;i<20;i++)tick(pool,80.5);
  const before=pool.assigned();
  for(let i=0;i<80;i++){
   const angle=i*Math.PI/40;
   tick(pool,80.5,.05,{
    dir:new THREE.Vector3(Math.sin(angle),0,Math.cos(angle)),
    cosHalf:.8,blocked:()=>{throw Error('LOS query would destabilise point lights')}
   });
  }
  expect(pool.assigned()).toEqual(before);
 });
 it('still gates light through opaque doors and does not increase light budget',()=>{
  const graph=new RoomGraph([
   {id:'a',name:'A',floor:'g',x0:0,x1:2,z0:0,z1:4,y0:0,y1:4},
   {id:'b',name:'B',floor:'g',x0:2,x1:4,z0:0,z1:4,y0:0,y1:4}
  ],[{a:'a',b:'b',kind:'door',door:'closed'}]);
  const pool=new LightPool(new THREE.Scene(),3);
  const remote=fixture('remote',3,1.8,2,6,8,'b');
  for(let i=0;i<30;i++)pool.update(.05,0,[remote],new THREE.Vector3(1,1.8,-2),graph,()=>false);
  expect(pool.assigned().includes('remote')).toBe(false);
  for(let i=0;i<30;i++)pool.update(.05,0,[remote],new THREE.Vector3(1,1.8,-2),graph,()=>true);
  expect(pool.assigned()).toContain('remote');
  expect(pool.lights).toHaveLength(3);
 });
 it('does not give an out-of-range hall chandelier a slot deep inside living', () => {
  const pool = new LightPool(new THREE.Scene(), 3);
  walk(pool,92,77);
  // At x=77 the ceiling chandelier at (89.9,4.5,90) is 13.60 m away,
  // beyond its physically lit radius (13 m). Movement is away from it.
  expect(pool.assigned()).not.toContain('lamp.hallChandelier');
  expect(pool.assigned()).toContain('fire.living');
 });
 it('releases a strong but irrelevant hall light as the player moves into library',()=>{
  const graph = new RoomGraph([
   {id:'hall',name:'Hall',floor:'g',x0:85,x1:96,z0:85,z1:100,y0:0,y1:6},
   {id:'library',name:'Library',floor:'g',x0:75,x1:85,z0:96,z1:110,y0:0,y1:6},
  ],[{a:'hall',b:'library',kind:'arch'}]);
  const hall=fixture('hall-ceiling',89.9,4.5,90,9,13,'hall');
  const library=fixture('local-library',78.4,2.5,101,5,8,'library');
  const pool=new LightPool(new THREE.Scene(),1);
  for(let x=90;x>=80.5;x-=.25)for(let f=0;f<3;f++)
   pool.update(.05,0,[hall,library],new THREE.Vector3(x,1.75,-100.5),graph,()=>true);
  // The hall source is 14.36 m away and the player is walking farther away.
  expect(pool.assigned()).toEqual(['local-library']);
  expect(pool.lights[0].intensity).toBeGreaterThan(0.5);
 });
});