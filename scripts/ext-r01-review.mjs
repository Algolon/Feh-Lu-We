// Paired production-build evidence. Software WebGL counts are not physical-phone FPS evidence.
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const out=process.argv[2]??'docs/development/workstreams/ext-r01-rollout';
mkdirSync(out,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:4217,strictPort:true}});
const browser=await chromium.launch({executablePath:process.env.CHROME??'/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const roofReview=process.env.ROOF_REVIEW==='1';
const views=[
 ['roof-overview',{x:64,z:67,y:21},[90,9.4,95]],
 ['roof-near',{x:78,z:77,y:10},[80,8.6,85]],
 ['arrival',{x:90,z:55},[90,4.1,80]],
 ['facade-court',{x:82,z:66},[80,3.2,80]],
 ['window-near',{x:80.5,z:77.7},[79,2.0,80]],
 ['corner',{x:67,z:76},[74,3,84]],
 ['west-return',{x:67,z:87},[72,3,86]],
 ['paving',{x:96,z:76},[90,.25,74.5]],
 ['driveway',{x:90.5,z:42},[90,1.3,65]],
 ['garden-facade',{x:90,z:127},[90,4.1,110]],
 ['east-facade',{x:118,z:86},[108,3.1,88]],
 ['service-wing',{x:121,z:94},[114,1.8,100]],
];
const rows=[],errors=[],contracts={};
try {
for(const variant of ['base','study']) {
 const ctx=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await ctx.newPage();
 page.on('pageerror',e=>errors.push(`${variant}: ${e.message}`));
 page.on('console',m=>{if(m.type()==='error')errors.push(`${variant}: ${m.text()}`);});
 await page.goto(`http://127.0.0.1:4217/Feh-Lu-We/?autotest=1&exterior=${roofReview?'study':variant}${roofReview?'&roof='+variant:''}`);
 await page.evaluate(()=>{
 localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low'}));
 localStorage.setItem('fehluwe.save',JSON.stringify({version:4,scene:'estate',inventory:['invitation','torch','matches','notebook','frontKey'],flags:{leftHome:true},unlocked:['lock.door.front'],open:{'door.front':true}}));
 });
 await page.reload();await page.click('[data-cont]');
 await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
 for(const [name,stand,target] of views.filter(v=>!process.env.VIEWS||process.env.VIEWS.split(',').includes(v[0]))) {
   const row=await page.evaluate(async({stand,target})=>{
     const g=window.__game;
     g.settings.quality='low';g.applyQuality(true);
     g.player.setPose({x:stand.x,y:stand.y??0,z:stand.z,yaw:0,pitch:0});
     g.player.y=stand.y??g.world.col.supportHeight(stand.x,stand.z,.15,.42);
     g.player.yaw=Math.atan2(target[0]-stand.x,target[2]-stand.z);
     g.player.pitch=Math.atan2(target[1]-(g.player.y+1.65),Math.hypot(target[0]-stand.x,target[2]-stand.z));
     for(let i=0;i<20;i++){g.tick(1/30);if(stand.y!==undefined)g.player.y=stand.y;}
     for(const id of ['hud','stick','toast','debug']) {const el=document.getElementById(id);if(el)el.style.display='none';}
     const costs=[];
     for(let i=0;i<4;i++){g.tick(1/30);if(stand.y!==undefined){g.player.y=stand.y;g.player.applyCamera(g.camera);}g.renderer.render(g.world.scene,g.camera);costs.push({calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles});}
     const programs=g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length;
     return {room:g.world.hereRoom,costs,shaderFailures:programs,glError:g.renderer.getContext().getError(),shadows:g.renderer.shadowMap.enabled};
   },{stand,target});
   await page.screenshot({path:`${out}/${variant}-${name}.jpg`,quality:86});
   rows.push({variant,name,...row});
   console.log(variant,name,JSON.stringify(row.costs[0]));
 }
 // Narrow and wide phone viewports, plus actual collision-driven approach around the planter.
 await page.evaluate(()=>{const g=window.__game;g.player.setPose({x:82,y:0,z:66,yaw:-.14,pitch:.12});for(let i=0;i<12;i++)g.tick(1/30);});
 await page.setViewportSize({width:412,height:915});
 await page.screenshot({path:`${out}/${variant}-portrait.jpg`,quality:85});
 await page.setViewportSize({width:915,height:412});
 const phone=await page.evaluate(()=>{const g=window.__game;g.player.setPose({x:82,y:0,z:66,yaw:-.14,pitch:.12});for(let i=0;i<12;i++)g.tick(1/30);g.renderer.render(g.world.scene,g.camera);return{calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles};});
 rows.push({variant,name:'phone-landscape',costs:[phone]});
 await page.screenshot({path:`${out}/${variant}-phone-landscape.jpg`,quality:86});
 contracts[variant]=await page.evaluate(()=>{
  const g=window.__game,w=g.world;
  const ids=[...w.byId.keys()].sort();
  const supports=[];for(let z=62;z<81;z+=.5)for(const x of [85,86,87,88,90,92,94,95])supports.push(w.col.supportHeight(x,z,.16,.42));
  g.settings.quality='high';g.applyQuality(true);g.tick(1/30);g.renderer.render(w.scene,g.camera);
  const registry=w.scene.userData.openings;
  const openings=Object.fromEntries(Object.entries(registry).map(([key,items])=>[key,items.map(row=>JSON.stringify(row)).sort()]));
  // Move through the existing collider system. Path skirts the planter; it crosses the new apron and steps.
  g.settings.quality='low';g.applyQuality(true);if(g.ui.modalOpen)g.ui.closeModal();
  g.player.setPose({x:90,y:0,z:62,yaw:0,pitch:0});
  const route=[];
  for(const [x,z] of [[94.4,66],[94.4,74],[90,77.3],[90,81.5]]) {
    g.autopilot={x,z,run:false};let ticks=0;
    while(Math.hypot(g.player.x-x,g.player.z-z)>.3&&ticks++<360)g.tick(1/30);
    route.push({x,z,reached:Math.hypot(g.player.x-x,g.player.z-z)<.3,pose:g.player.pose()});
  }
  g.autopilot=null;
  return {ids,supports,openings,route,highShaderFailures:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length};
 });
 await ctx.close();
}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const validation={interactionIdsUnchanged:same(contracts.base.ids,contracts.study.ids),supportHeightsUnchanged:same(contracts.base.supports,contracts.study.supports),openingContractsUnchanged:same(contracts.base.openings,contracts.study.openings),highShadersOk:!contracts.study.highShaderFailures,approachWalkPassed:contracts.study.route.every(p=>p.reached),renderBudgetPassed:rows.every(r=>r.costs.every(c=>c.calls<=150&&c.triangles<=750000))};
writeFileSync(`${out}/views.json`,JSON.stringify({rows,errors,validation,routes:{base:contracts.base.route,study:contracts.study.route},scope:roofReview?'Roof-only comparison; both exterior=study, control roof=base; overview/near use elevated inspection poses.':'Whole manor facade rollout and revised entrance paving; low-quality software rendering, physical mobile validation pending'},null,2));
console.log(JSON.stringify(validation));
if(errors.length||Object.values(validation).some(v=>!v)||rows.some(r=>r.shaderFailures||r.glError||r.shadows))process.exitCode=1;
} finally {await browser.close();await server.close();}
