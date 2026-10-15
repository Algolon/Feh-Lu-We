// VEG-R02: one shared species atlas and one batching-compatible spray format for the whole exterior.
import * as THREE from 'three';
import { mulberry32 } from '../core/rng';

export type NatureStyle = 'baseline' | 'birch-r02' | 'woodland-r02';
export function natureStyle(value: string | null): NatureStyle {
  return value === 'baseline' || value === 'birch-r02' ? value : 'woodland-r02';
}
export const NATURE_STYLE = natureStyle(typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('vegstyle'));
export const FULL_NATURE = NATURE_STYLE === 'woodland-r02';
export const LEAF_FAMILIES = ['birch', 'oak', 'beech', 'pine', 'hazel', 'holly', 'cypress', 'hedge'] as const;
export type LeafFamily = typeof LEAF_FAMILIES[number];
export interface SprayCluster { c: THREE.Vector3; r: [number, number, number]; seed: number; val: number }
const UP = new THREE.Vector3(0, 1, 0);

/** Atlas UVs are marked at 128 + 2*tile + u, leaving a gap between tiles so interpolation is unambiguous. */
export function foliageSprays(clusters: SprayCluster[], lod: 'near' | 'mid' | 'far' | 'xfar', family: LeafFamily): THREE.BufferGeometry {
  const pos: number[] = [], normals: number[] = [], colors: number[] = [], uv: number[] = [], idx: number[] = [];
  const centre = clusters.reduce((a, k) => a.add(k.c), new THREE.Vector3()).divideScalar(Math.max(1, clusters.length));
  const tile = LEAF_FAMILIES.indexOf(family), birch = family === 'birch', needle = family === 'pine' || family === 'cypress';
  const planes = lod === 'near' ? (birch ? 5 : 4) : 3;
  for (const k of clusters) {
    const r = mulberry32(Math.round(k.seed * 10000)), yaw = r() * Math.PI * 2;
    for (let i = 0; i < planes; i++) {
      const angle = yaw + i * Math.PI / 3;
      const side = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      let up = new THREE.Vector3(Math.sin(angle) * .25, 1, -Math.cos(angle) * .25).normalize();
      // Pine uses broad, tilted bough shelves instead of the birch's hanging curtains.
      if (family === 'pine' && i === 2) up = new THREE.Vector3(-Math.sin(angle), .38, Math.cos(angle)).normalize();
      const c = k.c.clone().add(new THREE.Vector3((r() - .5) * .18, (birch ? -.05 : 0) + (r() - .5) * .16, (r() - .5) * .18));
      const width = (k.r[0] + k.r[2]) * (birch ? 1.45 : family === 'pine' ? .85 : family === 'cypress' ? .68 : .82);
      const height = k.r[1] * (birch ? 3.2 : family === 'pine' ? 1.4 : family === 'cypress' ? 1.6 : family === 'holly' ? 1.45 : 1.3);
      const pts = [c.clone().addScaledVector(side, -width).addScaledVector(up, -height), c.clone().addScaledVector(side, width).addScaledVector(up, -height),
        c.clone().addScaledVector(side, width).addScaledVector(up, height), c.clone().addScaledVector(side, -width).addScaledVector(up, height)];
      const n0 = pos.length / 3;
      for (const p of pts) {
        pos.push(p.x, p.y, p.z);
        const n = p.clone().sub(centre).normalize().lerp(UP, .55).normalize(); normals.push(n.x, n.y, n.z);
        const top = THREE.MathUtils.clamp((p.y - (centre.y - 4)) / 8, 0, 1);
        const value = (.68 + .43 * top) * k.val;
        colors.push(value * (.94 + .1 * top), value, value * (needle ? .98 - .09 * top : .96 - .18 * top));
      }
      const u0 = 128 + tile * 2;
      uv.push(u0,0,u0+1,0,u0+1,1,u0,1);
      // Both windings, with the same crown normals. No DoubleSide normal reversal on shaded leaves.
      for (const j of [0,1,2,0,2,3,0,2,1,0,3,2]) idx.push(n0+j);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx);
  g.userData.keepColor = true; g.computeBoundingSphere(); return g;
}

/** Different leaf shapes, density and growth direction; all eight tiles share one texture/draw group. */
export function foliageAtlas(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 512;
  const x = canvas.getContext('2d')!;
  for (let tile = 0; tile < LEAF_FAMILIES.length; tile++) {
    const family = LEAF_FAMILIES[tile], r = mulberry32(9202 + tile * 417), ox = (tile % 4) * 256, oy = Math.floor(tile / 4) * 256;
    x.save(); x.beginPath(); x.rect(ox+3,oy+3,250,250); x.clip();
    const needle = family === 'pine' || family === 'cypress', count = needle ? 135 : family === 'birch' ? 240 : family === 'hedge' ? 190 : 145;
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2, radius = Math.sqrt(r());
      let px = 128 + Math.cos(a) * radius * 103, py = 123 + Math.sin(a) * radius * 104;
      if (needle) { px = 128 + Math.cos(a) * radius * (20 + (245-py) * .36); }
      const size = needle ? 9 + r() * 13 : family === 'birch' ? 5 + r() * 6.5 : 8 + r() * 8;
      const angle = needle ? Math.atan2(py - 220, px - 128) : r() * Math.PI;
      const value = .60 + .29 * (1 - py / 256) + r() * .18;
      const grey = (v: number) => `rgb(${Math.round(v*255)} ${Math.round(v*255)} ${Math.round(v*255)})`;
      x.save(); x.translate(ox+px,oy+py); x.rotate(angle); x.fillStyle=grey(value); x.beginPath();
      if (needle) {
        // Several pointed needles form a fan, not a recoloured broadleaf spray.
        for (let k=-2;k<=2;k++) { const f=k*.22; x.moveTo(-size*.6,0); x.lineTo(size*Math.cos(f),size*Math.sin(f)); x.lineTo(-size*.4,2); }
      } else if (family === 'oak' || family === 'holly') {
        const teeth=family==='oak'?4:3;
        x.moveTo(-size,0);
        for(let k=0;k<=teeth*2;k++){const u=k/(teeth*2),w=Math.sin(u*Math.PI)*(k%2? .35:.68);x.lineTo(-size+u*size*2,-size*w);}
        for(let k=teeth*2;k>=0;k--){const u=k/(teeth*2),w=Math.sin(u*Math.PI)*(k%2? .35:.68);x.lineTo(-size+u*size*2,size*w);} x.closePath();
      } else {
        const w=family==='hazel'?.85:family==='hedge'?.65:.78;
        x.moveTo(-size,0);x.quadraticCurveTo(-size*.15,-size*w,size,0);x.quadraticCurveTo(size*.05,size*w,-size,0);
      }
      x.fill();
      // A broad, readable lighter half, without tiny high-contrast outlines.
      x.globalAlpha=.4;x.fillStyle=grey(Math.min(1,value+.13));x.beginPath();x.moveTo(-size,0);x.quadraticCurveTo(0,-size*.45,size,0);x.closePath();x.fill();x.restore();
    }
    x.restore();
  }
  const t = new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;t.anisotropy=4;return t;
}

export const SPRAY_SAMPLE = `vec2 flwCoord = vec2(mod(tUv.x - 128.0, 2.0), tUv.y);
    float flwTile = floor((tUv.x - 128.0) * 0.5);
    vec2 flwTileXY = vec2(mod(flwTile, 4.0), floor(flwTile / 4.0));
    vec2 flwAtlasUv = (flwTileXY + clamp(flwCoord, 0.012, 0.988)) / vec2(4.0, 2.0);`;
