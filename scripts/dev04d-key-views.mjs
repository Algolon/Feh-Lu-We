// DEV-04D D2 evidence (non-functional tooling): the four K3 key-family models in their containers — a close-up and
// the player's read from the standing pose the main e2e uses — plus the inventory icons as the bag shows them.
// Usage: node scripts/dev04d-key-views.mjs [baseUrl] [outDir]
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { itemIcon } from '../src/ui/icons.ts'; // plain module: Node strips its types natively

const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.argv[3] ?? 'docs/dev04d/d2/keys';
mkdirSync(OUT, { recursive: true });
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });

// world, pickup, container, stand pose (the main e2e's), close-up offset (metres east of the key, up)
const KEYS = [
  ['home', 'pk.frontKey', 'home.drawer', { x: 1.3, z: 3.2 }],
  ['estate', 'pk.shedKey', 'hall.drawer', { x: 86.5, z: 85.5 }],
  ['estate', 'pk.studyKey', 'library.desk', { x: 81.9, z: 101.2 }],
  ['estate', 'pk.consKey', 'kitchen.hatch', { x: 96.6, z: 98.6 }],
];
async function open(scene) {
  const page = await ctx.newPage();
  await page.goto(BASE + '?autotest=1');
  await page.evaluate((s) => localStorage.setItem('fehluwe.save', JSON.stringify(s)), scene === 'home'
    ? { version: 4, scene: 'home', inventory: ['invitation', 'torch'], flags: {} }
    : { version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey'], flags: { leftHome: true, basementOpen: true } });
  await page.reload(); await page.click('[data-cont]');
  await page.waitForFunction((s) => window.__game?.world?.id === s, scene, { timeout: 180000 });
  await page.evaluate(helpers);
  await page.addStyleTag({ content: '#hud, .hud, #joy, #topbar, #objective, #toast, .toast { opacity: 0 !important; }' }).catch(() => {});
  return page;
}
const pages = { home: await open('home'), estate: await open('estate') };
for (const [scene, pk, box, stand] of KEYS) {
  const page = pages[scene];
  for (const view of ['close', 'stand']) {
    await page.evaluate(({ pk, box, stand, view, scene }) => {
      const g = window.__game;
      g.state.open[box] = true; g.world.syncAll(); for (let i = 0; i < 60; i++) g.tick(1 / 30);
      const c = window.T.hitCenter(pk); // 0.06–0.1 m above the key
      if (view === 'stand') { g.player.setPose({ x: stand.x, y: scene === 'home' ? 0 : 0.15, z: stand.z, yaw: -Math.PI / 2, pitch: 0 }); for (let i = 0; i < 10; i++) g.tick(1 / 30); window.T.lookAtId(pk); }
      else if (pk === 'pk.studyKey') { // a fly pose this low would sit under the library floor (the room below wins): lean in from the floor
        g.player.setPose({ x: c.x + 0.42, y: 0.15, z: c.z, yaw: -Math.PI / 2, pitch: 0 }); for (let i = 0; i < 10; i++) g.tick(1 / 30); window.T.lookAtId(pk);
      } else { // fly: eye 0.3 m east of and 0.32 m above the key, looking down at it
        const ky = c.y - 0.08, eye = ky + 0.32;
        g.player.setPose({ x: c.x + 0.3, y: eye - 1.65, z: c.z, yaw: -Math.PI / 2, pitch: -Math.atan2(0.32, 0.3), fly: true });
        g.player.y = eye - 1.65;
      }
      for (let i = 0; i < 3; i++) g.tick(1 / 30);
      if (view === 'close' && pk !== 'pk.studyKey') { const ky = c.y - 0.08; g.player.y = ky + 0.32 - 1.65; g.tick(1 / 30); }
      g.renderer.render(g.world.scene, g.camera);
    }, { pk, box, stand, view, scene });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${OUT}/${pk.replace('pk.', '')}-${view}.jpg`, quality: 80, type: 'jpeg' });
    console.log(`${pk} ${view}`);
  }
}
// inventory icons (the bag's 40 px chip and a 128 px read), K3 order
const icons = ['frontKey', 'studyKey', 'shedKey', 'consKey'];
const html = `<body style="margin:0;background:#2b2118;display:flex;gap:28px;padding:24px;font:14px Georgia;color:#f5ead2">${icons.map((id) => `<div style="text-align:center">${itemIcon(id, 128)}<br>${itemIcon(id, 40)}<br>${id}</div>`).join('')}</body>`;
writeFileSync(`${OUT}/icons.html`, html);
const ip = await ctx.newPage();
await ip.setViewportSize({ width: 760, height: 260 });
await ip.setContent(html);
await ip.screenshot({ path: `${OUT}/inventory-icons.png` });
await browser.close();
