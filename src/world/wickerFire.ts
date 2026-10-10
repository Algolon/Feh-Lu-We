// DEV-04C Wickerman setpiece: an optional environmental interaction in the clearing — never puzzle evidence, never a
// gate. State flow (wickerman_clearing GENERATED_REFERENCE "future interaction states"):
//   unlit clearing → candles lit (matches) → the figure becomes ignitable → burning → charred aftermath
// State lives in `state.lit` (an open boolean record that every save version already parses): `wicker.candles`,
// `wicker.figure`. No schema change, no new top-level key; saves without the keys load as "unlit".
// The burn itself is a session timeline (WICKER_BURN): a figure saved burning loads as the settled aftermath.
//
// Cost: the figure and its hay leave the clearing batch for their own two meshes (their materials carry the char /
// glow uniforms), the candle flames are one fire (2 meshes, revealed one after another by a uniform), the jars one mesh,
// the figure flames two fires (lower / upper body, 2 meshes each), embers one mesh, the smoulder one fire. Everything
// belongs to the clearing's `wick` region, so none of it is drawn where the clearing is not.
import * as THREE from 'three';
import type { GameState } from '../core/state';
import type { Outcome } from '../puzzles/rules';
import { has } from '../core/state';
import { WICKER } from './wickerman';
import type { World, GameApi } from '../interactions/world';
import { v3, hitbox } from './kit';
import { makeFire, makeEmbers, makeSmoke, regionOwned, FIRE_UNIFORMS, type FireReveal, type Tongue } from './fire';
import { propMats } from './propkit';
import { ITEMS } from '../content/items';

export const WICKER_KEYS = { candles: 'wicker.candles', figure: 'wicker.figure' } as const;
export const WICKER_IDS = { candles: 'wicker.candles', figure: 'wicker.figure' } as const;

export const candlesLit = (s: GameState) => s.lit[WICKER_KEYS.candles] === true;
export const figureLit = (s: GameState) => s.lit[WICKER_KEYS.figure] === true;

const ok = (msg: string, sfx: Outcome['sfx'] = 'fire'): Outcome => ({ ok: true, msg, sfx });
const no = (msg: string, sfx: Outcome['sfx'] = 'fail'): Outcome => ({ ok: false, msg, sfx });

/** Use an item on the candle ring. Matches light it; anything else does nothing. */
export function lightCandles(s: GameState, item: string): Outcome {
  if (item !== 'matches') return no('Daarmee krijg je de kaarsen niet aan.');
  if (!has(s, 'matches')) return no('Je hebt geen lucifers.');
  if (candlesLit(s)) return no('De kaarsen branden al.', 'none');
  s.lit[WICKER_KEYS.candles] = true;
  return ok('Je loopt de kring rond en steekt de kaarsen een voor een aan. Het licht trekt naar de stroman in het midden.');
}
/** The default action on a lit ring blows it out again (the figure is unaffected). */
export function blowCandles(s: GameState): Outcome {
  if (!candlesLit(s)) return no('De kaarsen zijn al uit.', 'none');
  s.lit[WICKER_KEYS.candles] = false;
  return ok('Je blaast de kaarsen een voor een uit.', 'click');
}
/** Use an item on the figure: only matches, only once the ring burns, only once. */
export function igniteFigure(s: GameState, item: string): Outcome {
  if (figureLit(s)) return no('Er valt niets meer aan te steken.', 'none');
  if (item !== 'matches') return no('Daarmee krijg je het hooi niet aan.');
  if (!has(s, 'matches')) return no('Je hebt geen lucifers.');
  if (!candlesLit(s)) return no('Het voelt niet goed om hem zomaar aan te steken. Eerst de kaarsen in de kring.', 'none');
  s.lit[WICKER_KEYS.figure] = true;
  return ok('Het droge hooi vat vlam aan de voeten. Het vuur kruipt omhoog door het wilgentenen lijf.');
}
/** Feedback for the default action on the figure (no item in hand). */
export function figureMessage(s: GameState): string {
  if (figureLit(s)) return 'Alleen het zwartgeblakerde wilgen-geraamte staat nog overeind.';
  if (!candlesLit(s)) return 'Een stroman van wilgentenen, volgepakt met droog hooi. De kaarsen in de kring eromheen zijn niet aan.';
  return has(s, 'matches') ? 'De kaarsen branden. Neem de lucifers in de hand om de stroman aan te steken.' : 'De kaarsen branden. Je hebt niets om de stroman mee aan te steken.';
}

/** Burn timeline (seconds since ignition in this session). */
export const WICKER_BURN = { catch: 5, charEnd: 62, fadeStart: 66, settled: 80 } as const;
export interface BurnLook {
  /** flame size, 0..1 (lower body / upper body) */ flameLow: number; flameHigh: number;
  /** char front, 0 (feet) .. 1 (above the head) */ char: number;
  /** ember band at the char front, 0..1 */ glow: number;
  /** smouldering remains at the feet, 0..1 */ smoulder: number;
  /** light intensity factor, 0..1 */ light: number;
  /** settled aftermath (static) */ settled: boolean;
}
const ss = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** The look at `t` seconds after ignition; `t === null` = not ignited; `Infinity` = loaded burned (aftermath). */
export function burnLook(t: number | null): BurnLook {
  if (t === null) return { flameLow: 0, flameHigh: 0, char: 0, glow: 0, smoulder: 0, light: 0, settled: false };
  const B = WICKER_BURN;
  const fade = 1 - ss(B.fadeStart, B.settled, t);
  const char = Math.min(1, 0.12 * ss(0, B.catch, t) + 0.88 * ss(B.catch * 0.6, B.charEnd, t));
  return {
    flameLow: ss(0, B.catch, t) * fade,
    flameHigh: ss(B.catch * 0.8, B.catch * 3, t) * fade,
    char,
    glow: Math.min(1, ss(0, 2, t)) * (1 - ss(B.charEnd - 4, B.settled, t)),
    smoulder: ss(B.fadeStart - 6, B.settled, t),
    light: Math.max(0.12 * ss(B.fadeStart - 6, B.settled, t), ss(0, B.catch, t) * fade),
    settled: t >= B.settled,
  };
}

/** Flame tongues over the figure (plan offsets from the figure's foot point; plan z = −local z). */
export function effigyTongues(part: 'low' | 'high'): Tongue[] {
  // tongues stand OUTSIDE the willow and hay (the hay is opaque): at clearing distance the fire must read as fire
  const J = WICKER, out: Tongue[] = [];
  if (part === 'low') {
    for (const sd of [-1, 1]) {
      for (const [k, h] of [[0.1, 0.62], [0.42, 0.78], [0.74, 0.86]] as const) {
        const y = J.ankle + (J.hip - J.ankle) * k, x = sd * (J.footX + (J.hipX - J.footX) * k);
        out.push({ x: x + sd * 0.1, y, z: 0.1, h, r: 0.13, lean: sd * 0.12 }, { x: x + sd * 0.06, y: y + 0.08, z: -0.13, h: h * 0.85, r: 0.12, lean: sd * 0.08 });
      }
    }
    out.push({ x: 0, y: J.hip - 0.25, z: 0.2, h: 1.0, r: 0.22 }, { x: 0, y: J.hip - 0.2, z: -0.22, h: 0.95, r: 0.2 });
  } else {
    for (let q = 0; q < 8; q++) {
      const a = (q / 8) * Math.PI * 2 + 0.3;
      out.push({ x: Math.cos(a) * 0.36, y: J.waist - 0.15 + (q % 2) * 0.28, z: Math.sin(a) * 0.24, h: 0.85 + (q % 3) * 0.18, r: 0.15, lean: Math.cos(a) * 0.15 });
    }
    for (const sd of [-1, 1]) {
      out.push({ x: sd * (J.shoulderX + 0.08), y: J.shoulder - 0.12, z: 0, h: 0.6, r: 0.12, lean: sd * 0.2 });
      out.push({ x: sd * J.elbow[0], y: J.elbow[1] - 0.04, z: 0.08, h: 0.5, r: 0.1, lean: sd * 0.25 });
      out.push({ x: sd * J.wrist[0], y: J.wrist[1] - 0.1, z: 0.05, h: 0.4, r: 0.09, lean: sd * 0.2 });
    }
    out.push({ x: 0.05, y: J.head - 0.05, z: 0.05, h: 0.95, r: 0.2 }, { x: -0.08, y: J.neck, z: -0.1, h: 0.7, r: 0.15 });
  }
  return out;
}

/** Shader extension for the figure / hay materials: a char front rising from the feet with an ember band at it. */
export interface BurnUniforms { uChar: { value: number }; uGlow: { value: number }; uEmber: { value: number } }
export function burnMaterial(m: THREE.MeshLambertMaterial, u: BurnUniforms, time: { value: number }, kind: 'willow' | 'hay') {
  const top = (WICKER.head + WICKER.headR * 1.6).toFixed(2);
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u, { uTime: time });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vBurnP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBurnP = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vBurnP; uniform float uChar; uniform float uGlow; uniform float uEmber; uniform float uTime;
float burnN(vec3 p) { return sin(p.x * 23.0 + p.y * 7.0) * sin(p.z * 19.0 - p.y * 13.0) * 0.09 + sin((p.x - p.z) * 41.0 + p.y * 29.0) * 0.04; }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
  float front = uChar * (${top} + 0.4) - 0.2;
  float hh = vBurnP.y + burnN(vBurnP);
  float charred = 1.0 - smoothstep(front - 0.22, front + 0.04, hh);
  ${kind === 'hay' ? 'if (hh < front - 0.12) discard; // the hay is burned away below the front' : ''}
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.075, 0.06, 0.05) + diffuseColor.rgb * 0.1, charred * ${kind === 'hay' ? '0.75' : '0.94'});
  float band = smoothstep(front - 0.3, front - 0.04, hh) * (1.0 - smoothstep(front - 0.04, front + ${kind === 'hay' ? '0.22' : '0.08'}, hh));`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  float flick = 0.75 + 0.25 * sin(uTime * 7.0 + vBurnP.y * 9.0 + vBurnP.x * 13.0);
  float spot = step(0.72, fract(sin(dot(floor(vBurnP * 9.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453));
  totalEmissiveRadiance += vec3(1.0, 0.36, 0.07) * (band * uGlow * ${kind === 'hay' ? '1.6' : '1.1'} * flick + charred * spot * uEmber * (0.5 + 0.5 * sin(uTime * 2.3 + vBurnP.y * 17.0)) * smoothstep(0.9, 0.0, vBurnP.y));`);
  };
  m.customProgramCacheKey = () => `wicker-burn-${kind}`;
  return m;
}

// ------------------------------------------------------------------------------------------------ build

export interface WickerSetOpts {
  x: number; z: number; gy: number; foot: number;
  figure: THREE.BufferGeometry; hay: THREE.BufferGeometry;
  candles: { x: number; y: number; z: number }[];
  jar: THREE.BufferGeometry; jarY: number[];
  region: string;
}

/** Build the interactive layer of the clearing (called from grounds.ts during the estate build). */
export function buildWickerSetpiece(w: World, g: GameApi, o: WickerSetOpts) {
  const { x, z, gy, foot, region } = o;
  const s = () => g.state;
  // ---- figure + hay: own meshes so their materials can char and glow (same geometry as DEV-04B)
  const U: BurnUniforms = { uChar: { value: 0 }, uGlow: { value: 0 }, uEmber: { value: 0 } };
  const willowMat = w.material(burnMaterial(new THREE.MeshLambertMaterial({ vertexColors: true }), U, FIRE_UNIFORMS.uTime, 'willow'));
  const hayMat = w.material(burnMaterial(new THREE.MeshLambertMaterial({ vertexColors: true, map: propMats().props.map }), U, FIRE_UNIFORMS.uTime, 'hay'));
  const figure = new THREE.Mesh(o.figure, willowMat), hay = new THREE.Mesh(o.hay, hayMat);
  for (const m of [figure, hay]) { m.position.copy(v3(x, foot, z)); m.castShadow = true; m.receiveShadow = true; m.userData.wicker = true; regionOwned(w, m, region); }
  figure.userData.wickerFigure = true; hay.userData.wickerHay = true;

  // ---- candle ring: glass jars that glow when lit, one fire for all nine flames (revealed one after another)
  const n = o.candles.length;
  const jarParts = o.candles.map((cd, i) => {
    const jg = o.jar.clone().translate(cd.x - x, o.jarY[i] - gy, -(cd.z - z));
    jg.setAttribute('aOrder', new THREE.BufferAttribute(new Float32Array(jg.attributes.position.count).fill((i + 0.5) / n), 1));
    return jg;
  });
  const jarGeo = mergeAll(jarParts);
  const flames = makeFire(w, { kind: 'candles', x, y: gy, z, wicks: o.candles.map((cd) => [cd.x - x, cd.y - gy, cd.z - z] as [number, number, number]), s: 1.35, reveal: true, owner: { region } });
  const reveal = flames.userData.reveal as FireReveal;
  const jarMat = w.material(new THREE.MeshLambertMaterial({ color: '#d5e1d8', transparent: true, opacity: 0.45, depthWrite: false, emissive: new THREE.Color('#000000') }));
  const jarGlow = { value: 0 };
  jarMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uReveal: reveal.uReveal, uStart: reveal.uStart, uJarGlow: jarGlow });
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aOrder; uniform float uReveal; uniform float uStart; varying float vLitJar;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLitJar = fract(aOrder - uStart + 1.0) > uReveal ? 0.0 : 1.0;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vLitJar; uniform float uJarGlow;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.62, 0.26) * 0.55 * vLitJar * uJarGlow;\ndiffuseColor.a = mix(diffuseColor.a, 0.7, vLitJar * uJarGlow);');
  };
  jarMat.customProgramCacheKey = () => 'wicker-jar';
  const jars = new THREE.Mesh(jarGeo, jarMat);
  jars.position.copy(v3(x, gy, z));
  jars.renderOrder = 3;
  regionOwned(w, jars, region);

  // ---- the figure's fire: lower body, upper body (catches a few seconds later), embers, smouldering remains
  const fLow = makeFire(w, { kind: 'custom', x, y: foot, z, tongues: effigyTongues('low'), amp: 0.08, seed: 41, owner: { region } });
  const fHigh = makeFire(w, { kind: 'custom', x, y: foot, z, tongues: effigyTongues('high'), amp: 0.08, seed: 77, owner: { region } });
  const embers = makeEmbers(w, { x, y: foot + 0.4, z, r: 0.45, h: 4.2, n: 40, owner: { region } });
  const smoke = makeSmoke(w, { x, y: foot + 2.6, z, h: 7, n: 12, owner: { region } });
  const smoulder = makeFire(w, { kind: 'hearth', x, y: foot - 0.02, z, s: 0.55, seed: 13, owner: { region } });

  // ---- light: the ring (soft, warm) and the fire (strong, flickering, fading to an ember glow)
  let look = burnLook(null);
  w.lamps.push({ id: WICKER_KEYS.candles, pos: v3(x, gy + 0.6, z), color: '#ffb35a', intensity: 3.2, distance: 9, on: () => candlesLit(s()), flicker: 0.18, room: 'out' });
  w.lamps.push({ id: WICKER_KEYS.figure, pos: v3(x, foot + 1.4, z - 0.6), color: '#ff8a3a', get intensity() { return 18 * Math.max(0.05, look.light); }, distance: 20, on: () => figureLit(s()), flicker: 0.32, room: 'out' });
  for (const cd of o.candles) w.patches.add(cd.x, cd.y - 0.12, cd.z, 0.42, '#ffae55', () => candlesLit(s()), 0.24, { soft: true });
  w.patches.add(x, gy + 0.05, z, 3.4, '#ff8a3a', () => figureLit(s()), 0.32, { soft: true });
  w.emitters.push({ kind: 'fire', pos: v3(x, foot + 1, z), on: () => look.flameLow > 0.05 });

  // ---- timeline: candles light one after another from the one nearest the player; the burn runs on the game clock
  let now = 0, litAt = -Infinity, ignAt: number | null = null;
  const apply = () => {
    look = burnLook(ignAt === null ? null : ignAt === -Infinity ? Infinity : now - ignAt);
    const cl = candlesLit(s());
    flames.visible = cl;
    reveal.uReveal.value = cl ? Math.min(1, (now - litAt) / 1.8) : 0;
    jarGlow.value = cl ? 1 : 0;
    fLow.visible = look.flameLow > 0.01; fHigh.visible = look.flameHigh > 0.01;
    fLow.scale.set(0.55 + 0.45 * look.flameLow, 0.15 + 0.85 * look.flameLow, 0.55 + 0.45 * look.flameLow);
    fHigh.scale.set(0.55 + 0.45 * look.flameHigh, 0.35 + 0.65 * look.flameHigh, 0.55 + 0.45 * look.flameHigh);
    smoulder.visible = look.smoulder > 0.03; smoulder.scale.setScalar(0.3 + 0.7 * look.smoulder);
    embers.visible = look.flameLow > 0.15 || look.smoulder > 0.3;
    smoke.visible = look.flameLow > 0.3;
    U.uChar.value = look.char; U.uGlow.value = look.glow; U.uEmber.value = 0.4 * look.smoulder;
    hay.visible = !look.settled;
  };
  w.onSync(() => {
    if (figureLit(s()) && ignAt === null) ignAt = -Infinity; // loaded burned: the settled aftermath
    if (!figureLit(s())) ignAt = null;
    if (!candlesLit(s())) litAt = -Infinity;
    else if (litAt === -Infinity) litAt = -1e6; // lit without the sweep (a loaded save): all at once
    apply();
  });
  w.onUpdate((_dt, t) => { now = t; if (candlesLit(s()) || figureLit(s())) apply(); });

  // ---- interaction: the ring (nine hit boxes, one id) and the figure
  const ring = new THREE.Group();
  ring.position.copy(v3(x, gy, z));
  regionOwned(w, ring, region);
  const hits = o.candles.map((cd) => hitbox(ring, 0.42, 0.42, 0.42, cd.x - x, cd.y - gy - 0.08, -(cd.z - z)));
  w.add({
    id: WICKER_IDS.candles, obj: ring, hit: hits, focus: v3(x, gy + 0.3, z), reach: 2.4,
    label: () => (candlesLit(s()) ? 'Kaarsen uitblazen' : 'Kaarsen'),
    run: () => {
      if (candlesLit(s())) { g.act(blowCandles(s())); return; }
      g.toast(has(s(), 'matches') ? 'Negen kaarsen in glazen potten, in een kring om de stroman. Neem de lucifers in de hand om ze aan te steken.' : 'Negen kaarsen in glazen potten, in een kring om de stroman. Je hebt niets om ze aan te steken.');
    },
    acceptsItems: true,
    itemLabel: (item) => (candlesLit(s()) ? null : item === 'matches' ? 'Kaarsen aansteken' : `Gebruik: ${ITEMS[item]?.name ?? item}`),
    useItem: (item) => {
      const p = g.playerXZ();
      // start the sweep at the candle nearest the player
      let best = 0, bd = Infinity;
      o.candles.forEach((cd, i) => { const d = Math.hypot(cd.x - p.x, cd.z - p.z); if (d < bd) { bd = d; best = i; } });
      const r = lightCandles(s(), item);
      if (r.ok) { litAt = now; reveal.uStart.value = best / n; }
      g.act(r, { save: r.ok });
    },
  });
  const fig = new THREE.Group();
  fig.position.copy(v3(x, foot, z));
  regionOwned(w, fig, region);
  const fh = hitbox(fig, 1.1, 2.7, 0.75, 0, 1.4, 0);
  w.add({
    id: WICKER_IDS.figure, obj: fig, hit: [fh], focus: v3(x, foot + 1.4, z), reach: 3.4,
    label: () => (figureLit(s()) ? (look.settled ? 'Verkoolde stroman' : null) : 'Stroman'),
    run: () => g.toast(figureMessage(s())),
    acceptsItems: true,
    itemLabel: (item) => (figureLit(s()) ? null : item === 'matches' ? 'Stroman aansteken' : `Gebruik: ${ITEMS[item]?.name ?? item}`),
    useItem: (item) => {
      const r = igniteFigure(s(), item);
      if (r.ok) ignAt = now;
      g.act(r, { save: r.ok });
    },
  });
  w.scene.userData.wickerSet = { look: () => look, ids: WICKER_IDS, figure, hay, flames, fLow, fHigh, embers, smoke, smoulder, jars, reveal, burnUniforms: U };
}

function mergeAll(parts: THREE.BufferGeometry[]) {
  const all = parts.map((p) => (p.index ? p.toNonIndexed() : p));
  let count = 0; for (const p of all) count += p.attributes.position.count;
  const out = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'aOrder']) {
    const size = all[0].attributes[name].itemSize, arr = new Float32Array(count * size);
    let off = 0; for (const p of all) { arr.set(p.attributes[name].array as Float32Array, off); off += p.attributes[name].count * size; }
    out.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  out.computeBoundingSphere();
  return out;
}
