import { describe, it, expect } from 'vitest';
import { DRAG_SLOP_PX, swipeWheelSteps, tapWheelDirection } from '../src/ui/boslustTouch';

describe('BOSLUST R05 touch-first wheel gestures', () => {
  it('tap top advances and tap bottom reverses on touch, desktop still advances', () => {
    expect(tapWheelDirection(0.05,true)).toBe(1);
    expect(tapWheelDirection(-0.05,true)).toBe(-1);
    expect(tapWheelDirection(-0.05,false)).toBe(1);
  });
  it('swipe up advances several steps, down reverses, with 32px detents', () => {
    expect(swipeWheelSteps(200,178)).toBe(0);
    expect(swipeWheelSteps(200,168)).toBe(1);
    expect(swipeWheelSteps(200,104)).toBe(3);
    expect(swipeWheelSteps(200,264)).toBe(-2);
    expect(DRAG_SLOP_PX).toBeLessThan(32);
  });
  it('is bounded on long drags and rejects invalid coords', () => {
    expect(swipeWheelSteps(500,-900)).toBe(12);
    expect(swipeWheelSteps(0,2000)).toBe(-12);
    expect(swipeWheelSteps(NaN,150)).toBe(0);
  });
});
