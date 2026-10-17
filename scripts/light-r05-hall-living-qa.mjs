// LIGHT-R05 diagnostic ONLY: exercise the actual hall -> living-room path
// with the production game scene and point-light pool. No game code edits.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const url = process.argv[2] ?? 'http://127.0.0.1:4188/Feh-Lu-We/';
mkdirSync('light-r05-qa',{ recursive:true });
const browser = await chromium.launch({
  headless:true,
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage']
});
const page = await browser.newPage({viewport:{width:960,height:540}, deviceScaleFactor:1});
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const SAVE={version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],lit:{'fire.living':true},flags:{leftHome:true},unlocked:[],open:{}};
const sample = async (x,z,frame,time) => page.evaluate(({x,z,frame,time})=>{
 const g=window.__game;
 // yaw -PI/2: looking west towards the lit fireplace at (72.4,86.7).
 g.player.setPose({x,y:.15,z,yaw:-Math.PI/2,pitch:-.02});
 g.tick(.05);
 const pool=g.pool, world=g.world;
 const ids=pool.assigned();
 const l=ids.indexOf('fire.living');
 return {
  x,z,frame,time:+time.toFixed(2),room:world.hereRoom,visible:[...world.visibleRooms],
  hearthVisible:world.visibleRooms.has('living'),
  flameState:g.state.lit['fire.living']??null,
  hearthLight:l<0?0:+pool.lights[l].intensity.toFixed(3),
  ids, intensity:pool.lights.map(x=>+x.intensity.toFixed(3)),
  ambient:+g.indoor.toFixed(3),gain:+pool.gain.toFixed(3)
 };
},{x,z,frame,time});
try {
 await page.goto(url+'?autotest=1',{waitUntil:'domcontentloaded'});
 await page.evaluate(save => {
  localStorage.setItem('fehluwe.save',JSON.stringify(save));
  localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low',reducedMotion:true}));
 },SAVE);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('[data-cont]').click({timeout:45000});
 await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
 await page.evaluate(()=>{
  const g=window.__game;
  g.running=false;
  g.settings.quality='low';
  g.applyQuality(true);
  g.state.lit['fire.living']=true;
  g.changed();
 });
 const table=await page.evaluate(()=>{
  const g=window.__game, p=g.world.lamps;
  return p.filter(l=>l.on()).filter(l=>['hall','living'].includes(l.room) || (l.pos.x>67&&l.pos.x<98&&l.pos.z<0)).map(l=>({id:l.id,pos:l.pos.toArray(),room:l.room??null,intensity:l.intensity,distance:l.distance})).slice(0,35);
 });
 console.log('LIGHT_R05_FIXTURES '+JSON.stringify(table));
 const rows=[];
 let time=0;
 // 0.25 m every three 50ms frames = 1.67 m/s; travel from
 // main hall to west arch into living while looking at fireplace.
 for(let x=92;x>=77;x-=.25){
  for(let frame=0;frame<3;frame++){
   rows.push(await sample(x,86.7,frame,time));
   time+=.05;
  }
  if([90,88,86,84,82,80,78].includes(x)){
   await page.evaluate(()=>{const g=window.__game;g.renderer.render(g.world.scene,g.camera);});
   await page.screenshot({path:`light-r05-qa/hall-living-${x}.jpg`,type:'jpeg',quality:72,timeout:120000});
  }
 }
 const summary=[];
 for(const r of rows)if(r.frame===2)summary.push({
  x:r.x,room:r.room,hearth:r.hearthLight,ids:r.ids,sum:+r.intensity.reduce((a,b)=>a+b,0).toFixed(2),
  livingVisible:r.hearthVisible,ambient:r.ambient
 });
 const firstLit=summary.find(x=>x.hearth>.25);
 const firstVisible=summary.find(x=>x.livingVisible);
 const late=firstLit&&firstVisible?+(firstVisible.x-firstLit.x).toFixed(2):null;
 const peakStep=rows.reduce((max,r,i)=>i?Math.max(max,Math.abs(r.intensity.reduce((a,b)=>a+b,0)-rows[i-1].intensity.reduce((a,b)=>a+b,0))):0,0);
 const result={fixtures:table,summary,firstVisible,firstLit,lateLightDistance:late,peakIntensityStep:+peakStep.toFixed(3),errors};
 console.log('LIGHT_R05_SUMMARY '+JSON.stringify(result));
 writeFileSync('light-r05-qa/trace.json',JSON.stringify({result,rows},null,2));
 if(errors.length)throw Error(errors.join(';'));
}finally{
 await page.close();
 await browser.close();
}
