// Window/ceiling overlap regression: real rendered rooms, mobile portrait, low quality.
// Software WebGL detects obvious mesh errors but is not an Android GPU validation.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
const folder = 'docs/development/workstreams/window-fix-r01/review';
mkdirSync(folder,{recursive:true});
const server = await createServer({server:{host:'127.0.0.1',port:5173,strictPort:false}});
await server.listen();
const browser = await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const poses = [
  { id:'living-west-sill', eye:[74.05,1.53,83], aim:[72.2,0.97,83] },
  { id:'living-south-sill', eye:[79,1.55,82.35], aim:[79,1.03,80.2] },
  { id:'billiard-window', eye:[90.4,1.6,107.3], aim:[90.4,1.47,109.8] },
  { id:'billiard-ceiling', eye:[90.5,1.7,106.1], aim:[88.4,3.13,107.3] },
  { id:'dining-window', eye:[105.5,1.6,86.8], aim:[107.8,1.23,86.8] },
  { id:'dining-beams', eye:[101.3,1.7,86.2], aim:[101.3,3.13,89.2] },
];
const records=[], errors=[];
try {
  const page=await browser.newPage({viewport:{width:480,height:860},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(server.resolvedUrls.local[0]+'?autotest=1');
  await page.evaluate(()=>localStorage.setItem('fehluwe.save',JSON.stringify({
    version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],
    flags:{leftHome:true},unlocked:[],open:{}
  })));
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:150000});
  await page.evaluate(()=>{ window.__game.running=false; });
  for(const p of poses) {
    const stats=await page.evaluate(p=>{
      const g=window.__game,w=g.world;
      g.settings.quality='low';g.applyQuality(true);
      g.camera.position.set(p.eye[0],p.eye[1],-p.eye[2]);
      g.camera.lookAt(p.aim[0],p.aim[1],-p.aim[2]);
      g.camera.updateMatrixWorld(true);w.updateCulling(g.camera.position,g.camera);
      g.renderer.render(w.scene,g.camera);
      return {id:p.id,calls:g.renderer.info.render.calls,
        triangles:g.renderer.info.render.triangles,glError:g.renderer.getContext().getError()};
    },p);
    if(stats.glError!==0)throw Error('WebGL error '+JSON.stringify(stats));
    await page.screenshot({path:`${folder}/${p.id}.jpg`,type:'jpeg',quality:90});
    records.push(stats);
    console.log('OVERLAP-R01 '+JSON.stringify(stats));
  }
  if(errors.length)throw Error('Page errors: '+errors.join('; '));
  writeFileSync(folder+'/results.json',JSON.stringify({records,errors,samsungVerified:false},null,2));
} finally { await browser.close();await server.close(); }
