// BOSLUST-R01: small, authored 3D mechanical combination lock.
// The physical prop is visual only; the canonical cipher and its four inputs
// remain owned by the existing BOSLUST panel and puzzle rules.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { World } from '../interactions/world';
import { box, compound, rod, type Kit } from './kit';

const WHEELS = [-0.071, 0.063, 0.197, 0.331] as const;

/** The measured four-wheel layout fits beside the BOSLUST doorway. */
export const BOSLUST_LOCK_SIZE = { width: 0.99, height: 0.46, depth: 0.26 } as const;

function outline(width: number, height: number, cut: number): THREE.Shape {
  const w = width / 2, h = height / 2;
  const s = new THREE.Shape();
  s.moveTo(-w + cut, -h);
  s.lineTo(w - cut, -h);
  s.lineTo(w, -h + cut);
  s.lineTo(w, h - cut);
  s.lineTo(w - cut, h);
  s.lineTo(-w + cut, h);
  s.lineTo(-w, h - cut);
  s.lineTo(-w, -h + cut);
  s.closePath();
  return s;
}

function extruded(shape: THREE.Shape, z: number, depth: number, bevel: number): THREE.BufferGeometry {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth, steps: 1, bevelEnabled: bevel > 0, bevelThickness: bevel,
    bevelSize: bevel, bevelSegments: 1, curveSegments: 2,
  });
  geometry.translate(0, 0, z);
  return geometry;
}

function digitsTexture(w: World) {
  // One texture is reused by all four wheels; its neighbouring digits make
  // the drums read as mechanical rollers instead of four abstract cylinders.
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#161a1b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(0,0,0,.68)');
  gradient.addColorStop(.3, 'rgba(0,0,0,0)');
  gradient.addColorStop(.7, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,.68)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 100px Arial, sans-serif';
  for (const [i, digit] of ['9', '0', '1'].entries()) {
    ctx.fillStyle = i === 1 ? '#f3e8c9' : '#b3a994';
    ctx.fillText(digit, 64, 64 + i * 128);
  }
  const texture = w.texture(new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function mergedWheels(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (const x of WHEELS) {
    const cylinder = new THREE.CylinderGeometry(0.087, 0.087, 0.081, 14, 1);
    cylinder.rotateZ(Math.PI / 2); // axle runs left-to-right through the plate
    cylinder.translate(x, 0, 0.105);
    parts.push(cylinder);
  }
  const combined = mergeGeometries(parts, false)!;
  for (const part of parts) part.dispose();
  return combined;
}

function mergedDigits(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (const x of WHEELS) {
    const p = new THREE.PlaneGeometry(0.074, 0.213);
    p.translate(x, 0, 0.194); // readable on the front of each metal drum
    parts.push(p);
  }
  const combined = mergeGeometries(parts, false)!;
  for (const p of parts) p.dispose();
  return combined;
}

/** Returns separate animated parts so existing saved game flags still control the cover. */
export function makeBoslustMetalLock(w: World, k: Kit) {
  const lock = new THREE.Group();
  lock.name = 'BOSLUST metal four-wheel lock';

  // Warm, dark aged metals suit the woodland manor better than a bright gold box.
  // Moderate metalness retains legibility under the estate's variable lighting.
  const brass = w.material(new THREE.MeshStandardMaterial({ color: '#806541', metalness: 0.48, roughness: 0.49 }));
  const faceBrass = w.material(new THREE.MeshStandardMaterial({ color: '#a08452', metalness: 0.4, roughness: 0.55 }));
  const iron = w.material(new THREE.MeshStandardMaterial({ color: '#24282a', metalness: 0.22, roughness: 0.74 }));

  const body = new THREE.Mesh(extruded(outline(0.96, 0.44, 0.044), 0.005, 0.046, 0.009), brass);
  body.receiveShadow = true;
  lock.add(body);
  // Inset front is smaller, leaving a broad raised bevel around its perimeter.
  const inset = new THREE.Mesh(extruded(outline(0.884, 0.365, 0.028), 0.054, 0.011, 0.004), faceBrass);
  lock.add(inset);

  // A single vertex-coloured metal-detail batch: raised rim, corner screws,
  // recessed digit slots, thumb-turn, engraved ticks and decorative joints.
  lock.add(compound((b) => {
    for (const x of WHEELS) {
      box(b, k.M.paint, '#322d25', x, -0.119, -0.086, 0.105, 0.238, 0.027, { shadow: false });
      for (const side of [-1, 1]) {
        box(b, k.M.paint, '#c7a76d', x + side * 0.054, -0.123, -0.155, 0.009, 0.246, 0.018, { shadow: false });
      }
    }
    // Screw heads sit at the corners rather than looking like decorative blocks.
    for (const x of [-0.424, 0.424]) for (const y of [-0.16, 0.16]) {
      rod(b, k.M.paint, '#d1af73', x, y, -0.096, 0.019, 0.019, 0.016, 10, { rx: Math.PI / 2, shadow: false });
      box(b, k.M.paint, '#51402b', x, y - 0.002, -0.107, 0.025, 0.004, 0.003, { rz: 0.42, shadow: false });
    }
    // Left: raised circular thumb-turn with a recessed dark grip and a brass marker.
    rod(b, k.M.paint, '#d5af70', -0.305, 0.0, -0.092, 0.126, 0.126, 0.021, 20, { rx: Math.PI / 2, shadow: false });
    rod(b, k.M.paint, '#37342e', -0.305, 0.0, -0.108, 0.107, 0.107, 0.025, 20, { rx: Math.PI / 2, shadow: false });
    rod(b, k.M.paint, '#705337', -0.305, 0.0, -0.131, 0.072, 0.072, 0.025, 16, { rx: Math.PI / 2, shadow: false });
    box(b, k.M.paint, '#ba975c', -0.305, -0.023, -0.162, 0.17, 0.046, 0.045, { rz: -0.48, shadow: false });
    box(b, k.M.paint, '#e4c687', -0.235, -0.019, -0.188, 0.039, 0.038, 0.012, { rz: -0.48, shadow: false });
    for (const x of [-0.133, 0, 0.134, 0.268, 0.4]) {
      box(b, k.M.paint, '#c2a36a', x, -0.004, -0.18, 0.014, 0.008, 0.012, { shadow: false });
    }
  }, false));

  const drums = new THREE.Mesh(mergedWheels(), iron);
  lock.add(drums);
  const digits = new THREE.Mesh(mergedDigits(), w.material(new THREE.MeshLambertMaterial({ map: digitsTexture(w) })));
  lock.add(digits);

  // The existing cipher-cover gate is kept: until discovered it hides the
  // wheels. After opening, the little metal flap folds outward above the dials.
  const cover = new THREE.Group();
  cover.position.set(0.13, 0.198, 0.22);
  const flap = new THREE.Mesh(extruded(outline(0.575, 0.316, 0.027), 0.001, 0.015, 0.006), brass);
  flap.position.y = -0.169;
  cover.add(flap);
  cover.add(compound((b) => {
    for (const x of [-0.224, 0.224]) {
      box(b, k.M.paint, '#c4a168', x, -0.183, -0.03, 0.018, 0.205, 0.01, { shadow: false });
    }
    box(b, k.M.paint, '#3a3025', 0, -0.28, -0.036, 0.12, 0.012, 0.01, { shadow: false });
  }, false));
  lock.add(cover);
  return { lock, cover };
}
