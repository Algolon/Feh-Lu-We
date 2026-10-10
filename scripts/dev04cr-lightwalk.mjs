// DEV-04C-R probe / evidence: room-boundary light continuity (cases + rule in scripts/dev04cr-lightcases.js).
// Usage: node scripts/dev04cr-lightwalk.mjs [baseUrl] [out.json]
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
import { LIGHT_CASES, walkLightCases } from './dev04cr-lightcases.js';
const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const b = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 640, height: 360 } });
await p.goto(BASE + '?autotest=1');
await p.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['frontKey'], flags: { leftHome: true }, unlocked: ['lock.door.front'], open: { 'door.front': true } })));
await p.reload(); await p.click('[data-cont]');
await p.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
const out = await p.evaluate(walkLightCases, LIGHT_CASES);
for (const r of out) console.log(`${r.bad === 0 ? 'OK ' : 'POP'}  ${r.name}  (drops while visible: ${r.drops}; in view ≥ 2.5 s: ${r.seenSamples} ticks, under 50 %: ${r.late})\n     ${r.trace}`);
if (process.argv[3]) writeFileSync(process.argv[3], JSON.stringify({ base: BASE, out }, null, 2));
await b.close();
