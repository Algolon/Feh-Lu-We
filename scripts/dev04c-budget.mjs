// DEV-04C render budget probe: draw calls / triangles at low quality (the phone default, no shadow maps) for every
// representative view of the earlier passes, each set in the door state it was recorded in, plus the DEV-04C views.
// Usage: node scripts/dev04c-budget.mjs [baseUrl] [out.json]
//   set A — DEV-04A budget views (front door, Copacabana double door, attic stair door open)
//   set B — DEV-04B full-suite render poses + hero views (front door open)
//   set C — DEV-04C calibration + Wickerman state views (front door open; Wickerman keys set per view)
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUTF = process.argv[3] ?? null;
const D = Math.PI / 180;
export const SET_A = { atticNook: [96.4, 6.65, 94.2, 1.08], atticCommon: [86, 6.65, 97.5, 0], conservatoryInside: [126.3, 0.15, 106, 1.57], conservatoryDoorDeck: [137, 0.15, 106, -1.57], wellnessDeck: [132, 0.15, 114, 2.27], saunaAccess: [137.6, 0.15, 112.4, -2.44], wickermanClearing: [176.4, 1.2, 59.9, 2.53], wickermanPath: [158, 1.0, 47, 1.08], frontForecourt: [90, 0, 66, 0], arrivalCourt: [88, 0, 62, 0.07], portugalTerrace: [25, 4.15, 152.8, 0.35], portugalApproach: [16.6, 4.0, 146.8, 0.44], golfVicinity: [66, 0, 57, -2.62], golfSpur: [56, 0, 47.6, 1.22] };
export const SET_B = {
  'gate (driveway)': [90, 0, 3, 0, 0.02], 'forecourt → manor': [90, 0, 60, 0, 0.05], 'entrance hall': [90, 0.15, 83, 0, 0.1], library: [82.4, 0.15, 97.5, -0.8, 0.05],
  'garden → manor + conservatory': [92, 0, 136, Math.PI * 0.9, 0], 'forest (shed area)': [50, 0, 44, -2.2, 0], 'BOSLUST cut': [63, 0, 9, 0, 0.08], 'conservatory pool': [118, 0.15, 95.5, 0.5, -0.2],
  campfire: [26, 0, 21.5, -125 * D, -0.25], well: [146.6, 0, 41.6, -135 * D, -0.3], 'wickerman figure': [180, 1.2, 59.6, 180 * D, 0.22], 'golf chute': [63, 0, 54.2, 180 * D, 0.02],
  dining: [96.4, 0.15, 83, 60 * D, -0.1], kitchen: [101, 0.15, 96, 0, 0], 'attic observatory': [97, 6.65, 96.8, 120 * D, 0.28], 'Copacabana bar': [127, 0.15, 107, 25 * D, 0.1], 'Portugal cottage': [25, 4.15, 158.6, 0, -0.12],
  livingRoom: [83.4, 0.15, 87.2, -90 * D, -0.06], sterrenBedroom: [83.6, 3.35, 88.4, -60 * D, -0.08], copaRoom: [118, 0.15, 99, 30 * D, -0.05], lakeApproach: [64, 0, 121.5, -22 * D, 0], lakeShore: [80, 0, 136.4, -70 * D, -0.04], woodlandRoute: [120, 0, 13.6, 85 * D, 0.02], boslustCalibration: [51.5, 0, 7.6, 55 * D, 0.04],
};
// `burning`: run the real interaction (a figure set straight into the save loads as the settled aftermath)
const lit = (c, f) => (f ? { burning: true } : { 'wicker.candles': c, 'wicker.figure': false });
export const SET_C = {
  wickerUnlit: [176.4, 1.2, 59.9, 145 * D, 0.12, lit(false, false)], wickerLit: [176.4, 1.2, 59.9, 145 * D, 0.12, lit(true, false)], wickerBurning: [176.4, 1.2, 59.9, 145 * D, 0.12, lit(true, true)],
  wickerBurningClose: [178.2, 1.2, 57.4, 140 * D, 0.35, lit(true, true)], wickerPathBurning: [158, 1.0, 47, 1.08, 0, lit(true, true)], wickerApproachBurning: [172, 1.2, 60.4, 105 * D, 0.06, lit(true, true)],
};
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const start = async (open) => {
  await page.goto(BASE + '?autotest=1');
  await page.evaluate((open) => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['frontKey', 'consKey'], flags: { leftHome: true }, unlocked: ['lock.door.front', 'lock.door.consWest'], open })), open);
  await page.reload(); await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
};
const measure = (P) => page.evaluate(async (P) => {
  const g = window.__game, res = {};
  for (const [k, [x, y, z, yaw, pitch = 0.05, st]] of Object.entries(P)) {
    if (st && !st.burning) { for (const [kk, v] of Object.entries(st)) g.state.lit[kk] = v; g.world.syncAll(); }
    g.player.setPose({ x, y, z, yaw, pitch }); g.player.y = g.world.col.supportHeight(x, z, y + 0.05, 0.42);
    for (let i = 0; i < 20; i++) g.tick(1 / 30);
    if (st?.burning) { if (!g.state.inventory.includes('matches')) g.state.inventory.push('matches'); for (const id of ['wicker.candles', 'wicker.figure']) g.world.byId.get(id)?.useItem('matches'); for (let i = 0; i < 300; i++) g.tick(1 / 30); }
    await new Promise((r) => setTimeout(r, 100));
    g.settings.quality = 'low'; g.applyQuality(true); g.tick(1 / 30); g.renderer.render(g.world.scene, g.camera);
    res[k] = { calls: g.renderer.info.render.calls, triangles: g.renderer.info.render.triangles };
    if (st) { for (const kk of ['wicker.candles', 'wicker.figure']) delete g.state.lit[kk]; g.world.syncAll(); }
  }
  return res;
}, P);
await start({ 'door.front': true, 'door.consEast': true, 'door.atticStair': true });
const A = await measure(SET_A);
await start({ 'door.front': true });
const B = await measure(SET_B);
const C = await measure(SET_C);
const out = { base: BASE, A, B, C };
console.log(JSON.stringify(out, null, 1));
if (OUTF) writeFileSync(OUTF, JSON.stringify(out, null, 2));
await browser.close();
