// DEV-04D browser suite against the production build (npm run build && npm run preview).
// Usage: node scripts/e2e-dev04d.mjs [baseUrl]   (E2E_OUT=dir for results). Behaviour checks, no pixel snapshots.
// D1 (wall art):
//   1. the FLW-D2 atlas loads (one shared material, the real image replaces the placeholder);
//   2. every D1 piece hangs in its bound slot with its id; the wall-art contract (doors, windows, sweeps) and the
//      DEV-04A/B construction audits stay clean;
//   3. evidence / puzzle panels are untouched and no D1 piece shares wall space with one;
//   4. each canvas is visible (nothing in front of it), seated on its wall (no floating, nothing sunk) and framed;
//   5. the bathroom and guest-WC mirrors are framed, non-emissive (no glowing panel left);
//   6. ids / checkpoints / save keys / save version unchanged (D1 adds no interactable);
//   7. render budgets (low quality, doors closed) of every D1 view inside the mobile guide; the art adds ≤ 1 draw call.
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.env.E2E_OUT ?? 'scripts/out/dev04d';
mkdirSync(OUT, { recursive: true });
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const baseline = JSON.parse(readFileSync(new URL('./dev04a-baseline.json', import.meta.url), 'utf8'));
const additions = JSON.parse(readFileSync(new URL('./dev04c-additions.json', import.meta.url), 'utf8')).interactables;
const exe = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const results = [];
const log = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };
const E = (page, fn, arg) => page.evaluate(fn, arg);

// the D1 slots: art id (registry), FLW id, art centre, facing (deg), canvas w × h, frame rail
const SLOTS = [
  ['painting@85.12,86.20', 'FLW-D2-002', 85.12, 4.6, 86.2, 90, 1.35, 0.81, 0.095],
  ['painting@85.12,92.50', 'FLW-D2-007', 85.12, 2.0, 92.5, 90, 0.66, 0.88, 0.065],
  ['painting@77.25,80.45', 'FLW-D2-026', 77.25, 2.1, 80.45, 0, 1.4, 0.7875, 0.095],
  ['painting@90.00,103.92', 'FLW-D2-028', 90, 5.05, 103.92, 180, 1.3, 0.78, 0.095],
  ['painting@27.90,160.12', 'FLW-D2-046', 27.9, 5.8, 160.12, 0, 0.9, 0.506, 0.065],
  ['painting@107.56,99.90', 'FLW-D2-005', 107.56, 1.85, 99.9, -90, 0.8, 1.0, 0.065],
  ['painting@104.80,91.92', 'FLW-D2-010', 104.8, 2.0, 91.92, 180, 1.4, 1.05, 0.095],
  ['painting@80.80,80.44', 'FLW-D2-022', 80.8, 5.0, 80.44, 0, 0.75, 1.0, 0.065],
  ['painting@82.00,86.90', 'FLW-D2-029', 82.0, 5.0, 86.9, 0, 0.8, 0.8, 0.032],
  ['painting@107.58,102.60', 'FLW-D2-035', 107.58, 5.2, 102.6, -90, 1.0, 0.75, 0.065],
  ['painting@58.60,56.83', 'FLW-D2-042', 58.6, -1.55, 56.83, 180, 1.4, 0.7875, 0.065],
  ['painting@115.56,99.70', 'FLW-D2-044', 115.56, 1.9, 99.7, -90, 0.8, 0.6, 0.032],
  ['painting@20.32,158.60', 'FLW-D2-045', 20.32, 5.75, 158.6, 90, 0.8, 0.6, 0.065],
];
const MIRRORS = [['mirror@87.92,105.30', 87.92, 1.7, 105.3, -90], ['mirror@89.92,105.00', 89.92, 4.9, 105.0, -90]];
// puzzle / evidence / identity panels (DEV04D_ASSET_MANIFEST.md §10): must stay, and keep their wall to themselves
const PROTECTED = ['panel@84.82,96.60', 'panel@95.10,96.00', 'panel@82.50,109.44', 'panel@78.60,93.90', 'panel@78.60,86.68', 'panel@107.50,85.00', 'panel@107.50,89.00', 'panel@107.50,93.00', 'panel@107.50,94.60', 'panel@99.75,98.52', 'panel@128.60,109.35'];

const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error' || (m.type() === 'warning' && /^DEV-04/.test(m.text()))) problems.push(`console: ${m.text().slice(0, 300)}`); });
const SAVE = { version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey', 'consKey'], flags: { leftHome: true, basementOpen: true, boslustOpen: true } };

try {
  await page.goto(BASE + '?autotest=1');
  await page.evaluate((s) => localStorage.setItem('fehluwe.save', JSON.stringify(s)), SAVE);
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
  await page.evaluate(helpers);

  // ---------------------------------------------------------------- 1. atlas
  await page.waitForFunction(() => { let n = 0, ok = true; window.__game.world.scene.traverse((o) => { const m = o.material; if (m?.userData?.flwAtlas) { n++; if (!(m.map?.image?.naturalWidth > 4)) ok = false; } }); return n > 0 && ok; }, null, { timeout: 60000 }).catch(() => {});
  const atlas = await E(page, () => {
    const mats = new Set(), meshes = [];
    window.__game.world.scene.traverse((o) => { const m = o.material; if (m?.userData?.flwAtlas) { mats.add(m); meshes.push(o.userData.chunk ?? '?'); } });
    const m = [...mats][0];
    return { materials: mats.size, meshes: meshes.length, chunks: [...new Set(meshes)], w: m?.map?.image?.naturalWidth ?? 0, h: m?.map?.image?.naturalHeight ?? 0, srgb: m?.map?.colorSpace };
  });
  log('FLW-D2 atlas: one shared material, the 2048 × 1024 image loaded (sRGB)', atlas.materials === 1 && atlas.w === 2048 && atlas.h === 1024 && atlas.srgb === 'srgb', JSON.stringify(atlas));

  // ---------------------------------------------------------------- 2. slots + contracts
  const reg = await E(page, () => { const u = window.__game.world.scene.userData; return { art: u.openings.art, conflicts: u.artConflicts ?? [], support: u.supportWarnings ?? [], asset: u.assetWarnings ?? [] }; });
  const ids = reg.art.map((a) => a.id);
  const missing = [...SLOTS.map((s) => s[0]), ...MIRRORS.map((m) => m[0])].filter((id) => !ids.includes(id));
  log(`all ${SLOTS.length} D1 paintings and ${MIRRORS.length} mirrors are hung in their bound slots`, missing.length === 0, missing.join(', '));
  log('wall-art contract (no art in a door, window or door sweep) and construction audits clean', reg.conflicts.length === 0 && reg.support.length === 0 && (reg.asset.length ?? 0) === 0, JSON.stringify({ conflicts: reg.conflicts, support: reg.support.slice(0, 3), asset: reg.asset.slice?.(0, 3) }).slice(0, 400));

  // ---------------------------------------------------------------- 3. evidence walls
  const prot = reg.art.filter((a) => PROTECTED.includes(a.id)), d1 = reg.art.filter((a) => SLOTS.some((s) => s[0] === a.id) || a.id.startsWith('mirror@'));
  const ov = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0) > -0.3; // 0.3 m breathing room along the wall
  const clash = [];
  for (const a of d1) for (const p of prot) if (a.axis === p.axis && Math.abs(a.f - p.f) < 0.35 && ov(a.a0, a.a1, p.a0, p.a1) && Math.min(a.y1, p.y1) - Math.max(a.y0, p.y0) > -0.3) clash.push(`${a.id}~${p.id}`);
  log(`evidence / identity panels untouched (${PROTECTED.length} present) and no D1 piece within 0.3 m of one on the same wall`, prot.length === PROTECTED.length && clash.length === 0, JSON.stringify({ present: prot.length, clash }));

  // ---------------------------------------------------------------- 4/5. visible, seated, framed; mirrors not glowing
  const seat = await E(page, ({ SLOTS, MIRRORS }) => {
    const g = window.__game, scene = g.world.scene, V = g.camera.position.constructor, rc = new (g.raycaster.constructor)();
    scene.traverse((o) => { if (o.isMesh) { o.userData._vis = o.visible; o.visible = true; } }); scene.updateMatrixWorld(true);
    const cast = (x, y, z, fx, fz, from = 1.5) => { rc.set(new V(x + fx * from, y, -(z + fz * from)), new V(-fx, 0, fz)); rc.far = from + 0.6; return rc.intersectObjects(scene.children, true)[0] ?? null; };
    const kind = (h) => !h ? 'none' : h.object.material?.userData?.flwAtlas ? 'art' : h.object.material?.type ?? '?';
    const out = [];
    for (const [id, , x, y, z, yd, w, hgt, rail] of SLOTS) {
      const r = (yd * Math.PI) / 180, fx = Math.sin(r), fz = Math.cos(r), sx = Math.cos(r), sz = -Math.sin(r); // along-wall unit (plan)
      const c = cast(x, y, z, fx, fz), mid = kind(c);
      const off = w / 2 + rail + 0.12; // just outside the frame: the bare wall
      const wl = cast(x + sx * off, y, z + sz * off, fx, fz), wr = cast(x - sx * off, y, z - sz * off, fx, fz);
      const fr = cast(x + sx * (w / 2 + rail / 2), y, z + sz * (w / 2 + rail / 2), fx, fz);
      // canvas depth in front of the wall (seated: 0.02 … 0.10 m; never behind it)
      const wallD = Math.min(wl?.distance ?? 9, wr?.distance ?? 9), canvasStand = c && wallD < 9 ? +(wallD - c.distance).toFixed(3) : null;
      out.push({ id, mid, canvasStand, frame: kind(fr), wall: [kind(wl), kind(wr)] });
    }
    const mirrors = MIRRORS.map(([id, x, y, z, yd]) => { const r = (yd * Math.PI) / 180, h = cast(x, y, z, Math.sin(r), Math.cos(r)); return { id, type: h?.object.material?.type ?? 'none', emissive: !!(h?.object.material?.isMeshBasicMaterial), d: h ? +(1.5 - h.distance).toFixed(3) : null }; });
    scene.traverse((o) => { if (o.isMesh && o.userData._vis !== undefined) { o.visible = o.userData._vis; delete o.userData._vis; } });
    return { out, mirrors };
  }, { SLOTS, MIRRORS });
  const badSeat = seat.out.filter((s) => s.mid !== 'art' || s.canvasStand == null || s.canvasStand < 0.015 || s.canvasStand > 0.1 || s.frame === 'art' || s.frame === 'none');
  log('each canvas is unobstructed (the centre ray hits the art), seated 1.5–10 cm proud of its wall, and framed', badSeat.length === 0, JSON.stringify(badSeat.length ? badSeat : seat.out.map((s) => `${s.id.replace('painting@', '')} ${s.canvasStand}`)));
  log('bathroom + guest-WC mirrors: framed tinted glass, not an emissive panel, on the wall', seat.mirrors.every((m) => !m.emissive && m.type === 'MeshLambertMaterial' && m.d !== null && m.d > -0.06 && m.d < 0.06), JSON.stringify(seat.mirrors));

  // ---------------------------------------------------------------- 6. ids
  const idx = await E(page, () => { const g = window.__game; return { interactables: [...g.world.byId.keys()].sort(), checkpoints: g.world.checkpoints.map((c) => c.name).sort(), stateKeys: Object.keys(g.state).sort(), version: g.state.version }; });
  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  const expected = [...baseline.interactables, ...additions].sort();
  log(`ids: ${expected.length} interactables / doors, ${baseline.checkpoints.length} checkpoints, save keys and version 4 unchanged (D1 adds no interactable)`,
    same(idx.interactables, expected) && same(idx.checkpoints, baseline.checkpoints) && same(idx.stateKeys, baseline.stateKeys) && idx.version === 4,
    JSON.stringify({ n: idx.interactables.length, undocumented: idx.interactables.filter((i) => !expected.includes(i)) }));

  // ---------------------------------------------------------------- 7. budgets (low, doors closed)
  const budget = await E(page, ({ SLOTS }) => {
    const g = window.__game;
    for (const id of g.world.byId.keys()) if (id.startsWith('door.')) g.state.open[id] = false;
    g.world.syncAll();
    g.settings.quality = 'low'; g.applyQuality(true);
    const rows = [];
    for (const [id, fid, x, y, z, yd] of SLOTS) {
      const r = (yd * Math.PI) / 180, d = 3.0;
      const floorY = y - 1.85;
      g.player.setPose({ x: x + Math.sin(r) * d, y: floorY, z: z + Math.cos(r) * d, yaw: r + Math.PI, pitch: 0.05 });
      g.player.y = g.world.col.supportHeight(g.player.x, g.player.z, floorY + 0.4, 0.42);
      for (let i = 0; i < 20; i++) g.tick(1 / 30);
      let artOn = 0; g.world.scene.traverse((o) => { if (o.material?.userData?.flwAtlas && o.visible) artOn++; });
      g.renderer.render(g.world.scene, g.camera);
      const i = g.renderer.info.render;
      rows.push({ view: fid, room: g.world.hereRoom, calls: i.calls, triangles: i.triangles, artMeshesVisible: artOn });
    }
    return rows;
  }, { SLOTS });
  writeFileSync(`${OUT}/budget.json`, JSON.stringify(budget, null, 2));
  const over = budget.filter((b) => b.calls > 150 || b.triangles > 250000);
  log(`render budgets (low, doors closed): all ${budget.length} D1 views inside the mobile guide`, over.length === 0, (over.length ? over : budget).map((b) => `${b.view} ${b.room} ${b.calls}/${b.triangles}`).join(', '));
  // batching contract: the atlas is ONE material; each room chunk merges all its paintings into one mesh (as every
  // shared material does), so the art costs at most one draw call per chunk in view, never one per painting
  log('the art atlas costs one merged mesh per room chunk (never one per painting)', atlas.meshes === atlas.chunks.length && atlas.meshes < Object.keys(SLOTS).length, `${atlas.meshes} meshes for ${SLOTS.length} paintings in ${atlas.chunks.length} chunks; max chunks with art in one view ${Math.max(...budget.map((b) => b.artMeshesVisible))}`);
} catch (e) {
  log('suite crashed', false, String(e?.stack ?? e).slice(0, 500));
}
log('no page errors / contract warnings', problems.length === 0, problems.slice(0, 6).join(' | '));
writeFileSync(`${OUT}/e2e-dev04d-results.json`, JSON.stringify({ base: BASE, results }, null, 2));
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
await browser.close();
process.exit(failed ? 1 : 0);
