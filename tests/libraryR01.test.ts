// LIB-R01 static layout contracts. Runtime traversal and screenshots remain separate acceptance gates.
import { describe, expect, it } from 'vitest';
import { LIB_R01, LIB_R01_BAYS } from '../src/world/libraryR01';
import { prop, POSES, validatePlacement } from '../src/slice/placement';
import { GF, UF } from '../src/world/layout';
import { LIB_STAIR, LIB_STAIR_RISE, LIB_STAIR_TREAD_THICKNESS, solidSpiralTread, stairStepPoint, stairStepAngle, spiralRailWorldY } from '../src/world/libraryStairR01';

describe('LIB-R01: fitted shelves, puzzle and spiral access', () => {
  it('leaves the ground-floor glazing bays unobstructed', () => {
    const clear = (a: number, aw: number, w: number) => Math.abs(a - w) >= (aw + 1.1) / 2 + 0.10;
    for (const b of LIB_R01_BAYS.west) for (const z of [97, 101, 105])
      expect(clear(b.z, b.w, z)).toBe(true);
    for (const b of LIB_R01_BAYS.north) for (const x of [75, 78.5, 82])
      expect(clear(b.x, b.w, x)).toBe(true);
  });
  it('LIB-R03: wall desk is 4-6 cm from plaster, not in either western window opening', () => {
    const d=LIB_R01.desk;
    const back=d.x-(d.w+0.14)/2; // R02 decorative top is the widest part
    expect(back-72.4).toBeGreaterThanOrEqual(0.035);
    expect(back-72.4).toBeLessThanOrEqual(0.065);
    expect(d.z-d.d/2).toBeGreaterThan(97+1.1/2+0.30);
    expect(d.z+d.d/2).toBeLessThan(101-1.1/2-0.30);
    expect(LIB_R01_BAYS.west.some(b=>Math.abs(b.z-d.z)<(b.w+d.d)/2)).toBe(false);
  });
  it('LIB-R03: the desk chair nests under the east lip but leaves the inspection pose walkable', () => {
    const d=LIB_R01.desk, chairX=d.x+.76;
    expect(chairX-.26).toBeLessThan(d.x+d.w/2);
    expect(prop('b01.tableTop').x).toBe(d.x);
    const pose=POSES.find(p=>p.id==='pose.table')!;
    expect(pose.x-chairX).toBeGreaterThan(.3+.245);
    expect(Math.abs(pose.z-d.z)).toBeLessThan(.05);
  });
  it('LIB-R04: banker lamp is right-rear and loose catalogue books are safely front-right', () => {
    const desk=LIB_R01.desk, {lamp,looseBooks}=LIB_R01.deskObjects;
    // Looking west from the chair, right is +Z. Rear is west / negative X.
    expect(lamp.dz).toBeGreaterThan(0.5);
    expect(lamp.dx).toBeLessThan(0);
    expect(looseBooks.dx).toBeGreaterThan(lamp.dx + 0.45);
    expect(looseBooks.dz).toBeGreaterThan(0.55);

    // Rear hutch's front edge is x=-0.35, lamp base radius ~0.168.
    expect(lamp.dx - 0.168).toBeGreaterThan(-0.35);
    // Green dome extends ~0.37 along +Z; keep it inside the north desk-top lip.
    expect(lamp.dz + 0.37).toBeLessThan((desk.d + 0.14) / 2);

    // Loose books are not located on top of the right-most catalogue slot,
    // whose east extent is x=+0.21; a tilted book reaches ~0.205 to its west.
    expect(looseBooks.dx - 0.205).toBeGreaterThan(0.21);
    expect(looseBooks.dx + 0.205).toBeLessThan((desk.w + 0.14) / 2);
    expect(looseBooks.dz + 0.205).toBeLessThan((desk.d + 0.14) / 2);
  });
  it('keeps the B01 IDs and standing pose aligned on the new bureau, clear of slice keepouts', () => {
    const p = prop('b01.tableTop'), pose = POSES.find(v => v.id === 'pose.table')!;
    expect([p.x, p.z, p.w, p.d, p.h]).toEqual([LIB_R01.desk.x, LIB_R01.desk.z, LIB_R01.desk.w, LIB_R01.desk.d, LIB_R01.desk.h]);
    expect(pose.target).toBe('b01.table');
    expect(pose.x).toBeGreaterThan(p.x + p.w / 2 + 0.3);
    expect(Math.abs(pose.z - p.z)).toBeLessThan(0.1);
    expect(validatePlacement()).toEqual([]);
  });
  it('keeps DS01 album apart from the B01 work surface', () => {
    const d = prop('b01.tableTop'), a = prop('ds01.sideTable');
    expect(Math.hypot(d.x - a.x, d.z - a.z)).toBeGreaterThan(5);
  });
  it('LIB-STAIR-R01: solid tread actually meets the spindle and has a closed wooden underside', () => {
    const g=solidSpiralTread(9);
    g.computeBoundingBox();
    // Full 90 mm oak, with an actual underside and closed riser walls.
    expect(g.boundingBox!.max.y-g.boundingBox!.min.y).toBeCloseTo(LIB_STAIR_TREAD_THICKNESS,4);
    expect(g.index?.count ?? g.getAttribute('position').count).toBeGreaterThan(40);
    g.dispose();
    expect(LIB_STAIR.inner).toBeLessThan(.078); // spindle is .078 radius
  });
  it('LIB-STAIR-R01: last tread ends before flush gallery bridge, preventing coplanar faces', () => {
    const g=solidSpiralTread(LIB_STAIR.steps-1);g.computeBoundingBox();
    const lastX=LIB_STAIR.x+g.boundingBox!.max.x;
    expect(lastX).toBeLessThan(LIB_STAIR.bridge.x0);
    expect(LIB_STAIR.bridge.x0-lastX).toBeLessThan(.01);
    g.dispose();
  });
  it('LIB-STAIR-R01: guard encloses usable tread without sealing the exit', () => {
    expect(LIB_STAIR.guardEndsAtStep).toBeLessThan(LIB_STAIR.steps);
    expect(LIB_STAIR.guardEndsAtStep).toBeGreaterThan(20);
    // The walking centre remains 30+ cm from the posts/edge for a 30cm body.
    expect(LIB_STAIR.radius-LIB_STAIR.walkRadius).toBeGreaterThan(.35);
    expect(LIB_STAIR_RISE).toBeLessThan(.14);
    const last=stairStepPoint(LIB_STAIR.steps-1);
    expect(last.y).toBeCloseTo(UF,5);
    expect(last.x).toBeLessThan(83.2);
  });
  it('LIB-STAIR-R02: every iron baluster penetrates its shared curved handrail', () => {
    for (const i of [0, 3, 8, 13, 18, 23]) {
      const angle=stairStepAngle(i),p=stairStepPoint(i);
      const spindleBase=p.y-.06;
      const spindleTop=spiralRailWorldY(angle)+.018;
      expect(spindleTop-spindleBase).toBeGreaterThan(.95);
      expect(spindleTop-spindleBase).toBeLessThan(1.08);
      expect(spindleTop-spiralRailWorldY(angle)).toBeCloseTo(.018,5);
    }
  });
  it('LIB-STAIR-R02: transfer platform is distinct and protects a clear upstairs path', () => {
    const b=LIB_STAIR.bridge;
    expect(b.x1-b.x0).toBeGreaterThanOrEqual(.55);
    expect(b.z1-b.z0).toBeGreaterThan(1.25);
    // No barrier across the east exit x=83.2; southern/northern rails stand
    // outside the safe approach centre z=105.26.
    expect(105.26-b.z0).toBeGreaterThan(.5);
    expect(b.z1-105.26).toBeGreaterThan(.6);
  });
  it('LIB-STAIR-R01: flush oak bridge joins existing slab without top overlap', () => {
    expect(LIB_STAIR.bridge.x1).toBe(83.2);
    expect(LIB_STAIR.bridge.x0).toBeGreaterThan(82.6);
    expect(LIB_STAIR.bridge.z0).toBe(104.66);
    expect(LIB_STAIR.bridge.z1).toBe(105.99);
  });
  it('ends the spiral on the upstairs east-gallery line with climbable rises', () => {
    const { x, z, radius, steps } = LIB_R01.stair;
    expect(steps).toBeGreaterThanOrEqual(20);
    expect((UF - GF) / steps).toBeLessThan(0.2);
    expect(x - radius).toBeGreaterThan(80);
    expect(z + radius).toBeLessThan(107.8);
    expect(LIB_R01.landing.x0).toBeLessThan(83.2);
    expect(LIB_R01.landing.x1).toBe(83.2);
    expect(LIB_R01.landing.z0).toBeGreaterThan(104.6);
    expect(LIB_R01.landing.z1).toBeLessThan(106.0);
  });
});
