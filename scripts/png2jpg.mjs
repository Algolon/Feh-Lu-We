// Dev helper: convert screenshot PNGs in a folder to compact 960x540 JPEGs (removes the PNGs).
import { chromium } from 'playwright-core';
import { readdirSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
const dir = process.argv[2];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
for (const f of readdirSync(dir).filter((f) => f.endsWith('.png'))) {
  await p.goto(`file://${resolve(dir, f)}`);
  await p.evaluate(() => { const i = document.querySelector('img'); i.style.width = '960px'; i.style.height = '540px'; document.body.style.margin = '0'; document.body.style.background = '#000'; });
  await p.waitForTimeout(100);
  await p.screenshot({ path: resolve(dir, f.replace('.png', '.jpg')), type: 'jpeg', quality: 72 });
  unlinkSync(resolve(dir, f));
}
await b.close();
