// WINDOW-R03: real recessed glazing for whitewashed Portugal cottage, using its
// existing pale frame, cobalt shutters and TERRACOTTA exterior sills (not manor timber).
import type { World } from '../interactions/world';
import type { Ctx } from './arch';
import { boxMM } from './kit';
import type { CottageClearWindow } from './cottageClearWindows';

export function buildCottageGlazing(w:World,c:Ctx,site:CottageClearWindow) {
 const k=c.k;
 const lo=site.at-site.w/2,hi=site.at+site.w/2;
 const y0=site.y0+site.sill,y1=y0+site.h;
 const face=site.f+site.exterior*site.wallThickness/2;
 const glassF=face-site.exterior*0.085;
 const inside=site.f-site.exterior*(site.wallThickness/2+0.025);
 const opts={chunk:c.chunk,shadow:false,jitter:0};
 const box=(a:number,b:number,l:number,r:number,d0:number,d1:number,mat:typeof k.M.paint,color:string)=>{
   const f0=Math.min(d0,d1),f1=Math.max(d0,d1);
   if(site.axis==='x')boxMM(c.b,mat,color,a,b,l,r,f0,f1,opts);
   else boxMM(c.b,mat,color,f0,f1,l,r,a,b,opts);
 };
 // Exactly one clear sheet, behind the pale exterior cottage sash.
 box(lo,hi,y0,y1,glassF-.006,glassF+.006,k.M.windowGlass,'#ffffff');
 const plaster='#f6efe2',edge=.014;
 box(lo,lo+edge,y0,y1,inside,glassF,k.M.plaster,plaster);
 box(hi-edge,hi,y0,y1,inside,glassF,k.M.plaster,plaster);
 box(lo,hi,y1-edge,y1,inside,glassF,k.M.plaster,plaster);
 // Quiet whitewashed interior reveal/board; existing exterior terracotta drip sill is retained.
 box(lo-.06,hi+.06,y0-.025,y0+.008,inside-site.exterior*.06,glassF-site.exterior*.01,
  k.M.plaster,'#ebdfcb');
 const depthLo=Math.min(glassF-.025,glassF+.025),depthHi=Math.max(glassF-.025,glassF+.025);
 const pane=site.axis==='x'
  ? w.col.addBox(lo,hi,depthLo,depthHi,y0,y1,{occludes:true,tag:'cottage.window.'+site.id})
  : w.col.addBox(depthLo,depthHi,lo,hi,y0,y1,{occludes:true,tag:'cottage.window.'+site.id});
 w.visualPassThrough.add(pane);
}
