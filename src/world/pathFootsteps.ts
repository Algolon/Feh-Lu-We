// Audio material sampling against the same authored ribbons used to draw outdoor paths.
// No expensive raycasts or per-step network reconstruction.
import type { NetLine, Row } from './junctions';

function inTriangle(x: number, z: number, a: RowPoint, b: RowPoint, c: RowPoint): boolean {
  const ab = (b.x - a.x) * (z - a.z) - (b.z - a.z) * (x - a.x);
  const bc = (c.x - b.x) * (z - b.z) - (c.z - b.z) * (x - b.x);
  const ca = (a.x - c.x) * (z - c.z) - (a.z - c.z) * (x - c.x);
  return (ab >= -1e-5 && bc >= -1e-5 && ca >= -1e-5) || (ab <= 1e-5 && bc <= 1e-5 && ca <= 1e-5);
}
interface RowPoint { x: number; z: number; }
function onSegment(x: number, z: number, a: Row, b: Row): boolean {
  const minX = Math.min(a.lx, a.rx, b.lx, b.rx), maxX = Math.max(a.lx, a.rx, b.lx, b.rx);
  const minZ = Math.min(a.lz, a.rz, b.lz, b.rz), maxZ = Math.max(a.lz, a.rz, b.lz, b.rz);
  if (x < minX - 0.001 || x > maxX + 0.001 || z < minZ - 0.001 || z > maxZ + 0.001) return false;
  const al = { x: a.lx, z: a.lz }, ar = { x: a.rx, z: a.rz };
  const bl = { x: b.lx, z: b.lz }, br = { x: b.rx, z: b.rz };
  return inTriangle(x, z, al, ar, bl) || inTriangle(x, z, ar, br, bl);
}

/** True on a drawn path ribbon (including the driveway). Hard platforms have priority in the caller. */
export function onOutdoorPath(x: number, z: number, lines: readonly NetLine[]): boolean {
  for (const line of lines) {
    for (const run of line.runs) {
      for (let i = 1; i < run.rows.length; i++) {
        if (onSegment(x, z, run.rows[i - 1], run.rows[i])) return true;
      }
    }
  }
  return false;
}
