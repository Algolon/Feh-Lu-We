// Maps: the estate overview and floor plans per level, generated from the authored layout and rooms.
// Puzzle answers never appear; places the player has not visited show as question marks.
import { ESTATE, SITES, DRIVEWAY, GARDEN_PATH, MANOR, WING, CONS, POOL, COTTAGE, SHED, HILL, TERRACE, HILL_CUT } from '../world/layout';
import { FOREST_PATHS } from '../world/terrain';
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
export type MapLevel = 'estate' | 'g' | 'u' | 'b' | 'ug';
export const MAP_LEVELS: { id: MapLevel; label: string }[] = [
  { id: 'estate', label: 'Landgoed' }, { id: 'g', label: 'Begane grond' }, { id: 'u', label: 'Boven' }, { id: 'b', label: 'Kelder' }, { id: 'ug', label: 'Onder de heuvel' },
];

const UG_ROOMS = new Set(['hut', 'descent', 'entry', 'passage', 'gathering', 'tunnel', 'tunnel2']);
/** Which plan a room is drawn on. */
export function roomLevel(r: RoomDef): MapLevel | null {
  if (UG_ROOMS.has(r.id)) return 'ug';
  if (r.floor === 'b') return 'b';
  if (r.floor === 'u') return 'u';
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
  const S = 2.2, W = ESTATE.w * S, H = ESTATE.d * S;
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
  return `<svg class="diagram map" viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Kaart van het landgoed${v.pose ? ' met jouw positie' : ''}">
  <rect width="${W}" height="${H}" fill="#a9c47a"/>
  <rect y="${Z(ESTATE.forestEdge)}" width="${W}" height="${(ESTATE.forestEdge * S).toFixed(1)}" fill="#6f8c4a"/>
  <circle cx="${X(HILL.x)}" cy="${Z(HILL.z)}" r="${HILL.r * S}" fill="#5f7a3e"/><circle cx="${X(HILL.x)}" cy="${Z(HILL.z)}" r="${HILL.r * S * 0.55}" fill="#56703a"/>
  ${rect(HILL_CUT, '#c8b48a')}
  <text x="${X(8)}" y="${Z(64)}" font-size="12" fill="#fff">bos</text><text x="${X(8)}" y="${Z(140)}" font-size="12">tuin</text>
  ${line(smooth(DRIVEWAY, 2), 7, '#e2d2b0')}${FOREST_PATHS.map((p) => line(p, 3.5, '#d9c49a')).join('')}${line(smooth(GARDEN_PATH, 2), 3.5, '#efe4cc')}
  ${rect(MANOR, '#efe2c4', 'landhuis')}${rect(WING, '#e6d6b4')}${rect(CONS, '#cfe8e4', 'serre')}${rect(POOL, '#4fb0bc')}${rect(TERRACE, '#e2d6bc')}
  ${rect(COTTAGE, '#fbf6ec')}${rect(SHED, '#8a5a33')}<rect x="${X(SITES.sauna.x - 2)}" y="${Z(SITES.sauna.z + 2)}" width="${4 * S}" height="${4 * S}" fill="#c48a52" stroke="#3a2a1a"/>
  <ellipse cx="${X(SITES.pond.x)}" cy="${Z(SITES.pond.z)}" rx="${3.2 * S}" ry="${2.6 * S}" fill="#2f6f78"/>
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
  const fills: Record<string, string> = { g: '#efe2c4', u: '#f3e8d0', b: '#d8d0bc', ug: '#d9ccb0' };
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
