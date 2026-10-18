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
async function sample(id,pose,source,active){
 const reading=await page.evaluate(({pose,source,active})=>{
   const g=window.__game,w=g.world;
   for(const id of ['lamp.hallChandelier','lamp.hallConsole','lamp.libraryChandelier','lamp.library'])
     g.state.lit[id]=id===source?active:false;
   g.changed();
   g.player.setPose({...pose,pitch:pose.pitch??0});
   g.player.applyCamera(g.camera);
   w.updateCulling(g.camera.position,g.camera);
   for(let n=0;n<4;n++)g.tick(.05);
   const lights=g.pool.lights;
   const original=lights.map(l=>l.intensity);
   lights.forEach(l=>l.intensity=0);
   const renderer=g.renderer,gl=renderer.getContext();
   try{
     renderer.render(w.scene,g.camera);
     const W=gl.drawingBufferWidth,H=gl.drawingBufferHeight;
     const rgb=new Uint8Array(W*H*4);gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,rgb);
     let value=0,count=0;
     for(let y=Math.floor(H*.22);y<Math.floor(H*.78);y++)
       for(let x=Math.floor(W*.22);x<Math.floor(W*.78);x++){
         const a=(y*W+x)*4;
         value+=rgb[a]*.2126+rgb[a+1]*.7152+rgb[a+2]*.0722;count++;
       }
     return {luminance:value/count,room:w.hereRoom,
       states:w.scene.userData.stableRooms?.state?.(),
       calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,
       programs:renderer.info.programs?.length??null,glError:gl.getError()};
   }finally{lights.forEach((l,i)=>l.intensity=original[i]);}
 },{pose,source,active});
 if(reading.glError!==0)throw Error('WebGL error at '+id+': '+reading.glError);
 if(active)await page.screenshot({path:out+'/'+id+'.jpg',type:'jpeg',quality:82,timeout:120000});
 return reading;
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
  {id:'library-desk',pose:{x:75,z:99,y:.15,yaw:Math.PI/2,pitch:0},source:'lamp.library',min:0}
 ];
 for(const item of poses){
   const off=await sample(item.id+'-off',item.pose,item.source,false);
   const on=await sample(item.id+'-on',item.pose,item.source,true);
   const diff=on.luminance-off.luminance;
   if(diff<item.min)throw Error('No independent stable light from '+item.source+': '+diff);
   states.push({id:item.id,source:item.source,delta:+diff.toFixed(3),
      calls:on.calls,tris:on.triangles,programs:on.programs,
      sourceState:on.states});
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
