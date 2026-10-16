// VEG-R06: ground albedo at the existing world scale, with periodic fields and wrapped brush marks.
// Terrain height, vertex tints, UVs, materials and collision stay with their existing builders.
import { mulberry32, type Rng } from '../core/rng';

const requestedGroundArt = typeof location === 'undefined' ? null : (new URLSearchParams(location.search).get('groundart') ?? 'r07');
export const GROUND_SURFACE_DETAIL = requestedGroundArt === 'r06' || requestedGroundArt === 'r07';
export const GROUND_SURFACE_VARIATION = requestedGroundArt === 'r07';
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
export function groundTexturePixels(kind: GroundTextureKind, size=512, variation=false) {
  const grass=kind==='grass',seed=grass?6101:6201;
  const broad=periodicGroundField(seed,7),mid=periodicGroundField(seed+1,23),fine=periodicGroundField(seed+2,117);
  const pixels=new Uint8ClampedArray(size*size*4),base=grass?[143,179,90]:[185,165,134];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size,v=y/size,lo=broad(u,v),m=mid(u,v),f=fine(u,v),val=lo*(variation?24:grass?6:5)+m*(variation?11:3)+f*(variation?3:1.8),i=(y*size+x)*4;
    // R07 restores broad light/dark patches as well as warm and cool colour changes.
    pixels[i]=base[0]+val+lo*(variation?6:grass?1.5:1);
    pixels[i+1]=base[1]+val-lo*(variation?2:grass?1:0);
    pixels[i+2]=base[2]+val-lo*(variation?6:grass?1.5:1);
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

export function paintGroundTexture(ctx:CanvasRenderingContext2D,kind:GroundTextureKind,size=512,variation=false) {
  const image=ctx.createImageData(size,size);image.data.set(groundTexturePixels(kind,size,variation));ctx.putImageData(image,0,0);
  const grass=kind==='grass',r: Rng=mulberry32(grass?6110:6210),scale=size/512;
  ctx.lineCap='round';
  if(variation){
    // Irregular edged paint masses keep the authored detail readable, instead of only smooth noise.
    for(let i=0;i<(grass?190:145);i++){
      const x=r()*size,y=r()*size,rad=(5+r()*19)*scale,n=6+Math.floor(r()*3);
      const outline=Array.from({length:n},(_,j)=>{const a=j/n*Math.PI*2,rr=rad*(.6+r()*.4);return [Math.cos(a)*rr,Math.sin(a)*rr];});
      ctx.fillStyle=grass?(r()<.5?'#779a48':'#a7cc6c'):(r()<.5?'#9e8869':'#d4c2a3');
      ctx.globalAlpha=.22+r()*.18;
      wrapMark(ctx,size,x,y,rad,()=>{ctx.beginPath();outline.forEach(([px,py],j)=>j?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.closePath();ctx.fill();});
    }
    if(!grass)for(let i=0;i<220;i++){
      const x=r()*size,y=r()*size,rad=(1.1+r()*2.7)*scale,angle=r()*Math.PI*2;
      ctx.globalAlpha=.35+r()*.2;ctx.fillStyle=r()<.5?'#857660':'#e2d1b2';
      wrapMark(ctx,size,x,y,rad*1.5,()=>{ctx.rotate(angle);ctx.beginPath();ctx.moveTo(-rad,0);ctx.lineTo(-rad*.4,-rad*.65);ctx.lineTo(rad*.85,-rad*.3);ctx.lineTo(rad*.65,rad*.5);ctx.closePath();ctx.fill();});
    }
  }
  if(grass){
    // Small loose fans, with changing direction and soft values, rather than parallel bright dashes.
    for(let i=0;i<(variation?3600:5800);i++){
      const x=r()*size,y=r()*size,angle=r()*Math.PI*2,len=(variation?3.5+r()*5.5:1.7+r()*3.1)*scale,width=(variation?.8+r()*.7:.45+r()*.55)*scale,bend=(r()-.5)*1.8*scale;
      const colour=r()<.5?(variation?'#6d9142':'#73954d'):(variation?'#b1d076':'#a5bc75');ctx.globalAlpha=variation?.35+r()*.2:.16+r()*.12;ctx.strokeStyle=colour;ctx.lineWidth=width;
      wrapMark(ctx,size,x,y,len+2*scale,()=>{
        ctx.rotate(angle);
        for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(side*len*.23+bend,-len*.46,side*len*.45+bend,-len);ctx.stroke();}
      });
    }
  }else{
    // Restrained fine aggregate and broken short scuffs in compacted earth; no baked light direction.
    for(let i=0;i<3800;i++){
      const x=r()*size,y=r()*size,rad=(.35+r()*.85)*scale,angle=r()*Math.PI*2,aspect=.45+r()*.5;
      ctx.globalAlpha=variation?.24+r()*.25:.14+r()*.2;ctx.fillStyle=r()<.52?'#8d7f69':'#d4c4a8';
      wrapMark(ctx,size,x,y,rad*2,()=>{ctx.beginPath();ctx.ellipse(0,0,rad,rad*aspect,angle,0,Math.PI*2);ctx.fill();});
    }
    for(let i=0;i<210;i++){
      const x=r()*size,y=r()*size,len=(2+r()*4)*scale,angle=r()*Math.PI*2;
      ctx.globalAlpha=variation?.22:.10;ctx.strokeStyle=r()<.5?'#897a64':'#d2c1a3';ctx.lineWidth=.7*scale;
      wrapMark(ctx,size,x,y,len,()=>{ctx.rotate(angle);ctx.beginPath();ctx.moveTo(-len*.5,0);ctx.quadraticCurveTo(0,len*.12,len*.5,0);ctx.stroke();});
    }
  }
  ctx.globalAlpha=1;
}
