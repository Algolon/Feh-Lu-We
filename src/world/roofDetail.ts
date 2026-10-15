// EXT-R01: slate courses measured along each roof slope, not diagonally across the whole building.
import * as THREE from 'three';

export const ROOF_DETAIL = typeof location === 'undefined' || new URLSearchParams(location.search).get('roof') !== 'base';

/** Eight 30 cm slate widths and eight 22 cm exposed courses per texture repeat.
 * Requires face normals (the roof builders already use split vertices). Positions stay untouched. */
export function slateCourseUV(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++) {
    const nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i);
    const slopeSin=Math.hypot(nx,nz);
    const along=Math.abs(nz)>=Math.abs(nx)?p.getX(i):p.getZ(i);
    uv[i*2]=along/2.4;
    // Height divided by sin(pitch) gives distance along the slope. Vertical gable ends
    // get a simple elevation mapping; horizontal bottoms are not a visible roof slope.
    uv[i*2+1]=p.getY(i)/(Math.abs(ny)<.01?1:Math.max(.05,slopeSin))/1.76;
  }
  g.setAttribute('uv',new THREE.BufferAttribute(uv,2));return g;
}
