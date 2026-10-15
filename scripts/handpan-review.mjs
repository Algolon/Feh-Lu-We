// Asset 01 handpan review (non-functional tooling): player-eye captures of the handpan on its stand in the music /
// gravity-bong corner, with camera calls / triangles per view and any page or console errors.
// Usage: node scripts/handpan-review.mjs [baseUrl] [outDir]   (VIEWS=a,b to select; VW / VH viewport, default phone)
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.argv[3] ?? 'docs/props/handpan-01';
mkdirSync(OUT, { recursive: true });
const exe = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const D = Math.PI / 180, HP = { x: 83.4, z: 121.6, top: 0.15 + 0.78 }; // the instrument (plan x, z) and its top height

// (x, z) camera; yaw heading (0 = +z north, +90° = +x east); pitch; y = walking surface (feet), fly keeps y
const toward = (n, d, yaw, eyeDrop = 0, extra = {}) => {
  const r = yaw * D, x = HP.x - Math.sin(r) * d, z = HP.z - Math.cos(r) * d, eye = 0.15 + 1.65 - eyeDrop;
  return [n, { x, y: 0.15, z, yaw: r, pitch: Math.atan2(HP.top - 0.12 - eye, d), ...extra }];
};
/** A free close-up camera (eye at `eye` m above the ground) `d` m from the axis, aimed at height `at`. */
const detail = (n, d, yaw, eye, at) => {
  const r = yaw * D;
  return [n, { x: HP.x - Math.sin(r) * d, y: eye - 1.65, z: HP.z - Math.cos(r) * d, yaw: r, pitch: Math.atan2(at - eye, d), fly: true }];
};
const VIEWS = [
  detail('hp-detail', 0.95, 200, 1.42, 0.86),
  detail('hp-detail-low', 1.25, 150, 0.98, 0.62),
  toward('hp-close', 1.05, 205),
  toward('hp-close-side', 1.15, 140),
  toward('hp-room', 2.6, 215),
  ['hp-overview', { x: 85.6, y: 0, z: 126.4, yaw: 205 * D, pitch: -0.2 }],
  ['hp-approach', { x: 88.2, y: 0, z: 128.2, yaw: 230 * D, pitch: -0.1 }],
  ['hp-from-terrace', { x: 82.0, y: 0.15, z: 116.2, yaw: 15 * D, pitch: -0.18 }],
  ['x08-music-bong-balloon', { x: 85, y: 0, z: 126, yaw: 200 * D, pitch: -0.12 }], // the DEV-04D audit pose
];

const ctx = await browser.newContext({ viewport: { width: +(process.env.VW ?? 915), height: +(process.env.VH ?? 412) } });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(`console.${m.type()}: ${m.text()}`); });
await page.goto(BASE + '?autotest=1');
await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey', 'consKey'], flags: { leftHome: true, basementOpen: true, boslustOpen: true } })));
await page.reload();
await page.click('[data-cont]');
await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
await page.addStyleTag({ content: '#hud, .hud, #joy, #topbar, #objective, #toast, .toast { opacity: 0 !important; }' }).catch(() => {});
const info = await page.evaluate((q) => {
  const g = window.__game;
  g.settings.quality = q; g.applyQuality(true);
  return { quality: q, warnings: g.world.scene.userData.assetWarnings ?? null, tris: g.world.scene.userData.assetTris?.handpan ?? null };
}, process.env.QUALITY ?? 'low');
console.log(`audit warnings ${JSON.stringify(info.warnings)}  handpan triangles ${info.tris}`);
const sel = process.env.VIEWS ? new Set(process.env.VIEWS.split(',')) : null;
const rows = [];
for (const [name, pose] of VIEWS) {
  if (sel && !sel.has(name)) continue;
  const m = await page.evaluate(async (p) => {
    const g = window.__game;
    const place = () => { g.player.setPose(p); if (!p.fly) g.player.y = g.world.col.supportHeight(p.x, p.z, p.y + 0.05, 0.42); };
    place();
    for (let i = 0; i < 40; i++) g.tick(1 / 30);
    place();
    g.tick(1 / 30);
    await new Promise((r) => setTimeout(r, 200));
    g.renderer.render(g.world.scene, g.camera);
    const i = g.renderer.info.render;
    return { calls: i.calls, triangles: i.triangles, feetY: +g.player.y.toFixed(2), at: { x: +g.player.x.toFixed(2), z: +g.player.z.toFixed(2) } };
  }, pose);
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  rows.push({ name, pose, ...m });
  console.log(`${name.padEnd(24)} feet ${m.feetY} at ${m.at.x},${m.at.z}  ${info.quality} ${m.calls} calls / ${m.triangles} tris`);
}
// distinct messages with their counts (an existing warning repeated per mesh is one line, so baselines compare)
const distinct = Object.entries(problems.reduce((o, m) => ((o[m] = (o[m] ?? 0) + 1), o), {})).map(([message, count]) => ({ message, count }));
writeFileSync(`${OUT}/views.json`, JSON.stringify({ commit: process.env.COMMIT ?? null, quality: info.quality, rows, problems: distinct }, null, 2) + '\n');
console.log(distinct.length ? 'CONSOLE / PAGE MESSAGES:\n' + distinct.map((d) => `${d.count}× ${d.message}`).join('\n') : 'no page / console errors');
await browser.close();
