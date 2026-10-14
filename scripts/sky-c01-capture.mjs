// Actual game's WebGL canvas, same scene/camera/LOD history. No composited concept art.
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const out=process.argv[2]; if(!out)throw Error('Explicit evidence output directory required');
mkdirSync(out,{recursive:true});
const quick=process.env.QUICK==='1';
const turnsOnly=process.env.TURNS_ONLY==='1';
const poses={
  sky:{x:90,y:0,z:123,yaw:116*Math.PI/180,pitch:.80},
  garden:{x:90,y:0,z:123,yaw:Math.PI,pitch:.22},
  arrival:{x:90,y:0,z:60,yaw:0,pitch:.22},
  woodland:{x:63,y:0,z:11.5,yaw:0,pitch:.30},
};
const fingerprints=()=>Object.fromEntries(readdirSync('dist/assets').filter(f=>f.endsWith('.js')||f.includes('sky-c01-cloud')).map(f=>[f,createHash('sha256').update(readFileSync('dist/assets/'+f)).digest('hex')]));
const sourceSHA=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const start=fingerprints(),rows=[],errors=[];
const server=await preview({preview:{host:'127.0.0.1',port:4206,strictPort:true}});
const browser=await chromium.launch({executablePath:process.env.CHROME??'/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:915,height:412},deviceScaleFactor:1,hasTouch:true,isMobile:true});
page.setDefaultTimeout(30000);
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
try {
  await page.goto('http://127.0.0.1:4206/Feh-Lu-We/?autotest=1&review=lighting');
  const sentinel={'fehluwe.save':'SKYC01-SAVE-SENTINEL','fehluwe.save.prev':'SKYC01-BACKUP-SENTINEL'};
  await page.evaluate(s=>Object.entries(s).forEach(([k,v])=>localStorage.setItem(k,v)),sentinel);
  await page.click('[data-review-start]');
  await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:60000});
  await page.evaluate(()=>{const g=window.__game;g.running=false;g.settings.reducedMotion=true;g.settings.quality='low';g.applyQuality(true);});
  // Compile all three first and wait for authored texture before any evidence.
  for(const v of ['production','procedural','masks']){
    await page.evaluate(v=>{const g=window.__game;g.extras.env.cloudVariant=v;g.tick(0);g.renderer.render(g.world.scene,g.camera);},v);
  }
  await page.waitForFunction(()=>window.__game.world.scene.children.find(o=>o.material?.uniforms?.uCloudAtlas)?.material.uniforms.uCloudAtlas.value?.image?.naturalWidth===1024);
  async function frame(name,t,variant,quality,layout,pose=poses[name],save=true){
    const data=await page.evaluate(({pose,t,variant,quality,save})=>{
      const g=window.__game,e=g.extras.env;
      g.settings.quality=quality;g.applyQuality(true);g.player.setPose(pose);
      g.player.y=g.world.col.supportHeight(pose.x,pose.z,pose.y+.05,.42);
      e.mode='pilot';e.preview=t;e.cloudVariant=variant;e.clouds=true;
      for(let i=0;i<50;i++)g.tick(1/30);
      e.update(t,g.camera.position,g.world.hereRoom==='out'?0:1);
      const gl=g.renderer.getContext();
      for(let i=0;i<4;i++)g.renderer.render(g.world.scene,g.camera);
      const sky=g.world.scene.children.find(o=>o.material?.uniforms?.uZenith);
      const light={sun:e.sun.intensity,hemi:e.hemi.intensity,sunColor:e.sun.color.toArray(),hemiColor:e.hemi.color.toArray(),earth:e.hemi.groundColor.toArray(),fog:g.world.scene.fog.color.toArray(),near:g.world.scene.fog.near,far:g.world.scene.fog.far,fixture:e.fixtureGain,exposure:g.renderer.toneMappingExposure};
      // Synchronous render+encode avoids the unreliable browser compositor screenshot stage.
      g.renderer.render(g.world.scene,g.camera);
      const jpeg=save?g.renderer.domElement.toDataURL('image/jpeg',.91).split(',')[1]:null;
      const debug=gl.getExtension('WEBGL_debug_renderer_info');
      return{jpeg,pose:g.player.pose(),camera:g.camera.position.toArray(),fov:g.camera.fov,aspect:g.camera.aspect,pixelRatio:g.renderer.getPixelRatio(),calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,textures:g.renderer.info.memory.textures,light,
        renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),glError:gl.getError(),shaderFailures:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length,opacity:sky.material.uniforms.uCloudOpacity.value};
    },{pose,t,variant,quality,save});
    const file=`${name}-${Math.round(t*3)}-${layout}-${quality}-${variant}.jpg`;
    if(data.jpeg)writeFileSync(out+'/'+file,Buffer.from(data.jpeg,'base64'));
    delete data.jpeg;rows.push({file:save?file:null,name,t,variant,quality,layout,...data});
    console.log(file,data.calls,data.triangles);
  }
  for(const layout of turnsOnly?[]:quick?['landscape']:['landscape','portrait']){
    await page.setViewportSize(layout==='portrait'?{width:412,height:915}:{width:915,height:412});
    for(const name of quick?['sky','arrival']:Object.keys(poses))for(const t of quick?[0]:[0,1/3,2/3,1])for(const variant of ['production','procedural','masks'])await frame(name,t,variant,'low',layout);
  }
  const performance=[];
  if(!quick){
    await page.setViewportSize({width:915,height:412});
    if(!turnsOnly)for(const t of [0,1])for(const variant of ['production','procedural','masks'])await frame('arrival',t,variant,'high','landscape');
    // Wide turn: check across azimuth +/-pi and the north seam, no equirectangular repeat.
    for(const yaw of [0,90,180,270,359.9,.1])for(const variant of ['production','procedural','masks'])await frame('turn-'+yaw,0,variant,'low','landscape',{...poses.sky,yaw:yaw*Math.PI/180,pitch:.55});
    // Balanced rotated ordering reduces a simple time/order bias. Full-scene and isolated sky cost.
    if(!turnsOnly)for(const scope of ['scene','sky-only'])for(let round=0;round<3;round++)for(const variant of [['production','procedural','masks'],['masks','production','procedural'],['procedural','masks','production']][round]){
      const p=await page.evaluate(({scope,variant,pose})=>{
        const g=window.__game,e=g.extras.env;g.settings.quality='low';g.applyQuality(true);g.player.setPose(pose);e.preview=0;e.cloudVariant=variant;
        for(let i=0;i<30;i++)g.tick(1/30);e.update(0,g.camera.position,0);
        const gl=g.renderer.getContext(),pixel=new Uint8Array(4),sky=g.world.scene.children.find(o=>o.material?.uniforms?.uZenith);
        const visibility=g.world.scene.children.map(o=>o.visible);
        if(scope==='sky-only')g.world.scene.children.forEach(o=>{if(o!==sky)o.visible=false;});
        const times=[];
        try{for(let i=0;i<12;i++){const start=performance.now();g.renderer.render(g.world.scene,g.camera);gl.finish();gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);if(i>=5)times.push(performance.now()-start);}}
        finally{g.world.scene.children.forEach((o,i)=>o.visible=visibility[i]);}
        return{times,calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,glError:gl.getError()};
      },{scope,variant,pose:poses.arrival});
      performance.push({scope,variant,round,...p});console.log('timing',scope,variant,round);
    }
  }
  const isolation=await page.evaluate(s=>{const g=window.__game;const before=JSON.stringify(g.state);g.saveNow();return{saveIntact:Object.entries(s).every(([k,v])=>localStorage.getItem(k)===v),stateIntact:before===JSON.stringify(g.state),flags:g.state.flags};},sentinel);
  writeFileSync(out+'/measurements.json',JSON.stringify({sourceSHA,start,end:fingerprints(),browser:browser.version(),conditions:'Three.js game canvas JPEG; WebGL2 ANGLE SwiftShader. DPR1 touch/mobile viewport 915x412 or 412x915; Low cap1, High cap1.5. Fixed poses/phase/room blend; settled same-world LOD. Timings GPU-synchronized software wall times, NOT Samsung FPS. 5 warmup + 7 samples per round, 3 rotated rounds.',rows,performance,isolation,errors},null,2));
  if(errors.length||rows.some(r=>r.glError||r.shaderFailures)||!isolation.saveIntact||!isolation.stateIntact||JSON.stringify(start)!==JSON.stringify(fingerprints()))throw Error('Render/save/build validation failed');
  for(const r of rows){const peers=rows.filter(x=>x.name===r.name&&x.t===r.t&&x.quality===r.quality&&x.layout===r.layout&&JSON.stringify(x.pose)===JSON.stringify(r.pose));if(peers.some(x=>JSON.stringify(x.light)!==JSON.stringify(r.light)||x.calls!==r.calls||x.triangles!==r.triangles))throw Error('Matched variant light/geometry parity failed '+r.file);}
}finally{await browser.close();await new Promise(r=>server.httpServer.close(r));}
