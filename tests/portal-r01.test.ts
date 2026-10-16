import { describe, expect, it } from 'vitest';
import { PORTALS, ROOMS, estateRooms } from '../src/world/roomdefs';
import { OPENINGS } from '../src/slice/placement';

describe('PORTAL-R01 hal-keuken shortcut', () => {
  it('has one permanently open portal with no door state or puzzle gate', () => {
    const matches = PORTALS.filter((p) => (p.a === 'hall' && p.b === 'kitchen') || (p.a === 'kitchen' && p.b === 'hall'));
    expect(matches).toEqual([{ a: 'hall', b: 'kitchen', kind: 'arch', door: undefined, seeThrough: false }]);
    const g = estateRooms();
    expect(g.visible('hall', () => false, 1).has('kitchen')).toBe(true);
    expect(g.visible('kitchen', () => false, 1).has('hall')).toBe(true);
    expect(g.relevant('hall', () => false).has('kitchen')).toBe(true);
  });

  it('keeps the opening beyond the main stair and inside the shared floor-level wall', () => {
    const opening = OPENINGS.find((o) => o.id === 'hall-kitchen');
    expect(opening).toMatchObject({ rooms: ['hall', 'kitchen'], axis: 'z', f: 95, at: 96.55, w: 1.65 });
    expect(opening!.at - opening!.w / 2).toBeGreaterThan(95.5);
    expect(opening!.at + opening!.w / 2).toBeLessThan(98);
    const hall = ROOMS.find((r) => r.id === 'hall')!, kitchen = ROOMS.find((r) => r.id === 'kitchen')!;
    expect(hall.x1).toBe(kitchen.x0);
    expect(hall.z1).toBeGreaterThan(opening!.at + opening!.w / 2);
    expect(kitchen.z0).toBeLessThan(opening!.at - opening!.w / 2);
  });

  it('does not alter the sealed basement door connection', () => {
    expect(PORTALS.find((p) => p.a === 'lobby' && p.b === 'bstair')).toMatchObject({ kind: 'door', door: 'door.basement' });
  });
});
