// Isolated public-site smoke test; never reads a user's browser profile or save.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const expected=process.argv[2];if(!expected)throw new Error('Supply the deployed short commit');
const out='docs/development/workstreams/ext-r06/live';mkdirSync(out,{recursive:true});
const url=`https://algolon.github.io/Feh-Lu-We/?autotest=1&release=${expected}`;
const browser=await chromium.launch({executablePath:process.env.CHROME??'/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const errors=[];
try {
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const response=await page.goto(url,{waitUntil:'networkidle',timeout:120000});
 await page.evaluate(()=>{
  localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low'}));
  localStorage.setItem('fehluwe.save',JSON.stringify({version:4,scene:'estate',inventory:['invitation','torch','matches','notebook','frontKey'],flags:{leftHome:true},unlocked:['lock.door.front'],open:{'door.front':true}}));
 });
 await page.reload();await page.click('[data-cont]');await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
 const features=await page.evaluate(()=>{const keys=[],maps=[];window.__game.world.scene.traverse(o=>{if(o.isMesh)for(const m of (Array.isArray(o.material)?o.material:[o.material])){keys.push(m.customProgramCacheKey());if(m.map?.image)maps.push([m.map.image.width,m.map.image.height]);}});return{facadeWeather:keys.includes('ext-r06-local-weather'),dressedWeather:keys.includes('ext-r06-dressed-weather'),nameplateTexture:maps.some(([w,h])=>w===512&&h===192)};});
 const views=[];
 for(const [name,stand,target] of [['entrance',{x:85.8,z:74.5},[90,1.8,79.2]],['nameplate',{x:91.4,z:78.1},[91.4,1.62,79.49]],['garden',{x:90,z:127},[90,4.1,110]]]) {
  views.push(await page.evaluate(({name,stand,target})=>{
   const g=window.__game,w=g.world;g.running=false;if(g.ui.modalOpen)g.ui.closeModal();
   const y=w.col.supportHeight(stand.x,stand.z,.15,.42),pose={x:stand.x,y,z:stand.z,yaw:Math.atan2(target[0]-stand.x,target[2]-stand.z),pitch:Math.atan2(target[1]-(y+1.65),Math.hypot(target[0]-stand.x,target[2]-stand.z))};
   g.player.setPose(pose);for(let i=0;i<8;i++)g.tick(1/30);g.player.setPose(pose);g.player.applyCamera(g.camera);w.updateCulling(g.camera.position,g.camera);
   for(const id of ['hud','stick','toast','debug']){const el=document.getElementById(id);if(el)el.style.display='none';}
   g.renderer.render(w.scene,g.camera);
   return{name,calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,glError:g.renderer.getContext().getError(),failedShaders:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length,greeneryPresent:w.scene.children.some(o=>o.isMesh&&o.userData.chunk==='manor'&&o.material?.userData.surface==='foliage')};
  },{name,stand,target}));
  await page.screenshot({path:`${out}/${name}.jpg`,quality:88,timeout:60000});
 }
 await page.evaluate(()=>window.__game.openPause());const pause=await page.locator('body').innerText();
 const result={url,expected,status:response.status(),buildMatches:pause.includes(expected),features,views,errors,checkedAt:new Date().toISOString()};
 writeFileSync(`${out}/result.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 if(result.status!==200||!result.buildMatches||!Object.values(features).every(Boolean)||errors.length||views.some(v=>!v.greeneryPresent||v.glError||v.failedShaders||v.calls>150||v.triangles>750000))process.exitCode=1;
}finally{await browser.close();}
