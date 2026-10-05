import { describe, it, expect } from 'vitest';
import { MANTEL, MANTEL_ANSWER, MANTEL_HINTS, MANTEL_TEXT, DRAWER_DIAL, mantelSlots } from '../src/content/canon';
import { SOLUTIONS, LOCK_OPTIONS, PUZZLES } from '../src/puzzles/rules';
import { CLUES } from '../src/content/clues';
import { SYMBOLS } from '../src/content/symbols';

describe('hall drawer canon (mantel → dial)', () => {
  it('the answer is exactly the brass-stand objects, left → right', () => {
    expect(MANTEL_ANSWER).toEqual(['veer', 'dennenappel', 'kopje']);
    expect(SOLUTIONS.drawerLock).toEqual(MANTEL_ANSWER);
    expect(MANTEL.filter((m) => m.stand).every((m) => m.base === 'brass')).toBe(true);
    expect(MANTEL.filter((m) => !m.stand).every((m) => (m.base as string) !== 'brass')).toBe(true);
    // non-answer objects use three DIFFERENT bases, so no second "matching" group exists
    expect(new Set(MANTEL.filter((m) => !m.stand).map((m) => m.base)).size).toBe(3);
  });
  it('every dial wheel offers all six mantel objects and nothing unrelated', () => {
    expect(LOCK_OPTIONS.drawerLock).toEqual(DRAWER_DIAL);
    expect([...DRAWER_DIAL].sort()).toEqual(MANTEL.map((m) => m.sym).sort());
    for (const s of DRAWER_DIAL) expect(SYMBOLS[s]).toBeTruthy();
  });
  it('notebook text names the objects in the same left → right order and the selection rule', () => {
    let at = -1;
    for (const m of MANTEL) {
      const name = SYMBOLS[m.sym].name.toLowerCase().replace('klok', 'klokje').replace('vaas', 'vaasje');
      const i = MANTEL_TEXT.indexOf(name, at + 1);
      expect(i).toBeGreaterThan(at);
      at = i;
    }
    expect(MANTEL_TEXT).toMatch(/messing voetje/);
    expect(CLUES['c.mantel'].text).toBe(MANTEL_TEXT);
  });
  it('invitation states the selection rule and viewing direction, without showing an unordered ring', () => {
    const inv = CLUES['c.invitation'];
    expect(inv.text).toContain('drie voorwerpen op kleine messing voetjes');
    expect(inv.text).toContain('Lees ze van links naar rechts, terwijl je voor de haard staat.');
    expect(inv.symbolsLayout).not.toBe('ring');
  });
  it('only the final hint reveals the answer, and it matches the solution', () => {
    const p = PUZZLES.find((q) => q.id === 'p1.drawer')!;
    expect(p.hints).toEqual(MANTEL_HINTS);
    const names = MANTEL_ANSWER.map((s) => SYMBOLS[s].name);
    expect(p.hints[2]).toContain(names.join(' – '));
    for (const h of p.hints.slice(0, 2)) expect(names.every((n) => h.includes(n))).toBe(false);
  });
  it('3D slots run left → right for a viewer FACING the fireplace (not just increasing z)', () => {
    for (const facing of [Math.PI / 2, -Math.PI / 2, 0, Math.PI]) {
      const slots = mantelSlots(10, 20, facing, 0.5);
      const vy = facing + Math.PI; // viewer looks at the fireplace
      const right = { x: Math.cos(vy), z: -Math.sin(vy) };
      const proj = slots.map((p) => p.x * right.x + p.z * right.z);
      for (let i = 1; i < proj.length; i++) expect(proj[i]).toBeGreaterThan(proj[i - 1]);
    }
    // the living room fireplace faces east: left → right is south → north
    const living = mantelSlots(48.9, 62, Math.PI / 2, 0.56);
    expect(living[0].z).toBeLessThan(living[5].z);
  });
});
