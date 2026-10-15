// Pure spatial envelope; no progression, lighting clock or save-state changes.
import { MUSHROOM } from './layout';
import { project, polylineLength, sstep } from './geom2d';
export const APPROACH_LENGTH = polylineLength(MUSHROOM.approach);
export function mushroomIntensity(x: number, z: number, y: number, ground: number) {
  if (Math.abs(y - ground) > 5) return 0;
  const radial = 1 - sstep(Math.hypot(x - MUSHROOM.x, z - MUSHROOM.z), MUSHROOM.radius * .75, MUSHROOM.radius + 10);
  const p = project(x, z, MUSHROOM.approach);
  const corridor = (1 - sstep(p.d, 1.5, 7.5)) * sstep(p.s, 0, APPROACH_LENGTH) * 0.85;
  return Math.max(radial, corridor);
}
export function easeMushroom(current: number, target: number, dt: number) {
  const n = current + (target - current) * (1 - Math.exp(-Math.max(0, dt) * 1.5));
  return target === 0 && n < 0.001 ? 0 : n;
}
