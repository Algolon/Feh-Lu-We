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

// DEV-04D D1 evidence (SET=d1): every D1 wall-art slot and both mirrors, from ≈ 3 m (room read) and ≈ 1.5 m (close
// read); the same poses run on the base build (before) and the D1 build (after).
const D1 = [];
for (const [n, x, y, z, yaw, far, near, pitch = 0.06] of [
  ['hall-002', 85.12, 0.15, 86.2, -90, 5.4, 3.2, 0.42], ['hall-007', 85.12, 0.15, 92.5, -90, 2.9, 1.5],
  ['living-026', 77.25, 0.15, 80.45, 180, 2.9, 1.6], ['landing-028', 90, 3.35, 103.92, 0, 2.9, 1.6],
  ['cottage-046', 27.9, 4.15, 160.12, 180, 2.7, 1.4], ['cottageEntry-045', 20.32, 4.15, 158.6, -90, 2.4, 1.3],
  ['kitchen-005', 107.58, 0.15, 99.0, 90, 3.1, 1.6], ['dining-010', 104.8, 0.15, 91.92, 0, 3.3, 1.8],
  ['reis-022', 80.8, 3.35, 80.42, 180, 3.0, 1.6], ['sterren-029', 82.0, 3.35, 86.92, 180, 3.0, 1.5],
  ['guest-035', 107.58, 3.35, 102.6, 90, 3.0, 1.6], ['workshop-044', 115.58, 0.15, 99.7, 90, 3.0, 1.5],
  ['gathering-042', 58.6, -3.2, 56.82, 0, 3.2, 1.7], ['bath-mirror', 89.85, 3.35, 105.0, 90, 2.0, 1.2], ['wc-mirror', 87.9, 0.15, 105.3, 90, 1.9, 1.1],
]) {
  // (x, z) = the art on its wall; yaw = the camera heading towards it; stand `far` / `near` metres out
  const r = (yaw * Math.PI) / 180, at = (d) => ({ x: x - Math.sin(r) * d, y, z: z - Math.cos(r) * d, yaw: r });
  D1.push([`d1-${n}-room`, { ...at(far), pitch }], [`d1-${n}-close`, { ...at(near), pitch: pitch * 1.6 }]);
}

const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
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
else if (!process.env.ROOMS) views.push(...EXT);
const sel = process.env.VIEWS ? new Set(process.env.VIEWS.split(',')) : null;
const rows = [];
for (const [name, pose] of views) {
  if (sel && !sel.has(name)) continue;
  const m = await page.evaluate(async ({ p }) => {
    const g = window.__game;
    const place = () => { g.player.setPose(p); if (!p.fly) g.player.y = g.world.col.supportHeight(p.x, p.z, p.y + 0.05, 0.42); };
    place();
    for (let i = 0; i < 40; i++) g.tick(1 / 30);
    place();
    g.tick(1 / 30);
    await new Promise((r) => setTimeout(r, 200));
    g.renderer.render(g.world.scene, g.camera);
    const i = g.renderer.info.render;
    return { calls: i.calls, triangles: i.triangles, room: g.world.hereRoom, feetY: +g.player.y.toFixed(2) };
  }, { p: pose });
  await page.waitForTimeout(120);
  await page.screenshot({ path: `${OUT}/${name}.jpg`, quality: 72, type: 'jpeg' });
  rows.push({ name, pose, ...m });
  console.log(`${name.padEnd(30)} room ${String(m.room).padEnd(13)} y ${m.feetY}  low ${m.calls}/${m.triangles}`);
}
writeFileSync(`${OUT}/views.json`, JSON.stringify({ commit: process.env.COMMIT ?? null, rows, problems }, null, 2));
if (problems.length) console.log('PROBLEMS:\n' + problems.slice(0, 10).join('\n'));
await browser.close();
