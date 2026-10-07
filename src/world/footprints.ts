// DEV-02 placement contract (LEVEL_PLAN v0.2 §10 "Placement validation"): one list of canonical footprints and
// volume keepouts, derived from layout.ts, that every scatter and staging check reads. Footprints/openings precede
// scatter: vegetation never stands in a building, on a platform, in the water or on a route. Pure (unit-tested).
import {
  MANOR, WING, CONS, TERRACE, SHED, COTTAGE, COTTAGE_TERRACE, COTTAGE_PAD, SAUNA, JACUZZI, WELLNESS, BBQ, OUTDOOR_DINING, MUSIC_BONG,
  BALLOON_NOOK, LAKE_VIEW, GOLF_TEE, GOLF_CHUTE, ARRIVAL, ARRIVAL_SERVICE, PARKING, ROUTES, WICKERMAN, WICKERMAN_LOOP, GOLF_SPUR, SAUNA_RAMP,
  LAKE, lakeQ, HILL_CUT, type Rect,
} from './layout';
import { chaikin, distToPolyline, inRect, rectDist } from './geom2d';

export type FootprintKind = 'building' | 'platform' | 'parking' | 'reserve';
export interface Footprint extends Rect { id: string; kind: FootprintKind }

const F = (id: string, kind: FootprintKind, r: Rect): Footprint => ({ id, kind, x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1 });
export const FOOTPRINTS: Footprint[] = [
  F('MANOR', 'building', MANOR), F('MANOR_PORCH', 'building', { x0: 87.5, x1: 92.5, z0: 78.3, z1: 80 }), F('WING', 'building', WING),
  F('CONS', 'building', CONS), F('SAUNA', 'building', { x0: SAUNA.x0 - 0.2, x1: SAUNA.x1 + 0.2, z0: SAUNA.z0, z1: SAUNA.z1 }), F('JACUZZI', 'building', JACUZZI),
  F('SHED', 'building', SHED), F('COTTAGE', 'building', COTTAGE), F('COTTAGE_TERRACE', 'building', COTTAGE_TERRACE),
  F('BOSLUST_HUT', 'building', { x0: 60.4, x1: 65.6, z0: 18.2, z1: 22.6 }), F('BOSLUST_CUT', 'reserve', HILL_CUT),
  F('TERRACE', 'platform', TERRACE), F('BBQ', 'platform', BBQ), F('OUTDOOR_DINING', 'platform', OUTDOOR_DINING), F('MUSIC_BONG', 'platform', MUSIC_BONG),
  F('BALLOON_NOOK', 'platform', BALLOON_NOOK), F('WELLNESS', 'platform', WELLNESS), F('LAKE_VIEW', 'platform', LAKE_VIEW),
  F('SAUNA_RAMP', 'platform', { x0: SAUNA_RAMP.x0 - 0.15, x1: SAUNA_RAMP.x1 + 0.15, z0: SAUNA_RAMP.zDoor, z1: SAUNA_RAMP.zFoot }),
  F('COTTAGE_PAD', 'platform', COTTAGE_PAD), F('GOLF_TEE', 'reserve', GOLF_TEE), F('GOLF_CHUTE', 'reserve', GOLF_CHUTE),
  F('ARRIVAL', 'parking', ARRIVAL), F('ARRIVAL_SERVICE', 'parking', ARRIVAL_SERVICE),
  ...PARKING.map((p) => F(p.id, 'parking', p)),
];
export const footprint = (id: string) => FOOTPRINTS.find((f) => f.id === id)!;

/** Every walked line outside the forest network: v0.2 routes, the wickerman loop and the golf spur (smoothed). */
export const ROUTE_LINES: { id: string; pts: [number, number][]; width: number }[] = [
  ...ROUTES.map((r) => ({ id: r.id, pts: chaikin(r.pts, 2), width: r.width })),
  { id: 'wickermanLoop', pts: chaikin(WICKERMAN_LOOP, 2), width: 1.5 },
  { id: 'golfSpur', pts: chaikin(GOLF_SPUR, 1), width: 1.2 },
];

export const inBuilding = (x: number, z: number, m = 0) => FOOTPRINTS.some((f) => f.kind === 'building' && inRect(x, z, f, m));
export const inWater = (x: number, z: number, m = 0) => lakeQ(x, z) < (1 + m / Math.min(LAKE.rx, LAKE.rz)) ** 2;
export const onRoute = (x: number, z: number, m = 0) => ROUTE_LINES.some((r) => distToPolyline(x, z, r.pts) < r.width / 2 + m);
export const inWickermanClearing = (x: number, z: number, m = 0) => Math.hypot(x - WICKERMAN.x, z - WICKERMAN.z) < WICKERMAN.r + m;

/**
 * May vegetation stand here? Trees keep their crown and trunk collider clear of buildings and platforms; small plants
 * (flowers, grass, shrubs without collision) only keep clear of the footprint itself. Water, routes and the wickerman
 * clearing are excluded for both.
 */
export function vegetationClear(x: number, z: number, kind: 'tree' | 'small'): boolean {
  const tree = kind === 'tree';
  for (const f of FOOTPRINTS) {
    const m = tree ? (f.kind === 'building' ? 3.2 : 2.2) : f.kind === 'building' ? 0.5 : 0.25;
    if (rectDist(x, z, f) < m) return false;
  }
  if (inWater(x, z, tree ? 2.5 : 0.4)) return false;
  if (onRoute(x, z, tree ? 2.2 : 0.35)) return false;
  if (inWickermanClearing(x, z, tree ? 1.5 : -2.5)) return false;
  return true;
}
