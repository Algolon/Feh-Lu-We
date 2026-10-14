import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { World } from '../src/interactions/world';
import { addEnvironment } from '../src/world/env';
import { SKY_FRAGMENT } from '../src/world/skyShader';
import { cloudFragment, CLOUD_VARIANTS } from '../src/world/cloudPrototypes';
const sky = (w: World) => (w.scene.children.find(o => (o as THREE.Mesh).material instanceof THREE.ShaderMaterial) as THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>).material;
describe('SKY-C01 isolation and approved environment contracts', () => {
  it('uses owner-approved A outside review, ignores candidate overrides and does not allocate an atlas', () => {
    const w = new World('estate'), e = addEnvironment(w, false);
    expect(sky(w).fragmentShader).toBe(cloudFragment('procedural'));
    for (const v of CLOUD_VARIANTS) { e.cloudVariant=v; e.update(.6,new THREE.Vector3()); expect(sky(w).fragmentShader).toBe(cloudFragment('procedural')); expect(sky(w).uniforms.uCloudAtlas.value).toBe(null); }
    w.dispose();
  });
  it('uses identical global light, haze and cloud palette for every candidate throughout all phases', () => {
    const w = new World('estate'), e = addEnvironment(w, true);
    for (const t of [0,.15,1/3,.5,2/3,.85,1]) {
      let reference: unknown;
      for (const variant of CLOUD_VARIANTS) {
        e.cloudVariant=variant;e.preview=t;e.update(t,new THREE.Vector3(90,1.65,-123),0);
        const fog=w.scene.fog as THREE.Fog, u=sky(w).uniforms;
        const values=[e.sun.intensity,e.hemi.intensity,...e.sun.color.toArray(),...e.hemi.color.toArray(),...fog.color.toArray(),fog.near,fog.far,e.fixtureGain,...u.uZenith.value.toArray(),...u.uHorizon.value.toArray(),...u.uCloudLight.value.toArray(),...u.uCloudShade.value.toArray(),u.uCloudOpacity.value];
        if(reference)expect(values).toEqual(reference);else reference=values;
        expect(sky(w).fragmentShader).toBe(cloudFragment(variant));
        e.clouds=false;e.update(t,new THREE.Vector3(90,1.65,-123),0);expect(u.uCloudOpacity.value).toBe(0);e.clouds=true;
      }
    }
    w.dispose();
  });
  it('keeps the exact approved sky background, sun, tone mapping and output pipeline', () => {
    const suffix=SKY_FRAGMENT.slice(SKY_FRAGMENT.indexOf('varying vec3 vDir;'));
    for(const v of CLOUD_VARIANTS)expect(cloudFragment(v).slice(cloudFragment(v).indexOf('varying vec3 vDir;'))).toBe(suffix);
  });
});
