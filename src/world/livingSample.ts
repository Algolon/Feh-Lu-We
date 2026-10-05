// Art-refresh step 2: the living-room hearth corner, rebuilt with the art kit (src/world/artkit.ts).
// Built only when ART.set === 'sample' (review mode or ?art=sample); otherwise manor.ts builds the original room.
// Gameplay contract kept identical to the original room: same collision calls and footprints, same interaction
// ids, hitboxes, light ids, mantel slot positions/order, memory photo and floor-lamp behaviour.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { World, GameApi } from '../interactions/world';
import type { Ctx } from './arch';
import type { HearthOpts } from './hearth';
import { Asm, artMats, softBox, cushion, lathe, moulding, projectUV, bake, baseAO, ContactShadows, type ArtMats } from './artkit';
import { v3, compound, box, getKit } from './kit';
import { makeLamp, makeInspect, place } from '../interactions/props';
import { bookshelf, plant, painting } from './furniture';
import { MANTEL, mantelSlots } from '../content/canon';
import { GF, CEIL } from './layout';

// ------------------------------------------------------------------------------------------------ palette
// Base material colours (albedo before lighting). Shading comes from light + baked occlusion, so these are
// NOT "lit/mid/shade" variants; texture maps are near-white value maps that only modulate them slightly.
export const LIV = {
  sofa: '#62704a', // moss velvet
  chair: '#b3813f', // ochre velvet (the lively accent next to the fire)
  pillowA: '#b06a5a', pillowB: '#c9a25a',
  frameWood: '#4e3320', // walnut feet and rails
  tableWood: '#7e5636', // oak
  shelfWood: '#6a4429',
  beam: '#4a3121',
  skirting: '#4e3320',
  joinery: '#e2d6bc', // painted window linings and architraves
  sillWood: '#8a6240',
  stone: '#d2c3a2', // sandstone surround
  hearthSlab: '#a99b80',
  firebox: '#4b3b31',
  breast: '#e4d6ba',
  brass: '#c9a14e',
  iron: '#2f2c2a',
  curtain: '#7a2e2a',
  shade: '#e4d6b6',
};

// ------------------------------------------------------------------------------------------------ furniture
const footGeo = () => lathe([[0, 0], [0.024, 0], [0.028, 0.012], [0.022, 0.05], [0.03, 0.075], [0.034, 0.09], [0, 0.09]], 10);

/**
 * Upholstered seat (armchair when seats = 1, sofa when seats = 3): turned feet, an upholstered base, crowned
 * seat cushions, a raked back with an arched top, loose back cushions and rolled arms with piped scroll fronts.
 * Origin = floor centre of the footprint, facing heading `yaw`.
 */
export function upholstered(c: Ctx, sh: ContactShadows, x: number, z: number, y0: number, yaw: number, o: { width: number; depth?: number; seats: number; color: string; pillows?: string[]; shadowY?: number }) {
  const M = artMats();
  const a = new Asm(c.b, c.chunk, x, y0, z, yaw);
  const W = o.width, D = o.depth ?? 0.86, armW = 0.15, footH = 0.09;
  const col = new THREE.Color(o.color);
  const dark = col.clone().multiplyScalar(0.72);
  // feet (walnut, turned) under the corners
  const fg = footGeo();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(M.timber, LIV.frameWood, fg, sx * (W / 2 - 0.07), 0, sz * (D / 2 - 0.07));
  fg.dispose();
  // upholstered base: darker toward the floor (contact), a piped top edge
  const baseH = 0.27;
  const base = bake(projectUV(softBox(W - 0.02, baseH, D - 0.04, 0.035), 0.25), baseAO(-baseH / 2, 0.16, 0.66));
  a.add(M.upholstery, col, base, 0, footH + baseH / 2, 0.01);
  base.dispose();
  // seat cushions
  const innerW = W - 2 * armW - 0.01;
  const seatW = innerW / o.seats;
  const seatD = D - 0.18, seatH = 0.12, seatY = footH + baseH;
  const sc = bake(projectUV(cushion(seatW - 0.012, seatH, seatD, 0.045, 0.025), 0.25), (p) => (p.y < -seatH / 2 + 0.02 ? 0.72 : 1));
  const seatZ = D / 2 - 0.02 - seatD / 2; // front edge 2 cm behind the base front, back edge on the back frame
  for (let i = 0; i < o.seats; i++) a.add(M.upholstery, col, sc, -innerW / 2 + seatW * (i + 0.5), seatY + seatH / 2, seatZ);
  sc.dispose();
  // piping along each seat front
  const pipe = new THREE.CylinderGeometry(0.008, 0.008, 1, 6).rotateZ(Math.PI / 2);
  // on the rounded front-top edge of each cushion (45° point of the 4.5 cm edge radius)
  for (let i = 0; i < o.seats; i++) a.add(M.upholstery, dark, pipe, -innerW / 2 + seatW * (i + 0.5), seatY + seatH - 0.013, D / 2 - 0.02 - 0.013, { s: [seatW - 0.07, 1, 1] });
  // the outer back: arched top, raked back ~7°
  const backH = 0.62, backT = 0.16;
  const back = deformArch(bake(projectUV(softBox(W, backH, backT, 0.05), 0.25), baseAO(-backH / 2, 0.2, 0.8)), W / 2, backH / 2, 0.04);
  a.add(M.upholstery, col, back, 0, seatY + backH / 2 - 0.02, -(D / 2 - backT / 2), { rx: 0.12 });
  back.dispose();
  // loose back cushions, leaning further back
  const bcH = 0.42, bcT = 0.14;
  const bc = bake(projectUV(cushion(seatW - 0.014, bcH, bcT, 0.05, 0.03, 'front'), 0.25), (p) => (p.y < -bcH / 2 + 0.05 ? 0.8 : 1));
  for (let i = 0; i < o.seats; i++) a.add(M.upholstery, col, bc, -innerW / 2 + seatW * (i + 0.5), seatY + seatH + bcH / 2 - 0.01, -(D / 2 - backT - bcT / 2 + 0.035), { rx: 0.2 });
  bc.dispose();
  // rolled arms: a body, the roll, and a piped scroll front
  const armH = 0.47, rollR = 0.075;
  const armBody = bake(projectUV(softBox(armW, armH, D - 0.06, 0.04), 0.25), baseAO(-armH / 2, 0.16, 0.7));
  const roll = projectUV(new THREE.CylinderGeometry(rollR, rollR, D - 0.08, 16).rotateX(Math.PI / 2), 0.25);
  const scroll = new THREE.CylinderGeometry(rollR + 0.006, rollR + 0.006, 0.02, 18).rotateX(Math.PI / 2);
  const pipeRing = new THREE.TorusGeometry(rollR + 0.004, 0.0075, 6, 22);
  for (const sx of [-1, 1]) {
    const ax = sx * (W / 2 - armW / 2);
    a.add(M.upholstery, col, armBody, ax, footH + armH / 2 + 0.01, 0);
    a.add(M.upholstery, col, roll, ax + sx * 0.012, footH + armH + 0.03, 0.01);
    a.add(M.upholstery, col.clone().multiplyScalar(0.93), scroll, ax + sx * 0.012, footH + armH + 0.03, D / 2 - 0.04 + 0.01);
    a.add(M.upholstery, dark, pipeRing, ax + sx * 0.012, footH + armH + 0.03, D / 2 - 0.035 + 0.012);
  }
  armBody.dispose(); roll.dispose(); scroll.dispose(); pipeRing.dispose(); pipe.dispose();
  // throw pillows (sofa only), tilted into the corners
  if (o.pillows) {
    const pg = projectUV(cushion(0.4, 0.38, 0.12, 0.05, 0.04, 'front'), 0.25);
    o.pillows.forEach((pc, i) => {
      const sx = i ? 1 : -1;
      a.add(M.upholstery, pc, pg, sx * (innerW / 2 - 0.24), seatY + seatH + 0.2, -(D / 2 - backT - 0.2), { rx: 0.32, ry: -sx * 0.32, rz: sx * 0.12 });
    });
    pg.dispose();
  }
  sh.add(x, o.shadowY ?? y0 + 0.004, z, W + 0.36, D + 0.36, yaw, 0.9);
}

/** Arched top: lift the top vertices by `lift` in the middle (smooth falloff to the corners). */
function deformArch(g: THREE.BufferGeometry, hx: number, hy: number, lift: number) {
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    if (y > 0) p.setY(i, y + lift * (1 - (p.getX(i) / hx) ** 2) * (y / hy));
  }
  g.computeVertexNormals();
  return g;
}

/**
 * Occasional table: a top with a softened, two-step edge, an apron set back from the edge, square tapered legs
 * jointed into the apron, and (coffee table) a lower shelf on stretchers. Grain runs along the long side.
 */
export function occasionalTable(c: Ctx, sh: ContactShadows, x: number, z: number, y0: number, w: number, d: number, h: number, yaw = 0, shelf = false, shadowY = y0 + 0.004) {
  const M = artMats();
  const a = new Asm(c.b, c.chunk, x, y0, z, yaw);
  const grain = d >= w ? 'z' : 'x';
  const wood = LIV.tableWood, rail = new THREE.Color(wood).multiplyScalar(0.86);
  const top = projectUV(softBox(w, 0.035, d, 0.012), 1, grain);
  a.add(M.timber, wood, top, 0, h - 0.0175, 0);
  const lip = projectUV(softBox(w - 0.03, 0.018, d - 0.03, 0.006, 1), 1, grain);
  a.add(M.timber, rail, lip, 0, h - 0.035 - 0.009, 0);
  // apron: rails set 4 cm in from the top edge
  const inset = 0.045, apH = 0.075, apY = h - 0.056 - apH / 2; // rails start just under the lip (no coplanar faces)
  const longRail = projectUV(softBox(0.022, apH, d - 2 * inset - 0.05, 0.004, 1), 1, 'z');
  const shortRail = projectUV(softBox(w - 2 * inset - 0.05, apH, 0.022, 0.004, 1), 1, 'x');
  for (const s of [-1, 1]) {
    a.add(M.timber, rail, longRail, s * (w / 2 - inset - 0.011), apY, 0);
    a.add(M.timber, rail, shortRail, 0, apY, s * (d / 2 - inset - 0.011));
  }
  longRail.dispose(); shortRail.dispose(); top.dispose(); lip.dispose();
  // square tapered legs (flat faces), slightly darker toward the floor
  const lh = h - 0.044;
  const leg0 = new THREE.LatheGeometry([new THREE.Vector2(0.001, 0), new THREE.Vector2(0.024, 0), new THREE.Vector2(0.036, lh * 0.72), new THREE.Vector2(0.036, lh), new THREE.Vector2(0.001, lh)], 4).rotateY(Math.PI / 4);
  const leg = bake(projectUV(leg0.toNonIndexed(), 1, 'y'), baseAO(0, 0.18, 0.75));
  leg.computeVertexNormals();
  leg0.dispose();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(M.timber, wood, leg, sx * (w / 2 - inset - 0.012), 0, sz * (d / 2 - inset - 0.012));
  leg.dispose();
  if (shelf) {
    const sy = 0.12;
    const st = projectUV(softBox(w - 2 * inset - 0.02, 0.02, d - 2 * inset - 0.02, 0.006, 1), 1, grain);
    a.add(M.timber, rail, st, 0, sy, 0);
    st.dispose();
  }
  sh.add(x, shadowY, z, w + 0.32, d + 0.32, yaw, shelf ? 0.65 : 0.45);
}

// ------------------------------------------------------------------------------------------------ hearth v2
/**
 * Surround + firebox + hearth for the v2 fireplace, batched into the room. Local frame (Asm): right = along the
 * wall, forward = into the room from the inner wall face. Matches the original's footprint (≤ 0.8 m deep,
 * ≤ ±1.75 m wide, shelf top at 1.33 m) so the collision box, mantel slots and fire position stay valid.
 */
export function hearthV2(c: Ctx, sh: ContactShadows, o: HearthOpts, ceil: number) {
  const M = artMats();
  const k = getKit();
  const a = new Asm(c.b, c.chunk, o.x, o.y, o.z, o.facing);
  const OPEN = 0.66, OPEN_H = 0.84, ARCH = 0.12, FRAME = 1.4, FRAME_H = 1.19, DEPTH = 0.5;
  // 1 · stone surround: one extruded frame with a segmental-arch opening and softened (bevelled) edges
  const s = new THREE.Shape();
  s.moveTo(-FRAME, 0); s.lineTo(FRAME, 0); s.lineTo(FRAME, FRAME_H); s.lineTo(-FRAME, FRAME_H); s.lineTo(-FRAME, 0);
  const hole = new THREE.Path();
  hole.moveTo(-OPEN, 0); hole.lineTo(-OPEN, OPEN_H);
  const R = (OPEN * OPEN + ARCH * ARCH) / (2 * ARCH); // circle through the springing points and the crown
  const cy = OPEN_H + ARCH - R, a0 = Math.atan2(OPEN_H - cy, -OPEN), a1 = Math.atan2(OPEN_H - cy, OPEN);
  hole.absarc(0, cy, R, a0, a1, true);
  hole.lineTo(OPEN, 0); hole.lineTo(-OPEN, 0);
  s.holes.push(hole);
  const frame = new THREE.ExtrudeGeometry(s, { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 10 });
  frame.translate(0, 0, -DEPTH - 0.02); // front cap faces -z (into the room); back sits on the wall
  projectUV(frame, 1.2, 'x');
  a.add(M.stone, LIV.stone, frame, 0, 0, 0);
  frame.dispose();
  // keystone and plinth blocks (slightly proud), impost blocks under the bed moulding
  const key = projectUV(softBox(0.22, 0.2, DEPTH + 0.05, 0.02), 1.2);
  a.add(M.stone, '#c9b994', key, 0, OPEN_H + ARCH + 0.09, (DEPTH + 0.05) / 2); // bottom flush with the arch crown
  key.dispose();
  const plinth = bake(projectUV(softBox(FRAME - OPEN + 0.06, 0.16, DEPTH + 0.1, 0.02), 1.2), baseAO(-0.08, 0.1, 0.72));
  for (const sx of [-1, 1]) a.add(M.stone, '#c7b796', plinth, sx * (OPEN + (FRAME - OPEN) / 2), 0.08, (DEPTH + 0.1) / 2);
  plinth.dispose();
  // 2 · bed moulding (cove) under the shelf, across the surround
  const cove = moulding([[0, -0.07], [DEPTH + 0.06, -0.07], [DEPTH + 0.075, -0.06], [DEPTH + 0.09, -0.035], [DEPTH + 0.1, 0], [0, 0]], 2 * FRAME + 0.12);
  projectUV(cove, 1.2);
  a.add(M.stone, '#cbbb98', cove, 0, FRAME_H + 0.02, 0);
  cove.dispose();
  // 3 · oak mantel shelf: flat fascia (the reading plaque sits on it) with a rounded top edge
  const shelf = moulding([[0, 0], [0.78, 0], [0.8, 0.012], [0.8, 0.09], [0.812, 0.096], [0.82, 0.107], [0.815, 0.116], [0.8, 0.12], [0, 0.12]], 3.44);
  projectUV(shelf, 1, 'x');
  a.add(M.timber, LIV.shelfWood, shelf, 0, 1.21, 0);
  shelf.dispose();
  // corbels: scrolled oak brackets carrying the shelf ends beyond the surround
  const cs = new THREE.Shape();
  cs.moveTo(0, 0); cs.lineTo(0.62, 0); cs.quadraticCurveTo(0.6, -0.1, 0.42, -0.14); cs.quadraticCurveTo(0.14, -0.18, 0.1, -0.34); cs.lineTo(0, -0.34); cs.lineTo(0, 0);
  const corbel = new THREE.ExtrudeGeometry(cs, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1, curveSegments: 8 });
  corbel.rotateY(Math.PI / 2).translate(-0.06, 0, 0); // shape x → forward (-z), extrusion → +x
  projectUV(corbel, 1, 'z');
  for (const sx of [-1, 1]) a.add(M.timber, LIV.shelfWood, corbel, sx * (FRAME + 0.16), 1.21, 0);
  corbel.dispose();
  // 4 · chimney breast (plaster) with a small cornice where it meets the ceiling
  const bH = ceil - o.y - 1.33;
  const breast = projectUV(softBox(2.56, bH, 0.3, 0.015, 1), 2);
  a.add(k.M.plaster, LIV.breast, breast, 0, 1.33 + bH / 2, 0.15);
  breast.dispose();
  const crown = moulding([[0, 0], [0.33, 0], [0.33, -0.03], [0.31, -0.06], [0.3, -0.08], [0, -0.08]], 2.62);
  a.add(M.paint, LIV.joinery, crown, 0, ceil - o.y, 0);
  crown.dispose();
  // 5 · firebox: dark back, splayed cheeks and a sloping throat, soot-darkened upward
  const soot = (p: THREE.Vector3) => 1 - 0.55 * THREE.MathUtils.smoothstep(p.y, -0.3, 0.5);
  const backWall = bake(projectUV(softBox(1.1, 1.0, 0.04, 0.005, 1), 1.2), soot);
  a.add(M.stone, LIV.firebox, backWall, 0, 0.5, 0.04);
  backWall.dispose();
  const cheek = bake(projectUV(softBox(0.03, 0.92, 0.5, 0.005, 1), 1.2), soot);
  for (const sx of [-1, 1]) a.add(M.stone, LIV.firebox, cheek, sx * 0.605, 0.46, 0.29, { ry: sx * 0.22 });
  cheek.dispose();
  const throat = bake(softBox(1.3, 0.03, 0.5, 0.005, 1), () => 0.4);
  a.add(M.stone, LIV.firebox, throat, 0, OPEN_H + 0.08, 0.3, { rx: -0.35 });
  throat.dispose();
  // 6 · hearth: a raised slab projecting into the room, and the darker fire floor inside the opening
  const slab = bake(projectUV(softBox(3.1, 0.06, 1.16, 0.014), 1.2), baseAO(-0.03, 0.04, 0.8));
  a.add(M.stone, LIV.hearthSlab, slab, 0, 0.03, 0.58);
  slab.dispose();
  const floorIn = softBox(1.24, 0.012, 0.5, 0.004, 1);
  a.add(M.stone, '#3a2c24', floorIn, 0, 0.066, 0.28);
  floorIn.dispose();
  // 7 · iron grate and andirons with brass finials, logs with pale cut ends
  const bar = new THREE.CylinderGeometry(0.012, 0.012, 1, 6).rotateZ(Math.PI / 2);
  a.add(M.paint, LIV.iron, bar, 0, 0.16, 0.47, { s: [0.86, 1, 1] });
  a.add(M.paint, LIV.iron, bar, 0, 0.08, 0.47, { s: [0.86, 1, 1] });
  bar.dispose();
  const post = new THREE.CylinderGeometry(0.016, 0.022, 0.3, 8);
  const finial = lathe([[0, 0], [0.02, 0.004], [0.032, 0.03], [0.02, 0.055], [0.008, 0.062], [0.012, 0.075], [0, 0.082]], 12);
  for (const sx of [-1, 1]) {
    a.add(M.paint, LIV.iron, post, sx * 0.36, 0.21, 0.5);
    a.add(M.brass, LIV.brass, finial, sx * 0.36, 0.36, 0.5);
  }
  post.dispose(); finial.dispose();
  const log = new THREE.CylinderGeometry(1, 1, 1, 9).rotateZ(Math.PI / 2);
  const endCap = new THREE.CylinderGeometry(1, 1, 1, 9).rotateZ(Math.PI / 2);
  const logs: [number, number, number, number, number, number][] = [ // x, y, z, r, len, yaw
    [0, 0.13, 0.22, 0.062, 0.78, 0.18], [0.02, 0.13, 0.36, 0.058, 0.72, -0.22], [-0.04, 0.24, 0.29, 0.052, 0.62, 0.05],
  ];
  for (const [lx, ly, lz, r, len, ry] of logs) {
    a.add(k.M.bark, '#5e4030', log, lx, ly, lz, { s: [len, r, r], ry });
    for (const e of [-1, 1]) a.add(M.timber, '#b48a5c', endCap, lx + Math.cos(ry) * e * len / 2, ly, lz + Math.sin(ry) * e * len / 2 * -1, { s: [0.012, r * 0.92, r * 0.92], ry });
  }
  log.dispose(); endCap.dispose();
  // grounding: the surround's foot on the slab, the slab on the floor
  sh.add(o.x + Math.sin(o.facing) * 0.6, o.y + 0.064, o.z + Math.cos(o.facing) * 0.6, 2.9, 0.22, o.facing, 0.45);
  sh.add(o.x + Math.sin(o.facing) * 0.6, o.y + 0.004, o.z + Math.cos(o.facing) * 0.6, 3.3, 1.35, o.facing, 0.5);
}

/** Glowing ember bed under the logs: part of the fire visual (toggles with it, never a static glow). */
export function embers(fire: THREE.Object3D, w: World) {
  const r = (i: number) => ((i * 9301 + 49297) % 233280) / 233280;
  const parts: THREE.BufferGeometry[] = [];
  const hot = new THREE.Color('#e0662a'), dim = new THREE.Color('#7a2a12');
  for (let i = 0; i < 16; i++) {
    const a = r(i) * Math.PI * 2, d = 0.06 + r(i + 7) * 0.22;
    const g = new THREE.IcosahedronGeometry(1, 0).toNonIndexed();
    g.scale(0.03 + r(i + 3) * 0.025, 0.012, 0.03 + r(i + 5) * 0.02).rotateY(a).translate(Math.cos(a) * d * 0.5, -0.02, Math.sin(a) * d * 1.4);
    const c = i % 3 ? hot : dim, n = g.attributes.position.count;
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).map((_, k) => [c.r, c.g, c.b][k % 3]), 3));
    g.deleteAttribute('uv');
    parts.push(g);
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((g) => g.dispose());
  // one mesh, child of the fire group: it shows and hides with the flames
  fire.add(new THREE.Mesh(merged, w.material(new THREE.MeshBasicMaterial({ vertexColors: true }))));
}

// ------------------------------------------------------------------------------------------------ mantel v2
/**
 * The mantel evidence in the v2 style, batched into the room. Same slots, same order, same bases semantics:
 * three IDENTICAL brass stands (turned, with a highlight no other base has) under feather · pinecone · cup;
 * the decoys keep visibly different bases (pewter dish, wooden plinth, lace doily).
 */
export function mantelV2(c: Ctx, o: HearthOpts, centre: { x: number; z: number }) {
  const M = artMats();
  const k = getKit();
  const top = o.y + 1.33;
  const slots = mantelSlots(centre.x, centre.z, o.facing, 0.56);
  const S = 1.45;
  const face = o.facing;
  const sc = (pts: [number, number][]) => pts.map(([r, h]) => [r * S, h * S]) as [number, number][];
  const stand = lathe(sc([[0, 0], [0.062, 0], [0.065, 0.005], [0.06, 0.012], [0.034, 0.016], [0.02, 0.022], [0.014, 0.034], [0.022, 0.04], [0.014, 0.046], [0.016, 0.054], [0.046, 0.06], [0.052, 0.066], [0.05, 0.07], [0, 0.07]]), 18);
  MANTEL.forEach((m, i) => {
    const { x, z } = slots[i];
    const a = new Asm(c.b, c.chunk, x, top, z, face);
    let y = 0;
    if (m.base === 'brass') { a.add(M.brass, LIV.brass, stand, 0, 0, 0); y = 0.07 * S; }
    else if (m.base === 'tin') { const d = lathe(sc([[0, 0], [0.08, 0], [0.086, 0.01], [0.082, 0.014], [0.07, 0.006], [0, 0.006]]), 18); a.add(M.paint, '#a7abb0', d, 0, 0, 0); d.dispose(); y = 0.008 * S; }
    else if (m.base === 'plinth') { const p = projectUV(softBox(0.2 * S, 0.035 * S, 0.15 * S, 0.006, 1), 0.5, 'x'); a.add(M.timber, '#5a3a22', p, 0, 0.0175 * S, 0); p.dispose(); y = 0.035 * S; }
    else { const d = new THREE.CylinderGeometry(0.1 * S, 0.1 * S, 0.004, 20); a.add(M.paint, '#fbf8f0', d, 0, 0.002, 0); d.dispose(); y = 0.004; }
    if (m.sym === 'kaars') {
      const cg = lathe(sc([[0, 0], [0.028, 0], [0.027, 0.17], [0.024, 0.185], [0.012, 0.19], [0, 0.19]]), 12);
      a.add(M.paint, '#f3ead0', cg, 0, y, 0); cg.dispose();
      const drip = new THREE.SphereGeometry(1, 8, 6);
      a.add(M.paint, '#fbf6e6', drip, 0.0, y + 0.16 * S, 0.026 * S, { s: [0.01 * S, 0.03 * S, 0.008 * S] }); drip.dispose();
      const wick = new THREE.CylinderGeometry(0.003 * S, 0.003 * S, 0.02 * S, 4);
      a.add(M.paint, '#2b2118', wick, 0, y + 0.2 * S, 0); wick.dispose();
    } else if (m.sym === 'veer') feather(a, M, y, S);
    else if (m.sym === 'klok') {
      const cs = new THREE.Shape(); const w = 0.16 * S, h = 0.24 * S;
      cs.moveTo(-w / 2, 0); cs.lineTo(w / 2, 0); cs.lineTo(w / 2, h - w / 2); cs.absarc(0, h - w / 2, w / 2, 0, Math.PI, false); cs.lineTo(-w / 2, 0);
      const cg = new THREE.ExtrudeGeometry(cs, { depth: 0.1 * S, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 1, curveSegments: 10 });
      cg.translate(0, 0, -0.05 * S); projectUV(cg, 0.5, 'y');
      a.add(M.timber, '#a8743f', cg, 0, y, 0); cg.dispose();
      const dial = new THREE.CylinderGeometry(0.055 * S, 0.055 * S, 0.008, 20).rotateX(Math.PI / 2);
      a.add(M.ceramic, '#f6efdc', dial, 0, y + 0.13 * S, 0.056 * S); dial.dispose();
      const bez = new THREE.TorusGeometry(0.056 * S, 0.004 * S, 6, 24);
      a.add(M.brass, LIV.brass, bez, 0, y + 0.13 * S, 0.06 * S); bez.dispose();
      const hand = new THREE.BoxGeometry(0.006 * S, 0.045 * S, 0.003);
      a.add(M.paint, '#2b2118', hand, 0, y + 0.13 * S + 0.02 * S, 0.062 * S); a.add(M.paint, '#2b2118', hand, 0.012 * S, y + 0.13 * S, 0.062 * S, { rz: -1.1, s: [1, 0.7, 1] }); hand.dispose();
    } else if (m.sym === 'dennenappel') pinecone(a, M, y, S);
    else if (m.sym === 'vaas') {
      const vg = smoothLathe(sc([[0, 0], [0.036, 0.002], [0.054, 0.045], [0.052, 0.1], [0.03, 0.155], [0.026, 0.172], [0.033, 0.19]]), 18, 22);
      a.add(M.ceramic, '#4a6f98', vg, 0, y, 0); vg.dispose();
      const stem = new THREE.CylinderGeometry(0.004 * S, 0.004 * S, 0.16 * S, 4);
      a.add(M.paint, '#4f8a3a', stem, 0, y + 0.26 * S, 0, { rz: 0.1 }); stem.dispose();
      const petal = new THREE.SphereGeometry(1, 8, 6);
      for (let p = 0; p < 5; p++) { const an = (p / 5) * Math.PI * 2; a.add(M.paint, '#e8c547', petal, Math.cos(an) * 0.02 * S - 0.016 * S, y + 0.345 * S, Math.sin(an) * 0.02 * S, { s: [0.016 * S, 0.01 * S, 0.016 * S] }); }
      a.add(M.paint, '#c9774a', petal, -0.016 * S, y + 0.35 * S, 0, { s: [0.011 * S, 0.011 * S, 0.011 * S] });
      petal.dispose();
    } else if (m.sym === 'kopje') cup(a, M, y, S);
  });
  stand.dispose();
  void k;
}

/** Lathe through a Catmull-Rom spline of the profile: smooth turned/thrown forms without shading kinks. */
function smoothLathe(profile: [number, number][], seg: number, samples: number) {
  const curve = new THREE.SplineCurve(profile.map(([r, h]) => new THREE.Vector2(r, h)));
  return new THREE.LatheGeometry(curve.getPoints(samples).map((v) => new THREE.Vector2(Math.max(0.0005, v.x), v.y)), seg);
}

/** Feather: two curved vanes (slightly bent back), a pale quill, dark barbs and a speckled tip band. */
function feather(a: Asm, M: ArtMats, y: number, S: number) {
  // brass clip
  const clip = new THREE.CylinderGeometry(0.012 * S, 0.012 * S, 0.03 * S, 8);
  a.add(M.brass, LIV.brass, clip, 0, y + 0.015 * S, 0); clip.dispose();
  const vane = (side: 1 | -1) => {
    const s = new THREE.Shape();
    s.moveTo(0, 0.03);
    if (side > 0) { s.bezierCurveTo(0.045, 0.08, 0.06, 0.2, 0.034, 0.3); s.bezierCurveTo(0.024, 0.34, 0.012, 0.36, 0.002, 0.37); }
    else { s.bezierCurveTo(-0.026, 0.07, -0.04, 0.15, -0.032, 0.21); s.lineTo(-0.014, 0.225); s.bezierCurveTo(-0.026, 0.28, -0.016, 0.33, 0.002, 0.37); }
    s.lineTo(0, 0.03);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.005, bevelEnabled: false, curveSegments: 8 });
    g.translate(0, 0, -0.0025);
    // bend: the vane curves back as it rises; tip band darker (vertex colour)
    deformBend(g, 0.35);
    return bake(g, (p) => (p.y > 0.3 ? 0.62 : p.y > 0.27 ? 0.9 : 1));
  };
  for (const side of [1, -1] as const) {
    const g = vane(side);
    a.add(M.paint, side > 0 ? '#ece4d2' : '#f7f2e6', g, 0, y + 0.012, 0, { s: [S * 1.1, S * 1.1, S], rz: -0.1 });
    g.dispose();
  }
  // barbs: a few slanted grey-brown strokes on both vanes
  const barb = new THREE.BoxGeometry(1, 1, 1);
  for (let i = 0; i < 5; i++) {
    const hy = (0.08 + i * 0.045) * S * 1.1;
    for (const side of [1, -1]) {
      const yl = hy / (S * 1.1); // height on the unscaled vane
      a.add(M.paint, '#a8977a', barb, side * 0.016 * S + hy * 0.1, y + 0.012 + hy, -0.35 * yl * yl * S + 0.004, { rz: side * 0.65 - 0.1, s: [0.026 * S, 0.0025 * S, 0.008] });
    }
  }
  barb.dispose();
  const quill = lathe([[0, 0], [0.0045 * S, 0], [0.004 * S, 0.2 * S], [0.0025 * S, 0.36 * S], [0, 0.38 * S]], 6);
  a.add(M.paint, '#d9cdb0', quill, 0, y + 0.01, 0, { rz: -0.1, s: [1, 1.1, 1] });
  quill.dispose();
}
function deformBend(g: THREE.BufferGeometry, k: number) {
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + k * p.getY(i) * p.getY(i));
  g.computeVertexNormals();
}

/**
 * Pinecone: an ovoid core (widest low, pointed top) shingled with woody scales. Each scale is a thick plate lying
 * on the surface with its lower lip lifted outward, rows offset in a spiral — the diamond pattern of a closed cone.
 */
function pinecone(a: Asm, M: ArtMats, y: number, S: number) {
  const H = 0.17 * S, R = 0.05 * S;
  const rAt = (t: number) => R * Math.pow(Math.sin(Math.PI * Math.min(1, 0.1 + t * 0.92)), 0.75) * (1 - 0.3 * t);
  const core = lathe(Array.from({ length: 10 }, (_, i) => { const t = i / 9; return [rAt(t) * 0.82, t * H] as [number, number]; }), 12);
  a.add(M.timber, '#3e2614', core, 0, y, 0);
  core.dispose();
  // a scale: flattened sphere, darker where it tucks under the row above, lighter at the exposed lip
  const scale = bake(new THREE.SphereGeometry(1, 7, 5), (p) => 0.5 + 0.5 * THREE.MathUtils.smoothstep(-p.y, -0.4, 0.9));
  const rows = 10, per = 10;
  for (let r = 0; r < rows; r++) {
    const t = (r + 0.6) / (rows + 0.4);
    const rad = rAt(t);
    const sz = (0.45 + 0.55 * (rad / R)) * 0.024 * S;
    for (let j = 0; j < per; j++) {
      const an = ((j + (r % 2) * 0.5) / per) * Math.PI * 2 + r * 0.17;
      const px = Math.cos(an) * rad, pz = Math.sin(an) * rad;
      // plate faces outward (ry), leans in at the top so its lower lip stands proud (rx > 0)
      a.add(M.timber, r % 3 === 0 ? '#9a6a36' : '#86592c', scale, px, y + t * H, pz, { ry: Math.atan2(px, pz), rx: 0.55, s: [sz * 0.95, sz * 0.8, sz * 0.38] });
    }
  }
  scale.dispose();
  const stalk = new THREE.CylinderGeometry(0.006 * S, 0.008 * S, 0.02 * S, 6);
  a.add(M.timber, '#4a3020', stalk, 0, y + H + 0.006 * S, 0); stalk.dispose();
}

/** Tea cup on a saucer: glazed white with a delft-blue band, a clear side handle, tea inside. */
function cup(a: Asm, M: ArtMats, y: number, S: number) {
  const saucer = lathe([[0, 0], [0.04 * S, 0], [0.05 * S, 0.004 * S], [0.075 * S, 0.01 * S], [0.077 * S, 0.013 * S], [0.07 * S, 0.012 * S], [0.04 * S, 0.008 * S], [0, 0.008 * S]], 22);
  a.add(M.ceramic, '#ece6d8', saucer, 0, y, 0); saucer.dispose();
  const body0 = lathe([[0, 0.008], [0.026, 0.008], [0.03, 0.014], [0.042, 0.03], [0.05, 0.058], [0.052, 0.07], [0.048, 0.07], [0.044, 0.062], [0, 0.062]].map(([r, h]) => [r * S, h * S]) as [number, number][], 22);
  const band = (p: THREE.Vector3) => (p.y > 0.048 * S && p.y < 0.058 * S && Math.hypot(p.x, p.z) > 0.04 * S ? 1 : 0);
  const body = body0.toNonIndexed(); body0.dispose(); body.computeVertexNormals();
  const cc = new Float32Array(body.attributes.position.count * 3), v = new THREE.Vector3();
  for (let i = 0; i < body.attributes.position.count; i++) {
    v.fromBufferAttribute(body.attributes.position as THREE.BufferAttribute, i);
    const b = band(v);
    cc.set(b ? [0.3, 0.43, 0.66] : [1, 1, 1], i * 3);
  }
  body.setAttribute('color', new THREE.BufferAttribute(cc, 3)); body.userData.keepColor = true;
  a.add(M.ceramic, '#f1ece0', body, 0, y, 0); body.dispose();
  const tea = new THREE.CylinderGeometry(0.044 * S, 0.044 * S, 0.003, 18);
  a.add(M.paint, '#7a4a24', tea, 0, y + 0.06 * S, 0); tea.dispose();
  const handle = new THREE.TorusGeometry(0.02 * S, 0.0055 * S, 8, 14, Math.PI * 1.25);
  a.add(M.ceramic, '#f1ece0', handle, 0.054 * S, y + 0.04 * S, 0, { rz: -Math.PI * 0.62 });
  handle.dispose();
}

// ------------------------------------------------------------------------------------------------ room trims
function skirtingProfile(): [number, number][] {
  return [[0, 0], [0.022, 0], [0.022, 0.118], [0.018, 0.132], [0.01, 0.142], [0, 0.148]];
}
/** Skirting along a wall segment: (x0,z0)→(x1,z1) on the wall face, facing heading `yaw` (into the room). */
function skirting(c: Ctx, x0: number, z0: number, x1: number, z1: number, yaw: number) {
  const M = artMats();
  const len = Math.hypot(x1 - x0, z1 - z0);
  const g = projectUV(moulding(skirtingProfile(), len), 1, 'x');
  new Asm(c.b, c.chunk, (x0 + x1) / 2, GF, (z0 + z1) / 2, yaw).add(M.timber, LIV.skirting, g, 0, 0, 0);
  g.dispose();
}

/**
 * Inside dressing of an existing window (the shell already draws glass, frame and mullions on the wall face):
 * plastered linings that box the window out 14 cm (a reveal), a deep oak window board, painted architraves,
 * and floor-length pleated curtains on a brass rod.
 */
function windowDressing(c: Ctx, wx: number, wz: number, yaw: number, w = 1.1, sill = GF + 0.9, top = GF + 2.6, curtains = true) {
  const M = artMats();
  const k = getKit();
  const a = new Asm(c.b, c.chunk, wx, 0, wz, yaw);
  const half = w / 2 + 0.1, dep = 0.14;
  const lining = projectUV(softBox(0.035, top - sill + 0.12, dep, 0.006, 1), 2);
  for (const s of [-1, 1]) a.add(k.M.plaster, LIV.joinery, lining, s * (half + 0.0175), (sill + top) / 2 + 0.02, dep / 2);
  lining.dispose();
  const head = projectUV(softBox(2 * half + 0.07, 0.035, dep, 0.006, 1), 2);
  a.add(k.M.plaster, LIV.joinery, head, 0, top + 0.095, dep / 2);
  head.dispose();
  const board = bake(projectUV(softBox(2 * half + 0.24, 0.035, dep + 0.08, 0.012), 1, 'x'), (p) => (p.y < 0 ? 0.8 : 1));
  a.add(M.timber, LIV.sillWood, board, 0, sill - 0.04, (dep + 0.08) / 2);
  board.dispose();
  const apron = projectUV(softBox(2 * half + 0.1, 0.07, 0.022, 0.006, 1), 1, 'x');
  a.add(M.paint, LIV.joinery, apron, 0, sill - 0.095, 0.011);
  apron.dispose();
  // architraves: 7 cm, 2 cm proud of the lining edge, a capped head
  const arch = projectUV(softBox(0.07, top - sill + 0.16, 0.022, 0.006, 1), 1, 'y');
  for (const s of [-1, 1]) a.add(M.paint, LIV.joinery, arch, s * (half + 0.035 + 0.035), (sill + top) / 2 + 0.04, dep + 0.011);
  arch.dispose();
  const cap = projectUV(softBox(2 * half + 0.28, 0.06, 0.04, 0.008, 1), 1, 'x');
  a.add(M.paint, LIV.joinery, cap, 0, top + 0.15, dep + 0.02);
  cap.dispose();
  if (!curtains) return;
  // rod with finials
  const rod = new THREE.CylinderGeometry(0.014, 0.014, 1, 8).rotateZ(Math.PI / 2);
  const rodY = top + 0.26, rodL = 2 * half + 1.2;
  a.add(M.brass, LIV.brass, rod, 0, rodY, dep + 0.16, { s: [rodL, 1, 1] });
  rod.dispose();
  const fin = lathe([[0, 0], [0.018, 0.0], [0.03, 0.03], [0.022, 0.055], [0, 0.06]], 10).rotateZ(Math.PI / 2);
  for (const s of [-1, 1]) a.add(M.brass, LIV.brass, fin, s * (rodL / 2 + 0.03 * (s > 0 ? 0 : 1) + (s > 0 ? 0 : 0.03)), rodY, dep + 0.16, { ry: s > 0 ? 0 : Math.PI });
  fin.dispose();
  // pleated panels (folds baked darker in the valleys), hanging to just above the floor
  const pw = 0.6, ph = rodY - GF - 0.03;
  const panel = new THREE.PlaneGeometry(pw, ph, 20, 2);
  const pp = panel.attributes.position as THREE.BufferAttribute;
  const pc = new Float32Array(pp.count * 3);
  for (let i = 0; i < pp.count; i++) {
    const u = pp.getX(i) / pw + 0.5, fold = Math.sin(u * Math.PI * 8);
    pp.setZ(i, fold * 0.045 + (pp.getY(i) < 0 ? 0.012 : 0));
    const kk = 0.78 + 0.22 * (0.5 + 0.5 * fold);
    pc.set([kk, kk, kk], i * 3);
  }
  panel.rotateY(Math.PI); // face -z (into the room)
  panel.computeVertexNormals();
  panel.setAttribute('color', new THREE.BufferAttribute(pc, 3)); panel.userData.keepColor = true;
  projectUV(panel, 0.4);
  for (const s of [-1, 1]) a.add(M.upholstery, LIV.curtain, panel, s * (half + 0.09 + pw / 2), GF + 0.03 + ph / 2, dep + 0.2);
  panel.dispose();
}

/** Chamfered ceiling beam running along plan z between two walls, bearing on oak corbels at both ends. */
function beam(c: Ctx, x: number, z0: number, z1: number) {
  const M = artMats();
  const len = z1 - z0, h = 0.24, hw = 0.1, ch = 0.025;
  const g = projectUV(moulding([[-hw + ch, 0], [hw - ch, 0], [hw, -ch], [hw, -h + ch], [hw - ch, -h], [-hw + ch, -h], [-hw, -h + ch], [-hw, -ch]], len), 1, 'x');
  const a = new Asm(c.b, c.chunk, x, CEIL, (z0 + z1) / 2, Math.PI / 2);
  a.add(M.timber, LIV.beam, g, 0, 0, 0);
  g.dispose();
  const corbel = projectUV(softBox(0.24, 0.2, 0.3, 0.02, 1), 1, 'z');
  for (const zz of [z0 + 0.15, z1 - 0.15]) new Asm(c.b, c.chunk, x, CEIL - h - 0.1, zz, 0).add(M.timber, LIV.beam, corbel, 0, 0, 0);
  corbel.dispose();
}

// ------------------------------------------------------------------------------------------------ floor lamp v2
/**
 * Floor lamp: weighted turned base, slim bronze stem with collars, an empire fabric shade that glows when on and
 * reads as linen when off, and a visible bulb. Returns the LampModel contract plus the shade material.
 */
export function floorLampV2(w: World, x: number, y0: number, z: number) {
  const M = artMats();
  const obj = compound((b) => {
    const a = new Asm(b, 'lamp', 0, 0, 0, 0);
    const base = bake(lathe([[0, 0], [0.17, 0], [0.175, 0.012], [0.16, 0.03], [0.1, 0.05], [0.045, 0.07], [0.03, 0.09], [0, 0.09]], 20), baseAO(0, 0.03, 0.7));
    a.add(M.brass, '#8a6a3a', base, 0, 0, 0);
    const stem = new THREE.CylinderGeometry(0.012, 0.014, 1.36, 8);
    a.add(M.brass, '#8a6a3a', stem, 0, 0.09 + 0.68, 0);
    const collar = lathe([[0, 0], [0.022, 0], [0.026, 0.012], [0.022, 0.024], [0, 0.024]], 10);
    for (const cy of [0.5, 1.1, 1.43]) a.add(M.brass, LIV.brass, collar, 0, cy, 0);
    const harp = new THREE.TorusGeometry(0.1, 0.004, 4, 16, Math.PI);
    a.add(M.brass, '#8a6a3a', harp, 0, 1.46, 0, { rx: 0 });
    a.add(M.brass, '#8a6a3a', harp, 0, 1.46, 0, { ry: Math.PI / 2 });
    for (const g of [base, stem, collar, harp]) g.dispose();
  });
  const shadeMat = w.material(new THREE.MeshLambertMaterial({ color: LIV.shade, side: THREE.DoubleSide, emissive: '#000000', map: artMats().upholstery.map }));
  const shadeGeo = lathe([[0.25, 0], [0.22, 0.12], [0.17, 0.27], [0.16, 0.3]], 24);
  const shade = new THREE.Mesh(shadeGeo, shadeMat);
  shade.position.y = 1.34;
  obj.add(shade);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.007, 4, 32).rotateX(Math.PI / 2), w.material(new THREE.MeshLambertMaterial({ color: '#8a6a3a' })));
  trim.position.y = 1.34;
  obj.add(trim);
  const bulbMat = w.material(new THREE.MeshBasicMaterial({ color: '#ffd27a' }));
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), bulbMat);
  bulb.position.y = 1.42;
  obj.add(bulb);
  obj.position.copy(v3(x, y0, z));
  w.scene.add(obj);
  return { obj, glow: [bulbMat], light: v3(x, y0 + 1.45, z), shadeMat };
}

// ------------------------------------------------------------------------------------------------ the room
/**
 * Everything in the living room except the hearth/mantel (built by buildHearth with style 'v2').
 * Collision calls replicate the original furniture builders exactly (same boxes/circles).
 */
export function livingRoomV2(w: World, g: GameApi, c: Ctx, sh: ContactShadows) {
  const k = c.k;
  const M = artMats();
  // rug (calm pattern) on the floor
  box(c.b, M.rug, '#ffffff', 77.4, GF + 0.01, 86.7, 4.2, 0.012, 5.4, { chunk: c.chunk });
  // seating group facing the fire: sofa (same footprint as before), two armchairs angled in
  // contact shadows sit just above whatever is underneath: the rug (top at GF + 0.022) or the bare floor
  const RUG = { x0: 75.3, x1: 79.5, z0: 84.0, z1: 89.4 };
  const onRug = (x: number, z: number) => x > RUG.x0 - 0.3 && x < RUG.x1 + 0.3 && z > RUG.z0 - 0.3 && z < RUG.z1 + 0.3;
  const fy = (x: number, z: number) => GF + (onRug(x, z) ? 0.026 : 0.004);
  upholstered(c, sh, 79.0, 86.7, GF, -Math.PI / 2, { width: 2.3, depth: 0.9, seats: 3, color: LIV.sofa, pillows: [LIV.pillowA, LIV.pillowB], shadowY: fy(79.0, 86.7) });
  c.col.addBoxC(79.0, 86.7, 0.9, 2.6, GF, GF + 0.9); // == furniture.sofa collide() with yaw -PI/2 (swapped)
  for (const [x, z, yaw] of [[76.4, 83.0, -0.35], [76.4, 90.4, Math.PI + 0.35]] as const) {
    upholstered(c, sh, x, z, GF, yaw, { width: 0.88, depth: 0.86, seats: 1, color: LIV.chair, shadowY: fy(x, z) });
    c.col.addBoxC(x, z, 1.0, 0.9, GF, GF + 0.9); // == armchair() → sofa(w 1.0) collide(), no swap for these yaws
  }
  // coffee table (with a lower shelf) and the side table carrying the memory photo
  occasionalTable(c, sh, 77.3, 86.7, GF, 0.9, 1.5, 0.45, 0, true, fy(77.3, 86.7));
  c.col.addBoxC(77.3, 86.7, 0.9, 1.5, GF, GF + 0.45);
  occasionalTable(c, sh, 83.9, 92.4, GF, 0.6, 0.6, 0.62, 0);
  c.col.addBoxC(83.9, 92.4, 0.6, 0.6, GF, GF + 0.62);
  // unchanged supporting pieces (bookshelf, plant, painting) — they get contact shadows only
  bookshelf(c, 81.5, 93.6, GF, Math.PI, 2.0, 2.4, 'navy');
  sh.add(81.5, GF + 0.004, 93.5, 2.35, 0.75, 0, 0.6);
  plant(c, 84.4, 80.9, GF, 1.2);
  sh.add(84.4, GF + 0.004, 80.9, 0.85, 0.85, 0, 0.6);
  // moved 0.75 m west: the original position overlapped the window at x 79 (now visible with its linings)
  painting(c, 77.25, 2.1, 80.45, 0, 1.2, 0.85, 3);
  // memory photo (same id, clue, hitbox, pose)
  const photo = compound((b) => { box(b, k.M.paint, '#b8892f', 0, 0, 0, 0.22, 0.17, 0.03); box(b, k.M.glow, '#c8b8a0', 0, 0.02, 0.018, 0.17, 0.12, 0.005); });
  place(photo, 83.9, GF + 0.62, 92.4, Math.PI * 0.8);
  w.scene.add(photo);
  makeInspect(w, g, { id: 'mem.living.photo', obj: photo, clue: 'mem.living.photo', hit: [0.35, 0.3, 0.35] });
  // floor lamp: same id, hitbox, light; softer floor pool; shade glows with the logical lamp state
  const fl = floorLampV2(w, 84.2, GF, 83.6);
  const lamp = makeLamp(w, g, { id: 'lamp.livingFloor', obj: fl.obj, glow: fl.glow, light: fl.light, name: 'staande lamp', defaultOn: true, hit: [0.5, 1.9, 0.5], intensity: 5, distance: 8, patch: { y: GF + 0.03, r: 1.7, strength: 0.3, soft: true } });
  w.onSync(() => { fl.shadeMat.emissive.set(lamp.isOn() ? '#d9973f' : '#000000'); });
  sh.add(84.2, GF + 0.004, 83.6, 0.62, 0.62, 0, 0.6);
  // architecture: skirting, window dressing, chamfered beams on corbels
  const W = 72.425, S0 = 80.425, E = 84.915, N = 93.915;
  skirting(c, W, S0, W, 85.22, Math.PI / 2);
  skirting(c, W, 88.18, W, N, Math.PI / 2);
  skirting(c, W, S0, E, S0, 0);
  skirting(c, E, S0, E, 87.0, -Math.PI / 2);
  skirting(c, E, 90.0, E, N, -Math.PI / 2);
  skirting(c, W, N, 78.2, N, Math.PI);
  skirting(c, 79.8, N, E, N, Math.PI);
  for (const z of [83, 90.5]) windowDressing(c, W, z, Math.PI / 2);
  for (const x of [75.5, 79, 82.5]) windowDressing(c, x, S0, 0, 1.1, GF + 0.9, GF + 2.6, false);
  for (const x of [74, 76.4, 78.8, 81.2, 83.6]) beam(c, x, S0, N);
  // plastered ceiling between the beams (the bare ceiling was the dark underside of the upstairs floorboards)
  const ceil = projectUV(softBox(E - W, 0.02, N - S0, 0.004, 1), 3);
  new Asm(c.b, c.chunk, (W + E) / 2, CEIL - 0.022, (S0 + N) / 2, 0).add(k.M.plaster, '#ece3cf', ceil, 0, 0.01, 0);
  ceil.dispose();
}
