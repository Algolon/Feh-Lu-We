// LIGHT-R08 isolated Pages path smoke: real WebGL, independent save namespace,
// four visible state-bound sources and the already-live R06D/family/main routes.
import { chromium } from 'playwright-core';
const BASE=(process.argv[2]??'http://127.0.0.1:4188/Feh-Lu-We/').replace(/\/?$/,'/');
const REVIEW=BASE+'light-r08/';
const browser=await chromium.launch({headless:true,args:[
 '--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist',
 '--disable-dev-shm-usage'
]});
const page=await browser.newPage({viewport:{width:915,height:412},deviceScaleFactor:1});
const errors=[],missing=[];
page.on('pageerror',e=>errors.push('page:'+e.message));
page.on('console',e=>{if(e.type()==='error')errors.push('console:'+e.text())});
page.on('response',r=>{if(r.status()>=400&&r.url().includes('/Feh-Lu-We/'))missing.push(r.status()+' '+r.url())});
const SAVE={version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],
 lit:{'fire.living':true,'lamp.livingFloor':true,
   'lamp.hallChandelier':true,'lamp.hallConsole':false,
   'lamp.libraryChandelier':true,'lamp.library':true},
 flags:{leftHome:true},unlocked:[],open:{}};
const check=(ok,msg)=>{if(!ok)throw Error(msg)};
try{
 const main=await page.goto(BASE+'?autotest=1',{waitUntil:'domcontentloaded',timeout:45000});
 check(main?.ok(),'Production root not available');
 await page.evaluate(()=>{
   localStorage.setItem('fehluwe.save','SENTINEL_MAIN');
   localStorage.setItem('fehluwe.family.save','SENTINEL_FAMILY');
   localStorage.setItem('fehluwe.light-r06d.save','SENTINEL_R06D');
 });
 const r=await page.goto(REVIEW+'?autotest=1',{waitUntil:'domcontentloaded',timeout:45000});
 check(r?.ok()&&page.url().includes('/light-r08/'),'LIGHT-R08 nested index missing');
 await page.evaluate(s=>{
   localStorage.setItem('fehluwe.light-r08.save',JSON.stringify(s));
   localStorage.setItem('fehluwe.light-r08.settings',JSON.stringify({quality:'low',reducedMotion:true}));
 },SAVE);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('[data-cont]').click({timeout:45000});
 await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
 const lights=await page.evaluate(()=>{
   const g=window.__game,sc=g.world.scene.userData.stableScope,
      r=g.world.scene.userData.stableRooms,l=g.world.scene.userData.stableLiving;
   const before=r?.state?.()??null;
   const living=l?.state?.()??null;
   g.state.lit['lamp.hallChandelier']=false;
   g.state.lit['lamp.hallConsole']=true;
   g.changed();
   const independent=r?.state?.()??null;
   return {before,living,independent,
     scope:sc?.chunks??null,
     poolAssigned:g.pool.assigned?.()??null,
     saves:['fehluwe.save','fehluwe.family.save','fehluwe.light-r06d.save','fehluwe.light-r08.save']
       .map(k=>[k,localStorage.getItem(k)])
   };
 });
 check(lights.before?.length===4&&lights.before[0]>.01&&lights.before[1]===0&&
   lights.before[2]>.01&&lights.before[3]>.01,
  'Review room fixture sources are not ON by default according to game state: '+JSON.stringify(lights));
 check(lights.living?.length===2&&lights.living.every(x=>x>.01),
  'Approved living pilot missing in LIGHT-R08');
 check(lights.independent[0]===0&&lights.independent[1]>.01,
  'Hall sources do not switch independently');
 check(lights.scope?.mHall>0&&lights.scope?.mLib>0,'Scoped hall/library materials missing');
 check(lights.saves[0][1]==='SENTINEL_MAIN'&&lights.saves[1][1]==='SENTINEL_FAMILY'&&
   lights.saves[2][1]==='SENTINEL_R06D'&&!!lights.saves[3][1],
   'Review route read or overwrote a real/family/R06D save: '+JSON.stringify(lights.saves));

 // Same-build AB mode: explicit OFF removes BOTH R06D and new room light
 // without changing the review save namespace.
 await page.goto(REVIEW+'?autotest=1&stableRooms=0',{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('[data-cont]').click({timeout:45000});
 await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
 const off=await page.evaluate(()=>({
   living:window.__game.world.scene.userData.stableLiving??null,
   rooms:window.__game.world.scene.userData.stableRooms??null
 }));
 check(off.living===null&&off.rooms===null,'R08 explicit OFF baseline still uses stable light shader');
 const r06=await page.goto(BASE+'light-r06d/?autotest=1',{waitUntil:'domcontentloaded',timeout:45000});
 check(r06?.ok(),'Existing R06D review route has disappeared');
 const family=await page.goto(BASE+'game/?autotest=1',{waitUntil:'domcontentloaded',timeout:45000});
 check(family?.ok(),'Existing family route has disappeared');
 check(errors.length===0&&missing.length===0,'Browser WebGL/errors: '+JSON.stringify({errors:errors.slice(0,4),missing:missing.slice(0,4)}));
 console.log('LIGHT_R08_PAGES_PASS '+JSON.stringify({
   url:REVIEW,sourceWeights:lights.before,sourceSwitch:lights.independent,scope:lights.scope,
   independentSaves:true,oldReviewPreserved:true,fullAndFamilyPreserved:true,
   explicitBaselineOff:true,errors,missing
 }));
}finally{await browser.close();}
