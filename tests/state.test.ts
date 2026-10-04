import { describe, it, expect } from 'vitest';
import { defaultState, parseSave, migrate, parseSettings, STATE_VERSION } from '../src/core/state';

describe('save parsing', () => {
  it('round-trips a state', () => {
    const s = defaultState(123);
    s.scene = 'estate';
    s.inventory.push('torch');
    s.open['door.x'] = true;
    s.player.estate = { x: 60, y: 0, z: 5, yaw: 0, pitch: 0 };
    const back = parseSave(JSON.stringify(s))!;
    expect(back).toEqual(s);
  });
  it('rejects garbage, future versions and broken JSON', () => {
    expect(parseSave(null)).toBeNull();
    expect(parseSave('{oops')).toBeNull();
    expect(parseSave('42')).toBeNull();
    expect(parseSave(JSON.stringify({ version: STATE_VERSION + 1 }))).toBeNull();
  });
  it('sanitises wrong field types instead of crashing', () => {
    const s = migrate({ version: 2, inventory: ['torch', 3, null, 'torch'], flags: { a: true, b: 'yes' }, player: { estate: { x: 'n', z: 1 } } })!;
    expect(s.inventory).toEqual(['torch']);
    expect(s.flags).toEqual({ a: true });
    expect(s.player.estate).toBeNull();
    expect(s.scene).toBe('home');
  });
  it('migrates v1 single player pose to per-scene poses', () => {
    const s = migrate({ version: 1, scene: 'estate', player: { x: 1, y: 0, z: 2, yaw: 0, pitch: 0 } })!;
    expect(s.version).toBe(STATE_VERSION);
    expect(s.player.estate).toEqual({ x: 1, y: 0, z: 2, yaw: 0, pitch: 0 });
  });
  it('settings clamp and default', () => {
    expect(parseSettings(null, true).quality).toBe('low');
    expect(parseSettings(null, false).quality).toBe('high');
    expect(parseSettings('{"lookSensitivity":99}', false).lookSensitivity).toBe(2.5);
    expect(parseSettings('nope', false).muted).toBe(false);
  });
});
