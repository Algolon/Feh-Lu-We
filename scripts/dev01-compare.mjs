// DEV-01 evidence: (1) the normal game is unchanged — pixel diff + draw calls/triangles against a build of the base
// commit at fixed poses; (2) the cost of the review build (?review=dev01) at the same slice views.
// Usage: node scripts/dev01-compare.mjs <newBaseUrl> <baseCommitUrl> [outDir]   (NOSLICE=1 <base> <base>: noise floor)
//   e.g. node scripts/dev01-compare.mjs http://localhost:4173/Feh-Lu-We/ http://localhost:4174/Feh-Lu-We/ docs/dev01/compare
// Phone quality ("low": DPR 1, no shadows), reduced motion (steady flames), HUD hidden, 2.5 s settle so the light
// pool has converged. SwiftShader: the pixel diff and the counts are meaningful, frame rates are not.
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const [NEW, BASE, OUT = 'scripts/out/dev01-compare'] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const ESS = ['invitation', 'torch', 'matches', 'notebook', 'frontKey'];
const UF = 3.35, GF = 0.15;
// [name, stand (plan), y, look-at (plan x, y, z), open doors]
const POSES = [
  ['forecourt', [90, 66], 0, [90, 4.5, 80]],
  ['hall-wide', [90, 84.5], GF, [90, 1.6, 95]],
  ['hall-console', [87.5, 86.5], GF, [85.3, 0.9, 85.5]],
  ['hall-maquette', [87.5, 93.5], GF, [85.5, 0.9, 95.9]],
  ['living-mantel', [75.4, 86.7], GF, [72.6, 1.35, 86.7]],
  ['library-wide', [82.4, 97.5], GF, [76, 1.6, 103]],
  ['library-table', [82.4, 99.4], GF, [80.6, 0.75, 101.2]],
  ['library-album', [79.0, 105.6], GF, [74.55, 0.7, 106.6]],
  ['U05-sterren', [80.5, 91.9], UF, [79, 4.1, 93.45]],
  ['U04-desk', [80.6, 84.6], UF, [78.6, 4.1, 86.4]],
  ['U04-rack', [83.3, 83.0], UF, [82.2, 4.0, 81.2]],
  ['U10-botanic', [103.2, 85.0], UF, [101.75, 4.1, 84.0]],
  ['sauna-lawn', [134, 95.5], 0, [134, 1, 102]],
];
const OPEN = { 'door.front': true, 'door.library': true, 'door.reis': true, 'door.sterren': true, 'door.botanic': true };

const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
async function capture(url, review, name, [x, z], y, look) {
  const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  const key = review ? 'fehluwe.dev01.save' : 'fehluwe.save';
  await page.goto(url + (review ? '?review=dev01&autotest=1' : '?autotest=1'));
  const save = { version: 4, scene: 'estate', inventory: ESS, flags: { leftHome: true }, unlocked: ['lock.door.front'], open: OPEN, player: { home: null, estate: { x, y, z, yaw: 0, pitch: 0 } }, ...(review ? { slice: { schema: 1 } } : {}) };
  await page.evaluate(([k, s]) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify(s)); localStorage.setItem('fehluwe.settings', JSON.stringify({ quality: 'low', reducedMotion: true })); }, [key, save]);
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 90000 });
  await page.evaluate(helpers);
  if (review) await page.waitForFunction(() => window.__game.world.scene.userData.sliceAtlasReady === true, null, { timeout: 30000 }).catch(() => {});
  await page.evaluate((l) => { const g = window.__game; if (g.ui.modalOpen) g.ui.closeModal(); document.getElementById('hud').style.visibility = 'hidden'; T.lookAt(...l); }, look);
  await page.waitForTimeout(2500);
  const m = await page.evaluate(() => { const g = window.__game; const i = g.renderer.info.render; return { calls: i.calls, tris: i.triangles, pos: g.player.pose() }; });
  const png = await page.screenshot();
  await page.close();
  return { m, png };
}
const diffPage = await browser.newPage();
async function pixelDiff(a, b) {
  return diffPage.evaluate(async ([a, b]) => {
    const load = async (d) => { const im = new Image(); im.src = 'data:image/png;base64,' + d; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); return x.getImageData(0, 0, c.width, c.height).data; };
    const [p, q] = await Promise.all([load(a), load(b)]);
    let diff = 0, max = 0;
    for (let i = 0; i < p.length; i += 4) { const d = Math.max(Math.abs(p[i] - q[i]), Math.abs(p[i + 1] - q[i + 1]), Math.abs(p[i + 2] - q[i + 2])); if (d > 0) diff++; if (d > max) max = d; }
    return { diffPixels: diff, maxDelta: max, total: p.length / 4 };
  }, [a.toString('base64'), b.toString('base64')]);
}
const rows = [];
for (const [name, stand, y, look] of POSES) {
  const base = await capture(BASE, false, name, stand, y, look);
  const now = await capture(NEW, false, name, stand, y, look);
  const slice = process.env.NOSLICE ? now : await capture(NEW, true, name, stand, y, look); // NOSLICE=1: noise-floor run (base vs base)
  const d = await pixelDiff(base.png, now.png);
  writeFileSync(`${OUT}/${name}-base.png`, base.png);
  writeFileSync(`${OUT}/${name}-dev01.png`, slice.png);
  const row = { view: name, normalVsBase: d, base: { calls: base.m.calls, tris: base.m.tris }, normal: { calls: now.m.calls, tris: now.m.tris }, dev01: { calls: slice.m.calls, tris: slice.m.tris }, standing: base.m.pos };
  rows.push(row);
  console.log(`${name.padEnd(15)} normal≡base: ${d.diffPixels === 0 ? 'identical' : d.diffPixels + ' px differ (max Δ ' + d.maxDelta + ')'} · calls base ${base.m.calls} / normal ${now.m.calls} / dev01 ${slice.m.calls} · tris ${base.m.tris} / ${now.m.tris} / ${slice.m.tris}`);
}
writeFileSync(`${OUT}/compare.json`, JSON.stringify(rows, null, 2));
await browser.close();
