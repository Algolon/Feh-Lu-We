// WINDOW-R03: Portugal cottage has its OWN plaster/cobalt/terracotta window grammar.
// Never reuse manor's green sash or mahogany interior board here.
import { COTTAGE, COTTAGE_PAD_Y } from './layout';
export interface CottageClearWindow {
 id:string; axis:'x'|'z'; f:number; at:number; exterior:-1|1;
 w:number; sill:number; h:number; y0:number; wallThickness:number;
}
export const COTTAGE_WINDOWS:readonly CottageClearWindow[]=[
 ...[COTTAGE.x0+2.2,COTTAGE.x1-2.2].map((at,i)=>({
  id:'cottage-south-'+i,axis:'x' as const,f:COTTAGE.z0+0.15,at,exterior:-1 as const,
  w:0.9,sill:0.95,h:1.2,y0:COTTAGE_PAD_Y,wallThickness:0.3})),
 ...[COTTAGE.x0+2.5,COTTAGE.x1-2.5].map((at,i)=>({
  id:'cottage-north-'+i,axis:'x' as const,f:COTTAGE.z1-0.15,at,exterior:1 as const,
  w:0.9,sill:0.95,h:1.2,y0:COTTAGE_PAD_Y,wallThickness:0.3})),
 {id:'cottage-west',axis:'z',f:COTTAGE.x0+0.15,at:COTTAGE.z0+5.3,exterior:-1,w:0.9,sill:0.95,h:1.2,y0:COTTAGE_PAD_Y,wallThickness:0.3},
 ...[COTTAGE.z0+1.7,COTTAGE.z0+5.6].map((at,i)=>({
  id:'cottage-east-'+i,axis:'z' as const,f:COTTAGE.x1-0.15,at,exterior:1 as const,
  w:0.9,sill:0.95,h:1.2,y0:COTTAGE_PAD_Y,wallThickness:0.3})),
];
export const cottageAperture=(w:CottageClearWindow)=>({
 x:w.axis==='x'?w.at:w.f,
 y:w.y0+w.sill+w.h/2,z:w.axis==='x'?w.f:w.at,
 width:w.w,height:w.h,axis:w.axis,
});
