import { describe, it, expect } from 'vitest';
import { defaultState, give, has, type GameState } from '../src/core/state';
import {
  SOLUTIONS, submitCode, pressLantern, useOnFirePit, lightPostLantern, readFirePlate, useOnWell, openWellBox,
  placeInSlot, takeFromSlot, leaveHome, tutorialMissing, unlockWithKey, pickup, currentPuzzle, PUZZLES, viewHint,
  submitBilliard, LOCK_OPTIONS, turnWheel, wheels, openPuzzles,
} from '../src/puzzles/rules';
import { ESSENTIALS } from '../src/content/items';
import { CLUES } from '../src/content/clues';

function packedState(): GameState {
  const s = defaultState(0);
  for (const i of ESSENTIALS) give(s, i);
  return s;
}

describe('tutorial', () => {
  it('cannot leave home without essentials and names what is missing', () => {
    const s = defaultState(0);
    give(s, 'torch');
    const r = leaveHome(s);
    expect(r.ok).toBe(false);
    expect(r.msg).toMatch(/lucifers/);
    expect(s.scene).toBe('home');
    expect(tutorialMissing(s)).not.toContain('torch');
  });
  it('leaves home when packed', () => {
    const s = packedState();
    expect(leaveHome(s).ok).toBe(true);
    expect(s.scene).toBe('estate');
  });
});

describe('code locks', () => {
  it('accepts only the exact sequence and counts wrong attempts without side effects', () => {
    const s = packedState();
    expect(submitCode(s, 'drawerLock', ['kopje', 'veer', 'dennenappel']).ok).toBe(false);
    expect(s.wrong.drawerLock).toBe(1);
    expect(s.inventory.length).toBe(ESSENTIALS.length);
    expect(submitCode(s, 'drawerLock', SOLUTIONS.drawerLock).ok).toBe(true);
    expect(s.flags.drawerLockSolved).toBe(true);
    expect(s.unlocked).toContain('lock.hallDrawer');
  });
  it('every solution symbol is offered by its lock', () => {
    for (const k of ['drawerLock', 'studyLock', 'cabinetPanel'] as const) {
      for (const sym of SOLUTIONS[k]) expect(LOCK_OPTIONS[k]).toContain(sym);
    }
  });
  it('solution sequences are visible in clue texts (derivable from evidence)', () => {
    expect(CLUES['c.firePlate'].symbols).toEqual(SOLUTIONS.gardenLanterns);
    // Pool tiles read shallow→deep; the sauna board says read deep→shallow.
    expect([...CLUES['c.poolTiles'].symbols!].reverse()).toEqual(SOLUTIONS.cabinetPanel);
    // Mantel order filtered to invitation pictograms gives the drawer code.
    const pict = new Set(CLUES['c.invitation'].symbols);
    expect(CLUES['c.mantel'].symbols!.filter((x) => pict.has(x))).toEqual(SOLUTIONS.drawerLock);
  });
});

describe('keys', () => {
  it('keys are reusable and wrong keys give feedback', () => {
    const s = packedState();
    expect(unlockWithKey(s, 'door.study', 'studyKey', null).ok).toBe(false);
    give(s, 'studyKey');
    expect(unlockWithKey(s, 'door.study', 'studyKey', 'shedKey').msg).toMatch(/past hier niet/);
    expect(unlockWithKey(s, 'door.study', 'studyKey', 'studyKey').ok).toBe(true);
    expect(has(s, 'studyKey')).toBe(true);
  });
  it('pickups cannot be duplicated', () => {
    const s = packedState();
    expect(pickup(s, 'pk.x', 'crank').ok).toBe(true);
    expect(pickup(s, 'pk.x', 'crank').ok).toBe(false);
    expect(s.inventory.filter((i) => i === 'crank').length).toBe(1);
  });
});

describe('fire clearing', () => {
  it('requires kindling before matches; lantern requires fire; plate requires lantern', () => {
    const s = packedState();
    expect(useOnFirePit(s, 'matches').ok).toBe(false);
    expect(lightPostLantern(s).ok).toBe(false);
    expect(readFirePlate(s).ok).toBe(false);
    give(s, 'kindling');
    expect(useOnFirePit(s, 'kindling').ok).toBe(true);
    expect(has(s, 'kindling')).toBe(false);
    expect(useOnFirePit(s, 'matches').ok).toBe(true);
    expect(has(s, 'matches')).toBe(true); // matches are reusable
    expect(lightPostLantern(s).ok).toBe(true);
    expect(readFirePlate(s).ok).toBe(true);
    expect(s.clues).toContain('c.firePlate');
  });
  it('fire can be extinguished and relit without new kindling (no soft lock)', () => {
    const s = packedState();
    give(s, 'kindling');
    useOnFirePit(s, 'kindling');
    useOnFirePit(s, 'matches');
    useOnFirePit(s, null);
    expect(s.lit['fire.clearing']).toBe(false);
    expect(useOnFirePit(s, 'matches').ok).toBe(true);
  });
});

describe('garden lanterns (complete attempt, F08)', () => {
  it('gives identical feedback for correct and wrong partial inputs; evaluates only the full attempt', () => {
    const a = packedState(), b = packedState();
    const ra = pressLantern(a, 'maan'), rb = pressLantern(b, 'zon');
    expect(ra.result).toBe('progress');
    expect(rb.result).toBe('progress');
    expect(ra.outcome.msg).toBe(rb.outcome.msg); // no prefix leak
    pressLantern(b, 'maan');
    expect(pressLantern(b, 'blad').result).toBe('wrong');
    expect(b.seq.gardenLanterns).toEqual([]);
    expect(b.wrong.gardenLanterns).toBe(1);
  });
  it('solves with Maan, Blad, Zon and opens the lower cabinet lock', () => {
    const s = packedState();
    pressLantern(s, 'maan');
    expect(pressLantern(s, 'blad').result).toBe('progress');
    expect(pressLantern(s, 'zon').result).toBe('solved');
    expect(s.unlocked).toContain('lock.cabinetLower');
  });
});

describe('cabinet wheels (physical manipulation)', () => {
  it('starts on the untransformed mosaic reading and opens only on the deep→shallow order', () => {
    const s = packedState();
    expect(wheels(s)).toEqual(['cirkel', 'driehoek', 'golf', 'ruit']);
    const target = SOLUTIONS.cabinetPanel;
    for (let i = 0; i < 4; i++) {
      let guard = 0;
      while (wheels(s)[i] !== target[i] && guard++ < 4) turnWheel(s, i);
    }
    expect(s.flags.cabinetPanelSolved).toBe(true);
    expect(s.open['cab.upper']).toBe(true);
    expect(turnWheel(s, 0).msg).toMatch(/vast/);
    expect(wheels(s)).toEqual(target);
  });
  it('a save solved with the old panel stays solved', () => {
    const s = packedState();
    submitCode(s, 'cabinetPanel', SOLUTIONS.cabinetPanel);
    expect(wheels(s)).toEqual(SOLUTIONS.cabinetPanel);
  });
});

describe('guidance (F06) and hint discovery', () => {
  it('the shed beat stays open until both kindling AND token are owned', () => {
    const s = packedState();
    leaveHome(s);
    for (const f of ['drawerLockSolved', 'studyLockSolved']) s.flags[f] = true;
    give(s, 'shedKey');
    give(s, 'kindling');
    expect(currentPuzzle(s)?.id).toBe('p3.shed');
    useOnFirePit(s, 'kindling'); // kindling consumed still counts
    expect(currentPuzzle(s)?.id).toBe('p3.shed');
    give(s, 'token');
    expect(currentPuzzle(s)?.id).toBe('p4.fire');
    placeInSlot(s, 'left', 'token'); // token in a niche still counts as owned
    expect(currentPuzzle(s)?.id).toBe('p4.fire');
  });
  it('hint menu offers discovered unsolved puzzles, not only the first global one', () => {
    const s = packedState();
    leaveHome(s);
    s.clues.push('c.poolTiles');
    const ids = openPuzzles(s).map((p) => p.id);
    expect(ids).toContain('p1.drawer');
    expect(ids).toContain('p6.cabinet');
    expect(ids).not.toContain('p7.well');
  });
});

describe('well', () => {
  it('explains missing crest and still works when crest arrives later', () => {
    const s = packedState();
    expect(useOnWell(s, null).msg).toMatch(/zwengel/);
    give(s, 'crank');
    expect(useOnWell(s, 'crank').ok).toBe(true);
    const r = useOnWell(s, null);
    expect(r.ok).toBe(false);
    expect(r.msg).toMatch(/wapenschild/);
    give(s, 'crest');
    expect(useOnWell(s, null).ok).toBe(true);
    expect(has(s, 'cottageKey')).toBe(true);
    expect(has(s, 'fragment')).toBe(true);
    expect(openWellBox(s).ok).toBe(false); // empty, nothing duplicated
  });
});

describe('cottage slots', () => {
  it('wrong placement is recoverable', () => {
    const s = packedState();
    give(s, 'token');
    give(s, 'crest');
    placeInSlot(s, 'left', 'crest');
    expect(placeInSlot(s, 'right', 'token').ok).toBe(false);
    expect(s.flags.cottageSolved).toBeFalsy();
    takeFromSlot(s, 'left');
    takeFromSlot(s, 'right');
    expect(has(s, 'token') && has(s, 'crest')).toBe(true);
    placeInSlot(s, 'left', 'token');
    expect(placeInSlot(s, 'right', 'crest').ok).toBe(true);
    expect(s.flags.cottageSolved).toBe(true);
  });
  it('swapping directly returns the previous item', () => {
    const s = packedState();
    give(s, 'token');
    give(s, 'crest');
    placeInSlot(s, 'left', 'crest');
    placeInSlot(s, 'left', 'token');
    expect(has(s, 'crest')).toBe(true);
  });
});

describe('optional billiard panel', () => {
  it('validates the ball pattern', () => {
    const s = packedState();
    expect(submitBilliard(s, [0, 5, 7, 8]).ok).toBe(false);
    expect(submitBilliard(s, [8, 0, 5]).ok).toBe(true);
  });
});

describe('full progression', () => {
  it('the intended route reaches the ending and hints advance in order', () => {
    const s = defaultState(0);
    for (const i of ESSENTIALS) pickup(s, `pk.${i}`, i);
    expect(currentPuzzle(s)?.id).toBe('p0.home');
    leaveHome(s);
    expect(currentPuzzle(s)?.id).toBe('p1.drawer');
    expect(unlockWithKey(s, 'door.front', 'frontKey', null).ok).toBe(true);
    submitCode(s, 'drawerLock', SOLUTIONS.drawerLock);
    pickup(s, 'pk.studyKey', 'studyKey');
    unlockWithKey(s, 'door.study', 'studyKey', null);
    submitCode(s, 'studyLock', SOLUTIONS.studyLock);
    pickup(s, 'pk.shedKey', 'shedKey');
    unlockWithKey(s, 'door.shed', 'shedKey', null);
    pickup(s, 'pk.kindling', 'kindling');
    pickup(s, 'pk.token', 'token');
    expect(currentPuzzle(s)?.id).toBe('p4.fire');
    useOnFirePit(s, 'kindling');
    useOnFirePit(s, 'matches');
    lightPostLantern(s);
    readFirePlate(s);
    for (const l of SOLUTIONS.gardenLanterns) pressLantern(s, l);
    pickup(s, 'pk.crank', 'crank');
    for (let i = 0; i < 4; i++) while (wheels(s)[i] !== SOLUTIONS.cabinetPanel[i]) turnWheel(s, i);
    pickup(s, 'pk.crest', 'crest');
    useOnWell(s, 'crank');
    useOnWell(s, null);
    unlockWithKey(s, 'door.cottage', 'cottageKey', null);
    expect(currentPuzzle(s)?.id).toBe('p8.cottage');
    placeInSlot(s, 'left', 'token');
    placeInSlot(s, 'right', 'crest');
    expect(currentPuzzle(s)).toBeNull();
    expect(viewHint(s, 'p8.cottage')).toBe(1);
    expect(viewHint(s, 'p8.cottage')).toBe(2);
    expect(viewHint(s, 'p8.cottage')).toBe(3);
    expect(viewHint(s, 'p8.cottage')).toBe(3);
  });
  it('every required puzzle has three escalating hints', () => {
    for (const p of PUZZLES) {
      expect(p.hints).toHaveLength(3);
      for (const h of p.hints) expect(h.length).toBeGreaterThan(10);
    }
  });
});
