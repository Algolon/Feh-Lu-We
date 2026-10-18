// DEV-04D D2: FLW 3D pieces and the key family. Pure data checks (no renderer): what may ship, the key specs
// against the K3 sheets, the inventory icons, and placement rules. World checks (built, audited, seated / flush,
// budgets, reachability) run in the browser suite (scripts/e2e-dev04d.mjs).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PROPS3D, OWNER_GROUP_A_S3, KEY_REF, KEY_SPECS, KEY_SCALE } from '../src/content/props3d';
import { ITEMS } from '../src/content/items';
import { itemIcon } from '../src/ui/icons';

const MANIFEST = JSON.parse(readFileSync('docs/reference/flw/MANIFEST.json', 'utf8')) as { assets: { id: string; status: string }[] };
const status = Object.fromEntries(MANIFEST.assets.map((a) => [a.id, a.status]));

describe('DEV-04D D2 ship rule', () => {
  it('every S3 piece is APPROVED_3D_REF, or REVIEW_READY and owner-approved in group A', () => {
    for (const p of PROPS3D) {
      if (status[p.id] === 'APPROVED_3D_REF') expect(p.basis, p.id).toBe('APPROVED_3D_REF');
      else {
        expect(status[p.id], p.id).toBe('REVIEW_READY');
        expect(OWNER_GROUP_A_S3 as readonly string[], p.id).toContain(p.id);
        expect(p.basis, p.id).toBe('OWNER_GROUP_A');
      }
    }
  });
  it('implements exactly the D2-a / D2-b scope: S3-004 plus the eight group-A pieces, each once', () => {
    expect(PROPS3D.map((p) => p.id).sort()).toEqual(['FLW-S3-004', ...OWNER_GROUP_A_S3].sort());
  });
  it('no group B / C, REFINE, AMBIGUOUS, RESERVED or PENDING source is referenced by the D2 data or builders', () => {
    const src = readFileSync('src/content/props3d.ts', 'utf8') + readFileSync('src/world/d2props.ts', 'utf8');
    const ids = new Set(src.match(/FLW-[A-Z0-9]+-\d{3}/g));
    for (const id of ids) expect(['APPROVED_3D_REF', 'APPROVED_KEY_REF', 'REVIEW_READY'], `${id}: ${status[id]}`).toContain(status[id]);
    for (const id of ['FLW-RSV-019', 'FLW-RSV-020', 'FLW-RSV-021', 'FLW-RSV-022']) expect(ids.has(id), id).toBe(false);
  });
  it('triangle budgets follow the brief (most ≤ 600; heron, sloop, the D2-R remodels / panel ≤ 1.5 k; the Track 01 builds (D3-b1 / D3-b2) at their owner-approved cost)', () => {
    const big = ['FLW-S3-037', 'FLW-S3-015', 'FLW-S3-030', 'FLW-S3-031'], t01: Record<string, number> = { 'FLW-S3-014': 3200, 'FLW-S3-017': 2600, 'FLW-S3-016': 1400 }; // Track 01: 3,042 / 2,468 / 1,208 tris (the sloop's 1,334 stays in the 1.5 k class)
    for (const p of PROPS3D) expect(p.maxTris, p.id).toBeLessThanOrEqual(t01[p.id] ?? (big.includes(p.id) ? 1500 : 600));
  });
});

describe('PROP-R10 living-room hearth corner composition', () => {
  const basket = { x: 73.43, z: 84.48, radius: 0.28 };
  const tools = { x: 72.75, z: 84.15, radius: 0.215 };
  const hearth = { x: 72.4, z: 86.7, leftEdgeZ: 86.7 - 1.38 };

  it('places exactly one set and one basket in both art variants, without touching interactions', () => {
    const manor = readFileSync('src/world/manor.ts', 'utf8');
    const dress = readFileSync('src/world/dressing.ts', 'utf8');
    const toolCall = 'fireplaceToolSet(c, 72.75, 84.15, GF, 0)';
    const basketCall = 'logBasket(c, 73.43, 84.48, GF, 0.3)';
    expect(manor.split(toolCall)).toHaveLength(2);
    expect(manor.split(basketCall)).toHaveLength(3);
    expect(manor.indexOf(toolCall)).toBeGreaterThan(manor.indexOf("S3_BUILDERS['FLW-S3-033'](c)"));
    expect(manor.indexOf(toolCall)).toBeLessThan(manor.indexOf("c.chunk = 'mHall';", manor.indexOf("S3_BUILDERS['FLW-S3-033'](c)")));
    expect(dress).toContain('export function fireplaceToolSet');
    expect(dress).toContain('export function logBasket');
    const builder = dress.slice(dress.indexOf('export function fireplaceToolSet'), dress.indexOf('function mergeAll'));
    for (const part of ['ShovelBlade', 'BrushBlock', 'PokerHook', 'Tongs', 'Pedestal']) expect(builder).toContain(part);
    expect(builder).not.toMatch(/make(Inspect|Action|Pickup|Lamp)/);
  });

  it('puts the tools behind the basket nearer the wall and farther from the fire, with collision clearance', () => {
    expect(tools.x).toBeLessThan(basket.x); // the wall is west (smaller X)
    expect(tools.z).toBeLessThan(basket.z); // the fire is north (larger Z)
    expect(tools.x - tools.radius).toBeGreaterThan(hearth.x); // wall clearance
    expect(hearth.leftEdgeZ - (basket.z + basket.radius)).toBeGreaterThan(0.2);
    expect(hearth.leftEdgeZ - (tools.z + tools.radius)).toBeGreaterThan(0.2);
    const separation = Math.hypot(tools.x - basket.x, tools.z - basket.z);
    expect(separation - tools.radius - basket.radius).toBeGreaterThan(0.12);
    expect(tools.z - tools.radius).toBeGreaterThan(83.55); // clear of the red curtain near z 83
  });
});

describe('PROP-R10 fire screen orientation', () => {
  it('keeps the single approved interior fire screen and turns it 30 degrees toward the hearth', () => {
    const screen = PROPS3D.find(p => p.id === 'FLW-S3-033')!;
    expect(screen.room).toBe('living');
    expect(screen.mount).toBe('ground');
    expect(screen.yaw).toBeCloseTo((2 * Math.PI) / 3, 8);
    expect(screen.x).toBeCloseTo(73.1);
    expect(screen.z).toBeCloseTo(88.95);
    const halfWidthZ = 0.38 * Math.sin(screen.yaw);
    expect(screen.z + halfWidthZ).toBeLessThan(90.5 - 0.55);
    const innerEdgeX = screen.x - 0.38 * Math.abs(Math.cos(screen.yaw));
    expect(innerEdgeX).toBeGreaterThan(72.4);
    const manor = readFileSync('src/world/manor.ts', 'utf8');
    const grounds = readFileSync('src/world/grounds.ts', 'utf8');
    const call = "S3_BUILDERS['FLW-S3-033'](c)";
    expect(manor.split(call)).toHaveLength(2);
    expect(manor.indexOf(call)).toBeGreaterThan(manor.indexOf("if (ART.set === 'sample')"));
    expect(manor.indexOf(call)).toBeGreaterThan(manor.indexOf("} else {\\n  buildHearth".replace('\\n', '\n')));
    expect(grounds).not.toContain(call);
  });
});

describe('DEV-04D D2 key family', () => {
  it('maps the four gameplay keys to the approved K3 references; item ids unchanged', () => {
    expect(Object.keys(KEY_REF).sort()).toEqual(['consKey', 'frontKey', 'shedKey', 'studyKey']);
    for (const [item, ref] of Object.entries(KEY_REF)) {
      expect(status[ref], ref).toBe('APPROVED_KEY_REF');
      expect(ITEMS[item]?.id, item).toBe(item);
    }
  });
  it('builds every key at ×1.3 of its sheet length and bow width', () => {
    const sheet = { frontKey: [120, 38], studyKey: [80, 28], shedKey: [105, 32], consKey: [95, 32] } as const;
    expect(KEY_SCALE).toBe(1.3);
    for (const [k, [len, bow]] of Object.entries(sheet)) {
      const s = KEY_SPECS[k as keyof typeof KEY_SPECS];
      expect(s.len, k).toBeCloseTo((len / 1000) * 1.3, 5);
      expect(s.bowW, k).toBeCloseTo((bow / 1000) * 1.3, 5);
    }
  });
  it('tells the keys apart by silhouette: four different bows, the conservatory key oval, the shed key iron (not brass)', () => {
    const bows = Object.values(KEY_SPECS).map((s) => s.bow);
    expect(new Set(bows).size).toBe(4);
    expect(KEY_SPECS.consKey.bow).toBe('oval');
    expect(KEY_SPECS.consKey.bowH).toBeGreaterThan(KEY_SPECS.consKey.bowW);
    expect(KEY_SPECS.shedKey.metal).toBe('paint');
    expect(KEY_SPECS.frontKey.bow).toBe('trefoil');
  });
  it('the inventory icons match the models: consKey has an oval bow, the others keep theirs', () => {
    const radii = (svg: string) => [...svg.matchAll(/A([\d.]+) ([\d.]+) 0 1 0/g)].map((m) => [+m[1], +m[2]]);
    const cons = radii(itemIcon('consKey')), study = radii(itemIcon('studyKey'));
    expect(cons.length).toBeGreaterThan(0);
    for (const [rx, ry] of cons) expect(rx / ry).toBeCloseTo(1.5, 2); // elliptical, long along the key
    for (const [rx, ry] of study) expect(rx).toBeCloseTo(ry, 6); // still a round ring
  });
  it('no key text reproduces the misspelt sheet lettering', () => {
    const src = readFileSync('src/content/props3d.ts', 'utf8') + readFileSync('src/world/d2props.ts', 'utf8') + readFileSync('src/content/items.ts', 'utf8');
    expect(src).not.toMatch(/Studerkamer/i);
  });
});

describe('DEV-04D D2 placements', () => {
  it('wall pieces face away from their wall (yaw on a cardinal axis), surface / ground pieces stand on a known height', () => {
    for (const p of PROPS3D) {
      if (p.mount === 'wall') expect(Math.abs(Math.sin(p.yaw)) > 0.99 || Math.abs(Math.cos(p.yaw)) > 0.99, p.id).toBe(true);
      expect(Number.isFinite(p.y), p.id).toBe(true);
    }
  });
  it('the heron frames the lake bench view, never stands in it (outside the bench\'s ±35° view cone west)', () => {
    const h = PROPS3D.find((p) => p.id === 'FLW-S3-037')!, bench = { x: 78.4, z: 139.6 };
    const dx = h.x - bench.x, dz = h.z - bench.z, off = Math.abs(Math.atan2(dz, -dx)); // angle from the bench's facing (−x)
    expect(off).toBeGreaterThan((35 * Math.PI) / 180);
    expect(Math.hypot(dx, dz)).toBeGreaterThan(1.2); // a sculpture beside the seat, not on it
  });
  it('the botanic medallion is on the south work-end pier between the windows (x 102.22–104.28), never on the evidence prints wall (x 107.5)', () => {
    const m = PROPS3D.find((p) => p.id === 'FLW-S3-017')!, r = (0.6 * (m.scale ?? 1)) / 2;
    expect(m.z).toBeCloseTo(80.422, 3);
    expect(m.x - r).toBeGreaterThanOrEqual(102.22);
    expect(m.x + r).toBeLessThanOrEqual(104.28);
  });
});
