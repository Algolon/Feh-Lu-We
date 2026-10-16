import { describe, it, expect } from 'vitest';
import * as T from 'three';
import type { VegBatch } from '../src/world/vegbatch';
import type { VegLodBands } from '../src/world/vegetationLod';
import {
  VegLodController, vegetationFade, visibleThroughOutdoorWindows,
  type VegLodInstance, type VegLodView,
} from '../src/world/vegLodController';

const BAND: VegLodBands = { levels: [25, 55], hysteresis: 3, exit: 125, fade: 20 };
const medium: VegLodBands = { levels: [50], hysteresis: 3, exit: 105, fade: 15 };
const nursery: VegLodBands = { levels: [12], hysteresis: 2, exit: 32, fade: 8 };

// Exact R01B formula, intentionally independent of the new helper.
const productionFade = (distance: number, b: VegLodBands) =>
  distance >= b.exit ? 0 : Math.ceil(Math.min(1, (b.exit - distance) / Math.max(1e-6, b.fade)) * 12) / 12;
const legacyPlantFade = (distance: number, show: number, fade: number) =>
  Math.round((distance > show ? 0 : Math.min(1, (show - distance) / fade)) * 12) / 12;

type Operation = { kind: 'geometry' | 'visible' | 'matrix'; id: number; value: number | boolean | number[] };
function harness(bands: VegLodBands = BAND) {
  const ops: Operation[] = [];
  const batch: VegBatch = {
    objects: [],
    addInstance: () => 0,
    setGeometryAt: (id, geometry) => { ops.push({ kind: 'geometry', id, value: geometry }); },
    setVisibleAt: (id, show) => { ops.push({ kind: 'visible', id, value: show }); },
    setMatrixAt: (id, matrix) => { ops.push({ kind: 'matrix', id, value: matrix.elements.slice() }); },
  };
  const base = new T.Matrix4().makeTranslation(10, 0, -20);
  const item: VegLodInstance = {
    id: 7, lods: [101, 102, 103], m: base, p: new T.Vector3(10, 0, -20),
    r: 2, level: 0, k: -1,
  };
  const camera = new T.PerspectiveCamera();
  const view: VegLodView = { camera, outdoors: true, windows: null, windowsVersion: 0 };
  const controller = new VegLodController({ batch, instances: [item], bands: () => bands });
  const go = (distance: number, options?: Partial<VegLodView>) => {
    camera.position.set(10 + distance, 0, -20);
    camera.updateMatrixWorld(true);
    controller.update({ ...view, ...options });
  };
  return { batch, ops, base, item, camera, view, controller, go };
}

describe('VIS-R01C C1 — shared vegetation LOD contract', () => {
  it('is bit-for-bit equivalent to the R01B Mushroom ceil12 fade on all declared category bands', () => {
    for (const bands of [BAND, medium, nursery]) {
      for (let d = 0; d < bands.exit + 5; d += 0.03125) {
        expect(vegetationFade(d, bands, 'ceil12')).toBe(productionFade(d, bands));
      }
    }
    expect(vegetationFade(124.999, BAND, 'ceil12')).toBe(1 / 12);
    expect(vegetationFade(125, BAND, 'ceil12')).toBe(0);
  });

  it('preserves old PlantBatch round12 behaviour and tree hard cutoff independently', () => {
    for (const show of [13, 16, 22, 24, 32]) for (const fade of [4, 6]) {
      const b = { exit: show, fade };
      for (let d = 0; d < show + 4; d += 0.125) {
        expect(vegetationFade(d, b, 'round12')).toBe(legacyPlantFade(d, show, fade));
      }
      expect(vegetationFade(show - 0.01, b, 'hard')).toBe(1);
      expect(vegetationFade(show, b, 'hard')).toBe(0);
    }
    expect(vegetationFade(2, { exit: 5, fade: 0 }, 'ceil12')).toBe(1);
    expect(vegetationFade(5, { exit: 5, fade: 0 }, 'round12')).toBe(0);
  });

  it('applies existing mirrored-z outdoor window cone and conservatively accepts radius-edge objects', () => {
    const inside = [{ x: 10, z: 20, dx: 1, dz: 0, cos: 0.95 }];
    expect(visibleThroughOutdoorWindows(30, -20, 1, inside, -1)).toBe(true);
    expect(visibleThroughOutdoorWindows(-10, -20, 1, inside, -1)).toBe(false);
    expect(visibleThroughOutdoorWindows(30, -20, 1, null, -1)).toBe(true);
    expect(visibleThroughOutdoorWindows(30, -20, 1, [], -1)).toBe(false);
    expect(visibleThroughOutdoorWindows(10, 40, 0.1, [{ x: 10, z: 0, dx: 0, dz: 1, cos: 0.9 }], 1)).toBe(true);
  });

  it('initializes instance matrices once, does not re-upload matrices while still or rotating', () => {
    const { ops, go, item, camera, controller, view, base } = harness();
    go(10);
    expect(ops.map(o => o.kind)).toEqual(['visible', 'matrix']);
    expect(ops[0].value).toBe(true);
    expect(ops[1].value).toEqual(base.elements);
    ops.length = 0;
    go(10.15);
    camera.rotation.y = Math.PI;
    camera.updateMatrixWorld(true);
    controller.update(view);
    expect(ops).toEqual([]);
    expect(item.k).toBe(1);
  });

  it('changes only the LOD at its hysteresis boundary; forced diagnostics invalidate position cache', () => {
    const { go, ops, item, controller } = harness();
    go(24);
    expect(item.level).toBe(0);
    ops.length = 0;
    go(27);
    expect(item.level).toBe(0);
    go(29);
    expect(item.level).toBe(1);
    expect(ops.filter(o => o.kind === 'geometry').map(o => o.value)).toEqual([102]);
    go(23);
    expect(item.level).toBe(1);
    go(21);
    expect(item.level).toBe(0);
    controller.setForcedLevel(2);
    go(21);
    expect(item.level).toBe(2);
    controller.setForcedLevel(null);
    go(21);
    expect(item.level).toBe(0);
  });

  it('applies the same quantized fade to an immutable original transform', () => {
    const { go, ops, item, base } = harness();
    go(115);
    expect(item.k).toBe(0.5);
    const m = ops.findLast(o => o.kind === 'matrix')!.value as number[];
    expect(m[0]).toBeCloseTo(0.5, 6);
    expect(m[12]).toBe(10);
    expect(base.elements[0]).toBe(1);
    expect(base.elements[12]).toBe(10);
    ops.length = 0;
    go(115.05); // same quantized step, no matrix upload
    expect(ops).toEqual([]);
    go(130);
    expect(ops).toEqual([{ kind: 'visible', id: 7, value: false }]);
    expect(item.k).toBe(0);
  });

  it('invalidates on windows-version or outdoor-room change even with stationary camera', () => {
    const { ops, item, controller, camera, go, view } = harness();
    const front = [{ x: 10, z: 0, dx: 0, dz: 1, cos: 0.9 }];
    go(10, { windows: front, windowsVersion: 1 });
    expect(item.k).toBe(1); // mirrored -20 world z -> +20 plan z
    ops.length = 0;
    controller.update({ ...view, windows: [{ ...front[0], dz: -1 }], windowsVersion: 2 });
    expect(item.k).toBe(0);
    expect(ops).toEqual([{ kind: 'visible', id: 7, value: false }]);
    ops.length = 0;
    camera.updateMatrixWorld(true);
    controller.update({ ...view, windows: front, windowsVersion: 3 });
    expect(ops.map(o => o.kind)).toEqual(['visible', 'matrix']);
    ops.length = 0;
    controller.update({ ...view, outdoors: false, windows: front, windowsVersion: 3 });
    expect(item.k).toBe(0);
    expect(ops).toEqual([{ kind: 'visible', id: 7, value: false }]);
  });

  it('matches a self-contained R01B reference state machine along a forward/backward distance sweep', () => {
    const { go, item } = harness();
    let previous = 0;
    const selectLegacy = (d: number, old: number) => {
      let n = 0;
      while (n < BAND.levels.length && d >= BAND.levels[n] + (old <= n ? BAND.hysteresis : -BAND.hysteresis)) n++;
      return n;
    };
    const distances = [
      ...Array.from({ length: 141 }, (_, i) => 140 - i),
      ...Array.from({ length: 141 }, (_, i) => i),
    ];
    for (const d of distances) {
      go(d);
      previous = selectLegacy(d, previous);
      // Cache can skip <0.3 m movement; this sweep moves 1 m per sample.
      expect(item.level).toBe(previous);
      expect(item.k).toBe(productionFade(d, BAND));
    }
  });
});
