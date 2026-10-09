// DEV-04B-R chair family: the back is one connected frame. The construction audit compares axis-aligned bounds, which
// overlap for tilted parts even when they do not touch (the top rail once floated ~4 cm behind forward-leaning posts),
// so this test checks contact on the real transformed geometry: every back rail / slat end lies inside both back
// posts, carver arms reach the post, Windsor spindles meet the seat and the bow.
import { describe, it, expect, beforeAll } from 'vitest';
import * as THREE from 'three';

// a minimal 2D canvas so the art-kit textures can be built under node (nothing is drawn or uploaded)
beforeAll(() => {
  const ctx: unknown = new Proxy({}, {
    get: (_t, k) => (k === 'measureText' ? () => ({ width: 0 }) : () => new Proxy({}, { get: () => () => undefined })),
    set: () => true,
  });
  (globalThis as unknown as { document: unknown }).document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) };
});

interface Part { geo: THREE.BufferGeometry; m: THREE.Matrix4; size: THREE.Vector3 }
async function buildChair(style: 'ladder' | 'spindle' | 'upholstered' | 'carver') {
  const { chair } = await import('../src/world/furniture');
  const parts: Part[] = [];
  const b = { add: (_mat: unknown, geo: THREE.BufferGeometry, m: THREE.Matrix4) => { geo.computeBoundingBox(); parts.push({ geo, m: m.clone(), size: geo.boundingBox!.getSize(new THREE.Vector3()) }); } };
  const c = { b, chunk: 't', col: { addCircle: () => {}, addBox: () => {}, addBoxC: () => {} } };
  chair(c as never, 0, 0, 0, 0, '#aa5533', true, style);
  return parts;
}
/** Does any vertex of `p` lie inside the (slightly grown) box of `q`? (q's own frame) */
function touches(p: Part, q: Part, tol = 0.004) {
  const inv = q.m.clone().invert(), box = q.geo.boundingBox!.clone().expandByScalar(tol), pos = p.geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(p.m).applyMatrix4(inv); if (box.containsPoint(v)) return true; }
  return false;
}
const centre = (p: Part) => p.geo.boundingBox!.getCenter(new THREE.Vector3()).applyMatrix4(p.m);

describe('DEV-04B-R chair backs are connected', () => {
  for (const style of ['ladder', 'upholstered', 'carver'] as const) {
    it(`${style}: every back rail / slat meets both back posts`, async () => {
      const parts = await buildChair(style);
      const posts = parts.filter((p) => Math.abs(p.size.y - 0.95) < 1e-3 && p.size.x < 0.05);
      expect(posts.length).toBe(2);
      // horizontal timber members of the back: wide in x, thin in z, above the seat
      const members = parts.filter((p) => p.size.x > 0.3 && p.size.z < 0.05 && p.size.y < 0.1 && centre(p).y > 0.5);
      expect(members.length).toBeGreaterThanOrEqual(2);
      for (const m of members) for (const post of posts) expect(touches(m, post), `member at y ${centre(m).y.toFixed(3)} vs post x ${centre(post).x.toFixed(2)}`).toBe(true);
      if (style === 'carver') {
        const arms = parts.filter((p) => p.size.z > 0.3 && p.size.x < 0.06 && Math.abs(centre(p).y - 0.7) < 0.01);
        expect(arms.length).toBe(2);
        for (const arm of arms) expect(posts.some((post) => touches(arm, post))).toBe(true);
      }
    });
  }
  it('spindle (Windsor): spindles meet the seat and the bow, posts meet the bow', async () => {
    const parts = await buildChair('spindle');
    const bow = parts.find((p) => p.size.x > 0.35 && p.size.y > 0.15 && p.size.y < 0.25)!;
    expect(bow).toBeTruthy();
    const seat = parts.find((p) => p.size.x > 0.43 && p.size.z > 0.4)!;
    const uprights = parts.filter((p) => p.size.x < 0.03 && p.size.z < 0.03 && p.size.y > 0.1 && centre(p).y > 0.5);
    expect(uprights.length).toBe(7); // two posts, five spindles
    const R = 0.19, tube = 0.016, inv = bow.m.clone().invert();
    for (const u of uprights) {
      expect(touches(u, seat, 0.012), `upright x ${centre(u).x.toFixed(2)} to the seat`).toBe(true);
      // the top of each upright reaches the bow's tube (distance to the torus centre line ≤ its radius + 4 mm)
      const pos = u.geo.attributes.position, v = new THREE.Vector3();
      let best = Infinity;
      for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(u.m).applyMatrix4(inv); best = Math.min(best, Math.hypot(Math.hypot(v.x, v.y) - R, v.z)); }
      expect(best, `upright x ${centre(u).x.toFixed(2)} to the bow`).toBeLessThan(tube + 0.004);
    }
  });
});
