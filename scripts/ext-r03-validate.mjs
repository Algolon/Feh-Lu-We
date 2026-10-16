// Actual production renders, frozen-frame draw aggregation equivalence and collision-driven movement.
import {preview} from 'vite';import {chromium} from 'playwright-core';import {mkdirSync,writeFileSync} from 'node:fs';
const OUT=process.argv[2]??'docs/development/workstreams/ext-r03/after';mkdirSync(OUT,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:4219,strictPort:true}});
const browser=await chromium.launch({executablePath:process.env.CHROME??'/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const views=[['entrance',{x:90,z:75.8},[90,2.9,79.55]],['planter',{x:93,z:68.8},[90,.35,68]],['pediment-front',{x:90,z:70,y:6.9},[90,8.7,79.4]],['pediment-oblique',{x:94,z:74,y:7},[90,8.7,79.4]],['dormer-front',{x:78,z:75,y:6.6},[78,8.6,80.3]],['dormer-east',{x:114,z:88,y:6.7},[107.8,8.7,88]],['dormer-north',{x:102,z:116,y:6.7},[102,8.7,110]],['dormer-west',{x:66,z:98,y:6.7},[72,8.7,98]],['junction-near',{x:79.5,z:77.3,y:5.5},[78,7.05,80.3]],['roof-overview',{x:64,z:67,y:21},[90,9.4,95]],['roof-near',{x:78,z:77,y:10},[80,8.6,85]],['arrival',{x:90,z:55},[90,4.1,80]],['facade-near',{x:80.5,z:77.7},[79,2,80]],['garden',{x:90,z:127},[90,4.1,110]],['conservatory',{x:121,z:94},[114,1.8,100]],['east',{x:118,z:86},[108,3.1,88]]];
const results=[],contracts={},errors=[];
const checkpoint=()=>writeFileSync(`${OUT}/checkpoint.json`,JSON.stringify({results,contracts,errors},null,2));
try{
for(const variant of ['base','finish']){
 const ctx=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,hasTouch:true,isMobile:true});const page=await ctx.newPage();
 page.on('pageerror',e=>errors.push(`${variant}: ${e.message}`));page.on('console',m=>{if(m.type()==='error')errors.push(`${variant}: ${m.text()}`);});
 await page.goto(`http://127.0.0.1:4219/Feh-Lu-We/?autotest=1&finish=${variant}&batch=${variant==='base'?'base':'study'}`);
 await page.evaluate(()=>{localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low'}));localStorage.setItem('fehluwe.save',JSON.stringify({version:4,scene:'estate',inventory:['invitation','torch','matches','notebook','frontKey','consKey'],flags:{leftHome:true},unlocked:['lock.door.front','lock.door.consWest'],open:{'door.front':true}}));});
 await page.reload();await page.click('[data-cont]');await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});await page.evaluate(()=>{window.__game.running=false;});
 for(const [name,stand,target] of views.filter(v=>!process.env.VIEWS||process.env.VIEWS.split(',').includes(v[0]))){
  const row=await page.evaluate(({stand,target,check})=>{
   const g=window.__game,w=g.world;g.settings.quality='low';g.applyQuality(true);if(g.ui.modalOpen)g.ui.closeModal();
   const y=stand.y??w.col.supportHeight(stand.x,stand.z,.15,.42);const pose={x:stand.x,y,z:stand.z,yaw:Math.atan2(target[0]-stand.x,target[2]-stand.z),pitch:Math.atan2(target[1]-(y+1.65),Math.hypot(target[0]-stand.x,target[2]-stand.z))};
   g.player.setPose(pose);for(let i=0;i<15;i++)g.tick(1/30);g.player.setPose(pose);g.player.applyCamera(g.camera);w.updateCulling(g.camera.position,g.camera);
   for(const id of ['hud','stick','toast','debug']){const el=document.getElementById(id);if(el)el.style.display='none';}
   const render=()=>{g.renderer.render(w.scene,g.camera);return{calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles};};
   const read=()=>{const gl=g.renderer.getContext(),a=new Uint8Array(g.canvas.width*g.canvas.height*4);gl.readPixels(0,0,g.canvas.width,g.canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,a);return a;};
   let equivalence=null;
   if(check){
    const st=w.scene.userData.opaqueBatches;st.enabled=false;render();const original=render(),a=read();const pickA=g.pickAt(0,0)?.it?.id??null;
    const visibility=[];w.scene.traverse(o=>{if(o.isMesh&&!o.userData.opaqueAggregate)visibility.push([o,o.visible]);});
    st.enabled=true;render();const packed=render(),b=read();let pixelsOver4=0,maxError=0;
    for(let i=0;i<a.length;i+=4){let e=0;for(let c=0;c<3;c++)e=Math.max(e,Math.abs(a[i+c]-b[i+c]));if(e>4)pixelsOver4++;maxError=Math.max(maxError,e);}
    equivalence={original,packed,pixelsOver4,maxError,pixelMismatchFraction:pixelsOver4/(a.length/4),samePicking:pickA===(g.pickAt(0,0)?.it?.id??null),visibilityRestored:visibility.every(([o,v])=>o.visible===v),resources:{...st}};
   }
   const cost=render();return{pose,cost,equivalence,room:w.hereRoom,glError:g.renderer.getContext().getError(),failedShaders:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length};
  },{stand,target,check:variant==='finish'});
  results.push({variant,name,...row});checkpoint();await page.screenshot({path:`${OUT}/${variant}-${name}.jpg`,quality:86,timeout:60000});console.log(variant,name,JSON.stringify(row.cost),row.equivalence?`pixels=${row.equivalence.pixelsOver4}`:'');
 }
 contracts[variant]=await page.evaluate(()=>{
  const g=window.__game,w=g.world,reg=w.scene.userData.openings;
  const ids=[...w.byId.keys()].sort(),openings=Object.fromEntries(Object.entries(reg).map(([k,v])=>[k,v.map(r=>JSON.stringify(r)).sort()]));
  const heights=[];for(let z=62;z<81;z+=.5)for(const x of [85,86,87,88,90,92,94,95])heights.push(w.col.supportHeight(x,z,.16,.42));
  g.player.setPose({x:90,y:0,z:62,yaw:0,pitch:0});if(g.ui.modalOpen)g.ui.closeModal();const walk=[];
  for(const [x,z] of [[94.4,66],[94.4,74],[90,77.3],[90,81.5]]){g.autopilot={x,z,run:false};let n=0;while(Math.hypot(g.player.x-x,g.player.z-z)>.3&&n++<360)g.tick(1/30);g.renderer.render(w.scene,g.camera);walk.push({x,z,reached:Math.hypot(g.player.x-x,g.player.z-z)<.3,pose:g.player.pose()});}g.autopilot=null;
  return{ids,openings,heights,walk};
 });checkpoint();
 if(variant==='finish'){
  await page.setViewportSize({width:915,height:412});
  const sweep=await page.evaluate(()=>{
   const g=window.__game,w=g.world,rows=[];g.settings.quality='low';g.applyQuality(true);
   for(const [name,x,z,target] of [['garden',90,127,[90,4.1,110]],['conservatory',121,94,[114,1.8,100]],['east',118,86,[108,3.1,88]]]){
    g.player.setPose({x,y:w.col.supportHeight(x,z,.2,.42),z,yaw:Math.atan2(target[0]-x,target[2]-z),pitch:0});const yaw=g.player.yaw;
    for(let i=0;i<9;i++){g.player.yaw=yaw+(i-4)*.12;g.autopilot={x:x+(i<4?.4:-.4),z,run:false};for(let j=0;j<4;j++)g.tick(1/30);g.renderer.render(w.scene,g.camera);rows.push({name,i,calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,pose:g.player.pose()});}g.autopilot=null;
   }
   // A moving front-door leaf and repeated quality switches: no packed-object freeze or visibility leak.
   const door=w.byId.get('door.front'),states=[];
   g.player.setPose({x:90,y:0,z:77.3,yaw:0,pitch:0});
   for(const quality of ['low','high','low']){g.settings.quality=quality;g.applyQuality(true);g.state.open['door.front']=!g.state.open['door.front'];g.changed();for(let i=0;i<15;i++){g.tick(1/30);g.renderer.render(w.scene,g.camera);}states.push({quality,shaderFailures:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length,doorPresent:!!door});}
   return{rows,states};
  });contracts.sweep=sweep;checkpoint();
  await page.setViewportSize({width:412,height:915});await page.evaluate(()=>{const g=window.__game;g.player.setPose({x:82,y:0,z:66,yaw:-.14,pitch:.12});for(let i=0;i<12;i++)g.tick(1/30);g.renderer.render(g.world.scene,g.camera);});await page.screenshot({path:`${OUT}/finish-portrait.jpg`,quality:85,timeout:60000});
 }
 await ctx.close();
}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),finish=results.filter(r=>r.variant==='finish');
const validation={noErrors:!errors.length,functionalContractsUnchanged:same(contracts.base.ids,contracts.finish.ids)&&same(contracts.base.openings,contracts.finish.openings)&&same(contracts.base.heights,contracts.finish.heights),approachWalk:contracts.finish.walk.every(p=>p.reached),pixelEquivalent:finish.every(r=>r.equivalence.pixelMismatchFraction<.001),triangleEquivalent:finish.every(r=>r.equivalence.original.triangles===r.equivalence.packed.triangles),visibilityAndPicking:finish.every(r=>r.equivalence.samePicking&&r.equivalence.visibilityRestored),staticBudget:finish.every(r=>r.cost.calls<=150&&r.cost.triangles<=750000),movingBudget:contracts.sweep.rows.every(r=>r.calls<=150&&r.triangles<=750000),qualitySwitches:contracts.sweep.states.every(r=>r.doorPresent&&!r.shaderFailures)};
writeFileSync(`${OUT}/results.json`,JSON.stringify({results,contracts,validation,errors,note:'Software WebGL counters and elevated roof inspection shots; no physical-phone FPS/memory claim.'},null,2));console.log(JSON.stringify(validation));if(Object.values(validation).some(v=>!v))process.exitCode=1;
}finally{await browser.close();await server.close();}
