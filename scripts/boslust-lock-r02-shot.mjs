// Temporary BOSLUST-R02 review capture: actual WebGL game build, not a concept render.
// Captures the closed and open lock using the existing game-state sync contract.
import { chromium } from 'playwright-core';
import { preview } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT='scripts/out/boslust-lock-r02';
mkdirSync(OUT,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:4173,strictPort:true}});
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
let page;
try {
  page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',err=>errors.push(String(err)));
  await page.goto('http://127.0.0.1:4173/Feh-Lu-We/?autotest=1&multidraw=0');
  await page.evaluate(()=>{
    const pose={x:64.65,y:0,z:16.53,yaw:0.14,pitch:-0.32};
    localStorage.setItem('fehluwe.save',JSON.stringify({
      version:4,scene:'estate',
      inventory:['invitation','torch','matches','notebook','frontKey','cipherStrip'],
      flags:{leftHome:true,routeRestored:true},
      unlocked:['lock.door.front'],open:{'door.front':true},
      clues:['c.routeRestored','c.letterstrook'],player:{home:null,estate:pose}
    }));
    localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'high'}));
  });
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
  await page.waitForTimeout(4000);
  const scene=await page.evaluate(()=>{
    const g=window.__game;
    // Recenter for a reproducible straight-on capture of the installed wall mount.
    g.player.x=64.65;g.player.z=16.53;g.player.y=0;
    g.player.yaw=0.14;g.player.pitch=-0.32;
    return {pose:g.player.pose(),hasLock:g.world.byId.has('boslust.lock'),meshes:g.world.byId.get('boslust.lock')?.obj.children.length};
  });
  await page.waitForTimeout(1200);
  await page.evaluate(()=>{
    const g=window.__game;
    g.state.flags.boslustCover=true;
    g.world.syncAll();
  });
  await page.waitForTimeout(1700);
  await page.screenshot({path:OUT+'/boslust-r02-open.png',timeout:120000});
  await page.evaluate(()=>{ const g=window.__game; g.state.flags.boslustCover=false; g.world.syncAll(); });
  await page.waitForTimeout(1200);
  await page.screenshot({path:OUT+'/boslust-r02-closed.png',timeout:120000});
  const after=await page.evaluate(()=>{
    const g=window.__game;
    return {pose:g.player.pose(),cover:g.state.flags.boslustCover,lock:g.world.byId.has('boslust.lock'),target:g.metrics().target,calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles};
  });
  writeFileSync(OUT+'/capture.json',JSON.stringify({scene,after,errors},null,2));
  if(!scene.hasLock||errors.length) throw Error(JSON.stringify({scene,errors}));
} finally {
  await browser.close();
  await new Promise(resolve=>server.httpServer.close(resolve));
}
