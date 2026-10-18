// ENT-R02-R4: actual software-WebGL 412x915 visual and functional validation.
// This deliberately does NOT enforce the owner-waived legacy absolute perf ceiling.
// Report costs, preserve the real doorway and floors, publish image proof.
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const output='docs/development/workstreams/ent-r02/r4-review';
mkdirSync(output,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:4244,strictPort:true}});
const browser=await chromium.launch({
  executablePath:process.env.CHROME||chromium.executablePath(),
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],
});
const errors=[],results=[];
const views=[
  ['entrance-wide-to-old-facade',{x:90,z:78.55},[90,1.65,80.40]],
  ['entrance-wide-return-right',{x:90.8,z:77.6},[93.6,1.55,80.4]],
  ['gallery-wide-to-old-facade',{x:90,y:3.35,z:78.05},[90,4.9,80.4]],
  ['gallery-wide-return-left',{x:89.1,y:3.35,z:77.7},[86.4,4.95,80.4]],
  ['entrance-left-corner',{x:87.2,z:80.95},[86.45,1.55,80.4]],
  ['entrance-right-corner',{x:92.8,z:80.95},[93.56,1.55,80.4]],
  ['entrance-soffit',{x:90,z:79.35},[90,3.15,80.4]],
  ['gallery-left-corner',{x:87.2,y:3.35,z:81.25},[86.45,4.9,80.4]],
  ['gallery-right-corner',{x:92.8,y:3.35,z:81.25},[93.56,4.9,80.4]],
  ['gallery-ceiling',{x:90,y:3.35,z:79.2},[90,6.2,80.45]],
  ['gallery-ceiling-from-front',{x:90,y:3.35,z:77.4},[90,6.17,82.4]],
  ['gallery-ceiling-from-rear',{x:90,y:3.35,z:82.65},[90,6.17,77.7]],
  ['swallows-from-gallery',{x:90.6,y:3.35,z:79.3},[93.37,5.07,79.30]],
  ['swallows-from-rear',{x:90.8,y:3.35,z:82.2},[93.37,5.07,79.30]],
  ['old-new-gallery-wide',{x:90,y:3.35,z:78.25},[90,4.75,82.45]],
  ['outdoor-right-urn',{x:95.3,z:73.3},[93.3,.43,75.75]],
  ['outdoor-paving-wide',{x:90,z:70.8},[90,.13,75.3]],
  ['outdoor-left-urn',{x:84.7,z:73.3},[86.7,.43,75.75]],
];
try{
const page=await browser.newPage({viewport:{width:412,height:915},deviceScaleFactor:1,isMobile:true,hasTouch:true});
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto('http://127.0.0.1:4244/Feh-Lu-We/?autotest=1',{waitUntil:'networkidle',timeout:120000});
await page.evaluate(()=>{
 localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'high'}));
 localStorage.setItem('fehluwe.save',JSON.stringify({
  version:4,scene:'estate',inventory:['invitation','torch','matches','notebook','frontKey'],
  flags:{leftHome:true},unlocked:['lock.door.front'],
  open:{'door.front':true,'door.entranceHall':true},
 }));
});
await page.reload();
await page.click('[data-cont]');
await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
for(const [name,stand,target] of views){
  const data=await page.evaluate(({stand,target})=>{
    const g=window.__game,w=g.world;
    g.running=false;if(g.ui.modalOpen)g.ui.closeModal();
    const y=stand.y??w.col.supportHeight(stand.x,stand.z,.15,.42);
    const yaw=Math.atan2(target[0]-stand.x,target[2]-stand.z);
    const pitch=Math.atan2(target[1]-(y+1.65),Math.hypot(target[0]-stand.x,target[2]-stand.z));
    const pose={x:stand.x,y,z:stand.z,yaw,pitch};
    g.player.setPose(pose);
    for(let i=0;i<12;i++)g.tick(1/30);
    g.player.setPose(pose);g.player.applyCamera(g.camera);
    w.updateCulling(g.camera.position,g.camera);
    for(const id of ['hud','stick','toast','debug']){
      const el=document.getElementById(id);if(el)el.style.display='none';
    }
    g.renderer.render(w.scene,g.camera);
    return {pose,room:w.hereRoom,calls:g.renderer.info.render.calls,
      triangles:g.renderer.info.render.triangles,glError:g.renderer.getContext().getError(),
      frontDoor:w.byId.has('door.front'),hallDoor:w.byId.has('door.entranceHall')};
  },{stand,target});
  results.push({name,...data});
  console.log('ENT_R02_R4_VIEW '+JSON.stringify({name,...data}));
  const img=await page.screenshot({path:output+'/'+name+'.jpg',type:'jpeg',quality:82,timeout:60000});
  if(process.env.ENT_R02_R4_THUMB==='1' &&
     ['gallery-ceiling-from-front','gallery-ceiling-from-rear','swallows-from-gallery','swallows-from-rear','old-new-gallery-wide','entrance-wide-return-right','gallery-wide-return-left','entrance-right-corner','gallery-right-corner','entrance-soffit'].includes(name))
    console.log('ENT_R02_R4_IMAGE_'+name+' '+img.toString('base64'));
}
const seals=await page.evaluate(()=>{
 const w=window.__game.world;
 const ray=(x,y,z0,z1)=>w.col.segmentBlocked(x,y,z0,x,y,z1);
 return {
  frontLeft:ray(88.8,.35,75.8,77.85),
  frontRight:ray(91.2,.35,75.8,77.85),
  floorAtNewGallery:Math.abs(w.col.supportHeight(90,78.2,3.35,.42)-3.35)<.05,
  floorAtOldGallery:Math.abs(w.col.supportHeight(90,81.4,3.35,.42)-3.35)<.05,
 };
});
const passed=errors.length===0 && results.every(x=>x.glError===0&&x.frontDoor&&x.hallDoor)
  && Object.values(seals).every(Boolean);
const report={passed,errors,seals,results,
 note:'ENT-R02 legacy upper-gallery draw/triangle exceptions deliberately measured, not used as a release-failing gate; see owner acceptance in ENT-R02.md'};
writeFileSync(output+'/results.json',JSON.stringify(report,null,2)+'\n');
console.log('ENT_R02_R4_RESULT '+JSON.stringify({passed,errors,seals,stats:results.map(x=>({view:x.name,calls:x.calls,triangles:x.triangles}))}));
if(!passed)process.exitCode=1;
}finally{await browser.close();await server.close();}
