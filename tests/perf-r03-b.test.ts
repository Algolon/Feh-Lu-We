// PERF-R03-B: window-constrained outdoor visibility. Registration (which outdoor regions are culled per mesh), and the
// rule in a bare World (no walls; the room graph reduced to the windows a case needs): seen only through glass, an
// outdoor mesh is drawn while a clear window in view can show it (plan wedge and height, wall depth, movement margins);
// with an exterior door in view, outside, or in the glass room, every mesh follows its region as before. Frame-level
// proof (same-frame pixel comparison, P / A / B measurements): docs/perf-r03/PERF_R03_B_REPORT.md.
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { readFileSync } from 'node:fs';
import { estateRooms } from '../src/world/roomdefs';
import { RoomGraph } from '../src/world/rooms';
import { World } from '../src/interactions/world';

describe('PERF-R03-B: registration', () => {
  const est = readFileSync('src/world/estate.ts', 'utf8');
  it('the outdoor regions (grounds, woodland, garden, hero places, cottage, glass room) are window-constrained; the manor and the exterior greenery are not', () => {
    const line = est.split('\n').find((l) => l.includes('w.windowConstrained('))!;
    for (const ch of ['ground', 'paths', 'wall', 'fence', 'garden', 'grounds', 'forest', 'outdoor', 'hills', 'wick', 'fireCamp', 'well', 'cottage', 'cons', 'glass']) expect(line).toContain(`'${ch}'`);
    for (const ch of ['manor', 'mIn', 'frontHedge', 'extGreen']) expect(line).not.toContain(`'${ch}`);
  });
  it('the tree batches use the window wedge only while the outdoors is seen through glass only', () => {
    const src = readFileSync('src/world/boslustSample.ts', 'utf8');
    expect(src).toContain('if (vis && this.w?.glassApertures) vis = this.w.glassShows(camPos, it.p, it.r);');
  });
});

describe('PERF-R03-B: World.windowConstrained', () => {
  // one outdoor region of three meshes: a lawn patch south of the dining room (in its south windows' wedge), a grove
  // north of the house, and a far wood far south (100 m), all registered as one region of the outdoors
  const setup = (windowsAt: (a: { x: number; y: number; z: number }) => boolean) => {
    const R = estateRooms(), w = new World('estate');
    w.rooms = new RoomGraph(R.rooms, R.portals.filter((p) => p.kind !== 'window' || (p.aperture && windowsAt(p.aperture))), R.thresholds);
    const mk = (x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), new THREE.MeshBasicMaterial());
      m.position.set(x, y, -z); m.userData.chunk = 'outdoorT'; w.scene.add(m); m.updateMatrixWorld(); return m;
    };
    const lawn = mk(101.5, 0.1, 74, 6, 0.2, 6), grove = mk(90, 4, 125, 10, 8, 10), wood = mk(101.5, 6, -25, 20, 12, 20);
    w.exteriorDoors.push({ door: 'door.front', x: 89.15, y: 1.4, z: 80.2, r: 0.9 });
    w.roomRegion(['outdoorT'], ['out']);
    w.windowConstrained(['outdoorT']);
    const cam = new THREE.PerspectiveCamera(65, 915 / 412, 0.05, 200);
    const look = (x: number, y: number, z: number, tx: number, ty: number, tz: number) => { cam.position.set(x, y, -z); cam.lookAt(tx, ty, -tz); cam.updateMatrixWorld(); w.updateCulling(cam.position, cam); };
    return { w, lawn, grove, wood, look };
  };
  const diningSouth = (a: { x: number; y: number; z: number }) => a.z === 80.2 && a.y === 1.85 && a.x === 101.5;
  it('through a dining window only: what its wedge shows is drawn at any distance, the rest of the outdoors is culled', () => {
    const { w, lawn, grove, wood, look } = setup(diningSouth); w.isOpen = () => false;
    look(101.5, 1.75, 83, 101.5, 1.2, 70); expect(w.hereRoom).toBe('dining'); expect(w.glassApertures?.length).toBe(1);
    expect(lawn.visible).toBe(true); expect(wood.visible).toBe(true); // 105 m away, in the wedge: no distance limit
    expect(grove.visible).toBe(false); // north of the house: behind the window
    w.dispose();
  });
  it('an exterior door in view keeps the previous rule: every mesh of the region is drawn', () => {
    const { w, lawn, grove, wood, look } = setup(diningSouth); w.isOpen = (d: string) => d === 'door.front';
    look(89.5, 1.75, 82.5, 89.2, 1.0, 76); expect(w.hereRoom).toBe('vestibule'); expect(w.glassApertures).toBe(null);
    expect(lawn.visible && grove.visible && wood.visible).toBe(true);
    w.dispose();
  });
  it('outside, every mesh follows the region (nothing is constrained)', () => {
    const { w, lawn, grove, wood, look } = setup(diningSouth); w.isOpen = () => false;
    look(90, 1.7, 60, 90, 1.5, 80); expect(w.hereRoom).toBe('out'); expect(w.glassApertures).toBe(null);
    expect(lawn.visible && grove.visible && wood.visible).toBe(true);
    w.dispose();
  });
  it('no window and no door in view: the outdoors is not drawn at all (unchanged)', () => {
    const { w, lawn, grove, wood, look } = setup(() => false); w.isOpen = () => false;
    look(101.5, 1.75, 83, 101.5, 1.2, 70);
    expect(lawn.visible || grove.visible || wood.visible).toBe(false);
    w.dispose();
  });
  it('a neighbour\'s window that runs along the room\'s own wall is in the wedges (botanic window seen from the study through the corner)', () => {
    const { w, look } = setup((a) => a.z === 80.2 && a.y === 4.75 && (a.x === 98 || a.x === 101.5)); w.isOpen = () => false;
    look(97.61, 5, 86.09, 98.59, 4.96, 85.87); expect(w.hereRoom).toBe('study');
    expect(w.glassApertures?.map((a) => a.x).sort()).toEqual([101.5, 98]); // the botanic room is behind a closed door
    w.dispose();
  });
  it('glassShows: an instance in the window\'s wedge is shown, one far to its side is not', () => {
    const { w, look } = setup(diningSouth); w.isOpen = () => false;
    look(101.5, 1.75, 83, 101.5, 1.2, 70);
    const eye = new THREE.Vector3(101.5, 1.75, -83);
    expect(w.glassShows(eye, new THREE.Vector3(101.5, 0, -40), 3)).toBe(true); // straight out of the window, 40 m
    expect(w.glassShows(eye, new THREE.Vector3(140, 0, -40), 3)).toBe(false); // far to the side of the wedge
    w.dispose();
  });
});
