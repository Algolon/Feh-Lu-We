// Matched home captures; gameplay checks use real movement/target/action paths.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
const phase = process.argv[2] ?? 'after';
// Start beside the browser: separate exec sessions may have separate network namespaces.
const server = await createServer({ root: process.env.REVIEW_ROOT ?? process.cwd(), server: { host: '127.0.0.1', port: 5173, strictPort: false } });
await server.listen();
const base = server.resolvedUrls.local[0];
const out = `docs/development/workstreams/tut-r02/${phase}`;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? `${homedir()}/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell`, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const results = { phase, captures: [], checks: [], errors: [] };
try {
  const ctx = await browser.newContext({ viewport: { width: 709, height: 1260 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  p.on('pageerror', e => results.errors.push(e.message));
  p.on('response', r => { if (r.status() >= 400) results.errors.push(`${r.status()} ${r.url()}`); });
  await p.goto(base + '?autotest=1');
  await p.click('[data-new]');
  await p.waitForFunction(() => window.__game?.world?.id === 'home');
  await p.evaluate(readFileSync('scripts/e2e-helpers.js', 'utf8'));
  const views = [
    ['table', 3.05, 2.05, 4, 0.85, 3],
    ['window', 3, 2, 3, 1.6, 0],
    ['room', 6.6, 3, 2.8, 1.25, 2.8],
    ['entrance', 5.9, 4.15, 7.52, 1.03, 4.38],
    ['boots', 6.8, 3.65, 7.5, 0.16, 3.9],
    ['calendar', 6.15, 4.7, 6.9, 1.64, 5.98],
    ['lamp', 1.35, 3.3, 0.32, 1.18, 4.0],
    ['drawer', 1.3, 3.2, 0.8, 0.71, 3.2],
  ];
  for (const landscape of [false, true]) {
    await p.setViewportSize(landscape ? { width: 1260, height: 709 } : { width: 709, height: 1260 });
    for (const [name, x, z, tx, ty, tz] of views) {
      await p.evaluate(({ x, z, tx, ty, tz, name }) => {
        const g = T.G(); g.player.setPose({ x, y: 0, z, yaw: 0, pitch: 0 });
        g.state.open['home.drawer'] = name === 'drawer'; g.changed(); T.wait(1);
        T.lookAt(tx, ty, tz);
      }, { x, z, tx, ty, tz, name });
      await p.waitForTimeout(700);
      const file = `${name}-${landscape ? 'landscape' : 'portrait'}.jpg`;
      await p.screenshot({ path: `${out}/${file}`, quality: 85 });
      results.captures.push({ file, ...await p.evaluate(() => { const m = T.G().metrics(); return { calls: m.calls, triangles: m.triangles, textures: m.textures, geometries: m.geometries, pose: m.pos }; }) });
    }
  }
  if (phase !== 'before') {
    await p.evaluate(() => { const g = T.G(); g.state.open['home.drawer'] = false; g.changed(); T.wait(1); g.player.setPose(g.world.spawn); T.tick(2); });
    const check = async (name, fn) => { await p.evaluate(fn); results.checks.push(name); console.log('PASS', name); };
    await check('home art clears windows and doors', async () => {
      const { wallArtConflicts } = await import('/Feh-Lu-We/src/world/openings.ts');
      if (wallArtConflicts().length) throw Error(JSON.stringify(wallArtConflicts()));
    });
    await check('calendar still opens its original memory', () => { T.G().player.setPose({ x: 6.1, y: 0, z: 4.7, yaw: 0, pitch: 0 }); T.act('home.calendar'); if (!T.modalOpen()) throw Error('calendar missing'); T.closeModal(); T.G().player.setPose(T.G().world.spawn); });
    await check('lamp toggles keep the original state contract', () => { T.G().player.setPose({ x: 1.3, y: 0, z: 3.4, yaw: 0, pitch: 0 }); T.act('home.tablelamp'); const s = !!T.G().state.lit['home.tablelamp']; T.act('home.tablelamp'); if (!!T.G().state.lit['home.tablelamp'] === s) throw Error('table lamp did not toggle'); T.G().player.setPose(T.G().world.spawn); });
    await check('pick up four table essentials', () => {
      T.walk([[3.2, 2.5]]);
      T.act('pk.invitation', 'Uitnodiging'); if (!T.modalOpen()) throw Error('invitation not shown'); T.closeModal();
      T.act('pk.torch', 'Zaklamp'); T.act('pk.matches', 'Lucifers'); T.act('pk.notebook', 'Notitieboek');
    });
    await check('matches light candle and candle extinguishes', () => {
      T.select('matches'); T.act('home.candle', 'Aansteken'); T.select(null);
      if (!T.G().state.lit['home.candle']) throw Error('not lit');
      T.act('home.candle', 'Uitblazen'); if (T.G().state.lit['home.candle']) throw Error('still lit');
    });
    await check('departure still requires key', () => { T.walk([[6.6, 3]]); T.act('home.door'); if (T.G().state.scene !== 'home') throw Error('left without key'); });
    await check('drawer opens, closes, reopens; key is pickable', () => {
      T.walk([[5.2, 4.9], [2.6, 4.6], [1.3, 3.2]]);
      T.act('home.drawer', 'Openen'); T.wait(1);
      T.act('home.drawer', 'Dichtschuiven'); T.wait(1);
      T.act('home.drawer', 'Openen'); T.wait(1); T.act('pk.frontKey', 'Sleutel');
    });
    await check('leave via original route', () => { T.walk([[2.6, 4.6], [5.2, 4.9], [6.6, 3]]); T.act('home.door', 'Vertrekken'); });
    await p.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 60000 });
  }
  if (results.errors.length) throw Error(JSON.stringify(results.errors));
} catch (e) { results.failure = String(e); process.exitCode = 1; console.error(e); }
finally { writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2)); await browser.close(); await server.close(); }
