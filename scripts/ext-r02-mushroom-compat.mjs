import {preview} from 'vite';
import {chromium} from 'playwright-core';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='docs/development/workstreams/ext-r02/mushroom-compat';mkdirSync(out,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:4222,strictPort:true}});
const browser=await chromium.launch({executablePath:'/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
try {
 const page=await browser.newPage({viewport:{width:915,height:412}});
 await page.goto('http://127.0.0.1:4222/Feh-Lu-We/?autotest=1');
 await page.evaluate(()=>{localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low'}));localStorage.setItem('fehluwe.save',JSON.stringify({version:4,scene:'estate',inventory:['frontKey'],flags:{leftHome:true},unlocked:['lock.door.front']}));});
 await page.reload();await page.click('[data-cont]');await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
 const results=await page.evaluate(()=>{
  const g=window.__game,w=g.world;g.running=false;const rows=[];
  const read=()=>{const gl=g.renderer.getContext(),p=new Uint8Array(g.canvas.width*g.canvas.height*4);gl.readPixels(0,0,g.canvas.width,g.canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,p);return p;};
  for(const [name,x,z,yaw] of [['outside',156,132,.55],['approach',173,150,.55],['grove',181,161,.2],['return',181,163,-2.6]]){
   g.player.setPose({x,z,y:w.col.ground(x,z),yaw,pitch:.1});for(let i=0;i<180;i++)g.tick(1/30);
   const render=()=>{g.mushroomVision.render(g.renderer,w.scene,g.camera,g.time,false,true,false);return{calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles};};
   w.scene.userData.opaqueBatches.enabled=false;render();const native=render(),a=read();const pick=g.pickAt(0,0)?.it?.id??null;
   w.scene.userData.opaqueBatches.enabled=true;render();const packed=render(),b=read();let changed=0;for(let i=0;i<a.length;i+=4)if(Math.max(...[0,1,2].map(c=>Math.abs(a[i+c]-b[i+c])))>4)changed++;
   rows.push({name,intensity:g.mushroomVision.intensity,native,packed,pixelMismatchFraction:changed/(a.length/4),samePicking:pick===(g.pickAt(0,0)?.it?.id??null),glError:g.renderer.getContext().getError()});
  }
  return rows;
 });
 await page.screenshot({path:`${out}/return.jpg`,quality:85});
 writeFileSync(`${out}/batch-equivalence.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results));
 if(results.some(r=>r.glError||!r.samePicking||r.native.triangles!==r.packed.triangles||r.pixelMismatchFraction>.001||r.packed.calls>150||r.packed.triangles>750000))process.exitCode=1;
} finally {await browser.close();await server.close();}
