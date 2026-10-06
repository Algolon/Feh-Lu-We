// Deterministic woodland placement (art-refresh kit): WHAT goes WHERE, as plain records — no meshes, no scene.
// The BOSLUST sample renders a plan with boslustSample.ts; another site supplies its own `WoodlandSite`.
//
// Determinism rules (stabilisation pass):
// - Every object draws its random values from its OWN stream, seeded by the site seed and a stable ID: its category
//   plus its rounded plan position, or the anchor it belongs to (e.g. the tree a bush group or a lily patch grows
//   under). Nothing depends on iteration order or on how many objects of another category were placed before it.
// - Each member of a group draws all of its values before any placement test, so rejecting one member never
//   shifts the next one.
// - Species and variant are chosen by position hash (`hash01`), so changing one species' variants does not move
//   any other category, and adding a tree (e.g. to the backdrop) does not move any bush or plant.
import * as THREE from 'three';
import { mulberry32, type Rng } from '../core/rng';
import { scatter, distToPolyline } from './nature';
import { PLANT_VARIANTS, LEAF_TINT, trunkFootprint, type TreeSpecies, type BushSpecies, type PlantKind } from './woodkit';

type P3 = [number, number, number];

/** A stable random stream: FNV-1a of `seed` and the ID parts (numbers rounded to cm) → mulberry32. */
export function stream(seed: number, ...id: (string | number)[]): Rng {
  const key = id.map((p) => (typeof p === 'number' ? p.toFixed(2) : p)).join('|');
  let h = (2166136261 ^ seed) >>> 0;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return mulberry32(h);
}
/** Position hash in [0, 1) (species, variant and height choices; unchanged from the first sample). */
export const hash01 = (x: number, z: number, k: number) => { const v = Math.sin(x * 12.9898 + z * 78.233 + k * 37.719) * 43758.5453; return v - Math.floor(v); };

/** Where a woodland is planted. Today's BOSLUST coordinates live in boslustSample.ts (`BOSLUST_SITE`). */
export interface WoodlandSite {
  seed: number;
  /** Scatter rectangle (plan x/z) for ground cover. */
  bounds: { x0: number; x1: number; z0: number; z1: number };
  /** Inside the planted area. */
  inArea: (x: number, z: number) => boolean;
  /** Never plant here (e.g. the walkway of a cut, the area round a signpost or clue). */
  keepClear: (x: number, z: number) => boolean;
  /** Paths: verge grass and stones line them; nothing is planted in their corridor. */
  paths: readonly (readonly (readonly [number, number])[])[];
  /** Ground height. */
  ground: (x: number, z: number) => number;
  /** Authored trees: species, variant and heading fixed (e.g. a hero oak framing a view). */
  heroes?: { x: number; z: number; species: TreeSpecies; v: number; yaw: number }[];
}
/** A tree position from the layout (position, size hints and kind from the original scatter; collider exists). */
export interface SourceTree { x: number; z: number; y: number; h: number; r: number; kind: 'oak' | 'birch' | 'cypress' | 'pine'; hue: number }
/** A stump from the layout; its collider (circle radius `s`, height 0.9 s) exists and is never moved. */
export interface SourceStump { x: number; z: number; y: number; s: number }

export interface PlacedTree { x: number; z: number; y: number; species: TreeSpecies; v: number; yaw: number; scale: P3; tint: THREE.Color; backdrop: boolean }
export interface PlacedBush { x: number; z: number; y: number; species: BushSpecies; v: number; yaw: number; scale: number; tint: THREE.Color; anchor: string }
export interface PlacedPlant { kind: PlantKind; v: number; x: number; z: number; y: number; yaw: number; scale: number; tint: THREE.Color }
export interface PlacedLitter { x: number; z: number; y: number; yaw: number; scale: number; color: number }
export interface PlacedStone { x: number; z: number; y: number; yaw: number; scale: P3; k: number }
/**
 * A stump's treatment. `plain`: drawn at its collider. `absorbed`: it stood inside a tree's base; the tree is turned
 * so a buttress root covers the whole collision circle, and no separate stump is drawn. `nurse`: the tree grows out
 * of an old, decayed stump; the stump is drawn as the smallest circle holding its collider and the tree's base
 * (vx/vz/vr), with a moss cap instead of a fresh saw cut.
 */
export interface PlacedStump { x: number; z: number; y: number; s: number; treatment: 'plain' | 'absorbed' | 'nurse'; vx: number; vz: number; vr: number; tree?: string }
export interface WoodlandPlan { trees: PlacedTree[]; bushes: PlacedBush[]; plants: PlacedPlant[]; litter: PlacedLitter[]; stones: PlacedStone[]; stumps: PlacedStump[] }
export interface PlanOptions { variantOf?: (species: TreeSpecies, x: number, z: number, v: number) => number }

/** Trunk collider radii of the layout's trees (forest.ts): birch 0.22, others 0.34. */
export const TRUNK_COLLIDER = (sp: TreeSpecies) => (sp === 'birch' ? 0.22 : 0.34);
const id = (x: number, z: number) => `${x.toFixed(2)},${z.toFixed(2)}`;
/** A stump's drawn base radius relative to its collider (stumpsV2: radius 1.18 at the foot with a little flare). */
export const STUMP_VISUAL = 1.3;

export function planWoodland(site: WoodlandSite, trees: SourceTree[], backdrop: SourceTree[], stumps: SourceStump[], opt: PlanOptions = {}): WoodlandPlan {
  const S = site.seed;
  const pathDist = (x: number, z: number) => Math.min(...site.paths.map((p) => distToPolyline(x, z, p)));
  const free = (x: number, z: number, corridor = 1.35) => site.inArea(x, z) && !site.keepClear(x, z) && pathDist(x, z) > corridor;
  const treeNear = (x: number, z: number, d: number) => trees.some((t) => Math.hypot(t.x - x, t.z - z) < d);
  const nearOf = (list: SourceTree[], x: number, z: number, d: number) => list.some((t) => Math.hypot(t.x - x, t.z - z) < d);

  // ---- trees: species and variant by position hash; heading and tint from the tree's own stream
  const placed: PlacedTree[] = [];
  const species = new Map<SourceTree, TreeSpecies>();
  for (const [list, isBack] of [[trees, false], [backdrop, true]] as const) for (const t of list) {
    const r = stream(S, 'tree', t.x, t.z);
    const yaw0 = r() * Math.PI * 2, sat = (r() - 0.5) * 0.05, lit = (r() - 0.5) * 0.06;
    const hero = site.heroes?.find((h) => Math.hypot(t.x - h.x, t.z - h.z) < 0.3);
    const sp: TreeSpecies = hero ? hero.species : t.kind === 'pine' ? 'pine' : t.kind === 'birch' ? 'birch' : hash01(t.x, t.z, 1) < 0.35 ? 'beech' : 'oak';
    let v = hero ? hero.v : Math.floor(hash01(t.x, t.z, 2) * 3);
    if (!hero && opt.variantOf) v = opt.variantOf(sp, t.x, t.z, v);
    const total = sp === 'pine' ? t.h * 1.35 : t.h + t.r * 1.2;
    const base = { oak: 8.6, beech: 9.6, birch: 9.4, pine: 13.4 }[sp];
    const s = hero ? 1 : THREE.MathUtils.clamp(total / base, sp === 'pine' ? 0.68 : 0.66, sp === 'oak' ? 1.02 : 0.98);
    const sy = s * (0.94 + hash01(t.x, t.z, 3) * 0.12); // a little height variation per tree
    const tint = new THREE.Color(LEAF_TINT[sp]).offsetHSL(t.hue * 0.025, sat, lit);
    placed.push({ x: t.x, z: t.z, y: t.y - 0.05, species: sp, v, yaw: hero ? hero.yaw : yaw0, scale: [s, sy, s], tint, backdrop: isBack });
    if (!isBack) species.set(t, sp);
  }
  const broadleaves = trees.filter((t) => ['oak', 'beech'].includes(species.get(t)!));
  const pines = trees.filter((t) => species.get(t) === 'pine');

  // ---- stumps against trees (see PlacedStump): only the trees' heading and the stumps' drawn shape change
  const outStumps = stumps.map((st) => resolveStump(st, placed.filter((p) => !p.backdrop)));

  // ---- bushes: hazel groups at the edge of broadleaf crowns, the odd holly; one stream per anchor tree
  const bushes: PlacedBush[] = [];
  for (const t of broadleaves) {
    if (hash01(t.x, t.z, 4) > 0.42) continue;
    const r = stream(S, 'bushes', t.x, t.z), a0 = r() * Math.PI * 2, n = 1 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const a = a0 + i * 0.9 + r() * 0.4, d = 2.4 + r() * 1.6, holly = r() < 0.25, sc = 0.8 + r() * 0.4, yaw = r() * 6.3, bv = Math.floor(r() * 3), th = (r() - 0.5) * 0.02, tl = (r() - 0.5) * 0.06;
      const x = t.x + Math.cos(a) * d, z = t.z + Math.sin(a) * d;
      if (!free(x, z, 2.6) || treeNear(x, z, 1.3)) continue;
      const sp: BushSpecies = holly ? 'holly' : 'hazel';
      bushes.push({ x, z, y: site.ground(x, z) - 0.05, species: sp, v: bv, yaw, scale: sc, tint: new THREE.Color(LEAF_TINT[sp]).offsetHSL(th, 0, tl), anchor: id(t.x, t.z) });
    }
  }

  // ---- ground cover: patches (each patch mostly one variant, as plants spread); one stream per patch
  const plants: PlacedPlant[] = [];
  const member = (r: Rng, spread: number) => ({ dx: (r() - 0.5) * spread, dz: (r() - 0.5) * spread, same: r() < 0.75, alt: r(), sc: r(), yaw: r() * 6.3, th: (r() - 0.5) * 0.02, tl: r() - 0.5 });
  const put = (kind: PlantKind, v: number, x: number, z: number, scale: number, yaw: number, th: number, tl: number, k = 0.08) =>
    plants.push({ kind, v: v % PLANT_VARIANTS[kind], x, z, y: site.ground(x, z) - 0.02, yaw, scale, tint: new THREE.Color(1, 1, 1).offsetHSL(th, 0, tl * k) });
  const patch = (kind: PlantKind, r: Rng, cx: number, cz: number, n: number, spread: number, sc: [number, number], corridor: number, avoidTree = 0.5) => {
    const v0 = Math.floor(r() * PLANT_VARIANTS[kind]);
    for (let i = 0; i < n; i++) {
      const m = member(r, spread), x = cx + m.dx, z = cz + m.dz;
      if (!free(x, z, corridor) || treeNear(x, z, avoidTree)) continue;
      put(kind, m.same ? v0 : Math.floor(m.alt * PLANT_VARIANTS[kind]), x, z, sc[0] + m.sc * sc[1], m.yaw, m.th, m.tl);
    }
  };
  const { x0, x1, z0, z1 } = site.bounds;
  // ferns in hollows and at tree feet
  for (const [cx, cz] of scatter(stream(S, 'fern-scatter'), x0, x1, z0 + 1.4, z1 - 2, 6.5, 900, (x, z) => free(x, z, 2.0))) { const r = stream(S, 'fern', cx, cz); patch('fern', r, cx, cz, 2 + Math.floor(r() * 4), 2.2, [0.9, 0.5], 1.5); }
  // bilberry carpets under the pines; lily of the valley under oaks and beeches (one stream per anchor tree)
  for (const t of pines) { const r = stream(S, 'bilberry', t.x, t.z); if (r() < 0.8) { const cx = t.x + (r() - 0.5) * 3, cz = t.z + (r() - 0.5) * 3; patch('bilberry', r, cx, cz, 6 + Math.floor(r() * 7), 3.4, [0.9, 0.6], 1.6); } }
  for (const t of broadleaves) { const r = stream(S, 'lily', t.x, t.z); if (r() < 0.4) { const a = r() * 6.3, d = 1.0 + r() * 1.2; patch('lily', r, t.x + Math.cos(a) * d, t.z + Math.sin(a) * d, 4 + Math.floor(r() * 5), 1.1, [0.9, 0.5], 1.6); } }
  // foxgloves in the lighter openings set back from the path; wood anemones in drifts near the broadleaves
  for (const [cx, cz] of scatter(stream(S, 'foxglove-scatter'), x0 + 3, x1 - 3, z0 + 2.4, 34, 8.5, 400, (x, z) => free(x, z, 2.3) && pathDist(x, z) < 6 && !treeNear(x, z, 2.2))) { const r = stream(S, 'foxglove', cx, cz); patch('foxglove', r, cx, cz, 2 + Math.floor(r() * 4), 1.4, [0.85, 0.35], 2.0, 1.2); }
  for (const [cx, cz] of scatter(stream(S, 'anemone-scatter'), x0 + 4, x1 - 4, z0 + 2.4, 30, 7, 300, (x, z) => free(x, z, 1.8) && nearOf(broadleaves, x, z, 5))) { const r = stream(S, 'anemone', cx, cz); patch('anemone', r, cx, cz, 5 + Math.floor(r() * 5), 1.6, [0.9, 0.4], 1.4); }
  // verge: grass clumps with gaps and the odd stone along every path segment (one stream per segment)
  const stones: PlacedStone[] = [];
  for (const p of site.paths) for (let i = 1; i < p.length; i++) {
    const [ax, az] = p[i - 1], [bx, bz] = p[i];
    const seg = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / seg, nz = (bx - ax) / seg, r = stream(S, 'verge', ax, az, bx, bz);
    for (let t = 0; t < seg; t += 0.4 + r() * 0.55) { // irregular spacing: no rhythm along the edge
      const x0p = ax + ((bx - ax) * t) / seg, z0p = az + ((bz - az) * t) / seg;
      for (const side of [-1, 1]) {
        const off = 1.05 + r() * 0.9, pick = r(), alt = r(), sc = r(), yaw = r() * 6.3, th = (r() - 0.5) * 0.02, tl = r() - 0.5;
        const stone = r() < 0.18, so = [r() * 6.3, 0.14 + r() * 0.1, 0.1 + r() * 0.06, 0.12 + r() * 0.1, 0.92 + r() * 0.12];
        if (!site.inArea(x0p, z0p)) continue;
        if (Math.sin((x0p + z0p) * 0.9 + side * 1.7) + Math.sin((x0p - z0p) * 0.37) < -0.35) continue; // gaps along the verge
        const x = x0p + nx * off * side, z = z0p + nz * off * side;
        if (site.keepClear(x, z) || pathDist(x, z) < 0.95) continue;
        const v = treeNear(x, z, 3) ? (pick < 0.7 ? 0 : 3) : [0, 1, 1, 2][Math.floor(alt * 4)];
        put('grass', v, x, z, 0.75 + sc * 0.55, yaw, th, tl);
        if (stone) { const sx = x + nx * side * 0.2, sz = z + nz * side * 0.2; stones.push({ x: sx, z: sz, y: site.ground(x, z) - 0.06, yaw: so[0], scale: [so[1], so[2], so[3]], k: so[4] }); }
      }
    }
  }
  // loose tufts in the openings, sedge near trees (one stream per tuft)
  for (const [x, z] of scatter(stream(S, 'grass-scatter'), x0, x1, z0 + 1.4, z1 - 2, 2.6, 2500, (x, z) => free(x, z, 2.2) && !treeNear(x, z, 1.4))) {
    const r = stream(S, 'grass', x, z), keep = r() < 0.55, pick = r(), sc = r(), yaw = r() * 6.3, th = (r() - 0.5) * 0.02, tl = r() - 0.5;
    if (keep) put('grass', nearOf(trees, x, z, 3) ? 3 : [0, 0, 1, 2][Math.floor(pick * 4)], x, z, 0.7 + sc * 0.5, yaw, th, tl);
  }
  // leaf litter under the broadleaves and birches, drifting to the path edge (one stream per tree)
  const litter: PlacedLitter[] = [];
  for (const t of trees) {
    if (t.kind === 'pine') continue;
    const r = stream(S, 'litter', t.x, t.z);
    for (let i = 0; i < 22; i++) {
      const a = r() * Math.PI * 2, d = 0.5 + Math.sqrt(r()) * 3.2, yaw = r() * 6.3, sc = 0.8 + r() * 0.7, color = Math.floor(r() * 4);
      const x = t.x + Math.cos(a) * d, z = t.z + Math.sin(a) * d;
      if (!site.inArea(x, z) || site.keepClear(x, z) || pathDist(x, z) < 0.4) continue;
      litter.push({ x, z, y: site.ground(x, z) + 0.012, yaw, scale: sc, color });
    }
  }
  return { trees: placed, bushes, plants, litter, stones, stumps: outStumps };
}

/**
 * Root reach of a placed tree toward a plan point: the trunk-with-buttress radius at that bearing for heading `yaw`
 * (the instance matrix rotates model bearing a to plan-space angle a + yaw in three.js xz, where three z = −plan z).
 */
export function reachToward(t: Pick<PlacedTree, 'x' | 'z' | 'species' | 'v' | 'scale'>, yaw: number, px: number, pz: number) {
  const phi = Math.atan2(-(pz - t.z), px - t.x); // three.js xz angle of the direction
  return trunkFootprint(t.species, t.v)(phi - yaw) * t.scale[0];
}

/** See PlacedStump. Changes only the heading of the tree concerned (never its position) and the stump's drawing. */
function resolveStump(st: SourceStump, trees: PlacedTree[]): PlacedStump {
  const out: PlacedStump = { ...st, treatment: 'plain', vx: st.x, vz: st.z, vr: st.s };
  const steps = Array.from({ length: 72 }, (_, i) => (i / 72) * Math.PI * 2);
  const angDist = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  for (const t of trees) {
    const d = Math.hypot(st.x - t.x, st.z - t.z);
    if (d > 2.8) continue;
    const reachAt = (yaw: number) => reachToward(t, yaw, st.x, st.z);
    if (d < TRUNK_COLLIDER(t.species) + st.s) {
      // the stump stands in the tree's base. Absorbed if a buttress reaches the far edge of its collision circle
      // (so what you bump into there is a visible root)
      const need = d + st.s;
      const ok = steps.filter((y) => reachAt(y) >= need).sort((a, b) => angDist(a, t.yaw) - angDist(b, t.yaw));
      if (ok.length) {
        t.yaw = ok[0]; // the covering heading closest to the original one
        return { ...out, treatment: 'absorbed', vr: 0, tree: id(t.x, t.z) };
      }
      // nurse stump: the smallest circle that holds the collider and the tree's base
      const rb = trunkFootprint(t.species, t.v)(0) * t.scale[0] * 0.9;
      const vr = (d + st.s + rb) / 2, k = (vr - st.s) / Math.max(d, 1e-6);
      return { ...out, treatment: 'nurse', vx: st.x + (t.x - st.x) * k, vz: st.z + (t.z - st.z) * k, vr, tree: id(t.x, t.z) };
    }
    // near but separate: keep a gap between buttresses toward the stump (the original heading if it already is)
    const clear = (yaw: number) => d - st.s * STUMP_VISUAL - reachAt(yaw);
    if (clear(t.yaw) < 0.05) {
      const best = steps.reduce((b, y) => (clear(y) > clear(b) + 1e-6 || (Math.abs(clear(y) - clear(b)) < 1e-6 && angDist(y, t.yaw) < angDist(b, t.yaw)) ? y : b), t.yaw);
      t.yaw = best;
    }
  }
  return out;
}
