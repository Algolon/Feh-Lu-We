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

describe('iteration 2: save validation (F12) and v3 migration', () => {
  it('drops unknown item, clue, slot and symbol ids instead of keeping them', () => {
    const s = migrate({
      version: 3, scene: 'estate',
      inventory: ['torch', 'ghostItem'], used: ['crank', '???'], clues: ['c.mantel', 'c.nope'],
      slots: { left: 'token', right: 'bogus', middle: 'crest' }, seq: { gardenLanterns: ['maan', 'xx'] },
      hints: { 'p1.drawer': 9, 'p2.study': -2 }, wrong: { drawerLock: 2.7 },
    })!;
    expect(s.inventory).toEqual(['torch']);
    expect(s.used).toEqual(['crank']);
    expect(s.clues).toEqual(['c.mantel']);
    expect(s.slots).toEqual({ left: 'token', right: null });
    expect(s.seq.gardenLanterns).toEqual(['maan']);
    expect(s.hints).toEqual({ 'p1.drawer': 3, 'p2.study': 0 });
    expect(s.wrong.drawerLock).toBe(2);
  });
  it('migrates a v2 save: progress kept, playMs becomes activeMs', () => {
    const v2 = { version: 2, scene: 'estate', inventory: ['torch', 'crest'], flags: { drawerLockSolved: true }, open: { 'door.front': true }, stats: { playMs: 123456, startedAt: 5, finishedAt: null } };
    const s = migrate(v2)!;
    expect(s.version).toBe(STATE_VERSION);
    expect(s.flags.drawerLockSolved).toBe(true);
    expect(s.open['door.front']).toBe(true);
    expect(s.inventory).toEqual(['torch', 'crest']);
    expect(s.stats.activeMs).toBe(123456);
    expect(s.stats.finishedActiveMs).toBeNull();
    expect(s.events).toEqual([]);
  });
  it('rejects out-of-bounds saved poses and non-finite stats', () => {
    const s = migrate({ version: 3, player: { estate: { x: 1e9, y: 0, z: 3, yaw: 0, pitch: 0 } }, stats: { activeMs: -5, finishedAt: 'x' } })!;
    expect(s.player.estate).toBeNull();
    expect(s.stats.activeMs).toBe(0);
    expect(s.stats.finishedAt).toBeNull();
  });
});
