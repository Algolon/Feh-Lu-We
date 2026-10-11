// VCP-01: three library-only assets. Original builders remain the production path.
import * as THREE from 'three';
import { Asm, artMats, lathe, projectUV, bake, baseAO, ContactShadows } from './artkit';
import { joinery } from './furniture';
import { upholstered } from './livingSample';
import type { Ctx } from './arch';
import type { World } from '../interactions/world';
import { mulberry32 } from '../core/rng';
const { cg, sb, bx } = joinery;

/** Collapse zero-area axis faces from Three's lathe caps; retain smooth profile normals. Local to this pilot. */
function turned(profile: [number, number][], segments: number) {
  const g = lathe(profile, segments),
    p = g.attributes.position,
    n = g.attributes.normal;
  const a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    c = new THREE.Vector3(),
    keep: number[] = [];
  const index = g.index!;
  for (let i = 0; i < index.count; i += 3) {
    const ia = index.getX(i),
      ib = index.getX(i + 1),
      ic = index.getX(i + 2);
    a.fromBufferAttribute(p, ia);
    b.fromBufferAttribute(p, ib);
    c.fromBufferAttribute(p, ic);
    if (b.sub(a).cross(c.sub(a)).lengthSq() > 1e-18) keep.push(ia, ib, ic);
  }
  g.setIndex(keep);
  for (let i = 0; i < n.count; i++) {
    a.fromBufferAttribute(n, i);
    if (a.lengthSq() < 0.9) n.setXYZ(i, 0, p.getY(i) === profile[0][1] ? -1 : 1, 0);
    else {
      a.normalize();
      n.setXYZ(i, a.x, a.y, a.z);
    }
  }
  return g;
}

/** Explicit profile dimensions also used by the focused geometry tests. Metres above the floor. */
export const GLOBE = { radius: 0.27, centre: 0.86, ringInner: 0.289, ringOuter: 0.306, tilt: 0.23 };
export function globeParts() {
  return {
    sphere: cg('vcp.globe.sphere', () => new THREE.SphereGeometry(GLOBE.radius, 40, 24)),
    // A closed flat-section band, not a round wire. Small chamfers catch brass highlights.
    meridian: cg('vcp.globe.band', () =>
      turned(
        [
          [0.289, -0.01],
          [0.292, -0.014],
          [0.303, -0.014],
          [0.306, -0.01],
          [0.306, 0.01],
          [0.303, 0.014],
          [0.292, 0.014],
          [0.289, 0.01],
          [0.289, -0.01],
        ],
        64,
      ).rotateX(Math.PI / 2),
    ),
    pedestal: cg('vcp.globe.pedestal', () =>
      bake(
        projectUV(
          turned(
            [
              [0, 0],
              [0.225, 0],
              [0.24, 0.018],
              [0.24, 0.043],
              [0.228, 0.059],
              [0.204, 0.065],
              [0.204, 0.084],
              [0.175, 0.097],
              [0.122, 0.104],
              [0.115, 0.124],
              [0.087, 0.135],
              [0.069, 0.17],
              [0.054, 0.22],
              [0.059, 0.255],
              [0.087, 0.278],
              [0.095, 0.31],
              [0.087, 0.342],
              [0.059, 0.366],
              [0.049, 0.408],
              [0.05, 0.466],
              [0.074, 0.48],
              [0.074, 0.5],
              [0.045, 0.514],
              [0, 0.514],
            ],
            32,
          ),
          1,
          'y',
        ),
        baseAO(0, 0.13, 0.66),
      ),
    ),
    socket: cg('vcp.globe.socket', () =>
      turned(
        [
          [0, 0],
          [0.042, 0],
          [0.042, 0.012],
          [0.029, 0.02],
          [0.025, 0.062],
          [0.034, 0.068],
          [0.034, 0.083],
          [0, 0.083],
        ],
        16,
      ),
    ),
    bearing: cg('vcp.globe.bearing', () =>
      turned(
        [
          [0, 0],
          [0.013, 0],
          [0.013, 0.016],
          [0.022, 0.018],
          [0.022, 0.027],
          [0.017, 0.029],
          [0.017, 0.044],
          [0, 0.044],
        ],
        12,
      ),
    ),
  };
}

// Original schematic terrestrial land outlines in longitude/latitude. No labels, borders or puzzle canon.
const LAND: number[][][] = [
  [
    [-168, 70],
    [-142, 72],
    [-128, 58],
    [-123, 49],
    [-124, 39],
    [-115, 29],
    [-105, 24],
    [-98, 17],
    [-88, 18],
    [-83, 10],
    [-78, 9],
    [-86, 22],
    [-81, 25],
    [-80, 33],
    [-68, 46],
    [-56, 52],
    [-63, 60],
    [-82, 62],
    [-96, 72],
    [-118, 72],
    [-145, 60],
  ],
  [
    [-81, 12],
    [-70, 11],
    [-61, 7],
    [-50, 0],
    [-35, -7],
    [-41, -21],
    [-51, -29],
    [-57, -39],
    [-68, -55],
    [-74, -47],
    [-72, -31],
    [-80, -10],
  ],
  [
    [-52, 60],
    [-42, 61],
    [-20, 76],
    [-35, 83],
    [-57, 80],
    [-65, 68],
  ],
  [
    [-10, 36],
    [-10, 44],
    [-2, 49],
    [8, 55],
    [5, 60],
    [18, 71],
    [31, 70],
    [29, 60],
    [41, 55],
    [47, 48],
    [35, 41],
    [27, 40],
    [22, 35],
    [17, 41],
    [12, 44],
    [7, 43],
    [0, 36],
  ],
  [
    [-17, 35],
    [0, 37],
    [12, 33],
    [25, 32],
    [35, 23],
    [43, 12],
    [51, 11],
    [43, -1],
    [39, -12],
    [31, -27],
    [19, -35],
    [12, -28],
    [10, -12],
    [0, 4],
    [-12, 5],
    [-17, 15],
  ],
  [
    [28, 70],
    [60, 74],
    [99, 77],
    [144, 69],
    [177, 64],
    [162, 52],
    [141, 47],
    [130, 35],
    [121, 24],
    [109, 18],
    [107, 8],
    [101, 1],
    [96, 15],
    [89, 22],
    [79, 8],
    [72, 19],
    [67, 26],
    [56, 24],
    [48, 30],
    [43, 41],
    [32, 45],
  ],
  [
    [113, -22],
    [123, -15],
    [135, -12],
    [142, -11],
    [154, -24],
    [151, -37],
    [138, -39],
    [129, -32],
    [115, -35],
  ],
  [
    [47, -13],
    [50, -18],
    [47, -25],
    [44, -23],
  ],
  [
    [130, 33],
    [140, 39],
    [143, 44],
    [145, 41],
    [141, 34],
  ],
  [
    [166, -35],
    [178, -39],
    [171, -46],
    [165, -47],
  ],
  [
    [96, 5],
    [105, -5],
    [119, -8],
    [131, -5],
    [122, -2],
    [110, 0],
  ],
];
let mapMaterial: THREE.MeshPhongMaterial | undefined;
function globeMaterial() {
  if (mapMaterial) return mapMaterial;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#d7c392';
  ctx.fillRect(0, 0, 512, 256);
  const r = mulberry32(4101);
  // Broad paper ageing; no expensive transparent varnish or runtime animation.
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(98,73,42,${0.018 + r() * 0.035})`;
    ctx.fillRect(r() * 512, r() * 256, 1 + r() * 3, 1 + r() * 2);
  }
  const xy = (p: number[]) => [((p[0] + 180) / 360) * 512, ((90 - p[1]) / 180) * 256];
  for (const land of LAND) {
    ctx.beginPath();
    land.forEach((p, i) => {
      const [x, y] = xy(p);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = '#8f9873';
    ctx.fill();
    ctx.strokeStyle = '#756d4e';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.strokeStyle = '#b2ad82';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(100,78,45,0.3)';
  ctx.lineWidth = 0.55;
  for (let lon = -180; lon <= 180; lon += 20) {
    const x = ((lon + 180) / 360) * 512;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 20) {
    const y = ((90 - lat) / 180) * 256;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  mapMaterial = new THREE.MeshPhongMaterial({ map: tex, vertexColors: true, specular: '#343022', shininess: 12 });
  return mapMaterial; // one bounded shared material + 512×256 texture, reused across review rebuilds
}

/** Retained pedestal design for a future room; deliberately not placed elsewhere by this pilot. */
export function pedestalGlobe(c: Ctx, x: number, z: number, y: number, yaw = 0.6) {
  const M = artMats(),
    p = globeParts(),
    a = new Asm(c.b, c.chunk, x, y, z, yaw).begin('vcp.globe');
  a.add(M.timber, '#63432b', p.pedestal, 0, 0, 0);
  a.add(M.brass, '#aa8546', p.socket, 0, 0.505, 0); // saddle intersects ring bottom at 0.554
  a.add(M.brass, '#b79956', p.meridian, 0, GLOBE.centre, 0);
  a.add(globeMaterial(), '#ffffff', p.sphere, 0, GLOBE.centre, 0, { rz: GLOBE.tilt, ry: 0.7 });
  for (const sign of [-1, 1]) {
    const d = GLOBE.radius;
    a.add(
      M.brass,
      '#c5a360',
      p.bearing,
      -Math.sin(GLOBE.tilt) * d * sign,
      GLOBE.centre + Math.cos(GLOBE.tilt) * d * sign,
      0,
      { rz: GLOBE.tilt + (sign < 0 ? Math.PI : 0) },
    );
  }
  a.end();
  c.col.addCircle(x, z, 0.3, y, y + 1.25); // exact production collision envelope
}

/** Owner-selected stand reference, 81891.jpg (2026-10-11). The embedded ID does not alter inventory records. */
export const STAND_GLOBE = { radius: 0.245, centre: 0.88, ringInner: 0.264, ringOuter: 0.282, legOffset: 0.193 };
export function standGlobeParts() {
  return {
    sphere: cg('vcp.stand.sphere', () => new THREE.SphereGeometry(STAND_GLOBE.radius, 40, 24)),
    meridian: cg('vcp.stand.meridian', () =>
      turned(
        [
          [0.264, -0.01],
          [0.267, -0.014],
          [0.279, -0.014],
          [0.282, -0.01],
          [0.282, 0.01],
          [0.279, 0.014],
          [0.267, 0.014],
          [0.264, 0.01],
          [0.264, -0.01],
        ],
        56,
      ).rotateX(Math.PI / 2),
    ),
    horizon: cg('vcp.stand.horizon', () =>
      projectUV(
        turned(
          [
            [0.287, -0.022],
            [0.305, -0.022],
            [0.315, -0.014],
            [0.315, -0.005],
            [0.31, 0],
            [0.316, 0.006],
            [0.316, 0.017],
            [0.309, 0.023],
            [0.287, 0.023],
            [0.287, -0.022],
          ],
          56,
        ),
        1,
        'x',
      ),
    ),
    leg: cg('vcp.stand.leg', () =>
      bake(
        projectUV(
          turned(
            [
              [0, 0],
              [0.019, 0],
              [0.027, 0.016],
              [0.026, 0.035],
              [0.018, 0.049],
              [0.021, 0.068],
              [0.026, 0.078],
              [0.026, 0.105],
              [0.021, 0.118],
              [0.021, 0.19],
              [0.029, 0.205],
              [0.029, 0.225],
              [0.02, 0.242],
              [0.018, 0.275],
              [0.026, 0.32],
              [0.031, 0.39],
              [0.028, 0.455],
              [0.019, 0.51],
              [0.018, 0.57],
              [0.027, 0.585],
              [0.027, 0.602],
              [0.019, 0.617],
              [0.024, 0.637],
              [0.025, 0.66],
              [0, 0.66],
            ],
            16,
          ),
          1,
          'y',
        ),
        baseAO(0, 0.12, 0.68),
      ),
    ),
    centre: cg('vcp.stand.centre', () =>
      bake(
        projectUV(
          turned(
            [
              [0, 0.15],
              [0.016, 0.15],
              [0.024, 0.167],
              [0.02, 0.185],
              [0.043, 0.198],
              [0.047, 0.214],
              [0.047, 0.245],
              [0.038, 0.26],
              [0.031, 0.27],
              [0.032, 0.282],
              [0.02, 0.3],
              [0.018, 0.343],
              [0.034, 0.367],
              [0.041, 0.395],
              [0.035, 0.421],
              [0.018, 0.438],
              [0.018, 0.5],
              [0.029, 0.518],
              [0.029, 0.539],
              [0.018, 0.556],
              [0.016, 0.6],
              [0, 0.6],
            ],
            20,
          ),
          1,
          'y',
        ),
        baseAO(0.15, 0.1, 0.75),
      ),
    ),
  };
}

/** Four turned legs carry the horizon; crossed rails carry the centre support and meridian saddle. */
export function craftGlobe(
  c: Ctx,
  x: number,
  z: number,
  y: number,
  yaw = 0.6,
  cartography: THREE.Material = globeMaterial(),
) {
  const M = artMats(),
    p = standGlobeParts(),
    a = new Asm(c.b, c.chunk, x, y, z, yaw).begin('vcp.globe');
  const { centre, legOffset: L } = STAND_GLOBE;
  a.add(M.timber, '#6e4c30', p.horizon, 0, centre, 0);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      a.add(M.timber, '#67462c', p.leg, sx * L, 0, sz * L, { s: [1, 1.25, 1] });
      a.add(M.timber, '#715035', sb(0.055, 0.054, 0.055, 0.004), sx * L, 0.834, sz * L);
      a.add(M.timber, '#5c3e28', sb(0.057, 0.058, 0.057, 0.004), sx * L, 0.222, sz * L);
      // One radial rail from each foot joint into the central hub, centred halfway along its diagonal.
      a.add(M.timber, '#67462c', sb(Math.hypot(L, L), 0.034, 0.034, 0.004), (sx * L) / 2, 0.225, (sz * L) / 2, {
        ry: Math.atan2(-sz, sx),
      });
    }
  a.add(M.timber, '#614129', p.centre, 0, 0, 0);
  a.add(M.brass, '#ae8c4c', sb(0.033, 0.031, 0.033, 0.005), 0, 0.596, 0);
  a.add(M.brass, '#b99a58', p.meridian, 0, centre, 0);
  a.add(cartography, '#ffffff', p.sphere, 0, centre, 0, { rz: 0.15, ry: 0.7 });
  const bearing = globeParts().bearing;
  for (const sign of [-1, 1]) {
    const d = STAND_GLOBE.radius;
    a.add(M.brass, '#c5a360', bearing, -Math.sin(0.15) * d * sign, centre + Math.cos(0.15) * d * sign, 0, {
      rz: 0.15 + (sign < 0 ? Math.PI : 0),
    });
  }
  // Horizon sockets carry the vertical band. The wood inner edge has a deliberate clearance around the band.
  for (const sign of [-1, 1]) a.add(M.brass, '#ad8c4d', sb(0.04, 0.024, 0.038, 0.004), sign * 0.285, centre, 0);
  a.end();
  c.col.addCircle(x, z, 0.3, y, y + 1.25);
}

export function craftTable(c: Ctx, x: number, z: number, y: number) {
  const M = artMats(),
    a = new Asm(c.b, c.chunk, x, y, z, 0).begin('vcp.table'),
    wood = '#66442c',
    shade = '#533722';
  // Top datum is immutable: 0.81. End boards meet the long-grain panel with hairline joinery seams.
  a.add(M.timber, wood, sb(1.1, 0.043, 1.978, 0.008), 0, 0.7885, 0);
  for (const sign of [-1, 1])
    a.add(
      M.timber,
      '#705035',
      cg('vcp.table.end', () => projectUV(sb(1.1, 0.043, 0.11, 0.006).clone(), 1, 'x')),
      0,
      0.7885,
      sign * 1.045,
    );
  a.add(M.timber, shade, sb(1.065, 0.026, 2.165, 0.01), 0, 0.754, 0);
  // Solid corner blocks carry the top. The east side remains clear for the unchanged moving drawer.
  const leg = cg('vcp.table.leg', () =>
    bake(
      projectUV(
        turned(
          [
            [0, 0],
            [0.025, 0],
            [0.029, 0.025],
            [0.026, 0.075],
            [0.032, 0.39],
            [0.042, 0.48],
            [0.047, 0.5],
            [0.047, 0.53],
            [0.036, 0.55],
            [0.036, 0.64],
            [0, 0.64],
          ],
          12,
        ),
        1,
        'y',
      ),
      baseAO(0, 0.2, 0.7),
    ),
  );
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      a.add(M.timber, wood, leg, sx * 0.47, 0, sz * 1.02);
      a.add(
        M.timber,
        wood,
        cg('vcp.table.joint', () => projectUV(sb(0.092, 0.145, 0.092, 0.005).clone(), 1, 'y')),
        sx * 0.47,
        0.683,
        sz * 1.02,
      );
    }
  for (const sign of [-1, 1]) a.add(M.timber, shade, sb(0.89, 0.12, 0.032, 0.005), 0, 0.694, sign * 1.02);
  a.add(M.timber, shade, sb(0.032, 0.12, 2.04, 0.005), -0.47, 0.694, 0);
  // Drawer bay cheeks attach to the end rails without covering its face or travel.
  for (const sign of [-1, 1]) a.add(M.timber, shade, bx(0.035, 0.11, 0.52), 0.47, 0.69, sign * 0.76);
  a.end();
  c.col.addBoxC(x, z, 1.1, 2.2, y, y + 0.81);
}

export function craftChair(c: Ctx, sh: ContactShadows, x: number, z: number, y: number) {
  upholstered(c, sh, x, z, y, Math.PI / 2, {
    width: 0.88,
    depth: 0.86,
    seats: 1,
    color: '#7a3a3a',
    wings: true,
    lite: true,
    craft: true,
  });
  c.col.addBoxC(x, z, 0.9, 1, y, y + 0.9);
}
export function craftGrounding(w: World) {
  const sh = new ContactShadows();
  sh.add(82.4, 0.154, 108.2, 0.72, 0.72, 0, 0.38);
  // Table straddles a rug: only leg contacts, placed on the correct supporting surface.
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) sh.add(80.6 + sx * 0.47, sx < 0 ? 0.164 : 0.154, 101.2 + sz * 1.02, 0.17, 0.17, 0, 0.3);
  return {
    sh,
    finish() {
      const m = sh.build(w.scene, 'mLib');
      if (m) w.material(m.material as THREE.Material);
    },
  };
}
