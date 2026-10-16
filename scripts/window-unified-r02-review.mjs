// Unified window sash close-up regression: real rendered rooms, mobile portrait, low quality.
// Software WebGL detects obvious mesh errors but is not an Android GPU validation.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
const folder = 'docs/development/workstreams/window-fix-r02/review';
mkdirSync(folder,{recursive:true});
const server = await createServer({server:{host:'127.0.0.1',port:5173,strictPort:false}});
await server.listen();
const browser = await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const poses = [
  { id:'living-front', eye:[79,1.8,81.15], aim:[79,1.85,80.2] },
  { id:'living-oblique', eye:[79.35,1.8,81.2], aim:[79,1.85,80.2] },
  { id:'billiard-front', eye:[88,1.78,108.85], aim:[88,1.85,109.8] },
  { id:'billiard-oblique', eye:[88.35,1.78,108.86], aim:[88,1.85,109.8] },
  { id:'dining-front', eye:[106.85,1.8,86.8], aim:[107.8,1.85,86.8] },
  { id:'dining-oblique', eye:[106.85,1.8,87.15], aim:[107.8,1.85,86.8] },
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
  // All normal sashes must share one dedicated, uniform, untextured paint material.
  const sashMaterial = await page.evaluate(() => {
    const found = [];
    window.__game.world.scene.traverse(obj => {
      if (!obj.isMesh) return;
      const mats=Array.isArray(obj.material)?obj.material:[obj.material];
      for (const m of mats) if(m?.name==='WINDOW-FIX-R02-ConnectedSash'){
        const attr=obj.geometry.getAttribute('color');
        let differing=0;
        if(!attr)throw Error('Unified sash lacks vertex colours');
        const a=[attr.getX(0),attr.getY(0),attr.getZ(0)];
        for(let i=1;i<attr.count;i++)if(Math.abs(attr.getX(i)-a[0])>1e-6||
          Math.abs(attr.getY(i)-a[1])>1e-6||Math.abs(attr.getZ(i)-a[2])>1e-6)differing++;
        found.push({chunk:obj.userData.chunk,vertices:attr.count,differing,
          map:!!m.map,uuid:m.uuid});
      }
    });
    return found;
  });
  if(!sashMaterial.length||sashMaterial.some(v=>v.differing||v.map))
    throw Error('Window sash must use one uniform material: '+JSON.stringify(sashMaterial));
  console.log('WINDOW-R02 SASH '+JSON.stringify(sashMaterial));
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
    console.log('WINDOW-FIX-R02 '+JSON.stringify(stats));
  }
  if(errors.length)throw Error('Page errors: '+errors.join('; '));
  writeFileSync(folder+'/results.json',JSON.stringify({records,sashMaterial,errors,samsungVerified:false},null,2));
} finally { await browser.close();await server.close(); }
