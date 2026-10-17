// LIGHT-R06D opt-in browser route release gate.
// Runs against the complete Pages dist (production + isolated nested candidate).
// Rejects missing assets, wrong save scope, absent base lighting, or broken family/root.
import { chromium } from 'playwright-core';
const BASE=(process.argv[2]??'http://127.0.0.1:4188/Feh-Lu-We/').replace(/\/?$/,'/');
const REVIEW=BASE+'light-r06d/';
const browser=await chromium.launch({headless:true,args:[
 '--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist',
 '--disable-dev-shm-usage'
]});
const page=await browser.newPage({viewport:{width:915,height:412},deviceScaleFactor:1});
const errors=[],missing=[];
page.on('pageerror',e=>errors.push('page: '+e.message));
page.on('console',e=>{if(e.type()==='error')errors.push('console: '+e.text())});
page.on('response',r=>{if(r.status()>=400&&r.url().includes('/Feh-Lu-We/'))missing.push(r.status()+' '+r.url());});
const SAVE={version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],
 lit:{'fire.living':true,'lamp.livingFloor':true},flags:{leftHome:true},
 unlocked:[],open:{}};
try{
 // Same GitHub Pages origin but three separated logical save areas.
 let res=await page.goto(BASE+'?autotest=1',{waitUntil:'domcontentloaded',timeout:45000});
 if(!res?.ok())throw Error('Production root unavailable: '+res?.status());
 await page.evaluate(()=>{
   localStorage.setItem('fehluwe.save','SENTINEL_MAIN_DO_NOT_TOUCH');
   localStorage.setItem('fehluwe.family.save','SENTINEL_FAMILY_DO_NOT_TOUCH');
 });
 res=await page.goto(REVIEW+'?autotest=1',{waitUntil:'domcontentloaded',timeout:45000});
 if(!res?.ok()||!page.url().includes('/light-r06d/'))throw Error('Review URL returned no nested index');
 await page.evaluate(s=>{
   localStorage.setItem('fehluwe.light-r06d.save',JSON.stringify(s));
   localStorage.setItem('fehluwe.light-r06d.settings',JSON.stringify({quality:'low',reducedMotion:true}));
 },SAVE);
 await page.reload({waitUntil:'domcontentloaded'});
 const button=page.locator('[data-cont]');
 await button.waitFor({state:'visible',timeout:45000});
 await button.click();
 await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
 const data=await page.evaluate(()=>{
   const g=window.__game,p=g.world.scene.userData.stableLiving,sc=g.world.scene.userData.stableScope;
   const before=p?.state?.()??null;
   g.state.lit['fire.living']=false;g.state.lit['lamp.livingFloor']=true;g.changed();
   const offFire=p?.state?.()??null;
   return {
      before,offFire,scoped:sc?.totalScopedMeshes??null,materials:sc?.createdMaterialClones??null,
      poolOff:p?.noPoint??null,
      mainSave:localStorage.getItem('fehluwe.save'),
      familySave:localStorage.getItem('fehluwe.family.save'),
      reviewSaved:localStorage.getItem('fehluwe.light-r06d.save')!==null
   };
 });
 if(!data.before||data.before[0]<=0||data.before[1]<=0||data.offFire?.[0]!==0||data.offFire?.[1]<=0)
   throw Error('Light state not on by default or no independent state: '+JSON.stringify(data));
 if(!data.scoped||!data.materials||data.poolOff)throw Error('Wrong material scope / point pool mode: '+JSON.stringify(data));
 if(data.mainSave!=='SENTINEL_MAIN_DO_NOT_TOUCH'||data.familySave!=='SENTINEL_FAMILY_DO_NOT_TOUCH')
   throw Error('Review altered live or family save: '+JSON.stringify(data));
 // Explicit OFF query is useful for paired same-build comparison; it must
 // not silently run the new shader, and must share only the review namespace.
 await page.goto(REVIEW+'?autotest=1&stableLiving=0',{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('[data-cont]').click({timeout:45000});
 await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
 const control=await page.evaluate(()=>({
   stable:window.__game.world.scene.userData.stableLiving??null,
   save:localStorage.getItem('fehluwe.save'),
   family:localStorage.getItem('fehluwe.family.save')
 }));
 if(control.stable||control.save!=='SENTINEL_MAIN_DO_NOT_TOUCH'||control.family!=='SENTINEL_FAMILY_DO_NOT_TOUCH')
   throw Error('Explicit baseline off or storage isolation broken');
 const family=await page.goto(BASE+'game/?autotest=1',{waitUntil:'domcontentloaded',timeout:45000});
 if(!family?.ok())throw Error('Normal family route broken');
 if(errors.length||missing.length)throw Error(JSON.stringify({errors:errors.slice(0,5),missing:missing.slice(0,8)}));
 console.log('LIGHT_R06D_PAGES_PREVIEW_PASS '+JSON.stringify({
   url:REVIEW,sourceOnByDefault:data.before,independentOffFire:data.offFire,
   clonedMaterialCount:data.materials,scopedMeshes:data.scoped,normalPointPool:true,
   separateSaves:true,explicitBaselineOff:true,regularRootAndFamilyOk:true,errors,missing
 }));
}finally{await browser.close();}
