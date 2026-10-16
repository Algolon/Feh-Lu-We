// VEG-R06: ground albedo at the existing world scale, with periodic fields and wrapped brush marks.
// Terrain height, vertex tints, UVs, materials and collision stay with their existing builders.
import { mulberry32, type Rng } from '../core/rng';

export const GROUND_SURFACE_DETAIL = typeof location !== 'undefined' && new URLSearchParams(location.search).get('groundart') === 'r06';
export type GroundTextureKind = 'grass' | 'dirt';

/** Smooth toroidal value field. The wrapped lattice also works outside the original tile. */
export function periodicGroundField(seed: number, cells: number) {
  const r=mulberry32(seed),values=Array.from({length:cells*cells},()=>r()*2-1);
  const at=(x:number,y:number)=>values[((y%cells+cells)%cells)*cells+(x%cells+cells)%cells];
  const smooth=(u:number)=>u*u*(3-2*u);
  return (u:number,v:number)=>{
    const x=u*cells,y=v*cells,ix=Math.floor(x),iy=Math.floor(y),sx=smooth(x-ix),sy=smooth(y-iy);
    const a=at(ix,iy)*(1-sx)+at(ix+1,iy)*sx,b=at(ix,iy+1)*(1-sx)+at(ix+1,iy+1)*sx;
    return a*(1-sy)+b*sy;
  };
}

/** Keep mean grass colour near #8fb35a: woodland vertex tints compensate for that mean. */
export function groundTexturePixels(kind: GroundTextureKind, size=512) {
  const grass=kind==='grass',seed=grass?6101:6201;
  const broad=periodicGroundField(seed,7),mid=periodicGroundField(seed+1,23),fine=periodicGroundField(seed+2,117);
  const pixels=new Uint8ClampedArray(size*size*4),base=grass?[143,179,90]:[185,165,134];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size,v=y/size,lo=broad(u,v),m=mid(u,v),f=fine(u,v),val=lo*(grass?6:5)+m*3+f*1.8,i=(y*size+x)*4;
    // Warm/dry and lush areas share value; no high-contrast circular 'stones' in the base layer.
    pixels[i]=base[0]+val+lo*(grass?1.5:1);
    pixels[i+1]=base[1]+val-lo*(grass?1:0);
    pixels[i+2]=base[2]+val-lo*(grass?1.5:1);
    pixels[i+3]=255;
  }
  return pixels;
}

/** Draw exactly the same feature in each intersecting neighbour: no random resampling at tile edges. */
function wrapMark(ctx:CanvasRenderingContext2D,size:number,x:number,y:number,radius:number,draw:()=>void) {
  for(const ox of [-size,0,size])for(const oy of [-size,0,size]){
    if(x+ox+radius<0||x+ox-radius>size||y+oy+radius<0||y+oy-radius>size)continue;
    ctx.save();ctx.translate(x+ox,y+oy);draw();ctx.restore();
  }
}

export function paintGroundTexture(ctx:CanvasRenderingContext2D,kind:GroundTextureKind,size=512) {
  const image=ctx.createImageData(size,size);image.data.set(groundTexturePixels(kind,size));ctx.putImageData(image,0,0);
  const grass=kind==='grass',r: Rng=mulberry32(grass?6110:6210),scale=size/512;
  ctx.lineCap='round';
  if(grass){
    // Small loose fans, with changing direction and soft values, rather than parallel bright dashes.
    for(let i=0;i<5800;i++){
      const x=r()*size,y=r()*size,angle=r()*Math.PI*2,len=(1.7+r()*3.1)*scale,width=(.45+r()*.55)*scale,bend=(r()-.5)*1.8*scale;
      const colour=r()<.5?'#73954d':'#a5bc75';ctx.globalAlpha=.16+r()*.12;ctx.strokeStyle=colour;ctx.lineWidth=width;
      wrapMark(ctx,size,x,y,len+2*scale,()=>{
        ctx.rotate(angle);
        for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(side*len*.23+bend,-len*.46,side*len*.45+bend,-len);ctx.stroke();}
      });
    }
  }else{
    // Restrained fine aggregate and broken short scuffs in compacted earth; no baked light direction.
    for(let i=0;i<3800;i++){
      const x=r()*size,y=r()*size,rad=(.35+r()*.85)*scale,angle=r()*Math.PI*2,aspect=.45+r()*.5;
      ctx.globalAlpha=.14+r()*.2;ctx.fillStyle=r()<.52?'#8d7f69':'#d4c4a8';
      wrapMark(ctx,size,x,y,rad*2,()=>{ctx.beginPath();ctx.ellipse(0,0,rad,rad*aspect,angle,0,Math.PI*2);ctx.fill();});
    }
    for(let i=0;i<210;i++){
      const x=r()*size,y=r()*size,len=(2+r()*4)*scale,angle=r()*Math.PI*2;
      ctx.globalAlpha=.10;ctx.strokeStyle=r()<.5?'#897a64':'#d2c1a3';ctx.lineWidth=.7*scale;
      wrapMark(ctx,size,x,y,len,()=>{ctx.rotate(angle);ctx.beginPath();ctx.moveTo(-len*.5,0);ctx.quadraticCurveTo(0,len*.12,len*.5,0);ctx.stroke();});
    }
  }
  ctx.globalAlpha=1;
}
