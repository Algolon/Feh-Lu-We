// DEV-04C atmosphere, authored surfaces & interactive setpieces: the authored-surface layer is opt-in and bounded, flames
// follow their host's visibility owner, and the Wickerman setpiece is an optional, gated, persistent state flow that
// never touches the puzzles or the save schema.
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { surface, installSurfaces, SURFACE_PROFILES, SURFACE_PARAMS, flwNoiseCPU } from '../src/world/surfaces';
import { makeFire, regionOwned } from '../src/world/fire';
import { World } from '../src/interactions/world';
import { defaultState, parseSave, STATE_VERSION } from '../src/core/state';
import { solvedCount, PUZZLES } from '../src/puzzles/rules';
import { WICKER } from '../src/world/wickerman';
import {
  WICKER_KEYS, lightCandles, blowCandles, igniteFigure, candlesLit, figureLit, figureMessage, burnLook, WICKER_BURN, effigyTongues,
} from '../src/world/wickerFire';

describe('DEV-04C authored surfaces', () => {
  it('profiles are distinct and their breakup stays restrained (broad, not noisy; no dirty extremes)', () => {
    const ids = Object.values(SURFACE_PROFILES);
    expect(new Set(ids).size).toBe(ids.length);
    for (const [k, [ls, la, ms, ma, ha, sa]] of Object.entries(SURFACE_PARAMS)) {
      expect(ls, `${k} low scale is broad`).toBeGreaterThanOrEqual(1);
      expect(la + ma, `${k} total value swing`).toBeLessThanOrEqual(0.3);
      if (ms > 0) expect(ms, `${k} mid scale under the low scale`).toBeLessThan(ls);
      expect(ha).toBeLessThanOrEqual(0.12);
      expect(sa).toBeGreaterThanOrEqual(0.7);
      expect(sa).toBeLessThanOrEqual(1);
    }
  });
  it('opt-in by define on lit materials only; the shader chunks are extended once and guarded', () => {
    installSurfaces(); installSurfaces();
    const C = THREE.ShaderChunk as unknown as Record<string, string>;
    expect(C.common.split('vec3 flwSurface(').length - 1).toBe(1);
    expect(C.color_fragment).toContain('#ifdef FLW_SURFACE');
    expect(C.worldpos_vertex).toContain('#ifdef FLW_SURFACE');
    const lam = surface(new THREE.MeshLambertMaterial(), 'plaster');
    expect((lam as THREE.Material & { defines: Record<string, unknown> }).defines.FLW_SURFACE).toBe(SURFACE_PROFILES.plaster);
    const phong = surface(new THREE.MeshPhongMaterial(), 'metal');
    expect((phong as THREE.Material & { defines: Record<string, unknown> }).defines.FLW_SURFACE).toBe(SURFACE_PROFILES.metal);
    const basic = surface(new THREE.MeshBasicMaterial(), 'paint'); // flames, glow, signs: never altered
    expect((basic as THREE.Material & { defines?: Record<string, unknown> }).defines?.FLW_SURFACE).toBeUndefined();
  });
  it('the breakup noise is bounded and smooth (value zones, not speckle)', () => {
    let maxStep = 0;
    for (let i = 0; i < 400; i++) {
      const x = i * 0.37, y = (i % 7) * 0.5, z = i * 0.11;
      const a = flwNoiseCPU(x, y, z), b = flwNoiseCPU(x + 0.05, y, z);
      expect(a).toBeGreaterThanOrEqual(0); expect(a).toBeLessThanOrEqual(1);
      maxStep = Math.max(maxStep, Math.abs(a - b));
    }
    expect(maxStep).toBeLessThan(0.2); // 5 cm apart in noise space: continuous
  });
});

describe('DEV-04C fire / light continuity', () => {
  it('a flame owned by a region is held by a never-self-culled holder tagged with that region', () => {
    const w = new World('estate');
    const f = makeFire(w, { kind: 'candles', x: 10, y: 1, z: 20, wicks: [[0, 0, 0], [0, 0, 1]], owner: { region: 'mLiv' } });
    const holder = f.parent!;
    expect(holder.parent).toBe(w.scene);
    expect(holder.userData.region).toBe('mLiv');
    expect(holder.userData.noCull).toBe(true);
    // the flame's own visibility stays free for game state
    f.visible = false; expect(holder.visible).toBe(true);
  });
  it('a flame owned by a fixture hangs in it (culled together) at the same world position', () => {
    const w = new World('estate');
    const fixture = new THREE.Group(); fixture.position.set(5, 3, -7); fixture.rotation.y = 0.7; w.scene.add(fixture);
    const f = makeFire(w, { kind: 'candle', x: 6, y: 2.5, z: 8, owner: { parent: fixture } });
    expect(f.parent).toBe(fixture);
    const p = f.getWorldPosition(new THREE.Vector3());
    expect(p.distanceTo(new THREE.Vector3(6, 2.5, -8))).toBeLessThan(1e-6);
  });
  it('regionOwned moves an existing object under a region holder', () => {
    const w = new World('estate'), o = new THREE.Group();
    w.scene.add(o);
    regionOwned(w, o, 'fireCamp');
    expect(o.parent!.userData.region).toBe('fireCamp');
    expect(w.scene.children.includes(o)).toBe(false);
  });
  it('custom tongues and the reveal uniforms (candles lit one after another without extra draw calls)', () => {
    const w = new World('estate');
    const f = makeFire(w, { kind: 'candles', x: 0, y: 0, z: 0, wicks: [[0, 0, 0], [1, 0, 0], [2, 0, 0]], reveal: true });
    expect(f.userData.reveal.uReveal.value).toBe(1);
    expect(f.children.length).toBe(2); // outer + core: still two meshes
    const order = (f.children[0] as THREE.Mesh).geometry.attributes.aOrder.array as Float32Array;
    expect(new Set(Array.from(order)).size).toBe(3);
  });
});

describe('DEV-04C Wickerman setpiece rules', () => {
  const fresh = () => { const s = defaultState(); s.inventory.push('matches'); return s; };
  it('candles light with matches only; the figure refuses until the ring burns (gate), then burns once', () => {
    const s = fresh();
    expect(lightCandles(s, 'torch').ok).toBe(false);
    expect(candlesLit(s)).toBe(false);
    const early = igniteFigure(s, 'matches');
    expect(early.ok).toBe(false);
    expect(figureLit(s)).toBe(false); // gated: nothing changed
    expect(lightCandles(s, 'matches').ok).toBe(true);
    expect(candlesLit(s)).toBe(true);
    expect(lightCandles(s, 'matches').ok).toBe(false); // already lit
    expect(igniteFigure(s, 'torch').ok).toBe(false);
    expect(igniteFigure(s, 'matches').ok).toBe(true);
    expect(figureLit(s)).toBe(true);
    expect(igniteFigure(s, 'matches').ok).toBe(false); // once
    expect(blowCandles(s).ok).toBe(true);
    expect(candlesLit(s)).toBe(false);
    expect(figureLit(s)).toBe(true); // a burned figure stays burned
    expect(figureMessage(s)).toMatch(/geraamte/);
  });
  it('without matches nothing lights', () => {
    const s = defaultState();
    expect(lightCandles(s, 'matches').ok).toBe(false);
    s.lit[WICKER_KEYS.candles] = true;
    expect(igniteFigure(s, 'matches').ok).toBe(false);
  });
  it('optional: it never solves, unlocks or changes any puzzle, item or flag', () => {
    const s = fresh(), before = JSON.stringify({ ...s, lit: {} });
    const solved0 = solvedCount(s);
    lightCandles(s, 'matches'); igniteFigure(s, 'matches');
    expect(solvedCount(s)).toBe(solved0);
    expect(PUZZLES.every((p) => !p.solved(s) || p.solved(defaultState()))).toBe(true);
    expect(JSON.stringify({ ...s, lit: {} })).toBe(before); // only `lit` changed
    expect(Object.keys(s.lit).sort()).toEqual([WICKER_KEYS.candles, WICKER_KEYS.figure].sort());
  });
  it('persists through save / load without a schema change; older saves load as unlit', () => {
    const s = fresh(); lightCandles(s, 'matches'); igniteFigure(s, 'matches');
    const back = parseSave(JSON.stringify(s))!;
    expect(back.version).toBe(STATE_VERSION);
    expect(STATE_VERSION).toBe(4);
    expect(candlesLit(back) && figureLit(back)).toBe(true);
    expect(Object.keys(back).sort()).toEqual(Object.keys(defaultState()).sort()); // no new top-level key
    const old = parseSave(JSON.stringify({ version: 4, scene: 'estate', lit: { 'fire.clearing': true } }))!;
    expect(candlesLit(old) || figureLit(old)).toBe(false);
    expect(old.lit['fire.clearing']).toBe(true);
    const v3 = parseSave(JSON.stringify({ version: 3, scene: 'estate', lit: { 'wicker.figure': true } }))!; // v3 → v4 keeps only known lit keys
    expect(figureLit(v3)).toBe(false);
  });
});

describe('DEV-04C Wickerman burn look', () => {
  it('timeline: catch, char front rising, flames fading into settled smouldering remains', () => {
    expect(burnLook(null)).toMatchObject({ flameLow: 0, flameHigh: 0, char: 0, smoulder: 0, settled: false });
    let prev = 0;
    for (let t = 0; t <= WICKER_BURN.settled + 5; t += 0.5) {
      const l = burnLook(t);
      for (const v of Object.values(l)) if (typeof v === 'number') { expect(Number.isFinite(v)).toBe(true); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1); }
      expect(l.char).toBeGreaterThanOrEqual(prev - 1e-9); prev = l.char; // the char only climbs
    }
    expect(burnLook(1).flameLow).toBeGreaterThan(burnLook(1).flameHigh); // the feet catch first
    expect(burnLook(20).flameLow).toBeGreaterThan(0.9);
    expect(burnLook(20).flameHigh).toBeGreaterThan(0.9);
    const end = burnLook(Infinity);
    expect(end).toMatchObject({ flameLow: 0, flameHigh: 0, char: 1, settled: true });
    expect(end.smoulder).toBe(1);
    expect(end.light).toBeGreaterThan(0); // the remains still glow faintly
  });
  it('flame tongues sit on the figure (finite, within its reach), lower and upper body', () => {
    for (const part of ['low', 'high'] as const) {
      const t = effigyTongues(part);
      expect(t.length).toBeGreaterThan(8);
      for (const q of t) {
        for (const v of [q.x, q.y, q.z, q.h, q.r]) expect(Number.isFinite(v)).toBe(true);
        expect(Math.abs(q.x)).toBeLessThan(WICKER.wrist[0] + 0.3);
        expect(q.y).toBeGreaterThanOrEqual(0);
        expect(q.y + q.h).toBeLessThan(WICKER.head + 1.2);
      }
    }
  });
});
