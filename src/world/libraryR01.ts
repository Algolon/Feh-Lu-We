// LIB-R01 — authored wall-library composition, not a free-standing maze.
// Coordinates in estate plan metres: X east, Z north. All decorative geometry uses mLib batching.
// The existing B01 puzzle and DS01 discovery remain owned by manor.ts/slice/world.ts.
import * as THREE from 'three';
import type { World } from '../interactions/world';
import type { Ctx } from './arch';
import { box, cyl } from './kit';
import { bookshelf, rug, table, roundTable, plant } from './furniture';
import { libraryR02Desk, libraryR02StudyChair, libraryR02ReadingSeat } from './libraryR02';
import { tabletop } from './dressing';
import { GF } from './layout';
import { libraryStairR01, LIB_STAIR } from './libraryStairR01';
export { libraryR03BankersLamp as libraryR01BankerLamp } from './libraryR03Lamp';

export const LIB_R01 = {
  // Solid west wall BETWEEN windows z97 and z101; desk hutch rear sits 4-5 cm from plaster.
  desk: { x: 73.17, z: 99.0, w: 1.3, d: 2.2, h: 0.81 },
  // LIB-R04: view from the desk chair faces WEST, so screen-right is +Z.
  // Negative X is toward the rear hutch; keep the lamp base clear of its front edge
  // (-0.35 X) and its long shade inside the +1.17 Z desk-top boundary.
  // The movable CATALOG books start front-right, where the lamp used to stand.
  deskObjects: {
    lamp: { dx: -0.13, dz: 0.72 },
    looseBooks: { dx: 0.42, dz: 0.84 },
  },
  stair: { x: LIB_STAIR.x, z: LIB_STAIR.z, radius: LIB_STAIR.radius, steps: LIB_STAIR.steps },
  landing: { x0: LIB_STAIR.bridge.x0, x1: LIB_STAIR.bridge.x1, z0: LIB_STAIR.bridge.z0, z1: LIB_STAIR.bridge.z1 },
} as const;

/** Sized specifically to the ground-floor window bays: no shelving across glazing. */
export const LIB_R01_BAYS = {
  west: [
    { z: 95.1, w: 1.65, pal: 'leather' },
    // LIB-R03: this previously fitted case bay is now occupied by the wall-aligned bureau.
    { z: 103.0, w: 1.70, pal: 'navy' },
    { z: 107.0, w: 1.90, pal: 'leather' },
  ],
  north: [
    { x: 73.35, w: 1.28, pal: 'navy' },
    { x: 76.75, w: 1.75, pal: 'leather' },
    { x: 80.25, w: 1.75, pal: 'olive' },
    { x: 83.67, w: 1.08, pal: 'leather' },
  ],
} as const;

export function libraryR01Furniture(w: World, c: Ctx) {
  // Each bookcase is aligned with a *solid* wall section, not a window opening.
  for (const b of LIB_R01_BAYS.west) bookshelf(c, 72.74, b.z, GF, Math.PI / 2, b.w, 2.89, b.pal, 0.32);
  for (const b of LIB_R01_BAYS.north) bookshelf(c, b.x, 109.26, GF, Math.PI, b.w, 2.88, b.pal, 0.32);
  // Near the entrance and on the library's interior wall (never through its door at Z 101).
  bookshelf(c, 84.68, 96.8, GF, -Math.PI / 2, 2.3, 2.85, 'olive', 0.30);
  bookshelf(c, 84.68, 108.0, GF, -Math.PI / 2, 1.55, 2.85, 'leather', 0.30);

  // LIB-R01-R02: bespoke secretary writing desk with stepped edges, moulded pedestals
  // and an upholstered visitor chair genuinely tucked under the work surface.
  // B01/puzzle/drawer anchors use this same moved desk centre (IDs/state unchanged).
  const d=LIB_R01.desk;
  libraryR02Desk(c,d);
  // Work chair slides below the EAST desk lip, with its back facing the player.
  libraryR02StudyChair(c,d.x+0.76,d.z,GF,-Math.PI/2);

  // Central quiet reading lounge. Seating is deliberately outside B01/DS01 routes.
  rug(c, 78.35, 102.5, GF + 0.01, 4.6, 5.0, 0, '#a34f38', 'medallion', true);
  // Tufted library loveseat facing south; wing chair now looks east toward the rug
  // and coffee table instead of toward the wall.
  libraryR02ReadingSeat(c,78.75,103.76,GF,Math.PI,2.36);
  libraryR02ReadingSeat(c,75.8,102.75,GF,Math.PI/2,0.96,true);
  table(c, 78.4, 102.18, GF, 1.36, 0.72, 0, '#6b4426', 0.46);
  tabletop(c, 78.4, 102.18, GF + 0.46, 0, ['book', 'stack', 'open'], 51);
  roundTable(c, 76.25, 104.15, GF, 0.26, '#5a3a22');
  tabletop(c, 76.25, 104.15, GF + 0.76, 0, ['book'], 19);
  libraryR01AntiqueGlobe(w, c, 82.15, 108.15);
  plant(c, 73.55, 104.2, GF, 0.68);
  // Intentional book clutter. Use existing batched book family rather than tiny new textures.
  for (const [x, z, seed] of [[75.3, 104.7, 23], [80.3, 103.7, 17], [82.4, 107.4, 29]] as const)
    tabletop(c, x, z, GF + 0.022, 0, ['stack', 'book'], seed);
}

/** LIB-STAIR-R01 closed oak stair with matching gallery landing and true guards. */
export function libraryR01Stair(c: Ctx) {
  libraryStairR01(c);
}

/** Vintage standing globe: hand-authored sepia equirectangular map rather than
 * the old cyan-blue generic orb; small shared canvas, deliberately matte and legible.
 * Static dark walnut stand is folded into the library material batch. */
export function libraryR01AntiqueGlobe(w: World, c: Ctx, x: number, z: number) {
  const k=c.k, y=GF, r=0.315;
  for (const [dx,dz] of [[-0.25,-0.23],[-0.25,0.23],[0.25,-0.23],[0.25,0.23]] as const) {
    cyl(c.b,k.M.wood,'#61402b',x+dx,y,z+dz,0.038,0.05,0.72,8,{chunk:c.chunk});
    cyl(c.b,k.M.wood,'#80563a',x+dx,y+0.72,z+dz,0.038,0.038,0.16,8,{chunk:c.chunk});
  }
  box(c.b,k.M.wood,'#5a3723',x,y+0.18,z,0.62,0.045,0.62,{chunk:c.chunk});
  box(c.b,k.M.wood,'#825537',x,y+0.86,z,0.54,0.044,0.54,{chunk:c.chunk});
  const cv=document.createElement('canvas'); cv.width=512;cv.height=256;
  const ctx=cv.getContext('2d')!;
  ctx.fillStyle='#d3ba8c';ctx.fillRect(0,0,512,256);
  ctx.strokeStyle='rgba(105,74,43,.16)';ctx.lineWidth=1;
  for(let lon=0;lon<=512;lon+=32){ctx.beginPath();ctx.moveTo(lon,0);ctx.lineTo(lon,256);ctx.stroke();}
  for(let lat=16;lat<256;lat+=28){ctx.beginPath();ctx.moveTo(0,lat);ctx.lineTo(512,lat);ctx.stroke();}
  // Seven softly irregular land masses inspired by antique map engravings.
  const islands=[
   [[41,56],[66,38],[87,51],[105,75],[93,93],[84,113],[64,126],[53,105],[36,90]],
   [[89,133],[117,129],[140,153],[132,179],[122,205],[107,226],[98,196],[83,164]],
   [[214,69],[233,54],[258,63],[270,83],[258,102],[276,119],[263,149],[244,140],[232,110],[214,95]],
   [[240,148],[263,153],[271,177],[257,214],[247,233],[226,211],[219,181]],
   [[276,59],[306,43],[334,51],[355,67],[390,73],[406,97],[385,113],[360,120],[346,105],[312,116],[291,97]],
   [[373,169],[398,175],[418,197],[404,216],[381,213],[367,195]],
   [[461,62],[484,55],[499,76],[483,97],[460,86]]
  ];
  for(const pts of islands){
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);
    ctx.closePath();ctx.fillStyle='#b09769';ctx.fill();ctx.strokeStyle='#806748';ctx.lineWidth=2;ctx.stroke();
    ctx.strokeStyle='rgba(99,73,46,.35)';ctx.lineWidth=.7;ctx.stroke();
  }
  ctx.fillStyle='#6d5539';ctx.font='italic 13px Georgia';
  ctx.fillText('OCEANVS ATLANTICVS',130,130);ctx.fillText('TERRA',306,134);
  const tex=w.texture(new THREE.CanvasTexture(cv));tex.colorSpace=THREE.SRGBColorSpace;
  const mat=w.material(new THREE.MeshLambertMaterial({map:tex}));
  const brass=w.material(new THREE.MeshLambertMaterial({color:'#b29250'}));
  const walnut=w.material(new THREE.MeshLambertMaterial({color:'#5b3b25'}));
  const orbY=y+1.28, group=new THREE.Group();
  const globe=new THREE.Mesh(new THREE.SphereGeometry(r,24,16),mat);
  globe.position.set(x,orbY,-z);globe.rotation.z=.16;group.add(globe);
  const horizon=new THREE.Mesh(new THREE.TorusGeometry(r+.045,.025,6,36),walnut);
  horizon.rotation.x=Math.PI/2;horizon.position.set(x,orbY,-z);group.add(horizon);
  const meridian=new THREE.Mesh(new THREE.TorusGeometry(r+.018,.013,6,36),brass);
  meridian.rotation.y=.23;meridian.position.set(x,orbY,-z);group.add(meridian);
  group.userData.room='library';w.scene.add(group);
  c.col.addCircle(x,z,0.37,y,y+1.7);
}

