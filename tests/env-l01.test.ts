import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { World } from '../src/interactions/world';
import { addEnvironment } from '../src/world/env';
import { LIGHTING_PHASES, sampleLighting, type PhaseSample } from '../src/world/lightingPhases';
const sampler = (): PhaseSample => ({ a: LIGHTING_PHASES[0], b: LIGHTING_PHASES[1], blend: 0 });
describe('ENV-L01 render contracts', () => {
  it('can isolate practical lights for device diagnosis and restores the global lights', () => {
    const w = new World('estate'), e = addEnvironment(w, true), focus = new THREE.Vector3(63, 1.65, -11.5);
    e.mode = 'baseline'; e.diagnostic = 'practicals'; e.update(0.85, focus);
    expect(e.hemi.intensity).toBe(0); expect(e.sun.intensity).toBe(0);
    e.diagnostic = 'normal'; e.update(0.85, focus);
    expect(e.hemi.intensity).toBeGreaterThan(0); expect(e.sun.intensity).toBeGreaterThan(0);
    w.dispose();
  });
  it('keeps the normal game on production lighting even if review controls are set', () => {
    const w = new World('estate'), e = addEnvironment(w, false), focus = new THREE.Vector3(90, 1.65, -123);
    e.update(0.6, focus, 0);
    const before = [e.hemi.intensity, e.sun.intensity, e.hemi.color.toArray(), e.sun.color.toArray(), (w.scene.fog as THREE.Fog).color.toArray()];
    e.preview = 1; e.mode = 'pilot'; e.diagnostic = 'sun'; e.update(0.6, focus, 0);
    expect([e.hemi.intensity, e.sun.intensity, e.hemi.color.toArray(), e.sun.color.toArray(), (w.scene.fog as THREE.Fog).color.toArray()]).toEqual(before);
    expect(e.fixtureGain).toBe(1); w.dispose();
  });
  it('has finite ordered haze and bounded light over every phase, location and indoor blend', () => {
    const w = new World('estate'), e = addEnvironment(w, true);
    for (let i = 0; i <= 300; i++) for (const indoor of [0, 0.5, 1]) for (const z of [-13.6, -123]) {
      e.update(i / 300, new THREE.Vector3(90, 1.65, z), indoor);
      const fog = w.scene.fog as THREE.Fog;
      expect(fog.near).toBeLessThan(fog.far);
      for (const n of [e.hemi.intensity, e.sun.intensity, fog.near, fog.far, e.fixtureGain, ...fog.color.toArray(), ...e.hemi.color.toArray(), ...e.hemi.groundColor.toArray()]) expect(Number.isFinite(n)).toBe(true);
      expect(e.hemi.intensity).toBeGreaterThan(0.5); expect(e.sun.intensity).toBeGreaterThanOrEqual(0);
    }
    for (const n of [NaN, Infinity, -Infinity]) { e.preview = n; e.update(n, new THREE.Vector3(), n); expect(Number.isFinite(e.hemi.intensity)).toBe(true); }
    w.dispose();
  });
  it('has no value jump at authored stops, including interior colour and sky uniforms', () => {
    const w = new World('estate'), e = addEnvironment(w, true);
    const sky = w.scene.children.find(o => o instanceof THREE.Mesh && o.material instanceof THREE.ShaderMaterial) as THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
    for (const indoor of [0, 0.5, 1]) for (const stop of [1 / 3, 2 / 3]) {
      const values = (t: number) => { e.update(t, new THREE.Vector3(63, 1.65, -11.5), indoor); return [e.hemi.intensity, e.sun.intensity, ...e.hemi.color.toArray(), ...e.hemi.groundColor.toArray(), ...sky.material.uniforms.uHorizon.value.toArray()]; };
      const a = values(stop - 1e-6), b = values(stop + 1e-6);
      expect(Math.max(...a.map((v, i) => Math.abs(v - b[i])))).toBeLessThan(0.0001);
    }
    w.dispose();
  });
  it('removes direct sunlight/glow/shadow pass at blue hour and late dusk and restores baseline', () => {
    const w = new World('estate'), e = addEnvironment(w, true), focus = new THREE.Vector3(63, 1.65, -11.5);
    e.setShadows(true, 1024);
    for (const t of [2 / 3, 1]) { e.update(t, focus); expect(e.sun.intensity).toBe(0); expect(e.sun.castShadow).toBe(false); expect(e.sun.position.y).toBeLessThan(focus.y); }
    e.mode = 'baseline'; e.update(1, focus); expect(e.sun.intensity).toBeGreaterThan(0); expect(e.sun.castShadow).toBe(true);
    e.mode = 'pilot'; e.preview = 0; e.update(1, focus); expect(e.sun.intensity).toBeGreaterThan(0); w.dispose();
  });
  it('clamps the palette sampler and preserves each authored endpoint', () => {
    for (let i = 0; i < 4; i++) { const { a,b,blend } = sampleLighting(i / 3, sampler()); expect(THREE.MathUtils.lerp(a.hemi,b.hemi,blend)).toBeCloseTo(LIGHTING_PHASES[i].hemi); }
    expect(sampleLighting(NaN, sampler()).blend).toBe(0);
    expect(sampleLighting(10, sampler()).blend).toBe(1);
  });
});
