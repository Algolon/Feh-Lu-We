// Opening tutorial: a compact home hallway/living room. Teaches look, walk, interact, inventory,
// item use (matches → candle), lamps and drawers. Leaving through the front door goes to the estate.
import * as THREE from 'three';
import { World, type GameApi } from '../interactions/world';
import { makeCtx, wall, floor, ceiling } from './arch';
import { box, cyl, blob, compound, v3 } from './kit';
import { table as _t, roundTable, chair, bookshelf, armchair, rug, plant, painting, tableLamp, floorLamp, part } from './furniture';
import { makeFire } from './fire';
import { makeDoor, makeDrawer, makePickup, makeLamp, makeInspect, makeAction, place, lightableItemLabel } from '../interactions/props';
import type { SceneExtras } from '../core/game';
import { has } from '../core/state';
import { tutorialMissing } from '../puzzles/rules';
void _t;

export function buildHome(g: GameApi): { world: World; extras: SceneExtras } {
  const w = new World('home');
  w.ambience = 'home';
  w.col.bounds = { minX: 0.3, maxX: 7.7, minZ: 0.3, maxZ: 5.7 };
  const c = makeCtx(w.col, 'home');
  const k = c.k;
  w.scene.background = new THREE.Color('#2a2018');

  // lighting: warm interior fill + soft daylight from the windows
  w.scene.add(new THREE.HemisphereLight('#ffe9c8', '#5a4632', 1.5));
  const day = new THREE.DirectionalLight('#ffe2b0', 1.2);
  day.position.set(3, 6, -9);
  w.scene.add(day);

  // shell
  floor(c, 0, 8, 0, 6, 0, k.M.wood, '#b88a5a', 0.2, true, 2.2);
  ceiling(c, 0, 8, 0, 6, 2.8);
  for (let x = 0.5; x < 8; x += 1.5) box(c.b, k.M.wood, '#6b4426', x, 2.62, 3, 0.18, 0.18, 6, { chunk: 'home' }); // beams
  const wallOpts = { t: 0.2, mat: k.M.plaster, color: '#f0e3c8' };
  wall(c, 'x', -0.1, -0.2, 8.2, 0, 2.8, { ...wallOpts, windows: [{ at: 3, side: 1, sill: 0.9 }] });
  wall(c, 'x', 6.1, -0.2, 8.2, 0, 2.8, { ...wallOpts, windows: [{ at: 2.5, side: -1, sill: 0.9 }, { at: 5.2, side: -1, sill: 0.9 }] });
  wall(c, 'z', -0.1, 0, 6, 0, 2.8, wallOpts);
  wall(c, 'z', 8.1, 0, 6, 0, 2.8, { ...wallOpts, openings: [{ at: 3, w: 1.05, h: 2.2 }] });
  // wainscot
  for (const [ax, f, a0, a1] of [['x', 0.02, 0, 8], ['x', 5.98, 0, 8], ['z', 0.02, 0, 6]] as const) {
    if (ax === 'x') box(c.b, k.M.wood, '#7a5232', (a0 + a1) / 2, 0, f, a1 - a0, 0.9, 0.04, { chunk: 'home', uv: 1 });
    else box(c.b, k.M.wood, '#7a5232', f, 0, (a0 + a1) / 2, 0.04, 0.9, a1 - a0, { chunk: 'home', uv: 1 });
  }

  // furniture
  rug(c, 4, 3, 0.01, 3.4, 2.4);
  roundTable(c, 4, 3, 0, 0.75);
  chair(c, 4, 4.1, 0, Math.PI, '#5f7a45');
  chair(c, 2.9, 3, 0, Math.PI / 2, '#5f7a45');
  bookshelf(c, 5.6, 0.25, 0, 0, 1.6, 2.1);
  armchair(c, 1.2, 5.1, 0, Math.PI * 0.85, '#7a3a3a');
  plant(c, 7.5, 5.5, 0, 1.2);
  plant(c, 0.5, 0.5, 0, 0.9);
  painting(c, 0.04, 1.75, 1.6, Math.PI / 2, 0.8, 0.6, 2);
  painting(c, 3.0, 1.7, 0.04, 0, 1.0, 0.7, 5);
  // coat rack + boots by the door
  cyl(c.b, k.M.wood, '#5a3a22', 7.55, 0, 4.7, 0.04, 0.05, 1.8, 6, { chunk: 'home' });
  box(c.b, k.M.paint, '#3f5a35', 7.62, 0.9, 4.5, 0.12, 0.8, 0.3, { chunk: 'home' });
  box(c.b, k.M.paint, '#2f3a4a', 7.62, 0.85, 4.9, 0.12, 0.85, 0.3, { chunk: 'home' });
  box(c.b, k.M.paint, '#6b4426', 7.5, 0, 4.0, 0.3, 0.25, 0.14, { chunk: 'home' });
  box(c.b, k.M.paint, '#6b4426', 7.5, 0, 3.75, 0.3, 0.25, 0.14, { chunk: 'home' });
  w.col.addCircle(7.55, 4.6, 0.3, 0, 2);

  // dressoir (sideboard) against the west wall, facing east, with a working drawer
  const dx = 0.32, dz = 3.2;
  box(c.b, k.M.wood, '#6b4426', dx, 0, dz, 0.5, 0.86, 1.8, { chunk: 'home', uv: 1 });
  box(c.b, k.M.wood, '#5a3a22', dx, 0.86, dz, 0.56, 0.05, 1.9, { chunk: 'home', uv: 1 });
  for (const zz of [dz - 0.6, dz + 0.6]) box(c.b, k.M.paint, '#5a3a22', dx + 0.26, 0.1, zz, 0.02, 0.5, 0.5, { chunk: 'home' });
  w.col.addBox(0.05, 0.6, dz - 0.95, dz + 0.95, 0, 0.92);
  const drawer = makeDrawer(w, g, { id: 'home.drawer', x: dx + 0.03, y: 0.73, z: dz, yaw: Math.PI / 2, w: 0.7, h: 0.18, d: 0.42, color: '#7a5232' });
  const key = compound((b) => {
    box(b, k.M.paint, '#d4b25a', 0, 0, 0, 0.05, 0.015, 0.16);
    cyl(b, k.M.paint, '#d4b25a', 0, 0, -0.1, 0.035, 0.035, 0.015, 10);
    box(b, k.M.paint, '#c4553d', 0.05, 0, 0.06, 0.06, 0.01, 0.04);
  });
  key.position.set(0, -0.06, 0);
  drawer.slider.add(key);
  makePickup(w, g, { id: 'pk.frontKey', item: 'frontKey', obj: key, available: drawer.isOpen, hit: [0.3, 0.12, 0.3] });

  // lamps
  const tl = tableLamp(w, 0.32, 0.91, 4.0);
  makeLamp(w, g, { id: 'home.tablelamp', ...tl, name: 'lamp', hit: [0.4, 0.75, 0.4], intensity: 5, distance: 7 });
  const fl = floorLamp(w, 1.8, 0, 5.4);
  makeLamp(w, g, { id: 'home.floorlamp', ...fl, name: 'staande lamp', defaultOn: true, hit: [0.5, 1.9, 0.5], intensity: 5, distance: 8 });

  // items on the table
  const y = 0.76;
  const env = compound((b) => {
    box(b, k.M.paint, '#f3ead8', 0, 0, 0, 0.26, 0.012, 0.18);
    cyl(b, k.M.paint, '#9a2a2a', 0.02, 0.012, -0.02, 0.03, 0.03, 0.01, 10);
  });
  place(env, 3.75, y, 3.2, 0.3);
  w.scene.add(env);
  makePickup(w, g, { id: 'pk.invitation', item: 'invitation', obj: env, after: () => g.inspect('c.invitation') });

  const torch = compound((b) => {
    cyl(b, k.M.paint, '#2b2b2b', 0, 0, 0, 0.035, 0.035, 0.22, 10, { rx: Math.PI / 2 });
    cyl(b, k.M.paint, '#c9c9c9', 0, 0, 0.13, 0.05, 0.04, 0.05, 10, { rx: Math.PI / 2 });
  });
  place(torch, 4.3, y + 0.04, 3.05, 1.2);
  w.scene.add(torch);
  makePickup(w, g, { id: 'pk.torch', item: 'torch', obj: torch, after: () => g.toast('Zaklamp ingepakt. Aan/uit via de Tas-knop (of F).') });

  const matches = compound((b) => {
    box(b, k.M.paint, '#e6dcc0', 0, 0, 0, 0.1, 0.03, 0.06);
    box(b, k.M.paint, '#3f6a3a', 0, 0.03, 0, 0.07, 0.003, 0.04);
  });
  place(matches, 4.12, y, 2.72, 0.4);
  w.scene.add(matches);
  makePickup(w, g, {
    id: 'pk.matches', item: 'matches', obj: matches,
    after: () => g.toast('Lucifers ingepakt. Probeer ze eens: kies ze in je tas en gebruik ze op de kaars.'),
  });

  const nb = compound((b) => {
    box(b, k.M.paint, '#4a2f2a', 0, 0, 0, 0.18, 0.025, 0.24);
    box(b, k.M.paint, '#efe6d0', 0.005, 0.005, 0, 0.17, 0.022, 0.23);
  });
  place(nb, 3.82, y, 2.8, -0.2);
  w.scene.add(nb);
  makePickup(w, g, { id: 'pk.notebook', item: 'notebook', obj: nb, after: () => g.toast('Notitieboek ingepakt. Alles wat je bekijkt, wordt erin bewaard (knop Notities).') });

  // bag (decor) and candle (optional item-use lesson)
  const bag = compound((b) => {
    box(b, k.M.paint, '#4f5f3a', 0, 0, 0, 0.42, 0.26, 0.24);
    box(b, k.M.paint, '#7a5232', 0, 0.26, 0, 0.36, 0.03, 0.04);
  });
  place(bag, 3.55, y, 3.45, 0.4);
  w.scene.add(bag);
  const candle = compound((b) => {
    cyl(b, k.M.paint, '#b8892f', 0, 0, 0, 0.06, 0.07, 0.02, 10);
    cyl(b, k.M.paint, '#f3ead0', 0, 0.02, 0, 0.025, 0.025, 0.14, 8);
    blob(b, k.M.paint, '#fbf6e6', 0.018, 0.13, 0, 0.008, 0.025, 0.008); // wax drip
    cyl(b, k.M.paint, '#2b2118', 0, 0.16, 0, 0.003, 0.003, 0.016, 4); // wick
  });
  place(candle, 4.42, y, 3.4);
  w.scene.add(candle);
  const fl2 = makeFire(w, { kind: 'candle', x: 4.42, y: y + 0.172, z: 3.4, s: 1.1 });
  w.lamps.push({ id: 'home.candle', pos: v3(4.42, y + 0.3, 3.4), color: '#ffb35a', intensity: 2.5, distance: 4, on: () => !!g.state.lit['home.candle'], flicker: 0.25 });
  w.onSync(() => { fl2.visible = !!g.state.lit['home.candle']; });
  makeAction(w, {
    id: 'home.candle', obj: candle, hit: [0.2, 0.3, 0.2],
    label: () => (g.state.lit['home.candle'] ? 'Uitblazen' : 'Kaars'),
    run: () => {
      if (g.state.lit['home.candle']) { g.state.lit['home.candle'] = false; g.changed(); return; }
      g.toast(has(g.state, 'matches') ? 'Neem de lucifers in de hand (Tas → In de hand nemen) en gebruik ze hier.' : 'Een kaars. Met lucifers kun je hem aansteken.');
    },
    itemLabel: lightableItemLabel(() => !!g.state.lit['home.candle']),
    useItem: (item) => {
      if (item !== 'matches') { g.act({ ok: false, msg: 'Daarmee steek je geen kaars aan.', sfx: 'fail' }, { save: false }); return; }
      g.state.lit['home.candle'] = true;
      g.state.flags.usedItemTutorial = true;
      g.act({ ok: true, msg: 'De kaars brandt. Zo gebruik je voorwerpen uit je tas.', sfx: 'fire' });
    },
  });

  // calendar memory
  const cal = compound((b) => {
    box(b, k.M.paint, '#f3ead8', 0, 0, 0, 0.4, 0.5, 0.02);
    box(b, k.M.paint, '#c4553d', 0, 0.42, 0, 0.4, 0.08, 0.025);
  });
  place(cal, 6.9, 1.4, 5.98, Math.PI);
  w.scene.add(cal);
  makeInspect(w, g, { id: 'home.calendar', obj: cal, clue: 'mem.home.calendar', hit: [0.5, 0.6, 0.2], hitOffset: [0, 0.25, 0] });

  // front door: leaving requires the essentials (contextual reminder, never a hidden soft lock)
  const door = makeDoor(w, g, { id: 'home.door', x: 8.1, z: 2.5, dir: 'z+', width: 1.0, height: 2.15, y0: 0, swing: 1, color: '#5f7a8a' });
  void door;
  // override: the door interaction leads outside
  const it = w.byId.get('home.door')!;
  it.label = () => (tutorialMissing(g.state).length ? 'Naar buiten?' : 'Vertrekken');
  it.run = () => {
    const missing = tutorialMissing(g.state);
    if (missing.length) {
      const where: Record<string, string> = { frontKey: ' De sleutel ligt in de lade van het dressoir.' };
      const extra = missing.map((m) => where[m] ?? '').join('');
      g.act({ ok: false, msg: `Nog niet alles ingepakt. Kijk op je lijstje.${extra}`, sfx: 'locked' }, { save: false });
      return;
    }
    g.state.open['home.door'] = true;
    g.sfx('door');
    g.leaveHome();
  };
  // outside view through the door
  box(c.b, k.M.glow, '#bfe0a8', 8.6, 0, 3, 0.05, 2.4, 1.6, { chunk: 'home' });
  part(c, k.M.paint, '#5a3a22', 8.1, 3, 0, 0, 2.2, 0, 0.3, 0.12, 1.3);

  c.b.build(w.scene);
  w.spawn = { x: 2.2, y: 0, z: 1.6, yaw: 0.9, pitch: -0.15 };
  w.checkpoints.push({ name: 'start', pose: w.spawn }, { name: 'door', pose: { x: 7, y: 0, z: 3, yaw: Math.PI / 2, pitch: 0 } });

  return {
    world: w,
    extras: { isIndoor: () => true, surfaceAt: () => 'wood' },
  };
}
