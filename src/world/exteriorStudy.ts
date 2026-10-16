// EXT-R01: manor/arrival art study. ?exterior=base is the paired control.
// Dedicated materials protect interior stone, forest paths and parallel vegetation work.
import * as THREE from 'three';
import type { Ctx } from './arch';
import { boxMM, planMatrix } from './kit';
import { bake, projectUV } from './artkit';
import { surface } from './surfaces';
import { mulberry32 } from '../core/rng';
import { EXTERIOR_FINISH, ageFacade } from './exteriorFinish';
import { EXTERIOR_WEATHER, ageDressedStone } from './exteriorWeather';
import { addUnifiedManorSash } from './manorSash';

export const EXTERIOR_STUDY = typeof location === 'undefined' || new URLSearchParams(location.search).get('exterior') !== 'base';
let materials: { wall: THREE.Material; gravel: THREE.Material; dressed: THREE.Material } | undefined;
function texture(draw: (x: CanvasRenderingContext2D, r: () => number) => void, seed: number) {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  draw(c.getContext('2d')!, mulberry32(seed));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}
export function exteriorMats() {
  if (materials) return materials;
  const wall = new THREE.MeshLambertMaterial({ vertexColors: true, map: texture((x, r) => {
    x.fillStyle = '#aaa69a'; x.fillRect(0, 0, 512, 512);
    if(EXTERIOR_FINISH){
    // Dressed stone stays calm, with unequal block lengths and soft, interrupted edge highlights.
    for(let row=0;row<8;row++) {
      const weights=Array.from({length:4},()=>.8+r()*.4),sum=weights.reduce((a,b)=>a+b,0);let at=row%2?-58:0;
      for(let col=0;col<4;col++) {
        const bw=weights[col]/sum*512,v=Math.floor(r()*19),warm=r()>.4;
        for(const ox of [-512,0,512]) {
          const px=at+ox,py=row*64;
          x.fillStyle=`rgb(${195+v},${(warm?186:191)+v},${(warm?165:175)+v})`;
          x.beginPath();x.roundRect(px+1.5,py+1.5,bw-3,61,2+r()*2);x.fill();
          x.strokeStyle='rgba(238,229,204,.23)';x.lineWidth=1.5;
          x.beginPath();x.moveTo(px+7,py+4);x.lineTo(px+bw-9,py+4);x.stroke();
          x.save();x.beginPath();x.roundRect(px+3,py+3,bw-6,58,3);x.clip();
          for(let k=0;k<5;k++){
            const len=12+r()*(bw*.45),xx=px+6+r()*Math.max(1,bw-len-12),yy=py+9+r()*42;
            x.fillStyle=k%2?'rgba(111,124,111,.095)':'rgba(244,229,192,.14)';
            x.fillRect(xx,yy,len,2+r()*5);
          }
          x.restore();
        }
        at+=bw;
      }
    }
    }else{
    // Eight 30 cm courses per 2.4 m repeat; long dressed blocks, soft bevels and narrow mortar.
    for (let row = 0; row < 8; row++) for (let col = -1; col < 4; col++) {
      const px = col * 128 + (row % 2) * 64, py = row * 64, v = Math.floor(r() * 15);
      x.fillStyle = `rgb(${194+v},${188+v},${170+v})`;
      x.beginPath(); x.roundRect(px+2, py+2, 124, 60, 3); x.fill();
      x.strokeStyle = 'rgba(238,231,207,.36)'; x.lineWidth = 2;
      x.strokeRect(px+4, py+4, 120, 56);
      // broad brush scumbles, confined to their stone rather than wall-wide random stains
      for (let i = 0; i < 5; i++) {
        x.fillStyle = i % 2 ? 'rgba(115,121,110,.055)' : 'rgba(245,232,202,.10)';
        x.fillRect(px+7+r()*65, py+8+r()*39, 20+r()*35, 3+r()*9);
      }
    }
    }
  }, 1901) });
  const gravel = new THREE.MeshLambertMaterial({ vertexColors: true, map: texture((x, r) => {
    x.fillStyle = '#b6b2a3'; x.fillRect(0, 0, 512, 512);
    // 1.6 m repeat: gravel fragments about 1–3 cm; no oversized cloudy soil islands.
    const palette = ['#a09f94','#c4c0ae','#d1cbb7','#a9a89c','#bdb8a8','#8e9189'];
    for (let i = 0; i < 8500; i++) {
      const px = r()*512, py = r()*512, w = 2+r()*5, h = 1.5+r()*3.5;
      x.fillStyle = palette[Math.floor(r()*palette.length)];
      for (const ox of [-512,0,512]) for (const oy of [-512,0,512]) {
        x.beginPath(); x.moveTo(px+ox,py+oy); x.lineTo(px+ox+w,py+oy-1); x.lineTo(px+ox+w*.8,py+oy+h); x.lineTo(px+ox+1,py+oy+h*.8); x.fill();
      }
    }
  }, 1902) });
  // Cut limestone for solid profiles: fine grain, without false masonry joints across a column or rim.
  const dressed = new THREE.MeshLambertMaterial({ vertexColors: true, map: texture((x, r) => {
    x.fillStyle = '#f1efe5'; x.fillRect(0, 0, 512, 512);
    // Quiet limestone clouding at several scales; wrap every mark across the repeat seam.
    for(let i=0;i<180;i++) {
      const px=r()*512,py=r()*512,rx=7+r()*35,ry=4+r()*19;
      for(const ox of [-512,0,512])for(const oy of [-512,0,512]) {
        const wash=x.createRadialGradient(px+ox,py+oy,0,px+ox,py+oy,rx);
        wash.addColorStop(0,i%3?'rgba(125,126,111,.075)':'rgba(255,252,235,.20)');wash.addColorStop(1,'rgba(255,255,255,0)');
        x.fillStyle=wash;x.beginPath();x.ellipse(px+ox,py+oy,rx,ry,0,0,Math.PI*2);x.fill();
      }
    }
    for (let i = 0; i < 14000; i++) {
      x.fillStyle = i % 3 ? 'rgba(116,116,99,.105)' : 'rgba(255,255,245,.24)';
      x.fillRect(r()*512, r()*512, .5+r()*2, .5+r()*1.5);
    }
  }, 1903) });
  surface(dressed, 'stone');
  surface(wall, 'stone'); surface(gravel, 'ground');
  if(EXTERIOR_FINISH)ageFacade(wall);
  if(EXTERIOR_FINISH&&EXTERIOR_WEATHER)ageDressedStone(dressed);
  materials = { wall, gravel, dressed }; return materials;
}

/** Equal grain scale on round stone profiles; lathe's default V follows profile indices, not metres. */
export function dressedLatheUV(g:THREE.BufferGeometry, repeat=.6) {
  const p=g.attributes.position,uv=g.attributes.uv as THREE.BufferAttribute;
  let radius=0;for(let i=0;i<p.count;i++)radius=Math.max(radius,Math.hypot(p.getX(i),p.getZ(i)));
  for(let i=0;i<p.count;i++)uv.setXY(i,uv.getX(i)*2*Math.PI*radius/repeat,p.getY(i)/repeat);
  return g;
}

/** Plan-space UVs: the same pebble scale on a 2 m path and a 38 m court. */
export function gravelUV(g: THREE.BufferGeometry) {
  const p = g.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i*2] = p.getX(i)/1.6; uv[i*2+1] = -p.getZ(i)/1.6; }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g;
}

/** Low-poly softened dressed stone, with local contact occlusion; no sun direction baked in. */
export function dressedBlock(c: Ctx, x: number, y: number, z: number, sx: number, sy: number, sz: number, color: string, radius = .018, chunk = c.chunk) {
  const r = Math.min(radius, sx/3, sy/3, sz/3), hx=sx/2-r, hy=sy/2-r;
  const shape = new THREE.Shape([new THREE.Vector2(-hx,-hy),new THREE.Vector2(hx,-hy),new THREE.Vector2(hx,hy),new THREE.Vector2(-hx,hy)]);
  // A single bevel step is 28 triangles, versus 108 for the rounded-box grid.
  const raw = new THREE.ExtrudeGeometry(shape,{depth:sz-2*r,steps:1,bevelEnabled:true,bevelSize:r,bevelThickness:r,bevelSegments:1,curveSegments:1});
  raw.translate(0,0,-(sz-2*r)/2);
  const g = bake(projectUV(raw, 2.4), p => .78 + .22 * THREE.MathUtils.smoothstep(p.y, -sy/2, sy*.05));
  c.b.add(c.k.M.paint, g, planMatrix(x,y,z), color, chunk, chunk !== 'paths', 0); g.dispose();
}

export function studyWindowSite(_axis: 'x' | 'z', _faceF: number, _at: number, _side: number) {
  return EXTERIOR_STUDY;
}
/** Decorative glazing stays on the existing sealed wall; the deep stone reveal projects outward.
 * No change to opening/collision ownership or to the interior-facing window model. */
export function studyWindow(c: Ctx, axis: 'x' | 'z', f: number, side: 1 | -1, at: number, y: number, w: number, h: number, transparent = false) {
  const P = c.k.M.paint, top = y+h, a0=at-w/2, a1=at+w/2;
  const block = (a: number,b: number,lo: number,hi: number,d0: number,d1: number,col: string,soft=false) => {
    const fa=f+side*d0,fb=f+side*d1;
    if (soft) {
      const pos = axis==='x' ? [(a+b)/2,(lo+hi)/2,(fa+fb)/2] : [(fa+fb)/2,(lo+hi)/2,(a+b)/2];
      dressedBlock(c,pos[0],pos[1],pos[2],axis==='x'?b-a:Math.abs(fb-fa),hi-lo,axis==='x'?Math.abs(fb-fa):b-a,col,.014);
    } else if(axis==='x') boxMM(c.b,P,col,a,b,lo,hi,Math.min(fa,fb),Math.max(fa,fb),{chunk:c.chunk,jitter:0});
    else boxMM(c.b,P,col,Math.min(fa,fb),Math.max(fa,fb),lo,hi,a,b,{chunk:c.chunk,jitter:0});
  };
  // Stone reveal: deepest surfaces darker, outer lip brighter, with recessed green-grey joinery.
  for (const [a,b] of [[a0-.23,a0-.04],[a1+.04,a1+.23]]) {
    block(a,b,y-.07,top+.13,.005,.18,'#b2b09e',true);
    block(a-.018,b+.018,y-.09,top+.16,.14,.235,'#d9d3bd',true);
  }
  block(a0-.24,a1+.24,top+.075,top+.25,.012,.245,'#dcd5be',true);
  block(a0-.29,a1+.29,top+.25,top+.32,.06,.28,'#e4dcc6',true);
  block(at-.105,at+.105,top+.13,top+.36,.18,.285,'#e6dfcb',true);
  // Sill with weathering face, broad top and drip step (all well clear of the wall).
  block(a0-.30,a1+.30,y-.19,y-.08,.01,.30,'#aaa99b',true);
  block(a0-.32,a1+.32,y-.105,y-.055,.015,.335,'#ded8c3',true);
  block(a0-.25,a1+.25,y-.20,y-.18,.06,.245,'#8b8d81');
  // Existing opaque window convention: differentiated panes, subdued sky tint, no false reflection geometry.
  if (!transparent) {
    const glass = new THREE.PlaneGeometry(w,h,1,2);
  const color = [], p = glass.attributes.position;
  for(let i=0;i<p.count;i++) { const t=(p.getY(i)+h/2)/h; const v=new THREE.Color('#394c50').lerp(new THREE.Color('#879d9c'),t); color.push(v.r,v.g,v.b); }
  glass.setAttribute('color',new THREE.Float32BufferAttribute(color,3));glass.userData.keepColor=true;
  if(axis==='x') { if(side===1)glass.rotateY(Math.PI); } else glass.rotateY(side===-1?Math.PI/2:-Math.PI/2);
  // Plane's default normal is +z; plan south is +z, west is -x.
  if(axis==='z')glass.rotateY(Math.PI);
  const gx=axis==='x'?at:f+side*.018,gz=axis==='x'?f+side*.018:at;
  c.b.add(c.k.M.glow,glass,planMatrix(gx,y+h/2,gz),'#ffffff',c.chunk,false,0);glass.dispose();
  }
  // The normal see-through facade windows have ONE connected, single-colour
  // sash: its 8 real apertures are holes in the geometry, not overlapping bars.
  // The painted sash sits behind the separate, deliberately stone-coloured casing.
  if (transparent) {
    addUnifiedManorSash(c, axis, f, side, at, y, w, h);
    return;
  }
  // The historic sealed/decorative windows retain their legacy (non-portal) detail.
  const near = .02, far = .09;
  for (const [a,b] of [[a0-.04,a0+.025],[a1-.025,a1+.04]])block(a,b,y-.04,top+.045,near,far,'#58685d');
  for (const yy of [y-.025,top+.015])block(a0,a1,yy-.025,yy+.025,near,far,'#687568');
  block(at-.018,at+.018,y,top,near,far-.006,'#6b796b');
  for (const q of [.25,.5,.75])block(a0,a1,y+h*q-.017,y+h*q+.017,near,far-.004,q===.5?'#7b8776':'#687667');
}

/** Matched dressed quoins on all four main corners. Bands use manor.ts's doorway-aware runs. */
export function studyArchitecture(c: Ctx, top: number, _uf: number) {
  for(const [x,z,sx,sz] of [[72,80,-1,-1],[108,80,1,-1],[72,110,-1,1],[108,110,1,1]]) {
    for(let i=0,y=.7;y<top-.5;i++,y+=.42) {
      const la=i%2?.40:.68,lb=i%2?.68:.40,col=i%3===0?'#d1cfba':'#dfd8c2';
      dressedBlock(c,x-sx*(la/2-.05),y+.18,z+sz*.055,la+.10,.36,.13,col,.02);
      dressedBlock(c,x+sx*.055,y+.18,z-sz*(lb/2-.05),.13,.36,lb+.10,col,.02);
    }
  }
}
