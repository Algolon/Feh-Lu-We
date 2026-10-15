// Small optional kitchen still-life. Original stylized packaging; no commercial brand assets.
// Only a visual prop + one stateless inspection: never changes clues, inventory, saves or puzzles.
import * as THREE from 'three';
import type { World, GameApi } from '../interactions/world';
import { makeAction, place } from '../interactions/props';

// Model-space metres. A flexible, sealed stand-up foil drink pouch, not a flat extruded rectangle.
const POUCH_HEIGHT = 0.306;
export const KITCHEN_SIPPY_JUIZ = { x: 101.94, y: 0.910, z: 105.11 } as const;

// The lower gusset is *wider and deeper* than the shoulder, making the pouch stand on its own.
// The soft flare, pinched top, front swell and crimped seams are legible even without textures.
const PROFILE = [
  { y: 0.008, w: 0.101, d: 0.037, swell: 0.000 },
  { y: 0.019, w: 0.124, d: 0.052, swell: 0.002 },
  { y: 0.039, w: 0.131, d: 0.049, swell: 0.005 },
  { y: 0.073, w: 0.129, d: 0.042, swell: 0.009 },
  { y: 0.142, w: 0.125, d: 0.036, swell: 0.011 },
  { y: 0.220, w: 0.119, d: 0.031, swell: 0.010 },
  { y: 0.264, w: 0.116, d: 0.027, swell: 0.005 },
  { y: 0.289, w: 0.110, d: 0.024, swell: 0.002 },
  { y: POUCH_HEIGHT, w: 0.100, d: 0.021, swell: 0.000 },
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

/** Vertical profile + lateral bows: one continuous curving skin with coherent UVs and normals. */
function pouchFace(front: boolean): THREE.BufferGeometry {
  const verts: number[] = [], tex: number[] = [], tris: number[] = [];
  const cols = 8;
  for (const r of PROFILE) for (let i = 0; i <= cols; i++) {
    const t = i / cols, u = 2 * t - 1;
    const z = (front ? 1 : -1) * (r.d + r.swell * (1 - u * u));
    verts.push(u * r.w, r.y, z);
    tex.push(front ? t : 1 - t, r.y / POUCH_HEIGHT);
  }
  for (let j = 0; j < PROFILE.length - 1; j++) for (let i = 0; i < cols; i++) {
    const a = j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1;
    if (front) tris.push(a, b, c, b, d, c);
    else tris.push(a, c, b, b, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(tex, 2));
  geo.setIndex(tris); geo.computeVertexNormals();
  return geo;
}
function sideFold(sign: number): THREE.BufferGeometry {
  const verts: number[] = [], tris: number[] = [];
  for (const r of PROFILE) verts.push(sign * r.w, r.y, r.d, sign * r.w, r.y, -r.d);
  for (let i = 0; i < PROFILE.length - 1; i++) {
    const a = 2 * i;
    if (sign > 0) tris.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    else tris.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(tris); geo.computeVertexNormals();
  return geo;
}

export function buildKitchenJuicePouch(w: World, g: GameApi) {
  const root = new THREE.Group();
  root.name = 'kitchen-sippyjuiz-pouch';
  root.userData.room = 'kitchen';
  root.userData.cullDist = 20;
  const silver = w.material(new THREE.MeshLambertMaterial({ color: '#c8cbc5', side: THREE.DoubleSide, flatShading: true }));
  const seamMat = w.material(new THREE.MeshLambertMaterial({ color: '#eee9d9', flatShading: true }));
  const shade = w.material(new THREE.MeshLambertMaterial({ color: '#96a5a7', flatShading: true }));
  const art = w.texture(new THREE.CanvasTexture(makePrint()));
  art.colorSpace = THREE.SRGBColorSpace;
  art.anisotropy = 4;
  const printed = w.material(new THREE.MeshLambertMaterial({ map: art, side: THREE.DoubleSide }));
  const face = new THREE.Mesh(pouchFace(true), printed);
  face.castShadow = true; face.receiveShadow = true;
  root.add(face);
  const back = new THREE.Mesh(pouchFace(false), silver);
  back.castShadow = true; root.add(back);
  for (const s of [-1, 1]) {
    const side = new THREE.Mesh(sideFold(s), silver);
    side.castShadow = true; root.add(side);
  }

  // Standing bottom gusset. A recessed base under the flared skirt, not a rectangular box.
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.192, 0.007, 0.064), shade);
  base.position.y = 0.007;
  root.add(base);
  // Folded seam over the silver crest and tiny pressed lines across the upper lip.
  const rim = new THREE.Mesh(new THREE.BoxGeometry(0.205, 0.009, 0.047), seamMat);
  rim.position.y = POUCH_HEIGHT - 0.004;
  rim.castShadow = true; root.add(rim);
  // Foil pleats at the lower left/right corners accentuate the gusset flare.
  for (const sign of [-1, 1]) {
    const pleat = new THREE.Mesh(new THREE.ConeGeometry(0.019, 0.047, 3, 1), shade);
    pleat.rotation.z = sign * 0.42;
    pleat.position.set(sign * 0.110, 0.038, 0.019);
    root.add(pleat);
  }

  // Straw inserted through a small foil puncture on the front, leaning to the upper right.
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.012, 8),
    w.material(new THREE.MeshLambertMaterial({ color: '#597481', side: THREE.DoubleSide })));
  hole.position.set(-0.024, 0.271, 0.038);
  root.add(hole);
  const bottom = new THREE.Vector3(-0.023, 0.277, 0.045);
  const top = new THREE.Vector3(0.029, 0.442, 0.048);
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
