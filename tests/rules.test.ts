import { describe, it, expect } from 'vitest';
import { defaultState, give, has, type GameState } from '../src/core/state';
import {
  SOLUTIONS, submitCode, pressLantern, useOnFirePit, lightPostLantern, readFirePlate, leaveHome, tutorialMissing, unlockWithKey, pickup,
  currentPuzzle, PUZZLES, viewHint, submitBilliard, LOCK_OPTIONS, turnWheel, wheels, openPuzzles, placePiece, takePiece, slotContents, loosePieces,
  placeSolved, openBasement, openCipherCover, submitDigits, turnPlate, pullPlateLever, plateRotations, threadNext, activeThread, threadDone, owns,
  type PlaceKind,
} from '../src/puzzles/rules';
import { ESSENTIALS, SEALS } from '../src/content/items';
import { CLUES } from '../src/content/clues';
import { SERVICE_ANSWER, CATALOG_ANSWER, CONSOLE_ANSWER, CIPHER_CODE, PLATES } from '../src/content/canon';

function packedState(): GameState {
  const s = defaultState(0);
  for (const i of ESSENTIALS) give(s, i);
  return s;
}
/** Arrived at the estate with the hall drawer opened and its contents taken. */
function openedDrawer(): GameState {
  const s = packedState();
  leaveHome(s);
  submitCode(s, 'drawerLock', SOLUTIONS.drawerLock);
  pickup(s, 'pk.ledger', 'ledger');
  pickup(s, 'pk.shedKey', 'shedKey');
  return s;
}
const fill = (s: GameState, k: PlaceKind, answer: Record<string, string>) => {
  let last = { ok: false, msg: '' };
  for (const [slot, piece] of Object.entries(answer)) if (!placeSolved(s, k)) last = placePiece(s, k, slot, piece);
  return { ok: placeSolved(s, k), msg: last.msg };
};

// thread solvers (the intended in-world steps, as rule calls)
function threadA(s: GameState) {
  fill(s, 'svc', SERVICE_ANSWER);
  pickup(s, 'pk.consKey', 'consKey');
  unlockWithKey(s, 'lock.door.consWest', 'consKey', null);
  for (let guard = 0; guard < 20 && !s.flags.cabinetPanelSolved; guard++) {
    const w = wheels(s);
    const i = w.findIndex((x, j) => x !== SOLUTIONS.cabinetPanel[j]);
    turnWheel(s, i);
  }
  pickup(s, 'pk.tableSeal', 'tableSeal');
}
function threadB(s: GameState) {
  fill(s, 'cat', CATALOG_ANSWER);
  pickup(s, 'pk.studyKey', 'studyKey');
  unlockWithKey(s, 'lock.door.study', 'studyKey', null);
  submitCode(s, 'studyLock', SOLUTIONS.studyLock);
  pickup(s, 'pk.archiveSeal', 'archiveSeal');
}
function threadC(s: GameState) {
  unlockWithKey(s, 'lock.door.shed', 'shedKey', null);
  pickup(s, 'pk.kindling', 'kindling');
  pickup(s, 'pk.journal', 'journal');
  useOnFirePit(s, 'kindling');
  useOnFirePit(s, 'matches');
  lightPostLantern(s);
  readFirePlate(s);
  for (const sym of SOLUTIONS.gardenLanterns) pressLantern(s, sym);
  pickup(s, 'pk.trailSeal', 'trailSeal');
}
function convergence(s: GameState) {
  expect(openBasement(s).ok).toBe(true);
  expect(fill(s, 'con', CONSOLE_ANSWER).ok).toBe(true);
  pickup(s, 'pk.cipherStrip', 'cipherStrip');
  expect(openCipherCover(s).ok).toBe(true);
  expect(submitDigits(s, CIPHER_CODE).ok).toBe(true);
  PLATES.forEach((p, i) => { while (plateRotations(s)[i] !== p.target) turnPlate(s, i); });
  expect(pullPlateLever(s).ok).toBe(true);
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
    expect(s.open['hall.drawer']).toBe(true);
  });
  it('every solution symbol is offered by its lock', () => {
    for (const k of ['drawerLock', 'studyLock'] as const) for (const sym of SOLUTIONS[k]) expect(LOCK_OPTIONS[k]).toContain(sym);
  });
  it('solution sequences are visible in clue texts (derivable from evidence)', () => {
    expect(CLUES['c.firePlate'].symbols).toEqual(SOLUTIONS.gardenLanterns);
    // Pool tiles read shallow→deep; the sauna board numbers deep→shallow.
    expect([...CLUES['c.poolTiles'].symbols!].reverse()).toEqual(SOLUTIONS.cabinetPanel);
    expect(CLUES['c.mantel'].diagram).toBe('mantel');
  });
});

describe('keys and pickups', () => {
  it('keys are reusable and wrong keys give feedback', () => {
    const s = packedState();
    give(s, 'shedKey');
    expect(unlockWithKey(s, 'lock.door.study', 'studyKey', 'shedKey').ok).toBe(false);
    expect(unlockWithKey(s, 'lock.door.shed', 'shedKey', null).ok).toBe(true);
    expect(has(s, 'shedKey')).toBe(true);
  });
  it('pickups cannot be duplicated', () => {
    const s = packedState();
    expect(pickup(s, 'pk.kindling', 'kindling').ok).toBe(true);
    expect(pickup(s, 'pk.kindling', 'kindling').ok).toBe(false);
    expect(s.inventory.filter((i) => i === 'kindling').length).toBe(1);
  });
});

describe('thread C: fire and lanterns', () => {
  it('requires kindling before matches; lantern requires fire; plate requires lantern', () => {
    const s = packedState();
    expect(useOnFirePit(s, 'matches').ok).toBe(false);
    expect(lightPostLantern(s).ok).toBe(false);
    expect(readFirePlate(s).ok).toBe(false);
    give(s, 'kindling');
    expect(useOnFirePit(s, 'kindling').ok).toBe(true);
    expect(useOnFirePit(s, 'matches').ok).toBe(true);
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
  it('lanterns: identical feedback for partial inputs, judged on the full attempt; solving opens the stone', () => {
    const s = packedState();
    const a = pressLantern(s, 'zon'), b = pressLantern(s, 'maan');
    expect(a.result).toBe('progress');
    expect(b.result).toBe('progress');
    expect(pressLantern(s, 'blad').result).toBe('wrong');
    expect(s.seq.gardenLanterns).toEqual([]);
    for (const sym of SOLUTIONS.gardenLanterns) pressLantern(s, sym);
    expect(s.flags.lanternsSolved).toBe(true);
    expect(s.open['lantern.stone']).toBe(true);
  });
});

describe('thread A: service plan + cabinet wheels', () => {
  it('judges the service plan only when all three tags hang, with no prefix oracle', () => {
    const s = openedDrawer();
    const [first] = Object.entries(SERVICE_ANSWER);
    const r1 = placePiece(s, 'svc', first[0], first[1]);
    const s2 = openedDrawer();
    const wrongPiece = Object.values(SERVICE_ANSWER).find((p) => p !== first[1])!;
    const r2 = placePiece(s2, 'svc', first[0], wrongPiece);
    expect(r1.msg).toBe(r2.msg); // a correct and a wrong first placement read the same
    expect(fill(s2, 'svc', { tafel: 'koud', provisie: 'bloem', serre: 'warm' }).ok).toBe(false);
    expect(s2.wrong.svc).toBe(1);
    expect(fill(s2, 'svc', SERVICE_ANSWER).ok).toBe(true);
    expect(s2.open['kitchen.hatch']).toBe(true);
  });
  it('pieces are always recoverable and swap cleanly', () => {
    const s = openedDrawer();
    placePiece(s, 'svc', 'tafel', 'warm');
    placePiece(s, 'svc', 'serre', 'warm'); // moving a tag empties its old slot
    expect(slotContents(s, 'svc')).toEqual({ tafel: null, provisie: null, serre: 'warm' });
    expect(takePiece(s, 'svc', 'serre').ok).toBe(true);
    expect(loosePieces(s, 'svc').sort()).toEqual(['bloem', 'koud', 'warm']);
  });
  it('wheels start on the untransformed mosaic reading and open only on the deep→shallow order', () => {
    const s = packedState();
    expect(wheels(s)).toEqual([...CLUES['c.poolTiles'].symbols!]);
    expect(wheels(s)).not.toEqual(SOLUTIONS.cabinetPanel);
    for (let guard = 0; guard < 20 && !s.flags.cabinetPanelSolved; guard++) {
      const i = wheels(s).findIndex((x, j) => x !== SOLUTIONS.cabinetPanel[j]);
      turnWheel(s, i);
    }
    expect(s.flags.cabinetPanelSolved).toBe(true);
    expect(s.open['cab.upper']).toBe(true);
  });
});

describe('thread B: catalogue', () => {
  it('derives each book socket from emblem → room → tab', () => {
    expect(CATALOG_ANSWER).toEqual({ rond: 'ster', punt: 'varen', vierkant: 'koffer' });
    const s = openedDrawer();
    expect(fill(s, 'cat', { rond: 'varen', punt: 'ster', vierkant: 'koffer' }).ok).toBe(false);
    expect(fill(s, 'cat', CATALOG_ANSWER).ok).toBe(true);
    expect(s.open['library.desk']).toBe(true);
  });
});

describe('convergence', () => {
  it('the basement door names the missing seals and opens with all three', () => {
    const s = openedDrawer();
    threadA(s);
    const r = openBasement(s);
    expect(r.ok).toBe(false);
    expect(r.msg).toMatch(/vierkante/);
    expect(r.msg).toMatch(/blad/);
    threadB(s);
    threadC(s);
    expect(openBasement(s).ok).toBe(true);
    expect(s.open['door.basement']).toBe(true);
  });
  it('the route console accepts only seals the player carries and returns them on take-back', () => {
    const s = openedDrawer();
    threadA(s); threadB(s); threadC(s);
    openBasement(s);
    expect(placePiece(s, 'con', 'water', 'tableSeal').ok).toBe(true);
    expect(has(s, 'tableSeal')).toBe(false);
    expect(owns(s, 'tableSeal')).toBe(true);
    takePiece(s, 'con', 'water');
    expect(has(s, 'tableSeal')).toBe(true);
    expect(fill(s, 'con', { muren: 'tableSeal', water: 'archiveSeal', paden: 'trailSeal' }).ok).toBe(false);
    expect(SEALS.every((x) => owns(s, x))).toBe(true);
    expect(fill(s, 'con', CONSOLE_ANSWER).ok).toBe(true);
    expect(placeSolved(s, 'con')).toBe(true);
    expect(s.clues).toContain('c.routeRestored');
  });
  it('the cipher cover stays sealed until the route is restored and the strip is held', () => {
    const s = openedDrawer();
    expect(openCipherCover(s).ok).toBe(false);
    expect(submitDigits(s, CIPHER_CODE).ok).toBe(false);
    expect(s.flags.boslustOpen).toBeFalsy();
  });
  it('the cipher decodes to 2413 and wrong digits give neutral feedback', () => {
    expect(CIPHER_CODE).toEqual([2, 4, 1, 3]);
    const s = openedDrawer();
    threadA(s); threadB(s); threadC(s);
    openBasement(s);
    fill(s, 'con', CONSOLE_ANSWER);
    pickup(s, 'pk.cipherStrip', 'cipherStrip');
    expect(openCipherCover(s).ok).toBe(true);
    const w1 = submitDigits(s, [2, 4, 1, 4]), w2 = submitDigits(s, [9, 9, 9, 9]);
    expect(w1.msg).toBe(w2.msg); // near-misses are not revealed
    expect(submitDigits(s, CIPHER_CODE).ok).toBe(true);
  });
  it('the lever is judged on all three plates', () => {
    const s = packedState();
    s.flags.boslustOpen = true;
    expect(pullPlateLever(s).ok).toBe(false);
    PLATES.forEach((p, i) => { while (plateRotations(s)[i] !== p.target) turnPlate(s, i); });
    expect(pullPlateLever(s).ok).toBe(true);
    expect(s.open['door.gathering']).toBe(true);
  });
});

describe('branch orders and guidance', () => {
  const orders: [string, (s: GameState) => void][][] = [
    [['A', threadA], ['B', threadB], ['C', threadC]],
    [['C', threadC], ['B', threadB], ['A', threadA]],
    [['B', threadB], ['C', threadC], ['A', threadA]],
  ];
  for (const order of orders) {
    it(`threads in order ${order.map((o) => o[0]).join(' → ')} all reach the finale`, () => {
      const s = openedDrawer();
      for (const [id, run] of order) {
        expect(threadDone(s, id as 'A')).toBe(false);
        run(s);
        expect(threadDone(s, id as 'A')).toBe(true);
      }
      expect(activeThread(s)).toBe('D');
      convergence(s);
      expect(currentPuzzle(s)?.id).toBe('d.finale');
    });
  }
  it('a tracked thread drives the objective; finished threads fall back to automatic', () => {
    const s = openedDrawer();
    s.track = 'C';
    expect(activeThread(s)).toBe('C');
    expect(threadNext(s, 'C').text).toMatch(/schuur/i);
    threadC(s);
    expect(activeThread(s)).not.toBe('C');
  });
  it('hint menu offers discovered unsolved puzzles across threads', () => {
    const s = openedDrawer();
    s.clues.push('c.hostingPlan', 'c.libraryPlan');
    const ids = openPuzzles(s).map((p) => p.id);
    expect(ids).toContain('a.service');
    expect(ids).toContain('b.catalog');
    expect(ids).not.toContain('d.cipher');
  });
  it('the hall drawer comes first; its hints only reveal the answer at level 3', () => {
    const s = packedState();
    leaveHome(s);
    expect(currentPuzzle(s)?.id).toBe('p1.drawer');
    const p = PUZZLES.find((q) => q.id === 'p1.drawer')!;
    expect(p.hints[0]).not.toMatch(/Veer.*Dennenappel/);
    expect(p.hints[1]).not.toMatch(/Veer.*Dennenappel/);
    expect(p.hints[2]).toMatch(/Veer – Dennenappel – Kopje/);
    expect(viewHint(s, 'p1.drawer')).toBe(1);
  });
  it('every required puzzle has three escalating hints', () => {
    for (const p of PUZZLES) {
      expect(p.hints).toHaveLength(3);
      for (const h of p.hints) expect(h.length).toBeGreaterThan(10);
    }
  });
  it('the hidden cipher hint gives 2413 only at the last level', () => {
    const p = PUZZLES.find((q) => q.id === 'd.cipher')!;
    expect(p.hints[0]).not.toMatch(/2.*4.*1.*3/);
    expect(p.hints[1]).not.toMatch(/2 – 4 – 1 – 3/);
    expect(p.hints[2]).toMatch(/2 – 4 – 1 – 3/);
  });
});

describe('optional billiard panel', () => {
  it('validates the ball pattern', () => {
    const s = packedState();
    expect(submitBilliard(s, [0, 1]).ok).toBe(false);
    expect(submitBilliard(s, [8, 0, 5]).ok).toBe(true);
    expect(s.clues).toContain('mem.billiard.scoreboard');
  });
});
