// DEV-03: the estate-wide woodland. The woodland kit of the approved BOSLUST sample (branch-structured oak, beech,
// birch and Scots pine with four LODs; hazel and holly; ferns, bilberry, foxglove, lily of the valley, anemone,
// grasses; litter, verge stones, stumps; contact decals) now plants EVERY tree of the estate: the south forest, the
// north/east/west masses and glades, the garden specimens and the ring beyond the fence. Positions and trunk colliders
// are the layout's own (forest.ts, estate.ts, grounds.ts collect them here instead of drawing blob trees); the planner
// (woodlandPlan.ts) decides per site what grows under them. On top of the sample's recipe this adds the layers that
// make a forest rather than trees on a lawn: young trees in thickets, screens of bushes and saplings round the
// clearings (BOSLUST, the fire, the well, the shed, the wickerman and the golf tee are found, not seen from afar),
// fallen dead wood and mossy boulders.
//
// Render budget (phone guide ≤ 150 calls / 250 k triangles at "low"): every tree and bush of the estate in ONE
// multi-draw batch (LOD by distance with hysteresis, per-instance frustum culling, trees drawn to 115 m, bushes to
// 50 m); every plant and litter leaf in one range-faded batch (shown within 11–24 m); stones and boulders in one;
// dead wood in one; contact decals in one instanced mesh. Five draw calls for all vegetation (instanced fallback: one
// per geometry in view).
import * as THREE from 'three';
import type { World } from '../interactions/world';
import type { Ctx } from './arch';
import type { TreeSpec } from './nature';
import { scatter, distToPolyline } from './nature';
import { planWoodland, stream, hash01, type WoodlandSite, type SourceTree, type SourceStump, type WoodlandPlan, type PlacedTree } from './woodlandPlan';
import { TreeBatches, PlantBatch, BOSLUST_SITE, DECAL, WOOD, stumpsV2, contactAt, inBackdrop, mat, TreeGrid } from './boslustSample';
import { inZone } from './boslustZone';
import { woodMats, rockModel, litterLeafModel, logModel, LEAF_TINT, type TreeSpecies, type PlantKind } from './woodkit';
import { CAPS } from '../core/caps';
import { ESTATE, WOODS, CLEARINGS, HILL_CUT, DRIVEWAY, WICKERMAN, GOLF_TEE, type Rect } from './layout';
import { FOREST_PATHS, terrainHeight } from './terrain';
import { ROUTE_LINES, vegetationClear } from './footprints';
import { inRect } from './geom2d';

export type WoodGroup = 'forest' | 'mass' | 'garden' | 'outer';
interface Collected { t: SourceTree; group: WoodGroup }

const ROUTE = (id: string) => ROUTE_LINES.find((r) => r.id === id)!.pts;
/** Walked lines in the south forest: the forest network, the wickerman loop and the golf spur. */
const SOUTH_PATHS = [...FOREST_PATHS, ROUTE('wickermanLoop'), ROUTE('golfSpur')];
const NORTH_PATHS = ROUTE_LINES.filter((r) => r.id !== 'wickermanLoop' && r.id !== 'golfSpur').map((r) => r.pts);
const pathDist = (paths: readonly (readonly (readonly [number, number])[])[], x: number, z: number) => { let d = Infinity; for (const p of paths) d = Math.min(d, distToPolyline(x, z, p)); return d; };
const inCut = (x: number, z: number) => x > HILL_CUT.x0 - 1.5 && x < HILL_CUT.x1 + 1.5 && z > HILL_CUT.z0 - 1 && z < 24;
const inClearing = (x: number, z: number, m = 0) => CLEARINGS.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + m);
/** Thickets vs open stands: a slow field (−1 … 1) so density varies in pockets, not uniformly. */
const thicket = (x: number, z: number) => Math.sin(x * 0.083 + Math.sin(z * 0.051) * 1.7) * Math.cos(z * 0.071 - x * 0.019) + 0.35 * Math.sin(x * 0.21 + z * 0.17);
const AREA0 = 50 * 47.4; // the BOSLUST zone the planner's defaults were tuned for
/** Fallen-log sizes (length, radius): baked per variant, instances only scale uniformly. */
const LOGS: [number, number][] = [[2.4, 0.17], [3.2, 0.21], [4.1, 0.26], [2.9, 0.19]];

/** Planted area of the south forest (outside the BOSLUST zone, which keeps its approved plan). */
const SOUTH_SITE: WoodlandSite = {
  seed: 3101,
  bounds: { x0: 0.8, x1: ESTATE.w - 0.8, z0: 0.8, z1: ESTATE.forestEdge - 0.5 },
  inArea: (x, z) => z < ESTATE.forestEdge - 0.5 && !inZone(x, z),
  keepClear: (x, z) => inCut(x, z) || inClearing(x, z, -1.2) || distToPolyline(x, z, DRIVEWAY) < 3.4 || !vegetationClear(x, z, 'small'),
  paths: SOUTH_PATHS,
  ground: terrainHeight,
};
const massSite = (m: Rect & { id: string }, i: number): WoodlandSite => ({
  seed: 3200 + i * 17,
  bounds: { x0: m.x0, x1: m.x1, z0: m.z0, z1: m.z1 },
  inArea: (x, z) => inRect(x, z, m),
  keepClear: (x, z) => !vegetationClear(x, z, 'small'),
  paths: NORTH_PATHS,
  ground: terrainHeight,
});
/** The old nest-box oak on the lake's east shore (grounds.ts mounts the box ON its trunk with woodkit.trunkAt). */
export const NEST_OAK = { x: 80.2, z: 148.6, species: 'oak' as const, v: 1, yaw: 0.9 };
/** Trees only (garden specimens, the ring beyond the fence): no understory is planned. */
const TREES_ONLY: WoodlandSite = { seed: 3300, bounds: { x0: 0, x1: 12, z0: 0, z1: 12 }, inArea: () => false, keepClear: () => true, paths: [], ground: terrainHeight, heroes: [NEST_OAK] };

export class EstateWoods {
  private trees: Collected[] = [];
  private stumps: SourceStump[] = [];
  /** Called by the Vegetation capture hook for every tree of the layout (except the clipped garden cypresses). */
  addTree(t: TreeSpec, chunk: string) {
    const group: WoodGroup = chunk === 'outer' ? 'outer' : chunk === 'garden' ? 'garden' : chunk.startsWith('w') ? 'mass' : 'forest';
    const y = t.y ?? terrainHeight(t.x, t.z);
    this.trees.push({ t: { x: t.x, z: t.z, y, h: t.h, r: t.r, kind: t.kind, hue: t.hue }, group });
  }
  /** Garden planting (DEV-03): woodland-kit plants on the lawns and in the beds, drawn in the plants batch. */
  private garden: { kind: PlantKind; v: number; x: number; z: number; s: number; y?: number; show?: number }[] = [];
  addPlant(kind: PlantKind, v: number, x: number, z: number, s = 1, y?: number, show?: number) { this.garden.push({ kind, v, x, z, s, y, show }); }
  /** A stump of the forest layout (its collider exists and is never moved). */
  addStump(s: SourceStump) { this.stumps.push(s); }
  /** Trunk positions of the woodland (forest floor colouring under the crowns). */
  points(): [number, number][] { return this.trees.filter((c) => c.group === 'forest' || c.group === 'mass').map((c) => [c.t.x, c.t.z]); }

  build(w: World, c: Ctx) {
    const of = (g: WoodGroup, f: (t: SourceTree) => boolean = () => true) => this.trees.filter((x) => x.group === g && f(x.t)).map((x) => x.t);
    const plans: WoodlandPlan[] = [];
    // 1. the BOSLUST approach: exactly the approved sample plan (its trees, its backdrop strip, its stumps)
    plans.push(planWoodland(BOSLUST_SITE, of('forest', (t) => inZone(t.x, t.z)), of('outer', (t) => inBackdrop(t.x, t.z)), this.stumps.filter((s) => inZone(s.x, s.z))));
    // 2. the rest of the south forest: the same recipe over the whole band, with flowers wherever it is light enough
    const southArea = (ESTATE.w - 1.6) * (ESTATE.forestEdge - 1.3) - AREA0;
    plans.push(planWoodland(SOUTH_SITE, of('forest', (t) => !inZone(t.x, t.z)), [], this.stumps.filter((s) => !inZone(s.x, s.z)),
      { scale: southArea / AREA0, bushP: 0.5, litterN: 10, foxBand: [3, ESTATE.forestEdge - 4], anemoneBand: [3, ESTATE.forestEdge - 4] }));
    // 3. the masses: dense woods get a full understory, the glades and the meadow only a light one
    WOODS.forEach((m, i) => {
      const list = of('mass', (t) => inRect(t.x, t.z, m));
      const dense = m.gap < 8, area = (m.x1 - m.x0) * (m.z1 - m.z0);
      plans.push(planWoodland(massSite(m, i), list, [], [], dense
        ? { scale: area / AREA0, bushP: 0.62, litterN: 9, foxBand: [m.z0 + 2, m.z1 - 2], anemoneBand: [m.z0 + 2, m.z1 - 2] }
        : { scale: area / AREA0, bushP: 0.22, bushMax: 2, litterN: 6, cover: 0.35, foxBand: [m.z0 + 2, m.z1 - 2], anemoneBand: [m.z0 + 2, m.z1 - 2] }));
    });
    // 4. specimens on the lawns and the ring beyond the fence: trees only
    plans.push(planWoodland(TREES_ONLY, of('garden'), of('outer', (t) => !inBackdrop(t.x, t.z)), []));

    // ---- layers beyond the sample recipe (deterministic per position, like the planner)
    const placed = plans.flatMap((p) => p.trees.filter((t) => !t.backdrop));
    const grid = new TreeGrid(placed.map((t) => [t.x, t.z]));
    const near = (x: number, z: number, d: number) => grid.crown(x, z, d) > 0;
    const extraTrees: PlacedTree[] = [], extraBushes: WoodlandPlan['bushes'] = [];
    const stumpNear = (x: number, z: number, d: number) => this.stumps.some((s) => Math.hypot(s.x - x, s.z - z) < s.s + d);
    const sapling = (x: number, z: number, k: number) => {
      if (stumpNear(x, z, 0.8)) return;
      const r = stream(4001, 'sapling', x, z), h = hash01(x, z, 9);
      const species: TreeSpecies = h < 0.55 ? 'beech' : h < 0.82 ? 'birch' : 'oak';
      const s = (species === 'birch' ? 0.34 : 0.3) + r() * 0.16 * k;
      const tint = new THREE.Color(LEAF_TINT[species]).offsetHSL((r() - 0.5) * 0.02, 0, (r() - 0.5) * 0.06);
      extraTrees.push({ x, z, y: terrainHeight(x, z) - 0.04, species, v: Math.floor(hash01(x, z, 10) * 3), yaw: r() * 6.28, scale: [s, s * (0.95 + r() * 0.15), s], tint, backdrop: false });
      w.col.addCircle(x, z, 0.12, terrainHeight(x, z) - 0.2, terrainHeight(x, z) + 3);
    };
    const bush = (x: number, z: number, anchor: string) => {
      const r = stream(4002, 'screen', x, z), holly = r() < 0.3, sc = 0.85 + r() * 0.45;
      const species = holly ? 'holly' as const : 'hazel' as const;
      extraBushes.push({ x, z, y: terrainHeight(x, z) - 0.05, species, v: Math.floor(r() * 3), yaw: r() * 6.3, scale: sc, tint: new THREE.Color(LEAF_TINT[species]).offsetHSL((r() - 0.5) * 0.02, 0, (r() - 0.5) * 0.06), anchor });
    };
    const southOk = (x: number, z: number, corridor: number) => z < ESTATE.forestEdge - 1 && !inZone(x, z) && !inCut(x, z) && pathDist(SOUTH_PATHS, x, z) > corridor && distToPolyline(x, z, DRIVEWAY) > 4.5 && !inClearing(x, z, 1) && vegetationClear(x, z, 'small');
    // young trees in the thickets (south forest outside the approved zone, and the dense masses)
    for (const [x, z] of scatter(stream(4003, 'saplings-south'), 2, ESTATE.w - 2, 2, ESTATE.forestEdge - 2, 3.4, 9000, (x, z) => thicket(x, z) > 0.25 && southOk(x, z, 2.6) && !near(x, z, 1.8))) sapling(x, z, 1);
    for (const m of WOODS.filter((m) => m.gap < 8)) {
      for (const [x, z] of scatter(stream(4004, 'saplings', m.id), m.x0 + 1, m.x1 - 1, m.z0 + 1, m.z1 - 1, 3.2, Math.round(((m.x1 - m.x0) * (m.z1 - m.z0)) / 4), (x, z) => thicket(x, z) > 0.0 && vegetationClear(x, z, 'small') && pathDist(NORTH_PATHS, x, z) > 2.6 && !near(x, z, 1.8))) sapling(x, z, 1);
    }
    // screens round the clearings: a broken ring of hazel and holly at the edge, young trees behind; path mouths open
    const screens: { x: number; z: number; r: number; id: string }[] = [
      ...CLEARINGS.filter((cl) => cl.r < 10 && cl.z < ESTATE.forestEdge - 10).map((cl, i) => ({ x: cl.x, z: cl.z, r: cl.r, id: `clearing${i}` })),
      { x: WICKERMAN.x, z: WICKERMAN.z, r: WICKERMAN.r, id: 'wickerman' },
      { x: (GOLF_TEE.x0 + GOLF_TEE.x1) / 2, z: (GOLF_TEE.z0 + GOLF_TEE.z1) / 2, r: 4.6, id: 'golf' },
    ];
    for (const sc of screens) {
      const ring = (d: number, step: number, put: (x: number, z: number) => void, keep: number) => {
        const n = Math.round((2 * Math.PI * d) / step);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + hash01(sc.x, sc.z, i) * 0.3, dd = d + (hash01(sc.z, sc.x, i) - 0.5) * 1.2;
          const x = sc.x + Math.cos(a) * dd, z = sc.z + Math.sin(a) * dd;
          if (hash01(x, z, 11) > keep) continue;
          if (inZone(x, z) || pathDist(SOUTH_PATHS, x, z) < 3.2 || pathDist(NORTH_PATHS, x, z) < 3.2 || distToPolyline(x, z, DRIVEWAY) < 4.5 || inCut(x, z) || !vegetationClear(x, z, 'small') || near(x, z, 1.3)) continue;
          put(x, z);
        }
      };
      ring(sc.r + 2.0, 1.7, (x, z) => bush(x, z, sc.id), 0.8);
      ring(sc.r + 4.6, 3.0, (x, z) => sapling(x, z, 1.2), 0.75);
    }

    // ---- render: one batch for every tree and bush, one for plants + litter, one for stones/boulders, one for dead wood
    const tb = new TreeBatches();
    const pb = new PlantBatch();
    const rb = new PlantBatch(6, woodMats().rock, { forestRocks: true });
    const db = new PlantBatch(6, woodMats().tree, { deadWood: true });
    const stoneG = () => { const g = rockModel(7); g.userData.keepColor = true; return g; };
    const boulders = [11, 23, 37, 53];
    for (const p of plans) {
      for (const t of p.trees) {
        tb.add({ kind: 'tree', species: t.species, v: t.v }, mat(t.x, t.y, t.z, t.yaw, t.scale), t.tint);
        if (!t.backdrop) contactAt(t.x, t.z, DECAL[t.species] * t.scale[0], t.species === 'birch' ? 0.4 : 0.5, t.yaw);
      }
      for (const b of p.bushes) { tb.add({ kind: 'bush', species: b.species, v: b.v }, mat(b.x, b.y, b.z, b.yaw, b.scale), b.tint); contactAt(b.x, b.z, (b.species === 'holly' ? 1.6 : 2.0) * b.scale, 0.4, b.yaw); }
      for (const q of p.plants) pb.add(q.kind, q.v, mat(q.x, q.y, q.z, q.yaw, q.scale), q.tint);
      for (const l of p.litter) pb.addGeo('litter', litterLeafModel, mat(l.x, l.y, l.z, l.yaw, l.scale), WOOD.litter[l.color], 13, 'litter');
      for (const st of p.stones) rb.addGeo('stone', stoneG, mat(st.x, st.y, st.z, st.yaw, st.scale), new THREE.Color(WOOD.rock).multiplyScalar(st.k), 32, 'stone');
      stumpsV2(c, p.stumps);
    }
    for (const q of this.garden) pb.add(q.kind, q.v, mat(q.x, q.y ?? terrainHeight(q.x, q.z) - 0.02, q.z, hash01(q.x, q.z, 12) * 6.28, q.s), new THREE.Color(1, 1, 1).offsetHSL(0, 0, (hash01(q.z, q.x, 13) - 0.5) * 0.08), q.show ?? (q.kind === 'foxglove' ? 30 : 22));
    for (const t of extraTrees) { tb.add({ kind: 'tree', species: t.species, v: t.v }, mat(t.x, t.y, t.z, t.yaw, t.scale), t.tint); contactAt(t.x, t.z, DECAL[t.species] * t.scale[0] * 1.4, 0.35, t.yaw); }
    for (const b of extraBushes) { tb.add({ kind: 'bush', species: b.species, v: b.v }, mat(b.x, b.y, b.z, b.yaw, b.scale), b.tint); contactAt(b.x, b.z, (b.species === 'holly' ? 1.6 : 2.0) * b.scale, 0.4, b.yaw); }
    // fallen dead wood (with colliders: you walk round a trunk, as in a real wood) and mossy boulders
    let logs = 0, rocks = 0;
    const woodOk = (x: number, z: number) => (z < ESTATE.forestEdge - 2 ? southOk(x, z, 3.2) : WOODS.some((m) => m.gap < 8 && inRect(x, z, m, -1)) && vegetationClear(x, z, 'small') && pathDist(NORTH_PATHS, x, z) > 3.2) && !near(x, z, 1.4) && !stumpNear(x, z, 0.9);
    for (const [x, z] of scatter(stream(4005, 'logs'), 2, ESTATE.w - 2, 2, ESTATE.d - 2, 13, 4000, woodOk)) {
      // four authored log sizes (instances scale uniformly: a non-uniform instance scale would bend the normals)
      const r = stream(4005, 'log', x, z), v = Math.floor(r() * 4), k = 0.9 + r() * 0.2, len = LOGS[v][0] * k, rad = LOGS[v][1] * k, yaw = r() * Math.PI;
      const ax = x - (Math.cos(yaw) * len) / 2, az = z + (Math.sin(yaw) * len) / 2, bx = x + (Math.cos(yaw) * len) / 2, bz = z - (Math.sin(yaw) * len) / 2;
      const ya = terrainHeight(ax, az), yb = terrainHeight(bx, bz);
      if (Math.abs(ya - yb) > 0.35 || !woodOk(ax, az) || !woodOk(bx, bz)) continue;
      const tilt = Math.atan2(yb - ya, len);
      db.addGeo(`log${v}`, () => logModel(91 + v * 7, LOGS[v][0], LOGS[v][1]), mat(ax, ya - rad * 0.35, az, yaw, k, 0, tilt), new THREE.Color('#8a7a68').multiplyScalar(0.85 + r() * 0.25), 55, 'log');
      for (let s = 0.3; s < len - 0.2; s += 0.6) { const px = ax + Math.cos(yaw) * s, pz = az - Math.sin(yaw) * s, py = terrainHeight(px, pz); w.col.addCircle(px, pz, rad + 0.04, py - 0.2, py + rad * 1.5); }
      contactAt(x, z, rad * 5, 0.45, yaw, (len * 1.05) / (rad * 5)); // decal: long axis along the log
      logs++;
    }
    for (const [x, z] of scatter(stream(4006, 'boulders'), 2, ESTATE.w - 2, 2, ESTATE.d - 2, 17, 3000, (x, z) => woodOk(x, z) && thicket(x, z) < 0.6)) {
      const r = stream(4006, 'boulder', x, z), s = 0.45 + r() * 0.75, i = Math.floor(r() * boulders.length), yaw = r() * 6.3;
      const y = terrainHeight(x, z) - 0.3 * s;
      rb.addGeo(`boulder${i}`, () => { const g = rockModel(boulders[i]); g.userData.keepColor = true; return g; }, mat(x, y, z, yaw, s), new THREE.Color(WOOD.rock).multiplyScalar(0.85 + r() * 0.2), 75, 'boulder');
      if (s > 0.6) w.col.addCircle(x, z, s * 0.75, y, y + s * 0.8);
      contactAt(x, z, s * 2.6, 0.5, yaw, 1.15);
      rocks++;
    }
    tb.build(w); pb.build(w); rb.build(w); db.build(w);
    // diagnostics for the measurement scripts, tests and the debug overlay (no effect on rendering)
    w.scene.userData.vegPath = CAPS.multiDraw ? 'multi-draw' : 'instanced';
    w.scene.userData.vegStats = () => ({ ...tb.stats(), plantsShown: pb.shown });
    w.scene.userData.vegLodAt = (x: number, z: number) => tb.lodAt(x, z);
    w.scene.userData.vegList = () => tb.list();
    w.scene.userData.vegPlan = { trees: [...plans.flatMap((p) => p.trees), ...extraTrees], bushes: [...plans.flatMap((p) => p.bushes), ...extraBushes], stumps: plans.flatMap((p) => p.stumps), zone: plans[0] };
    w.scene.userData.woodCounts = { trees: tb.size, plants: pb.size, rocks: rb.size, logs, boulders: rocks, saplings: extraTrees.length, screenBushes: extraBushes.length };
    return w.scene.userData.woodCounts as Record<string, number>;
  }
}
