import { describe, expect, it } from 'vitest';
import { defaultState, parseSave } from '../src/core/state';
import { boslustDigits, setBoslustDigits, turnBoslustWheel } from '../src/puzzles/boslustDials';
import { openCipherCover, submitDigits } from '../src/puzzles/rules';

describe('BOSLUST R03 world/panel wheel shared state', () => {
  const ready = () => {
    const s = defaultState();
    s.flags.routeRestored = true;
    s.inventory.push('cipherStrip');
    expect(openCipherCover(s).ok).toBe(true);
    return s;
  };
  it('begins at 0000 and blocks turning until the cover opens', () => {
    const s=defaultState();
    expect(boslustDigits(s)).toEqual([0,0,0,0]);
    expect(turnBoslustWheel(s,0)).toBeNull();
    expect(setBoslustDigits(s,[2,4,1,3])).toBe(false);
  });
  it('changes only selected wheel, wraps 9↔0, and rejects invalid indices', () => {
    const s=ready();
    expect(setBoslustDigits(s,[9,4,1,3])).toBe(true);
    expect(turnBoslustWheel(s,0)).toBe(0);
    expect(turnBoslustWheel(s,1,-1)).toBe(3);
    expect(boslustDigits(s)).toEqual([0,3,1,3]);
    expect(turnBoslustWheel(s,-1)).toBeNull();
    expect(turnBoslustWheel(s,4)).toBeNull();
    expect(setBoslustDigits(s,[2,4,12,3])).toBe(false);
    expect(boslustDigits(s)).toEqual([0,3,1,3]);
  });
  it('persists the exact number draft and does not reset on wrong code', () => {
    const s=ready();
    setBoslustDigits(s,[2,4,1,4]);
    expect(submitDigits(s,boslustDigits(s)).ok).toBe(false);
    expect(boslustDigits(s)).toEqual([2,4,1,4]);
    const copy=parseSave(JSON.stringify(s))!;
    expect(boslustDigits(copy)).toEqual([2,4,1,4]);
    expect(turnBoslustWheel(copy,3,-1)).toBe(3);
    expect(submitDigits(copy,boslustDigits(copy)).ok).toBe(true);
    expect(copy.flags.boslustOpen).toBe(true);
    expect(copy.open['door.boslust']).toBe(true);
    expect(turnBoslustWheel(copy,0)).toBeNull();
  });
  it('treats bad saved numbers as zero without changing unrelated dials', () => {
    const s=ready();
    s.dials['boslust.wheel.0']=Infinity;
    s.dials['boslust.wheel.1']=-1;
    s.dials['boslust.wheel.2']=2.5;
    s.dials['plate.example']=4;
    expect(boslustDigits(s)).toEqual([0,0,0,0]);
    setBoslustDigits(s,[1,2,3,4]);
    expect(s.dials['plate.example']).toBe(4);
  });
});
