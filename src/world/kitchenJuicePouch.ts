// Small optional kitchen still-life. Original stylized packaging; no commercial brand assets.
// Only a visual prop + one stateless inspection: never changes clues, inventory, saves or puzzles.
import * as THREE from 'three';
import type { World, GameApi } from '../interactions/world';
import { makeAction, place } from '../interactions/props';

// Captures the silhouette of a REAL flexible 200 ml stand-up foil pouch, not a block.
// Width-to-height ≈0.73; body ≈5–6 cm thick, tapering to a pressed, near-flat top.
// The bottom gusset unfurls gently to support the pouch without a rectangular plinth.
export const POUCH_HEIGHT = 0.306;
export const KITCHEN_SIPPY_JUIZ = { x: 101.94, y: 0.910, z: 105.11 } as const;
const PROFILE = [
  { y: 0.005, w: 0.085, d: 0.010, swell: 0.000 },
  { y: 0.014, w: 0.098, d: 0.019, swell: 0.003 },
  { y: 0.029, w: 0.107, d: 0.023, swell: 0.010 },
  { y: 0.050, w: 0.111, d: 0.024, swell: 0.008 },
  { y: 0.077, w: 0.112, d: 0.023, swell: 0.007 },
  { y: 0.108, w: 0.112, d: 0.022, swell: 0.007 },
  { y: 0.145, w: 0.111, d: 0.021, swell: 0.007 },
  { y: 0.186, w: 0.111, d: 0.020, swell: 0.006 },
  { y: 0.224, w: 0.109, d: 0.018, swell: 0.005 },
  { y: 0.254, w: 0.107, d: 0.016, swell: 0.004 },
  { y: 0.277, w: 0.105, d: 0.012, swell: 0.002 },
  { y: 0.291, w: 0.100, d: 0.008, swell: 0.001 },
  { y: 0.300, w: 0.097, d: 0.005, swell: 0.000 },
  { y: POUCH_HEIGHT, w: 0.091, d: 0.004, swell: 0.000 },
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

// Hand-drawn flat-shaded illustrations; each fruit has a distinctive silhouette, cut surface,
// authored shadow plane and few strong marks. All drawing is generated locally on one canvas.
function drawFruit(g: Graphics) {
  // Banana and lemon in the background: broad golden shapes without photographic shading.
  g.fillStyle = '#e5b74f';
  g.beginPath(); g.moveTo(222, 466); g.bezierCurveTo(288, 419, 347, 444, 368, 394);
  g.bezierCurveTo(376, 480, 314, 529, 253, 527);
  g.quadraticCurveTo(222, 520, 222, 466); g.fill();
  g.fillStyle = '#f7df83';
  g.beginPath(); g.moveTo(237, 472); g.bezierCurveTo(281, 460, 331, 455, 354, 424);
  g.bezierCurveTo(343, 475, 292, 507, 254, 508); g.closePath(); g.fill();
  poly(g, [[335, 484], [367, 443], [402, 500], [370, 557]], '#f2ce5a');
  poly(g, [[349, 491], [368, 466], [386, 506], [371, 543]], '#fff0a0');

  // Tall pineapple with scalloped crown and clearly simplified cross-hatch scales.
  poly(g, [[391, 451], [377, 406], [391, 414], [399, 371], [407, 413],
    [426, 387], [418, 437], [438, 421], [427, 459]], '#65834b');
  poly(g, [[385, 469], [414, 449], [451, 478], [467, 538], [433, 625],
    [391, 610], [369, 541]], '#e0ae44');
  poly(g, [[414, 451], [451, 478], [467, 538], [433, 625], [420, 620],
    [438, 538]], '#bb843c');
  g.save(); g.beginPath();
  g.moveTo(385, 469); g.lineTo(414, 449); g.lineTo(451, 478); g.lineTo(467, 538);
  g.lineTo(433, 625); g.lineTo(391, 610); g.lineTo(369, 541); g.closePath(); g.clip();
  g.strokeStyle = '#f4d275'; g.lineWidth = 5;
  for (let i = -4; i < 8; i++) {
    g.beginPath(); g.moveTo(368 + i * 19, 450); g.lineTo(478 + i * 19, 645); g.stroke();
    g.beginPath(); g.moveTo(464 - i * 19, 442); g.lineTo(353 - i * 19, 646); g.stroke();
  }
  g.restore();

  // Red apple. Not a circle: a sculpted twin-lobed outline, leaf, stem and warm highlight.
  g.fillStyle = '#b83934'; g.beginPath(); g.moveTo(167, 483);
  g.bezierCurveTo(119, 450, 91, 481, 94, 548);
  g.bezierCurveTo(96, 621, 133, 643, 173, 621);
  g.bezierCurveTo(217, 643, 258, 607, 249, 540);
  g.bezierCurveTo(246, 469, 201, 457, 167, 483); g.fill();
  g.fillStyle = '#e7664b'; g.beginPath(); g.moveTo(165, 493);
  g.bezierCurveTo(115, 465, 101, 514, 111, 574);
  g.bezierCurveTo(120, 597, 140, 600, 154, 586);
  g.bezierCurveTo(169, 554, 168, 511, 165, 493); g.fill();
  ellipse(g, 131, 517, 16, 25, '#f58c68', -0.45);
  g.strokeStyle = '#674a38'; g.lineWidth = 8; g.lineCap = 'round';
  g.beginPath(); g.moveTo(169, 487); g.lineTo(184, 450); g.stroke();
  ellipse(g, 200, 454, 25, 12, '#779952', -0.35);
  ellipse(g, 199, 450, 13, 5, '#a9b56b', -0.35);

  // Orange wedge with proper peel, pale pith and radial flesh (lower left).
  g.fillStyle = '#e89a34'; g.beginPath(); g.moveTo(56, 641);
  g.quadraticCurveTo(121, 603, 185, 681); g.lineTo(83, 717); g.closePath(); g.fill();
  g.strokeStyle = '#f6de9a'; g.lineWidth = 10; g.beginPath(); g.moveTo(61, 644);
  g.quadraticCurveTo(121, 619, 178, 681); g.stroke();
  g.lineWidth = 3; g.strokeStyle = '#ffe7a6';
  for (const p of [[98, 627], [129, 636], [156, 657]] as const) {
    g.beginPath(); g.moveTo(88, 711); g.lineTo(p[0], p[1]); g.stroke();
  }

  // Kiwi cross section sits *in front of* the apple, orange and pineapple.
  ellipse(g, 273, 645, 81, 82, '#547b46', 0.08);
  ellipse(g, 273, 642, 73, 75, '#a6bc55', 0.08);
  ellipse(g, 272, 645, 56, 59, '#7aa94b', 0.08);
  for (let i = 0; i < 18; i++) {
    const a = (i * Math.PI * 2) / 18;
    const px = 273 + 45 * Math.cos(a), py = 644 + 48 * Math.sin(a);
    ellipse(g, px, py, 3.2, 5, '#293a30', a);
    g.strokeStyle = '#d2d88c'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(273 + 19 * Math.cos(a), 644 + 21 * Math.sin(a));
    g.lineTo(px - 6 * Math.cos(a), py - 6 * Math.sin(a)); g.stroke();
  }
  ellipse(g, 273, 644, 18, 20, '#f3e3a8');

  // Passion-fruit cut face in the foreground: purple rind, yellow pith, ochre seed pockets.
  ellipse(g, 399, 661, 56, 58, '#763b65', -0.32);
  ellipse(g, 394, 657, 49, 50, '#f3d391', -0.32);
  ellipse(g, 394, 657, 40, 41, '#e9a941', -0.32);
  const seeds: [number, number][] = [
    [-23, -10], [-5, -24], [15, -19], [24, 0], [9, 5], [-12, 11], [-25, 20], [13, 23], [-2, 28], [-1, -2],
  ];
  for (const [dx, dy] of seeds) {
    ellipse(g, 394 + dx, 657 + dy, 8, 11, '#edc45b', -0.4);
    ellipse(g, 394 + dx + 1, 655 + dy, 3.7, 5.8, '#8c7033', -0.4);
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
  const shoulder = r.y > 0.267 ? 0.0045 * ((r.y - 0.267) / (POUCH_HEIGHT - 0.267)) : 0;
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
    const y = 0.294 + row * 0.006 - 0.004 * Math.pow(abs, 5);
    const width = 0.098 - row * 0.002;
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
    verts.push(0.091 * Math.cos(a), 0.0085 + 0.002 * Math.abs(Math.cos(a)),
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
      [side * 0.089, 0.015, 0.021],
      [side * 0.111, 0.046, 0.019],
      [side * 0.098, 0.064, 0.019],
      [side * 0.080, 0.025, 0.031],
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
  hole.position.set(-0.024, 0.270, 0.025);
  root.add(hole);
  const bottom = new THREE.Vector3(-0.023, 0.277, 0.030);
  const top = new THREE.Vector3(0.029, 0.423, 0.035);
  const vec = top.clone().sub(bottom);
  const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.0064, 0.0064, vec.length(), 7),
    w.material(new THREE.MeshLambertMaterial({ color: '#f4f0e5', flatShading: true })));
  straw.position.copy(bottom).add(top).multiplyScalar(0.5);
  straw.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vec.normalize());
  straw.castShadow = true; root.add(straw);

  // Right-hand side of the island from the south-facing player's view; away from the note on the left.
  // Island is x=99.65..102.35; slab top at y=0.91. All geometry remains on the worktop.
  place(root, KITCHEN_SIPPY_JUIZ.x, KITCHEN_SIPPY_JUIZ.y, KITCHEN_SIPPY_JUIZ.z);
  w.scene.add(root);
  makeAction(w, {
    id: 'inspect.kitchenBosfruit', // Stable interaction id for backwards compatibility.
    obj: root, hit: [0.34, 0.47, 0.22], hitOffset: [0, 0.22, 0], reach: 3.0,
    label: () => 'Bekijken: SippyJuiz',
    run: () => g.act({ ok: true, msg: 'Is dit de laatste capri sun?', sfx: 'none' }, { save: false }),
  });
}
