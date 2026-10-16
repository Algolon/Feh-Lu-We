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
 if(errors.length)throw Error('Browser errors: '+errors.join(';'));
 writeFileSync(folder+'/results.json',JSON.stringify({results,errors,samsungValidated:false},null,2));
}finally{await browser.close();await server.close();}
