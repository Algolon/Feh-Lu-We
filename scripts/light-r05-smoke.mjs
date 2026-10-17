// LIGHT-R05 real-game smoke: settings, toggling, save-state and mobile portraits.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const url=process.argv[2]||'http://127.0.0.1:4188/Feh-Lu-We/';
const out='light-r05-qa/smoke';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,
 args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:915,height:412},deviceScaleFactor:1,hasTouch:true,isMobile:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
try {
 const save={version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],lit:{'fire.living':true},
  flags:{leftHome:true},unlocked:[],open:{}};
 await page.goto(url+'?autotest=1',{waitUntil:'domcontentloaded'});
 await page.evaluate(s=>{localStorage.setItem('fehluwe.save',JSON.stringify(s));
 localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low',reducedMotion:true}));},save);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('[data-cont]').click({timeout:45000});
 await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
 const phases=[];
 for(const [quality,viewport] of [
   ['low',{width:915,height:412}],['low',{width:412,height:915}],
   ['high',{width:915,height:412}],['high',{width:412,height:915}]
 ]) {
  await page.setViewportSize(viewport);
  const res=await page.evaluate(quality=>{
   const g=window.__game;g.running=false;
   g.settings.quality=quality;g.settings.reducedMotion=true;g.applyQuality(true);
   g.resize();g.player.setPose({x:80,y:.15,z:86.7,yaw:-Math.PI/2,pitch:0});
   for(let i=0;i<75;i++)g.tick(.05);
   g.renderer.render(g.world.scene,g.camera);
   return {slotCount:g.pool.lights.length,ids:g.pool.assigned(),calls:g.renderer.info.render.calls,
      triangles:g.renderer.info.render.triangles,room:g.world.hereRoom};
  },quality);
  const key=quality+'-'+(viewport.height>viewport.width?'portrait':'landscape');
  if(res.slotCount!==(quality==='high'?4:3))throw Error('Wrong point-light budget '+key+': '+res.slotCount);
  phases.push({key,...res});
  await page.screenshot({path:out+'/'+key+'.jpg',type:'jpeg',quality:70,timeout:120000});
 }
 const toggle=await page.evaluate(()=>{
  const g=window.__game;
  g.settings.quality='low';g.applyQuality(true);
  const fire=()=>{const i=g.pool.assigned().indexOf('fire.living');return i<0?0:g.pool.lights[i].intensity};
  g.state.lit['fire.living']=true;g.changed();
  for(let i=0;i<90;i++)g.tick(.05);
  const on=fire();
  g.state.lit['fire.living']=false;g.changed();
  for(let i=0;i<90;i++)g.tick(.05);
  const off=fire();
  g.state.lit['fire.living']=true;g.changed();
  for(let i=0;i<90;i++)g.tick(.05);
  const onAgain=fire();
  g.saveNow();
  return {on,off,onAgain,savedLit:g.state.lit['fire.living']};
 });
 if(toggle.on<1||toggle.off>.1||toggle.onAgain<1||!toggle.savedLit)
  throw Error('Logical fire state not reflected in lighting: '+JSON.stringify(toggle));
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('[data-cont]').click({timeout:45000});
 await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
 const reload=await page.evaluate(()=>({
  fire:window.__game.state.lit['fire.living'],slots:window.__game.pool.lights.length
 }));
 if(!reload.fire)throw Error('Save/reload lost fire on-state');
 const result={phases,toggle,reload,errors};
 writeFileSync(out+'/results.json',JSON.stringify(result,null,2));
 console.log('LIGHT_R05_SMOKE '+JSON.stringify(result));
 if(errors.length)throw Error(errors.join(';').slice(0,600));
}finally{await browser.close()}
