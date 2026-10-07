// DEV-03 footstep cadence: steps follow real speed, independent of frame rate; no steps while turning on the spot.
import { describe, it, expect } from 'vitest';
import { Gait, cadence } from '../src/player/gait';

/** Walk at speed v for `secs` at `hz` frames per second (optional frame-time jitter); returns the step times. */
function walk(v: number, secs: number, hz: number, jitter = 0, g = new Gait()) {
  const times: number[] = [];
  let t = 0, k = 0;
  while (t < secs) {
    const dt = (1 / hz) * (1 + (jitter ? Math.sin(k++ * 12.9898) * jitter : 0));
    t += dt;
    if (g.update(dt, v * dt)) times.push(t);
  }
  return times;
}

describe('footstep cadence (gait.ts)', () => {
  it('normal walk is an adult walking rhythm, not a trot: ~1.9–2.0 steps/s at 3.2 m/s', () => {
    const n = walk(3.2, 20, 60).length / 20;
    expect(n).toBeGreaterThan(1.8);
    expect(n).toBeLessThan(2.1);
    // the old fixed 0.62 m stride gave 3.2 / 0.62 = 5.2 steps/s
    expect(n).toBeLessThan(3.2 / 0.62 / 2.4);
  });
  it('running is quicker but still a run, not a machine gun (~2.5 steps/s at 5 m/s)', () => {
    const n = walk(5.0, 20, 60).length / 20;
    expect(n).toBeGreaterThan(2.3);
    expect(n).toBeLessThan(2.8);
  });
  it('the same rhythm at 20, 30, 60, 120 and 144 fps, and with uneven frame times', () => {
    const ref = walk(3.2, 30, 60).length;
    for (const hz of [20, 30, 120, 144]) expect(Math.abs(walk(3.2, 30, hz).length - ref)).toBeLessThanOrEqual(1);
    expect(Math.abs(walk(3.2, 30, 60, 0.6).length - ref)).toBeLessThanOrEqual(1);
  });
  it('even spacing (no double taps) at a steady walk', () => {
    const t = walk(3.2, 10, 60);
    const gaps = t.slice(2).map((v, i) => v - t[i + 1]);
    for (const d of gaps) expect(Math.abs(d - 1 / cadence(3.2))).toBeLessThan(0.03);
  });
  it('turning on the spot or nudging against a wall makes no steps', () => {
    expect(walk(0, 10, 60).length).toBe(0);
    expect(walk(0.3, 10, 60).length).toBe(0);
  });
  it('starting: the first footfall about a quarter cycle in, not instantly', () => {
    const t = walk(3.2, 2, 60);
    expect(t[0]).toBeGreaterThan(0.08);
    expect(t[0]).toBeLessThan(0.3);
  });
  it('stopping mid-stride plants the trailing foot once, softly; a stop right after a step does not', () => {
    const g = new Gait();
    let t = 0;
    const evs: { t: number; settle: boolean; gain: number }[] = [];
    const run = (v: number, secs: number) => { for (let i = 0; i < secs * 60; i++) { t += 1 / 60; const e = g.update(1 / 60, v / 60); if (e) evs.push({ t, settle: e.settle, gain: e.gain }); } };
    run(3.2, 1.4); // ends mid-stride
    const before = evs.length;
    run(0, 1);
    const settles = evs.slice(before).filter((e) => e.settle);
    expect(settles.length).toBeLessThanOrEqual(1);
    if (settles.length) expect(settles[0].gain).toBeLessThan(evs[0].gain);
    expect(evs.slice(before).filter((e) => !e.settle).length).toBe(0);
  });
  it('slower walking (half stick) is slower and longer-spaced, never faster than a walk', () => {
    const slow = walk(1.6, 20, 60).length / 20, fast = walk(3.2, 20, 60).length / 20;
    expect(slow).toBeLessThan(fast);
    expect(slow).toBeGreaterThan(1.3);
  });
});
