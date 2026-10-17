import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { isFamilyEditionPath } from '../src/core/edition';
import { BACKUP_KEY, SAVE_KEY, SETTINGS_KEY } from '../src/core/state';

const read = (path: string) => readFileSync(path, 'utf8');

describe('family edition: independent /game/ route', () => {
  it('recognises only the family URL, not the main game or lookalike paths', () => {
    for (const path of ['/Feh-Lu-We/game', '/Feh-Lu-We/game/', '/Feh-Lu-We/game/index.html']) {
      expect(isFamilyEditionPath(path, '/Feh-Lu-We/')).toBe(true);
    }
    for (const path of ['/Feh-Lu-We/', '/Feh-Lu-We/index.html', '/Feh-Lu-We/games/', '/Feh-Lu-We/gameplay', '/game/', '/Feh-Lu-We/game/other']) {
      expect(isFamilyEditionPath(path, '/Feh-Lu-We/')).toBe(false);
    }
    expect(isFamilyEditionPath('/preview/game/', '/preview/')).toBe(true);
  });

  it('preserves legacy storage keys in the full edition', () => {
    expect(SAVE_KEY).toBe('fehluwe.save');
    expect(BACKUP_KEY).toBe('fehluwe.save.prev');
    expect(SETTINGS_KEY).toBe('fehluwe.settings');
  });

  it('gates the prop, its interaction and its audio at runtime, not only the visible hit label', () => {
    const grounds = read('src/world/grounds.ts');
    expect(grounds).toMatch(/if \(!FAMILY_EDITION\) \{[\s\S]*?buildGravityBong\([\s\S]*?registerGravityBongAction\(/);
    const audio = read('src/audio/audio.ts');
    expect(audio).toContain('if (!FAMILY_EDITION) this.preloadBongRippie()');
    expect(audio).toContain("case 'bongHit': if (!FAMILY_EDITION)");
    expect(audio).toContain('if (FAMILY_EDITION || this.bongRippieLoading');
    const state = read('src/core/state.ts');
    expect(state).toContain("FAMILY_EDITION ? 'fehluwe.family' : 'fehluwe'");
  });

  it('builds two HTML entry points from one source codebase', () => {
    expect(read('vite.config.ts')).toContain("new URL('./game/index.html', import.meta.url)");
    expect(read('game/index.html')).toContain('<title>Feh Lu We — Familie-editie</title>');
    expect(read('game/index.html')).toContain('src="/src/main.ts"');
  });
});
