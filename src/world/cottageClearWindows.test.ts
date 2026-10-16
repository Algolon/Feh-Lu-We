import {describe,it,expect} from 'vitest';
import {COTTAGE_WINDOWS,cottageAperture} from './cottageClearWindows';
import {cottageWindowRoom,PORTALS} from './roomdefs';

describe('WINDOW-R03 Portuguese cottage real windows',()=>{
 it('authored 7 real windows with their true entry/gathering room',()=>{
   expect(COTTAGE_WINDOWS).toHaveLength(7);
   expect(new Set(COTTAGE_WINDOWS.map(w=>w.id)).size).toBe(7);
   const portals=PORTALS.filter(p=>p.kind==='window'&&p.seeThrough
     && ['cottageEntry','cottageRoom'].includes(p.a));
   expect(portals).toHaveLength(7);
   for(const w of COTTAGE_WINDOWS){
     const a=cottageAperture(w);
     const room=cottageWindowRoom(w);
     expect(['cottageEntry','cottageRoom']).toContain(room);
     expect(portals.filter(p=>p.a===room&&p.aperture?.x===a.x
       &&p.aperture?.y===a.y&&p.aperture?.z===a.z)).toHaveLength(1);
     expect(w.wallThickness).toBe(0.3);
     expect(w.w).toBe(0.9);
   }
 });
 it('keeps the original coastal palette and one exterior frame in source',()=>{
   // The standard manor-window material is deliberately NOT used in cottageGlazing.
   expect(COTTAGE_WINDOWS.every(w=>w.y0===4)).toBe(true);
   expect(COTTAGE_WINDOWS.filter(w=>w.axis==='x')).toHaveLength(4);
   expect(COTTAGE_WINDOWS.filter(w=>w.axis==='z')).toHaveLength(3);
 });
});
