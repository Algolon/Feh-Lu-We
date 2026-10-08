// DEV-04A visual correctness contracts (pure parts): the opening / wall-art registry rules, the path ownership network,
// the sauna steps, the attic telescope's sightline through the roof window, and the support guard on tipped cylinders.
// The built world is checked in the browser by scripts/e2e-dev04a.mjs (clearance, coplanar surfaces, walks, budgets).
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { artFootprint, wallArtConflicts, type Registry, WINDOW_MARGIN } from '../src/world/openings';
import { clipLine, pathNetwork, GROUND_OWNERS } from '../src/world/junctions';
import { inRect } from '../src/world/geom2d';
import { SAUNA_STEPS, SAUNA_FLOOR, ATTIC_ROOF_WINDOW, ATTIC_NOOK, AF, roofUnderside, WICKERMAN, WICKERMAN_SIDE } from '../src/world/layout';
import { TELESCOPE } from '../src/world/furniture';
import { cyl, rod, supportWarnings, type Batcher } from '../src/world/kit';
import { vegetationClear, inWickermanClearing } from '../src/world/footprints';

const reg = (r: Partial<Registry>): Registry => ({ openings: [], sweeps: [], art: [], ...r });
const door = { kind: 'door' as const, axis: 'z' as const, f: 85, t: 0.3, a0: 89.5, a1: 90.5, y0: 3.35, y1: 5.45, id: 'door.test' };
const win = { kind: 'window' as const, axis: 'x' as const, f: 92, t: 0.3, a0: 104.2, a1: 105.4, y0: 1.0, y1: 2.6, id: 'win.test' };

describe('DEV-04A wall-art contract', () => {
  it('a painting over a door opening (or its architrave) conflicts; one clear of it does not', () => {
    // the old Sterren-room painting: centred on the door at z 90
    expect(wallArtConflicts(reg({ openings: [door], art: [artFootprint('p', 85.12, 4.4, 90, Math.PI / 2, 0.9, 0.7)] }))).toHaveLength(1);
    // within the architrave margin (0.15) still conflicts
    expect(wallArtConflicts(reg({ openings: [door], art: [artFootprint('p', 85.12, 4.4, 91.0, Math.PI / 2, 0.9, 0.7)] }))).toHaveLength(1);
    // moved along the wall (as built: z 86.2)
    expect(wallArtConflicts(reg({ openings: [door], art: [artFootprint('p', 85.12, 4.4, 86.2, Math.PI / 2, 0.9, 0.7)] }))).toHaveLength(0);
  });
  it('a painting over a window, its frame or sill band conflicts', () => {
    expect(wallArtConflicts(reg({ openings: [win], art: [artFootprint('p', 104.8, 2.0, 91.92, Math.PI, 1.0, 0.8)] }))[0]?.kind).toBe('window');
    // just beside the surround margin is fine
    const x = win.a1 + WINDOW_MARGIN.side + 0.5 + 0.01;
    expect(wallArtConflicts(reg({ openings: [win], art: [artFootprint('p', x, 2.0, 91.92, Math.PI, 1.0, 0.8)] }))).toHaveLength(0);
  });
  it('art on the other wall axis never matches an opening', () => {
    expect(wallArtConflicts(reg({ openings: [door], art: [artFootprint('p', 90, 4.4, 85, 0, 0.9, 0.7)] }))).toHaveLength(0);
  });
  it('art in a door leaf sweep conflicts', () => {
    const sweep = { id: 'door.sweep', x0: 85, x1: 86.2, z0: 89.4, z1: 90.6, y0: 3.35, y1: 5.45 };
    expect(wallArtConflicts(reg({ sweeps: [sweep], art: [artFootprint('p', 85.12, 4.4, 90, Math.PI / 2, 0.9, 0.7)] }))[0]?.kind).toBe('sweep');
  });
});

describe('DEV-04A path ownership network', () => {
  it('clipLine stops a line at an owned rectangle and reports the owned end', () => {
    const owned = (x: number, z: number) => inRect(x, z, { x0: 10, x1: 20, z0: -5, z1: 5 });
    const parts = clipLine([[0, 0], [30, 0]], owned);
    expect(parts).toHaveLength(2);
    expect(parts[0].pts[0][0]).toBeCloseTo(0, 6);
    expect(parts[0].pts.at(-1)![0]).toBeCloseTo(10, 1);
    expect(parts[0].s1).toBe(true);
    expect(parts[1].pts[0][0]).toBeCloseTo(20, 1);
    expect(parts[1].s0).toBe(true);
  });
  it('no forest path or route ribbon runs over a hard surface that owns its ground', () => {
    const bad: string[] = [];
    for (const line of pathNetwork()) {
      if (line.kind === 'drive') continue;
      for (const run of line.runs) for (const r of run.rows) {
        for (const o of GROUND_OWNERS) if (inRect(r.x, r.z, o.r, -0.25)) bad.push(`${line.id}@${r.x.toFixed(1)},${r.z.toFixed(1)} in ${o.id}`);
      }
    }
    expect(bad).toEqual([]);
  });
  it('every route keeps at least one drawn run (nothing was clipped away entirely)', () => {
    for (const line of pathNetwork()) expect(line.runs.reduce((n, r) => n + r.rows.length, 0), line.id).toBeGreaterThan(1);
  });
});

describe('DEV-04A sauna steps (replaces the ramp)', () => {
  const S = SAUNA_STEPS;
  it('three even risers of ~0.17 m from the deck to the sauna floor, goings ≥ 0.2 m, a landing ≥ 0.8 m deep', () => {
    const rise = (S.yTop - S.yFoot) / S.risers, going = (S.zFoot - S.zLanding) / S.risers;
    expect(S.yTop).toBe(SAUNA_FLOOR);
    expect(rise).toBeGreaterThan(0.14);
    expect(rise).toBeLessThanOrEqual(0.18);
    expect(going).toBeGreaterThanOrEqual(0.2);
    expect(S.zLanding - S.zDoor).toBeGreaterThanOrEqual(0.8);
    expect(S.x1 - S.x0).toBeGreaterThanOrEqual(1.2);
  });
});

describe('DEV-04A attic observation nook', () => {
  it('the telescope sits in the nook and its line of sight leaves through the roof window', () => {
    const s = ATTIC_ROOF_WINDOW.scope, yaw = Math.PI / 2; // as built in manor.ts: aimed east, up the east slope
    expect(inRect(s.x, s.z, ATTIC_NOOK)).toBe(true);
    const p = { x: s.x, y: AF + TELESCOPE.pivotY, z: s.z }, d = { x: Math.cos(s.alt) * Math.sin(yaw), y: Math.sin(s.alt), z: Math.cos(s.alt) * Math.cos(yaw) };
    let hit: { x: number; z: number } | null = null;
    for (let t = 0; t < 6; t += 0.005) {
      const x = p.x + d.x * t, y = p.y + d.y * t, z = p.z + d.z * t;
      if (y >= roofUnderside(x, z)) { hit = { x, z }; break; }
    }
    expect(hit).not.toBeNull();
    expect(inRect(hit!.x, hit!.z, ATTIC_ROOF_WINDOW, -0.1)).toBe(true);
  });
});

describe('DEV-04A wickerman clearing', () => {
  it('no tree may stand in the clearing; its side path starts on the loop side and ends at the clearing', () => {
    expect(vegetationClear(WICKERMAN.x, WICKERMAN.z, 'tree')).toBe(false);
    expect(vegetationClear(WICKERMAN.x + WICKERMAN.r * 0.7, WICKERMAN.z, 'tree')).toBe(false);
    const end = WICKERMAN_SIDE.at(-1)!;
    expect(inWickermanClearing(end[0], end[1], 0.5)).toBe(true);
    expect(inWickermanClearing(WICKERMAN_SIDE[0][0], WICKERMAN_SIDE[0][1])).toBe(false);
  });
});

describe('DEV-04A support guard', () => {
  const b = { add: () => {} } as unknown as Batcher, m = new THREE.MeshBasicMaterial();
  it('a long cylinder tipped onto its side through cyl() (base-height semantics) is reported; rod() is not', () => {
    supportWarnings.length = 0;
    rod(b, m, '#fff', 0, 0.12, 0, 0.1, 0.1, 1.2, 8, { rz: Math.PI / 2 });
    cyl(b, m, '#fff', 0, 0, 0, 0.1, 0.1, 1.2, 8); // upright: fine
    expect(supportWarnings).toEqual([]);
    cyl(b, m, '#fff', 0, 0, 0, 0.1, 0.1, 1.2, 8, { rz: Math.PI / 2 });
    expect(supportWarnings).toHaveLength(1);
    supportWarnings.length = 0;
  });
});
