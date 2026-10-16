// BOSLUST-R02: crafted, low-cost mechanical metal combination lock.
// The four physical drums are an authored visual; the existing cipher panel
// owns input, solution, unlock state and save compatibility.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { World } from '../interactions/world';
import { softBox } from './artkit';
import { box, compound, rod, type Kit } from './kit';

const CENTRES = [-0.063, 0.069, 0.201, 0.333] as const;
const KNOB_X = -0.307;
export const BOSLUST_LOCK_SIZE = { width: 0.99, height: 0.49, depth: 0.29 } as const;

// A shouldered plate, not a rectangular cube. Paired stepped shoulders echo
// a small period mechanical lock without pushing the game into photorealism.
const PLATE: [number, number][] = [
  [-0.485, -0.181], [-0.447, -0.219], [-0.211, -0.219],
  [-0.174, -0.193], [0.374, -0.193], [0.408, -0.215],
  [0.462, -0.209], [0.487, -0.181], [0.487, 0.179],
  [0.460, 0.212], [0.401, 0.212], [0.379, 0.180],
  [-0.134, 0.180], [-0.181, 0.231], [-0.443, 0.231],
  [-0.485, 0.193],
];
function pathShape(scale: number, holeScale?: number): THREE.Shape {
  const p = PLATE.map(([x, y]) => new THREE.Vector2(x * scale, y * scale));
  const s = new THREE.Shape(p);
  if (holeScale) s.holes.push(new THREE.Path(PLATE.slice().reverse().map(([x, y]) =>
    new THREE.Vector2(x * holeScale, y * holeScale))));
  return s;
}
function extrude(shape: THREE.Shape, z: number, depth: number, bevel: number) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth, steps: 1, bevelEnabled: bevel > 0, bevelThickness: bevel,
    bevelSize: bevel, bevelSegments: bevel > 0 ? 2 : 0, curveSegments: 2,
  });
  g.translate(0, 0, z);
  return g;
}
function patina(w: World): THREE.Texture {
  // Quiet, deterministic, brushed surface detail (only one tiny texture).
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d')!;
  x.fillStyle = '#a38759'; x.fillRect(0, 0, 128, 128);
  let seed = 71389;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 730; i++) {
    const px = random() * 128, py = random() * 128;
    x.fillStyle = random() > 0.43 ? 'rgba(41,30,21,.09)' : 'rgba(241,214,155,.11)';
    x.fillRect(px, py, 0.7 + random() * 4, 0.5 + random() * 1.3);
  }
  for (let i = 0; i < 24; i++) {
    x.beginPath();
    x.strokeStyle = i % 2 ? 'rgba(45,33,22,.09)' : 'rgba(245,217,168,.12)';
    x.lineWidth = 0.5;
    const px = random() * 128, py = random() * 128;
    x.moveTo(px, py); x.lineTo(px + 9 + random() * 18, py - 0.3 + random() * 0.6); x.stroke();
  }
  const t = w.texture(new THREE.CanvasTexture(c));
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
/** Single updated texture atlas for four actually rotating, numbered drum faces.
 *  Only updated when a wheel changes; no per-frame idle uploads or draw calls.
 */
function numberAtlas(w: World) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 384;
  const g = c.getContext('2d')!;
  const t = w.texture(new THREE.CanvasTexture(c));
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const paint = (value: number, i: number, direction = 0, progress = 0) => {
    const x = i * 128;
    g.fillStyle = '#151819'; g.fillRect(x, 0, 128, 384);
    g.save(); g.beginPath(); g.rect(x, 0, 128, 384); g.clip();
    const offset = -direction * progress * 128;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 99px Arial, sans-serif';
    // Draw five positions so 9↔0 is visibly continuous during a full step.
    for (let j = -2; j <= 2; j++) {
      const num = (value + j + 20) % 10;
      const y = 192 + j * 128 + offset + 5;
      g.fillStyle = j === 0 ? '#f4e8cf' : '#c0b7a6';
      g.fillText(String(num), x + 64, y);
    }
    const shade = g.createLinearGradient(0, 0, 0, 384);
    shade.addColorStop(0, 'rgba(0,0,0,.7)'); shade.addColorStop(.26, 'rgba(0,0,0,.08)');
    shade.addColorStop(.74, 'rgba(0,0,0,.08)'); shade.addColorStop(1, 'rgba(0,0,0,.7)');
    g.fillStyle = shade; g.fillRect(x, 0, 128, 384);
    g.fillStyle = 'rgba(197,178,141,.16)';
    g.fillRect(x, 127 + offset, 128, 1.5);
    g.fillRect(x, 255 + offset, 128, 1.5);
    g.restore();
    t.needsUpdate = true;
  };
  return { texture: t, paint };
}
function bentReels(): THREE.BufferGeometry {
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  const radius = 0.103, angle = 1.12, segments = 18;
  for (const [wheel, x] of CENTRES.entries()) {
    const base = positions.length / 3;
    for (let i = 0; i <= segments; i++) {
      const a = -angle + 2 * angle * i / segments;
      const y = radius * Math.sin(a);
      const z = 0.195 - radius * (1 - Math.cos(a));
      for (const [dx, u] of [[-0.045, 0], [0.045, 1]] as const) {
        positions.push(x + dx, y, z);
        uv.push((wheel + u) / 4, i / segments);
      }
    }
    for (let i = 0; i < segments; i++) {
      const p = base + 2 * i;
      indices.push(p, p + 2, p + 1, p + 1, p + 2, p + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(indices); g.computeVertexNormals();
  return g;
}
/** Collapse the fixed metal castings into one vertex-coloured mesh.
 *  One draw call for chassis, beveled rim, lever hub, grip and thumb-rest;
 *  avoids paying for seven separate tiny metallic draw submissions.
 */
function joinMetalCastings(w: World, lock: THREE.Group, parts: THREE.Mesh[]) {
  const pieces: THREE.BufferGeometry[] = [];
  for (const mesh of parts) {
    mesh.updateMatrix();
    const g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    g.applyMatrix4(mesh.matrix);
    if (!g.getAttribute('normal')) g.computeVertexNormals();
    const vertices = g.getAttribute('position').count;
    if (!g.getAttribute('uv')) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(vertices * 2), 2));
    const col = (mesh.material as THREE.MeshStandardMaterial).color;
    const colors = new Float32Array(vertices * 3);
    for (let i = 0; i < vertices; i++) {
      colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    pieces.push(g);
  }
  const merged = mergeGeometries(pieces, false);
  for (const g of pieces) g.dispose();
  if (!merged) throw new Error('BOSLUST lock metal castings failed to merge');
  for (const m of parts) { lock.remove(m); m.geometry.dispose(); }
  const metal = new THREE.Mesh(merged,
    w.material(new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.26, roughness: 0.65 })));
  metal.receiveShadow = true;
  metal.name = 'single-batched sculpted metal castings';
  lock.add(metal);
}

function roundedPart(w: World, size: [number,number,number], radius: number, material: THREE.Material) {
  const geo = softBox(...size, radius, 2);
  return new THREE.Mesh(geo, material);
}
/** One assembly and one hinge group; keep the saved cover state in boslust.ts. */
export function makeBoslustMetalLock(w: World, k: Kit) {
  const lock = new THREE.Group();
  lock.name = 'BOSLUST — patinated metal four-digit mechanical lock';
  const edge = w.material(new THREE.MeshStandardMaterial({ color: '#bda16e', metalness: 0.28, roughness: 0.62 }));
  const bodyMetal = w.material(new THREE.MeshStandardMaterial({ color: '#634a30', metalness: 0.28, roughness: 0.76 }));
  const patinated = w.material(new THREE.MeshStandardMaterial({ map: patina(w), color: '#e9d2a8', metalness: 0.15, roughness: 0.79 }));
  const dark = w.material(new THREE.MeshStandardMaterial({ color: '#24201e', metalness: 0.16, roughness: 0.8 }));
  const handleMetal = w.material(new THREE.MeshStandardMaterial({ color: '#715941', metalness: 0.26, roughness: 0.61 }));

  // Native THREE meshes face +Z here; kit.box/rod convert plan Z internally.\n  // Thick dark outer chassis, a raised bevel and a properly recessed inner
  // plate. The bright bezel is a shaped ring with a real hole, not a sheet
  // hiding its own detail underneath.
  const chassis = new THREE.Mesh(extrude(pathShape(1), 0.005, 0.055, 0.008), bodyMetal);
  chassis.receiveShadow = true; lock.add(chassis);
  const inset = new THREE.Mesh(extrude(pathShape(0.952), 0.060, 0.026, 0.002), patinated);
  lock.add(inset);
  const rim = new THREE.Mesh(extrude(pathShape(1.002, 0.934), 0.079, 0.032, 0.006), edge);
  lock.add(rim);

  // Knob: the concentric rings, recessed lock barrel, and chamfered turning
  // grip are true 3D geometry with rounded edges.
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.010, 6, 28), edge);
  ring.position.set(KNOB_X, 0.003, 0.126); lock.add(ring);
  const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.111, 0.111, 0.029, 24), dark);
  spindle.rotation.x = Math.PI / 2; spindle.position.set(KNOB_X, 0.003, 0.137); lock.add(spindle);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.079, 0.079, 0.041, 20), handleMetal);
  hub.rotation.x = Math.PI / 2; hub.position.set(KNOB_X, 0.003, 0.158); lock.add(hub);
  const grip = roundedPart(w, [0.22, 0.061, 0.055], 0.012, handleMetal);
  grip.rotation.z = -0.55; grip.position.set(KNOB_X, 0.0, 0.199); lock.add(grip);
  const thumb = roundedPart(w, [0.054, 0.059, 0.015], 0.004, edge);
  thumb.rotation.z = -0.55; thumb.position.set(KNOB_X + 0.076, -0.043, 0.242); lock.add(thumb);
  joinMetalCastings(w, lock, [chassis, rim, ring, spindle, hub, grip, thumb]);

  // Four actual curved digit surfaces in four shadowed wells, with slim
  // machined separators and a fine common centre-line. Dark centre keeps
  // the required combination readable without glowing UI elements.
  lock.add(compound((b) => {
    for (const x of CENTRES) {
      box(b, k.M.paint, '#30291f', x, -0.128, -0.109, 0.111, 0.255, 0.058, { shadow: false });
      // Narrow lips, no earlier oversized vertical golden strips.
      for (const sign of [-1, 1]) {
        box(b, k.M.paint, '#97774b', x + sign * 0.053, -0.118, -0.174, 0.006, 0.238, 0.01, { shadow: false });
      }
      box(b, k.M.paint, '#d0b077', x, -0.006, -0.193, 0.009, 0.007, 0.005, { shadow: false });
    }
    // Corner fasteners: partly recessed heads with a narrow engraved slot.
    for (const x of [-0.448, 0.45]) for (const y of [-0.169, 0.169]) {
      rod(b, k.M.paint, '#a78956', x, y, -0.089, 0.017, 0.017, 0.011, 12, { rx: Math.PI / 2, shadow: false });
      box(b, k.M.paint, '#4a3626', x, y - 0.002, -0.101, 0.024, 0.003, 0.003, { rz: 0.58, shadow: false });
    }
    // Knob sweep: clear but understated OPEN/CLOSE pointer marks.
    for (const [x,y,turn] of [[-0.407,-0.09,-0.50],[-0.40,0.105,0.50],[-0.225,0.112,-0.5]] as const) {
      box(b, k.M.paint, '#d8b777', x, y, -0.106, 0.032, 0.007, 0.006, { rz: turn, shadow: false });
    }
    // Divider underlining forms a continuous horizontal code reading axis.
    box(b, k.M.paint, '#735632', 0.135, -0.004, -0.105, 0.535, 0.007, 0.01, { shadow: false });
  }));
  const atlas = numberAtlas(w);
  const band = new THREE.Mesh(bentReels(),
    w.material(new THREE.MeshLambertMaterial({ map: atlas.texture, side: THREE.DoubleSide })));
  band.receiveShadow = true; lock.add(band);

  const values = [0, 0, 0, 0];
  const motion = CENTRES.map(() => ({ from: 0, to: 0, direction: 1, elapsed: 0, moving: false }));
  let initialized = false;
  const setDigits = (next: readonly number[], animate = true) => {
    if (next.length !== 4) return;
    if (!initialized) {
      for (let i = 0; i < 4; i++) {
        values[i] = next[i]; motion[i].to = next[i];
        atlas.paint(values[i], i);
      }
      initialized = true;
      return;
    }
    for (let i = 0; i < 4; i++) {
      if (values[i] === next[i] && (animate || !motion[i].moving)) continue;
      const from = values[i], to = next[i];
      const m = motion[i];
      m.from = from; m.to = to; m.elapsed = 0;
      const forward = to === (from + 1) % 10;
      const backward = to === (from + 9) % 10;
      values[i] = to;
      // A single physical click rotates. Multi-digit changes and a solved
      // lock snap to the authoritative final number rather than rendering an
      // unrelated intermediate digit for a few software-rendered frames.
      if (!animate || (!forward && !backward)) {
        m.moving = false; atlas.paint(to, i);
        continue;
      }
      m.direction = backward ? -1 : 1;
      m.moving = true;
    }
  };
  w.onUpdate((dt) => {
    for (let i = 0; i < motion.length; i++) {
      const m = motion[i];
      if (!m.moving) continue;
      m.elapsed += dt;
      const t = Math.min(1, m.elapsed / 0.16);
      // Ease out without overshoot; saved state always holds the final exact digit.
      const eased = 1 - (1 - t) * (1 - t);
      atlas.paint(m.from, i, m.direction, eased);
      if (t >= 1) { m.moving = false; atlas.paint(m.to, i); }
    }
  });

  // The original cover puzzle is retained. This is now a shaped, thin metal
  // access flap with one engraved emblem, restrained rim and mechanical hinge.
  const cover = new THREE.Group();
  cover.position.set(0.135, 0.154, 0.214);
  const doorMat = w.material(new THREE.MeshStandardMaterial({ color: '#90714d', metalness: 0.20, roughness: 0.73, emissive: '#4a3521', emissiveIntensity: 0.08 }));
  const flap = new THREE.Mesh(extrude((() => {
    const s = new THREE.Shape();
    s.moveTo(-0.273, -0.285); s.lineTo(0.256, -0.285);
    s.lineTo(0.282, -0.256); s.lineTo(0.282, -0.017);
    s.lineTo(0.26, 0.008); s.lineTo(-0.267, 0.008);
    s.lineTo(-0.282, -0.017); s.lineTo(-0.282, -0.260); s.closePath();
    return s;
  })(), 0.002, 0.012, 0.004), doorMat);
  cover.add(flap);
  // Subtle relief, not the previous two thick vertical bars.
  cover.add(compound((b) => {
    for (const sign of [-1, 1]) {
      box(b, k.M.paint, '#ab8954', sign * 0.253, -0.269, -0.030, 0.009, 0.245, 0.007, { shadow: false });
    }
    box(b, k.M.paint, '#b59966', 0, -0.035, -0.030, 0.465, 0.009, 0.007, { shadow: false });
    box(b, k.M.paint, '#ab8954', 0, -0.272, -0.030, 0.46, 0.007, 0.007, { shadow: false });
    // A small centred diamond with short lines adds recognizable craftsmanship.
    box(b, k.M.paint, '#b9975c', 0, -0.161, -0.030, 0.046, 0.046, 0.005, { rz: Math.PI / 4, shadow: false });
    box(b, k.M.paint, '#483626', 0, -0.161, -0.039, 0.026, 0.026, 0.003, { rz: Math.PI / 4, shadow: false });
    for (const x of [-0.090, 0.090]) {
      box(b, k.M.paint, '#b9975c', x, -0.162, -0.030, 0.04, 0.004, 0.005, { shadow: false });
    }
    box(b, k.M.paint, '#35291e', 0, -0.281, -0.033, 0.090, 0.009, 0.009, { shadow: false });
  }));
  // Actual hinge pins on the frame, shared material/draw call.
  lock.add(compound((b) => {
    for (const x of [-0.076, 0.344]) {
      rod(b, k.M.paint, '#aa8853', x, 0.154, -0.151, 0.018, 0.018, 0.075, 10, { rz: Math.PI / 2, shadow: false });
    }
  }));
  lock.add(cover);
  return { lock, cover, setDigits };
}
