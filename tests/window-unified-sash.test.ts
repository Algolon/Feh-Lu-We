import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { MANOR_WINDOWS } from '../src/world/manorWindowLayout';
import { UNIFIED_SASH_COLOR, UNIFIED_SASH_MATERIAL, unifiedSashGeometry, unifiedSashShape } from '../src/world/manorSash';

describe('WINDOW-FIX-R02 single connected sash', () => {
  it('keeps one uniform paint specification for every facade orientation', () => {
    expect(UNIFIED_SASH_COLOR).toBe('#687568');
    expect(UNIFIED_SASH_MATERIAL).toBe('WINDOW-FIX-R02-ConnectedSash');
    expect(MANOR_WINDOWS).toHaveLength(44);
  });

  it('cuts 8 real pane openings from one extruded solid for each of the 44 regular windows', () => {
    for (const window of MANOR_WINDOWS) {
      const outline = unifiedSashShape(window.w, window.h);
      expect(outline.holes, window.id).toHaveLength(8);
      const geometry = unifiedSashGeometry(window.w, window.h);
      geometry.computeBoundingBox();
      const bounds = geometry.boundingBox!;
      expect(bounds.max.x - bounds.min.x).toBeCloseTo(window.w + 0.08, 5);
      expect(bounds.max.y - bounds.min.y).toBeCloseTo(window.h + 0.095, 5);
      expect(bounds.max.z - bounds.min.z).toBeCloseTo(0.049, 5);
      expect(geometry.getAttribute('position').count).toBeGreaterThan(100);
      geometry.dispose();
    }
  });

  it('has no opaque faces inside glass panes, but does have a solid central mullion and meeting rail', () => {
    const geometry = unifiedSashGeometry(1.1, 1.6);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
    mesh.updateMatrixWorld();
    const ray = (x:number, y:number) => {
      const cast = new THREE.Raycaster(new THREE.Vector3(x,y,1),new THREE.Vector3(0,0,-1),0,2);
      return cast.intersectObject(mesh,false).length;
    };
    // Two columns and four rows; all 8 glass openings are physically empty.
    for (const x of [-0.27, 0.27]) for (const y of [-0.60, -0.20, 0.20, 0.60])
      expect(ray(x,y), 'glass aperture '+x+','+y).toBe(0);
    expect(ray(0,-0.2)).toBeGreaterThan(0); // vertical centre mullion
    expect(ray(0.2,0)).toBeGreaterThan(0); // stronger middle horizontal rail
    expect(ray(-0.53,-0.6)).toBeGreaterThan(0); // outside frame
    geometry.dispose();
    (mesh.material as THREE.Material).dispose();
  });
});
