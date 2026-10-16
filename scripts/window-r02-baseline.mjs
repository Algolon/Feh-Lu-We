// Matched-pose PB01 baseline against the exact currently deployed production SHA.
// Launches PROD source (not candidate); avoids attributing new vegetation geometry to WINDOW-R02.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
const root = process.env.WINDOW_R02_BASELINE_ROOT;
if (!root) throw Error('WINDOW_R02_BASELINE_ROOT required');
const folder = 'docs/development/workstreams/window-r02/review';
mkdirSync(folder, { recursive:true });
const server = await createServer({root,server:{host:'127.0.0.1',port:5174,strictPort:true}});
await server.listen();
const browser=await chromium.launch({
  ...(process.env.CHROME ? {executablePath:process.env.CHROME} : {}),
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],
});
const poses=[
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
const results=[],errors=[];
try {
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
 for(const p of poses)for(const side of ['inside','outside']){
  const view=await page.evaluate(({p,side})=>{
   const g=window.__game,w=g.world;
   g.settings.quality='low';g.applyQuality(true);
   const nx=p.axis==='z'?p.ext:0,nz=p.axis==='x'?p.ext:0;
   const step=side==='outside'?.88:-.88;
   const x=p.axis==='x'?p.at:p.f,z=p.axis==='x'?p.f:p.at;
   g.camera.position.set(x+nx*step,p.y,-z-nz*step);
   g.camera.lookAt(x,p.y,-z);g.camera.updateMatrixWorld(true);
   w.updateCulling(g.camera.position,g.camera);
   g.renderer.render(w.scene,g.camera);
   return{id:p.id,side,calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,
     glError:g.renderer.getContext().getError()};
  },{p,side});
  if(view.glError!==0)throw Error('Baseline GL error '+JSON.stringify(view));
  results.push(view);console.log('PRODUCTION baseline',JSON.stringify(view));
 }
 if(errors.length)throw Error('Baseline page exceptions '+errors.join(';'));
 writeFileSync(folder+'/production-baseline.json',JSON.stringify({
  commit:'f5b27bcebaae42f0789e0694546e14d1a8ab4583',results,errors},null,2));
} finally {await browser.close();await server.close();}
