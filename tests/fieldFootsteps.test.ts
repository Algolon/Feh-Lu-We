import { describe, expect, it } from 'vitest';
import { FIELD_FOOTSTEPS_MP3, FIELD_FOOTSTEP_CLIPS } from '../src/audio/fieldFootsteps';

const fnv = (text: string) => {
  let hash = 2166136261;
  for (const char of text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return hash;
};

describe('licensed field-recorded outdoor footsteps', () => {
  it('contains the exact validated compressed MP3 bank (no corrupted base64)', () => {
    expect(FIELD_FOOTSTEPS_MP3.length).toBe(12220);
    expect(fnv(FIELD_FOOTSTEPS_MP3)).toBe(2396974964);
    const bytes = Uint8Array.from(atob(FIELD_FOOTSTEPS_MP3), c => c.charCodeAt(0));
    expect(bytes.length).toBe(9164);
    expect(String.fromCharCode(...bytes.subarray(0, 3))).toBe('ID3');
    // MP3 frames after the ID3 header (the content is not a placeholder or a URL).
    expect(bytes.subarray(200).some(b => b !== 0)).toBe(true);
  });

  it('has separate field-recorded clips on grass and dirt, in bounds, without overlap', () => {
    const grass = FIELD_FOOTSTEP_CLIPS.grass;
    const dirt = FIELD_FOOTSTEP_CLIPS.dirt;
    expect(grass.length).toBeGreaterThanOrEqual(2);
    expect(dirt.length).toBeGreaterThanOrEqual(2);
    const intervals = [...grass, ...dirt];
    let previousEnd = 0;
    for (const [start, duration] of intervals) {
      expect(start).toBeGreaterThanOrEqual(previousEnd + 0.04);
      expect(duration).toBeGreaterThanOrEqual(0.3);
      expect(start + duration).toBeLessThan(2.2); // compressed bank duration ~2.18 seconds
      previousEnd = start + duration;
    }
  });
});
