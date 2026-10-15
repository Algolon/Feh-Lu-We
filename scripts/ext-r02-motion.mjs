import {preview} from 'vite';import {chromium} from 'playwright-core';import {mkdirSync,writeFileSync} from 'node:fs';
const out='docs/development/workstreams/ext-r02/qa';mkdirSync(out,{recursive:true});const server=await preview({preview:{host:'127.0.0.1',port:4220,strictPort:true}});
const browser=await chromium.launch({executablePath:'/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
try{const page=await browser.newPage({viewport:{width:915,height:412},hasTouch:true,isMobile:true});await page.goto('http://127.0.0.1:4220/Feh-Lu-We/?autotest=1');
await page.evaluate(()=>{localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low'}));localStorage.setItem('fehluwe.save',JSON.stringify({version:4,scene:'estate',inventory:['frontKey','consKey'],flags:{leftHome:true},unlocked:['lock.door.front','lock.door.consWest'],open:{'door.front':true}}));});await page.reload();await page.click('[data-cont]');await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
const result=await page.evaluate(()=>{
 const g=window.__game,w=g.world;g.running=false;g.settings.quality='low';g.applyQuality(true);if(g.ui.modalOpen)g.ui.closeModal();g.player.setPose({x:90,y:0,z:77.1,yaw:0,pitch:0});
 const door=w.byId.get('door.front'),samples=[];door.run();
 const draw=()=>{g.renderer.render(w.scene,g.camera);return{calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles};};
 const pixels=()=>{const gl=g.renderer.getContext(),p=new Uint8Array(g.canvas.width*g.canvas.height*4);gl.readPixels(0,0,g.canvas.width,g.canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,p);return p;};
 for(let i=0;i<6;i++){
  for(let j=0;j<3;j++)g.tick(1/30);
  w.scene.userData.opaqueBatches.enabled=false;draw();const native=draw(),a=pixels(),pick=g.pickAt(0,0)?.it?.id??null;
  w.scene.userData.opaqueBatches.enabled=true;draw();const packed=draw(),b=pixels();let changed=0;for(let j=0;j<a.length;j+=4)if(Math.max(Math.abs(a[j]-b[j]),Math.abs(a[j+1]-b[j+1]),Math.abs(a[j+2]-b[j+2]))>4)changed++;
  samples.push({i,angle:door.obj.rotation.y,native,packed,pixelMismatchFraction:changed/(a.length/4),samePick:pick===(g.pickAt(0,0)?.it?.id??null)});
 }
 // Dry perimeter of the pool, using the normal collision and movement path.
 g.player.setPose({x:118.5,y:.15,z:95,yaw:0,pitch:0});const route=[];
 for(const [x,z] of [[118.5,99.5],[118.5,103],[118.5,109.8],[121,110.4]]){g.autopilot={x,z,run:false};let n=0;while(Math.hypot(g.player.x-x,g.player.z-z)>.3&&n++<500)g.tick(1/30);draw();route.push({x,z,reached:Math.hypot(g.player.x-x,g.player.z-z)<.3,pose:g.player.pose()});}g.autopilot=null;
 return{samples,route,glError:g.renderer.getContext().getError(),moved:Math.abs(samples[0].angle-samples.at(-1).angle)>.2};
});writeFileSync(`${out}/motion.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(!result.moved||result.glError||result.samples.some(s=>!s.samePick||s.native.triangles!==s.packed.triangles||s.pixelMismatchFraction>.001)||result.route.some(r=>!r.reached))process.exitCode=1;
}finally{await browser.close();await server.close();}
