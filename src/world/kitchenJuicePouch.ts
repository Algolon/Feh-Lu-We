// Optional kitchen still life: one small, fictional fruit-drink pouch on the island.
// Separate from clues, inventory, saves and progression. Crafted low-poly art rather than product branding.
import * as THREE from 'three';
import type { World, GameApi } from '../interactions/world';
import { makeAction, place } from '../interactions/props';

/** A simple illustrated, non-branded print. No photographed packaging or Capri-Sun identity assets. */
function fruitPrint(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const x = canvas.getContext('2d')!;
  // Broad hand-authored colour blocks: readable on a phone, in the manor's cool-green palette.
  x.fillStyle = '#245b70';
  x.fillRect(0, 0, 256, 384);
  x.fillStyle = '#397f91';
  x.beginPath(); x.moveTo(0, 153); x.quadraticCurveTo(121, 115, 256, 170);
  x.lineTo(256, 384); x.lineTo(0, 384); x.closePath(); x.fill();
  x.fillStyle = '#80b5a3';
  x.beginPath(); x.moveTo(0, 262); x.quadraticCurveTo(128, 204, 256, 276);
  x.lineTo(256, 384); x.lineTo(0, 384); x.closePath(); x.fill();
  // Small, original sun emblem — intentionally unlike any commercial juice logo.
  x.fillStyle = '#e8b854';
  x.beginPath(); x.arc(128, 43, 19, 0, Math.PI * 2); x.fill();
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    x.fillRect(126 + Math.cos(a) * 26, 41 + Math.sin(a) * 26, 5, 5);
  }
  x.textAlign = 'center';
  x.fillStyle = '#f7eed8';
  x.font = 'bold 37px Georgia, serif';
  x.fillText('BOSFRUIT', 128, 117, 235);
  x.font = 'bold 20px Arial, sans-serif';
  x.fillStyle = '#efe5c9';
  x.fillText('FRUITMIX', 128, 146);
  // Simplified fruit silhouettes, not a photograph/brand illustration.
  x.fillStyle = '#c9543a'; // apple
  x.beginPath(); x.moveTo(71, 288); x.bezierCurveTo(31, 259, 23, 337, 67, 347);
  x.bezierCurveTo(112, 354, 113, 267, 71, 288); x.fill();
  x.strokeStyle = '#684c2e'; x.lineWidth = 6;
  x.beginPath(); x.moveTo(72, 291); x.lineTo(77, 268); x.stroke();
  x.fillStyle = '#83a85b'; x.beginPath(); x.ellipse(90, 270, 15, 7, -0.5, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#dfa342'; // orange
  x.beginPath(); x.arc(158, 315, 42, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#f3d990'; x.beginPath(); x.arc(158, 315, 33, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#d18c3e'; x.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    x.beginPath(); x.moveTo(158, 315); x.lineTo(158 + 31 * Math.cos(a), 315 + 31 * Math.sin(a)); x.stroke();
  }
  x.fillStyle = '#88a956'; // kiwi
  x.beginPath(); x.arc(121, 319, 30, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#e3d8aa'; x.beginPath(); x.arc(121, 319, 12, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#3c5b40';
  for (let i = 0; i < 9; i++) {
    const a = i * Math.PI * 2 / 9;
    x.beginPath(); x.arc(121 + 21 * Math.cos(a), 319 + 21 * Math.sin(a), 2, 0, Math.PI * 2); x.fill();
  }
  x.fillStyle = '#f6edda';
  x.font = '16px Arial, sans-serif';
  x.fillText('200 ml', 128, 376);
  return canvas;
}

/** Freestanding pouch: crimped foil rim, widened gusset, subtly bulged printed face and paper straw. */
export function buildKitchenJuicePouch(w: World, g: GameApi) {
  const root = new THREE.Group();
  root.name = 'kitchen-bosfruit-pouch';
  root.userData.room = 'kitchen';
  root.userData.cullDist = 20;

  // Nearly planar, but irregular edges and bevels make the packet read as flexible folded foil, not a box.
  const silhouette = new THREE.Shape();
  silhouette.moveTo(-0.105, 0.023);
  silhouette.quadraticCurveTo(-0.122, 0.027, -0.119, 0.065);
  silhouette.lineTo(-0.111, 0.253);
  silhouette.quadraticCurveTo(-0.110, 0.271, -0.095, 0.275);
  silhouette.lineTo(0.096, 0.275);
  silhouette.quadraticCurveTo(0.111, 0.270, 0.113, 0.253);
  silhouette.lineTo(0.120, 0.063);
  silhouette.quadraticCurveTo(0.122, 0.029, 0.105, 0.023);
  silhouette.quadraticCurveTo(0, 0.012, -0.105, 0.023);
  const foil = w.material(new THREE.MeshLambertMaterial({ color: '#d3d8d1', flatShading: true }));
  const edgeFoil = w.material(new THREE.MeshLambertMaterial({ color: '#efe7d8', flatShading: true }));
  const shape = new THREE.ExtrudeGeometry(silhouette, {
    depth: 0.052, steps: 1, bevelEnabled: true, bevelSegments: 1,
    bevelThickness: 0.005, bevelSize: 0.005, curveSegments: 2,
  });
  shape.translate(0, 0, -0.026);
  const body = new THREE.Mesh(shape, foil);
  body.castShadow = true;
  body.receiveShadow = true;
  root.add(body);

  // Painted surface is a shaped/curved polygonal face, not a flat photo pasted onto a cube.
  const texture = w.texture(new THREE.CanvasTexture(fruitPrint()));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;
  const faceGeometry = new THREE.PlaneGeometry(0.201, 0.217, 4, 3);
  const vertices = faceGeometry.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i) / 0.1005;
    vertices.setZ(i, 0.035 + 0.003 * (1 - x * x));
  }
  faceGeometry.computeVertexNormals();
  const face = new THREE.Mesh(faceGeometry, w.material(new THREE.MeshLambertMaterial({ map: texture, side: THREE.DoubleSide })));
  face.position.y = 0.145;
  face.castShadow = false;
  root.add(face);

  // Broad crimped top and gusset at the bottom, plus narrow folded vertical heat seals.
  const topSeal = new THREE.Mesh(new THREE.BoxGeometry(0.202, 0.014, 0.056), edgeFoil);
  topSeal.position.set(0, 0.269, 0);
  root.add(topSeal);
  const bottomFold = new THREE.Mesh(new THREE.BoxGeometry(0.208, 0.019, 0.071), foil);
  bottomFold.position.set(0, 0.019, 0);
  bottomFold.castShadow = true;
  root.add(bottomFold);
  for (const side of [-1, 1]) {
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.210, 0.008), edgeFoil);
    seam.position.set(side * 0.112, 0.145, 0.027);
    seam.rotation.z = -side * 0.035;
    root.add(seam);
  }

  // A small paper straw projects from the sealed top; angular six-sided profile matches other kitchen props.
  const strawMat = w.material(new THREE.MeshLambertMaterial({ color: '#f2ead7' }));
  const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.131, 6), strawMat);
  straw.position.set(-0.046, 0.330, 0.003);
  straw.rotation.z = -0.18;
  straw.castShadow = true;
  root.add(straw);
  const puncture = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.004, 8), foil);
  puncture.position.set(-0.058, 0.280, 0.003);
  root.add(puncture);

  // Island stone slab: centre Y = GF+0.885, half-thickness = 0.025. South-facing, away from the note/drawer.
  place(root, 101.12, 0.910, 105.05);
  w.scene.add(root);
  makeAction(w, {
    id: 'inspect.kitchenBosfruit',
    obj: root,
    hit: [0.33, 0.40, 0.19],
    hitOffset: [0, 0.19, 0],
    reach: 3.0,
    label: () => 'Bekijken: drinkzakje',
    run: () => g.act({ ok: true, msg: 'Is dit de laatste capri sun?', sfx: 'none' }, { save: false }),
  });
}
