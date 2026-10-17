import {describe,expect,it} from 'vitest';
import {ROOM_SOURCE_IDS,STABLE_HALL_MASK,STABLE_LIBRARY_MASK,
 stableHallMaskAt,stableLibraryMaskAt,STABLE_ROOMS_PILOT,STABLE_LIVING_IDS} from '../src/world/stableLighting';
import {ROOMS,PORTALS} from '../src/world/roomdefs';

describe('LIGHT-R08: authored, world-fixed hall/library light masks',()=>{
 const hall=ROOMS.find(r=>r.id==='hall')!;
 const library=ROOMS.find(r=>r.id==='library')!;
 it('remains opt-in by default; keeps R06D in isolated mode',()=>{
  expect(STABLE_ROOMS_PILOT).toBe(false);
  expect(STABLE_LIVING_IDS).toEqual(new Set(['fire.living','lamp.livingFloor']));
  expect(ROOM_SOURCE_IDS).toEqual(['lamp.hallChandelier','lamp.hallConsole','lamp.libraryChandelier','lamp.library']);
 });
 it('reuses the actual room bounds; does not depend on where the player is',()=>{
  expect([hall.x0,hall.x1,hall.z0,hall.z1]).toEqual([85,95,84,98]);
  expect([library.x0,library.x1,library.z0,library.z1]).toEqual([72.4,85,94,109.6]);
  for(const [x,y,z] of [[90,1,-90],[85.17,1,-90],[93,5,-91]]){
   expect(stableHallMaskAt(x,y,z)).toBeGreaterThan(.99);
   expect(stableLibraryMaskAt(x,y,z)).toBe(0);
  }
  for(const [x,y,z] of [[80,1,-101],[84.84,1,-101],[78,5,-102]]){
   expect(stableLibraryMaskAt(x,y,z)).toBeGreaterThan(.99);
   expect(stableHallMaskAt(x,y,z)).toBe(0);
  }
 });
 it('no light may leak past library↔living, lobby↔library or exterior faces',()=>{
  for(const [x,y,z] of [
   [79,1,-93.92], // living side of shared partition
   [85.12,1,-101], // lobby side of library's east partition
   [72.18,1,-103], // exterior side
   [80,1,-109.9], // exterior rear
   [80,-1,-101], // basement
   [80,6.5,-101] // above library
  ])expect(stableLibraryMaskAt(x,y,z)).toBe(0);
  for(const [x,y,z] of [
   [84.92,1,-90], // living side of hall wall
   [95.08,1,-90], // dining side of hall wall
   [90,1,-98.2], // lobby
   [90,1,-83.8], // vestibule
   [90,-1,-90], // basement
   [90,6.5,-90] // upstairs room above hall
  ])expect(stableHallMaskAt(x,y,z)).toBe(0);
  expect(STABLE_HALL_MASK.x0out).toBeGreaterThan(85);
  expect(STABLE_LIBRARY_MASK.z1out).toBeLessThan(-94);
 });
 it('door portals only control visibility, never the authored room-mask strengths',()=>{
  const lib=PORTALS.find(p=>p.door==='door.livLib');
  const lobby=PORTALS.find(p=>p.door==='door.library');
  expect([lib?.a,lib?.b,lib?.kind]).toEqual(['living','library','door']);
  expect([lobby?.a,lobby?.b,lobby?.kind]).toEqual(['lobby','library','door']);
  const positions=[[80,1,-101],[90,1,-90]] as const;
  for(const [x,y,z] of positions){
    const b=[stableHallMaskAt(x,y,z),stableLibraryMaskAt(x,y,z)];
    for(let i=0;i<300;i++)expect([stableHallMaskAt(x,y,z),stableLibraryMaskAt(x,y,z)]).toEqual(b);
  }
 });
});
