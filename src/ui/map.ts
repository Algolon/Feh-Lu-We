// Maps: the estate overview and floor plans per level, generated from the authored layout and rooms.
// Puzzle answers never appear; places the player has not visited show as question marks.
import {
  ESTATE, SITES, DRIVEWAY, MANOR, WING, CONS, POOL, COTTAGE, COTTAGE_TERRACE, COTTAGE_PAD, SHED, HILL, TERRACE, HILL_CUT, LAKE, SAUNA, JACUZZI, WELLNESS,
  BBQ, OUTDOOR_DINING, MUSIC_BONG, BALLOON_NOOK, PARKING, ARRIVAL, GOLF_TEE, GOLF_CHUTE, WICKERMAN, WOODS, RIDGES, LAKE_VIEW,
} from '../world/layout';
import { FOREST_PATHS } from '../world/terrain';
import { ROUTE_LINES } from '../world/footprints';
import { ROOMS } from '../world/roomdefs';
import type { RoomDef } from '../world/rooms';
import { smooth } from '../world/nature';

export interface MapSite { id: string; x: number; z: number; label: string }
export interface MapView {
  pose?: { x: number; y: number; z: number; yaw: number };
  visited?: (id: string) => boolean;
  sites: MapSite[];
  /** Room names on the floor plans (default true). The DEV-01 review hides them: no room labels anywhere. */
  labels?: boolean;
}
export type MapLevel = 'estate' | 'g' | 'u' | 'a' | 'b' | 'ug';
export const MAP_LEVELS: { id: MapLevel; label: string }[] = [
  { id: 'estate', label: 'Landgoed' }, { id: 'g', label: 'Begane grond' }, { id: 'u', label: 'Boven' }, { id: 'a', label: 'Zolder' }, { id: 'b', label: 'Kelder' }, { id: 'ug', label: 'Onder de heuvel' },
];

const UG_ROOMS = new Set(['hut', 'descent', 'entry', 'passage', 'gathering', 'tunnel', 'tunnel2']);
/** Which plan a room is drawn on. */
export function roomLevel(r: RoomDef): MapLevel | null {
  if (UG_ROOMS.has(r.id)) return 'ug';
  if (r.floor === 'b') return 'b';
  if (r.floor === 'u') return 'u';
  if (r.floor === 'a') return 'a';
  if (r.floor === 'g') return 'g';
  return null;
}
/** The plan the player is on (for the default tab), from the room under their feet. */
export function levelAt(roomId: string): MapLevel {
  const r = ROOMS.find((q) => q.id === roomId);
  return (r && roomLevel(r)) ?? 'estate';
}

const arrow = (x: string, y: string, yaw: number) =>
  `<g transform="translate(${x},${y}) rotate(${((yaw * 180) / Math.PI).toFixed(1)})"><circle r="9" fill="rgba(255,255,255,.6)"/><path d="M0 -10 L6 6 L0 2 L-6 6 Z" fill="#1f5fbf" stroke="#fff" stroke-width="1.5"/></g>`;
const compass = (x: number) => `<g transform="translate(${x},26)" font-size="11" font-weight="bold" text-anchor="middle"><line x1="0" y1="-14" x2="0" y2="14" stroke="#2b2118" stroke-width="2"/><path d="M-5 -8 L0 -16 L5 -8 Z"/><text y="-19">N</text></g>`;

export function estateMapSvg(v: MapView): string {
  const S = 2.0, W = ESTATE.w * S, H = ESTATE.d * S;
  const X = (x: number) => (x * S).toFixed(1), Z = (z: number) => ((ESTATE.d - z) * S).toFixed(1);
  const known = (id: string) => v.visited?.(id) ?? true;
  const line = (pts: readonly (readonly [number, number])[], wdt: number, col: string) => `<polyline points="${pts.map(([x, z]) => `${X(x)},${Z(z)}`).join(' ')}" fill="none" stroke="${col}" stroke-width="${wdt}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const rect = (r: { x0: number; x1: number; z0: number; z1: number }, fill: string, label = '') =>
    `<rect x="${X(r.x0)}" y="${Z(r.z1)}" width="${((r.x1 - r.x0) * S).toFixed(1)}" height="${((r.z1 - r.z0) * S).toFixed(1)}" fill="${fill}" stroke="#3a2a1a" stroke-width="1.2"/>` +
    (label ? `<text x="${X((r.x0 + r.x1) / 2)}" y="${Z((r.z0 + r.z1) / 2)}" font-size="10" text-anchor="middle" dominant-baseline="middle">${label}</text>` : '');
  const site = (s: MapSite) => known(s.id)
    ? `<circle cx="${X(s.x)}" cy="${Z(s.z)}" r="4.5" fill="#c4553d" stroke="#2b2118"/><text x="${X(s.x)}" y="${(+Z(s.z) - 7).toFixed(1)}" font-size="10" text-anchor="middle">${s.label}</text>`
    : `<circle cx="${X(s.x)}" cy="${Z(s.z)}" r="5.5" fill="#efe6d2" stroke="#7a6a5a" stroke-dasharray="2 2"/><text x="${X(s.x)}" y="${(+Z(s.z) + 3.5).toFixed(1)}" font-size="9" text-anchor="middle" fill="#5a4a3a">?</text>`;
  const me = v.pose ? arrow(X(v.pose.x), Z(v.pose.z), v.pose.yaw) : '';
  const ell = (x: number, z: number, rx: number, rz: number, fill: string, extra = '') => `<ellipse cx="${X(x)}" cy="${Z(z)}" rx="${(rx * S).toFixed(1)}" ry="${(rz * S).toFixed(1)}" fill="${fill}" ${extra}/>`;
  const area = (r: { x0: number; x1: number; z0: number; z1: number }, fill: string) => `<rect x="${X(r.x0)}" y="${Z(r.z1)}" width="${((r.x1 - r.x0) * S).toFixed(1)}" height="${((r.z1 - r.z0) * S).toFixed(1)}" fill="${fill}"/>`;
  return `<svg class="diagram map" viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Kaart van het landgoed${v.pose ? ' met jouw positie' : ''}">
  <rect width="${W}" height="${H}" fill="#a9c47a"/>
  <rect y="${Z(ESTATE.forestEdge)}" width="${W}" height="${(ESTATE.forestEdge * S).toFixed(1)}" fill="#6f8c4a"/>
  ${WOODS.map((w) => area(w, w.gap > 8 ? '#93b468' : '#6f8c4a')).join('')}
  ${RIDGES.map((r) => ell(r.x, r.z, r.rx * 0.55, r.rz * 0.55, 'rgba(60,80,40,.18)')).join('')}
  <circle cx="${X(HILL.x)}" cy="${Z(HILL.z)}" r="${HILL.r * S}" fill="#5f7a3e"/><circle cx="${X(HILL.x)}" cy="${Z(HILL.z)}" r="${HILL.r * S * 0.55}" fill="#56703a"/>
  ${rect(HILL_CUT, '#c8b48a')}
  <text x="${X(8)}" y="${Z(64)}" font-size="12" fill="#fff">bos</text><text x="${X(110)}" y="${Z(140)}" font-size="12">tuin</text>
  ${ell(LAKE.x, LAKE.z, LAKE.rx, LAKE.rz, '#2f6f78')}${ell(WICKERMAN.x, WICKERMAN.z, WICKERMAN.r, WICKERMAN.r, '#b8c88a')}
  ${line(smooth(DRIVEWAY, 2), 7, '#e2d2b0')}${FOREST_PATHS.map((p) => line(p, 3.5, '#d9c49a')).join('')}${ROUTE_LINES.map((r) => line(r.pts, 3, '#efe4cc')).join('')}
  ${rect(ARRIVAL, '#e2d2b0')}${PARKING.map((p) => rect(p, p.car ? '#9aa0a8' : '#e2d2b0')).join('')}
  ${rect(MANOR, '#efe2c4', 'landhuis')}${rect(WING, '#e6d6b4')}${rect(CONS, '#cfe8e4', 'serre')}${rect(POOL, '#4fb0bc')}${rect(TERRACE, '#e2d6bc')}
  ${[BBQ, OUTDOOR_DINING, MUSIC_BONG, BALLOON_NOOK, LAKE_VIEW].map((r) => rect(r, '#e2d6bc')).join('')}${rect(WELLNESS, '#c8a070')}${rect(SAUNA, '#c48a52')}${rect(JACUZZI, '#4fb0bc')}
  ${rect(COTTAGE_PAD, '#c8bc94')}${rect(COTTAGE_TERRACE, '#e8b090')}${rect(COTTAGE, '#fbf6ec')}${rect(SHED, '#8a5a33')}${rect(GOLF_TEE, '#b8d08a')}${rect(GOLF_CHUTE, '#c8a878')}
  ${v.sites.map(site).join('')}
  <text x="${X(SITES.gate.x)}" y="${Z(2.5)}" font-size="10" text-anchor="middle">hek</text>
  ${me}${compass(W - 22)}
</svg>`;
}

/** Floor plan of one level: named rooms (from roomdefs), the player's arrow when on this level. */
export function floorPlanSvg(level: MapLevel, v: MapView): string {
  const rooms = ROOMS.filter((r) => roomLevel(r) === level && r.map !== false || (level === 'ug' && UG_ROOMS.has(r.id)));
  if (!rooms.length) return '';
  const x0 = Math.min(...rooms.map((r) => r.x0)) - 2, x1 = Math.max(...rooms.map((r) => r.x1)) + 2;
  const z0 = Math.min(...rooms.map((r) => r.z0)) - 2, z1 = Math.max(...rooms.map((r) => r.z1)) + 2;
  const S = Math.min(420 / (x1 - x0), 520 / (z1 - z0));
  const W = (x1 - x0) * S, H = (z1 - z0) * S;
  const X = (x: number) => ((x - x0) * S).toFixed(1), Z = (z: number) => ((z1 - z) * S).toFixed(1);
  const fills: Record<string, string> = { g: '#efe2c4', u: '#f3e8d0', a: '#e8dcc0', b: '#d8d0bc', ug: '#d9ccb0' };
  const body = rooms.map((r) => {
    const w = (r.x1 - r.x0) * S, h = (r.z1 - r.z0) * S;
    const fs = Math.max(8, Math.min(12, w / Math.max(4, r.name.length * 0.62)));
    const vertical = h > w * 2.2 && w < 40;
    const lbl = vertical
      ? `<text transform="translate(${X((r.x0 + r.x1) / 2)},${Z((r.z0 + r.z1) / 2)}) rotate(-90)" font-size="${Math.max(8, Math.min(12, h / (r.name.length * 0.65))).toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${r.name}</text>`
      : `<text x="${X((r.x0 + r.x1) / 2)}" y="${Z((r.z0 + r.z1) / 2)}" font-size="${fs.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${r.name}</text>`;
    return `<rect x="${X(r.x0)}" y="${Z(r.z1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${r.id === 'cons' ? '#cfe8e4' : fills[level]}" stroke="#3a2a1a" stroke-width="1.5"/>${v.labels === false ? '' : lbl}`;
  }).join('');
  const onLevel = v.pose && ROOMS.some((r) => roomLevel(r) === level && v.pose!.x >= r.x0 && v.pose!.x <= r.x1 && v.pose!.z >= r.z0 && v.pose!.z <= r.z1 && v.pose!.y + 0.8 >= r.y0 && v.pose!.y + 0.8 <= r.y1);
  const me = onLevel ? arrow(X(v.pose!.x), Z(v.pose!.z), v.pose!.yaw) : '';
  const label = MAP_LEVELS.find((l) => l.id === level)!.label;
  return `<svg class="diagram map" viewBox="0 0 ${W.toFixed(0)} ${H.toFixed(0)}" width="${W.toFixed(0)}" role="img" aria-label="Plattegrond: ${label}">
  <rect width="${W.toFixed(0)}" height="${H.toFixed(0)}" fill="#fbf6ea"/>${body}${me}${compass(W - 18)}</svg>`;
}

void POOL;
