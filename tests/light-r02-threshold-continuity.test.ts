import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import {LightPool, type LampSource} from '../src/interactions/world';
import {RoomGraph} from '../src/world/rooms';

const graph=new RoomGraph([
 {id:'dining',name:'Dining',floor:'g',x0:0,x1:3,z0:0,z1:92,y0:0,y1:3.2},
 {id:'kitchen',name:'Kitchen',floor:'g',x0:0,x1:3,z0:92,z1:120,y0:0,y1:3.2},
], [{a:'dining',b:'kitchen',kind:'arch'}]);

const fixture=(id:string,z:number,room:string):LampSource=>({
 id,pos:new THREE.Vector3(1.5,1.8,-z),color:0xffbb88,intensity:5,distance:9,on:()=>true,room
});
const tick=(pool:LightPool,eye:THREE.Vector3,sources:LampSource[],visibility:Set<string>,frames=12)=>{
 for(let i=0;i<frames;i++)pool.update(.05,i*.05,sources,eye,graph,()=>true,undefined,visibility);
};

describe('LIGHT-R02: light selection must not pop at a room threshold',()=>{
 it('keeps the same lamp through a 4 cm step across an open arch, while remaining able to switch after walking away',()=>{
  const pool=new LightPool(new THREE.Scene(),1);
  const sources=[fixture('dining-light',90.5,'dining'),fixture('kitchen-light',93.5,'kitchen')];
  const visible=new Set(['dining','kitchen']);
  tick(pool,new THREE.Vector3(1.5,1.8,-91.98),sources,visible);
  expect(pool.here).toBe('dining');
  expect(pool.assigned()).toEqual(['dining-light']);
  tick(pool,new THREE.Vector3(1.5,1.8,-92.02),sources,visible);
  expect(pool.here).toBe('kitchen');
  expect(pool.assigned()).toEqual(['dining-light']); // no threshold-caused reallocation
  tick(pool,new THREE.Vector3(1.5,1.8,-96),sources,visible,24);
  expect(pool.assigned()).toEqual(['kitchen-light']); // significant distance change may reallocate
  expect(pool.lights).toHaveLength(1); // unchanged mobile light budget
 });
 it('allows light from a renderer-visible third portal step before physically entering that room',()=>{
  const rooms=new RoomGraph([
   {id:'A',name:'A',floor:'g',x0:0,x1:2,z0:0,z1:2,y0:0,y1:3},
   {id:'B',name:'B',floor:'g',x0:2,x1:4,z0:0,z1:2,y0:0,y1:3},
   {id:'C',name:'C',floor:'g',x0:4,x1:6,z0:0,z1:2,y0:0,y1:3},
   {id:'D',name:'D',floor:'g',x0:6,x1:8,z0:0,z1:2,y0:0,y1:3},
  ],[{a:'A',b:'B',kind:'arch'},{a:'B',b:'C',kind:'arch'},{a:'C',b:'D',kind:'arch'}]);
  const pool=new LightPool(new THREE.Scene(),1);
  const lamp: LampSource={id:'D-lamp',pos:new THREE.Vector3(7,1.8,-1),color:0xffffff,intensity:4,distance:9,on:()=>true,room:'D'};
  expect(rooms.visible('A',()=>true,2).has('D')).toBe(false);
  expect(rooms.visible('A',()=>true,3).has('D')).toBe(true);
  pool.update(.3,0,[lamp],new THREE.Vector3(1,1.8,-1),rooms,()=>true,undefined,rooms.visible('A',()=>true,3));
  expect(pool.assigned()).toEqual(['D-lamp']);
  expect(pool.lights).toHaveLength(1);
 });
 it('does not turn on a lamp hidden by a closed portal when rendering does not see it',()=>{
  const rooms=new RoomGraph([
   {id:'A',name:'A',floor:'g',x0:0,x1:2,z0:0,z1:2,y0:0,y1:3},
   {id:'B',name:'B',floor:'g',x0:2,x1:4,z0:0,z1:2,y0:0,y1:3},
  ],[{a:'A',b:'B',kind:'door',door:'door.test'}]);
  const pool=new LightPool(new THREE.Scene(),1);
  const lamp: LampSource={...fixture('hidden',1,'B'),pos:new THREE.Vector3(3,1.8,-1)};
  pool.update(.3,0,[lamp],new THREE.Vector3(1,1.8,-1),rooms,()=>false,undefined,rooms.visible('A',()=>false,3));
  expect(pool.assigned()).toEqual([null]);
 });
});
