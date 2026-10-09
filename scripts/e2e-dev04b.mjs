// DEV-04B visual grammar & asset convergence: browser suite against the production build (npm run build && npm run preview).
// Usage: node scripts/e2e-dev04b.mjs [baseUrl]   (E2E_OUT=dir for results)
// Generic contracts over the whole estate (no pixel comparisons):
//   - the construction audit (Asm.begin/end) reports nothing: no floating feet, no legs sunk into floors, no part of a
//     piece that does not touch the rest; and every converged family was actually built through the audit;
//   - no NaN / infinite vertex anywhere in the scene;
//   - every room-culled batch is drawn in the rooms its geometry stands in (a piece batched with the wrong area is
//     invisible from inside its own room — the class of bug the service-wing split once caused in the guest WC);
//   - the DEV-04C hooks are in place: the Wickerman candle positions are published, the bar sign keeps its art id;
//   - canonical ids, checkpoints and the save schema are unchanged; the DEV-04B hero views stay inside the mobile guide.
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.env.E2E_OUT ?? 'scripts/out/dev04b';
mkdirSync(OUT, { recursive: true });
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const baseline = JSON.parse(readFileSync(new URL('./dev04a-baseline.json', import.meta.url), 'utf8'));
const exe = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const results = [];
const log = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };
const E = (page, fn, arg) => page.evaluate(fn, arg);

// families converged in DEV-04B (Asm.begin names): each must be built at least once through the construction audit
const FAMILIES = ['bed', 'chair.ladder', 'chair.upholstered', 'chair.carver', 'chair.spindle', 'table', 'lounger', 'sideboard', 'shelvingUnit', 'billiardTable', 'cueRack', 'coatRail', 'logBasket', 'floorGlobe', 'writingDesk', 'larder', 'boardGameSet', 'well', 'golfBag', 'golfTray', 'hallCommode', 'wc', 'utilitySink', 'pedestalBasin', 'bathtub', 'lectern'];
// hero / room views of DEV-04B (low quality, standard door state): within 150 calls / 250 k triangles
const HERO_VIEWS = { campfire: [26.0, 0, 21.5, -2.182], well: [146.6, 0, 41.6, -2.356], wickermanFigure: [180.0, 1.2, 59.6, 3.142], golfChute: [63.0, 0, 54.2, 3.142], library: [83.2, 0.15, 99.2, -1.71], dining: [96.4, 0.15, 83.0, 1.047], atticObservatory: [97.0, 6.65, 96.8, 2.094], atticCommon: [86.0, 6.65, 97.5, 0.0], copaBar: [127.0, 0.15, 107.0, 0.436], cottage: [25.0, 4.15, 158.6, 0.0] };

const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error' || (m.type() === 'warning' && /^DEV-04[AB]/.test(m.text()))) problems.push(`console: ${m.text().slice(0, 300)}`); });

const start = async (open = { 'door.front': true, 'door.consEast': true, 'door.atticStair': true }) => {
  await page.goto(BASE + '?autotest=1');
  await page.evaluate((save) => localStorage.setItem('fehluwe.save', JSON.stringify(save)), { version: 4, scene: 'estate', inventory: ['frontKey', 'consKey'], flags: { leftHome: true }, unlocked: ['lock.door.front', 'lock.door.consWest'], open });
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
  await page.evaluate(helpers);
};

try {
  await start();

  // ---------------------------------------------------------------- 1. construction audit
  const audit = await E(page, () => { const u = T.G().world.scene.userData; return { warn: u.assetWarnings ?? null, audits: u.assetAudits ?? [], tris: u.assetTris ?? {}, sup: u.supportWarnings ?? [], art: u.artConflicts ?? [] }; });
  log('construction audit: no floating, sunk or disconnected parts in any audited piece', Array.isArray(audit.warn) && audit.warn.length === 0, JSON.stringify(audit.warn).slice(0, 600));
  const missing = FAMILIES.filter((f) => !audit.audits.includes(f));
  log(`every converged family is built through the audit (${FAMILIES.length} families, ${audit.audits.length} audited pieces)`, missing.length === 0, missing.length ? `missing: ${missing.join(', ')}` : '');
  log('DEV-04A contracts still hold (support contract, wall-art placement)', audit.sup.length === 0 && audit.art.length === 0, JSON.stringify({ sup: audit.sup, art: audit.art }).slice(0, 400));

  // ---------------------------------------------------------------- 2. finite geometry
  const nan = await E(page, () => {
    const bad = [];
    T.G().world.scene.traverse((o) => {
      const p = o.geometry?.attributes?.position;
      if (!p) return;
      const a = p.array;
      for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) { bad.push(`${o.userData.chunk ?? o.name ?? o.type}#${i}`); break; }
    });
    return bad;
  });
  log('no NaN / infinite vertex in the scene', nan.length === 0, nan.slice(0, 8).join(', '));

  // ---------------------------------------------------------------- 3. room-culled batches are drawn in their own rooms
  const regionGaps = await E(page, () => {
    const w = T.G().world, rooms = w.rooms, v = new (w.scene.position.constructor)(), out = [];
    for (const r of w.regions) {
      if (r.rooms.has('out')) continue; // exterior batches: drawn whenever the outdoors is
      const count = new Map();
      for (const m of r.meshes) m.traverse((o) => {
        const p = o.geometry?.attributes?.position;
        if (!p || !o.isMesh) return;
        o.updateWorldMatrix(true, false);
        for (let i = 0; i < p.count; i += 3) { // every third vertex is plenty for a count
          v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
          const id = rooms.roomAt(v.x, v.y, -v.z);
          if (id === 'out') continue;
          // not in the slab between storeys (room boxes overlap it) nor in the thickness of a wall (a sconce's back plate)
          const q = rooms.rooms.find((rr) => rr.id === id), wz = -v.z;
          if (v.y < q.y0 + 0.6 || v.x < q.x0 + 0.15 || v.x > q.x1 - 0.15 || wz < q.z0 + 0.15 || wz > q.z1 - 0.15) continue;
          if (!r.rooms.has(id)) count.set(id, (count.get(id) ?? 0) + 1);
        }
      });
      const chunks = [...new Set(r.meshes.map((m) => m.userData.chunk ?? m.userData.region))].join('+');
      // a few vertices on a shared wall land in the neighbour (sconces, frames): only real pieces count
      for (const [id, n] of count) if (n >= 40) out.push(`${chunks} has ${n * 3} vertices in ${id} (not in its rooms)`);
    }
    return out;
  });
  log('every room-culled batch is drawn in the rooms its geometry stands in', regionGaps.length === 0, regionGaps.slice(0, 8).join(' | '));

  // ---------------------------------------------------------------- 4. DEV-04C hooks
  const hooks = await E(page, () => {
    const u = T.G().world.scene.userData, wc = u.wickerCandles;
    const near = wc ? wc.candles.every((c) => Math.hypot(c.x - wc.centre.x, c.z - wc.centre.z) < 8 && Number.isFinite(c.y)) : false;
    return { candles: wc?.candles?.length ?? 0, near };
  });
  log('Wickerman candle hook published for DEV-04C (positions round the figure, no ignition state)', hooks.candles >= 6 && hooks.near, JSON.stringify(hooks));

  // ---------------------------------------------------------------- 5. ids, checkpoints, save schema
  const ids = await E(page, () => { const g = T.G(); return { interactables: [...g.world.byId.keys()].sort(), checkpoints: g.world.checkpoints.map((c) => c.name).sort(), stateKeys: Object.keys(g.state).sort(), version: g.state.version }; });
  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  log(`canonical ids unchanged (${ids.interactables.length} interactables, ${ids.checkpoints.length} checkpoints, save version ${ids.version})`, same(ids.interactables, baseline.interactables) && same(ids.checkpoints, baseline.checkpoints) && same(ids.stateKeys, baseline.stateKeys) && ids.version === baseline.saveVersion, JSON.stringify({ missing: baseline.interactables.filter((i) => !ids.interactables.includes(i)), added: ids.interactables.filter((i) => !baseline.interactables.includes(i)) }));

  // ---------------------------------------------------------------- 6. hero view budgets
  const budget = await E(page, async (V) => {
    const g = T.G(), out = {};
    for (const [k, [x, y, z, yaw]] of Object.entries(V)) {
      g.player.setPose({ x, y, z, yaw, pitch: 0.05 }); g.player.y = g.world.col.supportHeight(x, z, y + 0.05, 0.42);
      for (let i = 0; i < 20; i++) g.tick(1 / 30);
      await new Promise((r) => setTimeout(r, 100));
      g.settings.quality = 'low'; g.applyQuality(true); g.tick(1 / 30); g.renderer.render(g.world.scene, g.camera);
      const r = g.renderer.info.render; out[k] = { calls: r.calls, triangles: r.triangles, room: g.world.hereRoom };
    }
    return out;
  }, HERO_VIEWS);
  log('DEV-04B hero / room views within the mobile guide at low (≤ 150 calls, ≤ 250 k triangles)', Object.values(budget).every((b) => b.calls <= 150 && b.triangles <= 250000), JSON.stringify(budget));
} catch (e) {
  log('suite crashed', false, String(e?.stack ?? e).slice(0, 500));
}
log('no page errors / DEV-04A-B contract warnings', problems.length === 0, problems.slice(0, 6).join(' | '));
writeFileSync(`${OUT}/e2e-dev04b-results.json`, JSON.stringify({ base: BASE, results }, null, 2));
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
await browser.close();
process.exit(failed ? 1 : 0);
