// DEV-04D D3 Asset Track 01 (D3-b prebuild): FLW S3 pieces for the D3-b room group, rebuilt or refined from their
// source sheets and judged in the isolated asset review (asset-review.html). NOTHING here is placed in the world:
// these builders are not called by any room. D3-b owns the final placement, in-room scale, lighting relation and
// wall-art registration; it wraps a builder with its anchor and `wallPiece` footprint at integration time.
//
// Conventions
// - Geometry is authored in the VIEWER frame: X to the viewer's right, Y up, D towards the viewer (off the wall / out of
//   the front of the piece). `toLocal` turns it into the `Asm` local frame (lx = −X, lz = D) in one 180° turn about y
//   (no winding flip).
// - Each builder takes a Batcher, a chunk and a world anchor (plan x, y, z, heading `yaw` = the piece's facing), plus a
//   presentation scale `s`. Relief depth scales with the piece (uniform scale), so a larger medallion stays a medallion.
// - Shared art materials only (artMats: timber, paint); colour is authored vertex colour (`keepColor`): no new
//   material, no texture. Every piece runs the DEV-04B construction audit under a `T01:` name, so the production
//   pieces (same FLW ids, d2props.ts) and these candidates never mix in `assetTris` while both exist.
import * as THREE from 'three';
import type { Batcher } from './kit';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Asm, artMats, projectUV, softBox, deform, bake, baseAO } from './artkit';

type V2 = [number, number];
const smooth = THREE.MathUtils.smoothstep;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const gauss = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));
const col = (c: string) => new THREE.Color(c);
const mixC = (a: string | THREE.Color, b: string | THREE.Color, t: number) => new THREE.Color(a).lerp(new THREE.Color(b), clamp01(t));
const D2R = Math.PI / 180;

/** Audit / triangle-report names of the Track 01 candidates (never the production names). */
export const T01 = (id: string) => `T01:${id}`;

// ------------------------------------------------------------------------------------------------ geometry helpers
/** Viewer frame → Asm local frame. */
function toLocal(g: THREE.BufferGeometry) { g.rotateY(Math.PI); return g; }

/** Non-indexed copy with per-face (flat) normals: the carved-facet read. */
function faceted(g: THREE.BufferGeometry) {
  const n = g.index ? g.toNonIndexed() : g;
  if (n !== g) g.dispose();
  n.deleteAttribute('normal');
  n.computeVertexNormals();
  return n;
}

/** Colour every triangle of a non-indexed geometry from its face normal (viewer frame) and centroid. */
function paintFaces(g: THREE.BufferGeometry, f: (n: THREE.Vector3, c: THREE.Vector3) => THREE.Color) {
  const p = g.attributes.position as THREE.BufferAttribute, out = new Float32Array(p.count * 3);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), m = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    n.subVectors(c, b).cross(a.clone().sub(b)).normalize();
    m.copy(a).add(b).add(c).multiplyScalar(1 / 3);
    const k = f(n, m);
    for (let j = 0; j < 3; j++) { out[(i + j) * 3] = k.r; out[(i + j) * 3 + 1] = k.g; out[(i + j) * 3 + 2] = k.b; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(out, 3));
  g.userData.keepColor = true;
  return g;
}

/**
 * A carved plate: a closed outline (viewer XY) extruded `t` thick, centred on D = 0, with a single bevel all round. The
 * bevel faces read as the cut edge (the carver's chamfer), which is where the oak shows through the stain.
 */
function plate(outline: V2[], t: number, bevel: number) {
  const s = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.85, bevelSegments: 1, curveSegments: 1, steps: 1 });
  g.translate(0, 0, -t / 2);
  return faceted(g);
}

/** Flip every triangle whose face normal points against `out(centroid)` (indexed or not). */
function orient(g: THREE.BufferGeometry, out: (c: THREE.Vector3) => THREE.Vector3) {
  const p = g.attributes.position as THREE.BufferAttribute, ix = g.index;
  const n = ix ? ix.count : p.count, at = (k: number) => (ix ? ix.getX(k) : k);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), m = new THREE.Vector3();
  for (let t = 0; t < n; t += 3) {
    a.fromBufferAttribute(p, at(t)); b.fromBufferAttribute(p, at(t + 1)); c.fromBufferAttribute(p, at(t + 2));
    const nrm = b.clone().sub(a).cross(c.clone().sub(a));
    m.copy(a).add(b).add(c).multiplyScalar(1 / 3);
    if (nrm.dot(out(m)) >= 0) continue;
    if (ix) { const k = ix.getX(t + 1); ix.setX(t + 1, ix.getX(t + 2)); ix.setX(t + 2, k); }
    else for (const attr of Object.values(g.attributes) as THREE.BufferAttribute[]) for (let j = 0; j < attr.itemSize; j++) {
      const k = attr.getComponent(t + 1, j); attr.setComponent(t + 1, j, attr.getComponent(t + 2, j)); attr.setComponent(t + 2, j, k);
    }
  }
  return g;
}
/** Make sure a viewer-frame surface faces the viewer (+D); flips the winding if it does not. */
function facingViewer(g: THREE.BufferGeometry) {
  g.computeVertexNormals();
  const n = g.attributes.normal as THREE.BufferAttribute;
  let sum = 0;
  for (let i = 0; i < n.count; i++) sum += n.getZ(i);
  if (sum < 0) {
    const idx = g.index!;
    for (let t = 0; t < idx.count; t += 3) { const b = idx.getX(t + 1); idx.setX(t + 1, idx.getX(t + 2)); idx.setX(t + 2, b); }
    g.computeVertexNormals();
  }
  return g;
}

/** Relief grid: `f(s, t)` (0…1 each) gives a viewer-frame point and its colour; returned facing the viewer. */
function reliefGrid(nu: number, nv: number, f: (s: number, t: number) => { x: number; y: number; d: number; c: THREE.Color }) {
  const pos: number[] = [], cols: number[] = [], idx: number[] = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const q = f(i / nu, j / nv);
    pos.push(q.x, q.y, q.d);
    cols.push(q.c.r, q.c.g, q.c.b);
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
    idx.push(a, b, d, a, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  g.setIndex(idx);
  facingViewer(g);
  g.userData.keepColor = true;
  return g;
}

/** Ring loft along a centre line: `ring(t)` gives the centre, the two section axes (unit) and their half-sizes. */
function loft(n: number, seg: number, ring: (t: number) => { c: THREE.Vector3; u: THREE.Vector3; v: THREE.Vector3; a: number; b: number },
  paint: (t: number, phi: number, p: THREE.Vector3) => THREE.Color, bump?: (t: number, phi: number) => number) {
  const pos: number[] = [], cols: number[] = [], idx: number[] = [], p = new THREE.Vector3();
  for (let i = 0; i <= n; i++) {
    const t = i / n, r = ring(t);
    for (let j = 0; j < seg; j++) {
      const phi = (j / seg) * Math.PI * 2, k = 1 + (bump ? bump(t, phi) : 0);
      p.copy(r.c).addScaledVector(r.u, Math.cos(phi) * r.a * k).addScaledVector(r.v, Math.sin(phi) * r.b * k);
      pos.push(p.x, p.y, p.z);
      const cc = paint(t, phi, p); cols.push(cc.r, cc.g, cc.b);
    }
  }
  // winding: the side faces must point away from the centre line whichever way the sections turn (checked on the middle
  // ring; an inverted loft is culled from the front and shows what lies behind it)
  const mid = Math.floor(n / 2), r = ring(mid / n), q = (k: number) => new THREE.Vector3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
  const a0 = q(mid * seg), c0 = q((mid + 1) * seg), b0 = q(mid * seg + 1);
  const flip = c0.clone().sub(a0).cross(b0.clone().sub(a0)).dot(a0.clone().sub(r.c)) < 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < seg; j++) {
    const a = i * seg + j, b = i * seg + ((j + 1) % seg), c = a + seg, d = b + seg;
    if (flip) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  g.userData.keepColor = true;
  return g;
}

/** Merge viewer-frame parts (position / normal / colour / uv) into one geometry. */
function mergeParts(parts: THREE.BufferGeometry[]) {
  const ps = parts.map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    if (!n.attributes.uv) n.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2));
    if (!n.attributes.color) n.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(n.attributes.position.count * 3).fill(1), 3));
    for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) n.deleteAttribute(k);
    return n;
  });
  const total = ps.reduce((s, g) => s + g.attributes.position.count, 0);
  const out = new THREE.BufferGeometry();
  for (const [k, w] of [['position', 3], ['normal', 3], ['uv', 2], ['color', 3]] as const) {
    const arr = new Float32Array(total * w);
    let o = 0;
    for (const g of ps) { arr.set((g.attributes[k] as THREE.BufferAttribute).array as Float32Array, o); o += g.attributes.position.count * w; }
    out.setAttribute(k, new THREE.BufferAttribute(arr, w));
  }
  parts.forEach((g) => g.dispose());
  ps.forEach((g) => g.dispose());
  out.userData.keepColor = true;
  return out;
}

// ================================================================================================ FLW-S3-014
// Gesneden zwaluwen (Track 01 rebuild). Construction note:
// - Three separately carved swallows, each carried by its own hidden oak dowel into the wall (the sheet's "concealed
//   rail" is replaced by dowels: nothing reads on the wall between the birds). The body is the carrying mass; both wings
//   and the tail are let into it.
// - Silhouette first: long scythe wings (a convex leading edge, a hollow trailing edge stepped by the primary feather
//   tips) and deep tail streamers. The wings are two plates per wing (coverts over primaries), so the feather groups read
//   as carved steps, not as painted lines.
// - Body: a lofted spindle (chest fullest, a waist at the neck, a round head, a short dark beak), half relief: the wall
//   side flattened.
// - Material: oiled oak (timber) with a slate-blue stain on the faces and the oak showing on every chamfer and cut edge;
//   cream belly, rufous throat and face painted on the body form.
// - The three birds are three different poses from the sheet (glide, bank, dive), never one cloned bird.
// - Size: each bird ≈ 0.45 m beak to streamer tip at s = 1; the group ≈ 1.73 × 0.60 m (the D2-R presence). The final
//   scale and height against the gallery wall are D3-b's.
const SW = {
  stain: col('#5a6b88'), stainDark: col('#45546e'), stainLight: col('#7586a0'),
  oak: col('#b97a43'), oakGold: col('#b88a55'), oakDark: col('#8d5a30'), cream: col('#ead8b2'), rufous: col('#b4613a'), dark: col('#2a2520'),
};
interface WingDef { a: number; len: number; chord: number; sweep: number; near: boolean }
interface BirdDef { x: number; y: number; pitch: number; k: number; wings: [WingDef, WingDef]; tail: number; streamer: number }
/** The three sheet poses (art panel, left → right): gliding, banking, diving. Angles in degrees, bird frame (head = +X). */
export const SWALLOW_POSES: BirdDef[] = [
  // gliding: near wing up and swept back, far wing down and back behind the body, streamers straight out behind
  { x: -0.62, y: -0.1, pitch: 6, k: 1.0, tail: 0, streamer: 1.0, wings: [{ a: 112, len: 0.4, chord: 0.112, sweep: 0.3, near: true }, { a: -156, len: 0.33, chord: 0.094, sweep: 0.24, near: false }] },
  // banking: near wing raised wide over the back, far wing reaching down and forward under the body, tail dropped
  { x: 0.0, y: 0.11, pitch: 9, k: 1.12, tail: -14, streamer: 0.9, wings: [{ a: 142, len: 0.43, chord: 0.12, sweep: 0.32, near: true }, { a: -62, len: 0.34, chord: 0.098, sweep: 0.26, near: false }] },
  // diving: pitched head-down, both wings swept up and back (the far one above, behind), streamers lifted
  { x: 0.6, y: 0.0, pitch: -32, k: 1.05, tail: 12, streamer: 1.05, wings: [{ a: 164, len: 0.41, chord: 0.112, sweep: 0.3, near: true }, { a: 78, len: 0.31, chord: 0.092, sweep: 0.3, near: false }] },
];
const BODY_D = 0.07; // stand-off of the body axis from the wall

/** Body half-height / half-depth / centre-line height along the body axis (X, bird frame, tail base → beak base). */
const BODY_ST: [number, number, number][] = [ // [x, half-height, centre y]
  [-0.112, 0.006, 0.0], [-0.09, 0.019, 0.0], [-0.055, 0.033, -0.004], [-0.015, 0.046, -0.008], [0.022, 0.05, -0.008],
  [0.055, 0.044, -0.003], [0.078, 0.034, 0.003], [0.097, 0.035, 0.006], [0.116, 0.03, 0.007], [0.131, 0.017, 0.007], [0.142, 0.004, 0.007],
];
function bodyAt(x: number) {
  const st = BODY_ST;
  if (x <= st[0][0]) return { h: st[0][1], yc: st[0][2] };
  for (let i = 1; i < st.length; i++) if (x <= st[i][0]) {
    const t = (x - st[i - 1][0]) / (st[i][0] - st[i - 1][0]), e = t * t * (3 - 2 * t);
    return { h: st[i - 1][1] + (st[i][1] - st[i - 1][1]) * e, yc: st[i - 1][2] + (st[i][2] - st[i - 1][2]) * e };
  }
  return { h: st[st.length - 1][1], yc: st[st.length - 1][2] };
}
function swallowBody() {
  const x0 = BODY_ST[0][0], x1 = BODY_ST[BODY_ST.length - 1][0];
  const g = loft(15, 10, (t) => {
    const x = x0 + (x1 - x0) * t, { h, yc } = bodyAt(x);
    // half relief: the wall-side half is flattened (b on the back is smaller), so the section centre sits forward
    return { c: new THREE.Vector3(x, yc, BODY_D + h * 0.12), u: new THREE.Vector3(0, 1, 0), v: new THREE.Vector3(0, 0, 1), a: h, b: h * 0.92 };
  }, (t, phi) => {
    const x = x0 + (x1 - x0) * t, up = Math.cos(phi); // up = 1 on the back, −1 on the belly
    let c = up > 0.1 ? SW.stain.clone() : SW.cream.clone();
    if (up > -0.05 && up < 0.25) c.lerp(SW.oak, 0.5); // the carved flank line between stain and belly
    if (x > 0.07 && up < 0.55) c = mixC(c, SW.rufous, smooth(x, 0.07, 0.1)); // throat and face
    if (x > 0.105 && up > 0.55) c = SW.stainDark.clone(); // crown
    return c;
  }, (t, phi) => {
    const x = x0 + (x1 - x0) * t;
    if (Math.sin(phi) < -0.2) return -0.18 * Math.abs(Math.sin(phi)); // wall side flatter still
    // the shoulder: the upper front of the body swells over the near wing's root, so the wing grows out from under it
    return 0.24 * Math.max(0, Math.cos(phi - Math.PI / 3)) ** 2 * gauss(x, 0.012, 0.034);
  });
  return g; // smooth-shaded: the body is the soft, organic mass the carved wing plates grow from
}
/**
 * A wing outline in the bird frame: root at (0, 0), pointing at angle `a`. Leading edge convex towards the bird's front,
 * trailing edge hollow and stepped by five primary tips; the whole wing bends backwards (`sweep`): the scythe.
 */
function wingOutline(w: WingDef, scaleLen = 1, scaleChord = 1, tips = 4): V2[] {
  const len = w.len * scaleLen, ch = w.chord * scaleChord, ar = w.a * D2R;
  const ux = Math.cos(ar), uy = Math.sin(ar);
  let vx = -uy, vy = ux;
  if (vx < 0) { vx = -vx; vy = -vy; } // v = towards the bird's front (+X): the leading edge side
  const P = (s: number, v: number): V2 => {
    const back = -w.sweep * len * s * s; // the scythe: the outer wing bends back
    return [ux * s * len + vx * (v + back), uy * s * len + vy * (v + back)];
  };
  const root = (s: number) => 0.42 + 0.58 * smooth(s, 0, 0.24); // the wing narrows into the shoulder (no broad plate edge across the body)
  const le = (s: number) => ch * (0.5 + 0.12 * gauss(s, 0.3, 0.2)) * (1 - s ** 1.9) ** 0.6 * root(s); // convex leading edge, full at the wrist
  const te = (s: number) => -ch * 0.5 * (1 - s) ** 0.62 * (1 + 0.22 * gauss(s, 0.22, 0.2)) * root(s); // broad secondaries, hollow towards the tip
  const out: V2[] = [];
  for (let i = 0; i <= 9; i++) { const s = (i / 9) ** 1.1; out.push(P(s, le(s))); } // root → tip along the leading edge
  // trailing edge back from the tip, stepped: each primary tip juts back, a notch between
  const s0 = 0.38;
  for (let k = 0; k < tips; k++) { // feather tips lean outwards: the notch sits nearer the root than the tip it follows
    const sa = 1 - ((1 - s0) * (k + 0.05)) / tips, sb = 1 - ((1 - s0) * (k + 0.7)) / tips;
    out.push(P(sa, te(sa) - ch * 0.04), P(sb, te(sb) + ch * 0.025));
  }
  for (let i = 1; i <= 5; i++) { const s = s0 * (1 - i / 5); out.push(P(s, te(s))); } // secondaries back to the root
  return out;
}
/** The covert band: the inner half of the wing along its leading edge (the marginal and greater coverts), its trailing
 * edge stepped by three feather ends. */
function covertOutline(w: WingDef): V2[] {
  const len = w.len * 0.5, ch = w.chord * 0.62, ar = w.a * D2R, ux = Math.cos(ar), uy = Math.sin(ar);
  let vx = -uy, vy = ux;
  if (vx < 0) { vx = -vx; vy = -vy; }
  const off = w.chord * 0.2; // shifted towards the leading edge
  const P = (s: number, v: number): V2 => { const back = -w.sweep * w.len * (s * 0.5) ** 2; return [ux * s * len + vx * (v + off + back), uy * s * len + vy * (v + off + back)]; };
  const out: V2[] = [];
  const root = (s: number) => 0.5 + 0.5 * smooth(s, 0, 0.3);
  for (let i = 0; i <= 6; i++) { const s = i / 6; out.push(P(s, ch * 0.5 * (1 - s ** 2.4) ** 0.7 * root(s))); }
  for (let k = 0; k < 3; k++) { const sa = 1 - (k + 0.2) / 3.2, sb = 1 - (k + 0.85) / 3.2; out.push(P(sa, -ch * 0.42 * (1 - sa) ** 0.5 - ch * 0.08), P(sb, -ch * 0.42 * (1 - sb) ** 0.5 + ch * 0.06)); }
  out.push(P(0, -ch * 0.25));
  return out;
}
/** One wing plate, placed at its root; `lift` = D at the root, `dTip` = D change towards the tip (tips nearer the wall). */
function wingPlate(o: V2[], len: number, ang: number, t: number, bevel: number, dRoot: number, dTip: number, tone: 'primary' | 'covert') {
  const g = plate(o, t, bevel), p = g.attributes.position as THREE.BufferAttribute;
  const ux = Math.cos(ang), uy = Math.sin(ang);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), s = clamp01((x * ux + y * uy) / len);
    // thinner towards the tip, a slight camber, the tip eased towards the wall
    p.setZ(i, p.getZ(i) * (1 - 0.5 * s) + dRoot + dTip * s + 0.01 * len * Math.sin(Math.PI * s));
  }
  g.computeVertexNormals();
  return paintFaces(g, (n, c) => {
    const s = clamp01((c.x * ux + c.y * uy) / len);
    // the covert band reads warm (oak through a thin stain, the sheet's leading edge), the primaries slate-blue
    if (n.z > 0.75) return tone === 'covert' ? mixC(SW.oakGold, SW.stainLight, 0.3 + 0.5 * s) : mixC(SW.stainLight, SW.stain, s * 1.2);
    if (n.z < -0.75) return SW.oakDark.clone();
    return SW.oak.clone(); // chamfers and cut edges: the oak under the stain
  });
}
function swallowTail(b: BirdDef) {
  const ar = b.tail * D2R, ca = Math.cos(ar), sa = Math.sin(ar), L = b.streamer;
  const pts: V2[] = [[-0.095, 0.011], [-0.16, 0.022], [-0.235 * L - 0.02, 0.047], [-0.3 * L - 0.02, 0.06], [-0.205, 0.012], [-0.17, 0.0], [-0.205, -0.012], [-0.29 * L - 0.02, -0.052], [-0.225 * L - 0.02, -0.04], [-0.155, -0.02], [-0.095, -0.011]];
  const rot = pts.map(([x, y]) => {
    const dx = x + 0.095; // turn the tail about its root
    return [-0.095 + dx * ca - y * sa, dx * sa + y * ca] as V2;
  });
  const g = plate(rot, 0.007, 0.0025), p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + BODY_D - 0.004 + 0.06 * (p.getX(i) + 0.095)); // streamers ease towards the wall
  g.computeVertexNormals();
  return paintFaces(g, (n) => (n.z > 0.75 ? SW.stainDark.clone() : n.z < -0.75 ? SW.oakDark.clone() : SW.oak.clone()));
}
function swallowBird(b: BirdDef) {
  const parts: THREE.BufferGeometry[] = [swallowBody(), swallowTail(b)];
  for (const w of b.wings) {
    const ang = w.a * D2R, up = Math.sin(ang) > 0;
    // near wing: from the shoulder on the back, under a soft shoulder mass; far wing: rooted behind the body's centre
    // line (the body hides the joint), its covert starting out along the wing, clear of the belly
    const rootX = w.near ? 0.01 : 0.004, rootY = up ? (w.near ? 0.03 : 0.012) : -0.006;
    const dRoot = w.near ? BODY_D + 0.016 : BODY_D - 0.03, dTip = w.near ? -0.022 : -0.01;
    const prim = wingPlate(wingOutline(w), w.len, ang, 0.011, 0.0035, dRoot, dTip, 'primary');
    // the covert plate (the inner feather group) sits on the viewer side of its primary plate
    const cov = wingPlate(covertOutline(w), w.len * 0.5, ang, 0.009, 0.003, dRoot + 0.009, dTip * 0.5, 'covert');
    const out = w.near ? 0 : 0.05; // far covert: shifted out along the span
    prim.translate(rootX, rootY, 0); cov.translate(rootX + Math.cos(ang) * out, rootY + Math.sin(ang) * out, 0);
    parts.push(prim, cov);
  }
  // beak and eye: small, but they set the head's direction at the approach distance
  const beak = faceted(new THREE.ConeGeometry(0.0075, 0.04, 5).rotateZ(-Math.PI / 2).translate(0.153, 0.006, BODY_D + 0.003));
  paintFaces(beak, () => SW.dark.clone());
  const eye = faceted(new THREE.IcosahedronGeometry(0.006, 0).translate(0.113, 0.013, BODY_D + 0.031)); // set into the head's surface
  paintFaces(eye, () => SW.dark.clone());
  // hidden dowel: from the chest into the wall (D = 0)
  const dowel = faceted(new THREE.CylinderGeometry(0.008, 0.008, BODY_D, 6).rotateX(Math.PI / 2).translate(0.01, -0.004, BODY_D / 2));
  paintFaces(dowel, () => SW.oakDark.clone());
  parts.push(beak, eye, dowel);
  return mergeParts(parts);
}
/** Triangles and the bird geometries of the group in the viewer frame, before scale / anchor (for tests and the harness). */
export function swallowGroupGeometry(s = 1) {
  return SWALLOW_POSES.map((b) => {
    const g = swallowBird(b);
    // pose: pitch and the bird's own size about its body centre, then its place in the group; the dowel stays on D = 0
    g.applyMatrix4(new THREE.Matrix4().makeRotationZ(b.pitch * D2R).premultiply(new THREE.Matrix4().makeScale(b.k * s, b.k * s, b.k * s)));
    g.translate(b.x * s, b.y * s, 0);
    return g;
  });
}
/** FLW-S3-014: the group centred on the anchor (wall face plane, facing `yaw`). Placed in production by D3-b1 (`name` = the
 * construction-audit id: the stable id in the world, `T01:…` in the review harness). */
export function buildSwallows(bt: Batcher, chunk: string, x: number, y: number, z: number, yaw: number, s = 1, name = T01('FLW-S3-014')) {
  const M = artMats();
  let tris = 0;
  for (const g of swallowGroupGeometry(s)) {
    toLocal(g);
    projectUV(g, 0.25, 'x');
    const a = new Asm(bt, chunk, x, y, z, yaw).begin(name);
    a.add(M.timber, '#ffffff', g, 0, 0, 0);
    a.end({ ground: false }); // each bird is one connected piece on its own dowel
    tris += g.attributes.position.count / 3;
    g.dispose();
  }
  return { tris, w: 1.73 * s, h: 0.6 * s };
}

// ================================================================================================ FLW-S3-017
// Terracotta bloemmedaillon (Track 01 refinement of the accepted D2-R model). Kept from D2-R (owner: "modelling
// direction good"): the turned clay disc, its rolled and profiled rim, the slightly out-of-round hand-made outline, the
// plant growing out of the field, one terracotta family with the relief lighter than the field. Refined only where the
// sheet's identity did not survive at larger display scale:
//   1. the bud: about 1.7× taller, ribbed (five petal ridges) and pointed, cupped by two sepals: the sheet's focal mass;
//   2. the spray: three leaf pairs off a central stem, filling the field the way the sheet does (D2-R: five small leaves
//      on one side);
//   3. an inner bead inside the rim (the sheet's double ring);
//   4. the olive / green patina settled in the leaf hollows and veins (the sheet's glaze split), in vertex colour.
// Depth and facet density scale with the piece: Ø 0.58 m at s = 1, rim 6.6 cm proud; the lathe gains segments above
// s = 1.6 so a ×2.5–×3 identity-scale medallion does not show a polygonal rim.
const MED = { field: col('#a9583a'), field2: col('#b8633f'), rim: col('#cb7650'), contact: col('#8c472e'), leaf: col('#9e5d3b'), leafHi: col('#d08c5e'), patina: col('#7f8350'), bud: col('#c47a4e'), budHi: col('#e09a6c') };
const F0 = 0.036; // field surface (s = 1)
function medallionDisc(seg: number) {
  const prof: V2[] = [[0.001, F0], [0.192, F0], [0.198, 0.043], [0.205, 0.045], [0.212, 0.04], [0.218, F0 + 0.002], [0.226, 0.042], [0.24, 0.058], [0.258, 0.066], [0.276, 0.058], [0.287, 0.035], [0.29, 0.0]];
  const g = new THREE.LatheGeometry(prof.map(([r, h]) => new THREE.Vector2(r, h)), seg);
  const pa = g.attributes.position as THREE.BufferAttribute, cs: number[] = [];
  for (let i = 0; i < pa.count; i++) {
    const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), r = Math.hypot(x, z), an = Math.atan2(z, x);
    const k = 1 + 0.012 * Math.sin(3 * an + 0.7) + 0.007 * Math.sin(7 * an); // by hand: slightly out of round
    pa.setXYZ(i, x * k, y + 0.002 * Math.sin(5 * an) * (r > 0.2 && y > 0.001 ? 1 : 0), z * k); // the back stays flat on the wall (D2-R let it dip 2 mm)
    const c = r < 0.193 ? mixC(MED.field, MED.field2, r / 0.193 + 0.08 * Math.sin(an * 4 + r * 30)) : y > 0.06 ? MED.rim.clone() : r < 0.222 && y > 0.041 ? mixC(MED.rim, MED.field2, 0.4) : y < F0 + 0.005 && r < 0.236 ? MED.contact.clone() : MED.field2.clone();
    cs.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3));
  g.rotateX(Math.PI / 2); // turned axis → D (towards the viewer)
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  const m = mergeVertices(g, 1e-5); // weld the lathe seam (D2-R shows a shading line where the turn closes)
  g.dispose();
  facingViewer(m);
  m.userData.keepColor = true;
  return m;
}
/** A leaf lifting off the field: sunk midrib with patina, tip curling up; (px, py) = its base on the stem. */
function medLeaf(px: number, py: number, ang: number, len: number, wid: number, d0: number) {
  const ca = Math.cos(ang), sa = Math.sin(ang);
  return reliefGrid(8, 4, (s, t) => {
    const across = t * 2 - 1, w = wid * 2.25 * Math.max(0.03, s) ** 0.55 * (1 - s) ** 0.95, lx = s * len, ly = across * w; // pointed (lanceolate), widest a third out
    const h = 0.002 + 0.017 * (1 - across * across) * Math.sin(Math.PI * Math.min(1, s * 1.05)) ** 0.6 - 0.007 * gauss(across, 0, 0.12) + 0.016 * s * s; // flatter blade, a crisp sunk midrib
    const vein = gauss(across, 0, 0.16) * (1 - s * 0.5), edge = 1 - Math.abs(across);
    const c = mixC(MED.leaf, MED.leafHi, s * 0.6 + edge * 0.3).lerp(MED.patina, clamp01(0.42 + 0.4 * vein - 0.3 * (1 - edge) * s + 0.15 * gauss(s, 0.1, 0.12)));
    return { x: px + lx * ca - ly * sa, y: py + lx * sa + ly * ca, d: d0 + h, c };
  });
}
/** The ribbed, pointed bud: a lathe with five petal ridges, flattened into the relief. */
function medBud(seg: number) {
  const prof: V2[] = [[0.002, 0], [0.038, 0.01], [0.058, 0.035], [0.066, 0.068], [0.058, 0.103], [0.04, 0.134], [0.019, 0.158], [0.002, 0.174]];
  const g = new THREE.LatheGeometry(prof.map(([r, h]) => new THREE.Vector2(r, h)), seg);
  const pa = g.attributes.position as THREE.BufferAttribute, cs: number[] = [];
  for (let i = 0; i < pa.count; i++) {
    const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), an = Math.atan2(z, x), rib = Math.abs(Math.cos(2.5 * (an - Math.PI / 2))); // five ridges, one facing the viewer (a centre petal)
    const k = 0.86 + 0.16 * rib ** 0.6; // deeper petal grooves
    pa.setXYZ(i, x * k, y, z * k * 0.62); // flattened towards the field
    const c = mixC(MED.contact, MED.budHi, 0.2 + 0.75 * rib ** 0.7 + 0.15 * (y / 0.172)).lerp(MED.patina, 0.3 * (1 - rib) * gauss(y, 0.03, 0.06));
    cs.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3));
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  const m = mergeVertices(g, 1e-5); // welded seam
  g.dispose();
  m.computeVertexNormals();
  m.userData.keepColor = true;
  return m;
}
/** The medallion in the viewer frame (wall at D = 0), at presentation scale `s`. */
export function medallionGeometry(s = 1) {
  const seg = s > 1.6 ? 64 : 44, F = F0;
  const parts: THREE.BufferGeometry[] = [medallionDisc(seg)];
  // stem: from the lower field edge, a gentle S up to the bud
  const stem = new THREE.CatmullRomCurve3([[0.006, -0.19, F + 0.003], [-0.012, -0.12, F + 0.009], [0.008, -0.04, F + 0.011], [0.0, 0.03, F + 0.012]].map(([x, y, d]) => new THREE.Vector3(x, y, d)));
  const tube = new THREE.TubeGeometry(stem, 14, 0.012, 6, false), tc: number[] = [];
  for (let i = 0; i < tube.attributes.position.count; i++) { const c = mixC(MED.leaf, MED.patina, 0.3); tc.push(c.r, c.g, c.b); }
  tube.setAttribute('color', new THREE.Float32BufferAttribute(tc, 3));
  parts.push(tube);
  // three leaf pairs, slightly unequal (by hand), lower pair largest
  for (const [x, y, an, l, w] of [
    [-0.008, -0.15, Math.PI + 0.04, 0.175, 0.05], [0.008, -0.138, -0.02, 0.17, 0.048], // the lower pair fans out to the rim
    [-0.006, -0.085, Math.PI - 0.34, 0.15, 0.044], [0.007, -0.074, 0.38, 0.145, 0.043],
    [-0.005, -0.03, Math.PI - 0.78, 0.11, 0.032], [0.005, -0.022, 0.74, 0.104, 0.03],
    [-0.004, -0.172, Math.PI + 0.55, 0.058, 0.02], [0.005, -0.168, -0.52, 0.055, 0.019], // small pair at the foot of the stem
  ] as const) parts.push(medLeaf(x, y, an, l, w, F));
  for (const sg of [-1, 1]) parts.push(medLeaf(sg * 0.02, 0.026, Math.PI / 2 + sg * 0.95, 0.1, 0.026, F + 0.03)); // sepals cupping the bud: their tips clear its outline
  parts.push(medBud(s > 1.6 ? 18 : 14).translate(0, 0.022, F + 0.016));
  const g = mergeParts(parts);
  g.scale(s, s, s);
  return g;
}
/** FLW-S3-017 Track 01 candidate, centred on the anchor (wall face plane, facing `yaw`). Ø 0.58 m × s. */
export function buildMedallion(bt: Batcher, chunk: string, x: number, y: number, z: number, yaw: number, s = 1, name = T01('FLW-S3-017')) {
  const M = artMats(), g = toLocal(medallionGeometry(s));
  const a = new Asm(bt, chunk, x, y, z, yaw).begin(name);
  a.add(M.paint, '#ffffff', g, 0, 0, 0);
  a.end({ ground: false });
  const tris = g.attributes.position.count / 3;
  g.dispose();
  return { tris, w: 0.6 * s, h: 0.6 * s };
}

// ================================================================================================ FLW-S3-016
// Keramische maanvorm (Track 01 rebuild). Construction note:
// - An oak block (rough-hewn, softened arrises) carries a brass pin; the pin runs up into the crescent's lowest outer
//   point, with a brass washer on the block. The crescent stands clear of the block by ≈ 2 cm (the sheet's detail
//   view).
// - Silhouette: a fat crescent, its back on the left and the opening to the right, the horns tapering to soft points
//   (the sheet's front view); it reads as a VOLUME from every side, a lens in section (the side views), not a cut-out.
// - Material: matte ivory glaze with a warm craze and small grey-blue craters (vertex colour on the paint material,
//   as the D2 moon); the block in the timber material.
// - Proportion (sheet): block ≈ 0.7 × the crescent's width, crescent ≈ 2× the block's height. ≈ 0.32 m overall at
//   s = 1 (the sheet's 24 cm crescent on its block); D3-b sets the size on the bedside.
const MOON = { glaze: col('#f0e7d2'), craze: col('#d6bd90'), crater: col('#8e959b'), oak: '#7a4a2a', brass: '#c9a24c' };
const CRATERS: [number, number, number][] = [[0.28, 0.6, 0.11], [0.45, 0.4, 0.09], [0.56, 0.7, 0.12], [0.72, 0.5, 0.08], [0.4, 0.9, 0.08], [0.82, 0.62, 0.07]]; // [t along, side 0…1 (inner→outer), size]
export function moonCrescentGeometry() {
  const Rc = 0.066, W = 0.086, th0 = 46 * D2R, th1 = 312 * D2R;
  const g = loft(34, 14, (t) => {
    const th = th0 + (th1 - th0) * t, w = W * Math.sin(Math.PI * t) ** 0.72 + 0.0015;
    const radial = new THREE.Vector3(Math.cos(th), Math.sin(th), 0);
    // the band hugs an outer circle: its centre line moves outwards as it thins (a crescent, not a bent sausage)
    const c = radial.clone().multiplyScalar(Rc + (W - w) * 0.42);
    return { c, u: radial, v: new THREE.Vector3(0, 0, 1), a: w / 2, b: w * 0.4 };
  }, (t, phi) => {
    const side = (Math.cos(phi) + 1) / 2;
    let c = mixC(MOON.glaze, MOON.craze, 0.35 * gauss(Math.sin(t * 23 + phi * 3), 0.6, 0.25) + 0.15 * (1 - side));
    for (const [ct, cs, r] of CRATERS) {
      const d = Math.hypot((t - ct) * 2.2, (side - cs) * 1.2, Math.min(Math.abs(Math.sin(phi) - 1), Math.abs(Math.sin(phi) + 1)) * 0.8);
      c = c.lerp(MOON.crater, 0.9 * gauss(d, 0, r * 1.5)).lerp(MOON.glaze, 0.5 * gauss(d, r * 1.5, r * 0.4));
    }
    return c;
  }, (t, phi) => {
    let k = 0.025 * Math.sin(t * 31 + phi * 2) * Math.sin(phi * 3 + 1); // a hand-glazed, gently hammered surface
    const side = (Math.cos(phi) + 1) / 2;
    for (const [ct, cs, r] of CRATERS) {
      const d = Math.hypot((t - ct) * 2.2, (side - cs) * 1.2, Math.min(Math.abs(Math.sin(phi) - 1), Math.abs(Math.sin(phi) + 1)) * 0.8);
      k -= 0.16 * gauss(d, 0, r) - 0.05 * gauss(d, r * 1.4, r * 0.5); // dished crater, a slight rim
    }
    return k;
  });
  g.rotateZ(-8 * D2R); // the sheet's lean: the lower horn reaches further forward
  return g;
}
/** FLW-S3-016 Track 01 candidate standing on its support at the anchor (y = the support top), facing `yaw`. */
export function buildMoon(bt: Batcher, chunk: string, x: number, y: number, z: number, yaw: number, s = 1, name = T01('FLW-S3-016')) {
  const M = artMats(), BW = 0.14 * s, BH = 0.094 * s, BD = 0.105 * s, gap = 0.02 * s;
  const a = new Asm(bt, chunk, x, y, z, yaw).begin(name);
  const block = deform(softBox(BW, BH, BD, 0.007 * s, 1, 2), (p) => { // rough-hewn: the faces wander a few millimetres
    const k = 1 + 0.025 * Math.sin(p.x * 140 + p.y * 60) * Math.sin(p.z * 120 + 1.3);
    p.x *= k; p.z *= 2 - k;
  });
  projectUV(block, 0.35, 'y');
  bake(block, baseAO(-BH / 2, BH * 0.7, 0.72));
  a.add(M.timber, MOON.oak, toLocal(block), 0, BH / 2, 0);
  const cres = moonCrescentGeometry();
  cres.scale(s, s, s);
  cres.computeBoundingBox();
  // stand the crescent on its pin: its lowest point over the block centre, `gap` above the block
  const pa = cres.attributes.position as THREE.BufferAttribute;
  let lo = 0;
  for (let i = 1; i < pa.count; i++) if (pa.getY(i) < pa.getY(lo)) lo = i;
  const lx = pa.getX(lo), ly = pa.getY(lo), lz = pa.getZ(lo);
  cres.translate(-lx, BH + gap - ly, -lz);
  toLocal(cres);
  a.add(M.paint, '#ffffff', cres, 0, 0, 0);
  const pin = new THREE.CylinderGeometry(0.0045 * s, 0.0045 * s, gap + 0.016 * s, 6).translate(0, BH + (gap + 0.016 * s) / 2, 0);
  const washer = new THREE.CylinderGeometry(0.012 * s, 0.013 * s, 0.004 * s, 10).translate(0, BH + 0.002 * s, 0);
  a.add(M.paint, MOON.brass, pin, 0, 0, 0);
  a.add(M.paint, MOON.brass, washer, 0, 0, 0);
  a.end();
  const tris = [block, cres, pin, washer].reduce((n, g) => n + (g.index ? g.index.count : g.attributes.position.count) / 3, 0);
  return { tris, w: BW, h: cres.boundingBox ? BH + gap + (cres.boundingBox.max.y - cres.boundingBox.min.y) : BH };
}

// ================================================================================================ FLW-S3-015
// Miniatuurzeilboot (Track 01 rebuild, owner: rebuild now). Kept from the production model: the rig silhouette (mast
// height, boom, bowsprit, the cream triangular mainsail, four rigging lines) and the oak base on brass posts. Rebuilt:
// the hull. Construction note:
// - What supports it: an oak base board carries two brass posts; each post ends in a brass cradle cup and the keel's
//   flat bottom sits in both cups (no floating hull, no post stopping short of the boat).
// - Silhouette: a deep, planked hull (the sheet's round-bilged sloop): a fine raked stem, the forefoot cut away, full
//   sections amidships, a rounded counter ending in a small transom; the sheer rises towards the bow. A long fin keel
//   with a rudder hung on its aft end.
// - Construction / material: the hull is built from eight strakes (alternating walnut tones, crisp seams between them),
//   one strake painted as the cream sheer stripe; a dark toe rail along the sheer; a honey deck with the cabin trunk.
// - Size: 0.36 m long, ≈ 0.57 m to the masthead at s = 1 (the production boat was 0.34 m with a shallow hull). D3-b sets
//   the scale on the Reiskamer desk (audit: up to ×1.15).
const SL = { walnut: col('#764628'), walnut2: col('#8a5631'), cream: col('#ece0c6'), rail: col('#3e2414'), deck: '#b88a58', base: '#7a5232', brass: '#c9a24c', spar: '#7e4e2a', sail: '#ece2cc', rig: '#c8b48a' };
const HULL = { L: 0.36, B: 0.056, bot: 0.088, sheer: 0.16 }; // length, half-beam, hull bottom (above the keel), sheer amidships
/** Hull section at t (0 = stern, 1 = bow): half-beam, bottom height and sheer height. */
function hullAt(t: number) {
  const b = HULL.B * Math.max(0, Math.sin(Math.PI * (0.2 + 0.8 * t))) ** 0.62; // a small transom aft, a fine stem forward
  const bot = HULL.bot + 0.05 * smooth(t, 0.66, 1) ** 1.3 + 0.03 * (1 - smooth(t, 0, 0.16)); // forefoot cut away; counter lifts aft
  const sheer = HULL.sheer + 0.016 * t * t + 0.008 * (1 - t) ** 3; // sheer springs up at the bow, a little at the stern
  return { b, bot, sheer, z: (t - 0.5) * HULL.L };
}
/** Girth: u 0 (keel line) → 1 (sheer); the section is round-bilged (full at the turn of the bilge). */
const girthX = (u: number) => Math.sin((u * Math.PI) / 2) ** 0.5;
const girthY = (u: number) => 1 - Math.cos((u * Math.PI) / 2) ** 1.25;
const STRAKES = [0, 0.16, 0.31, 0.45, 0.58, 0.7, 0.8, 0.88, 0.94, 1]; // 9 bands; band 7 (0.88–0.94) is the cream sheer stripe
function sloopHull() {
  const N = 16, parts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < STRAKES.length - 1; k++) {
    const u0 = STRAKES[k], u1 = STRAKES[k + 1], c = k === 7 ? SL.cream : k % 2 ? SL.walnut2 : SL.walnut;
    for (const side of [-1, 1]) {
      const pos: number[] = [], idx: number[] = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N, h = hullAt(t);
        for (const u of [u0, u1]) pos.push(side * h.b * girthX(u), h.bot + (h.sheer - h.bot) * girthY(u), h.z);
      }
      for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      orient(g, (q) => new THREE.Vector3(q.x, q.y - (HULL.bot + HULL.sheer) / 2, 0)); // outwards from the hull's middle
      g.computeVertexNormals(); // smooth along the strake; the seams between strakes stay crisp (the planking)
      g.setAttribute('color', new THREE.Float32BufferAttribute(new Array((N + 1) * 2).fill(0).flatMap(() => [c.r, c.g, c.b]), 3));
      parts.push(g);
    }
  }
  // transom: a fan closing the stern section
  const h0 = hullAt(0), tp: number[] = [], tc: number[] = [];
  const ring = Array.from({ length: 9 }, (_, i) => { const u = i / 8; return [h0.b * girthX(u), h0.bot + (h0.sheer - h0.bot) * girthY(u)]; });
  for (let i = 0; i < 8; i++) for (const side of [-1, 1]) {
    const a = ring[i], b = ring[i + 1];
    const tri = side > 0 ? [[0, h0.sheer], [side * b[0], b[1]], [side * a[0], a[1]]] : [[0, h0.sheer], [side * a[0], a[1]], [side * b[0], b[1]]];
    for (const [x, y] of tri) { tp.push(x, y, h0.z); tc.push(SL.walnut2.r, SL.walnut2.g, SL.walnut2.b); }
  }
  const tr = new THREE.BufferGeometry();
  tr.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3));
  tr.setAttribute('color', new THREE.Float32BufferAttribute(tc, 3));
  orient(tr, () => new THREE.Vector3(0, 0, -1));
  tr.computeVertexNormals();
  parts.push(tr);
  const g = mergeParts(parts);
  return g;
}
/** The deck: flush with the sheer, following its spring (honey planking). */
function sloopDeck() {
  const N = 16, pos: number[] = [], idx: number[] = [];
  for (let i = 0; i <= N; i++) { const h = hullAt(i / N); pos.push(-h.b, h.sheer, h.z, h.b, h.sheer, h.z); }
  for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  orient(g, () => new THREE.Vector3(0, 1, 0));
  g.computeVertexNormals();
  return g;
}
/** Keel profile (side view, z along the hull): a long fin with a flat bottom over the posts, a raked forefoot, and the
 * rudder as the fin's aft end (a vertical trailing edge up under the counter). Extruded thin about the centre line. */
function sloopKeel(kb: number) {
  const zF = 0.15, top = HULL.bot + 0.006, zR = -HULL.L / 2 + 0.004, under = hullAt(0.02).bot + 0.004;
  const pts: V2[] = [[zR, under], [zR, kb + 0.02], [zR + 0.022, kb + 0.004], [-0.12, kb], [0.07, kb], [0.105, kb + 0.012], [zF, hullAt(1).bot - 0.004], [zF - 0.03, hullAt(0.92).bot + 0.006], [0.05, top], [-0.12, top], [zR + 0.02, under]];
  const s2 = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y)));
  const g = new THREE.ExtrudeGeometry(s2, { depth: 0.008, bevelEnabled: false, curveSegments: 1 });
  g.translate(0, 0, -0.004);
  g.rotateY(-Math.PI / 2); // shape x (along the hull) → z, extrusion → x (across)
  return faceted(g);
}
/** A thin cylinder between two viewer-frame points. */
function rodBetween(a: THREE.Vector3, b: THREE.Vector3, r0: number, r1 = r0, seg = 5, open = false) {
  const d = b.clone().sub(a), g = new THREE.CylinderGeometry(r1, r0, d.length(), seg, 1, open);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return g;
}
/** FLW-S3-015 Track 01 candidate standing on its support at the anchor, the bow towards the facing `yaw`. */
export function buildSloop(bt: Batcher, chunk: string, x: number, y: number, z: number, yaw: number, s = 1, name = T01('FLW-S3-015')) {
  const M = artMats(), V = (a: number, b: number, c: number) => new THREE.Vector3(a, b, c);
  const a = new Asm(bt, chunk, x, y, z, yaw).begin(name);
  let tris = 0;
  const add = (mat: THREE.Material, color: string, g: THREE.BufferGeometry) => {
    g.scale(s, s, s); toLocal(g);
    a.add(mat, color, g, 0, 0, 0);
    tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
    g.dispose();
  };
  const BASE_T = 0.022, POST = 0.034, kb = BASE_T + POST; // keel bottom = post tops
  const base = softBox(0.09, BASE_T, 0.27, 0.004, 1, 1).translate(0, BASE_T / 2, -0.02);
  projectUV(base, 0.3, 'z');
  add(M.timber, SL.base, base);
  for (const pz of [-0.085, 0.045]) { // brass posts with cradle cups the keel sits in
    add(M.brass, SL.brass, new THREE.CylinderGeometry(0.0045, 0.0055, POST - 0.006, 7).translate(0, BASE_T + (POST - 0.006) / 2, pz));
    add(M.brass, SL.brass, new THREE.CylinderGeometry(0.009, 0.007, 0.012, 8, 1, true).translate(0, kb - 0.002, pz)); // cup: its rim rises 4 mm round the keel
    add(M.brass, SL.brass, new THREE.CylinderGeometry(0.011, 0.012, 0.004, 8).translate(0, BASE_T + 0.002, pz)); // foot rose on the base
  }
  const keel = sloopKeel(kb);
  projectUV(keel, 0.3, 'z');
  add(M.timber, '#ffffff', paintFaces(keel, () => SL.walnut.clone()));
  const hull = sloopHull();
  projectUV(hull, 0.3, 'z');
  add(M.timber, '#ffffff', hull);
  const deck = sloopDeck();
  projectUV(deck, 0.2, 'z');
  add(M.timber, SL.deck, deck);
  for (const side of [-1, 1]) { // toe rail along the sheer
    const curve = new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, i) => { const h = hullAt(0.02 + 0.96 * (i / 8)); return V(side * h.b * 0.97, h.sheer + 0.002, h.z); }));
    add(M.timber, '#3e2414', new THREE.TubeGeometry(curve, 14, 0.0028, 3, false));
  }
  // cabin trunk and cockpit coaming (production proportions)
  const hc = hullAt(0.4);
  add(M.timber, '#8a5a34', softBox(0.046, 0.022, 0.06, 0.003, 1, 1).translate(0, hc.sheer + 0.011, -0.03));
  add(M.timber, '#6e4327', new THREE.BoxGeometry(0.05, 0.012, 0.004).translate(0, hullAt(0.28).sheer + 0.006, -0.08));
  // rig, as the production model: mast, boom, bowsprit, collar, the mainsail, four lines
  const mz = 0.04, deckM = hullAt(0.5 + mz / HULL.L).sheer, top = deckM + 0.4, bowT = hullAt(1);
  add(M.timber, SL.spar, rodBetween(V(0, deckM - 0.01, mz), V(0, top, mz), 0.006, 0.0042, 6));
  add(M.timber, SL.spar, rodBetween(V(0, deckM + 0.05, mz), V(0, deckM + 0.055, -0.15), 0.0036, 0.003, 5));
  add(M.timber, SL.spar, rodBetween(V(0, bowT.sheer - 0.004, HULL.L / 2 - 0.012), V(0, bowT.sheer + 0.006, HULL.L / 2 + 0.05), 0.003, 0.0025, 5));
  add(M.brass, SL.brass, rodBetween(V(0, deckM - 0.002, mz), V(0, deckM + 0.014, mz), 0.0095, 0.0095, 8));
  const sail = new THREE.BufferGeometry(), A = V(0, deckM + 0.06, mz - 0.006), B = V(0, top - 0.015, mz - 0.006), C = V(0, deckM + 0.06, -0.145), sp: number[] = [];
  for (const sd of [1, -1]) { const q = [A, B, C].map((v) => v.clone().setX(sd * 0.0012)); (sd > 0 ? [q[0], q[2], q[1]] : [q[0], q[1], q[2]]).forEach((v) => sp.push(v.x, v.y, v.z)); }
  sail.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  sail.computeVertexNormals();
  add(M.paint, SL.sail, sail);
  const hm = hullAt(0.5 + mz / HULL.L);
  for (const [f, t] of [[V(0, top, mz), V(0, bowT.sheer + 0.006, HULL.L / 2 + 0.045)], [V(0, top - 0.08, mz), V(hm.b * 0.92, hm.sheer, mz - 0.012)], [V(0, top - 0.08, mz), V(-hm.b * 0.92, hm.sheer, mz - 0.012)], [V(0, top, mz), V(0, hullAt(0).sheer + 0.003, -HULL.L / 2 + 0.006)]] as [THREE.Vector3, THREE.Vector3][])
    add(M.paint, SL.rig, rodBetween(f, t, 0.0011, 0.0011, 3, true));
  a.end();
  return { tris, w: 0.09 * s, h: (top + 0.0) * s, len: (HULL.L + 0.05) * s };
}

/** Track 01 3D candidates: id → builder, cost class (Track 01 §9) and authored size at s = 1. */
export const T01_BUILDERS = {
  'FLW-S3-014': { build: buildSwallows, mount: 'wall' as const, cls: 'hero' as const, size: '1.73 × 0.60 m group' },
  'FLW-S3-017': { build: buildMedallion, mount: 'wall' as const, cls: 'medium identity' as const, size: 'Ø 0.58 m (× s)' },
  'FLW-S3-016': { build: buildMoon, mount: 'surface' as const, cls: 'medium identity' as const, size: '≈ 0.33 m overall' },
  'FLW-S3-015': { build: buildSloop, mount: 'surface' as const, cls: 'medium identity' as const, size: '0.36 m hull, ≈ 0.57 m to the masthead' },
};
