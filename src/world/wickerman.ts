// DEV-04B Wickerman figure (wickerman_clearing_sheet_v01 + the willow-sculpture references): a human-scale willow
// figure built the way such figures are built — a readable armature of thick uprights (bundled legs, an elliptical cage
// of torso staves, a shoulder yoke, bent arms, a neck), thinner willow bands woven round it at irregular spacing and
// tilt (not a regular trellis grid), diagonal wraps on the limbs, twine bindings at every joint, splayed willow
// fingers, a woven head cage, and feet lashed into timber shoes bolted to the sleepers. One merged geometry with baked
// vertex colours (keepColor), local space: y up from the top of the sleepers, the figure facing −z.
// The cage is packed with hay (lumpy volumes inside the weave, wisps through the gaps).
// Pure geometry: tests/dev04b.test.ts checks the fill is finite and sits inside the cage. Fire states are DEV-04C.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { taperTube } from './woodkit';
import { toAtlas } from './propkit';
import { mulberry32 } from '../core/rng';

type P3 = [number, number, number];
const WILLOW = ['#7a5e48', '#6e5238', '#86684c', '#64381c', '#8a6e50'];
const TWINE = '#3e3226';
const HAY = ['#c4a862', '#b39552', '#cdb676', '#a8894a'];
const HAY_TINT = ['#ffffff', '#f2eadc', '#fff6e0', '#e8ddc8'];

/** Joint positions of the figure (local, metres): used by the builder and the tests. */
export const WICKER = {
  ankle: 0.14, knee: 0.66, hip: 1.18, waist: 1.45, chest: 1.86, shoulder: 2.2, neck: 2.36, head: 2.64, headR: 0.21,
  footX: 0.26, hipX: 0.19, shoulderX: 0.4, elbow: [0.86, 1.74] as const, wrist: [1.08, 1.34] as const,
};

/** The hay volumes of the last `wickermanGeo` build (tests: closed, inside the cage). */
export const wickerHay: THREE.BufferGeometry[] = [];

export function wickermanGeo(seed = 404) {
  const r = mulberry32(seed), parts: THREE.BufferGeometry[] = [];
  const colour = (g: THREE.BufferGeometry, hex: string, k = 1) => {
    const c = new THREE.Color(hex).multiplyScalar(k), n = g.attributes.position.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const v = 0.9 + ((i * 7) % 11) / 55; a[i * 3] = c.r * v; a[i * 3 + 1] = c.g * v; a[i * 3 + 2] = c.b * v; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    return g;
  };
  // a rod along a polyline, faces turned outward (taperTube winds inward), closed with blunt ends
  const rod = (pts: P3[], r0: number, r1: number, hex = WILLOW[Math.floor(r() * WILLOW.length)], radial = 5) => {
    const g = taperTube(pts, [r0 * 1.35, r1 * 1.35], { radial, rows: Math.max(2, pts.length * 2 - 1) }); // willow reads thicker at clearing distance
    const ix = g.index!.array as Uint16Array | Uint32Array;
    for (let t = 0; t < ix.length; t += 3) { const a = ix[t + 1]; ix[t + 1] = ix[t + 2]; ix[t + 2] = a; }
    g.computeVertexNormals();
    parts.push(colour(g, hex, 0.9 + r() * 0.2));
  };
  // a woven band: an irregular loop of willow round an ellipse (rx, rz) at height y, wobbling and tilted
  const band = (cx: number, y: number, cz: number, rx: number, rz: number, th = 0.014, tilt = 0.12, hex?: string, n = 12) => {
    const ph = r() * 6.28, tx = (r() - 0.5) * tilt, tz = (r() - 0.5) * tilt, pts: P3[] = [];
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2 + ph, k = 1 + (r() - 0.5) * 0.08;
      const x = Math.cos(a) * rx * k, z = Math.sin(a) * rz * k;
      pts.push([cx + x, y + x * tx + z * tz + (r() - 0.5) * 0.01, cz + z]);
    }
    pts[n] = [...pts[0]] as P3;
    rod(pts, th, th, hex, 4);
  };
  const lerp3 = (a: P3, b: P3, t: number): P3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const J = WICKER;
  for (const sd of [-1, 1]) {
    // legs: three uprights each, from the shoe to the hip, a little apart at the knee
    const ankle: P3 = [sd * J.footX, J.ankle, 0], knee: P3 = [sd * (J.footX * 0.85 + J.hipX * 0.15), J.knee, -0.02], hip: P3 = [sd * J.hipX, J.hip, 0];
    for (let q = 0; q < 3; q++) {
      const a = (q / 3) * Math.PI * 2 + 0.4, o = (p: P3, s: number): P3 => [p[0] + Math.cos(a) * s, p[1], p[2] + Math.sin(a) * s];
      rod([o(ankle, 0.045), o(knee, 0.06), o(hip, 0.07)], 0.028, 0.024);
    }
    for (let t = 0.12; t < 0.95; t += 0.11 + r() * 0.07) { const p = lerp3(lerp3(ankle, knee, Math.min(1, t * 2)), lerp3(knee, hip, Math.max(0, t * 2 - 1)), t < 0.5 ? 0 : 1); band(p[0], p[1], p[2], 0.1 + t * 0.02, 0.09, 0.012, 0.3); }
    rod([[ankle[0] - 0.08, ankle[1] + 0.05, 0.08], [ankle[0], ankle[1] + 0.35, -0.08], [knee[0] + 0.07, knee[1] + 0.2, 0.06]], 0.011, 0.01); // diagonal wrap
    band(ankle[0], ankle[1] + 0.03, 0, 0.085, 0.08, 0.02, 0.05, TWINE); // bindings: ankle, knee, hip
    band(knee[0], knee[1], knee[2], 0.1, 0.09, 0.02, 0.05, TWINE);
    // arms: two rods shoulder → elbow → wrist (bent), bands and bindings, fingers splayed from the wrist
    const sh: P3 = [sd * J.shoulderX, J.shoulder - 0.06, 0], el: P3 = [sd * J.elbow[0], J.elbow[1], -0.06], wr: P3 = [sd * J.wrist[0], J.wrist[1], -0.04];
    for (const o of [-0.035, 0.035]) rod([[sh[0], sh[1] + o, sh[2] + o * 0.5], [el[0], el[1] + o, el[2]], [wr[0], wr[1] + o * 0.6, wr[2]]], 0.026, 0.018);
    for (const [a, b] of [[sh, el], [el, wr]] as const) for (let t = 0.2; t < 0.9; t += 0.24 + r() * 0.06) { const p = lerp3(a, b, t); band(p[0], p[1], p[2], 0.065, 0.065, 0.01, 0.6); }
    band(el[0], el[1], el[2], 0.07, 0.07, 0.018, 0.4, TWINE); band(wr[0], wr[1] + 0.04, wr[2], 0.055, 0.055, 0.016, 0.5, TWINE);
    for (let f = 0; f < 5; f++) { const a = -0.9 + f * 0.42; rod([[wr[0], wr[1], wr[2]], [wr[0] + sd * (0.08 + Math.cos(a) * 0.05), wr[1] - 0.16 - Math.abs(Math.sin(a)) * 0.04, wr[2] + Math.sin(a) * 0.09]], 0.012, 0.006, undefined, 4); }
  }
  // torso: eight staves on an ellipse from the hips to the shoulders (bulging at the chest), bands woven round them
  const ell = (y: number) => { const t = (y - J.hip) / (J.shoulder - J.hip); return [0.27 + 0.08 * Math.sin(t * Math.PI * 0.85), 0.16 + 0.05 * Math.sin(t * Math.PI)] as const; };
  for (let q = 0; q < 8; q++) {
    const a = (q / 8) * Math.PI * 2 + 0.2, pts: P3[] = [];
    for (const y of [J.hip, J.waist, J.chest, J.shoulder]) { const [ex, ez] = ell(y); pts.push([Math.cos(a) * ex, y, Math.sin(a) * ez]); }
    rod(pts, 0.03, 0.026);
  }
  for (let y = J.hip + 0.06; y < J.shoulder; y += 0.09 + r() * 0.07) { const [ex, ez] = ell(y); band(0, y, 0, ex + 0.012, ez + 0.012, 0.013, 0.12); }
  for (const s2 of [-1, 1]) rod([[s2 * 0.26, J.hip + 0.05, -0.16], [0, J.chest, -0.21], [-s2 * 0.3, J.shoulder - 0.1, -0.17]], 0.011, 0.011); // cross wraps on the chest
  band(0, J.hip, 0, 0.3, 0.18, 0.022, 0.04, TWINE); // the belt binding the legs into the torso
  // shoulder yoke through the top of the cage, carrying the arms; bound at both ends
  rod([[-J.shoulderX - 0.05, J.shoulder - 0.04, 0], [J.shoulderX + 0.05, J.shoulder - 0.04, 0]], 0.04, 0.04, '#5a4430', 6);
  for (const sd of [-1, 1]) band(sd * J.shoulderX, J.shoulder - 0.05, 0, 0.06, 0.06, 0.02, 0.3, TWINE);
  // neck: three rods from the yoke into the head; the head a woven cage (hoops + meridians)
  for (let q = 0; q < 3; q++) { const a = (q / 3) * Math.PI * 2; rod([[Math.cos(a) * 0.06, J.shoulder - 0.08, Math.sin(a) * 0.05], [Math.cos(a) * 0.05, J.head - 0.1, Math.sin(a) * 0.045]], 0.02, 0.016); }
  band(0, J.neck, 0, 0.07, 0.065, 0.018, 0.05, TWINE);
  const R = J.headR;
  for (let q = -2; q <= 2; q++) { const y = J.head + q * R * 0.36, rr = Math.sqrt(Math.max(0.01, 1 - (q * 0.36) ** 2)) * R; band(0, y, 0, rr, rr * 0.88, 0.012, 0.15); }
  for (let q = 0; q < 4; q++) { const a = (q / 4) * Math.PI, pts: P3[] = []; for (let i = 0; i <= 8; i++) { const t = -Math.PI / 2 + (i / 8) * Math.PI; pts.push([Math.cos(a) * Math.cos(t) * R, J.head + Math.sin(t) * R * 1.12, Math.sin(a) * Math.cos(t) * R * 0.88]); } rod(pts, 0.012, 0.012); }
  for (let q = 0; q < 6; q++) { const a = q * 1.05; rod([[Math.cos(a) * 0.05, J.head + R * 0.95, Math.sin(a) * 0.04], [Math.cos(a) * 0.14, J.head + R * 1.55, Math.sin(a) * 0.1]], 0.01, 0.004, '#8a6e50', 4); } // willow ends sprouting from the crown
  // ---- the hay packed into the cage: lumpy closed volumes just inside the staves and bands (the weave reads over
  // them), straw wisps poking out through the gaps. Fire states (DEV-04C) will burn this; here it is only seen.
  const lumpy = (gg: THREE.BufferGeometry, amp: number) => { // deterministic per position, so seam vertices stay welded
    const p = gg.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = Math.sin(x * 23.1 + y * 7.7) * Math.sin(z * 19.3 - y * 11.9) + 0.5 * Math.sin((x - z) * 31.7 + y * 17.3);
      p.setXYZ(i, x * (1 + amp * n), y, z * (1 + amp * n));
    }
    return gg;
  };
  const hayVolumes: THREE.BufferGeometry[] = [];
  // straw is mottled, not a flat colour: every vertex gets its own shade (light stalks, darker packed hollows)
  const hash = (x: number, y: number, z: number) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); };
  const strawColour = (gg: THREE.BufferGeometry, hex: string) => { // a tint over the straw sheet of the prop atlas
    const c = new THREE.Color(hex), p = gg.attributes.position as THREE.BufferAttribute, a = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const k = 0.86 + 0.24 * hash(p.getX(i), p.getY(i), p.getZ(i)); a[i * 3] = c.r * k; a[i * 3 + 1] = c.g * k; a[i * 3 + 2] = c.b * k; }
    gg.setAttribute('color', new THREE.BufferAttribute(a, 3));
    return gg;
  };
  const pushHay = (gg: THREE.BufferGeometry) => { gg.computeVertexNormals(); hayVolumes.push(strawColour(gg, HAY_TINT[Math.floor(r() * HAY_TINT.length)])); };
  // a lump of hay along a limb segment a → b (an ellipsoid with a bulging, uneven skin)
  const lump = (a: P3, b: P3, rad: number, w = 8, h = 6) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
    const gg = lumpy(new THREE.SphereGeometry(1, w, h).scale(rad, len / 2 + rad * 0.35, rad), 0.18);
    gg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
    gg.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
    pushHay(gg);
  };
  // torso: a lathe following the cage's ellipse at 0.88 of the stave radius, closed at hip and shoulder
  { const prof: THREE.Vector2[] = [new THREE.Vector2(0, J.hip - 0.05)];
    for (let i = 0; i <= 7; i++) { const y = J.hip + ((J.shoulder - J.hip) * i) / 7; prof.push(new THREE.Vector2(ell(y)[0] * (i === 0 || i === 7 ? 0.7 : 0.88), y)); }
    prof.push(new THREE.Vector2(0, J.shoulder + 0.03));
    const gg = lumpy(new THREE.LatheGeometry(prof, 12), 0.1), p = gg.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i), [ex, ez] = ell(THREE.MathUtils.clamp(y, J.hip, J.shoulder)); p.setZ(i, (p.getZ(i) * ez) / ex); }
    pushHay(gg); }
  for (const sd of [-1, 1]) {
    const ankle: P3 = [sd * J.footX, J.ankle + 0.035, 0], knee: P3 = [sd * (J.footX * 0.85 + J.hipX * 0.15), J.knee, -0.02], hip: P3 = [sd * J.hipX, J.hip + 0.02, 0];
    lump(ankle, knee, 0.07); lump(knee, hip, 0.08);
    const sh: P3 = [sd * (J.shoulderX - 0.04), J.shoulder - 0.06, 0], el: P3 = [sd * J.elbow[0], J.elbow[1], -0.06], wr: P3 = [sd * J.wrist[0], J.wrist[1] + 0.02, -0.04];
    lump(sh, el, 0.045); lump(el, wr, 0.04);
  }
  lump([0, J.shoulder - 0.06, 0], [0, J.head - 0.14, 0], 0.045); // neck
  { const gg = lumpy(new THREE.SphereGeometry(1, 10, 8).scale(J.headR * 0.84, J.headR * 0.92, J.headR * 0.74), 0.1); gg.translate(0, J.head, 0); pushHay(gg); }
  // wisps: thin three-sided straws from just under the hay skin, outward and a little down, in small bunches
  const straw = (o: P3, dir: THREE.Vector3, len: number) => {
    const gg = new THREE.ConeGeometry(0.008, len, 3, 1).translate(0, len / 2, 0);
    gg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()));
    gg.translate(...o);
    parts.push(colour(gg, HAY[Math.floor(r() * HAY.length)], 1.08 + r() * 0.12));
  };
  const bunch = (o: P3, out: THREE.Vector3, n = 4) => {
    for (let q = 0; q < n; q++) straw(o, out.clone().add(new THREE.Vector3((r() - 0.5) * 0.8, -0.2 - r() * 0.35, (r() - 0.5) * 0.8)), 0.1 + r() * 0.1);
  };
  for (let q = 0; q < 26; q++) { // torso
    const y = J.hip + 0.1 + r() * (J.shoulder - J.hip - 0.18), a = r() * Math.PI * 2, [ex, ez] = ell(y);
    bunch([Math.cos(a) * ex * 0.84, y, Math.sin(a) * ez * 0.84], new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
  }
  for (const sd of [-1, 1]) {
    for (let q = 0; q < 5; q++) { const t = 0.12 + q * 0.18, y = J.ankle + (J.hip - J.ankle) * t, x = sd * (J.footX + (J.hipX - J.footX) * t), a = r() * Math.PI * 2; bunch([x + Math.cos(a) * 0.06, y, Math.sin(a) * 0.06], new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), 2); }
    bunch([sd * J.wrist[0], J.wrist[1] + 0.03, -0.04], new THREE.Vector3(sd, -0.6, 0), 3); // straw out of the cuffs
    bunch([sd * J.elbow[0], J.elbow[1], -0.06], new THREE.Vector3(sd * 0.3, 0.2, -1), 2);
  }
  for (let q = 0; q < 5; q++) { const a = q * 1.26 + 0.3; bunch([Math.cos(a) * J.headR * 0.7, J.head + J.headR * 0.4, Math.sin(a) * J.headR * 0.6], new THREE.Vector3(Math.cos(a), 0.9, Math.sin(a)), 2); } // under the crown
  const g = mergeGeometries(parts.map((p) => { if (p.attributes.uv) p.deleteAttribute('uv'); return p; }))!;
  wickerHay.length = 0; wickerHay.push(...hayVolumes);
  // the hay is its own geometry on the prop atlas (straw sheet): the textured stalks are what make it read as hay
  const hay = toAtlas(mergeGeometries(hayVolumes.map((h) => h.clone()))!, 'straw');
  hay.userData.keepColor = true;
  g.userData.hay = hay;
  parts.forEach((p) => p.dispose());
  g.userData.keepColor = true;
  g.computeBoundingBox();
  return g;
}
