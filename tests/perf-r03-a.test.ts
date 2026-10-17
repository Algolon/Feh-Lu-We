// PERF-R03-A: exterior greenery ownership and visibility. The EXT-R04 wall climbers are their own exterior region (not
// the 'manor' shell chunk); the VEG-R09 front hedges are exterior regions instead of "every room within 25 m". Static
// checks on the registration and ownership, and the World.exteriorRegion rule in a bare World (no walls): outside within
// the distance; inside only through an exterior door or clear window whose opening shows the region (plan wedge and
// height). Frame-level proof (same-frame pixel comparison, P / C / R measurements): docs/perf-r03/PERF_R03_A_REPORT.md.
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { readFileSync } from 'node:fs';
import { estateRooms } from '../src/world/roomdefs';
import { RoomGraph } from '../src/world/rooms';
import { World } from '../src/interactions/world';
import { CLIMBERS_CHUNK } from '../src/world/exteriorGreenery';

describe('PERF-R03-A: ownership', () => {
  const est = readFileSync('src/world/estate.ts', 'utf8'), green = readFileSync('src/world/exteriorGreenery.ts', 'utf8');
  it('the wall climbers are their own chunk, registered as an exterior region at the manor shell distance', () => {
    expect(CLIMBERS_CHUNK).toBe('extGreen.climbers');
    expect(green).toContain('climbers({...local,chunk:CLIMBERS_CHUNK});');
    expect(est).toContain('w.exteriorRegion([CLIMBERS_CHUNK], 130);');
    // the manor shell region is registered by chunk name only: the climbers' chunk is not part of it
    expect(est).toMatch(/w\.roomRegion\(\['manor'\], \[\.\.\.manorRooms, 'out', 'cons'\], 130\);/);
  });
  it('the entrance pots keep the caller (manor) chunk and its visibility', () => {
    expect(green).toContain('for(const pot of ENTRANCE_POTS)entrancePot(local,pot.x,pot.z,pot.seed,dressed);');
    expect(green).not.toMatch(/entrancePot\(\{/);
  });
  it('the front hedges are exterior regions (25 m), no longer drawn from every room', () => {
    expect(est).toContain("for(const chunk of ['frontHedge.left','frontHedge.right'])w.exteriorRegion([chunk],25);");
    expect(est).not.toMatch(/roomRegion\(\[chunk\],\['out',\.\.\.R\.rooms/);
  });
});

describe('PERF-R03-A: World.exteriorRegion', () => {
  // a hedge-like region in front of the south facade (x 95.1–107.4, z 78.85–79.55, 0.8 m tall), as built
  const setup = (windows: boolean, at: [number, number, number, number] = [101.25, 79.2, 12.3, 0.7]) => {
    const R = estateRooms(), w = new World('estate');
    w.rooms = windows ? R : new RoomGraph(R.rooms, R.portals.filter((p) => p.kind !== 'window'), R.thresholds);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(at[2], 0.8, at[3]), new THREE.MeshBasicMaterial());
    mesh.position.set(at[0], 0.4, -at[1]); mesh.userData.chunk = 'hedgeT'; w.scene.add(mesh); mesh.updateMatrixWorld();
    w.exteriorDoors.push({ door: 'door.front', x: 89.15, y: 1.4, z: 80.2, r: 0.9 });
    w.exteriorRegion(['hedgeT'], 25);
    const cam = new THREE.PerspectiveCamera(65, 915 / 412, 0.05, 200);
    const look = (x: number, y: number, z: number, tx: number, ty: number, tz: number) => { cam.position.set(x, y, -z); cam.lookAt(tx, ty, -tz); cam.updateMatrixWorld(); w.updateCulling(cam.position, cam); };
    return { w, mesh, look };
  };
  it('outside: drawn within its distance, culled beyond it', () => {
    const { w, mesh, look } = setup(false);
    look(101, 1.7, 70, 101, 0.5, 79); expect(w.hereRoom).toBe('out'); expect(mesh.visible).toBe(true);
    look(101, 1.7, 40, 101, 0.5, 79); expect(mesh.visible).toBe(false); // ≈ 33 m from its nearest point
    w.dispose();
  });
  it('inside: through the open front door when the opening shows it; not with the door shut or turned away', () => {
    // a planting straight ahead of the front door (2 × 0.7 m at z 76)
    const { w, mesh, look } = setup(false, [89.15, 76, 2, 0.7]);
    let open = true; w.isOpen = (d: string) => open && d === 'door.front';
    look(89.5, 1.75, 82.5, 89.2, 0.6, 76); expect(w.hereRoom).toBe('vestibule'); expect(mesh.visible).toBe(true);
    look(89.5, 1.75, 82.5, 89.5, 1.6, 95); expect(mesh.visible).toBe(false); // facing into the hall: the door is behind
    open = false; look(89.5, 1.75, 82.5, 89.2, 0.6, 76); expect(mesh.visible).toBe(false);
    w.dispose();
  });
  it('the right front hedge is not visible through the front door from inside the vestibule (it starts 6 m beside the jamb), but is from the doorway', () => {
    const { w, mesh, look } = setup(false); w.isOpen = (d: string) => d === 'door.front';
    look(89.5, 1.75, 82.5, 96, 0.6, 79); expect(w.hereRoom).toBe('vestibule'); expect(mesh.visible).toBe(false);
    look(89.2, 1.75, 80.45, 100, 0.6, 79.2); expect(w.hereRoom).toBe('vestibule'); expect(mesh.visible).toBe(true); // in the opening
    w.dispose();
  });
  it('inside: through a clear window that shows it (dining, near the glass), not over the sill from deep in the house', () => {
    const { w, mesh, look } = setup(true); w.isOpen = () => false;
    look(101.5, 1.75, 82, 101.5, 0.9, 78.5); expect(w.hereRoom).toBe('dining'); expect(mesh.visible).toBe(true);
    // from the hall (graph: hall → dining arch) the dining windows pass the cone / line-of-sight test in this bare
    // World, but the rays through their sills (1.05 m) pass ≥ 0.89 m above the hedge top at that depth
    look(89.5, 1.75, 95, 101.5, 1.2, 80.2); expect(w.hereRoom).toBe('hall'); expect(mesh.visible).toBe(false);
    w.dispose();
  });
  it('a region is never shown through an opening it lies behind', () => {
    const { w, mesh, look } = setup(true); w.isOpen = () => false;
    // the dining room's east windows (x 107.8, facing east): the hedge is west of that wall plane
    look(104, 1.75, 86.8, 112, 1.6, 86.8); expect(w.hereRoom).toBe('dining'); expect(mesh.visible).toBe(false);
    w.dispose();
  });
});
