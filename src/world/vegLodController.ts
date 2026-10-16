/**
 * VIS-R01C C1: per-instance vegetation distance/LOD selection.
 *
 * The controller owns only *selection state*. Existing VegBatch owns the WebGL draw path
 * (BatchedMesh multi-draw or InstancedMesh fallback), shadow packing and GPU uploads.
 * Neither scene contents nor shader materials are created here.
 *
 * Migration remains opt-in for Mushroom Grove. Trees and PlantBatch are deliberately
 * not switched by this checkpoint; they need their own visual-parity evidence.
 */
import * as T from 'three';
import { rangeFade, selectTreeLod, type VegLodBands } from './vegetationLod';
import type { VegBatch } from './vegbatch';

export type VegFadeMode = 'ceil12' | 'round12' | 'continuous' | 'hard';

export function vegetationFade(distance: number, b: Pick<VegLodBands, 'exit' | 'fade'>, mode: VegFadeMode) {
  if (mode === 'hard' || b.fade <= 0) return distance < b.exit ? 1 : 0;
  if (mode === 'ceil12') return rangeFade(distance, b); // exact R01B mushroom behavior
  const value = Math.max(0, Math.min(1, (b.exit - distance) / b.fade));
  if (mode === 'round12') return Math.round(value * 12) / 12; // original PlantBatch behavior
  return value;
}

/** Existing world outdoor-window geometry. Plan Z may be mirrored in the render scene. */
export interface VegOutdoorWindow { x: number; z: number; dx: number; dz: number; cos: number }

/** Radius-expanded cone preserves TreeBatches / Mushroom Grove doorway behavior. */
export function visibleThroughOutdoorWindows(
  x: number, z: number, radius: number,
  windows: readonly VegOutdoorWindow[] | null,
  planZSign: 1 | -1 = -1,
) {
  if (!windows) return true;
  for (const w of windows) {
    const px = x - w.x, pz = planZSign * z - w.z, d = Math.hypot(px, pz) || 1;
    if ((px * w.dx + pz * w.dz) / d > w.cos - radius / d) return true;
  }
  return false;
}

export interface VegLodInstance {
  id: number;
  /** Indices of already allocated geometry variants in the owning VegBatch. */
  lods: readonly number[];
  /** Immutable full-size world transform; fades multiply this matrix, never mutate it. */
  m: T.Matrix4;
  /** World-space origin, also immutable. */
  p: T.Vector3;
  /** Full-size bounding radius for the outdoor-window cone. */
  r: number;
  /** Existing level, maintained in place so diagnostic snapshots stay consistent. */
  level: number;
  /** Last quantized scale (can be -1 before the first update). */
  k: number;
}

export interface VegLodView {
  camera: T.Camera;
  outdoors: boolean;
  windows: readonly VegOutdoorWindow[] | null;
  windowsVersion: number;
}

export interface VegLodControllerOptions<I extends VegLodInstance> {
  batch: VegBatch;
  instances: readonly I[];
  bands: (item: I) => VegLodBands;
  fadeMode?: VegFadeMode;
  movementThreshold?: number;
  /** -1 matches mirrored-z woodland; +1 for direct plan-coordinate systems. */
  windowPlanZSign?: 1 | -1;
}

/**
 * Early-frame updater: caller must register before late VegBatch fallback packing.
 * No new per-frame matrices, arrays or vectors. Batch methods are no-ops when state
 * does not change; rotating on the spot is left to renderer frustum culling.
 */
export class VegLodController<I extends VegLodInstance> {
  private readonly cameraPosition = new T.Vector3();
  private readonly lastPosition = new T.Vector3(Infinity, 0, 0);
  private readonly scaled = new T.Matrix4();
  private readonly scale = new T.Matrix4();
  private readonly fadeMode: VegFadeMode;
  private readonly movementThreshold: number;
  private readonly windowPlanZSign: 1 | -1;
  private lastWindowsVersion = -1;
  private lastOutdoors = true;
  private forcedLevel: number | null = null;

  constructor(private readonly opts: VegLodControllerOptions<I>) {
    this.fadeMode = opts.fadeMode ?? 'ceil12';
    this.movementThreshold = opts.movementThreshold ?? 0.3;
    this.windowPlanZSign = opts.windowPlanZSign ?? -1;
  }

  /** Testing-only override for evidence captures, resets the movement cache. */
  setForcedLevel(level: number | null) {
    this.forcedLevel = level;
    this.invalidate();
  }

  invalidate() { this.lastPosition.set(Infinity, 0, 0); }

  /** Convenient adapter for tests/tools; the per-frame game path should use updateCamera. */
  update(view: VegLodView) {
    this.updateCamera(view.camera, view.outdoors, view.windows, view.windowsVersion);
  }

  /** Allocation-free hot path: camera/window references and scalar state, no new view object. */
  updateCamera(
    camera: T.Camera, outdoors: boolean,
    windows: readonly VegOutdoorWindow[] | null, windowsVersion: number,
  ) {
    this.cameraPosition.setFromMatrixPosition(camera.matrixWorld);
    if (this.cameraPosition.distanceTo(this.lastPosition) < this.movementThreshold
      && this.lastWindowsVersion === windowsVersion
      && this.lastOutdoors === outdoors) return;
    this.lastPosition.copy(this.cameraPosition);
    this.lastWindowsVersion = windowsVersion;
    this.lastOutdoors = outdoors;

    const b = this.opts.batch;
    for (const it of this.opts.instances) {
      const distance = it.p.distanceTo(this.cameraPosition), bands = this.opts.bands(it);
      let k = outdoors ? vegetationFade(distance, bands, this.fadeMode) : 0;
      if (k > 0 && windows && !visibleThroughOutdoorWindows(it.p.x, it.p.z, it.r, windows, this.windowPlanZSign)) k = 0;

      const level = Math.min(it.lods.length - 1,
        this.forcedLevel ?? selectTreeLod(distance, it.level, bands.levels, bands.hysteresis));
      if (level !== it.level) { b.setGeometryAt(it.id, it.lods[level]); it.level = level; }
      if (k === it.k) continue;
      if ((k > 0) !== (it.k > 0)) b.setVisibleAt(it.id, k > 0);
      if (k > 0) b.setMatrixAt(it.id, k < 1
        ? this.scaled.copy(it.m).multiply(this.scale.makeScale(k, k, k))
        : it.m);
      it.k = k;
    }
  }
}
