// Painting-atlas production regression probe. This is intentionally independent of release QA.
// It checks the actual rendered image, not only that a WebP file exists in the repo.
import { chromium } from 'playwright-core';
import { writeFileSync, mkdirSync } from 'node:fs';
const base=process.argv[2] ?? 'http://127.0.0.1:4188/Feh-Lu-We/';
const out=process.env.ART_PROBE_OUT ?? 'art-probe';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const RESULTS=[];
const assertMode=process.env.ART_PROBE_ASSERT==='1';
const injectFirst=process.env.ART_PROBE_INJECT_FIRST==='1';
const SAVE={version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],flags:{leftHome:true},unlocked:[],open:{}};
try {
 for(const suffix of ['','&batch=base']) {
  const ctx=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
  const page=await ctx.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text().slice(0,300));});
  page.on('requestfailed',r=>requests.push({url:r.url(),failure:r.failure()?.errorText}));
  page.on('response',r=>{if(r.status()>=400)requests.push({url:r.url(),status:r.status()});});
  const mode=suffix?'base':'default';
  if(injectFirst && mode==='default') {
    let intercepted=0;
    await page.route('**/flw-d2-atlas*.webp*', route => {
      if(intercepted++===0) return route.abort('failed');
      return route.continue();
    });
  }
  try{
   await page.goto(base+'?autotest=1'+suffix,{waitUntil:'domcontentloaded',timeout:45000});
   await page.evaluate(save=>localStorage.setItem('fehluwe.save',JSON.stringify(save)),SAVE);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.click('[data-cont]',{timeout:45000});
   await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:90000});
   // A release is not ready until the image, not merely its placeholder mesh, is loaded.
   // On a cold deployment a request may hang without firing onerror; retries must repair it.
   await page.waitForFunction(()=>{
     let ready=false;
     window.__game.world.scene.traverse(o=>{if(o.material?.userData?.flwAtlas && o.material.map?.image?.naturalWidth>4)ready=true});
     return ready;
   },null,{timeout:33000}).catch(()=>{});
   const sample=await page.evaluate(()=>{
    const g=window.__game,scene=g.world.scene,materials=new Set();
    scene.traverse(o=>{if(o.isMesh&&(o.material?.userData?.flwAtlas))materials.add(o.material)});
    const m=[...materials][0],img=m?.map?.image;
    g.running=false;
    const pose={x:114.08,y:0.15,z:99.7,yaw:Math.PI/2,pitch:0.096};
    g.player.setPose(pose);for(let i=0;i<30;i++)g.tick(1/30);
    g.player.setPose(pose);g.player.applyCamera(g.camera);
    g.world.updateCulling(g.camera.position,g.camera);
    const pos=new g.camera.position.constructor(115.56,2.0,-98.55);
    pos.project(g.camera);
    const px=Math.round((pos.x+1)*g.canvas.width/2),py=Math.round((1-pos.y)*g.canvas.height/2);
    g.renderer.render(scene,g.camera);
    const gl=g.renderer.getContext(),side=80,pixels=new Uint8Array(side*side*4);
    const x=Math.max(0,Math.min(g.canvas.width-side,px-side/2)),y=Math.max(0,Math.min(g.canvas.height-side,g.canvas.height-py-side/2));
    gl.readPixels(x,y,side,side,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    let n=0,sum=0,sum2=0,min=255,max=0;
    for(let row=10;row<70;row++)for(let col=10;col<70;col++){
     let i=(row*side+col)*4,v=.299*pixels[i]+.587*pixels[i+1]+.114*pixels[i+2];
     n++;sum+=v;sum2+=v*v;min=Math.min(min,v);max=Math.max(max,v);
    }
    const std=Math.sqrt(Math.max(0,sum2/n-(sum/n)**2));
    return {materials:materials.size,sourceImage:{width:img?.naturalWidth??img?.width??0,height:img?.naturalHeight??img?.height??0,complete:img?.complete??null,src:img?.src??null},atlasFlag:m?.userData,texVersion:m?.map?.version,renderer:{calls:g.renderer.info.render.calls,tris:g.renderer.info.render.triangles,glError:gl.getError()},pixel:{px,py,mean:sum/n,std,min,max},opaque:g.world.scene.userData.opaqueBatches,room:g.world.hereRoom,visibility:g.world.visibleRooms?Array.from(g.world.visibleRooms):[]};
   });
   await page.screenshot({path:out+'/'+mode+'.png'});
   RESULTS.push({mode,base,sample,errors,requests});console.log('ART_PROBE '+JSON.stringify(RESULTS.at(-1)));
  }catch(e){RESULTS.push({mode,base,error:String(e),errors,requests});console.error('ART_PROBE_FAILED '+JSON.stringify(RESULTS.at(-1)));}
  await ctx.close();
 }
}finally{writeFileSync(out+'/results.json',JSON.stringify(RESULTS,null,2));await browser.close();}
if(assertMode) {
 const failing=RESULTS.filter(r=>r.error || r.sample?.materials!==1 || r.sample?.sourceImage?.width!==2048 || r.sample?.sourceImage?.height!==960 || r.sample?.pixel?.std<8 || r.sample?.renderer?.glError!==0 || r.errors?.some(x=>x.startsWith('pageerror:')||x.includes('atlas failed after retries')));
 if(failing.length) { console.error('ART_PROBE_RELEASE_GATE_FAILED '+JSON.stringify(failing));process.exitCode=1; }
 else console.log('ART_PROBE_RELEASE_GATE_PASS all painting materials and real GPU pixels verified');
}

