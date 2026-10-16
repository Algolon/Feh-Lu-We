// LIGHT-R03: real browser / low-budget illumination continuity across thresholds.
// Samples EVERY 50 ms, not just final lamp IDs 1 second after a threshold crossing.
import { chromium } from 'playwright-core';
import {mkdirSync,writeFileSync} from 'node:fs';
const root=process.argv[2]??'http://127.0.0.1:4188/Feh-Lu-We/';
mkdirSync('light-r03-qa',{recursive:true});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:960,height:540},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
const SAVE={version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],flags:{leftHome:true},unlocked:[],open:{}};
try {
 await page.goto(root+'?autotest=1',{waitUntil:'domcontentloaded'});
 await page.evaluate(save=>localStorage.setItem('fehluwe.save',JSON.stringify(save)),SAVE);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.click('[data-cont]',{timeout:45000});
 await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
 await page.evaluate(()=>{const g=window.__game;g.running=false;g.settings.quality='low';g.applyQuality(true)});
 const traces=[];
 const routes=[
  {id:'dining-kitchen',poses:[[101,89],[101,90],[101,91],[101,91.8],[101,91.95],[101,92.05],[101,92.2],[101,93],[101,94],[101,96],[101,98]]},
  {id:'hall-kitchen',poses:[[92.8,96],[93.4,96],[94,96],[94.5,96],[94.8,96],[94.95,96],[95.05,96],[95.2,96],[95.5,96],[96,96],[97,96]]},
 ];
 for(const route of routes) {
   let previous=null,peakStep=0;
   const trace=[];
   for(const [x,z] of route.poses) {
     for(let frame=0;frame<6;frame++) {
       const v=await page.evaluate(({x,z})=>{
        const g=window.__game;
        const yaw=Math.atan2(101-x,108-z);
        g.player.setPose({x,y:.15,z,yaw,pitch:0.02});
        g.tick(.05);
        return {x,z,room:g.world.hereRoom,ids:g.pool.assigned(),intensities:g.pool.lights.map(l=>+l.intensity.toFixed(3))};
       },{x,z});
       if(v.ids.length!==3)throw Error('Changed low/mobile light budget');
       const sum=v.intensities.reduce((a,b)=>a+b,0);
       if(previous!==null)peakStep=Math.max(peakStep,Math.abs(sum-previous));
       previous=sum;
       if(frame===5)trace.push({...v,sum:+sum.toFixed(3)});
     }
     if(route.id==='dining-kitchen'&&[91.8,92.05].includes(z)){
       await page.screenshot({path:'light-r03-qa/'+route.id+'-'+z+'.jpg',type:'jpeg',quality:82,timeout:60000});
     }
   }
   traces.push({route:route.id,peakStep:+peakStep.toFixed(3),poses:trace});
   console.log('LIGHT_R03_ROUTE '+JSON.stringify({route:route.id,peakStep,poses:trace.map(({x,z,room,ids,sum})=>({x,z,room,ids,sum}))}));
   if(peakStep>3.2)console.warn('BASELINE_LIGHT_JUMP '+peakStep+' '+route.id);
 }
 const stats=await page.evaluate(()=>{
   const g=window.__game;g.renderer.render(g.world.scene,g.camera);
   return {calls:g.renderer.info.render.calls,tris:g.renderer.info.render.triangles,
     glError:g.renderer.getContext().getError(),slots:g.pool.lights.length};
 });
 if(stats.calls>150||stats.glError!==0||stats.slots!==3)throw Error('Performance / GL / light budget '+JSON.stringify(stats));
 if(errors.length)throw Error('Browser errors '+errors.join('; '));
 console.log('LIGHT_R03_CONTINUITY_PASS '+JSON.stringify(stats));
 writeFileSync('light-r03-qa/trace.json',JSON.stringify({traces,stats},null,2));
}finally{await page.close();await browser.close();}
