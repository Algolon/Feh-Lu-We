// Lightweight 2.5D collision world in PLAN coordinates (x = east, z = north, y = up).
// The player is a vertical capsule approximated by a circle (radius r) spanning [feet+stepUp, feet+height].
// Obstacles are axis-aligned boxes and vertical cylinders with a Y range, stored in a uniform grid.
// Walkable surfaces are flat floor regions and linear ramps (stairs). Terrain defaults to y = 0.

export interface Box {
  kind: 'box';
  minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number;
  enabled: boolean;
  occludes: boolean; // blocks interaction line-of-sight (walls, doors)
  solid: boolean; // blocks movement (false = interaction occluder only, e.g. a ceiling slab)
  tag?: string;
}
export interface Circle {
  kind: 'circle';
  x: number; z: number; r: number; minY: number; maxY: number;
  enabled: boolean;
  occludes: boolean;
  solid: boolean;
  tag?: string;
}
export type Collider = Box | Circle;

export interface Floor { minX: number; maxX: number; minZ: number; maxZ: number; y: number }
export interface Ramp {
  minX: number; maxX: number; minZ: number; maxZ: number;
  axis: 'x' | 'z';
  a: number; ya: number; // height ya at coordinate a along axis
  b: number; yb: number; // height yb at coordinate b
}

export interface Body { x: number; y: number; z: number }

const CELL = 4;

export class CollisionWorld {
  readonly colliders: Collider[] = [];
  readonly floors: Floor[] = [];
  readonly ramps: Ramp[] = [];
  private grid = new Map<number, Collider[]>();
  private stamp = new Map<Collider, number>();
  private query = 0;
  constructor(public bounds = { minX: 0.6, maxX: 119.4, minZ: 0.6, maxZ: 99.4 }) {}

  private key(ix: number, iz: number) {
    return (ix + 512) * 4096 + (iz + 512);
  }

  addBox(minX: number, maxX: number, minZ: number, maxZ: number, minY: number, maxY: number, opts: Partial<Pick<Box, 'occludes' | 'tag' | 'enabled' | 'solid'>> = {}): Box {
    const b: Box = {
      kind: 'box',
      minX: Math.min(minX, maxX), maxX: Math.max(minX, maxX),
      minZ: Math.min(minZ, maxZ), maxZ: Math.max(minZ, maxZ),
      minY, maxY,
      enabled: opts.enabled ?? true,
      occludes: opts.occludes ?? false,
      solid: opts.solid ?? true,
      tag: opts.tag,
    };
    this.insert(b, b.minX, b.maxX, b.minZ, b.maxZ);
    return b;
  }

  /** Box given by centre/size (plan coords). */
  addBoxC(cx: number, cz: number, sx: number, sz: number, minY: number, maxY: number, opts: Partial<Pick<Box, 'occludes' | 'tag' | 'enabled' | 'solid'>> = {}): Box {
    return this.addBox(cx - sx / 2, cx + sx / 2, cz - sz / 2, cz + sz / 2, minY, maxY, opts);
  }

  addCircle(x: number, z: number, r: number, minY = 0, maxY = 10, opts: Partial<Pick<Circle, 'occludes' | 'tag' | 'enabled'>> = {}): Circle {
    const c: Circle = { kind: 'circle', x, z, r, minY, maxY, enabled: opts.enabled ?? true, occludes: opts.occludes ?? false, solid: true, tag: opts.tag };
    this.insert(c, x - r, x + r, z - r, z + r);
    return c;
  }

  /** Interaction-only occluder: blocks line of sight, never movement (ceilings/floors between storeys). */
  addOccluder(minX: number, maxX: number, minZ: number, maxZ: number, minY: number, maxY: number): Box {
    return this.addBox(minX, maxX, minZ, maxZ, minY, maxY, { occludes: true, solid: false });
  }

  addFloor(minX: number, maxX: number, minZ: number, maxZ: number, y: number) {
    this.floors.push({ minX: Math.min(minX, maxX), maxX: Math.max(minX, maxX), minZ: Math.min(minZ, maxZ), maxZ: Math.max(minZ, maxZ), y });
  }

  addRamp(r: Ramp) {
    this.ramps.push(r);
  }

  private insert(c: Collider, x0: number, x1: number, z0: number, z1: number) {
    this.colliders.push(c);
    for (let ix = Math.floor(x0 / CELL); ix <= Math.floor(x1 / CELL); ix++) {
      for (let iz = Math.floor(z0 / CELL); iz <= Math.floor(z1 / CELL); iz++) {
        const k = this.key(ix, iz);
        let list = this.grid.get(k);
        if (!list) this.grid.set(k, (list = []));
        list.push(c);
      }
    }
  }

  /** Visit each collider overlapping the rectangle once. */
  forEachNear(x0: number, x1: number, z0: number, z1: number, fn: (c: Collider) => void) {
    const q = ++this.query;
    for (let ix = Math.floor(x0 / CELL); ix <= Math.floor(x1 / CELL); ix++) {
      for (let iz = Math.floor(z0 / CELL); iz <= Math.floor(z1 / CELL); iz++) {
        const list = this.grid.get(this.key(ix, iz));
        if (!list) continue;
        for (const c of list) {
          if (this.stamp.get(c) === q) continue;
          this.stamp.set(c, q);
          fn(c);
        }
      }
    }
  }

  /** Highest walkable surface under (x,z) that is reachable from feet height y (not above y + stepUp). */
  supportHeight(x: number, z: number, y: number, stepUp: number): number {
    let best = 0;
    const lim = y + stepUp + 1e-4;
    for (const f of this.floors) {
      if (x >= f.minX && x <= f.maxX && z >= f.minZ && z <= f.maxZ && f.y <= lim && f.y > best) best = f.y;
    }
    for (const r of this.ramps) {
      if (x < r.minX || x > r.maxX || z < r.minZ || z > r.maxZ) continue;
      const u = r.axis === 'x' ? x : z;
      const t = Math.min(1, Math.max(0, (u - r.a) / (r.b - r.a)));
      const h = r.ya + (r.yb - r.ya) * t;
      if (h <= lim && h > best) best = h;
    }
    return best;
  }

  private verticalHit(c: Collider, y: number, height: number, stepUp: number) {
    return c.enabled && c.solid && c.minY < y + height && c.maxY > y + stepUp;
  }

  /** Push a circle body out of all overlapping colliders. Returns true if anything was hit. */
  resolve(p: Body, r: number, height: number, stepUp: number): boolean {
    let hit = false;
    for (let iter = 0; iter < 4; iter++) {
      let moved = false;
      this.forEachNear(p.x - r, p.x + r, p.z - r, p.z + r, (c) => {
        if (!this.verticalHit(c, p.y, height, stepUp)) return;
        if (c.kind === 'box') {
          const cx = Math.min(Math.max(p.x, c.minX), c.maxX);
          const cz = Math.min(Math.max(p.z, c.minZ), c.maxZ);
          const dx = p.x - cx, dz = p.z - cz;
          const d2 = dx * dx + dz * dz;
          if (d2 >= r * r) return;
          if (d2 > 1e-10) {
            const d = Math.sqrt(d2);
            p.x += (dx / d) * (r - d);
            p.z += (dz / d) * (r - d);
          } else {
            // Centre inside the box: exit via the nearest face.
            const l = p.x - c.minX, rr = c.maxX - p.x, b = p.z - c.minZ, t = c.maxZ - p.z;
            const m = Math.min(l, rr, b, t);
            if (m === l) p.x = c.minX - r;
            else if (m === rr) p.x = c.maxX + r;
            else if (m === b) p.z = c.minZ - r;
            else p.z = c.maxZ + r;
          }
          moved = hit = true;
        } else {
          const dx = p.x - c.x, dz = p.z - c.z;
          const rr = r + c.r;
          const d2 = dx * dx + dz * dz;
          if (d2 >= rr * rr) return;
          if (d2 < 1e-12) {
            // exactly concentric: no direction to push along; use a deterministic safe direction (+x)
            p.x = c.x + rr;
          } else {
            const d = Math.sqrt(d2);
            p.x += (dx / d) * (rr - d);
            p.z += (dz / d) * (rr - d);
          }
          moved = hit = true;
        }
      });
      if (!moved) break;
    }
    const B = this.bounds;
    p.x = Math.min(B.maxX, Math.max(B.minX, p.x));
    p.z = Math.min(B.maxZ, Math.max(B.minZ, p.z));
    return hit;
  }

  /** Move with sub-stepping (no tunnelling through thin walls) and wall sliding. */
  move(p: Body, dx: number, dz: number, r: number, height: number, stepUp: number) {
    const dist = Math.hypot(dx, dz);
    const steps = Math.max(1, Math.ceil(dist / (r * 0.45)));
    for (let i = 0; i < steps; i++) {
      p.x += dx / steps;
      p.z += dz / steps;
      this.resolve(p, r, height, stepUp);
      const s = this.supportHeight(p.x, p.z, p.y, stepUp);
      if (s > p.y) p.y = s; // step up / climb ramp
    }
  }

  /** Does a body at this spot overlap any obstacle? */
  overlaps(x: number, z: number, y: number, r: number, height: number, stepUp: number): boolean {
    let o = false;
    this.forEachNear(x - r, x + r, z - r, z + r, (c) => {
      if (o || !this.verticalHit(c, y, height, stepUp)) return;
      if (c.kind === 'box') {
        const cx = Math.min(Math.max(x, c.minX), c.maxX);
        const cz = Math.min(Math.max(z, c.minZ), c.maxZ);
        if ((x - cx) ** 2 + (z - cz) ** 2 < r * r - 1e-6) o = true;
      } else if ((x - c.x) ** 2 + (z - c.z) ** 2 < (r + c.r) ** 2 - 1e-6) o = true;
    });
    return o;
  }

  /** Circle (player) vs a specific box, ignoring enabled state. Used to stop doors closing onto the player. */
  static circleHitsBox(x: number, z: number, r: number, b: Box) {
    const cx = Math.min(Math.max(x, b.minX), b.maxX);
    const cz = Math.min(Math.max(z, b.minZ), b.maxZ);
    return (x - cx) ** 2 + (z - cz) ** 2 < r * r;
  }

  /** Is the 3D segment a→b blocked by an occluding collider (walls, closed doors)? `ignore` skips the target's own colliders. */
  segmentBlocked(ax: number, ay: number, az: number, bx: number, by: number, bz: number, ignore?: ReadonlySet<Collider>): boolean {
    let blocked = false;
    this.forEachNear(Math.min(ax, bx), Math.max(ax, bx), Math.min(az, bz), Math.max(az, bz), (c) => {
      if (blocked || !c.enabled || !c.occludes || ignore?.has(c)) return;
      if (c.kind === 'box') {
        if (segBox(ax, ay, az, bx, by, bz, c)) blocked = true;
      } else {
        // Treat cylinder as its bounding box: good enough for trunks/columns.
        const bb = { minX: c.x - c.r, maxX: c.x + c.r, minZ: c.z - c.r, maxZ: c.z + c.r, minY: c.minY, maxY: c.maxY };
        if (segBox(ax, ay, az, bx, by, bz, bb)) blocked = true;
      }
    });
    return blocked;
  }
}

function segBox(ax: number, ay: number, az: number, bx: number, by: number, bz: number, c: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number }) {
  let t0 = 0.001, t1 = 0.999;
  const o = [ax, ay, az], d = [bx - ax, by - ay, bz - az];
  const mn = [c.minX, c.minY, c.minZ], mx = [c.maxX, c.maxY, c.maxZ];
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-9) {
      if (o[i] < mn[i] || o[i] > mx[i]) return false;
    } else {
      let ta = (mn[i] - o[i]) / d[i], tb = (mx[i] - o[i]) / d[i];
      if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta);
      t1 = Math.min(t1, tb);
      if (t0 > t1) return false;
    }
  }
  return true;
}
