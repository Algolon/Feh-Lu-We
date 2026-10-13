// Fixed-pose real game captures; sky on/off comparisons share one loaded world and lighting.
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const OUT = process.argv[2]; if (!OUT) throw new Error('Explicit output directory required');
mkdirSync(OUT, { recursive: true });
const poses = {
  boslust: { x:63, y:0, z:11.5, yaw:0, pitch:0.05 },
  garden: { x:90, y:0, z:123, yaw:0, pitch:-0.03 },
  sky: { x:90, y:0, z:123, yaw:0, pitch:0.50 },
  sun: { x:90, y:0, z:123, yaw:245*Math.PI/180, pitch:47*Math.PI/180 },
  afternoonSun: { x:90, y:0, z:123, yaw:245*Math.PI/180, pitch:24*Math.PI/180 },
  hall: { x:90, y:0.15, z:84.6, yaw:0, pitch:0.05 },
};
const fingerprint = () => Object.fromEntries(readdirSync('dist/assets').filter(f=>f.endsWith('.js')).map(f=>[f,createHash('sha256').update(readFileSync('dist/assets/'+f)).digest('hex')]));
const before = fingerprint(), rows=[], errors=[];
const server = await preview({preview:{host:'127.0.0.1',port:4193,strictPort:true}});
const browser = await chromium.launch({executablePath:process.env.CHROME??'/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:915,height:412},deviceScaleFactor:1,hasTouch:true,isMobile:true});
page.on('pageerror',e=>errors.push(e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
async function capture(name,t,clouds=true,quality='low',portrait=false,system='pilot') {
  await page.setViewportSize(portrait?{width:412,height:915}:{width:915,height:412});
  const row=await page.evaluate(({pose,t,clouds,quality,system})=>{
    const g=window.__game,e=g.extras.env;
    g.settings.quality=quality;g.settings.reducedMotion=true;g.applyQuality(true);
    g.player.setPose(pose);g.player.y=g.world.col.supportHeight(pose.x,pose.z,pose.y+0.05,0.42);
    e.mode=system;e.preview=t;e.clouds=clouds;
    for(let i=0;i<90;i++)g.tick(1/30);
    // Pin the room blend for paired stills; do not compare residual doorway smoothing history.
    e.update(t,g.camera.position,g.world.hereRoom==='out'?0:1);
    for(const id of ['hud','toast','stick','review-bar','debug'])document.getElementById(id)?.style.setProperty('visibility','hidden');
    const gl=g.renderer.getContext(),pixel=new Uint8Array(4),times=[];
    for(let i=0;i<4;i++)g.renderer.render(g.world.scene,g.camera);
    for(let i=0;i<3;i++){const start=performance.now();g.renderer.render(g.world.scene,g.camera);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);times.push(performance.now()-start);}
    const sky=g.world.scene.children.find(o=>o.isMesh && o.material.type==='ShaderMaterial' && o.material.uniforms.uZenith);
    const dbg=gl.getExtension('WEBGL_debug_renderer_info');
    return {pose:g.player.pose(),camera:g.camera.position.toArray(),fov:g.camera.fov,room:g.world.hereRoom,calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,
      sun:e.sun.intensity,hemi:e.hemi.intensity,shadowPass:e.sun.castShadow,cloudOpacity:sky.material.uniforms.uCloudOpacity.value,
      fog:{near:g.world.scene.fog.near,far:g.world.scene.fog.far},softwareTimesMs:times,glError:gl.getError(),
      renderer:dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),
      shaderFailures:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length};
  },{pose:poses[name],t,clouds,quality,system});
  const file=`${name}-${Math.round(t*3)}-${clouds?'clouds':'clear'}-${quality}-${portrait?'portrait':'landscape'}-${system}.jpg`;
  await page.screenshot({path:OUT+'/'+file,type:'jpeg',quality:90});rows.push({file,name,t,clouds,quality,portrait,system,...row});console.log(file,row.calls,row.triangles);
}
try {
  await page.goto('http://127.0.0.1:4193/Feh-Lu-We/?autotest=1&review=lighting&clouds=0');
  const sentinel={'fehluwe.save':'SKY-OWNER-SAVE','fehluwe.save.prev':'SKY-OWNER-BACKUP','fehluwe.settings':JSON.stringify({quality:'low'})};
  await page.evaluate(s=>{for(const [k,v] of Object.entries(s))localStorage.setItem(k,v);},sentinel);
  await page.reload();await page.click('[data-review-start]');await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:180000});
  await page.evaluate(()=>{window.__game.running=false;});
  if(await page.evaluate(()=>window.__game.extras.env.clouds))throw new Error('clouds=0 ignored');
  await page.click('[data-toggle]');await page.check('[data-clouds]');
  if(!await page.evaluate(()=>window.__game.extras.env.clouds))throw new Error('Cloud checkbox did not update environment');
  for(const name of ['boslust','garden','sky'])for(const t of [0,1/3,2/3,1])await capture(name,t);
  for(const t of [0,1]){await capture('garden',t,false);await capture('garden',t,true,'low',true);await capture('boslust',t,true,'high');}
  await capture('sun',0);await capture('sun',0,false);
  await capture('afternoonSun',1/3);
  await capture('hall',1);await capture('hall',1,false);
  await capture('garden',1,false,'low',false,'baseline');await capture('garden',1,true,'low',false,'baseline');
  const isolation=await page.evaluate(s=>{
    const g=window.__game;g.saveNow();
    return {saveIntact:Object.entries(s).every(([k,v])=>localStorage.getItem(k)===v),solved:Object.keys(g.state.flags).filter(k=>g.state.flags[k] && k!=='leftHome' && !k.startsWith('visited.'))};
  },sentinel);
  if(!isolation.saveIntact||isolation.solved.length)throw new Error('Review changed persistent or puzzle state');
  const pairs=rows.filter(r=>!r.clouds).map(off=>{const on=rows.find(r=>r.name===off.name&&r.t===off.t&&r.system===off.system&&r.quality===off.quality&&r.portrait===off.portrait&&r.clouds);return{off:off.file,on:on?.file,sameCounters:!!on&&on.calls===off.calls&&on.triangles===off.triangles,sameLight:!!on&&on.sun===off.sun&&on.hemi===off.hemi};});
  writeFileSync(OUT+'/measurements.json',JSON.stringify({before,after:fingerprint(),browser:browser.version(),conditions:'Real Three.js game, ANGLE SwiftShader WebGL2. DPR1; 915x412 FOV68 / 412x915 FOV82; coarse pointer; torch off; same-world paired cloud toggles. Three GPU-synchronized timings after four warmup renders; not physical Android FPS.',rows,pairs,isolation,errors},null,2));
  if(pairs.some(p=>!p.sameCounters||!p.sameLight))throw new Error('Cloud toggle changed geometry or world light');
  if(errors.length||rows.some(r=>r.shaderFailures||r.glError)||JSON.stringify(before)!==JSON.stringify(fingerprint()))throw new Error('Rendering errors / mutable build');
} finally {await browser.close();await new Promise(r=>server.httpServer.close(r));}
