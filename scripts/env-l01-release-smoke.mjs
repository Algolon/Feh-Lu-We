// Bounded integration smoke: actual normal gameplay, transient phase inputs, isolated browser storage.
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const OUT=process.argv[2];if(!OUT)throw new Error('Explicit output directory required');mkdirSync(OUT,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:4195,strictPort:true}});
let browser;const rows=[],errors=[];
const fingerprint=()=>Object.fromEntries(readdirSync('dist/assets').filter(f=>f.endsWith('.js')).map(f=>[f,createHash('sha256').update(readFileSync('dist/assets/'+f)).digest('hex')]));
const before=fingerprint();
try {
 browser=await chromium.launch({executablePath:process.env.CHROME??'/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:915,height:412},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:4195/Feh-Lu-We/?autotest=1&phase=1&system=baseline&diagnostic=practicals');
 await page.waitForFunction(()=>!!window.__game,null,{timeout:30000});
 await page.evaluate(()=>{
  const s=structuredClone(window.__game.state);s.scene='estate';s.flags={leftHome:true};s.inventory=['frontKey','torch','matches','notebook'];s.unlocked=['lock.door.front'];s.open={'door.front':true};
  s.player.estate={x:63,y:0,z:11.5,yaw:0,pitch:.05};
  localStorage.setItem('fehluwe.save',JSON.stringify(s));localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low',reducedMotion:true}));
 });
 await page.reload();await page.click('[data-cont]');await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:60000});
 await page.evaluate(()=>{window.__game.running=false;});
 for(const [location,pose] of [['boslust',{x:63,y:0,z:11.5,yaw:0,pitch:.05}],['garden',{x:90,y:0,z:123,yaw:0,pitch:-.03}]]) {
  for(let i=0;i<4;i++) {
   const row=await page.evaluate(({pose,t})=>{
    const g=window.__game,e=g.extras.env;g.player.setPose(pose);g.player.y=g.world.col.supportHeight(pose.x,pose.z,.05,.42);
    for(let n=0;n<3;n++)g.tick(0);g.dusk=t;g.indoor=0;e.mode='baseline';e.preview=1-t;e.diagnostic='practicals';g.tick(0);
    g.renderer.render(g.world.scene,g.camera);
    const sky=g.world.scene.children.find(o=>o.material?.uniforms?.uCloudOpacity);
    return {t,hemi:e.hemi.intensity,sun:e.sun.intensity,cloud:sky.material.uniforms.uCloudOpacity.value,pilot:sky.material.uniforms.uPilot.value,fixture:e.fixtureGain,
     calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,pose:g.player.pose(),flags:JSON.stringify(g.state.flags),
     failures:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length,gl:g.renderer.getContext().getError(),quality:g.settings.quality,
     runControl:!!document.querySelector('[data-run]'),reviewPanel:!!document.getElementById('review-bar')};
   },{pose,t:i/3});
   if(row.pilot!==1||row.hemi<=.5||row.cloud<=0||row.reviewPanel||row.failures||row.gl|| (i>=2&&row.sun!==0))throw Error('Bad normal phase '+JSON.stringify(row));
   const file=process.env.CAPTURE==='1'?`${location}-${i}.jpg`:null;
   if(file)await page.screenshot({path:OUT+'/'+file,type:'jpeg',quality:86});rows.push({location,file,...row});console.log(JSON.stringify({location,t:row.t,hemi:row.hemi,sun:row.sun,failures:row.failures,gl:row.gl}));
  }
 }
 const cloudCheck=await page.evaluate(()=>{const g=window.__game,e=g.extras.env;const flags=JSON.stringify(g.state.flags);const before=[e.hemi.intensity,e.sun.intensity,...g.world.scene.fog.color.toArray()];e.clouds=false;g.tick(0);g.renderer.render(g.world.scene,g.camera);const sky=g.world.scene.children.find(o=>o.material?.uniforms?.uCloudOpacity);return {same:JSON.stringify(before)===JSON.stringify([e.hemi.intensity,e.sun.intensity,...g.world.scene.fog.color.toArray()]),opacity:sky.material.uniforms.uCloudOpacity.value,flagsSame:flags===JSON.stringify(g.state.flags)};});
 if(!cloudCheck.same||cloudCheck.opacity!==0||!cloudCheck.flagsSame)throw Error('Cloud switch changed gameplay');
 // Quality switch and portrait are additional renderer checks, not Android GPU emulation.
 await page.evaluate(()=>{const g=window.__game;g.settings.quality='high';g.applyQuality(true);g.tick(0);g.renderer.render(g.world.scene,g.camera);});
 await page.setViewportSize({width:412,height:733});
 const portrait=await page.evaluate(()=>{const g=window.__game;g.tick(0);g.renderer.render(g.world.scene,g.camera);return{aspect:g.camera.aspect,gl:g.renderer.getContext().getError(),failures:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length};});
 if(portrait.gl||portrait.failures||portrait.aspect>=1)throw Error('Portrait/quality failure');
 if(errors.length)throw Error(errors.join('\n'));
 writeFileSync(OUT+'/results.json',JSON.stringify({ok:true,conditions:'Actual normal game, software WebGL2/SwiftShader, coarse pointer, 915x412/412x733 DPR1; temporary controller dusk values, no completed puzzle flags changed. Not full E2E or physical Android performance.',before,after:fingerprint(),rows,cloudCheck,portrait,errors},null,2));
 console.log(JSON.stringify({ok:true,phases:rows.length,cloudCheck,portrait,errors}));
}finally{await browser?.close();await new Promise(r=>server.httpServer.close(r));}
