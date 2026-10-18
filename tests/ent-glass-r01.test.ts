import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { OPENINGS } from '../src/slice/placement';
import { PORTALS, estateRooms } from '../src/world/roomdefs';

describe('ENT-GLASS-R01 double glass doors between vestibule and hall', () => {
  const manor = readFileSync('src/world/manor.ts', 'utf8');
  const doors = readFileSync('src/interactions/props.ts', 'utf8');

  it('matches a 2.4m opening with two equal 1.2m leaves meeting at X90', () => {
    expect(manor).toContain("openings: [{ at: 90, w: 2.4, h: 2.7 }]");
    expect(manor).toContain("id: 'door.entranceHall', x: 88.8, z: 84, dir: 'x+', width: 1.2, height: 2.7");
    expect(manor).toContain("pair: { x: 91.2, z: 84, dir: 'x-', swing: 1 }");
    expect(88.8 + 1.2).toBeCloseTo(91.2 - 1.2, 6);
    expect(OPENINGS.find(o => o.id === 'vest-hall')?.w).toBe(2.4);
  });

  it('reuses the persistent interaction and a shared collision/open state', () => {
    expect(manor).toContain("id: 'door.entranceHall'");
    expect(manor).toContain("style: 'foyer-glass'");
    expect(doors).toContain("style?: 'panel' | 'plank' | 'glass' | 'foyer-glass'");
    expect(doors).toContain("if (o.style === 'glass' || o.style === 'foyer-glass')");
    expect(doors).toContain("const pair = o.pair ?");
    expect(doors).toContain("const pcol = leafCollider");
    expect(doors).toContain("const seamOverlap = o.style === 'foyer-glass' && o.pair ? 0.024 : 0;");
  });

  it('sees hall geometry through shut glass but keeps it as a door portal', () => {
    const p = PORTALS.find(p => p.a === 'vestibule' && p.b === 'hall')!;
    expect(p.kind).toBe('door');
    expect(p.door).toBe('door.entranceHall');
    expect(p.seeThrough).toBe(true);
    const rooms = estateRooms();
    expect(rooms.visible('vestibule', () => false).has('hall')).toBe(true);
    expect(rooms.relevant('vestibule', () => false).has('hall')).toBe(false);
  });

  it('keeps the ornamental profiles and two-sided handles on the leaves', () => {
    expect(doors).toContain("const insetW = o.width * 0.38");
    expect(doors).toContain("for (const side of [-1, 1])");
    expect(doors).toContain("const handleX = o.width - 0.145");
    expect(manor).toContain("frameColor: '#302b29'");
  });
});
