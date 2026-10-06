// Stabilisation pass: woodland placement must be deterministic per object. Adding a backdrop tree, changing one
// species' variants or reordering the input must not move any unrelated bush, plant, litter leaf or stone. Runs on a
// synthetic site (no BOSLUST coordinates), which also shows the planner does not depend on today's layout.
import { describe, it, expect } from 'vitest';
import { planWoodland, reachToward, TRUNK_COLLIDER, type WoodlandSite, type SourceTree, type WoodlandPlan } from '../src/world/woodlandPlan';

const site: WoodlandSite = {
  seed: 7,
  bounds: { x0: 0, x1: 60, z0: 0, z1: 50 },
  inArea: (x, z) => x > 0 && x < 60 && z > 0 && z < 50,
  keepClear: (x, z) => Math.hypot(x - 30, z - 40) < 3,
  paths: [[[0, 10], [20, 14], [40, 12], [60, 18]], [[30, 13], [30, 45]]],
  ground: (x, z) => 0.05 * Math.sin(x * 0.2) + 0.03 * z * 0.1,
};
const kinds: SourceTree['kind'][] = ['oak', 'oak', 'birch', 'pine', 'oak'];
const trees: SourceTree[] = Array.from({ length: 40 }, (_, i) => ({ x: 3 + ((i * 7.3) % 54), z: 2 + ((i * 11.7) % 45), y: 0, h: 3.5 + (i % 5) * 0.5, r: 2, kind: kinds[i % 5], hue: ((i * 0.37) % 1) - 0.5 }))
  .filter((t) => Math.hypot(t.x - 30, t.z - 40) > 3);
const backdrop: SourceTree[] = [{ x: 10, z: -4, y: 0, h: 4, r: 2, kind: 'oak', hue: 0.1 }];

const f = (n: number) => n.toFixed(4);
const key = (p: WoodlandPlan) => ({
  bushes: p.bushes.map((b) => `${b.species}.${b.v} ${f(b.x)},${f(b.z)} ${f(b.yaw)} ${f(b.scale)} ${b.tint.getHexString()}`),
  plants: p.plants.map((q) => `${q.kind}.${q.v} ${f(q.x)},${f(q.z)} ${f(q.yaw)} ${f(q.scale)} ${q.tint.getHexString()}`),
  litter: p.litter.map((l) => `${f(l.x)},${f(l.z)} ${f(l.yaw)} ${l.color}`),
  stones: p.stones.map((s) => `${f(s.x)},${f(s.z)} ${f(s.scale[0])}`),
});
const treeKey = (p: WoodlandPlan) => p.trees.filter((t) => !t.backdrop).map((t) => `${t.species}.${t.v} ${f(t.x)},${f(t.z)} ${f(t.yaw)} ${t.tint.getHexString()}`);
const sorted = (o: ReturnType<typeof key>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, [...v].sort()]));

describe('deterministic woodland placement', () => {
  const base = planWoodland(site, trees, [], []);
  it('places something of every category (the checks below are not vacuous)', () => {
    const k = key(base);
    expect(k.bushes.length).toBeGreaterThan(3);
    expect(k.plants.length).toBeGreaterThan(50);
    expect(k.litter.length).toBeGreaterThan(50);
    expect(k.stones.length).toBeGreaterThan(0);
    expect(new Set(base.plants.map((p) => p.kind)).size).toBe(6);
  });
  it('adding a backdrop tree moves no bush, plant, litter leaf, stone or zone tree', () => {
    const more = planWoodland(site, trees, backdrop, []);
    expect(key(more)).toEqual(key(base));
    expect(treeKey(more)).toEqual(treeKey(base));
    expect(more.trees.filter((t) => t.backdrop)).toHaveLength(1);
  });
  it('changing one species\' variant selection moves nothing else', () => {
    const alt = planWoodland(site, trees, [], [], { variantOf: (sp, _x, _z, v) => (sp === 'birch' ? (v + 1) % 3 : v) });
    expect(key(alt)).toEqual(key(base));
    const a = alt.trees, b = base.trees;
    expect(a.every((t, i) => t.species === b[i].species && t.yaw === b[i].yaw && (t.species === 'birch' ? t.v === (b[i].v + 1) % 3 : t.v === b[i].v))).toBe(true);
  });
  it('does not depend on input order (identity is position, not index)', () => {
    const shuffled = [...trees].reverse();
    const p = planWoodland(site, shuffled, [], []);
    expect(sorted(key(p))).toEqual(sorted(key(base)));
    expect([...treeKey(p)].sort()).toEqual([...treeKey(base)].sort());
  });
  it('removing one tree changes only what grows under it (other bush groups and plants stay)', () => {
    const gone = trees[4];
    const p = planWoodland(site, trees.filter((t) => t !== gone), [], []);
    const anchor = `${gone.x.toFixed(2)},${gone.z.toFixed(2)}`;
    const others = (q: WoodlandPlan) => q.bushes.filter((b) => b.anchor !== anchor).map((b) => `${f(b.x)},${f(b.z)} ${b.species}`);
    expect(others(p)).toEqual(others(base));
    // ground cover far from the removed tree is untouched (its lily patch, litter and tree-proximity rules are local)
    const far = (q: WoodlandPlan) => key({ ...q, plants: q.plants.filter((x) => Math.hypot(x.x - gone.x, x.z - gone.z) > 6), litter: q.litter.filter((x) => Math.hypot(x.x - gone.x, x.z - gone.z) > 6), stones: q.stones, bushes: [] } as WoodlandPlan);
    expect(far(p).plants).toEqual(far(base).plants);
  });
});

describe('stumps against trees', () => {
  const oak: SourceTree = { x: 20, z: 30, y: 0, h: 4, r: 2.4, kind: 'oak', hue: 0 };
  const birch: SourceTree = { x: 40, z: 30, y: 0, h: 4, r: 2, kind: 'birch', hue: 0 };
  it('a stump inside a broadleaf\'s base is absorbed: a buttress root covers its whole collision circle', () => {
    const st = { x: 20.3, z: 30.05, y: 0, s: 0.29 };
    const p = planWoodland(site, [oak], [], [st]);
    const t = p.trees[0], out = p.stumps[0], d = Math.hypot(st.x - t.x, st.z - t.z);
    expect(d).toBeLessThan(TRUNK_COLLIDER(t.species) + st.s); // the colliders overlap (the case being fixed)
    expect(out.treatment).toBe('absorbed');
    expect(reachToward(t, t.yaw, st.x, st.z)).toBeGreaterThanOrEqual(d + st.s); // the root reaches past the circle
    expect([out.x, out.z, out.s]).toEqual([st.x, st.z, st.s]); // collider data unchanged
  });
  it('a stump wider than a slim birch is a nurse stump: drawn circle holds the collider and the birch base', () => {
    const st = { x: 39.9, z: 30.24, y: 0, s: 0.34 };
    const p = planWoodland(site, [birch], [], [st]);
    const out = p.stumps[0];
    expect(out.treatment).toBe('nurse');
    const toCollider = Math.hypot(out.vx - st.x, out.vz - st.z), toTree = Math.hypot(out.vx - birch.x, out.vz - birch.z);
    expect(toCollider + st.s).toBeLessThanOrEqual(out.vr + 1e-6); // the collision circle lies inside the drawn stump
    expect(toTree).toBeLessThan(out.vr); // the birch rises from inside it
    expect(out.vr).toBeLessThan(st.s * 1.5); // and it is not inflated beyond that
  });
  it('a stump near (not in) a tree keeps a gap between the buttresses toward it', () => {
    const st = { x: 21.35, z: 30.2, y: 0, s: 0.4 };
    const p = planWoodland(site, [oak], [], [st]);
    const t = p.trees[0], d = Math.hypot(st.x - t.x, st.z - t.z);
    expect(p.stumps[0].treatment).toBe('plain');
    expect(d - st.s * 1.3 - reachToward(t, t.yaw, st.x, st.z)).toBeGreaterThanOrEqual(0.05);
  });
});
