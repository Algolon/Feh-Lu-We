import {describe,expect,it} from 'vitest';
import {
  LIBRARY_DESK_LIGHT_SURFACE,stableDeskSurfaceAt,
  STABLE_ROOMS_PILOT,R08_SURFACE_FIX,
} from '../src/world/stableLighting';
import {LIB_R01} from '../src/world/libraryR01';
import {GF} from '../src/world/layout';

describe('LIGHT-R08B — real desk surface light, no floating glow geometry',()=>{
 it('keeps the corrected mode isolated to a dedicated R08 review URL',()=>{
   expect(STABLE_ROOMS_PILOT).toBe(false);
   expect(R08_SURFACE_FIX).toBe(false);
 });
 it('tracks the existing physical desk height and footprint',()=>{
   const d=LIB_R01.desk,b=LIBRARY_DESK_LIGHT_SURFACE;
   expect(d).toMatchObject({x:73.17,z:99,w:1.3,d:2.2,h:0.81});
   expect(b.yMin).toBeLessThan(GF+d.h);
   expect(b.yMax).toBeGreaterThan(GF+d.h);
   expect(b.xMin).toBeGreaterThanOrEqual(d.x-d.w/2);
   expect(b.xMax).toBeLessThanOrEqual(d.x+d.w/2+0.05);
   expect(b.zMin).toBeGreaterThanOrEqual(-(d.z+d.d/2)-0.1);
   expect(b.zMax).toBeLessThanOrEqual(-(d.z-d.d/2)+0.1);
 });
 it('is bright on the real table under the bank lamp but not beside the desktop',()=>{
   expect(stableDeskSurfaceAt(73.04,GF+0.81,-99.72)).toBeGreaterThan(.8);
   expect(stableDeskSurfaceAt(72.8,GF+0.81,-99.72)).toBeGreaterThan(.1);
   expect(stableDeskSurfaceAt(72.4,GF+0.81,-99.72)).toBe(0);
   expect(stableDeskSurfaceAt(73.93,GF+0.81,-99.72)).toBe(0);
   expect(stableDeskSurfaceAt(73.04,GF+0.81,-100.2)).toBe(0);
   expect(stableDeskSurfaceAt(73.04,GF+0.81,-97.7)).toBe(0);
 });
 it('never projects a fake lamp pool onto floor, rug, vertical wall or higher objects',()=>{
   const positions=[
     [73.04,GF,-99.72],       // floor beneath bureau
     [78.35,GF+0.03,-102.5],    // library carpet and old chandelier disc
     [73.04,GF+0.40,-99.72],    // beneath desk top
     [73.04,GF+1.10,-99.72],    // books above the desk
     [72.42,GF+0.81,-99.72],    // wall beside desk
   ] as const;
   for(const [x,y,z] of positions)expect(stableDeskSurfaceAt(x,y,z)).toBe(0);
 });
});
