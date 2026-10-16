import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { World } from '../src/interactions/world';
import { estateRooms } from '../src/world/roomdefs';

// A small actual-manor graph test: dining->kitchen is an arch. The north kitchen
// window must not suddenly become transparent only after crossing Z=92.
describe('PORTAL-R02: cross-room window sightlines', () => {
  const cameraAt=(x:number,z:number,at:THREE.Vector3)=>{
    const camera=new THREE.PerspectiveCamera(68,16/9,.08,300);
    camera.position.set(x,1.6,-z);
    camera.lookAt(at);
    camera.updateMatrixWorld(true);
    return camera;
  };
  const run=(x:number,z:number,target:THREE.Vector3)=>{
    const w=new World('estate');
    w.rooms=estateRooms();
    w.isOpen=()=>false;
    const camera=cameraAt(x,z,target);
    w.updateCulling(camera.position,camera);
    return {here:w.hereRoom,out:w.visibleRooms.has('out'),windows:w.outdoorWindows?.length??0,
      directions:w.outdoorWindows?.map(v=>({dx:v.dx,dz:v.dz}))??[]};
  };
  it('keeps actual north-facing kitchen glazing active from dining through the arch',()=>{
    const kitchenNorth=new THREE.Vector3(97.5,2.0,-109.8);
    const dining=run(97.5,91.85,kitchenNorth);
    const kitchen=run(97.5,92.3,kitchenNorth);
    expect(dining.here).toBe('dining');
    expect(kitchen.here).toBe('kitchen');
    expect(dining.out).toBe(true);
    expect(kitchen.out).toBe(true);
    expect(dining.windows).toBeGreaterThan(0);
    expect(kitchen.windows).toBeGreaterThan(0);
  });
  it('admits the specific kitchen north window from the dining side without moving the player',()=>{
    const w=new World('estate');
    w.rooms=estateRooms();
    w.isOpen=()=>false;
    const window=w.rooms.portals.find(p=>p.kind==='window'&&p.a==='kitchen'
      && p.aperture&&Math.abs(p.aperture.x-97.5)<0.1&&p.aperture.z>109.5);
    expect(window).toBeDefined();
    const camera=cameraAt(101,91.85,new THREE.Vector3(97.5,2,-109.8));
    w.hereRoom='dining';
    const reachable=w.rooms.visible('dining',w.isOpen,3,()=>false,()=>false);
    expect(reachable.has('kitchen')).toBe(true);
    const testWindow=w as unknown as {
      clearWindowInView:(eye:THREE.Vector3,cam:THREE.PerspectiveCamera,p:NonNullable<typeof window>,reach:ReadonlySet<string>)=>boolean;
    };
    expect(testWindow.clearWindowInView(camera.position,camera,window!,reachable)).toBe(true);
  });
  it('does not reveal windows through a closed interior door from an unrelated room',()=>{
    const w=new World('estate');
    w.rooms=estateRooms();
    w.isOpen=()=>false;
    const kitchenWindow=w.rooms.portals.find(p=>p.kind==='window'&&p.a==='kitchen'&&p.aperture&&p.aperture.z>109.5);
    expect(kitchenWindow).toBeDefined();
    const eye=new THREE.Vector3(80,1.6,-98);
    const camera=cameraAt(80,98,new THREE.Vector3(97.5,2,-109.8));
    w.updateCulling(eye,camera);
    const reached=w.rooms.visible(w.hereRoom,w.isOpen,3,()=>false,()=>false);
    expect(reached.has('kitchen')).toBe(false);
  });
});
