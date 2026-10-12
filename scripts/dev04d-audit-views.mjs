// DEV-04D D0 audit harness (non-functional tooling): eye-height captures of every authored room and every exterior
// destination of the unchanged production build, for the room-by-room audit (docs/dev04d/DEV04D_ROOM_AUDIT.md).
// Usage: node scripts/dev04d-audit-views.mjs [baseUrl] [outDir]   (VIEWS=a,b or ROOMS=1 / EXT=1 to select; DOORS=closed)
//
// Interior views are generated from the live room graph (`world.rooms`): two views per room, each from an inner corner
// (0.9 m in) towards the opposite corner, eye 1.65 m above the support surface. Every door is opened (evidence state).
// Exterior / hero views are hand-placed. Writes <outDir>/views.json with room, calls and triangles per view.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.argv[3] ?? 'docs/dev04d/audit';
mkdirSync(OUT, { recursive: true });
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const exe = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const D = Math.PI / 180;

// yaw: 0 = north (+z), +90° = east (+x). y = feet hint (the support surface under the pose is resolved), `fly` keeps y.
const EXT = [
  ['x01-gate', { x: 90, y: 0, z: 4, yaw: 0, pitch: 0.04 }],
  ['x02-driveway', { x: 90.3, y: 0, z: 40, yaw: 0, pitch: 0.03 }],
  ['x03-arrival-forecourt', { x: 84, y: 0, z: 64, yaw: 25 * D, pitch: 0.06 }],
  ['x04-forecourt-parking', { x: 96, y: 0, z: 70, yaw: -60 * D, pitch: 0.0 }],
  ['x05-garden-terrace', { x: 90, y: 0, z: 124, yaw: 180 * D, pitch: 0.06 }],
  ['x06-outdoor-dining', { x: 98, y: 0, z: 126, yaw: 200 * D, pitch: -0.1 }],
  ['x07-bbq', { x: 107.5, y: 0, z: 122, yaw: 180 * D, pitch: -0.1 }],
  ['x08-music-bong-balloon', { x: 85, y: 0, z: 126, yaw: 200 * D, pitch: -0.12 }],
  ['x09-lanterns-garden', { x: 96, y: 0, z: 134, yaw: -100 * D, pitch: 0.0 }],
  ['x10-lake-approach', { x: 64, y: 0, z: 121.5, yaw: -22 * D, pitch: 0 }],
  ['x11-lake-viewpoint', { x: 79, y: 0, z: 139.5, yaw: -80 * D, pitch: -0.04 }],
  ['x12-sauna-jacuzzi', { x: 137.5, y: 0, z: 96.5, yaw: 20 * D, pitch: -0.04 }],
  ['x13-conservatory-exterior', { x: 136, y: 0, z: 90, yaw: -45 * D, pitch: 0.08 }],
  ['x14-portugal-exterior', { x: 25, y: 4, z: 146.5, yaw: 0, pitch: 0.05 }],
  ['x15-portugal-terrace', { x: 28.5, y: 4.15, z: 154.2, yaw: -120 * D, pitch: -0.08 }],
  ['x16-east-glade', { x: 158, y: 0, z: 124, yaw: 50 * D, pitch: 0 }],
  ['x17-woodland-route-south', { x: 120, y: 0, z: 13.6, yaw: 85 * D, pitch: 0.02 }],
  ['x18-woodland-shed-path', { x: 64, y: 0, z: 56, yaw: -130 * D, pitch: 0 }],
  ['x19-shed-exterior', { x: 47, y: 0, z: 42.5, yaw: -120 * D, pitch: 0.02 }],
  ['x20-shed-interior', { x: 42, y: 0.1, z: 39, yaw: -90 * D, pitch: -0.15 }],
  ['x21-campfire', { x: 26, y: 0, z: 21.5, yaw: -125 * D, pitch: -0.2 }],
  ['x22-well', { x: 139, y: 0, z: 44, yaw: 135 * D, pitch: -0.12 }],
  ['x23-side-gate', { x: 156, y: 0, z: 20, yaw: 80 * D, pitch: 0.02 }],
  ['x24-golf-tee', { x: 63, y: 0, z: 56, yaw: 180 * D, pitch: -0.05 }],
  ['x25-golf-spur', { x: 70, y: 0, z: 60, yaw: -120 * D, pitch: 0 }],
  ['x26-wickerman-side-path', { x: 172, y: 1.2, z: 60.4, yaw: 105 * D, pitch: 0.06 }],
  ['x27-wickerman-clearing', { x: 176.4, y: 1.2, z: 59.9, yaw: 145 * D, pitch: 0.12 }],
  ['x28-wickerman-from-bench', { x: 184.2, y: 1.2, z: 56.2, yaw: -100 * D, pitch: 0.08 }],
  ['x29-wickerman-south-edge', { x: 180.5, y: 1.2, z: 49.6, yaw: -10 * D, pitch: 0.02 }],
  ['x30-wickerman-plan', { x: 180, y: 15, z: 47, yaw: 0, pitch: -1.0, fly: true }],
  ['x31-boslust-exterior', { x: 51.5, y: 0, z: 7.6, yaw: 55 * D, pitch: 0.04 }],
  ['x32-boslust-door', { x: 63, y: 0, z: 11.5, yaw: 0, pitch: 0.05 }],
  ['x33-boslust-gathering', { x: 57, y: -3.2, z: 47, yaw: 40 * D, pitch: -0.05 }],
  ['x34-boslust-entry', { x: 60, y: -3.2, z: 28, yaw: 60 * D, pitch: -0.05 }],
  // hero details inside the manor
  ['h01-game-table', { x: 99.9, y: 0.15, z: 82.9, yaw: 45 * D, pitch: -0.62 }],
  ['h02-game-table-wide', { x: 104.6, y: 0.15, z: 90.6, yaw: -150 * D, pitch: -0.22 }],
  ['h03-hall-painting', { x: 90, y: 0.15, z: 92, yaw: 180 * D, pitch: 0.12 }],
  ['h04-copa-sign', { x: 124, y: 0.15, z: 104, yaw: 40 * D, pitch: 0.12 }],
  ['h05-attic-telescope', { x: 97.5, y: 6.7, z: 95.5, yaw: 90 * D, pitch: 0.0 }],
  ['h06-maquette', { x: 86.75, y: 0.15, z: 94.4, yaw: -90 * D, pitch: -0.42 }],
];

// DEV-04D D1 evidence (SET=d1; D1-R positions since D1-R — D1's own before/after frames are committed): every wall-art slot and both mirrors, from ≈ 3 m (room read) and ≈ 1.5 m (close
// read); the same poses run on the base build (before) and the D1 build (after).
const D1 = [];
for (const [n, x, y, z, yaw, far, near, pitch = 0.06] of [
  ['hall-002', 85.12, 0.15, 86.9, -90, 5.4, 3.2, 0.42], ['hall-007', 85.12, 0.15, 94.4, -90, 2.9, 1.5],
  ['living-026', 77.25, 0.15, 80.45, 180, 2.9, 1.6], ['landing-028', 90, 3.35, 103.92, 0, 2.9, 1.6],
  ['cottage-046', 25.0, 4.15, 164.68, 0, 2.7, 1.4], ['cottageEntry-045', 20.32, 4.15, 158.6, -90, 2.4, 1.3],
  ['kitchen-005', 107.56, 0.15, 99.65, 90, 3.1, 1.6], ['dining-010', 104.8, 0.15, 91.92, 0, 3.3, 1.8],
  ['reis-022', 72.42, 3.35, 84.9, -90, 3.0, 1.6], ['sterren-029', 78.6, 3.35, 86.9, 180, 3.0, 1.5],
  ['guest-035', 107.58, 3.35, 102.6, 90, 3.0, 1.6], ['workshop-044', 115.56, 0.15, 98.55, 90, 3.0, 1.5],
  ['gathering-042', 58.6, -3.2, 56.82, 0, 3.2, 1.7], ['bath-mirror', 89.85, 3.35, 105.0, 90, 2.0, 1.2], ['wc-mirror', 87.9, 0.15, 105.3, 90, 1.9, 1.1],
]) {
  // (x, z) = the art on its wall; yaw = the camera heading towards it; stand `far` / `near` metres out
  const r = (yaw * Math.PI) / 180, at = (d) => ({ x: x - Math.sin(r) * d, y, z: z - Math.cos(r) * d, yaw: r });
  D1.push([`d1-${n}-room`, { ...at(far), pitch }], [`d1-${n}-close`, { ...at(near), pitch: pitch * 1.6 }]);
}

// DEV-04D D1-R (SET=d1r): room-composition views at eye height — each art wall seen whole from across the room, and
// each room from its main approach (the curator's read, not the 1.5 m canvas check)
const D1R = [
  ['hall-west-elevation', 93.0, 0.15, 89.0, -90, 0.28], ['hall-east-hero', 87.6, 0.15, 89.5, 90, 0.22], ['hall-approach', 90, 0.15, 83.0, 0, 0.16],
  ['walkway-along', 86.0, 3.35, 94.8, 180, 0.0], ['walkway-across-void', 91.5, 3.35, 82.6, -55, -0.02], ['landing-across-void', 92.2, 3.35, 97.2, -125, -0.02],
  ['living-south', 78.7, 0.15, 92.6, 180, 0.08], ['living-approach', 84.2, 0.15, 89.0, -125, 0.04],
  ['dining-north', 101.3, 0.15, 81.2, 0, 0.1], ['dining-approach', 95.7, 0.15, 86.8, 55, 0.04],
  ['kitchen-east', 96.4, 0.15, 100.4, 90, 0.08], ['kitchen-approach', 101, 0.15, 92.7, 35, 0.04],
  ['landing-north', 90, 3.35, 96.2, 0, 0.08],
  ['reis-south', 78.6, 3.35, 86.1, 180, 0.08], ['reis-wide', 84.3, 3.35, 86.2, -130, 0.03],
  ['sterren-south', 78.6, 3.35, 93.4, 180, 0.08], ['sterren-wide', 84.3, 3.35, 93.4, -135, 0.03],
  ['guest-east', 99.7, 3.35, 102.6, 90, 0.1], ['workshop-east', 109.0, 0.15, 98.4, 90, 0.08],
  ['cottage-room-south', 25, 4.15, 164.2, 180, 0.08], ['cottage-entry-west', 29.0, 4.15, 158.6, -90, 0.08], ['cottage-door', 25, 4.15, 157.6, 0, 0.04],
  ['gathering-north', 63.5, -3.2, 45.9, 0, 0.1], ['gathering-door', 62.4, -3.2, 45.7, -25, 0.04],
  ['bath-mirror-wide', 86.0, 3.35, 104.6, 80, 0.0], ['wc-mirror-wide', 85.5, 0.15, 104.4, 70, 0.0],
].map(([n, x, y, z, yaw, pitch]) => [`d1r-${n}`, { x, y, z, yaw: (yaw * Math.PI) / 180, pitch }]);

// DEV-04D D2 (SET=d2): every D2 model three ways — close-up, room composition, and the gameplay-distance read from its
// approach — plus the four key pickups in their open drawers / hatch and the maquette. (x, z, h) = the object; yaw =
// the camera heading towards it; [near, room, approach] = stand-off distances; floor = the walking surface.
const D2 = [];
for (const [n, x, z, h, floor, yaw, dists] of [
  ['s3-004-bird', 92.55, 108.84, 4.2, 3.35, 15, [0.75, 2.2, 4.0]],
  ['s3-014-swallows', 90.0, 80.42, 5.35, 3.35, 180, [1.3, 2.4, 3.45]],
  ['s3-015-sloop', 79.25, 80.92, 4.25, 3.35, 200, [0.85, 2.2, 4.6]],
  ['s3-016-moon', 72.66, 91.0, 4.05, 3.35, -100, [0.9, 2.2, 4.4]],
  ['s3-017-medallion', 101.38, 88.5, 4.95, 3.35, -90, [1.1, 2.4, 4.6]],
  ['s3-030-mask', 29.7, 160.95, 5.75, 4.15, 90, [1.1, 2.6, 4.2]],
  ['s3-031-tile', 20.78, 157.0, 5.7, 4.15, 15, [1.1, 2.6, 4.5]],
  ['s3-033-firescreen', 106.15, 118.5, 0.65, 0.15, 20, [1.8, 3.4, 6.2]],
  ['s3-037-heron', 78.75, 141.05, 0.55, 0.04, -40, [1.4, 3.0, 6.5]],
  ['salon-wall', 101.2, 92.4, 5.07, 3.35, 90, [1.7, 3.4, 5.4]],
]) {
  const r = (yaw * Math.PI) / 180;
  ['close', 'room', 'approach'].forEach((k, i) => {
    const d = dists[i], eye = floor + 1.65;
    D2.push([`d2-${n}-${k}`, { x: x - Math.sin(r) * d, y: floor, z: z - Math.cos(r) * d, yaw: r, pitch: Math.atan2(h - eye, d) }]);
  });
}
// keys in their containers (opened for the capture only) and the maquette
const D2KEYS = [
  ['d2-key-shedKey-drawer', { x: 86.15, y: 0.15, z: 85.5, yaw: -Math.PI / 2, pitch: -0.95 }, 'hall.drawer'],
  ['d2-key-studyKey-drawer', { x: 81.75, y: 0.15, z: 101.2, yaw: -Math.PI / 2, pitch: -0.95 }, 'library.desk'],
  ['d2-key-consKey-hatch', { x: 95.85, y: 0.15, z: 98.6, yaw: -Math.PI / 2, pitch: -0.68 }, 'kitchen.hatch'],
  ['d2-maquette-close', { x: 86.55, y: 0.15, z: 94.4, yaw: -Math.PI / 2, pitch: -0.75 }, null],
  ['d2-maquette-room', { x: 88.4, y: 0.15, z: 93.2, yaw: -1.2, pitch: -0.35 }, null],
];
if (process.env.SET === 'd2') D2.push(...D2KEYS.map(([n, p]) => [n, p]));
const OPEN_FOR = Object.fromEntries(D2KEYS.filter((k) => k[2]).map(([n, , id]) => [n, id]));

// DEV-04D D3-0 (SET=d30): the craftsmanship audit's environment views at player eye / approach distance (the phone
// viewport: VW=915 VH=412). Façade and portico, hard ground, library shelving, billiard, dining / kitchen (D3-a),
// cottage walls and terrace; D2 assets come from SET=d2 run at the same viewport.
const D30 = [
  ['e-facade-approach', 90, 0, 62, 0, 0.08], ['e-portico', 90, 0, 74.5, 0, 0.14], ['e-portico-close', 89.2, 0, 77.6, 10, 0.2],
  ['e-facade-oblique', 78, 0, 70, 35, 0.1], ['e-forecourt-ground', 90, 0, 66, -20, -0.25], ['e-terrace-garden', 92, 0, 113, 180, 0.04],
  ['e-library-shelves', 79, 0.15, 100, 0, 0.05], ['e-library-wide', 83.8, 0.15, 95.2, -40, 0.02], ['e-billiard', 89.0, 0.15, 105.1, 40, -0.2],
  ['e-dining', 96.2, 0.15, 81.5, 40, -0.05], ['e-dining-table', 101.3, 0.15, 84.2, 0, -0.3], ['e-kitchen', 96.2, 0.15, 93.5, 35, -0.05], ['e-kitchen-back', 106.5, 0.15, 108.5, -150, -0.05],
  ['e-living', 84, 0.15, 92.8, -130, -0.02], ['e-vestibule-lobby', 90, 0.15, 81.2, 0, 0.0],
  ['e-cottage-room', 25, 4.15, 160.6, 0, 0.0], ['e-cottage-from-door', 25, 4.15, 157.8, 0, 0.0], ['e-terrace-table', 23.5, 4.15, 153.2, 40, -0.05],
  ['e-botanic', 104.4, 3.35, 95.2, 180, -0.05], ['e-study', 98.2, 3.35, 95.2, 180, -0.05], ['e-gallery-landing', 94.2, 3.35, 99.5, -100, 0.0],
].map(([n, x, y, z, yaw, pitch]) => [n, { x, y, z, yaw: (yaw * Math.PI) / 180, pitch }]);

// DEV-04D D2-R (SET=d2r): fixed poses (not object-relative), so production and the D2-R build are captured from the same
// cameras even where a piece moved. Player-eye approach / room / close per changed item, and the Portugal cottage
// sequence (entry approach, through the arch, room composition, terrace approach).
const D2R = [
  ['sw-walk', 90.3, 3.35, 83.5, 180, 0.3], ['sw-void', 86.0, 3.35, 94.0, 164, 0.12], ['sw-close', 90.0, 3.35, 81.9, 180, 0.28],
  ['med-door', 104.0, 3.35, 95.3, -159, 0.03], ['med-room', 105.4, 3.35, 91.2, -112, 0.05], ['med-close', 102.7, 3.35, 88.5, -90, 0.12],
  ['cot-entry-approach', 25.0, 4.15, 154.6, 0, 0.04], ['cot-through-arch', 25.0, 4.15, 158.2, 0, 0.04], ['cot-room-south', 25.0, 4.15, 164.0, 180, 0.0],
  ['cot-room-sideboard', 28.6, 4.15, 163.6, -118, 0.04], ['cot-room-east', 22.0, 4.15, 163.8, 125, 0.04], ['cot-mask-close', 21.7, 4.15, 161.0, -90, 0.12], ['cot-mask-face', 21.15, 4.15, 161.0, -90, 0.0],
  ['cot-045-close', 28.1, 4.15, 160.9, 90, 0.1],
  ['ter-approach', 19.4, 4.1, 152.5, 72, 0.06], ['ter-table', 25.6, 4.15, 153.0, 45, 0.05], ['ter-panel-close', 29.3, 4.15, 155.4, 0, 0.18],
  ['her-path', 82.6, 0.0, 137.0, -58, 0.02], ['her-bench', 78.6, 0.0, 139.6, -90, 0.0], ['her-close', 78.0, 0.0, 140.0, -45, 0.05],
].map(([n, x, y, z, yaw, pitch]) => [`d2r-${n}`, { x, y, z, yaw: (yaw * Math.PI) / 180, pitch }]);

// DEV-04D D3-a (SET=d3a): dining / game room and kitchen at player eye (phone viewport VW=915 VH=412). Fixed poses, so
// production and the D3-a build are captured from the same cameras: arrival, room whole from each end, zone reads, close.
const D3A = [
  ['din-from-hall', 93.4, 0.15, 85.2, 90, 0.0], ['din-entry', 95.8, 0.15, 84.6, 70, -0.02], ['din-north', 101.3, 0.15, 81.1, 0, -0.02],
  ['din-south', 101.3, 0.15, 91.3, 180, -0.02], ['din-west', 106.6, 0.15, 89.6, -120, -0.02], ['din-table', 99.2, 0.15, 83.0, 45, -0.3],
  ['din-sideboard', 104.4, 0.15, 84.4, 70, -0.08], ['din-games-corner', 99.0, 0.15, 87.5, -45, -0.12],
  ['kit-through-arch', 101.0, 0.15, 89.8, 0, -0.02], ['kit-enter', 101.0, 0.15, 93.0, 0, -0.04], ['kit-north-end', 101.0, 0.15, 108.4, 180, -0.04],
  ['kit-west', 106.6, 0.15, 101.5, -90, -0.04], ['kit-east', 96.2, 0.15, 101.0, 90, -0.04], ['kit-range', 101.2, 0.15, 106.6, 30, -0.1],
  ['kit-sw', 96.2, 0.15, 93.5, 35, -0.05], ['kit-island', 99.0, 0.15, 103.0, 40, -0.25], ['kit-dresser', 98.4, 0.15, 104.2, -90, -0.05],
].map(([n, x, y, z, yaw, pitch]) => [`d3a-${n}`, { x, y, z, yaw: (yaw * Math.PI) / 180, pitch }]);

// DEV-04D D3-A2 (SET=d3arch): manor entrance / portico / central front facade at player eye. Fixed poses: the long
// forecourt approach, the medium approach, in front of the steps, angled from the left and right, the portico close,
// the facade whole, and looking out through the front doorway from the hall.
const D3ARCH = [
  ['long-approach', 90, 0, 62, 0, 0.08], ['facade-whole', 90, 0, 56, 0, 0.14], ['medium-approach', 90, 0, 71.5, 0, 0.12],
  ['before-steps', 90, 0, 76.4, 0, 0.2], ['angled-left', 85.2, 0, 74.2, 32, 0.12], ['angled-right', 94.8, 0, 74.2, -32, 0.12],
  ['portico-close', 87.2, 0, 77.4, 25, 0.22], ['door-reveal', 89.4, 0, 78.0, 12, 0.08], ['oblique-far', 78, 0, 68, 38, 0.1],
  ['out-through-door', 90, 0.15, 83.2, 180, 0.0],
].map(([n, x, y, z, yaw, pitch]) => [`d3arch-${n}`, { x, y, z, yaw: (yaw * Math.PI) / 180, pitch }]);

// DEV-04D D3-b1 (SET=d3b1): study, botanic room, front gallery at player eye (phone viewport). Fixed poses: the doorway
// approach, the room whole, each zone, the protected evidence / gameplay walls, and the gallery walk / close / void.
const D3B1 = [
  ['st-door', 98.2, 3.35, 97.4, 180, -0.04], ['st-centre', 98.2, 3.35, 93.6, 180, -0.1], ['st-north', 98.6, 3.35, 83.2, 10, -0.04],
  ['st-centrepiece', 100.2, 3.35, 85.6, -35, -0.32], ['st-desk', 98.2, 3.35, 84.0, 180, -0.32], ['st-corner', 100.7, 3.35, 81.2, -28, -0.05],
  ['bo-door', 104.5, 3.35, 97.4, 180, -0.02], ['bo-room', 104.6, 3.35, 95.2, 180, 0.02], ['bo-work', 103.6, 3.35, 85.0, 180, -0.08],
  ['bo-plants', 105.6, 3.35, 89.0, -38, -0.06], ['bo-medallion', 103.3, 3.35, 86.6, 180, 0.16], ['bo-prints', 104.0, 3.35, 89.6, 90, 0.05],
  ['ga-walk-w', 86.0, 3.35, 82.8, 112, 0.1], ['ga-walk-e', 94.2, 3.35, 82.9, -112, 0.1], ['ga-close', 90.0, 3.35, 82.9, 180, 0.14],
  ['ga-void', 90.0, 3.35, 97.2, 180, 0.06],
].map(([n, x, y, z, yaw, pitch]) => [`d3b1-${n}`, { x, y, z, yaw: (yaw * Math.PI) / 180, pitch }]);

const ctx = await browser.newContext({ viewport: { width: +(process.env.VW ?? 1280), height: +(process.env.VH ?? 720) } });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
await page.goto(BASE + '?autotest=1');
await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey', 'consKey'], flags: { leftHome: true, basementOpen: true, boslustOpen: true } })));
await page.reload();
await page.click('[data-cont]');
await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
await page.evaluate(helpers);
// DEV-04D D1: wait until the FLW atlas image (if the build has one) has replaced its placeholder
await page.waitForFunction(() => { let ok = true; window.__game.world.scene.traverse((o) => { const m = o.material; if (m?.userData?.flwAtlas && !(m.map?.image?.naturalWidth > 4)) ok = false; }); return ok; }, null, { timeout: 60000 });
await page.addStyleTag({ content: '#hud, .hud, #joy, #topbar, #objective, #toast, .toast { opacity: 0 !important; }' }).catch(() => {});
// evidence state: every door open (so a room reads with its neighbours as a player would see them walking through);
// DOORS=closed keeps every door shut (a realistic budget state for the same poses)
const rooms = await page.evaluate((allOpen) => {
  const g = window.__game;
  for (const id of g.world.byId.keys()) if (id.startsWith('door.')) g.state.open[id] = allOpen;
  g.world.syncAll();
  g.settings.quality = 'low'; g.applyQuality(true); // once: the phone default (a per-view switch recompiles every program)
  return g.world.rooms.rooms.map((r) => ({ id: r.id, name: r.name, floor: r.floor, x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, y0: r.y0 }));
}, process.env.DOORS !== 'closed');
// MODE=clay (one grey Lambert, no maps, no vertex colour: form and construction only) or MODE=neutral (vertex colour
// kept, maps removed: material breakup without texture noise); standard otherwise
if (process.env.MODE) await page.evaluate((mode) => {
  const g = window.__game, Mat = g.world.scene.children.find((o) => o.isMesh)?.material?.constructor;
  const cache = new Map();
  g.world.scene.traverse((o) => {
    if (!o.isMesh || !o.material || Array.isArray(o.material) || o.material.isMeshBasicMaterial || o.material.transparent) return;
    const vc = mode === 'neutral' && !!o.material.vertexColors, key = `${vc}|${o.material.side}`;
    if (!cache.has(key)) { const m = o.material.clone(); m.map = null; m.alphaTest = 0; m.opacity = 1; m.vertexColors = vc; if (m.color) m.color.set(mode === 'clay' ? '#bdb6ab' : '#ffffff'); if (m.specular) m.specular.set('#222222'); m.needsUpdate = true; cache.set(key, m); }
    o.material = cache.get(key);
  });
}, process.env.MODE);
const FLOOR_Y = { g: 0.15, u: 3.35, a: 6.7, b: -3.2 };
const views = [];
if (!process.env.EXT && !process.env.SET) for (const r of rooms) {
  if (['tunnel', 'tunnel2', 'descent', 'hut', 'bstair', 'atticStair', 'walkway'].includes(r.id)) continue; // passages: covered by neighbours
  const y = r.floor === 'x' ? r.y0 + 0.4 : FLOOR_Y[r.floor];
  const inset = Math.min(0.9, (r.x1 - r.x0) / 4, (r.z1 - r.z0) / 4);
  const A = [r.x0 + inset, r.z0 + inset], B = [r.x1 - inset, r.z1 - inset];
  const yawTo = (f, t) => Math.atan2(t[0] - f[0], t[1] - f[1]);
  views.push([`r-${r.id}-a`, { x: A[0], y, z: A[1], yaw: yawTo(A, B), pitch: -0.08 }]);
  views.push([`r-${r.id}-b`, { x: B[0], y, z: B[1], yaw: yawTo(B, A), pitch: -0.08 }]);
}
if (process.env.SET === 'd1') views.push(...D1);
else if (process.env.SET === 'd2') views.push(...D2);
else if (process.env.SET === 'd30') views.push(...D30);
else if (process.env.SET === 'd2r') views.push(...D2R, ...D2KEYS.map(([n, p]) => [n, p]));
else if (process.env.SET === 'd1r') views.push(...D1R);
else if (process.env.SET === 'd3a') views.push(...D3A);
else if (process.env.SET === 'd3arch') views.push(...D3ARCH);
else if (process.env.SET === 'd3b1') views.push(...D3B1);
else if (!process.env.ROOMS) views.push(...EXT);
const sel = process.env.VIEWS ? new Set(process.env.VIEWS.split(',')) : null;
const rows = [];
for (const [name, pose] of views) {
  if (sel && !sel.has(name)) continue;
  const m = await page.evaluate(async ({ p, open, chunks }) => {
    const g = window.__game;
    if (open) { g.state.open[open] = true; g.world.syncAll(); for (let i = 0; i < 60; i++) g.tick(1 / 30); }
    const place = () => { g.player.setPose(p); if (!p.fly) g.player.y = g.world.col.supportHeight(p.x, p.z, p.y + 0.05, 0.42); };
    place();
    for (let i = 0; i < 40; i++) g.tick(1 / 30);
    place();
    g.tick(1 / 30);
    await new Promise((r) => setTimeout(r, 200));
    // CHUNKS=a,b: which of these batch chunks this frame actually draws (calls, triangles): the budget reach of a room
    const want = chunks ? new Set(chunks) : null, drawn = {};
    if (want) g.world.scene.traverse((o) => { if (o.isMesh && want.has(o.userData?.chunk)) o.onBeforeRender = () => { const d = (drawn[o.userData.chunk] ??= { calls: 0, triangles: 0 }); d.calls++; d.triangles += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; }; });
    g.renderer.render(g.world.scene, g.camera);
    const i = g.renderer.info.render;
    return { calls: i.calls, triangles: i.triangles, room: g.world.hereRoom, feetY: +g.player.y.toFixed(2), ...(want ? { chunks: drawn } : {}) };
  }, { p: pose, open: OPEN_FOR[name] ?? null, chunks: process.env.CHUNKS ? process.env.CHUNKS.split(',') : null });
  await page.waitForTimeout(120);
  await page.screenshot({ path: `${OUT}/${name}.jpg`, quality: 72, type: 'jpeg' });
  rows.push({ name, pose, ...m });
  console.log(`${name.padEnd(30)} room ${String(m.room).padEnd(13)} y ${m.feetY}  low ${m.calls}/${m.triangles}`);
}
writeFileSync(`${OUT}/views.json`, JSON.stringify({ commit: process.env.COMMIT ?? null, rows, problems }, null, 2));
if (problems.length) console.log('PROBLEMS:\n' + problems.slice(0, 10).join('\n'));
await browser.close();
