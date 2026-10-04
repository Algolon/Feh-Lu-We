// Dev helper: start the game in headless Chromium, run a JS snippet against window.__game, screenshot.
import { chromium } from 'playwright-core';
const [, , url = 'http://localhost:4173/Feh-Lu-We/?debug=1', out = 'shot.png', snippet = ''] = process.argv;
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (r) => logs.push(`[reqfail] ${r.url()}`));
page.on('response', (r) => { if (r.status() >= 400) logs.push(`[http ${r.status()}] ${r.url()}`); });
await page.goto(url);
await page.waitForTimeout(500);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.click('[data-new]');
await page.waitForTimeout(1500);
if (snippet) {
  const r = await page.evaluate(snippet);
  if (r !== undefined) console.log('result:', JSON.stringify(r));
}
await page.waitForTimeout(1200);
await page.screenshot({ path: out });
console.log(logs.join('\n'));
await browser.close();
