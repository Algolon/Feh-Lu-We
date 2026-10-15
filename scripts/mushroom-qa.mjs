import {createServer} from 'node:http';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright-core';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const out=process.env.OUT??'docs/mushroom-grove/evidence';mkdirSync(out,{recursive:true});
const exe=process.env.CHROME??'/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell';
const browser=await chromium.launch({executablePath:exe,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const server=createServer((req,res)=>{try{const path=resolve(process.env.DIST??'dist',decodeURIComponent(req.url.split('?')[0].replace(/^\/Feh-Lu-We\//,''))||'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'})[extname(path)]??'application/octet-stream');res.end(readFileSync(path));}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(4181,'127.0.0.1',r));
const base='http://127.0.0.1:4181/Feh-Lu-We/';
const tag=process.env.TAG??'feature';
const ctx=await browser.newContext({viewport:{width:1080,height:720},recordVideo:process.env.VIDEO?{dir:out,size:{width:1080,height:720}}:undefined});
const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'){errors.push(m.text());console.log('BROWSER',m.text());}});
await page.goto(base+'?autotest=1');
await page.evaluate(()=>localStorage.setItem('fehluwe.save',JSON.stringify({version:4,scene:'estate',inventory:['invitation','torch','matches','notebook','frontKey'],flags:{leftHome:true},unlocked:['lock.door.front']})));
await page.reload();await page.click('[data-cont]');await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
await page.evaluate(()=>{window.__game.running=false;});
await page.evaluate(readFileSync(new URL('./e2e-helpers.js',import.meta.url),'utf8'));
const views=[['outside',156,132,0.55,0],['approach',166,140,.55,0.04],['halfway',173,150,.55,.12],['entrance',177,156,.4,.12],['grove',181,161,0.2,.16],['return-view',181,163,-2.6,-.02],['exit',154,132,-1.9,0]];
const nurseryViews=process.env.NURSERY?await page.evaluate(()=>{
 const g=window.__game,data=g.world.scene.userData.mushrooms;
 const p=data.placements.find(p=>p.zone==='grove'&&p.x>data.centre.x+8&&p.z<data.centre.z);
 const look=(x,z,y)=>{const ground=g.world.col.ground(x,z);return [Math.atan2(p.x-x,p.z-z),Math.atan2(y-(ground+1.65),Math.hypot(p.x-x,p.z-z))];};
 const y=g.world.col.ground(p.x,p.z);
 return [['hero-base',p.x-4,p.z-4,...look(p.x-4,p.z-4,y+2.1)],['cluster-eye',p.x-2.5,p.z-2.7,...look(p.x-2.5,p.z-2.7,y+.7)],['grove-wide',177,155,.28,.05]];
}):[];
if(process.env.NURSERY)views.push(...nurseryViews);
if(process.env.EXPANSION)views.push(
 ['south-tree',184,151,Math.PI*.62,-.04],['east-fence',194,158,.15,-.02],
 ['north-fence',185,175,-Math.PI*.45,-.06],['northwest-birch',165,173,Math.PI*.55,-.05],
 ['west-trees',165,162,.6,.02]);
const rows=[];
if(process.env.EXPANSION){
 const baseline=JSON.parse(readFileSync('docs/mushroom-grove/r04-tree-survey.json','utf8'));
 const survey=await page.evaluate((baseline)=>{
  const g=window.__game,trees=g.world.scene.userData.vegPlan.trees;
  const retained=baseline.every(t=>trees.some(n=>n.x===t.x&&n.z===t.z&&n.species===t.species));
  const extra=g.world.scene.userData.mushrooms.placements.filter(p=>p.expansion);
  const overlap=extra.filter(p=>p.zone!=='young').filter(p=>trees.some(t=>Math.hypot(t.x-p.x,t.z-p.z)<1.05+p.scale*.55));
  return {retained,baselineTrees:baseline.length,extra:extra.length,adults:extra.filter(p=>p.zone!=='young').length,treeOverlaps:overlap.length};
 },baseline);
 if(!survey.retained||survey.treeOverlaps)throw new Error('expanded grove altered/overlapped existing trees');
 rows.push({expansionSurvey:survey});console.log('expansion',survey);
}
for(const quality of (process.env.QUALITY?[process.env.QUALITY]:['low','high']))for(const [name,x,z,yaw,pitch] of views.filter(v=>!process.env.CHECKS&&!process.env.CLIP&&!process.env.BENCH&&!process.env.FLOW&&(!process.env.VIEW||v[0]===process.env.VIEW))){
 const result=await page.evaluate(async ({x,z,yaw,pitch,quality,physical})=>{
  const g=window.__game;g.settings.quality=quality;g.applyQuality(true);
  const y=g.world.col.ground(x,z);g.player.setPose({x,y,z,yaw,pitch});
  for(let i=0;i<180;i++)g.tick(1/30);
  await new Promise(r=>setTimeout(r,200));
  if(physical)g.mushroomVision.intensity=0;
  let timing=[];for(let i=0;i<5;i++){const a=performance.now();g.tick(1/60);if(physical)g.mushroomVision.intensity=0;if(g.mushroomVision)g.mushroomVision.render(g.renderer,g.world.scene,g.camera,0,g.settings.reducedMotion,g.settings.mushroomDistortion,quality==='high');else g.renderer.render(g.world.scene,g.camera);const gl=g.renderer.getContext();gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(4));timing.push(performance.now()-a);}
  timing.sort((a,b)=>a-b);
  return {y,amount:g.mushroomVision?.intensity??0,calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,readbackMedianMs:timing[2],readbackMaxMs:timing[4],glError:g.renderer.getContext().getError(),room:g.world.hereRoom,overlap:g.world.col.overlaps(x,z,y,.3,1.75,.42)};
 },{x,z,yaw,pitch,quality,physical:!!process.env.PHYSICAL});
 console.log('rendered',result);if(result.overlap)throw new Error('Evidence pose overlaps collision: '+name);await page.screenshot({path:`${out}/${tag}-${quality}-${name}.jpg`,type:'jpeg',quality:85,timeout:120000});rows.push({quality,name,x,z,...result});console.log(JSON.stringify(rows.at(-1)));
}
if(tag==='feature'&&!process.env.CLIP&&!process.env.BENCH&&!process.env.FLOW&&!process.env.FLOW&&(!process.env.VIEW||process.env.CHECKS)){
 const checks=await page.evaluate(()=>{
  const g=window.__game;const y=g.world.col.ground(166,140);g.player.setPose({x:166,z:140,y,yaw:.5,pitch:0});T.tick(20);
  const before=JSON.stringify({flags:g.state.flags,clues:g.state.clues,inventory:g.state.inventory});
  const walked=T.walk([[172,149],[178,157],[181,162]]);T.wait(5);const peak=g.mushroomVision.intensity;
  const data=g.world.scene.userData.mushrooms;
  T.walk([[178,157],[172,149],[166,140],[160,135]]);T.wait(7);
  return {walked,peak,restored:g.mushroomVision.intensity,progressionUnchanged:before===JSON.stringify({flags:g.state.flags,clues:g.state.clues,inventory:g.state.inventory}),placements:data.placements.length,species:data.species};
 });console.log('checks',checks);rows.push({checks});if(checks.peak<.99||checks.restored!==0||!checks.progressionUnchanged)throw new Error('zone lifecycle failed');
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{const g=window.__game;g.player.setPose({x:181,z:161,y:g.world.col.ground(181,161),yaw:0,pitch:.1});g.settings.reducedMotion=true;g.settings.quality='low';g.applyQuality(true);T.wait(6);});
 await page.evaluate(()=>{const g=window.__game;g.mushroomVision.render(g.renderer,g.world.scene,g.camera,0,true,true,false);});
 await page.screenshot({path:`${out}/feature-mobile-reduced.jpg`,quality:85});
 await page.evaluate(()=>{window.__game.openPause();});
 await page.screenshot({path:`${out}/feature-mobile-settings.jpg`,quality:85});
 rows.push({lifecycle:await page.evaluate(async()=>{
  const g=window.__game,a=g.audio,p=g.mushroomVision;
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const render=()=>p.render(g.renderer,g.world.scene,g.camera,0,g.settings.reducedMotion,g.settings.mushroomDistortion,g.settings.quality==='high');
  const analyser=a.ctx.createAnalyser();analyser.fftSize=1024;a.master.connect(analyser);
  const rms=()=>{const data=new Float32Array(1024);analyser.getFloatTimeDomainData(data);return Math.sqrt(data.reduce((s,x)=>s+x*x,0)/data.length);};
  T.wait(1);await wait(1000);const pausedBus=a.groveBus.gain.value;
  g.ui.closeModal();T.wait(1);await wait(1800);const audible=rms(),insideBus=a.groveBus.gain.value;
  a.setMuted(true);await wait(600);const muted=rms();a.setMuted(false);
  const reduced={motion:p.uniforms.motion.value,distort:p.uniforms.distort.value,clock:p.uniforms.clock.value};
  g.settings.reducedMotion=false;g.settings.mushroomDistortion=false;render();const distortionDisabled=p.uniforms.distort.value===0;
  const gl=g.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');
  const renderer=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
  const gpuTimer=!!gl.getExtension('EXT_disjoint_timer_query_webgl2');
  g.player.setPose({x:160,z:135,y:g.world.col.ground(160,135),yaw:.5,pitch:0});T.wait(7);await wait(2400);
  const exitedBus=a.groveBus.gain.value,exitedIntensity=p.intensity;
  g.player.setPose({x:181,z:161,y:g.world.col.ground(181,161),yaw:0,pitch:.1});T.wait(6);await wait(1800);render();
  if(pausedBus>.01||insideBus<.1||audible<.00001||muted!==0||exitedBus>.03||exitedIntensity!==0||reduced.motion!==0||reduced.distort!==0||!distortionDisabled)throw new Error('audio/accessibility lifecycle failed');
  return {ready:a.ready,pausedBus,insideBus,exitedBus,exitedIntensity,audibleRms:audible,mutedRms:muted,voices:a.groveVoices.length,context:a.ctx.state,reduced,distortionDisabled,renderer,gpuTimer,target:[p.target.width,p.target.height],buffer:[gl.drawingBufferWidth,gl.drawingBufferHeight]};
 })});
 if(process.env.CHECKS){
  const lost=await page.evaluate(async()=>{const g=window.__game,ext=g.renderer.getContext().getExtension('WEBGL_lose_context');if(!ext)return {supported:false};ext.loseContext();await new Promise(r=>setTimeout(r,100));const shown=g.contextLost;ext.restoreContext();return {supported:true,shown};});
  await page.waitForTimeout(1000);
  lost.restored=await page.evaluate(()=>{const g=window.__game;g.tick(1/30);g.mushroomVision.render(g.renderer,g.world.scene,g.camera,0,false,true,false);return {lost:g.contextLost,glError:g.renderer.getContext().getError(),amount:g.mushroomVision.intensity};});rows.push({contextRecovery:lost});
 }
}
if(process.env.BENCH){
 await page.setViewportSize({width:915,height:412});
 for(const [name,x,z,yaw] of [['outside',156,132,.55],['grove',181,161,.2],['return',181,163,-2.6]]){
  const data=await page.evaluate(async({x,z,yaw})=>{
   const g=window.__game;g.settings.quality='low';g.applyQuality(true);g.player.setPose({x,z,y:g.world.col.ground(x,z),yaw,pitch:.05});T.wait(6);
   const gl=g.renderer.getContext(),ext=gl.getExtension('EXT_disjoint_timer_query_webgl2'),samples=[],intervals=[];let last=performance.now();
   for(let i=0;i<8;i++){
    await new Promise(requestAnimationFrame);const begin=performance.now();if(i>1)intervals.push(begin-last);last=begin;
    const q=ext?gl.createQuery():null;if(q)gl.beginQuery(ext.TIME_ELAPSED_EXT,q);
    g.tick(1/30);if(g.mushroomVision)g.mushroomVision.render(g.renderer,g.world.scene,g.camera,g.time,false,true,false);else g.renderer.render(g.world.scene,g.camera);
    if(q)gl.endQuery(ext.TIME_ELAPSED_EXT);
    gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(4));
    if(q){for(let j=0;j<20&&!gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE);j++)await new Promise(r=>setTimeout(r,20));if(gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE)&&!gl.getParameter(ext.GPU_DISJOINT_EXT)&&i>1)samples.push(gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6);gl.deleteQuery(q);}
   }
   samples.sort((a,b)=>a-b);intervals.sort((a,b)=>a-b);
   return {calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,gpuSoftwareMedianMs:samples.length?samples[Math.floor(samples.length/2)]:null,rafMedianMs:intervals[Math.floor(intervals.length/2)],rafFps:1000/intervals[Math.floor(intervals.length/2)],samples:samples.length,glError:gl.getError()};
  },{x,z,yaw});rows.push({name,...data});console.log(name,data);
 }
}
if(process.env.CLIP){
 const folder=out+'/clip-frames';mkdirSync(folder,{recursive:true});
 await page.setViewportSize({width:915,height:412});
 await page.evaluate(()=>{const g=window.__game;g.settings.quality='low';g.settings.reducedMotion=false;g.settings.mushroomDistortion=true;g.applyQuality(true);g.player.setPose({x:166,z:140,y:g.world.col.ground(166,140),yaw:.54,pitch:.04});g.mushroomVision.intensity=0;T.wait(1);});
 for(let i=0;i<25;i++){
  const waypoints=[[166,140],[172,149],[178,157],[181,162]],u=i/24*3,j=Math.min(2,Math.floor(u)),f=u-j;
  const x=waypoints[j][0]*(1-f)+waypoints[j+1][0]*f,z=waypoints[j][1]*(1-f)+waypoints[j+1][1]*f;
  await page.evaluate(({x,z})=>{const g=window.__game;T.walkTo(x,z);T.lookAt(183,5.5,168);T.wait(.15);g.mushroomVision.render(g.renderer,g.world.scene,g.camera,g.time,false,true,false);},{x,z});
  await page.screenshot({path:`${folder}/${String(i).padStart(3,'0')}.jpg`,quality:82,type:'jpeg'});
 }
}
if(process.env.FLOW){
 const folder=out+'/flow-frames';mkdirSync(folder,{recursive:true});
 await page.setViewportSize({width:915,height:412});
 const flow=await page.evaluate(()=>{
  const g=window.__game;g.settings.quality='low';g.settings.reducedMotion=false;g.settings.mushroomDistortion=true;g.applyQuality(true);
  g.player.setPose({x:181,z:161,y:g.world.col.ground(181,161),yaw:.2,pitch:.05});T.wait(6);
  g.mushroomVision.render(g.renderer,g.world.scene,g.camera,10,false,true,false);
  const clock=g.mushroomVision.uniforms.clock.value;
  g.mushroomVision.render(g.renderer,g.world.scene,g.camera,10,true,true,false);
  const reducedClock=g.mushroomVision.uniforms.clock.value;
  return {clockAtTenSeconds:clock,reducedClock,player:{x:g.player.x,z:g.player.z,yaw:g.player.yaw,pitch:g.player.pitch}};
 });
 if(flow.clockAtTenSeconds!==12||flow.reducedClock!==0)throw new Error('vision speed/reduced-motion contract failed');
 for(let i=0;i<13;i++){
  await page.evaluate(t=>{const g=window.__game;g.mushroomVision.render(g.renderer,g.world.scene,g.camera,t,false,true,false);},i*.5);
  await page.screenshot({path:`${folder}/${String(i).padStart(3,'0')}.jpg`,quality:85,type:'jpeg'});
 }
 rows.push({stationaryFlow:flow});
}
writeFileSync(`${out}/${tag}${process.env.CHECKS?'-checks':process.env.CLIP?'-clip':process.env.BENCH?'-bench':process.env.FLOW?'-flow':''}-metrics.json`,JSON.stringify({rows,errors},null,2));
console.log('errors',errors);await ctx.close();await browser.close();server.close();
if(errors.length)process.exitCode=1;
