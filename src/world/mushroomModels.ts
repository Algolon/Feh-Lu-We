/** Sculpted ring surfaces, not stacked primitives. Four related species, vertex-painted
 * ridges, curled rims, bent fluted stems, radial gills and irregular raised cap scales. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
export const MUSHROOM_SPECIES = ['wine-shelf', 'violet-bell', 'mint-lantern', 'rose-spire'] as const;
const TAU = Math.PI * 2;
/** `far` (VIS-R01): the distant silhouette of the same surfaces: same stem bend, cap profile, rim, lip and glowing
 * underside, coarse rings, no gills or scales, and only the paint terms a coarse ring can carry (no striping). */
export function mushroomModel(kind: number, detailed = true, nursery = false, far = false) {
  const parts: T.BufferGeometry[] = [];
  const cap = new T.Color((nursery ? ['#389e9e', '#6654ab', '#56bfa5', '#a3579e'] : ['#982f57', '#703997', '#268f95', '#ce627d'])[kind]);
  const cream = new T.Color('#d6c8a6'), light = new T.Color(kind === 1 ? '#ab91ef' : '#70edcf');
  const H = [1.55, 1.7, 1.5, 2.05][kind], R = [1.22, 0.96, 0.92, 0.72][kind], rise = [0.52, 0.92, 1.16, 0.72][kind];
  const bend = (t: number) => [0.24 * Math.sin(t * 2.1 + kind) * t, 0.12 * Math.sin(t * 3 + kind) * t];
  const [bx, bz] = bend(1);
  // rings (rows × columns) per part: approved detailed / medium / nursery counts unchanged; far is the shared coarse set
  const res = (d: [number, number], m: [number, number], n: [number, number], f: [number, number]) => far ? f : detailed ? d : nursery ? n : m;
  const paint = (g: T.BufferGeometry, color: T.Color, glow: number, vary?: (x: number,y: number,z: number) => number) => {
    const p = g.attributes.position, c = [], e = [];
    for (let i = 0; i < p.count; i++) {
      const k = vary?.(p.getX(i), p.getY(i), p.getZ(i)) ?? 1;
      c.push(color.r * k, color.g * k, color.b * k); e.push(glow);
    }
    g.setAttribute('color', new T.Float32BufferAttribute(c, 3));
    g.setAttribute('glow', new T.Float32BufferAttribute(e, 1));
    if (g.index) g = g.toNonIndexed();
    g.deleteAttribute('uv'); parts.push(g);
  };
  // Closed, non-axisymmetric stem: alternating shallow channels and a rounded root flare.
  const surface = (rows: number, columns: number, fn: (u:number,a:number)=>number[]) => {
    const v: number[] = [], idx: number[] = [];
    for (let j=0;j<=rows;j++) for(let i=0;i<=columns;i++) v.push(...fn(j/rows,i/columns*TAU));
    for(let j=0;j<rows;j++) for(let i=0;i<columns;i++) {
      const a=j*(columns+1)+i,b=a+columns+1;idx.push(a,b,a+1,a+1,b,b+1);
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();return g;
  };
  paint(surface(...res([15,32],[7,12],[6,10],[4,7]),(t,a)=>{
    const [x,z]=bend(t), r=(0.15+0.14*Math.exp(-t*8)+0.065*Math.sin(t*3.1))*(1+0.09*Math.sin(a*9+t*5)+0.035*Math.sin(a*17-t*4));
    return [x+r*Math.cos(a), t*H-0.025, z+r*Math.sin(a)];
  }),cream,0.05,(x,y,z)=>0.74+0.2*y/H+(far?0:0.08*Math.sin(y*6+x*12+z*5)));
  const capPoint = (t:number,a:number) => {
    const rr=R*t*(1+0.055*Math.sin(a*3+kind)+0.035*Math.cos(a*7));
    const y=H+rise*Math.pow(Math.max(0,1-t*t),kind===2?1.1:0.75)+0.06*Math.sin(a*4+kind)*t*t+0.075*Math.cos(a*2)*t*t;
    return [bx+rr*Math.cos(a), y+0.018*Math.sin(a*19+t*4)*t, bz+rr*Math.sin(a)];
  };
  // Reverse ring direction gives outward normals on the top.
  paint(surface(...res([14,48],[7,20],[6,16],[4,12]),(u,a)=>capPoint(1-u,a)),cap,0.11,(x,y,z)=>{
    const a=Math.atan2(z-bz,x-bx),t=Math.hypot(x-bx,z-bz)/R;
    return 0.65+0.38*(y-H)/rise+(far?0:0.09*Math.sin(a*18+t*6)+0.045*Math.cos(x*13+z*11));
  });
  paint(surface(...res([5,48],[2,20],[2,16],[1,12]),(u,a)=>{
    const t=0.1+u*0.9, p=capPoint(t,a);p[1]=H-0.065-0.08*Math.sin(t*Math.PI);return p;
  }),light,0.72,(x,_y,z)=>0.55+(far?0:0.25*Math.cos(Math.atan2(z-bz,x-bx)*30)));
  // Rounded lip joins the cap skin to its recessed underside.
  paint(surface(...res([4,48],[2,20],[2,16],[1,12]),(u,a)=>{
    const p=capPoint(1,a), k=Math.sin(u*Math.PI);p[0]+=Math.cos(a)*k*0.025;p[2]+=Math.sin(a)*k*0.025;p[1]-=u*0.065;return p;
  }),cap,0.18);
  // Gills are tapered folded ribbons, geometry visible from beneath giant specimens.
  for(let i=0;i<(far?0:detailed?32:(nursery?12:14));i++) {
    const a=i/(detailed?32:(nursery?12:14))*TAU, verts:number[]=[];
    for(let j=0;j<(nursery?4:7);j++) {
      const t0=0.16+j/(nursery?4:7)*0.83,t1=0.16+(j+1)/(nursery?4:7)*0.83;
      const v=(t:number,side:number)=>[bx+R*t*Math.cos(a+side*0.012),H-0.065-(side===0?0.11:0.015)*Math.sin(t*Math.PI),bz+R*t*Math.sin(a+side*0.012)];
      for(const side of [-1,1])verts.push(...v(t0,side),...v(t1,side),...v(t0,0),...v(t0,0),...v(t1,side),...v(t1,0));
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.computeVertexNormals();paint(g,light,0.55);
  }
  // Raised irregular scales follow cap normals (no floating spherical dots).
  for(let i=0;i<(far?0:detailed?15:(nursery?4:6));i++) {
    const a=i*2.399+kind, t=0.25+((i*0.371)%0.6), p=capPoint(t,a);
    const g=new T.SphereGeometry(1,nursery?6:7,nursery?3:4), pos=g.attributes.position;
    const r=0.055+(i%4)*0.022;
    g.scale(r*(1+(i%3)*0.12),r*0.25,r*0.7);
    g.rotateZ(-Math.cos(a)*t*0.7);g.rotateX(Math.sin(a)*t*0.7);g.translate(p[0],p[1],p[2]);
    // asymmetry baked before merging
    for(let k=0;k<pos.count;k++)pos.setY(k,pos.getY(k)+0.003*Math.sin(k*2+i));
    paint(g, i%3===0?light:cream,i%3===0?0.8:0.16);
  }
  const out=mergeGeometries(parts);for(const g of parts)g.dispose();out.computeBoundingSphere();return out;
}

/** Four related nursery silhouettes, with exaggerated lean and sculpted root swell.
 * Reuses the authored ring/gill construction; budgeted for dense instanced colonies. */
export function mushroomYoungModel(kind:number,far=false) {
  const geo=mushroomModel(kind,false,true,far),p=geo.attributes.position;
  for(let i=0;i<p.count;i++) {
    const y=p.getY(i),lean=.09*Math.sin(y*1.5+kind)*y;
    p.setXYZ(i,p.getX(i)+lean,p.getY(i)*(kind===3?1.08:1),p.getZ(i)+.035*y*y);
  }
  geo.computeVertexNormals();geo.computeBoundingSphere();return geo;
}
