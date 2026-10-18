// LIGHT-R08 LIVE gate: real Chromium/WebGL on the compiled ordinary game.
// Verify steady lighting is ON by DEFAULT, source-independent in hall+library,
// family saves remain isolated, and ?stableRooms=0 provides a quick rollback.
// Chromium SwiftShader is not a physical Android GPU timing test.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const inputBase=process.argv[2]??'http://127.0.0.1:4188/Feh-Lu-We/';
const URLROOT=inputBase.endsWith('/')?inputBase:inputBase+'/';
const quality=process.env.LIGHT_R08_LIVE_QUALITY??'low';
const portrait=process.env.LIGHT_R08_LIVE_PORTRAIT==='1';
const out='light-r08-live-evidence/'+quality+(portrait?'-portrait':'-landscape');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--use-angle=swiftshader','--enable-unsafe-swiftshader',
 '--ignore-gpu-blocklist','--disable-dev-shm-usage'
]});
const page=await browser.newPage({viewport:portrait?{width:412,height:915}:{width:915,height:412},deviceScaleFactor:1});
const issues=[],missing=[];
page.on('pageerror',e=>issues.push('page '+e.message));
page.on('console',e=>{if(e.type()==='error')issues.push('console '+e.text());});
page.on('response',r=>{if(r.status()>=400&&r.url().includes('/Feh-Lu-We/'))missing.push(r.status()+' '+r.url());});
const initial={
 version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],
 lit:{'fire.living':true,'lamp.livingFloor':true,'lamp.hallChandelier':true,
 'lamp.hallConsole':true,'lamp.libraryChandelier':true,'lamp.library':true},
 flags:{leftHome:true},unlocked:[],open:{'door.livLib':false,'door.library':false}
};
const states=[];
const boot=async(path,saveKey)=>{
 const address=URLROOT+path+(path.includes('?')?'&':'?')+'autotest=1';
 const response=await page.goto(address,{waitUntil:'domcontentloaded',timeout:45000});
 if(!response?.ok())throw Error('Route not accessible: '+address+' / '+response?.status());
 await page.evaluate(({key,state,quality})=>{
   localStorage.setItem(key,JSON.stringify(state));
   const prefix=key.slice(0,-5);
   localStorage.setItem(prefix+'.settings',JSON.stringify({quality,reducedMotion:true}));
 },{key:saveKey,state:initial,quality});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('[data-cont]').click({timeout:45000});
 await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
 await page.evaluate(q=>{const g=window.__game;g.running=false;g.settings.quality=q;g.settings.reducedMotion=true;g.applyQuality(true);},quality);
 return address;
};
const stat=()=>page.evaluate(()=>{
 const g=window.__game,w=g.world;
 return {
   state:w.scene.userData.stableRooms?.state?.()??null,
   living:w.scene.userData.stableLiving?.state?.()??null,
   scope:w.scene.userData.stableScope??null,
   familyEdition:g.familyEdition??null,
   poolBudget:g.pool.lights.length,
   assigned:g.pool.assigned?.()??null,
   storage:{main:localStorage.getItem('fehluwe.save')!=null,
     family:localStorage.getItem('fehluwe.family.save')!=null}
 };
});
// Freeze ONE rendered scene and compare light OFF/ON without advancing game
// time, player position, visibility, global indoor mix, or the dynamic pool.
async function measurePair(id,pose,source){
 const pair=await page.evaluate(({pose,source})=>{
   const g=window.__game,w=g.world;
   const sourceIds=['lamp.hallChandelier','lamp.hallConsole','lamp.libraryChandelier','lamp.library'];
   const savedLit=Object.fromEntries(sourceIds.map(id=>[id,g.state.lit[id]]));
   g.player.setPose({...pose,pitch:pose.pitch??0});
   g.player.applyCamera(g.camera);
   w.updateCulling(g.camera.position,g.camera);
   for(let i=0;i<3;i++)g.tick(.05);
   const pool=g.pool.lights,prior=pool.map(l=>l.intensity);
   pool.forEach(l=>l.intensity=0);
   const renderer=g.renderer,gl=renderer.getContext();
   // Global lighting is a separately known variable: hold it constant
   // while measuring the source contribution across the same exact pixels.
   g.extras.env.update(0,g.camera.position,1);
   const W=gl.drawingBufferWidth,H=gl.drawingBufferHeight;
   const x0=Math.floor(W*.22),x1=Math.floor(W*.78),y0=Math.floor(H*.22),y1=Math.floor(H*.78);
   const read=active=>{
     for(const id of sourceIds)g.state.lit[id]=id===source?active:false;
     g.changed();
     renderer.render(w.scene,g.camera);
     renderer.render(w.scene,g.camera);
     const pixels=new Uint8Array(W*H*4);
     gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
     let lum=0,n=0;
     for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
       const i=(y*W+x)*4;
       lum+=pixels[i]*.2126+pixels[i+1]*.7152+pixels[i+2]*.0722;n++;
     }
     return {pixels,luminance:lum/n,states:w.scene.userData.stableRooms?.state?.()??null,
       calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,
       programs:renderer.info.programs?.length??null,glError:gl.getError()};
   };
   try{
      const off=read(false),on=read(true);
      let delta=0,maxDelta=0,count=0,changed=0;
      for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
        const i=(y*W+x)*4;
        const a=off.pixels[i]*.2126+off.pixels[i+1]*.7152+off.pixels[i+2]*.0722;
        const b=on.pixels[i]*.2126+on.pixels[i+1]*.7152+on.pixels[i+2]*.0722;
        const d=Math.abs(b-a);
        delta+=d;maxDelta=Math.max(maxDelta,d);if(d>2)changed++;count++;
      }
      return {off:{...off,pixels:undefined},on:{...on,pixels:undefined},
        deltaLum:on.luminance-off.luminance,meanAbsDelta:delta/count,
        maxDelta,pctChangedOver2:100*changed/count,room:w.hereRoom};
   }finally{
      for(const id of sourceIds)g.state.lit[id]=savedLit[id];
      g.changed();
      pool.forEach((l,i)=>l.intensity=prior[i]);
   }
 },{pose,source});
 if(pair.off.glError!==0||pair.on.glError!==0)
   throw Error('WebGL error at '+id+': '+JSON.stringify(pair));
 // Keep the last drawn ON frame as screenshot evidence.
 await page.screenshot({path:out+'/'+id+'.jpg',type:'jpeg',quality:82,timeout:120000});
 return pair;
}

try{
 await boot('','fehluwe.save');
 const ready=await stat();
 if(!ready.state||ready.state.length!==4||!ready.state.every(v=>v>0)||
    !ready.living?.every(v=>v>0)||!ready.scope?.chunks?.mHall||!ready.scope?.chunks?.mLib)
   throw Error('LIGHT-R08 not ON by default on actual production route: '+JSON.stringify(ready));
 const poses=[
  {id:'hall',pose:{x:89.9,z:94,y:.15,yaw:Math.PI,pitch:.19},source:'lamp.hallChandelier',min:1},
  {id:'hall-console',pose:{x:90,z:87,y:.15,yaw:-Math.PI/2,pitch:0},source:'lamp.hallConsole',min:.5},
  {id:'library',pose:{x:78,z:103.5,y:.15,yaw:Math.PI,pitch:0},source:'lamp.libraryChandelier',min:.45},
  {id:'library-desk',pose:{x:75,z:99,y:.15,yaw:-Math.PI/2,pitch:-.1},source:'lamp.library',min:0}
 ];
 for(const item of poses){
   const pair=await measurePair(item.id,item.pose,item.source);
   const idx=['lamp.hallChandelier','lamp.hallConsole','lamp.libraryChandelier','lamp.library'].indexOf(item.source);
   const dark=pair.off.states,lit=pair.on.states;
   if(!dark||!lit||dark[idx]!==0||!(lit[idx]>0))
     throw Error('No independent source-bound state for '+item.source+': '+JSON.stringify({dark,lit}));
   if(pair.meanAbsDelta<Math.min(item.min*.15,.10))
     throw Error('No visible world-surface response from '+item.source+': '+JSON.stringify(pair));
   states.push({id:item.id,source:item.source,
      signedDelta:+pair.deltaLum.toFixed(3),
      meanAbsDelta:+pair.meanAbsDelta.toFixed(3),
      changedPixelsOver2:+pair.pctChangedOver2.toFixed(2),
      calls:pair.on.calls,tris:pair.on.triangles,programs:pair.on.programs,
      sourceState:lit});
 }
 const mainSave=await page.evaluate(()=>localStorage.getItem('fehluwe.save'));
 await boot('game/','fehluwe.family.save');
 const family=await stat();
 if(!family.state?.every(v=>v>0)||!family.scope?.chunks?.mLib||
   (await page.evaluate(()=>localStorage.getItem('fehluwe.save')))!==mainSave)
   throw Error('Family lighting/default or main-save isolation broken: '+JSON.stringify(family));
 await boot('?stableRooms=0','fehluwe.save');
 const rollback=await stat();
 if(rollback.state!==null||rollback.living!==null||rollback.scope!==null)
   throw Error('Emergency rollback flag did not disable stable shader: '+JSON.stringify(rollback));
 if(issues.length||missing.length)throw Error(JSON.stringify({issues:issues.slice(0,5),missing:missing.slice(0,5)}));
 const result={quality,portrait,ready,family,rollback:{state:rollback.state,scope:rollback.scope},
    views:states,issues,missing};
 writeFileSync(out+'/results.json',JSON.stringify(result,null,2));
 console.log('LIGHT_R08_LIVE_PASS '+JSON.stringify({
  quality,portrait,normalDefault:true,familyDefault:true,
  preservedMainSave:true,rollbackWorks:true,
  sources:states,materialScope:ready.scope?.chunks,errors:issues,missing
 }));
}finally{await browser.close();}
