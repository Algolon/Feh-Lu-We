// Small optional kitchen still-life. Original stylized packaging; no commercial brand assets.
// Only a visual prop + one stateless inspection: never changes clues, inventory, saves or puzzles.
import * as THREE from 'three';
import type { World, GameApi } from '../interactions/world';
import { makeAction, place } from '../interactions/props';
import { GF } from './layout';

// Tall, softly inflated foil pack: visible body height : width ≈ 1.85 : 1.
// The previous 0.306 m × 0.224 m silhouette appeared too square at player eye level.
// A rounded gusset, slightly tucked corners and a thin top seal preserve the Capri-Sun-style silhouette.
export const POUCH_HEIGHT = 0.350;
// Match the stone slab used by kitchenIsland() in manor.ts:
// its centre sits GF + 0.885 and its full thickness is 0.05m.
// The last version forgot GF (0.15m), sinking the pouch into the worktop.
export const KITCHEN_ISLAND_SURFACE_Y = GF + 0.885 + 0.05 / 2;
export const SIPPY_JUIZ_SCALE = 2 / 3;
export const SIPPY_JUIZ_LOCAL_FOOT_Y = 0.005; // lowest point of the curved pouch skin
export const KITCHEN_SIPPY_JUIZ = {
  x: 101.94,
  y: KITCHEN_ISLAND_SURFACE_Y - SIPPY_JUIZ_LOCAL_FOOT_Y * SIPPY_JUIZ_SCALE,
  z: 105.11,
} as const;
export const SIPPY_JUIZ_ACTION = 'Bekijk drinkpakje';
export const SIPPY_JUIZ_TEXT = 'Is dit echt de laatste CapriSun?';
const PROFILE = [
  { y: 0.005, w: 0.071, d: 0.009, swell: 0.000 },
  { y: 0.017, w: 0.082, d: 0.017, swell: 0.003 },
  { y: 0.034, w: 0.091, d: 0.022, swell: 0.010 },
  { y: 0.056, w: 0.094, d: 0.024, swell: 0.008 },
  { y: 0.087, w: 0.094, d: 0.023, swell: 0.007 },
  { y: 0.123, w: 0.094, d: 0.021, swell: 0.007 },
  { y: 0.168, w: 0.093, d: 0.021, swell: 0.007 },
  { y: 0.215, w: 0.093, d: 0.019, swell: 0.006 },
  { y: 0.259, w: 0.092, d: 0.018, swell: 0.005 },
  { y: 0.298, w: 0.091, d: 0.016, swell: 0.004 },
  { y: 0.322, w: 0.087, d: 0.012, swell: 0.002 },
  { y: 0.337, w: 0.083, d: 0.008, swell: 0.001 },
  { y: 0.345, w: 0.080, d: 0.005, swell: 0.000 },
  { y: POUCH_HEIGHT, w: 0.077, d: 0.004, swell: 0.000 },
] as const;

type Graphics = CanvasRenderingContext2D;
const ellipse = (g: Graphics, x: number, y: number, rx: number, ry: number, color: string, rotation = 0) => {
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  g.fill();
};
const poly = (g: Graphics, points: [number, number][], color: string) => {
  g.fillStyle = color;
  g.beginPath(); g.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) g.lineTo(x, y);
  g.closePath(); g.fill();
};

// Large, low-detail coloured fruit silhouettes, readable at phone size.
// They form one small painted cluster rather than a photographic product image.
function drawFruit(g: Graphics) {
  // Banana: long crescent behind the other fruits.
  g.fillStyle = '#e5b13f';
  g.beginPath(); g.moveTo(220, 490);
  g.bezierCurveTo(277, 468, 347, 441, 380, 394);
  g.bezierCurveTo(386, 465, 345, 515, 272, 532);
  g.quadraticCurveTo(238, 531, 220, 490); g.fill();
  g.fillStyle = '#f7dc79';
  g.beginPath(); g.moveTo(237, 493);
  g.bezierCurveTo(294, 476, 356, 444, 372, 420);
  g.bezierCurveTo(359, 470, 324, 493, 266, 516);
  g.closePath(); g.fill();

  // Pineapple: ochre fruit body, big green crown and only a few scales.
  poly(g, [[395, 458], [382, 413], [398, 423], [407, 381],
    [416, 424], [439, 402], [427, 461]], '#507e48');
  poly(g, [[389, 459], [423, 444], [462, 477], [463, 566],
    [436, 615], [397, 602], [371, 534]], '#e6b34c');
  poly(g, [[423, 447], [462, 477], [463, 566], [436, 615],
    [425, 605], [437, 526]], '#c48b3e');
  g.strokeStyle = '#f7d780'; g.lineWidth = 6;
  for (const [x1, y1, x2, y2] of [
    [384, 490, 452, 556], [383, 528, 441, 593], [451, 492, 384, 562],
    [453, 532, 412, 590],
  ]) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }

  // Apple: strongly recognizable red twin lobes, leaf and stem.
  g.fillStyle = '#ad3431';
  g.beginPath(); g.moveTo(162, 503);
  g.bezierCurveTo(108, 463, 80, 509, 92, 566);
  g.bezierCurveTo(101, 629, 132, 643, 166, 630);
  g.bezierCurveTo(202, 649, 244, 617, 246, 560);
  g.bezierCurveTo(248, 503, 210, 469, 162, 503); g.fill();
  g.fillStyle = '#e56248';
  g.beginPath(); g.moveTo(154, 505); g.bezierCurveTo(111, 484, 107, 529, 112, 569);
  g.bezierCurveTo(117, 591, 132, 599, 149, 591);
  g.bezierCurveTo(161, 572, 157, 531, 154, 505); g.fill();
  ellipse(g, 131, 529, 13, 25, '#f39170', -0.45);
  g.strokeStyle = '#65503a'; g.lineWidth = 8; g.lineCap = 'round';
  g.beginPath(); g.moveTo(163, 507); g.lineTo(178, 462); g.stroke();
  ellipse(g, 192, 468, 24, 10, '#78a45e', -0.5);

  // Orange wedge: a large orange sector with pale pith and clear segments.
  poly(g, [[49, 642], [88, 624], [151, 631], [192, 691],
    [73, 718]], '#e69d39');
  poly(g, [[62, 651], [94, 635], [151, 646], [176, 688],
    [83, 706]], '#f6ce70');
  g.strokeStyle = '#fff0b5'; g.lineWidth = 5;
  for (const [x, y] of [[87, 643], [121, 639], [155, 660]]) {
    g.beginPath(); g.moveTo(80, 704); g.lineTo(x, y); g.stroke();
  }

  // Kiwi: oversized bright green cross section, seeds simplified to twelve dots.
  ellipse(g, 273, 645, 78, 79, '#507c45');
  ellipse(g, 273, 643, 69, 70, '#a7c25e');
  ellipse(g, 273, 644, 55, 57, '#79ad50');
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    ellipse(g, 273 + 41 * Math.cos(a), 645 + 44 * Math.sin(a), 4, 5, '#344a33', a);
  }
  ellipse(g, 273, 645, 17, 19, '#f2e1a1');

  // Passionfruit: bold purple ring and yellow cut face with only a few seeds.
  ellipse(g, 398, 665, 56, 57, '#793e6b', -0.2);
  ellipse(g, 393, 662, 46, 47, '#f3cc77', -0.2);
  ellipse(g, 393, 662, 36, 37, '#e5a73c', -0.2);
  for (const [dx, dy] of [[-14,-15], [13,-15], [-19,9], [8,7], [0,23]]) {
    ellipse(g, 393 + dx, 662 + dy, 6, 8, '#79552e');
  }
}

/** Original SippyJuiz foil print: dark blue field, cream arc, rainbow flavour descriptor and layered fruit drawing. */
function makePrint(): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 768;
  const g = cv.getContext('2d')!;
  const foil = g.createLinearGradient(0, 0, 512, 0);
  foil.addColorStop(0, '#abb6b6'); foil.addColorStop(0.045, '#e6e6dc');
  foil.addColorStop(0.14, '#c5d0cd'); foil.addColorStop(0.77, '#f7f0df');
  foil.addColorStop(0.96, '#b3bdbb'); foil.addColorStop(1, '#899798');
  g.fillStyle = foil; g.fillRect(0, 0, 512, 768);
  // Softly curved main label, not a copied product photograph or commercial wordmark.
  g.beginPath(); g.moveTo(47, 108); g.quadraticCurveTo(256, 62, 468, 110);
  g.lineTo(466, 684); g.quadraticCurveTo(251, 709, 47, 681);
  g.closePath(); g.fillStyle = '#164d84'; g.fill();
  const blue = g.createLinearGradient(0, 130, 450, 700);
  blue.addColorStop(0, '#11528d'); blue.addColorStop(0.44, '#1175ae');
  blue.addColorStop(0.77, '#49b3c5'); blue.addColorStop(1, '#e0b657');
  g.beginPath(); g.moveTo(57, 133); g.quadraticCurveTo(252, 98, 454, 135);
  g.lineTo(453, 672); g.quadraticCurveTo(252, 689, 57, 668);
  g.closePath(); g.fillStyle = blue; g.fill();
  // Hand-drawn shine/value shapes, purposefully limited to broad painterly marks.
  poly(g, [[67, 153], [161, 132], [128, 398], [62, 482]], 'rgba(208,233,219,.13)');
  poly(g, [[430, 166], [451, 178], [448, 407], [399, 270]], 'rgba(15,48,93,.14)');
  ellipse(g, 398, 126, 23, 16, '#dfbc62', -0.3);
  poly(g, [[382, 117], [394, 92], [399, 118]], '#f3d892');

  // Unique illustrated wordmark in rounded, simple type; visible from player eye height on mobile.
  g.textAlign = 'center'; g.lineJoin = 'round';
  g.font = 'bold 84px "Trebuchet MS", Arial, sans-serif';
  g.lineWidth = 10; g.strokeStyle = '#14517d';
  g.strokeText('SippyJuiz', 257, 243, 456);
  g.fillStyle = '#e9b66b'; g.fillText('SippyJuiz', 260, 248, 456);
  g.fillStyle = '#fff9e8'; g.fillText('SippyJuiz', 255, 241, 456);

  // A visibly separate ivory swoosh with individually coloured MULTIVITAMIN lettering.
  g.fillStyle = '#fff6dd'; g.beginPath();
  g.moveTo(69, 298); g.bezierCurveTo(168, 318, 306, 263, 441, 306);
  g.bezierCurveTo(455, 316, 442, 353, 430, 358);
  g.bezierCurveTo(301, 321, 189, 394, 80, 357);
  g.bezierCurveTo(67, 351, 60, 311, 69, 298);
  g.fill();
  g.save(); g.translate(253, 333); g.rotate(-0.026);
  g.font = 'bold 30px "Trebuchet MS", Arial, sans-serif';
  const chars = [...'MULTIVITAMIN'];
  const hues = ['#be443a','#dd8041','#e9ac4b','#418c64','#b54c82','#438cbd','#d45b44','#519663','#ce7540','#a44d78','#4490b2','#c84b48'];
  for (let i = 0; i < chars.length; i++) {
    g.fillStyle = hues[i]; g.fillText(chars[i], (i - (chars.length - 1) / 2) * 29, 9);
  }
  g.restore();

  // Bunched fruit still-life extends across the lower third of the foil like a painted vignette.
  ellipse(g, 265, 612, 198, 113, 'rgba(252,206,102,.27)');
  drawFruit(g);
  // White matte base band visually identifies the folded base of the foil pouch.
  g.fillStyle = '#f3efe2'; g.beginPath();
  g.moveTo(42, 715); g.quadraticCurveTo(250, 695, 470, 716);
  g.lineTo(475, 767); g.lineTo(36, 767); g.closePath(); g.fill();
  g.fillStyle = '#27688b'; g.textAlign = 'left'; g.font = 'bold 21px "Trebuchet MS", Arial';
  g.fillText('FRUITDRANK', 65, 754);
  g.textAlign = 'right'; g.fillText('200 ml', 444, 754);
  // Two silver heat-seal shoulders + restrained vertical creases, authored into the print.
  g.strokeStyle = 'rgba(255,255,255,.58)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(33, 126); g.quadraticCurveTo(21, 340, 37, 694); g.stroke();
  g.beginPath(); g.moveTo(485, 126); g.quadraticCurveTo(494, 344, 475, 697); g.stroke();
  g.strokeStyle = 'rgba(100,107,113,.4)'; g.lineWidth = 2;
  for (let y = 44; y < 79; y += 7) {
    g.beginPath(); g.moveTo(52, y); g.lineTo(456, y + 1); g.stroke();
  }
  return cv;
}

// Instead of square sided extrusion, the printed front and back are FLEXIBLE curving skins.
// The lateral roll-over tapers into a narrow heat-welded edge (not a flat vertical side wall).
const PANEL_COLS = 16;
type Section = (typeof PROFILE)[number];
function panelPoint(r: Section, u: number, front: boolean): [number, number, number] {
  const edge = Math.abs(u);
  const shoulderStart = POUCH_HEIGHT - 0.039;
  const shoulder = r.y > shoulderStart ? 0.0045 * ((r.y - shoulderStart) / (POUCH_HEIGHT - shoulderStart)) : 0;
  const foot = r.y < 0.052 ? 0.004 * (1 - r.y / 0.052) : 0;
  const y = r.y + foot * Math.pow(edge, 3) - shoulder * Math.pow(edge, 5);
  // Round the cross-section toward the seam (like a soft inflated sachet).
  const rounded = Math.pow(1 - Math.pow(edge, 3.4), 0.66);
  const belly = r.d * (0.26 + 0.74 * rounded) + r.swell * (1 - edge * edge);
  // Small, low-frequency fabric creases, biased toward the welded margins/bottom.
  const wrinkle = 0.0014 * Math.pow(edge, 2) *
    Math.sin(16 * u + r.y * 47) * Math.sin(Math.PI * r.y / POUCH_HEIGHT);
  const x = u * r.w + 0.0012 * Math.sin(r.y * 32 + u * 4) * (1 - edge);
  return [x, y, (front ? 1 : -1) * (belly + wrinkle)];
}

export function pouchPanelGeometry(front: boolean): THREE.BufferGeometry {
  const verts: number[] = [], tex: number[] = [], indices: number[] = [];
  for (const r of PROFILE) for (let i = 0; i <= PANEL_COLS; i++) {
    const t = i / PANEL_COLS;
    const pt = panelPoint(r, t * 2 - 1, front);
    verts.push(...pt);
    tex.push(front ? t : 1 - t, r.y / POUCH_HEIGHT);
  }
  for (let j = 0; j < PROFILE.length - 1; j++) for (let i = 0; i < PANEL_COLS; i++) {
    const a = j * (PANEL_COLS + 1) + i, b = a + 1, c = a + PANEL_COLS + 1, d = c + 1;
    if (front) indices.push(a, b, c, b, d, c);
    else indices.push(a, c, b, b, c, d);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(tex, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Narrow folded side welds, shaped by the actual panel contour, instead of a slab.
function pouchSideGeometry(side: number): THREE.BufferGeometry {
  const verts: number[] = [], idx: number[] = [];
  for (const r of PROFILE) {
    const u = side > 0 ? 1 : -1;
    verts.push(...panelPoint(r, u, true), ...panelPoint(r, u, false));
  }
  for (let j = 0; j < PROFILE.length - 1; j++) {
    const a = 2 * j, b = a + 1, c = a + 2, d = a + 3;
    if (side > 0) idx.push(a, b, c, b, d, c);
    else idx.push(a, c, b, b, c, d);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geometry.setIndex(idx); geometry.computeVertexNormals();
  return geometry;
}

// Thin foil crimp: curved across the top, rounded down at each shoulder.
// One shallow ribbon per side; NO box on the pouch's crown.
function topCrimpGeometry(front: boolean): THREE.BufferGeometry {
  const verts: number[] = [], indices: number[] = [];
  for (let row = 0; row <= 2; row++) for (let i = 0; i <= PANEL_COLS; i++) {
    const u = i / PANEL_COLS * 2 - 1, abs = Math.abs(u);
    const y = POUCH_HEIGHT - 0.012 + row * 0.006 - 0.004 * Math.pow(abs, 5);
    const width = 0.080 - row * 0.0015;
    const bulge = 0.0058 + 0.0017 * (1 - abs * abs);
    verts.push(u * width, y, (front ? 1 : -1) * bulge);
  }
  for (let row = 0; row < 2; row++) for (let i = 0; i < PANEL_COLS; i++) {
    const a = row * (PANEL_COLS + 1) + i, b = a + 1, c = a + PANEL_COLS + 1, d = c + 1;
    if (front) indices.push(a, b, c, b, d, c);
    else indices.push(a, c, b, b, c, d);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

// Recessed elliptical gusset under the pouch: organic tucked oval, not a rectangular box.
function bottomGussetGeometry(): THREE.BufferGeometry {
  const verts = [0, 0.007, 0], idx: number[] = [];
  const n = 24;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    verts.push(0.076 * Math.cos(a), 0.0085 + 0.002 * Math.abs(Math.cos(a)),
      0.023 * Math.sin(a));
  }
  for (let i = 1; i <= n; i++) idx.push(0, i, i === n ? 1 : i + 1);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geometry.setIndex(idx); geometry.computeVertexNormals();
  return geometry;
}

export function buildKitchenJuicePouch(w: World, g: GameApi) {
  const root = new THREE.Group();
  root.name = 'kitchen-sippyjuiz-pouch';
  root.userData.room = 'kitchen';
  root.userData.cullDist = 20;
  const silver = w.material(new THREE.MeshLambertMaterial({ color: '#bfc5c4', side: THREE.DoubleSide }));
  const crimpSilver = w.material(new THREE.MeshLambertMaterial({ color: '#e5e7e1', side: THREE.DoubleSide }));
  const gussetFoil = w.material(new THREE.MeshLambertMaterial({ color: '#9eaba9', side: THREE.DoubleSide }));
  const art = w.texture(new THREE.CanvasTexture(makePrint()));
  art.colorSpace = THREE.SRGBColorSpace;
  art.anisotropy = 4;
  const printed = w.material(new THREE.MeshLambertMaterial({ map: art, side: THREE.DoubleSide }));
  const front = new THREE.Mesh(pouchPanelGeometry(true), printed);
  front.castShadow = true; front.receiveShadow = true;
  root.add(front);
  const back = new THREE.Mesh(pouchPanelGeometry(false), silver);
  back.castShadow = true; root.add(back);

  // Each crimp and edge follows the soft silhouette rather than flattening it with box geometry.
  for (const sign of [-1, 1]) {
    const edge = new THREE.Mesh(pouchSideGeometry(sign), silver);
    edge.castShadow = true;
    root.add(edge);
  }
  for (const frontSide of [true, false]) {
    const crimp = new THREE.Mesh(topCrimpGeometry(frontSide), crimpSilver);
    root.add(crimp);
  }
  const foot = new THREE.Mesh(bottomGussetGeometry(), gussetFoil);
  root.add(foot);

  // Fine fold highlights low on the cheeks, following the inflated pouch's curved skin.
  const folds = new THREE.Group();
  const creaseMaterial = w.material(new THREE.MeshLambertMaterial({
    color: '#e3e2d8', side: THREE.DoubleSide, transparent: true, opacity: 0.65,
    depthWrite: false,
  }));
  for (const side of [-1, 1]) {
    const coords = [
      [side * 0.077, 0.015, 0.021],
      [side * 0.094, 0.046, 0.019],
      [side * 0.086, 0.064, 0.019],
      [side * 0.071, 0.025, 0.031],
    ];
    const positions = new Float32Array([...coords[0], ...coords[1], ...coords[2],
      ...coords[0], ...coords[2], ...coords[3]]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    folds.add(new THREE.Mesh(geo, creaseMaterial));
  }
  root.add(folds);



  // Straw inserted through a small foil puncture on the front, leaning to the upper right.
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.012, 8),
    w.material(new THREE.MeshLambertMaterial({ color: '#597481', side: THREE.DoubleSide })));
  hole.position.set(-0.022, POUCH_HEIGHT - 0.039, 0.025);
  root.add(hole);
  const bottom = new THREE.Vector3(-0.022, POUCH_HEIGHT - 0.032, 0.030);
  const top = new THREE.Vector3(0.029, POUCH_HEIGHT + 0.120, 0.035);
  const vec = top.clone().sub(bottom);
  const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.0064, 0.0064, vec.length(), 7),
    w.material(new THREE.MeshLambertMaterial({ color: '#f4f0e5', flatShading: true })));
  straw.position.copy(bottom).add(top).multiplyScalar(0.5);
  straw.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vec.normalize());
  straw.castShadow = true; root.add(straw);

  // Scale the entire model (including foil folds, fruit label and straw) to 2/3.
  // Root scaling also shrinks its attached raycast target, so size the target in local metres.
  root.scale.setScalar(SIPPY_JUIZ_SCALE);
  // South-facing view: right-hand side of the island, clear of the note and the drawer.
  // Set the model's *lowest* vertex on the actual stone slab, not on an unoffset local Y.
  place(root, KITCHEN_SIPPY_JUIZ.x, KITCHEN_SIPPY_JUIZ.y, KITCHEN_SIPPY_JUIZ.z);
  w.scene.add(root);
  makeAction(w, {
    id: 'inspect.kitchenBosfruit', // Stable interaction id for backwards compatibility.
    obj: root, hit: [0.35, 0.47, 0.20], hitOffset: [0, 0.235, 0], reach: 3.0,
    label: () => SIPPY_JUIZ_ACTION,
    run: () => g.act({ ok: true, msg: SIPPY_JUIZ_TEXT, sfx: 'none' }, { save: false }),
  });
}
