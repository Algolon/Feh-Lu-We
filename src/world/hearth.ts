// Fireplace with a real open firebox (the fire stands in FRONT of the dark back wall, never inside a box),
// logs on a grate, a shared combustion visual, a pooled-light source, a floor glow patch, and optionally
// the canonical mantelpiece (hall drawer evidence) built from src/content/canon.ts.
import * as THREE from 'three';
import type { World, GameApi } from '../interactions/world';
import type { Ctx } from './arch';
import { box, cyl, rod, blob, geo, compound, v3, getKit, type Batcher } from './kit';
import { makeFire } from './fire';
import { makeInspect, makeAction, place, lightableItemLabel } from '../interactions/props';
import { MANTEL, mantelSlots } from '../content/canon';
import { has } from '../core/state';
import { hearthV2, mantelV2, embers } from './livingSample';
import type { ContactShadows } from './artkit';

export interface HearthOpts {
  id: string; // lit-state id, e.g. 'fire.living'
  x: number; z: number; // plan point on the inner wall face at the fireplace centre line
  y: number; // floor height
  facing: number; // plan heading the fireplace faces (into the room)
  ceil: number; // ceiling height (chimney breast top)
  mantel?: boolean; // place the canonical mantel objects
  defaultLit?: boolean;
  name?: string;
  /** Art-refresh sample: 'v2' builds the new surround/mantel (batched into the room) instead of the original. */
  style?: 'v2';
  shadows?: ContactShadows;
}

/** Local frame: lx = distance from the wall into the room, lz = along the wall (+lz = viewer's right). */
function frame(o: HearthOpts) {
  const yaw = o.facing - Math.PI / 2;
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return (lx: number, lz: number) => ({ x: o.x + lx * c + lz * s, z: o.z - lx * s + lz * c });
}

export function buildHearth(w: World, g: GameApi, c: Ctx, o: HearthOpts) {
  const k = c.k;
  const P = frame(o);
  const yaw = o.facing - Math.PI / 2;
  const Y = o.y;
  // surround + firebox in a local compound placed at the wall point (rotated as one piece)
  if (o.style === 'v2') hearthV2(c, o.shadows!, o, o.ceil);
  else {
  const body = compound((b: Batcher) => {
    const B = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: THREE.Material, col: string, uv = 1.2) =>
      box(b, mat, col, (x0 + x1) / 2, y0, (z0 + z1) / 2, x1 - x0, y1 - y0, z1 - z0, { uv });
    B(0, 0.28, 1.33, o.ceil - Y, -1.2, 1.2, k.M.stone, '#e8dcc0', 1.6); // chimney breast (shallow: mantel objects stand clear)
    for (const s of [-1, 1]) B(0, 0.62, 0, 0.98, s > 0 ? 0.72 : -1.38, s > 0 ? 1.38 : -0.72, k.M.stone, '#e2d2b2'); // jambs
    B(0, 0.62, 0.98, 1.25, -1.38, 1.38, k.M.stone, '#e2d2b2'); // lintel
    B(0, 0.05, 0, 0.98, -0.72, 0.72, k.M.paint, '#1a1410'); // soot-dark back wall of the firebox
    for (const s of [-1, 1]) B(0.05, 0.6, 0, 0.98, s * 0.7 - 0.012, s * 0.7 + 0.012, k.M.paint, '#2a201a'); // inner cheeks
    B(0, 0.62, 0.95, 0.98, -0.72, 0.72, k.M.paint, '#1a1410'); // firebox ceiling
    B(0, 1.15, 0, 0.05, -1.32, 1.32, k.M.stone, '#cbb898'); // hearthstone (projects into the room)
    B(0, 0.78, 1.25, 1.33, -1.72, 1.72, k.M.stone, '#d8c6a4'); // mantel shelf
    // iron grate + andirons
    box(b, k.M.paint, '#2b2622', 0.32, 0.05, 0, 0.36, 0.03, 0.9);
    for (const s of [-1, 1]) box(b, k.M.paint, '#2b2622', 0.5, 0.05, s * 0.48, 0.05, 0.22, 0.05);
    // logs: two crossed and one across the front
    // DEV-04A: centred on the grate (they floated ~0.4 m above it through `cyl`'s base height)
    rod(b, k.M.bark, '#6b4a32', 0.3, 0.15, -0.12, 0.065, 0.075, 0.82, 7, { rx: Math.PI / 2, yaw: 0.25 });
    rod(b, k.M.bark, '#7a5a3a', 0.36, 0.15, 0.12, 0.06, 0.07, 0.78, 7, { rx: Math.PI / 2, yaw: -0.3 });
    rod(b, k.M.bark, '#5e4030', 0.44, 0.26, 0, 0.055, 0.06, 0.6, 7, { rx: Math.PI / 2, yaw: Math.PI / 2 });
    blob(b, k.M.paint, '#2a1f18', 0.32, 0.06, 0, 0.32, 0.03, 0.42); // ash bed
  });
  place(body, o.x, Y, o.z, yaw);
  body.userData.noCull = true; // large static piece; the room chunk decides its visibility
  w.scene.add(body);
  }
  // collision for the whole fireplace footprint (rotated rectangle → AABB of its corners)
  const corners = [P(0, -1.75), P(0.8, -1.75), P(0, 1.75), P(0.8, 1.75)];
  c.col.addBox(Math.min(...corners.map((p) => p.x)), Math.max(...corners.map((p) => p.x)), Math.min(...corners.map((p) => p.z)), Math.max(...corners.map((p) => p.z)), Y - 0.2, Y + 1.32, { occludes: false });

  // the fire itself: in front of the dark back wall, on the grate
  const lit = () => g.state.lit[o.id] ?? o.defaultLit ?? false;
  const fp = P(0.32, 0);
  const fire = makeFire(w, { kind: 'hearth', x: fp.x, y: Y + 0.09, z: fp.z, s: 0.95, owner: { region: c.chunk } }); // DEV-04C: drawn with its room
  const lp = P(0.95, 0);
  w.lamps.push({ id: o.id, pos: v3(lp.x, Y + 0.6, lp.z), color: '#ff9a4a', intensity: 7, distance: 8, on: lit, flicker: 0.3 });
  w.emitters.push({ kind: 'fire', pos: v3(fp.x, Y + 0.5, fp.z), on: lit });
  if (o.style === 'v2') {
    embers(fire, w);
    const pp = P(1.15, 0); // softer, wider pool spread along the hearth
    w.patches.add(pp.x, Y + 0.03, pp.z, 1.45, '#ff8a3a', lit, 0.34, { soft: true, aspect: 1.35, yaw: o.facing });
  } else {
    const pp = P(1.25, 0);
    w.patches.add(pp.x, Y + 0.03, pp.z, 1.7, '#ff8a3a', lit, 0.5);
  }
  w.onSync(() => { fire.visible = lit(); });
  const fireHit = new THREE.Group();
  const hp = P(0.4, 0);
  place(fireHit, hp.x, Y, hp.z, yaw);
  w.scene.add(fireHit);
  makeAction(w, {
    id: o.id, obj: fireHit, hit: [0.8, 0.9, 1.4], hitOffset: [0, 0.45, 0],
    label: () => (lit() ? 'Vuur doven' : 'Open haard'),
    run: () => {
      if (lit()) { g.state.lit[o.id] = false; g.act({ ok: true, msg: 'Je dooft het vuur. De haard gloeit nog even na.', sfx: 'click' }); return; }
      g.toast(has(g.state, 'matches') ? 'Er ligt hout klaar. Neem de lucifers in de hand om het aan te steken.' : 'Er ligt hout klaar, maar je hebt niets om het aan te steken.');
    },
    itemLabel: lightableItemLabel(lit),
    useItem: (item) => {
      if (item !== 'matches') { g.act({ ok: false, msg: 'Daarmee krijg je de haard niet aan.', sfx: 'fail' }, { save: false }); return; }
      if (lit()) { g.toast('Het vuur brandt al.'); return; }
      g.state.lit[o.id] = true;
      g.act({ ok: true, msg: 'Het droge hout vat meteen vlam. De kamer wordt warm en oranje.', sfx: 'fire' });
    },
  });

  if (o.mantel) buildMantel(w, g, o, c);
  return { lit };
}

/** Feather vane halves (local metres, base at origin, tip up), matching the 'veer' symbol silhouette. */
function featherGeo(side: 1 | -1) {
  const s = new THREE.Shape();
  s.moveTo(0, 0.02);
  if (side > 0) {
    s.bezierCurveTo(0.035, 0.07, 0.05, 0.17, 0.03, 0.27);
    s.bezierCurveTo(0.022, 0.31, 0.012, 0.33, 0.002, 0.345);
  } else {
    s.bezierCurveTo(-0.022, 0.06, -0.034, 0.14, -0.028, 0.2);
    // a small split in the vane, typical for a real feather
    s.lineTo(-0.012, 0.215);
    s.bezierCurveTo(-0.022, 0.26, -0.014, 0.31, 0.002, 0.345);
  }
  s.lineTo(0, 0.02);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: false, curveSegments: 6 });
  g.translate(0, 0, -0.003);
  return g;
}

function archTopGeo(w: number, h: number, d: number) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(w / 2, h - w / 2);
  s.absarc(0, h - w / 2, w / 2, 0, Math.PI, false);
  s.lineTo(-w / 2, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 8 });
  g.translate(0, 0, -d / 2);
  return g;
}

function latheGeo(profile: [number, number][], seg = 14) {
  return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg);
}

/**
 * The canonical mantelpiece: six objects left → right as the viewer faces the fireplace. The three answer
 * objects stand on identical brass stands; the others have clearly different bases (tin dish, wooden
 * plinth, lace doily). All static: one compound, so the row costs two draw calls.
 */
function buildMantel(w: World, g: GameApi, o: HearthOpts, c: Ctx) {
  const k = getKit();
  const P = frame(o);
  const top = o.y + 1.33;
  const centre = P(0.5, 0);
  const slots = mantelSlots(centre.x, centre.z, o.facing, 0.56);
  const face = o.facing; // objects show their front to the room
  const S = 1.45; // shown larger than life so silhouettes read from the room
  if (o.style === 'v2') mantelV2(c, o, centre);
  else {
  const grp = compound((b) => {
    MANTEL.forEach((m, i) => {
      const { x, z } = slots[i];
      let y = top;
      // ---- base
      if (m.base === 'brass') {
        cyl(b, k.M.paint, '#d9b14a', x, y, z, 0.06 * S, 0.065 * S, 0.012 * S, 12);
        cyl(b, k.M.paint, '#c9a44c', x, y + 0.012 * S, z, 0.016 * S, 0.02 * S, 0.045 * S, 8);
        cyl(b, k.M.paint, '#e2be5a', x, y + 0.057 * S, z, 0.05 * S, 0.045 * S, 0.01 * S, 12);
        y += 0.067 * S;
      } else if (m.base === 'tin') {
        cyl(b, k.M.paint, '#a9adb3', x, y, z, 0.085 * S, 0.075 * S, 0.012 * S, 14);
        y += 0.012 * S;
      } else if (m.base === 'plinth') {
        box(b, k.M.wood, '#5a3a22', x, y, z, 0.2 * S, 0.035 * S, 0.15 * S, { yaw: face, uv: 0.4 });
        y += 0.035 * S;
      } else {
        cyl(b, k.M.paint, '#fbf8f0', x, y, z, 0.1 * S, 0.1 * S, 0.004, 16);
        y += 0.004;
      }
      // ---- object
      const fwd = { x: Math.sin(face), z: Math.cos(face) }; // towards the room
      if (m.sym === 'kaars') {
        cyl(b, k.M.paint, '#f3ead0', x, y, z, 0.026 * S, 0.028 * S, 0.19 * S, 10);
        blob(b, k.M.paint, '#fbf6e6', x + fwd.x * 0.02 * S, y + 0.17 * S, z + fwd.z * 0.02 * S, 0.012 * S, 0.03 * S, 0.012 * S);
        cyl(b, k.M.paint, '#2b2118', x, y + 0.19 * S, z, 0.003 * S, 0.003 * S, 0.018 * S, 4);
      } else if (m.sym === 'veer') {
        // a clip on the stand holds the feather upright, flat side to the room, tip leaning slightly back
        cyl(b, k.M.paint, '#c9a44c', x, y, z, 0.012 * S, 0.012 * S, 0.03 * S, 6);
        for (const side of [1, -1] as const) {
          const fg = featherGeo(side);
          geo(b, k.M.paint, side > 0 ? '#e6dcc4' : '#f6f1e4', fg, x, y + 0.01, z, { yaw: face, s: [S * 1.1, S * 1.1, S], rz: -0.12, jitter: 0 });
          fg.dispose();
        }
        // barbs: a few darker strokes slanting towards the tip
        for (let i = 0; i < 4; i++) {
          const hy = (0.09 + i * 0.055) * S;
          for (const side of [1, -1]) {
            const ox = Math.sin(-0.12) * -hy + side * 0.014 * S;
            box(b, k.M.paint, '#b9ab8e', x + Math.sin(face + Math.PI / 2) * ox, y + 0.01 + hy, z + Math.cos(face + Math.PI / 2) * ox, 0.022 * S, 0.0025 * S, 0.004, { yaw: face, rz: side * 0.6 - 0.12 });
          }
        }
        cyl(b, k.M.paint, '#6b5a44', x, y, z, 0.003 * S, 0.004 * S, 0.37 * S, 4, { rz: -0.12, yaw: face });
      } else if (m.sym === 'klok') {
        const cg = archTopGeo(0.16 * S, 0.24 * S, 0.1 * S);
        geo(b, k.M.wood, '#a8743f', cg, x, y, z, { yaw: face });
        cg.dispose();
        const dz = 0.052 * S;
        cyl(b, k.M.paint, '#f6efdc', x + fwd.x * dz, y + 0.13 * S, z + fwd.z * dz, 0.055 * S, 0.055 * S, 0.008, 16, { rx: Math.PI / 2, yaw: face });
        box(b, k.M.paint, '#2b2118', x + fwd.x * (dz + 0.006), y + 0.13 * S, z + fwd.z * (dz + 0.006), 0.006 * S, 0.045 * S, 0.004, { yaw: face });
        box(b, k.M.paint, '#2b2118', x + fwd.x * (dz + 0.007), y + 0.13 * S, z + fwd.z * (dz + 0.007), 0.032 * S, 0.006 * S, 0.004, { yaw: face, rz: 0.5 });
      } else if (m.sym === 'dennenappel') {
        blob(b, k.M.paint, '#7a4e26', x, y + 0.085 * S, z, 0.05 * S, 0.085 * S, 0.05 * S);
        for (let r = 0; r < 4; r++) for (let j = 0; j < 7; j++) {
          const a = (j / 7) * Math.PI * 2 + r * 0.45;
          const rad = (0.05 - Math.abs(r - 1.4) * 0.008) * S;
          box(b, k.M.paint, r % 2 ? '#5e3a1c' : '#8a5a2a', x + Math.cos(a) * rad, y + (0.03 + r * 0.035) * S, z + Math.sin(a) * rad, 0.03 * S, 0.012 * S, 0.026 * S, { yaw: -a + Math.PI / 2, rx: 0.5 });
        }
        cyl(b, k.M.paint, '#4a3020', x, y + 0.168 * S, z, 0.006 * S, 0.009 * S, 0.025 * S, 5);
      } else if (m.sym === 'vaas') {
        const vg = latheGeo([[0.001, 0], [0.04, 0.005], [0.055, 0.05], [0.05, 0.11], [0.028, 0.16], [0.03, 0.19], [0.026, 0.19]].map(([r, h]) => [r * S, h * S]) as [number, number][]);
        geo(b, k.M.paint, '#4f7fa8', vg, x, y, z);
        vg.dispose();
        cyl(b, k.M.paint, '#4f8a3a', x, y + 0.18 * S, z, 0.004 * S, 0.004 * S, 0.16 * S, 4, { rz: 0.1 });
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * Math.PI * 2;
          blob(b, k.M.paint, '#e8c547', x + Math.cos(a) * 0.022 * S - 0.016 * S, y + 0.345 * S, z + Math.sin(a) * 0.022 * S, 0.018 * S, 0.012 * S, 0.018 * S);
        }
        blob(b, k.M.paint, '#c9774a', x - 0.016 * S, y + 0.35 * S, z, 0.012 * S, 0.012 * S, 0.012 * S);
      } else if (m.sym === 'kopje') {
        cyl(b, k.M.paint, '#f2efe6', x, y, z, 0.075 * S, 0.07 * S, 0.01 * S, 16);
        const cupG = latheGeo([[0.001, 0.01], [0.032, 0.012], [0.045, 0.035], [0.05, 0.065], [0.047, 0.066]].map(([r, h]) => [r * S, h * S]) as [number, number][]);
        geo(b, k.M.paint, '#8fb4d8', cupG, x, y, z);
        cupG.dispose();
        cyl(b, k.M.paint, '#a8723c', x, y + 0.058 * S, z, 0.043 * S, 0.043 * S, 0.004, 14);
        const side = { x: Math.sin(face + Math.PI / 2), z: Math.cos(face + Math.PI / 2) };
        const hg = new THREE.TorusGeometry(0.018 * S, 0.005 * S, 6, 10, Math.PI * 1.2);
        geo(b, k.M.paint, '#8fb4d8', hg, x + side.x * 0.05 * S, y + 0.04 * S, z + side.z * 0.05 * S, { yaw: face + Math.PI / 2, rz: -Math.PI * 0.6 });
        hg.dispose();
      }
    });
  });
  grp.userData.noCull = true;
  w.scene.add(grp);
  }
  // brass reading-direction plaque on the shelf edge (a visual anchor for "left → right")
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 64;
  const x = cv.getContext('2d')!;
  x.fillStyle = '#c9a44c'; x.fillRect(0, 0, 512, 64);
  x.strokeStyle = '#7a5a1a'; x.lineWidth = 4; x.strokeRect(3, 3, 506, 58);
  x.fillStyle = '#3a2a1a'; x.font = 'bold 34px Georgia'; x.textAlign = 'center'; x.fillText('links  ⟶  rechts', 256, 44);
  const tex = w.texture(new THREE.CanvasTexture(cv)); tex.colorSpace = THREE.SRGBColorSpace;
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.075), w.material(new THREE.MeshLambertMaterial({ map: tex })));
  const pp = P(o.style === 'v2' ? 0.808 : 0.785, 0); // v2: on the shelf's flat fascia
  pl.position.copy(v3(pp.x, o.y + (o.style === 'v2' ? 1.262 : 1.29), pp.z));
  pl.rotation.y = Math.PI - o.facing; // plane normal points into the room
  w.scene.add(pl);
  // one inspect target over the whole shelf
  const mh = new THREE.Group();
  const mp = P(0.45, 0);
  place(mh, mp.x, o.y + 1.33, mp.z, o.facing - Math.PI / 2);
  w.scene.add(mh);
  makeInspect(w, g, { id: 'inspect.mantel', obj: mh, clue: 'c.mantel', hit: [0.6, 0.55, 3.4], hitOffset: [0, 0.25, 0], label: 'Bekijken: schoorsteenmantel' });
}
