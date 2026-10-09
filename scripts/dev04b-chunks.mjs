// DEV-04B dev probe: triangles per chunk|material of the whole estate (where geometry went). Usage: node scripts/dev04b-chunks.mjs [baseUrl]
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.goto((process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/') + '?autotest=1');
await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: [], flags: { leftHome: true }, unlocked: [], open: {} })));
await page.reload();
await page.click('[data-cont]');
await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
const u = await page.evaluate(() => {
  const out = {};
  window.__game.world.scene.traverse((o) => { if (!o.isMesh || !o.geometry) return; const g = o.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); const k = (o.userData.chunk ?? '?') + '|' + (o.material?.map ? 'tex' : '') + (o.material?.type ?? ''); out[k] = (out[k] ?? 0) + Math.round(n); });
  return Object.entries(out).sort((a, b) => b[1] - a[1]).slice(0, 40);
});
for (const [k, v] of u) console.log(String(v).padStart(8), k);
await browser.close();
