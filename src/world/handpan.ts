// Asset 01: the handpan on its walnut floor stand (FLW-S3-035 Handpanstandaard) in the music / gravity-bong corner.
//
// Reference: FLW-S3-035 is AMBIGUOUS in the FLW library (two recovered sheets, no selected winner). The stand follows
// only what both sheets share — ≈ 70 cm, oiled walnut, four splayed legs pinched at a pegged central hub, a rail under
// the instrument, dark felt pads on upturned arm tips — and does not pick either sheet's specific joinery.
//
// Construction (stand-local three.js space, y up, origin = floor centre under the instrument):
// - The top shell is ONE authored polar surface: a lenticular dome with the raised ding, eight elliptical tone fields
//   (zig-zag sizes like a real pan: largest at the front) each pressed in with a hammered crease and a convex dimple,
//   a faint hammer texture, and nitrided-steel colour breakup baked into vertex colours (keepColor).
// - The bottom shell is turned with its Gu opening (an inward collar closed by a dark recessed cap: no see-through).
// - A rim bead covers the shell seam. The felt pads lie on the bottom shell's tangent plane at the contact radius, so
//   the instrument visibly rests on them: no floating, no intersection (handpan.test.ts checks the clearances).
// - Legs are swept rounded-square sections along an interpolating curve, ending under the pads; the rail and the hub
//   are turned. Each leg carries a little seeded irregularity (hand-carved, not machined).
// Decorative only: no sound, interaction, puzzle or save state. Shared art materials only (the tight metal highlight for the nitrided
// steel, timber, upholstery for felt): batched into the caller's chunk, no new material or draw call.
import * as THREE from 'three';
import type { Ctx } from './arch';
import { Asm, artMats, lathe, softBox, projectUV, arcPts } from './artkit';
import { mulberry32 } from '../core/rng';

const GEOS = new Map<string, THREE.BufferGeometry>();
function cache(id: string, make: () => THREE.BufferGeometry) {
  let g = GEOS.get(id);
  if (!g) { g = make(); g.userData.shared = true; GEOS.set(id, g); }
  return g;
}

/** Dimensions in metres. The instrument is a standard Ø 53 cm pan; the stand puts its rim at ≈ 72 cm. */
export const HANDPAN = {
  R: 0.265, // shell radius at the seam
  top: 0.112, // top shell rise above the seam plane (without the ding)
  bottom: 0.104, // bottom shell depth below the seam plane
  gu: 0.06, // Gu opening radius
  dingR: 0.062,
  dingH: 0.016,
  rimY: 0.725, // seam plane above the floor
  notes: 8,
  noteRing: 0.168, // tone-field centre radius
  padR: 0.205, // felt pad contact radius on the bottom shell
  padT: 0.014, // felt thickness
  legs: 4,
  railR: 0.19, // rail centre radius
  railY: 0.58, // rail centre height
} as const;

const P = HANDPAN;
const smooth = THREE.MathUtils.smoothstep;
const gauss = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));

// ------------------------------------------------------------------------------------------------ shell profiles
/** Top shell rise above the seam plane at radius r (dome only; tone fields and the ding are added on top). */
export function topRise(r: number) {
  const u = 1 - (r / P.R) ** 2;
  return u <= 0 ? 0 : P.top * u ** 0.68;
}
/** Bottom shell height relative to the seam plane at radius r (negative: below it). */
export function bottomDrop(r: number) {
  const u = 1 - (r / P.R) ** 2;
  return u <= 0 ? 0 : -P.bottom * u ** 0.62;
}
/** d(bottomDrop)/dr: the bottom shell's slope (positive: rising toward the rim). */
export function bottomSlope(r: number) {
  const u = 1 - (r / P.R) ** 2;
  return P.bottom * 0.62 * u ** -0.38 * ((2 * r) / P.R ** 2);
}
/** The felt pad's contact point (radius, height above the floor) and the shell's outward normal there (r, y). */
export function padContact() {
  const r = P.padR, y = P.rimY + bottomDrop(r), s = bottomSlope(r), l = Math.hypot(s, 1);
  return { r, y, n: [s / l, -1 / l] as [number, number] };
}

/** Tone field layout: azimuth, centre radius and half-axes (radial a, tangential b). Rank 0 = the lowest (largest). */
export function toneFields() {
  // a real pan climbs in a zig-zag from the front: right, left, right, ... ending at the back
  const order = [0, 1, 7, 2, 6, 3, 5, 4];
  return order.map((slot, rank) => {
    const s = 1 - 0.26 * (rank / (P.notes - 1));
    return { az: (slot / P.notes) * Math.PI * 2 - Math.PI / 2, rho: P.noteRing + 0.008 * (1 - s), a: 0.045 * s, b: 0.052 * s, rank };
  });
}

// cheap deterministic value noise (hammer marks, patina): no texture, no shader cost
function hash(i: number, j: number) { const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v); }
function noise(x: number, y: number) {
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(i, j), hash(i + 1, j), ux), THREE.MathUtils.lerp(hash(i, j + 1), hash(i + 1, j + 1), ux), uy);
}

// nitrided steel: deep warm bronze-brown under the shared metal highlight (ceramic: tight, neutral), cooler heat-tint patches,
// worn lighter dimple tops, darker hammered creases
const NITRIDE = new THREE.Color('#6e5038'), HEAT = new THREE.Color('#545154'), WORN = new THREE.Color('#a07a50'), CREASE = new THREE.Color('#33271f');

/** Ring radii of the top shell grid: dense through the tone-field band, a few steps in the ding and at the seam. */
function topRings() {
  const out: number[] = [];
  const seg = (r0: number, r1: number, n: number) => { for (let i = 1; i <= n; i++) out.push(r0 + ((r1 - r0) * i) / n); };
  seg(0, 0.074, 6); seg(0.074, 0.25, 23); seg(0.25, P.R, 3);
  return out;
}
const TOP_SEG = 84;

/** The authored top shell (seam at y = 0): one indexed surface, smooth normals, baked colour. */
export function topShellGeometry() {
  const rings = topRings(), fields = toneFields(), n = TOP_SEG;
  const pos: number[] = [], col: number[] = [], idx: number[] = [];
  const c = new THREE.Color(), base = new THREE.Vector3(), nrm = new THREE.Vector3();
  const vert = (r: number, th: number) => {
    const x = Math.cos(th) * r, z = Math.sin(th) * r;
    // base dome and its analytic normal (from the radial slope)
    const y0 = topRise(r), dr = 1e-4, slope = (topRise(Math.min(P.R, r + dr)) - topRise(Math.max(0, r - dr))) / (2 * dr);
    base.set(x, y0, z);
    nrm.set(r > 1e-6 ? (-slope * x) / r : 0, 1, r > 1e-6 ? (-slope * z) / r : 0).normalize();
    // ding: a raised cap with a shallow pressed moat around it
    let d = 0, crease = 0, worn = 0;
    if (r < P.dingR) d += P.dingH * (1 - (r / P.dingR) ** 2) ** 1.4;
    d -= 0.0028 * gauss(r, P.dingR * 1.12, 0.011);
    crease = Math.max(crease, gauss(r, P.dingR * 1.08, 0.012));
    worn = Math.max(worn, r < P.dingR ? 1 - r / P.dingR : 0);
    // tone fields: shallow flattened field, hammered crease around it, convex dimple in the middle
    for (const f of fields) {
      const cx = Math.cos(f.az) * f.rho, cz = Math.sin(f.az) * f.rho;
      const ux = Math.cos(f.az), uz = Math.sin(f.az), px = x - cx, pz = z - cz;
      const u = (px * ux + pz * uz) / f.a, v = (-px * uz + pz * ux) / f.b;
      const e = Math.hypot(u, v);
      if (e > 1.7) continue;
      const s = f.a / 0.045; // the larger notes are pressed a little deeper
      if (e < 1) d -= 0.0032 * s * Math.sqrt(1 - e * e);
      d -= 0.0024 * gauss(e, 1.0, 0.2);
      d += 0.0011 * gauss(e, 1.32, 0.16); // the shoulder the hammer pushes up outside the crease
      if (e < 0.44) d += 0.0068 * s * (1 - (e / 0.44) ** 2) ** 1.3;
      crease = Math.max(crease, gauss(e, 1.0, 0.22));
      worn = Math.max(worn, e < 0.44 ? 1 - e / 0.44 : 0, e < 1 ? 0.3 * (1 - e) : 0);
    }
    // hammer texture everywhere on the playing surface, fading out at the seam
    d += 0.0005 * (noise(x / 0.019 + 3.1, z / 0.019 - 7.3) - 0.5) * 2 * (1 - smooth(r, 0.235, 0.26));
    base.addScaledVector(nrm, d);
    pos.push(base.x, base.y, base.z);
    // colour: nitride base, cool heat-tint patches, darker toward the seam, worn dimples, dark creases
    const heat = smooth(noise(x / 0.09 + 11, z / 0.09 + 5), 0.45, 0.85) * 0.55;
    c.copy(NITRIDE).lerp(HEAT, heat).multiplyScalar(0.92 + 0.12 * noise(x / 0.035, z / 0.035));
    c.lerp(WORN, 0.55 * worn).lerp(CREASE, 0.55 * crease).multiplyScalar(1 - 0.2 * smooth(r, 0.2, 0.265));
    col.push(c.r, c.g, c.b);
  };
  vert(0, 0); // pole
  for (const r of rings) for (let i = 0; i < n; i++) vert(r, (i / n) * Math.PI * 2);
  for (let i = 0; i < n; i++) idx.push(0, 1 + ((i + 1) % n), 1 + i);
  for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < n; i++) {
    const a = 1 + j * n + i, b = 1 + j * n + ((i + 1) % n), c2 = a + n, d2 = b + n;
    idx.push(a, b, d2, a, d2, c2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  g.userData.keepColor = true;
  return g;
}

/** Bottom shell (seam at y = 0) from the seam bead down to the Gu, its collar turned in and closed by a dark cap. */
export function bottomShellGeometry() {
  const gy = bottomDrop(P.gu), pts: [number, number][] = [[0.001, gy + 0.024], [0.046, gy + 0.024], [0.05, gy + 0.008], [0.054, gy + 0.001], [P.gu, gy]];
  for (let i = 1; i <= 10; i++) { const r = P.gu + ((0.262 - P.gu) * i) / 10; pts.push([r, bottomDrop(r)]); }
  pts[pts.length - 1][1] = -0.004;
  const g = lathe(pts, 40);
  const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), r = Math.hypot(x, z);
    // the Gu interior reads dark; the underside a touch darker than the top (it never sees the sky)
    const inside = r < P.gu - 0.002 ? 0.35 : 1;
    c.copy(NITRIDE).lerp(HEAT, 0.35 * noise(x / 0.08 + 2, z / 0.08)).multiplyScalar(inside * (0.8 + 0.1 * smooth(y, -0.1, -0.01)));
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.userData.keepColor = true;
  return g;
}

/** The seam bead: a small rolled band around the joint of the two shells. */
export function rimGeometry() {
  return lathe([[0.256, -0.013], [0.265, -0.0165], [0.274, -0.0135], [0.2785, -0.005], [0.277, 0.0025], [0.27, 0.007], [0.26, 0.0068], [0.256, 0.005]], 56);
}

// ------------------------------------------------------------------------------------------------ stand
/** Leg centreline in its own vertical plane: [radius, height] from the foot to the pad. The tip meets the pad squarely. */
export function legPath(): [number, number][] {
  const k = padContact(), t = P.padT - 0.003; // the arm runs 3 mm into the felt: glued, not floating
  const tip: [number, number] = [k.r + k.n[0] * t, k.y + k.n[1] * t];
  const pre: [number, number] = [tip[0] + k.n[0] * 0.03, tip[1] + k.n[1] * 0.03];
  return [[0.264, -0.014], [0.246, 0.058], [0.204, 0.155], [0.134, 0.26], [0.074, 0.335], [0.052, 0.385], [0.06, 0.432],
    [0.1, 0.49], [0.15, 0.54], [P.railR, P.railY], [0.214, 0.607], pre, tip];
}
/** Section (tangential width, in-plane depth) of the leg at height y: flared foot, slimmer waist, swelling at the rail. */
function legSection(y: number): [number, number] {
  const foot = 1 + 0.12 * (1 - smooth(y, 0.0, 0.07));
  const w = THREE.MathUtils.lerp(0.048, 0.04, smooth(y, 0.05, 0.36)) + 0.006 * gauss(y, P.railY, 0.04) - 0.008 * smooth(y, 0.6, 0.66);
  const d = THREE.MathUtils.lerp(0.058, 0.048, smooth(y, 0.05, 0.36)) + 0.005 * gauss(y, P.railY, 0.04) - 0.01 * smooth(y, 0.6, 0.66);
  return [w * foot, d * foot];
}

const LEG_SIDES = 12, LEG_STEPS = 22, SUPER = 3.2;
/** One carved leg at azimuth `az`, swept along `legPath`, with a seeded irregularity. Colour = occlusion only. */
export function legGeometry(az: number, seed: number) {
  const rnd = mulberry32(seed), j = () => (rnd() - 0.5) * 2;
  const path = legPath().map(([r, y], i, all) => {
    const fixed = i === 0 || i >= all.length - 4; // the foot height, the rail joint and the pad end stay exact
    return new THREE.Vector3(r + (fixed ? 0 : 0.004 * j()), y + (fixed ? 0 : 0.004 * j()), 0);
  });
  const curve = new THREE.CatmullRomCurve3(path, false, 'centripetal');
  const side = new THREE.Vector3(0, 0, 1); // the leg plane is (radial x, up y): its side axis is z
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], col: number[] = [], idx: number[] = [];
  const P0 = new THREE.Vector3(), T = new THREE.Vector3(), N = new THREE.Vector3(), q = new THREE.Vector3(), nn = new THREE.Vector3();
  const bulge = 1 + 0.03 * j(), ph = rnd() * 6;
  let s = 0, last = curve.getPoint(0);
  const ring = (t: number) => {
    curve.getPoint(t, P0); curve.getTangent(t, T);
    s += P0.distanceTo(last); last = P0.clone();
    N.crossVectors(side, T).normalize(); // in-plane, perpendicular to the leg
    const [w0, d0] = legSection(P0.y), wob = bulge * (1 + 0.035 * Math.sin(s * 23 + ph));
    const hw = (w0 * wob) / 2, hd = (d0 * wob) / 2;
    for (let i = 0; i <= LEG_SIDES; i++) {
      const a = (i / LEG_SIDES) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      const cx = Math.sign(ca) * Math.abs(ca) ** (2 / SUPER), cy = Math.sign(sa) * Math.abs(sa) ** (2 / SUPER);
      q.copy(P0).addScaledVector(side, cx * hw).addScaledVector(N, cy * hd);
      // superellipse normal: gradient of |x/hw|^p + |y/hd|^p
      const gx = Math.sign(cx) * Math.abs(cx) ** (SUPER - 1) / hw, gy = Math.sign(cy) * Math.abs(cy) ** (SUPER - 1) / hd;
      nn.set(0, 0, 0).addScaledVector(side, gx).addScaledVector(N, gy).normalize();
      pos.push(q.x, Math.max(0, q.y), q.z); nor.push(nn.x, nn.y, nn.z);
      uv.push(s, (i / LEG_SIDES) * 2 * (hw + hd) * 2 * 2); // grain along the leg (1 repeat / m), 0.5 m across
      const ao = (0.7 + 0.3 * smooth(q.y, 0, 0.14)) * (1 - 0.14 * gauss(q.y, 0.385, 0.05)) * (0.94 + 0.08 * noise(i * 0.9 + seed, s * 9));
      col.push(ao, ao, ao);
    }
  };
  for (let k = 0; k <= LEG_STEPS; k++) ring(k / LEG_STEPS);
  const W = LEG_SIDES + 1;
  for (let k = 0; k < LEG_STEPS; k++) for (let i = 0; i < LEG_SIDES; i++) {
    const a = k * W + i, b = a + 1, c = a + W, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  // end caps (the foot sole and the arm end under the felt)
  for (const [k, sgn] of [[0, -1], [LEG_STEPS, 1]] as const) {
    curve.getPoint(k / LEG_STEPS, P0); curve.getTangent(k / LEG_STEPS, T);
    const centre = pos.length / 3;
    pos.push(P0.x, Math.max(0, P0.y), P0.z); nor.push(T.x * sgn, T.y * sgn, T.z * sgn); uv.push(0, 0); col.push(0.7, 0.7, 0.7);
    for (let i = 0; i < LEG_SIDES; i++) {
      const a = k * W + i;
      if (sgn > 0) idx.push(centre, a + 1, a); else idx.push(centre, a, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.rotateY(-az); // plane x → azimuth az (three: +x toward +z for positive az is a negative turn about y)
  g.userData.keepColor = true;
  return g;
}

/** The rail under the instrument: a rounded rectangle section turned around the axis (legs pass through it). */
function railGeometry() {
  const r0 = P.railR - 0.013, r1 = P.railR + 0.013, y0 = P.railY - 0.015, y1 = P.railY + 0.015, k = 0.006;
  const loop: [number, number][] = [
    ...arcPts(r1 - k, y0 + k, k, -Math.PI / 2, 0, 1), ...arcPts(r1 - k, y1 - k, k, 0, Math.PI / 2, 1),
    ...arcPts(r0 + k, y1 - k, k, Math.PI / 2, Math.PI, 1), ...arcPts(r0 + k, y0 + k, k, Math.PI, Math.PI * 1.5, 1),
  ];
  loop.push(loop[0]);
  return projectUV(lathe(loop, 36), 1, 'x');
}
/** Central hub: an eight-sided turned block with a small cap, legs housed in its faces. */
function hubGeometry() {
  return projectUV(lathe([[0.001, 0.328], [0.05, 0.328], [0.061, 0.338], [0.064, 0.352], [0.064, 0.418], [0.06, 0.43], [0.046, 0.436], [0.04, 0.437], [0.04, 0.446], [0.032, 0.452], [0.001, 0.452]], 8).rotateY(Math.PI / 8), 1, 'y');
}

// ------------------------------------------------------------------------------------------------ assembly
/** The highest point of the instrument above the stand's feet (the ding crown). */
export const HANDPAN_HEIGHT = P.rimY + P.top + P.dingH;

/**
 * Handpan on its stand, origin = floor point under the instrument's axis, yaw = plan heading of the front note.
 * Returns the instrument's top height above `y0` (for a collider).
 */
export function buildHandpan(c: Ctx, x: number, y0: number, z: number, yaw: number) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('handpan');
  // Geometry is authored in three.js local space; azimuth az points along three (cos az, 0, sin az). Asm offsets are
  // plan-local (lz forward = three −z), hence −sin for lz, and ry = az turns a part's +x onto that azimuth.
  // stand: four legs on the diagonals, the rail, the hub, a peg through the hub between each pair of legs
  for (let i = 0; i < P.legs; i++) {
    const az = Math.PI / 4 + (i * Math.PI * 2) / P.legs;
    a.add(M.timber, '#8a5634', cache('hp_leg' + i, () => legGeometry(az, 35 + i * 7)), 0, 0, 0);
    const pegAz = az + Math.PI / 4;
    a.add(M.timber, '#6a4024', cache('hp_peg', () => projectUV(new THREE.CylinderGeometry(0.0105, 0.0115, 0.02, 8).rotateZ(Math.PI / 2), 1, 'x')),
      Math.cos(pegAz) * 0.064, 0.388, -Math.sin(pegAz) * 0.064, { ry: pegAz });
  }
  a.add(M.timber, '#7e4e2f', cache('hp_rail', railGeometry), 0, 0, 0);
  a.add(M.timber, '#71452a', cache('hp_hub', hubGeometry), 0, 0, 0);
  // felt pads on the shell's tangent plane at the contact radius
  const k = padContact(), tilt = Math.atan2(k.n[0], -k.n[1]);
  for (let i = 0; i < P.legs; i++) {
    const az = Math.PI / 4 + (i * Math.PI * 2) / P.legs, h = P.padT / 2;
    const r = k.r + k.n[0] * h, y = k.y + k.n[1] * h;
    // local frame: pad length runs radially (x), tilted up toward the rim by the shell's slope
    a.add(M.upholstery, '#2f2a26', cache('hp_pad', () => projectUV(softBox(0.064, P.padT, 0.046, 0.005, 1, 1), 0.25)),
      Math.cos(az) * r, y, -Math.sin(az) * r, { ry: az, rz: tilt });
  }
  // instrument
  a.add(M.ceramic, '#ffffff', cache('hp_top', topShellGeometry), 0, P.rimY, 0);
  a.add(M.ceramic, '#ffffff', cache('hp_bottom', bottomShellGeometry), 0, P.rimY, 0);
  a.add(M.ceramic, '#4a3a2e', cache('hp_rim', rimGeometry), 0, P.rimY, 0);
  a.end();
  return HANDPAN_HEIGHT;
}
