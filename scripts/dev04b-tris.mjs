// DEV-04B dev probe: triangles per audited asset (Asm.begin names), largest first.
import { chromium } from 'playwright-core';
const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
await page.goto(BASE + '?autotest=1');
await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: [], flags: { leftHome: true } })));
await page.reload(); await page.click('[data-cont]');
await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
const t = await page.evaluate(() => window.__game.world.scene.userData.assetTris);
for (const [k, v] of Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, +(process.argv[3] ?? 60))) console.log(String(Math.round(v)).padStart(7), k);
await browser.close();
