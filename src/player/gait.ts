// Footstep cadence (DEV-03). Steps follow a walking phase driven by the player's real horizontal speed, so the rhythm
// is that of an adult walking at the speed actually moved — not a fixed short distance or timer.
//
// Why not a fixed distance per step: the game walks at 3.2 m/s (a brisk, game-paced walk). The old 0.62 m per step
// gave 5.2 steps/s, which reads as tripping or running with very short legs. A human walking 1.4–2 m/s takes about
// 1.8–2.1 steps/s; running takes about 2.6–3. The cadence below maps game speed onto that range and the stride
// follows from it (stride = speed / cadence), so speeding up lengthens the stride as well as quickening the step.
//
// Contract:
// - frame-rate independent: the phase is integrated over dt with the speed measured from the actual displacement;
// - no steps while turning on the spot or nudging against a wall (below MIN_SPEED);
// - the first step after starting comes about a quarter cycle in (not instantly, not after a full stride);
// - stopping mid-stride plants the trailing foot once, softly (a "settle" step), unless a step just played.

/** Steps per second at a horizontal speed v (m/s). Walk 3.2 m/s → ≈ 1.95 Hz; run 5.0 m/s → ≈ 2.55 Hz. */
export function cadence(v: number) {
  return Math.min(2.8, Math.max(1.35, 0.9 + 0.33 * v));
}
/** Below this speed (m/s) feet do not sound: shuffling against a wall or the last centimetres of a stop. */
export const MIN_SPEED = 0.45;

export interface StepEvent { /** 0–1 loudness factor */ gain: number; /** alternates 0/1 (left/right) */ foot: 0 | 1; settle: boolean }

export class Gait {
  private phase = 0;
  private moving = false;
  private still = 1; // seconds below MIN_SPEED
  private sinceStep = 1;
  private foot: 0 | 1 = 0;
  private vSmooth = 0;
  /** Advance by dt with the horizontal distance moved in this step; returns a step to play, or null. */
  update(dt: number, moved: number): StepEvent | null {
    if (dt <= 0) return null;
    const v = moved / dt;
    // a light smoothing so a single short frame (collision slide, frame hitch) does not jerk the rhythm
    this.vSmooth += (v - this.vSmooth) * Math.min(1, dt * 10);
    this.sinceStep += dt;
    if (this.vSmooth < MIN_SPEED) {
      this.still += dt;
      if (this.moving && this.still > 0.12) {
        this.moving = false;
        const settle = this.phase > 0.4 && this.sinceStep > 0.28;
        this.phase = 0;
        if (settle) return this.emit(0.55, true);
      }
      return null;
    }
    if (!this.moving) {
      this.moving = true;
      // from a standstill the first footfall comes a quarter cycle in; resuming within a moment keeps the phase
      if (this.still > 0.35) this.phase = 0.72;
    }
    this.still = 0;
    this.phase += cadence(this.vSmooth) * dt;
    if (this.phase >= 1) {
      this.phase -= Math.floor(this.phase);
      return this.emit(Math.min(1.15, 0.8 + 0.08 * this.vSmooth), false);
    }
    return null;
  }
  private emit(gain: number, settle: boolean): StepEvent {
    this.sinceStep = 0;
    this.foot = this.foot ? 0 : 1;
    return { gain, foot: this.foot, settle };
  }
  reset() { this.phase = 0; this.moving = false; this.still = 1; this.sinceStep = 1; this.vSmooth = 0; }
}
