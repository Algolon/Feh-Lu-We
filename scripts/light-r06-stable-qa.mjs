// LIGHT-R06: actual-scene state-bound base-light preview.
// Same scene, same camera and physical PointLights forced OFF for both profiles.
// The baseline has no independent ambient lamp layer. The pilot does.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const profile = process.env.LIGHT_R06_PROFILE || 'pilot';
const root = process.argv[2] || 'http://127.0.0.1:4188/Feh-Lu-We/';
const output = 'light-r06-qa/'+profile;
mkdirSync(output,{recursive:true});
const browser = await chromium.launch({headless:true,args:[
  '--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage'
]});
const page=await browser.newPage({viewport:{width:915,height:412},deviceScaleFactor:1});
const errors=[];
page.on('pageerror', e=>errors.push('page:'+e.message));
page.on('console', e=>{if(e.type()==='error')errors.push('console:'+e.text())});
const SAVE={version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],
 lit:{'fire.living':true,'lamp.livingFloor':true},flags:{leftHome:true},unlocked:[],open:{}};
const suffix=profile==='pilot'?'&stableLiving=1&noPoint=1':'';
const url=root+'?autotest=1'+suffix;
try {
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.evaluate(s=>{
   localStorage.setItem('fehluwe.save',JSON.stringify(s));
   localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low',reducedMotion:true}));
 },SAVE);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('[data-cont]').click({timeout:45000});
 await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
 await page.evaluate(()=>{const g=window.__game;g.running=false;g.settings.quality='low';g.applyQuality(true);});
 const capture = async(key,pose,lit) => {
  const result=await page.evaluate(({pose,lit})=>{
    const g=window.__game;
    g.state.lit['fire.living']=lit.fire;
    g.state.lit['lamp.livingFloor']=lit.floor;
    g.changed();
    g.player.setPose({...pose,y:.15,pitch:0});
    for(let i=0;i<40;i++)g.tick(.05);
    // The baseline also runs the same no-PointLight ablation as the pilot:
    // isolate how much geometry receives logical-source light independently.
    const old=g.pool.lights.map(l=>l.intensity);
    g.pool.lights.forEach(l=>{l.intensity=0;});
    g.renderer.render(g.world.scene,g.camera);
    const gl=g.renderer.getContext();
    const xy=[Math.floor(gl.drawingBufferWidth*.36),Math.floor(gl.drawingBufferHeight*.3)];
    const size=[Math.floor(gl.drawingBufferWidth*.28),Math.floor(gl.drawingBufferHeight*.34)];
    const bytes=new Uint8Array(size[0]*size[1]*4);
    gl.readPixels(xy[0],xy[1],size[0],size[1],gl.RGBA,gl.UNSIGNED_BYTE,bytes);
    let luminance=0;
    for(let i=0;i<bytes.length;i+=4)luminance+=bytes[i]*.2126+bytes[i+1]*.7152+bytes[i+2]*.0722;
    const pilot=g.world.scene.userData.stableLiving||null;
    const out={room:g.world.hereRoom,luminance:luminance/(bytes.length/4),calls:g.renderer.info.render.calls,
      triangles:g.renderer.info.render.triangles,pointLights:g.pool.lights.length,
      pointIntensity:0,pilotState:pilot?.state?.()??null,
      cpuProbe:pilot?.contribution?.(76,.9,-86.7)??null};
    g.pool.lights.forEach((l,i)=>l.intensity=old[i]);
    return out;
  },{pose,lit});
  await page.screenshot({path:output+'/'+key+'.jpg',type:'jpeg',quality:78,timeout:120000});
  return {key,...result};
 };
 const samples=[];
 for(const [id,pose] of [
  ['hall-view',{x:84.2,z:86.7,yaw:-Math.PI/2}],
  ['living-close',{x:78.8,z:86.7,yaw:-Math.PI/2}],
  ['living-middle',{x:80.5,z:86.7,yaw:-Math.PI/2}],
  ['floorlamp',{x:82.3,z:84.3,yaw:-Math.PI/2}]
 ]) {
   samples.push(await capture(id+'-both-on',pose,{fire:true,floor:true}));
   samples.push(await capture(id+'-both-off',pose,{fire:false,floor:false}));
 }
 const saved=await page.evaluate(()=>{
   const g=window.__game;g.state.lit['fire.living']=false;g.state.lit['lamp.livingFloor']=true;g.changed();
   return g.world.scene.userData.stableLiving?.state?.() ?? null;
 });
 // QA: physical PointLights were always removed during the render; the pilot
 // still distinguishes a logically lit from an unlit fireplace/floor-lamp.
 if(profile==='pilot'){
   if(samples.some(s=>!s.pilotState||s.pilotState.length!==2))throw Error('shader pilot state missing');
   for(let i=0;i<samples.length;i+=2){
     const on=samples[i],off=samples[i+1];
     if(on.luminance<=off.luminance+.25)throw Error('state-bound light made no visible difference at '+on.key+
       ', on='+on.luminance+',off='+off.luminance);
     if(on.pilotState[0]<=0||on.pilotState[1]<=0||off.pilotState.some(v=>v!==0))
       throw Error('base shader did not follow the logical lamp state');
   }
   if(!saved||saved[0]!==0||saved[1]<=0)throw Error('independent on/off toggles not preserved');
 }else{
   if(samples.some(s=>s.pilotState!==null))throw Error('baseline unexpectedly installed shader pilot');
 }
 const result={profile,samples,saved,errors};
 console.log('LIGHT_R06_SUMMARY '+JSON.stringify(result));
 writeFileSync(output+'/results.json',JSON.stringify(result,null,2));
 if(errors.length)throw Error(errors.join('; ').slice(0,400));
}finally{await browser.close();}
