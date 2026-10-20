import {describe,it,expect} from 'vitest';
import {buildHeroR02,heroR02Field} from './rockSculptR02Core';

describe('ROCK-R01 A01-R02',()=>{
  it('creates finite complete geometry',()=>{
    const m=buildHeroR02({step:0.20});
    expect(m.triangles).toBeGreaterThan(1000);
    expect(m.positions.length).toBe(m.normals.length);
    expect(m.positions.length).toBe(m.colors.length);
    expect(m.positions.length/3*2).toBe(m.uv.length);
    expect(m.positions.every(Number.isFinite)).toBe(true);
    expect(m.normals.every(Number.isFinite)).toBe(true);
    expect(m.bounds.min[1]).toBeCloseTo(-0.12,3);
  });
  it('is deterministic and reacts to authored parameters',()=>{
    const a=heroR02Field(.34,.43,.68,{seed:37});
    expect(a).toBe(heroR02Field(.34,.43,.68,{seed:37}));
    expect(a).not.toBe(heroR02Field(.34,.43,.68,{seed:52}));
    expect(a).not.toBe(heroR02Field(.34,.43,.68,{seed:37,fractureDepth:0}));
  });
});
