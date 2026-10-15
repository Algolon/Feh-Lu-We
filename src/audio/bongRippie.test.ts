import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { BONG_RIPPIE_ASSET } from '../audio/audio';

describe('Bong Rippie reference sample', () => {
  it('is the exact user-authorized MP3 bundled with the game', () => {
    expect(BONG_RIPPIE_ASSET).toBe('audio/bong-rippie.mp3');
    const file = readFileSync(new URL('../../public/audio/bong-rippie.mp3', import.meta.url));
    expect(file.byteLength).toBe(85632);
    expect(createHash('sha256').update(file).digest('hex'))
      .toBe('40650070b15db27fcf49d8b7e497cd574dff959e54cd35e0f4040aa6763bbe88');
  });
});
