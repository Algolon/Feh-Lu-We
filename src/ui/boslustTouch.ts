// BOSLUST-R05 — touch-first mechanical wheel semantics (pure, testable).
// Swipe steps are quantized in CSS pixels, independent from device pixel ratio.
export const SWIPE_STEP_PX = 32;
export const DRAG_SLOP_PX = 12;
export const MAX_SWIPE_STEPS = 12;

/** Positive = swipe up / advance digit; negative = swipe down / reverse. */
export function swipeWheelSteps(startY: number, y: number): number {
  if (!Number.isFinite(startY) || !Number.isFinite(y)) return 0;
  const delta = startY - y;
  const steps = Math.trunc(delta / SWIPE_STEP_PX);
  return Math.max(-MAX_SWIPE_STEPS, Math.min(MAX_SWIPE_STEPS, steps));
}

/** For touch, the upper/lower half of the real 3D hitbox controls direction. */
export function tapWheelDirection(localY: number, touch: boolean): 1 | -1 {
  return touch && localY < 0 ? -1 : 1;
}
