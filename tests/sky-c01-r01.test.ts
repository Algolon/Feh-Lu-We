import { describe, it, expect } from 'vitest';
import { cloudFragment, CLOUD_VARIANTS, CLOUD_LAYOUT, CLOUD_SHOULDERS } from '../src/world/cloudPrototypes';

// SKY-C01-R01: the A clouds drew thin broken lines along the cull bounds because fwidth() ran inside
// candidateGroup()'s early-return branches, where screen derivatives are undefined on real GPUs.

/** GLSL function bodies by name (top-level definitions only). */
function functions(src: string) {
  const out = new Map<string, string>();
  const head = /^[ \t]*(?:float|vec2|vec3|vec4|void|mat2)\s+(\w+)\s*\([^)]*\)\s*\{/gm;
  for (let m; (m = head.exec(src));) {
    let depth = 1, i = head.lastIndex;
    while (depth && i < src.length) { if (src[i] === '{') depth++; else if (src[i] === '}') depth--; i++; }
    out.set(m[1], src.slice(head.lastIndex, i - 1));
  }
  return out;
}
const DERIVATIVE = /\b(fwidth|dFdx|dFdy|texture2D|texture|textureProj)\s*\(/;
/** Functions that run in non-uniform control flow: any with a conditional return, plus everything they call. */
function nonUniform(src: string) {
  const fns = functions(src), bad = new Set<string>();
  for (const [name, body] of fns) if (/\bif\s*\([^;{]*\)\s*return\b/.test(body) || (body.match(/\breturn\b/g) ?? []).length > 1) bad.add(name);
  for (let grew = true; grew;) {
    grew = false;
    for (const name of [...bad]) for (const callee of fns.keys()) if (!bad.has(callee) && new RegExp(`\\b${callee}\\s*\\(`).test(fns.get(name)!)) { bad.add(callee); grew = true; }
  }
  return { fns, bad };
}
function derivativeViolations(src: string) {
  const { fns, bad } = nonUniform(src);
  return [...bad].filter(n => DERIVATIVE.test(fns.get(n)!));
}

describe('SKY-C01-R01 derivative safety', () => {
  it('takes no derivatives or implicit-LOD texture lookups in non-uniform control flow, for every cloud variant', () => {
    for (const v of CLOUD_VARIANTS) expect(derivativeViolations(cloudFragment(v)), v).toEqual([]);
    // The culled candidate path really is non-uniform, so the guard is checking the right functions.
    const { bad } = nonUniform(cloudFragment('procedural'));
    expect([...bad]).toEqual(expect.arrayContaining(['candidateGroup', 'candidateShape', 'shoulder']));
  });
  it('detects the SKY-C01 regression shape (fwidth inside the culled candidate)', () => {
    const src = cloudFragment('procedural').replace('return vec3(max(distance, CLOUD_OUTSIDE), height, plane);',
      'float aa = max(fwidth(distance), 0.004);\n  return vec3(smoothstep(-aa, aa, distance), height, plane);');
    expect(derivativeViolations(src)).toEqual(['candidateShape']);
    const masks = cloudFragment('masks').replace('textureGrad(uCloudAtlas,(cell+uv)/vec2(4.0,2.0),pdx*scale,pdy*scale)', 'texture2D(uCloudAtlas,(cell+uv)/vec2(4.0,2.0))');
    expect(masks).not.toBe(cloudFragment('masks'));
    expect(derivativeViolations(masks)).toEqual(['candidateShape']);
  });
  it('antialiases coverage once, from cloudShape, in uniform flow', () => {
    for (const v of ['procedural', 'masks'] as const) {
      const { fns, bad } = nonUniform(cloudFragment(v));
      expect(bad.has('cloudShape') || bad.has('candidateCoverage')).toBe(false);
      expect(fns.get('cloudShape')).toMatch(/result\.x = candidateCoverage\(result\.x\);/);
    }
    expect(functions(cloudFragment('procedural')).get('candidateCoverage')).toMatch(/fwidth\(distance\)/);
    expect(functions(cloudFragment('masks')).get('candidateShape')).toMatch(/textureGrad\(/);
  });
});

// Mirror of candidateShape's contour distance. The source assertions below pin it to the shader text.
const PROC = cloudFragment('procedural');
const OUTSIDE = Number(PROC.match(/const float CLOUD_OUTSIDE = (-?[\d.]+);/)![1]);
const [, BX, BYLO, BYHI] = PROC.match(/if \(abs\(p\.x\)>([\d.]+) \|\| p\.y< (-[\d.]+) \|\| p\.y>([\d.]+)\) return/)!.map(Number);
const FACING = Number(PROC.match(/if \(facing < ([\d.]+)\) return/)![1]);
function distance(px: number, py: number, id: number) {
  py += 0.018 * Math.sin(px * 16 + id * 2.7) + 0.008 * Math.sin(px * 31 - id);
  px += 0.012 * Math.sin(py * 13 + id);
  const envelope = Math.sqrt(Math.max(0, 1 - px * px));
  let top = 0.09;
  const a = CLOUD_SHOULDERS[id];
  for (let j = 0; j < 4; j++) { const q = (px - a[j * 3]) / a[j * 3 + 2]; top += a[j * 3 + 1] * Math.exp(-q * q); }
  top *= envelope;
  const base = (-0.12 + 0.025 * Math.sin(px * 5 + id) + 0.014 * Math.sin(px * 12 - id)) * envelope;
  return Math.min(top - py, py - base, 1 - Math.abs(px));
}

describe('SKY-C01-R01 continuous coverage across the cull bounds', () => {
  it('mirror matches the shader formulas', () => {
    for (const line of ['p.y += 0.018 * sin(p.x * 16.0 + id * 2.7) + 0.008 * sin(p.x * 31.0 - id);', 'p.x += 0.012 * sin(p.y * 13.0 + id);',
      'float envelope = sqrt(max(0.0, 1.0 - p.x*p.x));', 'float top = 0.09;', 'top *= envelope;',
      'float base = (-0.12 + 0.025*sin(p.x*5.0+id) + 0.014*sin(p.x*12.0-id)) * envelope;',
      'float distance = min(min(top-p.y, p.y-base), 1.0-abs(p.x));', 'return vec3(max(distance, CLOUD_OUTSIDE), height, plane);',
      'float shoulder(float x, float center, float width) { float q=(x-center)/width; return exp(-q*q); }'])
      expect(PROC).toContain(line);
    expect(CLOUD_SHOULDERS).toHaveLength(8);
    expect([OUTSIDE, BX, BYLO, BYHI, FACING]).toEqual([-0.1, 1.13, -0.63, 0.78, 0.55]);
  });
  it('every cull bound lies below CLOUD_OUTSIDE, so culled and evaluated neighbours return the same constant', () => {
    for (let id = 0; id < 8; id++) {
      let worst = -Infinity;
      for (let i = 0; i <= 4000; i++) {
        const t = i / 4000, x = BX * (2 * t - 1), y = BYLO + (BYHI - BYLO) * t;
        worst = Math.max(worst, distance(BX, y, id), distance(-BX, y, id), distance(x, BYHI, id), distance(x, BYLO, id));
      }
      expect(worst, `cloud ${id}`).toBeLessThan(OUTSIDE - 0.01);
    }
  });
  it('the directional (facing) cull lies wholly outside each local cull rectangle', () => {
    for (const [az, el, size, aspect, angle] of CLOUD_LAYOUT) {
      const a = az * Math.PI / 180, e = el * Math.PI / 180;
      const c = [Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)];
      const r0 = [c[2], 0, -c[0]], rl = Math.hypot(r0[0], r0[2]), right = [r0[0] / rl, 0, r0[2] / rl];
      const up = [c[1] * right[2] - c[2] * right[1], c[2] * right[0] - c[0] * right[2], c[0] * right[1] - c[1] * right[0]];
      const s = Math.sqrt(1 - FACING * FACING);
      for (let i = 0; i < 720; i++) {
        const k = i / 720 * 2 * Math.PI, d = [0, 1, 2].map(j => c[j] * FACING + s * (Math.cos(k) * right[j] + Math.sin(k) * up[j]));
        const dot = (u: number[], v: number[]) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
        const px = dot(d, right) / aspect / FACING / size, py = dot(d, up) / FACING / size;
        const x = Math.cos(angle) * px + Math.sin(angle) * py, y = -Math.sin(angle) * px + Math.cos(angle) * py; // GLSL mat2 is column-major
        expect(Math.abs(x) > BX || y < BYLO || y > BYHI).toBe(true);
      }
    }
  });
});
