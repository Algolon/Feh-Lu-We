import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { GRASS_R04_MP3, GRASS_R04_CLIPS, DIRT_PATH_GAIN } from '../src/audio/grassR04';
import { FIELD_FOOTSTEP_CLIPS } from '../src/audio/fieldFootsteps';

describe('footsteps R04 mix / single-contact grass', () => {
  it('ships the exact edited three-contact grass MP3 without base64 damage', () => {
    expect(GRASS_R04_MP3.length).toBe(7228);
    const file = Uint8Array.from(atob(GRASS_R04_MP3), c => c.charCodeAt(0));
    expect(file.byteLength).toBe(5420);
    expect(new TextDecoder('ascii').decode(file.subarray(0, 3))).toBe('ID3');
    expect(createHash('sha256').update(file).digest('hex'))
      .toBe('7c571c18fd97fb3fe6fd61d047db82f0a4123750517584d89d825a0dfed1d78d');
  });

  it('schedules three isolated grass impacts, each shorter than a natural walking step interval', () => {
    expect(GRASS_R04_CLIPS).toHaveLength(3);
    let previousEnd = 0;
    for (const [start, duration] of GRASS_R04_CLIPS) {
      expect(start - previousEnd).toBeGreaterThanOrEqual(0.06);
      expect(duration).toBeGreaterThanOrEqual(0.2);
      expect(duration).toBeLessThanOrEqual(0.3);
      previousEnd = start + duration;
    }
    expect(previousEnd).toBeLessThan(1.235);
  });

  it('makes dirt -30% quieter without replacing the approved dirt clips', () => {
    expect(DIRT_PATH_GAIN).toBeCloseTo(0.31 * 0.7, 8);
    expect(DIRT_PATH_GAIN / 0.31).toBeCloseTo(0.7, 8);
    expect(FIELD_FOOTSTEP_CLIPS.dirt).toEqual([[1.084, 0.44], [1.592, 0.46]]);
  });
});
