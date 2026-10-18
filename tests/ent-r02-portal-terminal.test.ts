import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { World } from '../src/interactions/world';
import { RoomGraph, type RoomDef, type PortalDef } from '../src/world/rooms';

// Reproduces the ENT-R02 upper window: A window must not turn the universal
// outside ('out') node into a corridor leading to unrelated interior scenes.
describe('ENT-R02-P2 transparent window is a terminal visibility edge', () => {
  const rooms: RoomDef[] = [
    { id: 'gallery', name: 'Galerij', floor: 'u', x0: 0, x1: 4, z0: 0, z1: 5, y0: 3.2, y1: 6.4 },
    { id: 'other', name: 'Andere kamer', floor: 'u', x0: 10, x1: 15, z0: 0, z1: 5, y0: 3.2, y1: 6.4 },
  ];
  const portals: PortalDef[] = [
    { a:'gallery', b:'out', kind:'window', seeThrough:true,
      aperture: { x: 2, y: 4.7, z: 0, width: 1.2, height: 1.6, axis: 'x' } },
    { a:'other', b:'out', kind:'glass' },
  ];
  const view = (south: boolean) => {
    const w = new World('estate');
    w.rooms = new RoomGraph(rooms,portals);
    w.isOpen = () => false;
    const camera = new THREE.PerspectiveCamera(68, 412/915, .08, 300);
    camera.position.set(2,4.6,-2);
    camera.lookAt(new THREE.Vector3(2, 4.7, south ? 1 : -10));
    camera.updateMatrixWorld(true);
    w.updateCulling(camera.position, camera);
    return {room:w.hereRoom,visible:w.visibleRooms,windows:w.outdoorWindows?.length ?? 0};
  };
  it('sees outdoors through the actual upper window without inferring other interiors',()=>{
    const v=view(true);
    expect(v.room).toBe('gallery');
    expect(v.visible.has('out')).toBe(true);
    expect(v.visible.has('other')).toBe(false);
    expect(v.windows).toBeGreaterThan(0);
  });
  it('keeps the outdoors culled when looking away from the window',()=>{
    const v=view(false);
    expect(v.room).toBe('gallery');
    expect(v.visible.has('out')).toBe(false);
    expect(v.visible.has('other')).toBe(false);
  });
});
