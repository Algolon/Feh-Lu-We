// FRONT-R04: actual in-game software WebGL screenshots and scene-budget check.
// Runs against the candidate production build on an Actions runner, no deployment.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const OUT='docs/development/workstreams/front-r04/review';
const BASE=process.env.BASE ?? 'http://127.0.0.1:4173/Feh-Lu-We/';
mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({
  executablePath:process.env.CHROME||chromium.executablePath(),
  headless:true,
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage']
});
const results=[],errors=[];
const views=[
  {name:'01-exterior-full',size:{width:1150,height:790},pose:{x:90,y:.15,z:77.70,yaw:0,pitch:0.025}},
  {name:'01b-exterior-close',size:{width:1050,height:750},pose:{x:90,y:.15,z:78.65,yaw:0,pitch:0.025}},
  {name:'02-exterior-oblique',size:{width:1050,height:750},pose:{x:89.25,y:.15,z:78.5,yaw:.33,pitch:0.015}},
  {name:'03-interior-front',size:{width:1050,height:750},pose:{x:90,y:.15,z:82.0,yaw:Math.PI,pitch:.02}},
  {name:'04-mobile-exterior',size:{width:390,height:844},pose:{x:90,y:.15,z:78.85,yaw:0,pitch:.02}},
  {name:'05-lion-detail-oblique',size:{width:1400,height:1000},pose:{x:89.80,y:.15,z:79.06,yaw:.16,pitch:.05}},
];
try{
  // FRONT-R04 QA: load the game exactly once. Six cold-start WebGL worlds
  // needlessly delayed review and caused overlapping screenshot jobs.
  const ctx=await browser.newContext({viewport:{width:1050,height:750},deviceScaleFactor:1});
  const page=await ctx.newPage();
  let currentView='startup';
  page.on('pageerror',e=>errors.push(currentView+' pageerror '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(currentView+' console '+m.text());});
  await page.goto(BASE+'?autotest=1');
  await page.evaluate(()=>localStorage.setItem('fehluwe.save',JSON.stringify({
    version:4,scene:'estate',inventory:['invitation','torch','matches','notebook','frontKey'],
    flags:{leftHome:true},unlocked:['lock.door.front'],open:{'door.front':false}
  })));
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:150000});
  for(const v of views){
    currentView=v.name;
    await page.setViewportSize(v.size);
    const metrics=await page.evaluate(pose=>{
      const g=window.__game;
      g.player.setPose(pose);
      for(let i=0;i<15;i++)g.tick(1/30); // settle camera without 75 costly software GPU frames
      g.renderer.render(g.world.scene,g.camera);
      return {
        x:g.player.x,z:g.player.z,
        calls:g.renderer.info.render.calls,
        triangles:g.renderer.info.render.triangles,
      };
    },v.pose);
    await page.waitForTimeout(350);
    await page.screenshot({path:OUT+'/'+v.name+'.jpg',type:'jpeg',quality:84});
    results.push({view:v.name,pose:v.pose,...metrics});
    console.log('FRONT_R04_VIEW',JSON.stringify(results.at(-1)));
  }
  await ctx.close();
  writeFileSync(OUT+'/results.json',JSON.stringify({source:'candidate branch in Chromium / software WebGL',results,errors},null,2));
  if(errors.length)throw Error(errors.slice(0,8).join('\n'));
}finally{await browser.close();}
