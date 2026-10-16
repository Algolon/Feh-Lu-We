import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
// Exact fixed points and camera transforms matching WINDOW-R02 test (not full portal validation).
const poses = [
  {id:'south-ground',axis:'x',f:80.2,at:79,y:1.85,ext:-1},
  {id:'north-ground',axis:'x',f:109.8,at:88,y:1.85,ext:1},
  {id:'west-ground',axis:'z',f:72.2,at:97,y:1.85,ext:-1},
  {id:'east-ground',axis:'z',f:107.8,at:86.8,y:1.85,ext:1},
  {id:'south-upper',axis:'x',f:80.2,at:101.5,y:4.75,ext:-1},
  {id:'north-upper',axis:'x',f:109.8,at:98,y:4.75,ext:1},
  {id:'west-upper',axis:'z',f:72.2,at:90,y:4.75,ext:-1},
  {id:'east-upper',axis:'z',f:107.8,at:87,y:4.75,ext:1},
  {id:'wing-south',axis:'x',f:92.2,at:110,y:1.75,ext:-1},
  {id:'wing-north',axis:'x',f:109.8,at:112,y:1.75,ext:1},
];
const folder='docs/development/workstreams/window-r02/baseline';
mkdirSync(folder,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:5173,strictPort:false}});
await server.listen();
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const views=[],errors=[];
try {
  const page=await browser.newPage({viewport:{width:480,height:860},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(server.resolvedUrls.local[0]+'?autotest=1');
  await page.evaluate(()=>localStorage.setItem('fehluwe.save',JSON.stringify({version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],flags:{leftHome:true},unlocked:[],open:{}})));
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:150000});
  await page.evaluate(()=>{window.__game.running=false});
  for(const p of poses)for(const side of ['inside','outside']){
    const v=await page.evaluate(({p,side})=>{
      const g=window.__game,w=g.world;
      g.settings.quality='low';g.applyQuality(true);
      const nx=p.axis==='z'?p.ext:0,nz=p.axis==='x'?p.ext:0;
      const step=side==='outside'?.88:-.88;
      const atX=p.axis==='x'?p.at:p.f,atZ=p.axis==='x'?p.f:p.at;
      g.camera.position.set(atX+nx*step,p.y,-atZ-nz*step);
      g.camera.lookAt(atX,p.y,-atZ);
      g.camera.updateMatrixWorld(true);
      w.updateCulling(g.camera.position,g.camera);
      g.renderer.render(w.scene,g.camera);
      return {name:p.id,side,calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,glError:g.renderer.getContext().getError()};
    },{p,side});
    if(v.glError)throw Error(JSON.stringify(v));
    views.push(v);console.log('baseline',JSON.stringify(v));
  }
  if(errors.length)throw Error(errors.join('; '));
  writeFileSync(folder+'/results.json',JSON.stringify({views,errors,commit:'f5b27bcebaae42f0789e0694546e14d1a8ab4583'},null,2));
}finally{await browser.close();await server.close();}
