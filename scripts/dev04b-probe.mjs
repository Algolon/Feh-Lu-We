// DEV-04B dev probe: build warnings of the estate (construction audit, support contract) and NaN geometry.
// Usage: node scripts/dev04b-probe.mjs [baseUrl]
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
const msgs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') msgs.push(m.type() + ': ' + m.text().slice(0, 600)); });
page.on('pageerror', (e) => msgs.push('pageerror: ' + e.message));
await page.goto((process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/') + '?autotest=1');
await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: [], flags: { leftHome: true }, unlocked: [], open: {} })));
await page.reload();
await page.click('[data-cont]');
await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
const u = await page.evaluate(() => {
  const s = window.__game.world.scene.userData, nan = [];
  window.__game.world.scene.traverse((o) => { if (o.isMesh && Array.from(o.geometry.attributes.position.array).some((v) => !Number.isFinite(v))) nan.push(o.userData.chunk ?? o.parent?.userData?.chunk ?? '?'); });
  return { warn: s.assetWarnings, audits: s.assetAudits?.length, sup: s.supportWarnings, nan };
});
console.log(JSON.stringify(u, null, 1).slice(0, 4000));
console.log(msgs.filter((m) => !m.includes('toNonIndexed')).join('\n').slice(0, 3000));
await browser.close();
