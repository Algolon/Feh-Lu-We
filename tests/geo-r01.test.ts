import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { estateRooms } from '../src/world/roomdefs';
import { World } from '../src/interactions/world';

describe('GEO-R01 building integrity', () => {
  it('keeps the garden visible through the kitchen glass door when closed or moving', () => {
    const w = new World('estate'); w.rooms = estateRooms();
    const portal = w.rooms.portals.find(p => p.door === 'door.kitchenBack')!;
    const glass = w.col.addBox(100.5, 101.5, 109.76, 109.84, .15, 2.45, { occludes: true, tag: portal.door });
    w.visualPassThrough.add(glass);
    w.exteriorDoors.push({ door: portal.door!, seeThrough: portal.seeThrough, x: 101, y: 1.3, z: 109.8, r: .9 });
    const garden = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
    garden.position.set(101, 1, -114); garden.userData.chunk = 'garden'; w.scene.add(garden);
    w.roomRegion(['garden'], ['out']);
    const cam = new THREE.PerspectiveCamera(65, .5, .05, 200);
    cam.position.set(101, 1.8, -108.2); cam.lookAt(101, 1.3, -114); cam.updateMatrixWorld();
    for (const open of [false, true, false]) { // closing switches saved state before the leaf finishes moving
      w.isOpen = () => open;
      w.updateCulling(cam.position, cam);
      expect(w.hereRoom).toBe('kitchen');
      expect(w.visibleRooms.has('out')).toBe(true);
      expect(garden.visible).toBe(true);
    }
    expect(glass.enabled).toBe(true); expect(glass.solid).toBe(true);
    expect(w.col.segmentBlocked(101, 1.3, 108.2, 101, 1.3, 114)).toBe(true);
    w.col.addBox(100, 102, 108.8, 109, 0, 4, { occludes: true });
    w.updateCulling(cam.position, cam);
    expect(garden.visible).toBe(false);
    w.dispose();
  });

  it('keeps the entire service route indoors, including wall-depth thresholds', () => {
    const r = estateRooms();
    for (let x = 106; x <= 117; x += .025) for (const z of [102.32,102.5,102.68]) {
      expect(r.roomAt(x, 1, z), `route ${x},${z}`).not.toBe('out');
    }
    expect(r.roomAt(107.8, 1, 101.5)).toBe('out'); // solid wall is not a doorway
    expect(r.roomAt(115.8, 1, 103.5)).toBe('out');
    expect(r.roomAt(107.8, 5, 102.5)).toBe('out'); // no cross-floor expansion
    expect(r.roomAt(116.1, 1, 102.5)).toBe('cons');
  });

  it('classifies the wing up to the existing main wall face, without changing room IDs', () => {
    const r = estateRooms();
    for (const [z,room] of [[100,'workshop'],[102.5,'corridor'],[105,'pantry']] as const) {
      expect(r.roomAt(108.2, 1, z)).toBe(room);
    }
    expect(r.get('corridor')?.x1).toBe(115.6);
  });

  it('sees through closed glass in both directions but not through a closed service door', () => {
    const r = estateRooms(), shut = () => false;
    expect(r.visible('corridor', shut, 1).has('cons')).toBe(true);
    expect(r.visible('cons', shut, 1).has('corridor')).toBe(true);
    expect(r.visible('corridor', shut, 1).has('kitchen')).toBe(false);
    expect(r.visible('kitchen', shut, 1).has('corridor')).toBe(false);
    expect(r.visible('corridor', d => d === 'door.service', 1).has('kitchen')).toBe(true);
    expect(r.visible('out', shut, 2).has('corridor')).toBe(true);
    expect(r.visible('out', shut, 2).has('living')).toBe(false);
    expect(r.visible('out', shut, 2, () => false).has('corridor')).toBe(false);
    expect(r.visible('out', shut, 2, () => false).has('cons')).toBe(true); // exterior glazing remains visible
  });

  it('keeps structural batches visible through threshold turns without disabling distant culling', () => {
    const w = new World('estate');w.rooms = estateRooms();w.isOpen = () => true;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial());
    mesh.position.set(112,1,-102.5);mesh.userData.chunk='mIn';w.scene.add(mesh);
    w.roomRegion(['mIn'],['corridor','kitchen'],Infinity,30);
    // Reproduces the old angular rejection of interiors when a threshold incorrectly read as out.
    w.exteriorDoors.push({door:'outside',x:130,y:1.3,z:106,r:.9});
    const cam=new THREE.PerspectiveCamera(65,.5,.05,200);
    for(const x of [107.7,107.9,108.2,115.7,115.9]) for(let yaw=0;yaw<6.28;yaw+=Math.PI/4) {
      cam.position.set(x,1.8,-102.5);cam.rotation.y=yaw;cam.updateMatrixWorld();
      w.updateCulling(cam.position,cam);expect(w.hereRoom).not.toBe('out');expect(mesh.visible).toBe(true);
    }
    cam.position.set(190,1.8,-170);cam.updateMatrixWorld();w.updateCulling(cam.position,cam);
    expect(mesh.visible).toBe(false);w.dispose();
  });

  it('ignores glass only for visual rays, preserving closed-door collision and picking occlusion', () => {
    const w=new World('estate');w.rooms=estateRooms();
    const glass=w.col.addBox(115.72,115.88,101.85,103.15,.15,2.45,{occludes:true,tag:'door.consWest'});
    w.visualPassThrough.add(glass);
    w.exteriorDoors.push({door:'door.consWest',seeThrough:true,x:115.8,y:1.3,z:102.5,r:.65});
    const cam=new THREE.PerspectiveCamera(65,.5,.05,200);cam.position.set(114.5,1.8,-102.5);cam.lookAt(117,1.3,-102.5);cam.updateMatrixWorld();
    w.updateCulling(cam.position,cam);expect(w.visibleRooms.has('out')).toBe(true);
    expect(w.col.segmentBlocked(114.5,1.3,102.5,117,1.3,102.5)).toBe(true);
    expect(w.col.segmentBlocked(114.5,1.3,102.5,117,1.3,102.5,w.visualPassThrough)).toBe(false);
    expect(glass.solid).toBe(true);expect(glass.enabled).toBe(true);
    // A real opaque blocker must still reject the same visual ray.
    w.col.addBox(114.8,115.1,101,104,0,4,{occludes:true});
    w.updateCulling(cam.position,cam);expect(w.visibleRooms.has('out')).toBe(false);w.dispose();
  });

  it('does not draw the service wing from outdoors behind an opaque exterior wall', () => {
    const w=new World('estate');w.rooms=estateRooms();
    w.exteriorDoors.push({door:'door.consWest',seeThrough:true,x:115.8,y:1.3,z:102.5,r:.65});
    const cam=new THREE.PerspectiveCamera(65,1,.05,200);cam.position.set(131,1.8,-102.5);cam.lookAt(115.8,1.3,-102.5);cam.updateMatrixWorld();
    // Camera is outdoors in this controlled test; a transparent collider does not hide the aperture.
    const glass=w.col.addBox(129.9,130.1,101,104,0,4,{occludes:true});w.visualPassThrough.add(glass);
    w.updateCulling(cam.position,cam);expect(w.visibleRooms.has('corridor')).toBe(true);
    w.col.addBox(124,125,100,105,0,5,{occludes:true});
    w.updateCulling(cam.position,cam);expect(w.visibleRooms.has('corridor')).toBe(false);w.dispose();
  });
});
