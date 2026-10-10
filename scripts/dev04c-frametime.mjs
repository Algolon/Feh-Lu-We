// DEV-04C probe: relative fragment cost (SwiftShader rasterises on the CPU, so ms per render ≈ fill-rate cost).
// Usage: node scripts/dev04c-frametime.mjs baseUrl → median ms per renderer.render() at low quality for a few views.
import { chromium } from 'playwright-core';
const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const D = Math.PI / 180;
const V = { livingRoom: [83.4, 0.15, 87.2, -90 * D, -0.06], lakeApproach: [64, 0, 121.5, -22 * D, 0], woodlandRoute: [120, 0, 13.6, 85 * D, 0.02], arrival: [90, 0, 60, 0, 0.05] };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
await p.goto(BASE + '?autotest=1');
await p.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['frontKey'], flags: { leftHome: true }, unlocked: ['lock.door.front'], open: { 'door.front': true } })));
await p.reload(); await p.click('[data-cont]');
await p.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
const out = await p.evaluate(async (V) => {
  const g = window.__game, gl = g.renderer.getContext(), res = {};
  g.settings.quality = 'low'; g.applyQuality(true);
  for (const [k, [x, y, z, yaw, pitch]] of Object.entries(V)) {
    g.player.setPose({ x, y, z, yaw, pitch }); g.player.y = g.world.col.supportHeight(x, z, y + 0.05, 0.42);
    for (let i = 0; i < 20; i++) g.tick(1 / 30);
    const px = new Uint8Array(4), ms = [];
    for (let i = 0; i < 25; i++) { const t0 = performance.now(); g.renderer.render(g.world.scene, g.camera); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); ms.push(performance.now() - t0); }
    ms.sort((a, b) => a - b); res[k] = +ms[12].toFixed(1);
  }
  return res;
}, V);
console.log(JSON.stringify(out));
await b.close();
