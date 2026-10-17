// LIGHT-R07 — isolate global player-dependent environment on a fixed camera.
// Compare indoor parameter 0 vs 1 without moving player/camera, toggling lamps,
// changing culling/geometry, or editing any production renderer code.
// Run: npm run preview -- --port 4188, node scripts/light-r07-env-qa.mjs
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const output='light-r07-env-evidence';
mkdirSync(output,{recursive:true});
const base=process.argv[2]??'http://127.0.0.1:4188/Feh-Lu-We/';
const browser=await chromium.launch({headless:true,args:[
  '--use-angle=swiftshader','--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist','--disable-dev-shm-usage'
]});
const page=await browser.newPage({viewport:{width:960,height:540},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push('page: '+e.message));
page.on('console',e=>{if(e.type()==='error')errors.push('console: '+e.text())});

const save={version:4,scene:'estate',
  inventory:['invitation','torch','matches','notebook'],
  lit:{'fire.living':true,'lamp.livingFloor':true},
  flags:{leftHome:true},unlocked:[],open:{}};
const scenes=[
  {id:'hall-facing-living',p:{x:87,z:88.5,y:.15,yaw:-Math.PI/2}},
  {id:'living-middle',p:{x:80.5,z:86.7,y:.15,yaw:-Math.PI/2}},
  {id:'hall-facing-dining',p:{x:97,z:87,y:.15,yaw:Math.PI/2}},
  {id:'kitchen',p:{x:101.8,z:96.3,y:.15,yaw:0}},
  {id:'library',p:{x:80.5,z:100.5,y:.15,yaw:Math.PI}},
  {id:'outside-front',p:{x:90,z:77,y:.15,yaw:0}}
];
try{
  await page.goto(base+'?autotest=1',{waitUntil:'domcontentloaded'});
  await page.evaluate(s=>{
    localStorage.setItem('fehluwe.save',JSON.stringify(s));
    localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low',reducedMotion:true}));
  },save);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('[data-cont]').click({timeout:45000});
  await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
  await page.evaluate(()=>{
    const g=window.__game;
    g.running=false;
    g.settings.quality='low';
    g.settings.reducedMotion=true;
    g.applyQuality(true);
  });
  const all=[];
  for(const scene of scenes){
    for(const phase of [0,0.65]){
      const measures=await page.evaluate(({pose,phase})=>{
        const g=window.__game,w=g.world,env=g.extras.env,renderer=g.renderer;
        g.player.setPose({...pose,pitch:0});
        g.player.applyCamera(g.camera);
        w.updateCulling(g.camera.position,g.camera);
        // Prepare geometry/LOD once. Keep the scene and source states frozen
        // between two samples. PointLights are forced off for BOTH.
        g.tick(.05);
        const old=g.pool.lights.map(l=>l.intensity);
        g.pool.lights.forEach(l=>l.intensity=0);
        const gl=renderer.getContext();
        const view={w:gl.drawingBufferWidth,h:gl.drawingBufferHeight};
        const samples=[];
        const copyPixels=()=>{
          const pixels=new Uint8Array(view.w*view.h*4);
          gl.readPixels(0,0,view.w,view.h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
          return pixels;
        };
        for(const indoor of [0,1]){
          env.update(phase,g.camera.position,indoor);
          renderer.render(w.scene,g.camera);
          const px=copyPixels();
          let sum=0,n=0;
          // Ignore HUD edges and sample a consistent fixed camera ROI.
          for(let y=Math.floor(view.h*.24);y<Math.floor(view.h*.77);y++){
            for(let x=Math.floor(view.w*.24);x<Math.floor(view.w*.76);x++){
              const i=(y*view.w+x)*4;
              sum+=px[i]*.2126+px[i+1]*.7152+px[i+2]*.0722;n++;
            }
          }
          samples.push({
            indoor,roiLum:sum/n,pixels:px,
            sun:env.sun.intensity,hemi:env.hemi.intensity,
            sunColor:'#'+env.sun.color.getHexString(),
            hemiSky:'#'+env.hemi.color.getHexString(),
            hemiEarth:'#'+env.hemi.groundColor.getHexString(),
            fogNear:w.scene.fog?.near,fogFar:w.scene.fog?.far,
            calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,
          });
        }
        let absolute=0,over5=0,max=0,count=0;
        const [a,b]=samples;
        for(let y=Math.floor(view.h*.24);y<Math.floor(view.h*.77);y++){
          for(let x=Math.floor(view.w*.24);x<Math.floor(view.w*.76);x++){
            const i=(y*view.w+x)*4;
            const la=a.pixels[i]*.2126+a.pixels[i+1]*.7152+a.pixels[i+2]*.0722;
            const lb=b.pixels[i]*.2126+b.pixels[i+1]*.7152+b.pixels[i+2]*.0722;
            const d=Math.abs(la-lb);
            absolute+=d; if(d>5)over5++;max=Math.max(max,d);count++;
          }
        }
        // Return lightweight summary. Source camera and scene were held fixed.
        for(const s of samples)delete s.pixels;
        g.pool.lights.forEach((l,i)=>l.intensity=old[i]);
        return {
          actualRoom:w.hereRoom,
          view,
          states:samples,
          signedRoiChange:b.roiLum-a.roiLum,
          roiMeanAbsDelta:absolute/count,
          roiPctPixelsChangedOver5:over5/count*100,
          roiMaxDelta:max,
          fixedCamera:pose,
          phase,
        };
      },{pose:scene.p,phase});
      all.push({id:scene.id,...measures});
      if(phase===0 && ['hall-facing-living','living-middle','kitchen'].includes(scene.id)){
        for(const indoor of [0,1]){
          await page.evaluate(({phase,indoor})=>{
            const g=window.__game;
            const old=g.pool.lights.map(x=>x.intensity);
            g.pool.lights.forEach(x=>x.intensity=0);
            g.extras.env.update(phase,g.camera.position,indoor);
            g.renderer.render(g.world.scene,g.camera);
            g.pool.lights.forEach((x,i)=>x.intensity=old[i]);
          },{phase,indoor});
          // Screenshot of the exact fixed pose; only global environment changes.
          await page.screenshot({path:output+'/'+scene.id+'-env'+indoor+'.jpg',type:'jpeg',quality:84});
        }
      }
      console.log('LIGHT_R07_ENV '+JSON.stringify({
        id:scene.id,phase,room:measures.actualRoom,
        delta:+measures.signedRoiChange.toFixed(3),
        meanAbs:+measures.roiMeanAbsDelta.toFixed(3),
        over5:+measures.roiPctPixelsChangedOver5.toFixed(2),
        sun:measures.states.map(x=>+x.sun.toFixed(3)),
        hemi:measures.states.map(x=>+x.hemi.toFixed(3)),
        fog:measures.states.map(x=>[+x.fogNear.toFixed(2),+x.fogFar.toFixed(2)])
      }));
    }
  }
  // This is deliberately a proof of the conditional world render, not an
  // architectural approval. Detect if the test accidentally stops exercising
  // the indoor-dependent global sun/hemi/fog logic.
  if(!all.some(x=>x.roiMeanAbsDelta>2))throw Error('no measurable environment effect: invalid diagnostic');
  if(errors.length)throw Error(errors.slice(0,3).join(' | '));
  writeFileSync(output+'/results.json',JSON.stringify({commit:process.env.GITHUB_SHA??null,all,errors},null,2));
  console.log('LIGHT_R07_VERDICT '+JSON.stringify({
    cases:all.length,meanAbsMax:Math.max(...all.map(x=>x.roiMeanAbsDelta)),
    maxSigned:Math.max(...all.map(x=>Math.abs(x.signedRoiChange))),
    errors
  }));
}finally{await browser.close();}
