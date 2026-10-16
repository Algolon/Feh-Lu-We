// BOSLUST-R03 — one saved four-digit combination for the world wheels and modal.
// GameState.dials is already migrated and range-checked by core/state.ts.
import type { GameState } from '../core/state';

export const BOSLUST_WHEEL_COUNT = 4;
const key = (index: number) => `boslust.wheel.${index}`;
export type BoslustDigits = [number, number, number, number];

export function boslustDigits(s: GameState): BoslustDigits {
  return [0, 1, 2, 3].map((index) => {
    const v = s.dials[key(index)];
    return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 9 ? v : 0;
  }) as BoslustDigits;
}

/** Only edits the code draft; NEVER guesses whether it unlocks. */
export function setBoslustDigits(s: GameState, digits: readonly number[]): boolean {
  if (!s.flags.boslustCover || s.flags.boslustOpen || digits.length !== BOSLUST_WHEEL_COUNT ||
    !digits.every(n => Number.isInteger(n) && n >= 0 && n <= 9)) return false;
  const before = boslustDigits(s);
  digits.forEach((n, i) => { s.dials[key(i)] = n; });
  return digits.some((n, i) => n !== before[i]);
}

/** Clockwise tap/reticle increases 0→1→…→9→0, as in the accessible panel. */
export function turnBoslustWheel(s: GameState, index: number, direction: 1 | -1 = 1): number | null {
  if (!Number.isInteger(index) || index < 0 || index >= BOSLUST_WHEEL_COUNT ||
      !s.flags.boslustCover || s.flags.boslustOpen) return null;
  const next = (boslustDigits(s)[index] + direction + 10) % 10;
  s.dials[key(index)] = next;
  return next;
}
