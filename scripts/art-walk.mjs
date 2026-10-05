// Short moving walkthrough of the art sample (real-time frames, ordinary movement code via the autopilot
// steering, which drives the same move vector as the joystick). Records a video with Playwright.
// Usage: node scripts/art-walk.mjs <outDir> "<query>" [baseUrl]
// Software rendering (SwiftShader) runs at a few frames per second; the video is evidence of composition and
// popping/flicker in motion, NOT of device frame rate.
import { chromium } from 'playwright-core';
import { mkdirSync, renameSync } from 'node:fs';

const OUT = process.argv[2] ?? 'scripts/out/walk';
const QUERY = process.argv[3] ?? 'art=sample&light=sample';
const BASE = process.argv[4] ?? 'http://localhost:4173/Feh-Lu-We/';
const NAME = process.env.NAME ?? 'walkthrough';
mkdirSync(OUT, { recursive: true });
const VIEW = { width: 844, height: 390 };
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1, recordVideo: { dir: OUT, size: VIEW } });
const page = await ctx.newPage();
await page.goto(BASE + '?autotest=1&' + QUERY);
await page.evaluate(() => {
  localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey'], flags: { leftHome: true }, unlocked: ['lock.door.front'], open: { 'door.front': true }, player: { home: null, estate: { x: 87.5, y: 0.15, z: 88.5, yaw: -Math.PI / 2, pitch: -0.05 } } }));
  localStorage.setItem('fehluwe.settings', JSON.stringify({ quality: 'low' }));
});
await page.reload();
await page.click('[data-cont]');
await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 60000 });
await page.evaluate(() => { for (const id of ['toast', 'stick']) { const el = document.getElementById(id); if (el) el.style.display = 'none'; } });
await page.waitForTimeout(1200);
// route: hall arch → behind the sofa → round the left armchair → in front of the hearth (look at the mantel) → back
const route = [[83.0, 88.9], [80.4, 90.6], [77.6, 91.6], [75.4, 89.4], [75.0, 87.4, 'mantel'], [76.2, 84.6], [79.2, 83.2, 'room']];
await page.evaluate((route) => new Promise((done) => {
  const g = window.__game;
  let i = 0, hold = 0;
  const look = { mantel: [72.6, 1.45, 86.7], room: [80.0, 0.8, 88.0] };
  const step = () => {
    const p = g.player;
    const [x, z, tag] = route[i];
    const tgt = tag ? look[tag] : [x, 1.4, z];
    const want = Math.atan2(tgt[0] - p.x, tgt[2] - p.z);
    let d = want - p.yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    p.yaw += d * 0.12;
    const wantPitch = Math.atan2(tgt[1] - (p.y + 1.65), Math.hypot(tgt[0] - p.x, tgt[2] - p.z));
    p.pitch += (wantPitch - p.pitch) * 0.1;
    if (Math.hypot(p.x - x, p.z - z) < 0.35) {
      g.autopilot = null;
      if (tag && hold++ < 40) { requestAnimationFrame(step); return; } // pause to look
      hold = 0; i++;
      if (i >= route.length) { done(); return; }
    } else g.autopilot = { x, z, run: false };
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}), route);
await page.waitForTimeout(500);
const video = page.video();
await ctx.close();
const path = await video.path();
renameSync(path, `${OUT}/${NAME}.webm`);
console.log('video', `${OUT}/${NAME}.webm`);
await browser.close();
