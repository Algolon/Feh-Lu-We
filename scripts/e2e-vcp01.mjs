// Focused opt-in review, save isolation, geometry, interaction and rebuild checks.
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const BASE = process.env.BASE_URL ?? 'http://localhost:4173/Feh-Lu-We/';
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/usr/bin/chromium',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true });
page.setDefaultTimeout(180000);
const results = [],
  errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(ok ? 'PASS' : 'FAIL', name, JSON.stringify(detail ?? ''));
};
await page.addInitScript(() => {
  const keys = ['fehluwe.save', 'fehluwe.backup', 'fehluwe.settings'];
  for (const k of keys) localStorage.setItem(k, 'VCP sentinel ' + k);
  window.__storageOps = [];
  for (const method of ['getItem', 'setItem', 'removeItem']) {
    const original = Storage.prototype[method];
    Storage.prototype[method] = function (...args) {
      window.__storageOps.push([method, ...args]);
      return original.apply(this, args);
    };
  }
});
try {
  await page.goto(BASE + '?autotest=1&review=library-craft&craft=base');
  await page.click('[data-review-start]');
  await page.waitForFunction(() => window.__game?.running, null, { timeout: 180000 });
  await page.evaluate(readFileSync('scripts/e2e-helpers.js', 'utf8'));
  const snapshots = [];
  for (let i = 0; i < 7; i++) {
    if (i) {
      await page.click('[data-craft]');
      await page.waitForFunction(() => !document.querySelector('#review-bar').classList.contains('busy'), null, {
        timeout: 180000,
      });
    }
    const snap = await page.evaluate(() => {
      const g = __game;
      T.tick(30);
      const u = g.world.scene.userData,
        bad = [];
      g.world.scene.traverse((o) => {
        for (const key of ['position', 'normal', 'uv']) {
          const a = o.geometry?.attributes[key]?.array;
          if (a && Array.from(a).some((v) => !Number.isFinite(v))) bad.push(o.name + key);
        }
      });
      g.renderer.render(g.world.scene, g.camera);
      return {
        variant: new URLSearchParams(location.search).get('craft'),
        pose: g.player.pose(),
        ids: [...g.world.byId.keys()].sort(),
        colliders: JSON.stringify({
          bounds: g.world.col.bounds,
          colliders: g.world.col.colliders,
          floors: g.world.col.floors,
          ramps: g.world.col.ramps,
        }),
        state: JSON.stringify({
          flags: g.state.flags,
          lit: g.state.lit,
          open: g.state.open,
          inventory: g.state.inventory,
        }),
        audit: u.assetWarnings,
        tris: u.assetTris,
        finite: bad.length === 0,
        metrics: g.metrics(),
        settings: g.settings.quality,
        antialias: g.renderer.getContext().getContextAttributes().antialias,
      };
    });
    snapshots.push(snap);
    check(`switch ${i}: finite geometry / connected construction`, snap.finite && snap.audit.length === 0, snap.audit);
    check(`switch ${i}: low quality, no antialias`, snap.settings === 'low' && !snap.antialias);
    if (i) {
      check(
        `switch ${i}: pose, IDs, colliders and state preserved`,
        JSON.stringify(snap.pose) === JSON.stringify(snapshots[0].pose) &&
          JSON.stringify(snap.ids) === JSON.stringify(snapshots[0].ids) &&
          snap.colliders === snapshots[0].colliders &&
          snap.state === snapshots[0].state,
      );
    }
  }
  for (const variant of ['base', 'pilot']) {
    const same = snapshots.filter((s) => s.variant === variant).slice(1);
    const memory = same.map((s) => [s.metrics.geometries, s.metrics.textures]);
    check(
      `${variant}: repeated rebuild memory stabilises`,
      memory.every((m) => JSON.stringify(m) === JSON.stringify(memory[0])),
      memory,
    );
  }
  // Exercise the actual catalogue UI and drawer in the pilot with production answers unchanged.
  await page.click('[data-craft]');
  await page.waitForFunction(() => !document.querySelector('#review-bar').classList.contains('busy'), null, {
    timeout: 180000,
  });
  const interaction = await page.evaluate(() => {
    const g = __game;
    Object.assign(g.player, { x: 82.5, y: 0.15, z: 101.2 });
    T.tick(5);
    T.act('library.catalog', 'Boeken');
    for (const [item, slot] of [
      ['ster', 'rond'],
      ['varen', 'punt'],
      ['koffer', 'vierkant'],
    ]) {
      const a = document.querySelector(`[data-slot="${slot}"]`),
        b = document.querySelector(`[data-piece="${item}"]`);
      // UI selectors come from the game's production puzzle panel; fail rather than edit answer state.
      if (!a || !b)
        return {
          ok: false,
          reason: 'Inspect puzzle selectors',
          html: document.getElementById('overlay').innerHTML.slice(0, 3500),
        };
      b.click();
      a.click();
    }
    T.wait(1.2);
    const solved = g.state.flags.catalogSolved === true;
    T.act('pk.studyKey');
    T.closeModal();
    return { ok: solved && g.state.inventory.includes('studyKey'), drawer: g.state.open['library.desk'] };
  });
  check('pilot catalogue solved through UI', interaction.ok, interaction);
  const storageOps = await page.evaluate(() => window.__storageOps);
  check('normal save/settings never accessed', storageOps.length === 0, storageOps);
  check('no browser/shader errors', errors.length === 0, errors);
  mkdirSync('docs/vcp01', { recursive: true });
  writeFileSync(
    'docs/vcp01/review-checks.json',
    JSON.stringify(
      {
        results,
        snapshots: snapshots.map(({ colliders, ids, ...s }) => ({
          ...s,
          colliderCount: JSON.parse(colliders).colliders.length,
          interactionCount: ids.length,
        })),
        errors,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
if (results.some((r) => !r.ok)) process.exitCode = 1;
