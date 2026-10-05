import { describe, it, expect } from 'vitest';
import { RoomGraph, chooseLamps } from '../src/world/rooms';

const g = new RoomGraph(
  [
    { id: 'A', name: 'A', floor: 'g', x0: 0, x1: 5, z0: 0, z1: 5, y0: 0, y1: 3 },
    { id: 'B', name: 'B', floor: 'g', x0: 5, x1: 10, z0: 0, z1: 5, y0: 0, y1: 3 },
    { id: 'C', name: 'C', floor: 'g', x0: 10, x1: 15, z0: 0, z1: 5, y0: 0, y1: 3 },
  ],
  [
    { a: 'A', b: 'B', kind: 'door', door: 'dAB' },
    { a: 'B', b: 'C', kind: 'arch' },
    { a: 'A', b: 'out', kind: 'window' },
  ],
);

describe('room/portal light relevance', () => {
  it('a lamp in B is relevant from A only while the door is open', () => {
    expect(g.relevant('A', () => true).has('B')).toBe(true);
    expect(g.relevant('A', () => false).has('B')).toBe(false);
  });
  it('relevance is one step: C is not lit from A through B', () => {
    expect(g.relevant('A', () => true).has('C')).toBe(false);
    expect(g.relevant('B', () => true).has('C')).toBe(true);
  });
  it('windows are one-way: outdoor lamps light the room, room lamps do not leak outside', () => {
    expect(g.relevant('A', () => true).has('out')).toBe(true);
    expect(g.relevant('out', () => true).has('A')).toBe(false);
  });
  it('locates rooms by plan position and height', () => {
    expect(g.roomAt(2, 1, 2)).toBe('A');
    expect(g.roomAt(7, 1, 2)).toBe('B');
    expect(g.roomAt(7, 5, 2)).toBe('out');
  });
});

describe('pooled light choice', () => {
  const c = (id: string, room: string, d: number) => ({ id, room, d });
  it('prefers the own room, is independent of view direction, keeps stable slots', () => {
    const a = chooseLamps([c('a1', 'A', 4), c('b1', 'B', 3), c('b2', 'B', 6)], 'A', [null, null], 2);
    expect(a).toContain('a1');
    expect(a).toContain('b1');
    const b = chooseLamps([c('a1', 'A', 4.2), c('b1', 'B', 2.9), c('b2', 'B', 6)], 'A', a, 2);
    expect(b).toEqual(a); // small movement: same lamps in the same slots
  });
  it('hysteresis: a held lamp is not swapped for a marginally better one', () => {
    const cur = ['x', null];
    const r = chooseLamps([c('x', 'A', 5), c('y', 'A', 4.4)], 'A', cur, 1);
    expect(r[0]).toBe('x');
    const far = chooseLamps([c('x', 'A', 9), c('y', 'A', 4.4)], 'A', cur, 1);
    expect(far[0]).toBe('y');
  });
  it('an unlit or irrelevant lamp is dropped (caller filters), freeing its slot', () => {
    const r = chooseLamps([c('y', 'A', 4)], 'A', ['x', null], 2);
    expect(r).toContain('y');
    expect(r).not.toContain('x');
  });
});
