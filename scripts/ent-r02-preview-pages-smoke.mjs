// ENT-R02 isolated opt-in public route. Must not modify root, /game/, LIGHT-R06D or LIGHT-R08 saves.
import { chromium } from 'playwright-core';
const PREVIEW=(process.argv[2]??'http://127.0.0.1:4188/Feh-Lu-We/ent-r02/').replace(/\/?$/,'/');
const BASE=PREVIEW.replace(/ent-r02\/$/,'');
const browser=await chromium.launch({headless:true,args:[
  '--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage'
]});
const page=await browser.newPage({viewport:{width:412,height:915},deviceScaleFactor:1,isMobile:true,hasTouch:true});
const errors=[],missing=[];
page.on('pageerror',e=>errors.push('page: '+e.message));
page.on('console',e=>{if(e.type()==='error')errors.push('console: '+e.text())});
page.on('response',r=>{if(r.status()>=400&&r.url().includes('/Feh-Lu-We/'))missing.push(r.status()+' '+r.url())});
const SAVE={version:4,scene:'estate',inventory:['invitation','torch','matches','notebook','frontKey'],
  flags:{leftHome:true},unlocked:['lock.door.front'],
  open:{'door.front':true,'door.entranceHall':false}};
try{
 const main=await page.goto(BASE+'?autotest=1',{waitUntil:'domcontentloaded',timeout:45000});
 if(!main?.ok())throw Error('Root game missing');
 await page.evaluate(()=>{
   localStorage.setItem('fehluwe.save','ROOT_SENTINEL_DO_NOT_TOUCH');
   localStorage.setItem('fehluwe.family.save','FAMILY_SENTINEL_DO_NOT_TOUCH');
   localStorage.setItem('fehluwe.light-r06d.save','R06_SENTINEL_DO_NOT_TOUCH');
   localStorage.setItem('fehluwe.light-r08.save','R08_SENTINEL_DO_NOT_TOUCH');
 });
 const r=await page.goto(PREVIEW+'?autotest=1',{waitUntil:'domcontentloaded',timeout:45000});
 if(!r?.ok()||!page.url().includes('/ent-r02/'))throw Error('Preview route missing');
 await page.evaluate(s=>{
   localStorage.setItem('fehluwe.ent-r02.save',JSON.stringify(s));
   localStorage.setItem('fehluwe.ent-r02.settings',JSON.stringify({quality:'low',reducedMotion:true}));
 },SAVE);
 await page.reload({waitUntil:'domcontentloaded'});
 const start=page.locator('[data-cont]');
 await start.waitFor({state:'visible',timeout:45000});
 await start.click();
 await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
 const evidence=await page.evaluate(()=>{
   const g=window.__game,w=g.world;
   const ray=(x,y,z0,z1)=>w.col.segmentBlocked(x,y,z0,x,y,z1);
   const saves=Object.fromEntries(['fehluwe.save','fehluwe.family.save','fehluwe.light-r06d.save','fehluwe.light-r08.save']
     .map(k=>[k,localStorage.getItem(k)]));
   return {
      door:w.byId.has('door.front'), hallDoor:w.byId.has('door.entranceHall'),
      leftJamb:ray(88.8,.35,75.8,77.85),rightJamb:ray(91.2,.35,75.8,77.85),
      hallwayClosed:ray(90,1.5,83.4,84.6),
      galleryWalkFloor:w.col.supportHeight(90,78.2,3.35,.42),
      saves,reviewSave:localStorage.getItem('fehluwe.ent-r02.save')!==null,
      glError:g.renderer.getContext().getError()
   };
 });
 if(!evidence.door||!evidence.hallDoor||!evidence.leftJamb||!evidence.rightJamb||
    !evidence.hallwayClosed||Math.abs(evidence.galleryWalkFloor-3.35)>.05||
    !evidence.reviewSave||evidence.glError!==0)
   throw Error('ENT-R02 architectural or world regression: '+JSON.stringify(evidence));
 for(const [key,expected] of Object.entries({
    'fehluwe.save':'ROOT_SENTINEL_DO_NOT_TOUCH',
    'fehluwe.family.save':'FAMILY_SENTINEL_DO_NOT_TOUCH',
    'fehluwe.light-r06d.save':'R06_SENTINEL_DO_NOT_TOUCH',
    'fehluwe.light-r08.save':'R08_SENTINEL_DO_NOT_TOUCH'
 }))if(evidence.saves[key]!==expected)throw Error('Live save scope modified: '+key);
 for(const path of ['game/','light-r06d/','light-r08/']){
    const response=await page.goto(BASE+path,{waitUntil:'domcontentloaded',timeout:45000});
    if(!response?.ok())throw Error('Existing URL broken: '+path);
 }
 if(errors.length||missing.length)throw Error(JSON.stringify({errors,missing:missing.slice(0,7)}));
 console.log('ENT_R02_PUBLIC_PREVIEW_PASS '+JSON.stringify({url:PREVIEW,reviewSaveIsolated:true,rootFamilyAndLightRoutesIntact:true,evidence,errors,missing}));
}finally{await browser.close();}
