// Pure spatial envelope; no progression, lighting clock or save-state changes.
import { MUSHROOM } from './layout';
import { project, polylineLength, sstep } from './geom2d';
export const APPROACH_LENGTH = polylineLength(MUSHROOM.approach);
/** Positive inside the authored ecosystem polygon, negative outside. */
export function mushroomAreaDistance(x:number,z:number) {
  const a=MUSHROOM.area;let inside=false,d=Infinity;
  for(let i=0,j=a.length-1;i<a.length;j=i++) {
    const [ax,az]=a[i],[bx,bz]=a[j];
    if((az>z)!==(bz>z)&&x<(bx-ax)*(z-az)/(bz-az)+ax)inside=!inside;
    d=Math.min(d,project(x,z,[[ax,az],[bx,bz]]).d);
  }
  return inside?d:-d;
}
export function mushroomIntensity(x: number, z: number, y: number, ground: number) {
  if (Math.abs(y - ground) > 5) return 0;
  const radial = 1 - sstep(Math.hypot(x - MUSHROOM.x, z - MUSHROOM.z), MUSHROOM.radius * .75, MUSHROOM.radius + 10);
  const p = project(x, z, MUSHROOM.approach);
  const corridor = (1 - sstep(p.d, 1.5, 7.5)) * sstep(p.s, 0, APPROACH_LENGTH) * 0.85;
  const ecosystem=sstep(mushroomAreaDistance(x,z),-4,3);
  return Math.max(radial, corridor, ecosystem);
}
export function easeMushroom(current: number, target: number, dt: number) {
  const n = current + (target - current) * (1 - Math.exp(-Math.max(0, dt) * 1.5));
  return target === 0 && n < 0.001 ? 0 : n;
}
