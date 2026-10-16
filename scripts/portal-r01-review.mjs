// PORTAL-R01: software-WebGL image evidence from the actual candidate build, without deploying it.
// Usage: CHROME=/usr/bin/google-chrome node scripts/portal-r01-review.mjs
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
const OUT = 'docs/development/workstreams/portal-r01/review';
const BASE = process.env.BASE ?? 'http://localhost:4173/Feh-Lu-We/';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME || chromium.executablePath(),
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
});
const results = [];
const scenes = [
  { name: '01-hall-to-kitchen', pose: { x: 90.8, y: 0.15, z: 96.55, yaw: Math.PI / 2, pitch: 0.02 } },
  { name: '02-kitchen-to-hall', pose: { x: 98.0, y: 0.15, z: 96.55, yaw: -Math.PI / 2, pitch: 0.02 } },
  { name: '03-kitchen-rearranged', pose: { x: 101.3, y: 0.15, z: 96.1, yaw: -2.30, pitch: -0.04 } },
  { name: '04-service-chart', pose: { x: 99.0, y: 0.15, z: 101.1, yaw: -Math.PI / 2, pitch: -0.01 } },
];
const problems = [];
async function pageFor(viewport) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('pageerror', (e) => problems.push('pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') problems.push('console ' + m.text()); });
  await page.goto(BASE + '?autotest=1');
  await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({
    version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey'],
    flags: { leftHome: true }, unlocked: ['lock.door.front'], open: { 'door.front': true }
  })));
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 150000 });
  await page.evaluate(readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8'));
  return { context, page };
}
try {
  const { context, page } = await pageFor({ width: 1050, height: 655 });
  for (const s of scenes) {
    const data = await page.evaluate(async (pose) => {
      const g = window.__game;
      g.player.setPose(pose);
      g.player.y = g.world.col.supportHeight(pose.x, pose.z, pose.y + 0.05, 0.42);
      for (let i = 0; i < 60; i++) g.tick(1 / 30);
      g.renderer.render(g.world.scene, g.camera);
      return { room: g.world.hereRoom, x: g.player.x, z: g.player.z, calls: g.renderer.info.render.calls, triangles: g.renderer.info.render.triangles };
    }, s.pose);
    await page.waitForTimeout(850);
    await page.screenshot({ path: `${OUT}/${s.name}.jpg`, type: 'jpeg', quality: 80 });
    results.push({ screenshot: s.name, ...data });
    console.log('SCREENSHOT', s.name, JSON.stringify(data));
  }
  // Collision-aware traverse, both directions, and verify the relocated chart remains a usable interaction.
  const route = await page.evaluate(() => {
    const g = T.G();
    g.player.setPose({ x: 90.7, y: 0.15, z: 96.55, yaw: Math.PI/2, pitch: 0 });
    T.tick(10);
    const legs = [];
    for (const [label, points] of [
      ['hall-to-kitchen', [[92.0,96.55],[94.15,96.55],[96.35,96.55],[98.05,96.7]]],
      ['kitchen-to-hall', [[96.35,96.55],[94.15,96.55],[92.0,96.55]]]
    ]) {
      const end = T.walk(points);
      legs.push({ label, end, room: g.world.hereRoom });
    }
    g.player.setPose({ x: 97.6, y: 0.15, z: 101.1, yaw: -Math.PI/2, pitch: 0 });
    T.tick(20);
    const aim = T.lookAtId('kitchen.chart');
    const target = g.metrics();
    if (target.target !== 'kitchen.chart') throw new Error('Service chart not targetable: ' + JSON.stringify({ aim, target }));
    return { legs, chart: { target: target.target, label: target.label } };
  });
  results.push({ test: 'collision-and-chart', ...route });
  console.log('ROUTE', JSON.stringify(route));
  await context.close();
  const mobile = await pageFor({ width: 390, height: 844 });
  await mobile.page.evaluate(() => {
    const g = window.__game;
    g.player.setPose({ x: 91.5, y: 0.15, z: 96.55, yaw: Math.PI/2, pitch: 0.02 });
    for (let i=0; i<40; i++) g.tick(1/30);
  });
  await mobile.page.waitForTimeout(750);
  await mobile.page.screenshot({ path: `${OUT}/05-mobile-hall-to-kitchen.jpg`, type: 'jpeg', quality: 79 });
  await mobile.context.close();
  writeFileSync(`${OUT}/results.json`, JSON.stringify({ source: 'actual branch build / Chromium software WebGL', results, problems }, null, 2));
  if (problems.length) throw new Error(problems.slice(0, 10).join('\n'));
} finally {
  await browser.close();
}
