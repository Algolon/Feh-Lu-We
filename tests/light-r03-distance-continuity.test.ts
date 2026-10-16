import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {LightPool, type LampSource, type LightView} from '../src/interactions/world';
import {RoomGraph} from '../src/world/rooms';

type R={id:string;name:string;floor:'g';x0:number;x1:number;z0:number;z1:number;y0:number;y1:number};
const graph=(count:number,door=false)=>{
 const rooms: R[]=Array.from({length:count},(_,i)=>({id:'r'+i,name:'r'+i,floor:'g',x0:i*2,x1:(i+1)*2,z0:0,z1:3,y0:0,y1:3}));
 const portals=rooms.slice(1).map((r,i)=>({a:rooms[i].id,b:r.id,kind:door?'door':'arch',...(door?{door:'door.test'}:{})})) as {a:string;b:string;kind:'arch'|'door';door?:string}[];
 return new RoomGraph(rooms,portals);
};
const fixture=(id:string,x:number,room:string,intensity=10):LampSource=>({
 id,pos:new THREE.Vector3(x,1.8,-1.5),color:0xffbe78,intensity,distance:11,on:()=>true,room
});
const eye=(x:number)=>new THREE.Vector3(x,1.8,-1.5);
const step=(pool:LightPool,x:number,lamps:LampSource[],rooms:RoomGraph,frames:number,visible=new Set(['r0']),
 view?:LightView)=>{
  for(let i=0;i<frames;i++)pool.update(.05,i*.05,lamps,eye(x),rooms,()=>true,view,visible);
};

describe('LIGHT-R03: no point light popping from camera-room / view / distance thresholds',()=>{
 it('pre-allocates a still-physically-connected fixture even when room culling hides its chamber',()=>{
  const rooms=graph(5),pool=new LightPool(new THREE.Scene(),1);
  const lamp=fixture('far-room-light',8.8,'r4');
  expect(rooms.visible('r0',()=>true,2,()=>false,()=>false).has('r4')).toBe(false);
  step(pool,1,[lamp],rooms,6,new Set(['r0']));
  expect(pool.assigned()).toEqual(['far-room-light']);
  expect(pool.lights[0].intensity).toBeGreaterThan(0);
  // A different view direction / display-culling set must not instantly drop it.
  step(pool,1,[lamp],rooms,6,new Set(['r0','r1']));
  expect(pool.assigned()).toEqual(['far-room-light']);
 });
 it('has no sudden light-strength step immediately after a lamp is selected',()=>{
  const rooms=graph(2),pool=new LightPool(new THREE.Scene(),1);
  const lamps=[fixture('warm-lamp',2.2,'r1',10)];
  step(pool,1,lamps,rooms,1);
  expect(pool.assigned()).toEqual(['warm-lamp']);
  const start=pool.lights[0].intensity;
  step(pool,1,lamps,rooms,1);
  const firstFrame=pool.lights[0].intensity;
  expect(firstFrame-start).toBeGreaterThan(0);
  expect(firstFrame-start).toBeLessThan(1.2); // old 5/s rise jumped 2.5 at dt=.05
  step(pool,1,lamps,rooms,35);
  expect(pool.lights[0].intensity).toBeGreaterThan(9);
 });
 it('does not reassign lights only because a fixture has been watched for two seconds',()=>{
  const rooms=graph(2),pool=new LightPool(new THREE.Scene(),1);
  const near=fixture('near',1.7,'r0',6),watched=fixture('distant',6.7,'r1',6);
  const dir=new THREE.Vector3(1,0,0);
  const view:LightView={dir,cosHalf:0.9,blocked:()=>false};
  step(pool,1,[near,watched],rooms,1,undefined,view);
  expect(pool.assigned()).toEqual(['near']);
  step(pool,1,[near,watched],rooms,60,undefined,view);
  expect(pool.assigned()).toEqual(['near']);
 });
 it('still allows a real replacement with a smooth fade after a substantial change of location',()=>{
  const rooms=graph(3),pool=new LightPool(new THREE.Scene(),1);
  const a=fixture('a',1,'r0',8),b=fixture('b',5.3,'r2',8),both=new Set(['r0','r1','r2']);
  step(pool,0.7,[a,b],rooms,40,both);
  expect(pool.assigned()).toEqual(['a']);
  const old=pool.lights[0].intensity;
  step(pool,5.6,[a,b],rooms,1,both);
  expect(old-pool.lights[0].intensity).toBeLessThan(1.0); // no instant 20 units/s extinguish
  step(pool,5.6,[a,b],rooms,70,both);
  expect(pool.assigned()).toEqual(['b']);
  expect(pool.lights[0].intensity).toBeGreaterThan(5);
 });
 it('does not drop a light behind a closed clear-glass door that already shows its room',()=>{
  const rooms=new RoomGraph([
   {id:'r0',name:'r0',floor:'g',x0:0,x1:2,z0:0,z1:3,y0:0,y1:3},
   {id:'r1',name:'r1',floor:'g',x0:2,x1:4,z0:0,z1:3,y0:0,y1:3}
  ],[{a:'r0',b:'r1',kind:'door',door:'glass-door',seeThrough:true}]);
  const pool=new LightPool(new THREE.Scene(),1);
  const lamp=fixture('glass-light',3.1,'r1');
  for(let i=0;i<10;i++)pool.update(.05,i*.05,[lamp],eye(1),rooms,()=>false,undefined,new Set(['r0']));
  expect(pool.assigned()).toEqual(['glass-light']);
 });
 it('keeps closed-door lamps excluded despite extra portal prefetch depth',()=>{
  const rooms=graph(2,true),pool=new LightPool(new THREE.Scene(),1);
  const lamp=fixture('hidden-room',3,'r1');
  for(let i=0;i<10;i++)pool.update(.05,i*.05,[lamp],eye(1),rooms,()=>false,undefined,new Set(['r0','r1']));
  expect(pool.assigned()).toEqual([null]);
  expect(pool.lights).toHaveLength(1);
 });
});
