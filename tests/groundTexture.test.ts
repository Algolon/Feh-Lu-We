import { describe, expect, it } from 'vitest';
import { groundTexturePixels, periodicGroundField } from '../src/world/groundTexture';

describe('ground texture tiling', () => {
  it('keeps fields continuous through positive and negative tile boundaries', () => {
    for(const cells of [7,23,117]){
      const field=periodicGroundField(6101,cells);
      for(const [u,v] of [[0,0],[.23,.71],[-.42,1.81],[1,-.1]]){
        expect(field(u,v)).toBeCloseTo(field(u+1,v),10);
        expect(field(u,v)).toBeCloseTo(field(u,v-1),10);
        expect(Math.abs(field(1-1e-7,v)-field(1+1e-7,v))).toBeLessThan(.0001);
      }
    }
  });
  it('preserves the terrain tint calibration and opaque deterministic albedo', () => {
    for(const kind of ['grass','dirt'] as const)for(const variation of [false,true]){
      const p=groundTexturePixels(kind,128,variation),again=groundTexturePixels(kind,128,variation),base=kind==='grass'?[143,179,90]:[185,165,134],mean=[0,0,0];
      expect(p).toEqual(again);
      for(let i=0;i<p.length;i+=4){expect(p[i+3]).toBe(255);for(let c=0;c<3;c++)mean[c]+=p[i+c]/(p.length/4);}
      for(let c=0;c<3;c++)expect(Math.abs(mean[c]-base[c])).toBeLessThan(3);
      if(variation){
        // Preserve the user's requested visible colour depth instead of regressing to the flat R06 wash.
        const variance=(pixels:Uint8ClampedArray)=>{
          let sum=0,squares=0;const n=pixels.length/4;
          for(let i=0;i<pixels.length;i+=4){const value=(pixels[i]+pixels[i+1]+pixels[i+2])/3;sum+=value;squares+=value*value;}
          return squares/n-(sum/n)**2;
        };
        expect(variance(p)).toBeGreaterThan(variance(groundTexturePixels(kind,128,false))*4);
      }
    }
  });
});
