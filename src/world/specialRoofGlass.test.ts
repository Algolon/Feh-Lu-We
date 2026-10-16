import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { hipRoofGeo } from './kit';
import { cutEastHipRoofWindow } from './specialRoofGlass';
import { ATTIC_ROOF_WINDOW } from './layout';
import { PORTALS } from './roomdefs';

describe('WINDOW-R03 real sloping attic glass', () => {
  it('cuts exactly the intended roof face without punching the other three slopes', () => {
    const original=hipRoofGeo(36,30,8.2,0.7);
    const result=cutEastHipRoofWindow(original,36,30,8.2,0.7,90,95,ATTIC_ROOF_WINDOW);
    expect(result.userData.roofCutout).toMatchObject({count:1,site:'atticLookout'});
    expect(result.getAttribute('position').count).toBeGreaterThan(original.getAttribute('position').count);
    const mat=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
    const surface=new THREE.Mesh(result,mat);
    surface.updateMatrixWorld(true);
    const hit=(x:number,z:number)=>{
      const ray=new THREE.Raycaster(new THREE.Vector3(x,25,z),new THREE.Vector3(0,-1,0));
      return ray.intersectObject(surface,false).length;
    };
    // In local Three coords: X=planX-90, Z=95-planZ.
    const insideX=(ATTIC_ROOF_WINDOW.x0+ATTIC_ROOF_WINDOW.x1)/2-90;
    const insideZ=95-(ATTIC_ROOF_WINDOW.z0+ATTIC_ROOF_WINDOW.z1)/2;
    expect(hit(insideX,insideZ)).toBe(0);
    expect(hit(insideX,insideZ-2.3)).toBeGreaterThan(0);
    expect(hit(-insideX,insideZ)).toBeGreaterThan(0);
    original.dispose();result.dispose();mat.dispose();
  });
  it('uses a dedicated look-out visibility portal, not a facade-window duplicate', () => {
    const found=PORTALS.filter(p=>p.kind==='window'&&p.seeThrough&&p.a==='atticLookout'&&p.b==='out');
    expect(found).toHaveLength(1);
    expect(found[0].aperture?.x).toBeCloseTo((ATTIC_ROOF_WINDOW.x0+ATTIC_ROOF_WINDOW.x1)/2);
    expect(found[0].aperture?.z).toBeCloseTo((ATTIC_ROOF_WINDOW.z0+ATTIC_ROOF_WINDOW.z1)/2);
    expect(found[0].aperture?.axis).toBe('z');
  });
});
