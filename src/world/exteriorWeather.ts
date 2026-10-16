// EXT-R06: cause-led ageing, sampled in world space so it follows architecture, not UV seams.
import * as THREE from 'three';
import type { Ctx } from './arch';
import type { World } from '../interactions/world';
import { geo } from './kit';
import { softBox } from './artkit';
export const EXTERIOR_WEATHER=typeof location==='undefined'||new URLSearchParams(location.search).get('weather')!=='base';

/** Shared stone gets local damp feet and worn approach, never a uniformly dirty tint. */
export function ageDressedStone(mat:THREE.MeshLambertMaterial) {
  const previous=mat.onBeforeCompile;
  mat.onBeforeCompile=(shader,renderer)=>{
    previous.call(mat,shader,renderer);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec3 p=vFlwP; float z=-p.z;
      float mottled=.5+.25*sin(p.x*13.7+z*9.3)*sin(z*17.1+p.y*11.2)+.25*sin(p.x*4.1-z*6.7);
      float west=1.0-smoothstep(71.9,72.7,p.x);
      float north=smoothstep(109.4,110.0,z);
      float sheltered=max(west,north);
      float foot=(1.0-smoothstep(.06,.55,p.y))*smoothstep(-.12,.02,p.y);
      float damp=foot*sheltered*(.09+.12*mottled);
      // The portico keeps cleaner shafts, with moisture only at the low base.
      float columns=max(1.0-smoothstep(.18,.36,length(vec2(p.x-88.1,z-78.85))),1.0-smoothstep(.18,.36,length(vec2(p.x-91.9,z-78.85))));
      damp=max(damp,columns*(1.0-smoothstep(.25,.65,p.y))*(.045+.055*mottled));
      diffuseColor.rgb*=mix(vec3(1.0),vec3(.68,.76,.61),clamp(damp,0.0,.24));
      // Warm, low-contrast traffic polish along the centre, fading before column bases.
      float approach=(1.0-smoothstep(.55,1.6,abs(p.x-90.0)))*smoothstep(78.12,78.4,z)*(1.0-smoothstep(79.7,80.2,z));
      float tread=1.0-smoothstep(.008,.035,abs(p.y-.15));
      diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.035,1.025,1.005),approach*tread*(.65+.35*mottled));
    `);
  };
  mat.customProgramCacheKey=()=> 'ext-r06-dressed-weather';mat.needsUpdate=true;
}

/** Enamel house sign fitted into the flat bay wall between the door surround (x=91.15) and pilaster (x=91.70). */
export function houseNameplate(w:World,c:Ctx) {
  // The 2.5 cm backing ends at z=79.5475, just 2.5 mm in front of the bay wall (z=79.55).
  const x=91.425,y=1.62,z=79.535,o={chunk:c.chunk,shadow:false,jitter:0};
  const backing=softBox(.47,.20,.025,.025);
  geo(c.b,c.k.M.paint,'#7f806d',backing,x,y,z,o);backing.dispose();
  const cv=document.createElement('canvas');cv.width=512;cv.height=192;
  const ctx=cv.getContext('2d')!;
  ctx.fillStyle='#304b40';ctx.fillRect(0,0,512,192);
  ctx.strokeStyle='#b5b393';ctx.lineWidth=3;ctx.strokeRect(12,12,488,168);
  // Broad readable lettering, no invented date, crest or puzzle clue.
  ctx.fillStyle='#eee8ce';ctx.font='44px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('Feh Lu We',256,96);
  for(const at of [26,486]){ctx.fillStyle='#99977e';ctx.beginPath();ctx.arc(at,96,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#3e4a3d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(at-3,95);ctx.lineTo(at+3,97);ctx.stroke();}
  const map=w.texture(new THREE.CanvasTexture(cv));map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  const mat=w.material(new THREE.MeshLambertMaterial({map}));
  const face=new THREE.PlaneGeometry(.44,.165);
  geo(c.b,mat,'#ffffff',face,x,y,z-.014,o);face.dispose();
  // The painted screwheads are retained on the face; no projecting mounts are needed.
}
