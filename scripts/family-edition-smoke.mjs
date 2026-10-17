// Browser release gate: family URL must be a playable estate without the bong.
// Usage: node scripts/family-edition-smoke.mjs http://127.0.0.1:4188/Feh-Lu-We/
import { chromium } from 'playwright-core';

const base = (process.argv[2] ?? 'http://127.0.0.1:4188/Feh-Lu-We/').replace(/\/?$/, '/');
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
// Emulate a touch device: previously it booted in low quality unless the player changed it.
const page = await browser.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
const errors = [], audioRequests = [];
page.on('pageerror', e => errors.push(e.message));
page.on('request', req => { if (req.url().includes('bong-rippie')) audioRequests.push(req.url()); });

try {
  const res = await page.goto(base + 'game/?autotest=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
  if (!res?.ok() || !page.url().includes('/Feh-Lu-We/game/')) throw Error('Family entry URL is unavailable');
  await page.evaluate(() => {
    // Deliberately conflicting saves: family must load its own estate save, not the full game's home save.
    localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'home' }));
    localStorage.setItem('fehluwe.family.save', JSON.stringify({
      version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook'],
      flags: { leftHome: true }, unlocked: [], open: {},
    }));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.click('[data-cont]', { timeout: 45000 });
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 120000 });
  const checks = await page.evaluate(() => ({
    scene: window.__game.state.scene,
    isCoarsePointer: matchMedia('(pointer: coarse)').matches,
    quality: window.__game.settings.quality,
    bongAction: window.__game.world.byId.has('garden.gravityBong.hit'),
    handpan: window.__game.world.byId.has('play.handpan'),
    rootSave: JSON.parse(localStorage.getItem('fehluwe.save') ?? 'null')?.scene,
    familySave: !!localStorage.getItem('fehluwe.family.save'),
  }));
  if (checks.scene !== 'estate' || !checks.isCoarsePointer || checks.quality !== 'high' || checks.bongAction || !checks.handpan || checks.rootSave !== 'home' || !checks.familySave || audioRequests.length || errors.length) {
    throw Error(JSON.stringify({ checks, audioRequests, errors }));
  }
  console.log('FAMILY_EDITION_SMOKE_PASS ' + JSON.stringify(checks));
} finally {
  await browser.close();
}
