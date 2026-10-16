// WINDOW-R03 real game browser QA for the ONE structurally valid attic roof window.
// Both views test culling/visibility through the exact same sloped opening.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { mkdirSync,writeFileSync } from 'node:fs';
const folder='docs/development/workstreams/window-r03/review';
mkdirSync(folder,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:5173,strictPort:false}});
await server.listen();
const browser=await chromium.launch({
 ...(process.env.CHROME?{executablePath:process.env.CHROME}:{}),
 args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],
});
const results=[],errors=[];
try{
 const page=await browser.newPage({viewport:{width:480,height:860},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(server.resolvedUrls.local[0]+'?autotest=1');
 await page.evaluate(()=>localStorage.setItem('fehluwe.save',JSON.stringify({
  version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],
  flags:{leftHome:true},unlocked:[],open:{},
 })));
 await page.reload();await page.click('[data-cont]');
 await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:150000});
 await page.evaluate(()=>{window.__game.running=false});
 for(const position of ['inside','outside']){
  const res=await page.evaluate(position=>{
   const g=window.__game,w=g.world;
   g.settings.quality='low';g.applyQuality(true);
   const eye=position==='inside'?[101.15,8.45,96.3]:[106.0,10.0,96.3];
   const centre=[102.3,9.65,96.3];
   g.camera.position.set(eye[0],eye[1],-eye[2]);
   g.camera.lookAt(centre[0],centre[1],-centre[2]);
   g.camera.updateMatrixWorld(true);
   w.updateCulling(g.camera.position,g.camera);
   g.renderer.render(w.scene,g.camera);
   const target=position==='inside'?'out':'atticLookout';
   return {position,here:w.hereRoom,target,targetVisible:w.visibleRooms.has(target),
    glassPortals:w.rooms.portals.filter(p=>p.a==='atticLookout'&&p.b==='out'&&p.kind==='window'&&p.seeThrough).length,
    calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,
    glError:g.renderer.getContext().getError()};
  },position);
  if(res.glassPortals!==1||!res.targetVisible||res.glError!==0)
   throw Error('WINDOW-R03 failed pitched-pane visibility: '+JSON.stringify(res));
  results.push(res);
  await page.screenshot({path:`${folder}/attic-roof-${position}.jpg`,type:'jpeg',quality:92});
  console.log('roof window',JSON.stringify(res));
 }
 // Cottage: seven real panes with physical glass and unobstructed visual rays.
 const cottage=await page.evaluate(()=>{
   const w=window.__game.world;
   const portals=w.rooms.portals.filter(p=>p.kind==='window'&&p.seeThrough
     && ['cottageEntry','cottageRoom'].includes(p.a));
   let solid=0,clear=0;
   for(const p of portals){
     const a=p.aperture,ext=(a.axis==='x'?(a.z<161?-1:1):(a.x<25?-1:1));
     const sx=a.x+(a.axis==='z'?-ext*.25:0),sz=a.z+(a.axis==='x'?-ext*.25:0);
     const tx=a.x+(a.axis==='z'?ext*.25:0),tz=a.z+(a.axis==='x'?ext*.25:0);
     if(w.col.segmentBlocked(sx,a.y,sz,tx,a.y,tz))solid++;
     if(!w.col.segmentBlocked(sx,a.y,sz,tx,a.y,tz,w.visualPassThrough))clear++;
   }
   return {portals:portals.length,solid,clear};
 });
 if(cottage.portals!==7||cottage.solid!==7||cottage.clear!==7)
   throw Error('Cottage pane test failed: '+JSON.stringify(cottage));
 const cottageViews=[];
 for(const pose of [
   {id:'south',axis:'x',at:22.2,f:157.15,ext:-1},
   {id:'north',axis:'x',at:22.5,f:164.85,ext:1},
   {id:'west',axis:'z',at:162.3,f:20.15,ext:-1},
   {id:'east',axis:'z',at:162.6,f:29.85,ext:1},
 ])for(const side of ['inside','outside']){
   const capture=await page.evaluate(({pose,side})=>{
     const g=window.__game,w=g.world;
     g.settings.quality='low';g.applyQuality(true);
     const nx=pose.axis==='z'?pose.ext:0,nz=pose.axis==='x'?pose.ext:0;
     const x=pose.axis==='x'?pose.at:pose.f,z=pose.axis==='x'?pose.f:pose.at;
     const step=side==='outside'?.72:-.72;
     g.camera.position.set(x+nx*step,5.5,-z-nz*step);
     g.camera.lookAt(x,5.5,-z);
     g.camera.updateMatrixWorld(true);
     w.updateCulling(g.camera.position,g.camera);
     g.renderer.render(w.scene,g.camera);
     const target=side==='inside'?'out':
       w.rooms.portals.find(p=>p.kind==='window'&&p.seeThrough&&p.aperture?.x===x
          &&p.aperture?.z===z)?.a??'missing';
     return {id:pose.id,side,here:w.hereRoom,target,visible:w.visibleRooms.has(target),
       calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,
       glError:g.renderer.getContext().getError()};
   },{pose,side});
   if(!capture.visible||capture.glError!==0)
     throw Error('Cottage in-game sightline failed '+JSON.stringify(capture));
   cottageViews.push(capture);
   await page.screenshot({path:`${folder}/cottage-${pose.id}-${side}.jpg`,type:'jpeg',quality:90});
   console.log('cottage window',JSON.stringify(capture));
 }
 if(errors.length)throw Error('Browser errors: '+errors.join(';'));
 writeFileSync(folder+'/results.json',JSON.stringify({results,cottage,cottageViews,errors,samsungValidated:false},null,2));
}finally{await browser.close();await server.close();}
