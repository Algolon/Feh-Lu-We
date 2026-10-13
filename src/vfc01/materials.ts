import * as T from 'three';
import {n,q} from './config';
export const textures:T.Texture[]=[];
/** Small authored swatches; seeded, calm multi-scale information rather than photographic noise. */
function map(family:string,size:number,kind:'base'|'normal'|'rough'='base'){
 const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d')!,image=x.createImageData(size,size);let seed=733;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const val=(u:number,v:number)=>{const macro=Math.sin(u*15+Math.sin(v*9))*.025+Math.sin(v*7)*.02;
 if(family==='timber')return .7+macro+.045*Math.sin(u*170+5*Math.sin(v*7)+Math.sin(v*35))+.025*Math.sin(u*59+Math.sin(v*8)*2);
 if(family==='fabric')return .9+macro+.016*(Math.sin(u*450)+Math.sin(v*450));
 if(family==='tile'){const mortar=Math.min(u*5%1,v*5%1)<.018;return mortar?.65:.89+macro+.02*Math.sin(u*23+v*13);}
 return .93+macro+.01*Math.sin(u*130+v*95);};
 for(let j=0;j<size;j++)for(let i=0;i<size;i++){const u=i/size,v=j/size,k=4*(j*size+i);let z=val(u,v);if(kind==='normal'){const a=(val(u+.002,v)-val(u-.002,v))*1.5,b=(val(u,v+.002)-val(u,v-.002))*.6;image.data.set([128-a*255,128-b*255,255,255],k);}else if(kind==='rough'){z=family==='timber'?.76+.03*Math.sin(u*45):.85;image.data.set([255,z*255,0,255],k);}else{z+=.008*(rand()-.5);image.data.set([z*255,z*255,z*255,255],k);}}
 x.putImageData(image,0,0);const t=new T.CanvasTexture(c);t.name=`vfc-${family}-${kind}-${size}`;t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=kind==='base'?T.SRGBColorSpace:T.NoColorSpace;t.anisotropy=n('aniso',4,1,8);textures.push(t);return t;
}
const cache=new Map<string,T.Material>();
export function pilotMaterial(family:string){if(cache.has(family))return cache.get(family)!;
 const size=family==='timber'?n('tex',1024,512,2048):512,model=q.get('model')??'standard';const opts={map:map(family,size),vertexColors:true};
 let m:T.MeshLambertMaterial|T.MeshPhongMaterial|T.MeshStandardMaterial;
 if(model==='lambert')m=new T.MeshLambertMaterial(opts);else if(model==='phong')m=new T.MeshPhongMaterial({...opts,shininess:family==='paint'?24:12,specular:0x171717});else m=new T.MeshStandardMaterial({...opts,roughness:family==='paint'?.65:.85,metalness:0});
 if(q.get('normal')!=='0'&&['timber','tile','limestone'].includes(family)){m.normalMap=map(family,512,'normal');m.normalScale.set(.22,.22);}
 if(m instanceof T.MeshStandardMaterial&&['timber','tile'].includes(family))m.roughnessMap=map(family,512,'rough');
 m.name='vfc-'+family+'-'+model;cache.set(family,m);return m;
}
