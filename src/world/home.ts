// Opening tutorial: a compact home hallway/living room. Teaches look, walk, interact, inventory,
// item use (matches → candle), lamps and drawers. Leaving through the front door goes to the estate.
import * as THREE from 'three';
import { World, type GameApi } from '../interactions/world';
import { makeCtx, wall, floor, ceiling } from './arch';
import { box, compound, v3 } from './kit';
import { roundTable, chair, bookshelf, armchair, rug, flwPainting, joinery, part } from './furniture';
import { makeFire } from './fire';
import { makeDoor, makeDrawer, makePickup, makeLamp, makeInspect, makeAction, place, lightableItemLabel } from '../interactions/props';
import type { SceneExtras } from '../core/game';
import { has } from '../core/state';
import { tutorialMissing } from '../puzzles/rules';
import { beginOpenings } from './openings';
import { Asm, artMats, ContactShadows } from './artkit';
import { homeTorch, homeMatches, homeNotebook, homeInvitation, homeTravelCase } from './homeProps';
import { addKey, presentKey, keyLiner, linerWhenOpen, LINER_TOP } from './d2props';
import { homeCoatStand, homeBoots, homeCandle, homeLamp, homeCalendar, homePottedPlant } from './homeDressing';

export function buildHome(g: GameApi): { world: World; extras: SceneExtras } {
  const w = new World('home');
  w.scene.userData.openings = beginOpenings(); // home participates in the same wall-art checks as the estate
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
  const trim = new Asm(c.b, 'home', 0, 0, 0, 0);
  for (let x = 0.5; x < 8; x += 1.5) trim.add(artMats().timber, '#6b4426', joinery.sb(0.18, 0.18, 6, 0.008), x, 2.71, 3); // softened timber edges
  const wallOpts = { t: 0.2, mat: k.M.plaster, color: '#f0e3c8' };
  wall(c, 'x', -0.1, -0.2, 8.2, 0, 2.8, { ...wallOpts, windows: [{ at: 3, side: 1, sill: 0.9 }] });
  wall(c, 'x', 6.1, -0.2, 8.2, 0, 2.8, { ...wallOpts, windows: [{ at: 2.5, side: -1, sill: 0.9 }, { at: 5.2, side: -1, sill: 0.9 }] });
  wall(c, 'z', -0.1, 0, 6, 0, 2.8, wallOpts);
  wall(c, 'z', 8.1, 0, 6, 0, 2.8, { ...wallOpts, openings: [{ at: 3, w: 1.05, h: 2.2 }] });
  // wainscot
  for (const [ax, f, a0, a1] of [['x', 0.02, 0, 8], ['x', 5.98, 0, 8], ['z', 0.02, 0, 6]] as const) {
    if (ax === 'x') box(c.b, k.M.wood, '#7a5232', (a0 + a1) / 2, 0, f, a1 - a0, 0.78, 0.04, { chunk: 'home', uv: 1 });
    else box(c.b, k.M.wood, '#7a5232', f, 0, (a0 + a1) / 2, 0.04, 0.78, a1 - a0, { chunk: 'home', uv: 1 });
  }

  // The panel cap ends below the sill (0.79); it never covers the bottom of the glass.
  for (const z of [0.025, 5.975]) box(c.b, k.M.paint, '#6c4c32', 4, 0.76, z, 8, 0.025, 0.05, { chunk: 'home' });
  box(c.b, k.M.paint, '#6c4c32', 0.025, 0.76, 3, 0.05, 0.025, 6, { chunk: 'home' });
  // Complete the lower sash locally; shared estate window construction belongs to GEO-R01.
  for (const [x, z] of [[3, 0.025], [2.5, 5.975], [5.2, 5.975]]) {
    box(c.b, k.M.paint, '#e2d6bc', x, 0.835, z, 1.1, 0.065, 0.044, { chunk: 'home', jitter: 0 });
  }

  // furniture
  rug(c, 4, 3, 0.01, 3.4, 2.4);
  roundTable(c, 4, 3, 0, 0.75);
  chair(c, 4, 4.1, 0, Math.PI, '#5f7a45');
  chair(c, 2.9, 3, 0, Math.PI / 2, '#5f7a45');
  bookshelf(c, 5.6, 0.25, 0, 0, 1.6, 2.1);
  armchair(c, 1.2, 5.1, 0, Math.PI * 0.85, '#7a3a3a');
  homePottedPlant(c, 7.5, 5.5, 1.2);
  homePottedPlant(c, 0.5, 0.5, 0.9);
  flwPainting(c, 'FLW-D2-007', 0.04, 1.75, 1.6, Math.PI / 2);
  flwPainting(c, 'FLW-D2-002', 1.25, 1.7, 0.04, 0); // solid wall, clear of the window at x=3
  // TUT-R02: recognisable clothing / footwear, supported by the same compact entrance footprint.
  homeCoatStand(c);
  homeBoots(c);

  // dressoir (sideboard) against the west wall, facing east, with a working drawer
  const dx = 0.32, dz = 3.2;
  // Built cabinet: lower cupboard, end panels, back and top. The upper drawer cavity is empty.
  const M = artMats(), cabinet = new Asm(c.b, 'home', dx, 0, dz, Math.PI / 2);
  const { sb, bx } = joinery;
  cabinet.add(M.timber, '#6b4426', sb(1.8, 0.56, 0.5, 0.008), 0, 0.32, 0);
  cabinet.add(M.timber, '#4e3320', sb(1.9, 0.055, 0.56, 0.009), 0, 0.8875, 0);
  cabinet.add(M.timber, '#4e3320', sb(1.84, 0.07, 0.53, 0.008), 0, 0.035, 0);
  cabinet.add(M.timber, '#6b4426', bx(1.8, 0.26, 0.035), 0, 0.73, -0.232);
  for (const x of [-0.875, 0.875]) cabinet.add(M.timber, '#6b4426', sb(0.05, 0.26, 0.5, 0.004), x, 0.73, 0);
  for (const x of [-0.62, 0.62]) {
    cabinet.add(M.timber, '#765438', sb(0.52, 0.25, 0.04, 0.005), x, 0.73, 0.23);
    cabinet.add(M.timber, '#543b29', sb(0.48, 0.4, 0.028, 0.005), x, 0.31, 0.26);
  }
  cabinet.add(M.timber, '#493426', bx(1.7, 0.025, 0.44), 0, 0.62, 0); // cavity floor
  w.col.addBox(0.05, 0.6, dz - 0.95, dz + 0.95, 0, 0.92);
  const drawer = makeDrawer(w, g, { id: 'home.drawer', x: dx + 0.03, y: 0.73, z: dz, yaw: Math.PI / 2, w: 0.7, h: 0.18, d: 0.42, travel: 0.46, color: '#7a5232' });
  const key = presentKey(compound((b) => addKey(b, 'frontKey'))); // DEV-04D D2: FLW-K3-001 key-family model; D2-R: ×1.7 presentation
  const felt = keyLiner('felt'); // D2-R: on a green felt liner (contrast for the brass key and red tag)
  felt.position.set(0, -0.06, 0);
  felt.rotation.y = Math.PI / 2;
  drawer.slider.add(felt);
  linerWhenOpen(w, felt, drawer.isOpen);
  key.position.set(0, -0.06 + LINER_TOP.felt, 0);
  key.rotation.y = Math.PI / 2; // long silhouette across the tray, clear of the front lip
  drawer.slider.add(key);
  makePickup(w, g, { id: 'pk.frontKey', item: 'frontKey', obj: key, available: drawer.isOpen, hit: [0.3, 0.12, 0.3] });

  // lamps
  const tl = homeLamp(w, 0.32, 0.915, 4.0, false);
  makeLamp(w, g, { id: 'home.tablelamp', ...tl, name: 'lamp', hit: [0.4, 0.75, 0.4], intensity: 5, distance: 7 });
  const fl = homeLamp(w, 1.8, 0, 5.4, true);
  makeLamp(w, g, { id: 'home.floorlamp', ...fl, name: 'staande lamp', defaultOn: true, hit: [0.5, 1.9, 0.5], intensity: 5, distance: 8 });

  // items on the table
  const y = 0.76;
  const env = homeInvitation();
  place(env, 3.75, y, 3.2, 0.3);
  w.scene.add(env);
  makePickup(w, g, { id: 'pk.invitation', item: 'invitation', obj: env, hit: [0.29, 0.08, 0.21], after: () => g.inspect('c.invitation') });

  const torch = homeTorch();
  place(torch, 4.3, y, 3.05, -2.0);
  w.scene.add(torch);
  makePickup(w, g, { id: 'pk.torch', item: 'torch', obj: torch, hit: [0.16, 0.15, 0.38], after: () => g.toast('Zaklamp ingepakt. Aan/uit via de Tas-knop (of F).') });

  const matches = homeMatches();
  place(matches, 4.12, y, 2.72, 0.4);
  w.scene.add(matches);
  makePickup(w, g, {
    id: 'pk.matches', item: 'matches', obj: matches, hit: [0.18, 0.09, 0.12],
    after: () => g.toast('Lucifers ingepakt. Probeer ze eens: kies ze in je tas en gebruik ze op de kaars.'),
  });

  const nb = homeNotebook();
  place(nb, 3.82, y, 2.8, -0.2);
  w.scene.add(nb);
  makePickup(w, g, { id: 'pk.notebook', item: 'notebook', obj: nb, hit: [0.23, 0.10, 0.29], after: () => g.toast('Notitieboek ingepakt. Alles wat je bekijkt, wordt erin bewaard (knop Notities).') });

  // bag (decor) and candle (optional item-use lesson)
  const bag = homeTravelCase();
  place(bag, 3.72, y, 3.43, 0.2);
  w.scene.add(bag);
  const candle = homeCandle();
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
  const cal = homeCalendar(w);
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
  // One instanced contact layer grounds the existing shaped furniture and new entrance props.
  // Neutral static occlusion only; no baked lamp light or global lighting change.
  const contacts = new ContactShadows();
  contacts.add(7.55, 0.002, 4.6, 0.84, 0.84, 0, 0.32);
  contacts.add(7.5, 0.002, 3.9, 0.54, 0.62, -Math.PI / 2, 0.34);
  contacts.add(4, 0.024, 3, 0.87, 0.87, 0, 0.28);
  contacts.add(4, 0.024, 4.1, 0.85, 0.84, Math.PI, 0.25);
  contacts.add(2.9, 0.024, 3, 0.85, 0.84, Math.PI / 2, 0.25);
  contacts.add(1.2, 0.002, 5.1, 1.12, 1.2, Math.PI * 0.85, 0.3);
  contacts.add(5.6, 0.002, 0.25, 1.8, 0.76, 0, 0.25);
  contacts.add(7.5, 0.002, 5.5, 0.62, 0.62, 0, 0.3);
  contacts.add(0.5, 0.002, 0.5, 0.5, 0.5, 0, 0.3);
  contacts.add(1.8, 0.002, 5.4, 0.64, 0.64, 0, 0.3);
  contacts.build(w.scene, 'home', '#514538');
  w.spawn = { x: 2.2, y: 0, z: 1.6, yaw: 0.9, pitch: -0.15 };
  w.checkpoints.push({ name: 'start', pose: w.spawn }, { name: 'door', pose: { x: 7, y: 0, z: 3, yaw: Math.PI / 2, pitch: 0 } });

  return {
    world: w,
    extras: { isIndoor: () => true, surfaceAt: () => 'wood' },
  };
}
