import { chromium } from 'playwright-core';
const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 640, height: 360 } });
p.on('pageerror', (e) => console.log('ERR', e.message));
await p.goto(BASE + '?autotest=1');
await p.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['frontKey'], flags: { leftHome: true }, unlocked: ['lock.door.front'], open: { 'door.front': true } })));
await p.reload(); await p.click('[data-cont]');
await p.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
const out = await p.evaluate(() => {
  const w = window.__game.world, res = [];
  w.scene.traverse((o) => {
    if (!o.userData.fire) return;
    let top = o; while (top.parent && top.parent !== w.scene) top = top.parent;
    const reg = w.regions.find((r) => r.meshes.includes(top));
    const cul = w.cullables.find((c) => c.root === top);
    const v = o.getWorldPosition(new o.position.constructor());
    res.push({ at: [v.x.toFixed(1), v.y.toFixed(1), (-v.z).toFixed(1)], region: top.userData.region ?? top.userData.chunk ?? null, inRegion: reg ? [...reg.rooms].slice(0, 3).join(',') + ` far ${reg.far}` : null, cull: cul ? `${Math.sqrt(cul.dist2).toFixed(0)} m ${cul.rooms}` : null, parent: o.parent === w.scene ? 'scene' : o.parent.type });
  });
  return res;
});
console.log(out.map((r) => JSON.stringify(r)).join('\n'));
await b.close();
