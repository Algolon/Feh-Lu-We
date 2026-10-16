// PERF-R02: frame-accurate visibility. Pure checks under node: which regions use the doorway rule and that their
// topology allows it (every opening to the rest of the house is a listed door; windows are opaque to culling), the
// rule's behaviour in a bare World (inside, in the doorway, facing away, shut, behind a floor plate, turning), and the
// measurement harness's determinism. Frame-level evidence (Modes A / A* / B / C, pixel comparisons) is browser work:
// scripts/perf/visibility-harness.mjs, scripts/perf/visibility-lossless.mjs, npm run perf:visibility:smoke.
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { readFileSync } from 'node:fs';
import { estateRooms } from '../src/world/roomdefs';
import { World } from '../src/interactions/world';
// @ts-expect-error untyped tooling module (plain .mjs)
import { ALL_PATHS, LEGACY_PATHS, legacySamples, trajectory } from '../scripts/perf/visibility-paths.mjs';
// @ts-expect-error untyped tooling module (plain .mjs)
import { stats } from '../scripts/perf/visibility-harness.mjs';

const DOORWAY_REGIONS: Record<string, { rooms: string[]; doors: string[] }> = {
  mUpR: { rooms: ['reis'], doors: ['door.reis'] },
  mUpS: { rooms: ['sterren'], doors: ['door.sterren'] },
  mUpG: { rooms: ['storage'], doors: ['door.storage'] },
  mUpE: { rooms: ['study', 'botanic', 'linen'], doors: ['door.study', 'door.botanic', 'door.linen'] },
  mLib: { rooms: ['library', 'libGallery'], doors: ['door.library', 'door.livLib', 'door.libGallery'] },
};

// mAttic is deliberately NOT a doorway region. Its pixel proof differed by up to 87,016 px, and the frames show why: the
// attic floor overlaps the hall and guest-room ceilings, and wherever mAttic is drawn (production, every door open) its
// planks replace the plaster ceiling. Culling would only mask that geometry defect in some views; it is reported for a
// geometry fix instead (PERF-R02 §6.3).
describe('PERF-R02: doorway regions', () => {
  const est = readFileSync('src/world/estate.ts', 'utf8');
  it('exactly these six regions use the doorway rule, each with its full door list; every other region is rooms-only', () => {
    const lines = est.split('\n').filter((l) => /w\.roomRegion\(.*\['door\./.test(l));
    expect(lines.length).toBe(Object.keys(DOORWAY_REGIONS).length);
    for (const [chunk, { doors }] of Object.entries(DOORWAY_REGIONS)) {
      const line = lines.find((l) => l.includes(`roomRegion(['${chunk}']`));
      expect(line, chunk).toBeTruthy();
      expect(line!.match(/\['door\.[^\]]*\]/)![0]).toBe(`[${doors.map((d) => `'${d}'`).join(', ')}]`);
    }
  });
  it('mAttic keeps the rooms-only rule (the doorway rule would only mask an attic-floor / ceiling overlap)', () => {
    expect(est).toMatch(/w\.roomRegion\(\['mAttic'\], \[\.\.\.atticRooms, 'atticStair'\], Infinity, IN_FAR\);/);
  });
  it('each doorway region is enclosed: every portal from its rooms to the rest of the house is one of its listed doors (windows are opaque to culling)', () => {
    const R = estateRooms();
    for (const [chunk, { rooms, doors }] of Object.entries(DOORWAY_REGIONS)) {
      const external = R.portals.filter((p) => rooms.includes(p.a) !== rooms.includes(p.b) && p.kind !== 'window');
      for (const p of external) expect(p.door && doors.includes(p.door), `${chunk}: ${p.a}-${p.b} ${p.kind} ${p.door ?? ''}`).toBe(true);
      for (const d of doors) expect(external.some((p) => p.door === d), `${chunk}: ${d} is an external door`).toBe(true);
      expect(external.some((p) => p.kind === 'glass' || p.seeThrough), `${chunk}: no see-through opening`).toBe(false);
    }
  });
});

describe('PERF-R02: the doorway rule on the study (mUpE)', () => {
  // door.study as built: plan (98.19, 96), leaf centre 4.45 m; the study lies south of the upper corridor
  const setup = () => {
    const w = new World('estate'); w.rooms = estateRooms();
    const leaf = new THREE.Object3D(); leaf.position.set(98.19, 4.45, -96); w.scene.add(leaf);
    (w.byId as Map<string, unknown>).set('door.study', { id: 'door.study', hit: [leaf] });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
    mesh.position.set(98, 4, -90); mesh.userData.chunk = 'mUpE'; w.scene.add(mesh);
    w.roomRegion(['mUpE'], ['study', 'botanic', 'linen'], Infinity, 30, ['door.study']);
    const cam = new THREE.PerspectiveCamera(65, 915 / 412, 0.05, 200);
    const look = (x: number, y: number, z: number, tx: number, ty: number, tz: number) => { cam.position.set(x, y, -z); cam.lookAt(tx, ty, -tz); cam.updateMatrixWorld(); w.updateCulling(cam.position, cam); };
    return { w, mesh, look, cam };
  };
  it('drawn from the corridor facing the open door, culled facing away, culled with the door shut', () => {
    const { w, mesh, look } = setup();
    let open = true; w.isOpen = () => open;
    look(98.2, 5.0, 97.6, 98.2, 4.4, 90); expect(w.hereRoom).toBe('ucorr'); expect(mesh.visible).toBe(true);
    look(98.2, 5.0, 97.6, 98.2, 4.4, 105); expect(mesh.visible).toBe(false);
    open = false; look(98.2, 5.0, 97.6, 98.2, 4.4, 90); expect(mesh.visible).toBe(false);
    w.dispose();
  });
  it('always drawn inside the room and when standing in the doorway, whatever the heading', () => {
    const { w, mesh, look } = setup(); w.isOpen = () => true;
    look(98, 5.0, 90, 98, 4.4, 100); expect(w.hereRoom).toBe('study'); expect(mesh.visible).toBe(true);
    look(98.2, 5.0, 96.4, 110, 4.4, 97); expect(mesh.visible).toBe(true); // in the doorway, looking along the corridor
    w.dispose();
  });
  it('a walkable floor plate between the eye and the doorway hides it; turning within the cone margin keeps it drawn', () => {
    const { w, mesh, look, cam } = setup(); w.isOpen = () => true;
    // from the hall floor (graph: hall → landing → corridor → study), up toward the study doorway
    look(94, 1.8, 97.8, 98.19, 4.45, 96); expect(w.hereRoom).toBe('hall'); expect(mesh.visible).toBe(true); // no floor yet: a sight line exists
    w.col.floors.push({ minX: 95, maxX: 107.6, minZ: 96, maxZ: 98.6, y: 3.35 }); // the upper corridor's floor plate
    look(94, 1.8, 97.8, 98.19, 4.45, 96); expect(mesh.visible).toBe(false);
    w.col.floors.length = 0;
    // facing the door, then turned 70° away (the doorway is still inside half FOV + 32°): still drawn
    look(98.2, 5.0, 97.6, 98.2, 4.4, 90); cam.rotateY(THREE.MathUtils.degToRad(70)); cam.updateMatrixWorld(); w.updateCulling(cam.position, cam);
    expect(mesh.visible).toBe(true);
    w.dispose();
  });
});

describe('PERF-R02: measurement harness', () => {
  it('Mode C samples are the legacy dev04d-walk-budget samples (same paths, same counts)', () => {
    const walk = readFileSync('scripts/dev04d-walk-budget.mjs', 'utf8');
    for (const [name] of LEGACY_PATHS) expect(walk).toContain(`['${name}', `);
    expect(LEGACY_PATHS.map(([, y, pts]: [string, number, number[][]]) => legacySamples(pts, y).length)).toEqual([291, 216, 77, 109]);
  });
  it('trajectories are deterministic, continuous and bounded in step and turn per frame', () => {
    for (const [, y, pts] of ALL_PATHS) for (const fps of [30, 60]) {
      const a = trajectory(pts, y, { fps }), b = trajectory(pts, y, { fps });
      expect(a).toEqual(b);
      for (let i = 1; i < a.length; i++) {
        const d = Math.hypot(a[i].x - a[i - 1].x, a[i].z - a[i - 1].z), dy = Math.abs(Math.atan2(Math.sin(a[i].yaw - a[i - 1].yaw), Math.cos(a[i].yaw - a[i - 1].yaw)));
        expect(d).toBeLessThanOrEqual(3.2 / fps + 1e-3 + (a[i].tag === 'start' ? Infinity : 0));
        expect(dy).toBeLessThanOrEqual(Math.PI / fps + 1e-4);
      }
    }
  });
  it('percentiles are nearest-rank and order-independent', () => {
    expect(stats([5, 1, 4, 2, 3])).toEqual({ n: 5, min: 1, median: 3, p95: 5, p99: 5, max: 5 });
    expect(stats(Array.from({ length: 100 }, (_, i) => 100 - i))).toMatchObject({ median: 51, p95: 95, p99: 99, max: 100 });
  });
});
